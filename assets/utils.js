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
            console.log('Auto-sync ativado, salvando no GitHub...');
            GitHubSync.debouncedSaveNow();
        } else {
            console.log('Auto-sync desativado ou não configurado');
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
    
    // Salvar token no GitHub para sincronização entre dispositivos
    async saveTokenToGitHub(token) {
        const url = `https://api.github.com/repos/${this.cfg.repo}/contents/neon-crm-token.json`;
        const tokenData = {
            token: token,
            updatedAt: new Date().toISOString(),
            device: navigator.userAgent
        };
        const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(tokenData, null, 2))));
        // Prepare body without sha initially
        const body = { 
            message: `Neon CRM: Token atualizado - ${new Date().toISOString()}`, 
            content: b64, 
            branch: this.cfg.branch || 'main' 
        };
        // Try to get existing file SHA to avoid 409 conflict
        try {
            const existing = await fetch(`${url}?ref=${encodeURIComponent(this.cfg.branch || 'main')}`, { headers: this.headers() });
            if (existing.ok) {
                const data = await existing.json();
                if (data.sha) {
                    body.sha = data.sha;
                }
            }
        } catch (e) {
            // ignore errors, will attempt create without sha
        }
        console.log('Saving token to GitHub with body:', body);
        const res = await fetch(url, { 
            method: 'PUT', 
            headers: { ...this.headers(), 'Content-Type': 'application/json' }, 
            body: JSON.stringify(body) 
        });
        if (!res.ok) {
            const errText = await res.text();
            console.error('Error saving token to GitHub:', res.status, errText);
            throw new Error('Falha ao salvar token no GitHub: ' + res.status + ' - ' + errText);
        }
        const data = await res.json();
        this.cfg.token = token;
        this.save();
        console.log('Token saved successfully');
    },
    
    // Carregar token do GitHub
    async loadTokenFromGitHub() {
        try {
            const url = `https://api.github.com/repos/${this.cfg.repo}/contents/neon-crm-token.json?ref=${encodeURIComponent(this.cfg.branch || 'main')}`;
            const res = await fetch(url, { headers: this.headers() });
            
            if (res.ok) {
                const data = await res.json();
                const tokenData = JSON.parse(atob((data.content || '').replace(/\n/g, '')));
                this.cfg.token = tokenData.token;
                this.save();
                console.log('Token carregado do GitHub');
                return true;
            }
        } catch (error) {
            console.log('Token não encontrado no GitHub ou erro ao carregar');
        }
        return false;
    },
    
    async fetchFile() {
        const url = `https://api.github.com/repos/${this.cfg.repo}/contents/neon-crm-data.json?ref=${encodeURIComponent(this.cfg.branch || 'main')}`;
        console.log('Buscando arquivo:', url);
        const res = await fetch(url, { headers: this.headers() });
        if (res.status === 404) {
            console.log('Arquivo não encontrado, será criado');
            return { content: null, sha: null };
        }
        if (!res.ok) {
            console.error('Erro ao buscar arquivo:', res.status, res.statusText);
            throw new Error('Falha ao buscar arquivo: ' + res.status);
        }
        const data = await res.json();
        const content = atob((data.content || '').replace(/\n/g, ''));
        console.log('Arquivo encontrado, SHA:', data.sha);
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
        if (this.cfg.lastSha) {
            body.sha = this.cfg.lastSha;
            console.log('Usando SHA existente:', this.cfg.lastSha);
        } else {
            console.log('Primeira vez salvando, sem SHA');
        }
        
        console.log('Salvando arquivo no GitHub...');
        const res = await fetch(url, { 
            method: 'PUT', 
            headers: { ...this.headers(), 'Content-Type': 'application/json' }, 
            body: JSON.stringify(body) 
        });
        
        if (!res.ok) {
            const errorText = await res.text();
            console.error('Erro ao salvar no GitHub:', res.status, errorText);
            throw new Error('Falha ao salvar no GitHub: ' + res.status + ' - ' + errorText);
        }
        const data = await res.json();
        this.cfg.lastSha = data.content?.sha || this.cfg.lastSha;
        this.save();
        console.log('Arquivo salvo com sucesso, novo SHA:', this.cfg.lastSha);
    },
    
    async saveNow() {
        if (!this.cfg.repo || !this.cfg.token) {
            console.log('GitHub Sync não configurado');
            return;
        }
        
        try {
            console.log('Iniciando sincronização com GitHub...');
            const str = JSON.stringify(Store.data, null, 2);
            if (!this.cfg.lastSha) {
                try {
                    console.log('Buscando SHA do arquivo existente...');
                    const { sha } = await this.fetchFile();
                    this.cfg.lastSha = sha || '';
                    this.save();
                } catch (error) {
                    console.log('Arquivo não existe ainda, será criado');
                }
            }
            await this.saveFile(str);
            console.log('Dados sincronizados com GitHub com sucesso');
            toast('Dados sincronizados com GitHub', 'success');
        } catch (err) {
            console.error('Erro ao sincronizar com GitHub:', err);
            toast('Erro ao sincronizar com GitHub: ' + err.message, 'error');
            
            // Se o erro for de autenticação, marcar para reconfiguração
            if (err.message.includes('401') || err.message.includes('403')) {
                console.log('Token pode ter expirado, marcando para reconfiguração');
                this.cfg.token = null;
                this.save();
            }
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
        // Carregar dados do GitHub ao iniciar, se possível
        (async () => {
            try {
                const { content } = await GitHubSync.fetchFile();
                if (content) {
                    Store.data = JSON.parse(content);
                    console.log('Dados carregados do GitHub');
                    // If this is the first load after sync, force a reload to ensure all scripts see the data
                    if (!localStorage.getItem('github-sync-reloaded')) {
                        localStorage.setItem('github-sync-reloaded', 'true');
                        console.log('Forçando recarregamento da página para aplicar dados sincronizados');
                        window.location.reload();
                    }
                } else {
                    console.log('Nenhum dado encontrado no GitHub, usando localStorage');
                }
            } catch (e) {
                console.error('Erro ao carregar dados do GitHub:', e);
                console.log('Continuando com dados locais');
            }
        })();
        
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
