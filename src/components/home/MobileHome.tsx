import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { FolderKanban, CheckSquare, DollarSign } from "lucide-react";
import logo from "@/assets/logo-sitio-ramos.png";

const ACTIONS = [
  {
    label: "Novo Projeto",
    description: "Criar um novo projeto operacional",
    to: "/operacao?new=projeto",
    icon: FolderKanban,
    color: "bg-primary/10 text-primary",
  },
  {
    label: "Nova Tarefa",
    description: "Registrar uma tarefa rápida",
    to: "/operacao?new=tarefa",
    icon: CheckSquare,
    color: "bg-accent/20 text-accent-foreground",
  },
  {
    label: "Nova Despesa",
    description: "Lançar um custo ou pagamento",
    to: "/lancamentos?new=1",
    icon: DollarSign,
    color: "bg-destructive/10 text-destructive",
  },
];

export function MobileHome() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center px-5 pt-8 pb-10 gap-8 bg-background">
      {/* Logo institucional */}
      <div className="flex flex-col items-center text-center gap-3 pt-4">
        <img
          src={logo}
          alt="Sítio Ramos — Onde a terra produz futuro"
          className="w-56 max-w-[80vw] h-auto"
        />
        <p className="text-xs text-muted-foreground tracking-wide uppercase">
          Gestão do campo
        </p>
      </div>

      {/* Ações rápidas */}
      <div className="w-full max-w-md flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground px-1">
          O que você quer fazer?
        </h2>
        {ACTIONS.map((a) => {
          const Icon = a.icon;
          return (
            <Link key={a.label} to={a.to} className="block">
              <Card className="p-4 flex items-center gap-4 hover:shadow-md active:scale-[0.98] transition">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${a.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-base">{a.label}</div>
                  <div className="text-xs text-muted-foreground">{a.description}</div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
