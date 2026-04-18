import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface StatCardProps {
  title: string;
  value: string;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "success" | "warning" | "destructive";
  href?: string;
}

export function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend,
  variant = "default",
  href
}: StatCardProps) {
  const navigate = useNavigate();
  
  const variantStyles = {
    default: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    destructive: "bg-destructive/10 text-destructive",
  };

  const handleClick = () => {
    if (href) {
      navigate(href);
    }
  };

  return (
    <Card 
      className={cn(
        "transition-all hover:shadow-md tap-card",
        href && "cursor-pointer hover:border-primary/50 group"
      )}
      onClick={handleClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1 md:p-6 md:pb-2">
        <CardTitle className="text-[11px] md:text-sm font-medium text-muted-foreground leading-tight">
          {title}
        </CardTitle>
        <div className="flex items-center gap-2">
          <div className={cn("rounded-lg p-1.5 md:p-2", variantStyles[variant])}>
            <Icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
          </div>
          {href && (
            <ChevronRight className="hidden md:block h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
        <div className="text-base md:text-2xl font-bold leading-tight">{value}</div>
        {description && (
          <p className="text-[10px] md:text-xs text-muted-foreground mt-1 line-clamp-2">{description}</p>
        )}
        {trend && (
          <p className={cn(
            "text-xs mt-1 font-medium",
            trend.isPositive ? "text-success" : "text-destructive"
          )}>
            {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}% em relação ao mês anterior
          </p>
        )}
      </CardContent>
    </Card>
  );
}
