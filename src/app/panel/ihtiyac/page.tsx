'use client'

import { useState, useMemo } from 'react'
import {
  BarChart3,
  Filter,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  ShoppingCart,
  Calculator,
  Info,
  Truck,
  Factory,
  Package,
} from 'lucide-react'
import { useStore } from '@/lib/store'
import type { IhtiyacSonuc, UretimOzeti } from '@/lib/types'

export default function IhtiyacPage() {
  const { malzemeler, magazalar, stokSatislar } = useStore()
  const [selectedMagaza, setSelectedMagaza] = useState('')
  const [selectedMalzeme, setSelectedMalzeme] = useState('')
  const [guvenlikKatsayisi, setGuvenlikKatsayisi] = useState(1.0)
  const [activeTab, setActiveTab] = useState<'magaza' | 'uretim'>('magaza')

  // Aktif mağaza ve malzemeler
  const aktivMagazalar = magazalar.filter(m => m.aktif)
  const aktivMalzemeler = malzemeler.filter(m => m.aktif)

  // Veri setindeki en son hafta bilgisini al (bugünü değil, verideki son haftayı kullan)
  const getLatestWeekFromData = () => {
    if (stokSatislar.length === 0) {
      // Veri yoksa bugünü kullan
      const now = new Date()
      const startOfYear = new Date(now.getFullYear(), 0, 1)
      const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000))
      const currentWeek = Math.ceil((days + startOfYear.getDay() + 1) / 7)
      return { yil: now.getFullYear(), hafta: currentWeek }
    }

    // Verideki en son haftayı bul
    return stokSatislar.reduce((latest, current) => {
      if (current.yil > latest.yil) return { yil: current.yil, hafta: current.hafta }
      if (current.yil === latest.yil && current.hafta > latest.hafta) return { yil: current.yil, hafta: current.hafta }
      return latest
    }, { yil: stokSatislar[0].yil, hafta: stokSatislar[0].hafta })
  }

  const { yil: currentYil, hafta: currentHafta } = getLatestWeekFromData()

  // Hafta bazlı satış verisi getir
  const getSalesForWeek = (magazaKodu: string, malzemeKodu: string, yil: number, hafta: number): number | null => {
    const record = stokSatislar.find(s =>
      s.magazaKodu === magazaKodu &&
      s.malzemeKodu === malzemeKodu &&
      s.yil === yil &&
      s.hafta === hafta
    )
    return record ? record.satis : null
  }

  // Son stok bilgisini getir
  const getLatestStockInfo = (magazaKodu: string, malzemeKodu: string): { stok: number; acikSiparis: number; ypiSuresi: number } => {
    const records = stokSatislar
      .filter(s => s.magazaKodu === magazaKodu && s.malzemeKodu === malzemeKodu)
      .sort((a, b) => {
        if (a.yil !== b.yil) return b.yil - a.yil
        return b.hafta - a.hafta
      })

    if (records.length > 0) {
      return {
        stok: records[0].stok,
        acikSiparis: records[0].acikSiparis,
        ypiSuresi: records[0].ypiSuresi
      }
    }
    return { stok: 0, acikSiparis: 0, ypiSuresi: 0 }
  }

  // Hafta numarasını bir önceki haftaya çevir
  const getPreviousWeek = (yil: number, hafta: number): { yil: number; hafta: number } => {
    if (hafta > 1) {
      return { yil, hafta: hafta - 1 }
    }
    return { yil: yil - 1, hafta: 52 }
  }

  // Mağaza bazlı ihtiyaç hesaplama
  const ihtiyaclar = useMemo<IhtiyacSonuc[]>(() => {
    const results: IhtiyacSonuc[] = []

    const targetMagazalar = selectedMagaza
      ? aktivMagazalar.filter(m => m.id === selectedMagaza)
      : aktivMagazalar

    const targetMalzemeler = selectedMalzeme
      ? aktivMalzemeler.filter(m => m.id === selectedMalzeme)
      : aktivMalzemeler

    // Satış tetikleyicili malzemeleri filtrele (Satış, Satış adeti, vb.)
    const satisTetikmliMalzemeler = targetMalzemeler.filter(m =>
      m.tetikleyici?.toLowerCase().includes('satış') ||
      m.tetikleyici?.toLowerCase().includes('satis')
    )

    for (const magaza of targetMagazalar) {
      for (const malzeme of satisTetikmliMalzemeler) {
        const metodNotlar: string[] = []

        // Son 3 hafta için hafta bilgilerini hesapla
        const h1 = getPreviousWeek(currentYil, currentHafta)
        const h2 = getPreviousWeek(h1.yil, h1.hafta)
        const h3 = getPreviousWeek(h2.yil, h2.hafta)

        // Satış verilerini al
        let sonHaftaSatis = getSalesForWeek(magaza.magazaKodu, malzeme.malzemeKodu, h1.yil, h1.hafta)
        let oncekiHaftaSatis = getSalesForWeek(magaza.magazaKodu, malzeme.malzemeKodu, h2.yil, h2.hafta)
        let dahaOncekiSatis = getSalesForWeek(magaza.magazaKodu, malzeme.malzemeKodu, h3.yil, h3.hafta)

        // Ortalama hesapla
        const validSales = [sonHaftaSatis, oncekiHaftaSatis, dahaOncekiSatis].filter(s => s !== null) as number[]
        const ortalama = validSales.length > 0
          ? validSales.reduce((a, b) => a + b, 0) / validSales.length
          : 0

        // Eksik verileri ortalama ile doldur
        if (sonHaftaSatis === null) {
          sonHaftaSatis = ortalama
          if (ortalama > 0) metodNotlar.push('Son H: ort')
        }
        if (oncekiHaftaSatis === null) {
          oncekiHaftaSatis = ortalama
          if (ortalama > 0) metodNotlar.push('Önc H: ort')
        }
        if (dahaOncekiSatis === null) {
          dahaOncekiSatis = ortalama
          if (ortalama > 0) metodNotlar.push('2H: ort')
        }

        // Ağırlıklı ortalama (haftalık)
        const agirlikliOrtalama = (sonHaftaSatis * 0.6) + (oncekiHaftaSatis * 0.3) + (dahaOncekiSatis * 0.1)

        // YoY katsayısı
        const gecenYilBuHafta = getSalesForWeek(magaza.magazaKodu, malzeme.malzemeKodu, currentYil - 1, currentHafta)
        const gecenYilGelecekHafta = getSalesForWeek(magaza.magazaKodu, malzeme.malzemeKodu, currentYil - 1, currentHafta < 52 ? currentHafta + 1 : 1)

        let yoyKatsayi = 1
        if (gecenYilBuHafta !== null && gecenYilGelecekHafta !== null && gecenYilBuHafta > 0) {
          yoyKatsayi = gecenYilGelecekHafta / gecenYilBuHafta
          yoyKatsayi = Math.max(0.5, Math.min(2.0, yoyKatsayi))
        } else {
          metodNotlar.push('YoY:1x')
        }

        // Tahmin satış (haftalık)
        const tahminSatis = agirlikliOrtalama * yoyKatsayi

        // Son hafta stok verilerini al (StokSatis'ten)
        const { stok: mevcutStok, acikSiparis, ypiSuresi } = getLatestStockInfo(magaza.magazaKodu, malzeme.malzemeKodu)

        // Yoldaki miktar = açık sipariş (yolda olan)
        const yoldakiMiktar = acikSiparis

        // Depo stok ve güvenlik stok (malzeme master verisinden)
        const depoStok = malzeme.depoStok
        const depoGuvenlikStok = Math.round(malzeme.guvenlikStok * guvenlikKatsayisi) // Depo için

        // Mağaza min stok = Son hafta satış (0 ise ortalama kullan)
        const magazaMinStok = sonHaftaSatis > 0 ? sonHaftaSatis : (ortalama > 0 ? ortalama : 0)

        // Min miktarlar
        const minSevkMiktari = malzeme.minSevkMiktari || 1
        const minSiparisMiktari = malzeme.minSiparisMiktari || 1

        // Süre bilgileri (zaten hafta olarak giriliyor)
        const tedarikSuresi = malzeme.ortalamaTedarikSuresi || 1
        const ekSure = malzeme.ortalamaEkSure || 0
        const toplamTedarikSuresi = tedarikSuresi + ekSure
        const sevkSuresi = magaza.yolSuresi || 3 // Mağaza yol süresi (hafta) - cluster'dan gelir

        // Birim tüketim ve fire
        const birimTuketim = malzeme.birimTuketimMiktar || 1
        const fireOrani = malzeme.fireOrani || 0

        // =====================
        // SEVKİYAT HESABI (YoY ile çoklu hafta forecast)
        // =====================
        // Her hafta için YoY katsayısı ile forecast yap
        const getNextWeek = (yil: number, hafta: number): { yil: number; hafta: number } => {
          if (hafta < 52) return { yil, hafta: hafta + 1 }
          return { yil: yil + 1, hafta: 1 }
        }

        // Sevk süresi kadar hafta için toplam forecast hesapla
        let toplamForecast = 0
        let forecastHafta = { yil: currentYil, hafta: currentHafta }

        for (let i = 0; i < sevkSuresi; i++) {
          forecastHafta = getNextWeek(forecastHafta.yil, forecastHafta.hafta)

          // Bu hafta için YoY katsayısı
          const gecenYilOncekiHafta = getSalesForWeek(magaza.magazaKodu, malzeme.malzemeKodu, forecastHafta.yil - 1,
            forecastHafta.hafta > 1 ? forecastHafta.hafta - 1 : 52)
          const gecenYilBuHafta = getSalesForWeek(magaza.magazaKodu, malzeme.malzemeKodu, forecastHafta.yil - 1, forecastHafta.hafta)

          let haftaYoyKatsayi = 1
          if (gecenYilOncekiHafta !== null && gecenYilBuHafta !== null && gecenYilOncekiHafta > 0) {
            haftaYoyKatsayi = gecenYilBuHafta / gecenYilOncekiHafta
            haftaYoyKatsayi = Math.max(0.5, Math.min(2.0, haftaYoyKatsayi))
          }

          // Bu hafta için forecast
          const haftaForecast = agirlikliOrtalama * haftaYoyKatsayi
          toplamForecast += haftaForecast
        }

        // Sevk dönem tüketim = Toplam forecast × birim tüketim × (1 + fire%)
        const sevkDonemTuketim = toplamForecast * birimTuketim * (1 + fireOrani / 100)
        const projectedPosition = mevcutStok + yoldakiMiktar - sevkDonemTuketim
        // Mağaza min stok altına düşüyorsa tamamla
        const sevkiyatIhtiyaci = Math.max(0, magazaMinStok - projectedPosition)

        // Min sevk miktarına yuvarla
        let sevkiyatOnerisi = 0
        if (sevkiyatIhtiyaci > 0 && depoStok > 0) {
          sevkiyatOnerisi = Math.ceil(sevkiyatIhtiyaci / minSevkMiktari) * minSevkMiktari
          // Depo stoğunu aşamaz
          sevkiyatOnerisi = Math.min(sevkiyatOnerisi, Math.floor(depoStok / minSevkMiktari) * minSevkMiktari)
        }

        // =====================
        // ÜRETİM İHTİYACI HESABI (Ürün Bazlı)
        // =====================
        // ÜRETİM = Düzeltilmiş Satış × (Ted Süre + Ek Süre) × (1+Fire%) - Depo - Stok - Yol
        const projeksiyon = tahminSatis * toplamTedarikSuresi * birimTuketim * (1 + fireOrani / 100)

        // Mevcut toplam = Depo + Stok + Yol - Projeksiyon
        const mevcutToplam = depoStok + mevcutStok + yoldakiMiktar - projeksiyon

        // Üretim ihtiyacı = Projeksiyon sonrası eksik (negatifse o kadar üretim gerekli)
        const uretimIhtiyaci = Math.max(0, projeksiyon - depoStok - mevcutStok - yoldakiMiktar)

        // Min sipariş miktarına yuvarla
        let uretimOnerisi = 0
        if (uretimIhtiyaci > 0) {
          uretimOnerisi = Math.ceil(uretimIhtiyaci / minSiparisMiktari) * minSiparisMiktari
        }

        // Durum belirleme
        let durum: 'yeterli' | 'uyari' | 'kritik' = 'yeterli'
        if (mevcutStok === 0 || mevcutStok < magazaMinStok * 0.5) {
          durum = 'kritik'
        } else if (sevkiyatIhtiyaci > 0 || uretimIhtiyaci > 0) {
          durum = 'uyari'
        }

        // Hesaplama metodu
        let hesaplamaMetodu = 'Normal'
        if (metodNotlar.length > 0) {
          hesaplamaMetodu = metodNotlar.join(', ')
        }
        if (validSales.length === 0) {
          hesaplamaMetodu = 'Veri yok'
        }

        results.push({
          magazaKodu: magaza.magazaKodu,
          magazaAdi: magaza.magazaAdi,
          malzemeKodu: malzeme.malzemeKodu,
          malzemeAdi: malzeme.ad,
          tetikleyici: malzeme.tetikleyici,
          sonHaftaSatis,
          oncekiHaftaSatis,
          dahaOncekiSatis,
          agirlikliOrtalama: Math.round(agirlikliOrtalama * 10) / 10,
          yoyKatsayi: Math.round(yoyKatsayi * 100) / 100,
          tahminSatis: Math.round(tahminSatis * 10) / 10,
          gunlukTahminSatis: Math.round(tahminSatis / 7 * 10) / 10,
          mevcutStok,
          yoldakiMiktar,
          acikSiparis,
          depoStok,
          guvenlikStok: magazaMinStok, // Mağaza için: son hafta satış
          sevkiyatIhtiyaci: Math.round(sevkiyatIhtiyaci),
          sevkiyatOnerisi,
          minSevkMiktari,
          tedarikSuresi,
          ekSure,
          toplamTedarikSuresi,
          projeksiyon: Math.round(projeksiyon),
          mevcutToplam: Math.round(mevcutToplam),
          uretimIhtiyaci: Math.round(uretimIhtiyaci),
          uretimOnerisi,
          minSiparisMiktari,
          durum,
          hesaplamaMetodu,
        })
      }
    }

    return results.sort((a, b) => {
      const statusOrder = { kritik: 0, uyari: 1, yeterli: 2 }
      return statusOrder[a.durum] - statusOrder[b.durum]
    })
  }, [aktivMagazalar, aktivMalzemeler, stokSatislar, selectedMagaza, selectedMalzeme, guvenlikKatsayisi, currentYil, currentHafta])

  // Ürün bazlı üretim özeti
  const uretimOzetleri = useMemo<UretimOzeti[]>(() => {
    const ozetMap: Record<string, UretimOzeti> = {}

    // Tüm mağazaların ihtiyaçlarını ürün bazında topla
    for (const ihtiyac of ihtiyaclar) {
      if (!ozetMap[ihtiyac.malzemeKodu]) {
        const malzeme = aktivMalzemeler.find(m => m.malzemeKodu === ihtiyac.malzemeKodu)
        ozetMap[ihtiyac.malzemeKodu] = {
          malzemeKodu: ihtiyac.malzemeKodu,
          malzemeAdi: ihtiyac.malzemeAdi,
          toplamMagazaIhtiyaci: 0,
          depoStok: malzeme?.depoStok || 0,
          toplamSevkiyat: 0,
          kalanDepoStok: malzeme?.depoStok || 0,
          uretimIhtiyaci: 0,
          uretimOnerisi: 0,
          minSiparisMiktari: malzeme?.minSiparisMiktari || 1,
          tedarikSuresi: (malzeme?.ortalamaTedarikSuresi || 7) + (malzeme?.ortalamaEkSure || 0),
          durum: 'yeterli',
        }
      }

      ozetMap[ihtiyac.malzemeKodu].toplamMagazaIhtiyaci += ihtiyac.sevkiyatIhtiyaci
      ozetMap[ihtiyac.malzemeKodu].toplamSevkiyat += ihtiyac.sevkiyatOnerisi
    }

    // Her ürün için üretim ihtiyacını hesapla
    return Object.values(ozetMap).map(ozet => {
      // Sevkiyat sonrası kalan depo stok
      ozet.kalanDepoStok = Math.max(0, ozet.depoStok - ozet.toplamSevkiyat)

      // Üretim ihtiyacı = Toplam mağaza ihtiyacı - Mevcut depo stok
      const eksik = ozet.toplamMagazaIhtiyaci - ozet.depoStok
      ozet.uretimIhtiyaci = Math.max(0, eksik)

      // Min sipariş miktarına yuvarla
      if (ozet.uretimIhtiyaci > 0) {
        ozet.uretimOnerisi = Math.ceil(ozet.uretimIhtiyaci / ozet.minSiparisMiktari) * ozet.minSiparisMiktari
      }

      // Durum
      if (ozet.uretimOnerisi > 0 && ozet.kalanDepoStok === 0) {
        ozet.durum = 'acil'
      } else if (ozet.uretimOnerisi > 0) {
        ozet.durum = 'siparis_gerekli'
      } else {
        ozet.durum = 'yeterli'
      }

      return ozet
    }).sort((a, b) => {
      const statusOrder = { acil: 0, siparis_gerekli: 1, yeterli: 2 }
      return statusOrder[a.durum] - statusOrder[b.durum]
    })
  }, [ihtiyaclar, aktivMalzemeler])

  // Özet istatistikler
  const summary = useMemo(() => {
    const kritikCount = ihtiyaclar.filter(i => i.durum === 'kritik').length
    const uyariCount = ihtiyaclar.filter(i => i.durum === 'uyari').length
    const yeterliCount = ihtiyaclar.filter(i => i.durum === 'yeterli').length
    const toplamSevkiyat = ihtiyaclar.reduce((sum, i) => sum + i.sevkiyatOnerisi, 0)
    const toplamUretim = uretimOzetleri.reduce((sum, u) => sum + u.uretimOnerisi, 0)
    const acilUretim = uretimOzetleri.filter(u => u.durum === 'acil').length

    return { kritikCount, uyariCount, yeterliCount, toplamSevkiyat, toplamUretim, acilUretim }
  }, [ihtiyaclar, uretimOzetleri])

  // CSV Export - Mağaza
  const exportMagazaCSV = () => {
    const headers = [
      'Mağaza Kodu', 'Mağaza Adı', 'Malzeme Kodu', 'Malzeme Adı',
      'Haftalık Tahmin', 'Günlük Tahmin', 'YoY',
      'Mevcut Stok', 'Yoldaki', 'Depo Stok', 'Güvenlik Stok',
      'Sevkiyat İhtiyacı', 'Sevkiyat Önerisi', 'Min Sevk',
      'Tedarik Süresi', 'Projeksiyon', 'Üretim İhtiyacı', 'Üretim Önerisi',
      'Durum', 'Metod'
    ]
    const rows = ihtiyaclar.map(i => [
      i.magazaKodu, i.magazaAdi, i.malzemeKodu, i.malzemeAdi,
      i.tahminSatis.toString(), i.gunlukTahminSatis.toString(), i.yoyKatsayi.toString(),
      i.mevcutStok.toString(), i.yoldakiMiktar.toString(), i.depoStok.toString(), i.guvenlikStok.toString(),
      i.sevkiyatIhtiyaci.toString(), i.sevkiyatOnerisi.toString(), i.minSevkMiktari.toString(),
      i.toplamTedarikSuresi.toString(), i.projeksiyon.toString(), i.uretimIhtiyaci.toString(), i.uretimOnerisi.toString(),
      i.durum === 'kritik' ? 'Kritik' : i.durum === 'uyari' ? 'Uyarı' : 'Yeterli',
      i.hesaplamaMetodu,
    ])

    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `sevkiyat-plani-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // CSV Export - Üretim
  const exportUretimCSV = () => {
    const headers = [
      'Malzeme Kodu', 'Malzeme Adı', 'Toplam Mağaza İhtiyacı',
      'Depo Stok', 'Toplam Sevkiyat', 'Kalan Depo',
      'Üretim İhtiyacı', 'Üretim Önerisi', 'Min Sipariş', 'Tedarik Süresi', 'Durum'
    ]
    const rows = uretimOzetleri.map(u => [
      u.malzemeKodu, u.malzemeAdi, u.toplamMagazaIhtiyaci.toString(),
      u.depoStok.toString(), u.toplamSevkiyat.toString(), u.kalanDepoStok.toString(),
      u.uretimIhtiyaci.toString(), u.uretimOnerisi.toString(), u.minSiparisMiktari.toString(),
      u.tedarikSuresi.toString(),
      u.durum === 'acil' ? 'Acil' : u.durum === 'siparis_gerekli' ? 'Sipariş Gerekli' : 'Yeterli',
    ])

    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `uretim-plani-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const getDurumBadge = (durum: 'yeterli' | 'uyari' | 'kritik') => {
    switch (durum) {
      case 'kritik':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"><AlertTriangle className="h-3 w-3" />Kritik</span>
      case 'uyari':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"><Clock className="h-3 w-3" />Uyarı</span>
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"><CheckCircle className="h-3 w-3" />Yeterli</span>
    }
  }

  const getUretimDurumBadge = (durum: 'yeterli' | 'siparis_gerekli' | 'acil') => {
    switch (durum) {
      case 'acil':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"><AlertTriangle className="h-3 w-3" />Acil</span>
      case 'siparis_gerekli':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"><ShoppingCart className="h-3 w-3" />Sipariş Gerekli</span>
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"><CheckCircle className="h-3 w-3" />Yeterli</span>
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">İhtiyaç Planlama</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Sevkiyat ve üretim planlaması (Hafta {currentHafta}/{currentYil})
          </p>
        </div>
        <button
          onClick={activeTab === 'magaza' ? exportMagazaCSV : exportUretimCSV}
          disabled={activeTab === 'magaza' ? ihtiyaclar.length === 0 : uretimOzetleri.length === 0}
          className="flex items-center gap-2 px-4 py-2 border border-[hsl(var(--border))] text-[hsl(var(--foreground))] rounded-lg hover:bg-[hsl(var(--accent))] transition-colors disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          CSV İndir
        </button>
      </div>

      {/* Hesaplama Açıklaması */}
      <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-200 dark:border-blue-900/20 mb-6">
        <div className="flex items-start gap-3">
          <Calculator className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
            <p className="font-medium">Hesaplama Formülleri (Hafta Bazlı):</p>
            <p><Truck className="inline h-3 w-3 mr-1" /><strong>Sevkiyat:</strong> Yol süresi kadar hafta için YoY ile forecast hesapla → Min Stok (son hafta satış) altına düşerse tamamla</p>
            <p><Factory className="inline h-3 w-3 mr-1" /><strong>Üretim:</strong> Düzeltilmiş Satış × (Ted+Ek Süre) × (1+Fire%) - Depo - Stok - Yol (Ürün Bazlı)</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-4 border border-red-200 dark:border-red-900/20">
          <div className="flex items-center gap-2 text-red-600 mb-1">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs font-medium">Kritik</span>
          </div>
          <div className="text-2xl font-bold text-red-700 dark:text-red-400">{summary.kritikCount}</div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/10 rounded-xl p-4 border border-yellow-200 dark:border-yellow-900/20">
          <div className="flex items-center gap-2 text-yellow-600 mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-medium">Uyarı</span>
          </div>
          <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{summary.uyariCount}</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/10 rounded-xl p-4 border border-green-200 dark:border-green-900/20">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <CheckCircle className="h-4 w-4" />
            <span className="text-xs font-medium">Yeterli</span>
          </div>
          <div className="text-2xl font-bold text-green-700 dark:text-green-400">{summary.yeterliCount}</div>
        </div>
        <div className="bg-[hsl(var(--card))] rounded-xl p-4 border border-[hsl(var(--border))]">
          <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))] mb-1">
            <Truck className="h-4 w-4" />
            <span className="text-xs font-medium">Toplam Sevkiyat</span>
          </div>
          <div className="text-2xl font-bold text-[hsl(var(--foreground))]">{summary.toplamSevkiyat.toLocaleString('tr-TR')}</div>
        </div>
        <div className="bg-[hsl(var(--card))] rounded-xl p-4 border border-[hsl(var(--border))]">
          <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))] mb-1">
            <Factory className="h-4 w-4" />
            <span className="text-xs font-medium">Toplam Üretim</span>
          </div>
          <div className="text-2xl font-bold text-[hsl(var(--foreground))]">{summary.toplamUretim.toLocaleString('tr-TR')}</div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-4 border border-red-200 dark:border-red-900/20">
          <div className="flex items-center gap-2 text-red-600 mb-1">
            <Package className="h-4 w-4" />
            <span className="text-xs font-medium">Acil Üretim</span>
          </div>
          <div className="text-2xl font-bold text-red-700 dark:text-red-400">{summary.acilUretim}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Mağaza</label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              <select
                value={selectedMagaza}
                onChange={(e) => setSelectedMagaza(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] appearance-none"
              >
                <option value="">Tüm Mağazalar</option>
                {aktivMagazalar.map(m => (
                  <option key={m.id} value={m.id}>{m.magazaAdi}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Malzeme</label>
            <select
              value={selectedMalzeme}
              onChange={(e) => setSelectedMalzeme(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] appearance-none"
            >
              <option value="">Tüm Malzemeler</option>
              {aktivMalzemeler.filter(m => m.tetikleyici?.toLowerCase().includes('satış') || m.tetikleyici?.toLowerCase().includes('satis')).map(m => (
                <option key={m.id} value={m.id}>{m.ad}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Güvenlik Payı</label>
            <select
              value={guvenlikKatsayisi}
              onChange={(e) => setGuvenlikKatsayisi(parseFloat(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] appearance-none"
            >
              <option value={1}>%0 (Güvenlik Payı Yok)</option>
              <option value={1.1}>%10</option>
              <option value={1.2}>%20</option>
              <option value={1.3}>%30</option>
              <option value={1.5}>%50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('magaza')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'magaza'
              ? 'bg-[hsl(var(--primary))] text-white'
              : 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]'
          }`}
        >
          <Truck className="h-4 w-4" />
          Mağaza Sevkiyat ({ihtiyaclar.length})
        </button>
        <button
          onClick={() => setActiveTab('uretim')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'uretim'
              ? 'bg-[hsl(var(--primary))] text-white'
              : 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]'
          }`}
        >
          <Factory className="h-4 w-4" />
          Üretim İhtiyacı ({uretimOzetleri.length})
        </button>
      </div>

      {/* Mağaza Sevkiyat Tablosu */}
      {activeTab === 'magaza' && (
        <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
                  <th className="text-left px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Mağaza</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Malzeme</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Tahmin/H</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Stok</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Yol</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Depo</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Min Stok</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Sevk İht.</th>
                  <th className="text-center px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap bg-blue-50 dark:bg-blue-900/10">Sevkiyat</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Ted.(H)</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Projeks.</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Ürt.İht.</th>
                  <th className="text-center px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Durum</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Metod</th>
                </tr>
              </thead>
              <tbody>
                {ihtiyaclar.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="px-4 py-12 text-center text-[hsl(var(--muted-foreground))]">
                      <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Veri bulunamadı</p>
                    </td>
                  </tr>
                ) : (
                  ihtiyaclar.map((i) => (
                    <tr
                      key={`${i.magazaKodu}-${i.malzemeKodu}`}
                      className={`border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] ${
                        i.durum === 'kritik' ? 'bg-red-50 dark:bg-red-900/5' :
                        i.durum === 'uyari' ? 'bg-yellow-50 dark:bg-yellow-900/5' : ''
                      }`}
                    >
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-sm font-medium">{i.magazaAdi}</div>
                        <div className="text-xs text-[hsl(var(--muted-foreground))]">{i.magazaKodu}</div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-sm font-medium">{i.malzemeAdi}</div>
                        <div className="text-xs text-[hsl(var(--muted-foreground))]">{i.malzemeKodu}</div>
                      </td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">{i.tahminSatis.toLocaleString('tr-TR')}</td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">{i.mevcutStok.toLocaleString('tr-TR')}</td>
                      <td className="px-3 py-2 text-right whitespace-nowrap text-[hsl(var(--muted-foreground))]">{i.yoldakiMiktar.toLocaleString('tr-TR')}</td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">{i.depoStok.toLocaleString('tr-TR')}</td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">{i.guvenlikStok.toLocaleString('tr-TR')}</td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">
                        <span className={i.sevkiyatIhtiyaci > 0 ? 'text-red-600 font-medium' : ''}>
                          {i.sevkiyatIhtiyaci.toLocaleString('tr-TR')}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center whitespace-nowrap bg-blue-50/50 dark:bg-blue-900/5">
                        {i.sevkiyatOnerisi > 0 ? (
                          <span className="inline-flex items-center justify-center min-w-[3rem] h-8 rounded-lg bg-blue-500/10 text-blue-600 font-bold">
                            {i.sevkiyatOnerisi.toLocaleString('tr-TR')}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-3 py-2 text-right whitespace-nowrap text-[hsl(var(--muted-foreground))]">{i.toplamTedarikSuresi}h</td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">{i.projeksiyon.toLocaleString('tr-TR')}</td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">
                        <span className={i.uretimIhtiyaci > 0 ? 'text-orange-600 font-medium' : ''}>
                          {i.uretimIhtiyaci.toLocaleString('tr-TR')}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center whitespace-nowrap">{getDurumBadge(i.durum)}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-[hsl(var(--muted-foreground))]">{i.hesaplamaMetodu}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Üretim İhtiyacı Tablosu */}
      {activeTab === 'uretim' && (
        <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
                  <th className="text-left px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Malzeme</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Toplam Mağaza İhtiyacı</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Depo Stok</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Toplam Sevkiyat</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Kalan Depo</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Üretim İhtiyacı</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase bg-orange-50 dark:bg-orange-900/10">Üretim Önerisi</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Min Sipariş</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Tedarik Süresi</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Durum</th>
                </tr>
              </thead>
              <tbody>
                {uretimOzetleri.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-[hsl(var(--muted-foreground))]">
                      <Factory className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Üretim ihtiyacı bulunamadı</p>
                    </td>
                  </tr>
                ) : (
                  uretimOzetleri.map((u) => (
                    <tr
                      key={u.malzemeKodu}
                      className={`border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] ${
                        u.durum === 'acil' ? 'bg-red-50 dark:bg-red-900/5' :
                        u.durum === 'siparis_gerekli' ? 'bg-yellow-50 dark:bg-yellow-900/5' : ''
                      }`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium">{u.malzemeAdi}</div>
                        <div className="text-xs text-[hsl(var(--muted-foreground))]">{u.malzemeKodu}</div>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap font-medium">{u.toplamMagazaIhtiyaci.toLocaleString('tr-TR')}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">{u.depoStok.toLocaleString('tr-TR')}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap text-blue-600">{u.toplamSevkiyat.toLocaleString('tr-TR')}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span className={u.kalanDepoStok === 0 ? 'text-red-600 font-medium' : ''}>
                          {u.kalanDepoStok.toLocaleString('tr-TR')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span className={u.uretimIhtiyaci > 0 ? 'text-orange-600 font-medium' : ''}>
                          {u.uretimIhtiyaci.toLocaleString('tr-TR')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap bg-orange-50/50 dark:bg-orange-900/5">
                        {u.uretimOnerisi > 0 ? (
                          <span className="inline-flex items-center justify-center min-w-[4rem] h-8 rounded-lg bg-orange-500/10 text-orange-600 font-bold">
                            {u.uretimOnerisi.toLocaleString('tr-TR')}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap text-[hsl(var(--muted-foreground))]">{u.minSiparisMiktari.toLocaleString('tr-TR')}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap text-[hsl(var(--muted-foreground))]">{u.tedarikSuresi}h</td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">{getUretimDurumBadge(u.durum)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
