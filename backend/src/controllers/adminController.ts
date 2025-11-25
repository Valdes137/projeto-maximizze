import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { hash } from 'bcryptjs';

export class AdminController {
  async listUsers(req: Request, res: Response) {
    try {
      const q = String(req.query.q || '').trim().toLowerCase();
      const repo = AppDataSource.getRepository(User);
      const users = await repo.find();
      const filtered = q ? users.filter(u => (u.email || '').toLowerCase().includes(q) || (u.name || '').toLowerCase().includes(q)) : users;
      return res.json(filtered);
    } catch {
      return res.status(500).json({ message: "Erro ao listar usuários" });
    }
  }

  async getUser(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const repo = AppDataSource.getRepository(User);
      const user = await repo.findOne({ where: { id } });
      if (!user) return res.status(404).json({ message: "Usuário não encontrado" });
      return res.json(user);
    } catch {
      return res.status(500).json({ message: "Erro ao buscar usuário" });
    }
  }

  async updateUser(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const { name, email, role, is_active, security_question, security_answer } = req.body;
      const repo = AppDataSource.getRepository(User);
      const user = await repo.findOne({ where: { id } });
      if (!user) return res.status(404).json({ message: "Usuário não encontrado" });
      if (name !== undefined) user.name = String(name);
      if (email !== undefined) user.email = String(email).toLowerCase();
      if (role !== undefined) user.role = role === 'seller' ? 'seller' : 'customer';
      if (is_active !== undefined) user.is_active = Boolean(is_active);
      if (security_question !== undefined) user.security_question = String(security_question);
      if (security_answer !== undefined) user.security_answer_hash = await hash(String(security_answer).toLowerCase(), 10);
      await repo.save(user);
      return res.json({ message: "Usuário atualizado" });
    } catch {
      return res.status(500).json({ message: "Erro ao atualizar usuário" });
    }
  }

  async deleteUser(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const repo = AppDataSource.getRepository(User);
      const user = await repo.findOne({ where: { id } });
      if (!user) return res.status(404).json({ message: "Usuário não encontrado" });
      try {
        await repo.delete(id);
        return res.json({ message: "Usuário excluído" });
      } catch (err: any) {
        const code = err?.code || '';
        const msg = String(err?.message || '').toUpperCase();
        const isFK = code === 'ER_ROW_IS_REFERENCED_2' || msg.includes('FOREIGN KEY') || msg.includes('SQLITE_CONSTRAINT');
        if (isFK) {
          user.is_active = false;
          await repo.save(user);
          return res.status(200).json({ message: "Usuário desativado (há vínculos no histórico)" });
        }
        return res.status(500).json({ message: "Erro ao excluir usuário" });
      }
    } catch {
      return res.status(500).json({ message: "Erro ao excluir usuário" });
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const { new_password } = req.body;
      if (!new_password || String(new_password).length < 6) return res.status(400).json({ message: "Senha inválida" });
      const repo = AppDataSource.getRepository(User);
      const user = await repo.findOne({ where: { id } });
      if (!user) return res.status(404).json({ message: "Usuário não encontrado" });
      user.password = await hash(String(new_password), 10);
      await repo.save(user);
      return res.json({ message: "Senha atualizada" });
    } catch {
      return res.status(500).json({ message: "Erro ao atualizar senha" });
    }
  }
}

export default new AdminController();
