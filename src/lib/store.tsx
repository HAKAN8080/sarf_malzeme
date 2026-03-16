'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { Malzeme, Magaza, StokSatis, StokHareket, Kullanici, Kategori, ClusterAyar } from './types'

// Storage version - increment this to reset data on structure change
const STORAGE_VERSION = '7'

// Storage keys
const STORAGE_KEYS = {
  version: 'sarf_version',
  malzemeler: 'sarf_malzemeler',
  magazalar: 'sarf_magazalar',
  stokSatislar: 'sarf_stok_satislar',
  hareketler: 'sarf_hareketler',
  kullanicilar: 'sarf_kullanicilar',
  kategoriler: 'sarf_kategoriler',
  clusterAyarlar: 'sarf_cluster_ayarlar',
  session: 'sarf_session',
}

// Demo data
const DEMO_KATEGORILER: Kategori[] = [
  { id: '1', ad: 'Temizlik', renk: '#3B82F6' },
  { id: '2', ad: 'Ambalaj', renk: '#10B981' },
  { id: '3', ad: 'Kırtasiye', renk: '#F59E0B' },
  { id: '4', ad: 'Gıda', renk: '#EF4444' },
  { id: '5', ad: 'Teknik', renk: '#8B5CF6' },
]

const DEMO_MAGAZALAR: Magaza[] = [
  { id: '1', magazaKodu: 'M001', magazaAdi: 'Merkez Mağaza', cluster: 'Top1', sehir: 'İstanbul', bolge: 'Avrupa', bolgeMuduru: 'Ahmet Yılmaz', kapasiteAdet: 500, m2: 250, yolSuresi: 3, oncelik: 1, aktif: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '2', magazaKodu: 'M002', magazaAdi: 'Kadıköy Şube', cluster: 'Top1', sehir: 'İstanbul', bolge: 'Anadolu', bolgeMuduru: 'Mehmet Demir', kapasiteAdet: 300, m2: 180, yolSuresi: 3, oncelik: 2, aktif: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '3', magazaKodu: 'M003', magazaAdi: 'Ankara Şube', cluster: 'Top2', sehir: 'Ankara', bolge: 'İç Anadolu', bolgeMuduru: 'Ayşe Kaya', kapasiteAdet: 400, m2: 200, yolSuresi: 3, oncelik: 1, aktif: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
]

const DEMO_CLUSTER_AYARLAR: ClusterAyar[] = [
  { cluster: 'Top1', yolSuresi: 3 },
  { cluster: 'Top2', yolSuresi: 3 },
  { cluster: 'Top3', yolSuresi: 3 },
  { cluster: 'Diğer', yolSuresi: 3 },
]

const DEMO_MALZEMELER: Malzeme[] = [
  {
    id: '1',
    malzemeKodu: 'TEM001',
    ad: 'Deterjan (5L)',
    anaGrup: 'Temizlik',
    subGrup: 'Sıvı Temizlik',
    kalite: 'Standart',
    tetikleyici: 'Manuel',
    stokTakip: 'Var',
    birimTuketimBirim: 'adet',
    birimTuketimMiktar: 1,
    fireOrani: 0,
    innerBox: 1,
    koliIci: 4,
    ureticiKodu: 'ABC001',
    ureticiAdi: 'ABC Kimya',
    ortalamaTedarikSuresi: 3,
    depoStok: 50,
    minSevkMiktari: 10,
    minSiparisMiktari: 20,
    guvenlikStok: 10,
    aktif: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    malzemeKodu: 'AMB001',
    ad: 'Kağıt Poşet (Büyük)',
    anaGrup: 'Ambalaj',
    subGrup: 'Poşet',
    kalite: 'Kraft',
    tetikleyici: 'Fiş sayısı',
    stokTakip: 'Var',
    birimTuketimBirim: 'adet',
    birimTuketimMiktar: 1,
    fireOrani: 2,
    innerBox: 100,
    koliIci: 1000,
    ureticiKodu: 'XYZ001',
    ureticiAdi: 'XYZ Ambalaj',
    ortalamaTedarikSuresi: 5,
    depoStok: 5000,
    minSevkMiktari: 500,
    minSiparisMiktari: 1000,
    guvenlikStok: 500,
    aktif: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    malzemeKodu: 'AMB002',
    ad: 'Plastik Poşet (Orta)',
    anaGrup: 'Ambalaj',
    subGrup: 'Poşet',
    kalite: 'PE',
    tetikleyici: 'Satış adeti',
    stokTakip: 'Var',
    birimTuketimBirim: 'adet',
    birimTuketimMiktar: 0.5,
    fireOrani: 5,
    innerBox: 200,
    koliIci: 2000,
    ureticiKodu: 'XYZ002',
    ureticiAdi: 'XYZ Ambalaj',
    ortalamaTedarikSuresi: 5,
    depoStok: 10000,
    minSevkMiktari: 1000,
    minSiparisMiktari: 2000,
    guvenlikStok: 1000,
    aktif: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
]

const DEMO_STOK_SATISLAR: StokSatis[] = [
  { id: '1', magazaKodu: 'M001', magazaAdi: 'Merkez Mağaza', malzemeKodu: 'TEM001', malzemeAdi: 'Deterjan (5L)', yil: 2024, ay: 3, hafta: 12, stok: 45, satis: 120, ypiSuresi: 1, acikSiparis: 20, ciro: 15000, smm: 9000, brutKarOrani: 40, stokTutar: 5625, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '2', magazaKodu: 'M001', magazaAdi: 'Merkez Mağaza', malzemeKodu: 'AMB001', malzemeAdi: 'Kağıt Poşet (Büyük)', yil: 2024, ay: 3, hafta: 12, stok: 2500, satis: 3500, ypiSuresi: 1, acikSiparis: 1000, ciro: 8750, smm: 5250, brutKarOrani: 40, stokTutar: 6250, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '3', magazaKodu: 'M002', magazaAdi: 'Kadıköy Şube', malzemeKodu: 'TEM001', malzemeAdi: 'Deterjan (5L)', yil: 2024, ay: 3, hafta: 12, stok: 30, satis: 85, ypiSuresi: 1, acikSiparis: 15, ciro: 10625, smm: 6375, brutKarOrani: 40, stokTutar: 3750, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
]

const DEMO_KULLANICILAR: Kullanici[] = [
  { id: '1', email: 'admin@sarf.com', ad: 'Admin', rol: 'admin', aktif: true, createdAt: new Date().toISOString() },
  { id: '2', email: 'yonetici@sarf.com', ad: 'Yönetici', rol: 'yonetici', aktif: true, createdAt: new Date().toISOString() },
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
  addMalzeme: (malzeme: Omit<Malzeme, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateMalzeme: (id: string, malzeme: Partial<Malzeme>) => void
  deleteMalzeme: (id: string) => void

  // Magaza actions
  addMagaza: (magaza: Omit<Magaza, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateMagaza: (id: string, magaza: Partial<Magaza>) => void
  deleteMagaza: (id: string) => void

  // StokSatis actions
  addStokSatis: (stokSatis: Omit<StokSatis, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateStokSatis: (id: string, stokSatis: Partial<StokSatis>) => void
  deleteStokSatis: (id: string) => void

  // Cluster Ayar actions
  updateClusterAyar: (cluster: string, yolSuresi: number) => void

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

  // Load data from localStorage on mount
  useEffect(() => {
    const loadData = () => {
      try {
        // Check version and clear old data if needed
        const savedVersion = localStorage.getItem(STORAGE_KEYS.version)
        if (savedVersion !== STORAGE_VERSION) {
          // Clear all old data
          Object.values(STORAGE_KEYS).forEach(key => {
            if (key !== STORAGE_KEYS.version) {
              localStorage.removeItem(key)
            }
          })
          // Also clear old keys
          localStorage.removeItem('sarf_stoklar')
          localStorage.removeItem('sarf_satislar')
          localStorage.setItem(STORAGE_KEYS.version, STORAGE_VERSION)
        }

        // Load kategoriler
        const savedKategoriler = localStorage.getItem(STORAGE_KEYS.kategoriler)
        if (savedKategoriler) {
          setKategoriler(JSON.parse(savedKategoriler))
        } else {
          setKategoriler(DEMO_KATEGORILER)
          localStorage.setItem(STORAGE_KEYS.kategoriler, JSON.stringify(DEMO_KATEGORILER))
        }

        // Load magazalar
        const savedMagazalar = localStorage.getItem(STORAGE_KEYS.magazalar)
        if (savedMagazalar) {
          setMagazalar(JSON.parse(savedMagazalar))
        } else {
          setMagazalar(DEMO_MAGAZALAR)
          localStorage.setItem(STORAGE_KEYS.magazalar, JSON.stringify(DEMO_MAGAZALAR))
        }

        // Load malzemeler
        const savedMalzemeler = localStorage.getItem(STORAGE_KEYS.malzemeler)
        if (savedMalzemeler) {
          setMalzemeler(JSON.parse(savedMalzemeler))
        } else {
          setMalzemeler(DEMO_MALZEMELER)
          localStorage.setItem(STORAGE_KEYS.malzemeler, JSON.stringify(DEMO_MALZEMELER))
        }

        // Load kullanicilar
        const savedKullanicilar = localStorage.getItem(STORAGE_KEYS.kullanicilar)
        if (savedKullanicilar) {
          setKullanicilar(JSON.parse(savedKullanicilar))
        } else {
          setKullanicilar(DEMO_KULLANICILAR)
          localStorage.setItem(STORAGE_KEYS.kullanicilar, JSON.stringify(DEMO_KULLANICILAR))
        }

        // Load stokSatislar
        const savedStokSatislar = localStorage.getItem(STORAGE_KEYS.stokSatislar)
        if (savedStokSatislar) {
          setStokSatislar(JSON.parse(savedStokSatislar))
        } else {
          setStokSatislar(DEMO_STOK_SATISLAR)
          localStorage.setItem(STORAGE_KEYS.stokSatislar, JSON.stringify(DEMO_STOK_SATISLAR))
        }

        // Load hareketler
        const savedHareketler = localStorage.getItem(STORAGE_KEYS.hareketler)
        if (savedHareketler) {
          setHareketler(JSON.parse(savedHareketler))
        }

        // Load clusterAyarlar
        const savedClusterAyarlar = localStorage.getItem(STORAGE_KEYS.clusterAyarlar)
        if (savedClusterAyarlar) {
          setClusterAyarlar(JSON.parse(savedClusterAyarlar))
        } else {
          setClusterAyarlar(DEMO_CLUSTER_AYARLAR)
          localStorage.setItem(STORAGE_KEYS.clusterAyarlar, JSON.stringify(DEMO_CLUSTER_AYARLAR))
        }

        // Load session
        const savedSession = localStorage.getItem(STORAGE_KEYS.session)
        if (savedSession) {
          setSession(JSON.parse(savedSession))
        }
      } catch (error) {
        console.error('Error loading data from localStorage:', error)
      }
      setLoading(false)
    }

    loadData()
  }, [])

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEYS.malzemeler, JSON.stringify(malzemeler))
    }
  }, [malzemeler, loading])

  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEYS.magazalar, JSON.stringify(magazalar))
    }
  }, [magazalar, loading])

  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEYS.stokSatislar, JSON.stringify(stokSatislar))
    }
  }, [stokSatislar, loading])

  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEYS.hareketler, JSON.stringify(hareketler))
    }
  }, [hareketler, loading])

  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEYS.clusterAyarlar, JSON.stringify(clusterAyarlar))
    }
  }, [clusterAyarlar, loading])

  // Malzeme actions
  const addMalzeme = (malzeme: Omit<Malzeme, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newMalzeme: Malzeme = {
      ...malzeme,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setMalzemeler(prev => [...prev, newMalzeme])
  }

  const updateMalzeme = (id: string, updates: Partial<Malzeme>) => {
    setMalzemeler(prev =>
      prev.map(m =>
        m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m
      )
    )
  }

  const deleteMalzeme = (id: string) => {
    setMalzemeler(prev => prev.filter(m => m.id !== id))
  }

  // Magaza actions
  const addMagaza = (magaza: Omit<Magaza, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newMagaza: Magaza = {
      ...magaza,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setMagazalar(prev => [...prev, newMagaza])
  }

  const updateMagaza = (id: string, updates: Partial<Magaza>) => {
    setMagazalar(prev =>
      prev.map(m =>
        m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m
      )
    )
  }

  const deleteMagaza = (id: string) => {
    setMagazalar(prev => prev.filter(m => m.id !== id))
  }

  // StokSatis actions
  const addStokSatis = (stokSatis: Omit<StokSatis, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newStokSatis: StokSatis = {
      ...stokSatis,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setStokSatislar(prev => [...prev, newStokSatis])
  }

  const updateStokSatis = (id: string, updates: Partial<StokSatis>) => {
    setStokSatislar(prev =>
      prev.map(s =>
        s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
      )
    )
  }

  const deleteStokSatis = (id: string) => {
    setStokSatislar(prev => prev.filter(s => s.id !== id))
  }

  // Cluster Ayar actions - cluster yol süresi değişince o cluster'daki tüm mağazalar güncellenir
  const updateClusterAyar = (cluster: string, yolSuresi: number) => {
    // Cluster ayarını güncelle
    setClusterAyarlar(prev => {
      const exists = prev.find(c => c.cluster === cluster)
      if (exists) {
        return prev.map(c => c.cluster === cluster ? { ...c, yolSuresi } : c)
      } else {
        return [...prev, { cluster, yolSuresi }]
      }
    })

    // Bu cluster'daki tüm mağazaların yolSuresi'ni güncelle
    setMagazalar(prev =>
      prev.map(m =>
        m.cluster === cluster
          ? { ...m, yolSuresi, updatedAt: new Date().toISOString() }
          : m
      )
    )
  }

  // Auth actions
  const login = (email: string, password: string): boolean => {
    // Demo login - in real app, this would be an API call
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
      localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(newSession))
      return true
    }
    return false
  }

  const logout = () => {
    setSession(null)
    localStorage.removeItem(STORAGE_KEYS.session)
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
        updateClusterAyar,
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
