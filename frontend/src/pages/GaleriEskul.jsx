// src/pages/GaleriEskul.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { getDaftarEskul, getGaleriEskul, uploadGaleriEskul, hapusGaleriEskul } from '../services/api';

export default function GaleriEskul() {
  const { namaEskul } = useParams();
  const navigate = useNavigate();

  const cleanNamaEskul = namaEskul ? namaEskul.replace(/-/g, ' ') : '';
  const formatNamaEskul = cleanNamaEskul
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentEskulDetail, setCurrentEskulDetail] = useState(null);
  const [daftarFoto, setDaftarFoto] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [keterangan, setKeterangan] = useState('');
  const [uploading, setUploading] = useState(false);

  const [lightboxFoto, setLightboxFoto] = useState(null);

  useEffect(() => {
    const roleUser = localStorage.getItem('role');
    if (roleUser && roleUser.toUpperCase() === 'ADMIN') {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }

    async function fetchData() {
      setLoading(true);

      const eskulData = await getDaftarEskul();
      const listEskul = eskulData.data || eskulData || [];

      const matchedEskul = listEskul.find(
        (item) => item.nama_eskul && item.nama_eskul.toLowerCase().trim() === cleanNamaEskul.toLowerCase().trim()
      );
      setCurrentEskulDetail(matchedEskul || null);

      if (matchedEskul) {
        const fotoData = await getGaleriEskul(matchedEskul.id_eskul);
        setDaftarFoto(fotoData || []);
      }

      setLoading(false);
    }
    fetchData();
  }, [namaEskul, cleanNamaEskul]);

  const handlePilihFile = (e) => {
    setFileList(Array.from(e.target.files));
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!currentEskulDetail) return;
    if (fileList.length === 0) {
      alert('Pilih minimal 1 foto terlebih dahulu!');
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append('id_eskul', currentEskulDetail.id_eskul);
    if (keterangan) {
      formData.append('keterangan', keterangan);
    }
    fileList.forEach((file) => {
      formData.append('foto', file);
    });

    const result = await uploadGaleriEskul(formData);

    setUploading(false);

    if (result.success) {
      alert(`Berhasil upload ${fileList.length} foto!`);
      const fotoData = await getGaleriEskul(currentEskulDetail.id_eskul);
      setDaftarFoto(fotoData || []);
      setIsModalOpen(false);
      setFileList([]);
      setKeterangan('');
    } else {
      alert('Gagal upload foto: ' + result.error);
    }
  };

  const handleHapusFoto = async (idGaleri) => {
    if (window.confirm('Yakin ingin menghapus foto ini dari galeri?')) {
      const result = await hapusGaleriEskul(idGaleri);
      if (result.success) {
        setDaftarFoto((prev) => prev.filter((f) => f.id_galeri !== idGaleri));
      } else {
        alert('Gagal menghapus foto: ' + result.error);
      }
    }
  };

  const getFotoUrl = (foto) => {
    if (!foto) return null;
    return foto.startsWith('http')
      ? foto
      : `http://localhost:5000/${foto.startsWith('/') ? foto.slice(1) : foto}`;
  };

  return (
    <div className="flex min-h-screen bg-gray-50 relative">
      <Sidebar isAdmin={isAdmin} />

      <main className="flex-1 p-6 overflow-y-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <button
              onClick={() => navigate(`/eskul/${namaEskul}`)}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold mb-1 inline-flex items-center gap-1"
            >
              ← Kembali ke Detail Eskul
            </button>
            <h2 className="text-xl font-bold text-gray-800">
              Galeri Foto: {formatNamaEskul}
            </h2>
          </div>

          {isAdmin && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm flex items-center gap-2 transition-colors"
            >
              + Upload Foto
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {loading ? (
            <div className="p-6 text-center text-gray-500 text-sm">Memuat galeri dari backend...</div>
          ) : daftarFoto.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <span className="text-4xl mb-2">📷</span>
              <p className="text-sm">Belum ada foto di galeri {formatNamaEskul}.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {daftarFoto.map((item) => (
                <div key={item.id_galeri} className="relative group rounded-xl overflow-hidden border border-gray-100 aspect-square bg-gray-50">
                  <img
                    src={getFotoUrl(item.foto)}
                    alt={item.keterangan || formatNamaEskul}
                    className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
                    onClick={() => setLightboxFoto(item)}
                  />
                  {isAdmin && (
                    <button
                      onClick={() => handleHapusFoto(item.id_galeri)}
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  )}
                  {item.keterangan && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1 truncate">
                      {item.keterangan}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">
                Upload Foto Galeri ({formatNamaEskul})
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pilih Foto (bisa lebih dari satu)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePilihFile}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
                {fileList.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">{fileList.length} foto dipilih</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Keterangan (opsional)
                </label>
                <input
                  type="text"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="Misal: Latihan rutin Sabtu"
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none bg-white focus:ring-emerald-500 focus:border-emerald-500"
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
                  disabled={uploading}
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition disabled:opacity-50"
                >
                  {uploading ? 'Mengupload...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {lightboxFoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 z-50 flex justify-center items-center p-4"
          onClick={() => setLightboxFoto(null)}
        >
          <button
            onClick={() => setLightboxFoto(null)}
            className="absolute top-4 right-4 text-white text-3xl font-bold hover:text-gray-300"
          >
            &times;
          </button>
          <img
            src={getFotoUrl(lightboxFoto.foto)}
            alt={lightboxFoto.keterangan || formatNamaEskul}
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          {lightboxFoto.keterangan && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/60 text-white text-sm px-4 py-2 rounded-lg">
              {lightboxFoto.keterangan}
            </div>
          )}
        </div>
      )}
    </div>
  );
}