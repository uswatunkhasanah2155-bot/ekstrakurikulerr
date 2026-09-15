import express from 'express';
import prisma from '../../lib/prisma.js';
import { verifyToken } from '../../middleware/authMiddleware.js';
import { handleDownloadExcelPendaftar } from './DownloadExcelPendaftar.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// ======================================================
// KONFIGURASI MULTER
// ======================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/siswa/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'siswa-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });


// ======================================================
// GET: MENGAMBIL SEMUA DATA PENDAFTARAN
// ======================================================

router.get('/', verifyToken, async (req, res) => {
  try {
    const listPendaftaran = await prisma.pendaftaran.findMany({
      include: {
        siswa: { include: { kelasData: true } },
        ekstrakurikuler: true,
      },
    });

    res.json({
      success: true,
      message: 'Berhasil mengambil data pendaftaran',
      data: listPendaftaran,
    });

  } catch (error) {
    console.error('ERROR DETAIL GET PENDAFTARAN:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data',
      error: error.message,
    });
  }
});


// ======================================================
// GET: DOWNLOAD EXCEL
// ======================================================

router.get('/download', verifyToken, handleDownloadExcelPendaftar);


// ======================================================
// POST: MENDAFTARKAN SISWA KE EKSTRAKURIKULER
// ======================================================

router.post(
  '/',
  verifyToken,
  upload.single('foto'),
  async (req, res) => {
    try {
      const {
        id_eskul,
        id_siswa_input,
        nama_siswa,
        id_kelas,
        jenis_kelamin
      } = req.body;

      let targetIdSiswa;
      const userId = req.user.id_user || req.user.id;
      const userRole = (req.user.role || '').toLowerCase();
      const isAdmin = userRole === 'admin';
      // "Staff" = admin ATAU pembina. Keduanya menambahkan siswa ATAS NAMA
      // orang lain, bukan mendaftarkan diri sendiri seperti siswa biasa.
      // Kalau hanya dicek isAdmin, pembina akan kejebak di jalur
      // "siswa mendaftarkan dirinya sendiri" dan siswa baru yang dia
      // tambahkan malah terikat ke akun pembina itu sendiri.
      const isStaff = isAdmin || userRole === 'pembina';

      if (!id_eskul) {
        return res.status(400).json({
          success: false,
          message: 'ID Ekstrakurikuler wajib diisi!',
        });
      }

      const fotoPath = req.file
        ? `uploads/siswa/${req.file.filename}`
        : null;

      // ==================================================
      // TAHAP 1: TENTUKAN targetIdSiswa
      // (belum ada write ke tabel siswa di tahap ini)
      // ==================================================

      let siswaProfilSudahAda = false; // dipakai utk opsi 2: kunci nama/kelas/gender

      if (id_siswa_input) {
        // ---- Admin memilih siswa yang sudah ada dari daftar ----
        targetIdSiswa = Number(id_siswa_input);

        const siswaCek = await prisma.siswa.findUnique({
          where: { id_siswa: targetIdSiswa },
        });

        if (!siswaCek) {
          return res.status(404).json({
            success: false,
            message: 'Data siswa tidak ditemukan!',
          });
        }

        siswaProfilSudahAda = true;

      } else if (!isStaff) {
        // ---- Siswa mendaftarkan dirinya sendiri ----

        let siswaExisting = await prisma.siswa.findUnique({
          where: { id_user: Number(userId) },
        });

        if (siswaExisting) {
          targetIdSiswa = siswaExisting.id_siswa;
          siswaProfilSudahAda = true;
        } else {
          // Profil belum ada -> wajib isi nama & kelas untuk membuat profil baru
          if (!nama_siswa || !id_kelas) {
            return res.status(400).json({
              success: false,
              message: 'Nama siswa dan kelas wajib diisi!',
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

          targetIdSiswa = null; // akan dibuat di Tahap 3
        }

      } else {
        // ---- Admin/Pembina menambahkan siswa baru manual ----
        if (!nama_siswa || !id_kelas) {
          return res.status(400).json({
            success: false,
            message: 'Nama siswa dan kelas wajib diisi!',
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

        const siswaAdmin = await prisma.siswa.findFirst({
          where: {
            nama_siswa: { equals: nama_siswa.trim(), mode: 'insensitive' },
            id_kelas: Number(id_kelas),
          },
        });

        targetIdSiswa = siswaAdmin ? siswaAdmin.id_siswa : null;
        siswaProfilSudahAda = !!siswaAdmin;
      }

      // ==================================================
      // TAHAP 2: CEK PENDAFTARAN DUPLIKAT
      // (dijalankan SEBELUM ada write apa pun ke tabel siswa)
      // ==================================================

      if (targetIdSiswa) {
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
      }

      // ==================================================
      // TAHAP 3: WRITE KE TABEL SISWA
      // (baru dijalankan setelah lolos cek duplikat)
      // ==================================================

      if (siswaProfilSudahAda) {
        // OPSI 2: profil siswa sudah ada -> nama_siswa, id_kelas, jenis_kelamin
        // TIDAK PERNAH ditimpa dari form pendaftaran eskul baru, apa pun yang
        // dikirim oleh client. Hanya foto yang boleh diperbarui.
        if (fotoPath) {
          await prisma.siswa.update({
            where: { id_siswa: targetIdSiswa },
            data: { foto: fotoPath },
          });
        }
      } else {
        // Profil belum ada sama sekali -> buat baru
        const siswaBaru = await prisma.siswa.create({
          data: {
            nama_siswa: nama_siswa.trim(),
            id_kelas: Number(id_kelas),
            jenis_kelamin: jenis_kelamin || 'L',
            id_user: isStaff ? null : Number(userId),
            foto: fotoPath,
          },
        });

        targetIdSiswa = siswaBaru.id_siswa;
      }

      // ==================================================
      // TAHAP 4: SIMPAN PENDAFTARAN
      // ==================================================

      const pendaftaranBaru = await prisma.pendaftaran.create({
        data: {
          id_siswa: Number(targetIdSiswa),
          id_eskul: Number(id_eskul),
        },
        include: {
          siswa: { include: { kelasData: true } },
          ekstrakurikuler: true,
        },
      });

      res.status(201).json({
        success: true,
        message: 'Berhasil mendaftar ekstrakurikuler',
        data: pendaftaranBaru,
      });

    } catch (error) {
      console.error('ERROR DETAIL POST PENDAFTARAN:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal melakukan pendaftaran',
        error: error.message,
      });
    }
  }
);


// ======================================================
// PUT: UPDATE PENDAFTARAN & DATA SISWA (tetap seperti semula
// -> ini jalur khusus admin/pembina lewat halaman kelola pendaftar)
// ======================================================

router.put(
  '/:id',
  verifyToken,
  upload.single('foto'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { id_eskul, nama_siswa, id_kelas, jenis_kelamin } = req.body;

      const pendaftaranCek = await prisma.pendaftaran.findUnique({
        where: { id_pendaftaran: Number(id) },
        include: { siswa: true },
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

      const fotoPath = req.file
        ? `uploads/siswa/${req.file.filename}`
        : null;

      if (
        pendaftaranCek.id_siswa &&
        (nama_siswa || id_kelas || jenis_kelamin || fotoPath)
      ) {
        if (id_kelas) {
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

        await prisma.siswa.update({
          where: { id_siswa: pendaftaranCek.id_siswa },
          data: {
            ...(nama_siswa && { nama_siswa: nama_siswa.trim() }),
            ...(id_kelas && { id_kelas: Number(id_kelas) }),
            ...(jenis_kelamin && { jenis_kelamin }),
            ...(fotoPath && { foto: fotoPath }),
          },
        });
      }

      const finalResult = await prisma.pendaftaran.findUnique({
        where: { id_pendaftaran: Number(id) },
        include: {
          siswa: { include: { kelasData: true } },
          ekstrakurikuler: true,
        },
      });

      res.json({
        success: true,
        message: 'Berhasil memperbarui pendaftaran',
        data: finalResult,
      });

    } catch (error) {
      console.error('ERROR DETAIL PUT PENDAFTARAN:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal memperbarui pendaftaran',
        error: error.message,
      });
    }
  }
);


// ======================================================
// DELETE: HAPUS PENDAFTARAN
// ======================================================

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
    console.error('ERROR DETAIL DELETE PENDAFTARAN:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal membatalkan pendaftaran',
      error: error.message,
    });
  }
});

export default router;