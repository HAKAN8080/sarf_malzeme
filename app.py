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
    calculate_material_need
)

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
    <p>TK Bazli Tuketim Planlama</p>
</div>
""", unsafe_allow_html=True)

# Tabs
tab1, tab2, tab3 = st.tabs(["Hizli Hesaplama", "Malzeme Tanimlari", "Toplu Planlama"])

# =============================================================================
# TAB 1: HIZLI HESAPLAMA
# =============================================================================
with tab1:
    st.markdown("### Hizli Tuketim Hesaplama")

    col1, col2 = st.columns(2)

    with col1:
        st.markdown("**Girdi Parametreleri**")

        islem_adedi = st.number_input(
            "Planlanan Islem Adedi",
            min_value=0,
            value=120000,
            step=1000,
            help="Sevkiyat, satis veya uretim adedi"
        )

        tk = st.number_input(
            "Tuketim Katsayisi (TK)",
            min_value=0.0,
            value=1.0,
            step=0.1,
            format="%.2f",
            help="1 islem basina tuketilen sarf miktari"
        )

        fire_yuzde = st.slider(
            "Fire Orani (%)",
            min_value=0,
            max_value=30,
            value=3,
            help="Normal tuketim disinda olusan ek tuketim"
        )
        fire_rate = fire_yuzde / 100

    with col2:
        st.markdown("**Hesaplama Sonuclari**")

        if islem_adedi > 0:
            teorik = calculate_theoretical_consumption(islem_adedi, tk)
            net = calculate_net_consumption(islem_adedi, tk, fire_rate)
            fire_miktar = net - teorik

            st.markdown(f"""
            <div class="result-card">
                <div class="result-label">Teorik Tuketim</div>
                <div class="result-value">{teorik:,.0f}</div>
            </div>
            """, unsafe_allow_html=True)

            st.markdown(f"""
            <div class="result-card">
                <div class="result-label">Fire Miktari (+%{fire_yuzde})</div>
                <div class="result-value" style="color: #dc2626;">{fire_miktar:,.0f}</div>
            </div>
            """, unsafe_allow_html=True)

            st.markdown(f"""
            <div class="result-card" style="border-color: #166534; background: #dcfce7;">
                <div class="result-label">Net Tuketim (Siparis Miktari)</div>
                <div class="result-value" style="color: #166534;">{net:,.0f}</div>
            </div>
            """, unsafe_allow_html=True)

# =============================================================================
# TAB 2: MALZEME TANIMLARI
# =============================================================================
with tab2:
    st.markdown("### Malzeme Tanimlari")

    # Session state icin malzeme listesi
    if "malzemeler" not in st.session_state:
        st.session_state.malzemeler = [
            {"kod": "SRF001", "ad": "Koli Bandi 45mm", "birim": "adet", "tk": 0.5, "fire": 5},
            {"kod": "SRF002", "ad": "Rulo Kasa Kagidi 80mm", "birim": "metre", "tk": 0.15, "fire": 10},
            {"kod": "SRF003", "ad": "Kucuk Poset 20x30", "birim": "adet", "tk": 1.0, "fire": 8},
            {"kod": "SRF004", "ad": "Buyuk Poset 40x50", "birim": "adet", "tk": 0.3, "fire": 8},
            {"kod": "SRF005", "ad": "Karton Koli 30x20x15", "birim": "adet", "tk": 0.8, "fire": 5},
            {"kod": "SRF006", "ad": "Balonlu Naylon", "birim": "metre", "tk": 0.5, "fire": 15},
        ]

    # Tablo goster
    df_malzeme = pd.DataFrame(st.session_state.malzemeler)
    df_malzeme.columns = ["Kod", "Malzeme Adi", "Birim", "TK", "Fire %"]

    st.dataframe(df_malzeme, use_container_width=True, hide_index=True)

    # Yeni malzeme ekleme
    st.markdown("---")
    st.markdown("**Yeni Malzeme Ekle**")

    col1, col2, col3, col4, col5 = st.columns([1, 2, 1, 1, 1])

    with col1:
        yeni_kod = st.text_input("Kod", placeholder="SRF007")
    with col2:
        yeni_ad = st.text_input("Malzeme Adi", placeholder="Yeni malzeme")
    with col3:
        yeni_birim = st.selectbox("Birim", ["adet", "metre", "kg", "litre"])
    with col4:
        yeni_tk = st.number_input("TK", min_value=0.0, value=1.0, step=0.1, key="yeni_tk")
    with col5:
        yeni_fire = st.number_input("Fire %", min_value=0, max_value=50, value=5, key="yeni_fire")

    if st.button("Malzeme Ekle", use_container_width=True):
        if yeni_kod and yeni_ad:
            st.session_state.malzemeler.append({
                "kod": yeni_kod,
                "ad": yeni_ad,
                "birim": yeni_birim,
                "tk": yeni_tk,
                "fire": yeni_fire
            })
            st.success(f"{yeni_ad} eklendi!")
            st.rerun()

# =============================================================================
# TAB 3: TOPLU PLANLAMA
# =============================================================================
with tab3:
    st.markdown("### Toplu Sarf Planlama")

    if "malzemeler" in st.session_state and st.session_state.malzemeler:
        st.markdown("**Planlanan Islem Adetlerini Girin**")

        # Her malzeme icin input
        islem_adetleri = {}

        cols = st.columns(3)
        for i, m in enumerate(st.session_state.malzemeler):
            with cols[i % 3]:
                islem_adetleri[m["kod"]] = st.number_input(
                    f"{m['ad']}",
                    min_value=0,
                    value=10000,
                    step=1000,
                    key=f"islem_{m['kod']}"
                )

        st.markdown("---")

        if st.button("Toplam Ihtiyaci Hesapla", use_container_width=True):
            sonuclar = []

            for m in st.session_state.malzemeler:
                islem = islem_adetleri.get(m["kod"], 0)
                if islem > 0:
                    teorik = calculate_theoretical_consumption(islem, m["tk"])
                    net = calculate_net_consumption(islem, m["tk"], m["fire"] / 100)
                    sonuclar.append({
                        "Malzeme": m["ad"],
                        "Islem Adedi": islem,
                        "TK": m["tk"],
                        "Fire %": m["fire"],
                        "Teorik": teorik,
                        "Net Ihtiyac": net,
                        "Birim": m["birim"]
                    })

            if sonuclar:
                df_sonuc = pd.DataFrame(sonuclar)

                st.markdown("### Hesaplama Sonuclari")
                st.dataframe(df_sonuc, use_container_width=True, hide_index=True)

                # Ozet
                st.markdown("---")
                col1, col2 = st.columns(2)

                with col1:
                    st.metric(
                        "Toplam Malzeme Cesidi",
                        len(sonuclar)
                    )
                with col2:
                    toplam_fire = sum(r["Net Ihtiyac"] - r["Teorik"] for r in sonuclar)
                    st.metric(
                        "Toplam Fire Miktari",
                        f"{toplam_fire:,.0f}"
                    )

                # CSV indirme
                csv = df_sonuc.to_csv(index=False).encode('utf-8')
                st.download_button(
                    "CSV Indir",
                    csv,
                    "sarf_planlama.csv",
                    "text/csv",
                    use_container_width=True
                )
    else:
        st.info("Once Malzeme Tanimlari sekmesinden malzeme ekleyin.")

# Footer
st.markdown("---")
st.caption("EnglishHome - Sarf Malzeme Yonetimi v1.0")
