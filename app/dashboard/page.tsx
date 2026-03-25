'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Heart, 
  Calendar, 
  Settings, 
  Sparkles, 
  LogOut, 
  MessageCircle, 
  User as UserIcon, 
  Sun,
  Bookmark,
  Hand
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/hooks/useAuthStore'
import { useCoupleStore } from '@/hooks/useCoupleStore'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'
import { supabaseBrowser } from '@/infrastructure/supabase/client'
import { User } from '@/domain/user/entities/User'
import { DatePlannerModal } from '@/components/DatePlannerModal'
import { ChatBotModal } from '@/components/ChatBotModal'

export default function DashboardPage() {
  const router = useRouter()
  const { user, setUser } = useAuthStore()
  const { couple, partner, setPartner } = useCoupleStore()
  const [updateStatusLoading, setUpdateStatusLoading] = useState(false)
  const [showHeartEffect, setShowHeartEffect] = useState(false)
  const [isDateModalOpen, setIsDateModalOpen] = useState(false)
  const [isChatModalOpen, setIsChatModalOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [showForceReset, setShowForceReset] = useState(false)

  // 1. 하이드레이션 완료 체크 및 타임아웃 설정
  useEffect(() => {
    setIsMounted(true)
    const timer = setTimeout(() => {
      // 4초가 지나도 사용자 정보가 없으면 초기화 버튼 노출
      if (!user || !couple) setShowForceReset(true)
    }, 4000)
    return () => clearTimeout(timer)
  }, [user, couple])

  // 강제 초기화 함수 (개발용 - 로컬 스토리지 충돌 해결)
  const handleForceReset = () => {
    localStorage.clear()
    window.location.reload()
  }

  // 2. 실시간 동기화 훅 가동!
  useRealtimeSync()

  // 3. 내 상태 수정 함수
  const updateMyStatus = async (message: string) => {
    if (!user) return
    setUpdateStatusLoading(true)
    const { error } = await supabaseBrowser
      .from('profiles')
      .update({ status_message: message, status_updated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (!error) {
      setUser({ ...user, statusMessage: message, statusUpdatedAt: new Date().toISOString() })
    }
    setUpdateStatusLoading(false)
  }

  // 3. 로그아웃 함수
  const handleLogout = async () => {
    await supabaseBrowser.auth.signOut()
    setUser(null)
    router.push('/login')
  }

  // 4. 하트 발송 시각 효과 (임기응변!)
  const sendHeartEffect = () => {
    setShowHeartEffect(true)
    setTimeout(() => setShowHeartEffect(false), 2000)
  }

  // 하이드레이션 전에는 로딩 중으로 표시 (mounted 확인 후에도 데이터 없으면 안내)
  if (!isMounted || !user || !couple) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white p-10 text-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
          <Sparkles className="text-rose-400 w-12 h-12 mb-4" />
        </motion.div>
        <p className="text-sm font-bold text-gray-400 animate-pulse">상태를 동기화하고 있습니다...</p>
        
        {showForceReset && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8">
            <p className="text-[10px] text-rose-300 mb-4 font-medium leading-relaxed">
              데이터 동기화가 너무 오래 걸리나요?<br/>로그인 정보가 꼬였을 수 있습니다.
            </p>
            <button 
              onClick={handleForceReset}
              className="px-6 py-3 bg-rose-50 text-rose-500 rounded-2xl font-bold text-xs shadow-sm ring-1 ring-rose-100 hover:bg-rose-100 transition-colors"
            >
              데이터 강제 초기화 후 재시작
            </button>
          </motion.div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-rose-50 to-white p-5 pt-8 space-y-6 pb-24">
      {/* 글로벌 헤더 */}
      <header className="flex justify-between items-center">
        <div className="flex -space-x-3 items-center">
          <div className="w-10 h-10 rounded-full bg-rose-400 border-2 border-white flex items-center justify-center font-bold text-white shadow-sm overflow-hidden text-xs">
            {user.nickname[0]}
          </div>
          <div className="w-10 h-10 rounded-full bg-pink-300 border-2 border-white flex items-center justify-center font-bold text-white shadow-sm overflow-hidden text-xs">
            {partner?.nickname?.[0] || '?'}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* D-Day 카드 - 실제 날짜 계산 (미구현 시 Mock 대입) */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-white/70 backdrop-blur-xl border border-white/40 p-6 rounded-3xl shadow-xl shadow-rose-200/50"
      >
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-rose-200 rounded-full blur-3xl opacity-50" />
        <h2 className="text-xs font-bold text-rose-400 uppercase tracking-widest">D-DAY</h2>
        <div className="flex items-baseline space-x-2 mt-1">
          <p className="text-4xl font-black text-gray-800">D+124</p>
          <p className="text-sm font-medium text-gray-400">우리가 만난 지</p>
        </div>
      </motion.div>

      {/* 파트너 상태 위젯 (핵심!) */}
      <section className="bg-white rounded-[2rem] p-8 shadow-2xl shadow-rose-100/50 border border-rose-50 flex flex-col items-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-pink-50 rounded-full -mr-16 -mt-16 blur-2xl" />
        
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-pink-100 border-4 border-white shadow-inner overflow-hidden flex items-center justify-center text-4xl">
            {partner?.avatarUrl ? <img src={partner.avatarUrl} alt="partner" /> : '🫶'}
          </div>
          {/* 파트너 상태 배지 (실시간 반영) */}
          <motion.div 
            initial={{ scale: 0.8 }} animate={{ scale: 1 }}
            className="absolute -bottom-2 -right-2 bg-white px-3 py-1.5 rounded-full shadow-lg border border-rose-100 text-[10px] font-bold flex items-center space-x-1.5"
          >
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-gray-700">{partner?.statusMessage || '꿈꾸는 중..'}</span>
          </motion.div>
        </div>
        
        <h3 className="mt-6 font-extrabold text-xl text-gray-800">
          <span className="text-rose-400">{partner?.nickname || '파트너'}</span>님은 지금
        </h3>
        <p className="text-sm text-gray-400 mt-1 font-medium italic">
          "{partner?.statusMessage || '연결을 기다리고 있어요'}"
        </p>

        <div className="grid grid-cols-2 gap-3 mt-8 w-full">
          <button className="flex items-center justify-center space-x-2 px-4 py-3 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-100 transition active:scale-95 font-bold text-sm shadow-sm ring-1 ring-rose-100/50">
            <Hand className="w-4 h-4" />
            <span>콕 찌르기</span>
          </button>
          <button 
            onClick={sendHeartEffect}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-pink-500 text-white rounded-2xl hover:bg-pink-600 transition active:scale-95 font-bold text-sm shadow-lg shadow-pink-200"
          >
            <Heart className="w-4 h-4 fill-white" />
            <span>하트 뿅</span>
          </button>
        </div>
      </section>

      {/* 내 상태 관리 (여기서 상태를 바꿀 수 있음) */}
      <section className="space-y-3">
        <p className="text-xs font-bold text-gray-400 px-1">지금 나의 상태</p>
        <div className="flex overflow-x-auto space-x-2 pb-2 no-scrollbar">
          {['업무 중 💻', '공부 중 ✍️', '식사 중 🍱', '쉬는 중 🍰', '이동 중 🚌'].map((status) => (
            <button
              key={status}
              onClick={() => updateMyStatus(status)}
              disabled={updateStatusLoading}
              className={`whitespace-nowrap px-4 py-2.5 rounded-2xl text-xs font-bold transition-all border ${
                user.statusMessage === status 
                  ? 'bg-gray-800 text-white border-gray-800 shadow-md' 
                  : 'bg-white text-gray-500 border-gray-100 hover:border-rose-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </section>

      {/* 하단 퀵 메뉴 */}
      <nav className="fixed bottom-6 left-5 right-5 h-16 bg-white/80 backdrop-blur-2xl rounded-3xl border border-white/50 shadow-2xl flex items-center justify-around px-2 z-50">
        <Link href="/dashboard" className="flex flex-col items-center text-rose-500">
          <Sparkles className="w-6 h-6" />
          <span className="text-[10px] font-bold mt-1">홈</span>
        </Link>
        <Link href="/calendar" className="flex flex-col items-center text-gray-400 hover:text-rose-400 transition-colors">
          <Calendar className="w-6 h-6" />
          <span className="text-[10px] font-bold mt-1">달력</span>
        </Link>
        <button 
          onClick={() => setIsChatModalOpen(true)}
          className="flex flex-col items-center text-gray-400 hover:text-rose-400 transition-all active:scale-95"
        >
          <div className="w-12 h-12 bg-gradient-to-tr from-rose-400 to-pink-500 rounded-2xl flex items-center justify-center -mt-10 shadow-lg shadow-rose-200 border-2 border-white">
            <Heart className="w-6 h-6 text-white fill-white" />
          </div>
          <span className="text-[10px] font-bold mt-1 text-rose-500">우리</span>
        </button>
        <button 
          onClick={() => setIsDateModalOpen(true)}
          className="flex flex-col items-center text-gray-400 hover:text-rose-400 transition-colors"
        >
          <Sun className="w-6 h-6" />
          <span className="text-[10px] font-bold mt-1">데이트</span>
        </button>
        <Link href="/wishlist" className="flex flex-col items-center text-gray-400 hover:text-rose-400 transition-colors">
          <Bookmark className="w-6 h-6" />
          <span className="text-[10px] font-bold mt-1">위물</span>
        </Link>
      </nav>

      {/* 실시간 데이트 플래너 모달 */}
      <DatePlannerModal isOpen={isDateModalOpen} onClose={() => setIsDateModalOpen(false)} />

      {/* 실시간 AI 비서 채팅 모달 */}
      <ChatBotModal isOpen={isChatModalOpen} onClose={() => setIsChatModalOpen(false)} />

      {/* 하트 발송 시각 효과 */}
      <AnimatePresence>
        {showHeartEffect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 0 }}
            animate={{ opacity: 1, scale: 2, y: -200 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center pointer-events-none z-[100]"
          >
            <Heart className="w-20 h-20 text-pink-500 fill-pink-500" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
