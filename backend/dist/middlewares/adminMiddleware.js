"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMiddleware = adminMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function adminMiddleware(req, res, next) {
    const { authorization } = req.headers;
    if (!authorization)
        return res.status(401).json({ message: "Login necessário" });
    const [, token] = authorization.split(' ');
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secreta-padrao');
        if (decoded.email !== 'pablo@good.com')
            return res.status(403).json({ message: "Acesso negado" });
        req.headers['userId'] = String(decoded.id);
        return next();
    }
    catch {
        return res.status(401).json({ message: "Token inválido" });
    }
}
