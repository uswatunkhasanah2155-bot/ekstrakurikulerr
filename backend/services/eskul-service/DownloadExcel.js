import prisma from '../../lib/prisma.js';
import ExcelJS from 'exceljs';

export const handleDownloadExcel = async (req, res) => {
  try {
    const { id } = req.params;

    const eskul = await prisma.ekstrakurikuler.findUnique({
      where: {
        id_eskul: Number(id),
      },
      include: {
        pendaftaran: {
          include: {
            siswa: {
              include: {
                kelasData: true,
              },
            },
          },
        },
      },
    });

    if (!eskul) {
      return res.status(404).json({
        message: 'Ekstrakurikuler tidak ditemukan',
      });
    }

    // =========================
    // BUAT WORKBOOK
    // =========================
    const workbook = new ExcelJS.Workbook();

    const worksheet = workbook.addWorksheet('Data Peserta');

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
      'Tanggal Daftar',
    ];

    headers.forEach((header, index) => {
      const colLetter = String.fromCharCode(65 + index);

      const cell = worksheet.getCell(`${colLetter}2`);

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

    eskul.pendaftaran.forEach((item, index) => {
      const row = worksheet.getRow(rowIndex);

      // No
      row.getCell('A').value = index + 1;

      // Nama siswa
      row.getCell('B').value =
        item.siswa.nama_siswa;

      // Kelas
      row.getCell('C').value =
        item.siswa.kelasData?.nama_kelas || '-';

      // Tanggal daftar
      if (item.tanggal) {
        row.getCell('D').value = new Date(item.tanggal);

        row.getCell('D').numFmt = 'dd/mm/yyyy';
      } else {
        row.getCell('D').value = '-';
      }

      // =========================
      // STYLE DATA
      // =========================
      ['A', 'B', 'C', 'D'].forEach((colLetter) => {
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

        if (colLetter === 'B') {
          cell.alignment = {
            horizontal: 'left',
            vertical: 'center',
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
          let columnLength = 0;

          if (cell.value instanceof Date) {
            columnLength = 10;
          } else {
            columnLength = cell.value
              ? cell.value.toString().length
              : 10;
          }

          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        }
      );

      column.width = Math.max(
        maxLength + 5,
        12
      );
    });

    // =========================
    // NAMA FILE
    // =========================
    const namaFileEskul = eskul.nama_eskul
      ? eskul.nama_eskul.replace(/\s+/g, '-')
      : 'Eskul';

    // =========================
    // RESPONSE DOWNLOAD
    // =========================
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Rekap-Eskul-${namaFileEskul}.xlsx`
    );

    // =========================
    // KIRIM FILE
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