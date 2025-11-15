import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { Usuario } from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "app-ipe-secret-key-2024";

export interface AuthRequest extends Request {
  usuario?: Usuario;
}

export function generateToken(usuario: Usuario): string {
  return jwt.sign(
    { id: usuario.id, email: usuario.email, papel: usuario.papel, parte_id: usuario.parte_id },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send("Token não fornecido");
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).send("Token inválido ou expirado");
  }

  if (!decoded.parte_id && decoded.id) {
    try {
      const { db } = await import("../db");
      const { usuarios } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      
      const usuarioCompleto = await db
        .select()
        .from(usuarios)
        .where(eq(usuarios.id, decoded.id))
        .then(rows => rows[0]);
      
      if (usuarioCompleto) {
        req.usuario = usuarioCompleto;
      } else {
        req.usuario = decoded as Usuario;
      }
    } catch (error) {
      req.usuario = decoded as Usuario;
    }
  } else {
    req.usuario = decoded as Usuario;
  }
  
  next();
}

export function requireProprietario(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (req.usuario?.papel !== "Proprietário") {
    return res.status(403).send("Acesso negado. Apenas proprietários podem realizar esta ação");
  }
  next();
}

export function validatePaymentStatusUpdate(
  usuario: Usuario | undefined,
  status: string | undefined,
  hasFile: boolean,
  hasExistingComprovante: boolean
): { error?: string; statusCode?: number } {
  if (!status) {
    return {};
  }

  if (status === 'pago' && usuario?.papel !== 'Proprietário') {
    return {
      error: "Apenas proprietários podem marcar pagamentos como 'pago'",
      statusCode: 403
    };
  }

  if (status === 'pagamento_informado' && !hasFile && !hasExistingComprovante) {
    return {
      error: "Comprovante é obrigatório para status 'pagamento_informado'",
      statusCode: 400
    };
  }

  return {};
}

export async function ensureUsuarioPodeAcessarImovel(
  usuario: Usuario,
  imovelId: number,
  db: any
): Promise<boolean> {
  const { imovelPartes } = await import("@shared/schema");
  const { eq, and } = await import("drizzle-orm");
  
  if (!usuario.parte_id) {
    return false;
  }
  
  const acesso = await db
    .select()
    .from(imovelPartes)
    .where(
      and(
        eq(imovelPartes.imovel_id, imovelId),
        eq(imovelPartes.parte_id, usuario.parte_id)
      )
    )
    .then((rows: any[]) => rows[0]);
  
  return !!acesso;
}
