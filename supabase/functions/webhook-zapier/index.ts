import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// Zapier Webhook URL (환경 변수로 관리, .env.local 및 Supabase Dashboard Secrets에 등록 필수)
const ZAPIER_WEBHOOK_URL = Deno.env.get('ZAPIER_WEBHOOK_URL')

serve(async (req) => {
  try {
    const payload = await req.json()

    // 1. 트리거 유형 확인 (Supabase Database Webhook에서 전송된 데이터)
    const { type, record } = payload
    
    // 일정 생성(INSERT) 이벤트인 경우에만 처리
    if (type === 'INSERT' && record && record.title) {
      
      const notificationData = {
        title: "새로운 일정이 등록되었어요! 💖",
        message: `${record.title} (시작: ${new Date(record.start_datetime).toLocaleDateString()})`,
        couple_id: record.couple_id,
        creator_id: record.creator_id,
        timestamp: new Date().toISOString()
      }

      // 2. Zapier Webhook으로 데이터 전송
      const zapierResponse = await fetch(ZAPIER_WEBHOOK_URL!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationData)
      })

      if (!zapierResponse.ok) {
        throw new Error(`Zapier returned status: ${zapierResponse.status}`)
      }

      return new Response(
        JSON.stringify({ success: true, message: "Successfully triggered Zapier webhook." }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: false, message: "Ignored event type." }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error("Webhook processing failed:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
