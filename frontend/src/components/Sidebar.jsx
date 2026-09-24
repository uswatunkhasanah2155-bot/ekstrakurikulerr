// src/components/Sidebar.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getDaftarEskul } from '../services/api'; // (Sesuaikan typo jika ada di file asli: getDaftarEskul)
import logoSekolah from '../assets/logosmkc.jpeg';

import {
  LayoutDashboard,
  Settings,  
  Users,
  List,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  User,
  UserCog,
  School,
  Moon,
  Sun,
  Contact,
  Database // Ditambahkan untuk ikon Manajemen Master
} from 'lucide-react';

export default function Sidebar() {

  const navigate = useNavigate();

  const [isDropdownOpen, setIsDropdownOpen] = useState(true);
  // State baru khusus untuk dropdown Manajemen Master
  const [isMasterDropdownOpen, setIsMasterDropdownOpen] = useState(true);
  
  const [daftarEskulSidebar, setDaftarEskulSidebar] = useState([]);

  // ======================================================
  // ROLE
  // ======================================================

  const role = (
    localStorage.getItem('role') || ''
  ).toUpperCase();

  const isAdmin = role === 'ADMIN';
  const isPembina = role === 'PEMBINA';
  const isSiswa = role === 'SISWA';

  const idEskulPembina =
    localStorage.getItem('id_eskul');


  // ======================================================
  // COLLAPSE / EXPAND SIDEBAR
  // ======================================================

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem(
      'sidebarCollapsed',
      isCollapsed
    );

    if (isCollapsed) {
      setIsDropdownOpen(false);
      setIsMasterDropdownOpen(false); // Tutup juga master dropdown jika sidebar diperkecil
    }
  }, [isCollapsed]);


  const toggleSidebar = () => {
    setIsCollapsed(prev => !prev);
  };


  // ======================================================
  // DARK MODE
  // ======================================================

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {

    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }

  }, [darkMode]);


  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };


  // ======================================================
  // AMBIL DAFTAR ESKUL
  // ======================================================

  useEffect(() => {

    async function fetchEskul() {

      try {

        const data = await getDaftarEskul();

        const listEskul =
          data?.data || data || [];

        // Pembina hanya melihat eskul yang dibina
        if (isPembina) {

          const eskulPembina =
            listEskul.filter(
              eskul =>
                String(eskul.id_eskul) ===
                String(idEskulPembina)
            );

          setDaftarEskulSidebar(
            eskulPembina
          );

        } else {

          // Admin dan Siswa melihat semua eskul
          setDaftarEskulSidebar(
            listEskul
          );

        }

      } catch (error) {

        console.error(
          'Gagal mengambil daftar eskul:',
          error
        );

        setDaftarEskulSidebar([]);

      }

    }

    fetchEskul();

  }, [isPembina, idEskulPembina]);


  const namaEskulDibina =
    daftarEskulSidebar[0]?.nama_eskul;


  // ======================================================
  // LOGOUT
  // ======================================================

  const handleLogout = () => {

    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('id_user');
    localStorage.removeItem('id_eskul');

    navigate('/login');
  };


  // ======================================================
  // ROLE LABEL
  // ======================================================

  const roleLabel = isAdmin
    ? 'Admin'
    : isPembina
    ? 'Pembina'
    : 'Siswa';


  const roleBadgeClass = isAdmin
    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
    : isPembina
    ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300'
    : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-300';


  // ======================================================
  // RENDER
  // ======================================================

  return (

    <aside
      className={`
        relative
        ${isCollapsed ? 'w-20' : 'w-64'}
        bg-white dark:bg-gray-900
        border-r border-gray-200 dark:border-gray-700
        min-h-screen
        flex flex-col
        justify-between
        p-4
        shadow-sm
        transition-all duration-300
      `}
    >

      {/* TOMBOL COLLAPSE / EXPAND */}
      <button
        onClick={toggleSidebar}
        title={
          isCollapsed
            ? 'Perluas sidebar'
            : 'Perkecil sidebar'
        }
        className="
          absolute
          -right-3 top-8
          w-6 h-6
          rounded-full
          bg-white dark:bg-gray-800
          border border-gray-200 dark:border-gray-700
          shadow-sm
          flex items-center justify-center
          text-gray-500 dark:text-gray-300
          hover:bg-gray-100 dark:hover:bg-gray-700
          transition-colors
          z-10
        "
      >
        {isCollapsed ? (
          <PanelLeftOpen className="w-3.5 h-3.5" />
        ) : (
          <PanelLeftClose className="w-3.5 h-3.5" />
        )}
      </button>


      <div>

        {/* LOGO */}
        <div
          className={`
            flex items-center gap-2 px-2 mb-6
            ${isCollapsed ? 'justify-center' : ''}
          `}
        >
          <div className="
            w-9 h-9
            rounded-lg
            overflow-hidden
            flex items-center justify-center
            shrink-0
            bg-white
          ">
            <img
              src={logoSekolah}
              alt="Logo Sekolah"
              className="w-full h-full object-contain"
            />
          </div>

          {!isCollapsed && (
            <span className="
              font-bold
              text-gray-800 dark:text-white
              text-lg
              whitespace-nowrap
            ">
              SESCO ESKUL
            </span>
          )}
        </div>


        {/* USER INFO */}
        <div
          className={`
            flex items-center gap-3
            p-3
            bg-gray-50 dark:bg-gray-800
            rounded-xl
            mb-6
            border border-gray-100 dark:border-gray-700
            transition-colors duration-300
            ${isCollapsed ? 'justify-center' : ''}
          `}
        >
          <div className="
            w-10 h-10
            rounded-full
            bg-gray-300 dark:bg-gray-700
            flex items-center justify-center
            text-gray-700 dark:text-gray-200
            shrink-0
          ">
            <User className="w-6 h-6" />
          </div>

          {!isCollapsed && (
            <div className="overflow-hidden">
              <h4 className="
                text-sm
                font-bold
                text-gray-800 dark:text-white
                truncate
              ">
                {isAdmin
                  ? 'Administrator'
                  : isPembina
                  ? namaEskulDibina
                    ? `Pembina ${namaEskulDibina}`
                    : 'Pembina'
                  : 'Halo, Pengguna'}
              </h4>

              <span
                className={`
                  text-[11px]
                  px-2
                  py-0.5
                  rounded-full
                  font-semibold
                  ${roleBadgeClass}
                `}
              >
                {roleLabel}
              </span>
            </div>
          )}
        </div>


        {/* NAVIGATION */}
        <nav className="space-y-1">

          {/* DASHBOARD */}
          <Link
            to="/Dashboard"
            title="Dashboard"
            className={`
              flex items-center gap-3
              px-3 py-2.5
              rounded-lg
              text-sm font-medium
              text-gray-700 dark:text-gray-200
              hover:bg-gray-100 dark:hover:bg-gray-800
              transition-colors
              ${isCollapsed ? 'justify-center' : ''}
            `}
          >
            <LayoutDashboard className="w-5 h-5 shrink-0 text-gray-500 dark:text-gray-400" />
            {!isCollapsed && (
              <span className="whitespace-nowrap">
                Dashboard
              </span>
            )}
          </Link>


          {/* ====================================================== */}
          {/* DROPDOWN MANAJEMEN MASTER (KHUSUS ADMIN)                */}
          {/* ====================================================== */}
          {isAdmin && (
            <div className="mt-1">
              <button
                onClick={() => {
                  if (isCollapsed) {
                    setIsCollapsed(false);
                    setIsMasterDropdownOpen(true);
                  } else {
                    setIsMasterDropdownOpen(!isMasterDropdownOpen);
                  }
                }}
                title="Manajemen Master"
                className={`
                  w-full
                  flex items-center justify-between
                  px-3 py-2.5
                  rounded-lg
                  text-sm font-medium
                  text-gray-700 dark:text-gray-200
                  hover:bg-gray-100 dark:hover:bg-gray-800
                  transition-colors
                  ${isCollapsed ? 'justify-center' : ''}
                `}
              >
                <div
                  className={`
                    flex items-center gap-3
                    ${isCollapsed ? 'justify-center' : ''}
                  `}
                >
                  <Database className="w-5 h-5 shrink-0 text-gray-500 dark:text-gray-400" />
                  {!isCollapsed && (
                    <span className="whitespace-nowrap">
                      Manajemen Master
                    </span>
                  )}
                </div>

                {!isCollapsed && (
                  <ChevronDown
                    className={`
                      w-4 h-4
                      transition-transform
                      shrink-0
                      text-gray-500
                      ${
                        isMasterDropdownOpen
                          ? 'rotate-180'
                          : ''
                      }
                    `}
                  />
                )}
              </button>

              {/* ISI SUB-MENU MANAJEMEN MASTER */}
              {!isCollapsed &&
                isMasterDropdownOpen && (
                <div
                  className="
                    pl-9 pr-2 py-1
                    space-y-1 mt-1
                    border-l-2
                    border-gray-200
                    dark:border-gray-700
                    ml-4
                  "
                >
                  {/* Kelola Data Eskul */}
                  <Link
                    to="/admin/kelola-eskul"
                    className="
                      block
                      py-1.5 px-2
                      rounded-md
                      text-xs font-medium
                      text-gray-600 dark:text-gray-400
                      hover:text-gray-900
                      dark:hover:text-white
                      hover:bg-gray-100
                      dark:hover:bg-gray-800
                      transition-colors
                      truncate
                    "
                  >
                    • Kelola Data Eskul
                  </Link>

                  {/* Data Pendaftar */}
                  <Link
                    to="/admin/pendaftar"
                    className="
                      block
                      py-1.5 px-2
                      rounded-md
                      text-xs font-medium
                      text-gray-600 dark:text-gray-400
                      hover:text-gray-900
                      dark:hover:text-white
                      hover:bg-gray-100
                      dark:hover:bg-gray-800
                      transition-colors
                      truncate
                    "
                  >
                    • Data Pendaftar
                  </Link>

                  {/* Kelola Pembina */}
                  <Link
                    to="/admin/kelola-pembina"
                    className="
                      block
                      py-1.5 px-2
                      rounded-md
                      text-xs font-medium
                      text-gray-600 dark:text-gray-400
                      hover:text-gray-900
                      dark:hover:text-white
                      hover:bg-gray-100
                      dark:hover:bg-gray-800
                      transition-colors
                      truncate
                    "
                  >
                    • Kelola Pembina
                  </Link>

                  {/* Manajemen Kelas */}
                  <Link
                    to="/admin/manajemen-kelas"
                    className="
                      block
                      py-1.5 px-2
                      rounded-md
                      text-xs font-medium
                      text-gray-600 dark:text-gray-400
                      hover:text-gray-900
                      dark:hover:text-white
                      hover:bg-gray-100
                      dark:hover:bg-gray-800
                      transition-colors
                      truncate
                    "
                  >
                    • Manajemen Kelas
                  </Link>

                  {/* Data User */}
                  <Link
                    to="/admin/data-user"
                    className="
                      block
                      py-1.5 px-2
                      rounded-md
                      text-xs font-medium
                      text-gray-600 dark:text-gray-400
                      hover:text-gray-900
                      dark:hover:text-white
                      hover:bg-gray-100
                      dark:hover:bg-gray-800
                      transition-colors
                      truncate
                    "
                  >
                    • Data User
                  </Link>
                </div>
              )}
            </div>
          )}


          {/* DAFTAR ESKUL */}
          <div className="mt-1">
            <button
              onClick={() => {
                if (isCollapsed) {
                  setIsCollapsed(false);
                  setIsDropdownOpen(true);
                } else {
                  setIsDropdownOpen(!isDropdownOpen);
                }
              }}
              title={
                isPembina
                  ? 'Eskul yang Dibina'
                  : 'Daftar Eskul'
              }
              className={`
                w-full
                flex items-center justify-between
                px-3 py-2.5
                rounded-lg
                text-sm font-medium
                text-gray-700 dark:text-gray-200
                hover:bg-gray-100 dark:hover:bg-gray-800
                transition-colors
                ${isCollapsed ? 'justify-center' : ''}
              `}
            >
              <div
                className={`
                  flex items-center gap-3
                  ${isCollapsed ? 'justify-center' : ''}
                `}
              >
                <List className="w-5 h-5 shrink-0 text-gray-500 dark:text-gray-400" />
                {!isCollapsed && (
                  <span className="whitespace-nowrap">
                    {isPembina
                      ? 'Eskul yang Dibina'
                      : 'Daftar Eskul'}
                  </span>
                )}
              </div>

              {!isCollapsed && (
                <ChevronDown
                  className={`
                    w-4 h-4
                    transition-transform
                    shrink-0
                    text-gray-500
                    ${
                      isDropdownOpen
                        ? 'rotate-180'
                        : ''
                    }
                  `}
                />
              )}
            </button>


            {!isCollapsed &&
              isDropdownOpen && (
              <div
                className="
                  pl-9 pr-2 py-1
                  space-y-1 mt-1
                  border-l-2
                  border-gray-200
                  dark:border-gray-700
                  ml-4
                "
              >
                {daftarEskulSidebar.length === 0 ? (
                  <span className="
                    block py-1.5 px-2
                    text-xs text-gray-400
                  ">
                    Belum ada eskul
                  </span>
                ) : (
                  daftarEskulSidebar.map((eskul) => {
                    const nama =
                      eskul.nama_eskul || '';

                    const slug =
                      nama
                        .toLowerCase()
                        .trim()
                        .replace(/\s+/g, '-');

                    return (
                      <Link
                        key={eskul.id_eskul}
                        to={`/eskul/${slug}`}
                        className="
                          block
                          py-1.5 px-2
                          rounded-md
                          text-xs font-medium
                          text-gray-600 dark:text-gray-400
                          hover:text-gray-900
                          dark:hover:text-white
                          hover:bg-gray-100
                          dark:hover:bg-gray-800
                          transition-colors
                          truncate
                        "
                      >
                        • {nama}
                      </Link>
                    );
                  })
                )}
              </div>
            )}
          </div>

        </nav>

      </div>


      {/* BAGIAN BAWAH (MODE GELAP & LOGOUT) */}
      <div className="
        pt-4
        border-t
        border-gray-100
        dark:border-gray-700
        space-y-1
      ">

        {/* MODE GELAP / TERANG */}
        <button
          onClick={toggleDarkMode}
          title={
            darkMode
              ? 'Mode Terang'
              : 'Mode Gelap'
          }
          className={`
            w-full
            flex items-center gap-3
            px-3 py-2.5
            rounded-lg
            text-sm font-medium
            text-gray-600 dark:text-gray-300
            bg-gray-50 dark:bg-gray-800
            hover:bg-gray-100 dark:hover:bg-gray-700
            transition-colors
            ${isCollapsed ? 'justify-center' : ''}
          `}
        >
          {darkMode ? (
            <Sun className="
              w-5 h-5
              text-yellow-500
              shrink-0
            " />
          ) : (
            <Moon className="
              w-5 h-5
              text-gray-600
              dark:text-gray-300
              shrink-0
            " />
          )}

          {!isCollapsed && (
            <span className="whitespace-nowrap">
              {darkMode
                ? 'Mode Terang'
                : 'Mode Gelap'}
            </span>
          )}
        </button>


        {/* LOGOUT */}
        <button
          onClick={handleLogout}
          title="Keluar"
          className={`
            w-full
            flex items-center gap-3
            px-3 py-2.5
            rounded-lg
            text-sm font-medium
            text-red-600 dark:text-red-400
            hover:bg-red-50
            dark:hover:bg-red-900/20
            transition-colors
            ${isCollapsed ? 'justify-center' : ''}
          `}
        >
          <LogOut className="w-5 h-5 shrink-0" />

          {!isCollapsed && (
            <span className="whitespace-nowrap">
              Keluar
            </span>
          )}
        </button>

      </div>

    </aside>
  );
}