import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import type { AluguelComComprovante } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { PaymentStatusControl } from "@/components/payment-status-control";
import { FileViewer } from "@/components/file-viewer";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Calendar, DollarSign, CheckCircle2, XCircle, Edit, Trash } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/confirm-dialog";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function Alugueis() {
  const { isProprietario } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAluguel, setEditingAluguel] = useState<AluguelComComprovante | null>(null);
  const [formData, setFormData] = useState({
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear(),
    valor: "",
  });

  const { data: alugueis, isLoading } = useQuery<AluguelComComprovante[]>({
    queryKey: ["/api/alugueis"],
  });

  const createMutation = useMutation({
    mutationFn: (data: { mes: number; ano: number; valor: string }) => 
      apiRequest("POST", "/api/alugueis", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alugueis"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Aluguel criado com sucesso" });
      setDialogOpen(false);
      setFormData({
        mes: new Date().getMonth() + 1,
        ano: new Date().getFullYear(),
        valor: "",
      });
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
    mutationFn: async ({
      id,
      status,
      comprovante,
    }: {
      id: number;
      status: string;
      comprovante?: File;
    }) => {
      const formData = new FormData();
      formData.append("status", status);
      if (comprovante) {
        formData.append("comprovante", comprovante);
      }
      return apiRequest("PATCH", `/api/alugueis/${id}`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alugueis"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/alugueis/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alugueis"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Aluguel excluído com sucesso" });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir aluguel",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleOpenDialog = (aluguel?: AluguelComComprovante) => {
    if (aluguel) {
      setEditingAluguel(aluguel);
      setFormData({
        mes: aluguel.mes,
        ano: aluguel.ano,
        valor: aluguel.valor,
      });
    } else {
      setEditingAluguel(null);
      setFormData({
        mes: new Date().getMonth() + 1,
        ano: new Date().getFullYear(),
        valor: "",
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.valor || parseFloat(formData.valor) <= 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, informe um valor válido",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(formData);
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
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => handleOpenDialog()}
                data-testid="button-new-aluguel"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Aluguel
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="dialog-aluguel-form">
              <DialogHeader>
                <DialogTitle>{editingAluguel ? "Editar Aluguel" : "Novo Aluguel"}</DialogTitle>
                <DialogDescription>
                  Preencha os dados do aluguel mensal
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mes">Mês</Label>
                    <Select
                      value={formData.mes.toString()}
                      onValueChange={(value) =>
                        setFormData({ ...formData, mes: parseInt(value) })
                      }
                    >
                      <SelectTrigger id="mes" data-testid="select-mes">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MESES.map((mes, index) => (
                          <SelectItem key={index} value={(index + 1).toString()}>
                            {mes}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ano">Ano</Label>
                    <Input
                      id="ano"
                      type="number"
                      value={formData.ano}
                      onChange={(e) =>
                        setFormData({ ...formData, ano: parseInt(e.target.value) })
                      }
                      data-testid="input-ano"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valor">Valor (R$)</Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    value={formData.valor}
                    onChange={(e) =>
                      setFormData({ ...formData, valor: e.target.value })
                    }
                    placeholder="0.00"
                    data-testid="input-valor"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  data-testid="button-cancel"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending}
                  data-testid="button-save"
                >
                  {createMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!alugueis || alugueis.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Calendar className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Nenhum aluguel cadastrado</p>
            <p className="text-sm text-muted-foreground mb-6">
              Comece adicionando registros de aluguel
            </p>
            {isProprietario && (
              <Button
                onClick={() => handleOpenDialog()}
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
              className={aluguel.status === 'pago' ? "border-primary/30" : ""}
              data-testid={`card-aluguel-${aluguel.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">
                    {MESES[aluguel.mes - 1]} / {aluguel.ano}
                  </CardTitle>
                  {isProprietario && aluguel.status === 'pendente' && (
                    <ConfirmDialog
                      trigger={
                        <Button
                          variant="ghost"
                          size="icon"
                          data-testid={`button-delete-aluguel-${aluguel.id}`}
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      }
                      title="Confirmar exclusão"
                      description={`Deseja realmente excluir o aluguel de ${MESES[aluguel.mes - 1]}/${aluguel.ano}?`}
                      confirmText="Excluir"
                      onConfirm={() => deleteMutation.mutate(aluguel.id)}
                      disabled={deleteMutation.isPending}
                    />
                  )}
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
                      R$ {parseFloat(aluguel.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {aluguel.pago_em && (
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    Pago em: {new Date(aluguel.pago_em).toLocaleDateString("pt-BR")}
                  </div>
                )}

                <div className="pt-3 border-t space-y-2">
                  <PaymentStatusControl
                    recordId={aluguel.id}
                    currentStatus={aluguel.status as 'pendente' | 'pagamento_informado' | 'pago'}
                    onStatusChange={async (newStatus, comprovante) => {
                      const formData = new FormData();
                      formData.append('status', newStatus);
                      if (comprovante) {
                        formData.append('comprovante', comprovante);
                      }
                      await updateMutation.mutateAsync({
                        id: aluguel.id,
                        status: newStatus,
                        comprovante,
                      });
                    }}
                    isLoading={updateMutation.isPending}
                  />
                  
                  {aluguel.comprovante?.id && (
                    <FileViewer
                      fileId={aluguel.comprovante.id}
                      nomeOriginal={aluguel.comprovante.nome_original}
                      mime={aluguel.comprovante.mime}
                      label="Ver Comprovante"
                      title="Comprovante de Pagamento"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
