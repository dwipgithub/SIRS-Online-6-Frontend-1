import React, { useState, useEffect } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { Link, useNavigate } from "react-router-dom";
import style from "./FormTambahRL314.module.css";
import { HiSaveAs } from "react-icons/hi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useCSRFTokenContext } from "../../Context/CSRFTokenContext";
import { ArrowLeft } from "react-bootstrap-icons";

const FormTambahRL314 = () => {
  const [tahun, setTahun] = useState(String(new Date().getFullYear()));
  const [bulan, setBulan] = useState(String(new Date().getMonth() + 1).padStart(2, "0"));
  const [namaRS, setNamaRS] = useState("");
  const [alamatRS, setAlamatRS] = useState("");
  const [namaPropinsi, setNamaPropinsi] = useState("");
  const [namaKabKota, setNamaKabKota] = useState("");
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
    getRLTigaTitikEmpatBelasTemplate();
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
      setNamaRS(response.data.data.nama);
      setAlamatRS(response.data.data.alamat);
      setNamaPropinsi(response.data.data.provinsi_nama);
      setNamaKabKota(response.data.data.kab_kota_nama);
    } catch (error) {}
  };

  const getRLTigaTitikEmpatBelasTemplate = async () => {
    try {
      const response = await axiosJWT.get(
        "/apisirs6v2/rltigatitikempatbelasjeniskegiatan",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // console.log(response)

      const rlTemplate = response.data.data.map((value, index) => {
        return {
          id: value.id,
          kodeProvinsi: 0,
          kabKota: 0,
          kodeRS: 0,
          namaRS: 0,
          tahun: 0,
          no: value.no,
          jenisKegiatan: value.nama,
          jumlah: 0,
          disabledInput: true,
          checked: false,
        };
      });
      setDataRL(rlTemplate);
      // console.log(response.data.data)
    } catch (error) {}
  };
  // console.log(dataRL)
  const changeHandlerSingle = (event) => {
    const name = event.target.name;
    if (name === "tahun") {
      setTahun(parseInt(event.target.value));
    } else if (name === "bulan") {
      setBulan(parseInt(event.target.value));
    }
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
    } else if (name === "jenisKegiatan") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].jenisKegiatan = event.target.value;
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
    let date = tahun + "-" + bulan + "-01";
    e.preventDefault();
    try {
      const dataRLArray = dataRL
        .filter((value) => {
          return value.checked === true;
        })
        .map((value, index) => {
          return {
            rLTigaTitikEmpatBelasJenisKegiatanId: parseInt(value.id),
            jumlah: value.jumlah,
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
        "/apisirs6v2/rltigatitikempatbelas",
        {
          tahun: parseInt(tahun),
          tahunDanBulan: date,
          data: dataRLArray,
        },
        customConfig,
      );
      // console.log(result.data)
      toast("Data Berhasil Disimpan", {
        position: toast.POSITION.TOP_RIGHT,
      });
      setTimeout(() => {
        navigate("/rl314");
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

  const handleFocus = (event) => {
    event.target.select();
  };


  return (
    <div
      className="container"
      style={{ marginTop: "70px", marginBottom: "70px" }}
    >
      <form onSubmit={Simpan}>
        <div className="row">
          <div className="col-md-6">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title h5">Profile Fasyankes</h5>
                <div
                  className="form-floating"
                  style={{ width: "100%", display: "inline-block" }}
                >
                  <input
                    type="text"
                    className="form-control"
                    id="floatingInput"
                    value={namaRS}
                    disabled={true}
                  />
                  <label htmlFor="floatingInput">Nama</label>
                </div>
                <div
                  className="form-floating"
                  style={{ width: "100%", display: "inline-block" }}
                >
                  <input
                    type="text"
                    className="form-control"
                    id="floatingInput"
                    value={alamatRS}
                    disabled={true}
                  />
                  <label htmlFor="floatingInput">Alamat</label>
                </div>
                <div
                  className="form-floating"
                  style={{ width: "50%", display: "inline-block" }}
                >
                  <input
                    type="text"
                    className="form-control"
                    id="floatingInput"
                    value={namaPropinsi}
                    disabled={true}
                  />
                  <label htmlFor="floatingInput">Provinsi </label>
                </div>
                <div
                  className="form-floating"
                  style={{ width: "50%", display: "inline-block" }}
                >
                  <input
                    type="text"
                    className="form-control"
                    id="floatingInput"
                    value={namaKabKota}
                    disabled={true}
                  />
                  <label htmlFor="floatingInput">Kab/Kota</label>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title h5">Periode Laporan</h5>
                <div
                  className="form-floating"
                  style={{
                    width: "50%",
                    display: "inline-block",
                    paddingTop: "10px",
                  }}
                >
                  <select
                    value={String(bulan).padStart(2, "0")}
                    name="bulan"
                    className="form-control"
                    id="bulan"
                    onChange={(e) => changeHandlerSingle(e)}
                  >
                    <option value="01">Januari</option>
                    <option value="02">Februari</option>
                    <option value="03">Maret</option>
                    <option value="04">April</option>
                    <option value="05">Mei</option>
                    <option value="06">Juni</option>
                    <option value="07">Juli</option>
                    <option value="08">Agustus</option>
                    <option value="09">September</option>
                    <option value="10">Oktober</option>
                    <option value="11">November</option>
                    <option value="12">Desember</option>
                  </select>
                  <label htmlFor="bulan">Bulan</label>
                </div>
                <div
                  className="form-floating"
                  style={{ width: "50%", display: "inline-block" }}
                >
                  {/* <input
                    name="tahun"
                    type="number"
                    className="form-control"
                    id="floatingInput"
                    min="2024"
                    placeholder="Tahun"
                    value={tahun}
                    onChange={(e) => changeHandlerSingle(e)}
                    disabled={true}
                  /> */}

                  <select
                    name="tahun"
                    className="form-select"
                    id="tahun"
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

                  <label htmlFor="tahun">Tahun</label>
                </div>
              </div>
            </div>
            <div className="mt-3 mb-3">
              {/* <Link to='/rl314'className="btn btn-outline-success">Lihat Data RL 3.15</Link> */}
            </div>
          </div>
        </div>
        <div className="row mt-3">
          <div className="col-md-12">
            <Link to={`/rl314/`} className="gl-back">
              <span className="gl-back-icon" aria-hidden="true">
                <ArrowLeft size={18} />
              </span>
              <span className="gl-back-text">
                <small>Kembali ke</small>
                <strong>RL 3.14 Pelayanan Khusus</strong>
              </span>
            </Link>
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
                    ></th>
                    <th
                      className={style["sticky-header"]}
                      style={{ width: "35%" }}
                    >
                      Jenis Kegiatan
                    </th>
                    <th>Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  {dataRL.map((value, index) => {
                    if (Number(value.no) === 0) {
                      return (
                        <tr key={value.id}>
                          <td
                            className={style["sticky-column"]}
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            {value.no}
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
                          <td className={style["sticky-column"]} style={{ textAlign: "left" }}>
                            {value.jenisKegiatan}
                          </td>
                          <td>
                            <input
                              type="number"
                              name="jumlah"
                              className="form-control"
                              value={value.jumlah}
                              onChange={(e) => changeHandler(e, index)}
                              disabled={true}
                              min={0}
                              onPaste={preventPasteNegative}
                              onKeyPress={preventMinus}
                              onFocus={handleFocus}
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
                            {value.no}
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
                          <td className={style["sticky-column"]} style={{ textAlign: "left" }}>
                            {value.jenisKegiatan}
                          </td>
                          <td>
                            <input
                              type="number"
                              name="jumlah"
                              className="form-control"
                              value={value.jumlah}
                              onChange={(e) => changeHandler(e, index)}
                              disabled={value.disabledInput}
                              min={0}
                              onPaste={preventPasteNegative}
                              onKeyPress={preventMinus}
                              onFocus={handleFocus}
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

export default FormTambahRL314;
