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
  ShoppingBag,
  PiggyBank,
  type LucideIcon,
} from "lucide-react";

type SubConfig = { label: string; icon: LucideIcon; color: string; bgColor: string };

// ============= COST SUBCATEGORIES =============
export const costTypeConfig: Record<string, SubConfig> = {
  preparo_solo: { label: "Preparo de Solo", icon: Tractor, color: "text-amber-700", bgColor: "bg-amber-100" },
  mudas: { label: "Mudas/Sementes", icon: Sprout, color: "text-green-600", bgColor: "bg-green-100" },
  adubacao: { label: "Adubação", icon: FlaskConical, color: "text-purple-600", bgColor: "bg-purple-100" },
  herbicida: { label: "Herbicida", icon: Leaf, color: "text-red-600", bgColor: "bg-red-100" },
  mao_obra: { label: "Mão de Obra", icon: Users, color: "text-blue-600", bgColor: "bg-blue-100" },
  combustivel: { label: "Combustível", icon: Fuel, color: "text-orange-600", bgColor: "bg-orange-100" },
  trator: { label: "Trator", icon: Tractor, color: "text-yellow-700", bgColor: "bg-yellow-100" },
  consultoria: { label: "Consultoria", icon: GraduationCap, color: "text-indigo-600", bgColor: "bg-indigo-100" },
  frete_logistica: { label: "Frete / Logística", icon: Truck, color: "text-sky-600", bgColor: "bg-sky-100" },
  manutencao_infraestrutura: { label: "Manutenção / Infraestrutura", icon: HardHat, color: "text-stone-600", bgColor: "bg-stone-100" },
  insumos_compras: { label: "Insumos / Compras Gerais", icon: ShoppingCart, color: "text-teal-600", bgColor: "bg-teal-100" },
  juros_bancarios: { label: "Juros Bancários", icon: CreditCard, color: "text-rose-600", bgColor: "bg-rose-100" },
  tarifas_bancarias: { label: "Tarifas Bancárias", icon: Receipt, color: "text-pink-600", bgColor: "bg-pink-100" },
  outros: { label: "Outros", icon: Package, color: "text-gray-600", bgColor: "bg-gray-100" },
};

// ============= INVESTMENT SUBCATEGORIES =============
export const investmentTypeConfig: Record<string, SubConfig> = {
  legalizacao: { label: "Legalização", icon: Scale, color: "text-indigo-600", bgColor: "bg-indigo-100" },
  escritura: { label: "Escritura", icon: FileText, color: "text-slate-600", bgColor: "bg-slate-100" },
  contratos: { label: "Contratos", icon: FileText, color: "text-cyan-600", bgColor: "bg-cyan-100" },
  projetos: { label: "Projetos", icon: Building2, color: "text-teal-600", bgColor: "bg-teal-100" },
  infraestrutura: { label: "Infraestrutura", icon: Building2, color: "text-emerald-600", bgColor: "bg-emerald-100" },
  outros: { label: "Outros", icon: Package, color: "text-gray-600", bgColor: "bg-gray-100" },
};

// ============= REVENUE SUBCATEGORIES =============
export const revenueSubtypeConfig: Record<string, SubConfig> = {
  venda: { label: "Venda de Produto", icon: ShoppingBag, color: "text-success", bgColor: "bg-success/10" },
  aporte_socio: { label: "Aporte de Sócio", icon: PiggyBank, color: "text-success", bgColor: "bg-success/10" },
  emprestimo_bancario: { label: "Entrada Bancária", icon: Landmark, color: "text-success", bgColor: "bg-success/10" },
  outra: { label: "Outra Receita", icon: TrendingUp, color: "text-success", bgColor: "bg-success/10" },
};

// ============= FINANCEIRO SUBCATEGORIES =============
export const financeiroSubtypeConfig: Record<string, SubConfig> = {
  recebimento_emprestimo: { label: "Recebimento de Empréstimo", icon: Landmark, color: "text-success", bgColor: "bg-success/10" },
  parcela_emprestimo: { label: "Pagamento de Parcela", icon: CreditCard, color: "text-destructive", bgColor: "bg-destructive/10" },
  quitacao_emprestimo: { label: "Quitação de Empréstimo", icon: Banknote, color: "text-destructive", bgColor: "bg-destructive/10" },
  despesa_financeira: { label: "Despesa Financeira", icon: HandCoins, color: "text-destructive", bgColor: "bg-destructive/10" },
  juros: { label: "Juros", icon: CreditCard, color: "text-destructive", bgColor: "bg-destructive/10" },
  tarifa: { label: "Tarifa Bancária", icon: Receipt, color: "text-destructive", bgColor: "bg-destructive/10" },
  transferencia: { label: "Transferência", icon: ArrowRightLeft, color: "text-muted-foreground", bgColor: "bg-muted" },
};

// ============= CASH TRANSACTION CATEGORIES (4 macro) =============
export type CashCategory = "custo" | "investimento" | "receita" | "financeiro";

export const cashCategoryConfig: Record<CashCategory, {
  label: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  tipo: "entrada" | "saida" | "ambos";
}> = {
  custo: {
    label: "Custo Operacional",
    icon: Wrench,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    tipo: "saida",
  },
  investimento: {
    label: "Custo de Implantação",
    icon: Building2,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    tipo: "saida",
  },
  receita: {
    label: "Receita",
    icon: TrendingUp,
    color: "text-success",
    bgColor: "bg-success/10",
    tipo: "entrada",
  },
  financeiro: {
    label: "Movimento Financeiro",
    icon: Banknote,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    tipo: "ambos",
  },
};

// Returns the subcategoria dictionary for a given categoria
export function getSubcategoriaConfig(categoria: CashCategory | string | null | undefined): Record<string, SubConfig> {
  switch (categoria) {
    case "custo":
      return costTypeConfig;
    case "investimento":
      return investmentTypeConfig;
    case "receita":
      return revenueSubtypeConfig;
    case "financeiro":
      return financeiroSubtypeConfig;
    default:
      return {};
  }
}

export function getSubcategoriaInfo(categoria: CashCategory | string | null | undefined, subcategoria: string | null | undefined): SubConfig | null {
  if (!subcategoria) return null;
  const dict = getSubcategoriaConfig(categoria);
  return dict[subcategoria] || null;
}

export function getSubcategoriaLabel(categoria: CashCategory | string | null | undefined, subcategoria: string | null | undefined): string {
  if (!subcategoria) return "—";
  return getSubcategoriaInfo(categoria, subcategoria)?.label || subcategoria;
}

// APP calculation helper: 80m buffer from river
export function calculateAppFromRiver(metrosRio: number): number {
  return (metrosRio * 80) / 10000; // hectares
}

export function getCostTypeIcon(tipo: string) {
  return costTypeConfig[tipo]?.icon || Package;
}

export function getInvestmentTypeIcon(tipo: string) {
  return investmentTypeConfig[tipo]?.icon || Package;
}

export function getCashCategoryIcon(categoria: CashCategory) {
  return cashCategoryConfig[categoria]?.icon || Wallet;
}
