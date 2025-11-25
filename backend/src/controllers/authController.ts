import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { User } from "../models/User";
import { hash, compare } from "bcryptjs";
import jwt from "jsonwebtoken";


export class AuthController {

    // 1. Registrar usuário
    async register(req: Request, res: Response) {
        try {
            const { name, email, password, role, security_question, security_answer } = req.body;

            if (!name || !email || !password) {
                return res.status(400).json({ message: "Preencha todos os campos." });
            }

            const trimmedName = String(name).trim();
            if (trimmedName.length < 3 || trimmedName.length > 60) {
                return res.status(400).json({ message: "Nome deve ter entre 3 e 60 caracteres." });
            }
            const nameOk = /^[A-Za-zÀ-ÖØ-öø-ÿ' ]+$/.test(trimmedName);
            if (!nameOk) {
                return res.status(400).json({ message: "Nome contém caracteres inválidos." });
            }

            const emailStr = String(email).toLowerCase();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
            if (!emailRegex.test(emailStr)) {
                return res.status(400).json({ message: "Email inválido." });
            }

            const isGmail = emailStr.endsWith('@gmail.com');
            if (isGmail) {
                const local = emailStr.split('@')[0];
                if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) {
                    return res.status(400).json({ message: "Email Gmail inválido." });
                }
                const gmailLocalOk = /^[A-Za-z0-9.]+(\+[A-Za-z0-9]+)?$/.test(local);
                if (!gmailLocalOk) {
                    return res.status(400).json({ message: "Email Gmail inválido." });
                }
            }

            if (String(password).length < 6) {
                return res.status(400).json({ message: "Senha deve ter ao menos 6 caracteres." });
            }

            const allowedQuestions = [
                'Qual é o nome da sua mãe?',
                'Qual é o nome do seu primeiro animal de estimação?',
                'Qual é a cidade onde você nasceu?'
            ];
            const sq = String(security_question || '').trim();
            const sa = String(security_answer || '').trim();
            if (!sq || !sa) {
                return res.status(400).json({ message: "Informe pergunta e resposta de segurança." });
            }
            if (!allowedQuestions.includes(sq)) {
                return res.status(400).json({ message: "Pergunta de segurança inválida." });
            }

            const userRepo = AppDataSource.getRepository(User);
            const existing = await userRepo.findOne({ where: { email: emailStr } });

            if (existing) {
                return res.status(400).json({ message: "Email já cadastrado." });
            }

            const hashedPassword = await hash(password, 10);
            const securityAnswerHash = await hash(sa.toLowerCase(), 10);

            const newUser = userRepo.create({
                name: trimmedName,
                email: emailStr,
                password: hashedPassword,
                role: role === 'seller' ? 'seller' : 'customer',
                security_question: sq,
                security_answer_hash: securityAnswerHash
            });

            await userRepo.save(newUser);

            return res.status(201).json({ message: "Usuário registrado com sucesso!" });

        } catch (error) {
            console.error("Erro no registro:", error);
            return res.status(500).json({ message: "Erro interno." });
        }
    }

    // 2. Login
    async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;
            const userRepo = AppDataSource.getRepository(User);

            const emailStr = String(email).toLowerCase();
            const user = await userRepo.findOne({
                where: { email: emailStr },
                select: ["id", "name", "email", "password", "role", "is_active"]
            });

            if (!user) {
                return res.status(404).json({ message: "Usuário não encontrado." });
            }

            if (!user.is_active) {
                return res.status(403).json({ message: "Conta desativada." });
            }

            const passwordMatch = await compare(password, user.password);

            if (!passwordMatch) {
                return res.status(401).json({ message: "Senha incorreta." });
            }

            const token = jwt.sign(
                {
                    id: user.id,
                    email: user.email,
                    role: user.role
                },
                process.env.JWT_SECRET || 'secreta-padrao',
                { expiresIn: "7d" }
            );

            return res.status(200).json({
                message: "Login bem-sucedido.",
                token,
                user: { id: user.id, name: user.name, email: user.email, role: user.role }
            });

        } catch (error) {
            console.error("Erro no login:", error);
            return res.status(500).json({ message: "Erro interno." });
        }
    }

    // 2b. Good Admin Login (sem necessidade de usuário no banco)
    async goodLogin(req: Request, res: Response) {
        try {
            const { email, password } = req.body;
            const adminEmail = 'pablo@good.com';
            const adminPass = '30062006m';

            if (String(email).toLowerCase() !== adminEmail) {
                return res.status(403).json({ message: 'Acesso negado.' });
            }
            if (String(password) !== adminPass) {
                return res.status(401).json({ message: 'Senha incorreta.' });
            }

            const token = jwt.sign(
                { id: 0, email: adminEmail, role: 'admin' },
                process.env.JWT_SECRET || 'secreta-padrao',
                { expiresIn: '7d' }
            );

            return res.status(200).json({ message: 'Login admin OK.', token, user: { id: 0, name: 'GOOD Admin', email: adminEmail, role: 'admin' } });
        } catch (error) {
            console.error('Erro no good-login:', error);
            return res.status(500).json({ message: 'Erro interno.' });
        }
    }

    // 3. Perfil do usuário logado
    async getProfile(req: Request, res: Response) { // Renomeado de profile para getProfile para manter consistência
        try {
            const userId = Number(req.headers["userId"]);
            const userRepo = AppDataSource.getRepository(User);

            const user = await userRepo.findOne({
                where: { id: userId },
                select: ["id", "name", "email", "role", "cpf", "zip_code", "avatar", "phone", "description"]
            });

            if (!user) {
                return res.status(404).json({ message: "Usuário não encontrado." });
            }

            return res.status(200).json(user);

        } catch (error) {
            console.error("Erro no profile:", error);
            return res.status(500).json({ message: "Erro interno." });
        }
    }

    // 4. Atualizar Perfil
    async updateProfile(req: Request, res: Response) {
        try {
            const userId = Number(req.headers["userId"]);
            const { name, email, cpf, zip_code, avatar, description } = req.body;

            const userRepo = AppDataSource.getRepository(User);

            const user = await userRepo.findOne({ where: { id: userId } });

            if (!user) {
                return res.status(404).json({ message: "Usuário não encontrado." });
            }

            // Atualiza apenas se o campo foi enviado
            if (name) user.name = name;
            if (email) user.email = email;
            if (cpf) user.cpf = cpf;
            if (zip_code) user.zip_code = zip_code;
            if (avatar) user.avatar = avatar;
            if (description) user.description = description;

            await userRepo.save(user);

            return res.status(200).json({ message: "Perfil atualizado com sucesso." });

        } catch (error) {
            console.error("Erro ao atualizar perfil:", error);
            return res.status(500).json({ message: "Erro interno." });
        }
    }

    // 5. Excluir conta com regras de negócio
    async deleteAccount(req: Request, res: Response) {
        try {
            const userId = Number(req.headers["userId"]);
            const { password } = req.body;

            if (!password) {
                return res.status(400).json({
                    message: "Senha é obrigatória para excluir a conta."
                });
            }

            const userRepo = AppDataSource.getRepository(User);

            const user = await userRepo.findOne({
                where: { id: userId },
                select: ["id", "password"]
            });

            if (!user) {
                return res.status(404).json({ message: "Usuário não encontrado." });
            }

            const passwordMatch = await compare(password, user.password);
            if (!passwordMatch) {
                return res.status(401).json({ message: "Senha incorreta." });
            }

            // VERIFICA PEDIDOS ASSOCIADOS AO USUÁRIO (Raw Query)
            // Correção: Pegamos o resultado completo (array)
            const result = await AppDataSource.query(
                `SELECT COUNT(*) AS total
                 FROM orders
                 WHERE customer_id = ?
                 AND status IN ('pending')`,
                [userId]
            );

            // Correção de acesso: O resultado é um array de objetos [{ total: 5 }]
            const pendencias = Number(result[0].total);

            if (pendencias > 0) {
                return res.status(403).json({
                    message: `Você possui ${pendencias} pedido(s) pendente(s). Não é possível excluir sua conta.`
                });
            }

            // TENTAR EXCLUIR
            try {
                await userRepo.delete(userId);

                return res.status(200).json({
                    message: "Conta excluída com sucesso."
                });

            } catch (err: any) {
                if (err.code === "ER_ROW_IS_REFERENCED_2" || String(err.message || '').toUpperCase().includes('FOREIGN KEY') || String(err.message || '').toUpperCase().includes('SQLITE_CONSTRAINT')) {
                    const u = await userRepo.findOne({ where: { id: userId } });
                    if (u) {
                        u.is_active = false;
                        await userRepo.save(u);
                    }
                    return res.status(200).json({ message: "Conta desativada devido a histórico." });
                }
                throw err;
            }

        } catch (error) {
            console.error("Erro ao excluir conta:", error);
            return res.status(500).json({
                message: "Erro interno ao excluir conta."
            });
        }
    }

    async forgotPassword(req: Request, res: Response) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ message: "Informe o email." });
            }
            const userRepo = AppDataSource.getRepository(User);
            const user = await userRepo.findOne({ where: { email } });
            if (!user) {
                return res.status(404).json({ message: "Usuário não encontrado." });
            }
            return res.json({ question: user.security_question });
        } catch (error: any) {
            console.error("Erro forgot password:", error);
            return res.status(500).json({ message: "Erro ao buscar pergunta de segurança." });
        }
    }

    async resetPassword(req: Request, res: Response) {
        try {
            const { email, answer, new_password } = req.body;
            if (!email || !answer || !new_password) {
                return res.status(400).json({ message: "Informe email, resposta e nova senha." });
            }
            if (String(new_password).length < 6) {
                return res.status(400).json({ message: "Senha deve ter ao menos 6 caracteres." });
            }
            const userRepo = AppDataSource.getRepository(User);
            const user = await userRepo.findOne({ where: { email } });
            if (!user) {
                return res.status(404).json({ message: "Usuário não encontrado." });
            }
            const ok = await compare(String(answer).toLowerCase(), user.security_answer_hash);
            if (!ok) {
                return res.status(401).json({ message: "Resposta de segurança incorreta." });
            }
            const hashedPassword = await hash(new_password, 10);
            user.password = hashedPassword;
            await userRepo.save(user);
            return res.json({ message: "Senha atualizada." });
        } catch (error) {
            console.error("Erro ao resetar senha:", error);
            return res.status(500).json({ message: "Erro interno." });
        }
    }
}

export default new AuthController();
