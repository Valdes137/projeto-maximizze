"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = __importDefault(require("../controllers/authController"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// Rotas Públicas
router.post('/register', authController_1.default.register);
router.post('/login', authController_1.default.login);
router.post('/good-login', authController_1.default.goodLogin);
router.post('/forgot', authController_1.default.forgotPassword);
router.post('/reset', authController_1.default.resetPassword);
// Rotas Privadas
router.get('/profile', authMiddleware_1.authMiddleware, authController_1.default.getProfile);
router.put('/profile', authMiddleware_1.authMiddleware, authController_1.default.updateProfile);
router.delete('/profile', authMiddleware_1.authMiddleware, authController_1.default.deleteAccount);
exports.default = router;
