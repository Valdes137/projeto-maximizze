import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface TokenPayload {
    id: number;
    role: string;
    iat: number;
    exp: number;
}

export function authMiddleware(
    req: Request, 
    res: Response, 
    next: NextFunction
) {
    const { authorization } = req.headers;

    // 1. Verifica se enviou o header "Authorization"
    if (!authorization) {
        return res.status(401).json({ message: "Login necessário (Token não encontrado)" });
    }

    // 2. O token vem assim: "Bearer eyJhbGci..."
    // Precisamos separar a palavra "Bearer" do código
    const [, token] = authorization.split(' ');

    try {
        // 3. Verifica se o token é válido usando a senha secreta
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secreta-padrao');
        
        const { id, role } = decoded as TokenPayload;

        // 4. Adiciona o ID do usuário dentro da requisição para usarmos depois
        // (Vamos usar um truque do TypeScript aqui: req.userId)
        req.headers['userId'] = String(id);
        req.headers['userRole'] = role;

        return next(); // Pode passar!

    } catch (error) {
        return res.status(401).json({ message: "Token inválido ou expirado" });
    }
}