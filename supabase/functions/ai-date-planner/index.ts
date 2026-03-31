// ============================================================
// ⚠️ DEPRECATED: 이 Edge Function은 더 이상 사용되지 않습니다.
// 
// 하네스 엔지니어링 루프가 /api/date-planner/route.ts 로 통합되었습니다.
// 이 파일은 레거시 참조용으로만 보존됩니다.
//
// 마이그레이션 날짜: 2026-04-01
// 이유: C-1(경로 이원화), C-2(모델명 불일치) QA 이슈 해결을 위해
//       모든 AI 호출을 단일 Next.js API Route로 통합
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (_req) => {
  return new Response(JSON.stringify({
    success: false,
    error: 'DEPRECATED: 이 Edge Function은 폐기되었습니다. /api/date-planner를 사용하세요.',
    migration: {
      newEndpoint: '/api/date-planner',
      reason: '하네스 엔지니어링 루프가 Next.js API Route로 통합됨',
      date: '2026-04-01'
    }
  }), {
    status: 410, // 410 Gone
    headers: { 'Content-Type': 'application/json' }
  })
})
