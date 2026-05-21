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
  const pendingResolvers = useRef<Array<(v: boolean) => void>>([]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user && pendingResolvers.current.length) {
        pendingResolvers.current.forEach((r) => r(true));
        pendingResolvers.current = [];
        setDialogOpen(false);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const openAuth = useCallback((r?: string) => {
    setReason(r);
    setDialogOpen(true);
  }, []);

  const requireAuth = useCallback(
    (r?: string) =>
      new Promise<boolean>((resolve) => {
        if (session?.user) return resolve(true);
        setReason(r);
        setDialogOpen(true);
        pendingResolvers.current.push(resolve);
      }),
    [session]
  );

  const handleOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      pendingResolvers.current.forEach((r) => r(false));
      pendingResolvers.current = [];
    }
  };

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
      <AuthDialog open={dialogOpen} onOpenChange={handleOpenChange} reason={reason} />
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);
