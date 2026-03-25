import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
  }
})

export async function POST(req: Request) {
  try {
    const { schedules, wishlists, targetDate } = await req.json()

    const prompt = `
      당신은 커플 전용 앱 'ani'의 전문 데이트 플래너입니다.
      아래 제공된 커플의 일정 데이터와 위시리스트를 분석하여 최적의 데이트 코스 1개를 제안하세요.

      [분석 데이터]
      - 선택 날짜: ${targetDate}
      - 기존 일정: ${JSON.stringify(schedules)}
      - 위시리스트: ${JSON.stringify(wishlists)}

      [응답 형식 (JSON 전용)]
      {
        "title": "데이트 코스 제목",
        "description": "전체적인 코스 설명",
        "reason": "AI가 이 코스를 추천한 이유 (일정/위시리스트 기반 분석)",
        "items": [
          {
            "time": "HH:mm (예: 14:00)",
            "place": "장소 이름",
            "recommendation": "이 장소에서 무엇을 하면 좋을지에 대한 한 문장 조언",
            "category": "RESTAURANT | CAFE | EXHIBITION | WALK | TRIP | ETC"
          }
        ]
      }

      *주의사항*
      1. 반드시 기존 일정 시간과 겹치지 않도록 빈 시간을 찾아 배치하세요.
      2. 위시리스트에 있는 장소가 있다면 되도록 포함시키고, 없다면 위시리스트의 카테고리 성향을 분석해 제안하세요.
      3. 성수동, 홍대, 강남 등 구체적인 장소명을 지어내도 좋지만 현실적이어야 합니다.
    `

    const result = await model.generateContent(prompt)
    const responseText = result.response.text()
    
    // JSON 파싱 후 반환
    const courseData = JSON.parse(responseText)

    return NextResponse.json({ data: courseData })
  } catch (error: any) {
    console.error('[Date Planner API] Error:', error)
    return NextResponse.json({ 
      error: '데이트 코스 생성 실패', 
      details: error?.message || '알 수 없는 오류'
    }, { status: 500 })
  }
}
