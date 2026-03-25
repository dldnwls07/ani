// ============================================================
// IScheduleRepository - Schedule 도메인 리포지토리 인터페이스
// ============================================================
import { Schedule } from '@/domain/schedule/entities/Schedule'
import { UUID, Result } from '@/domain/shared/types'

export interface IScheduleRepository {
  findByCoupleId(coupleId: UUID): Promise<Result<Schedule[]>>
  findByMonth(coupleId: UUID, year: number, month: number): Promise<Result<Schedule[]>>
  create(schedule: Omit<Schedule, 'id' | 'createdAt'>): Promise<Result<Schedule>>
  update(id: UUID, data: Partial<Schedule>): Promise<Result<Schedule>>
  delete(id: UUID): Promise<Result<void>>
}
