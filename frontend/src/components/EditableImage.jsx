import { useRef } from "react";
import { uploadFile } from "../api/client";

export default function EditableImage({
  src, alt, onChange, admin,
  className = "",
  fit = "cover",
  height = 240,
  widthPct = 100,
  onMetaChange,
  onImageClick
}) {
  const fileRef = useRef(null);
  const pick = () => fileRef.current?.click();

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const res = await uploadFile(f);
      if (res.ok && res.url) onChange(res.url);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div
      className={`relative ${className}`}
      style={{ height: `${height}px`, width: `${widthPct}%` }}
    >
      <img
        src={src}
        alt={alt}
        onClick={(e) => onImageClick?.(e)}
        className={`${fit === "cover" ? "object-cover" : "object-contain bg-black/5"} h-full w-full rounded-2xl cursor-zoom-in`}
      />

      {admin && (
        <div data-no-lightbox className="absolute right-2 top-2 flex gap-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); pick(); }}
            className="rounded-full bg-white/80 px-2 py-1 text-xs shadow backdrop-blur hover:bg-white dark:bg-neutral-900/80"
          >
            Заменить
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMetaChange?.({ fit: fit === "cover" ? "contain" : "cover" });
            }}
            className="rounded-full bg-white/80 px-2 py-1 text-xs shadow backdrop-blur hover:bg-white dark:bg-neutral-900/80"
          >
            {fit === "cover" ? "Contain" : "Cover"}
          </button>
        </div>
      )}

      {admin && (
        <div
          data-no-lightbox
          className="absolute left-2 bottom-2 right-2 rounded-xl bg-white/70 p-2 text-xs shadow backdrop-blur dark:bg-neutral-900/70"
        >
          Высота:
          <input
            type="range"
            min="140"
            max="560"
            value={height}
            onChange={(e) => onMetaChange?.({ height: Number(e.target.value) })}
          />
          <span className="ml-2 mr-4">{height}px</span>
          Ширина:
          <input
            type="range"
            min="60"
            max="100"
            value={widthPct}
            onChange={(e) => onMetaChange?.({ widthPct: Number(e.target.value) })}
          />
          <span className="ml-2">{widthPct}%</span>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFile}
      />
    </div>
  );
}
