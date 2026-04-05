import { supabaseBrowser } from '../client'
import { User } from '@/domain/user/entities/User'
import { Result } from '@/domain/shared/types'

export interface IAuthRepository {
  signIn(email: string, password: string): Promise<Result<User>>
  signUp(email: string, password: string, nickname: string): Promise<Result<User>>
  signOut(): Promise<Result<void>>
  getSession(): Promise<Result<any>>
}

export class SupabaseAuthRepository implements IAuthRepository {
  async signIn(email: string, password: string): Promise<Result<User>> {
    const { data, error } = await supabaseBrowser.auth.signInWithPassword({
      email,
      password,
    })
    if (error) return { data: null, error: error.message }
    return { data: data.user as unknown as User, error: null }
  }

  async signUp(email: string, password: string, nickname: string): Promise<Result<User>> {
    const { data, error } = await supabaseBrowser.auth.signUp({
      email,
      password,
      options: { data: { nickname } },
    })
    if (error) return { data: null, error: error.message }
    return { data: data.user as unknown as User, error: null }
  }

  async signOut(): Promise<Result<void>> {
    const { error } = await supabaseBrowser.auth.signOut()
    if (error) return { error: error.message }
    return { error: null }
  }

  async getSession(): Promise<Result<any>> {
    const { data, error } = await supabaseBrowser.auth.getSession()
    if (error) return { data: null, error: error.message }
    return { data: data.session, error: null }
  }
}
