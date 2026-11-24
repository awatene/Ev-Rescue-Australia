import { createServerFn } from "@tanstack/react-start";
import { MAKES, MODELS_BY_MAKE, YEARS } from "@/lib/market/data";

export type DecodedVin = {
  make: string;
  model: string;
  year: string;
  listMake: string;
  listModel: string;
  listYear: string;
};

function listMakeFor(make: string) {
  const key = make.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (key.startsWith("tesla")) return "Tesla";
  if (key.startsWith("byd")) return "BYD";
  if (key === "mg" || key.startsWith("mg ")) return "MG";
  if (key.startsWith("hyundai")) return "Hyundai";
  if (key.startsWith("kia")) return "Kia";
  if (key.startsWith("nissan")) return "Nissan";
  if (key.startsWith("bmw")) return "BMW";
  return MAKES.find((item) => item.toLowerCase() === key) ?? "";
}

function matchList(make: string, model: string, year: string) {
  const listMake = listMakeFor(make);
  const listYear = YEARS.includes(year) ? year : "";
  let listModel = "";
  if (listMake && model.trim()) {
    const needle = model.trim().toLowerCase();
    const models = MODELS_BY_MAKE[listMake] ?? [];
    const exact = models.find((item) => item.toLowerCase() === needle);
    if (exact) {
      listModel = exact;
    } else {
      const hits = models.filter((item) => {
        const name = item.toLowerCase();
        return name.startsWith(`${needle} `) || needle.startsWith(`${name} `);
      });
      if (hits.length === 1) listModel = hits[0];
    }
  }
  return { listMake, listModel, listYear };
}

export const decodeVin = createServerFn({ method: "POST" })
  .validator((input: { vin: string }) => input)
  .handler(async ({ data }): Promise<DecodedVin> => {
    const vin = data.vin.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) throw new Error("VIN should be 17 characters, with no I, O or Q. Please check and try again.");
    const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`, {
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error("Vehicle lookup is unavailable. Try again.");
    const body = (await response.json()) as { Results?: Array<Record<string, string>> };
    const row = body.Results?.[0];
    const make = String(row?.Make ?? "").trim();
    const model = String(row?.Model ?? "").trim();
    const year = String(row?.ModelYear ?? "").trim();
    if (!make && !model && !year) throw new Error("No vehicle was found for that VIN. Check the characters, or choose the make and model yourself.");
    return { make, model, year, ...matchList(make, model, year) };
  });
