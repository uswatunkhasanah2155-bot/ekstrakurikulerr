import express from 'express';
import fs from 'fs';
import path from 'path';
import prisma from '../../lib/prisma.js';
import { verifyToken } from '../../middleware/authMiddleware.js';
import { handleDownloadExcel } from './DownloadExcel.js';
import upload from '../../middleware/upload.js'; // Middleware multer untuk upload file

const router = express.Router();

// Helper: hapus file foto dari disk berdasarkan path relatif (misal /uploads/nama.jpeg)
function hapusFileFoto(fotoPath) {
  if (!fotoPath) return;
  const fullPath = path.join(process.cwd(), fotoPath);
  fs.unlink(fullPath, (err) => {
    if (err) console.error("Gagal menghapus file foto:", err.message);
  });
}

// GET: Mengambil semua data ekstrakurikuler
router.get('/', async (req, res) => {
  try {
    const eskul = await prisma.ekstrakurikuler.findMany({
      orderBy: { id_eskul: 'asc' },
    });
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

// ROUTE: Download Excel Rekap Peserta Ekstrakurikuler berdasarkan ID
router.get('/:id/download', handleDownloadExcel);

// ROUTE TAMBAHAN: Download Excel berdasarkan slug/nama
router.get('/slug/:slug/download', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const cleanSlug = slug.trim().toLowerCase();
    const eskul = await prisma.ekstrakurikuler.findFirst({
      where: {
        OR: [
          { slug: cleanSlug },
          { nama_eskul: { equals: slug.replace(/-/g, ' '), mode: 'insensitive' } }
        ]
      }
    });
    if (!eskul) {
      return res.status(404).json({ success: false, message: 'Ekstrakurikuler tidak ditemukan untuk di-download' });
    }
    req.params.id = eskul.id_eskul;
    return handleDownloadExcel(req, res, next);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal memproses download Excel',
      error: error.message,
    });
  }
});

// POST: Menambahkan data ekstrakurikuler baru dengan file upload (Dilindungi token)
router.post('/', verifyToken, upload.single('foto'), async (req, res) => {
  try {
    const { nama_eskul, deskripsi, pembina, jadwal } = req.body;
    if (!nama_eskul) {
      return res.status(400).json({ success: false, message: 'Nama ekstrakurikuler wajib diisi' });
    }
    const slug = nama_eskul.trim().toLowerCase().replace(/[\s%20]+/g, '-');

    // Jika ada file yang di-upload, simpan path relatifnya
    const fotoPath = req.file ? `/uploads/${req.file.filename}` : null;

    const eskulBaru = await prisma.ekstrakurikuler.create({
      data: {
        nama_eskul,
        slug,
        deskripsi: deskripsi || null,
        pembina: pembina || null,
        jadwal: jadwal || null,
        foto: fotoPath,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Berhasil menambahkan ekstrakurikuler baru',
      data: eskulBaru,
    });
  } catch (error) {
    console.error("ERROR DETAIL POST EKSKUL:", error);
    res.status(500).json({
      success: false,
      message: 'Gagal menambah data',
      error: error.message,
    });
  }
});

// PUT: Mengubah/Update data ekstrakurikuler dan file upload berdasarkan ID (Dilindungi token)
router.put('/:id', verifyToken, upload.single('foto'), async (req, res) => {
  try {
    const { id } = req.params;
    const idEskul = Number(id);

    if (isNaN(idEskul)) {
      return res.status(400).json({ success: false, message: 'ID ekstrakurikuler tidak valid' });
    }

    const { nama_eskul, deskripsi, pembina, jadwal } = req.body;
    const slug = nama_eskul ? nama_eskul.trim().toLowerCase().replace(/[\s%20]+/g, '-') : undefined;

    const updateData = {
      ...(nama_eskul && { nama_eskul }),
      ...(slug && { slug }),
      ...(deskripsi !== undefined && { deskripsi }),
      ...(pembina !== undefined && { pembina }),
      ...(jadwal !== undefined && { jadwal }),
    };

    // Jika user mengupload file foto baru saat update, hapus foto lama dari disk agar tidak numpuk
    if (req.file) {
      const eskulLama = await prisma.ekstrakurikuler.findUnique({
        where: { id_eskul: idEskul },
      });

      if (eskulLama?.foto) {
        hapusFileFoto(eskulLama.foto);
      }

      updateData.foto = `/uploads/${req.file.filename}`;
    }

    const eskulUpdate = await prisma.ekstrakurikuler.update({
      where: { id_eskul: idEskul },
      data: updateData,
    });

    res.json({
      success: true,
      message: `Berhasil memperbarui ekstrakurikuler dengan ID ${idEskul}`,
      data: eskulUpdate,
    });
  } catch (error) {
    console.error("ERROR DETAIL PUT EKSKUL:", error);
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
    const idEskul = Number(id);

    if (isNaN(idEskul)) {
      return res.status(400).json({ success: false, message: 'ID ekstrakurikuler tidak valid' });
    }

    // Ambil data dulu untuk tahu path foto sebelum record-nya dihapus
    const eskulCek = await prisma.ekstrakurikuler.findUnique({
      where: { id_eskul: idEskul },
    });

    await prisma.ekstrakurikuler.delete({
      where: { id_eskul: idEskul },
    });

    // Hapus juga file foto dari disk kalau ada
    if (eskulCek?.foto) {
      hapusFileFoto(eskulCek.foto);
    }

    res.json({
      success: true,
      message: `Berhasil menghapus ekstrakurikuler dengan ID ${idEskul}`,
    });
  } catch (error) {
    console.error("ERROR DETAIL DELETE EKSKUL:", error);
    res.status(404).json({
      success: false,
      message: 'Gagal menghapus data (ID tidak ditemukan)',
      error: error.message,
    });
  }
});

export default router;