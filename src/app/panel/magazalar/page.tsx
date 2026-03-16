'use client'

import { useState, useMemo, useRef } from 'react'
import {
  Store,
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
import type { Magaza } from '@/lib/types'

export default function MagazalarPage() {
  const { magazalar, addMagaza, updateMagaza, deleteMagaza } = useStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingMagaza, setEditingMagaza] = useState<Magaza | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; error: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [formData, setFormData] = useState({
    magazaKodu: '',
    magazaAdi: '',
    cluster: '',
    sehir: '',
    bolge: '',
    bolgeMuduru: '',
    kapasiteAdet: 0,
    m2: 0,
    yolSuresi: 3, // default 3 hafta
    oncelik: 2 as 1 | 2 | 3,
    aktif: true,
  })

  // Filter magazalar
  const filteredMagazalar = useMemo(() => {
    return magazalar.filter(m => {
      if (!m.magazaAdi || !m.magazaKodu) return false
      const search = searchTerm.toLowerCase()
      return (
        m.magazaAdi.toLowerCase().includes(search) ||
        m.magazaKodu.toLowerCase().includes(search) ||
        (m.sehir && m.sehir.toLowerCase().includes(search)) ||
        (m.bolge && m.bolge.toLowerCase().includes(search))
      )
    })
  }, [magazalar, searchTerm])

  const openAddModal = () => {
    setEditingMagaza(null)
    setFormData({
      magazaKodu: '',
      magazaAdi: '',
      cluster: '',
      sehir: '',
      bolge: '',
      bolgeMuduru: '',
      kapasiteAdet: 0,
      m2: 0,
      yolSuresi: 3, // default 3 hafta
      oncelik: 2,
      aktif: true,
    })
    setShowModal(true)
  }

  const openEditModal = (magaza: Magaza) => {
    setEditingMagaza(magaza)
    setFormData({
      magazaKodu: magaza.magazaKodu,
      magazaAdi: magaza.magazaAdi,
      cluster: magaza.cluster || '',
      sehir: magaza.sehir || '',
      bolge: magaza.bolge || '',
      bolgeMuduru: magaza.bolgeMuduru || '',
      kapasiteAdet: magaza.kapasiteAdet || 0,
      m2: magaza.m2 || 0,
      yolSuresi: magaza.yolSuresi || 3, // default 3 hafta
      oncelik: magaza.oncelik,
      aktif: magaza.aktif,
    })
    setShowModal(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingMagaza) {
      updateMagaza(editingMagaza.id, formData)
    } else {
      addMagaza(formData)
    }
    setShowModal(false)
  }

  const handleDelete = (id: string) => {
    deleteMagaza(id)
    setDeleteConfirm(null)
  }

  // CSV Export
  const exportCSV = () => {
    const headers = ['magaza_kodu', 'magaza_adi', 'cluster', 'sehir', 'bolge', 'bolge_muduru', 'kapasite_adet', 'm2', 'yol_suresi', 'oncelik']
    const rows = filteredMagazalar.map(m => [
      m.magazaKodu,
      m.magazaAdi,
      m.cluster || '',
      m.sehir || '',
      m.bolge || '',
      m.bolgeMuduru || '',
      (m.kapasiteAdet || '').toString(),
      (m.m2 || '').toString(),
      (m.yolSuresi || '').toString(),
      m.oncelik.toString()
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `magazalar-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Download example CSV
  const downloadExampleCSV = () => {
    const headers = ['magaza_kodu', 'magaza_adi', 'cluster', 'sehir', 'bolge', 'bolge_muduru', 'kapasite_adet', 'm2', 'yol_suresi', 'oncelik']
    const exampleRows = [
      ['M001', 'Merkez Mağaza', 'Top1', 'İstanbul', 'Avrupa', 'Ahmet Yılmaz', '500', '250', '1', '1'],
      ['M002', 'Kadıköy Şube', 'Top1', 'İstanbul', 'Anadolu', 'Mehmet Demir', '300', '180', '1', '2'],
      ['M003', 'Ankara Şube', 'Top2', 'Ankara', 'İç Anadolu', 'Ayşe Kaya', '400', '200', '2', '1'],
    ]

    const csvContent = [headers, ...exampleRows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'magazalar-ornek.csv'
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

        if (!magazaKodu || !magazaAdi) {
          error++
          continue
        }

        const oncelikValue = parseInt(getValue('oncelik')) || 2
        const oncelik = ([1, 2, 3].includes(oncelikValue) ? oncelikValue : 2) as 1 | 2 | 3

        addMagaza({
          magazaKodu,
          magazaAdi,
          cluster: getValue('cluster') || undefined,
          sehir: getValue('sehir') || undefined,
          bolge: getValue('bolge') || undefined,
          bolgeMuduru: getValue('bolge_muduru') || undefined,
          kapasiteAdet: parseInt(getValue('kapasite_adet')) || undefined,
          m2: parseInt(getValue('m2')) || undefined,
          yolSuresi: parseInt(getValue('yol_suresi')) || 3, // default 3 hafta
          oncelik,
          aktif: true,
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

  const getOncelikBadge = (oncelik: number) => {
    switch (oncelik) {
      case 1:
        return <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400">Yüksek</span>
      case 2:
        return <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">Orta</span>
      case 3:
        return <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">Düşük</span>
      default:
        return <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">-</span>
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Mağazalar</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Mağaza ve şube yönetimi ({filteredMagazalar.length} kayıt)
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
            Yeni Mağaza
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          <input
            type="text"
            placeholder="Mağaza ara (kod, ad, şehir, bölge)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
                <th className="text-left px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Kod</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Mağaza Adı</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Cluster</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Şehir</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Bölge</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Bölge Müdürü</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Kapasite</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">m²</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Yol Süresi</th>
                <th className="text-center px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Öncelik</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filteredMagazalar.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-[hsl(var(--muted-foreground))]">
                    <Store className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Mağaza bulunamadı</p>
                  </td>
                </tr>
              ) : (
                filteredMagazalar.map(magaza => (
                  <tr key={magaza.id} className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <code className="text-xs bg-[hsl(var(--muted))] px-1.5 py-0.5 rounded">{magaza.magazaKodu}</code>
                    </td>
                    <td className="px-3 py-2 font-medium text-[hsl(var(--foreground))] whitespace-nowrap">{magaza.magazaAdi}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {magaza.cluster ? (
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">{magaza.cluster}</span>
                      ) : '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">{magaza.sehir || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{magaza.bolge || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{magaza.bolgeMuduru || '-'}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">{magaza.kapasiteAdet || '-'}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">{magaza.m2 || '-'}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">{magaza.yolSuresi ? `${magaza.yolSuresi} hafta` : '3 hafta'}</td>
                    <td className="px-3 py-2 text-center whitespace-nowrap">{getOncelikBadge(magaza.oncelik)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(magaza)}
                          className="p-1.5 hover:bg-[hsl(var(--accent))] rounded transition-colors"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(magaza.id)}
                          className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[hsl(var(--card))] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[hsl(var(--border))] flex items-center justify-between sticky top-0 bg-[hsl(var(--card))]">
              <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">
                {editingMagaza ? 'Mağaza Düzenle' : 'Yeni Mağaza'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-[hsl(var(--accent))] rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
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

              <div>
                <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Cluster</label>
                <input
                  type="text"
                  value={formData.cluster}
                  onChange={(e) => setFormData({ ...formData, cluster: e.target.value })}
                  placeholder="Top1, Top2, vb."
                  className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Şehir</label>
                  <input
                    type="text"
                    value={formData.sehir}
                    onChange={(e) => setFormData({ ...formData, sehir: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Bölge</label>
                  <input
                    type="text"
                    value={formData.bolge}
                    onChange={(e) => setFormData({ ...formData, bolge: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Bölge Müdürü</label>
                  <input
                    type="text"
                    value={formData.bolgeMuduru}
                    onChange={(e) => setFormData({ ...formData, bolgeMuduru: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Kapasite (Adet)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.kapasiteAdet}
                    onChange={(e) => setFormData({ ...formData, kapasiteAdet: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">m²</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.m2}
                    onChange={(e) => setFormData({ ...formData, m2: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Yol Süresi (Hafta)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.yolSuresi}
                    onChange={(e) => setFormData({ ...formData, yolSuresi: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Öncelik</label>
                  <select
                    value={formData.oncelik}
                    onChange={(e) => setFormData({ ...formData, oncelik: parseInt(e.target.value) as 1 | 2 | 3 })}
                    className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm"
                  >
                    <option value={1}>1 - Yüksek</option>
                    <option value={2}>2 - Orta</option>
                    <option value={3}>3 - Düşük</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="aktif"
                  checked={formData.aktif}
                  onChange={(e) => setFormData({ ...formData, aktif: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="aktif" className="text-sm text-[hsl(var(--foreground))]">Aktif</label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[hsl(var(--border))]">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]">
                  İptal
                </button>
                <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--primary))] text-white rounded-lg hover:opacity-90">
                  <Save className="h-4 w-4" />
                  {editingMagaza ? 'Güncelle' : 'Kaydet'}
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
                    CSV dosyası yükleyerek toplu mağaza ekleyebilirsiniz.
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
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-2">Mağazayı Sil</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">Bu mağazayı silmek istediğinizden emin misiniz?</p>
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
