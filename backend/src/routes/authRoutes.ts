import { Router } from 'express';
import AuthController from '../controllers/authController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Rotas Públicas
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/good-login', AuthController.goodLogin);
router.post('/forgot', AuthController.forgotPassword);
router.post('/reset', AuthController.resetPassword);

// Rotas Privadas
router.get('/profile', authMiddleware, AuthController.getProfile);
router.put('/profile', authMiddleware, AuthController.updateProfile);
router.delete('/profile', authMiddleware, AuthController.deleteAccount);

export default router;
