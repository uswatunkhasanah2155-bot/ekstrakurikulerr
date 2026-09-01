import express from 'express';
import prisma from '../../lib/prisma.js';
import { verifyToken } from '../../middleware/authMiddleware.js';

const router = express.Router();

// GET: Melihat semua data pendaftaran (Admin bisa lihat semua)
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
    res.status(500).json({ success: false, message: 'Gagal mengambil data', error: error.message });
  }
});

// POST: Mendaftarkan siswa ke ekstrakurikuler (Mendukung Siswa atau Admin)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { id_eskul, id_siswa_input, nama_siswa, kelas, jenis_kelamin } = req.body;
    let targetIdSiswa;

    if (id_siswa_input) {
      targetIdSiswa = Number(id_siswa_input);
    } else {
      const userId = req.user.id_user || req.user.id;  
      const isAdmin = req.user.role === 'admin';

      if (!isAdmin) {
        // Jika yang login adalah Siswa, cek apakah profil siswa sudah ada berdasarkan id_user
        let siswaEksis = await prisma.siswa.findUnique({
          where: { id_user: userId },
        });

        if (siswaEksis) {
          targetIdSiswa = siswaEksis.id_siswa;
        }
      }

      // Jika belum ada (atau jika Admin yang menginput data baru), buat baris siswa baru
      if (!targetIdSiswa) {
        const dataSiswaBaru = {
          nama_siswa: nama_siswa || 'Tanpa Nama',
          kelas: kelas || 'Belum diisi',
          jenis_kelamin: jenis_kelamin || 'L',
        };

        // Hanya masukkan id_user jika yang login bukan admin (atau jika kolom mengizinkannya)
        if (!isAdmin) {
          dataSiswaBaru.id_user = userId;
        }

        const siswaBaru = await prisma.siswa.create({
          data: dataSiswaBaru,
        });
        targetIdSiswa = siswaBaru.id_siswa;
      }
    }

    // Cek apakah siswa sudah terdaftar pada ekstrakurikuler yang sama
    const existingRegistration = await prisma.pendaftaran.findFirst({
      where: {
        id_siswa: targetIdSiswa,
        id_eskul: Number(id_eskul),
      },
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'Siswa sudah terdaftar di ekstrakurikuler ini!',
      });
    }

    // Daftarkan siswa ke eskul
    const pendaftaranBaru = await prisma.pendaftaran.create({
      data: {
        id_siswa: targetIdSiswa,
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

// PUT: Mengubah/memperbarui pilihan eskul (dan opsional data siswa) pada pendaftaran
router.put('/:id', verifyToken, async (req, res) => {
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

    let updatedPendaftaran = pendaftaranCek;
    if (id_eskul) {
      updatedPendaftaran = await prisma.pendaftaran.update({
        where: { id_pendaftaran: Number(id) },
        data: {
          id_eskul: Number(id_eskul),
        },
      });
    }

    if (pendaftaranCek.id_siswa && (nama_siswa || kelas || jenis_kelamin)) {
      await prisma.siswa.update({
        where: { id_siswa: pendaftaranCek.id_siswa },
        data: {
          ...(nama_siswa && { nama_siswa }),
          ...(kelas && { kelas }),
          ...(jenis_kelamin && { jenis_kelamin }),
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

// DELETE: Membatalkan/menghapus pendaftaran berdasarkan id_pendaftaran
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

    await prisma.pendaftaran.delete({
      where: { id_pendaftaran: Number(id) },
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