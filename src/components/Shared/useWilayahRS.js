import { useEffect, useMemo, useState } from "react";
import { PERAN, peranDari, perluPilihProvinsi } from "../../utils/peran";

// State pilihan wilayah & rumah sakit untuk filter RL (Kemenkes, Dinkes
// Provinsi, Dinkes Kab/Kota). Dipakai oleh FilterRLModal + PilihRumahSakit.
// State disimpan di hook (komponen yang selalu terpasang), bukan di isi
// modal, agar pilihan tidak hilang saat modal ditutup lalu dibuka lagi.
const useWilayahRS = ({ user, api, token, aktif }) => {
  const peran = peranDari(user);
  const [daftarProvinsi, setDaftarProvinsi] = useState([]);
  const [daftarKabKota, setDaftarKabKota] = useState([]);
  const [daftarRS, setDaftarRS] = useState([]);
  const [provinsiId, setProvinsiId] = useState("");
  const [kabKotaId, setKabKotaId] = useState("");
  const [rsDipilih, setRsDipilih] = useState([]); // [{ id, nama }]
  const [memuat, setMemuat] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  const muatKabKota = (idProvinsi) => {
    setDaftarKabKota([]);
    if (!idProvinsi) return;
    api
      .get("/apisirs6v2/kabkota", { headers, params: { provinsiId: idProvinsi } })
      .then((r) => setDaftarKabKota(r.data.data || []))
      .catch(() => setDaftarKabKota([]));
  };

  const muatRS = (params) => {
    setDaftarRS([]);
    if (!params.provinsiId && !params.kabKotaId) return;
    setMemuat(true);
    api
      .get("/apisirs6v2/rumahsakit", { headers, params })
      .then((r) =>
        setDaftarRS(
          (r.data.data || [])
            .map((rs) => ({ ...rs, id: String(rs.id) }))
            .sort((a, b) => String(a.nama).localeCompare(String(b.nama)))
        )
      )
      .catch(() => setDaftarRS([]))
      .finally(() => setMemuat(false));
  };

  // Daftar awal sesuai peran (sekali, setelah token tersedia)
  useEffect(() => {
    if (!aktif || !token) return;
    if (perluPilihProvinsi(user)) {
      api
        .get("/apisirs6v2/provinsi", { headers })
        .then((r) => setDaftarProvinsi(r.data.data || []))
        .catch(() => setDaftarProvinsi([]));
    } else if (peran === PERAN.DINKES_PROVINSI) {
      muatKabKota(user.satKerId);
      muatRS({ provinsiId: user.satKerId });
    } else if (peran === PERAN.DINKES_KABKOTA) {
      muatRS({ kabKotaId: user.satKerId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aktif, token, peran]);

  const provinsiEfektif =
    peran === PERAN.DINKES_PROVINSI ? String(user.satKerId) : provinsiId;

  const gantiProvinsi = (id) => {
    setProvinsiId(id);
    setKabKotaId("");
    setRsDipilih([]);
    muatKabKota(id);
    muatRS({ provinsiId: id });
  };

  const gantiKabKota = (id) => {
    setKabKotaId(id);
    setRsDipilih([]);
    muatRS(id ? { kabKotaId: id } : { provinsiId: provinsiEfektif });
  };

  const reset = () => {
    if (perluPilihProvinsi(user)) {
      setProvinsiId("");
      setKabKotaId("");
      setDaftarKabKota([]);
      setDaftarRS([]);
    } else if (kabKotaId) {
      gantiKabKota("");
    }
    setRsDipilih([]);
  };

  const idTerpilih = useMemo(
    () => new Set(rsDipilih.map((rs) => String(rs.id))),
    [rsDipilih]
  );

  const toggleRS = (rs) => {
    const id = String(rs.id);
    setRsDipilih((cur) =>
      cur.some((v) => v.id === id)
        ? cur.filter((v) => v.id !== id)
        : [...cur, { id, nama: rs.nama }]
    );
  };

  const hapusRS = (id) =>
    setRsDipilih((cur) => cur.filter((v) => v.id !== String(id)));

  // Semua RS di wilayah terpilih -> kirim sebagai "semuaWilayah" ke backend
  const semuaTerpilih =
    daftarRS.length > 0 && rsDipilih.length === daftarRS.length;

  const namaProvinsi =
    (daftarProvinsi.find((p) => String(p.id) === String(provinsiId)) || {}).nama;
  const namaKabKota =
    (daftarKabKota.find((k) => String(k.id) === String(kabKotaId)) || {}).nama;

  const namaWilayah =
    namaKabKota ||
    namaProvinsi ||
    (peran === PERAN.DINKES_KABKOTA ? "kab/kota Anda" : "provinsi Anda");

  // Parameter wilayah untuk backend bila semua RS dipilih
  const paramSemuaWilayah = () => {
    const p = { semuaWilayah: "1" };
    if (peran === PERAN.DINKES_KABKOTA) p.kabKotaId = String(user.satKerId);
    else {
      if (provinsiEfektif) p.provinsiId = String(provinsiEfektif);
      if (kabKotaId) p.kabKotaId = String(kabKotaId);
    }
    return p;
  };

  return {
    peran,
    daftarProvinsi,
    daftarKabKota,
    daftarRS,
    provinsiId,
    kabKotaId,
    rsDipilih,
    setRsDipilih,
    idTerpilih,
    memuat,
    gantiProvinsi,
    gantiKabKota,
    toggleRS,
    hapusRS,
    reset,
    semuaTerpilih,
    namaWilayah,
    paramSemuaWilayah,
  };
};

export default useWilayahRS;
