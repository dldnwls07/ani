import { createClient } from '@supabase/supabase-js'

// .env.local에 정의된 환경 리플레시
// 개발과 프로덕션 환경에서 클라이언트 싱글톤 인스턴스 보장
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment variables are missing! Check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
