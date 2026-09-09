// src/pages/RegistrationForm.jsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { tambahPendaftar, getDaftarEskul } from '../services/api';

export default function RegistrationForm() {
  const { namaEskul } = useParams();
  const navigate = useNavigate();
  const formatNamaEskul = namaEskul ? namaEskul.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : "Ekstrakurikuler";

  const [formData, setFormData] = useState({
    namaLengkap: '',
    kelas: '',
    jenisKelamin: '',
    foto: null // Tambahan state untuk menampung file foto
  });
  const [loading, setLoading] = useState(false);

  const daftarKelas = [
    "X RPL1", "X RPL2", "X TSM1", "X TSM2", "X ATPH",
    "XI RPL1", "XI RPL2", "XI TSM1", "XI TSM2", "XI ATPH",
    "XII RPL1", "XII RPL2", "XII TSM1", "XII TSM2", "XII ATPH"
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handler khusus untuk menangkap file gambar yang dipilih
  const handleFileChange = (e) => {
    setFormData({ ...formData, foto: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const daftarEskul = await getDaftarEskul();
      
      const slugFormatted = namaEskul ? namaEskul.trim().toLowerCase().replace(/[\s%20]+/g, '-') : '';
      
      const eskulDitemukan = daftarEskul.find(item => {
        if (!item.nama_eskul) return false;
        const dbEskulSlug = item.nama_eskul.trim().toLowerCase().replace(/[\s%20]+/g, '-');
        return dbEskulSlug === slugFormatted;
      });

      if (!eskulDitemukan) {
        alert('Ekstrakurikuler tidak ditemukan di database!');
        setLoading(false);
        return;
      }

      const rawIdUser = localStorage.getItem('id_user') || localStorage.getItem('userId');
      const userIdLogin = rawIdUser ? Number(rawIdUser) : null;

      // Ubah data menjadi FormData karena kita mengirim file/gambar
      const dataToSend = new FormData();
      dataToSend.append('id_eskul', eskulDitemukan.id_eskul);
      dataToSend.append('id_user', userIdLogin);
      dataToSend.append('nama', formData.namaLengkap);
      dataToSend.append('kelas', formData.kelas);
      dataToSend.append('jenisKelamin', formData.jenisKelamin);
      
      if (formData.foto) {
        dataToSend.append('foto', formData.foto); // Key harus sesuai dengan multer di backend ('foto')
      }

      const result = await tambahPendaftar(dataToSend);

      if (result.success) {
        alert(`Pendaftaran untuk ${formatNamaEskul} berhasil dikirim!`);
        navigate(`/eskul/${slugFormatted}`);
      } else {
        alert('Gagal mendaftar: ' + result.error);
      }
    } catch (err) {
      alert('Terjadi kesalahan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-6">
          Form Pendaftaran Ekstrakurikuler: {formatNamaEskul}
        </h2>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Nama Lengkap</label>
              <input 
                type="text" 
                name="namaLengkap"
                value={formData.namaLengkap}
                onChange={handleChange}
                required
                placeholder="Masukkan nama lengkapmu"
                className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Kelas</label>
              <select 
                name="kelas"
                value={formData.kelas}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="" disabled>Pilih Kelas</option>
                {daftarKelas.map((kls, i) => (
                  <option key={i} value={kls}>{kls}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Jenis Kelamin</label>
              <select 
                name="jenisKelamin"
                value={formData.jenisKelamin}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="" disabled>Pilih Jenis Kelamin</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>

            {/* Input File Foto Siswa */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Foto Siswa</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={handleFileChange}
                required
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                type="submit"
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                {loading ? 'Mengirim...' : 'Kirim Pendaftaran'}
              </button>
              <button 
                type="button"
                onClick={() => navigate(-1)}
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