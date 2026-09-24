import express from 'express';
import prisma from '../../lib/prisma.js';
import { verifyToken } from '../../middleware/authMiddleware.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// ===============================
// FOLDER UPLOAD GALERI
// ===============================
const galeriDir = 'uploads/galeri/';

if (!fs.existsSync(galeriDir)) {
  fs.mkdirSync(galeriDir, { recursive: true });
}

// ===============================
// MULTER STORAGE
// ===============================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, galeriDir);
  },

  filename: (req, file, cb) => {
    const uniqueSuffix =
      Date.now() + '-' + Math.round(Math.random() * 1E9);

    cb(
      null,
      'galeri-' +
        uniqueSuffix +
        path.extname(file.originalname)
    );
  }
});

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
        // Hapus file yang sudah terupload jika eskul tidak ditemukan
        req.files.forEach((file) => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });

        return res.status(404).json({
          success: false,
          message: 'Ekstrakurikuler tidak ditemukan'
        });
      }

      const hasil = [];

      for (const file of req.files) {
        const data = await prisma.galeriEskul.create({
          data: {
            id_eskul,
            foto: `/uploads/galeri/${file.filename}`,
            keterangan: req.body.keterangan || null,
            kategori: req.body.kategori || 'Kegiatan'
          }
        });

        hasil.push(data);
      }

      res.status(201).json({
        success: true,
        message: 'Foto berhasil diupload',
        data: hasil
      });

    } catch (error) {
      console.error('Error upload galeri:', error);

      // Hapus file jika database gagal
      if (req.files) {
        req.files.forEach((file) => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }

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
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }

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

      // Jika ada foto baru
      if (req.file) {
        dataUpdate.foto =
          `/uploads/galeri/${req.file.filename}`;

        // Hapus foto lama
        const oldPath = path.join(
          process.cwd(),
          galeri.foto.replace(/^\/+/, '')
        );

        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      const updated = await prisma.galeriEskul.update({
        where: {
          id_galeri: id
        },
        data: dataUpdate
      });

      res.json({
        success: true,
        message: 'Data galeri berhasil diperbarui',
        data: updated
      });

    } catch (error) {
      console.error('Error update galeri:', error);

      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
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

    // Hapus file foto
    const filePath = path.join(
      process.cwd(),
      galeri.foto.replace(/^\/+/, '')
    );

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Hapus data database
    await prisma.galeriEskul.delete({
      where: {
        id_galeri: id
      }
    });

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