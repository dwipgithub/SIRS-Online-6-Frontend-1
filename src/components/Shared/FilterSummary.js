import React from "react";
import style from "./FilterSummary.module.css";

// Ringkasan filter aktif setelah Filter → Terapkan, dipakai semua halaman RL:
//   <FilterSummary items={filterLabel} />
// items boleh berupa objek { label, value } atau teks lama yang sudah dipakai
// di banyak halaman, mis. "nama: RS X", "filtered by nama: RS X",
// "periode: 2026-1", "Periode Januari 2026", "tahun: 2026", "All Bulan".

const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

// "2026-1" | "2026-01" | "2026-01-01" → "Januari 2026"
const formatPeriode = (teks) => {
  const m = String(teks).trim().match(/^(\d{4})-(\d{1,2})(?:-\d{1,2})?$/);
  if (!m) return String(teks).trim();
  const nama = NAMA_BULAN[Number(m[2]) - 1];
  return nama ? `${nama} ${m[1]}` : String(teks).trim();
};

const LABEL = { nama: "Rumah Sakit", periode: "Periode", tahun: "Periode" };

const uraikan = (item) => {
  if (item && typeof item === "object") {
    return item.label === "Periode" ? { ...item, value: formatPeriode(item.value) } : item;
  }
  const teks = String(item).replace(/^filtered\s+by\s*:?\s*/i, "").trim();
  if (/^all\s+bulan$/i.test(teks)) return { label: "Periode", value: "Semua bulan" };
  const m = teks.match(/^(nama|periode|tahun)\s*:?\s*(.*)$/i);
  if (!m) return { label: "Filter", value: teks };
  const kunci = m[1].toLowerCase();
  let value = m[2].trim();
  if (kunci === "nama" && /^all rumah sakit$/i.test(value)) value = "Semua rumah sakit";
  if (kunci !== "nama") value = formatPeriode(value);
  return { label: LABEL[kunci], value };
};

const FilterSummary = ({ items }) => {
  if (!items || items.length === 0) return null;
  return (
    <div className={style.summary}>
      <span className={style.title}>Filter aktif</span>
      {items.map(uraikan).map((f, i) => (
        <span
          key={`${f.label}-${i}`}
          className={`${style.chip} ${f.label === "Periode" ? style.blue : style.brown}`}
          title={`${f.label}: ${f.value}`}
        >
          <span className={style.label}>{f.label}</span>
          <span className={style.value}>{f.value}</span>
        </span>
      ))}
    </div>
  );
};

export default FilterSummary;
