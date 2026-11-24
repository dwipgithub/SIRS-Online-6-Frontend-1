import { useEffect } from "react";
import "./ToastTheme.css";

// Tema toast (react-toastify) sesuai tampilan kaca biru-cokelat.
// Sebagian besar toast di aplikasi dipanggil tanpa jenis: toast("pesan").
// Komponen ini menandai setiap toast yang muncul dengan kelas warna sesuai
// isi pesannya, sehingga 70+ file tidak perlu diubah satu per satu.
// Dipasang sekali di App.js.

const POLA = [
  // urutan penting: "gagal" dicek sebelum "berhasil"
  ["gl-toast-err", /gagal|error|tidak bisa|tidak dapat|tidak boleh|ditolak|melebihi|tidak aktif/i],
  ["gl-toast-warn", /harus|belum|silakan|tidak ditemukan|pilih/i],
  ["gl-toast-ok", /berhasil|sukses/i],
];

// Toast yang sudah diberi jenis oleh pemanggilnya mengikuti jenis itu
const JENIS = [
  ["Toastify__toast--error", "gl-toast-err"],
  ["Toastify__toast--warning", "gl-toast-warn"],
  ["Toastify__toast--success", "gl-toast-ok"],
];

const tandai = (toastEl) => {
  if (toastEl.dataset.glToast) return;
  const dariJenis = JENIS.find(([cls]) => toastEl.classList.contains(cls));
  const teks = toastEl.textContent || "";
  const dariTeks = POLA.find(([, pola]) => pola.test(teks));
  const kelas = (dariJenis && dariJenis[1]) || (dariTeks && dariTeks[0]) || "gl-toast-info";
  toastEl.classList.add("gl-toast", kelas);
  toastEl.dataset.glToast = "1";
};

const ToastTheme = () => {
  useEffect(() => {
    const periksa = (node) => {
      if (!(node instanceof Element)) return;
      if (node.matches(".Toastify__toast")) tandai(node);
      node.querySelectorAll(".Toastify__toast").forEach(tandai);
    };
    periksa(document.body);
    const observer = new MutationObserver((mutations) =>
      mutations.forEach((m) => m.addedNodes.forEach(periksa)),
    );
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  return null;
};

export default ToastTheme;
