'use client'

import { useState, useMemo } from 'react'
import {
  CheckCircle,
  XCircle,
  Clock,
  Store,
  Package,
  Search,
  Filter,
  AlertCircle,
  Loader2,
  Check,
  X,
} from 'lucide-react'
import { useStore } from '@/lib/store'

export default function TalepOnayPage() {
  const {
    malzemeler,
    magazalar,
    stokSatislar,
    talepler,
    session,
    onaylaTalep,
    reddetTalep,
  } = useStore()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMagaza, setSelectedMagaza] = useState('')
  const [durumFiltresi, setDurumFiltresi] = useState<'beklemede' | 'onaylandi' | 'reddedildi' | 'hepsi'>('beklemede')
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())
  const [redModal, setRedModal] = useState<{ talepId: string; open: boolean }>({ talepId: '', open: false })
  const [redNedeni, setRedNedeni] = useState('')

  // Yetki kontrolü
  const hasPermission = session?.rol === 'admin' || session?.rol === 'yonetici'

  // Filtrelenmiş talepler
  const filteredTalepler = useMemo(() => {
    return talepler
      .filter(t => {
        // Durum filtresi
        if (durumFiltresi !== 'hepsi' && t.durum !== durumFiltresi) return false

        // Mağaza filtresi
        if (selectedMagaza && t.magazaKodu !== selectedMagaza) return false

        // Arama filtresi
        if (searchTerm) {
          const term = searchTerm.toLowerCase()
          const matchesMagaza = t.magazaKodu.toLowerCase().includes(term) || t.magazaAdi.toLowerCase().includes(term)
          const matchesMalzeme = t.malzemeKodu.toLowerCase().includes(term) || t.malzemeAdi.toLowerCase().includes(term)
          if (!matchesMagaza && !matchesMalzeme) return false
        }

        return true
      })
      .sort((a, b) => new Date(b.talepTarihi).getTime() - new Date(a.talepTarihi).getTime())
  }, [talepler, durumFiltresi, selectedMagaza, searchTerm])

  // Mağazalar listesi (talep olan)
  const magazalarWithTalep = useMemo(() => {
    const magazaKodlari = new Set(talepler.map(t => t.magazaKodu))
    return magazalar.filter(m => magazaKodlari.has(m.magazaKodu))
  }, [magazalar, talepler])

  // Özet istatistikler
  const summary = useMemo(() => {
    const beklemede = talepler.filter(t => t.durum === 'beklemede').length
    const onaylandi = talepler.filter(t => t.durum === 'onaylandi').length
    const reddedildi = talepler.filter(t => t.durum === 'reddedildi').length

    return { beklemede, onaylandi, reddedildi }
  }, [talepler])

  // Talep onayla
  const handleOnayla = async (talepId: string) => {
    if (!session) return

    setProcessingIds(prev => new Set(prev).add(talepId))
    try {
      await onaylaTalep(talepId, session.userId, session.ad)
    } catch (error) {
      console.error('Onay hatası:', error)
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(talepId)
        return newSet
      })
    }
  }

  // Talep reddet
  const handleReddet = async () => {
    if (!session || !redModal.talepId || !redNedeni.trim()) return

    setProcessingIds(prev => new Set(prev).add(redModal.talepId))
    try {
      await reddetTalep(redModal.talepId, session.userId, session.ad, redNedeni)
      setRedModal({ talepId: '', open: false })
      setRedNedeni('')
    } catch (error) {
      console.error('Red hatası:', error)
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(redModal.talepId)
        return newSet
      })
    }
  }

  // Toplu onaylama
  const handleTopluOnayla = async () => {
    if (!session) return

    const bekleyenler = filteredTalepler.filter(t => t.durum === 'beklemede')
    if (bekleyenler.length === 0) return

    for (const talep of bekleyenler) {
      setProcessingIds(prev => new Set(prev).add(talep.id))
      try {
        await onaylaTalep(talep.id, session.userId, session.ad)
      } catch (error) {
        console.error('Onay hatası:', error)
      }
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(talep.id)
        return newSet
      })
    }
  }

  const getDurumBadge = (durum: 'beklemede' | 'onaylandi' | 'reddedildi') => {
    switch (durum) {
      case 'beklemede':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"><Clock className="h-3 w-3" />Beklemede</span>
      case 'onaylandi':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"><CheckCircle className="h-3 w-3" />Onaylandı</span>
      case 'reddedildi':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"><XCircle className="h-3 w-3" />Reddedildi</span>
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (!hasPermission) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/20 rounded-xl p-6 text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-yellow-700 dark:text-yellow-400 mb-2">
            Erişim Kısıtlı
          </h2>
          <p className="text-yellow-600 dark:text-yellow-500">
            Bu sayfa sadece yönetici ve admin kullanıcıları için kullanılabilir.
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
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Talep Onay</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Mağazalardan gelen talepleri yönetin
          </p>
        </div>
        {durumFiltresi === 'beklemede' && filteredTalepler.length > 0 && (
          <button
            onClick={handleTopluOnayla}
            disabled={processingIds.size > 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            Tümünü Onayla ({filteredTalepler.filter(t => t.durum === 'beklemede').length})
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => setDurumFiltresi('beklemede')}
          className={`p-4 rounded-xl border transition-all ${
            durumFiltresi === 'beklemede'
              ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-300 dark:border-yellow-900/30 ring-2 ring-yellow-500/20'
              : 'bg-[hsl(var(--card))] border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))]'
          }`}
        >
          <div className="flex items-center gap-2 text-yellow-600 mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-medium">Beklemede</span>
          </div>
          <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{summary.beklemede}</div>
        </button>
        <button
          onClick={() => setDurumFiltresi('onaylandi')}
          className={`p-4 rounded-xl border transition-all ${
            durumFiltresi === 'onaylandi'
              ? 'bg-green-50 dark:bg-green-900/10 border-green-300 dark:border-green-900/30 ring-2 ring-green-500/20'
              : 'bg-[hsl(var(--card))] border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))]'
          }`}
        >
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <CheckCircle className="h-4 w-4" />
            <span className="text-xs font-medium">Onaylanan</span>
          </div>
          <div className="text-2xl font-bold text-green-700 dark:text-green-400">{summary.onaylandi}</div>
        </button>
        <button
          onClick={() => setDurumFiltresi('reddedildi')}
          className={`p-4 rounded-xl border transition-all ${
            durumFiltresi === 'reddedildi'
              ? 'bg-red-50 dark:bg-red-900/10 border-red-300 dark:border-red-900/30 ring-2 ring-red-500/20'
              : 'bg-[hsl(var(--card))] border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))]'
          }`}
        >
          <div className="flex items-center gap-2 text-red-600 mb-1">
            <XCircle className="h-4 w-4" />
            <span className="text-xs font-medium">Reddedilen</span>
          </div>
          <div className="text-2xl font-bold text-red-700 dark:text-red-400">{summary.reddedildi}</div>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            <input
              type="text"
              placeholder="Mağaza veya malzeme ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            <select
              value={selectedMagaza}
              onChange={(e) => setSelectedMagaza(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] appearance-none"
            >
              <option value="">Tüm Mağazalar</option>
              {magazalarWithTalep.map(m => (
                <option key={m.id} value={m.magazaKodu}>{m.magazaAdi}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setDurumFiltresi('hepsi')}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              durumFiltresi === 'hepsi'
                ? 'bg-[hsl(var(--primary))] text-white border-[hsl(var(--primary))]'
                : 'border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))]'
            }`}
          >
            Tümünü Göster
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
                <th className="text-left px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Mağaza</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Malzeme</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Stok</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Satış</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Yol</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Depo</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase bg-blue-50 dark:bg-blue-900/10">Talep</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Tarih</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Durum</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Yanıt / Açıklama</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filteredTalepler.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-[hsl(var(--muted-foreground))]">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Talep bulunamadı</p>
                  </td>
                </tr>
              ) : (
                filteredTalepler.map((talep) => {
                  const isProcessing = processingIds.has(talep.id)

                  return (
                    <tr
                      key={talep.id}
                      className={`border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] ${
                        talep.durum === 'beklemede' ? 'bg-yellow-50/30 dark:bg-yellow-900/5' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                          <div>
                            <div className="font-medium">{talep.magazaAdi}</div>
                            <div className="text-xs text-[hsl(var(--muted-foreground))]">{talep.magazaKodu}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{talep.malzemeAdi}</div>
                        <div className="text-xs text-[hsl(var(--muted-foreground))]">{talep.malzemeKodu}</div>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span className={talep.sonHaftaStok === 0 ? 'text-red-500 font-medium' : ''}>
                          {talep.sonHaftaStok.toLocaleString('tr-TR')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">{talep.sonHaftaSatis.toLocaleString('tr-TR')}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap text-[hsl(var(--muted-foreground))]">
                        {talep.yoldakiMiktar.toLocaleString('tr-TR')}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">{talep.depoStok.toLocaleString('tr-TR')}</td>
                      <td className="px-4 py-3 text-center bg-blue-50/50 dark:bg-blue-900/5">
                        <span className="inline-flex items-center justify-center min-w-[3rem] h-8 rounded-lg bg-blue-500/10 text-blue-600 font-bold">
                          {talep.talepMiktari.toLocaleString('tr-TR')}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm">{formatDate(talep.talepTarihi)}</div>
                        <div className="text-xs text-[hsl(var(--muted-foreground))]">{talep.talepEdenAd}</div>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {getDurumBadge(talep.durum)}
                      </td>
                      <td className="px-4 py-3">
                        {talep.durum === 'beklemede' && (
                          <span className="text-[hsl(var(--muted-foreground))] text-sm italic">Yanıt bekleniyor...</span>
                        )}
                        {talep.durum === 'onaylandi' && (
                          <div>
                            <div className="text-sm text-green-600 font-medium">Onaylandı</div>
                            {talep.onaylayanAd && (
                              <div className="text-xs text-[hsl(var(--muted-foreground))]">
                                {talep.onaylayanAd} • {talep.onayTarihi && new Date(talep.onayTarihi).toLocaleDateString('tr-TR')}
                              </div>
                            )}
                          </div>
                        )}
                        {talep.durum === 'reddedildi' && (
                          <div className="max-w-[250px]">
                            <div className="text-sm text-red-600 font-medium">
                              {talep.redNedeni || 'Red nedeni belirtilmedi'}
                            </div>
                            {talep.onaylayanAd && (
                              <div className="text-xs text-[hsl(var(--muted-foreground))]">
                                {talep.onaylayanAd} • {talep.onayTarihi && new Date(talep.onayTarihi).toLocaleDateString('tr-TR')}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {talep.durum === 'beklemede' && (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOnayla(talep.id)}
                              disabled={isProcessing}
                              className="p-2 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                              title="Onayla"
                            >
                              {isProcessing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => setRedModal({ talepId: talep.id, open: true })}
                              disabled={isProcessing}
                              className="p-2 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                              title="Reddet"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                        {talep.durum !== 'beklemede' && (
                          <span className="text-xs text-[hsl(var(--muted-foreground))]">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Red Modal */}
      {redModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Talep Reddet</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Red Nedeni</label>
              <textarea
                value={redNedeni}
                onChange={(e) => setRedNedeni(e.target.value)}
                placeholder="Red nedenini yazın..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setRedModal({ talepId: '', open: false })
                  setRedNedeni('')
                }}
                className="px-4 py-2 rounded-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleReddet}
                disabled={!redNedeni.trim() || processingIds.has(redModal.talepId)}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {processingIds.has(redModal.talepId) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Reddet'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
