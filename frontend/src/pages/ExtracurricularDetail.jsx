// src/pages/ExtracurricularDetail.jsx
import React, { useState, useEffect } from 'react';
import { fotoUrl } from '../utils/fotoUrl';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  getSiswaByEskul,
  getDaftarEskul,
  hapusPendaftar,
  getGaleriEskul
} from '../services/api';
import {
  Search,
  FileSpreadsheet,
  ClipboardList,
  User,
  Pencil,
  Trash2,
  Plus,
  Images,
  Calendar,
  UserRound,
  ArrowLeft
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

// Dashboard tujuan sesuai role
const getDashboardPath = (role) => {
  const r = (role || '').toUpperCase();
  if (r === 'ADMIN') return '/admin/dashboard';
  if (r === 'PEMBINA') return '/pembina/dashboard';
  return '/siswa/dashboard';
};

// Pilihan filter jenis kelamin
const GENDER_OPTIONS = [
  { value: '', label: 'Semua' },
  { value: 'L', label: 'Laki-laki' },
  { value: 'P', label: 'Perempuan' }
];

// ------------------------------------------------------
// Helper tanggal: ubah berbagai format menjadi "YYYY-MM-DD"
// ------------------------------------------------------
const BULAN_ID = {
  jan: 1, feb: 2, mar: 3, apr: 4, mei: 5, may: 5, jun: 6, jul: 7,
  agu: 8, agt: 8, ags: 8, aug: 8, sep: 9, okt: 10, oct: 10,
  nov: 11, des: 12, dec: 12
};
const BULAN_LABEL = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];
const pad2 = n => String(n).padStart(2, '0');

const toDateKey = value => {
  if (!value) return '';

  if (value instanceof Date) {
    return isNaN(value)
      ? ''
      : `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}`;
  }

  const s = String(value).trim();

  // ISO dengan jam: 2026-09-29T10:00:00Z
  if (/^\d{4}-\d{2}-\d{2}[T ]/.test(s)) {
    const d = new Date(s);
    if (!isNaN(d)) return toDateKey(d);
  }

  // 2026-09-29
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return `${m[1]}-${pad2(m[2])}-${pad2(m[3])}`;

  // 29/09/2026, 29-09-2026, 29.09.2026
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (m) return `${m[3]}-${pad2(m[2])}-${pad2(m[1])}`;

  // 29 Sep 2026 / 29 September 2026
  m = s.match(/^(\d{1,2})\s+([A-Za-z]+)\.?\s+(\d{4})/);
  if (m) {
    const bln = BULAN_ID[m[2].slice(0, 3).toLowerCase()];
    if (bln) return `${m[3]}-${pad2(bln)}-${pad2(m[1])}`;
  }

  const d = new Date(s);
  return isNaN(d) ? '' : toDateKey(d);
};

const formatDateKey = key => {
  const [y, mo, d] = key.split('-');
  return `${Number(d)} ${BULAN_LABEL[Number(mo) - 1]} ${y}`;
};

export default function ExtracurricularDetail() {
  const { namaEskul } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter jenis kelamin dari URL: ?gender=L atau ?gender=P
  const genderParam = (searchParams.get('gender') || '').toUpperCase();
  const genderFilter =
    genderParam === 'L' || genderParam === 'P' ? genderParam : '';

  const handleGenderFilter = value => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set('gender', value);
    } else {
      next.delete('gender');
    }
    setSearchParams(next, { replace: true });
  };

  // Filter tanggal daftar dari URL: ?tanggal=2026-09-29
  const tanggalParam = searchParams.get('tanggal') || '';
  const tanggalFilter = /^\d{4}-\d{2}-\d{2}$/.test(tanggalParam)
    ? tanggalParam
    : '';
  const tanggalLabel = tanggalFilter
    ? formatDateKey(tanggalFilter)
    : '';

  const handleHapusFilterTanggal = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('tanggal');
    setSearchParams(next, { replace: true });
  };

  const cleanNamaEskul = namaEskul
    ? namaEskul.replace(/-/g, ' ')
    : '';

  const formatNamaEskul = cleanNamaEskul
    .split(' ')
    .map(
      word =>
        word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(' ');

  const [isAdmin, setIsAdmin] = useState(false);
  const [isPembina, setIsPembina] = useState(false);

  const [siswaTerdaftar, setSiswaTerdaftar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [daftarEskulOptions, setDaftarEskulOptions] =
    useState([]);
  const [currentEskulDetail, setCurrentEskulDetail] =
    useState(null);
  const [fotoUtamaGaleri, setFotoUtamaGaleri] =
    useState(null);

  const idEskulPembina =
    localStorage.getItem('id_eskul');

  const canManage = isAdmin || isPembina;

  useEffect(() => {
    const roleUser = localStorage.getItem('role');

    const admin =
      roleUser?.toUpperCase() === 'ADMIN';

    const pembina =
      roleUser?.toUpperCase() === 'PEMBINA';

    setIsAdmin(admin);
    setIsPembina(pembina);

    async function fetchData() {
      setLoading(true);

      try {
        const eskulData =
          await getDaftarEskul();

        const listEskul =
          eskulData.data || eskulData || [];

        setDaftarEskulOptions(listEskul);

        const matchedEskul =
          listEskul.find(
            item =>
              item.nama_eskul &&
              item.nama_eskul
                .toLowerCase()
                .trim() ===
              cleanNamaEskul
                .toLowerCase()
                .trim()
          );

        setCurrentEskulDetail(
          matchedEskul || null
        );

        if (!matchedEskul) {
          setLoading(false);
          return;
        }

        if (
          pembina &&
          String(matchedEskul.id_eskul) !==
            String(idEskulPembina)
        ) {
          alert(
            'Anda hanya dapat mengakses ekstrakurikuler yang Anda bina.'
          );

          navigate(getDashboardPath(roleUser));
          return;
        }

        const siswaData =
          await getSiswaByEskul(
            cleanNamaEskul
          );

        setSiswaTerdaftar(
          siswaData || []
        );

        const fotoGaleri =
          await getGaleriEskul(
            matchedEskul.id_eskul
          );

        const fotoUtama =
          (fotoGaleri || []).find(
            item => item.is_featured
          );

        setFotoUtamaGaleri(
          fotoUtama || null
        );
      } catch (error) {
        console.error(
          'Gagal mengambil data detail eskul:',
          error
        );
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [
    namaEskul,
    cleanNamaEskul,
    idEskulPembina,
    navigate
  ]);

  const handleDaftarSiswa = () => {
    navigate(
      `/eskul/${namaEskul}/daftar`
    );
  };

  const handleLihatGaleri = () => {
    navigate(
      `/eskul/${namaEskul}/galeri`
    );
  };

  const handleDownloadExcel = () => {
    window.open(
      `http://localhost:5000/api/eskul/slug/${namaEskul}/download`,
      '_blank'
    );
  };

  const handleTambahSiswa = () => {
    navigate(
      `/eskul/${namaEskul}/siswa/tambah`
    );
  };

  const handleEditSiswa = siswa => {
    navigate(
      `/eskul/${namaEskul}/siswa/edit/${siswa.id}`
    );
  };

  const handleHapusSiswa = async siswa => {
    if (
      window.confirm(
        `Yakin ingin menghapus data ${siswa.nama} dari eskul?`
      )
    ) {
      const result =
        await hapusPendaftar(siswa.id);

      if (result.success) {
        alert(
          'Berhasil menghapus data siswa dari eskul!'
        );

        const updatedData =
          await getSiswaByEskul(
            cleanNamaEskul
          );

        setSiswaTerdaftar(
          updatedData || []
        );
      } else {
        alert(
          'Gagal menghapus data: ' +
            result.error
        );
      }
    }
  };

  const filteredSiswa =
    siswaTerdaftar.filter(siswa => {
      // Filter jenis kelamin (sama dengan cara tabel menampilkannya)
      if (genderFilter) {
        const g =
          siswa.jenisKelamin === 'P' ? 'P' : 'L';
        if (g !== genderFilter) return false;
      }

      // Filter tanggal daftar
      if (tanggalFilter) {
        const key = toDateKey(
          siswa.tanggal_daftar ??
            siswa.created_at ??
            siswa.createdAt ??
            siswa.tanggal
        );
        if (key !== tanggalFilter) return false;
      }

      const keyword =
        searchQuery
          .toLowerCase()
          .trim();

      if (!keyword) return true;

      return (
        siswa.nama
          ?.toLowerCase()
          .includes(keyword) ||
        siswa.kelas
          ?.toLowerCase()
          .includes(keyword)
      );
    });

  const genderLabel = GENDER_OPTIONS.find(
    o => o.value === genderFilter
  )?.label;

  const fotoCoverUrl = fotoUrl(fotoUtamaGaleri?.foto);

  const fotoLogoUrl = fotoUrl(currentEskulDetail?.foto);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 flex flex-col relative transition-colors duration-300">

      {/* Navbar HANYA dirender jika Bukan Admin/Pembina (untuk Siswa / Public) */}
      {!canManage && <Navbar />}

      {/* Kontainer bagian bawah (Sidebar untuk Admin/Pembina dan Konten Utama) */}
      <div className="flex flex-1 relative">

        {/* Sidebar HANYA dirender jika user adalah Admin atau Pembina */}
        {canManage && <Sidebar />}

        {/* Lebar penuh layar (sebelumnya max-w-7xl mx-auto) */}
        <main className="flex-1 min-w-0 w-full px-4 sm:px-6 lg:px-10 py-6 overflow-y-auto">

          {/* ==============================
              HEADER (KEMBALI, JUDUL, & DOWNLOAD)
          ============================== */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  navigate(
                    getDashboardPath(
                      localStorage.getItem('role')
                    )
                  )
                }
                className="p-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shadow-sm flex items-center gap-2 text-sm font-semibold"
                title="Kembali ke Dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>

              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  Detail Ekstrakurikuler: {formatNamaEskul}
                </h2>

                {isPembina && (
                  <p className="text-xs text-cyan-600 dark:text-cyan-400 font-medium mt-1">
                    Mode Pembina — Mengelola {formatNamaEskul}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {canManage && (
                <button
                  onClick={handleDownloadExcel}
                  className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Download Excel
                </button>
              )}
            </div>
          </div>

          {/* ==============================
              DETAIL ESKUL
          ============================== */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-100 dark:border-gray-800 mb-8 overflow-hidden transition-colors">
            <div className="relative h-48 sm:h-64 bg-gray-100 dark:bg-gray-800">
              {fotoCoverUrl ? (
                <img
                  src={fotoCoverUrl}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={e => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-950/60 dark:to-gray-900" />
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10" />

              <button
                type="button"
                onClick={handleLihatGaleri}
                className="absolute top-4 right-4 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg transition-colors"
              >
                <Images className="w-4 h-4" />
                Lihat Galeri
              </button>

              <div className="absolute -bottom-12 left-6 w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-white dark:bg-gray-800 border-4 border-white dark:border-gray-900 shadow-xl overflow-hidden flex items-center justify-center text-gray-400 dark:text-gray-500 text-[10px] font-medium text-center p-1">
                {fotoLogoUrl ? (
                  <img
                    src={fotoLogoUrl}
                    alt={formatNamaEskul}
                    className="w-full h-full object-contain"
                    onError={e => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <span>{formatNamaEskul}</span>
                )}
              </div>
            </div>

            <div className="pt-16 px-6 pb-6">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                  {currentEskulDetail?.nama_eskul ||
                    `Eskul ${formatNamaEskul}`}
                </h3>
              </div>

              <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">
                <UserRound className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Pembina:
                <span className="text-gray-900 dark:text-white">
                  {currentEskulDetail?.pembina ||
                    'Belum ditentukan'}
                </span>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-300 mb-5 leading-relaxed">
                {currentEskulDetail?.deskripsi ||
                  `Program latihan untuk pengembangan skill ${formatNamaEskul.toLowerCase()}, strategi tim, dan partisipasi kompetisi antar sekolah.`}
              </p>

              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 px-4 py-3 rounded-xl mb-5">
                <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Jadwal:</span>
                <span>
                  {currentEskulDetail?.jadwal ||
                    'Belum diatur'}
                </span>
              </div>

              <div>
                {isAdmin && (
                  <span className="bg-emerald-600 text-white text-sm font-bold px-4 py-2.5 rounded-full inline-flex items-center gap-2 shadow-sm">
                    <ClipboardList className="w-4 h-4" />
                    Mode Admin: Hak Akses CRUD Aktif
                  </span>
                )}

                {isPembina && (
                  <span className="bg-cyan-600 text-white text-sm font-bold px-4 py-2.5 rounded-full inline-flex items-center gap-2 shadow-sm">
                    <ClipboardList className="w-4 h-4" />
                    Mode Pembina: Hak Akses CRUD Aktif
                  </span>
                )}

                {!isAdmin &&
                  !isPembina && (
                    <button
                      onClick={handleDaftarSiswa}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-5 py-2.5 rounded-full transition-colors shadow-md flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Daftar Eskul Ini
                    </button>
                  )}
              </div>
            </div>
          </div>

          {/* ==============================
              DAFTAR SISWA
          ============================== */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 shrink-0">
                <ClipboardList className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                Daftar Siswa Terdaftar
                {genderFilter ? ` - ${genderLabel}` : ''}
                {tanggalFilter ? ` - ${tanggalLabel}` : ''} (
                {filteredSiswa.length} Siswa)
              </h3>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {/* Chip filter tanggal (dari klik diagram dashboard) */}
                {tanggalFilter && (
                  <button
                    type="button"
                    onClick={handleHapusFilterTanggal}
                    title="Hapus filter tanggal"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    {tanggalLabel}
                    <span aria-hidden="true">✕</span>
                  </button>
                )}

                {/* Filter jenis kelamin */}
                <div
                  className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                  role="group"
                  aria-label="Filter jenis kelamin"
                >
                  {GENDER_OPTIONS.map(opt => (
                    <button
                      key={opt.value || 'semua'}
                      type="button"
                      onClick={() =>
                        handleGenderFilter(opt.value)
                      }
                      aria-pressed={
                        genderFilter === opt.value
                      }
                      className={`px-3 py-2 text-xs font-semibold transition-colors ${
                        genderFilter === opt.value
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e =>
                      setSearchQuery(
                        e.target.value
                      )
                    }
                    placeholder="Cari nama siswa..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg outline-none bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                {canManage && (
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
                <div className="p-6 text-center text-gray-500 dark:text-gray-400 text-sm">
                  Memuat data siswa dari backend...
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50/50 dark:bg-gray-800/50">
                      <th className="py-3 px-4">No</th>
                      <th className="py-3 px-4">Foto</th>
                      <th className="py-3 px-4">Nama Siswa</th>
                      <th className="py-3 px-4">Kelas</th>
                      <th className="py-3 px-4">Jenis Kelamin</th>
                      <th className="py-3 px-4">Tanggal Daftar</th>
                      {canManage && (
                        <th className="py-3 px-4 text-center">
                          Aksi
                        </th>
                      )}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm text-gray-700 dark:text-gray-300">
                    {filteredSiswa.length === 0 ? (
                      <tr>
                        <td
                          colSpan={
                            canManage ? 7 : 6
                          }
                          className="py-4 text-center text-gray-400 dark:text-gray-500"
                        >
                          {searchQuery
                            ? `Tidak ditemukan siswa dengan kata kunci "${searchQuery}".`
                            : tanggalFilter
                              ? `Tidak ada pendaftar pada ${tanggalLabel}.`
                              : genderFilter
                              ? `Belum ada siswa ${genderLabel.toLowerCase()} di ekstrakurikuler ini.`
                              : 'Belum ada siswa yang terdaftar di ekstrakurikuler ini.'}
                        </td>
                      </tr>
                    ) : (
                      filteredSiswa.map(
                        (siswa, idx) => (
                          <tr
                            key={siswa.id}
                            className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                          >
                            <td className="py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                              {idx + 1}
                            </td>

                            <td className="py-3 px-4">
                              {siswa.foto ? (
                                <img
                                  src={fotoUrl(siswa.foto)}
                                  alt={siswa.nama}
                                  className="w-20 h-20 object-cover rounded-full border-2 border-gray-200 dark:border-gray-700 shadow-sm"
                                  onError={e => {
                                    e.target.style.display =
                                      'none';

                                    if (
                                      e.target
                                        .nextSibling
                                    ) {
                                      e.target.nextSibling.style.display =
                                        'flex';
                                    }
                                  }}
                                />
                              ) : null}

                              <div
                                className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500"
                                style={{
                                  display: siswa.foto
                                    ? 'none'
                                    : 'flex'
                                }}
                              >
                                <User className="w-6 h-6" />
                              </div>
                            </td>

                            <td className="py-3 px-4 font-semibold text-gray-800 dark:text-gray-100">
                              {siswa.nama}
                            </td>

                            <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                              {siswa.kelas}
                            </td>

                            <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                              {siswa.jenisKelamin ===
                              'P'
                                ? 'Perempuan'
                                : 'Laki-laki'}
                            </td>

                            <td className="py-3 px-4 text-gray-500 dark:text-gray-400">
                              {siswa.tanggal ||
                                'Baru saja'}
                            </td>

                            {canManage && (
                              <td className="py-3 px-4 text-center space-x-2">
                                <button
                                  onClick={() =>
                                    handleEditSiswa(
                                      siswa
                                    )
                                  }
                                  className="text-xs bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-md font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 inline-flex items-center gap-1"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  Edit
                                </button>

                                <button
                                  onClick={() =>
                                    handleHapusSiswa(siswa)
                                  }
                                  className="text-xs bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 px-2.5 py-1 rounded-md font-medium hover:bg-red-100 dark:hover:bg-red-900/50 inline-flex items-center gap-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Hapus
                                </button>
                              </td>
                            )}
                          </tr>
                        )
                      )
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}