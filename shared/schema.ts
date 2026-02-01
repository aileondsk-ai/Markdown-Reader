import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Import Auth and Chat models from blueprints
export * from "./models/auth";
export * from "./models/chat";

import { users } from "./models/auth";

// === STYLE IDENTITY TYPE (SIT) ===
export const sitResults = pgTable("sit_results", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  sitType: text("sit_type").notNull(), // e.g., "IWSM"
  scores: jsonb("scores").notNull(), // { I: 60, W: 70, S: 40, M: 80 }
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSitResultSchema = createInsertSchema(sitResults).omit({ 
  id: true, 
  createdAt: true 
});

// === FASHION EVALUATION ===
export const assessments = pgTable("assessments", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  imageUrl: text("image_url").notNull(),
  persona: text("persona").notNull(), // "sujin", "minsu", "jihyun"
  scores: jsonb("scores").notNull(), // { harmony: 8, trend: 7, body: 9 }
  feedback: text("feedback").notNull(), // Markdown formatted analysis
  isFavorite: boolean("is_favorite").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAssessmentSchema = createInsertSchema(assessments).omit({ 
  id: true, 
  createdAt: true 
});

// === RELATIONS ===
export const sitResultsRelations = relations(sitResults, ({ one }) => ({
  user: one(users, {
    fields: [sitResults.userId],
    references: [users.id],
  }),
}));

export const assessmentsRelations = relations(assessments, ({ one }) => ({
  user: one(users, {
    fields: [assessments.userId],
    references: [users.id],
  }),
}));

// === TYPES ===
export type SitResult = typeof sitResults.$inferSelect;
export type InsertSitResult = z.infer<typeof insertSitResultSchema>;

export type Assessment = typeof assessments.$inferSelect;
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;

// Request types
export type SubmitSitRequest = {
  answers: Record<string, string>; // { q1: "A", q2: "B" ... }
};

export type CreateAssessmentRequest = {
  imageUrl: string; // Base64 or URL
  persona: string;
};

// Response types
export type SitResponse = SitResult & {
  typeDescription: string;
  keywords: string[];
};

export type AssessmentResponse = Assessment;
