// src/pages/ManajemenKelas.jsx
import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import {
  getDaftarKelas,
  tambahKelas,
  updateKelas,
  hapusKelas
} from '../services/api';

export default function ManajemenKelas() {
  const [daftarKelas, setDaftarKelas] = useState([]);
  const [namaKelas, setNamaKelas] = useState('');
  const [editId, setEditId] = useState(null);
  const [editNama, setEditNama] = useState('');
  const [loading, setLoading] = useState(true);

  // ===============================
  // AMBIL DATA KELAS
  // ===============================
  const loadKelas = async () => {
    setLoading(true);

    const data = await getDaftarKelas();

    setDaftarKelas(data);
    setLoading(false);
  };

  useEffect(() => {
    loadKelas();
  }, []);

  // ===============================
  // TAMBAH KELAS
  // ===============================
  const handleTambah = async (e) => {
    e.preventDefault();

    if (!namaKelas.trim()) {
      alert('Nama kelas wajib diisi');
      return;
    }

    const result = await tambahKelas(namaKelas.trim());

    if (!result.success) {
      alert(result.error);
      return;
    }

    alert('Kelas berhasil ditambahkan');

    setNamaKelas('');
    loadKelas();
  };

  // ===============================
  // MULAI EDIT
  // ===============================
  const handleMulaiEdit = (kelas) => {
    setEditId(kelas.id_kelas);
    setEditNama(kelas.nama_kelas);
  };

  // ===============================
  // BATAL EDIT
  // ===============================
  const handleBatalEdit = () => {
    setEditId(null);
    setEditNama('');
  };

  // ===============================
  // SIMPAN EDIT
  // ===============================
  const handleSimpanEdit = async (idKelas) => {
    if (!editNama.trim()) {
      alert('Nama kelas wajib diisi');
      return;
    }

    const result = await updateKelas(
      idKelas,
      editNama.trim()
    );

    if (!result.success) {
      alert(result.error);
      return;
    }

    alert('Kelas berhasil diupdate');

    handleBatalEdit();
    loadKelas();
  };

  // ===============================
  // HAPUS KELAS
  // ===============================
  const handleHapus = async (kelas) => {
    const yakin = window.confirm(
      `Yakin ingin menghapus kelas "${kelas.nama_kelas}"?`
    );

    if (!yakin) return;

    const result = await hapusKelas(kelas.id_kelas);

    if (!result.success) {
      alert(result.error);
      return;
    }

    alert('Kelas berhasil dihapus');

    loadKelas();
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 transition-colors duration-300">

      <Sidebar isAdmin={true} />

      <main className="flex-1 p-6 overflow-y-auto">

        {/* JUDUL */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Manajemen Kelas
          </h1>

          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Kelola daftar kelas siswa
          </p>
        </div>

        {/* FORM TAMBAH KELAS */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 mb-6 transition-colors duration-300">

          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Tambah Kelas
          </h2>

          <form
            onSubmit={handleTambah}
            className="flex gap-3"
          >
            <input
              type="text"
              value={namaKelas}
              onChange={(e) =>
                setNamaKelas(e.target.value)
              }
              placeholder="Masukan Nama Kelas"
              className="flex-1 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 outline-none bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />

            <button
              type="submit"
              className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Tambah
            </button>
          </form>
        </div>

        {/* DAFTAR KELAS */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors duration-300">

          {/* HEADER */}
          <div className="p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Daftar Kelas
            </h2>
          </div>

          {/* LOADING */}
          {loading ? (

            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              Memuat data kelas...
            </div>

          ) : daftarKelas.length === 0 ? (

            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              Belum ada data kelas
            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">

                    <th className="px-5 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">
                      No
                    </th>

                    <th className="px-5 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Nama Kelas
                    </th>

                    <th className="px-5 py-3 text-center text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Aksi
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">

                  {daftarKelas.map((kelas, index) => (

                    <tr
                      key={kelas.id_kelas}
                      className="border-b last:border-b-0 border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >

                      {/* NO */}
                      <td className="px-5 py-4 text-gray-600 dark:text-gray-400">
                        {index + 1}
                      </td>

                      {/* NAMA KELAS */}
                      <td className="px-5 py-4">

                        {editId === kelas.id_kelas ? (

                          <input
                            type="text"
                            value={editNama}
                            onChange={(e) =>
                              setEditNama(e.target.value)
                            }
                            className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 w-full max-w-xs outline-none bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />

                        ) : (

                          <span className="font-medium text-gray-800 dark:text-gray-100">
                            {kelas.nama_kelas}
                          </span>

                        )}

                      </td>

                      {/* AKSI */}
                      <td className="px-5 py-4">

                        <div className="flex justify-center gap-2">

                          {editId === kelas.id_kelas ? (

                            <>
                              <button
                                onClick={() =>
                                  handleSimpanEdit(
                                    kelas.id_kelas
                                  )
                                }
                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                              >
                                Simpan
                              </button>

                              <button
                                onClick={handleBatalEdit}
                                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                              >
                                Batal
                              </button>
                            </>

                          ) : (

                            <>
                              <button
                                onClick={() =>
                                  handleMulaiEdit(kelas)
                                }
                                className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors"
                              >
                                Edit
                              </button>

                              <button
                                onClick={() =>
                                  handleHapus(kelas)
                                }
                                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                              >
                                Hapus
                              </button>
                            </>

                          )}

                        </div>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </main>
    </div>
  );
}