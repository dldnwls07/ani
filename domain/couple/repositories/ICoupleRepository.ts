// ============================================================
// ICoupleRepository - Couple 도메인 리포지토리 인터페이스
// ============================================================
import { Couple } from '@/domain/couple/entities/Couple'
import { UUID, Result } from '@/domain/shared/types'

export interface ICoupleRepository {
  findById(id: UUID): Promise<Result<Couple>>
  findByInviteCode(code: string): Promise<Result<Couple>>
  create(couple: Omit<Couple, 'id' | 'createdAt'>): Promise<Result<Couple>>
  matchPartner(inviteCode: string, partnerId: UUID): Promise<Result<UUID>>
  updateTheme(id: UUID, theme: Couple['themePreference']): Promise<Result<void>>
}
