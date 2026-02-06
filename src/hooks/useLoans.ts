import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import type { LoanFormSubmitData } from "@/components/loans/LoanForm";

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
    mutationFn: async (formData: LoanFormSubmitData) => {
      // Insert the loan record
      const { data, error } = await supabase
        .from("loans")
        .insert({
          data: formData.data,
          origem_credor: formData.origem_credor,
          valor_principal: formData.valor_principal,
          valor_total: formData.valor_total,
          valor_parcela: formData.valor_parcela,
          valor_recebido: formData.valor_recebido,
          descontos_iniciais: formData.descontos_iniciais,
          valor_juros_total: formData.valor_juros_total,
          juros_percentual: formData.juros_percentual,
          numero_parcelas: formData.numero_parcelas,
          area_id: formData.area_id,
          cycle_id: formData.cycle_id,
          observacoes: formData.observacoes,
          creditado_caixa: true, // Always credit cash
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Create installments
      if (data && formData.numero_parcelas > 0) {
        const installments: InstallmentInsert[] = [];
        const dataInicio = new Date(formData.data);
        
        for (let i = 1; i <= formData.numero_parcelas; i++) {
          const dataVencimento = new Date(dataInicio);
          dataVencimento.setMonth(dataVencimento.getMonth() + i);
          
          installments.push({
            loan_id: data.id,
            numero_parcela: i,
            valor: formData.valor_parcela,
            data_vencimento: dataVencimento.toISOString().split('T')[0],
            status: "pendente",
          });
        }
        
        const { error: installmentError } = await supabase
          .from("installments")
          .insert(installments);
        
        if (installmentError) throw installmentError;
      }

      // ALWAYS create cash transactions:
      // 1. Entry for the received amount (valor_recebido)
      if (data && formData.valor_recebido > 0) {
        const { error: cashEntryError } = await supabase
          .from("cash_transactions")
          .insert({
            data: formData.data,
            tipo: "entrada",
            categoria: "emprestimo_entrada",
            valor: formData.valor_recebido,
            descricao: `Recebimento de empréstimo: ${formData.origem_credor}`,
            loan_id: data.id,
            area_id: formData.area_id,
            cycle_id: formData.cycle_id,
          });
        
        if (cashEntryError) throw cashEntryError;
      }

      // 2. Exit for initial discounts/bank fees (if any)
      if (data && formData.descontos_iniciais > 0) {
        const { error: cashDiscountError } = await supabase
          .from("cash_transactions")
          .insert({
            data: formData.data,
            tipo: "saida",
            categoria: "tarifas_bancarias",
            valor: formData.descontos_iniciais,
            descricao: `Descontos iniciais empréstimo: ${formData.origem_credor}`,
            loan_id: data.id,
            area_id: formData.area_id,
            cycle_id: formData.cycle_id,
          });
        
        if (cashDiscountError) throw cashDiscountError;
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
        description: "O empréstimo foi cadastrado e as transações foram lançadas no caixa.",
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
    mutationFn: async (formData: LoanFormSubmitData & { id: string }) => {
      const { id, ...updates } = formData;
      const { data, error } = await supabase
        .from("loans")
        .update({
          data: updates.data,
          origem_credor: updates.origem_credor,
          valor_principal: updates.valor_principal,
          valor_total: updates.valor_total,
          valor_parcela: updates.valor_parcela,
          valor_recebido: updates.valor_recebido,
          descontos_iniciais: updates.descontos_iniciais,
          valor_juros_total: updates.valor_juros_total,
          juros_percentual: updates.juros_percentual,
          numero_parcelas: updates.numero_parcelas,
          area_id: updates.area_id,
          cycle_id: updates.cycle_id,
          observacoes: updates.observacoes,
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
        description: "O empréstimo, parcelas e transações vinculadas foram removidos.",
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
      // Get installment details first
      const { data: installment, error: fetchError } = await supabase
        .from("installments")
        .select("*, loans(origem_credor, area_id, cycle_id)")
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
      if (installment) {
        const loanData = installment.loans as any;
        const loanName = loanData?.origem_credor || "Empréstimo";
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
            area_id: loanData?.area_id || null,
            cycle_id: loanData?.cycle_id || null,
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
          area_id: loan.area_id,
          cycle_id: loan.cycle_id,
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
