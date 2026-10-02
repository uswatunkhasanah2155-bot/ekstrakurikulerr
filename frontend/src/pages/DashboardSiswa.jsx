// src/pages/DashboardSiswa.jsx
import React, { useState, useEffect } from 'react';
import { fotoUrl } from '../utils/fotoUrl';
import Navbar from '../components/Navbar';
import { getDaftarEskul, getGaleriEskul } from '../services/api';
import {
  Search,
  AlertCircle,
  Loader2,
  Trophy,
  Sprout,
  Quote,
} from 'lucide-react';
import logoSekolah from '../assets/sesco logo.png';

// Pastikan hasil API selalu berupa array
const toArray = (res) => {
  const data = res?.data ?? res;
  return Array.isArray(data) ? data : [];
};

// Header kartu: foto sampul (foto utama galeri) + logo eskul menumpang di pojok kiri bawah
function EskulCardHeader({ cover, logo, nama }) {
  const [coverError, setCoverError] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const coverSrc = fotoUrl(cover);
  const logoSrc = fotoUrl(logo);

  return (
    <div className="relative">
      <div className="h-32 w-full overflow-hidden bg-gradient-to-br from-cyan-700 to-slate-800">
        {coverSrc && !coverError && (
          <img
            src={coverSrc}
            alt={`Sampul ${nama}`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setCoverError(true)}
          />
        )}
      </div>

      <div className="absolute -bottom-7 left-4 h-14 w-14 overflow-hidden rounded-xl border-2 border-white bg-white shadow-md dark:border-gray-900 dark:bg-gray-900">
        {logoSrc && !logoError ? (
          <img
            src={logoSrc}
            alt={nama}
            className="h-full w-full object-contain"
            onError={() => setLogoError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-cyan-100 text-lg font-bold text-cyan-800 dark:bg-cyan-900/60 dark:text-cyan-300">
            {(nama || 'E').charAt(0)}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardSiswa() {
  const [daftarEskul, setDaftarEskul] = useState([]);
  const [coverMap, setCoverMap] = useState({}); // key: id_eskul, value: path foto sampul
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  // Nama diambil dari user yang sedang login (disimpan di localStorage saat login)
  const [username, setUsername] = useState(localStorage.getItem('username') || 'Siswa');

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    }

    async function fetchData() {
      try {
        setLoading(true);
        const [eskulData] = await Promise.all([
          getDaftarEskul(),
        ]);

        const listEskul = toArray(eskulData);

        // Ambil foto utama (is_featured) dari galeri tiap eskul, paralel
        const coverEntries = await Promise.all(
          listEskul.map(async (eskul) => {
            try {
              const galeri = toArray(await getGaleriEskul(eskul.id_eskul));
              const utama = galeri.find((g) => g.is_featured);
              return [String(eskul.id_eskul), utama?.foto || null];
            } catch {
              return [String(eskul.id_eskul), null];
            }
          })
        );

        setDaftarEskul(listEskul);
        setCoverMap(Object.fromEntries(coverEntries));
      } catch (err) {
        console.error('Gagal memuat data dashboard siswa:', err);
        setError('Gagal memuat data dari server.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const filteredEskul = daftarEskul.filter((item) =>
    item.nama_eskul?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 transition-colors duration-300">
      <Navbar />

      <main className="w-full px-4 sm:px-6 lg:px-10 py-8 space-y-6">

        {/* ===== Banner Sapaan: dasar putih, logo jelas di kanan, sisi kiri blur gelap ===== */}
        <div className="relative overflow-hidden rounded-3xl bg-white p-6 sm:p-8 md:min-h-[240px] flex items-center shadow-lg border border-gray-200">

          {/* Logo di sisi kanan (tajam, tidak diblur) */}
          <div className="hidden md:block absolute inset-y-0 right-0 w-1/2 pointer-events-none select-none">
            <img
              src={logoSekolah}
              alt="Logo Sekolah"
              className="absolute inset-0 w-full h-full object-contain p-4"
            />
          </div>

          {/* Lapisan blur gelap di sisi kiri, memudar ke kanan (di HP menutupi seluruh banner) */}
          <div
            className="absolute inset-y-0 left-0 w-full md:w-[68%] pointer-events-none backdrop-blur-xl bg-gradient-to-r from-blue-950 via-blue-900 to-blue-900 md:via-blue-900/90 md:to-transparent md:[-webkit-mask-image:linear-gradient(to_right,black_60%,transparent)] md:[mask-image:linear-gradient(to_right,black_60%,transparent)]"
          />

          <div className="relative z-10 max-w-xl space-y-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold flex items-center gap-2 capitalize text-white drop-shadow-md">
              Halo, {username}! <span className="text-3xl">👋</span>
            </h1>
            <p className="text-blue-100 text-sm sm:text-base font-medium leading-relaxed">
              Jelajahi berbagai ekstrakurikuler, temukan minat dan bakatmu, asah kemampuanmu, dan jadikan setiap kegiatan sebagai langkah untuk meraih prestasi dan pengalaman yang membanggakan!
            </p>
          </div>
        </div>

        {/* ===== Grid utama: header, panel info, lalu kartu eskul =====
            xl: 4 kolom. Panel info di kolom 4 (menempati baris header + baris kartu pertama),
            sehingga kartu baris berikutnya otomatis memenuhi lebar penuh (tidak ada ruang kosong).
            HP: semua menumpuk 1 kolom. */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pt-2">

          {/* Header + pencarian */}
          <div className="col-span-full xl:col-span-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                🔥 Ekstrakurikuler Populer
              </h2>
              <p className="text-xs sm:text-sm text-blue-500 dark:text-blue-400">
                Kegiatan terbaik yang bisa kamu pilih sesuai minat dan bakatmu.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari ekstrakurikuler..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Panel info: di HP/tablet muncul tepat di bawah header, di laptop jadi kolom kanan */}
          <aside className="col-span-full xl:col-span-1 xl:col-start-4 xl:row-start-1 xl:row-span-2 grid grid-cols-1 md:grid-cols-3 xl:grid-cols-1 xl:grid-rows-[auto_auto_1fr] gap-4">

            {/* Ayo Raih Prestasimu */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 flex items-start gap-3">
              <div className="w-12 h-12 shrink-0 rounded-full bg-yellow-100 dark:bg-yellow-500/10 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-yellow-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 dark:text-white">Ayo Raih Prestasimu!</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  Ikuti kegiatan eskul, kumpulkan pengalaman, dan jadilah versi terbaik dari dirimu.
                </p>
              </div>
            </div>

            {/* Total Ekstrakurikuler */}
            <div className="rounded-2xl p-4 flex items-center gap-3 text-white bg-gradient-to-r from-blue-600 to-indigo-500 shadow-lg">
              <div className="w-12 h-12 shrink-0 rounded-full bg-white/20 flex items-center justify-center">
                <Sprout className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium">Total Ekstrakurikuler</p>
                <p className="text-3xl font-extrabold leading-tight">{daftarEskul.length}</p>
                <p className="text-[11px] text-blue-100">Pilihan kegiatan seru menantimu!</p>
              </div>
            </div>

            {/* Kutipan (menyesuaikan sisa tinggi supaya sejajar dengan kartu) */}
            <div className="flex flex-col justify-between rounded-2xl p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <div>
                <Quote className="w-6 h-6 text-blue-500 mb-2" />
                <p className="text-sm italic text-gray-700 dark:text-gray-200 leading-relaxed">
                  "Bakat bukan untuk disimpan, tapi untuk dikembangkan."
                </p>
              </div>
              <div className="flex items-center gap-2 mt-4 text-[11px] text-gray-400">
                <Sprout className="w-4 h-4 text-blue-500" />
                SESCO ESKUL
              </div>
            </div>
          </aside>

          {loading && (
            <div className="col-span-full xl:col-span-3 flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Memuat data ekstrakurikuler...</p>
            </div>
          )}

          {error && (
            <div className="col-span-full xl:col-span-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-2xl p-4 flex items-center gap-3 text-red-700 dark:text-red-400">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Kartu eskul: tampilan sama seperti dashboard admin */}
          {!loading && !error && filteredEskul.length > 0 &&
            filteredEskul.map((item) => (
              <div
                key={item.id_eskul}
                className="group flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
              >
                <EskulCardHeader
                  cover={coverMap[String(item.id_eskul)]}
                  logo={item.foto}
                  nama={item.nama_eskul}
                />

                {/* pt-9 memberi ruang untuk logo yang menumpang */}
                <div className="flex flex-1 flex-col justify-between p-4 pt-9">
                  <div>
                    <h4 className="text-base font-bold text-gray-800 dark:text-gray-100">
                      {item.nama_eskul}
                    </h4>
                    <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                      {item.deskripsi || 'Tidak ada deskripsi'}
                    </p>
                  </div>

                  <div className="mt-4 space-y-1 border-t border-gray-100 pt-3 text-xs text-gray-600 dark:border-gray-800 dark:text-gray-400">
                    <div>
                      <span className="font-semibold text-gray-700 dark:text-gray-300">Pembina:</span>{' '}
                      {item.pembina || 'Belum ada'}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700 dark:text-gray-300">Jadwal:</span>{' '}
                      {item.jadwal || 'Belum ada'}
                    </div>
                  </div>
                </div>
              </div>
            ))}

          {!loading && !error && filteredEskul.length === 0 && (
            <div className="col-span-full xl:col-span-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-12 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Ekstrakurikuler yang kamu cari tidak ditemukan.
              </p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}