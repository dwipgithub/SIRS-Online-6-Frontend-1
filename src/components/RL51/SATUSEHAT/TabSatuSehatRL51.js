// Tab SATUSEHAT RL51: endpoint & kolom khusus RL51. Dipanggil dari ../RL51.js
import React, { useState, useEffect, useRef } from "react";
import { useCSRFTokenContext } from "../../Context/CSRFTokenContext";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate } from "react-router-dom";

import tv from "./TabSatuSehatRL51.module.css";
import { HiSaveAs } from "react-icons/hi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "react-confirm-alert/src/react-confirm-alert.css";
import Modal from "react-bootstrap/Modal";
import Spinner from "react-bootstrap/Spinner";
import { getDataSatusehat } from "../../../api/rlLimasatuSatusehat.js";
import { FaSync } from "react-icons/fa";
import FilterSummary from "../../Shared/FilterSummary";

export default function TabSatuSehatRL51() {
  const [bulan, setBulan] = useState("01");
  const [tahun, setTahun] = useState(String(new Date().getFullYear()));
  const [daftarBulan, setDaftarBulan] = useState([]);
  const [filterLabel, setFilterLabel] = useState([]);
  const [rumahSakit, setRumahSakit] = useState("");
  const [daftarRumahSakit, setDaftarRumahSakit] = useState([]);
  const [daftarProvinsi, setDaftarProvinsi] = useState([]);
  const [daftarKabKota, setDaftarKabKota] = useState([]);
  const [dataRL, setDataRL] = useState([]);
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const [show, setShow] = useState(false);
  const [user, setUser] = useState({});
  const navigate = useNavigate();
  const tableRef = useRef(null);
  const { CSRFToken } = useCSRFTokenContext();
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(20); // default limit, bisa kamu sesuaikan
  const [totalPages, setTotalPages] = useState(1);
  const [masterUmur, setMasterUmur] = React.useState([]);
  const [sudahFilter, setSudahFilter] = useState(false);

  useEffect(() => {
    refreshToken();
    getBulan();
    getMasterUmur();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {}, [bulan, tahun, rumahSakit]);

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
      showRumahSakit(decoded.satKerId);
      setExpire(decoded.exp);
      setUser(decoded);
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

  const getBulan = async () => {
    const results = [];
    results.push({
      key: "Januari",
      value: "01",
    });
    results.push({
      key: "Febuari",
      value: "02",
    });
    results.push({
      key: "Maret",
      value: "03",
    });
    results.push({
      key: "April",
      value: "04",
    });
    results.push({
      key: "Mei",
      value: "05",
    });
    results.push({
      key: "Juni",
      value: "06",
    });
    results.push({
      key: "Juli",
      value: "07",
    });
    results.push({
      key: "Agustus",
      value: "08",
    });
    results.push({
      key: "September",
      value: "09",
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

  const bulanChangeHandler = (e) => {
    setBulan(e.target.value);
  };

  const tahunChangeHandler = (event) => {
    setTahun(event.target.value);
  };

  const provinsiChangeHandler = (e) => {
    const provinsiId = e.target.value;
    getKabKota(provinsiId);
  };

  const kabKotaChangeHandler = (e) => {
    const kabKotaId = e.target.value;
    getRumahSakit(kabKotaId);
  };

  const rumahSakitChangeHandler = (e) => {
    const rsId = e.target.value;
    showRumahSakit(rsId);
  };

  const getRumahSakit = async (kabKotaId) => {
    try {
      const response = await axiosJWT.get("/apisirs6v2/rumahsakit/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          kabKotaId: kabKotaId,
        },
      });
      setDaftarRumahSakit(response.data.data);
    } catch (error) {}
  };

  const showRumahSakit = async (id) => {
    try {
      const response = await axiosJWT.get("/apisirs6v2/rumahsakit/" + id, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setRumahSakit(response.data.data);
    } catch (error) {}
  };

  const getPageData = async (requestedPage = 1, requestedLimit = limit) => {
    setDataRL([]); // 🔥 reset dulu

    const config2 = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        rsId: rumahSakit.id,
        periode: `${tahun}-${bulan}`,
        page: requestedPage,
        limit: requestedLimit,
      },
    };

    const responseShow = await axiosJWT.get(
      "/apisirs6v2/rllimatitiksatusatusehatpage",
      config2,
    );

    const rawData = responseShow.data.data;
    const { pages } = responseShow.data.pagination || {};

    // Transformasi data supaya group per ICD 10
    const mapICD = new Map();

    rawData.forEach((item) => {
      const icd = item.icd_10;
      if (!mapICD.has(icd)) {
        mapICD.set(icd, {
          icd_10: icd,
          diagnosis: item.diagnosis,
          total_kunjungan: {
            male: 0,
            female: 0,
            total: 0,
          },
          umur: [],
        });
      }

      const current = mapICD.get(icd);

      current.total_kunjungan.male += item.male_visits;
      current.total_kunjungan.female += item.female_visits;
      current.total_kunjungan.total += item.total_visits;

      current.umur.push({
        age_group: item.age_groups_satusehat?.name || "-",
        kunjungan_baru: {
          male: item.male_new_cases,
          female: item.females_new_cases,
          total: item.total_new_cases,
        },
      });
    });

    const groupedData = Array.from(mapICD.values());
    const finalData = transformDataWithMasterUmur(groupedData, masterUmur);
    setDataRL(finalData);
    setPage(requestedPage);
    setTotalPages(pages || 1);
  };

  const getDataRL = async (e, requestedPage = 1, requestedLimit = limit) => {
    if (e) e.preventDefault();

    if (!rumahSakit) {
      toast(`Rumah sakit harus dipilih`, {
        position: toast.POSITION.TOP_RIGHT,
      });
      return;
    }

    const filter = [];
    filter.push("nama: ".concat(rumahSakit.nama));
    filter.push("periode: ".concat(String(tahun).concat("-").concat(bulan)));
    setFilterLabel(filter);
    handleClose();

    setLoading(true);
    try {
      //   if (!initialDataLoaded) {
      //     // await getInitialData(); // hanya dipanggil sekali
      //   }
      await getPageData(requestedPage, requestedLimit); // dipanggil setiap kali request page
    } catch (error) {
      const detailMessage =
        error.response?.data?.detail || error.message || "Terjadi kesalahan";
      toast.error(detailMessage);
    } finally {
      setLoading(false);
      setSudahFilter(true);
    }
  };

  const tarikDataSatusehat = async () => {
    try {
      setLoading(true);
      const response = await getDataSatusehat(
        axiosJWT,
        token,
        rumahSakit.id,
        tahun,
        bulan,
      );

      if (response.status) {
        toast.success(response.message);
        getDataRL();
      } else {
        toast.error("Status SatuSehat : " + response.message);
      }
    } catch (err) {
      toast.error("Gagal menarik data Satusehat.");
    } finally {
      setLoading(false);
    }
  };

  const fetchData = (newPage) => {
    // getRL(null, newPage, limit);
    getDataRL(null, newPage, limit);
  };

  const getMasterUmur = async () => {
    try {
      const config2 = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const res = await axiosJWT.get(
        "/apisirs6v2/getMasterumursatusehat",
        config2,
      );

      setMasterUmur(res.data.data); // asumsi master umur di res.data.data
    } catch (error) {
      console.error("Gagal load master umur", error);
    }
  };

  const transformDataWithMasterUmur = (groupedData, masterUmur) => {
    return groupedData.map((item) => {
      // buat objek umur lengkap dengan default 0
      const umurMap = {};
      masterUmur.forEach((umur) => {
        umurMap[umur.name] = 0; // default 0 kunjungan total
      });

      // isi data umur dari item.umur
      item.umur.forEach((u) => {
        const ageName = u.age_group || "-";
        umurMap[ageName] = u.kunjungan_baru.total ?? 0;
      });

      return {
        ...item,
        umurMap, // ini yang akan dipakai di render
      };
    });
  };

  const handleClose = () => setShow(false);

  const handleShow = () => {
    const jenisUserId = user.jenisUserId;
    const satKerId = user.satKerId;
    switch (jenisUserId) {
      case 1:
        getProvinsi();
        setBulan(1);
        setShow(true);
        break;
      case 2:
        getKabKota(satKerId);
        setBulan(1);
        setShow(true);
        break;
      case 3:
        getRumahSakit(satKerId);
        setBulan(1);
        setShow(true);
        break;
      case 4:
        showRumahSakit(satKerId);
        setBulan(1);
        setShow(true);
        break;
      default:
    }
  };

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

  const LoadingTable = ({ data, loading }) => {
    return (
      <>
        <div>
          {loading && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundColor: "rgba(255,255,255,0.7)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 9999,
                flexDirection: "column",
              }}
            >
              <Spinner animation="border" variant="primary" />
              <div
                style={{
                  marginTop: 10,
                  fontWeight: "bold",
                  color: "#007bff",
                }}
              >
                Mohon Tunggu...
              </div>
            </div>
          )}

          <div className={tv["table-container"]}>
            <table
              className={tv.table}
              style={{
                filter: loading ? "blur(2px)" : "none",
                width: `${400 + (masterUmur.length * 3 + 3) * 95}px`,
              }}
              ref={tableRef}
            >
              <colgroup>
                <col className={tv["w-no"]} />
                <col className={tv["w-kode"]} />
                <col className={tv["w-diag"]} />
                {Array.from({ length: masterUmur.length * 3 + 3 }).map(
                  (_, i) => (
                    <col key={i} className={tv["w-angka"]} />
                  ),
                )}
              </colgroup>
              <thead>
                <tr>
                  <th rowSpan={3} className={tv["col-no"]}>
                    No.
                  </th>
                  <th rowSpan={3} className={tv["col-icd"]}>
                    ICD 10
                  </th>
                  <th rowSpan={3} className={tv["col-diagnosis"]}>
                    Diagnosis
                  </th>
                  <th
                    colSpan={masterUmur.length * 3}
                    className={tv["group-head"]}
                  >
                    <span
                      className={`${tv["group-label"]} ${tv["group-label-ss"]}`}
                    >
                      Kunjungan Kasus Baru per Umur
                    </span>
                  </th>

                  <th colSpan={3} rowSpan={2} className={tv["wrap"]}>
                    Total Kunjungan
                  </th>
                </tr>
                <tr className={tv["subheader-row"]}>
                  {masterUmur.map((umur) => (
                    <th key={umur.name} colSpan={3}>
                      {umur.name}
                    </th>
                  ))}
                </tr>
                <tr className={tv["subsubheader-row"]}>
                  {masterUmur.map((umur) => (
                    <React.Fragment key={`${umur.name}-sub`}>
                      <th>L</th>
                      <th>P</th>
                      <th>Total</th>
                    </React.Fragment>
                  ))}
                  <th>Laki-laki</th>
                  <th>Perempuan</th>
                  <th>Total</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6 + masterUmur.length * 3}>Loading...</td>
                  </tr>
                )}

                {!loading &&
                  dataRL.map((item, idx) => (
                    <tr key={item.icd_10}>
                      <td className={tv["col-no"]}>
                        {idx + 1 + (page - 1) * limit}
                      </td>
                      <td className={tv["col-icd"]}>{item.icd_10}</td>
                      <td className={tv["col-diagnosis"]}>{item.diagnosis}</td>
                      {masterUmur.map((umur) => {
                        const umurData = item.umur.find(
                          (u) => u.age_group === umur.name,
                        );
                        return (
                          <React.Fragment key={`${item.icd_10}-${umur.name}`}>
                            <td>{umurData?.kunjungan_baru?.male ?? "0"}</td>
                            <td>{umurData?.kunjungan_baru?.female ?? "0"}</td>
                            <td>{umurData?.kunjungan_baru?.total ?? "0"}</td>
                          </React.Fragment>
                        );
                      })}
                      <td>{item.total_kunjungan?.male ?? "-"}</td>
                      <td>{item.total_kunjungan?.female ?? "-"}</td>
                      <td>{item.total_kunjungan?.total ?? "-"}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className={tv["pagination"]}>
            <button
              onClick={() => fetchData(page - 1)}
              disabled={page <= 1 || loading}
              className="btn btn-sm"
              style={{ backgroundColor: "#779D9E", color: "#FFFFFF" }}
            >
              Prev
            </button>

            <span>
              Page {page} of {totalPages}
            </span>

            <button
              onClick={() => fetchData(page + 1)}
              disabled={page >= totalPages || loading}
              className="btn btn-sm"
              style={{ backgroundColor: "#779D9E", color: "#FFFFFF" }}
            >
              Next
            </button>
          </div>
        </div>
      </>
    );
  };

  return (
    <div>
      <ToastContainer />
      <Modal show={show} onHide={handleClose} style={{ position: "fixed" }}>
        <Modal.Header closeButton>
          <Modal.Title>Filter</Modal.Title>
        </Modal.Header>

        <form onSubmit={getDataRL}>
          <Modal.Body>
            {user.jenisUserId === 1 ? (
              <>
                <div
                  className="form-floating"
                  style={{ width: "100%", paddingBottom: "5px" }}
                >
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

                <div
                  className="form-floating"
                  style={{ width: "100%", paddingBottom: "5px" }}
                >
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

                <div
                  className="form-floating"
                  style={{ width: "100%", paddingBottom: "5px" }}
                >
                  <select
                    name="rumahSakit"
                    id="rumahSakit"
                    typeof="select"
                    className="form-select"
                    onChange={(e) => rumahSakitChangeHandler(e)}
                  >
                    <option key={0} value={0}>
                      Pilih
                    </option>
                    {daftarRumahSakit.map((nilai) => {
                      return (
                        <option key={nilai.id} value={nilai.id}>
                          {nilai.nama}
                        </option>
                      );
                    })}
                  </select>
                  <label htmlFor="rumahSakit">Rumah Sakit</label>
                </div>
              </>
            ) : (
              <></>
            )}
            {user.jenisUserId === 2 ? (
              <>
                <div
                  className="form-floating"
                  style={{ width: "100%", paddingBottom: "5px" }}
                >
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

                <div
                  className="form-floating"
                  style={{ width: "100%", paddingBottom: "5px" }}
                >
                  <select
                    name="rumahSakit"
                    id="rumahSakit"
                    typeof="select"
                    className="form-select"
                    onChange={(e) => rumahSakitChangeHandler(e)}
                  >
                    <option key={0} value={0}>
                      Pilih
                    </option>
                    {daftarRumahSakit.map((nilai) => {
                      return (
                        <option key={nilai.id} value={nilai.id}>
                          {nilai.nama}
                        </option>
                      );
                    })}
                  </select>
                  <label htmlFor="rumahSakit">Rumah Sakit</label>
                </div>
              </>
            ) : (
              <></>
            )}
            {user.jenisUserId === 3 ? (
              <>
                <div
                  className="form-floating"
                  style={{ width: "100%", paddingBottom: "5px" }}
                >
                  <select
                    name="rumahSakit"
                    id="rumahSakit"
                    typeof="select"
                    className="form-select"
                    onChange={(e) => rumahSakitChangeHandler(e)}
                  >
                    <option key={0} value={0}>
                      Pilih
                    </option>
                    {daftarRumahSakit.map((nilai) => {
                      return (
                        <option key={nilai.id} value={nilai.id}>
                          {nilai.nama}
                        </option>
                      );
                    })}
                  </select>
                  <label htmlFor="rumahSakit">Rumah Sakit</label>
                </div>
              </>
            ) : (
              <></>
            )}
            <div
              className="form-floating"
              style={{ width: "70%", display: "inline-block" }}
            >
              <select
                typeof="select"
                className="form-control"
                onChange={bulanChangeHandler}
                required
              >
                <option value="">Pilih Bulan</option>
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
                onChange={(e) => tahunChangeHandler(e)}
                disabled={false}
              />
              <label htmlFor="tahun">Tahun</label>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <div className="mt-3 mb-3">
              <ToastContainer />
              <button type="submit" className="btn btn-outline-success">
                <HiSaveAs size={20} /> Terapkan
              </button>
            </div>
          </Modal.Footer>
        </form>
      </Modal>

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
              onClick={handleShow}
            >
              Filter
            </button>

            {sudahFilter && (
              <button
                className="btn"
                style={{
                  fontSize: "18px",
                  backgroundColor: "#779D9E",
                  color: "#FFFFFF",
                  marginLeft: "10px",
                }}
                onClick={tarikDataSatusehat}
                disabled={loading}
              >
                <FaSync />
                {loading ? "Memproses..." : "Tarik Data"}
              </button>
            )}

            {/* <DownloadTableExcel
              filename={namafile}
              sheet="data RL 51"
              currentTableRef={tableRef.current}
            > */}
            {/* <button
                className="btn"
                style={{
                  fontSize: "18px",
                  marginLeft: "5px",
                  backgroundColor: "#779D9E",
                  color: "#FFFFFF",
                }}
              >
                {" "}
                Download
              </button> */}
            {/* </DownloadTableExcel> */}
          </div>

          <div>
            <FilterSummary items={filterLabel} />
          </div>

          <LoadingTable
            data={dataRL}
            loading={loading}
            page={page}
            totalPages={totalPages}
            fetchData={fetchData}
          />
        </div>
      </div>
    </div>
  );
}
