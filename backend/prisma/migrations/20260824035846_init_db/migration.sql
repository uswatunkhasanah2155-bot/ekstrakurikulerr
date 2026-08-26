-- CreateTable
CREATE TABLE "User" (
    "id_user" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id_user")
);

-- CreateTable
CREATE TABLE "Siswa" (
    "id_siswa" SERIAL NOT NULL,
    "id_user" INTEGER NOT NULL,
    "nama_siswa" TEXT NOT NULL,
    "kelas" TEXT NOT NULL,
    "jenis_kelamin" TEXT NOT NULL,

    CONSTRAINT "Siswa_pkey" PRIMARY KEY ("id_siswa")
);

-- CreateTable
CREATE TABLE "Ekstrakurikuler" (
    "id_eskul" SERIAL NOT NULL,
    "nama_eskul" TEXT NOT NULL,
    "deskripsi" TEXT,

    CONSTRAINT "Ekstrakurikuler_pkey" PRIMARY KEY ("id_eskul")
);

-- CreateTable
CREATE TABLE "Pendaftaran" (
    "id_pendaftaran" SERIAL NOT NULL,
    "id_siswa" INTEGER NOT NULL,
    "id_eskul" INTEGER NOT NULL,

    CONSTRAINT "Pendaftaran_pkey" PRIMARY KEY ("id_pendaftaran")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Siswa_id_user_key" ON "Siswa"("id_user");

-- AddForeignKey
ALTER TABLE "Siswa" ADD CONSTRAINT "Siswa_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "User"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pendaftaran" ADD CONSTRAINT "Pendaftaran_id_siswa_fkey" FOREIGN KEY ("id_siswa") REFERENCES "Siswa"("id_siswa") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pendaftaran" ADD CONSTRAINT "Pendaftaran_id_eskul_fkey" FOREIGN KEY ("id_eskul") REFERENCES "Ekstrakurikuler"("id_eskul") ON DELETE CASCADE ON UPDATE CASCADE;
