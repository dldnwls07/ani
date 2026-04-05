'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sparkles, Calendar, Heart, Sun, Bookmark } from 'lucide-react'
import { DatePlannerModal } from './DatePlannerModal'
import { ChatBotModal } from './ChatBotModal'
import { GlobalPlannerOverlay } from './GlobalPlannerOverlay'
import { useDatePlannerStore } from '@/hooks/useDatePlannerStore'

interface BottomNavProps {
  /** 채팅/데이트 모달을 외부에서 제어하고 싶을 때 전달 */
  onChatOpen?: () => void
  onDateOpen?: () => void
  datePlannerProps?: {
    initialDate?: string
    initialSchedules?: any[]
  }
}

export function BottomNav({ onChatOpen, datePlannerProps }: BottomNavProps) {
  const pathname = usePathname()
  const { openModal } = useDatePlannerStore()

  const isActive = (path: string) => pathname === path

  return (
    <>
      <nav className="fixed bottom-6 left-5 right-5 h-16 bg-white/80 backdrop-blur-2xl rounded-3xl border border-white/50 shadow-2xl flex items-center justify-around px-10 z-50 max-w-md mx-auto">
        <Link href="/dashboard" className={`flex flex-col items-center ${isActive('/dashboard') ? 'text-rose-500' : 'text-gray-400 hover:text-rose-400'} transition-colors`}>
          <Sparkles className="w-6 h-6" />
          <span className="text-[10px] font-bold mt-1">홈</span>
        </Link>
        <Link href="/calendar" className={`flex flex-col items-center ${isActive('/calendar') ? 'text-rose-500' : 'text-gray-400 hover:text-rose-400'} transition-colors`}>
          <Calendar className="w-6 h-6" />
          <span className="text-[10px] font-bold mt-1">달력</span>
        </Link>
      </nav>

      {/* 글로벌 데이트 플래너 오버레이 & 모달 (Store 기반) */}
      <GlobalPlannerOverlay />
      <DatePlannerModal />
    </>
  )
}
