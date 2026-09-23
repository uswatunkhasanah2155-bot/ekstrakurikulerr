// src/services/api.js

const API_URL = 'http://localhost:5000';

// ==================================================
// HELPER: Deteksi token invalid/expired, otomatis logout
// ==================================================

export function handleUnauthorized(response) {
  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('id_user');
    localStorage.removeItem('id_eskul');
    window.location.href = '/login';
    return true;
  }

  return false;
}


// ==================================================
// VERIFIKASI TOKEN JWT
// ==================================================

export async function verifyToken() {
  try {
    const token = localStorage.getItem('token');

    if (!token) {
      return {
        valid: false
      };
    }

    const response = await fetch(`${API_URL}/api/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      return {
        valid: false
      };
    }

    const result = await response.json();

    return {
      valid: true,
      data: result.data
    };

  } catch (error) {
    console.error('Error verifying token:', error);

    return {
      valid: false
    };
  }
}


// ==================================================
// EKSTRAKURIKULER
// ==================================================

export async function getDaftarEskul() {
  try {
    const response = await fetch(`${API_URL}/api/eskul`);

    if (!response.ok) {
      throw new Error(
        'Gagal mengambil data dari server backend'
      );
    }

    const result = await response.json();

    return result.data || [];

  } catch (error) {
    console.error('Error fetching eskul:', error);
    return [];
  }
}


// ==================================================
// PENDAFTARAN
// ==================================================

export async function getPendaftarEskul() {
  try {
    const token = localStorage.getItem('token');

    const response = await fetch(
      `${API_URL}/api/pendaftaran`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (handleUnauthorized(response)) return [];

    if (!response.ok) {
      throw new Error(
        'Gagal mengambil data pendaftar dari server backend'
      );
    }

    const result = await response.json();

    return result.data || [];

  } catch (error) {
    console.error('Error fetching pendaftar:', error);
    return [];
  }
}


export async function getSiswaByEskul(namaEskul) {
  try {
    const token = localStorage.getItem('token');

    const response = await fetch(
      `${API_URL}/api/pendaftaran`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (handleUnauthorized(response)) return [];

    if (!response.ok) {
      throw new Error(
        'Gagal mengambil data pendaftaran'
      );
    }

    const result = await response.json();

    const semuaPendaftar = result.data || [];

    const filtered = semuaPendaftar.filter(
      (item) =>
        item.ekstrakurikuler?.nama_eskul?.toLowerCase() ===
        namaEskul?.toLowerCase()
    );

    const mappedData = filtered.map(item => ({
      id: item.id_pendaftaran,
      id_siswa: item.siswa?.id_siswa,
      nama: item.siswa?.nama_siswa || 'Tanpa Nama',

      id_kelas: item.siswa?.id_kelas || null,

      kelas:
        item.siswa?.kelasData?.nama_kelas ||
        'Belum diisi',

      jenisKelamin:
        item.siswa?.jenis_kelamin || 'L',

      foto:
        item.siswa?.foto || null,

      tanggal: new Date(
        item.tanggal || Date.now()
      ).toLocaleDateString(
        'en-GB',
        {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }
      )
    }));

    return mappedData.sort(
      (a, b) => a.id - b.id
    );

  } catch (error) {
    console.error(
      'Error fetching siswa by eskul:',
      error
    );

    return [];
  }
}


// --------------------------------------------------
// Ambil profil siswa milik akun yang sedang login
// --------------------------------------------------

export async function getProfilSiswaSaya() {
  try {
    const token = localStorage.getItem('token');

    if (
      !token ||
      token === 'null' ||
      token === 'undefined'
    ) {
      return null;
    }

    const response = await fetch(
      `${API_URL}/api/siswa/me`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (handleUnauthorized(response)) return null;

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(
        'Gagal mengambil profil siswa'
      );
    }

    const result = await response.json();

    return result.data || null;

  } catch (error) {
    console.error(
      'Error fetching profil siswa saya:',
      error
    );

    return null;
  }
}


export async function tambahPendaftar(dataSiswa) {
  try {
    const token = localStorage.getItem('token');

    if (
      !token ||
      token === 'null' ||
      token === 'undefined'
    ) {
      throw new Error(
        'Sesi login kedaluwarsa. Silakan login ulang.'
      );
    }

    const jenisKelaminVal =
      dataSiswa.get('jenisKelamin') ||
      dataSiswa.get('jenis_kelamin');

    let jenisKelaminDB = 'L';

    if (
      jenisKelaminVal === 'Perempuan' ||
      jenisKelaminVal === 'P'
    ) {
      jenisKelaminDB = 'P';
    }

    dataSiswa.set(
      'jenis_kelamin',
      jenisKelaminDB
    );

    dataSiswa.delete('jenisKelamin');

    if (
      dataSiswa.has('nama') &&
      !dataSiswa.has('nama_siswa')
    ) {
      dataSiswa.set(
        'nama_siswa',
        dataSiswa.get('nama')
      );

      dataSiswa.delete('nama');
    }

    if (dataSiswa.has('id_kelas')) {
      const idKelas =
        dataSiswa.get('id_kelas');

      if (
        idKelas !== null &&
        idKelas !== ''
      ) {
        dataSiswa.set(
          'id_kelas',
          Number(idKelas)
        );
      }
    }

    const response = await fetch(
      `${API_URL}/api/pendaftaran`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: dataSiswa
      }
    );

    if (handleUnauthorized(response)) {
      return {
        success: false,
        error: 'Sesi login berakhir.'
      };
    }

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message ||
        'Gagal menyimpan data pendaftar baru'
      );
    }

    return {
      success: true,
      data: result
    };

  } catch (error) {
    console.error(
      'Error adding pendaftar:',
      error
    );

    return {
      success: false,
      error: error.message
    };
  }
}


export async function updatePendaftar(
  idPendaftaran,
  idPilihanEskul,
  idSiswa,
  dataUpdate
) {
  try {
    const token = localStorage.getItem('token');

    if (
      !token ||
      token === 'null' ||
      token === 'undefined'
    ) {
      throw new Error(
        'Sesi login kedaluwarsa. Silakan login ulang.'
      );
    }

    let hasFile = false;

    if (dataUpdate instanceof FormData) {
      const fotoEntry =
        dataUpdate.get('foto');

      if (
        fotoEntry &&
        typeof fotoEntry === 'object' &&
        fotoEntry.size > 0
      ) {
        hasFile = true;
      }
    }

    let response;

    // ==================================================
    // UPDATE TANPA FOTO
    // ==================================================

    if (!hasFile) {
      let payload = {};

      if (dataUpdate instanceof FormData) {
        const jkVal =
          dataUpdate.get('jenisKelamin') ||
          dataUpdate.get('jenis_kelamin');

        payload = {
          id_eskul: Number(idPilihanEskul),

          nama_siswa:
            dataUpdate.get('nama_siswa') ||
            dataUpdate.get('nama'),

          id_kelas:
            dataUpdate.get('id_kelas'),

          jenis_kelamin:
            (
              jkVal === 'Perempuan' ||
              jkVal === 'P'
            )
              ? 'P'
              : 'L'
        };

      } else {
        payload = {
          id_eskul:
            Number(idPilihanEskul),

          nama_siswa:
            dataUpdate?.nama,

          id_kelas:
            dataUpdate?.id_kelas,

          jenis_kelamin:
            (
              dataUpdate?.jenis_kelamin === 'Perempuan' ||
              dataUpdate?.jenis_kelamin === 'P'
            )
              ? 'P'
              : 'L'
        };
      }

      if (
        payload.id_kelas !== null &&
        payload.id_kelas !== undefined &&
        payload.id_kelas !== ''
      ) {
        payload.id_kelas =
          Number(payload.id_kelas);
      }

      response = await fetch(
        `${API_URL}/api/pendaftaran/${idPendaftaran}`,
        {
          method: 'PUT',

          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },

          body: JSON.stringify(payload)
        }
      );

    // ==================================================
    // UPDATE DENGAN FOTO
    // ==================================================

    } else {
      const formDataToSend =
        dataUpdate;

      if (
        !formDataToSend.has('id_eskul') &&
        idPilihanEskul
      ) {
        formDataToSend.append(
          'id_eskul',
          Number(idPilihanEskul)
        );
      }

      if (
        formDataToSend.has('nama') &&
        !formDataToSend.has('nama_siswa')
      ) {
        formDataToSend.append(
          'nama_siswa',
          formDataToSend.get('nama')
        );

        formDataToSend.delete('nama');
      }

      if (
        formDataToSend.has('id_kelas')
      ) {
        const idKelas =
          formDataToSend.get('id_kelas');

        if (
          idKelas !== null &&
          idKelas !== ''
        ) {
          formDataToSend.set(
            'id_kelas',
            Number(idKelas)
          );
        }
      }

      const jkVal =
        formDataToSend.get('jenisKelamin') ||
        formDataToSend.get('jenis_kelamin');

      if (jkVal) {
        const jenisKelaminDB =
          (
            jkVal === 'Perempuan' ||
            jkVal === 'P'
          )
            ? 'P'
            : 'L';

        formDataToSend.set(
          'jenis_kelamin',
          jenisKelaminDB
        );

        formDataToSend.delete(
          'jenisKelamin'
        );
      }

      response = await fetch(
        `${API_URL}/api/pendaftaran/${idPendaftaran}`,
        {
          method: 'PUT',

          headers: {
            'Authorization': `Bearer ${token}`
          },

          body: formDataToSend
        }
      );
    }

    if (handleUnauthorized(response)) {
      return {
        success: false,
        error: 'Sesi login berakhir.'
      };
    }

    const result =
      await response.json();

    if (!response.ok) {
      throw new Error(
        result.message ||
        'Gagal mengupdate pendaftar'
      );
    }

    return {
      success: true,
      data: result
    };

  } catch (error) {
    console.error(
      'Error updating pendaftar:',
      error
    );

    return {
      success: false,
      error: error.message
    };
  }
}


export async function hapusPendaftar(
  idPendaftaran
) {
  try {
    const token =
      localStorage.getItem('token');

    const response = await fetch(
      `${API_URL}/api/pendaftaran/${idPendaftaran}`,
      {
        method: 'DELETE',

        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (handleUnauthorized(response)) {
      return {
        success: false,
        error: 'Sesi login berakhir.'
      };
    }

    if (!response.ok) {
      const errorResult =
        await response.json();

      throw new Error(
        errorResult.message ||
        'Gagal menghapus pendaftaran'
      );
    }

    return {
      success: true
    };

  } catch (error) {
    console.error(
      'Error deleting pendaftar:',
      error
    );

    return {
      success: false,
      error: error.message
    };
  }
}


export async function downloadSemuaPendaftarExcel() {
  try {
    const token =
      localStorage.getItem('token');

    const response = await fetch(
      `${API_URL}/api/pendaftaran/download`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (handleUnauthorized(response)) {
      return {
        success: false,
        error: 'Sesi login berakhir.'
      };
    }

    if (!response.ok) {
      throw new Error(
        'Gagal mendownload data excel'
      );
    }

    const blob =
      await response.blob();

    const url =
      window.URL.createObjectURL(blob);

    const a =
      document.createElement('a');

    a.href = url;

    a.download =
      'Rekap-Semua-Pendaftar.xlsx';

    document.body.appendChild(a);

    a.click();

    a.remove();

    window.URL.revokeObjectURL(url);

    return {
      success: true
    };

  } catch (error) {
    console.error(
      'Error downloading excel:',
      error
    );

    return {
      success: false,
      error: error.message
    };
  }
}


// ==================================================
// GALERI ESKUL
// ==================================================

export async function getGaleriEskul(idEskul) {
  try {
    const response = await fetch(
      `${API_URL}/api/galeri/${idEskul}`
    );

    if (!response.ok) {
      throw new Error(
        'Gagal mengambil data galeri dari server backend'
      );
    }

    const result =
      await response.json();

    return result.data || [];

  } catch (error) {
    console.error(
      'Error fetching galeri:',
      error
    );

    return [];
  }
}


// --------------------------------------------------
// UPLOAD FOTO GALERI
// Disesuaikan dengan route backend: POST /api/galeri/:id_eskul
// id_eskul WAJIB dikirim lewat parameter idEskul (bukan di dalam FormData)
// --------------------------------------------------

export async function uploadGaleriEskul(idEskul, dataGaleri) {
  try {
    const token =
      localStorage.getItem('token');

    if (
      !token ||
      token === 'null' ||
      token === 'undefined'
    ) {
      throw new Error(
        'Sesi login kedaluwarsa. Silakan login ulang.'
      );
    }

    const response = await fetch(
      `${API_URL}/api/galeri`,
      {
        method: 'POST',

        headers: {
          'Authorization': `Bearer ${token}`
        },

        body: dataGaleri
      }
    );

    if (handleUnauthorized(response)) {
      return {
        success: false,
        error: 'Sesi login berakhir.'
      };
    }

    const result =
      await response.json();

    if (!response.ok) {
      throw new Error(
        result.message ||
        'Gagal mengupload foto galeri'
      );
    }

    return {
      success: true,
      data: result
    };

  } catch (error) {
    console.error(
      'Error uploading galeri:',
      error
    );

    return {
      success: false,
      error: error.message
    };
  }
}


export async function hapusGaleriEskul(
  idGaleri
) {
  try {
    const token =
      localStorage.getItem('token');

    const response = await fetch(
      `${API_URL}/api/galeri/${idGaleri}`,
      {
        method: 'DELETE',

        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (handleUnauthorized(response)) {
      return {
        success: false,
        error: 'Sesi login berakhir.'
      };
    }

    if (!response.ok) {
      const errorResult =
        await response.json();

      throw new Error(
        errorResult.message ||
        'Gagal menghapus foto galeri'
      );
    }

    return {
      success: true
    };

  } catch (error) {
    console.error(
      'Error deleting galeri:',
      error
    );

    return {
      success: false,
      error: error.message
    };
  }
}


export async function setFotoUtamaGaleri(
  idGaleri
) {
  try {
    const token =
      localStorage.getItem('token');

    if (
      !token ||
      token === 'null' ||
      token === 'undefined'
    ) {
      throw new Error(
        'Sesi login kedaluwarsa. Silakan login ulang.'
      );
    }

    const response = await fetch(
      `${API_URL}/api/galeri/${idGaleri}/featured`,
      {
        method: 'PATCH',

        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (handleUnauthorized(response)) {
      return {
        success: false,
        error: 'Sesi login berakhir.'
      };
    }

    const result =
      await response.json();

    if (!response.ok) {
      throw new Error(
        result.message ||
        'Gagal mengatur foto utama'
      );
    }

    return {
      success: true,
      data: result
    };

  } catch (error) {
    console.error(
      'Error setting foto utama:',
      error
    );

    return {
      success: false,
      error: error.message
    };
  }
}


export async function updateGaleriEskul(
  idGaleri,
  dataUpdate
) {
  try {
    const token =
      localStorage.getItem('token');

    if (
      !token ||
      token === 'null' ||
      token === 'undefined'
    ) {
      throw new Error(
        'Sesi login kedaluwarsa. Silakan login ulang.'
      );
    }

    const response = await fetch(
      `${API_URL}/api/galeri/${idGaleri}`,
      {
        method: 'PUT',

        headers: {
          'Authorization': `Bearer ${token}`
        },

        body: dataUpdate
      }
    );

    if (handleUnauthorized(response)) {
      return {
        success: false,
        error: 'Sesi login berakhir.'
      };
    }

    const result =
      await response.json();

    if (!response.ok) {
      throw new Error(
        result.message ||
        'Gagal mengupdate foto galeri'
      );
    }

    return {
      success: true,
      data: result
    };

  } catch (error) {
    console.error(
      'Error updating galeri:',
      error
    );

    return {
      success: false,
      error: error.message
    };
  }
}


// ==================================================
// PEMBINA
// ==================================================

export async function getDaftarPembina() {
  try {
    const token =
      localStorage.getItem('token');

    const response = await fetch(
      `${API_URL}/api/auth/pembina`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (handleUnauthorized(response)) {
      return [];
    }

    if (!response.ok) {
      throw new Error(
        'Gagal mengambil daftar pembina'
      );
    }

    const result =
      await response.json();

    return result.data || [];

  } catch (error) {
    console.error(
      'Error fetching pembina:',
      error
    );

    return [];
  }
}


export async function tambahPembina(
  dataPembina
) {
  try {
    const response = await fetch(
      `${API_URL}/api/auth/register`,
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({
          username:
            dataPembina.username,

          password:
            dataPembina.password,

          role: 'pembina',

          id_eskul:
            Number(dataPembina.id_eskul)
        })
      }
    );

    const result =
      await response.json();

    if (!response.ok) {
      throw new Error(
        result.message ||
        'Gagal menambahkan akun pembina'
      );
    }

    return {
      success: true,
      data: result
    };

  } catch (error) {
    console.error(
      'Error adding pembina:',
      error
    );

    return {
      success: false,
      error: error.message
    };
  }
}


export async function hapusPembina(
  idUser
) {
  try {
    const token =
      localStorage.getItem('token');

    const response = await fetch(
      `${API_URL}/api/auth/pembina/${idUser}`,
      {
        method: 'DELETE',

        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (handleUnauthorized(response)) {
      return {
        success: false,
        error: 'Sesi login berakhir.'
      };
    }

    if (!response.ok) {
      const errorResult =
        await response.json();

      throw new Error(
        errorResult.message ||
        'Gagal menghapus akun pembina'
      );
    }

    return {
      success: true
    };

  } catch (error) {
    console.error(
      'Error deleting pembina:',
      error
    );

    return {
      success: false,
      error: error.message
    };
  }
}


// ==================================================
// USER
// ==================================================

export async function getDaftarUser() {
  try {
    const token =
      localStorage.getItem('token');

    const response = await fetch(
      `${API_URL}/api/auth/users`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (handleUnauthorized(response)) {
      return [];
    }

    if (!response.ok) {
      throw new Error(
        'Gagal mengambil daftar user'
      );
    }

    const result =
      await response.json();

    return result.data || [];

  } catch (error) {
    console.error(
      'Error fetching user:',
      error
    );

    return [];
  }
}


// ==================================================
// TAMBAH USER
// ==================================================

export async function tambahUser(dataUser) {
  try {
    const token =
      localStorage.getItem('token');

    if (
      !token ||
      token === 'null' ||
      token === 'undefined'
    ) {
      throw new Error(
        'Sesi login kedaluwarsa. Silakan login ulang.'
      );
    }

    const response = await fetch(
      `${API_URL}/api/auth/users`,
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },

        body: JSON.stringify({
          username: dataUser.username,
          password: dataUser.password,
          email: dataUser.email || null,
          role: dataUser.role,

          id_eskul:
            dataUser.role === 'PEMBINA'
              ? Number(dataUser.id_eskul)
              : null
        })
      }
    );

    if (handleUnauthorized(response)) {
      return {
        success: false,
        error: 'Sesi login berakhir.'
      };
    }

    const result =
      await response.json();

    if (!response.ok) {
      throw new Error(
        result.message ||
        'Gagal menambahkan user'
      );
    }

    return {
      success: true,
      data: result
    };

  } catch (error) {
    console.error(
      'Error adding user:',
      error
    );

    return {
      success: false,
      error: error.message
    };
  }
}


// ==================================================
// UPDATE USER
// ==================================================

export async function updateUser(
  idUser,
  dataUser
) {
  try {
    const token =
      localStorage.getItem('token');

    if (
      !token ||
      token === 'null' ||
      token === 'undefined'
    ) {
      throw new Error(
        'Sesi login kedaluwarsa. Silakan login ulang.'
      );
    }

    const body = {
      username: dataUser.username,
      email: dataUser.email || null,
      role: dataUser.role,

      id_eskul:
        dataUser.role === 'PEMBINA'
          ? Number(dataUser.id_eskul)
          : null
    };

    if (
      dataUser.password &&
      dataUser.password.trim() !== ''
    ) {
      body.password =
        dataUser.password;
    }

    const response = await fetch(
      `${API_URL}/api/auth/users/${idUser}`,
      {
        method: 'PATCH',

        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },

        body: JSON.stringify(body)
      }
    );

    if (handleUnauthorized(response)) {
      return {
        success: false,
        error: 'Sesi login berakhir.'
      };
    }

    const result =
      await response.json();

    if (!response.ok) {
      throw new Error(
        result.message ||
        'Gagal mengupdate user'
      );
    }

    return {
      success: true,
      data: result
    };

  } catch (error) {
    console.error(
      'Error updating user:',
      error
    );

    return {
      success: false,
      error: error.message
    };
  }
}


// ==================================================
// HAPUS USER
// ==================================================

export async function hapusUser(
  idUser
) {
  try {
    const token =
      localStorage.getItem('token');

    if (
      !token ||
      token === 'null' ||
      token === 'undefined'
    ) {
      throw new Error(
        'Sesi login kedaluwarsa. Silakan login ulang.'
      );
    }

    const response = await fetch(
      `${API_URL}/api/auth/users/${idUser}`,
      {
        method: 'DELETE',

        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (handleUnauthorized(response)) {
      return {
        success: false,
        error: 'Sesi login berakhir.'
      };
    }

    const result =
      await response.json();

    if (!response.ok) {
      throw new Error(
        result.message ||
        'Gagal menghapus user'
      );
    }

    return {
      success: true,
      data: result
    };

  } catch (error) {
    console.error(
      'Error deleting user:',
      error
    );

    return {
      success: false,
      error: error.message
    };
  }
}


// ==================================================
// UPDATE ROLE USER
// ==================================================

export async function updateRoleUser(
  idUser,
  role,
  idEskul = null
) {
  try {
    const token =
      localStorage.getItem('token');

    if (
      !token ||
      token === 'null' ||
      token === 'undefined'
    ) {
      throw new Error(
        'Sesi login kedaluwarsa. Silakan login ulang.'
      );
    }

    const response = await fetch(
      `${API_URL}/api/auth/users/${idUser}/role`,
      {
        method: 'PATCH',

        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },

        body: JSON.stringify({
          role,

          id_eskul:
            role.toLowerCase() === 'pembina'
              ? Number(idEskul)
              : null
        })
      }
    );

    if (handleUnauthorized(response)) {
      return {
        success: false,
        error: 'Sesi login berakhir.'
      };
    }

    const result =
      await response.json();

    if (!response.ok) {
      throw new Error(
        result.message ||
        'Gagal mengubah role user'
      );
    }

    return {
      success: true,
      data: result.data
    };

  } catch (error) {
    console.error(
      'Error updating role user:',
      error
    );

    return {
      success: false,
      error: error.message
    };
  }
}


// ==================================================
// MANAJEMEN KELAS
// ==================================================

export async function getDaftarKelas() {
  try {
    const token =
      localStorage.getItem('token');

    const response = await fetch(
      `${API_URL}/api/kelas`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (handleUnauthorized(response)) {
      return [];
    }

    const result =
      await response.json();

    if (!response.ok) {
      throw new Error(
        result.message ||
        'Gagal mengambil daftar kelas'
      );
    }

    return result.data || [];

  } catch (error) {
    console.error(
      'Error fetching kelas:',
      error
    );

    return [];
  }
}


export async function tambahKelas(
  namaKelas
) {
  try {
    const token =
      localStorage.getItem('token');

    if (
      !token ||
      token === 'null' ||
      token === 'undefined'
    ) {
      throw new Error(
        'Sesi login kedaluwarsa. Silakan login ulang.'
      );
    }

    const response = await fetch(
      `${API_URL}/api/kelas`,
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },

        body: JSON.stringify({
          nama_kelas: namaKelas
        })
      }
    );

    if (handleUnauthorized(response)) {
      return {
        success: false,
        error: 'Sesi login berakhir.'
      };
    }

    const result =
      await response.json();

    if (!response.ok) {
      throw new Error(
        result.message ||
        'Gagal menambahkan kelas'
      );
    }

    return {
      success: true,
      data: result.data
    };

  } catch (error) {
    console.error(
      'Error adding kelas:',
      error
    );

    return {
      success: false,
      error: error.message
    };
  }
}


export async function updateKelas(
  idKelas,
  namaKelas
) {
  try {
    const token =
      localStorage.getItem('token');

    if (
      !token ||
      token === 'null' ||
      token === 'undefined'
    ) {
      throw new Error(
        'Sesi login kedaluwarsa. Silakan login ulang.'
      );
    }

    const response = await fetch(
      `${API_URL}/api/kelas/${idKelas}`,
      {
        method: 'PUT',

        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },

        body: JSON.stringify({
          nama_kelas: namaKelas
        })
      }
    );

    if (handleUnauthorized(response)) {
      return {
        success: false,
        error: 'Sesi login berakhir.'
      };
    }

    const result =
      await response.json();

    if (!response.ok) {
      throw new Error(
        result.message ||
        'Gagal mengupdate kelas'
      );
    }

    return {
      success: true,
      data: result.data
    };

  } catch (error) {
    console.error(
      'Error updating kelas:',
      error
    );

    return {
      success: false,
      error: error.message
    };
  }
}


export async function hapusKelas(
  idKelas
) {
  try {
    const token =
      localStorage.getItem('token');

    if (
      !token ||
      token === 'null' ||
      token === 'undefined'
    ) {
      throw new Error(
        'Sesi login kedaluwarsa. Silakan login ulang.'
      );
    }

    const response = await fetch(
      `${API_URL}/api/kelas/${idKelas}`,
      {
        method: 'DELETE',

        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (handleUnauthorized(response)) {
      return {
        success: false,
        error: 'Sesi login berakhir.'
      };
    }

    const result =
      await response.json();

    if (!response.ok) {
      throw new Error(
        result.message ||
        'Gagal menghapus kelas'
      );
    }

    return {
      success: true,
      data: result
    };

  } catch (error) {
    console.error(
      'Error deleting kelas:',
      error
    );

    return {
      success: false,
      error: error.message
    };
  }
}