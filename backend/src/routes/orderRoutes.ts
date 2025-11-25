import { Router } from 'express';
import { OrderController } from '../controllers/orderController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();
const orderController = new OrderController();

// Todas as rotas de pedido precisam de login
router.use(authMiddleware);

router.post('/', orderController.create);      // Criar pedido
router.get('/my-orders', orderController.listMyOrders); // Ver meus pedidos
router.get('/stats', orderController.getStats); // Para o Dashboard
router.get('/all', orderController.listAll);    // Para a lista de vendas
router.put('/:id/status', orderController.updateStatus);
router.get('/customers', orderController.getMyCustomers);

export default router;
 