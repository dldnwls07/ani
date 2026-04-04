// ============================================================
// ScheduleUseCase - 일정 CRUD 유즈케이스
// ============================================================
import { supabaseBrowser } from '@/infrastructure/supabase/client'
import { Schedule } from '@/domain/schedule/entities/Schedule'
import { UUID, Result } from '@/domain/shared/types'

const IS_MOCK_UUID = (id: string) => id.startsWith('00000000-0000-0000-0000-000000000');

// Mock 모드용 인메모리 저장소
let mockSchedules: Schedule[] = [];

interface ScheduleRow {
  id: string
  couple_id: string
  creator_id: string
  title: string
  description: string | null
  start_datetime: string
  end_datetime: string
  is_all_day: boolean
  location_data: any
  schedule_type: string
  created_at: string
  updated_at: string
}

export class ScheduleUseCase {
  // DB snake_case 데이터를 도메인 entity(camelCase)로 변환
  private mapToEntity(row: ScheduleRow): Schedule {
    return {
      id: row.id,
      coupleId: row.couple_id,
      creatorId: row.creator_id,
      title: row.title,
      description: row.description || '',
      startDatetime: row.start_datetime,
      endDatetime: row.end_datetime,
      isAllDay: row.is_all_day,
      locationData: row.location_data,
      scheduleType: row.schedule_type as any,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  }

  // 해당 월의 커플 일정 조회
  async getMonthlySchedules(coupleId: UUID, year: number, month: number): Promise<Result<Schedule[]>> {
    if (IS_MOCK_UUID(coupleId)) {
      console.log('[ScheduleUseCase] Mock mode: returning in-memory schedules');
      const startDate = new Date(year, month - 1, 1, 0, 0, 0);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      
      const filtered = mockSchedules.filter(s => {
        const sStart = new Date(s.startDatetime);
        const sEnd = new Date(s.endDatetime);
        return sStart <= endDate && sEnd >= startDate;
      });
      return { data: filtered, error: null };
    }

    // 해당 월의 시작과 끝 (현지 시간 기준을 UTC ISO로 변환)
    const startDate = new Date(year, month - 1, 1, 0, 0, 0).toISOString()
    const endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString()

    // 겹치는 일정 조건: (일정 시작 <= 월 종료) AND (일정 종료 >= 월 시작)
    const { data, error } = await supabaseBrowser
      .from('schedules')
      .select('*')
      .eq('couple_id', coupleId)
      .lte('start_datetime', endDate)
      .gte('end_datetime', startDate)
      .order('start_datetime', { ascending: true })

    if (error) return { data: null, error: error.message }
    return { data: (data || []).map(row => this.mapToEntity(row as ScheduleRow)), error: null }
  }

  // 일정 생성
  async createSchedule(schedule: Omit<Schedule, 'id' | 'createdAt'>): Promise<Result<Schedule>> {
    if (IS_MOCK_UUID(schedule.coupleId)) {
      console.log('[ScheduleUseCase] Mock mode: persisting to in-memory store');
      const newSchedule: Schedule = { 
        ...schedule, 
        id: crypto.randomUUID(), 
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mockSchedules.push(newSchedule);
      return { data: newSchedule, error: null };
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
    return { data: this.mapToEntity(data as ScheduleRow), error: null }
  }

  // 일정 수정
  async updateSchedule(id: UUID, data: Partial<Schedule>): Promise<Result<Schedule>> {
    if (mockSchedules.some(s => s.id === id)) {
      console.log('[ScheduleUseCase] Mock mode: updating in-memory store');
      mockSchedules = mockSchedules.map(s => s.id === id ? { ...s, ...data, updatedAt: new Date().toISOString() } : s);
      const updated = mockSchedules.find(s => s.id === id)!;
      return { data: updated, error: null };
    }

    const updatePayload: Record<string, any> = {}
    if (data.title !== undefined) updatePayload.title = data.title
    if (data.description !== undefined) updatePayload.description = data.description
    if (data.startDatetime !== undefined) updatePayload.start_datetime = data.startDatetime
    if (data.endDatetime !== undefined) updatePayload.end_datetime = data.endDatetime
    if (data.isAllDay !== undefined) updatePayload.is_all_day = data.isAllDay
    if (data.locationData !== undefined) updatePayload.location_data = data.locationData
    if (data.scheduleType !== undefined) updatePayload.schedule_type = data.scheduleType

    const { data: updated, error } = await supabaseBrowser
      .from('profiles')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (error) return { data: null, error: error.message }
    return { data: this.mapToEntity(updated as any), error: null }
  }

  // 일정 삭제
  async deleteSchedule(id: UUID): Promise<Result<void>> {
    if (mockSchedules.some(s => s.id === id)) {
      console.log('[ScheduleUseCase] Mock mode: deleting from in-memory store');
      mockSchedules = mockSchedules.filter(s => s.id !== id);
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
