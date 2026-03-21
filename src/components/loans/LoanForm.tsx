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
  frequencia_parcela: z.string().default("mensal"),
  data_primeira_parcela: z.string().optional(),
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
  frequencia_parcela: string;
  data_primeira_parcela: string | null;
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

const frequenciaLabels: Record<string, string> = {
  mensal: "Mensal",
  trimestral: "Trimestral",
  semestral: "Semestral",
  anual: "Anual",
  manual: "Manual",
};

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
      frequencia_parcela: "mensal",
      data_primeira_parcela: "",
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

  const valorPrincipal = form.watch("valor_principal") || 0;
  const numeroParcelas = form.watch("numero_parcelas") || 1;
  const valorParcela = form.watch("valor_parcela") || 0;
  const valorRecebido = form.watch("valor_recebido") || 0;

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
        frequencia_parcela: (loan as any).frequencia_parcela || "mensal",
        data_primeira_parcela: (loan as any).data_primeira_parcela || "",
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
        frequencia_parcela: "mensal",
        data_primeira_parcela: "",
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
      frequencia_parcela: data.frequencia_parcela,
      data_primeira_parcela: data.data_primeira_parcela || null,
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
                    <FormLabel>Data do Contrato *</FormLabel>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Parcelas, Valor e Frequência */}
            <div className="grid grid-cols-3 gap-4">
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
              <FormField
                control={form.control}
                name="valor_parcela"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Parcela (R$) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" placeholder="0,00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="frequencia_parcela"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequência</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(frequenciaLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Data primeira parcela + Valor recebido */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data_primeira_parcela"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data 1ª Parcela</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ""} />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">Se vazio, usa data do contrato + 1 período</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="valor_recebido"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Recebido (R$) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" placeholder="0,00" {...field} />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">Líquido na conta</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Resumo Financeiro */}
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
                    <Select onValueChange={field.onChange} value={field.value || EMPTY_SELECT_VALUE}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Geral" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={EMPTY_SELECT_VALUE}>Geral</SelectItem>
                        {areas.map((area) => (
                          <SelectItem key={area.id} value={area.id}>{area.nome}</SelectItem>
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
                    <Select onValueChange={field.onChange} value={field.value || EMPTY_SELECT_VALUE}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Nenhum" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={EMPTY_SELECT_VALUE}>Nenhum</SelectItem>
                        {filteredCycles.map((cycle) => (
                          <SelectItem key={cycle.id} value={cycle.id}>{cycle.cultura}</SelectItem>
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
                    <Textarea placeholder="Notas adicionais..." {...field} value={field.value || ""} />
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
