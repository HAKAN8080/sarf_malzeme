'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { Loader2 } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const { session, loading } = useStore()

  useEffect(() => {
    if (!loading) {
      if (session) {
        router.push('/panel')
      } else {
        router.push('/giris')
      }
    }
  }, [session, loading, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))]">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--primary))] mx-auto" />
        <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">Yükleniyor...</p>
      </div>
    </div>
  )
}
