// ============================================================
// CoupleUseCase - 커플 생성 및 매칭 유즈케이스 (Repository 주입 버전)
// ============================================================
import { InviteCode } from '@/domain/couple/entities/Couple'
import { ICoupleRepository } from '@/domain/couple/repositories/ICoupleRepository'
import { SupabaseCoupleRepository } from '@/infrastructure/supabase/repositories/SupabaseCoupleRepository'
import { UUID, Result } from '@/domain/shared/types'

export class CoupleUseCase {
  constructor(private coupleRepository: ICoupleRepository = new SupabaseCoupleRepository()) {}

  // 초대 코드 생성 (커플 레코드 생성)
  async createCouple(partner1Id: UUID, connectionDate?: string): Promise<Result<{ coupleId: UUID; inviteCode: string }>> {
    const code = InviteCode.generate()

    const { data, error } = await this.coupleRepository.create({
      inviteCode: code,
      partner1Id,
      connectionDate: connectionDate ?? undefined,
      themePreference: { primary: '#FF6B6B', secondary: '#4ECDC4' },
    })

    if (error) return { data: null, error }
    return { data: { coupleId: data!.id, inviteCode: data!.inviteCode }, error: null }
  }

  // 초대 코드로 파트너 매칭
  async matchCouple(inviteCode: string): Promise<Result<UUID>> {
    if (!InviteCode.isValid(inviteCode)) {
      return { data: null, error: '초대 코드 형식이 올바르지 않습니다.' }
    }

    return this.coupleRepository.matchPartner(inviteCode)
  }

  // 내 커플 정보 가져오기
  async getMyCouple(coupleId: UUID) {
    return this.coupleRepository.findById(coupleId)
  }
}

export const coupleUseCase = new CoupleUseCase()
