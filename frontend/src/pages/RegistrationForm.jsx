// src/pages/RegistrationForm.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ClipboardList, Lock, ImagePlus, Send, ArrowLeft } from 'lucide-react';
// Samakan import ini dengan yang dipakai di DashboardSiswa.jsx
import Navbar from '../components/Navbar';
import {
  tambahPendaftar,
  getDaftarEskul,
  getDaftarKelas,
  getProfilSiswaSaya
} from '../services/api';

const labelClass =
  'mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400';

const fieldClass =
  'w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:disabled:bg-gray-800/60 dark:disabled:text-gray-400';

export default function RegistrationForm() {
  const { namaEskul } = useParams();
  const navigate = useNavigate();

  const formatNamaEskul = namaEskul
    ? namaEskul
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
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

  // Kalau siswa sudah punya profil, nama/kelas/gender dikunci.
  const [profilSudahAda, setProfilSudahAda] = useState(false);
  const [loadingProfil, setLoadingProfil] = useState(true);

  const terkunci = profilSudahAda || loadingProfil;

  // Preview foto yang baru dipilih
  const previewFoto = useMemo(
    () => (formData.foto ? URL.createObjectURL(formData.foto) : null),
    [formData.foto]
  );

  useEffect(() => {
    return () => {
      if (previewFoto) URL.revokeObjectURL(previewFoto);
    };
  }, [previewFoto]);

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
            id_kelas: profil.id_kelas ? String(profil.id_kelas) : '',
            jenisKelamin: profil.jenis_kelamin === 'P' ? 'Perempuan' : 'Laki-laki'
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
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, foto: e.target.files[0] || null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const daftarEskul = await getDaftarEskul();

      const slugFormatted = namaEskul
        ? namaEskul.trim().toLowerCase().replace(/[\s%20]+/g, '-')
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
        localStorage.getItem('id_user') || localStorage.getItem('userId');
      const userIdLogin = rawIdUser ? Number(rawIdUser) : null;

      const dataToSend = new FormData();
      dataToSend.append('id_eskul', eskulDitemukan.id_eskul);
      dataToSend.append('id_user', userIdLogin);
      dataToSend.append('nama', formData.namaLengkap);
      dataToSend.append('id_kelas', formData.id_kelas);
      dataToSend.append('jenisKelamin', formData.jenisKelamin);

      if (formData.foto) {
        dataToSend.append('foto', formData.foto);
      }

      const result = await tambahPendaftar(dataToSend);

      if (result.success) {
        alert(`Pendaftaran untuk ${formatNamaEskul} berhasil dikirim!`);
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
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-800 transition-colors duration-300 dark:bg-gray-950 dark:text-gray-100">
      <Navbar />

      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto w-full max-w-4xl">
          {/* Kembali */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </button>

          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            {/* Header kartu */}
            <div className="flex items-center gap-4 bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-6 text-white sm:px-8">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <ClipboardList className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-100">
                  Form Pendaftaran
                </p>
                <h1 className="text-xl font-extrabold sm:text-2xl">
                  {formatNamaEskul}
                </h1>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6 sm:p-8">
              {profilSudahAda && (
                <div className="flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs leading-relaxed text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>
                    Data profil kamu sudah tersimpan. Nama, kelas, dan jenis
                    kelamin tidak bisa diubah dari form ini. Hubungi admin kalau
                    ada yang perlu dikoreksi.
                  </p>
                </div>
              )}

              {/* Nama Lengkap */}
              <div>
                <label className={labelClass}>
                  Nama Lengkap
                  {terkunci && <Lock className="h-3 w-3" />}
                </label>
                <input
                  type="text"
                  name="namaLengkap"
                  value={formData.namaLengkap}
                  onChange={handleChange}
                  required
                  disabled={terkunci}
                  placeholder="Masukkan nama lengkapmu"
                  className={fieldClass}
                />
              </div>

              {/* Kelas & Jenis Kelamin berdampingan */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>
                    Kelas
                    {terkunci && <Lock className="h-3 w-3" />}
                  </label>
                  <select
                    name="id_kelas"
                    value={formData.id_kelas}
                    onChange={handleChange}
                    required
                    disabled={loadingKelas || terkunci}
                    className={fieldClass}
                  >
                    <option value="" disabled>
                      {loadingKelas ? 'Memuat daftar kelas...' : 'Pilih Kelas'}
                    </option>
                    {daftarKelas.map((kls) => (
                      <option key={kls.id_kelas} value={kls.id_kelas}>
                        {kls.nama_kelas}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>
                    Jenis Kelamin
                    {terkunci && <Lock className="h-3 w-3" />}
                  </label>
                  <select
                    name="jenisKelamin"
                    value={formData.jenisKelamin}
                    onChange={handleChange}
                    required
                    disabled={terkunci}
                    className={fieldClass}
                  >
                    <option value="" disabled>
                      Pilih Jenis Kelamin
                    </option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
              </div>

              {/* Foto */}
              <div>
                <label className={labelClass}>
                  Foto Siswa
                  {profilSudahAda && (
                    <span className="font-normal normal-case tracking-normal text-gray-400 dark:text-gray-500">
                      (opsional)
                    </span>
                  )}
                </label>

                <label className="flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed border-gray-200 p-4 transition-colors hover:border-emerald-500 hover:bg-emerald-50/50 dark:border-gray-700 dark:hover:border-emerald-600 dark:hover:bg-emerald-950/20">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100 text-gray-400 dark:bg-gray-800">
                    {previewFoto ? (
                      <img
                        src={previewFoto}
                        alt="Preview foto"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImagePlus className="h-6 w-6" />
                    )}
                  </div>
                  <div className="min-w-0 text-sm">
                    <p className="truncate font-semibold text-gray-700 dark:text-gray-200">
                      {formData.foto ? formData.foto.name : 'Klik untuk memilih foto'}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                      {profilSudahAda
                        ? 'Isi hanya kalau ingin memperbarui foto.'
                        : 'Format JPG atau PNG.'}
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    required={!profilSudahAda}
                    className="sr-only"
                  />
                </label>
              </div>

              {/* Tombol */}
              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading || loadingProfil}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  {loading ? 'Mengirim...' : 'Kirim Pendaftaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}