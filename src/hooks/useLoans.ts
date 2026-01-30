import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

export type Loan = Tables<"loans">;
export type LoanInsert = TablesInsert<"loans">;
export type LoanUpdate = TablesUpdate<"loans">;

export type Installment = Tables<"installments">;
export type InstallmentInsert = TablesInsert<"installments">;
export type InstallmentUpdate = TablesUpdate<"installments">;

export function useLoans() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: loans = [], isLoading, error } = useQuery({
    queryKey: ["loans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loans")
        .select("*, areas(nome), cycles(cultura), installments(*)")
        .order("data", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const createLoan = useMutation({
    mutationFn: async (newLoan: LoanInsert) => {
      const { data, error } = await supabase
        .from("loans")
        .insert(newLoan)
        .select()
        .single();
      
      if (error) throw error;
      
      // Create installments
      if (data && newLoan.numero_parcelas > 0) {
        const installments: InstallmentInsert[] = [];
        const valorParcela = Number(newLoan.valor_parcela);
        const dataInicio = new Date(newLoan.data);
        
        for (let i = 1; i <= newLoan.numero_parcelas; i++) {
          const dataVencimento = new Date(dataInicio);
          dataVencimento.setMonth(dataVencimento.getMonth() + i);
          
          installments.push({
            loan_id: data.id,
            numero_parcela: i,
            valor: valorParcela,
            data_vencimento: dataVencimento.toISOString().split('T')[0],
            status: "pendente",
          });
        }
        
        const { error: installmentError } = await supabase
          .from("installments")
          .insert(installments);
        
        if (installmentError) throw installmentError;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      toast({
        title: "Empréstimo registrado",
        description: "O empréstimo foi cadastrado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao registrar empréstimo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateLoan = useMutation({
    mutationFn: async ({ id, ...updates }: LoanUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("loans")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      toast({
        title: "Empréstimo atualizado",
        description: "As alterações foram salvas.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar empréstimo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteLoan = useMutation({
    mutationFn: async (id: string) => {
      // First delete all installments
      const { error: installmentError } = await supabase
        .from("installments")
        .delete()
        .eq("loan_id", id);
      
      if (installmentError) throw installmentError;
      
      const { error } = await supabase
        .from("loans")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      toast({
        title: "Empréstimo excluído",
        description: "O empréstimo foi removido com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir empréstimo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const payInstallment = useMutation({
    mutationFn: async ({ id, dataPagamento }: { id: string; dataPagamento: string }) => {
      const { data, error } = await supabase
        .from("installments")
        .update({
          status: "paga",
          data_pagamento: dataPagamento,
        })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      toast({
        title: "Parcela paga",
        description: "A parcela foi marcada como paga.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao pagar parcela",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    loans,
    isLoading,
    error,
    createLoan,
    updateLoan,
    deleteLoan,
    payInstallment,
  };
}
