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

    if (tab === 'login') {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.style.display = 'flex';
        registerForm.style.display = 'none';
    } else {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        registerForm.style.display = 'flex';
        loginForm.style.display = 'none';
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
            <div class="transaction-amount ${tx.type}">
                ${tx.type === 'income' ? '+' : '-'}R$ ${tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
        </div>
    `).join('');
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
