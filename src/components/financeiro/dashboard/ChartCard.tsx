import { ReactNode, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Table as TableIcon } from "lucide-react";

type Props = {
  title: string;
  children: ReactNode;
  /** Optional table view rendered when user toggles. */
  table?: ReactNode;
  accent?: string;
  /** Right-side controls (e.g., toggles, selectors). */
  actions?: ReactNode;
};

/** Wrapper card for charts: accent border, optional view-as-table toggle, responsive padding. */
export function ChartCard({ title, children, table, accent, actions }: Props) {
  const [view, setView] = useState<"chart" | "table">("chart");
  return (
    <Card
      className="overflow-hidden"
      style={accent ? { borderTopWidth: 3, borderTopColor: accent } : undefined}
    >
      <CardHeader className="pb-2 flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-sm flex items-center gap-1.5">
          {accent && <span className="inline-block h-2 w-2 rounded-full" style={{ background: accent }} />}
          {title}
        </CardTitle>
        <div className="flex items-center gap-1">
          {actions}
          {table && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => setView((v) => (v === "chart" ? "table" : "chart"))}
              title={view === "chart" ? "Ver tabela" : "Ver gráfico"}
            >
              {view === "chart" ? <TableIcon className="h-3.5 w-3.5" /> : <BarChart3 className="h-3.5 w-3.5" />}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-2 sm:p-3">{view === "chart" ? children : table}</CardContent>
    </Card>
  );
}
