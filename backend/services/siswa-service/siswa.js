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

// PUT: Mengupdate data siswa berdasarkan id_siswa
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_siswa, kelas, jenis_kelamin } = req.body;

    // Cek apakah data siswa ada di database
    const siswaCek = await prisma.siswa.findUnique({
      where: { id_siswa: Number(id) },
    });

    if (!siswaCek) {
      return res.status(404).json({
        success: false,
        message: 'Data siswa tidak ditemukan',
      });
    }

    // Update data di database
    const siswaUpdated = await prisma.siswa.update({
      where: { id_siswa: Number(id) },
      data: {
        nama_siswa: nama_siswa || siswaCek.nama_siswa,
        kelas: kelas || siswaCek.kelas,
        jenis_kelamin: jenis_kelamin || siswaCek.jenis_kelamin,
      },
    });

    res.json({
      success: true,
      message: 'Berhasil mengupdate data siswa',
      data: siswaUpdated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate data siswa',
      error: error.message,
    });
  }
});

// DELETE: Menghapus data siswa berdasarkan id_siswa
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Cek apakah data siswa ada di database
    const siswaCek = await prisma.siswa.findUnique({
      where: { id_siswa: Number(id) },
    });

    if (!siswaCek) {
      return res.status(404).json({
        success: false,
        message: 'Data siswa tidak ditemukan',
      });
    }

    // Hapus data dari database
    await prisma.siswa.delete({
      where: { id_siswa: Number(id) },
    });

    res.json({
      success: true,
      message: 'Berhasil menghapus data siswa',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus data siswa',
      error: error.message,
    });
  }
});

export default router;