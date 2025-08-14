// Inicializar dados padrão se não existirem
if (!Store.data.stages) {
  Store.data.stages = ["novo lead","qualificado","proposta","venda","perdido"];
}
if (!Store.data.leads) {
  Store.data.leads = [];
}
if (!Store.data.tasks) {
  Store.data.tasks = {
    leads: { stages:["para fazer","fazendo"], items:[] },
    escola:{ stages:["para fazer","fazendo"], items:[] }
  };
}
if (!Store.data.entities) {
  Store.data.entities = [];
}
if (!Store.data.theme) {
  Store.data.theme = {};
}

// Sistema de temas
const ThemeSystem = {
    applyTheme(themeName) {
        if (themeName === 'default') {
            document.documentElement.style.setProperty('--accent-neon', '#c7f603');
            document.documentElement.style.setProperty('--bg', '#0b1020');
            document.documentElement.style.setProperty('--bg2', '#0e1430');
        } else if (themeName === 'dark') {
            document.documentElement.style.setProperty('--accent-neon', '#007bff');
            document.documentElement.style.setProperty('--bg', '#212529');
            document.documentElement.style.setProperty('--bg2', '#343a40');
        } else if (themeName === 'blue') {
            document.documentElement.style.setProperty('--accent-neon', '#0056b3');
            document.documentElement.style.setProperty('--bg', '#f0f8ff');
            document.documentElement.style.setProperty('--bg2', '#e6f3ff');
        }
        
        localStorage.setItem('neon-crm-theme', themeName);
        Store.data.theme = { name: themeName };
        Store.save();
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



// Sistema de personalização do CRM
const CrmCustomizationSystem = {
    applyCustomization() {
        const buttonColor = $$('#crmButtonColor').value;
        const buttonGradient = $$('#crmButtonGradient').checked;
        const appColor = $$('#appColor').value;
        const appFontSize = $$('#appFontSize').value;
        const appFont = $$('#appFont').value;
        const menuBgColor = $$('#menuBgColor').value;
        const menuOpacity = $$('#menuOpacity').value;
        const menuTextColor = $$('#menuTextColor').value;
        const menuFont = $$('#menuFont').value;
        const menuGradient = $$('#menuGradient').checked;
        
        // Aplicar cor dos botões
        if (buttonGradient) {
            document.documentElement.style.setProperty('--accent-neon', buttonColor);
            document.documentElement.style.setProperty('--accent2', this.adjustColor(buttonColor, 20));
            document.body.classList.add('accent-grad');
        } else {
            document.documentElement.style.setProperty('--accent-neon', buttonColor);
            document.body.classList.remove('accent-grad');
        }
        
        // Aplicar cor da aplicação
        document.documentElement.style.setProperty('--accent', appColor);
        
        // Aplicar fonte da aplicação
        document.documentElement.style.setProperty('--font', appFont);
        document.documentElement.style.setProperty('font-size', appFontSize + 'px');
        
        // Aplicar configurações do menu
        const opacity = menuOpacity / 100;
        const rgbaColor = this.hexToRgba(menuBgColor, opacity);
        
        if (menuGradient) {
            const darkerColor = this.adjustColor(menuBgColor, -20);
            const darkerRgba = this.hexToRgba(darkerColor, opacity);
            document.documentElement.style.setProperty('--nav-bg', `linear-gradient(180deg, ${rgbaColor}, ${darkerRgba})`);
        } else {
            document.documentElement.style.setProperty('--nav-bg', rgbaColor);
        }
        
        document.documentElement.style.setProperty('--nav-text', menuTextColor);
        document.documentElement.style.setProperty('--nav-font', menuFont);
        
        // Salvar configurações
        Store.data.crmCustomization = {
            buttonColor,
            buttonGradient,
            appColor,
            appFontSize,
            appFont,
            menuBgColor,
            menuOpacity,
            menuTextColor,
            menuFont,
            menuGradient
        };
        Store.save();
        
        toast('Personalizações aplicadas!');
    },
    
    resetCustomization() {
        // Restaurar valores padrão
        $$('#crmButtonColor').value = '#c7f603';
        $$('#crmButtonGradient').checked = false;
        $$('#appColor').value = '#7ad7ff';
        $$('#appFontSize').value = '16';
        $$('#appFont').value = 'Inter';
        $$('#menuBgColor').value = '#121734';
        $$('#menuOpacity').value = '100';
        $$('#menuTextColor').value = '#eef3ff';
        $$('#menuFont').value = 'Inter';
        $$('#menuGradient').checked = false;
        
        // Aplicar configurações padrão
        this.applyCustomization();
        
        // Remover configurações salvas
        delete Store.data.crmCustomization;
        Store.save();
        
        toast('Personalizações restauradas ao padrão!');
    },
    
    loadCustomization() {
        const config = Store.data.crmCustomization;
        if (config) {
            $$('#crmButtonColor').value = config.buttonColor || '#c7f603';
            $$('#crmButtonGradient').checked = config.buttonGradient || false;
            $$('#appColor').value = config.appColor || '#7ad7ff';
            $$('#appFontSize').value = config.appFontSize || '16';
            $$('#appFont').value = config.appFont || 'Inter';
            $$('#menuBgColor').value = config.menuBgColor || '#121734';
            $$('#menuOpacity').value = config.menuOpacity || '100';
            $$('#menuTextColor').value = config.menuTextColor || '#eef3ff';
            $$('#menuFont').value = config.menuFont || 'Inter';
            $$('#menuGradient').checked = config.menuGradient || false;
        }
    },
    
    // Funções utilitárias
    adjustColor(hex, percent) {
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    },
    
    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    },
    
    init() {
        this.loadCustomization();
        
        // Configurar eventos
        $$('#applyCrmCustomization').addEventListener('click', () => {
            this.applyCustomization();
        });
        
        $$('#resetCrmCustomization').addEventListener('click', () => {
            this.resetCustomization();
        });
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
            
            toast('Backup criado com sucesso!');
        } catch (error) {
            toast('Erro ao criar backup: ' + error.message);
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
            
            toast('Backup restaurado com sucesso!');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error) {
            toast('Erro ao restaurar backup: ' + error.message);
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
            toast('Preencha token e repositório!');
            return;
        }
        
        try {
            const response = await fetch(`https://api.github.com/repos/${repo}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (response.ok) {
                toast('Conexão com GitHub estabelecida!');
            } else {
                toast('Erro na conexão: ' + response.statusText);
            }
        } catch (error) {
            toast('Erro ao testar conexão: ' + error.message);
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
        toast('Configurações salvas!');
    },
    
    async syncToGitHub() {
        if (!GitHubSync.cfg.token || !GitHubSync.cfg.repo) {
            toast('Configure o GitHub Sync primeiro!');
            return;
        }
        
        try {
            await GitHubSync.saveNow();
            toast('Sincronização concluída!');
        } catch (error) {
            toast('Erro na sincronização: ' + error.message);
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
    BackupSystem.init();
    GitHubSyncSystem.init();
    CrmCustomizationSystem.init();
    
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
