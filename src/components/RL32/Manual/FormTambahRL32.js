import React, { useState, useEffect } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate, Link } from "react-router-dom";
import style from "./FormTambahRL32.module.css";
import { HiSaveAs } from "react-icons/hi";
import { ArrowLeft } from "react-bootstrap-icons";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useCSRFTokenContext } from "../../Context/CSRFTokenContext";
import ProfilRSRingkas from "../../Shared/ProfilRSRingkas";
import pf from "../../Shared/ProfilRSRingkas.module.css";
// import Table from 'react-bootstrap/Table'

const FormTambahRL32 = () => {
  const [kodeRS, setKodeRS] = useState("");
  const [profilRS, setProfilRS] = useState(null);
  // Default periode: bulan lalu (Januari -> Desember tahun sebelumnya)
  const bulanLalu = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
  const [bulan, setBulan] = useState(bulanLalu.getMonth() + 1);
  const [tahun, setTahun] = useState(String(bulanLalu.getFullYear()));
  const [daftarBulan, setDaftarBulan] = useState([]);
  const [dataRL, setDataRL] = useState([]);
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const [buttonStatus, setButtonStatus] = useState(false);
  const navigate = useNavigate();
  const { CSRFToken } = useCSRFTokenContext();

  useEffect(() => {
    refreshToken();
    getRLTigaTitikSatuTemplate();
    getBulan();
    // const date = new Date();
    // setTahun(date.getFullYear())

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
    }
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

  const getRLTigaTitikSatuTemplate = async () => {
    try {
      const response = await axiosJWT.get(
        "/apisirs6v2/rltigatitikduajenispelayanan",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const rlTemplate = response.data.data.map((value, index) => {
        return {
          id: value.id,
          no: value.no,
          jenisPelayanan: value.nama,
          pasienAwalBulan: 0,
          pasienMasuk: 0,
          pasienPindahan: 0,
          pasienDipindahkan: 0,
          pasienKeluarHidup: 0,
          pasienKeluarMatiKurangDari48Jam: 0,
          pasienKeluarMatiLebihDariAtauSamaDengan48Jam: 0,
          pasienWanitaKeluarMatiKurangDari48Jam: 0,
          pasienWanitaKeluarMatiLebihDariAtauSamaDengan48Jam: 0,
          jumlahLamaDirawat: 0,
          pasienAkhirBulan: 0,
          jumlahHariPerawatan: 0,
          rincianHariPerawatanKelasVVIP: 0,
          rincianHariPerawatanKelasVIP: 0,
          rincianHariPerawatanKelas1: 0,
          rincianHariPerawatanKelas2: 0,
          rincianHariPerawatanKelas3: 0,
          rincianHariPerawatanKelasKhusus: 0,
          jumlahAlokasiTempatTidurAwalBulan: 0,
          kelompokJenisPelayananNama: value.kelompok_jenis_pelayanan_nama,
          disabledInput: true,
          checked: false,
        };
      });
      setDataRL(rlTemplate);
    } catch (error) {
      console.log(error);
    }
  };

  const handleFocus = (event) => {
    event.target.select();
  };

  const changeHandlerSingle = (event) => {
    setTahun(event.target.value);
  };

  const hitungPasienAkhirBulan = (index) => {
    let newDataRL = [...dataRL];
    newDataRL[index].pasienAkhirBulan =
      parseInt(newDataRL[index].pasienAwalBulan) +
      parseInt(newDataRL[index].pasienMasuk) +
      parseInt(newDataRL[index].pasienPindahan) -
      (parseInt(newDataRL[index].pasienDipindahkan) +
        parseInt(newDataRL[index].pasienKeluarHidup) +
        parseInt(newDataRL[index].pasienKeluarMatiKurangDari48Jam) +
        parseInt(
          newDataRL[index].pasienKeluarMatiLebihDariAtauSamaDengan48Jam
        ) +
        parseInt(newDataRL[index].pasienWanitaKeluarMatiKurangDari48Jam) +
        parseInt(
          newDataRL[index].pasienWanitaKeluarMatiLebihDariAtauSamaDengan48Jam
        ));
  };

  const hitungHariPerawatan = (index) => {
    let newDataRL = [...dataRL];
    newDataRL[index].jumlahHariPerawatan =
      parseInt(newDataRL[index].rincianHariPerawatanKelasVVIP) +
      parseInt(newDataRL[index].rincianHariPerawatanKelasVIP) +
      parseInt(newDataRL[index].rincianHariPerawatanKelas1) +
      parseInt(newDataRL[index].rincianHariPerawatanKelas2) +
      parseInt(newDataRL[index].rincianHariPerawatanKelas3) +
      parseInt(newDataRL[index].rincianHariPerawatanKelasKhusus);
  };

  const changeHandler = (event, index) => {
    let newDataRL = [...dataRL];
    const name = event.target.name;
    if (name === "check") {
      if (event.target.checked === true) {
        if (newDataRL[index].id !== 100) {
          newDataRL[index].disabledInput = false;
        }
        // setStatusTidakAdaData(true)
      } else if (event.target.checked === false) {
        newDataRL[index].disabledInput = true;
        // setStatusTidakAdaData(false)
      }
      newDataRL[index].checked = event.target.checked;
    } else if (name === "pasienAwalBulan") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].pasienAwalBulan = parseInt(event.target.value);
      hitungPasienAkhirBulan(index);
    } else if (name === "pasienMasuk") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].pasienMasuk = event.target.value;
      hitungPasienAkhirBulan(index);
    } else if (name === "pasienPindahan") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].pasienPindahan = event.target.value;
      hitungPasienAkhirBulan(index);
    } else if (name === "pasienDipindahkan") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].pasienDipindahkan = event.target.value;
      hitungPasienAkhirBulan(index);
    } else if (name === "pasienKeluarHidup") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].pasienKeluarHidup = event.target.value;
      hitungPasienAkhirBulan(index);
    } else if (name === "pasienKeluarMatiKurangDari48Jam") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].pasienKeluarMatiKurangDari48Jam = event.target.value;
      hitungPasienAkhirBulan(index);
    } else if (name === "pasienKeluarMatiLebihDariAtauSamaDengan48Jam") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].pasienKeluarMatiLebihDariAtauSamaDengan48Jam =
        event.target.value;
      hitungPasienAkhirBulan(index);
    } else if (name === "pasienWanitaKeluarMatiKurangDari48Jam") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].pasienWanitaKeluarMatiKurangDari48Jam =
        event.target.value;
      hitungPasienAkhirBulan(index);
    } else if (name === "pasienWanitaKeluarMatiLebihDariAtauSamaDengan48Jam") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].pasienWanitaKeluarMatiLebihDariAtauSamaDengan48Jam =
        event.target.value;
      hitungPasienAkhirBulan(index);
    } else if (name === "jumlahLamaDirawat") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].jumlahLamaDirawat = event.target.value;
    } else if (name === "pasienAkhirBulan") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].jumlahPasienAkhirBulan = event.target.value;
    } else if (name === "jumlahHariPerawatan") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].jumlahHariPerawatan = event.target.value;
    } else if (name === "rincianHariPerawatanKelasVVIP") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].rincianHariPerawatanKelasVVIP = event.target.value;
      hitungHariPerawatan(index);
    } else if (name === "rincianHariPerawatanKelasVIP") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].rincianHariPerawatanKelasVIP = event.target.value;
      hitungHariPerawatan(index);
    } else if (name === "rincianHariPerawatanKelas1") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].rincianHariPerawatanKelas1 = event.target.value;
      hitungHariPerawatan(index);
    } else if (name === "rincianHariPerawatanKelas2") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].rincianHariPerawatanKelas2 = event.target.value;
      hitungHariPerawatan(index);
    } else if (name === "rincianHariPerawatanKelas3") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].rincianHariPerawatanKelas3 = event.target.value;
      hitungHariPerawatan(index);
    } else if (name === "rincianHariPerawatanKelasKhusus") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].rincianHariPerawatanKelasKhusus = event.target.value;
      hitungHariPerawatan(index);
    } else if (name === "jumlahAlokasiTempatTidurAwalBulan") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].jumlahAlokasiTempatTidurAwalBulan = event.target.value;
    } else if (name === "kelompokJenisPelayanan") {
      if (event.target.value === "") {
        event.target.value = 1;
        event.target.select(event.target.value);
      }
      newDataRL[index].kelompokJenisPelayananId = event.target.value;
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
            rlTigaTitikDuaJenisPelayananId: value.id,
            pasienAwalBulan: value.pasienAwalBulan,
            pasienMasuk: value.pasienMasuk,
            pasienPindahan: value.pasienPindahan,
            pasienDipindahkan: value.pasienDipindahkan,
            pasienKeluarHidup: value.pasienKeluarHidup,
            pasienKeluarMatiKurangDari48Jam:
              value.pasienKeluarMatiKurangDari48Jam,
            pasienKeluarMatiLebihDariAtauSamaDengan48Jam:
              value.pasienKeluarMatiLebihDariAtauSamaDengan48Jam,
            pasienWanitaKeluarMatiKurangDari48Jam:
              value.pasienWanitaKeluarMatiKurangDari48Jam,
            pasienWanitaKeluarMatiLebihDariAtauSamaDengan48Jam:
              value.pasienWanitaKeluarMatiLebihDariAtauSamaDengan48Jam,
            jumlahLamaDirawat: value.jumlahLamaDirawat,
            rincianHariPerawatanKelasVVIP: value.rincianHariPerawatanKelasVVIP,
            rincianHariPerawatanKelasVIP: value.rincianHariPerawatanKelasVIP,
            rincianHariPerawatanKelas1: value.rincianHariPerawatanKelas1,
            rincianHariPerawatanKelas2: value.rincianHariPerawatanKelas2,
            rincianHariPerawatanKelas3: value.rincianHariPerawatanKelas3,
            rincianHariPerawatanKelasKhusus:
              value.rincianHariPerawatanKelasKhusus,
            jumlahAlokasiTempatTidurAwalBulan:
              value.jumlahAlokasiTempatTidurAwalBulan,
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
        "/apisirs6v2/rltigatitikdua",
        {
          periodeBulan: parseInt(bulan),
          periodeTahun: parseInt(tahun),
          data: dataRLArray,
        },
        customConfig
      );

      toast("Data Berhasil Disimpan", {
        position: toast.POSITION.TOP_RIGHT,
      });
      setTimeout(() => {
        navigate("/rl32");
      }, 1000);
    } catch (error) {
      toast(`Data tidak bisa disimpan karena ,${error.response.data.message}`, {
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

  const bulanChangeHandler = async (e) => {
    setBulan(e.target.value);
  };

  const currentYear = new Date().getFullYear();
  const daftarTahun = [];
  for (let i = 2025; i <= currentYear; i++) {
    daftarTahun.push(i);
  }

  return (
    <div
      className="container"
      style={{ marginTop: "70px", marginBottom: "70px" }}
    >
      {/* jarak antar-card (Kembali, profil RS, periode, tabel) sama: 1rem */}
      <Link
        to={`/rl32/`}
        className="gl-back"
        style={{ "--gl-back-gap": "1rem" }}
      >
        <span className="gl-back-icon" aria-hidden="true">
          <ArrowLeft size={18} />
        </span>
        <span className="gl-back-text">
          <small>Kembali ke</small>
          <strong>RL 3.2 Rawat Inap</strong>
        </span>
      </Link>
      <form id="formInputRLRawatInap" onSubmit={Simpan}>
        <ProfilRSRingkas kode={kodeRS} rs={profilRS}>
          <div className={pf.periode}>
            <span className={pf.periodeLabel}>Periode Laporan</span>
            <select
              value={String(Number(bulan))}
              className={`form-select ${pf.pilih}`}
              onChange={bulanChangeHandler}
              aria-label="Bulan"
            >
              {daftarBulan.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.key}
                </option>
              ))}
            </select>
            <select
              name="tahun"
              value={tahun}
              className={`form-select ${pf.pilih}`}
              onChange={(e) => changeHandlerSingle(e)}
              aria-label="Tahun"
            >
              {daftarTahun.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </ProfilRSRingkas>

        <div className="row mt-2">
          <div className="col-md-12">
            <div className={`${style["table-container"]} mt-2 mb-1 pb-2 `}>
              <table className={style.table}>
                <thead className={style.thead}>
                  <tr className="main-header-row">
                    <th
                      className={style["sticky-header"]}
                      rowSpan="2"
                      style={{ width: "2%" }}
                    >
                      No.
                    </th>
                    <th
                      className={style["sticky-header"]}
                      rowSpan="2"
                      style={{ width: "1.2%" }}
                    ></th>
                    <th
                      className={style["sticky-header"]}
                      rowSpan="2"
                      style={{ width: "8%" }}
                    >
                      Jenis Pelayanan
                    </th>
                    <th rowSpan="2" style={{ width: "4%" }}>
                      Pasien Awal Bulan
                    </th>
                    <th rowSpan="2" style={{ width: "4%" }}>
                      Pasien Masuk
                    </th>
                    <th rowSpan="2" style={{ width: "4%" }}>
                      Pasien Pindahan
                    </th>
                    <th rowSpan="2" style={{ width: "4%" }}>
                      Pasien Dipindahkan
                    </th>
                    <th rowSpan="2" style={{ width: "4%" }}>
                      Pasien Keluar Hidup
                    </th>
                    <th colSpan="2" style={{ width: "8%" }}>
                      Pasien Pria Keluar Mati
                    </th>
                    <th colSpan="2" style={{ width: "8%" }}>
                      Pasien Wanita Keluar Mati
                    </th>
                    <th rowSpan="2" style={{ width: "4%" }}>
                      Jumlah Lama Dirawat
                    </th>
                    <th rowSpan="2" style={{ width: "4%" }}>
                      Pasien Akhir Bulan
                    </th>
                    <th rowSpan="2" style={{ width: "4%" }}>
                      Jumlah Hari Perawatan
                    </th>
                    <th colSpan="6" style={{ width: "20%" }}>
                      Rincian Hari Perawatan Per Kelas
                    </th>
                    <th rowSpan="2" style={{ width: "4%" }}>
                      Jumlah Alokasi TT Awal Bulan
                    </th>
                  </tr>
                  <tr className={style["subheader-row"]}>
                    <th style={{ width: "4%" }}>{"< 48 jam"}</th>
                    <th style={{ width: "4%" }}>{">= 48 jam"}</th>
                    <th style={{ width: "4%" }}>{"< 48 jam"}</th>
                    <th style={{ width: "4%" }}>{">= 48 jam"}</th>
                    <th style={{ width: "4%" }}>VVIP</th>
                    <th style={{ width: "4%" }}>VIP</th>
                    <th style={{ width: "4%" }}>1</th>
                    <th style={{ width: "4%" }}>2</th>
                    <th style={{ width: "4%" }}>3</th>
                    <th style={{ width: "4%" }}>Khusus</th>
                  </tr>
                </thead>
                <tbody>
                  {dataRL.map((value, index) => {
                    return (
                      <tr key={value.id}>
                        <td className={style["sticky-column"]}>
                          <input
                            type="text"
                            name="id"
                            className="form-control"
                            value={value.no}
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
                            name="jenisPelayanan"
                            className="form-control"
                            value={value.jenisPelayanan}
                            disabled={true}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            name="pasienAwalBulan"
                            className="form-control"
                            value={value.pasienAwalBulan}
                            onFocus={handleFocus}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={value.disabledInput}
                            min={0}
                            onPaste={preventPasteNegative}
                            onKeyPress={preventMinus}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            name="pasienMasuk"
                            className="form-control"
                            value={value.pasienMasuk}
                            onFocus={handleFocus}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={value.disabledInput}
                            min={0}
                            onPaste={preventPasteNegative}
                            onKeyPress={preventMinus}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            name="pasienPindahan"
                            className="form-control"
                            value={value.pasienPindahan}
                            onFocus={handleFocus}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={value.disabledInput}
                            min={0}
                            onPaste={preventPasteNegative}
                            onKeyPress={preventMinus}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            name="pasienDipindahkan"
                            className="form-control"
                            value={value.pasienDipindahkan}
                            onFocus={handleFocus}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={value.disabledInput}
                            min={0}
                            onPaste={preventPasteNegative}
                            onKeyPress={preventMinus}
                          />
                        </td>

                        <td>
                          <input
                            type="number"
                            name="pasienKeluarHidup"
                            className="form-control"
                            value={value.pasienKeluarHidup}
                            onFocus={handleFocus}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={value.disabledInput}
                            min={0}
                            onPaste={preventPasteNegative}
                            onKeyPress={preventMinus}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            name="pasienKeluarMatiKurangDari48Jam"
                            className="form-control"
                            value={value.pasienKeluarMatiKurangDari48Jam}
                            onFocus={handleFocus}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={value.disabledInput}
                            min={0}
                            onPaste={preventPasteNegative}
                            onKeyPress={preventMinus}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            name="pasienKeluarMatiLebihDariAtauSamaDengan48Jam"
                            className="form-control"
                            value={
                              value.pasienKeluarMatiLebihDariAtauSamaDengan48Jam
                            }
                            onFocus={handleFocus}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={value.disabledInput}
                            min={0}
                            onPaste={preventPasteNegative}
                            onKeyPress={preventMinus}
                          />
                        </td>

                        <td>
                          <input
                            type="number"
                            name="pasienWanitaKeluarMatiKurangDari48Jam"
                            className="form-control"
                            value={value.pasienWanitaKeluarMatiKurangDari48Jam}
                            onFocus={handleFocus}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={value.disabledInput}
                            min={0}
                            onPaste={preventPasteNegative}
                            onKeyPress={preventMinus}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            name="pasienWanitaKeluarMatiLebihDariAtauSamaDengan48Jam"
                            className="form-control"
                            value={
                              value.pasienWanitaKeluarMatiLebihDariAtauSamaDengan48Jam
                            }
                            onFocus={handleFocus}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={value.disabledInput}
                            min={0}
                            onPaste={preventPasteNegative}
                            onKeyPress={preventMinus}
                          />
                        </td>

                        <td>
                          <input
                            type="number"
                            name="jumlahLamaDirawat"
                            className="form-control"
                            value={value.jumlahLamaDirawat}
                            onFocus={handleFocus}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={value.disabledInput}
                            min={0}
                            onPaste={preventPasteNegative}
                            onKeyPress={preventMinus}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            name="pasienAkhirBulan"
                            className="form-control"
                            value={value.pasienAkhirBulan}
                            onFocus={handleFocus}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={true}
                            min={0}
                            onPaste={preventPasteNegative}
                            onKeyPress={preventMinus}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            name="jumlahHariPerawatan"
                            className="form-control"
                            value={value.jumlahHariPerawatan}
                            onFocus={handleFocus}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={true}
                            min={0}
                            onPaste={preventPasteNegative}
                            onKeyPress={preventMinus}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            name="rincianHariPerawatanKelasVVIP"
                            className="form-control"
                            value={value.rincianHariPerawatanKelasVVIP}
                            onFocus={handleFocus}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={value.disabledInput}
                            min={0}
                            onPaste={preventPasteNegative}
                            onKeyPress={preventMinus}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            name="rincianHariPerawatanKelasVIP"
                            className="form-control"
                            value={value.rincianHariPerawatanKelasVIP}
                            onFocus={handleFocus}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={value.disabledInput}
                            min={0}
                            onPaste={preventPasteNegative}
                            onKeyPress={preventMinus}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            name="rincianHariPerawatanKelas1"
                            className="form-control"
                            value={value.rincianHariPerawatanKelas1}
                            onFocus={handleFocus}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={value.disabledInput}
                            min={0}
                            onPaste={preventPasteNegative}
                            onKeyPress={preventMinus}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            name="rincianHariPerawatanKelas2"
                            className="form-control"
                            value={value.rincianHariPerawatanKelas2}
                            onFocus={handleFocus}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={value.disabledInput}
                            min={0}
                            onPaste={preventPasteNegative}
                            onKeyPress={preventMinus}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            name="rincianHariPerawatanKelas3"
                            className="form-control"
                            value={value.rincianHariPerawatanKelas3}
                            onFocus={handleFocus}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={value.disabledInput}
                            min={0}
                            onPaste={preventPasteNegative}
                            onKeyPress={preventMinus}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            name="rincianHariPerawatanKelasKhusus"
                            className="form-control"
                            value={value.rincianHariPerawatanKelasKhusus}
                            onFocus={handleFocus}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={value.disabledInput}
                            min={0}
                            onPaste={preventPasteNegative}
                            onKeyPress={preventMinus}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            name="jumlahAlokasiTempatTidurAwalBulan"
                            className="form-control"
                            value={value.jumlahAlokasiTempatTidurAwalBulan}
                            onFocus={handleFocus}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={value.disabledInput}
                            min={0}
                            onPaste={preventPasteNegative}
                            onKeyPress={preventMinus}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="mt-3 mb-3">
          <ToastContainer />
          <button
            type="submit"
            className="btn btn-outline-success"
            disabled={buttonStatus}
          >
            <HiSaveAs /> Simpan
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormTambahRL32;
