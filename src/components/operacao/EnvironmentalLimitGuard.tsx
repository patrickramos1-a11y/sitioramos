import { useMemo } from "react";
import { AlertTriangle, ShieldAlert, Info } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useAreas, Area } from "@/hooks/useAreas";
import { usePropriedade } from "@/hooks/usePropriedade";

interface EnvironmentalLimitGuardProps {
  /** Nova área que o usuário está tentando criar/editar (em hectares) */
  novaAreaHectares?: number;
  /** ID da área que está sendo editada (para excluí-la da soma) */
  excludeAreaId?: string;
  /** Tipo da área sendo criada — bloqueia se for protegida */
  tipoArea?: string;
  /** Anos de manejo previstos para o ciclo (opcional) */
  anosManejoPrevistos?: number;
  /** Se true, mostra apenas como aviso e não como bloqueio crítico */
  somenteAviso?: boolean;
}

const LIMITE_DEFAULT_HA = 18.29;
const ESCALONAMENTO_DEFAULT_ANOS = 4;

export function EnvironmentalLimitGuard({
  novaAreaHectares = 0,
  excludeAreaId,
  tipoArea,
  anosManejoPrevistos,
  somenteAviso,
}: EnvironmentalLimitGuardProps) {
  const { propriedade } = usePropriedade();
  const { areas } = useAreas();

  const limiteHa =
    Number((propriedade as any)?.area_max_manejo_ha) || LIMITE_DEFAULT_HA;
  const escalonamentoAnos =
    Number((propriedade as any)?.manejo_escalonado_anos) || ESCALONAMENTO_DEFAULT_ANOS;

  const totalEmManejo = useMemo(() => {
    return areas
      .filter(
        (a: Area) =>
          a.id !== excludeAreaId &&
          ((a as any).tipo_protecao || (a as any).tipo) === "produtiva"
      )
      .reduce((sum, a) => sum + Number(a.tamanho_hectares || 0), 0);
  }, [areas, excludeAreaId]);

  const totalProjetado = totalEmManejo + (novaAreaHectares || 0);
  const excedeLimite = totalProjetado > limiteHa;
  const proximoLimite = !excedeLimite && totalProjetado > limiteHa * 0.85;

  const isProtecao =
    tipoArea === "app" ||
    tipoArea === "reserva_legal" ||
    tipoArea === "ambiental";

  const escalonamentoCurto =
    anosManejoPrevistos !== undefined &&
    anosManejoPrevistos > 0 &&
    anosManejoPrevistos < escalonamentoAnos;

  if (isProtecao) {
    return (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Área protegida — operação bloqueada</AlertTitle>
        <AlertDescription>
          Áreas marcadas como APP, Reserva Legal ou Ambiental não podem receber
          operações produtivas. Altere o tipo da área ou selecione outra.
        </AlertDescription>
      </Alert>
    );
  }

  if (excedeLimite && !somenteAviso) {
    return (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Limite ambiental ultrapassado</AlertTitle>
        <AlertDescription className="space-y-1">
          <p>
            A soma das áreas em manejo ({totalProjetado.toFixed(2)} ha) excede o
            limite licenciado de {limiteHa.toFixed(2)} ha.
          </p>
          <p className="text-xs opacity-80">
            Reduza o tamanho da área, transforme parte em APP/Reserva ou aguarde
            outra área concluir o ciclo.
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  if (proximoLimite || (excedeLimite && somenteAviso)) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertTitle>Atenção ao limite ambiental</AlertTitle>
        <AlertDescription>
          Total em manejo projetado: {totalProjetado.toFixed(2)} ha de{" "}
          {limiteHa.toFixed(2)} ha permitidos.
        </AlertDescription>
      </Alert>
    );
  }

  if (escalonamentoCurto) {
    return (
      <Alert>
        <Info className="h-4 w-4 text-amber-600" />
        <AlertTitle>Manejo escalonado recomendado</AlertTitle>
        <AlertDescription>
          O manejo previsto ({anosManejoPrevistos} ano
          {anosManejoPrevistos === 1 ? "" : "s"}) é menor que o escalonamento
          recomendado de {escalonamentoAnos} anos.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}

export function isEnvironmentalBlocked(opts: {
  novaAreaHectares: number;
  totalEmManejo: number;
  limiteHa?: number;
  tipoArea?: string;
}) {
  const limite = opts.limiteHa ?? LIMITE_DEFAULT_HA;
  if (
    opts.tipoArea === "app" ||
    opts.tipoArea === "reserva_legal" ||
    opts.tipoArea === "ambiental"
  ) {
    return { blocked: true, reason: "area_protegida" as const };
  }
  if (opts.totalEmManejo + opts.novaAreaHectares > limite) {
    return { blocked: true, reason: "excede_limite" as const };
  }
  return { blocked: false as const };
}
