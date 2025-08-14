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
