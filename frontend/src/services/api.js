const API_URL = 'http://localhost:5000';

export async function getDaftarEskul() {
  try {
    const response = await fetch(`${API_URL}/api/eskul`);
    if (!response.ok) {
      throw new Error('Gagal mengambil data dari server backend');
    }
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error("Error fetching eskul:", error);
    return [];
  }
}

export async function getPendaftarEskul() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/pendaftaran`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }); 
    if (!response.ok) {
      throw new Error('Gagal mengambil data pendaftar dari server backend');
    }
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error("Error fetching pendaftar:", error);
    return [];
  }
}

export async function getSiswaByEskul(namaEskul) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/pendaftaran`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) {
      throw new Error('Gagal mengambil data pendaftaran');
    }
    const result = await response.json();
    
    const semuaPendaftar = result.data || [];
    const filtered = semuaPendaftar.filter(
      (item) => item.ekstrakurikuler?.nama_eskul?.toLowerCase() === namaEskul.toLowerCase()
    );
    
    const mappedData = filtered.map(item => ({
      id: item.id_pendaftaran || item.id,
      id_siswa: item.id_siswa || item.siswa?.id_siswa,
      nama: item.siswa?.nama_siswa || item.nama_siswa || item.nama || 'Tanpa Nama',
      kelas: item.siswa?.kelas || item.kelas || 'Belum diisi',
      jenisKelamin: item.siswa?.jenis_kelamin || item.jenis_kelamin || 'L',
      tanggal: new Date(item.createdAt || Date.now()).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
      })
    }));

    return mappedData.sort((a, b) => a.id - b.id);

  } catch (error) {
    console.error("Error fetching siswa by eskul:", error);
    return [];
  }
}

export async function tambahPendaftar(dataSiswa) {
  try {
    const token = localStorage.getItem('token');
    
    if (!token || token === 'null' || token === 'undefined') {
      throw new Error('Sesi login kedaluwarsa. Silakan login ulang.');
    }

    let jenisKelaminDB = 'L';
    if (dataSiswa.jenisKelamin === 'Perempuan' || dataSiswa.jenisKelamin === 'P') {
      jenisKelaminDB = 'P';
    }

    const response = await fetch(`${API_URL}/api/pendaftaran`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        id_eskul: Number(dataSiswa.id_eskul),
        nama_siswa: dataSiswa.nama,
        kelas: dataSiswa.kelas,
        jenis_kelamin: jenisKelaminDB
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Gagal menyimpan data pendaftar baru');
    }

    return { success: true, data: result };
  } catch (error) {
    console.error("Error adding pendaftar:", error);
    return { success: false, error: error.message };
  }
}

export async function hapusPendaftar(idPendaftaran) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/pendaftaran/${idPendaftaran}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorResult = await response.json();
      throw new Error(errorResult.message || 'Gagal menghapus pendaftaran');
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting pendaftar:", error);
    return { success: false, error: error.message };
  }
}

export async function updatePendaftar(idPendaftaran, idPilihanEskul, idSiswa, dataUpdate) {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_URL}/api/pendaftaran/${idPendaftaran}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        id_eskul: Number(idPilihanEskul),
        ...(dataUpdate?.nama && { nama_siswa: dataUpdate.nama }),
        ...(dataUpdate?.kelas && { kelas: dataUpdate.kelas }),
        ...(dataUpdate?.jenis_kelamin && { jenis_kelamin: dataUpdate.jenis_kelamin })
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Gagal mengupdate pendaftaran');
    }

    if (idSiswa && dataUpdate) {
      let jenisKelaminDB = undefined;
      if (dataUpdate.jenis_kelamin) {
        jenisKelaminDB = (dataUpdate.jenis_kelamin === 'Perempuan' || dataUpdate.jenis_kelamin === 'P') ? 'P' : 'L';
      }

      const bodyData = {};
      if (dataUpdate.nama) bodyData.nama_siswa = dataUpdate.nama;
      if (dataUpdate.kelas) bodyData.kelas = dataUpdate.kelas;
      if (jenisKelaminDB) bodyData.jenis_kelamin = jenisKelaminDB;

      if (Object.keys(bodyData).length > 0) {
        await fetch(`${API_URL}/api/siswa/${idSiswa}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(bodyData)
        });
      }
    }

    return { success: true, data: result };
  } catch (error) {
    console.error("Error updating pendaftar:", error);
    return { success: false, error: error.message };
  }
}