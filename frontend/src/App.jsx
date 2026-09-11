// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/Dashboard';
import ExtracurricularDetail from './pages/ExtracurricularDetail';
import RegistrationForm from './pages/RegistrationForm';
import KelolaEskul from './pages/KelolaEskul';
import PendaftarEskul from './pages/PendaftarEskul';
import GaleriEskul from './pages/GaleriEskul';
import GaleriFotoDetail from './pages/GaleriFotoDetail';
import GaleriUploadFoto from './pages/GaleriUploadFoto';
import TambahSiswaManual from './pages/TambahSiswaManual';
import EditSiswaManual from './pages/EditSiswaManual';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/Dashboard" element={<StudentDashboard />} />
        <Route path="/admin/kelola-eskul" element={<KelolaEskul />} />
        <Route path="/admin/pendaftar" element={<PendaftarEskul />} />
        <Route path="/eskul/:namaEskul" element={<ExtracurricularDetail />} />
        <Route path="/eskul/:namaEskul/daftar" element={<RegistrationForm />} />
        <Route path="/eskul/:namaEskul/galeri" element={<GaleriEskul />} />
        <Route path="/eskul/:namaEskul/galeri/upload" element={<GaleriUploadFoto />} />
        <Route path="/eskul/:namaEskul/galeri/:idGaleri" element={<GaleriFotoDetail />} />
        <Route path="/eskul/:namaEskul/siswa/tambah" element={<TambahSiswaManual />} />
        <Route path="/eskul/:namaEskul/siswa/edit/:idPendaftaran" element={<EditSiswaManual />} />
      </Routes>
    </Router>
  );
}

export default App;