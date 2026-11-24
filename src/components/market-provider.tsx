import { createContext, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { authEnabled } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { loadProfile } from "@/lib/market/profiles";
import { readState } from "@/lib/market/store";
import {
  addCar,
  addFlag,
  addMessage,
  addPart,
  addService,
  approveCar,
  approvePart,
  approveService,
  clearDraft,
  consumeIntent,
  getClientSnapshot,
  getReady,
  getReadyServer,
  getServerSnapshot,
  isSigningOut,
  markFeatured,
  markInboxRead,
  markMessageRead,
  normalizeState,
  replyToMessage,
  refreshSharedListings,
  ensureReviewDemo,
  refreshSharedMessages,
  refreshSharedReports,
  removeCar,
  removePart,
  removeService,
  saveDraft,
  setIntent,
  setPendingPay,
  settleFlag,
  signInUser,
  signOut,
  subscribe,
  subscribeReady,
  updateUser,
} from "@/lib/market/store";
import type { MarketState } from "@/lib/market/types";

type MarketApi = MarketState & {
  ready: boolean;
  signInUser: typeof signInUser;
  signOut: typeof signOut;
  updateUser: typeof updateUser;
  setIntent: typeof setIntent;
  consumeIntent: typeof consumeIntent;
  saveDraft: typeof saveDraft;
  clearDraft: typeof clearDraft;
  setPendingPay: typeof setPendingPay;
  addCar: typeof addCar;
  addFlag: typeof addFlag;
  approveCar: typeof approveCar;
  approvePart: typeof approvePart;
  approveService: typeof approveService;
  removeCar: typeof removeCar;
  removePart: typeof removePart;
  removeService: typeof removeService;
  settleFlag: typeof settleFlag;
  addPart: typeof addPart;
  addService: typeof addService;
  addMessage: typeof addMessage;
  markInboxRead: typeof markInboxRead;
  markMessageRead: typeof markMessageRead;
  replyToMessage: typeof replyToMessage;
  markFeatured: typeof markFeatured;
};

const MarketContext = createContext<MarketApi | null>(null);

function useMarketStore(): MarketApi {
  const raw = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  const ready = useSyncExternalStore(subscribeReady, getReady, getReadyServer);
  const state = useMemo(() => {
    try {
      return normalizeState(JSON.parse(raw));
    } catch {
      return normalizeState(null);
    }
  }, [raw]);

  return useMemo(
    () => ({
      ready,
      ...state,
      signInUser,
      signOut,
      updateUser,
      setIntent,
      consumeIntent,
      saveDraft,
      clearDraft,
      setPendingPay,
      addCar,
      addFlag,
      approveCar,
      approvePart,
      approveService,
      removeCar,
      removePart,
      removeService,
      settleFlag,
      addPart,
      addService,
      addMessage,
      markInboxRead,
      markMessageRead,
      replyToMessage,
      markFeatured,
    }),
    [ready, state],
  );
}

export function MarketProvider({ children }: { children: ReactNode }) {
  const api = useMarketStore();
  const email = api.user?.email ?? "";
  useEffect(() => {
    void refreshSharedListings().then(() => ensureReviewDemo());
    void refreshSharedReports();
  }, []);
  useEffect(() => {
    if (!email) return;
    void refreshSharedMessages();
    const timer = window.setInterval(() => void refreshSharedMessages(), 15000);
    return () => window.clearInterval(timer);
  }, [email]);
  return (
    <MarketContext.Provider value={api}>
      <ProviderPhotoSync />
      {children}
    </MarketContext.Provider>
  );
}

function ProviderPhotoSync() {
  const { signInUser } = useMarket();
  const { user: session, isPending } = useCurrentUserState();
  const email = session?.primaryEmail ?? "";

  useEffect(() => {
    if (!authEnabled || isPending || !session || session.isDevFallback || !email || isSigningOut()) return;
    let cancel = false;
    void (async () => {
      let saved: Awaited<ReturnType<typeof loadProfile>> = null;
      try {
        saved = await loadProfile({ data: { email } });
      } catch {
        saved = null;
      }
      if (cancel || isSigningOut()) return;
      const local = readState().accounts.find((account) => account.email.toLowerCase() === email.toLowerCase());
      const remote = session.profileImageUrl ? session.profileImageUrl.trim().replace(/^http:\/\//i, "https://").replace("_normal.", "_400x400.") : "";
      const remotePhoto = remote.startsWith("https://") ? remote : undefined;
      const photo = local?.photo?.startsWith("data:image") ? local.photo : local?.photo || saved?.photo || remotePhoto;
      signInUser({
        email,
        name: local?.name || saved?.name || session.displayName || email.split("@")[0] || "Member",
        phone: local?.phone || saved?.phone || "",
        role: local?.role || saved?.role || "private",
        provider: local?.provider || saved?.provider || "Account",
        photo,
        businessName: local?.businessName || saved?.businessName,
        abn: local?.abn || saved?.abn,
      });
    })();
    return () => {
      cancel = true;
    };
  }, [email, isPending, session, signInUser]);

  return null;
}

export function useMarket() {
  const ctx = useContext(MarketContext);
  if (!ctx) throw new Error("useMarket must be used within MarketProvider");
  return ctx;
}
