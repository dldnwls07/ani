import { NextResponse } from 'next/server'

/**
 * ============================================================
 * 우리사이 장소 검증 API (Place Search & Validation)
 * ============================================================
 * 네이버 Local Search API + 카카오 Local API 이중 검증
 * AI가 제안한 장소가 실제로 존재하는지 확인하고,
 * 실존 장소의 정확한 정보(주소, 카테고리 등)를 반환합니다.
 */

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID?.trim() ?? ''
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET?.trim() ?? ''
const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY?.trim() ?? ''

export interface PlaceResult {
  name: string
  address: string
  roadAddress?: string
  category?: string
  mapUrl?: string
  phone?: string
  source: 'naver' | 'kakao'
  verified: boolean
}

/**
 * 네이버 지역 검색 API 호출
 * https://developers.naver.com/docs/serviceapi/search/local/local.md
 */
async function searchNaver(query: string, area?: string): Promise<PlaceResult[]> {
  const searchQuery = area ? `${query} ${area}` : query
  const url = `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(searchQuery)}&display=3&sort=comment`

  try {
    const res = await fetch(url, {
      headers: {
        'X-Naver-Client-Id': NAVER_CLIENT_ID,
        'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
      },
      next: { revalidate: 300 }, // 5분 캐시
    })

    if (!res.ok) {
      console.error(`[Naver API] ${res.status}: ${await res.text()}`)
      return []
    }

    const data = await res.json()
    const items = data.items || []

    return items.map((item: any) => ({
      name: item.title.replace(/<\/?b>/g, ''), // HTML 태그 제거
      address: item.address || '',
      roadAddress: item.roadAddress || '',
      category: item.category || '',
      mapUrl: item.link || '',
      phone: item.telephone || '',
      source: 'naver' as const,
      verified: true,
    }))
  } catch (err) {
    console.error('[Naver API] fetch error:', err)
    return []
  }
}

/**
 * 카카오 키워드 장소 검색 API 호출
 * https://developers.kakao.com/docs/latest/ko/local/dev-guide
 */
async function searchKakao(query: string, area?: string): Promise<PlaceResult[]> {
  const searchQuery = area ? `${area} ${query}` : query
  const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(searchQuery)}&size=3`

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
      },
      next: { revalidate: 300 }, // 5분 캐시
    })

    if (!res.ok) {
      console.error(`[Kakao API] ${res.status}: ${await res.text()}`)
      return []
    }

    const data = await res.json()
    const documents = data.documents || []

    return documents.map((doc: any) => ({
      name: doc.place_name,
      address: doc.address_name || '',
      roadAddress: doc.road_address_name || '',
      category: doc.category_name || '',
      mapUrl: doc.place_url || '',
      phone: doc.phone || '',
      source: 'kakao' as const,
      verified: true,
    }))
  } catch (err) {
    console.error('[Kakao API] fetch error:', err)
    return []
  }
}

/**
 * 두 API 결과를 병합하고, 장소명 유사도로 중복 제거
 */
function deduplicateResults(naverResults: PlaceResult[], kakaoResults: PlaceResult[]): PlaceResult[] {
  const merged = [...naverResults]

  for (const kakaoItem of kakaoResults) {
    const isDuplicate = merged.some(
      (n) => n.name.replace(/\s/g, '') === kakaoItem.name.replace(/\s/g, '')
    )
    if (!isDuplicate) {
      merged.push(kakaoItem)
    }
  }

  return merged.slice(0, 5)
}

/**
 * 장소 이름 유사도 체크 (간단한 포함 관계)
 */
function isNameMatch(proposed: string, found: string): boolean {
  const p = proposed.replace(/\s/g, '').toLowerCase()
  const f = found.replace(/\s/g, '').toLowerCase()
  return f.includes(p) || p.includes(f) || p.length > 2 && f.includes(p.slice(0, Math.floor(p.length * 0.7)))
}

/**
 * POST /api/place-search
 * Body: { places: string[], area?: string }
 * AI가 제안한 장소 목록을 받아 네이버+카카오 이중 검증
 */
export async function POST(req: Request) {
  try {
    const { places, area } = await req.json() as { places: string[], area?: string }

    if (!places || !Array.isArray(places) || places.length === 0) {
      return NextResponse.json({ error: '검색할 장소 목록이 없습니다.' }, { status: 400 })
    }

    if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
      console.warn('[Place Search] 네이버 API 키 미설정')
    }
    if (!KAKAO_REST_API_KEY) {
      console.warn('[Place Search] 카카오 API 키 미설정')
    }

    const results: Record<string, {
      proposed: string
      verified: boolean
      matched?: PlaceResult
      alternatives: PlaceResult[]
    }> = {}

    // 각 장소에 대해 네이버+카카오 병렬 검색
    await Promise.all(
      places.map(async (placeName) => {
        const [naverRes, kakaoRes] = await Promise.all([
          searchNaver(placeName, area),
          searchKakao(placeName, area),
        ])

        const allResults = deduplicateResults(naverRes, kakaoRes)

        // 제안된 장소명과 매칭되는 결과 찾기
        const matched = allResults.find((r) => isNameMatch(placeName, r.name))

        results[placeName] = {
          proposed: placeName,
          verified: !!matched,
          matched: matched,
          alternatives: allResults.filter((r) => r !== matched).slice(0, 2),
        }
      })
    )

    const verifiedCount = Object.values(results).filter((r) => r.verified).length
    const total = places.length

    console.log(`[Place Search] 검증 완료: ${verifiedCount}/${total} 장소 확인됨`)

    return NextResponse.json({
      results,
      summary: {
        total,
        verified: verifiedCount,
        unverified: total - verifiedCount,
        verificationRate: Math.round((verifiedCount / total) * 100),
      },
    })
  } catch (error: any) {
    console.error('[Place Search API] Error:', error)
    return NextResponse.json({ error: '장소 검색 실패', details: error.message }, { status: 500 })
  }
}

/**
 * GET /api/place-search?q=장소명&area=지역
 * 단일 장소 빠른 검색용
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q')
    const area = searchParams.get('area') || undefined

    if (!query) {
      return NextResponse.json({ error: '검색어(q)가 필요합니다.' }, { status: 400 })
    }

    const [naverRes, kakaoRes] = await Promise.all([
      searchNaver(query, area),
      searchKakao(query, area),
    ])

    const results = deduplicateResults(naverRes, kakaoRes)

    return NextResponse.json({ results, query, area })
  } catch (error: any) {
    console.error('[Place Search GET] Error:', error)
    return NextResponse.json({ error: '장소 검색 실패', details: error.message }, { status: 500 })
  }
}
