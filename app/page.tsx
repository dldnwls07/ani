import { redirect } from 'next/navigation'

// 개발 테스트 기간: 루트 접속 시 대시보드로 바로 이동!!
export default function RootPage() {
  redirect('/dashboard')
}
