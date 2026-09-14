import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../../lib/prisma.js';

const router = express.Router();

// 1. REGISTER: Mendaftarkan user baru
router.post('/register', async (req, res) => {
  try {
    const { username, password, email, role, id_eskul } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username dan password wajib diisi' });
    }

    const finalRole = role || 'SISWA';

    // Validasi: kalau role-nya pembina, id_eskul wajib diisi
    if (finalRole.toLowerCase() === 'pembina' && !id_eskul) {
      return res.status(400).json({
        success: false,
        message: 'Pembina wajib dikaitkan dengan salah satu eskul (id_eskul)'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        email: email || null,
        role: finalRole,

        // id_eskul cuma diisi kalau role-nya pembina
        id_eskul: finalRole.toLowerCase() === 'pembina'
          ? Number(id_eskul)
          : null,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil',
      data: {
        id_user: newUser.id_user,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        id_eskul: newUser.id_eskul,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Registrasi gagal (kemungkinan username sudah terdaftar)',
      error: error.message,
    });
  }
});

// 2. LOGIN: Masuk dan mendapatkan Token JWT
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Username tidak ditemukan'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Password salah'
      });
    }

    const token = jwt.sign(
      {
        id_user: user.id_user,
        username: user.username,
        role: user.role,
        id_eskul: user.id_eskul,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      success: true,
      message: 'Login berhasil',
      role: user.role,
      id_user: user.id_user,
      id_eskul: user.id_eskul,
      token,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Login gagal',
      error: error.message,
    });
  }
});

// 3. UPDATE ROLE USER: Mengubah role user
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id_eskul } = req.body;

    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Role wajib diisi'
      });
    }

    if (role.toLowerCase() === 'pembina' && !id_eskul) {
      return res.status(400).json({
        success: false,
        message: 'Pembina wajib dikaitkan dengan salah satu eskul (id_eskul)'
      });
    }

    const updatedUser = await prisma.user.update({
      where: {
        id_user: Number(id)
      },
      data: {
        role,
        id_eskul: role.toLowerCase() === 'pembina'
          ? Number(id_eskul)
          : null,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Role user berhasil diperbarui',
      data: {
        id_user: updatedUser.id_user,
        username: updatedUser.username,
        role: updatedUser.role,
        id_eskul: updatedUser.id_eskul,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui role',
      error: error.message,
    });
  }
});

// 4. GET DAFTAR PEMBINA
router.get('/pembina', async (req, res) => {
  try {
    const pembina = await prisma.user.findMany({
      where: {
        role: {
          equals: 'PEMBINA',
          mode: 'insensitive',
        },
      },
      select: {
        id_user: true,
        username: true,
        email: true,
        role: true,
        id_eskul: true,
        eskul: {
          select: {
            id_eskul: true,
            nama_eskul: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: pembina,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil daftar pembina',
      error: error.message,
    });
  }
});

export default router;