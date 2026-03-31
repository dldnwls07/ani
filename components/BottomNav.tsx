'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sparkles, Calendar, Heart, Sun, Bookmark } from 'lucide-react'
import { DatePlannerModal } from './DatePlannerModal'
import { ChatBotModal } from './ChatBotModal'

interface BottomNavProps {
  /** 채팅/데이트 모달을 외부에서 제어하고 싶을 때 전달 */
  onChatOpen?: () => void
  onDateOpen?: () => void
}

export function BottomNav({ onChatOpen, onDateOpen }: BottomNavProps) {
  const pathname = usePathname()
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isDateOpen, setIsDateOpen] = useState(false)

  const isActive = (path: string) => pathname === path

  const handleChatOpen = () => {
    if (onChatOpen) {
      onChatOpen()
    } else {
      setIsChatOpen(true)
    }
  }

  const handleDateOpen = () => {
    if (onDateOpen) {
      onDateOpen()
    } else {
      setIsDateOpen(true)
    }
  }

  return (
    <>
      <nav className="fixed bottom-6 left-5 right-5 h-16 bg-white/80 backdrop-blur-2xl rounded-3xl border border-white/50 shadow-2xl flex items-center justify-around px-2 z-50 max-w-md mx-auto">
        <Link href="/dashboard" className={`flex flex-col items-center ${isActive('/dashboard') ? 'text-rose-500' : 'text-gray-400 hover:text-rose-400'} transition-colors`}>
          <Sparkles className="w-6 h-6" />
          <span className="text-[10px] font-bold mt-1">홈</span>
        </Link>
        <Link href="/calendar" className={`flex flex-col items-center ${isActive('/calendar') ? 'text-rose-500' : 'text-gray-400 hover:text-rose-400'} transition-colors`}>
          <Calendar className="w-6 h-6" />
          <span className="text-[10px] font-bold mt-1">달력</span>
        </Link>
        <button 
          onClick={handleChatOpen}
          className="flex flex-col items-center text-gray-400 hover:text-rose-400 transition-all active:scale-95"
        >
          <div className="w-12 h-12 bg-gradient-to-tr from-rose-400 to-pink-500 rounded-2xl flex items-center justify-center -mt-10 shadow-lg shadow-rose-200 border-2 border-white">
            <Heart className="w-6 h-6 text-white fill-white" />
          </div>
          <span className="text-[10px] font-bold mt-1 text-rose-500">우리</span>
        </button>
        <button 
          onClick={handleDateOpen}
          className="flex flex-col items-center text-gray-400 hover:text-rose-400 transition-colors"
        >
          <Sun className="w-6 h-6" />
          <span className="text-[10px] font-bold mt-1">데이트</span>
        </button>
        <Link href="/wishlist" className={`flex flex-col items-center ${isActive('/wishlist') ? 'text-rose-500' : 'text-gray-400 hover:text-rose-400'} transition-colors`}>
          <Bookmark className="w-6 h-6" />
          <span className="text-[10px] font-bold mt-1">위시</span>
        </Link>
      </nav>

      {/* 자체 모달 관리 (외부 제어가 아닌 경우) */}
      {!onChatOpen && <ChatBotModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />}
      {!onDateOpen && <DatePlannerModal isOpen={isDateOpen} onClose={() => setIsDateOpen(false)} />}
    </>
  )
}
