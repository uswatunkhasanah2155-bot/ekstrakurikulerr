import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../../lib/prisma.js';

const router = express.Router();

// 1. REGISTER: Mendaftarkan user baru
router.post('/register', async (req, res) => {
  try {
    // Tambahkan email di sini
    const { username, password, email, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username dan password wajib diisi' });
    }

    // Enkripsi password menggunakan bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Simpan ke database
    const newUser = await prisma.user.create({
      data: {
        username, 
        password: hashedPassword,
        email: email || null, // Masukkan email ke database
        role: role || 'SISWA',
      },
    });

    res.status(201).json({
      success: false ? false : true,
      message: 'Registrasi berhasil',
      data: { 
        id_user: newUser.id_user, 
        username: newUser.username, 
        email: newUser.email, // Tampilkan email pada respons
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

    // Cari user berdasarkan username
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Username tidak ditemukan' });
    }

    // Verifikasi password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Password salah' });
    }

    // Buat Token JWT (berlaku selama 1 hari)
    const token = jwt.sign(
      { id_user: user.id_user, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      success: true,
      message: 'Login berhasil',
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

export default router;