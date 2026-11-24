import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { HiSaveAs } from "react-icons/hi";
import "react-toastify/dist/ReactToastify.css";
import "react-confirm-alert/src/react-confirm-alert.css";
import style from "./AbsensiTable.module.css";
// import Table from 'react-bootstrap/Table'
import { DownloadTableExcel } from "react-export-table-to-excel";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";
import drape from "../Shared/PageDrape.module.css";

const Absensi = () => {
  const [namaRs, setNamaRs] = useState("");
  const [daftarProvinsi, setDaftarProvinsi] = useState([]);
  const [daftarKabKota, setDaftarKabKota] = useState([]);
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const [provinsiId, setProvinsiId] = useState(null);
  const [kabKotaId, setKabKotaId] = useState(null);
  const [dataAbsensi, setDataAbsensi] = useState([]);
  const [namafile, setNamaFile] = useState("");
  const tableRef = useRef(null);
  const [apa, setApa] = useState(true);
  const navigate = useNavigate();
  const [tahun, setTahun] = useState(
    String(Math.max(new Date().getFullYear(), 2025)),
  );
  const { CSRFToken } = useCSRFTokenContext();

  useEffect(() => {
    refreshToken();
    getProvinsi();

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

  const getProvinsi = async () => {
    try {
      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };
      const results = await axiosJWT.get("/apisirs6v2/provinsi", customConfig);

      const daftarProvinsi = results.data.data.map((value) => {
        return value;
      });

      setDaftarProvinsi(daftarProvinsi);
    } catch (error) {
      console.log(error);
    }
  };

  const getKabKota = async (provinsiId) => {
    try {
      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        params: {
          provinsiId: provinsiId,
        },
      };
      const results = await axiosJWT.get("/apisirs6v2/kabkota", customConfig);

      const daftarKabKota = results.data.data.map((value) => {
        return value;
      });

      setDaftarKabKota(daftarKabKota);
    } catch (error) {
      console.log(error);
    }
  };

  const provinsiChangeHandler = (e) => {
    const provinsiId = e.target.value;
    setProvinsiId(provinsiId);
    getKabKota(provinsiId);
  };

  const kabKotaChangeHandler = (e) => {
    const kabKotaId = e.target.value;
    setKabKotaId(kabKotaId);
  };

  const changeHandlerNamaRs = (event) => {
    setNamaRs(event.target.value);
  };

  const changeHandlerTahun = (event) => {
    setTahun(event.target.value);
  };

  const Cari = async (e) => {
    e.preventDefault();
    const parameterAbsensi = {};

    if (provinsiId != null) {
      parameterAbsensi.provinsiId = provinsiId;
    }

    if (kabKotaId !== null && kabKotaId !== "0") {
      parameterAbsensi.kabKotaId = kabKotaId;
    }

    if (namaRs !== "") {
      parameterAbsensi.namaRs = namaRs;
    }

    if (tahun !== "") {
      parameterAbsensi.tahun = tahun;
    }

    try {
      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        params: parameterAbsensi,
      };
      const results = await axiosJWT.get("/apisirs6v2/absensi", customConfig);
      const dataAbsensiDetail = results.data.data.map((value) => {
        return value;
      });
      setDataAbsensi(dataAbsensiDetail);
      setNamaFile(
        "Absensi_".concat(
          String(provinsiId)
            .concat("-")
            .concat(kabKotaId)
            .concat("-")
            .concat(namaRs)
            .concat("-")
            .concat(tahun),
        ),
      );
      setApa(false);
    } catch (error) {
      console.log(error);
    }
  };

  const currentYear = new Date().getFullYear();
  const startYear = 2025;
  const years = [];
  for (let i = startYear; i <= Math.max(currentYear, startYear); i++) {
    years.push(i);
  }

  return (
    <div
      className={`container ${drape.drape}`}
      style={{ marginTop: "70px", marginBottom: "70px" }}
    >
      <h4>
        <span style={{ color: "gray" }}>Absensi Pengisian RL</span>
      </h4>
      <h5 style={{ fontSize: "14px" }}>
        Rekapitulasi kelengkapan pengisian laporan RL setiap rumah sakit per
        tahun. Pilih filter lalu tekan Cari.
      </h5>

      <form onSubmit={Cari}>
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                {/* Filter dua lajur: Provinsi | Kab/Kota, Tahun | Nama RS */}
                <div className="row g-2">
                  <div className="col-md-6">
                    <div className="form-floating">
                      <select
                        name="provinsi"
                        id="provinsi"
                        typeof="select"
                        className="form-select"
                        onChange={(e) => provinsiChangeHandler(e)}
                      >
                        <option key={0} value={0}>
                          Pilih
                        </option>
                        {daftarProvinsi.map((nilai) => {
                          return (
                            <option key={nilai.id} value={nilai.id}>
                              {nilai.nama}
                            </option>
                          );
                        })}
                      </select>
                      <label htmlFor="provinsi">Provinsi</label>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="form-floating">
                      <select
                        name="kabKota"
                        id="kabKota"
                        typeof="select"
                        className="form-select"
                        onChange={(e) => kabKotaChangeHandler(e)}
                      >
                        <option key={0} value={0}>
                          Pilih
                        </option>
                        {daftarKabKota.map((nilai) => {
                          return (
                            <option key={nilai.id} value={nilai.id}>
                              {nilai.nama}
                            </option>
                          );
                        })}
                      </select>
                      <label htmlFor="kabKota">Kab/Kota</label>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="form-floating">
                      <select
                        name="tahun"
                        id="tahun"
                        className="form-select"
                        value={tahun}
                        onChange={(e) => changeHandlerTahun(e)}
                      >
                        {years.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                      <label htmlFor="tahun">Tahun</label>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="form-floating">
                      <input
                        type="text"
                        name="namaRs"
                        id="namaRs"
                        className="form-control"
                        placeholder="Nama RS"
                        value={namaRs}
                        onChange={(e) => changeHandlerNamaRs(e)}
                        disabled={false}
                      />
                      <label htmlFor="namaRs">Nama RS</label>
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <button type="submit" className="btn btn-outline-success">
                    <HiSaveAs /> Cari
                  </button>
                  <DownloadTableExcel
                    filename={namafile}
                    sheet="Absensi"
                    currentTableRef={tableRef.current}
                  >
                    {/* <button> Export excel </button> */}
                    <button
                      className="btn"
                      style={{
                        fontSize: "18px",
                        marginLeft: "5px",
                        backgroundColor: "#779D9E",
                        color: "#FFFFFF",
                      }}
                      hidden={apa}
                    >
                      {" "}
                      Download
                    </button>
                  </DownloadTableExcel>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
      <div className="row mt-3">
        <div className="col-md-12">
          <div className={style["table-container"]}>
            {/* data-kolom-cokelat="5": kolom identitas No. s.d. Pengisian %
                (yang diam saat tabel digeser) berwarna cokelat */}
            <table
              className={style.table}
              ref={tableRef}
              data-kolom-cokelat="5"
            >
              <colgroup>
                <col className={style["w-no"]} />
                <col className={style["w-kode"]} />
                <col className={style["w-nama"]} />
                <col className={style["w-kab"]} />
                <col className={style["w-isi"]} />
                {/* g = RL bulanan (12 kolom), t = RL tahunan (1 kolom) */}
                {"gggggggggg tgtg ttttt gggggg"
                  .replace(/ /g, "")
                  .split("")
                  .flatMap((jenis, i) =>
                    jenis === "g"
                      ? Array.from({ length: 12 }).map((_, b) => (
                          <col key={`${i}-${b}`} className={style["w-bulan"]} />
                        ))
                      : [<col key={`${i}-t`} className={style["w-tahun"]} />],
                  )}
              </colgroup>
              <thead>
                <tr>
                  <th rowSpan="2" className={style["col-no"]}>
                    No.
                  </th>
                  <th rowSpan="2" className={style["col-kode"]}>
                    Kode RS
                  </th>
                  <th rowSpan="2" className={style["col-nama"]}>
                    Nama RS
                  </th>
                  {/* <th rowSpan="2" style={{ "width": "1%" }}>RL 3.2</th> */}
                  <th rowSpan="2" className={style["col-kab"]}>
                    Kab.Kota
                  </th>
                  <th rowSpan="2" className={style["col-isi"]}>
                    Pengisian %
                  </th>
                  <th colSpan="12">RL 3.1</th>
                  <th colSpan="12">RL 3.2</th>
                  <th colSpan="12">RL 3.3</th>
                  <th colSpan="12">RL 3.4</th>
                  <th colSpan="12">RL 3.5</th>
                  <th colSpan="12">RL 3.6</th>
                  <th colSpan="12">RL 3.7</th>
                  <th colSpan="12">RL 3.8</th>
                  <th colSpan="12">RL 3.9</th>
                  <th colSpan="12">RL 3.10</th>

                  <th rowSpan="2">RL 3.11</th>
                  <th colSpan="12">RL 3.12</th>
                  <th rowSpan="2">RL 3.13</th>
                  <th colSpan="12">RL 3.14</th>
                  <th rowSpan="2">RL 3.15</th>
                  <th rowSpan="2">RL 3.16</th>
                  <th rowSpan="2">RL 3.17</th>
                  <th rowSpan="2">RL 3.18</th>
                  <th rowSpan="2">RL 3.19</th>

                  <th colSpan="12">RL 4.1</th>
                  <th colSpan="12">RL 4.2</th>
                  <th colSpan="12">RL 4.3</th>
                  <th colSpan="12">RL 5.1</th>
                  <th colSpan="12">RL 5.2</th>
                  <th colSpan="12">RL 5.3</th>
                </tr>
                <tr className={style["subheader-row"]}>
                  <th>1</th>
                  <th>2</th>
                  <th>3</th>
                  <th>4</th>
                  <th>5</th>
                  <th>6</th>
                  <th>7</th>
                  <th>8</th>
                  <th>9</th>
                  <th>10</th>
                  <th>11</th>
                  <th>12</th>

                  <th>1</th>
                  <th>2</th>
                  <th>3</th>
                  <th>4</th>
                  <th>5</th>
                  <th>6</th>
                  <th>7</th>
                  <th>8</th>
                  <th>9</th>
                  <th>10</th>
                  <th>11</th>
                  <th>12</th>

                  <th>1</th>
                  <th>2</th>
                  <th>3</th>
                  <th>4</th>
                  <th>5</th>
                  <th>6</th>
                  <th>7</th>
                  <th>8</th>
                  <th>9</th>
                  <th>10</th>
                  <th>11</th>
                  <th>12</th>

                  <th>1</th>
                  <th>2</th>
                  <th>3</th>
                  <th>4</th>
                  <th>5</th>
                  <th>6</th>
                  <th>7</th>
                  <th>8</th>
                  <th>9</th>
                  <th>10</th>
                  <th>11</th>
                  <th>12</th>

                  <th>1</th>
                  <th>2</th>
                  <th>3</th>
                  <th>4</th>
                  <th>5</th>
                  <th>6</th>
                  <th>7</th>
                  <th>8</th>
                  <th>9</th>
                  <th>10</th>
                  <th>11</th>
                  <th>12</th>

                  <th>1</th>
                  <th>2</th>
                  <th>3</th>
                  <th>4</th>
                  <th>5</th>
                  <th>6</th>
                  <th>7</th>
                  <th>8</th>
                  <th>9</th>
                  <th>10</th>
                  <th>11</th>
                  <th>12</th>

                  <th>1</th>
                  <th>2</th>
                  <th>3</th>
                  <th>4</th>
                  <th>5</th>
                  <th>6</th>
                  <th>7</th>
                  <th>8</th>
                  <th>9</th>
                  <th>10</th>
                  <th>11</th>
                  <th>12</th>

                  <th>1</th>
                  <th>2</th>
                  <th>3</th>
                  <th>4</th>
                  <th>5</th>
                  <th>6</th>
                  <th>7</th>
                  <th>8</th>
                  <th>9</th>
                  <th>10</th>
                  <th>11</th>
                  <th>12</th>

                  <th>1</th>
                  <th>2</th>
                  <th>3</th>
                  <th>4</th>
                  <th>5</th>
                  <th>6</th>
                  <th>7</th>
                  <th>8</th>
                  <th>9</th>
                  <th>10</th>
                  <th>11</th>
                  <th>12</th>

                  <th>1</th>
                  <th>2</th>
                  <th>3</th>
                  <th>4</th>
                  <th>5</th>
                  <th>6</th>
                  <th>7</th>
                  <th>8</th>
                  <th>9</th>
                  <th>10</th>
                  <th>11</th>
                  <th>12</th>

                  <th>1</th>
                  <th>2</th>
                  <th>3</th>
                  <th>4</th>
                  <th>5</th>
                  <th>6</th>
                  <th>7</th>
                  <th>8</th>
                  <th>9</th>
                  <th>10</th>
                  <th>11</th>
                  <th>12</th>

                  {/* rl 4 dan 5  */}
                  <th>1</th>
                  <th>2</th>
                  <th>3</th>
                  <th>4</th>
                  <th>5</th>
                  <th>6</th>
                  <th>7</th>
                  <th>8</th>
                  <th>9</th>
                  <th>10</th>
                  <th>11</th>
                  <th>12</th>

                  <th>1</th>
                  <th>2</th>
                  <th>3</th>
                  <th>4</th>
                  <th>5</th>
                  <th>6</th>
                  <th>7</th>
                  <th>8</th>
                  <th>9</th>
                  <th>10</th>
                  <th>11</th>
                  <th>12</th>

                  <th>1</th>
                  <th>2</th>
                  <th>3</th>
                  <th>4</th>
                  <th>5</th>
                  <th>6</th>
                  <th>7</th>
                  <th>8</th>
                  <th>9</th>
                  <th>10</th>
                  <th>11</th>
                  <th>12</th>

                  <th>1</th>
                  <th>2</th>
                  <th>3</th>
                  <th>4</th>
                  <th>5</th>
                  <th>6</th>
                  <th>7</th>
                  <th>8</th>
                  <th>9</th>
                  <th>10</th>
                  <th>11</th>
                  <th>12</th>

                  <th>1</th>
                  <th>2</th>
                  <th>3</th>
                  <th>4</th>
                  <th>5</th>
                  <th>6</th>
                  <th>7</th>
                  <th>8</th>
                  <th>9</th>
                  <th>10</th>
                  <th>11</th>
                  <th>12</th>

                  <th>1</th>
                  <th>2</th>
                  <th>3</th>
                  <th>4</th>
                  <th>5</th>
                  <th>6</th>
                  <th>7</th>
                  <th>8</th>
                  <th>9</th>
                  <th>10</th>
                  <th>11</th>
                  <th>12</th>

                  <th>1</th>
                  <th>2</th>
                  <th>3</th>
                  <th>4</th>
                  <th>5</th>
                  <th>6</th>
                  <th>7</th>
                  <th>8</th>
                  <th>9</th>
                  <th>10</th>
                  <th>11</th>
                  <th>12</th>
                </tr>
              </thead>
              <tbody>
                {dataAbsensi.map((value, index) => {
                  return (
                    <tr key={index}>
                      <td className={style["col-no"]}>{index + 1}</td>
                      <td className={style["col-kode"]}>{value.rs_id}</td>
                      <td className={style["col-nama"]}>{value.nama_rs}</td>
                      <td className={style["col-kab"]}>{value.kab_kota}</td>
                      <td className={style["col-isi"]}>
                        {value.persentase_pengisian}
                      </td>
                      {/* 3.1 */}
                      <td>
                        {value.rl_31_bulan_1 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                            {/* <label class="btn btn-outline-success" for="success-outlined">V</label> */}
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_31_bulan_2 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                            {/* <label class="btn btn-outline-danger" for="danger-outlined">X</label> */}
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_31_bulan_3 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_31_bulan_4 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_31_bulan_5 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_31_bulan_6 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_31_bulan_7 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_31_bulan_8 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_31_bulan_9 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_31_bulan_10 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_31_bulan_11 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_31_bulan_12 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>

                      {/* 3.2 */}
                      <td>
                        {value.rl_32_bulan_1 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_32_bulan_2 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_32_bulan_3 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_32_bulan_4 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_32_bulan_5 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_32_bulan_6 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_32_bulan_7 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_32_bulan_8 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_32_bulan_9 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_32_bulan_10 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_32_bulan_11 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_32_bulan_12 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>

                      {/* 3.3 */}

                      <td>
                        {value.rl_33_bulan_1 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_33_bulan_2 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_33_bulan_3 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_33_bulan_4 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_33_bulan_5 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_33_bulan_6 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_33_bulan_7 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_33_bulan_8 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_33_bulan_9 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_33_bulan_10 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_33_bulan_11 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_33_bulan_12 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>

                      {/* 3.4 */}

                      <td>
                        {value.rl_34_bulan_1 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_34_bulan_2 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_34_bulan_3 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_34_bulan_4 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_34_bulan_5 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_34_bulan_6 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_34_bulan_7 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_34_bulan_8 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_34_bulan_9 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_34_bulan_10 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_34_bulan_11 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_34_bulan_12 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>

                      {/* 3.5 */}

                      <td>
                        {value.rl_35_bulan_1 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_35_bulan_2 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_35_bulan_3 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_35_bulan_4 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_35_bulan_5 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_35_bulan_6 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_35_bulan_7 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_35_bulan_8 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_35_bulan_9 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_35_bulan_10 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_35_bulan_11 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_35_bulan_12 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>

                      {/* 3.6 */}
                      <td>
                        {value.rl_36_bulan_1 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_36_bulan_2 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_36_bulan_3 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_36_bulan_4 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_36_bulan_5 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_36_bulan_6 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_36_bulan_7 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_36_bulan_8 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_36_bulan_9 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_36_bulan_10 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_36_bulan_11 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_36_bulan_12 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>

                      {/* 3.7 */}
                      <td>
                        {value.rl_37_bulan_1 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_37_bulan_2 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_37_bulan_3 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_37_bulan_4 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_37_bulan_5 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_37_bulan_6 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_37_bulan_7 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_37_bulan_8 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_37_bulan_9 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_37_bulan_10 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_37_bulan_11 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_37_bulan_12 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>

                      {/* 3.8 */}

                      <td>
                        {value.rl_38_bulan_1 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_38_bulan_2 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_38_bulan_3 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_38_bulan_4 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_38_bulan_5 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_38_bulan_6 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_38_bulan_7 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_38_bulan_8 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_38_bulan_9 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_38_bulan_10 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_38_bulan_11 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_38_bulan_12 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>

                      {/* 3.9 */}
                      <td>
                        {value.rl_39_bulan_1 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_39_bulan_2 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_39_bulan_3 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_39_bulan_4 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_39_bulan_5 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_39_bulan_6 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_39_bulan_7 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_39_bulan_8 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_39_bulan_9 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_39_bulan_10 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_39_bulan_11 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_39_bulan_12 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>

                      {/* 3.10 */}
                      <td>
                        {value.rl_310_bulan_1 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_310_bulan_2 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_310_bulan_3 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_310_bulan_4 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_310_bulan_5 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_310_bulan_6 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_310_bulan_7 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_310_bulan_8 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_310_bulan_9 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_310_bulan_10 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_310_bulan_11 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_310_bulan_12 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>

                      {/* 3.11 */}
                      <td>
                        {value.rl_311 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>

                      {/* 3.12 */}
                      <td>
                        {value.rl_312_bulan_1 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_312_bulan_2 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_312_bulan_3 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_312_bulan_4 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_312_bulan_5 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_312_bulan_6 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_312_bulan_7 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_312_bulan_8 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_312_bulan_9 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_312_bulan_10 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_312_bulan_11 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_312_bulan_12 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>

                      {/* 3.13 */}
                      <td>
                        {value.rl_313 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>

                      {/* 3.14 */}
                      <td>
                        {value.rl_314_bulan_1 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_314_bulan_2 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_314_bulan_3 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_314_bulan_4 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_314_bulan_5 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_314_bulan_6 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_314_bulan_7 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_314_bulan_8 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_314_bulan_9 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_314_bulan_10 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_314_bulan_11 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_314_bulan_12 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>

                      {/* 3.15 */}
                      <td>
                        {value.rl_315 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>

                      {/* 3.16 */}
                      <td>
                        {value.rl_316 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>

                      {/* 3.17 */}
                      <td>
                        {value.rl_317 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>

                      {/* 3.18 */}
                      <td>
                        {value.rl_318 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>

                      {/* 3.19 */}
                      <td>
                        {value.rl_319 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>

                      {/* 4.1 */}
                      <td>
                        {value.rl_41_bulan_1 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_41_bulan_2 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_41_bulan_3 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_41_bulan_4 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_41_bulan_5 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_41_bulan_6 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_41_bulan_7 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_41_bulan_8 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_41_bulan_9 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_41_bulan_10 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_41_bulan_11 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_41_bulan_12 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>

                      {/* 4.2 */}
                      <td>
                        {value.rl_42_bulan_1 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_42_bulan_2 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_42_bulan_3 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_42_bulan_4 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_42_bulan_5 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_42_bulan_6 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_42_bulan_7 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_42_bulan_8 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_42_bulan_9 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_42_bulan_10 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_42_bulan_11 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_42_bulan_12 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>

                      {/* 4.3 */}
                      <td>
                        {value.rl_43_bulan_1 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_43_bulan_2 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_43_bulan_3 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_43_bulan_4 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_43_bulan_5 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_43_bulan_6 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_43_bulan_7 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_43_bulan_8 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_43_bulan_9 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_43_bulan_10 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_43_bulan_11 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_43_bulan_12 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>

                      {/* 5.1 */}
                      <td>
                        {value.rl_51_bulan_1 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_51_bulan_2 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_51_bulan_3 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_51_bulan_4 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_51_bulan_5 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_51_bulan_6 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_51_bulan_7 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_51_bulan_8 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_51_bulan_9 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_51_bulan_10 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_51_bulan_11 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_51_bulan_12 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>

                      {/* 5.2 */}
                      <td>
                        {value.rl_52_bulan_1 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_52_bulan_2 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_52_bulan_3 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_52_bulan_4 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_52_bulan_5 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_52_bulan_6 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_52_bulan_7 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_52_bulan_8 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_52_bulan_9 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_52_bulan_10 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_52_bulan_11 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_52_bulan_12 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>

                      {/* 5.3 */}
                      <td>
                        {value.rl_53_bulan_1 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_53_bulan_2 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_53_bulan_3 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_53_bulan_4 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_53_bulan_5 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_53_bulan_6 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_53_bulan_7 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_53_bulan_8 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_53_bulan_9 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_53_bulan_10 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_53_bulan_11 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                      <td>
                        {value.rl_53_bulan_12 === 0 ? (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#FF0000" }}
                            >
                              X
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p
                              class="text fw-bold"
                              style={{ color: "#32CD32" }}
                            >
                              V
                            </p>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Absensi;
