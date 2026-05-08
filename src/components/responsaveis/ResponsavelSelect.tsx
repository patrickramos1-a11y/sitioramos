import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useResponsaveis } from "@/hooks/useResponsaveis";
import { Label } from "@/components/ui/label";

const NONE = "__none__";

interface Props {
  value: string | null | undefined;
  onChange: (id: string | null) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
}

export function ResponsavelSelect({ value, onChange, label, placeholder = "Sem responsável", className, required, disabled, helperText }: Props) {
  const { data } = useResponsaveis();

  return (
    <div className={className}>
      {label && <Label>{label}{required && " *"}</Label>}
      <Select value={value || NONE} onValueChange={(v) => onChange(v === NONE ? null : v)} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {!required && <SelectItem value={NONE}>— {placeholder} —</SelectItem>}
          {(data || []).map((r) => (
            <SelectItem key={r.id} value={r.id}>
              <span className="inline-flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full ring-1 ring-background"
                  style={{ backgroundColor: r.cor }}
                />
                {r.nome}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {helperText && <p className="text-xs text-muted-foreground mt-1">{helperText}</p>}
    </div>
  );
}
