"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductController = void 0;
const database_1 = require("../config/database");
const Product_1 = require("../models/Product");
class ProductController {
    // Criar produto (AGORA COM FOTO!)
    async create(req, res) {
        try {
            // --- AQUI ESTAVA O ERRO: Faltava receber a 'image' ---
            const { name, description, price, stock_quantity, image, image_url } = req.body;
            const seller_id = Number(req.headers['userId']);
            const productRepo = database_1.AppDataSource.getRepository(Product_1.Product);
            const product = productRepo.create({
                name,
                description,
                price,
                stock_quantity,
                seller_id,
                is_active: true,
                image: image,
                image_url: image_url || null
            });
            await productRepo.save(product);
            return res.status(201).json(product);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Erro ao criar produto" });
        }
    }
    // Listar apenas ativos
    async list(req, res) {
        try {
            const productRepo = database_1.AppDataSource.getRepository(Product_1.Product);
            const products = await productRepo.find({
                where: { is_active: true },
                relations: ["seller"]
            });
            return res.json(products);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Erro ao buscar produtos" });
        }
    }
    // Listar APENAS meus produtos (vendedor logado)
    async listMine(req, res) {
        try {
            const seller_id = Number(req.headers['userId']);
            const productRepo = database_1.AppDataSource.getRepository(Product_1.Product);
            const products = await productRepo.find({
                where: { is_active: true, seller_id },
                relations: ["seller"]
            });
            return res.json(products);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Erro ao buscar meus produtos" });
        }
    }
    // Atualizar (AGORA COM FOTO!)
    async update(req, res) {
        try {
            const { id } = req.params;
            const { name, description, price, stock_quantity, image, image_url } = req.body;
            const productRepo = database_1.AppDataSource.getRepository(Product_1.Product);
            const product = await productRepo.findOneBy({ id: Number(id) });
            if (!product) {
                return res.status(404).json({ message: "Produto não encontrado" });
            }
            const seller_id = Number(req.headers['userId']);
            if (product.seller_id !== seller_id) {
                return res.status(403).json({ message: "Sem permissão para alterar este produto" });
            }
            // Atualiza os campos
            product.name = name;
            product.description = description;
            product.price = price;
            product.stock_quantity = stock_quantity;
            // Só atualiza a foto se o usuário mandou uma nova
            if (image) {
                product.image = image;
            }
            if (typeof image_url === 'string' && image_url.length > 0) {
                product.image_url = image_url;
            }
            await productRepo.save(product);
            return res.json({ message: "Produto atualizado com sucesso!", product });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Erro ao atualizar" });
        }
    }
    // Desativar (Soft Delete)
    async delete(req, res) {
        try {
            const { id } = req.params;
            const productRepo = database_1.AppDataSource.getRepository(Product_1.Product);
            const product = await productRepo.findOneBy({ id: Number(id) });
            if (!product) {
                return res.status(404).json({ message: "Produto não encontrado" });
            }
            const seller_id = Number(req.headers['userId']);
            if (product.seller_id !== seller_id) {
                return res.status(403).json({ message: "Sem permissão para apagar este produto" });
            }
            product.is_active = false;
            await productRepo.save(product);
            return res.json({ message: "Produto removido com sucesso!" });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Erro ao apagar" });
        }
    }
}
exports.ProductController = ProductController;
