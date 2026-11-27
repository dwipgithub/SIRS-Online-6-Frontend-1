import React, { useState, useEffect } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate, useParams, Link } from "react-router-dom";
import style from "./FormUbahRL315.module.css";
import { HiSaveAs } from "react-icons/hi";
// import Table from "react-bootstrap/Table";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useCSRFTokenContext } from "../../Context/CSRFTokenContext";
import { ArrowLeft } from "react-bootstrap-icons";
import ProfilRSRingkas from "../../Shared/ProfilRSRingkas";
import pf from "../../Shared/ProfilRSRingkas.module.css";

export const FormUbahRL315 = () => {
  const navigate = useNavigate();
  // Data RS
  const [kodeRS, setKodeRS] = useState("");
  const [profilRS, setProfilRS] = useState(null);
  const [periode, setPeriode] = useState("");
  // Cred
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  // Data RL
  const [laki, setLaki] = useState(0);
  const [perempuan, setPerempuan] = useState(0);
  const { id } = useParams();
  const [no, setNo] = useState("");
  const [nama, setNama] = useState("");
  const { CSRFToken } = useCSRFTokenContext();

  useEffect(() => {
    refreshToken();
    getDataRLTigaTitikLimaBelasDetailById(id);
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

  const getDataRS = async (id) => {
    try {
      const response = await axiosJWT.get("/apisirs6v2/rumahsakit/" + id, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      //console.log(response.data)
      setProfilRS(response.data.data);
    } catch (error) {
      console.log(error);
    }
  };

  const getDataRLTigaTitikLimaBelasDetailById = async (id) => {
    try {
      const response = await axiosJWT.get(
        "/apisirs6v2/rltigatitiklimabelasdetail/" + id,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setNo(response.data.data.jenis_kegiatan_rl_tiga_titik_lima_belas.no);
      setNama(response.data.data.jenis_kegiatan_rl_tiga_titik_lima_belas.nama);
      setLaki(response.data.data.laki);
      setPerempuan(response.data.data.perempuan);
      setPeriode(response.data.data.tahun);
    } catch (error) {
      console.log(error);
    }
  };

  const updateData = async (e) => {
    e.preventDefault();
    try {
      const data = {
        laki: laki,
        perempuan: perempuan,
        jumlah: parseInt(laki) + parseInt(perempuan),
      };

      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "XSRF-TOKEN": CSRFToken,
        },
      };

      await axiosJWT.patch(
        "/apisirs6v2/rltigatitiklimabelasdetail/" + id,
        data,
        customConfig
      );

      toast("Data Berhasil Diubah", {
        position: toast.POSITION.TOP_RIGHT,
      });
      setTimeout(() => {
        navigate("/rl315");
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


  const handleFocus = (event) => {
    event.target.select();
  };

  return (
    <div
      className="container"
      style={{ marginTop: "70px", marginBottom: "70px" }}
    >
      {/* jarak antar-card (Kembali, profil RS, periode, tabel) sama: 1rem */}
      <Link
        to={`/rl315/`}
        className="gl-back"
        style={{ "--gl-back-gap": "1rem" }}
      >
        <span className="gl-back-icon" aria-hidden="true">
          <ArrowLeft size={18} />
        </span>
        <span className="gl-back-text">
          <small>Kembali ke</small>
          <strong>RL 3.15 Kesehatan Jiwa</strong>
        </span>
      </Link>
      <form onSubmit={updateData}>
        <ProfilRSRingkas kode={kodeRS} rs={profilRS}>
          <div className={pf.periode}>
            {periode && (
              <>
                <span className={pf.periodeLabel}>Periode Laporan</span>
                <span className={pf.periodeTetap}>
                  {periode}
                </span>
              </>
            )}
          </div>
        </ProfilRSRingkas>

        <div className="row mt-2">
          <div className="col-md-12">
            <div className={`${style["table-container"]} mt-2 mb-1 pb-2 `}>
              <table className={style.table}>
                <thead className={style.thead}>
                  <tr className="main-header-row">
                    <th
                      className={style["sticky-header"]}
                      style={{ width: "60px" }}
                    >
                      No
                    </th>
                    <th className={style["sticky-header"]}>Jenis Kegiatan</th>
                    <th>Laki-laki</th>
                    <th>Perempuan</th>
                    <th>Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={style["sticky-column"]}>
                      <input
                        type="text"
                        name="no"
                        className="form-control"
                        value={no}
                        disabled={true}
                      />
                    </td>
                    <td className={style["sticky-column"]}>
                      <input
                        type="text"
                        name="jenisKegiatan"
                        className="form-control"
                        value={nama}
                        disabled={true}
                        onFocus={handleFocus}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="laki"
                        className="form-control"
                        value={laki}
                        onChange={(e) => setLaki(e.target.value)}
                        min={0}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="perempuan"
                        className="form-control"
                        value={perempuan}
                        onChange={(e) => setPerempuan(e.target.value)}
                        min={0}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="jumlah"
                        className="form-control"
                        value={parseInt(laki) + parseInt(perempuan)}
                        // onChange={(e) => setJumlah(e.target.value)}
                        readOnly={true}
                        min={0}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                      />
                    </td>
                  </tr>
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

export default FormUbahRL315;
