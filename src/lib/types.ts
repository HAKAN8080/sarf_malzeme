// Malzeme (Sarf Malzeme) - Orijinal yapı
export interface Malzeme {
  id: string
  malzemeKodu: string
  barkod?: string
  ad: string
  anaGrup: string
  subGrup?: string
  kalite?: string
  tetikleyici: string // Satış, Kampanya/Fiyat, Manuel vb.
  stokTakip: 'Var' | 'Yok'
  birimTuketimBirim: string // adet, kg, litre vb.
  birimTuketimMiktar: number
  fireOrani: number // % olarak
  innerBox?: number
  koliIci?: number
  toplamPaketBirimMiktar?: number
  ureticiKodu?: string
  ureticiAdi?: string
  ortalamaTedarikSuresi?: number // gün
  ortalamaEkSure?: number // gün
  depoStok: number
  minSevkMiktari?: number
  minSiparisMiktari?: number
  guvenlikStok: number
  aktif: boolean
  createdAt: string
  updatedAt: string
}

// Mağaza - Orijinal yapı + cluster
export interface Magaza {
  id: string
  magazaKodu: string
  magazaAdi: string
  cluster?: string // Top1, Top2, vb.
  sehir?: string
  bolge?: string
  bolgeMuduru?: string
  kapasiteAdet?: number
  m2?: number
  yolSuresi: number // hafta (default: 3)
  oncelik: 1 | 2 | 3 // 1=Yüksek, 2=Orta, 3=Düşük
  // Haftalık ortalama performans metrikleri
  ortalamaFisSayisi?: number // Haftalık ortalama fiş sayısı
  fbu?: number // Fiş Başına Ürün (adet)
  fbs?: number // Fiş Başına Satış (TL)
  satisAdet?: number // Haftalık ortalama satış adeti
  aktif: boolean
  createdAt: string
  updatedAt: string
}

// Cluster Ayarları
export interface ClusterAyar {
  cluster: string
  yolSuresi: number // hafta (kaç hafta ileri forecast)
}

// Stok-Satış Birleşik Veri
export interface StokSatis {
  id: string
  magazaKodu: string
  magazaAdi: string
  malzemeKodu: string
  malzemeAdi: string
  yil: number
  ay: number
  hafta: number
  stok: number
  satis: number
  ypiSuresi: number // yol (yoldaki gün)
  acikSiparis: number
  ciro: number
  smm: number // Satılan Malın Maliyeti
  brutKarOrani: number // Brüt Kar %
  stokTutar: number
  createdAt: string
  updatedAt: string
}

// Stok Hareketi (Giriş/Çıkış kaydı)
export interface StokHareket {
  id: string
  magazaId: string
  malzemeId: string
  tip: 'giris' | 'cikis' | 'sayim' | 'transfer'
  miktar: number
  oncekiMiktar: number
  sonrakiMiktar: number
  aciklama?: string
  tarih: string
  kullaniciId?: string
}

// İhtiyaç Hesaplama Sonucu
export interface IhtiyacSonuc {
  magazaKodu: string
  magazaAdi: string
  malzemeKodu: string
  malzemeAdi: string
  tetikleyici: string // Satış, Kampanya/Fiyat, Manuel vb.
  // Son 3 hafta satış verileri
  sonHaftaSatis: number
  oncekiHaftaSatis: number
  dahaOncekiSatis: number
  // Hesaplama detayları
  agirlikliOrtalama: number // (son*0.6 + onceki*0.3 + dahaOnceki*0.1)
  yoyKatsayi: number // Geçen yıl haftalık geçiş katsayısı
  tahminSatis: number // Gelecek hafta tahmin satış (haftalık)
  gunlukTahminSatis: number // Günlük tahmin satış
  // Stok bilgileri
  mevcutStok: number
  yoldakiMiktar: number // Yolda olan miktar
  acikSiparis: number
  depoStok: number // Merkez depo stoku
  guvenlikStok: number
  // Sevkiyat hesabı (depodan mağazaya)
  sevkiyatIhtiyaci: number // Mağazanın ihtiyacı
  sevkiyatOnerisi: number // Min sevk miktarına yuvarlanmış
  minSevkMiktari: number
  // Üretim ihtiyacı hesabı
  tedarikSuresi: number // Tedarik süresi (gün)
  ekSure: number // Ek süre (gün)
  toplamTedarikSuresi: number // Tedarik + Ek süre
  projeksiyon: number // Tedarik süresi boyunca tahmini satış
  mevcutToplam: number // Stok + Depo + Yol - Projeksiyon
  uretimIhtiyaci: number // Üretim/sipariş ihtiyacı
  uretimOnerisi: number // Min sipariş miktarına yuvarlanmış
  minSiparisMiktari: number
  // Durum
  durum: 'yeterli' | 'uyari' | 'kritik'
  // Hesaplama metodu açıklaması
  hesaplamaMetodu: string // "Normal", "Ortalama alındı", "YoY yok (1x)", vb.
}

// Ürün Bazlı Üretim İhtiyacı Özeti
export interface UretimOzeti {
  malzemeKodu: string
  malzemeAdi: string
  toplamMagazaIhtiyaci: number // Tüm mağazaların toplam ihtiyacı
  depoStok: number
  toplamSevkiyat: number // Depodan sevk edilecek toplam
  kalanDepoStok: number // Sevkiyat sonrası kalan depo stok
  uretimIhtiyaci: number // Üretim/sipariş ihtiyacı
  uretimOnerisi: number // Min sipariş miktarına yuvarlanmış
  minSiparisMiktari: number
  tedarikSuresi: number
  durum: 'yeterli' | 'siparis_gerekli' | 'acil'
}

// Kullanıcı
export interface Kullanici {
  id: string
  email: string
  ad: string
  rol: 'admin' | 'yonetici' | 'magaza'
  magazaId?: string // Sadece mağaza rolü için
  aktif: boolean
  createdAt: string
  firebaseUid?: string // Firebase Auth UID
}

// Kategori
export interface Kategori {
  id: string
  ad: string
  renk?: string
}

// Dashboard İstatistikleri
export interface DashboardStats {
  toplamMalzeme: number
  toplamMagaza: number
  kritikStokSayisi: number
  bugunSatis: number
  bugunCiro: number
  bekleyenSiparis: number
}

// Mağaza Talebi
export interface Talep {
  id: string
  magazaKodu: string
  magazaAdi: string
  malzemeKodu: string
  malzemeAdi: string
  talepMiktari: number
  // Son hafta verileri (talep anındaki snapshot)
  sonHaftaStok: number
  sonHaftaSatis: number
  yoldakiMiktar: number
  depoStok: number
  // Durum
  durum: 'beklemede' | 'onaylandi' | 'reddedildi'
  // Meta
  talepEdenKullaniciId: string
  talepEdenAd: string
  talepTarihi: string
  onaylayanKullaniciId?: string
  onaylayanAd?: string
  onayTarihi?: string
  redNedeni?: string
  createdAt: string
  updatedAt: string
}

// Mağaza Sevkiyat (Pull + Push birleşik tablo)
export interface MagazaSevkiyat {
  id: string
  magazaKodu: string
  magazaAdi: string
  malzemeKodu: string
  malzemeAdi: string
  sevkMiktari: number
  // Kaynak tipi
  kaynak: 'hesaplama' | 'talep' // hesaplama = pull, talep = push
  talepId?: string // Eğer talepten geldiyse referans
  // Hesaplama anındaki veriler
  sonHaftaStok: number
  sonHaftaSatis: number
  yoldakiMiktar: number
  depoStok: number
  tahminSatis: number
  // Dönem bilgisi
  yil: number
  hafta: number
  // Meta
  olusturanKullaniciId: string
  olusturanAd: string
  createdAt: string
  updatedAt: string
}
