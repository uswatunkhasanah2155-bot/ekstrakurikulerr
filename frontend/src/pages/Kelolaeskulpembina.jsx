// src/pages/KelolaEskulPembina.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { fotoUrl } from '../utils/fotoUrl';
import { API_URL } from '../config';
import {
  getDaftarEskul,
  getGaleriEskul,
  setFotoUtamaGaleri,
  handleUnauthorized
} from '../services/api';
import {
  Settings,
  Pencil,
  Calendar,
  User,
  Image as ImageIcon,
  Award,
  Upload,
  X
} from 'lucide-react';

const API_ESKUL = `${API_URL}/api/eskul`;

const TIPE_LOGO = ['image/jpeg', 'image/png', 'image/webp'];
const MAKS_UKURAN_LOGO = 2 * 1024 * 1024; // 2 MB

async function updateEskul(id, formData) {
  const token = localStorage.getItem('token');

  try {
    const response = await fetch(`${API_ESKUL}/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });

    if (handleUnauthorized(response)) {
      return { success: false, error: 'Sesi berakhir, silakan login lagi.' };
    }

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.message || 'Gagal menyimpan data' };
    }

    return { success: true, data: result };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function buatFormData(eskul, perubahan = {}, fileFoto = null) {
  const data = {
    nama_eskul: eskul.nama_eskul || '',
    deskripsi: eskul.deskripsi || '',
    pembina: eskul.pembina || '',
    jadwal: eskul.jadwal || '',
    ...perubahan
  };

  const fd = new FormData();
  Object.entries(data).forEach(([key, value]) => fd.append(key, value ?? ''));
  if (fileFoto) fd.append('foto', fileFoto);
  return fd;
}

function Panel({ title, icon: Icon, action, children, className = '' }) {
  return (
    <section className={`bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm ${className}`}>
      <header className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
          {Icon && <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
          {title}
        </h3>
        {action}
      </header>
      <div className="p-5 flex-1 flex flex-col">{children}</div>
    </section>
  );
}

export default function KelolaEskulPembina() {
  const navigate = useNavigate();
  const idEskul = localStorage.getItem('id_eskul');

  const [loading, setLoading] = useState(true);
  const [eskul, setEskul] = useState(null);
  const [galeri, setGaleri] = useState([]);

  // modal edit terpisah: 'deskripsi', 'jadwal', atau null
  const [editType, setEditType] = useState(null);
  const [form, setForm] = useState({ deskripsi: '', jadwal: '' });
  const [saving, setSaving] = useState(false);

  // modal pilih foto utama
  const [pickerOpen, setPickerOpen] = useState(false);
  const [settingId, setSettingId] = useState(null);

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [notif, setNotif] = useState(null); // { type: 'success' | 'error', text }

  const tampilkanNotif = (type, text) => {
    setNotif({ type, text });
    setTimeout(() => setNotif(null), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDaftarEskul();
      const list = data?.data || data || [];
      const found =
        list.find(e => String(e.id_eskul || e.id) === String(idEskul)) || null;
      setEskul(found);

      if (found) {
        const foto = await getGaleriEskul(found.id_eskul || found.id);
        setGaleri(foto || []);
      } else {
        setGaleri([]);
      }
    } catch (err) {
      console.error('Gagal memuat data eskul:', err);
      setEskul(null);
      setGaleri([]);
    }
    setLoading(false);
  }, [idEskul]);

  useEffect(() => {
    load();
  }, [load]);

  const namaEskul = eskul?.nama_eskul || '';
  const fotoUtama = galeri.find(f => f.is_featured) || null;
  const namaPembina = eskul?.pembina || '-';
  const rowId = eskul?.id_eskul || eskul?.id;

  // slug untuk link ke halaman galeri (sebelumnya variabel ini tidak ada)
  const slug = namaEskul.trim().replace(/\s+/g, '-');

  const fotoCoverUrl = fotoUrl(fotoUtama?.foto);
  const fotoLogoUrl = fotoUrl(eskul?.foto);

  // ---------- buka modal edit berdasarkan tipe ----------
  const bukaEditDeskripsi = () => {
    setForm({
      deskripsi: eskul?.deskripsi || '',
      jadwal: eskul?.jadwal || ''
    });
    setEditType('deskripsi');
  };

  const bukaEditJadwal = () => {
    setForm({
      deskripsi: eskul?.deskripsi || '',
      jadwal: eskul?.jadwal || ''
    });
    setEditType('jadwal');
  };

  const simpanEdit = async e => {
    e.preventDefault();
    if (!eskul) return;
    setSaving(true);

    const perubahan = editType === 'deskripsi'
      ? { deskripsi: form.deskripsi }
      : { jadwal: form.jadwal };

    const fd = buatFormData(eskul, perubahan);

    const result = await updateEskul(rowId, fd);
    setSaving(false);

    if (result?.success) {
      setEskul(prev => ({ ...prev, ...perubahan }));
      setEditType(null);
      tampilkanNotif('success', 'Perubahan berhasil disimpan.');
    } else {
      tampilkanNotif('error', 'Gagal menyimpan: ' + (result?.error || 'Terjadi kesalahan'));
    }
  };

  // ---------- ubah logo ----------
  const handleUbahLogo = async e => {
    const file = e.target.files?.[0];
    e.target.value = ''; // supaya file yang sama bisa dipilih lagi
    if (!file || !eskul) return;

    if (!TIPE_LOGO.includes(file.type)) {
      tampilkanNotif('error', 'Logo harus berupa gambar JPG, PNG, atau WEBP.');
      return;
    }

    if (file.size > MAKS_UKURAN_LOGO) {
      tampilkanNotif('error', 'Ukuran logo maksimal 2 MB.');
      return;
    }

    setUploadingLogo(true);
    const fd = buatFormData(eskul, {}, file);

    const result = await updateEskul(rowId, fd);
    setUploadingLogo(false);

    if (result?.success) {
      await load();
      tampilkanNotif('success', 'Logo berhasil diperbarui.');
    } else {
      console.error('Gagal mengubah logo:', result?.error);
      tampilkanNotif('error', 'Gagal mengubah logo: ' + (result?.error || 'Terjadi kesalahan'));
    }
  };

  // ---------- ganti foto utama (banner) ----------
  const pilihFotoUtama = async idGaleri => {
    setSettingId(idGaleri);
    try {
      const result = await setFotoUtamaGaleri(idGaleri);
      if (result?.success) {
        setGaleri(prev =>
          prev.map(f => ({ ...f, is_featured: f.id_galeri === idGaleri }))
        );
        setPickerOpen(false);
      } else {
        tampilkanNotif('error', 'Gagal mengubah foto utama: ' + (result?.error || 'Terjadi kesalahan'));
      }
    } catch (err) {
      console.error(err);
      tampilkanNotif('error', 'Terjadi kesalahan pada server.');
    } finally {
      setSettingId(null);
    }
  };

  const btnEdit =
    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors';

  // ---------- panel-panel ----------
  const panelInformasi = (
    <Panel
      title="Informasi Ekstrakurikuler"
      icon={Pencil}
      action={
        <button onClick={bukaEditDeskripsi} className={btnEdit}>
          <Pencil className="w-3.5 h-3.5" /> Edit
        </button>
      }
    >
      <dl className="space-y-4 text-sm">
        <div>
          <dt className="text-xs text-gray-500 dark:text-gray-400 mb-1">Nama Ekstrakurikuler</dt>
          <dd className="font-semibold text-gray-900 dark:text-white">{namaEskul}</dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500 dark:text-gray-400 mb-1">Deskripsi</dt>
          <dd className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
            {eskul?.deskripsi || 'Belum ada deskripsi.'}
          </dd>
        </div>
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <User className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-500 dark:text-gray-400">Pembina:</span>
          <span className="font-medium">{namaPembina}</span>
        </div>
      </dl>
    </Panel>
  );

  const panelJadwal = (
    <Panel
      title="Jadwal Latihan"
      icon={Calendar}
      action={
        <button onClick={bukaEditJadwal} className={btnEdit}>
          <Pencil className="w-3.5 h-3.5" /> Edit
        </button>
      }
    >
      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
        {eskul?.jadwal || 'Belum ada jadwal latihan.'}
      </p>
    </Panel>
  );

  const panelLogoFoto = (
    <Panel
      title="Logo & Foto Utama"
      icon={ImageIcon}
      className="h-full flex flex-col justify-between"
    >
      <div className="space-y-5 flex-1 flex flex-col justify-between">
        {/* LOGO (bentuk sama dengan halaman detail: kotak membulat) */}
        <div className="flex items-center justify-between gap-3">
          <div className="w-20 h-20 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex items-center justify-center shrink-0 p-1">
            {fotoLogoUrl ? (
              <img
                key={eskul.foto}
                src={fotoLogoUrl}
                alt={`Logo ${namaEskul}`}
                className="w-full h-full object-contain"
                onError={e => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <ImageIcon className="w-6 h-6 text-gray-400" />
            )}
          </div>

          <label
            className={`${btnEdit} ${uploadingLogo ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <Upload className="w-3.5 h-3.5" />
            {uploadingLogo ? 'Mengunggah...' : 'Ubah Logo'}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleUbahLogo}
              disabled={uploadingLogo}
            />
          </label>
        </div>

        {/* FOTO UTAMA */}
        <div className="flex-1 flex flex-col justify-end pt-2">
          <div className="aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center">
            {fotoCoverUrl ? (
              <img
                src={fotoCoverUrl}
                alt={fotoUtama?.keterangan || 'Foto utama'}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs text-gray-400">Belum ada foto utama</span>
            )}
          </div>

          <button
            onClick={() => setPickerOpen(true)}
            className={`${btnEdit} w-full justify-center mt-3`}
          >
            <Award className="w-3.5 h-3.5" /> Ganti Foto Utama
          </button>
        </div>
      </div>
    </Panel>
  );

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 transition-colors duration-300">
      <Sidebar />

      <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
        {/* JUDUL HALAMAN */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white">
              Kelola Eskul
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Kelola informasi ekstrakurikuler {namaEskul}, jadwal, dan foto utama.
            </p>
          </div>
        </div>

        {/* NOTIFIKASI */}
        {notif && (
          <div
            className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
              notif.type === 'success'
                ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300'
                : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300'
            }`}
          >
            {notif.text}
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-sm text-gray-400">Memuat data eskul...</div>
        ) : !eskul ? (
          <div className="p-12 text-center text-sm text-gray-400">
            Eskul yang kamu bina tidak ditemukan.
          </div>
        ) : (
          <>
            {/* HEADER: sama dengan halaman detail eskul (admin & siswa) */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-md overflow-hidden mb-6">
              <div className="relative h-48 sm:h-64 bg-gray-100 dark:bg-gray-800">
                {fotoCoverUrl ? (
                  <img
                    src={fotoCoverUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={e => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-linear-to-br from-emerald-100 to-emerald-50 dark:from-emerald-950/60 dark:to-gray-900" />
                )}

                <div className="absolute inset-0 bg-linear-to-t from-black/25 via-transparent to-black/10" />

                {/* Logo menumpang di pojok kiri bawah sampul */}
                <div className="absolute -bottom-12 left-6 w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-white dark:bg-gray-800 border-4 border-white dark:border-gray-900 shadow-xl overflow-hidden flex items-center justify-center text-gray-400 dark:text-gray-500 text-[10px] font-medium text-center p-1">
                  {fotoLogoUrl ? (
                    <img
                      key={eskul.foto}
                      src={fotoLogoUrl}
                      alt={namaEskul}
                      className="w-full h-full object-contain"
                      onError={e => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <span>{namaEskul}</span>
                  )}
                </div>
              </div>

              <div className="pt-16 px-6 pb-6">
                <h2 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                  {namaEskul}
                </h2>
                <span className="inline-block mt-2 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                  Aktif
                </span>
              </div>
            </div>

            {/* KONTEN UTAMA */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              <div className="lg:col-span-2 space-y-6 flex flex-col">
                {panelInformasi}
                {panelJadwal}
              </div>
              <div className="flex flex-col">
                {panelLogoFoto}
              </div>
            </div>
          </>
        )}
      </main>

      {/* MODAL EDIT */}
      {editType && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-800">
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 dark:text-white text-base">
                {editType === 'deskripsi' ? 'Edit Deskripsi Eskul' : 'Edit Jadwal Latihan'}
              </h3>
              <button
                onClick={() => setEditType(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={simpanEdit} className="p-6 space-y-4">
              {editType === 'deskripsi' ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                    Deskripsi
                  </label>
                  <textarea
                    rows={6}
                    value={form.deskripsi}
                    onChange={e => setForm(f => ({ ...f, deskripsi: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm outline-none bg-white dark:bg-gray-800 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                    Jadwal Latihan
                  </label>
                  <input
                    type="text"
                    value={form.jadwal}
                    onChange={e => setForm(f => ({ ...f, jadwal: e.target.value }))}
                    placeholder="Contoh: Senin & Kamis, 15:30 WIB"
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm outline-none bg-white dark:bg-gray-800 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              <div className="pt-2 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setEditType(null)}
                  className="px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PILIH FOTO UTAMA */}
      {pickerOpen && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-gray-100 dark:border-gray-800">
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 dark:text-white text-base">
                Pilih Foto Utama
              </h3>
              <button
                onClick={() => setPickerOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto">
              {galeri.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-10">
                  Belum ada foto di galeri. Upload foto dulu, lalu pilih sebagai foto utama.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {galeri.map(item => (
                    <button
                      key={item.id_galeri}
                      onClick={() => pilihFotoUtama(item.id_galeri)}
                      disabled={settingId !== null}
                      className={`relative aspect-16/10 rounded-xl overflow-hidden border-2 transition disabled:opacity-60 ${
                        item.is_featured
                          ? 'border-emerald-500'
                          : 'border-transparent hover:border-emerald-300'
                      }`}
                    >
                      <img
                        src={fotoUrl(item.foto)}
                        alt={item.keterangan || 'Foto galeri'}
                        className="w-full h-full object-cover"
                      />
                      {item.is_featured && (
                        <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Award className="w-3 h-3" /> Utama
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
              <button
                onClick={() => navigate(`/eskul/${slug}/galeri/upload`)}
                className="px-4 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl transition"
              >
                + Upload foto baru
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}