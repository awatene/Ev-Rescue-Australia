import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/shell";
import { useMarket } from "@/components/market-provider";

export const Route = createFileRoute("/pay")({
  component: PayPage,
});

const PLANS = [
  { id: "11", price: "$11", length: "One month" },
  { id: "19", price: "$19", length: "Three months" },
  { id: "99", price: "$99", length: "Twelve months" },
];

function PayPage() {
  const { pendingPay, cars, parts, services, markFeatured } = useMarket();
  const navigate = useNavigate();
  const [plan, setPlan] = useState("11");
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [error, setError] = useState("");

  const listing = !pendingPay
    ? null
    : pendingPay.kind === "car"
      ? cars.find((car) => car.id === pendingPay.id)
      : pendingPay.kind === "part"
        ? parts.find((part) => part.id === pendingPay.id)
        : services.find((service) => service.id === pendingPay.id);

  const title = !listing
    ? ""
    : "title" in listing
      ? listing.title
      : "serviceType" in listing
        ? listing.name
        : `${listing.year} ${listing.make} ${listing.model}`;

  function pay(method: "card" | "paypal") {
    if (!pendingPay) {
      setError("There is no ad waiting to be featured. Place an ad and tick Feature this ad.");
      return;
    }
    if (method === "card") {
      const digits = number.replace(/\s/g, "");
      if (!name.trim() || digits.length < 12 || !expiry.trim() || !cvc.trim()) {
        setError("Enter the name, card number, expiry and CVC, or use PayPal.");
        return;
      }
    }
    setError("");
    markFeatured(pendingPay, plan, method);
    void navigate({ to: "/", search: { notice: "featured" } });
  }

  return (
    <Shell>
      <main className="mx-auto max-w-xl px-4 py-10">
        <h1 className="text-3xl font-extrabold">Feature your ad</h1>
        <p className="mt-2 text-sm text-muted">
        Card numbers stay in this form only. They are not saved. PayPal and card both put the featured place on the shared site for the time you choose. This preview does not take a real payment until your PayPal business account is connected.
        </p>
        {listing ? (
          <p className="mt-4 rounded-md border border-border bg-surface p-3 text-sm">
            Featuring <strong>{title}</strong> with the {PLANS.find((item) => item.id === plan)?.length.toLowerCase()} plan.
          </p>
        ) : (
          <p className="mt-4 text-sm text-muted">
            No ad is waiting for payment. <Link to="/list" className="text-accent">Place a free ad</Link> and tick Feature
            this ad.
          </p>
        )}
        <div className="mt-4 grid gap-2">
          {PLANS.map((item) => (
            <label key={item.id} className={`flex min-h-11 cursor-pointer items-center justify-between rounded-md border px-3 ${plan === item.id ? "border-accent" : "border-border"}`}>
              <span className="flex items-center gap-2 text-sm font-semibold">
                <input type="radio" name="plan" checked={plan === item.id} onChange={() => setPlan(item.id)} />
                {item.length}
              </span>
              <span className="font-bold text-accent">{item.price}</span>
            </label>
          ))}
        </div>
        <div className="mt-6 grid gap-3">
          <h2 className="font-semibold">Card</h2>
          <input className="min-h-11 rounded-md border border-border bg-bg px-3" placeholder="Name on card" autoComplete="cc-name" value={name} onChange={(event) => setName(event.target.value)} />
          <input className="min-h-11 rounded-md border border-border bg-bg px-3" placeholder="Card number" inputMode="numeric" autoComplete="cc-number" value={number} onChange={(event) => setNumber(event.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <input className="min-h-11 rounded-md border border-border bg-bg px-3" placeholder="MM/YY" autoComplete="cc-exp" value={expiry} onChange={(event) => setExpiry(event.target.value)} />
            <input className="min-h-11 rounded-md border border-border bg-bg px-3" placeholder="CVC" inputMode="numeric" autoComplete="cc-csc" value={cvc} onChange={(event) => setCvc(event.target.value)} />
          </div>
        </div>
        {error ? <p className="mt-3 text-sm text-danger" role="alert">{error}</p> : null}
        <div className="mt-4 grid gap-2">
          <button type="button" className="glow-hover min-h-11 rounded-md bg-accent text-sm font-semibold text-accent-ink" onClick={() => pay("card")}>
            Pay {PLANS.find((item) => item.id === plan)?.price}
          </button>
          <button type="button" className="glow-hover min-h-11 rounded-md border border-border text-sm font-semibold" onClick={() => pay("paypal")}>
            PayPal
          </button>
        </div>
      </main>
    </Shell>
  );
}
