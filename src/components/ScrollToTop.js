import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

// Di SPA, pindah halaman lewat React Router tidak me-reset posisi scroll.
// Akibatnya setelah klik Simpan di bagian bawah form tambah/ubah, halaman
// RL tujuan ikut terbuka dalam posisi ter-scroll ke bawah (kartu "naik").
// Komponen ini mengembalikan scroll ke atas setiap kali alamat berubah.
// Pakai useLayoutEffect agar scroll di-reset sebelum halaman baru tampil.
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
