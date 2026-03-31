'use client'

import { useEffect, useState } from 'react'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <body className={`${inter.className} min-h-screen max-w-md mx-auto relative bg-slate-50 shadow-2xl overflow-x-hidden`}>
      {/* 하이드레이션 완료 전까지는 투명하게 유지하되, 서버와 스타일 충돌 방지 */}
      <main 
        className="min-h-screen bg-white relative transition-opacity duration-300" 
        style={mounted ? { opacity: 1 } : { opacity: 0 }}
      >
        {children}
      </main>
    </body>
  )
}
