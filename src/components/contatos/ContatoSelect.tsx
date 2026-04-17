import { useMemo, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useContatos, contatoCategoriaLabels } from "@/hooks/useContatos";
import { ContatoForm } from "./ContatoForm";

interface Props {
  value: string | null | undefined;
  onChange: (id: string | null) => void;
  placeholder?: string;
}

export function ContatoSelect({
  value,
  onChange,
  placeholder = "Selecionar contato...",
}: Props) {
  const { contatos, createContato } = useContatos();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  const selected = useMemo(
    () => contatos.find((c) => c.id === value) || null,
    [contatos, value],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contatos;
    return contatos.filter(
      (c) =>
        c.nome.toLowerCase().includes(q) ||
        c.telefone?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q),
    );
  }, [contatos, search]);

  const exactMatch = contatos.some(
    (c) => c.nome.toLowerCase() === search.trim().toLowerCase(),
  );

  return (
    <>
      <div className="flex gap-1">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between font-normal"
            >
              <span
                className={cn(
                  "truncate",
                  !selected && "text-muted-foreground",
                )}
              >
                {selected ? selected.nome : placeholder}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
            <Command shouldFilter={false}>
              <div className="flex items-center border-b px-2">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar contato..."
                  className="h-9 border-0 focus-visible:ring-0 shadow-none px-1"
                />
              </div>
              <CommandList>
                <CommandEmpty>
                  <div className="text-sm text-muted-foreground p-2">
                    Nenhum contato encontrado.
                  </div>
                </CommandEmpty>
                {filtered.length > 0 && (
                  <CommandGroup>
                    {filtered.map((c) => (
                      <CommandItem
                        key={c.id}
                        value={c.id}
                        onSelect={() => {
                          onChange(c.id);
                          setOpen(false);
                          setSearch("");
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === c.id ? "opacity-100" : "opacity-0",
                          )}
                        />
                        <div className="flex flex-col">
                          <span>{c.nome}</span>
                          <span className="text-xs text-muted-foreground">
                            {contatoCategoriaLabels[c.categoria]}
                            {c.telefone ? ` • ${c.telefone}` : ""}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      setOpen(false);
                      setFormOpen(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {search && !exactMatch
                      ? `Cadastrar "${search}"`
                      : "Cadastrar novo contato"}
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {selected && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onChange(null)}
            title="Remover vínculo"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <ContatoForm
        open={formOpen}
        onOpenChange={setFormOpen}
        defaultNome={search}
        onSubmit={(data) => {
          createContato.mutate(data, {
            onSuccess: (created) => {
              onChange(created.id);
              setFormOpen(false);
              setSearch("");
            },
          });
        }}
        isSubmitting={createContato.isPending}
      />
    </>
  );
}
