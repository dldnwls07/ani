import { Schedule, ScheduleType } from '@/domain/schedule/entities/Schedule'
import { IScheduleRepository } from '@/domain/schedule/repositories/IScheduleRepository'
import { UUID, Result } from '@/domain/shared/types'

export class MockScheduleRepository implements IScheduleRepository {
  private schedules: Schedule[] = []

  async findByCoupleId(coupleId: UUID): Promise<Result<Schedule[]>> {
    const filtered = this.schedules.filter(s => s.coupleId === coupleId)
    return { data: filtered, error: null }
  }

  async findByMonth(coupleId: UUID, year: number, month: number): Promise<Result<Schedule[]>> {
    const startDate = new Date(year, month - 1, 1, 0, 0, 0)
    const endDate = new Date(year, month, 0, 23, 59, 59, 999)

    const filtered = this.schedules.filter(s => {
      if (s.coupleId !== coupleId) return false
      const sStart = new Date(s.startDatetime)
      const sEnd = new Date(s.endDatetime)
      return sStart <= endDate && sEnd >= startDate
    })

    return { data: filtered, error: null }
  }

  async create(schedule: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<Result<Schedule>> {
    const newSchedule: Schedule = {
      ...schedule,
      id: crypto.randomUUID() as UUID,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    this.schedules.push(newSchedule)
    return { data: newSchedule, error: null }
  }

  async update(id: UUID, data: Partial<Schedule>): Promise<Result<Schedule>> {
    const index = this.schedules.findIndex(s => s.id === id)
    if (index === -1) return { data: null, error: '일정을 찾을 수 없습니다.' }

    this.schedules[index] = {
      ...this.schedules[index],
      ...data,
      updatedAt: new Date().toISOString()
    }
    return { data: this.schedules[index], error: null }
  }

  async delete(id: UUID): Promise<Result<void>> {
    const initialLength = this.schedules.length
    this.schedules = this.schedules.filter(s => s.id !== id)
    
    if (this.schedules.length === initialLength) {
      return { data: null, error: '삭제할 일정을 찾을 수 없습니다.' }
    }
    return { data: null, error: null }
  }
}
