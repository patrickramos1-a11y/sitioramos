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
import { Revenue, RevenueInsert } from "@/hooks/useRevenues";
import { Area } from "@/hooks/useAreas";
import { Cycle } from "@/hooks/useCycles";
import { Loader2 } from "lucide-react";

const revenueSchema = z.object({
  tipo_receita: z.enum(["venda", "aporte_socio", "emprestimo_bancario", "outra"]),
  data: z.string().min(1, "Data é obrigatória"),
  area_id: z.string().optional().nullable(),
  cycle_id: z.string().optional().nullable(),
  produto: z.string().max(100).optional().nullable(),
  quantidade: z.coerce.number().optional().nullable(),
  unidade: z.enum(["kg", "saca", "unidade", "tonelada"]).optional().nullable(),
  preco_unitario: z.coerce.number().optional().nullable(),
  valor: z.coerce.number().optional().nullable(),
  cliente: z.string().max(100).optional().nullable(),
  observacoes: z.string().max(500).optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.tipo_receita === "venda") {
    if (!data.area_id) ctx.addIssue({ code: "custom", path: ["area_id"], message: "Área é obrigatória" });
    if (!data.produto) ctx.addIssue({ code: "custom", path: ["produto"], message: "Produto é obrigatório" });
    if (!data.quantidade || data.quantidade <= 0) ctx.addIssue({ code: "custom", path: ["quantidade"], message: "Quantidade deve ser maior que 0" });
    if (!data.preco_unitario || data.preco_unitario <= 0) ctx.addIssue({ code: "custom", path: ["preco_unitario"], message: "Preço deve ser maior que 0" });
  } else {
    if (!data.valor || data.valor <= 0) ctx.addIssue({ code: "custom", path: ["valor"], message: "Valor deve ser maior que 0" });
  }
});

type RevenueFormData = z.infer<typeof revenueSchema>;

const unidadeOptions = [
  { value: "kg", label: "Quilograma (kg)" },
  { value: "saca", label: "Saca" },
  { value: "unidade", label: "Unidade" },
  { value: "tonelada", label: "Tonelada" },
];

const tipoOptions = [
  { value: "venda", label: "🌱 Venda de produção", desc: "Receita gerada pela comercialização da produção" },
  { value: "aporte_socio", label: "👤 Aporte de sócio", desc: "Dinheiro colocado pelos próprios sócios no caixa" },
  { value: "emprestimo_bancario", label: "🏦 Entrada bancária / Empréstimo", desc: "Crédito ou transferência recebida do banco" },
  { value: "outra", label: "💰 Outra receita", desc: "Outra entrada não classificada acima" },
];

interface RevenueFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  revenue?: Revenue | null;
  areas: Area[];
  cycles: Cycle[];
  onSubmit: (data: RevenueInsert) => void;
  isSubmitting?: boolean;
}

export function RevenueForm({ open, onOpenChange, revenue, areas, cycles, onSubmit, isSubmitting }: RevenueFormProps) {
  const form = useForm<RevenueFormData>({
    resolver: zodResolver(revenueSchema),
    defaultValues: {
      tipo_receita: "venda",
      area_id: "",
      cycle_id: "",
      data: new Date().toISOString().split('T')[0],
      produto: "",
      quantidade: undefined,
      unidade: "kg",
      preco_unitario: undefined,
      valor: undefined,
      cliente: "",
      observacoes: "",
    },
  });

  const tipoReceita = form.watch("tipo_receita");
  const isVenda = tipoReceita === "venda";

  const selectedAreaId = form.watch("area_id");
  const filteredCycles = cycles.filter(c => c.area_id === selectedAreaId);

  const quantidade = form.watch("quantidade") || 0;
  const precoUnitario = form.watch("preco_unitario") || 0;
  const valorDireto = form.watch("valor") || 0;
  const valorTotal = isVenda ? Number(quantidade) * Number(precoUnitario) : Number(valorDireto);

  useEffect(() => {
    if (revenue) {
      const tipo = ((revenue as any).tipo_receita || "venda") as RevenueFormData["tipo_receita"];
      form.reset({
        tipo_receita: tipo,
        area_id: revenue.area_id || "",
        cycle_id: revenue.cycle_id || "",
        data: revenue.data,
        produto: revenue.produto || "",
        quantidade: revenue.quantidade ? Number(revenue.quantidade) : undefined,
        unidade: (revenue.unidade as any) || "kg",
        preco_unitario: revenue.preco_unitario ? Number(revenue.preco_unitario) : undefined,
        valor: tipo !== "venda" && revenue.valor_total ? Number(revenue.valor_total) : undefined,
        cliente: revenue.cliente || "",
        observacoes: revenue.observacoes || "",
      });
    } else {
      form.reset({
        tipo_receita: "venda",
        area_id: "",
        cycle_id: "",
        data: new Date().toISOString().split('T')[0],
        produto: "",
        quantidade: undefined,
        unidade: "kg",
        preco_unitario: undefined,
        valor: undefined,
        cliente: "",
        observacoes: "",
      });
    }
  }, [revenue, form]);

  const handleSubmit = (data: RevenueFormData) => {
    if (data.tipo_receita === "venda") {
      onSubmit({
        tipo_receita: "venda",
        area_id: data.area_id!,
        cycle_id: data.cycle_id || null,
        data: data.data,
        produto: data.produto!,
        quantidade: Number(data.quantidade),
        unidade: data.unidade as any,
        preco_unitario: Number(data.preco_unitario),
        cliente: data.cliente || null,
        observacoes: data.observacoes || null,
      } as any);
    } else {
      onSubmit({
        tipo_receita: data.tipo_receita,
        area_id: null,
        cycle_id: null,
        data: data.data,
        produto: null as any,
        quantidade: null as any,
        unidade: null as any,
        preco_unitario: null as any,
        valor_total: Number(data.valor),
        cliente: data.cliente || null,
        observacoes: data.observacoes || null,
      } as any);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const tipoSelected = tipoOptions.find(t => t.value === tipoReceita);
  const clienteLabel = isVenda ? "Cliente" : tipoReceita === "aporte_socio" ? "Sócio" : tipoReceita === "emprestimo_bancario" ? "Banco / Origem" : "Origem";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{revenue ? "Editar Receita" : "Nova Receita"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="tipo_receita"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de receita *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tipoOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {tipoSelected && (
                    <p className="text-xs text-muted-foreground mt-1">{tipoSelected.desc}</p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

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

            {isVenda ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="area_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Área *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
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
                        <FormLabel>Ciclo</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Opcional" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
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
                  name="produto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Produto *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Café, Eucalipto" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="quantidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade *</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" min="0" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unidade *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "kg"}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {unidadeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="preco_unitario"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço Unit. (R$) *</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" min="0" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            ) : (
              <FormField
                control={form.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" placeholder="0,00" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="rounded-lg bg-muted p-3 text-center">
              <p className="text-sm text-muted-foreground">Valor Total</p>
              <p className="text-xl font-bold text-primary">{formatCurrency(valorTotal)}</p>
            </div>

            <FormField
              control={form.control}
              name="cliente"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{clienteLabel}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={isVenda ? "Nome do comprador" : tipoReceita === "aporte_socio" ? "Nome do sócio" : tipoReceita === "emprestimo_bancario" ? "Ex: Banco do Brasil" : "Origem da receita"}
                      {...field}
                      value={field.value || ""}
                    />
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
                {revenue ? "Salvar" : "Registrar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
