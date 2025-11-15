import { useState, useEffect, useRef, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileText, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileViewerProps {
  fileId: number;
  nomeOriginal?: string;
  mime?: string;
  label?: string;
  title?: string;
  triggerVariant?: "default" | "ghost" | "outline" | "secondary";
  triggerSize?: "default" | "sm" | "lg" | "icon";
  customTrigger?: ReactNode;
}

export function FileViewer({
  fileId,
  nomeOriginal,
  mime,
  label = "Ver Arquivo",
  title = "Visualizar Arquivo",
  triggerVariant = "ghost",
  triggerSize = "sm",
  customTrigger,
}: FileViewerProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const objectUrlRef = useRef<string | null>(null);
  const { toast } = useToast();
  
  const isImage = mime?.startsWith('image/');
  const isPDF = mime === 'application/pdf';
  
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    
    if (objectUrl) {
      return;
    }
    
    const fetchFile = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Token não encontrado");
        }
        
        const response = await fetch(`/api/arquivos/${fileId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (!response.ok) {
          if (response.status === 403) {
            throw new Error("Acesso negado a este arquivo");
          }
          throw new Error(`Erro ao carregar arquivo: ${response.status}`);
        }
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;
        setObjectUrl(url);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFile();
  }, [isOpen, fileId, objectUrl]);
  
  useEffect(() => {
    if (!isOpen && objectUrlRef.current) {
      const timer = setTimeout(() => {
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
          objectUrlRef.current = null;
          setObjectUrl(null);
        }
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);
  
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);
  
  const handleDownload = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Token não encontrado. Faça login novamente.",
        });
        return;
      }
      
      const response = await fetch(`/api/arquivos/${fileId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        if (response.status === 403) {
          toast({
            variant: "destructive",
            title: "Acesso negado",
            description: "Você não tem permissão para baixar este arquivo.",
          });
          return;
        }
        throw new Error(`Erro ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nomeOriginal || 'arquivo';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Sucesso",
        description: "Arquivo baixado com sucesso.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro ao baixar",
        description: err.message || "Não foi possível baixar o arquivo.",
      });
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {customTrigger || (
          <Button
            variant={triggerVariant}
            size={triggerSize}
            data-testid={`button-view-file-${fileId}`}
          >
            <FileText className="h-4 w-4 mr-2" />
            {label}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {nomeOriginal || "Arquivo anexado"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {isLoading && (
            <div className="flex justify-center items-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
          
          {error && (
            <div className="text-center p-6 border border-destructive rounded-md bg-destructive/10">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          
          {!isLoading && !error && objectUrl && isImage && (
            <div className="flex justify-center">
              <img
                src={objectUrl}
                alt={title}
                className="max-w-full h-auto rounded-md border"
                data-testid={`image-file-${fileId}`}
              />
            </div>
          )}
          
          {!isLoading && !error && objectUrl && isPDF && (
            <div className="w-full h-[600px]">
              <iframe
                src={objectUrl}
                className="w-full h-full border rounded-md"
                title={title}
                data-testid={`pdf-file-${fileId}`}
              />
            </div>
          )}
          
          {!isLoading && !error && objectUrl && !isImage && !isPDF && (
            <div className="text-center p-6 border rounded-md bg-muted">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Visualização não disponível para este tipo de arquivo
              </p>
            </div>
          )}
          
          {!isLoading && !error && objectUrl && (
            <div className="flex justify-center">
              <Button
                onClick={handleDownload}
                variant="outline"
                data-testid={`button-download-file-${fileId}`}
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar Arquivo
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
