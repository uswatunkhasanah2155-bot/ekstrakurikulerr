import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import eskulRoutes from './services/eskul-service/eskul.js'; 
import authRoutes from './services/auth-service/auth.js'; 
import pendaftaranRoutes from './services/pendaftaran-service/pendaftaran.js';
import siswaRoutes from './services/siswa-service/siswa.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// PENTING: Agar folder uploads bisa diakses publik (untuk menampilkan gambar di frontend)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Panggil Route Autentikasi (Register & Login)
app.use('/api/auth', authRoutes);

// Panggil Route Ekstrakurikuler
app.use('/api/eskul', eskulRoutes);

// Panggil Route Pendaftaran
app.use('/api/pendaftaran', pendaftaranRoutes);

// Panggil Route Siswa
app.use('/api/siswa', siswaRoutes);

// Route uji coba utama
app.get('/', (req, res) => {
  res.json({ message: 'Server API Ekstrakurikuler Berjalan Lancar! 🚀' });
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`Server aktif di http://localhost:${PORT}`);
});