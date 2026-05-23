import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Menu, X, Sparkles, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/resume", label: "Resume" },
  { href: "/skills", label: "Skills" },
  { href: "/jobs", label: "Jobs" },
  { href: "/interview", label: "Interview" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, openAuth } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const initials = (user?.user_metadata?.full_name || user?.email || "U")
    .split(" ").map((p: string) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="mx-4 mt-4">
        <motion.div 
          className="glass rounded-2xl shadow-lg"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <Link to="/" className="flex items-center gap-2 group">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-interview to-accent flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary via-interview to-accent opacity-0 group-hover:opacity-40 blur-lg transition-opacity" />
                </div>
                <span className="text-xl font-bold text-gradient hidden sm:block">CareerAI</span>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      location.pathname === link.href
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="hidden md:flex items-center gap-2">
                {user ? (
                  <>
                    <Avatar className="w-8 h-8 border border-border/50">
                      <AvatarImage src={user.user_metadata?.avatar_url} alt="" />
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <Button variant="ghost" size="sm" onClick={handleSignOut}>
                      <LogOut className="w-4 h-4" /> Sign out
                    </Button>
                  </>
                ) : (
                  <Button variant="hero" size="sm" onClick={() => openAuth("Sign in to access your AI career coach.")}>
                    Sign in
                  </Button>
                )}
              </div>




              {/* Mobile Menu Toggle */}
              <button
                className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
                onClick={() => setIsOpen(!isOpen)}
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="md:hidden mx-4 mt-2"
          >
            <div className="glass rounded-2xl shadow-lg p-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "block px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                    location.pathname === link.href
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              {user ? (
                <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => { setIsOpen(false); handleSignOut(); }}>
                  <LogOut className="w-4 h-4" /> Sign out
                </Button>
              ) : (
                <Button variant="hero" size="sm" className="w-full" asChild>
                  <Link to="/auth" onClick={() => setIsOpen(false)}>Sign in</Link>
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
