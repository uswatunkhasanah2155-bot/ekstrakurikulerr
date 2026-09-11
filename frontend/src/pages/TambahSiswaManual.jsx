// src/pages/TambahSiswaManual.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { getDaftarEskul, tambahPendaftar } from '../services/api';
import { ArrowLeft } from 'lucide-react';

export default function TambahSiswaManual() {
  const { namaEskul } = useParams();
  const navigate = useNavigate();

  const cleanNamaEskul = namaEskul ? namaEskul.replace(/-/g, ' ') : '';
  const formatNamaEskul = cleanNamaEskul
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const [isAdmin, setIsAdmin] = useState(false);
  const [currentEskul, setCurrentEskul] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    nama: '',
    kelas: '',
    jenisKelamin: '',
    foto: null
  });

  const daftarKelas = [
    "X RPL1", "X RPL2", "X TSM1", "X TSM2", "X ATPH",
    "XI RPL1", "XI RPL2", "XI TSM1", "XI TSM2", "XI ATPH",
    "XII RPL1", "XII RPL2", "XII TSM1", "XII TSM2", "XII ATPH"
  ];

  useEffect(() => {
    const roleUser = localStorage.getItem('role');
    setIsAdmin(!!(roleUser && roleUser.toUpperCase() === 'ADMIN'));

    async function fetchData() {
      const eskulData = await getDaftarEskul();
      const listEskul = eskulData.data || eskulData || [];
      const matched = listEskul.find(
        (item) => item.nama_eskul && item.nama_eskul.toLowerCase().trim() === cleanNamaEskul.toLowerCase().trim()
      );
      setCurrentEskul(matched || null);
    }
    fetchData();
  }, [namaEskul, cleanNamaEskul]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const userIdLogin = localStorage.getItem('id_user') || localStorage.getItem('userId');

    const dataToSend = new FormData();
    dataToSend.append('id_eskul', currentEskul ? currentEskul.id_eskul : '');
    dataToSend.append('nama_siswa', formData.nama);
    dataToSend.append('kelas', formData.kelas);
    dataToSend.append('jenis_kelamin', formData.jenisKelamin === 'Perempuan' ? 'P' : 'L');
    dataToSend.append('id_user', userIdLogin ? Number(userIdLogin) : '');

    if (formData.foto) {
      dataToSend.append('foto', formData.foto);
    }

    const result = await tambahPendaftar(dataToSend);

    setLoading(false);

    if (result.success) {
      alert("Berhasil mendaftarkan siswa ke eskul!");
      navigate(`/eskul/${namaEskul}`);
    } else {
      alert('Gagal menyimpan data: ' + result.error);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 relative">
      <Sidebar isAdmin={isAdmin} />

      <main className="flex-1 p-6 overflow-y-auto">
        <button
          onClick={() => navigate(`/eskul/${namaEskul}`)}
          className="text-sm text-gray-500 hover:text-emerald-600 font-medium inline-flex items-center gap-1.5 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Detail Eskul
        </button>

        <h2 className="text-xl font-bold text-gray-800 mb-6">
          Tambah Siswa Manual: {formatNamaEskul}
        </h2>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Siswa</label>
              <input
                type="text"
                required
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none bg-white focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Masukkan nama lengkap"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
              <select
                value={formData.kelas}
                onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                required
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
              >
                <option value="" disabled>Pilih Kelas</option>
                {daftarKelas.map((kls, i) => (
                  <option key={i} value={kls}>{kls}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label>
              <select
                value={formData.jenisKelamin}
                onChange={(e) => setFormData({ ...formData, jenisKelamin: e.target.value })}
                required
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
              >
                <option value="" disabled>Pilih Jenis Kelamin</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Foto Siswa</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFormData({ ...formData, foto: e.target.files[0] })}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                {loading ? 'Mengirim...' : 'Daftarkan Siswa'}
              </button>
              <button
                type="button"
                onClick={() => navigate(`/eskul/${namaEskul}`)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}