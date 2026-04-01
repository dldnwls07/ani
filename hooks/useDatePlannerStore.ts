import { create } from 'zustand'
import { datePlannerUseCase, DateCourse } from '@/application/schedule/usecases/DatePlannerUseCase'
import { UUID } from '@/domain/shared/types'

interface DatePlannerState {
  isGenerating: boolean
  isVerified: boolean
  result: DateCourse | null
  targetDate: string | null
  isModalOpen: boolean
  
  openModal: (date?: string) => void
  closeModal: () => void
  openResultModal: () => void
  generate: (coupleId: UUID, date: string) => Promise<void>
  clear: () => void
}

export const useDatePlannerStore = create<DatePlannerState>((set) => ({
  isGenerating: false,
  isVerified: false,
  result: null,
  targetDate: null,
  isModalOpen: false,

  openModal: (date) => set((state) => ({ 
    isModalOpen: true, 
    targetDate: date || state.targetDate || new Date().toISOString().split('T')[0] 
  })),
  
  closeModal: () => set({ isModalOpen: false }),

  // 결과 확인하기 버튼용 (오버레이 알림에서 모달을 열 때)
  openResultModal: () => set({ isModalOpen: true }),

  generate: async (coupleId, date) => {
    // 백그라운드 시작 시, 로딩 표시하고 기존 결과 초기화
    set({ isGenerating: true, targetDate: date, result: null, isVerified: false, isModalOpen: false })
    
    try {
      const { data, error } = await datePlannerUseCase.getAIRecommendation(coupleId, date)
      if (!error && data) {
        set({ isGenerating: false, result: data, isVerified: true }) // 완료 상태로 변경 (팝업 트리거)
      } else {
        set({ isGenerating: false, result: null })
        alert(error || '데이트 코스 생성에 실패했습니다.')
      }
    } catch (e) {
      console.error(e)
      set({ isGenerating: false, result: null })
    }
  },

  clear: () => set({ isGenerating: false, result: null, targetDate: null, isVerified: false, isModalOpen: false })
}))
