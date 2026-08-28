import { apiRequest } from './apiClient'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ChatResponseData {
  reply: string
}

/**
 * Kirim pesan ke chatbot RAG di backend.
 * @param message pesan pengguna
 * @param history riwayat percakapan (untuk konteks lanjutan)
 */
export async function sendChatMessage(
  message: string,
  history: ChatMessage[] = [],
): Promise<string> {
  const res = await apiRequest<ChatResponseData>('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ message, history }),
  })
  return res.data.reply
}
