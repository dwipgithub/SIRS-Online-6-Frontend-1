import React, { useState, useEffect } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate, useParams } from "react-router-dom";
import style from "./FormUbahRL314.module.css";
import { HiSaveAs } from "react-icons/hi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Link } from "react-router-dom";
import { useCSRFTokenContext } from "../../Context/CSRFTokenContext";
import { ArrowLeft } from "react-bootstrap-icons";
import ProfilRSRingkas from "../../Shared/ProfilRSRingkas";
import pf from "../../Shared/ProfilRSRingkas.module.css";

const NAMA_BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];
// Kolom "tahun" RL 3.14 berisi tanggal awal bulan, mis. "2026-11-01" -> "November 2026"
const labelPeriode = (p) => {
  const teks = String(p || "");
  // nilai datetime ISO (mis. "2026-10-31T17:00:00.000Z") dibaca dalam zona waktu lokal
  if (teks.includes("T")) {
    const d = new Date(teks);
    return isNaN(d) ? "" : `${NAMA_BULAN[d.getMonth()]} ${d.getFullYear()}`;
  }
  const [t, b] = teks.split("-").map(Number);
  return t && b ? `${NAMA_BULAN[b - 1]} ${t}` : "";
};

export const FormUbahRL314 = () => {
  const [kodeRS, setKodeRS] = useState("");
  const [profilRS, setProfilRS] = useState(null);
  const [periode, setPeriode] = useState("");
  const [jenisKegiatan, setJenisKegiatan] = useState("");
  const [jumlah, setJumlah] = useState("");
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const navigate = useNavigate();
  const [No, setNo] = useState("");
  const { id } = useParams();
  const { CSRFToken } = useCSRFTokenContext();

  useEffect(() => {
    refreshToken();
    getDataRLTigaTitikEmpatBelasDetailById(id);
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
      setExpire(decoded.exp);
      setKodeRS(String(decoded.satKerId));
      getRumahSakit(decoded.satKerId);
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
        const customConfig = {
          headers: {
            "XSRF-TOKEN": CSRFToken,
          },
        };
        const response = await axios.get("/apisirs6v2/token", customConfig);
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

  const getRumahSakit = async (id) => {
    try {
      const response = await axiosJWT.get("/apisirs6v2/rumahsakit/" + id, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setProfilRS(response.data.data);
    } catch (error) {}
  };

  const getDataRLTigaTitikEmpatBelasDetailById = async (id) => {
    try {
      const response = await axiosJWT.get(
        "/apisirs6v2/rltigatitikempatbelas/" + id,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setJenisKegiatan(
        response.data.data.rl_tiga_titik_empat_belas_jenis_kegiatan.nama
      );
      setNo(response.data.data.rl_tiga_titik_empat_belas_jenis_kegiatan.no);
      setJumlah(response.data.data.jumlah);
      setPeriode(response.data.data.tahun);
    } catch (error) {
      console.log(error);
    }
  };

  const changeHandler = (event, index) => {
    if (event.target.value === "") {
      event.target.value = 0;
      event.target.select(event.target.value);
    }
    const targetName = event.target.name;
    switch (targetName) {
      case "jenisKegiatan":
        setJenisKegiatan(event.target.value);
        break;
      case "jumlah":
        setJumlah(event.target.value);
        break;
      default:
        break;
    }
  };

  const Simpan = async (e) => {
    e.preventDefault();
    try {
      const data = {
        jumlah: jumlah,
      };

      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "XSRF-TOKEN": CSRFToken,
        },
      };

      await axiosJWT.patch(
        "/apisirs6v2/rltigatitikempatbelas/" + id,
        data,
        customConfig
      );

      toast("Data Berhasil Diubah", {
        position: toast.POSITION.TOP_RIGHT,
      });
      setTimeout(() => {
        navigate("/rl314");
      }, 1000);
    } catch (error) {
      console.log(error);
      toast("Data Gagal Disimpan", {
        position: toast.POSITION.TOP_RIGHT,
      });
    }
  };

  const preventPasteNegative = (e) => {
    const clipboardData = e.clipboardData || window.clipboardData;
    const pastedData = parseFloat(clipboardData.getData("text"));

    if (pastedData < 0) {
      e.preventDefault();
    }
  };

  const preventMinus = (e) => {
    if (e.code === "Minus") {
      e.preventDefault();
    }
  };

  const maxLengthCheck = (object) => {
    if (object.target.value.length > object.target.maxLength) {
      object.target.value = object.target.value.slice(
        0,
        object.target.maxLength
      );
    }
  };
  const handleFocus = (event) => {
    event.target.select();
  };

  return (
    <div className="container" style={{ marginTop: "70px" }}>
      {/* jarak antar-card (Kembali, profil RS, periode, tabel) sama: 1rem */}
      <Link
        to={`/rl314/`}
        className="gl-back"
        style={{ "--gl-back-gap": "1rem" }}
      >
        <span className="gl-back-icon" aria-hidden="true">
          <ArrowLeft size={18} />
        </span>
        <span className="gl-back-text">
          <small>Kembali ke</small>
          <strong>RL 3.14 Pelayanan Khusus</strong>
        </span>
      </Link>
      <form onSubmit={Simpan}>
        <ProfilRSRingkas kode={kodeRS} rs={profilRS}>
          <div className={pf.periode}>
            {periode && (
              <>
                <span className={pf.periodeLabel}>Periode Laporan</span>
                <span className={pf.periodeTetap}>
                  {labelPeriode(periode)}
                </span>
              </>
            )}
          </div>
        </ProfilRSRingkas>

        <div className="row mt-2">
          <div className="col-md-12">
            <div className={style["table-container"]}>
              <table className={style.table}>
                <thead className={style.thead}>
                  <tr>
                    <th
                      className={style["sticky-header"]}
                      style={{ width: "110px" }}
                    >
                      No Kegiatan
                    </th>
                    <th className={style["sticky-header"]}>Jenis Kegiatan</th>
                    <th style={{ width: "25%" }}>Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  <td
                    className={style["sticky-column"]}
                    style={{ textAlign: "center" }}>{No}</td>
                  <td
                    className={style["sticky-column"]}
                    style={{ textAlign: "left" }}>{jenisKegiatan}</td>
                  <td>
                    <input
                      type="number"
                      name="jumlah"
                      className="form-control"
                      min="0"
                      maxLength={7}
                      onInput={(e) => maxLengthCheck(e)}
                      onPaste={preventPasteNegative}
                      onKeyPress={preventMinus}
                      value={jumlah}
                      onChange={(e) => changeHandler(e)}
                      onFocus={handleFocus}
                    />
                  </td>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="mt-3 mb-3">
          <ToastContainer />
          <button type="submit" className="btn btn-outline-success">
            <HiSaveAs /> Update
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormUbahRL314;
