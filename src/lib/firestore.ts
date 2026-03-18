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
import type { Malzeme, Magaza, StokSatis, StokHareket, Kullanici, Kategori, ClusterAyar, Talep, MagazaSevkiyat } from './types'

// Collection names
const COLLECTIONS = {
  MALZEMELER: 'malzemeler',
  MAGAZALAR: 'magazalar',
  STOK_SATISLAR: 'stokSatislar',
  HAREKETLER: 'hareketler',
  KULLANICILAR: 'kullanicilar',
  KATEGORILER: 'kategoriler',
  CLUSTER_AYARLAR: 'clusterAyarlar',
  TALEPLER: 'talepler',
  MAGAZA_SEVKIYAT: 'magazaSevkiyat',
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

// Tüm kayıtları getir (dikkat: çok veri varsa yavaş olabilir)
export const getStokSatislar = async (): Promise<StokSatis[]> => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.STOK_SATISLAR))
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StokSatis))
}

// Son N haftanın verilerini getir (performanslı)
export const getStokSatislarByWeeks = async (weekCount: number = 12): Promise<StokSatis[]> => {
  // Şu anki yıl ve hafta
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000))
  const currentWeek = Math.ceil((days + startOfYear.getDay() + 1) / 7)
  const currentYear = now.getFullYear()

  // Son weekCount hafta için minimum yıl ve hafta hesapla
  let minYear = currentYear
  let minWeek = currentWeek - weekCount
  if (minWeek <= 0) {
    minYear -= 1
    minWeek = 52 + minWeek
  }

  // Firestore'dan sadece son haftaları çek
  const q = query(
    collection(db, COLLECTIONS.STOK_SATISLAR),
    where('yil', '>=', minYear)
  )

  const snapshot = await getDocs(q)
  const results = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as StokSatis))
    .filter(s => {
      // Ek filtreleme (Firestore compound query limiti nedeniyle)
      if (s.yil > minYear) return true
      if (s.yil === minYear && s.hafta >= minWeek) return true
      return false
    })

  return results
}

// Belirli mağaza için verileri getir
export const getStokSatislarByMagaza = async (magazaKodu: string): Promise<StokSatis[]> => {
  const q = query(
    collection(db, COLLECTIONS.STOK_SATISLAR),
    where('magazaKodu', '==', magazaKodu)
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StokSatis))
}

// Belirli malzeme için verileri getir
export const getStokSatislarByMalzeme = async (malzemeKodu: string): Promise<StokSatis[]> => {
  const q = query(
    collection(db, COLLECTIONS.STOK_SATISLAR),
    where('malzemeKodu', '==', malzemeKodu)
  )
  const snapshot = await getDocs(q)
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

// Yardımcı: Belirli süre bekle
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

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

  // Batch işlemleri için 400'lük gruplar (güvenli limit)
  const BATCH_SIZE = 400
  // Rate limiting için batch'ler arası bekleme (ms)
  const DELAY_BETWEEN_BATCHES = 100

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

    // Retry logic for batch commit
    let retries = 3
    while (retries > 0) {
      try {
        await batch.commit()
        break
      } catch (error) {
        retries--
        if (retries === 0) {
          console.error('Batch commit failed after retries:', error)
          errors += chunk.length
          processed -= chunk.length
        } else {
          console.warn(`Batch commit failed, retrying... (${retries} left)`)
          await sleep(1000) // 1 saniye bekle ve tekrar dene
        }
      }
    }

    if (onProgress) {
      onProgress(Math.min(i + BATCH_SIZE, total), total)
    }

    // Rate limiting - batch'ler arası kısa bekleme
    if (i + BATCH_SIZE < records.length) {
      await sleep(DELAY_BETWEEN_BATCHES)
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

export const deleteKullanici = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTIONS.KULLANICILAR, id))
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

// ==================== TALEPLER ====================

export const getTalepler = async (): Promise<Talep[]> => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.TALEPLER))
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Talep))
}

export const getTaleplerByDurum = async (durum: 'beklemede' | 'onaylandi' | 'reddedildi'): Promise<Talep[]> => {
  const q = query(collection(db, COLLECTIONS.TALEPLER), where('durum', '==', durum))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Talep))
}

export const getTaleplerByMagaza = async (magazaKodu: string): Promise<Talep[]> => {
  const q = query(collection(db, COLLECTIONS.TALEPLER), where('magazaKodu', '==', magazaKodu))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Talep))
}

export const addTalep = async (talep: Omit<Talep, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, COLLECTIONS.TALEPLER), {
    ...talep,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
  return docRef.id
}

export const updateTalep = async (id: string, updates: Partial<Talep>): Promise<void> => {
  const docRef = doc(db, COLLECTIONS.TALEPLER, id)
  await updateDoc(docRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  })
}

export const deleteTalep = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTIONS.TALEPLER, id))
}

// Toplu talep ekleme
export const bulkAddTalepler = async (talepler: Omit<Talep, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<string[]> => {
  const ids: string[] = []
  const batch = writeBatch(db)
  const now = new Date().toISOString()

  for (const talep of talepler) {
    const docRef = doc(collection(db, COLLECTIONS.TALEPLER))
    batch.set(docRef, {
      ...talep,
      createdAt: now,
      updatedAt: now,
    })
    ids.push(docRef.id)
  }

  await batch.commit()
  return ids
}

// ==================== MAGAZA SEVKIYAT ====================

export const getMagazaSevkiyatlar = async (): Promise<MagazaSevkiyat[]> => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.MAGAZA_SEVKIYAT))
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MagazaSevkiyat))
}

export const getMagazaSevkiyatByHafta = async (yil: number, hafta: number): Promise<MagazaSevkiyat[]> => {
  const q = query(
    collection(db, COLLECTIONS.MAGAZA_SEVKIYAT),
    where('yil', '==', yil),
    where('hafta', '==', hafta)
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MagazaSevkiyat))
}

export const getMagazaSevkiyatByMagaza = async (magazaKodu: string): Promise<MagazaSevkiyat[]> => {
  const q = query(collection(db, COLLECTIONS.MAGAZA_SEVKIYAT), where('magazaKodu', '==', magazaKodu))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MagazaSevkiyat))
}

// Deterministic ID: magazaKodu_malzemeKodu_yil_hafta
const createSevkiyatId = (magazaKodu: string, malzemeKodu: string, yil: number, hafta: number): string => {
  return `${magazaKodu}_${malzemeKodu}_${yil}_${hafta}`
}

export const addMagazaSevkiyat = async (sevkiyat: Omit<MagazaSevkiyat, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const docId = createSevkiyatId(sevkiyat.magazaKodu, sevkiyat.malzemeKodu, sevkiyat.yil, sevkiyat.hafta)
  const docRef = doc(db, COLLECTIONS.MAGAZA_SEVKIYAT, docId)

  await setDoc(docRef, {
    ...sevkiyat,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }, { merge: true })

  return docId
}

export const updateMagazaSevkiyat = async (id: string, updates: Partial<MagazaSevkiyat>): Promise<void> => {
  const docRef = doc(db, COLLECTIONS.MAGAZA_SEVKIYAT, id)
  await updateDoc(docRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  })
}

export const deleteMagazaSevkiyat = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTIONS.MAGAZA_SEVKIYAT, id))
}

// Hesaplama sonuçlarını sevkiyat tablosuna yaz (sadece kaynak='hesaplama' olanları günceller, talep olanları ezmez)
export const bulkUpsertHesaplamaSevkiyat = async (
  sevkiyatlar: Omit<MagazaSevkiyat, 'id' | 'createdAt' | 'updatedAt'>[],
  yil: number,
  hafta: number
): Promise<{ inserted: number; skipped: number }> => {
  let inserted = 0
  let skipped = 0
  const now = new Date().toISOString()

  // Önce mevcut hafta için talep kaynaklı sevkiyatları al
  const mevcutSevkiyatlar = await getMagazaSevkiyatByHafta(yil, hafta)
  const talepKaynaklilar = new Set(
    mevcutSevkiyatlar
      .filter(s => s.kaynak === 'talep')
      .map(s => `${s.magazaKodu}_${s.malzemeKodu}`)
  )

  const BATCH_SIZE = 400
  for (let i = 0; i < sevkiyatlar.length; i += BATCH_SIZE) {
    const batchWrite = writeBatch(db)
    const chunk = sevkiyatlar.slice(i, i + BATCH_SIZE)

    for (const sevkiyat of chunk) {
      const key = `${sevkiyat.magazaKodu}_${sevkiyat.malzemeKodu}`

      // Eğer bu mağaza+malzeme için talep kaynaklı sevkiyat varsa, ezme
      if (talepKaynaklilar.has(key)) {
        skipped++
        continue
      }

      const docId = createSevkiyatId(sevkiyat.magazaKodu, sevkiyat.malzemeKodu, yil, hafta)
      const docRef = doc(db, COLLECTIONS.MAGAZA_SEVKIYAT, docId)

      batchWrite.set(docRef, {
        ...sevkiyat,
        yil,
        hafta,
        kaynak: 'hesaplama',
        updatedAt: now,
      }, { merge: true })

      inserted++
    }

    await batchWrite.commit()
  }

  return { inserted, skipped }
}
