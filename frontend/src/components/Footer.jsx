// src/components/Footer.jsx
import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-gray-200 bg-white transition-colors duration-300 dark:border-gray-800 dark:bg-gray-900">
      <div className="w-full px-4 py-5 text-center text-xs text-gray-500 dark:text-gray-400 sm:px-6 lg:px-10">
        <p className="font-semibold text-gray-700 dark:text-gray-200">SESCO ESKUL</p>
        <p className="mt-1">
          © {new Date().getFullYear()} SMK Negeri Compreng. Semua hak dilindungi.
        </p>
      </div>
    </footer>
  );
}