import { useState } from "react";
import { 
  LayoutDashboard, 
  MapPin, 
  DollarSign, 
  TrendingUp, 
  Landmark,
  Wallet,
  ChevronDown,
  FileText,
  Home,
  ClipboardList,
  Users
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { BrandLogo } from "@/components/brand/BrandLogo";

const navigationItems = [
  {
    title: "Visão Geral",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Propriedade",
    url: "/propriedade",
    icon: Home,
  },
  {
    title: "Áreas",
    url: "/areas",
    icon: MapPin,
  },
  {
    title: "Operação",
    url: "/operacao",
    icon: ClipboardList,
  },
];

const caixaSubmenu = [
  { title: "Todas as Movimentações", url: "/caixa" },
  { title: "Lançamentos", url: "/lancamentos" },
  { title: "Custos", url: "/caixa?tab=custos" },
  { title: "Implantação", url: "/caixa?tab=investimentos" },
  { title: "Receitas", url: "/caixa?tab=receitas" },
];

export function AppSidebar() {
  const location = useLocation();
  const isCaixaActive = location.pathname === "/caixa" || location.pathname === "/lancamentos";
  const [caixaOpen, setCaixaOpen] = useState(isCaixaActive);

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border bg-gradient-forest p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl overflow-hidden bg-brand-paper shadow-sun shrink-0">
            <BrandLogo variant="mono" className="h-8 w-8" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-lg font-semibold text-sidebar-foreground leading-tight truncate">Sítio Ramos</h1>
            <p className="text-[10px] uppercase tracking-[0.18em] text-brand-sun/90 leading-tight">Onde a terra produz futuro</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Simple navigation items */}
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                  >
                    <NavLink to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* Caixa with submenu */}
              <Collapsible
                open={caixaOpen}
                onOpenChange={setCaixaOpen}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton isActive={isCaixaActive}>
                      <Wallet className="h-4 w-4" />
                      <span>Fluxo de Caixa</span>
                      <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {caixaSubmenu.map((subItem) => {
                        const isSubActive = location.pathname + location.search === subItem.url ||
                          (subItem.url === "/caixa" && location.pathname === "/caixa" && !location.search);
                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild isActive={isSubActive}>
                              <NavLink to={subItem.url}>
                                {subItem.title === "Custos" && <DollarSign className="h-3 w-3 mr-1" />}
                                {subItem.title === "Investimentos" && <FileText className="h-3 w-3 mr-1" />}
                                {subItem.title === "Receitas" && <TrendingUp className="h-3 w-3 mr-1" />}
                                <span>{subItem.title}</span>
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* Empréstimos */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === "/emprestimos"}
                >
                  <NavLink to="/emprestimos">
                    <Landmark className="h-4 w-4" />
                    <span>Empréstimos</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Contatos */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === "/contatos"}
                >
                  <NavLink to="/contatos">
                    <Users className="h-4 w-4" />
                    <span>Contatos</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
