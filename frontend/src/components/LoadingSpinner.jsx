const LoadingSpinner = ({ label = 'Loading' }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink-400">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-pin animate-pin-pulse" style={{ animationDelay: '0ms' }} />
        <span className="w-2.5 h-2.5 rounded-full bg-signal animate-pin-pulse" style={{ animationDelay: '200ms' }} />
        <span className="w-2.5 h-2.5 rounded-full bg-ink-900 animate-pin-pulse" style={{ animationDelay: '400ms' }} />
      </div>
      <p className="text-xs font-mono uppercase tracking-widest">{label}</p>
    </div>
  );
};

export default LoadingSpinner;
