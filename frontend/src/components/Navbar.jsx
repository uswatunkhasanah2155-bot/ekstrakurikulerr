// src/components/Navbar.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, User, ChevronDown, Sun, Moon, CalendarDays } from 'lucide-react';
import logoSekolah from '../assets/logosmkc.jpeg';

export default function Navbar() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [eskulDropdownOpen, setEskulDropdownOpen] = useState(false);
  const eskulRef = useRef(null);

  // State untuk Tema (Dark/Light Mode)
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Daftar ekstrakurikuler
  const daftarEskul = [
    { nama: 'Pramuka', path: '/eskul/pramuka' },
    { nama: 'Paskibra', path: '/eskul/paskibra' },
    { nama: 'Pasustar', path: '/eskul/pasustar' },
    { nama: 'Marching Band', path: '/eskul/marching-band' },
    { nama: 'Silat', path: '/eskul/silat' },
    { nama: 'Seni Tari', path: '/eskul/seni-tari' },
    { nama: 'Futsal', path: '/eskul/futsal' },
  ];

  // Inisialisasi tema saat komponen dimuat
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Fungsi untuk mengganti tema
  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('id_user');
    localStorage.removeItem('id_eskul');
    navigate('/login');
  };

  // Efek klik di luar dropdown untuk menutupnya secara otomatis
  useEffect(() => {
    function handleClickOutside(event) {
      if (eskulRef.current && !eskulRef.current.contains(event.target)) {
        setEskulDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* LOGO SEKOLAH */}
          <Link to="/Dashboard" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center shrink-0 bg-white">
              <img
                src={logoSekolah}
                alt="Logo Sekolah"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-bold text-gray-800 dark:text-gray-100 text-lg hidden sm:inline">
              SESCO ESKUL
            </span>
          </Link>

          {/* MENU DESKTOP */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/Dashboard"
              className="px-4 py-2 rounded-lg text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
            >
              Dashboard
            </Link>

            {/* MENU JADWAL BARU DI NAVBAR */}
            <Link
              to="/jadwal" 
              className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-1.5"
            >
              <CalendarDays className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Jadwal</span>
            </Link>

            {/* DROPDOWN DAFTAR ESKUL */}
            <div className="relative" ref={eskulRef}>
              <button
                onClick={() => setEskulDropdownOpen(!eskulDropdownOpen)}
                className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <span>Ekstrakurikuler</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${eskulDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {eskulDropdownOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl py-2 z-50">
                  {daftarEskul.map((item, index) => (
                    <Link
                      key={index}
                      to={item.path}
                      onClick={() => setEskulDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                    >
                      {item.nama}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* PROFIL, TEMA, + LOGOUT DESKTOP */}
          <div className="hidden md:flex items-center gap-3">
            {/* Tombol Toggle Tema Terang/Gelap */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shadow-sm flex items-center gap-1.5 text-xs font-semibold"
              title="Ubah Tema Terang/Gelap"
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-4 h-4 text-yellow-400" />
                  <span>Terang</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-slate-700" />
                  <span>Gelap</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-2 pl-3 border-l border-gray-200 dark:border-gray-700">
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300">
                <User className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                Siswa
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Keluar
            </button>
          </div>

          {/* TOMBOL KANAN (MOBILE) */}
          <div className="flex items-center gap-2 md:hidden">
            {/* Tombol Toggle Tema Mobile */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
              title="Ubah Tema"
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Tombol Hamburger */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 dark:text-gray-300 p-2"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>

        {/* MENU MOBILE */}
        {isMenuOpen && (
          <div className="md:hidden pb-4 space-y-1 border-t border-gray-100 dark:border-gray-800 pt-3">
            <Link
              to="/Dashboard"
              onClick={() => setIsMenuOpen(false)}
              className="block px-4 py-2 rounded-lg text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
            >
              Dashboard
            </Link>

            {/* Menu Jadwal di Mobile */}
            <Link
              to="/jadwal"
              onClick={() => setIsMenuOpen(false)}
              className="block px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Jadwal Eskul
            </Link>

            {/* Bagian Eskul di Mobile */}
            <div className="px-4 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider mt-2">
              Daftar Eskul
            </div>
            {daftarEskul.map((item, index) => (
              <Link
                key={index}
                to={item.path}
                onClick={() => setIsMenuOpen(false)}
                className="block px-6 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {item.nama}
              </Link>
            ))}

            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 mt-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
              >
                <LogOut className="w-4 h-4" />
                Keluar
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}