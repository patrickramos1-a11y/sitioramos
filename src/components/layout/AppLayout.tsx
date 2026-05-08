import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: React.ReactNode;
}

const routeTitles: Record<string, string> = {
  "/": "Visão Geral",
  "/areas": "Áreas",
  "/caixa": "Fluxo de Caixa",
  "/operacao": "Operação",
  "/lancamentos": "Lançamentos",
  "/propriedade": "Propriedade",
  "/emprestimos": "Empréstimos",
  "/contatos": "Contatos",
  "/responsaveis": "Responsáveis",
  "/diario": "Diário de Campo",
};

export function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();
  const location = useLocation();
  const title =
    routeTitles[location.pathname] ||
    (location.pathname.startsWith("/areas/")
      ? "Detalhe da Área"
      : location.pathname.startsWith("/talhoes/")
      ? "Detalhe do Talhão"
      : "Sítio Ramos");

  if (isMobile) {
    const isHome = location.pathname === "/";
    return (
      <div className="flex h-[100dvh] flex-col overflow-hidden bg-background">
        <header className="shrink-0 z-30 flex h-12 items-center gap-2.5 border-b border-border/60 bg-card/95 backdrop-blur px-3 pt-safe shadow-soft">
          <div className="flex h-8 w-8 items-center justify-center rounded-full overflow-hidden bg-gradient-forest shadow-sun shrink-0">
            <BrandLogo variant="mono" className="h-6 w-6 text-brand-paper" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-[14px] font-semibold leading-tight truncate">{title}</h1>
            <p className="text-[9px] uppercase tracking-[0.18em] text-brand-leaf leading-tight">Sítio Ramos</p>
          </div>
        </header>
        <main
          className={cn(
            "flex-1 min-h-0 min-w-0 overflow-x-hidden",
            isHome ? "overflow-hidden p-3" : "overflow-y-auto p-4",
          )}
        >
          {children}
        </main>
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b border-border/60 bg-card/95 backdrop-blur px-4 lg:h-16 lg:px-6 shadow-soft">
          <SidebarTrigger className="-ml-1" />
          <div className="h-6 w-px bg-border" />
          <h2 className="font-display text-base lg:text-lg font-semibold text-foreground/90 truncate">{title}</h2>
          <div className="flex-1" />
          <div className="hidden md:flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-brand-leaf">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-sun" />
            Onde a terra produz futuro
          </div>
        </header>
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-6 min-w-0 max-w-full">
          <div className="min-w-0 max-w-full">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
