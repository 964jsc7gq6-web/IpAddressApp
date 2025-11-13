import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { Usuario } from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "app-ipe-secret-key-2024";

export interface AuthRequest extends Request {
  usuario?: Usuario;
}

export function generateToken(usuario: Usuario): string {
  return jwt.sign(
    { id: usuario.id, email: usuario.email, papel: usuario.papel },
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

export function authMiddleware(
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

  req.usuario = decoded as Usuario;
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
