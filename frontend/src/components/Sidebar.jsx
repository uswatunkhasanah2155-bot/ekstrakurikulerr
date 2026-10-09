// src/components/Sidebar.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getDaftarEskul } from '../services/api';
import { getProfilSaya } from '../services/profilApi';
import { fotoUrl } from '../utils/fotoUrl';
import logoSekolah from '../assets/logosmkc.jpeg';

import {
  LayoutDashboard,
  Users,
  List,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  User,
  Moon,
  Sun,
  Database,
  Image,         // Galeri (Pembina)
  ClipboardList, // Kelola Eskul (Pembina)
  Menu,          // Tombol hamburger (HP)
  X              // Tutup menu (HP)
} from 'lucide-react';

export default function Sidebar() {

  const navigate = useNavigate();

  const [isDropdownOpen, setIsDropdownOpen] = useState(true);
  // State khusus untuk dropdown Manajemen Master (Admin)
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

  const idEskulPembina =
    localStorage.getItem('id_eskul');


  // ======================================================
  // COLLAPSE / EXPAND SIDEBAR
  // ======================================================

  // Layar besar (desktop) >= 1024px. Di bawah itu sidebar jadi menu geser (drawer).
  const [isDesktop, setIsDesktop] = useState(
    () => window.matchMedia('(min-width: 1024px)').matches
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');

    const onChange = (e) => {
      setIsDesktop(e.matches);
      if (e.matches) setMobileOpen(false);
    };

    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Tutup menu saat pindah halaman
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Kunci scroll halaman saat menu terbuka di HP
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // Preferensi collapse tersimpan; hanya berlaku di desktop
  const [isCollapsedPref, setIsCollapsedPref] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });

  const isCollapsed = isCollapsedPref && isDesktop;

  useEffect(() => {
    localStorage.setItem(
      'sidebarCollapsed',
      isCollapsedPref
    );
  }, [isCollapsedPref]);

  useEffect(() => {
    if (isCollapsed) {
      setIsDropdownOpen(false);
      setIsMasterDropdownOpen(false);
    }
  }, [isCollapsed]);

  // Bagikan lebar sidebar ke komponen lain (mis. Footer lewat CSS variable)
  useEffect(() => {
    const lebar = isDesktop
      ? (isCollapsed ? '5rem' : '16rem')
      : '0px';

    document.documentElement.style.setProperty('--sidebar-w', lebar);

    return () => {
      document.documentElement.style.removeProperty('--sidebar-w');
    };
  }, [isDesktop, isCollapsed]);


  const toggleSidebar = () => {
    setIsCollapsedPref(prev => !prev);
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


  // ======================================================
  // PROFIL PEMBINA (foto & nama untuk kartu user)
  // ======================================================

  const [profilSidebar, setProfilSidebar] = useState(null);

  useEffect(() => {
    if (!isPembina) return;

    let cancelled = false;

    const muatProfil = async () => {
      const data = await getProfilSaya();
      if (!cancelled) setProfilSidebar(data);
    };

    muatProfil();

    // Dipanggil dari halaman Profil Saya setelah profil disimpan
    window.addEventListener('profil-updated', muatProfil);

    return () => {
      cancelled = true;
      window.removeEventListener('profil-updated', muatProfil);
    };
  }, [isPembina]);

  const namaSidebar =
    profilSidebar?.nama || profilSidebar?.username || 'Pembina';

  const fotoSidebar = fotoUrl(profilSidebar?.foto);


  const namaEskulDibina =
    daftarEskulSidebar[0]?.nama_eskul;

  const slugEskul = namaEskulDibina
    ? namaEskulDibina
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
    : '';


  // Dashboard sesuai role (cocok dengan route di App.jsx)
  const dashboardPath = isAdmin
    ? '/admin/dashboard'
    : isPembina
    ? '/pembina/dashboard'
    : '/siswa/dashboard';


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
  // CLASS YANG DIPAKAI BERULANG
  // ======================================================

  const menuClass = `
    flex items-center gap-3
    px-3 py-2.5
    rounded-lg
    text-sm font-medium
    text-gray-700 dark:text-gray-200
    hover:bg-gray-100 dark:hover:bg-gray-800
    transition-colors
    ${isCollapsed ? 'justify-center' : ''}
  `;

  const subMenuClass = `
    block
    py-1.5 px-2
    rounded-md
    text-xs font-medium
    text-gray-600 dark:text-gray-400
    hover:text-gray-900 dark:hover:text-white
    hover:bg-gray-100 dark:hover:bg-gray-800
    transition-colors
    truncate
  `;

  const iconClass =
    'w-5 h-5 shrink-0 text-gray-500 dark:text-gray-400';

  const subListClass = `
    pl-9 pr-2 py-1
    space-y-1 mt-1
    border-l-2
    border-gray-200
    dark:border-gray-700
    ml-4
  `;


  // ======================================================
  // RENDER
  // ======================================================

  return (
    <>

    {/* TOP BAR + HAMBURGER (hanya di HP / tablet) */}
    <div className="
      sidebar-topbar
      lg:hidden
      fixed top-0 inset-x-0 z-30
      h-14
      px-3
      flex items-center gap-3
      bg-white/95 dark:bg-gray-900/95
      backdrop-blur
      border-b border-gray-200 dark:border-gray-700
    ">
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Buka menu"
        className="
          w-10 h-10
          rounded-lg
          flex items-center justify-center
          text-gray-700 dark:text-gray-200
          hover:bg-gray-100 dark:hover:bg-gray-800
        "
      >
        <Menu className="w-6 h-6" />
      </button>

      <img
        src={logoSekolah}
        alt="Logo Sekolah"
        className="w-8 h-8 rounded-md object-contain bg-white"
      />

      <span className="font-bold text-gray-800 dark:text-white">
        SESCO ESKUL
      </span>
    </div>

    {/* LATAR GELAP saat menu terbuka di HP */}
    {mobileOpen && (
      <div
        onClick={() => setMobileOpen(false)}
        className="lg:hidden fixed inset-0 z-40 bg-black/50"
      />
    )}

    {/* SIDEBAR: fixed (statis) di desktop, drawer di HP */}
    <aside
      className={`
        fixed inset-y-0 left-0 z-50
        w-64
        transition-transform duration-300 lg:transition-all
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:h-screen lg:z-30
        ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
        bg-white dark:bg-gray-900
        border-r border-gray-200 dark:border-gray-700
        flex flex-col
        justify-between
        p-4
        shadow-sm
      `}
    >

      {/* TOMBOL TUTUP (hanya di HP) */}
      <button
        onClick={() => setMobileOpen(false)}
        aria-label="Tutup menu"
        className="
          lg:hidden
          absolute right-3 top-3
          w-8 h-8
          rounded-lg
          flex items-center justify-center
          text-gray-500 dark:text-gray-300
          hover:bg-gray-100 dark:hover:bg-gray-800
        "
      >
        <X className="w-5 h-5" />
      </button>

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
          hidden lg:flex items-center justify-center
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


      {/* BAGIAN ATAS: bisa di-scroll sendiri kalau menu panjang (desktop) */}
      <div className="flex min-h-0 flex-1 flex-col">

        {/* LOGO */}
        <div
          className={`
            shrink-0 flex items-center gap-2 px-2 mb-6
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
            shrink-0
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
            overflow-hidden
          ">
            {isPembina && fotoSidebar ? (
              <img
                src={fotoSidebar}
                alt={namaSidebar}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-6 h-6" />
            )}
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
                  ? namaSidebar
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
        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain pr-1">

          {/* DASHBOARD */}
          <Link
            to={dashboardPath}
            title="Dashboard"
            className={menuClass}
          >
            <LayoutDashboard className={iconClass} />
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
                    setIsCollapsedPref(false);
                    setIsMasterDropdownOpen(true);
                  } else {
                    setIsMasterDropdownOpen(!isMasterDropdownOpen);
                  }
                }}
                title="Manajemen Master"
                className={`w-full justify-between ${menuClass}`}
              >
                <div
                  className={`
                    flex items-center gap-3
                    ${isCollapsed ? 'justify-center' : ''}
                  `}
                >
                  <Database className={iconClass} />
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
                      ${isMasterDropdownOpen ? 'rotate-180' : ''}
                    `}
                  />
                )}
              </button>

              {/* ISI SUB-MENU MANAJEMEN MASTER */}
              {!isCollapsed && isMasterDropdownOpen && (
                <div className={subListClass}>
                  <Link to="/admin/kelola-eskul" className={subMenuClass}>
                    • Kelola Data Eskul
                  </Link>

                  <Link to="/admin/pendaftar" className={subMenuClass}>
                    • Data Pendaftar
                  </Link>

                  <Link to="/admin/kelola-pembina" className={subMenuClass}>
                    • Kelola Pembina
                  </Link>

                  <Link to="/admin/manajemen-kelas" className={subMenuClass}>
                    • Manajemen Kelas
                  </Link>

                  <Link to="/admin/data-user" className={subMenuClass}>
                    • Data User
                  </Link>
                </div>
              )}
            </div>
          )}


          {/* ====================================================== */}
          {/* MENU PEMBINA                                            */}
          {/* ====================================================== */}
          {isPembina && (
            <>
              {/* Eskul yang Dibina: judul saja, tanpa dropdown */}
              <div className="mt-1">
                <div
                  title="Eskul yang Dibina"
                  className={`
                    flex items-center gap-3
                    px-3 py-2.5
                    text-sm font-medium
                    text-gray-700 dark:text-gray-200
                    ${isCollapsed ? 'justify-center' : ''}
                  `}
                >
                  <List className={iconClass} />
                  {!isCollapsed && (
                    <span className="whitespace-nowrap">
                      Eskul yang Dibina
                    </span>
                  )}
                </div>

                {!isCollapsed && (
                  <div className={subListClass}>
                    {namaEskulDibina ? (
                      <Link
                        to={`/eskul/${slugEskul}`}
                        className={subMenuClass}
                      >
                        • {namaEskulDibina}
                      </Link>
                    ) : (
                      <span className="block py-1.5 px-2 text-xs text-gray-400">
                        Belum ada eskul
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Kelola Eskul */}
              <Link
                to="/pembina/kelola-eskul"
                title="Kelola Eskul"
                className={menuClass}
              >
                <ClipboardList className={iconClass} />
                {!isCollapsed && (
                  <span className="whitespace-nowrap">
                    Kelola Eskul
                  </span>
                )}
              </Link>

              {/* Anggota */}
              <Link
                to={`/eskul/${slugEskul}/anggota`}
                title="Anggota"
                className={menuClass}
              >
                <Users className={iconClass} />
                {!isCollapsed && (
                  <span className="whitespace-nowrap">
                    Anggota
                  </span>
                )}
              </Link>

              {/* Galeri */}
              <Link
                to={`/eskul/${slugEskul}/galeri`}
                title="Galeri"
                className={menuClass}
              >
                <Image className={iconClass} />
                {!isCollapsed && (
                  <span className="whitespace-nowrap">
                    Galeri
                  </span>
                )}
              </Link>
            </>
          )}


          {/* ====================================================== */}
          {/* DAFTAR ESKUL (ADMIN & SISWA, DROPDOWN)                  */}
          {/* ====================================================== */}
          {!isPembina && (
            <div className="mt-1">
              <button
                onClick={() => {
                  if (isCollapsed) {
                    setIsCollapsedPref(false);
                    setIsDropdownOpen(true);
                  } else {
                    setIsDropdownOpen(!isDropdownOpen);
                  }
                }}
                title="Daftar Eskul"
                className={`w-full justify-between ${menuClass}`}
              >
                <div
                  className={`
                    flex items-center gap-3
                    ${isCollapsed ? 'justify-center' : ''}
                  `}
                >
                  <List className={iconClass} />
                  {!isCollapsed && (
                    <span className="whitespace-nowrap">
                      Daftar Eskul
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
                      ${isDropdownOpen ? 'rotate-180' : ''}
                    `}
                  />
                )}
              </button>

              {!isCollapsed && isDropdownOpen && (
                <div className={subListClass}>
                  {daftarEskulSidebar.length === 0 ? (
                    <span className="block py-1.5 px-2 text-xs text-gray-400">
                      Belum ada eskul
                    </span>
                  ) : (
                    daftarEskulSidebar.map((eskul) => {
                      const nama = eskul.nama_eskul || '';

                      const slug = nama
                        .toLowerCase()
                        .trim()
                        .replace(/\s+/g, '-');

                      return (
                        <Link
                          key={eskul.id_eskul}
                          to={`/eskul/${slug}`}
                          className={subMenuClass}
                        >
                          • {nama}
                        </Link>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}

        </nav>

      </div>


      {/* BAGIAN BAWAH (PROFIL, MODE GELAP & LOGOUT) */}
      <div className="
        shrink-0
        pt-4
        border-t
        border-gray-100
        dark:border-gray-700
        space-y-1
      ">

        {/* PROFIL SAYA (khusus Pembina) */}
        {isPembina && (
          <Link
            to="/pembina/profil"
            title="Profil Saya"
            className={menuClass}
          >
            <User className={iconClass} />
            {!isCollapsed && (
              <span className="whitespace-nowrap">
                Profil Saya
              </span>
            )}
          </Link>
        )}


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
            <Sun className="w-5 h-5 text-yellow-500 shrink-0" />
          ) : (
            <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300 shrink-0" />
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

    {/* SPACER: menggantikan ruang sidebar yang sekarang fixed (desktop) */}
    <div
      aria-hidden="true"
      className={`
        hidden lg:block shrink-0
        transition-[width] duration-300
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}
    />

    </>
  );
}