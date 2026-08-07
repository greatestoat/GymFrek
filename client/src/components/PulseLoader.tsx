export default function PulseLoader() {
  return (
    <div className="min-h-screen bg-ink flex flex-col items-center justify-center gap-4">
      <div className="flex items-end gap-1 h-10">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="w-1.5 bg-volt rounded-full animate-heartbeat"
            style={{ height: '100%', animationDelay: `${i * 0.12}s` }}
          />
        ))}
      </div>
      <p className="font-mono text-xs tracking-[0.3em] text-mist uppercase">Loading</p>
    </div>
  );
}
