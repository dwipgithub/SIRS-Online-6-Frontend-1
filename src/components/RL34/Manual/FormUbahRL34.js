import React, { useState, useEffect } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate, useParams, Link } from "react-router-dom";
import style from "./FormUbahRL34.module.css";
import { HiSaveAs } from "react-icons/hi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Spinner from "react-bootstrap/Spinner";
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
// "2026-11" -> "November 2026"
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

export const FormUbahRL34 = () => {
  const [tahun, setTahun] = useState("");
  // const [bulan, setBulan] = useState('')
  const [kodeRS, setKodeRS] = useState("");
  const [profilRS, setProfilRS] = useState(null);
  const [jumlah, setJumlah] = useState("");
  // const [no, setNo] = useState('')
  const [nama, setNama] = useState("");
  // const [dataRL, setDataRL] = useState([])
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const navigate = useNavigate();
  const { id } = useParams();

  const [buttonStatus, setButtonStatus] = useState(false);
  const [spinner, setSpinner] = useState(false);
  const { CSRFToken } = useCSRFTokenContext();

  useEffect(() => {
    refreshToken();
    getRLTigaTitikEmpatById();

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
      getDataRS(decoded.satKerId);
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

  const changeHandler = (event, index) => {
    // let newDataRL = [...dataRL]
    const name = event.target.name;
    if (name === "jumlah") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      setJumlah(parseInt(event.target.value));
    }
  };

  const getDataRS = async (id) => {
    try {
      const response = await axiosJWT.get("/apisirs6v2/rumahsakit/" + id, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      //console.log(response.data)
      setProfilRS(response.data.data);
    } catch (error) {}
  };
  const updateDataRLTigaTitikEmpat = async (e) => {
    e.preventDefault();
    setSpinner(true);
    setButtonStatus(true);
    try {
      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "XSRF-TOKEN": CSRFToken,
        },
      };
      await axiosJWT.patch(
        "/apisirs6v2/rltigatitikempatdetail/" + id,
        {
          jumlah,
        },
        customConfig
      );
      setSpinner(false);
      toast("Data Berhasil Diupdate", {
        position: toast.POSITION.TOP_RIGHT,
      });
      setTimeout(() => {
        navigate("/RL34");
      }, 1000);
    } catch (error) {
      console.log(error);
      toast("Data Gagal Diupdate", {
        position: toast.POSITION.TOP_RIGHT,
      });
      setButtonStatus(false);
      setSpinner(false);
    }
  };

  const getRLTigaTitikEmpatById = async () => {
    setSpinner(true);
    const response = await axiosJWT.get(
      "/apisirs6v2/rltigatitikempatdetail/" + id,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    setNama(response.data.data.jenis_pengunjung_rl_tiga_titik_tempat.nama);
    setJumlah(response.data.data.jumlah);
    setTahun(response.data.data.tahun);

    if (tahun.substring(5, 7) === "01") {
      // setBulan('Januari')
    } else if (tahun.substring(5, 7) === "02") {
      // setBulan('Februari')
    } else if (tahun.substring(5, 7) === "03") {
      // setBulan('Maret')
    } else if (tahun.substring(5, 7) === "04") {
      // setBulan('April')
    } else if (tahun.substring(5, 7) === "05") {
      // setBulan('Mei')
    } else if (tahun.substring(5, 7) === "06") {
      // setBulan('Juni')
    } else if (tahun.substring(5, 7) === "07") {
      // setBulan('Juli')
    } else if (tahun.substring(5, 7) === "08") {
      // setBulan('Agustus')
    } else if (tahun.substring(5, 7) === "09") {
      // setBulan('September')
    } else if (tahun.substring(5, 7) === "10") {
      // setBulan('Oktober')
    } else if (tahun.substring(5, 7) === "11") {
      // setBulan('November')
    } else if (tahun.substring(5, 7) === "12") {
      // setBulan('Desember')
    }

    setSpinner(false);
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

  const handleFocus = (event) => {
    event.target.select();
  };

  const maxLengthCheck = (object) => {
    if (object.target.value.length > object.target.maxLength) {
      object.target.value = object.target.value.slice(
        0,
        object.target.maxLength
      );
    }
  };

  return (
    <div className="container" style={{ marginTop: "70px" }}>
      {/* jarak antar-card (Kembali, profil RS, periode, tabel) sama: 1rem */}
      <Link
        to={`/RL34`}
        className="gl-back"
        style={{ "--gl-back-gap": "1rem" }}
      >
        <span className="gl-back-icon" aria-hidden="true">
          <ArrowLeft size={18} />
        </span>
        <span className="gl-back-text">
          <small>Kembali ke</small>
          <strong>RL 3.4 Pengunjung</strong>
        </span>
      </Link>
      <form onSubmit={updateDataRLTigaTitikEmpat}>
        <ProfilRSRingkas kode={kodeRS} rs={profilRS}>
          <div className={pf.periode}>
            {tahun && (
              <>
                <span className={pf.periodeLabel}>Periode Laporan</span>
                <span className={pf.periodeTetap}>
                  {labelPeriode(tahun)}
                </span>
              </>
            )}
          </div>
        </ProfilRSRingkas>

        <div className="row mt-2 mb-3">
          <div className="col-md-12">
            {/* <h3>Ubah data RL 3.4 -  Pengunjung</h3> */}
            <div className="container" style={{ textAlign: "center" }}>
              {spinner && (
                <Spinner animation="grow" variant="success"></Spinner>
              )}
              {spinner && (
                <Spinner animation="grow" variant="success"></Spinner>
              )}
              {spinner && (
                <Spinner animation="grow" variant="success"></Spinner>
              )}
              {spinner && (
                <Spinner animation="grow" variant="success"></Spinner>
              )}
              {spinner && (
                <Spinner animation="grow" variant="success"></Spinner>
              )}
              {spinner && (
                <Spinner animation="grow" variant="success"></Spinner>
              )}
            </div>
            <table className={style.rlTable}>
              <thead>
                <tr>
                  <th style={{ width: "5%" }}>No.</th>
                  <th style={{ width: "40%" }}>Jenis Pengunjung</th>
                  <th>Jumlah</th>
                </tr>
              </thead>
              <tbody>
                <tr key={id}>
                  <td>
                    <input
                      type="text"
                      name="id"
                      className="form-control"
                      value="1"
                      disabled={true}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      name="jenisPengunjung"
                      className="form-control"
                      value={nama}
                      disabled={true}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      onFocus={handleFocus}
                      maxLength={7}
                      onInput={(e) => maxLengthCheck(e)}
                      name="jumlah"
                      className="form-control"
                      value={jumlah}
                      onChange={(e) => changeHandler(e)}
                      onPaste={preventPasteNegative}
                      onKeyPress={preventMinus}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-3 mb-3">
          <ToastContainer />
          <button
            type="submit"
            disabled={buttonStatus}
            className="btn btn-outline-success"
          >
            <HiSaveAs /> Update
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormUbahRL34;
