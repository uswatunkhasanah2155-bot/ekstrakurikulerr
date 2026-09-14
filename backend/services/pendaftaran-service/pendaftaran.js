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
    const uniqueSuffix =
      Date.now() + '-' + Math.round(Math.random() * 1E9);

    cb(
      null,
      'siswa-' + uniqueSuffix + path.extname(file.originalname)
    );
  }
});

const upload = multer({ storage });


// ======================================================
// GET: MENGAMBIL SEMUA DATA PENDAFTARAN
// ======================================================

router.get('/', verifyToken, async (req, res) => {
  try {
    const listPendaftaran =
      await prisma.pendaftaran.findMany({
        include: {
          siswa: {
            include: {
              kelasData: true
            }
          },
          ekstrakurikuler: true,
        },
      });

    res.json({
      success: true,
      message: 'Berhasil mengambil data pendaftaran',
      data: listPendaftaran,
    });

  } catch (error) {

    console.error(
      'ERROR DETAIL GET PENDAFTARAN:',
      error
    );

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

router.get(
  '/download',
  verifyToken,
  handleDownloadExcelPendaftar
);


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

      const userId =
        req.user.id_user || req.user.id;

      const userRole =
        (req.user.role || '').toLowerCase();

      const isAdmin =
        userRole === 'admin';


      // ==================================================
      // CEK ID ESKUL
      // ==================================================

      if (!id_eskul) {
        return res.status(400).json({
          success: false,
          message: 'ID Ekstrakurikuler wajib diisi!',
        });
      }


      // ==================================================
      // FOTO
      // ==================================================

      const fotoPath = req.file
        ? `uploads/siswa/${req.file.filename}`
        : null;


      // ==================================================
      // JIKA ADMIN MEMILIH SISWA YANG SUDAH ADA
      // ==================================================

      if (id_siswa_input) {

        targetIdSiswa =
          Number(id_siswa_input);

        const siswaCek =
          await prisma.siswa.findUnique({
            where: {
              id_siswa: targetIdSiswa,
            },
          });

        if (!siswaCek) {
          return res.status(404).json({
            success: false,
            message: 'Data siswa tidak ditemukan!',
          });
        }


        // Update foto jika ada foto baru
        if (fotoPath) {

          await prisma.siswa.update({
            where: {
              id_siswa: targetIdSiswa,
            },

            data: {
              foto: fotoPath,
            },
          });
        }
      }


      // ==================================================
      // JIKA SISWA MENDAFTARKAN DIRINYA SENDIRI
      // ==================================================

      else if (!isAdmin) {

        if (!nama_siswa || !id_kelas) {
          return res.status(400).json({
            success: false,
            message: 'Nama siswa dan kelas wajib diisi!',
          });
        }


        // ----------------------------------------------
        // CEK KELAS
        // ----------------------------------------------

        const kelasCek =
          await prisma.kelas.findUnique({
            where: {
              id_kelas: Number(id_kelas),
            },
          });

        if (!kelasCek) {
          return res.status(400).json({
            success: false,
            message: 'Kelas tidak ditemukan!',
          });
        }


        // ----------------------------------------------
        // CARI DATA SISWA BERDASARKAN AKUN LOGIN
        // ----------------------------------------------

        let siswaExisting =
          await prisma.siswa.findUnique({
            where: {
              id_user: Number(userId),
            },
          });


        // ----------------------------------------------
        // JIKA DATA SISWA SUDAH ADA
        // ----------------------------------------------

        if (siswaExisting) {

          targetIdSiswa =
            siswaExisting.id_siswa;


          // ============================================
          // PERBAIKAN UTAMA
          // ============================================

          await prisma.siswa.update({
            where: {
              id_siswa: siswaExisting.id_siswa,
            },

            data: {
              nama_siswa:
                nama_siswa.trim(),

              id_kelas:
                Number(id_kelas),

              jenis_kelamin:
                jenis_kelamin || 'L',

              ...(fotoPath && {
                foto: fotoPath,
              }),
            },
          });

        }


        // ----------------------------------------------
        // JIKA DATA SISWA BELUM ADA
        // ----------------------------------------------

        else {

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

                foto:
                  fotoPath,
              },
            });

          targetIdSiswa =
            siswaBaru.id_siswa;
        }
      }


      // ==================================================
      // JIKA ADMIN MENAMBAHKAN SISWA
      // ==================================================

      if (isAdmin) {

        if (!nama_siswa || !id_kelas) {
          return res.status(400).json({
            success: false,
            message:
              'Nama siswa dan kelas wajib diisi oleh admin!',
          });
        }


        // ----------------------------------------------
        // CEK KELAS
        // ----------------------------------------------

        const kelasCek =
          await prisma.kelas.findUnique({
            where: {
              id_kelas: Number(id_kelas),
            },
          });

        if (!kelasCek) {
          return res.status(400).json({
            success: false,
            message: 'Kelas tidak ditemukan!',
          });
        }


        // ----------------------------------------------
        // CARI SISWA BERDASARKAN NAMA + KELAS
        // ----------------------------------------------

        let siswaAdmin =
          await prisma.siswa.findFirst({
            where: {
              nama_siswa: {
                equals:
                  nama_siswa.trim(),
                mode: 'insensitive',
              },

              id_kelas:
                Number(id_kelas),
            },
          });


        // ----------------------------------------------
        // JIKA SISWA SUDAH ADA
        // ----------------------------------------------

        if (siswaAdmin) {

          targetIdSiswa =
            siswaAdmin.id_siswa;


          if (fotoPath) {

            await prisma.siswa.update({
              where: {
                id_siswa:
                  siswaAdmin.id_siswa,
              },

              data: {
                foto: fotoPath,
              },
            });
          }
        }


        // ----------------------------------------------
        // JIKA SISWA BELUM ADA
        // ----------------------------------------------

        else {

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
                  null,

                foto:
                  fotoPath,
              },
            });

          targetIdSiswa =
            siswaBaru.id_siswa;
        }
      }


      // ==================================================
      // CEK PENDAFTARAN DUPLIKAT
      // ==================================================

      const existingRegistration =
        await prisma.pendaftaran.findFirst({
          where: {

            id_siswa:
              Number(targetIdSiswa),

            id_eskul:
              Number(id_eskul),
          },
        });


      if (existingRegistration) {
        return res.status(400).json({
          success: false,
          message:
            'Siswa sudah terdaftar di ekstrakurikuler ini!',
        });
      }


      // ==================================================
      // SIMPAN PENDAFTARAN
      // ==================================================

      const pendaftaranBaru =
        await prisma.pendaftaran.create({

          data: {

            id_siswa:
              Number(targetIdSiswa),

            id_eskul:
              Number(id_eskul),
          },

          include: {

            siswa: {
              include: {
                kelasData: true
              }
            },

            ekstrakurikuler:
              true,
          },
        });


      res.status(201).json({

        success: true,

        message:
          'Berhasil mendaftar ekstrakurikuler',

        data:
          pendaftaranBaru,
      });


    } catch (error) {

      console.error(
        'ERROR DETAIL POST PENDAFTARAN:',
        error
      );

      res.status(500).json({

        success: false,

        message:
          'Gagal melakukan pendaftaran',

        error:
          error.message,
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

      const { id } =
        req.params;

      const {
        id_eskul,
        nama_siswa,
        id_kelas,
        jenis_kelamin
      } = req.body;


      // ----------------------------------------------
      // CARI PENDAFTARAN
      // ----------------------------------------------

      const pendaftaranCek =
        await prisma.pendaftaran.findUnique({

          where: {
            id_pendaftaran:
              Number(id),
          },

          include: {
            siswa: true,
          },
        });


      if (!pendaftaranCek) {

        return res.status(404).json({
          success: false,
          message:
            'Data pendaftaran tidak ditemukan',
        });
      }


      // ----------------------------------------------
      // UPDATE ESKUL
      // ----------------------------------------------

      if (id_eskul) {

        await prisma.pendaftaran.update({

          where: {
            id_pendaftaran:
              Number(id),
          },

          data: {
            id_eskul:
              Number(id_eskul),
          },
        });
      }


      // ----------------------------------------------
      // FOTO
      // ----------------------------------------------

      const fotoPath = req.file
        ? `uploads/siswa/${req.file.filename}`
        : null;


      // ----------------------------------------------
      // UPDATE DATA SISWA
      // ----------------------------------------------

      if (
        pendaftaranCek.id_siswa &&
        (
          nama_siswa ||
          id_kelas ||
          jenis_kelamin ||
          fotoPath
        )
      ) {

        // Cek kelas jika ada perubahan kelas
        if (id_kelas) {

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


        await prisma.siswa.update({

          where: {
            id_siswa:
              pendaftaranCek.id_siswa,
          },

          data: {

            ...(nama_siswa && {
              nama_siswa:
                nama_siswa.trim(),
            }),

            ...(id_kelas && {
              id_kelas:
                Number(id_kelas),
            }),

            ...(jenis_kelamin && {
              jenis_kelamin,
            }),

            ...(fotoPath && {
              foto:
                fotoPath,
            }),
          },
        });
      }


      // ----------------------------------------------
      // AMBIL DATA TERBARU
      // ----------------------------------------------

      const finalResult =
        await prisma.pendaftaran.findUnique({

          where: {
            id_pendaftaran:
              Number(id),
          },

          include: {

            siswa: {
              include: {
                kelasData: true
              }
            },

            ekstrakurikuler:
              true,
          },
        });


      res.json({

        success: true,

        message:
          'Berhasil memperbarui pendaftaran',

        data:
          finalResult,
      });


    } catch (error) {

      console.error(
        'ERROR DETAIL PUT PENDAFTARAN:',
        error
      );

      res.status(500).json({

        success: false,

        message:
          'Gagal memperbarui pendaftaran',

        error:
          error.message,
      });
    }
  }
);


// ======================================================
// DELETE: HAPUS PENDAFTARAN
// ======================================================

router.delete(
  '/:id',
  verifyToken,
  async (req, res) => {

    try {

      const { id } =
        req.params;


      // ----------------------------------------------
      // CARI PENDAFTARAN
      // ----------------------------------------------

      const pendaftaranCek =
        await prisma.pendaftaran.findUnique({

          where: {
            id_pendaftaran:
              Number(id),
          },
        });


      if (!pendaftaranCek) {

        return res.status(404).json({
          success: false,
          message:
            'Data pendaftaran tidak ditemukan',
        });
      }


      const idSiswa =
        pendaftaranCek.id_siswa;


      // ----------------------------------------------
      // HAPUS PENDAFTARAN
      // ----------------------------------------------

      await prisma.$transaction(
        async (tx) => {

          await tx.pendaftaran.delete({

            where: {
              id_pendaftaran:
                Number(id),
            },
          });


          // ------------------------------------------
          // CEK APAKAH SISWA MASIH TERDAFTAR DI ESKUL
          // ------------------------------------------

          if (idSiswa) {

            const pendaftaranLain =
              await tx.pendaftaran.count({

                where: {
                  id_siswa:
                    idSiswa,
                },
              });


            // Jika sudah tidak punya pendaftaran,
            // hapus data siswa
            if (pendaftaranLain === 0) {

              await tx.siswa.delete({

                where: {
                  id_siswa:
                    idSiswa,
                },
              });
            }
          }
        }
      );


      res.json({

        success: true,

        message:
          'Berhasil membatalkan pendaftaran ekstrakurikuler',
      });


    } catch (error) {

      console.error(
        'ERROR DETAIL DELETE PENDAFTARAN:',
        error
      );

      res.status(500).json({

        success: false,

        message:
          'Gagal membatalkan pendaftaran',

        error:
          error.message,
      });
    }
  }
);


export default router;