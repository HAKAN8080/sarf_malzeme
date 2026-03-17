'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Save,
  Shield,
  ShieldCheck,
  Store,
  AlertCircle,
} from 'lucide-react'
import { useStore } from '@/lib/store'
import type { Kullanici } from '@/lib/types'

export default function KullanicilarPage() {
  const router = useRouter()
  const { kullanicilar, addKullanici, updateKullanici, deleteKullanici, session } = useStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingKullanici, setEditingKullanici] = useState<Kullanici | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Admin kontrolü
  if (session?.rol !== 'admin') {
    router.push('/panel')
    return null
  }

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    ad: '',
    rol: 'yonetici' as 'admin' | 'yonetici' | 'magaza',
    aktif: true,
  })

  // Filter kullanıcılar
  const filteredKullanicilar = useMemo(() => {
    return kullanicilar.filter(k => {
      const matchesSearch =
        k.ad.toLowerCase().includes(searchTerm.toLowerCase()) ||
        k.email.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesSearch
    })
  }, [kullanicilar, searchTerm])

  const openAddModal = () => {
    setEditingKullanici(null)
    setFormData({
      email: '',
      ad: '',
      rol: 'yonetici',
      aktif: true,
    })
    setFormError(null)
    setShowModal(true)
  }

  const openEditModal = (kullanici: Kullanici) => {
    setEditingKullanici(kullanici)
    setFormData({
      email: kullanici.email,
      ad: kullanici.ad,
      rol: kullanici.rol,
      aktif: kullanici.aktif,
    })
    setFormError(null)
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setIsSubmitting(true)

    try {
      if (editingKullanici) {
        await updateKullanici(editingKullanici.id, formData)
      } else {
        await addKullanici(formData)
      }
      setShowModal(false)
    } catch (error: unknown) {
      console.error('Error saving kullanici:', error)
      if (error instanceof Error) {
        setFormError(error.message)
      } else {
        setFormError('Kullanıcı kaydedilirken bir hata oluştu')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteKullanici(id)
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Error deleting kullanici:', error)
    }
  }

  const getRolBadge = (rol: string) => {
    switch (rol) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400">
            <ShieldCheck className="h-3 w-3" />
            Admin
          </span>
        )
      case 'yonetici':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
            <Shield className="h-3 w-3" />
            Yönetici
          </span>
        )
      case 'magaza':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
            <Store className="h-3 w-3" />
            Mağaza
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Kullanıcı Yönetimi</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Sistem kullanıcılarını yönetin ({filteredKullanicilar.length} kayıt)
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--primary))] text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          Yeni Kullanıcı
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
        <input
          type="text"
          placeholder="Kullanıcı ara (ad, email)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md pl-10 pr-4 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
        />
      </div>

      {/* Table */}
      <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
                <th className="text-left px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Ad</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Email</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Rol</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Durum</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Oluşturulma</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filteredKullanicilar.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-[hsl(var(--muted-foreground))]">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Kullanıcı bulunamadı</p>
                  </td>
                </tr>
              ) : (
                filteredKullanicilar.map(kullanici => (
                  <tr key={kullanici.id} className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]">
                    <td className="px-4 py-3 font-medium text-[hsl(var(--foreground))]">{kullanici.ad}</td>
                    <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{kullanici.email}</td>
                    <td className="px-4 py-3 text-center">{getRolBadge(kullanici.rol)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        kullanici.aktif
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {kullanici.aktif ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[hsl(var(--muted-foreground))] text-sm">
                      {kullanici.createdAt ? new Date(kullanici.createdAt).toLocaleDateString('tr-TR') : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(kullanici)}
                          className="p-1.5 hover:bg-[hsl(var(--accent))] rounded transition-colors"
                        >
                          <Edit2 className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(kullanici.id)}
                          className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
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
          <div className="bg-[hsl(var(--card))] rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-[hsl(var(--border))] flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">
                {editingKullanici ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-[hsl(var(--accent))] rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {formError}
                </div>
              )}

              {!editingKullanici && (
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 text-sm">
                  Yeni kullanıcı Firebase Console &gt; Authentication &gt; Users üzerinden eklenmeli.
                  Burada sadece rol ve bilgiler kaydedilir.
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Ad Soyad *</label>
                <input
                  type="text"
                  value={formData.ad}
                  onChange={(e) => setFormData({ ...formData, ad: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                  required
                  disabled={!!editingKullanici}
                />
                {editingKullanici && (
                  <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Email değiştirilemez</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Rol *</label>
                <select
                  value={formData.rol}
                  onChange={(e) => setFormData({ ...formData, rol: e.target.value as 'admin' | 'yonetici' | 'magaza' })}
                  className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                >
                  <option value="admin">Admin</option>
                  <option value="yonetici">Yönetici</option>
                  <option value="magaza">Mağaza</option>
                </select>
              </div>
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

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[hsl(var(--border))]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg border border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors disabled:opacity-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--primary))] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {isSubmitting ? 'Kaydediliyor...' : (editingKullanici ? 'Güncelle' : 'Kaydet')}
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
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-2">Kullanıcıyı Sil</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
              Bu kullanıcıyı silmek istediğinizden emin misiniz?
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
    </div>
  )
}
