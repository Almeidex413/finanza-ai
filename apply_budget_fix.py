#!/usr/bin/env python3
"""
Script para aplicar correção de persistência de orçamentos
Substitui o módulo de budget no app.js
"""

import re

# Ler o arquivo original
with open('static/js/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Ler o módulo corrigido
with open('budget_module_fixed.js', 'r', encoding='utf-8') as f:
    new_budget_module = f.read()

# Padrão para encontrar o módulo de budget antigo
pattern = r'// ============================================================\n// BUDGET MODULE\n// ============================================================\n\nlet budgets = \{\};.*?(?=\n// ============================================================\n// INIT\n// ============================================================)'

# Substituir
new_content = re.sub(
    pattern,
    new_budget_module.strip() + '\n\n',
    content,
    flags=re.DOTALL
)

# Salvar
with open('static/js/app.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("✅ Correção aplicada com sucesso!")
print("📝 Módulo de orçamento agora usa API para persistência")
