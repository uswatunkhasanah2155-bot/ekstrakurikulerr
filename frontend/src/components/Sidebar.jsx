// src/components/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getDaftarEskul } from '../services/api';
import {
  LayoutDashboard,
  Settings,
  Users,
  List,
  ChevronDown,
  LogOut,
  User,
  UserCog,
  School,
  Moon,
  Sun
} from 'lucide-react';

export default function Sidebar({ isAdmin }) {
  const navigate = useNavigate();

  const [isDropdownOpen, setIsDropdownOpen] = useState(true);
  const [daftarEskulSidebar, setDaftarEskulSidebar] = useState([]);

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
    setDarkMode((prev) => !prev);
  };


  // ======================================================
  // ROLE
  // ======================================================

  const role = (localStorage.getItem('role') || '').toUpperCase();
  const isPembina = role === 'PEMBINA';
  const idEskulPembina = localStorage.getItem('id_eskul');


  // ======================================================
  // AMBIL DAFTAR ESKUL
  // ======================================================

  useEffect(() => {
    async function fetchEskul() {
      try {
        const data = await getDaftarEskul();

        const listEskul = data?.data || data || [];

        // Pembina hanya melihat eskul yang menjadi tanggung jawabnya
        if (isPembina) {
          const eskulPembina = listEskul.filter(
            (eskul) =>
              String(eskul.id_eskul) === String(idEskulPembina)
          );

          setDaftarEskulSidebar(eskulPembina);
        } else {
          // Admin dan Siswa melihat semua eskul
          setDaftarEskulSidebar(listEskul);
        }
      } catch (error) {
        console.error('Gagal mengambil daftar eskul:', error);
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


  return (
    <aside
      className="
        w-64
        bg-white dark:bg-gray-900
        border-r border-gray-200 dark:border-gray-700
        min-h-screen
        flex flex-col
        justify-between
        p-4
        shadow-sm
        transition-colors duration-300
      "
    >

      <div>

        {/* ==================================================
            LOGO
        ================================================== */}

        <div className="flex items-center gap-2 px-2 mb-6">

          <div className="w-8 h-8 bg-cyan-700 rounded-lg flex items-center justify-center text-white font-bold">
            E
          </div>

          <span className="font-bold text-gray-800 dark:text-white text-lg">
            EskulApp
          </span>

        </div>


        {/* ==================================================
            USER INFO
        ================================================== */}

        <div
          className="
            flex items-center gap-3
            p-3
            bg-gray-50 dark:bg-gray-800
            rounded-xl
            mb-6
            border border-gray-100 dark:border-gray-700
            transition-colors duration-300
          "
        >

          <div
            className="
              w-10 h-10
              rounded-full
              bg-gray-300 dark:bg-gray-700
              flex items-center justify-center
              text-gray-700 dark:text-gray-200
              shrink-0
            "
          >
            <User className="w-6 h-6" />
          </div>

          <div>

            <h4 className="text-sm font-bold text-gray-800 dark:text-white">

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

        </div>


        {/* ==================================================
            NAVIGATION
        ================================================== */}

        <nav className="space-y-1">

          {/* DASHBOARD */}

          <Link
            to="/Dashboard"
            className="
              flex items-center gap-3
              px-3 py-2.5
              rounded-lg
              text-sm font-semibold
              text-emerald-700 dark:text-emerald-300
              bg-emerald-50 dark:bg-emerald-900/30
              hover:bg-emerald-100 dark:hover:bg-emerald-900/50
              transition-colors
            "
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>


          {/* KELOLA DATA ESKUL - ADMIN SAJA */}

          {isAdmin && (
            <Link
              to="/admin/kelola-eskul"
              className="
                flex items-center gap-3
                px-3 py-2.5
                rounded-lg
                text-sm font-semibold
                text-blue-700 dark:text-blue-300
                bg-blue-50 dark:bg-blue-900/30
                hover:bg-blue-100 dark:hover:bg-blue-900/50
                transition-colors mt-1
              "
            >
              <Settings className="w-5 h-5" />
              Kelola Data Eskul
            </Link>
          )}


          {/* DATA PENDAFTAR - ADMIN SAJA */}

          {isAdmin && (
            <Link
              to="/admin/pendaftar"
              className="
                flex items-center gap-3
                px-3 py-2.5
                rounded-lg
                text-sm font-semibold
                text-purple-700 dark:text-purple-300
                bg-purple-50 dark:bg-purple-900/30
                hover:bg-purple-100 dark:hover:bg-purple-900/50
                transition-colors mt-1
              "
            >
              <Users className="w-5 h-5" />
              Data Pendaftar
            </Link>
          )}


          {/* KELOLA PEMBINA - ADMIN SAJA */}

          {isAdmin && (
            <Link
              to="/admin/kelola-pembina"
              className="
                flex items-center gap-3
                px-3 py-2.5
                rounded-lg
                text-sm font-semibold
                text-cyan-700 dark:text-cyan-300
                bg-cyan-50 dark:bg-cyan-900/30
                hover:bg-cyan-100 dark:hover:bg-cyan-900/50
                transition-colors mt-1
              "
            >
              <UserCog className="w-5 h-5" />
              Kelola Pembina
            </Link>
          )}


          {/* MANAJEMEN KELAS - ADMIN SAJA */}

          {isAdmin && (
            <Link
              to="/admin/manajemen-kelas"
              className="
                flex items-center gap-3
                px-3 py-2.5
                rounded-lg
                text-sm font-semibold
                text-orange-700 dark:text-orange-300
                bg-orange-50 dark:bg-orange-900/30
                hover:bg-orange-100 dark:hover:bg-orange-900/50
                transition-colors mt-1
              "
            >
              <School className="w-5 h-5" />
              Manajemen Kelas
            </Link>
          )}


          {/* ==================================================
              MODE GELAP / TERANG
          ================================================== */}

          <button
            onClick={toggleDarkMode}
            className="
              w-full
              flex items-center gap-3
              px-3 py-2.5
              rounded-lg
              text-sm font-medium
              text-gray-600 dark:text-gray-300
              bg-gray-50 dark:bg-gray-800
              hover:bg-gray-100 dark:hover:bg-gray-700
              transition-colors
              mt-1
            "
          >

            {darkMode ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            )}

            <span>
              {darkMode ? 'Mode Terang' : 'Mode Gelap'}
            </span>

          </button>


          {/* ==================================================
              DAFTAR ESKUL
          ================================================== */}

          <div className="mt-1">

            <button
              onClick={() =>
                setIsDropdownOpen(!isDropdownOpen)
              }
              className="
                w-full
                flex items-center justify-between
                px-3 py-2.5
                rounded-lg
                text-sm font-medium
                text-gray-600 dark:text-gray-300
                hover:bg-gray-100 dark:hover:bg-gray-800
                transition-colors
              "
            >

              <div className="flex items-center gap-3">

                <List className="w-5 h-5" />

                <span>
                  {isPembina
                    ? 'Eskul yang Dibina'
                    : 'Daftar Eskul'}
                </span>

              </div>

              <ChevronDown
                className={`
                  w-4 h-4
                  transition-transform
                  ${isDropdownOpen ? 'rotate-180' : ''}
                `}
              />

            </button>


            {isDropdownOpen && (

              <div
                className="
                  pl-9 pr-2 py-1
                  space-y-1 mt-1
                  border-l-2
                  border-emerald-100 dark:border-emerald-900
                  ml-4
                "
              >

                {daftarEskulSidebar.length === 0 ? (

                  <span className="block py-1.5 px-2 text-xs text-gray-400">
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
                          text-gray-500 dark:text-gray-400
                          hover:text-emerald-700 dark:hover:text-emerald-300
                          hover:bg-emerald-50 dark:hover:bg-emerald-900/30
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


      {/* ==================================================
          LOGOUT
      ================================================== */}

      <div className="pt-4 border-t border-gray-100 dark:border-gray-700">

        <button
          onClick={handleLogout}
          className="
            w-full
            flex items-center gap-3
            px-3 py-2.5
            rounded-lg
            text-sm font-medium
            text-red-600 dark:text-red-400
            hover:bg-red-50 dark:hover:bg-red-900/20
            transition-colors
          "
        >

          <LogOut className="w-5 h-5" />

          Keluar

        </button>

      </div>

    </aside>
  );
}