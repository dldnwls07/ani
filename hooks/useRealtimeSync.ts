import { useEffect } from 'react'
import { useAuthStore } from './useAuthStore'
import { useCoupleStore } from './useCoupleStore'

// 개발 모드에서는 실제 DB 호출을 하지 않음
// 나중에 실제 인증이 붙으면 Supabase Realtime 구독으로 교체
export function useRealtimeSync() {
  const { user } = useAuthStore()
  const { couple } = useCoupleStore()

  useEffect(() => {
    if (!user || !couple) return

    // 개발 모드: 가짜 UUID일 때는 DB 호출 스킵
    const isDevMode = user.id.startsWith('00000000')
    if (isDevMode) {
      console.log('[DEV] Realtime sync skipped (mock mode)')
      return
    }

    // TODO: 실제 인증 완료 후 아래 코드 활성화
    // const channel = supabaseBrowser
    //   .channel(`partner-status-${partnerId}`)
    //   .on('postgres_changes', { ... })
    //   .subscribe()
    // return () => { supabaseBrowser.removeChannel(channel) }
  }, [user, couple])
}
