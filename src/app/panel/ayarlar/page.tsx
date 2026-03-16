'use client'

import { useState, useMemo } from 'react'
import {
  Settings,
  Save,
  Truck,
  Info,
  Store,
} from 'lucide-react'
import { useStore } from '@/lib/store'

export default function AyarlarPage() {
  const { clusterAyarlar, magazalar, updateClusterAyar } = useStore()
  const [editingCluster, setEditingCluster] = useState<string | null>(null)
  const [tempValue, setTempValue] = useState<number>(3)

  // Mevcut cluster'ları mağazalardan çıkar
  const clusters = useMemo(() => {
    const clusterSet = new Set<string>()
    magazalar.forEach(m => {
      if (m.cluster) clusterSet.add(m.cluster)
    })
    // Default cluster'ları da ekle
    ;['Top1', 'Top2', 'Top3', 'Diğer'].forEach(c => clusterSet.add(c))
    return Array.from(clusterSet).sort()
  }, [magazalar])

  // Cluster için yol süresi getir
  const getClusterYolSuresi = (cluster: string): number => {
    const ayar = clusterAyarlar.find(c => c.cluster === cluster)
    return ayar?.yolSuresi ?? 3
  }

  // Cluster'daki mağaza sayısı
  const getClusterMagazaCount = (cluster: string): number => {
    return magazalar.filter(m => m.cluster === cluster).length
  }

  const handleEdit = (cluster: string) => {
    setEditingCluster(cluster)
    setTempValue(getClusterYolSuresi(cluster))
  }

  const handleSave = (cluster: string) => {
    updateClusterAyar(cluster, tempValue)
    setEditingCluster(null)
  }

  const handleCancel = () => {
    setEditingCluster(null)
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Ayarlar</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Sistem ayarları ve cluster yapılandırması
          </p>
        </div>
      </div>

      {/* Açıklama */}
      <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-200 dark:border-blue-900/20 mb-6">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
            <p className="font-medium">Cluster Yol Süresi Ayarı</p>
            <p>Her cluster için kaç hafta ileri forecast hesaplanacağını belirler. Bu değer değiştiğinde o cluster'daki tüm mağazaların yol süresi otomatik güncellenir.</p>
            <p><strong>Sevkiyat Hesabı:</strong> Düzeltilmiş Satış × Yol Süresi (hafta) ile projeksiyon yapılır ve YoY katsayıları uygulanır.</p>
          </div>
        </div>
      </div>

      {/* Cluster Ayarları */}
      <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] overflow-hidden">
        <div className="p-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-[hsl(var(--primary))]" />
            <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">Cluster Yol Süreleri</h2>
          </div>
        </div>

        <div className="divide-y divide-[hsl(var(--border))]">
          {clusters.map(cluster => {
            const yolSuresi = getClusterYolSuresi(cluster)
            const magazaCount = getClusterMagazaCount(cluster)
            const isEditing = editingCluster === cluster

            return (
              <div
                key={cluster}
                className="p-4 flex items-center justify-between hover:bg-[hsl(var(--muted))] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[hsl(var(--primary))]/10 flex items-center justify-center">
                    <Store className="h-5 w-5 text-[hsl(var(--primary))]" />
                  </div>
                  <div>
                    <div className="font-medium text-[hsl(var(--foreground))]">{cluster}</div>
                    <div className="text-sm text-[hsl(var(--muted-foreground))]">
                      {magazaCount} mağaza
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isEditing ? (
                    <>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="12"
                          value={tempValue}
                          onChange={(e) => setTempValue(parseInt(e.target.value) || 1)}
                          className="w-20 px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-center"
                          autoFocus
                        />
                        <span className="text-sm text-[hsl(var(--muted-foreground))]">hafta</span>
                      </div>
                      <button
                        onClick={() => handleSave(cluster)}
                        className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                        title="Kaydet"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handleCancel}
                        className="p-2 border border-[hsl(var(--border))] rounded-lg hover:bg-[hsl(var(--accent))] transition-colors"
                        title="İptal"
                      >
                        ×
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--muted))] rounded-lg">
                        <span className="text-lg font-bold text-[hsl(var(--foreground))]">{yolSuresi}</span>
                        <span className="text-sm text-[hsl(var(--muted-foreground))]">hafta</span>
                      </div>
                      <button
                        onClick={() => handleEdit(cluster)}
                        className="p-2 border border-[hsl(var(--border))] rounded-lg hover:bg-[hsl(var(--accent))] transition-colors"
                        title="Düzenle"
                      >
                        <Settings className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Mağaza Listesi */}
      <div className="mt-6 bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] overflow-hidden">
        <div className="p-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
          <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">Mağaza Yol Süreleri</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Cluster ayarı değiştiğinde otomatik güncellenir</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
                <th className="text-left px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Mağaza</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Cluster</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Yol Süresi</th>
              </tr>
            </thead>
            <tbody>
              {magazalar.map(magaza => (
                <tr key={magaza.id} className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]">
                  <td className="px-4 py-3">
                    <div className="font-medium text-[hsl(var(--foreground))]">{magaza.magazaAdi}</div>
                    <div className="text-xs text-[hsl(var(--muted-foreground))]">{magaza.magazaKodu}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-[hsl(var(--muted))] rounded text-xs">
                      {magaza.cluster || 'Diğer'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-bold text-[hsl(var(--primary))]">{magaza.yolSuresi || 3}</span>
                    <span className="text-xs text-[hsl(var(--muted-foreground))] ml-1">hafta</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
