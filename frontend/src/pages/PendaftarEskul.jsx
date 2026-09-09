// src/pages/PendaftarEskul.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { getPendaftarEskul, downloadSemuaPendaftarExcel } from '../services/api';
import { FileSpreadsheet, ClipboardList, Search } from 'lucide-react';

export default function PendaftarEskul() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [dataPendaftar, setDataPendaftar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const roleUser = localStorage.getItem('role');
    if (roleUser && roleUser.toUpperCase() === 'ADMIN') {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const result = await getPendaftarEskul();

        const grouped = {};

        result.forEach((item) => {
          const idSiswa = item.siswa?.id_siswa || item.id_siswa;
          const namaSiswa = item.siswa?.nama_siswa || 'Tanpa Nama';
          const kelasSiswa = item.siswa?.kelas || 'Belum diisi';

          const groupKey = `${namaSiswa.trim().toLowerCase()}|${kelasSiswa.trim().toLowerCase()}`;

          if (!grouped[groupKey]) {
            grouped[groupKey] = {
              id: idSiswa,
              nama: namaSiswa,
              kelas: kelasSiswa,
              eskul: [],
              tanggalTerbaru: item.tanggal ? new Date(item.tanggal) : new Date(),
            };
          }

          const namaEskul = item.ekstrakurikuler?.nama_eskul || '-';
          if (!grouped[groupKey].eskul.includes(namaEskul)) {
            grouped[groupKey].eskul.push(namaEskul);
          }

          const tanggalItem = item.tanggal ? new Date(item.tanggal) : new Date();
          if (tanggalItem > grouped[groupKey].tanggalTerbaru) {
            grouped[groupKey].tanggalTerbaru = tanggalItem;
          }
        });

        const mapped = Object.values(grouped).map((row) => ({
          ...row,
          tanggal: row.tanggalTerbaru.toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric'
          }),
        }));

        mapped.sort((a, b) => a.nama.localeCompare(b.nama));

        setDataPendaftar(mapped);
      } catch (error) {
        console.error("Error fetching data pendaftar:", error);
        setErrorMsg('Gagal memuat data pendaftar dari server.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleDownloadExcel = async () => {
    const result = await downloadSemuaPendaftarExcel();
    if (!result.success) {
      alert("Gagal mendownload Excel: " + result.error);
    }
  };

  const filteredPendaftar = dataPendaftar.filter((pendaftar) => {
    const keyword = searchQuery.toLowerCase().trim();
    if (!keyword) return true;
    return (
      pendaftar.nama.toLowerCase().includes(keyword) ||
      pendaftar.kelas.toLowerCase().includes(keyword) ||
      pendaftar.eskul.some((e) => e.toLowerCase().includes(keyword))
    );
  });

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isAdmin={isAdmin} />

      <main className="flex-1 p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Data Pendaftar Ekstrakurikuler</h2>
            <p className="text-xs text-gray-500 mt-0.5">Daftar seluruh siswa yang telah mendaftarkan diri pada kegiatan ekstrakurikuler.</p>
          </div>

          <button 
            onClick={handleDownloadExcel}
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm flex items-center gap-2 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Download Excel
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 shrink-0">
              <ClipboardList className="w-4 h-4 text-gray-600" />
              Rekapitulasi Siswa Terdaftar ({filteredPendaftar.length} Siswa)
            </h3>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama, kelas, atau eskul..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-6 text-center text-sm text-gray-500">Memuat data...</div>
            ) : errorMsg ? (
              <div className="p-6 text-center text-sm text-red-500">{errorMsg}</div>
            ) : dataPendaftar.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500">Belum ada siswa yang mendaftar.</div>
            ) : filteredPendaftar.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500">
                Tidak ditemukan hasil untuk "{searchQuery}".
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase bg-gray-50/50">
                    <th className="py-3 px-4">No</th>
                    <th className="py-3 px-4">Nama Siswa</th>
                    <th className="py-3 px-4">Kelas</th>
                    <th className="py-3 px-4">Pilihan Eskul</th>
                    <th className="py-3 px-4">Tanggal Daftar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                  {filteredPendaftar.map((pendaftar, idx) => (
                    <tr key={`${pendaftar.id}-${idx}`} className="hover:bg-gray-50/50">
                      <td className="py-3 px-4 font-medium text-gray-500">{idx + 1}</td>
                      <td className="py-3 px-4 font-semibold text-gray-800">{pendaftar.nama}</td>
                      <td className="py-3 px-4 text-gray-600">{pendaftar.kelas}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1.5">
                          {pendaftar.eskul.map((namaEskul, i) => (
                            <span
                              key={i}
                              className="bg-cyan-50 text-cyan-700 text-xs font-semibold px-2.5 py-1 rounded-full"
                            >
                              {namaEskul}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-500">{pendaftar.tanggal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}