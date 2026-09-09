import express from 'express';
import prisma from '../../lib/prisma.js';
import { verifyToken } from '../../middleware/authMiddleware.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Konfigurasi Multer untuk menyimpan foto ke folder 'uploads/siswa'
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/siswa/'); 
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'siswa-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

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

router.post('/', verifyToken, upload.single('foto'), async (req, res) => {
  try {
    const { nama_siswa, kelas, jenis_kelamin } = req.body;
    const userId = req.user.id_user || req.user.id; 

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'ID User tidak ditemukan di dalam token. Coba login ulang!',
      });
    }

    if (!nama_siswa || !kelas) {
      return res.status(400).json({
        success: false,
        message: 'Nama Siswa dan Kelas wajib diisi!',
      });
    }

    const fotoPath = req.file ? `uploads/siswa/${req.file.filename}` : null;

    const siswaBaru = await prisma.siswa.create({
      data: {
        nama_siswa,
        kelas,
        jenis_kelamin,
        id_user: userId,
        foto: fotoPath,
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

router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_siswa, kelas, jenis_kelamin } = req.body;

    const siswaCek = await prisma.siswa.findUnique({
      where: { id_siswa: Number(id) },
    });

    if (!siswaCek) {
      return res.status(404).json({
        success: false,
        message: 'Data siswa tidak ditemukan',
      });
    }

    const siswaUpdated = await prisma.siswa.update({
      where: { id_siswa: Number(id) },
      data: {
        nama_siswa: nama_siswa !== undefined ? nama_siswa : siswaCek.nama_siswa,
        kelas: kelas !== undefined ? kelas : siswaCek.kelas,
        jenis_kelamin: jenis_kelamin !== undefined ? jenis_kelamin : siswaCek.jenis_kelamin,
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

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const siswaId = Number(id);

    const siswaCek = await prisma.siswa.findUnique({
      where: { id_siswa: siswaId },
    });

    if (!siswaCek) {
      return res.status(404).json({
        success: false,
        message: 'Data siswa tidak ditemukan',
      });
    }

    await prisma.pendaftaran.deleteMany({
      where: { id_siswa: siswaId },
    });

    await prisma.siswa.delete({
      where: { id_siswa: siswaId },
    });

    res.json({
      success: true,
      message: 'Berhasil menghapus data siswa beserta seluruh pendaftarannya',
    });
  } catch (error) {
    console.error("ERROR DETAIL DELETE SISWA:", error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus data siswa',
      error: error.message,
    });
  }
});

export default router;