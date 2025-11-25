"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController_1 = __importDefault(require("../controllers/adminController"));
const adminMiddleware_1 = require("../middlewares/adminMiddleware");
const router = (0, express_1.Router)();
router.use(adminMiddleware_1.adminMiddleware);
router.get('/users', adminController_1.default.listUsers);
router.get('/users/:id', adminController_1.default.getUser);
router.put('/users/:id', adminController_1.default.updateUser);
router.delete('/users/:id', adminController_1.default.deleteUser);
router.post('/users/:id/reset-password', adminController_1.default.resetPassword);
exports.default = router;
