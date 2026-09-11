// src/pages/GaleriUploadFoto.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { getDaftarEskul, uploadGaleriEskul } from '../services/api';
import { ArrowLeft } from 'lucide-react';

export default function GaleriUploadFoto() {
  const { namaEskul } = useParams();
  const navigate = useNavigate();

  const cleanNamaEskul = namaEskul ? namaEskul.replace(/-/g, ' ') : '';
  const formatNamaEskul = cleanNamaEskul
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const [isAdmin, setIsAdmin] = useState(false);
  const [currentEskulDetail, setCurrentEskulDetail] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [keterangan, setKeterangan] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const roleUser = localStorage.getItem('role');
    setIsAdmin(!!(roleUser && roleUser.toUpperCase() === 'ADMIN'));

    async function fetchData() {
      const eskulData = await getDaftarEskul();
      const listEskul = eskulData.data || eskulData || [];
      const matchedEskul = listEskul.find(
        (item) => item.nama_eskul && item.nama_eskul.toLowerCase().trim() === cleanNamaEskul.toLowerCase().trim()
      );
      setCurrentEskulDetail(matchedEskul || null);
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
      navigate(`/eskul/${namaEskul}/galeri`);
    } else {
      alert('Gagal upload foto: ' + result.error);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 relative">
      <Sidebar isAdmin={isAdmin} />

      <main className="flex-1 p-6 overflow-y-auto">
        <button
          onClick={() => navigate(`/eskul/${namaEskul}/galeri`)}
          className="text-sm text-gray-500 hover:text-emerald-600 font-medium inline-flex items-center gap-1.5 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Galeri {formatNamaEskul}
        </button>

        <h2 className="text-xl font-bold text-gray-800 mb-6">
          Upload Foto Galeri: {formatNamaEskul}
        </h2>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-lg">
          <form onSubmit={handleUpload} className="space-y-4">
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

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={uploading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                {uploading ? 'Mengupload...' : 'Upload'}
              </button>
              <button
                type="button"
                onClick={() => navigate(`/eskul/${namaEskul}/galeri`)}
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