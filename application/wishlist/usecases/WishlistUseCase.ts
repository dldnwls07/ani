import { supabaseBrowser } from '../client'
import { Couple } from '@/domain/couple/entities/Couple'
import { ICoupleRepository } from '@/domain/couple/repositories/ICoupleRepository'
import { UUID, Result } from '@/domain/shared/types'

export class SupabaseCoupleRepository implements ICoupleRepository {
  private mapToEntity(row: any): Couple {
    return {
      id: row.id,
      inviteCode: row.invite_code,
      partner1Id: row.partner_1_id,
      partner2Id: row.partner_2_id,
      connectionDate: row.connection_date,
      themePreference: row.theme_preference,
      createdAt: row.created_at,
    }
  }

  async findById(id: UUID): Promise<Result<Couple>> {
    const { data, error } = await supabaseBrowser
      .from('couples')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return { data: null, error: error.message }
    return { data: this.mapToEntity(data), error: null }
  }

  async findByInviteCode(code: string): Promise<Result<Couple>> {
    const { data, error } = await supabaseBrowser
      .from('couples')
      .select('*')
      .eq('invite_code', code)
      .single()

    if (error) return { data: null, error: error.message }
    return { data: this.mapToEntity(data), error: null }
  }

  async create(couple: Omit<Couple, 'id' | 'createdAt'>): Promise<Result<Couple>> {
    const { data, error } = await supabaseBrowser
      .from('couples')
      .insert({
        invite_code: couple.inviteCode,
        partner_1_id: couple.partner1Id,
        connection_date: couple.connectionDate,
        theme_preference: couple.themePreference,
      })
      .select()
      .single()

    if (error) return { data: null, error: error.message }
    return { data: this.mapToEntity(data), error: null }
  }

  async matchPartner(inviteCode: string, partnerId: UUID): Promise<Result<UUID>> {
    const { data, error } = await supabaseBrowser.rpc('match_couple', {
      p_invite_code: inviteCode,
    })

    if (error) return { data: null, error: error.message }
    return { data: data as UUID, error: null }
  }

  async updateTheme(id: UUID, theme: Couple['themePreference']): Promise<Result<void>> {
    const { error } = await supabaseBrowser
      .from('couples')
      .update({ theme_preference: theme })
      .eq('id', id)

    if (error) return { data: null, error: error.message }
    return { data: null, error: null }
  }
}
