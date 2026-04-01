'use client'

import { useDatePlannerStore } from '@/hooks/useDatePlannerStore'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Bot, ArrowRight, X } from 'lucide-react'

export function GlobalPlannerOverlay() {
  const { isGenerating, result, isModalOpen, openResultModal, clear } = useDatePlannerStore()

  // 모달이 열려있으면 오버레이를 숨김
  if (isModalOpen) return null

  return (
    <AnimatePresence>
      {(isGenerating || result) && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-24 left-5 right-5 z-[100] max-w-md mx-auto"
        >
          <div className="bg-white/90 backdrop-blur-md border border-rose-100/50 p-4 rounded-3xl shadow-xl shadow-rose-200/50 flex items-center justify-between">
            {isGenerating ? (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-tr from-rose-100 to-purple-100 rounded-full flex items-center justify-center shadow-inner relative">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-2 border-dashed border-rose-400 opacity-50"
                  />
                  <Bot className="w-5 h-5 text-rose-500 animate-pulse" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-500">백그라운드 작업 중</span>
                  <span className="text-sm font-black text-gray-800 tracking-tight">AI가 코스를 짜고 있어요...</span>
                </div>
              </div>
            ) : result ? (
              <>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center shadow-md shadow-rose-200">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-rose-400 uppercase tracking-widest">Done!</span>
                    <span className="text-sm font-black text-gray-800 tracking-tight">데이트 코스 완성! 🎉</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={openResultModal}
                    className="px-4 py-2 bg-rose-50 text-rose-500 text-xs font-bold rounded-full hover:bg-rose-100 transition-colors flex items-center gap-1"
                  >
                    확인하기 <ArrowRight className="w-3 h-3" />
                  </button>
                  <button onClick={clear} className="p-2 text-gray-300 hover:text-gray-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
