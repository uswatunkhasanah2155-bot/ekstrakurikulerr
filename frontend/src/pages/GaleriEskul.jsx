// src/pages/GaleriEskul.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { getDaftarEskul, getGaleriEskul, uploadGaleriEskul, hapusGaleriEskul, setFotoUtamaGaleri, updateGaleriEskul } from '../services/api';
import { Star, Pencil } from 'lucide-react';

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
  const [settingUtama, setSettingUtama] = useState(null);

  // State untuk modal EDIT foto
  const [editTarget, setEditTarget] = useState(null);
  const [editFile, setEditFile] = useState(null);
  const [editKeterangan, setEditKeterangan] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

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

  // Menjadikan satu foto sebagai foto utama yang tampil di halaman detail eskul.
  // Ini TIDAK berubah otomatis saat ada foto baru diupload - murni pilihan admin.
  const handleJadikanUtama = async (idGaleri) => {
    setSettingUtama(idGaleri);
    const result = await setFotoUtamaGaleri(idGaleri);
    setSettingUtama(null);

    if (result.success) {
      setDaftarFoto((prev) =>
        prev.map((f) => ({ ...f, is_featured: f.id_galeri === idGaleri }))
      );
    } else {
      alert('Gagal mengatur foto utama: ' + result.error);
    }
  };

  // Buka modal edit untuk foto tertentu, isi form dengan data yang sudah ada
  const handleBukaEdit = (item) => {
    setEditTarget(item);
    setEditKeterangan(item.keterangan || '');
    setEditFile(null);
  };

  const handleTutupEdit = () => {
    setEditTarget(null);
    setEditFile(null);
    setEditKeterangan('');
  };

  const handleSimpanEdit = async (e) => {
    e.preventDefault();
    if (!editTarget) return;

    setSavingEdit(true);

    const formData = new FormData();
    formData.append('keterangan', editKeterangan);
    if (editFile) {
      formData.append('foto', editFile);
    }

    const result = await updateGaleriEskul(editTarget.id_galeri, formData);

    setSavingEdit(false);

    if (result.success) {
      const fotoData = await getGaleriEskul(currentEskulDetail.id_eskul);
      setDaftarFoto(fotoData || []);
      handleTutupEdit();
    } else {
      alert('Gagal mengupdate foto: ' + result.error);
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

        {isAdmin && daftarFoto.length > 0 && (
          <p className="text-xs text-gray-500 mb-4 -mt-2">
            Klik ikon bintang untuk foto utama, ikon pensil untuk edit foto/keterangan.
          </p>
        )}

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
                <div
                  key={item.id_galeri}
                  className={`relative group rounded-xl overflow-hidden border aspect-square bg-gray-50 ${
                    item.is_featured ? 'border-emerald-400 ring-2 ring-emerald-200' : 'border-gray-100'
                  }`}
                >
                  <img
                    src={getFotoUrl(item.foto)}
                    alt={item.keterangan || formatNamaEskul}
                    className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
                    onClick={() => setLightboxFoto(item)}
                  />

                  {item.is_featured && (
                    <div className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3 fill-white" />
                      Utama
                    </div>
                  )}

                  {isAdmin && (
                    <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleJadikanUtama(item.id_galeri)}
                        disabled={item.is_featured || settingUtama === item.id_galeri}
                        title="Jadikan foto utama"
                        className="bg-white/90 hover:bg-white text-emerald-600 text-xs font-semibold w-7 h-7 rounded-full flex items-center justify-center shadow disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Star className={`w-3.5 h-3.5 ${item.is_featured ? 'fill-emerald-500' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleBukaEdit(item)}
                        title="Edit foto/keterangan"
                        className="bg-white/90 hover:bg-white text-blue-600 text-xs font-semibold w-7 h-7 rounded-full flex items-center justify-center shadow"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleHapusFoto(item.id_galeri)}
                        className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold w-7 h-7 rounded-full flex items-center justify-center shadow"
                      >
                        ×
                      </button>
                    </div>
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
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-center items-center p-4">
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
                  placeholder="Keterangan Kegiatan"
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

      {/* MODAL EDIT FOTO */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">
                Edit Foto Galeri ({formatNamaEskul})
              </h3>
              <button
                onClick={handleTutupEdit}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSimpanEdit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Foto Saat Ini
                </label>
                <img
                  src={getFotoUrl(editTarget.foto)}
                  alt="Foto saat ini"
                  className="w-full h-40 object-cover rounded-lg border border-gray-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ganti Foto (opsional, kosongkan jika tidak ingin diganti)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditFile(e.target.files[0])}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
                {editFile && (
                  <p className="text-xs text-gray-500 mt-1">Foto baru dipilih: {editFile.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Keterangan
                </label>
                <input
                  type="text"
                  value={editKeterangan}
                  onChange={(e) => setEditKeterangan(e.target.value)}
                  placeholder="Keterangan Kegiatan"
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none bg-white focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={handleTutupEdit}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition disabled:opacity-50"
                >
                  {savingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {lightboxFoto && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex justify-center items-center p-4"
          onClick={() => setLightboxFoto(null)}
        >
          <button
            onClick={() => setLightboxFoto(null)}
            className="absolute top-4 right-4 text-gray-800 bg-white/80 hover:bg-white rounded-full w-10 h-10 flex items-center justify-center text-2xl font-bold shadow-lg transition-colors"
          >
            &times;
          </button>
          <img
            src={getFotoUrl(lightboxFoto.foto)}
            alt={lightboxFoto.keterangan || formatNamaEskul}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
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