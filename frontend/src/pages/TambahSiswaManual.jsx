// src/pages/TambahSiswaManual.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import {
  getDaftarEskul,
  getDaftarKelas,
  tambahPendaftar
} from '../services/api';
import { ArrowLeft } from 'lucide-react';

export default function TambahSiswaManual() {
  const { namaEskul } = useParams();
  const navigate = useNavigate();

  const cleanNamaEskul = namaEskul
    ? namaEskul.replace(/-/g, ' ')
    : '';

  const formatNamaEskul = cleanNamaEskul
    .split(' ')
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(' ');

  const [isAdmin, setIsAdmin] = useState(false);
  const [currentEskul, setCurrentEskul] = useState(null);
  const [daftarKelas, setDaftarKelas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingKelas, setLoadingKelas] = useState(true);

  const [formData, setFormData] = useState({
    nama: '',
    id_kelas: '',
    jenisKelamin: '',
    foto: null
  });

  useEffect(() => {
    const roleUser = localStorage.getItem('role');

    setIsAdmin(
      !!(
        roleUser &&
        roleUser.toUpperCase() === 'ADMIN'
      )
    );

    async function fetchData() {
      try {
        // Ambil data eskul
        const eskulData = await getDaftarEskul();

        const listEskul =
          eskulData.data || eskulData || [];

        const matched = listEskul.find(
          (item) =>
            item.nama_eskul &&
            item.nama_eskul
              .toLowerCase()
              .trim() ===
              cleanNamaEskul
                .toLowerCase()
                .trim()
        );

        setCurrentEskul(matched || null);

        // Ambil data kelas
        const kelasData =
          await getDaftarKelas();

        setDaftarKelas(
          Array.isArray(kelasData)
            ? kelasData
            : []
        );
      } catch (error) {
        console.error(
          'Gagal mengambil data:',
          error
        );

        setDaftarKelas([]);
      } finally {
        setLoadingKelas(false);
      }
    }

    fetchData();
  }, [namaEskul, cleanNamaEskul]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.id_kelas) {
      alert('Silakan pilih kelas terlebih dahulu');
      return;
    }

    if (!currentEskul) {
      alert(
        'Data ekstrakurikuler tidak ditemukan'
      );
      return;
    }

    setLoading(true);

    const userIdLogin =
      localStorage.getItem('id_user') ||
      localStorage.getItem('userId');

    const dataToSend = new FormData();

    dataToSend.append(
      'id_eskul',
      currentEskul.id_eskul
    );

    dataToSend.append(
      'nama_siswa',
      formData.nama
    );

    dataToSend.append(
      'id_kelas',
      formData.id_kelas
    );

    dataToSend.append(
      'jenis_kelamin',
      formData.jenisKelamin === 'Perempuan'
        ? 'P'
        : 'L'
    );

    if (userIdLogin) {
      dataToSend.append(
        'id_user',
        Number(userIdLogin)
      );
    }

    if (formData.foto) {
      dataToSend.append(
        'foto',
        formData.foto
      );
    }

    const result =
      await tambahPendaftar(dataToSend);

    setLoading(false);

    if (result.success) {
      alert(
        'Berhasil mendaftarkan siswa ke eskul!'
      );

      navigate(`/eskul/${namaEskul}`);
    } else {
      alert(
        'Gagal menyimpan data: ' +
          result.error
      );
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 transition-colors duration-300">

      <Sidebar isAdmin={isAdmin} />

      <main className="flex-1 p-6 overflow-y-auto">

        {/* KEMBALI */}
        <button
          onClick={() =>
            navigate(`/eskul/${namaEskul}`)
          }
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium inline-flex items-center gap-1.5 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Detail Eskul
        </button>

        {/* JUDUL */}
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6">
          Tambah Siswa Manual: {formatNamaEskul}
        </h2>

        {/* FORM */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 max-w-lg transition-colors duration-300">

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >

            {/* NAMA SISWA */}
            <div>

              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nama Siswa
              </label>

              <input
                type="text"
                required
                value={formData.nama}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    nama: e.target.value
                  })
                }
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm outline-none bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                placeholder="Masukkan nama lengkap"
              />

            </div>

            {/* KELAS */}
            <div>

              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Kelas
              </label>

              <select
                value={formData.id_kelas}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    id_kelas: e.target.value
                  })
                }
                required
                disabled={loadingKelas}
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-400 transition-colors"
              >

                <option value="">
                  {loadingKelas
                    ? 'Memuat kelas...'
                    : 'Pilih Kelas'}
                </option>

                {daftarKelas.map((kelas) => (
                  <option
                    key={kelas.id_kelas}
                    value={kelas.id_kelas}
                  >
                    {kelas.nama_kelas}
                  </option>
                ))}

              </select>

            </div>

            {/* JENIS KELAMIN */}
            <div>

              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Jenis Kelamin
              </label>

              <select
                value={formData.jenisKelamin}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    jenisKelamin:
                      e.target.value
                  })
                }
                required
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 transition-colors"
              >

                <option value="" disabled>
                  Pilih Jenis Kelamin
                </option>

                <option value="Laki-laki">
                  Laki-laki
                </option>

                <option value="Perempuan">
                  Perempuan
                </option>

              </select>

            </div>

            {/* FOTO */}
            <div>

              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Foto Siswa
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    foto: e.target.files[0]
                  })
                }
                className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 dark:file:bg-emerald-900/40 file:text-emerald-700 dark:file:text-emerald-300 hover:file:bg-emerald-100 dark:hover:file:bg-emerald-900/60 cursor-pointer"
              />

            </div>

            {/* BUTTON */}
            <div className="flex gap-3 pt-2">

              <button
                type="submit"
                disabled={
                  loading || loadingKelas
                }
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                {loading
                  ? 'Mengirim...'
                  : 'Daftarkan Siswa'}
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/eskul/${namaEskul}`
                  )
                }
                className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
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