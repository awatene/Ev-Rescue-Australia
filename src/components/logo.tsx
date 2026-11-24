export function Logo({ className = "h-14 w-auto" }: { className?: string }) {
  return <img src="/logo.png" alt="EV Rescue Australia" className={`rounded-md ${className}`} />;
}
