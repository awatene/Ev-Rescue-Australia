type Prediction = { class: string; score: number };

const CAR = new Set(["car", "truck", "bus"]);
const BIKE = new Set(["bicycle", "motorcycle"]);
const NOT_VEHICLE = new Set(["person", "dog", "cat", "bird", "horse", "cow", "sheep", "pizza", "cake", "bottle", "cup", "chair", "couch", "tv", "laptop", "cell phone"]);

let modelPromise: Promise<{ detect: (image: HTMLImageElement) => Promise<Prediction[]> }> | null = null;

function script(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const tag = document.createElement("script");
    tag.src = src;
    tag.async = true;
    tag.onload = () => resolve();
    tag.onerror = () => reject(new Error("script"));
    document.head.appendChild(tag);
  });
}

function loadModel() {
  modelPromise ??= (async () => {
    await script("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js");
    await script("https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js");
    const coco = (window as unknown as { cocoSsd?: { load: () => Promise<{ detect: (image: HTMLImageElement) => Promise<Prediction[]> }> } }).cocoSsd;
    if (!coco) throw new Error("model");
    return coco.load();
  })();
  return modelPromise;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

function looksLikePhoto(image: HTMLImageElement) {
  if (image.naturalWidth < 320 || image.naturalHeight < 240) return false;
  const canvas = document.createElement("canvas");
  canvas.width = 24;
  canvas.height = 24;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return true;
  ctx.drawImage(image, 0, 0, 24, 24);
  const data = ctx.getImageData(0, 0, 24, 24).data;
  let total = 0;
  const values: number[] = [];
  for (let i = 0; i < data.length; i += 4) {
    const value = data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11;
    values.push(value);
    total += value;
  }
  const mean = total / values.length;
  const spread = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return spread > 180;
}

function verdict(found: Prediction[], kind: "car" | "bike"): "match" | "reject" | "unsure" {
  const best = (names: Set<string>) => found.reduce((score, item) => (names.has(item.class) ? Math.max(score, item.score) : score), 0);
  const car = best(CAR);
  const bike = best(BIKE);
  const other = best(NOT_VEHICLE);
  if (kind === "car" && car >= 0.32 && car + 0.05 >= bike) return "match";
  if (kind === "bike" && bike >= 0.28 && bike + 0.05 >= car) return "match";
  if (other >= 0.6 && car < 0.32 && bike < 0.28) return "reject";
  return "unsure";
}

export async function checkVehiclePhoto(srcs: string[], kind: "car" | "bike"): Promise<"match" | "unsure"> {
  const images = (await Promise.all(srcs.slice(0, 6).map(loadImage))).filter((image): image is HTMLImageElement => Boolean(image));
  if (!images.length) return "unsure";
  const usable = images.filter(looksLikePhoto);
  if (!usable.length) return "unsure";
  try {
    const model = await Promise.race([
      loadModel(),
      new Promise<never>((_, reject) => window.setTimeout(() => reject(new Error("timeout")), 12000)),
    ]);
    let rejected = false;
    for (const image of usable) {
      const found = await model.detect(image);
      const result = verdict(found, kind);
      if (result === "match") return "match";
      if (result === "reject") rejected = true;
    }
    if (rejected) return "unsure";
    return "match";
  } catch {
    modelPromise = null;
    return "match";
  }
}
