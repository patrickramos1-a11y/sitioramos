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
    mutationFn: async (newLoan: LoanInsert & { 
      creditarCaixa?: boolean; 
      valorRecebido?: number;
      descontosIniciais?: number;
    }) => {
      const { creditarCaixa, valorRecebido, descontosIniciais, ...loanData } = newLoan;
      
      // Calculate received amount (defaults to total if not specified)
      const valorRecebidoFinal = valorRecebido ?? Number(loanData.valor_total);
      const descontosIniciaisFinal = descontosIniciais ?? 0;
      
      const { data, error } = await supabase
        .from("loans")
        .insert({
          ...loanData,
          creditado_caixa: creditarCaixa || false,
          valor_recebido: valorRecebidoFinal,
          descontos_iniciais: descontosIniciaisFinal,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Create installments
      if (data && loanData.numero_parcelas > 0) {
        const installments: InstallmentInsert[] = [];
        const valorParcela = Number(loanData.valor_parcela);
        const dataInicio = new Date(loanData.data);
        
        for (let i = 1; i <= loanData.numero_parcelas; i++) {
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

      // If creditarCaixa is true, create cash transactions
      if (creditarCaixa && data) {
        // Entry for the received amount
        const { error: cashEntryError } = await supabase
          .from("cash_transactions")
          .insert({
            data: loanData.data,
            tipo: "entrada",
            categoria: "emprestimo_entrada",
            valor: valorRecebidoFinal,
            descricao: `Recebimento de empréstimo: ${loanData.origem_credor}`,
            loan_id: data.id,
          });
        
        if (cashEntryError) throw cashEntryError;

        // Exit for initial discounts/fees if any
        if (descontosIniciaisFinal > 0) {
          const { error: cashDiscountError } = await supabase
            .from("cash_transactions")
            .insert({
              data: loanData.data,
              tipo: "saida",
              categoria: "despesa_financeira",
              valor: descontosIniciaisFinal,
              descricao: `Descontos iniciais empréstimo: ${loanData.origem_credor}`,
              loan_id: data.id,
            });
          
          if (cashDiscountError) throw cashDiscountError;
        }
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["cash-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["cash-balance"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
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
      // First delete all cash transactions related to this loan
      const { error: cashError } = await supabase
        .from("cash_transactions")
        .delete()
        .eq("loan_id", id);
      
      if (cashError) throw cashError;

      // Then delete all installments
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
      queryClient.invalidateQueries({ queryKey: ["cash-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["cash-balance"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
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
    mutationFn: async ({ id, dataPagamento, registrarCaixa = true }: { id: string; dataPagamento: string; registrarCaixa?: boolean }) => {
      // Get installment details first
      const { data: installment, error: fetchError } = await supabase
        .from("installments")
        .select("*, loans(origem_credor)")
        .eq("id", id)
        .single();
      
      if (fetchError) throw fetchError;

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

      // Create cash transaction for the installment payment
      if (registrarCaixa && installment) {
        const loanName = (installment.loans as any)?.origem_credor || "Empréstimo";
        const { error: cashError } = await supabase
          .from("cash_transactions")
          .insert({
            data: dataPagamento,
            tipo: "saida",
            categoria: "parcela_emprestimo",
            valor: Number(installment.valor),
            descricao: `Parcela ${installment.numero_parcela} - ${loanName}`,
            loan_id: installment.loan_id,
            installment_id: id,
          });
        
        if (cashError) throw cashError;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["cash-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["cash-balance"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({
        title: "Parcela paga",
        description: "A parcela foi marcada como paga e registrada no caixa.",
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

  const quitarEmprestimo = useMutation({
    mutationFn: async ({ loanId, valorQuitacao, dataPagamento }: { loanId: string; valorQuitacao: number; dataPagamento: string }) => {
      // Get loan details
      const { data: loan, error: fetchError } = await supabase
        .from("loans")
        .select("*, installments(*)")
        .eq("id", loanId)
        .single();
      
      if (fetchError) throw fetchError;

      // Update all pending installments to paid
      const pendingInstallments = (loan.installments || []).filter((i: any) => i.status !== "paga");
      
      for (const installment of pendingInstallments) {
        await supabase
          .from("installments")
          .update({
            status: "paga",
            data_pagamento: dataPagamento,
          })
          .eq("id", installment.id);
      }

      // Update loan status
      const { error: updateError } = await supabase
        .from("loans")
        .update({ status: "quitado" })
        .eq("id", loanId);
      
      if (updateError) throw updateError;

      // Create cash transaction for the early payoff
      const { error: cashError } = await supabase
        .from("cash_transactions")
        .insert({
          data: dataPagamento,
          tipo: "saida",
          categoria: "quitacao_emprestimo",
          valor: valorQuitacao,
          descricao: `Quitação antecipada: ${loan.origem_credor}`,
          loan_id: loanId,
        });
      
      if (cashError) throw cashError;

      return loan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["cash-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["cash-balance"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({
        title: "Empréstimo quitado",
        description: "O empréstimo foi quitado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao quitar empréstimo",
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
    quitarEmprestimo,
  };
}
