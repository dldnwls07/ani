'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Sparkles, MapPin, Clock, Calendar, Check, X, Loader2 } from 'lucide-react'
import { datePlannerUseCase, DateCourse } from '@/application/schedule/usecases/DatePlannerUseCase'
import { useAuthStore } from '@/hooks/useAuthStore'
import { useCoupleStore } from '@/hooks/useCoupleStore'

export function DatePlannerModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { user } = useAuthStore()
  const { couple } = useCoupleStore()
  const [loading, setLoading] = useState(false)
  const [recommendation, setRecommendation] = useState<DateCourse | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  const handleGenerate = async () => {
    if (!couple) return
    setLoading(true)
    const { data, error } = await datePlannerUseCase.getAIRecommendation(couple.id, selectedDate)
    if (!error && data) {
      setRecommendation(data)
    }
    setLoading(false)
  }

  const handleAddSchedules = () => {
    // 코스 전체를 일정에 추가하는 로직 (이후 구현)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]" 
            onClick={onClose} 
          />
          <motion.div 
            initial={{ y: "100%" }} animate={{ y: "0%" }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[3rem] p-8 pb-12 z-[201] shadow-2xl overflow-y-auto max-h-[90vh]"
          >
            {/* 핸들 바 */}
            <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-6" />

            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                  AI 데이트 큐레이션 <Sparkles className="w-6 h-6 text-yellow-400 fill-yellow-200" />
                </h2>
                <p className="text-sm text-gray-400 font-medium">우리의 일정을 분석해 데이트를 짜드릴게요!</p>
              </div>
              <button onClick={onClose} className="p-2 bg-gray-50 rounded-full text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!recommendation && !loading && (
              <div className="space-y-6">
                <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100">
                  <label className="text-xs font-bold text-rose-400 uppercase tracking-widest block mb-4">날짜 선택</label>
                  <div className="flex items-center space-x-3 bg-white p-4 rounded-2xl shadow-sm border border-rose-100/50">
                    <Calendar className="w-5 h-5 text-rose-500" />
                    <input 
                      type="date" 
                      value={selectedDate} 
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="flex-1 bg-transparent text-gray-700 font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {['무드 있는', '활동적인', '차분한', '색다른'].map(tag => (
                    <div key={tag} className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-center space-x-2 text-gray-500">
                      <Check className="w-4 h-4" />
                      <span className="text-sm font-semibold">{tag} 데이트</span>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={handleGenerate}
                  className="w-full py-4 bg-gradient-to-r from-rose-400 to-pink-500 text-white font-black text-lg rounded-3xl shadow-lg shadow-rose-200 hover:scale-[1.02] active:scale-[98%] transition-all"
                >
                  AI 코스 조율하기 ✨
                </button>
              </div>
            )}

            {loading && (
              <div className="py-20 flex flex-col items-center justify-center space-y-4">
                <motion.div 
                  animate={{ rotate: 360, scale: [1, 1.2, 1] }} 
                  transition={{ repeat: Infinity, duration: 2 }} 
                  className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center"
                >
                  <Sparkles className="w-10 h-10 text-rose-500" />
                </motion.div>
                <p className="text-gray-400 font-bold animate-pulse italic">최적의 코스를 조합하고 있습니다...</p>
              </div>
            )}

            {recommendation && !loading && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                <div className="text-center p-2">
                  <h3 className="text-xl font-extrabold text-gray-800">{recommendation.title}</h3>
                  <p className="text-sm text-rose-400 mt-1">{recommendation.reason}</p>
                </div>

                <div className="space-y-1 relative">
                  <div className="absolute left-[27px] top-6 bottom-6 w-0.5 bg-rose-100" />
                  {recommendation.items.map((item, idx) => (
                    <motion.div 
                      key={idx} 
                      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}
                      className="flex items-start space-x-4 p-4 relative"
                    >
                      <div className="w-7 h-7 bg-white border-2 border-rose-400 rounded-full flex items-center justify-center text-[10px] font-black text-rose-500 shadow-sm z-10 shrink-0 mt-1">
                        {idx + 1}
                      </div>
                      <div className="bg-gray-50/50 p-4 rounded-3xl flex-1 border border-gray-100 hover:bg-rose-50/30 transition-colors">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-black text-rose-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {item.time}
                          </span>
                          <span className="px-2 py-0.5 bg-white border border-gray-100 text-[10px] font-bold text-gray-400 rounded-full uppercase italic tracking-tighter shadow-sm">{item.category}</span>
                        </div>
                        <h4 className="font-bold text-gray-800 flex items-center gap-1 tracking-tight">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" /> {item.place}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1.5 leading-relaxed font-medium">"{item.recommendation}"</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button onClick={() => setRecommendation(null)} className="py-4 bg-gray-50 text-gray-500 font-bold rounded-2xl hover:bg-gray-100 transition shadow-sm">다시 추천기</button>
                  <button onClick={handleAddSchedules} className="py-4 bg-rose-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-rose-600 transition shadow-lg shadow-rose-200">
                    <Heart className="w-4 h-4 fill-white" /> 전체 일정 등록
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
