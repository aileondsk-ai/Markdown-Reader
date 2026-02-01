import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

// Define input type manually since it's a z.record in the route
type SubmitSitInput = {
  answers: Record<string, string>;
};

export function useLatestSitResult() {
  return useQuery({
    queryKey: [api.sit.latest.path],
    queryFn: async () => {
      const res = await fetch(api.sit.latest.path, { credentials: "include" });
      if (res.status === 401) return null; // Handle unauthorized gracefully
      if (!res.ok) throw new Error("Failed to fetch latest SIT result");
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
        if (res.status === 401) throw new Error("Please log in to save your results");
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.message || "Invalid answers");
        }
        throw new Error("Failed to submit SIT test");
      }
      
      return api.sit.submit.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.sit.latest.path] });
    },
  });
}
