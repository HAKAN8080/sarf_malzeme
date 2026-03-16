'use client'

import { useState, useMemo } from 'react'
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Save,
  Filter,
  Download,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import { useStore } from '@/lib/store'
import type { Malzeme } from '@/lib/types'

export default function MalzemelerPage() {
  const { malzemeler, addMalzeme, updateMalzeme, deleteMalzeme } = useStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAnaGrup, setFilterAnaGrup] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingMalzeme, setEditingMalzeme] = useState<Malzeme | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; errors: string[] } | null>(null)

  // Get unique ana gruplar
  const anaGruplar = useMemo(() => {
    const gruplar = new Set(malzemeler.map(m => m.anaGrup))
    return Array.from(gruplar).sort()
  }, [malzemeler])

  // Form state
  const [formData, setFormData] = useState({
    malzemeKodu: '',
    barkod: '',
    ad: '',
    anaGrup: '',
    subGrup: '',
    kalite: '',
    tetikleyici: 'Manuel' as 'Fiş sayısı' | 'Satış adeti' | 'Manuel',
    stokTakip: 'Var' as 'Var' | 'Yok',
    birimTuketimBirim: 'adet',
    birimTuketimMiktar: 1,
    fireOrani: 0,
    innerBox: 1,
    koliIci: 1,
    toplamPaketBirimMiktar: 0,
    ureticiKodu: '',
    ureticiAdi: '',
    ortalamaTedarikSuresi: 0,
    ortalamaEkSure: 0,
    depoStok: 0,
    minSevkMiktari: 0,
    minSiparisMiktari: 0,
    guvenlikStok: 0,
    aktif: true,
  })

  // Filter malzemeler
  const filteredMalzemeler = useMemo(() => {
    return malzemeler.filter(m => {
      const matchesSearch =
        m.ad.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.malzemeKodu.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.barkod && m.barkod.includes(searchTerm))
      const matchesGrup = !filterAnaGrup || m.anaGrup === filterAnaGrup
      return matchesSearch && matchesGrup
    })
  }, [malzemeler, searchTerm, filterAnaGrup])

  const openAddModal = () => {
    setEditingMalzeme(null)
    setFormData({
      malzemeKodu: '',
      barkod: '',
      ad: '',
      anaGrup: '',
      subGrup: '',
      kalite: '',
      tetikleyici: 'Manuel',
      stokTakip: 'Var',
      birimTuketimBirim: 'adet',
      birimTuketimMiktar: 1,
      fireOrani: 0,
      innerBox: 1,
      koliIci: 1,
      toplamPaketBirimMiktar: 0,
      ureticiKodu: '',
      ureticiAdi: '',
      ortalamaTedarikSuresi: 0,
      ortalamaEkSure: 0,
      depoStok: 0,
      minSevkMiktari: 0,
      minSiparisMiktari: 0,
      guvenlikStok: 0,
      aktif: true,
    })
    setShowModal(true)
  }

  const openEditModal = (malzeme: Malzeme) => {
    setEditingMalzeme(malzeme)
    setFormData({
      malzemeKodu: malzeme.malzemeKodu,
      barkod: malzeme.barkod || '',
      ad: malzeme.ad,
      anaGrup: malzeme.anaGrup,
      subGrup: malzeme.subGrup || '',
      kalite: malzeme.kalite || '',
      tetikleyici: malzeme.tetikleyici,
      stokTakip: malzeme.stokTakip,
      birimTuketimBirim: malzeme.birimTuketimBirim,
      birimTuketimMiktar: malzeme.birimTuketimMiktar,
      fireOrani: malzeme.fireOrani,
      innerBox: malzeme.innerBox || 1,
      koliIci: malzeme.koliIci || 1,
      toplamPaketBirimMiktar: malzeme.toplamPaketBirimMiktar || 0,
      ureticiKodu: malzeme.ureticiKodu || '',
      ureticiAdi: malzeme.ureticiAdi || '',
      ortalamaTedarikSuresi: malzeme.ortalamaTedarikSuresi || 0,
      ortalamaEkSure: malzeme.ortalamaEkSure || 0,
      depoStok: malzeme.depoStok,
      minSevkMiktari: malzeme.minSevkMiktari || 0,
      minSiparisMiktari: malzeme.minSiparisMiktari || 0,
      guvenlikStok: malzeme.guvenlikStok,
      aktif: malzeme.aktif,
    })
    setShowModal(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingMalzeme) {
      updateMalzeme(editingMalzeme.id, formData)
    } else {
      addMalzeme(formData)
    }
    setShowModal(false)
  }

  const handleDelete = (id: string) => {
    deleteMalzeme(id)
    setDeleteConfirm(null)
  }

  const exportCSV = () => {
    const headers = [
      'Malzeme Kodu', 'Barkod', 'Ad', 'Stok Takip', 'Ana Grup', 'Sub Grup', 'Kalite',
      'Tetikleyici', 'Birim', 'Birim Tüketim', 'Fire %',
      'Inner Box', 'Koli İçi', 'Toplam Paket', 'Üretici Kodu', 'Üretici Adı',
      'Tedarik Süresi', 'Ek Süre', 'Depo Stok', 'Min Sevk', 'Min Sipariş', 'Güvenlik Stok'
    ]
    const rows = filteredMalzemeler.map(m => [
      m.malzemeKodu, m.barkod || '', m.ad, m.stokTakip, m.anaGrup, m.subGrup || '', m.kalite || '',
      m.tetikleyici, m.birimTuketimBirim, m.birimTuketimMiktar.toString(), m.fireOrani.toString(),
      (m.innerBox || '').toString(), (m.koliIci || '').toString(), (m.toplamPaketBirimMiktar || '').toString(),
      m.ureticiKodu || '', m.ureticiAdi || '',
      (m.ortalamaTedarikSuresi || '').toString(), (m.ortalamaEkSure || '').toString(),
      m.depoStok.toString(), (m.minSevkMiktari || '').toString(), (m.minSiparisMiktari || '').toString(), m.guvenlikStok.toString()
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `malzemeler-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length < 2) return { data: [], errors: ['CSV dosyası boş veya sadece başlık içeriyor'] }

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase().replace(/\s+/g, '_'))
    const data: Partial<Malzeme>[] = []
    const errors: string[] = []

    for (let i = 1; i < lines.length; i++) {
      const values: string[] = []
      let current = ''
      let inQuotes = false

      for (const char of lines[i]) {
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      values.push(current.trim())

      if (values.length < 3) {
        errors.push(`Satır ${i + 1}: Yetersiz veri`)
        continue
      }

      const getVal = (key: string) => {
        const idx = headers.indexOf(key)
        return idx >= 0 ? values[idx]?.replace(/"/g, '').trim() : ''
      }

      const getNum = (key: string) => {
        const val = getVal(key)
        return val ? parseFloat(val) || 0 : 0
      }

      const malzemeKodu = getVal('malzeme_kodu') || getVal('kod')
      const ad = getVal('ad') || getVal('malzeme_adi')

      if (!malzemeKodu || !ad) {
        errors.push(`Satır ${i + 1}: Malzeme kodu veya ad eksik`)
        continue
      }

      const tetikleyiciVal = getVal('tetikleyici')
      let tetikleyici: 'Fiş sayısı' | 'Satış adeti' | 'Manuel' = 'Manuel'
      if (tetikleyiciVal.toLowerCase().includes('fiş') || tetikleyiciVal.toLowerCase().includes('fis')) {
        tetikleyici = 'Fiş sayısı'
      } else if (tetikleyiciVal.toLowerCase().includes('satış') || tetikleyiciVal.toLowerCase().includes('satis')) {
        tetikleyici = 'Satış adeti'
      }

      const stokTakipVal = getVal('stok_takip')
      const stokTakip: 'Var' | 'Yok' = stokTakipVal.toLowerCase() === 'yok' ? 'Yok' : 'Var'

      data.push({
        malzemeKodu,
        barkod: getVal('barkod'),
        ad,
        anaGrup: getVal('ana_grup') || 'Genel',
        subGrup: getVal('sub_grup'),
        kalite: getVal('kalite'),
        tetikleyici,
        stokTakip,
        birimTuketimBirim: getVal('birim_tuketim_birim') || getVal('birim') || 'adet',
        birimTuketimMiktar: getNum('birim_tuketim_miktar') || getNum('birim_tuketim') || 1,
        fireOrani: getNum('fire_orani') || getNum('fire'),
        innerBox: getNum('inner_box'),
        koliIci: getNum('koli_ici'),
        toplamPaketBirimMiktar: getNum('toplam_paket_birim_miktar') || getNum('toplam_paket'),
        ureticiKodu: getVal('uretici_kodu'),
        ureticiAdi: getVal('uretici_adi'),
        ortalamaTedarikSuresi: getNum('ortalama_tedarik_suresi') || getNum('tedarik_suresi'),
        ortalamaEkSure: getNum('ortalama_ek_sure') || getNum('ek_sure'),
        depoStok: getNum('depo_stok'),
        minSevkMiktari: getNum('min_sevk_miktari') || getNum('min_sevk'),
        minSiparisMiktari: getNum('min_siparis_miktari') || getNum('min_siparis'),
        guvenlikStok: getNum('guvenlik_stok'),
        aktif: true,
      })
    }

    return { data, errors }
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const { data, errors } = parseCSV(text)

      let successCount = 0
      for (const malzeme of data) {
        try {
          addMalzeme(malzeme as Omit<Malzeme, 'id' | 'createdAt' | 'updatedAt'>)
          successCount++
        } catch {
          errors.push(`${malzeme.malzemeKodu}: Eklenemedi`)
        }
      }

      setImportResult({ success: successCount, errors })
    }
    reader.readAsText(file, 'UTF-8')
    e.target.value = ''
  }

  const downloadExampleCSV = () => {
    const headers = [
      'malzeme_kodu', 'barkod', 'ad', 'stok_takip', 'ana_grup', 'sub_grup', 'kalite',
      'tetikleyici', 'birim_tuketim_birim', 'birim_tuketim_miktar', 'fire_orani',
      'inner_box', 'koli_ici', 'toplam_paket_birim_miktar', 'uretici_kodu', 'uretici_adi',
      'ortalama_tedarik_suresi', 'ortalama_ek_sure', 'depo_stok', 'min_sevk_miktari', 'min_siparis_miktari', 'guvenlik_stok'
    ]
    const exampleRows = [
      ['MLZ001', '8690000000001', 'Kağıt Havlu', 'Var', 'Temizlik', 'Kağıt', 'A', 'Fiş sayısı', 'adet', '1', '5', '10', '12', '120', 'URK001', 'ABC Üretici', '7', '2', '500', '10', '100', '50'],
      ['MLZ002', '8690000000002', 'Bulaşık Deterjanı', 'Var', 'Temizlik', 'Kimyasal', 'B', 'Satış adeti', 'litre', '0.5', '3', '6', '24', '144', 'URK002', 'XYZ Üretici', '10', '3', '200', '5', '50', '20'],
      ['MLZ003', '', 'Poşet Büyük', 'Var', 'Ambalaj', '', '', 'Manuel', 'adet', '1', '0', '100', '10', '1000', '', '', '5', '1', '5000', '100', '500', '200'],
    ]

    const csvContent = [headers, ...exampleRows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'malzemeler-ornek.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const birimOptions = ['adet', 'kg', 'gr', 'litre', 'ml', 'paket', 'koli', 'rulo', 'kutu', 'metre', 'cm']

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Malzemeler</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Sarf malzeme tanımları ({filteredMalzemeler.length} kayıt)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadExampleCSV}
            className="flex items-center gap-2 px-3 py-2 border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] rounded-lg hover:bg-[hsl(var(--accent))] transition-colors text-sm"
            title="Örnek CSV İndir"
          >
            <FileText className="h-4 w-4" />
            Örnek
          </button>
          <button
            onClick={() => { setImportResult(null); setShowImportModal(true) }}
            className="flex items-center gap-2 px-3 py-2 border border-[hsl(var(--border))] text-[hsl(var(--foreground))] rounded-lg hover:bg-[hsl(var(--accent))] transition-colors text-sm"
          >
            <Upload className="h-4 w-4" />
            İçe Aktar
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-2 border border-[hsl(var(--border))] text-[hsl(var(--foreground))] rounded-lg hover:bg-[hsl(var(--accent))] transition-colors text-sm"
          >
            <Download className="h-4 w-4" />
            Dışa Aktar
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--primary))] text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            Yeni Malzeme
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          <input
            type="text"
            placeholder="Malzeme ara (ad, kod, barkod)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          <select
            value={filterAnaGrup}
            onChange={(e) => setFilterAnaGrup(e.target.value)}
            className="pl-10 pr-8 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] appearance-none min-w-[150px]"
          >
            <option value="">Tüm Gruplar</option>
            {anaGruplar.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
                <th className="text-left px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Kod</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Barkod</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Ad</th>
                <th className="text-center px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Stok Takip</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Ana Grup</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Sub Grup</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Kalite</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Tetikleyici</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Birim</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Tüketim</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Fire %</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Inner</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Koli</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Top.Pkt</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Ürt.Kod</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Ürt.Adı</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Ted.Süre</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Ek Süre</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Depo</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Min Sevk</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Min Sip.</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">Güvenlik</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filteredMalzemeler.length === 0 ? (
                <tr>
                  <td colSpan={23} className="px-4 py-12 text-center text-[hsl(var(--muted-foreground))]">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Malzeme bulunamadı</p>
                  </td>
                </tr>
              ) : (
                filteredMalzemeler.map(malzeme => (
                  <tr key={malzeme.id} className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <code className="text-xs bg-[hsl(var(--muted))] px-1.5 py-0.5 rounded">{malzeme.malzemeKodu}</code>
                    </td>
                    <td className="px-3 py-2 text-xs text-[hsl(var(--muted-foreground))] whitespace-nowrap">{malzeme.barkod || '-'}</td>
                    <td className="px-3 py-2 font-medium text-[hsl(var(--foreground))] whitespace-nowrap">{malzeme.ad}</td>
                    <td className="px-3 py-2 text-center whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                        malzeme.stokTakip === 'Var' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                        'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {malzeme.stokTakip}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">{malzeme.anaGrup}</td>
                    <td className="px-3 py-2 text-[hsl(var(--muted-foreground))] whitespace-nowrap">{malzeme.subGrup || '-'}</td>
                    <td className="px-3 py-2 text-[hsl(var(--muted-foreground))] whitespace-nowrap">{malzeme.kalite || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                        malzeme.tetikleyici === 'Fiş sayısı' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' :
                        malzeme.tetikleyici === 'Satış adeti' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {malzeme.tetikleyici}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[hsl(var(--muted-foreground))] whitespace-nowrap">{malzeme.birimTuketimBirim}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">{malzeme.birimTuketimMiktar}</td>
                    <td className="px-3 py-2 text-right text-[hsl(var(--muted-foreground))] whitespace-nowrap">{malzeme.fireOrani}%</td>
                    <td className="px-3 py-2 text-right text-[hsl(var(--muted-foreground))] whitespace-nowrap">{malzeme.innerBox || '-'}</td>
                    <td className="px-3 py-2 text-right text-[hsl(var(--muted-foreground))] whitespace-nowrap">{malzeme.koliIci || '-'}</td>
                    <td className="px-3 py-2 text-right text-[hsl(var(--muted-foreground))] whitespace-nowrap">{malzeme.toplamPaketBirimMiktar || '-'}</td>
                    <td className="px-3 py-2 text-[hsl(var(--muted-foreground))] whitespace-nowrap">{malzeme.ureticiKodu || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{malzeme.ureticiAdi || '-'}</td>
                    <td className="px-3 py-2 text-right text-[hsl(var(--muted-foreground))] whitespace-nowrap">{malzeme.ortalamaTedarikSuresi || '-'}</td>
                    <td className="px-3 py-2 text-right text-[hsl(var(--muted-foreground))] whitespace-nowrap">{malzeme.ortalamaEkSure || '-'}</td>
                    <td className="px-3 py-2 text-right font-medium whitespace-nowrap">{malzeme.depoStok}</td>
                    <td className="px-3 py-2 text-right text-[hsl(var(--muted-foreground))] whitespace-nowrap">{malzeme.minSevkMiktari || '-'}</td>
                    <td className="px-3 py-2 text-right text-[hsl(var(--muted-foreground))] whitespace-nowrap">{malzeme.minSiparisMiktari || '-'}</td>
                    <td className="px-3 py-2 text-right font-medium whitespace-nowrap">{malzeme.guvenlikStok}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(malzeme)}
                          className="p-1.5 hover:bg-[hsl(var(--accent))] rounded transition-colors"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(malzeme.id)}
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
          <div className="bg-[hsl(var(--card))] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[hsl(var(--border))] flex items-center justify-between sticky top-0 bg-[hsl(var(--card))]">
              <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">
                {editingMalzeme ? 'Malzeme Düzenle' : 'Yeni Malzeme'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-[hsl(var(--accent))] rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Temel Bilgiler */}
              <div>
                <h3 className="text-sm font-medium text-[hsl(var(--foreground))] mb-3">Temel Bilgiler</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Malzeme Kodu *</label>
                    <input
                      type="text"
                      value={formData.malzemeKodu}
                      onChange={(e) => setFormData({ ...formData, malzemeKodu: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Barkod</label>
                    <input
                      type="text"
                      value={formData.barkod}
                      onChange={(e) => setFormData({ ...formData, barkod: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Malzeme Adı *</label>
                    <input
                      type="text"
                      value={formData.ad}
                      onChange={(e) => setFormData({ ...formData, ad: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Sınıflandırma */}
              <div>
                <h3 className="text-sm font-medium text-[hsl(var(--foreground))] mb-3">Sınıflandırma</h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Ana Grup *</label>
                    <input
                      type="text"
                      value={formData.anaGrup}
                      onChange={(e) => setFormData({ ...formData, anaGrup: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Sub Grup</label>
                    <input
                      type="text"
                      value={formData.subGrup}
                      onChange={(e) => setFormData({ ...formData, subGrup: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Kalite</label>
                    <input
                      type="text"
                      value={formData.kalite}
                      onChange={(e) => setFormData({ ...formData, kalite: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Stok Takip</label>
                    <select
                      value={formData.stokTakip}
                      onChange={(e) => setFormData({ ...formData, stokTakip: e.target.value as 'Var' | 'Yok' })}
                      className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                    >
                      <option value="Var">Var</option>
                      <option value="Yok">Yok</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Tüketim Parametreleri */}
              <div>
                <h3 className="text-sm font-medium text-[hsl(var(--foreground))] mb-3">Tüketim Parametreleri</h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Tetikleyici</label>
                    <select
                      value={formData.tetikleyici}
                      onChange={(e) => setFormData({ ...formData, tetikleyici: e.target.value as 'Fiş sayısı' | 'Satış adeti' | 'Manuel' })}
                      className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                    >
                      <option value="Manuel">Manuel</option>
                      <option value="Fiş sayısı">Fiş sayısı</option>
                      <option value="Satış adeti">Satış adeti</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Birim</label>
                    <select
                      value={formData.birimTuketimBirim}
                      onChange={(e) => setFormData({ ...formData, birimTuketimBirim: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                    >
                      {birimOptions.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Birim Tüketim</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.birimTuketimMiktar}
                      onChange={(e) => setFormData({ ...formData, birimTuketimMiktar: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Fire Oranı (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.fireOrani}
                      onChange={(e) => setFormData({ ...formData, fireOrani: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                    />
                  </div>
                </div>
              </div>

              {/* Paketleme */}
              <div>
                <h3 className="text-sm font-medium text-[hsl(var(--foreground))] mb-3">Paketleme</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Inner Box</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.innerBox}
                      onChange={(e) => setFormData({ ...formData, innerBox: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Koli İçi</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.koliIci}
                      onChange={(e) => setFormData({ ...formData, koliIci: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Toplam Paket Birim</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.toplamPaketBirimMiktar}
                      onChange={(e) => setFormData({ ...formData, toplamPaketBirimMiktar: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                    />
                  </div>
                </div>
              </div>

              {/* Üretici/Tedarikçi */}
              <div>
                <h3 className="text-sm font-medium text-[hsl(var(--foreground))] mb-3">Üretici / Tedarikçi</h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Üretici Kodu</label>
                    <input
                      type="text"
                      value={formData.ureticiKodu}
                      onChange={(e) => setFormData({ ...formData, ureticiKodu: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Üretici Adı</label>
                    <input
                      type="text"
                      value={formData.ureticiAdi}
                      onChange={(e) => setFormData({ ...formData, ureticiAdi: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Ort. Tedarik Süresi (gün)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.ortalamaTedarikSuresi}
                      onChange={(e) => setFormData({ ...formData, ortalamaTedarikSuresi: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Ort. Ek Süre (gün)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.ortalamaEkSure}
                      onChange={(e) => setFormData({ ...formData, ortalamaEkSure: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                    />
                  </div>
                </div>
              </div>

              {/* Stok Parametreleri */}
              <div>
                <h3 className="text-sm font-medium text-[hsl(var(--foreground))] mb-3">Stok Parametreleri</h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Depo Stok</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.depoStok}
                      onChange={(e) => setFormData({ ...formData, depoStok: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Min Sevk Miktarı</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.minSevkMiktari}
                      onChange={(e) => setFormData({ ...formData, minSevkMiktari: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Min Sipariş Miktarı</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.minSiparisMiktari}
                      onChange={(e) => setFormData({ ...formData, minSiparisMiktari: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Güvenlik Stok</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.guvenlikStok}
                      onChange={(e) => setFormData({ ...formData, guvenlikStok: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                    />
                  </div>
                </div>
              </div>

              {/* Aktif */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="aktif"
                  checked={formData.aktif}
                  onChange={(e) => setFormData({ ...formData, aktif: e.target.checked })}
                  className="w-4 h-4 rounded border-[hsl(var(--border))]"
                />
                <label htmlFor="aktif" className="text-sm text-[hsl(var(--foreground))]">Aktif</label>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[hsl(var(--border))]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--primary))] text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                  <Save className="h-4 w-4" />
                  {editingMalzeme ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[hsl(var(--card))] rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-2">Malzemeyi Sil</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
              Bu malzemeyi silmek istediğinizden emin misiniz?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg border border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
              >
                İptal
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[hsl(var(--card))] rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">CSV İçe Aktar</h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-2 hover:bg-[hsl(var(--accent))] rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {importResult ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <div>
                    <p className="font-medium text-green-700 dark:text-green-400">
                      {importResult.success} malzeme başarıyla eklendi
                    </p>
                  </div>
                </div>

                {importResult.errors.length > 0 && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                      <p className="font-medium text-red-700 dark:text-red-400">
                        {importResult.errors.length} hata
                      </p>
                    </div>
                    <ul className="text-sm text-red-600 dark:text-red-400 space-y-1 max-h-32 overflow-y-auto">
                      {importResult.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  onClick={() => setShowImportModal(false)}
                  className="w-full px-4 py-2 bg-[hsl(var(--primary))] text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                  Kapat
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  CSV dosyası seçerek malzemelerinizi toplu olarak ekleyebilirsiniz.
                  Örnek CSV formatını indirmek için &quot;Örnek&quot; butonunu kullanın.
                </p>

                <div className="border-2 border-dashed border-[hsl(var(--border))] rounded-lg p-8 text-center">
                  <Upload className="h-10 w-10 mx-auto mb-3 text-[hsl(var(--muted-foreground))]" />
                  <label className="cursor-pointer">
                    <span className="text-[hsl(var(--primary))] hover:underline font-medium">
                      CSV dosyası seçin
                    </span>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleImport}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">
                    veya sürükleyip bırakın
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setShowImportModal(false)}
                    className="px-4 py-2 rounded-lg border border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
                  >
                    İptal
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
