import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Layers, ChevronLeft, ChevronRight, MapPin, FolderKanban, Sprout, User } from "lucide-react";
import { getResponsavelColor } from "@/lib/operacaoConfig";

export interface LayerItem {
  id: string;
  label: string;
  count: number;
  color?: string;
}

export interface LayersState {
  hiddenAreas: Set<string>;
  hiddenProjects: Set<string>;
  hiddenCycles: Set<string>;
  hiddenResponsaveis: Set<string>;
}

interface LayersPanelProps {
  areas: LayerItem[];
  projects: LayerItem[];
  cycles: LayerItem[];
  responsaveis: LayerItem[];
  state: LayersState;
  onChange: (next: LayersState) => void;
}

const SECTIONS: Array<{
  key: keyof LayersState;
  label: string;
  icon: typeof MapPin;
  source: keyof Omit<LayersPanelProps, "state" | "onChange">;
}> = [
  { key: "hiddenAreas",        label: "Áreas",         icon: MapPin,        source: "areas" },
  { key: "hiddenProjects",     label: "Projetos",      icon: FolderKanban,  source: "projects" },
  { key: "hiddenCycles",       label: "Ciclos",        icon: Sprout,        source: "cycles" },
  { key: "hiddenResponsaveis", label: "Responsáveis",  icon: User,          source: "responsaveis" },
];

export function LayersPanel(props: LayersPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["hiddenAreas", "hiddenProjects"]));

  const toggleItem = (sectionKey: keyof LayersState, id: string) => {
    const next = new Set(props.state[sectionKey]);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    props.onChange({ ...props.state, [sectionKey]: next });
  };

  const toggleAll = (sectionKey: keyof LayersState, items: LayerItem[], showAll: boolean) => {
    const next = new Set<string>();
    if (!showAll) items.forEach(i => next.add(i.id));
    props.onChange({ ...props.state, [sectionKey]: next });
  };

  const toggleSection = (key: string) => {
    setOpenSections(prev => {
      const n = new Set(prev);
      if (n.has(key)) n.delete(key); else n.add(key);
      return n;
    });
  };

  const totalHidden =
    props.state.hiddenAreas.size +
    props.state.hiddenProjects.size +
    props.state.hiddenCycles.size +
    props.state.hiddenResponsaveis.size;

  if (collapsed) {
    return (
      <div className="shrink-0 border-r bg-muted/20 flex flex-col items-center py-2 w-9">
        <Button
          variant="ghost" size="sm" className="h-7 w-7 p-0"
          onClick={() => setCollapsed(false)}
          title="Mostrar camadas"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Layers className="h-4 w-4 mt-2 text-muted-foreground" />
        {totalHidden > 0 && (
          <Badge variant="secondary" className="mt-2 px-1 text-[9px]">{totalHidden}</Badge>
        )}
      </div>
    );
  }

  return (
    <div className="shrink-0 border-r bg-muted/20 w-56 flex flex-col">
      <div className="flex items-center justify-between px-2 py-2 border-b bg-muted/40">
        <span className="text-xs font-semibold flex items-center gap-1">
          <Layers className="h-3.5 w-3.5" />Camadas
        </span>
        <Button
          variant="ghost" size="sm" className="h-6 w-6 p-0"
          onClick={() => setCollapsed(true)}
          title="Recolher"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto text-xs">
        {SECTIONS.map(sec => {
          const Icon = sec.icon;
          const items = props[sec.source] as LayerItem[];
          if (items.length === 0) return null;
          const hidden = props.state[sec.key];
          const allHidden = items.every(i => hidden.has(i.id));
          const isOpen = openSections.has(sec.key);

          return (
            <div key={sec.key} className="border-b">
              <button
                className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-muted/40"
                onClick={() => toggleSection(sec.key)}
              >
                <span className="flex items-center gap-1.5 font-medium">
                  <Icon className="h-3 w-3" />
                  {sec.label}
                  <Badge variant="outline" className="h-4 px-1 text-[9px]">{items.length}</Badge>
                </span>
                <button
                  className="p-0.5 hover:bg-muted rounded"
                  onClick={(e) => { e.stopPropagation(); toggleAll(sec.key, items, allHidden); }}
                  title={allHidden ? "Mostrar todos" : "Ocultar todos"}
                >
                  {allHidden
                    ? <EyeOff className="h-3 w-3 text-muted-foreground" />
                    : <Eye className="h-3 w-3" />}
                </button>
              </button>

              {isOpen && (
                <div className="pb-1">
                  {items.map(item => {
                    const isHidden = hidden.has(item.id);
                    return (
                      <button
                        key={item.id}
                        className="w-full flex items-center gap-1.5 px-2 py-1 hover:bg-muted/50 text-left"
                        onClick={() => toggleItem(sec.key, item.id)}
                      >
                        <span
                          className="inline-block h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: item.color || "hsl(var(--muted-foreground))" }}
                        />
                        <span className={`flex-1 truncate ${isHidden ? "line-through text-muted-foreground/60" : ""}`}>
                          {item.label}
                        </span>
                        <span className="text-[9px] text-muted-foreground tabular-nums">{item.count}</span>
                        {isHidden
                          ? <EyeOff className="h-3 w-3 text-muted-foreground/60" />
                          : <Eye className="h-3 w-3 text-foreground/70" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function makeLayerColor(seed: string) {
  return getResponsavelColor(seed);
}
