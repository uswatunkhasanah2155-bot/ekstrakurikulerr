// src/pages/LaporanEskul.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { fotoUrl } from '../utils/fotoUrl';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  ImageIcon,
  X,
  Camera,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  getDaftarEskul,
  getRiwayatPendaftarEskul,
  getGaleriEskul,
} from '../services/api';

// Nama hari diindeks sesuai Date.getDay() (0 = Minggu, 1 = Senin, dst)
const NAMA_HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const OPSI_FILTER = [
  { key: 'hari', label: 'Hari Ini' },
  { key: 'minggu', label: '1 Minggu' },
  { key: 'bulan', label: '1 Bulan' },
];

const WARNA_SISWA = '#4f7fa8';

// ==================================================
// HELPER
// ==================================================

function formatTanggalPanjang(d) {
  return d.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatJam(d) {
  return d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getFotoUrl(foto) {
  return fotoUrl(foto);
}

// Mengembalikan 'Hari ini' / 'Kemarin' / null
function labelHariRelatif(tgl) {
  const a = new Date(tgl);
  a.setHours(0, 0, 0, 0);

  const b = new Date();
  b.setHours(0, 0, 0, 0);

  const selisih = Math.round((b - a) / (24 * 60 * 60 * 1000));

  if (selisih === 0) return 'Hari ini';
  if (selisih === 1) return 'Kemarin';
  return null;
}

function BadgeRelatif({ tgl }) {
  const label = labelHariRelatif(tgl);
  if (!label) return null;

  return (
    <span
      className={`ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
        label === 'Hari ini'
          ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
      }`}
    >
      {label}
    </span>
  );
}

// Badge untuk siswa yang pendaftarannya sudah dihapus
function BadgeDihapus({ dihapusPada }) {
  if (!dihapusPada) return null;

  return (
    <span className="ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">
      Dihapus
    </span>
  );
}

const inRange = (tgl, mulai, selesai) => {
  const t = new Date(tgl);
  return t >= mulai && t < selesai;
};

// Tooltip grafik (khusus siswa mendaftar)
function TooltipSiswa({ active, payload }) {
  if (!active || !payload?.length) return null;

  const row = payload[0].payload;

  return (
    <div
      style={{
        backgroundColor: '#1f2937',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 12,
        color: '#fff',
      }}
    >
      <p style={{ color: '#9ca3af', marginBottom: 4 }}>{row.tanggalLengkap}</p>
      <p style={{ color: WARNA_SISWA, fontWeight: 600 }}>
        Siswa mendaftar : {row.jumlahSiswa} siswa
      </p>
    </div>
  );
}

// Membuat "keranjang" waktu untuk tiap titik di grafik
function buatBuckets(range, now) {
  if (range === 'hari') {
    // 24 jam terakhir, per jam
    return Array.from({ length: 24 }, (_, i) => {
      const mulai = new Date(now);
      mulai.setHours(now.getHours() - (23 - i), 0, 0, 0);
      const selesai = new Date(mulai.getTime() + 60 * 60 * 1000);
      const jam = String(mulai.getHours()).padStart(2, '0');

      return {
        mulai,
        selesai,
        label: `${jam}:00`,
        tanggalLengkap: `${formatTanggalPanjang(mulai)}, pukul ${jam}:00`,
      };
    });
  }

  const jumlahHari = range === 'bulan' ? 30 : 7;

  return Array.from({ length: jumlahHari }, (_, i) => {
    const mulai = new Date(now);
    mulai.setDate(now.getDate() - (jumlahHari - 1 - i));
    mulai.setHours(0, 0, 0, 0);

    const selesai = new Date(mulai);
    selesai.setDate(mulai.getDate() + 1);

    const label =
      range === 'minggu'
        ? `${NAMA_HARI[mulai.getDay()]} ${mulai.getDate()}/${mulai.getMonth() + 1}`
        : mulai.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });

    return {
      mulai,
      selesai,
      label,
      tanggalLengkap: formatTanggalPanjang(mulai),
    };
  });
}

// ==================================================
// KALENDER REKAPAN UPLOAD FOTO
// ==================================================

const HARI_KALENDER = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

// Warna pill solid sesuai legenda jumlah foto
function kelasPillFoto(n) {
  if (n <= 3) return 'bg-sky-500 text-white';
  if (n <= 7) return 'bg-emerald-500 text-white';
  if (n <= 12) return 'bg-violet-600 text-white';
  if (n <= 20) return 'bg-orange-500 text-white';
  return 'bg-rose-500 text-white';
}

const LEGENDA_FOTO = [
  { label: '1–3 foto', warna: 'bg-sky-500' },
  { label: '4–7 foto', warna: 'bg-emerald-500' },
  { label: '8–12 foto', warna: 'bg-violet-600' },
  { label: '13–20 foto', warna: 'bg-orange-500' },
  { label: '> 20 foto', warna: 'bg-rose-500' },
];

function KalenderFoto({ galeri, tanggalDipilih, onPilihTanggal }) {
  const bulanSekarang = () => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  };
  const [bulanAktif, setBulanAktif] = useState(bulanSekarang);

  // Hitung jumlah foto per tanggal (waktu lokal)
  const perTanggal = useMemo(() => {
    const map = {};
    galeri.forEach((g) => {
      const d = new Date(g.created_at);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [galeri]);

  const tahun = bulanAktif.getFullYear();
  const bulan = bulanAktif.getMonth();

  // Minggu dimulai hari Senin
  const offset = (new Date(tahun, bulan, 1).getDay() + 6) % 7;
  const jumlahHari = new Date(tahun, bulan + 1, 0).getDate();

  const sel = [
    ...Array(offset).fill(null),
    ...Array.from({ length: jumlahHari }, (_, i) => i + 1),
  ];
  while (sel.length % 7 !== 0) sel.push(null);

  const hariIni = new Date();
  const isHariIni = (t) =>
    t === hariIni.getDate() &&
    bulan === hariIni.getMonth() &&
    tahun === hariIni.getFullYear();

  const isDipilih = (t) =>
    tanggalDipilih &&
    t === tanggalDipilih.getDate() &&
    bulan === tanggalDipilih.getMonth() &&
    tahun === tanggalDipilih.getFullYear();

  return (
    <div className="mt-4 bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300">
      {/* JUDUL */}
      <div className="flex items-start gap-3 mb-5">
        <CalendarDays className="w-6 h-6 text-cyan-700 dark:text-cyan-400 mt-0.5" />
        <div>
          <h3 className="text-base font-bold">Rekapan Upload Foto</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Lihat jumlah foto yang diunggah setiap tanggal. Klik tanggal untuk
            melihat fotonya.
          </p>
        </div>
      </div>

      {/* TOMBOL HARI INI + BULAN */}
      <div className="flex items-center gap-3 mb-4">
        <button
          type="button"
          onClick={() => setBulanAktif(bulanSekarang())}
          className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm transition"
        >
          Hari Ini
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setBulanAktif(new Date(tahun, bulan - 1, 1))}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-base font-bold min-w-37.5 text-center">
            {NAMA_BULAN[bulan]} {tahun}
          </span>
          <button
            type="button"
            onClick={() => setBulanAktif(new Date(tahun, bulan + 1, 1))}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* GRID: nama hari di dalam tiap kolom, tanggal di tengah */}
      <div className="grid grid-cols-7 border-t border-l border-gray-200 dark:border-gray-800">
        {sel.map((t, i) => {
          const n = t ? perTanggal[`${tahun}-${bulan}-${t}`] || 0 : 0;
          const dipilih = t && isDipilih(t);

          return (
            <div
              key={i}
              onClick={() => n > 0 && onPilihTanggal(new Date(tahun, bulan, t))}
              className={`min-h-21 sm:min-h-24 px-1.5 pt-1.5 pb-2 border-r border-b border-gray-200 dark:border-gray-800 text-center transition ${
                t ? '' : 'bg-gray-50/60 dark:bg-gray-800/20'
              } ${n > 0 ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50' : ''} ${
                dipilih ? 'ring-2 ring-inset ring-cyan-500' : ''
              }`}
            >
              {/* nama hari hanya di baris pertama */}
              {i < 7 && (
                <div className="text-[10px] text-gray-400 dark:text-gray-500">
                  {HARI_KALENDER[i]}
                </div>
              )}

              {t && (
                <>
                  <div className="flex justify-center mt-0.5">
                    <span
                      className={
                        isHariIni(t)
                          ? 'inline-flex w-6 h-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold'
                          : 'inline-flex w-6 h-6 items-center justify-center text-xs font-semibold text-gray-700 dark:text-gray-200'
                      }
                    >
                      {t}
                    </span>
                  </div>

                  {n > 0 && (
                    <div
                      className={`mt-1.5 flex items-center justify-center gap-1 rounded-md px-1 py-1 text-[11px] sm:text-xs font-semibold ${kelasPillFoto(
                        n
                      )}`}
                    >
                      <Camera className="w-3 h-3 shrink-0" />
                      {n} foto
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* LEGENDA */}
      <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-500 dark:text-gray-400">
        {LEGENDA_FOTO.map((l) => (
          <span key={l.label} className="inline-flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${l.warna}`} />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ==================================================
// POP UP FOTO (lightbox)
// ==================================================

function FotoPopup({ daftar, index, onGanti, onTutup, onBukaGaleri }) {
  const foto = daftar[index];
  const adaPrev = index > 0;
  const adaNext = index < daftar.length - 1;

  // Keyboard: Esc = tutup, panah kiri/kanan = ganti foto
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onTutup();
      else if (e.key === 'ArrowLeft' && adaPrev) onGanti(index - 1);
      else if (e.key === 'ArrowRight' && adaNext) onGanti(index + 1);
    }

    window.addEventListener('keydown', onKey);
    const overflowAwal = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; // halaman di belakang tidak ikut scroll

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflowAwal;
    };
  }, [index, adaPrev, adaNext, onGanti, onTutup]);

  if (!foto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4"
      onClick={onTutup}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-4xl rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-4 sm:p-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* BAR ATAS */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-white/80">
            {index + 1} dari {daftar.length}
          </span>
          <button
            type="button"
            onClick={onTutup}
            title="Tutup"
            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/15 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FOTO + PANAH */}
        <div className="relative flex items-center justify-center">
          <img
            src={getFotoUrl(foto.foto)}
            alt={foto.keterangan || 'Foto galeri'}
            className="max-h-[65vh] w-auto max-w-full rounded-xl object-contain"
          />

          <button
            type="button"
            onClick={() => adaPrev && onGanti(index - 1)}
            disabled={!adaPrev}
            className="absolute left-2 p-2 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => adaNext && onGanti(index + 1)}
            disabled={!adaNext}
            className="absolute right-2 p-2 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* KETERANGAN */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">
              {foto.keterangan || 'Tanpa keterangan'}
            </p>
            <p className="text-xs text-white/70 mt-0.5">
              Diunggah {new Date(foto.created_at).toLocaleString('id-ID')}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onBukaGaleri(foto.id_galeri)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/30 text-white hover:bg-white/15 transition"
          >
            Buka di halaman galeri
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================================================
// HALAMAN UTAMA
// ==================================================

export default function LaporanEskul() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [eskul, setEskul] = useState(null);
  const [pendaftar, setPendaftar] = useState([]);
  const [galeri, setGaleri] = useState([]);
  const [loading, setLoading] = useState(true);

  const [range, setRange] = useState('minggu'); // 'hari' | 'minggu' | 'bulan'
  const [selIdx, setSelIdx] = useState(null); // titik/hari yang dipilih di grafik
  const [selTipe, setSelTipe] = useState(null); // null = riwayat | 'siswa' | 'foto'
  const [tglFoto, setTglFoto] = useState(null); // tanggal yang dipilih di kalender foto
  const [popup, setPopup] = useState(null); // { daftar, index } | null

  useEffect(() => {
    async function fetchData() {
      try {
        const [eskulData, pendaftarData, galeriData] = await Promise.all([
          getDaftarEskul(),
          getRiwayatPendaftarEskul(), // termasuk yang sudah dihapus
          getGaleriEskul(id),
        ]);

        const listEskul = eskulData.data || eskulData || [];
        const found = listEskul.find(
          (e) => String(e.id_eskul) === String(id)
        );
        setEskul(found || null);

        const filtered = (pendaftarData || []).filter(
          (p) => String(p.id_eskul) === String(id)
        );

        filtered.sort(
          (a, b) => new Date(b.tanggal) - new Date(a.tanggal)
        );

        const fotoSorted = [...(galeriData || [])].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );

        setPendaftar(filtered);
        setGaleri(fotoSorted);
      } catch (err) {
        console.error('Gagal mengambil laporan eskul:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  const now = new Date();

  // ---------- DATA GRAFIK (hanya siswa mendaftar) ----------
  const dataGrafik = buatBuckets(range, now).map((b) => ({
    ...b,
    jumlahSiswa: pendaftar.filter((p) => inRange(p.tanggal, b.mulai, b.selesai))
      .length,
  }));

  // ---------- TITIK YANG SEDANG DIPILIH DI GRAFIK ----------
  const activeIdx =
    selIdx !== null && selIdx < dataGrafik.length
      ? selIdx
      : range === 'hari'
      ? null
      : dataGrafik.length - 1;

  const bucketAktif = activeIdx !== null ? dataGrafik[activeIdx] : null;

  const awalHariIni = new Date(now);
  awalHariIni.setHours(0, 0, 0, 0);
  const awalBesok = new Date(awalHariIni);
  awalBesok.setDate(awalBesok.getDate() + 1);

  const aktMulai = bucketAktif ? bucketAktif.mulai : awalHariIni;
  const aktSelesai = bucketAktif ? bucketAktif.selesai : awalBesok;
  const aktLabel = bucketAktif
    ? bucketAktif.tanggalLengkap
    : formatTanggalPanjang(now);
  const aktIsHariIni = aktMulai.toDateString() === now.toDateString();

  const siswaAktif = pendaftar.filter((p) =>
    inRange(p.tanggal, aktMulai, aktSelesai)
  );

  // ---------- FOTO PADA TANGGAL YANG DIPILIH DI KALENDER ----------
  const fotoMulai = tglFoto ? new Date(tglFoto) : awalHariIni;
  fotoMulai.setHours(0, 0, 0, 0);
  const fotoSelesai = new Date(fotoMulai);
  fotoSelesai.setDate(fotoSelesai.getDate() + 1);

  const fotoAktif = galeri.filter((g) =>
    inRange(g.created_at, fotoMulai, fotoSelesai)
  );
  const fotoIsHariIni = fotoMulai.toDateString() === now.toDateString();

  // ---------- AKSI KLIK ----------
  function gantiRange(key) {
    setRange(key);
    setSelIdx(null);
  }

  function pilihSiswa(idx) {
    setSelIdx(idx);
    setSelTipe('siswa');
  }

  function pilihTanggalFoto(tgl) {
    setTglFoto(tgl);
    setSelTipe('foto');
  }

  // Klik di area chart (bukan tepat di titik): pindah ke hari tersebut
  function handleChartClick(state) {
    if (!state) return;

    let idx = state.activeTooltipIndex ?? state.activeIndex;

    if (idx === undefined || idx === null || Number.isNaN(Number(idx))) {
      idx = dataGrafik.findIndex((d) => d.label === state.activeLabel);
    }

    idx = Number(idx);

    if (idx >= 0 && idx < dataGrafik.length) {
      pilihSiswa(idx);
    }
  }

  // Tombol X: tutup detail -> riwayat lengkap tampil lagi
  function tutupDetail() {
    setSelTipe(null);
    setSelIdx(null);
    setTglFoto(null);
  }

  // Titik biru di grafik (bisa diklik -> daftar siswa)
  const renderDot = (props) => {
    const { cx, cy, payload } = props;
    if (cx === undefined || cy === undefined) return null;

    const idx = dataGrafik.findIndex((d) => d.label === payload?.label);
    const terpilih = selTipe === 'siswa' && idx === activeIdx;

    return (
      <g
        key={`siswa-${idx}`}
        onClick={(e) => {
          e.stopPropagation();
          pilihSiswa(idx);
        }}
        style={{ cursor: 'pointer' }}
      >
        {/* area klik */}
        <circle cx={cx} cy={cy} r={12} fill="transparent" />
        <circle
          cx={cx}
          cy={cy}
          r={terpilih ? 7 : 5}
          fill={WARNA_SISWA}
          stroke={terpilih ? '#ffffff' : 'none'}
          strokeWidth={terpilih ? 2 : 0}
        />
      </g>
    );
  };

  // ---------- PERSENTASE (untuk kartu total pendaftar) ----------
  function hitungPersentase() {
    let currentCount = 0;
    let previousCount = 0;
    let labelPembanding = 'periode lalu';

    const hitung = (mulai, selesai) =>
      pendaftar.filter((p) => {
        const t = new Date(p.tanggal);
        return t >= mulai && t <= selesai;
      }).length;

    if (range === 'hari') {
      const startToday = new Date(now);
      startToday.setHours(0, 0, 0, 0);

      const startYesterday = new Date(startToday);
      startYesterday.setDate(startYesterday.getDate() - 1);

      const endYesterday = new Date(startToday);
      endYesterday.setMilliseconds(-1);

      currentCount = hitung(startToday, now);
      previousCount = hitung(startYesterday, endYesterday);
      labelPembanding = 'kemarin';
    } else {
      const jumlahHari = range === 'bulan' ? 30 : 7;

      const startCurrent = new Date(now);
      startCurrent.setDate(startCurrent.getDate() - (jumlahHari - 1));
      startCurrent.setHours(0, 0, 0, 0);

      const startPrev = new Date(startCurrent);
      startPrev.setDate(startPrev.getDate() - jumlahHari);

      const endPrev = new Date(startCurrent);
      endPrev.setMilliseconds(-1);

      currentCount = hitung(startCurrent, now);
      previousCount = hitung(startPrev, endPrev);
      labelPembanding = range === 'bulan' ? 'bulan lalu' : 'minggu lalu';
    }

    const percentChange =
      previousCount > 0
        ? Math.round(((currentCount - previousCount) / previousCount) * 100)
        : currentCount > 0
        ? 100
        : 0;

    return { percentChange, labelPembanding };
  }

  const { percentChange, labelPembanding } = hitungPersentase();

  // Kartu total hanya menghitung siswa yang masih aktif
  const total = pendaftar.filter((p) => !p.dihapus_pada).length;

  const xAxisInterval = range === 'hari' ? 2 : range === 'bulan' ? 3 : 0;

  // Link ke detail foto di halaman galeri
  const slugEskul = (eskul?.nama_eskul || '').trim().replace(/\s+/g, '-');

  // Klik foto -> pop up (bukan pindah halaman).
  // `daftar` = urutan foto yang bisa digeser di pop up.
  function bukaFoto(idGaleri, daftar = galeri) {
    const index = daftar.findIndex((f) => f.id_galeri === idGaleri);
    if (index >= 0) setPopup({ daftar, index });
  }

  function bukaDiGaleri(idGaleri) {
    if (slugEskul) {
      navigate(`/eskul/${slugEskul}/galeri/${idGaleri}`);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
        <p className="text-gray-600 dark:text-gray-300 font-medium">
          Memuat laporan ekstrakurikuler...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 p-6 transition-colors duration-300">

      {/* HEADER */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-xl font-bold">
            Detail Pendaftaran {eskul?.nama_eskul || '...'}
          </h2>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Dashboard &gt; Data Pendaftar &gt; {eskul?.nama_eskul}
          </p>
        </div>
      </div>

      {/* =====================================================
          GRAFIK SISWA TERDAFTAR + REKAPITULASI
      ====================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300">

          {/* JUDUL + TOMBOL FILTER */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <h3 className="text-base font-bold">
              Perkembangan Siswa Terdaftar
            </h3>

            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-full p-1">
              {OPSI_FILTER.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => gantiRange(opt.key)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full transition ${
                    range === opt.key
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* LEGENDA + PETUNJUK */}
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-500 dark:text-gray-400 mb-3">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: WARNA_SISWA }}
              />
              Siswa mendaftar
            </span>
            <span className="ml-auto italic">
              Klik titik biru = daftar siswa yang mendaftar
            </span>
          </div>

          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={dataGrafik}
                margin={{ top: 10, right: 16, left: 0, bottom: 4 }}
                onClick={handleChartClick}
                style={{ cursor: 'pointer' }}
              >
                <defs>
                  <linearGradient id="gradSiswa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={WARNA_SISWA} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={WARNA_SISWA} stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  className="stroke-gray-100 dark:stroke-gray-800"
                />

                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  interval={xAxisInterval}
                  padding={{ left: 16, right: 16 }}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                />

                <Tooltip
                  cursor={{ stroke: '#64748b', strokeDasharray: '3 3' }}
                  content={<TooltipSiswa />}
                />

                {/* Penanda hari yang sedang dipilih */}
                {selTipe === 'siswa' && bucketAktif && (
                  <ReferenceLine
                    x={bucketAktif.label}
                    stroke="#22d3ee"
                    strokeDasharray="4 4"
                    strokeOpacity={0.7}
                  />
                )}

                <Area
                  type="monotone"
                  name="Siswa mendaftar"
                  dataKey="jumlahSiswa"
                  stroke={WARNA_SISWA}
                  strokeWidth={2.5}
                  fill="url(#gradSiswa)"
                  dot={renderDot}
                  activeDot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* REKAPITULASI */}
        <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-center transition-colors duration-300">

          <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-6 text-center">
            Total Pendaftar {eskul?.nama_eskul}
          </h3>

          <div className="flex items-center justify-center gap-4 mb-2">
            <span className="text-6xl font-extrabold">{total}</span>
            <Users
              className="w-12 h-12 text-cyan-700 dark:text-cyan-400"
              strokeWidth={1.5}
            />
          </div>

          <p
            className={`text-sm font-semibold text-center ${
              percentChange >= 0 ? 'text-green-600' : 'text-red-500'
            }`}
          >
            {percentChange >= 0 ? '↑' : '↓'} {Math.abs(percentChange)}%
            dibanding {labelPembanding}
          </p>
        </div>
      </div>

      {/* =====================================================
          KALENDER REKAPAN UPLOAD FOTO
      ====================================================== */}
      <KalenderFoto
        galeri={galeri}
        tanggalDipilih={selTipe === 'foto' ? tglFoto : null}
        onPilihTanggal={pilihTanggalFoto}
      />

      {/* =====================================================
          DETAIL SESUAI YANG DIKLIK
          - titik biru di grafik  -> nama siswa
          - tanggal di kalender   -> foto pada tanggal itu
      ====================================================== */}
      {selTipe === 'siswa' && (
        <div className="mt-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors duration-300">

          <div className="flex flex-wrap items-center justify-between gap-3 p-6 pb-0">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-base font-bold">
                Siswa yang Mendaftar — {aktLabel}
              </h3>

              {aktIsHariIni && (
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-cyan-100 dark:bg-cyan-900/40 text-cyan-800 dark:text-cyan-300">
                  Hari ini
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                {siswaAktif.length} siswa
              </span>
              <button
                onClick={tutupDetail}
                title="Tutup"
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <table className="w-full text-sm mt-4">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                <th className="px-6 py-2">No</th>
                <th className="px-6 py-2">Nama Siswa</th>
                <th className="px-6 py-2">Kelas</th>
                <th className="px-6 py-2">Jam Daftar</th>
              </tr>
            </thead>

            <tbody>
              {siswaAktif.map((p, i) => (
                <tr
                  key={p.id_pendaftaran || i}
                  className="border-b border-gray-50 dark:border-gray-800/60"
                >
                  <td className="px-6 py-3">{i + 1}</td>
                  <td className="px-6 py-3 font-medium">
                    {p.siswa?.nama_siswa || '-'}
                    <BadgeDihapus dihapusPada={p.dihapus_pada} />
                  </td>
                  <td className="px-6 py-3">
                    {p.siswa?.kelasData?.nama_kelas || '-'}
                  </td>
                  <td className="px-6 py-3">
                    {formatJam(new Date(p.tanggal))}
                  </td>
                </tr>
              ))}

              {siswaAktif.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                    Tidak ada siswa yang mendaftar pada waktu ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selTipe === 'foto' && (
        <div className="mt-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 transition-colors duration-300">

          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-base font-bold">
                Foto yang Diunggah — {formatTanggalPanjang(fotoMulai)}
              </h3>

              {fotoIsHariIni && (
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-cyan-100 dark:bg-cyan-900/40 text-cyan-800 dark:text-cyan-300">
                  Hari ini
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                {fotoAktif.length} foto
              </span>
              <button
                onClick={tutupDetail}
                title="Tutup"
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {fotoAktif.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-gray-500 gap-2">
              <ImageIcon className="w-9 h-9" />
              <p className="text-sm">
                Tidak ada foto yang diunggah pada tanggal ini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {fotoAktif.map((f) => (
                <button
                  key={f.id_galeri}
                  type="button"
                  onClick={() => bukaFoto(f.id_galeri, fotoAktif)}
                  className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800"
                  title={f.keterangan || 'Lihat foto'}
                >
                  <img
                    src={getFotoUrl(f.foto)}
                    alt={f.keterangan || 'Foto galeri'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent p-2 text-left">
                    <p className="text-[10px] text-white/90 font-medium">
                      {formatJam(new Date(f.created_at))}
                    </p>

                    {f.keterangan && (
                      <p className="text-[10px] text-white/80 truncate">
                        {f.keterangan}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =====================================================
          RIWAYAT LENGKAP
          Hanya tampil saat tidak ada detail yang dibuka
          (awal masuk halaman, atau setelah klik tombol X)
      ====================================================== */}
      {selTipe === null && (
      <>

      {/* TABEL RIWAYAT SISWA TERDAFTAR */}
      <div className="mt-8 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors duration-300">

        <h3 className="text-base font-bold p-6 pb-0">
          Riwayat Siswa Terdaftar
        </h3>

        <table className="w-full text-sm mt-4">
          <thead>
            <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
              <th className="px-6 py-2">No</th>
              <th className="px-6 py-2">Nama Siswa</th>
              <th className="px-6 py-2">Kelas</th>
              <th className="px-6 py-2">Tanggal Pendaftaran</th>
            </tr>
          </thead>

          <tbody>
            {pendaftar.map((p, i) => (
              <tr
                key={p.id_pendaftaran || i}
                className="border-b border-gray-50 dark:border-gray-800/60"
              >
                <td className="px-6 py-3">{i + 1}</td>
                <td className="px-6 py-3">
                  {p.siswa?.nama_siswa || '-'}
                  <BadgeDihapus dihapusPada={p.dihapus_pada} />
                </td>
                <td className="px-6 py-3">
                  {p.siswa?.kelasData?.nama_kelas || '-'}
                </td>
                <td className="px-6 py-3">
                  {new Date(p.tanggal).toLocaleString('id-ID')}
                  <BadgeRelatif tgl={p.tanggal} />
                </td>
              </tr>
            ))}

            {pendaftar.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-6 text-center text-gray-400">
                  Belum ada pendaftar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* TABEL RIWAYAT FOTO YANG DIUNGGAH */}
      <div className="mt-8 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors duration-300">

        <h3 className="text-base font-bold p-6 pb-0">
          Riwayat Foto yang Diunggah
        </h3>

        <table className="w-full text-sm mt-4">
          <thead>
            <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
              <th className="px-6 py-2">No</th>
              <th className="px-6 py-2">Foto</th>
              <th className="px-6 py-2">Keterangan</th>
              <th className="px-6 py-2">Tanggal Upload</th>
            </tr>
          </thead>

          <tbody>
            {galeri.map((f, i) => (
              <tr
                key={f.id_galeri || i}
                onClick={() => bukaFoto(f.id_galeri)}
                className="border-b border-gray-50 dark:border-gray-800/60 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
              >
                <td className="px-6 py-3">{i + 1}</td>
                <td className="px-6 py-3">
                  <img
                    src={getFotoUrl(f.foto)}
                    alt={f.keterangan || 'Foto galeri'}
                    className="w-12 h-12 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                  />
                </td>
                <td className="px-6 py-3">
                  {f.keterangan || 'Tanpa keterangan'}
                </td>
                <td className="px-6 py-3">
                  {new Date(f.created_at).toLocaleString('id-ID')}
                  <BadgeRelatif tgl={f.created_at} />
                </td>
              </tr>
            ))}

            {galeri.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-6 text-center text-gray-400">
                  Belum ada foto yang diunggah.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </>
      )}

      {/* POP UP FOTO */}
      {popup && (
        <FotoPopup
          daftar={popup.daftar}
          index={popup.index}
          onGanti={(i) => setPopup((p) => ({ ...p, index: i }))}
          onTutup={() => setPopup(null)}
          onBukaGaleri={bukaDiGaleri}
        />
      )}
    </div>
  );
}