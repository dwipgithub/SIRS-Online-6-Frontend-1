import React, { useState, useEffect } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate, Link } from "react-router-dom";
import style from "./FormTambahRL318.module.css"; // Pastikan file ini ada
import { HiSaveAs } from "react-icons/hi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Spinner from "react-bootstrap/esm/Spinner";
import { useCSRFTokenContext } from "../../Context/CSRFTokenContext";
import { ArrowLeft } from "react-bootstrap-icons";

const FormTambahRL318 = () => {
  const [tahun, setTahun] = useState(String(new Date().getFullYear()));
  const [namaRS, setNamaRS] = useState("");
  const [alamatRS, setAlamatRS] = useState("");
  const [dataRL, setDataRL] = useState([]);
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const [spinner, setSpinner] = useState(false);
  const [buttonStatus, setButtonStatus] = useState(false);
  const navigate = useNavigate();
  const { CSRFToken } = useCSRFTokenContext();

  const startYear = 2025;
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = startYear; y <= currentYear; y++) {
    years.push(y);
  }

  useEffect(() => {
    refreshToken();
    getRLTigaTitikDelapanBelasTemplate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshToken = async () => {
    try {
      const customConfig = { headers: { "XSRF-TOKEN": CSRFToken } };
      const response = await axios.get("/apisirs6v2/token", customConfig);
      setToken(response.data.accessToken);
      const decoded = jwt_decode(response.data.accessToken);
      setExpire(decoded.exp);
      getRumahSakit(decoded.satKerId);
    } catch (error) {
      if (error.response) navigate("/");
    }
  };

  const axiosJWT = axios.create();
  axiosJWT.interceptors.request.use(
    async (config) => {
      const currentDate = new Date();
      if (expire * 1000 < currentDate.getTime()) {
        const customConfig = { headers: { "XSRF-TOKEN": CSRFToken } };
        const response = await axios.get("/apisirs6v2/token", customConfig);
        config.headers.Authorization = `Bearer ${response.data.accessToken}`;
        setToken(response.data.accessToken);
        const decoded = jwt_decode(response.data.accessToken);
        setExpire(decoded.exp);
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  const getRumahSakit = async (id) => {
    try {
      const response = await axiosJWT.get("/apisirs6v2/rumahsakit/" + id, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNamaRS(response.data.data.nama);
      setAlamatRS(response.data.data.alamat);
    } catch (error) {}
  };

  const getRLTigaTitikDelapanBelasTemplate = async () => {
    setSpinner(true);
    try {
      const response = await axiosJWT.get(
        "/apisirs6v2/rltigatitikdelapanbelasgolonganobat",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const rlTemplate = response.data.data.map((value) => ({
        id: value.id,
        no: value.no,
        golonganObat: value.nama,
        rawatJalan: 0,
        igd: 0,
        rawatInap: 0,
        disabledInput: true,
        checked: false,
      }));
      setDataRL(rlTemplate);
      setSpinner(false);
    } catch (error) {
      setSpinner(false);
    }
  };

  const changeHandler = (event, index) => {
    let newDataRL = [...dataRL];
    const { name, value, checked } = event.target;

    if (name === "check") {
      newDataRL[index].disabledInput = !checked;
      newDataRL[index].checked = checked;
    } else {
      newDataRL[index][name] = value === "" ? 0 : value;
    }
    setDataRL(newDataRL);
  };

  const Simpan = async (e) => {
    e.preventDefault();
    setSpinner(true);
    setButtonStatus(true);
    try {
      const dataRLArray = dataRL
        .filter((v) => v.checked)
        .map((v) => ({
          golonganObatId: v.id,
          rawatJalan: parseInt(v.rawatJalan),
          igd: parseInt(v.igd),
          rawatInap: parseInt(v.rawatInap),
        }));

      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "XSRF-TOKEN": CSRFToken,
        },
      };
      await axiosJWT.post(
        "/apisirs6v2/rltigatitikdelapanbelas",
        {
          periodeTahun: parseInt(tahun),
          data: dataRLArray,
        },
        customConfig,
      );

      setSpinner(false);
      toast.success("Data Berhasil Disimpan");
      setTimeout(() => navigate("/rl318"), 1000);
    } catch (error) {
      toast.error(
        `Gagal simpan: ${error.response?.data?.message || error.message}`,
      );
      setButtonStatus(false);
      setSpinner(false);
    }
  };

  return (
    <div
      className="container"
      style={{ marginTop: "80px", marginBottom: "50px" }}
    >
      <form onSubmit={Simpan}>
        <div className="row g-3">
          <div className="col-md-6">
            <div className="card shadow-sm border-0">
              <div className="card-body">
                <h6 className="fw-bold mb-3 text-secondary">
                  Profile Fasyankes
                </h6>
                <div className="form-floating mb-2">
                  <input
                    type="text"
                    className="form-control"
                    value={namaRS}
                    disabled
                  />
                  <label>Nama Rumah Sakit</label>
                </div>
                <div className="form-floating">
                  <input
                    type="text"
                    className="form-control"
                    value={alamatRS}
                    disabled
                  />
                  <label>Alamat</label>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card shadow-sm border-0">
              <div className="card-body">
                <h6 className="fw-bold mb-3 text-secondary">Periode Laporan</h6>
                <div className="form-floating">
                  <select
                    className="form-select"
                    value={tahun}
                    onChange={(e) => setTahun(e.target.value)}
                  >
                    <option value="">Pilih Tahun</option>
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                  <label>Tahun Pelaporan</label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row mt-4">
          <div className="col-md-12">
            <Link to={`/rl318`} className="gl-back">
              <span className="gl-back-icon" aria-hidden="true">
                <ArrowLeft size={18} />
              </span>
              <span className="gl-back-text">
                <small>Kembali ke</small>
                <strong>RL 3.18 Farmasi Resep</strong>
              </span>
            </Link>

            {spinner && (
              <div className="text-center my-3">
                <Spinner animation="border" variant="primary" />
              </div>
            )}

            <div className={style["table-container"]}>
              <table className={style.table}>
                <thead className={style.thead}>
                  <tr>
                    <th
                      className={style["sticky-header"]}
                      style={{ width: "60px" }}
                    >
                      No
                    </th>
                    <th
                      className={style["sticky-header"]}
                      style={{ width: "44px" }}
                    >
                      Pilih
                    </th>
                    <th
                      className={style["sticky-header"]}
                      style={{ width: "30%" }}
                    >
                      Golongan Obat
                    </th>
                    <th>Rawat Jalan</th>
                    <th>IGD</th>
                    <th>Rawat Inap</th>
                  </tr>
                </thead>
                <tbody>
                  {dataRL.map((value, index) => (
                    <tr key={value.id}>
                      <td className={`text-center ${style["sticky-column"]}`}>
                        {value.no}
                      </td>
                      <td className={`text-center ${style["sticky-column"]}`}>
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
                        {value.golonganObat}
                      </td>
                      <td>
                        <input
                          type="number"
                          name="rawatJalan"
                          className="form-control text-center"
                          value={value.rawatJalan}
                          onChange={(e) => changeHandler(e, index)}
                          disabled={
                            value.no === "0" ? true : value.disabledInput
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          name="igd"
                          className="form-control text-center"
                          value={value.igd}
                          onChange={(e) => changeHandler(e, index)}
                          disabled={
                            value.no === "0" ? true : value.disabledInput
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          name="rawatInap"
                          className="form-control text-center"
                          value={value.rawatInap}
                          onChange={(e) => changeHandler(e, index)}
                          disabled={
                            value.no === "0" ? true : value.disabledInput
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <ToastContainer />
          <button
            type="submit"
            className="btn btn-success px-4 py-2"
            disabled={buttonStatus}
          >
            <HiSaveAs className="me-2" /> Simpan
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormTambahRL318;
