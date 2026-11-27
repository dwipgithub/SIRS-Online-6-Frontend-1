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
import style from "./FormTambahRL41.module.css"; // kelas tabel standar RL 4.1
import css from "./FormTambahRL41.module.css";
import ProfilRSRingkas from "../../Shared/ProfilRSRingkas";
import pf from "../../Shared/ProfilRSRingkas.module.css";

// Golongan umur RL 4.1. "nama*" = nama field yang dikirim ke server
// (jangan diubah). Baris terakhir adalah Jumlah Pasien Keluar Mati.
const GOLONGAN_UMUR = [
  ["< 1 Jam", "jmlhPasHidupMatiUmurGen01Jam"],
  ["1 - 23 Jam", "jmlhPasHidupMatiUmurGen123Jam"],
  ["1 - 7 Hari", "jmlhPasHidupMatiUmurGen17hr"],
  ["8 - 28 Hari", "jmlhPasHidupMatiUmurGen828hr"],
  ["29 Hari - <3 Bulan", "jmlhPasHidupMatiUmurGen29hr3bln"],
  ["3 - <6 Bulan", "jmlhPasHidupMatiUmurGen36bln"],
  ["6 - 11 Bulan", "jmlhPasHidupMatiUmurGen611bln"],
  ["1 - 4 Tahun", "jmlhPasHidupMatiUmurGen14th"],
  ["5 - 9 Tahun", "jmlhPasHidupMatiUmurGen59th"],
  ["10 - 14 Tahun", "jmlhPasHidupMatiUmurGen1014th"],
  ["15 - 19 Tahun", "jmlhPasHidupMatiUmurGen1519th"],
  ["20 - 24 Tahun", "jmlhPasHidupMatiUmurGen2024th"],
  ["25 - 29 Tahun", "jmlhPasHidupMatiUmurGen2529th"],
  ["30 - 34 Tahun", "jmlhPasHidupMatiUmurGen3034th"],
  ["35 - 39 Tahun", "jmlhPasHidupMatiUmurGen3539th"],
  ["40 - 44 Tahun", "jmlhPasHidupMatiUmurGen4044th"],
  ["45 - 49 Tahun", "jmlhPasHidupMatiUmurGen4549th"],
  ["50 - 54 Tahun", "jmlhPasHidupMatiUmurGen5054th"],
  ["55 - 59 Tahun", "jmlhPasHidupMatiUmurGen5559th"],
  ["60 - 64 Tahun", "jmlhPasHidupMatiUmurGen6064th"],
  ["65 - 69 Tahun", "jmlhPasHidupMatiUmurGen6569th"],
  ["70 - 74 Tahun", "jmlhPasHidupMatiUmurGen7074th"],
  ["75 - 79 Tahun", "jmlhPasHidupMatiUmurGen7579th"],
  ["80 - 84 Tahun", "jmlhPasHidupMatiUmurGen8084th"],
  ["≥ 85 Tahun", "jmlhPasHidupMatiUmurGenLebih85th"],
].map(([label, dasar]) => ({ label, namaL: dasar + "L", namaP: dasar + "P" }));

const KELUAR_MATI = { namaL: "jmlhPasKeluarMatiGenL", namaP: "jmlhPasKeluarMatiGenP" };

// Isian dibagi dua kolom dengan jumlah baris sama (13 + 12)
const KOLOM_KIRI = GOLONGAN_UMUR.slice(0, 13);
const KOLOM_KANAN = GOLONGAN_UMUR.slice(13);

const SEMUA_NAMA = [...GOLONGAN_UMUR, KELUAR_MATI].flatMap((g) => [
  g.namaL,
  g.namaP,
]);

const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const angkaKosong = () =>
  Object.fromEntries(SEMUA_NAMA.map((nama) => [nama, 0]));

const FormTambahRL41 = () => {
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
        "/apisirs6v2/icd/rawat_inap/find?search=" + encodeURIComponent(kata),
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
        "/apisirs6v2/icd/rawat_inap/id?id=" + penyakit.id,
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
  // Keluar mati tidak boleh melebihi total pasien pada jenis kelamin yang sama
  const matiL = nilai(KELUAR_MATI.namaL);
  const matiP = nilai(KELUAR_MATI.namaP);
  const totalMati = matiL + matiP;
  const matiLValid = matiL <= totalL;
  const matiPValid = matiP <= totalP;
  const matiValid = matiLValid && matiPValid;
  const pesanMati = [
    !matiLValid && `Laki-laki ${matiL} > total ${totalL}`,
    !matiPValid && `Perempuan ${matiP} > total ${totalP}`,
  ]
    .filter(Boolean)
    .join(", ");

  // ---------- Simpan ----------
  const simpan = async (lanjut) => {
    if (!terpilih) return;
    if (bulan === "00" || Number(bulan) === 0 || !tahun) {
      toast("Data tidak bisa disimpan karena belum pilih periode laporan", {
        position: toast.POSITION.TOP_RIGHT,
      });
      return;
    }
    if (!matiValid) {
      toast(
        `Data Gagal Disimpan, Jumlah Pasien Keluar Mati melebihi total per jenis kelamin (${pesanMati})`,
        { position: toast.POSITION.TOP_RIGHT },
      );
      return;
    }

    // Format data sama persis dengan versi sebelumnya
    const transformedObject = Object.fromEntries(
      SEMUA_NAMA.map((nama) => [nama, nilai(nama)]),
    );
    const dataReady = {
      periodeBulan: parseInt(bulan, 10),
      periodeTahun: parseInt(tahun, 10),
      icdId: terpilih.id,
      data: [transformedObject],
    };

    setButtonStatus(true);
    try {
      await axiosJWT.post("/apisirs6v2/rlempattitiksatu", dataReady, {
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
        setTimeout(() => navigate("/rl41"), 1000);
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

  // barisMati = true: tambahkan baris "Jumlah Pasien Keluar Mati" di akhir
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
              <strong>Jumlah Pasien Keluar Mati</strong>
            </td>
            <td>
              {kotakAngka(
                KELUAR_MATI.namaL,
                lakiTerkunci,
                matiLValid ? "" : css.inputBad,
              )}
            </td>
            <td>
              {kotakAngka(
                KELUAR_MATI.namaP,
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
        to={`/rl41/`}
        className="gl-back"
        style={{ "--gl-back-gap": "1rem" }}
      >
        <span className="gl-back-icon" aria-hidden="true">
          <ArrowLeft size={18} />
        </span>
        <span className="gl-back-text">
          <small>Kembali ke</small>
          <strong>RL 4.1 Morbiditas Pasien Rawat Inap</strong>
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
              ③ Jumlah pasien keluar (hidup & mati) menurut golongan umur
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
                  Total L <span className={css.totalValue}>{totalL}</span>
                </span>
                <span>
                  P <span className={css.totalValue}>{totalP}</span>
                </span>
                <span>
                  Semua <span className={css.totalValue}>{total}</span>
                </span>
                <span className={css.matiGroup}>
                  Keluar mati{" "}
                  <span className={css.totalValue}>{totalMati}</span>
                  {matiValid ? (
                    <span
                      className={css.statusOk}
                      title="Tidak melebihi total per jenis kelamin"
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

export default FormTambahRL41;
