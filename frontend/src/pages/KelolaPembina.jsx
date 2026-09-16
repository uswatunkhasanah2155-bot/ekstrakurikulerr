// src/pages/KelolaPembina.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import {
  getDaftarPembina,
  tambahPembina,
  hapusPembina,
  getDaftarEskul
} from '../services/api';

export default function KelolaPembina() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [daftarPembina, setDaftarPembina] = useState([]);
  const [daftarEskul, setDaftarEskul] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    id_eskul: '',
  });

  useEffect(() => {
    const roleUser = localStorage.getItem('role');

    if (
      roleUser &&
      roleUser.toUpperCase() === 'ADMIN'
    ) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }

    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);

    const [pembinaData, eskulData] =
      await Promise.all([
        getDaftarPembina(),
        getDaftarEskul(),
      ]);

    setDaftarPembina(
      pembinaData || []
    );

    setDaftarEskul(
      eskulData.data ||
      eskulData ||
      []
    );

    setLoading(false);
  }

  const handleOpenTambah = () => {
    setFormData({
      username: '',
      password: '',
      id_eskul: ''
    });

    setIsModalOpen(true);
  };

  const handleSimpan = async (e) => {
    e.preventDefault();

    if (
      !formData.username ||
      !formData.password ||
      !formData.id_eskul
    ) {
      alert('Semua field wajib diisi!');
      return;
    }

    setSaving(true);

    const result =
      await tambahPembina(formData);

    setSaving(false);

    if (result.success) {
      alert(
        'Berhasil menambahkan akun pembina!'
      );

      setIsModalOpen(false);
      fetchData();
    } else {
      alert(
        'Gagal menambahkan akun pembina: ' +
          result.error
      );
    }
  };

  const handleHapus = async (
    idUser,
    username
  ) => {
    if (
      window.confirm(
        `Yakin ingin menghapus akun pembina "${username}"?`
      )
    ) {
      const result =
        await hapusPembina(idUser);

      if (result.success) {
        setDaftarPembina((prev) =>
          prev.filter(
            (p) => p.id_user !== idUser
          )
        );
      } else {
        alert(
          'Gagal menghapus akun: ' +
            result.error
        );
      }    
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 transition-colors duration-300">

      <Sidebar isAdmin={isAdmin} />

      <main className="flex-1 p-6 overflow-y-auto">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              Kelola Akun Pembina
            </h2>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Buat dan kelola akun pembina untuk
              setiap ekstrakurikuler.
            </p>
          </div>

          <button
            onClick={handleOpenTambah}
            className="bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm flex items-center gap-2 transition-colors"
          >
            + Tambah Pembina
          </button>
        </div>

        {/* TABEL */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors duration-300">

          {/* HEADER TABEL */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">
              📋 Daftar Pembina (
              {daftarPembina.length})
            </h3>
          </div>

          <div className="overflow-x-auto">

            {/* LOADING */}
            {loading ? (

              <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                Memuat data...
              </div>

            ) : daftarPembina.length === 0 ? (

              /* DATA KOSONG */
              <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
                <span className="text-4xl mb-2">
                  👤
                </span>

                <p className="text-sm">
                  Belum ada akun pembina yang
                  dibuat.
                </p>
              </div>

            ) : (

              /* TABEL DATA */
              <table className="w-full text-left border-collapse">

                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50/50 dark:bg-gray-800/30">

                    <th className="py-3 px-4">
                      No
                    </th>

                    <th className="py-3 px-4">
                      Username
                    </th>

                    <th className="py-3 px-4">
                      Eskul yang Dibina
                    </th>

                    <th className="py-3 px-4 text-center">
                      Aksi
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm text-gray-700 dark:text-gray-300">

                  {daftarPembina.map(
                    (p, idx) => (
                      <tr
                        key={p.id_user}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >

                        <td className="py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                          {idx + 1}
                        </td>

                        <td className="py-3 px-4 font-semibold text-gray-800 dark:text-gray-100">
                          {p.username}
                        </td>

                        <td className="py-3 px-4">

                          <span className="bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 text-xs font-semibold px-2.5 py-1 rounded-full">
                            {p.eskul?.nama_eskul ||
                              'Belum ada eskul'}
                          </span>

                        </td>

                        <td className="py-3 px-4 text-center">

                          <button
                            onClick={() =>
                              handleHapus(
                                p.id_user,
                                p.username
                              )
                            }
                            className="text-xs bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2.5 py-1 rounded-md font-medium hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                          >
                            Hapus
                          </button>

                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            )}

          </div>
        </div>
      </main>

      {/* MODAL TAMBAH PEMBINA */}
      {isModalOpen && (

        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 z-50 flex justify-center items-center p-4">

          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-800">

            {/* HEADER MODAL */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/60">

              <h3 className="font-bold text-gray-800 dark:text-gray-100">
                Tambah Akun Pembina
              </h3>

              <button
                onClick={() =>
                  setIsModalOpen(false)
                }
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-bold text-lg transition-colors"
              >
                &times;
              </button>

            </div>

            {/* FORM */}
            <form
              onSubmit={handleSimpan}
              className="p-5 space-y-4"
            >

              {/* USERNAME */}
              <div>

                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Username
                </label>

                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      username:
                        e.target.value
                    })
                  }
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm outline-none bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                  placeholder="Masukkan username"
                />

              </div>

              {/* PASSWORD */}
              <div>

                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>

                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      password:
                        e.target.value
                    })
                  }
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm outline-none bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                  placeholder="Masukkan password"
                />

              </div>

              {/* ESKUL */}
              <div>

                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Eskul yang Dibina
                </label>

                <select
                  value={formData.id_eskul}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      id_eskul:
                        e.target.value
                    })
                  }
                  required
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm focus:ring-cyan-500 focus:border-cyan-500 outline-none bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 transition-colors"
                >
                  <option
                    value=""
                    disabled
                  >
                    Pilih Eskul
                  </option>

                  {daftarEskul.map(
                    (eskul) => (
                      <option
                        key={
                          eskul.id_eskul
                        }
                        value={
                          eskul.id_eskul
                        }
                      >
                        {eskul.nama_eskul}
                      </option>
                    )
                  )}
                </select>

              </div>

              {/* BUTTON */}
              <div className="pt-2 flex gap-3 justify-end">

                <button
                  type="button"
                  onClick={() =>
                    setIsModalOpen(false)
                  }
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving
                    ? 'Menyimpan...'
                    : 'Simpan'}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}