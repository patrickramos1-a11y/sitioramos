import { Link } from "react-router-dom";
import { Sprout, Wallet, ClipboardList, MapPin, ArrowUpRight } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useTasks } from "@/hooks/useTasks";
import { cn } from "@/lib/utils";
import {
  SproutHorizonIcon,
  FieldChecklistIcon,
  ReceiptSeedIcon,
  FieldNotebookIcon,
} from "./ActionIcons";

type Action = {
  label: string;
  description: string;
  Icon: React.ComponentType<{ stroke?: string; accent?: string; size?: number; className?: string }>;
  iconStroke: string;
  iconAccent: string;
  iconBg: string;
  to?: string;
  onClick?: () => void;
  cardBg: string;
  textColor: string;
  subtitleColor: string;
  glow: string;
  arrowColor: string;
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export function MobileHome() {
  const { data: stats } = useDashboardStats();
  const { tasks } = useTasks();
  

  const tarefasPendentes = (tasks || []).filter(
    (t: any) => t.status !== "concluida" && t.status !== "concluido",
  ).length;
  const areaManejo = stats?.territorial.areaProdutiva ?? 0;
  const ciclosAtivos = stats?.productive.ciclosAtivos ?? 0;
  const saldo = stats?.financial.saldoCaixa ?? 0;

  const actions: Action[] = [
    {
      label: "Novo Projeto",
      description: "Planejar etapa produtiva.",
      image: imgProjeto,
      to: "/operacao?new=projeto",
      cardBg: "bg-gradient-to-br from-brand-forest to-[hsl(142_55%_22%)]",
      textColor: "text-brand-paper",
      glow: "bg-brand-sun/30",
    },
    {
      label: "Nova Tarefa",
      description: "Registrar ação rápida.",
      image: imgTarefa,
      to: "/operacao?new=tarefa",
      cardBg: "bg-gradient-to-br from-[hsl(43_100%_62%)] to-[hsl(38_95%_48%)]",
      textColor: "text-brand-forest",
      glow: "bg-white/40",
    },
    {
      label: "Nova Despesa",
      description: "Lançar custo ou compra.",
      image: imgDespesa,
      to: "/lancamentos?new=1",
      cardBg: "bg-gradient-to-br from-[hsl(28_55%_92%)] to-[hsl(20_45%_78%)]",
      textColor: "text-brand-forest",
      glow: "bg-[hsl(12_70%_55%)]/25",
    },
    {
      label: "Diário de Campo",
      description: "Anotar ocorrência do dia.",
      image: imgDiario,
      to: "/diario",
      cardBg: "bg-gradient-to-br from-[hsl(82_38%_86%)] to-[hsl(95_30%_64%)]",
      textColor: "text-brand-forest",
      glow: "bg-brand-leaf/30",
    },
  ];

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* Fundo vivo (compacto) */}
      <div aria-hidden className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(110%_50%_at_50%_-10%,hsl(43_100%_70%/0.28),transparent_60%),radial-gradient(70%_40%_at_90%_10%,hsl(43_100%_55%/0.15),transparent_70%)]" />
        <div className="absolute inset-x-0 top-[35%] h-[65%] bg-[linear-gradient(180deg,transparent,hsl(138_45%_88%/0.4)_40%,hsl(138_50%_82%/0.3))]" />
      </div>

      {/* Hero compacto */}
      <section className="shrink-0 px-1 pt-1 pb-2">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="inline-block h-1 w-1 rounded-full bg-brand-sun" />
          <span className="text-[9px] uppercase tracking-[0.18em] text-brand-leaf font-semibold">
            Marapanim/PA
          </span>
        </div>
        <h2 className="font-display text-[19px] leading-tight font-semibold text-brand-forest">
          Bem-vindo de volta
        </h2>
        <p className="text-[11.5px] text-muted-foreground leading-snug">
          Organize produção, tarefas e custos com clareza.
        </p>
        <p className="text-[10px] italic text-brand-leaf/80 mt-0.5">
          “Onde a terra produz futuro.”
        </p>
      </section>

      {/* Ações 2x2 — cards visuais com ilustração */}
      <section className="flex-1 min-h-0 grid grid-cols-2 gap-2.5 px-0.5">
        {actions.map((a, idx) => {
          const inner = (
            <div
              className={cn(
                "relative h-full w-full overflow-hidden rounded-[1.75rem] shadow-[0_14px_32px_-14px_hsl(145_60%_12%/0.55)]",
                "ring-1 ring-white/40",
                "transition-all duration-150 active:scale-[0.97] active:translate-y-0.5",
                "animate-fade-in",
                a.cardBg,
                a.textColor,
              )}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {/* halo difuso */}
              <span
                aria-hidden
                className={cn(
                  "absolute -top-10 -right-10 h-32 w-32 rounded-full blur-2xl opacity-70",
                  a.glow,
                )}
              />
              {/* ilustração */}
              <img
                src={a.image}
                alt=""
                aria-hidden
                loading="lazy"
                width={512}
                height={512}
                className="absolute -right-3 -top-2 h-[58%] w-auto object-contain drop-shadow-[0_6px_10px_rgba(0,0,0,0.18)] pointer-events-none select-none"
              />
              {/* conteúdo inferior */}
              <div className="absolute inset-x-0 bottom-0 p-3">
                <div className="font-display text-[15px] font-semibold leading-tight">
                  {a.label}
                </div>
                <div className="text-[10.5px] opacity-85 leading-snug mt-0.5 line-clamp-2">
                  {a.description}
                </div>
              </div>
            </div>
          );
          return a.to ? (
            <Link key={a.label} to={a.to} className="block h-full">
              {inner}
            </Link>
          ) : (
            <button
              key={a.label}
              type="button"
              onClick={a.onClick}
              className="block h-full text-left"
            >
              {inner}
            </button>
          );
        })}
      </section>

      {/* Indicadores compactos */}
      <section className="shrink-0 mt-2 grid grid-cols-4 gap-1.5">
        <MiniStat
          icon={MapPin}
          label="Área"
          value={`${areaManejo.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}ha`}
          tone="leaf"
          to="/areas"
        />
        <MiniStat
          icon={Sprout}
          label="Ciclos"
          value={String(ciclosAtivos)}
          tone="forest"
          to="/operacao"
        />
        <MiniStat
          icon={ClipboardList}
          label="Tarefas"
          value={String(tarefasPendentes)}
          tone="sun"
          to="/operacao"
        />
        <MiniStat
          icon={Wallet}
          label="Caixa"
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
      className="group rounded-xl border border-border/60 bg-card/85 backdrop-blur-sm px-2 py-1.5 shadow-soft active:scale-[0.97] transition"
    >
      <div className="flex items-center gap-1">
        <span
          className={cn(
            "h-5 w-5 rounded-md flex items-center justify-center shrink-0",
            tones[tone],
          )}
        >
          <Icon className="h-3 w-3" strokeWidth={2.4} />
        </span>
        <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium truncate">
          {label}
        </span>
      </div>
      <div className="mt-0.5 font-display text-[13px] font-semibold text-brand-forest leading-tight truncate">
        {value}
      </div>
    </Link>
  );
}
