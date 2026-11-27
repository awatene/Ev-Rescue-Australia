import { Charging } from "@/components/charging";
import { signIn, signInWithProvider, type DirectSocialProvider } from "@/lib/auth/client";

/** Same classes as the original Continue with Google button. */
const SOCIAL_BUTTON_CLASS = "glow-hover min-h-11 rounded-md border border-border text-sm font-semibold";

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
      />
    </svg>
  );
}

const LABEL: Record<DirectSocialProvider, string> = {
  google: "Google",
  apple: "Apple",
  facebook: "Facebook",
};

/**
 * Continue with Google, X, Apple, and Facebook.
 * Apple and Facebook use the Google button classes, plus a provider mark.
 */
export function SocialAuthButtons({
  callbackURL,
  busy,
  onBusy,
  onError,
}: {
  callbackURL: string;
  busy: string;
  onBusy: (busy: string) => void;
  onError: (message: string) => void;
}) {
  function startDirect(provider: DirectSocialProvider) {
    onError("");
    onBusy(provider);
    void signInWithProvider(provider, { callbackURL }).catch(() => {
      onBusy("");
      onError(`${LABEL[provider]} sign-in did not finish. Try again.`);
    });
  }

  function startX() {
    onError("");
    onBusy("grok-x");
    void signIn("grok-x", { callbackURL }).catch(() => {
      onBusy("");
      onError("Sign-in did not finish. Allow pop-ups and try again.");
    });
  }

  const pending = busy === "google" || busy === "apple" || busy === "facebook" || busy.startsWith("grok-");

  return (
    <>
      <button type="button" className={SOCIAL_BUTTON_CLASS} onClick={() => startDirect("google")}>
        Continue with Google
      </button>
      <button type="button" className={SOCIAL_BUTTON_CLASS} onClick={startX}>
        Continue with X
      </button>
      <button type="button" className={SOCIAL_BUTTON_CLASS} onClick={() => startDirect("apple")}>
        <span className="inline-flex items-center justify-center gap-2">
          <AppleIcon />
          Continue with Apple
        </span>
      </button>
      <button type="button" className={SOCIAL_BUTTON_CLASS} onClick={() => startDirect("facebook")}>
        <span className="inline-flex items-center justify-center gap-2">
          <FacebookIcon />
          Continue with Facebook
        </span>
      </button>
      {pending ? <Charging label="Signing in…" /> : null}
    </>
  );
}
