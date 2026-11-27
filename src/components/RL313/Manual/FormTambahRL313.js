import React, { useState, useEffect } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { Link, useNavigate } from "react-router-dom";
import style from "./FormTambahRL313.module.css";
import { HiSaveAs } from "react-icons/hi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useCSRFTokenContext } from "../../Context/CSRFTokenContext";
import { ArrowLeft } from "react-bootstrap-icons";
import ProfilRSRingkas from "../../Shared/ProfilRSRingkas";
import pf from "../../Shared/ProfilRSRingkas.module.css";

const FormTambahRL313 = () => {
  const [kodeRS, setKodeRS] = useState("");
  const [profilRS, setProfilRS] = useState(null);
  const [tahun, setTahun] = useState(String(new Date().getFullYear()));
  const [dataRL, setDataRL] = useState([]);
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const navigate = useNavigate();
  const { CSRFToken } = useCSRFTokenContext();

  const startYear = 2025;
  const currentYear = new Date().getFullYear(); // sekarang 2026

  const years = [];
  for (let y = startYear; y <= currentYear; y++) {
    years.push(y);
  }

  useEffect(() => {
    refreshToken();
    getRLTigaTitikTigaBelasTemplate();

    // setTahun(date.getFullYear() - 1);
    // setTahun(date.getFullYear());
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
    },
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

  const getRLTigaTitikTigaBelasTemplate = async () => {
    try {
      const response = await axiosJWT.get(
        "/apisirs6v2/jenistindakanrltigatitiktigabelas",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const rlTemplate = response.data.data.map((value, index) => {
        return {
          id: value.id,
          no: value.no,
          jenisTindakan: value.nama,
          jumlah: 0,
          disabledInput: true,
          checked: false,
        };
      });
      setDataRL(rlTemplate);
    } catch (error) {}
  };



  const changeHandler = (event, index) => {
    let newDataRL = [...dataRL];
    const name = event.target.name;
    if (name === "check") {
      if (event.target.checked === true) {
        newDataRL[index].disabledInput = false;
      } else if (event.target.checked === false) {
        newDataRL[index].disabledInput = true;
      }
      newDataRL[index].checked = event.target.checked;
    } else if (name === "no") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].no = event.target.value;
    } else if (name === "jenisTindakan") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].jenisTindakan = event.target.value;
    } else if (name === "jumlah") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].jumlah = event.target.value;
    }
    setDataRL(newDataRL);
  };

  const Simpan = async (e) => {
    e.preventDefault();
    try {
      const dataRLArray = dataRL
        .filter((value) => {
          return value.checked === true;
        })
        .map((value, index) => {
          return {
            rl_tiga_titik_tiga_belas_jenis_tindakan_id: parseInt(value.id),
            jumlah: parseInt(value.jumlah),
          };
        });

      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "XSRF-TOKEN": CSRFToken,
        },
      };
      await axiosJWT.post(
        "/apisirs6v2/rltigatitiktigabelas",
        {
          tahun: parseInt(tahun),
          data: dataRLArray,
        },
        customConfig,
      );
      // console.log(result.data)
      toast("Data Berhasil Disimpan", {
        position: toast.POSITION.TOP_RIGHT,
      });
      setTimeout(() => {
        navigate("/rl313");
      }, 1000);
    } catch (error) {
      toast(`Data tidak bisa disimpan karena ,${error.response.data.message}`, {
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
        object.target.maxLength,
      );
    }
  };
  return (
    <div
      className="container"
      style={{ marginTop: "70px", marginBottom: "70px" }}
    >
      {/* jarak antar-card (Kembali, profil RS, periode, tabel) sama: 1rem */}
      <Link
        to={`/rl313/`}
        className="gl-back"
        style={{ "--gl-back-gap": "1rem" }}
      >
        <span className="gl-back-icon" aria-hidden="true">
          <ArrowLeft size={18} />
        </span>
        <span className="gl-back-text">
          <small>Kembali ke</small>
          <strong>RL 3.13 Rehabilitasi Medik</strong>
        </span>
      </Link>
      <form onSubmit={Simpan}>
        <ProfilRSRingkas kode={kodeRS} rs={profilRS}>
          <div className={pf.periode}>
            <span className={pf.periodeLabel}>Periode Laporan</span>
            <select
              name="tahun"
              className={`form-select ${pf.pilih}`}
              id="tahun"
              value={tahun}
              onChange={(e) => setTahun(e.target.value)}
              aria-label="Tahun"
            >
              <option value="">Pilih Tahun</option>

              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
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
                      style={{ width: "60px" }}
                    >
                      No.
                    </th>
                    <th
                      className={style["sticky-header"]}
                      style={{ width: "44px" }}
                    ></th>
                    <th
                      className={style["sticky-header"]}
                      style={{ width: "110px" }}
                    >
                      No Kegiatan
                    </th>
                    <th>Jenis Tindakan</th>
                    <th style={{ width: "20%" }}>Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  {dataRL.map((value, index) => {
                    if (Number(value.no) === 88) {
                      return (
                        <tr key={value.id}>
                          <td className={style["sticky-column"]}>
                            <input
                              type="text"
                              name="id"
                              className="form-control"
                              value={index + 1}
                              disabled={true}
                            />
                          </td>
                          <td
                            className={style["sticky-column"]}
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <input
                              type="checkbox"
                              style={{ margin: 0 }}
                              name="check"
                              className="form-check-input"
                              onChange={(e) => changeHandler(e, index)}
                              checked={value.checked}
                            />
                          </td>
                          <td className={style["sticky-column"]}>
                            <input
                              type="text"
                              name="no"
                              className="form-control"
                              value={value.no}
                              disabled={true}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              name="jenisTindakan"
                              className="form-control"
                              value={value.jenisTindakan}
                              disabled={true}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              maxLength={7}
                              onInput={(e) => maxLengthCheck(e)}
                              onPaste={preventPasteNegative}
                              onKeyPress={preventMinus}
                              name="jumlah"
                              className="form-control"
                              value={value.jumlah}
                              onChange={(e) => changeHandler(e, index)}
                              disabled={true}
                            />
                          </td>
                        </tr>
                      );
                    } else {
                      return (
                        <tr key={value.id}>
                          <td className={style["sticky-column"]}>
                            <input
                              type="text"
                              name="id"
                              className="form-control"
                              value={index + 1}
                              disabled={true}
                            />
                          </td>
                          <td
                            className={style["sticky-column"]}
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <input
                              type="checkbox"
                              style={{ margin: 0 }}
                              name="check"
                              className="form-check-input"
                              onChange={(e) => changeHandler(e, index)}
                              checked={value.checked}
                            />
                          </td>
                          <td className={style["sticky-column"]}>
                            <input
                              type="text"
                              name="no"
                              className="form-control"
                              value={value.no}
                              disabled={true}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              name="jenisTindakan"
                              className="form-control"
                              value={value.jenisTindakan}
                              disabled={true}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              maxLength={7}
                              onInput={(e) => maxLengthCheck(e)}
                              onPaste={preventPasteNegative}
                              onKeyPress={preventMinus}
                              name="jumlah"
                              className="form-control"
                              value={value.jumlah}
                              onChange={(e) => changeHandler(e, index)}
                              disabled={value.disabledInput}
                            />
                          </td>
                        </tr>
                      );
                    }
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="mt-3 mb-3">
          <ToastContainer />
          <button type="submit" className="btn btn-outline-success">
            <HiSaveAs /> Simpan
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormTambahRL313;
