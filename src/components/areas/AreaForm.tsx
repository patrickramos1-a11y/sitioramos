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
import { Area, AreaInsert } from "@/hooks/useAreas";
import { Loader2 } from "lucide-react";

const areaSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  tamanho_hectares: z.coerce.number().positive("Tamanho deve ser maior que 0"),
  status: z.enum(["planejamento", "preparo", "plantada", "producao", "colhida"]),
  cultura_principal: z.string().max(100).optional().nullable(),
  data_inicio: z.string().optional().nullable(),
  observacoes: z.string().max(500).optional().nullable(),
});

type AreaFormData = z.infer<typeof areaSchema>;

const statusOptions = [
  { value: "planejamento", label: "Planejamento" },
  { value: "preparo", label: "Em preparo" },
  { value: "plantada", label: "Plantada" },
  { value: "producao", label: "Em produção" },
  { value: "colhida", label: "Colhida" },
];

interface AreaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  area?: Area | null;
  onSubmit: (data: AreaInsert) => void;
  isSubmitting?: boolean;
}

export function AreaForm({ open, onOpenChange, area, onSubmit, isSubmitting }: AreaFormProps) {
  const form = useForm<AreaFormData>({
    resolver: zodResolver(areaSchema),
    defaultValues: {
      nome: "",
      tamanho_hectares: 0,
      status: "planejamento",
      cultura_principal: "",
      data_inicio: "",
      observacoes: "",
    },
  });

  useEffect(() => {
    if (area) {
      form.reset({
        nome: area.nome,
        tamanho_hectares: Number(area.tamanho_hectares),
        status: area.status,
        cultura_principal: area.cultura_principal || "",
        data_inicio: area.data_inicio || "",
        observacoes: area.observacoes || "",
      });
    } else {
      form.reset({
        nome: "",
        tamanho_hectares: 0,
        status: "planejamento",
        cultura_principal: "",
        data_inicio: "",
        observacoes: "",
      });
    }
  }, [area, form]);

  const handleSubmit = (data: AreaFormData) => {
    onSubmit({
      nome: data.nome,
      tamanho_hectares: data.tamanho_hectares,
      status: data.status,
      cultura_principal: data.cultura_principal || null,
      data_inicio: data.data_inicio || null,
      observacoes: data.observacoes || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{area ? "Editar Área" : "Nova Área"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Área *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Talhão Norte" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tamanho_hectares"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tamanho (ha) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
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
                name="cultura_principal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cultura Principal</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Café, Eucalipto" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data_inicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Início</FormLabel>
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
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Notas sobre a área..." 
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
                {area ? "Salvar" : "Criar Área"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
