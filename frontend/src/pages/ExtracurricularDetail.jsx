// src/pages/ExtracurricularDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { getSiswaByEskul, getDaftarEskul, hapusPendaftar, getGaleriEskul } from '../services/api';
import { Search, FileSpreadsheet, ClipboardList, User, Pencil, Trash2, Plus } from 'lucide-react';

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

  const [daftarEskulOptions, setDaftarEskulOptions] = useState([]);
  const [currentEskulDetail, setCurrentEskulDetail] = useState(null);
  const [fotoUtamaGaleri, setFotoUtamaGaleri] = useState(null);

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

  const handleTambahSiswa = () => {
    navigate(`/eskul/${namaEskul}/siswa/tambah`);
  };

  const handleEditSiswa = (siswa) => {
    navigate(`/eskul/${namaEskul}/siswa/edit/${siswa.id}`);
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
              className="relative hidden md:block w-[360px] self-stretch rounded-lg overflow-hidden group cursor-pointer shrink-0"
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
                className="hidden md:flex w-[360px] self-stretch rounded-lg border-2 border-dashed border-gray-200 items-center justify-center text-gray-400 hover:text-emerald-600 hover:border-emerald-300 transition-colors text-sm font-medium shrink-0 text-center px-4"
              >
                Belum ada foto utama. Pilih di halaman Galeri Foto →
              </button>
            )
          )}
        </div>

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
                  onClick={handleTambahSiswa}
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
                              className="w-20 h-20 object-cover rounded-full border-2 border-gray-200 shadow-sm"
                              onError={(e) => { 
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div
                            className="w-14 h-14 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center text-gray-400"
                            style={{ display: siswa.foto ? 'none' : 'flex' }}
                          >
                            <User className="w-6 h-6" />
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
                              onClick={() => handleEditSiswa(siswa)}
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