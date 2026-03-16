'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import type { Malzeme, Magaza, StokSatis, StokHareket, Kullanici, Kategori, ClusterAyar } from './types'
import * as firestore from './firestore'

// Session storage key (still using localStorage for session)
const SESSION_KEY = 'sarf_session'

// Demo data for initial setup
const DEMO_KATEGORILER: Omit<Kategori, 'id'>[] = [
  { ad: 'Temizlik', renk: '#3B82F6' },
  { ad: 'Ambalaj', renk: '#10B981' },
  { ad: 'Kırtasiye', renk: '#F59E0B' },
  { ad: 'Gıda', renk: '#EF4444' },
  { ad: 'Teknik', renk: '#8B5CF6' },
]

const DEMO_MAGAZALAR: Omit<Magaza, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { magazaKodu: '1001', magazaAdi: 'Deneme Store', cluster: 'Top1', sehir: 'İstanbul', bolge: 'Avrupa', bolgeMuduru: 'Ahmet Yılmaz', kapasiteAdet: 500, m2: 250, yolSuresi: 3, oncelik: 1, ortalamaFisSayisi: 1250, fbu: 3.2, fbs: 285, satisAdet: 4000, aktif: true },
  { magazaKodu: '1002', magazaAdi: 'Kadıköy Şube', cluster: 'Top1', sehir: 'İstanbul', bolge: 'Anadolu', bolgeMuduru: 'Mehmet Demir', kapasiteAdet: 300, m2: 180, yolSuresi: 3, oncelik: 2, ortalamaFisSayisi: 850, fbu: 2.8, fbs: 220, satisAdet: 2380, aktif: true },
  { magazaKodu: '1003', magazaAdi: 'Ankara Şube', cluster: 'Top2', sehir: 'Ankara', bolge: 'İç Anadolu', bolgeMuduru: 'Ayşe Kaya', kapasiteAdet: 400, m2: 200, yolSuresi: 3, oncelik: 1, ortalamaFisSayisi: 980, fbu: 3.0, fbs: 250, satisAdet: 2940, aktif: true },
]

const DEMO_CLUSTER_AYARLAR: ClusterAyar[] = [
  { cluster: 'Top1', yolSuresi: 3 },
  { cluster: 'Top2', yolSuresi: 3 },
  { cluster: 'Top3', yolSuresi: 3 },
  { cluster: 'Diğer', yolSuresi: 3 },
]

const DEMO_MALZEMELER: Omit<Malzeme, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    malzemeKodu: '10045564001',
    barkod: '8684230000000',
    ad: 'Kraft Poşet MAVİ (M), 2. Boy',
    anaGrup: 'Planlama',
    subGrup: 'Poşet',
    kalite: '1',
    tetikleyici: 'Satış',
    stokTakip: 'Var',
    birimTuketimBirim: 'Adet',
    birimTuketimMiktar: 1,
    fireOrani: 3,
    innerBox: 200,
    koliIci: 200,
    ureticiKodu: '101009',
    ureticiAdi: 'MODEL AMBALAJ ÜRÜNLERI SANAYI VE TI',
    ortalamaTedarikSuresi: 6,
    ortalamaEkSure: 2,
    depoStok: 342001,
    minSevkMiktari: 200,
    minSiparisMiktari: 50000,
    guvenlikStok: 300,
    aktif: true,
  },
  {
    malzemeKodu: '60001302',
    barkod: '8684230000000',
    ad: 'YM- Yuvarlak Sticker Kırmızı 5cm',
    anaGrup: 'Planlama',
    subGrup: 'Hediye Paketi',
    kalite: '1',
    tetikleyici: 'Kampanya/Fiyat',
    stokTakip: 'Yok',
    birimTuketimBirim: 'Adet',
    birimTuketimMiktar: 1,
    fireOrani: 10,
    innerBox: 10000,
    koliIci: 10000,
    ureticiKodu: '200036',
    ureticiAdi: 'BASKI ETİKET BARKOD SAN.DIŞ.TİC.LTD.ŞTİ.',
    ortalamaTedarikSuresi: 3,
    ortalamaEkSure: 2,
    depoStok: 328500,
    minSevkMiktari: 1000,
    minSiparisMiktari: 100000,
    guvenlikStok: 1000,
    aktif: true,
  },
  {
    malzemeKodu: '10045546001',
    barkod: '8684230000000',
    ad: 'Kraft Poşet Turuncu (M), 2. Boy',
    anaGrup: 'Planlama',
    subGrup: 'Poşet',
    kalite: '1',
    tetikleyici: 'Satış',
    stokTakip: 'Var',
    birimTuketimBirim: 'Adet',
    birimTuketimMiktar: 1,
    fireOrani: 3,
    innerBox: 200,
    koliIci: 200,
    ureticiKodu: '101009',
    ureticiAdi: 'MODEL AMBALAJ ÜRÜNLERI SANAYI VE TI',
    ortalamaTedarikSuresi: 6,
    ortalamaEkSure: 2,
    depoStok: 287814,
    minSevkMiktari: 200,
    minSiparisMiktari: 50000,
    guvenlikStok: 300,
    aktif: true,
  },
  {
    malzemeKodu: '10045542001',
    barkod: '8684230000000',
    ad: 'Kraft Poşet MAVİ (L), 3. Boy',
    anaGrup: 'Planlama',
    subGrup: 'Poşet',
    kalite: '1',
    tetikleyici: 'Satış',
    stokTakip: 'Var',
    birimTuketimBirim: 'Adet',
    birimTuketimMiktar: 1,
    fireOrani: 3,
    innerBox: 200,
    koliIci: 200,
    ureticiKodu: '200377',
    ureticiAdi: 'MEHMET TORUN - MAS OFSET',
    ortalamaTedarikSuresi: 6,
    ortalamaEkSure: 2,
    depoStok: 237959,
    minSevkMiktari: 200,
    minSiparisMiktari: 50000,
    guvenlikStok: 200,
    aktif: true,
  },
  {
    malzemeKodu: '10045547001',
    barkod: '8684230000000',
    ad: 'Kraft Poşet TURUNCU (L), 3. Boy',
    anaGrup: 'Planlama',
    subGrup: 'Poşet',
    kalite: '1',
    tetikleyici: 'Satış',
    stokTakip: 'Var',
    birimTuketimBirim: 'Adet',
    birimTuketimMiktar: 1,
    fireOrani: 3,
    innerBox: 200,
    koliIci: 200,
    ureticiKodu: '101009',
    ureticiAdi: 'MODEL AMBALAJ ÜRÜNLERI SANAYI VE TI',
    ortalamaTedarikSuresi: 6,
    ortalamaEkSure: 2,
    depoStok: 233685,
    minSevkMiktari: 200,
    minSiparisMiktari: 50000,
    guvenlikStok: 200,
    aktif: true,
  },
]

const DEMO_KULLANICILAR: Omit<Kullanici, 'id' | 'createdAt'>[] = [
  { email: 'admin@sarf.com', ad: 'Admin', rol: 'admin', aktif: true },
  { email: 'yonetici@sarf.com', ad: 'Yönetici', rol: 'yonetici', aktif: true },
]

interface Session {
  userId: string
  email: string
  ad: string
  rol: 'admin' | 'yonetici' | 'magaza'
  loginTime: string
}

interface StoreContextType {
  // Data
  malzemeler: Malzeme[]
  magazalar: Magaza[]
  stokSatislar: StokSatis[]
  hareketler: StokHareket[]
  kullanicilar: Kullanici[]
  kategoriler: Kategori[]
  clusterAyarlar: ClusterAyar[]
  session: Session | null
  loading: boolean

  // Malzeme actions
  addMalzeme: (malzeme: Omit<Malzeme, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateMalzeme: (id: string, malzeme: Partial<Malzeme>) => Promise<void>
  deleteMalzeme: (id: string) => Promise<void>

  // Magaza actions
  addMagaza: (magaza: Omit<Magaza, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateMagaza: (id: string, magaza: Partial<Magaza>) => Promise<void>
  deleteMagaza: (id: string) => Promise<void>

  // StokSatis actions
  addStokSatis: (stokSatis: Omit<StokSatis, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateStokSatis: (id: string, stokSatis: Partial<StokSatis>) => Promise<void>
  deleteStokSatis: (id: string) => Promise<void>
  bulkUpsertStokSatis: (
    records: Omit<StokSatis, 'id' | 'createdAt' | 'updatedAt'>[],
    onProgress?: (processed: number, total: number) => void
  ) => Promise<{ inserted: number; updated: number; errors: number }>

  // Cluster Ayar actions
  updateClusterAyar: (cluster: string, yolSuresi: number) => Promise<void>

  // Refresh data from Firestore
  refreshData: () => Promise<void>

  // Auth actions
  login: (email: string, password: string) => boolean
  logout: () => void
}

const StoreContext = createContext<StoreContextType | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [malzemeler, setMalzemeler] = useState<Malzeme[]>([])
  const [magazalar, setMagazalar] = useState<Magaza[]>([])
  const [stokSatislar, setStokSatislar] = useState<StokSatis[]>([])
  const [hareketler, setHareketler] = useState<StokHareket[]>([])
  const [kullanicilar, setKullanicilar] = useState<Kullanici[]>([])
  const [kategoriler, setKategoriler] = useState<Kategori[]>([])
  const [clusterAyarlar, setClusterAyarlar] = useState<ClusterAyar[]>([])
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Load data from Firestore on mount
  const loadData = useCallback(async () => {
    try {
      setLoading(true)

      // Check if database is initialized
      const isInitialized = await firestore.isDatabaseInitialized()

      if (!isInitialized) {
        // Initialize with demo data
        console.log('Initializing database with demo data...')
        await firestore.initializeDatabase(
          DEMO_KATEGORILER,
          DEMO_MAGAZALAR,
          DEMO_MALZEMELER,
          DEMO_KULLANICILAR,
          DEMO_CLUSTER_AYARLAR
        )
      }

      // Load all data from Firestore
      // StokSatislar için son 4 hafta yüklenir (performans için)
      const [
        loadedMalzemeler,
        loadedMagazalar,
        loadedStokSatislar,
        loadedHareketler,
        loadedKullanicilar,
        loadedKategoriler,
        loadedClusterAyarlar,
      ] = await Promise.all([
        firestore.getMalzemeler(),
        firestore.getMagazalar(),
        firestore.getStokSatislarByWeeks(4), // Son 4 hafta (ihtiyaç hesabı için yeterli)
        firestore.getHareketler(),
        firestore.getKullanicilar(),
        firestore.getKategoriler(),
        firestore.getClusterAyarlar(),
      ])

      setMalzemeler(loadedMalzemeler)
      setMagazalar(loadedMagazalar)
      setStokSatislar(loadedStokSatislar)
      setHareketler(loadedHareketler)
      setKullanicilar(loadedKullanicilar)
      setKategoriler(loadedKategoriler)
      setClusterAyarlar(loadedClusterAyarlar)

      // Load session from localStorage
      const savedSession = localStorage.getItem(SESSION_KEY)
      if (savedSession) {
        setSession(JSON.parse(savedSession))
      }
    } catch (error) {
      console.error('Error loading data from Firestore:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Refresh data from Firestore
  const refreshData = async () => {
    await loadData()
  }

  // Malzeme actions
  const addMalzeme = async (malzeme: Omit<Malzeme, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const id = await firestore.addMalzeme(malzeme)
      const newMalzeme: Malzeme = {
        ...malzeme,
        id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setMalzemeler(prev => [...prev, newMalzeme])
    } catch (error) {
      console.error('Error adding malzeme:', error)
      throw error
    }
  }

  const updateMalzeme = async (id: string, updates: Partial<Malzeme>) => {
    try {
      await firestore.updateMalzeme(id, updates)
      setMalzemeler(prev =>
        prev.map(m =>
          m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m
        )
      )
    } catch (error) {
      console.error('Error updating malzeme:', error)
      throw error
    }
  }

  const deleteMalzeme = async (id: string) => {
    try {
      await firestore.deleteMalzeme(id)
      setMalzemeler(prev => prev.filter(m => m.id !== id))
    } catch (error) {
      console.error('Error deleting malzeme:', error)
      throw error
    }
  }

  // Magaza actions
  const addMagaza = async (magaza: Omit<Magaza, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const id = await firestore.addMagaza(magaza)
      const newMagaza: Magaza = {
        ...magaza,
        id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setMagazalar(prev => [...prev, newMagaza])
    } catch (error) {
      console.error('Error adding magaza:', error)
      throw error
    }
  }

  const updateMagaza = async (id: string, updates: Partial<Magaza>) => {
    try {
      await firestore.updateMagaza(id, updates)
      setMagazalar(prev =>
        prev.map(m =>
          m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m
        )
      )
    } catch (error) {
      console.error('Error updating magaza:', error)
      throw error
    }
  }

  const deleteMagaza = async (id: string) => {
    try {
      await firestore.deleteMagaza(id)
      setMagazalar(prev => prev.filter(m => m.id !== id))
    } catch (error) {
      console.error('Error deleting magaza:', error)
      throw error
    }
  }

  // StokSatis actions
  const addStokSatis = async (stokSatis: Omit<StokSatis, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const id = await firestore.addStokSatis(stokSatis)
      const newStokSatis: StokSatis = {
        ...stokSatis,
        id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setStokSatislar(prev => [...prev, newStokSatis])
    } catch (error) {
      console.error('Error adding stokSatis:', error)
      throw error
    }
  }

  const updateStokSatis = async (id: string, updates: Partial<StokSatis>) => {
    try {
      await firestore.updateStokSatis(id, updates)
      setStokSatislar(prev =>
        prev.map(s =>
          s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
        )
      )
    } catch (error) {
      console.error('Error updating stokSatis:', error)
      throw error
    }
  }

  const deleteStokSatis = async (id: string) => {
    try {
      await firestore.deleteStokSatis(id)
      setStokSatislar(prev => prev.filter(s => s.id !== id))
    } catch (error) {
      console.error('Error deleting stokSatis:', error)
      throw error
    }
  }

  // Bulk UPSERT StokSatis (varsa güncelle, yoksa ekle)
  // Deterministic ID kullanır - çok hızlı
  const bulkUpsertStokSatis = async (
    records: Omit<StokSatis, 'id' | 'createdAt' | 'updatedAt'>[],
    onProgress?: (processed: number, total: number) => void
  ) => {
    try {
      const result = await firestore.bulkUpsertStokSatis(records, [], onProgress)
      // Refresh only last 4 weeks from Firestore after bulk operation
      const updatedStokSatislar = await firestore.getStokSatislarByWeeks(4)
      setStokSatislar(updatedStokSatislar)
      return result
    } catch (error) {
      console.error('Error bulk upserting stokSatis:', error)
      throw error
    }
  }

  // Cluster Ayar actions
  const updateClusterAyar = async (cluster: string, yolSuresi: number) => {
    try {
      await firestore.setClusterAyar(cluster, yolSuresi)

      // Update local state
      setClusterAyarlar(prev => {
        const exists = prev.find(c => c.cluster === cluster)
        if (exists) {
          return prev.map(c => c.cluster === cluster ? { ...c, yolSuresi } : c)
        } else {
          return [...prev, { cluster, yolSuresi }]
        }
      })

      // Update all magazalar in this cluster
      setMagazalar(prev =>
        prev.map(m =>
          m.cluster === cluster
            ? { ...m, yolSuresi, updatedAt: new Date().toISOString() }
            : m
        )
      )
    } catch (error) {
      console.error('Error updating cluster ayar:', error)
      throw error
    }
  }

  // Auth actions
  const login = (email: string, password: string): boolean => {
    // Demo login - in real app, this would use Firebase Auth
    const demoAccounts = [
      { email: 'admin@sarf.com', password: 'admin123', ad: 'Admin', rol: 'admin' as const },
      { email: 'yonetici@sarf.com', password: 'yonetici123', ad: 'Yönetici', rol: 'yonetici' as const },
      { email: 'demo@sarf.com', password: 'demo123', ad: 'Demo Kullanıcı', rol: 'magaza' as const },
    ]

    const account = demoAccounts.find(a => a.email === email && a.password === password)
    if (account) {
      const newSession: Session = {
        userId: Date.now().toString(),
        email: account.email,
        ad: account.ad,
        rol: account.rol,
        loginTime: new Date().toISOString(),
      }
      setSession(newSession)
      localStorage.setItem(SESSION_KEY, JSON.stringify(newSession))
      return true
    }
    return false
  }

  const logout = () => {
    setSession(null)
    localStorage.removeItem(SESSION_KEY)
  }

  return (
    <StoreContext.Provider
      value={{
        malzemeler,
        magazalar,
        stokSatislar,
        hareketler,
        kullanicilar,
        kategoriler,
        clusterAyarlar,
        session,
        loading,
        addMalzeme,
        updateMalzeme,
        deleteMalzeme,
        addMagaza,
        updateMagaza,
        deleteMagaza,
        addStokSatis,
        updateStokSatis,
        deleteStokSatis,
        bulkUpsertStokSatis,
        updateClusterAyar,
        refreshData,
        login,
        logout,
      }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const context = useContext(StoreContext)
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider')
  }
  return context
}
