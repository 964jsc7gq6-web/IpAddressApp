import { useCallback, useState } from "react";
import { Upload, X, FileIcon, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  maxFiles?: number;
  maxSizeMB?: number;
  accept?: string[];
  onFilesChange: (files: File[]) => void;
  existingFiles?: Array<{ id: number; nomeOriginal: string; caminho: string }>;
  onRemoveExisting?: (id: number) => void;
  label?: string;
  hint?: string;
}

export function FileUpload({
  maxFiles = 1,
  maxSizeMB = 5,
  accept = ["pdf", "jpg", "jpeg", "png", "doc", "docx", "rtf", "zip"],
  onFilesChange,
  existingFiles = [],
  onRemoveExisting,
  label = "Enviar arquivos",
  hint,
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const validateFile = (file: File): string | null => {
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !accept.includes(extension)) {
      return `Tipo de arquivo não permitido. Tipos aceitos: ${accept.join(", ")}`;
    }

    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      return `Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`;
    }

    return null;
  };

  const handleFiles = useCallback(
    (newFiles: FileList | null) => {
      if (!newFiles) return;

      const fileArray = Array.from(newFiles);
      const validFiles: File[] = [];
      const newErrors: string[] = [];

      const totalFiles = files.length + existingFiles.length + fileArray.length;
      if (totalFiles > maxFiles) {
        newErrors.push(`Máximo de ${maxFiles} arquivo(s) permitido(s)`);
        setErrors(newErrors);
        return;
      }

      fileArray.forEach((file) => {
        const error = validateFile(file);
        if (error) {
          newErrors.push(`${file.name}: ${error}`);
        } else {
          validFiles.push(file);
        }
      });

      if (newErrors.length > 0) {
        setErrors(newErrors);
        setTimeout(() => setErrors([]), 5000);
      }

      if (validFiles.length > 0) {
        const updated = [...files, ...validFiles];
        setFiles(updated);
        onFilesChange(updated);
      }
    },
    [files, existingFiles, maxFiles, accept, maxSizeMB, onFilesChange]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    onFilesChange(updated);
  };

  const totalCount = files.length + existingFiles.length;
  const isImage = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    return ["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        <span className="text-xs text-muted-foreground">
          {totalCount}/{maxFiles} arquivo(s)
        </span>
      </div>

      <Card
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer",
          dragActive ? "border-primary bg-primary/5" : "border-border hover-elevate"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById(`file-input-${label}`)?.click()}
        data-testid="dropzone-upload"
      >
        <div className="p-8 text-center">
          <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium mb-1">
            Arraste arquivos ou clique para selecionar
          </p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
          <p className="text-xs text-muted-foreground mt-2">
            Tipos: {accept.join(", ")} • Máx: {maxSizeMB}MB
          </p>
        </div>
      </Card>

      <input
        id={`file-input-${label}`}
        type="file"
        multiple={maxFiles > 1}
        accept={accept.map((ext) => `.${ext}`).join(",")}
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
        data-testid="input-file"
      />

      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((error, i) => (
            <p key={i} className="text-xs text-destructive">
              {error}
            </p>
          ))}
        </div>
      )}

      {/* Existing Files */}
      {existingFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Arquivos existentes:</p>
          {existingFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted"
              data-testid={`file-existing-${file.id}`}
            >
              {isImage(file.nomeOriginal) ? (
                <ImageIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              ) : (
                <FileIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              )}
              <span className="text-sm flex-1 truncate">{file.nomeOriginal}</span>
              {onRemoveExisting && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  onClick={() => onRemoveExisting(file.id)}
                  data-testid={`button-remove-existing-${file.id}`}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New Files */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Novos arquivos:</p>
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20"
              data-testid={`file-new-${index}`}
            >
              {isImage(file.name) ? (
                <ImageIcon className="w-4 h-4 text-primary flex-shrink-0" />
              ) : (
                <FileIcon className="w-4 h-4 text-primary flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                data-testid={`button-remove-new-${index}`}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
