// src/pages/KelolaPembina.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { getDaftarPembina, tambahPembina, hapusPembina, getDaftarEskul } from '../services/api';

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
    if (roleUser && roleUser.toUpperCase() === 'ADMIN') {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [pembinaData, eskulData] = await Promise.all([
      getDaftarPembina(),
      getDaftarEskul(),
    ]);
    setDaftarPembina(pembinaData || []);
    setDaftarEskul(eskulData.data || eskulData || []);
    setLoading(false);
  }

  const handleOpenTambah = () => {
    setFormData({ username: '', password: '', id_eskul: '' });
    setIsModalOpen(true);
  };

  const handleSimpan = async (e) => {
    e.preventDefault();

    if (!formData.username || !formData.password || !formData.id_eskul) {
      alert('Semua field wajib diisi!');
      return;
    }

    setSaving(true);
    const result = await tambahPembina(formData);
    setSaving(false);

    if (result.success) {
      alert('Berhasil menambahkan akun pembina!');
      setIsModalOpen(false);
      fetchData();
    } else {
      alert('Gagal menambahkan akun pembina: ' + result.error);
    }
  };

  const handleHapus = async (idUser, username) => {
    if (window.confirm(`Yakin ingin menghapus akun pembina "${username}"?`)) {
      const result = await hapusPembina(idUser);
      if (result.success) {
        setDaftarPembina((prev) => prev.filter((p) => p.id_user !== idUser));
      } else {
        alert('Gagal menghapus akun: ' + result.error);
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isAdmin={isAdmin} />

      <main className="flex-1 p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Kelola Akun Pembina</h2>
            <p className="text-xs text-gray-500 mt-0.5">Buat dan kelola akun pembina untuk setiap ekstrakurikuler.</p>
          </div>

          <button
            onClick={handleOpenTambah}
            className="bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm flex items-center gap-2 transition-colors"
          >
            + Tambah Pembina
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="text-sm font-bold text-gray-800">
              📋 Daftar Pembina ({daftarPembina.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-6 text-center text-sm text-gray-500">Memuat data...</div>
            ) : daftarPembina.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <span className="text-4xl mb-2">👤</span>
                <p className="text-sm">Belum ada akun pembina yang dibuat.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase bg-gray-50/50">
                    <th className="py-3 px-4">No</th>
                    <th className="py-3 px-4">Username</th>
                    <th className="py-3 px-4">Eskul yang Dibina</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                  {daftarPembina.map((p, idx) => (
                    <tr key={p.id_user} className="hover:bg-gray-50/50">
                      <td className="py-3 px-4 font-medium text-gray-500">{idx + 1}</td>
                      <td className="py-3 px-4 font-semibold text-gray-800">{p.username}</td>
                      <td className="py-3 px-4">
                        <span className="bg-cyan-50 text-cyan-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                          {p.eskul?.nama_eskul || 'Belum ada eskul'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleHapus(p.id_user, p.username)}
                          className="text-xs bg-red-50 text-red-600 px-2.5 py-1 rounded-md font-medium hover:bg-red-100"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">Tambah Akun Pembina</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSimpan} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none bg-white focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="Masukkan username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none bg-white focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="Masukkan password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Eskul yang Dibina</label>
                <select
                  value={formData.id_eskul}
                  onChange={(e) => setFormData({ ...formData, id_eskul: e.target.value })}
                  required
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-cyan-500 focus:border-cyan-500 outline-none bg-white"
                >
                  <option value="" disabled>Pilih Eskul</option>
                  {daftarEskul.map((eskul) => (
                    <option key={eskul.id_eskul} value={eskul.id_eskul}>
                      {eskul.nama_eskul}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg transition disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}