import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Banner foto yang bisa digeser (swipe di HP, drag pakai mouse di laptop),
 * ada tombol panah, titik indikator, dan geser otomatis tiap beberapa detik.
 *
 * Props:
 *  - images   : array URL foto, contoh ["/uploads/a.jpg", "/uploads/b.jpg"]
 *  - interval : jeda geser otomatis (ms), default 5000
 *  - className: tinggi banner, default "h-48 md:h-72"
 *  - children : elemen yang menempel di atas banner (mis. tombol "Lihat Galeri")
 */
export default function BannerSlider({
  images = [],
  interval = 5000,
  className = "h-48 md:h-72",
  children,
}) {
  const count = images.length;
  const [index, setIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const box = useRef(null);
  const paused = useRef(false);

  const go = (i) => setIndex((i + count) % count);

  // geser otomatis
  useEffect(() => {
    if (count < 2) return;
    const t = setInterval(() => {
      if (!paused.current) setIndex((i) => (i + 1) % count);
    }, interval);
    return () => clearInterval(t);
  }, [count, interval]);

  // kalau jumlah foto berubah (mis. habis upload/hapus), jaga index tetap valid
  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [count, index]);

  const onDown = (e) => {
    if (count < 2) return;
    startX.current = e.clientX;
    setDragging(true);
    paused.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e) => {
    if (dragging) setDragX(e.clientX - startX.current);
  };
  const onUp = () => {
    if (!dragging) return;
    const w = box.current?.offsetWidth || 1;
    if (dragX < -w * 0.15) go(index + 1);
    else if (dragX > w * 0.15) go(index - 1);
    setDragX(0);
    setDragging(false);
    paused.current = false;
  };

  return (
    <div
      ref={box}
      className={`group relative w-full overflow-hidden bg-slate-900 ${className}`}
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
    >
      {count === 0 ? (
        <div className="h-full w-full bg-gradient-to-br from-emerald-900 to-slate-900" />
      ) : (
        <div
          className={`flex h-full select-none ${dragging ? "" : "transition-transform duration-500 ease-out"}`}
          style={{
            transform: `translateX(calc(${-index * 100}% + ${dragX}px))`,
            touchAction: "pan-y",
            cursor: count > 1 ? (dragging ? "grabbing" : "grab") : "default",
          }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        >
          {images.map((src, i) => (
            <img
              key={src + i}
              src={src}
              alt={`Foto ${i + 1}`}
              draggable={false}
              className="h-full w-full flex-shrink-0 object-cover"
            />
          ))}
        </div>
      )}

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Foto sebelumnya"
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white opacity-0 transition hover:bg-black/60 group-hover:opacity-100 focus-visible:opacity-100"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Foto berikutnya"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white opacity-0 transition hover:bg-black/60 group-hover:opacity-100 focus-visible:opacity-100"
          >
            <ChevronRight size={20} />
          </button>

          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => go(i)}
                aria-label={`Ke foto ${i + 1}`}
                className={`h-2 rounded-full transition-all ${
                  i === index ? "w-5 bg-emerald-400" : "w-2 bg-white/60"
                }`}
              />
            ))}
          </div>
        </>
      )}

      {children}
    </div>
  );
}