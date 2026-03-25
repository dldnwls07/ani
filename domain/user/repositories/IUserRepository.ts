// ============================================================
// IUserRepository - User 도메인 리포지토리 인터페이스
// Infrastructure 계층이 반드시 구현해야 하는 계약
// ============================================================
import { User } from '@/domain/user/entities/User'
import { UUID, Result } from '@/domain/shared/types'

export interface IUserRepository {
  findById(id: UUID): Promise<Result<User>>
  findByEmail(email: string): Promise<Result<User>>
  create(user: Omit<User, 'id' | 'createdAt'>): Promise<Result<User>>
  update(id: UUID, data: Partial<User>): Promise<Result<User>>
  updateStatus(id: UUID, message: string): Promise<Result<void>>
}
