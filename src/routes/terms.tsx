import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { SITE_EMAIL } from "@/lib/market/data";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
});

function TermsPage() {
  return (
    <Shell>
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-extrabold">Terms</h1>
        <p className="mt-2 text-sm text-muted">EV Rescue Australia. A short version for members. Updated November 2026.</p>

        <section className="mt-8 space-y-3 text-sm">
          <h2 className="text-xl font-bold">What this site is</h2>
          <p>EV Rescue is a marketplace for used electric vehicles, eBikes, parts and workshops in Australia. We are not the seller, the buyer or the workshop. A deal is between those people.</p>
        </section>

        <section className="mt-8 space-y-3 text-sm">
          <h2 className="text-xl font-bold">Ads</h2>
          <p>You must be signed in to place an ad. The details and photos must be true and must be of the vehicle, bike or part you are selling. A first ad, a repeated photo or an unclear photo can be held until we check it. A note about that ad is emailed to {SITE_EMAIL}. The photos stay on the Check ads page. The ad stays off the public site until it is approved.</p>
          <p>The repaired write-off tag is your choice. Only use it if the vehicle was written off, repaired and is ready for sale. Buyers can open the government PPSR page themselves. That check is not done by EV Rescue.</p>
          <p>A basic ad is free. Paid featuring is turned off for now.</p>
        </section>

        <section className="mt-8 space-y-3 text-sm">
          <h2 className="text-xl font-bold">Buying</h2>
          <p>Never pay a deposit or send money before you have seen the vehicle. Meet in a safe place. Check the registration, the PPSR and the battery details yourself. Get an independent inspection if you want one. Longevity notes on this site are general. They are not a promise about any one car.</p>
        </section>

        <section className="mt-8 space-y-3 text-sm">
          <h2 className="text-xl font-bold">Messages and reports</h2>
          <p>Messages stay on EV Rescue. They are not emailed to the other person. Do not share your password. You can ask for a phone number in a message if you choose to.</p>
          <p>Anyone can report an ad. The ad stays up while we look at it. If it breaks these terms, we can remove it. We can also refuse or close an account.</p>
        </section>

        <section className="mt-8 space-y-3 text-sm">
          <h2 className="text-xl font-bold">Your account</h2>
          <p>Keep your sign-in details to yourself. The name and contact details on your profile are the ones shown with your ads. You can edit or remove your ads. Photos you upload stay with the ad until you delete them or we remove the ad.</p>
        </section>

        <section className="mt-8 space-y-3 text-sm">
          <h2 className="text-xl font-bold">Privacy</h2>
          <p>We keep the details you give us so the site can work: your name, email, seller type, profile picture, ads and messages. Your name and picture can show on your ads and in the inbox. A phone number is only stored for a workshop ad.</p>
          <p>Messages stay on EV Rescue. They are not emailed to the other member. A Help message, and a note when an ad is held for checking, is sent to {SITE_EMAIL}. We do not sell your details. You can change your profile, or delete an ad, while you are signed in. To delete the whole account, including a Facebook sign-in, use <Link to="/data-deletion" className="text-accent underline">Delete your data</Link>.</p>
        </section>

        <section className="mt-8 space-y-3 text-sm">
          <h2 className="text-xl font-bold">Contact</h2>
          <p>
            Questions about these terms go to <a className="text-accent underline" href={`mailto:${SITE_EMAIL}`}>{SITE_EMAIL}</a> or through <Link to="/contact" className="text-accent underline">Help</Link>.
          </p>
        </section>
      </main>
    </Shell>
  );
}
