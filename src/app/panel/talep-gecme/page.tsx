'use client'

import { useState, useMemo } from 'react'
import {
  ShoppingCart,
  Package,
  Search,
  Send,
  AlertCircle,
  CheckCircle,
  Loader2,
  Info,
} from 'lucide-react'
import { useStore } from '@/lib/store'
import type { StokSatis } from '@/lib/types'

export default function TalepGecmePage() {
  const {
    malzemeler,
    magazalar,
    stokSatislar,
    session,
    kullanicilar,
    talepler,
    bulkAddTalepler
  } = useStore()

  const [searchTerm, setSearchTerm] = useState('')
  const [talepMiktarlari, setTalepMiktarlari] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Kullanıcının mağaza bilgisini al
  const kullanici = kullanicilar.find(k => k.id === session?.userId)
  const userMagaza = magazalar.find(m => m.id === kullanici?.magazaId)

  // Veri setindeki en son hafta bilgisini al
  const getLatestWeekFromData = () => {
    if (stokSatislar.length === 0) {
      const now = new Date()
      const startOfYear = new Date(now.getFullYear(), 0, 1)
      const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000))
      const currentWeek = Math.ceil((days + startOfYear.getDay() + 1) / 7)
      return { yil: now.getFullYear(), hafta: currentWeek }
    }

    return stokSatislar.reduce((latest, current) => {
      if (current.yil > latest.yil) return { yil: current.yil, hafta: current.hafta }
      if (current.yil === latest.yil && current.hafta > latest.hafta) return { yil: current.yil, hafta: current.hafta }
      return latest
    }, { yil: stokSatislar[0].yil, hafta: stokSatislar[0].hafta })
  }

  const { yil: currentYil, hafta: currentHafta } = getLatestWeekFromData()

  // Performans için Map-based index
  const stokSatisIndex = useMemo(() => {
    const latest = new Map<string, StokSatis>()

    for (const s of stokSatislar) {
      if (userMagaza && s.magazaKodu !== userMagaza.magazaKodu) continue

      const key = `${s.magazaKodu}-${s.malzemeKodu}`
      const existing = latest.get(key)
      if (!existing || s.yil > existing.yil || (s.yil === existing.yil && s.hafta > existing.hafta)) {
        latest.set(key, s)
      }
    }

    return latest
  }, [stokSatislar, userMagaza])

  // Aktif malzemeler ve stok bilgileri
  const malzemeListesi = useMemo(() => {
    if (!userMagaza) return []

    const aktivMalzemeler = malzemeler.filter(m => m.aktif)

    return aktivMalzemeler.map(malzeme => {
      const key = `${userMagaza.magazaKodu}-${malzeme.malzemeKodu}`
      const stokData = stokSatisIndex.get(key)

      return {
        malzemeKodu: malzeme.malzemeKodu,
        malzemeAdi: malzeme.ad,
        anaGrup: malzeme.anaGrup,
        stok: stokData?.stok || 0,
        satis: stokData?.satis || 0,
        yoldakiMiktar: stokData?.acikSiparis || 0,
        depoStok: malzeme.depoStok,
      }
    }).filter(m => {
      if (!searchTerm) return true
      const term = searchTerm.toLowerCase()
      return (
        m.malzemeKodu.toLowerCase().includes(term) ||
        m.malzemeAdi.toLowerCase().includes(term) ||
        m.anaGrup.toLowerCase().includes(term)
      )
    })
  }, [malzemeler, userMagaza, stokSatisIndex, searchTerm])

  // Bekleyen talepler
  const bekleyenTalepler = useMemo(() => {
    if (!userMagaza) return []
    return talepler.filter(t => t.magazaKodu === userMagaza.magazaKodu && t.durum === 'beklemede')
  }, [talepler, userMagaza])

  // Talep miktarı değişikliği
  const handleMiktarChange = (malzemeKodu: string, miktar: number) => {
    setTalepMiktarlari(prev => ({
      ...prev,
      [malzemeKodu]: miktar > 0 ? miktar : 0
    }))
  }

  // Talep gönder
  const handleSubmit = async () => {
    if (!session || !userMagaza) return

    const talepEdilecekler = Object.entries(talepMiktarlari)
      .filter(([_, miktar]) => miktar > 0)
      .map(([malzemeKodu, miktar]) => {
        const malzemeData = malzemeListesi.find(m => m.malzemeKodu === malzemeKodu)
        const malzeme = malzemeler.find(m => m.malzemeKodu === malzemeKodu)

        return {
          magazaKodu: userMagaza.magazaKodu,
          magazaAdi: userMagaza.magazaAdi,
          malzemeKodu: malzemeKodu,
          malzemeAdi: malzeme?.ad || malzemeData?.malzemeAdi || '',
          talepMiktari: miktar,
          sonHaftaStok: malzemeData?.stok || 0,
          sonHaftaSatis: malzemeData?.satis || 0,
          yoldakiMiktar: malzemeData?.yoldakiMiktar || 0,
          depoStok: malzemeData?.depoStok || 0,
          durum: 'beklemede' as const,
          talepEdenKullaniciId: session.userId,
          talepEdenAd: session.ad,
          talepTarihi: new Date().toISOString(),
        }
      })

    if (talepEdilecekler.length === 0) {
      setErrorMessage('Lütfen en az bir malzeme için talep miktarı girin.')
      setTimeout(() => setErrorMessage(''), 3000)
      return
    }

    setSubmitting(true)
    setErrorMessage('')

    try {
      await bulkAddTalepler(talepEdilecekler)
      setSuccessMessage(`${talepEdilecekler.length} adet talep başarıyla gönderildi!`)
      setTalepMiktarlari({})
      setTimeout(() => setSuccessMessage(''), 5000)
    } catch (error) {
      console.error('Talep gönderme hatası:', error)
      setErrorMessage('Talep gönderilirken bir hata oluştu.')
      setTimeout(() => setErrorMessage(''), 5000)
    } finally {
      setSubmitting(false)
    }
  }

  // Toplam talep sayısı
  const toplamTalepSayisi = Object.values(talepMiktarlari).filter(m => m > 0).length

  // Mağaza rolü kontrolü
  if (session?.rol !== 'magaza') {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/20 rounded-xl p-6 text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-yellow-700 dark:text-yellow-400 mb-2">
            Erişim Kısıtlı
          </h2>
          <p className="text-yellow-600 dark:text-yellow-500">
            Bu sayfa sadece mağaza kullanıcıları için kullanılabilir.
          </p>
        </div>
      </div>
    )
  }

  if (!userMagaza) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 rounded-xl p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">
            Mağaza Bulunamadı
          </h2>
          <p className="text-red-600 dark:text-red-500">
            Hesabınıza tanımlı bir mağaza bulunamadı. Lütfen yöneticinizle iletişime geçin.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Talep Geçme</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {userMagaza.magazaAdi} ({userMagaza.magazaKodu}) - Hafta {currentHafta}/{currentYil}
            {stokSatislar.length === 0 && ' • Stok-Satış verisi yok'}
            {stokSatislar.length > 0 && stokSatisIndex.size === 0 && ` • Bu mağaza için veri yok (toplam ${stokSatislar.length} kayıt)`}
          </p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={submitting || toplamTalepSayisi === 0}
          className="flex items-center gap-2 px-6 py-2.5 bg-[hsl(var(--primary))] text-white rounded-lg hover:bg-[hsl(var(--primary))]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Talep Gönder ({toplamTalepSayisi})
        </button>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/20 rounded-lg flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <span className="text-green-700 dark:text-green-400">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <span className="text-red-700 dark:text-red-400">{errorMessage}</span>
        </div>
      )}

      {/* Bekleyen Talepler Uyarısı */}
      {bekleyenTalepler.length > 0 && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/20 rounded-lg flex items-center gap-3">
          <Info className="h-5 w-5 text-blue-500" />
          <span className="text-blue-700 dark:text-blue-400">
            {bekleyenTalepler.length} adet bekleyen talebiniz bulunmaktadır.
          </span>
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          <input
            type="text"
            placeholder="Malzeme ara (kod, ad, grup)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
          />
        </div>
      </div>

      {/* Tablo */}
      <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
                <th className="text-left px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Malzeme</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Stok</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Satış</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Yol</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Depo Stok</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase bg-green-50 dark:bg-green-900/10">Talep Adet</th>
              </tr>
            </thead>
            <tbody>
              {malzemeListesi.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-[hsl(var(--muted-foreground))]">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Malzeme bulunamadı</p>
                  </td>
                </tr>
              ) : (
                malzemeListesi.map((item) => {
                  const talepMiktari = talepMiktarlari[item.malzemeKodu] || 0
                  const bekleyenTalep = bekleyenTalepler.find(t => t.malzemeKodu === item.malzemeKodu)

                  return (
                    <tr
                      key={item.malzemeKodu}
                      className={`border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] ${
                        talepMiktari > 0 ? 'bg-green-50/50 dark:bg-green-900/5' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[hsl(var(--primary))]/10 flex items-center justify-center flex-shrink-0">
                            <Package className="h-4 w-4 text-[hsl(var(--primary))]" />
                          </div>
                          <div>
                            <div className="font-medium text-[hsl(var(--foreground))]">{item.malzemeAdi}</div>
                            <div className="text-xs text-[hsl(var(--muted-foreground))]">
                              {item.malzemeKodu} • {item.anaGrup}
                              {bekleyenTalep && (
                                <span className="ml-2 text-blue-500">(Bekleyen: {bekleyenTalep.talepMiktari})</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span className={item.stok === 0 ? 'text-red-500 font-medium' : ''}>
                          {item.stok.toLocaleString('tr-TR')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">{item.satis.toLocaleString('tr-TR')}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap text-[hsl(var(--muted-foreground))]">
                        {item.yoldakiMiktar.toLocaleString('tr-TR')}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span className={item.depoStok === 0 ? 'text-orange-500' : ''}>
                          {item.depoStok.toLocaleString('tr-TR')}
                        </span>
                      </td>
                      <td className="px-4 py-3 bg-green-50/50 dark:bg-green-900/5">
                        <div className="flex justify-center">
                          <input
                            type="number"
                            min="0"
                            value={talepMiktari || ''}
                            onChange={(e) => handleMiktarChange(item.malzemeKodu, parseInt(e.target.value) || 0)}
                            placeholder="0"
                            className="w-24 px-3 py-1.5 text-center rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Bar */}
      {toplamTalepSayisi > 0 && (
        <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-[hsl(var(--card))] border-t border-[hsl(var(--border))] p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-[hsl(var(--primary))]" />
            <span className="font-medium">{toplamTalepSayisi} malzeme seçildi</span>
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2 bg-[hsl(var(--primary))] text-white rounded-lg hover:bg-[hsl(var(--primary))]/90 transition-colors disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Talep Gönder
          </button>
        </div>
      )}
    </div>
  )
}
