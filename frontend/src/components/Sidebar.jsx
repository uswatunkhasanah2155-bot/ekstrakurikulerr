// src/components/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getDaftarEskul } from '../services/api';

export default function Sidebar({ isAdmin }) {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(true);
  const [daftarEskulSidebar, setDaftarEskulSidebar] = useState([]);

  useEffect(() => {
    async function fetchEskul() {
      const data = await getDaftarEskul();
      if (data) {
        setDaftarEskulSidebar(data);
      }
    }
    fetchEskul();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col justify-between p-4 shadow-sm">
      <div>
        <div className="flex items-center gap-2 px-2 mb-6">
          <div className="w-8 h-8 bg-cyan-700 rounded-lg flex items-center justify-center text-white font-bold">
            E
          </div>
          <span className="font-bold text-gray-800 text-lg">EskulApp</span>
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-6 border border-gray-100">
          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-bold shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-800">
              {isAdmin ? "Administrator" : "Halo, Pengguna"}
            </h4>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${isAdmin ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}>
              {isAdmin ? "Admin" : "Siswa"}
            </span>
          </div>
        </div>

        <nav className="space-y-1">
          <Link 
            to="/Dashboard" 
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
            </svg>
            Dashboard
          </Link>

          {isAdmin && (
            <Link 
              to="/admin/kelola-eskul" 
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors mt-1"
            >
              ⚙️ Kelola Data Eskul
            </Link>
          )}

          {isAdmin && (
            <Link 
              to="/admin/pendaftar" 
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors mt-1"
            >
              👥 Data Pendaftar
            </Link>
          )}

          <div className="mt-1">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7"></path>
                </svg>
                Daftar Eskul
              </div>
              <svg className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>

            {isDropdownOpen && (
              <div className="pl-9 pr-2 py-1 space-y-1 mt-1 border-l-2 border-emerald-100 ml-4">
                {daftarEskulSidebar.map((eskul) => {
                  const nama = eskul.nama_eskul || '';
                  const slug = nama.toLowerCase().trim().replace(/\s+/g, '-');
                  return (
                    <Link 
                      key={eskul.id_eskul}
                      to={`/eskul/${slug}`}
                      className="block py-1.5 px-2 rounded-md text-xs font-medium text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors truncate"
                    >
                      • {nama}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>
      </div>

      <div className="pt-4 border-t border-gray-100">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
          </svg>
          Keluar
        </button>
      </div>
    </aside>
  );
}