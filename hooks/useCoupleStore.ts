import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Couple } from '@/domain/couple/entities/Couple'
import { User } from '@/domain/user/entities/User'

interface CoupleState {
  couple: Couple | null
  partner: User | null
  setCouple: (couple: Couple | null) => void
  setPartner: (partner: User | null) => void
}

// 개발용 가짜 커플 & 파트너 데이터 (진짜 UUID 형식)
const MOCK_COUPLE: Couple = {
  id: '00000000-0000-0000-0000-000000000999',
  inviteCode: 'DEV999',
  partner1Id: '00000000-0000-0000-0000-000000000001',
  partner2Id: '00000000-0000-0000-0000-000000000002',
  connectionDate: '2024-01-01',
  themePreference: { primary: '#FF6B6B', secondary: '#4ECDC4' },
  isActive: true,
  createdAt: new Date().toISOString()
}

const MOCK_PARTNER: User = {
  id: '00000000-0000-0000-0000-000000000002',
  email: 'partner@example.com',
  nickname: '수아(DEV)',
  coupleId: '00000000-0000-0000-0000-000000000999',
  statusMessage: '공부 중 ✍️',
  statusUpdatedAt: new Date().toISOString(),
  createdAt: new Date().toISOString()
}

export const useCoupleStore = create<CoupleState>()(
  persist(
    (set) => ({
      // 초기값 설정
      couple: MOCK_COUPLE,
      partner: MOCK_PARTNER,
      setCouple: (couple) => set({ couple }),
      setPartner: (partner) => set({ partner }),
    }),
    {
      name: 'couple-storage-dev',
      // 하이드레이션 완료 시점에 데이터가 없으면 Mock 데이터 강제 주입
      onRehydrateStorage: () => (state) => {
        if (state && !state.couple) {
          console.log('[CoupleStore] Hydrated with null, forcing MOCK_COUPLE')
          state.setCouple(MOCK_COUPLE)
          state.setPartner(MOCK_PARTNER)
        }
      }
    }
  )
)
