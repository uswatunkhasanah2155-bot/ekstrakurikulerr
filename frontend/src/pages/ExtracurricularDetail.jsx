// src/pages/ExtracurricularDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { getSiswaByEskul, getDaftarEskul, hapusPendaftar, updatePendaftar, tambahPendaftar } from '../services/api';

export default function ExtracurricularDetail() {
  const { namaEskul } = useParams();
  const navigate = useNavigate();

  // Ubah slug URL (misal: "seni-tari") menjadi teks normal ("seni tari") lalu kapitalisasi tiap kata
  const cleanNamaEskul = namaEskul ? namaEskul.replace(/-/g, ' ') : '';
  const formatNamaEskul = cleanNamaEskul
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const [isAdmin, setIsAdmin] = useState(false); 
  const [siswaTerdaftar, setSiswaTerdaftar] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentIdPendaftaran, setCurrentIdPendaftaran] = useState(null);

  const [daftarEskulOptions, setDaftarEskulOptions] = useState([]);
  const [formData, setFormData] = useState({ 
    nama: '', 
    kelas: '', 
    jenisKelamin: '',
    id_eskul: '' 
  });

  const daftarKelas = [
    "X RPL1", "X RPL2", "X TSM1", "X TSM2", "X ATPH",
    "XI RPL1", "XI RPL2", "XI TSM1", "XI TSM2", "XI ATPH",
    "XII RPL1", "XII RPL2", "XII TSM1", "XII TSM2", "XII ATPH"
  ];

  useEffect(() => {
    const roleUser = localStorage.getItem('role');
    
    if (roleUser && roleUser.toUpperCase() === 'ADMIN') {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }

    async function fetchData() {
      setLoading(true);
      // Kirim nama bersih (tanpa strip) ke API pemanggil data siswa
      const siswaData = await getSiswaByEskul(cleanNamaEskul);
      setSiswaTerdaftar(siswaData || []);

      const eskulData = await getDaftarEskul();
      setDaftarEskulOptions(eskulData || []);

      setLoading(false);
    }
    fetchData();
  }, [namaEskul, cleanNamaEskul]);

  const handleDaftarSiswa = () => {
    navigate(`/eskul/${namaEskul}/daftar`);
  };

  const handleDownloadExcel = () => {
    alert(`Berhasil mengunduh rekapitulasi data ${formatNamaEskul} dalam format Excel!`);
  };

  const handleHapusSiswa = async (id) => {
    if (window.confirm("Yakin ingin menghapus data siswa ini dari eskul?")) {
      const result = await hapusPendaftar(id);
      if (result.success) {
        alert("Berhasil menghapus data siswa dari eskul!");
        const updatedData = await getSiswaByEskul(cleanNamaEskul);
        setSiswaTerdaftar(updatedData || []);
      } else {
        alert("Gagal menghapus data: " + result.error);
      }
    }
  };

  const handleOpenEdit = (siswa) => {
    setIsEditMode(true);
    setCurrentIdPendaftaran(siswa.id);
    
    const currentEskul = daftarEskulOptions.find(e => e.nama_eskul.toLowerCase().trim() === cleanNamaEskul.toLowerCase().trim());

    setFormData({
      nama: siswa.nama,
      kelas: siswa.kelas,
      jenisKelamin: siswa.jenisKelamin === 'P' ? 'Perempuan' : 'Laki-laki',
      id_eskul: currentEskul ? currentEskul.id_eskul : ''
    });
    setIsModalOpen(true);
  };

  const handleOpenTambah = () => {
    setIsEditMode(false);
    setCurrentIdPendaftaran(null);

    const currentEskul = daftarEskulOptions.find(e => e.nama_eskul.toLowerCase().trim() === cleanNamaEskul.toLowerCase().trim());

    setFormData({ 
      nama: '', 
      kelas: '', 
      jenisKelamin: '', 
      id_eskul: currentEskul ? currentEskul.id_eskul : '' 
    });
    setIsModalOpen(true);
  };

  const handleSimpanSiswa = async (e) => {
    e.preventDefault();

    const currentEskul = daftarEskulOptions.find(e => e.nama_eskul.toLowerCase().trim() === cleanNamaEskul.toLowerCase().trim());
    const id_eskul_sekarang = currentEskul ? currentEskul.id_eskul : formData.id_eskul;

    if (isEditMode) {
      const siswaDipilih = siswaTerdaftar.find(s => s.id === currentIdPendaftaran);
      
      const result = await updatePendaftar(
        currentIdPendaftaran, 
        id_eskul_sekarang, 
        siswaDipilih?.id_siswa, 
        { 
          nama: formData.nama,
          kelas: formData.kelas,
          jenis_kelamin: formData.jenisKelamin === 'Perempuan' ? 'P' : 'L'
        }
      );

      if (result.success) {
        alert("Berhasil memperbarui data siswa!");
        const updatedData = await getSiswaByEskul(cleanNamaEskul);
        setSiswaTerdaftar(updatedData || []);
        setIsModalOpen(false);
      } else {
        alert("Gagal memperbarui data: " + result.error);
      }
    } else {
      const dataKirim = {
        ...formData,
        id_eskul: id_eskul_sekarang
      };

      const result = await tambahPendaftar(dataKirim);
      if (result.success) {
        alert("Berhasil mendaftarkan siswa ke eskul!");
        const updatedData = await getSiswaByEskul(cleanNamaEskul);
        setSiswaTerdaftar(updatedData || []);
        setIsModalOpen(false);
      } else {
        alert("Gagal menyimpan data ke backend: " + result.error);
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 relative">
      <Sidebar isAdmin={isAdmin} />

      <main className="flex-1 p-6 overflow-y-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            Detail Ekstrakurikuler: {formatNamaEskul}
          </h2>

          {isAdmin && (
            <button 
              onClick={handleDownloadExcel}
              className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm flex items-center gap-2 transition-colors"
            >
              📊 Download Excel ({formatNamaEskul})
            </button>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/3 h-48 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 font-medium shrink-0">
            <span>Foto / Banner {formatNamaEskul}</span>
          </div>

          <div className="flex-1 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">Eskul {formatNamaEskul}</h3>
              <p className="text-xs text-gray-500 mb-3 font-medium">Pembina: Bp. Budi Santoso, M.Pd.</p>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                Program latihan untuk pengembangan skill {formatNamaEskul.toLowerCase()}, strategi tim, dan partisipasi kompetisi antar sekolah.
              </p>
              <div className="text-xs text-gray-700 font-medium bg-gray-50 p-3 rounded-lg border border-gray-100 mb-4">
                <span className="font-bold">Jadwal:</span> Selasa & Kamis, 15:30 - 17:30 WIB.
              </div>
            </div>

            <div>
              {isAdmin ? (
                <div className="flex gap-2">
                  <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-2 rounded-lg border border-emerald-200 flex items-center">
                      Mode Admin: Hak Akses CRUD Aktif
                  </span>
                </div>
              ) : (
                <button 
                  onClick={handleDaftarSiswa}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors shadow-sm"
                >
                  + Daftar Eskul Ini
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              📋 Daftar Siswa Terdaftar ({siswaTerdaftar.length} Siswa)
            </h3>
            {isAdmin && (
              <button 
                onClick={handleOpenTambah}
                className="bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                + Tambah Siswa Manual
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-6 text-center text-gray-500 text-sm">Memuat data siswa dari backend...</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase bg-gray-50/50">
                    <th className="py-3 px-4">No</th>
                    <th className="py-3 px-4">Nama Siswa</th>
                    <th className="py-3 px-4">Kelas</th>
                    <th className="py-3 px-4">Jenis Kelamin</th>
                    <th className="py-3 px-4">Tanggal Daftar</th>
                    {isAdmin && <th className="py-3 px-4 text-center">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                  {siswaTerdaftar.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 6 : 5} className="py-4 text-center text-gray-400">
                        Belum ada siswa yang terdaftar di ekstrakurikuler ini.
                      </td>
                    </tr>
                  ) : (
                    siswaTerdaftar.map((siswa, idx) => (
                      <tr key={siswa.id} className="hover:bg-gray-50/50">
                        <td className="py-3 px-4 font-medium text-gray-500">{idx + 1}</td>
                        <td className="py-3 px-4 font-semibold text-gray-800">{siswa.nama}</td>
                        <td className="py-3 px-4 text-gray-600">{siswa.kelas}</td>
                        <td className="py-3 px-4 text-gray-600">
                          {siswa.jenisKelamin === 'P' ? 'Perempuan' : 'Laki-laki'}
                        </td>
                        <td className="py-3 px-4 text-gray-500">{siswa.tanggal || 'Baru saja'}</td>
                        {isAdmin && (
                          <td className="py-3 px-4 text-center space-x-2">
                            <button 
                              onClick={() => handleOpenEdit(siswa)}
                              className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-md font-medium hover:bg-blue-100"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleHapusSiswa(siswa.id)}
                              className="text-xs bg-red-50 text-red-600 px-2.5 py-1 rounded-md font-medium hover:bg-red-100"
                            >
                              Hapus
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </main>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">
                {isEditMode ? `Edit Data Siswa (${formatNamaEskul})` : `Tambah Siswa Manual (${formatNamaEskul})`}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSimpanSiswa} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Siswa</label>
                <input 
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({...formData, nama: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none bg-white focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Masukkan nama lengkap"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                <select
                  value={formData.kelas}
                  onChange={(e) => setFormData({...formData, kelas: e.target.value})}
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
                  onChange={(e) => setFormData({...formData, jenisKelamin: e.target.value})}
                  required
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                >
                  <option value="" disabled>Pilih Jenis Kelamin</option>
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>

              <div className="pt-2 flex gap-3 justify-end">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition"
                >
                  {isEditMode ? 'Simpan Perubahan' : 'Simpan ke Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}