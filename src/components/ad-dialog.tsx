import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { X } from "lucide-react";
import { money, kmLabel, DEMO_EMAIL, DEMO_PHONE, plateClass, plateFont, plateName } from "@/lib/market/data";
import { lookupBatteryType, type BatteryLookup } from "@/lib/market/battery";
import { useMarket } from "@/components/market-provider";
import type { Car, Part, Service } from "@/lib/market/types";
import { Charging } from "@/components/charging";
import { CarArt } from "@/components/car-art";
import { WriteOffTag } from "@/components/write-off-tag";

export function DialogFrame({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="presentation">
      <button type="button" className="absolute inset-0 bg-black/70" aria-label="Close" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-md border border-border bg-surface p-4 sm:max-w-lg sm:rounded-md sm:p-6"
      >
        <button
          type="button"
          className="glow-hover mb-3 min-h-11 rounded-md border border-border px-4 text-sm font-semibold"
          onClick={onClose}
        >
          Back
        </button>
        <button
          type="button"
          className="absolute right-3 top-3 inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}

function NearbyParts({ parts, car, onOpen }: { parts: Part[]; car: Car; onOpen: (id: string) => void }) {
  const fitting = parts.filter((part) => part.review !== "pending" && part.make === car.make && part.model === car.model && part.state === car.state);
  const here = fitting.filter((part) => part.city === car.city);
  const close = fitting.filter((part) => part.city !== car.city);
  return (
    <div className="mt-3 rounded-md border border-border p-3 text-sm">
      {!here.length && !close.length ? <p className="text-muted">None listed in or near {car.city} for this model yet.</p> : null}
      {here.length ? <PartLinks label={`In ${car.city}`} parts={here} onOpen={onOpen} /> : null}
      {close.length ? <PartLinks label={`Close by, still in ${car.state}`} parts={close} onOpen={onOpen} /> : null}
    </div>
  );
}

function PartLinks({ label, parts, onOpen }: { label: string; parts: Part[]; onOpen: (id: string) => void }) {
  return (
    <div className={label.startsWith("Close") ? "mt-3" : ""}>
      <p className="font-semibold">{label}</p>
      <ul className="mt-1">
        {parts.map((part) => (
          <li key={part.id}>
            <button type="button" className="min-h-11 text-left text-accent underline" onClick={() => onOpen(part.id)}>
              {part.title} · {part.city} · {money(part.price)}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function youtubeId(value: string) {
  const match = value.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
  return match?.[1] ?? "";
}

function BatteryResult({ found, make, model, year }: { found: BatteryLookup; make: string; model: string; year: string }) {
  const id = youtubeId(found.videoUrl);
  const search = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${year} ${make} ${model} EV battery real world test`)}`;
  return (
    <div className="mt-2 rounded-md bg-bg p-3 text-sm">
      <p>
        Typical for this model: {found.chemistry}, {found.capacity}. {found.note}
      </p>
      <p className="mt-2">{found.longevity}</p>
      <p className="mt-2 text-muted">Not a reading of this exact car.</p>
      {id ? (
        <iframe
          className="mt-3 aspect-video w-full rounded-md"
          src={`https://www.youtube-nocookie.com/embed/${id}`}
          title={found.videoTitle || "Real-world battery test"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : (
        <a className="mt-3 inline-flex min-h-11 items-center text-accent underline" href={search} target="_blank" rel="noreferrer">
          Real-world battery tests on YouTube
        </a>
      )}
    </div>
  );
}

function AdPhotos({ photos, make }: { photos: string[]; make: string }) {
  const [index, setIndex] = useState(0);
  const [large, setLarge] = useState(false);
  const startX = useRef<number | null>(null);
  const swiped = useRef(false);
  const total = photos.length;

  function show(next: number) {
    if (!total) return;
    setIndex((next + total) % total);
  }

  function gesture(onNext: () => void) {
    return {
      onPointerDown: (event: { clientX: number }) => {
        startX.current = event.clientX;
      },
      onPointerUp: (event: { clientX: number }) => {
        if (startX.current == null) return;
        const delta = event.clientX - startX.current;
        startX.current = null;
        if (delta <= -30) {
          swiped.current = true;
          show(index + 1);
        } else if (delta >= 30) {
          swiped.current = true;
          show(index - 1);
        }
      },
      onClick: () => {
        if (swiped.current) {
          swiped.current = false;
          return;
        }
        onNext();
      },
    };
  }

  if (!total) {
    return (
      <div className="mb-4">
        <CarArt make={make} frame={0} />
      </div>
    );
  }

  return (
    <>
      <div className="relative mb-4 overflow-hidden rounded-md" {...gesture(() => show(index + 1))}>
        <img src={photos[index]} alt="" className="aspect-video w-full object-cover" />
        {total > 1 ? (
          <span className="pointer-events-none absolute right-2 bottom-2 rounded bg-black/70 px-2 py-1 text-xs text-white">
            {index + 1} / {total}
          </span>
        ) : null}
        <button
          type="button"
          className="absolute top-2 right-2 min-h-11 rounded bg-black/70 px-3 text-xs font-semibold text-white"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            setLarge(true);
          }}
        >
          Enlarge
        </button>
      </div>
      {total > 1 ? (
        <div className="mb-4 grid grid-cols-4 gap-2">
          {photos.map((src, photoIndex) => (
            <button key={photoIndex} type="button" onClick={() => setIndex(photoIndex)} aria-label={`Photo ${photoIndex + 1}`}>
              <img src={src} alt="" className={`aspect-square w-full rounded-md object-cover ${photoIndex === index ? "ring-2 ring-accent" : ""}`} />
            </button>
          ))}
        </div>
      ) : null}
      {large ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black">
          <button type="button" className="absolute top-4 right-4 z-10 min-h-11 min-w-11 rounded-md bg-surface text-fg" onClick={() => setLarge(false)} aria-label="Close enlarged photo">
            <X className="mx-auto h-5 w-5" />
          </button>
          <div className="relative flex h-[100dvh] w-full items-center justify-center" {...gesture(() => show(index + 1))}>
            <img src={photos[index]} alt="" className="h-[100dvh] w-full object-contain" />
            {total > 1 ? (
              <span className="pointer-events-none absolute right-3 bottom-3 rounded bg-black/70 px-2 py-1 text-xs text-white">
                {index + 1} / {total}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

export function CarDialog({
  car,
  startMessage,
  startLookup = false,
  startReport = false,
  startFlag = false,
  onClose,
  onMessage,
  onLookupStarted,
  onReportStarted,
  onOpenPart,
  reviewActions,
}: {
  car: Car;
  startMessage: boolean;
  startLookup?: boolean;
  startReport?: boolean;
  startFlag?: boolean;
  onClose: () => void;
  onMessage: () => boolean;
  onLookupStarted?: () => void;
  onReportStarted?: () => void;
  onOpenPart: (id: string) => void;
  reviewActions?: ReactNode;
}) {
  const { user, messages, parts, addMessage, setIntent } = useMarket();
  const navigate = useNavigate();
  const [text, setText] = useState("Hi, is this still available?");
  const [sent, setSent] = useState(false);
  const [showParts, setShowParts] = useState(false);
  const [batteryBusy, setBatteryBusy] = useState(false);
  const [batteryError, setBatteryError] = useState("");
  const [batteryResult, setBatteryResult] = useState<BatteryLookup | null>(null);
  const [reportNote, setReportNote] = useState("");
  const specs = car.specs;
  const sellerDetails = [car.vin || specs?.vin ? `VIN: ${car.vin || specs?.vin}` : "", specs?.extra ? specs.extra : ""].filter(Boolean);
  const thread = [...messages]
    .filter(
      (message) =>
        message.kind === "car" &&
        message.adId === car.id &&
        !!user &&
        message.buyerEmail.toLowerCase() === user.email.toLowerCase(),
    )
    .sort((a, b) => b.createdAt - a.createdAt)[0];
  const sentMessage = sent;

  useEffect(() => {
    setSent(false);
    setBatteryResult(null);
    setBatteryError("");
  }, [car.id, startMessage]);

  const startedLookup = useRef(false);
  const startedReport = useRef(false);

  function openReport() {
    if (!user) {
      setIntent({ kind: "report", target: "car", id: car.id });
      void navigate({ to: "/login" });
      return;
    }
    const opened = window.open("https://www.ppsr.gov.au/", "_blank", "noopener,noreferrer");
    if (!opened) setReportNote("Press the button again to open the government PPSR page.");
  }

  useEffect(() => {
    if (!startReport || startedReport.current) return;
    startedReport.current = true;
    onReportStarted?.();
    openReport();
  }, [startReport]);

  async function lookupBattery() {
    if (!user) {
      setIntent({ kind: "battery", target: "car", id: car.id });
      void navigate({ to: "/login" });
      return;
    }
    if (batteryBusy) return;
    setBatteryError("");
    setBatteryBusy(true);
    try {
      const found = await lookupBatteryType({
        data: { make: car.make, model: car.model, year: String(car.year), vin: car.vin || specs?.vin },
      });
      setBatteryResult(found);
    } catch (error) {
      setBatteryError(error instanceof Error ? error.message : "Battery lookup is unavailable. Try again.");
    } finally {
      setBatteryBusy(false);
    }
  }

  useEffect(() => {
    if (!startLookup || startedLookup.current) return;
    startedLookup.current = true;
    onLookupStarted?.();
    void lookupBattery();
  }, [startLookup]);

  return (
    <DialogFrame title={`${car.year} ${car.make} ${car.model}`} onClose={onClose}>
      <AdPhotos key={car.id} photos={car.photos} make={car.make} />
      {reviewActions}
      {car.writeoff ? <WriteOffTag className="mb-3" /> : null}
      <h2 className="pr-10 text-2xl font-bold">
        {car.year} {car.make} {car.model}
      </h2>
      <p className="mt-1 text-sm text-muted">
        {car.ebike || car.id.startsWith("ebike-")
          ? `${new Intl.NumberFormat("en-AU").format(car.km)} hours`
          : kmLabel(car.km)} · {car.seller} · {car.city}, {car.state}
      </p>
      {car.registration ? (
        <p className={`rego-plate rego-ad mt-3 ${plateClass(car.state)}`}>
          <span style={{ fontSize: plateFont(car.registration) }}>{car.registration}</span>
          {plateName(car.state) ? <span className="rego-legend">{plateName(car.state)}</span> : null}
        </p>
      ) : null}
      <p className="mt-2 text-xl font-bold text-accent">{money(car.price)}</p>
      {sellerDetails.length ? (
        <div className="mt-4 rounded-md bg-bg p-3 text-sm">
          {sellerDetails.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      ) : null}
      {batteryBusy ? (
        <Charging className="mt-3" label="Looking up battery…" />
      ) : (
        <button type="button" className="lookup-plate glow-hover mt-3 min-h-11 px-3 text-sm" onClick={() => void lookupBattery()}>
          Look up battery type
        </button>
      )}
      {batteryError ? <p className="mt-2 text-sm text-danger">{batteryError}</p> : null}
      {batteryResult ? <BatteryResult found={batteryResult} make={car.make} model={car.model} year={String(car.year)} /> : null}
      {car.note ? <p className="mt-3 text-sm text-muted">{car.note}</p> : null}
      {car.writeoff ? (
        <>
          <button type="button" className="lookup-plate glow-hover mt-4 min-h-11 px-4 text-sm" onClick={openReport}>
            Look up accident report
          </button>
          {reportNote ? <p className="mt-2 text-sm text-muted">{reportNote}</p> : null}
        </>
      ) : null}
      <button type="button" className="lookup-plate glow-hover mt-4 min-h-11 px-4 text-sm" onClick={() => setShowParts((open) => !open)}>
        Parts for this car
      </button>
      {showParts ? <NearbyParts parts={parts} car={car} onOpen={onOpenPart} /> : null}
      <form
        className="mt-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (sentMessage) {
            void navigate({ to: "/inbox", search: thread ? { open: thread.id } : {} });
            return;
          }
          if (!user) {
            onMessage();
            return;
          }
          if (!text.trim()) return;
          const sellerEmail = car.ownerEmail || car.contactEmail || "";
          if (sellerEmail) {
            addMessage({
              id: `m-${Date.now()}`,
              kind: "car",
              adId: car.id,
              adTitle: `${car.year} ${car.make} ${car.model}`,
              sellerEmail,
              buyerEmail: user.email,
              buyerName: user.name,
              text: text.trim(),
              createdAt: Date.now(),
              read: false,
            });
          }
          setSent(true);
        }}
      >
        <label className="mb-1 block text-sm font-medium" htmlFor="seller-message">
          Your message
        </label>
        <MessageLine id="seller-message" value={text} onChange={setText} />
        <button
          type={sentMessage ? "button" : "submit"}
          className="glow-hover mt-2 min-h-11 w-full rounded-md bg-accent text-sm font-semibold text-accent-ink"
          onClick={() => {
            if (sentMessage) void navigate({ to: "/inbox", search: thread ? { open: thread.id } : {} });
          }}
        >
          {sentMessage ? "See reply" : "Send message"}
        </button>
        {sent ? (
          <p className="mt-3 rounded-md border border-accent bg-bg p-3 text-sm" role="status">
            {car.ownerEmail || car.contactEmail
              ? "Sent. The seller will see it in Inbox when they sign in with the email on this ad. Nothing was emailed."
              : "This demo ad has no seller account, so it was not added to an inbox."}
          </p>
        ) : null}
      </form>
      <ReportAd kind="car" id={car.id} title={`${car.year} ${car.make} ${car.model}`} startOpen={startFlag} />
    </DialogFrame>
  );
}

export function PartDialog({
  part,
  startMessage,
  startLookup = false,
  startFlag = false,
  onClose,
  onMessage,
  onLookupStarted,
  reviewActions,
}: {
  part: Part;
  startMessage: boolean;
  startLookup?: boolean;
  startFlag?: boolean;
  onClose: () => void;
  onMessage: () => boolean;
  onLookupStarted?: () => void;
  reviewActions?: ReactNode;
}) {
  const { user, messages, addMessage, setIntent } = useMarket();
  const navigate = useNavigate();
  const [text, setText] = useState("Hi, is this still available?");
  const [sent, setSent] = useState(false);
  const [batteryBusy, setBatteryBusy] = useState(false);
  const [batteryError, setBatteryError] = useState("");
  const [batteryResult, setBatteryResult] = useState<BatteryLookup | null>(null);
  const startedLookup = useRef(false);
  const thread = [...messages]
    .filter(
      (message) =>
        message.kind === "part" &&
        message.adId === part.id &&
        !!user &&
        message.buyerEmail.toLowerCase() === user.email.toLowerCase(),
    )
    .sort((a, b) => b.createdAt - a.createdAt)[0];
  const sentMessage = sent;

  useEffect(() => {
    setSent(false);
  }, [part.id, startMessage]);

  async function lookupBattery() {
    if (!user) {
      setIntent({ kind: "battery", target: "part", id: part.id });
      void navigate({ to: "/login" });
      return;
    }
    if (batteryBusy) return;
    setBatteryError("");
    setBatteryBusy(true);
    try {
      const found = await lookupBatteryType({
        data: { make: part.make, model: part.model, year: part.year },
      });
      setBatteryResult(found);
    } catch (error) {
      setBatteryError(error instanceof Error ? error.message : "Battery lookup is unavailable. Try again.");
    } finally {
      setBatteryBusy(false);
    }
  }

  useEffect(() => {
    if (!startLookup || startedLookup.current) return;
    startedLookup.current = true;
    onLookupStarted?.();
    void lookupBattery();
  }, [startLookup]);

  return (
    <DialogFrame title={part.title} onClose={onClose}>
      <AdPhotos key={part.id} photos={part.photos} make={part.make} />
      {reviewActions}
      <h2 className="pr-10 text-2xl font-bold">{part.title}</h2>
      <p className="mt-2 text-xl font-bold text-accent">{money(part.price)}</p>
      <p className="mt-1 text-sm text-muted">
        {part.city}, {part.state} · Fits {part.make} {part.model} {part.year}
      </p>
      {part.description ? <p className="mt-3 text-sm">{part.description}</p> : null}
      {batteryBusy ? (
        <Charging className="mt-4" label="Looking up battery…" />
      ) : (
        <button type="button" className="lookup-plate glow-hover mt-4 min-h-11 px-3 text-sm" onClick={() => void lookupBattery()}>
          Look up battery type
        </button>
      )}
      {batteryError ? <p className="mt-2 text-sm text-danger">{batteryError}</p> : null}
      {batteryResult ? <BatteryResult found={batteryResult} make={part.make} model={part.model} year={String(part.year)} /> : null}
      <form
        className="mt-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (sentMessage) {
            void navigate({ to: "/inbox", search: thread ? { open: thread.id } : {} });
            return;
          }
          if (!user) {
            onMessage();
            return;
          }
          if (!text.trim()) return;
          const sellerEmail = part.ownerEmail || part.contactEmail || "";
          if (sellerEmail) {
            addMessage({
              id: `m-${Date.now()}`,
              kind: "part",
              adId: part.id,
              adTitle: part.title,
              sellerEmail,
              buyerEmail: user.email,
              buyerName: user.name,
              text: text.trim(),
              createdAt: Date.now(),
              read: false,
            });
          }
          setSent(true);
        }}
      >
        <label className="mb-1 block text-sm font-medium" htmlFor="part-message">
          Your message
        </label>
        <MessageLine id="part-message" value={text} onChange={setText} />
        <button
          type={sentMessage ? "button" : "submit"}
          className="glow-hover mt-2 min-h-11 w-full rounded-md bg-accent text-sm font-semibold text-accent-ink"
          onClick={() => {
            if (sentMessage) void navigate({ to: "/inbox", search: thread ? { open: thread.id } : {} });
          }}
        >
          {sentMessage ? "See reply" : "Send message"}
        </button>
        {sent ? (
          <p className="mt-3 rounded-md border border-accent bg-bg p-3 text-sm" role="status">
            {part.ownerEmail || part.contactEmail
              ? "Sent. The seller will see it in Inbox when they sign in with the email on this ad. Nothing was emailed."
              : "This demo ad has no seller account, so it was not added to an inbox."}
          </p>
        ) : null}
      </form>
      <ReportAd kind="part" id={part.id} title={part.title} startOpen={startFlag} />
    </DialogFrame>
  );
}

export function ServiceDialog({
  service,
  showContact,
  startFlag = false,
  onClose,
  onContact,
  reviewActions,
}: {
  service: Service;
  showContact: boolean;
  startFlag?: boolean;
  onClose: () => void;
  onContact: () => boolean;
  reviewActions?: ReactNode;
}) {
  const [open, setOpen] = useState(showContact);
  useEffect(() => setOpen(showContact), [service.id, showContact]);
  const phone = service.phone && service.phone !== DEMO_PHONE ? service.phone : "";
  const email = service.email && service.email !== DEMO_EMAIL ? service.email : "";
  const tel = phone.replace(/[^\d+]/g, "");

  return (
    <DialogFrame title={service.name} onClose={onClose}>
      <AdPhotos key={service.id} photos={service.photos} make="Other" />
      {reviewActions}
      <h2 className="pr-10 text-2xl font-bold">{service.name}</h2>
      <p className="mt-1 text-sm text-muted">
        {service.city}, {service.state} · {service.serviceType}
      </p>
      {service.note ? <p className="mt-3 text-sm">{service.note}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="contact-glow glow-hover min-h-11 rounded-md bg-accent px-4 text-sm font-semibold text-accent-ink"
          onClick={() => {
            if (onContact()) setOpen(true);
          }}
        >
          Contact
        </button>
        <button type="button" className="min-h-11 rounded-md border border-border px-4 text-sm" onClick={onClose}>
          Close
        </button>
      </div>
      {open ? (
        <div className="mt-4 rounded-md bg-bg p-4 text-sm" role="status">
          <p className="font-semibold">Contact details</p>
          {phone ? (
            <p className="mt-2">
              Phone:{" "}
              <a className="text-accent underline" href={`tel:${tel}`}>
                {phone}
              </a>
            </p>
          ) : (
            <p className="mt-2">No phone number is listed.</p>
          )}
          {email ? (
            <p>
              Email:{" "}
              <a className="text-accent underline" href={`mailto:${email}`}>
                {email}
              </a>
            </p>
          ) : null}
          <p className="mt-2 text-muted">Demo contact details. On a live site these would belong to the workshop.</p>
        </div>
      ) : null}
      <ReportAd kind="service" id={service.id} title={service.name} startOpen={startFlag} />
    </DialogFrame>
  );
}

function ReportAd({
  kind,
  id,
  title,
  startOpen,
}: {
  kind: "car" | "part" | "service";
  id: string;
  title: string;
  startOpen: boolean;
}) {
  const { user, flags, addFlag, setIntent } = useMarket();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("Fake ad");
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);
  const mine = flags.find(
    (flag) => flag.adId === id && flag.status === "open" && user && flag.reporterEmail.toLowerCase() === user.email.toLowerCase(),
  );

  useEffect(() => {
    if (startOpen && user) setOpen(true);
  }, [startOpen, user, id]);

  function begin() {
    if (!user) {
      setIntent({ kind: "flag", target: kind, id });
      void navigate({ to: "/login" });
      return;
    }
    setOpen(true);
  }

  return (
    <div className="mt-4 border-t border-border pt-3">
      {mine || done ? (
        <p className="text-sm text-muted">Reported. This ad stays up while EV Rescue checks it.</p>
      ) : (
        <button type="button" className="min-h-11 text-sm font-semibold text-muted underline" onClick={begin}>
          Report
        </button>
      )}
      {open && !mine && !done ? (
        <form
          className="mt-2 grid gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!user) return;
            addFlag({
              id: `flag-${Date.now()}`,
              kind,
              adId: id,
              adTitle: title,
              reporterEmail: user.email,
              reporterName: user.name,
              reason,
              note: note.trim(),
              createdAt: Date.now(),
              status: "open",
            });
            setDone(true);
            setOpen(false);
          }}
        >
          <label className="text-sm">
            <span className="mb-1 block font-medium">Why are you reporting this?</span>
            <select className="min-h-11 w-full rounded-md border border-border bg-bg px-3" value={reason} onChange={(event) => setReason(event.target.value)}>
              <option>Fake ad</option>
              <option>Wrong photo</option>
              <option>Offensive language</option>
              <option>Other</option>
            </select>
          </label>
          <textarea
            className="min-h-16 w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
            placeholder="Optional details"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
          <button type="submit" className="glow-hover min-h-11 rounded-md border border-border px-4 text-sm font-semibold">
            Send report
          </button>
        </form>
      ) : null}
    </div>
  );
}

function MessageLine({ id, value, onChange }: { id: string; value: string; onChange: (value: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const field = ref.current;
    if (!field) return;
    field.style.height = "0px";
    field.style.height = `${field.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      id={id}
      rows={1}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="max-h-40 min-h-11 w-full resize-none overflow-hidden rounded-md border border-border bg-bg px-3 py-2 text-sm"
    />
  );
}
