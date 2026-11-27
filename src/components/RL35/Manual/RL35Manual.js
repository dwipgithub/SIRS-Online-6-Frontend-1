import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate, Link } from "react-router-dom";
import style from "./RL35Manual.module.css";
import { HiSaveAs } from "react-icons/hi";
import { confirmAlert } from "react-confirm-alert";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "react-confirm-alert/src/react-confirm-alert.css";
import Modal from "react-bootstrap/Modal";
import { DownloadTableExcel } from "react-export-table-to-excel";
import { useCSRFTokenContext } from "../../Context/CSRFTokenContext";
import FilterSummary from "../../Shared/FilterSummary";

const RL35Manual = () => {
  const [bulan, setBulan] = useState(1);
  const [tahun, setTahun] = useState(String(new Date().getFullYear()));
  const [filterLabel, setFilterLabel] = useState([]);
  const [daftarBulan, setDaftarBulan] = useState([]);
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
  const [dataCount, setDataCount] = useState([]);
  const [total_kunjungan, setTotalKunjungan] = useState(0);
  const [rata_kunjungan, setRataKunjungan] = useState(0);
  const tableRef = useRef(null);
  const [namafile, setNamaFile] = useState("");
  const { CSRFToken } = useCSRFTokenContext();

  useEffect(() => {
    refreshToken();
    getBulan();
    // const getLastYear = async () => {
    //     const date = new Date()
    //     setTahun(date.getFullYear())
    //     return date.getFullYear()
    // }
    // getLastYear().then((results) => {

    // })

    totalPengunjung();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataRL]);

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
    filter.push("periode: ".concat(String(tahun).concat("-").concat(bulan)));
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
        "/apisirs6v2/rltigatitiklima",
        customConfig,
      );

      const data = Array.isArray(results.data.data) ? results.data.data : [];
      setDataRL(data);
      if (data.length > 0) {
        setNamaFile(
          "rl35_" +
            data[0].rs_id +
            "_".concat(String(tahun).concat("-").concat(bulan).concat("-01")),
        );
      } else {
        toast("Data tidak ditemukan untuk periode yang dipilih", {
          position: toast.POSITION.TOP_RIGHT,
        });
      }
    } catch (error) {
      console.log(error);
      setDataRL([]);
      toast("Gagal memuat data, silakan coba lagi", {
        position: toast.POSITION.TOP_RIGHT,
      });
    } finally {
      // Modal filter selalu ditutup, baik data ada, kosong, maupun gagal
      handleClose();
    }
  };

  const totalPengunjung = () => {
    // console.log(dataRL)

    let total1 = 0;
    let total2 = 0;
    let total3 = 0;
    let total4 = 0;
    let total5 = 0;

    // Baris khusus (bukan kegiatan) yang tidak ikut dijumlah:
    // no 66 = pembagi rata-rata (diisi user), no 77 = rata-rata, no 99 = total.
    // jenis_kegiatan_id 35/99/66 dipertahankan dari logika sebelumnya.
    const noKegiatan = (value) =>
      Number(value.jenis_kegiatan_rl_tiga_titik_lima?.no);
    const barisKhusus = (value) =>
      [66, 77, 99].includes(noKegiatan(value)) ||
      [35, 99, 66].includes(Number(value.jenis_kegiatan_id));

    dataRL.forEach((value) => {
      if (!barisKhusus(value)) {
        total1 += Number(value.kunjungan_pasien_dalam_kabkota_laki) || 0;
        total2 += Number(value.kunjungan_pasien_luar_kabkota_laki) || 0;
        total3 += Number(value.kunjungan_pasien_dalam_kabkota_perempuan) || 0;
        total4 += Number(value.kunjungan_pasien_luar_kabkota_perempuan) || 0;
        total5 += Number(value.total_kunjungan) || 0;
      }
    });

    // Rata-rata = total / nilai baris pembagi (no 66), sama seperti di form
    // tambah. Dihitung sekali setelah semua total terkumpul; bila pembagi
    // kosong/0 hasilnya 0 (bukan Infinity/NaN).
    const pembagi =
      dataRL.find((value) => noKegiatan(value) === 66) ||
      dataRL.find((value) => Number(value.jenis_kegiatan_id) === 35) ||
      {};
    const rata = (total, field) => {
      const bagi = Number(pembagi[field]);
      return bagi > 0 ? Math.ceil(total / bagi) : 0;
    };
    const rata1 = rata(total1, "kunjungan_pasien_dalam_kabkota_laki");
    const rata2 = rata(total2, "kunjungan_pasien_luar_kabkota_laki");
    const rata3 = rata(total3, "kunjungan_pasien_dalam_kabkota_perempuan");
    const rata4 = rata(total4, "kunjungan_pasien_luar_kabkota_perempuan");
    const rata5 = rata(total5, "total_kunjungan");

    let newData = [
      {
        id: 99,
        jenis_kegiatan_id: 99,
        jenis_kegiatan_nama: "Total",
        kunjungan_pasien_dalam_kabkota_laki: total1,
        kunjungan_pasien_luar_kabkota_laki: total2,
        kunjungan_pasien_dalam_kabkota_perempuan: total3,
        kunjungan_pasien_luar_kabkota_perempuan: total4,
        total_kunjungan: total5,
      },
      {
        id: 77,
        jenis_kegiatan_id: 77,
        jenis_kegiatan_nama: "Rata-rata kunjungan per hari",
        kunjungan_pasien_dalam_kabkota_laki: rata1,
        kunjungan_pasien_luar_kabkota_laki: rata2,
        kunjungan_pasien_dalam_kabkota_perempuan: rata3,
        kunjungan_pasien_luar_kabkota_perempuan: rata4,
        total_kunjungan: rata5,
      },
    ];
    setTotalKunjungan(total5);
    setRataKunjungan(rata5);
    setDataCount(newData);
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
      await axiosJWT.delete(`/apisirs6v2/rltigatitiklima/${id}`, customConfig);
      setDataRL((current) => current.filter((value) => value.id !== id));
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
      message: "Apakah Anda Yakin? ",
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
                to={`/rl35/tambah/`}
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
            <DownloadTableExcel
              filename={namafile}
              sheet="data RL 35"
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
              >
                {" "}
                Download
              </button>
            </DownloadTableExcel>
          </div>
          <div>
            <FilterSummary items={filterLabel} />
          </div>
          <div className={style["table-container"]}>
            <table responsive className={style.table} ref={tableRef}>
              <thead>
                <tr className={style.thead}>
                  <th
                    rowSpan={2}
                    style={{ width: "4%", verticalAlign: "middle" }}
                  >
                    No.
                  </th>
                  <th
                    rowSpan={2}
                    style={{ width: "15%", verticalAlign: "middle" }}
                  >
                    Aksi
                  </th>
                  <th
                    rowSpan={2}
                    style={{ width: "35%", verticalAlign: "middle" }}
                  >
                    Jenis Kegiatan
                  </th>
                  <th colSpan={2} style={{ textAlign: "center" }}>
                    Kunjungan Pasien Dalam Kota
                  </th>
                  <th colSpan={2} style={{ textAlign: "center" }}>
                    Kunjungan Pasien Luar Kota
                  </th>
                  <th rowSpan={2} style={{ verticalAlign: "middle" }}>
                    Total Kunjungan{" "}
                  </th>
                </tr>
                <tr className={style["subheader-row"]}>
                  <th style={{ verticalAlign: "middle" }}>Laki-Laki</th>
                  <th style={{ verticalAlign: "middle" }}>Perempuan</th>
                  <th style={{ verticalAlign: "middle" }}>Laki-Laki</th>
                  <th style={{ verticalAlign: "middle" }}>Perempuan</th>
                </tr>
              </thead>
              <tbody>
                {dataRL.map((value, index) => {
                  return (
                    <tr key={value.id}>
                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        {index + 1}
                      </td>
                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        <ToastContainer />
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            width: "100%",
                          }}
                        >
                          {/* <RiDeleteBin5Fill  size={20} onClick={(e) => hapus(value.id)} style={{color: "gray", cursor: "pointer", marginRight: "5px"}} /> */}
                          <button
                            className="btn btn-danger"
                            style={{
                              margin: "0 5px 0 0",
                              backgroundColor: "#FF6663",
                              border: "1px solid #FF6663",
                              flex: "1",
                            }}
                            type="button"
                            onClick={(e) => hapus(value.id)}
                          >
                            Hapus
                          </button>
                          <Link
                            to={`/rl35/ubah/${value.id}`}
                            className="btn btn-warning"
                            style={{
                              margin: "0 5px 0 0",
                              backgroundColor: "#CFD35E",
                              border: "1px solid #CFD35E",
                              color: "#FFFFFF",
                              flex: "1",
                            }}
                          >
                            Ubah
                          </Link>
                        </div>
                      </td>
                      <td
                        style={{ textAlign: "left", verticalAlign: "middle" }}
                      >
                        {value.jenis_kegiatan_rl_tiga_titik_lima.nama}
                      </td>
                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        {value.kunjungan_pasien_dalam_kabkota_laki}
                      </td>
                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        {value.kunjungan_pasien_dalam_kabkota_perempuan}
                      </td>
                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        {value.kunjungan_pasien_luar_kabkota_laki}
                      </td>
                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        {value.kunjungan_pasien_luar_kabkota_perempuan}
                      </td>
                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        {value.total_kunjungan}
                      </td>
                    </tr>
                  );
                })}
                {Number(total_kunjungan) !== 0 ? (
                  <tr>
                    <td
                      style={{ textAlign: "center", verticalAlign: "middle" }}
                    >
                      {99}
                    </td>
                    <td></td>
                    <td
                      style={{ textAlign: "left", verticalAlign: "middle" }}
                    >
                      Total
                    </td>
                    <td
                      style={{ textAlign: "center", verticalAlign: "middle" }}
                    >
                      {dataCount[0].kunjungan_pasien_dalam_kabkota_laki}
                    </td>
                    <td
                      style={{ textAlign: "center", verticalAlign: "middle" }}
                    >
                      {dataCount[0].kunjungan_pasien_dalam_kabkota_perempuan}
                    </td>
                    <td
                      style={{ textAlign: "center", verticalAlign: "middle" }}
                    >
                      {dataCount[0].kunjungan_pasien_luar_kabkota_laki}
                    </td>
                    <td
                      style={{ textAlign: "center", verticalAlign: "middle" }}
                    >
                      {dataCount[0].kunjungan_pasien_luar_kabkota_perempuan}
                    </td>
                    <td
                      style={{ textAlign: "center", verticalAlign: "middle" }}
                    >
                      {dataCount[0].total_kunjungan}
                    </td>
                  </tr>
                ) : (
                  <></>
                )}
                {Number(rata_kunjungan) !== 0 ? (
                  <tr>
                    <td
                      style={{ textAlign: "center", verticalAlign: "middle" }}
                    >
                      {77}
                    </td>
                    <td></td>
                    <td
                      style={{ textAlign: "left", verticalAlign: "middle" }}
                    >
                      Rata-rata kunjungan per hari
                    </td>
                    <td
                      style={{ textAlign: "center", verticalAlign: "middle" }}
                    >
                      {dataCount[1].kunjungan_pasien_dalam_kabkota_laki}
                    </td>
                    <td
                      style={{ textAlign: "center", verticalAlign: "middle" }}
                    >
                      {dataCount[1].kunjungan_pasien_dalam_kabkota_perempuan}
                    </td>
                    <td
                      style={{ textAlign: "center", verticalAlign: "middle" }}
                    >
                      {dataCount[1].kunjungan_pasien_luar_kabkota_laki}
                    </td>
                    <td
                      style={{ textAlign: "center", verticalAlign: "middle" }}
                    >
                      {dataCount[1].kunjungan_pasien_luar_kabkota_perempuan}
                    </td>
                    <td
                      style={{ textAlign: "center", verticalAlign: "middle" }}
                    >
                      {dataCount[1].total_kunjungan}
                    </td>
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

export default RL35Manual;
