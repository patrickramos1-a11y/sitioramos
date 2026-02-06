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
import { Loan } from "@/hooks/useLoans";
import { Area } from "@/hooks/useAreas";
import { Cycle } from "@/hooks/useCycles";
import { Loader2, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";

const EMPTY_SELECT_VALUE = "__none__";

const loanSchema = z.object({
  data: z.string().min(1, "Data é obrigatória"),
  origem_credor: z.string().min(1, "Credor é obrigatório").max(100, "Credor muito longo"),
  valor_principal: z.coerce.number().positive("Valor deve ser maior que 0"),
  juros_percentual: z.coerce.number().min(0, "Juros não pode ser negativo").optional(),
  numero_parcelas: z.coerce.number().int().positive("Número de parcelas deve ser maior que 0"),
  valor_parcela: z.coerce.number().positive("Valor da parcela deve ser maior que 0"),
  valor_recebido: z.coerce.number().min(0, "Valor recebido não pode ser negativo"),
  area_id: z.string().optional().nullable(),
  cycle_id: z.string().optional().nullable(),
  observacoes: z.string().max(500).optional().nullable(),
});

type LoanFormData = z.infer<typeof loanSchema>;

export interface LoanFormSubmitData {
  data: string;
  origem_credor: string;
  valor_principal: number;
  valor_total: number;
  valor_parcela: number;
  valor_recebido: number;
  descontos_iniciais: number;
  valor_juros_total: number;
  juros_percentual: number;
  numero_parcelas: number;
  area_id: string | null;
  cycle_id: string | null;
  observacoes: string | null;
}

interface LoanFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loan?: Loan | null;
  areas: Area[];
  cycles: Cycle[];
  onSubmit: (data: LoanFormSubmitData) => void;
  isSubmitting?: boolean;
}

export function LoanForm({ open, onOpenChange, loan, areas, cycles, onSubmit, isSubmitting }: LoanFormProps) {
  const form = useForm<LoanFormData>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      data: new Date().toISOString().split('T')[0],
      origem_credor: "",
      valor_principal: 0,
      juros_percentual: 0,
      numero_parcelas: 1,
      valor_parcela: 0,
      valor_recebido: 0,
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

  // Watch values for auto-calculations
  const valorPrincipal = form.watch("valor_principal") || 0;
  const numeroParcelas = form.watch("numero_parcelas") || 1;
  const valorParcela = form.watch("valor_parcela") || 0;
  const valorRecebido = form.watch("valor_recebido") || 0;

  // Auto-calculated values
  const valorTotalAPagar = numeroParcelas * valorParcela;
  const descontosIniciais = Math.max(0, valorPrincipal - valorRecebido);
  const valorJurosTotal = Math.max(0, valorTotalAPagar - valorPrincipal);

  useEffect(() => {
    if (loan) {
      form.reset({
        data: loan.data,
        origem_credor: loan.origem_credor,
        valor_principal: Number(loan.valor_principal) || Number(loan.valor_total),
        juros_percentual: Number(loan.juros_percentual) || 0,
        numero_parcelas: loan.numero_parcelas,
        valor_parcela: Number(loan.valor_parcela),
        valor_recebido: Number(loan.valor_recebido) || Number(loan.valor_principal) || Number(loan.valor_total),
        area_id: loan.area_id || EMPTY_SELECT_VALUE,
        cycle_id: loan.cycle_id || EMPTY_SELECT_VALUE,
        observacoes: loan.observacoes || "",
      });
    } else {
      form.reset({
        data: new Date().toISOString().split('T')[0],
        origem_credor: "",
        valor_principal: 0,
        juros_percentual: 0,
        numero_parcelas: 1,
        valor_parcela: 0,
        valor_recebido: 0,
        area_id: EMPTY_SELECT_VALUE,
        cycle_id: EMPTY_SELECT_VALUE,
        observacoes: "",
      });
    }
  }, [loan, form]);

  useEffect(() => {
    if (selectedAreaId === EMPTY_SELECT_VALUE) {
      form.setValue("cycle_id", EMPTY_SELECT_VALUE, { shouldDirty: true });
    }
  }, [form, selectedAreaId]);

  // Auto-fill valor_recebido when valor_principal changes (if user hasn't modified it)
  useEffect(() => {
    const currentRecebido = form.getValues("valor_recebido");
    if (currentRecebido === 0 && valorPrincipal > 0) {
      form.setValue("valor_recebido", valorPrincipal);
    }
  }, [valorPrincipal, form]);

  const handleSubmit = (data: LoanFormData) => {
    const principal = data.valor_principal;
    const recebido = data.valor_recebido;
    const parcela = data.valor_parcela;
    const parcelas = data.numero_parcelas;
    const totalPagar = parcelas * parcela;
    const descontos = Math.max(0, principal - recebido);
    const jurosTotal = Math.max(0, totalPagar - principal);

    onSubmit({
      data: data.data,
      origem_credor: data.origem_credor,
      valor_principal: principal,
      valor_total: totalPagar,
      valor_parcela: parcela,
      valor_recebido: recebido,
      descontos_iniciais: descontos,
      valor_juros_total: jurosTotal,
      juros_percentual: data.juros_percentual || 0,
      numero_parcelas: parcelas,
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
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{loan ? "Editar Empréstimo" : "Novo Empréstimo"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Data e Credor */}
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

            {/* Valor Contratado e Juros */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="valor_principal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Contratado (R$) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" placeholder="0,00" {...field} />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">Valor total do contrato</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="juros_percentual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Taxa de Juros (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" placeholder="0,00" {...field} />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">Juros do contrato</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Parcelas e Valor da Parcela */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="numero_parcelas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nº de Parcelas *</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="valor_parcela"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor da Parcela (R$) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" placeholder="0,00" {...field} />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">Valor fixo de cada parcela</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Valor Recebido na Conta */}
            <FormField
              control={form.control}
              name="valor_recebido"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Recebido na Conta (R$) *</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" placeholder="0,00" {...field} />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Valor líquido que entrou efetivamente na conta
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Resumo Financeiro Auto-calculado */}
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <p className="text-sm font-semibold text-foreground">Resumo do Empréstimo</p>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-success" />
                  <div>
                    <p className="text-muted-foreground">Entrada no Caixa</p>
                    <p className="font-bold text-success">{formatCurrency(valorRecebido)}</p>
                  </div>
                </div>
                
                {descontosIniciais > 0 && (
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-destructive" />
                    <div>
                      <p className="text-muted-foreground">Descontos/Tarifas</p>
                      <p className="font-bold text-destructive">{formatCurrency(descontosIniciais)}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t pt-3 grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-warning" />
                  <div>
                    <p className="text-muted-foreground">Total a Pagar</p>
                    <p className="font-bold text-warning">{formatCurrency(valorTotalAPagar)}</p>
                    <p className="text-xs text-muted-foreground">{numeroParcelas}x de {formatCurrency(valorParcela)}</p>
                  </div>
                </div>

                {valorJurosTotal > 0 && (
                  <div>
                    <p className="text-muted-foreground">Custo Financeiro</p>
                    <p className="font-bold text-destructive">{formatCurrency(valorJurosTotal)}</p>
                    <p className="text-xs text-muted-foreground">Juros embutidos nas parcelas</p>
                  </div>
                )}
              </div>
            </div>

            {/* Área e Ciclo */}
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
