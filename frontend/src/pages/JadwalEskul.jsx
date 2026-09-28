// src/pages/JadwalEskul.jsx
import React, { useState, useEffect } from 'react';
import { CalendarDays, Clock, User, AlertCircle, Loader2, ChevronRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import { getDaftarEskul } from '../services/api';

export default function JadwalEskul() {
  const [dataJadwal, setDataJadwal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState('Semua');

  const daysList = ['Semua', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

  // Ganti URL ini sesuai dengan alamat server backend kamu jika portnya berbeda
  const BACKEND_URL = 'http://localhost:5000';

  useEffect(() => {
    fetchJadwalEskul();
  }, []);

  const fetchJadwalEskul = async () => {
    try {
      setLoading(true);
      const response = await getDaftarEskul();
      const listEskul = response.data || response || [];
      setDataJadwal(listEskul);
    } catch (err) {
      console.error('Gagal memuat jadwal:', err);
      setError('Gagal memuat data jadwal dari server.');
    } finally {
      setLoading(false);
    }
  };

  // Filter data berdasarkan hari yang dipilih
  const filteredData = dataJadwal.filter((item) => {
    if (selectedDay === 'Semua') return true;
    const jadwalStr = item.jadwal ? item.jadwal.toLowerCase() : '';
    return jadwalStr.includes(selectedDay.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 transition-colors duration-300">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold text-sm mb-1">
            <CalendarDays className="w-5 h-5" />
            <span>Jadwal Kegiatan Ekstrakurikuler</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Jadwal Kegiatan Ekstrakurikuler
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Berikut adalah jadwal kegiatan ekstrakurikuler yang kamu ikuti atau yang tersedia di sekolah.
          </p>
        </div>

        {/* Filter Hari (Tabs) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
          {daysList.map((day) => {
            const isActive = selectedDay === day;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <CalendarDays className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                <span>{day}</span>
              </button>
            );
          })}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Memuat data jadwal...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-2xl p-4 flex items-center gap-3 text-red-700 dark:text-red-400">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Daftar Kartu Ekstrakurikuler */}
        {!loading && !error && (
          <div className="space-y-4">
            {filteredData.length > 0 ? (
              filteredData.map((item) => {
                const fotoPath = item.foto || item.logo || item.image || item.gambar;
                const imageSrc = fotoPath
                  ? fotoPath.startsWith('http')
                    ? fotoPath
                    : `${BACKEND_URL}${fotoPath}`
                  : null;

                return (
                  <div
                    key={item.id_eskul || item.nama_eskul}
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    {/* Sisi Kiri: Foto/Logo, Nama, Deskripsi, Kategori */}
                    <div className="flex items-start gap-4 w-full md:w-auto flex-1">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0 border border-gray-100 dark:border-gray-800 relative">
                        {imageSrc ? (
                          <img
                            src={imageSrc}
                            alt={item.nama_eskul}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.nextSibling) {
                                e.target.nextSibling.style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}

                        <div
                          className={`w-full h-full absolute inset-0 items-center justify-center bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold text-lg ${
                            imageSrc ? 'hidden' : 'flex'
                          }`}
                          style={{ display: imageSrc ? 'none' : 'flex' }}
                        >
                          {item.nama_eskul ? item.nama_eskul.charAt(0) : 'E'}
                        </div>
                      </div>

                      <div className="space-y-1.5 flex-1">
                        <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white">
                          {item.nama_eskul}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                          {item.deskripsi || 'Tidak ada deskripsi tersedia.'}
                        </p>
                        {item.kategori && (
                          <span className="inline-block px-2.5 py-0.5 text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 rounded-md border border-amber-200/60 dark:border-amber-900/40">
                            {item.kategori}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Sisi Kanan: Jadwal dan Pembina */}
                    <div className="w-full md:w-auto border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-800 pt-3 md:pt-0 md:pl-6 flex flex-col sm:flex-row md:flex-col gap-2 sm:gap-4 md:gap-1.5 text-xs sm:text-sm text-gray-600 dark:text-gray-300 justify-between items-start md:items-end">
                      <div className="space-y-1.5 w-full">
                        {/* Jadwal */}
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-500 shrink-0" />
                          <span className="font-medium text-gray-700 dark:text-gray-200">
                            {item.jadwal || 'Belum ada jadwal'}
                          </span>
                        </div>

                        {/* Pembina */}
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400 shrink-0" />
                          <span>Pembina: {item.pembina || '-'}</span>
                        </div>
                      </div>
                      </div>
                    </div>
                );
              })
            ) : (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-12 text-center">
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Tidak ada jadwal kegiatan ekstrakurikuler untuk hari <span className="font-semibold">{selectedDay}</span>.
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}