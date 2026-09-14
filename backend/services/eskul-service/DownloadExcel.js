import prisma from '../../lib/prisma.js';
import ExcelJS from 'exceljs';

export const handleDownloadExcel = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Ambil data ekstrakurikuler beserta pendaftar dan kelas siswa
    const eskul = await prisma.ekstrakurikuler.findUnique({
      where: { id_eskul: Number(id) },
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

    // 2. Buat workbook dan worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Data Peserta');

    // Tampilkan garis grid Excel
    worksheet.views = [{ showGridLines: true }];

    // 3. Header tabel
    const headers = ['No', 'Nama Siswa', 'Kelas'];

    headers.forEach((header, index) => {
      const colLetter = String.fromCharCode(65 + index);
      const cell = worksheet.getCell(`${colLetter}2`);

      cell.value = header;

      cell.font = {
        name: 'Calibri',
        size: 11,
        bold: true,
        color: { argb: 'FFFFFF' },
      };

      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '343A40' },
      };

      cell.alignment = {
        horizontal: 'center',
        vertical: 'center',
      };

      cell.border = {
        top: { style: 'thin', color: { argb: 'CCCCCC' } },
        left: { style: 'thin', color: { argb: 'CCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'CCCCCC' } },
        right: { style: 'thin', color: { argb: 'CCCCCC' } },
      };
    });

    // 4. Masukkan data siswa
    let rowIndex = 3;

    eskul.pendaftaran.forEach((item, index) => {
      const row = worksheet.getRow(rowIndex);

      row.getCell('A').value = index + 1;
      row.getCell('B').value = item.siswa.nama_siswa;
      row.getCell('C').value =
        item.siswa.kelasData?.nama_kelas || '-';

      // Styling baris data
      ['A', 'B', 'C'].forEach((colLetter) => {
        const cell = row.getCell(colLetter);

        cell.font = {
          name: 'Calibri',
          size: 11,
        };

        cell.border = {
          top: { style: 'thin', color: { argb: 'E0E0E0' } },
          left: { style: 'thin', color: { argb: 'E0E0E0' } },
          bottom: { style: 'thin', color: { argb: 'E0E0E0' } },
          right: { style: 'thin', color: { argb: 'E0E0E0' } },
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

    // 5. Atur lebar kolom otomatis
    worksheet.columns.forEach((column) => {
      let maxLength = 0;

      column.eachCell({ includeEmpty: true }, (cell) => {
        const columnLength = cell.value
          ? cell.value.toString().length
          : 10;

        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });

      column.width = Math.max(maxLength + 5, 12);
    });

    // 6. Nama file berdasarkan nama ekstrakurikuler
    const namaFileEskul = eskul.nama_eskul
      ? eskul.nama_eskul.replace(/\s+/g, '-')
      : 'Eskul';

    // 7. Header response untuk download Excel
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Rekap-Eskul-${namaFileEskul}.xlsx`
    );

    // 8. Kirim file Excel
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('ERROR DOWNLOAD EXCEL:', error);

    res.status(500).json({
      message: 'Gagal mendownload data excel',
      error: error.message,
    });
  }
};