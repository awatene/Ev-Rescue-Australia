export function Charging({ label, className = "" }: { label?: string; className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`} role="status">
      <span className="battery-charge" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
      </span>
      {label ? <span className="text-sm text-muted">{label}</span> : null}
    </div>
  );
}
