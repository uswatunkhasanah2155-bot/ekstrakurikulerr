// src/pages/RegistrationForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import {
  tambahPendaftar,
  getDaftarEskul,
  getDaftarKelas,
  getProfilSiswaSaya
} from '../services/api';

export default function RegistrationForm() {
  const { namaEskul } = useParams();
  const navigate = useNavigate();

  const formatNamaEskul = namaEskul
    ? namaEskul
        .split('-')
        .map(
          (word) =>
            word.charAt(0).toUpperCase() + word.slice(1)
        )
        .join(' ')
    : 'Ekstrakurikuler';

  const [formData, setFormData] = useState({
    namaLengkap: '',
    id_kelas: '',
    jenisKelamin: '',
    foto: null
  });

  const [loading, setLoading] = useState(false);

  const [daftarKelas, setDaftarKelas] = useState([]);
  const [loadingKelas, setLoadingKelas] = useState(true);

  // OPSI 2: kalau siswa sudah punya profil, nama/kelas/gender
  // tidak bisa diubah lagi lewat form pendaftaran eskul baru.
  const [profilSudahAda, setProfilSudahAda] = useState(false);
  const [loadingProfil, setLoadingProfil] = useState(true);

  useEffect(() => {
    async function fetchKelas() {
      setLoadingKelas(true);
      try {
        const data = await getDaftarKelas();
        setDaftarKelas(data || []);
      } catch (error) {
        console.error('Gagal mengambil daftar kelas:', error);
        setDaftarKelas([]);
      } finally {
        setLoadingKelas(false);
      }
    }

    async function fetchProfilSaya() {
      setLoadingProfil(true);
      try {
        const profil = await getProfilSiswaSaya();

        if (profil) {
          setProfilSudahAda(true);

          setFormData((prev) => ({
            ...prev,
            namaLengkap: profil.nama_siswa || '',
            id_kelas: profil.id_kelas
              ? String(profil.id_kelas)
              : '',
            jenisKelamin:
              profil.jenis_kelamin === 'P'
                ? 'Perempuan'
                : 'Laki-laki'
          }));
        }
      } catch (error) {
        console.error('Gagal mengambil profil siswa:', error);
      } finally {
        setLoadingProfil(false);
      }
    }

    fetchKelas();
    fetchProfilSaya();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      foto: e.target.files[0]
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const daftarEskul = await getDaftarEskul();

      const slugFormatted = namaEskul
        ? namaEskul
            .trim()
            .toLowerCase()
            .replace(/[\s%20]+/g, '-')
        : '';

      const eskulDitemukan = daftarEskul.find((item) => {
        if (!item.nama_eskul) return false;

        const dbEskulSlug = item.nama_eskul
          .trim()
          .toLowerCase()
          .replace(/[\s%20]+/g, '-');

        return dbEskulSlug === slugFormatted;
      });

      if (!eskulDitemukan) {
        alert('Ekstrakurikuler tidak ditemukan di database!');
        setLoading(false);
        return;
      }

      const rawIdUser =
        localStorage.getItem('id_user') ||
        localStorage.getItem('userId');

      const userIdLogin = rawIdUser
        ? Number(rawIdUser)
        : null;

      const dataToSend = new FormData();

      dataToSend.append(
        'id_eskul',
        eskulDitemukan.id_eskul
      );

      dataToSend.append('id_user', userIdLogin);

      dataToSend.append(
        'nama',
        formData.namaLengkap
      );

      dataToSend.append(
        'id_kelas',
        formData.id_kelas
      );

      dataToSend.append(
        'jenisKelamin',
        formData.jenisKelamin
      );

      if (formData.foto) {
        dataToSend.append('foto', formData.foto);
      }

      const result = await tambahPendaftar(dataToSend);

      if (result.success) {
        alert(
          `Pendaftaran untuk ${formatNamaEskul} berhasil dikirim!`
        );

        navigate(`/eskul/${slugFormatted}`);
      } else {
        alert('Gagal mendaftar: ' + result.error);
      }
    } catch (err) {
      alert('Terjadi kesalahan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 transition-colors duration-300">
      <Sidebar />

      <main className="flex-1 p-6 overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6">
          Form Pendaftaran Ekstrakurikuler:{' '}
          {formatNamaEskul}
        </h2>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 max-w-2xl transition-colors">
          {profilSudahAda && (
            <div className="mb-4 text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2">
              Data profil kamu sudah tersimpan. Nama, kelas, dan jenis
              kelamin tidak bisa diubah dari form ini — hubungi admin
              kalau ada yang perlu dikoreksi.
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {/* Nama Lengkap */}
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">
                Nama Lengkap
              </label>

              <input
                type="text"
                name="namaLengkap"
                value={formData.namaLengkap}
                onChange={handleChange}
                required
                disabled={profilSudahAda || loadingProfil}
                placeholder="Masukkan nama lengkapmu"
                className="w-full px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100 dark:disabled:bg-gray-800/60 disabled:text-gray-500 dark:disabled:text-gray-400"
              />
            </div>

            {/* Kelas */}
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">
                Kelas
              </label>

              <select
                name="id_kelas"
                value={formData.id_kelas}
                onChange={handleChange}
                required
                disabled={
                  loadingKelas ||
                  profilSudahAda ||
                  loadingProfil
                }
                className="w-full px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100 dark:disabled:bg-gray-800/60 disabled:text-gray-500 dark:disabled:text-gray-400"
              >
                <option value="" disabled>
                  {loadingKelas
                    ? 'Memuat daftar kelas...'
                    : 'Pilih Kelas'}
                </option>

                {daftarKelas.map((kls) => (
                  <option
                    key={kls.id_kelas}
                    value={kls.id_kelas}
                  >
                    {kls.nama_kelas}
                  </option>
                ))}
              </select>
            </div>

            {/* Jenis Kelamin */}
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">
                Jenis Kelamin
              </label>

              <select
                name="jenisKelamin"
                value={formData.jenisKelamin}
                onChange={handleChange}
                required
                disabled={profilSudahAda || loadingProfil}
                className="w-full px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100 dark:disabled:bg-gray-800/60 disabled:text-gray-500 dark:disabled:text-gray-400"
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

            {/* Foto */}
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">
                Foto Siswa
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                required={!profilSudahAda}
                className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 dark:file:bg-emerald-900/40 file:text-emerald-700 dark:file:text-emerald-400 hover:file:bg-emerald-100 dark:hover:file:bg-emerald-900/60 cursor-pointer"
              />

              {profilSudahAda && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Opsional — hanya diisi kalau ingin memperbarui foto.
                </p>
              )}
            </div>

            {/* Tombol */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading || loadingProfil}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                {loading
                  ? 'Mengirim...'
                  : 'Kirim Pendaftaran'}
              </button>

              <button
                type="button"
                onClick={() => navigate(-1)}
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