// ============================================================
// 공유 도메인 타입 (Shared Domain Types)
// 모든 도메인에서 공통으로 사용하는 기본 타입 정의
// ============================================================

export type UUID = string

export interface BaseEntity {
  id: UUID
  createdAt: string
  updatedAt?: string
}

export interface Result<T> {
  data: T | null
  error: string | null
}
