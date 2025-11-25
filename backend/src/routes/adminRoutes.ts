import { Router } from 'express';
import AdminController from '../controllers/adminController';
import { adminMiddleware } from '../middlewares/adminMiddleware';

const router = Router();

router.use(adminMiddleware);
router.get('/users', AdminController.listUsers);
router.get('/users/:id', AdminController.getUser);
router.put('/users/:id', AdminController.updateUser);
router.delete('/users/:id', AdminController.deleteUser);
router.post('/users/:id/reset-password', AdminController.resetPassword);

export default router;
