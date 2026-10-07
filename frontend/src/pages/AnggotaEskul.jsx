// src/pages/AnggotaEskul.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { fotoUrl } from '../utils/fotoUrl';
import {
  getDaftarEskul,
  getSiswaByEskul,
  hapusPendaftar
} from '../services/api';
import {
  Users,
  Search,
  Pencil,
  Trash2,
  User
} from 'lucide-react';

export default function AnggotaEskul() {
  const { namaEskul } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // slug "paskibra" / "pbb-sekolah" -> "paskibra" / "pbb sekolah"
  const cleanNamaEskul = namaEskul ? namaEskul.replace(/-/g, ' ') : '';

  const formatNamaEskul = cleanNamaEskul
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const role = (localStorage.getItem('role') || '').toUpperCase();
  const idEskulPembina = localStorage.getItem('id_eskul');
  const isStaff = role === 'ADMIN' || role === 'PEMBINA';

  const [loading, setLoading] = useState(true);
  const [daftarAnggota, setDaftarAnggota] = useState([]);
  const [dilarang, setDilarang] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // pencarian ikut tersimpan di URL (?cari=...)
  const kataCari = searchParams.get('cari') || '';

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setDilarang(false);

      try {
        const listEskul = await getDaftarEskul();

        const matched = (listEskul || []).find(
          item =>
            item.nama_eskul &&
            item.nama_eskul.toLowerCase().trim() ===
              cleanNamaEskul.toLowerCase().trim()
        );

        // Pembina hanya boleh melihat anggota eskul yang dibinanya
        if (
          role === 'PEMBINA' &&
          matched &&
          String(matched.id_eskul || matched.id) !== String(idEskulPembina)
        ) {
          setDilarang(true);
          setDaftarAnggota([]);
          setLoading(false);
          return;
        }

        const anggota = await getSiswaByEskul(cleanNamaEskul);
        setDaftarAnggota(anggota || []);
      } catch (error) {
        console.error('Gagal memuat anggota eskul:', error);
        setDaftarAnggota([]);
      }

      setLoading(false);
    }

    fetchData();
  }, [cleanNamaEskul, role, idEskulPembina]);

  const handleCari = e => {
    const value = e.target.value;
    if (value) {
      setSearchParams({ cari: value }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const handleHapus = async item => {
    if (!window.confirm(`Keluarkan ${item.nama} dari ${formatNamaEskul}?`)) {
      return;
    }

    setDeletingId(item.id);
    const result = await hapusPendaftar(item.id);
    setDeletingId(null);

    if (result.success) {
      setDaftarAnggota(prev => prev.filter(a => a.id !== item.id));
    } else {
      alert('Gagal menghapus anggota: ' + (result.error || 'Terjadi kesalahan'));
    }
  };

  const labelGender = jk => (jk === 'P' ? 'Perempuan' : 'Laki-laki');

  const anggotaTampil = daftarAnggota.filter(a =>
    (a.nama || '').toLowerCase().includes(kataCari.toLowerCase().trim())
  );

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 transition-colors duration-300">
      <Sidebar />

      <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
        {/* JUDUL */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-gray-900 dark:text-white">
                Anggota {formatNamaEskul}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {loading
                  ? 'Memuat data...'
                  : `${daftarAnggota.length} siswa terdaftar`}
              </p>
            </div>
          </div>
        </div>

        {dilarang ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-12 text-center text-sm text-gray-500 dark:text-gray-400">
            Kamu hanya dapat melihat anggota eskul yang kamu bina.
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
            {/* PENCARIAN */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-800">
              <div className="relative max-w-sm group">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-emerald-500" />
                <input
                  type="text"
                  value={kataCari}
                  onChange={handleCari}
                  placeholder="Cari nama siswa..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg outline-none bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 transition-all duration-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 focus:shadow-[0_0_18px_rgba(16,185,129,0.35)]"
                />
              </div>
            </div>

            {/* TABEL */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-800/30">
                    <th className="py-3 px-4 font-semibold">No</th>
                    <th className="py-3 px-4 font-semibold">Nama</th>
                    <th className="py-3 px-4 font-semibold">Kelas</th>
                    <th className="py-3 px-4 font-semibold">Jenis Kelamin</th>
                    <th className="py-3 px-4 font-semibold">Tanggal Daftar</th>
                    {isStaff && (
                      <th className="py-3 px-4 font-semibold text-center">Aksi</th>
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm text-gray-700 dark:text-gray-300">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={isStaff ? 6 : 5}
                        className="py-10 text-center text-gray-400"
                      >
                        Memuat anggota...
                      </td>
                    </tr>
                  ) : anggotaTampil.length === 0 ? (
                    <tr>
                      <td
                        colSpan={isStaff ? 6 : 5}
                        className="py-10 text-center text-gray-400"
                      >
                        {daftarAnggota.length === 0
                          ? 'Belum ada anggota di eskul ini.'
                          : `Tidak ada siswa dengan nama "${kataCari}".`}
                      </td>
                    </tr>
                  ) : (
                    anggotaTampil.map((item, idx) => (
                      <tr
                        key={item.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="py-3 px-4 text-gray-500 dark:text-gray-400">
                          {idx + 1}
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                              {item.foto ? (
                                <img
                                  src={fotoUrl(item.foto)}
                                  alt={item.nama}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                            <span className="font-semibold text-gray-800 dark:text-gray-100">
                              {item.nama}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4">{item.kelas}</td>

                        <td className="py-3 px-4">
                          {labelGender(item.jenisKelamin)}
                        </td>

                        <td className="py-3 px-4 text-gray-500 dark:text-gray-400">
                          {item.tanggal}
                        </td>

                        {isStaff && (
                          <td className="py-3 px-4 text-center space-x-2 whitespace-nowrap">
                            <button
                              onClick={() =>
                                navigate(
                                  `/eskul/${namaEskul}/siswa/edit/${item.id}`
                                )
                              }
                              className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-md font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 inline-flex items-center gap-1 transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Edit
                            </button>

                            <button
                              onClick={() => handleHapus(item)}
                              disabled={deletingId === item.id}
                              className="text-xs bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-3 py-1 rounded-md font-medium hover:bg-red-100 dark:hover:bg-red-900/50 inline-flex items-center gap-1 transition-colors disabled:opacity-50"
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
            </div>
          </div>
        )}
      </main>
    </div>
  );
}