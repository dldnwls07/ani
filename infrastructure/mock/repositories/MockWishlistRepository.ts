import { WishItem, WishCategory } from '@/domain/wishlist/entities/WishItem'
import { IWishlistRepository } from '@/domain/wishlist/repositories/IWishlistRepository'
import { UUID, Result } from '@/domain/shared/types'

export class MockWishlistRepository implements IWishlistRepository {
  private mockWishlist: WishItem[] = [
    {
      id: '00000000-0000-0000-0000-000000000001' as UUID,
      coupleId: '00000000-0000-0000-0000-000000000000' as UUID,
      creatorId: '00000000-0000-0000-0000-000000000010' as UUID,
      title: 'Mock 데이트 코스 1',
      pioneerUrl: 'https://example.com/1',
      category: 'CAFE',
      agreedBy: [],
      createdAt: new Date().toISOString()
    }
  ]

  async findByCoupleId(coupleId: UUID): Promise<Result<WishItem[]>> {
    const list = this.mockWishlist.filter(w => w.coupleId === coupleId)
    return { data: list, error: null }
  }

  async create(wish: Omit<WishItem, 'id' | 'createdAt' | 'agreedBy'>): Promise<Result<WishItem>> {
    const newItem: WishItem = {
      id: crypto.randomUUID() as UUID,
      ...wish,
      agreedBy: [],
      createdAt: new Date().toISOString()
    }
    this.mockWishlist.push(newItem)
    return { data: newItem, error: null }
  }

  async updateAgreedBy(id: UUID, agreedBy: UUID[]): Promise<Result<void>> {
    const index = this.mockWishlist.findIndex(w => w.id === id)
    if (index !== -1) {
      this.mockWishlist[index].agreedBy = agreedBy
    }
    return { data: null, error: null }
  }

  async delete(id: UUID): Promise<Result<void>> {
    this.mockWishlist = this.mockWishlist.filter(w => w.id !== id)
    return { data: null, error: null }
  }
}
