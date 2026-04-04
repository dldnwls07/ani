import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from 'next/server'

/**
 * ============================================================
 * 우리사이 AI 데이트 플래너 엔진 (Harness v3.0)
 * ============================================================
 * 아키텍처: Planner-Generator-[Place Validator]-Evaluator-Critic (PGVEC)
 * 모델: gemini-2.5-flash
 *
 * v3.0 변경사항:
 * - [Place Validator] 단계 추가: Generator가 제안한 장소를
 *   네이버 Local API + 카카오 Local API로 실제 검증
 * - 검증 실패 장소는 실존 대안으로 교체 후 Evaluator에 전달
 * - AI의 페르소나 기반 임의 추천 → 실존 데이터 기반 추천으로 전환
 */

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID?.trim() ?? ''
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET?.trim() ?? ''
const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY?.trim() ?? ''

// ============================================================
// 타입 정의
// ============================================================

interface BusySlot {
  time: string
  endTime: string
  location: string
  title: string
}

interface PlaceResult {
  name: string
  address: string
  roadAddress?: string
  category?: string
  phone?: string
  source: 'naver' | 'kakao'
}

interface DateItem {
  time: string
  place: string
  recommendation: string
  category: string
  address?: string
  verified?: boolean
}

// ============================================================
// JSON 추출 유틸리티
// ============================================================

function extractJSON(text: string): Record<string, any> | null {
  if (!text) return null
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const targetText = codeBlockMatch ? codeBlockMatch[1].trim() : text.trim()

  try {
    return JSON.parse(targetText)
  } catch {
    const firstBrace = targetText.indexOf('{')
    const lastBrace = targetText.lastIndexOf('}')
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(targetText.slice(firstBrace, lastBrace + 1))
      } catch {
        return null
      }
    }
  }
  return null
}

// ============================================================
// Gemini 호출 래퍼
// ============================================================

async function callGemini(prompt: string, jsonMode = false, timeoutMs = 15000): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    ...(jsonMode && {
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
        topP: 0.8,
        topK: 40
      }
    })
  })

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const result = await model.generateContent(prompt)
    clearTimeout(timeout)
    return result.response.text()
  } catch (err: unknown) {
    clearTimeout(timeout)
    const message = err instanceof Error ? err.message : 'Gemini call failed'
    throw new Error(message)
  }
}

// ============================================================
// 장소 검증 레이어 (네이버 + 카카오 이중 검증)
// ============================================================

/**
 * 네이버 지역 검색 API
 */
async function searchNaver(placeName: string, area?: string): Promise<PlaceResult[]> {
  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) return []

  const query = area ? `${placeName} ${area}` : placeName
  const url = `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}&display=3&sort=comment`

  try {
    const res = await fetch(url, {
      headers: {
        'X-Naver-Client-Id': NAVER_CLIENT_ID,
        'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
      },
    })
    if (!res.ok) return []

    const data = await res.json()
    return (data.items || []).map((item: any) => ({
      name: item.title.replace(/<\/?b>/g, ''),
      address: item.address || '',
      roadAddress: item.roadAddress || '',
      category: item.category || '',
      phone: item.telephone || '',
      source: 'naver' as const,
    }))
  } catch {
    return []
  }
}

/**
 * 카카오 키워드 장소 검색 API
 */
async function searchKakao(placeName: string, area?: string): Promise<PlaceResult[]> {
  if (!KAKAO_REST_API_KEY) return []

  const query = area ? `${area} ${placeName}` : placeName
  const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&size=3`

  try {
    const res = await fetch(url, {
      headers: { Authorization: `KakaoAK ${KAKAO_REST_API_KEY}` },
    })
    if (!res.ok) return []

    const data = await res.json()
    return (data.documents || []).map((doc: any) => ({
      name: doc.place_name,
      address: doc.address_name || '',
      roadAddress: doc.road_address_name || '',
      category: doc.category_name || '',
      phone: doc.phone || '',
      source: 'kakao' as const,
    }))
  } catch {
    return []
  }
}

/**
 * 장소명 유사도 비교 (간단한 포함 관계)
 */
function isNameMatch(proposed: string, found: string): boolean {
  const p = proposed.replace(/\s/g, '').toLowerCase()
  const f = found.replace(/\s/g, '').toLowerCase()
  if (p === f) return true
  if (f.includes(p) || p.includes(f)) return true
  // 앞 70% 매칭
  if (p.length > 2 && f.includes(p.slice(0, Math.floor(p.length * 0.7)))) return true
  return false
}

/**
 * [Place Validator] AI가 제안한 장소 목록을 네이버+카카오 이중 검증하여
 * 실존 정보로 교체 또는 제거합니다.
 */
async function validateAndEnrichPlaces(
  items: DateItem[],
  area?: string
): Promise<{ enrichedItems: DateItem[]; report: string }> {
  const enrichedItems: DateItem[] = []
  const reportLines: string[] = [`[Place Validator] 검증 대상: ${items.length}개 장소`]

  for (const item of items) {
    const placeName = item.place
    // 네이버 + 카카오 병렬 검색
    const [naverResults, kakaoResults] = await Promise.all([
      searchNaver(placeName, area),
      searchKakao(placeName, area),
    ])

    // 중복 제거 병합 (네이버 우선)
    const allResults: PlaceResult[] = [...naverResults]
    for (const r of kakaoResults) {
      const dup = allResults.some(
        (n) => n.name.replace(/\s/g, '') === r.name.replace(/\s/g, '')
      )
      if (!dup) allResults.push(r)
    }

    // 정확한 매칭 탐색
    const matched = allResults.find((r) => isNameMatch(placeName, r.name))

    if (matched) {
      // 검증 성공: 실존 데이터로 교체
      enrichedItems.push({
        ...item,
        place: matched.name, // 정확한 장소명으로 교체
        address: matched.roadAddress || matched.address,
        verified: true,
      })
      reportLines.push(`  ✅ "${placeName}" → "${matched.name}" (${matched.source}) [${matched.roadAddress || matched.address}]`)
    } else if (allResults.length > 0) {
      // 부분 매칭: 가장 유사한 후보로 대체
      const best = allResults[0]
      enrichedItems.push({
        ...item,
        place: best.name,
        address: best.roadAddress || best.address,
        verified: true,
      })
      reportLines.push(`  ⚠️ "${placeName}" → 대체 장소 "${best.name}" (${best.source}) [${best.roadAddress || best.address}]`)
    } else {
      // 검증 실패: 해당 장소는 목록에서 제거 (Evaluator가 재생성 요청)
      reportLines.push(`  ❌ "${placeName}" → 검증 실패, 목록에서 제외`)
      // 검증 실패 항목은 enrichedItems에 추가하지 않음
    }
  }

  const report = reportLines.join('\n')
  console.log(report)
  return { enrichedItems, report }
}

// ============================================================
// PGVEC 에이전트 루프
// ============================================================

/**
 * [Agent 1] Planner: 데이트의 전략적 방향성 설정
 */
async function runPlanner(
  busySlots: BusySlot[],
  wishlistTags: string[],
  targetDate: string
): Promise<Record<string, any>> {
  const locationContext = busySlots.map((s) => s.location || s.title).filter(Boolean).join(', ')
  const busyContext = busySlots.map((s) => `${s.time}~${s.endTime} ${s.title}`).join(', ')

  const prompt = `
당신은 프리미엄 커플 데이트 서비스 '우리사이'의 전략 Planner입니다.

[컨텍스트]
- 날짜: ${targetDate}
- 기존 일정(점유 시간): ${busyContext || '없음'}
- **사용자가 입력한 실제 장소/일정명**: ${locationContext || '특정 장소가 없습니다. 자유롭게 제안하세요.'}
- 커플 취향: ${wishlistTags.join(', ') || '일반적인 데이트'}

[임무]
데이트의 성공을 위한 '전략 계약서'를 JSON으로 작성하세요.

**핵심 규칙:**
1. **시간 엄수**: '기존 일정' 시간대와 절대 겹치지 않는 빈 시간대만 availableTimeSlots으로 정의하세요.
2. 만약 실제 장소가 주어졌다면, 그 정보와 인접한 동선 내에서만 추천 지역(targetArea)을 설정하세요.
3. targetArea는 대한민국의 실제 행정구역명을 사용하세요.

{
  "targetArea": "구체적인 지역명 (예: 서울 성수동, 서울 홍대 등)",
  "mood": "데이트 분위기",
  "availableTimeSlots": ["HH:mm~HH:mm 형식의 가용 시간대 리스트"],
  "constraints": [
    "반드시 targetArea 내 또는 도보/대중교통 15분 이내에서만 이동할 것",
    "기존 일정(${busyContext})과 겹치는 시간에는 절대 장소를 제안하지 말 것"
  ],
  "focusPoints": ["시간대 중복 방지", "지역 일관성", "지리적 타당성"]
}
JSON만 반환하세요.`

  const raw = await callGemini(prompt, true)
  return extractJSON(raw) || { targetArea: '서울', mood: '로맨틱', constraints: [], focusPoints: [], availableTimeSlots: [] }
}

/**
 * [Agent 2] Generator: 구체적인 데이트 코스 제안
 * 실제 존재하는 유명 장소 우선 추천하도록 프롬프트 개선
 */
async function runGenerator(
  contract: Record<string, any>,
  busySlots: BusySlot[],
  targetDate: string,
  feedback?: string
): Promise<Record<string, any>> {
  const busyContext = busySlots.map((s) => `${s.time}~${s.endTime} ${s.title}`).join(', ')

  const prompt = `
데이트 코스 마스터로서 다음 계약서와 점유된 시간을 피해 최적의 일정을 생성하세요.
${feedback ? `\n[중요: 이전 피드백 반영 사항]\n${feedback}\n` : ''}

[계약서]
${JSON.stringify(contract, null, 2)}

[기존 점유 시간 (추천 금지)]
${busyContext || '없음'}

[임무]
1. 계약서의 'availableTimeSlots'를 준수하고, 위 '기존 점유 시간'과 단 1분도 겹치지 않게 일정을 짜세요.
2. 계약서의 'targetArea'를 **절대적으로** 준수하십시오.
3. **매우 중요**: 네이버 지도, 카카오맵에서 실제로 검색되는 유명하고 잘 알려진 장소만 제안하세요.
   - 작은 골목 카페나 불명확한 장소 대신, 해당 지역의 대표적이고 잘 알려진 곳을 선택하세요.
   - 폐업하거나 이전한 장소를 피하려면 최근 2-3년 내 인기 장소를 우선 선택하세요.
4. 장소명은 공식 상호명 그대로 입력하세요 (예: "스타벅스 성수점"이 아닌 "THE FARM", "어니언 성수점" 등).

[응답 형식]
{
  "title": "코스 제목",
  "description": "요약 설명",
  "reason": "추천 이유 설명",
  "items": [
    {
      "time": "HH:mm",
      "place": "장소 공식 상호명 (정확히)",
      "recommendation": "활동 꿀팁",
      "category": "RESTAURANT | CAFE | WALK | EXHIBITION | ETC"
    }
  ]
}
`

  const raw = await callGemini(prompt, true)
  const parsed = extractJSON(raw)
  if (!parsed) throw new Error('Generator: Invalid JSON output')
  return parsed
}

/**
 * [Agent 3] Evaluator: 정량적/정성적 검증
 * 이제 검증된 실존 장소 정보 기반으로 평가
 */
async function runEvaluator(
  proposal: Record<string, any>,
  contract: Record<string, any>,
  busySlots: BusySlot[],
  validationReport: string
): Promise<{ pass: boolean; score: number; critique: string }> {
  const busyContext = busySlots.map((s) => `${s.time}~${s.endTime} ${s.title}`).join(', ')

  const prompt = `
검증 전문가로서 제안된 코스를 평가하세요. 다음 실패 케이스를 엄격히 잡아내야 합니다.
1. **시간 중복**: 기존 점유 시간(${busyContext})과 겹치는 제안 여부
2. **장소 검증 결과**: 아래 [Place Validator 보고서]를 참고하여 검증 실패 장소가 포함된 경우 감점
3. 엉뚱한 지역 (targetArea 위반)
4. 이동 동선이 비현실적인 경우

[Place Validator 보고서]
${validationReport}

[제안서 (검증된 장소 정보 반영 후)]
${JSON.stringify(proposal, null, 2)}

[기준 계약서]
${JSON.stringify(contract, null, 2)}

응답 JSON:
{
  "pass": true/false,
  "score": 0-100,
  "critique": "위반 사항에 대한 구체적 지적 (검증 실패 장소, 시간 중복 등 엄격히 감점)"
}`

  const raw = await callGemini(prompt, true)
  const res = extractJSON(raw) || { pass: false, score: 0, critique: 'Parsing error' }
  return {
    pass: !!res.pass,
    score: Number(res.score) || 0,
    critique: String(res.critique || ''),
  }
}

/**
 * [Agent 4] Critic: 최종 품질 개선 (텍스트 다듬기)
 */
async function runCritic(proposal: Record<string, any>): Promise<Record<string, any>> {
  const prompt = `
제안된 데이트 코스의 텍스트를 더 다정하고 로맨틱하게 다듬어주세요.
**장소명, 주소, 시간은 절대 바꾸지 마세요.** recommendation 텍스트만 개선하세요.

[제안서]
${JSON.stringify(proposal, null, 2)}
`
  const raw = await callGemini(prompt, true)
  return extractJSON(raw) || proposal
}

// ============================================================
// 메인 API 핸들러
// ============================================================

export async function POST(req: Request) {
  const startTime = Date.now()
  const TOTAL_TIMEOUT = 60000 // 60초 (검증 단계 추가로 여유 증가)
  const MAX_ITERATIONS = 2

  try {
    const { schedules, wishlists, targetDate, timezoneOffset } = await req.json()

    // 1. 데이터 정제: Mock 데이터 제외
    const busySlots: BusySlot[] = (schedules || [])
      .filter((s: any) => !s.id?.startsWith('mock-'))
      .map((s: any) => {
        const startUtc = new Date(s.start_datetime || s.startDatetime || '')
        const endUtc = new Date(s.end_datetime || s.endDatetime || '')
        const localStart = new Date(startUtc.getTime() - (timezoneOffset || 0) * 60000)
        const localEnd = new Date(endUtc.getTime() - (timezoneOffset || 0) * 60000)

        return {
          time: `${String(localStart.getUTCHours()).padStart(2, '0')}:${String(localStart.getUTCMinutes()).padStart(2, '0')}`,
          endTime: `${String(localEnd.getUTCHours()).padStart(2, '0')}:${String(localEnd.getUTCMinutes()).padStart(2, '0')}`,
          location: s.location_data?.name || s.locationData?.name || '',
          title: s.title || '',
        }
      })

    const wishlistTags = (wishlists || [])
      .filter((w: any) => !w.id?.startsWith('mock-'))
      .map((w: any) => w.title || w.name)
      .filter(Boolean)

    console.log(`[Harness v3] 🚀 PGVEC 루프 시작: ${targetDate}`)
    console.log(`[Harness v3] 네이버 API: ${NAVER_CLIENT_ID ? '✅' : '❌ 미설정'} | 카카오 API: ${KAKAO_REST_API_KEY ? '✅' : '❌ 미설정'}`)

    // 2. Planner: 전략 수립
    const contract = await runPlanner(busySlots, wishlistTags, targetDate)
    const targetArea = contract.targetArea || ''

    let bestProposal: Record<string, any> | null = null
    let iterations = 0
    let lastCritique = ''
    let lastValidationReport = ''

    // 3. Generator-Validator-Evaluator 루프
    while (iterations < MAX_ITERATIONS) {
      if (Date.now() - startTime > TOTAL_TIMEOUT) {
        console.warn('[Harness v3] ⏱️ 타임아웃으로 루프 종료')
        break
      }
      iterations++
      console.log(`[Harness v3] 🔄 Iteration ${iterations}`)

      // Generator: 코스 제안
      const proposal = await runGenerator(contract, busySlots, targetDate, lastCritique)

      // Place Validator: 제안 장소 실존 검증
      const items: DateItem[] = proposal.items || []
      const { enrichedItems, report } = await validateAndEnrichPlaces(items, targetArea)
      lastValidationReport = report

      // 검증된 장소로 proposal 업데이트
      const enrichedProposal = { ...proposal, items: enrichedItems }

      // Evaluator: 품질 평가
      const evaluation = await runEvaluator(enrichedProposal, contract, busySlots, report)
      console.log(`[Harness v3] 평가 결과: score=${evaluation.score}, pass=${evaluation.pass}`)

      bestProposal = enrichedProposal

      if (evaluation.pass && evaluation.score >= 80) {
        console.log(`[Harness v3] ✅ 통과 (score: ${evaluation.score})`)
        break
      }
      lastCritique = evaluation.critique
    }

    // 4. Critic: 텍스트 다듬기
    if (bestProposal) {
      bestProposal = await runCritic(bestProposal)
      bestProposal.items = (bestProposal.items || []).map((it: any) => ({ ...it, isAI: true }))
    }

    return NextResponse.json({
      data: bestProposal,
      meta: {
        iterations,
        engine: 'gemini-2.5-flash-pgvec-v3',
        duration: Date.now() - startTime,
        placeValidation: {
          enabled: !!(NAVER_CLIENT_ID && KAKAO_REST_API_KEY),
          report: lastValidationReport,
        },
      },
    })
  } catch (error: any) {
    console.error('[Date Planner API] Error:', error)
    return NextResponse.json({ error: '생성 실패', details: error.message }, { status: 500 })
  }
}
