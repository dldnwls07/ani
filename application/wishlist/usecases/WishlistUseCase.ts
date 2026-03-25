// ============================================================
// WishlistUseCase - 위시리스트 CRUD 및 비즈니스 로직
// ============================================================
import { supabaseBrowser } from '@/infrastructure/supabase/client'
import { WishItem, WishCategory } from '@/domain/wishlist/entities/WishItem'
import { UUID, Result } from '@/domain/shared/types'

const IS_MOCK_UUID = (id: string) => id.startsWith('00000000-0000-0000-0000-000000000');

export class WishlistUseCase {
  // 커플의 위시리스트 전체 조회
  async getWishlist(coupleId: UUID): Promise<Result<WishItem[]>> {
    if (IS_MOCK_UUID(coupleId)) {
      console.log('[WishlistUseCase] Mock mode: skipping fetch');
      return { data: [], error: null };
    }

    const { data, error } = await supabaseBrowser
      .from('wishlists')
      .select('*')
      .eq('couple_id', coupleId)
      .order('created_at', { ascending: false })

    if (error) return { data: null, error: error.message }
    
    // DB의 snake_case 대응
    const mapped: WishItem[] = data.map(item => ({
      id: item.id,
      coupleId: item.couple_id,
      creatorId: item.creator_id,
      title: item.title,
      pioneerUrl: item.pioneer_url,
      category: item.category as WishCategory,
      agreedBy: item.agreed_by,
      createdAt: item.created_at
    }))
    
    return { data: mapped, error: null }
  }

  // 위시 생성
  async createWish(wish: Omit<WishItem, 'id' | 'createdAt' | 'agreedBy'>): Promise<Result<WishItem>> {
    const { data, error } = await supabaseBrowser
      .from('wishlists')
      .insert({
        couple_id: wish.coupleId,
        creator_id: wish.creatorId,
        title: wish.title,
        pioneer_url: wish.pioneerUrl,
        category: wish.category,
        agreed_by: []
      })
      .select()
      .single()

    if (error) return { data: null, error: error.message }
    return { data: data as any, error: null }
  }

  // 좋아요(동의) 토글
  async toggleAgree(wishId: UUID, userId: UUID, currentAgreed: UUID[]): Promise<Result<UUID[]>> {
    let newAgreed: UUID[]
    if (currentAgreed.includes(userId)) {
      newAgreed = currentAgreed.filter(id => id !== userId)
    } else {
      newAgreed = [...currentAgreed, userId]
    }

    const { error } = await supabaseBrowser
      .from('wishlists')
      .update({ agreed_by: newAgreed })
      .eq('id', wishId)

    if (error) return { data: null, error: error.message }
    return { data: newAgreed, error: null }
  }

  // 위시 삭제
  async deleteWish(id: UUID): Promise<Result<void>> {
    const { error } = await supabaseBrowser
      .from('wishlists')
      .delete()
      .eq('id', id)

    if (error) return { data: null, error: error.message }
    return { data: null, error: null }
  }
}

export const wishlistUseCase = new WishlistUseCase()
