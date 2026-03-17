'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from './firebase'
import type { Malzeme, Magaza, StokSatis, StokHareket, Kullanici, Kategori, ClusterAyar } from './types'
import * as firestore from './firestore'

// Session storage key (still using localStorage for session)
const SESSION_KEY = 'sarf_session'

// Varsayılan kategoriler (boş başlangıç için)
const DEFAULT_KATEGORILER: Omit<Kategori, 'id'>[] = [
  { ad: 'Planlama', renk: '#3B82F6' },
]

// Varsayılan cluster ayarları
const DEFAULT_CLUSTER_AYARLAR: ClusterAyar[] = [
  { cluster: 'Top1', yolSuresi: 3 },
  { cluster: 'Top2', yolSuresi: 3 },
  { cluster: 'Top3', yolSuresi: 3 },
  { cluster: 'Diğer', yolSuresi: 3 },
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

  // Kullanici actions
  addKullanici: (kullanici: Omit<Kullanici, 'id' | 'createdAt'>) => Promise<void>
  updateKullanici: (id: string, kullanici: Partial<Kullanici>) => Promise<void>
  deleteKullanici: (id: string) => Promise<void>

  // Refresh data from Firestore
  refreshData: () => Promise<void>

  // Auth actions
  login: (email: string, password: string) => Promise<boolean>
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
        // Initialize with default settings (empty data)
        console.log('Initializing database...')
        await firestore.initializeDatabase(
          DEFAULT_KATEGORILER,
          [], // Boş mağaza listesi
          [], // Boş malzeme listesi
          [], // Boş kullanıcı listesi
          DEFAULT_CLUSTER_AYARLAR
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

  // Kullanici actions
  const addKullanici = async (kullanici: Omit<Kullanici, 'id' | 'createdAt'>) => {
    try {
      const id = await firestore.addKullanici(kullanici)
      const newKullanici: Kullanici = {
        ...kullanici,
        id,
        createdAt: new Date().toISOString(),
      }
      setKullanicilar(prev => [...prev, newKullanici])
    } catch (error) {
      console.error('Error adding kullanici:', error)
      throw error
    }
  }

  const updateKullanici = async (id: string, updates: Partial<Kullanici>) => {
    try {
      await firestore.updateKullanici(id, updates)
      setKullanicilar(prev =>
        prev.map(k => (k.id === id ? { ...k, ...updates } : k))
      )
    } catch (error) {
      console.error('Error updating kullanici:', error)
      throw error
    }
  }

  const deleteKullanici = async (id: string) => {
    try {
      await firestore.deleteKullanici(id)
      setKullanicilar(prev => prev.filter(k => k.id !== id))
    } catch (error) {
      console.error('Error deleting kullanici:', error)
      throw error
    }
  }

  // Auth actions - Firebase Authentication
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Firebase Auth ile giriş yap
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Firestore'dan kullanıcı bilgilerini al
      const kullanici = kullanicilar.find(k => k.email === email && k.aktif)

      if (kullanici) {
        const newSession: Session = {
          userId: kullanici.id,
          email: kullanici.email,
          ad: kullanici.ad,
          rol: kullanici.rol,
          loginTime: new Date().toISOString(),
        }
        setSession(newSession)
        localStorage.setItem(SESSION_KEY, JSON.stringify(newSession))
        return true
      } else {
        // Kullanıcı Firebase'de var ama Firestore'da yok - admin olarak kabul et
        const newSession: Session = {
          userId: user.uid,
          email: email,
          ad: 'Admin',
          rol: 'admin',
          loginTime: new Date().toISOString(),
        }
        setSession(newSession)
        localStorage.setItem(SESSION_KEY, JSON.stringify(newSession))
        return true
      }
    } catch (error: unknown) {
      console.error('Login error:', error)
      return false
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Logout error:', error)
    }
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
        addKullanici,
        updateKullanici,
        deleteKullanici,
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
