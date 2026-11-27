import React from "react";
import style from "./ProfilRSRingkas.module.css";

/**
 * Baris ringkas identitas RS di atas form input RL, sebagai konfirmasi
 * "data ini masuk ke RS mana". Isi tambahan di bawah profil (opsional) lewat children.
 *
 *   <ProfilRSRingkas kode="3318125" rs={{ nama, kab_kota_nama, provinsi_nama }} />
 *
 * Bila profil RS gagal dimuat (API Faskes lambat/gagal), cukup kode RS.
 */
const ProfilRSRingkas = ({ kode, rs, children }) => {
  const wilayah = rs
    ? [rs.kab_kota_nama, rs.provinsi_nama].filter(Boolean).join(", ")
    : "";
  return (
    <div className={style.bar}>
      <div className={style.rs}>
        <div className={style.teks}>
          <div className={style.nama}>
            {rs && rs.nama ? rs.nama : kode ? `RS ${kode}` : "Memuat…"}
          </div>
          {wilayah && <div className={style.wilayah}>{wilayah}</div>}
        </div>
      </div>
      {children && <div className={style.kanan}>{children}</div>}
    </div>
  );
};

export default ProfilRSRingkas;
