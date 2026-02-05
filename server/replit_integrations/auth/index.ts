import * as replitAuth from "./replitAuth";
import * as localAuth from "./localAuth";
import * as authRoutes from "./routes";

// Conditionally use local auth for development or Replit auth for production
const isLocalDev = !process.env.REPL_ID;

if (isLocalDev) {
    console.log("🏠 Local development mode detected - using mock auth");
}

export const setupAuth = isLocalDev ? localAuth.setupAuth : replitAuth.setupAuth;
export const isAuthenticated = isLocalDev ? localAuth.isAuthenticated : replitAuth.isAuthenticated;
export const getSession = isLocalDev ? localAuth.getSession : replitAuth.getSession;
export const registerAuthRoutes = isLocalDev ? localAuth.registerAuthRoutes : authRoutes.registerAuthRoutes;

export { authStorage, type IAuthStorage } from "./storage";
