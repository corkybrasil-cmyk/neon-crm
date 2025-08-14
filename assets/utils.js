// Utilitários compartilhados
const $$ = (selector) => document.querySelector(selector);
const $$$ = (selector) => document.querySelectorAll(selector);

// Sistema de armazenamento
const Store = {
    data: {},
    save() {
        localStorage.setItem('neon-crm-data', JSON.stringify(this.data));
    }
};
// Expose Store globally so other scripts (e.g., dashboard.js) can use the same instance
window.Store = Store;

// Sistema de toast
function toast(msg, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = msg;
    toast.style.position = 'fixed';
    toast.style.bottom = '16px';
    toast.style.right = '16px';
    toast.style.padding = '10px 14px';
    toast.style.background = 'var(--card)';
    toast.style.border = '1px solid var(--muted)';
    toast.style.borderRadius = '12px';
    toast.style.zIndex = '100';
    toast.style.color = 'var(--text)';
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    }, 100);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
}

// Configurações do GitHub Sync


// Funções utilitárias
const uid = () => Math.random().toString(36).slice(2, 9);
const todayISO = () => new Date().toISOString();
const fmtBRL = v => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const toDateOnly = (d) => new Date(new Date(d).toDateString());
const inRange = (d, a, b) => {
    const x = toDateOnly(d).getTime();
    return x >= toDateOnly(a).getTime() && x <= toDateOnly(b).getTime();
};

// Sistema de autenticação
function checkAuth() {
    const isLoggedIn = localStorage.getItem('neon-crm-logged-in');
    if (isLoggedIn !== 'true') {
        window.location.href = 'index.html';
    }
}

// Navegação entre páginas
function navigateTo(page) {
    window.location.href = page + '.html';
}

// Logout
function logout() {
    localStorage.removeItem('neon-crm-logged-in');
    localStorage.removeItem('neon-crm-username');
    window.location.href = 'index.html';
}

// Modal
function openModal(title, html) {
    $$('#modalTitle').textContent = title;
    $$('#modalBody').innerHTML = html;
    $$('#modal').style.display = 'flex';
}

function closeModal() {
    $$('#modal').style.display = 'none';
    $$('#modalBody').innerHTML = '';
}

// Função ready – garante que o CRM só será exibido depois que os dados do GitHub estiverem disponíveis
function ready() {
    const local = localStorage.getItem('neon-crm-data');
    if (local) {
        try {
            Store.data = JSON.parse(local);
            console.log('Dados carregados do localStorage');
        } catch (e) {
            console.error('Erro ao carregar dados do localStorage:', e);
            Store.data = {};
        }
    } else {
        Store.data = {};
        console.warn('Nenhum dado local disponível, inicializando Store.data vazio');
    }

    // Ensure required arrays exist
    if (!Array.isArray(Store.data.leads)) {
        Store.data.leads = [];
        console.log('Inicializando array de leads');
    }
    if (!Array.isArray(Store.data.users)) {
        Store.data.users = [];
        console.log('Inicializando array de usuários');
    }

    Store.save();
    window.CRM_READY = true;
    console.log('Página pronta (ready)');
    window.dispatchEvent(new Event('crmReady'));
}
window.ready = ready;

// Inicializar modal e GitHub Sync
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        // Inicia o CRM (carrega dados e marca ready)
        ready();
        // Configurar modal (mantém código existente)
        if ($$('#modalClose')) {
            $$('#modalClose').onclick = closeModal;
        }
        if ($$('#modal')) {
            window.addEventListener('keydown', e => {
                if (e.key === 'Escape') closeModal();
            });
            window.addEventListener('click', e => {
                if (e.target === $$('#modal')) closeModal();
            });
        }
    });
}

// Initialize users array if not present
if (!Store.data.users) {
    Store.data.users = [];
    console.log('Inicializando array de usuários');
}
