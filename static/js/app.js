// ============================================================
// Finanza.ai - Frontend JavaScript
// ============================================================

const API_BASE = '/api';
let authToken = localStorage.getItem('finanza_token');
let currentUser = null;

// ============================================================
// AUTH FUNCTIONS
// ============================================================

function switchTab(tab) {
    const loginTab = document.getElementById('tab-login');
    const registerTab = document.getElementById('tab-register');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const forgotForm = document.getElementById('forgot-form');
    const loginFooter = document.getElementById('login-footer');
    const authTabs = document.querySelector('.auth-tabs');

    // Reset displays
    loginForm.style.display = 'none';
    registerForm.style.display = 'none';
    forgotForm.style.display = 'none';

    if (tab === 'login') {
        authTabs.style.display = 'flex';
        loginFooter.style.display = 'block';
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.style.display = 'flex';
    } else if (tab === 'register') {
        authTabs.style.display = 'flex';
        loginFooter.style.display = 'none';
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        registerForm.style.display = 'flex';
    } else if (tab === 'forgot') {
        authTabs.style.display = 'none';
        loginFooter.style.display = 'none';
        forgotForm.style.display = 'block';
        // Reset steps
        document.getElementById('forgot-step-1').style.display = 'block';
        document.getElementById('forgot-step-2').style.display = 'none';
        document.getElementById('forgot-error').textContent = '';
        document.getElementById('forgot-error').classList.remove('show');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');

    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok && data.token) {
            authToken = data.token;
            localStorage.setItem('finanza_token', authToken);
            currentUser = { email };
            showApp();
        } else {
            errorEl.textContent = data.error || 'Erro ao fazer login';
            errorEl.classList.add('show');
        }
    } catch (error) {
        errorEl.textContent = 'Erro de conexão com servidor';
        errorEl.classList.add('show');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const errorEl = document.getElementById('register-error');

    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok && data.token) {
            authToken = data.token;
            localStorage.setItem('finanza_token', authToken);
            currentUser = { email };
            showApp();
        } else {
            errorEl.textContent = data.error || 'Erro ao criar conta';
            errorEl.classList.add('show');
        }
    } catch (error) {
        errorEl.textContent = 'Erro de conexão com servidor';
        errorEl.classList.add('show');
    }
}

async function handleForgotRequest() {
    const email = document.getElementById('forgot-email').value;
    const errorEl = document.getElementById('forgot-error');

    if (!email) {
        errorEl.textContent = 'Digite seu email';
        errorEl.classList.add('show');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (response.ok) {
            document.getElementById('forgot-step-1').style.display = 'none';
            document.getElementById('forgot-step-2').style.display = 'block';
            errorEl.textContent = '';
            errorEl.classList.remove('show');

            if (data.debug_code) {
                alert(`[MODO DEBUG] Seu código é: ${data.debug_code}`);
            }
        } else {
            errorEl.textContent = data.error || 'Erro ao enviar código';
            errorEl.classList.add('show');
        }
    } catch (error) {
        errorEl.textContent = 'Erro de conexão';
        errorEl.classList.add('show');
    }
}

async function handleResetSubmit() {
    const email = document.getElementById('forgot-email').value;
    const code = document.getElementById('forgot-code').value;
    const newPassword = document.getElementById('forgot-new-password').value;
    const errorEl = document.getElementById('forgot-error');

    if (!code || !newPassword) {
        errorEl.textContent = 'Preencha todos os campos';
        errorEl.classList.add('show');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code, new_password: newPassword })
        });

        if (response.ok) {
            alert('Senha redefinida com sucesso! Faça login.');
            switchTab('login');
        } else {
            const data = await response.json();
            errorEl.textContent = data.error || 'Erro ao redefinir senha';
            errorEl.classList.add('show');
        }
    } catch (error) {
        errorEl.textContent = 'Erro de conexão';
        errorEl.classList.add('show');
    }
}

function logout() {
    localStorage.removeItem('finanza_token');
    authToken = null;
    currentUser = null;
    document.getElementById('auth-screen').style.display = 'flex';
    document.getElementById('app-screen').style.display = 'none';
}

function showApp() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app-screen').style.display = 'block';
    document.getElementById('user-email').textContent = currentUser.email;
    loadDashboard();
    addWelcomeMessage();
}

// ============================================================
// NAVIGATION
// ============================================================

function showView(viewName) {
    // Hide all views
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    // Show selected view
    document.getElementById(`view-${viewName}`).classList.add('active');
    document.getElementById(`nav-${viewName}`).classList.add('active');

    if (viewName === 'dashboard') {
        loadDashboard();
    }
}

// ============================================================
// DASHBOARD
// ============================================================

async function loadDashboard() {
    try {
        // Get balance
        const balanceRes = await fetch(`${API_BASE}/user/balance`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const balanceData = await balanceRes.json();

        // Get transactions
        const txRes = await fetch(`${API_BASE}/transactions`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const transactions = await txRes.json();

        // Update UI
        updateBalance(balanceData.balance);
        updateStats(transactions);
        renderRecentTransactions(transactions);
        checkBreakPoint(balanceData.balance, transactions);
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

function updateBalance(balance) {
    const formatted = balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById('balance-value').textContent = formatted;

    if (balance < 0) {
        document.getElementById('balance-value').style.color = '#ef4444';
    } else {
        document.getElementById('balance-value').style.color = 'white';
    }
}

function updateStats(transactions) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyTx = transactions.filter(t => new Date(t.created_at) >= startOfMonth);

    const income = monthlyTx
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const expenses = monthlyTx
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    document.getElementById('monthly-income').textContent =
        'R$ ' + income.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

    document.getElementById('monthly-expenses').textContent =
        'R$ ' + expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

function checkBreakPoint(balance, transactions) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const daysPassed = Math.floor((now - startOfMonth) / (1000 * 60 * 60 * 24));

    const monthlyExpenses = transactions
        .filter(t => t.type === 'expense' && new Date(t.created_at) >= startOfMonth)
        .reduce((sum, t) => sum + t.amount, 0);

    const dailyBurnRate = daysPassed > 0 ? monthlyExpenses / daysPassed : 0;

    if (balance > 0 && dailyBurnRate > 0) {
        const daysToZero = Math.floor(balance / dailyBurnRate);

        if (daysToZero < 30) {
            const alertBox = document.getElementById('break-point-alert');
            document.getElementById('break-point-title').textContent =
                `⚠️ Ponto de Ruptura: ${daysToZero} dias`;
            document.getElementById('break-point-message').textContent =
                `Neste ritmo, seu saldo chegará a zero em ${daysToZero} dias.`;
            alertBox.style.display = 'flex';
        }
    }
}

function renderRecentTransactions(transactions) {
    const container = document.getElementById('recent-transactions');
    const recent = transactions.slice(-10).reverse();

    if (recent.length === 0) {
        container.innerHTML = '<p style="text-align:center; color: var(--slate-500); padding: 20px;">Nenhuma transação ainda</p>';
        return;
    }

    container.innerHTML = recent.map(tx => `
        <div class="transaction-item">
            <div class="transaction-info">
                <div class="transaction-category">${tx.category}</div>
                <div class="transaction-date">${new Date(tx.created_at).toLocaleDateString('pt-BR')}</div>
            </div>
            <div class="transaction-actions">
                <div class="transaction-amount ${tx.type}">
                    ${tx.type === 'income' ? '+' : '-'}R$ ${tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <button onclick="openEditModal('${tx._id}', '${tx.type}', ${tx.amount}, '${tx.category}')" class="btn-icon" title="Editar">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                </button>
                <button onclick="deleteTransaction('${tx._id}')" class="btn-icon delete" title="Excluir">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
}

// ============================================================
// EDIT MODAL
// ============================================================

function openEditModal(id, type, amount, category) {
    document.getElementById('edit-id').value = id;
    document.getElementById('edit-amount').value = amount;
    document.getElementById('edit-category').value = category;
    selectEditType(type);

    document.getElementById('edit-modal').style.display = 'flex';
}

function closeEditModal() {
    document.getElementById('edit-modal').style.display = 'none';
}

function selectEditType(type) {
    document.getElementById('edit-type').value = type;
    const expenseBtn = document.getElementById('edit-type-expense');
    const incomeBtn = document.getElementById('edit-type-income');

    if (type === 'expense') {
        expenseBtn.classList.add('active');
        incomeBtn.classList.remove('active');
    } else {
        incomeBtn.classList.add('active');
        expenseBtn.classList.remove('active');
    }
}

async function handleEditSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('edit-id').value;
    const type = document.getElementById('edit-type').value;
    const amount = parseFloat(document.getElementById('edit-amount').value);
    const category = document.getElementById('edit-category').value;

    try {
        const response = await fetch(`${API_BASE}/transactions/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ type, amount, category })
        });

        if (response.ok) {
            closeEditModal();
            loadDashboard();
        } else {
            alert('Erro ao atualizar transação');
        }
    } catch (error) {
        alert('Erro de conexão');
    }
}

async function deleteTransaction(txId) {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return;

    try {
        const response = await fetch(`${API_BASE}/transactions/${txId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            loadDashboard(); // Reload to update UI
        } else {
            alert('Erro ao excluir transação');
        }
    } catch (error) {
        alert('Erro de conexão');
    }
}

// ============================================================
// TRANSACTION FORM
// ============================================================

function selectType(type) {
    document.getElementById('tx-type').value = type;

    const expenseBtn = document.querySelector('.type-btn.expense');
    const incomeBtn = document.querySelector('.type-btn.income');

    if (type === 'expense') {
        expenseBtn.classList.add('active');
        incomeBtn.classList.remove('active');
    } else {
        incomeBtn.classList.add('active');
        expenseBtn.classList.remove('active');
    }
}

async function handleTransactionSubmit(e) {
    e.preventDefault();

    const type = document.getElementById('tx-type').value;
    const amount = parseFloat(document.getElementById('tx-amount').value);
    const category = document.getElementById('tx-category').value;

    try {
        const response = await fetch(`${API_BASE}/transactions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ type, amount, category })
        });

        if (response.ok) {
            // Reset form
            document.getElementById('transaction-form').reset();
            selectType('expense');

            // Go back to dashboard
            showView('dashboard');
        }
    } catch (error) {
        alert('Erro ao salvar transação');
    }
}

// ============================================================
// CHAT
// ============================================================

function addWelcomeMessage() {
    const messagesContainer = document.getElementById('chat-messages');
    messagesContainer.innerHTML = `
        <div class="message model">
            <div class="message-bubble">
                Olá! Sou o Finanza AI. Analisei seus dados financeiros. Como posso ajudar a otimizar seu fluxo de caixa hoje?
            </div>
        </div>
    `;
}

async function handleChatSubmit(e) {
    e.preventDefault();

    const input = document.getElementById('chat-input');
    const message = input.value.trim();

    if (!message) return;

    // Add user message
    addMessage('user', message);
    input.value = '';

    // Show typing indicator
    showTypingIndicator();

    try {
        const response = await fetch(`${API_BASE}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ message })
        });

        const data = await response.json();

        // Remove typing indicator
        removeTypingIndicator();

        if (response.ok) {
            addMessage('model', data.reply);
        } else {
            addMessage('model', 'Desculpe, houve um erro ao processar sua mensagem.');
        }
    } catch (error) {
        removeTypingIndicator();
        addMessage('model', 'Erro de conexão. Tente novamente.');
    }
}

function addMessage(role, text) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageEl = document.createElement('div');
    messageEl.className = `message ${role}`;
    messageEl.innerHTML = `<div class="message-bubble">${text}</div>`;
    messagesContainer.appendChild(messageEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showTypingIndicator() {
    const messagesContainer = document.getElementById('chat-messages');
    const indicator = document.createElement('div');
    indicator.id = 'typing-indicator';
    indicator.className = 'message model';
    indicator.innerHTML = `
        <div class="message-bubble typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    messagesContainer.appendChild(indicator);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}



// ============================================================
// INIT
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    // Auth form handlers
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);

    // Transaction form handler
    document.getElementById('transaction-form').addEventListener('submit', handleTransactionSubmit);
    document.getElementById('edit-form').addEventListener('submit', handleEditSubmit);

    // Chat form handler
    document.getElementById('chat-form').addEventListener('submit', handleChatSubmit);

    // Check if user is already logged in
    if (authToken) {
        // Verify token is still valid
        fetch(`${API_BASE}/user/balance`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        })
            .then(res => {
                if (res.ok) {
                    currentUser = { email: 'user@finanza.ai' }; // You might want to store this too
                    showApp();
                } else {
                    logout();
                }
            })
            .catch(() => logout());
    }
});
