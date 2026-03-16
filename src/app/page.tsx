'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { Package, ArrowRight } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const { session, loading } = useStore()
  const [showContent, setShowContent] = useState(false)
  const [showQuote, setShowQuote] = useState(false)
  const [showButton, setShowButton] = useState(false)

  useEffect(() => {
    // Animasyon sırası
    const timer1 = setTimeout(() => setShowContent(true), 300)
    const timer2 = setTimeout(() => setShowQuote(true), 800)
    const timer3 = setTimeout(() => setShowButton(true), 1500)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [])

  const handleEnter = () => {
    if (!loading) {
      if (session) {
        router.push('/panel')
      } else {
        router.push('/giris')
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Logo */}
        <div className={`transition-all duration-1000 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 shadow-2xl shadow-blue-500/25 mb-8">
            <Package className="h-10 w-10 text-white" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Sarf Malzeme
          </h1>
          <p className="text-lg text-slate-400 mb-12">
            Akıllı Stok Yönetim Sistemi
          </p>
        </div>

        {/* Quote */}
        <div className={`transition-all duration-1000 delay-300 ${showQuote ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <blockquote className="relative">
            {/* Quote marks */}
            <span className="absolute -top-8 -left-4 text-8xl text-blue-500/20 font-serif">"</span>

            <p className="text-3xl md:text-5xl font-light text-white leading-tight mb-6 italic">
              Inventory is waste.
            </p>
            <p className="text-xl md:text-2xl text-slate-300 mb-8">
              Fazla stok israftır.
            </p>

            <footer className="flex items-center justify-center gap-4">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-slate-600" />
              <div className="text-center">
                <cite className="text-lg font-medium text-white not-italic">
                  Taiichi Ohno
                </cite>
                <p className="text-sm text-slate-500">
                  Toyota Production System'in Babası
                </p>
              </div>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-slate-600" />
            </footer>
          </blockquote>
        </div>

        {/* CTA Button */}
        <div className={`mt-16 transition-all duration-1000 ${showButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <button
            onClick={handleEnter}
            className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-emerald-500 text-white font-medium rounded-full shadow-2xl shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 transition-all duration-300"
          >
            Sisteme Giriş
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <p className="mt-6 text-sm text-slate-500">
            Yalın üretim prensipleriyle stok optimizasyonu
          </p>
        </div>

        {/* Bottom Stats */}
        <div className={`mt-20 grid grid-cols-3 gap-8 transition-all duration-1000 delay-500 ${showButton ? 'opacity-100' : 'opacity-0'}`}>
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-1">JIT</div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">Just In Time</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-1">Kaizen</div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">Sürekli İyileştirme</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-1">Muda</div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">İsrafı Yok Et</div>
          </div>
        </div>
      </div>
    </div>
  )
}
