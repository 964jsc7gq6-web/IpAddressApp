import {
  Home,
  Users,
  Building2,
  CreditCard,
  Key,
  Wrench,
  LogOut,
  User,
  Lock,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Partes",
    url: "/partes",
    icon: Users,
  },
  {
    title: "Imóvel",
    url: "/imovel",
    icon: Building2,
  },
  {
    title: "Parcelas",
    url: "/parcelas",
    icon: CreditCard,
  },
  {
    title: "Aluguéis",
    url: "/alugueis",
    icon: Key,
  },
  {
    title: "Condomínio",
    url: "/condominios",
    icon: Wrench,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { usuario, logout, isProprietario } = useAuth();

  return (
    <Sidebar>
      <SidebarContent>
        <div className="p-6">
          <h1 className="text-xl font-bold text-sidebar-primary">App Ipê</h1>
          <p className="text-xs text-muted-foreground mt-1">Gestão Imobiliária</p>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      data-active={isActive}
                      className="data-[active=true]:bg-sidebar-accent"
                      data-testid={`link-${item.title.toLowerCase()}`}
                    >
                      <Link href={item.url}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="p-4 space-y-3">
          {usuario && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-sidebar-accent">
              <div className="w-10 h-10 rounded-full bg-sidebar-primary flex items-center justify-center">
                <User className="w-5 h-5 text-sidebar-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" data-testid="text-user-name">
                  {usuario.nome}
                </p>
                <Badge
                  variant={isProprietario ? "default" : "secondary"}
                  className="mt-1 text-xs"
                  data-testid="badge-user-role"
                >
                  {usuario.papel}
                </Badge>
              </div>
            </div>
          )}
          <Link href="/alterar-senha">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              data-testid="button-alterar-senha-menu"
            >
              <Lock className="w-4 h-4 mr-2" />
              Alterar Senha
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={logout}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
