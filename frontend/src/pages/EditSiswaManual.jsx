// src/pages/EditSiswaManual.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import {
  getDaftarEskul,
  getSiswaByEskul,
  getDaftarKelas,
  updatePendaftar
} from '../services/api';
import { ArrowLeft, ImagePlus } from 'lucide-react';
import FotoProfilModal from './Fotoprofilmodal';
import { fotoUrl } from '../utils/fotoUrl';

export default function EditSiswaManual() {
  const { namaEskul, idPendaftaran } = useParams();
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
  const [currentEskul, setCurrentEskul] =
    useState(null);
  const [currentIdSiswa, setCurrentIdSiswa] =
    useState(null);

  const [daftarKelas, setDaftarKelas] =
    useState([]);

  const [fetching, setFetching] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [notFound, setNotFound] =
    useState(false);

  const [formData, setFormData] = useState({
    nama: '',
    id_kelas: '',
    jenisKelamin: '',
    foto: null
  });

  const [fotoLama, setFotoLama] = useState(null); // foto siswa yang sudah tersimpan

  const [fileMentah, setFileMentah] = useState(null); // foto yang sedang di-crop

  // Preview foto hasil crop
  const previewFoto = useMemo(
    () => (formData.foto ? URL.createObjectURL(formData.foto) : null),
    [formData.foto]
  );

  useEffect(() => {
    return () => {
      if (previewFoto) URL.revokeObjectURL(previewFoto);
    };
  }, [previewFoto]);

  // ==================================================
  // AMBIL DATA
  // ==================================================
  useEffect(() => {
    const roleUser =
      localStorage.getItem('role');

    setIsAdmin(
      !!(
        roleUser &&
        roleUser.toUpperCase() === 'ADMIN'
      )
    );

    async function fetchData() {
      setFetching(true);

      try {
        // ==============================
        // AMBIL DATA ESKUL
        // ==============================
        const eskulData =
          await getDaftarEskul();

        const listEskul =
          eskulData.data ||
          eskulData ||
          [];

        const matched =
          listEskul.find(
            (item) =>
              item.nama_eskul &&
              item.nama_eskul
                .toLowerCase()
                .trim() ===
              cleanNamaEskul
                .toLowerCase()
                .trim()
          );

        setCurrentEskul(
          matched || null
        );

        // ==============================
        // AMBIL DATA KELAS
        // ==============================
        const kelasData =
          await getDaftarKelas();

        const listKelas =
          kelasData.data ||
          kelasData ||
          [];

        setDaftarKelas(listKelas);

        // ==============================
        // AMBIL DATA SISWA
        // ==============================
        const siswaData =
          await getSiswaByEskul(
            cleanNamaEskul
          );

        const target =
          siswaData.find(
            (s) =>
              String(s.id) ===
              String(idPendaftaran)
          );

        if (target) {
          setCurrentIdSiswa(
            target.id_siswa
          );

          setFotoLama(target.foto || null);

          setFormData({
            nama: target.nama || '',
            id_kelas:
              target.id_kelas
                ? String(target.id_kelas)
                : '',
            jenisKelamin:
              target.jenisKelamin === 'P'
                ? 'Perempuan'
                : 'Laki-laki',
            foto: null
          });
        } else {
          setNotFound(true);
        }

      } catch (error) {
        console.error(
          'Gagal mengambil data:',
          error
        );

        setNotFound(true);
      } finally {
        setFetching(false);
      }
    }

    fetchData();
  }, [
    namaEskul,
    cleanNamaEskul,
    idPendaftaran
  ]);

  // ---------- Foto: pilih -> crop -> masuk ke form ----------
  const handlePilihFoto = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Hanya file gambar yang diizinkan.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Ukuran foto maksimal 10 MB.');
      return;
    }

    // Buka modal preview/crop dulu; foto baru masuk ke form setelah "Simpan foto"
    setFileMentah(file);
  };

  const simpanHasilCrop = (fotoHasilCrop) => {
    if (fotoHasilCrop.size > 2 * 1024 * 1024) {
      alert('Hasil foto masih lebih dari 2 MB. Coba potong area yang lebih kecil.');
      return; // modal tetap terbuka supaya bisa dipotong ulang
    }
    setFormData((prev) => ({ ...prev, foto: fotoHasilCrop }));
    setFileMentah(null);
  };

  // ==================================================
  // HANDLE SUBMIT
  // ==================================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.id_kelas) {
      alert(
        'Silakan pilih kelas terlebih dahulu.'
      );
      return;
    }

    setSaving(true);

    try {
      const dataToSend =
        new FormData();

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
        formData.jenisKelamin ===
          'Perempuan'
          ? 'P'
          : 'L'
      );

      if (formData.foto) {
        dataToSend.append(
          'foto',
          formData.foto
        );
      }

      const result =
        await updatePendaftar(
          idPendaftaran,
          currentEskul
            ? currentEskul.id_eskul
            : null,
          currentIdSiswa,
          dataToSend
        );

      if (result.success) {
        alert(
          'Berhasil memperbarui data siswa!'
        );

        navigate(
          `/eskul/${namaEskul}`
        );
      } else {
        alert(
          'Gagal memperbarui data: ' +
            result.error
        );
      }

    } catch (error) {
      console.error(
        'Error submit:',
        error
      );

      alert(
        'Terjadi kesalahan saat memperbarui data.'
      );
    } finally {
      setSaving(false);
    }
  };

  // ==================================================
  // TAMPILAN
  // ==================================================
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 transition-colors duration-300">

      <Sidebar isAdmin={isAdmin} />

      <main className="flex-1 p-6 overflow-y-auto">

        {/* KEMBALI */}
        <button
          onClick={() =>
            navigate(
              `/eskul/${namaEskul}`
            )
          }
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium inline-flex items-center gap-1.5 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Detail Eskul
        </button>

        {/* JUDUL */}
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6">
          Edit Data Siswa: {formatNamaEskul}
        </h2>

        {/* LOADING */}
        {fetching ? (

          <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-10">
            Memuat data siswa...
          </div>

        ) : notFound ? (

          /* DATA TIDAK DITEMUKAN */
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 text-center text-gray-400 dark:text-gray-500 max-w-lg transition-colors duration-300">
            Data siswa tidak ditemukan.
          </div>

        ) : (

          /* FORM */
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 max-w-lg transition-colors duration-300">

            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >

              {/* NAMA */}
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
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm outline-none bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
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
                      id_kelas:
                        e.target.value
                    })
                  }
                  required
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 transition-colors"
                >

                  <option
                    value=""
                    disabled
                  >
                    Pilih Kelas
                  </option>

                  {daftarKelas.map(
                    (kelas) => (
                      <option
                        key={kelas.id_kelas}
                        value={
                          kelas.id_kelas
                        }
                      >
                        {kelas.nama_kelas}
                      </option>
                    )
                  )}

                </select>

              </div>

              {/* JENIS KELAMIN */}
              <div>

                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Jenis Kelamin
                </label>

                <select
                  value={
                    formData.jenisKelamin
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      jenisKelamin:
                        e.target.value
                    })
                  }
                  required
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 transition-colors"
                >

                  <option
                    value=""
                    disabled
                  >
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
                  Foto (opsional, kosongkan jika tidak diganti)
                </label>

                <label className="flex cursor-pointer items-center gap-4 rounded-lg border-2 border-dashed border-gray-200 p-3 transition-colors hover:border-emerald-500 hover:bg-emerald-50/50 dark:border-gray-700 dark:hover:border-emerald-600 dark:hover:bg-emerald-950/20">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 text-gray-400 dark:bg-gray-800">
                    {(previewFoto || fotoUrl(fotoLama)) ? (
                      <img
                        src={(previewFoto || fotoUrl(fotoLama))}
                        alt="Preview foto"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImagePlus className="h-6 w-6" />
                    )}
                  </div>
                  <div className="min-w-0 text-sm">
                    <p className="font-semibold text-gray-700 dark:text-gray-200">
                      {formData.foto
                          ? 'Foto baru siap dikirim (klik untuk ganti)'
                          : fotoLama
                          ? 'Klik untuk mengganti foto'
                          : 'Klik untuk memilih foto'}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                      Foto bisa dipotong sebelum disimpan.
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePilihFoto}
                    className="sr-only"
                  />
                </label>

              </div>

              {/* BUTTON */}
              <div className="flex gap-3 pt-2">

                <button
                  type="submit"
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                >
                  {saving
                    ? 'Menyimpan...'
                    : 'Simpan Perubahan'}
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
        )}

      </main>

      <FotoProfilModal
        file={fileMentah}
        judul="Sesuaikan foto siswa"
        onCancel={() => setFileMentah(null)}
        onSave={simpanHasilCrop}
      />
    </div>
  );
}