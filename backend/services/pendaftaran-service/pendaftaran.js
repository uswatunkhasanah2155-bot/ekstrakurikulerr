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

      const siswaBaru = await prisma.siswa.create({
        data: {
          nama_siswa: nama_siswa || 'Tanpa Nama',
          kelas: kelas || 'Belum diisi',
          jenis_kelamin: jenis_kelamin || 'L',
          id_user: req.user.role === 'admin' ? null : userId 
        },
      });
      targetIdSiswa = siswaBaru.id_siswa;
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
    res.status(500).json({ success: false, message: 'Gagal melakukan pendaftaran', error: error.message });
  }
});

// PUT: Mengubah/memperbarui pilihan eskul (dan opsional data siswa) pada pendaftaran
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { id_eskul, nama_siswa, kelas, jenis_kelamin } = req.body;

    // Cek apakah data pendaftaran ada
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

    // 1. Update pilihan eskul pada tabel pendaftaran jika id_eskul dikirim
    let updatedPendaftaran = pendaftaranCek;
    if (id_eskul) {
      updatedPendaftaran = await prisma.pendaftaran.update({
        where: { id_pendaftaran: Number(id) },
        data: {
          id_eskul: Number(id_eskul),
        },
      });
    }

    // 2. Jika ada data siswa yang ikut dikirim untuk diupdate, update juga tabel siswa terkait
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

    // Ambil data terbaru lengkap dengan relasinya untuk dikembalikan ke frontend
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
    res.status(500).json({
      success: false,
      message: 'Gagal membatalkan pendaftaran',
      error: error.message,
    });
  }
});

export default router;