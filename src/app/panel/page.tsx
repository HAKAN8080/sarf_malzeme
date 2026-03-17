'use client'

import { useMemo } from 'react'
import {
  Package,
  Store,
  TrendingUp,
  BarChart3,
  Truck,
  Factory,
} from 'lucide-react'
import { useStore } from '@/lib/store'

export default function DashboardPage() {
  const { malzemeler, magazalar, stokSatislar } = useStore()

  // Aktif malzeme ve mağazalar
  const aktivMalzemeler = useMemo(() => malzemeler.filter(m => m.aktif), [malzemeler])
  const aktivMagazalar = useMemo(() => magazalar.filter(m => m.aktif), [magazalar])

  // Calculate statistics
  const stats = useMemo(() => {
    // Aktif mağazaların kodlarını al
    const aktiveMagazaKodlari = new Set(aktivMagazalar.map(m => m.magazaKodu))

    // Sadece aktif mağazaların stok/satış verilerini hesapla
    const aktifStokSatislar = stokSatislar.filter(s => aktiveMagazaKodlari.has(s.magazaKodu))

    // Toplam stok değeri ve satış (sadece aktif mağazalar)
    const toplamStokDegeri = aktifStokSatislar.reduce((sum, s) => sum + (s.stokTutar || 0), 0)
    const toplamCiro = aktifStokSatislar.reduce((sum, s) => sum + (s.ciro || 0), 0)
    const toplamSatis = aktifStokSatislar.reduce((sum, s) => sum + (s.satis || 0), 0)

    return {
      toplamMalzeme: aktivMalzemeler.length,
      toplamMagaza: aktivMagazalar.length,
      toplamStokDegeri,
      toplamCiro,
      toplamSatis,
    }
  }, [aktivMalzemeler, aktivMagazalar, stokSatislar])

  // Top 10 Malzeme özeti (genel toplam - mağaza bazlı değil)
  const top10Malzemeler = useMemo(() => {
    const aktiveMagazaKodlari = new Set(aktivMagazalar.map(m => m.magazaKodu))

    // Malzeme bazlı toplamları hesapla
    const malzemeMap: Record<string, {
      malzemeKodu: string
      malzemeAdi: string
      depoStok: number
      magazaStok: number
      satisAdet: number
      sevkMiktari: number
      uretimTalep: number
    }> = {}

    // stokSatislar'dan mağaza stok ve satış toplamlarını hesapla
    for (const s of stokSatislar) {
      // Sadece aktif mağazaların verilerini al
      if (!aktiveMagazaKodlari.has(s.magazaKodu)) continue

      if (!malzemeMap[s.malzemeKodu]) {
        const malzeme = aktivMalzemeler.find(m => m.malzemeKodu === s.malzemeKodu)
        if (!malzeme) continue

        malzemeMap[s.malzemeKodu] = {
          malzemeKodu: s.malzemeKodu,
          malzemeAdi: malzeme.ad,
          depoStok: malzeme.depoStok || 0,
          magazaStok: 0,
          satisAdet: 0,
          sevkMiktari: 0,
          uretimTalep: 0,
        }
      }

      // Mağaza stok toplamı
      malzemeMap[s.malzemeKodu].magazaStok += s.stok || 0
      // Satış toplamı
      malzemeMap[s.malzemeKodu].satisAdet += s.satis || 0
    }

    // Basit sevk/üretim ihtiyacı hesapla (son hafta satış × 4 hafta - mevcut stok)
    for (const kod of Object.keys(malzemeMap)) {
      const m = malzemeMap[kod]
      const haftalikSatis = m.satisAdet / 4 // Ortalama haftalık satış (son 4 hafta verisi varsayımı)
      const tahminiIhtiyac = haftalikSatis * 4 // 4 haftalık ihtiyaç

      // Sevk ihtiyacı: Mağaza stoğu yetersizse
      const magazaEksik = Math.max(0, tahminiIhtiyac - m.magazaStok)
      m.sevkMiktari = Math.min(magazaEksik, m.depoStok) // Depodan sevk edilebilecek miktar

      // Üretim talebi: Depo + mağaza stoğu toplam ihtiyacı karşılamıyorsa
      const toplamStok = m.depoStok + m.magazaStok
      m.uretimTalep = Math.max(0, tahminiIhtiyac * 1.5 - toplamStok) // 1.5x güvenlik payı
    }

    // Satış adedine göre sırala ve ilk 10'u al
    return Object.values(malzemeMap)
      .sort((a, b) => b.satisAdet - a.satisAdet)
      .slice(0, 10)
  }, [stokSatislar, aktivMalzemeler, aktivMagazalar])

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

      {/* Top 10 Malzeme Özeti */}
      {top10Malzemeler.length > 0 && (
        <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] mb-6">
          <div className="p-4 border-b border-[hsl(var(--border))]">
            <h2 className="font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-500" />
              Top 10 Malzeme Özeti (Genel Toplam)
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
                  <th className="text-left px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Malzeme</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Depo Stok</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Mağaza Stok</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Satış Adet</th>
                  <th className="text-center px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap bg-blue-50 dark:bg-blue-900/10">Sevk Miktarı</th>
                  <th className="text-center px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap bg-orange-50 dark:bg-orange-900/10">Üretim Talep</th>
                </tr>
              </thead>
              <tbody>
                {top10Malzemeler.map((m, index) => (
                  <tr key={m.malzemeKodu} className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-500 text-xs font-bold flex items-center justify-center">{index + 1}</span>
                        <div>
                          <div className="text-sm font-medium text-[hsl(var(--foreground))]">{m.malzemeAdi}</div>
                          <div className="text-xs text-[hsl(var(--muted-foreground))]">{m.malzemeKodu}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap font-medium text-[hsl(var(--foreground))]">{m.depoStok.toLocaleString('tr-TR')}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap text-[hsl(var(--foreground))]">{m.magazaStok.toLocaleString('tr-TR')}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap text-[hsl(var(--foreground))]">{Math.round(m.satisAdet).toLocaleString('tr-TR')}</td>
                    <td className="px-3 py-2 text-center whitespace-nowrap bg-blue-50/50 dark:bg-blue-900/5">
                      {m.sevkMiktari > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/10 text-blue-600 font-bold text-xs">
                          <Truck className="h-3 w-3" />
                          {Math.round(m.sevkMiktari).toLocaleString('tr-TR')}
                        </span>
                      ) : <span className="text-[hsl(var(--muted-foreground))]">-</span>}
                    </td>
                    <td className="px-3 py-2 text-center whitespace-nowrap bg-orange-50/50 dark:bg-orange-900/5">
                      {m.uretimTalep > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-500/10 text-orange-600 font-bold text-xs">
                          <Factory className="h-3 w-3" />
                          {Math.round(m.uretimTalep).toLocaleString('tr-TR')}
                        </span>
                      ) : <span className="text-[hsl(var(--muted-foreground))]">-</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
