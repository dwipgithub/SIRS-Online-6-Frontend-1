import React from "react";
import { ExclamationCircleFill, CheckCircleFill } from "react-bootstrap-icons";
import { LABEL_BULAN, TAHUN } from "./StatusPelaporan";
import "./RingkasanKelengkapan.css";

const R = 42; // jari-jari lingkaran progres
const KELILING = 2 * Math.PI * R;

const TANGGAL = new Date().toLocaleDateString("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

/**
 * Kartu ringkas di kanan atas Beranda: persentase kelengkapan laporan.
 *   RS      : RL yang sudah diisi (bulan lalu + tahun sebelumnya) / semua RL
 *   wilayah : rata-rata kelengkapan RS di wilayah (isian terisi / (RS x RL))
 * Data dari useStatusPelaporan (sama dengan daftar Status Pelaporan).
 */
const RingkasanKelengkapan = ({ data }) => {
  const semua = data ? [...data.bulanan, ...data.tahunan] : [];
  let persen = 0;
  let baris1 = "Memuat…";
  let baris2 = null;

  if (data && data.mode === "rs") {
    const sudah = semua.filter((x) => x.sudah).length;
    const belum = semua.length - sudah;
    persen = semua.length ? Math.round((sudah * 100) / semua.length) : 0;
    baris1 = `${sudah} dari ${semua.length} laporan sudah diisi`;
    baris2 =
      belum > 0 ? (
        <span className="rk-belum">
          <ExclamationCircleFill size={13} /> {belum} belum diisi
        </span>
      ) : (
        <span className="rk-lengkap">
          <CheckCircleFill size={13} /> Semua laporan lengkap
        </span>
      );
  } else if (data) {
    const terisi = semua.reduce((n, x) => n + Number(x.sudah || 0), 0);
    const kapasitas = data.totalRS * semua.length;
    persen = kapasitas ? Math.round((terisi * 100) / kapasitas) : 0;
    baris1 = "Rata-rata kelengkapan RS di wilayah Anda";
    baris2 = <span className="rk-netral">{data.totalRS} RS aktif</span>;
  }

  return (
    <aside className="rk" aria-label="Ringkasan kelengkapan laporan">
      <div className="rk-isi">
        <svg className="rk-cincin" viewBox="0 0 100 100" aria-hidden="true">
          <defs>
            <linearGradient id="rk-gradien" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1f5fa8" />
              <stop offset="100%" stopColor="#1a8a6e" />
            </linearGradient>
          </defs>
          <circle className="rk-latar" cx="50" cy="50" r={R} />
          <circle
            className="rk-nilai"
            cx="50"
            cy="50"
            r={R}
            strokeDasharray={KELILING}
            strokeDashoffset={KELILING * (1 - persen / 100)}
          />
        </svg>
        <div className="rk-angka">
          {data ? `${persen}%` : "–"}
        </div>
      </div>
      <div className="rk-teks">
        <div className="rk-judul">Kelengkapan Laporan</div>
        <div className="rk-periode">
          {LABEL_BULAN} · Tahunan {TAHUN}
        </div>
        <div className="rk-baris1">{baris1}</div>
        {baris2 && <div className="rk-baris2">{baris2}</div>}
        <div className="rk-tanggal">{TANGGAL}</div>
      </div>
    </aside>
  );
};

export default RingkasanKelengkapan;
