# Documentação Técnica do Projeto "Maximizze"

Este documento contém todo o contexto necessário para um agente de IA ou desenvolvedor entender a arquitetura, banco de dados e integração do projeto.

---

## 1. Visão Geral
O **Maximizze** é uma plataforma de e-commerce/marketplace mobile.
- **Backend:** API RESTful em Node.js (Express + TypeORM + MySQL).
- **Frontend:** App Mobile em React Native (Expo + Expo Router).
- **Objetivo:** Conectar vendedores ("seller") e clientes ("customer").

---

## 2. Backend (API)

### Configuração do Banco de Dados (`src/config/database.ts`)
Utiliza MySQL com TypeORM. A opção `synchronize: true` está ativa, o que cria as tabelas automaticamente.
- **Host/Port/User/Pass/DB:** Definidos via variáveis de ambiente (`.env`).

### Modelagem de Dados (Entities)

#### **User (`src/models/User.ts`)**
Tabela: `users`
- **Campos:** `id`, `email`, `password`, `name`, `avatar`, `description`, `cpf`, `phone`, `zip_code`.
- **Role:** Enum `seller` ou `customer`.
- **Status:** `is_active` (boolean).

#### **Product (`src/models/Product.ts`)**
Tabela: `products`
- **Campos:** `id`, `name`, `description`, `price`, `stock_quantity`, `image`.
- **Relacionamento:** Pertence a um `User` (Seller). `seller_id`.

#### **Order (`src/models/Order.ts`)**
Tabela: `orders`
- **Campos:** `id`, `total_amount`, `status` (pending, paid, shipped), `address`.
- **Relacionamento:** Pertence a um `User` (Customer). `customer_id`.
- **Itens:** Possui vários `OrderItems`.

#### **OrderItem (`src/models/OrderItem.ts`)**
Tabela: `order_items`
- **Campos:** `quantity`, `unit_price`.
- **Relacionamento:** Liga `Order` e `Product`.

### Rotas da API (`src/routes/`)

#### Autenticação (`/api/auth`)
- `POST /register`: Criar conta.
- `POST /login`: Login (retorna JWT).
- `PUT /profile`: Atualizar perfil (Logado).
- `GET /me`: Dados do usuário logado.

#### Produtos (`/api/products`)
- `POST /`: Criar produto (Logado).
- `GET /`: Listar produtos (Público).
- `PUT /:id`: Editar produto.
- `DELETE /:id`: Remover produto.

#### Pedidos (`/api/orders`)
- `POST /`: Criar novo pedido (Compra).
- `GET /my-orders`: Histórico de compras do cliente.
- `GET /all`: Histórico de vendas do vendedor.
- `GET /stats`: Estatísticas para o dashboard.
- `PUT /:id/status`: Atualizar status do pedido.

---

## 3. Frontend (Mobile)

### Estrutura de Navegação (Expo Router)
A pasta `app/` define as rotas:
- `(tabs)/`: Navegação principal por abas.
- `index.tsx`: Tela inicial / Login.
- `register.tsx`: Tela de cadastro.
- `add-product.tsx`: Tela de adicionar produto.
- `seller-orders.tsx`: Tela de gestão de vendas.

### Integração com API (`src/services/api.js`)
Utiliza `axios` para requisições HTTP.

**IMPORTANTE:** O IP do backend está hardcoded.
```javascript
const api = axios.create({
  baseURL: 'http://192.168.5.11:3000/api', // <--- VERIFICAR ESSE IP NA REDE LOCAL
});
```
Possui um interceptor que injeta o token JWT do `AsyncStorage` no header `Authorization`.

---

## 4. Como Rodar o Projeto

### Backend
1. Certifique-se que o MySQL está rodando.
2. Configure o `.env`.
3. Instale dependências: `npm install`.
4. Rode em desenvolvimento: `npm run dev`.

### Frontend
1. Configure o IP correto em `src/services/api.js`.
2. Instale dependências: `npm install`.
3. Rode o Expo: `npm start`.
