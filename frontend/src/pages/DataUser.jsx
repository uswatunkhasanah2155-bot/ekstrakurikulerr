import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';

import {
  getDaftarUser,
  getDaftarEskul,
  tambahUser,
  updateUser,
  hapusUser
} from '../services/api';

import {
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  UserCog
} from 'lucide-react';

export default function DataUser() {

  const [daftarUser, setDaftarUser] = useState([]);
  const [daftarEskul, setDaftarEskul] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState('tambah');
  const [selectedUser, setSelectedUser] = useState(null);

  const [form, setForm] = useState({
    username: '',
    password: '',
    email: '',
    role: 'SISWA',
    id_eskul: ''
  });

  const isAdmin =
    localStorage.getItem('role')?.toUpperCase() === 'ADMIN';


  // ==================================================
  // CEK ADMIN & LOAD DATA
  // ==================================================

  useEffect(() => {
    if (!isAdmin) {
      window.location.href = '/Dashboard';
      return;
    }

    loadData();
  }, []);


  const loadData = async () => {
    try {
      setLoading(true);

      const [users, eskul] = await Promise.all([
        getDaftarUser(),
        getDaftarEskul()
      ]);

      setDaftarUser(users || []);
      setDaftarEskul(eskul || []);

    } catch (error) {
      console.error('Gagal memuat data user:', error);
      alert('Gagal memuat data user.');
    } finally {
      setLoading(false);
    }
  };


  // ==================================================
  // HANDLE INPUT
  // ==================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'role' && value !== 'PEMBINA') {
      setForm(prev => ({
        ...prev,
        role: value,
        id_eskul: ''
      }));
      return;
    }

    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };


  // ==================================================
  // TAMBAH USER
  // ==================================================

  const bukaTambah = () => {
    setMode('tambah');
    setSelectedUser(null);

    setForm({
      username: '',
      password: '',
      email: '',
      role: 'SISWA',
      id_eskul: ''
    });

    setShowModal(true);
  };


  // ==================================================
  // EDIT USER
  // ==================================================

  const bukaEdit = (user) => {
    setMode('edit');
    setSelectedUser(user);

    setForm({
      username: user.username || '',
      password: '',
      email: user.email || '',
      role: user.role?.toUpperCase() || 'SISWA',
      id_eskul: user.id_eskul || ''
    });

    setShowModal(true);
  };


  // ==================================================
  // TUTUP MODAL
  // ==================================================

  const tutupModal = () => {
    if (saving) return;

    setShowModal(false);
    setSelectedUser(null);

    setForm({
      username: '',
      password: '',
      email: '',
      role: 'SISWA',
      id_eskul: ''
    });
  };


  // ==================================================
  // SIMPAN USER
  // ==================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.username.trim()) {
      alert('Username wajib diisi.');
      return;
    }

    if (mode === 'tambah' && !form.password.trim()) {
      alert('Password wajib diisi.');
      return;
    }

    if (!form.role) {
      alert('Role wajib dipilih.');
      return;
    }

    if (form.role === 'PEMBINA' && !form.id_eskul) {
      alert('Pembina wajib memilih ekstrakurikuler.');
      return;
    }

    try {
      setSaving(true);

      let result;

      if (mode === 'tambah') {
        result = await tambahUser(form);
      } else {
        result = await updateUser(
          selectedUser.id_user,
          form
        );
      }

      if (result.success) {
        alert(
          mode === 'tambah'
            ? 'User berhasil ditambahkan.'
            : 'User berhasil diperbarui.'
        );

        tutupModal();
        await loadData();

      } else {
        alert(result.error || 'Terjadi kesalahan.');
      }

    } catch (error) {
      console.error('Gagal menyimpan user:', error);
      alert('Terjadi kesalahan saat menyimpan user.');
    } finally {
      setSaving(false);
    }
  };


  // ==================================================
  // HAPUS USER
  // ==================================================

  const handleDelete = async (user) => {

    const currentUserId =
      Number(localStorage.getItem('id_user'));

    if (
      currentUserId &&
      currentUserId === Number(user.id_user)
    ) {
      alert(
        'Akun yang sedang digunakan tidak dapat dihapus.'
      );
      return;
    }

    const yakin = window.confirm(
      `Yakin ingin menghapus user "${user.username}"?`
    );

    if (!yakin) return;

    try {
      const result = await hapusUser(user.id_user);

      if (result.success) {
        alert('User berhasil dihapus.');
        await loadData();
      } else {
        alert(result.error || 'Gagal menghapus user.');
      }

    } catch (error) {
      console.error('Gagal menghapus user:', error);
      alert('Terjadi kesalahan saat menghapus user.');
    }
  };


  // ==================================================
  // NAMA ESKUL
  // ==================================================

  const getNamaEskul = (user) => {
    if (!user.eskul) {
      return '-';
    }

    return user.eskul.nama_eskul;
  };


  // ==================================================
  // JIKA BUKAN ADMIN
  // ==================================================

  if (!isAdmin) {
    return null;
  }


  // ==================================================
  // RENDER
  // ==================================================

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">

      <Sidebar />

      <main className="flex-1 p-6 md:p-8">

        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/40">
              <UserCog className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                Data User
              </h1>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Kelola akun pengguna sistem.
              </p>
            </div>

          </div>


          {/* TAMBAH USER */}
          <button
            onClick={bukaTambah}
            className="
              flex items-center justify-center gap-2
              rounded-lg bg-indigo-600 px-4 py-2.5
              font-semibold text-white transition
              hover:bg-indigo-700
            "
          >
            <Plus className="h-5 w-5" />
            Tambah User
          </button>

        </div>


        {/* TABLE */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-gray-900">

          <div className="
            flex items-center justify-between
            border-b border-gray-200
            px-6 py-4 dark:border-gray-700
          ">
            <div>
              <h2 className="font-semibold text-gray-800 dark:text-white">
                Daftar User
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total {daftarUser.length} user
              </p>
            </div>
          </div>


          {/* LOADING */}
          {loading ? (

            <div className="p-10 text-center text-gray-500">
              Memuat data user...
            </div>

          ) : daftarUser.length === 0 ? (

            <div className="p-10 text-center text-gray-500">
              Belum ada data user.
            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full text-sm">

                <thead>
                  <tr className="
                    border-b bg-gray-50 text-left
                    dark:border-gray-700 dark:bg-gray-800
                  ">

                    <th className="px-6 py-4 font-semibold">
                      No
                    </th>

                    <th className="px-6 py-4 font-semibold">
                      Username
                    </th>

                    <th className="px-6 py-4 font-semibold">
                      Email
                    </th>

                    <th className="px-6 py-4 font-semibold">
                      Role
                    </th>

                    <th className="px-6 py-4 font-semibold">
                      Eskul
                    </th>

                    <th className="px-6 py-4 text-center font-semibold">
                      Aksi
                    </th>

                  </tr>
                </thead>


                <tbody>

                  {daftarUser.map((user, index) => (

                    <tr
                      key={user.id_user}
                      className="
                        border-b last:border-b-0
                        hover:bg-gray-50
                        dark:border-gray-700
                        dark:hover:bg-gray-800
                      "
                    >

                      <td className="px-6 py-4">
                        {index + 1}
                      </td>

                      <td className="px-6 py-4 font-medium">
                        {user.username}
                      </td>

                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                        {user.email || '-'}
                      </td>

                      <td className="px-6 py-4">

                        <span
                          className={`
                            inline-flex rounded-full px-3 py-1
                            text-xs font-semibold
                            ${
                              user.role?.toUpperCase() === 'ADMIN'
                                ? 'bg-purple-100 text-purple-700'
                                : user.role?.toUpperCase() === 'PEMBINA'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-green-100 text-green-700'
                            }
                          `}
                        >
                          {user.role?.toUpperCase()}
                        </span>

                      </td>

                      <td className="px-6 py-4">
                        {getNamaEskul(user)}
                      </td>

                      <td className="px-6 py-4">

                        <div className="flex justify-center gap-2">

                          <button
                            onClick={() => bukaEdit(user)}
                            title="Edit User"
                            className="
                              rounded-lg p-2
                              text-blue-600 transition
                              hover:bg-blue-50
                              dark:hover:bg-blue-900/30
                            "
                          >
                            <Pencil className="h-4 w-4" />
                          </button>


                          <button
                            onClick={() => handleDelete(user)}
                            title="Hapus User"
                            className="
                              rounded-lg p-2
                              text-red-600 transition
                              hover:bg-red-50
                              dark:hover:bg-red-900/30
                            "
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>

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


      {/* MODAL */}

      {showModal && (

        <div className="
          fixed inset-0 z-50
          flex items-center justify-center
          bg-black/50 p-4
        ">

          <div className="
            w-full max-w-lg overflow-hidden
            rounded-2xl bg-white shadow-xl
            dark:bg-gray-900
          ">

            {/* HEADER MODAL */}
            <div className="
              flex items-center justify-between
              border-b border-gray-200
              px-6 py-4 dark:border-gray-800
            ">

              <div>

                <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                  {mode === 'tambah'
                    ? 'Tambah User'
                    : 'Edit User'}
                </h2>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {mode === 'tambah'
                    ? 'Tambahkan akun pengguna baru.'
                    : 'Perbarui data akun pengguna.'}
                </p>

              </div>


              <button
                onClick={tutupModal}
                disabled={saving}
                className="
                  rounded-lg p-2
                  hover:bg-gray-100
                  dark:hover:bg-gray-800
                "
              >
                <X className="h-5 w-5" />
              </button>

            </div>


            {/* FORM */}
            <form
              onSubmit={handleSubmit}
              className="space-y-4 p-6"
            >

              {/* USERNAME */}
              <div>

                <label className="mb-1.5 block text-sm font-semibold">
                  Username
                </label>

                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="Masukkan username"
                  className="
                    w-full rounded-lg border
                    border-gray-300 bg-white px-3 py-2.5
                    outline-none focus:ring-2 focus:ring-indigo-500
                    dark:border-gray-700 dark:bg-gray-800
                  "
                />

              </div>


              {/* PASSWORD */}
              <div>

                <label className="mb-1.5 block text-sm font-semibold">
                  Password

                  {mode === 'edit' && (
                    <span className="font-normal text-gray-400">
                      {' '}(kosongkan jika tidak diubah)
                    </span>
                  )}
                </label>

                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder={
                    mode === 'tambah'
                      ? 'Masukkan password'
                      : 'Password baru (opsional)'
                  }
                  className="
                    w-full rounded-lg border
                    border-gray-300 bg-white px-3 py-2.5
                    outline-none focus:ring-2 focus:ring-indigo-500
                    dark:border-gray-700 dark:bg-gray-800
                  "
                />

              </div>


              {/* EMAIL */}
              <div>

                <label className="mb-1.5 block text-sm font-semibold">
                  Email
                </label>

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Masukkan email"
                  className="
                    w-full rounded-lg border
                    border-gray-300 bg-white px-3 py-2.5
                    outline-none focus:ring-2 focus:ring-indigo-500
                    dark:border-gray-700 dark:bg-gray-800
                  "
                />

              </div>


              {/* ROLE */}
              <div>

                <label className="mb-1.5 block text-sm font-semibold">
                  Role
                </label>

                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="
                    w-full rounded-lg border
                    border-gray-300 bg-white px-3 py-2.5
                    outline-none focus:ring-2 focus:ring-indigo-500
                    dark:border-gray-700 dark:bg-gray-800
                  "
                >

                  <option value="SISWA">
                    Siswa
                  </option>

                  <option value="PEMBINA">
                    Pembina
                  </option>

                  <option value="ADMIN">
                    Admin
                  </option>

                </select>

              </div>


              {/* ESKUL PEMBINA */}
              {form.role === 'PEMBINA' && (

                <div>

                  <label className="mb-1.5 block text-sm font-semibold">
                    Ekstrakurikuler
                  </label>

                  <select
                    name="id_eskul"
                    value={form.id_eskul}
                    onChange={handleChange}
                    className="
                      w-full rounded-lg border
                      border-gray-300 bg-white px-3 py-2.5
                      outline-none focus:ring-2 focus:ring-indigo-500
                      dark:border-gray-700 dark:bg-gray-800
                    "
                  >

                    <option value="">
                      -- Pilih Ekstrakurikuler --
                    </option>

                    {daftarEskul.map((eskul) => (

                      <option
                        key={eskul.id_eskul}
                        value={eskul.id_eskul}
                      >
                        {eskul.nama_eskul}
                      </option>

                    ))}

                  </select>

                </div>

              )}


              {/* BUTTON */}
              <div className="
                flex justify-end gap-3 pt-4
              ">

                <button
                  type="button"
                  onClick={tutupModal}
                  disabled={saving}
                  className="
                    rounded-lg border border-gray-300
                    px-4 py-2.5 font-semibold
                    hover:bg-gray-100
                    dark:border-gray-700
                    dark:hover:bg-gray-800
                  "
                >
                  Batal
                </button>


                <button
                  type="submit"
                  disabled={saving}
                  className="
                    flex items-center gap-2
                    rounded-lg bg-indigo-600
                    px-4 py-2.5 font-semibold text-white
                    hover:bg-indigo-700
                    disabled:opacity-50
                  "
                >

                  <Save className="h-4 w-4" />

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