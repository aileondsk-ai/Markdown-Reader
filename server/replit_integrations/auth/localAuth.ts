/**
 * Local / Vercel Development Auth
 *
 * Bypasses Replit Auth for environments without REPL_ID.
 * Uses pg session store when DATABASE_URL is available (required for serverless).
 */
import session from "express-session";
import connectPg from "connect-pg-simple";
import type { Express, RequestHandler } from "express";
import { authStorage } from "./storage";

const MOCK_USER = {
    id: "local-dev-user-001",
    email: "dev@localhost",
    firstName: "Local",
    lastName: "Developer",
    profileImageUrl: null,
    claims: {
        sub: "local-dev-user-001",
        email: "dev@localhost",
        first_name: "Local",
        last_name: "Developer",
    },
    access_token: "mock-access-token",
    refresh_token: "mock-refresh-token",
    expires_at: Math.floor(Date.now() / 1000) + 86400 * 7,
};

export function getSession() {
    const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
    const isProduction = process.env.NODE_ENV === "production" || !!process.env.VERCEL;

    let store: session.Store | undefined;
    if (process.env.DATABASE_URL) {
        const PgStore = connectPg(session);
        store = new PgStore({
            conString: process.env.DATABASE_URL,
            createTableIfMissing: true,
            ttl: sessionTtl / 1000,
            tableName: "sessions",
        });
    }

    return session({
        secret: process.env.SESSION_SECRET || "local-dev-secret-key",
        store,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" as const : "lax" as const,
            maxAge: sessionTtl,
        },
    });
}

export async function setupAuth(app: Express) {
    app.set("trust proxy", 1);
    app.use(getSession());

    app.use((req: any, res, next) => {
        if (req.session.user) {
            req.user = req.session.user;
            req.isAuthenticated = () => true;
        } else {
            req.isAuthenticated = () => false;
        }
        next();
    });

    console.log("🔓 Mock Auth enabled for local development");
}

export function registerAuthRoutes(app: Express) {
    app.get("/api/login", async (req: any, res) => {
        req.session.user = MOCK_USER;

        await authStorage.upsertUser({
            id: MOCK_USER.claims.sub,
            email: MOCK_USER.claims.email,
            firstName: MOCK_USER.claims.first_name,
            lastName: MOCK_USER.claims.last_name,
            profileImageUrl: MOCK_USER.profileImageUrl!,
        });

        console.log("📝 Mock user logged in and seeded to DB:", MOCK_USER.email);
        res.redirect("/");
    });

    app.get("/api/callback", (req, res) => {
        res.redirect("/");
    });

    app.get("/api/logout", (req: any, res) => {
        req.session.destroy((err: any) => {
            if (err) console.error("Session destroy error:", err);
            res.redirect("/");
        });
    });

    app.get("/api/auth/user", (req: any, res) => {
        if (req.isAuthenticated()) {
            const user = req.session.user;
            res.json({
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                profileImageUrl: user.profileImageUrl,
            });
        } else {
            res.status(401).json({ message: "Not authenticated" });
        }
    });
}

export const isAuthenticated: RequestHandler = async (req: any, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    return res.status(401).json({ message: "Unauthorized" });
};
