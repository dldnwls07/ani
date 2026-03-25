// ============================================================
// Supabase 클라이언트 - Infrastructure 계층
// 브라우저(클라이언트), 서버 두 가지 클라이언트를 분리 관리
// ============================================================
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase 환경 변수가 없습니다. .env.local을 확인하세요.')
}

// 브라우저(클라이언트 컴포넌트)에서 사용하는 싱글톤 클라이언트
export const supabaseBrowser = createClient(supabaseUrl, supabaseAnonKey)

// 서버 컴포넌트 / Route Handler에서 사용하는 클라이언트 팩토리
export const createServerClient = () =>
  createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? supabaseAnonKey,
    { auth: { persistSession: false } }
  )
