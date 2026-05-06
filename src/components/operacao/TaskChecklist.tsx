import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ListChecks } from "lucide-react";
import { useTaskChecklist } from "@/hooks/useTaskChecklist";
import { Progress } from "@/components/ui/progress";

interface Props {
  taskId: string | null;
}

export function TaskChecklist({ taskId }: Props) {
  const { items, addItem, toggleItem, removeItem, total, done, percent } = useTaskChecklist(taskId);
  const [novo, setNovo] = useState("");

  if (!taskId) {
    return (
      <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground flex items-center gap-2">
        <ListChecks className="h-4 w-4" />
        Salve a tarefa para começar a usar o checklist.
      </div>
    );
  }

  const handleAdd = () => {
    const t = novo.trim();
    if (!t) return;
    addItem.mutate(t, { onSuccess: () => setNovo("") });
  };

  return (
    <div className="rounded-md border p-3 space-y-3 bg-muted/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <ListChecks className="h-4 w-4 text-primary" />
          Checklist
          {total > 0 && (
            <span className="text-xs text-muted-foreground font-normal">
              {done}/{total} ({percent}%)
            </span>
          )}
        </div>
      </div>

      {total > 0 && <Progress value={percent} className="h-1.5" />}

      <div className="space-y-1.5">
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-2 group">
            <Checkbox
              checked={item.concluido}
              onCheckedChange={(v) => toggleItem.mutate({ id: item.id, concluido: !!v })}
            />
            <span className={`flex-1 text-sm ${item.concluido ? "line-through text-muted-foreground" : ""}`}>
              {item.texto}
            </span>
            <Button
              type="button" variant="ghost" size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100"
              onClick={() => removeItem.mutate(item.id)}
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex gap-1.5">
        <Input
          value={novo}
          onChange={e => setNovo(e.target.value)}
          placeholder="Adicionar item..."
          className="h-8 text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); handleAdd(); }
          }}
        />
        <Button type="button" size="sm" onClick={handleAdd} disabled={!novo.trim()}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
