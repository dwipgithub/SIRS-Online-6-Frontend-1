import React, { useState, useEffect } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  HouseDoor,
  ClipboardData,
  Clipboard2Pulse,
  FileEarmarkMedical,
  CalendarCheck,
  BoxArrowRight,
  List,
  ChevronDown,
  ChevronDoubleLeft,
  ChevronDoubleRight,
  X,
} from "react-bootstrap-icons";
import SirsLogo from "../Images/SirsLogo";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";
import { namaPeran, isRS } from "../../utils/peran";
import "./NavigationBar.css";

// Struktur menu sidebar
const MENU = [
  {
    key: "rl3",
    label: "RL 3",
    icon: ClipboardData,
    items: [
      { to: "/rl31", label: "RL 3.1 Indikator Pelayanan" },
      { to: "/rl32", label: "RL 3.2 Rawat Inap" },
      { to: "/rl33", label: "RL 3.3 Rawat Darurat" },
      { to: "/RL34", label: "RL 3.4 Pengunjung" },
      { to: "/rl35", label: "RL 3.5 Kunjungan" },
      { to: "/rl36", label: "RL 3.6 Kebidanan" },
      { to: "/rl37", label: "RL 3.7 Neonatal, Bayi, dan Balita" },
      { to: "/rl38", label: "RL 3.8 Laboratorium" },
      { to: "/rl39", label: "RL 3.9 Radiologi" },
      { to: "/rl310", label: "RL 3.10 Rujukan" },
      { to: "/rl311", label: "RL 3.11 Gigi Dan Mulut" },
      { to: "/rl312", label: "RL 3.12 Pembedahan" },
      { to: "/rl313", label: "RL 3.13 Rehabilitasi Medik" },
      { to: "/rl314", label: "RL 3.14 Pelayanan Khusus" },
      { to: "/rl315", label: "RL 3.15 Kesehatan Jiwa" },
      { to: "/rl316", label: "RL 3.16 Keluarga Berencana" },
      { to: "/rl317", label: "RL 3.17 Farmasi Pengadaan Obat" },
      { to: "/rl318", label: "RL 3.18 Farmasi Resep" },
      { to: "/rl319", label: "RL 3.19 Cara Bayar" },
    ],
  },
  {
    key: "rl4",
    label: "RL 4",
    icon: Clipboard2Pulse,
    items: [
      { to: "/rl41", label: "RL 4.1 Morbiditas Pasien Rawat Inap" },
      { to: "/rl42", label: "RL 4.2 10 Besar Penyakit Rawat Inap" },
      {
        to: "/rl43",
        label: "RL 4.3 10 Besar Kematian Penyakit Pasien Rawat Inap",
      },
    ],
  },
  {
    key: "rl5",
    label: "RL 5",
    icon: FileEarmarkMedical,
    items: [
      { to: "/rl51", label: "RL 5.1 Mobiditas Pasien Rawat Jalan" },
      { to: "/rl52", label: "RL 5.2 10 Besar Kasus Baru Penyakit Rawat Jalan" },
      { to: "/rl53", label: "RL 5.3 10 Besar Kunjungan Penyakit Rawat Jalan" },
    ],
  },
  {
    key: "absensi",
    label: "Absensi",
    icon: CalendarCheck,
    items: [{ to: "/absensi", label: "Absensi" }],
  },
];

// Pisahkan kode RL ("RL 4.3") dari judulnya agar baris lanjutan
// sejajar dengan awal judul, bukan kembali ke bawah tulisan "RL".
// Hapus semua cookie yang bisa diakses JavaScript (non-httpOnly).
// Cookie httpOnly hanya bisa dihapus backend lewat /apisirs6v2/logout.
const hapusCookieBrowser = () => {
  const paths = ["/", process.env.PUBLIC_URL || ""].filter(Boolean);
  document.cookie.split(";").forEach((cookie) => {
    const name = cookie.split("=")[0].trim();
    if (!name) return;
    paths.forEach((path) => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`;
    });
  });
};

const renderSubLabel = (label) => {
  const match = label.match(/^(RL \d+\.\d+)\s+(.*)$/);
  if (!match) return label;
  return (
    <>
      <span className="gs-sublink-code">{match[1]}</span>
      <span className="gs-sublink-text">{match[2]}</span>
    </>
  );
};

const COLLAPSE_KEY = "sidebarCollapsed";

const bacaCollapsed = () => {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch (e) {
    return false;
  }
};

const groupDariPath = (pathname) => {
  const p = pathname.toLowerCase();
  const group = MENU.find((g) =>
    g.items.some((i) => p.startsWith(i.to.toLowerCase())),
  );
  return group ? group.key : null;
};

const NavigationBar = () => {
  // const [token, setToken] = useState('')
  const [expire, setExpire] = useState("");
  const [user, setUser] = useState({});
  const { CSRFToken } = useCSRFTokenContext();

  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(bacaCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState(() =>
    groupDariPath(location.pathname),
  );
  // Mode ringkas: sidebar boleh melebar sementara saat di-hover hanya setelah
  // kursor keluar dulu dari sidebar (agar klik "Ringkas" langsung terlihat).
  const [hoverReady, setHoverReady] = useState(false);
  const [hovering, setHovering] = useState(false);
  const hoverExpanded = collapsed && hoverReady && hovering;

  const isDesktop = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(min-width: 992px)").matches;

  useEffect(() => {
    refreshToken();
    document.title = "SIRS Online Versi 6";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Geser konten halaman sesuai lebar sidebar
  useEffect(() => {
    document.body.classList.add("gs-has-sidebar");
    return () => {
      document.body.classList.remove("gs-has-sidebar", "gs-collapsed");
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("gs-collapsed", collapsed);
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
    } catch (e) {
      // abaikan jika storage tidak tersedia
    }
  }, [collapsed]);

  // Tutup sidebar mobile & buka grup aktif saat pindah halaman
  useEffect(() => {
    setMobileOpen(false);
    const g = groupDariPath(location.pathname);
    if (g) setOpenGroup(g);
  }, [location.pathname]);

  const refreshToken = async () => {
    try {
      const customConfig = {
        headers: {
          "XSRF-TOKEN": CSRFToken,
        },
      };
      const response = await axios.get("/apisirs6v2/token", customConfig);
      // setToken(response.data.accessToken)
      const decoded = jwt_decode(response.data.accessToken);
      setUser(decoded);
      setExpire(decoded.exp);
    } catch (error) {
      if (error.response || error.code === "ERR_NETWORK") {
        navigate("/"); // redirect kalau gagal ambil token
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
        const decoded = jwt_decode(response.data.accessToken);
        setExpire(decoded.exp);
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    },
  );

  const Logout = async () => {
    try {
      const customConfig = {
        headers: {
          "XSRF-TOKEN": CSRFToken,
        },
      };
      // Backend menghapus cookie httpOnly (refreshToken, XSRF-TOKEN, connect.sid)
      await axios.delete("/apisirs6v2/logout", customConfig);
    } catch (error) {
      console.log(error);
    } finally {
      // Tetap bersihkan sisi browser & keluar walaupun request logout gagal
      localStorage.removeItem("id");
      hapusCookieBrowser();
      window.location.replace(process.env.REACT_APP_BASE_SSO);
    }
  };

  const toggleGroup = (key) => {
    if (hoverExpanded) {
      // Sidebar sedang melebar sementara: buka/tutup grup tanpa
      // menonaktifkan mode ringkas
      setOpenGroup((prev) => (prev === key ? null : key));
      return;
    }
    if (collapsed) {
      // Saat ringkas, klik grup akan membuka sidebar
      setCollapsed(false);
      setOpenGroup(key);
      return;
    }
    setOpenGroup((prev) => (prev === key ? null : key));
  };

  const inisial = (user.nama || "?").trim().charAt(0).toUpperCase();

  return (
    <>
      {/* Top bar untuk layar kecil */}
      <header className="gs-topbar">
        <button
          type="button"
          className="gs-icon-btn"
          aria-label="Buka menu"
          onClick={() => setMobileOpen(true)}
        >
          <List size={22} />
        </button>
        <Link to="/beranda" className="gs-topbar-brand">
          <SirsLogo size={28} className="gs-logo" />
          <span>SIRS Online</span>
        </Link>
      </header>

      <div
        className={`gs-backdrop ${mobileOpen ? "show" : ""}`}
        onClick={() => setMobileOpen(false)}
      />

      <aside
        className={`gs-sidebar ${collapsed ? "collapsed" : ""} ${
          hoverExpanded ? "hover-expand" : ""
        } ${mobileOpen ? "mobile-open" : ""}`}
        aria-label="Navigasi utama"
        onMouseEnter={() => {
          if (isDesktop()) setHovering(true);
        }}
        onMouseLeave={() => {
          setHovering(false);
          setHoverReady(true);
        }}
      >
        <div className="gs-brand">
          <Link to="/beranda" className="gs-brand-link">
            <SirsLogo size={38} className="gs-logo" />
            <div className="gs-brand-text">
              <strong>SIRS Online</strong>
              <small>Versi 6</small>
            </div>
          </Link>
          <button
            type="button"
            className="gs-icon-btn gs-close-mobile"
            aria-label="Tutup menu"
            onClick={() => setMobileOpen(false)}
          >
            <X size={22} />
          </button>
        </div>

        <nav className="gs-nav">
          <NavLink
            to="/beranda"
            className={({ isActive }) => `gs-link ${isActive ? "active" : ""}`}
            title="Beranda"
          >
            <HouseDoor className="gs-link-icon" size={18} />
            <span className="gs-label">Beranda</span>
          </NavLink>

          <div className="gs-section-title">Laporan</div>

          {MENU.map((group) => {
            const Icon = group.icon;
            const isOpen =
              openGroup === group.key && (!collapsed || hoverExpanded);
            const isActiveGroup =
              groupDariPath(location.pathname) === group.key;
            return (
              <div
                key={group.key}
                className={`gs-group ${isOpen ? "open" : ""}`}
              >
                <button
                  type="button"
                  className={`gs-link gs-group-btn ${
                    isActiveGroup ? "active-group" : ""
                  }`}
                  onClick={() => toggleGroup(group.key)}
                  aria-expanded={isOpen}
                  title={group.label}
                >
                  <Icon className="gs-link-icon" size={18} />
                  <span className="gs-label">{group.label}</span>
                  <ChevronDown className="gs-chevron" size={14} />
                </button>
                <div className="gs-submenu">
                  <div className="gs-submenu-inner">
                    {group.items.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                          `gs-sublink ${isActive ? "active" : ""}`
                        }
                      >
                        {renderSubLabel(item.label)}
                      </NavLink>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        <div className="gs-footer">
          {isRS(user) ? (
            // Akun RS: klik nama RS untuk membuka profil rumah sakit
            <NavLink
              to="/profil"
              className={({ isActive }) =>
                `gs-user gs-user-link ${isActive ? "active" : ""}`
              }
              title={`${user.nama || ""} — lihat profil rumah sakit`}
            >
              <div className="gs-avatar">{inisial}</div>
              <div className="gs-user-text">
                <small>{namaPeran(user) || "Login sebagai"}</small>
                <strong>{user.nama || "-"}</strong>
              </div>
            </NavLink>
          ) : (
            <div className="gs-user" title={user.nama || ""}>
              <div className="gs-avatar">{inisial}</div>
              <div className="gs-user-text">
                <small>{namaPeran(user) || "Login sebagai"}</small>
                <strong>{user.nama || "-"}</strong>
              </div>
            </div>
          )}
          <button
            type="button"
            className="gs-link gs-logout"
            onClick={Logout}
            title="Log Out"
          >
            <BoxArrowRight className="gs-link-icon" size={18} />
            <span className="gs-label">Log Out</span>
          </button>
          <button
            type="button"
            className="gs-collapse-btn"
            onClick={() => {
              setCollapsed((c) => !c);
              // tunggu kursor keluar dulu sebelum hover boleh melebarkan lagi
              setHoverReady(false);
            }}
            aria-label={collapsed ? "Perluas sidebar" : "Ringkas sidebar"}
            title={collapsed ? "Perluas sidebar" : "Ringkas sidebar"}
          >
            {collapsed ? (
              <ChevronDoubleRight size={16} />
            ) : (
              <>
                <ChevronDoubleLeft size={16} />
                <span className="gs-label">Ringkas</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};

export default NavigationBar;
