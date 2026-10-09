// src/pages/DashboardPembina.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Users, BookOpen, UserPlus, TrendingUp, ArrowRight, X } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import * as api from '../services/api';

// getRiwayatPendaftarEskul = semua pendaftaran termasuk yang sudah dihapus
const { getDaftarEskul, getRiwayatPendaftarEskul } = api;

// ===============================
// HELPER
// ===============================
const toArray = (res) => {
  const data = res?.data ?? res;
  return Array.isArray(data) ? data : [];
};

const HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const WARNA_GARIS = '#3b82f6';

const formatTanggal = (d) =>
  d ? `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}` : '-';

const formatTanggalPanjang = (d) =>
  d.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const formatJam = (d) =>
  d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const keyTanggal = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const normalStatus = (s) => {
  const v = String(s ?? '').toLowerCase();
  if (v.includes('tunggu') || v.includes('pending')) return 'menunggu';
  if (v.includes('tolak') || v.includes('reject')) return 'ditolak';
  return 'diterima'; // status kosong dianggap sudah diterima
};

const normalGender = (g) => {
  const v = String(g ?? '').toLowerCase();
  if (v === 'p' || v.startsWith('perempuan') || v.startsWith('wanita')) return 'P';
  return 'L';
};

// Ubah data mentah dari API menjadi bentuk seragam
const normalisasi = (item) => {
  const siswa = item.siswa || {};
  const tgl = new Date(
    item.tanggal_daftar ?? item.created_at ?? item.createdAt ?? item.tanggal ?? Date.now()
  );

  return {
    id: item.id_pendaftaran ?? item.id,
    idSiswa: siswa.id_siswa ?? item.id_siswa,
    nama: siswa.nama ?? siswa.nama_siswa ?? item.nama ?? item.nama_siswa ?? 'Tanpa nama',
    kelas:
      siswa.kelasData?.nama_kelas ??
      siswa.kelas?.nama_kelas ??
      item.kelas?.nama_kelas ??
      (typeof siswa.kelas === 'string' ? siswa.kelas : null) ??
      (typeof item.kelas === 'string' ? item.kelas : null) ??
      '-',
    gender: normalGender(siswa.jenis_kelamin ?? item.jenis_kelamin ?? item.jenisKelamin),
    tanggal: isNaN(tgl) ? new Date() : tgl,
    status: normalStatus(item.status ?? item.status_pendaftaran),
    dihapus: Boolean(item.dihapus_pada), // penanda soft delete
  };
};

const cardClass =
  'rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900';

// Pilihan rentang waktu grafik (tombol, sama seperti halaman admin)
const OPSI_RENTANG = [
  { label: 'Hari Ini', value: 1 },
  { label: '1 Minggu', value: 7 },
  { label: '1 Bulan', value: 30 },
];

// Tabel pendaftar (dipakai oleh "Pendaftaran Terbaru" dan daftar siswa hari yang diklik)
// HP: ukuran lebih kecil supaya semua kolom muat. Laptop (md ke atas): ukuran normal.
function TabelPendaftar({ data, tampilkanJam = false, kosong }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-[11px] md:text-sm">
        <thead>
          <tr className="bg-gray-50 text-[9px] uppercase text-gray-500 dark:bg-gray-800/50 dark:text-gray-400 md:text-xs">
            <th className="px-2 py-2 md:px-5 md:py-3">No</th>
            <th className="px-2 py-2 md:px-5 md:py-3">Nama Siswa</th>
            <th className="px-2 py-2 md:px-5 md:py-3">Kelas</th>
            <th className="px-2 py-2 md:px-5 md:py-3">Jenis Kelamin</th>
            <th className="px-2 py-2 md:px-5 md:py-3">Tanggal Daftar</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                className="px-5 py-8 text-center text-gray-400 dark:text-gray-500"
              >
                {kosong}
              </td>
            </tr>
          ) : (
            data.map((p, i) => (
              <tr
                key={p.id ?? i}
                className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/40"
              >
                <td className="px-2 py-2 text-gray-500 dark:text-gray-400 md:px-5 md:py-3">
                  {i + 1}
                </td>

                <td className="px-2 py-2 md:px-5 md:py-3">
                  <div className="flex items-center gap-1.5 md:gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-[10px] font-bold text-blue-600 dark:text-blue-400 md:h-8 md:w-8 md:text-xs">
                      {p.nama.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium">{p.nama}</span>
                    {p.dihapus && (
                      <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[8px] font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-300 md:px-2 md:text-[10px]">
                        Dihapus
                      </span>
                    )}
                  </div>
                </td>

                <td className="px-2 py-2 text-gray-600 dark:text-gray-300 md:px-5 md:py-3">
                  {p.kelas}
                </td>

                <td className="px-2 py-2 text-gray-600 dark:text-gray-300 md:px-5 md:py-3">
                  {p.gender === 'P' ? 'Perempuan' : 'Laki-laki'}
                </td>

                <td className="px-2 py-2 text-gray-600 dark:text-gray-300 md:px-5 md:py-3">
                  {formatTanggal(p.tanggal)}
                  {tampilkanJam && `, ${formatJam(p.tanggal)}`}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ===============================
// KOMPONEN
// ===============================
export default function DashboardPembina() {
  const navigate = useNavigate();

  const [eskul, setEskul] = useState(null);
  const [pendaftar, setPendaftar] = useState([]); // SEMUA data (termasuk yang dihapus)
  const [rentang, setRentang] = useState(7);
  const [hariDipilih, setHariDipilih] = useState(null); // titik grafik yang diklik
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ===============================
  // AMBIL DATA
  // ===============================
  useEffect(() => {
    let cancelled = false;
    const idEskul = localStorage.getItem('id_eskul');

    async function fetchData() {
      try {
        const [eskulRes, pendaftarRes] = await Promise.all([
          getDaftarEskul(),
          getRiwayatPendaftarEskul(),
        ]);

        const eskulSaya = toArray(eskulRes).find(
          (e) => String(e.id_eskul) === String(idEskul)
        );

        const dataSaya = toArray(pendaftarRes)
          .filter(
            (p) => String(p.id_eskul ?? p.ekstrakurikuler?.id_eskul) === String(idEskul)
          )
          .map(normalisasi);

        if (cancelled) return;
        setEskul(eskulSaya || null);
        setPendaftar(dataSaya);
      } catch (err) {
        console.error('Gagal mengambil data dashboard pembina:', err);
        if (!cancelled) setError('Gagal memuat data dashboard. Silakan coba lagi.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  // ===============================
  // DATA TURUNAN
  // ===============================
  const slugEskul = (eskul?.nama_eskul || '').trim().toLowerCase().replace(/\s+/g, '-');

  // Sama dengan label di Sidebar: "Pembina Paskibra"
  const namaSapaan = eskul?.nama_eskul ? `Pembina ${eskul.nama_eskul}` : 'Pembina';

  // Hanya siswa yang masih aktif -> untuk kartu, donut, dan tabel.
  // Grafik riwayat TIDAK memakai ini, jadi tidak ikut berkurang saat siswa dihapus.
  const pendaftarAktif = useMemo(
    () => pendaftar.filter((p) => !p.dihapus),
    [pendaftar]
  );

  const siswaTerdaftar = useMemo(() => {
    const ids = new Set(
      pendaftarAktif.filter((p) => p.status === 'diterima').map((p) => p.idSiswa ?? p.id)
    );
    return ids.size;
  }, [pendaftarAktif]);

  const pendaftarBulanIni = useMemo(() => {
    const now = new Date();
    return pendaftarAktif.filter(
      (p) =>
        p.tanggal.getMonth() === now.getMonth() &&
        p.tanggal.getFullYear() === now.getFullYear()
    ).length;
  }, [pendaftarAktif]);

  // Siswa yang sudah diterima (unik per siswa), dihitung per jenis kelamin
  const siswaDiterima = useMemo(() => {
    const unik = new Map();
    pendaftarAktif
      .filter((p) => p.status === 'diterima')
      .forEach((p) => unik.set(p.idSiswa ?? p.id, p));
    return [...unik.values()];
  }, [pendaftarAktif]);

  const jumlahL = siswaDiterima.filter((p) => p.gender === 'L').length;
  const jumlahP = siswaDiterima.filter((p) => p.gender === 'P').length;
  const totalSiswa = siswaDiterima.length;
  const persen = (n) => (totalSiswa ? Math.round((n / totalSiswa) * 100) : 0);

  const donutData =
    totalSiswa === 0
      ? [{ name: 'Kosong', value: 1, color: '#374151' }]
      : [
          { name: 'Laki-laki', value: jumlahL, color: '#3b82f6' },
          { name: 'Perempuan', value: jumlahP, color: '#ec4899' },
        ];

  // GRAFIK RIWAYAT: memakai SEMUA data (termasuk siswa yang sudah dihapus)
  const grafikData = useMemo(() => {
    const hariIni = startOfDay(new Date());

    // Hari Ini: dipecah per jam
    if (rentang === 1) {
      const keyHariIni = keyTanggal(hariIni);
      return Array.from({ length: 24 }, (_, h) => {
        const jam = String(h).padStart(2, '0');
        return {
          key: keyHariIni,
          jam: h,
          label: `${jam}:00`,
          tanggalLengkap: `${formatTanggalPanjang(hariIni)}, pukul ${jam}:00`,
          jumlah: pendaftar.filter(
            (p) =>
              startOfDay(p.tanggal).getTime() === hariIni.getTime() &&
              p.tanggal.getHours() === h
          ).length,
        };
      });
    }

    // 1 Minggu / 1 Bulan: per hari
    const hasil = [];
    for (let i = rentang - 1; i >= 0; i--) {
      const d = new Date(hariIni);
      d.setDate(hariIni.getDate() - i);
      const jumlah = pendaftar.filter(
        (p) => startOfDay(p.tanggal).getTime() === d.getTime()
      ).length;
      hasil.push({
        key: keyTanggal(d),
        label:
          rentang <= 7
            ? `${HARI[d.getDay()]} ${d.getDate()}`
            : `${d.getDate()}/${d.getMonth() + 1}`,
        tanggalLengkap: formatTanggalPanjang(d),
        jumlah,
      });
    }
    return hasil;
  }, [pendaftar, rentang]);

  // Siswa yang mendaftar pada hari (atau jam) yang diklik di grafik
  const siswaHariDipilih = useMemo(() => {
    if (!hariDipilih) return [];
    return pendaftar
      .filter((p) => {
        if (keyTanggal(p.tanggal) !== hariDipilih.key) return false;
        // Mode "Hari Ini": cocokkan juga jamnya
        if (hariDipilih.jam !== undefined) return p.tanggal.getHours() === hariDipilih.jam;
        return true;
      })
      .sort((a, b) => a.tanggal - b.tanggal);
  }, [pendaftar, hariDipilih]);

  const hariDipilihIsHariIni = hariDipilih?.key === keyTanggal(new Date());

  const terbaru = useMemo(
    () => [...pendaftarAktif].sort((a, b) => b.tanggal - a.tanggal).slice(0, 5),
    [pendaftarAktif]
  );

  // ===============================
  // AKSI KLIK GRAFIK
  // ===============================
  const pilihTitik = (item) => {
    if (!item) return;
    setHariDipilih({
      key: item.key,
      jam: item.jam,
      label: item.label,
      tanggalLengkap: item.tanggalLengkap,
    });
  };

  // Klik di area chart (bukan tepat di titik): pilih hari terdekat
  const handleChartClick = (state) => {
    if (!state) return;
    const idx = state.activeTooltipIndex ?? state.activeIndex;
    const item =
      idx !== undefined && idx !== null && !Number.isNaN(Number(idx))
        ? grafikData[Number(idx)]
        : grafikData.find((g) => g.label === state.activeLabel);
    pilihTitik(item);
  };

  // Titik biru di grafik (bisa diklik -> daftar siswa)
  const renderDot = (props) => {
    const { cx, cy, payload } = props;
    if (cx === undefined || cy === undefined) return null;

    const idx = grafikData.findIndex((d) => d.label === payload?.label);
    const terpilih = hariDipilih?.label === payload?.label;

    return (
      <g
        key={`dot-${idx}`}
        onClick={(e) => {
          e.stopPropagation();
          pilihTitik(grafikData[idx]);
        }}
        style={{ cursor: 'pointer' }}
      >
        {/* area klik */}
        <circle cx={cx} cy={cy} r={12} fill="transparent" />
        <circle
          cx={cx}
          cy={cy}
          r={terpilih ? 6 : 3}
          fill={WARNA_GARIS}
          stroke={terpilih ? '#ffffff' : 'none'}
          strokeWidth={terpilih ? 2 : 0}
        />
      </g>
    );
  };

  // ===============================
  // RENDER
  // ===============================
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <p className="font-medium text-gray-600 dark:text-gray-300">
          Memuat data dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800 transition-colors duration-300 dark:bg-gray-950 dark:text-gray-100">
      <Sidebar isAdmin={false} />

      <main className="flex-1 overflow-y-auto p-3 md:p-6">
        {/* SAMBUTAN */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Selamat datang, {namaSapaan} 👋
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Kelola kegiatan dan siswa ekstrakurikuler dengan mudah.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        {/* KARTU RINGKASAN */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Siswa terdaftar (bisa diklik) */}
          <div
            role="button"
            tabIndex={slugEskul ? 0 : -1}
            onClick={() => slugEskul && navigate(`/eskul/${slugEskul}`)}
            onKeyDown={(e) => {
              if (slugEskul && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                navigate(`/eskul/${slugEskul}`);
              }
            }}
            className={`${cardClass} ${
              slugEskul
                ? 'cursor-pointer transition-colors hover:border-blue-500/40 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:bg-gray-800/60'
                : ''
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400">
                <Users className="h-7 w-7" />
              </div>
              <div>
                <p className="text-3xl font-extrabold">{siswaTerdaftar}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Siswa Terdaftar</p>
              </div>
            </div>
            <p className="mt-4 text-xs text-emerald-600 dark:text-emerald-400">
              ↑ {pendaftarBulanIni} pendaftar bulan ini
            </p>
          </div>

          {/* Eskul dibina (bisa diklik) */}
          <div
            role="button"
            tabIndex={slugEskul ? 0 : -1}
            onClick={() => slugEskul && navigate(`/eskul/${slugEskul}`)}
            onKeyDown={(e) => {
              if (slugEskul && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                navigate(`/eskul/${slugEskul}`);
              }
            }}
            className={`${cardClass} ${
              slugEskul
                ? 'cursor-pointer transition-colors hover:border-blue-500/40 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:bg-gray-800/60'
                : ''
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-500/15 text-violet-600 dark:text-violet-400">
                <BookOpen className="h-7 w-7" />
              </div>
              <div>
                <p className="text-3xl font-extrabold">{eskul ? 1 : 0}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Ekstrakurikuler Dibina
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-sm font-semibold text-violet-700 dark:text-violet-300">
                <span className="h-2 w-2 rounded-full bg-violet-500" />
                {eskul?.nama_eskul || 'Belum ada eskul'}
              </span>
              {slugEskul && (
                <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  Buka <ArrowRight className="h-3.5 w-3.5" />
                </span>
              )}
            </div>
          </div>

          {/* Jumlah siswa laki-laki & perempuan (bisa diklik) */}
          <div
            role="button"
            tabIndex={slugEskul ? 0 : -1}
            onClick={() => slugEskul && navigate(`/eskul/${slugEskul}`)}
            onKeyDown={(e) => {
              if (slugEskul && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                navigate(`/eskul/${slugEskul}`);
              }
            }}
            className={`${cardClass} ${
              slugEskul
                ? 'cursor-pointer transition-colors hover:border-blue-500/40 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:bg-gray-800/60'
                : ''
            }`}
          >
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Users className="h-4 w-4 text-blue-500" />
              Jumlah Siswa Laki-laki &amp; Perempuan
            </div>
            <div className="flex items-center gap-4">
              <div className="relative h-32 w-32 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      innerRadius={38}
                      outerRadius={58}
                      stroke="none"
                      paddingAngle={totalSiswa ? 2 : 0}
                    >
                      {donutData.map((d) => (
                        <Cell key={d.name} fill={d.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold">{totalSiswa}</span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">Siswa</span>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <button
                  type="button"
                  disabled={!slugEskul}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/eskul/${slugEskul}?gender=L`);
                  }}
                  className="block w-full rounded-md p-1 text-left transition-colors enabled:hover:bg-blue-500/10"
                >
                  <div className="flex items-center gap-2 font-medium">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                    Laki-laki
                  </div>
                  <p className="ml-4 text-gray-500 dark:text-gray-400">
                    {jumlahL} ({persen(jumlahL)}%)
                  </p>
                </button>
                <button
                  type="button"
                  disabled={!slugEskul}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/eskul/${slugEskul}?gender=P`);
                  }}
                  className="block w-full rounded-md p-1 text-left transition-colors enabled:hover:bg-pink-500/10"
                >
                  <div className="flex items-center gap-2 font-medium">
                    <span className="h-2.5 w-2.5 rounded-full bg-pink-500" />
                    Perempuan
                  </div>
                  <p className="ml-4 text-gray-500 dark:text-gray-400">
                    {jumlahP} ({persen(jumlahP)}%)
                  </p>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* PERKEMBANGAN PENDAFTARAN (riwayat, tidak berkurang saat siswa dihapus) */}
        <div className={`${cardClass} mb-6`}>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Perkembangan Pendaftaran
            </div>

            {/* Tombol rentang waktu */}
            <div className="flex items-center gap-1 rounded-full bg-gray-100 p-1 dark:bg-gray-800">
              {OPSI_RENTANG.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    setRentang(o.value);
                    setHariDipilih(null);
                  }}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                    rentang === o.value
                      ? 'bg-cyan-500 text-white shadow'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Petunjuk */}
          <div className="mb-3 flex flex-wrap items-center gap-4 text-[11px] text-gray-500 dark:text-gray-400">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: WARNA_GARIS }}
              />
              Siswa mendaftar
            </span>
            <span className="ml-auto italic">
              Klik titik biru = daftar siswa yang mendaftar
            </span>
          </div>

          <div className="h-64 w-full [&_.recharts-wrapper]:outline-none [&_svg]:outline-none [&_*:focus]:outline-none">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={grafikData}
                margin={{ top: 10, right: 16, left: -16, bottom: 0 }}
                style={{ cursor: 'pointer' }}
                onClick={handleChartClick}
              >
                <defs>
                  <linearGradient id="gradPendaftaran" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={WARNA_GARIS} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={WARNA_GARIS} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#9ca3af" strokeOpacity={0.15} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  interval={rentang === 1 ? 2 : 'preserveStartEnd'}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ stroke: '#64748b', strokeDasharray: '3 3' }}
                  contentStyle={{
                    background: '#111827',
                    border: '1px solid #374151',
                    borderRadius: 8,
                    fontSize: 12,
                    color: '#f3f4f6',
                  }}
                  formatter={(v) => [`${v} pendaftar`, '']}
                  separator=""
                />

                {/* Penanda hari yang sedang dipilih */}
                {hariDipilih && (
                  <ReferenceLine
                    x={hariDipilih.label}
                    stroke="#22d3ee"
                    strokeDasharray="4 4"
                    strokeOpacity={0.7}
                  />
                )}

                <Area
                  type="monotone"
                  dataKey="jumlah"
                  stroke={WARNA_GARIS}
                  strokeWidth={2}
                  fill="url(#gradPendaftaran)"
                  dot={renderDot}
                  activeDot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tidak ada hari yang diklik -> Pendaftaran Terbaru.
            Ada hari yang diklik -> diganti daftar siswa yang mendaftar di hari itu. */}
        {hariDipilih ? (
          <div className={`${cardClass} p-0`}>
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <UserPlus className="h-4 w-4 text-blue-500" />
                  Siswa yang Mendaftar — {hariDipilih.tanggalLengkap}
                </div>

                {hariDipilihIsHariIni && (
                  <span className="rounded-full bg-cyan-100 px-2.5 py-1 text-[11px] font-semibold text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300">
                    Hari ini
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  {siswaHariDipilih.length} siswa
                </span>
                <button
                  type="button"
                  onClick={() => setHariDipilih(null)}
                  title="Tutup"
                  className="rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <TabelPendaftar
              data={siswaHariDipilih}
              tampilkanJam
              kosong="Tidak ada siswa yang mendaftar pada waktu ini."
            />
          </div>
        ) : (
          <div className={`${cardClass} p-0`}>
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <UserPlus className="h-4 w-4 text-blue-500" />
                Pendaftaran Terbaru
              </div>
              {slugEskul && (
                <button
                  onClick={() => navigate(`/eskul/${slugEskul}`)}
                  className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                  Lihat Semua <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <TabelPendaftar data={terbaru} kosong="Belum ada pendaftaran." />
          </div>
        )}
      </main>
    </div>
  );
}