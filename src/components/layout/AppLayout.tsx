import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { useLocation } from "react-router-dom";

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
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-card/95 backdrop-blur px-4 pt-safe">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg overflow-hidden bg-white shrink-0">
            <img src={logo} alt="Sítio Ramos" className="h-8 w-8 object-contain" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-semibold leading-tight truncate">{title}</h1>
            <p className="text-[11px] text-muted-foreground leading-tight">Sítio Ramos</p>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden p-4 pb-safe-nav">
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
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-16 lg:px-6">
          <SidebarTrigger className="-ml-1" />
          <div className="flex-1" />
        </header>
        <main className="flex-1 overflow-auto p-4 lg:p-6 min-w-0 max-w-full">
          <div className="min-w-0 max-w-full">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
