import express from 'express';
import prisma from '../../lib/prisma.js';
import { verifyToken } from '../../middleware/authMiddleware.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// ==================================================
// KONFIGURASI MULTER
// ==================================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/siswa/');
  },

  filename: (req, file, cb) => {
    const uniqueSuffix =
      Date.now() +
      '-' +
      Math.round(Math.random() * 1E9);

    cb(
      null,
      'siswa-' +
        uniqueSuffix +
        path.extname(file.originalname)
    );
  }
});

const upload = multer({ storage });

// ==================================================
// GET SEMUA SISWA
// ==================================================
router.get('/', verifyToken, async (req, res) => {
  try {
    const listSiswa =
      await prisma.siswa.findMany({
        include: {
          user: true,
          kelasData: true,
        },
        orderBy: {
          id_siswa: 'asc',
        },
      });

    res.json({
      success: true,
      message:
        'Berhasil mengambil data siswa',
      data: listSiswa,
    });

  } catch (error) {
    console.error(
      'ERROR GET SISWA:',
      error
    );

    res.status(500).json({
      success: false,
      message:
        'Gagal mengambil data siswa',
      error: error.message,
    });
  }
});

// ==================================================
// GET SISWA BERDASARKAN ID
// ==================================================
router.get(
  '/:id',
  verifyToken,
  async (req, res) => {
    try {
      const id =
        Number(req.params.id);

      const siswa =
        await prisma.siswa.findUnique({
          where: {
            id_siswa: id,
          },
          include: {
            user: true,
            kelasData: true,
          },
        });

      if (!siswa) {
        return res.status(404).json({
          success: false,
          message:
            'Data siswa tidak ditemukan',
        });
      }

      res.json({
        success: true,
        message:
          'Berhasil mengambil data siswa',
        data: siswa,
      });

    } catch (error) {
      console.error(
        'ERROR GET DETAIL SISWA:',
        error
      );

      res.status(500).json({
        success: false,
        message:
          'Gagal mengambil data siswa',
        error: error.message,
      });
    }
  }
);

// ==================================================
// TAMBAH SISWA
// ==================================================
router.post(
  '/',
  verifyToken,
  upload.single('foto'),
  async (req, res) => {
    try {
      const {
        nama_siswa,
        id_kelas,
        jenis_kelamin
      } = req.body;

      const userId =
        req.user.id_user ||
        req.user.id;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message:
            'ID User tidak ditemukan di dalam token. Coba login ulang!',
        });
      }

      if (
        !nama_siswa ||
        !id_kelas
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Nama Siswa dan Kelas wajib diisi!',
        });
      }

      // Pastikan kelas tersedia
      const kelasCek =
        await prisma.kelas.findUnique({
          where: {
            id_kelas:
              Number(id_kelas),
          },
        });

      if (!kelasCek) {
        return res.status(400).json({
          success: false,
          message:
            'Kelas tidak ditemukan!',
        });
      }

      const fotoPath =
        req.file
          ? `uploads/siswa/${req.file.filename}`
          : null;

      const siswaBaru =
        await prisma.siswa.create({
          data: {
            nama_siswa:
              nama_siswa.trim(),

            id_kelas:
              Number(id_kelas),

            jenis_kelamin:
              jenis_kelamin || 'L',

            id_user:
              Number(userId),

            foto: fotoPath,
          },

          include: {
            kelasData: true,
          },
        });

      res.status(201).json({
        success: true,
        message:
          'Berhasil menambahkan profil siswa',
        data: siswaBaru,
      });

    } catch (error) {
      console.error(
        'ERROR POST SISWA:',
        error
      );

      res.status(500).json({
        success: false,
        message:
          'Gagal menambah profil siswa',
        error: error.message,
      });
    }
  }
);

// ==================================================
// UPDATE SISWA
// ==================================================
router.put(
  '/:id',
  verifyToken,
  upload.single('foto'),
  async (req, res) => {
    try {
      const id =
        Number(req.params.id);

      const {
        nama_siswa,
        id_kelas,
        jenis_kelamin
      } = req.body;

      const siswaCek =
        await prisma.siswa.findUnique({
          where: {
            id_siswa: id,
          },
        });

      if (!siswaCek) {
        return res.status(404).json({
          success: false,
          message:
            'Data siswa tidak ditemukan',
        });
      }

      // Cek kelas jika id_kelas dikirim
      if (
        id_kelas !== undefined &&
        id_kelas !== ''
      ) {
        const kelasCek =
          await prisma.kelas.findUnique({
            where: {
              id_kelas:
                Number(id_kelas),
            },
          });

        if (!kelasCek) {
          return res.status(400).json({
            success: false,
            message:
              'Kelas tidak ditemukan!',
          });
        }
      }

      const fotoPath =
        req.file
          ? `uploads/siswa/${req.file.filename}`
          : undefined;

      const siswaUpdated =
        await prisma.siswa.update({
          where: {
            id_siswa: id,
          },

          data: {
            ...(nama_siswa !== undefined && {
              nama_siswa:
                nama_siswa.trim(),
            }),

            ...(id_kelas !== undefined &&
              id_kelas !== '' && {
                id_kelas:
                  Number(id_kelas),
              }),

            ...(jenis_kelamin !== undefined && {
              jenis_kelamin,
            }),

            ...(fotoPath && {
              foto: fotoPath,
            }),
          },

          include: {
            kelasData: true,
          },
        });

      res.json({
        success: true,
        message:
          'Berhasil mengupdate data siswa',
        data: siswaUpdated,
      });

    } catch (error) {
      console.error(
        'ERROR PUT SISWA:',
        error
      );

      res.status(500).json({
        success: false,
        message:
          'Gagal mengupdate data siswa',
        error: error.message,
      });
    }
  }
);

// ==================================================
// DELETE SISWA
// ==================================================
router.delete(
  '/:id',
  verifyToken,
  async (req, res) => {
    try {
      const siswaId =
        Number(req.params.id);

      const siswaCek =
        await prisma.siswa.findUnique({
          where: {
            id_siswa: siswaId,
          },
        });

      if (!siswaCek) {
        return res.status(404).json({
          success: false,
          message:
            'Data siswa tidak ditemukan',
        });
      }

      // Hapus seluruh pendaftaran siswa
      await prisma.pendaftaran.deleteMany({
        where: {
          id_siswa: siswaId,
        },
      });

      // Hapus data siswa
      await prisma.siswa.delete({
        where: {
          id_siswa: siswaId,
        },
      });

      res.json({
        success: true,
        message:
          'Berhasil menghapus data siswa beserta seluruh pendaftarannya',
      });

    } catch (error) {
      console.error(
        'ERROR DETAIL DELETE SISWA:',
        error
      );

      res.status(500).json({
        success: false,
        message:
          'Gagal menghapus data siswa',
        error: error.message,
      });
    }
  }
);

export default router;