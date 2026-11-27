import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./GlassTheme.css";

// ---------- Angka di tabel rata kanan ----------
// Banyak tabel menampilkan angka lewat <input type="text"> atau teks biasa
// di <td>, sehingga tidak bisa dikenali lewat CSS saja. Sel/input yang
// isinya angka diberi class "gl-num" (lihat GlassTheme.css).

// Angka: 12 | -3 | 1.250 | 3,5 | 1.250,75 | 85% | 85 %
const NUMERIC = /^-?\d[\d.,]*\s?%?$/;

const isNumeric = (text) => NUMERIC.test(String(text).trim());

const TEXT_INPUT = 'input:not([type]), input[type="text"]';

// Label baris total: "Total" | "TOTAL" | "TOTAL :" (boleh dibungkus <strong>)
const TOTAL_LABEL = /^total\s*:?$/i;

// Apakah tabel berisi kotak input? (di-cache per tabel selama satu putaran)
let cacheTabel = new WeakMap();
const tabelPunyaInput = (table) => {
  if (!table) return false;
  if (!cacheTabel.has(table)) {
    cacheTabel.set(table, !!table.querySelector("td .form-control"));
  }
  return cacheTabel.get(table);
};

// Tandai satu sel tabel
const tandaiSel = (td) => {
  const inputs = td.querySelectorAll("input, select, textarea, button");
  if (inputs.length === 0) {
    td.classList.toggle("gl-num", isNumeric(td.textContent));
    // Label "Total" rata kiri & tebal (lihat GlassTheme.css)
    td.classList.toggle("gl-total", TOTAL_LABEL.test(td.textContent.trim()));
    // Sel teks di tabel yang berisi kotak input (mis. baris Total) diberi
    // jarak dalam setara kotak input agar isinya sejajar dengan baris lain
    td.classList.toggle("gl-pad", tabelPunyaInput(td.closest("table")));
    return;
  }
  td.classList.remove("gl-pad", "gl-total");
  // Sel berisi input teks: nilai input yang menentukan
  td.querySelectorAll(TEXT_INPUT).forEach(tandaiInput);
};

const tandaiInput = (input) => {
  input.classList.toggle("gl-num", isNumeric(input.value));
};

// Tandai semua sel di dalam sebuah node (node itu sendiri bisa berupa sel)
const tandaiDi = (node) => {
  if (!(node instanceof Element)) return;
  if (node.matches("td")) tandaiSel(node);
  node.querySelectorAll("td").forEach(tandaiSel);
};

// ---------- Kolom 1-3 berwarna cokelat (seperti tabel RL 3.2) ----------
// Posisi kolom dihitung dengan memperhitungkan colSpan, agar sel gabungan
// (mis. "TOTAL" dengan colSpan={3}) tidak menggeser penanda kolom berikutnya.
const JUMLAH_KOLOM_AWAL = 3;
// Halaman ubah (/rlxx/ubah/:id, /rlxx/edit/:id) tidak punya kolom Aksi/
// checklist, sehingga kolom ke-3 sudah berisi data: cukup 2 kolom cokelat.
const JUMLAH_KOLOM_AWAL_UBAH = 2;
const HALAMAN_UBAH = /\/(ubah|edit)\/[^/]+\/?$/i;

// Rute aktif diisi oleh <GlassTheme /> dari React Router. Aplikasi memakai
// MemoryRouter, jadi window.location.pathname selalu alamat dasar.
let ruteAktif = "";

// Dibaca setiap kali menandai, karena komponen ini bisa tetap terpasang
// saat berpindah halaman
const jumlahKolomAwal = () =>
  HALAMAN_UBAH.test(ruteAktif)
    ? JUMLAH_KOLOM_AWAL_UBAH
    : JUMLAH_KOLOM_AWAL;

// Tabel bisa menentukan sendiri jumlah kolom cokelat lewat atribut
// <table data-kolom-cokelat="1">, mis. tabel tanpa kolom No.
const tandaiKolomAwal = (table) => {
  const khusus = Number(table.dataset.kolomCokelat);
  const batas = Number.isFinite(khusus) && khusus >= 0 && table.dataset.kolomCokelat !== undefined
    ? khusus
    : jumlahKolomAwal();
  Array.from(table.tBodies).forEach((tbody) => {
    Array.from(tbody.rows).forEach((tr) => {
      // Baris kelompok (group-row / subgroup-row) tetap utuh berwarna
      // hijaunya sendiri, tidak dibelah warna cokelat
      const barisKelompok = /group-row/.test(tr.className);
      let kolom = 0;
      Array.from(tr.cells).forEach((cell) => {
        cell.classList.toggle("gl-lead", !barisKelompok && kolom < batas);
        kolom += cell.colSpan || 1;
      });
    });
  });
};

// Proses sekumpulan node. Perubahan di dalam tabel memproses ulang seluruh
// tabelnya, karena baris baru (berisi input) memengaruhi jarak sel lain.
const proses = (nodes) => {
  cacheTabel = new WeakMap();
  const target = new Set();
  nodes.forEach((n) => {
    if (!(n instanceof Element)) return;
    target.add(n.closest("table") || n);
  });
  target.forEach((node) => {
    tandaiDi(node);
    if (node.matches("table")) tandaiKolomAwal(node);
    else node.querySelectorAll("table").forEach(tandaiKolomAwal);
  });
};

const useAngkaRataKanan = () => {
  useEffect(() => {
    const root = document.getElementById("root") || document.body;
    proses([root]);

    // Kumpulkan sel yang berubah, lalu proses sekali per frame
    const antrean = new Set();
    let frame = null;
    const jadwalkan = (el) => {
      if (!el) return;
      antrean.add(el);
      if (frame === null) {
        frame = requestAnimationFrame(() => {
          frame = null;
          proses(antrean);
          antrean.clear();
        });
      }
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        const target =
          m.target.nodeType === Node.TEXT_NODE ? m.target.parentElement : m.target;
        // Baris/sel/tabel baru ditambahkan
        m.addedNodes.forEach((n) => {
          if (n instanceof Element) jadwalkan(n);
          else if (n.parentElement) jadwalkan(n.parentElement.closest("td"));
        });
        // Teks di dalam sel berubah
        if (target) jadwalkan(target.closest("td"));
      });
    });
    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    // Nilai input berubah karena diketik user
    const onInput = (e) => {
      if (e.target.matches && e.target.matches(`td ${TEXT_INPUT}`)) {
        tandaiInput(e.target);
      }
    };
    document.addEventListener("input", onInput, true);

    return () => {
      observer.disconnect();
      document.removeEventListener("input", onInput, true);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);
};

// Mengaktifkan tema kaca (glassmorphism) selama halaman ini terbuka.
// Class dipasang di <body> agar modal & dialog (yang dirender di luar
// halaman lewat portal) ikut bergaya kaca.
const useGlassTheme = () => {
  useEffect(() => {
    document.body.classList.add("glass-theme");
    return () => document.body.classList.remove("glass-theme");
  }, []);
  useAngkaRataKanan();
};

// Komponen penanda untuk dipasang di route (App.js):
// <Route element={<><NavigationBar /><RL31 /><GlassTheme /></>} />
export const GlassTheme = () => {
  // diisi saat render, sebelum tabel halaman baru ditandai
  ruteAktif = useLocation().pathname;
  useGlassTheme();
  return null;
};

export default useGlassTheme;
