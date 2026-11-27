import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate, Link } from "react-router-dom";
import { CheckCircle, ExclamationCircle } from "react-bootstrap-icons";
import style from "./RL32Manual.module.css";
import FilterSummary from "../../Shared/FilterSummary";
import FilterRLModal, { NAMA_BULAN } from "../../Shared/FilterRLModal";
import useWilayahRS from "../../Shared/useWilayahRS";
import { confirmAlert } from "react-confirm-alert";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "react-confirm-alert/src/react-confirm-alert.css";
import { useCSRFTokenContext } from "../../Context/CSRFTokenContext";
import { bisaInputData, bisaPilihBanyakRS, isRS } from "../../../utils/peran";

// Batas dari backend (middleware/AksesRL.js)
// Pilihan RS satu per satu dikirim lewat URL (rsId=A;B;..), jadi dibatasi.
// "Pilih semua" (semuaWilayah=1) tidak terkena batas ini.
const MAKS_PILIH_RS = 100;
const MAKS_RS_EXCEL = 1000; // MAKS_RS_EXCEL
// Jumlah RS per halaman tabel
const RS_PER_HALAMAN = 10;

const angka = (v) => parseInt(v, 10) || 0;

// Rumus kolom turunan (sama dengan perhitungan sebelumnya)
const pasienAkhirBulan = (r) =>
  angka(r.pasien_awal_bulan) +
  angka(r.pasien_masuk) +
  angka(r.pasien_pindahan) -
  (angka(r.pasien_dipindahkan) +
    angka(r.pasien_keluar_hidup) +
    angka(r.pasien_keluar_mati_kurang_dari_48_jam) +
    angka(r.pasien_keluar_mati_lebih_dari_atau_sama_dengan_48_jam) +
    angka(r.pasien_wanita_keluar_mati_kurang_dari_48_jam) +
    angka(r.pasien_wanita_keluar_mati_lebih_dari_atau_sama_dengan_48_jam));

const jumlahHariPerawatan = (r) =>
  angka(r.rincian_hari_perawatan_kelas_VVIP) +
  angka(r.rincian_hari_perawatan_kelas_VIP) +
  angka(r.rincian_hari_perawatan_kelas_1) +
  angka(r.rincian_hari_perawatan_kelas_2) +
  angka(r.rincian_hari_perawatan_kelas_3) +
  angka(r.rincian_hari_perawatan_kelas_khusus);

// Kolom angka sesuai urutan di tabel (setelah No., Aksi, Jenis Pelayanan)
const KOLOM = [
  { judul: "Pasien Awal Bulan", nilai: (r) => r.pasien_awal_bulan },
  { judul: "Pasien Masuk", nilai: (r) => r.pasien_masuk },
  { judul: "Pasien Pindahan", nilai: (r) => r.pasien_pindahan },
  { judul: "Pasien Dipindahkan", nilai: (r) => r.pasien_dipindahkan },
  { judul: "Pasien Keluar Hidup", nilai: (r) => r.pasien_keluar_hidup },
  { judul: "Pasien Pria Keluar Mati <48 Jam", nilai: (r) => r.pasien_keluar_mati_kurang_dari_48_jam },
  { judul: "Pasien Pria Keluar Mati >=48 Jam", nilai: (r) => r.pasien_keluar_mati_lebih_dari_atau_sama_dengan_48_jam },
  { judul: "Pasien Wanita Keluar Mati <48 Jam", nilai: (r) => r.pasien_wanita_keluar_mati_kurang_dari_48_jam },
  { judul: "Pasien Wanita Keluar Mati >=48 Jam", nilai: (r) => r.pasien_wanita_keluar_mati_lebih_dari_atau_sama_dengan_48_jam },
  { judul: "Jumlah Lama Dirawat", nilai: (r) => r.jumlah_lama_dirawat },
  { judul: "Pasien Akhir Bulan", nilai: pasienAkhirBulan },
  { judul: "Jumlah Hari Perawatan", nilai: jumlahHariPerawatan },
  { judul: "Hari Perawatan VVIP", nilai: (r) => r.rincian_hari_perawatan_kelas_VVIP },
  { judul: "Hari Perawatan VIP", nilai: (r) => r.rincian_hari_perawatan_kelas_VIP },
  { judul: "Hari Perawatan 1", nilai: (r) => r.rincian_hari_perawatan_kelas_1 },
  { judul: "Hari Perawatan 2", nilai: (r) => r.rincian_hari_perawatan_kelas_2 },
  { judul: "Hari Perawatan 3", nilai: (r) => r.rincian_hari_perawatan_kelas_3 },
  { judul: "Hari Perawatan Khusus", nilai: (r) => r.rincian_hari_perawatan_kelas_khusus },
  { judul: "Jumlah Alokasi TT Awal Bulan", nilai: (r) => r.jumlah_alokasi_tempat_tidur_awal_bulan },
];

const JUMLAH_KOLOM_TABEL = 3 + KOLOM.length;

const pesanError = (error, cadangan) =>
  (error && error.response && error.response.data && error.response.data.message) ||
  cadangan;

const RL32Manual = () => {
  const [filterLabel, setFilterLabel] = useState([]);
  const [rumahSakit, setRumahSakit] = useState(null); // profil RS sendiri (peran RS)
  // { params, periode, bulan, tahun, jumlahRS } — params: {rsId} atau {semuaWilayah,...}
  const [filterAktif, setFilterAktif] = useState(null);

  const [dataRL, setDataRL] = useState([]);
  const [total, setTotal] = useState(null);
  const [pagination, setPagination] = useState(null);

  const [memuat, setMemuat] = useState(false);
  const [mengunduh, setMengunduh] = useState(false);
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const [show, setShow] = useState(false);
  const [user, setUser] = useState({});
  const navigate = useNavigate();
  const { CSRFToken } = useCSRFTokenContext();
  const permintaanAktif = useRef(null);

  useEffect(() => {
    refreshToken();
    return () => permintaanAktif.current && permintaanAktif.current.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshToken = async () => {
    try {
      const customConfig = {
        headers: {
          "XSRF-TOKEN": CSRFToken,
        },
      };
      const response = await axios.get("/apisirs6v2/token", customConfig);
      setToken(response.data.accessToken);
      const decoded = jwt_decode(response.data.accessToken);
      if (isRS(decoded)) showRumahSakit(decoded.satKerId, response.data.accessToken);
      setExpire(decoded.exp);
      setUser(decoded);
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
        const response = await axios.get("/apisirs6v2/token");
        config.headers.Authorization = `Bearer ${response.data.accessToken}`;
        setToken(response.data.accessToken);
        const decoded = jwt_decode(response.data.accessToken);
        setExpire(decoded.exp);
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  const wilayah = useWilayahRS({
    user,
    api: axiosJWT,
    token,
    aktif: bisaPilihBanyakRS(user),
  });

  const showRumahSakit = async (id, tokenAwal) => {
    try {
      const response = await axiosJWT.get("/apisirs6v2/rumahsakit/" + id, {
        headers: {
          Authorization: `Bearer ${tokenAwal || token}`,
        },
      });
      setRumahSakit(response.data.data);
    } catch (error) {}
  };

  // Satu permintaan aktif: permintaan lama dibatalkan bila filter berganti
  const mulaiPermintaan = () => {
    if (permintaanAktif.current) permintaanAktif.current.abort();
    const controller = new AbortController();
    permintaanAktif.current = controller;
    setMemuat(true);
    return controller;
  };

  const selesaiPermintaan = (controller) => {
    if (permintaanAktif.current === controller) {
      permintaanAktif.current = null;
      setMemuat(false);
    }
  };

  const muatData = async (params, periode, page) => {
    const controller = mulaiPermintaan();
    try {
      const results = await axiosJWT.get("/apisirs6v2/rltigatitikdua", {
        headers: { Authorization: `Bearer ${token}` },
        params: { ...params, periode, page, limit: RS_PER_HALAMAN },
        signal: controller.signal,
      });
      setDataRL(results.data.data || []);
      setTotal(results.data.total || null);
      setPagination(results.data.pagination || null);
    } catch (error) {
      if (axios.isCancel(error)) return;
      toast(pesanError(error, "Gagal mengambil data"), { position: toast.POSITION.TOP_RIGHT });
    } finally {
      selesaiPermintaan(controller);
    }
  };

  // Dari modal filter
  const terapkanFilter = ({ rs, semuaWilayah, namaWilayah, bulan, tahun }) => {
    const periode = `${tahun}-${bulan}`;
    const params = semuaWilayah || { rsId: rs.map((r) => r.id).join(";") };
    const filter = { params, periode, bulan, tahun, jumlahRS: rs.length };

    setFilterAktif(filter);
    setDataRL([]);
    setPagination(null);
    setFilterLabel([
      {
        label: "Rumah Sakit",
        value: semuaWilayah
          ? `Semua RS di ${namaWilayah} (${rs.length})`
          : rs.length <= 3
          ? rs.map((r) => r.nama).join(", ")
          : `${rs.length} rumah sakit`,
      },
      { label: "Periode", value: periode },
    ]);
    setShow(false);
    muatData(params, periode, 1);
  };

  const deleteRL = async (id) => {
    const customConfig = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "XSRF-TOKEN": CSRFToken,
      },
    };
    try {
      await axiosJWT.delete(`/apisirs6v2/rltigatitikdua/${id}`, customConfig);
      toast("Data Berhasil Dihapus", {
        position: toast.POSITION.TOP_RIGHT,
      });
      // muat ulang agar total & pagination ikut diperbarui
      muatData(filterAktif.params, filterAktif.periode, (pagination && pagination.page) || 1);
    } catch (error) {
      console.log(error);
      toast("Data Gagal Dihapus", {
        position: toast.POSITION.TOP_RIGHT,
      });
    }
  };

  const deleteConfirmation = (id) => {
    confirmAlert({
      title: "",
      message: "Yakin data yang dipilih akan dihapus? ",
      buttons: [
        {
          label: "Yes",
          onClick: () => {
            deleteRL(id);
          },
        },
        {
          label: "No",
        },
      ],
    });
  };

  // File Excel dibuat di backend (streaming): baris per RS + total
  const handleDownloadExcel = async () => {
    if (!filterAktif) {
      toast("Terapkan filter terlebih dahulu", { position: toast.POSITION.TOP_RIGHT });
      return;
    }
    if (filterAktif.jumlahRS > MAKS_RS_EXCEL) {
      toast(`File Excel maksimal ${MAKS_RS_EXCEL} RS. Persempit wilayah filter.`, {
        position: toast.POSITION.TOP_RIGHT,
      });
      return;
    }
    setMengunduh(true);
    try {
      const results = await axiosJWT.get("/apisirs6v2/rltigatitikdua/excel", {
        headers: { Authorization: `Bearer ${token}` },
        params: { ...filterAktif.params, periode: filterAktif.periode },
        responseType: "blob",
      });
      const url = URL.createObjectURL(results.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `RL 3.2 Rawat Inap - ${NAMA_BULAN[filterAktif.bulan - 1]} ${filterAktif.tahun}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      // Respons error berupa blob JSON
      let pesan = "Gagal mengunduh data";
      try {
        const teks = await error.response.data.text();
        pesan = JSON.parse(teks).message || pesan;
      } catch (e) {}
      toast(pesan, { position: toast.POSITION.TOP_RIGHT });
    } finally {
      setMengunduh(false);
    }
  };

  // Peran selain RS melihat banyak RS: kolom ke-2 berisi Nama RS (bukan Aksi)
  const denganRS = bisaPilihBanyakRS(user);
  const halaman = pagination ? pagination.page : 1;
  const totalHalaman = pagination ? pagination.totalHalaman : 0;
  const nomorAwalRS = (halaman - 1) * RS_PER_HALAMAN;

  const selKiri = (n) => `${style["sticky-column"]} ${style[`sticky-${n}`]}`;

  const barisAngka = (sumber) =>
    KOLOM.map((k, i) => (
      <td key={i} className={style.angka}>
        {k.nilai(sumber)}
      </td>
    ));

  const adaIsi = dataRL.length > 0;

  return (
    // Isi tab SIRS; wadah halaman, judul & animasi ada di ../RL32.js
    <div>
      <ToastContainer />
      <FilterRLModal
        show={show}
        onHide={() => setShow(false)}
        onApply={terapkanFilter}
        judul="RL 3.2 Rawat Inap"
        user={user}
        w={wilayah}
        rumahSakitSendiri={rumahSakit}
        maksPilih={MAKS_PILIH_RS}
        bulanAwal={filterAktif ? filterAktif.bulan : undefined}
        tahunAwal={filterAktif ? filterAktif.tahun : undefined}
      />

      <div className="row">
        <div className="col-md-12">
          <div style={{ marginBottom: "10px" }}>
            {bisaInputData(user) && (
              <Link
                className="btn"
                to={`/rl32/tambah/`}
                style={{
                  marginRight: "5px",
                  fontSize: "18px",
                  backgroundColor: "#779D9E",
                  color: "#FFFFFF",
                }}
              >
                +
              </Link>
            )}
            <button
              className="btn"
              style={{
                fontSize: "18px",
                backgroundColor: "#779D9E",
                color: "#FFFFFF",
              }}
              onClick={() => setShow(true)}
            >
              Filter
            </button>
            <button
              className="btn"
              style={{
                fontSize: "18px",
                marginLeft: "5px",
                backgroundColor: "#779D9E",
                color: "#FFFFFF",
              }}
              onClick={handleDownloadExcel}
              disabled={!filterAktif || mengunduh}
            >
              {mengunduh ? "Menyiapkan…" : "Download"}
            </button>
          </div>

          <div>
            <FilterSummary items={filterLabel} />
          </div>

          {denganRS && pagination && (
            <div className={style.stats}>
              <div className={style.stat}>
                <span className={style.statValue}>{pagination.rsDipilih}</span>
                <span className={style.statLabel}>RS dipilih</span>
              </div>
              <div className={`${style.stat} ${style.statOk}`}>
                <CheckCircle size={16} />
                <span className={style.statValue}>{pagination.totalRS}</span>
                <span className={style.statLabel}>sudah mengisi</span>
              </div>
              <div className={`${style.stat} ${style.statWarn}`}>
                <ExclamationCircle size={16} />
                <span className={style.statValue}>{pagination.rsTanpaData}</span>
                <span className={style.statLabel}>belum mengisi</span>
              </div>
            </div>
          )}

          <div>
            <div className="mt-3">
              <div>
                <div
                  className={`${style["table-container"]} ${memuat ? style.memuat : ""}`}
                  aria-busy={memuat}
                >
                  <table className={`${style.table} ${denganRS ? style.denganRS : ""}`}>
                    <thead className={style.thead}>
                      <tr className="">
                        <th
                          className={`${style["sticky-header"]} ${style["sticky-1"]}`}
                          rowSpan="2"
                          style={{ width: "3%" }}
                        >
                          No.
                        </th>
                        <th
                          className={`${style["sticky-header"]} ${style["sticky-2"]}`}
                          rowSpan="2"
                          style={{ width: denganRS ? "10%" : "6%" }}
                        >
                          {denganRS ? "Nama RS" : "Aksi"}
                        </th>
                        <th
                          className={`${style["sticky-header"]} ${style["sticky-3"]}`}
                          rowSpan="2"
                          style={{ width: "8%" }}
                        >
                          Jenis Pelayanan
                        </th>
                        <th rowSpan="2" style={{ width: "4%" }}>
                          Pasien Awal Bulan
                        </th>
                        <th rowSpan="2" style={{ width: "4%" }}>
                          Pasien Masuk
                        </th>
                        <th rowSpan="2" style={{ width: "4%" }}>
                          Pasien Pindahan
                        </th>
                        <th rowSpan="2" style={{ width: "4%" }}>
                          Pasien Dipindahkan
                        </th>
                        <th rowSpan="2" style={{ width: "4%" }}>
                          Pasien Keluar Hidup
                        </th>
                        <th colSpan="2" style={{ width: "8%" }}>
                          Pasien Pria Keluar Mati
                        </th>
                        <th colSpan="2" style={{ width: "8%" }}>
                          Pasien Wanita Keluar Mati
                        </th>
                        <th rowSpan="2" style={{ width: "4%" }}>
                          Jumlah Lama Dirawat
                        </th>
                        <th rowSpan="2" style={{ width: "4%" }}>
                          Pasien Akhir Bulan
                        </th>
                        <th rowSpan="2" style={{ width: "4%" }}>
                          Jumlah Hari Perawatan
                        </th>
                        <th colSpan="6" style={{ width: "20%" }}>
                          Rincian Hari Perawatan Per Kelas
                        </th>
                        <th rowSpan="2" style={{ width: "4%" }}>
                          Jumlah Alokasi TT Awal Bulan
                        </th>
                      </tr>
                      <tr className={style["subheader-row"]}>
                        <th style={{ width: "5%" }}>{"< 48 jam"}</th>
                        <th style={{ width: "5%" }}>{">= 48 jam"}</th>
                        <th style={{ width: "5%" }}>{"< 48 jam"}</th>
                        <th style={{ width: "5%" }}>{">= 48 jam"}</th>
                        <th style={{ width: "5%" }}>VVIP</th>
                        <th style={{ width: "5%" }}>VIP</th>
                        <th style={{ width: "5%" }}>1</th>
                        <th style={{ width: "5%" }}>2</th>
                        <th style={{ width: "5%" }}>3</th>
                        <th style={{ width: "5%" }}>Khusus</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filterAktif && !memuat && !adaIsi && (
                        <tr>
                          <td colSpan={JUMLAH_KOLOM_TABEL} className={style.kosong}>
                            Belum ada data untuk filter ini
                          </td>
                        </tr>
                      )}

                      {dataRL.map((value, index) => {
                        const rsAwal =
                          denganRS && index > 0 && dataRL[index - 1].rs_id !== value.rs_id;
                        return (
                          <tr key={value.id} className={rsAwal ? style["rs-awal"] : undefined}>
                            <td className={`${selKiri(1)} ${style.angka}`}>{index + 1}</td>
                            {denganRS ? (
                              <td className={`${selKiri(2)} ${style["nama-rs"]}`}>
                                {value.nama_rs || "Rumah sakit"}
                                <small>{value.rs_id}</small>
                              </td>
                            ) : (
                              <td className={selKiri(2)} style={{ textAlign: "center" }}>
                                {bisaInputData(user) && (
                                  <div style={{ display: "flex" }}>
                                    <button
                                      className="btn btn-danger"
                                      style={{
                                        margin: "0 5px 0 0",
                                        backgroundColor: "#FF6663",
                                        border: "1px solid #FF6663",
                                      }}
                                      type="button"
                                      onClick={() => deleteConfirmation(value.id)}
                                    >
                                      Hapus
                                    </button>
                                    <Link
                                      to={`/rl32/ubah/${value.id}`}
                                      className="btn btn-warning"
                                      style={{
                                        margin: "0 5px 0 0",
                                        backgroundColor: "#CFD35E",
                                        border: "1px solid #CFD35E",
                                        color: "#FFFFFF",
                                      }}
                                    >
                                      Ubah
                                    </Link>
                                  </div>
                                )}
                              </td>
                            )}
                            <td className={selKiri(3)}>{value.nama_jenis_pelayanan}</td>
                            {barisAngka(value)}
                          </tr>
                        );
                      })}

                      {adaIsi && total && (
                        <tr className={style["total-row"]}>
                          <td className={selKiri(1)}></td>
                          <td className={selKiri(2)}></td>
                          <td className={selKiri(3)}>Total</td>
                          {barisAngka(total)}
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {totalHalaman > 1 && (
                  <nav className={style.pagination} aria-label="Halaman rumah sakit">
                    <span className={style["pagination-info"]}>
                      RS {nomorAwalRS + 1}–
                      {Math.min(nomorAwalRS + RS_PER_HALAMAN, pagination.totalRS)} dari{" "}
                      {pagination.totalRS} RS berdata
                    </span>
                    <div className={style["pagination-tombol"]}>
                      <button
                        type="button"
                        className="btn"
                        disabled={halaman <= 1 || memuat}
                        onClick={() => muatData(filterAktif.params, filterAktif.periode, halaman - 1)}
                      >
                        ‹ Sebelumnya
                      </button>
                      <span className={style["pagination-halaman"]}>
                        Halaman {halaman} / {totalHalaman}
                      </span>
                      <button
                        type="button"
                        className="btn"
                        disabled={halaman >= totalHalaman || memuat}
                        onClick={() => muatData(filterAktif.params, filterAktif.periode, halaman + 1)}
                      >
                        Berikutnya ›
                      </button>
                    </div>
                  </nav>
                )}
                {denganRS && adaIsi && total && pagination.totalRS > 1 && (
                  <div className={style.info}>
                    Baris <strong>Total</strong> adalah jumlah seluruh{" "}
                    {pagination.totalRS} RS berdata, bukan hanya halaman ini.
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RL32Manual;
