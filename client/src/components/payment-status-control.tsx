import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { FileUpload } from "@/components/file-upload";
import { CheckCircle2, Upload, XCircle } from "lucide-react";

type PaymentStatus = 'pendente' | 'pagamento_informado' | 'pago';

interface PaymentStatusControlProps {
  recordId: number;
  currentStatus: PaymentStatus;
  onStatusChange: (newStatus: PaymentStatus, comprovante?: File) => Promise<void>;
  isLoading?: boolean;
}

export function PaymentStatusControl({
  recordId,
  currentStatus,
  onStatusChange,
  isLoading = false,
}: PaymentStatusControlProps) {
  const { isProprietario } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [comprovanteFile, setComprovanteFile] = useState<File[]>([]);

  const handleInformarPagamento = async () => {
    if (comprovanteFile.length === 0) {
      return;
    }
    try {
      await onStatusChange('pagamento_informado', comprovanteFile[0]);
      setDialogOpen(false);
      setComprovanteFile([]);
      toast({
        title: "Pagamento informado",
        description: "Comprovante enviado com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao informar pagamento",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    }
  };

  const handleMarcarPago = async () => {
    try {
      await onStatusChange('pago');
      toast({
        title: "Pagamento confirmado",
        description: "Registro marcado como pago",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao marcar como pago",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    }
  };

  const handleReverter = async () => {
    try {
      if (currentStatus === 'pago') {
        await onStatusChange('pagamento_informado');
      } else if (currentStatus === 'pagamento_informado') {
        await onStatusChange('pendente');
      }
      toast({
        title: "Status revertido",
        description: "Operação realizada com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao reverter status",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = () => {
    switch (currentStatus) {
      case 'pago':
        return (
          <Badge variant="default" className="flex items-center gap-1" data-testid={`badge-status-${recordId}`}>
            <CheckCircle2 className="w-3 h-3" />
            Pago
          </Badge>
        );
      case 'pagamento_informado':
        return (
          <Badge variant="secondary" className="flex items-center gap-1" data-testid={`badge-status-${recordId}`}>
            <Upload className="w-3 h-3" />
            Pagamento Informado
          </Badge>
        );
      default:
        return (
          <Badge variant="destructive" className="flex items-center gap-1" data-testid={`badge-status-${recordId}`}>
            <XCircle className="w-3 h-3" />
            Pendente
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {getStatusBadge()}
      </div>

      <div className="flex gap-2 flex-wrap">
        {/* Comprador: Pode informar pagamento se status = pendente */}
        {!isProprietario && currentStatus === 'pendente' && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDialogOpen(true)}
              disabled={isLoading}
              data-testid={`button-informar-pagamento-${recordId}`}
            >
              <Upload className="w-3 h-3 mr-1" />
              Informar Pagamento
            </Button>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Informar Pagamento</DialogTitle>
                  <DialogDescription>
                    Envie o comprovante de pagamento
                  </DialogDescription>
                </DialogHeader>

                <FileUpload
                  maxFiles={1}
                  maxSizeMB={2}
                  accept={["pdf", "jpg", "jpeg", "png"]}
                  onFilesChange={setComprovanteFile}
                  label="Comprovante *"
                  hint="PDF ou imagem, máx 2MB"
                />

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    disabled={isLoading}
                    data-testid="button-cancel-comprovante"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleInformarPagamento}
                    disabled={comprovanteFile.length === 0 || isLoading}
                    data-testid="button-enviar-comprovante"
                  >
                    {isLoading ? "Enviando..." : "Enviar Comprovante"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}

        {/* Proprietário: Pode marcar como pago ou reverter */}
        {isProprietario && (
          <>
            {(currentStatus === 'pendente' || currentStatus === 'pagamento_informado') && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    disabled={isLoading}
                    data-testid={`button-marcar-pago-${recordId}`}
                  >
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Marcar como Pago
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent data-testid="alert-confirmar-pago">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar Pagamento</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja marcar este registro como pago? Esta ação confirmará que o pagamento foi recebido.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel data-testid="button-cancelar-confirmar-pago">
                      Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleMarcarPago}
                      data-testid="button-confirmar-pago"
                    >
                      Confirmar Pagamento
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {currentStatus !== 'pendente' && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleReverter}
                disabled={isLoading}
                data-testid={`button-reverter-${recordId}`}
              >
                Reverter Status
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
