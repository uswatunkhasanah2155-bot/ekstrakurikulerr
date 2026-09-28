// src/pages/DashboardSiswa.jsx
import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { getDaftarEskul } from '../services/api';
import { BookOpen, Search, Clock, User, AlertCircle, Loader2 } from 'lucide-react';

export default function DashboardSiswa() {
  const [daftarEskul, setDaftarEskul] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [username, setUsername] = useState('Uswa'); // Default diset 'Uswa' sesuai akunmu

  const BACKEND_URL = 'http://localhost:5000';

  useEffect(() => {
    // Cek jika username tersimpan di localStorage
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    } else {
      // Jika belum ada di localStorage, simpan default 'uswa' agar konsisten
      localStorage.setItem('username', 'uswa');
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        
        {/* Banner Sapaan dengan Username */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 sm:p-8 shadow-lg">
          <div className="relative z-10 max-w-2xl space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 capitalize">
              Halo, {username}! <span className="text-2xl">👋</span>
            </h1>
            <p className="text-blue-100 text-sm sm:text-base">
              Selamat datang di dashboard siswa. Temukan ekstrakurikuler yang sesuai dengan minat dan bakatmu.
            </p>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4 pointer-events-none">
            <BookOpen className="w-64 h-64" />
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
                  const fotoSrc = item.foto
                    ? item.foto.startsWith('http')
                      ? item.foto
                      : `${BACKEND_URL}/${item.foto.startsWith('/') ? item.foto.slice(1) : item.foto}`
                    : null;

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
                      <div className="w-full md:w-auto border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-800 pt-3 md:pt-0 md:px-6 space-y-1.5 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
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

                      {/* Sisi Kanan: Tombol Aksi */}
                      <div className="w-full md:w-auto flex items-center gap-2 pt-2 md:pt-0 justify-end">
                        <button className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-all">
                          Lihat Detail
                        </button>
                        <button className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 transition-all">
                          Daftar
                        </button>
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