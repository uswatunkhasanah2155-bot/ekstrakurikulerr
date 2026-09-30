import express from 'express';
import prisma from '../../lib/prisma.js';
import { verifyToken } from '../../middleware/authMiddleware.js';
import { handleDownloadExcel } from './DownloadExcel.js';
import upload from '../../middleware/upload.js'; // Middleware multer untuk upload file
import { uploadFoto, hapusFoto } from '../../lib/cloudinary.js';

const router = express.Router();

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

    // Jika ada file, upload ke Cloudinary dan simpan path-nya (contoh: eskul/eskul-123.png)
    const fotoPath = req.file ? await uploadFoto(req.file, 'eskul') : null;

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

    // BARU: Validasi kepemilikan untuk role Pembina
    const userRole = (req.user.role || '').toLowerCase();
    if (userRole === 'pembina' && Number(req.user.id_eskul) !== idEskul) {
      return res.status(403).json({ success: false, message: 'Anda hanya boleh mengedit ekstrakurikuler yang Anda bina.' });
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

    // Jika ada foto baru: upload dulu, foto lama dihapus setelah database berhasil diperbarui
    let fotoLama = null;
    if (req.file) {
      const eskulLama = await prisma.ekstrakurikuler.findUnique({
        where: { id_eskul: idEskul },
      });

      fotoLama = eskulLama?.foto || null;
      updateData.foto = await uploadFoto(req.file, 'eskul');
    }

    const eskulUpdate = await prisma.ekstrakurikuler.update({
      where: { id_eskul: idEskul },
      data: updateData,
    });

    if (fotoLama) {
      await hapusFoto(fotoLama);
    }

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

    // BARU: Pembina sama sekali tidak boleh menghapus eskul
    const userRole = (req.user.role || '').toLowerCase();
    if (userRole === 'pembina') {
      return res.status(403).json({ success: false, message: 'Pembina tidak memiliki akses untuk menghapus ekstrakurikuler.' });
    }

    // Ambil data dulu untuk tahu path foto sebelum record-nya dihapus
    const eskulCek = await prisma.ekstrakurikuler.findUnique({
      where: { id_eskul: idEskul },
    });

    // Foto galeri ikut terhapus di database (cascade), jadi catat pathnya dulu
    const galeriEskul = await prisma.galeriEskul.findMany({
      where: { id_eskul: idEskul },
      select: { foto: true },
    });

    await prisma.ekstrakurikuler.delete({
      where: { id_eskul: idEskul },
    });

    // Hapus juga file foto (logo + galeri) kalau ada
    if (eskulCek?.foto) {
      await hapusFoto(eskulCek.foto);
    }
    await Promise.all(galeriEskul.map((g) => hapusFoto(g.foto)));

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