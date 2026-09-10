import express from 'express';
import prisma from '../../lib/prisma.js';
import { verifyToken } from '../../middleware/authMiddleware.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Pastikan folder uploads/galeri ada
const galeriDir = 'uploads/galeri/';
if (!fs.existsSync(galeriDir)) {
  fs.mkdirSync(galeriDir, { recursive: true });
}

// Konfigurasi Multer untuk menyimpan foto galeri ke folder 'uploads/galeri'
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, galeriDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'galeri-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// GET: Mengambil semua foto galeri berdasarkan id_eskul
router.get('/:id_eskul', async (req, res) => {
  try {
    const { id_eskul } = req.params;

    const listGaleri = await prisma.galeriEskul.findMany({
      where: { id_eskul: Number(id_eskul) },
      orderBy: { created_at: 'desc' },
    });

    res.json({
      success: true,
      message: 'Berhasil mengambil data galeri',
      data: listGaleri,
    });
  } catch (error) {
    console.error("ERROR DETAIL GET GALERI:", error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data galeri', error: error.message });
  }
});

// POST: Upload banyak foto sekaligus ke galeri (khusus admin)
router.post('/', verifyToken, upload.array('foto', 20), async (req, res) => {
  try {
    const userRole = (req.user.role || '').toLowerCase();
    if (userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Hanya admin yang boleh upload foto galeri' });
    }

    const { id_eskul, keterangan } = req.body;

    if (!id_eskul) {
      return res.status(400).json({ success: false, message: 'ID Ekstrakurikuler wajib diisi!' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Minimal upload 1 foto!' });
    }

    const dataToInsert = req.files.map((file) => ({
      id_eskul: Number(id_eskul),
      foto: `uploads/galeri/${file.filename}`,
      keterangan: keterangan || null,
    }));

    await prisma.galeriEskul.createMany({
      data: dataToInsert,
    });

    const hasilTerbaru = await prisma.galeriEskul.findMany({
      where: { id_eskul: Number(id_eskul) },
      orderBy: { created_at: 'desc' },
    });

    res.status(201).json({
      success: true,
      message: `Berhasil upload ${req.files.length} foto ke galeri`,
      data: hasilTerbaru,
    });
  } catch (error) {
    console.error("ERROR DETAIL POST GALERI:", error);
    res.status(500).json({ success: false, message: 'Gagal upload foto galeri', error: error.message });
  }
});

// DELETE: Menghapus satu foto galeri (khusus admin)
router.delete('/:id_galeri', verifyToken, async (req, res) => {
  try {
    const userRole = (req.user.role || '').toLowerCase();
    if (userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Hanya admin yang boleh menghapus foto galeri' });
    }

    const { id_galeri } = req.params;

    const galeriCek = await prisma.galeriEskul.findUnique({
      where: { id_galeri: Number(id_galeri) },
    });

    if (!galeriCek) {
      return res.status(404).json({ success: false, message: 'Foto galeri tidak ditemukan' });
    }

    await prisma.galeriEskul.delete({
      where: { id_galeri: Number(id_galeri) },
    });

    // Hapus file fisik dari folder uploads
    const filePath = path.join(process.cwd(), galeriCek.foto);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({
      success: true,
      message: 'Berhasil menghapus foto galeri',
    });
  } catch (error) {
    console.error("ERROR DETAIL DELETE GALERI:", error);
    res.status(500).json({ success: false, message: 'Gagal menghapus foto galeri', error: error.message });
  }
});

export default router;