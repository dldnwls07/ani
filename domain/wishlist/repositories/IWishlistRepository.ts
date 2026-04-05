// ============================================================
// IWishlistRepository - Wishlist 도메인 리포지토리 인터페이스
// ============================================================
import { WishItem } from '@/domain/wishlist/entities/WishItem'
import { UUID, Result } from '@/domain/shared/types'

export interface IWishlistRepository {
  findByCoupleId(coupleId: UUID): Promise<Result<WishItem[]>>
  create(wish: Omit<WishItem, 'id' | 'createdAt' | 'agreedBy'>): Promise<Result<WishItem>>
  updateAgreedBy(id: UUID, agreedBy: UUID[]): Promise<Result<void>>
  delete(id: UUID): Promise<Result<void>>
}
