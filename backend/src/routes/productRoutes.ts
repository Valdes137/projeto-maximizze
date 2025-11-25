import { Router } from 'express';
import { ProductController } from '../controllers/productController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();
const productController = new ProductController();

// Rota Protegida 
router.post('/', authMiddleware, productController.create);
router.delete('/:id', authMiddleware, productController.delete);
router.put('/:id', authMiddleware, productController.update);
router.get('/mine', authMiddleware, productController.listMine);
// Rota Pública
router.get('/', productController.list);


export default router;
