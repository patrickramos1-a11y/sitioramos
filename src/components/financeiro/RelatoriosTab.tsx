import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { FinanceiroFilters } from "./FinanceiroFilters";
import { useFinanceiroAnalytics, defaultFilters, type FinFilters } from "@/hooks/financeiro/useFinanceiroAnalytics";
import { fmtBRL, sumValor, sumByGrupo, monthKey } from "@/lib/financeiro/finCalc";
import { grupoLabels, type GrupoGerencial } from "@/lib/financeiro/managementGroup";

export function RelatoriosTab() {
  const [filters, setFilters] = useState<FinFilters>(defaultFilters);
  const a = useFinanceiroAnalytics(filters);

  return (
    <div className="space-y-3">
      <FinanceiroFilters value={filters} onChange={setFilters} />

      <Tabs defaultValue="mensal">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="mensal">Mensal</TabsTrigger>
          <TabsTrigger value="area">Por área/talhão</TabsTrigger>
          <TabsTrigger value="ciclo">Por ciclo</TabsTrigger>
          <TabsTrigger value="projeto">Por projeto</TabsTrigger>
          <TabsTrigger value="categoria">Por categoria</TabsTrigger>
          <TabsTrigger value="centro">Por centro</TabsTrigger>
          <TabsTrigger value="emprestimo">Empréstimos</TabsTrigger>
          <TabsTrigger value="naoclass">Não classificados</TabsTrigger>
          <TabsTrigger value="qualidade">Qualidade</TabsTrigger>
        </TabsList>

        <TabsContent value="mensal" className="mt-3"><RelatorioMensal a={a} /></TabsContent>
        <TabsContent value="area" className="mt-3"><RelatorioArea a={a} /></TabsContent>
        <TabsContent value="ciclo" className="mt-3"><RelatorioCiclo a={a} /></TabsContent>
        <TabsContent value="projeto" className="mt-3"><RelatorioProjeto a={a} /></TabsContent>
        <TabsContent value="categoria" className="mt-3"><RelatorioCategoria a={a} /></TabsContent>
        <TabsContent value="centro" className="mt-3"><RelatorioCentro a={a} /></TabsContent>
        <TabsContent value="emprestimo" className="mt-3"><RelatorioEmprestimo a={a} /></TabsContent>
        <TabsContent value="naoclass" className="mt-3"><RelatorioNaoClassificados a={a} /></TabsContent>
        <TabsContent value="qualidade" className="mt-3"><RelatorioQualidade a={a} /></TabsContent>
      </Tabs>
    </div>
  );
}

type A = ReturnType<typeof useFinanceiroAnalytics>;

function Wrapper({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

/* 1. Mensal */
function RelatorioMensal({ a }: { a: A }) {
  const rows = useMemo(() => {
    const map = new Map<string, GrupoGerencial[] extends never ? never : Record<GrupoGerencial, number> & { mes: string; entradas: number; saidas: number; nao_class: number }>();
    for (const r of a.filtered) {
      const k = monthKey(r.tx.data);
      if (!map.has(k)) {
        map.set(k, { mes: k, entradas: 0, saidas: 0, nao_class: 0 } as any);
      }
      const m = map.get(k)! as any;
      m[r.grupo] = (m[r.grupo] || 0) + Number(r.tx.valor);
      if (r.tx.tipo === "entrada") m.entradas += Number(r.tx.valor); else m.saidas += Number(r.tx.valor);
      if (r.grupo === "nao_classificado") m.nao_class += Number(r.tx.valor);
    }
    return Array.from(map.values()).sort((x: any, y: any) => x.mes.localeCompare(y.mes));
  }, [a.filtered]);

  return (
    <Wrapper title="Relatório mensal">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mês</TableHead>
              <TableHead className="text-right">Entradas</TableHead>
              <TableHead className="text-right">Receita Op.</TableHead>
              <TableHead className="text-right">Aportes</TableHead>
              <TableHead className="text-right">Empr. Receb.</TableHead>
              <TableHead className="text-right">Saídas</TableHead>
              <TableHead className="text-right">Custo Plant.</TableHead>
              <TableHead className="text-right">Investimento</TableHead>
              <TableHead className="text-right">Despesa Geral</TableHead>
              <TableHead className="text-right">Pag. Empr.</TableHead>
              <TableHead className="text-right">Juros/Tarif.</TableHead>
              <TableHead className="text-right">Result. Op.</TableHead>
              <TableHead className="text-right">Result. Caixa</TableHead>
              <TableHead className="text-right">Não Class.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((m: any) => {
              const resOp = (m.receita_operacional || 0) - (m.custo_plantacao || 0) - (m.despesa_geral || 0);
              const resCx = m.entradas - m.saidas;
              return (
                <TableRow key={m.mes}>
                  <TableCell className="font-medium">{m.mes}</TableCell>
                  <TableCell className="text-right">{fmtBRL(m.entradas)}</TableCell>
                  <TableCell className="text-right">{fmtBRL(m.receita_operacional || 0)}</TableCell>
                  <TableCell className="text-right">{fmtBRL(m.aporte_socios || 0)}</TableCell>
                  <TableCell className="text-right">{fmtBRL(m.entrada_emprestimo || 0)}</TableCell>
                  <TableCell className="text-right">{fmtBRL(m.saidas)}</TableCell>
                  <TableCell className="text-right">{fmtBRL(m.custo_plantacao || 0)}</TableCell>
                  <TableCell className="text-right">{fmtBRL(m.investimento || 0)}</TableCell>
                  <TableCell className="text-right">{fmtBRL(m.despesa_geral || 0)}</TableCell>
                  <TableCell className="text-right">{fmtBRL(m.pagamento_emprestimo || 0)}</TableCell>
                  <TableCell className="text-right">{fmtBRL(m.juros_tarifas || 0)}</TableCell>
                  <TableCell className={`text-right font-medium ${resOp >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{fmtBRL(resOp)}</TableCell>
                  <TableCell className={`text-right font-medium ${resCx >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{fmtBRL(resCx)}</TableCell>
                  <TableCell className="text-right text-amber-600">{fmtBRL(m.nao_class || 0)}</TableCell>
                </TableRow>
              );
            })}
            {!rows.length && <TableRow><TableCell colSpan={14} className="text-center text-muted-foreground text-xs py-4">Sem dados.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </Wrapper>
  );
}

/* 2. Por área/talhão */
function RelatorioArea({ a }: { a: A }) {
  const rows = useMemo(() => {
    const map = new Map<string, { areaId: string; total: number; ciclos: Set<string> }>();
    for (const r of a.filtered) {
      if (r.grupo !== "custo_plantacao") continue;
      const aid = r.classif?.area_id ?? r.tx.area_id;
      if (!aid) continue;
      if (!map.has(aid)) map.set(aid, { areaId: aid, total: 0, ciclos: new Set() });
      const m = map.get(aid)!;
      m.total += Number(r.tx.valor);
      const cid = r.classif?.cycle_id ?? r.tx.cycle_id;
      if (cid) m.ciclos.add(cid);
    }
    return Array.from(map.values()).map((m) => {
      const area = a.areas.find((x) => x.id === m.areaId);
      const ha = Number(area?.tamanho_hectares || 0);
      return {
        nome: area?.nome ?? "—",
        ha,
        total: m.total,
        custoPorHa: ha > 0 ? m.total / ha : null,
        ciclos: m.ciclos.size,
      };
    }).sort((x, y) => y.total - x.total);
  }, [a.filtered, a.areas]);

  return (
    <Wrapper title="Custos de plantação por área / talhão">
      <Table>
        <TableHeader><TableRow>
          <TableHead>Área</TableHead><TableHead className="text-right">Hectares</TableHead>
          <TableHead className="text-right">Custo total</TableHead><TableHead className="text-right">Custo / ha</TableHead>
          <TableHead className="text-right">Ciclos</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.nome}>
              <TableCell className="font-medium">{r.nome}</TableCell>
              <TableCell className="text-right">{r.ha > 0 ? r.ha.toFixed(2) : "—"}</TableCell>
              <TableCell className="text-right">{fmtBRL(r.total)}</TableCell>
              <TableCell className="text-right">{r.custoPorHa != null ? fmtBRL(r.custoPorHa) : <span className="text-xs text-muted-foreground">área sem tamanho cadastrado</span>}</TableCell>
              <TableCell className="text-right">{r.ciclos}</TableCell>
            </TableRow>
          ))}
          {!rows.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground text-xs py-4">Sem custos de plantação classificados.</TableCell></TableRow>}
        </TableBody>
      </Table>
    </Wrapper>
  );
}

/* 3. Por ciclo */
function RelatorioCiclo({ a }: { a: A }) {
  const rows = useMemo(() => {
    return a.cycles.map((c: any) => {
      const txsCiclo = a.filtered.filter((r) => (r.classif?.cycle_id ?? r.tx.cycle_id) === c.id);
      const custos = txsCiclo.filter((r) => r.grupo === "custo_plantacao").reduce((s, r) => s + Number(r.tx.valor), 0);
      const receitas = txsCiclo.filter((r) => r.grupo === "receita_operacional").reduce((s, r) => s + Number(r.tx.valor), 0);
      const area = a.areas.find((x) => x.id === c.area_id);
      const ha = Number(area?.tamanho_hectares || 0);
      return {
        id: c.id,
        cultura: c.cultura,
        area: area?.nome ?? "—",
        inicio: c.data_inicio_plantio,
        status: c.status,
        custos,
        receitas,
        custoPorHa: ha > 0 ? custos / ha : null,
        resultado: receitas - custos,
      };
    }).filter((r) => r.custos > 0 || r.receitas > 0)
      .sort((x, y) => y.custos - x.custos);
  }, [a.filtered, a.cycles, a.areas]);

  return (
    <Wrapper title="Resultado por ciclo produtivo">
      <Table>
        <TableHeader><TableRow>
          <TableHead>Ciclo</TableHead><TableHead>Área</TableHead><TableHead>Início</TableHead><TableHead>Status</TableHead>
          <TableHead className="text-right">Custos</TableHead><TableHead className="text-right">Custo/ha</TableHead>
          <TableHead className="text-right">Receitas</TableHead><TableHead className="text-right">Resultado</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.cultura}</TableCell>
              <TableCell>{r.area}</TableCell>
              <TableCell>{r.inicio}</TableCell>
              <TableCell><Badge variant="outline" className="text-[10px]">{r.status}</Badge></TableCell>
              <TableCell className="text-right">{fmtBRL(r.custos)}</TableCell>
              <TableCell className="text-right">{r.custoPorHa != null ? fmtBRL(r.custoPorHa) : "—"}</TableCell>
              <TableCell className="text-right">{fmtBRL(r.receitas)}</TableCell>
              <TableCell className={`text-right font-medium ${r.resultado >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{fmtBRL(r.resultado)}</TableCell>
            </TableRow>
          ))}
          {!rows.length && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground text-xs py-4">Sem ciclos com lançamentos classificados.</TableCell></TableRow>}
        </TableBody>
      </Table>
    </Wrapper>
  );
}

/* 4. Por projeto investimento */
function RelatorioProjeto({ a }: { a: A }) {
  const rows = useMemo(() => {
    return a.projetos.map((p) => {
      const realizado = a.filtered
        .filter((r) => r.grupo === "investimento" && r.classif?.projeto_investimento_id === p.id)
        .reduce((s, r) => s + Number(r.tx.valor), 0);
      const previsto = Number(p.valor_previsto || 0);
      const lcs = a.filtered.filter((r) => r.classif?.projeto_investimento_id === p.id).length;
      return { ...p, realizado, previsto, diff: previsto - realizado, lcs };
    });
  }, [a.filtered, a.projetos]);

  return (
    <Wrapper title="Projetos de investimento">
      <Table>
        <TableHeader><TableRow>
          <TableHead>Projeto</TableHead><TableHead>Tipo</TableHead><TableHead>Status</TableHead>
          <TableHead className="text-right">Previsto</TableHead><TableHead className="text-right">Realizado</TableHead>
          <TableHead className="text-right">Diferença</TableHead><TableHead className="text-right">Lançamentos</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.nome}</TableCell>
              <TableCell>{r.tipo}</TableCell>
              <TableCell><Badge variant="outline" className="text-[10px]">{r.status}</Badge></TableCell>
              <TableCell className="text-right">{fmtBRL(r.previsto)}</TableCell>
              <TableCell className="text-right">{fmtBRL(r.realizado)}</TableCell>
              <TableCell className={`text-right ${r.diff >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{fmtBRL(r.diff)}</TableCell>
              <TableCell className="text-right">{r.lcs}</TableCell>
            </TableRow>
          ))}
          {!rows.length && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground text-xs py-4">Sem projetos cadastrados.</TableCell></TableRow>}
        </TableBody>
      </Table>
    </Wrapper>
  );
}

/* 5. Por categoria */
function RelatorioCategoria({ a }: { a: A }) {
  const rows = useMemo(() => {
    const map = new Map<string, { entradas: number; saidas: number; count: number }>();
    for (const r of a.filtered) {
      if (!r.classif?.categoria_id) continue;
      const k = r.classif.categoria_id;
      if (!map.has(k)) map.set(k, { entradas: 0, saidas: 0, count: 0 });
      const m = map.get(k)!;
      m.count++;
      if (r.tx.tipo === "entrada") m.entradas += Number(r.tx.valor); else m.saidas += Number(r.tx.valor);
    }
    return Array.from(map.entries()).map(([id, m]) => ({
      nome: a.cats.find((c) => c.id === id)?.nome ?? "—",
      ...m,
      total: m.entradas - m.saidas,
    })).sort((x, y) => Math.abs(y.entradas + y.saidas) - Math.abs(x.entradas + x.saidas));
  }, [a.filtered, a.cats]);

  return (
    <Wrapper title="Totais por categoria financeira">
      <Table>
        <TableHeader><TableRow>
          <TableHead>Categoria</TableHead><TableHead className="text-right">Lanç.</TableHead>
          <TableHead className="text-right">Entradas</TableHead><TableHead className="text-right">Saídas</TableHead>
          <TableHead className="text-right">Líquido</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.nome}>
              <TableCell className="font-medium">{r.nome}</TableCell>
              <TableCell className="text-right">{r.count}</TableCell>
              <TableCell className="text-right">{fmtBRL(r.entradas)}</TableCell>
              <TableCell className="text-right">{fmtBRL(r.saidas)}</TableCell>
              <TableCell className={`text-right ${r.total >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{fmtBRL(r.total)}</TableCell>
            </TableRow>
          ))}
          {!rows.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground text-xs py-4">Sem dados.</TableCell></TableRow>}
        </TableBody>
      </Table>
    </Wrapper>
  );
}

/* 6. Por centro */
function RelatorioCentro({ a }: { a: A }) {
  const rows = useMemo(() => {
    const map = new Map<string, { entradas: number; saidas: number; count: number }>();
    for (const r of a.filtered) {
      if (!r.classif?.centro_custo_id) continue;
      const k = r.classif.centro_custo_id;
      if (!map.has(k)) map.set(k, { entradas: 0, saidas: 0, count: 0 });
      const m = map.get(k)!;
      m.count++;
      if (r.tx.tipo === "entrada") m.entradas += Number(r.tx.valor); else m.saidas += Number(r.tx.valor);
    }
    return Array.from(map.entries()).map(([id, m]) => ({
      nome: a.centros.find((c) => c.id === id)?.nome ?? "—",
      ...m,
      total: m.entradas - m.saidas,
    })).sort((x, y) => y.saidas - x.saidas);
  }, [a.filtered, a.centros]);

  return (
    <Wrapper title="Totais por centro de custo">
      <Table>
        <TableHeader><TableRow>
          <TableHead>Centro</TableHead><TableHead className="text-right">Lanç.</TableHead>
          <TableHead className="text-right">Entradas</TableHead><TableHead className="text-right">Saídas</TableHead>
          <TableHead className="text-right">Líquido</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.nome}>
              <TableCell className="font-medium">{r.nome}</TableCell>
              <TableCell className="text-right">{r.count}</TableCell>
              <TableCell className="text-right">{fmtBRL(r.entradas)}</TableCell>
              <TableCell className="text-right">{fmtBRL(r.saidas)}</TableCell>
              <TableCell className={`text-right ${r.total >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{fmtBRL(r.total)}</TableCell>
            </TableRow>
          ))}
          {!rows.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground text-xs py-4">Sem dados.</TableCell></TableRow>}
        </TableBody>
      </Table>
    </Wrapper>
  );
}

/* 7. Empréstimos */
function RelatorioEmprestimo({ a }: { a: A }) {
  return (
    <Wrapper title="Empréstimos (consulta ao módulo de Empréstimos)">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Credor</TableHead><TableHead>Status</TableHead>
            <TableHead className="text-right">Contratado</TableHead>
            <TableHead className="text-right">Recebido</TableHead>
            <TableHead className="text-right">Pago</TableHead>
            <TableHead className="text-right">Juros</TableHead>
            <TableHead className="text-right">Tarifas</TableHead>
            <TableHead className="text-right">Parc. pagas</TableHead>
            <TableHead className="text-right">Parc. futuras</TableHead>
            <TableHead className="text-right">Saldo devedor</TableHead>
            <TableHead className="text-right">Lanç. vinc.</TableHead>
            <TableHead className="text-right">Sem class.</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {a.loanMetrics.map((m) => (
              <TableRow key={m.loan.id}>
                <TableCell className="font-medium">{m.loan.origem_credor}</TableCell>
                <TableCell><Badge variant="outline" className="text-[10px]">{m.loan.status}</Badge></TableCell>
                <TableCell className="text-right">{fmtBRL(Number(m.loan.valor_total || 0))}</TableCell>
                <TableCell className="text-right">{fmtBRL(Number(m.loan.valor_recebido || 0))}</TableCell>
                <TableCell className="text-right">{fmtBRL(m.totalPago)}</TableCell>
                <TableCell className="text-right">{fmtBRL(m.juros)}</TableCell>
                <TableCell className="text-right">{fmtBRL(m.tarifas)}</TableCell>
                <TableCell className="text-right">{m.parcelasPagas}</TableCell>
                <TableCell className="text-right">{m.parcelasFuturas.length}</TableCell>
                <TableCell className="text-right font-medium">{fmtBRL(m.saldoDevedor)}</TableCell>
                <TableCell className="text-right">{m.txsLoan.length}</TableCell>
                <TableCell className={`text-right ${m.unlinkedTxs.length ? "text-amber-600 font-medium" : ""}`}>{m.unlinkedTxs.length}</TableCell>
              </TableRow>
            ))}
            {!a.loanMetrics.length && <TableRow><TableCell colSpan={12} className="text-center text-muted-foreground text-xs py-4">Sem empréstimos.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
      <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
        <AlertCircle className="h-3 w-3" /> Parcelas futuras vêm do módulo de Empréstimos. Consulte a página Empréstimos para registrar pagamentos.
      </p>
    </Wrapper>
  );
}

/* 8. Não classificados */
function RelatorioNaoClassificados({ a }: { a: A }) {
  const rows = a.filtered.filter((r) => r.grupo === "nao_classificado");
  return (
    <Wrapper title={`Lançamentos não classificados (${rows.length})`}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Data</TableHead><TableHead>Tipo</TableHead><TableHead>Descrição</TableHead>
            <TableHead>Categoria antiga</TableHead><TableHead className="text-right">Valor</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.tx.id}>
                <TableCell>{r.tx.data}</TableCell>
                <TableCell><Badge variant={r.tx.tipo === "entrada" ? "default" : "destructive"} className="text-[10px]">{r.tx.tipo}</Badge></TableCell>
                <TableCell className="max-w-[300px] truncate" title={r.tx.descricao ?? ""}>{r.tx.descricao}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{r.tx.categoria} {r.tx.subcategoria ? `· ${r.tx.subcategoria}` : ""}</TableCell>
                <TableCell className="text-right">{fmtBRL(Number(r.tx.valor))}</TableCell>
              </TableRow>
            ))}
            {!rows.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground text-xs py-4">Tudo classificado neste filtro.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
      <p className="text-[10px] text-muted-foreground mt-2">Use a aba <strong>Reclassificação</strong> para classificar.</p>
    </Wrapper>
  );
}

/* 9. Qualidade */
function RelatorioQualidade({ a }: { a: A }) {
  const total = a.filtered.length;
  const classificados = a.filtered.filter((r) => r.classif).length;
  const naoClass = total - classificados;
  const revisados = a.filtered.filter((r) => r.classif?.revisado).length;
  const naoRev = classificados - revisados;
  const alta = a.filtered.filter((r) => r.classif?.confianca === "alta").length;
  const media = a.filtered.filter((r) => r.classif?.confianca === "media").length;
  const baixa = a.filtered.filter((r) => r.classif?.confianca === "baixa").length;

  const Item = ({ label, value, hint }: { label: string; value: number | string; hint?: string }) => (
    <div className="border rounded-md p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );

  return (
    <Wrapper title="Qualidade da classificação">
      <div className="grid gap-2 sm:grid-cols-3 md:grid-cols-4">
        <Item label="Total no filtro" value={total} />
        <Item label="Classificados" value={classificados} hint={total ? `${((classificados / total) * 100).toFixed(0)}%` : "—"} />
        <Item label="Não classificados" value={naoClass} />
        <Item label="Revisados" value={revisados} />
        <Item label="Não revisados (classif.)" value={naoRev} />
        <Item label="Confiança alta" value={alta} />
        <Item label="Confiança média" value={media} />
        <Item label="Confiança baixa" value={baixa} />
      </div>
    </Wrapper>
  );
}
