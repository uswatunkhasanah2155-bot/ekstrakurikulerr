import prisma from '../../lib/prisma.js';
import ExcelJS from 'exceljs';

export const handleDownloadExcelPendaftar = async (req, res) => {
  try {
    const listPendaftaran = await prisma.pendaftaran.findMany({
      include: {
        siswa: true,
        ekstrakurikuler: true,
      },
      orderBy: { id_siswa: 'asc' },
    });

    const grouped = {};
    listPendaftaran.forEach((item) => {
      const idSiswa = item.siswa?.id_siswa;
      if (!idSiswa) return;

      if (!grouped[idSiswa]) {
        grouped[idSiswa] = {
          nama: item.siswa?.nama_siswa || 'Tanpa Nama',
          kelas: item.siswa?.kelas || '-',
          jenisKelamin: item.siswa?.jenis_kelamin === 'P' ? 'Perempuan' : 'Laki-laki',
          eskul: [],
        };
      }
      grouped[idSiswa].eskul.push(item.ekstrakurikuler?.nama_eskul || '-');
    });

    const dataSiswa = Object.values(grouped);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Rekap Pendaftar');
    worksheet.views = [{ showGridLines: true }];

    const headers = ['No', 'Nama Siswa', 'Kelas', 'Jenis Kelamin', 'Ekstrakurikuler Diikuti'];
    headers.forEach((header, index) => {
      const colLetter = String.fromCharCode(65 + index);
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

    let rowIndex = 3;
    dataSiswa.forEach((siswa, index) => {
      const row = worksheet.getRow(rowIndex);

      row.getCell('A').value = index + 1;
      row.getCell('B').value = siswa.nama;
      row.getCell('C').value = siswa.kelas;
      row.getCell('D').value = siswa.jenisKelamin;
      row.getCell('E').value = siswa.eskul.join(', ');

      ['A', 'B', 'C', 'D', 'E'].forEach((colLetter) => {
        const cell = row.getCell(colLetter);
        cell.font = { name: 'Calibri', size: 11 };
        cell.border = {
          top: { style: 'thin', color: { argb: 'E0E0E0' } },
          left: { style: 'thin', color: { argb: 'E0E0E0' } },
          bottom: { style: 'thin', color: { argb: 'E0E0E0' } },
          right: { style: 'thin', color: { argb: 'E0E0E0' } },
        };
        cell.alignment = (colLetter === 'B' || colLetter === 'E')
          ? { horizontal: 'left', vertical: 'center' }
          : { horizontal: 'center', vertical: 'center' };
      });

      rowIndex++;
    });

    worksheet.columns.forEach((column) => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const len = cell.value ? cell.value.toString().length : 10;
        if (len > maxLength) maxLength = len;
      });
      column.width = Math.max(maxLength + 5, 12);
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=Rekap-Semua-Pendaftar.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal mendownload data excel', error: error.message });
  }
};