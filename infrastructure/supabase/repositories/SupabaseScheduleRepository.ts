import { supabaseBrowser } from '../client'
import { Schedule, ScheduleType } from '@/domain/schedule/entities/Schedule'
import { IScheduleRepository } from '@/domain/schedule/repositories/IScheduleRepository'
import { UUID, Result } from '@/domain/shared/types'

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

export class SupabaseScheduleRepository implements IScheduleRepository {
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
      scheduleType: row.schedule_type as ScheduleType,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  }

  async findByCoupleId(coupleId: UUID): Promise<Result<Schedule[]>> {
    const { data, error } = await supabaseBrowser
      .from('schedules')
      .select('*')
      .eq('couple_id', coupleId)
      .order('start_datetime', { ascending: true })

    if (error) return { data: null, error: error.message }
    return { data: (data || []).map(row => this.mapToEntity(row as ScheduleRow)), error: null }
  }

  async findByMonth(coupleId: UUID, year: number, month: number): Promise<Result<Schedule[]>> {
    const startDate = new Date(year, month - 1, 1, 0, 0, 0).toISOString()
    const endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString()

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

  async create(schedule: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<Result<Schedule>> {
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

  async update(id: UUID, data: Partial<Schedule>): Promise<Result<Schedule>> {
    const updatePayload: Record<string, any> = {}
    if (data.title !== undefined) updatePayload.title = data.title
    if (data.description !== undefined) updatePayload.description = data.description
    if (data.startDatetime !== undefined) updatePayload.start_datetime = data.startDatetime
    if (data.endDatetime !== undefined) updatePayload.end_datetime = data.endDatetime
    if (data.isAllDay !== undefined) updatePayload.is_all_day = data.isAllDay
    if (data.locationData !== undefined) updatePayload.location_data = data.locationData
    if (data.scheduleType !== undefined) updatePayload.schedule_type = data.scheduleType
    
    updatePayload.updated_at = new Date().toISOString()

    const { data: updated, error } = await supabaseBrowser
      .from('schedules') // 오타 수정: profiles -> schedules
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (error) return { data: null, error: error.message }
    return { data: this.mapToEntity(updated as ScheduleRow), error: null }
  }

  async delete(id: UUID): Promise<Result<void>> {
    const { error } = await supabaseBrowser
      .from('schedules')
      .delete()
      .eq('id', id)

    if (error) return { data: null, error: error.message }
    return { data: null, error: null }
  }
}
