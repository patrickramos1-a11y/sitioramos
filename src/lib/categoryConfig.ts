import { 
  Tractor, 
  Fuel, 
  Leaf, 
  Sprout, 
  Users, 
  Wrench, 
  FlaskConical, 
  Package, 
  FileText, 
  Building2, 
  Scale, 
  Landmark, 
  Receipt, 
  TrendingUp, 
  Wallet, 
  CreditCard, 
  Banknote,
  HandCoins,
  ArrowRightLeft,
  GraduationCap,
  Truck,
  HardHat,
  ShoppingCart,
  type LucideIcon
} from "lucide-react";

// ============= COST TYPES =============
export const costTypeConfig: Record<string, { 
  label: string; 
  icon: LucideIcon; 
  color: string;
  bgColor: string;
}> = {
  preparo_solo: { 
    label: "Preparo de Solo", 
    icon: Tractor, 
    color: "text-amber-700",
    bgColor: "bg-amber-100"
  },
  mudas: { 
    label: "Mudas/Sementes", 
    icon: Sprout, 
    color: "text-green-600",
    bgColor: "bg-green-100"
  },
  adubacao: { 
    label: "Adubação", 
    icon: FlaskConical, 
    color: "text-purple-600",
    bgColor: "bg-purple-100"
  },
  herbicida: { 
    label: "Herbicida", 
    icon: Leaf, 
    color: "text-red-600",
    bgColor: "bg-red-100"
  },
  mao_obra: { 
    label: "Mão de Obra", 
    icon: Users, 
    color: "text-blue-600",
    bgColor: "bg-blue-100"
  },
  combustivel: { 
    label: "Combustível", 
    icon: Fuel, 
    color: "text-orange-600",
    bgColor: "bg-orange-100"
  },
  trator: { 
    label: "Trator", 
    icon: Tractor, 
    color: "text-yellow-700",
    bgColor: "bg-yellow-100"
  },
  consultoria: {
    label: "Consultoria",
    icon: GraduationCap,
    color: "text-indigo-600",
    bgColor: "bg-indigo-100"
  },
  frete_logistica: {
    label: "Frete / Logística",
    icon: Truck,
    color: "text-sky-600",
    bgColor: "bg-sky-100"
  },
  manutencao_infraestrutura: {
    label: "Manutenção / Infraestrutura",
    icon: HardHat,
    color: "text-stone-600",
    bgColor: "bg-stone-100"
  },
  insumos_compras: {
    label: "Insumos / Compras Gerais",
    icon: ShoppingCart,
    color: "text-teal-600",
    bgColor: "bg-teal-100"
  },
  juros_bancarios: { 
    label: "Juros Bancários", 
    icon: CreditCard, 
    color: "text-rose-600",
    bgColor: "bg-rose-100"
  },
  tarifas_bancarias: { 
    label: "Tarifas Bancárias", 
    icon: Receipt, 
    color: "text-pink-600",
    bgColor: "bg-pink-100"
  },
  outros: { 
    label: "Outros", 
    icon: Package, 
    color: "text-gray-600",
    bgColor: "bg-gray-100"
  },
};

// ============= INVESTMENT TYPES =============
export const investmentTypeConfig: Record<string, { 
  label: string; 
  icon: LucideIcon; 
  color: string;
  bgColor: string;
}> = {
  legalizacao: { 
    label: "Legalização", 
    icon: Scale, 
    color: "text-indigo-600",
    bgColor: "bg-indigo-100"
  },
  escritura: { 
    label: "Escritura", 
    icon: FileText, 
    color: "text-slate-600",
    bgColor: "bg-slate-100"
  },
  contratos: { 
    label: "Contratos", 
    icon: FileText, 
    color: "text-cyan-600",
    bgColor: "bg-cyan-100"
  },
  projetos: { 
    label: "Projetos", 
    icon: Building2, 
    color: "text-teal-600",
    bgColor: "bg-teal-100"
  },
  infraestrutura: { 
    label: "Infraestrutura", 
    icon: Building2, 
    color: "text-emerald-600",
    bgColor: "bg-emerald-100"
  },
  outros: { 
    label: "Outros", 
    icon: Package, 
    color: "text-gray-600",
    bgColor: "bg-gray-100"
  },
};

// ============= CASH TRANSACTION CATEGORIES =============
export type CashCategory = 
  | "emprestimo_entrada"
  | "receita_venda"
  | "receita_aporte_socio"
  | "receita_emprestimo_bancario"
  | "receita_outra"
  | "aporte"
  | "custo_operacional"
  | "investimento"
  | "parcela_emprestimo"
  | "quitacao_emprestimo"
  | "despesa_financeira"
  | "transferencia";

export const cashCategoryConfig: Record<CashCategory, { 
  label: string; 
  icon: LucideIcon; 
  color: string;
  bgColor: string;
  tipo: "entrada" | "saida";
}> = {
  emprestimo_entrada: { 
    label: "Recebimento de Empréstimo", 
    icon: Landmark, 
    color: "text-success",
    bgColor: "bg-success/10",
    tipo: "entrada"
  },
  receita_venda: { 
    label: "Receita de Venda", 
    icon: TrendingUp, 
    color: "text-success",
    bgColor: "bg-success/10",
    tipo: "entrada"
  },
  receita_aporte_socio: {
    label: "Aporte de Sócio",
    icon: Wallet,
    color: "text-success",
    bgColor: "bg-success/10",
    tipo: "entrada"
  },
  receita_emprestimo_bancario: {
    label: "Entrada Bancária",
    icon: Landmark,
    color: "text-success",
    bgColor: "bg-success/10",
    tipo: "entrada"
  },
  receita_outra: {
    label: "Outra Receita",
    icon: TrendingUp,
    color: "text-success",
    bgColor: "bg-success/10",
    tipo: "entrada"
  },
  aporte: { 
    label: "Aporte de Capital", 
    icon: Wallet, 
    color: "text-success",
    bgColor: "bg-success/10",
    tipo: "entrada"
  },
  custo_operacional: { 
    label: "Custo Operacional", 
    icon: Wrench, 
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    tipo: "saida"
  },
  investimento: { 
    label: "Investimento", 
    icon: Building2, 
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    tipo: "saida"
  },
  parcela_emprestimo: { 
    label: "Pagamento de Parcela", 
    icon: CreditCard, 
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    tipo: "saida"
  },
  quitacao_emprestimo: { 
    label: "Quitação de Empréstimo", 
    icon: Banknote, 
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    tipo: "saida"
  },
  despesa_financeira: { 
    label: "Despesa Financeira", 
    icon: HandCoins, 
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    tipo: "saida"
  },
  transferencia: { 
    label: "Transferência", 
    icon: ArrowRightLeft, 
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    tipo: "saida"
  },
};

// APP calculation helper: 80m buffer from river
export function calculateAppFromRiver(metrosRio: number): number {
  return (metrosRio * 80) / 10000; // hectares
}

// Helper to get icon component for cost type
export function getCostTypeIcon(tipo: string) {
  return costTypeConfig[tipo]?.icon || Package;
}

// Helper to get icon component for investment type
export function getInvestmentTypeIcon(tipo: string) {
  return investmentTypeConfig[tipo]?.icon || Package;
}

// Helper to get icon component for cash category
export function getCashCategoryIcon(categoria: CashCategory) {
  return cashCategoryConfig[categoria]?.icon || Wallet;
}
