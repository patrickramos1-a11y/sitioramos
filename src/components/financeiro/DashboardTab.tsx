import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FinanceiroFilters } from "./FinanceiroFilters";
import { defaultFilters, type FinFilters } from "@/hooks/financeiro/useFinanceiroAnalytics";
import { VisaoGeralSubTab } from "./dashboard/VisaoGeralSubTab";
import { PorAreaSubTab } from "./dashboard/PorAreaSubTab";
import { PorCicloSubTab } from "./dashboard/PorCicloSubTab";
import { PorCategoriaSubTab } from "./dashboard/PorCategoriaSubTab";
import { InvestimentosSubTab } from "./dashboard/InvestimentosSubTab";
import { EmprestimosSubTab } from "./dashboard/EmprestimosSubTab";

export function DashboardTab() {
  const [filters, setFilters] = useState<FinFilters>(defaultFilters);

  return (
    <div className="space-y-4">
      <FinanceiroFilters value={filters} onChange={setFilters} />

      <Tabs defaultValue="overview">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="por-area">Por Área</TabsTrigger>
          <TabsTrigger value="por-ciclo">Por Ciclo</TabsTrigger>
          <TabsTrigger value="por-categoria">Por Categoria</TabsTrigger>
          <TabsTrigger value="investimentos">Investimentos</TabsTrigger>
          <TabsTrigger value="emprestimos">Empréstimos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <VisaoGeralSubTab filters={filters} />
        </TabsContent>
        <TabsContent value="por-area" className="mt-4">
          <PorAreaSubTab filters={filters} />
        </TabsContent>
        <TabsContent value="por-ciclo" className="mt-4">
          <PorCicloSubTab filters={filters} />
        </TabsContent>
        <TabsContent value="por-categoria" className="mt-4">
          <PorCategoriaSubTab filters={filters} />
        </TabsContent>
        <TabsContent value="investimentos" className="mt-4">
          <InvestimentosSubTab filters={filters} />
        </TabsContent>
        <TabsContent value="emprestimos" className="mt-4">
          <EmprestimosSubTab filters={filters} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
