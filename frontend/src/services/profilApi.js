// src/services/profilApi.js
import { handleUnauthorized } from './api';

const API_URL = 'http://localhost:5000';

// Ambil profil akun yang sedang login
export async function getProfilSaya() {
  try {
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (handleUnauthorized(response)) return null;

    if (!response.ok) throw new Error('Gagal mengambil profil');

    const result = await response.json();
    return result.data || null;
  } catch (error) {
    console.error('Error fetching profil saya:', error);
    return null;
  }
}

// Update nama, email, dan/atau foto profil.
// dataProfil = { nama, email, foto (File) } -> semua opsional
export async function updateProfilSaya(dataProfil) {
  try {
    const token = localStorage.getItem('token');

    const formData = new FormData();
    if (dataProfil.nama !== undefined) formData.append('nama', dataProfil.nama);
    if (dataProfil.email !== undefined) formData.append('email', dataProfil.email);
    if (dataProfil.foto) formData.append('foto', dataProfil.foto);

    const response = await fetch(`${API_URL}/api/auth/me`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (handleUnauthorized(response)) {
      return { success: false, error: 'Sesi login berakhir.' };
    }

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Gagal memperbarui profil');
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error updating profil saya:', error);
    return { success: false, error: error.message };
  }
}