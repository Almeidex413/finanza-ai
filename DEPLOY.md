# 🚀 Guia de Deploy para Produção - Finanza.ai

## ✅ Checklist Pré-Deploy

### 1. Configuração de Ambiente
- [ ] Copiar `.env.production` para `.env`
- [ ] Configurar `SECRET_KEY` com valor seguro e único
- [ ] Configurar `MONGO_URI` com string de conexão do MongoDB
- [ ] Configurar `GEMINI_API_KEY` com chave da API do Google
- [ ] Definir `FLASK_DEBUG=False`

### 2. Dependências
```bash
pip install -r requirements.txt
```

### 3. Servidor WSGI (Produção)

#### Opção A: Gunicorn (Linux/Mac)
```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

#### Opção B: Waitress (Windows/Cross-platform)
```bash
waitress-serve --port=5000 app:app
```

### 4. Deploy no Heroku
O projeto já está configurado com `Procfile`. Basta fazer:
```bash
git push heroku main
```

## ⚠️ Pontos Importantes

### Segurança
1. **NUNCA** commitar o arquivo `.env` no Git
2. Usar HTTPS em produção
3. Configurar CORS adequadamente para seu domínio
4. Implementar rate limiting (recomendado: Flask-Limiter)

### Performance
1. Usar servidor WSGI (Gunicorn/Waitress) - **NÃO** usar Flask development server
2. Configurar número adequado de workers (recomendado: 2-4 x CPU cores)
3. Usar CDN para assets estáticos (opcional)

### Banco de Dados
1. MongoDB Atlas (recomendado para produção)
2. Configurar índices para melhor performance
3. Fazer backup regular dos dados

## 📊 Monitoramento

### Logs
- Configurar logging adequado
- Usar serviços como Sentry para monitoramento de erros

### Métricas
- Monitorar uso de CPU/memória
- Acompanhar tempo de resposta das APIs
- Verificar taxa de erros

## 🔄 Atualizações

Para atualizar a aplicação em produção:
```bash
git pull origin main
pip install -r requirements.txt
# Reiniciar servidor
```

## 📝 Notas Adicionais

### Funcionalidades Implementadas
✅ Autenticação JWT
✅ Gestão de transações
✅ Fricção cognitiva (alto risco + parcelamento)
✅ Módulo de orçamento (UI completa)
✅ Chat com IA (Gemini)
✅ Sistema de fallback (MockDB)

### Próximos Passos (Opcional)
- [ ] Integrar frontend de orçamento com API
- [ ] Adicionar testes automatizados
- [ ] Implementar rate limiting
- [ ] Adicionar validação robusta de dados
- [ ] Configurar CI/CD
