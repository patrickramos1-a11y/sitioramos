import logoFull from "@/assets/branding/logo-sitio-ramos.png";
import logoSelo from "@/assets/branding/logo-selo.png";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  variant?: "full" | "selo" | "mono";
  className?: string;
  alt?: string;
}

/**
 * Logo oficial Sítio Ramos.
 * - full: logo horizontal com slogan (uso em login, header amplo)
 * - selo: selo completo com moldura (uso institucional, exportações)
 * - mono: ícone "R" estilizado (favicon, loading, sidebar colapsada)
 */
export function BrandLogo({ variant = "full", className, alt = "Sítio Ramos" }: BrandLogoProps) {
  if (variant === "mono") return <BrandMonogram className={className} />;
  const src = variant === "selo" ? logoSelo : logoFull;
  return <img src={src} alt={alt} className={cn("object-contain select-none", className)} draggable={false} />;
}

/** Monograma "R" — para favicon, loading, badges e marca d'água */
export function BrandMonogram({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-brand-forest", className)}
      aria-label="Sítio Ramos"
    >
      {/* Sol nascente */}
      <g opacity="0.9">
        <path d="M32 22 a14 14 0 0 1 14 14 H18 a14 14 0 0 1 14-14z" fill="hsl(var(--brand-sun))" opacity="0.85" />
        {Array.from({ length: 11 }).map((_, i) => {
          const angle = (Math.PI * (i + 1)) / 12;
          const x1 = 32 + Math.cos(angle) * 16;
          const y1 = 36 - Math.sin(angle) * 16;
          const x2 = 32 + Math.cos(angle) * 22;
          const y2 = 36 - Math.sin(angle) * 22;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="hsl(var(--brand-sun))" strokeWidth="1.4" strokeLinecap="round" />;
        })}
      </g>
      {/* R serifado */}
      <text
        x="32"
        y="50"
        textAnchor="middle"
        fontFamily="Fraunces, Cinzel, serif"
        fontWeight="700"
        fontSize="26"
        fill="currentColor"
      >
        R
      </text>
    </svg>
  );
}
