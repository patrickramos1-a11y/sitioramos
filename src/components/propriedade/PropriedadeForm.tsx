import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { Propriedade, PropriedadeInsert } from "@/hooks/usePropriedade";

const schema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  area_total_hectares: z.coerce.number().positive("Área total deve ser maior que 0"),
  area_app_hectares: z.coerce.number().min(0, "APP não pode ser negativa"),
  metros_rio_total: z.coerce.number().min(0, "Metros de rio não podem ser negativos"),
  observacoes: z.string().optional().nullable(),
});

type FormData = z.infer<typeof schema>;

interface PropriedadeFormProps {
  propriedade?: Propriedade | null;
  onSubmit: (data: PropriedadeInsert & { id?: string }) => void;
  isSubmitting?: boolean;
}

export function PropriedadeForm({ propriedade, onSubmit, isSubmitting }: PropriedadeFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: "",
      area_total_hectares: 0,
      area_app_hectares: 0,
      metros_rio_total: 0,
      observacoes: "",
    },
  });

  useEffect(() => {
    if (propriedade) {
      form.reset({
        nome: propriedade.nome,
        area_total_hectares: Number(propriedade.area_total_hectares),
        area_app_hectares: Number(propriedade.area_app_hectares),
        metros_rio_total: Number(propriedade.metros_rio_total),
        observacoes: propriedade.observacoes || "",
      });
    }
  }, [propriedade, form]);

  const handleSubmit = (data: FormData) => {
    onSubmit({
      ...(propriedade?.id ? { id: propriedade.id } : {}),
      nome: data.nome,
      area_total_hectares: data.area_total_hectares,
      area_app_hectares: data.area_app_hectares,
      metros_rio_total: data.metros_rio_total,
      observacoes: data.observacoes || null,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Propriedade *</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Sítio Ramos" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="area_total_hectares"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Área Total (ha) *</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min="0" {...field} />
                </FormControl>
                <FormDescription>Área total da propriedade</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="area_app_hectares"
            render={({ field }) => (
              <FormItem>
                <FormLabel>APP Total (ha)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min="0" {...field} />
                </FormControl>
                <FormDescription>Área de Preservação Permanente</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="metros_rio_total"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Metros de Rio</FormLabel>
                <FormControl>
                  <Input type="number" step="1" min="0" {...field} />
                </FormControl>
                <FormDescription>Total de metros de rio</FormDescription>
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
                <Textarea placeholder="Informações adicionais..." {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {propriedade ? "Salvar Alterações" : "Cadastrar Propriedade"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
