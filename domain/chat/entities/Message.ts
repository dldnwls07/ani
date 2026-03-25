import { BaseEntity, UUID } from '@/domain/shared/types'

export type MessageType = 'TEXT' | 'IMAGE' | 'SYSTEM'

export interface Message extends BaseEntity {
  coupleId: UUID
  senderId?: UUID // null이면 AI
  content: string
  messageType: MessageType
}
