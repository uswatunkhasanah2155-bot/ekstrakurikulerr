// src/pages/ExtracurricularDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { getSiswaByEskul, getDaftarEskul, hapusPendaftar, updatePendaftar, tambahPendaftar, getGaleriEskul } from '../services/api';
import { Search, FileSpreadsheet, ClipboardList, User, X, Pencil, Trash2, Plus } from 'lucide-react';

export default function ExtracurricularDetail() {
  const { namaEskul } = useParams();
  const navigate = useNavigate();

  const cleanNamaEskul = namaEskul ? namaEskul.replace(/-/g, ' ') : '';
  const formatNamaEskul = cleanNamaEskul
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const [isAdmin, setIsAdmin] = useState(false); 
  const [siswaTerdaftar, setSiswaTerdaftar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentIdPendaftaran, setCurrentIdPendaftaran] = useState(null);
  const [currentIdSiswa, setCurrentIdSiswa] = useState(null); 

  const [daftarEskulOptions, setDaftarEskulOptions] = useState([]);
  const [currentEskulDetail, setCurrentEskulDetail] = useState(null);
  const [fotoUtamaGaleri, setFotoUtamaGaleri] = useState(null);

  const [formData, setFormData] = useState({ 
    nama: '', 
    kelas: '', 
    jenisKelamin: '',
    id_eskul: '',
    id_user: null,
    foto: null
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
      const siswaData = await getSiswaByEskul(cleanNamaEskul);
      setSiswaTerdaftar(siswaData || []);

      const eskulData = await getDaftarEskul();
      const listEskul = eskulData.data || eskulData || [];
      setDaftarEskulOptions(listEskul);

      const matchedEskul = listEskul.find(
        (item) => item.nama_eskul && item.nama_eskul.toLowerCase().trim() === cleanNamaEskul.toLowerCase().trim()
      );
      setCurrentEskulDetail(matchedEskul || null);

      if (matchedEskul) {
        const fotoGaleri = await getGaleriEskul(matchedEskul.id_eskul);
        const fotoUtama = (fotoGaleri || []).find((item) => item.is_featured);
        setFotoUtamaGaleri(fotoUtama || null);
      }

      setLoading(false);
    }
    fetchData();
  }, [namaEskul, cleanNamaEskul]);

  const handleDaftarSiswa = () => {
    navigate(`/eskul/${namaEskul}/daftar`);
  };

  const handleLihatGaleri = () => {
    navigate(`/eskul/${namaEskul}/galeri`);
  };

  const handleDownloadExcel = () => {
    window.open(`http://localhost:5000/api/eskul/slug/${namaEskul}/download`, '_blank');
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
    setCurrentIdSiswa(siswa.id_siswa); 
    
    const currentEskul = daftarEskulOptions.find(e => e.nama_eskul.toLowerCase().trim() === cleanNamaEskul.toLowerCase().trim());
    const userIdLogin = localStorage.getItem('id_user') || localStorage.getItem('userId');

    setFormData({
      nama: siswa.nama,
      kelas: siswa.kelas,
      jenisKelamin: siswa.jenisKelamin === 'P' ? 'Perempuan' : 'Laki-laki',
      id_eskul: currentEskul ? currentEskul.id_eskul : '',
      id_user: userIdLogin ? Number(userIdLogin) : null,
      foto: null 
    });
    setIsModalOpen(true);
  };

  const handleOpenTambah = () => {
    setIsEditMode(false);
    setCurrentIdPendaftaran(null);
    setCurrentIdSiswa(null);

    const currentEskul = daftarEskulOptions.find(e => e.nama_eskul.toLowerCase().trim() === cleanNamaEskul.toLowerCase().trim());
    const userIdLogin = localStorage.getItem('id_user') || localStorage.getItem('userId');

    setFormData({ 
      nama: '', 
      kelas: '', 
      jenisKelamin: '', 
      id_eskul: currentEskul ? currentEskul.id_eskul : '',
      id_user: userIdLogin ? Number(userIdLogin) : null,
      foto: null
    });
    setIsModalOpen(true);
  };

  const handleSimpanSiswa = async (e) => {
    e.preventDefault();

    const currentEskul = daftarEskulOptions.find(e => e.nama_eskul.toLowerCase().trim() === cleanNamaEskul.toLowerCase().trim());
    const id_eskul_sekarang = currentEskul ? currentEskul.id_eskul : formData.id_eskul;
    const userIdLogin = localStorage.getItem('id_user') || localStorage.getItem('userId');

    const dataToSend = new FormData();
    dataToSend.append('id_eskul', id_eskul_sekarang);
    dataToSend.append('nama_siswa', formData.nama);
    dataToSend.append('kelas', formData.kelas);
    dataToSend.append('jenis_kelamin', formData.jenisKelamin === 'Perempuan' ? 'P' : 'L');
    dataToSend.append('id_user', formData.id_user || (userIdLogin ? Number(userIdLogin) : ''));

    if (formData.foto) {
      dataToSend.append('foto', formData.foto);
    }

    if (isEditMode) {
      const result = await updatePendaftar(
        currentIdPendaftaran, 
        id_eskul_sekarang, 
        currentIdSiswa, 
        dataToSend 
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
      const result = await tambahPendaftar(dataToSend);
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

  const filteredSiswa = siswaTerdaftar.filter((siswa) => {
    const keyword = searchQuery.toLowerCase().trim();
    if (!keyword) return true;
    return (
      siswa.nama?.toLowerCase().includes(keyword) ||
      siswa.kelas?.toLowerCase().includes(keyword)
    );
  });

  return (
    <div className="flex min-h-screen bg-gray-50 relative">
      <Sidebar isAdmin={isAdmin} />

      <main className="flex-1 p-6 overflow-y-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            Detail Ekstrakurikuler: {formatNamaEskul}
          </h2>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button 
                onClick={handleDownloadExcel}
                className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm flex items-center gap-2 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Download Excel ({formatNamaEskul})
              </button>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row gap-6">
         <div className="w-full md:w-1/3 aspect-square max-w-[220px] max-h-[220px] mx-auto md:mx-0 bg-white rounded-lg overflow-hidden flex items-center justify-center text-gray-400 font-medium shrink-0 border border-gray-100">
            {currentEskulDetail?.foto ? (
              <img 
                src={
                  currentEskulDetail.foto.startsWith('http') 
                    ? currentEskulDetail.foto 
                    : `http://localhost:5000/${currentEskulDetail.foto.startsWith('/') ? currentEskulDetail.foto.slice(1) : currentEskulDetail.foto}`
                } 
                alt={formatNamaEskul} 
                className="w-full h-full object-contain"
                onError={(e) => { e.target.style.display = 'none'; }} 
              />
            ) : (
              <span>Foto / Banner {formatNamaEskul}</span>
            )}
         </div>

          <div className="flex-1 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">
                {currentEskulDetail?.nama_eskul || `Eskul ${formatNamaEskul}`}
              </h3>
              <p className="text-xs text-gray-500 mb-3 font-medium">
                Pembina: {currentEskulDetail?.pembina || 'Belum ditentukan'}
              </p>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                {currentEskulDetail?.deskripsi || `Program latihan untuk pengembangan skill ${formatNamaEskul.toLowerCase()}, strategi tim, dan partisipasi kompetisi antar sekolah.`}
              </p>
              <div className="text-xs text-gray-700 font-medium bg-gray-50 p-3 rounded-lg border border-gray-100 mb-4">
                <span className="font-bold">Jadwal:</span> {currentEskulDetail?.jadwal || 'Belum diatur'}
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
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors shadow-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Daftar Eskul Ini
                </button>
              )}
            </div>
          </div>

          {fotoUtamaGaleri ? (
            <button
              type="button"
              onClick={handleLihatGaleri}
              className="relative hidden md:block w-[360px] h-52 self-center rounded-lg overflow-hidden group cursor-pointer shrink-0"
            >
              <img
                src={
                  fotoUtamaGaleri.foto.startsWith('http')
                    ? fotoUtamaGaleri.foto
                    : `http://localhost:5000/${fotoUtamaGaleri.foto.startsWith('/') ? fotoUtamaGaleri.foto.slice(1) : fotoUtamaGaleri.foto}`
                }
                alt=""
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(90deg, white 0%, rgba(255,255,255,0) 25%)' }}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              <span className="absolute bottom-2 right-2.5 text-[11px] text-white/90 bg-black/25 px-2 py-0.5 rounded-md">
                Kegiatan terbaru
              </span>
            </button>
          ) : (
            isAdmin && (
              <button
                type="button"
                onClick={handleLihatGaleri}
                className="hidden md:flex w-[360px] h-52 self-center rounded-lg border-2 border-dashed border-gray-200 items-center justify-center text-gray-400 hover:text-emerald-600 hover:border-emerald-300 transition-colors text-sm font-medium shrink-0 text-center px-4"
              >
                Belum ada foto utama.<br />Pilih di halaman Galeri Foto →
              </button>
            )
          )}
        </div>

        {isModalOpen && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">
                {isEditMode ? `Edit Data Siswa (${formatNamaEskul})` : `Tambah Siswa Manual (${formatNamaEskul})`}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSimpanSiswa} className="p-5 space-y-4 max-w-md">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isEditMode ? 'Foto' : 'Foto Siswa'}
                </label>
                <input 
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({...formData, foto: e.target.files[0]})}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
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
                  {isEditMode ? 'Simpan Perubahan' : 'Daftarkan Siswa'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 shrink-0">
              <ClipboardList className="w-4 h-4 text-gray-600" />
              Daftar Siswa Terdaftar ({filteredSiswa.length} Siswa)
            </h3>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama siswa..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              {isAdmin && (
                <button 
                  onClick={handleOpenTambah}
                  className="bg-emerald-600 text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-emerald-700 transition-colors whitespace-nowrap flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Siswa Manual
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-6 text-center text-gray-500 text-sm">Memuat data siswa dari backend...</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase bg-gray-50/50">
                    <th className="py-3 px-4">No</th>
                    <th className="py-3 px-4">Foto</th>
                    <th className="py-3 px-4">Nama Siswa</th>
                    <th className="py-3 px-4">Kelas</th>
                    <th className="py-3 px-4">Jenis Kelamin</th>
                    <th className="py-3 px-4">Tanggal Daftar</th>
                    {isAdmin && <th className="py-3 px-4 text-center">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                  {filteredSiswa.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 7 : 6} className="py-4 text-center text-gray-400">
                        {searchQuery
                          ? `Tidak ditemukan siswa dengan kata kunci "${searchQuery}".`
                          : 'Belum ada siswa yang terdaftar di ekstrakurikuler ini.'}
                      </td>
                    </tr>
                  ) : (
                    filteredSiswa.map((siswa, idx) => (
                      <tr key={siswa.id} className="hover:bg-gray-50/50">
                        <td className="py-3 px-4 font-medium text-gray-500">{idx + 1}</td>
                        
                        <td className="py-3 px-4">
                          {siswa.foto ? (
                            <img 
                              src={
                                siswa.foto.startsWith('http') 
                                  ? siswa.foto 
                                  : `http://localhost:5000/${siswa.foto.startsWith('/') ? siswa.foto.slice(1) : siswa.foto}`
                              } 
                              alt={siswa.nama} 
                              className="w-19 h-19 object-cover rounded-full border-2 border-gray-200 shadow-sm"
                              onError={(e) => { 
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }} 
                            />
                          ) : null}
                          <div
                            className="w-19 h-19 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center text-gray-400"
                            style={{ display: siswa.foto ? 'none' : 'flex' }}
                          >
                            <User className="w-5 h-5" />
                          </div>
                        </td>

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
                              className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-md font-medium hover:bg-blue-100 inline-flex items-center gap-1"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Edit
                            </button>
                            <button 
                              onClick={() => handleHapusSiswa(siswa.id)}
                              className="text-xs bg-red-50 text-red-600 px-2.5 py-1 rounded-md font-medium hover:bg-red-100 inline-flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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

    </div>
  );
}