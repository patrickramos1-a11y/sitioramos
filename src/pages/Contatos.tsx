import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  Users,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
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
  useContatos,
  Contato,
  contatoCategoriaLabels,
} from "@/hooks/useContatos";
import { ContatoForm } from "@/components/contatos/ContatoForm";
import { ColumnFilter } from "@/components/caixa/ColumnFilter";

const categoriaBadgeColor: Record<string, string> = {
  fornecedor: "bg-blue-100 text-blue-700",
  cliente: "bg-green-100 text-green-700",
  prestador: "bg-purple-100 text-purple-700",
  funcionario: "bg-amber-100 text-amber-700",
  outro: "bg-muted text-muted-foreground",
};

export default function Contatos() {
  const { contatos, isLoading, createContato, updateContato, deleteContato } =
    useContatos();
  const [search, setSearch] = useState("");
  const [catSel, setCatSel] = useState<string[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Contato | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Contato | null>(null);

  const filtered = useMemo(() => {
    let list = contatos;
    if (catSel.length)
      list = list.filter((c) => catSel.includes(c.categoria));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.nome.toLowerCase().includes(q) ||
          c.telefone?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [contatos, catSel, search]);

  const categoriaOptions = Object.entries(contatoCategoriaLabels).map(
    ([value, label]) => ({ value, label }),
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Contatos</h1>
            <p className="text-muted-foreground">
              Cadastro de fornecedores, clientes, prestadores e funcionários
            </p>
          </div>
          <Button
            className="gap-2"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Novo Contato
          </Button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, telefone, email..."
              className="pl-9 h-9"
            />
          </div>
          <Badge variant="secondary">
            {filtered.length} de {contatos.length}
          </Badge>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                Carregando...
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-muted p-4 mb-3">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium">Nenhum contato</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Cadastre seu primeiro contato.
                </p>
                <Button
                  onClick={() => {
                    setEditing(null);
                    setFormOpen(true);
                  }}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Novo Contato
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>
                      Categoria
                      <ColumnFilter
                        options={categoriaOptions}
                        selected={catSel}
                        onChange={setCatSel}
                      />
                    </TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.nome}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={categoriaBadgeColor[c.categoria]}
                        >
                          {contatoCategoriaLabels[c.categoria]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {c.telefone ? (
                          <span className="flex items-center gap-1.5 text-sm">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                            {c.telefone}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {c.email ? (
                          <span className="flex items-center gap-1.5 text-sm">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            {c.email}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[240px] truncate">
                        {c.endereco ? (
                          <span className="flex items-center gap-1.5 text-sm">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            {c.endereco}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditing(c);
                                setFormOpen(true);
                              }}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setConfirmDelete(c)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <ContatoForm
          open={formOpen}
          onOpenChange={(o) => {
            setFormOpen(o);
            if (!o) setEditing(null);
          }}
          contato={editing}
          onSubmit={(data) => {
            if (editing) {
              updateContato.mutate(
                { ...data, id: editing.id },
                {
                  onSuccess: () => {
                    setFormOpen(false);
                    setEditing(null);
                  },
                },
              );
            } else {
              createContato.mutate(data, {
                onSuccess: () => setFormOpen(false),
              });
            }
          }}
          isSubmitting={createContato.isPending || updateContato.isPending}
        />

        <AlertDialog
          open={!!confirmDelete}
          onOpenChange={(o) => !o && setConfirmDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir contato?</AlertDialogTitle>
              <AlertDialogDescription>
                O contato "{confirmDelete?.nome}" será removido. As
                movimentações vinculadas continuarão existindo, mas sem o
                vínculo.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (confirmDelete) {
                    deleteContato.mutate(confirmDelete.id);
                    setConfirmDelete(null);
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
