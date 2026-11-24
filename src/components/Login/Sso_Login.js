import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";
import SirsLogo from "../Images/SirsLogo";
import "./SsoLogin.css";

// Alur halaman login (route "/"):
// 1. Ada ?token=... dari SSO  -> tukar ke /apisirs6v2/login -> beranda
// 2. Tidak ada token          -> cek sesi /apisirs6v2/token
//      - sesi aktif           -> beranda
//      - tidak ada sesi       -> arahkan ke SSO Kemenkes
const SSO_URL =
  process.env.REACT_APP_BASE_SSO +
  "?continued=" +
  process.env.REACT_APP_BASE_APP;

// Jeda sebelum pindah halaman, agar animasi selesai & pesan terbaca
const REDIRECT_DELAY = 1300;
// Animasi keluar kartu dimulai sekian ms sebelum pindah halaman
const LEAVE_DURATION = 600;

const STATUS = {
  checking: { text: "Memeriksa akses", progress: 35 },
  verifying: { text: "Memverifikasi akun SSO", progress: 65 },
  success: { text: "Akses ditemukan, membuka beranda", progress: 100 },
  redirect: { text: "Mengalihkan ke SSO Kemenkes", progress: 100 },
  error: { text: "", progress: 100 },
};

const TITLE = "SIRS 6 Versi 3";

// Gelembung kaca: posisi, ukuran, durasi & jeda dibuat tetap (tidak acak)
// agar tampilan konsisten di setiap render
const BUBBLES = Array.from({ length: 14 }, (_, i) => ({
  x: `${(i * 37 + 7) % 100}%`,
  s: `${14 + ((i * 23) % 46)}px`,
  d: `${11 + ((i * 7) % 10)}s`,
  delay: `${-((i * 13) % 18)}s`,
  drift: `${(i % 2 ? 1 : -1) * (20 + ((i * 11) % 50))}px`,
}));

const SSO_Login = () => {
  const navigate = useNavigate();
  const { simpanCSRFToken, CSRFToken } = useCSRFTokenContext();
  const [status, setStatus] = useState("checking");
  const [errorText, setErrorText] = useState("");
  const [leaving, setLeaving] = useState(""); // "", "up", "zoom"
  const tiltRef = useRef(null);

  // Latar halaman sama dengan halaman lain (lihat NavigationBar.css)
  useEffect(() => {
    document.body.classList.add("gs-auth-page");
    return () => document.body.classList.remove("gs-auth-page");
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get("token");

    if (tokenFromUrl) {
      loginDenganTokenSSO(tokenFromUrl);
    } else {
      cekSesi();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Jalankan animasi keluar, lalu pindah halaman
  const pindah = (gaya, aksi, delay = REDIRECT_DELAY) => {
    setTimeout(() => setLeaving(gaya), Math.max(0, delay - LEAVE_DURATION));
    setTimeout(aksi, delay);
  };

  const keBeranda = () => {
    setStatus("success");
    pindah("zoom", () => navigate("/beranda", { replace: true }));
  };

  const keSSO = (url = SSO_URL, delay = REDIRECT_DELAY) => {
    if (!process.env.REACT_APP_BASE_SSO) {
      setStatus("error");
      setErrorText("Alamat SSO belum diatur (REACT_APP_BASE_SSO).");
      return;
    }
    setStatus("redirect");
    pindah("up", () => window.location.replace(url), delay);
  };

  const cekSesi = async () => {
    try {
      await axios.get("/apisirs6v2/token", {
        headers: { "XSRF-TOKEN": CSRFToken },
      });
      keBeranda();
    } catch (error) {
      // Tidak ada token/sesi -> login lewat SSO Kemenkes
      keSSO();
    }
  };

  const loginDenganTokenSSO = async (token) => {
    setStatus("verifying");
    try {
      const results = await axios.get("/apisirs6v2/login?token=" + token);
      simpanCSRFToken(results.data.data.csrfToken);
      // Buang token dari URL agar tidak tersimpan di riwayat browser
      window.history.replaceState({}, "", window.location.href.split("?")[0]);
      keBeranda();
    } catch (error) {
      if (error.response && error.response.status === 404) {
        const pesan = "Akun anda tidak aktif, silakan menghubungi Admin";
        toast(pesan, { position: toast.POSITION.TOP_RIGHT });
        setStatus("error");
        setErrorText(pesan);
      } else {
        toast(error.message, { position: toast.POSITION.TOP_RIGHT });
        keSSO(process.env.REACT_APP_BASE_SSO, 2000);
      }
    }
  };

  // Kartu sedikit miring & sorotan cahaya mengikuti kursor
  const handlePointerMove = (e) => {
    const el = tiltRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width; // 0..1
    const py = (e.clientY - rect.top) / rect.height;
    const clamp = (v) => Math.min(1, Math.max(0, v));
    el.style.setProperty("--rx", `${(clamp(px) - 0.5) * 12}deg`);
    el.style.setProperty("--ry", `${(0.5 - clamp(py)) * 12}deg`);
    el.style.setProperty("--mx", `${clamp(px) * 100}%`);
    el.style.setProperty("--my", `${clamp(py) * 100}%`);
  };

  const handlePointerLeave = () => {
    const el = tiltRef.current;
    if (!el) return;
    ["--rx", "--ry", "--mx", "--my"].forEach((v) => el.style.removeProperty(v));
  };

  const isError = status === "error";
  const pageClass = [
    "sl-page",
    status === "success" ? "sl-success" : "",
    isError ? "sl-error" : "",
    leaving ? `sl-leaving-${leaving}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={pageClass}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <ToastContainer />

      <div className="sl-aurora" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>

      <div className="sl-bubbles" aria-hidden="true">
        {BUBBLES.map((b, i) => (
          <span
            key={i}
            style={{
              "--x": b.x,
              "--s": b.s,
              "--d": b.d,
              "--delay": b.delay,
              "--drift": b.drift,
            }}
          />
        ))}
      </div>

      <div className="sl-card-wrap">
        <div className="sl-tilt" ref={tiltRef}>
          <div className="sl-card" role="status" aria-live="polite">
            <div className="sl-logo-wrap">
              <div className="sl-halo" />
              <div className="sl-halo" />
              <div className="sl-orbit sl-orbit-1" />
              <div className="sl-orbit sl-orbit-2" />
              <div className="sl-orbit sl-orbit-3" />
              <SirsLogo className="sl-logo" title="SIRS" />
              <div className="sl-check" aria-hidden="true">
                <svg viewBox="0 0 44 44">
                  <path d="M12 23 l7 7 l14 -15" />
                </svg>
              </div>
            </div>

            <h1 className="sl-title" aria-label={TITLE}>
              {TITLE.split("").map((ch, i) => (
                <span key={i} style={{ "--i": i }} aria-hidden="true">
                  {ch}
                </span>
              ))}
            </h1>
            <p className="sl-subtitle">Sistem Informasi Rumah Sakit</p>

            <p className="sl-status" key={status}>
              {isError ? errorText : STATUS[status].text}
            </p>

            {isError ? (
              <button
                type="button"
                className="sl-retry"
                onClick={() => keSSO(SSO_URL, 0)}
              >
                Masuk ulang via SSO Kemenkes
              </button>
            ) : (
              <div className="sl-progress" aria-hidden="true">
                <div
                  className="sl-progress-fill"
                  style={{ "--p": `${STATUS[status].progress}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SSO_Login;
