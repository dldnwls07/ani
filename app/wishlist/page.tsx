'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Plus, Heart, MapPin, X, Trash2, ExternalLink, Utensils, Coffee, Camera, Plane } from 'lucide-react'
import { wishlistUseCase } from '@/application/wishlist/usecases/WishlistUseCase'
import { useAuthStore } from '@/hooks/useAuthStore'
import { useCoupleStore } from '@/hooks/useCoupleStore'
import { WishItem, WishCategory } from '@/domain/wishlist/entities/WishItem'
import { BottomNav } from '@/components/BottomNav'
import Link from 'next/link'

export default function WishlistPage() {
  const { user } = useAuthStore()
  const { couple } = useCoupleStore()
  const [wishlist, setWishlist] = useState<WishItem[]>([])
  const [isAddOpen, setIsAddOpen] = useState(false)
  
  const [newTitle, setNewTitle] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [newCategory, setNewCategory] = useState<WishCategory>('RESTAURANT')

  // 위시리스트 로드
  const fetchWishlist = async () => {
    if (!couple) return
    const { data, error } = await wishlistUseCase.getWishlist(couple.id)
    if (!error && data) setWishlist(data)
  }

  useEffect(() => {
    fetchWishlist()
  }, [couple])

  // 위시 생성
  const handleAddWish = async () => {
    if (!newTitle.trim() || !user || !couple) return
    const { data, error } = await wishlistUseCase.createWish({
      coupleId: couple.id,
      creatorId: user.id,
      title: newTitle,
      pioneerUrl: newUrl,
      category: newCategory
    })

    if (!error && data) {
      setWishlist(prev => [data, ...prev])
      setNewTitle('')
      setNewUrl('')
      setIsAddOpen(false)
    }
  }

  // 동의(좋아요) 토글
  const handleToggleAgree = async (id: string, currentAgreed: string[]) => {
    if (!user) return
    const { data, error } = await wishlistUseCase.toggleAgree(id as any, user.id as any, currentAgreed as any)
    if (!error && data) {
      setWishlist(prev => prev.map(w => w.id === id ? { ...w, agreedBy: data } : w))
    }
  }

  const getEmoji = (category: string) => {
    switch(category) {
      case 'RESTAURANT': return <Utensils className="w-4 h-4" />
      case 'CAFE': return <Coffee className="w-4 h-4" />
      case 'EXHIBITION': return <Camera className="w-4 h-4" />
      case 'TRIP': return <Plane className="w-4 h-4" />
      default: return <Heart className="w-4 h-4" />
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50">
      {/* 헤더 */}
      <header className="p-6 pt-10 flex justify-between items-center bg-white sticky top-0 z-50 shadow-sm border-b border-gray-100">
        <Link href="/dashboard" className="p-2 -ml-2 text-gray-400">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-xl font-black text-gray-800 tracking-tight">위시리스트</h1>
        <button 
          onClick={() => setIsAddOpen(true)}
          className="w-10 h-10 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-200"
        >
          <Plus className="w-6 h-6" />
        </button>
      </header>

      {/* 카테고리 탭 (생략 가능) */}

      {/* 리스트 */}
      <div className="p-6 pb-28 space-y-4">
        {wishlist.length > 0 ? (
          wishlist.map((wish) => (
            <motion.div 
              key={wish.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-5 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col space-y-4"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500">
                    {getEmoji(wish.category)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-gray-800 tracking-tight">{wish.title}</h3>
                    <p className="text-[10px] font-bold text-gray-400 tracking-widest">{wish.category}</p>
                  </div>
                </div>
                {wish.pioneerUrl && (
                  <a href={wish.pioneerUrl} target="_blank" className="p-2 bg-gray-50 rounded-xl text-gray-400 group hover:text-rose-400 transition-colors">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>

              <div className="flex justify-between items-center pt-2">
                <div className="flex -space-x-2">
                   {/* 같이 한 사람들 아바타 등 표시 가능 */}
                </div>
                <button 
                   onClick={() => handleToggleAgree(wish.id, wish.agreedBy as any)}
                   className={`px-4 py-2 rounded-2xl flex items-center space-x-2 transition-all ${
                     wish.agreedBy.includes(user?.id as any) 
                     ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' 
                     : 'bg-gray-50 text-gray-400'
                   }`}
                >
                  <Heart className={`w-4 h-4 ${wish.agreedBy.includes(user?.id as any) ? 'fill-white' : ''}`} />
                  <span className="text-xs font-black">{wish.agreedBy.length > 0 ? wish.agreedBy.length : '나도 가고싶어'}</span>
                </button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="py-20 flex flex-col items-center justify-center grayscale opacity-30 text-center">
             <Heart className="w-16 h-16 text-gray-300 mb-4" />
             <p className="font-bold text-gray-400">우리 여기 꼭 가보자!</p>
             <p className="text-[10px] text-gray-300 mt-1">플러스 버튼을 눌러 위시를 등록해 보세요.</p>
          </div>
        )}
      </div>

      {/* 추가 모달 */}
      <AnimatePresence>
        {isAddOpen && (
          <>
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="fixed inset-0 bg-black/30 backdrop-blur-md z-[100]" onClick={() => setIsAddOpen(false)}
            />
            <motion.div 
               initial={{ y: "100%" }} animate={{ y: "0%" }} exit={{ y: "100%" }}
               className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[3.5rem] p-8 pb-12 z-[101] shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-8" />
              <h2 className="text-2xl font-black text-gray-800 mb-6">가고 싶은 곳 등록 ✨</h2>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-gray-300 tracking-widest uppercase ml-1">장소명</label>
                  <input 
                    type="text" 
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="성수동 소바식당" 
                    className="w-full mt-2 p-5 bg-gray-50 rounded-[2rem] border-none focus:ring-2 focus:ring-rose-200 font-bold" 
                  />
                </div>

                <div>
                   <label className="text-[10px] font-black text-gray-300 tracking-widest uppercase ml-1">카테고리</label>
                   <div className="grid grid-cols-4 gap-2 mt-2">
                     {(['RESTAURANT', 'CAFE', 'EXHIBITION', 'TRIP'] as WishCategory[]).map(cat => (
                       <button
                         key={cat}
                         onClick={() => setNewCategory(cat)}
                         className={`py-3 rounded-2xl text-[10px] font-black tracking-tight transition-all ${
                           newCategory === cat ? 'bg-rose-500 text-white shadow-lg' : 'bg-gray-50 text-gray-400'
                         }`}
                       >
                         {cat}
                       </button>
                     ))}
                   </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-300 tracking-widest uppercase ml-1">링크 (선택)</label>
                  <input 
                    type="text" 
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="인스타그램이나 네이버 지도 링크" 
                    className="w-full mt-2 p-5 bg-gray-50 rounded-[2rem] border-none focus:ring-2 focus:ring-rose-200 font-bold" 
                  />
                </div>

                <button 
                  onClick={handleAddWish}
                  className="w-full py-5 bg-rose-500 text-white font-black text-lg rounded-[2.5rem] shadow-xl shadow-rose-200 active:scale-95 transition-transform mt-4"
                >
                  기록하기
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 공통 하단 네비게이션 */}
      <BottomNav />
    </div>
  )
}
