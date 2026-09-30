// src/App.jsx

import React, { useEffect } from 'react';

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation
} from 'react-router-dom';

import { verifyToken } from './services/api';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DashboardPembina from './pages/DashboardPembina';
import DashboardSiswa from './pages/DashboardSiswa';
import ExtracurricularDetail from './pages/ExtracurricularDetail';
import RegistrationForm from './pages/RegistrationForm';
import KelolaEskul from './pages/KelolaEskul';
import KelolaPembina from './pages/KelolaPembina';
import PendaftarEskul from './pages/PendaftarEskul';
import GaleriEskul from './pages/GaleriEskul';
import GaleriFotoDetail from './pages/GaleriFotoDetail';
import GaleriUploadFoto from './pages/GaleriUploadFoto';
import TambahSiswaManual from './pages/TambahSiswaManual';
import EditSiswaManual from './pages/EditSiswaManual';
import ManajemenKelas from './pages/ManajemenKelas';
import DataUser from './pages/DataUser';
import JadwalEskul from './pages/JadwalEskul';
import LaporanEskul from './pages/LaporanEskul';

// ======================================================
// HELPER: HAPUS SESI
// ======================================================

function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('id_user');
  localStorage.removeItem('id_eskul');
}


// ======================================================
// HELPER: DASHBOARD SESUAI ROLE
// ======================================================

function getDashboardPath(role) {
  if (role === 'ADMIN') return '/admin/dashboard';
  if (role === 'PEMBINA') return '/pembina/dashboard';
  if (role === 'SISWA') return '/siswa/dashboard';
  return null;
}


// ======================================================
// PROTEKSI HALAMAN ADMIN
// ======================================================

function AdminRoute({ children }) {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const role = (localStorage.getItem('role') || '').toUpperCase();

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (role !== 'ADMIN') {
    // Role valid tapi salah halaman -> arahkan ke dashboard miliknya, tanpa logout
    const ownDashboard = getDashboardPath(role);

    if (ownDashboard) {
      return <Navigate to={ownDashboard} replace />;
    }

    // Role tidak dikenal -> sesi tidak valid
    clearSession();
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return children;
}


// ======================================================
// PROTEKSI HALAMAN PEMBINA
// ======================================================

function PembinaRoute({ children }) {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const role = (localStorage.getItem('role') || '').toUpperCase();

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (role !== 'PEMBINA') {
    // Role valid tapi salah halaman -> arahkan ke dashboard miliknya, tanpa logout
    const ownDashboard = getDashboardPath(role);

    if (ownDashboard) {
      return <Navigate to={ownDashboard} replace />;
    }

    // Role tidak dikenal -> sesi tidak valid
    clearSession();
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return children;
}


// ======================================================
// PROTEKSI HALAMAN ADMIN / PEMBINA
// ======================================================

function AdminOrPembinaRoute({ children }) {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const role = (localStorage.getItem('role') || '').toUpperCase();

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (role !== 'ADMIN' && role !== 'PEMBINA') {
    // Role valid tapi salah halaman -> arahkan ke dashboard miliknya, tanpa logout
    const ownDashboard = getDashboardPath(role);

    if (ownDashboard) {
      return <Navigate to={ownDashboard} replace />;
    }

    // Role tidak dikenal -> sesi tidak valid
    clearSession();
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return children;
}


// ======================================================
// PROTEKSI HALAMAN SISWA
// ======================================================

function StudentRoute({ children }) {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const role = (localStorage.getItem('role') || '').toUpperCase();

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  // Jika admin/pembina mencoba masuk ke halaman siswa, arahkan ke dashboard mereka
  if (role === 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  if (role === 'PEMBINA') {
    return <Navigate to="/pembina/dashboard" replace />;
  }

  return children;
}


// ======================================================
// APP
// ======================================================

function App() {

  // TERAPKAN TEMA YANG TERSIMPAN
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // CEK TOKEN & ROLE
  useEffect(() => {
    const cekToken = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const result = await verifyToken();

        // Token tidak valid
        if (!result?.valid) {
          clearSession();
          window.location.href = '/login';
          return;
        }

        const tokenRole = result.data?.role;
        const storedRole = localStorage.getItem('role');

        // Role tidak lengkap
        if (!tokenRole || !storedRole) {
          clearSession();
          window.location.href = '/login';
          return;
        }

        // Role di token berbeda dengan role di localStorage
        if (tokenRole.toLowerCase() !== storedRole.toLowerCase()) {
          clearSession();
          window.location.href = '/login';
          return;
        }
      } catch (error) {
        console.error('Gagal memverifikasi token:', error);
      }
    };

    cekToken();
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 transition-colors duration-300">
        <Routes>

          {/* Rute Umum & Autentikasi */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Rute Dashboard Berdasarkan Role */}
          <Route path="/admin/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
          <Route path="/pembina/dashboard" element={<PembinaRoute><DashboardPembina /></PembinaRoute>} />
          <Route path="/siswa/dashboard" element={<StudentRoute><DashboardSiswa /></StudentRoute>} />

          {/* Rute Cadangan/Universal Dashboard (Dialihkan otomatis jika diakses langsung) */}
          <Route path="/dashboard" element={<Navigate to="/login" replace />} />

          {/* Rute Halaman Jadwal Eskul */}
          <Route path="/jadwal" element={<JadwalEskul />} />

          {/* Rute Admin Lainnya */}
          <Route path="/admin/kelola-pembina" element={<AdminRoute><KelolaPembina /></AdminRoute>} />
          <Route path="/admin/manajemen-kelas" element={<AdminRoute><ManajemenKelas /></AdminRoute>} />
          <Route path="/admin/pendaftar" element={<AdminRoute><PendaftarEskul /></AdminRoute>} />
          <Route path="/admin/data-user" element={<AdminRoute><DataUser /></AdminRoute>} />

          {/* Rute Admin & Pembina */}
          <Route path="/admin/kelola-eskul" element={<AdminOrPembinaRoute><KelolaEskul /></AdminOrPembinaRoute>} />
          <Route path="/admin/laporan-eskul/:id" element={<AdminOrPembinaRoute><LaporanEskul /></AdminOrPembinaRoute>} />

          {/* Rute Ekstrakurikuler Umum */}
          <Route path="/eskul/:namaEskul" element={<ExtracurricularDetail />} />
          <Route path="/eskul/:namaEskul/daftar" element={<RegistrationForm />} />
          <Route path="/eskul/:namaEskul/galeri" element={<GaleriEskul />} />
          <Route path="/eskul/:namaEskul/galeri/upload" element={<AdminOrPembinaRoute><GaleriUploadFoto /></AdminOrPembinaRoute>} />
          <Route path="/eskul/:namaEskul/galeri/:idGaleri" element={<GaleriFotoDetail />} />
          <Route path="/eskul/:namaEskul/siswa/tambah" element={<AdminOrPembinaRoute><TambahSiswaManual /></AdminOrPembinaRoute>} />
          <Route path="/eskul/:namaEskul/siswa/edit/:idPendaftaran" element={<AdminOrPembinaRoute><EditSiswaManual /></AdminOrPembinaRoute>} />

          {/* Fallback jika rute tidak ditemukan */}
          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </div>
    </Router>
  );
}

export default App;