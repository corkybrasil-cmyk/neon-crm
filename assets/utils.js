// Utilitários compartilhados
const $$ = (selector) => document.querySelector(selector);
const $$$ = (selector) => document.querySelectorAll(selector);

// Sistema de armazenamento
const Store = {
    data: JSON.parse(localStorage.getItem('neon-crm-data') || '{}'),
    save() {
        localStorage.setItem('neon-crm-data', JSON.stringify(this.data));
        // Auto-sync com GitHub se configurado
        if (GitHubSync.cfg.auto && GitHubSync.cfg.token && GitHubSync.cfg.repo) {
            GitHubSync.debouncedSaveNow();
        }
    }
};

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
const GitHubSync = {
    cfg: JSON.parse(localStorage.getItem('neon-crm-github-sync') || '{}'),
    
    // Configuração automática com as credenciais fornecidas
    setupAutoSync() {
        if (!this.cfg.repo) {
            this.cfg = {
                repo: 'corkybrasil-cmyk/neon-crm',
                token: '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',
                branch: 'main',
                auto: true,
                lastSha: null
            };
            this.save();
            console.log('GitHub Auto-Sync configurado automaticamente');
        }
    },
    save() {
        localStorage.setItem('neon-crm-github-sync', JSON.stringify(this.cfg));
    },
    
    headers() {
        const h = { 'Accept': 'application/vnd.github+json' };
        if (this.cfg.token) h['Authorization'] = 'Bearer ' + this.cfg.token;
        return h;
    },
    
    async fetchFile() {
        const url = `https://api.github.com/repos/${this.cfg.repo}/contents/neon-crm-data.json?ref=${encodeURIComponent(this.cfg.branch || 'main')}`;
        const res = await fetch(url, { headers: this.headers() });
        if (res.status === 404) return { content: null, sha: null };
        if (!res.ok) throw new Error('Falha ao buscar arquivo: ' + res.status);
        const data = await res.json();
        const content = atob((data.content || '').replace(/\n/g, ''));
        return { content, sha: data.sha };
    },
    
    async saveFile(str) {
        const url = `https://api.github.com/repos/${this.cfg.repo}/contents/neon-crm-data.json`;
        const b64 = btoa(unescape(encodeURIComponent(str)));
        const body = { 
            message: `Neon CRM sync: ${new Date().toISOString()}`, 
            content: b64, 
            branch: this.cfg.branch || 'main' 
        };
        if (this.cfg.lastSha) body.sha = this.cfg.lastSha;
        
        const res = await fetch(url, { 
            method: 'PUT', 
            headers: { ...this.headers(), 'Content-Type': 'application/json' }, 
            body: JSON.stringify(body) 
        });
        
        if (!res.ok) throw new Error('Falha ao salvar no GitHub: ' + res.status);
        const data = await res.json();
        this.cfg.lastSha = data.content?.sha || this.cfg.lastSha;
        this.save();
    },
    
    async saveNow() {
        if (!this.cfg.repo || !this.cfg.token) return;
        
        try {
            const str = JSON.stringify(Store.data, null, 2);
            if (!this.cfg.lastSha) {
                try {
                    const { sha } = await this.fetchFile();
                    this.cfg.lastSha = sha || '';
                    this.save();
                } catch (_) {}
            }
            await this.saveFile(str);
            console.log('Dados sincronizados com GitHub');
        } catch (err) {
            console.error('Erro ao sincronizar com GitHub:', err);
        }
    },
    
    debouncedSaveNow: (() => {
        let t;
        return () => {
            clearTimeout(t);
            t = setTimeout(() => GitHubSync.saveNow(), 1200);
        };
    })()
};

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

// Inicializar modal e GitHub Sync
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        // Configurar GitHub Auto-Sync
        GitHubSync.setupAutoSync();
        
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
