// ============================================================
// AuthUseCase - 인증 관련 유즈케이스 (Repository 주입 버전)
// ============================================================
import { IAuthRepository, SupabaseAuthRepository } from '@/infrastructure/supabase/repositories/SupabaseAuthRepository'
import { User } from '@/domain/user/entities/User'
import { Result } from '@/domain/shared/types'

export class AuthUseCase {
  constructor(private authRepository: IAuthRepository = new SupabaseAuthRepository()) {}

  // 이메일/비밀번호 로그인
  async signIn(email: string, password: string): Promise<Result<User>> {
    return this.authRepository.signIn(email, password)
  }

  // 회원가입
  async signUp(email: string, password: string, nickname: string): Promise<Result<User>> {
    return this.authRepository.signUp(email, password, nickname)
  }

  // 로그아웃
  async signOut(): Promise<Result<void>> {
    return this.authRepository.signOut()
  }

  // 현재 세션 가져오기
  async getSession(): Promise<Result<any>> {
    return this.authRepository.getSession()
  }
}

export const authUseCase = new AuthUseCase()
