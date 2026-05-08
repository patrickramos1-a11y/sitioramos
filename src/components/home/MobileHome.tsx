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
      Icon: SproutHorizonIcon,
      iconStroke: "#FFFFFF",
      iconAccent: "#F5B400",
      iconBg: "bg-white/12",
      to: "/operacao?new=projeto",
      cardBg: "bg-[linear-gradient(145deg,#0D331F_0%,#145B34_58%,#0B2A1A_100%)]",
      textColor: "text-white",
      subtitleColor: "text-white/82",
      glow: "bg-[radial-gradient(circle_at_28%_18%,rgba(245,180,0,0.30),transparent_40%)]",
      arrowColor: "text-white/72",
    },
    {
      label: "Nova Tarefa",
      description: "Registrar ação rápida.",
      Icon: FieldChecklistIcon,
      iconStroke: "#0D331F",
      iconAccent: "#1E7A34",
      iconBg: "bg-[hsl(142_60%_15%)]/10",
      to: "/operacao?new=tarefa",
      cardBg: "bg-[linear-gradient(145deg,#F8C438_0%,#F5B400_48%,#E69A00_100%)]",
      textColor: "text-brand-forest",
      subtitleColor: "text-brand-forest/75",
      glow: "bg-[radial-gradient(circle_at_78%_18%,rgba(255,255,255,0.45),transparent_38%)]",
      arrowColor: "text-brand-forest/70",
    },
    {
      label: "Nova Despesa",
      description: "Lançar custo ou compra.",
      Icon: ReceiptSeedIcon,
      iconStroke: "#C85B32",
      iconAccent: "#0D331F",
      iconBg: "bg-[hsl(15_55%_50%)]/10",
      to: "/lancamentos?new=1",
      cardBg: "bg-[linear-gradient(145deg,#F3E4DA_0%,#EACDBF_58%,#E4B9A6_100%)]",
      textColor: "text-brand-forest",
      subtitleColor: "text-brand-forest/72",
      glow: "bg-[radial-gradient(circle_at_22%_16%,rgba(255,255,255,0.55),transparent_40%)]",
      arrowColor: "text-brand-forest/60",
    },
    {
      label: "Diário de Campo",
      description: "Anotar ocorrência do dia.",
      Icon: FieldNotebookIcon,
      iconStroke: "#0D331F",
      iconAccent: "#1E7A34",
      iconBg: "bg-[hsl(142_60%_15%)]/10",
      to: "/diario",
      cardBg: "bg-[linear-gradient(145deg,#E9F1DF_0%,#BFD8AE_58%,#93BB7F_100%)]",
      textColor: "text-brand-forest",
      subtitleColor: "text-brand-forest/74",
      glow: "bg-[radial-gradient(circle_at_72%_18%,rgba(255,255,255,0.45),transparent_40%)]",
      arrowColor: "text-brand-forest/65",
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
