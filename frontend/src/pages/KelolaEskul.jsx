// src/pages/KelolaEskul.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { getDaftarEskul } from '../services/api';

export default function KelolaEskul() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [daftarEskul, setDaftarEskul] = useState([]);

  const [formData, setFormData] = useState({ 
    nama_eskul: '', 
    deskripsi: '', 
    pembina: '', 
    jadwal: '',
    foto: null 
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    const roleUser = localStorage.getItem('role');
    
    if (roleUser && roleUser.toUpperCase() === 'ADMIN') {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }

    fetchDataEskul();
  }, []);

  const fetchDataEskul = async () => {
    const data = await getDaftarEskul();
    setDaftarEskul(data.data || data || []);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, foto: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token'); 

    try {
      if (isEditing && !editId) {
        throw new Error('Gagal memperbarui data (ID tidak ditemukan)');
      }

      const url = isEditing 
        ? `http://localhost:5000/api/eskul/${editId}` 
        : 'http://localhost:5000/api/eskul';
      
      const method = isEditing ? 'PUT' : 'POST';

      const dataToSend = new FormData();
      dataToSend.append('nama_eskul', formData.nama_eskul);
      dataToSend.append('deskripsi', formData.deskripsi);
      dataToSend.append('pembina', formData.pembina);
      dataToSend.append('jadwal', formData.jadwal);
      
      if (formData.foto instanceof File) {
        dataToSend.append('foto', formData.foto);
      }

      const response = await fetch(url, {
        method: method,
        headers: { 
          'Authorization': `Bearer ${token}`
        },
        body: dataToSend,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gagal menyimpan data');
      }

      if (isEditing) {
        setIsEditing(false);
        setEditId(null);
        alert("Data ekstrakurikuler berhasil diperbarui!");
      } else {
        alert("Ekstrakurikuler baru berhasil ditambahkan!");
      }

      setFormData({ nama_eskul: '', deskripsi: '', pembina: '', jadwal: '', foto: null });
      fetchDataEskul();
    } catch (error) {
      console.error("Error:", error);
      alert(error.message || "Terjadi kesalahan saat menyimpan data ke server.");
    }
  };

  const handleEditClick = (item) => {
    const uniqueId = item.id_eskul || item.id;
    setIsEditing(true);
    setEditId(uniqueId);
    setFormData({ 
      nama_eskul: item.nama_eskul || '', 
      deskripsi: item.deskripsi || '', 
      pembina: item.pembina || '', 
      jadwal: item.jadwal || '',
      foto: item.foto || null 
    });
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem('token');

    if (window.confirm("Yakin ingin menghapus ekstrakurikuler ini?")) {
      try {
        const response = await fetch(`http://localhost:5000/api/eskul/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) throw new Error('Gagal menghapus data');

        fetchDataEskul();
        alert("Data berhasil dihapus!");
      } catch (error) {
        console.error("Error deleting:", error);
        alert("Gagal menghapus data dari server.");
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isAdmin={isAdmin} />

      <main className="flex-1 p-6 overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-6">
          Kelola Data Ekstrakurikuler (Admin Panel)
        </h2>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8 max-w-3xl">
          <h3 className="text-sm font-bold text-gray-800 mb-4">
            {isEditing ? "✏️ Edit Ekstrakurikuler" : "+ Tambah Ekstrakurikuler Baru"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Nama Eskul</label>
                <input 
                  type="text" 
                  name="nama_eskul"
                  value={formData.nama_eskul}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Nama Pembina</label>
                <input 
                  type="text" 
                  name="pembina"
                  value={formData.pembina}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Deskripsi</label>
              <textarea 
                name="deskripsi"
                value={formData.deskripsi}
                onChange={handleInputChange}
                rows="2"
                required
                className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Jadwal</label>
                <input 
                  type="text" 
                  name="jadwal"
                  value={formData.jadwal}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Upload File Foto / Banner</label>
                <input 
                  type="file" 
                  name="foto"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 border border-gray-200 rounded-lg cursor-pointer bg-white"
                />
                {isEditing && typeof formData.foto === 'string' && formData.foto && (
                  <p className="text-xs text-gray-400 mt-1">File saat ini tersimpan: {formData.foto}</p>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors shadow-sm"
              >
                {isEditing ? "Simpan Perubahan" : "Simpan Eskul Baru"}
              </button>
              {isEditing && (
                <button 
                  type="button"
                  onClick={() => { setIsEditing(false); setEditId(null); setFormData({ nama_eskul: '', deskripsi: '', pembina: '', jadwal: '', foto: null }); }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
                >
                  Batal
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="text-sm font-bold text-gray-800">📋 Daftar Master Ekstrakurikuler</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase bg-gray-50/50">
                  <th className="py-3 px-4">No</th>
                  <th className="py-3 px-4">Nama Eskul</th>
                  <th className="py-3 px-4">Pembina</th>
                  <th className="py-3 px-4">Deskripsi</th>
                  <th className="py-3 px-4">Jadwal</th>
                  <th className="py-3 px-4 text-center">Aksi (CRUD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {daftarEskul.length > 0 ? (
                  daftarEskul.map((item, idx) => {
                    const rowId = item.id_eskul || item.id;
                    return (
                      <tr key={rowId || idx} className="hover:bg-gray-50/50">
                        <td className="py-3 px-4 font-medium text-gray-500">{idx + 1}</td>
                        <td className="py-3 px-4 font-semibold text-gray-800">{item.nama_eskul}</td>
                        <td className="py-3 px-4 text-gray-600">{item.pembina || '-'}</td>
                        <td className="py-3 px-4 text-gray-600 max-w-xs truncate">{item.deskripsi}</td>
                        <td className="py-3 px-4 text-gray-500">{item.jadwal || '-'}</td>
                        <td className="py-3 px-4 text-center space-x-2">
                          <button 
                            onClick={() => handleEditClick(item)}
                            className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-md font-medium hover:bg-blue-100"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(rowId)}
                            className="text-xs bg-red-50 text-red-600 px-3 py-1 rounded-md font-medium hover:bg-red-100"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="py-4 text-center text-gray-400">Belum ada data ekstrakurikuler.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}