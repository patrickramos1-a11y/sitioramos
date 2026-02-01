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
import { Loan, LoanInsert } from "@/hooks/useLoans";
import { Area } from "@/hooks/useAreas";
import { Cycle } from "@/hooks/useCycles";
import { Loader2 } from "lucide-react";

const EMPTY_SELECT_VALUE = "__none__";

const loanSchema = z.object({
  data: z.string().min(1, "Data é obrigatória"),
  origem_credor: z.string().min(1, "Credor é obrigatório").max(100, "Credor muito longo"),
  valor_total: z.coerce.number().positive("Valor deve ser maior que 0"),
  juros_percentual: z.coerce.number().min(0, "Juros não pode ser negativo").optional(),
  numero_parcelas: z.coerce.number().int().positive("Número de parcelas deve ser maior que 0"),
  area_id: z.string().optional().nullable(),
  cycle_id: z.string().optional().nullable(),
  observacoes: z.string().max(500).optional().nullable(),
});

type LoanFormData = z.infer<typeof loanSchema>;

interface LoanFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loan?: Loan | null;
  areas: Area[];
  cycles: Cycle[];
  onSubmit: (data: LoanInsert) => void;
  isSubmitting?: boolean;
}

export function LoanForm({ open, onOpenChange, loan, areas, cycles, onSubmit, isSubmitting }: LoanFormProps) {
  const form = useForm<LoanFormData>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      data: new Date().toISOString().split('T')[0],
      origem_credor: "",
      valor_total: 0,
      juros_percentual: 0,
      numero_parcelas: 1,
      area_id: EMPTY_SELECT_VALUE,
      cycle_id: EMPTY_SELECT_VALUE,
      observacoes: "",
    },
  });

  const selectedAreaId = form.watch("area_id");
  const filteredCycles =
    selectedAreaId && selectedAreaId !== EMPTY_SELECT_VALUE
      ? cycles.filter((c) => c.area_id === selectedAreaId)
      : [];
  
  const valorTotal = form.watch("valor_total");
  const numeroParcelas = form.watch("numero_parcelas");
  const valorParcela = numeroParcelas > 0 ? valorTotal / numeroParcelas : 0;

  useEffect(() => {
    if (loan) {
      form.reset({
        data: loan.data,
        origem_credor: loan.origem_credor,
        valor_total: Number(loan.valor_total),
        juros_percentual: Number(loan.juros_percentual) || 0,
        numero_parcelas: loan.numero_parcelas,
        area_id: loan.area_id || EMPTY_SELECT_VALUE,
        cycle_id: loan.cycle_id || EMPTY_SELECT_VALUE,
        observacoes: loan.observacoes || "",
      });
    } else {
      form.reset({
        data: new Date().toISOString().split('T')[0],
        origem_credor: "",
        valor_total: 0,
        juros_percentual: 0,
        numero_parcelas: 1,
        area_id: EMPTY_SELECT_VALUE,
        cycle_id: EMPTY_SELECT_VALUE,
        observacoes: "",
      });
    }
  }, [loan, form]);

  useEffect(() => {
    // Se voltar para "Geral", limpar ciclo.
    if (selectedAreaId === EMPTY_SELECT_VALUE) {
      form.setValue("cycle_id", EMPTY_SELECT_VALUE, { shouldDirty: true });
    }
  }, [form, selectedAreaId]);

  const handleSubmit = (data: LoanFormData) => {
    onSubmit({
      data: data.data,
      origem_credor: data.origem_credor,
      valor_total: data.valor_total,
      valor_parcela: valorParcela,
      juros_percentual: data.juros_percentual || 0,
      numero_parcelas: data.numero_parcelas,
      area_id: data.area_id && data.area_id !== EMPTY_SELECT_VALUE ? data.area_id : null,
      cycle_id: data.cycle_id && data.cycle_id !== EMPTY_SELECT_VALUE ? data.cycle_id : null,
      observacoes: data.observacoes || null,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{loan ? "Editar Empréstimo" : "Novo Empréstimo"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                name="origem_credor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credor *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Banco, Familiar" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="valor_total"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Total (R$) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="juros_percentual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Juros (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="numero_parcelas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nº Parcelas *</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="rounded-lg bg-muted p-3 text-center">
              <p className="text-sm text-muted-foreground">Valor por Parcela</p>
              <p className="text-xl font-bold text-primary">{formatCurrency(valorParcela)}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="area_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Área (Opcional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || EMPTY_SELECT_VALUE}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Geral" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={EMPTY_SELECT_VALUE}>Geral</SelectItem>
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
                    <FormLabel>Ciclo (Opcional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || EMPTY_SELECT_VALUE}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Nenhum" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={EMPTY_SELECT_VALUE}>Nenhum</SelectItem>
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
                {loan ? "Salvar" : "Registrar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
