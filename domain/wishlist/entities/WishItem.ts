// ============================================================
// Wishlist 도메인 엔티티
// ============================================================
import { BaseEntity, UUID } from '@/domain/shared/types'

export type WishCategory = 'CAFE' | 'RESTAURANT' | 'EXHIBITION' | 'TRIP' | 'ETC'

export interface WishItem extends BaseEntity {
  coupleId: UUID
  creatorId: UUID
  title: string
  pioneerUrl?: string   // 인스타그램/블로그 링크
  category: WishCategory
  agreedBy: UUID[]      // 서로 '좋아요' 한 사람들의 ID 리스트
}
