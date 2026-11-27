import React, { useState, useEffect } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate, Link } from "react-router-dom";
import style from "./FormTambahRL316.module.css";
import { HiSaveAs } from "react-icons/hi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// import Spinner from "react-bootstrap/Spinner";
// import { IoArrowBack } from "react-icons/io5";
import { useCSRFTokenContext } from "../../Context/CSRFTokenContext";
import { ArrowLeft } from "react-bootstrap-icons";
import ProfilRSRingkas from "../../Shared/ProfilRSRingkas";
import pf from "../../Shared/ProfilRSRingkas.module.css";

const FormTambahRL316 = () => {
  const [kodeRS, setKodeRS] = useState("");
  const [profilRS, setProfilRS] = useState(null);
  const [tahun, setTahun] = useState(String(new Date().getFullYear()));
  const [dataRL, setDataRL] = useState([]);
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const [buttonStatus, setButtonStatus] = useState(false);
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
    getRLTigaTitikEnamBelasTemplate();
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

  const getRLTigaTitikEnamBelasTemplate = async () => {
    // setSpinner(true);
    try {
      const response = await axiosJWT.get(
        // "/apisirs6v2/jenispelayanankeluargaberencana",
        "/apisirs6v2/rltigatitikenambelasjenispelayanankeluargaberencana",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const rlTemplate = response.data.data.map((value, index) => {
        return {
          id: value.id,
          JenisPelayananKeluargaBerencana: value.nama,
          no: value.id,
          pelayananKbPaskaPersalinan: 0,
          pelayananKbPaskaKeguguran: 0,
          pelayananKbInterval: 0,
          komplikasiKB: 0,
          kegagalanKB: 0,
          efekSamping: 0,
          dropOut: 0,
          disabledInput: true,
          checked: false,
        };
      });
      setDataRL(rlTemplate);
      // setSpinner(false);
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
    } else if (name === "pelayananKbPaskaPersalinan") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].pelayananKbPaskaPersalinan = event.target.value;
    } else if (name === "pelayananKbPaskaKeguguran") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].pelayananKbPaskaKeguguran = event.target.value;
    } else if (name === "pelayananKbInterval") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].pelayananKbInterval = event.target.value;
    } else if (name === "komplikasiKB") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].komplikasiKB = event.target.value;
    } else if (name === "kegagalanKB") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].kegagalanKB = event.target.value;
    } else if (name === "efekSamping") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].efekSamping = event.target.value;
    } else if (name === "dropOut") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].dropOut = event.target.value;
    }
    setDataRL(newDataRL);
  };

  const Simpan = async (e) => {
    e.preventDefault();
    setButtonStatus(true);
    try {
      const dataRLArray = dataRL
        .filter((value) => {
          return value.checked === true;
        })
        .map((value, index) => {
          return {
            JenisPelayananKeluargaBerencanaId: value.id,
            pelayananKbPaskaPersalinan: parseInt(
              value.pelayananKbPaskaPersalinan,
            ),
            pelayananKbPaskaKeguguran: parseInt(
              value.pelayananKbPaskaKeguguran,
            ),
            pelayananKbInterval: parseInt(value.pelayananKbInterval),
            komplikasiKB: parseInt(value.komplikasiKB),
            kegagalanKB: parseInt(value.kegagalanKB),
            efekSamping: parseInt(value.efekSamping),
            dropOut: parseInt(value.dropOut),
          };
        });

      // console.log(dataRLArray);

      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "XSRF-TOKEN": CSRFToken,
        },
      };

      await axiosJWT.post(
        "/apisirs6v2/rltigatitikenambelas",
        {
          tahun: parseInt(tahun),
          data: dataRLArray,
        },
        customConfig,
      );

      toast("Data Berhasil Disimpan", {
        position: toast.POSITION.TOP_RIGHT,
      });
      setTimeout(() => {
        navigate("/rl316");
      }, 1000);
    } catch (error) {
      toast(`Gagal Simpan,${error.response.data.message}`, {
        position: toast.POSITION.TOP_RIGHT,
      });
      setButtonStatus(false);
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
        to={`/rl316/`}
        className="gl-back"
        style={{ "--gl-back-gap": "1rem" }}
      >
        <span className="gl-back-icon" aria-hidden="true">
          <ArrowLeft size={18} />
        </span>
        <span className="gl-back-text">
          <small>Kembali ke</small>
          <strong>RL 3.16 Keluarga Berencana</strong>
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
            <div className={`${style["table-container"]} mt-2 mb-1 pb-2 `}>
              {/* Lebar kolom ditentukan lewat <colgroup>: dengan table-layout
                  fixed, lebar hanya dibaca dari baris judul pertama, padahal
                  "Pelayanan KB" menggabungkan 3 kolom. Lebar No. (60px) dan
                  checklist (44px) harus sama dengan posisi left sticky di
                  FormTambahRL316.module.css. */}
              <table
                className={style.table}
                style={{ width: "100%", minWidth: "1100px" }}
              >
                <colgroup>
                  <col style={{ width: "60px" }} />
                  <col style={{ width: "44px" }} />
                  <col style={{ width: "260px" }} />
                  {Array.from({ length: 7 }).map((_, i) => (
                    <col key={i} />
                  ))}
                </colgroup>
                <thead className={style.thead}>
                  <tr>
                    <th
                      className={style["sticky-header"]}
                      rowSpan="2"
                    >
                      No.
                    </th>
                    <th
                      className={style["sticky-header"]}
                      rowSpan="2"
                    ></th>
                    <th
                      className={style["sticky-header"]}
                      rowSpan="2"
                    >
                      Jenis Pelayanan Keluarga Berencana
                    </th>
                    <th colSpan="3">
                      Pelayanan KB
                    </th>
                    <th rowSpan="2">
                      Komplikasi KB
                    </th>
                    <th rowSpan="2">
                      Kegagalan KB
                    </th>
                    <th rowSpan="2">
                      Efek Samping
                    </th>
                    <th rowSpan="2">
                      Drop Out
                    </th>
                  </tr>
                  <tr>
                    <th>{"Paska Persalinan"}</th>
                    <th>{"Paska Keguguran"}</th>
                    <th>{"Interval"}</th>
                  </tr>
                </thead>
                <tbody>
                  {dataRL.map((value, index) => {
                    if (value.id === 9) {
                      return (
                        <tr key={value.id}>
                          <td
                            className={style["sticky-column"]}
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            {value.id}
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
                              name="check"
                              className="form-check-input"
                              style={{ margin: 0 }}
                              onChange={(e) => changeHandler(e, index)}
                              checked={value.checked}
                            />
                          </td>
                          <td className={style["sticky-column"]}>
                            <input
                              type="text"
                              name="JenisPelayananKeluargaBerencana"
                              className="form-control"
                              value={value.JenisPelayananKeluargaBerencana}
                              disabled={true}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              name="pelayananKbPaskaPersalinan"
                              min={0}
                              maxLength={7}
                              onInput={(e) => maxLengthCheck(e)}
                              className="form-control"
                              value={value.pelayananKbPaskaPersalinan}
                              onChange={(e) => changeHandler(e, index)}
                              disabled={true}
                              onPaste={preventPasteNegative}
                              onKeyPress={preventMinus}
                              onFocus={handleFocus}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              name="pelayananKbPaskaKeguguran"
                              min={0}
                              maxLength={7}
                              onInput={(e) => maxLengthCheck(e)}
                              className="form-control"
                              value={value.pelayananKbPaskaKeguguran}
                              onChange={(e) => changeHandler(e, index)}
                              disabled={true}
                              onPaste={preventPasteNegative}
                              onKeyPress={preventMinus}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              name="pelayananKbInterval"
                              min={0}
                              maxLength={7}
                              onInput={(e) => maxLengthCheck(e)}
                              className="form-control"
                              value={value.pelayananKbInterval}
                              onChange={(e) => changeHandler(e, index)}
                              disabled={true}
                              onPaste={preventPasteNegative}
                              onKeyPress={preventMinus}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              name="komplikasiKB"
                              min={0}
                              maxLength={7}
                              onInput={(e) => maxLengthCheck(e)}
                              className="form-control"
                              value={value.komplikasiKB}
                              onChange={(e) => changeHandler(e, index)}
                              disabled={true}
                              onPaste={preventPasteNegative}
                              onKeyPress={preventMinus}
                              onFocus={handleFocus}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              name="kegagalanKB"
                              min={0}
                              maxLength={7}
                              onInput={(e) => maxLengthCheck(e)}
                              className="form-control"
                              value={value.kegagalanKB}
                              onChange={(e) => changeHandler(e, index)}
                              disabled={true}
                              onPaste={preventPasteNegative}
                              onKeyPress={preventMinus}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              name="efekSamping"
                              min={0}
                              maxLength={7}
                              onInput={(e) => maxLengthCheck(e)}
                              className="form-control"
                              value={value.efekSamping}
                              onChange={(e) => changeHandler(e, index)}
                              disabled={true}
                              onPaste={preventPasteNegative}
                              onKeyPress={preventMinus}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              name="dropOut"
                              min={0}
                              maxLength={7}
                              onInput={(e) => maxLengthCheck(e)}
                              className="form-control"
                              value={value.dropOut}
                              onChange={(e) => changeHandler(e, index)}
                              disabled={true}
                              onPaste={preventPasteNegative}
                              onKeyPress={preventMinus}
                            />
                          </td>
                        </tr>
                      );
                    } else {
                      return (
                        <tr key={value.id}>
                          <td
                            className={style["sticky-column"]}
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            {value.id}
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
                              name="check"
                              className="form-check-input"
                              style={{ margin: 0 }}
                              onChange={(e) => changeHandler(e, index)}
                              checked={value.checked}
                            />
                          </td>
                          <td className={style["sticky-column"]}>
                            <input
                              type="text"
                              name="JenisPelayananKeluargaBerencana"
                              className="form-control"
                              value={value.JenisPelayananKeluargaBerencana}
                              disabled={true}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              name="pelayananKbPaskaPersalinan"
                              min={0}
                              maxLength={7}
                              onInput={(e) => maxLengthCheck(e)}
                              className="form-control"
                              value={value.pelayananKbPaskaPersalinan}
                              onChange={(e) => changeHandler(e, index)}
                              disabled={value.disabledInput}
                              onPaste={preventPasteNegative}
                              onKeyPress={preventMinus}
                              onFocus={handleFocus}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              name="pelayananKbPaskaKeguguran"
                              min={0}
                              maxLength={7}
                              onInput={(e) => maxLengthCheck(e)}
                              className="form-control"
                              value={value.pelayananKbPaskaKeguguran}
                              onChange={(e) => changeHandler(e, index)}
                              disabled={value.disabledInput}
                              onPaste={preventPasteNegative}
                              onKeyPress={preventMinus}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              name="pelayananKbInterval"
                              min={0}
                              maxLength={7}
                              onInput={(e) => maxLengthCheck(e)}
                              className="form-control"
                              value={value.pelayananKbInterval}
                              onChange={(e) => changeHandler(e, index)}
                              disabled={value.disabledInput}
                              onPaste={preventPasteNegative}
                              onKeyPress={preventMinus}
                            />
                          </td>

                          <td>
                            <input
                              type="number"
                              name="komplikasiKB"
                              min={0}
                              maxLength={7}
                              onInput={(e) => maxLengthCheck(e)}
                              className="form-control"
                              value={value.komplikasiKB}
                              onChange={(e) => changeHandler(e, index)}
                              disabled={value.disabledInput}
                              onPaste={preventPasteNegative}
                              onKeyPress={preventMinus}
                              onFocus={handleFocus}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              name="kegagalanKB"
                              min={0}
                              maxLength={7}
                              onInput={(e) => maxLengthCheck(e)}
                              className="form-control"
                              value={value.kegagalanKB}
                              onChange={(e) => changeHandler(e, index)}
                              disabled={value.disabledInput}
                              onPaste={preventPasteNegative}
                              onKeyPress={preventMinus}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              name="efekSamping"
                              min={0}
                              maxLength={7}
                              onInput={(e) => maxLengthCheck(e)}
                              className="form-control"
                              value={value.efekSamping}
                              onChange={(e) => changeHandler(e, index)}
                              disabled={value.disabledInput}
                              onPaste={preventPasteNegative}
                              onKeyPress={preventMinus}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              name="dropOut"
                              min={0}
                              maxLength={7}
                              onInput={(e) => maxLengthCheck(e)}
                              className="form-control"
                              value={value.dropOut}
                              onChange={(e) => changeHandler(e, index)}
                              disabled={value.disabledInput}
                              onPaste={preventPasteNegative}
                              onKeyPress={preventMinus}
                            />
                          </td>
                        </tr>
                      );
                    }
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-3 mb-3">
              <ToastContainer />
              <button
                disabled={buttonStatus}
                type="submit"
                className="btn btn-outline-success"
              >
                <HiSaveAs /> Simpan
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default FormTambahRL316;
