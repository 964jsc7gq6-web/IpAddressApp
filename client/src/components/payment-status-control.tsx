import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileUpload } from "@/components/file-upload";
import { CheckCircle2, Upload, XCircle } from "lucide-react";

type PaymentStatus = 'pendente' | 'pagamento_informado' | 'pago';

interface PaymentStatusControlProps {
  recordId: number;
  currentStatus: PaymentStatus;
  onStatusChange: (newStatus: PaymentStatus, comprovante?: File) => void;
  isLoading?: boolean;
}

export function PaymentStatusControl({
  recordId,
  currentStatus,
  onStatusChange,
  isLoading = false,
}: PaymentStatusControlProps) {
  const { isProprietario } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [comprovanteFile, setComprovanteFile] = useState<File[]>([]);

  const handleInformarPagamento = () => {
    if (comprovanteFile.length === 0) {
      return;
    }
    onStatusChange('pagamento_informado', comprovanteFile[0]);
    setDialogOpen(false);
    setComprovanteFile([]);
  };

  const handleMarcarPago = () => {
    onStatusChange('pago');
  };

  const handleReverter = () => {
    if (currentStatus === 'pago') {
      onStatusChange('pagamento_informado');
    } else if (currentStatus === 'pagamento_informado') {
      onStatusChange('pendente');
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
              <Button
                size="sm"
                onClick={handleMarcarPago}
                disabled={isLoading}
                data-testid={`button-marcar-pago-${recordId}`}
              >
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Marcar como Pago
              </Button>
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
