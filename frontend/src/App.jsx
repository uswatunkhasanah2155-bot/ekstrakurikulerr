// src/App.jsx
import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

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

function App() {

  // ======================================================
  // TERAPKAN TEMA YANG TERSIMPAN
  // ======================================================

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <Router>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 transition-colors duration-300">

        <Routes>

          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />}/>
          <Route path="/register" element={<Register />}/>
          <Route path="/Dashboard" element={<StudentDashboard />}/>
          <Route path="/admin/kelola-eskul" element={<KelolaEskul />}/>
          <Route path="/admin/kelola-pembina" element={<KelolaPembina />}/>
          <Route path="/admin/manajemen-kelas" element={<ManajemenKelas />}/>
          <Route path="/admin/pendaftar" element={<PendaftarEskul />}/>
          <Route path="/eskul/:namaEskul" element={<ExtracurricularDetail />}/>
          <Route path="/eskul/:namaEskul/daftar" element={<RegistrationForm />}/>
          <Route path="/eskul/:namaEskul/galeri" element={<GaleriEskul />}/>
          <Route path="/eskul/:namaEskul/galeri/upload" element={<GaleriUploadFoto />}/>
          <Route path="/eskul/:namaEskul/galeri/:idGaleri" element={<GaleriFotoDetail />}/>
          <Route path="/eskul/:namaEskul/siswa/tambah" element={<TambahSiswaManual />}/>
          <Route path="/eskul/:namaEskul/siswa/edit/:idPendaftaran" element={<EditSiswaManual />}/>
        </Routes>
      </div>
    </Router>
  );
}

export default App;