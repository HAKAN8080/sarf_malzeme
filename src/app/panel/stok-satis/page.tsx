'use client'

import { useState, useMemo, useRef } from 'react'
import {
  ClipboardList,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Save,
  Download,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import { useStore } from '@/lib/store'
import type { StokSatis } from '@/lib/types'

export default function StokSatisPage() {
  const { stokSatislar, addStokSatis, updateStokSatis, deleteStokSatis, magazalar, malzemeler } = useStore()

  // Mağaza ve Malzeme eşleşme kontrolü
  const magazaKodlari = useMemo(() => new Set(magazalar.map(m => m.magazaKodu)), [magazalar])
  const malzemeKodlari = useMemo(() => new Set(malzemeler.map(m => m.malzemeKodu)), [malzemeler])

  const getValidationStatus = (item: StokSatis) => {
    const magazaValid = magazaKodlari.has(item.magazaKodu)
    const malzemeValid = malzemeKodlari.has(item.malzemeKodu)
    return { magazaValid, malzemeValid, isValid: magazaValid && malzemeValid }
  }
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<StokSatis | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; error: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [formData, setFormData] = useState({
    magazaKodu: '',
    magazaAdi: '',
    malzemeKodu: '',
    malzemeAdi: '',
    yil: new Date().getFullYear(),
    ay: new Date().getMonth() + 1,
    hafta: 1,
    stok: 0,
    satis: 0,
    ypiSuresi: 0,
    acikSiparis: 0,
    ciro: 0,
    smm: 0,
    brutKarOrani: 0,
    stokTutar: 0,
  })

  // Son hafta bilgisini hesapla
  const latestWeek = useMemo(() => {
    if (stokSatislar.length === 0) return null
    return stokSatislar.reduce((latest, current) => {
      if (!latest) return { yil: current.yil, hafta: current.hafta }
      if (current.yil > latest.yil) return { yil: current.yil, hafta: current.hafta }
      if (current.yil === latest.yil && current.hafta > latest.hafta) return { yil: current.yil, hafta: current.hafta }
      return latest
    }, null as { yil: number; hafta: number } | null)
  }, [stokSatislar])

  // Son hafta mı kontrol et
  const isLatestWeek = (item: StokSatis) => {
    if (!latestWeek) return false
    return item.yil === latestWeek.yil && item.hafta === latestWeek.hafta
  }

  // Filter data
  const filteredData = useMemo(() => {
    return stokSatislar.filter(s => {
      if (!s.magazaKodu || !s.malzemeKodu) return false
      const search = searchTerm.toLowerCase()
      return (
        s.magazaKodu.toLowerCase().includes(search) ||
        s.magazaAdi.toLowerCase().includes(search) ||
        s.malzemeKodu.toLowerCase().includes(search) ||
        s.malzemeAdi.toLowerCase().includes(search)
      )
    })
  }, [stokSatislar, searchTerm])

  // Eşleşmeyen kayıtları hesapla
  const invalidRecords = useMemo(() => {
    return filteredData.filter(item => {
      const { isValid } = getValidationStatus(item)
      return !isValid
    })
  }, [filteredData, magazaKodlari, malzemeKodlari])

  const openAddModal = () => {
    setEditingItem(null)
    setFormData({
      magazaKodu: '',
      magazaAdi: '',
      malzemeKodu: '',
      malzemeAdi: '',
      yil: new Date().getFullYear(),
      ay: new Date().getMonth() + 1,
      hafta: 1,
      stok: 0,
      satis: 0,
      ypiSuresi: 0,
      acikSiparis: 0,
      ciro: 0,
      smm: 0,
      brutKarOrani: 0,
      stokTutar: 0,
    })
    setShowModal(true)
  }

  const openEditModal = (item: StokSatis) => {
    setEditingItem(item)
    setFormData({
      magazaKodu: item.magazaKodu,
      magazaAdi: item.magazaAdi,
      malzemeKodu: item.malzemeKodu,
      malzemeAdi: item.malzemeAdi,
      yil: item.yil,
      ay: item.ay,
      hafta: item.hafta,
      stok: item.stok,
      satis: item.satis,
      ypiSuresi: item.ypiSuresi,
      acikSiparis: item.acikSiparis,
      ciro: item.ciro,
      smm: item.smm,
      brutKarOrani: item.brutKarOrani,
      stokTutar: item.stokTutar,
    })
    setShowModal(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingItem) {
      updateStokSatis(editingItem.id, formData)
    } else {
      addStokSatis(formData)
    }
    setShowModal(false)
  }

  const handleDelete = (id: string) => {
    deleteStokSatis(id)
    setDeleteConfirm(null)
  }

  // CSV Export
  const exportCSV = () => {
    const headers = ['magaza_kodu', 'magaza_adi', 'malzeme_kodu', 'malzeme_adi', 'yil', 'ay', 'hafta', 'stok', 'satis', 'yol', 'acik_siparis', 'ciro', 'smm', 'brut_kar_orani', 'stok_tutar']
    const rows = filteredData.map(s => [
      s.magazaKodu,
      s.magazaAdi,
      s.malzemeKodu,
      s.malzemeAdi,
      s.yil.toString(),
      s.ay.toString(),
      s.hafta.toString(),
      s.stok.toString(),
      s.satis.toString(),
      s.ypiSuresi.toString(),
      s.acikSiparis.toString(),
      s.ciro.toString(),
      s.smm.toString(),
      s.brutKarOrani.toString(),
      s.stokTutar.toString()
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `stok-satis-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Download example CSV
  const downloadExampleCSV = () => {
    const headers = ['magaza_kodu', 'magaza_adi', 'malzeme_kodu', 'malzeme_adi', 'yil', 'ay', 'hafta', 'stok', 'satis', 'yol', 'acik_siparis', 'ciro', 'smm', 'brut_kar_orani', 'stok_tutar']
    const exampleRows = [
      ['M001', 'Merkez Mağaza', 'TEM001', 'Deterjan (5L)', '2024', '3', '12', '45', '120', '1', '20', '15000', '9000', '40', '5625'],
      ['M001', 'Merkez Mağaza', 'AMB001', 'Kağıt Poşet', '2024', '3', '12', '2500', '3500', '1', '1000', '8750', '5250', '40', '6250'],
      ['M002', 'Kadıköy Şube', 'TEM001', 'Deterjan (5L)', '2024', '3', '12', '30', '85', '1', '15', '10625', '6375', '40', '3750'],
    ]

    const csvContent = [headers, ...exampleRows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'stok-satis-ornek.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  // CSV Import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      parseCSV(text)
    }
    reader.readAsText(file, 'UTF-8')
  }

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length < 2) {
      setImportResult({ success: 0, error: 1 })
      return
    }

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase())
    let success = 0
    let error = 0

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)?.map(v => v.replace(/"/g, '').trim()) || []

        const getValue = (key: string) => {
          const index = headers.indexOf(key)
          return index >= 0 ? values[index] : ''
        }

        const magazaKodu = getValue('magaza_kodu')
        const magazaAdi = getValue('magaza_adi')
        const malzemeKodu = getValue('malzeme_kodu')
        const malzemeAdi = getValue('malzeme_adi')

        if (!magazaKodu || !magazaAdi || !malzemeKodu || !malzemeAdi) {
          error++
          continue
        }

        addStokSatis({
          magazaKodu,
          magazaAdi,
          malzemeKodu,
          malzemeAdi,
          yil: parseInt(getValue('yil')) || new Date().getFullYear(),
          ay: parseInt(getValue('ay')) || 1,
          hafta: parseInt(getValue('hafta')) || 1,
          stok: parseFloat(getValue('stok')) || 0,
          satis: parseFloat(getValue('satis')) || 0,
          ypiSuresi: parseFloat(getValue('yol')) || 0,
          acikSiparis: parseFloat(getValue('acik_siparis')) || 0,
          ciro: parseFloat(getValue('ciro')) || 0,
          smm: parseFloat(getValue('smm')) || 0,
          brutKarOrani: parseFloat(getValue('brut_kar_orani')) || 0,
          stokTutar: parseFloat(getValue('stok_tutar')) || 0,
        })
        success++
      } catch {
        error++
      }
    }

    setImportResult({ success, error })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Stok & Satış</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Birleşik stok ve satış verileri ({filteredData.length} kayıt)
            {latestWeek && (
              <span className="ml-2 text-blue-500">• Son hafta: {latestWeek.yil}/{latestWeek.hafta} (düzenlenebilir)</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-[hsl(var(--border))] text-[hsl(var(--foreground))] rounded-lg hover:bg-[hsl(var(--accent))] transition-colors"
          >
            <Upload className="h-4 w-4" />
            CSV Yükle
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 border border-[hsl(var(--border))] text-[hsl(var(--foreground))] rounded-lg hover:bg-[hsl(var(--accent))] transition-colors"
          >
            <Download className="h-4 w-4" />
            CSV
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--primary))] text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            Yeni Kayıt
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          <input
            type="text"
            placeholder="Ara (mağaza kodu/adı, malzeme kodu/adı)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
          />
        </div>
      </div>

      {/* Invalid Records Warning */}
      {invalidRecords.length > 0 && (
        <div className="mb-6 p-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300 mb-2">
                Eşleşmeyen Kayıtlar ({invalidRecords.length} adet)
              </h3>
              <p className="text-sm text-red-600 dark:text-red-400 mb-3">
                Aşağıdaki kayıtlardaki mağaza veya malzeme kodları sistemde tanımlı değil.
                Lütfen Mağazalar veya Malzemeler sayfasından ilgili kayıtları ekleyin.
              </p>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {invalidRecords.slice(0, 10).map(item => {
                  const validation = getValidationStatus(item)
                  return (
                    <div key={item.id} className="text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
                      <span>•</span>
                      {!validation.magazaValid && (
                        <span className="bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded">
                          Mağaza: {item.magazaKodu}
                        </span>
                      )}
                      {!validation.malzemeValid && (
                        <span className="bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded">
                          Malzeme: {item.malzemeKodu}
                        </span>
                      )}
                      <span className="text-red-500">({item.yil}/{item.hafta})</span>
                    </div>
                  )
                })}
                {invalidRecords.length > 10 && (
                  <div className="text-xs text-red-500 italic">
                    ... ve {invalidRecords.length - 10} kayıt daha
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
                <th className="text-left px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Mağaza Kodu</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Mağaza Adı</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Malzeme Kodu</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Malzeme Adı</th>
                <th className="text-center px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Yıl</th>
                <th className="text-center px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Ay</th>
                <th className="text-center px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Hafta</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Stok</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Satış</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Yol</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Açık Sip.</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Ciro</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">SMM</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Brüt Kar %</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Stok Tutar</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={16} className="px-4 py-12 text-center text-[hsl(var(--muted-foreground))]">
                    <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Veri bulunamadı</p>
                  </td>
                </tr>
              ) : (
                filteredData.map(item => {
                  const isEditable = isLatestWeek(item)
                  const validation = getValidationStatus(item)
                  const rowClass = !validation.isValid
                    ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                    : isEditable
                      ? 'bg-blue-50/50 dark:bg-blue-900/5'
                      : ''
                  return (
                  <tr key={item.id} className={`border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] ${rowClass}`}>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <code className={`text-xs px-1.5 py-0.5 rounded ${!validation.magazaValid ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-[hsl(var(--muted))]'}`}>
                        {item.magazaKodu}
                        {!validation.magazaValid && <AlertCircle className="inline h-3 w-3 ml-1" />}
                      </code>
                    </td>
                    <td className={`px-3 py-2 whitespace-nowrap ${!validation.magazaValid ? 'text-red-600 dark:text-red-400' : ''}`}>{item.magazaAdi}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <code className={`text-xs px-1.5 py-0.5 rounded ${!validation.malzemeValid ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-[hsl(var(--muted))]'}`}>
                        {item.malzemeKodu}
                        {!validation.malzemeValid && <AlertCircle className="inline h-3 w-3 ml-1" />}
                      </code>
                    </td>
                    <td className={`px-3 py-2 font-medium whitespace-nowrap ${!validation.malzemeValid ? 'text-red-600 dark:text-red-400' : 'text-[hsl(var(--foreground))]'}`}>{item.malzemeAdi}</td>
                    <td className="px-3 py-2 text-center whitespace-nowrap">{item.yil}</td>
                    <td className="px-3 py-2 text-center whitespace-nowrap">{item.ay}</td>
                    <td className="px-3 py-2 text-center whitespace-nowrap">
                      {item.hafta}
                      {isEditable && <span className="ml-1 text-xs text-blue-500">●</span>}
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">{item.stok.toLocaleString('tr-TR')}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">{item.satis.toLocaleString('tr-TR')}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">{item.ypiSuresi}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">{item.acikSiparis.toLocaleString('tr-TR')}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap text-green-600">{formatCurrency(item.ciro)}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">{formatCurrency(item.smm)}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">%{item.brutKarOrani}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">{formatCurrency(item.stokTutar)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {isEditable ? (
                          <>
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1.5 hover:bg-[hsl(var(--accent))] rounded transition-colors"
                              title="Düzenle"
                            >
                              <Edit2 className="h-3.5 w-3.5 text-blue-500" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(item.id)}
                              className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                              title="Sil"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-red-500" />
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-[hsl(var(--muted-foreground))]">—</span>
                        )}
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[hsl(var(--card))] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[hsl(var(--border))] flex items-center justify-between sticky top-0 bg-[hsl(var(--card))]">
              <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">
                {editingItem ? 'Kaydı Düzenle' : 'Yeni Kayıt'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-[hsl(var(--accent))] rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Mağaza & Malzeme Bilgileri */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Mağaza Kodu *</label>
                  <input
                    type="text"
                    value={formData.magazaKodu}
                    onChange={(e) => setFormData({ ...formData, magazaKodu: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Mağaza Adı *</label>
                  <input
                    type="text"
                    value={formData.magazaAdi}
                    onChange={(e) => setFormData({ ...formData, magazaAdi: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Malzeme Kodu *</label>
                  <input
                    type="text"
                    value={formData.malzemeKodu}
                    onChange={(e) => setFormData({ ...formData, malzemeKodu: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Malzeme Adı *</label>
                  <input
                    type="text"
                    value={formData.malzemeAdi}
                    onChange={(e) => setFormData({ ...formData, malzemeAdi: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm"
                    required
                  />
                </div>
              </div>

              {/* Dönem Bilgileri */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Yıl</label>
                  <input
                    type="number"
                    min="2020"
                    max="2030"
                    value={formData.yil}
                    onChange={(e) => setFormData({ ...formData, yil: parseInt(e.target.value) || 2024 })}
                    className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Ay</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={formData.ay}
                    onChange={(e) => setFormData({ ...formData, ay: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Hafta</label>
                  <input
                    type="number"
                    min="1"
                    max="53"
                    value={formData.hafta}
                    onChange={(e) => setFormData({ ...formData, hafta: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm"
                  />
                </div>
              </div>

              {/* Stok & Satış */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Stok</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stok}
                    onChange={(e) => setFormData({ ...formData, stok: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Satış</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.satis}
                    onChange={(e) => setFormData({ ...formData, satis: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Yol (Hafta)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.ypiSuresi}
                    onChange={(e) => setFormData({ ...formData, ypiSuresi: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Açık Sipariş</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.acikSiparis}
                    onChange={(e) => setFormData({ ...formData, acikSiparis: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm"
                  />
                </div>
              </div>

              {/* Mali Veriler */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Ciro</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.ciro}
                    onChange={(e) => setFormData({ ...formData, ciro: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">SMM</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.smm}
                    onChange={(e) => setFormData({ ...formData, smm: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Brüt Kar %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.brutKarOrani}
                    onChange={(e) => setFormData({ ...formData, brutKarOrani: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Stok Tutar</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.stokTutar}
                    onChange={(e) => setFormData({ ...formData, stokTutar: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[hsl(var(--border))]">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]">
                  İptal
                </button>
                <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--primary))] text-white rounded-lg hover:opacity-90">
                  <Save className="h-4 w-4" />
                  {editingItem ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[hsl(var(--card))] rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-[hsl(var(--border))] flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">CSV Yükle</h2>
              <button onClick={() => { setShowImportModal(false); setImportResult(null) }} className="p-2 hover:bg-[hsl(var(--accent))] rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {importResult ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-900/10">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm text-green-700 dark:text-green-400">{importResult.success} kayıt başarıyla eklendi</span>
                  </div>
                  {importResult.error > 0 && (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/10">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                      <span className="text-sm text-red-700 dark:text-red-400">{importResult.error} kayıt eklenemedi</span>
                    </div>
                  )}
                  <button
                    onClick={() => { setShowImportModal(false); setImportResult(null) }}
                    className="w-full py-2 bg-[hsl(var(--primary))] text-white rounded-lg hover:opacity-90"
                  >
                    Tamam
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    CSV dosyası yükleyerek toplu veri ekleyebilirsiniz.
                  </p>
                  <button
                    onClick={downloadExampleCSV}
                    className="flex items-center gap-2 w-full p-3 rounded-lg border border-dashed border-[hsl(var(--border))] text-sm text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]"
                  >
                    <FileText className="h-4 w-4" />
                    Örnek CSV İndir
                  </button>
                  <div className="relative">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex items-center justify-center gap-2 p-8 rounded-lg border-2 border-dashed border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--primary))] transition-colors">
                      <Upload className="h-5 w-5" />
                      <span className="text-sm">CSV dosyası seçin veya sürükleyin</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[hsl(var(--card))] rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-2">Kaydı Sil</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">Bu kaydı silmek istediğinizden emin misiniz?</p>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 rounded-lg border border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]">
                İptal
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
