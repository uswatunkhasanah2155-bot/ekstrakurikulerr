import express from 'express';
import prisma from '../../lib/prisma.js';
import { verifyToken } from '../../middleware/authMiddleware.js';

const router = express.Router();

// GET: Mengambil semua data ekstrakurikuler
router.get('/', async (req, res) => {
  try {
    const eskul = await prisma.ekstrakurikuler.findMany();
    res.json({
      success: true,
      message: 'Berhasil mengambil data ekstrakurikuler',
      data: eskul,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data',
      error: error.message,
    });
  }
});

// POST: Menambahkan data ekstrakurikuler baru (Dilindungi token)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { nama_eskul, deskripsi } = req.body;

    if (!nama_eskul) {
      return res.status(400).json({ success: false, message: 'Nama ekstrakurikuler wajib diisi' });
    }

    const eskulBaru = await prisma.ekstrakurikuler.create({
      data: {
        nama_eskul,
        deskripsi,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Berhasil menambahkan ekstrakurikuler baru',
      data: eskulBaru,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal menambah data',
      error: error.message,
    });
  }
});

// PUT: Mengubah/Update data ekstrakurikuler berdasarkan ID (Dilindungi token)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_eskul, deskripsi } = req.body;

    const eskulUpdate = await prisma.ekstrakurikuler.update({
      where: { id_eskul: Number(id) }, // Menyesuaikan primary key di skema prisma kamu
      data: {
        nama_eskul,
        deskripsi,
      },
    });

    res.json({
      success: true,
      message: `Berhasil memperbarui ekstrakurikuler dengan ID ${id}`,
      data: eskulUpdate,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: 'Gagal memperbarui data (ID tidak ditemukan)',
      error: error.message,
    });
  }
});

// DELETE: Menghapus data ekstrakurikuler berdasarkan ID (Dilindungi token)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.ekstrakurikuler.delete({
      where: { id_eskul: Number(id) }, // Menyesuaikan primary key di skema prisma kamu
    });

    res.json({
      success: true,
      message: `Berhasil menghapus ekstrakurikuler dengan ID ${id}`,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: 'Gagal menghapus data (ID tidak ditemukan)',
      error: error.message,
    });
  }
});

export default router;