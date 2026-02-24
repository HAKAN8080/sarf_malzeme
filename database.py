"""
Sarf Malzeme Tuketim Hesaplayici
================================
TK (Tuketim Katsayisi) bazli sarf malzeme planlama modulu.

Tanim:
- TK: 1 birim operasyon/satis basina tuketilen sarf miktari
- Fire Orani: Normal tuketim disinda olusan ek tuketim yuzdesi

Yazar: EnglishHome IT
Versiyon: 1.0
"""

from dataclasses import dataclass, field
from typing import Dict, Optional
from enum import Enum


class Kanal(Enum):
    """Satis/operasyon kanallari"""
    MAGAZA = "magaza"
    ONLINE = "online"
    TOPTAN = "toptan"
    DEPO = "depo"


class Tetikleyici(Enum):
    """Sarf malzemeyi tetikleyen islem turleri"""
    FIS_ADEDI = "fis_adedi"           # Kesilen fis sayisi
    SEVKIYAT = "sevkiyat"             # Gonderilen koli/paket sayisi
    SATIS_ADEDI = "satis_adedi"       # Satilan urun adedi
    SIPARIS = "siparis"               # Online siparis adedi
    PAKETLEME = "paketleme"           # Paketlenen urun adedi
    IADE = "iade"                     # Iade islem adedi
    ETIKETLEME = "etiketleme"         # Etiketlenen urun adedi


@dataclass
class PaketBilgisi:
    """Malzemenin paket/rulo/kutu bilgisi"""
    paket_adi: str          # "Rulo", "Kutu", "Koli", "Paket"
    paket_miktari: float    # 1 pakette kac birim var (ornek: 30m, 1000 adet)
    paket_birimi: str       # Paketin birimi (metre, adet, kg)

    def hesapla_paket_adedi(self, miktar: float) -> float:
        """Verilen miktar icin kac paket gerektigini hesaplar"""
        if self.paket_miktari <= 0:
            return 0
        return miktar / self.paket_miktari


@dataclass
class SarfMalzeme:
    """Sarf malzeme tanimi"""
    kod: str
    ad: str
    birim: str                          # adet, metre, kg vs.
    tetikleyici: Tetikleyici            # Bu malzemeyi ne tetikler
    tetikleyici_aciklama: str = ""      # "Her fis icin 25cm kullanilir"
    birim_tuketim: float = 1.0          # Tetikleyici basina tuketim (ornek: 0.25m/fis)
    birim_tuketim_aciklama: str = ""    # "25cm = 0.25m"
    paket: Optional[PaketBilgisi] = None  # Rulo/kutu bilgisi
    varsayilan_fire: float = 0.0
    kanal_fire: Dict[Kanal, float] = field(default_factory=dict)
    min_stok: int = 0
    tedarik_suresi_gun: int = 7

    def get_tk(self) -> float:
        """Tuketim katsayisini dondur (birim_tuketim ile ayni)"""
        return self.birim_tuketim

    def get_fire(self, kanal: Optional[Kanal] = None) -> float:
        """Kanal bazli veya varsayilan fire orani dondur"""
        if kanal and kanal in self.kanal_fire:
            return self.kanal_fire[kanal]
        return self.varsayilan_fire

    def hesapla_tuketim(self, tetikleyici_adedi: int) -> float:
        """Tetikleyici adedine gore tuketim hesapla"""
        return tetikleyici_adedi * self.birim_tuketim

    def hesapla_paket_ihtiyaci(self, tuketim: float) -> Optional[float]:
        """Tuketim miktari icin paket adedi hesapla"""
        if self.paket:
            return self.paket.hesapla_paket_adedi(tuketim)
        return None

    def aciklama_metni(self) -> str:
        """Malzeme icin aciklama metni olustur"""
        metin = f"Tetikleyici: {self.tetikleyici.value}"
        if self.tetikleyici_aciklama:
            metin += f"\n{self.tetikleyici_aciklama}"
        if self.paket:
            metin += f"\n1 {self.paket.paket_adi} = {self.paket.paket_miktari} {self.paket.paket_birimi}"
        return metin


# =============================================================================
# TEMEL HESAPLAMA FONKSIYONLARI
# =============================================================================

def calculate_theoretical_consumption(process_count: int, tk: float) -> float:
    """
    Teorik sarf miktarini hesaplar.

    Args:
        process_count: Planlanan islem adedi
        tk: Tuketim katsayisi (1 islem basina tuketim)

    Returns:
        Teorik sarf miktari

    Ornek:
        >>> calculate_theoretical_consumption(120000, 1.0)
        120000.0
    """
    if process_count < 0:
        raise ValueError("Islem adedi negatif olamaz")
    if tk < 0:
        raise ValueError("TK negatif olamaz")

    return process_count * tk


def calculate_net_consumption(process_count: int, tk: float, fire_rate: float) -> float:
    """
    Fire dahil net sarf miktarini hesaplar.

    Args:
        process_count: Planlanan islem adedi
        tk: Tuketim katsayisi
        fire_rate: Fire orani (yuzde olarak, ornek: 0.03 = %3)

    Returns:
        Fire dahil net sarf miktari

    Ornek:
        >>> calculate_net_consumption(120000, 1.0, 0.03)
        123600.0
    """
    if fire_rate < 0:
        raise ValueError("Fire orani negatif olamaz")

    teorik = calculate_theoretical_consumption(process_count, tk)
    fire_miktari = teorik * fire_rate

    return teorik + fire_miktari


def calculate_consumption_breakdown(process_count: int, tk: float, fire_rate: float) -> dict:
    """
    Detayli tuketim dokumu dondurur.

    Args:
        process_count: Planlanan islem adedi
        tk: Tuketim katsayisi
        fire_rate: Fire orani

    Returns:
        dict: Detayli hesaplama sonuclari
    """
    teorik = calculate_theoretical_consumption(process_count, tk)
    fire_miktari = teorik * fire_rate
    net = teorik + fire_miktari

    return {
        "islem_adedi": process_count,
        "tk": tk,
        "fire_orani": fire_rate,
        "fire_orani_yuzde": f"%{fire_rate * 100:.1f}",
        "teorik_tuketim": teorik,
        "fire_miktari": fire_miktari,
        "net_tuketim": net
    }


# =============================================================================
# MALZEME BAZLI HESAPLAMA
# =============================================================================

def calculate_material_need(
    malzeme: SarfMalzeme,
    tetikleyici_adedi: int,
    kanal: Optional[Kanal] = None,
    custom_fire: Optional[float] = None
) -> dict:
    """
    Belirli bir malzeme icin ihtiyac hesaplar.

    Args:
        malzeme: SarfMalzeme nesnesi
        tetikleyici_adedi: Tetikleyici islem adedi (fis, sevkiyat vs.)
        kanal: Operasyon kanali (opsiyonel)
        custom_fire: Ozel fire orani (opsiyonel)

    Returns:
        dict: Malzeme ihtiyac detaylari
    """
    tk = malzeme.get_tk()
    fire = custom_fire if custom_fire is not None else malzeme.get_fire(kanal)

    breakdown = calculate_consumption_breakdown(tetikleyici_adedi, tk, fire)

    # Paket hesabi
    paket_ihtiyaci = None
    paket_bilgi = None
    if malzeme.paket:
        paket_ihtiyaci = malzeme.hesapla_paket_ihtiyaci(breakdown["net_tuketim"])
        paket_bilgi = f"{malzeme.paket.paket_adi} ({malzeme.paket.paket_miktari} {malzeme.paket.paket_birimi})"

    return {
        "malzeme_kod": malzeme.kod,
        "malzeme_ad": malzeme.ad,
        "birim": malzeme.birim,
        "tetikleyici": malzeme.tetikleyici.value,
        "tetikleyici_aciklama": malzeme.tetikleyici_aciklama,
        "birim_tuketim": malzeme.birim_tuketim,
        "birim_tuketim_aciklama": malzeme.birim_tuketim_aciklama,
        "kanal": kanal.value if kanal else "genel",
        "paket_bilgi": paket_bilgi,
        "paket_ihtiyaci": paket_ihtiyaci,
        **breakdown
    }


# =============================================================================
# TOPLU HESAPLAMA
# =============================================================================

def calculate_bulk_needs(
    malzemeler: list[SarfMalzeme],
    tetikleyici_adetleri: Dict[str, int],
    kanal: Optional[Kanal] = None
) -> list[dict]:
    """
    Birden fazla malzeme icin toplu ihtiyac hesaplar.

    Args:
        malzemeler: SarfMalzeme listesi
        tetikleyici_adetleri: Malzeme kodu -> tetikleyici adedi eslesmesi
        kanal: Operasyon kanali

    Returns:
        list: Her malzeme icin hesaplama sonuclari
    """
    sonuclar = []

    for malzeme in malzemeler:
        if malzeme.kod in tetikleyici_adetleri:
            sonuc = calculate_material_need(
                malzeme=malzeme,
                tetikleyici_adedi=tetikleyici_adetleri[malzeme.kod],
                kanal=kanal
            )
            sonuclar.append(sonuc)

    return sonuclar


# =============================================================================
# ORNEK KULLANIM
# =============================================================================

if __name__ == "__main__":
    # Ornek: Temel hesaplama
    print("=" * 60)
    print("TEMEL HESAPLAMA ORNEGI")
    print("=" * 60)

    sevkiyat = 120000
    tk = 1.0
    fire = 0.03

    teorik = calculate_theoretical_consumption(sevkiyat, tk)
    net = calculate_net_consumption(sevkiyat, tk, fire)

    print(f"Sevkiyat Adedi: {sevkiyat:,}")
    print(f"TK: {tk}")
    print(f"Fire Orani: %{fire*100}")
    print(f"Teorik Sarf: {teorik:,.0f}")
    print(f"Net Sarf: {net:,.0f}")

    # Ornek: Tetikleyici bazli malzeme tanimlari
    print("\n" + "=" * 60)
    print("TETIKLEYICI BAZLI MALZEME TANIMLARI")
    print("=" * 60)

    # Rulo kasa kagidi - FIS_ADEDI tetikler
    kasa_kagidi = SarfMalzeme(
        kod="SRF001",
        ad="Rulo Kasa Kagidi 80mm",
        birim="metre",
        tetikleyici=Tetikleyici.FIS_ADEDI,
        tetikleyici_aciklama="Her kesilen fis icin 25cm kagit kullanilir",
        birim_tuketim=0.25,  # 25cm = 0.25 metre
        birim_tuketim_aciklama="1 fis = 25cm = 0.25m",
        paket=PaketBilgisi(
            paket_adi="Rulo",
            paket_miktari=30,  # 1 rulo = 30 metre
            paket_birimi="metre"
        ),
        varsayilan_fire=0.10,
        min_stok=50,
        tedarik_suresi_gun=3
    )

    # Koli bandi - SEVKIYAT tetikler
    koli_bandi = SarfMalzeme(
        kod="SRF002",
        ad="Koli Bandi 45mm",
        birim="adet",
        tetikleyici=Tetikleyici.SEVKIYAT,
        tetikleyici_aciklama="Her sevkiyat kolisi icin bant kullanilir",
        birim_tuketim=1.5,  # 1 koli = 1.5 bant (ust+alt)
        birim_tuketim_aciklama="1 koli = 1.5 bant (ust ve alt bantlama)",
        paket=PaketBilgisi(
            paket_adi="Koli",
            paket_miktari=36,  # 1 koli = 36 adet bant
            paket_birimi="adet"
        ),
        varsayilan_fire=0.05,
        min_stok=100,
        tedarik_suresi_gun=5
    )

    # Kucuk poset - PAKETLEME tetikler
    kucuk_poset = SarfMalzeme(
        kod="SRF003",
        ad="Kucuk Poset 20x30",
        birim="adet",
        tetikleyici=Tetikleyici.PAKETLEME,
        tetikleyici_aciklama="Her paketlenen urun icin 1 poset",
        birim_tuketim=1.0,
        birim_tuketim_aciklama="1 urun = 1 poset",
        paket=PaketBilgisi(
            paket_adi="Paket",
            paket_miktari=1000,  # 1 paket = 1000 adet
            paket_birimi="adet"
        ),
        varsayilan_fire=0.08,
        min_stok=5000
    )

    # Buyuk poset - SEVKIYAT tetikler (online)
    buyuk_poset = SarfMalzeme(
        kod="SRF004",
        ad="Buyuk Poset 40x50",
        birim="adet",
        tetikleyici=Tetikleyici.SIPARIS,
        tetikleyici_aciklama="Online siparislerde dis ambalaj icin",
        birim_tuketim=1.2,  # Bazen cift poset gerekir
        birim_tuketim_aciklama="1 siparis = 1.2 poset (bazen cift)",
        paket=PaketBilgisi(
            paket_adi="Paket",
            paket_miktari=500,
            paket_birimi="adet"
        ),
        varsayilan_fire=0.10
    )

    # Hesaplama ornegi: 10000 fis kesilecek
    print("\n" + "-" * 60)
    print("ORNEK: Kasa Kagidi Hesaplama")
    print("-" * 60)

    fis_adedi = 10000

    sonuc = calculate_material_need(
        malzeme=kasa_kagidi,
        tetikleyici_adedi=fis_adedi
    )

    print(f"Malzeme: {sonuc['malzeme_ad']}")
    print(f"Tetikleyici: {sonuc['tetikleyici']} ({sonuc['tetikleyici_aciklama']})")
    print(f"Birim Tuketim: {sonuc['birim_tuketim']} {sonuc['birim']}/fis")
    print(f"Fis Adedi: {sonuc['islem_adedi']:,}")
    print(f"Fire: {sonuc['fire_orani_yuzde']}")
    print(f"Teorik Tuketim: {sonuc['teorik_tuketim']:,.0f} {sonuc['birim']}")
    print(f"Net Tuketim: {sonuc['net_tuketim']:,.0f} {sonuc['birim']}")
    print(f"Paket Bilgisi: {sonuc['paket_bilgi']}")
    print(f"Gerekli Rulo: {sonuc['paket_ihtiyaci']:.1f} rulo")

    # Toplu hesaplama
    print("\n" + "=" * 60)
    print("TOPLU IHTIYAC HESAPLAMA")
    print("=" * 60)

    malzemeler = [kasa_kagidi, koli_bandi, kucuk_poset, buyuk_poset]
    islemler = {
        "SRF001": 50000,   # 50k fis kesilecek
        "SRF002": 30000,   # 30k sevkiyat
        "SRF003": 80000,   # 80k urun paketlenecek
        "SRF004": 20000    # 20k online siparis
    }

    toplu_sonuc = calculate_bulk_needs(malzemeler, islemler)

    print(f"\n{'Malzeme':<22} {'Tetikleyici':<12} {'Net Tuketim':>12} {'Paket':>10}")
    print("-" * 60)
    for s in toplu_sonuc:
        paket_str = f"{s['paket_ihtiyaci']:.0f}" if s['paket_ihtiyaci'] else "-"
        print(f"{s['malzeme_ad']:<22} {s['tetikleyici']:<12} {s['net_tuketim']:>12,.0f} {paket_str:>10}")
