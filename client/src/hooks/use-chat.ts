import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { z } from "zod";
import { apiRequest } from "@/lib/queryClient";

type CreateConversationInput = z.infer<typeof api.chat.createConversation.input>;
type SendMessageInput = z.infer<typeof api.chat.sendMessage.input>;

export function useConversations() {
  return useQuery({
    queryKey: [api.chat.listConversations.path],
    queryFn: async () => {
      const res = await fetch(api.chat.listConversations.path, { credentials: "include" });
      if (res.status === 401) return [];
      if (!res.ok) throw new Error("대화 목록을 불러오는데 실패했습니다");
      return api.chat.listConversations.responses[200].parse(await res.json());
    },
    retry: false,
  });
}

export function useConversation(id: number | null) {
  return useQuery({
    queryKey: [api.chat.getConversation.path, id],
    queryFn: async () => {
      if (!id) return null;
      const url = buildUrl(api.chat.getConversation.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (res.status === 401) throw new Error("로그인이 필요합니다");
      if (!res.ok) throw new Error("대화를 불러오는데 실패했습니다");
      return api.chat.getConversation.responses[200].parse(await res.json());
    },
    enabled: !!id,
    retry: false,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateConversationInput) => {
      const res = await fetch(api.chat.createConversation.path, {
        method: api.chat.createConversation.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 401) throw new Error("로그인이 필요합니다");
        throw new Error("대화를 시작할 수 없습니다");
      }
      
      return api.chat.createConversation.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.chat.listConversations.path] });
    },
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.chat.deleteConversation.path, { id });
      const res = await apiRequest("DELETE", url);
      return api.chat.deleteConversation.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.chat.listConversations.path] });
    },
  });
}

export function useSendMessage(conversationId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: SendMessageInput) => {
      if (!conversationId) throw new Error("대화를 선택해주세요");
      const url = buildUrl(api.chat.sendMessage.path, { id: conversationId });
      const res = await fetch(url, {
        method: api.chat.sendMessage.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 401) throw new Error("로그인이 필요합니다");
        throw new Error("메시지를 보낼 수 없습니다");
      }
      
      return api.chat.sendMessage.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [api.chat.getConversation.path, conversationId] 
      });
    },
  });
}
