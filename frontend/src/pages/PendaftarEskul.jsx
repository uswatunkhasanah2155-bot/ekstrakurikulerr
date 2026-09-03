// src/pages/PendaftarEskul.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { getPendaftarEskul } from '../services/api'; // sesuaikan path dengan lokasi file api.js kamu

export default function PendaftarEskul() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [dataPendaftar, setDataPendaftar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

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
      const result = await getPendaftarEskul();

      // Mapping response backend -> bentuk yang dipakai tabel
      const mapped = result.map((item) => ({
        id: item.id_pendaftaran,
        nama: item.siswa?.nama_siswa || 'Tanpa Nama',
        kelas: item.siswa?.kelas || 'Belum diisi',
        eskul: item.ekstrakurikuler?.nama_eskul || '-',
        tanggal: new Date(item.createdAt || Date.now()).toLocaleDateString('en-GB', {
          day: '2-digit', month: 'short', year: 'numeric'
        })
      }));

      // urutkan berdasarkan id agar konsisten
      mapped.sort((a, b) => a.id - b.id);

      setDataPendaftar(mapped);
      setLoading(false);
    }

    fetchData();
  }, []);

  const handleDownloadExcel = () => {
    alert("Berhasil mengunduh rekapitulasi data pendaftar dalam format Excel!");
  };

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
            📊 Download Excel
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="text-sm font-bold text-gray-800">
              📋 Rekapitulasi Siswa Terdaftar ({dataPendaftar.length} Siswa)
            </h3>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-6 text-center text-sm text-gray-500">Memuat data...</div>
            ) : errorMsg ? (
              <div className="p-6 text-center text-sm text-red-500">{errorMsg}</div>
            ) : dataPendaftar.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500">Belum ada siswa yang mendaftar.</div>
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
                  {dataPendaftar.map((pendaftar, idx) => (
                    <tr key={pendaftar.id} className="hover:bg-gray-50/50">
                      <td className="py-3 px-4 font-medium text-gray-500">{idx + 1}</td>
                      <td className="py-3 px-4 font-semibold text-gray-800">{pendaftar.nama}</td>
                      <td className="py-3 px-4 text-gray-600">{pendaftar.kelas}</td>
                      <td className="py-3 px-4">
                        <span className="bg-cyan-50 text-cyan-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                          {pendaftar.eskul}
                        </span>
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