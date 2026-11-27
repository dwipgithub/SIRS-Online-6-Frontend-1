import React, { useEffect, useState } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";
import StatusPelaporan, { useStatusPelaporan } from "./StatusPelaporan";
import RingkasanKelengkapan from "./RingkasanKelengkapan";
import { isRS, namaPeran } from "../../utils/peran";
import "./beranda.css";

// Beranda: identitas RS/peran (beranimasi saat tampil),
// ringkasan kelengkapan (kanan) dan status pelaporan per RL (bawah).
// Profil rumah sakit lengkap ada di ../Profil/ProfilRS.js (menu nama RS di sidebar).
const Beranda = () => {
  const { CSRFToken } = useCSRFTokenContext();
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [user, setUser] = useState({});
  const [rs, setRs] = useState(null); // profil RS (login RS saja)
  // true setelah permintaan profil RS selesai (berhasil/gagal), agar judul
  // tampil & beranimasi sekali dengan nama yang sudah final
  const [rsSelesai, setRsSelesai] = useState(false);
  const status = useStatusPelaporan(token);

  useEffect(() => {
    axios
      .get("/apisirs6v2/token", { headers: { "XSRF-TOKEN": CSRFToken } })
      .then((response) => {
        const accessToken = response.data.accessToken;
        const decoded = jwt_decode(accessToken);
        setToken(accessToken);
        setUser(decoded);
        if (isRS(decoded)) {
          axios
            .get("/apisirs6v2/rumahsakit/" + decoded.satKerId, {
              headers: { Authorization: `Bearer ${accessToken}` },
            })
            .then((r) => setRs(r.data.data))
            .catch(() => {}) // gagal dimuat: cukup tampil tanpa alamat
            .finally(() => setRsSelesai(true));
        }
      })
      .catch((error) => {
        if (error.response) navigate("/");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const akunRS = isRS(user);
  // Judul utama: nama RS (login RS) atau nama peran (Dinkes/Kemenkes)
  const judul = akunRS
    ? (rs && rs.nama) || user.nama || "Rumah Sakit"
    : namaPeran(user) || "";
  const tampilJudul = user.jenisUserId && (!akunRS || rsSelesai);
  const keterangan = akunRS
    ? rs && [rs.alamat, rs.kab_kota_nama, rs.provinsi_nama].filter(Boolean).join(", ")
    : null;

  return (
    <div className="container br-sambutan">
      <div className="br-atas">
        <div className="br-kiri">
          {tampilJudul && (
            <>
              <h1 className="br-judul">
                <span className="br-judul-teks">{judul}</span>
              </h1>
              {keterangan && <p className="br-alamat">{keterangan}</p>}
            </>
          )}
        </div>
        <RingkasanKelengkapan data={status.data} />
      </div>
      <StatusPelaporan data={status.data} gagal={status.gagal} user={user} />
    </div>
  );
};

export default Beranda;
