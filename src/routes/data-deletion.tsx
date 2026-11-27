import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { SITE_EMAIL } from "@/lib/market/data";

export const Route = createFileRoute("/data-deletion")({
  component: DataDeletionPage,
});

function DataDeletionPage() {
  return (
    <Shell>
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-extrabold">Delete your data</h1>
        <p className="mt-2 text-sm text-muted">EV Rescue Australia. Updated November 2026.</p>

        <section className="mt-8 space-y-3 text-sm">
          <h2 className="text-xl font-bold">What we keep from Facebook</h2>
          <p>If you sign in with Facebook, we receive your name, email address and profile picture. We use those so you can sign in, place ads and send messages. We do not sell them.</p>
        </section>

        <section className="mt-8 space-y-3 text-sm">
          <h2 className="text-xl font-bold">How to ask us to delete it</h2>
          <p>
            Email <a className="text-accent underline" href={`mailto:${SITE_EMAIL}?subject=Delete%20my%20data`}>{SITE_EMAIL}</a> from the same email on your account. Put “Delete my data” in the subject. Say if you signed in with Facebook, Google, X or an email password.
          </p>
          <p>You can also sign in and send the same request through <Link to="/contact" className="text-accent underline">Help</Link>.</p>
          <p>We delete the account, the Facebook sign-in, the profile name and picture, and the messages on that account. Ads you placed are removed with the account. We email you when it is done. This is usually within 30 days.</p>
        </section>

        <section className="mt-8 space-y-3 text-sm">
          <h2 className="text-xl font-bold">Remove EV Rescue inside Facebook</h2>
          <p>On Facebook, open Settings and privacy, then Settings, then Apps and websites. Find EV Rescue and choose Remove. That stops Facebook sharing new details with us. It does not delete the account already on EV Rescue. Email us as well if you want that removed.</p>
        </section>

        <section className="mt-8 space-y-3 text-sm">
          <h2 className="text-xl font-bold">What you can delete yourself</h2>
          <p>While you are signed in you can delete your own ads, change your name and email, and replace your profile picture. Deleting an ad removes its photos from the public site.</p>
        </section>

        <p className="mt-8 text-sm">
          <Link to="/terms" className="text-accent underline">Terms</Link>
        </p>
      </main>
    </Shell>
  );
}
