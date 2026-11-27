import { useEffect, useState } from "react";
import React from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  CheckCircleFill,
  ExclamationCircleFill,
  ArrowRight,
  Gear,
} from "react-bootstrap-icons";
import { isRS } from "../../utils/peran";
import "./StatusPelaporan.css";

const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

// Data RL untuk kartu status. `tambah` kosong = RL turunan (tanpa form isi).
// Rute sama dengan menu sidebar (NavigationBar.js) dan App.js.
const RL = {
  31: { kode: "RL 3.1", nama: "Indikator Pelayanan", to: "/rl31" },
  32: { kode: "RL 3.2", nama: "Rawat Inap", to: "/rl32", tambah: "/rl32/tambah" },
  33: { kode: "RL 3.3", nama: "Rawat Darurat", to: "/rl33", tambah: "/rl33/tambah" },
  34: { kode: "RL 3.4", nama: "Pengunjung", to: "/RL34", tambah: "/rl34/tambah" },
  35: { kode: "RL 3.5", nama: "Kunjungan", to: "/rl35", tambah: "/rl35/tambah" },
  36: { kode: "RL 3.6", nama: "Kebidanan", to: "/rl36", tambah: "/rl36/tambah" },
  37: { kode: "RL 3.7", nama: "Neonatal, Bayi, dan Balita", to: "/rl37", tambah: "/rl37/tambah" },
  38: { kode: "RL 3.8", nama: "Laboratorium", to: "/rl38", tambah: "/rl38/tambah" },
  39: { kode: "RL 3.9", nama: "Radiologi", to: "/rl39", tambah: "/rl39/tambah" },
  310: { kode: "RL 3.10", nama: "Rujukan", to: "/rl310", tambah: "/rl310/tambah" },
  311: { kode: "RL 3.11", nama: "Gigi dan Mulut", to: "/rl311", tambah: "/rl311/tambah" },
  312: { kode: "RL 3.12", nama: "Pembedahan", to: "/rl312", tambah: "/rl312/tambah" },
  313: { kode: "RL 3.13", nama: "Rehabilitasi Medik", to: "/rl313", tambah: "/rl313/tambah" },
  314: { kode: "RL 3.14", nama: "Pelayanan Khusus", to: "/rl314", tambah: "/rl314/tambah" },
  315: { kode: "RL 3.15", nama: "Kesehatan Jiwa", to: "/rl315", tambah: "/rl315/tambah" },
  316: { kode: "RL 3.16", nama: "Keluarga Berencana", to: "/rl316", tambah: "/rl316/tambah" },
  317: { kode: "RL 3.17", nama: "Farmasi Pengadaan Obat", to: "/rl317", tambah: "/rl317/tambah" },
  318: { kode: "RL 3.18", nama: "Farmasi Resep", to: "/rl318", tambah: "/rl318/tambah" },
  319: { kode: "RL 3.19", nama: "Cara Bayar", to: "/rl319", tambah: "/rl319/tambah" },
  41: { kode: "RL 4.1", nama: "Morbiditas Pasien Rawat Inap", to: "/rl41", tambah: "/rl41/tambah" },
  42: { kode: "RL 4.2", nama: "10 Besar Penyakit Rawat Inap", to: "/rl42" },
  43: { kode: "RL 4.3", nama: "10 Besar Kematian Pasien Rawat Inap", to: "/rl43" },
  51: { kode: "RL 5.1", nama: "Morbiditas Pasien Rawat Jalan", to: "/rl51", tambah: "/rl51/tambah" },
  52: { kode: "RL 5.2", nama: "10 Besar Kasus Baru Rawat Jalan", to: "/rl52" },
  53: { kode: "RL 5.3", nama: "10 Besar Kunjungan Rawat Jalan", to: "/rl53" },
};

// Periode: RL bulanan = bulan lalu (sama dengan default form tambah),
// RL tahunan = tahun sebelumnya (laporan tahunan diisi setelah tahun berakhir)
const sekarang = new Date();
const bulanLalu = new Date(sekarang.getFullYear(), sekarang.getMonth() - 1, 1);
const PERIODE = `${bulanLalu.getFullYear()}-${bulanLalu.getMonth() + 1}`;
const LABEL_BULAN = `${NAMA_BULAN[bulanLalu.getMonth()]} ${bulanLalu.getFullYear()}`;
const TAHUN = String(sekarang.getFullYear() - 1);

const persen = (a, b) => (b > 0 ? Math.round((a * 100) / b) : 0);

/* ---------- Tampilan RS: kartu per RL ---------- */
const KartuRL = ({ item }) => {
  const rl = RL[item.rl] || { kode: `RL ${item.rl}`, nama: "", to: "/beranda" };
  const turunan = !rl.tambah;
  const tujuan = item.sudah || turunan ? rl.to : rl.tambah;
  return (
    <Link
      to={tujuan}
      className={`sp-kartu ${item.sudah ? "sp-sudah" : "sp-belum"}`}
      title={`${rl.kode} ${rl.nama}`}
    >
      <div className="sp-kartu-atas">
        <span className="sp-kode">{rl.kode}</span>
        {item.sudah ? (
          <CheckCircleFill className="sp-ikon" size={16} />
        ) : (
          <ExclamationCircleFill className="sp-ikon" size={16} />
        )}
      </div>
      <div className="sp-nama">{rl.nama}</div>
      <div className="sp-kartu-bawah">
        <span>{item.sudah ? "Sudah diisi" : "Belum diisi"}</span>
        {turunan ? (
          <span className="sp-otomatis" title="Dihitung otomatis dari RL lain">
            <Gear size={11} /> Otomatis
          </span>
        ) : (
          !item.sudah && (
            <span className="sp-aksi">
              Isi <ArrowRight size={12} />
            </span>
          )
        )}
      </div>
    </Link>
  );
};

const BagianRS = ({ judul, periode, daftar }) => {
  const sudah = daftar.filter((x) => x.sudah).length;
  return (
    <section className="sp-bagian">
      <div className="sp-bagian-head">
        <h2 className="sp-judul">
          {judul} <span>· {periode}</span>
        </h2>
        <div className="sp-progres" aria-label={`${sudah} dari ${daftar.length} sudah diisi`}>
          <div className="sp-bar">
            <div style={{ width: `${persen(sudah, daftar.length)}%` }} />
          </div>
          <span>
            <strong>{sudah}</strong> dari {daftar.length} sudah diisi
          </span>
        </div>
      </div>
      <div className="sp-grid">
        {daftar.map((item) => (
          <KartuRL key={item.rl} item={item} />
        ))}
      </div>
    </section>
  );
};

/* ---------- Tampilan Dinkes/Kemenkes: ringkasan per RL ---------- */
const BagianWilayah = ({ judul, periode, daftar, totalRS }) => (
  <section className="sp-bagian">
    <div className="sp-bagian-head">
      <h2 className="sp-judul">
        {judul} <span>· {periode}</span>
      </h2>
    </div>
    <div className="sp-daftar">
      {daftar.map((item) => {
        const rl = RL[item.rl] || { kode: `RL ${item.rl}`, nama: "" };
        const p = persen(item.sudah, totalRS);
        return (
          <div key={item.rl} className="sp-baris">
            <div className="sp-baris-label" title={`${rl.kode} ${rl.nama}`}>
              <span className="sp-kode">{rl.kode}</span> {rl.nama}
            </div>
            <div className="sp-bar">
              <div style={{ width: `${p}%` }} />
            </div>
            <div className="sp-baris-angka">
              <strong>{item.sudah}</strong>/{totalRS} RS <span>({p}%)</span>
            </div>
          </div>
        );
      })}
    </div>
  </section>
);

/**
 * Status pelaporan di Beranda.
 *   RS            : kartu per RL (sudah/belum diisi) -> klik untuk mengisi
 *   Dinkes/Kemkes : jumlah RS di wilayahnya yang sudah mengisi tiap RL
 * Sumber: GET /apisirs6v2/absensi/status (tabel absensi, diperbarui trigger).
 */
// Ambil status pelaporan sekali; dipakai StatusPelaporan & RingkasanKelengkapan
export const useStatusPelaporan = (token) => {
  const [data, setData] = useState(null);
  const [gagal, setGagal] = useState(false);

  useEffect(() => {
    if (!token) return;
    let batal = false;
    axios
      .get("/apisirs6v2/absensi/status", {
        headers: { Authorization: `Bearer ${token}` },
        params: { periode: PERIODE, tahun: TAHUN },
      })
      .then((r) => !batal && setData(r.data.data))
      .catch(() => !batal && setGagal(true));
    return () => {
      batal = true;
    };
  }, [token]);

  return { data, gagal };
};

export { LABEL_BULAN, TAHUN };

const StatusPelaporan = ({ data, gagal, user }) => {
  if (gagal) {
    return <p className="sp-info">Status pelaporan tidak dapat dimuat.</p>;
  }
  if (!data) {
    return (
      <p className="sp-info" role="status">
        Memuat status pelaporan…
      </p>
    );
  }

  if (data.mode === "rs" || isRS(user)) {
    return (
      <div className="sp">
        <BagianRS judul="Laporan Bulanan" periode={LABEL_BULAN} daftar={data.bulanan} />
        <BagianRS judul="Laporan Tahunan" periode={TAHUN} daftar={data.tahunan} />
      </div>
    );
  }

  return (
    <div className="sp">
      <p className="sp-ringkas">
        <strong>{data.totalRS}</strong> rumah sakit aktif di wilayah Anda.{" "}
        <Link to="/absensi">
          Lihat detail per RS di Absensi <ArrowRight size={12} />
        </Link>
      </p>
      <BagianWilayah
        judul="Laporan Bulanan"
        periode={LABEL_BULAN}
        daftar={data.bulanan}
        totalRS={data.totalRS}
      />
      <BagianWilayah
        judul="Laporan Tahunan"
        periode={TAHUN}
        daftar={data.tahunan}
        totalRS={data.totalRS}
      />
    </div>
  );
};

export default StatusPelaporan;
