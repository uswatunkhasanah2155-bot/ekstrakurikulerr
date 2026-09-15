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
      Date.now() + '-' + Math.round(Math.random() * 1E9);

    cb(
      null,
      'siswa-' + uniqueSuffix + path.extname(file.originalname)
    );
  }
});

const upload = multer({ storage });


// ==================================================
// HELPER: OTORISASI EDIT/HAPUS SISWA
// ==================================================
// Aturan:
// - admin        -> boleh akses siswa manapun
// - pembina      -> boleh akses siswa HANYA jika siswa itu terdaftar
//                   (punya row pendaftaran) di eskul milik pembina tsb
// - role lain     -> ditolak (403)
//
// Mengembalikan { allowed: boolean, statusCode, message }
async function cekAksesEditSiswa(req, targetIdSiswa) {
  const userRole = (req.user.role || '').toLowerCase();

  if (userRole === 'admin') {
    return { allowed: true };
  }

  if (userRole === 'pembina') {
    // Ambil id_eskul milik pembina.
    // Coba dari payload token dulu; kalau tidak ada, fallback query DB.
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

    // Cek apakah siswa target terdaftar di eskul milik pembina ini
    const pendaftaranDiEskulIni = await prisma.pendaftaran.findFirst({
      where: {
        id_siswa: Number(targetIdSiswa),
        id_eskul: Number(idEskulPembina),
      },
    });

    if (!pendaftaranDiEskulIni) {
      return {
        allowed: false,
        statusCode: 403,
        message: 'Anda hanya bisa mengelola siswa yang terdaftar di eskul Anda.',
      };
    }

    return { allowed: true };
  }

  // Role lain (misalnya siswa biasa) tidak diizinkan sama sekali
  return {
    allowed: false,
    statusCode: 403,
    message: 'Anda tidak memiliki akses untuk mengubah data siswa ini.',
  };
}


// ==================================================
// GET SEMUA SISWA
// ==================================================
router.get('/', verifyToken, async (req, res) => {
  try {
    const listSiswa = await prisma.siswa.findMany({
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
      message: 'Berhasil mengambil data siswa',
      data: listSiswa,
    });

  } catch (error) {
    console.error('ERROR GET SISWA:', error);

    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data siswa',
      error: error.message,
    });
  }
});


// ==================================================
// GET PROFIL SISWA MILIK AKUN YANG SEDANG LOGIN
// (harus di atas route GET /:id agar "me" tidak ketangkep sebagai :id)
// ==================================================
router.get('/me', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id_user || req.user.id;

    const siswa = await prisma.siswa.findUnique({
      where: { id_user: Number(userId) },
      include: { kelasData: true },
    });

    if (!siswa) {
      return res.status(404).json({
        success: false,
        message: 'Profil siswa belum dibuat',
      });
    }

    res.json({
      success: true,
      message: 'Berhasil mengambil profil siswa',
      data: siswa,
    });

  } catch (error) {
    console.error('ERROR GET PROFIL SISWA SAYA:', error);

    res.status(500).json({
      success: false,
      message: 'Gagal mengambil profil siswa',
      error: error.message,
    });
  }
});


// ==================================================
// GET SISWA BERDASARKAN ID
// ==================================================
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const id = Number(req.params.id);

    const siswa = await prisma.siswa.findUnique({
      where: { id_siswa: id },
      include: {
        user: true,
        kelasData: true,
      },
    });

    if (!siswa) {
      return res.status(404).json({
        success: false,
        message: 'Data siswa tidak ditemukan',
      });
    }

    res.json({
      success: true,
      message: 'Berhasil mengambil data siswa',
      data: siswa,
    });

  } catch (error) {
    console.error('ERROR GET DETAIL SISWA:', error);

    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data siswa',
      error: error.message,
    });
  }
});


// ==================================================
// TAMBAH SISWA (self-registration oleh akun siswa sendiri)
// ==================================================
router.post(
  '/',
  verifyToken,
  upload.single('foto'),
  async (req, res) => {
    try {
      const { nama_siswa, id_kelas, jenis_kelamin } = req.body;
      const userId = req.user.id_user || req.user.id;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'ID User tidak ditemukan di dalam token. Coba login ulang!',
        });
      }

      if (!nama_siswa || !id_kelas) {
        return res.status(400).json({
          success: false,
          message: 'Nama Siswa dan Kelas wajib diisi!',
        });
      }

      const kelasCek = await prisma.kelas.findUnique({
        where: { id_kelas: Number(id_kelas) },
      });

      if (!kelasCek) {
        return res.status(400).json({
          success: false,
          message: 'Kelas tidak ditemukan!',
        });
      }

      const fotoPath = req.file
        ? `uploads/siswa/${req.file.filename}`
        : null;

      const siswaBaru = await prisma.siswa.create({
        data: {
          nama_siswa: nama_siswa.trim(),
          id_kelas: Number(id_kelas),
          jenis_kelamin: jenis_kelamin || 'L',
          id_user: Number(userId),
          foto: fotoPath,
        },
        include: { kelasData: true },
      });

      res.status(201).json({
        success: true,
        message: 'Berhasil menambahkan profil siswa',
        data: siswaBaru,
      });

    } catch (error) {
      console.error('ERROR POST SISWA:', error);

      res.status(500).json({
        success: false,
        message: 'Gagal menambah profil siswa',
        error: error.message,
      });
    }
  }
);


// ==================================================
// UPDATE SISWA
// Hanya admin, atau pembina utk siswa di eskul-nya sendiri
// ==================================================
router.put(
  '/:id',
  verifyToken,
  upload.single('foto'),
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { nama_siswa, id_kelas, jenis_kelamin } = req.body;

      const siswaCek = await prisma.siswa.findUnique({
        where: { id_siswa: id },
      });

      if (!siswaCek) {
        return res.status(404).json({
          success: false,
          message: 'Data siswa tidak ditemukan',
        });
      }

      // ---------------------------------------------
      // CEK OTORISASI
      // ---------------------------------------------
      const akses = await cekAksesEditSiswa(req, id);

      if (!akses.allowed) {
        return res.status(akses.statusCode).json({
          success: false,
          message: akses.message,
        });
      }

      // Cek kelas jika id_kelas dikirim
      if (id_kelas !== undefined && id_kelas !== '') {
        const kelasCek = await prisma.kelas.findUnique({
          where: { id_kelas: Number(id_kelas) },
        });

        if (!kelasCek) {
          return res.status(400).json({
            success: false,
            message: 'Kelas tidak ditemukan!',
          });
        }
      }

      const fotoPath = req.file
        ? `uploads/siswa/${req.file.filename}`
        : undefined;

      const siswaUpdated = await prisma.siswa.update({
        where: { id_siswa: id },
        data: {
          ...(nama_siswa !== undefined && {
            nama_siswa: nama_siswa.trim(),
          }),
          ...(id_kelas !== undefined && id_kelas !== '' && {
            id_kelas: Number(id_kelas),
          }),
          ...(jenis_kelamin !== undefined && { jenis_kelamin }),
          ...(fotoPath && { foto: fotoPath }),
        },
        include: { kelasData: true },
      });

      res.json({
        success: true,
        message: 'Berhasil mengupdate data siswa',
        data: siswaUpdated,
      });

    } catch (error) {
      console.error('ERROR PUT SISWA:', error);

      res.status(500).json({
        success: false,
        message: 'Gagal mengupdate data siswa',
        error: error.message,
      });
    }
  }
);


// ==================================================
// DELETE SISWA
// Hanya admin, atau pembina utk siswa di eskul-nya sendiri
// ==================================================
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const siswaId = Number(req.params.id);

    const siswaCek = await prisma.siswa.findUnique({
      where: { id_siswa: siswaId },
    });

    if (!siswaCek) {
      return res.status(404).json({
        success: false,
        message: 'Data siswa tidak ditemukan',
      });
    }

    // ---------------------------------------------
    // CEK OTORISASI
    // ---------------------------------------------
    const akses = await cekAksesEditSiswa(req, siswaId);

    if (!akses.allowed) {
      return res.status(akses.statusCode).json({
        success: false,
        message: akses.message,
      });
    }

    // Hapus seluruh pendaftaran siswa
    await prisma.pendaftaran.deleteMany({
      where: { id_siswa: siswaId },
    });

    // Hapus data siswa
    await prisma.siswa.delete({
      where: { id_siswa: siswaId },
    });

    res.json({
      success: true,
      message: 'Berhasil menghapus data siswa beserta seluruh pendaftarannya',
    });

  } catch (error) {
    console.error('ERROR DETAIL DELETE SISWA:', error);

    res.status(500).json({
      success: false,
      message: 'Gagal menghapus data siswa',
      error: error.message,
    });
  }
});

export default router;