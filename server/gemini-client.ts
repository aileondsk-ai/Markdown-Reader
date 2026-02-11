/**
 * Google Gemini API 클라이언트 (추천 생성, 패션 평가 이미지 분석 등)
 * 기본 모델: Gemini 3.0 Pro (gemini-3-pro-preview). 환경 변수: GEMINI_API_KEY, GEMINI_MODEL(선택)
 */

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

export interface GeminiGenerateOptions {
  systemInstruction?: string;
  userMessage: string;
  maxOutputTokens?: number;
  responseMimeType?: "application/json" | "text/plain";
}

/** data URL (data:image/jpeg;base64,...) 또는 base64 문자열 */
export interface GeminiGenerateWithImageOptions {
  systemInstruction?: string;
  userMessage: string;
  /** data URL 또는 raw base64 (mimeType과 함께 사용) */
  imageDataUrlOrBase64: string;
  /** imageDataUrlOrBase64가 raw base64일 때만 필요 */
  mimeType?: string;
  maxOutputTokens?: number;
  responseMimeType?: "application/json" | "text/plain";
}

/**
 * Gemini generateContent 호출 후 응답 텍스트 반환
 */
export async function geminiGenerate(options: GeminiGenerateOptions): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY가 설정되지 않았습니다. .env에 GEMINI_API_KEY를 추가하세요.");
  }

  // 기본: Gemini 3.0 Pro. 구 모델명(gemini-3.0-pro-preview)은 API 코드명(gemini-3-pro-preview)으로 보정
  const rawModel = process.env.GEMINI_MODEL || "gemini-3-pro-preview";
  const model =
    rawModel === "gemini-3.0-pro-preview" || /^gemini-3\.0-/i.test(rawModel)
      ? "gemini-3-pro-preview"
      : rawModel;
  const url = `${GEMINI_BASE}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const body: Record<string, unknown> = {
    contents: [{ role: "user", parts: [{ text: options.userMessage }] }],
    generationConfig: {
      maxOutputTokens: options.maxOutputTokens ?? 1024,
      ...(options.responseMimeType && { responseMimeType: options.responseMimeType }),
    },
  };

  if (options.systemInstruction) {
    body.systemInstruction = { parts: [{ text: options.systemInstruction }] };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API 오류 (${res.status}): ${errText.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
      finishReason?: string;
    }>;
    error?: { message?: string };
  };

  if (data.error?.message) {
    throw new Error(`Gemini API: ${data.error.message}`);
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (text == null || text === "") {
    throw new Error("Gemini API가 빈 응답을 반환했습니다.");
  }

  return text;
}

/**
 * 이미지 + 텍스트로 generateContent 호출 (Vision, 패션 평가 등)
 */
export async function geminiGenerateWithImage(options: GeminiGenerateWithImageOptions): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY가 설정되지 않았습니다. .env에 GEMINI_API_KEY를 추가하세요.");
  }

  const rawModel = process.env.GEMINI_MODEL || "gemini-3-pro-preview";
  const model =
    rawModel === "gemini-3.0-pro-preview" || /^gemini-3\.0-/i.test(rawModel)
      ? "gemini-3-pro-preview"
      : rawModel;
  const url = `${GEMINI_BASE}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  let mimeType = options.mimeType || "image/jpeg";
  let base64Data: string;
  if (options.imageDataUrlOrBase64.startsWith("data:")) {
    const match = options.imageDataUrlOrBase64.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) throw new Error("잘못된 이미지 data URL 형식입니다.");
    mimeType = match[1].trim();
    base64Data = match[2];
  } else {
    base64Data = options.imageDataUrlOrBase64;
  }

  const body: Record<string, unknown> = {
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: options.userMessage },
        ],
      },
    ],
    generationConfig: {
      maxOutputTokens: options.maxOutputTokens ?? 1024,
      ...(options.responseMimeType && { responseMimeType: options.responseMimeType }),
    },
  };

  if (options.systemInstruction) {
    body.systemInstruction = { parts: [{ text: options.systemInstruction }] };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API 오류 (${res.status}): ${errText.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    error?: { message?: string };
  };

  if (data.error?.message) {
    throw new Error(`Gemini API: ${data.error.message}`);
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (text == null || text === "") {
    throw new Error("Gemini API가 빈 응답을 반환했습니다.");
  }

  return text;
}
