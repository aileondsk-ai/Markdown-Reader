import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ProductsByCategory } from "@shared/types/products";

// API paths (not yet in shared/routes.ts, using raw paths)
const RECOMMENDATIONS_API = {
  list: "/api/recommendations",
  get: (id: number) => `/api/recommendations/${id}`,
  create: "/api/recommendations",
  toggleFavorite: (id: number) => `/api/recommendations/${id}/favorite`,
  season: "/api/recommendations/season",
};

export interface Recommendation {
  id: number;
  userId: string;
  season: string;
  occasion: string;
  sitType: string | null;
  outfitSet: {
    top: { item: string; color: string; reason: string };
    bottom: { item: string; color: string; reason: string };
    shoes: { item: string; color: string; reason: string };
    accessory: { item: string; color: string; reason: string };
  };
  reasoning: string;
  alternatives: Array<{ name: string; description: string }> | null;
  isFavorite: boolean | null;
  createdAt: string;
  /** 스타일 추천과 함께 제공되는 제품 추천(목업). 차후 DB/API 연동 시 동일 필드 사용 */
  products?: ProductsByCategory;
}

/**
 * 전체 추천 목록 조회
 */
export function useRecommendations() {
  return useQuery<Recommendation[]>({
    queryKey: [RECOMMENDATIONS_API.list],
    queryFn: async () => {
      const res = await fetch(RECOMMENDATIONS_API.list, { credentials: "include" });
      if (res.status === 401) return [];
      if (!res.ok) throw new Error("추천 목록을 불러오는데 실패했습니다");
      return res.json();
    },
    retry: false,
  });
}

/**
 * 개별 추천 조회
 */
export function useRecommendation(id: number) {
  return useQuery<Recommendation>({
    queryKey: [RECOMMENDATIONS_API.list, id],
    queryFn: async () => {
      const res = await fetch(RECOMMENDATIONS_API.get(id), { credentials: "include" });
      if (res.status === 404) throw new Error("추천을 찾을 수 없습니다");
      if (res.status === 401) throw new Error("로그인이 필요합니다");
      if (!res.ok) throw new Error("추천을 불러오는데 실패했습니다");
      return res.json();
    },
    retry: false,
    enabled: !!id,
  });
}

/**
 * 현재 계절 조회
 */
export function useCurrentSeason() {
  return useQuery<{ season: string }>({
    queryKey: [RECOMMENDATIONS_API.season],
    queryFn: async () => {
      const res = await fetch(RECOMMENDATIONS_API.season, { credentials: "include" });
      if (!res.ok) throw new Error("계절 정보를 불러오는데 실패했습니다");
      return res.json();
    },
    staleTime: 1000 * 60 * 60, // 1 hour cache
  });
}

interface CreateRecommendationInput {
  occasion: string;
  season?: string;
}

/**
 * 추천 생성 mutation
 */
export function useCreateRecommendation() {
  const queryClient = useQueryClient();
  return useMutation<Recommendation, Error, CreateRecommendationInput>({
    mutationFn: async (data) => {
      const res = await fetch(RECOMMENDATIONS_API.create, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 401) throw new Error("추천을 받으려면 로그인이 필요합니다");
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.message || "잘못된 요청입니다");
        }
        throw new Error("추천 생성에 실패했습니다");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RECOMMENDATIONS_API.list] });
    },
  });
}

/**
 * 즐겨찾기 토글 mutation
 */
export function useToggleRecommendationFavorite() {
  const queryClient = useQueryClient();
  return useMutation<Recommendation, Error, number>({
    mutationFn: async (id) => {
      const res = await fetch(RECOMMENDATIONS_API.toggleFavorite(id), {
        method: "PATCH",
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 401) throw new Error("로그인이 필요합니다");
        if (res.status === 404) throw new Error("추천을 찾을 수 없습니다");
        throw new Error("즐겨찾기 변경에 실패했습니다");
      }

      return res.json();
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: [RECOMMENDATIONS_API.list] });
      queryClient.invalidateQueries({ queryKey: [RECOMMENDATIONS_API.list, id] });
    },
  });
}
