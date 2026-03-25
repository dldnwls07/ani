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
    place: string
    recommendation: string
    category: string
  }[]
  reason: string
}

export class DatePlannerUseCase {
  async getAIRecommendation(coupleId: UUID, targetDate: string): Promise<Result<DateCourse>> {
    try {
      // 1. 해당 날짜 일정 조회
      const startDate = `${targetDate}T00:00:00Z`
      const endDate = `${targetDate}T23:59:59Z`
      
      const { data: schedules } = await supabaseBrowser
        .from('schedules')
        .select('*')
        .eq('couple_id', coupleId)
        .gte('start_datetime', startDate)
        .lte('start_datetime', endDate)

      const { data: wishlists } = await supabaseBrowser
        .from('wishlists')
        .select('*')
        .eq('couple_id', coupleId)
        .limit(10)

      // 3. 실제 Gemini 연동 API (/api/date-planner) 호출
      const response = await fetch('/api/date-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schedules: schedules || [],
          wishlists: wishlists || [],
          targetDate
        })
      })

      const { data, error, details } = await response.json()
      
      if (error) {
        console.error('[DatePlannerUseCase] API Error:', error, details)
        return { data: null, error: `${error} (${details || ''})` }
      }
      
      return { data, error: null }
    } catch (e: any) {
      return { data: null, error: e.message }
    }
  }
}

export const datePlannerUseCase = new DatePlannerUseCase()
