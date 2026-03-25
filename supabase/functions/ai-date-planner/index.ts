import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

// OpenAI API KEY (Supabase Secrets 연동 요망)
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

// 백엔드 통신용 어드민 클라이언트 생성 (RLS 우회)
const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

serve(async (req) => {
  try {
    const { couple_id, target_date } = await req.json()

    // 1. 해당 날짜의 커플 일정 조회
    const { data: schedules, error } = await supabase
      .from('schedules')
      .select('start_datetime, end_datetime, title')
      .eq('couple_id', couple_id)
      .gte('start_datetime', `${target_date}T00:00:00Z`)
      .lte('end_datetime', `${target_date}T23:59:59Z`)
      .order('start_datetime', { ascending: true })

    if (error) throw error

    // 2. 위시리스트 태그 조회
    const { data: wishlists } = await supabase
      .from('wishlists')
      .select('category, title')
      .eq('couple_id', couple_id)
      .limit(5)

    // 빈 시간 계산 로직 (간소화)
    const busySlots = schedules.map(s => `${new Date(s.start_datetime).getHours()}시~${new Date(s.end_datetime).getHours()}시`)
    const tags = wishlists ? wishlists.map(w => w.category).join(', ') : '맛집, 조용한곳'

    // 3. OpenAI API 호출 (데이트 코스 추천)
    const prompt = `
    당신은 커플 데이트 플래너입니다. 
    - 오늘 커플의 바쁜 시간: ${busySlots.join(', ') || '없음'}
    - 그들의 관심 태그: ${tags}
    
    비어있는 여유 시간을 파악하여, 20대 커플이 즐길 수 있는 창의적인 데이트 코스 1개를 짧게 제안해 주세요.
    결과는 반드시 JSON 형태의 배열로 응답해야 합니다. 
    예: { "recommendation": "오후 2시에 한남동 브런치 카페 방문", "time": "14:00" }
    `

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages: [{ role: 'system', content: prompt }],
        response_format: { type: "json_object" }
      })
    })

    const aiData = await aiResponse.json()
    const resultContent = JSON.parse(aiData.choices[0].message.content)

    return new Response(JSON.stringify({ success: true, data: resultContent }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error("AI Planner Error:", error)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }
})
