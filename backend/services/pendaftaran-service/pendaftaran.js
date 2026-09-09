import express from 'express';
import prisma from '../../lib/prisma.js';
import { verifyToken } from '../../middleware/authMiddleware.js';
import { handleDownloadExcelPendaftar } from './DownloadExcelPendaftar.js';
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

// GET: Mengambil semua data pendaftaran
router.get('/', verifyToken, async (req, res) => {
  try {
    const listPendaftaran = await prisma.pendaftaran.findMany({
      include: {
        siswa: true,
        ekstrakurikuler: true,
      },
    });
    res.json({
      success: true,
      message: 'Berhasil mengambil data pendaftaran',
      data: listPendaftaran,
    });
  } catch (error) {
    console.error("ERROR DETAIL GET PENDAFTARAN:", error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data', error: error.message });
  }
});

// GET: Download Excel rekap semua siswa pendaftar (lintas eskul)
router.get('/download', verifyToken, handleDownloadExcelPendaftar);

// POST: Mendaftarkan siswa ke ekstrakurikuler (Mendukung Upload Foto + Siswa/Admin)
router.post('/', verifyToken, upload.single('foto'), async (req, res) => {
  try {
    const { id_eskul, id_siswa_input, nama_siswa, kelas, jenis_kelamin } = req.body;
    let targetIdSiswa;

    const userId = req.user.id_user || req.user.id;
    const userRole = (req.user.role || '').toLowerCase();
    const isAdmin = userRole === 'admin';

    if (!id_eskul) {
      return res.status(400).json({ success: false, message: 'ID Ekstrakurikuler wajib diisi!' });
    }

    const fotoPath = req.file ? `uploads/siswa/${req.file.filename}` : null;

    if (id_siswa_input) {
      targetIdSiswa = Number(id_siswa_input);
      if (fotoPath) {
        await prisma.siswa.update({
          where: { id_siswa: targetIdSiswa },
          data: { foto: fotoPath }
        });
      }
    } else if (!isAdmin) {
      if (!nama_siswa || !kelas) {
        return res.status(400).json({
          success: false,
          message: 'Nama siswa dan kelas wajib diisi!',
        });
      }

      let siswaExisting = await prisma.siswa.findUnique({
        where: { id_user: Number(userId) },
      });

      if (siswaExisting) {
        targetIdSiswa = siswaExisting.id_siswa;
        if (fotoPath) {
          await prisma.siswa.update({
            where: { id_siswa: siswaExisting.id_siswa },
            data: { foto: fotoPath }
          });
        }
      } else {
        const siswaBaru = await prisma.siswa.create({
          data: {
            nama_siswa: nama_siswa.trim(),
            kelas: kelas,
            jenis_kelamin: jenis_kelamin || 'L',
            id_user: Number(userId),
            foto: fotoPath,
          },
        });
        targetIdSiswa = siswaBaru.id_siswa;
      }
    }

    if (isAdmin) {
      if (!nama_siswa || !kelas) {
        return res.status(400).json({
          success: false,
          message: 'Nama siswa dan kelas wajib diisi oleh admin!',
        });
      }

      let siswaAdmin = await prisma.siswa.findFirst({
        where: {
          nama_siswa: { equals: nama_siswa.trim(), mode: 'insensitive' },
          kelas: { equals: kelas.trim(), mode: 'insensitive' },
        },
      });

      if (siswaAdmin) {
        targetIdSiswa = siswaAdmin.id_siswa;
        if (fotoPath) {
          await prisma.siswa.update({
            where: { id_siswa: siswaAdmin.id_siswa },
            data: { foto: fotoPath }
          });
        }
      } else {
        const siswaBaru = await prisma.siswa.create({
          data: {
            nama_siswa: nama_siswa.trim(),
            kelas: kelas.trim(),
            jenis_kelamin: jenis_kelamin || 'L',
            id_user: null,
            foto: fotoPath,
          },
        });
        targetIdSiswa = siswaBaru.id_siswa;
      }
    }

    const existingRegistration = await prisma.pendaftaran.findFirst({
      where: {
        id_siswa: Number(targetIdSiswa),
        id_eskul: Number(id_eskul),
      },
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'Siswa sudah terdaftar di ekstrakurikuler ini!',
      });
    }

    const pendaftaranBaru = await prisma.pendaftaran.create({
      data: {
        id_siswa: Number(targetIdSiswa),
        id_eskul: Number(id_eskul),
      },
      include: {
        siswa: true,
        ekstrakurikuler: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Berhasil mendaftar ekstrakurikuler',
      data: pendaftaranBaru,
    });
  } catch (error) {
    console.error("ERROR DETAIL POST PENDAFTARAN:", error);
    res.status(500).json({ success: false, message: 'Gagal melakukan pendaftaran', error: error.message });
  }
});

// PUT: Memperbarui data pendaftaran & profil siswa (Ditambahkan upload.single('foto'))
router.put('/:id', verifyToken, upload.single('foto'), async (req, res) => {
  try {
    const { id } = req.params;
    const { id_eskul, nama_siswa, kelas, jenis_kelamin } = req.body;

    const pendaftaranCek = await prisma.pendaftaran.findUnique({
      where: { id_pendaftaran: Number(id) },
      include: { siswa: true }
    });

    if (!pendaftaranCek) {
      return res.status(404).json({
        success: false,
        message: 'Data pendaftaran tidak ditemukan',
      });
    }

    if (id_eskul) {
      await prisma.pendaftaran.update({
        where: { id_pendaftaran: Number(id) },
        data: { id_eskul: Number(id_eskul) },
      });
    }

    const fotoPath = req.file ? `uploads/siswa/${req.file.filename}` : null;

    if (pendaftaranCek.id_siswa && (nama_siswa || kelas || jenis_kelamin || fotoPath)) {
      await prisma.siswa.update({
        where: { id_siswa: pendaftaranCek.id_siswa },
        data: {
          ...(nama_siswa && { nama_siswa: nama_siswa.trim() }),
          ...(kelas && { kelas }),
          ...(jenis_kelamin && { jenis_kelamin }),
          ...(fotoPath && { foto: fotoPath }),
        },
      });
    }

    const finalResult = await prisma.pendaftaran.findUnique({
      where: { id_pendaftaran: Number(id) },
      include: {
        siswa: true,
        ekstrakurikuler: true,
      },
    });

    res.json({
      success: true,
      message: 'Berhasil memperbarui pendaftaran',
      data: finalResult,
    });
  } catch (error) {
    console.error("ERROR DETAIL PUT PENDAFTARAN:", error);
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui pendaftaran',
      error: error.message,
    });
  }
});

// DELETE: Membatalkan/menghapus pendaftaran (dan siswa jika sudah tidak terdaftar di eskul manapun)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const pendaftaranCek = await prisma.pendaftaran.findUnique({
      where: { id_pendaftaran: Number(id) },
    });

    if (!pendaftaranCek) {
      return res.status(404).json({
        success: false,
        message: 'Data pendaftaran tidak ditemukan',
      });
    }

    const idSiswa = pendaftaranCek.id_siswa;

    await prisma.$transaction(async (tx) => {
      await tx.pendaftaran.delete({
        where: { id_pendaftaran: Number(id) },
      });

      if (idSiswa) {
        const pendaftaranLain = await tx.pendaftaran.count({
          where: { id_siswa: idSiswa },
        });

        if (pendaftaranLain === 0) {
          await tx.siswa.delete({
            where: { id_siswa: idSiswa },
          });
        }
      }
    });

    res.json({
      success: true,
      message: 'Berhasil membatalkan pendaftaran ekstrakurikuler',
    });
  } catch (error) {
    console.error("ERROR DETAIL DELETE PENDAFTARAN:", error);
    res.status(500).json({
      success: false,
      message: 'Gagal membatalkan pendaftaran',
      error: error.message,
    });
  }
});

export default router;