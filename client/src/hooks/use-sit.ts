import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

// Define input type matching shared/routes.ts
type SubmitSitInput = {
  answers: Record<string, string>;
  calculatedType: string;
  scores: {
    IE: number;
    WC: number;
    SN: number;
    MB: number;
  };
};

export function useLatestSitResult() {
  return useQuery({
    queryKey: [api.sit.latest.path],
    queryFn: async () => {
      const res = await fetch(api.sit.latest.path, { credentials: "include" });
      if (res.status === 401) return null; // Handle unauthorized gracefully
      if (!res.ok) throw new Error("최근 테스트 결과를 불러오는데 실패했습니다");
      // The API might return null if no result exists, handled by schema
      const data = await res.json();
      return api.sit.latest.responses[200].parse(data);
    },
    retry: false,
  });
}

export function useSubmitSit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: SubmitSitInput) => {
      const res = await fetch(api.sit.submit.path, {
        method: api.sit.submit.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 401) throw new Error("결과를 저장하려면 로그인이 필요합니다");
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.message || "답변이 올바르지 않습니다");
        }
        throw new Error("테스트 제출에 실패했습니다");
      }
      
      return api.sit.submit.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.sit.latest.path] });
    },
  });
}
