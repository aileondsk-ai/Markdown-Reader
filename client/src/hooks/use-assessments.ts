import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { z } from "zod";

type CreateAssessmentInput = z.infer<typeof api.assessments.create.input>;

export function useAssessments() {
  return useQuery({
    queryKey: [api.assessments.list.path],
    queryFn: async () => {
      const res = await fetch(api.assessments.list.path, { credentials: "include" });
      if (res.status === 401) return []; // Return empty for unauth
      if (!res.ok) throw new Error("Failed to fetch assessments");
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
      if (res.status === 404) throw new Error("Assessment not found");
      if (res.status === 401) throw new Error("Unauthorized");
      if (!res.ok) throw new Error("Failed to fetch assessment");
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
        if (res.status === 401) throw new Error("Please log in to evaluate your style");
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.message || "Invalid request");
        }
        throw new Error("Failed to create assessment");
      }

      return api.assessments.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.assessments.list.path] });
    },
  });
}
