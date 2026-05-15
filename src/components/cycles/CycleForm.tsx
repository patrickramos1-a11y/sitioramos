import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Cycle, CycleInsert } from "@/hooks/useCycles";
import { Area } from "@/hooks/useAreas";
import { Loader2 } from "lucide-react";
import { CycleAllocationsManager, AllocationDraft } from "./CycleAllocationsManager";
import { CultureIconPicker } from "./CultureIconPicker";
import { suggestIconForCultura } from "@/lib/cycles/cultureGallery";
import { useCycleAreaAllocations } from "@/hooks/useCycleAreaAllocations";
import { allocOccupiedHa, AllocationType } from "@/lib/territory/tarefas";
import { useToast } from "@/hooks/use-toast";

const cycleSchema = z.object({
  area_id: z.string().min(1, "Área principal é obrigatória"),
  cultura: z.string().min(1, "Cultura é obrigatória").max(100, "Cultura muito longa"),
  data_inicio_plantio: z.string().min(1, "Data de início é obrigatória"),
  data_prevista_colheita: z.string().optional().nullable(),
  data_real_colheita: z.string().optional().nullable(),
  status: z.enum(["planejamento", "ativo", "finalizado"]),
  observacoes: z.string().max(500).optional().nullable(),
  icone: z.string().nullable().optional(),
  cor: z.string().nullable().optional(),
});

type CycleFormData = z.infer<typeof cycleSchema>;

const statusOptions = [
  { value: "planejamento", label: "Planejamento" },
  { value: "ativo", label: "Ativo" },
  { value: "finalizado", label: "Finalizado" },
];

interface CycleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cycle?: Cycle | null;
  areas: Area[];
  onSubmit: (data: CycleInsert, allocations: AllocationDraft[]) => void;
  isSubmitting?: boolean;
}

export function CycleForm({ open, onOpenChange, cycle, areas, onSubmit, isSubmitting }: CycleFormProps) {
  const { toast } = useToast();
  const { allocations: existing } = useCycleAreaAllocations(
    cycle?.id ? { cycleId: cycle.id } : {},
  );
  const [drafts, setDrafts] = useState<AllocationDraft[]>([]);

  const form = useForm<CycleFormData>({
    resolver: zodResolver(cycleSchema),
    defaultValues: {
      area_id: "",
      cultura: "",
      data_inicio_plantio: "",
      data_prevista_colheita: "",
      data_real_colheita: "",
      status: "planejamento",
      observacoes: "",
      icone: null,
      cor: "#22c55e",
    },
  });

  useEffect(() => {
    if (!open) return;
    if (cycle) {
      form.reset({
        area_id: cycle.area_id,
        cultura: cycle.cultura,
        data_inicio_plantio: cycle.data_inicio_plantio,
        data_prevista_colheita: cycle.data_prevista_colheita || "",
        data_real_colheita: cycle.data_real_colheita || "",
        status: cycle.status,
        observacoes: cycle.observacoes || "",
        icone: (cycle as any).icone ?? null,
        cor: (cycle as any).cor ?? "#22c55e",
      });
    } else {
      form.reset({
        area_id: "",
        cultura: "",
        data_inicio_plantio: "",
        data_prevista_colheita: "",
        data_real_colheita: "",
        status: "planejamento",
        observacoes: "",
        icone: null,
        cor: "#22c55e",
      });
      setDrafts([]);
    }
  }, [cycle, form, open]);

  // Hidrata vínculos existentes ao abrir edição
  useEffect(() => {
    if (!open || !cycle) return;
    const mapped: AllocationDraft[] = existing.map((a: any) => ({
      id: a.id,
      area_id: a.area_id,
      allocation_type: (a.allocation_type as AllocationType) ||
        (a.ocupa_area_inteira ? "full_area" : "tasks"),
      tarefas_ocupadas: Number(a.tarefas_ocupadas || 0),
      percentual: a.percentual !== null ? Number(a.percentual) : null,
      hectares_ocupados: Number(a.hectares_ocupados || 0),
      observacao: a.observacao || null,
    }));
    setDrafts(mapped);
  }, [existing, cycle, open]);

  // Quando a área principal é selecionada e não há vínculos ainda, pré-criar vínculo "área inteira"
  const watchAreaId = form.watch("area_id");
  useEffect(() => {
    if (!cycle && watchAreaId && drafts.length === 0) {
      setDrafts([
        {
          area_id: watchAreaId,
          allocation_type: "full_area",
          tarefas_ocupadas: 0,
          percentual: null,
          hectares_ocupados: 0,
          observacao: null,
        },
      ]);
    }
  }, [watchAreaId, cycle, drafts.length]);

  const handleSubmit = (data: CycleFormData) => {
    // Validações
    for (const a of drafts) {
      if (!a.area_id) {
        toast({ title: "Vínculo incompleto", description: "Selecione a área de cada vínculo.", variant: "destructive" });
        return;
      }
      const area: any = areas.find((x) => x.id === a.area_id);
      const areaHa = Number(area?.tamanho_hectares || 0);
      const occHa = allocOccupiedHa(a, areaHa);
      if (occHa <= 0) {
        toast({ title: "Vínculo inválido", description: `Informe a ocupação para a área ${area?.nome}.`, variant: "destructive" });
        return;
      }
      if (occHa > areaHa + 0.001) {
        toast({ title: "Ocupação excede a área", description: `${area?.nome}: ${occHa.toFixed(2)} ha > ${areaHa.toFixed(2)} ha.`, variant: "destructive" });
        return;
      }
    }

    onSubmit(
      {
        area_id: data.area_id,
        cultura: data.cultura,
        data_inicio_plantio: data.data_inicio_plantio,
        data_prevista_colheita: data.data_prevista_colheita || null,
        data_real_colheita: data.data_real_colheita || null,
        status: data.status,
        observacoes: data.observacoes || null,
        icone: data.icone ?? null,
        cor: data.cor ?? "#22c55e",
      } as any,
      drafts,
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{cycle ? "Editar Ciclo" : "Novo Ciclo"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="area_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Área principal *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a área principal" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {areas.map((area) => (
                        <SelectItem key={area.id} value={area.id}>
                          {area.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cultura"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cultura *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Abóbora, Macaxeira" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data_inicio_plantio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Início Plantio *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="data_prevista_colheita"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Previsão Colheita</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="data_real_colheita"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data Real Colheita</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <CycleAllocationsManager areas={areas} value={drafts} onChange={setDrafts} />

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notas sobre o ciclo..."
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {cycle ? "Salvar" : "Criar Ciclo"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
