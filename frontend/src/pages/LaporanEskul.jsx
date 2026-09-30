// src/pages/LaporanEskul.jsx
import React, { useState, useEffect } from 'react';
import { fotoUrl } from '../utils/fotoUrl';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, ImageIcon, X } from 'lucide-react';
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
  getPendaftarEskul,
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
const WARNA_FOTO = '#f59e0b';

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

const inRange = (tgl, mulai, selesai) => {
  const t = new Date(tgl);
  return t >= mulai && t < selesai;
};

// Tooltip yang hanya menampilkan SATU jenis data,
// sesuai titik yang sedang di-hover (biru = siswa, kuning = foto)
function TooltipSatu({ active, payload, tipe }) {
  if (!active || !payload?.length || !tipe) return null;

  const row = payload[0].payload;
  const isSiswa = tipe === 'siswa';
  const warna = isSiswa ? WARNA_SISWA : WARNA_FOTO;
  const jumlah = isSiswa ? row.jumlahSiswa : row.jumlahFoto;

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
      <p style={{ color: warna, fontWeight: 600 }}>
        {isSiswa ? 'Siswa mendaftar' : 'Foto diunggah'} : {jumlah}{' '}
        {isSiswa ? 'siswa' : 'foto'}
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
  const [selIdx, setSelIdx] = useState(null); // titik/hari yang dipilih
  const [selTipe, setSelTipe] = useState(null); // null = tampilkan riwayat | 'siswa' | 'foto'
  const [hoverTipe, setHoverTipe] = useState(null); // titik yang sedang di-hover: 'siswa' | 'foto'

  useEffect(() => {
    async function fetchData() {
      try {
        const [eskulData, pendaftarData, galeriData] = await Promise.all([
          getDaftarEskul(),
          getPendaftarEskul(),
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

  // ---------- DATA GRAFIK GABUNGAN (siswa + foto) ----------
  const dataGrafik = buatBuckets(range, now).map((b) => ({
    ...b,
    jumlahSiswa: pendaftar.filter((p) => inRange(p.tanggal, b.mulai, b.selesai))
      .length,
    jumlahFoto: galeri.filter((g) => inRange(g.created_at, b.mulai, b.selesai))
      .length,
  }));

  // ---------- TITIK YANG SEDANG DIPILIH (default: hari ini) ----------
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

  const fotoAktif = galeri.filter((g) =>
    inRange(g.created_at, aktMulai, aktSelesai)
  );

  // ---------- AKSI KLIK ----------
  function pilih(idx, tipe) {
    setSelIdx(idx);
    if (tipe) setSelTipe(tipe);
  }

  function gantiRange(key) {
    setRange(key);
    setSelIdx(null);
  }

  // Klik di area chart (bukan tepat di titik): hanya pindah hari
  function handleChartClick(state) {
    if (!state) return;

    let idx = state.activeTooltipIndex ?? state.activeIndex;

    if (idx === undefined || idx === null || Number.isNaN(Number(idx))) {
      idx = dataGrafik.findIndex((d) => d.label === state.activeLabel);
    }

    idx = Number(idx);

    if (idx >= 0 && idx < dataGrafik.length) {
      setSelIdx(idx);
      setSelTipe((prev) => prev ?? 'siswa');
    }
  }

  // Tombol X: tutup detail -> riwayat lengkap tampil lagi
  function tutupDetail() {
    setSelTipe(null);
    setSelIdx(null);
  }

  // Titik yang bisa di-hover & diklik: titik biru -> siswa, titik kuning -> foto
  const renderDot = (tipe, warna, radius) => (props) => {
    const { cx, cy, payload } = props;
    if (cx === undefined || cy === undefined) return null;

    const idx = dataGrafik.findIndex((d) => d.label === payload?.label);
    const terpilih = selTipe === tipe && idx === activeIdx;

    // Kalau jumlah siswa & foto sama, kedua titik menumpuk di tempat yang sama.
    // Supaya keduanya tetap bisa di-hover/klik, titik foto digambar
    // sebagai cincin kuning yang mengelilingi titik biru.
    const menumpuk = payload?.jumlahSiswa === payload?.jumlahFoto;

    const handlers = {
      onClick: (e) => {
        e.stopPropagation();
        pilih(idx, tipe);
      },
      onMouseEnter: () => setHoverTipe(tipe),
      onMouseLeave: () => setHoverTipe(null),
    };

    if (menumpuk && tipe === 'foto') {
      const rr = 10;

      return (
        <g key={`${tipe}-${idx}`} {...handlers} style={{ cursor: 'pointer' }}>
          <circle
            cx={cx}
            cy={cy}
            r={rr}
            fill="none"
            stroke="transparent"
            strokeWidth={8}
            pointerEvents="stroke"
          />
          <circle
            cx={cx}
            cy={cy}
            r={rr}
            fill="none"
            stroke={warna}
            strokeWidth={terpilih ? 3.5 : 2.5}
            pointerEvents="none"
          />
        </g>
      );
    }

    const hit = menumpuk ? radius + 2 : radius + 7;

    return (
      <g key={`${tipe}-${idx}`} {...handlers} style={{ cursor: 'pointer' }}>
        {/* area klik */}
        <circle cx={cx} cy={cy} r={hit} fill="transparent" />
        <circle
          cx={cx}
          cy={cy}
          r={terpilih ? radius + 2 : radius}
          fill={warna}
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
  const total = pendaftar.length;

  const xAxisInterval = range === 'hari' ? 2 : range === 'bulan' ? 3 : 0;

  // Link ke detail foto di halaman galeri
  const slugEskul = (eskul?.nama_eskul || '').trim().replace(/\s+/g, '-');

  function bukaFoto(idGaleri) {
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
          GRAFIK GABUNGAN + REKAPITULASI
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
            <span className="inline-flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: WARNA_FOTO }}
              />
              Foto diunggah
            </span>
            <span className="ml-auto italic">
              Klik titik biru = daftar siswa · klik titik kuning (atau cincin kuning) = foto
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
                  <linearGradient id="gradFoto" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={WARNA_FOTO} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={WARNA_FOTO} stopOpacity={0} />
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
                  cursor={
                    hoverTipe
                      ? { stroke: '#64748b', strokeDasharray: '3 3' }
                      : false
                  }
                  content={<TooltipSatu tipe={hoverTipe} />}
                />

                {/* Penanda hari yang sedang dipilih */}
                {selTipe && bucketAktif && (
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
                  dot={renderDot('siswa', WARNA_SISWA, 5)}
                  activeDot={false}
                />

                <Area
                  type="monotone"
                  name="Foto diunggah"
                  dataKey="jumlahFoto"
                  stroke={WARNA_FOTO}
                  strokeWidth={2}
                  fill="url(#gradFoto)"
                  dot={renderDot('foto', WARNA_FOTO, 4)}
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
          DETAIL SESUAI TITIK YANG DIKLIK
          - titik biru  -> HANYA nama siswa
          - titik kuning -> HANYA foto
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
                Foto yang Diunggah — {aktLabel}
              </h3>

              {aktIsHariIni && (
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
                Tidak ada foto yang diunggah pada waktu ini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {fotoAktif.map((f) => (
                <button
                  key={f.id_galeri}
                  type="button"
                  onClick={() => bukaFoto(f.id_galeri)}
                  className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800"
                  title={f.keterangan || 'Lihat foto'}
                >
                  <img
                    src={getFotoUrl(f.foto)}
                    alt={f.keterangan || 'Foto galeri'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-left">
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
    </div>
  );
}