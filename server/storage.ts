import { db } from "./db";
import { 
  sitResults, assessments, users,
  type InsertSitResult, type SitResult,
  type InsertAssessment, type Assessment,
  type User
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // SIT Results
  createSitResult(result: InsertSitResult): Promise<SitResult>;
  getLatestSitResult(userId: string): Promise<SitResult | undefined>;
  
  // Assessments
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  getAssessments(userId: string): Promise<Assessment[]>;
  getAssessment(id: number): Promise<Assessment | undefined>;
  
  // Users (helper)
  getUser(id: string): Promise<User | undefined>;
}

export class DatabaseStorage implements IStorage {
  async createSitResult(result: InsertSitResult): Promise<SitResult> {
    const [saved] = await db.insert(sitResults).values(result).returning();
    return saved;
  }

  async getLatestSitResult(userId: string): Promise<SitResult | undefined> {
    const [result] = await db
      .select()
      .from(sitResults)
      .where(eq(sitResults.userId, userId))
      .orderBy(desc(sitResults.createdAt))
      .limit(1);
    return result;
  }

  async createAssessment(assessment: InsertAssessment): Promise<Assessment> {
    const [saved] = await db.insert(assessments).values(assessment).returning();
    return saved;
  }

  async getAssessments(userId: string): Promise<Assessment[]> {
    return db
      .select()
      .from(assessments)
      .where(eq(assessments.userId, userId))
      .orderBy(desc(assessments.createdAt));
  }

  async getAssessment(id: number): Promise<Assessment | undefined> {
    const [result] = await db
      .select()
      .from(assessments)
      .where(eq(assessments.id, id));
    return result;
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
}

export const storage = new DatabaseStorage();
