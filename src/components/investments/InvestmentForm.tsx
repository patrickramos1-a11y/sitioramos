import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Investment, InvestmentInsert } from "@/hooks/useInvestments";
import { Area } from "@/hooks/useAreas";
import { Loader2 } from "lucide-react";

const investmentSchema = z.object({
  data: z.string().min(1, "Data é obrigatória"),
  tipo: z.enum(["legalizacao", "escritura", "contratos", "projetos", "infraestrutura", "outros"]),
  descricao: z.string().min(1, "Descrição é obrigatória").max(200, "Descrição muito longa"),
  valor: z.coerce.number().positive("Valor deve ser maior que 0"),
  area_id: z.string().optional().nullable(),
  rateado: z.boolean(),
  observacoes: z.string().max(500).optional().nullable(),
});

type InvestmentFormData = z.infer<typeof investmentSchema>;

const tipoOptions = [
  { value: "legalizacao", label: "Legalização" },
  { value: "escritura", label: "Escritura" },
  { value: "contratos", label: "Contratos" },
  { value: "projetos", label: "Projetos" },
  { value: "infraestrutura", label: "Infraestrutura" },
  { value: "outros", label: "Outros" },
];

interface InvestmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investment?: Investment | null;
  areas: Area[];
  onSubmit: (data: InvestmentInsert) => void;
  isSubmitting?: boolean;
}

export function InvestmentForm({ open, onOpenChange, investment, areas, onSubmit, isSubmitting }: InvestmentFormProps) {
  const form = useForm<InvestmentFormData>({
    resolver: zodResolver(investmentSchema),
    defaultValues: {
      data: new Date().toISOString().split('T')[0],
      tipo: "outros",
      descricao: "",
      valor: 0,
      area_id: "",
      rateado: false,
      observacoes: "",
    },
  });

  useEffect(() => {
    if (investment) {
      form.reset({
        data: investment.data,
        tipo: investment.tipo,
        descricao: investment.descricao,
        valor: Number(investment.valor),
        area_id: investment.area_id || "",
        rateado: investment.rateado,
        observacoes: investment.observacoes || "",
      });
    } else {
      form.reset({
        data: new Date().toISOString().split('T')[0],
        tipo: "outros",
        descricao: "",
        valor: 0,
        area_id: "",
        rateado: false,
        observacoes: "",
      });
    }
  }, [investment, form]);

  const handleSubmit = (data: InvestmentFormData) => {
    onSubmit({
      data: data.data,
      tipo: data.tipo,
      descricao: data.descricao,
      valor: data.valor,
      area_id: data.area_id || null,
      rateado: data.rateado,
      observacoes: data.observacoes || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{investment ? "Editar Investimento" : "Novo Investimento"}</DialogTitle>
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

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Regularização do imóvel" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                name="area_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Área (Opcional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Geral" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Geral (todas)</SelectItem>
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
            </div>

            <FormField
              control={form.control}
              name="rateado"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Ratear entre áreas</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Distribuir o valor proporcionalmente entre as áreas
                    </p>
                  </div>
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
                {investment ? "Salvar" : "Registrar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
