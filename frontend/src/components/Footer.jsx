// src/components/Footer.jsx
import React from 'react';

// Footer mulai dari sisi kanan sidebar (desktop).
// Lebar sidebar dibagikan oleh Sidebar.jsx lewat CSS variable --sidebar-w.
// Di halaman tanpa sidebar (Login, halaman siswa), variabel tidak ada -> margin 0.
export default function Footer() {
  return (
    <footer
      style={{ marginLeft: 'var(--sidebar-w, 0px)' }}
      className="border-t border-gray-200 bg-white transition-all duration-300 dark:border-gray-800 dark:bg-gray-900"
    >
      <div className="w-full px-4 py-5 text-center text-xs text-gray-500 dark:text-gray-400 sm:px-6 lg:px-10">
        <p className="font-semibold text-gray-700 dark:text-gray-200">SESCO ESKUL</p>
        <p className="mt-1">
          © {new Date().getFullYear()} SMK Negeri Compreng. Semua hak dilindungi.
        </p>
      </div>
    </footer>
  );
}