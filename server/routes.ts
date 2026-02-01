import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { openai } from "./replit_integrations/image/client"; // Re-use OpenAI client from integration

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Auth FIRST
  await setupAuth(app);
  registerAuthRoutes(app);

  // === SIT API ===
  app.post(api.sit.submit.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Mock SIT calculation logic
    // In reality, this would be a complex algorithm based on answers
    // For MVP, we randomly assign or use a simple heuristic
    // Let's pretend we calculated it:
    
    // Random SIT type for demo if logic not fully implemented yet
    const types = ["IWSM", "IWSB", "IWNM", "IWNB", "ICSM", "ICSB", "ICNM", "ICNB", 
                   "EWSM", "EWSB", "EWNM", "EWNB", "ECSM", "ECSB", "ECNM", "ECNB"];
    const randomType = types[Math.floor(Math.random() * types.length)];
    
    const scores = {
      I: Math.floor(Math.random() * 100),
      W: Math.floor(Math.random() * 100),
      S: Math.floor(Math.random() * 100),
      M: Math.floor(Math.random() * 100),
    };

    const result = await storage.createSitResult({
      userId: (req.user as any).claims.sub,
      sitType: randomType,
      scores: scores,
    });

    res.status(201).json(result);
  });

  app.get(api.sit.latest.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const result = await storage.getLatestSitResult((req.user as any).claims.sub);
    res.json(result || null);
  });

  // === ASSESSMENT API ===
  app.post(api.assessments.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const { image, persona } = api.assessments.create.input.parse(req.body);
      const userId = (req.user as any).claims.sub;

      // Call OpenAI Vision
      const prompt = `
        You are ${persona === 'sujin' ? 'Sujin, a fashion magazine editor' : 
                   persona === 'minsu' ? 'Minsu, a street photographer' : 
                   'Jihyun, a celebrity stylist'}.
        
        Analyze this outfit.
        Output MUST be valid JSON with this structure:
        {
          "scores": { "harmony": number (1-10), "trend": number (1-10), "body": number (1-10) },
          "feedback": "markdown string with title, pros, cons, and tips"
        }
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-5.2", // Use best model for vision
        messages: [
          { role: "system", content: "You are a helpful fashion assistant." },
          { 
            role: "user", 
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: image } } // Base64 data URL expected
            ] 
          }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 1000,
      });

      const content = response.choices[0].message.content;
      if (!content) throw new Error("No response from AI");

      const aiData = JSON.parse(content);

      const assessment = await storage.createAssessment({
        userId,
        imageUrl: image, // In production, upload to object storage and save URL. For MVP, base64 (beware size limits)
        // Note: Base64 in DB is bad practice for large scale, but acceptable for MVP with small users.
        // Better: Use Object Storage integration if available.
        persona,
        scores: aiData.scores,
        feedback: aiData.feedback,
      });

      res.status(201).json(assessment);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to analyze image" });
    }
  });

  app.get(api.assessments.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const list = await storage.getAssessments((req.user as any).claims.sub);
    res.json(list);
  });

  app.get(api.assessments.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const item = await storage.getAssessment(Number(req.params.id));
    if (!item) return res.status(404).json({ message: "Not found" });
    if (item.userId !== (req.user as any).claims.sub) return res.sendStatus(403);
    res.json(item);
  });

  return httpServer;
}
