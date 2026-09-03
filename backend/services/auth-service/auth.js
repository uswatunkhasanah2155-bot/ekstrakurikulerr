import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../../lib/prisma.js';

const router = express.Router();

// 1. REGISTER: Mendaftarkan user baru
router.post('/register', async (req, res) => {
  try {
    const { username, password, email, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username dan password wajib diisi' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username, 
        password: hashedPassword,
        email: email || null,
        role: role || 'SISWA',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil',
      data: { 
        id_user: newUser.id_user, 
        username: newUser.username, 
        email: newUser.email,
        role: newUser.role 
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

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Username tidak ditemukan' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Password salah' });
    }

    const token = jwt.sign(
      { id_user: user.id_user, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      success: true,
      message: 'Login berhasil',
      role: user.role,
      id_user: user.id_user, // <--- Ini ditambahkan agar id_user ikut terkirim ke frontend
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

// 3. UPDATE ROLE USER: Mengubah role user (misal dari SISWA ke ADMIN)
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ success: false, message: 'Role wajib diisi' });
    }

    const updatedUser = await prisma.user.update({
      where: { id_user: Number(id) }, 
      data: { role },
    });

    res.status(200).json({
      success: true,
      message: 'Role user berhasil diperbarui',
      data: {
        id_user: updatedUser.id_user,
        username: updatedUser.username,
        role: updatedUser.role,
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

export default router;