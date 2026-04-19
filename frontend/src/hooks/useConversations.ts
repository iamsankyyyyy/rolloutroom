import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getConversations, getConversation, createConversation, sendMessage } from '../api'
import type { CreateConversationRequest } from '../types'

export function useConversations(projectId?: number) {
  return useQuery({ queryKey: ['conversations', projectId], queryFn: () => getConversations(projectId) })
}
export function useConversation(id: number) {
  return useQuery({ queryKey: ['conversations', 'detail', id], queryFn: () => getConversation(id) })
}
export function useCreateConversation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateConversationRequest) => createConversation(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] }),
  })
}
export function useSendMessage(conversationId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (content: string) => sendMessage(conversationId, content),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations', 'detail', conversationId] }),
  })
}
