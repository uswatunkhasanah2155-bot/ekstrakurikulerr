// src/pages/GaleriFotoDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { getDaftarEskul, getGaleriEskul } from '../services/api';
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ImageIcon
} from 'lucide-react';

export default function GaleriFotoDetail() {
  const { namaEskul, idGaleri } = useParams();
  const navigate = useNavigate();

  const cleanNamaEskul = namaEskul
    ? namaEskul.replace(/-/g, ' ')
    : '';

  const formatNamaEskul = cleanNamaEskul
    .split(' ')
    .map(
      word =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(' ');

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [daftarFoto, setDaftarFoto] = useState([]);
  const [fotoAktif, setFotoAktif] = useState(null);

  useEffect(() => {
    const roleUser = localStorage.getItem('role');

    setIsAdmin(
      !!(
        roleUser &&
        roleUser.toUpperCase() === 'ADMIN'
      )
    );

    async function fetchData() {
      setLoading(true);

      const eskulData =
        await getDaftarEskul();

      const listEskul =
        eskulData.data ||
        eskulData ||
        [];

      const matchedEskul =
        listEskul.find(
          item =>
            item.nama_eskul &&
            item.nama_eskul
              .toLowerCase()
              .trim() ===
              cleanNamaEskul
                .toLowerCase()
                .trim()
        );

      if (matchedEskul) {
        const fotoData =
          await getGaleriEskul(
            matchedEskul.id_eskul
          );

        setDaftarFoto(
          fotoData || []
        );
      }

      setLoading(false);
    }

    fetchData();
  }, [namaEskul, cleanNamaEskul]);

  useEffect(() => {
    if (daftarFoto.length > 0) {
      const found =
        daftarFoto.find(
          f =>
            String(f.id_galeri) ===
            String(idGaleri)
        );

      setFotoAktif(
        found || null
      );
    }
  }, [daftarFoto, idGaleri]);

  const getFotoUrl = foto => {
    if (!foto) return null;

    return foto.startsWith('http')
      ? foto
      : `http://localhost:5000/${
          foto.startsWith('/')
            ? foto.slice(1)
            : foto
        }`;
  };

  const indexAktif =
    daftarFoto.findIndex(
      f =>
        String(f.id_galeri) ===
        String(idGaleri)
    );

  const fotoSebelumnya =
    indexAktif > 0
      ? daftarFoto[indexAktif - 1]
      : null;

  const fotoSelanjutnya =
    indexAktif >= 0 &&
    indexAktif <
      daftarFoto.length - 1
      ? daftarFoto[indexAktif + 1]
      : null;

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 relative transition-colors duration-300">

      <Sidebar isAdmin={isAdmin} />

      <main className="flex-1 p-6 overflow-y-auto">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">

          <button
            onClick={() =>
              navigate(
                `/eskul/${namaEskul}/galeri`
              )
            }
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />

            Kembali ke Galeri{' '}
            {formatNamaEskul}
          </button>

          {daftarFoto.length > 0 &&
            indexAktif >= 0 && (
              <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                {indexAktif + 1} dari{' '}
                {daftarFoto.length}
              </span>
            )}

        </div>

        {/* LOADING */}
        {loading ? (

          <div className="text-center text-gray-400 dark:text-gray-500 text-sm py-20">
            Memuat foto...
          </div>

        ) : !fotoAktif ? (

          /* FOTO TIDAK DITEMUKAN */
          <div className="flex flex-col items-center justify-center py-24 text-gray-400 dark:text-gray-500 gap-2">

            <ImageIcon className="w-10 h-10" />

            <p className="text-sm">
              Foto tidak ditemukan.
            </p>

          </div>

        ) : (

          /* FOTO DETAIL */
          <div className="flex flex-col items-center">

            <div className="relative w-full flex items-center justify-center">

              {/* TOMBOL SEBELUMNYA */}
              {fotoSebelumnya && (
                <button
                  onClick={() =>
                    navigate(
                      `/eskul/${namaEskul}/galeri/${fotoSebelumnya.id_galeri}`
                    )
                  }
                  className="hidden md:flex absolute left-0 -translate-x-4 z-10 w-11 h-11 rounded-full bg-white dark:bg-gray-900 shadow-md border border-gray-100 dark:border-gray-700 items-center justify-center text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:shadow-lg transition-all"
                  title="Foto sebelumnya"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              {/* FOTO */}
              <img
                src={getFotoUrl(
                  fotoAktif.foto
                )}
                alt={
                  fotoAktif.keterangan ||
                  formatNamaEskul
                }
                className="max-w-full max-h-[75vh] w-auto rounded-2xl shadow-xl object-contain"
              />

              {/* TOMBOL SELANJUTNYA */}
              {fotoSelanjutnya && (
                <button
                  onClick={() =>
                    navigate(
                      `/eskul/${namaEskul}/galeri/${fotoSelanjutnya.id_galeri}`
                    )
                  }
                  className="hidden md:flex absolute right-0 translate-x-4 z-10 w-11 h-11 rounded-full bg-white dark:bg-gray-900 shadow-md border border-gray-100 dark:border-gray-700 items-center justify-center text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:shadow-lg transition-all"
                  title="Foto selanjutnya"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}

            </div>

            {/* KETERANGAN FOTO */}
            <div className="mt-6 text-center max-w-xl">

              <p className="text-base font-medium text-gray-800 dark:text-gray-100">
                {fotoAktif.keterangan ||
                  'Tanpa keterangan'}
              </p>

            </div>

            {/* NAVIGASI MOBILE */}
            <div className="flex md:hidden items-center gap-6 mt-5">

              <button
                onClick={() =>
                  fotoSebelumnya &&
                  navigate(
                    `/eskul/${namaEskul}/galeri/${fotoSebelumnya.id_galeri}`
                  )
                }
                disabled={!fotoSebelumnya}
                className="flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />

                Sebelumnya
              </button>

              <button
                onClick={() =>
                  fotoSelanjutnya &&
                  navigate(
                    `/eskul/${namaEskul}/galeri/${fotoSelanjutnya.id_galeri}`
                  )
                }
                disabled={!fotoSelanjutnya}
                className="flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                Selanjutnya

                <ChevronRight className="w-4 h-4" />
              </button>

            </div>

          </div>

        )}

      </main>

    </div>
  );
}