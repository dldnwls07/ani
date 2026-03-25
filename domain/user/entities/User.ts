// ============================================================
// User 도메인 엔티티
// ============================================================
import { BaseEntity, UUID } from '@/domain/shared/types'

export interface User extends BaseEntity {
  email: string
  nickname: string
  avatarUrl?: string
  coupleId?: UUID
  statusMessage: string
  statusUpdatedAt: string
}
