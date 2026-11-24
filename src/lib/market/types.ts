export const STORAGE_KEY = "evrescue_market_v1";

export type Role = "private" | "dealer";

export type User = {
  email: string;
  name: string;
  phone: string;
  role: Role;
  businessName?: string;
  abn?: string;
  provider?: string;
  photo?: string;
  avatarColor?: string;
};

export type Specs = {
  make: string;
  model: string;
  year: string;
  motor: string;
  battery: string;
  range: string;
  vin?: string;
  extra?: string;
};

export type Car = {
  id: string;
  make: string;
  model: string;
  year: number;
  km: number;
  price: number;
  state: string;
  city: string;
  registration?: string;
  writeoff: boolean;
  seller: string;
  note: string;
  featured: boolean;
  vin?: string;
  photos: string[];
  specs?: Specs;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  ownerEmail?: string;
  ebike?: boolean;
  review?: "pending";
};

export type Part = {
  id: string;
  title: string;
  make: string;
  model: string;
  year: string;
  state: string;
  city: string;
  price: number;
  description: string;
  photos: string[];
  featured: boolean;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  ownerEmail?: string;
  review?: "pending";
};

export type ServiceType = "Mechanical" | "Panel" | "Both";

export type Service = {
  id: string;
  name: string;
  serviceType: ServiceType;
  state: string;
  city: string;
  note: string;
  photos: string[];
  featured: boolean;
  phone: string;
  email: string;
  ownerEmail?: string;
  review?: "pending";
};

export type AdMessage = {
  id: string;
  kind: "car" | "part";
  adId: string;
  adTitle: string;
  sellerEmail: string;
  buyerEmail: string;
  buyerName: string;
  text: string;
  createdAt: number;
  read: boolean;
  reply?: string;
  replyAt?: number;
};

export type AdFlag = {
  id: string;
  kind: "car" | "part" | "service";
  adId: string;
  adTitle: string;
  reporterEmail: string;
  reporterName: string;
  reason: string;
  note: string;
  createdAt: number;
  status: "open" | "kept" | "removed";
};

export type Intent =
  | { kind: "list" }
  | { kind: "mine" }
  | { kind: "inbox" }
  | { kind: "profile" }
  | { kind: "admin"; open?: string }
  | { kind: "message"; target: "car" | "part"; id: string }
  | { kind: "contact"; id: string }
  | { kind: "battery"; target: "car" | "part"; id: string }
  | { kind: "report"; target: "car" | "part"; id: string }
  | { kind: "flag"; target: "car" | "part" | "service"; id: string }
  | null;

export type Draft = {
  savedAt: number;
  values: Record<string, string | boolean>;
  photos: string[];
};

export type PendingPay = {
  kind: "car" | "part" | "service";
  id: string;
} | null;

export type MarketState = {
  user: User | null;
  accounts: User[];
  cars: Car[];
  parts: Part[];
  services: Service[];
  messages: AdMessage[];
  flags: AdFlag[];
  intent: Intent;
  draft: Draft | null;
  pendingPay: PendingPay;
};

export type HomeSearch = {
  open?: string;
  panel?: "" | "message" | "contact" | "battery" | "report" | "flag";
  state?: string;
  make?: string;
  model?: string;
  notice?: string;
  focus?: "" | "cars" | "parts" | "services";
};

export const EMPTY_SEARCH: HomeSearch = {};

export const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
