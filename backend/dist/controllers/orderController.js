"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderController = void 0;
const database_1 = require("../config/database");
const Order_1 = require("../models/Order");
const OrderItem_1 = require("../models/OrderItem");
const Product_1 = require("../models/Product");
class OrderController {
    // Criar Pedido
    async create(req, res) {
        try {
            const { items, address } = req.body;
            const customer_id = Number(req.headers['userId']);
            if (!items || items.length === 0)
                return res.status(400).json({ message: "Carrinho vazio" });
            if (!address)
                return res.status(400).json({ message: "Endereço é obrigatório" });
            const orderRepo = database_1.AppDataSource.getRepository(Order_1.Order);
            const productRepo = database_1.AppDataSource.getRepository(Product_1.Product);
            let totalAmount = 0;
            const orderItems = [];
            for (const item of items) {
                const pid = Number(item.product_id ?? item.productId);
                const qty = Number(item.quantity);
                if (!pid || !qty || qty <= 0) {
                    return res.status(400).json({ message: `Item inválido no carrinho` });
                }
                const product = await productRepo.findOneBy({ id: pid });
                if (!product)
                    return res.status(400).json({ message: `Produto não encontrado` });
                if (product.stock_quantity < qty) {
                    return res.status(400).json({ message: `Estoque insuficiente: ${product.name}` });
                }
                product.stock_quantity -= qty;
                await productRepo.save(product);
                const orderItem = new OrderItem_1.OrderItem();
                orderItem.product = product;
                orderItem.quantity = qty;
                orderItem.unit_price = product.price;
                orderItems.push(orderItem);
                totalAmount += (product.price * qty);
            }
            const order = orderRepo.create({
                customer_id,
                total_amount: totalAmount,
                status: 'pending',
                address: address,
                items: orderItems
            });
            await orderRepo.save(order);
            return res.status(201).json({ message: "Pedido realizado!", orderId: order.id });
        }
        catch (error) {
            return res.status(500).json({ message: "Erro ao processar pedido" });
        }
    }
    // Listar MEUS pedidos
    async listMyOrders(req, res) {
        try {
            const customer_id = Number(req.headers['userId']);
            const orderRepo = database_1.AppDataSource.getRepository(Order_1.Order);
            const orders = await orderRepo.find({
                where: { customer_id },
                relations: ["items", "items.product"],
                order: { created_at: "DESC" }
            });
            return res.json(orders);
        }
        catch (error) {
            return res.status(500).json({ message: "Erro ao buscar pedidos" });
        }
    }
    // --- ESTATÍSTICAS ATUALIZADAS (Com Total de Produtos) ---
    async getStats(req, res) {
        try {
            const sellerId = Number(req.headers['userId']);
            const productRepo = database_1.AppDataSource.getRepository(Product_1.Product);
            const totalSalesRaw = await database_1.AppDataSource.createQueryBuilder()
                .select('SUM(item.unit_price * item.quantity)', 'total')
                .from('order_items', 'item')
                .innerJoin('products', 'product', 'product.id = item.product_id AND product.seller_id = :sellerId', { sellerId })
                .innerJoin('orders', 'o', 'o.id = item.order_id')
                .getRawOne();
            const totalOrdersRaw = await database_1.AppDataSource.createQueryBuilder()
                .select('COUNT(DISTINCT o.id)', 'count')
                .from('orders', 'o')
                .innerJoin('order_items', 'item', 'item.order_id = o.id')
                .innerJoin('products', 'product', 'product.id = item.product_id AND product.seller_id = :sellerId', { sellerId })
                .getRawOne();
            const pendingOrdersRaw = await database_1.AppDataSource.createQueryBuilder()
                .select('COUNT(DISTINCT o.id)', 'count')
                .from('orders', 'o')
                .innerJoin('order_items', 'item', 'item.order_id = o.id')
                .innerJoin('products', 'product', 'product.id = item.product_id AND product.seller_id = :sellerId', { sellerId })
                .where('o.status = :status', { status: 'pending' })
                .getRawOne();
            const lowStock = await productRepo.createQueryBuilder('product')
                .where('product.is_active = :active', { active: true })
                .andWhere('product.stock_quantity < :min', { min: 5 })
                .andWhere('product.seller_id = :sellerId', { sellerId })
                .getCount();
            const totalProducts = await productRepo.count({ where: { is_active: true, seller_id: sellerId } });
            return res.json({
                totalSales: Number(totalSalesRaw?.total) || 0,
                totalOrders: Number(totalOrdersRaw?.count) || 0,
                pendingOrders: Number(pendingOrdersRaw?.count) || 0,
                lowStock: lowStock || 0,
                totalProducts: totalProducts || 0
            });
        }
        catch (error) {
            return res.status(500).json({ message: "Erro stats" });
        }
    }
    // Listar TODOS
    async listAll(req, res) {
        try {
            const sellerId = Number(req.headers['userId']);
            const orderRepo = database_1.AppDataSource.getRepository(Order_1.Order);
            const rawIds = await orderRepo.createQueryBuilder('o')
                .innerJoin('o.items', 'item')
                .innerJoin(Product_1.Product, 'product', 'product.id = item.product_id AND product.seller_id = :sellerId', { sellerId })
                .select('DISTINCT o.id', 'id')
                .getRawMany();
            const ids = rawIds.map(r => Number(r.id));
            if (ids.length === 0)
                return res.json([]);
            const orders = await orderRepo.createQueryBuilder('order')
                .leftJoinAndSelect('order.items', 'item')
                .leftJoinAndSelect('item.product', 'product')
                .leftJoinAndSelect('order.customer', 'customer')
                .where('order.id IN (:...ids)', { ids })
                .andWhere('product.seller_id = :sellerId', { sellerId })
                .orderBy('order.created_at', 'DESC')
                .getMany();
            return res.json(orders);
        }
        catch (error) {
            return res.status(500).json({ message: "Erro lista" });
        }
    }
    // Mudar Status
    async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const orderRepo = database_1.AppDataSource.getRepository(Order_1.Order);
            const order = await orderRepo.findOneBy({ id: Number(id) });
            if (!order)
                return res.status(404).json({ message: "Pedido não encontrado" });
            order.status = status;
            await orderRepo.save(order);
            return res.json({ message: "Status atualizado!", order });
        }
        catch (error) {
            return res.status(500).json({ message: "Erro ao atualizar status" });
        }
    }
    // Listar Clientes
    async getMyCustomers(req, res) {
        try {
            const sellerId = Number(req.headers['userId']);
            const rows = await database_1.AppDataSource.createQueryBuilder()
                .select(['o.id as id', 'o.created_at as created_at', 'c.id as customer_id', 'c.name as name', 'c.email as email', 'c.avatar as avatar', 'o.total_amount as total_amount'])
                .from('orders', 'o')
                .innerJoin('order_items', 'item', 'item.order_id = o.id')
                .innerJoin('products', 'product', 'product.id = item.product_id AND product.seller_id = :sellerId', { sellerId })
                .innerJoin('users', 'c', 'c.id = o.customer_id')
                .getRawMany();
            const customersMap = new Map();
            for (const row of rows) {
                const cid = Number(row.customer_id);
                if (!customersMap.has(cid)) {
                    customersMap.set(cid, {
                        id: cid,
                        name: row.name || 'Cliente sem nome',
                        email: row.email,
                        avatar: row.avatar,
                        totalSpent: 0,
                        ordersCount: 0,
                        lastOrder: row.created_at
                    });
                }
                const current = customersMap.get(cid);
                current.totalSpent += Number(row.total_amount);
                current.ordersCount += 1;
                if (new Date(row.created_at) > new Date(current.lastOrder)) {
                    current.lastOrder = row.created_at;
                }
            }
            return res.json(Array.from(customersMap.values()));
        }
        catch (error) {
            return res.status(500).json({ message: "Erro clientes" });
        }
    }
}
exports.OrderController = OrderController;
