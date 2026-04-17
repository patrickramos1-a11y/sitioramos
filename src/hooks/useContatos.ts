import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

export type Contato = Tables<"contatos">;
export type ContatoInsert = TablesInsert<"contatos">;
export type ContatoUpdate = TablesUpdate<"contatos">;
export type ContatoCategoria = Contato["categoria"];

export const contatoCategoriaLabels: Record<ContatoCategoria, string> = {
  fornecedor: "Fornecedor",
  cliente: "Cliente",
  prestador: "Prestador",
  funcionario: "Funcionário",
  outro: "Outro",
};

export function useContatos() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: contatos = [], isLoading } = useQuery({
    queryKey: ["contatos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contatos")
        .select("*")
        .order("nome", { ascending: true });
      if (error) throw error;
      return data as Contato[];
    },
  });

  const createContato = useMutation({
    mutationFn: async (input: ContatoInsert) => {
      const { data, error } = await supabase
        .from("contatos")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as Contato;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contatos"] });
      toast({ title: "Contato criado" });
    },
    onError: (e: Error) =>
      toast({
        title: "Erro ao criar contato",
        description: e.message,
        variant: "destructive",
      }),
  });

  const updateContato = useMutation({
    mutationFn: async ({ id, ...updates }: ContatoUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("contatos")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Contato;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contatos"] });
      toast({ title: "Contato atualizado" });
    },
    onError: (e: Error) =>
      toast({
        title: "Erro ao atualizar contato",
        description: e.message,
        variant: "destructive",
      }),
  });

  const deleteContato = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contatos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contatos"] });
      queryClient.invalidateQueries({ queryKey: ["cash-transactions"] });
      toast({ title: "Contato excluído" });
    },
    onError: (e: Error) =>
      toast({
        title: "Erro ao excluir contato",
        description: e.message,
        variant: "destructive",
      }),
  });

  return { contatos, isLoading, createContato, updateContato, deleteContato };
}
