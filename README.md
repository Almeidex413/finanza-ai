# 🚀 Finanza.ai - Gestão Financeira Inteligente

## 📋 Sobre o Projeto

**Finanza.ai** é uma aplicação web de gestão financeira pessoal que utiliza **Economia Comportamental** e **Inteligência Artificial** (Google Gemini) para ajudar usuários a controlarem suas finanças de forma inteligente.

### 🎯 Funcionalidades

- ✅ **Autenticação Segura** (JWT + bcrypt)
- ✅ **Dashboard Financeiro** com métricas em tempo real
- ✅ **Ponto de Ruptura** - Alerta quando o saldo está próximo de zero
- ✅ **Gestão de Transações** (receitas e despesas)
- ✅ **Consultor Financial IA** - Chat powered by Google Gemini
- ✅ **Sistema de Fallback** - MongoDB ou MockDB (memória)

---

## 🛠️ Stack Tecnológica

### Backend
- **Python 3.8+**
- **Flask** - Framework web
- **MongoDB/MockDB** - Banco de dados com fallback
- **JWT** - Autenticação
- **bcrypt** - Hash de senhas
- **Google Gemini API** - IA para consultoria financeira

### Frontend
- **HTML5 + CSS3** - Interface moderna
- **JavaScript Vanilla** - Sem frameworks
- **Design Responsivo** - Mobile-first

---

## 📦 Instalação e Configuração

### 1. Pré-requisitos
- Python 3.8 ou superior
- Conta Google (para Gemini API)
- *(Opcional)* Conta MongoDB Atlas

### 2. Instalar Dependências Python

```bash
pip install -r requirements.txt
```

### 3. Configurar Variáveis de Ambiente

Edite o arquivo `.env` na raiz do projeto:

```env
# OBRIGATÓRIO
GEMINI_API_KEY=sua_chave_gemini_aqui
SECRET_KEY=uma_chave_secreta_forte_aleatoria

# OPCIONAL (se não configurar, usará MockDB em memória)
# MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/finanza
```

#### 🔑 Como Obter a Chave Gemini API

1. Acesse: https://aistudio.google.com/app/apikey
2. Faça login com sua conta Google
3. Clique em **"Create API key"**
4. Copie a chave e adicione no `.env`

### 4. Executar o Servidor

```bash
python app.py
```

O servidor estará disponível em: **http://localhost:5000**

---

## 🗄️ Configuração de Banco de Dados

### Opção A: MockDB (Padrão - Mais Simples)

**Não faça nada!** 

Se você não configurar `MONGO_URI` no `.env`, o sistema automaticamente usará um banco de dados em memória (MockDB).

**Vantagens:**
- ✅ Zero configuração
- ✅ Funciona imediatamente
- ✅ Perfeito para testes

**Desvantagens:**
- ❌ Dados são perdidos ao reiniciar o servidor
- ❌ Não suporta múltiplas instâncias

### Opção B: MongoDB Atlas (Produção)

Para persistência real, siga estes passos:

1. **Criar Conta no MongoDB Atlas**
   - Acesse: https://www.mongodb.com/cloud/atlas/register
   - Crie um cluster gratuito (tier M0)

2. **Configurar Acesso**
   - Vá em "Database Access" → Crie um usuário com senha
   - Vá em "Network Access" → Adicione `0.0.0.0/0` (ou seu IP)

3. **Obter Connection String**
   - Clique em "Connect" no seu cluster
   - Escolha "Connect your application"
   - Copie a string de conexão

4. **Adicionar no `.env`**
   ```env
   MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/finanza?retryWrites=true&w=majority
   ```

---

## 📖 Como Usar

### 1. **Criar Conta**
- Acesse http://localhost:5000
- Clique em "Criar Conta"
- Insira seu email e senha
- Você será automaticamente logado

### 2. **Dashboard**
- Visualize seu saldo atual
- Veja receitas e despesas do mês
- Receba alertas de "Ponto de Ruptura"

### 3. **Adicionar Transações**
- Clique em "Nova Transação"
- Escolha: Receita ou Despesa
- Preencha valor e categoria
- Salve

### 4. **Consultor IA**
- Clique em "Consultor IA"
- Faça perguntas sobre suas finanças
- Receba conselhos personalizados baseados em seus dados

---

## 🔒 Segurança

### Implementações de Segurança

✅ **Senhas criptografadas** com bcrypt  
✅ **Autenticação JWT** com expiração de 24h  
✅ **Chave Gemini API** protegida no backend  
✅ **CORS** configurado corretamente  
✅ **Secret key** configurável via .env  

### Boas Práticas

- 🔴 **NUNCA** commite o arquivo `.env`
- 🔴 **Mude** o `SECRET_KEY` em produção
- 🔴 **Use HTTPS** em produção
- ✅ **MongoDB**: Configure IP Whitelist adequadamente

---

## 📁 Estrutura do Projeto

```
finanza.ai/
├── app.py                 # Backend Flask (API + Servidor)
├── requirements.txt       # Dependências Python
├── .env                   # Variáveis de ambiente (NÃO commitar)
├── .env.example           # Exemplo de configuração
│
├── templates/
│   └── index.html         # Frontend HTML
│
├── static/
│   ├── css/
│   │   └── style.css      # Estilos modernos
│   └── js/
│       └── app.js         # Lógica frontend + API calls
│
└── README.md              # Este arquivo
```

---

## 🚀 Deploy (Produção)

### Opções de Deploy

1. **Heroku** (Fácil)
2. **Railway** (Moderno)
3. **Google Cloud Run** (Escalável)
4. **VPS** (Controle total)

### Checklist de Deploy

- [ ] Configurar `SECRET_KEY` forte e único
- [ ] Configurar MongoDB Atlas (não usar MockDB)
- [ ] Configurar variáveis de ambiente no servidor
- [ ] Desativar `debug=True` no Flask
- [ ] Configurar HTTPS
- [ ] Configurar CORS apenas para domínio específico

---

## 🔧 Desenvolvimento

### Testar API Diretamente

```bash
# Registrar usuário
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@finanza.ai","password":"123456"}'

# Login (retorna JWT)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@finanza.ai","password":"123456"}'

# Adicionar transação (use o token retornado)
curl -X POST http://localhost:5000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{"type":"expense","amount":50.00,"category":"Alimentação"}'
```

---

## 📊 API Endpoints

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/api/auth/register` | Criar conta | ❌ |
| POST | `/api/auth/login` | Login | ❌ |
| GET | `/api/transactions` | Listar transações | ✅ |
| POST | `/api/transactions` | Adicionar transação | ✅ |
| GET | `/api/budgets` | Listar orçamentos | ✅ |
| GET | `/api/user/balance` | Obter saldo | ✅ |
| POST | `/api/chat` | Chat com IA | ✅ |

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Add: MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

---

## 📝 Licença

Este projeto é de código aberto e está sob a licença MIT.

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique se todas as dependências estão instaladas
2. Confirme que o `.env` está configurado corretamente
3. Verifique se a chave Gemini API é válida
4. Veja os logs do servidor Flask para erros

---

## 🎯 Roadmap

- [ ] Gráficos interativos (Chart.js)
- [ ] Exportar relatórios PDF
- [ ] Categorias personalizadas
- [ ] Metas financeiras
- [ ] Notificações push
- [ ] App mobile (React Native)

---

**Desenvolvido com ❤️ usando Python + Flask + Google Gemini**
