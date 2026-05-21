import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { lovable } from "@/integrations/lovable";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.12c-.22-.66-.35-1.36-.35-2.12s.13-1.46.35-2.12V7.04H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.96l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.46 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
  </svg>
);

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  reason?: string;
}

export const AuthDialog = ({ open, onOpenChange, reason }: Props) => {
  const [busy, setBusy] = useState(false);

  const handleGoogle = async () => {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.href,
      });
      if (result.error) {
        toast({ title: "Google sign-in failed", description: result.error.message, variant: "destructive" });
        setBusy(false);
        return;
      }
      if (result.redirected) return;
      // Session set — listener in useAuth will close dialog
    } catch (e) {
      toast({ title: "Sign-in error", description: (e as Error).message, variant: "destructive" });
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-primary via-interview to-accent flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <DialogTitle className="text-center">Sign in to continue</DialogTitle>
          <DialogDescription className="text-center">
            {reason ?? "Sign in with Google to use this feature. We'll bring you right back."}
          </DialogDescription>
        </DialogHeader>

        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full mt-2"
          onClick={handleGoogle}
          disabled={busy}
        >
          {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleIcon />}
          Continue with Google
        </Button>

        <p className="text-xs text-muted-foreground text-center mt-2">
          By continuing, you agree to our terms. No email verification required.
        </p>
      </DialogContent>
    </Dialog>
  );
};
