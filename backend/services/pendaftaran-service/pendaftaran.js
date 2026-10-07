import express from 'express';
import prisma from '../../lib/prisma.js';
import { verifyToken } from '../../middleware/authMiddleware.js';
import { handleDownloadExcelPendaftar } from './DownloadExcelPendaftar.js';
import multer from 'multer';
import path from 'path';
import { uploadFoto, hapusFoto } from '../../lib/cloudinary.js';

const router = express.Router();

// ======================================================
// KONFIGURASI MULTER
// ======================================================

// File ditahan di memori lalu dikirim ke Cloudinary
const storage = multer.memoryStorage();

// ======================================================
// VALIDASI TIPE FILE (HANYA GAMBAR)
// ======================================================

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

  const extension = path.extname(file.originalname).toLowerCase();

  if (
    allowedMimeTypes.includes(file.mimetype) &&
    allowedExtensions.includes(extension)
  ) {
    cb(null, true);
  } else {
    cb(new Error('File harus berupa gambar JPG, JPEG, PNG, atau WEBP!'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // Maksimal 2 MB
  }
});


// ======================================================
// GET: MENGAMBIL SEMUA DATA PENDAFTARAN
// Default: hanya yang aktif.
// ?termasuk_dihapus=true -> sertakan yang sudah dihapus
// (dipakai halaman laporan supaya grafik riwayat tetap utuh)
// ======================================================

router.get('/', verifyToken, async (req, res) => {
  try {
    const termasukDihapus = req.query.termasuk_dihapus === 'true';

    const listPendaftaran = await prisma.pendaftaran.findMany({
      where: termasukDihapus ? {} : { dihapus_pada: null },
      include: {
        siswa: {
          include: {
            kelasData: true
          }
        },
        ekstrakurikuler: true
      }
    });

    res.json({
      success: true,
      message: 'Berhasil mengambil data pendaftaran',
      data: listPendaftaran
    });

  } catch (error) {
    console.error('ERROR DETAIL GET PENDAFTARAN:', error);

    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data',
      error: error.message
    });
  }
});


// ======================================================
// GET: PENDAFTARAN MILIK SISWA YANG SEDANG LOGIN
// ======================================================

router.get('/saya', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id_user || req.user.id;

    const pendaftaran = await prisma.pendaftaran.findMany({
      where: {
        dihapus_pada: null,
        siswa: {
          id_user: Number(userId)
        }
      },
      include: {
        ekstrakurikuler: true,
        siswa: {
          include: {
            kelasData: true
          }
        }
      },
      orderBy: {
        tanggal: 'desc'
      }
    });

    res.json({
      success: true,
      message: 'Berhasil mengambil pendaftaran saya',
      data: pendaftaran
    });

  } catch (error) {
    console.error('ERROR GET PENDAFTARAN SAYA:', error);

    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data pendaftaran',
      error: error.message
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
      const isStaff = isAdmin || userRole === 'pembina';

      if (!id_eskul) {
        return res.status(400).json({
          success: false,
          message: 'ID Ekstrakurikuler wajib diisi!'
        });
      }

      let fotoPath = null;

      // ==================================================
      // TAHAP 1: TENTUKAN targetIdSiswa
      // ==================================================

      let siswaProfilSudahAda = false;

      if (id_siswa_input) {

        // Admin memilih siswa yang sudah ada
        targetIdSiswa = Number(id_siswa_input);

        const siswaCek = await prisma.siswa.findUnique({
          where: { id_siswa: targetIdSiswa }
        });

        if (!siswaCek) {
          return res.status(404).json({
            success: false,
            message: 'Data siswa tidak ditemukan!'
          });
        }

        siswaProfilSudahAda = true;

      } else if (!isStaff) {

        // Siswa mendaftarkan dirinya sendiri
        let siswaExisting = await prisma.siswa.findUnique({
          where: { id_user: Number(userId) }
        });

        if (siswaExisting) {

          targetIdSiswa = siswaExisting.id_siswa;
          siswaProfilSudahAda = true;

        } else {

          if (!nama_siswa || !id_kelas) {
            return res.status(400).json({
              success: false,
              message: 'Nama siswa dan kelas wajib diisi!'
            });
          }

          const kelasCek = await prisma.kelas.findUnique({
            where: { id_kelas: Number(id_kelas) }
          });

          if (!kelasCek) {
            return res.status(400).json({
              success: false,
              message: 'Kelas tidak ditemukan!'
            });
          }

          targetIdSiswa = null;
        }

      } else {

        // Admin/Pembina menambahkan siswa baru manual
        if (!nama_siswa || !id_kelas) {
          return res.status(400).json({
            success: false,
            message: 'Nama siswa dan kelas wajib diisi!'
          });
        }

        const kelasCek = await prisma.kelas.findUnique({
          where: { id_kelas: Number(id_kelas) }
        });

        if (!kelasCek) {
          return res.status(400).json({
            success: false,
            message: 'Kelas tidak ditemukan!'
          });
        }

        const siswaAdmin = await prisma.siswa.findFirst({
          where: {
            nama_siswa: {
              equals: nama_siswa.trim(),
              mode: 'insensitive'
            },
            id_kelas: Number(id_kelas)
          }
        });

        targetIdSiswa = siswaAdmin ? siswaAdmin.id_siswa : null;
        siswaProfilSudahAda = !!siswaAdmin;
      }

      // ==================================================
      // TAHAP 2: CEK PENDAFTARAN DUPLIKAT
      // (hanya yang masih aktif, yang sudah dihapus boleh daftar ulang)
      // ==================================================

      if (targetIdSiswa) {

        const existingRegistration = await prisma.pendaftaran.findFirst({
          where: {
            id_siswa: Number(targetIdSiswa),
            id_eskul: Number(id_eskul),
            dihapus_pada: null
          }
        });

        if (existingRegistration) {
          return res.status(400).json({
            success: false,
            message: 'Siswa sudah terdaftar di ekstrakurikuler ini!'
          });
        }
      }

      // ==================================================
      // UPLOAD FOTO KE CLOUDINARY
      // ==================================================

      if (req.file) {
        fotoPath = await uploadFoto(req.file, 'siswa');
      }

      // ==================================================
      // TAHAP 3: WRITE KE TABEL SISWA
      // ==================================================

      if (siswaProfilSudahAda) {

        // Profil sudah ada. Hanya foto yang boleh diperbarui.
        // dihapus_pada: null -> memulihkan siswa yang sebelumnya
        // sudah dihapus (soft delete) kalau mendaftar lagi.
        await prisma.siswa.update({
          where: { id_siswa: targetIdSiswa },
          data: {
            dihapus_pada: null,
            ...(fotoPath && { foto: fotoPath })
          }
        });

      } else {

        // Profil belum ada -> buat baru
        const siswaBaru = await prisma.siswa.create({
          data: {
            nama_siswa: nama_siswa.trim(),
            id_kelas: Number(id_kelas),
            jenis_kelamin: jenis_kelamin || 'L',
            id_user: isStaff ? null : Number(userId),
            foto: fotoPath
          }
        });

        targetIdSiswa = siswaBaru.id_siswa;
      }

      // ==================================================
      // TAHAP 4: SIMPAN PENDAFTARAN
      // ==================================================

      const pendaftaranBaru = await prisma.pendaftaran.create({
        data: {
          id_siswa: Number(targetIdSiswa),
          id_eskul: Number(id_eskul)
        },
        include: {
          siswa: {
            include: {
              kelasData: true
            }
          },
          ekstrakurikuler: true
        }
      });

      res.status(201).json({
        success: true,
        message: 'Berhasil mendaftar ekstrakurikuler',
        data: pendaftaranBaru
      });

    } catch (error) {
      console.error('ERROR DETAIL POST PENDAFTARAN:', error);

      res.status(500).json({
        success: false,
        message: 'Gagal melakukan pendaftaran',
        error: error.message
      });
    }
  }
);


// ======================================================
// PUT: UPDATE PENDAFTARAN & DATA SISWA
// ======================================================

router.put(
  '/:id',
  verifyToken,
  upload.single('foto'),

  async (req, res) => {
    try {
      const { id } = req.params;

      const {
        id_eskul,
        nama_siswa,
        id_kelas,
        jenis_kelamin
      } = req.body;

      const pendaftaranCek = await prisma.pendaftaran.findUnique({
        where: { id_pendaftaran: Number(id) },
        include: { siswa: true }
      });

      if (!pendaftaranCek || pendaftaranCek.dihapus_pada) {
        return res.status(404).json({
          success: false,
          message: 'Data pendaftaran tidak ditemukan'
        });
      }

      if (id_eskul) {
        await prisma.pendaftaran.update({
          where: { id_pendaftaran: Number(id) },
          data: { id_eskul: Number(id_eskul) }
        });
      }

      const adaFotoBaru = Boolean(req.file);

      if (
        pendaftaranCek.id_siswa &&
        (nama_siswa || id_kelas || jenis_kelamin || adaFotoBaru)
      ) {

        if (id_kelas) {
          const kelasCek = await prisma.kelas.findUnique({
            where: { id_kelas: Number(id_kelas) }
          });

          if (!kelasCek) {
            return res.status(400).json({
              success: false,
              message: 'Kelas tidak ditemukan!'
            });
          }
        }

        // Upload foto baru ke Cloudinary (setelah validasi kelas lolos)
        const fotoPath = adaFotoBaru
          ? await uploadFoto(req.file, 'siswa')
          : null;

        await prisma.siswa.update({
          where: { id_siswa: pendaftaranCek.id_siswa },
          data: {
            ...(nama_siswa && { nama_siswa: nama_siswa.trim() }),
            ...(id_kelas && { id_kelas: Number(id_kelas) }),
            ...(jenis_kelamin && { jenis_kelamin }),
            ...(fotoPath && { foto: fotoPath })
          }
        });

        // Foto lama dihapus setelah database berhasil diperbarui
        if (fotoPath && pendaftaranCek.siswa?.foto) {
          await hapusFoto(pendaftaranCek.siswa.foto);
        }
      }

      const finalResult = await prisma.pendaftaran.findUnique({
        where: { id_pendaftaran: Number(id) },
        include: {
          siswa: {
            include: {
              kelasData: true
            }
          },
          ekstrakurikuler: true
        }
      });

      res.json({
        success: true,
        message: 'Berhasil memperbarui pendaftaran',
        data: finalResult
      });

    } catch (error) {
      console.error('ERROR DETAIL PUT PENDAFTARAN:', error);

      res.status(500).json({
        success: false,
        message: 'Gagal memperbarui pendaftaran',
        error: error.message
      });
    }
  }
);


// ======================================================
// DELETE: SOFT DELETE PENDAFTARAN
// Baris pendaftaran dan data siswa TIDAK dihapus permanen,
// hanya ditandai dihapus_pada, supaya riwayat grafik tetap utuh.
// ======================================================

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const pendaftaranCek = await prisma.pendaftaran.findUnique({
      where: { id_pendaftaran: Number(id) }
    });

    if (!pendaftaranCek || pendaftaranCek.dihapus_pada) {
      return res.status(404).json({
        success: false,
        message: 'Data pendaftaran tidak ditemukan'
      });
    }

    const sekarang = new Date();

    await prisma.$transaction(async (tx) => {
      // 1. Tandai pendaftaran sebagai dihapus
      await tx.pendaftaran.update({
        where: { id_pendaftaran: Number(id) },
        data: { dihapus_pada: sekarang }
      });

      // 2. Kalau siswa tidak punya pendaftaran aktif lain,
      //    tandai siswa sebagai dihapus juga (sama seperti perilaku lama,
      //    tapi tidak benar-benar dibuang dari database)
      const pendaftaranLain = await tx.pendaftaran.count({
        where: {
          id_siswa: pendaftaranCek.id_siswa,
          dihapus_pada: null
        }
      });

      if (pendaftaranLain === 0) {
        await tx.siswa.update({
          where: { id_siswa: pendaftaranCek.id_siswa },
          data: { dihapus_pada: sekarang }
        });
      }
    });

    res.json({
      success: true,
      message: 'Berhasil menghapus pendaftaran'
    });

  } catch (error) {
    console.error('ERROR DETAIL DELETE PENDAFTARAN:', error);

    res.status(500).json({
      success: false,
      message: 'Gagal menghapus pendaftaran',
      error: error.message
    });
  }
});


export default router;