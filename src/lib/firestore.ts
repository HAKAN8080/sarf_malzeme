import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  writeBatch,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Malzeme, Magaza, StokSatis, StokHareket, Kullanici, Kategori, ClusterAyar } from './types'

// Collection names
const COLLECTIONS = {
  MALZEMELER: 'malzemeler',
  MAGAZALAR: 'magazalar',
  STOK_SATISLAR: 'stokSatislar',
  HAREKETLER: 'hareketler',
  KULLANICILAR: 'kullanicilar',
  KATEGORILER: 'kategoriler',
  CLUSTER_AYARLAR: 'clusterAyarlar',
} as const

// ==================== MALZEMELER ====================

export const getMalzemeler = async (): Promise<Malzeme[]> => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.MALZEMELER))
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Malzeme))
}

export const addMalzeme = async (malzeme: Omit<Malzeme, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, COLLECTIONS.MALZEMELER), {
    ...malzeme,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
  return docRef.id
}

export const updateMalzeme = async (id: string, updates: Partial<Malzeme>): Promise<void> => {
  const docRef = doc(db, COLLECTIONS.MALZEMELER, id)
  await updateDoc(docRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  })
}

export const deleteMalzeme = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTIONS.MALZEMELER, id))
}

// ==================== MAGAZALAR ====================

export const getMagazalar = async (): Promise<Magaza[]> => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.MAGAZALAR))
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Magaza))
}

export const addMagaza = async (magaza: Omit<Magaza, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, COLLECTIONS.MAGAZALAR), {
    ...magaza,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
  return docRef.id
}

export const updateMagaza = async (id: string, updates: Partial<Magaza>): Promise<void> => {
  const docRef = doc(db, COLLECTIONS.MAGAZALAR, id)
  await updateDoc(docRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  })
}

export const deleteMagaza = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTIONS.MAGAZALAR, id))
}

// Update yolSuresi for all stores in a cluster
export const updateClusterYolSuresi = async (cluster: string, yolSuresi: number): Promise<void> => {
  const q = query(collection(db, COLLECTIONS.MAGAZALAR), where('cluster', '==', cluster))
  const snapshot = await getDocs(q)

  const batch = writeBatch(db)
  snapshot.docs.forEach(docSnapshot => {
    batch.update(docSnapshot.ref, { yolSuresi, updatedAt: new Date().toISOString() })
  })
  await batch.commit()
}

// ==================== STOK SATISLAR ====================

export const getStokSatislar = async (): Promise<StokSatis[]> => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.STOK_SATISLAR))
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StokSatis))
}

export const addStokSatis = async (stokSatis: Omit<StokSatis, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, COLLECTIONS.STOK_SATISLAR), {
    ...stokSatis,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
  return docRef.id
}

export const updateStokSatis = async (id: string, updates: Partial<StokSatis>): Promise<void> => {
  const docRef = doc(db, COLLECTIONS.STOK_SATISLAR, id)
  await updateDoc(docRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  })
}

export const deleteStokSatis = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTIONS.STOK_SATISLAR, id))
}

// Bulk add stok satis records
export const bulkAddStokSatis = async (records: Omit<StokSatis, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<number> => {
  const batch = writeBatch(db)
  let count = 0

  for (const record of records) {
    const docRef = doc(collection(db, COLLECTIONS.STOK_SATISLAR))
    batch.set(docRef, {
      ...record,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    count++

    // Firestore batch limit is 500
    if (count % 450 === 0) {
      await batch.commit()
    }
  }

  if (count % 450 !== 0) {
    await batch.commit()
  }

  return count
}

// ==================== HAREKETLER ====================

export const getHareketler = async (): Promise<StokHareket[]> => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.HAREKETLER))
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StokHareket))
}

export const addHareket = async (hareket: Omit<StokHareket, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, COLLECTIONS.HAREKETLER), hareket)
  return docRef.id
}

// ==================== KULLANICILAR ====================

export const getKullanicilar = async (): Promise<Kullanici[]> => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.KULLANICILAR))
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Kullanici))
}

export const getKullaniciBYEmail = async (email: string): Promise<Kullanici | null> => {
  const q = query(collection(db, COLLECTIONS.KULLANICILAR), where('email', '==', email))
  const snapshot = await getDocs(q)
  if (snapshot.empty) return null
  const doc = snapshot.docs[0]
  return { id: doc.id, ...doc.data() } as Kullanici
}

export const addKullanici = async (kullanici: Omit<Kullanici, 'id' | 'createdAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, COLLECTIONS.KULLANICILAR), {
    ...kullanici,
    createdAt: new Date().toISOString(),
  })
  return docRef.id
}

export const updateKullanici = async (id: string, updates: Partial<Kullanici>): Promise<void> => {
  const docRef = doc(db, COLLECTIONS.KULLANICILAR, id)
  await updateDoc(docRef, updates)
}

// ==================== KATEGORILER ====================

export const getKategoriler = async (): Promise<Kategori[]> => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.KATEGORILER))
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Kategori))
}

export const addKategori = async (kategori: Omit<Kategori, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, COLLECTIONS.KATEGORILER), kategori)
  return docRef.id
}

export const deleteKategori = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTIONS.KATEGORILER, id))
}

// ==================== CLUSTER AYARLAR ====================

export const getClusterAyarlar = async (): Promise<ClusterAyar[]> => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.CLUSTER_AYARLAR))
  return snapshot.docs.map(doc => ({ cluster: doc.id, ...doc.data() } as ClusterAyar))
}

export const setClusterAyar = async (cluster: string, yolSuresi: number): Promise<void> => {
  const docRef = doc(db, COLLECTIONS.CLUSTER_AYARLAR, cluster)
  await setDoc(docRef, { yolSuresi }, { merge: true })

  // Also update all stores in this cluster
  await updateClusterYolSuresi(cluster, yolSuresi)
}

// ==================== INITIALIZATION ====================

// Check if database has been initialized with demo data
export const isDatabaseInitialized = async (): Promise<boolean> => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.KATEGORILER))
  return !snapshot.empty
}

// Initialize database with demo data
export const initializeDatabase = async (
  kategoriler: Omit<Kategori, 'id'>[],
  magazalar: Omit<Magaza, 'id' | 'createdAt' | 'updatedAt'>[],
  malzemeler: Omit<Malzeme, 'id' | 'createdAt' | 'updatedAt'>[],
  kullanicilar: Omit<Kullanici, 'id' | 'createdAt'>[],
  clusterAyarlar: ClusterAyar[]
): Promise<void> => {
  const batch = writeBatch(db)

  // Add kategoriler
  for (const kategori of kategoriler) {
    const docRef = doc(collection(db, COLLECTIONS.KATEGORILER))
    batch.set(docRef, kategori)
  }

  // Add magazalar
  for (const magaza of magazalar) {
    const docRef = doc(collection(db, COLLECTIONS.MAGAZALAR))
    batch.set(docRef, {
      ...magaza,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  // Add malzemeler
  for (const malzeme of malzemeler) {
    const docRef = doc(collection(db, COLLECTIONS.MALZEMELER))
    batch.set(docRef, {
      ...malzeme,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  // Add kullanicilar
  for (const kullanici of kullanicilar) {
    const docRef = doc(collection(db, COLLECTIONS.KULLANICILAR))
    batch.set(docRef, {
      ...kullanici,
      createdAt: new Date().toISOString(),
    })
  }

  // Add cluster ayarlar
  for (const ayar of clusterAyarlar) {
    const docRef = doc(db, COLLECTIONS.CLUSTER_AYARLAR, ayar.cluster)
    batch.set(docRef, { yolSuresi: ayar.yolSuresi })
  }

  await batch.commit()
}
