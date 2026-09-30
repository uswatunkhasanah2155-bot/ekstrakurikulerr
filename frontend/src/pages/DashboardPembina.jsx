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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Users, BookOpen, UserPlus, TrendingUp, ArrowRight } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import * as api from '../services/api';

const { getDaftarEskul, getPendaftarEskul } = api;

// ===============================
// HELPER
// ===============================
const toArray = (res) => {
  const data = res?.data ?? res;
  return Array.isArray(data) ? data : [];
};

const HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const formatTanggal = (d) =>
  d ? `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}` : '-';

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

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
      siswa.kelas?.nama_kelas ??
      item.kelas?.nama_kelas ??
      (typeof siswa.kelas === 'string' ? siswa.kelas : null) ??
      (typeof item.kelas === 'string' ? item.kelas : null) ??
      '-',
    gender: normalGender(siswa.jenis_kelamin ?? item.jenis_kelamin ?? item.jenisKelamin),
    tanggal: isNaN(tgl) ? new Date() : tgl,
    status: normalStatus(item.status ?? item.status_pendaftaran),
  };
};

const cardClass =
  'rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900';

// ===============================
// KOMPONEN
// ===============================
export default function DashboardPembina() {
  const navigate = useNavigate();

  const [eskul, setEskul] = useState(null);
  const [pendaftar, setPendaftar] = useState([]);
  const [rentang, setRentang] = useState(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notif, setNotif] = useState(null);

  const tampilkanNotif = (type, text) => {
    setNotif({ type, text });
    setTimeout(() => setNotif(null), 3000);
  };

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
          getPendaftarEskul(),
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
  // TERIMA / TOLAK
  // ===============================
  const ubahStatus = async (item, statusBaru) => {
    const fn = api.updateStatusPendaftar; // sesuaikan dengan nama fungsi di api.js
    if (typeof fn !== 'function') {
      tampilkanNotif('error', 'Fungsi ubah status belum tersedia di api.js');
      return;
    }

    const result = await fn(item.id, statusBaru === 'diterima' ? 'Diterima' : 'Ditolak');
    if (result && result.success === false) {
      tampilkanNotif('error', result.error || 'Gagal mengubah status');
      return;
    }

    setPendaftar((prev) =>
      prev.map((p) => (p.id === item.id ? { ...p, status: statusBaru } : p))
    );
    tampilkanNotif(
      'success',
      statusBaru === 'diterima' ? 'Pendaftaran diterima' : 'Pendaftaran ditolak'
    );
  };

  // ===============================
  // DATA TURUNAN
  // ===============================
  const slugEskul = (eskul?.nama_eskul || '').trim().toLowerCase().replace(/\s+/g, '-');

  // Sama dengan label di Sidebar: "Pembina Paskibra"
  const namaSapaan = eskul?.nama_eskul ? `Pembina ${eskul.nama_eskul}` : 'Pembina';

  const siswaTerdaftar = useMemo(() => {
    const ids = new Set(
      pendaftar.filter((p) => p.status === 'diterima').map((p) => p.idSiswa ?? p.id)
    );
    return ids.size;
  }, [pendaftar]);

  const pendaftarBulanIni = useMemo(() => {
    const now = new Date();
    return pendaftar.filter(
      (p) =>
        p.tanggal.getMonth() === now.getMonth() &&
        p.tanggal.getFullYear() === now.getFullYear()
    ).length;
  }, [pendaftar]);

  // Siswa yang sudah diterima (unik per siswa), dihitung per jenis kelamin
  const siswaDiterima = useMemo(() => {
    const unik = new Map();
    pendaftar
      .filter((p) => p.status === 'diterima')
      .forEach((p) => unik.set(p.idSiswa ?? p.id, p));
    return [...unik.values()];
  }, [pendaftar]);

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

  const grafikData = useMemo(() => {
    const hariIni = startOfDay(new Date());
    const hasil = [];
    for (let i = rentang - 1; i >= 0; i--) {
      const d = new Date(hariIni);
      d.setDate(hariIni.getDate() - i);
      const jumlah = pendaftar.filter(
        (p) => startOfDay(p.tanggal).getTime() === d.getTime()
      ).length;
      hasil.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
        label: rentang <= 7 ? `${HARI[d.getDay()]} ${d.getDate()}` : `${d.getDate()}/${d.getMonth() + 1}`,
        jumlah,
      });
    }
    return hasil;
  }, [pendaftar, rentang]);

  const terbaru = useMemo(
    () => [...pendaftar].sort((a, b) => b.tanggal - a.tanggal).slice(0, 5),
    [pendaftar]
  );

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

      <main className="flex-1 overflow-y-auto p-6">
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

        {notif && (
          <div
            className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
              notif.type === 'success'
                ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300'
                : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300'
            }`}
          >
            {notif.text}
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

        {/* PERKEMBANGAN PENDAFTARAN */}
        <div className={`${cardClass} mb-6`}>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Perkembangan Pendaftaran
            </div>

            <select
              value={rentang}
              onChange={(e) => setRentang(Number(e.target.value))}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              <option value={7}>7 Hari Terakhir</option>
              <option value={14}>14 Hari Terakhir</option>
              <option value={30}>30 Hari Terakhir</option>
            </select>
          </div>

          <div className="h-64 w-full [&_.recharts-wrapper]:outline-none [&_svg]:outline-none [&_*:focus]:outline-none">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={grafikData}
                margin={{ top: 10, right: 16, left: -16, bottom: 0 }}
                style={{ cursor: slugEskul ? 'pointer' : 'default' }}
                onClick={(state) => {
                  if (!slugEskul) return;
                  // Cari hari yang diklik (kompatibel dengan berbagai versi recharts)
                  const idx = state?.activeTooltipIndex ?? state?.activeIndex;
                  const item =
                    idx !== undefined && idx !== null
                      ? grafikData[Number(idx)]
                      : grafikData.find((g) => g.label === state?.activeLabel);
                  navigate(
                    item?.key
                      ? `/eskul/${slugEskul}?tanggal=${item.key}`
                      : `/eskul/${slugEskul}`
                  );
                }}
              >
                <defs>
                  <linearGradient id="gradPendaftaran" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#9ca3af" strokeOpacity={0.15} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
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
                <Area
                  type="monotone"
                  dataKey="jumlah"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#gradPendaftaran)"
                  dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PENDAFTARAN TERBARU */}
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

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
                  <th className="px-5 py-3">No</th>
                  <th className="px-5 py-3">Nama Siswa</th>
                  <th className="px-5 py-3">Kelas</th>
                  <th className="px-5 py-3">Jenis Kelamin</th>
                  <th className="px-5 py-3">Tanggal Daftar</th>
                  <th className="px-5 py-3">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {terbaru.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-8 text-center text-gray-400 dark:text-gray-500"
                    >
                      Belum ada pendaftaran.
                    </td>
                  </tr>
                ) : (
                  terbaru.map((p, i) => (
                    <tr
                      key={p.id ?? i}
                      className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/40"
                    >
                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{i + 1}</td>

                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/15 text-xs font-bold text-blue-600 dark:text-blue-400">
                            {p.nama.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">{p.nama}</span>
                        </div>
                      </td>

                      <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{p.kelas}</td>

                      <td className="px-5 py-3 text-gray-600 dark:text-gray-300">
                        {p.gender === 'P' ? 'Perempuan' : 'Laki-laki'}
                      </td>

                      <td className="px-5 py-3 text-gray-600 dark:text-gray-300">
                        {formatTanggal(p.tanggal)}
                      </td>

                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => navigate(`/eskul/${slugEskul}`)}
                            className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-500/20 dark:text-blue-400"
                          >
                            Detail
                          </button>

                          {p.status === 'menunggu' && (
                            <>
                              <button
                                onClick={() => ubahStatus(p, 'diterima')}
                                className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-500/20 dark:text-emerald-400"
                              >
                                Terima
                              </button>
                              <button
                                onClick={() => ubahStatus(p, 'ditolak')}
                                className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-700 transition-colors hover:bg-rose-500/20 dark:text-rose-400"
                              >
                                Tolak
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}