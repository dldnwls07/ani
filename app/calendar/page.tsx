'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus, MapPin, Clock, Heart, Sparkles, X, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useCalendar } from '@/hooks/useCalendar'
import { useAuthStore } from '@/hooks/useAuthStore'
import { useCoupleStore } from '@/hooks/useCoupleStore'
import { scheduleUseCase } from '@/application/schedule/usecases/ScheduleUseCase'
import Link from 'next/link'

export default function CalendarPage() {
  const { currentMonth, selectedDate, calendarDays, setSelectedDate, nextMonth, prevMonth, formatTitle, isToday, isSameMonth, isSelected } = useCalendar()
  const { user } = useAuthStore()
  const { couple, partner } = useCoupleStore()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [schedules, setSchedules] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newLocation, setNewLocation] = useState('성수동') // 기본값 설정

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
    
    // 기본적으로 선택된 날짜의 현재 시간 + 1시간으로 설정
    const start = new Date(selectedDate)
    start.setHours(new Date().getHours() + 1, 0, 0, 1) // 초를 1로 설정해 중복 방지 팁
    const end = new Date(start)
    end.setHours(start.getHours() + 1)

    const { data, error } = await scheduleUseCase.createSchedule({
      coupleId: couple.id,
      creatorId: user.id,
      title: newTitle,
      description: '',
      startDatetime: start.toISOString(),
      endDatetime: end.toISOString(),
      isAllDay: false,
      scheduleType: 'SHARED',
      locationData: { name: newLocation }
    })

    if (!error && data) {
      setSchedules(prev => [...prev, data])
      setNewTitle('')
      setIsAddOpen(false)
    }
  }

  // 3. 일정 삭제
  const handleDeleteSchedule = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation() // 중복 클릭 방지
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
            onClick={() => setIsAddOpen(true)}
            className="w-10 h-10 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-200 active:scale-90 transition-transform"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* 일정 리스트 */}
        <div className="space-y-3">
          {selectedSchedules.length > 0 ? (
            selectedSchedules.map(s => (
              <motion.div 
                key={s.id} 
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:border-rose-200 transition-colors flex items-center space-x-4 group"
              >
                <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 font-black text-xs shrink-0">
                  {format(new Date(s.start_datetime || s.startDatetime), 'HH:mm')}
                </div>
                <div className="flex-1">
                  <h4 className="font-extrabold text-gray-800 tracking-tight">{s.title}</h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="px-2 py-0.5 bg-gray-50 text-[10px] font-bold text-gray-400 rounded-full border border-gray-100 flex items-center gap-1">
                      <Heart className="w-3 h-3 fill-rose-300 text-rose-300" /> 공유 일정
                    </span>
                  </div>
                </div>
                <button 
                  onClick={(e) => handleDeleteSchedule(s.id, e)}
                  className="p-2 text-gray-200 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center opacity-30 grayscale saturate-0">
              <Sparkles className="w-12 h-12 text-gray-300 mb-2" />
              <p className="text-xs font-bold text-gray-400">등록된 일정이 없어요!</p>
            </div>
          )}
        </div>
      </div>

      {/* 일정 추가 간이 시트 (모달 대체) */}
      <AnimatePresence>
        {isAddOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]" onClick={() => setIsAddOpen(false)} 
            />
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: "0%" }} exit={{ y: "100%" }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[3rem] p-8 pb-12 z-[101] shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-6" />
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-gray-800">우리의 일정 등록</h3>
                <button onClick={() => setIsAddOpen(false)} className="p-2 text-gray-300"><X className="w-5 h-5" /></button>
              </div>
              <input 
                type="text" 
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="어떤 일정이 있나요?" 
                className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-rose-200 font-bold mb-4" 
              />
              <div className="flex space-x-2 mb-6">
                <div className="flex-1 p-4 bg-gray-50 rounded-2xl flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" /> 
                  <span className="text-sm font-bold text-gray-600">시간 설정 (기본 1시간)</span>
                </div>
                <div className="flex-1 p-4 bg-gray-50 rounded-2xl flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" /> 
                  <input 
                    type="text" 
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="장소명" 
                    className="w-full bg-transparent border-none focus:outline-none text-sm font-bold text-gray-600" 
                  />
                </div>
              </div>
              <button 
                onClick={handleAddSchedule}
                className="w-full py-4 bg-rose-500 text-white font-black text-lg rounded-2xl shadow-xl shadow-rose-200 active:scale-95 transition-transform"
              >
                등록하기
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
