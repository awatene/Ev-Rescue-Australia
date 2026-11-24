import { createServerFn } from "@tanstack/react-start";

export type BatteryLookup = {
  chemistry: string;
  capacity: string;
  note: string;
  longevity: string;
  videoUrl: string;
  videoTitle: string;
};

function clip(value: unknown, max = 180) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function youtubeId(value: string) {
  const match = value.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
  return match?.[1] ?? "";
}

async function realYoutube(url: string) {
  const id = youtubeId(url);
  if (!id) return { videoUrl: "", videoTitle: "" };
  const watch = `https://www.youtube.com/watch?v=${id}`;
  try {
    const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(watch)}&format=json`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return { videoUrl: "", videoTitle: "" };
    const body = (await response.json()) as { title?: string };
    return { videoUrl: watch, videoTitle: clip(body.title, 140) || "Real-world battery test" };
  } catch {
    return { videoUrl: "", videoTitle: "" };
  }
}

export const lookupBatteryType = createServerFn({ method: "POST" })
  .validator((input: { make: string; model: string; year: string; vin?: string }) => input)
  .handler(async ({ data }): Promise<BatteryLookup> => {
    const make = clip(data.make, 40);
    const model = clip(data.model, 40);
    const year = clip(data.year, 4);
    const vin = clip(data.vin, 17);
    if (!make || !model || !year) throw new Error("Choose the make, model and year first.");
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) throw new Error("Battery lookup is unavailable right now.");
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(20000),
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: 0,
        max_tokens: 420,
        messages: [
          {
            role: "system",
            content:
              "You answer with JSON only, no markdown. Keys: chemistry, capacity, note, longevity, videoUrl, videoTitle. chemistry is the usual battery chemistry for that model year, such as LFP, NMC or NCA, or Unknown. capacity is the usual pack size, or a short range if that model had more than one, or Unknown. note is one short sentence. longevity is two short sentences on how long this type of battery usually lasts in real use: years, about how much capacity it loses each year, and kilometres if that is published. Say the figures are typical for the model, not a test of one exact car. videoUrl is a real YouTube watch link of a real-world battery degradation or long-term road test of this model or this battery type. If you are not certain that exact video exists, use an empty string. videoTitle is that video's name, or empty. Use published information only. Never claim this is a reading of one exact car.",
          },
          {
            role: "user",
            content: `Make: ${make}. Model: ${model}. Year: ${year}.${vin ? ` VIN: ${vin}.` : ""} What battery type was usual for this model, how long does that battery usually last, and is there a real-world YouTube test?`,
          },
        ],
      }),
    });
    if (!response.ok) throw new Error("Battery lookup is unavailable. Try again.");
    const body = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const raw = body.choices?.[0]?.message?.content ?? "";
    try {
      const json = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
      const parsed = JSON.parse(json) as Partial<BatteryLookup>;
      const chemistry = clip(parsed.chemistry, 40) || "Unknown";
      const capacity = clip(parsed.capacity, 60) || "Unknown";
      const note = clip(parsed.note, 220) || "This is typical for the model, not a reading of this exact car.";
      const longevity =
        clip(parsed.longevity, 420) ||
        "Most modern EV batteries are built to last about 15–20 years and often keep more than 80% of their capacity after many years of normal driving. That is typical for the model, not a test of this exact car.";
      const video = await realYoutube(clip(parsed.videoUrl, 180));
      return { chemistry, capacity, note, longevity, ...video };
    } catch {
      throw new Error("Battery lookup did not return a clear answer. Try again.");
    }
  });
