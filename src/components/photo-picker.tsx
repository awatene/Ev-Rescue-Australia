import { useEffect, useRef, useState } from "react";
import { Charging } from "@/components/charging";
import { shrinkImage } from "@/lib/market/images";

const LIMIT = 10;

type Pending = { id: string; file: File; url: string; ticked: boolean };

export function PhotoPicker({ photos, onChange }: { photos: string[]; onChange: (photos: string[]) => void }) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState<Pending[]>([]);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const dragFrom = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const room = Math.max(0, LIMIT - photos.length);

  function clearPending(next: Pending[] = []) {
    for (const item of pending) URL.revokeObjectURL(item.url);
    setPending(next);
  }

  function choose(list: FileList | null) {
    const files = [...(list ?? [])].filter((file) => file.type.startsWith("image/"));
    if (!files.length) return;
    if (room <= 0) {
      setError("You can add up to 10 photos.");
      return;
    }
    const next = files.map((file, index) => ({
      id: `${file.name}-${file.size}-${index}`,
      file,
      url: URL.createObjectURL(file),
      ticked: index < room,
    }));
    for (const item of pending) URL.revokeObjectURL(item.url);
    setPending(next);
    setError(files.length > room ? `Tick up to ${room} photo${room === 1 ? "" : "s"}, then upload.` : "");
  }

  function toggle(id: string) {
    setPending((current) => {
      const item = current.find((photo) => photo.id === id);
      if (!item) return current;
      const ticked = current.filter((photo) => photo.ticked).length;
      if (!item.ticked && ticked >= room) {
        setError(`You can tick up to ${room} photo${room === 1 ? "" : "s"}.`);
        return current;
      }
      setError("");
      return current.map((photo) => (photo.id === id ? { ...photo, ticked: !photo.ticked } : photo));
    });
  }

  async function upload() {
    const chosen = pending.filter((photo) => photo.ticked).slice(0, room);
    if (!chosen.length) return;
    setUploading(true);
    const next = [...photos];
    for (const item of chosen) {
      const url = await shrinkImage(item.file);
      if (url) next.push(url);
    }
    onChange(next.slice(0, LIMIT));
    clearPending();
    setError("");
    setUploading(false);
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= photos.length || from === to) return;
    const next = photos.slice();
    const [item] = next.splice(from, 1);
    if (!item) return;
    next.splice(to, 0, item);
    onChange(next);
  }

  const ticked = pending.filter((photo) => photo.ticked).length;

  return (
    <div>
      <label className="mb-1 block text-sm font-medium" htmlFor="photos">
        Photos
      </label>
      <input
        ref={inputRef}
        id="photos"
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(event) => {
          choose(event.target.files);
          event.target.value = "";
        }}
      />
      <button
        type="button"
        className="glow-hover min-h-11 rounded-md bg-accent px-4 text-sm font-semibold text-accent-ink"
        onClick={() => inputRef.current?.click()}
      >
        Choose photos
      </button>
      <p className="mt-1 text-xs text-muted">Tick up to 10 photos, then upload. The first uploaded photo is the main image.</p>
      {error ? <p className="mt-1 text-sm text-danger">{error}</p> : null}
      {pending.length ? (
        <div className="mt-3">
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {pending.map((photo) => (
              <li key={photo.id}>
                <button
                  type="button"
                  className="relative block w-full"
                  aria-pressed={photo.ticked}
                  onClick={() => toggle(photo.id)}
                >
                  <img src={photo.url} alt="" className="aspect-square w-full rounded-md object-cover" />
                  <span
                    className={`absolute top-2 right-2 flex h-9 w-9 items-center justify-center rounded-full border text-base font-bold ${photo.ticked ? "border-accent bg-accent text-accent-ink" : "border-white bg-black/50 text-white"}`}
                  >
                    {photo.ticked ? "✓" : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="glow-hover mt-3 min-h-11 rounded-md bg-accent px-4 text-sm font-semibold text-accent-ink disabled:opacity-50"
            disabled={ticked === 0 || uploading}
            onClick={() => void upload()}
          >
            {uploading ? "Uploading" : `Upload ${ticked || ""}`}
          </button>
          {uploading ? <Charging className="mt-3" label="Uploading photos…" /> : null}
        </div>
      ) : null}
      {photos.length ? (
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {photos.map((src, index) => (
            <li
              key={`${index}-${src.slice(0, 24)}`}
              draggable
              onDragStart={() => {
                dragFrom.current = index;
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (dragFrom.current !== null) move(dragFrom.current, index);
                dragFrom.current = null;
              }}
              className="rounded-md border border-border bg-bg p-2"
            >
              <img src={src} alt="" className="aspect-square w-full rounded object-cover" />
              {index === 0 ? <p className="mt-1 text-xs font-semibold text-accent">Main image</p> : null}
              <button type="button" className="mt-1 min-h-11 w-full rounded border border-border text-xs font-semibold" onClick={() => setEditing(index)}>
                Edit
              </button>
              <div className="mt-1 grid grid-cols-2 gap-1">
                <button type="button" className="min-h-11 rounded border border-border text-xs" onClick={() => move(index, index - 1)} disabled={index === 0}>
                  Move up
                </button>
                <button
                  type="button"
                  className="min-h-11 rounded border border-border text-xs"
                  onClick={() => move(index, index + 1)}
                  disabled={index === photos.length - 1}
                >
                  Move down
                </button>
              </div>
              <button
                type="button"
                className="mt-1 min-h-11 w-full text-xs text-muted"
                onClick={() => onChange(photos.filter((_, photoIndex) => photoIndex !== index))}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {editing !== null && photos[editing] ? (
        <PhotoEditor
          src={photos[editing]}
          canCopy={photos.length < LIMIT}
          onCancel={() => setEditing(null)}
          onApply={(next) => {
            onChange(photos.map((photo, photoIndex) => (photoIndex === editing ? next : photo)));
            setEditing(null);
          }}
          onCopy={(next) => {
            const copy = photos.slice();
            copy.splice(editing + 1, 0, next);
            onChange(copy.slice(0, LIMIT));
            setEditing(null);
          }}
        />
      ) : null}
    </div>
  );
}

type Tone = { brightness: number; contrast: number; saturation: number; warmth: number };
type Aspect = "16:9" | "4:3" | "1:1" | "original";
type FilterName = "none" | "warm" | "cool" | "vivid" | "soft" | "bw" | "vintage";
type Tab = "transform" | "filters" | "tone";

const ZERO_TONE: Tone = { brightness: 0, contrast: 0, saturation: 0, warmth: 0 };

function frameSize(aspect: Aspect, image: HTMLImageElement, maxEdge: number) {
  if (aspect === "original") {
    const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
    return { width: Math.max(1, Math.round(image.width * scale)), height: Math.max(1, Math.round(image.height * scale)) };
  }
  const ratio = aspect === "4:3" ? [4, 3] : aspect === "1:1" ? [1, 1] : [16, 9];
  const scale = maxEdge / Math.max(ratio[0], ratio[1]);
  return { width: Math.round(ratio[0] * scale), height: Math.round(ratio[1] * scale) };
}

function look(filter: FilterName, tone: Tone) {
  const parts = [
    `brightness(${1 + tone.brightness / 100})`,
    `contrast(${1 + tone.contrast / 100})`,
    `saturate(${Math.max(0, 1 + tone.saturation / 100)})`,
  ];
  if (tone.warmth) {
    parts.push(`sepia(${Math.max(0, tone.warmth) / 200})`, `hue-rotate(${-tone.warmth * 0.2}deg)`);
  }
  if (filter === "warm") parts.push("sepia(0.28)", "saturate(1.12)");
  if (filter === "cool") parts.push("hue-rotate(14deg)", "saturate(0.9)");
  if (filter === "vivid") parts.push("saturate(1.4)", "contrast(1.08)");
  if (filter === "soft") parts.push("contrast(0.9)", "brightness(1.05)");
  if (filter === "bw") parts.push("grayscale(1)");
  if (filter === "vintage") parts.push("sepia(0.45)", "contrast(1.05)");
  return parts.join(" ");
}

function PhotoEditor({
  src,
  canCopy,
  onApply,
  onCopy,
  onCancel,
}: {
  src: string;
  canCopy: boolean;
  onApply: (next: string) => void;
  onCopy: (next: string) => void;
  onCancel: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const drag = useRef<{ x: number; y: number; originX: number; originY: number } | null>(null);
  const previewSize = useRef({ width: 1280, height: 720 });
  const [tab, setTab] = useState<Tab>("transform");
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [straighten, setStraighten] = useState(0);
  const [aspect, setAspect] = useState<Aspect>("16:9");
  const [filter, setFilter] = useState<FilterName>("none");
  const [tone, setTone] = useState<Tone>(ZERO_TONE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const image = new Image();
    image.onload = () => {
      imageRef.current = image;
      setReady(true);
    };
    image.src = src;
  }, [src]);

  function paint(canvas: HTMLCanvasElement, size: { width: number; height: number }, offsetScale: number) {
    const image = imageRef.current;
    if (!image) return;
    canvas.width = size.width;
    canvas.height = size.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, size.width, size.height);
    const quarter = Math.abs(rotation / 90) % 2 === 1;
    const boxWidth = quarter ? image.height : image.width;
    const boxHeight = quarter ? image.width : image.height;
    const fit = aspect === "original" ? Math.min(size.width / boxWidth, size.height / boxHeight) : Math.max(size.width / boxWidth, size.height / boxHeight);
    const tilt = Math.min(Math.abs(straighten) * (Math.PI / 180), 0.45);
    const coverTilt = aspect === "original" || tilt === 0 ? 1 : 1 / Math.cos(tilt);
    const scale = fit * zoom * coverTilt;
    ctx.save();
    ctx.translate(size.width / 2 + offset.x * offsetScale, size.height / 2 + offset.y * offsetScale);
    ctx.rotate(((rotation + straighten) * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.filter = look(filter, tone);
    ctx.drawImage(image, (-image.width * scale) / 2, (-image.height * scale) / 2, image.width * scale, image.height * scale);
    ctx.restore();
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image || !ready) return;
    const size = frameSize(aspect, image, 1400);
    previewSize.current = size;
    paint(canvas, size, 1);
  }, [zoom, offset, rotation, flipH, flipV, straighten, aspect, filter, tone, ready]);

  function exportPhoto() {
    const image = imageRef.current;
    if (!image) return "";
    const full = frameSize(aspect, image, 3840);
    const preview = previewSize.current;
    const canvas = document.createElement("canvas");
    paint(canvas, full, preview.width ? full.width / preview.width : 1);
    return canvas.toDataURL("image/jpeg", 0.92);
  }

  function revert() {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setStraighten(0);
    setAspect("16:9");
    setFilter("none");
    setTone(ZERO_TONE);
  }

  function setToneValue(key: keyof Tone, value: number) {
    setTone((current) => ({ ...current, [key]: value }));
  }

  const frame = imageRef.current && ready ? frameSize(aspect, imageRef.current, 1400) : { width: 16, height: 9 };

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-black/80 p-3">
      <div className="mx-auto w-full max-w-lg rounded-md border border-border bg-surface p-3">
        <p className="text-sm font-semibold">Edit photo</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {(
            [
              ["transform", "Transform"],
              ["filters", "Filters"],
              ["tone", "Tone"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`min-h-11 rounded-md text-sm font-semibold ${tab === key ? "bg-accent text-accent-ink" : "border border-border"}`}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <canvas
          ref={canvasRef}
          className="mt-3 w-full touch-none rounded-md bg-black"
          style={{ aspectRatio: `${frame.width} / ${frame.height}` }}
          onPointerDown={(event) => {
            if (tab !== "transform") return;
            event.currentTarget.setPointerCapture(event.pointerId);
            drag.current = { x: event.clientX, y: event.clientY, originX: offset.x, originY: offset.y };
          }}
          onPointerMove={(event) => {
            if (!drag.current) return;
            const scale = (canvasRef.current?.width || 1280) / event.currentTarget.getBoundingClientRect().width;
            setOffset({
              x: drag.current.originX + (event.clientX - drag.current.x) * scale,
              y: drag.current.originY + (event.clientY - drag.current.y) * scale,
            });
          }}
          onPointerUp={() => {
            drag.current = null;
          }}
        />
        {tab === "transform" ? (
          <div className="mt-3 space-y-3">
            <p className="text-xs text-muted">Drag to crop. Buyers see this frame.</p>
            <Slider label="Zoom" min={1} max={3} step={0.05} value={zoom} onChange={setZoom} />
            <Slider label="Straighten" min={-15} max={15} step={0.5} value={straighten} onChange={setStraighten} />
            <div className="grid grid-cols-4 gap-2">
              {(["16:9", "4:3", "1:1", "original"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`min-h-11 rounded-md text-xs font-semibold ${aspect === item ? "bg-accent text-accent-ink" : "border border-border"}`}
                  onClick={() => setAspect(item)}
                >
                  {item === "original" ? "Original" : item}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className="min-h-11 rounded-md border border-border text-sm font-semibold" onClick={() => setRotation((value) => (value + 270) % 360)}>
                Rotate left
              </button>
              <button type="button" className="min-h-11 rounded-md border border-border text-sm font-semibold" onClick={() => setRotation((value) => (value + 90) % 360)}>
                Rotate right
              </button>
              <button type="button" className="min-h-11 rounded-md border border-border text-sm font-semibold" onClick={() => setFlipH((value) => !value)}>
                Flip sideways
              </button>
              <button type="button" className="min-h-11 rounded-md border border-border text-sm font-semibold" onClick={() => setFlipV((value) => !value)}>
                Flip vertical
              </button>
              <button type="button" className="min-h-11 rounded-md border border-border text-sm font-semibold" onClick={() => setOffset({ x: 0, y: 0 })}>
                Centre
              </button>
            </div>
          </div>
        ) : null}
        {tab === "filters" ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {(
              [
                ["none", "Original"],
                ["warm", "Warm"],
                ["cool", "Cool"],
                ["vivid", "Vivid"],
                ["soft", "Soft"],
                ["bw", "Black & white"],
                ["vintage", "Vintage"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`min-h-11 rounded-md text-sm font-semibold ${filter === key ? "bg-accent text-accent-ink" : "border border-border"}`}
                onClick={() => setFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}
        {tab === "tone" ? (
          <div className="mt-3 space-y-3">
            <Slider label="Brightness" min={-50} max={50} step={1} value={tone.brightness} onChange={(value) => setToneValue("brightness", value)} />
            <Slider label="Contrast" min={-50} max={50} step={1} value={tone.contrast} onChange={(value) => setToneValue("contrast", value)} />
            <Slider label="Saturation" min={-50} max={50} step={1} value={tone.saturation} onChange={(value) => setToneValue("saturation", value)} />
            <Slider label="Warmth" min={-50} max={50} step={1} value={tone.warmth} onChange={(value) => setToneValue("warmth", value)} />
          </div>
        ) : null}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" className="min-h-11 rounded-md border border-border text-sm font-semibold" onClick={revert}>
            Revert
          </button>
          <button type="button" className="min-h-11 rounded-md border border-border text-sm" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="glow-hover min-h-11 rounded-md bg-accent text-sm font-semibold text-accent-ink"
            onClick={() => {
              const next = exportPhoto();
              if (next) onApply(next);
            }}
          >
            Save
          </button>
          <button
            type="button"
            className="min-h-11 rounded-md border border-border text-sm font-semibold disabled:opacity-40"
            disabled={!canCopy}
            onClick={() => {
              const next = exportPhoto();
              if (next) onCopy(next);
            }}
          >
            Save copy
          </button>
        </div>
      </div>
    </div>
  );
}

function Slider({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block text-sm">
      {label}
      <input type="range" min={min} max={max} step={step} value={value} className="mt-1 w-full" onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}
