import { useEffect, useRef } from "react";
import { useLocation, useNavigate, useNavigationType } from "react-router-dom";

// Aplikasi memakai MemoryRouter: alamat halaman disimpan di memori, sehingga
// address bar selalu menampilkan alamat dasar (mis. https://.../v3/).
// Berkas ini menangani tiga hal yang tidak lagi otomatis didapat dari URL:
//   1. Rute awal saat aplikasi dibuka (link langsung & kembalian dari SSO)
//   2. Tetap di halaman yang sama setelah refresh (F5)
//   3. Tombol Back/Forward browser berpindah antar halaman aplikasi

const BASE = process.env.PUBLIC_URL || ""; // "/v3" (dari "homepage" package.json)
const KUNCI_RUTE = "sirs-rute-terakhir";
// Rute yang tidak perlu dipulihkan saat refresh (alur login)
const RUTE_LOGIN = ["/", "/verif", "/login"];

const bacaSesi = () => {
  try {
    return sessionStorage.getItem(KUNCI_RUTE);
  } catch (e) {
    return null;
  }
};

const tulisSesi = (nilai) => {
  try {
    sessionStorage.setItem(KUNCI_RUTE, nilai);
  } catch (e) {
    // penyimpanan tidak tersedia (mode privat): abaikan
  }
};

// Dipanggil sekali sebelum router dibuat.
// - URL berisi halaman tertentu (mis. /v3/rl32 dari link/bookmark lama) atau
//   membawa ?token= dari SSO -> buka rute itu.
// - Selain itu (refresh di alamat dasar) -> pulihkan rute terakhir di tab ini.
// Setelah itu address bar dikembalikan ke alamat dasar. Query (?token=)
// dibiarkan karena dibaca Sso_Login.js, yang lalu menghapusnya sendiri.
export const hitungRuteAwal = () => {
  const { pathname, search, hash } = window.location;
  let path = pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname;
  if (!path.startsWith("/")) path = "/" + path;
  if (path.length > 1) path = path.replace(/\/+$/, "");

  const dariUrl = path !== "/" || /[?&]token=/.test(search);
  const tersimpan = bacaSesi();
  const rute = dariUrl ? path + search : tersimpan || "/";

  // posisi riwayat direset ke 0 (lihat TombolKembaliBrowser)
  window.history.replaceState({ sirs: 0 }, "", `${BASE}/${search}${hash}`);
  return rute;
};

// Simpan rute aktif agar bisa dipulihkan setelah refresh
export const SimpanRute = () => {
  const { pathname, search } = useLocation();
  useEffect(() => {
    if (!RUTE_LOGIN.includes(pathname)) tulisSesi(pathname + search);
  }, [pathname, search]);
  return null;
};

// Tombol Back/Forward browser.
// MemoryRouter tidak menulis riwayat browser, jadi tanpa ini tombol Back
// langsung keluar dari aplikasi. Setiap perpindahan halaman ditandai satu
// entri riwayat bernomor (alamatnya tetap alamat dasar); saat Back/Forward
// ditekan, aplikasi berpindah sebanyak selisih nomornya. Di halaman pertama,
// Back keluar dari aplikasi seperti biasa.
export const TombolKembaliBrowser = () => {
  const location = useLocation();
  const navType = useNavigationType();
  const navigate = useNavigate();
  // posisi halaman aktif dalam riwayat aplikasi (0 = halaman pertama)
  const posisi = useRef(0);

  // Perpindahan halaman baru -> tambah satu entri riwayat browser
  // (POP berasal dari tombol Back/Forward, REPLACE tidak menambah riwayat)
  useEffect(() => {
    if (navType === "PUSH") {
      posisi.current += 1;
      window.history.pushState({ sirs: posisi.current }, "", window.location.href);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  useEffect(() => {
    const onPopState = (e) => {
      const tujuan = (e.state && e.state.sirs) || 0;
      const selisih = tujuan - posisi.current; // negatif = Back, positif = Forward
      if (selisih !== 0) {
        posisi.current = tujuan;
        navigate(selisih);
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [navigate]);

  return null;
};
