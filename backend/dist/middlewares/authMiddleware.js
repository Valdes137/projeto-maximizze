"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function authMiddleware(req, res, next) {
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
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secreta-padrao');
        const { id, role } = decoded;
        // 4. Adiciona o ID do usuário dentro da requisição para usarmos depois
        // (Vamos usar um truque do TypeScript aqui: req.userId)
        req.headers['userId'] = String(id);
        req.headers['userRole'] = role;
        return next(); // Pode passar!
    }
    catch (error) {
        return res.status(401).json({ message: "Token inválido ou expirado" });
    }
}
