import { Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import AuthButton from '@/components/AuthButton';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" fill="white" />
          </div>
          <span className="font-heading font-bold text-lg text-foreground tracking-tight">
            HireLens <span className="text-primary">AI</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground hidden sm:block">Powered by AI</span>
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
