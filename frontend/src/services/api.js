// src/services/api.js
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
      (item) => item.ekstrakurikuler?.nama_eskul.toLowerCase() === namaEskul.toLowerCase()
    );
    
    const mappedData = filtered.map(item => ({
      id: item.id_pendaftaran,
      id_siswa: item.siswa?.id_siswa,
      nama: item.siswa?.nama_siswa || 'Tanpa Nama',
      kelas: item.siswa?.kelas || 'Belum diisi',
      jenisKelamin: item.siswa?.jenis_kelamin || 'L',
      foto: item.siswa?.foto || null,
      tanggal: new Date(item.tanggal || Date.now()).toLocaleDateString('en-GB', {
       day: '2-digit', month: 'short', year: 'numeric'
      })
    }));

    return mappedData.sort((a, b) => a.id - b.id);

  } catch (error) {
    console.error("Error fetching siswa by eskul:", error);
    return [];
  }
}

export async function downloadSemuaPendaftarExcel() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/pendaftaran/download`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Gagal mendownload data excel');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Rekap-Semua-Pendaftar.xlsx';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error("Error downloading excel:", error);
    return { success: false, error: error.message };
  }
}

export async function tambahPendaftar(dataSiswa) {
  try {
    const token = localStorage.getItem('token');
    
    if (!token || token === 'null' || token === 'undefined') {
      throw new Error('Sesi login kedaluwarsa. Silakan login ulang.');
    }

    const jenisKelaminVal = dataSiswa.get('jenisKelamin') || dataSiswa.get('jenis_kelamin');
    let jenisKelaminDB = 'L';
    if (jenisKelaminVal === 'Perempuan' || jenisKelaminVal === 'P') {
      jenisKelaminDB = 'P';
    }

    dataSiswa.set('jenis_kelamin', jenisKelaminDB);
    dataSiswa.delete('jenisKelamin');

    if (dataSiswa.has('nama') && !dataSiswa.has('nama_siswa')) {
      dataSiswa.set('nama_siswa', dataSiswa.get('nama'));
      dataSiswa.delete('nama');
    }

    const response = await fetch(`${API_URL}/api/pendaftaran`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: dataSiswa,
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
    
    if (!token || token === 'null' || token === 'undefined') {
      throw new Error('Sesi login kedaluwarsa. Silakan login ulang.');
    }

    let hasFile = false;
    if (dataUpdate instanceof FormData) {
      const fotoEntry = dataUpdate.get('foto');
      if (fotoEntry && typeof fotoEntry === 'object' && fotoEntry.size > 0) {
        hasFile = true;
      }
    }

    let response;

    if (!hasFile) {
      let payload = {};
      if (dataUpdate instanceof FormData) {
        const jkVal = dataUpdate.get('jenisKelamin') || dataUpdate.get('jenis_kelamin');
        payload = {
          id_eskul: Number(idPilihanEskul),
          nama_siswa: dataUpdate.get('nama_siswa') || dataUpdate.get('nama'),
          kelas: dataUpdate.get('kelas'),
          jenis_kelamin: (jkVal === 'Perempuan' || jkVal === 'P') ? 'P' : 'L'
        };
      } else {
        payload = {
          id_eskul: Number(idPilihanEskul),
          nama_siswa: dataUpdate?.nama,
          kelas: dataUpdate?.kelas,
          jenis_kelamin: (dataUpdate?.jenis_kelamin === 'Perempuan' || dataUpdate?.jenis_kelamin === 'P') ? 'P' : 'L'
        };
      }

      response = await fetch(`${API_URL}/api/pendaftaran/${idPendaftaran}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
    } else {
      let formDataToSend = dataUpdate;
      if (!formDataToSend.has('id_eskul') && idPilihanEskul) {
        formDataToSend.append('id_eskul', Number(idPilihanEskul));
      }

      response = await fetch(`${API_URL}/api/pendaftaran/${idPendaftaran}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });
    }

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Gagal mengupdate pendaftaran');
    }

    return { success: true, data: result };
  } catch (error) {
    console.error("Error updating pendaftar:", error);
    return { success: false, error: error.message };
  }
}

export async function getGaleriEskul(idEskul) {
  try {
    const response = await fetch(`${API_URL}/api/galeri/${idEskul}`);
    if (!response.ok) {
      throw new Error('Gagal mengambil data galeri dari server backend');
    }
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error("Error fetching galeri:", error);
    return [];
  }
}

export async function uploadGaleriEskul(dataGaleri) {
  try {
    const token = localStorage.getItem('token');

    if (!token || token === 'null' || token === 'undefined') {
      throw new Error('Sesi login kedaluwarsa. Silakan login ulang.');
    }

    const response = await fetch(`${API_URL}/api/galeri`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: dataGaleri,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Gagal mengupload foto galeri');
    }

    return { success: true, data: result };
  } catch (error) {
    console.error("Error uploading galeri:", error);
    return { success: false, error: error.message };
  }
}

export async function hapusGaleriEskul(idGaleri) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/galeri/${idGaleri}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorResult = await response.json();
      throw new Error(errorResult.message || 'Gagal menghapus foto galeri');
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting galeri:", error);
    return { success: false, error: error.message };
  }
}