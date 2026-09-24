// src/pages/GaleriEskul.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import {
  getDaftarEskul,
  getGaleriEskul,
  hapusGaleriEskul,
} from '../services/api';
import {
  Award,
  Pencil,
  Trash2,
  Image as ImageIcon,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';

export default function GaleriEskul() {
  const { namaEskul } = useParams();
  const navigate = useNavigate();

  const cleanNamaEskul = namaEskul
    ? namaEskul.replace(/-/g, ' ')
    : '';

  const formatNamaEskul = cleanNamaEskul
    .split(' ')
    .map(
      word =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(' ');

  const [isAdmin, setIsAdmin] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentEskulDetail, setCurrentEskulDetail] = useState(null);
  const [daftarFoto, setDaftarFoto] = useState([]);
  
  // State untuk filter kategori aktif
  const [activeTab, setActiveTab] = useState('Semua');

  const [settingUtama, setSettingUtama] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [editFile, setEditFile] = useState(null);
  const [editKeterangan, setEditKeterangan] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    const roleUser = (
      localStorage.getItem('role') || ''
    ).toUpperCase();

    setIsAdmin(roleUser === 'ADMIN');
    setIsStaff(
      roleUser === 'ADMIN' ||
      roleUser === 'PEMBINA'
    );

    async function fetchData() {
      setLoading(true);
      
      try {
        const eskulData = await getDaftarEskul();
        const listEskul = eskulData.data || eskulData || [];

        const matchedEskul = listEskul.find(
          item =>
            item.nama_eskul &&
            item.nama_eskul.toLowerCase().trim() ===
              cleanNamaEskul.toLowerCase().trim()
        );

        setCurrentEskulDetail(matchedEskul || null);

        // Fungsi pendeteksi kategori otomatis dari teks keterangan
        const deteksiKategori = (teks) => {
          if (!teks) return 'Lainnya';
          const t = teks.toLowerCase();
          if (t.includes('upacara') || t.includes('bendera')) return 'Upacara';
          if (t.includes('latih') || t.includes('pbb') || t.includes('pelantikan') || t.includes('baris')) return 'Pelatihan';
          if (t.includes('kegiatan') || t.includes('perkemahan') || t.includes('bersama') || t.includes('jelajah') || t.includes('alam')) return 'Kegiatan';
          return 'Lainnya';
        };

        let fotoData = [];
        if (matchedEskul) {
          try {
            fotoData = await getGaleriEskul(matchedEskul.id_eskul);
          } catch (err) {
            console.log("Belum ada data dari API, menggunakan data dummy.");
          }
        }

        // Jika data dari backend kosong, kita gunakan data dummy lengkap
        if (!fotoData || fotoData.length === 0) {
          const dummyData = [
            {
              id_galeri: 1,
              foto: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&q=80&w=600',
              keterangan: 'Foto Bersama Peserta Kegiatan',
              created_at: '2025-08-12',
              is_featured: true
            },
            {
              id_galeri: 2,
              foto: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&q=80&w=600',
              keterangan: 'Upacara Pembukaan Ekstrakurikuler',
              created_at: '2025-08-10',
              is_featured: false
            },
            {
              id_galeri: 3,
              foto: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80&w=600',
              keterangan: 'Kegiatan Perkemahan Akhir Tahun',
              created_at: '2025-08-08',
              is_featured: false
            },
            {
              id_galeri: 4,
              foto: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=600',
              keterangan: 'Pelantikan Anggota Baru',
              created_at: '2025-08-05',
              is_featured: false
            },
            {
              id_galeri: 5,
              foto: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80&w=600',
              keterangan: 'Outbound & Games Pelatihan',
              created_at: '2025-08-03',
              is_featured: false
            },
            {
              id_galeri: 6,
              foto: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=600',
              keterangan: 'Api Unggun Malam Kekrabatan',
              created_at: '2025-08-01',
              is_featured: false
            }
          ];

          const formattedDummy = dummyData.map(item => ({
            ...item,
            kategori: deteksiKategori(item.keterangan),
            tanggal: '12 Agu 2025'
          }));
          setDaftarFoto(formattedDummy);
        } else {
          // Jika backend sudah ada isinya
          const formattedData = fotoData.map(item => ({
            ...item,
            kategori: deteksiKategori(item.keterangan),
            tanggal: item.created_at 
              ? new Date(item.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) 
              : 'Baru'
          }));
          setDaftarFoto(formattedData);
        }
      } catch (error) {
        console.error("Gagal memuat data:", error);
        setDaftarFoto([]);
      }
      
      setLoading(false);
    }

    fetchData();
  }, [namaEskul, cleanNamaEskul]);

  const handleHapusFoto = async (idGaleri) => {
    if (window.confirm('Yakin ingin menghapus foto ini dari galeri?')) {
      try {
        const result = await hapusGaleriEskul(idGaleri);
        if (result.success) {
          setDaftarFoto(prev => prev.filter(f => f.id_galeri !== idGaleri));
          alert('Foto berhasil dihapus!');
        } else {
          alert('Gagal menghapus foto: ' + (result.error || 'Terjadi kesalahan'));
        }
      } catch (error) {
        console.error('Error saat menghapus foto:', error);
        alert('Terjadi kesalahan saat menghapus foto.');
      }
    }
  };

  const handleJadikanUtama = async (idGaleri) => {
    setSettingUtama(idGaleri);
    setTimeout(() => {
      setSettingUtama(null);
      setDaftarFoto(prev =>
        prev.map(f => ({
          ...f,
          is_featured: f.id_galeri === idGaleri
        }))
      );
    }, 300);
  };

  const handleBukaEdit = item => {
    setEditTarget(item);
    setEditKeterangan(item.keterangan || '');
    setEditFile(null);
  };

  const handleTutupEdit = () => {
    setEditTarget(null);
    setEditFile(null);
    setEditKeterangan('');
  };

  const handleSimpanEdit = async e => {
    e.preventDefault();
    if (!editTarget) return;

    setSavingEdit(true);
    setTimeout(() => {
      setDaftarFoto(prev =>
        prev.map(f =>
          f.id_galeri === editTarget.id_galeri
            ? { ...f, keterangan: editKeterangan }
            : f
        )
      );
      setSavingEdit(false);
      handleTutupEdit();
    }, 500);
  };

  const handleLihatFoto = idGaleri => {
    navigate(`/eskul/${namaEskul}/galeri/${idGaleri}`);
  };

  const getFotoUrl = foto => {
    if (!foto) return null;
    return foto.startsWith('http')
      ? foto
      : `http://localhost:5000/${
          foto.startsWith('/') ? foto.slice(1) : foto
        }`;
  };

  // Logika Filter berdasarkan Kategori Tab yang Aktif
  const daftarFotoFiltered = daftarFoto.filter(item => {
    if (activeTab === 'Semua') return true;
    return item.kategori?.toLowerCase() === activeTab.toLowerCase();
  });

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 transition-colors duration-300">
      <Sidebar isAdmin={isAdmin} />

      <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
        {/* BREADCRUMB */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            <span 
              onClick={() => navigate(`/eskul/${namaEskul}`)}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer transition"
            >
              Detail Eskul
            </span>
            <span>›</span>
            <span className="text-gray-800 dark:text-gray-200 font-semibold">Galeri Foto</span>
          </div>

          {isStaff && (
            <button
              onClick={() => navigate(`/eskul/${namaEskul}/galeri/upload`)}
              className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg flex items-center gap-2 transition-all self-start sm:self-auto"
            >
              <span>+ Upload Foto</span>
            </button>
          )}
        </div>

        {/* BANNER HEADER GALERI */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 flex-shrink-0">
              <ImageIcon className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                Galeri Foto: {formatNamaEskul}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Berbagai momen kegiatan ekstrakurikuler {formatNamaEskul} di sekolah.
              </p>
            </div>
          </div>

          {/* KOTAK TOTAL FOTO */}
          <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900/50 px-5 py-3 rounded-2xl flex items-center gap-3 self-stretch md:self-auto justify-between md:justify-start">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <Layers className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Total Foto</span>
            </div>
            <span className="text-xl font-black text-emerald-800 dark:text-emerald-300">
              {daftarFoto.length}
            </span>
          </div>
        </div>

        {/* TAB FILTER KATEGORI */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
          {['Semua', 'Kegiatan', 'Upacara', 'Pelatihan', 'Lainnya'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === tab
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                  : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {tab === 'Semua' && <Sparkles className="w-3.5 h-3.5" />}
              {tab}
            </button>
          ))}
        </div>

        {/* KONTEN UTAMA GRID GALERI */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 transition-colors duration-300">
          {loading ? (
            <div className="p-12 text-center text-gray-400 dark:text-gray-500 text-sm">
              Memuat galeri...
            </div>
          ) : daftarFotoFiltered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                <ImageIcon className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-sm font-medium">Tidak ada foto dalam kategori "{activeTab}".</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
              {daftarFotoFiltered.map(item => (
                <div
                  key={item.id_galeri}
                  className={`group relative rounded-2xl overflow-hidden bg-white dark:bg-gray-900 border shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col ${
                    item.is_featured
                      ? 'border-emerald-500 ring-2 ring-emerald-400/30'
                      : 'border-gray-200/80 dark:border-gray-800'
                  }`}
                >
                  {/* WRAPPER GAMBAR */}
                  <div className="relative w-full aspect-[16/10] overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <img
                      src={getFotoUrl(item.foto)}
                      alt={item.keterangan || formatNamaEskul}
                      className="w-full h-full object-cover cursor-pointer transition-transform duration-500 group-hover:scale-105"
                      onClick={() => handleLihatFoto(item.id_galeri)}
                    />

                    {/* BADGE UTAMA */}
                    {item.is_featured && (
                      <div className="absolute top-3 left-3 bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-md backdrop-blur-md bg-opacity-90">
                        <Award className="w-3.5 h-3.5" />
                        <span>Utama</span>
                      </div>
                    )}

                    {/* TOMBOL AKSI HOVER */}
                    {isStaff && (
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => handleJadikanUtama(item.id_galeri)}
                          disabled={item.is_featured || settingUtama === item.id_galeri}
                          title="Jadikan foto utama"
                          className="bg-white/95 dark:bg-gray-900/95 hover:bg-white text-emerald-600 w-8 h-8 rounded-xl flex items-center justify-center shadow-md disabled:opacity-40 transition"
                        >
                          <Award className={`w-4 h-4 ${item.is_featured ? 'fill-emerald-500' : ''}`} />
                        </button>

                        <button
                          onClick={() => handleBukaEdit(item)}
                          title="Edit keterangan"
                          className="bg-white/95 dark:bg-gray-900/95 hover:bg-white text-blue-600 w-8 h-8 rounded-xl flex items-center justify-center shadow-md transition"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleHapusFoto(item.id_galeri)}
                          title="Hapus foto"
                          className="bg-red-600 hover:bg-red-700 text-white w-8 h-8 rounded-xl flex items-center justify-center shadow-md transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* KARTU FOOTER */}
                  <div className="p-4 flex items-center justify-between gap-2 bg-white dark:bg-gray-900 mt-auto border-t border-gray-100 dark:border-gray-800/80">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                        <ImageIcon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                        {item.keterangan || 'Foto Kegiatan'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500 flex-shrink-0">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{item.tanggal || 'Baru'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* MODAL EDIT */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-800">
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
              <h3 className="font-bold text-gray-900 dark:text-white text-base">
                Edit Keterangan Foto
              </h3>
              <button
                onClick={handleTutupEdit}
                className="text-gray-400 hover:text-gray-600 font-bold text-xl w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSimpanEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                  Foto Saat Ini
                </label>
                <img
                  src={getFotoUrl(editTarget.foto)}
                  alt="Foto saat ini"
                  className="w-full h-44 object-cover rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                  Keterangan Foto
                </label>
                <input
                  type="text"
                  value={editKeterangan}
                  onChange={e => setEditKeterangan(e.target.value)}
                  placeholder="Contoh: Upacara bendera hari senin"
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm outline-none bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>

              <div className="pt-3 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={handleTutupEdit}
                  className="px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {savingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}