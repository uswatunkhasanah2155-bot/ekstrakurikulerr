import prisma from '../../lib/prisma.js';
import ExcelJS from 'exceljs';

export const handleDownloadExcel = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. DIPERBAIKI: Gunakan id_eskul sesuai dengan model Prisma kamu
    const eskul = await prisma.ekstrakurikuler.findUnique({
      where: { id_eskul: Number(id) },
      include: {
        pendaftaran: {
          include: {
            siswa: true,
          },
        },
      },
    });

    if (!eskul) {
      return res.status(404).json({ message: 'Ekstrakurikuler tidak ditemukan' });
    }

    // 2. Buat Workbook dan Worksheet baru
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Data Peserta');

    // Aktifkan garis grid Excel agar terlihat rapi
    worksheet.views = [{ showGridLines: true }];

    // 3. Buat Header Tabel di Baris 2 (No, Nama Siswa, Kelas)
    const headers = ['No', 'Nama Siswa', 'Kelas'];
    headers.forEach((header, index) => {
      const colLetter = String.fromCharCode(65 + index); // A, B, C
      const cell = worksheet.getCell(`${colLetter}2`);
      
      cell.value = header;
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '343A40' } };
      cell.alignment = { horizontal: 'center', vertical: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'CCCCCC' } },
        left: { style: 'thin', color: { argb: 'CCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'CCCCCC' } },
        right: { style: 'thin', color: { argb: 'CCCCCC' } },
      };
    });

    // 4. Masukkan Data Siswa secara looping (Mulai baris ke-3)
    let rowIndex = 3;
    eskul.pendaftaran.forEach((item, index) => {
      const row = worksheet.getRow(rowIndex);

      row.getCell('A').value = index + 1;
      row.getCell('B').value = item.siswa.nama;
      row.getCell('C').value = item.siswa.kelas || '-';

      // Styling baris data dan border
      ['A', 'B', 'C'].forEach((colLetter) => {
        const cell = row.getCell(colLetter);
        cell.font = { name: 'Calibri', size: 11 };
        cell.border = {
          top: { style: 'thin', color: { argb: 'E0E0E0' } },
          left: { style: 'thin', color: { argb: 'E0E0E0' } },
          bottom: { style: 'thin', color: { argb: 'E0E0E0' } },
          right: { style: 'thin', color: { argb: 'E0E0E0' } },
        };

        if (colLetter === 'B') {
          cell.alignment = { horizontal: 'left', vertical: 'center' };
        } else {
          cell.alignment = { horizontal: 'center', vertical: 'center' };
        }
      });

      rowIndex++;
    });

    // 5. Atur lebar kolom otomatis agar pas dan rapi
    worksheet.columns.forEach((column) => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = Math.max(maxLength + 5, 12);
    });

    // 6. DIPERBAIKI: Gunakan nama_eskul untuk penamaan file download
    const namaFileEskul = eskul.nama_eskul ? eskul.nama_eskul.replace(/\s+/g, '-') : 'Eskul';

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Rekap-Eskul-${namaFileEskul}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal mendownload data excel', error: error.message });
  }
};