import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  useJournalEntries,
  type JournalEntry,
  type JournalEntryInsert,
} from "@/hooks/useJournalEntries";
import { useAreas } from "@/hooks/useAreas";
import { useCycles } from "@/hooks/useCycles";
import { useResponsaveis } from "@/hooks/useResponsaveis";
import { ResponsavelBadge } from "@/components/responsaveis/ResponsavelBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  NotebookPen,
  Search,
  Filter,
  Download,
  RefreshCw,
  Star,
  CheckCircle2,
  ListChecks,
  Receipt,
  Trash2,
  Pencil,
  X,
  Image as ImageIcon,
  Mic,
  PlayCircle,
  MapPin,
  ExternalLink,
  ChevronRight,
  Save,
  FileSpreadsheet,
  FileArchive,
  Plus,
} from "lucide-react";
import {
  downloadCSV,
  downloadEntriesZip,
  downloadEntryZip,
} from "./diarioExport";

const NONE = "__none__";
const TIPOS = [
  { value: "observacao", label: "Registro geral" },
  { value: "plantio", label: "Plantio" },
  { value: "limpeza", label: "Limpeza / manejo" },
  { value: "colheita", label: "Colheita" },
  { value: "manutencao", label: "Manutenção" },
  { value: "ocorrencia", label: "Ocorrência" },
  { value: "clima", label: "Clima" },
  { value: "ambiental", label: "Ambiental" },
];
const STATUS = [
  { value: "informativo", label: "Informativo", tone: "bg-muted text-foreground" },
  { value: "atencao", label: "Atenção", tone: "bg-brand-sun/15 text-[hsl(38_95%_38%)]" },
  { value: "pendente", label: "Pendente", tone: "bg-orange-100 text-orange-700" },
  { value: "resolvido", label: "Resolvido", tone: "bg-brand-leaf/15 text-brand-leaf" },
  { value: "importante", label: "Importante", tone: "bg-red-100 text-red-700" },
];

const PERIODOS = [
  { value: "all", label: "Todo período" },
  { value: "today", label: "Hoje" },
  { value: "7d", label: "Últimos 7 dias" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "90d", label: "Últimos 90 dias" },
];

interface Props {
  onNew: () => void;
}

export function DiarioCockpit({ onNew }: Props) {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: entries = [], isLoading, refetch, markReviewed, convertToTask, remove, update } =
    useJournalEntries(500);
  const { areas = [] } = useAreas() as any;
  const { cycles = [] } = useCycles() as any;
  const { data: responsaveis = [] } = useResponsaveis(true);

  const areaName = (id: string | null) => areas.find((a: any) => a.id === id)?.nome || "";
  const cycleName = (id: string | null) => {
    const c: any = cycles.find((c: any) => c.id === id);
    return c ? `${c.cultura || "Ciclo"}${c.areas?.nome ? ` · ${c.areas.nome}` : ""}` : "";
  };
  const responsavelName = (id: string | null) => responsaveis.find((r) => r.id === id)?.nome || "";

  // Filters
  const [periodo, setPeriodo] = useState("all");
  const [filterTipo, setFilterTipo] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterArea, setFilterArea] = useState("");
  const [filterCiclo, setFilterCiclo] = useState("");
  const [filterResp, setFilterResp] = useState("");
  const [filterReviewed, setFilterReviewed] = useState<"all" | "todo" | "done">("all");
  const [filterImportant, setFilterImportant] = useState(false);
  const [filterMedia, setFilterMedia] = useState(false);
  const [filterNoLink, setFilterNoLink] = useState(false);
  const [filterGps, setFilterGps] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const now = new Date();
    let from: Date | null = null;
    if (periodo === "today") from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    else if (periodo === "7d") from = new Date(now.getTime() - 7 * 86400000);
    else if (periodo === "30d") from = new Date(now.getTime() - 30 * 86400000);
    else if (periodo === "90d") from = new Date(now.getTime() - 90 * 86400000);
    const s = search.trim().toLowerCase();
    return entries.filter((e) => {
      if (from && new Date(e.entry_date) < from) return false;
      if (filterTipo && e.entry_type !== filterTipo) return false;
      if (filterStatus && e.status !== filterStatus) return false;
      if (filterArea && e.area_id !== filterArea) return false;
      if (filterCiclo && e.cycle_id !== filterCiclo) return false;
      if (filterResp && e.responsavel_id !== filterResp) return false;
      if (filterReviewed === "todo" && e.reviewed) return false;
      if (filterReviewed === "done" && !e.reviewed) return false;
      if (filterImportant && !e.is_important) return false;
      if (filterMedia && !(e.attachments && e.attachments.length > 0)) return false;
      if (filterNoLink && (e.area_id || e.cycle_id || e.responsavel_id)) return false;
      if (filterGps && (e.latitude == null || e.longitude == null)) return false;
      if (s) {
        const hay = `${e.title || ""} ${e.description || ""} ${e.notes || ""} ${(e.tags || []).join(" ")}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [
    entries,
    periodo,
    filterTipo,
    filterStatus,
    filterArea,
    filterCiclo,
    filterResp,
    filterReviewed,
    filterImportant,
    filterMedia,
    filterNoLink,
    filterGps,
    search,
  ]);

  // KPIs (over filtered)
  const kpis = useMemo(() => {
    const total = filtered.length;
    const pendentes = filtered.filter((e) => !e.reviewed).length;
    const importantes = filtered.filter((e) => e.is_important).length;
    const semVinculo = filtered.filter((e) => !e.area_id && !e.cycle_id && !e.responsavel_id).length;
    return { total, pendentes, importantes, semVinculo };
  }, [filtered]);

  // Selection + detail
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detailId, setDetailId] = useState<string | null>(null);
  const detail = filtered.find((e) => e.id === detailId) || null;

  const toggleSel = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const toggleAll = () =>
    setSelected((s) =>
      s.size === filtered.length ? new Set() : new Set(filtered.map((e) => e.id)),
    );

  const clearFilters = () => {
    setPeriodo("all");
    setFilterTipo("");
    setFilterStatus("");
    setFilterArea("");
    setFilterCiclo("");
    setFilterResp("");
    setFilterReviewed("all");
    setFilterImportant(false);
    setFilterMedia(false);
    setFilterNoLink(false);
    setFilterGps(false);
    setSearch("");
  };

  const activeFilterCount = [
    periodo !== "all",
    !!filterTipo,
    !!filterStatus,
    !!filterArea,
    !!filterCiclo,
    !!filterResp,
    filterReviewed !== "all",
    filterImportant,
    filterMedia,
    filterNoLink,
    filterGps,
    !!search,
  ].filter(Boolean).length;

  // Bulk ops
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);

  const runBulk = async (patch: Partial<JournalEntryInsert>) => {
    if (!selected.size) return;
    setBulkBusy(true);
    try {
      const ids = Array.from(selected);
      const { error } = await supabase
        .from("journal_entries" as any)
        .update(patch as any)
        .in("id", ids);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["journal_entries"] });
      toast.success(`${ids.length} registro(s) atualizado(s)`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBulkBusy(false);
    }
  };

  const runBulkDelete = async () => {
    setBulkBusy(true);
    try {
      const ids = Array.from(selected);
      const { error } = await supabase.from("journal_entries" as any).delete().in("id", ids);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["journal_entries"] });
      setSelected(new Set());
      setConfirmDelete(false);
      toast.success(`${ids.length} registro(s) excluído(s)`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBulkBusy(false);
    }
  };

  const exportLookup = { areaName, cycleName, responsavelName };

  const handleExportCSV = () => {
    const data = selected.size ? filtered.filter((e) => selected.has(e.id)) : filtered;
    downloadCSV(data, exportLookup, `diario-${new Date().toISOString().slice(0, 10)}.csv`);
  };
  const handleExportZIP = async () => {
    const data = selected.size ? filtered.filter((e) => selected.has(e.id)) : filtered;
    if (data.length > 50 && !confirm(`Exportar ${data.length} registros com mídias? Pode demorar.`)) return;
    toast.info("Gerando ZIP… isso pode demorar alguns segundos");
    await downloadEntriesZip(data, exportLookup, `diario-${new Date().toISOString().slice(0, 10)}.zip`);
    toast.success("ZIP pronto");
  };

  const handleConvertToExpense = (entry: JournalEntry) => {
    const params = new URLSearchParams({ new: "1" });
    if (entry.area_id) params.set("area_id", entry.area_id);
    if (entry.cycle_id) params.set("cycle_id", entry.cycle_id);
    if (entry.description) params.set("descricao", entry.description.slice(0, 80));
    params.set("from_journal", entry.id);
    navigate(`/lancamentos?${params.toString()}`);
  };

  return (
    <div className="space-y-3">
      {/* Header + KPIs */}
      <header className="flex items-start gap-3">
        <span className="h-10 w-10 rounded-xl bg-brand-leaf/15 text-brand-leaf flex items-center justify-center shrink-0">
          <NotebookPen className="h-5 w-5" />
        </span>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-xl font-semibold text-brand-forest">Diário de Campo</h1>
          <p className="text-xs text-muted-foreground">
            Gestão centralizada — filtre, revise, edite e exporte registros do campo.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className={cn("h-4 w-4 mr-1", isLoading && "animate-spin")} />
            Atualizar
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <FileSpreadsheet className="h-4 w-4 mr-1" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportZIP}>
            <FileArchive className="h-4 w-4 mr-1" /> ZIP
          </Button>
          <Button size="sm" className="bg-brand-forest hover:bg-brand-forest/90" onClick={onNew}>
            <Plus className="h-4 w-4 mr-1" /> Novo registro
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-4 gap-2">
        <Kpi label="Total" value={kpis.total} active={false} onClick={clearFilters} />
        <Kpi
          label="Pendentes"
          value={kpis.pendentes}
          tone="sun"
          active={filterReviewed === "todo"}
          onClick={() => setFilterReviewed(filterReviewed === "todo" ? "all" : "todo")}
        />
        <Kpi
          label="Importantes"
          value={kpis.importantes}
          tone="leaf"
          active={filterImportant}
          onClick={() => setFilterImportant((v) => !v)}
        />
        <Kpi
          label="Sem vínculo"
          value={kpis.semVinculo}
          tone="rose"
          active={filterNoLink}
          onClick={() => setFilterNoLink((v) => !v)}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-[260px_minmax(0,1fr)_400px]">
        {/* Filters sidebar */}
        <aside className="space-y-3 lg:sticky lg:top-2 self-start">
          <div className="rounded-xl border bg-card p-3 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-forest/80 flex items-center gap-1">
                <Filter className="h-3.5 w-3.5" /> Filtros
                {activeFilterCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-brand-leaf text-brand-paper text-[10px]">
                    {activeFilterCount}
                  </span>
                )}
              </h3>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-[10px] text-muted-foreground hover:text-brand-forest"
                >
                  limpar
                </button>
              )}
            </div>

            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="h-8 pl-7 text-xs"
              />
            </div>

            <FilterSelect
              label="Período"
              value={periodo}
              onChange={setPeriodo}
              options={PERIODOS}
            />
            <FilterSelectNullable
              label="Tipo"
              value={filterTipo}
              onChange={setFilterTipo}
              options={TIPOS}
              placeholder="Todos"
            />
            <FilterSelectNullable
              label="Status"
              value={filterStatus}
              onChange={setFilterStatus}
              options={STATUS}
              placeholder="Todos"
            />
            <FilterSelectNullable
              label="Área"
              value={filterArea}
              onChange={setFilterArea}
              options={areas.map((a: any) => ({ value: a.id, label: a.nome }))}
              placeholder="Todas"
            />
            <FilterSelectNullable
              label="Ciclo"
              value={filterCiclo}
              onChange={setFilterCiclo}
              options={cycles.map((c: any) => ({
                value: c.id,
                label: `${c.cultura || "Ciclo"}${c.areas?.nome ? ` · ${c.areas.nome}` : ""}`,
              }))}
              placeholder="Todos"
            />
            <FilterSelectNullable
              label="Responsável"
              value={filterResp}
              onChange={setFilterResp}
              options={responsaveis.map((r) => ({ value: r.id, label: r.nome }))}
              placeholder="Todos"
            />

            <div>
              <Label className="text-[11px] text-muted-foreground">Revisão</Label>
              <div className="flex gap-1 mt-1">
                {(["all", "todo", "done"] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setFilterReviewed(opt)}
                    className={cn(
                      "flex-1 text-[10px] px-2 py-1 rounded-md border transition",
                      filterReviewed === opt
                        ? "bg-brand-forest text-brand-paper border-brand-forest"
                        : "border-border hover:bg-muted/50 text-muted-foreground",
                    )}
                  >
                    {opt === "all" ? "Todos" : opt === "todo" ? "A revisar" : "Revisados"}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 pt-1 border-t">
              <ToggleRow checked={filterImportant} onChange={setFilterImportant} icon={<Star className="h-3.5 w-3.5" />}>
                Importantes
              </ToggleRow>
              <ToggleRow checked={filterMedia} onChange={setFilterMedia} icon={<ImageIcon className="h-3.5 w-3.5" />}>
                Com mídia
              </ToggleRow>
              <ToggleRow checked={filterGps} onChange={setFilterGps} icon={<MapPin className="h-3.5 w-3.5" />}>
                Com GPS
              </ToggleRow>
            </div>
          </div>
        </aside>

        {/* Table */}
        <section className="rounded-xl border bg-card overflow-hidden flex flex-col min-h-[60vh]">
          <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30 text-xs">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={filtered.length > 0 && selected.size === filtered.length}
                onCheckedChange={toggleAll}
              />
              <span className="text-muted-foreground">
                {selected.size > 0
                  ? `${selected.size} de ${filtered.length} selecionado(s)`
                  : `${filtered.length} registros`}
              </span>
            </div>
          </div>

          {/* Bulk bar */}
          {selected.size > 0 && (
            <div className="flex items-center gap-1 px-3 py-2 bg-brand-leaf/5 border-b text-xs flex-wrap">
              <Button
                size="sm"
                variant="outline"
                disabled={bulkBusy}
                onClick={() => runBulk({ reviewed: true })}
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Revisar
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={bulkBusy}
                onClick={() => runBulk({ reviewed: false })}
              >
                Reabrir
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={bulkBusy}
                onClick={() => runBulk({ is_important: true })}
              >
                <Star className="h-3.5 w-3.5 mr-1" /> Marcar importante
              </Button>
              <Select
                onValueChange={(v) => runBulk({ responsavel_id: v === NONE ? null : v })}
              >
                <SelectTrigger className="h-8 w-44 text-xs">
                  <SelectValue placeholder="Atribuir responsável..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>— Nenhum —</SelectItem>
                  {responsaveis.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select onValueChange={(v) => runBulk({ area_id: v === NONE ? null : v })}>
                <SelectTrigger className="h-8 w-44 text-xs">
                  <SelectValue placeholder="Vincular área..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>— Nenhuma —</SelectItem>
                  {areas.map((a: any) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportCSV}
              >
                <FileSpreadsheet className="h-3.5 w-3.5 mr-1" /> CSV
              </Button>
              <Button size="sm" variant="outline" onClick={handleExportZIP}>
                <FileArchive className="h-3.5 w-3.5 mr-1" /> ZIP
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          <div className="overflow-auto flex-1">
            <table className="w-full text-xs">
              <thead className="bg-muted/20 sticky top-0">
                <tr className="text-left text-muted-foreground border-b">
                  <th className="w-8 px-2 py-2"></th>
                  <th className="px-2 py-2 font-medium w-24">Data</th>
                  <th className="px-2 py-2 font-medium">Título / Tipo</th>
                  <th className="px-2 py-2 font-medium w-32">Área</th>
                  <th className="px-2 py-2 font-medium w-28">Responsável</th>
                  <th className="px-2 py-2 font-medium w-24">Status</th>
                  <th className="px-2 py-2 font-medium w-20">Mídia</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-muted-foreground">
                      {isLoading ? "Carregando..." : "Nenhum registro encontrado."}
                    </td>
                  </tr>
                )}
                {filtered.map((e) => {
                  const isSel = selected.has(e.id);
                  const isDetail = detailId === e.id;
                  const photos = (e.attachments || []).filter((a) => a.kind === "photo").length;
                  const audios = (e.attachments || []).filter((a) => a.kind === "audio").length;
                  const videos = (e.attachments || []).filter((a) => a.kind === "video").length;
                  const statusCfg = STATUS.find((s) => s.value === e.status);
                  return (
                    <tr
                      key={e.id}
                      className={cn(
                        "border-b cursor-pointer hover:bg-muted/30 transition-colors",
                        isDetail && "bg-brand-leaf/10",
                        !e.reviewed && "bg-brand-sun/5",
                      )}
                      onClick={() => setDetailId(e.id)}
                    >
                      <td className="px-2 py-2" onClick={(ev) => ev.stopPropagation()}>
                        <Checkbox checked={isSel} onCheckedChange={() => toggleSel(e.id)} />
                      </td>
                      <td className="px-2 py-2 text-muted-foreground whitespace-nowrap">
                        {new Date(e.entry_date).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-2 py-2 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {e.is_important && <Star className="h-3 w-3 fill-brand-sun text-brand-sun shrink-0" />}
                          <span className="font-medium text-brand-forest truncate">
                            {e.title || "(sem título)"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                          <span className="px-1.5 py-0.5 rounded bg-brand-leaf/10 text-brand-leaf">
                            {TIPOS.find((t) => t.value === e.entry_type)?.label || e.entry_type}
                          </span>
                          {e.tags?.slice(0, 2).map((t) => (
                            <span key={t} className="px-1.5 py-0.5 rounded bg-muted">
                              #{t}
                            </span>
                          ))}
                          {!e.reviewed && (
                            <span className="text-[9px] uppercase tracking-wider text-[hsl(38_95%_38%)] font-semibold">
                              novo
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-2 text-muted-foreground truncate">
                        {areaName(e.area_id) || "—"}
                      </td>
                      <td className="px-2 py-2">
                        {e.responsavel_id ? (
                          <ResponsavelBadge responsavelId={e.responsavel_id} size="xs" />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-2 py-2">
                        <span
                          className={cn(
                            "px-1.5 py-0.5 rounded text-[10px] font-medium",
                            statusCfg?.tone || "bg-muted",
                          )}
                        >
                          {statusCfg?.label || e.status}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-muted-foreground">
                        <div className="flex items-center gap-1.5 text-[10px]">
                          {photos > 0 && (
                            <span className="inline-flex items-center gap-0.5">
                              <ImageIcon className="h-3 w-3" />
                              {photos}
                            </span>
                          )}
                          {audios > 0 && (
                            <span className="inline-flex items-center gap-0.5">
                              <Mic className="h-3 w-3" />
                              {audios}
                            </span>
                          )}
                          {videos > 0 && (
                            <span className="inline-flex items-center gap-0.5">
                              <PlayCircle className="h-3 w-3" />
                              {videos}
                            </span>
                          )}
                          {e.latitude != null && <MapPin className="h-3 w-3" />}
                        </div>
                      </td>
                      <td className="px-2 py-2 text-muted-foreground">
                        <ChevronRight className="h-3.5 w-3.5" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Detail panel */}
        <aside className="lg:sticky lg:top-2 self-start">
          {detail ? (
            <DetailPanel
              key={detail.id}
              entry={detail}
              areaName={areaName}
              cycleName={cycleName}
              responsavelName={responsavelName}
              areas={areas}
              cycles={cycles}
              responsaveis={responsaveis}
              onClose={() => setDetailId(null)}
              onSave={(patch) => update.mutate({ id: detail.id, ...patch })}
              onMarkReviewed={(reviewed) => markReviewed.mutate({ id: detail.id, reviewed })}
              onConvertToTask={() => convertToTask.mutate(detail)}
              onConvertToExpense={() => handleConvertToExpense(detail)}
              onDelete={() => {
                if (confirm("Excluir este registro?")) {
                  remove.mutate(detail.id);
                  setDetailId(null);
                }
              }}
            />
          ) : (
            <div className="rounded-xl border bg-card p-6 text-center text-xs text-muted-foreground">
              Selecione um registro à esquerda para ver os detalhes, editar e gerenciar mídias.
            </div>
          )}
        </aside>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {selected.size} registro(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso vai apagar os registros e as mídias vinculadas. Não pode ser desfeito.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={runBulkDelete}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Kpi({
  label,
  value,
  tone,
  active,
  onClick,
}: {
  label: string;
  value: number;
  tone?: "sun" | "leaf" | "rose";
  active?: boolean;
  onClick?: () => void;
}) {
  const toneCls =
    tone === "sun"
      ? "text-[hsl(38_95%_38%)]"
      : tone === "leaf"
      ? "text-brand-leaf"
      : tone === "rose"
      ? "text-[hsl(15_55%_45%)]"
      : "text-brand-forest";
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-xl border bg-card p-3 text-left transition hover:border-brand-leaf/50",
        active && "ring-2 ring-brand-leaf border-brand-leaf",
      )}
    >
      <div className={cn("text-2xl font-display font-semibold", toneCls)}>{value}</div>
      <div className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</div>
    </button>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 text-xs mt-1">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function FilterSelectNullable({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  return (
    <div>
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
      <Select value={value || NONE} onValueChange={(v) => onChange(v === NONE ? "" : v)}>
        <SelectTrigger className="h-8 text-xs mt-1">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>{placeholder}</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ToggleRow({
  checked,
  onChange,
  children,
  icon,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition",
        checked
          ? "bg-brand-leaf/10 text-brand-forest font-medium"
          : "text-muted-foreground hover:bg-muted/50",
      )}
    >
      <Checkbox checked={checked} className="pointer-events-none" />
      {icon}
      <span>{children}</span>
    </button>
  );
}

// ============================================================
// Detail panel
// ============================================================

interface DetailProps {
  entry: JournalEntry;
  areaName: (id: string | null) => string;
  cycleName: (id: string | null) => string;
  responsavelName: (id: string | null) => string;
  areas: any[];
  cycles: any[];
  responsaveis: any[];
  onClose: () => void;
  onSave: (patch: Partial<JournalEntryInsert>) => void;
  onMarkReviewed: (reviewed: boolean) => void;
  onConvertToTask: () => void;
  onConvertToExpense: () => void;
  onDelete: () => void;
}

function DetailPanel({
  entry,
  areaName,
  cycleName,
  responsavelName,
  areas,
  cycles,
  responsaveis,
  onClose,
  onSave,
  onMarkReviewed,
  onConvertToTask,
  onConvertToExpense,
  onDelete,
}: DetailProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(entry.title || "");
  const [description, setDescription] = useState(entry.description || "");
  const [notes, setNotes] = useState(entry.notes || "");
  const [tagsText, setTagsText] = useState((entry.tags || []).join(", "));

  const photos = (entry.attachments || []).filter((a) => a.kind === "photo");
  const audios = (entry.attachments || []).filter((a) => a.kind === "audio");
  const videos = (entry.attachments || []).filter((a) => a.kind === "video");

  const [lightbox, setLightbox] = useState<string | null>(null);

  const saveText = () => {
    const tags = tagsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    onSave({
      title: title.trim() || null,
      description: description.trim() || null,
      notes: notes.trim() || null,
      tags,
    });
    setEditing(false);
    toast.success("Registro atualizado");
  };

  const updateField = (patch: Partial<JournalEntryInsert>) => {
    onSave(patch);
  };

  return (
    <div className="rounded-xl border bg-card flex flex-col max-h-[calc(100vh-2rem)]">
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/20">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>{new Date(entry.entry_date).toLocaleDateString("pt-BR")}</span>
          <span className="px-1.5 py-0.5 rounded bg-brand-leaf/15 text-brand-leaf font-medium">
            {TIPOS.find((t) => t.value === entry.entry_type)?.label || entry.entry_type}
          </span>
          {entry.is_important && <Star className="h-3 w-3 fill-brand-sun text-brand-sun" />}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => updateField({ is_important: !entry.is_important })}
            title="Marcar importante"
            className={cn(
              "h-7 w-7 rounded-md flex items-center justify-center hover:bg-muted",
              entry.is_important && "text-brand-sun",
            )}
          >
            <Star className={cn("h-3.5 w-3.5", entry.is_important && "fill-brand-sun")} />
          </button>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-muted text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="overflow-auto flex-1 p-3 space-y-3">
        {/* Texto */}
        {editing ? (
          <div className="space-y-2">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" />
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Descrição"
            />
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Observações"
            />
            <Input
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="tags, separadas, por vírgula"
            />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
              <Button size="sm" onClick={saveText}>
                <Save className="h-3.5 w-3.5 mr-1" /> Salvar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-display text-base font-semibold text-brand-forest leading-tight">
                {entry.title || "(sem título)"}
              </h2>
              <button
                onClick={() => setEditing(true)}
                className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-muted text-muted-foreground shrink-0"
                title="Editar texto"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
            {entry.description && (
              <p className="text-sm whitespace-pre-wrap text-foreground/90">{entry.description}</p>
            )}
            {entry.notes && (
              <div className="text-xs italic text-muted-foreground border-l-2 border-border pl-2">
                {entry.notes}
              </div>
            )}
            {entry.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {entry.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Mídias */}
        {photos.length > 0 && (
          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Fotos ({photos.length})
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {photos.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setLightbox(p.url || null)}
                  className="aspect-square rounded-md overflow-hidden bg-muted border hover:ring-2 hover:ring-brand-leaf transition"
                >
                  <img src={p.url} alt="" loading="lazy" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
        {audios.length > 0 && (
          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Áudios
            </div>
            {audios.map((a) => (
              <audio key={a.id} src={a.url} controls className="w-full h-8" />
            ))}
          </div>
        )}
        {videos.length > 0 && (
          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Vídeos
            </div>
            {videos.map((v) => (
              <video key={v.id} src={v.url} controls className="w-full max-h-48 rounded-md bg-black" />
            ))}
          </div>
        )}

        {/* Vínculos editáveis */}
        <div className="rounded-lg border bg-muted/20 p-2.5 space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            Vínculos
          </div>
          <FieldSelect
            label="Área"
            value={entry.area_id}
            onChange={(v) => updateField({ area_id: v })}
            options={areas.map((a: any) => ({ value: a.id, label: a.nome }))}
          />
          <FieldSelect
            label="Ciclo"
            value={entry.cycle_id}
            onChange={(v) => updateField({ cycle_id: v })}
            options={cycles.map((c: any) => ({
              value: c.id,
              label: `${c.cultura || "Ciclo"}${c.areas?.nome ? ` · ${c.areas.nome}` : ""}`,
            }))}
          />
          <FieldSelect
            label="Responsável"
            value={entry.responsavel_id}
            onChange={(v) => updateField({ responsavel_id: v })}
            options={responsaveis.map((r: any) => ({ value: r.id, label: r.nome }))}
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px] text-muted-foreground">Tipo</Label>
              <Select
                value={entry.entry_type}
                onValueChange={(v) => updateField({ entry_type: v })}
              >
                <SelectTrigger className="h-7 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">Status</Label>
              <Select value={entry.status} onValueChange={(v) => updateField({ status: v })}>
                <SelectTrigger className="h-7 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* GPS */}
        {entry.latitude != null && entry.longitude != null && (
          <a
            href={`https://www.google.com/maps?q=${entry.latitude},${entry.longitude}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between rounded-lg border bg-muted/20 p-2 text-xs hover:bg-muted/40"
          >
            <span className="flex items-center gap-1.5 text-brand-leaf">
              <MapPin className="h-3.5 w-3.5" />
              {entry.latitude.toFixed(5)}, {entry.longitude.toFixed(5)}
            </span>
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </a>
        )}

        {/* Histórico */}
        <div className="text-[10px] text-muted-foreground border-t pt-2 space-y-0.5">
          <div>Criado em {new Date(entry.created_at).toLocaleString("pt-BR")}</div>
          <div>Atualizado em {new Date(entry.updated_at).toLocaleString("pt-BR")}</div>
        </div>
      </div>

      {/* Actions footer */}
      <div className="border-t p-2 grid grid-cols-2 gap-1.5 bg-muted/10">
        <Button
          size="sm"
          variant={entry.reviewed ? "outline" : "default"}
          className={!entry.reviewed ? "bg-brand-forest hover:bg-brand-forest/90" : ""}
          onClick={() => onMarkReviewed(!entry.reviewed)}
        >
          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
          {entry.reviewed ? "Reabrir" : "Revisar"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => downloadEntryZip(entry, { areaName, cycleName, responsavelName })}>
          <Download className="h-3.5 w-3.5 mr-1" /> Baixar ZIP
        </Button>
        <Button size="sm" variant="outline" onClick={onConvertToTask}>
          <ListChecks className="h-3.5 w-3.5 mr-1" /> Tarefa
        </Button>
        <Button size="sm" variant="outline" onClick={onConvertToExpense}>
          <Receipt className="h-3.5 w-3.5 mr-1" /> Despesa
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="col-span-2 text-destructive hover:bg-destructive/10"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir registro
        </Button>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="" className="max-w-full max-h-full object-contain" />
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}

function FieldSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <Label className="text-[10px] text-muted-foreground">{label}</Label>
      <Select
        value={value || NONE}
        onValueChange={(v) => onChange(v === NONE ? null : v)}
      >
        <SelectTrigger className="h-7 text-xs mt-1">
          <SelectValue placeholder="—" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>— Nenhum —</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
