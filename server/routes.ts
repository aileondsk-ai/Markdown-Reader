import type { Express, Response } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { OCCASION_NAMES, SEASON_NAMES } from "@shared/constants/occasion";
import { PERSONA_PROMPTS } from "./prompts/persona";
import {
  buildRecommendationPrompt,
  RECOMMENDATION_SYSTEM_PROMPT,
} from "./prompts/recommendation";
import { CHAT_PERSONA_PROMPTS } from "./prompts/chat";
import { getMockProductsByCategory } from "./mock-products";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { openai } from "./replit_integrations/image/client";
import pLimit from "p-limit";

/** 모니터링용: 에러 시 메서드·경로·메시지 로깅 (민감 정보 제외) */
function logRouteError(req: { method: string; path: string }, err: unknown, label: string) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`[${req.method}] ${req.path} ${label}:`, msg);
}

/** 인증 필요 API 401 응답 통일 (JSON 본문) */
function sendUnauthorized(res: Response) {
  return res.status(401).json({ error: "Unauthorized", message: "로그인이 필요합니다" });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Auth FIRST
  await setupAuth(app);
  registerAuthRoutes(app);

  // 헬스 체크 (인증 불필요, 배포·E2E용). DB 연결 확인 포함
  app.get("/api/health", async (_req, res) => {
    try {
      await db.execute(sql`SELECT 1`);
      return res.status(200).json({ ok: true, db: "ok" });
    } catch (err) {
      logRouteError({ method: "GET", path: "/api/health" }, err, "Health");
      return res.status(503).json({ ok: false, db: "error" });
    }
  });

  // === SIT API ===
  app.post(api.sit.submit.path, async (req, res) => {
    if (!req.isAuthenticated()) return sendUnauthorized(res);
    
    try {
      const validatedData = api.sit.submit.input.parse(req.body);
      const { calculatedType, scores } = validatedData;
      
      // 유효한 SIT 타입 검증
      const validTypes = ["IWSM", "IWSB", "IWNM", "IWNB", "ICSM", "ICSB", "ICNM", "ICNB", 
                          "EWSM", "EWSB", "EWNM", "EWNB", "ECSM", "ECSB", "ECNM", "ECNB"];
      
      const sitType = validTypes.includes(calculatedType) ? calculatedType : "EWSM";

      const result = await storage.createSitResult({
        userId: (req.user as any).claims.sub,
        sitType: sitType,
        scores: scores,
      });

      res.status(201).json(result);
    } catch (err: any) {
      if (err.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid input data", field: err.errors?.[0]?.path?.join('.') });
      }
      throw err;
    }
  });

  app.get(api.sit.latest.path, async (req, res) => {
    if (!req.isAuthenticated()) return sendUnauthorized(res);
    const result = await storage.getLatestSitResult((req.user as any).claims.sub);
    res.json(result || null);
  });

  // === ASSESSMENT API ===
  app.post(api.assessments.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return sendUnauthorized(res);

    try {
      const { image, persona } = api.assessments.create.input.parse(req.body);
      const userId = (req.user as any).claims.sub;
      const personaInfo = PERSONA_PROMPTS[persona];

      const prompt = `
당신은 "${personaInfo.name}" 입니다.
역할: ${personaInfo.role}
말투: ${personaInfo.tone}

## 평가 기준
${personaInfo.focus.map((f, i) => `${i + 1}. ${f}`).join('\n')}

## 점수 기준 (1-10점)
- harmony (조화): ${personaInfo.scoring.harmony}
- trend (트렌드): ${personaInfo.scoring.trend}
- body (체형): ${personaInfo.scoring.body}

## 피드백 스타일
${personaInfo.style}

## 출력 형식
반드시 아래 JSON 구조로 응답하세요:
{
  "scores": { "harmony": number, "trend": number, "body": number },
  "feedback": "제목\\n\\n## 좋은 점\\n- 포인트1\\n- 포인트2\\n\\n## 아쉬운 점\\n- 포인트1\\n\\n## 스타일링 팁\\n- 구체적 조언"
}

착장 사진을 분석하고 ${personaInfo.name}의 관점에서 상세하게 평가해주세요. 모든 피드백은 한국어로 작성합니다.
      `;

      let content: string;
      if (process.env.GEMINI_API_KEY) {
        const { geminiGenerateWithImage } = await import("./gemini-client");
        content = await geminiGenerateWithImage({
          systemInstruction: "You are a helpful fashion assistant. Respond only with valid JSON.",
          userMessage: prompt,
          imageDataUrlOrBase64: image,
          maxOutputTokens: 2048,
          responseMimeType: "application/json",
        });
      } else {
        const response = await openai.chat.completions.create({
          model: process.env.OPENAI_VISION_MODEL || "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are a helpful fashion assistant." },
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: image } },
              ],
            },
          ],
          response_format: { type: "json_object" },
          max_completion_tokens: 1000,
        });
        content = response.choices[0]?.message?.content ?? "";
      }

      if (!content) throw new Error("No response from AI");

      const stripCodeBlock = (s: string) =>
        s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      let raw = stripCodeBlock(content);
      const firstBrace = raw.indexOf("{");
      if (firstBrace !== -1) {
        const lastBrace = raw.lastIndexOf("}");
        if (lastBrace > firstBrace) raw = raw.slice(firstBrace, lastBrace + 1);
      }
      const relaxed = raw.replace(/,(\s*[}\]])/g, "$1");
      let aiData: { scores?: { harmony: number; trend: number; body: number }; feedback?: string };
      try {
        aiData = JSON.parse(relaxed);
      } catch (parseErr) {
        try {
          aiData = JSON.parse(raw);
        } catch {
          const detail = (parseErr instanceof Error ? parseErr.message : String(parseErr)) + " | raw: " + raw.slice(0, 200);
          logRouteError(req, parseErr as Error, "AssessmentParse");
          return res.status(500).json({ message: "평가 생성에 실패했습니다", detail });
        }
      }
      if (!aiData?.scores || typeof aiData.feedback !== "string") {
        return res.status(500).json({
          message: "평가 생성에 실패했습니다",
          detail: "응답에 scores 또는 feedback이 없습니다. raw: " + raw.slice(0, 150),
        });
      }

      const assessment = await storage.createAssessment({
        userId,
        imageUrl: image,
        persona,
        scores: aiData.scores,
        feedback: aiData.feedback,
      });

      res.status(201).json(assessment);
    } catch (err) {
      logRouteError(req, err, "Assessment");
      const detail = err instanceof Error ? err.message : String(err);
      res.status(500).json({ message: "평가 생성에 실패했습니다", detail });
    }
  });

  app.get(api.assessments.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return sendUnauthorized(res);
    const list = await storage.getAssessments((req.user as any).claims.sub);
    res.json(list);
  });

  // 고정 경로 먼저 등록 (:id에 "stats"가 매칭되지 않도록)
  app.get(api.assessments.stats.path, async (req, res) => {
    if (!req.isAuthenticated()) return sendUnauthorized(res);
    try {
      const stats = await storage.getAssessmentStats((req.user as any).claims.sub);
      res.json(stats);
    } catch (error) {
      logRouteError(req, error, "Stats");
      res.json({
        totalCount: 0,
        averageScores: { harmony: 0, trend: 0, body: 0 },
        favoriteCount: 0,
        monthlyCount: 0,
      });
    }
  });

  app.get(api.assessments.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return sendUnauthorized(res);
    const item = await storage.getAssessment(Number(req.params.id));
    if (!item) return res.status(404).json({ message: "Not found" });
    if (item.userId !== (req.user as any).claims.sub) return res.sendStatus(403);
    res.json(item);
  });

  // === ASSESSMENT HISTORY API ===
  app.patch(api.assessments.toggleFavorite.path, async (req, res) => {
    if (!req.isAuthenticated()) return sendUnauthorized(res);
    const id = Number(req.params.id);
    const item = await storage.getAssessment(id);
    if (!item) return res.status(404).json({ message: "Not found" });
    if (item.userId !== (req.user as any).claims.sub) return res.sendStatus(403);
    
    const updated = await storage.toggleFavorite(id);
    res.json(updated);
  });

  app.get(api.assessments.getByMonth.path, async (req, res) => {
    if (!req.isAuthenticated()) return sendUnauthorized(res);
    const year = Number(req.params.year);
    const month = Number(req.params.month);
    
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return res.status(400).json({ message: "Invalid year or month" });
    }
    
    const list = await storage.getAssessmentsByMonth(
      (req.user as any).claims.sub, 
      year, 
      month
    );
    res.json(list);
  });

  // === BATCH ASSESSMENT API (다중 이미지 분석) ===
  app.post(api.assessments.createBatch.path, async (req, res) => {
    if (!req.isAuthenticated()) return sendUnauthorized(res);

    try {
      const { images, persona } = api.assessments.createBatch.input.parse(req.body);
      const userId = (req.user as any).claims.sub;
      const personaInfo = PERSONA_PROMPTS[persona];

      // 개별 이미지 분석 (동시성 제한: 3개씩)
      const limit = pLimit(3);
      const individualResults = await Promise.all(images.map((image, index) => limit(async () => {
        const prompt = `
당신은 "${personaInfo.name}" 입니다.
역할: ${personaInfo.role}
말투: ${personaInfo.tone}

## 착장 #${index + 1} 분석

## 평가 기준
${personaInfo.focus.map((f, i) => `${i + 1}. ${f}`).join('\n')}

## 점수 기준 (1-10점)
- harmony (조화): ${personaInfo.scoring.harmony}
- trend (트렌드): ${personaInfo.scoring.trend}
- body (체형): ${personaInfo.scoring.body}

## 피드백 스타일
${personaInfo.style}

## 출력 형식
반드시 아래 JSON 구조로 응답하세요:
{
  "scores": { "harmony": number, "trend": number, "body": number },
  "feedback": "## 착장 #${index + 1} 분석\\n\\n### 좋은 점\\n- 포인트\\n\\n### 아쉬운 점\\n- 포인트\\n\\n### 팁\\n- 조언"
}

착장 사진을 ${personaInfo.name}의 관점에서 간결하게 평가해주세요. 모든 피드백은 한국어로 작성합니다.
        `;

        let content: string;
        if (process.env.GEMINI_API_KEY) {
          const { geminiGenerateWithImage } = await import("./gemini-client");
          content = await geminiGenerateWithImage({
            systemInstruction: "You are a helpful fashion assistant. Respond only with valid JSON.",
            userMessage: prompt,
            imageDataUrlOrBase64: image,
            maxOutputTokens: 2048,
            responseMimeType: "application/json",
          });
        } else {
          const response = await openai.chat.completions.create({
            model: process.env.OPENAI_VISION_MODEL || "gpt-4o-mini",
            messages: [
              { role: "system", content: "You are a helpful fashion assistant." },
              {
                role: "user",
                content: [
                  { type: "text", text: prompt },
                  { type: "image_url", image_url: { url: image } },
                ],
              },
            ],
            response_format: { type: "json_object" },
            max_completion_tokens: 1000,
          });
          content = response.choices[0]?.message?.content ?? "";
        }

        if (!content) throw new Error("No response from AI");

        const stripCodeBlock = (s: string) =>
          s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
        let raw = stripCodeBlock(content);
        const firstBrace = raw.indexOf("{");
        if (firstBrace !== -1) {
          const lastBrace = raw.lastIndexOf("}");
          if (lastBrace > firstBrace) raw = raw.slice(firstBrace, lastBrace + 1);
        }
        const relaxed = raw.replace(/,(\s*[}\]])/g, "$1");
        let aiData: { scores?: { harmony: number; trend: number; body: number }; feedback?: string };
        try {
          aiData = JSON.parse(relaxed);
        } catch {
          try {
            aiData = JSON.parse(raw);
          } catch {
            aiData = { scores: { harmony: 5, trend: 5, body: 5 }, feedback: "이 이미지의 분석 결과를 파싱하지 못했습니다." };
          }
        }
        const assessment = await storage.createAssessment({
          userId,
          imageUrl: image,
          persona,
          scores: aiData.scores ?? { harmony: 5, trend: 5, body: 5 },
          feedback: typeof aiData.feedback === "string" ? aiData.feedback : "분석 결과를 생성하지 못했습니다.",
        });

        return assessment;
      })));

      // 종합 분석 생성
      const allScores = individualResults.map(r => r.scores as { harmony: number; trend: number; body: number });
      const overallScores = {
        harmony: Math.round(allScores.reduce((sum, s) => sum + s.harmony, 0) / allScores.length * 10) / 10,
        trend: Math.round(allScores.reduce((sum, s) => sum + s.trend, 0) / allScores.length * 10) / 10,
        body: Math.round(allScores.reduce((sum, s) => sum + s.body, 0) / allScores.length * 10) / 10,
      };

      // 종합 피드백 생성
      const summaryPrompt = `
당신은 "${personaInfo.name}" 입니다.
역할: ${personaInfo.role}
말투: ${personaInfo.tone}

${images.length}장의 착장을 분석한 결과입니다.
개별 점수: ${JSON.stringify(allScores)}
평균 점수: 조화 ${overallScores.harmony}/10, 트렌드 ${overallScores.trend}/10, 체형 ${overallScores.body}/10

## 종합 피드백 작성 가이드
1. 전체 스타일의 일관성과 강점 분석
2. 모든 착장에서 공통적으로 나타나는 개선점
3. ${personaInfo.name}만의 관점으로 종합 스타일링 조언

2-3 문단으로 ${personaInfo.tone}으로 작성해주세요.
한국어로만 응답하세요.
      `;

      let overallFeedback: string;
      if (process.env.GEMINI_API_KEY) {
        const { geminiGenerate } = await import("./gemini-client");
        overallFeedback = await geminiGenerate({
          systemInstruction: "You are a helpful fashion assistant. Respond in Korean only.",
          userMessage: summaryPrompt,
          maxOutputTokens: 500,
        });
      } else {
        const summaryResponse = await openai.chat.completions.create({
          model: process.env.OPENAI_VISION_MODEL || "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are a helpful fashion assistant. Respond in Korean." },
            { role: "user", content: summaryPrompt },
          ],
          max_completion_tokens: 500,
        });
        overallFeedback = summaryResponse.choices[0]?.message?.content || "종합 분석을 생성하지 못했습니다.";
      }

      res.status(201).json({
        individual: individualResults,
        summary: {
          overallScores,
          overallFeedback,
        },
      });
    } catch (err) {
      logRouteError(req, err, "BatchAssessment");
      const detail = err instanceof Error ? err.message : String(err);
      res.status(500).json({ message: "평가 생성에 실패했습니다", detail });
    }
  });

  // === CHAT API ===
  // Create new conversation
  app.post(api.chat.createConversation.path, async (req, res) => {
    if (!req.isAuthenticated()) return sendUnauthorized(res);
    
    try {
      const { persona } = api.chat.createConversation.input.parse(req.body);
      const userId = (req.user as any).claims.sub;
      const personaInfo = CHAT_PERSONA_PROMPTS[persona];
      const title = `${personaInfo.name}과의 대화`;
      
      const conversation = await storage.createConversation(userId, persona, title);
      res.status(201).json(conversation);
    } catch (err) {
      logRouteError(req, err, "ChatConversation");
      res.status(400).json({ message: "대화를 시작할 수 없습니다" });
    }
  });

  // List user's conversations
  app.get(api.chat.listConversations.path, async (req, res) => {
    if (!req.isAuthenticated()) return sendUnauthorized(res);
    const userId = (req.user as any).claims.sub;
    const convs = await storage.getConversations(userId);
    res.json(convs);
  });

  // Get conversation with messages
  app.get(api.chat.getConversation.path, async (req, res) => {
    if (!req.isAuthenticated()) return sendUnauthorized(res);
    const id = Number(req.params.id);
    
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    
    const conversation = await storage.getConversation(id);
    if (!conversation) return res.status(404).json({ message: "대화를 찾을 수 없습니다" });
    
    // Check ownership
    if (conversation.userId !== (req.user as any).claims.sub) {
      return res.status(403).json({ message: "접근 권한이 없습니다" });
    }
    
    const msgs = await storage.getMessages(id);
    res.json({ conversation, messages: msgs });
  });

  // Delete conversation
  app.delete(api.chat.deleteConversation.path, async (req, res) => {
    if (!req.isAuthenticated()) return sendUnauthorized(res);
    const id = Number(req.params.id);
    
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    
    const conversation = await storage.getConversation(id);
    if (!conversation) return res.status(404).json({ message: "대화를 찾을 수 없습니다" });
    
    if (conversation.userId !== (req.user as any).claims.sub) {
      return res.status(403).json({ message: "접근 권한이 없습니다" });
    }
    
    const deleted = await storage.deleteConversation(id);
    res.json({ success: deleted });
  });

  // Send message and get AI response
  app.post(api.chat.sendMessage.path, async (req, res) => {
    if (!req.isAuthenticated()) return sendUnauthorized(res);
    const conversationId = Number(req.params.id);
    
    if (isNaN(conversationId)) return res.status(400).json({ message: "Invalid ID" });
    
    const conversation = await storage.getConversation(conversationId);
    if (!conversation) return res.status(404).json({ message: "대화를 찾을 수 없습니다" });
    
    if (conversation.userId !== (req.user as any).claims.sub) {
      return res.status(403).json({ message: "접근 권한이 없습니다" });
    }
    
    try {
      const { content, image } = api.chat.sendMessage.input.parse(req.body);
      
      // Save user message
      const userMessage = await storage.createMessage(conversationId, 'user', content);
      
      // Get conversation history
      const history = await storage.getMessages(conversationId);
      const persona = conversation.persona || 'sujin';
      const personaInfo = CHAT_PERSONA_PROMPTS[persona];
      
      // Build messages for AI
      const aiMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: any }> = [
        { role: 'system', content: personaInfo.systemPrompt }
      ];
      
      // Add history (limit to last 10 messages for context)
      const recentHistory = history.slice(-10);
      for (const msg of recentHistory) {
        if (msg.role === 'user') {
          aiMessages.push({ role: 'user', content: msg.content });
        } else if (msg.role === 'assistant') {
          aiMessages.push({ role: 'assistant', content: msg.content });
        }
      }
      
      // Add current message
      if (image) {
        aiMessages.push({
          role: 'user',
          content: [
            { type: 'text', text: content },
            { type: 'image_url', image_url: { url: image } }
          ]
        });
      } else {
        aiMessages.push({ role: 'user', content });
      }
      
      // Call AI
      const { openai } = await import("./replit_integrations/image/client");
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: aiMessages as any,
        max_tokens: 1000,
      });
      
      const aiContent = response.choices[0]?.message?.content || "죄송해요, 응답을 생성하지 못했어요.";
      const aiMessage = await storage.createMessage(conversationId, 'assistant', aiContent);
      
      res.status(201).json({ userMessage, aiMessage });
    } catch (err) {
      logRouteError(req, err, "Chat");
      res.status(500).json({ message: "메시지를 처리할 수 없습니다" });
    }
  });

  // === RECOMMENDATIONS API ===
  
  // Get current season based on date
  function getCurrentSeason(): string {
    const month = new Date().getMonth() + 1;
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'fall';
    return 'winter';
  }

  // Generate recommendation using AI
  app.post('/api/recommendations', async (req, res) => {
    if (!req.isAuthenticated()) return sendUnauthorized(res);

    try {
      const userId = (req.user as any).claims.sub;
      const { occasion, season: requestedSeason } = req.body;
      
      if (!occasion) {
        return res.status(400).json({ message: "상황을 선택해주세요" });
      }

      const season = requestedSeason || getCurrentSeason();

      // Get user's SIT type if available (추천 엔진에 반영)
      const sitResult = await storage.getLatestSitResult(userId);
      const sitType = sitResult?.sitType || null;

      const occasionName = OCCASION_NAMES[occasion] || occasion;
      const seasonName = SEASON_NAMES[season] || season;

      const userPrompt = buildRecommendationPrompt({
        occasionName,
        seasonName,
        sitType,
      });

      // Gemini API 사용 (GEMINI_API_KEY 설정 시). 미설정 시 OpenAI 폴백
      let aiContent: string;
      if (process.env.GEMINI_API_KEY) {
        const { geminiGenerate } = await import("./gemini-client");
        aiContent = await geminiGenerate({
          systemInstruction: RECOMMENDATION_SYSTEM_PROMPT,
          userMessage: userPrompt,
          maxOutputTokens: 2048,
          responseMimeType: "application/json",
        });
      } else {
        const { openai } = await import("./replit_integrations/image/client");
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: RECOMMENDATION_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          max_tokens: 1000,
          response_format: { type: "json_object" },
        });
        aiContent = response.choices[0]?.message?.content ?? "";
      }

      if (!aiContent) {
        return res.status(500).json({ message: "추천을 생성할 수 없습니다" });
      }

      // JSON 추출: 마크다운 코드블록 제거 후, 없으면 첫 { ~ 마지막 } 구간 사용
      const stripCodeBlock = (s: string) =>
        s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      let raw = stripCodeBlock(aiContent);
      const firstBrace = raw.indexOf("{");
      if (firstBrace !== -1) {
        const lastBrace = raw.lastIndexOf("}");
        if (lastBrace > firstBrace) raw = raw.slice(firstBrace, lastBrace + 1);
      }
      // trailing comma 등으로 파싱 실패 시 보정 시도
      const relaxed = raw.replace(/,(\s*[}\]])/g, "$1");

      let parsed: { outfitSet?: unknown; reasoning?: string; alternatives?: unknown };
      try {
        parsed = JSON.parse(relaxed) as typeof parsed;
      } catch (parseErr) {
        try {
          parsed = JSON.parse(raw) as typeof parsed;
        } catch {
          const detail =
            (parseErr instanceof Error ? parseErr.message : String(parseErr)) +
            " | raw 앞 250자: " + raw.slice(0, 250);
          logRouteError(req, parseErr, "RecommendationParse");
          return res.status(500).json({ message: "추천 응답 형식 오류입니다", detail });
        }
      }
      const hasOutfitSet = parsed?.outfitSet && typeof parsed.outfitSet === "object";
      if (!hasOutfitSet) {
        logRouteError(req, new Error("Invalid recommendation shape: missing outfitSet"), "RecommendationValidate");
        return res.status(500).json({
          message: "추천을 생성할 수 없습니다",
          detail: "응답에 outfitSet이 없습니다. raw 앞 200자: " + raw.slice(0, 200),
        });
      }
      const reasoning =
        typeof parsed.reasoning === "string" && parsed.reasoning.trim()
          ? parsed.reasoning.trim()
          : "코디 추천이 완료되었습니다.";

      // Save recommendation
      const recommendation = await storage.createRecommendation({
        userId,
        season,
        occasion,
        sitType,
        outfitSet: parsed.outfitSet as Record<string, unknown>,
        reasoning,
        alternatives: parsed.alternatives ?? null,
        isFavorite: false,
      });

      // 스타일 추천과 함께 제품 추천(목업) 부착
      res.status(201).json({
        ...recommendation,
        products: getMockProductsByCategory(),
      });
    } catch (err) {
      logRouteError(req, err, "Recommendation");
      const detail = err instanceof Error ? err.message : String(err);
      res.status(500).json({ message: "추천을 생성할 수 없습니다", detail });
    }
  });

  // Get all recommendations
  app.get('/api/recommendations', async (req, res) => {
    if (!req.isAuthenticated()) return sendUnauthorized(res);
    try {
      const userId = (req.user as any).claims.sub;
      const recs = await storage.getRecommendations(userId);
      res.json(recs);
    } catch (err) {
      logRouteError(req, err, "RecommendationsList");
      return res.status(500).json({ message: "추천 목록을 불러올 수 없습니다" });
    }
  });

  // Get current season (고정 경로는 :id보다 먼저 등록)
  app.get('/api/recommendations/season', async (req, res) => {
    res.json({ season: getCurrentSeason() });
  });

  // Get single recommendation
  app.get('/api/recommendations/:id', async (req, res) => {
    if (!req.isAuthenticated()) return sendUnauthorized(res);
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    try {
      const rec = await storage.getRecommendation(id);
      if (!rec) return res.status(404).json({ message: "추천을 찾을 수 없습니다" });

      const userId = (req.user as any).claims.sub;
      if (rec.userId !== userId) return res.status(403).json({ message: "권한이 없습니다" });

      res.json({
        ...rec,
        products: getMockProductsByCategory(),
      });
    } catch (err) {
      logRouteError(req, err, "RecommendationGet");
      return res.status(500).json({ message: "추천을 불러올 수 없습니다" });
    }
  });

  // Toggle favorite
  app.patch('/api/recommendations/:id/favorite', async (req, res) => {
    if (!req.isAuthenticated()) return sendUnauthorized(res);
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    try {
      const rec = await storage.getRecommendation(id);
      if (!rec) return res.status(404).json({ message: "추천을 찾을 수 없습니다" });

      const userId = (req.user as any).claims.sub;
      if (rec.userId !== userId) return res.status(403).json({ message: "권한이 없습니다" });

      const updated = await storage.toggleRecommendationFavorite(id);
      res.json({
        ...updated,
        products: getMockProductsByCategory(),
      });
    } catch (err) {
      logRouteError(req, err, "RecommendationFavorite");
      return res.status(500).json({ message: "즐겨찾기를 변경할 수 없습니다" });
    }
  });

  return httpServer;
}
