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
import StudentDashboard from './pages/Dashboard';
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


// ======================================================
// PROTEKSI HALAMAN ADMIN
// ======================================================

function AdminRoute({ children }) {

  const location = useLocation();

  const token =
    localStorage.getItem('token');

  const role =
    (localStorage.getItem('role') || '')
      .toUpperCase();


  // Tidak punya token
  if (!token) {

    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname
        }}
      />
    );

  }


  // Bukan ADMIN
  if (role !== 'ADMIN') {

    // Hapus sesi
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('id_user');
    localStorage.removeItem('id_eskul');

    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname
        }}
      />
    );

  }


  // ADMIN boleh masuk
  return children;
}


// ======================================================
// APP
// ======================================================

function App() {


  // ======================================================
  // TERAPKAN TEMA YANG TERSIMPAN
  // ======================================================

  useEffect(() => {

    const savedTheme =
      localStorage.getItem('theme');

    if (savedTheme === 'dark') {

      document.documentElement.classList.add(
        'dark'
      );

    } else {

      document.documentElement.classList.remove(
        'dark'
      );

    }

  }, []);


  // ======================================================
  // CEK TOKEN & ROLE
  // ======================================================

  useEffect(() => {

    const cekToken = async () => {

      const token =
        localStorage.getItem('token');


      // Kalau belum login
      if (!token) {
        return;
      }


      try {

        const result =
          await verifyToken();


        // ==================================================
        // TOKEN TIDAK VALID / EXPIRED
        // ==================================================

        if (!result.valid) {

          localStorage.removeItem('token');
          localStorage.removeItem('role');
          localStorage.removeItem('id_user');
          localStorage.removeItem('id_eskul');

          window.location.href =
            '/login';

          return;

        }


        // ==================================================
        // ROLE DARI JWT
        // ==================================================

        const tokenRole =
          result.data?.role;


        // ==================================================
        // ROLE DARI LOCAL STORAGE
        // ==================================================

        const storedRole =
          localStorage.getItem('role');


        // ==================================================
        // ROLE TIDAK ADA
        // ==================================================

        if (
          !tokenRole ||
          !storedRole
        ) {

          localStorage.removeItem('token');
          localStorage.removeItem('role');
          localStorage.removeItem('id_user');
          localStorage.removeItem('id_eskul');

          window.location.href =
            '/login';

          return;

        }


        // ==================================================
        // ROLE JWT ≠ ROLE LOCAL STORAGE
        // ==================================================

        if (
          tokenRole.toLowerCase() !==
          storedRole.toLowerCase()
        ) {

          console.log(
            'Role tidak sesuai dengan JWT'
          );

          localStorage.removeItem('token');
          localStorage.removeItem('role');
          localStorage.removeItem('id_user');
          localStorage.removeItem('id_eskul');

          window.location.href =
            '/login';

          return;

        }

      } catch (error) {

        console.error(
          'Gagal memverifikasi token:',
          error
        );

      }

    };


    cekToken();

  }, []);


  // ======================================================
  // ROUTES
  // ======================================================

  return (

    <Router>

      <div
        className="
          min-h-screen
          bg-gray-50
          dark:bg-gray-950
          text-gray-800
          dark:text-gray-100
          transition-colors
          duration-300
        "
      >

        <Routes>

          <Route path="/" element={ <Navigate to="/login" replace/>}/>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/Dashboard" element={<StudentDashboard />} />
          <Route path="/admin/kelola-pembina" element={ <AdminRoute><KelolaPembina /></AdminRoute> } />
          <Route path="/admin/manajemen-kelas" element={ <AdminRoute> <ManajemenKelas /> </AdminRoute> } />
          <Route path="/admin/pendaftar" element={ <AdminRoute> <PendaftarEskul /> </AdminRoute> } />
          <Route path="/admin/data-user" element={  <AdminRoute> <DataUser /> </AdminRoute> }/>
          <Route path="/admin/kelola-eskul" element={ <AdminRoute><KelolaEskul /></AdminRoute> } />
          <Route path="/admin/*" element={ <Navigate to="/login" replace /> } />
          <Route path="/eskul/:namaEskul" element={<ExtracurricularDetail />} />
          <Route path="/eskul/:namaEskul/daftar" element={<RegistrationForm />} />
          <Route path="/eskul/:namaEskul/galeri" element={<GaleriEskul />} />
          <Route path="/eskul/:namaEskul/galeri/upload" element={<GaleriUploadFoto />} />
          <Route path="/eskul/:namaEskul/galeri/:idGaleri" element={<GaleriFotoDetail />} />
          <Route path="/eskul/:namaEskul/siswa/tambah" element={<TambahSiswaManual />} />
          <Route path="/eskul/:namaEskul/siswa/edit/:idPendaftaran" element={<EditSiswaManual />} />
        </Routes>

      </div>

    </Router>

  );
}

export default App;