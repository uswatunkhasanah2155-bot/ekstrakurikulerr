// src/pages/GaleriEskul.jsx
import React, { useState, useEffect } from 'react';
import { fotoUrl } from '../utils/fotoUrl';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import {
  getDaftarEskul,
  getGaleriEskul,
  hapusGaleriEskul,
  setFotoUtamaGaleri,
  setBannerGaleri,
  updateGaleriEskul
} from '../services/api';
import {
  Award,
  Pencil,
  Trash2,
  Image as ImageIcon,
  Calendar,
  Layers,
  Sparkles,
  PanelTop
} from 'lucide-react';

// Harus sama dengan batas di backend dan ExtracurricularDetail.jsx
const MAX_BANNER = 5;

export default function GaleriEskul() {
  const { namaEskul } = useParams();
  const navigate = useNavigate();

  const cleanNamaEskul = namaEskul ? namaEskul.replace(/-/g, ' ') : '';

  const formatNamaEskul = cleanNamaEskul
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const roleAwal = (localStorage.getItem('role') || '').toUpperCase();
  const [isAdmin, setIsAdmin] = useState(roleAwal === 'ADMIN');
  const [isStaff, setIsStaff] = useState(
    roleAwal === 'ADMIN' || roleAwal === 'PEMBINA'
  );
  const [loading, setLoading] = useState(true);
  const [currentEskulDetail, setCurrentEskulDetail] = useState(null);
  const [daftarFoto, setDaftarFoto] = useState([]);

  const [activeTab, setActiveTab] = useState('Semua');

  const [settingUtama, setSettingUtama] = useState(null);
  const [settingBanner, setSettingBanner] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [editFile, setEditFile] = useState(null);
  const [editKeterangan, setEditKeterangan] = useState('');
  const [editKategori, setEditKategori] = useState('Kegiatan');
  const [savingEdit, setSavingEdit] = useState(false);

  const formatTanggal = tgl => {
    if (!tgl) return 'Baru';
    return new Date(tgl).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  useEffect(() => {
    const roleUser = (localStorage.getItem('role') || '').toUpperCase();

    setIsAdmin(roleUser === 'ADMIN');
    setIsStaff(roleUser === 'ADMIN' || roleUser === 'PEMBINA');

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

        let fotoData = [];

        if (matchedEskul) {
          try {
            fotoData = await getGaleriEskul(matchedEskul.id_eskul);
          } catch (err) {
            console.error('Gagal mengambil data galeri dari server:', err);
            fotoData = [];
          }
        }

        const formattedData = (fotoData || []).map(item => ({
          ...item,
          kategori: item.kategori || 'Lainnya',
          tanggal: formatTanggal(item.created_at)
        }));

        setDaftarFoto(formattedData);
      } catch (error) {
        console.error('Gagal memuat data:', error);
        setDaftarFoto([]);
      }

      setLoading(false);
    }

    fetchData();
  }, [namaEskul, cleanNamaEskul]);

  const jumlahBanner = daftarFoto.filter(f => f.is_banner).length;

  const handleHapusFoto = async idGaleri => {
    if (!window.confirm('Yakin ingin menghapus foto ini dari galeri?')) {
      return;
    }

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
  };

  const handleJadikanUtama = async idGaleri => {
    try {
      setSettingUtama(idGaleri);

      // Panggil API ke backend untuk mengubah foto utama di database
      const result = await setFotoUtamaGaleri(idGaleri);

      if (result.success) {
        setDaftarFoto(prev =>
          prev.map(f => ({
            ...f,
            is_featured: f.id_galeri === idGaleri
          }))
        );
        alert('Foto utama berhasil diubah!');
      } else {
        alert('Gagal mengubah foto utama: ' + (result.error || 'Terjadi kesalahan'));
      }
    } catch (error) {
      console.error('Error saat mengubah foto utama:', error);
      alert('Terjadi kesalahan pada server.');
    } finally {
      setSettingUtama(null);
    }
  };

  // Tandai / lepas foto dari banner slider (toggle)
  const handleToggleBanner = async item => {
    if (!item.is_banner && jumlahBanner >= MAX_BANNER) {
      alert(
        `Banner maksimal ${MAX_BANNER} foto. Lepas salah satu foto banner dulu.`
      );
      return;
    }

    try {
      setSettingBanner(item.id_galeri);

      const result = await setBannerGaleri(item.id_galeri);

      if (result.success) {
        setDaftarFoto(prev =>
          prev.map(f =>
            f.id_galeri === item.id_galeri
              ? { ...f, is_banner: !f.is_banner }
              : f
          )
        );
      } else {
        alert('Gagal mengubah foto banner: ' + (result.error || 'Terjadi kesalahan'));
      }
    } catch (error) {
      console.error('Error saat mengubah foto banner:', error);
      alert('Terjadi kesalahan pada server.');
    } finally {
      setSettingBanner(null);
    }
  };

  const handleBukaEdit = item => {
    setEditTarget(item);
    setEditKeterangan(item.keterangan || '');
    setEditKategori(item.kategori || 'Kegiatan');
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

    const formData = new FormData();
    formData.append('keterangan', editKeterangan);
    formData.append('kategori', editKategori);

    if (editFile) {
      formData.append('foto', editFile);
    }

    const result = await updateGaleriEskul(editTarget.id_galeri, formData);

    setSavingEdit(false);

    if (result.success) {
      setDaftarFoto(prev =>
        prev.map(f =>
          f.id_galeri === editTarget.id_galeri
            ? {
                ...f,
                keterangan: editKeterangan,
                kategori: editKategori,
                foto: result.data?.data?.foto || f.foto
              }
            : f
        )
      );
      handleTutupEdit();
    } else {
      alert('Gagal menyimpan perubahan: ' + result.error);
    }
  };

  const handleLihatFoto = idGaleri => {
    navigate(`/eskul/${namaEskul}/galeri/${idGaleri}`);
  };

  const getFotoUrl = foto => fotoUrl(foto);

  const daftarFotoFiltered = daftarFoto.filter(item => {
    if (activeTab === 'Semua') return true;
    return item.kategori?.toLowerCase() === activeTab.toLowerCase();
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 flex flex-col transition-colors duration-300">
      {/* Siswa memakai Navbar, Admin/Pembina memakai Sidebar */}
      {!isStaff && <Navbar />}

      <div className="flex flex-1">
        {isStaff && <Sidebar isAdmin={isAdmin} />}

      <main className="flex-1 min-w-0 p-6 sm:p-8 overflow-y-auto">
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

          <div className="flex flex-col sm:flex-row gap-3 self-stretch md:self-auto">
            {isStaff && (
              <div className="bg-white dark:bg-gray-900 border border-emerald-200 dark:border-emerald-900/60 px-5 py-3 rounded-2xl flex items-center gap-3 justify-between sm:justify-start">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <PanelTop className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Foto Banner</span>
                </div>
                <span className="text-xl font-black text-emerald-800 dark:text-emerald-300">
                  {jumlahBanner}/{MAX_BANNER}
                </span>
              </div>
            )}

            <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900/50 px-5 py-3 rounded-2xl flex items-center gap-3 justify-between md:justify-start">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <Layers className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Total Foto</span>
              </div>
              <span className="text-xl font-black text-emerald-800 dark:text-emerald-300">
                {daftarFoto.length}
              </span>
            </div>
          </div>
        </div>

        {/* TAB FILTER KATEGORI */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
          {['Semua', 'Kegiatan', 'Upacara', 'Pelatihan', 'Lainnya'].map(tab => (
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
              <p className="text-sm font-medium">
                {daftarFoto.length === 0
                  ? 'Belum ada foto di galeri ini.'
                  : `Tidak ada foto dalam kategori "${activeTab}".`}
              </p>
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
                  <div className="relative w-full aspect-[16/10] overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <img
                      src={getFotoUrl(item.foto)}
                      alt={item.keterangan || formatNamaEskul}
                      className="w-full h-full object-cover cursor-pointer transition-transform duration-500 group-hover:scale-105"
                      onClick={() => handleLihatFoto(item.id_galeri)}
                    />

                    {/* Label di pojok kiri atas: Utama dan/atau Banner */}
                    <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
                      {item.is_featured && (
                        <div className="bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-md backdrop-blur-md bg-opacity-90">
                          <Award className="w-3.5 h-3.5" />
                          <span>Utama</span>
                        </div>
                      )}

                      {item.is_banner && (
                        <div className="bg-sky-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-md backdrop-blur-md bg-opacity-90">
                          <PanelTop className="w-3.5 h-3.5" />
                          <span>Banner</span>
                        </div>
                      )}
                    </div>

                    {isStaff && (
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => handleToggleBanner(item)}
                          disabled={settingBanner === item.id_galeri}
                          title={
                            item.is_banner
                              ? 'Lepas dari banner'
                              : 'Jadikan banner'
                          }
                          className="bg-white/95 dark:bg-gray-900/95 hover:bg-white text-sky-600 w-10 h-10 md:w-8 md:h-8 rounded-xl flex items-center justify-center shadow-md disabled:opacity-40 transition"
                        >
                          <PanelTop
                            className={`w-4 h-4 ${item.is_banner ? 'fill-sky-200' : ''}`}
                          />
                        </button>

                        <button
                          onClick={() => handleJadikanUtama(item.id_galeri)}
                          disabled={item.is_featured || settingUtama === item.id_galeri}
                          title="Jadikan foto utama"
                          className="bg-white/95 dark:bg-gray-900/95 hover:bg-white text-emerald-600 w-10 h-10 md:w-8 md:h-8 rounded-xl flex items-center justify-center shadow-md disabled:opacity-40 transition"
                        >
                          <Award className={`w-4 h-4 ${item.is_featured ? 'fill-emerald-500' : ''}`} />
                        </button>

                        <button
                          onClick={() => handleBukaEdit(item)}
                          title="Edit keterangan & kategori"
                          className="bg-white/95 dark:bg-gray-900/95 hover:bg-white text-blue-600 w-10 h-10 md:w-8 md:h-8 rounded-xl flex items-center justify-center shadow-md transition"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleHapusFoto(item.id_galeri)}
                          title="Hapus foto"
                          className="bg-red-600 hover:bg-red-700 text-white w-10 h-10 md:w-8 md:h-8 rounded-xl flex items-center justify-center shadow-md transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

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
      </div>

      {/* MODAL EDIT */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-800">
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
              <h3 className="font-bold text-gray-900 dark:text-white text-base">
                Edit Informasi Foto
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
                  Ganti Foto (opsional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setEditFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 dark:file:bg-emerald-900/30 file:text-emerald-700 dark:file:text-emerald-300 hover:file:bg-emerald-100 dark:hover:file:bg-emerald-900/50 cursor-pointer"
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

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                  Kategori Foto
                </label>
                <select
                  value={editKategori}
                  onChange={e => setEditKategori(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm outline-none bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 transition"
                >
                  <option value="Kegiatan">Kegiatan</option>
                  <option value="Upacara">Upacara</option>
                  <option value="Pelatihan">Pelatihan</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
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