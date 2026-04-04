// ============================================================
// DatePlannerUseCase - AI 데이트 조율 유즈케이스
// ============================================================
import { supabaseBrowser } from '@/infrastructure/supabase/client'
import { UUID, Result } from '@/domain/shared/types'

export interface DateCourse {
  title: string
  description: string
  items: {
    time: string
    endTime?: string
    place: string
    recommendation: string
    category: string
    isAI?: boolean
  }[]
  reason: string
}

export class DatePlannerUseCase {
  async getAIRecommendation(coupleId: UUID, targetDate: string): Promise<Result<DateCourse>> {
    try {
      // 1. 해당 날짜 일정 조회 (현지 시간 기준 하루 범위를 UTC로 변환하여 쿼리)
      const dayStart = new Date(targetDate)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(targetDate)
      dayEnd.setHours(23, 59, 59, 999)

      // 겹치는 일정 조건: (일정 시작 <= 하루 종료) AND (일정 종료 >= 하루 시작)
      const { data: schedules } = await supabaseBrowser
        .from('schedules')
        .select('*')
        .eq('couple_id', coupleId)
        .lte('start_datetime', dayEnd.toISOString())
        .gte('end_datetime', dayStart.toISOString())

      const { data: wishlists } = await supabaseBrowser
        .from('wishlists')
        .select('*')
        .eq('couple_id', coupleId)
        .limit(10)

      // 3. 실제 Gemini 연동 API (/api/date-planner) 호출
      // 클라이언트의 타임존 오프셋(분 단위)을 전달하여 서버에서 정확한 현지 시각 계산
      const timezoneOffset = new Date().getTimezoneOffset()

      const response = await fetch('/api/date-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schedules: schedules || [],
          wishlists: wishlists || [],
          targetDate,
          timezoneOffset
        })
      })

      const result = await response.json()
      
      if (result.error) {
        console.error('[DatePlannerUseCase] API Error:', result.error, result.details)
        return { data: null, error: `${result.error} (${result.details || ''})` }
      }
      
      return { data: result.data, error: null }
    } catch (e: unknown) {
      return { data: null, error: e instanceof Error ? e.message : 'Unknown error' }
    }
  }
}

export const datePlannerUseCase = new DatePlannerUseCase()
