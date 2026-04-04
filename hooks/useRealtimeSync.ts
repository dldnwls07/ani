import { useEffect } from 'react'
import { useAuthStore } from './useAuthStore'
import { useCoupleStore } from './useCoupleStore'
import { supabaseBrowser } from '@/infrastructure/supabase/client'

/**
 * useRealtimeSync - 파트너의 상태 변화 및 실시간 인터랙션(콕 찌르기, 하트 등)을 감지합니다.
 */
export function useRealtimeSync() {
  const { user } = useAuthStore()
  const { couple, partner, setPartner } = useCoupleStore()

  useEffect(() => {
    if (!user || !couple || !partner) return

    // 1. 개발 모드 체크
    const isDevMode = user.id.startsWith('00000000')
    if (isDevMode) return

    // 2. 실시간 채널 생성 (커플 전용 채널)
    const channel = supabaseBrowser.channel(`couple-realtime-${couple.id}`)

    // [A] 파트너 프로필 업데이트 감지 (DB 기반)
    channel.on(
      'postgres_changes',
      { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'profiles', 
        filter: `id=eq.${partner.id}` 
      },
      (payload: any) => {
        if (payload.new) {
          setPartner({
            ...partner,
            statusMessage: payload.new.status_message,
            statusUpdatedAt: payload.new.status_updated_at,
            nickname: payload.new.nickname,
            avatarUrl: payload.new.avatar_url
          })
        }
      }
    )

    // [B] 실시간 브로드캐스트 감지 (휘발성 인터랙션)
    channel.on(
      'broadcast',
      { event: 'interaction' },
      ({ payload }) => {
        // 내가 보낸 것은 무시
        if (payload.senderId === user.id) return

        // 전역 이벤트로 전파 (DashboardPage 등에서 수신)
        if (payload.type === 'poke') {
          window.dispatchEvent(new CustomEvent('partner-poke'))
        } else if (payload.type === 'heart') {
          window.dispatchEvent(new CustomEvent('partner-heart'))
        }
      }
    )

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[Realtime] Couple channel connected:', couple.id)
      }
    })

    return () => { 
      supabaseBrowser.removeChannel(channel) 
    }
  }, [user, couple, partner, setPartner])
}
