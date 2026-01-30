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
  area_id: z.string().min(1, "Área é obrigatória"),
  cycle_id: z.string().optional().nullable(),
  data: z.string().min(1, "Data é obrigatória"),
  produto: z.string().min(1, "Produto é obrigatório").max(100, "Produto muito longo"),
  quantidade: z.coerce.number().positive("Quantidade deve ser maior que 0"),
  unidade: z.enum(["kg", "saca", "unidade", "tonelada"]),
  preco_unitario: z.coerce.number().positive("Preço deve ser maior que 0"),
  cliente: z.string().max(100).optional().nullable(),
  observacoes: z.string().max(500).optional().nullable(),
});

type RevenueFormData = z.infer<typeof revenueSchema>;

const unidadeOptions = [
  { value: "kg", label: "Quilograma (kg)" },
  { value: "saca", label: "Saca" },
  { value: "unidade", label: "Unidade" },
  { value: "tonelada", label: "Tonelada" },
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
      area_id: "",
      cycle_id: "",
      data: new Date().toISOString().split('T')[0],
      produto: "",
      quantidade: 0,
      unidade: "kg",
      preco_unitario: 0,
      cliente: "",
      observacoes: "",
    },
  });

  const selectedAreaId = form.watch("area_id");
  const filteredCycles = cycles.filter(c => c.area_id === selectedAreaId);
  
  const quantidade = form.watch("quantidade");
  const precoUnitario = form.watch("preco_unitario");
  const valorTotal = quantidade * precoUnitario;

  useEffect(() => {
    if (revenue) {
      form.reset({
        area_id: revenue.area_id,
        cycle_id: revenue.cycle_id || "",
        data: revenue.data,
        produto: revenue.produto,
        quantidade: Number(revenue.quantidade),
        unidade: revenue.unidade,
        preco_unitario: Number(revenue.preco_unitario),
        cliente: revenue.cliente || "",
        observacoes: revenue.observacoes || "",
      });
    } else {
      form.reset({
        area_id: "",
        cycle_id: "",
        data: new Date().toISOString().split('T')[0],
        produto: "",
        quantidade: 0,
        unidade: "kg",
        preco_unitario: 0,
        cliente: "",
        observacoes: "",
      });
    }
  }, [revenue, form]);

  const handleSubmit = (data: RevenueFormData) => {
    onSubmit({
      area_id: data.area_id,
      cycle_id: data.cycle_id || null,
      data: data.data,
      produto: data.produto,
      quantidade: data.quantidade,
      unidade: data.unidade,
      preco_unitario: data.preco_unitario,
      cliente: data.cliente || null,
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
          <DialogTitle>{revenue ? "Editar Receita" : "Nova Receita"}</DialogTitle>
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
                name="produto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Produto *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Café, Eucalipto" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="quantidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {unidadeOptions.map((option) => (
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

              <FormField
                control={form.control}
                name="preco_unitario"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço Unit. (R$) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="rounded-lg bg-muted p-3 text-center">
              <p className="text-sm text-muted-foreground">Valor Total</p>
              <p className="text-xl font-bold text-primary">{formatCurrency(valorTotal)}</p>
            </div>

            <FormField
              control={form.control}
              name="cliente"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do comprador" {...field} value={field.value || ""} />
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
                {revenue ? "Salvar" : "Registrar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
