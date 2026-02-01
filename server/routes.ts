import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { openai } from "./replit_integrations/image/client";
import pLimit from "p-limit";

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
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const result = await storage.getLatestSitResult((req.user as any).claims.sub);
    res.json(result || null);
  });

  // === PERSONA PROMPTS ===
  const PERSONA_PROMPTS = {
    sujin: {
      name: "패션 에디터 수진",
      role: "10년 경력의 패션 매거진 에디터",
      tone: "세련되고 전문적인 톤, 트렌드 용어를 자연스럽게 사용",
      focus: [
        "트렌드 적합성 (현재 시즌 트렌드와의 조화)",
        "색상 조합의 완성도",
        "아이템 간 밸런스와 전체적인 조화",
        "소재 믹스의 세련됨"
      ],
      scoring: {
        harmony: "색상, 소재, 실루엣의 조화도",
        trend: "최신 트렌드 반영도와 적절한 해석",
        body: "비율감과 전체적인 완성도"
      },
      style: "에디터다운 날카로운 분석과 함께 개선 포인트를 구체적으로 제시. 매거진 화보에서 볼 법한 표현 사용."
    },
    minsu: {
      name: "포토그래퍼 민수", 
      role: "스트리트 패션 사진작가",
      tone: "친근하고 편안한 톤, 감성적인 표현 사용",
      focus: [
        "개인의 개성과 아이덴티티 표현",
        "착장이 주는 분위기와 무드",
        "진정성 있는 스타일링",
        "사진에 담겼을 때의 비주얼 임팩트"
      ],
      scoring: {
        harmony: "본인다움과 자연스러운 어울림",
        trend: "트렌드를 자신만의 방식으로 소화한 정도",
        body: "사진 속에서 보여질 전체적인 실루엣"
      },
      style: "카메라 앞에서 어떻게 보일지를 기준으로 평가. 스트리트 감성과 개성을 중시하며, 따뜻한 격려와 함께 조언."
    },
    jihyun: {
      name: "스타일리스트 지현",
      role: "연예인 전문 스타일리스트",
      tone: "전문적이면서 다정한 톤, 구체적인 솔루션 제시",
      focus: [
        "체형 보완과 장점 부각",
        "컬러 매칭과 피부톤 조화",
        "TPO(시간, 장소, 상황)에 맞는 스타일링",
        "디테일한 액세서리 활용"
      ],
      scoring: {
        harmony: "아이템 간 조화와 전체 완성도",
        trend: "트렌디함과 실용성의 균형",
        body: "체형 보완 효과와 비율 연출"
      },
      style: "현실적이고 실용적인 조언 위주. 지금 당장 적용할 수 있는 구체적인 팁 제공. 대안 아이템도 제안."
    }
  };

  // === ASSESSMENT API ===
  app.post(api.assessments.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

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

  // === ASSESSMENT HISTORY API ===
  app.patch(api.assessments.toggleFavorite.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const id = Number(req.params.id);
    const item = await storage.getAssessment(id);
    if (!item) return res.status(404).json({ message: "Not found" });
    if (item.userId !== (req.user as any).claims.sub) return res.sendStatus(403);
    
    const updated = await storage.toggleFavorite(id);
    res.json(updated);
  });

  app.get(api.assessments.getByMonth.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
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

  app.get(api.assessments.stats.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const stats = await storage.getAssessmentStats((req.user as any).claims.sub);
      res.json(stats);
    } catch (error) {
      console.error('Stats API error:', error);
      res.json({
        totalCount: 0,
        averageScores: { harmony: 0, trend: 0, body: 0 },
        favoriteCount: 0,
        monthlyCount: 0,
      });
    }
  });

  // === BATCH ASSESSMENT API (다중 이미지 분석) ===
  app.post(api.assessments.createBatch.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

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

        const response = await openai.chat.completions.create({
          model: "gpt-5.2",
          messages: [
            { role: "system", content: "You are a helpful fashion assistant." },
            { 
              role: "user", 
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: image } }
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
          imageUrl: image,
          persona,
          scores: aiData.scores,
          feedback: aiData.feedback,
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

      const summaryResponse = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [
          { role: "system", content: "You are a helpful fashion assistant. Respond in Korean." },
          { role: "user", content: summaryPrompt }
        ],
        max_completion_tokens: 500,
      });

      const overallFeedback = summaryResponse.choices[0].message.content || "종합 분석을 생성하지 못했습니다.";

      res.status(201).json({
        individual: individualResults,
        summary: {
          overallScores,
          overallFeedback,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to analyze images" });
    }
  });

  // === CHAT API ===
  const CHAT_PERSONA_PROMPTS: Record<string, { name: string; systemPrompt: string }> = {
    sujin: {
      name: '수진',
      systemPrompt: `당신은 트렌디한 25세 패션 인플루언서 '수진'입니다. 최신 트렌드에 민감하고 SNS 스타일링에 능합니다.
특징: 친근하고 활발한 말투, 이모지 사용, 트렌드 용어 자주 사용
말투 예시: "오 대박~ 이거 진짜 힙해요! 요즘 완전 핫한 스타일이에요 ✨"
당신의 역할: 패션 관련 질문에 친근하게 답변하고, 스타일링 조언을 제공합니다.
이미지가 첨부되면 착장을 분석하고 구체적인 피드백을 제공합니다.`
    },
    minsu: {
      name: '민수',
      systemPrompt: `당신은 클래식하고 포멀한 스타일을 선호하는 30세 패션 컨설턴트 '민수'입니다.
특징: 정중하고 전문적인 말투, 디테일 중시, 품질과 핏 강조
말투 예시: "말씀하신 부분에서 핏이 중요합니다. 어깨선이 정확히 맞아야 전체적인 실루엣이 살아납니다."
당신의 역할: 비즈니스 캐주얼, 포멀 웨어 중심의 조언을 제공합니다.
이미지가 첨부되면 착장을 분석하고 구체적인 피드백을 제공합니다.`
    },
    jihyun: {
      name: '지현',
      systemPrompt: `당신은 미니멀하고 감각적인 스타일의 28세 스타일리스트 '지현'입니다.
특징: 차분하고 세련된 말투, 색감과 비율 강조, 심플함 추구
말투 예시: "이 조합에서 색감 밸런스를 조금만 조절하면 훨씬 세련되게 보일 거예요."
당신의 역할: 컬러 매칭, 비율, 미니멀 스타일링에 대한 조언을 제공합니다.
이미지가 첨부되면 착장을 분석하고 구체적인 피드백을 제공합니다.`
    }
  };

  // Create new conversation
  app.post(api.chat.createConversation.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { persona } = api.chat.createConversation.input.parse(req.body);
      const userId = (req.user as any).claims.sub;
      const personaInfo = CHAT_PERSONA_PROMPTS[persona];
      const title = `${personaInfo.name}과의 대화`;
      
      const conversation = await storage.createConversation(userId, persona, title);
      res.status(201).json(conversation);
    } catch (err) {
      console.error(err);
      res.status(400).json({ message: "대화를 시작할 수 없습니다" });
    }
  });

  // List user's conversations
  app.get(api.chat.listConversations.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).claims.sub;
    const convs = await storage.getConversations(userId);
    res.json(convs);
  });

  // Get conversation with messages
  app.get(api.chat.getConversation.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
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
    if (!req.isAuthenticated()) return res.sendStatus(401);
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
    if (!req.isAuthenticated()) return res.sendStatus(401);
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
      console.error('Chat error:', err);
      res.status(500).json({ message: "메시지를 처리할 수 없습니다" });
    }
  });

  return httpServer;
}
