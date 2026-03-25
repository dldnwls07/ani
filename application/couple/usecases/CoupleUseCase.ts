// ============================================================
// CoupleUseCase - 커플 생성 및 매칭 유즈케이스
// ============================================================
import { supabaseBrowser } from '@/infrastructure/supabase/client'
import { InviteCode } from '@/domain/couple/entities/Couple'
import { UUID, Result } from '@/domain/shared/types'

export class CoupleUseCase {
  // 초대 코드 생성 (커플 레코드 생성)
  async createCouple(partner1Id: UUID, connectionDate?: string): Promise<Result<{ coupleId: UUID; inviteCode: string }>> {
    const code = InviteCode.generate()

    const { data, error } = await supabaseBrowser
      .from('couples')
      .insert({
        invite_code: code,
        partner_1_id: partner1Id,
        connection_date: connectionDate ?? null,
      })
      .select('id, invite_code')
      .single()

    if (error) return { data: null, error: error.message }
    return { data: { coupleId: data.id, inviteCode: data.invite_code }, error: null }
  }

  // 초대 코드로 파트너 매칭 (Supabase RPC 호출)
  async matchCouple(inviteCode: string): Promise<Result<UUID>> {
    if (!InviteCode.isValid(inviteCode)) {
      return { data: null, error: '초대 코드 형식이 올바르지 않습니다.' }
    }

    const { data, error } = await supabaseBrowser.rpc('match_couple', {
      p_invite_code: inviteCode,
    })

    if (error) return { data: null, error: error.message }
    return { data: data as UUID, error: null }
  }

  // 내 커플 정보 가져오기
  async getMyCouple(coupleId: UUID) {
    const { data, error } = await supabaseBrowser
      .from('couples')
      .select('*')
      .eq('id', coupleId)
      .single()

    if (error) return { data: null, error: error.message }
    return { data, error: null }
  }
}

export const coupleUseCase = new CoupleUseCase()
