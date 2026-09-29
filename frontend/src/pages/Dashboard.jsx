// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { getDaftarEskul, getPendaftarEskul } from '../services/api';
import { UserRound } from 'lucide-react';

const BACKEND_URL = 'http://localhost:5000'; // idealnya dari environment variable

// Pastikan hasil API selalu berupa array
const toArray = (res) => {
  const data = res?.data ?? res;
  return Array.isArray(data) ? data : [];
};

function EskulAvatar({ foto, nama }) {
  const [imgError, setImgError] = useState(false);

  const src = foto
    ? foto.startsWith('http')
      ? foto
      : `${BACKEND_URL}/${foto.startsWith('/') ? foto.slice(1) : foto}`
    : null;

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={nama}
        className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-gray-700 mb-2"
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div className="w-12 h-12 rounded-full bg-cyan-100 dark:bg-cyan-900/40 text-cyan-800 dark:text-cyan-300 flex items-center justify-center font-bold mb-2">
      {(nama || 'E').charAt(0)}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [roleUser, setRoleUser] = useState('');
  const [daftarEskul, setDaftarEskul] = useState([]);
  const [eskulCounts, setEskulCounts] = useState({}); // key: id_eskul
  const [totalSiswa, setTotalSiswa] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const role = (localStorage.getItem('role') || '').toLowerCase();
    const idEskul = localStorage.getItem('id_eskul');
    setRoleUser(role);

    async function fetchData() {
      try {
        const [eskulRes, pendaftarRes] = await Promise.all([
          getDaftarEskul(),
          getPendaftarEskul(),
        ]);

        let listEskul = toArray(eskulRes);

        // Pembina hanya boleh melihat eskul miliknya
        if (role === 'pembina') {
          listEskul = listEskul.filter(
            (eskul) => String(eskul.id_eskul) === String(idEskul)
          );
        }

        // Hitung per id_eskul (hanya eskul yang boleh dilihat)
        const counts = {};
        listEskul.forEach((eskul) => {
          counts[String(eskul.id_eskul)] = 0;
        });

        const uniqueSiswaIds = new Set();

        toArray(pendaftarRes).forEach((item) => {
          const idE = String(item.id_eskul ?? item.ekstrakurikuler?.id_eskul ?? '');
          if (!Object.prototype.hasOwnProperty.call(counts, idE)) return;

          counts[idE] += 1;

          const idSiswa = item.siswa?.id_siswa ?? item.id_siswa;
          if (idSiswa) uniqueSiswaIds.add(idSiswa);
        });

        if (cancelled) return;
        setDaftarEskul(listEskul);
        setEskulCounts(counts);
        setTotalSiswa(uniqueSiswaIds.size);
      } catch (err) {
        console.error('Gagal mengambil data dashboard:', err);
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
        <p className="text-gray-600 dark:text-gray-300 font-medium">
          Memuat data dashboard...
        </p>
      </div>
    );
  }

  const isAdmin = roleUser === 'admin';

  const chartData = daftarEskul.map((eskul) => ({
    id_eskul: eskul.id_eskul,
    nama_eskul: eskul.nama_eskul,
    count: eskulCounts[String(eskul.id_eskul)] || 0,
  }));

  const rawMax = Math.max(1, ...chartData.map((d) => d.count));
  const chartMax = Math.ceil(rawMax / 10) * 10 || 10;
  const ySteps = 5;
  const yLabels = Array.from(
    { length: ySteps + 1 },
    (_, i) => chartMax - (chartMax / ySteps) * i
  );

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 transition-colors duration-300">
      <Sidebar isAdmin={isAdmin} />

      <main className="flex-1 p-6 overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6">
          Sistem Pendaftaran Ekstrakurikuler
        </h2>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* CHART & REKAPITULASI */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-6">
              Jumlah Siswa per Eskul
            </h3>

            {chartData.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">
                Belum ada data ekstrakurikuler.
              </p>
            ) : (
              <div className="flex gap-3">
                {/* Label sumbu Y (tinggi sama dengan area grid) */}
                <div className="flex flex-col justify-between h-56 text-[11px] text-gray-400 font-medium">
                  {yLabels.map((val) => (
                    <span key={val} className="leading-none">
                      {Math.round(val)}
                    </span>
                  ))}
                </div>

                <div className="flex-1 relative">
                  {/* Garis grid */}
                  <div className="absolute inset-x-0 top-0 h-56 flex flex-col justify-between pointer-events-none">
                    {yLabels.map((val) => (
                      <div key={val} className="border-t border-gray-100 dark:border-gray-800 w-full" />
                    ))}
                  </div>

                  {/* Batang chart - klik untuk lihat laporan eskul */}
                  <div className="relative flex items-end justify-between gap-2 h-56">
                    {chartData.map((item) => (
                      <div
                        key={item.id_eskul}
                        onClick={() => navigate(`/admin/laporan-eskul/${item.id_eskul}`)}
                        className="flex-1 flex flex-col items-center justify-end h-full cursor-pointer group"
                        title={`Lihat laporan ${item.nama_eskul}`}
                      >
                        <div
                          className="relative w-full max-w-[36px] rounded-t-[3px] bg-[#4f7fa8] transition-all group-hover:opacity-80"
                          style={{
                            height: `${(item.count / chartMax) * 100}%`,
                            minHeight: item.count > 0 ? '4px' : '0px',
                          }}
                        >
                          {item.count > 0 && (
                            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                              {item.count}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Label nama eskul */}
                  <div className="flex items-start justify-between gap-2 mt-2 border-t border-gray-200 dark:border-gray-700 pt-2">
                    {chartData.map((item) => (
                      <span
                        key={item.id_eskul}
                        title={item.nama_eskul}
                        className="flex-1 text-[10px] text-gray-500 dark:text-gray-400 text-center leading-tight truncate"
                      >
                        {item.nama_eskul}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-center">
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-8 text-center">
              Rekapitulasi Total Pendaftaran
            </h3>
            <div className="flex items-center justify-center gap-4 mb-3">
              <span className="text-6xl font-extrabold text-gray-800 dark:text-gray-100">
                {totalSiswa}
              </span>
              <UserRound className="w-14 h-14 text-cyan-700 dark:text-cyan-400" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 text-center mb-8">
              Total Siswa Terdaftar
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-4 py-3.5 text-sm font-medium text-gray-600 dark:text-gray-300 text-center">
              dari {daftarEskul.length} Ekstrakurikuler
            </div>
          </div>
        </div>

        {/* DAFTAR ESKUL */}
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
          {roleUser === 'pembina' ? 'Ekstrakurikuler yang Dibina' : 'Daftar Ekstrakurikuler'}
        </h3>

        {daftarEskul.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-10 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">Belum ada ekstrakurikuler.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {daftarEskul.map((eskul) => (
              <div
                key={eskul.id_eskul}
                className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-between"
              >
                <div>
                  <EskulAvatar foto={eskul.foto} nama={eskul.nama_eskul} />
                  <h4 className="font-bold text-gray-800 dark:text-gray-100 text-base">
                    {eskul.nama_eskul}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                    {eskul.deskripsi || 'Tidak ada deskripsi'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <div>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Pembina:</span>{' '}
                    {eskul.pembina || 'Belum ada'}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Jadwal:</span>{' '}
                    {eskul.jadwal || 'Belum ada'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}