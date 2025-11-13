import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import type { Aluguel } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Calendar, DollarSign, CheckCircle2, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function Alugueis() {
  const { isProprietario } = useAuth();
  const { toast } = useToast();

  const { data: alugueis, isLoading } = useQuery<Aluguel[]>({
    queryKey: ["/api/alugueis"],
  });

  const createMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/alugueis", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alugueis"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Aluguel criado com sucesso" });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar aluguel",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, pago }: { id: number; pago: boolean }) => {
      return apiRequest("PATCH", `/api/alugueis/${id}`, {
        pago: pago ? 1 : 0,
        pagoEm: pago ? new Date().toISOString() : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alugueis"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Aluguel atualizado com sucesso" });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar aluguel",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const togglePago = (aluguel: Aluguel) => {
    updateMutation.mutate({
      id: aluguel.id,
      pago: !aluguel.pago,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Aluguéis</h1>
          <p className="text-muted-foreground">Controle mensal de aluguéis do imóvel</p>
        </div>
        {isProprietario && (
          <Button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
            data-testid="button-new-aluguel"
          >
            <Plus className="w-4 h-4 mr-2" />
            {createMutation.isPending ? "Criando..." : "Novo Aluguel"}
          </Button>
        )}
      </div>

      <div className="bg-muted/50 rounded-lg p-4">
        <p className="text-sm text-muted-foreground">
          <strong>Nota:</strong> O valor do aluguel é obtido automaticamente do cadastro do imóvel.
          Mês e ano são incrementados automaticamente.
        </p>
      </div>

      {!alugueis || alugueis.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Calendar className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Nenhum aluguel cadastrado</p>
            <p className="text-sm text-muted-foreground mb-6">
              {isProprietario
                ? "Comece adicionando registros de aluguel"
                : "Nenhum aluguel disponível"}
            </p>
            {isProprietario && (
              <Button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending}
                data-testid="button-new-aluguel-empty"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Primeiro Aluguel
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {alugueis.map((aluguel) => (
            <Card
              key={aluguel.id}
              className={aluguel.pago ? "border-primary/30" : ""}
              data-testid={`card-aluguel-${aluguel.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">
                    {MESES[aluguel.mes - 1]} / {aluguel.ano}
                  </CardTitle>
                  <Badge
                    variant={aluguel.pago ? "default" : "destructive"}
                    className="flex items-center gap-1"
                    data-testid={`badge-status-${aluguel.id}`}
                  >
                    {aluguel.pago ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        Pago
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" />
                        Pendente
                      </>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Período</span>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium" data-testid={`text-periodo-${aluguel.id}`}>
                      {aluguel.mes}/{aluguel.ano}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Valor</span>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span className="text-lg font-mono font-bold" data-testid={`text-valor-${aluguel.id}`}>
                      R$ {aluguel.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {aluguel.pagoEm && (
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    Pago em: {new Date(aluguel.pagoEm).toLocaleDateString("pt-BR")}
                  </div>
                )}

                {isProprietario && (
                  <div className="pt-3 border-t">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={!!aluguel.pago}
                        onCheckedChange={() => togglePago(aluguel)}
                        data-testid={`checkbox-pago-${aluguel.id}`}
                      />
                      <span className="text-sm">Marcar como {aluguel.pago ? "pendente" : "pago"}</span>
                    </label>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
