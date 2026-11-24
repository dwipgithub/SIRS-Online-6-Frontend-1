// Tab SATUSEHAT RL34: endpoint & kolom khusus RL34. Dipanggil dari ../RL34.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { Link } from "react-router-dom";
import style from "./TabSatuSehatRL34.module.css";
import "react-toastify/dist/ReactToastify.css";
import "react-confirm-alert/src/react-confirm-alert.css";
import Modal from "react-bootstrap/Modal";
import { downloadExcel } from "react-export-table-to-excel";
import { useCSRFTokenContext } from "../../Context/CSRFTokenContext";
import FilterSummary from "../../Shared/FilterSummary";

export default function TabSatuSehatRL34() {
  const [bulan, setBulan] = useState(1);
  const [tahun, setTahun] = useState("");
  const [filterLabel, setFilterLabel] = useState([]);
  const [daftarBulan, setDaftarBulan] = useState([]);
  const [rumahSakit] = useState("");
  const [dataRL, setDataRL] = useState([]);
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const [show, setShow] = useState(false);
  const [user] = useState({});
  const { CSRFToken } = useCSRFTokenContext();
  // Fetch RL 3.4 Satusehat Local sesuai filter
  const getSatusehatRL34 = async (e) => {
    if (e) e.preventDefault();
    // Set filter label for display
    const filter = [];
    filter.push("periode: ".concat(String(tahun).concat("-").concat(bulan)));
    setFilterLabel(filter);
    try {
      // Ganti ke API Satusehat utama
      const params = {};
      if (rumahSakit && rumahSakit.id) params.rsId = rumahSakit.id;
      if (tahun && bulan)
        params.periode = `${tahun}-${bulan.toString().padStart(2, "0")}`;
      const customConfig = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params,
      };
      const response = await axiosJWT.get(
        "/apisirs6v2/rltigatitikempatsatusehat",
        customConfig,
      );
      const apiData = response.data.data;
      // Jika apiData array, pakai langsung. Jika object, cek jika punya property data, ambil dan bungkus array.
      let arr = [];
      if (Array.isArray(apiData)) {
        arr = apiData;
      } else if (apiData && typeof apiData === "object") {
        // Jika ada property data di dalamnya, ambil property data
        if (apiData.data && typeof apiData.data === "object") {
          arr = [apiData.data];
        } else {
          arr = [apiData];
        }
      }
      setDataRL(arr);
    } catch (error) {
      setDataRL([]);
      console.log(error);
    }
    handleClose();
  };

  useEffect(() => {
    getBulan();
    const getLastYear = async () => {
      const date = new Date();
      setTahun(date.getFullYear());
      return date.getFullYear();
    };
    getLastYear();
  }, []);

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

  const getBulan = async () => {
    const results = [];
    results.push({
      key: "Januari",
      value: "1",
    });
    results.push({
      key: "Febuari",
      value: "2",
    });
    results.push({
      key: "Maret",
      value: "3",
    });
    results.push({
      key: "April",
      value: "4",
    });
    results.push({
      key: "Mei",
      value: "5",
    });
    results.push({
      key: "Juni",
      value: "6",
    });
    results.push({
      key: "Juli",
      value: "7",
    });
    results.push({
      key: "Agustus",
      value: "8",
    });
    results.push({
      key: "September",
      value: "9",
    });
    results.push({
      key: "Oktober",
      value: "10",
    });
    results.push({
      key: "November",
      value: "11",
    });
    results.push({
      key: "Desember",
      value: "12",
    });

    setDaftarBulan([...results]);
  };

  const bulanChangeHandler = async (e) => {
    setBulan(e.target.value);
  };

  const tahunChangeHandler = (event) => {
    setTahun(event.target.value);
  };

  const handleClose = () => setShow(false);

  function handleDownloadExcel() {
    const header = [
      "No.",
      "Bulan",
      "Pengunjung Baru",
      "Pengunjung Lama",
      "Total",
    ];
    const body = (Array.isArray(dataRL) ? dataRL : []).map((item, idx) => [
      idx + 1,
      item.month,
      item.new_visitors,
      item.returning_visitors,
      item.total_visitors,
    ]);
    downloadExcel({
      fileName: "RL_3_4_SatuSehat",
      sheet: "react-export-table-to-excel",
      tablePayload: {
        header,
        body,
      },
    });
  }

  return (
    <div>
      <Modal show={show} onHide={handleClose} style={{ position: "fixed" }}>
        <Modal.Header closeButton>
          <Modal.Title>Filter</Modal.Title>
        </Modal.Header>
        <form onSubmit={getSatusehatRL34}>
          <Modal.Body>
            <div
              className="form-floating"
              style={{ width: "70%", display: "inline-block" }}
            >
              <select
                typeof="select"
                className="form-control"
                value={bulan}
                onChange={bulanChangeHandler}
              >
                {daftarBulan.map((bulan) => {
                  return (
                    <option
                      key={bulan.value}
                      name={bulan.key}
                      value={bulan.value}
                    >
                      {bulan.key}
                    </option>
                  );
                })}
              </select>
              <label>Bulan</label>
            </div>
            <div
              className="form-floating"
              style={{ width: "30%", display: "inline-block" }}
            >
              <input
                name="tahun"
                type="number"
                className="form-control"
                id="tahun"
                placeholder="Tahun"
                value={tahun}
                onChange={tahunChangeHandler}
                disabled={false}
              />
              <label htmlFor="tahun">Tahun</label>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <button className="btn btn-primary" type="submit">
              Tampilkan
            </button>
          </Modal.Footer>
        </form>
      </Modal>
      <div className="row">
        <div className="col-md-12">
          <div style={{ marginBottom: "10px" }}>
            {user.jenisUserId === 4 ? (
              <Link
                className="btn"
                to={`/satusehatrl34/`}
                style={{
                  marginRight: "5px",
                  fontSize: "18px",
                  backgroundColor: "#779D9E",
                  color: "#FFFFFF",
                }}
              >
                Update SatuSehat
              </Link>
            ) : (
              <></>
            )}

            <button
              className="btn"
              style={{
                fontSize: "18px",
                backgroundColor: "#779D9E",
                color: "#FFFFFF",
              }}
              onClick={() => setShow(true)}
            >
              Filter
            </button>
            <button
              className="btn"
              style={{
                fontSize: "18px",
                marginLeft: "5px",
                backgroundColor: "#779D9E",
                color: "#FFFFFF",
              }}
              onClick={handleDownloadExcel}
            >
              Download
            </button>
          </div>
          <div>
            <FilterSummary items={filterLabel} />
          </div>
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
                    style={{ width: "15%" }}
                  >
                    Bulan
                  </th>
                  <th className={style["sticky-header"]}>Pengunjung Baru</th>
                  <th className={style["sticky-header"]}>Pengunjung Lama</th>
                  <th className={style["sticky-header"]}>Total</th>
                </tr>
              </thead>
              <tbody>
                {(Array.isArray(dataRL) ? dataRL : []).map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <input
                        type="text"
                        name="id"
                        className="form-control"
                        value={idx + 1}
                        disabled={true}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        name="bulan"
                        className="form-control"
                        value={item.month ?? ""}
                        disabled={true}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        name="pengunjungBaru"
                        className="form-control"
                        value={item.new_visitors ?? ""}
                        disabled={true}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        name="pengunjungLama"
                        className="form-control"
                        value={item.returning_visitors ?? ""}
                        disabled={true}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        name="total"
                        className="form-control"
                        value={item.total_visitors ?? ""}
                        disabled={true}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
