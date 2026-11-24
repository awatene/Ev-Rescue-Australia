import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Shell } from "@/components/shell";
import { useMarket } from "@/components/market-provider";
import { money } from "@/lib/market/data";

export const Route = createFileRoute("/my-ads")({
  component: MyAdsPage,
});

function sameEmail(value: string | undefined, email: string) {
  return Boolean(value) && value!.trim().toLowerCase() === email.trim().toLowerCase();
}

function MyAdsPage() {
  const { user, cars, parts, services, draft, setIntent } = useMarket();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) return;
    setIntent({ kind: "mine" });
    void navigate({ to: "/login" });
  }, [user, navigate, setIntent]);

  if (!user) {
    return (
      <Shell>
        <main className="mx-auto max-w-3xl px-4 py-10">
          <p className="text-sm text-muted">Sign in to see your ads.</p>
        </main>
      </Shell>
    );
  }

  const email = user.email;
  const myCars = cars.filter((car) => sameEmail(car.ownerEmail, email) || sameEmail(car.contactEmail, email));
  const myParts = parts.filter((part) => sameEmail(part.ownerEmail, email) || sameEmail(part.contactEmail, email));
  const myServices = services.filter(
    (service) => sameEmail(service.ownerEmail, email) || (service.id.startsWith("service-") && sameEmail(service.email, email)),
  );
  const total = myCars.length + myParts.length + myServices.length;

  return (
    <Shell>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-3xl font-extrabold">My ads</h1>
        <p className="mt-2 text-sm text-muted">
          Ads listed by {user.name} ({user.email}). Demo cars already on the site are not included.
        </p>
        {draft ? (
          <p className="mt-4 rounded-md border border-border bg-surface px-4 py-3 text-sm">
            You have an unfinished ad on this device.{" "}
            <Link to="/list" className="font-semibold text-accent">
              Continue listing
            </Link>
          </p>
        ) : null}
        {total === 0 ? (
          <p className="mt-6 text-sm text-muted">
            You have not published an ad yet.{" "}
            <Link to="/list" className="font-semibold text-accent">
              Place a free ad
            </Link>
          </p>
        ) : null}

        <AdGroup title="EVs" empty={myCars.length === 0}>
          {myCars.map((car) => (
            <div key={car.id} className="flex items-center gap-3 rounded-md border border-border bg-surface p-3">
              <Link to="/" search={{ open: `car:${car.id}` }} className="flex min-w-0 flex-1 gap-3">
                <Thumb src={car.photos[0]} />
                <span>
                  <span className="block font-semibold">
                    {car.year} {car.make} {car.model}
                  </span>
                  <span className="block text-sm text-muted">
                    {car.city}, {car.state}
                    {car.featured ? " · Featured" : ""}
                    {car.review === "pending" ? " · Waiting for a check" : ""}
                  </span>
                  <span className="block text-sm font-semibold text-accent">{money(car.price)}</span>
                </span>
              </Link>
              <Link to="/list" search={{ edit: `car:${car.id}` }} className="glow-hover inline-flex min-h-11 items-center rounded-md border border-border px-3 text-sm font-semibold">
                Edit
              </Link>
            </div>
          ))}
        </AdGroup>

        <AdGroup title="Parts" empty={myParts.length === 0}>
          {myParts.map((part) => (
            <div key={part.id} className="flex items-center gap-3 rounded-md border border-border bg-surface p-3">
              <Link to="/" search={{ open: `part:${part.id}` }} className="flex min-w-0 flex-1 gap-3">
                <Thumb src={part.photos[0]} />
                <span>
                  <span className="block font-semibold">{part.title}</span>
                  <span className="block text-sm text-muted">
                    {part.city}, {part.state}
                    {part.featured ? " · Featured" : ""}
                    {part.review === "pending" ? " · Waiting for a check" : ""}
                  </span>
                  <span className="block text-sm font-semibold text-accent">{money(part.price)}</span>
                </span>
              </Link>
              <Link to="/list" search={{ edit: `part:${part.id}` }} className="glow-hover inline-flex min-h-11 items-center rounded-md border border-border px-3 text-sm font-semibold">
                Edit
              </Link>
            </div>
          ))}
        </AdGroup>

        <AdGroup title="Services" empty={myServices.length === 0}>
          {myServices.map((service) => (
            <div key={service.id} className="flex items-center gap-3 rounded-md border border-border bg-surface p-3">
              <Link to="/" search={{ open: `service:${service.id}` }} className="flex min-w-0 flex-1 gap-3">
                <Thumb src={service.photos[0]} />
                <span>
                  <span className="block font-semibold">{service.name}</span>
                  <span className="block text-sm text-muted">
                    {service.serviceType} · {service.city}, {service.state}
                    {service.featured ? " · Featured" : ""}
                    {service.review === "pending" ? " · Waiting for a check" : ""}
                  </span>
                </span>
              </Link>
              <Link to="/list" search={{ edit: `service:${service.id}` }} className="glow-hover inline-flex min-h-11 items-center rounded-md border border-border px-3 text-sm font-semibold">
                Edit
              </Link>
            </div>
          ))}
        </AdGroup>
      </main>
    </Shell>
  );
}

function AdGroup({ title, empty, children }: { title: string; empty: boolean; children: ReactNode }) {
  if (empty) return null;
  return (
    <section className="mt-8">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="mt-3 grid gap-3">{children}</div>
    </section>
  );
}

function Thumb({ src }: { src?: string }) {
  if (!src) return <span className="h-16 w-24 shrink-0 rounded-md bg-bg" />;
  return <img src={src} alt="" className="h-16 w-24 shrink-0 rounded-md object-cover" />;
}
