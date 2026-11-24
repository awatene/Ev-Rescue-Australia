import { saveProfile } from "@/lib/market/profiles";
import { AVATAR_COLORS } from "./data";
import { featureListing, listListings, saveCar, savePart, saveService, deleteCar, deletePart, deleteService } from "./listings";
import { listReports, saveReport } from "./reports";
import { listMessages, saveMessage, saveMessageRead, saveReply } from "./messages";
import {
  SEVEN_DAYS,
  STORAGE_KEY,
  type Car,
  type Draft,
  type Intent,
  type MarketState,
  type Part,
  type PendingPay,
  type Service,
  type AdMessage,
  type AdFlag,
  type User,
} from "./types";

const DEMO_IDS = new Set([
  "c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8",
  "ebike-1", "ebike-2", "ebike-3", "ebike-4", "ebike-stark-1", "ebike-stark-2", "ebike-stark-3",
  "p1", "p2", "p3", "p4", "p5",
  "s1", "s2", "s3", "s4",
]);

function withoutDemos<T extends { id: string }>(items: T[]) {
  return items.filter((item) => !DEMO_IDS.has(item.id));
}

function seedState(): MarketState {
  return {
    user: null,
    accounts: [],
    cars: [],
    parts: [],
    services: [],
    messages: [],
    flags: [],
    intent: null,
    draft: null,
    pendingPay: null,
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function str(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function num(value: unknown, fallback = 0) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function photosOf(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function savedPhoto(value: string) {
  if (value.startsWith("data:image")) return value;
  if (value.startsWith("https://")) return value;
  if (/^\/avatars\/[a-z0-9-]+\.jpg$/.test(value)) return value;
  return undefined;
}

function normalizeUser(value: unknown): User | null {
  const raw = asRecord(value);
  const email = str(raw.email).trim();
  if (!email) return null;
  const role = raw.role === "dealer" ? "dealer" : "private";
  return {
    email,
    name: str(raw.name, email.split("@")[0] || "Member"),
    phone: str(raw.phone),
    role,
    businessName: role === "dealer" ? str(raw.businessName).trim() || undefined : undefined,
    abn: role === "dealer" ? str(raw.abn).replace(/\D/g, "") || undefined : undefined,
    provider: str(raw.provider) || undefined,
    photo: savedPhoto(str(raw.photo)),
    avatarColor: AVATAR_COLORS.some((item) => item.bg === str(raw.avatarColor)) ? str(raw.avatarColor) : undefined,
  };
}

function normalizeCar(value: unknown, index: number): Car {
  const raw = asRecord(value);
  const specsRaw = asRecord(raw.specs);
  const specs = raw.specs
    ? {
        make: str(specsRaw.make),
        model: str(specsRaw.model),
        year: str(specsRaw.year),
        motor: str(specsRaw.motor),
        battery: str(specsRaw.battery),
        range: str(specsRaw.range),
        vin: str(specsRaw.vin) || undefined,
        extra: str(specsRaw.extra) || undefined,
      }
    : undefined;
  return {
    id: str(raw.id, `c${index + 1}`),
    make: str(raw.make, "EV"),
    model: str(raw.model, "EV"),
    year: num(raw.year, 2020),
    km: num(raw.km),
    price: num(raw.price),
    state: str(raw.state, "QLD"),
    city: str(raw.city, "Australia"),
    registration: str(raw.registration).toUpperCase() || undefined,
    writeoff: Boolean(raw.writeoff),
    seller: str(raw.seller, "Private"),
    note: str(raw.note),
    featured: Boolean(raw.featured),
    vin: str(raw.vin) || undefined,
    photos: photosOf(raw.photos),
    specs,
    contactName: str(raw.contactName) || undefined,
    contactEmail: str(raw.contactEmail) || undefined,
    contactPhone: str(raw.contactPhone) || undefined,
    ownerEmail: str(raw.ownerEmail) || undefined,
    ebike: Boolean(raw.ebike) || str(raw.id).startsWith("ebike-"),
    review: raw.review === "pending" ? "pending" : undefined,
  };
}

function normalizePart(value: unknown, index: number): Part {
  const raw = asRecord(value);
  return {
    id: str(raw.id, `p${index + 1}`),
    title: str(raw.title, "EV part"),
    make: str(raw.make, "Other"),
    model: str(raw.model),
    year: str(raw.year),
    state: str(raw.state, "QLD"),
    city: str(raw.city, "Australia"),
    price: num(raw.price),
    description: str(raw.description),
    photos: photosOf(raw.photos),
    featured: Boolean(raw.featured),
    contactName: str(raw.contactName) || undefined,
    contactEmail: str(raw.contactEmail) || undefined,
    contactPhone: str(raw.contactPhone) || undefined,
    ownerEmail: str(raw.ownerEmail) || undefined,
    review: raw.review === "pending" ? "pending" : undefined,
  };
}

function normalizeService(value: unknown, index: number): Service {
  const raw = asRecord(value);
  const serviceType = raw.serviceType === "Panel" || raw.serviceType === "Both" ? raw.serviceType : "Mechanical";
  return {
    id: str(raw.id, `s${index + 1}`),
    name: str(raw.name, "Workshop"),
    serviceType,
    state: str(raw.state, "QLD"),
    city: str(raw.city, "Australia"),
    note: str(raw.note),
    photos: photosOf(raw.photos),
    featured: Boolean(raw.featured),
    phone: str(raw.phone, "0400 000 000"),
    email: str(raw.email, "workshop@example.com"),
    ownerEmail: str(raw.ownerEmail) || undefined,
    review: raw.review === "pending" ? "pending" : undefined,
  };
}

function normalizeMessage(value: unknown, index: number): AdMessage | null {
  const raw = asRecord(value);
  const sellerEmail = str(raw.sellerEmail).trim();
  const text = str(raw.text).trim();
  if (!sellerEmail || !text) return null;
  const kind = raw.kind === "part" ? "part" : "car";
  return {
    id: str(raw.id, `m${index + 1}`),
    kind,
    adId: str(raw.adId),
    adTitle: str(raw.adTitle, "Ad"),
    sellerEmail,
    buyerEmail: str(raw.buyerEmail),
    buyerName: str(raw.buyerName, "Buyer"),
    text,
    createdAt: num(raw.createdAt, Date.now()),
    read: Boolean(raw.read),
    reply: str(raw.reply).trim() || undefined,
    replyAt: num(raw.replyAt) || undefined,
  };
}

function normalizeIntent(value: unknown): Intent {
  const raw = asRecord(value);
  if (raw.kind === "list") return { kind: "list" };
  if (raw.kind === "mine") return { kind: "mine" };
  if (raw.kind === "inbox") return { kind: "inbox" };
  if (raw.kind === "profile") return { kind: "profile" };
  if (raw.kind === "admin") return { kind: "admin", open: str(raw.open) || undefined };
  if (raw.kind === "message" && (raw.target === "car" || raw.target === "part") && str(raw.id)) {
    return { kind: "message", target: raw.target, id: str(raw.id) };
  }
  if (raw.kind === "contact" && str(raw.id)) return { kind: "contact", id: str(raw.id) };
  if (raw.kind === "flag" && str(raw.id)) {
    const target = raw.target === "part" ? "part" : raw.target === "service" ? "service" : "car";
    return { kind: "flag", target, id: str(raw.id) };
  }
  if ((raw.kind === "battery" || raw.kind === "report") && str(raw.id)) {
    const target = raw.target === "part" ? "part" : "car";
    return { kind: raw.kind, target, id: str(raw.id) };
  }
  return null;
}

function normalizeDraft(value: unknown): Draft | null {
  const raw = asRecord(value);
  const savedAt = num(raw.savedAt);
  if (!savedAt) return null;
  if (Date.now() - savedAt > SEVEN_DAYS) return null;
  const valuesRaw = asRecord(raw.values);
  const values: Record<string, string | boolean> = {};
  for (const [key, item] of Object.entries(valuesRaw)) {
    if (typeof item === "string" || typeof item === "boolean") values[key] = item;
  }
  return { savedAt, values, photos: photosOf(raw.photos) };
}

function normalizeFlag(value: unknown): AdFlag | null {
  const raw = asRecord(value);
  const id = str(raw.id);
  const adId = str(raw.adId);
  if (!id || !adId) return null;
  const kind = raw.kind === "part" ? "part" : raw.kind === "service" ? "service" : "car";
  const status = raw.status === "kept" ? "kept" : raw.status === "removed" ? "removed" : "open";
  return {
    id,
    kind,
    adId,
    adTitle: str(raw.adTitle, "Ad"),
    reporterEmail: str(raw.reporterEmail),
    reporterName: str(raw.reporterName, "Member"),
    reason: str(raw.reason, "Other"),
    note: str(raw.note),
    createdAt: num(raw.createdAt, Date.now()),
    status,
  };
}
function normalizePending(value: unknown): PendingPay {
  const raw = asRecord(value);
  if ((raw.kind === "car" || raw.kind === "part" || raw.kind === "service") && str(raw.id)) {
    return { kind: raw.kind, id: str(raw.id) };
  }
  return null;
}

export function normalizeState(value: unknown): MarketState {
  const raw = asRecord(value);
  const seed = seedState();
  const saved = Array.isArray(raw.cars) ? withoutDemos(raw.cars.map(normalizeCar)) : seed.cars;
  const cars = saved.map((car) => {
    if (car.photos.length) return car;
    return car;
  });
  const parts = Array.isArray(raw.parts) ? withoutDemos(raw.parts.map(normalizePart)) : seed.parts;
  const services = Array.isArray(raw.services) ? withoutDemos(raw.services.map(normalizeService)) : seed.services;
  const messages = Array.isArray(raw.messages)
    ? raw.messages.map(normalizeMessage).filter((item): item is AdMessage => item !== null)
    : [];
  const flags = Array.isArray(raw.flags)
    ? raw.flags.map(normalizeFlag).filter((item): item is AdFlag => item !== null)
    : [];
  const accounts = Array.isArray(raw.accounts)
    ? raw.accounts.map(normalizeUser).filter((user): user is User => user !== null)
    : [];
  return {
    user: normalizeUser(raw.user),
    accounts,
    cars,
    parts,
    services,
    messages,
    flags,
    intent: normalizeIntent(raw.intent),
    draft: normalizeDraft(raw.draft),
    pendingPay: normalizePending(raw.pendingPay),
  };
}

const SERVER_SNAPSHOT = JSON.stringify(seedState());

let state: MarketState = normalizeState(JSON.parse(SERVER_SNAPSHOT));
let cache = SERVER_SNAPSHOT;
let loaded = false;
const listeners = new Set<() => void>();

function persist() {
  cache = JSON.stringify(state);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, cache);
    } catch {
      const slim = {
        ...state,
        cars: state.cars.map((car) => ({ ...car, photos: [] })),
        parts: state.parts.map((part) => ({ ...part, photos: [] })),
        services: state.services.map((service) => ({ ...service, photos: [] })),
        draft: state.draft ? { ...state.draft, photos: [] } : null,
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
      } catch {
        // Keep the in-memory copy for this visit.
      }
    }
  }
  listeners.forEach((listener) => listener());
}

function ensureLoaded() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    state = normalizeState(JSON.parse(raw));
    cache = JSON.stringify(state);
    if (cache !== raw) localStorage.setItem(STORAGE_KEY, cache);
  } catch {
    state = normalizeState(JSON.parse(SERVER_SNAPSHOT));
    cache = JSON.stringify(state);
  }
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getClientSnapshot() {
  ensureLoaded();
  return cache;
}

export function getServerSnapshot() {
  return SERVER_SNAPSHOT;
}

export function subscribeReady(listener: () => void) {
  return () => {
    void listener;
  };
}

export function getReady() {
  return true;
}

export function getReadyServer() {
  return false;
}

function update(recipe: (current: MarketState) => MarketState) {
  ensureLoaded();
  state = recipe(state);
  persist();
}

export function readState() {
  ensureLoaded();
  return state;
}

export function signInUser(user: User) {
  update((current) => {
    const email = user.email.trim().toLowerCase();
    const existing = current.accounts.find((account) => account.email.toLowerCase() === email);
    const next = existing
      ? {
          ...existing,
          ...user,
          email: existing.email,
          name: user.name || existing.name,
          phone: user.phone || existing.phone,
          role: user.role || existing.role,
          photo: user.photo === undefined ? existing.photo : user.photo,
          businessName: user.businessName ?? existing.businessName,
          abn: user.abn ?? existing.abn,
        }
      : { ...user, email: user.email.trim() };
    const accounts = existing
      ? current.accounts.map((account) => (account.email.toLowerCase() === email ? next : account))
      : [...current.accounts, next];
    queueMicrotask(() => {
      void saveProfile({ data: next }).catch(() => undefined);
    });
    return { ...current, user: next, accounts };
  });
  void refreshSharedMessages();
}

export function updateUser(patch: Partial<User>) {
  let saved: User | null = null;
  update((current) => {
    if (!current.user) return current;
    const previous = current.user.email;
    const email = (patch.email ?? previous).trim();
    const same = (value?: string) => !!value && value.toLowerCase() === previous.toLowerCase();
    const taken = current.accounts.some(
      (account) => account.email.toLowerCase() === email.toLowerCase() && !same(account.email),
    );
    if (!email || taken) return current;
    const next = { ...current.user, ...patch, email };
    saved = next;
    const move = (value?: string) => (same(value) ? email : value);
    return {
      ...current,
      user: next,
      accounts: current.accounts.map((account) => (same(account.email) ? next : account)),
      cars: current.cars.map((car) => ({ ...car, ownerEmail: move(car.ownerEmail), contactEmail: move(car.contactEmail) })),
      parts: current.parts.map((part) => ({ ...part, ownerEmail: move(part.ownerEmail), contactEmail: move(part.contactEmail) })),
      services: current.services.map((service) => ({
        ...service,
        ownerEmail: move(service.ownerEmail),
        email: same(service.email) ? email : service.email,
      })),
      messages: current.messages.map((message) => ({
        ...message,
        sellerEmail: same(message.sellerEmail) ? email : message.sellerEmail,
        buyerEmail: same(message.buyerEmail) ? email : message.buyerEmail,
      })),
    };
  });
  if (saved) void saveProfile({ data: saved }).catch(() => undefined);
}

let signingOut = false;

export function isSigningOut() {
  return signingOut;
}

export function signOut() {
  signingOut = true;
  update((current) => ({ ...current, user: null }));
}

export function setIntent(intent: Intent) {
  update((current) => ({ ...current, intent }));
}

export function consumeIntent() {
  ensureLoaded();
  const intent = state.intent;
  if (intent) update((current) => ({ ...current, intent: null }));
  return intent;
}

export function saveDraft(draft: Draft) {
  update((current) => ({ ...current, draft }));
}

export function clearDraft() {
  update((current) => ({ ...current, draft: null }));
}

export function setPendingPay(pendingPay: PendingPay) {
  update((current) => ({ ...current, pendingPay }));
}

function mergeById<T extends { id: string }>(remote: T[], local: T[]) {
  const seen = new Set(remote.map((item) => item.id));
  return [...remote, ...local.filter((item) => !seen.has(item.id))];
}

export async function refreshSharedListings() {
  ensureLoaded();
  try {
    const remote = await listListings();
    update((current) => ({
      ...current,
      cars: withoutDemos(mergeById(remote.cars, current.cars)),
      parts: withoutDemos(mergeById(remote.parts, current.parts)),
      services: withoutDemos(mergeById(remote.services, current.services)),
    }));
  } catch {
    // Keep the local ads if the shared database is unavailable.
  }
}

const REVIEW_DEMO_ID = "review-demo-ev";
const REVIEW_DEMO_KEY = "evr-review-demo";

function reviewDemoCar(): Car {
  return {
    id: REVIEW_DEMO_ID,
    make: "Tesla",
    model: "Model 3 RWD",
    year: 2021,
    km: 48000,
    price: 28900,
    state: "QLD",
    city: "Brisbane",
    registration: "EVR001",
    writeoff: true,
    seller: "Private",
    note: "Practice ad so the admin can check the photos and approve or reject. Not a real car for sale.",
    featured: false,
    photos: ["/demo/model3-front.jpg", "/demo/model3-rear.jpg", "/demo/model3-cabin.jpg", "/demo/model3-charge.jpg", "/demo/model3-wheel.jpg"],
    contactName: "EV Rescue",
    contactEmail: "admin@ev-rescue-au.com.au",
    ownerEmail: "admin@ev-rescue-au.com.au",
    review: "pending",
  };
}

function reviewDemoFinished() {
  try {
    return localStorage.getItem(REVIEW_DEMO_KEY) === "done";
  } catch {
    return false;
  }
}

function finishReviewDemo(id: string) {
  if (id !== REVIEW_DEMO_ID) return;
  try {
    localStorage.setItem(REVIEW_DEMO_KEY, "done");
  } catch {
    // The ad is still removed or approved in this session.
  }
}

export function ensureReviewDemo() {
  if (reviewDemoFinished()) return;
  ensureLoaded();
  const existing = state.cars.find((car) => car.id === REVIEW_DEMO_ID);
  if (existing?.review === "pending") return;
  const pending = reviewDemoCar();
  if (existing) {
    update((current) => ({
      ...current,
      cars: current.cars.map((car) => (car.id === REVIEW_DEMO_ID ? pending : car)),
    }));
    void saveCar({ data: pending }).catch(() => undefined);
    return;
  }
  addCar(pending);
}

export function addCar(car: Car) {
  update((current) => ({ ...current, cars: [car, ...current.cars.filter((item) => item.id !== car.id)] }));
  void saveCar({ data: car }).catch(() => undefined);
}

export function approveCar(id: string) {
  update((current) => ({
    ...current,
    cars: current.cars.map((car) => (car.id === id ? { ...car, review: undefined } : car)),
  }));
  const car = readState().cars.find((item) => item.id === id);
  finishReviewDemo(id);
  if (car) void saveCar({ data: { ...car, review: undefined } }).catch(() => undefined);
}

export function approvePart(id: string) {
  update((current) => ({
    ...current,
    parts: current.parts.map((part) => (part.id === id ? { ...part, review: undefined } : part)),
  }));
  const part = readState().parts.find((item) => item.id === id);
  if (part) void savePart({ data: { ...part, review: undefined } }).catch(() => undefined);
}

export function approveService(id: string) {
  update((current) => ({
    ...current,
    services: current.services.map((service) => (service.id === id ? { ...service, review: undefined } : service)),
  }));
  const service = readState().services.find((item) => item.id === id);
  if (service) void saveService({ data: { ...service, review: undefined } }).catch(() => undefined);
}

export function removeCar(id: string) {
  finishReviewDemo(id);
  update((current) => ({ ...current, cars: current.cars.filter((car) => car.id !== id) }));
  void deleteCar({ data: id }).catch(() => undefined);
}

export function removePart(id: string) {
  update((current) => ({ ...current, parts: current.parts.filter((part) => part.id !== id) }));
  void deletePart({ data: id }).catch(() => undefined);
}

export function removeService(id: string) {
  update((current) => ({ ...current, services: current.services.filter((service) => service.id !== id) }));
  void deleteService({ data: id }).catch(() => undefined);
}

export function addFlag(flag: AdFlag) {
  update((current) => ({
    ...current,
    flags: [flag, ...current.flags.filter((item) => item.id !== flag.id)],
  }));
  void saveReport({ data: flag }).catch(() => undefined);
}

export function settleFlag(id: string, status: "kept" | "removed") {
  let next: AdFlag | undefined;
  update((current) => {
    next = current.flags.find((item) => item.id === id);
    return {
      ...current,
      flags: current.flags.map((item) => (item.id === id ? { ...item, status } : item)),
    };
  });
  if (next) void saveReport({ data: { ...next, status } }).catch(() => undefined);
}

export async function refreshSharedReports() {
  ensureLoaded();
  try {
    const remote = await listReports();
    update((current) => {
      const seen = new Set(remote.map((item) => item.id));
      return { ...current, flags: [...remote, ...current.flags.filter((item) => !seen.has(item.id))] };
    });
  } catch {
    // Keep reports saved on this device if the database is unavailable.
  }
}

export function addPart(part: Part) {
  update((current) => ({ ...current, parts: [part, ...current.parts.filter((item) => item.id !== part.id)] }));
  void savePart({ data: part }).catch(() => undefined);
}

export function addService(service: Service) {
  update((current) => ({ ...current, services: [service, ...current.services.filter((item) => item.id !== service.id)] }));
  void saveService({ data: service }).catch(() => undefined);
}

export async function refreshSharedMessages() {
  ensureLoaded();
  const email = state.user?.email;
  if (!email) return;
  try {
    const remote = await listMessages({ data: { email } });
    const mine = email.toLowerCase();
    update((current) => ({
      ...current,
      messages: mergeById(
        remote,
        current.messages.filter(
          (message) => message.sellerEmail.toLowerCase() === mine || message.buyerEmail.toLowerCase() === mine,
        ),
      ),
    }));
  } catch {
    // Keep the messages already on this device.
  }
}

export function addMessage(message: AdMessage) {
  update((current) => ({ ...current, messages: [message, ...current.messages.filter((item) => item.id !== message.id)] }));
  void saveMessage({ data: message }).catch(() => undefined);
}

export function replyToMessage(id: string, reply: string) {
  const text = reply.trim();
  if (!id || !text) return;
  const email = state.user?.email || "";
  update((current) => ({
    ...current,
    messages: current.messages.map((message) =>
      message.id === id ? { ...message, reply: text, replyAt: Date.now() } : message,
    ),
  }));
  void saveReply({ data: { id, email, reply: text } }).catch(() => undefined);
}

export function markMessageRead(id: string) {
  const email = state.user?.email || "";
  update((current) => ({
    ...current,
    messages: current.messages.map((message) => (message.id === id ? { ...message, read: true } : message)),
  }));
  void saveMessageRead({ data: { id, email } }).catch(() => undefined);
}

export function markInboxRead(email: string) {
  const mine = email.trim().toLowerCase();
  update((current) => ({
    ...current,
    messages: current.messages.map((message) =>
      message.sellerEmail.toLowerCase() === mine ? { ...message, read: true } : message,
    ),
  }));
}

export function markFeatured(pending: PendingPay, plan = "11", method: "card" | "paypal" = "card") {
  if (!pending) return;
  const days = plan === "99" ? 365 : plan === "19" ? 90 : 30;
  update((current) => {
    if (pending.kind === "car") {
      return {
        ...current,
        pendingPay: null,
        cars: current.cars.map((car) => (car.id === pending.id ? { ...car, featured: true } : car)),
      };
    }
    if (pending.kind === "part") {
      return {
        ...current,
        pendingPay: null,
        parts: current.parts.map((part) => (part.id === pending.id ? { ...part, featured: true } : part)),
      };
    }
    return {
      ...current,
      pendingPay: null,
      services: current.services.map((service) =>
        service.id === pending.id ? { ...service, featured: true } : service,
      ),
    };
  });
  void featureListing({ data: { ...pending, days, method, plan } }).catch(() => undefined);
}
