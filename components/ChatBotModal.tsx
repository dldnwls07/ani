'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Heart, Sparkles, X, User, Bot, Loader2 } from 'lucide-react'
import { chatUseCase } from '@/application/chat/usecases/ChatUseCase'
import { useAuthStore } from '@/hooks/useAuthStore'
import { useCoupleStore } from '@/hooks/useCoupleStore'
import { Message } from '@/domain/chat/entities/Message'

export function ChatBotModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { user } = useAuthStore()
  const { couple, partner } = useCoupleStore()
  const [messages, setMessages] = useState<any[]>([
    { id: 'welcome', sender_id: null, content: '안녕하세요! 두 분의 로맨틱한 일상을 돕는 AI 비서 ani입니다. 무엇이든 물어보세요! 💞', created_at: new Date() }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  const handleSend = async () => {
    if (!inputValue.trim() || !user || !couple) return
    
    const userMsg = inputValue
    setInputValue('')
    
    // 1. 유저 메시지 UI 먼저 반영 (낙관적 업데이트)
    const newUserMsg = { id: Date.now().toString(), sender_id: user.id, content: userMsg, created_at: new Date() }
    setMessages(prev => [...prev, newUserMsg])

    // 2. AI 생각 중...
    setIsTyping(true)

    // 3. AI 답변 요청
    const { data: aiResponse, error } = await chatUseCase.getAIResponse(couple.id, userMsg)
    
    if (!error && aiResponse) {
      const newAiMsg = { id: (Date.now() + 1).toString(), sender_id: null, content: aiResponse, created_at: new Date() }
      setMessages(prev => [...prev, newAiMsg])
    }
    
    setIsTyping(false)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]" onClick={onClose} 
          />
          <motion.div 
            initial={{ y: "100%", opacity: 0 }} animate={{ y: "0%", opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[3rem] p-0 z-[201] shadow-2xl flex flex-col h-[85vh]"
          >
            {/* 헤더 */}
            <div className="p-6 border-b border-gray-50 flex justify-between items-center shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-200">
                  <Heart className="w-5 h-5 fill-white" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-800 tracking-tight">ani Assistant</h2>
                  <p className="text-[10px] font-bold text-rose-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> AI 커플 비서 작동 중
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 채팅 영역 */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
              {messages.map((msg) => {
                const isMe = msg.sender_id === user?.id
                const isAI = msg.sender_id === null

                return (
                  <motion.div 
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                        isMe ? 'bg-rose-50 text-rose-400 ml-1' : isAI ? 'bg-pink-500 text-white mr-1' : 'bg-gray-100 text-gray-400 mr-1'
                      }`}>
                        {isMe ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>
                      
                      <div className={`px-4 py-3 rounded-2xl text-sm font-medium leading-relaxed ${
                        isMe 
                          ? 'bg-rose-500 text-white rounded-br-none shadow-lg shadow-rose-100' 
                          : 'bg-gray-50 text-gray-700 rounded-bl-none border border-gray-100'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  </motion.div>
                )
              })}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-center space-x-2 bg-gray-50 px-4 py-3 rounded-2xl rounded-bl-none border border-gray-100 text-gray-300">
                    <Loader2 className="w-4 h-4 animate-spin text-pink-400" />
                    <span className="text-xs font-bold italic">ani가 생각하는 중...</span>
                  </div>
                </div>
              )}
            </div>

            {/* 입력창 */}
            <div className="p-6 pt-2 bg-white sticky bottom-0 border-t border-gray-50">
              <div className="flex items-center bg-gray-50 rounded-2xl p-2 pl-4 border border-gray-100 focus-within:ring-2 focus-within:ring-rose-200 transition-all shadow-inner">
                <input 
                  type="text" 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyUp={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="무엇이든 물어보세요..."
                  className="flex-1 bg-transparent border-none text-sm font-medium focus:outline-none placeholder:text-gray-300"
                />
                <button 
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-rose-200 disabled:opacity-50 active:scale-95 transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
