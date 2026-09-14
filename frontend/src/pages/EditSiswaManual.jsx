// src/pages/EditSiswaManual.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import {
  getDaftarEskul,
  getSiswaByEskul,
  getDaftarKelas,
  updatePendaftar
} from '../services/api';
import { ArrowLeft } from 'lucide-react';

export default function EditSiswaManual() {
  const { namaEskul, idPendaftaran } = useParams();
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
            item =>
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
            s =>
              String(s.id) ===
              String(idPendaftaran)
          );

        if (target) {
          setCurrentIdSiswa(
            target.id_siswa
          );

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

  // ==================================================
  // HANDLE SUBMIT
  // ==================================================
  const handleSubmit = async e => {
    e.preventDefault();

    if (!formData.id_kelas) {
      alert('Silakan pilih kelas terlebih dahulu.');
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
    <div className="flex min-h-screen bg-gray-50 relative">

      <Sidebar isAdmin={isAdmin} />

      <main className="flex-1 p-6 overflow-y-auto">

        <button
          onClick={() =>
            navigate(
              `/eskul/${namaEskul}`
            )
          }
          className="text-sm text-gray-500 hover:text-emerald-600 font-medium inline-flex items-center gap-1.5 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Detail Eskul
        </button>

        <h2 className="text-xl font-bold text-gray-800 mb-6">
          Edit Data Siswa: {formatNamaEskul}
        </h2>

        {fetching ? (

          <div className="text-center text-gray-500 text-sm py-10">
            Memuat data siswa...
          </div>

        ) : notFound ? (

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-400 max-w-lg">
            Data siswa tidak ditemukan.
          </div>

        ) : (

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-lg">

            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >

              {/* NAMA */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Siswa
                </label>

                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      nama: e.target.value
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none bg-white focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Masukkan nama lengkap"
                />
              </div>

              {/* KELAS */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kelas
                </label>

                <select
                  value={formData.id_kelas}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      id_kelas:
                        e.target.value
                    })
                  }
                  required
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                >

                  <option
                    value=""
                    disabled
                  >
                    Pilih Kelas
                  </option>

                  {daftarKelas.map(
                    kelas => (
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jenis Kelamin
                </label>

                <select
                  value={
                    formData.jenisKelamin
                  }
                  onChange={e =>
                    setFormData({
                      ...formData,
                      jenisKelamin:
                        e.target.value
                    })
                  }
                  required
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Foto (opsional, kosongkan jika tidak diganti)
                </label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={e =>
                    setFormData({
                      ...formData,
                      foto:
                        e.target.files[0]
                    })
                  }
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
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
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
                >
                  Batal
                </button>

              </div>

            </form>

          </div>
        )}

      </main>
    </div>
  );
}