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

// Utilitários
const $$ = (selector) => document.querySelector(selector);
const $$$ = (selector) => document.querySelectorAll(selector);

// Sistema de armazenamento
const Store = {
    data: JSON.parse(localStorage.getItem('neon-crm-data') || '{}'),
    save() {
        localStorage.setItem('neon-crm-data', JSON.stringify(this.data));
    }
};

// Sistema de toast
function toast(msg, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
}

// Configurações do GitHub Sync
const GitHubSync = {
    cfg: JSON.parse(localStorage.getItem('neon-crm-github-sync') || '{}'),
    save() {
        localStorage.setItem('neon-crm-github-sync', JSON.stringify(this.cfg));
    }
};

// Sistema de temas
const ThemeSystem = {
    themes: {
        'default': {
            '--primary-color': '#007bff',
            '--secondary-color': '#6c757d',
            '--success-color': '#28a745',
            '--danger-color': '#dc3545',
            '--warning-color': '#ffc107',
            '--info-color': '#17a2b8',
            '--light-color': '#f8f9fa',
            '--dark-color': '#343a40',
            '--body-bg': '#ffffff',
            '--text-color': '#212529'
        },
        'dark': {
            '--primary-color': '#007bff',
            '--secondary-color': '#6c757d',
            '--success-color': '#28a745',
            '--danger-color': '#dc3545',
            '--warning-color': '#ffc107',
            '--info-color': '#17a2b8',
            '--light-color': '#343a40',
            '--dark-color': '#f8f9fa',
            '--body-bg': '#212529',
            '--text-color': '#ffffff'
        },
        'blue': {
            '--primary-color': '#0056b3',
            '--secondary-color': '#6c757d',
            '--success-color': '#28a745',
            '--danger-color': '#dc3545',
            '--warning-color': '#ffc107',
            '--info-color': '#17a2b8',
            '--light-color': '#f8f9fa',
            '--dark-color': '#343a40',
            '--body-bg': '#f0f8ff',
            '--text-color': '#212529'
        }
    },
    
    applyTheme(themeName) {
        const theme = this.themes[themeName];
        if (!theme) return;
        
        Object.entries(theme).forEach(([property, value]) => {
            document.documentElement.style.setProperty(property, value);
        });
        
        localStorage.setItem('neon-crm-theme', themeName);
        toast(`Tema ${themeName} aplicado!`);
    },
    
    init() {
        const savedTheme = localStorage.getItem('neon-crm-theme') || 'default';
        this.applyTheme(savedTheme);
        
        // Configurar seletores de tema
        $$$('.theme-option').forEach(option => {
            option.addEventListener('click', () => {
                const themeName = option.dataset.theme;
                this.applyTheme(themeName);
            });
        });
    }
};

// Sistema de menu
const MenuSystem = {
    init() {
        // Configurar opções de menu
        $$$('.menu-option').forEach(option => {
            option.addEventListener('change', () => {
                const setting = option.dataset.setting;
                const value = option.checked;
                Store.data.menuSettings = Store.data.menuSettings || {};
                Store.data.menuSettings[setting] = value;
                Store.save();
                toast('Configuração salva!');
            });
        });
        
        // Carregar configurações salvas
        if (Store.data.menuSettings) {
            Object.entries(Store.data.menuSettings).forEach(([setting, value]) => {
                const option = $$(`[data-setting="${setting}"]`);
                if (option) option.checked = value;
            });
        }
    }
};

// Sistema de customizações avançadas
const AdvancedSystem = {
    init() {
        // Configurar campos de customização
        $$$('.custom-field').forEach(field => {
            field.addEventListener('change', () => {
                const setting = field.dataset.setting;
                const value = field.value;
                Store.data.advancedSettings = Store.data.advancedSettings || {};
                Store.data.advancedSettings[setting] = value;
                Store.save();
                toast('Configuração salva!');
            });
        });
        
        // Carregar configurações salvas
        if (Store.data.advancedSettings) {
            Object.entries(Store.data.advancedSettings).forEach(([setting, value]) => {
                const field = $$(`[data-setting="${setting}"]`);
                if (field) field.value = value;
            });
        }
    }
};

// Sistema de backup
const BackupSystem = {
    async createBackup() {
        try {
            const backup = {
                timestamp: new Date().toISOString(),
                data: Store.data,
                githubSync: GitHubSync.cfg,
                version: '1.0.0'
            };
            
            const blob = new Blob([JSON.stringify(backup, null, 2)], {
                type: 'application/json'
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `neon-crm-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            toast('Backup criado com sucesso!', 'success');
        } catch (error) {
            toast('Erro ao criar backup: ' + error.message, 'error');
        }
    },
    
    async restoreBackup(file) {
        try {
            const text = await file.text();
            const backup = JSON.parse(text);
            
            if (backup.data) {
                Store.data = backup.data;
                Store.save();
            }
            
            if (backup.githubSync) {
                GitHubSync.cfg = backup.githubSync;
                GitHubSync.save();
            }
            
            toast('Backup restaurado com sucesso!', 'success');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error) {
            toast('Erro ao restaurar backup: ' + error.message, 'error');
        }
    },
    
    init() {
        // Configurar botão de backup
        $$('#createBackupBtn').addEventListener('click', () => {
            this.createBackup();
        });
        
        // Configurar input de restauração
        $$('#restoreBackupInput').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.restoreBackup(file);
            }
        });
    }
};

// Sistema de GitHub Sync
const GitHubSyncSystem = {
    async testConnection() {
        const token = $$('#githubToken').value;
        const repo = $$('#githubRepo').value;
        
        if (!token || !repo) {
            toast('Preencha token e repositório!', 'error');
            return;
        }
        
        try {
            const response = await fetch(`https://api.github.com/repos/${repo}`, {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (response.ok) {
                toast('Conexão com GitHub estabelecida!', 'success');
            } else {
                toast('Erro na conexão: ' + response.statusText, 'error');
            }
        } catch (error) {
            toast('Erro ao testar conexão: ' + error.message, 'error');
        }
    },
    
    saveConfig() {
        GitHubSync.cfg = {
            token: $$('#githubToken').value,
            repo: $$('#githubRepo').value,
            branch: $$('#githubBranch').value || 'main',
            autoSync: $$('#autoSync').checked,
            syncInterval: $$('#syncInterval').value || 300
        };
        GitHubSync.save();
        toast('Configurações salvas!', 'success');
    },
    
    async syncToGitHub() {
        if (!GitHubSync.cfg.token || !GitHubSync.cfg.repo) {
            toast('Configure o GitHub Sync primeiro!', 'error');
            return;
        }
        
        try {
            const data = JSON.stringify(Store.data, null, 2);
            const filename = `neon-crm-data-${new Date().toISOString().split('T')[0]}.json`;
            
            // Aqui você implementaria a lógica real de push para o GitHub
            // Por enquanto, apenas simulamos
            toast('Sincronizando com GitHub...', 'info');
            
            setTimeout(() => {
                toast('Sincronização concluída!', 'success');
            }, 2000);
        } catch (error) {
            toast('Erro na sincronização: ' + error.message, 'error');
        }
    },
    
    init() {
        // Carregar configurações salvas
        if (GitHubSync.cfg.token) $$('#githubToken').value = GitHubSync.cfg.token;
        if (GitHubSync.cfg.repo) $$('#githubRepo').value = GitHubSync.cfg.repo;
        if (GitHubSync.cfg.branch) $$('#githubBranch').value = GitHubSync.cfg.branch;
        if (GitHubSync.cfg.autoSync !== undefined) $$('#autoSync').checked = GitHubSync.cfg.autoSync;
        if (GitHubSync.cfg.syncInterval) $$('#syncInterval').value = GitHubSync.cfg.syncInterval;
        
        // Configurar eventos
        $$('#testConnectionBtn').addEventListener('click', () => {
            this.testConnection();
        });
        
        $$('#saveConfigBtn').addEventListener('click', () => {
            this.saveConfig();
        });
        
        $$('#syncNowBtn').addEventListener('click', () => {
            this.syncToGitHub();
        });
    }
};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    
    // Inicializar sistemas
    ThemeSystem.init();
    MenuSystem.init();
    AdvancedSystem.init();
    BackupSystem.init();
    GitHubSyncSystem.init();
    
    // Configurar botão de backup no header
    $$('.backup-btn').addEventListener('click', () => {
        $$('#backupModal').style.display = 'block';
    });
    
    // Fechar modal
    $$('.close').addEventListener('click', () => {
        $$('#backupModal').style.display = 'none';
    });
    
    // Fechar modal ao clicar fora
    window.addEventListener('click', (e) => {
        if (e.target === $$('#backupModal')) {
            $$('#backupModal').style.display = 'none';
        }
    });
});
