// ============================================================
// ScheduleUseCase - 일정 CRUD 유즈케이스
// ============================================================
import { supabaseBrowser } from '@/infrastructure/supabase/client'
import { Schedule } from '@/domain/schedule/entities/Schedule'
import { UUID, Result } from '@/domain/shared/types'

const IS_MOCK_UUID = (id: string) => id.startsWith('00000000-0000-0000-0000-000000000');

export class ScheduleUseCase {
  // 해당 월의 커플 일정 조회
  async getMonthlySchedules(coupleId: UUID, year: number, month: number): Promise<Result<Schedule[]>> {
    if (IS_MOCK_UUID(coupleId)) {
      console.log('[ScheduleUseCase] Mock mode: skipping fetch');
      return { data: [], error: null };
    }

    const startDate = new Date(year, month - 1, 1).toISOString()
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString()

    const { data, error } = await supabaseBrowser
      .from('schedules')
      .select('*')
      .eq('couple_id', coupleId)
      .gte('start_datetime', startDate)
      .lte('start_datetime', endDate)
      .order('start_datetime', { ascending: true })

    if (error) return { data: null, error: error.message }
    return { data: data as Schedule[], error: null }
  }

  // 일정 생성
  async createSchedule(schedule: Omit<Schedule, 'id' | 'createdAt'>): Promise<Result<Schedule>> {
    if (IS_MOCK_UUID(schedule.coupleId)) {
      console.log('[ScheduleUseCase] Mock mode: simulating create success');
      return { 
        data: { ...schedule, id: crypto.randomUUID(), createdAt: new Date().toISOString() } as Schedule, 
        error: null 
      };
    }

    const { data, error } = await supabaseBrowser
      .from('schedules')
      .insert({
        couple_id: schedule.coupleId,
        creator_id: schedule.creatorId,
        title: schedule.title,
        description: schedule.description,
        start_datetime: schedule.startDatetime,
        end_datetime: schedule.endDatetime,
        is_all_day: schedule.isAllDay,
        location_data: schedule.locationData,
        schedule_type: schedule.scheduleType,
      })
      .select()
      .single()

    if (error) return { data: null, error: error.message }
    return { data: data as Schedule, error: null }
  }

  // 일정 수정
  async updateSchedule(id: UUID, data: Partial<Schedule>): Promise<Result<Schedule>> {
    const { data: updated, error } = await supabaseBrowser
      .from('schedules')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) return { data: null, error: error.message }
    return { data: updated as Schedule, error: null }
  }

  // 일정 삭제
  async deleteSchedule(id: UUID): Promise<Result<void>> {
    if (id.length > 36) { // Mock ID 형태 체크 (임시)
       return { data: null, error: null };
    }

    const { error } = await supabaseBrowser
      .from('schedules')
      .delete()
      .eq('id', id)

    if (error) return { data: null, error: error.message }
    return { data: null, error: null }
  }
}

export const scheduleUseCase = new ScheduleUseCase()
