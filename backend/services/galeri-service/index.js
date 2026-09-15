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


// ==================================================
// HELPER: OTORISASI GALERI
// ==================================================
// Aturan:
// - admin   -> boleh akses galeri eskul manapun
// - pembina -> boleh akses HANYA galeri eskul yang dia bina
// - role lain -> ditolak
//
// idEskulTarget = id_eskul yang mau diakses (dari body saat upload,
// atau dari data galeri yang sudah ada saat edit/hapus/set featured)
//
// Mengembalikan { allowed: boolean, statusCode, message }
async function cekAksesGaleri(req, idEskulTarget) {
  const userRole = (req.user.role || '').toLowerCase();

  if (userRole === 'admin') {
    return { allowed: true };
  }

  if (userRole === 'pembina') {
    let idEskulPembina = req.user.id_eskul;

    if (!idEskulPembina) {
      const userId = req.user.id_user || req.user.id;

      const userRecord = await prisma.user.findUnique({
        where: { id_user: Number(userId) },
        select: { id_eskul: true },
      });

      idEskulPembina = userRecord?.id_eskul;
    }

    if (!idEskulPembina) {
      return {
        allowed: false,
        statusCode: 403,
        message: 'Akun pembina ini tidak terhubung ke eskul manapun.',
      };
    }

    if (Number(idEskulPembina) !== Number(idEskulTarget)) {
      return {
        allowed: false,
        statusCode: 403,
        message: 'Anda hanya bisa mengelola galeri eskul yang Anda bina.',
      };
    }

    return { allowed: true };
  }

  return {
    allowed: false,
    statusCode: 403,
    message: 'Anda tidak memiliki akses untuk mengelola galeri ini.',
  };
}


// ==================================================
// GET: Mengambil semua foto galeri berdasarkan id_eskul
// ==================================================
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


// ==================================================
// POST: Upload banyak foto sekaligus ke galeri
// admin -> eskul manapun, pembina -> hanya eskul miliknya
// ==================================================
router.post('/', verifyToken, upload.array('foto', 20), async (req, res) => {
  try {
    const { id_eskul, keterangan } = req.body;

    if (!id_eskul) {
      return res.status(400).json({ success: false, message: 'ID Ekstrakurikuler wajib diisi!' });
    }

    // ---------------------------------------------
    // CEK OTORISASI
    // ---------------------------------------------
    const akses = await cekAksesGaleri(req, id_eskul);

    if (!akses.allowed) {
      return res.status(akses.statusCode).json({ success: false, message: akses.message });
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


// ==================================================
// PATCH: Menjadikan satu foto sebagai foto utama/unggulan eskul
// admin -> eskul manapun, pembina -> hanya eskul miliknya
// ==================================================
router.patch('/:id_galeri/featured', verifyToken, async (req, res) => {
  try {
    const { id_galeri } = req.params;

    const galeriTarget = await prisma.galeriEskul.findUnique({
      where: { id_galeri: Number(id_galeri) },
    });

    if (!galeriTarget) {
      return res.status(404).json({ success: false, message: 'Foto galeri tidak ditemukan' });
    }

    // ---------------------------------------------
    // CEK OTORISASI (berdasarkan id_eskul milik foto ini)
    // ---------------------------------------------
    const akses = await cekAksesGaleri(req, galeriTarget.id_eskul);

    if (!akses.allowed) {
      return res.status(akses.statusCode).json({ success: false, message: akses.message });
    }

    await prisma.$transaction([
      prisma.galeriEskul.updateMany({
        where: { id_eskul: galeriTarget.id_eskul },
        data: { is_featured: false },
      }),
      prisma.galeriEskul.update({
        where: { id_galeri: Number(id_galeri) },
        data: { is_featured: true },
      }),
    ]);

    res.json({
      success: true,
      message: 'Berhasil menjadikan foto ini sebagai foto utama',
    });
  } catch (error) {
    console.error("ERROR DETAIL SET FOTO UTAMA:", error);
    res.status(500).json({ success: false, message: 'Gagal mengatur foto utama', error: error.message });
  }
});


// ==================================================
// PUT: Mengedit foto galeri (ganti gambar dan/atau keterangan)
// admin -> eskul manapun, pembina -> hanya eskul miliknya
// ==================================================
router.put('/:id_galeri', verifyToken, upload.single('foto'), async (req, res) => {
  try {
    const { id_galeri } = req.params;
    const { keterangan } = req.body;

    const galeriCek = await prisma.galeriEskul.findUnique({
      where: { id_galeri: Number(id_galeri) },
    });

    if (!galeriCek) {
      return res.status(404).json({ success: false, message: 'Foto galeri tidak ditemukan' });
    }

    // ---------------------------------------------
    // CEK OTORISASI (berdasarkan id_eskul milik foto ini)
    // ---------------------------------------------
    const akses = await cekAksesGaleri(req, galeriCek.id_eskul);

    if (!akses.allowed) {
      return res.status(akses.statusCode).json({ success: false, message: akses.message });
    }

    const dataUpdate = {
      keterangan: keterangan !== undefined ? (keterangan || null) : galeriCek.keterangan,
    };

    // Kalau ada file foto baru, ganti path-nya
    if (req.file) {
      dataUpdate.foto = `uploads/galeri/${req.file.filename}`;
    }

    const hasilUpdate = await prisma.galeriEskul.update({
      where: { id_galeri: Number(id_galeri) },
      data: dataUpdate,
    });

    // Hapus file foto lama dari disk kalau memang diganti dengan yang baru
    if (req.file) {
      const filePathLama = path.join(process.cwd(), galeriCek.foto);
      if (fs.existsSync(filePathLama)) {
        fs.unlinkSync(filePathLama);
      }
    }

    res.json({
      success: true,
      message: 'Berhasil mengupdate foto galeri',
      data: hasilUpdate,
    });
  } catch (error) {
    console.error("ERROR DETAIL PUT GALERI:", error);
    res.status(500).json({ success: false, message: 'Gagal mengupdate foto galeri', error: error.message });
  }
});


// ==================================================
// DELETE: Menghapus satu foto galeri
// admin -> eskul manapun, pembina -> hanya eskul miliknya
// ==================================================
router.delete('/:id_galeri', verifyToken, async (req, res) => {
  try {
    const { id_galeri } = req.params;

    const galeriCek = await prisma.galeriEskul.findUnique({
      where: { id_galeri: Number(id_galeri) },
    });

    if (!galeriCek) {
      return res.status(404).json({ success: false, message: 'Foto galeri tidak ditemukan' });
    }

    // ---------------------------------------------
    // CEK OTORISASI (berdasarkan id_eskul milik foto ini)
    // ---------------------------------------------
    const akses = await cekAksesGaleri(req, galeriCek.id_eskul);

    if (!akses.allowed) {
      return res.status(akses.statusCode).json({ success: false, message: akses.message });
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