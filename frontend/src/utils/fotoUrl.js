// src/utils/fotoUrl.js
//
// Database hanya menyimpan PATH foto, contoh: "galeri/galeri-1790220136494-305705933.png"
// Fungsi ini menyusun path itu menjadi URL lengkap untuk ditampilkan di <img>.
//
// Butuh variabel di file .env frontend:
//   VITE_CLOUDINARY_CLOUD_NAME=nama_cloud_kamu

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

// Data lama (sebelum pindah ke Cloudinary) masih memakai folder uploads di backend
import { API_URL } from '../config';

const LEGACY_BASE = API_URL;

export function fotoUrl(path) {
  if (!path) return null;

  const p = String(path).trim();
  if (!p) return null;

  // URL penuh / preview file lokal: pakai apa adanya
  if (/^(https?:|data:|blob:)/i.test(p)) return p;

  const bersih = p.replace(/^\/+/, '');

  // Data lama yang masih di folder uploads backend
  if (bersih.startsWith('uploads/')) return `${LEGACY_BASE}/${bersih}`;

  // Data baru: path Cloudinary
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${bersih}`;
}

export default fotoUrl;