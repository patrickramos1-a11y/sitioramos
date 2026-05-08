import { Link } from "react-router-dom";
import { FolderKanban, CheckSquare, Receipt, ArrowRight, Sprout, Wallet, ClipboardList, MapPin } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useTasks } from "@/hooks/useTasks";
import { cn } from "@/lib/utils";

const ACTIONS = [
  {
    label: "Novo Projeto",
    description: "Planejar plantio, limpeza ou etapa produtiva.",
    to: "/operacao?new=projeto",
    icon: FolderKanban,
    accent: "from-brand-leaf/90 to-brand-forest text-brand-paper",
    iconBg: "bg-brand-paper/15 text-brand-paper",
    halo: "shadow-[0_18px_40px_-18px_hsl(145_60%_12%/0.55)]",
  },
  {
    label: "Nova Tarefa",
    description: "Registrar uma ação operacional rápida.",
    to: "/operacao?new=tarefa",
    icon: CheckSquare,
    accent: "from-[hsl(43_100%_55%)] to-[hsl(38_95%_45%)] text-brand-forest",
    iconBg: "bg-brand-forest/10 text-brand-forest",
    halo: "shadow-[0_18px_40px_-18px_hsl(43_100%_48%/0.6)]",
  },
  {
    label: "Nova Despesa",
    description: "Lançar custo, compra ou pagamento.",
    to: "/lancamentos?new=1",
    icon: Receipt,
    accent: "from-[hsl(28_45%_94%)] to-[hsl(28_35%_86%)] text-brand-forest",
    iconBg: "bg-[hsl(12_70%_42%)]/10 text-[hsl(12_70%_42%)]",
    halo: "shadow-[0_18px_40px_-18px_hsl(28_35%_38%/0.45)]",
  },
];

function formatCurrency(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n || 0);
}

export function MobileHome() {
  const { data: stats } = useDashboardStats();
  const { tasks } = useTasks();

  const tarefasPendentes = (tasks || []).filter((t: any) => t.status !== "concluida" && t.status !== "concluido").length;
  const areaManejo = stats?.territorial.areaProdutiva ?? 0;
  const ciclosAtivos = stats?.productive.ciclosAtivos ?? 0;
  const saldo = stats?.financial.saldoCaixa ?? 0;

  return (
    <div className="relative -mx-4 -mt-4 px-4 pt-4 pb-2 min-h-[calc(100dvh-4rem)] overflow-hidden">
      {/* Fundo vivo: nascer-do-sol + horizonte */}
      <div aria-hidden className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(120%_60%_at_50%_-10%,hsl(43_100%_70%/0.35),transparent_60%),radial-gradient(80%_50%_at_85%_15%,hsl(43_100%_55%/0.18),transparent_70%)]" />
        <div className="absolute inset-x-0 top-[42%] h-[58%] bg-[linear-gradient(180deg,transparent,hsl(138_45%_88%/0.55)_30%,hsl(138_50%_82%/0.4))]" />
        <svg viewBox="0 0 400 200" className="absolute inset-x-0 top-[38%] w-full h-40 opacity-70" preserveAspectRatio="none">
          <path d="M0,120 Q100,60 200,90 T400,80 L400,200 L0,200 Z" fill="hsl(138 55% 70% / 0.35)" />
          <path d="M0,150 Q120,100 220,130 T400,120 L400,200 L0,200 Z" fill="hsl(145 55% 30% / 0.25)" />
        </svg>
      </div>

      {/* Hero */}
      <section className="relative pt-2 pb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-sun" />
          <span className="text-[10px] uppercase tracking-[0.18em] text-brand-leaf font-semibold">
            Sítio Ramos · Marapanim/PA
          </span>
        </div>
        <h1 className="font-display text-[26px] leading-tight font-semibold text-brand-forest">
          Bem-vindo de volta
        </h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-[34ch]">
          Organize produção, tarefas e custos com clareza.
        </p>
        <p className="mt-2 text-[11px] italic text-brand-leaf/80">
          “Onde a terra produz futuro.”
        </p>
      </section>

      {/* Ações premium */}
      <section className="space-y-3">
        <h2 className="text-[11px] uppercase tracking-[0.16em] font-semibold text-brand-forest/70 px-1">
          O que você quer fazer?
        </h2>
        {ACTIONS.map((a, idx) => {
          const Icon = a.icon;
          return (
            <Link
              key={a.label}
              to={a.to}
              className={cn(
                "group relative block rounded-2xl overflow-hidden",
                "bg-gradient-to-br", a.accent, a.halo,
                "transition-all duration-200 active:scale-[0.985] active:translate-y-0.5",
                "animate-fade-in",
              )}
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              {/* brilho */}
              <span aria-hidden className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/20 blur-2xl opacity-60 group-active:opacity-90 transition" />
              <div className="relative flex items-center gap-4 p-4">
                <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shrink-0 backdrop-blur", a.iconBg)}>
                  <Icon className="h-6 w-6" strokeWidth={2.2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display text-[17px] font-semibold leading-tight">{a.label}</div>
                  <div className="text-[12px] opacity-80 leading-snug mt-0.5 line-clamp-2">{a.description}</div>
                </div>
                <ArrowRight className="h-5 w-5 opacity-60 group-hover:translate-x-0.5 transition shrink-0" />
              </div>
            </Link>
          );
        })}
      </section>

      {/* Mini-resumo operacional */}
      <section className="mt-5 grid grid-cols-2 gap-2.5">
        <MiniStat
          icon={MapPin}
          label="Área de manejo"
          value={`${areaManejo.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} ha`}
          tone="leaf"
          to="/areas"
        />
        <MiniStat
          icon={Sprout}
          label="Ciclos ativos"
          value={String(ciclosAtivos)}
          tone="forest"
          to="/operacao"
        />
        <MiniStat
          icon={ClipboardList}
          label="Tarefas pendentes"
          value={String(tarefasPendentes)}
          tone="sun"
          to="/operacao"
        />
        <MiniStat
          icon={Wallet}
          label="Saldo de caixa"
          value={formatCurrency(saldo)}
          tone={saldo >= 0 ? "leaf" : "earth"}
          to="/caixa"
        />
      </section>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  tone,
  to,
}: {
  icon: any;
  label: string;
  value: string;
  tone: "leaf" | "forest" | "sun" | "earth";
  to: string;
}) {
  const tones: Record<string, string> = {
    leaf: "text-brand-leaf bg-brand-leaf/10",
    forest: "text-brand-forest bg-brand-forest/10",
    sun: "text-[hsl(38_95%_38%)] bg-brand-sun/15",
    earth: "text-[hsl(12_70%_42%)] bg-[hsl(12_70%_42%)]/10",
  };
  return (
    <Link
      to={to}
      className="group rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm p-3 shadow-soft hover:shadow-elev transition active:scale-[0.98]"
    >
      <div className="flex items-center gap-2">
        <span className={cn("h-7 w-7 rounded-lg flex items-center justify-center", tones[tone])}>
          <Icon className="h-3.5 w-3.5" strokeWidth={2.4} />
        </span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium truncate">
          {label}
        </span>
      </div>
      <div className="mt-1.5 font-display text-lg font-semibold text-brand-forest leading-tight truncate">
        {value}
      </div>
    </Link>
  );
}
