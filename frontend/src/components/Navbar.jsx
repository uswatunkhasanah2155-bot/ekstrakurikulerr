// src/components/Navbar.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  LogOut,
  ChevronDown,
  Sun,
  Moon,
  CalendarDays,
  LayoutDashboard,
  ClipboardList,
  Trophy,
  Tent,
  Flag,
  Shield,
  Music,
  Swords,
  Sparkles,
  Goal,
} from 'lucide-react';
import logoSekolah from '../assets/logosmkc.jpeg';

// Gaya link menu: aktif (biru) vs tidak aktif
const linkBase =
  'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors';
const linkActive =
  'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
const linkIdle =
  'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800';

const navClass = ({ isActive }) =>
  `${linkBase} ${isActive ? linkActive : linkIdle}`;

const mobileClass = ({ isActive }) =>
  `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${
    isActive
      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
  }`;

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [eskulDropdownOpen, setEskulDropdownOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const eskulRef = useRef(null);
  const profileRef = useRef(null);

  // State untuk Tema (Dark/Light Mode)
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Data user yang sedang login (disimpan di localStorage saat login)
  const username = localStorage.getItem('username') || 'Siswa';
  const roleRaw = localStorage.getItem('role') || 'Siswa';
  const roleLabel =
    roleRaw.charAt(0).toUpperCase() + roleRaw.slice(1).toLowerCase();
  const inisial = username.charAt(0).toUpperCase();

  // Daftar ekstrakurikuler
  const daftarEskul = [
    { nama: 'Pramuka', path: '/eskul/pramuka', icon: Tent },
    { nama: 'Paskibra', path: '/eskul/paskibra', icon: Flag },
    { nama: 'Pasustar', path: '/eskul/pasustar', icon: Shield },
    { nama: 'Marching Band', path: '/eskul/marching-band', icon: Music },
    { nama: 'Silat', path: '/eskul/silat', icon: Swords },
    { nama: 'Seni Tari', path: '/eskul/seni-tari', icon: Sparkles },
    { nama: 'Futsal', path: '/eskul/futsal', icon: Goal },
  ];

  // Tombol "Ekstrakurikuler" ikut menyala saat berada di halaman /eskul/...
  const eskulAktif = location.pathname.startsWith('/eskul');

  // Inisialisasi tema saat komponen dimuat
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (
      savedTheme === 'dark' ||
      (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
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
    localStorage.removeItem('username'); // hapus nama user agar tidak terbawa ke akun berikutnya
    navigate('/login');
  };

  // Klik di luar dropdown untuk menutupnya secara otomatis
  useEffect(() => {
    function handleClickOutside(event) {
      if (eskulRef.current && !eskulRef.current.contains(event.target)) {
        setEskulDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40 transition-colors duration-300 w-full">
      {/* Lebar penuh, padding sama dengan halaman lain */}
      <div className="w-full px-4 sm:px-6 lg:px-10">
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
            <NavLink to="/Dashboard" className={navClass}>
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </NavLink>

            <NavLink to="/jadwal" className={navClass}>
              <CalendarDays className="w-4 h-4" />
              <span>Jadwal</span>
            </NavLink>

            <NavLink to="/pendaftaran-saya" className={navClass}>
              <ClipboardList className="w-4 h-4" />
              <span>Pendaftaran Saya</span>
            </NavLink>

            {/* DROPDOWN DAFTAR ESKUL */}
            <div className="relative" ref={eskulRef}>
              <button
                onClick={() => setEskulDropdownOpen(!eskulDropdownOpen)}
                className={`${linkBase} cursor-pointer ${
                  eskulAktif || eskulDropdownOpen ? linkActive : linkIdle
                }`}
              >
                <Trophy className="w-4 h-4" />
                <span>Ekstrakurikuler</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    eskulDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {eskulDropdownOpen && (
                <div className="absolute left-0 mt-2 w-52 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl py-2 z-50">
                  {daftarEskul.map((item, index) => (
                    <NavLink
                      key={index}
                      to={item.path}
                      onClick={() => setEskulDropdownOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-semibold'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400'
                        }`
                      }
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      {item.nama}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* TEMA + PROFIL DESKTOP */}
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

            {/* DROPDOWN PROFIL */}
            <div className="relative pl-3 border-l border-gray-200 dark:border-gray-700" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-sky-400 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  {inisial}
                </div>
                <div className="text-left leading-tight">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 capitalize max-w-[120px] truncate">
                    {username}
                  </p>
                  <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                    {roleLabel}
                  </p>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                    profileOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 mb-1">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 capitalize truncate">
                      {username}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {roleLabel}
                    </p>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Keluar
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* TOMBOL KANAN (MOBILE) */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
              title="Ubah Tema"
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
            </button>

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
            {/* Info user di mobile */}
            <div className="flex items-center gap-3 px-4 py-2 mb-1">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-sky-400 text-white flex items-center justify-center font-bold text-sm">
                {inisial}
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 capitalize">
                  {username}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">{roleLabel}</p>
              </div>
            </div>

            <NavLink
              to="/Dashboard"
              onClick={() => setIsMenuOpen(false)}
              className={mobileClass}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </NavLink>

            <NavLink
              to="/jadwal"
              onClick={() => setIsMenuOpen(false)}
              className={mobileClass}
            >
              <CalendarDays className="w-4 h-4" />
              Jadwal Eskul
            </NavLink>

            <NavLink
              to="/pendaftaran-saya"
              onClick={() => setIsMenuOpen(false)}
              className={mobileClass}
            >
              <ClipboardList className="w-4 h-4" />
              Pendaftaran Saya
            </NavLink>

            <div className="flex items-center gap-2 px-4 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider mt-2">
              <Trophy className="w-3.5 h-3.5" />
              Daftar Eskul
            </div>
            {daftarEskul.map((item, index) => (
              <NavLink
                key={index}
                to={item.path}
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-6 py-2 rounded-lg text-sm ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-semibold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`
                }
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.nama}
              </NavLink>
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