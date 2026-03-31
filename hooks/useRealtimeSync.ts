import { useEffect } from 'react'
import { useAuthStore } from './useAuthStore'
import { useCoupleStore } from './useCoupleStore'
import { supabaseBrowser } from '@/infrastructure/supabase/client'

export function useRealtimeSync() {
  const { user } = useAuthStore()
  const { couple, partner, setPartner } = useCoupleStore()

  useEffect(() => {
    if (!user || !couple || !partner) return

    // 개발 모드: 가짜 UUID일 때는 DB 호출 스킵
    const isDevMode = user.id.startsWith('00000000')
    if (isDevMode) {
      console.log('[DEV] Realtime sync skipped (mock mode)')
      return
    }

    const channel = supabaseBrowser
      .channel(`partner-status-${partner.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${partner.id}` },
        (payload: any) => {
          if (payload.new) {
            setPartner({
              ...partner,
              statusMessage: payload.new.status_message,
              statusUpdatedAt: payload.new.status_updated_at
            })
          }
        }
      )
      .subscribe()

    return () => { 
      supabaseBrowser.removeChannel(channel) 
    }
  }, [user, couple, partner, setPartner])
}
