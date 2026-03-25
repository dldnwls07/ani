// ============================================================
// Schedule 도메인 엔티티
// ============================================================
import { BaseEntity, UUID } from '@/domain/shared/types'

export type ScheduleType = 'SHARED' | 'PRIVATE' | 'HIDDEN'

export interface LocationData {
  name: string
  lat?: number
  lng?: number
}

export interface Schedule extends BaseEntity {
  coupleId: UUID
  creatorId: UUID
  title: string
  description?: string
  startDatetime: string   // ISO datetime string
  endDatetime: string
  isAllDay: boolean
  locationData?: LocationData
  scheduleType: ScheduleType
}
