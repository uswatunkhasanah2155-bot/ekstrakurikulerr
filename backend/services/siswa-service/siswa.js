import express from 'express';
import prisma from '../../lib/prisma.js';
import { verifyToken } from '../../middleware/authMiddleware.js';

const router = express.Router();

// GET: Mengambil semua data siswa
router.get('/', verifyToken, async (req, res) => {
  try {
    const listSiswa = await prisma.siswa.findMany({
      include: {
        user: true,
      },
    });
    res.json({
      success: true,
      message: 'Berhasil mengambil data siswa',
      data: listSiswa,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data siswa',
      error: error.message,
    });
  }
});

// POST: Menambahkan profil siswa (disesuaikan dengan kolom pgAdmin)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { nama_siswa, kelas, jenis_kelamin } = req.body;
    
    // Mengambil ID user dari token secara fleksibel (mencegah undefined)
    const userId = req.user.id_user || req.user.id; 

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'ID User tidak ditemukan di dalam token. Coba login ulang!',
      });
    }

    // Validasi sederhana sesuai kolom yang ada
    if (!nama_siswa || !kelas) {
      return res.status(400).json({
        success: false,
        message: 'Nama Siswa dan Kelas wajib diisi!',
      });
    }

    // Simpan ke database
    const siswaBaru = await prisma.siswa.create({
      data: {
        nama_siswa,
        kelas,
        jenis_kelamin,
        id_user: userId, // Menghubungkan ke user yang sedang login
      },
    });

    res.status(201).json({
      success: true,
      message: 'Berhasil menambahkan profil siswa',
      data: siswaBaru,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal menambah profil siswa',
      error: error.message,
    });
  }
});

export default router;