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

const frequenciaMonths: Record<string, number> = {
  mensal: 1,
  trimestral: 3,
  semestral: 6,
  anual: 12,
  manual: 1,
};

function generateInstallmentDates(
  dataContrato: string,
  dataPrimeiraParcela: string | null,
  frequencia: string,
  numeroParcelas: number
): string[] {
  const dates: string[] = [];
  const monthsInterval = frequenciaMonths[frequencia] || 1;
  
  let baseDate: Date;
  if (dataPrimeiraParcela) {
    baseDate = new Date(dataPrimeiraParcela + "T12:00:00");
  } else {
    baseDate = new Date(dataContrato + "T12:00:00");
    baseDate.setMonth(baseDate.getMonth() + monthsInterval);
  }

  for (let i = 0; i < numeroParcelas; i++) {
    const d = new Date(baseDate);
    d.setMonth(d.getMonth() + (i * monthsInterval));
    dates.push(d.toISOString().split('T')[0]);
  }

  return dates;
}

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

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["loans"] });
    queryClient.invalidateQueries({ queryKey: ["cash-transactions"] });
    queryClient.invalidateQueries({ queryKey: ["cash-balance"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
  };

  const createLoan = useMutation({
    mutationFn: async (formData: LoanFormSubmitData) => {
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
          frequencia_parcela: formData.frequencia_parcela,
          data_primeira_parcela: formData.data_primeira_parcela,
          area_id: formData.area_id,
          cycle_id: formData.cycle_id,
          observacoes: formData.observacoes,
          creditado_caixa: true,
        } as any)
        .select()
        .single();
      
      if (error) throw error;
      
      // Create installments with proper dates
      if (data && formData.numero_parcelas > 0) {
        const dates = generateInstallmentDates(
          formData.data,
          formData.data_primeira_parcela,
          formData.frequencia_parcela,
          formData.numero_parcelas
        );

        const installments: InstallmentInsert[] = dates.map((date, i) => ({
          loan_id: data.id,
          numero_parcela: i + 1,
          valor: formData.valor_parcela,
          data_vencimento: date,
          status: "pendente" as const,
        }));
        
        const { error: installmentError } = await supabase
          .from("installments")
          .insert(installments);
        
        if (installmentError) throw installmentError;
      }

      // Cash entry for received amount
      if (data && formData.valor_recebido > 0) {
        await supabase.from("cash_transactions").insert({
          data: formData.data,
          tipo: "entrada",
          categoria: "financeiro",
          subcategoria: "recebimento_emprestimo",
          valor: formData.valor_recebido,
          descricao: `Recebimento de empréstimo: ${formData.origem_credor}`,
          loan_id: data.id,
          area_id: formData.area_id,
          cycle_id: formData.cycle_id,
        } as any);
      }

      // Cash exit for initial discounts
      if (data && formData.descontos_iniciais > 0) {
        await supabase.from("cash_transactions").insert({
          data: formData.data,
          tipo: "saida",
          categoria: "financeiro",
          subcategoria: "despesa_financeira",
          valor: formData.descontos_iniciais,
          descricao: `Descontos iniciais: ${formData.origem_credor}`,
          loan_id: data.id,
          area_id: formData.area_id,
          cycle_id: formData.cycle_id,
        } as any);
      }
      
      return data;
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Empréstimo registrado", description: "O empréstimo foi cadastrado e as transações foram lançadas no caixa." });
    },
    onError: (error) => {
      toast({ title: "Erro ao registrar empréstimo", description: error.message, variant: "destructive" });
    },
  });

  const updateLoan = useMutation({
    mutationFn: async (formData: LoanFormSubmitData & { id: string }) => {
      const { id, ...updates } = formData;
      
      // Delete old installments that are still pending
      await supabase.from("installments").delete().eq("loan_id", id).eq("status", "pendente");
      
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
          frequencia_parcela: updates.frequencia_parcela,
          data_primeira_parcela: updates.data_primeira_parcela,
          area_id: updates.area_id,
          cycle_id: updates.cycle_id,
          observacoes: updates.observacoes,
        } as any)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;

      // Get already paid installments count
      const { data: paidInstallments } = await supabase
        .from("installments")
        .select("*")
        .eq("loan_id", id)
        .eq("status", "paga");
      
      const paidCount = paidInstallments?.length || 0;
      const remainingParcelas = updates.numero_parcelas - paidCount;

      // Recreate pending installments
      if (remainingParcelas > 0) {
        const dates = generateInstallmentDates(
          updates.data,
          updates.data_primeira_parcela,
          updates.frequencia_parcela,
          updates.numero_parcelas
        );

        // Only create installments for remaining ones (skip already paid)
        const remainingDates = dates.slice(paidCount);
        const installments: InstallmentInsert[] = remainingDates.map((date, i) => ({
          loan_id: id,
          numero_parcela: paidCount + i + 1,
          valor: updates.valor_parcela,
          data_vencimento: date,
          status: "pendente" as const,
        }));
        
        if (installments.length > 0) {
          await supabase.from("installments").insert(installments);
        }
      }

      return data;
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Empréstimo atualizado", description: "As alterações e parcelas foram atualizadas." });
    },
    onError: (error) => {
      toast({ title: "Erro ao atualizar empréstimo", description: error.message, variant: "destructive" });
    },
  });

  const deleteLoan = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("cash_transactions").delete().eq("loan_id", id);
      await supabase.from("installments").delete().eq("loan_id", id);
      const { error } = await supabase.from("loans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Empréstimo excluído", description: "O empréstimo e todas as transações vinculadas foram removidos." });
    },
    onError: (error) => {
      toast({ title: "Erro ao excluir empréstimo", description: error.message, variant: "destructive" });
    },
  });

  const payInstallment = useMutation({
    mutationFn: async ({ id, dataPagamento }: { id: string; dataPagamento: string }) => {
      const { data: installment, error: fetchError } = await supabase
        .from("installments")
        .select("*, loans(origem_credor, area_id, cycle_id)")
        .eq("id", id)
        .single();
      
      if (fetchError) throw fetchError;

      const { data, error } = await supabase
        .from("installments")
        .update({ status: "paga", data_pagamento: dataPagamento })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;

      if (installment) {
        const loanData = installment.loans as any;
        await supabase.from("cash_transactions").insert({
          data: dataPagamento,
          tipo: "saida",
          categoria: "financeiro",
          subcategoria: "parcela_emprestimo",
          valor: Number(installment.valor),
          descricao: `Parcela ${installment.numero_parcela} - ${loanData?.origem_credor || "Empréstimo"}`,
          loan_id: installment.loan_id,
          installment_id: id,
          area_id: loanData?.area_id || null,
          cycle_id: loanData?.cycle_id || null,
        } as any);
      }

      return data;
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Parcela paga", description: "A parcela foi registrada no caixa." });
    },
    onError: (error) => {
      toast({ title: "Erro ao pagar parcela", description: error.message, variant: "destructive" });
    },
  });

  const quitarEmprestimo = useMutation({
    mutationFn: async ({ loanId, valorQuitacao, dataPagamento }: { loanId: string; valorQuitacao: number; dataPagamento: string }) => {
      const { data: loan, error: fetchError } = await supabase
        .from("loans")
        .select("*, installments(*)")
        .eq("id", loanId)
        .single();
      
      if (fetchError) throw fetchError;

      const pendingInstallments = (loan.installments || []).filter((i: any) => i.status !== "paga");
      
      for (const installment of pendingInstallments) {
        await supabase.from("installments").update({ status: "paga", data_pagamento: dataPagamento }).eq("id", installment.id);
      }

      await supabase.from("loans").update({ status: "quitado" }).eq("id", loanId);

      await supabase.from("cash_transactions").insert({
        data: dataPagamento,
        tipo: "saida",
        categoria: "financeiro",
        subcategoria: "quitacao_emprestimo",
        valor: valorQuitacao,
        descricao: `Quitação antecipada: ${loan.origem_credor}`,
        loan_id: loanId,
        area_id: loan.area_id,
        cycle_id: loan.cycle_id,
      } as any);

      return loan;
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Empréstimo quitado", description: "O empréstimo foi quitado com sucesso." });
    },
    onError: (error) => {
      toast({ title: "Erro ao quitar empréstimo", description: error.message, variant: "destructive" });
    },
  });

  return { loans, isLoading, error, createLoan, updateLoan, deleteLoan, payInstallment, quitarEmprestimo };
}
