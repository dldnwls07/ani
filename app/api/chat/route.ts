import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from 'next/server'

// Gemini 클라이언트 초기화
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }) // 발급된 키에 할당된 전용 모델

export async function POST(req: Request) {
  try {
    const { message, context } = await req.json()
    console.log('[Gemini API] Received message:', message)

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here' || process.env.GEMINI_API_KEY.includes('your_')) {
      console.error('[Gemini API] Missing or Default GEMINI_API_KEY')
      return NextResponse.json({ 
        error: 'Gemini API 키가 설정되지 않았습니다.',
        details: '.env.local 파일 21번 라인 부근에 발급받으신 API 키를 정확히 입력해 주세요.'
      }, { status: 500 })
    }

    const systemPrompt = `
      당신은 커플 전용 앱 '우리사이'의 AI 비서입니다.
      친절하고, 따뜻하며, 위트 있는 말투를 사용하세요.
      커플의 일정을 관리하고, 취향을 저격하는 데이트 코스를 짜주는 것이 주 역할입니다.
      두 분의 사이를 돈독하게 만드는 조언을 이모지와 함께 제공하세요.
      답변은 짧고 명확하게(3문장 이내) 하세요.
    `

    // Gemini API 호출
    const result = await model.generateContent([systemPrompt, message])
    const responseText = result.response.text()

    console.log('[Gemini API] Response Success')
    return NextResponse.json({ data: responseText })
  } catch (error: unknown) {
    console.error('[Gemini API] Detailed Error:', error)
    const err = error as Error
    return NextResponse.json({ 
      error: 'AI 답변 생성 실패 (Gemini)', 
      details: err?.message || '알 수 없는 오류'
    }, { status: 500 })
  }
}
