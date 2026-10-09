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

  // Pesan validasi (tampil di bawah input, bukan popup)
  const [errorTambah, setErrorTambah] = useState('');
  const [errorEdit, setErrorEdit] = useState('');

  // Banner hasil aksi: { type: 'success' | 'error', text: string }
  const [notif, setNotif] = useState(null);

  const tampilkanNotif = (type, text) => {
    setNotif({ type, text });
    setTimeout(() => setNotif(null), 3000);
  };

  // Cek nama kelas sudah dipakai (tidak membedakan huruf besar/kecil)
  const namaSudahAda = (nama, kecualiId = null) =>
    daftarKelas.some(
      (k) =>
        k.id_kelas !== kecualiId &&
        k.nama_kelas.trim().toLowerCase() === nama.trim().toLowerCase()
    );

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

    const nama = namaKelas.trim();

    if (!nama) {
      setErrorTambah('Nama kelas wajib diisi');
      return;
    }

    if (namaSudahAda(nama)) {
      setErrorTambah('Nama kelas sudah ada');
      return;
    }

    const result = await tambahKelas(nama);

    if (!result.success) {
      setErrorTambah(result.error || 'Gagal menambah kelas');
      return;
    }

    setNamaKelas('');
    setErrorTambah('');
    tampilkanNotif('success', 'Kelas berhasil ditambahkan');
    loadKelas();
  };

  // ===============================
  // MULAI EDIT
  // ===============================
  const handleMulaiEdit = (kelas) => {
    setEditId(kelas.id_kelas);
    setEditNama(kelas.nama_kelas);
    setErrorEdit('');
  };

  // ===============================
  // BATAL EDIT
  // ===============================
  const handleBatalEdit = () => {
    setEditId(null);
    setEditNama('');
    setErrorEdit('');
  };

  // ===============================
  // SIMPAN EDIT
  // ===============================
  const handleSimpanEdit = async (idKelas) => {
    const nama = editNama.trim();

    if (!nama) {
      setErrorEdit('Nama kelas wajib diisi');
      return;
    }

    if (namaSudahAda(nama, idKelas)) {
      setErrorEdit('Nama kelas sudah ada');
      return;
    }

    const result = await updateKelas(idKelas, nama);

    if (!result.success) {
      setErrorEdit(result.error || 'Gagal mengupdate kelas');
      return;
    }

    handleBatalEdit();
    tampilkanNotif('success', 'Kelas berhasil diupdate');
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
      tampilkanNotif('error', result.error || 'Gagal menghapus kelas');
      return;
    }

    tampilkanNotif('success', 'Kelas berhasil dihapus');
    loadKelas();
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 transition-colors duration-300">

      <Sidebar isAdmin={true} />

      {/* min-w-0 supaya isi tidak mendorong halaman melebihi lebar layar */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 overflow-y-auto">

        {/* JUDUL */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">
            Manajemen Kelas
          </h1>

          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Kelola daftar kelas siswa
          </p>
        </div>

        {/* BANNER HASIL AKSI */}
        {notif && (
          <div
            className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
              notif.type === 'success'
                ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300'
                : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300'
            }`}
          >
            {notif.text}
          </div>
        )}

        {/* FORM TAMBAH KELAS */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 sm:p-5 mb-6 transition-colors duration-300">

          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Tambah Kelas
          </h2>

          <form onSubmit={handleTambah} noValidate>
            <div className="flex gap-3">
              {/* min-w-0: input boleh mengecil, tombol tidak ikut terdorong keluar container */}
              <input
                type="text"
                value={namaKelas}
                onChange={(e) => {
                  setNamaKelas(e.target.value);
                  if (errorTambah) setErrorTambah('');
                }}
                placeholder="Masukan Nama Kelas"
                className={`flex-1 min-w-0 border rounded-lg px-4 py-2 outline-none bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 transition-colors ${
                  errorTambah
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 dark:border-gray-700 focus:ring-blue-500 focus:border-blue-500'
                }`}
              />

              {/* shrink-0 + whitespace-nowrap: ukuran tombol tetap, teks tidak turun baris */}
              <button
                type="submit"
                className="shrink-0 whitespace-nowrap bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                + Tambah
              </button>
            </div>

            {errorTambah && (
              <p className="mt-2 text-sm text-red-500">{errorTambah}</p>
            )}
          </form>
        </div>

        {/* DAFTAR KELAS */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors duration-300">

          {/* HEADER */}
          <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
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

                    <th className="px-4 sm:px-5 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">
                      No
                    </th>

                    <th className="px-4 sm:px-5 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Nama Kelas
                    </th>

                    <th className="px-4 sm:px-5 py-3 text-center text-sm font-semibold text-gray-600 dark:text-gray-400">
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
                      <td className="px-4 sm:px-5 py-4 text-gray-600 dark:text-gray-400 align-top">
                        {index + 1}
                      </td>

                      {/* NAMA KELAS */}
                      <td className="px-4 sm:px-5 py-4">

                        {editId === kelas.id_kelas ? (

                          <div>
                            <input
                              type="text"
                              value={editNama}
                              onChange={(e) => {
                                setEditNama(e.target.value);
                                if (errorEdit) setErrorEdit('');
                              }}
                              className={`border rounded-lg px-3 py-2 w-full max-w-xs outline-none bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 ${
                                errorEdit
                                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                  : 'border-gray-300 dark:border-gray-700 focus:ring-blue-500 focus:border-blue-500'
                              }`}
                            />

                            {errorEdit && (
                              <p className="mt-1 text-sm text-red-500">
                                {errorEdit}
                              </p>
                            )}
                          </div>

                        ) : (

                          <span className="font-medium text-gray-800 dark:text-gray-100">
                            {kelas.nama_kelas}
                          </span>

                        )}

                      </td>

                      {/* AKSI */}
                      <td className="px-4 sm:px-5 py-4 align-top">

                        <div className="flex justify-center gap-2">

                          {editId === kelas.id_kelas ? (

                            <>
                              <button
                                onClick={() => handleSimpanEdit(kelas.id_kelas)}
                                className="px-3.5 py-1.5 text-sm font-medium rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400 transition-colors"
                              >
                                Simpan
                              </button>

                              <button
                                onClick={handleBatalEdit}
                                className="px-3.5 py-1.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                              >
                                Batal
                              </button>
                            </>

                          ) : (

                            <>
                              <button
                                onClick={() => handleMulaiEdit(kelas)}
                                className="px-3.5 py-1.5 text-sm font-medium rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:text-amber-400 transition-colors"
                              >
                                Edit
                              </button>

                              <button
                                onClick={() => handleHapus(kelas)}
                                className="px-3.5 py-1.5 text-sm font-medium rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 dark:text-rose-400 transition-colors"
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