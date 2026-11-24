import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell } from "@/components/shell";
import { CarDialog, PartDialog, ServiceDialog } from "@/components/ad-dialog";
import { useMarket } from "@/components/market-provider";
import { SITE_EMAIL, money } from "@/lib/market/data";
import { markAdsChecked } from "@/lib/market/review-day";

export const Route = createFileRoute("/admin")({
  validateSearch: (search: Record<string, unknown>): { open?: string } => {
    if (typeof search.open === "string" && search.open) return { open: search.open };
    return {};
  },
  component: AdminPage,
});

function AdminPage() {
  const { user, cars, parts, services, flags, approveCar, approvePart, approveService, removeCar, removePart, removeService, settleFlag, setIntent } = useMarket();
  const navigate = useNavigate();
  const { open: openSearch } = Route.useSearch();
  const admin = user?.email.toLowerCase() === SITE_EMAIL;
  const [openAd, setOpenAd] = useState<{ kind: "car" | "part" | "service"; id: string } | null>(null);

  useEffect(() => {
    if (user) return;
    setIntent({ kind: "admin", open: openSearch });
    void navigate({ to: "/login" });
  }, [user, navigate, setIntent]);

  useEffect(() => {
    if (admin) markAdsChecked();
  }, [admin]);

  useEffect(() => {
    if (!openSearch) return;
    const [kind, id] = openSearch.split(":");
    if (!id) return;
    if (kind === "part") setOpenAd({ kind: "part", id });
    else if (kind === "service") setOpenAd({ kind: "service", id });
    else setOpenAd({ kind: "car", id });
  }, [openSearch]);

  const pendingCars = cars.filter((car) => car.review === "pending");
  const pendingParts = parts.filter((part) => part.review === "pending");
  const pendingServices = services.filter((service) => service.review === "pending");
  const reported = flags.filter((flag) => flag.status === "open");
  const nothingWaiting = pendingCars.length + pendingParts.length + pendingServices.length + reported.length === 0;
  const openCar = openAd?.kind === "car" ? cars.find((car) => car.id === openAd.id) : undefined;
  const openPart = openAd?.kind === "part" ? parts.find((part) => part.id === openAd.id) : undefined;
  const openService = openAd?.kind === "service" ? services.find((service) => service.id === openAd.id) : undefined;

  function view(kind: "car" | "part" | "service", id: string) {
    setOpenAd({ kind, id });
  }

  function takeDown(id: string, kind: "car" | "part" | "service", adId: string) {
    if (kind === "car") removeCar(adId);
    if (kind === "part") removePart(adId);
    if (kind === "service") removeService(adId);
    settleFlag(id, "removed");
  }

  return (
    <Shell>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-3xl font-extrabold">Check ads</h1>
        <p className="mt-2 text-sm text-muted">When an ad is held, a note is emailed to {SITE_EMAIL}. Open the full ad and look at every photo before you approve it. Ads stay off the public site until then.</p>
        {!admin ? <p className="mt-6 text-sm text-muted">Sign in as {SITE_EMAIL} to check ads.</p> : null}
        {admin && nothingWaiting ? <p className="mt-6 text-sm text-muted">No ads are waiting.</p> : null}
        {admin ? (
          <div className="mt-6 grid gap-4">
            {pendingCars.map((car) => (
              <article key={car.id} className="rounded-md border border-border bg-surface p-4">
                <button type="button" className="block w-full text-left" onClick={() => view("car", car.id)}>
                  <PhotoStrip photos={car.photos} />
                  <h2 className="font-semibold">
                    {car.year} {car.make} {car.model}
                  </h2>
                  <p className="text-sm text-muted">
                    {car.city}, {car.state}
                    {car.ebike ? " · eBike" : " · EV"} · {money(car.price)}
                    {car.photos.length ? ` · ${car.photos.length} photo${car.photos.length === 1 ? "" : "s"}` : " · No photos"}
                  </p>
                  <p className="mt-2 text-sm">{car.note}</p>
                  <p className="mt-2 text-sm font-semibold text-accent">Open full ad to approve</p>
                </button>
                <div className="mt-3 flex gap-2">
                  <button type="button" className="glow-hover min-h-11 rounded-md border border-danger px-4 text-sm font-semibold text-danger" onClick={() => removeCar(car.id)}>
                    Reject
                  </button>
                </div>
              </article>
            ))}
            {pendingParts.map((part) => (
              <article key={part.id} className="rounded-md border border-border bg-surface p-4">
                <button type="button" className="block w-full text-left" onClick={() => view("part", part.id)}>
                  <PhotoStrip photos={part.photos} />
                  <h2 className="font-semibold">{part.title}</h2>
                  <p className="text-sm text-muted">
                    {part.city}, {part.state} · Part · {money(part.price)}
                    {part.photos.length ? ` · ${part.photos.length} photo${part.photos.length === 1 ? "" : "s"}` : " · No photos"}
                  </p>
                  <p className="mt-2 text-sm">{part.description}</p>
                  <p className="mt-2 text-sm font-semibold text-accent">Open full ad to approve</p>
                </button>
                <div className="mt-3 flex gap-2">
                  <button type="button" className="glow-hover min-h-11 rounded-md border border-danger px-4 text-sm font-semibold text-danger" onClick={() => removePart(part.id)}>
                    Reject
                  </button>
                </div>
              </article>
            ))}
            {pendingServices.map((service) => (
              <article key={service.id} className="rounded-md border border-border bg-surface p-4">
                <button type="button" className="block w-full text-left" onClick={() => view("service", service.id)}>
                  <PhotoStrip photos={service.photos} />
                  <h2 className="font-semibold">{service.name}</h2>
                  <p className="text-sm text-muted">
                    {service.city}, {service.state} · Workshop · {service.serviceType}
                    {service.photos.length ? ` · ${service.photos.length} photo${service.photos.length === 1 ? "" : "s"}` : " · No photos"}
                  </p>
                  <p className="mt-2 text-sm">{service.note}</p>
                  <p className="mt-2 text-sm font-semibold text-accent">Open full ad to approve</p>
                </button>
                <div className="mt-3 flex gap-2">
                  <button type="button" className="glow-hover min-h-11 rounded-md border border-danger px-4 text-sm font-semibold text-danger" onClick={() => removeService(service.id)}>
                    Reject
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : null}
        {admin && reported.length ? (
          <section className="mt-10">
            <h2 className="text-xl font-bold">Reported ads</h2>
            <p className="mt-1 text-sm text-muted">These ads stay on the site until you remove them.</p>
            <div className="mt-4 grid gap-4">
              {reported.map((flag) => {
                const car = flag.kind === "car" ? cars.find((item) => item.id === flag.adId) : undefined;
                const part = flag.kind === "part" ? parts.find((item) => item.id === flag.adId) : undefined;
                const service = flag.kind === "service" ? services.find((item) => item.id === flag.adId) : undefined;
                const photo = car?.photos[0] || part?.photos[0] || service?.photos[0];
                return (
                  <article key={flag.id} className="rounded-md border border-border bg-surface p-4">
                    <button type="button" className="block w-full text-left" onClick={() => view(flag.kind, flag.adId)}>
                      {photo ? <img src={photo} alt="" className="mb-3 aspect-video w-full rounded-md object-cover" /> : null}
                      <h3 className="font-semibold">{flag.adTitle}</h3>
                      <p className="text-sm text-muted">
                        {flag.reason}
                        {flag.note ? ` · ${flag.note}` : ""} · reported by {flag.reporterName}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-accent">View full ad</p>
                    </button>
                    <div className="mt-3 flex gap-2">
                      <button type="button" className="glow-hover min-h-11 rounded-md bg-accent px-4 text-sm font-semibold text-accent-ink" onClick={() => settleFlag(flag.id, "kept")}>
                        Keep ad
                      </button>
                      <button type="button" className="glow-hover min-h-11 rounded-md border border-danger px-4 text-sm font-semibold text-danger" onClick={() => takeDown(flag.id, flag.kind, flag.adId)}>
                        Remove ad
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}
      </main>
      {openCar ? (
        <CarDialog
          car={openCar}
          startMessage={false}
          onClose={() => setOpenAd(null)}
          onMessage={() => true}
          onOpenPart={(id) => setOpenAd({ kind: "part", id })}
          reviewActions={
            openCar.review === "pending" ? (
              <ReviewActions
                onApprove={() => {
                  approveCar(openCar.id);
                  setOpenAd(null);
                }}
                onReject={() => {
                  removeCar(openCar.id);
                  setOpenAd(null);
                }}
              />
            ) : null
          }
        />
      ) : null}
      {openPart ? (
        <PartDialog
          part={openPart}
          startMessage={false}
          onClose={() => setOpenAd(null)}
          onMessage={() => true}
          reviewActions={
            openPart.review === "pending" ? (
              <ReviewActions
                onApprove={() => {
                  approvePart(openPart.id);
                  setOpenAd(null);
                }}
                onReject={() => {
                  removePart(openPart.id);
                  setOpenAd(null);
                }}
              />
            ) : null
          }
        />
      ) : null}
      {openService ? (
        <ServiceDialog
          service={openService}
          showContact
          onClose={() => setOpenAd(null)}
          onContact={() => true}
          reviewActions={
            openService.review === "pending" ? (
              <ReviewActions
                onApprove={() => {
                  approveService(openService.id);
                  setOpenAd(null);
                }}
                onReject={() => {
                  removeService(openService.id);
                  setOpenAd(null);
                }}
              />
            ) : null
          }
        />
      ) : null}
    </Shell>
  );
}

function PhotoStrip({ photos }: { photos: string[] }) {
  if (!photos.length) return <p className="mb-3 text-sm text-muted">No photos uploaded.</p>;
  return (
    <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
      {photos.map((src, index) => (
        <img key={index} src={src} alt="" className="h-24 w-32 shrink-0 rounded-md object-cover" />
      ))}
    </div>
  );
}

function ReviewActions({ onApprove, onReject }: { onApprove: () => void; onReject: () => void }) {
  return (
    <div className="mb-4 rounded-md border border-border bg-bg p-3">
      <p className="text-sm text-muted">You are looking at the full ad. Check the photos above, then approve or reject.</p>
      <div className="mt-3 flex gap-2">
        <button type="button" className="glow-hover min-h-11 rounded-md bg-accent px-4 text-sm font-semibold text-accent-ink" onClick={onApprove}>
          Approve
        </button>
        <button type="button" className="glow-hover min-h-11 rounded-md border border-danger px-4 text-sm font-semibold text-danger" onClick={onReject}>
          Reject
        </button>
      </div>
    </div>
  );
}
