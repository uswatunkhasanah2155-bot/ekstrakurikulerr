// src/components/MainLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Footer from './Footer';

// Layout bersama: isi halaman di atas, Footer selalu di paling bawah.
// Navbar / Sidebar tetap dipasang oleh masing-masing halaman.
export default function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1 flex-col">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}