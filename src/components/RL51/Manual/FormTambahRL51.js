import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { Link, useNavigate } from "react-router-dom";
import { HiSaveAs } from "react-icons/hi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Spinner } from "react-bootstrap";
import { useCSRFTokenContext } from "../../Context/CSRFTokenContext";
import { ArrowLeft, Search, ArrowRight } from "react-bootstrap-icons";
// Tampilan sama dengan RL 4.1: pakai CSS yang sama agar selalu seragam
import style from "./FormTambahRL51.module.css"; // kelas tabel standar
import css from "./FormTambahRL51.module.css"; // tata letak lembar kerja
import ProfilRSRingkas from "../../Shared/ProfilRSRingkas";
import pf from "../../Shared/ProfilRSRingkas.module.css";

// Golongan umur RL 5.1 (jumlah kasus baru). Nama field dikirim ke server
// apa adanya (jangan diubah). Baris terakhir: Jumlah Kunjungan Pasien.
const GOLONGAN_UMUR = [
  ["< 1 Jam", "dibawah_1_jam"],
  ["1 - 23 Jam", "1_sampai_23_jam"],
  ["1 - 7 Hari", "1_sampai_7_hari"],
  ["8 - 28 Hari", "8_sampai_28_hari"],
  ["29 Hari - <3 Bulan", "29_hari_sampai_dibawah_3_bulan"],
  ["3 - <6 Bulan", "3_bulan_sampai_dibawah_6_bulan"],
  ["6 - 11 Bulan", "6_bulan_sampai_11_bulan"],
  ["1 - 4 Tahun", "1_sampai_4_tahun"],
  ["5 - 9 Tahun", "5_sampai_9_tahun"],
  ["10 - 14 Tahun", "10_sampai_14_tahun"],
  ["15 - 19 Tahun", "15_sampai_19_tahun"],
  ["20 - 24 Tahun", "20_sampai_24_tahun"],
  ["25 - 29 Tahun", "25_sampai_29_tahun"],
  ["30 - 34 Tahun", "30_sampai_34_tahun"],
  ["35 - 39 Tahun", "35_sampai_39_tahun"],
  ["40 - 44 Tahun", "40_sampai_44_tahun"],
  ["45 - 49 Tahun", "45_sampai_49_tahun"],
  ["50 - 54 Tahun", "50_sampai_54_tahun"],
  ["55 - 59 Tahun", "55_sampai_59_tahun"],
  ["60 - 64 Tahun", "60_sampai_64_tahun"],
  ["65 - 69 Tahun", "65_sampai_69_tahun"],
  ["70 - 74 Tahun", "70_sampai_74_tahun"],
  ["75 - 79 Tahun", "75_sampai_79_tahun"],
  ["80 - 84 Tahun", "80_sampai_84_tahun"],
  ["≥ 85 Tahun", "diatas_85_tahun"],
].map(([label, k]) => ({ label, namaL: `jumlah_L_${k}`, namaP: `jumlah_P_${k}` }));

const KUNJUNGAN = { namaL: "jumlah_kunjungan_L", namaP: "jumlah_kunjungan_P" };

// Isian dibagi dua kolom dengan jumlah baris sama (13 + 12)
const KOLOM_KIRI = GOLONGAN_UMUR.slice(0, 13);
const KOLOM_KANAN = GOLONGAN_UMUR.slice(13);

const SEMUA_NAMA = [...GOLONGAN_UMUR, KUNJUNGAN].flatMap((g) => [
  g.namaL,
  g.namaP,
]);

const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const angkaKosong = () =>
  Object.fromEntries(SEMUA_NAMA.map((nama) => [nama, 0]));

const FormTambahRL51 = () => {
  // Default periode: bulan lalu (Januari -> Desember tahun sebelumnya)
  const bulanLalu = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
  const [tahun, setTahun] = useState(String(bulanLalu.getFullYear()));
  const [bulan, setBulan] = useState(
    String(bulanLalu.getMonth() + 1).padStart(2, "0"),
  );
  const [kodeRS, setKodeRS] = useState("");
  const [profilRS, setProfilRS] = useState(null);
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");

  // Pencarian
  const [caripenyakit, setCariPenyakit] = useState("");
  const [dataPenyakit, setDataPenyakit] = useState([]);
  const [sudahCari, setSudahCari] = useState(false);
  const [aktif, setAktif] = useState(-1); // hasil yang disorot keyboard
  const [spinnerSearch, setSpinnerSearch] = useState(false);

  // Penyakit terpilih & isian
  const [terpilih, setTerpilih] = useState(null); // { id, kode, deskripsi }
  const [status, setStatus] = useState({ laki: 1, perempuan: 1 });
  const [angka, setAngka] = useState(angkaKosong);
  const [spinner, setSpinner] = useState(false);
  const [buttonStatus, setButtonStatus] = useState(false);

  const navigate = useNavigate();
  const { CSRFToken } = useCSRFTokenContext();
  const searchRef = useRef(null);
  const formRef = useRef(null);
  const cariKe = useRef(0); // abaikan hasil pencarian yang sudah usang

  const startYear = 2025;
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = startYear; y <= currentYear; y++) {
    years.push(y);
  }

  useEffect(() => {
    refreshToken();
    searchRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshToken = async () => {
    try {
      const response = await axios.get("/apisirs6v2/token", {
        headers: { "XSRF-TOKEN": CSRFToken },
      });
      setToken(response.data.accessToken);
      const decoded = jwt_decode(response.data.accessToken);
      setExpire(decoded.exp);
      setKodeRS(String(decoded.satKerId));
      getRumahSakit(decoded.satKerId, response.data.accessToken);
    } catch (error) {
      if (error.response) {
        navigate("/");
      }
    }
  };

  const axiosJWT = axios.create();
  axiosJWT.interceptors.request.use(
    async (config) => {
      const currentDate = new Date();
      if (expire * 1000 < currentDate.getTime()) {
        const response = await axios.get("/apisirs6v2/token", {
          headers: { "XSRF-TOKEN": CSRFToken },
        });
        config.headers.Authorization = `Bearer ${response.data.accessToken}`;
        setToken(response.data.accessToken);
        const decoded = jwt_decode(response.data.accessToken);
        setExpire(decoded.exp);
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  const getRumahSakit = async (id, accessToken) => {
    try {
      const response = await axios.get("/apisirs6v2/rumahsakit/" + id, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setProfilRS(response.data.data);
    } catch (error) {}
  };

  // ---------- Pencarian otomatis (jeda 400ms setelah berhenti mengetik) ----------
  const cariPenyakit = async (kata) => {
    const ke = ++cariKe.current;
    setSpinnerSearch(true);
    try {
      const response = await axiosJWT.get(
        "/apisirs6v2/icd/rawat_jalan/find?search=" + encodeURIComponent(kata),
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (ke !== cariKe.current) return; // sudah ada pencarian yang lebih baru
      setDataPenyakit(response.data.data || []);
      setAktif(-1);
      setSudahCari(true);
    } catch (error) {
      if (ke === cariKe.current) {
        setDataPenyakit([]);
        setSudahCari(true);
      }
    } finally {
      if (ke === cariKe.current) setSpinnerSearch(false);
    }
  };

  useEffect(() => {
    if (terpilih || !token) return;
    const kata = caripenyakit.trim();
    if (kata.length < 2) {
      cariKe.current++;
      setDataPenyakit([]);
      setSudahCari(false);
      setSpinnerSearch(false);
      return;
    }
    const t = setTimeout(() => cariPenyakit(kata), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caripenyakit, token, terpilih]);

  const onSearchKeyDown = (e) => {
    if (e.key === "ArrowDown" && dataPenyakit.length) {
      e.preventDefault();
      setAktif((i) => Math.min(i + 1, dataPenyakit.length - 1));
    } else if (e.key === "ArrowUp" && dataPenyakit.length) {
      e.preventDefault();
      setAktif((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (aktif >= 0 && dataPenyakit[aktif]) {
        pilihPenyakit(dataPenyakit[aktif]);
      } else if (dataPenyakit.length === 1) {
        pilihPenyakit(dataPenyakit[0]);
      } else if (caripenyakit.trim().length >= 2) {
        cariPenyakit(caripenyakit.trim());
      }
    }
  };

  // ---------- Pilih penyakit ----------
  const pilihPenyakit = async (penyakit) => {
    setSpinner(true);
    try {
      const response = await axiosJWT.get(
        "/apisirs6v2/icd/rawat_jalan/id?id=" + penyakit.id,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const detail = response.data.data[0] || {};
      setTerpilih({
        id: penyakit.id,
        kode: penyakit.icd_code,
        deskripsi: penyakit.description_code || detail.nama,
      });
      setStatus({
        laki: detail.status_laki,
        perempuan: detail.status_perempuan,
      });
      setAngka(angkaKosong());
      // fokus ke kotak isian pertama yang bisa diisi
      setTimeout(() => {
        formRef.current?.querySelector("input[data-nav]:not(:disabled)")?.focus();
      }, 0);
    } catch (error) {
      toast("Gagal memuat detail penyakit, silakan coba lagi", {
        position: toast.POSITION.TOP_RIGHT,
      });
    } finally {
      setSpinner(false);
    }
  };

  const gantiPenyakit = () => {
    setTerpilih(null);
    setAngka(angkaKosong());
    setTimeout(() => searchRef.current?.focus(), 0);
  };

  // ---------- Isian angka ----------
  const ubahAngka = (nama, nilaiBaru) => {
    // hanya angka, maksimal 7 digit, tanpa minus
    const bersih = String(nilaiBaru).replace(/\D/g, "").slice(0, 7);
    setAngka((a) => ({ ...a, [nama]: bersih === "" ? "" : Number(bersih) }));
  };

  const nilai = (nama) => Number(angka[nama]) || 0;

  // Enter = pindah ke kotak isian berikutnya (urutan umur, L lalu P)
  const onInputKeyDown = (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const semua = Array.from(
      formRef.current.querySelectorAll("input[data-nav]:not(:disabled)"),
    );
    const berikut = semua[semua.indexOf(e.currentTarget) + 1];
    if (berikut) berikut.focus();
  };

  const kotakAngka = (nama, terkunci, extraClass = "") => (
    <input
      type="number"
      inputMode="numeric"
      data-nav
      name={nama}
      className={`form-control ${extraClass}`}
      value={angka[nama]}
      min={0}
      disabled={terkunci}
      onChange={(e) => ubahAngka(nama, e.target.value)}
      onBlur={() => angka[nama] === "" && ubahAngka(nama, 0)}
      onFocus={(e) => e.target.select()}
      onKeyDown={onInputKeyDown}
      onWheel={(e) => e.currentTarget.blur()} // cegah angka berubah karena scroll
    />
  );

  const lakiTerkunci = status.laki === 0;
  const perempuanTerkunci = status.perempuan === 0;

  const totalL = GOLONGAN_UMUR.reduce((j, g) => j + nilai(g.namaL), 0);
  const totalP = GOLONGAN_UMUR.reduce((j, g) => j + nilai(g.namaP), 0);
  const total = totalL + totalP;
  // Kasus baru tidak boleh melebihi jumlah kunjungan pada jenis kelamin yang sama
  // (nama variabel *Mati dipertahankan agar sama dengan form RL 4.1)
  const kunjunganL = nilai(KUNJUNGAN.namaL);
  const kunjunganP = nilai(KUNJUNGAN.namaP);
  const totalMati = kunjunganL + kunjunganP; // total kunjungan
  const matiLValid = totalL <= kunjunganL;
  const matiPValid = totalP <= kunjunganP;
  const matiValid = matiLValid && matiPValid;
  const pesanMati = [
    !matiLValid && `Laki-laki: kasus baru ${totalL} > kunjungan ${kunjunganL}`,
    !matiPValid && `Perempuan: kasus baru ${totalP} > kunjungan ${kunjunganP}`,
  ]
    .filter(Boolean)
    .join(", ");

  // ---------- Simpan ----------
  const simpan = async (lanjut) => {
    if (!terpilih) return;
    if (bulan === "00" || Number(bulan) === 0 || !tahun) {
      toast("Data tidak bisa disimpan karena belum pilih periode bulan laporan", {
        position: toast.POSITION.TOP_RIGHT,
      });
      return;
    }
    if (!matiValid) {
      toast(
        `Data Gagal Disimpan, Jumlah Kasus Baru melebihi Jumlah Kunjungan Pasien (${pesanMati})`,
        { position: toast.POSITION.TOP_RIGHT },
      );
      return;
    }

    // Format data sama persis dengan versi sebelumnya
    const transformedObject = Object.fromEntries(
      SEMUA_NAMA.map((nama) => [nama, nilai(nama)]),
    );
    transformedObject.icdId = terpilih.id; // RL 5.1: icdId di dalam data
    const dataReady = {
      periodeBulan: parseInt(bulan, 10),
      periodeTahun: parseInt(tahun, 10),
      data: [transformedObject],
    };

    setButtonStatus(true);
    try {
      await axiosJWT.post("/apisirs6v2/rllimatitiksatu", dataReady, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "XSRF-TOKEN": CSRFToken,
        },
      });
      toast(`Data ${terpilih.kode} berhasil disimpan`, {
        position: toast.POSITION.TOP_RIGHT,
      });
      if (lanjut) {
        // Tetap di halaman: kosongkan isian, periode tetap, kembali ke cari
        setTerpilih(null);
        setAngka(angkaKosong());
        setCariPenyakit("");
        setDataPenyakit([]);
        setSudahCari(false);
        setButtonStatus(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
        setTimeout(() => searchRef.current?.focus(), 0);
      } else {
        setTimeout(() => navigate("/rl51"), 1000);
      }
    } catch (error) {
      toast(
        `Data tidak bisa disimpan karena, ${
          error.response?.data?.message || error.message
        }`,
        { position: toast.POSITION.TOP_RIGHT },
      );
      setButtonStatus(false);
    }
  };

  // barisMati = true: tambahkan baris "Jumlah Kunjungan Pasien" di akhir
  const tabelUmur = (daftar, nomorAwal, barisMati = false) => (
    // Tabel standar (RL41.module.css); lebar 100% menimpa .table (400%).
    // Kolom cokelat: No. dan Golongan Umur.
    <table
      className={`${style.table} ${css.ageTable}`}
      style={{ width: "100%" }}
      data-kolom-cokelat="2"
    >
      <colgroup>
        <col style={{ width: "56px" }} />
        <col />
        <col style={{ width: "24%" }} />
        <col style={{ width: "24%" }} />
      </colgroup>
      <thead className={style.thead}>
        <tr>
          <th>No.</th>
          <th>Golongan Umur</th>
          <th>Laki-laki</th>
          <th>Perempuan</th>
        </tr>
      </thead>
      <tbody>
        {daftar.map((g, i) => (
          <tr key={g.namaL}>
            <td className={css.noCell}>{nomorAwal + i}</td>
            <td className={css.ageLabel}>{g.label}</td>
            <td>{kotakAngka(g.namaL, lakiTerkunci)}</td>
            <td>{kotakAngka(g.namaP, perempuanTerkunci)}</td>
          </tr>
        ))}
        {barisMati && (
          <tr className={css.matiRow}>
            <td className={css.noCell}></td>
            <td className={`${css.ageLabel} ${css.matiLabel}`}>
              <strong>Jumlah Kunjungan Pasien</strong>
            </td>
            <td>
              {kotakAngka(
                KUNJUNGAN.namaL,
                lakiTerkunci,
                matiLValid ? "" : css.inputBad,
              )}
            </td>
            <td>
              {kotakAngka(
                KUNJUNGAN.namaP,
                perempuanTerkunci,
                matiPValid ? "" : css.inputBad,
              )}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );

  return (
    <div className="container" style={{ marginTop: "70px", marginBottom: "40px" }}>
      <ToastContainer />

      {/* jarak antar-card (Kembali, profil RS, periode, tabel) sama: 1rem */}
      <Link
        to={`/rl51`}
        className="gl-back"
        style={{ "--gl-back-gap": "1rem" }}
      >
        <span className="gl-back-icon" aria-hidden="true">
          <ArrowLeft size={18} />
        </span>
        <span className="gl-back-text">
          <small>Kembali ke</small>
          <strong>RL 5.1 Morbiditas Pasien Rawat Jalan</strong>
        </span>
      </Link>

      {/* ① Periode laporan (di dalam card profil RS) */}
      <ProfilRSRingkas kode={kodeRS} rs={profilRS}>
        <div className={pf.periode}>
          <span className={pf.periodeLabel}>① Periode Laporan</span>
          <select
            id="bulan"
            className={`form-select ${pf.pilih}`}
            value={String(bulan).padStart(2, "0")}
            onChange={(e) => setBulan(e.target.value)}
            aria-label="Bulan"
          >
            {BULAN.map((b, i) => (
              <option key={b} value={String(i + 1).padStart(2, "0")}>
                {b}
              </option>
            ))}
          </select>
          <select
            id="tahun"
            className={`form-select ${pf.pilih}`}
            value={tahun}
            onChange={(e) => setTahun(e.target.value)}
            aria-label="Tahun"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </ProfilRSRingkas>

      {/* ② Cari penyakit */}
      <div className="card mt-3">
        <div className="card-body">
          <div className={css.searchBar}>
            <div style={{ flex: "1 1 320px" }}>
              <span className={css.stepLabel}>② Penyakit (ICD 10)</span>
              {terpilih ? (
                <div className={css.chosen}>
                  <span className={css.chosenCode}>{terpilih.kode}</span>
                  <span className={css.chosenDesc}>{terpilih.deskripsi}</span>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={gantiPenyakit}
                  >
                    Ganti
                  </button>
                </div>
              ) : (
                <div className={`form-floating ${css.searchBox}`}>
                  <input
                    ref={searchRef}
                    id="caripenyakit"
                    type="text"
                    className="form-control"
                    placeholder="Ketik nama penyakit atau kode ICD 10"
                    autoComplete="off"
                    value={caripenyakit}
                    onChange={(e) => setCariPenyakit(e.target.value)}
                    onKeyDown={onSearchKeyDown}
                  />
                  <label htmlFor="caripenyakit">
                    <Search aria-hidden="true" /> Ketik nama penyakit atau kode
                    ICD 10 (min. 2 huruf)
                  </label>
                  {spinnerSearch && (
                    <Spinner
                      animation="border"
                      size="sm"
                      className={css.searchSpinner}
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Hasil pencarian: full lebar, menutup setelah penyakit dipilih */}
          {!terpilih && sudahCari && (
            <div className={css.results} role="listbox">
              {dataPenyakit.length === 0 ? (
                <div className={css.resultEmpty}>
                  Tidak ditemukan penyakit untuk "{caripenyakit.trim()}".
                </div>
              ) : (
                dataPenyakit.map((p, i) => (
                  <button
                    key={p.id}
                    type="button"
                    role="option"
                    aria-selected={i === aktif}
                    className={`${css.resultItem} ${
                      i === aktif ? css.resultItemActive : ""
                    }`}
                    onMouseEnter={() => setAktif(i)}
                    onClick={() => pilihPenyakit(p)}
                  >
                    <span className={css.resultCode}>{p.icd_code}</span>
                    <span className={css.resultDesc}>{p.description_code}</span>
                    <ArrowRight className={css.resultArrow} aria-hidden="true" />
                  </button>
                ))
              )}
            </div>
          )}

          {spinner && (
            <div className="text-center mt-3">
              <Spinner animation="border" variant="primary" />
            </div>
          )}
        </div>
      </div>

      {/* ③ Isian jumlah pasien */}
      {terpilih && !spinner && (
        <form
          ref={formRef}
          className="card mt-3"
          onSubmit={(e) => {
            e.preventDefault();
            simpan(true);
          }}
        >
          <div className="card-body">
            <span className={css.stepLabel}>
              ③ Jumlah kasus baru menurut golongan umur
            </span>
            {(lakiTerkunci || perempuanTerkunci) && (
              <p className={css.lockNote}>
                Penyakit ini khusus{" "}
                {lakiTerkunci ? "perempuan" : "laki-laki"}, kolom{" "}
                {lakiTerkunci ? "Laki-laki" : "Perempuan"} dikunci.
              </p>
            )}

            <div className={css.grid}>
              {tabelUmur(KOLOM_KIRI, 1)}
              {tabelUmur(KOLOM_KANAN, KOLOM_KIRI.length + 1, true)}
            </div>

            <div className={css.footer}>
              <div className={css.totals}>
                <span>
                  Kasus baru L <span className={css.totalValue}>{totalL}</span>
                </span>
                <span>
                  P <span className={css.totalValue}>{totalP}</span>
                </span>
                <span>
                  Semua <span className={css.totalValue}>{total}</span>
                </span>
                <span className={css.matiGroup}>
                  Kunjungan{" "}
                  <span className={css.totalValue}>{totalMati}</span>
                  {matiValid ? (
                    <span
                      className={css.statusOk}
                      title="Kasus baru tidak melebihi kunjungan per jenis kelamin"
                    >
                      ✓
                    </span>
                  ) : (
                    <span className={css.statusBad}>⚠ {pesanMati}</span>
                  )}
                </span>
              </div>
              <div className={css.actions}>
                <button
                  type="button"
                  className="btn btn-outline-success"
                  disabled={buttonStatus || !matiValid}
                  onClick={() => simpan(false)}
                >
                  <HiSaveAs /> Simpan
                </button>
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={buttonStatus || !matiValid}
                  title="Simpan lalu langsung isi penyakit berikutnya"
                >
                  Simpan &amp; Lanjut <ArrowRight aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default FormTambahRL51;
