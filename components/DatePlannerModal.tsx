'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Sparkles, MapPin, Clock, Calendar, Check, X, Loader2, ArrowRight, ShieldCheck, Info } from 'lucide-react'
import { scheduleUseCase } from '@/application/schedule/usecases/ScheduleUseCase'
import { useAuthStore } from '@/hooks/useAuthStore'
import { useCoupleStore } from '@/hooks/useCoupleStore'
import { useDatePlannerStore } from '@/hooks/useDatePlannerStore'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

export function DatePlannerModal() {
  const { user } = useAuthStore()
  const { couple } = useCoupleStore()
  const { isModalOpen, closeModal, isGenerating, isVerified, result, targetDate, generate, clear } = useDatePlannerStore()
  const [saving, setSaving] = useState(false)
  const [localDate, setLocalDate] = useState(targetDate || new Date().toISOString().split('T')[0])

  useEffect(() => {
    if (isModalOpen && targetDate) {
      setLocalDate(targetDate)
    }
  }, [isModalOpen, targetDate])

  const handleGenerate = async () => {
    if (!couple || !localDate) return
    // 분석 시작 시 전역 스토어에 위임하고 모달을 바로 닫아 백그라운드 작업 시작
    generate(couple.id, localDate)
    closeModal()
  }

  const handleAddSchedules = async () => {
    if (!result || !user || !couple) return
    setSaving(true)
    
    try {
      // C-5: AI 추천 항목(isAI: true)만 필터링하여 등록 (기존 일정 중복 방지)
      const aiItems = (result.items as any[]).filter(it => it.isAI !== false)

      for (const item of aiItems) {
        const [hours, minutes] = item.time.split(':').map(Number)
        const startDate = new Date(localDate)
        startDate.setHours(hours, minutes, 0, 0)
        
        const endDate = new Date(startDate)
        endDate.setHours(endDate.getHours() + 1)

        await scheduleUseCase.createSchedule({
          coupleId: couple.id,
          creatorId: user.id,
          title: `${item.place} (AI 추천)`,
          description: item.recommendation,
          startDatetime: startDate.toISOString(),
          endDatetime: endDate.toISOString(),
          isAllDay: false,
          scheduleType: 'SHARED',
          locationData: { name: item.place }
        })
      }
      alert('새로운 추천 일정이 캘린더에 등록되었습니다! 💕')
      clear() // 스토어 초기화
      closeModal()
      
      // 약간의 지연 후 페이지 리로드로 캘린더 갱신 트리거 (간단한 동기화)
      setTimeout(() => {
        window.dispatchEvent(new Event('schedule-updated'))
      }, 500)
    } catch (e) {
      console.error('[DatePlanner] Failed to save schedules:', e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {isModalOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200]" 
            onClick={closeModal} 
          />
          <motion.div 
            initial={{ y: "100%" }} animate={{ y: "0%" }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 top-10 md:top-20 max-w-2xl mx-auto bg-gray-50 rounded-t-[3rem] shadow-2xl flex flex-col z-[201] overflow-hidden"
          >
            {/* 상단 헤더 영역 */}
            <div className="bg-white px-8 pt-8 pb-6 shrink-0 border-b border-gray-100">
              <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-6 md:hidden" />
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                    AI 코스 조율사 <Sparkles className="w-6 h-6 text-rose-400 fill-rose-100" />
                  </h2>
                  <p className="text-sm text-gray-400 font-bold mt-1">
                    {format(new Date(localDate), 'M월 d일 (EEEE)', { locale: ko })} 데이트
                  </p>
                </div>
                <button onClick={closeModal} className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* 메인 콘텐츠 영역 (스크롤 가능) */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 overscroll-contain">
              {!result && !isGenerating && (
                <div className="max-w-md mx-auto space-y-8 py-4">
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                    <label className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] block mb-4 px-1">날짜 확인</label>
                    <div className="flex items-center space-x-4 bg-gray-50 p-5 rounded-3xl border border-gray-100/50">
                      <Calendar className="w-6 h-6 text-rose-500" />
                      <input 
                        type="date" 
                        value={localDate} 
                        onChange={(e) => setLocalDate(e.target.value)}
                        className="flex-1 bg-transparent text-lg text-gray-800 font-black focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                      <Info className="w-4 h-4 text-rose-400" />
                      <p className="text-xs font-bold text-gray-400">우리의 일정과 위시리스트를 바탕으로 장소를 추천해요.</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {['무드 있는', '활동적인', '차분한', '색다른'].map(tag => (
                        <div key={tag} className="p-5 bg-white border border-gray-100 rounded-[2rem] flex items-center justify-center space-x-2 text-gray-600 shadow-sm hover:border-rose-200 transition-all cursor-default">
                          <Check className="w-4 h-4 text-rose-400" />
                          <span className="text-sm font-black">{tag}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={handleGenerate}
                    className="w-full py-6 bg-rose-500 text-white font-black text-xl rounded-[2rem] shadow-xl shadow-rose-200 hover:bg-rose-600 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                  >
                    백그라운드에서 조율 시작하기 <ArrowRight className="w-6 h-6" />
                  </button>
                </div>
              )}

              {/* 결과 화면 */}
              {result && (
                <div className="max-w-2xl mx-auto space-y-8 pb-32">
                  <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 relative overflow-hidden">
                    {isVerified && (
                      <div className="absolute top-0 right-0 bg-green-500 px-6 py-2 rounded-bl-3xl flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-white" />
                        <span className="text-[10px] font-black text-white uppercase tracking-wider">Harness Verified</span>
                      </div>
                    )}
                    <div className="text-center space-y-3 mt-4">
                      <h3 className="text-2xl font-black text-gray-800 leading-tight">{result.title}</h3>
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-[1px] w-8 bg-rose-200" />
                        <p className="text-sm font-bold text-rose-500">{result.reason}</p>
                        <div className="h-[1px] w-8 bg-rose-200" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {(result.items as any[]).map((item, idx) => {
                      const isAI = item.isAI !== false;
                      return (
                        <motion.div 
                          key={idx} 
                          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                          className={`p-6 rounded-[2.5rem] border shadow-sm flex items-start gap-5 group transition-all ${
                            isAI ? 'bg-white border-gray-100 hover:border-rose-200' : 'bg-gray-50 border-gray-200 opacity-80'
                          }`}
                        >
                          <div className="flex flex-col items-center gap-2 shrink-0">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs ${
                              isAI ? 'bg-rose-50 text-rose-500' : 'bg-gray-200 text-gray-500'
                            }`}>
                              {item.time}
                            </div>
                            {idx < result.items.length - 1 && (
                              <div className="w-0.5 h-12 bg-gray-100 rounded-full" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0 pt-1">
                            <div className="flex items-center justify-between mb-2">
                              <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-wider flex items-center gap-1 ${
                                isAI ? 'bg-rose-50 text-rose-400' : 'bg-gray-200 text-gray-500'
                              }`}>
                                {isAI ? <Sparkles className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
                                {isAI ? item.category : 'OUR SCHEDULE'}
                              </span>
                            </div>
                            <h4 className={`text-lg font-black flex items-center gap-2 truncate ${
                              isAI ? 'text-gray-800' : 'text-gray-500'
                            }`}>
                              {item.place}
                            </h4>
                            <p className={`text-sm font-bold mt-2 leading-relaxed ${
                              isAI ? 'text-gray-500' : 'text-gray-400 italic'
                            }`}>
                              {item.recommendation}
                            </p>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 하단 고정 버튼 영역 */}
            {result && (
              <div className="bg-white p-8 pt-6 border-t border-gray-100 shrink-0 flex gap-4">
                <button 
                  onClick={() => clear()} 
                  className="flex-1 py-5 bg-gray-50 text-gray-500 font-black rounded-[2rem] hover:bg-gray-100 transition-all active:scale-[0.98]"
                >
                  초기화
                </button>
                <button 
                  onClick={handleAddSchedules} 
                  disabled={saving}
                  className="flex-[2] py-5 bg-rose-500 text-white font-black rounded-[2rem] flex items-center justify-center gap-3 shadow-xl shadow-rose-200 hover:bg-rose-600 transition-all disabled:opacity-60 active:scale-[0.98]"
                >
                  {saving ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> 저장 중...</>
                  ) : (
                    <><Heart className="w-5 h-5 fill-white" /> 추천 일정 추가</>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
