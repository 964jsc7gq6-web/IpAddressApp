import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { OnboardingAssistant } from "@/components/onboarding-assistant";
import { 
  CreditCard, 
  Calendar, 
  TrendingUp, 
  DollarSign,
  CheckCircle2,
  XCircle 
} from "lucide-react";
import { Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface DashboardStats {
  totalParcelas: number;
  parcelasPagas: number;
  parcelasPendentes: number;
  valorTotalParcelas: number;
  valorPago: number;
  proximoVencimento: string | null;
  ultimas5Parcelas: Array<{
    numero: number;
    valor: number;
    vencimento: string;
    pago: boolean;
  }>;
  aluguelMesAtual: {
    mes: number;
    ano: number;
    valor: number;
    pago: boolean;
  } | null;
  condominioMesAtual: {
    mes: number;
    ano: number;
    valor: number;
    pago: boolean;
  } | null;
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const pieData = {
    labels: ["Pagas", "Pendentes"],
    datasets: [
      {
        data: [stats?.parcelasPagas || 0, stats?.parcelasPendentes || 0],
        backgroundColor: ["hsl(142, 76%, 36%)", "hsl(0, 84%, 45%)"],
        borderColor: ["hsl(142, 76%, 30%)", "hsl(0, 84%, 40%)"],
        borderWidth: 2,
      },
    ],
  };

  const barData = {
    labels: stats?.ultimas5Parcelas.map(p => `#${p.numero}`) || [],
    datasets: [
      {
        label: "Valor (R$)",
        data: stats?.ultimas5Parcelas.map(p => p.valor) || [],
        backgroundColor: stats?.ultimas5Parcelas.map(p => 
          p.pago ? "hsl(142, 76%, 36%)" : "hsl(34, 89%, 48%)"
        ) || [],
        borderColor: stats?.ultimas5Parcelas.map(p => 
          p.pago ? "hsl(142, 76%, 30%)" : "hsl(34, 89%, 42%)"
        ) || [],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          padding: 16,
          font: {
            family: "Inter",
            size: 12,
          },
        },
      },
      tooltip: {
        padding: 12,
        titleFont: {
          family: "Inter",
          size: 14,
        },
        bodyFont: {
          family: "JetBrains Mono",
          size: 13,
        },
      },
    },
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <p className="text-muted-foreground">Nenhum dado disponível</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral financeira do imóvel</p>
        </div>
        <OnboardingAssistant />
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-total-parcelas">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Parcelas</CardTitle>
            <CreditCard className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold" data-testid="text-total-parcelas">
              {stats.totalParcelas}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.parcelasPagas} pagas, {stats.parcelasPendentes} pendentes
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-valor-total">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold" data-testid="text-valor-total">
              R$ {stats.valorTotalParcelas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              R$ {stats.valorPago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} pago
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-parcelas-pagas">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Parcelas Pagas</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold text-primary" data-testid="text-parcelas-pagas">
              {stats.parcelasPagas}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalParcelas > 0 
                ? Math.round((stats.parcelasPagas / stats.totalParcelas) * 100)
                : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-proximo-vencimento">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximo Vencimento</CardTitle>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold" data-testid="text-proximo-vencimento">
              {stats.proximoVencimento
                ? new Date(stats.proximoVencimento).toLocaleDateString("pt-BR")
                : "-"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.proximoVencimento ? "Próxima data" : "Nenhum vencimento"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Parcelas Pagas vs Pendentes</CardTitle>
            <CardDescription>Distribuição do status de pagamento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]" data-testid="chart-pie">
              <Pie data={pieData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Últimas 5 Parcelas</CardTitle>
            <CardDescription>Valores das parcelas recentes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]" data-testid="chart-bar">
              <Bar data={barData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Aluguéis & Condomínio */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Aluguel do Mês Atual</CardTitle>
            <CardDescription>
              {stats.aluguelMesAtual 
                ? `${stats.aluguelMesAtual.mes}/${stats.aluguelMesAtual.ano}`
                : "Nenhum registro"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.aluguelMesAtual ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-mono font-bold" data-testid="text-aluguel-valor">
                    R$ {stats.aluguelMesAtual.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <Badge
                  variant={stats.aluguelMesAtual.pago ? "default" : "destructive"}
                  className="px-3 py-1"
                  data-testid="badge-aluguel-status"
                >
                  {stats.aluguelMesAtual.pago ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Pago
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3 mr-1" />
                      Pendente
                    </>
                  )}
                </Badge>
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhum aluguel cadastrado</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Condomínio do Mês Atual</CardTitle>
            <CardDescription>
              {stats.condominioMesAtual 
                ? `${stats.condominioMesAtual.mes}/${stats.condominioMesAtual.ano}`
                : "Nenhum registro"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.condominioMesAtual ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-mono font-bold" data-testid="text-condominio-valor">
                    R$ {stats.condominioMesAtual.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <Badge
                  variant={stats.condominioMesAtual.pago ? "default" : "destructive"}
                  className="px-3 py-1"
                  data-testid="badge-condominio-status"
                >
                  {stats.condominioMesAtual.pago ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Pago
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3 mr-1" />
                      Pendente
                    </>
                  )}
                </Badge>
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhum condomínio cadastrado</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
