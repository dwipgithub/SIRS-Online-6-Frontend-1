import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { Link, useNavigate, useParams } from "react-router-dom";
import { HiSaveAs } from "react-icons/hi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Spinner } from "react-bootstrap";
import { useCSRFTokenContext } from "../../Context/CSRFTokenContext";
import { ArrowLeft, Hospital } from "react-bootstrap-icons";
import style from "./FormUbahRL41.module.css"; // kelas tabel standar RL 4.1
import css from "./FormUbahRL41.module.css"; // tata letak sama dengan form tambah

// Golongan umur RL 4.1 dengan nama field dari server (gaya database).
// Baris terakhir (KELUAR_MATI) adalah Jumlah Pasien Keluar Mati.
const GOLONGAN_UMUR = [
  ["< 1 Jam", "0_1jam"],
  ["1 - 23 Jam", "1_23jam"],
  ["1 - 7 Hari", "1_7hr"],
  ["8 - 28 Hari", "8_28hr"],
  ["29 Hari - <3 Bulan", "29hr_3bln"],
  ["3 - <6 Bulan", "3_6bln"],
  ["6 - 11 Bulan", "6_11bln"],
  ["1 - 4 Tahun", "1_4th"],
  ["5 - 9 Tahun", "5_9th"],
  ["10 - 14 Tahun", "10_14th"],
  ["15 - 19 Tahun", "15_19th"],
  ["20 - 24 Tahun", "20_24th"],
  ["25 - 29 Tahun", "25_29th"],
  ["30 - 34 Tahun", "30_34th"],
  ["35 - 39 Tahun", "35_39th"],
  ["40 - 44 Tahun", "40_44th"],
  ["45 - 49 Tahun", "45_49th"],
  ["50 - 54 Tahun", "50_54th"],
  ["55 - 59 Tahun", "55_59th"],
  ["60 - 64 Tahun", "60_64th"],
  ["65 - 69 Tahun", "65_69th"],
  ["70 - 74 Tahun", "70_74th"],
  ["75 - 79 Tahun", "75_79th"],
  ["80 - 84 Tahun", "80_84th"],
  ["≥ 85 Tahun", "lebih85th"],
].map(([label, k]) => ({
  label,
  namaL: `jmlh_pas_hidup_mati_umur_gen_${k}_l`,
  namaP: `jmlh_pas_hidup_mati_umur_gen_${k}_p`,
}));

const KELUAR_MATI = {
  namaL: "jmlh_pas_keluar_mati_gen_l",
  namaP: "jmlh_pas_keluar_mati_gen_p",
};

const KOLOM_KIRI = GOLONGAN_UMUR.slice(0, 13);
const KOLOM_KANAN = GOLONGAN_UMUR.slice(13);

const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

// "2026-11-01" -> "November 2026"
const formatPeriode = (periode) => {
  const m = /^(\d{4})-(\d{2})/.exec(String(periode || ""));
  return m ? `${BULAN[Number(m[2]) - 1]} ${m[1]}` : "-";
};

export const FormUbahRL41 = () => {
  const [namaRS, setNamaRS] = useState("");
  const [namaKabKota, setNamaKabKota] = useState("");
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const [datainput, setDataInput] = useState(null);
  const [spinner, setSpinner] = useState(false);
  const [buttonStatus, setButtonStatus] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams();
  const { CSRFToken } = useCSRFTokenContext();
  const formRef = useRef(null);

  useEffect(() => {
    refreshToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshToken = async () => {
    try {
      const response = await axios.get("/apisirs6v2/token", {
        headers: { "XSRF-TOKEN": CSRFToken },
      });
      const accessToken = response.data.accessToken;
      setToken(accessToken);
      const decoded = jwt_decode(accessToken);
      setExpire(decoded.exp);
      getRumahSakit(decoded.satKerId, accessToken);
      getRLEmpatA(accessToken);
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

  const getRumahSakit = async (rsId, accessToken) => {
    try {
      const response = await axios.get("/apisirs6v2/rumahsakit/" + rsId, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setNamaRS(response.data.data.nama);
      setNamaKabKota(response.data.data.kab_kota_nama);
    } catch (error) {}
  };

  const getRLEmpatA = async (accessToken) => {
    setSpinner(true);
    try {
      const response = await axios.get("/apisirs6v2/rlempattitiksatu/" + id, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setDataInput(response.data.data);
    } catch (error) {
      toast("Gagal memuat data, silakan coba lagi", {
        position: toast.POSITION.TOP_RIGHT,
      });
    } finally {
      setSpinner(false);
    }
  };

  // ---------- Isian angka ----------
  const ubahAngka = (nama, nilaiBaru) => {
    // hanya angka, maksimal 7 digit, tanpa minus
    const bersih = String(nilaiBaru).replace(/\D/g, "").slice(0, 7);
    setDataInput((d) => ({ ...d, [nama]: bersih === "" ? "" : Number(bersih) }));
  };

  const nilai = (nama) => Number(datainput?.[nama]) || 0;

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

  // Kolom dikunci hanya bila data ICD menyatakannya secara eksplisit
  const lakiTerkunci = datainput?.icd?.status_laki === 0;
  const perempuanTerkunci = datainput?.icd?.status_perempuan === 0;

  const kotakAngka = (nama, terkunci, extraClass = "") => (
    <input
      type="number"
      inputMode="numeric"
      data-nav
      name={nama}
      className={`form-control ${extraClass}`}
      value={datainput?.[nama] ?? 0}
      min={0}
      disabled={terkunci}
      onChange={(e) => ubahAngka(nama, e.target.value)}
      onBlur={() => datainput?.[nama] === "" && ubahAngka(nama, 0)}
      onFocus={(e) => e.target.select()}
      onKeyDown={onInputKeyDown}
      onWheel={(e) => e.currentTarget.blur()} // cegah angka berubah karena scroll
    />
  );

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
  const UpdateRLEmpatTitikSatu = async (e) => {
    e.preventDefault();
    if (!datainput) return;
    if (!matiValid) {
      toast(
        `Data Gagal Disimpan, Jumlah Pasien Keluar Mati melebihi total per jenis kelamin (${pesanMati})`,
        { position: toast.POSITION.TOP_RIGHT },
      );
      return;
    }

    // Field yang tidak dikirim tetap sama dengan versi sebelumnya
    const {
      icd,
      id: _id,
      icd_id,
      periode,
      rl_empat_titik_satu_id,
      rs_id,
      total_pas_hidup_mati,
      total_pas_keluar_mati,
      user_id,
      jmlh_pas_hidup_mati_gen_l,
      jmlh_pas_hidup_mati_gen_p,
      ...payloadInsert
    } = datainput;
    // isian yang sempat dikosongkan dikirim sebagai 0
    [...GOLONGAN_UMUR, KELUAR_MATI].forEach((g) => {
      payloadInsert[g.namaL] = nilai(g.namaL);
      payloadInsert[g.namaP] = nilai(g.namaP);
    });

    setButtonStatus(true);
    try {
      await axiosJWT.patch("/apisirs6v2/rlempattitiksatu/" + id, payloadInsert, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "XSRF-TOKEN": CSRFToken,
        },
      });
      toast("Data Berhasil Diupdate", { position: toast.POSITION.TOP_RIGHT });
      setTimeout(() => navigate("/rl41"), 1000);
    } catch (error) {
      toast(
        "Data Gagal Diupdate, " +
          (error.response?.data?.message || error.message),
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

      <div className={css.topRow}>
        <Link to={`/rl41/`} className="gl-back" style={{ marginBottom: 0 }}>
          <span className="gl-back-icon" aria-hidden="true">
            <ArrowLeft size={18} />
          </span>
          <span className="gl-back-text">
            <small>Kembali ke</small>
            <strong>RL 4.1 Morbiditas Pasien Rawat Inap</strong>
          </span>
        </Link>
        {namaRS && (
          <span className={css.rsInfo} title="Rumah sakit akun yang sedang login">
            <Hospital aria-hidden="true" />
            <strong>{namaRS}</strong>
            {namaKabKota && <span>· {namaKabKota}</span>}
          </span>
        )}
      </div>

      {spinner && (
        <div className="text-center my-4">
          <Spinner animation="border" variant="primary" />
        </div>
      )}

      {datainput && (
        <>
          {/* Periode & penyakit (tidak bisa diubah di halaman ubah) */}
          <div className="card">
            <div className="card-body">
              <div className={css.searchBar}>
                <div>
                  <span className={css.stepLabel}>Periode laporan</span>
                  <div className={css.chosen} style={{ flex: "0 0 auto" }}>
                    <span className={css.chosenCode}>
                      {formatPeriode(datainput.periode)}
                    </span>
                  </div>
                </div>
                <div style={{ flex: "1 1 320px" }}>
                  <span className={css.stepLabel}>Penyakit (ICD 10)</span>
                  <div className={css.chosen}>
                    <span className={css.chosenCode}>
                      {datainput.icd?.icd_code}
                    </span>
                    <span className={css.chosenDesc}>
                      {datainput.icd?.description_code}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Isian jumlah pasien */}
          <form ref={formRef} className="card mt-3" onSubmit={UpdateRLEmpatTitikSatu}>
            <div className="card-body">
              <span className={css.stepLabel}>
                Jumlah pasien keluar (hidup & mati) menurut golongan umur
              </span>
              {(lakiTerkunci || perempuanTerkunci) && (
                <p className={css.lockNote}>
                  Penyakit ini khusus {lakiTerkunci ? "perempuan" : "laki-laki"},
                  kolom {lakiTerkunci ? "Laki-laki" : "Perempuan"} dikunci.
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
                    type="submit"
                    className="btn btn-success"
                    disabled={buttonStatus || !matiValid}
                  >
                    <HiSaveAs /> Simpan Perubahan
                  </button>
                </div>
              </div>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default FormUbahRL41;
