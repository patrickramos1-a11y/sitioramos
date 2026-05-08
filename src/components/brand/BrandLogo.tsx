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
  if (variant === "mono") return <BrandMonogram className={className} alt={alt} />;
  const src = variant === "selo" ? logoSelo : logoFull;
  return <img src={src} alt={alt} className={cn("object-contain select-none", className)} draggable={false} />;
}

/** Monograma — usa o selo oficial Sítio Ramos */
export function BrandMonogram({ className, alt = "Sítio Ramos" }: { className?: string; alt?: string }) {
  return (
    <img
      src={logoSelo}
      alt={alt}
      className={cn("object-contain select-none", className)}
      draggable={false}
    />
  );
}
