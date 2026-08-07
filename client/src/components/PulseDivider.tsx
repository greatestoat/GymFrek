// The signature motif of gym_frek: an EKG-style pulse line. Used as a
// section divider so the "heartbeat" idea threads through the whole app.
export default function PulseDivider({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 40"
      className={`w-full h-8 ${className}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polyline
        points="0,20 120,20 145,20 160,4 175,36 190,20 210,20 400,20"
        fill="none"
        stroke="#C6FF3D"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="1000"
        className="animate-drawline"
      />
    </svg>
  );
}
