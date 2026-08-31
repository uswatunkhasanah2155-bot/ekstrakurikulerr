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
    const { id_eskul, id_siswa_input } = req.body;
    let targetIdSiswa;

    // Jika id_siswa_input dikirim (biasanya dari admin), gunakan itu. Jika tidak, ambil dari user yang login (siswa).
    if (id_siswa_input) {
      targetIdSiswa = Number(id_siswa_input);
    } else {
      const userId = req.user.id_user; // Didapatkan dari token JWT login

      // Cari data siswa berdasarkan id_user yang sedang login di tabel Siswa
      let siswa = await prisma.siswa.findUnique({
        where: { id_user: userId },
      });

      // Jika profil belum ada di tabel Siswa, buat secara otomatis (auto-create) agar kolom wajib di tabel Siswa terpenuhi
      if (!siswa) {
        siswa = await prisma.siswa.create({
          data: {
            id_user: userId,
            nama_siswa: req.user.username || 'Siswa Baru',
            kelas: 'Belum diisi',
            jenis_kelamin: 'L',
          },
        });
      }
      targetIdSiswa = siswa.id_siswa;
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

// PUT: Mengubah/memperbarui pilihan eskul pada pendaftaran
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { id_eskul } = req.body;

    // Cek apakah data pendaftaran ada
    const pendaftaranCek = await prisma.pendaftaran.findUnique({
      where: { id_pendaftaran: Number(id) },
    });

    if (!pendaftaranCek) {
      return res.status(404).json({
        success: false,
        message: 'Data pendaftaran tidak ditemukan',
      });
    }

    // Update pilihan eskul
    const pendaftaranUpdated = await prisma.pendaftaran.update({
      where: { id_pendaftaran: Number(id) },
      data: {
        id_eskul: id_eskul ? Number(id_eskul) : pendaftaranCek.id_eskul,
      },
      include: {
        siswa: true,
        ekstrakurikuler: true,
      },
    });

    res.json({
      success: true,
      message: 'Berhasil memperbarui pilihan ekstrakurikuler',
      data: pendaftaranUpdated,
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

    // Cek apakah data pendaftaran ada
    const pendaftaranCek = await prisma.pendaftaran.findUnique({
      where: { id_pendaftaran: Number(id) },
    });

    if (!pendaftaranCek) {
      return res.status(404).json({
        success: false,
        message: 'Data pendaftaran tidak ditemukan',
      });
    }

    // Hapus data pendaftaran berdasarkan id_pendaftaran
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