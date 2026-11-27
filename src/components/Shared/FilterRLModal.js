import React, { useEffect, useState } from "react";
import Modal from "react-bootstrap/Modal";
import {
  Funnel,
  Hospital,
  Calendar3,
  ChevronLeft,
  ChevronRight,
  ArrowCounterclockwise,
} from "react-bootstrap-icons";
import style from "./FilterRLModal.module.css";
import PilihRumahSakit from "./PilihRumahSakit";
import { bisaPilihBanyakRS } from "../../utils/peran";

export const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const SINGKAT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

const TAHUN_MIN = 2023; // backend: periodeTahun > 2022

/**
 * Modal filter RL yang dipakai bersama.
 *
 *   <FilterRLModal
 *     show onHide judul="RL 3.2 Rawat Inap"
 *     user={user} w={useWilayahRS(...)} rumahSakitSendiri={rs}
 *     maksPilih={100}
 *     onApply={({ rs, semuaWilayah, bulan, tahun }) => ...}
 *   />
 *
 * Periode: satu bulan.
 * maksPilih = batas RS bila dipilih satu per satu ("pilih semua" tidak dibatasi).
 */
const FilterRLModal = ({
  show,
  onHide,
  onApply,
  judul,
  user,
  w,
  rumahSakitSendiri,
  maksPilih = 100,
  bulanAwal,
  tahunAwal,
}) => {
  const sekarang = new Date();
  const tahunIni = sekarang.getFullYear();
  const bulanIni = sekarang.getMonth() + 1;

  const [bulan, setBulan] = useState(bulanAwal || bulanIni);
  const [tahun, setTahun] = useState(tahunAwal || tahunIni);

  useEffect(() => {
    if (show) {
      if (bulanAwal) setBulan(bulanAwal);
      if (tahunAwal) setTahun(tahunAwal);
    }
  }, [show, bulanAwal, tahunAwal]);

  const banyak = bisaPilihBanyakRS(user);
  const jumlahRS = banyak ? w.rsDipilih.length : rumahSakitSendiri ? 1 : 0;
  const bulanMasaDepan = (b) => tahun === tahunIni && b > bulanIni;

  const pilihanValid = banyak
    ? jumlahRS > 0 && (w.semuaTerpilih || jumlahRS <= maksPilih)
    : !!rumahSakitSendiri;
  const bisaTerapkan = pilihanValid && !bulanMasaDepan(bulan);

  const gantiTahun = (delta) => {
    const t = Math.min(tahunIni, Math.max(TAHUN_MIN, tahun + delta));
    setTahun(t);
    if (t === tahunIni && bulan > bulanIni) setBulan(bulanIni);
  };

  const terapkan = (e) => {
    e.preventDefault();
    if (!bisaTerapkan) return;
    onApply({
      rs: banyak
        ? w.rsDipilih
        : [{ id: String(rumahSakitSendiri.id), nama: rumahSakitSendiri.nama }],
      semuaWilayah: banyak && w.semuaTerpilih ? w.paramSemuaWilayah() : null,
      namaWilayah: w ? w.namaWilayah : "",
      bulan,
      tahun,
    });
  };

  const reset = () => {
    if (banyak) w.reset();
    setBulan(bulanIni);
    setTahun(tahunIni);
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      size={banyak ? "lg" : undefined}
      centered
      dialogClassName={style.dialog}
      contentClassName={style.content}
      style={{ position: "fixed" }}
    >
      <form onSubmit={terapkan}>
        <div className={style.header}>
          <div className={style.headerIcon}>
            <Funnel size={20} />
          </div>
          <div>
            <h5 className={style.title}>Filter Data</h5>
            <div className={style.subtitle}>{judul}</div>
          </div>
          <button type="button" className={style.close} onClick={onHide} aria-label="Tutup">
            ×
          </button>
        </div>

        <div className={`${style.body} ${banyak ? style.twoCol : ""}`}>
          <section className={style.section}>
            <div className={style.step}>
              <span className={style.stepNo}>1</span>
              <div>
                <div className={style.stepTitle}>
                  <Hospital size={14} /> Rumah Sakit
                </div>
                <div className={style.stepHint}>
                  {banyak
                    ? "Pilih satu atau beberapa rumah sakit"
                    : "Data rumah sakit Anda"}
                </div>
              </div>
            </div>

            {banyak ? (
              <PilihRumahSakit user={user} w={w} maks={maksPilih} />
            ) : (
              <div className={style.rsCard}>
                <div className={style.rsCardIcon}>
                  <Hospital size={18} />
                </div>
                <div>
                  <div className={style.rsCardName}>
                    {rumahSakitSendiri ? rumahSakitSendiri.nama : "Memuat…"}
                  </div>
                  {rumahSakitSendiri && (
                    <div className={style.rsCardMeta}>
                      {rumahSakitSendiri.kab_kota_nama}
                      {rumahSakitSendiri.provinsi_nama ? `, ${rumahSakitSendiri.provinsi_nama}` : ""}
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          <section className={style.section}>
            <div className={style.step}>
              <span className={style.stepNo}>2</span>
              <div>
                <div className={style.stepTitle}>
                  <Calendar3 size={14} /> Periode
                </div>
                <div className={style.stepHint}>Bulan dan tahun laporan</div>
              </div>
            </div>

            <div className={style.year}>
              <button
                type="button"
                onClick={() => gantiTahun(-1)}
                disabled={tahun <= TAHUN_MIN}
                aria-label="Tahun sebelumnya"
              >
                <ChevronLeft size={16} />
              </button>
              <span className={style.yearValue}>{tahun}</span>
              <button
                type="button"
                onClick={() => gantiTahun(1)}
                disabled={tahun >= tahunIni}
                aria-label="Tahun berikutnya"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className={style.months} role="radiogroup" aria-label="Bulan">
              {SINGKAT.map((nama, i) => {
                const b = i + 1;
                const dis = bulanMasaDepan(b);
                return (
                  <button
                    type="button"
                    key={b}
                    role="radio"
                    aria-checked={bulan === b}
                    title={NAMA_BULAN[i]}
                    className={`${style.month} ${bulan === b ? style.on : ""}`}
                    disabled={dis}
                    onClick={() => setBulan(b)}
                  >
                    {nama}
                  </button>
                );
              })}
            </div>

          </section>
        </div>

        <div className={style.footer}>
          <div className={style.summary}>
            <span className={style.summaryStrong}>
              {banyak
                ? w.semuaTerpilih
                  ? `Semua RS (${jumlahRS})`
                  : `${jumlahRS} RS`
                : rumahSakitSendiri
                ? rumahSakitSendiri.nama
                : "-"}
            </span>
            <span className={style.dot}>•</span>
            <span>
              {NAMA_BULAN[bulan - 1]} {tahun}
            </span>
          </div>
          <div className={style.actions}>
            <button type="button" className={style.btnGhost} onClick={reset}>
              <ArrowCounterclockwise size={14} /> Reset
            </button>
            <button type="submit" className={style.btnPrimary} disabled={!bisaTerapkan}>
              Terapkan
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default FilterRLModal;
