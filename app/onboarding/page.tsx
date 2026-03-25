'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Heart, Copy, Check, ArrowRight, Loader2, Sparkles } from 'lucide-react'
import { coupleUseCase } from '@/application/couple/usecases/CoupleUseCase'
import { supabaseBrowser } from '@/infrastructure/supabase/client'

type Step = 'choice' | 'create' | 'join'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('choice')
  const [inviteCode, setInviteCode] = useState('')
  const [generatedCode, setGeneratedCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [connectionDate, setConnectionDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreateCouple = async () => {
    setLoading(true)
    setError(null)
    const { data: sessionData } = await supabaseBrowser.auth.getSession()
    const user = sessionData?.session?.user
    if (!user) { setError('로그인이 필요합니다.'); setLoading(false); return }

    const { data, error } = await coupleUseCase.createCouple(
      user.id,
      connectionDate || undefined
    )
    if (error) { setError(error); setLoading(false); return }

    setGeneratedCode(data!.inviteCode)
    setLoading(false)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleJoinCouple = async () => {
    setLoading(true)
    setError(null)
    const { error } = await coupleUseCase.matchCouple(inviteCode.toUpperCase())
    if (error) { setError(error); setLoading(false); return }
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex items-center justify-center p-5">
      <div className="absolute top-20 -left-20 w-72 h-72 bg-rose-200 rounded-full blur-3xl opacity-25 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-rose-400 to-pink-500 rounded-2xl shadow-lg mb-4">
            <Heart className="w-8 h-8 text-white fill-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-800">커플 연결하기</h1>
          <p className="text-sm text-gray-400 mt-1">파트너와 함께 시작하세요 💕</p>
        </div>

        {/* Step: 선택 */}
        {step === 'choice' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <button
              id="create-couple-btn"
              onClick={() => setStep('create')}
              className="w-full p-5 bg-white border-2 border-rose-200 rounded-2xl flex items-center space-x-4 hover:border-rose-400 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center group-hover:bg-rose-200 transition-colors">
                <Sparkles className="w-6 h-6 text-rose-500" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800">내가 초대장 만들기</p>
                <p className="text-xs text-gray-400">초대 코드를 생성해 파트너에게 전달</p>
              </div>
            </button>

            <button
              id="join-couple-btn"
              onClick={() => setStep('join')}
              className="w-full p-5 bg-white border-2 border-pink-200 rounded-2xl flex items-center space-x-4 hover:border-pink-400 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center group-hover:bg-pink-200 transition-colors">
                <Heart className="w-6 h-6 text-pink-500" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800">초대 코드 입력하기</p>
                <p className="text-xs text-gray-400">파트너에게 받은 코드로 연결</p>
              </div>
            </button>
          </motion.div>
        )}

        {/* Step: 초대 코드 생성 */}
        {step === 'create' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {!generatedCode ? (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-2 block">우리 사귄 날 (선택)</label>
                  <input
                    id="connection-date"
                    type="date"
                    value={connectionDate}
                    onChange={(e) => setConnectionDate(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                  />
                </div>
                <button
                  id="generate-code-btn"
                  onClick={handleCreateCouple}
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-rose-400 to-pink-500 text-white font-semibold rounded-xl flex items-center justify-center space-x-2 hover:opacity-90 transition-all shadow-md"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>초대 코드 생성</span><ArrowRight className="w-4 h-4" /></>}
                </button>
              </>
            ) : (
              <div className="text-center space-y-4">
                <p className="text-sm text-gray-500">파트너에게 이 코드를 전달하세요</p>
                <div className="bg-gradient-to-br from-rose-50 to-pink-50 border-2 border-dashed border-rose-200 rounded-2xl p-6">
                  <p className="text-4xl font-black tracking-[0.3em] text-rose-500">{generatedCode}</p>
                </div>
                <button
                  id="copy-code-btn"
                  onClick={handleCopy}
                  className="w-full py-3 bg-white border border-gray-200 rounded-xl flex items-center justify-center space-x-2 text-gray-600 hover:bg-gray-50 transition-all"
                >
                  {copied ? <><Check className="w-4 h-4 text-green-500" /><span className="text-green-500">복사됨!</span></> : <><Copy className="w-4 h-4" /><span>코드 복사</span></>}
                </button>
                <p className="text-xs text-gray-400">파트너가 연결하면 자동으로 대시보드로 이동됩니다</p>
              </div>
            )}
            {error && <p className="text-xs text-red-500 text-center">{error}</p>}
            <button onClick={() => setStep('choice')} className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors">← 뒤로</button>
          </motion.div>
        )}

        {/* Step: 코드 입력 */}
        {step === 'join' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600 mb-2 block">초대 코드 입력</label>
              <input
                id="invite-code-input"
                type="text"
                placeholder="A7X9Q2"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="w-full px-4 py-4 bg-white border-2 border-gray-200 rounded-xl text-2xl font-black tracking-[0.3em] text-center text-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent uppercase"
              />
            </div>
            <button
              id="join-btn"
              onClick={handleJoinCouple}
              disabled={loading || inviteCode.length !== 6}
              className="w-full py-3 bg-gradient-to-r from-rose-400 to-pink-500 text-white font-semibold rounded-xl flex items-center justify-center space-x-2 disabled:opacity-40 hover:opacity-90 transition-all shadow-md"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>연결하기 💕</span></>}
            </button>
            {error && <p className="text-xs text-red-500 text-center">{error}</p>}
            <button onClick={() => setStep('choice')} className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors">← 뒤로</button>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
