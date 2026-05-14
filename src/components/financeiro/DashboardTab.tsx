import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FinanceiroFilters } from "./FinanceiroFilters";
import { defaultFilters, type FinFilters } from "@/hooks/financeiro/useFinanceiroAnalytics";
import { VisaoGeralSubTab } from "./dashboard/VisaoGeralSubTab";
import { PorAreaSubTab } from "./dashboard/PorAreaSubTab";
import { PorCicloSubTab } from "./dashboard/PorCicloSubTab";
import { PorCategoriaSubTab } from "./dashboard/PorCategoriaSubTab";
import { InvestimentosSubTab } from "./dashboard/InvestimentosSubTab";
import { EmprestimosSubTab } from "./dashboard/EmprestimosSubTab";
import { useIsMobile } from "@/hooks/use-mobile";

const SUB = [
  { value: "overview", label: "Visão Geral" },
  { value: "por-area", label: "Por Área" },
  { value: "por-ciclo", label: "Por Ciclo" },
  { value: "por-categoria", label: "Por Categoria" },
  { value: "investimentos", label: "Investimentos" },
  { value: "emprestimos", label: "Empréstimos" },
];

export function DashboardTab() {
  const [filters, setFilters] = useState<FinFilters>(defaultFilters);
  const [view, setView] = useState("overview");
  const isMobile = useIsMobile();

  return (
    <div className="space-y-3 md:space-y-4">
      <FinanceiroFilters value={filters} onChange={setFilters} />

      <Tabs value={view} onValueChange={setView}>
        {isMobile ? (
          <Select value={view} onValueChange={setView}>
            <SelectTrigger className="w-full h-11 bg-card border-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUB.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <TabsList className="flex flex-wrap h-auto">
            {SUB.map((s) => (
              <TabsTrigger key={s.value} value={s.value}>{s.label}</TabsTrigger>
            ))}
          </TabsList>
        )}

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
