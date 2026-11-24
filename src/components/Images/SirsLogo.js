import React, { useId } from "react";

// Logo SIRS Online: garis detak jantung di kotak membulat bergradien
// biru -> biru tua -> cokelat (warna tema). SVG agar tajam di semua ukuran.
// Versi file statis yang sama ada di public/favicon.svg.
const SirsLogo = ({ size = 40, className = "", title = "SIRS Online" }) => {
  // id gradien unik per logo: logo bisa tampil lebih dari sekali dalam satu
  // halaman (sidebar & topbar), id yang sama akan saling bentrok
  const uid = useId().replace(/:/g, "");
  const bg = `sirs-bg-${uid}`;
  const shine = `sirs-shine-${uid}`;
  const gold = `sirs-gold-${uid}`;

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label={title}
    >
      <defs>
        <linearGradient id={bg} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2a74c4" />
          <stop offset="0.55" stopColor="#0d2c54" />
          <stop offset="1" stopColor="#8b5a2b" />
        </linearGradient>
        <linearGradient id={shine} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.38" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        {/* userSpaceOnUse: gradien pada garis datar (tinggi 0) tidak tampil
            bila memakai ukuran objek (objectBoundingBox) */}
        <linearGradient
          id={gold}
          gradientUnits="userSpaceOnUse"
          x1="42"
          y1="34"
          x2="58"
          y2="34"
        >
          <stop offset="0" stopColor="#f6d39b" />
          <stop offset="1" stopColor="#d9a066" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="16" fill={`url(#${bg})`} />
      <rect x="2" y="2" width="60" height="60" rx="16" fill={`url(#${shine})`} />
      {/* garis detak jantung */}
      <path
        d="M9 34h11l4-9 7 20 6-27 5 16"
        fill="none"
        stroke="#fff"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* ujung garis berwarna emas */}
      <path
        d="M42 34h13"
        fill="none"
        stroke={`url(#${gold})`}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="55" cy="34" r="3.6" fill={`url(#${gold})`} />
    </svg>
  );
};

export default SirsLogo;
