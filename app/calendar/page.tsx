'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus, MapPin, Clock, Heart, Sparkles, X, Trash2, CalendarDays, Sun, Bot, Edit2 } from 'lucide-react'
import { format, addDays, isSameDay, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useCalendar } from '@/hooks/useCalendar'
import { useAuthStore } from '@/hooks/useAuthStore'
import { useCoupleStore } from '@/hooks/useCoupleStore'
import { scheduleUseCase } from '@/application/schedule/usecases/ScheduleUseCase'
import { BottomNav } from '@/components/BottomNav'
import { useDatePlannerStore } from '@/hooks/useDatePlannerStore'
import Link from 'next/link'

import { Schedule } from '@/domain/schedule/entities/Schedule'

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
  const { openModal: openDatePlanner } = useDatePlannerStore()
  
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(false)

  // 일정 추가/수정 폼 상태
  const [newTitle, setNewTitle] = useState('')
  const [newLocation, setNewLocation] = useState('')
  const [isAllDay, setIsAllDay] = useState(false)
  const [startTime, setStartTime] = useState(() => getNextHalfHour())
  const [endTime, setEndTime] = useState(() => addOneHour(getNextHalfHour()))

  // 기념일 계산 (커플 연결일 기준)
  const anniversaries = useMemo(() => {
    if (!couple?.connectionDate) return []
    const start = parseISO(couple.connectionDate)
    const items = []
    
    // 100일 단위 (100~1000일)
    for (let i = 1; i <= 10; i++) {
      const days = i * 100
      items.push({
        date: addDays(start, days - 1),
        title: `${days}일`
      })
    }
    
    // 1주년 단위 (1~10주년)
    for (let i = 1; i <= 10; i++) {
      const date = new Date(start)
      date.setFullYear(start.getFullYear() + i)
      items.push({
        date,
        title: `${i}주년`
      })
    }
    
    return items
  }, [couple?.connectionDate])

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

  // 전역 이벤트를 통한 일정 갱신 감지 (DatePlanner 등에서 발생)
  useEffect(() => {
    const handleUpdate = () => fetchSchedules()
    window.addEventListener('schedule-updated', handleUpdate)
    return () => window.removeEventListener('schedule-updated', handleUpdate)
  }, [])

  const openAddModal = useCallback(() => {
    setNewTitle('')
    setNewLocation('')
    setIsAllDay(false)
    const next = getNextHalfHour()
    setStartTime(next)
    setEndTime(addOneHour(next))
    setEditingSchedule(null)
    setIsEditOpen(false)
    setIsAddOpen(true)
  }, [])

  const openEditModal = useCallback((schedule: Schedule) => {
    setEditingSchedule(schedule)
    setNewTitle(schedule.title)
    setNewLocation(schedule.locationData?.name || '')
    setIsAllDay(schedule.isAllDay)
    
    const start = new Date(schedule.startDatetime)
    const end = new Date(schedule.endDatetime)
    setStartTime(format(start, 'HH:mm'))
    setEndTime(format(end, 'HH:mm'))
    
    setIsAddOpen(false)
    setIsEditOpen(true)
  }, [])

  const handleSaveSchedule = async () => {
    if (!newTitle.trim() || !user || !couple) return

    let startDatetime: string
    let endDatetime: string

    if (isAllDay) {
      const dayStart = new Date(selectedDate)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(selectedDate)
      dayEnd.setHours(23, 59, 59, 999)
      startDatetime = dayStart.toISOString()
      endDatetime = dayEnd.toISOString()
    } else {
      const [sh, sm] = startTime.split(':').map(Number)
      const [eh, em] = endTime.split(':').map(Number)
      const start = new Date(selectedDate)
      start.setHours(sh, sm, 0, 0)
      const end = new Date(selectedDate)
      end.setHours(eh, em, 0, 0)
      if (end <= start) {
        end.setDate(end.getDate() + 1)
      }
      startDatetime = start.toISOString()
      endDatetime = end.toISOString()
    }

    if (isEditOpen && editingSchedule) {
      const { data, error } = await scheduleUseCase.updateSchedule(editingSchedule.id, {
        title: newTitle,
        startDatetime,
        endDatetime,
        isAllDay,
        locationData: newLocation.trim() ? { name: newLocation.trim() } : undefined
      })
      if (!error && data) {
        setSchedules(prev => prev.map(s => s.id === data.id ? data : s))
        setIsEditOpen(false)
      }
    } else {
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
  }

  const handleDeleteSchedule = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!window.confirm('일정을 삭제하시겠습니까?')) return
    const { error } = await scheduleUseCase.deleteSchedule(id)
    if (!error) {
      setSchedules(prev => prev.filter(s => s.id !== id))
    } else {
      alert(`삭제 중 오류가 발생했습니다: ${error}`)
    }
  }

  const selectedSchedules = selectedDate ? schedules.filter(s => 
    format(new Date(s.startDatetime), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
  ) : []

  const selectedAnniversary = anniversaries.find(a => isSameDay(a.date, selectedDate))

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden pb-24">
      {/* 헤더 */}
      <header className="p-6 pt-10 flex justify-between items-center bg-white shrink-0 shadow-sm border-b border-gray-50/50">
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
      <div className="grid grid-cols-7 px-4 py-4 text-center text-[10px] font-black tracking-widest text-gray-400 uppercase shrink-0">
        {['일', '월', '화', '수', '목', '금', '토'].map(d => <div key={d}>{d}</div>)}
      </div>

      {/* 캘린더 그리드 */}
      <div className="grid grid-cols-7 px-4 gap-y-2 pb-4 shrink-0">
        {calendarDays.map((day, idx) => {
          const dayStr = format(day, 'yyyy-MM-dd')
          const hasSchedule = schedules.some(s => format(new Date(s.startDatetime), 'yyyy-MM-dd') === dayStr)
          const anniversary = anniversaries.find(a => isSameDay(a.date, day))
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

              <div className="absolute bottom-1.5 flex gap-0.5">
                {anniversary && (
                  <div className="w-1 h-1 bg-amber-400 rounded-full" />
                )}
                {hasSchedule && (
                  <div className={`w-1 h-1 rounded-full ${selected ? 'bg-rose-400' : 'bg-gray-300'}`} />
                )}
              </div>
              
              {today && !selected && (
                <div className="absolute top-2.5 w-4 h-0.5 bg-rose-300/40 rounded-full" />
              )}
            </motion.div>
          )
        })}
      </div>

      {/* 선택된 날짜 상세 & 일정 - 독립 스크롤 영역 */}
      <div className="flex-1 bg-gray-50/50 rounded-t-[3rem] border-t border-white shadow-2xl overflow-y-auto overscroll-contain">
        <div className="p-8 space-y-6 pb-48">
          <div className="flex justify-between items-center px-2">
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-black text-gray-800">{format(selectedDate, 'd')}일</span>
                <span className="text-sm font-bold text-gray-400">{format(selectedDate, 'EEEE', { locale: ko })}</span>
              </div>
              {selectedAnniversary && (
                <div className="flex items-center gap-1 mt-1">
                  <Sparkles className="w-3 h-3 text-amber-500 fill-amber-200" />
                  <span className="text-xs font-black text-amber-600">{selectedAnniversary.title}</span>
                </div>
              )}
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
                const isAllDaySchedule = s.isAllDay
                const locationName = s.locationData?.name
                return (
                  <motion.div 
                    key={s.id} 
                    initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                    onClick={() => openEditModal(s)}
                    className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:border-rose-200 transition-colors flex items-center space-x-4 group cursor-pointer"
                  >
                    <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 font-black text-xs shrink-0">
                      {isAllDaySchedule ? (
                        <Sun className="w-5 h-5" />
                      ) : (
                        format(new Date(s.startDatetime), 'HH:mm')
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
                            {format(new Date(s.startDatetime), 'HH:mm')}
                            {' ~ '}
                            {format(new Date(s.endDatetime), 'HH:mm')}
                          </span>
                        )}
                        {locationName && (
                          <span className="px-2 py-0.5 bg-gray-50 text-[10px] font-bold text-gray-400 rounded-full border border-gray-100 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {locationName}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={(e) => { e.stopPropagation(); openEditModal(s); }}
                        className="p-2 text-gray-300 hover:text-rose-400"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => handleDeleteSchedule(s.id, e)}
                        className="p-2 text-gray-300 hover:text-rose-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )
              })
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-3xl flex items-center justify-center text-gray-300 mb-4">
                  <CalendarDays className="w-8 h-8" />
                </div>
                <p className="text-xs font-bold text-gray-400">등록된 일정이 없어요!</p>
                <button 
                  onClick={openAddModal}
                  className="mt-4 px-6 py-2 bg-white rounded-full border border-gray-100 text-[10px] font-black text-gray-400 hover:text-rose-400 hover:border-rose-100 transition-all"
                >
                  새 일정 추가하기
                </button>
              </div>
            )}
          </div>

          {/* AI 데이트 추천 섹션 */}
          {selectedSchedules.length > 0 && (
            <div className="pt-4 border-t border-gray-100">
              <button
                onClick={() => openDatePlanner(format(selectedDate, 'yyyy-MM-dd'))}
                className="w-full py-5 bg-gradient-to-br from-indigo-600 via-purple-600 to-rose-50 rounded-[2rem] flex items-center justify-center space-x-3 text-white shadow-xl shadow-purple-100 active:scale-[0.98] transition-all group"
              >
                <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <span className="font-black text-sm tracking-tight">
                  이날의 데이트 코스 조율하기
                </span>
                <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 일정 추가/수정 바텀 시트 */}
      <AnimatePresence>
        {(isAddOpen || isEditOpen) && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]" 
              onClick={() => { setIsAddOpen(false); setIsEditOpen(false); setEditingSchedule(null); }} 
            />
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: "0%" }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[2rem] p-6 pb-10 z-[101] shadow-2xl"
            >
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

              <div className="flex justify-between items-center mb-5">
                <div>
                  <h3 className="text-lg font-black text-gray-800">{isEditOpen ? '일정 수정' : '일정 등록'}</h3>
                  <p className="text-xs font-semibold text-gray-400 mt-0.5">
                    <CalendarDays className="w-3 h-3 inline mr-1" />
                    {format(selectedDate, 'M월 d일 (EEEE)', { locale: ko })}
                  </p>
                </div>
                <button onClick={() => { setIsAddOpen(false); setIsEditOpen(false); setEditingSchedule(null); }} className="p-2 text-gray-300 hover:text-gray-500 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <input 
                type="text" 
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="어떤 일정이 있나요?" 
                className="w-full px-4 py-3.5 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-rose-200 focus:border-transparent font-bold text-gray-800 placeholder:text-gray-300 mb-4 outline-none transition-all" 
                autoFocus
              />

              <div className="flex items-center justify-between px-1 mb-4">
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-bold text-gray-700">종일</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAllDay(!isAllDay)}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out ${isAllDay ? 'bg-rose-400' : 'bg-gray-200'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ease-in-out ${isAllDay ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              <AnimatePresence>
                {!isAllDay && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 px-1">시작</label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-300 pointer-events-none" />
                          <select value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full pl-9 pr-3 py-3 bg-gray-50 rounded-xl border border-gray-100 text-sm font-bold text-gray-700 appearance-none outline-none">
                            {TIME_OPTIONS.map(t => <option key={`start-${t}`} value={t}>{t}</option>)}
                          </select>
                        </div>
                      </div>
                      <span className="text-gray-300 font-black mt-6">→</span>
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 px-1">종료</label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
                          <select value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full pl-9 pr-3 py-3 bg-gray-50 rounded-xl border border-gray-100 text-sm font-bold text-gray-700 appearance-none outline-none">
                            {TIME_OPTIONS.map(t => <option key={`end-${t}`} value={t}>{t}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative mb-6">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
                <input type="text" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} placeholder="장소를 입력하세요 (선택)" className="w-full pl-10 pr-4 py-3.5 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-rose-200 focus:border-transparent text-sm font-bold text-gray-700 outline-none" />
              </div>

              <button 
                onClick={handleSaveSchedule}
                disabled={!newTitle.trim()}
                className={`w-full py-4 font-black text-lg rounded-2xl shadow-xl transition-all ${newTitle.trim() ? 'bg-rose-500 text-white shadow-rose-200' : 'bg-gray-100 text-gray-300 shadow-none'}`}
              >
                {isEditOpen ? '수정하기' : '등록하기'}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <BottomNav 
        datePlannerProps={{
          initialDate: format(selectedDate, 'yyyy-MM-dd'),
          initialSchedules: selectedSchedules
        }}
      />
    </div>
  )
}
