import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import type { CondominioComComprovante } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Calendar, DollarSign, CheckCircle2, XCircle, Building, Trash, Edit, Upload } from "lucide-react";
import { FileUpload } from "@/components/file-upload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/confirm-dialog";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function Condominios() {
  const { isProprietario } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCondominio, setEditingCondominio] = useState<CondominioComComprovante | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedCondominioId, setSelectedCondominioId] = useState<number | null>(null);
  const [newComprovanteFile, setNewComprovanteFile] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear(),
    valor: "",
  });

  const { data: condominios, isLoading } = useQuery<CondominioComComprovante[]>({
    queryKey: ["/api/condominios"],
  });

  const createMutation = useMutation({
    mutationFn: (data: { mes: number; ano: number; valor: string }) => 
      apiRequest("POST", "/api/condominios", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/condominios"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Condomínio criado com sucesso" });
      setDialogOpen(false);
      setFormData({
        mes: new Date().getMonth() + 1,
        ano: new Date().getFullYear(),
        valor: "",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar condomínio",
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
      return apiRequest("PATCH", `/api/condominios/${id}`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/condominios"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/condominios/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/condominios"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Condomínio excluído com sucesso" });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir condomínio",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const uploadComprovanteMutation = useMutation({
    mutationFn: async ({ id, comprovante }: { id: number; comprovante: File }) => {
      const formData = new FormData();
      formData.append("comprovante", comprovante);
      const condominio = condominios?.find(c => c.id === id);
      const endpoint = condominio?.comprovante?.id 
        ? `/api/condominios/${id}/comprovante` 
        : `/api/condominios/${id}/comprovante`;
      const method = condominio?.comprovante?.id ? "PUT" : "POST";
      return apiRequest(method, endpoint, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/condominios"] });
      toast({ title: "Comprovante anexado com sucesso" });
      setUploadDialogOpen(false);
      setNewComprovanteFile([]);
      setSelectedCondominioId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao anexar comprovante",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeComprovanteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/condominios/${id}/comprovante`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/condominios"] });
      toast({ title: "Comprovante removido com sucesso" });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover comprovante",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUploadComprovante = () => {
    if (selectedCondominioId && newComprovanteFile[0]) {
      uploadComprovanteMutation.mutate({
        id: selectedCondominioId,
        comprovante: newComprovanteFile[0],
      });
    }
  };

  const handleOpenUploadDialog = (condominioId: number) => {
    setSelectedCondominioId(condominioId);
    setNewComprovanteFile([]);
    setUploadDialogOpen(true);
  };

  const handleOpenDialog = (condominio?: CondominioComComprovante) => {
    if (condominio) {
      setEditingCondominio(condominio);
      setFormData({
        mes: condominio.mes,
        ano: condominio.ano,
        valor: condominio.valor,
      });
    } else {
      setEditingCondominio(null);
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
          <h1 className="text-2xl font-bold">Condomínio</h1>
          <p className="text-muted-foreground">Controle mensal de taxas de condomínio</p>
        </div>
        {isProprietario && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => handleOpenDialog()}
                data-testid="button-new-condominio"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Condomínio
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="dialog-condominio-form">
              <DialogHeader>
                <DialogTitle>{editingCondominio ? "Editar Condomínio" : "Novo Condomínio"}</DialogTitle>
                <DialogDescription>
                  Preencha os dados do condomínio mensal
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

      {!condominios || condominios.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Nenhum condomínio cadastrado</p>
            <p className="text-sm text-muted-foreground mb-6">
              Comece adicionando registros de condomínio
            </p>
            {isProprietario && (
              <Button
                onClick={() => handleOpenDialog()}
                data-testid="button-new-condominio-empty"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Primeiro Condomínio
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {condominios.map((condominio) => (
            <Card
              key={condominio.id}
              className={condominio.status === 'pago' ? "border-primary/30" : ""}
              data-testid={`card-condominio-${condominio.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">
                    {MESES[condominio.mes - 1]} / {condominio.ano}
                  </CardTitle>
                  {isProprietario && condominio.status === 'pendente' && (
                    <ConfirmDialog
                      trigger={
                        <Button
                          variant="ghost"
                          size="icon"
                          data-testid={`button-delete-condominio-${condominio.id}`}
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      }
                      title="Confirmar exclusão"
                      description={`Deseja realmente excluir o condomínio de ${MESES[condominio.mes - 1]}/${condominio.ano}?`}
                      confirmText="Excluir"
                      onConfirm={() => deleteMutation.mutate(condominio.id)}
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
                    <span className="text-sm font-medium" data-testid={`text-periodo-${condominio.id}`}>
                      {condominio.mes}/{condominio.ano}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Valor</span>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span className="text-lg font-mono font-bold" data-testid={`text-valor-${condominio.id}`}>
                      R$ {parseFloat(condominio.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {condominio.pago_em && (
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    Pago em: {new Date(condominio.pago_em).toLocaleDateString("pt-BR")}
                  </div>
                )}

                <div className="pt-3 border-t space-y-2">
                  <PaymentStatusControl
                    recordId={condominio.id}
                    currentStatus={condominio.status as 'pendente' | 'pagamento_informado' | 'pago'}
                    hasComprovante={!!condominio.comprovante?.id}
                    onStatusChange={async (newStatus, comprovante) => {
                      const formData = new FormData();
                      formData.append('status', newStatus);
                      if (comprovante) {
                        formData.append('comprovante', comprovante);
                      }
                      await updateMutation.mutateAsync({
                        id: condominio.id,
                        status: newStatus,
                        comprovante,
                      });
                    }}
                    isLoading={updateMutation.isPending}
                  />
                  
                  <div className="flex gap-2 flex-wrap">
                    {condominio.comprovante?.id && (
                      <FileViewer
                        fileId={condominio.comprovante.id}
                        nomeOriginal={condominio.comprovante.nome_original}
                        mime={condominio.comprovante.mime}
                        label="Ver Comprovante"
                        title="Comprovante de Pagamento"
                      />
                    )}
                    
                    {isProprietario && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenUploadDialog(condominio.id)}
                          disabled={uploadComprovanteMutation.isPending}
                          data-testid={`button-upload-comprovante-${condominio.id}`}
                        >
                          <Upload className="w-3 h-3 mr-1" />
                          {condominio.comprovante?.id ? "Substituir" : "Anexar"} Comprovante
                        </Button>
                        
                        {condominio.comprovante?.id && (
                          <ConfirmDialog
                            trigger={
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={removeComprovanteMutation.isPending}
                                data-testid={`button-remover-comprovante-${condominio.id}`}
                              >
                                <Trash className="w-3 h-3 mr-1" />
                                Remover Comprovante
                              </Button>
                            }
                            title="Confirmar remoção"
                            description="Tem certeza que deseja remover o comprovante? Esta ação não pode ser desfeita."
                            confirmText="Remover"
                            variant="destructive"
                            onConfirm={() => removeComprovanteMutation.mutate(condominio.id)}
                            disabled={removeComprovanteMutation.isPending}
                          />
                        )}
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anexar Comprovante</DialogTitle>
            <DialogDescription>
              Envie o comprovante de pagamento deste condomínio
            </DialogDescription>
          </DialogHeader>

          <FileUpload
            maxFiles={1}
            maxSizeMB={2}
            accept={["pdf", "jpg", "jpeg", "png"]}
            onFilesChange={setNewComprovanteFile}
            label="Comprovante *"
            hint="PDF ou imagem, máx 2MB"
          />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUploadDialogOpen(false)}
              disabled={uploadComprovanteMutation.isPending}
              data-testid="button-cancel-comprovante"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUploadComprovante}
              disabled={newComprovanteFile.length === 0 || uploadComprovanteMutation.isPending}
              data-testid="button-enviar-comprovante"
            >
              {uploadComprovanteMutation.isPending ? "Enviando..." : "Enviar Comprovante"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
