import { db } from "./db";
import { 
  sitResults, assessments, users, conversations, messages, recommendations,
  type InsertSitResult, type SitResult,
  type InsertAssessment, type Assessment,
  type User, type Conversation, type Message, type InsertConversation, type InsertMessage,
  type Recommendation, type InsertRecommendation
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
  
  // Recommendations
  createRecommendation(recommendation: InsertRecommendation): Promise<Recommendation>;
  getRecommendations(userId: string): Promise<Recommendation[]>;
  getRecommendation(id: number): Promise<Recommendation | undefined>;
  toggleRecommendationFavorite(id: number): Promise<Recommendation | undefined>;
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

  // Chat Conversations
  async createConversation(userId: string, persona: string, title: string): Promise<Conversation> {
    const [conversation] = await db
      .insert(conversations)
      .values({ userId, persona, title })
      .returning();
    return conversation;
  }

  async getConversations(userId: string): Promise<Conversation[]> {
    return db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.createdAt));
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));
    return conversation;
  }

  async deleteConversation(id: number): Promise<boolean> {
    const result = await db
      .delete(conversations)
      .where(eq(conversations.id, id))
      .returning();
    return result.length > 0;
  }

  // Messages
  async createMessage(conversationId: number, role: string, content: string): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values({ conversationId, role, content })
      .returning();
    return message;
  }

  async getMessages(conversationId: number): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  // Recommendations
  async createRecommendation(recommendation: InsertRecommendation): Promise<Recommendation> {
    const [saved] = await db.insert(recommendations).values(recommendation).returning();
    return saved;
  }

  async getRecommendations(userId: string): Promise<Recommendation[]> {
    return db
      .select()
      .from(recommendations)
      .where(eq(recommendations.userId, userId))
      .orderBy(desc(recommendations.createdAt));
  }

  async getRecommendation(id: number): Promise<Recommendation | undefined> {
    if (typeof id !== 'number' || isNaN(id)) {
      return undefined;
    }
    const [result] = await db
      .select()
      .from(recommendations)
      .where(eq(recommendations.id, id));
    return result;
  }

  async toggleRecommendationFavorite(id: number): Promise<Recommendation | undefined> {
    const rec = await this.getRecommendation(id);
    if (!rec) return undefined;
    
    const [updated] = await db
      .update(recommendations)
      .set({ isFavorite: !rec.isFavorite })
      .where(eq(recommendations.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
