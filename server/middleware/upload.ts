import multer from "multer";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";

const uploadsDir = join(process.cwd(), "uploads");
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const extension = file.originalname.split(".").pop();
    cb(null, `${timestamp}-${randomString}.${extension}`);
  },
});

export const upload = multer({ storage });

export interface FileValidationConfig {
  maxCount: number;
  maxSizeMB: number;
  allowedTypes: string[];
}

export function validateFiles(
  files: Express.Multer.File[],
  config: FileValidationConfig
): string | null {
  if (files.length > config.maxCount) {
    return `Máximo de ${config.maxCount} arquivo(s) permitido(s)`;
  }

  for (const file of files) {
    const extension = file.originalname.split(".").pop()?.toLowerCase();
    if (!extension || !config.allowedTypes.includes(extension)) {
      return `Tipo de arquivo não permitido: ${file.originalname}. Tipos aceitos: ${config.allowedTypes.join(", ")}`;
    }

    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > config.maxSizeMB) {
      return `Arquivo muito grande: ${file.originalname}. Tamanho máximo: ${config.maxSizeMB}MB`;
    }
  }

  return null;
}
