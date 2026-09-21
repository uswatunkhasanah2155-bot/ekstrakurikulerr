import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../../lib/prisma.js';
import { verifyToken } from '../../middleware/authMiddleware.js';

const router = express.Router();


// =====================================================
// 1. REGISTER
// =====================================================

router.post('/register', async (req, res) => {
  try {
    const {
      username,
      password,
      email,
      role,
      id_eskul
    } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username dan password wajib diisi'
      });
    }

    const finalRole = (role || 'SISWA').toUpperCase();

    // Pembina wajib memiliki eskul
    if (finalRole === 'PEMBINA' && !id_eskul) {
      return res.status(400).json({
        success: false,
        message: 'Pembina wajib dikaitkan dengan salah satu eskul'
      });
    }

    // Cek username
    const userExist = await prisma.user.findUnique({
      where: {
        username
      }
    });

    if (userExist) {
      return res.status(400).json({
        success: false,
        message: 'Username sudah digunakan'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        email: email || null,
        role: finalRole,
        id_eskul: finalRole === 'PEMBINA'
          ? Number(id_eskul)
          : null
      }
    });

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil',
      data: {
        id_user: newUser.id_user,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        id_eskul: newUser.id_eskul
      }
    });

  } catch (error) {
    console.error('REGISTER ERROR:', error);

    res.status(500).json({
      success: false,
      message: 'Registrasi gagal',
      error: error.message
    });
  }
});


// =====================================================
// 2. LOGIN
// =====================================================

router.post('/login', async (req, res) => {
  try {
    const {
      username,
      password
    } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username dan password wajib diisi'
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        username
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Username tidak ditemukan'
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

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
        id_eskul: user.id_eskul
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '1d'
      }
    );

    res.json({
      success: true,
      message: 'Login berhasil',
      role: user.role,
      id_user: user.id_user,
      id_eskul: user.id_eskul,
      token
    });

  } catch (error) {
    console.error('LOGIN ERROR:', error);

    res.status(500).json({
      success: false,
      message: 'Login gagal',
      error: error.message
    });
  }
});


// =====================================================
// 3. GET SEMUA USER
// =====================================================

router.get('/users', verifyToken, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id_user: true,
        username: true,
        email: true,
        role: true,
        id_eskul: true,

        eskul: {
          select: {
            id_eskul: true,
            nama_eskul: true
          }
        }
      },

      orderBy: {
        id_user: 'asc'
      }
    });

    res.status(200).json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('GET USERS ERROR:', error);

    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data user',
      error: error.message
    });
  }
});


// =====================================================
// 4. TAMBAH USER
// =====================================================

router.post('/users', verifyToken, async (req, res) => {
  try {
    const {
      username,
      password,
      email,
      role,
      id_eskul
    } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Username, password, dan role wajib diisi'
      });
    }

    const finalRole = role.toUpperCase();

    // Pembina wajib memiliki eskul
    if (finalRole === 'PEMBINA' && !id_eskul) {
      return res.status(400).json({
        success: false,
        message: 'Pembina wajib dikaitkan dengan salah satu eskul'
      });
    }

    // Cek username
    const userExist = await prisma.user.findUnique({
      where: {
        username
      }
    });

    if (userExist) {
      return res.status(400).json({
        success: false,
        message: 'Username sudah digunakan'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        email: email || null,
        role: finalRole,

        id_eskul: finalRole === 'PEMBINA'
          ? Number(id_eskul)
          : null
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
            nama_eskul: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'User berhasil ditambahkan',
      data: newUser
    });

  } catch (error) {
    console.error('TAMBAH USER ERROR:', error);

    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan user',
      error: error.message
    });
  }
});


// =====================================================
// 5. UPDATE USER
// =====================================================

router.patch('/users/:id', verifyToken, async (req, res) => {
  try {
    const {
      username,
      password,
      email,
      role,
      id_eskul
    } = req.body;

    const id = Number(req.params.id);

    if (!username || !role) {
      return res.status(400).json({
        success: false,
        message: 'Username dan role wajib diisi'
      });
    }

    const finalRole = role.toUpperCase();

    // Pembina wajib memiliki eskul
    if (finalRole === 'PEMBINA' && !id_eskul) {
      return res.status(400).json({
        success: false,
        message: 'Pembina wajib dikaitkan dengan salah satu eskul'
      });
    }

    // Cek user
    const userExist = await prisma.user.findUnique({
      where: {
        id_user: id
      }
    });

    if (!userExist) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    // Cek username agar tidak sama dengan user lain
    const usernameExist = await prisma.user.findFirst({
      where: {
        username,
        NOT: {
          id_user: id
        }
      }
    });

    if (usernameExist) {
      return res.status(400).json({
        success: false,
        message: 'Username sudah digunakan user lain'
      });
    }

    const dataUpdate = {
      username,
      email: email || null,
      role: finalRole,

      id_eskul: finalRole === 'PEMBINA'
        ? Number(id_eskul)
        : null
    };

    // Password hanya diubah jika diisi
    if (password && password.trim() !== '') {
      dataUpdate.password = await bcrypt.hash(
        password,
        10
      );
    }

    const updatedUser = await prisma.user.update({
      where: {
        id_user: id
      },

      data: dataUpdate,

      select: {
        id_user: true,
        username: true,
        email: true,
        role: true,
        id_eskul: true,

        eskul: {
          select: {
            id_eskul: true,
            nama_eskul: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'User berhasil diperbarui',
      data: updatedUser
    });

  } catch (error) {
    console.error('UPDATE USER ERROR:', error);

    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui user',
      error: error.message
    });
  }
});


// =====================================================
// 6. HAPUS USER
// =====================================================

router.delete('/users/:id', verifyToken, async (req, res) => {
  try {
    const id = Number(req.params.id);

    // Cek user
    const userExist = await prisma.user.findUnique({
      where: {
        id_user: id
      }
    });

    if (!userExist) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    // Hapus user
    await prisma.user.delete({
      where: {
        id_user: id
      }
    });

    res.status(200).json({
      success: true,
      message: 'User berhasil dihapus'
    });

  } catch (error) {
    console.error('DELETE USER ERROR:', error);

    res.status(500).json({
      success: false,
      message: 'Gagal menghapus user',
      error: error.message
    });
  }
});


// =====================================================
// 7. GET DAFTAR PEMBINA
// =====================================================

router.get('/pembina', verifyToken, async (req, res) => {
  try {
    const pembina = await prisma.user.findMany({
      where: {
        role: {
          equals: 'PEMBINA',
          mode: 'insensitive'
        }
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
            nama_eskul: true
          }
        }
      },

      orderBy: {
        id_user: 'asc'
      }
    });

    res.status(200).json({
      success: true,
      data: pembina
    });

  } catch (error) {
    console.error('GET PEMBINA ERROR:', error);

    res.status(500).json({
      success: false,
      message: 'Gagal mengambil daftar pembina',
      error: error.message
    });
  }
});


// =====================================================
// 8. VERIFY TOKEN
// =====================================================

router.get('/verify', (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith('Bearer ')
    ) {
      return res.status(401).json({
        success: false,
        message: 'Token tidak ditemukan'
      });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    res.status(200).json({
      success: true,
      message: 'Token valid',
      data: decoded
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token tidak valid atau sudah kedaluwarsa'
    });
  }
});


export default router;