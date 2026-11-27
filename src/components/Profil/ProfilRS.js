import React, { useState, useEffect } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate } from "react-router-dom";
import Spinner from "react-bootstrap/Spinner";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";
import { isRS } from "../../utils/peran";
import "./profil.css";

// Tanggal dari API dalam UTC (mis. "2022-07-05T17:00:00.000Z" = 6 Juli 2022 WIB)
const formatTanggal = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (isNaN(date)) return value;
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
};

// Luas dari API sudah berformat Indonesia (mis. "47.820"), cukup tambah satuan
const formatLuas = (value) => (value ? `${value} m²` : null);

// Data dari /apisirs6v2/rumahsakit/:id, dikelompokkan per bagian.
// col: lebar kolom Bootstrap; format: pengubah tampilan nilai (opsional)
const SECTIONS = [
  {
    title: "Identitas",
    fields: [
      { key: "id", label: "Kode RS", col: "col-md-3" },
      { key: "nama", label: "Nama Rumah Sakit", col: "col-md-9" },
      { key: "jenis", label: "Jenis", col: "col-md-4" },
      { key: "kelas", label: "Kelas", col: "col-md-2" },
      { key: "kepemilikan", label: "Kepemilikan", col: "col-md-6" },
      { key: "direktur", label: "Direktur", col: "col-md-12" },
    ],
  },
  {
    title: "Kontak",
    fields: [
      { key: "telepon", label: "Telepon", col: "col-md-4" },
      { key: "email", label: "Email", col: "col-md-4" },
      { key: "website", label: "Website", col: "col-md-4" },
    ],
  },
  {
    title: "Lokasi",
    fields: [
      { key: "alamat", label: "Alamat", col: "col-md-12" },
      { key: "kelurahan_nama", label: "Kelurahan", col: "col-md-3" },
      { key: "kecamatan_nama", label: "Kecamatan", col: "col-md-3" },
      { key: "kab_kota_nama", label: "Kabupaten/Kota", col: "col-md-3" },
      { key: "provinsi_nama", label: "Provinsi", col: "col-md-3" },
    ],
  },
  {
    title: "Perizinan & Pengelolaan",
    fields: [
      {
        key: "no_surat_ijin_operasional",
        label: "No. Surat Izin Operasional",
        col: "col-md-4",
      },
      {
        key: "tanggal_surat_ijin_operasional",
        label: "Tanggal Surat Izin Operasional",
        col: "col-md-4",
        format: formatTanggal,
      },
      { key: "status_blu", label: "Status BLU", col: "col-md-4" },
      {
        key: "ketersediaan_simrs",
        label: "Ketersediaan SIMRS",
        col: "col-md-12",
      },
    ],
  },
  {
    title: "Fasilitas",
    fields: [
      {
        key: "luas_tanah",
        label: "Luas Tanah",
        col: "col-md-6",
        format: formatLuas,
      },
      {
        key: "luas_bangunan",
        label: "Luas Bangunan",
        col: "col-md-6",
        format: formatLuas,
      },
    ],
  },
];

const tampilkan = (field, data) => {
  const raw = data[field.key];
  const value = field.format ? field.format(raw) : raw;
  return value === null || value === undefined || String(value).trim() === ""
    ? "-"
    : String(value).trim();
};

// Profil rumah sakit (dulu di Beranda). Dibuka dari nama RS di sidebar.
const ProfilRS = () => {
  const [user, setUser] = useState({});
  const [rumahSakit, setRumahSakit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gagal, setGagal] = useState(false);
  const { CSRFToken } = useCSRFTokenContext();
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      let accessToken;
      let decoded;
      try {
        const response = await axios.get("/apisirs6v2/token", {
          headers: { "XSRF-TOKEN": CSRFToken },
        });
        accessToken = response.data.accessToken;
        decoded = jwt_decode(accessToken);
        setUser(decoded);
      } catch (error) {
        if (error.response) navigate("/");
        return;
      }

      if (!isRS(decoded)) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          "/apisirs6v2/rumahsakit/" + decoded.satKerId,
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        setRumahSakit(response.data.data);
      } catch (error) {
        setGagal(true);
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container" style={{ marginTop: "70px" }}>
      <h4>
        <span style={{ color: "gray" }}>Profil Rumah Sakit</span>
      </h4>

      <div className="card mt-3">
        <div className="card-body">
          <h5 className="card-title mb-3">Data Rumah Sakit</h5>
          {loading ? (
            <div className="d-flex align-items-center gap-2">
              <Spinner animation="border" size="sm" />
              <span>Memuat data rumah sakit...</span>
            </div>
          ) : !isRS(user) ? (
            <p className="mb-0">
              Profil rumah sakit hanya tersedia untuk akun rumah sakit.
            </p>
          ) : gagal || !rumahSakit ? (
            <p className="mb-0">Data rumah sakit tidak dapat dimuat.</p>
          ) : (
            (() => {
              // Urutan kemunculan berjalan terus lintas bagian:
              // judul bagian, lalu kotak-kotaknya, lalu bagian berikutnya
              let urutan = 0;
              return SECTIONS.map((section, sIdx) => (
                <div key={section.title} className={sIdx > 0 ? "mt-4" : ""}>
                  <h6
                    className="fw-semibold mb-2 br-reveal-title"
                    style={{ "--i": urutan++ }}
                  >
                    {section.title}
                  </h6>
                  <div className="row g-3">
                    {section.fields.map((field) => (
                      <div
                        key={field.key}
                        className={`${field.col} br-reveal`}
                        style={{ "--i": urutan++ }}
                      >
                        <div className="form-floating">
                          <input
                            type="text"
                            className="form-control"
                            id={`rs-${field.key}`}
                            value={tampilkan(field, rumahSakit)}
                            disabled={true}
                          />
                          <label htmlFor={`rs-${field.key}`}>
                            {field.label}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ));
            })()
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilRS;
