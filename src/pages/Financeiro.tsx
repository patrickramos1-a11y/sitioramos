import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardTab } from "@/components/financeiro/DashboardTab";
import { LancamentosTab } from "@/components/financeiro/LancamentosTab";
import { ConfiguracoesTab } from "@/components/financeiro/ConfiguracoesTab";
import { LayoutDashboard, ListChecks, Settings } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Financeiro() {
  const isMobile = useIsMobile();

  return (
    <AppLayout>
      <div className="space-y-3 md:space-y-4">
        <div className="px-1">
          <h1 className="font-display text-lg md:text-xl font-semibold">Financeiro</h1>
          {!isMobile && (
            <p className="text-xs text-muted-foreground">
              Dashboard analítico, lançamentos e configurações da estrutura financeira.
            </p>
          )}
        </div>
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid grid-cols-3 w-full h-auto p-1 bg-muted/50">
            <TabsTrigger value="dashboard" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 py-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="text-xs md:text-sm">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="lancamentos" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 py-2">
              <ListChecks className="h-4 w-4" />
              <span className="text-xs md:text-sm">Lançamentos</span>
            </TabsTrigger>
            <TabsTrigger value="configuracoes" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 py-2">
              <Settings className="h-4 w-4" />
              <span className="text-xs md:text-sm">Configurações</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard" className="mt-3 md:mt-4">
            <DashboardTab />
          </TabsContent>
          <TabsContent value="lancamentos" className="mt-3 md:mt-4">
            <LancamentosTab />
          </TabsContent>
          <TabsContent value="configuracoes" className="mt-3 md:mt-4">
            <ConfiguracoesTab />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
