import { useEffect } from "react";
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

const cycleSchema = z.object({
  area_id: z.string().min(1, "Área é obrigatória"),
  cultura: z.string().min(1, "Cultura é obrigatória").max(100, "Cultura muito longa"),
  data_inicio_plantio: z.string().min(1, "Data de início é obrigatória"),
  data_prevista_colheita: z.string().optional().nullable(),
  data_real_colheita: z.string().optional().nullable(),
  status: z.enum(["planejamento", "ativo", "finalizado"]),
  observacoes: z.string().max(500).optional().nullable(),
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
  onSubmit: (data: CycleInsert) => void;
  isSubmitting?: boolean;
}

export function CycleForm({ open, onOpenChange, cycle, areas, onSubmit, isSubmitting }: CycleFormProps) {
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
    },
  });

  useEffect(() => {
    if (cycle) {
      form.reset({
        area_id: cycle.area_id,
        cultura: cycle.cultura,
        data_inicio_plantio: cycle.data_inicio_plantio,
        data_prevista_colheita: cycle.data_prevista_colheita || "",
        data_real_colheita: cycle.data_real_colheita || "",
        status: cycle.status,
        observacoes: cycle.observacoes || "",
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
      });
    }
  }, [cycle, form]);

  const handleSubmit = (data: CycleFormData) => {
    onSubmit({
      area_id: data.area_id,
      cultura: data.cultura,
      data_inicio_plantio: data.data_inicio_plantio,
      data_prevista_colheita: data.data_prevista_colheita || null,
      data_real_colheita: data.data_real_colheita || null,
      status: data.status,
      observacoes: data.observacoes || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
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
                  <FormLabel>Área *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma área" />
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
                      <Input placeholder="Ex: Café, Eucalipto" {...field} />
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
                          <SelectValue placeholder="Selecione" />
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

            <div className="flex justify-end gap-3 pt-4">
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
