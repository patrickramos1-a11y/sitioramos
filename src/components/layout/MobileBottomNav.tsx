import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, MapPin, Wallet, ClipboardList, Menu } from "lucide-react";
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
  { to: "/areas", label: "Áreas", icon: MapPin },
  { to: "/caixa", label: "Caixa", icon: Wallet },
  { to: "/operacao", label: "Operação", icon: ClipboardList },
];

const moreItems = [
  { to: "/propriedade", label: "Propriedade", icon: Home },
  { to: "/emprestimos", label: "Empréstimos", icon: Landmark },
  { to: "/contatos", label: "Contatos", icon: Users },
];

export function MobileBottomNav() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const isActive = (to: string, exact?: boolean) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 pb-safe md:hidden"
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
                "flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
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
