// ============================================================
// ChatUseCase - 커플 전용 AI 비서(ani-assistant) 유즈케이스
// ============================================================
import { supabaseBrowser } from '@/infrastructure/supabase/client'
import { UUID, Result } from '@/domain/shared/types'
import { Message } from '@/domain/chat/entities/Message'

export class ChatUseCase {
  // 1. 메시지 보내기 (DB 저장)
  async sendMessage(coupleId: UUID, senderId: UUID | null, content: string): Promise<Result<Message>> {
    const { data, error } = await supabaseBrowser
      .from('messages')
      .insert({
        couple_id: coupleId,
        sender_id: senderId,
        content: content,
        message_type: 'TEXT'
      })
      .select()
      .single()

    if (error) return { data: null, error: error.message }
    return { data: data as Message, error: null }
  }

  // 2. AI 답변 요청 (실제 OpenAI API 연동)
  async getAIResponse(coupleId: UUID, userMessage: string): Promise<Result<string>> {
    try {
      // 서버의 API 라우트 호출 (OpenAI Key는 서버에 숨겨져 있음)
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      })

      const { data, error, details } = await response.json()
      
      if (error) {
        console.error('[ChatUseCase] AI Error:', error, details)
        return { data: null, error: `${error} (${details || ''})` }
      }
      return { data, error: null }
    } catch (e: any) {
      return { data: null, error: 'AI 연결에 실패했습니다.' }
    }
  }

  // 3. 채팅 내역 실시간 구독
  subscribeMessages(coupleId: UUID, callback: (msg: Message) => void) {
    return supabaseBrowser
      .channel(`chat-messages-${coupleId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `couple_id=eq.${coupleId}` },
        (payload) => callback(payload.new as Message)
      )
      .subscribe()
  }
}

export const chatUseCase = new ChatUseCase()
