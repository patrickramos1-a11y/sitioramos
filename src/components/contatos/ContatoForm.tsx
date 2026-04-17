import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Contato,
  ContatoInsert,
  contatoCategoriaLabels,
} from "@/hooks/useContatos";
import { Loader2 } from "lucide-react";

const schema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório").max(100),
  telefone: z.string().trim().max(30).optional().or(z.literal("")),
  email: z
    .string()
    .trim()
    .max(150)
    .email("Email inválido")
    .optional()
    .or(z.literal("")),
  endereco: z.string().trim().max(300).optional().or(z.literal("")),
  documento: z.string().trim().max(40).optional().or(z.literal("")),
  categoria: z.enum([
    "fornecedor",
    "cliente",
    "prestador",
    "funcionario",
    "outro",
  ]),
  observacoes: z.string().trim().max(500).optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  contato?: Contato | null;
  defaultNome?: string;
  onSubmit: (data: ContatoInsert) => void;
  isSubmitting?: boolean;
}

export function ContatoForm({
  open,
  onOpenChange,
  contato,
  defaultNome,
  onSubmit,
  isSubmitting,
}: Props) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: "",
      telefone: "",
      email: "",
      endereco: "",
      documento: "",
      categoria: "outro",
      observacoes: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (contato) {
        form.reset({
          nome: contato.nome,
          telefone: contato.telefone || "",
          email: contato.email || "",
          endereco: contato.endereco || "",
          documento: contato.documento || "",
          categoria: contato.categoria,
          observacoes: contato.observacoes || "",
        });
      } else {
        form.reset({
          nome: defaultNome || "",
          telefone: "",
          email: "",
          endereco: "",
          documento: "",
          categoria: "outro",
          observacoes: "",
        });
      }
    }
  }, [open, contato, defaultNome, form]);

  const submit = (data: FormData) => {
    onSubmit({
      nome: data.nome.trim(),
      telefone: data.telefone || null,
      email: data.email || null,
      endereco: data.endereco || null,
      documento: data.documento || null,
      categoria: data.categoria,
      observacoes: data.observacoes || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{contato ? "Editar Contato" : "Novo Contato"}</DialogTitle>
          <DialogDescription>
            Apenas o nome é obrigatório. Os demais dados podem ser preenchidos
            depois.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome da pessoa ou empresa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(contatoCategoriaLabels).map(([v, l]) => (
                          <SelectItem key={v} value={v}>
                            {l}
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
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(00) 00000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="email@exemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endereco"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input placeholder="Rua, número, cidade..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="documento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Documento (CPF/CNPJ)</FormLabel>
                  <FormControl>
                    <Input placeholder="Opcional" {...field} />
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
                    <Textarea placeholder="Notas..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {contato ? "Salvar" : "Criar Contato"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
