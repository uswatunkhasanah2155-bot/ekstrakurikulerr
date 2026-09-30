import express from 'express';
import prisma from '../../lib/prisma.js';
import { verifyToken } from '../../middleware/authMiddleware.js';
import multer from 'multer';
import path from 'path';
import { uploadFoto, hapusFoto } from '../../lib/cloudinary.js';

const router = express.Router();

// ===============================
// MULTER STORAGE
// File ditahan di memori lalu dikirim ke Cloudinary
// ===============================
const storage = multer.memoryStorage();

// ===============================
// VALIDASI FILE
// ===============================
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp'
  ];

  const allowedExtensions = [
    '.jpg',
    '.jpeg',
    '.png',
    '.webp'
  ];

  const extension = path
    .extname(file.originalname)
    .toLowerCase();

  if (
    allowedMimeTypes.includes(file.mimetype) &&
    allowedExtensions.includes(extension)
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'File harus berupa gambar JPG, JPEG, PNG, atau WEBP!'
      ),
      false
    );
  }
};

// ===============================
// MULTER UPLOAD
// ===============================
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2 MB
  }
});

// ===============================
// GET GALERI BERDASARKAN ESKUL
// ===============================
router.get('/:id_eskul', verifyToken, async (req, res) => {
  try {
    const id_eskul = Number(req.params.id_eskul);

    if (isNaN(id_eskul)) {
      return res.status(400).json({
        success: false,
        message: 'ID ekstrakurikuler tidak valid'
      });
    }

    const galeri = await prisma.galeriEskul.findMany({
      where: {
        id_eskul
      },
      orderBy: [
        {
          is_featured: 'desc'
        },
        {
          created_at: 'desc'
        }
      ]
    });

    res.json({
      success: true,
      data: galeri
    });

  } catch (error) {
    console.error('Error get galeri:', error);

    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data galeri'
    });
  }
});

// ===============================
// TAMBAH FOTO GALERI
// ===============================
router.post(
  '/:id_eskul',
  verifyToken,
  upload.array('foto', 20),
  async (req, res) => {
    try {
      const id_eskul = Number(req.params.id_eskul);

      if (isNaN(id_eskul)) {
        return res.status(400).json({
          success: false,
          message: 'ID ekstrakurikuler tidak valid'
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Tidak ada foto yang diupload'
        });
      }

      // Pastikan eskul ada
      const eskul = await prisma.ekstrakurikuler.findUnique({
        where: {
          id_eskul
        }
      });

      if (!eskul) {
        return res.status(404).json({
          success: false,
          message: 'Ekstrakurikuler tidak ditemukan'
        });
      }

      // Upload semua foto ke Cloudinary, lalu simpan path-nya di database
      const fotoBaru = [];
      let hasil = [];

      try {
        for (const file of req.files) {
          fotoBaru.push(await uploadFoto(file, 'galeri'));
        }

        hasil = await prisma.$transaction(
          fotoBaru.map((foto) =>
            prisma.galeriEskul.create({
              data: {
                id_eskul,
                foto,
                keterangan: req.body.keterangan || null
              }
            })
          )
        );
      } catch (err) {
        // Kalau ada yang gagal, foto yang sudah terlanjur diupload dibersihkan
        await Promise.all(fotoBaru.map((f) => hapusFoto(f)));
        throw err;
      }

      res.status(201).json({
        success: true,
        message: 'Foto berhasil diupload',
        data: hasil
      });

    } catch (error) {
      console.error('Error upload galeri:', error);

      res.status(500).json({
        success: false,
        message: 'Gagal mengupload foto'
      });
    }
  }
);

// ===============================
// UPDATE FOTO / KETERANGAN
// ===============================
router.put(
  '/:id',
  verifyToken,
  upload.single('foto'),
  async (req, res) => {
    let fotoBaru = null;

    try {
      const id = Number(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID galeri tidak valid'
        });
      }

      const galeri = await prisma.galeriEskul.findUnique({
        where: {
          id_galeri: id
        }
      });

      if (!galeri) {
        return res.status(404).json({
          success: false,
          message: 'Data galeri tidak ditemukan'
        });
      }

      const dataUpdate = {};

      if (req.body.keterangan !== undefined) {
        dataUpdate.keterangan =
          req.body.keterangan || null;
      }

      // Jika ada foto baru: upload ke Cloudinary
      if (req.file) {
        fotoBaru = await uploadFoto(req.file, 'galeri');
        dataUpdate.foto = fotoBaru;
      }

      const updated = await prisma.galeriEskul.update({
        where: {
          id_galeri: id
        },
        data: dataUpdate
      });

      // Foto lama dihapus setelah database berhasil diperbarui
      if (fotoBaru) {
        await hapusFoto(galeri.foto);
      }

      res.json({
        success: true,
        message: 'Data galeri berhasil diperbarui',
        data: updated
      });

    } catch (error) {
      console.error('Error update galeri:', error);

      // Database gagal: buang foto baru yang sudah terlanjur diupload
      if (fotoBaru) {
        await hapusFoto(fotoBaru);
      }

      res.status(500).json({
        success: false,
        message: 'Gagal memperbarui data galeri'
      });
    }
  }
);

// ===============================
// HAPUS FOTO GALERI
// ===============================
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID galeri tidak valid'
      });
    }

    const galeri = await prisma.galeriEskul.findUnique({
      where: {
        id_galeri: id
      }
    });

    if (!galeri) {
      return res.status(404).json({
        success: false,
        message: 'Data galeri tidak ditemukan'
      });
    }

    // Hapus data database
    await prisma.galeriEskul.delete({
      where: {
        id_galeri: id
      }
    });

    // Hapus file foto (Cloudinary, atau folder uploads untuk data lama)
    await hapusFoto(galeri.foto);

    res.json({
      success: true,
      message: 'Foto galeri berhasil dihapus'
    });

  } catch (error) {
    console.error('Error hapus galeri:', error);

    res.status(500).json({
      success: false,
      message: 'Gagal menghapus foto galeri'
    });
  }
});

// ===============================
// SET FOTO UTAMA
// ===============================
router.patch(
  '/:id/featured',
  verifyToken,
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID galeri tidak valid'
        });
      }

      const galeri = await prisma.galeriEskul.findUnique({
        where: {
          id_galeri: id
        }
      });

      if (!galeri) {
        return res.status(404).json({
          success: false,
          message: 'Data galeri tidak ditemukan'
        });
      }

      // Jadikan semua foto dalam eskul ini bukan foto utama
      await prisma.galeriEskul.updateMany({
        where: {
          id_eskul: galeri.id_eskul
        },
        data: {
          is_featured: false
        }
      });

      // Jadikan foto yang dipilih sebagai foto utama
      const updated = await prisma.galeriEskul.update({
        where: {
          id_galeri: id
        },
        data: {
          is_featured: true
        }
      });

      res.json({
        success: true,
        message: 'Foto utama berhasil diubah',
        data: updated
      });

    } catch (error) {
      console.error('Error set foto utama:', error);

      res.status(500).json({
        success: false,
        message: 'Gagal mengubah foto utama'
      });
    }
  }
);

// ===============================
// ERROR HANDLER MULTER
// ===============================
router.use((err, req, res, next) => {
  console.error('Multer error:', err);

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Ukuran file maksimal 2 MB!'
      });
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Jumlah atau nama file tidak sesuai!'
      });
    }

    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  next();
});

export default router;