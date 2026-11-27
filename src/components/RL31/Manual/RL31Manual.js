import React, { useState, useEffect } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate } from "react-router-dom";
import style from "./RL31Manual.module.css"; // sesuaikan kalau path berbeda
import { HiSaveAs } from "react-icons/hi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Modal from "react-bootstrap/Modal";
import Table from "react-bootstrap/Table";
import { downloadExcel } from "react-export-table-to-excel";
import { useCSRFTokenContext } from "../../Context/CSRFTokenContext";
import FilterSummary from "../../Shared/FilterSummary";

const RL31Manual = () => {
  const [bulan, setBulan] = useState("1");
  const [tahun, setTahun] = useState("");
  const [bulanAll, setBulanAll] = useState(false);
  const [filterLabel, setFilterLabel] = useState([]);

  const [daftarBulan, setDaftarBulan] = useState([]);
  const [provinsiValue, setProvinsiValue] = useState("0");
  const [kabKotaValue, setKabKotaValue] = useState("0");
  const [rumahSakitValue, setRumahSakitValue] = useState("0");

  const [rumahSakit, setRumahSakit] = useState(null); // null / "all" / object RS
  const [daftarRumahSakit, setDaftarRumahSakit] = useState([]);
  const [daftarProvinsi] = useState([]);
  const [daftarKabKota, setDaftarKabKota] = useState([]);
  const [dataRL, setDataRL] = useState([]);
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState(0);
  const [user, setUser] = useState({});
  const [show, setShow] = useState(false);

  const { CSRFToken } = useCSRFTokenContext();
  const navigate = useNavigate();

  useEffect(() => {
    refreshToken();
    initBulanTahun();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initBulanTahun = () => {
    const bulanList = [
      { key: "Januari", value: "1" },
      { key: "Februari", value: "2" },
      { key: "Maret", value: "3" },
      { key: "April", value: "4" },
      { key: "Mei", value: "5" },
      { key: "Juni", value: "6" },
      { key: "Juli", value: "7" },
      { key: "Agustus", value: "8" },
      { key: "September", value: "9" },
      { key: "Oktober", value: "10" },
      { key: "November", value: "11" },
      { key: "Desember", value: "12" },
    ];
    setDaftarBulan(bulanList);
    const now = new Date();
    setTahun(now.getFullYear().toString());
  };

  const refreshToken = async () => {
    try {
      const config = { headers: { "XSRF-TOKEN": CSRFToken } };
      const resp = await axios.get("/apisirs6v2/token", config);
      setToken(resp.data.accessToken);
      const decoded = jwt_decode(resp.data.accessToken);
      setUser(decoded);
      setExpire(decoded.exp);

      if (decoded.jenisUserId === 2) {
        getKabKota(decoded.satKerId);
      }
      if (decoded.jenisUserId === 3) {
        getRumahSakit(decoded.satKerId);
      }
      if (decoded.jenisUserId === 4) {
        showRumahSakit(decoded.satKerId);
      }
    } catch (err) {
      console.error(err);
      navigate("/");
    }
  };

  const axiosJWT = axios.create();
  axiosJWT.interceptors.request.use(
    async (config) => {
      const now = new Date();
      if (expire * 1000 < now.getTime()) {
        const config2 = { headers: { "XSRF-TOKEN": CSRFToken } };
        const resp2 = await axios.get("/apisirs6v2/token", config2);
        config.headers.Authorization = `Bearer ${resp2.data.accessToken}`;
        setToken(resp2.data.accessToken);
        const decoded2 = jwt_decode(resp2.data.accessToken);
        setExpire(decoded2.exp);
        setUser(decoded2);
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  const getKabKota = async (provinsiId) => {
    try {
      const resp = await axiosJWT.get("/apisirs6v2/kabkota", {
        headers: { Authorization: `Bearer ${token}` },
        params: { provinsiId },
      });
      setDaftarKabKota(resp.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const getRumahSakit = async (kabKotaId) => {
    try {
      const resp = await axiosJWT.get("/apisirs6v2/rumahsakit", {
        headers: { Authorization: `Bearer ${token}` },
        params: { kabKotaId },
      });
      setDaftarRumahSakit(resp.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const showRumahSakit = async (rsId) => {
    try {
      const resp = await axiosJWT.get(`/apisirs6v2/rumahsakit/${rsId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRumahSakit(resp.data.data || null);
    } catch (err) {
      console.error(err);
      setRumahSakit(null);
    }
  };

  const provinsiChangeHandler = (e) => {
    const val = e.target.value;
    setProvinsiValue(val);
    setKabKotaValue("0");
    setRumahSakitValue("0");
    setRumahSakit(null);
    setBulanAll(false);
    if (val && val !== "0") {
      getKabKota(val);
    } else {
      setDaftarKabKota([]);
      setDaftarRumahSakit([]);
    }
  };

  const kabKotaChangeHandler = (e) => {
    const val = e.target.value;
    setKabKotaValue(val);
    setRumahSakitValue("0");
    setRumahSakit(null);
    setBulanAll(false);
    if (val === "all") {
      setRumahSakit("all");
      setRumahSakitValue("all");
    } else if (val && val !== "0") {
      getRumahSakit(val);
    } else {
      setDaftarRumahSakit([]);
    }
  };

  const rumahSakitChangeHandler = (e) => {
    const rsId = e.target.value;
    setRumahSakitValue(rsId);
    if (rsId === "all") {
      setRumahSakit("all");
      setBulanAll(true);
    } else if (rsId && rsId !== "0") {
      showRumahSakit(rsId);
    } else {
      setRumahSakit(null);
    }
  };

  const getRL = async (e) => {
    e.preventDefault();

    if (!rumahSakit) {
      toast("Rumah sakit harus dipilih", {
        position: toast.POSITION.TOP_RIGHT,
      });
      return;
    }

    const filter = [];
    const params = {}; // kita pakai objek kosong

    if (rumahSakit === "all") {
      filter.push("nama: All Rumah Sakit");
      params.provId = user.satKerId;

      if (bulanAll || bulan === "all") {
        // bulan “all” dipilih → tidak kirim periode
        filter.push("All Bulan");
        // tidak set params.periode
      } else {
        filter.push(`periode: ${tahun}-${bulan}`);
        params.periode = `${tahun}-${bulan}`;
      }
    } else {
      filter.push(`nama: ${rumahSakit.nama}`);
      params.rsId = rumahSakit.id;

      if (bulanAll || bulan === "all") {
        filter.push("All Bulan");
        // tidak set params.periode
      } else {
        filter.push(`periode: ${tahun}-${bulan}`);
        params.periode = `${tahun}-${bulan}`;
      }
    }

    setFilterLabel(filter);

    try {
      const resp = await axiosJWT.get("/apisirs6v2/rltigatitiksatu", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        params: params,
      });
      setDataRL(resp.data.data || []);
      setShow(false);
    } catch (err) {
      console.error(err);
      toast("Gagal mengambil data", {
        position: toast.POSITION.TOP_RIGHT,
      });
    }
  };

  const handleDownloadExcel = () => {
    const extraCols =
      user.jenisUserId === 2 ? ["rs_id", "RUMAH_SAKIT", "nama"] : [];
    const header = [
      "Jenis Pelayanan",
      "BOR",
      "ALOS",
      "BTO",
      "TOI",
      "NDR",
      "GDR",
    ];
    const headerFinal = ["No", ...extraCols, ...header];

    const body = dataRL.map((item, index) => {
      const base = [];

      // selalu tambahkan index + 1 dulu
      base.push(index + 1);

      if (user.jenisUserId === 2) {
        // bila user jenis = 2, langsung sisipkan kolom tambahan setelah index+1
        base.push(item.rs_id || "");
        base.push(item.RUMAH_SAKIT || "");
        base.push(item.nama || "");
      }

      // sisanya kolom umum
      base.push(item.nama_kelompok_jenis_pelayanan);
      base.push(parseFloat(item.BOR || 0).toFixed(2));
      base.push(parseFloat(item.ALOS || 0).toFixed(2));
      base.push(parseFloat(item.BTO || 0).toFixed(2));
      base.push(parseFloat(item.TOI || 0).toFixed(2));
      base.push(parseFloat(item.NDR || 0).toFixed(2));
      base.push(parseFloat(item.GDR || 0).toFixed(2));

      return base;
    });

    downloadExcel({
      fileName: user.jenisUserId === 2 ? "RL_3_1_AllRS" : "RL_3_1",
      sheet: "RL31",
      tablePayload: { header: headerFinal, body },
    });
  };

  return (
    <div>

      <Modal
        show={show}
        onHide={() => setShow(false)}
        style={{ position: "fixed" }}
      >
        <Modal.Header closeButton>
          <Modal.Title>Filter</Modal.Title>
        </Modal.Header>
        <form onSubmit={getRL}>
          <Modal.Body>
            {(user.jenisUserId === 1 || user.jenisUserId === 2) && (
              <>
                {user.jenisUserId === 1 && (
                  <div
                    className="form-floating"
                    style={{ width: "100%", paddingBottom: "5px" }}
                  >
                    <select
                      name="provinsi"
                      id="provinsi"
                      className="form-select"
                      onChange={provinsiChangeHandler}
                      value={provinsiValue}
                    >
                      <option key="0" value="0">
                        Pilih Provinsi
                      </option>
                      {daftarProvinsi.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nama}
                        </option>
                      ))}
                    </select>
                    <label htmlFor="provinsi">Provinsi</label>
                  </div>
                )}
                <div
                  className="form-floating"
                  style={{ width: "100%", paddingBottom: "5px" }}
                >
                  <select
                    name="kabKota"
                    id="kabKota"
                    className="form-select"
                    onChange={kabKotaChangeHandler}
                    value={kabKotaValue}
                  >
                    <option key="0" value="0">
                      Pilih Kab/Kota
                    </option>
                    {user.jenisUserId === 2 && (
                      <option key="all" value="all">
                        All Kab/Kota
                      </option>
                    )}
                    {daftarKabKota.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.nama}
                      </option>
                    ))}
                  </select>
                  <label htmlFor="kabKota">Kab/Kota</label>
                </div>
              </>
            )}

            {(user.jenisUserId === 1 ||
              user.jenisUserId === 2 ||
              user.jenisUserId === 3) && (
              <div
                className="form-floating"
                style={{ width: "100%", paddingBottom: "5px" }}
              >
                <select
                  name="rumahSakit"
                  id="rumahSakit"
                  className="form-select"
                  onChange={rumahSakitChangeHandler}
                  value={rumahSakitValue}
                >
                  <option key="0" value="0">
                    Pilih Rumah Sakit
                  </option>
                  {user.jenisUserId === 2 && (
                    <option key="all" value="all">
                      All Rumah Sakit
                    </option>
                  )}
                  {daftarRumahSakit.map((rs) => (
                    <option key={rs.id} value={rs.id}>
                      {rs.nama}
                    </option>
                  ))}
                </select>
                <label htmlFor="rumahSakit">Rumah Sakit</label>
              </div>
            )}

            <div
              className="form-floating"
              style={{
                width: "70%",
                display: "inline-block",
                paddingRight: "5px",
              }}
            >
              <select
                className="form-control"
                onChange={(e) => {
                  setBulan(e.target.value);
                  setBulanAll(false);
                }}
                value={bulanAll ? "all" : bulan}
              >
                {rumahSakit === "all" && (
                  <option key="all" value="all">
                    All
                  </option>
                )}
                {daftarBulan.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.key}
                  </option>
                ))}
              </select>
              <label htmlFor="bulan">Bulan</label>
            </div>
            <div
              className="form-floating"
              style={{ width: "30%", display: "inline-block" }}
            >
              <input
                name="tahun"
                type="number"
                className="form-control"
                placeholder="Tahun"
                value={tahun}
                onChange={(e) => setTahun(e.target.value)}
              />
              <label htmlFor="tahun">Tahun</label>
            </div>
          </Modal.Body>

          <Modal.Footer>
            <ToastContainer />
            <button type="submit" className="btn btn-outline-success">
              <HiSaveAs size={20} /> Terapkan
            </button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Tabel & bagian Download dll tetap seperti sebelumnya */}
      <div className="row">
        <div className="col-md-12">
          <div style={{ marginBottom: "10px" }}>
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

          {filterLabel.length > 0 && (
            <div>
              <FilterSummary items={filterLabel} />
            </div>
          )}

          <Table
            className={style.rlTable}
            striped
            responsive
            style={{ width: "100%" }}
          >
            <thead>
              <tr>
                <th>No.</th>

                {user.jenisUserId === 2 && (
                  <>
                    <th>rs_id</th>
                    <th>RUMAH_SAKIT</th>
                    <th>nama</th>
                  </>
                )}

                <th>Jenis Pelayanan</th>
                <th>BOR</th>
                <th>ALOS</th>
                <th>BTO</th>
                <th>TOI</th>
                <th>NDR</th>
                <th>GDR</th>
              </tr>
            </thead>

            <tbody>
              {dataRL.map((item, idx) => (
                <tr key={item.id || `${item.rs_id || "rs"}-${idx}`}>
                  <td>{idx + 1}</td>

                  {user.jenisUserId === 2 && (
                    <>
                      <td>{item.rs_id || ""}</td>
                      <td>{item.RUMAH_SAKIT || ""}</td>
                      <td>{item.nama || ""}</td>
                    </>
                  )}

                  <td>{item.nama_kelompok_jenis_pelayanan || ""}</td>

                  <td style={{ textAlign: "right" }}>
                    {Number(item.BOR || 0).toFixed(2)}
                  </td>

                  <td style={{ textAlign: "right" }}>
                    {Number(item.ALOS || 0).toFixed(2)}
                  </td>

                  <td style={{ textAlign: "right" }}>
                    {Number(item.BTO || 0).toFixed(2)}
                  </td>

                  <td style={{ textAlign: "right" }}>
                    {Number(item.TOI || 0).toFixed(2)}
                  </td>

                  <td style={{ textAlign: "right" }}>
                    {Number(item.NDR || 0).toFixed(2)}
                  </td>

                  <td style={{ textAlign: "right" }}>
                    {Number(item.GDR || 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default RL31Manual;
