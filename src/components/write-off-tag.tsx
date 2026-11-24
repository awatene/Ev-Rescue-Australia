import { Zap } from "lucide-react";

export function WriteOffTag({ className = "" }: { className?: string }) {
  return (
    <span className={`group/wo inline-flex items-center ${className}`} title="Repaired write-off">
      <span className="flex h-6 w-6 items-center justify-center group-hover/wo:hidden">
        <Zap
          className="h-[0.675rem] w-[0.675rem] shrink-0 fill-[#fbbf24] text-[#9a3412] drop-shadow-[0_1px_1px_rgba(15,23,42,0.9)]"
          strokeWidth={2.5}
          aria-hidden="true"
        />
      </span>
      <span className="sale-tag hidden items-center gap-1 group-hover/wo:inline-flex">
        <Zap className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Repaired write-off
      </span>
      <span className="sr-only">Repaired write-off</span>
    </span>
  );
}
