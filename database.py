"""
Sarf Malzeme Veritabani Modulu
SQLite tabanli kalici veri depolama
"""

import sqlite3
import pandas as pd
from pathlib import Path
from typing import Optional, List, Dict, Any
from datetime import datetime

# Veritabani dosya yolu
DB_PATH = Path(__file__).parent / "sarf_malzeme.db"


def get_connection():
    """Veritabani baglantisi olustur"""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_database():
    """Veritabani tablolarini olustur"""
    conn = get_connection()
    cursor = conn.cursor()

    # Ana Grup tablosu
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ana_grup (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ad TEXT UNIQUE NOT NULL,
            aciklama TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Sub Group tablosu
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sub_grup (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ana_grup_id INTEGER,
            ad TEXT NOT NULL,
            aciklama TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (ana_grup_id) REFERENCES ana_grup(id),
            UNIQUE(ana_grup_id, ad)
        )
    """)

    # Kalite tablosu
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS kalite (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ad TEXT UNIQUE NOT NULL,
            aciklama TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Tetikleyici tablosu
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tetikleyici (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ad TEXT UNIQUE NOT NULL,
            aciklama TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Magaza tablosu
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS magaza (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            magaza_kodu TEXT UNIQUE NOT NULL,
            magaza_adi TEXT,
            sehir TEXT,
            bolge TEXT,
            bolge_muduru TEXT,
            kapasite_adet INTEGER DEFAULT 0,
            m2 REAL DEFAULT 0,
            aktif INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Malzeme tablosu - basit, foreign key yok
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS malzeme (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            malzeme_kodu TEXT UNIQUE NOT NULL,
            barkod TEXT,
            ad TEXT,
            stok_takip INTEGER DEFAULT 1,
            ana_grup TEXT,
            sub_grup TEXT,
            kalite TEXT,
            tetikleyici TEXT,
            birim_tuketim_birim TEXT,
            birim_tuketim_miktar REAL DEFAULT 0,
            fire_orani REAL DEFAULT 0,
            inner_box INTEGER DEFAULT 0,
            koli_ici INTEGER DEFAULT 0,
            toplam_paket_birim_miktar INTEGER DEFAULT 0,
            uretici_kodu TEXT,
            uretici_adi TEXT,
            ortalama_tedarik_suresi REAL DEFAULT 0,
            ortalama_ek_sure REAL DEFAULT 0,
            aciklama TEXT,
            aktif INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Mevcut tabloya yeni kolonlari ekle (varsa hata vermez)
    new_columns = [
        ("uretici_kodu", "TEXT"),
        ("uretici_adi", "TEXT"),
        ("ortalama_tedarik_suresi", "REAL DEFAULT 0"),
        ("ortalama_ek_sure", "REAL DEFAULT 0")
    ]
    for col_name, col_type in new_columns:
        try:
            cursor.execute(f"ALTER TABLE malzeme ADD COLUMN {col_name} {col_type}")
        except:
            pass  # Kolon zaten var

    # Magaza Performans tablosu
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS magaza_performans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            magaza_kodu TEXT NOT NULL,
            magaza_adi TEXT,
            yil INTEGER NOT NULL,
            ay INTEGER NOT NULL,
            fis INTEGER DEFAULT 0,
            satis_adet INTEGER DEFAULT 0,
            fis_basina_adet REAL DEFAULT 0,
            ciro REAL DEFAULT 0,
            birim_fiyat REAL DEFAULT 0,
            iade REAL DEFAULT 0,
            oms REAL DEFAULT 0,
            stok REAL DEFAULT 0,
            kar REAL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(magaza_kodu, yil, ay)
        )
    """)

    # Magaza Malzeme Stok tablosu
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS magaza_malzeme_stok (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            magaza_kodu TEXT NOT NULL,
            magaza_adi TEXT,
            malzeme_kodu TEXT NOT NULL,
            yil INTEGER NOT NULL,
            ay INTEGER NOT NULL,
            stok REAL DEFAULT 0,
            satis REAL DEFAULT 0,
            yol REAL DEFAULT 0,
            stok_satis_oran REAL DEFAULT 0,
            ciro REAL DEFAULT 0,
            smm REAL DEFAULT 0,
            brutkar REAL DEFAULT 0,
            stok_tutar REAL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(magaza_kodu, malzeme_kodu, yil, ay)
        )
    """)

    conn.commit()
    conn.close()

    # Varsayilan verileri ekle
    _insert_default_data()


def _insert_default_data():
    """Varsayilan kategorileri ekle"""
    conn = get_connection()
    cursor = conn.cursor()

    # Varsayilan Ana Gruplar
    ana_gruplar = [
        ("Ticari", "Ticari malzemeler"),
        ("Ticari olmayan", "Ticari olmayan malzemeler")
    ]

    for ad, aciklama in ana_gruplar:
        try:
            cursor.execute("INSERT OR IGNORE INTO ana_grup (ad, aciklama) VALUES (?, ?)", (ad, aciklama))
        except:
            pass

    # Varsayilan Kaliteler
    kaliteler = [
        ("Bez", "Bez malzeme"),
        ("Kraft", "Kraft malzeme"),
        ("Plastik", "Plastik malzeme")
    ]

    for ad, aciklama in kaliteler:
        try:
            cursor.execute("INSERT OR IGNORE INTO kalite (ad, aciklama) VALUES (?, ?)", (ad, aciklama))
        except:
            pass

    # Varsayilan Tetikleyiciler
    tetikleyiciler = [
        ("Musteri girisi", "Musteri giris sayisi"),
        ("Fis sayisi", "Kesilen fis sayisi"),
        ("Satis adeti", "Satilan urun adedi"),
        ("Mal kabul", "Mal kabul islem sayisi"),
        ("OMS paket sayisi", "OMS paket sayisi"),
        ("OMS satis adet", "OMS satis adedi"),
        ("Stok", "Stok bazli tuketim")
    ]

    for ad, aciklama in tetikleyiciler:
        try:
            cursor.execute("INSERT OR IGNORE INTO tetikleyici (ad, aciklama) VALUES (?, ?)", (ad, aciklama))
        except:
            pass

    conn.commit()
    conn.close()


# =============================================================================
# ANA GRUP ISLEMLERI
# =============================================================================

def get_ana_gruplar() -> List[Dict]:
    """Tum ana gruplari getir"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM ana_grup ORDER BY ad")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def add_ana_grup(ad: str, aciklama: str = "") -> int:
    """Yeni ana grup ekle"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO ana_grup (ad, aciklama) VALUES (?, ?)", (ad, aciklama))
    conn.commit()
    last_id = cursor.lastrowid
    conn.close()
    return last_id


def delete_ana_grup(id: int) -> bool:
    """Ana grup sil"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM ana_grup WHERE id = ?", (id,))
    conn.commit()
    affected = cursor.rowcount
    conn.close()
    return affected > 0


# =============================================================================
# SUB GRUP ISLEMLERI
# =============================================================================

def get_sub_gruplar(ana_grup_id: Optional[int] = None) -> List[Dict]:
    """Sub gruplari getir"""
    conn = get_connection()
    cursor = conn.cursor()

    if ana_grup_id:
        cursor.execute("""
            SELECT sg.*, ag.ad as ana_grup_ad
            FROM sub_grup sg
            LEFT JOIN ana_grup ag ON sg.ana_grup_id = ag.id
            WHERE sg.ana_grup_id = ?
            ORDER BY sg.ad
        """, (ana_grup_id,))
    else:
        cursor.execute("""
            SELECT sg.*, ag.ad as ana_grup_ad
            FROM sub_grup sg
            LEFT JOIN ana_grup ag ON sg.ana_grup_id = ag.id
            ORDER BY ag.ad, sg.ad
        """)

    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def add_sub_grup(ana_grup_id: int, ad: str, aciklama: str = "") -> int:
    """Yeni sub grup ekle"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO sub_grup (ana_grup_id, ad, aciklama) VALUES (?, ?, ?)",
                   (ana_grup_id, ad, aciklama))
    conn.commit()
    last_id = cursor.lastrowid
    conn.close()
    return last_id


def delete_sub_grup(id: int) -> bool:
    """Sub grup sil"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM sub_grup WHERE id = ?", (id,))
    conn.commit()
    affected = cursor.rowcount
    conn.close()
    return affected > 0


# =============================================================================
# KALITE ISLEMLERI
# =============================================================================

def get_kaliteler() -> List[Dict]:
    """Tum kaliteleri getir"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM kalite ORDER BY ad")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def add_kalite(ad: str, aciklama: str = "") -> int:
    """Yeni kalite ekle"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO kalite (ad, aciklama) VALUES (?, ?)", (ad, aciklama))
    conn.commit()
    last_id = cursor.lastrowid
    conn.close()
    return last_id


# =============================================================================
# TETIKLEYICI ISLEMLERI
# =============================================================================

def get_tetikleyiciler() -> List[Dict]:
    """Tum tetikleyicileri getir"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tetikleyici ORDER BY ad")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def add_tetikleyici(ad: str, aciklama: str = "") -> int:
    """Yeni tetikleyici ekle"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO tetikleyici (ad, aciklama) VALUES (?, ?)", (ad, aciklama))
    conn.commit()
    last_id = cursor.lastrowid
    conn.close()
    return last_id


# =============================================================================
# MALZEME ISLEMLERI
# =============================================================================

def check_unique_malzeme(malzeme_kodu: str, barkod: str, ad: str, exclude_id: Optional[int] = None) -> Dict[str, str]:
    """Benzersizlik kontrolu yap, hatalari dondur"""
    errors = {}
    conn = get_connection()
    cursor = conn.cursor()

    # Malzeme kodu kontrolu
    if exclude_id:
        cursor.execute("SELECT id FROM malzeme WHERE malzeme_kodu = ? AND id != ? AND aktif = 1", (malzeme_kodu, exclude_id))
    else:
        cursor.execute("SELECT id FROM malzeme WHERE malzeme_kodu = ? AND aktif = 1", (malzeme_kodu,))
    if cursor.fetchone():
        errors["malzeme_kodu"] = f"'{malzeme_kodu}' kodu zaten mevcut"

    # Barkod kontrolu
    if barkod:
        if exclude_id:
            cursor.execute("SELECT id FROM malzeme WHERE barkod = ? AND id != ? AND aktif = 1", (barkod, exclude_id))
        else:
            cursor.execute("SELECT id FROM malzeme WHERE barkod = ? AND aktif = 1", (barkod,))
        if cursor.fetchone():
            errors["barkod"] = f"'{barkod}' barkodu zaten mevcut"

    # Ad kontrolu
    if exclude_id:
        cursor.execute("SELECT id FROM malzeme WHERE ad = ? AND id != ? AND aktif = 1", (ad, exclude_id))
    else:
        cursor.execute("SELECT id FROM malzeme WHERE ad = ? AND aktif = 1", (ad,))
    if cursor.fetchone():
        errors["ad"] = f"'{ad}' adi zaten mevcut"

    conn.close()
    return errors


def validate_malzeme_row(row: Dict, ana_gruplar: List[str], kaliteler: List[str],
                         tetikleyiciler: List[str], birimler: List[str]) -> List[str]:
    """Malzeme satirini dogrula, hata listesi dondur"""
    errors = []

    # Zorunlu alanlar
    if not row.get("malzeme_kodu") or str(row.get("malzeme_kodu", "")).strip() == "":
        errors.append("Malzeme Kodu bos olamaz")
    if not row.get("barkod") or str(row.get("barkod", "")).strip() == "":
        errors.append("Barkod bos olamaz")
    if not row.get("ad") or str(row.get("ad", "")).strip() == "":
        errors.append("Malzeme Adi bos olamaz")
    if not row.get("ana_grup") or row.get("ana_grup") not in ana_gruplar:
        errors.append("Gecerli bir Ana Grup seciniz")
    if not row.get("kalite") or row.get("kalite") not in kaliteler:
        errors.append("Gecerli bir Kalite seciniz")
    if not row.get("tetikleyici") or row.get("tetikleyici") not in tetikleyiciler:
        errors.append("Gecerli bir Tetikleyici seciniz")
    if not row.get("birim_tuketim_birim") or row.get("birim_tuketim_birim") not in birimler:
        errors.append("Gecerli bir Birim seciniz")

    # Sayisal alanlar
    try:
        miktar = float(row.get("birim_tuketim_miktar", 0))
        if miktar <= 0:
            errors.append("Birim Tuketim Miktar 0'dan buyuk olmali")
    except:
        errors.append("Birim Tuketim Miktar gecerli bir sayi olmali")

    try:
        fire = float(row.get("fire_orani", 0))
        if fire < 0 or fire > 100:
            errors.append("Fire Orani 0-100 arasinda olmali")
    except:
        errors.append("Fire Orani gecerli bir sayi olmali")

    for field in ["inner_box", "koli_ici", "toplam_paket_birim_miktar"]:
        try:
            val = int(row.get(field, 0))
            if val < 1:
                errors.append(f"{field} en az 1 olmali")
        except:
            errors.append(f"{field} gecerli bir tam sayi olmali")

    return errors


def save_malzemeler_bulk(df: pd.DataFrame) -> Dict[str, Any]:
    """DataFrame'den toplu malzeme kaydet - kontrol yok, serbest giris"""
    result = {"basarili": 0, "guncellenen": 0, "hatali": 0, "hatalar": []}

    for idx, row in df.iterrows():
        row_dict = row.to_dict()
        satir_no = idx + 1

        try:
            malzeme_kodu = str(row_dict.get("malzeme_kodu", "")).strip()
            barkod = str(row_dict.get("barkod", "")).strip()
            ad = str(row_dict.get("ad", "")).strip()

            # Bos satiri atla
            if not malzeme_kodu and not barkod and not ad:
                continue

            # Sadece malzeme kodu zorunlu
            if not malzeme_kodu:
                result["hatalar"].append(f"Satir {satir_no}: Malzeme Kodu bos")
                result["hatali"] += 1
                continue

            # Diger alanlar
            ana_grup = str(row_dict.get("ana_grup", "")).strip()
            sub_grup = str(row_dict.get("sub_grup", "")).strip()
            kalite = str(row_dict.get("kalite", "")).strip()
            tetikleyici = str(row_dict.get("tetikleyici", "")).strip()
            birim = str(row_dict.get("birim_tuketim_birim", "")).strip()

            # Stok takip
            stok_takip_val = str(row_dict.get("stok_takip", "Var")).strip()
            stok_takip = stok_takip_val.lower() in ["var", "1", "true", "evet"]

            # Sayisal degerler
            try:
                birim_miktar = float(row_dict.get("birim_tuketim_miktar", 0) or 0)
                fire_orani = float(row_dict.get("fire_orani", 0) or 0)
                inner_box = int(float(row_dict.get("inner_box", 0) or 0))
                koli_ici = int(float(row_dict.get("koli_ici", 0) or 0))
                toplam_paket = int(float(row_dict.get("toplam_paket_birim_miktar", 0) or 0))
                ortalama_tedarik_suresi = float(row_dict.get("ortalama_tedarik_suresi", 0) or 0)
                ortalama_ek_sure = float(row_dict.get("ortalama_ek_sure", 0) or 0)
            except Exception as e:
                result["hatalar"].append(f"Satir {satir_no}: Sayisal deger hatasi - {str(e)}")
                result["hatali"] += 1
                continue

            # Uretici bilgileri
            uretici_kodu = str(row_dict.get("uretici_kodu", "")).strip()
            uretici_adi = str(row_dict.get("uretici_adi", "")).strip()

            # Mevcut malzeme var mi?
            existing = get_malzeme_by_kod(malzeme_kodu)

            if existing:
                # Benzersizlik kontrolu (guncelleme icin)
                unique_errors = check_unique_malzeme(malzeme_kodu, barkod, ad, existing["id"])
                if unique_errors:
                    result["hatalar"].append(f"Satir {satir_no}: " + ", ".join(unique_errors.values()))
                    result["hatali"] += 1
                    continue

                # Guncelle
                update_malzeme(
                    existing["id"],
                    barkod=barkod,
                    ad=ad,
                    stok_takip=1 if stok_takip else 0,
                    ana_grup=ana_grup,
                    sub_grup=sub_grup,
                    kalite=kalite,
                    tetikleyici=tetikleyici,
                    birim_tuketim_birim=birim,
                    birim_tuketim_miktar=birim_miktar,
                    fire_orani=fire_orani,
                    inner_box=inner_box,
                    koli_ici=koli_ici,
                    toplam_paket_birim_miktar=toplam_paket,
                    uretici_kodu=uretici_kodu,
                    uretici_adi=uretici_adi,
                    ortalama_tedarik_suresi=ortalama_tedarik_suresi,
                    ortalama_ek_sure=ortalama_ek_sure
                )
                result["guncellenen"] += 1
            else:
                # Benzersizlik kontrolu (yeni kayit)
                unique_errors = check_unique_malzeme(malzeme_kodu, barkod, ad)
                if unique_errors:
                    result["hatalar"].append(f"Satir {satir_no}: " + ", ".join(unique_errors.values()))
                    result["hatali"] += 1
                    continue

                # Yeni ekle
                add_malzeme_simple(
                    malzeme_kodu=malzeme_kodu,
                    barkod=barkod,
                    ad=ad,
                    stok_takip=stok_takip,
                    ana_grup=ana_grup,
                    sub_grup=sub_grup,
                    kalite=kalite,
                    tetikleyici=tetikleyici,
                    birim_tuketim_birim=birim,
                    birim_tuketim_miktar=birim_miktar,
                    fire_orani=fire_orani,
                    inner_box=inner_box,
                    koli_ici=koli_ici,
                    toplam_paket_birim_miktar=toplam_paket,
                    uretici_kodu=uretici_kodu,
                    uretici_adi=uretici_adi,
                    ortalama_tedarik_suresi=ortalama_tedarik_suresi,
                    ortalama_ek_sure=ortalama_ek_sure
                )
                result["basarili"] += 1

        except Exception as e:
            result["hatalar"].append(f"Satir {satir_no}: {str(e)}")
            result["hatali"] += 1

    return result


def get_malzemeler(aktif_only: bool = True) -> pd.DataFrame:
    """Tum malzemeleri DataFrame olarak getir"""
    conn = get_connection()

    query = """
        SELECT
            id,
            malzeme_kodu,
            barkod,
            ad,
            CASE WHEN stok_takip = 1 THEN 'Var' ELSE 'Yok' END as stok_takip,
            ana_grup,
            sub_grup,
            kalite,
            tetikleyici,
            birim_tuketim_birim,
            birim_tuketim_miktar,
            fire_orani,
            inner_box,
            koli_ici,
            toplam_paket_birim_miktar,
            uretici_kodu,
            uretici_adi,
            ortalama_tedarik_suresi,
            ortalama_ek_sure,
            aciklama,
            aktif,
            created_at,
            updated_at
        FROM malzeme
    """

    if aktif_only:
        query += " WHERE aktif = 1"

    query += " ORDER BY malzeme_kodu"

    df = pd.read_sql_query(query, conn)
    conn.close()
    return df


def add_malzeme_simple(
    malzeme_kodu: str,
    barkod: str = "",
    ad: str = "",
    stok_takip: bool = True,
    ana_grup: str = "",
    sub_grup: str = "",
    kalite: str = "",
    tetikleyici: str = "",
    birim_tuketim_birim: str = "",
    birim_tuketim_miktar: float = 0,
    fire_orani: float = 0,
    inner_box: int = 0,
    koli_ici: int = 0,
    toplam_paket_birim_miktar: int = 0,
    uretici_kodu: str = "",
    uretici_adi: str = "",
    ortalama_tedarik_suresi: float = 0,
    ortalama_ek_sure: float = 0,
    aciklama: str = ""
) -> int:
    """Yeni malzeme ekle - basit, foreign key yok"""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO malzeme (
            malzeme_kodu, barkod, ad, stok_takip, ana_grup, sub_grup,
            kalite, tetikleyici, birim_tuketim_birim, birim_tuketim_miktar,
            fire_orani, inner_box, koli_ici, toplam_paket_birim_miktar,
            uretici_kodu, uretici_adi, ortalama_tedarik_suresi, ortalama_ek_sure, aciklama
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        malzeme_kodu, barkod, ad, 1 if stok_takip else 0, ana_grup, sub_grup,
        kalite, tetikleyici, birim_tuketim_birim, birim_tuketim_miktar,
        fire_orani, inner_box, koli_ici, toplam_paket_birim_miktar,
        uretici_kodu, uretici_adi, ortalama_tedarik_suresi, ortalama_ek_sure, aciklama
    ))

    conn.commit()
    last_id = cursor.lastrowid
    conn.close()
    return last_id


def get_malzeme_by_id(id: int) -> Optional[Dict]:
    """ID ile malzeme getir"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM malzeme WHERE id = ?", (id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def get_malzeme_by_kod(malzeme_kodu: str) -> Optional[Dict]:
    """Malzeme kodu ile getir"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM malzeme WHERE malzeme_kodu = ?", (malzeme_kodu,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def add_malzeme(
    malzeme_kodu: str,
    ad: str,
    barkod: str = "",
    stok_takip: bool = True,
    ana_grup_id: Optional[int] = None,
    sub_grup_id: Optional[int] = None,
    kalite_id: Optional[int] = None,
    tetikleyici_id: Optional[int] = None,
    birim_tuketim_birim: str = "adet",
    birim_tuketim_miktar: float = 1.0,
    fire_orani: float = 0.0,
    inner_box: int = 1,
    koli_ici: int = 1,
    toplam_paket_birim_miktar: int = 1,
    aciklama: str = ""
) -> int:
    """Yeni malzeme ekle"""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO malzeme (
            malzeme_kodu, barkod, ad, stok_takip, ana_grup_id, sub_grup_id,
            kalite_id, tetikleyici_id, birim_tuketim_birim, birim_tuketim_miktar,
            fire_orani, inner_box, koli_ici, toplam_paket_birim_miktar, aciklama
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        malzeme_kodu, barkod, ad, 1 if stok_takip else 0, ana_grup_id, sub_grup_id,
        kalite_id, tetikleyici_id, birim_tuketim_birim, birim_tuketim_miktar,
        fire_orani, inner_box, koli_ici, toplam_paket_birim_miktar, aciklama
    ))

    conn.commit()
    last_id = cursor.lastrowid
    conn.close()
    return last_id


def update_malzeme(id: int, **kwargs) -> bool:
    """Malzeme guncelle"""
    if not kwargs:
        return False

    conn = get_connection()
    cursor = conn.cursor()

    # Guncelleme sorgusu olustur
    set_parts = []
    values = []

    for key, value in kwargs.items():
        set_parts.append(f"{key} = ?")
        values.append(value)

    set_parts.append("updated_at = CURRENT_TIMESTAMP")
    values.append(id)

    query = f"UPDATE malzeme SET {', '.join(set_parts)} WHERE id = ?"

    cursor.execute(query, values)
    conn.commit()
    affected = cursor.rowcount
    conn.close()
    return affected > 0


def delete_malzeme(id: int, hard_delete: bool = False) -> bool:
    """Malzeme sil (soft delete varsayilan)"""
    conn = get_connection()
    cursor = conn.cursor()

    if hard_delete:
        cursor.execute("DELETE FROM malzeme WHERE id = ?", (id,))
    else:
        cursor.execute("UPDATE malzeme SET aktif = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (id,))

    conn.commit()
    affected = cursor.rowcount
    conn.close()
    return affected > 0


# =============================================================================
# CSV IMPORT/EXPORT
# =============================================================================

def export_malzemeler_to_csv(filepath: str) -> bool:
    """Malzemeleri CSV'ye aktar"""
    try:
        df = get_malzemeler(aktif_only=False)
        df.to_csv(filepath, index=False, encoding='utf-8-sig')
        return True
    except Exception as e:
        print(f"Export hatasi: {e}")
        return False


def import_malzemeler_from_csv(filepath: str) -> Dict[str, Any]:
    """CSV'den malzeme aktar"""
    result = {"basarili": 0, "hatali": 0, "hatalar": []}

    try:
        df = pd.read_csv(filepath, encoding='utf-8-sig')
    except:
        try:
            df = pd.read_csv(filepath, encoding='utf-8')
        except Exception as e:
            result["hatalar"].append(f"Dosya okuma hatasi: {e}")
            return result

    conn = get_connection()
    cursor = conn.cursor()

    # Mevcut kategorileri al (ad -> id mapping)
    ana_gruplar = {g["ad"]: g["id"] for g in get_ana_gruplar()}
    kaliteler = {k["ad"]: k["id"] for k in get_kaliteler()}
    tetikleyiciler = {t["ad"]: t["id"] for t in get_tetikleyiciler()}

    for idx, row in df.iterrows():
        try:
            malzeme_kodu = str(row.get("malzeme_kodu", "")).strip()
            if not malzeme_kodu:
                result["hatalar"].append(f"Satir {idx+2}: Malzeme kodu bos")
                result["hatali"] += 1
                continue

            # Ana grup ID bul veya olustur
            ana_grup_ad = str(row.get("ana_grup", "")).strip()
            ana_grup_id = None
            if ana_grup_ad:
                if ana_grup_ad not in ana_gruplar:
                    ana_grup_id = add_ana_grup(ana_grup_ad)
                    ana_gruplar[ana_grup_ad] = ana_grup_id
                else:
                    ana_grup_id = ana_gruplar[ana_grup_ad]

            # Kalite ID bul veya olustur
            kalite_ad = str(row.get("kalite", "")).strip()
            kalite_id = None
            if kalite_ad:
                if kalite_ad not in kaliteler:
                    kalite_id = add_kalite(kalite_ad)
                    kaliteler[kalite_ad] = kalite_id
                else:
                    kalite_id = kaliteler[kalite_ad]

            # Tetikleyici ID bul
            tetikleyici_ad = str(row.get("tetikleyici", "")).strip()
            tetikleyici_id = tetikleyiciler.get(tetikleyici_ad)

            # Stok takip
            stok_takip_val = str(row.get("stok_takip", "Var")).strip().lower()
            stok_takip = 1 if stok_takip_val in ["var", "1", "true", "evet"] else 0

            # Mevcut malzeme var mi kontrol et
            existing = get_malzeme_by_kod(malzeme_kodu)

            if existing:
                # Guncelle
                update_malzeme(
                    existing["id"],
                    barkod=str(row.get("barkod", "")).strip(),
                    ad=str(row.get("ad", "")).strip(),
                    stok_takip=stok_takip,
                    ana_grup_id=ana_grup_id,
                    kalite_id=kalite_id,
                    tetikleyici_id=tetikleyici_id,
                    birim_tuketim_birim=str(row.get("birim_tuketim_birim", "adet")).strip(),
                    birim_tuketim_miktar=float(row.get("birim_tuketim_miktar", 1.0)),
                    fire_orani=float(row.get("fire_orani", 0.0)),
                    inner_box=int(row.get("inner_box", 1)),
                    koli_ici=int(row.get("koli_ici", 1)),
                    toplam_paket_birim_miktar=int(row.get("toplam_paket_birim_miktar", 1))
                )
            else:
                # Yeni ekle
                add_malzeme(
                    malzeme_kodu=malzeme_kodu,
                    barkod=str(row.get("barkod", "")).strip(),
                    ad=str(row.get("ad", "")).strip(),
                    stok_takip=stok_takip == 1,
                    ana_grup_id=ana_grup_id,
                    kalite_id=kalite_id,
                    tetikleyici_id=tetikleyici_id,
                    birim_tuketim_birim=str(row.get("birim_tuketim_birim", "adet")).strip(),
                    birim_tuketim_miktar=float(row.get("birim_tuketim_miktar", 1.0)),
                    fire_orani=float(row.get("fire_orani", 0.0)),
                    inner_box=int(row.get("inner_box", 1)),
                    koli_ici=int(row.get("koli_ici", 1)),
                    toplam_paket_birim_miktar=int(row.get("toplam_paket_birim_miktar", 1))
                )

            result["basarili"] += 1

        except Exception as e:
            result["hatalar"].append(f"Satir {idx+2}: {str(e)}")
            result["hatali"] += 1

    conn.close()
    return result


def import_gruplar_from_csv(filepath: str, grup_type: str = "ana_grup") -> Dict[str, Any]:
    """CSV'den grup aktar (ana_grup veya sub_grup)"""
    result = {"basarili": 0, "hatali": 0, "hatalar": []}

    try:
        df = pd.read_csv(filepath, encoding='utf-8-sig')
    except:
        try:
            df = pd.read_csv(filepath, encoding='utf-8')
        except Exception as e:
            result["hatalar"].append(f"Dosya okuma hatasi: {e}")
            return result

    for idx, row in df.iterrows():
        try:
            ad = str(row.get("ad", "")).strip()
            if not ad:
                continue

            aciklama = str(row.get("aciklama", "")).strip()

            if grup_type == "ana_grup":
                add_ana_grup(ad, aciklama)
            elif grup_type == "kalite":
                add_kalite(ad, aciklama)
            elif grup_type == "tetikleyici":
                add_tetikleyici(ad, aciklama)

            result["basarili"] += 1

        except Exception as e:
            result["hatalar"].append(f"Satir {idx+2}: {str(e)}")
            result["hatali"] += 1

    return result


# =============================================================================
# MAGAZA ISLEMLERI
# =============================================================================

def get_magazalar(aktif_only: bool = True) -> pd.DataFrame:
    """Tum magazalari DataFrame olarak getir"""
    conn = get_connection()

    query = """
        SELECT
            id,
            magaza_kodu,
            magaza_adi,
            sehir,
            bolge,
            bolge_muduru,
            kapasite_adet,
            m2,
            aktif,
            created_at,
            updated_at
        FROM magaza
    """

    if aktif_only:
        query += " WHERE aktif = 1"

    query += " ORDER BY magaza_kodu"

    df = pd.read_sql_query(query, conn)
    conn.close()
    return df


def get_magaza_by_kod(magaza_kodu: str) -> Optional[Dict]:
    """Magaza kodu ile getir"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM magaza WHERE magaza_kodu = ?", (magaza_kodu,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def add_magaza(
    magaza_kodu: str,
    magaza_adi: str = "",
    sehir: str = "",
    bolge: str = "",
    bolge_muduru: str = "",
    kapasite_adet: int = 0,
    m2: float = 0
) -> int:
    """Yeni magaza ekle"""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO magaza (
            magaza_kodu, magaza_adi, sehir, bolge, bolge_muduru, kapasite_adet, m2
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (magaza_kodu, magaza_adi, sehir, bolge, bolge_muduru, kapasite_adet, m2))

    conn.commit()
    last_id = cursor.lastrowid
    conn.close()
    return last_id


def update_magaza(id: int, **kwargs) -> bool:
    """Magaza guncelle"""
    if not kwargs:
        return False

    conn = get_connection()
    cursor = conn.cursor()

    set_parts = []
    values = []

    for key, value in kwargs.items():
        set_parts.append(f"{key} = ?")
        values.append(value)

    set_parts.append("updated_at = CURRENT_TIMESTAMP")
    values.append(id)

    query = f"UPDATE magaza SET {', '.join(set_parts)} WHERE id = ?"

    cursor.execute(query, values)
    conn.commit()
    affected = cursor.rowcount
    conn.close()
    return affected > 0


def delete_magaza(id: int) -> bool:
    """Magaza sil (soft delete)"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE magaza SET aktif = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (id,))
    conn.commit()
    affected = cursor.rowcount
    conn.close()
    return affected > 0


def check_unique_magaza(magaza_kodu: str, exclude_id: Optional[int] = None) -> Dict[str, str]:
    """Magaza benzersizlik kontrolu"""
    errors = {}
    conn = get_connection()
    cursor = conn.cursor()

    if exclude_id:
        cursor.execute("SELECT id FROM magaza WHERE magaza_kodu = ? AND id != ? AND aktif = 1", (magaza_kodu, exclude_id))
    else:
        cursor.execute("SELECT id FROM magaza WHERE magaza_kodu = ? AND aktif = 1", (magaza_kodu,))

    if cursor.fetchone():
        errors["magaza_kodu"] = f"'{magaza_kodu}' kodu zaten mevcut"

    conn.close()
    return errors


def save_magazalar_bulk(df: pd.DataFrame) -> Dict[str, Any]:
    """DataFrame'den toplu magaza kaydet"""
    result = {"basarili": 0, "guncellenen": 0, "hatali": 0, "hatalar": []}

    for idx, row in df.iterrows():
        row_dict = row.to_dict()
        satir_no = idx + 1

        try:
            magaza_kodu = str(row_dict.get("magaza_kodu", "")).strip()

            # Bos satiri atla
            if not magaza_kodu:
                continue

            magaza_adi = str(row_dict.get("magaza_adi", "")).strip()
            sehir = str(row_dict.get("sehir", "")).strip()
            bolge = str(row_dict.get("bolge", "")).strip()
            bolge_muduru = str(row_dict.get("bolge_muduru", "")).strip()

            try:
                kapasite_adet = int(float(row_dict.get("kapasite_adet", 0) or 0))
                m2 = float(row_dict.get("m2", 0) or 0)
            except:
                kapasite_adet = 0
                m2 = 0

            existing = get_magaza_by_kod(magaza_kodu)

            if existing:
                update_magaza(
                    existing["id"],
                    magaza_adi=magaza_adi,
                    sehir=sehir,
                    bolge=bolge,
                    bolge_muduru=bolge_muduru,
                    kapasite_adet=kapasite_adet,
                    m2=m2
                )
                result["guncellenen"] += 1
            else:
                add_magaza(
                    magaza_kodu=magaza_kodu,
                    magaza_adi=magaza_adi,
                    sehir=sehir,
                    bolge=bolge,
                    bolge_muduru=bolge_muduru,
                    kapasite_adet=kapasite_adet,
                    m2=m2
                )
                result["basarili"] += 1

        except Exception as e:
            result["hatalar"].append(f"Satir {satir_no}: {str(e)}")
            result["hatali"] += 1

    return result


# =============================================================================
# MAGAZA PERFORMANS ISLEMLERI
# =============================================================================

def get_magaza_performans(yil: Optional[int] = None, ay: Optional[int] = None) -> pd.DataFrame:
    """Magaza performans verilerini getir"""
    conn = get_connection()

    query = """
        SELECT
            id,
            magaza_kodu,
            magaza_adi,
            yil,
            ay,
            fis,
            satis_adet,
            fis_basina_adet,
            ciro,
            birim_fiyat,
            iade,
            oms,
            stok,
            kar,
            created_at,
            updated_at
        FROM magaza_performans
        WHERE 1=1
    """

    params = []
    if yil:
        query += " AND yil = ?"
        params.append(yil)
    if ay:
        query += " AND ay = ?"
        params.append(ay)

    query += " ORDER BY yil DESC, ay DESC, magaza_kodu"

    df = pd.read_sql_query(query, conn, params=params)
    conn.close()
    return df


def get_performans_by_magaza_yil_ay(magaza_kodu: str, yil: int, ay: int) -> Optional[Dict]:
    """Belirli magaza, yil ve ay icin performans getir"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM magaza_performans WHERE magaza_kodu = ? AND yil = ? AND ay = ?",
        (magaza_kodu, yil, ay)
    )
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def add_magaza_performans(
    magaza_kodu: str,
    magaza_adi: str,
    yil: int,
    ay: int,
    fis: int = 0,
    satis_adet: int = 0,
    fis_basina_adet: float = 0,
    ciro: float = 0,
    birim_fiyat: float = 0,
    iade: float = 0,
    oms: float = 0,
    stok: float = 0,
    kar: float = 0
) -> int:
    """Yeni performans kaydi ekle"""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO magaza_performans (
            magaza_kodu, magaza_adi, yil, ay, fis, satis_adet, fis_basina_adet,
            ciro, birim_fiyat, iade, oms, stok, kar
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        magaza_kodu, magaza_adi, yil, ay, fis, satis_adet, fis_basina_adet,
        ciro, birim_fiyat, iade, oms, stok, kar
    ))

    conn.commit()
    last_id = cursor.lastrowid
    conn.close()
    return last_id


def update_magaza_performans(id: int, **kwargs) -> bool:
    """Performans guncelle"""
    if not kwargs:
        return False

    conn = get_connection()
    cursor = conn.cursor()

    set_parts = []
    values = []

    for key, value in kwargs.items():
        set_parts.append(f"{key} = ?")
        values.append(value)

    set_parts.append("updated_at = CURRENT_TIMESTAMP")
    values.append(id)

    query = f"UPDATE magaza_performans SET {', '.join(set_parts)} WHERE id = ?"

    cursor.execute(query, values)
    conn.commit()
    affected = cursor.rowcount
    conn.close()
    return affected > 0


def delete_magaza_performans(id: int) -> bool:
    """Performans kaydi sil"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM magaza_performans WHERE id = ?", (id,))
    conn.commit()
    affected = cursor.rowcount
    conn.close()
    return affected > 0


def save_performans_bulk(df: pd.DataFrame) -> Dict[str, Any]:
    """DataFrame'den toplu performans kaydet"""
    result = {"basarili": 0, "guncellenen": 0, "hatali": 0, "hatalar": []}

    for idx, row in df.iterrows():
        row_dict = row.to_dict()
        satir_no = idx + 1

        try:
            magaza_kodu = str(row_dict.get("magaza_kodu", "")).strip()

            # Bos satiri atla
            if not magaza_kodu:
                continue

            magaza_adi = str(row_dict.get("magaza_adi", "")).strip()

            try:
                yil = int(float(row_dict.get("yil", 0) or 0))
                ay = int(float(row_dict.get("ay", 0) or 0))
            except:
                result["hatalar"].append(f"Satir {satir_no}: Yil/Ay gecersiz")
                result["hatali"] += 1
                continue

            if yil < 2000 or yil > 2100 or ay < 1 or ay > 12:
                result["hatalar"].append(f"Satir {satir_no}: Yil/Ay aralik disi")
                result["hatali"] += 1
                continue

            try:
                fis = int(float(row_dict.get("fis", 0) or 0))
                satis_adet = int(float(row_dict.get("satis_adet", 0) or 0))
                fis_basina_adet = float(row_dict.get("fis_basina_adet", 0) or 0)
                ciro = float(row_dict.get("ciro", 0) or 0)
                birim_fiyat = float(row_dict.get("birim_fiyat", 0) or 0)
                iade = float(row_dict.get("iade", 0) or 0)
                oms = float(row_dict.get("oms", 0) or 0)
                stok = float(row_dict.get("stok", 0) or 0)
                kar = float(row_dict.get("kar", 0) or 0)
            except Exception as e:
                result["hatalar"].append(f"Satir {satir_no}: Sayisal deger hatasi - {str(e)}")
                result["hatali"] += 1
                continue

            # Mevcut kayit var mi?
            existing = get_performans_by_magaza_yil_ay(magaza_kodu, yil, ay)

            if existing:
                update_magaza_performans(
                    existing["id"],
                    magaza_adi=magaza_adi,
                    fis=fis,
                    satis_adet=satis_adet,
                    fis_basina_adet=fis_basina_adet,
                    ciro=ciro,
                    birim_fiyat=birim_fiyat,
                    iade=iade,
                    oms=oms,
                    stok=stok,
                    kar=kar
                )
                result["guncellenen"] += 1
            else:
                add_magaza_performans(
                    magaza_kodu=magaza_kodu,
                    magaza_adi=magaza_adi,
                    yil=yil,
                    ay=ay,
                    fis=fis,
                    satis_adet=satis_adet,
                    fis_basina_adet=fis_basina_adet,
                    ciro=ciro,
                    birim_fiyat=birim_fiyat,
                    iade=iade,
                    oms=oms,
                    stok=stok,
                    kar=kar
                )
                result["basarili"] += 1

        except Exception as e:
            result["hatalar"].append(f"Satir {satir_no}: {str(e)}")
            result["hatali"] += 1

    return result


def get_performans_yillar() -> List[int]:
    """Mevcut yillari getir"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT yil FROM magaza_performans ORDER BY yil DESC")
    rows = cursor.fetchall()
    conn.close()
    return [row[0] for row in rows]


# =============================================================================
# MAGAZA MALZEME STOK ISLEMLERI
# =============================================================================

def get_magaza_malzeme_stok(yil: Optional[int] = None, ay: Optional[int] = None,
                            magaza_kodu: Optional[str] = None) -> pd.DataFrame:
    """Magaza malzeme stok verilerini getir (malzeme ve performans bilgileriyle birlikte)"""
    conn = get_connection()

    query = """
        SELECT
            mms.id,
            mms.magaza_kodu,
            mms.magaza_adi,
            mms.malzeme_kodu,
            m.ad as malzeme_adi,
            m.ana_grup,
            m.kalite,
            mms.yil,
            mms.ay,
            mms.stok,
            mms.satis,
            mms.yol,
            mms.stok_satis_oran,
            mms.ciro,
            mms.smm,
            mms.brutkar,
            mms.stok_tutar,
            m.tetikleyici,
            m.birim_tuketim_miktar,
            m.fire_orani,
            mp.fis as perf_fis,
            mp.satis_adet as perf_satis_adet,
            mp.ciro as perf_ciro,
            mms.created_at,
            mms.updated_at
        FROM magaza_malzeme_stok mms
        LEFT JOIN malzeme m ON mms.malzeme_kodu = m.malzeme_kodu
        LEFT JOIN magaza_performans mp ON mms.magaza_kodu = mp.magaza_kodu
            AND mms.yil = mp.yil AND mms.ay = mp.ay
        WHERE 1=1
    """

    params = []
    if yil:
        query += " AND mms.yil = ?"
        params.append(yil)
    if ay:
        query += " AND mms.ay = ?"
        params.append(ay)
    if magaza_kodu:
        query += " AND mms.magaza_kodu = ?"
        params.append(magaza_kodu)

    query += " ORDER BY mms.yil DESC, mms.ay DESC, mms.magaza_kodu, mms.malzeme_kodu"

    df = pd.read_sql_query(query, conn, params=params)
    conn.close()
    return df


def get_stok_by_magaza_malzeme_yil_ay(magaza_kodu: str, malzeme_kodu: str,
                                       yil: int, ay: int) -> Optional[Dict]:
    """Belirli magaza, malzeme, yil ve ay icin stok getir"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """SELECT * FROM magaza_malzeme_stok
           WHERE magaza_kodu = ? AND malzeme_kodu = ? AND yil = ? AND ay = ?""",
        (magaza_kodu, malzeme_kodu, yil, ay)
    )
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def add_magaza_malzeme_stok(
    magaza_kodu: str,
    magaza_adi: str,
    malzeme_kodu: str,
    yil: int,
    ay: int,
    stok: float = 0,
    satis: float = 0,
    yol: float = 0,
    ciro: float = 0,
    smm: float = 0,
    brutkar: float = 0,
    stok_tutar: float = 0
) -> int:
    """Yeni magaza malzeme stok kaydi ekle"""
    conn = get_connection()
    cursor = conn.cursor()

    # Stok/Satis orani hesapla
    stok_satis_oran = stok / satis if satis > 0 else 0

    cursor.execute("""
        INSERT INTO magaza_malzeme_stok (
            magaza_kodu, magaza_adi, malzeme_kodu, yil, ay,
            stok, satis, yol, stok_satis_oran, ciro, smm, brutkar, stok_tutar
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        magaza_kodu, magaza_adi, malzeme_kodu, yil, ay,
        stok, satis, yol, stok_satis_oran, ciro, smm, brutkar, stok_tutar
    ))

    conn.commit()
    last_id = cursor.lastrowid
    conn.close()
    return last_id


def update_magaza_malzeme_stok(id: int, **kwargs) -> bool:
    """Magaza malzeme stok guncelle"""
    if not kwargs:
        return False

    conn = get_connection()
    cursor = conn.cursor()

    # Stok/Satis orani hesapla (eger stok veya satis guncellendiyse)
    if 'stok' in kwargs or 'satis' in kwargs:
        # Mevcut degerleri al
        cursor.execute("SELECT stok, satis FROM magaza_malzeme_stok WHERE id = ?", (id,))
        row = cursor.fetchone()
        if row:
            stok = kwargs.get('stok', row[0])
            satis = kwargs.get('satis', row[1])
            kwargs['stok_satis_oran'] = stok / satis if satis > 0 else 0

    set_parts = []
    values = []

    for key, value in kwargs.items():
        set_parts.append(f"{key} = ?")
        values.append(value)

    set_parts.append("updated_at = CURRENT_TIMESTAMP")
    values.append(id)

    query = f"UPDATE magaza_malzeme_stok SET {', '.join(set_parts)} WHERE id = ?"

    cursor.execute(query, values)
    conn.commit()
    affected = cursor.rowcount
    conn.close()
    return affected > 0


def delete_magaza_malzeme_stok(id: int) -> bool:
    """Magaza malzeme stok kaydi sil"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM magaza_malzeme_stok WHERE id = ?", (id,))
    conn.commit()
    affected = cursor.rowcount
    conn.close()
    return affected > 0


def save_magaza_malzeme_stok_bulk(df: pd.DataFrame) -> Dict[str, Any]:
    """DataFrame'den toplu magaza malzeme stok kaydet"""
    result = {"basarili": 0, "guncellenen": 0, "hatali": 0, "hatalar": []}

    for idx, row in df.iterrows():
        row_dict = row.to_dict()
        satir_no = idx + 1

        try:
            magaza_kodu = str(row_dict.get("magaza_kodu", "")).strip()
            malzeme_kodu = str(row_dict.get("malzeme_kodu", "")).strip()

            # Bos satiri atla
            if not magaza_kodu or not malzeme_kodu:
                continue

            magaza_adi = str(row_dict.get("magaza_adi", "")).strip()

            try:
                yil = int(float(row_dict.get("yil", 0) or 0))
                ay = int(float(row_dict.get("ay", 0) or 0))
            except:
                result["hatalar"].append(f"Satir {satir_no}: Yil/Ay gecersiz")
                result["hatali"] += 1
                continue

            if yil < 2000 or yil > 2100 or ay < 1 or ay > 12:
                result["hatalar"].append(f"Satir {satir_no}: Yil/Ay aralik disi")
                result["hatali"] += 1
                continue

            try:
                stok = float(row_dict.get("stok", 0) or 0)
                satis = float(row_dict.get("satis", 0) or 0)
                yol = float(row_dict.get("yol", 0) or 0)
                ciro = float(row_dict.get("ciro", 0) or 0)
                smm = float(row_dict.get("smm", 0) or 0)
                brutkar = float(row_dict.get("brutkar", 0) or 0)
                stok_tutar = float(row_dict.get("stok_tutar", 0) or 0)
            except Exception as e:
                result["hatalar"].append(f"Satir {satir_no}: Sayisal deger hatasi - {str(e)}")
                result["hatali"] += 1
                continue

            # Mevcut kayit var mi?
            existing = get_stok_by_magaza_malzeme_yil_ay(magaza_kodu, malzeme_kodu, yil, ay)

            if existing:
                update_magaza_malzeme_stok(
                    existing["id"],
                    magaza_adi=magaza_adi,
                    stok=stok,
                    satis=satis,
                    yol=yol,
                    ciro=ciro,
                    smm=smm,
                    brutkar=brutkar,
                    stok_tutar=stok_tutar
                )
                result["guncellenen"] += 1
            else:
                add_magaza_malzeme_stok(
                    magaza_kodu=magaza_kodu,
                    magaza_adi=magaza_adi,
                    malzeme_kodu=malzeme_kodu,
                    yil=yil,
                    ay=ay,
                    stok=stok,
                    satis=satis,
                    yol=yol,
                    ciro=ciro,
                    smm=smm,
                    brutkar=brutkar,
                    stok_tutar=stok_tutar
                )
                result["basarili"] += 1

        except Exception as e:
            result["hatalar"].append(f"Satir {satir_no}: {str(e)}")
            result["hatali"] += 1

    return result


def get_stok_yillar() -> List[int]:
    """Stok verilerindeki mevcut yillari getir"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT yil FROM magaza_malzeme_stok ORDER BY yil DESC")
    rows = cursor.fetchall()
    conn.close()
    return [row[0] for row in rows]


def get_stok_magazalar() -> List[str]:
    """Stok verilerindeki mevcut magazalari getir"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT magaza_kodu FROM magaza_malzeme_stok ORDER BY magaza_kodu")
    rows = cursor.fetchall()
    conn.close()
    return [row[0] for row in rows]


# Veritabanini baslatma
if __name__ == "__main__":
    init_database()
    print(f"Veritabani olusturuldu: {DB_PATH}")
