// src/pages/DashboardSiswa.jsx
import React, { useState, useEffect } from 'react';
import { fotoUrl } from '../utils/fotoUrl';
import Navbar from '../components/Navbar';
import { getDaftarEskul } from '../services/api';
import { Search, Clock, User, AlertCircle, Loader2 } from 'lucide-react';
import logoSekolah from '../assets/sesco logo.png';

export default function DashboardSiswa() {
  const [daftarEskul, setDaftarEskul] = useState([]);
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

        const listEskul = eskulData.data || eskulData || [];
        setDaftarEskul(listEskul);
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

        {/* Banner Sapaan dengan Username */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-blue-500 to-sky-400 dark:from-blue-800 dark:via-blue-700 dark:to-sky-600 text-white p-6 sm:p-8 md:min-h-[250px] flex items-center shadow-md">
          <div className="relative z-10 max-w-2xl md:max-w-[46%] space-y-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold flex items-center gap-2 capitalize drop-shadow-md">
              Halo, {username}! <span className="text-3xl">👋</span>
            </h1>
            <p className="text-white text-sm sm:text-base font-semibold leading-relaxed drop-shadow">
              Jelajahi berbagai ekstrakurikuler, temukan minat dan bakatmu, asah kemampuanmu, dan jadikan setiap kegiatan sebagai langkah untuk meraih prestasi dan pengalaman yang membanggakan!
            </p>
          </div>

          {/* Gambar landscape memenuhi sisi kanan banner (87% lebar banner, penuh atas-bawah sampai tepi kanan), sisi kiri memudar transparan */}
          <div
            className="hidden md:block absolute inset-y-0 right-0 w-[87%] pointer-events-none select-none"
            style={{
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, transparent 28%, rgba(0,0,0,0.6) 52%, black 78%)',
              maskImage: 'linear-gradient(to right, transparent 0%, transparent 28%, rgba(0,0,0,0.6) 52%, black 78%)',
            }}
          >
            <div className="absolute inset-0 bg-blue-50/95" />
            <img
              src={logoSekolah}
              alt="Logo SMK Negeri Compreng"
              className="absolute inset-0 w-full h-full object-contain p-1 pl-[28%]"
            />
          </div>
        </div>

        {/* Bagian Daftar Ekstrakurikuler Populer */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                Ekstrakurikuler Populer
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Kegiatan terbaik yang bisa kamu pilih sesuai minat dan bakatmu.
              </p>
            </div>

            {/* Input Pencarian */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari ekstrakurikuler..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Memuat data ekstrakurikuler...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-2xl p-4 flex items-center gap-3 text-red-700 dark:text-red-400">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* List Kartu Eskul Siswa */}
          {!loading && !error && (
            <div className="space-y-3">
              {filteredEskul.length > 0 ? (
                filteredEskul.map((item) => {
                  const fotoSrc = fotoUrl(item.foto);

                  return (
                    <div
                      key={item.id_eskul}
                      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    >
                      {/* Sisi Kiri: Foto & Deskripsi */}
                      <div className="flex items-start gap-4 w-full md:w-auto flex-1">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-800/50 shrink-0 border border-gray-100 dark:border-gray-800 flex items-center justify-center p-2 shadow-sm">
                          {fotoSrc ? (
                            <img src={fotoSrc} alt={item.nama_eskul} className="w-full h-full object-contain" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No Image</div>
                          )}
                        </div>

                        <div className="space-y-1.5 flex-1">
                          <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white">
                            {item.nama_eskul}
                          </h3>

                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                            {item.deskripsi || 'Tidak ada deskripsi tersedia.'}
                          </p>
                        </div>
                      </div>

                      {/* Bagian Tengah: Jadwal & Pembina */}
                      <div className="w-full md:w-auto border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-800 pt-3 md:pt-0 md:px-6 md:min-w-[260px] space-y-1.5 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-500 shrink-0" />
                          <span className="font-medium text-gray-700 dark:text-gray-200">
                            {item.jadwal || 'Belum ada jadwal'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400 shrink-0" />
                          <span>Pembina: {item.pembina || '-'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-12 text-center">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Ekstrakurikuler yang kamu cari tidak ditemukan.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}