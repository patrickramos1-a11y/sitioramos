import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Area, AreaInsert } from "@/hooks/useAreas";
import { Loader2, TreePine } from "lucide-react";
import { calculateAppFromRiver } from "@/lib/categoryConfig";
import { EnvironmentalLimitGuard } from "@/components/operacao/EnvironmentalLimitGuard";

const areaSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  tamanho_hectares: z.coerce.number().positive("Tamanho deve ser maior que 0"),
  status: z.enum(["planejamento", "preparo", "plantada", "producao", "colhida"]),
  tipo: z.string().min(1, "Tipo é obrigatório"),
  possui_rio: z.boolean(),
  metros_rio: z.coerce.number().min(0, "Metros de rio não podem ser negativos"),
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

const tipoOptions = [
  { value: "produtiva", label: "Produtiva" },
  { value: "ambiental", label: "Ambiental" },
  { value: "administrativa", label: "Administrativa" },
];

interface AreaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  area?: Area | null;
  talhaoId: string;
  onSubmit: (data: AreaInsert) => void;
  isSubmitting?: boolean;
}

export function AreaForm({ open, onOpenChange, area, talhaoId, onSubmit, isSubmitting }: AreaFormProps) {
  const form = useForm<AreaFormData>({
    resolver: zodResolver(areaSchema),
    defaultValues: {
      nome: "",
      tamanho_hectares: 0,
      status: "planejamento",
      tipo: "produtiva",
      possui_rio: false,
      metros_rio: 0,
      cultura_principal: "",
      data_inicio: "",
      observacoes: "",
    },
  });

  const possuiRio = form.watch("possui_rio");
  const metrosRio = form.watch("metros_rio");
  const tamanhoHa = form.watch("tamanho_hectares");
  const tipoSel = form.watch("tipo");
  const appCalculada = possuiRio ? calculateAppFromRiver(metrosRio || 0) : 0;

  useEffect(() => {
    if (area) {
      const areaRio = Number((area as any).metros_rio || 0);
      form.reset({
        nome: area.nome,
        tamanho_hectares: Number(area.tamanho_hectares),
        status: area.status,
        tipo: (area as any).tipo || "produtiva",
        possui_rio: areaRio > 0,
        metros_rio: areaRio,
        cultura_principal: area.cultura_principal || "",
        data_inicio: area.data_inicio || "",
        observacoes: area.observacoes || "",
      });
    } else {
      form.reset({
        nome: "",
        tamanho_hectares: 0,
        status: "planejamento",
        tipo: "produtiva",
        possui_rio: false,
        metros_rio: 0,
        cultura_principal: "",
        data_inicio: "",
        observacoes: "",
      });
    }
  }, [area, form]);

  const handleSubmit = (data: AreaFormData) => {
    const finalMetrosRio = data.possui_rio ? data.metros_rio : 0;
    const finalApp = calculateAppFromRiver(finalMetrosRio);
    
    onSubmit({
      nome: data.nome,
      tamanho_hectares: data.tamanho_hectares,
      status: data.status,
      cultura_principal: data.cultura_principal || null,
      data_inicio: data.data_inicio || null,
      observacoes: data.observacoes || null,
      ...({ 
        talhao_id: talhaoId,
        tipo: data.tipo,
        area_app_hectares: finalApp,
        metros_rio: finalMetrosRio,
      } as any),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{area ? "Editar Área" : "Nova Área"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <EnvironmentalLimitGuard
              novaAreaHectares={Number(tamanhoHa) || 0}
              excludeAreaId={area?.id}
              tipoArea={tipoSel}
            />
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Área *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Área 1 - Café" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
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

            {/* River toggle */}
            <FormField
              control={form.control}
              name="possui_rio"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel>Passa rio nesta área?</FormLabel>
                    <FormDescription>
                      A APP será calculada automaticamente (80m de faixa)
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            {possuiRio && (
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="metros_rio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Metros de Rio</FormLabel>
                      <FormControl>
                        <Input type="number" step="1" min="0" {...field} />
                      </FormControl>
                      <FormDescription>Extensão de rio nesta área</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {metrosRio > 0 && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <TreePine className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">APP calculada</p>
                      <p className="text-lg font-bold text-primary">{appCalculada.toFixed(2)} ha</p>
                      <p className="text-xs text-muted-foreground">Faixa de 80m × {metrosRio}m</p>
                    </div>
                  </div>
                )}
              </div>
            )}

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
