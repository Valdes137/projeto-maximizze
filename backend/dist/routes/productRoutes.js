"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const productController_1 = require("../controllers/productController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
const productController = new productController_1.ProductController();
// Rota Protegida 
router.post('/', authMiddleware_1.authMiddleware, productController.create);
router.delete('/:id', authMiddleware_1.authMiddleware, productController.delete);
router.put('/:id', authMiddleware_1.authMiddleware, productController.update);
router.get('/mine', authMiddleware_1.authMiddleware, productController.listMine);
// Rota Pública
router.get('/', productController.list);
exports.default = router;
