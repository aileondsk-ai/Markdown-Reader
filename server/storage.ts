import { db } from "./db";
import { 
  sitResults, assessments, users,
  type InsertSitResult, type SitResult,
  type InsertAssessment, type Assessment,
  type User
} from "@shared/schema";
import { eq, desc, and, gte, lt, sql } from "drizzle-orm";

export interface IStorage {
  // SIT Results
  createSitResult(result: InsertSitResult): Promise<SitResult>;
  getLatestSitResult(userId: string): Promise<SitResult | undefined>;
  
  // Assessments
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  getAssessments(userId: string): Promise<Assessment[]>;
  getAssessment(id: number): Promise<Assessment | undefined>;
  getAssessmentsByMonth(userId: string, year: number, month: number): Promise<Assessment[]>;
  toggleFavorite(id: number): Promise<Assessment | undefined>;
  getAssessmentStats(userId: string): Promise<{
    totalCount: number;
    averageScores: { harmony: number; trend: number; body: number };
    favoriteCount: number;
    monthlyCount: number;
  }>;
  
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
    if (typeof id !== 'number' || isNaN(id)) {
      return undefined;
    }
    const [result] = await db
      .select()
      .from(assessments)
      .where(eq(assessments.id, id));
    return result;
  }

  async getAssessmentsByMonth(userId: string, year: number, month: number): Promise<Assessment[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);
    
    return db
      .select()
      .from(assessments)
      .where(
        and(
          eq(assessments.userId, userId),
          gte(assessments.createdAt, startDate),
          lt(assessments.createdAt, endDate)
        )
      )
      .orderBy(desc(assessments.createdAt));
  }

  async toggleFavorite(id: number): Promise<Assessment | undefined> {
    const [current] = await db
      .select()
      .from(assessments)
      .where(eq(assessments.id, id));
    
    if (!current) return undefined;

    const [updated] = await db
      .update(assessments)
      .set({ isFavorite: !current.isFavorite })
      .where(eq(assessments.id, id))
      .returning();
    
    return updated;
  }

  async getAssessmentStats(userId: string): Promise<{
    totalCount: number;
    averageScores: { harmony: number; trend: number; body: number };
    favoriteCount: number;
    monthlyCount: number;
  }> {
    const allAssessments = await this.getAssessments(userId);
    
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const monthlyAssessments = allAssessments.filter(
      a => a.createdAt && new Date(a.createdAt) >= monthStart
    );

    const totalCount = allAssessments.length;
    const favoriteCount = allAssessments.filter(a => a.isFavorite).length;
    const monthlyCount = monthlyAssessments.length;

    if (totalCount === 0) {
      return {
        totalCount: 0,
        averageScores: { harmony: 0, trend: 0, body: 0 },
        favoriteCount: 0,
        monthlyCount: 0,
      };
    }

    const scores = allAssessments.map(a => {
      const s = a.scores as { harmony?: number; trend?: number; body?: number } | null;
      return {
        harmony: typeof s?.harmony === 'number' && !isNaN(s.harmony) ? s.harmony : 0,
        trend: typeof s?.trend === 'number' && !isNaN(s.trend) ? s.trend : 0,
        body: typeof s?.body === 'number' && !isNaN(s.body) ? s.body : 0,
      };
    });
    
    const sumHarmony = scores.reduce((sum, s) => sum + s.harmony, 0);
    const sumTrend = scores.reduce((sum, s) => sum + s.trend, 0);
    const sumBody = scores.reduce((sum, s) => sum + s.body, 0);
    
    const averageScores = {
      harmony: Math.round((sumHarmony / totalCount) * 10) / 10 || 0,
      trend: Math.round((sumTrend / totalCount) * 10) / 10 || 0,
      body: Math.round((sumBody / totalCount) * 10) / 10 || 0,
    };

    return { totalCount, averageScores, favoriteCount, monthlyCount };
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
}

export const storage = new DatabaseStorage();
