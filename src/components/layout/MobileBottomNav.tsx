import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Wallet, ClipboardList, Menu, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useState } from "react";
import {
  Home,
  Landmark,
  Users,
} from "lucide-react";

const primaryItems = [
  { to: "/", label: "Início", icon: LayoutDashboard, exact: true },
  { to: "/ciclos", label: "Ciclos", icon: RefreshCw },
  { to: "/caixa", label: "Caixa", icon: Wallet },
  { to: "/operacao", label: "Operação", icon: ClipboardList },
];

const moreItems = [
  { to: "/propriedade", label: "Propriedade", icon: Home },
  { to: "/emprestimos", label: "Empréstimos", icon: Landmark },
  { to: "/contatos", label: "Contatos", icon: Users },
  { to: "/responsaveis", label: "Responsáveis", icon: Users },
];

export function MobileBottomNav() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const isActive = (to: string, exact?: boolean) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <nav
      className="shrink-0 z-40 border-t border-border/60 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 pb-safe md:hidden shadow-[0_-4px_20px_-8px_hsl(145_60%_12%/0.18)]"
      role="navigation"
      aria-label="Navegação principal"
    >
      <div className="grid grid-cols-5 h-16">
        {primaryItems.map((item) => {
          const active = isActive(item.to, item.exact);
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-all",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-b-full bg-gradient-sun" />
              )}
              <Icon
                className={cn(
                  "h-5 w-5 transition-transform",
                  active && "scale-110",
                )}
                strokeWidth={active ? 2.5 : 2}
              />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              className="flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground"
              aria-label="Mais opções"
            >
              <Menu className="h-5 w-5" />
              <span>Mais</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl pb-safe">
            <SheetHeader className="text-left mb-2">
              <SheetTitle>Mais</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-3 gap-3 py-2">
              {moreItems.map((item) => {
                const active = isActive(item.to);
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl border bg-card tap-card",
                      active && "border-primary bg-primary/5",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-6 w-6",
                        active ? "text-primary" : "text-muted-foreground",
                      )}
                    />
                    <span className="text-xs font-medium text-center">
                      {item.label}
                    </span>
                  </NavLink>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
