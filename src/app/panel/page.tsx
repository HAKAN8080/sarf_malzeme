'use client'

import { useMemo } from 'react'
import {
  Package,
  Store,
  AlertTriangle,
  TrendingUp,
  Clock,
  BarChart3,
} from 'lucide-react'
import { useStore } from '@/lib/store'

export default function DashboardPage() {
  const { malzemeler, magazalar, stokSatislar, hareketler } = useStore()

  // Calculate statistics
  const stats = useMemo(() => {
    // Toplam stok değeri ve satış
    const toplamStokDegeri = stokSatislar.reduce((sum, s) => sum + (s.stokTutar || 0), 0)
    const toplamCiro = stokSatislar.reduce((sum, s) => sum + (s.ciro || 0), 0)
    const toplamSatis = stokSatislar.reduce((sum, s) => sum + (s.satis || 0), 0)

    // Son hareketler
    const sonHareketler = [...hareketler]
      .sort((a, b) => new Date(b.tarih).getTime() - new Date(a.tarih).getTime())
      .slice(0, 5)

    return {
      toplamMalzeme: malzemeler.filter(m => m.aktif).length,
      toplamMagaza: magazalar.filter(m => m.aktif).length,
      toplamStokDegeri,
      toplamCiro,
      toplamSatis,
      sonHareketler,
    }
  }, [malzemeler, magazalar, stokSatislar, hareketler])

  // Get top satış by mağaza
  const topMagazalar = useMemo(() => {
    const magazaSatislar: Record<string, { magazaAdi: string; ciro: number; satis: number }> = {}

    stokSatislar.forEach(s => {
      if (!magazaSatislar[s.magazaKodu]) {
        magazaSatislar[s.magazaKodu] = { magazaAdi: s.magazaAdi, ciro: 0, satis: 0 }
      }
      magazaSatislar[s.magazaKodu].ciro += s.ciro || 0
      magazaSatislar[s.magazaKodu].satis += s.satis || 0
    })

    return Object.entries(magazaSatislar)
      .sort((a, b) => b[1].ciro - a[1].ciro)
      .slice(0, 5)
      .map(([kod, data]) => ({ magazaKodu: kod, ...data }))
  }, [stokSatislar])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Dashboard</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Stok durumu ve güncel istatistikler
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Toplam Malzeme */}
        <div className="bg-[hsl(var(--card))] rounded-xl p-5 border border-[hsl(var(--border))]">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Package className="h-5 w-5 text-blue-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[hsl(var(--foreground))]">{stats.toplamMalzeme}</div>
          <div className="text-sm text-[hsl(var(--muted-foreground))]">Aktif Malzeme</div>
        </div>

        {/* Toplam Mağaza */}
        <div className="bg-[hsl(var(--card))] rounded-xl p-5 border border-[hsl(var(--border))]">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Store className="h-5 w-5 text-green-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[hsl(var(--foreground))]">{stats.toplamMagaza}</div>
          <div className="text-sm text-[hsl(var(--muted-foreground))]">Aktif Mağaza</div>
        </div>

        {/* Toplam Ciro */}
        <div className="bg-[hsl(var(--card))] rounded-xl p-5 border border-[hsl(var(--border))]">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-purple-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[hsl(var(--foreground))]">{formatCurrency(stats.toplamCiro)}</div>
          <div className="text-sm text-[hsl(var(--muted-foreground))]">Toplam Ciro</div>
        </div>

        {/* Stok Değeri */}
        <div className="bg-[hsl(var(--card))] rounded-xl p-5 border border-[hsl(var(--border))]">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-orange-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[hsl(var(--foreground))]">{formatCurrency(stats.toplamStokDegeri)}</div>
          <div className="text-sm text-[hsl(var(--muted-foreground))]">Toplam Stok Değeri</div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Mağazalar */}
        <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))]">
          <div className="p-4 border-b border-[hsl(var(--border))]">
            <h2 className="font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
              <Store className="h-4 w-4 text-green-500" />
              En Yüksek Cirolu Mağazalar
            </h2>
          </div>
          <div className="p-4">
            {topMagazalar.length === 0 ? (
              <div className="text-center py-8 text-[hsl(var(--muted-foreground))]">
                <Store className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Veri bulunmuyor</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topMagazalar.map((item, index) => (
                  <div
                    key={item.magazaKodu}
                    className="flex items-center justify-between p-3 rounded-lg bg-[hsl(var(--muted))]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-sm font-bold text-green-600">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-sm text-[hsl(var(--foreground))]">{item.magazaAdi}</div>
                        <div className="text-xs text-[hsl(var(--muted-foreground))]">{item.magazaKodu}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">
                        {formatCurrency(item.ciro)}
                      </div>
                      <div className="text-xs text-[hsl(var(--muted-foreground))]">{item.satis.toLocaleString()} satış</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Son Hareketler */}
        <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))]">
          <div className="p-4 border-b border-[hsl(var(--border))]">
            <h2 className="font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
              <Clock className="h-4 w-4 text-[hsl(var(--primary))]" />
              Son Hareketler
            </h2>
          </div>
          <div className="p-4">
            {stats.sonHareketler.length === 0 ? (
              <div className="text-center py-8 text-[hsl(var(--muted-foreground))]">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Henüz hareket bulunmuyor</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.sonHareketler.map((hareket) => {
                  const malzeme = malzemeler.find(m => m.id === hareket.malzemeId)
                  const magaza = magazalar.find(m => m.id === hareket.magazaId)
                  const isGiris = hareket.tip === 'giris'

                  return (
                    <div
                      key={hareket.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-[hsl(var(--muted))]"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isGiris ? 'bg-green-500/10' : 'bg-red-500/10'
                        }`}>
                          <span className={`text-sm font-bold ${isGiris ? 'text-green-500' : 'text-red-500'}`}>
                            {isGiris ? '+' : '-'}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-sm text-[hsl(var(--foreground))]">
                            {malzeme?.ad || 'Bilinmeyen'}
                          </div>
                          <div className="text-xs text-[hsl(var(--muted-foreground))]">
                            {magaza?.magazaAdi || 'Bilinmeyen'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${isGiris ? 'text-green-600' : 'text-red-600'}`}>
                          {isGiris ? '+' : '-'}{hareket.miktar}
                        </div>
                        <div className="text-xs text-[hsl(var(--muted-foreground))]">
                          {formatDate(hareket.tarih)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Özet Bilgi */}
      <div className="mt-6 bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-6">
        <h2 className="font-semibold text-[hsl(var(--foreground))] mb-4">Stok-Satış Özeti</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-4 rounded-lg bg-[hsl(var(--muted))]">
            <div className="text-2xl font-bold text-[hsl(var(--foreground))]">{stokSatislar.length}</div>
            <div className="text-xs text-[hsl(var(--muted-foreground))]">Kayıt Sayısı</div>
          </div>
          <div className="p-4 rounded-lg bg-[hsl(var(--muted))]">
            <div className="text-2xl font-bold text-[hsl(var(--foreground))]">{stats.toplamSatis.toLocaleString()}</div>
            <div className="text-xs text-[hsl(var(--muted-foreground))]">Toplam Satış Adet</div>
          </div>
          <div className="p-4 rounded-lg bg-[hsl(var(--muted))]">
            <div className="text-2xl font-bold text-[hsl(var(--foreground))]">{formatCurrency(stats.toplamCiro)}</div>
            <div className="text-xs text-[hsl(var(--muted-foreground))]">Toplam Ciro</div>
          </div>
          <div className="p-4 rounded-lg bg-[hsl(var(--muted))]">
            <div className="text-2xl font-bold text-[hsl(var(--foreground))]">{formatCurrency(stats.toplamStokDegeri)}</div>
            <div className="text-xs text-[hsl(var(--muted-foreground))]">Stok Değeri</div>
          </div>
        </div>
      </div>
    </div>
  )
}
