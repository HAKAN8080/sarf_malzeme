'use client'

import { useState, useMemo } from 'react'
import {
  ArrowLeftRight,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  X,
  Download,
} from 'lucide-react'
import { useStore } from '@/lib/store'

export default function HareketlerPage() {
  const { malzemeler, magazalar, hareketler } = useStore()
  const [selectedMagaza, setSelectedMagaza] = useState('')
  const [selectedMalzeme, setSelectedMalzeme] = useState('')
  const [selectedTip, setSelectedTip] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Filter active items
  const aktivMagazalar = magazalar.filter(m => m.aktif)
  const aktivMalzemeler = malzemeler.filter(m => m.aktif)

  // Filter hareketler
  const filteredHareketler = useMemo(() => {
    return hareketler
      .filter(h => {
        const matchesMagaza = !selectedMagaza || h.magazaId === selectedMagaza
        const matchesMalzeme = !selectedMalzeme || h.malzemeId === selectedMalzeme
        const matchesTip = !selectedTip || h.tip === selectedTip
        const hareketDate = new Date(h.tarih)
        const matchesStartDate = !startDate || hareketDate >= new Date(startDate)
        const matchesEndDate = !endDate || hareketDate <= new Date(endDate + 'T23:59:59')
        return matchesMagaza && matchesMalzeme && matchesTip && matchesStartDate && matchesEndDate
      })
      .sort((a, b) => new Date(b.tarih).getTime() - new Date(a.tarih).getTime())
  }, [hareketler, selectedMagaza, selectedMalzeme, selectedTip, startDate, endDate])

  const clearFilters = () => {
    setSelectedMagaza('')
    setSelectedMalzeme('')
    setSelectedTip('')
    setStartDate('')
    setEndDate('')
  }

  const hasFilters = selectedMagaza || selectedMalzeme || selectedTip || startDate || endDate

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getTipIcon = (tip: string) => {
    switch (tip) {
      case 'giris':
        return <ArrowDownRight className="h-4 w-4 text-green-500" />
      case 'cikis':
        return <ArrowUpRight className="h-4 w-4 text-red-500" />
      case 'sayim':
        return <RefreshCw className="h-4 w-4 text-blue-500" />
      case 'transfer':
        return <ArrowLeftRight className="h-4 w-4 text-purple-500" />
      default:
        return <ArrowLeftRight className="h-4 w-4" />
    }
  }

  const getTipLabel = (tip: string) => {
    switch (tip) {
      case 'giris':
        return 'Giriş'
      case 'cikis':
        return 'Çıkış'
      case 'sayim':
        return 'Sayım'
      case 'transfer':
        return 'Transfer'
      default:
        return tip
    }
  }

  const getTipBadgeClass = (tip: string) => {
    switch (tip) {
      case 'giris':
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
      case 'cikis':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
      case 'sayim':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
      case 'transfer':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const exportCSV = () => {
    const headers = ['Tarih', 'Mağaza', 'Malzeme', 'İşlem', 'Miktar', 'Önceki', 'Sonraki', 'Açıklama']
    const rows = filteredHareketler.map(h => {
      const magaza = magazalar.find(m => m.id === h.magazaId)
      const malzeme = malzemeler.find(m => m.id === h.malzemeId)
      return [
        formatDateTime(h.tarih),
        magaza?.magazaAdi || '',
        malzeme?.ad || '',
        getTipLabel(h.tip),
        h.miktar.toString(),
        h.oncekiMiktar.toString(),
        h.sonrakiMiktar.toString(),
        h.aciklama || '',
      ]
    })

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `stok-hareketleri-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Stok Hareketleri</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Tüm stok giriş/çıkış ve sayım kayıtları
          </p>
        </div>
        <button
          onClick={exportCSV}
          disabled={filteredHareketler.length === 0}
          className="flex items-center gap-2 px-4 py-2 border border-[hsl(var(--border))] text-[hsl(var(--foreground))] rounded-lg hover:bg-[hsl(var(--accent))] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="h-4 w-4" />
          CSV İndir
        </button>
      </div>

      {/* Filters */}
      <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            <select
              value={selectedMagaza}
              onChange={(e) => setSelectedMagaza(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] appearance-none text-sm"
            >
              <option value="">Tüm Mağazalar</option>
              {aktivMagazalar.map(m => (
                <option key={m.id} value={m.id}>{m.magazaAdi}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            <select
              value={selectedMalzeme}
              onChange={(e) => setSelectedMalzeme(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] appearance-none text-sm"
            >
              <option value="">Tüm Malzemeler</option>
              {aktivMalzemeler.map(m => (
                <option key={m.id} value={m.id}>{m.ad}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedTip}
              onChange={(e) => setSelectedTip(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] appearance-none text-sm"
            >
              <option value="">Tüm İşlemler</option>
              <option value="giris">Giriş</option>
              <option value="cikis">Çıkış</option>
              <option value="sayim">Sayım</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Başlangıç"
              className="w-full pl-10 pr-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-sm"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="Bitiş"
              className="w-full pl-10 pr-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-sm"
            />
          </div>
        </div>

        {hasFilters && (
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-[hsl(var(--muted-foreground))]">
              {filteredHareketler.length} kayıt bulundu
            </span>
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            >
              <X className="h-4 w-4" />
              Filtreleri Temizle
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
                <th className="text-left px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Tarih</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Mağaza</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Malzeme</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">İşlem</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Miktar</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Stok Değişimi</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Açıklama</th>
              </tr>
            </thead>
            <tbody>
              {filteredHareketler.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-[hsl(var(--muted-foreground))]">
                    <ArrowLeftRight className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Hareket bulunamadı</p>
                  </td>
                </tr>
              ) : (
                filteredHareketler.map(hareket => {
                  const magaza = magazalar.find(m => m.id === hareket.magazaId)
                  const malzeme = malzemeler.find(m => m.id === hareket.malzemeId)
                  return (
                    <tr key={hareket.id} className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]">
                      <td className="px-4 py-3">
                        <div className="text-sm text-[hsl(var(--foreground))]">
                          {formatDateTime(hareket.tarih)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-[hsl(var(--foreground))]">
                          {magaza?.magazaAdi || 'Bilinmeyen'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-[hsl(var(--foreground))]">
                          {malzeme?.ad || 'Bilinmeyen'}
                        </div>
                        <div className="text-xs text-[hsl(var(--muted-foreground))]">
                          {malzeme?.malzemeKodu}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTipBadgeClass(hareket.tip)}`}>
                          {getTipIcon(hareket.tip)}
                          {getTipLabel(hareket.tip)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm font-medium ${
                          hareket.tip === 'giris' ? 'text-green-600' :
                          hareket.tip === 'cikis' ? 'text-red-600' : ''
                        }`}>
                          {hareket.tip === 'giris' ? '+' : hareket.tip === 'cikis' ? '-' : ''}
                          {hareket.miktar}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm text-[hsl(var(--muted-foreground))]">
                          {hareket.oncekiMiktar} → {hareket.sonrakiMiktar}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[hsl(var(--muted-foreground))]">
                          {hareket.aciklama || '-'}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
