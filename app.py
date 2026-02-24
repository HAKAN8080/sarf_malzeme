"""
Sarf Malzeme Yonetimi - Streamlit Arayuzu
Kalici veritabani destekli
"""

import streamlit as st
import pandas as pd
import math
from database import (
    init_database,
    get_malzemeler, get_malzeme_by_id, add_malzeme, update_malzeme, delete_malzeme,
    get_ana_gruplar, add_ana_grup, delete_ana_grup,
    get_sub_gruplar, add_sub_grup,
    get_kaliteler, add_kalite,
    get_tetikleyiciler, add_tetikleyici,
    export_malzemeler_to_csv, import_malzemeler_from_csv,
    import_gruplar_from_csv, save_malzemeler_bulk, check_unique_malzeme,
    get_magazalar, save_magazalar_bulk, delete_magaza,
    get_magaza_performans, save_performans_bulk, delete_magaza_performans, get_performans_yillar,
    get_magaza_malzeme_stok, save_magaza_malzeme_stok_bulk, delete_magaza_malzeme_stok,
    get_stok_yillar, get_stok_magazalar
)

# Veritabanini baslat
init_database()

st.set_page_config(
    page_title="Sarf Malzeme Yonetimi",
    page_icon="📦",
    layout="wide"
)

# Stil
st.markdown("""
<style>
    .main .block-container { padding-top: 1rem; max-width: 1400px; }
    .eh-header {
        background: linear-gradient(135deg, #1a2b4a 0%, #2c3e5a 100%);
        color: white;
        padding: 1.2rem;
        border-radius: 10px;
        text-align: center;
        margin-bottom: 1.5rem;
    }
    .eh-header h1 { margin: 0; font-size: 1.6rem; }
    .eh-header p { margin: 0.2rem 0 0 0; opacity: 0.9; font-size: 0.9rem; }
    .result-card {
        background: #f8fafc;
        border: 2px solid #1a2b4a;
        border-radius: 10px;
        padding: 1rem;
        text-align: center;
        margin: 0.5rem 0;
    }
    .result-label { color: #6b7280; font-size: 0.8rem; }
    .result-value { color: #1a2b4a; font-size: 1.5rem; font-weight: 700; }
    .info-box {
        background: #eff6ff;
        border-left: 4px solid #1a2b4a;
        padding: 0.8rem;
        border-radius: 0 6px 6px 0;
        font-size: 0.85rem;
    }
    .stButton > button {
        background: #1a2b4a !important;
        color: white !important;
        border: none !important;
        border-radius: 6px !important;
    }
    .success-msg { color: #166534; background: #dcfce7; padding: 0.5rem; border-radius: 4px; }
    .error-msg { color: #991b1b; background: #fee2e2; padding: 0.5rem; border-radius: 4px; }
</style>
""", unsafe_allow_html=True)

# Header
st.markdown("""
<div class="eh-header">
    <h1>SARF MALZEME YONETIMI</h1>
    <p>Malzeme Tanim ve Tuketim Planlama Sistemi</p>
</div>
""", unsafe_allow_html=True)

# Tabs
tab1, tab2, tab3, tab4, tab5, tab6 = st.tabs([
    "Malzeme Bilgi",
    "Magaza Bilgi",
    "Tuketim Hesaplama",
    "Ayarlar",
    "Stok Analiz",
    "Ihtiyac & Siparis"
])


# =============================================================================
# TAB 1: MALZEME BILGI (Liste + Ekle/Duzenle + CSV)
# =============================================================================
with tab1:
    st.markdown("### Malzeme Bilgi")

    stok_options = ["Var", "Yok"]

    malzeme_mode = st.radio(
        "Islem",
        ["Malzeme Listesi", "Malzeme Ekle/Duzenle", "CSV'den Aktar"],
        horizontal=True,
        key="malzeme_mode"
    )

    if malzeme_mode == "Malzeme Listesi":
        # Filtreler
        col_f1, col_f2, col_f3, col_f4 = st.columns(4)

        ana_gruplar = get_ana_gruplar()
        ana_grup_options = ["Tumu"] + [g["ad"] for g in ana_gruplar]

        kaliteler = get_kaliteler()
        kalite_options = ["Tumu"] + [k["ad"] for k in kaliteler]

        tetikleyiciler = get_tetikleyiciler()
        tetik_options = ["Tumu"] + [t["ad"] for t in tetikleyiciler]

        with col_f1:
            filtre_ana_grup = st.selectbox("Ana Grup", ana_grup_options, key="f_ana_grup")
        with col_f2:
            filtre_kalite = st.selectbox("Kalite", kalite_options, key="f_kalite")
        with col_f3:
            filtre_tetik = st.selectbox("Tetikleyici", tetik_options, key="f_tetik")
        with col_f4:
            filtre_arama = st.text_input("Ara (Kod/Ad/Barkod)", key="f_arama")

        # Malzemeleri getir
        df = get_malzemeler()

        if not df.empty:
            # Filtreleri uygula
            if filtre_ana_grup != "Tumu":
                df = df[df["ana_grup"] == filtre_ana_grup]
            if filtre_kalite != "Tumu":
                df = df[df["kalite"] == filtre_kalite]
            if filtre_tetik != "Tumu":
                df = df[df["tetikleyici"] == filtre_tetik]
            if filtre_arama:
                mask = (
                    df["malzeme_kodu"].str.contains(filtre_arama, case=False, na=False) |
                    df["ad"].str.contains(filtre_arama, case=False, na=False) |
                    df["barkod"].str.contains(filtre_arama, case=False, na=False)
                )
                df = df[mask]

            # Tablo sutunlari
            display_cols = [
                "malzeme_kodu", "barkod", "ad", "stok_takip", "ana_grup", "sub_grup",
                "kalite", "tetikleyici", "birim_tuketim_birim", "birim_tuketim_miktar",
                "fire_orani", "inner_box", "koli_ici", "toplam_paket_birim_miktar",
                "uretici_kodu", "uretici_adi", "ortalama_tedarik_suresi", "ortalama_ek_sure",
                "depo_stok", "min_sevk_miktari", "min_siparis_miktari", "guvenlik_stok"
            ]

            display_names = {
                "malzeme_kodu": "Malzeme Kodu",
                "barkod": "Barkod",
                "ad": "Adi",
                "stok_takip": "Stok Takip",
                "ana_grup": "Ana Grup",
                "sub_grup": "Sub Group",
                "kalite": "Kalite",
                "tetikleyici": "Tetikleyici",
                "birim_tuketim_birim": "Tuketim Birim",
                "birim_tuketim_miktar": "Tuketim Miktar",
                "fire_orani": "Fire %",
                "inner_box": "Inner Box",
                "koli_ici": "Koli Ici",
                "toplam_paket_birim_miktar": "Toplam Paket",
                "uretici_kodu": "Uretici Kodu",
                "uretici_adi": "Uretici Adi",
                "ortalama_tedarik_suresi": "Ort. Tedarik Suresi",
                "ortalama_ek_sure": "Ort. Ek Sure",
                "depo_stok": "Depo Stok",
                "min_sevk_miktari": "Min Sevk",
                "min_siparis_miktari": "Min Siparis",
                "guvenlik_stok": "Guvenlik Stok"
            }

            # Sadece mevcut kolonlari al
            available_cols = [c for c in display_cols if c in df.columns]
            df_display = df[available_cols].copy()
            df_display.columns = [display_names.get(c, c) for c in available_cols]

            # Istatistikler
            st.markdown(f"**Toplam: {len(df_display)} malzeme**")

            # Tablo goster
            st.dataframe(
                df_display,
                use_container_width=True,
                hide_index=True,
                height=400
            )

            # CSV Export
            csv_data = df.to_csv(index=False, encoding='utf-8-sig')
            st.download_button(
                "CSV Indir",
                csv_data.encode('utf-8-sig'),
                "malzemeler.csv",
                "text/csv"
            )

        else:
            st.info("Henuz malzeme tanimlanmamis.")

    elif malzeme_mode == "Malzeme Ekle/Duzenle":
        st.markdown("---")

        # Uyari mesaji
        st.info("""
        **Kullanim:** Tabloya yeni satirlar ekleyin veya mevcut satirlari duzenleyin.
        - **Malzeme Kodu**, **Barkod** ve **Malzeme Adi** benzersiz olmalidir
        - Degisiklikler "Kaydet" butonuna basildiginda uygulanir
        """)

        # Mevcut malzemeleri al
        df_existing = get_malzemeler()

        # Duzenlenebilir tablo icin kolon yapisi
        if df_existing.empty:
            # Bos tablo olustur
            df_edit = pd.DataFrame({
                "malzeme_kodu": [""],
                "barkod": [""],
                "ad": [""],
                "stok_takip": ["Var"],
                "ana_grup": [""],
                "sub_grup": [""],
                "kalite": [""],
                "tetikleyici": [""],
                "birim_tuketim_birim": [""],
                "birim_tuketim_miktar": [0.0],
                "fire_orani": [0.0],
                "inner_box": [0],
                "koli_ici": [0],
                "toplam_paket_birim_miktar": [0],
                "uretici_kodu": [""],
                "uretici_adi": [""],
                "ortalama_tedarik_suresi": [0.0],
                "ortalama_ek_sure": [0.0],
                "depo_stok": [0.0],
                "min_sevk_miktari": [1],
                "min_siparis_miktari": [1],
                "guvenlik_stok": [0.0]
            })
        else:
            # Mevcut verileri al
            df_edit = df_existing[[
                "malzeme_kodu", "barkod", "ad", "stok_takip", "ana_grup", "sub_grup",
                "kalite", "tetikleyici", "birim_tuketim_birim", "birim_tuketim_miktar",
                "fire_orani", "inner_box", "koli_ici", "toplam_paket_birim_miktar",
                "uretici_kodu", "uretici_adi", "ortalama_tedarik_suresi", "ortalama_ek_sure",
                "depo_stok", "min_sevk_miktari", "min_siparis_miktari", "guvenlik_stok"
            ]].copy()

            # None degerleri bos string yap
            df_edit = df_edit.fillna("")

        # Kolon konfigurasyonu
        column_config = {
            "malzeme_kodu": st.column_config.TextColumn(
                "Malzeme Kodu",
                help="Benzersiz malzeme kodu",
                max_chars=50
            ),
            "barkod": st.column_config.TextColumn(
                "Barkod",
                help="Benzersiz barkod numarasi",
                max_chars=50
            ),
            "ad": st.column_config.TextColumn(
                "Malzeme Adi",
                help="Benzersiz malzeme adi",
                max_chars=200
            ),
            "stok_takip": st.column_config.SelectboxColumn(
                "Stok Takip",
                options=stok_options
            ),
            "ana_grup": st.column_config.TextColumn(
                "Ana Grup",
                max_chars=100
            ),
            "sub_grup": st.column_config.TextColumn(
                "Sub Group",
                max_chars=100
            ),
            "kalite": st.column_config.TextColumn(
                "Kalite",
                max_chars=100
            ),
            "tetikleyici": st.column_config.TextColumn(
                "Tetikleyici",
                max_chars=100
            ),
            "birim_tuketim_birim": st.column_config.TextColumn(
                "Birim",
                max_chars=50
            ),
            "birim_tuketim_miktar": st.column_config.NumberColumn(
                "Tuketim Miktar",
                help="Birim tuketim miktari",
                format="%.2f"
            ),
            "fire_orani": st.column_config.NumberColumn(
                "Fire %",
                help="Fire orani",
                format="%.1f"
            ),
            "inner_box": st.column_config.NumberColumn(
                "Inner Box",
                format="%d"
            ),
            "koli_ici": st.column_config.NumberColumn(
                "Koli Ici",
                format="%d"
            ),
            "toplam_paket_birim_miktar": st.column_config.NumberColumn(
                "Toplam Paket",
                format="%d"
            ),
            "uretici_kodu": st.column_config.TextColumn(
                "Uretici Kodu",
                help="Uretici/Tedarikci kodu",
                max_chars=50
            ),
            "uretici_adi": st.column_config.TextColumn(
                "Uretici Adi",
                help="Uretici/Tedarikci adi",
                max_chars=200
            ),
            "ortalama_tedarik_suresi": st.column_config.NumberColumn(
                "Ort. Tedarik Suresi",
                help="Ortalama tedarik suresi (gun)",
                format="%.1f"
            ),
            "ortalama_ek_sure": st.column_config.NumberColumn(
                "Ort. Ek Sure",
                help="Ortalama ek sure (gun)",
                format="%.1f"
            ),
            "depo_stok": st.column_config.NumberColumn(
                "Depo Stok",
                help="Merkez depodaki mevcut stok",
                format="%.1f"
            ),
            "min_sevk_miktari": st.column_config.NumberColumn(
                "Min Sevk",
                help="Magazaya minimum sevk miktari",
                format="%d"
            ),
            "min_siparis_miktari": st.column_config.NumberColumn(
                "Min Siparis",
                help="Ureticiye minimum siparis miktari",
                format="%d"
            ),
            "guvenlik_stok": st.column_config.NumberColumn(
                "Guvenlik Stok",
                help="Minimum guvenlik stok seviyesi",
                format="%.1f"
            )
        }

        # Duzenlenebilir tablo
        edited_df = st.data_editor(
            df_edit,
            column_config=column_config,
            num_rows="dynamic",
            use_container_width=True,
            hide_index=True,
            key="malzeme_editor"
        )

        # Kaydet butonu
        col_save, col_clear = st.columns([1, 1])

        with col_save:
            if st.button("Degisiklikleri Kaydet", use_container_width=True, type="primary", key="save_malzeme"):
                # Bos satirlari kaldir
                edited_df = edited_df.dropna(subset=["malzeme_kodu"], how="all")
                edited_df = edited_df[edited_df["malzeme_kodu"].astype(str).str.strip() != ""]

                if edited_df.empty:
                    st.warning("Kaydedilecek malzeme bulunamadi.")
                else:
                    # Kaydet
                    result = save_malzemeler_bulk(edited_df)

                    # Sonuclari goster
                    if result["basarili"] > 0:
                        st.success(f"{result['basarili']} yeni malzeme eklendi!")
                    if result["guncellenen"] > 0:
                        st.success(f"{result['guncellenen']} malzeme guncellendi!")
                    if result["hatali"] > 0:
                        st.error(f"{result['hatali']} satir hatali:")
                        for hata in result["hatalar"][:10]:
                            st.caption(f"- {hata}")

                    if result["hatali"] == 0:
                        st.rerun()

        with col_clear:
            if st.button("Tabloyu Sifirla", use_container_width=True, key="clear_malzeme"):
                st.rerun()

        # Silme islemi icin ayri bolum
        st.markdown("---")
        st.markdown("**Malzeme Sil**")

        df_all = get_malzemeler()
        if not df_all.empty:
            delete_options = df_all.apply(lambda r: f"{r['malzeme_kodu']} - {r['ad']}", axis=1).tolist()
            selected_delete = st.selectbox("Silinecek Malzeme", ["Seciniz"] + delete_options, key="delete_malzeme")

            if selected_delete != "Seciniz" and st.button("Secili Malzemeyi Sil", type="secondary", key="del_malz_btn"):
                idx = delete_options.index(selected_delete)
                delete_id = df_all.iloc[idx]["id"]
                delete_malzeme(delete_id)
                st.success("Malzeme silindi!")
                st.rerun()

    else:  # CSV'den Aktar
        st.markdown("---")
        st.markdown("### CSV'den Malzeme Aktar")

        st.markdown("""
        **CSV Dosya Formati:**
        ```
        malzeme_kodu,barkod,ad,stok_takip,ana_grup,kalite,tetikleyici,...,uretici_kodu,uretici_adi,ortalama_tedarik_suresi,ortalama_ek_sure
        ```

        **Zorunlu Alan:** Sadece malzeme_kodu
        **Tedarik Sureleri:** Gun cinsinden
        """)

        # Ornek CSV indir
        sample_data = {
            "malzeme_kodu": ["SRF001", "SRF002"],
            "barkod": ["8680001234567", "8680001234568"],
            "ad": ["Ornek Malzeme 1", "Ornek Malzeme 2"],
            "stok_takip": ["Var", "Var"],
            "ana_grup": ["Ticari", "Ticari olmayan"],
            "sub_grup": ["", ""],
            "kalite": ["Kraft", "Plastik"],
            "tetikleyici": ["Fis sayisi", "Satis adeti"],
            "birim_tuketim_birim": ["adet", "metre"],
            "birim_tuketim_miktar": [1.0, 0.25],
            "fire_orani": [5.0, 10.0],
            "inner_box": [1, 1],
            "koli_ici": [12, 30],
            "toplam_paket_birim_miktar": [12, 30],
            "uretici_kodu": ["URT001", "URT002"],
            "uretici_adi": ["ABC Tedarik", "XYZ Uretim"],
            "ortalama_tedarik_suresi": [7.0, 14.0],
            "ortalama_ek_sure": [2.0, 3.0]
        }
        sample_df = pd.DataFrame(sample_data)
        sample_csv = sample_df.to_csv(index=False, encoding='utf-8-sig')

        st.download_button(
            "Ornek CSV Indir",
            sample_csv.encode('utf-8-sig'),
            "ornek_malzeme.csv",
            "text/csv"
        )

        uploaded_file = st.file_uploader("CSV Dosyasi Sec", type=["csv"], key="malzeme_csv")

        if uploaded_file:
            # Onizleme
            try:
                # Farkli encoding ve delimiter dene
                preview_df = None
                delimiters = [',', ';', '\t']
                encodings = ['utf-8-sig', 'utf-8', 'latin-1', 'cp1254']

                for encoding in encodings:
                    for delimiter in delimiters:
                        try:
                            uploaded_file.seek(0)
                            preview_df = pd.read_csv(uploaded_file, encoding=encoding, sep=delimiter)
                            if len(preview_df.columns) > 1:
                                break
                        except:
                            continue
                    if preview_df is not None and len(preview_df.columns) > 1:
                        break

                if preview_df is None or preview_df.empty or len(preview_df.columns) <= 1:
                    st.error("CSV dosyasi okunamadi. Lutfen virgul (,) veya noktali virgul (;) ile ayrilmis bir CSV dosyasi yukleyin.")
                else:
                    st.markdown("**Onizleme:**")
                    st.dataframe(preview_df.head(10), use_container_width=True, hide_index=True)

                    if st.button("Iceri Aktar", use_container_width=True, type="primary", key="import_malzeme"):
                        result = save_malzemeler_bulk(preview_df)

                        if result["basarili"] > 0:
                            st.success(f"{result['basarili']} yeni malzeme eklendi!")
                        if result["guncellenen"] > 0:
                            st.success(f"{result['guncellenen']} malzeme guncellendi!")
                        if result["hatali"] > 0:
                            st.error(f"{result['hatali']} satir hatali:")
                            for hata in result["hatalar"][:10]:
                                st.caption(f"- {hata}")

                        if result["hatali"] == 0:
                            st.rerun()

            except Exception as e:
                st.error(f"CSV okuma hatasi: {str(e)}")


# =============================================================================
# TAB 2: MAGAZA BILGI
# =============================================================================
with tab2:
    st.markdown("### Magaza Bilgi")

    magaza_mode = st.radio(
        "Islem",
        ["Magaza Listesi", "Magaza Ekle/Duzenle", "Performans", "CSV'den Aktar"],
        horizontal=True,
        key="magaza_mode"
    )

    if magaza_mode == "Magaza Listesi":
        df_magaza = get_magazalar()

        if not df_magaza.empty:
            display_cols = ["magaza_kodu", "magaza_adi", "sehir", "bolge", "bolge_muduru", "kapasite_adet", "m2", "yol_suresi", "oncelik"]
            display_names = {
                "magaza_kodu": "Magaza Kodu",
                "magaza_adi": "Magaza Adi",
                "sehir": "Sehir",
                "bolge": "Bolge",
                "bolge_muduru": "Bolge Muduru",
                "kapasite_adet": "Kapasite Adet",
                "m2": "M2",
                "yol_suresi": "Yol Suresi (Gun)",
                "oncelik": "Oncelik"
            }

            available_cols = [c for c in display_cols if c in df_magaza.columns]
            df_display = df_magaza[available_cols].copy()
            df_display.columns = [display_names.get(c, c) for c in available_cols]

            st.markdown(f"**Toplam: {len(df_display)} magaza**")
            st.dataframe(df_display, use_container_width=True, hide_index=True, height=400)

            csv_data = df_magaza.to_csv(index=False, encoding='utf-8-sig')
            st.download_button("CSV Indir", csv_data.encode('utf-8-sig'), "magazalar.csv", "text/csv")
        else:
            st.info("Henuz magaza tanimlanmamis.")

    elif magaza_mode == "Magaza Ekle/Duzenle":
        st.markdown("---")
        st.info("Tabloya yeni satirlar ekleyin veya mevcut satirlari duzenleyin.")

        df_existing = get_magazalar()

        if df_existing.empty:
            df_edit = pd.DataFrame({
                "magaza_kodu": [""],
                "magaza_adi": [""],
                "sehir": [""],
                "bolge": [""],
                "bolge_muduru": [""],
                "kapasite_adet": [0],
                "m2": [0.0],
                "yol_suresi": [1],
                "oncelik": [1]
            })
        else:
            df_edit = df_existing[[
                "magaza_kodu", "magaza_adi", "sehir", "bolge", "bolge_muduru", "kapasite_adet", "m2", "yol_suresi", "oncelik"
            ]].copy()
            df_edit = df_edit.fillna("")

        column_config = {
            "magaza_kodu": st.column_config.TextColumn("Magaza Kodu", max_chars=50),
            "magaza_adi": st.column_config.TextColumn("Magaza Adi", max_chars=200),
            "sehir": st.column_config.TextColumn("Sehir", max_chars=100),
            "bolge": st.column_config.TextColumn("Bolge", max_chars=100),
            "bolge_muduru": st.column_config.TextColumn("Bolge Muduru", max_chars=100),
            "kapasite_adet": st.column_config.NumberColumn("Kapasite Adet", format="%d"),
            "m2": st.column_config.NumberColumn("M2", format="%.1f"),
            "yol_suresi": st.column_config.NumberColumn("Yol Suresi (Gun)", help="Depodan magazaya teslim suresi", format="%d"),
            "oncelik": st.column_config.NumberColumn("Oncelik", help="1=Yuksek, 2=Orta, 3=Dusuk", format="%d")
        }

        edited_df = st.data_editor(
            df_edit,
            column_config=column_config,
            num_rows="dynamic",
            use_container_width=True,
            hide_index=True,
            key="magaza_editor"
        )

        col_save, col_clear = st.columns([1, 1])

        with col_save:
            if st.button("Degisiklikleri Kaydet", use_container_width=True, type="primary", key="save_magaza"):
                edited_df = edited_df.dropna(subset=["magaza_kodu"], how="all")
                edited_df = edited_df[edited_df["magaza_kodu"].astype(str).str.strip() != ""]

                if edited_df.empty:
                    st.warning("Kaydedilecek magaza bulunamadi.")
                else:
                    result = save_magazalar_bulk(edited_df)

                    if result["basarili"] > 0:
                        st.success(f"{result['basarili']} yeni magaza eklendi!")
                    if result["guncellenen"] > 0:
                        st.success(f"{result['guncellenen']} magaza guncellendi!")
                    if result["hatali"] > 0:
                        st.error(f"{result['hatali']} satir hatali:")
                        for hata in result["hatalar"][:10]:
                            st.caption(f"- {hata}")

                    if result["hatali"] == 0:
                        st.rerun()

        with col_clear:
            if st.button("Tabloyu Sifirla", use_container_width=True, key="clear_magaza"):
                st.rerun()

        # Silme
        st.markdown("---")
        st.markdown("**Magaza Sil**")
        df_all = get_magazalar()
        if not df_all.empty:
            delete_options = df_all.apply(lambda r: f"{r['magaza_kodu']} - {r['magaza_adi']}", axis=1).tolist()
            selected_delete = st.selectbox("Silinecek Magaza", ["Seciniz"] + delete_options, key="delete_magaza")

            if selected_delete != "Seciniz" and st.button("Secili Magazayi Sil", type="secondary", key="del_mag_btn"):
                idx = delete_options.index(selected_delete)
                delete_id = df_all.iloc[idx]["id"]
                delete_magaza(delete_id)
                st.success("Magaza silindi!")
                st.rerun()

    elif magaza_mode == "Performans":
        st.markdown("---")

        # Performans alt modu
        perf_mode = st.radio(
            "Performans Islemi",
            ["Performans Listesi", "Performans Ekle/Duzenle", "CSV'den Aktar"],
            horizontal=True,
            key="perf_mode"
        )

        if perf_mode == "Performans Listesi":
            # Filtreler
            col_pf1, col_pf2 = st.columns(2)

            yillar = get_performans_yillar()
            yil_options = ["Tumu"] + [str(y) for y in yillar] if yillar else ["Tumu"]

            with col_pf1:
                filtre_yil = st.selectbox("Yil", yil_options, key="pf_yil")
            with col_pf2:
                filtre_ay = st.selectbox("Ay", ["Tumu"] + [str(i) for i in range(1, 13)], key="pf_ay")

            # Performans verilerini getir
            yil_param = int(filtre_yil) if filtre_yil != "Tumu" else None
            ay_param = int(filtre_ay) if filtre_ay != "Tumu" else None
            df_perf = get_magaza_performans(yil=yil_param, ay=ay_param)

            if not df_perf.empty:
                display_cols = [
                    "magaza_kodu", "magaza_adi", "yil", "ay", "fis", "satis_adet",
                    "fis_basina_adet", "ciro", "birim_fiyat", "iade", "oms", "stok", "kar"
                ]
                display_names = {
                    "magaza_kodu": "Magaza Kodu",
                    "magaza_adi": "Magaza Adi",
                    "yil": "Yil",
                    "ay": "Ay",
                    "fis": "Fis",
                    "satis_adet": "Satis Adet",
                    "fis_basina_adet": "Fis Basina Adet",
                    "ciro": "Ciro",
                    "birim_fiyat": "Birim Fiyat",
                    "iade": "Iade",
                    "oms": "OMS",
                    "stok": "Stok",
                    "kar": "Kar"
                }

                available_cols = [c for c in display_cols if c in df_perf.columns]
                df_display = df_perf[available_cols].copy()
                df_display.columns = [display_names.get(c, c) for c in available_cols]

                st.markdown(f"**Toplam: {len(df_display)} kayit**")
                st.dataframe(df_display, use_container_width=True, hide_index=True, height=400)

                csv_data = df_perf.to_csv(index=False, encoding='utf-8-sig')
                st.download_button("CSV Indir", csv_data.encode('utf-8-sig'), "magaza_performans.csv", "text/csv")
            else:
                st.info("Henuz performans verisi tanimlanmamis.")

        elif perf_mode == "Performans Ekle/Duzenle":
            st.info("Tabloya yeni satirlar ekleyin veya mevcut satirlari duzenleyin.")

            df_existing = get_magaza_performans()

            if df_existing.empty:
                df_edit = pd.DataFrame({
                    "magaza_kodu": [""],
                    "magaza_adi": [""],
                    "yil": [2025],
                    "ay": [1],
                    "fis": [0],
                    "satis_adet": [0],
                    "fis_basina_adet": [0.0],
                    "ciro": [0.0],
                    "birim_fiyat": [0.0],
                    "iade": [0.0],
                    "oms": [0.0],
                    "stok": [0.0],
                    "kar": [0.0]
                })
            else:
                df_edit = df_existing[[
                    "magaza_kodu", "magaza_adi", "yil", "ay", "fis", "satis_adet",
                    "fis_basina_adet", "ciro", "birim_fiyat", "iade", "oms", "stok", "kar"
                ]].copy()
                df_edit = df_edit.fillna(0)

            column_config = {
                "magaza_kodu": st.column_config.TextColumn("Magaza Kodu", max_chars=50),
                "magaza_adi": st.column_config.TextColumn("Magaza Adi", max_chars=200),
                "yil": st.column_config.NumberColumn("Yil", min_value=2000, max_value=2100, format="%d"),
                "ay": st.column_config.NumberColumn("Ay", min_value=1, max_value=12, format="%d"),
                "fis": st.column_config.NumberColumn("Fis", format="%d"),
                "satis_adet": st.column_config.NumberColumn("Satis Adet", format="%d"),
                "fis_basina_adet": st.column_config.NumberColumn("Fis Basina Adet", format="%.2f"),
                "ciro": st.column_config.NumberColumn("Ciro", format="%.2f"),
                "birim_fiyat": st.column_config.NumberColumn("Birim Fiyat", format="%.2f"),
                "iade": st.column_config.NumberColumn("Iade", format="%.2f"),
                "oms": st.column_config.NumberColumn("OMS", format="%.2f"),
                "stok": st.column_config.NumberColumn("Stok", format="%.2f"),
                "kar": st.column_config.NumberColumn("Kar", format="%.2f")
            }

            edited_df = st.data_editor(
                df_edit,
                column_config=column_config,
                num_rows="dynamic",
                use_container_width=True,
                hide_index=True,
                key="performans_editor"
            )

            col_save, col_clear = st.columns([1, 1])

            with col_save:
                if st.button("Degisiklikleri Kaydet", use_container_width=True, type="primary", key="save_perf"):
                    edited_df = edited_df.dropna(subset=["magaza_kodu"], how="all")
                    edited_df = edited_df[edited_df["magaza_kodu"].astype(str).str.strip() != ""]

                    if edited_df.empty:
                        st.warning("Kaydedilecek kayit bulunamadi.")
                    else:
                        result = save_performans_bulk(edited_df)

                        if result["basarili"] > 0:
                            st.success(f"{result['basarili']} yeni kayit eklendi!")
                        if result["guncellenen"] > 0:
                            st.success(f"{result['guncellenen']} kayit guncellendi!")
                        if result["hatali"] > 0:
                            st.error(f"{result['hatali']} satir hatali:")
                            for hata in result["hatalar"][:10]:
                                st.caption(f"- {hata}")

                        if result["hatali"] == 0:
                            st.rerun()

            with col_clear:
                if st.button("Tabloyu Sifirla", use_container_width=True, key="clear_perf"):
                    st.rerun()

            # Silme
            st.markdown("---")
            st.markdown("**Performans Kaydi Sil**")
            df_all = get_magaza_performans()
            if not df_all.empty:
                delete_options = df_all.apply(
                    lambda r: f"{r['magaza_kodu']} - {r['yil']}/{r['ay']}", axis=1
                ).tolist()
                selected_delete = st.selectbox("Silinecek Kayit", ["Seciniz"] + delete_options, key="delete_perf")

                if selected_delete != "Seciniz" and st.button("Secili Kaydi Sil", type="secondary", key="del_perf_btn"):
                    idx = delete_options.index(selected_delete)
                    delete_id = df_all.iloc[idx]["id"]
                    delete_magaza_performans(delete_id)
                    st.success("Kayit silindi!")
                    st.rerun()

        else:  # CSV'den Aktar (Performans)
            st.markdown("### CSV'den Performans Aktar")

            st.markdown("""
            **CSV Dosya Formati:**
            ```
            magaza_kodu,magaza_adi,yil,ay,fis,satis_adet,fis_basina_adet,ciro,birim_fiyat,iade,oms,stok,kar
            M001,Istanbul Kadikoy,2025,1,5000,15000,3.0,500000,33.33,5000,1000,200000,50000
            ```
            """)

            sample_data = {
                "magaza_kodu": ["M001", "M002"],
                "magaza_adi": ["Ornek Magaza 1", "Ornek Magaza 2"],
                "yil": [2025, 2025],
                "ay": [1, 1],
                "fis": [5000, 3000],
                "satis_adet": [15000, 9000],
                "fis_basina_adet": [3.0, 3.0],
                "ciro": [500000.0, 300000.0],
                "birim_fiyat": [33.33, 33.33],
                "iade": [5000.0, 3000.0],
                "oms": [1000.0, 500.0],
                "stok": [200000.0, 150000.0],
                "kar": [50000.0, 30000.0]
            }
            sample_df = pd.DataFrame(sample_data)
            sample_csv = sample_df.to_csv(index=False, encoding='utf-8-sig')

            st.download_button("Ornek CSV Indir", sample_csv.encode('utf-8-sig'), "ornek_performans.csv", "text/csv")

            uploaded_file = st.file_uploader("CSV Dosyasi Sec", type=["csv"], key="perf_csv")

            if uploaded_file:
                try:
                    preview_df = None
                    delimiters = [',', ';', '\t']
                    encodings = ['utf-8-sig', 'utf-8', 'latin-1', 'cp1254']

                    for encoding in encodings:
                        for delimiter in delimiters:
                            try:
                                uploaded_file.seek(0)
                                preview_df = pd.read_csv(uploaded_file, encoding=encoding, sep=delimiter)
                                if len(preview_df.columns) > 1:
                                    break
                            except:
                                continue
                        if preview_df is not None and len(preview_df.columns) > 1:
                            break

                    if preview_df is None or preview_df.empty or len(preview_df.columns) <= 1:
                        st.error("CSV dosyasi okunamadi.")
                    else:
                        st.markdown("**Onizleme:**")
                        st.dataframe(preview_df.head(10), use_container_width=True, hide_index=True)

                        if st.button("Iceri Aktar", use_container_width=True, type="primary", key="import_perf"):
                            result = save_performans_bulk(preview_df)

                            if result["basarili"] > 0:
                                st.success(f"{result['basarili']} yeni kayit eklendi!")
                            if result["guncellenen"] > 0:
                                st.success(f"{result['guncellenen']} kayit guncellendi!")
                            if result["hatali"] > 0:
                                st.error(f"{result['hatali']} satir hatali:")
                                for hata in result["hatalar"][:10]:
                                    st.caption(f"- {hata}")

                            if result["hatali"] == 0:
                                st.rerun()

                except Exception as e:
                    st.error(f"CSV okuma hatasi: {str(e)}")

    else:  # CSV'den Aktar (Magaza)
        st.markdown("---")
        st.markdown("### CSV'den Magaza Aktar")

        st.markdown("""
        **CSV Dosya Formati:**
        ```
        magaza_kodu,magaza_adi,sehir,bolge,bolge_muduru,kapasite_adet,m2
        M001,Istanbul Kadikoy,Istanbul,Marmara,Ahmet Yilmaz,5000,250
        ```
        """)

        sample_data = {
            "magaza_kodu": ["M001", "M002"],
            "magaza_adi": ["Ornek Magaza 1", "Ornek Magaza 2"],
            "sehir": ["Istanbul", "Ankara"],
            "bolge": ["Marmara", "Ic Anadolu"],
            "bolge_muduru": ["Ali Veli", "Ayse Fatma"],
            "kapasite_adet": [5000, 3000],
            "m2": [250.0, 180.0]
        }
        sample_df = pd.DataFrame(sample_data)
        sample_csv = sample_df.to_csv(index=False, encoding='utf-8-sig')

        st.download_button("Ornek CSV Indir", sample_csv.encode('utf-8-sig'), "ornek_magaza.csv", "text/csv")

        uploaded_file = st.file_uploader("CSV Dosyasi Sec", type=["csv"], key="magaza_csv")

        if uploaded_file:
            try:
                preview_df = None
                delimiters = [',', ';', '\t']
                encodings = ['utf-8-sig', 'utf-8', 'latin-1', 'cp1254']

                for encoding in encodings:
                    for delimiter in delimiters:
                        try:
                            uploaded_file.seek(0)
                            preview_df = pd.read_csv(uploaded_file, encoding=encoding, sep=delimiter)
                            if len(preview_df.columns) > 1:
                                break
                        except:
                            continue
                    if preview_df is not None and len(preview_df.columns) > 1:
                        break

                if preview_df is None or preview_df.empty or len(preview_df.columns) <= 1:
                    st.error("CSV dosyasi okunamadi.")
                else:
                    st.markdown("**Onizleme:**")
                    st.dataframe(preview_df.head(10), use_container_width=True, hide_index=True)

                    if st.button("Iceri Aktar", use_container_width=True, type="primary", key="import_magaza"):
                        result = save_magazalar_bulk(preview_df)

                        if result["basarili"] > 0:
                            st.success(f"{result['basarili']} yeni magaza eklendi!")
                        if result["guncellenen"] > 0:
                            st.success(f"{result['guncellenen']} magaza guncellendi!")
                        if result["hatali"] > 0:
                            st.error(f"{result['hatali']} satir hatali:")
                            for hata in result["hatalar"][:10]:
                                st.caption(f"- {hata}")

                        if result["hatali"] == 0:
                            st.rerun()

            except Exception as e:
                st.error(f"CSV okuma hatasi: {str(e)}")


# =============================================================================
# TAB 3: TUKETIM HESAPLAMA
# =============================================================================
with tab3:
    st.markdown("### Tuketim Hesaplama")

    df_malz = get_malzemeler()

    if df_malz.empty:
        st.info("Hesaplama icin once malzeme tanimlayin.")
    else:
        hesap_modu = st.radio("Hesaplama Modu", ["Tekli Hesaplama", "Toplu Planlama"], horizontal=True)

        if hesap_modu == "Tekli Hesaplama":
            col1, col2 = st.columns(2)

            with col1:
                malzeme_options = df_malz.apply(lambda r: f"{r['malzeme_kodu']} - {r['ad']}", axis=1).tolist()
                selected_malz = st.selectbox("Malzeme Sec", malzeme_options, key="hesap_malz")

                if selected_malz:
                    idx = malzeme_options.index(selected_malz)
                    malz = df_malz.iloc[idx]

                    st.markdown(f"""
                    <div class="info-box">
                        <strong>Tetikleyici:</strong> {malz['tetikleyici'] or 'Belirtilmemis'}<br>
                        <strong>Birim Tuketim:</strong> {malz['birim_tuketim_miktar']} {malz['birim_tuketim_birim']}<br>
                        <strong>Fire:</strong> %{malz['fire_orani']}<br>
                        <strong>Paket:</strong> {malz['toplam_paket_birim_miktar']} {malz['birim_tuketim_birim']}/paket
                    </div>
                    """, unsafe_allow_html=True)

                    tetik_adet = st.number_input(
                        f"{malz['tetikleyici'] or 'Islem'} Adedi",
                        min_value=0,
                        value=10000,
                        step=1000
                    )

                    fire_override = st.slider(
                        "Fire Orani (%)",
                        0, 50,
                        int(malz['fire_orani']),
                        key="fire_slider"
                    )

            with col2:
                if selected_malz and tetik_adet > 0:
                    malz = df_malz.iloc[malzeme_options.index(selected_malz)]

                    teorik = tetik_adet * malz['birim_tuketim_miktar']
                    fire = teorik * (fire_override / 100)
                    net = teorik + fire

                    paket_miktar = malz['toplam_paket_birim_miktar']
                    if paket_miktar > 0:
                        paket_ihtiyac = net / paket_miktar
                    else:
                        paket_ihtiyac = net

                    st.markdown("**Hesaplama Sonuclari**")

                    st.markdown(f"""
                    <div class="result-card">
                        <div class="result-label">Teorik Tuketim</div>
                        <div class="result-value">{teorik:,.1f} {malz['birim_tuketim_birim']}</div>
                    </div>
                    """, unsafe_allow_html=True)

                    st.markdown(f"""
                    <div class="result-card">
                        <div class="result-label">Fire (+%{fire_override})</div>
                        <div class="result-value" style="color: #dc2626;">{fire:,.1f} {malz['birim_tuketim_birim']}</div>
                    </div>
                    """, unsafe_allow_html=True)

                    st.markdown(f"""
                    <div class="result-card" style="border-color: #0369a1; background: #e0f2fe;">
                        <div class="result-label">Net Tuketim</div>
                        <div class="result-value" style="color: #0369a1;">{net:,.1f} {malz['birim_tuketim_birim']}</div>
                    </div>
                    """, unsafe_allow_html=True)

                    st.markdown(f"""
                    <div class="result-card" style="border-color: #166534; background: #dcfce7;">
                        <div class="result-label">Siparis (Paket)</div>
                        <div class="result-value" style="color: #166534;">{math.ceil(paket_ihtiyac)} paket</div>
                    </div>
                    """, unsafe_allow_html=True)

        else:  # Toplu Planlama
            st.markdown("**Tetikleyici Bazli Adetler**")

            # Tetikleyicilere gore malzemeleri grupla
            tetik_gruplar = {}
            for _, row in df_malz.iterrows():
                tetik = row['tetikleyici'] or 'Diger'
                if tetik not in tetik_gruplar:
                    tetik_gruplar[tetik] = []
                tetik_gruplar[tetik].append(row)

            tetik_adetleri = {}
            cols = st.columns(min(len(tetik_gruplar), 4))

            for i, (tetik, malzler) in enumerate(tetik_gruplar.items()):
                with cols[i % 4]:
                    malz_listesi = ", ".join([m["ad"][:15] for m in malzler[:3]])
                    tetik_adetleri[tetik] = st.number_input(
                        tetik,
                        min_value=0,
                        value=10000,
                        step=1000,
                        key=f"toplu_{tetik}",
                        help=f"Malzemeler: {malz_listesi}"
                    )

            if st.button("Hesapla", use_container_width=True):
                sonuclar = []

                for _, malz in df_malz.iterrows():
                    tetik = malz['tetikleyici'] or 'Diger'
                    tetik_adet = tetik_adetleri.get(tetik, 0)

                    if tetik_adet > 0:
                        teorik = tetik_adet * malz['birim_tuketim_miktar']
                        fire = teorik * (malz['fire_orani'] / 100)
                        net = teorik + fire

                        paket_miktar = malz['toplam_paket_birim_miktar'] or 1
                        paket_ihtiyac = math.ceil(net / paket_miktar)

                        sonuclar.append({
                            "Malzeme Kodu": malz['malzeme_kodu'],
                            "Malzeme": malz['ad'],
                            "Tetikleyici": tetik,
                            "Adet": tetik_adet,
                            "Teorik": f"{teorik:,.1f}",
                            "Fire %": malz['fire_orani'],
                            "Net": f"{net:,.1f}",
                            "Birim": malz['birim_tuketim_birim'],
                            "Paket Ihtiyaci": paket_ihtiyac
                        })

                if sonuclar:
                    df_sonuc = pd.DataFrame(sonuclar)
                    st.dataframe(df_sonuc, use_container_width=True, hide_index=True)

                    # Ozet
                    st.markdown("---")
                    col1, col2, col3 = st.columns(3)
                    with col1:
                        st.metric("Toplam Malzeme", len(sonuclar))
                    with col2:
                        st.metric("Toplam Paket", sum(s["Paket Ihtiyaci"] for s in sonuclar))
                    with col3:
                        csv = df_sonuc.to_csv(index=False).encode('utf-8-sig')
                        st.download_button("Rapor Indir", csv, "tuketim_raporu.csv", "text/csv")


# =============================================================================
# TAB 4: AYARLAR
# =============================================================================
with tab4:
    st.markdown("### Sistem Ayarlari")

    ayar_tab1, ayar_tab2, ayar_tab3, ayar_tab4 = st.tabs([
        "Ana Gruplar", "Kaliteler", "Tetikleyiciler", "Sub Gruplar"
    ])

    # Ana Gruplar
    with ayar_tab1:
        st.markdown("**Ana Grup Yonetimi**")

        col1, col2 = st.columns([2, 1])

        with col1:
            ana_gruplar = get_ana_gruplar()
            if ana_gruplar:
                df_ag = pd.DataFrame(ana_gruplar)
                st.dataframe(df_ag[["ad", "aciklama"]], use_container_width=True, hide_index=True)
            else:
                st.info("Henuz ana grup tanimlanmamis.")

        with col2:
            st.markdown("**Yeni Ekle**")
            new_ag_ad = st.text_input("Grup Adi", key="new_ag_ad")
            new_ag_acik = st.text_input("Aciklama", key="new_ag_acik")

            if st.button("Ana Grup Ekle"):
                if new_ag_ad:
                    try:
                        add_ana_grup(new_ag_ad, new_ag_acik)
                        st.success("Eklendi!")
                        st.rerun()
                    except:
                        st.error("Bu isimde grup mevcut.")

            st.markdown("---")
            st.markdown("**CSV'den Aktar**")
            ag_file = st.file_uploader("CSV (ad, aciklama)", type=["csv"], key="ag_csv")
            if ag_file and st.button("Ana Grup Aktar", key="ag_import"):
                import tempfile
                with tempfile.NamedTemporaryFile(delete=False, suffix=".csv") as tmp:
                    tmp.write(ag_file.getvalue())
                    result = import_gruplar_from_csv(tmp.name, "ana_grup")
                    st.success(f"{result['basarili']} grup aktarildi.")
                    st.rerun()

    # Kaliteler
    with ayar_tab2:
        st.markdown("**Kalite Yonetimi**")

        col1, col2 = st.columns([2, 1])

        with col1:
            kaliteler = get_kaliteler()
            if kaliteler:
                df_k = pd.DataFrame(kaliteler)
                st.dataframe(df_k[["ad", "aciklama"]], use_container_width=True, hide_index=True)

        with col2:
            st.markdown("**Yeni Ekle**")
            new_k_ad = st.text_input("Kalite Adi", key="new_k_ad")
            new_k_acik = st.text_input("Aciklama", key="new_k_acik")

            if st.button("Kalite Ekle"):
                if new_k_ad:
                    try:
                        add_kalite(new_k_ad, new_k_acik)
                        st.success("Eklendi!")
                        st.rerun()
                    except:
                        st.error("Bu isimde kalite mevcut.")

    # Tetikleyiciler
    with ayar_tab3:
        st.markdown("**Tetikleyici Yonetimi**")

        col1, col2 = st.columns([2, 1])

        with col1:
            tetikleyiciler = get_tetikleyiciler()
            if tetikleyiciler:
                df_t = pd.DataFrame(tetikleyiciler)
                st.dataframe(df_t[["ad", "aciklama"]], use_container_width=True, hide_index=True)

        with col2:
            st.markdown("**Yeni Ekle**")
            new_t_ad = st.text_input("Tetikleyici Adi", key="new_t_ad")
            new_t_acik = st.text_input("Aciklama", key="new_t_acik")

            if st.button("Tetikleyici Ekle"):
                if new_t_ad:
                    try:
                        add_tetikleyici(new_t_ad, new_t_acik)
                        st.success("Eklendi!")
                        st.rerun()
                    except:
                        st.error("Bu isimde tetikleyici mevcut.")

    # Sub Gruplar
    with ayar_tab4:
        st.markdown("**Sub Group Yonetimi**")

        ana_gruplar = get_ana_gruplar()

        if not ana_gruplar:
            st.info("Once ana grup tanimlayin.")
        else:
            col1, col2 = st.columns([2, 1])

            with col1:
                sub_gruplar = get_sub_gruplar()
                if sub_gruplar:
                    df_sg = pd.DataFrame(sub_gruplar)
                    st.dataframe(df_sg[["ana_grup_ad", "ad", "aciklama"]], use_container_width=True, hide_index=True)
                else:
                    st.info("Henuz sub group tanimlanmamis.")

            with col2:
                st.markdown("**Yeni Ekle**")
                sg_ana = st.selectbox("Ana Grup", [g["ad"] for g in ana_gruplar], key="sg_ana")
                new_sg_ad = st.text_input("Sub Group Adi", key="new_sg_ad")
                new_sg_acik = st.text_input("Aciklama", key="new_sg_acik")

                if st.button("Sub Group Ekle"):
                    if new_sg_ad and sg_ana:
                        ana_id = next((g["id"] for g in ana_gruplar if g["ad"] == sg_ana), None)
                        if ana_id:
                            try:
                                add_sub_grup(ana_id, new_sg_ad, new_sg_acik)
                                st.success("Eklendi!")
                                st.rerun()
                            except:
                                st.error("Bu isimde sub group mevcut.")


# =============================================================================
# TAB 5: STOK ANALIZ
# =============================================================================
with tab5:
    st.markdown("### Stok Analiz")

    stok_mode = st.radio(
        "Islem",
        ["Stok Listesi", "Stok Ekle/Duzenle", "CSV'den Aktar"],
        horizontal=True,
        key="stok_mode"
    )

    if stok_mode == "Stok Listesi":
        # Filtreler
        col_sf1, col_sf2, col_sf3, col_sf4 = st.columns(4)

        stok_yillar = get_stok_yillar()
        yil_options = ["Tumu"] + [str(y) for y in stok_yillar] if stok_yillar else ["Tumu"]

        stok_magazalar = get_stok_magazalar()
        magaza_options = ["Tumu"] + stok_magazalar if stok_magazalar else ["Tumu"]

        with col_sf1:
            filtre_stok_yil = st.selectbox("Yil", yil_options, key="sf_yil")
        with col_sf2:
            filtre_stok_ay = st.selectbox("Ay", ["Tumu"] + [str(i) for i in range(1, 13)], key="sf_ay")
        with col_sf3:
            filtre_stok_magaza = st.selectbox("Magaza", magaza_options, key="sf_magaza")
        with col_sf4:
            filtre_stok_arama = st.text_input("Malzeme Ara", key="sf_arama")

        # Verileri getir
        yil_param = int(filtre_stok_yil) if filtre_stok_yil != "Tumu" else None
        ay_param = int(filtre_stok_ay) if filtre_stok_ay != "Tumu" else None
        magaza_param = filtre_stok_magaza if filtre_stok_magaza != "Tumu" else None

        df_stok = get_magaza_malzeme_stok(yil=yil_param, ay=ay_param, magaza_kodu=magaza_param)

        if not df_stok.empty:
            # Arama filtresi
            if filtre_stok_arama:
                mask = (
                    df_stok["malzeme_kodu"].str.contains(filtre_stok_arama, case=False, na=False) |
                    df_stok["malzeme_adi"].str.contains(filtre_stok_arama, case=False, na=False)
                )
                df_stok = df_stok[mask]

            display_cols = [
                "magaza_kodu", "magaza_adi", "malzeme_kodu", "malzeme_adi",
                "ana_grup", "kalite", "yil", "ay", "stok", "satis", "yol", "stok_satis_oran",
                "ciro", "smm", "brutkar", "stok_tutar",
                "tetikleyici", "birim_tuketim_miktar", "fire_orani",
                "perf_fis", "perf_satis_adet", "perf_ciro"
            ]

            display_names = {
                "magaza_kodu": "Magaza Kodu",
                "magaza_adi": "Magaza Adi",
                "malzeme_kodu": "Malzeme Kodu",
                "malzeme_adi": "Malzeme Adi",
                "ana_grup": "Ana Grup",
                "kalite": "Kalite",
                "yil": "Yil",
                "ay": "Ay",
                "stok": "Stok",
                "satis": "Satis",
                "yol": "Yol",
                "stok_satis_oran": "Stok/Satis",
                "ciro": "Ciro",
                "smm": "SMM",
                "brutkar": "Brut Kar",
                "stok_tutar": "Stok Tutar",
                "tetikleyici": "Tetikleyici",
                "birim_tuketim_miktar": "Birim Tuketim",
                "fire_orani": "Fire %",
                "perf_fis": "Perf. Fis",
                "perf_satis_adet": "Perf. Satis Adet",
                "perf_ciro": "Perf. Ciro"
            }

            available_cols = [c for c in display_cols if c in df_stok.columns]
            df_display = df_stok[available_cols].copy()
            df_display.columns = [display_names.get(c, c) for c in available_cols]

            st.markdown(f"**Toplam: {len(df_display)} kayit**")
            st.dataframe(df_display, use_container_width=True, hide_index=True, height=500)

            csv_data = df_stok.to_csv(index=False, encoding='utf-8-sig')
            st.download_button("CSV Indir", csv_data.encode('utf-8-sig'), "stok_analiz.csv", "text/csv")
        else:
            st.info("Henuz stok verisi tanimlanmamis.")

    elif stok_mode == "Stok Ekle/Duzenle":
        st.markdown("---")
        st.info("""
        **Kullanim:** Tabloya yeni satirlar ekleyin veya mevcut satirlari duzenleyin.
        - **Magaza Kodu**, **Malzeme Kodu**, **Yil** ve **Ay** zorunludur
        - Stok/Satis orani otomatik hesaplanir
        """)

        df_existing = get_magaza_malzeme_stok()

        if df_existing.empty:
            df_edit = pd.DataFrame({
                "magaza_kodu": [""],
                "magaza_adi": [""],
                "malzeme_kodu": [""],
                "yil": [2025],
                "ay": [1],
                "stok": [0.0],
                "satis": [0.0],
                "yol": [0.0],
                "ciro": [0.0],
                "smm": [0.0],
                "brutkar": [0.0],
                "stok_tutar": [0.0]
            })
        else:
            df_edit = df_existing[[
                "magaza_kodu", "magaza_adi", "malzeme_kodu", "yil", "ay",
                "stok", "satis", "yol", "ciro", "smm", "brutkar", "stok_tutar"
            ]].copy()
            df_edit = df_edit.fillna(0)

        column_config = {
            "magaza_kodu": st.column_config.TextColumn("Magaza Kodu", max_chars=50),
            "magaza_adi": st.column_config.TextColumn("Magaza Adi", max_chars=200),
            "malzeme_kodu": st.column_config.TextColumn("Malzeme Kodu", max_chars=50),
            "yil": st.column_config.NumberColumn("Yil", min_value=2000, max_value=2100, format="%d"),
            "ay": st.column_config.NumberColumn("Ay", min_value=1, max_value=12, format="%d"),
            "stok": st.column_config.NumberColumn("Stok", format="%.2f"),
            "satis": st.column_config.NumberColumn("Satis", format="%.2f"),
            "yol": st.column_config.NumberColumn("Yol", format="%.2f"),
            "ciro": st.column_config.NumberColumn("Ciro", format="%.2f"),
            "smm": st.column_config.NumberColumn("SMM", format="%.2f"),
            "brutkar": st.column_config.NumberColumn("Brut Kar", format="%.2f"),
            "stok_tutar": st.column_config.NumberColumn("Stok Tutar", format="%.2f")
        }

        edited_df = st.data_editor(
            df_edit,
            column_config=column_config,
            num_rows="dynamic",
            use_container_width=True,
            hide_index=True,
            key="stok_editor"
        )

        col_save, col_clear = st.columns([1, 1])

        with col_save:
            if st.button("Degisiklikleri Kaydet", use_container_width=True, type="primary", key="save_stok"):
                edited_df = edited_df.dropna(subset=["magaza_kodu", "malzeme_kodu"], how="all")
                edited_df = edited_df[
                    (edited_df["magaza_kodu"].astype(str).str.strip() != "") &
                    (edited_df["malzeme_kodu"].astype(str).str.strip() != "")
                ]

                if edited_df.empty:
                    st.warning("Kaydedilecek kayit bulunamadi.")
                else:
                    result = save_magaza_malzeme_stok_bulk(edited_df)

                    if result["basarili"] > 0:
                        st.success(f"{result['basarili']} yeni kayit eklendi!")
                    if result["guncellenen"] > 0:
                        st.success(f"{result['guncellenen']} kayit guncellendi!")
                    if result["hatali"] > 0:
                        st.error(f"{result['hatali']} satir hatali:")
                        for hata in result["hatalar"][:10]:
                            st.caption(f"- {hata}")

                    if result["hatali"] == 0:
                        st.rerun()

        with col_clear:
            if st.button("Tabloyu Sifirla", use_container_width=True, key="clear_stok"):
                st.rerun()

        # Silme
        st.markdown("---")
        st.markdown("**Stok Kaydi Sil**")
        df_all = get_magaza_malzeme_stok()
        if not df_all.empty:
            delete_options = df_all.apply(
                lambda r: f"{r['magaza_kodu']} - {r['malzeme_kodu']} - {r['yil']}/{r['ay']}", axis=1
            ).tolist()
            selected_delete = st.selectbox("Silinecek Kayit", ["Seciniz"] + delete_options, key="delete_stok")

            if selected_delete != "Seciniz" and st.button("Secili Kaydi Sil", type="secondary", key="del_stok_btn"):
                idx = delete_options.index(selected_delete)
                delete_id = df_all.iloc[idx]["id"]
                delete_magaza_malzeme_stok(delete_id)
                st.success("Kayit silindi!")
                st.rerun()

    else:  # CSV'den Aktar
        st.markdown("---")
        st.markdown("### CSV'den Stok Verisi Aktar")

        st.markdown("""
        **CSV Dosya Formati:**
        ```
        magaza_kodu,magaza_adi,malzeme_kodu,yil,ay,stok,satis,yol,ciro,smm,brutkar,stok_tutar
        M001,Istanbul Kadikoy,SRF001,2025,1,1000,500,50,25000,15000,10000,20000
        ```

        **Zorunlu Alanlar:** magaza_kodu, malzeme_kodu, yil, ay
        """)

        sample_data = {
            "magaza_kodu": ["M001", "M001", "M002"],
            "magaza_adi": ["Istanbul Kadikoy", "Istanbul Kadikoy", "Ankara Kizilay"],
            "malzeme_kodu": ["SRF001", "SRF002", "SRF001"],
            "yil": [2025, 2025, 2025],
            "ay": [1, 1, 1],
            "stok": [1000.0, 500.0, 800.0],
            "satis": [500.0, 200.0, 400.0],
            "yol": [50.0, 20.0, 30.0],
            "ciro": [25000.0, 10000.0, 20000.0],
            "smm": [15000.0, 6000.0, 12000.0],
            "brutkar": [10000.0, 4000.0, 8000.0],
            "stok_tutar": [20000.0, 10000.0, 16000.0]
        }
        sample_df = pd.DataFrame(sample_data)
        sample_csv = sample_df.to_csv(index=False, encoding='utf-8-sig')

        st.download_button("Ornek CSV Indir", sample_csv.encode('utf-8-sig'), "ornek_stok.csv", "text/csv")

        uploaded_file = st.file_uploader("CSV Dosyasi Sec", type=["csv"], key="stok_csv")

        if uploaded_file:
            try:
                preview_df = None
                delimiters = [',', ';', '\t']
                encodings = ['utf-8-sig', 'utf-8', 'latin-1', 'cp1254']

                for encoding in encodings:
                    for delimiter in delimiters:
                        try:
                            uploaded_file.seek(0)
                            preview_df = pd.read_csv(uploaded_file, encoding=encoding, sep=delimiter)
                            if len(preview_df.columns) > 1:
                                break
                        except:
                            continue
                    if preview_df is not None and len(preview_df.columns) > 1:
                        break

                if preview_df is None or preview_df.empty or len(preview_df.columns) <= 1:
                    st.error("CSV dosyasi okunamadi.")
                else:
                    st.markdown("**Onizleme:**")
                    st.dataframe(preview_df.head(10), use_container_width=True, hide_index=True)

                    if st.button("Iceri Aktar", use_container_width=True, type="primary", key="import_stok"):
                        result = save_magaza_malzeme_stok_bulk(preview_df)

                        if result["basarili"] > 0:
                            st.success(f"{result['basarili']} yeni kayit eklendi!")
                        if result["guncellenen"] > 0:
                            st.success(f"{result['guncellenen']} kayit guncellendi!")
                        if result["hatali"] > 0:
                            st.error(f"{result['hatali']} satir hatali:")
                            for hata in result["hatalar"][:10]:
                                st.caption(f"- {hata}")

                        if result["hatali"] == 0:
                            st.rerun()

            except Exception as e:
                st.error(f"CSV okuma hatasi: {str(e)}")


# =============================================================================
# TAB 6: IHTIYAC & SIPARIS
# =============================================================================
with tab6:
    st.markdown("### Ihtiyac Analizi & Siparis/Sevk Onerisi")

    ihtiyac_mode = st.radio(
        "Islem",
        ["Ihtiyac Hesapla", "Sevk Plani", "Siparis Onerisi", "Ozet Rapor"],
        horizontal=True,
        key="ihtiyac_mode"
    )

    df_malz = get_malzemeler()
    df_mag = get_magazalar()

    if df_malz.empty:
        st.warning("Once malzeme tanimlayin.")
    elif df_mag.empty:
        st.warning("Once magaza tanimlayin.")
    else:
        if ihtiyac_mode == "Ihtiyac Hesapla":
            st.markdown("---")
            st.markdown("#### Magaza Bazli Ihtiyac Hesaplama")

            # Filtreler
            col_f1, col_f2, col_f3 = st.columns(3)

            with col_f1:
                magaza_options = ["Tum Magazalar"] + df_mag["magaza_kodu"].tolist()
                secili_magaza = st.selectbox("Magaza", magaza_options, key="ih_magaza")

            with col_f2:
                malzeme_options = ["Tum Malzemeler"] + df_malz["malzeme_kodu"].tolist()
                secili_malzeme = st.selectbox("Malzeme", malzeme_options, key="ih_malzeme")

            with col_f3:
                planlama_donem = st.number_input("Planlama Donemi (Gun)", min_value=1, max_value=90, value=30, key="ih_donem")

            # Stok verilerini al
            df_stok = get_magaza_malzeme_stok()

            if st.button("Ihtiyac Hesapla", type="primary", use_container_width=True, key="btn_ihtiyac"):
                if df_stok.empty:
                    st.warning("Stok verisi bulunamadi. Once Stok Analiz sekmesinden veri girin.")
                else:
                    # Hesaplama
                    sonuclar = []

                    # Magazalari filtrele
                    magazalar = df_mag if secili_magaza == "Tum Magazalar" else df_mag[df_mag["magaza_kodu"] == secili_magaza]

                    # Malzemeleri filtrele
                    malzemeler = df_malz if secili_malzeme == "Tum Malzemeler" else df_malz[df_malz["malzeme_kodu"] == secili_malzeme]

                    for _, mag in magazalar.iterrows():
                        for _, malz in malzemeler.iterrows():
                            # Mevcut stok
                            stok_row = df_stok[
                                (df_stok["magaza_kodu"] == mag["magaza_kodu"]) &
                                (df_stok["malzeme_kodu"] == malz["malzeme_kodu"])
                            ]

                            if stok_row.empty:
                                magaza_stok = 0
                                gunluk_satis = 0
                            else:
                                magaza_stok = stok_row.iloc[0].get("stok", 0) or 0
                                satis = stok_row.iloc[0].get("satis", 0) or 0
                                gunluk_satis = satis / 30  # Aylik satisi gunluge cevir

                            # Planlama donemi icin ihtiyac
                            donem_ihtiyaci = gunluk_satis * planlama_donem

                            # Fire dahil ihtiyac
                            fire_orani = malz.get("fire_orani", 0) or 0
                            net_ihtiyac = donem_ihtiyaci * (1 + fire_orani / 100)

                            # Guvenlik stok
                            guvenlik = malz.get("guvenlik_stok", 0) or 0

                            # Toplam ihtiyac
                            toplam_ihtiyac = net_ihtiyac + guvenlik - magaza_stok

                            # Sevk/Siparis durumu
                            depo_stok = malz.get("depo_stok", 0) or 0
                            min_sevk = malz.get("min_sevk_miktari", 1) or 1
                            min_siparis = malz.get("min_siparis_miktari", 1) or 1

                            if toplam_ihtiyac <= 0:
                                aksiyon = "Stok Yeterli"
                                sevk_miktar = 0
                                siparis_miktar = 0
                            elif depo_stok >= toplam_ihtiyac:
                                aksiyon = "Depodan Sevk"
                                sevk_miktar = max(toplam_ihtiyac, min_sevk)
                                siparis_miktar = 0
                            elif depo_stok > 0:
                                aksiyon = "Sevk + Siparis"
                                sevk_miktar = depo_stok
                                siparis_miktar = max(toplam_ihtiyac - depo_stok, min_siparis)
                            else:
                                aksiyon = "Uretici Siparis"
                                sevk_miktar = 0
                                siparis_miktar = max(toplam_ihtiyac, min_siparis)

                            if toplam_ihtiyac > 0 or magaza_stok > 0:
                                sonuclar.append({
                                    "Magaza": mag["magaza_kodu"],
                                    "Malzeme": malz["malzeme_kodu"],
                                    "Malzeme Adi": malz["ad"][:20] if malz["ad"] else "",
                                    "Magaza Stok": round(magaza_stok, 1),
                                    "Gunluk Satis": round(gunluk_satis, 2),
                                    "Donem Ihtiyac": round(net_ihtiyac, 1),
                                    "Guvenlik Stok": round(guvenlik, 1),
                                    "Net Ihtiyac": round(max(toplam_ihtiyac, 0), 1),
                                    "Depo Stok": round(depo_stok, 1),
                                    "Aksiyon": aksiyon,
                                    "Sevk Miktar": round(sevk_miktar, 1),
                                    "Siparis Miktar": round(siparis_miktar, 1),
                                    "Yol Suresi": mag.get("yol_suresi", 1),
                                    "Tedarik Suresi": malz.get("ortalama_tedarik_suresi", 0)
                                })

                    if sonuclar:
                        df_sonuc = pd.DataFrame(sonuclar)

                        # Ozet metrikler
                        col_m1, col_m2, col_m3, col_m4 = st.columns(4)
                        with col_m1:
                            st.metric("Toplam Kayit", len(df_sonuc))
                        with col_m2:
                            sevk_gerekli = len(df_sonuc[df_sonuc["Aksiyon"].str.contains("Sevk")])
                            st.metric("Sevk Gerekli", sevk_gerekli)
                        with col_m3:
                            siparis_gerekli = len(df_sonuc[df_sonuc["Aksiyon"].str.contains("Siparis")])
                            st.metric("Siparis Gerekli", siparis_gerekli)
                        with col_m4:
                            yeterli = len(df_sonuc[df_sonuc["Aksiyon"] == "Stok Yeterli"])
                            st.metric("Stok Yeterli", yeterli)

                        st.markdown("---")

                        # Renk kodlu tablo
                        def highlight_aksiyon(row):
                            if row["Aksiyon"] == "Stok Yeterli":
                                return ['background-color: #dcfce7'] * len(row)
                            elif row["Aksiyon"] == "Depodan Sevk":
                                return ['background-color: #fef3c7'] * len(row)
                            elif row["Aksiyon"] == "Uretici Siparis":
                                return ['background-color: #fee2e2'] * len(row)
                            else:
                                return ['background-color: #fce7f3'] * len(row)

                        st.dataframe(
                            df_sonuc.style.apply(highlight_aksiyon, axis=1),
                            use_container_width=True,
                            hide_index=True,
                            height=500
                        )

                        # CSV indir
                        csv_data = df_sonuc.to_csv(index=False, encoding='utf-8-sig')
                        st.download_button(
                            "CSV Indir",
                            csv_data.encode('utf-8-sig'),
                            f"ihtiyac_analizi_{planlama_donem}gun.csv",
                            "text/csv"
                        )
                    else:
                        st.info("Hesaplanacak veri bulunamadi.")

        elif ihtiyac_mode == "Sevk Plani":
            st.markdown("---")
            st.markdown("#### Depodan Magazaya Sevk Plani")

            st.info("Depo stogu mevcut olan malzemeler icin magaza sevk onerisi")

            # Sadece depo stogu olan malzemeleri goster
            df_depo_var = df_malz[df_malz["depo_stok"] > 0]

            if df_depo_var.empty:
                st.warning("Depo stogu bulunan malzeme yok. Malzeme tanimlarindan depo stok giriniz.")
            else:
                st.markdown(f"**{len(df_depo_var)} malzemede depo stogu mevcut**")

                sevk_data = []
                for _, malz in df_depo_var.iterrows():
                    sevk_data.append({
                        "Malzeme Kodu": malz["malzeme_kodu"],
                        "Malzeme Adi": malz["ad"][:25] if malz["ad"] else "",
                        "Depo Stok": malz["depo_stok"],
                        "Min Sevk": malz["min_sevk_miktari"],
                        "Tedarik Suresi": malz["ortalama_tedarik_suresi"],
                        "Guvenlik Stok": malz["guvenlik_stok"]
                    })

                df_sevk = pd.DataFrame(sevk_data)
                st.dataframe(df_sevk, use_container_width=True, hide_index=True)

        elif ihtiyac_mode == "Siparis Onerisi":
            st.markdown("---")
            st.markdown("#### Uretici Siparis Onerisi")

            st.info("Depo stogu yetersiz olan malzemeler icin uretici siparis onerisi")

            # Depo stogu dusuk veya yok olan malzemeleri bul
            siparis_data = []

            for _, malz in df_malz.iterrows():
                depo_stok = malz.get("depo_stok", 0) or 0
                guvenlik = malz.get("guvenlik_stok", 0) or 0
                min_siparis = malz.get("min_siparis_miktari", 1) or 1

                # Depo stogu guvenlik stokunun altindaysa siparis onerisi
                if depo_stok < guvenlik:
                    siparis_miktar = max(guvenlik - depo_stok, min_siparis)
                    siparis_data.append({
                        "Malzeme Kodu": malz["malzeme_kodu"],
                        "Malzeme Adi": malz["ad"][:25] if malz["ad"] else "",
                        "Depo Stok": depo_stok,
                        "Guvenlik Stok": guvenlik,
                        "Eksik": guvenlik - depo_stok,
                        "Min Siparis": min_siparis,
                        "Onerilen Siparis": siparis_miktar,
                        "Uretici": malz.get("uretici_adi", ""),
                        "Tedarik Suresi (Gun)": malz.get("ortalama_tedarik_suresi", 0)
                    })

            if siparis_data:
                df_siparis = pd.DataFrame(siparis_data)

                # Ozet
                st.metric("Siparis Gereken Malzeme", len(df_siparis))

                st.dataframe(
                    df_siparis,
                    use_container_width=True,
                    hide_index=True,
                    height=400
                )

                # CSV indir
                csv_data = df_siparis.to_csv(index=False, encoding='utf-8-sig')
                st.download_button(
                    "Siparis Listesi Indir",
                    csv_data.encode('utf-8-sig'),
                    "siparis_onerisi.csv",
                    "text/csv"
                )
            else:
                st.success("Tum malzemelerin depo stogu yeterli seviyede.")

        else:  # Ozet Rapor
            st.markdown("---")
            st.markdown("#### Genel Ozet Rapor")

            col1, col2 = st.columns(2)

            with col1:
                st.markdown("**Malzeme Durumu**")

                toplam_malzeme = len(df_malz)
                depo_stok_var = len(df_malz[df_malz["depo_stok"] > 0])
                depo_stok_yok = toplam_malzeme - depo_stok_var

                st.metric("Toplam Malzeme", toplam_malzeme)
                st.metric("Depo Stogu Olan", depo_stok_var)
                st.metric("Depo Stogu Olmayan", depo_stok_yok)

                # Tetikleyici bazli dagilim
                st.markdown("**Tetikleyici Dagilimi**")
                tetik_dagilim = df_malz.groupby("tetikleyici").size().reset_index(name="Adet")
                st.dataframe(tetik_dagilim, use_container_width=True, hide_index=True)

            with col2:
                st.markdown("**Magaza Durumu**")

                toplam_magaza = len(df_mag)
                st.metric("Toplam Magaza", toplam_magaza)

                # Bolge bazli dagilim
                if "bolge" in df_mag.columns:
                    st.markdown("**Bolge Dagilimi**")
                    bolge_dagilim = df_mag.groupby("bolge").size().reset_index(name="Magaza Sayisi")
                    st.dataframe(bolge_dagilim, use_container_width=True, hide_index=True)

            st.markdown("---")
            st.markdown("**Kritik Stok Uyarilari**")

            # Guvenlik stokunun altinda depo stogu olan malzemeler
            kritik = df_malz[df_malz["depo_stok"] < df_malz["guvenlik_stok"]]

            if not kritik.empty:
                st.warning(f"{len(kritik)} malzemede depo stogu guvenlik stokunun altinda!")
                kritik_display = kritik[["malzeme_kodu", "ad", "depo_stok", "guvenlik_stok"]].copy()
                kritik_display["Eksik"] = kritik_display["guvenlik_stok"] - kritik_display["depo_stok"]
                st.dataframe(kritik_display, use_container_width=True, hide_index=True)
            else:
                st.success("Kritik stok uyarisi yok.")


# Footer
st.markdown("---")
st.caption("EnglishHome - Sarf Malzeme Yonetimi v2.1 | Veriler otomatik kaydedilir")
