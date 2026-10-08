// src/config.js
// Alamat backend. Di Vercel diisi lewat Environment Variable VITE_API_URL
// (contoh: https://uswatun-api.vercel.app). Di komputer sendiri otomatis ke localhost.
export const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000'
).replace(/\/+$/, '');