'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { differenceInDays, parseISO, addDays } from 'date-fns'
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
import { BottomNav } from '@/components/BottomNav'

export default function DashboardPage() {
  const router = useRouter()
  const { user, setUser } = useAuthStore()
  const { couple, partner, setPartner } = useCoupleStore()
  const [updateStatusLoading, setUpdateStatusLoading] = useState(false)
  const [showHeartEffect, setShowHeartEffect] = useState(false)
  const [showPokeEffect, setShowPokeEffect] = useState(false)
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

  // 5. 콕 찌르기 시각 효과
  const sendPokeEffect = () => {
    setShowPokeEffect(true)
    setTimeout(() => setShowPokeEffect(false), 2000)
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

      {/* D-Day 카드 - connectionDate 기반 실제 기념일 계산 */}
      {(() => {
        if (!couple?.connectionDate) {
          return (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden bg-white/70 backdrop-blur-xl border border-white/40 p-6 rounded-3xl shadow-xl shadow-rose-200/50"
            >
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-rose-200 rounded-full blur-3xl opacity-50" />
              <h2 className="text-xs font-bold text-rose-400 uppercase tracking-widest">D-DAY</h2>
              <div className="flex items-baseline space-x-2 mt-1">
                <p className="text-4xl font-black text-gray-800">설정 필요</p>
                <p className="text-sm font-medium text-gray-400">사귄 날을 등록하세요</p>
              </div>
            </motion.div>
          )
        }

        const startDate = parseISO(couple.connectionDate)
        // 한국식 D-Day: 당일을 1일로 침
        const daysCount = differenceInDays(new Date(), startDate) + 1
        
        // 다가오는 기념일 리스트 (100일, 200일 ... 1주년, 2주년 등)
        const milestones = [100, 200, 300, 365, 400, 500, 600, 700, 730, 800, 900, 1000, 1095]
        let upcoming = null
        for (const m of milestones) {
           const targetDate = addDays(startDate, m - 1)
           const remain = differenceInDays(targetDate, new Date())
           if (remain >= 0) {
             const label = m === 365 ? '1주년' : m === 730 ? '2주년' : m === 1095 ? '3주년' : `${m}일`
             upcoming = { label, remain }
             break
           }
        }

        return (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col relative overflow-hidden bg-white/70 backdrop-blur-xl border border-white/40 p-6 rounded-3xl shadow-xl shadow-rose-200/50"
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-rose-200 rounded-full blur-3xl opacity-50" />
            <div className="relative z-10">
              <h2 className="text-xs font-bold text-rose-400 uppercase tracking-widest">D-DAY</h2>
              <div className="flex flex-col items-start mt-1">
                <div className="flex items-baseline space-x-2">
                  <p className="text-4xl font-black text-gray-800">
                    D+{daysCount}
                  </p>
                  <p className="text-sm font-medium text-gray-400">
                    우리가 만난 지
                  </p>
                </div>
                {upcoming && (
                  <div className="mt-4 flex items-center space-x-1.5 bg-rose-50/80 border border-rose-100 rounded-full px-3 py-1.5 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                    <p className="text-xs font-bold text-rose-500">
                      다가오는 {upcoming.label} (D-{upcoming.remain === 0 ? 'DAY' : upcoming.remain})
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        );
      })()}

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
          <button 
            onClick={sendPokeEffect}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-100 transition active:scale-95 font-bold text-sm shadow-sm ring-1 ring-rose-100/50"
          >
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

      {/* 공통 하단 네비게이션 (채팅/데이트 모달 내장) */}
      <BottomNav />

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
      {/* 콕 찌르기 시각 효과 */}
      <AnimatePresence>
        {showPokeEffect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, x: 50, rotate: 15 }}
            animate={{ opacity: 1, scale: 1.5, x: -50, rotate: -15 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 flex items-center justify-center pointer-events-none z-[100]"
          >
            <div className="bg-white px-6 py-4 rounded-full shadow-2xl border-4 border-rose-100 flex items-center space-x-3 transform -rotate-12">
              <Hand className="w-8 h-8 text-rose-400" />
              <span className="text-xl font-black text-rose-500 tracking-wider">콕!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
