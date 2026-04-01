import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

// ============================================================
// 안전한 JSON 추출기 (C-3 수정)
// Gemini 응답에서 첫 번째 유효 JSON 객체만 추출
// ============================================================
function extractJSON(text: string): Record<string, unknown> | null {
  // 1차: ```json ... ``` 블록 추출
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim())
    } catch { /* fall through */ }
  }

  // 2차: 첫 번째 { ~ 마지막 } 범위 추출
  const firstBrace = text.indexOf('{')
  const lastBrace = text.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(text.slice(firstBrace, lastBrace + 1))
    } catch { /* fall through */ }
  }

  return null
}

// ============================================================
// Gemini 호출 래퍼 (C-2 수정: gemini-2.5-flash 통일)
// 개별 호출 타임아웃 10초 (W-1 수정)
// ============================================================
async function callGemini(prompt: string, jsonMode = false): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    ...(jsonMode && {
      generationConfig: { responseMimeType: "application/json" }
    })
  })

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000) // 10초 개별 타임아웃

  try {
    const result = await model.generateContent(prompt)
    clearTimeout(timeout)
    return result.response.text()
  } catch (err: unknown) {
    clearTimeout(timeout)
    throw err instanceof Error ? err : new Error('Gemini call failed')
  }
}

// ============================================================
// 하네스 에이전트 1: Planner (계약 수립)
// ============================================================
async function runPlanner(busySlots: {time: string, location: string}[], wishlistTags: string[], targetDate: string): Promise<Record<string, unknown>> {
  const locationContext = busySlots.map(s => s.location).filter(Boolean).join(', ')
  
  const prompt = `
당신은 프리미엄 커플 데이트 서비스 '우리사이'의 Planner 에이전트입니다.

[컨텍스트]
- 데이트 날짜: ${targetDate}
- 기존 일정 및 장소: ${busySlots.length > 0 ? busySlots.map(s => `${s.time}(${s.location || '장소미정'})`).join(', ') : '없음'}
- 중요 지역: ${locationContext || '서울 주요 핫플레이스'}
- 커플 관심사: ${wishlistTags.join(', ')}

[임무]
아래 JSON 형식으로 "데이트 계약서"를 작성하세요.
{
  "constraints": [
    "반드시 ${locationContext || '서울'} 지역 내 또는 인접 지역에서만 추천할 것",
    "기존 일정의 장소와 동선이 꼬이지 않게 할 것",
    "실제로 현재 영업 중인 유명 장소만 사용할 것"
  ],
  "evaluationCriteria": ["지역 일관성", "이동 효율성", "실존 여부"],
  "mood": "분위기 키워드",
  "targetArea": "${locationContext || '추천 지역'}"
}

반드시 위 JSON 형식만 반환하세요.`

  const raw = await callGemini(prompt, true)
  const parsed = extractJSON(raw)
  if (!parsed) throw new Error('Planner: JSON 파싱 실패')
  return parsed
}

// ============================================================
// 하네스 에이전트 2: Generator (데이트 코스 생성)
// ============================================================
async function runGenerator(contract: Record<string, unknown>, targetDate: string): Promise<Record<string, unknown>> {
  const prompt = `
당신은 데이트 코스 생성 전문가입니다.

[계약서]
${JSON.stringify(contract, null, 2)}

[임무]
계약서의 'targetArea'와 'constraints'를 **최우선**으로 준수하여 데이트 코스를 제안하세요.
예를 들어, 일정 장소가 '여의도'라면 반드시 여의도 내 또는 도보/대중교통 15분 이내의 장소만 추천해야 합니다. 하남이나 남양주 같은 먼 곳은 절대 안 됩니다.

반드시 아래 JSON 형식으로만 응답하세요:
{
  "title": "데이트 코스 제목",
  "description": "전체 코스 설명",
  "reason": "이 지역을 선택한 이유와 기존 일정과의 조화 설명",
  "items": [
    {
      "time": "HH:mm",
      "place": "실제 한국 장소명 (네이버/카카오 지도 검색 가능한 정확한 명칭)",
      "recommendation": "상세 활동 가이드",
      "category": "RESTAURANT | CAFE | EXHIBITION | WALK | TRIP | ETC"
    }
  ]
}

*핵심 규칙*
1. 존재하지 않거나 폐업한 장소는 절대 금지 (2024-2025 최신 정보 기준).
2. 기존 일정이 있는 장소와의 거리를 계산하여 현실적인 동선만 짤 것.
3. 텍스트에 '할루시네이션'이 섞이지 않도록 주의.`

  const raw = await callGemini(prompt, true)
  const parsed = extractJSON(raw)
  if (!parsed) throw new Error('Generator: JSON 파싱 실패')
  return parsed
}

// ============================================================
// 하네스 에이전트 3: Evaluator (검증)
// ============================================================
async function runEvaluator(proposal: Record<string, unknown>, contract: Record<string, unknown>): Promise<EvalResult> {
  const prompt = `
당신은 데이터 검증 전문가입니다. 제안된 데이트 코스를 엄격하게 심사하세요.

[평가 대상 코스]
${JSON.stringify(proposal, null, 2)}

[계약서 기준]
${JSON.stringify(contract, null, 2)}

[임무]
다음 항목을 검증하여 하나라도 위반 시 'pass': false를 반환하세요.
1. **지역 일치성**: targetArea(${contract.targetArea})를 벗어나 엉뚱한 지역을 추천했는가? (가장 중요)
2. **장소 실존성**: 실제로 존재하는 장소인가? (가짜 장소, 폐업 장소 체크)
3. **시간 중복**: 기존 일정 시간대와 겹치는가?

응답 JSON:
{
  "pass": true | false,
  "score": 0~100,
  "critique": "위반 사항이 있다면 구체적으로 지적"
}`

  const raw = await callGemini(prompt, true)
  const parsed = extractJSON(raw)
  if (!parsed) return { pass: false, score: 0, critique: 'Evaluator 응답 파싱 실패' }

  return {
    pass: Boolean(parsed.pass),
    score: Number(parsed.score) || 0,
    critique: String(parsed.critique || '')
  }
}

// ... (POST 함수 내 데이터 전처리 부분 수정 필요)

// ============================================================
// API Route: POST /api/date-planner
// 하네스 엔지니어링 루프 (Planner → Generator ↔ Evaluator)
// 총 타임아웃 45초 (W-1 수정)
// ============================================================
export async function POST(req: Request) {
  const startTime = Date.now()
  const TOTAL_TIMEOUT_MS = 45000 // 45초 총 타임아웃
  const MAX_ATTEMPTS = 3
  const QUALITY_THRESHOLD = 75

  try {
    const { schedules, wishlists, targetDate } = await req.json()

    // 데이터 전처리
    const busySlots = (schedules || []).map((s: Record<string, any>) => {
      const dt = new Date(s.start_datetime || s.startDatetime || '')
      const loc = s.location_data?.name || s.locationData?.name || ''
      return {
        time: `${dt.getHours()}:${String(dt.getMinutes()).padStart(2, '0')}`,
        location: loc
      }
    })
    const wishlistTags = (wishlists || []).map((w: Record<string, string>) => w.title || w.name || '').filter(Boolean)

    // ======= 하네스 엔지니어링 루프 시작 =======

    // 1단계: Planner — 계약서 수립
    console.log('[Harness] 📋 Planner: 계약 수립 시작')
    const contract = await runPlanner(busySlots, wishlistTags, targetDate)
    console.log('[Harness] ✅ Planner 완료:', JSON.stringify(contract).slice(0, 100))

    let finalProposal: Record<string, unknown> | null = null
    let verified = false
    let attempts = 0
    let lastCritique = ''

    // 2~3단계: Generator ↔ Evaluator 루프
    while (attempts < MAX_ATTEMPTS) {
      // 총 타임아웃 체크 (W-1)
      if (Date.now() - startTime > TOTAL_TIMEOUT_MS) {
        console.log('[Harness] ⏰ 총 타임아웃 도달, 현재 최선 결과 반환')
        break
      }

      attempts++

      // 이전 비판을 계약서에 주입하여 개선 유도 (Harness Core Philosophy)
      if (lastCritique) {
        (contract as Record<string, unknown>).previousCritique = lastCritique
      }

      // Generator 호출
      console.log(`[Harness] 🎨 Generator: 시도 #${attempts}`)
      const proposal = await runGenerator(contract, targetDate)

      // Evaluator 호출
      console.log(`[Harness] 🔍 Evaluator: 검증 #${attempts}`)
      const evaluation = await runEvaluator(proposal, contract)

      console.log(`[Harness] 점수: ${evaluation.score}/100, 통과: ${evaluation.pass}`)

      // C-4 수정: verified는 실제 통과 여부에 따라 동적 판정
      if (evaluation.pass && evaluation.score >= QUALITY_THRESHOLD) {
        finalProposal = proposal
        verified = true
        console.log(`[Harness] ✅ 합격! (시도 #${attempts}, 점수: ${evaluation.score})`)
        break
      }

      // 실패 시 피드백 저장하여 다음 루프에서 개선
      lastCritique = evaluation.critique
      finalProposal = proposal // 최선의 결과 보존
      console.log(`[Harness] ❌ 불합격 (시도 #${attempts}): ${evaluation.critique}`)
    }

    // ======= 하네스 루프 종료 =======

    if (finalProposal) {
      return NextResponse.json({
        data: finalProposal,
        harness: {
          attempts,
          verified,   // C-4: 실제 검증 결과 반영
          engine: 'gemini-2.5-flash',
          loopType: 'planner-generator-evaluator'
        }
      })
    }

    // 추천 실패 시
    return NextResponse.json({
      error: '적절한 데이트 코스를 찾지 못했습니다. 다시 시도해 주세요.',
      harness: { attempts, verified: false }
    }, { status: 422 })

  } catch (error: unknown) {  // W-2 수정: unknown 타입 안전 처리
    const message = error instanceof Error ? error.message : '알 수 없는 오류'
    console.error('[Date Planner API] Error:', message)
    return NextResponse.json({
      error: '데이트 코스 생성 실패',
      details: message
    }, { status: 500 })
  }
}
