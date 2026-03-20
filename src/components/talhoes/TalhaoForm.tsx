import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Loader2, TreePine } from "lucide-react";
import { Talhao, TalhaoInsert } from "@/hooks/useTalhoes";
import { calculateAppFromRiver } from "@/lib/categoryConfig";

const talhaoSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  area_total_hectares: z.coerce.number().positive("Área total deve ser maior que 0"),
  metros_rio: z.coerce.number().min(0, "Metros de rio não podem ser negativos"),
  status: z.string().min(1, "Status é obrigatório"),
  observacoes: z.string().optional().nullable(),
});

type TalhaoFormData = z.infer<typeof talhaoSchema>;

const statusOptions = [
  { value: "ativo", label: "Ativo" },
  { value: "expansao", label: "Em expansão" },
  { value: "futuro", label: "Futuro" },
  { value: "inativo", label: "Inativo" },
];

interface TalhaoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  talhao?: Talhao | null;
  propriedadeId: string;
  onSubmit: (data: TalhaoInsert) => void;
  isSubmitting?: boolean;
}

export function TalhaoForm({ open, onOpenChange, talhao, propriedadeId, onSubmit, isSubmitting }: TalhaoFormProps) {
  const form = useForm<TalhaoFormData>({
    resolver: zodResolver(talhaoSchema),
    defaultValues: {
      nome: "",
      area_total_hectares: 0,
      metros_rio: 0,
      status: "ativo",
      observacoes: "",
    },
  });

  const metrosRio = form.watch("metros_rio");
  const appCalculada = calculateAppFromRiver(metrosRio || 0);

  useEffect(() => {
    if (talhao) {
      form.reset({
        nome: talhao.nome,
        area_total_hectares: Number(talhao.area_total_hectares),
        metros_rio: Number(talhao.metros_rio),
        status: talhao.status,
        observacoes: talhao.observacoes || "",
      });
    } else {
      form.reset({
        nome: "",
        area_total_hectares: 0,
        metros_rio: 0,
        status: "ativo",
        observacoes: "",
      });
    }
  }, [talhao, form]);

  const handleSubmit = (data: TalhaoFormData) => {
    const appHectares = calculateAppFromRiver(data.metros_rio);
    onSubmit({
      propriedade_id: propriedadeId,
      nome: data.nome,
      area_total_hectares: data.area_total_hectares,
      area_app_hectares: appHectares,
      metros_rio: data.metros_rio,
      status: data.status,
      observacoes: data.observacoes || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{talhao ? "Editar Talhão" : "Novo Talhão"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Talhão *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Talhão 1" {...field} />
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
                name="area_total_hectares"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Área Total (ha) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="metros_rio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Metros de Rio</FormLabel>
                    <FormControl>
                      <Input type="number" step="1" min="0" {...field} />
                    </FormControl>
                    <FormDescription>Extensão de rio no talhão</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* APP auto-calculated display */}
            {metrosRio > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <TreePine className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">APP calculada automaticamente</p>
                  <p className="text-lg font-bold text-primary">{appCalculada.toFixed(2)} ha</p>
                  <p className="text-xs text-muted-foreground">Faixa de 80m × {metrosRio}m de rio</p>
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Notas sobre o talhão..." {...field} value={field.value || ""} />
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
                {talhao ? "Salvar" : "Criar Talhão"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
