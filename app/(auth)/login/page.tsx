'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Heart, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react'
import { authUseCase } from '@/application/user/usecases/AuthUseCase'
import { supabaseBrowser } from '@/infrastructure/supabase/client'

type Mode = 'login' | 'signup'

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (mode === 'login') {
      const { data, error } = await authUseCase.signIn(email, password)
      if (error) { setError(error); setLoading(false); return }

      // 로그인 후 프로필 존재 여부 확인
      const { data: profile } = await supabaseBrowser
        .from('profiles')
        .select('couple_id')
        .eq('id', data!.id)
        .single()

      if (profile?.couple_id) {
        router.push('/dashboard')
      } else {
        router.push('/onboarding')
      }
    } else {
      const { data, error: signUpError } = await authUseCase.signUp(email, password, nickname)
      if (signUpError) { setError(signUpError); setLoading(false); return }

      if (!data) {
        setError('회원가입에 실패했습니다.')
        setLoading(false)
        return
      }

      // 프로필 생성 시도
      const { error: profileError } = await supabaseBrowser.from('profiles').insert({
        id: data.id,
        nickname,
      })

      if (profileError) {
        // 세션이 없는 경우 (이메일 인증 대기 중일 가능성 농후)
        console.error('Profile Update Error:', profileError)
        setError('인증 이메일을 보냈습니다! 이메일 확인 후 로그인해 주세요.')
        setLoading(false)
        return
      }

      router.push('/onboarding')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex items-center justify-center p-5">
      {/* 배경 블러 장식 */}
      <div className="absolute top-20 -left-20 w-72 h-72 bg-rose-200 rounded-full blur-3xl opacity-30 pointer-events-none" />
      <div className="absolute bottom-20 -right-20 w-72 h-72 bg-pink-200 rounded-full blur-3xl opacity-30 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm relative"
      >
        {/* 로고 */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-rose-400 to-pink-500 rounded-2xl shadow-lg mb-4"
          >
            <Heart className="w-8 h-8 text-white fill-white" />
          </motion.div>
          <h1 className="text-2xl font-extrabold text-gray-800">우리사이</h1>
          <p className="text-sm text-gray-400 mt-1">우리만의 공간</p>
        </div>

        {/* 탭 전환 */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          {(['login', 'signup'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null) }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                mode === m
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {m === 'login' ? '로그인' : '회원가입'}
            </button>
          ))}
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="relative"
            >
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="nickname"
                type="text"
                placeholder="닉네임"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent"
              />
            </motion.div>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="email"
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="password"
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent"
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-red-500 text-center bg-red-50 py-2 rounded-lg"
            >
              {error}
            </motion.p>
          )}

          <button
            id="submit-btn"
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-rose-400 to-pink-500 text-white font-semibold rounded-xl flex items-center justify-center space-x-2 hover:opacity-90 active:scale-[98%] transition-all shadow-md disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{mode === 'login' ? '로그인' : '시작하기'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* 구분선 */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-rose-50/50 px-2 text-gray-400">또는</span>
          </div>
        </div>

        {/* 소셜 로그인 버튼 */}
        <div className="space-y-3">
          <button
            id="google-login-btn"
            onClick={async () => {
              setLoading(true)
              const { error } = await authUseCase.signInWithGoogle()
              if (error) { setError(error); setLoading(false); }
            }}
            className="w-full py-3 bg-white border border-gray-200 rounded-xl flex items-center justify-center space-x-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 active:scale-[98%] transition-all shadow-sm"
          >
            <img src="https://www.gstatic.com/firebase/anonymous-scan/google.svg" alt="Google" className="w-5 h-5" />
            <span>Google로 계속하기</span>
          </button>
        </div>
      </motion.div>
    </div>
  )
}
