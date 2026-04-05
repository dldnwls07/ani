import { Couple } from '@/domain/couple/entities/Couple'
import { ICoupleRepository } from '@/domain/couple/repositories/ICoupleRepository'
import { UUID, Result } from '@/domain/shared/types'

export class MockCoupleRepository implements ICoupleRepository {
  private couples: Couple[] = [
    {
      id: '00000000-0000-0000-0000-000000000001' as UUID,
      inviteCode: 'MOCK123',
      partner1Id: '00000000-0000-0000-0000-000000000001' as UUID,
      partner2Id: '00000000-0000-0000-0000-000000000002' as UUID,
      connectionDate: '2024-01-01',
      themePreference: 'LIGHT',
      createdAt: new Date().toISOString()
    }
  ]

  async findById(id: UUID): Promise<Result<Couple>> {
    const couple = this.couples.find(c => c.id === id)
    if (!couple) return { data: null, error: '커플 정보를 찾을 수 없습니다.' }
    return { data: couple, error: null }
  }

  async findByInviteCode(code: string): Promise<Result<Couple>> {
    const couple = this.couples.find(c => c.inviteCode === code)
    if (!couple) return { data: null, error: '해당 코드를 가진 커플이 없습니다.' }
    return { data: couple, error: null }
  }

  async create(couple: Omit<Couple, 'id' | 'createdAt'>): Promise<Result<Couple>> {
    const newCouple: Couple = {
      ...couple,
      id: crypto.randomUUID() as UUID,
      createdAt: new Date().toISOString()
    }
    this.couples.push(newCouple)
    return { data: newCouple, error: null }
  }

  async matchPartner(inviteCode: string): Promise<Result<UUID>> {
    const couple = this.couples.find(c => c.inviteCode === inviteCode)
    if (!couple) return { data: null, error: '유효하지 않은 초대 코드입니다.' }
    return { data: couple.id, error: null }
  }

  async updateTheme(id: UUID, theme: Couple['themePreference']): Promise<Result<void>> {
    const index = this.couples.findIndex(c => c.id === id)
    if (index === -1) return { data: null, error: '커플 정보를 찾을 수 없습니다.' }
    
    this.couples[index].themePreference = theme
    return { data: null, error: null }
  }
}
