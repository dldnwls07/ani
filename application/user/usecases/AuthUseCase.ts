// ============================================================
// AuthUseCase - 인증 관련 유즈케이스
// ============================================================
import { supabaseBrowser } from '@/infrastructure/supabase/client'

export class AuthUseCase {
  // 이메일/비밀번호 로그인
  async signIn(email: string, password: string) {
    const { data, error } = await supabaseBrowser.auth.signInWithPassword({
      email,
      password,
    })
    if (error) return { data: null, error: error.message }
    return { data: data.user, error: null }
  }

  // 회원가입
  async signUp(email: string, password: string, nickname: string) {
    const { data, error } = await supabaseBrowser.auth.signUp({
      email,
      password,
      options: { data: { nickname } },
    })
    if (error) return { data: null, error: error.message }
    return { data: data.user, error: null }
  }

  // 로그아웃
  async signOut() {
    const { error } = await supabaseBrowser.auth.signOut()
    if (error) return { error: error.message }
    return { error: null }
  }

  // 구글 로그인
  async signInWithGoogle() {
    const { data, error } = await supabaseBrowser.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) return { error: error.message }
    return { data, error: null }
  }

  // 현재 세션 가져오기
  async getSession() {
    const { data, error } = await supabaseBrowser.auth.getSession()
    if (error) return { data: null, error: error.message }
    return { data: data.session, error: null }
  }
}

export const authUseCase = new AuthUseCase()
