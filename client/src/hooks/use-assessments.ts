import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { z } from "zod";
import { apiRequest } from "@/lib/queryClient";

type CreateAssessmentInput = z.infer<typeof api.assessments.create.input>;

export function useAssessments() {
  return useQuery({
    queryKey: [api.assessments.list.path],
    queryFn: async () => {
      const res = await fetch(api.assessments.list.path, { credentials: "include" });
      if (res.status === 401) return []; // Return empty for unauth
      if (!res.ok) throw new Error("평가 목록을 불러오는데 실패했습니다");
      return api.assessments.list.responses[200].parse(await res.json());
    },
    retry: false,
  });
}

export function useAssessment(id: number) {
  return useQuery({
    queryKey: [api.assessments.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.assessments.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) throw new Error("평가를 찾을 수 없습니다");
      if (res.status === 401) throw new Error("로그인이 필요합니다");
      if (!res.ok) throw new Error("평가를 불러오는데 실패했습니다");
      return api.assessments.get.responses[200].parse(await res.json());
    },
    retry: false,
    enabled: !!id,
  });
}

export function useCreateAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateAssessmentInput) => {
      const res = await fetch(api.assessments.create.path, {
        method: api.assessments.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 401) throw new Error("스타일 평가를 받으려면 로그인이 필요합니다");
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.message || "잘못된 요청입니다");
        }
        throw new Error("평가 생성에 실패했습니다");
      }

      return api.assessments.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.assessments.list.path] });
    },
  });
}

type CreateBatchAssessmentInput = z.infer<typeof api.assessments.createBatch.input>;

export function useCreateBatchAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateBatchAssessmentInput) => {
      const res = await fetch(api.assessments.createBatch.path, {
        method: api.assessments.createBatch.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 401) throw new Error("다중 이미지 분석을 위해 로그인이 필요합니다");
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.message || "잘못된 요청입니다");
        }
        throw new Error("다중 이미지 분석에 실패했습니다");
      }

      return api.assessments.createBatch.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.assessments.list.path] });
    },
  });
}

export function useAssessmentsByMonth(year: number, month: number) {
  return useQuery({
    queryKey: [api.assessments.getByMonth.path, year, month],
    queryFn: async () => {
      const url = buildUrl(api.assessments.getByMonth.path, { year, month });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 401) return [];
      if (!res.ok) throw new Error("평가 목록을 불러오는데 실패했습니다");
      return api.assessments.getByMonth.responses[200].parse(await res.json());
    },
    retry: false,
  });
}

export function useAssessmentStats() {
  return useQuery({
    queryKey: [api.assessments.stats.path],
    queryFn: async () => {
      const res = await fetch(api.assessments.stats.path, { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("통계를 불러오는데 실패했습니다");
      return api.assessments.stats.responses[200].parse(await res.json());
    },
    retry: false,
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.assessments.toggleFavorite.path, { id });
      const res = await apiRequest("PATCH", url);
      return api.assessments.toggleFavorite.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.assessments.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.assessments.stats.path] });
      queryClient.invalidateQueries({ queryKey: [api.assessments.getByMonth.path] });
    },
  });
}
