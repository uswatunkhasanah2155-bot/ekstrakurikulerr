// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { getDaftarEskul, getPendaftarEskul } from '../services/api';
import { UserRound } from 'lucide-react';

export default function StudentDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [daftarEskul, setDaftarEskul] = useState([]);
  const [eskulCounts, setEskulCounts] = useState({});
  const [totalSiswa, setTotalSiswa] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const roleUser = localStorage.getItem('role');

    if (roleUser && roleUser.toUpperCase() === 'ADMIN') {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }

    async function fetchData() {
      const [eskulData, pendaftarData] = await Promise.all([
        getDaftarEskul(),
        getPendaftarEskul(),
      ]);

      const listEskul = eskulData.data || eskulData || [];
      setDaftarEskul(listEskul);

      const counts = {};
      listEskul.forEach((eskul) => {
        counts[eskul.nama_eskul] = 0;
      });

      const uniqueSiswaIds = new Set();

      (pendaftarData || []).forEach((item) => {
        const namaEskul = item.ekstrakurikuler?.nama_eskul;
        const idSiswa = item.siswa?.id_siswa || item.id_siswa;

        if (namaEskul && counts.hasOwnProperty(namaEskul)) {
          counts[namaEskul] += 1;
        }
        if (idSiswa) {
          uniqueSiswaIds.add(idSiswa);
        }
      });

      setEskulCounts(counts);
      setTotalSiswa(uniqueSiswaIds.size);
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600 font-medium">Memuat data ekstrakurikuler dari backend...</p>
      </div>
    );
  }

  const countValues = Object.values(eskulCounts);
  const rawMax = Math.max(1, ...countValues);
  const chartMax = Math.ceil(rawMax / 10) * 10 || 10;
  const ySteps = 5;
  const yLabels = Array.from({ length: ySteps + 1 }, (_, i) => chartMax - (chartMax / ySteps) * i);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isAdmin={isAdmin} />

      <main className="flex-1 p-6 overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-6">
          Sistem Pendaftaran Ekstrakurikuler
        </h2>

        {/* Chart + Rekapitulasi */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-base font-bold text-gray-800 mb-6">
              Jumlah Siswa per Eskul
            </h3>

            {countValues.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">Belum ada data ekstrakurikuler.</p>
            ) : (
              <div className="flex gap-3">
                <div className="flex flex-col justify-between h-56 pb-6 text-[11px] text-gray-400 font-medium">
                  {yLabels.map((val) => (
                    <span key={val}>{Math.round(val)}</span>
                  ))}
                </div>

                <div className="flex-1 relative">
                  <div className="absolute inset-0 flex flex-col justify-between h-56 pointer-events-none">
                    {yLabels.map((val, i) => (
                      <div key={i} className="border-t border-gray-100 w-full"></div>
                    ))}
                  </div>

                  <div className="relative flex items-end justify-between gap-2 h-56">
                    {Object.entries(eskulCounts).map(([nama, count]) => (
                      <div key={nama} className="flex-1 flex flex-col items-center justify-end h-full">
                        {count > 0 && (
                          <span className="text-[11px] font-semibold text-gray-600 mb-1">{count}</span>
                        )}
                        <div
                          className="w-full max-w-[36px] rounded-t-[3px] transition-all"
                          style={{ 
                            height: `${(count / chartMax) * 100}%`, 
                            minHeight: count > 0 ? '4px' : '0px',
                            backgroundColor: '#4f7fa8'
                          }}
                        ></div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-start justify-between gap-2 mt-2 border-t border-gray-200 pt-2">
                    {Object.keys(eskulCounts).map((nama) => (
                      <span 
                        key={nama} 
                        className="flex-1 text-[10px] text-gray-500 text-center leading-tight truncate"
                      >
                        {nama}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-8 text-center">
              Rekapitulasi Total Pendaftaran
            </h3>
            <div className="flex items-center justify-center gap-4 mb-3">
              <span className="text-6xl font-extrabold text-gray-800">{totalSiswa}</span>
              <UserRound className="w-14 h-14 text-cyan-700" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-semibold text-gray-500 text-center mb-8">Total Siswa Terdaftar</p>
            <div className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-3.5 text-sm font-medium text-gray-600 text-center">
              dari {daftarEskul.length} Ekstrakurikuler
            </div>
          </div>
        </div>

        {/* Daftar Ekstrakurikuler - card besar */}
        <h3 className="text-lg font-bold text-gray-800 mb-4">Daftar Ekstrakurikuler</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {daftarEskul.map((eskul) => {
            const fotoSrc = eskul.foto
              ? (eskul.foto.startsWith('http')
                  ? eskul.foto
                  : `http://localhost:5000/${eskul.foto.startsWith('/') ? eskul.foto.slice(1) : eskul.foto}`)
              : null;

            return (
              <div key={eskul.id_eskul} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col justify-between">
                <div>
                  {fotoSrc ? (
                    <img
                      src={fotoSrc}
                      alt={eskul.nama_eskul}
                      className="w-12 h-12 rounded-full object-cover border border-gray-200"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className="w-12 h-12 rounded-full bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold"
                    style={{ display: fotoSrc ? 'none' : 'flex' }}
                  >
                    {(eskul.nama_eskul || 'E').charAt(0)}
                  </div>
                  <div className="mt-2">
                    <h4 className="font-bold text-gray-800 text-base">{eskul.nama_eskul}</h4>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{eskul.deskripsi || 'Tidak ada deskripsi'}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-600 space-y-1">
                  <div>
                    <span className="font-semibold text-gray-700">Pembina:</span> {eskul.pembina || 'Belum ada'}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Jadwal:</span> {eskul.jadwal || 'Belum ada'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}