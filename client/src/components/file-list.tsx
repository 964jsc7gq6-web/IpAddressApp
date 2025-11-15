import { useQuery } from "@tanstack/react-query";
import { FileViewer } from "@/components/file-viewer";
import { FileText, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthToken } from "@/lib/auth";

interface Arquivo {
  id: number;
  nome_original: string;
  mime: string;
  tamanho: number;
  tipo: string;
}

interface FileListProps {
  entidade: "parte" | "imovel";
  entidadeId: number;
  title?: string;
  description?: string;
  emptyMessage?: string;
  excludeTypes?: string[];
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileList({
  entidade,
  entidadeId,
  title = "Arquivos Anexados",
  description,
  emptyMessage = "Nenhum arquivo anexado",
  excludeTypes = [],
}: FileListProps) {
  const { data: allArquivos, isLoading } = useQuery<Arquivo[]>({
    queryKey: ['/api/arquivos', entidade, entidadeId],
    queryFn: async () => {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Token não encontrado");
      }

      const params = new URLSearchParams({
        entidade,
        entidadeId: entidadeId.toString(),
      });
      
      const response = await fetch(`/api/arquivos?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Acesso negado");
        }
        throw new Error('Erro ao carregar arquivos');
      }
      return response.json();
    },
  });

  const arquivos = allArquivos?.filter(a => !excludeTypes.includes(a.tipo)) ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex justify-center items-center p-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && (!arquivos || arquivos.length === 0) && (
          <p className="text-sm text-muted-foreground" data-testid={`text-no-files-${entidade}-${entidadeId}`}>
            {emptyMessage}
          </p>
        )}

        {!isLoading && arquivos && arquivos.length > 0 && (
          <div className="space-y-3">
            {arquivos.map((arquivo) => (
              <div
                key={arquivo.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted hover-elevate"
                data-testid={`file-item-${arquivo.id}`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" data-testid={`text-file-name-${arquivo.id}`}>
                      {arquivo.nome_original}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(arquivo.tamanho)}
                      {arquivo.tipo && ` • ${arquivo.tipo}`}
                    </p>
                  </div>
                </div>
                <FileViewer
                  fileId={arquivo.id}
                  nomeOriginal={arquivo.nome_original}
                  mime={arquivo.mime}
                  label="Ver"
                  title={arquivo.tipo ? `${arquivo.tipo.charAt(0).toUpperCase() + arquivo.tipo.slice(1)}` : "Arquivo"}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
