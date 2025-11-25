"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orderController_1 = require("../controllers/orderController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
const orderController = new orderController_1.OrderController();
// Todas as rotas de pedido precisam de login
router.use(authMiddleware_1.authMiddleware);
router.post('/', orderController.create); // Criar pedido
router.get('/my-orders', orderController.listMyOrders); // Ver meus pedidos
router.get('/stats', orderController.getStats); // Para o Dashboard
router.get('/all', orderController.listAll); // Para a lista de vendas
router.put('/:id/status', orderController.updateStatus);
router.get('/customers', orderController.getMyCustomers);
exports.default = router;
