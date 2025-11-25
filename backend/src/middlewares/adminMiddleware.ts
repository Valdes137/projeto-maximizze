import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface TokenPayload { id: number; email: string; role: string; iat: number; exp: number }

export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  const { authorization } = req.headers;
  if (!authorization) return res.status(401).json({ message: "Login necessário" });
  const [, token] = authorization.split(' ');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secreta-padrao') as TokenPayload;
    if (decoded.email !== 'pablo@good.com') return res.status(403).json({ message: "Acesso negado" });
    req.headers['userId'] = String(decoded.id);
    return next();
  } catch {
    return res.status(401).json({ message: "Token inválido" });
  }
}
