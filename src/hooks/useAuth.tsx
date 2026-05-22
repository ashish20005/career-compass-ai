import { createContext, useContext, useEffect, useState, ReactNode, useRef, useCallback, lazy, Suspense } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const AuthDialog = lazy(() =>
  import("@/components/AuthDialog").then((m) => ({ default: m.AuthDialog }))
);

type AuthCtx = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  /** Resolves true once the user is signed in. Opens the auth modal if not. */
  requireAuth: (reason?: string) => Promise<boolean>;
  openAuth: (reason?: string) => void;
};

const Ctx = createContext<AuthCtx>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  requireAuth: async () => false,
  openAuth: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reason, setReason] = useState<string | undefined>();

  const sessionRef = useRef<Session | null>(null);
  const readyRef = useRef(false);
  const readyWaitersRef = useRef<Array<() => void>>([]);
  const pendingResolvers = useRef<Array<(v: boolean) => void>>([]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      sessionRef.current = s;
      setSession(s);
      if (s?.user && pendingResolvers.current.length) {
        const resolvers = pendingResolvers.current;
        pendingResolvers.current = [];
        setDialogOpen(false);
        resolvers.forEach((r) => r(true));
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      sessionRef.current = data.session;
      setSession(data.session);
      setLoading(false);
      readyRef.current = true;
      readyWaitersRef.current.forEach((fn) => fn());
      readyWaitersRef.current = [];
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const waitForReady = () =>
    readyRef.current
      ? Promise.resolve()
      : new Promise<void>((resolve) => readyWaitersRef.current.push(resolve));

  const openAuth = useCallback((r?: string) => {
    setReason(r);
    setDialogOpen(true);
  }, []);

  const requireAuth = useCallback(async (r?: string): Promise<boolean> => {
    await waitForReady();
    if (sessionRef.current?.user) return true;
    return new Promise<boolean>((resolve) => {
      setReason(r);
      setDialogOpen(true);
      pendingResolvers.current.push(resolve);
    });
  }, []);

  const handleOpenChange = useCallback((open: boolean) => {
    setDialogOpen(open);
    if (!open && pendingResolvers.current.length) {
      const resolvers = pendingResolvers.current;
      pendingResolvers.current = [];
      resolvers.forEach((r) => r(false));
    }
  }, []);

  return (
    <Ctx.Provider
      value={{
        user: session?.user ?? null,
        session,
        loading,
        signOut: async () => {
          await supabase.auth.signOut();
        },
        requireAuth,
        openAuth,
      }}
    >
      {children}
      {dialogOpen && (
        <Suspense fallback={null}>
          <AuthDialog open={dialogOpen} onOpenChange={handleOpenChange} reason={reason} />
        </Suspense>
      )}
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);
