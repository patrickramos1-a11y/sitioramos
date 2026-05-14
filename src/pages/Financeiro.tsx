import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardTab } from "@/components/financeiro/DashboardTab";
import { LancamentosTab } from "@/components/financeiro/LancamentosTab";
import { ReclassificacaoTab } from "@/components/financeiro/ReclassificacaoTab";
import { CategoriasTab } from "@/components/financeiro/CategoriasTab";
import { CentrosCustoTab } from "@/components/financeiro/CentrosCustoTab";
import { NaturezasTab } from "@/components/financeiro/NaturezasTab";
import { AreasTalhoesCiclosTab } from "@/components/financeiro/AreasTalhoesCiclosTab";
import { InvestimentosTab } from "@/components/financeiro/InvestimentosTab";
import { RelatoriosTab } from "@/components/financeiro/RelatoriosTab";

export default function Financeiro() {
  return (
    <AppLayout>
      <div className="space-y-4">
        <div>
          <h1 className="font-display text-xl font-semibold">Financeiro</h1>
          <p className="text-xs text-muted-foreground">
            Estrutura financeira modular — naturezas, centros de custo, categorias
            e classificação dos lançamentos. A página{" "}
            <strong>Fluxo de Caixa</strong> permanece intacta.
          </p>
        </div>
        <Tabs defaultValue="dashboard">
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="lancamentos">Lançamentos</TabsTrigger>
            <TabsTrigger value="reclassificacao">Reclassificação</TabsTrigger>
            <TabsTrigger value="categorias">Categorias</TabsTrigger>
            <TabsTrigger value="centros">Centros de Custo</TabsTrigger>
            <TabsTrigger value="naturezas">Naturezas</TabsTrigger>
            <TabsTrigger value="areas">Áreas / Talhões / Ciclos</TabsTrigger>
            <TabsTrigger value="investimentos">Investimentos</TabsTrigger>
            <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard" className="mt-4">
            <DashboardTab />
          </TabsContent>
          <TabsContent value="lancamentos" className="mt-4">
            <LancamentosTab />
          </TabsContent>
          <TabsContent value="reclassificacao" className="mt-4">
            <ReclassificacaoTab />
          </TabsContent>
          <TabsContent value="categorias" className="mt-4">
            <CategoriasTab />
          </TabsContent>
          <TabsContent value="centros" className="mt-4">
            <CentrosCustoTab />
          </TabsContent>
          <TabsContent value="naturezas" className="mt-4">
            <NaturezasTab />
          </TabsContent>
          <TabsContent value="areas" className="mt-4">
            <AreasTalhoesCiclosTab />
          </TabsContent>
          <TabsContent value="investimentos" className="mt-4">
            <InvestimentosTab />
          </TabsContent>
          <TabsContent value="relatorios" className="mt-4">
            <RelatoriosTab />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
