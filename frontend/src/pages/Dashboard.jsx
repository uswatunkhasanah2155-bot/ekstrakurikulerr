// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { getDaftarEskul } from '../services/api';

export default function StudentDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [daftarEskul, setDaftarEskul] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const roleUser = localStorage.getItem('role');
    
    // Perbaikan: Pengecekan tegas menggunakan huruf besar agar sesuai dengan backend ('ADMIN')
    if (roleUser && roleUser.toUpperCase() === 'ADMIN') {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }

    async function fetchData() {
      const data = await getDaftarEskul();
      setDaftarEskul(data);
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600 font-medium">Memuat data ekstrakurikuler dari backend...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isAdmin={isAdmin} />
      
      <main className="flex-1 p-6 overflow-y-auto">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Daftar Ekstrakurikuler</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {daftarEskul.map((eskul) => (
            <div key={eskul.id_eskul} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-full bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold">
                  {(eskul.nama_eskul || 'E').charAt(0)}
                </div>
                <div className="mt-2">
                  <h4 className="font-bold text-gray-800 text-base">{eskul.nama_eskul}</h4>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{eskul.deskripsi || 'Tidak ada deskripsi'}</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-600 space-y-1">
                <div>
                  <span className="font-semibold text-gray-700">Pembina:</span> {eskul.pembina || 'Belum ada'}
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Jadwal:</span> {eskul.jadwal || 'Belum ada'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}