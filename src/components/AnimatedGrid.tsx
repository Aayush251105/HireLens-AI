export default function AnimatedGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Grid lines */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.07]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#6C63FF" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-[120px] animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-purple-500/8 blur-[100px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
      <div className="absolute top-1/2 right-1/3 w-64 h-64 rounded-full bg-indigo-500/6 blur-[80px] animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
    </div>
  );
}
