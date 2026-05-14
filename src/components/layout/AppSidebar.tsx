import {
  LayoutDashboard,
  MapPin,
  Landmark,
  PieChart,
  Home,
  ClipboardList,
  Users,
  PanelLeftClose,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Button } from "@/components/ui/button";

const navigationItems = [
  { title: "Visão Geral", url: "/", icon: LayoutDashboard },
  { title: "Propriedade", url: "/propriedade", icon: Home },
  { title: "Áreas", url: "/areas", icon: MapPin },
  { title: "Operação", url: "/operacao", icon: ClipboardList },
  { title: "Financeiro", url: "/financeiro", icon: PieChart },
  { title: "Empréstimos", url: "/emprestimos", icon: Landmark },
  { title: "Contatos", url: "/contatos", icon: Users },
  { title: "Responsáveis", url: "/responsaveis", icon: Users },
];

export function AppSidebar() {
  const location = useLocation();
  const { toggleSidebar, setOpen, isMobile, setOpenMobile } = useSidebar();

  const handleNavigate = () => {
    if (isMobile) setOpenMobile(false);
    else setOpen(false);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border bg-gradient-forest p-3">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden bg-brand-paper shadow-sun shrink-0">
            <BrandLogo variant="mono" className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <h1 className="font-display text-base font-semibold text-sidebar-foreground leading-tight truncate">Sítio Ramos</h1>
            <p className="text-[10px] uppercase tracking-[0.18em] text-brand-sun/90 leading-tight truncate">Onde a terra produz futuro</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8 text-sidebar-foreground/90 hover:bg-sidebar-accent/30 group-data-[collapsible=icon]:hidden"
            aria-label="Recolher menu"
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const isActive =
                  item.url === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <NavLink to={item.url} onClick={handleNavigate}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
