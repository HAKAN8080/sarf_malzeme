"""
Sarf Malzeme Yonetimi - Streamlit Arayuzu
"""

import streamlit as st
import pandas as pd
from consumption_calculator import (
    calculate_theoretical_consumption,
    calculate_net_consumption,
    calculate_consumption_breakdown,
    SarfMalzeme,
    Kanal,
    Tetikleyici,
    PaketBilgisi,
    calculate_material_need
)
import math

st.set_page_config(
    page_title="Sarf Malzeme Yonetimi",
    page_icon="📦",
    layout="wide"
)

# EnglishHome stil
st.markdown("""
<style>
    .main .block-container { padding-top: 2rem; max-width: 1200px; }

    .eh-header {
        background: linear-gradient(135deg, #1a2b4a 0%, #2c3e5a 100%);
        color: white;
        padding: 1.5rem;
        border-radius: 12px;
        text-align: center;
        margin-bottom: 2rem;
    }
    .eh-header h1 { margin: 0; font-size: 1.8rem; }
    .eh-header p { margin: 0.3rem 0 0 0; opacity: 0.9; }

    .result-card {
        background: #f8fafc;
        border: 2px solid #1a2b4a;
        border-radius: 12px;
        padding: 1.5rem;
        text-align: center;
        margin: 0.5rem 0;
    }
    .result-label { color: #6b7280; font-size: 0.85rem; }
    .result-value { color: #1a2b4a; font-size: 1.8rem; font-weight: 700; }

    .info-box {
        background: #eff6ff;
        border-left: 4px solid #1a2b4a;
        padding: 1rem;
        border-radius: 0 8px 8px 0;
        margin: 0.5rem 0;
        font-size: 0.9rem;
    }

    .stButton > button {
        background: #1a2b4a !important;
        color: white !important;
        border: none !important;
        border-radius: 8px !important;
    }
</style>
""", unsafe_allow_html=True)

# Header
st.markdown("""
<div class="eh-header">
    <h1>SARF MALZEME YONETIMI</h1>
    <p>Tetikleyici Bazli Tuketim Planlama</p>
</div>
""", unsafe_allow_html=True)

# Tetikleyici secenekleri
TETIKLEYICI_MAP = {
    "Fis Adedi": Tetikleyici.FIS_ADEDI,
    "Sevkiyat": Tetikleyici.SEVKIYAT,
    "Satis Adedi": Tetikleyici.SATIS_ADEDI,
    "Online Siparis": Tetikleyici.SIPARIS,
    "Paketleme": Tetikleyici.PAKETLEME,
    "Iade": Tetikleyici.IADE,
    "Etiketleme": Tetikleyici.ETIKETLEME
}

# Session state icin malzeme listesi
if "malzemeler" not in st.session_state:
    st.session_state.malzemeler = [
        {
            "kod": "SRF001",
            "ad": "Rulo Kasa Kagidi 80mm",
            "birim": "metre",
            "tetikleyici": "Fis Adedi",
            "tetikleyici_aciklama": "Her kesilen fis icin 25cm kagit kullanilir",
            "birim_tuketim": 0.25,
            "birim_tuketim_aciklama": "1 fis = 25cm = 0.25m",
            "paket_adi": "Rulo",
            "paket_miktari": 30,
            "fire": 10
        },
        {
            "kod": "SRF002",
            "ad": "Koli Bandi 45mm",
            "birim": "adet",
            "tetikleyici": "Sevkiyat",
            "tetikleyici_aciklama": "Her sevkiyat kolisi icin bant kullanilir",
            "birim_tuketim": 1.5,
            "birim_tuketim_aciklama": "1 koli = 1.5 bant (ust+alt)",
            "paket_adi": "Koli",
            "paket_miktari": 36,
            "fire": 5
        },
        {
            "kod": "SRF003",
            "ad": "Kucuk Poset 20x30",
            "birim": "adet",
            "tetikleyici": "Paketleme",
            "tetikleyici_aciklama": "Her paketlenen urun icin 1 poset",
            "birim_tuketim": 1.0,
            "birim_tuketim_aciklama": "1 urun = 1 poset",
            "paket_adi": "Paket",
            "paket_miktari": 1000,
            "fire": 8
        },
        {
            "kod": "SRF004",
            "ad": "Buyuk Poset 40x50",
            "birim": "adet",
            "tetikleyici": "Online Siparis",
            "tetikleyici_aciklama": "Online siparislerde dis ambalaj",
            "birim_tuketim": 1.2,
            "birim_tuketim_aciklama": "1 siparis = 1.2 poset",
            "paket_adi": "Paket",
            "paket_miktari": 500,
            "fire": 10
        },
        {
            "kod": "SRF005",
            "ad": "Karton Koli 30x20x15",
            "birim": "adet",
            "tetikleyici": "Sevkiyat",
            "tetikleyici_aciklama": "Her online sevkiyat icin 1 koli",
            "birim_tuketim": 1.0,
            "birim_tuketim_aciklama": "1 sevkiyat = 1 koli",
            "paket_adi": "Palet",
            "paket_miktari": 200,
            "fire": 3
        },
        {
            "kod": "SRF006",
            "ad": "Balonlu Naylon",
            "birim": "metre",
            "tetikleyici": "Paketleme",
            "tetikleyici_aciklama": "Kirilacak urunler icin koruma",
            "birim_tuketim": 0.5,
            "birim_tuketim_aciklama": "1 urun = 50cm naylon",
            "paket_adi": "Rulo",
            "paket_miktari": 100,
            "fire": 15
        },
    ]

# Tabs
tab1, tab2, tab3 = st.tabs(["Hizli Hesaplama", "Malzeme Tanimlari", "Toplu Planlama"])

# =============================================================================
# TAB 1: HIZLI HESAPLAMA
# =============================================================================
with tab1:
    st.markdown("### Hizli Tuketim Hesaplama")

    col1, col2 = st.columns(2)

    with col1:
        st.markdown("**Secili Malzeme**")

        # Malzeme sec
        malzeme_secenekleri = {m["ad"]: m for m in st.session_state.malzemeler}
        secili_malzeme_ad = st.selectbox(
            "Malzeme",
            list(malzeme_secenekleri.keys())
        )
        secili = malzeme_secenekleri[secili_malzeme_ad]

        # Malzeme bilgilerini goster
        st.markdown(f"""
        <div class="info-box">
            <strong>Tetikleyici:</strong> {secili['tetikleyici']}<br>
            <strong>Aciklama:</strong> {secili['tetikleyici_aciklama']}<br>
            <strong>Birim Tuketim:</strong> {secili['birim_tuketim']} {secili['birim']}<br>
            <strong>Paket:</strong> 1 {secili['paket_adi']} = {secili['paket_miktari']} {secili['birim']}
        </div>
        """, unsafe_allow_html=True)

        st.markdown("---")
        st.markdown("**Parametreler**")

        tetikleyici_adedi = st.number_input(
            f"{secili['tetikleyici']} Adedi",
            min_value=0,
            value=10000,
            step=1000,
            help=f"Planlanan {secili['tetikleyici'].lower()} sayisi"
        )

        fire_yuzde = st.slider(
            "Fire Orani (%)",
            min_value=0,
            max_value=30,
            value=secili["fire"],
            help="Normal tuketim disinda olusan ek tuketim"
        )
        fire_rate = fire_yuzde / 100

    with col2:
        st.markdown("**Hesaplama Sonuclari**")

        if tetikleyici_adedi > 0:
            teorik = tetikleyici_adedi * secili["birim_tuketim"]
            fire_miktar = teorik * fire_rate
            net = teorik + fire_miktar
            paket_ihtiyaci = net / secili["paket_miktari"]

            st.markdown(f"""
            <div class="result-card">
                <div class="result-label">Teorik Tuketim</div>
                <div class="result-value">{teorik:,.1f} {secili['birim']}</div>
            </div>
            """, unsafe_allow_html=True)

            st.markdown(f"""
            <div class="result-card">
                <div class="result-label">Fire Miktari (+%{fire_yuzde})</div>
                <div class="result-value" style="color: #dc2626;">{fire_miktar:,.1f} {secili['birim']}</div>
            </div>
            """, unsafe_allow_html=True)

            st.markdown(f"""
            <div class="result-card" style="border-color: #0369a1; background: #e0f2fe;">
                <div class="result-label">Net Tuketim</div>
                <div class="result-value" style="color: #0369a1;">{net:,.1f} {secili['birim']}</div>
            </div>
            """, unsafe_allow_html=True)

            st.markdown(f"""
            <div class="result-card" style="border-color: #166534; background: #dcfce7;">
                <div class="result-label">Siparis Miktari ({secili['paket_adi']})</div>
                <div class="result-value" style="color: #166534;">{math.ceil(paket_ihtiyaci)} {secili['paket_adi']}</div>
            </div>
            """, unsafe_allow_html=True)

            st.caption(f"({paket_ihtiyaci:.2f} {secili['paket_adi'].lower()} - yukari yuvarlanmis)")

# =============================================================================
# TAB 2: MALZEME TANIMLARI
# =============================================================================
with tab2:
    st.markdown("### Malzeme Tanimlari")

    # Tablo goster
    df_malzeme = pd.DataFrame(st.session_state.malzemeler)
    df_display = df_malzeme[["kod", "ad", "tetikleyici", "birim_tuketim", "birim", "paket_adi", "paket_miktari", "fire"]]
    df_display.columns = ["Kod", "Malzeme", "Tetikleyici", "Birim Tuketim", "Birim", "Paket", "Paket Miktari", "Fire %"]

    st.dataframe(df_display, use_container_width=True, hide_index=True)

    # Detay goster
    st.markdown("---")
    st.markdown("**Malzeme Detayi**")

    detay_secim = st.selectbox(
        "Detay icin malzeme sec",
        [m["ad"] for m in st.session_state.malzemeler],
        key="detay_secim"
    )

    detay = next(m for m in st.session_state.malzemeler if m["ad"] == detay_secim)

    col1, col2 = st.columns(2)
    with col1:
        st.markdown(f"""
        **{detay['ad']}** (`{detay['kod']}`)

        - **Tetikleyici:** {detay['tetikleyici']}
        - **Aciklama:** {detay['tetikleyici_aciklama']}
        """)

    with col2:
        st.markdown(f"""
        **Tuketim Bilgisi:**

        - **Birim Tuketim:** {detay['birim_tuketim']} {detay['birim']}
        - **Aciklama:** {detay['birim_tuketim_aciklama']}
        - **Paket:** 1 {detay['paket_adi']} = {detay['paket_miktari']} {detay['birim']}
        - **Fire:** %{detay['fire']}
        """)

    # Yeni malzeme ekleme
    st.markdown("---")
    st.markdown("**Yeni Malzeme Ekle**")

    with st.expander("Malzeme Ekleme Formu", expanded=False):
        col1, col2 = st.columns(2)

        with col1:
            yeni_kod = st.text_input("Kod", placeholder="SRF007")
            yeni_ad = st.text_input("Malzeme Adi", placeholder="Yeni malzeme")
            yeni_birim = st.selectbox("Birim", ["adet", "metre", "kg", "litre"])
            yeni_tetikleyici = st.selectbox("Tetikleyici", list(TETIKLEYICI_MAP.keys()))
            yeni_tetikleyici_aciklama = st.text_input("Tetikleyici Aciklamasi", placeholder="Bu malzeme ne zaman kullanilir?")

        with col2:
            yeni_birim_tuketim = st.number_input("Birim Tuketim", min_value=0.01, value=1.0, step=0.1)
            yeni_birim_tuketim_aciklama = st.text_input("Tuketim Aciklamasi", placeholder="1 islem = X birim")
            yeni_paket_adi = st.selectbox("Paket Turu", ["Adet", "Rulo", "Koli", "Paket", "Palet", "Kutu"])
            yeni_paket_miktari = st.number_input("Paket Miktari", min_value=1, value=100, step=10)
            yeni_fire = st.number_input("Fire %", min_value=0, max_value=50, value=5)

        if st.button("Malzeme Ekle", use_container_width=True):
            if yeni_kod and yeni_ad:
                st.session_state.malzemeler.append({
                    "kod": yeni_kod,
                    "ad": yeni_ad,
                    "birim": yeni_birim,
                    "tetikleyici": yeni_tetikleyici,
                    "tetikleyici_aciklama": yeni_tetikleyici_aciklama,
                    "birim_tuketim": yeni_birim_tuketim,
                    "birim_tuketim_aciklama": yeni_birim_tuketim_aciklama,
                    "paket_adi": yeni_paket_adi,
                    "paket_miktari": yeni_paket_miktari,
                    "fire": yeni_fire
                })
                st.success(f"{yeni_ad} eklendi!")
                st.rerun()

# =============================================================================
# TAB 3: TOPLU PLANLAMA
# =============================================================================
with tab3:
    st.markdown("### Toplu Sarf Planlama")

    # Tetikleyici bazli gruplama
    tetikleyici_gruplari = {}
    for m in st.session_state.malzemeler:
        t = m["tetikleyici"]
        if t not in tetikleyici_gruplari:
            tetikleyici_gruplari[t] = []
        tetikleyici_gruplari[t].append(m)

    st.markdown("**Tetikleyici Bazli Adetler**")
    st.caption("Her tetikleyici icin planlanan adedi girin")

    tetikleyici_adetleri = {}
    cols = st.columns(len(tetikleyici_gruplari))

    for i, (tetikleyici, malzemeler) in enumerate(tetikleyici_gruplari.items()):
        with cols[i]:
            malzeme_listesi = ", ".join([m["ad"].split()[0] for m in malzemeler])
            tetikleyici_adetleri[tetikleyici] = st.number_input(
                f"{tetikleyici}",
                min_value=0,
                value=10000,
                step=1000,
                key=f"tetik_{tetikleyici}",
                help=f"Etkilenen: {malzeme_listesi}"
            )

    st.markdown("---")

    if st.button("Toplam Ihtiyaci Hesapla", use_container_width=True):
        sonuclar = []

        for m in st.session_state.malzemeler:
            tetik_adet = tetikleyici_adetleri.get(m["tetikleyici"], 0)
            if tetik_adet > 0:
                teorik = tetik_adet * m["birim_tuketim"]
                fire_miktar = teorik * (m["fire"] / 100)
                net = teorik + fire_miktar
                paket_ihtiyaci = net / m["paket_miktari"]

                sonuclar.append({
                    "Malzeme": m["ad"],
                    "Tetikleyici": m["tetikleyici"],
                    "Adet": tetik_adet,
                    "Birim Tuketim": m["birim_tuketim"],
                    "Teorik": teorik,
                    "Fire %": m["fire"],
                    "Net": net,
                    "Birim": m["birim"],
                    "Paket": m["paket_adi"],
                    "Paket Ihtiyaci": math.ceil(paket_ihtiyaci)
                })

        if sonuclar:
            df_sonuc = pd.DataFrame(sonuclar)

            st.markdown("### Hesaplama Sonuclari")
            st.dataframe(df_sonuc, use_container_width=True, hide_index=True)

            # Ozet
            st.markdown("---")
            st.markdown("### Siparis Ozeti")

            col1, col2, col3 = st.columns(3)

            with col1:
                st.metric("Toplam Malzeme Cesidi", len(sonuclar))
            with col2:
                toplam_fire = sum(r["Net"] - r["Teorik"] for r in sonuclar)
                st.metric("Toplam Fire", f"{toplam_fire:,.0f}")
            with col3:
                st.metric("Toplam Paket", sum(r["Paket Ihtiyaci"] for r in sonuclar))

            # Siparis listesi
            st.markdown("---")
            st.markdown("**Siparis Listesi (Paket Bazli)**")

            siparis_df = df_sonuc[["Malzeme", "Paket", "Paket Ihtiyaci", "Birim", "Net"]].copy()
            siparis_df.columns = ["Malzeme", "Paket Turu", "Siparis Adedi", "Birim", "Toplam Miktar"]
            st.dataframe(siparis_df, use_container_width=True, hide_index=True)

            # CSV indirme
            csv = df_sonuc.to_csv(index=False).encode('utf-8')
            st.download_button(
                "CSV Indir",
                csv,
                "sarf_planlama.csv",
                "text/csv",
                use_container_width=True
            )

# Footer
st.markdown("---")
st.caption("EnglishHome - Sarf Malzeme Yonetimi v1.0")
