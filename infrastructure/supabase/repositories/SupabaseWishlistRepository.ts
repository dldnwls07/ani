import { supabaseBrowser } from '../client'
import { WishItem, WishCategory } from '@/domain/wishlist/entities/WishItem'
import { IWishlistRepository } from '@/domain/wishlist/repositories/IWishlistRepository'
import { UUID, Result } from '@/domain/shared/types'

export class SupabaseWishlistRepository implements IWishlistRepository {
  private mapToEntity(row: any): WishItem {
    return {
      id: row.id,
      coupleId: row.couple_id,
      creatorId: row.creator_id,
      title: row.title,
      pioneerUrl: row.pioneer_url,
      category: row.category as WishCategory,
      agreedBy: row.agreed_by,
      createdAt: row.created_at,
    }
  }

  async findByCoupleId(coupleId: UUID): Promise<Result<WishItem[]>> {
    const { data, error } = await supabaseBrowser
      .from('wishlists')
      .select('*')
      .eq('couple_id', coupleId)
      .order('created_at', { ascending: false })

    if (error) return { data: null, error: error.message }
    return { data: (data || []).map(this.mapToEntity), error: null }
  }

  async create(wish: Omit<WishItem, 'id' | 'createdAt' | 'agreedBy'>): Promise<Result<WishItem>> {
    const { data, error } = await supabaseBrowser
      .from('wishlists')
      .insert({
        couple_id: wish.coupleId,
        creator_id: wish.creatorId,
        title: wish.title,
        pioneer_url: wish.pioneerUrl,
        category: wish.category,
        agreed_by: [],
      })
      .select()
      .single()

    if (error) return { data: null, error: error.message }
    return { data: this.mapToEntity(data), error: null }
  }

  async updateAgreedBy(id: UUID, agreedBy: UUID[]): Promise<Result<void>> {
    const { error } = await supabaseBrowser
      .from('wishlists')
      .update({ agreed_by: agreedBy })
      .eq('id', id)

    if (error) return { data: null, error: error.message }
    return { data: null, error: null }
  }

  async delete(id: UUID): Promise<Result<void>> {
    const { error } = await supabaseBrowser
      .from('wishlists')
      .delete()
      .eq('id', id)

    if (error) return { data: null, error: error.message }
    return { data: null, error: null }
  }
}
