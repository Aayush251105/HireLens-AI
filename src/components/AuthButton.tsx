import { useClerk, useUser, SignInButton } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function AuthButton() {
  const { user, isSignedIn, isLoaded } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!isLoaded) {
    return <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />;
  }

  if (!isSignedIn) {
    return (
      <SignInButton mode="redirect">
        <button className="flex items-center gap-2 px-4 py-1.5 rounded-lg border border-primary/40 bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors">
          <User className="w-3.5 h-3.5" />
          Sign In
        </button>
      </SignInButton>
    );
  }

  const initials = user.firstName
    ? `${user.firstName[0]}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : user.emailAddresses[0]?.emailAddress[0]?.toUpperCase() ?? '?';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-2 py-1 rounded-xl border border-border/60 bg-card/60 hover:bg-card transition-colors"
      >
        {user.imageUrl ? (
          <img src={user.imageUrl} alt={user.fullName ?? ''} className="w-7 h-7 rounded-full object-cover" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
            {initials}
          </div>
        )}
        <span className="text-sm text-foreground font-medium hidden sm:block max-w-[120px] truncate">
          {user.firstName ?? user.emailAddresses[0]?.emailAddress}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-border/60 bg-card/95 backdrop-blur-md shadow-xl overflow-hidden z-50"
          >
            {/* User info */}
            <div className="px-4 py-3 border-b border-border/40">
              <p className="text-sm font-semibold text-foreground truncate">{user.fullName ?? 'User'}</p>
              <p className="text-xs text-muted-foreground truncate">{user.emailAddresses[0]?.emailAddress}</p>
            </div>

            {/* Menu items */}
            <div className="py-1">
              <button
                onClick={() => { setOpen(false); navigate('/profile'); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted/60 transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 text-primary" />
                My Profile
              </button>
              <button
                onClick={() => { setOpen(false); signOut(); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
