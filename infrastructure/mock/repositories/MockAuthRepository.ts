import { User } from '@/domain/user/entities/User'
import { IAuthRepository } from '@/infrastructure/supabase/repositories/SupabaseAuthRepository'
import { Result, UUID } from '@/domain/shared/types'

export class MockAuthRepository implements IAuthRepository {
  private currentUser: User | null = null

  async signIn(email: string, password: string): Promise<Result<User>> {
    if (password === 'error') return { data: null, error: '비밀번호가 틀렸습니다.' }
    
    this.currentUser = {
      id: '00000000-0000-0000-0000-000000000001' as UUID,
      email,
      nickname: 'MockUser',
      createdAt: new Date().toISOString()
    } as User
    
    return { data: this.currentUser, error: null }
  }

  async signUp(email: string, password: string, nickname: string): Promise<Result<User>> {
    this.currentUser = {
      id: '00000000-0000-0000-0000-000000000001' as UUID,
      email,
      nickname,
      createdAt: new Date().toISOString()
    } as User
    
    return { data: this.currentUser, error: null }
  }

  async signOut(): Promise<Result<void>> {
    this.currentUser = null
    return { error: null }
  }

  async getSession(): Promise<Result<any>> {
    if (!this.currentUser) return { data: null, error: '세션이 없습니다.' }
    return { data: { user: this.currentUser }, error: null }
  }
}
