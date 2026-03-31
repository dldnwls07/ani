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
async function runPlanner(busySlots: string[], wishlistTags: string[], targetDate: string): Promise<Record<string, unknown>> {
  const prompt = `
당신은 프리미엄 커플 데이트 서비스 '우리사이'의 Planner 에이전트입니다.

[컨텍스트]
- 데이트 날짜: ${targetDate}
- 바쁜 시간대: ${busySlots.length > 0 ? busySlots.join(', ') : '없음 (온종일 비어있음)'}
- 커플 관심사/위시리스트: ${wishlistTags.length > 0 ? wishlistTags.join(', ') : '특별한 선호 없음'}

[임무]
아래 JSON 형식으로 "데이트 계약서(Date Contract)"를 작성하세요.
{
  "constraints": ["시간 제약", "지역 제약", "예산 제약"],
  "evaluationCriteria": ["평가 기준 1", "평가 기준 2", "평가 기준 3"],
  "mood": "분위기 키워드",
  "area": "추천 지역"
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
당신은 프리미엄 커플 데이트 서비스 '우리사이'의 Generator 에이전트입니다.

[계약서]
${JSON.stringify(contract, null, 2)}

[임무]
위 계약서의 제약조건과 분위기에 맞는 구체적인 데이트 코스 1개를 제안하세요.
날짜: ${targetDate}

반드시 아래 JSON 형식으로만 응답하세요:
{
  "title": "데이트 코스 제목",
  "description": "전체 코스 설명",
  "reason": "이 코스를 추천하는 이유",
  "items": [
    {
      "time": "HH:mm",
      "place": "실제 한국 장소명 (구체적 지명)",
      "recommendation": "이 장소에서의 활동 조언",
      "category": "RESTAURANT | CAFE | EXHIBITION | WALK | TRIP | ETC"
    }
  ]
}

*규칙*
1. 서울/경기 지역의 실제 존재하는 장소명을 사용하세요.
2. 코스는 3~5개 아이템으로 구성하세요.
3. 계약서의 바쁜 시간대를 반드시 피해서 배치하세요.`

  const raw = await callGemini(prompt, true)
  const parsed = extractJSON(raw)
  if (!parsed) throw new Error('Generator: JSON 파싱 실패')
  return parsed
}

// ============================================================
// 하네스 에이전트 3: Evaluator (검증)
// ============================================================
interface EvalResult {
  pass: boolean
  score: number
  critique: string
}

async function runEvaluator(proposal: Record<string, unknown>, contract: Record<string, unknown>): Promise<EvalResult> {
  const prompt = `
당신은 프리미엄 커플 데이트 서비스 '우리사이'의 Evaluator 에이전트입니다.

[평가 대상 코스]
${JSON.stringify(proposal, null, 2)}

[계약서 기준]
${JSON.stringify(contract, null, 2)}

[임무]
위 코스가 계약서의 제약조건과 평가 기준을 충족하는지 엄격히 검증하세요.

검증 항목:
1. 장소가 현실적이고 실제로 존재할 가능성이 높은가?
2. 시간 배치가 논리적인가? (동선, 이동 시간)
3. 바쁜 시간대와 겹치지 않는가?
4. 전체적인 분위기와 흐름이 자연스러운가?

다음 JSON으로만 응답하세요:
{
  "pass": true 또는 false,
  "score": 0~100 사이 정수,
  "critique": "개선이 필요한 점 (pass가 true여도 작성)"
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
    const busySlots = (schedules || []).map((s: Record<string, string>) => {
      const dt = new Date(s.start_datetime || s.startDatetime || '')
      return `${dt.getHours()}:${String(dt.getMinutes()).padStart(2, '0')}`
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
