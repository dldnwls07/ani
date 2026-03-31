'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus, MapPin, Clock, Heart, Sparkles, X, Trash2, CalendarDays, Sun, Bot } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useCalendar } from '@/hooks/useCalendar'
import { useAuthStore } from '@/hooks/useAuthStore'
import { useCoupleStore } from '@/hooks/useCoupleStore'
import { scheduleUseCase } from '@/application/schedule/usecases/ScheduleUseCase'
import { BottomNav } from '@/components/BottomNav'
import Link from 'next/link'

// 시간 옵션 생성 (00:00 ~ 23:30, 30분 단위)
const TIME_OPTIONS: string[] = []
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 30) {
    TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
  }
}

// 현재 시각 기준으로 가장 가까운 다음 30분 단위 시간 반환
function getNextHalfHour(): string {
  const now = new Date()
  let h = now.getHours()
  let m = now.getMinutes()
  if (m < 30) {
    m = 30
  } else {
    m = 0
    h = (h + 1) % 24
  }
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// 주어진 시간 문자열에서 1시간 뒤 시간 반환
function addOneHour(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const newH = (h + 1) % 24
  return `${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export default function CalendarPage() {
  const { currentMonth, selectedDate, calendarDays, setSelectedDate, nextMonth, prevMonth, formatTitle, isToday, isSameMonth, isSelected } = useCalendar()
  const { user } = useAuthStore()
  const { couple } = useCoupleStore()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [schedules, setSchedules] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // AI Planner States
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null)

  // 일정 추가 폼 상태
  const [newTitle, setNewTitle] = useState('')
  const [newLocation, setNewLocation] = useState('')
  const [isAllDay, setIsAllDay] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [startTime, setStartTime] = useState(() => getNextHalfHour())
  const [endTime, setEndTime] = useState(() => addOneHour(getNextHalfHour()))

  // 모달 열릴 때마다 폼 초기화
  const openAddModal = useCallback(() => {
    setNewTitle('')
    setNewLocation('')
    setIsAllDay(false)
    const next = getNextHalfHour()
    setStartTime(next)
    setEndTime(addOneHour(next))
    setIsAddOpen(true)
  }, [])

  // 시작 시간이 바뀌면 종료 시간을 자동으로 1시간 뒤로 맞춤 (종료가 시작보다 이전이면)
  useEffect(() => {
    if (startTime >= endTime) {
      setEndTime(addOneHour(startTime))
    }
  }, [startTime])

  // 선택된 날짜가 바뀌면 AI 추천 결과 초기화
  useEffect(() => {
    setAiRecommendation(null)
  }, [selectedDate])

  // AI 데이트 플래너 호출 (로컬 API 라우트 사용)
  const handleAiRecommendation = async () => {
    if (!couple || !selectedDate) return
    setIsAiLoading(true)
    setAiRecommendation(null)
    setIsVerified(false)
    
    const start = Date.now()

    try {
      const targetDateStr = format(selectedDate, 'yyyy-MM-dd')
      
      // /api/date-planner API 라우트 호출
      const response = await fetch('/api/date-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schedules: selectedSchedules,
          wishlists: [],
          targetDate: targetDateStr
        })
      })

      const elapsed = Date.now() - start
      if (elapsed < 3000) {
        await new Promise(resolve => setTimeout(resolve, 3000 - elapsed))
      }

      const result = await response.json()
      
      if (result.error) throw new Error(result.error)

      if (result.data) {
        // 구조화된 코스 데이터를 읽기 쉬운 텍스트로 변환
        const course = result.data
        const courseText = `💕 ${course.title}\n\n${course.items?.map((item: { time: string; place: string; recommendation: string }, i: number) => 
          `${i + 1}. ${item.time} - ${item.place}\n   → ${item.recommendation}`
        ).join('\n\n') || course.description}\n\n📝 ${course.reason || ''}`
        
        setAiRecommendation(courseText)
        // C-4: 하네스 엔진의 실제 검증 결과를 반영
        setIsVerified(result.harness?.verified === true)
      } else {
        throw new Error('No recommendation data')
      }
    } catch (err) {
      console.error('AI Recommendation Error:', err)
      const elapsed = Date.now() - start
      if (elapsed < 3000) {
        await new Promise(resolve => setTimeout(resolve, 3000 - elapsed))
      }
      
      const isBusyDay = schedules.filter(s => format(new Date(s.start_datetime || s.startDatetime), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')).length >= 3
      
      if (isBusyDay) {
        setAiRecommendation('이 날짜는 너무 바빠요! 🥲 다른 날짜로 조율해 볼까요?')
      } else {
        setAiRecommendation('AI 연결에 실패했습니다. 잠시 후 다시 시도해 주세요. 😢')
      }
    } finally {
      setIsAiLoading(false)
    }
  }

  // 1. 일정 데이터 가져오기
  const fetchSchedules = async () => {
    if (!couple) return
    setLoading(true)
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth() + 1
    const { data, error } = await scheduleUseCase.getMonthlySchedules(couple.id, year, month)
    if (!error && data) {
      setSchedules(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchSchedules()
  }, [currentMonth, couple])

  // 2. 일정 생성
  const handleAddSchedule = async () => {
    if (!newTitle.trim() || !user || !couple) return

    let startDatetime: string
    let endDatetime: string

    if (isAllDay) {
      // 종일 일정: 선택된 날짜 00:00:00 ~ 23:59:59
      const dayStart = new Date(selectedDate)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(selectedDate)
      dayEnd.setHours(23, 59, 59, 999)
      startDatetime = dayStart.toISOString()
      endDatetime = dayEnd.toISOString()
    } else {
      // 시간 지정 일정
      const [sh, sm] = startTime.split(':').map(Number)
      const [eh, em] = endTime.split(':').map(Number)
      const start = new Date(selectedDate)
      start.setHours(sh, sm, 0, 0)
      const end = new Date(selectedDate)
      end.setHours(eh, em, 0, 0)
      // 종료 시간이 시작보다 이르면 다음 날로 처리
      if (end <= start) {
        end.setDate(end.getDate() + 1)
      }
      startDatetime = start.toISOString()
      endDatetime = end.toISOString()
    }

    const { data, error } = await scheduleUseCase.createSchedule({
      coupleId: couple.id,
      creatorId: user.id,
      title: newTitle,
      description: '',
      startDatetime,
      endDatetime,
      isAllDay,
      scheduleType: 'SHARED',
      locationData: newLocation.trim() ? { name: newLocation.trim() } : undefined
    })

    if (!error && data) {
      setSchedules(prev => [...prev, data])
      setIsAddOpen(false)
    }
  }

  // 3. 일정 삭제
  const handleDeleteSchedule = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const { error } = await scheduleUseCase.deleteSchedule(id)
    if (!error) {
      setSchedules(prev => prev.filter(s => s.id !== id))
    }
  }

  const selectedSchedules = selectedDate ? schedules.filter(s => 
    format(new Date(s.start_datetime || s.startDatetime), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
  ) : []

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* 헤더 */}
      <header className="p-6 pt-10 flex justify-between items-center bg-white sticky top-0 z-50 shadow-sm border-b border-gray-50/50">
        <Link href="/dashboard" className="p-2 -ml-2 text-gray-400 hover:text-rose-400 transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <div className="flex items-center space-x-1">
          <h1 className="text-xl font-black text-gray-800 tracking-tight">{formatTitle()}</h1>
        </div>
        <div className="flex space-x-1">
          <button onClick={prevMonth} className="p-2 bg-gray-50 rounded-full text-gray-400"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={nextMonth} className="p-2 bg-gray-50 rounded-full text-gray-400"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </header>

      {/* 요일 라벨 */}
      <div className="grid grid-cols-7 px-4 py-4 text-center text-[10px] font-black tracking-widest text-gray-400 uppercase">
        {['일', '월', '화', '수', '목', '금', '토'].map(d => <div key={d}>{d}</div>)}
      </div>

      {/* 캘린더 그리드 */}
      <div className="grid grid-cols-7 px-4 gap-y-2 pb-6">
        {calendarDays.map((day, idx) => {
          const hasSchedule = schedules.some(s => format(new Date(s.start_datetime || s.startDatetime), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'))
          const isCurrentMonth = isSameMonth(day)
          const selected = isSelected(day)
          const today = isToday(day)

          return (
            <motion.div 
              key={idx}
              whileTap={{ scale: 0.9 }}
              onClick={() => setSelectedDate(day)}
              className="relative aspect-square flex flex-col items-center justify-center cursor-pointer"
            >
              {selected && (
                <motion.div layoutId="day-glow" className="absolute inset-1.5 bg-rose-50 border border-rose-100 rounded-2xl z-0 shadow-sm shadow-rose-100" />
              )}
              
              <span className={`relative z-10 text-sm font-bold ${
                !isCurrentMonth ? 'text-gray-200' :
                today ? 'text-rose-500' : 
                selected ? 'text-rose-600' :
                'text-gray-600'
              }`}>
                {format(day, 'd')}
              </span>

              {hasSchedule && !selected && (
                <div className="absolute bottom-2 w-1 h-1 bg-rose-400 rounded-full" />
              )}
              {today && !selected && (
                <div className="absolute top-2.5 w-4 h-0.5 bg-rose-300/40 rounded-full" />
              )}
            </motion.div>
          )
        })}
      </div>

      {/* 선택된 날짜 상세 & 일정 */}
      <div className="flex-1 bg-gray-50/50 rounded-t-[3rem] p-8 border-t border-white shadow-2xl space-y-6">
        <div className="flex justify-between items-center px-2">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-black text-gray-800">{format(selectedDate, 'd')}일</span>
            <span className="text-sm font-bold text-gray-400">{format(selectedDate, 'EEEE', { locale: ko })}</span>
          </div>
          <button 
            onClick={openAddModal}
            className="w-10 h-10 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-200 active:scale-90 transition-transform"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* 일정 리스트 */}
        <div className="space-y-3">
          {selectedSchedules.length > 0 ? (
            selectedSchedules.map(s => {
              const isAllDaySchedule = s.is_all_day || s.isAllDay
              const locationName = s.location_data?.name || s.locationData?.name
              return (
                <motion.div 
                  key={s.id} 
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                  className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:border-rose-200 transition-colors flex items-center space-x-4 group"
                >
                  <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 font-black text-xs shrink-0">
                    {isAllDaySchedule ? (
                      <Sun className="w-5 h-5" />
                    ) : (
                      format(new Date(s.start_datetime || s.startDatetime), 'HH:mm')
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-extrabold text-gray-800 tracking-tight truncate">{s.title}</h4>
                    <div className="flex items-center space-x-2 mt-1 flex-wrap gap-y-1">
                      {isAllDaySchedule ? (
                        <span className="px-2 py-0.5 bg-amber-50 text-[10px] font-bold text-amber-500 rounded-full border border-amber-100 flex items-center gap-1">
                          <Sun className="w-3 h-3" /> 종일
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-gray-50 text-[10px] font-bold text-gray-400 rounded-full border border-gray-100 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(s.start_datetime || s.startDatetime), 'HH:mm')}
                          {' ~ '}
                          {format(new Date(s.end_datetime || s.endDatetime), 'HH:mm')}
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-gray-50 text-[10px] font-bold text-gray-400 rounded-full border border-gray-100 flex items-center gap-1">
                        <Heart className="w-3 h-3 fill-rose-300 text-rose-300" /> 공유
                      </span>
                      {locationName && (
                        <span className="px-2 py-0.5 bg-gray-50 text-[10px] font-bold text-gray-400 rounded-full border border-gray-100 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {locationName}
                        </span>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={(e) => handleDeleteSchedule(s.id, e)}
                    className="p-2 text-gray-200 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              )
            })
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center opacity-30 grayscale saturate-0">
              <Sparkles className="w-12 h-12 text-gray-300 mb-2" />
              <p className="text-xs font-bold text-gray-400">등록된 일정이 없어요!</p>
            </div>
          )}
        </div>

        {/* AI 데이트 추천 섹션 */}
        <div className="pt-4 border-t border-gray-100">
          {!aiRecommendation && !isAiLoading ? (
            <button
              onClick={handleAiRecommendation}
              className="w-full py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 rounded-2xl flex items-center justify-center space-x-2 text-white shadow-lg shadow-purple-200 active:scale-[0.98] transition-transform"
            >
              <Bot className="w-5 h-5" />
              <span className="font-extrabold flex items-center">
                AI 코스 조율하기 <Sparkles className="w-4 h-4 ml-1 text-yellow-300" />
              </span>
            </button>
          ) : isAiLoading ? (
            <div className="w-full py-6 bg-gray-50 rounded-2xl flex flex-col items-center justify-center space-y-4 border border-gray-100">
              <div className="relative flex w-10 h-10">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-10 w-10 bg-rose-500 items-center justify-center text-white shadow-lg">
                  <Sparkles className="w-5 h-5" />
                </span>
              </div>
              <p className="text-xs font-bold text-gray-500 animate-pulse">커플의 일정을 분석해 최적의 코스를 짜고 있어요...</p>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full p-5 bg-gradient-to-br from-indigo-50 via-purple-50 to-rose-50 rounded-3xl border border-rose-100 shadow-inner group relative"
            >
              <button 
                onClick={() => setAiRecommendation(null)} 
                className="absolute top-4 right-4 p-1 rounded-full text-indigo-300 hover:text-indigo-500 transition-colors bg-white/50 backdrop-blur-sm shadow-sm"
                title="닫기"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Bot className="w-5 h-5 text-indigo-500" />
                  <h4 className="font-black text-gray-800 tracking-tight text-sm">AI 플래너의 제안</h4>
                </div>
                {isVerified && (
                  <div className="flex items-center bg-green-500/10 px-2 py-1 rounded-lg border border-green-500/20">
                    <Sparkles className="w-3 h-3 text-green-600 mr-1" />
                    <span className="text-[10px] font-black text-green-600">실시간 정보 검증 완료</span>
                  </div>
                )}
              </div>
              <p className="text-sm font-bold text-gray-700 leading-relaxed">
                {aiRecommendation}
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* 일정 추가 바텀 시트 */}
      <AnimatePresence>
        {isAddOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]" onClick={() => setIsAddOpen(false)} 
            />
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: "0%" }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[2rem] p-6 pb-10 z-[101] shadow-2xl"
            >
              {/* 핸들 바 */}
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

              {/* 헤더 */}
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h3 className="text-lg font-black text-gray-800">일정 등록</h3>
                  <p className="text-xs font-semibold text-gray-400 mt-0.5">
                    <CalendarDays className="w-3 h-3 inline mr-1" />
                    {format(selectedDate, 'M월 d일 (EEEE)', { locale: ko })}
                  </p>
                </div>
                <button onClick={() => setIsAddOpen(false)} className="p-2 text-gray-300 hover:text-gray-500 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 제목 입력 */}
              <input 
                type="text" 
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="어떤 일정이 있나요?" 
                className="w-full px-4 py-3.5 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-rose-200 focus:border-transparent font-bold text-gray-800 placeholder:text-gray-300 mb-4 outline-none transition-all" 
                autoFocus
              />

              {/* 종일 토글 */}
              <div className="flex items-center justify-between px-1 mb-4">
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-bold text-gray-700">종일</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAllDay(!isAllDay)}
                  className={`
                    relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out
                    ${isAllDay ? 'bg-rose-400' : 'bg-gray-200'}
                  `}
                >
                  <span
                    className={`
                      absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm
                      transition-transform duration-200 ease-in-out
                      ${isAllDay ? 'translate-x-5' : 'translate-x-0'}
                    `}
                  />
                </button>
              </div>

              {/* 시간 선택 (종일이 아닐 때만) */}
              <AnimatePresence>
                {!isAllDay && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      {/* 시작 시간 */}
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 px-1">시작</label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-300 pointer-events-none" />
                          <select
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-full pl-9 pr-3 py-3 bg-gray-50 rounded-xl border border-gray-100 text-sm font-bold text-gray-700 appearance-none cursor-pointer focus:ring-2 focus:ring-rose-200 focus:border-transparent outline-none transition-all"
                          >
                            {TIME_OPTIONS.map(t => (
                              <option key={`start-${t}`} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <span className="text-gray-300 font-black mt-6">→</span>

                      {/* 종료 시간 */}
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 px-1">종료</label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
                          <select
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="w-full pl-9 pr-3 py-3 bg-gray-50 rounded-xl border border-gray-100 text-sm font-bold text-gray-700 appearance-none cursor-pointer focus:ring-2 focus:ring-rose-200 focus:border-transparent outline-none transition-all"
                          >
                            {TIME_OPTIONS.map(t => (
                              <option key={`end-${t}`} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 장소 입력 */}
              <div className="relative mb-6">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
                <input 
                  type="text" 
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="장소를 입력하세요 (선택)" 
                  className="w-full pl-10 pr-4 py-3.5 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-rose-200 focus:border-transparent text-sm font-bold text-gray-700 placeholder:text-gray-300 outline-none transition-all" 
                />
              </div>

              {/* 시간 요약 표시 */}
              {newTitle.trim() && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 rounded-xl mb-4 border border-rose-100"
                >
                  <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-xs font-bold text-rose-500">
                    {format(selectedDate, 'M/d', { locale: ko })}
                    {isAllDay ? ' 종일' : ` ${startTime} ~ ${endTime}`}
                    {newLocation.trim() ? ` · ${newLocation}` : ''}
                  </span>
                </motion.div>
              )}

              {/* 등록 버튼 */}
              <button 
                onClick={handleAddSchedule}
                disabled={!newTitle.trim()}
                className={`
                  w-full py-4 font-black text-lg rounded-2xl shadow-xl transition-all duration-200 active:scale-[0.97]
                  ${newTitle.trim()
                    ? 'bg-rose-500 text-white shadow-rose-200 hover:bg-rose-600'
                    : 'bg-gray-100 text-gray-300 shadow-none cursor-not-allowed'
                  }
                `}
              >
                등록하기
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 공통 하단 네비게이션 */}
      <BottomNav />
    </div>
  )
}
