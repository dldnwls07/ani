// ============================================================
// ScheduleUseCase - 일정 CRUD 유즈케이스 (Repository 주입 버전)
// ============================================================
import { Schedule } from '@/domain/schedule/entities/Schedule'
import { IScheduleRepository } from '@/domain/schedule/repositories/IScheduleRepository'
import { SupabaseScheduleRepository } from '@/infrastructure/supabase/repositories/SupabaseScheduleRepository'
import { UUID, Result } from '@/domain/shared/types'

export class ScheduleUseCase {
  constructor(
    private scheduleRepository: IScheduleRepository = new SupabaseScheduleRepository()
  ) {}

  // 해당 월의 커플 일정 조회
  async getMonthlySchedules(coupleId: UUID, year: number, month: number): Promise<Result<Schedule[]>> {
    return this.scheduleRepository.findByMonth(coupleId, year, month)
  }

  // 일정 생성
  async createSchedule(schedule: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<Result<Schedule>> {
    return this.scheduleRepository.create(schedule)
  }

  // 일정 수정
  async updateSchedule(id: UUID, data: Partial<Schedule>): Promise<Result<Schedule>> {
    return this.scheduleRepository.update(id, data)
  }

  // 일정 삭제
  async deleteSchedule(id: UUID): Promise<Result<void>> {
    return this.scheduleRepository.delete(id)
  }
}

export const scheduleUseCase = new ScheduleUseCase()
