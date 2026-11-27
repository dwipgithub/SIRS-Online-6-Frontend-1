// Peran pengguna (sama dengan S-6.3-Backend/config/peran.js).
// Nilai berasal dari users_sso.jenis_user_id -> JWT field `jenisUserId`.
//
// Arti satKerId per peran:
//   KEMENKES         -> tidak dipakai untuk pembatasan wilayah
//   DINKES_PROVINSI  -> kode provinsi
//   DINKES_KABKOTA   -> kode kab/kota
//   RS               -> kode RS (kode faskes)
//
// Catatan: helper di sini hanya mengatur TAMPILAN. Pembatasan akses yang
// sebenarnya ada di backend (middleware/AksesRL.js).
export const PERAN = Object.freeze({
  KEMENKES: 1,
  DINKES_PROVINSI: 2,
  DINKES_KABKOTA: 3,
  RS: 4,
});

const NAMA_PERAN = {
  [PERAN.KEMENKES]: "Kemenkes",
  [PERAN.DINKES_PROVINSI]: "Dinkes Provinsi",
  [PERAN.DINKES_KABKOTA]: "Dinkes Kab/Kota",
  [PERAN.RS]: "Rumah Sakit",
};

export const peranDari = (user) => Number(user && user.jenisUserId);

export const namaPeran = (user) => NAMA_PERAN[peranDari(user)] || "";

export const isRS = (user) => peranDari(user) === PERAN.RS;

// Tambah / ubah / hapus data RL: hanya RS (data miliknya sendiri)
export const bisaInputData = (user) => isRS(user);

// Filter bisa memilih lebih dari satu RS (checklist)
export const bisaPilihBanyakRS = (user) =>
  [PERAN.KEMENKES, PERAN.DINKES_PROVINSI, PERAN.DINKES_KABKOTA].includes(
    peranDari(user)
  );

// Langkah filter wilayah yang ditampilkan
export const perluPilihProvinsi = (user) => peranDari(user) === PERAN.KEMENKES;
export const perluPilihKabKota = (user) =>
  [PERAN.KEMENKES, PERAN.DINKES_PROVINSI].includes(peranDari(user));
