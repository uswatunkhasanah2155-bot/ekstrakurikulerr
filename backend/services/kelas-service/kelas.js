import express from 'express';
import prisma from '../../lib/prisma.js';
import { verifyToken } from '../../middleware/authMiddleware.js';

const router = express.Router();

// ===============================
// GET SEMUA KELAS
// ===============================
router.get('/', verifyToken, async (req, res) => {
  try {
    const listKelas = await prisma.kelas.findMany({
      orderBy: {
        nama_kelas: 'asc',
      },
    });

    res.json({
      success: true,
      message: 'Berhasil mengambil data kelas',
      data: listKelas,
    });
  } catch (error) {
    console.error('ERROR GET KELAS:', error);

    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data kelas',
      error: error.message,
    });
  }
});

// ===============================
// GET DETAIL KELAS
// ===============================
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const id = Number(req.params.id);

    const kelas = await prisma.kelas.findUnique({
      where: {
        id_kelas: id,
      },
      include: {
        siswa: true,
      },
    });

    if (!kelas) {
      return res.status(404).json({
        success: false,
        message: 'Kelas tidak ditemukan',
      });
    }

    res.json({
      success: true,
      message: 'Berhasil mengambil detail kelas',
      data: kelas,
    });
  } catch (error) {
    console.error('ERROR GET DETAIL KELAS:', error);

    res.status(500).json({
      success: false,
      message: 'Gagal mengambil detail kelas',
      error: error.message,
    });
  }
});

// ===============================
// TAMBAH KELAS
// ===============================
router.post('/', verifyToken, async (req, res) => {
  try {
    const { nama_kelas } = req.body;

    if (!nama_kelas || !nama_kelas.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Nama kelas wajib diisi',
      });
    }

    const kelasBaru = await prisma.kelas.create({
      data: {
        nama_kelas: nama_kelas.trim(),
      },
    });

    res.status(201).json({
      success: true,
      message: 'Berhasil menambahkan kelas',
      data: kelasBaru,
    });
  } catch (error) {
    console.error('ERROR TAMBAH KELAS:', error);

    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Nama kelas sudah ada',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan kelas',
      error: error.message,
    });
  }
});

// ===============================
// UPDATE KELAS
// ===============================
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { nama_kelas } = req.body;

    if (!nama_kelas || !nama_kelas.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Nama kelas wajib diisi',
      });
    }

    const kelasCek = await prisma.kelas.findUnique({
      where: {
        id_kelas: id,
      },
    });

    if (!kelasCek) {
      return res.status(404).json({
        success: false,
        message: 'Kelas tidak ditemukan',
      });
    }

    const kelasUpdated = await prisma.kelas.update({
      where: {
        id_kelas: id,
      },
      data: {
        nama_kelas: nama_kelas.trim(),
      },
    });

    res.json({
      success: true,
      message: 'Berhasil mengupdate kelas',
      data: kelasUpdated,
    });
  } catch (error) {
    console.error('ERROR UPDATE KELAS:', error);

    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Nama kelas sudah digunakan',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate kelas',
      error: error.message,
    });
  }
});

// ===============================
// HAPUS KELAS
// ===============================
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const id = Number(req.params.id);

    const kelasCek = await prisma.kelas.findUnique({
      where: {
        id_kelas: id,
      },
    });

    if (!kelasCek) {
      return res.status(404).json({
        success: false,
        message: 'Kelas tidak ditemukan',
      });
    }

    // Cek apakah masih ada siswa yang menggunakan kelas ini
    const jumlahSiswa = await prisma.siswa.count({
      where: {
        id_kelas: id,
      },
    });

    if (jumlahSiswa > 0) {
      return res.status(400).json({
        success: false,
        message: `Kelas tidak dapat dihapus karena masih digunakan oleh ${jumlahSiswa} siswa`,
      });
    }

    await prisma.kelas.delete({
      where: {
        id_kelas: id,
      },
    });

    res.json({
      success: true,
      message: 'Berhasil menghapus kelas',
    });
  } catch (error) {
    console.error('ERROR DELETE KELAS:', error);

    res.status(500).json({
      success: false,
      message: 'Gagal menghapus kelas',
      error: error.message,
    });
  }
});

export default router;