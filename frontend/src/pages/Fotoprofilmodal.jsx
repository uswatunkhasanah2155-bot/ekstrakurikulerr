// src/pages/Fotoprofilmodal.jsx
import { useEffect, useRef, useState } from 'react';
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  convertToPixelCrop,
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { X } from 'lucide-react';

/**
 * Modal preview + crop bebas untuk foto profil.
 * Kotak potong bisa digeser dan ditarik dari sudut/sisinya sesuai keinginan.
 *
 * Props:
 *  - file:     File dari <input type="file">
 *  - judul:    (opsional) judul modal
 *  - onCancel: () => void
 *  - onSave:   (fotoHasilCrop: File) => Promise<void> | void
 */
export default function FotoProfilModal({
  file,
  onCancel,
  onSave,
  judul = 'Sesuaikan foto profil',
}) {
  const imgRef = useRef(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const [aspect, setAspect] = useState(undefined); // undefined = bebas
  const [circle, setCircle] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const applyCrop = (newAspect, width, height) => {
    const next = newAspect
      ? centerCrop(
          makeAspectCrop({ unit: '%', width: 80 }, newAspect, width, height),
          width,
          height
        )
      : centerCrop({ unit: '%', width: 80, height: 80 }, width, height);
    setCrop(next);
    setCompletedCrop(convertToPixelCrop(next, width, height));
  };

  // Kotak potong awal: di tengah, 80% dari foto
  const handleImageLoad = (e) => {
    const { width, height } = e.currentTarget;
    applyCrop(undefined, width, height);
  };

  const pilihBentuk = (newAspect, bulat) => {
    setAspect(newAspect);
    setCircle(bulat);
    const img = imgRef.current;
    if (img) applyCrop(newAspect, img.width, img.height);
  };

  const handleSave = async () => {
    const img = imgRef.current;
    if (!img || !completedCrop?.width || !completedCrop?.height) return;
    setSaving(true);
    try {
      const blob = await cropToBlob(img, completedCrop);
      const hasil = new File([blob], 'foto-profil.jpg', { type: 'image/jpeg' });
      await onSave(hasil);
    } finally {
      setSaving(false);
    }
  };

  if (!file || !imageSrc) return null;

  const opsiBentuk = [
    { label: 'Bebas', aspect: undefined, bulat: false },
    { label: '1:1', aspect: 1, bulat: false },
    { label: 'Lingkaran', aspect: 1, bulat: true },
    { label: '4:3', aspect: 4 / 3, bulat: false },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {judul}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            aria-label="Tutup"
          >
            <X size={20} />
          </button>
        </div>

        {/* Area crop */}
        <div className="flex flex-1 items-center justify-center overflow-auto bg-gray-100 p-4 dark:bg-gray-950">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(pixelCrop) => setCompletedCrop(pixelCrop)}
            aspect={aspect}
            circularCrop={circle}
            minWidth={40}
            minHeight={40}
            keepSelection
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Pratinjau foto"
              onLoad={handleImageLoad}
              style={{ maxHeight: '50vh', maxWidth: '100%' }}
            />
          </ReactCrop>
        </div>

        {/* Pilihan bentuk */}
        <div className="space-y-2 px-5 py-4">
          <div className="flex flex-wrap gap-2">
            {opsiBentuk.map((o) => {
              const aktif = aspect === o.aspect && circle === o.bulat;
              return (
                <button
                  key={o.label}
                  type="button"
                  onClick={() => pilihBentuk(o.aspect, o.bulat)}
                  className={
                    'rounded-lg border px-3 py-1.5 text-sm ' +
                    (aktif
                      ? 'border-blue-600 bg-blue-50 font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800')
                  }
                >
                  {o.label}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Geser kotak untuk memindahkan area, tarik sudut atau sisinya untuk
            mengubah ukuran.
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4 dark:border-gray-800">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? 'Menyimpan...' : 'Simpan foto'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Helper: potong gambar sesuai kotak crop ---------- */

function cropToBlob(image, pixelCrop, maxSide = 1024) {
  // Koordinat crop dihitung dari ukuran tampil; konversi ke ukuran asli foto
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  const srcW = pixelCrop.width * scaleX;
  const srcH = pixelCrop.height * scaleY;

  // Batasi sisi terpanjang supaya file tidak terlalu besar
  const ratio = Math.min(1, maxSide / Math.max(srcW, srcH));
  const outW = Math.round(srcW * ratio);
  const outH = Math.round(srcH * ratio);

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  canvas
    .getContext('2d')
    .drawImage(
      image,
      pixelCrop.x * scaleX,
      pixelCrop.y * scaleY,
      srcW,
      srcH,
      0,
      0,
      outW,
      outH
    );

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Gagal memotong foto'))),
      'image/jpeg',
      0.9
    )
  );
}