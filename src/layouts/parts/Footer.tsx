import { Zap, Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" fill="white" />
          </div>
          <div>
            <span className="font-heading font-bold text-sm text-foreground">
              HireLens <span className="text-primary">AI</span>
            </span>
            <p className="text-xs text-muted-foreground">Get evaluated like a real candidate</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium text-primary">Powered by AI</span>
        </div>
      </div>
    </footer>
  );
}
