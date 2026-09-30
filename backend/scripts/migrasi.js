// Jalankan SEKALI dari folder backend:
//   node scripts/migrasi-foto-ke-cloudinary.js
//
// Fungsinya: foto lama yang masih ada di folder uploads/ diunggah ke Cloudinary,
// lalu path di database diganti menjadi path Cloudinary (contoh: galeri/galeri-123.jpg).
// Aman dijalankan berulang: data yang sudah dipindah tidak diproses lagi.

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import prisma from '../lib/prisma.js';
import cloudinary from '../lib/cloudinary.js';

const TABEL = [
  { model: 'ekstrakurikuler', kunci: 'id_eskul', folder: 'eskul' },
  { model: 'siswa', kunci: 'id_siswa', folder: 'siswa' },
  { model: 'galeriEskul', kunci: 'id_galeri', folder: 'galeri' },
];

async function pindahkan(fotoLama, folder) {
  const relatif = fotoLama.replace(/^\/+/, ''); // uploads/galeri/xxx.jpeg
  const fullPath = path.join(process.cwd(), relatif);

  if (!fs.existsSync(fullPath)) return null;

  const namaFile = path.parse(fullPath).name; // galeri-123-456
  const hasil = await cloudinary.uploader.upload(fullPath, {
    public_id: `${folder}/${namaFile}`,
    resource_type: 'image',
    overwrite: true,
  });

  return `${hasil.public_id}.${hasil.format}`;
}

async function main() {
  let berhasil = 0;
  let hilang = 0;

  for (const { model, kunci, folder } of TABEL) {
    const data = await prisma[model].findMany({
      where: {
        OR: [
          { foto: { startsWith: '/uploads/' } },
          { foto: { startsWith: 'uploads/' } },
        ],
      },
    });

    console.log(`\n[${model}] ${data.length} foto lama ditemukan`);

    for (const row of data) {
      try {
        const fotoBaru = await pindahkan(row.foto, folder);

        if (!fotoBaru) {
          hilang++;
          console.log(`  - file TIDAK ADA di komputer ini, dilewati: ${row.foto}`);
          continue;
        }

        await prisma[model].update({
          where: { [kunci]: row[kunci] },
          data: { foto: fotoBaru },
        });

        berhasil++;
        console.log(`  + ${row.foto}  ->  ${fotoBaru}`);
      } catch (error) {
        console.error(`  ! Gagal memproses ${row.foto}:`, error.message);
      }
    }
  }

  console.log(`\nSelesai. Berhasil dipindah: ${berhasil}, file tidak ditemukan: ${hilang}`);
  await prisma.$disconnect();
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});