import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// 이 Edge Function은 Supabase Database Webhook에 의해 호출됩니다.
// 예: schedules 테이블에 새로운 일정이 추가(INSERT)될 때 Zapier 메일/슬랙 알림 전송.

const ZAPIER_WEBHOOK_URL = Deno.env.get("ZAPIER_WEBHOOK_URL") || "https://hooks.zapier.com/hooks/catch/12345/abcde";

serve(async (req) => {
  try {
    // 보안 검증 (Supabase Webhook Secret)
    const authHeader = req.headers.get('Authorization')
    if (authHeader !== `Bearer ${Deno.env.get('SUPABASE_WEBHOOK_SECRET')}` && Deno.env.get('SUPABASE_WEBHOOK_SECRET')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      })
    }

    const payload = await req.json()
    const { type, table, record } = payload

    if (table === "schedules" && type === "INSERT") {
      const { title, start_datetime, couple_id } = record
      
      // Zapier 로 보낼 데이터 페이로드 구성
      const zapierPayload = {
        event: "new_schedule",
        couple_id,
        title,
        date: start_datetime,
        message: `커플 캘린더에 새로운 일정 "${title}"이(가) 등록되었습니다!`
      }

      console.log("Sending event to Zapier:", zapierPayload)

      // Zapier Webhook 호출
      const response = await fetch(ZAPIER_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(zapierPayload),
      })

      if (!response.ok) {
        throw new Error(`Zapier returned status: ${response.status}`)
      }

      return new Response(
        JSON.stringify({ success: true, message: "Successfully triggered Zapier webhook", data: zapierPayload }),
        { headers: { "Content-Type": "application/json" }, status: 200 }
      )
    }

    return new Response(
      JSON.stringify({ message: "Event ignored (not a relevant table/action)" }),
      { headers: { "Content-Type": "application/json" }, status: 200 }
    )
  } catch (err: any) {
    console.error("Zapier Webhook Processing Error:", err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    )
  }
})
