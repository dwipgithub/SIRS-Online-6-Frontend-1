import React, { useMemo, useState } from "react";
import { Search, XLg, GeoAlt, CheckLg } from "react-bootstrap-icons";
import style from "./FilterRLModal.module.css";
import { perluPilihProvinsi, perluPilihKabKota } from "../../utils/peran";

const MAKS_CHIP = 6;

// Bagian "Wilayah & Rumah Sakit" di FilterRLModal.
// `w` adalah hasil useWilayahRS(); komponen ini hanya tampilan.
const PilihRumahSakit = ({ user, w, maks }) => {
  const [cari, setCari] = useState("");

  const tampil = useMemo(() => {
    const kata = cari.trim().toLowerCase();
    if (!kata) return w.daftarRS;
    return w.daftarRS.filter(
      (rs) =>
        String(rs.nama || "").toLowerCase().includes(kata) ||
        String(rs.id).includes(kata)
    );
  }, [cari, w.daftarRS]);

  const semuaTampilTerpilih =
    tampil.length > 0 && tampil.every((rs) => w.idTerpilih.has(rs.id));

  // "Pilih semua" hanya untuk RS yang sedang tampil (setelah pencarian)
  const togglePilihSemua = () => {
    const idTampil = new Set(tampil.map((rs) => rs.id));
    if (semuaTampilTerpilih) {
      w.setRsDipilih((cur) => cur.filter((v) => !idTampil.has(v.id)));
    } else {
      w.setRsDipilih((cur) => [
        ...cur,
        ...tampil
          .filter((rs) => !w.idTerpilih.has(rs.id))
          .map((rs) => ({ id: rs.id, nama: rs.nama })),
      ]);
    }
  };

  const butuhProvinsi = perluPilihProvinsi(user) && !w.provinsiId;
  const lewatBatas = w.rsDipilih.length > maks && !w.semuaTerpilih;

  return (
    <div>
      {(perluPilihProvinsi(user) || perluPilihKabKota(user)) && (
        <div className={style.wilayah}>
          {perluPilihProvinsi(user) && (
            <label className={style.field}>
              <span className={style.fieldLabel}>Provinsi</span>
              <select
                className="form-select"
                value={w.provinsiId || ""}
                onChange={(e) => w.gantiProvinsi(e.target.value)}
              >
                <option value="">Pilih provinsi…</option>
                {w.daftarProvinsi.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nama}
                  </option>
                ))}
              </select>
            </label>
          )}
          {perluPilihKabKota(user) && (
            <label className={style.field}>
              <span className={style.fieldLabel}>Kab/Kota</span>
              <select
                className="form-select"
                value={w.kabKotaId || ""}
                onChange={(e) => w.gantiKabKota(e.target.value)}
                disabled={butuhProvinsi}
              >
                <option value="">Semua kab/kota</option>
                {w.daftarKabKota.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      )}

      <div className={style.searchBox}>
        <Search className={style.searchIcon} size={15} />
        <input
          type="search"
          className={style.searchInput}
          placeholder="Cari nama atau kode rumah sakit…"
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          disabled={w.daftarRS.length === 0}
          aria-label="Cari rumah sakit"
        />
      </div>

      <div className={style.listToolbar}>
        <button
          type="button"
          className={`${style.selectAll} ${semuaTampilTerpilih ? style.on : ""}`}
          onClick={togglePilihSemua}
          disabled={tampil.length === 0}
          aria-pressed={semuaTampilTerpilih}
        >
          <span className={style.box} aria-hidden="true">
            {semuaTampilTerpilih && <CheckLg size={12} />}
          </span>
          {semuaTampilTerpilih ? "Batalkan semua" : "Pilih semua"}
          {cari ? " hasil" : ""} <span className={style.muted}>({tampil.length})</span>
        </button>
        <span className={`${style.counter} ${lewatBatas ? style.counterWarn : ""}`}>
          {w.rsDipilih.length} dipilih
        </span>
      </div>

      <div className={style.rsList} role="group" aria-label="Daftar rumah sakit">
        {w.memuat && (
          <div className={style.empty}>
            <span className={style.spinner} /> Memuat daftar rumah sakit…
          </div>
        )}
        {!w.memuat && w.daftarRS.length === 0 && (
          <div className={style.empty}>
            <GeoAlt size={22} />
            <div>{butuhProvinsi ? "Pilih provinsi terlebih dahulu" : "Tidak ada rumah sakit"}</div>
          </div>
        )}
        {!w.memuat && w.daftarRS.length > 0 && tampil.length === 0 && (
          <div className={style.empty}>Tidak ada yang cocok dengan “{cari}”</div>
        )}
        {tampil.map((rs) => {
          const on = w.idTerpilih.has(rs.id);
          return (
            <button
              type="button"
              key={rs.id}
              className={`${style.rsItem} ${on ? style.on : ""}`}
              onClick={() => w.toggleRS(rs)}
              aria-pressed={on}
            >
              <span className={style.box} aria-hidden="true">
                {on && <CheckLg size={12} />}
              </span>
              <span className={style.rsName}>{rs.nama}</span>
              <span className={style.rsCode}>{rs.id}</span>
            </button>
          );
        })}
      </div>

      {w.rsDipilih.length > 0 && (
        <div className={style.chips}>
          {w.semuaTerpilih ? (
            <span className={`${style.chip} ${style.chipAll}`}>
              Semua RS di {w.namaWilayah} ({w.rsDipilih.length})
              <button type="button" onClick={() => w.setRsDipilih([])} aria-label="Hapus semua">
                <XLg size={10} />
              </button>
            </span>
          ) : (
            <>
              {w.rsDipilih.slice(0, MAKS_CHIP).map((rs) => (
                <span key={rs.id} className={style.chip} title={rs.nama}>
                  <span className={style.chipText}>{rs.nama}</span>
                  <button type="button" onClick={() => w.hapusRS(rs.id)} aria-label={`Hapus ${rs.nama}`}>
                    <XLg size={10} />
                  </button>
                </span>
              ))}
              {w.rsDipilih.length > MAKS_CHIP && (
                <span className={`${style.chip} ${style.chipMore}`}>
                  +{w.rsDipilih.length - MAKS_CHIP} lainnya
                </span>
              )}
            </>
          )}
        </div>
      )}

      {lewatBatas && (
        <div className={style.warn}>
          Maksimal {maks} RS bila dipilih satu per satu. Untuk lebih banyak,
          gunakan <strong>Pilih semua</strong> tanpa pencarian.
        </div>
      )}
    </div>
  );
};

export default PilihRumahSakit;
