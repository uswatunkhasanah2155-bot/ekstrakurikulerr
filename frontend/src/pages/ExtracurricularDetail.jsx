// src/pages/ExtracurricularDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
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
  Images
} from 'lucide-react';

export default function ExtracurricularDetail() {
  const { namaEskul } = useParams();
  const navigate = useNavigate();

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

  // Admin dan Pembina sama-sama boleh mengelola
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
        // ==============================
        // AMBIL DAFTAR ESKUL
        // ==============================
        const eskulData =
          await getDaftarEskul();

        const listEskul =
          eskulData.data || eskulData || [];

        setDaftarEskulOptions(listEskul);

        // ==============================
        // CARI ESKUL
        // ==============================
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

        // ==============================
        // PEMBINA HANYA BOLEH AKSES
        // ESKUL YANG DIA BINA
        // ==============================
        if (
          pembina &&
          String(matchedEskul.id_eskul) !==
            String(idEskulPembina)
        ) {
          alert(
            'Anda hanya dapat mengakses ekstrakurikuler yang Anda bina.'
          );

          navigate('/Dashboard');
          return;
        }

        // ==============================
        // AMBIL DATA SISWA
        // ==============================
        const siswaData =
          await getSiswaByEskul(
            cleanNamaEskul
          );

        setSiswaTerdaftar(
          siswaData || []
        );

        // ==============================
        // AMBIL FOTO GALERI UTAMA
        // ==============================
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

  // ==============================
  // DAFTAR SISWA
  // ==============================
  const handleDaftarSiswa = () => {
    navigate(
      `/eskul/${namaEskul}/daftar`
    );
  };

  // ==============================
  // GALERI
  // ==============================
  const handleLihatGaleri = () => {
    navigate(
      `/eskul/${namaEskul}/galeri`
    );
  };

  // ==============================
  // DOWNLOAD EXCEL
  // ==============================
  const handleDownloadExcel = () => {
    window.open(
      `http://localhost:5000/api/eskul/slug/${namaEskul}/download`,
      '_blank'
    );
  };

  // ==============================
  // TAMBAH SISWA
  // ==============================
  const handleTambahSiswa = () => {
    navigate(
      `/eskul/${namaEskul}/siswa/tambah`
    );
  };

  // ==============================
  // EDIT SISWA
  // ==============================
  const handleEditSiswa = siswa => {
    navigate(
      `/eskul/${namaEskul}/siswa/edit/${siswa.id}`
    );
  };

  // ==============================
  // HAPUS SISWA
  // ==============================
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

  // ==============================
  // FILTER SISWA
  // ==============================
  const filteredSiswa =
    siswaTerdaftar.filter(siswa => {
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

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 relative transition-colors duration-300">

      <Sidebar isAdmin={isAdmin} />

      <main className="flex-1 p-6 overflow-y-auto">

        {/* ==============================
            HEADER
        ============================== */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">

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

          <div className="flex items-center gap-2">

            {canManage && (
              <button
                onClick={handleDownloadExcel}
                className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm flex items-center gap-2 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Download Excel
              </button>
            )}

          </div>
        </div>

        {/* ==============================
            DETAIL ESKUL (FOTO DI BELAKANG DENGAN TOMBOL LIHAT GALERI)
        ============================== */}
        <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 mb-8 overflow-hidden transition-colors">
          
          {/* FOTO GALERI SEBAGAI BACKGROUND UTAMA */}
          {fotoUtamaGaleri && (
            <div className="absolute inset-0 z-0">
              <img
                src={
                  fotoUtamaGaleri.foto.startsWith('http')
                    ? fotoUtamaGaleri.foto
                    : `http://localhost:5000/${
                        fotoUtamaGaleri.foto.startsWith('/')
                          ? fotoUtamaGaleri.foto.slice(1)
                          : fotoUtamaGaleri.foto
                      }`
                }
                alt=""
                className="w-full h-full object-cover"
                onError={e => {
                  e.target.style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-[1px]" />
            </div>
          )}

          {/* KONTEN UTAMA DI ATAS BACKGROUND */}
          <div className="relative z-10 p-6 flex flex-col md:flex-row gap-6">

            {/* FOTO LOGO / BANNER KIRI */}
            <div className="w-full md:w-1/3 aspect-square max-w-[220px] max-h-[220px] mx-auto md:mx-0 bg-white dark:bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center text-gray-400 dark:text-gray-500 font-medium shrink-0 border border-gray-100 dark:border-gray-700 shadow-sm">

              {currentEskulDetail?.foto ? (
                <img
                  src={
                    currentEskulDetail.foto.startsWith(
                      'http'
                    )
                      ? currentEskulDetail.foto
                      : `http://localhost:5000/${
                          currentEskulDetail.foto.startsWith(
                            '/'
                          )
                            ? currentEskulDetail.foto.slice(
                                1
                              )
                            : currentEskulDetail.foto
                        }`
                  }
                  alt={formatNamaEskul}
                  className="w-full h-full object-contain"
                  onError={e => {
                    e.target.style.display =
                      'none';
                  }}
                />
              ) : (
                <span>
                  Foto / Banner {formatNamaEskul}
                </span>
              )}

            </div>

            {/* INFORMASI ESKUL */}
            <div className="flex-1 flex flex-col justify-between">

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 drop-shadow-sm">
                    {currentEskulDetail?.nama_eskul ||
                      `Eskul ${formatNamaEskul}`}
                  </h3>

                  {/* Tombol Lihat Galeri */}
                  <button
                    type="button"
                    onClick={handleLihatGaleri}
                    className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1 bg-white/80 dark:bg-gray-900/80 px-2.5 py-1 rounded-md shadow-sm transition-colors"
                  >
                    <Images className="w-3.5 h-3.5" />
                    Lihat Galeri →
                  </button>
                </div>

                <p className="text-xs text-gray-700 dark:text-gray-200 mb-3 font-medium drop-shadow-sm">
                  Pembina:{' '}
                  {currentEskulDetail?.pembina ||
                    'Belum ditentukan'}
                </p>

                <p className="text-sm text-gray-800 dark:text-gray-100 mb-4 leading-relaxed font-medium drop-shadow-sm">
                  {currentEskulDetail?.deskripsi ||
                    `Program latihan untuk pengembangan skill ${formatNamaEskul.toLowerCase()}, strategi tim, dan partisipasi kompetisi antar sekolah.`}
                </p>

                <div className="text-xs text-gray-900 dark:text-gray-100 font-semibold bg-white/80 dark:bg-gray-900/80 p-3 rounded-lg border border-gray-200 dark:border-gray-700 mb-4 shadow-sm">
                  <span>Jadwal:</span>{' '}
                  {currentEskulDetail?.jadwal ||
                    'Belum diatur'}
                </div>
              </div>

              {/* TOMBOL SESUAI ROLE */}
              <div>

                {isAdmin && (
                  <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs font-semibold px-3 py-2 rounded-lg border border-emerald-300 dark:border-emerald-700 inline-flex items-center shadow-sm">
                    Mode Admin: Hak Akses CRUD Aktif
                  </span>
                )}

                {isPembina && (
                  <span className="bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 text-xs font-semibold px-3 py-2 rounded-lg border border-cyan-300 dark:border-cyan-700 inline-flex items-center shadow-sm">
                    Mode Pembina: Hak Akses CRUD Aktif
                  </span>
                )}

                {!isAdmin &&
                  !isPembina && (
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

          </div>
        </div>

        {/* ==============================
            DAFTAR SISWA
        ============================== */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors">

          <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">

            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 shrink-0">
              <ClipboardList className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              Daftar Siswa Terdaftar ({filteredSiswa.length} Siswa)
            </h3>

            <div className="flex items-center gap-2 w-full sm:w-auto">

              {/* SEARCH */}
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

              {/* TAMBAH SISWA */}
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

          {/* TABLE */}
          <div className="overflow-x-auto">

            {loading ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400 text-sm">
                Memuat data siswa dari backend...
              </div>
            ) : (
              <table className="w-full text-left border-collapse">

                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50/50 dark:bg-gray-800/50">

                    <th className="py-3 px-4">
                      No
                    </th>

                    <th className="py-3 px-4">
                      Foto
                    </th>

                    <th className="py-3 px-4">
                      Nama Siswa
                    </th>

                    <th className="py-3 px-4">
                      Kelas
                    </th>

                    <th className="py-3 px-4">
                      Jenis Kelamin
                    </th>

                    <th className="py-3 px-4">
                      Tanggal Daftar
                    </th>

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

                          {/* FOTO SISWA */}
                          <td className="py-3 px-4">

                            {siswa.foto ? (
                              <img
                                src={
                                  siswa.foto.startsWith(
                                    'http'
                                  )
                                    ? siswa.foto
                                    : `http://localhost:5000/${
                                        siswa.foto.startsWith(
                                          '/'
                                        )
                                          ? siswa.foto.slice(
                                              1
                                            )
                                          : siswa.foto
                                      }`
                                }
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

                          {/* AKSI */}
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
  );
}