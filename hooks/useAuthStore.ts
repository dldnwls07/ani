import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@/domain/user/entities/User'

interface AuthState {
  user: User | null
  setUser: (user: User | null) => void
  isAuthenticated: boolean
}

// 개발용 가짜 유저 데이터 (진짜 UUID 형식 사용)
const MOCK_USER: User = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'dev@example.com',
  nickname: '지훈(DEV)',
  coupleId: '00000000-0000-0000-0000-000000000999',
  statusMessage: '개발 모드 활성 중 🚀',
  statusUpdatedAt: new Date().toISOString(),
  createdAt: new Date().toISOString()
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // 초기값 설정
      user: MOCK_USER,
      isAuthenticated: true,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
    }),
    {
      name: 'auth-storage-dev',
      // 하이드레이션 완료 시점에 데이터가 없으면 Mock 데이터 강제 주입
      onRehydrateStorage: () => (state) => {
        if (state && !state.user) {
          console.log('[AuthStore] Hydrated with null, forcing MOCK_USER')
          state.setUser(MOCK_USER)
        }
      }
    }
  )
)
