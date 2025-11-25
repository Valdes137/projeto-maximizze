
import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
// import * as morgan from 'morgan'; // (Se estiver usando)
import dotenv from 'dotenv';
import { AppDataSource } from './config/database';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Imports das rotas
import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import orderRoutes from './routes/orderRoutes';
import adminRoutes from './routes/adminRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(helmet());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// --- AUMENTAR O LIMITE PARA 50MB (Para aceitar fotos) ---
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
// Configuração das Rotas
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
  res.json({ message: '🚀 Backend Maximizee está rodando!' });
});

AppDataSource.initialize()
  .then(() => {
    console.log('📦 Banco de Dados conectado com sucesso!');
    app.listen(PORT, () => {
      console.log(`⚡ Servidor rodando na porta ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ Erro ao conectar no Banco de Dados:', error);
  });
