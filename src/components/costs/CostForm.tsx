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
import { Cost, CostInsert } from "@/hooks/useCosts";
import { Area } from "@/hooks/useAreas";
import { Cycle } from "@/hooks/useCycles";
import { Loader2 } from "lucide-react";

const costSchema = z.object({
  area_id: z.string().min(1, "Área é obrigatória"),
  cycle_id: z.string().optional().nullable(),
  data: z.string().min(1, "Data é obrigatória"),
  tipo: z.enum(["preparo_solo", "mudas", "adubacao", "herbicida", "mao_obra", "combustivel", "trator", "juros_bancarios", "tarifas_bancarias", "outros"]),
  valor: z.coerce.number().positive("Valor deve ser maior que 0"),
  forma_pagamento: z.enum(["dinheiro", "emprestimo"]),
  descricao: z.string().max(200).optional().nullable(),
  observacoes: z.string().max(500).optional().nullable(),
});

type CostFormData = z.infer<typeof costSchema>;

const tipoOptions = [
  { value: "preparo_solo", label: "Preparo de Solo" },
  { value: "mudas", label: "Mudas/Sementes" },
  { value: "adubacao", label: "Adubação" },
  { value: "herbicida", label: "Herbicida" },
  { value: "mao_obra", label: "Mão de Obra" },
  { value: "combustivel", label: "Combustível" },
  { value: "trator", label: "Trator" },
  { value: "juros_bancarios", label: "💳 Juros Bancários" },
  { value: "tarifas_bancarias", label: "💳 Tarifas Bancárias" },
  { value: "outros", label: "Outros" },
];

const pagamentoOptions = [
  { value: "dinheiro", label: "Dinheiro" },
  { value: "emprestimo", label: "Empréstimo" },
];

interface CostFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cost?: Cost | null;
  areas: Area[];
  cycles: Cycle[];
  onSubmit: (data: CostInsert) => void;
  isSubmitting?: boolean;
}

export function CostForm({ open, onOpenChange, cost, areas, cycles, onSubmit, isSubmitting }: CostFormProps) {
  const form = useForm<CostFormData>({
    resolver: zodResolver(costSchema),
    defaultValues: {
      area_id: "",
      cycle_id: "",
      data: new Date().toISOString().split('T')[0],
      tipo: "outros",
      valor: 0,
      forma_pagamento: "dinheiro",
      descricao: "",
      observacoes: "",
    },
  });

  const selectedAreaId = form.watch("area_id");
  const filteredCycles = cycles.filter(c => c.area_id === selectedAreaId);

  useEffect(() => {
    if (cost) {
      form.reset({
        area_id: cost.area_id,
        cycle_id: cost.cycle_id || "",
        data: cost.data,
        tipo: cost.tipo,
        valor: Number(cost.valor),
        forma_pagamento: cost.forma_pagamento,
        descricao: cost.descricao || "",
        observacoes: cost.observacoes || "",
      });
    } else {
      form.reset({
        area_id: "",
        cycle_id: "",
        data: new Date().toISOString().split('T')[0],
        tipo: "outros",
        valor: 0,
        forma_pagamento: "dinheiro",
        descricao: "",
        observacoes: "",
      });
    }
  }, [cost, form]);

  const handleSubmit = (data: CostFormData) => {
    onSubmit({
      area_id: data.area_id,
      cycle_id: data.cycle_id || null,
      data: data.data,
      tipo: data.tipo,
      valor: data.valor,
      forma_pagamento: data.forma_pagamento,
      descricao: data.descricao || null,
      observacoes: data.observacoes || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{cost ? "Editar Custo" : "Novo Custo"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="area_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Área *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
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

              <FormField
                control={form.control}
                name="cycle_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ciclo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Opcional" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredCycles.map((cycle) => (
                          <SelectItem key={cycle.id} value={cycle.id}>
                            {cycle.cultura}
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
                name="data"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tipoOptions.map((option) => (
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
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="forma_pagamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma de Pagamento *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {pagamentoOptions.map((option) => (
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

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Breve descrição" {...field} value={field.value || ""} />
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
                      placeholder="Notas adicionais..." 
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
                {cost ? "Salvar" : "Registrar Custo"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
