import { Metadata, Viewport } from 'next'
import './globals.css'
import ClientLayout from './ClientLayout'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: '우리사이 - 커플 라이프 매니지먼트',
  description: 'AI가 조율하고 함께 기록하는 우리 둘만의 소중한 공간',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <ClientLayout>
        {children}
      </ClientLayout>
    </html>
  )
}
