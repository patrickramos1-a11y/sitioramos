import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Download, Upload, FileJson, AlertTriangle, CheckCircle2, Loader2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { exportAllData, downloadBackup } from "@/lib/backup/exporter";
import { parseAndValidate, runImport, type ValidationResult, type ImportReport } from "@/lib/backup/importer";
import { BACKUP_TABLES } from "@/lib/backup/schema";

const LS_LAST_EXPORT = "backup_last_export_at";

export default function Backup() {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [exportStep, setExportStep] = useState<string>("");
  const [lastExport, setLastExport] = useState<string | null>(
    localStorage.getItem(LS_LAST_EXPORT)
  );

  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [importStep, setImportStep] = useState<string>("");
  const [report, setReport] = useState<ImportReport | null>(null);
  const [fileName, setFileName] = useState<string>("");

  async function handleExport() {
    setExporting(true);
    setExportStep("Preparando...");
    try {
      const file = await exportAllData((t, i, total) => {
        setExportStep(`Lendo ${t} (${i + 1}/${total})`);
      });
      downloadBackup(file);
      const now = new Date().toISOString();
      localStorage.setItem(LS_LAST_EXPORT, now);
      setLastExport(now);
      toast({ title: "Backup exportado", description: "O download foi iniciado." });
    } catch (err: any) {
      toast({ title: "Erro ao exportar", description: err?.message, variant: "destructive" });
    } finally {
      setExporting(false);
      setExportStep("");
    }
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setReport(null);
    setValidation(null);
    if (!f) return;
    setFileName(f.name);
    const text = await f.text();
    const result = await parseAndValidate(text);
    setValidation(result);
    if (!result.ok) {
      toast({ title: "Arquivo inválido", description: result.error, variant: "destructive" });
    }
  }

  async function handleConfirmImport() {
    if (!validation?.file) return;
    setImporting(true);
    setReport(null);
    try {
      const r = await runImport(validation.file, (t, i, total) => {
        setImportStep(`Importando ${t} (${i + 1}/${total})`);
      });
      setReport(r);
      toast({
        title: "Importação concluída",
        description: `${r.totalInserted} inseridos · ${r.totalSkipped} ignorados · ${r.totalErrors} erros`,
      });
    } catch (err: any) {
      toast({ title: "Erro na importação", description: err?.message, variant: "destructive" });
    } finally {
      setImporting(false);
      setImportStep("");
    }
  }

  function copyReport() {
    if (!report) return;
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    toast({ title: "Relatório copiado" });
  }

  function downloadReport() {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `import-report-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 max-w-3xl space-y-6">
        <header>
          <h1 className="text-2xl font-bold">Backup de Dados</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Exporte os dados desta plataforma para um arquivo JSON e importe em uma cópia nova criada no Lovable.
            Esta versão não inclui anexos (fotos, áudios, vídeos).
          </p>
        </header>

        {/* EXPORT */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" /> Exportar dados
            </CardTitle>
            <CardDescription>
              Gera um arquivo .json com todos os dados estruturados ({BACKUP_TABLES.length} tabelas).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={handleExport} disabled={exporting} className="w-full sm:w-auto">
              {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              Exportar dados em JSON
            </Button>
            {exporting && <p className="text-xs text-muted-foreground">{exportStep}</p>}
            {lastExport && !exporting && (
              <p className="text-xs text-muted-foreground">
                Último backup: {new Date(lastExport).toLocaleString("pt-BR")}
              </p>
            )}
          </CardContent>
        </Card>

        {/* IMPORT */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" /> Importar dados
            </CardTitle>
            <CardDescription>
              Selecione um arquivo .json gerado por este sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input type="file" accept="application/json,.json" onChange={handleFileSelected} disabled={importing} />

            {validation && !validation.ok && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Arquivo inválido</AlertTitle>
                <AlertDescription>{validation.error}</AlertDescription>
              </Alert>
            )}

            {validation?.ok && validation.file && (
              <div className="space-y-3">
                <div className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <FileJson className="h-4 w-4" /> {fileName}
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Gerado em: {new Date(validation.file.manifest.generated_at).toLocaleString("pt-BR")}</div>
                    <div>Versão: {validation.file.manifest.backup_version}</div>
                    <div>Total: <strong>{validation.totalRows}</strong> registros</div>
                  </div>
                  <div className="flex flex-wrap gap-1 pt-2">
                    {Object.entries(validation.counts ?? {})
                      .filter(([, n]) => n > 0)
                      .map(([t, n]) => (
                        <Badge key={t} variant="secondary" className="text-xs">
                          {t}: {n}
                        </Badge>
                      ))}
                  </div>
                </div>

                {validation.alreadyImported && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Backup já importado</AlertTitle>
                    <AlertDescription>
                      Este backup parece já ter sido importado neste ambiente. Importar novamente pode duplicar dados.
                    </AlertDescription>
                  </Alert>
                )}

                {validation.envHasData && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Ambiente já possui dados</AlertTitle>
                    <AlertDescription>
                      Este ambiente já tem registros. A importação preservará dados existentes (não sobrescreve), mas pode gerar duplicidades em outras tabelas.
                    </AlertDescription>
                  </Alert>
                )}

                <Button onClick={handleConfirmImport} disabled={importing} className="w-full sm:w-auto">
                  {importing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                  Confirmar importação
                </Button>
                {importing && <p className="text-xs text-muted-foreground">{importStep}</p>}
              </div>
            )}

            {report && (
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> Relatório da importação
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div><div className="text-xs text-muted-foreground">Inseridos</div><div className="font-semibold">{report.totalInserted}</div></div>
                  <div><div className="text-xs text-muted-foreground">Ignorados</div><div className="font-semibold">{report.totalSkipped}</div></div>
                  <div><div className="text-xs text-muted-foreground">Erros</div><div className="font-semibold">{report.totalErrors}</div></div>
                </div>
                <div className="max-h-60 overflow-auto text-xs space-y-1">
                  {Object.entries(report.perTable)
                    .filter(([, s]) => s.inserted || s.skipped || s.errors.length)
                    .map(([t, s]) => (
                      <div key={t} className="flex justify-between border-b py-1">
                        <span>{t}</span>
                        <span className="text-muted-foreground">
                          +{s.inserted} · skip {s.skipped}{s.errors.length ? ` · ${s.errors.length} erros` : ""}
                        </span>
                      </div>
                    ))}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={copyReport}>
                    <Copy className="h-3 w-3 mr-1" /> Copiar
                  </Button>
                  <Button size="sm" variant="outline" onClick={downloadReport}>
                    <Download className="h-3 w-3 mr-1" /> Baixar relatório
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
