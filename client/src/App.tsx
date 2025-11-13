import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/protected-route";

import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Partes from "@/pages/partes";
import Imovel from "@/pages/imovel";
import Parcelas from "@/pages/parcelas";
import Alugueis from "@/pages/alugueis";
import Condominios from "@/pages/condominios";
import AlterarSenha from "@/pages/alterar-senha";

function AppContent() {
  const [location] = useLocation();
  const { usuario } = useAuth();

  if (location === "/login" || !usuario) {
    return <Login />;
  }

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center gap-4 border-b px-6 py-3 bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <h2 className="text-lg font-semibold">App Ipê</h2>
          </header>
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              <Switch>
                <Route path="/" component={Dashboard} />
                <Route path="/partes" component={Partes} />
                <Route path="/imovel" component={Imovel} />
                <Route path="/parcelas" component={Parcelas} />
                <Route path="/alugueis" component={Alugueis} />
                <Route path="/condominios" component={Condominios} />
                <Route path="/alterar-senha" component={AlterarSenha} />
                <Route component={NotFound} />
              </Switch>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route>
        {() => (
          <ProtectedRoute>
            <AppContent />
          </ProtectedRoute>
        )}
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
