import { createContext, useContext, useEffect, useState, ReactNode, useRef, useCallback } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { AuthDialog } from "@/components/AuthDialog";

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

  const markReady = useCallback((nextSession: Session | null) => {
    sessionRef.current = nextSession;
    setSession(nextSession);
    setLoading(false);
    readyRef.current = true;
    readyWaitersRef.current.forEach((fn) => fn());
    readyWaitersRef.current = [];
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      sessionRef.current = s;
      setSession(s);
      if (!readyRef.current) {
        setLoading(false);
        readyRef.current = true;
        readyWaitersRef.current.forEach((fn) => fn());
        readyWaitersRef.current = [];
      }
      if (s?.user && pendingResolvers.current.length) {
        const resolvers = pendingResolvers.current;
        pendingResolvers.current = [];
        setDialogOpen(false);
        resolvers.forEach((r) => r(true));
      }
    });
    supabase.auth.getSession()
      .then(({ data }) => markReady(data.session))
      .catch(() => markReady(null));
    return () => sub.subscription.unsubscribe();
  }, [markReady]);

  const waitForReady = () => {
    if (readyRef.current) return Promise.resolve();
    return new Promise<void>((resolve) => {
      const timeout = window.setTimeout(resolve, 1200);
      readyWaitersRef.current.push(() => {
        window.clearTimeout(timeout);
        resolve();
      });
    });
  };

  const openAuth = useCallback((r?: string) => {
    setReason(r);
    setDialogOpen(true);
  }, []);

  const requireAuth = useCallback(async (r?: string): Promise<boolean> => {
    if (sessionRef.current?.user) return true;
    setReason(r);
    setDialogOpen(true);
    await waitForReady();
    if (sessionRef.current?.user) {
      setDialogOpen(false);
      return true;
    }
    return new Promise<boolean>((resolve) => {
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
        <AuthDialog open={dialogOpen} onOpenChange={handleOpenChange} reason={reason} />
      )}
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);
