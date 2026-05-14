import { ReactNode } from "react";

type Props = {
  title?: string;
  children: ReactNode;
};

/** Horizontal scroll-snap row for KPI cards on mobile, and grid on desktop. */
export function MobileKpiRow({ title, children }: Props) {
  return (
    <div className="space-y-1.5">
      {title && <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium px-1">{title}</p>}
      {/* Mobile: horizontal snap carousel */}
      <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-1 -mx-1 px-1 md:hidden scrollbar-thin">
        {children}
      </div>
      {/* Desktop: grid */}
      <div className="hidden md:grid gap-3 md:grid-cols-2 lg:grid-cols-4">{children}</div>
    </div>
  );
}
