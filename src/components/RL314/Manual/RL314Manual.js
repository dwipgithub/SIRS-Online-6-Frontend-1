import React, { useState, useEffect } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate } from "react-router-dom";
import tbl from "../../Shared/RLViewTable.module.css";
import { HiSaveAs } from "react-icons/hi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import { Link } from "react-router-dom";
import { Modal } from "react-bootstrap";
import { downloadExcel } from "react-export-table-to-excel";
import { useCSRFTokenContext } from "../../Context/CSRFTokenContext";
import FilterSummary from "../../Shared/FilterSummary";

const RL314Manual = () => {
  const [bulan, setBulan] = useState(1);
  const [tahun, setTahun] = useState("");
  const [daftarBulan, setDaftarBulan] = useState([]);
  const [total, setTotal] = useState("");
  const [dataRL, setDataRL] = useState([]);
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const navigate = useNavigate();
  const { CSRFToken } = useCSRFTokenContext();

  //baru
  const [filterLabel, setFilterLabel] = useState([]);
  const [rumahSakit, setRumahSakit] = useState("");
  const [daftarRumahSakit, setDaftarRumahSakit] = useState([]);
  const [daftarProvinsi, setDaftarProvinsi] = useState([]);
  const [daftarKabKota, setDaftarKabKota] = useState([]);
  const [show, setShow] = useState(false);
  const [user, setUser] = useState({});

  useEffect(() => {
    refreshToken();
    getBulan();
    const getLastYear = async () => {
      const date = new Date();
      setTahun(String(new Date().getFullYear()));
      return date.getFullYear();
    };
    getLastYear().then((results) => {});
    // getRLTigaTitikEmpatBelasTemplate()
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
      showRumahSakit(decoded.satKerId);
      setExpire(decoded.exp);
      setUser(decoded);
      // setExpire(decoded.exp);
      // getDataRS(decoded.rsId);
    } catch (error) {
      if (error.response) {
        navigate("/");
      }
    }
  };

  function handleDownloadExcel() {
    const header = ["No", "No Kegiatan", "Jenis Kegiatan", "Jumlah"];

    const body = dataRL.map((value, index) => {
      const data = [
        index + 1,
        value.jenisKegiatanRLTigaTitikEmpatBelasId,
        value.namaJenisKegiatan,
        value.jumlah,
      ];

      return data;
    });

    downloadExcel({
      fileName: "RL_3_14",
      sheet: "react-export-table-to-excel",
      tablePayload: {
        header,
        body: body,
      },
    });
  }

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
  const getRL = async (e) => {
    let date = tahun + "-" + bulan + "-01";
    e.preventDefault();
    if (rumahSakit == null) {
      toast(`rumah sakit harus dipilih`, {
        position: toast.POSITION.TOP_RIGHT,
      });
      return;
    }
    const filter = [];
    filter.push("nama: ".concat(rumahSakit.nama));
    filter.push("tahun: ".concat(String(tahun).concat("-").concat(bulan)));
    setFilterLabel(filter);
    try {
      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        params: {
          rsId: rumahSakit.id,
          tahun: date,
        },
      };
      const results = await axiosJWT.get(
        "/apisirs6v2/rltigatitikempatbelas",
        customConfig,
      );

      const rlTigaTitikEmpatBelasDetails = results.data.data.map((value) => {
        return {
          id: value.id,
          jenisKegiatanRLTigaTitikEmpatBelasId:
            value.rl_tiga_titik_empat_belas_jenis_kegiatan.id,
          no: value.rl_tiga_titik_empat_belas_jenis_kegiatan.no,
          namaJenisKegiatan:
            value.rl_tiga_titik_empat_belas_jenis_kegiatan.nama,
          jumlah: value.jumlah,
        };
      });
      const total16 = rlTigaTitikEmpatBelasDetails
        .filter(
          (rlTigaTitikEmpatBelasDetails) =>
            rlTigaTitikEmpatBelasDetails.jenisKegiatanRLTigaTitikEmpatBelasId >
              15 &&
            rlTigaTitikEmpatBelasDetails.jenisKegiatanRLTigaTitikEmpatBelasId <
              21,
        )
        .reduce(
          (acc, rlTigaTitikEmpatBelasDetails) =>
            acc + rlTigaTitikEmpatBelasDetails.jumlah,
          0,
        );

      setTotal(
        rlTigaTitikEmpatBelasDetails.reduce(
          (acc, rlTigaTitikEmpatBelasDetails) =>
            acc + rlTigaTitikEmpatBelasDetails.jumlah,
          0,
        ),
      );

      const below15Above16 = [];
      const restOfData = [];

      if (total16 > 0) {
        const newObj = {
          id: null,
          jenisKegiatanRLTigaTitikEmpatBelasId: null,
          no: "16",
          namaJenisKegiatan: "Kunjungan Rumah (Homecare)",
          jumlah: total16,
        };

        rlTigaTitikEmpatBelasDetails.forEach((item) => {
          if (
            parseInt(item.jenisKegiatanRLTigaTitikEmpatBelasId) < 15 ||
            parseInt(item.jenisKegiatanRLTigaTitikEmpatBelasId > 16)
          ) {
            below15Above16.push(item);
          } else {
            restOfData.push(item);
          }
        });

        below15Above16.push(newObj);

        const newData = [...below15Above16, ...restOfData];
        setDataRL(newData);
        setRumahSakit(null);
        handleClose();
      } else {
        setDataRL(rlTigaTitikEmpatBelasDetails);
        setRumahSakit(null);
        handleClose();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleClose = () => setShow(false);

  const handleShow = () => {
    const jenisUserId = user.jenisUserId;
    const satKerId = user.satKerId;
    switch (jenisUserId) {
      case 1:
        getProvinsi();
        setShow(true);
        break;
      case 2:
        getKabKota(satKerId);
        setShow(true);
        break;
      case 3:
        getRumahSakit(satKerId);
        setShow(true);
        break;
      case 4:
        showRumahSakit(satKerId);
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
  const hapusData = async (id) => {
    const customConfig = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "XSRF-TOKEN": CSRFToken,
      },
    };
    try {
      await axiosJWT.delete(
        `/apisirs6v2/rltigatitikempatbelas/${id}`,
        customConfig,
      );
      setDataRL((current) => current.filter((value) => value.id !== id));
      // window.location.reload(false);
      toast("Data Berhasil Dihapus", {
        position: toast.POSITION.TOP_RIGHT,
      });
    } catch (error) {
      console.log(error);
      toast("Data Gagal Disimpan", {
        position: toast.POSITION.TOP_RIGHT,
      });
    }
  };

  const hapus = (id) => {
    confirmAlert({
      title: "Konfirmasi Penghapusan",
      message: "Apakah Anda Yakin ?",
      buttons: [
        {
          label: "Ya",
          onClick: () => {
            hapusData(id);
          },
        },
        {
          label: "Tidak",
        },
      ],
    });
  };

  return (
    <div>
      <Modal show={show} onHide={handleClose} style={{ position: "fixed" }}>
        <Modal.Header closeButton>
          <Modal.Title>Filter</Modal.Title>
        </Modal.Header>
        <form onSubmit={getRL}>
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
            {user.jenisUserId === 4 ? (
              <Link
                className="btn"
                to={`/rl314/tambah/`}
                style={{
                  marginRight: "5px",
                  fontSize: "18px",
                  backgroundColor: "#779D9E",
                  color: "#FFFFFF",
                }}
              >
                +
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
              onClick={handleShow}
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
        </div>
        <div>
          <FilterSummary items={filterLabel} />
        </div>
      </div>
      <div className="row">
        <div className="col-md-12">
          <div className={tbl["table-container"]}>
            <table className={tbl.table}>
              <thead>
                <tr>
                  <th style={{ width: "8%" }}>Nomor Kegiatan</th>
                  <th style={{ width: "13%" }}>Aksi</th>
                  <th style={{ width: "59%" }}>Jenis Kegiatan</th>
                  <th>Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {dataRL.map((value, index) => {
                  return value.no === "16" ? (
                    <tr
                      className={tbl["subgroup-row"]}
                      key={value.jenisKegiatanRLTigaTitikEmpatBelasId}
                    >
                      <td>{value.no}</td>
                      <td colSpan={2} className={tbl["text-left"]}>
                        {value.namaJenisKegiatan} <br /> (Hasil Penjumlahan dari
                        Nomor Kegiatan 16.1, 16.2, 16.3, 16.4, 16.5)
                      </td>
                      <td>{value.jumlah}</td>
                    </tr>
                  ) : (
                    <tr key={value.jenisKegiatanRLTigaTitikEmpatBelasId}>
                      <td>{value.no}</td>

                      <td>
                        <ToastContainer />
                        <div className={tbl["aksi"]}>
                          <button
                            className="btn btn-danger"
                            style={{
                              backgroundColor: "#FF6663",
                              border: "1px solid #FF6663",
                            }}
                            type="button"
                            onClick={(e) => hapus(value.id)}
                          >
                            Hapus
                          </button>
                          {Number(value.no) !== 0 ? (
                            <Link
                              to={`/rl314/ubah/${value.id}`}
                              className="btn btn-warning"
                              style={{
                                backgroundColor: "#CFD35E",
                                border: "1px solid #CFD35E",
                                color: "#FFFFFF",
                              }}
                            >
                              Ubah
                            </Link>
                          ) : (
                            <></>
                          )}
                        </div>
                      </td>
                      <td className={tbl["text-left"]}>
                        {value.namaJenisKegiatan}
                      </td>
                      <td>{value.jumlah}</td>
                    </tr>
                  );
                })}
                {dataRL.length > 0 ? (
                  <tr className={tbl["total-row"]}>
                    <td></td>
                    <td></td>
                    <td>TOTAL</td>
                    <td>{total}</td>
                  </tr>
                ) : (
                  <></>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RL314Manual;
