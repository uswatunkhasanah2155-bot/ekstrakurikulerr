// src/pages/PendaftaranSaya.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { fotoUrl } from '../utils/fotoUrl';
import { Link } from 'react-router-dom';
import {
  ClipboardList,
  Clock,
  User,
  CalendarCheck,
  CalendarDays,
  AlertCircle,
  AlertTriangle,
  Loader2,
  ArrowRight,
  Compass,
  GraduationCap,
  Trophy,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { getDaftarEskul } from '../services/api';

const BACKEND_URL = 'http://localhost:5000';

// idx mengikuti Date.getDay(): Minggu = 0, Senin = 1, ... Sabtu = 6
const HARI = [
  { nama: 'Senin', idx: 1 },
  { nama: 'Selasa', idx: 2 },
  { nama: 'Rabu', idx: 3 },
  { nama: 'Kamis', idx: 4 },
  { nama: 'Jumat', idx: 5 },
  { nama: 'Sabtu', idx: 6 },
  { nama: 'Minggu', idx: 0 },
];

// Langkah mendaftar (ditampilkan saat siswa belum punya eskul)
const LANGKAH = [
  {
    judul: 'Pilih eskul',
    teks: 'Buka menu Ekstrakurikuler di atas, lalu pilih yang kamu suka.',
  },
  {
    judul: 'Baca detailnya',
    teks: 'Lihat jadwal, pembina, dan galeri kegiatannya.',
  },
  {
    judul: 'Tekan Daftar Eskul Ini',
    teks: 'Isi data singkat, lalu eskulnya muncul di halaman ini.',
  },
];

// Ubah nama eskul jadi slug URL, contoh: "Marching Band" -> "marching-band"
const toSlug = (nama = '') => nama.toLowerCase().trim().replace(/\s+/g, '-');

const buildImageUrl = (foto) => fotoUrl(foto);

const formatTanggal = (tanggal) => {
  if (!tanggal) return '-';
  const d = new Date(tanggal);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

// ------------------------------------------------------
// Membaca teks jadwal, contoh: "Senin & Kamis, 14:30 WIB"
// Hasil: daftar hari + jam mulai
// ------------------------------------------------------
const parseJadwal = (jadwal = '') => {
  const teks = String(jadwal).toLowerCase();
  const hari = HARI.filter((h) => teks.includes(h.nama.toLowerCase()));
  const match = teks.match(/(\d{1,2})[.:](\d{2})/);
  const jam = match ? { h: Number(match[1]), m: Number(match[2]) } : null;
  return { hari, jam };
};

const formatJam = (jam) =>
  jam
    ? `${String(jam.h).padStart(2, '0')}:${String(jam.m).padStart(2, '0')}`
    : '';

// ------------------------------------------------------
// Cari kegiatan terdekat dari sekarang
// ------------------------------------------------------
const hitungKegiatanTerdekat = (daftar) => {
  const sekarang = new Date();
  let terdekat = null;

  daftar.forEach((item) => {
    const eskul = item.ekstrakurikuler || {};
    const { hari, jam } = parseJadwal(eskul.jadwal);

    hari.forEach((h) => {
      const tanggal = new Date(sekarang);
      const selisih = (h.idx - sekarang.getDay() + 7) % 7;
      tanggal.setDate(sekarang.getDate() + selisih);
      tanggal.setHours(jam ? jam.h : 23, jam ? jam.m : 59, 0, 0);

      // Kalau jamnya sudah lewat hari ini, pindah ke minggu depan
      if (tanggal < sekarang) {
        tanggal.setDate(tanggal.getDate() + 7);
      }

      if (!terdekat || tanggal < terdekat.tanggal) {
        terdekat = {
          tanggal,
          hari: h.nama,
          jam,
          nama: eskul.nama_eskul || 'Ekstrakurikuler',
        };
      }
    });
  });

  return terdekat;
};

const labelSelisih = (tanggal) => {
  const awalHari = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const selisih = Math.round((awalHari(tanggal) - awalHari(new Date())) / 86400000);
  if (selisih === 0) return 'Hari ini';
  if (selisih === 1) return 'Besok';
  return `${selisih} hari lagi`;
};

// ------------------------------------------------------
// Susun jadwal mingguan: { Senin: [{nama, jam}], ... }
// ------------------------------------------------------
const susunJadwalMingguan = (daftar) => {
  const peta = {};
  HARI.forEach((h) => {
    peta[h.nama] = [];
  });

  daftar.forEach((item) => {
    const eskul = item.ekstrakurikuler || {};
    const { hari, jam } = parseJadwal(eskul.jadwal);

    hari.forEach((h) => {
      peta[h.nama].push({
        nama: eskul.nama_eskul || 'Ekstrakurikuler',
        jam: formatJam(jam),
      });
    });
  });

  Object.values(peta).forEach((list) => list.sort((a, b) => a.jam.localeCompare(b.jam)));
  return peta;
};

// Dua eskul di hari yang sama dengan jam yang sama = bentrok
const adaBentrok = (list) =>
  list.some(
    (a, i) => a.jam && list.some((b, j) => i !== j && b.jam === a.jam)
  );

export default function PendaftaranSaya() {
  const [daftar, setDaftar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saran, setSaran] = useState([]);

  const username = localStorage.getItem('username') || 'Siswa';

  useEffect(() => {
    async function fetchPendaftaran() {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        const response = await fetch(`${BACKEND_URL}/api/pendaftaran/saya`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Gagal memuat data pendaftaran.');
        }

        const list = data.data || data || [];
        setDaftar(list);

        // Belum daftar eskul apa pun -> siapkan saran eskul untuk dicoba
        if (list.length === 0) {
          const semuaEskul = await getDaftarEskul();
          setSaran((semuaEskul || []).slice(0, 3));
        }
      } catch (err) {
        console.error('Gagal memuat pendaftaran saya:', err);
        setError(err.message || 'Gagal memuat data pendaftaran dari server.');
      } finally {
        setLoading(false);
      }
    }

    fetchPendaftaran();
  }, []);

  // Data turunan (dihitung ulang hanya saat daftar berubah)
  const jadwalMingguan = useMemo(() => susunJadwalMingguan(daftar), [daftar]);
  const kegiatanTerdekat = useMemo(() => hitungKegiatanTerdekat(daftar), [daftar]);

  const hariAktif = HARI.filter((h) => jadwalMingguan[h.nama].length > 0);
  const jumlahHariLatihan = hariAktif.length;
  const adaJadwalBentrok = HARI.some((h) => adaBentrok(jadwalMingguan[h.nama]));

  // Kolom tabel mingguan: Senin-Sabtu selalu tampil, Minggu hanya jika ada kegiatan
  const kolomHari = HARI.filter(
    (h) => h.nama !== 'Minggu' || jadwalMingguan.Minggu.length > 0
  );
  const hariIni = HARI.find((h) => h.idx === new Date().getDay())?.nama;

  // Profil siswa diambil dari data pendaftaran
  const profil = daftar[0]?.siswa || null;
  const namaTampil = profil?.nama_siswa || username;
  const kelas = profil?.kelasData?.nama_kelas;
  const fotoProfil = buildImageUrl(profil?.foto);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 transition-colors duration-300">
      <Navbar />

      <main className="w-full px-4 sm:px-6 lg:px-10 py-8 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold text-sm mb-1">
            <ClipboardList className="w-5 h-5" />
            <span>Pendaftaran Saya</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Ekstrakurikuler yang Saya Daftar
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Pantau eskul yang kamu ikuti, jadwal latihan, dan kegiatan terdekatmu.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Memuat data pendaftaran...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-2xl p-4 flex items-center gap-3 text-red-700 dark:text-red-400">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* ==============================
                PROFIL + RINGKASAN
            ============================== */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Kartu profil */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
                <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 border-2 border-blue-100 dark:border-blue-900 bg-gradient-to-br from-blue-500 to-sky-400 flex items-center justify-center text-white text-2xl font-bold shadow-sm">
                  {fotoProfil ? (
                    <img
                      src={fotoProfil}
                      alt={namaTampil}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    namaTampil.charAt(0).toUpperCase()
                  )}
                </div>

                <div className="min-w-0 space-y-1">
                  <h2 className="font-bold text-lg text-gray-900 dark:text-white truncate capitalize">
                    {namaTampil}
                  </h2>
                  <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                    <GraduationCap className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>
                      {profil
                        ? kelas
                          ? `Kelas ${kelas}`
                          : 'Kelas belum diisi'
                        : 'Belum ada eskul yang diikuti'}
                    </span>
                  </div>
                  <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900">
                    Siswa
                  </span>
                </div>
              </div>

              {/* Kartu ringkasan (hanya jika sudah punya pendaftaran) */}
              {daftar.length > 0 && (
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
                      <Trophy className="w-4 h-4 text-blue-500" />
                      Eskul Diikuti
                    </div>
                    <p className="text-3xl font-extrabold text-gray-900 dark:text-white">
                      {daftar.length}
                    </p>
                  </div>

                  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
                      <CalendarDays className="w-4 h-4 text-blue-500" />
                      Hari Latihan
                    </div>
                    <p className="text-3xl font-extrabold text-gray-900 dark:text-white">
                      {jumlahHariLatihan}
                      <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 ml-1">
                        hari / minggu
                      </span>
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-600 to-sky-500 text-white rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-semibold text-blue-100 mb-2">
                      <Clock className="w-4 h-4" />
                      Kegiatan Terdekat
                    </div>
                    {kegiatanTerdekat ? (
                      <>
                        <p className="text-lg font-extrabold leading-tight">
                          {kegiatanTerdekat.nama}
                        </p>
                        <p className="text-xs text-blue-100 mt-1">
                          {labelSelisih(kegiatanTerdekat.tanggal)} · {kegiatanTerdekat.hari}
                          {kegiatanTerdekat.jam
                            ? `, ${formatJam(kegiatanTerdekat.jam)} WIB`
                            : ''}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-blue-100">Jadwal belum terbaca</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {daftar.length > 0 ? (
              <>
                {/* ==============================
                    JADWAL MINGGUAN
                ============================== */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <CalendarDays className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h2 className="font-bold text-lg text-gray-900 dark:text-white">
                      Jadwal Mingguan Saya
                    </h2>
                  </div>

                  {adaJadwalBentrok && (
                    <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
                      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>
                        Ada eskul yang jadwalnya di hari dan jam yang sama. Cek kembali
                        jadwalmu supaya tidak bentrok.
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {kolomHari.map((h) => {
                      const list = jadwalMingguan[h.nama];
                      const bentrok = adaBentrok(list);
                      const isHariIni = h.nama === hariIni;

                      return (
                        <div
                          key={h.nama}
                          className={`rounded-xl border p-3 min-h-[110px] ${
                            isHariIni
                              ? 'border-blue-400 dark:border-blue-500 bg-blue-50/60 dark:bg-blue-950/30'
                              : 'border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/30'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span
                              className={`text-sm font-bold ${
                                isHariIni
                                  ? 'text-blue-700 dark:text-blue-300'
                                  : 'text-gray-700 dark:text-gray-200'
                              }`}
                            >
                              {h.nama}
                            </span>
                            {isHariIni && (
                              <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-blue-600 text-white">
                                Hari ini
                              </span>
                            )}
                          </div>

                          {list.length === 0 ? (
                            <p className="text-xs text-gray-400 dark:text-gray-500">Tidak ada kegiatan</p>
                          ) : (
                            <div className="space-y-1.5">
                              {list.map((k, i) => (
                                <div
                                  key={`${k.nama}-${i}`}
                                  className={`rounded-lg px-2.5 py-1.5 text-xs ${
                                    bentrok
                                      ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
                                      : 'bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300'
                                  }`}
                                >
                                  <p className="font-semibold">{k.nama}</p>
                                  {k.jam && <p className="opacity-80">{k.jam} WIB</p>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ==============================
                    DAFTAR ESKUL YANG DIIKUTI
                ============================== */}
                <div className="space-y-4">
                  <h2 className="font-bold text-lg text-gray-900 dark:text-white">
                    Eskul yang Saya Ikuti
                  </h2>

                  {daftar.map((item) => {
                    const eskul = item.ekstrakurikuler || item.eskul || {};
                    const imageSrc = buildImageUrl(eskul.foto);
                    const status = item.status;

                    return (
                      <div
                        key={item.id_pendaftaran || item.id || `${eskul.id_eskul}-${item.tanggal}`}
                        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                      >
                        {/* Kiri: logo, nama, deskripsi */}
                        <div className="flex items-start gap-4 w-full md:w-auto flex-1">
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-800/50 shrink-0 border border-gray-100 dark:border-gray-800 flex items-center justify-center p-2 shadow-sm">
                            {imageSrc ? (
                              <img
                                src={imageSrc}
                                alt={eskul.nama_eskul}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className="text-xs text-gray-400">No Image</div>
                            )}
                          </div>

                          <div className="space-y-1.5 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white">
                                {eskul.nama_eskul || 'Ekstrakurikuler'}
                              </h3>
                              {status && (
                                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40 capitalize">
                                  {status}
                                </span>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                              {eskul.deskripsi || 'Tidak ada deskripsi tersedia.'}
                            </p>
                          </div>
                        </div>

                        {/* Tengah: jadwal, pembina, tanggal daftar */}
                        <div className="w-full md:w-auto md:min-w-[280px] border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-800 pt-3 md:pt-0 md:px-6 space-y-1.5 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-500 shrink-0" />
                            <span className="font-medium text-gray-700 dark:text-gray-200">
                              {eskul.jadwal || 'Belum ada jadwal'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400 shrink-0" />
                            <span>Pembina: {eskul.pembina || '-'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CalendarCheck className="w-4 h-4 text-gray-400 shrink-0" />
                            <span>Terdaftar: {formatTanggal(item.tanggal)}</span>
                          </div>
                        </div>

                        {/* Kanan: tombol ke halaman detail */}
                        {eskul.nama_eskul && (
                          <div className="w-full md:w-auto flex justify-end">
                            <Link
                              to={`/eskul/${toSlug(eskul.nama_eskul)}`}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 transition-all"
                            >
                              Buka Eskul
                              <ArrowRight className="w-4 h-4" />
                            </Link>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                {/* Ajakan mendaftar */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl px-6 py-10 text-center flex flex-col items-center gap-3 shadow-sm">
                  <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
                    <Compass className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Kamu belum punya eskul
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                    Yuk, mulai dari yang paling menarik buatmu. Pilih satu eskul, lihat detailnya, lalu daftar.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                    <Link
                      to="/siswa/dashboard"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 transition-all"
                    >
                      Jelajahi eskul
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      to="/jadwal"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                    >
                      Lihat jadwal
                    </Link>
                  </div>
                </div>

                {/* Cara mendaftar */}
                <div className="space-y-3">
                  <h2 className="font-bold text-lg text-gray-900 dark:text-white">
                    Cara mendaftar
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {LANGKAH.map((langkah, i) => (
                      <div
                        key={langkah.judul}
                        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm"
                      >
                        <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 flex items-center justify-center text-sm font-bold mb-2">
                          {i + 1}
                        </div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {langkah.judul}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                          {langkah.teks}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Saran eskul */}
                {saran.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="font-bold text-lg text-gray-900 dark:text-white">
                      Eskul yang bisa kamu coba
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {saran.map((eskul) => {
                        const imageSrc = buildImageUrl(eskul.foto);

                        return (
                          <div
                            key={eskul.id_eskul}
                            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all"
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 flex items-center justify-center p-1 shrink-0">
                                {imageSrc ? (
                                  <img
                                    src={imageSrc}
                                    alt={eskul.nama_eskul}
                                    className="w-full h-full object-contain"
                                  />
                                ) : (
                                  <span className="text-xs text-gray-400">Logo</span>
                                )}
                              </div>
                              <h3 className="font-bold text-gray-900 dark:text-white">
                                {eskul.nama_eskul}
                              </h3>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-3">
                              <Clock className="w-4 h-4 text-blue-500 shrink-0" />
                              <span>{eskul.jadwal || 'Belum ada jadwal'}</span>
                            </div>

                            <Link
                              to={`/eskul/${toSlug(eskul.nama_eskul)}`}
                              className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              Lihat eskul
                              <ArrowRight className="w-4 h-4" />
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}