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

function App() {
  return (
    <Router>
      <Routes>
        {/* Mengarahkan URL utama langsung ke halaman login */}
        <Route path="/" element={<Navigate to="/login" />} />
        
        {/* Halaman Login & Register */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Halaman Dashboard Utama */}
        <Route path="/Dashboard" element={<StudentDashboard />} />
        
        {/* Halaman Khusus Admin */}
        <Route path="/admin/kelola-eskul" element={<KelolaEskul />} />
        <Route path="/admin/pendaftar" element={<PendaftarEskul />} />

        {/* Halaman Detail & Pendaftaran Eskul */}
        <Route path="/eskul/:namaEskul" element={<ExtracurricularDetail />} />
        <Route path="/eskul/:namaEskul/daftar" element={<RegistrationForm />} />
      </Routes>
    </Router>
  );
}

export default App;