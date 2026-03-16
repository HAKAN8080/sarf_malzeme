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

// Deterministic ID oluştur (mağaza+malzeme+yıl+hafta)
const createStokSatisId = (magazaKodu: string, malzemeKodu: string, yil: number, hafta: number): string => {
  return `${magazaKodu}_${malzemeKodu}_${yil}_${hafta}`
}

// Bulk UPSERT stok satis records (varsa güncelle, yoksa ekle)
// Deterministic ID kullanarak çok hızlı çalışır - mevcut kayıtları indirmeye gerek yok
export const bulkUpsertStokSatis = async (
  records: Omit<StokSatis, 'id' | 'createdAt' | 'updatedAt'>[],
  _existingRecords: StokSatis[], // Artık kullanılmıyor ama uyumluluk için
  onProgress?: (processed: number, total: number) => void
): Promise<{ inserted: number; updated: number; errors: number }> => {
  let processed = 0
  let errors = 0
  const total = records.length
  const now = new Date().toISOString()

  // Batch işlemleri için 450'lik gruplar (Firestore limiti 500)
  const BATCH_SIZE = 450

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = writeBatch(db)
    const chunk = records.slice(i, i + BATCH_SIZE)

    for (const record of chunk) {
      try {
        // Deterministic ID kullan
        const docId = createStokSatisId(record.magazaKodu, record.malzemeKodu, record.yil, record.hafta)
        const docRef = doc(db, COLLECTIONS.STOK_SATISLAR, docId)

        // setDoc with merge: varsa günceller, yoksa oluşturur
        batch.set(docRef, {
          ...record,
          updatedAt: now,
        }, { merge: true })

        processed++
      } catch {
        errors++
      }
    }

    await batch.commit()

    if (onProgress) {
      onProgress(Math.min(i + BATCH_SIZE, total), total)
    }
  }

  // Artık insert/update ayrımı yapamıyoruz (setDoc merge kullanıyoruz)
  // Tümünü "processed" olarak döndür
  return { inserted: processed, updated: 0, errors }
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
