// src/pages/ProfilPembina.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, CalendarDays, UserRound, ArrowRight } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { getDaftarEskul } from '../services/api';

const toArray = (res) => {
  const data = res?.data ?? res;
  return Array.isArray(data) ? data : [];
};

export default function ProfilPembina() {
  const navigate = useNavigate();

  const [eskul, setEskul] = useState(null);
  const [loading, setLoading] = useState(true);

  const username = localStorage.getItem('username') || '-';
  const idEskul = localStorage.getItem('id_eskul');

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const res = await getDaftarEskul();
        const eskulSaya = toArray(res).find(
          (e) => String(e.id_eskul) === String(idEskul)
        );
        if (!cancelled) setEskul(eskulSaya || null);
      } catch (error) {
        console.error('Gagal memuat profil pembina:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [idEskul]);

  const namaPembina = eskul?.pembina || username;
  const inisial = String(namaPembina).charAt(0).toUpperCase();
  const slugEskul = (eskul?.nama_eskul || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');

  const baris = [
    { icon: UserRound, label: 'Username', value: username },
    { icon: BookOpen, label: 'Eskul yang dibina', value: eskul?.nama_eskul || '-' },
    { icon: CalendarDays, label: 'Jadwal latihan', value: eskul?.jadwal || 'Belum diatur' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800 transition-colors duration-300 dark:bg-gray-950 dark:text-gray-100">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-6">
        <h2 className="mb-6 text-2xl font-bold text-gray-800 dark:text-gray-100">
          Profil Saya
        </h2>

        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Memuat profil...
          </p>
        ) : (
          <div className="max-w-2xl rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/15 text-2xl font-bold text-blue-600 dark:text-blue-400">
                {inisial}
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {namaPembina}
                </p>
                <span className="mt-1 inline-block rounded-full bg-cyan-100 px-2 py-0.5 text-[11px] font-semibold text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300">
                  Pembina
                </span>
              </div>
            </div>

            <div className="divide-y divide-gray-100 border-t border-gray-100 dark:divide-gray-800 dark:border-gray-800">
              {baris.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 py-3">
                  <Icon className="h-4 w-4 shrink-0 text-gray-400" />
                  <span className="w-36 shrink-0 text-sm text-gray-500 dark:text-gray-400">
                    {label}
                  </span>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {slugEskul && (
              <button
                onClick={() => navigate(`/eskul/${slugEskul}`)}
                className="mt-5 flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                Buka halaman eskul <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}