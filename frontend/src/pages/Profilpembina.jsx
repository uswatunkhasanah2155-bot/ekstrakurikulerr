// src/pages/ProfilPembina.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Mail,
  BookOpen,
  CalendarDays,
  UserRound,
  Pencil,
  ShieldCheck,
  Lock,
  Check,
  X,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { getProfilSaya, updateProfilSaya } from '../services/profilApi';
import { fotoUrl } from '../utils/fotoUrl';

const MAX_FOTO = 2 * 1024 * 1024; // 2 MB, sama dengan batas backend

const formatTanggal = (iso) => {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export default function ProfilPembina() {
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [profil, setProfil] = useState(null);
  const [loading, setLoading] = useState(true);

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ nama: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pesan, setPesan] = useState(null); // { tipe: 'sukses' | 'error', teks }

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      const data = await getProfilSaya();
      if (!cancelled) {
        setProfil(data);
        setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  const tampilkanPesan = (tipe, teks) => {
    setPesan({ tipe, teks });
    setTimeout(() => setPesan(null), 3000);
  };

  const namaTampil = profil?.nama || profil?.username || '-';
  const inisial = String(namaTampil).charAt(0).toUpperCase();
  const urlFoto = fotoUrl(profil?.foto);

  const namaEskul = profil?.eskul?.nama_eskul;
  const slugEskul = (namaEskul || '').trim().toLowerCase().replace(/\s+/g, '-');

  // ---------- Edit nama & email ----------
  const mulaiEdit = () => {
    setForm({ nama: profil?.nama || '', email: profil?.email || '' });
    setEditMode(true);
  };

  const batalEdit = () => setEditMode(false);

  const simpan = async () => {
    setSaving(true);
    const res = await updateProfilSaya({
      nama: form.nama,
      email: form.email,
    });
    setSaving(false);

    if (res.success) {
      setProfil(res.data);
      setEditMode(false);
      window.dispatchEvent(new Event('profil-updated'));
      tampilkanPesan('sukses', 'Profil berhasil diperbarui.');
    } else {
      tampilkanPesan('error', res.error);
    }
  };

  // ---------- Ganti foto ----------
  const pilihFoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      tampilkanPesan('error', 'Hanya file gambar yang diizinkan.');
      return;
    }
    if (file.size > MAX_FOTO) {
      tampilkanPesan('error', 'Ukuran foto maksimal 2 MB.');
      return;
    }

    setUploading(true);
    const res = await updateProfilSaya({ foto: file });
    setUploading(false);

    if (res.success) {
      setProfil(res.data);
      window.dispatchEvent(new Event('profil-updated'));
      tampilkanPesan('sukses', 'Foto profil berhasil diperbarui.');
    } else {
      tampilkanPesan('error', res.error);
    }
  };

  // ---------- Style ----------
  const card =
    'rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900';
  const label = 'mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400';
  const input =
    'w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100';
  const valueBox =
    'w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-100';

  const infoAkun = [
    { icon: UserRound, label: 'Role', value: 'Pembina' },
    { icon: UserRound, label: 'Username', value: profil?.username || '-' },
    { icon: BookOpen, label: 'Eskul yang dibina', value: namaEskul || '-' },
    { icon: CalendarDays, label: 'Jadwal latihan', value: profil?.eskul?.jadwal || 'Belum diatur' },
    { icon: CalendarDays, label: 'Terdaftar sejak', value: formatTanggal(profil?.created_at) },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800 transition-colors duration-300 dark:bg-gray-950 dark:text-gray-100">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-6">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            title="Kembali"
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Profil Saya</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Kelola informasi akun dan data pribadi Anda.
            </p>
          </div>
        </div>

        {pesan && (
          <div
            className={`mb-4 rounded-lg px-4 py-3 text-sm font-medium ${
              pesan.tipe === 'sukses'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
            }`}
          >
            {pesan.teks}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Memuat profil...</p>
        ) : !profil ? (
          <p className="text-sm text-red-500">Profil tidak dapat dimuat.</p>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Kartu kiri: foto & ringkasan */}
              <div className={`${card} flex flex-col items-center text-center`}>
                <div className="relative">
                  <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-full bg-blue-500/15 text-5xl font-bold text-blue-600 dark:text-blue-400">
                    {urlFoto ? (
                      <img src={urlFoto} alt={namaTampil} className="h-full w-full object-cover" />
                    ) : (
                      inisial
                    )}
                  </div>

                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    title="Ganti foto"
                    className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white shadow hover:bg-blue-700 disabled:opacity-60"
                  >
                    <Camera className="h-4 w-4" />
                  </button>

                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={pilihFoto}
                    className="hidden"
                  />
                </div>

                {uploading && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Mengunggah foto...</p>
                )}

                <p className="mt-4 text-xl font-bold text-gray-900 dark:text-white">{namaTampil}</p>
                <span className="mt-1 inline-block rounded-full bg-cyan-100 px-2 py-0.5 text-[11px] font-semibold text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300">
                  Pembina
                </span>

                <div className="mt-5 w-full space-y-3 text-left text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 shrink-0 text-gray-400" />
                    <span className="truncate">{profil.email || 'Email belum diisi'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-4 w-4 shrink-0 text-gray-400" />
                    <span className="truncate">{namaEskul || 'Belum ada eskul'}</span>
                  </div>
                </div>
              </div>

              {/* Kartu kanan: informasi pribadi */}
              <div className={`${card} lg:col-span-2`}>
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <UserRound className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-lg font-bold">Informasi Pribadi</h3>
                  </div>

                  {!editMode && (
                    <button
                      onClick={mulaiEdit}
                      className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Ubah Profil
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className={label}>Nama Lengkap</label>
                    {editMode ? (
                      <input
                        value={form.nama}
                        onChange={(e) => setForm({ ...form, nama: e.target.value })}
                        maxLength={100}
                        placeholder="Masukkan nama lengkap"
                        className={input}
                      />
                    ) : (
                      <div className={valueBox}>{profil.nama || '-'}</div>
                    )}
                  </div>

                  <div>
                    <label className={label}>Email</label>
                    {editMode ? (
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="nama@sekolah.sch.id"
                        className={input}
                      />
                    ) : (
                      <div className={valueBox}>{profil.email || '-'}</div>
                    )}
                  </div>
                </div>

                {editMode && (
                  <div className="mt-5 flex justify-end gap-2">
                    <button
                      onClick={batalEdit}
                      disabled={saving}
                      className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                    >
                      <X className="h-4 w-4" />
                      Batal
                    </button>
                    <button
                      onClick={simpan}
                      disabled={saving}
                      className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                      <Check className="h-4 w-4" />
                      {saving ? 'Menyimpan...' : 'Simpan'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Informasi akun */}
            <div className={card}>
              <div className="mb-4 flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-bold">Informasi Akun</h3>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {infoAkun.map(({ icon: Icon, label: l, value }) => (
                  <div key={l} className="flex items-center gap-3 py-3">
                    <Icon className="h-4 w-4 shrink-0 text-gray-400" />
                    <span className="w-40 shrink-0 text-sm text-gray-500 dark:text-gray-400">{l}</span>
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <Lock className="h-4 w-4" />
                  Keamanan akun Anda terjaga dengan baik.
                </div>

                {slugEskul && (
                  <button
                    onClick={() => navigate(`/eskul/${slugEskul}`)}
                    className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Buka halaman eskul <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}