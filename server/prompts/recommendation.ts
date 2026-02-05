/**
 * 코디 추천 AI 프롬프트 생성
 * POST /api/recommendations 에서 사용
 */
export interface RecommendationPromptParams {
  occasionName: string;
  seasonName: string;
  sitType: string | null;
}

export const RECOMMENDATION_SYSTEM_PROMPT =
  "패션 스타일리스트로서 코디를 추천합니다. JSON 형식으로만 응답합니다.";

export function buildRecommendationPrompt(params: RecommendationPromptParams): string {
  const { occasionName, seasonName, sitType } = params;
  return `당신은 한국의 패션 스타일리스트입니다.
다음 조건에 맞는 코디 추천을 JSON 형식으로 제공해주세요.

조건:
- 상황: ${occasionName}
- 계절: ${seasonName}
${sitType ? `- 사용자 스타일 유형: ${sitType}` : ""}

다음 JSON 형식으로 정확히 응답해주세요:
{
  "outfitSet": {
    "top": { "item": "아이템명", "color": "색상", "reason": "추천 이유" },
    "bottom": { "item": "아이템명", "color": "색상", "reason": "추천 이유" },
    "shoes": { "item": "아이템명", "color": "색상", "reason": "추천 이유" },
    "accessory": { "item": "아이템명", "color": "색상", "reason": "추천 이유" }
  },
  "reasoning": "전체적인 코디 컨셉과 이 스타일을 추천한 이유 (2-3문장)",
  "alternatives": [
    {
      "name": "대안 스타일 1",
      "description": "간단한 설명"
    },
    {
      "name": "대안 스타일 2",
      "description": "간단한 설명"
    }
  ]
}`;
}
