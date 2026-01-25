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


@dataclass
class SarfMalzeme:
    """Sarf malzeme tanimi"""
    kod: str
    ad: str
    birim: str  # adet, metre, kg vs.
    varsayilan_tk: float = 1.0
    varsayilan_fire: float = 0.0
    kanal_tk: Dict[Kanal, float] = field(default_factory=dict)
    kanal_fire: Dict[Kanal, float] = field(default_factory=dict)
    min_stok: int = 0
    tedarik_suresi_gun: int = 7

    def get_tk(self, kanal: Optional[Kanal] = None) -> float:
        """Kanal bazli veya varsayilan TK dondur"""
        if kanal and kanal in self.kanal_tk:
            return self.kanal_tk[kanal]
        return self.varsayilan_tk

    def get_fire(self, kanal: Optional[Kanal] = None) -> float:
        """Kanal bazli veya varsayilan fire orani dondur"""
        if kanal and kanal in self.kanal_fire:
            return self.kanal_fire[kanal]
        return self.varsayilan_fire


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
    process_count: int,
    kanal: Optional[Kanal] = None,
    custom_tk: Optional[float] = None,
    custom_fire: Optional[float] = None
) -> dict:
    """
    Belirli bir malzeme icin ihtiyac hesaplar.

    Args:
        malzeme: SarfMalzeme nesnesi
        process_count: Planlanan islem adedi
        kanal: Operasyon kanali (opsiyonel)
        custom_tk: Ozel TK degeri (opsiyonel)
        custom_fire: Ozel fire orani (opsiyonel)

    Returns:
        dict: Malzeme ihtiyac detaylari
    """
    tk = custom_tk if custom_tk is not None else malzeme.get_tk(kanal)
    fire = custom_fire if custom_fire is not None else malzeme.get_fire(kanal)

    breakdown = calculate_consumption_breakdown(process_count, tk, fire)

    return {
        "malzeme_kod": malzeme.kod,
        "malzeme_ad": malzeme.ad,
        "birim": malzeme.birim,
        "kanal": kanal.value if kanal else "genel",
        **breakdown
    }


# =============================================================================
# TOPLU HESAPLAMA
# =============================================================================

def calculate_bulk_needs(
    malzemeler: list[SarfMalzeme],
    process_counts: Dict[str, int],
    kanal: Optional[Kanal] = None
) -> list[dict]:
    """
    Birden fazla malzeme icin toplu ihtiyac hesaplar.

    Args:
        malzemeler: SarfMalzeme listesi
        process_counts: Malzeme kodu -> islem adedi eslesmesi
        kanal: Operasyon kanali

    Returns:
        list: Her malzeme icin hesaplama sonuclari
    """
    sonuclar = []

    for malzeme in malzemeler:
        if malzeme.kod in process_counts:
            sonuc = calculate_material_need(
                malzeme=malzeme,
                process_count=process_counts[malzeme.kod],
                kanal=kanal
            )
            sonuclar.append(sonuc)

    return sonuclar


# =============================================================================
# ORNEK KULLANIM
# =============================================================================

if __name__ == "__main__":
    # Ornek: Temel hesaplama
    print("=" * 50)
    print("TEMEL HESAPLAMA ORNEGI")
    print("=" * 50)

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

    # Ornek: Malzeme tanimi
    print("\n" + "=" * 50)
    print("MALZEME BAZLI HESAPLAMA")
    print("=" * 50)

    # Koli bandi tanimi
    koli_bandi = SarfMalzeme(
        kod="SRF001",
        ad="Koli Bandi 45mm",
        birim="adet",
        varsayilan_tk=0.5,  # Her 2 sevkiyatta 1 bant
        varsayilan_fire=0.05,
        kanal_tk={
            Kanal.ONLINE: 0.8,   # Online siparislerde daha fazla
            Kanal.MAGAZA: 0.3    # Magazada daha az
        },
        min_stok=100,
        tedarik_suresi_gun=5
    )

    # Rulo kasa kagidi
    kasa_kagidi = SarfMalzeme(
        kod="SRF002",
        ad="Rulo Kasa Kagidi 80mm",
        birim="metre",
        varsayilan_tk=0.15,  # Her satista 15cm
        varsayilan_fire=0.10,
        min_stok=50,
        tedarik_suresi_gun=3
    )

    # Poset
    kucuk_poset = SarfMalzeme(
        kod="SRF003",
        ad="Kucuk Poset 20x30",
        birim="adet",
        varsayilan_tk=1.2,  # Bazen cift poset
        varsayilan_fire=0.08,
        kanal_tk={
            Kanal.ONLINE: 1.5,
            Kanal.MAGAZA: 1.0
        }
    )

    # Online kanal icin hesaplama
    online_sevkiyat = 50000

    sonuc = calculate_material_need(
        malzeme=koli_bandi,
        process_count=online_sevkiyat,
        kanal=Kanal.ONLINE
    )

    print(f"\nMalzeme: {sonuc['malzeme_ad']}")
    print(f"Kanal: {sonuc['kanal']}")
    print(f"Islem Adedi: {sonuc['islem_adedi']:,}")
    print(f"TK: {sonuc['tk']}")
    print(f"Fire: {sonuc['fire_orani_yuzde']}")
    print(f"Teorik Tuketim: {sonuc['teorik_tuketim']:,.0f} {sonuc['birim']}")
    print(f"Net Tuketim: {sonuc['net_tuketim']:,.0f} {sonuc['birim']}")

    # Toplu hesaplama
    print("\n" + "=" * 50)
    print("TOPLU IHTIYAC HESAPLAMA")
    print("=" * 50)

    malzemeler = [koli_bandi, kasa_kagidi, kucuk_poset]
    islemler = {
        "SRF001": 100000,  # Koli bandi icin 100k sevkiyat
        "SRF002": 80000,   # Kasa kagidi icin 80k satis
        "SRF003": 100000   # Poset icin 100k satis
    }

    toplu_sonuc = calculate_bulk_needs(malzemeler, islemler, Kanal.MAGAZA)

    print(f"\n{'Malzeme':<25} {'Teorik':>12} {'Net':>12} {'Birim':<10}")
    print("-" * 60)
    for s in toplu_sonuc:
        print(f"{s['malzeme_ad']:<25} {s['teorik_tuketim']:>12,.0f} {s['net_tuketim']:>12,.0f} {s['birim']:<10}")
