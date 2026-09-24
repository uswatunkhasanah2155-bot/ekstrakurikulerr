import prisma from '../../lib/prisma.js';
import ExcelJS from 'exceljs';

export const handleDownloadExcelPendaftar = async (req, res) => {
  try {
    const listPendaftaran = await prisma.pendaftaran.findMany({
      include: {
        siswa: {
          include: {
            kelasData: true,
          },
        },
        ekstrakurikuler: true,
      },
      orderBy: {
        id_siswa: 'asc',
      },
    });

    // =========================
    // GROUPING BERDASARKAN SISWA
    // =========================
    const grouped = {};

    listPendaftaran.forEach((item) => {
      const idSiswa = item.siswa?.id_siswa;

      if (!idSiswa) return;

      if (!grouped[idSiswa]) {
        grouped[idSiswa] = {
          nama: item.siswa?.nama_siswa || 'Tanpa Nama',
          kelas: item.siswa?.kelasData?.nama_kelas || '-',
          jenisKelamin:
            item.siswa?.jenis_kelamin === 'P'
              ? 'Perempuan'
              : 'Laki-laki',
          eskul: [],
          tanggalDaftar: [],
        };
      }

      // Nama eskul
      const namaEskul =
        item.ekstrakurikuler?.nama_eskul || '-';

      grouped[idSiswa].eskul.push(namaEskul);

      // Tanggal pendaftaran (cukup tanggalnya saja)
      if (item.tanggal) {
        const tanggal = new Date(item.tanggal);

        const tanggalFormat = tanggal.toLocaleDateString(
          'id-ID',
          {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          }
        );

        grouped[idSiswa].tanggalDaftar.push(tanggalFormat);
      } else {
        grouped[idSiswa].tanggalDaftar.push('-');
      }
    });

    const dataSiswa = Object.values(grouped);

    // =========================
    // BUAT WORKBOOK
    // =========================
    const workbook = new ExcelJS.Workbook();

    const worksheet = workbook.addWorksheet(
      'Rekap Pendaftar'
    );

    worksheet.views = [
      {
        showGridLines: true,
      },
    ];

    // =========================
    // HEADER
    // =========================
    const headers = [
      'No',
      'Nama Siswa',
      'Kelas',
      'Jenis Kelamin',
      'Ekstrakurikuler Diikuti',
      'Tanggal Daftar',
    ];

    headers.forEach((header, index) => {
      const colLetter = String.fromCharCode(
        65 + index
      );

      const cell = worksheet.getCell(
        `${colLetter}2`
      );

      cell.value = header;

      cell.font = {
        name: 'Calibri',
        size: 11,
        bold: true,
        color: {
          argb: 'FFFFFF',
        },
      };

      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {
          argb: '343A40',
        },
      };

      cell.alignment = {
        horizontal: 'center',
        vertical: 'center',
      };

      cell.border = {
        top: {
          style: 'thin',
          color: {
            argb: 'CCCCCC',
          },
        },
        left: {
          style: 'thin',
          color: {
            argb: 'CCCCCC',
          },
        },
        bottom: {
          style: 'thin',
          color: {
            argb: 'CCCCCC',
          },
        },
        right: {
          style: 'thin',
          color: {
            argb: 'CCCCCC',
          },
        },
      };
    });

    // =========================
    // DATA SISWA
    // =========================
    let rowIndex = 3;

    dataSiswa.forEach((siswa, index) => {
      const row = worksheet.getRow(rowIndex);

      row.getCell('A').value = index + 1;

      row.getCell('B').value = siswa.nama;

      row.getCell('C').value = siswa.kelas;

      row.getCell('D').value =
        siswa.jenisKelamin;

      row.getCell('E').value =
        siswa.eskul.join(', ');

      row.getCell('F').value =
        siswa.tanggalDaftar.join(', ');

      // =========================
      // STYLE DATA
      // =========================
      [
        'A',
        'B',
        'C',
        'D',
        'E',
        'F',
      ].forEach((colLetter) => {
        const cell = row.getCell(colLetter);

        cell.font = {
          name: 'Calibri',
          size: 11,
        };

        cell.border = {
          top: {
            style: 'thin',
            color: {
              argb: 'E0E0E0',
            },
          },
          left: {
            style: 'thin',
            color: {
              argb: 'E0E0E0',
            },
          },
          bottom: {
            style: 'thin',
            color: {
              argb: 'E0E0E0',
            },
          },
          right: {
            style: 'thin',
            color: {
              argb: 'E0E0E0',
            },
          },
        };

        if (
          colLetter === 'B' ||
          colLetter === 'E' ||
          colLetter === 'F'
        ) {
          cell.alignment = {
            horizontal: 'left',
            vertical: 'center',
            wrapText: true,
          };
        } else {
          cell.alignment = {
            horizontal: 'center',
            vertical: 'center',
          };
        }
      });

      rowIndex++;
    });

    // =========================
    // LEBAR KOLOM
    // =========================
    worksheet.columns.forEach((column) => {
      let maxLength = 0;

      column.eachCell(
        {
          includeEmpty: true,
        },
        (cell) => {
          const len = cell.value
            ? cell.value.toString().length
            : 10;

          if (len > maxLength) {
            maxLength = len;
          }
        }
      );

      column.width = Math.min(
        Math.max(maxLength + 5, 12),
        50
      );
    });

    // =========================
    // HEADER DOWNLOAD
    // =========================
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    res.setHeader(
      'Content-Disposition',
      'attachment; filename=Rekap-Semua-Pendaftar.xlsx'
    );

    // =========================
    // KIRIM FILE EXCEL
    // =========================
    await workbook.xlsx.write(res);

    res.end();

  } catch (error) {
    console.error(
      'ERROR DOWNLOAD EXCEL:',
      error
    );

    res.status(500).json({
      message: 'Gagal mendownload data excel',
      error: error.message,
    });
  }
};