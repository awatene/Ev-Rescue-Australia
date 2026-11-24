import type { Car, Part, Service, Specs } from "./types";

export const STATES = ["QLD", "NSW", "VIC", "SA", "WA", "TAS", "ACT", "NT"] as const;

export function plateClass(state?: string) {
  switch ((state || "").toUpperCase()) {
    case "NSW":
      return "rego-nsw";
    case "QLD":
      return "rego-qld";
    case "SA":
      return "rego-sa";
    case "NT":
      return "rego-nt";
    case "VIC":
    case "WA":
    case "TAS":
    case "ACT":
      return "rego-blue";
    default:
      return "rego-plain";
  }
}

export function plateFont(value: string) {
  const count = Math.max(value.trim().length, 1);
  const size = 90 / (count * 0.62);
  return `${Math.min(26, size)}cqi`;
}

export function plateName(state?: string) {
  switch ((state || "").toUpperCase()) {
    case "QLD":
      return "QUEENSLAND";
    case "NSW":
      return "NEW SOUTH WALES";
    case "VIC":
      return "VICTORIA";
    case "SA":
      return "SOUTH AUSTRALIA";
    case "WA":
      return "WESTERN AUSTRALIA";
    case "TAS":
      return "TASMANIA";
    case "ACT":
      return "ACT";
    case "NT":
      return "NORTHERN TERRITORY";
    default:
      return "";
  }
}

export const CITIES: Record<string, string[]> = {
  QLD: ["Brisbane", "Gold Coast", "Sunshine Coast", "Townsville", "Cairns", "Toowoomba"],
  NSW: ["Sydney", "Newcastle", "Wollongong", "Central Coast", "Albury"],
  VIC: ["Melbourne", "Geelong", "Ballarat", "Bendigo"],
  SA: ["Adelaide", "Mount Gambier"],
  WA: ["Perth", "Fremantle", "Bunbury"],
  TAS: ["Hobart", "Launceston"],
  ACT: ["Canberra"],
  NT: ["Darwin", "Alice Springs"],
};

export const MODELS_BY_MAKE: Record<string, string[]> = {
  Tesla: ["Model 3 RWD", "Model 3 Long Range", "Model Y RWD", "Model Y Long Range", "Model S", "Model X"],
  BYD: ["Atto 3", "Dolphin", "Seal", "Sealion 6"],
  MG: ["ZS EV", "MG4", "Cyberster"],
  Hyundai: ["Ioniq 5", "Ioniq 6", "Kona Electric"],
  Kia: ["EV6", "EV9", "Niro EV"],
  Nissan: ["Leaf", "Ariya"],
  BMW: ["iX3", "i4", "iX"],
  Other: ["Other model"],
};

export const MAKES = Object.keys(MODELS_BY_MAKE);

export const E_MOTO_MAKES = [
  "79Bike",
  "Alta",
  "Altis",
  "Apollo",
  "Arc",
  "Arctic Leopard",
  "Beta",
  "BMW",
  "Cake",
  "Can-Am",
  "CSC",
  "Damon",
  "Ducati",
  "E Ride Pro",
  "Electric Motion",
  "Energica",
  "Evoke",
  "Fonz",
  "GasGas",
  "Harley-Davidson",
  "Honda",
  "Horwin",
  "Husqvarna",
  "Kawasaki",
  "Kollter",
  "KTM",
  "Kuberg",
  "Land",
  "Lightning",
  "LiveWire",
  "Maeving",
  "NIU",
  "Oset",
  "Rawrr",
  "RFN",
  "RGNT",
  "Ryvid",
  "Savic",
  "Segway",
  "Silence",
  "Stark",
  "Surron",
  "Super Soco",
  "Talaria",
  "Tarform",
  "Tinbot",
  "Tromox",
  "Triumph",
  "UBCO",
  "Ventus",
  "Verge",
  "Vmoto",
  "Yadea",
  "Yamaha",
  "Zapp",
  "Zero",
];

export const AVATAR_COLORS = [
  { bg: "#22c55e", ink: "#052e16", label: "Green" },
  { bg: "#f59e0b", ink: "#1c1917", label: "Amber" },
  { bg: "#38bdf8", ink: "#082f49", label: "Blue" },
  { bg: "#f3f7f4", ink: "#052e16", label: "White" },
  { bg: "#1e293b", ink: "#f3f7f4", label: "Slate" },
] as const;

export function avatarPaint(color?: string) {
  return AVATAR_COLORS.find((item) => item.bg === color) ?? AVATAR_COLORS[0];
}

export const DEMO_PHONE = "0400 000 000";
export const DEMO_PHONE_TEL = "tel:0400000000";
export const DEMO_EMAIL = "workshop@example.com";
export const SITE_EMAIL = "admin@ev-rescue-au.com.au";
/** Paid featuring stays off until pricing is reviewed. */
export const FEATURED_OFFERS = false;

export const PRICE_OPTIONS = [
  { value: "", label: "Any price" },
  { value: "20000", label: "Under $20,000" },
  { value: "35000", label: "Under $35,000" },
  { value: "50000", label: "Under $50,000" },
  { value: "70000", label: "Under $70,000" },
];

const thisYear = new Date().getFullYear();
export const YEARS = Array.from({ length: thisYear - 2011 }, (_, i) => String(thisYear - i));

export const SEED_CARS: Car[] = [
  {
    id: "c1",
    make: "Tesla",
    model: "Model 3 RWD",
    year: 2021,
    km: 72000,
    price: 32900,
    state: "VIC",
    city: "Melbourne",
    writeoff: true,
    seller: "Private",
    note: "Single owner. Battery health report available on request.",
    featured: true,
    photos: [
      "/demo/model3-front.jpg",
      "/demo/model3-rear.jpg",
      "/demo/model3-cabin.jpg",
      "/demo/model3-wheel.jpg",
      "/demo/model3-charge.jpg",
    ],
  },
  {
    id: "c2",
    make: "BYD",
    model: "Atto 3",
    year: 2023,
    km: 28000,
    price: 27500,
    state: "QLD",
    city: "Brisbane",
    writeoff: true,
    seller: "Dealer",
    note: "Hail repair completed. Low km.",
    featured: false,
    photos: [],
  },
  {
    id: "c3",
    make: "MG",
    model: "ZS EV",
    year: 2022,
    km: 41000,
    price: 24900,
    state: "NSW",
    city: "Sydney",
    writeoff: false,
    seller: "Private",
    note: "Full service history.",
    featured: false,
    photos: [],
  },
  {
    id: "c4",
    make: "Hyundai",
    model: "Ioniq 5",
    year: 2022,
    km: 55000,
    price: 42900,
    state: "WA",
    city: "Perth",
    writeoff: false,
    seller: "Dealer",
    note: "One owner, highway km.",
    featured: true,
    photos: [],
  },
  {
    id: "c5",
    make: "Kia",
    model: "EV6",
    year: 2023,
    km: 19000,
    price: 48900,
    state: "VIC",
    city: "Geelong",
    writeoff: false,
    seller: "Private",
    note: "Almost new condition.",
    featured: false,
    photos: [],
  },
  {
    id: "c6",
    make: "Tesla",
    model: "Model Y Long Range",
    year: 2022,
    km: 63000,
    price: 45900,
    state: "QLD",
    city: "Gold Coast",
    writeoff: false,
    seller: "Dealer",
    note: "Dual motor AWD.",
    featured: false,
    photos: [],
  },
  {
    id: "c7",
    make: "Nissan",
    model: "Leaf",
    year: 2019,
    km: 78000,
    price: 16500,
    state: "SA",
    city: "Adelaide",
    writeoff: true,
    seller: "Private",
    note: "Repaired write-off, documented. Ideal city car.",
    featured: false,
    photos: [],
  },
  {
    id: "c8",
    make: "BMW",
    model: "iX3",
    year: 2021,
    km: 52000,
    price: 52900,
    state: "NSW",
    city: "Newcastle",
    writeoff: false,
    seller: "Dealer",
    note: "Premium pack.",
    featured: false,
    photos: [],
  },
  {
    id: "ebike-1",
    make: "Giant",
    model: "commuter",
    year: 2022,
    km: 420,
    price: 1800,
    state: "VIC",
    city: "Melbourne",
    writeoff: false,
    seller: "Private",
    note: "Black commuter eBike. Mid motor, lights and rack. Used for the train ride to work.",
    featured: false,
    photos: ["/demo/ebike-commuter.jpg"],
    ebike: true,
  },
  {
    id: "ebike-2",
    make: "Trek",
    model: "step-through",
    year: 2023,
    km: 160,
    price: 2400,
    state: "NSW",
    city: "Sydney",
    writeoff: false,
    seller: "Dealer",
    note: "Grey step-through with a rear rack. Low hours, serviced and ready to ride.",
    featured: true,
    photos: ["/demo/ebike-step.jpg"],
    ebike: true,
  },
  {
    id: "ebike-3",
    make: "Specialized",
    model: "trail",
    year: 2021,
    km: 890,
    price: 2200,
    state: "QLD",
    city: "Brisbane",
    writeoff: false,
    seller: "Private",
    note: "Dark green trail eBike. Good tyres, hydraulic brakes, battery still holds a full ride.",
    featured: false,
    photos: ["/demo/ebike-trail.jpg"],
    ebike: true,
  },
  {
    id: "ebike-4",
    make: "Benno",
    model: "cargo",
    year: 2024,
    km: 70,
    price: 3600,
    state: "WA",
    city: "Perth",
    writeoff: false,
    seller: "Dealer",
    note: "Navy cargo eBike with a front basket. School runs and shop trips. Almost new.",
    featured: false,
    photos: ["/demo/ebike-cargo.jpg"],
    ebike: true,
  },
  {
    id: "ebike-stark-1",
    make: "Stark Varg",
    model: "track",
    year: 2024,
    km: 38,
    price: 18900,
    state: "QLD",
    city: "Brisbane",
    writeoff: false,
    seller: "Private",
    note: "Stark Varg electric motocross bike. Low hours, used on a private track.",
    featured: false,
    photos: ["/demo/stark-track.jpg"],
    ebike: true,
  },
  {
    id: "ebike-stark-2",
    make: "Stark Varg",
    model: "workshop",
    year: 2023,
    km: 86,
    price: 16500,
    state: "NSW",
    city: "Newcastle",
    writeoff: false,
    seller: "Dealer",
    note: "Stark Varg, serviced and ready. Road-registered for transport between tracks.",
    featured: false,
    photos: ["/demo/stark-workshop.jpg"],
    ebike: true,
  },
  {
    id: "ebike-stark-3",
    make: "Stark Varg",
    model: "paddock",
    year: 2025,
    km: 12,
    price: 21400,
    state: "VIC",
    city: "Geelong",
    writeoff: false,
    seller: "Private",
    note: "Nearly new Stark Varg. Adult owned, kept in a shed, battery health excellent.",
    featured: false,
    photos: ["/demo/stark-paddock.jpg"],
    ebike: true,
  },
];

export const SEED_PARTS: Part[] = [
  {
    id: "p1",
    title: "Model 3 front bumper (complete)",
    make: "Tesla",
    model: "Model 3 RWD",
    year: "2021",
    state: "QLD",
    city: "Brisbane",
    price: 450,
    description: "Complete front bumper, unpainted. Collection from Brisbane.",
    photos: [],
    featured: false,
  },
  {
    id: "p2",
    title: "Atto 3 alloy wheel set x4",
    make: "BYD",
    model: "Atto 3",
    year: "2023",
    state: "VIC",
    city: "Melbourne",
    price: 800,
    description: "Set of four alloys with good tyres.",
    photos: [],
    featured: false,
  },
  {
    id: "p3",
    title: "Leaf battery module (tested)",
    make: "Nissan",
    model: "Leaf",
    year: "2018",
    state: "NSW",
    city: "Sydney",
    price: 1200,
    description: "Tested module. Health printout available.",
    photos: [],
    featured: false,
  },
  {
    id: "p4",
    title: "Ioniq 5 charge port assembly",
    make: "Hyundai",
    model: "Ioniq 5",
    year: "2022",
    state: "WA",
    city: "Perth",
    price: 320,
    description: "Charge port assembly, removed from a low-km car.",
    photos: [],
    featured: false,
  },
  {
    id: "p5",
    title: "MG ZS EV tail lights pair",
    make: "MG",
    model: "ZS EV",
    year: "2022",
    state: "QLD",
    city: "Sunshine Coast",
    price: 180,
    description: "Pair of tail lights, intact lenses.",
    photos: [],
    featured: false,
  },
];

export const SEED_SERVICES: Service[] = [
  {
    id: "s1",
    name: "GreenVolt EV Service",
    serviceType: "Mechanical",
    state: "QLD",
    city: "Brisbane",
    note: "Diagnostics, battery health, software.",
    photos: [],
    featured: false,
    phone: DEMO_PHONE,
    email: DEMO_EMAIL,
  },
  {
    id: "s2",
    name: "Panel Pro EV",
    serviceType: "Panel",
    state: "VIC",
    city: "Melbourne",
    note: "EV-aware panel and structural repair.",
    photos: [],
    featured: false,
    phone: DEMO_PHONE,
    email: DEMO_EMAIL,
  },
  {
    id: "s3",
    name: "ElectroWorks Sydney",
    serviceType: "Both",
    state: "NSW",
    city: "Sydney",
    note: "Mechanical and panel for most EV brands.",
    photos: [],
    featured: false,
    phone: DEMO_PHONE,
    email: DEMO_EMAIL,
  },
  {
    id: "s4",
    name: "Amp Repair Perth",
    serviceType: "Mechanical",
    state: "WA",
    city: "Perth",
    note: "High-voltage qualified technicians.",
    photos: [],
    featured: false,
    phone: DEMO_PHONE,
    email: DEMO_EMAIL,
  },
];

const MODEL_FACTS: Record<string, { battery: string; motor: string; other: string }> = {
  "Tesla Model 3 RWD": {
    battery:
      "Typical usable pack is in the 60 kWh class. Fleet data often shows slow degradation, and many cars retain high state of health well past warranty. Request a recent battery health report.",
    motor:
      "Single rear motor. Generally very reliable with minimal maintenance. Listen for unusual bearing noise and check for error codes.",
    other: "Check 12V battery age, charge port, window regulators and suspension bushes. Over-the-air software history is useful.",
  },
  "Tesla Model Y Long Range": {
    battery:
      "Larger pack than the RWD Model 3, in a dual-motor car. Same general longevity pattern — request a state-of-health report when buying used.",
    motor: "Dual motor all-wheel drive. Strong reliability record. Verify both motors respond evenly and there are no drivetrain warnings.",
    other: "Inspect for underbody damage, heat-pump operation in cooler climates, and tyre wear from the vehicle’s weight.",
  },
  "BYD Atto 3": {
    battery:
      "Blade LFP chemistry — often tolerant of regular full charges and known for strong cycle life. Still verify health on a used example.",
    motor: "Front-drive electric motor with a simple layout. Check for smooth acceleration and no inverter warnings.",
    other: "Review infotainment behaviour, cameras and suspension. Confirm any remaining manufacturer battery warranty.",
  },
  "MG ZS EV": {
    battery: "Common warranty around 7–8 years in many markets. Check capacity retention and how the car charges.",
    motor: "Front motor, generally low maintenance. Scan for stored faults.",
    other: "Look at the charge-door mechanism, cabin electronics, and service history for coolant and the 12V battery.",
  },
  "Hyundai Ioniq 5": {
    battery: "800V architecture on many variants, with strong real-world longevity reports. Always ask for battery health data.",
    motor: "Rear-drive or all-wheel drive depending on the variant. Motors are typically durable; check for consistent power.",
    other: "Inspect charging-system history, vehicle-to-load if fitted, and alignment after any impact.",
  },
  "Kia EV6": {
    battery: "Related architecture to the Ioniq 5. Warranties are often 7–8 years. Request state of health and charge information.",
    motor: "Rear-drive or all-wheel drive. High reliability expectation. Verify there are no drivetrain faults.",
    other: "Check charging behaviour, suspension and tyre condition given the vehicle weight.",
  },
  "Nissan Leaf": {
    battery:
      "Earlier generations can show more degradation than newer EVs. A battery health report is especially important on a Leaf.",
    motor: "Front motor with a long track record. Relatively simple and robust.",
    other: "Check the battery-bar display, any rapid-charge history, and whether the cabin heater is resistive or a heat pump.",
  },
  "BMW iX3": {
    battery: "Premium pack with solid thermal management. Expect strong retention if it was not DC fast-charged every day.",
    motor: "Rear motor with a refined calibration. Check for software updates and any drivetrain warnings.",
    other: "Review adaptive suspension if fitted, charge history and dealer service records.",
  },
};

export function factsFor(make: string, model: string) {
  return (
    MODEL_FACTS[`${make} ${model}`] ?? {
      battery:
        "Request a battery state-of-health report. Most modern EV packs degrade slowly — often about 1–2% a year in fleet studies.",
      motor:
        "EV motors generally have few wear items. Have a technician scan for fault codes and road-test for smooth power delivery.",
      other:
        "Inspect the charging system, 12V battery, suspension, tyres and any past body or structural work. An independent inspection is recommended.",
    }
  );
}

export function demoSpecs(make: string, model: string, year: string, vin: string): Specs {
  const key = `${make} ${model}`.toLowerCase();
  let motor = "Electric";
  let battery = "Not listed for this model";
  let range = "Not listed for this model";
  if (key.includes("model 3")) {
    motor = "Rear motor";
    battery = "50–82 kWh class";
    range = "430–600 km";
  } else if (key.includes("model y")) {
    motor = "Dual motor AWD";
    battery = "75–82 kWh";
    range = "450–530 km";
  } else if (key.includes("atto")) {
    motor = "Front motor";
    battery = "60 kWh Blade LFP";
    range = "420 km";
  } else if (key.includes("zs")) {
    motor = "Front motor";
    battery = "51–72 kWh";
    range = "320–440 km";
  } else if (key.includes("ioniq")) {
    motor = "Rear or dual motor";
    battery = "64–77 kWh";
    range = "480–580 km";
  } else if (key.includes("ev6")) {
    motor = "Rear or dual motor";
    battery = "77 kWh";
    range = "480–530 km";
  } else if (key.includes("leaf")) {
    motor = "Front motor";
    battery = "40–62 kWh";
    range = "270–385 km";
  } else if (key.includes("ix3")) {
    motor = "Rear motor";
    battery = "80 kWh";
    range = "460 km";
  }
  return {
    make: make || "Unknown",
    model: model || "Unknown",
    year: year || "Unknown",
    motor,
    battery: `Typical for this model: ${battery}`,
    range: `Typical for this model: ${range}`,
    vin,
  };
}

export function money(n: number) {
  if (!n) return "Contact for price";
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(n);
}

export function kmLabel(n: number) {
  return `${new Intl.NumberFormat("en-AU").format(n)} km`;
}

export function isAuPhone(input: string) {
  const compact = input.replace(/[\s()-]/g, "");
  return /^(?:\+?61|0)[23478]\d{8}$/.test(compact);
}

export const MAKE_COLORS: Record<string, string> = {
  Tesla: "#e7e5e4",
  BYD: "#60a5fa",
  MG: "#f87171",
  Hyundai: "#38bdf8",
  Kia: "#d6d3d1",
  Nissan: "#d6c4a8",
  BMW: "#93c5fd",
  Other: "#22c55e",
};
