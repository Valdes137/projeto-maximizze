"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
// import * as morgan from 'morgan'; // (Se estiver usando)
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./config/database");
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// Imports das rotas
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const productRoutes_1 = __importDefault(require("./routes/productRoutes"));
const orderRoutes_1 = __importDefault(require("./routes/orderRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)());
app.use((0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
}));
// --- AUMENTAR O LIMITE PARA 50MB (Para aceitar fotos) ---
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ limit: '50mb', extended: true }));
// Configuração das Rotas
app.use('/api/auth', authRoutes_1.default);
app.use('/api/products', productRoutes_1.default);
app.use('/api/orders', orderRoutes_1.default);
app.use('/api/admin', adminRoutes_1.default);
app.get('/', (req, res) => {
    res.json({ message: '🚀 Backend Maximizee está rodando!' });
});
database_1.AppDataSource.initialize()
    .then(() => {
    console.log('📦 Banco de Dados conectado com sucesso!');
    app.listen(PORT, () => {
        console.log(`⚡ Servidor rodando na porta ${PORT}`);
    });
})
    .catch((error) => {
    console.error('❌ Erro ao conectar no Banco de Dados:', error);
});
