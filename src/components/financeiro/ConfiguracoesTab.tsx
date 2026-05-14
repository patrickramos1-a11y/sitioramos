import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReclassificacaoTab } from "./ReclassificacaoTab";
import { CategoriasTab } from "./CategoriasTab";
import { CentrosCustoTab } from "./CentrosCustoTab";
import { NaturezasTab } from "./NaturezasTab";
import { AreasTalhoesCiclosTab } from "./AreasTalhoesCiclosTab";
import { InvestimentosTab } from "./InvestimentosTab";
import { RelatoriosTab } from "./RelatoriosTab";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Tags,
  Building2,
  Layers,
  MapPin,
  TrendingUp,
  FileBarChart,
  Wand2,
} from "lucide-react";

const SECTIONS = [
  { value: "reclassificacao", label: "Reclassificação", icon: Wand2, comp: ReclassificacaoTab },
  { value: "categorias", label: "Categorias", icon: Tags, comp: CategoriasTab },
  { value: "centros", label: "Centros de Custo", icon: Building2, comp: CentrosCustoTab },
  { value: "naturezas", label: "Naturezas", icon: Layers, comp: NaturezasTab },
  { value: "areas", label: "Áreas / Talhões / Ciclos", icon: MapPin, comp: AreasTalhoesCiclosTab },
  { value: "investimentos", label: "Investimentos", icon: TrendingUp, comp: InvestimentosTab },
  { value: "relatorios", label: "Relatórios", icon: FileBarChart, comp: RelatoriosTab },
];

export function ConfiguracoesTab() {
  const isMobile = useIsMobile();
  const [section, setSection] = useState("reclassificacao");

  if (isMobile) {
    const Active = SECTIONS.find((s) => s.value === section)?.comp ?? ReclassificacaoTab;
    return (
      <div className="space-y-3">
        <Select value={section} onValueChange={setSection}>
          <SelectTrigger className="w-full h-11 bg-card border-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              return (
                <SelectItem key={s.value} value={s.value}>
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {s.label}
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        <Active />
      </div>
    );
  }

  return (
    <Tabs value={section} onValueChange={setSection}>
      <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <TabsTrigger key={s.value} value={s.value} className="gap-2">
              <Icon className="h-4 w-4" />
              {s.label}
            </TabsTrigger>
          );
        })}
      </TabsList>
      {SECTIONS.map((s) => {
        const Comp = s.comp;
        return (
          <TabsContent key={s.value} value={s.value} className="mt-4">
            <Comp />
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
