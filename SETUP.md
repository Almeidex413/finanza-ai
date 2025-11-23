# 🚀 Guia de Configuração - Finanza.ai

## 📋 Pré-requisitos
- Python 3.8+
- Node.js 16+
- (Opcional) Conta MongoDB Atlas

---

## 1️⃣ Configuração do Backend (Python/Flask)

### Instalar Dependências Python
```bash
pip install -r requirements.txt
```

### Configurar Variáveis de Ambiente

#### Opção A: Usar MockDB (Mais Simples - SEM MongoDB)
1. Copie o arquivo `.env.example` para `.env`:
   ```bash
   copy .env.example .env
   ```

2. Edite o arquivo `.env` e configure apenas:
   ```env
   GEMINI_API_KEY=sua_chave_aqui
   SECRET_KEY=uma_chave_secreta_aleatoria
   ```

3. **NÃO configure `MONGO_URI`** - o sistema usará MockDB automaticamente

#### Opção B: Usar MongoDB Atlas (Persistência Real)
1. Acesse https://www.mongodb.com/cloud/atlas/register
2. Crie um cluster gratuito (M0)
3. Vá em "Database Access" e crie um usuário
4. Vá em "Network Access" e adicione `0.0.0.0/0` (ou seu IP)
5. Clique em "Connect" → "Connect your application"
6. Copie a connection string

7. Edite o arquivo `.env`:
   ```env
   GEMINI_API_KEY=sua_chave_aqui
   SECRET_KEY=uma_chave_secreta_aleatoria
   MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/finanza?retryWrites=true&w=majority
   ```

### Obter Chave Gemini API
1. Acesse: https://aistudio.google.com/app/apikey
2. Clique em "Create API key"
3. Copie a chave e adicione no `.env`

### Testar o Backend
```bash
python app.py
```

O servidor deve iniciar em: `http://localhost:5000`

---

## 2️⃣ Configuração do Frontend (React/Vite)

### Instalar Dependências Node
```bash
npm install
```

### Iniciar o Frontend
```bash
npm run dev
```

O frontend deve abrir em: `http://localhost:3000`

---

## 3️⃣ Próximos Passos (Após Configuração)

Após confirmar que ambos estão rodando, vou:
1. ✅ Criar serviço de API para conectar frontend ao backend
2. ✅ Implementar tela de login/registro
3. ✅ Substituir localStorage por chamadas HTTP
4. ✅ Remover chave Gemini do cliente (segurança)
5. ✅ Conectar chat AI ao endpoint Flask

---

## 🔍 Troubleshooting

### Erro: ModuleNotFoundError
```bash
# Reinstale as dependências
pip install -r requirements.txt
```

### Erro: Port already in use
```bash
# Backend: mude a porta em app.py
app.run(debug=True, port=5001)

# Frontend: mude em vite.config.ts
server: { port: 3001 }
```

### MockDB vs MongoDB - Como Saber Qual Está Ativo?
No console do backend, você verá:
- **MockDB**: Nenhuma mensagem sobre MongoDB
- **MongoDB**: Log de conexão do PyMongo

---

## 📞 Status Atual

- [ ] Backend instalado e rodando
- [ ] Frontend instalado e rodando
- [ ] Variáveis de ambiente configuradas
- [ ] Integração frontend-backend (próximo passo)
