// Custom minimal vector icons for the Sítio Ramos quick-action cards.
// Each accepts stroke and accentStroke colors so it adapts per card.
type IconProps = {
  stroke?: string;
  accent?: string;
  size?: number;
  className?: string;
};

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 48 48",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
});

// Muda nascendo sobre horizonte
export function SproutHorizonIcon({ stroke = "currentColor", accent = "#F5B400", size = 28, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden>
      {/* horizonte */}
      <path d="M6 34 H42" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" opacity="0.75" />
      <path d="M10 38 C20 36, 28 36, 38 38" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" opacity="0.45" />
      {/* caule */}
      <path d="M24 34 V20" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      {/* folha esquerda */}
      <path d="M24 26 C18 26, 15 22, 15 18 C20 18, 23 21, 24 26 Z" stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" />
      {/* folha direita (acento) */}
      <path d="M24 22 C30 22, 33 18, 33 14 C28 14, 25 17, 24 22 Z" stroke={accent} strokeWidth="1.8" strokeLinejoin="round" />
      {/* sol pequeno */}
      <circle cx="36" cy="12" r="2.2" fill={accent} opacity="0.9" />
    </svg>
  );
}

// Checklist de campo com folha
export function FieldChecklistIcon({ stroke = "currentColor", accent = "#1E7A34", size = 28, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden>
      {/* prancheta */}
      <rect x="11" y="10" width="26" height="30" rx="3" stroke={stroke} strokeWidth="1.8" />
      <rect x="19" y="7" width="10" height="5" rx="1.5" stroke={stroke} strokeWidth="1.8" fill="none" />
      {/* checks */}
      <path d="M16 20 l2 2 l4 -4" stroke={accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 28 l2 2 l4 -4" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
      <path d="M25 21 H33" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" opacity="0.55" />
      <path d="M25 29 H32" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" opacity="0.55" />
      {/* folha */}
      <path d="M30 34 C33 34, 35 32, 35 29 C32 29, 30 31, 30 34 Z" fill={accent} opacity="0.85" />
    </svg>
  );
}

// Recibo minimalista com grão/folha
export function ReceiptSeedIcon({ stroke = "currentColor", accent = "#0D331F", size = 28, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden>
      {/* recibo */}
      <path
        d="M14 8 H34 V40 L30 37 L26 40 L22 37 L18 40 L14 37 Z"
        stroke={stroke}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M18 16 H30" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
      <path d="M18 21 H30" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" opacity="0.55" />
      <path d="M18 26 H26" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" opacity="0.45" />
      {/* folha/grão (acento) */}
      <path
        d="M28 28 C31 28, 33 26, 33 23 C30 23, 28 25, 28 28 Z"
        fill={accent}
        opacity="0.9"
      />
      <path d="M28 28 C29 26.5, 30.5 25.5, 32 25" stroke={stroke} strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

// Caderno aberto com folha e anotação
export function FieldNotebookIcon({ stroke = "currentColor", accent = "#1E7A34", size = 28, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden>
      {/* caderno aberto */}
      <path
        d="M6 14 C12 12, 20 12, 24 16 C28 12, 36 12, 42 14 V36 C36 34, 28 34, 24 38 C20 34, 12 34, 6 36 Z"
        stroke={stroke}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M24 16 V38" stroke={stroke} strokeWidth="1.4" opacity="0.6" />
      {/* linhas de anotação */}
      <path d="M10 20 H20" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />
      <path d="M10 25 H19" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" opacity="0.45" />
      <path d="M28 20 H38" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />
      <path d="M28 25 H36" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" opacity="0.45" />
      {/* folha (acento) */}
      <path
        d="M32 30 C35 30, 37 28, 37 25 C34 25, 32 27, 32 30 Z"
        fill={accent}
        opacity="0.9"
      />
    </svg>
  );
}
