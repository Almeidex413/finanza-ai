// ============================================================
// BUDGET MODULE - WITH API PERSISTENCE
// ============================================================

async function loadBudgetView() {
    try {
        // Get budgets from API
        const budgetRes = await fetch(`${API_BASE}/budgets`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const budgetsData = await budgetRes.json();

        // Get transactions to calculate spending
        const txRes = await fetch(`${API_BASE}/transactions`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const transactions = await txRes.json();

        renderBudgetView(transactions, budgetsData);
    } catch (error) {
        console.error('Error loading budget:', error);
    }
}

function renderBudgetView(transactions, budgetsData) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyExpenses = transactions.filter(t =>
        t.type === 'expense' && new Date(t.created_at) >= startOfMonth
    );

    // Calculate spending by category
    const spendingByCategory = {};
    monthlyExpenses.forEach(tx => {
        if (!spendingByCategory[tx.category]) {
            spendingByCategory[tx.category] = 0;
        }
        spendingByCategory[tx.category] += tx.amount;
    });

    // Calculate totals
    let totalBudget = 0;
    let totalSpent = 0;

    budgetsData.forEach(budget => {
        totalBudget += budget.limit;
        totalSpent += spendingByCategory[budget.category] || 0;
    });

    // Update summary
    document.getElementById('total-budget').textContent =
        'R$ ' + totalBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    document.getElementById('total-spent').textContent =
        'R$ ' + totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    document.getElementById('total-remaining').textContent =
        'R$ ' + (totalBudget - totalSpent).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

    // Render budget items
    const container = document.getElementById('budget-items-container');

    if (budgetsData.length === 0) {
        container.innerHTML = `
            <div class="budget-empty">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                </svg>
                <p>Nenhum orçamento configurado ainda</p>
                <p style="font-size: 13px; margin-top: 8px;">Clique em "+ Nova Categoria" para começar</p>
            </div>
        `;
        return;
    }

    container.innerHTML = budgetsData.map(budget => {
        const category = budget.category;
        const limit = budget.limit;
        const spent = spendingByCategory[category] || 0;
        const percentage = limit > 0 ? (spent / limit) * 100 : 0;

        let status = 'ok';
        if (percentage >= 100) status = 'danger';
        else if (percentage >= 75) status = 'warning';

        return `
            <div class="budget-item" id="budget-item-${category}">
                <div class="budget-item-header">
                    <span class="budget-category-name">${category}</span>
                    <div class="budget-values">
                        <span class="budget-spent-value">R$ ${spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        <span class="budget-limit-value">/ R$ ${limit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>
                <div class="budget-progress-container">
                    <div class="budget-progress-bar">
                        <div class="budget-progress-fill status-${status}" style="width: ${Math.min(percentage, 100)}%"></div>
                    </div>
                    <div class="budget-percentage status-${status}">${percentage.toFixed(1)}% utilizado</div>
                </div>
                <div class="budget-actions">
                    <button onclick="editBudgetInline('${category}', ${limit})" class="btn-edit-budget">Editar Limite</button>
                    <button onclick="deleteBudget('${category}')" class="btn-delete-budget">Excluir</button>
                </div>
            </div>
        `;
    }).join('');
}

function showAddBudgetForm() {
    document.getElementById('add-budget-form').style.display = 'block';
}

function hideAddBudgetForm() {
    document.getElementById('add-budget-form').style.display = 'none';
    document.getElementById('budget-form').reset();
}

async function handleBudgetSubmit(e) {
    e.preventDefault();

    const category = document.getElementById('budget-category').value;
    const limit = parseFloat(document.getElementById('budget-limit').value);

    try {
        const response = await fetch(`${API_BASE}/budgets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ category, limit })
        });

        if (response.ok) {
            hideAddBudgetForm();
            loadBudgetView();
        } else {
            const data = await response.json();
            alert(data.error || 'Erro ao criar orçamento');
        }
    } catch (error) {
        alert('Erro de conexão ao salvar orçamento');
    }
}

function editBudgetInline(category, currentLimit) {
    const item = document.getElementById(`budget-item-${category}`);
    const actionsDiv = item.querySelector('.budget-actions');
    actionsDiv.innerHTML = `
        <div class="budget-edit-inline">
            <input type="number" step="0.01" id="edit-limit-${category}" value="${currentLimit}" placeholder="Novo limite">
            <button onclick="saveBudgetEdit('${category}')" class="btn-save">Salvar</button>
            <button onclick="loadBudgetView()" class="btn-cancel">Cancelar</button>
        </div>
    `;
}

async function saveBudgetEdit(category) {
    const newLimit = parseFloat(document.getElementById(`edit-limit-${category}`).value);

    if (newLimit <= 0 || isNaN(newLimit)) {
        alert('Digite um valor válido');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/budgets/${encodeURIComponent(category)}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ limit: newLimit })
        });

        if (response.ok) {
            loadBudgetView();
        } else {
            alert('Erro ao atualizar orçamento');
        }
    } catch (error) {
        alert('Erro de conexão ao atualizar orçamento');
    }
}

async function deleteBudget(category) {
    if (!confirm(`Tem certeza que deseja excluir o orçamento de ${category}?`)) return;

    try {
        const response = await fetch(`${API_BASE}/budgets/${encodeURIComponent(category)}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            loadBudgetView();
        } else {
            alert('Erro ao excluir orçamento');
        }
    } catch (error) {
        alert('Erro de conexão ao excluir orçamento');
    }
}
