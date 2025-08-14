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

// Sistema de diagnóstico do GitHub Sync
const GitHubDiagnostic = {
    async testConnection() {
        const results = $$('#diagnosticResults');
        results.innerHTML = '<div style="color: var(--text-dim);">Testando conexão...</div>';
        
        try {
            const response = await fetch(`https://api.github.com/repos/${GitHubSync.cfg.repo}`, {
                headers: GitHubSync.headers()
            });
            
            if (response.ok) {
                const repoData = await response.json();
                results.innerHTML = `
                    <div style="color: var(--success);">✅ Conexão com GitHub estabelecida com sucesso!</div>
                    <div style="background: var(--bg-soft); padding: 8px; border-radius: 6px; margin-top: 8px; font-size: 12px;">
                        <strong>Repositório:</strong> ${repoData.full_name}<br>
                        <strong>Descrição:</strong> ${repoData.description || 'Sem descrição'}<br>
                        <strong>Privado:</strong> ${repoData.private ? 'Sim' : 'Não'}
                    </div>
                `;
            } else {
                let errorMsg = `Erro ${response.status}: ${response.statusText}`;
                if (response.status === 401) {
                    errorMsg = 'Token inválido ou expirado. Verifique suas credenciais.';
                } else if (response.status === 404) {
                    errorMsg = 'Repositório não encontrado. Verifique o nome do repositório.';
                } else if (response.status === 403) {
                    errorMsg = 'Sem permissão para acessar o repositório. Verifique as permissões do token.';
                }
                results.innerHTML = `<div style="color: var(--danger);">❌ ${errorMsg}</div>`;
            }
        } catch (error) {
            results.innerHTML = `<div style="color: var(--danger);">❌ Erro ao testar conexão: ${error.message}</div>`;
        }
    },
    
    async forceSync() {
        const results = $$('#diagnosticResults');
        results.innerHTML = '<div style="color: var(--text-dim);">Forçando sincronização...</div>';
        
        try {
            await GitHubSync.saveNow();
            results.innerHTML = '<div style="color: var(--success);">✅ Sincronização forçada concluída com sucesso!</div>';
        } catch (error) {
            results.innerHTML = `<div style="color: var(--danger);">❌ Erro na sincronização: ${error.message}</div>`;
        }
    },
    
    checkConfig() {
        const results = $$('#diagnosticResults');
        const config = GitHubSync.cfg;
        
        let html = '<div style="background: var(--bg-soft); padding: 12px; border-radius: 8px; margin-top: 8px;">';
        html += '<h4>Configuração Atual:</h4>';
        html += `<div><strong>Repositório:</strong> ${config.repo || 'Não configurado'}</div>`;
        html += `<div><strong>Token:</strong> ${config.token ? '✅ Configurado' : '❌ Não configurado'}</div>`;
        html += `<div><strong>Branch:</strong> ${config.branch || 'main'}</div>`;
        html += `<div><strong>Auto-sync:</strong> ${config.auto ? '✅ Ativado' : '❌ Desativado'}</div>`;
        html += `<div><strong>Último SHA:</strong> ${config.lastSha || 'Não definido'}</div>`;
        html += '</div>';
        
        // Adicionar botão para reconfigurar se houver problemas
        if (!config.token || !config.repo) {
            html += '<div style="margin-top: 12px;"><button id="reconfigureBtn" class="primary">Reconfigurar GitHub Sync</button></div>';
        }
        
        results.innerHTML = html;
        
        // Adicionar event listener para o botão de reconfiguração
        const reconfigureBtn = $$('#reconfigureBtn');
        if (reconfigureBtn) {
            reconfigureBtn.addEventListener('click', () => this.resetConfig());
        }
    },
    
    async resetConfig() {
        if (confirm('Isso irá resetar a configuração do GitHub Sync. Continuar?')) {
            localStorage.removeItem('neon-crm-github-sync');
            GitHubSync.cfg = {};
            GitHubSync.setupAutoSync();
            toast('Configuração resetada e reconfigurada automaticamente');
            this.checkConfig();
        }
    },
    
    async checkTokenPermissions() {
        const results = $$('#diagnosticResults');
        results.innerHTML = '<div style="color: var(--text-dim);">Verificando permissões do token...</div>';
        
        try {
            const response = await fetch('https://api.github.com/user', {
                headers: GitHubSync.headers()
            });
            
            if (response.ok) {
                const userData = await response.json();
                results.innerHTML = `
                    <div style="color: var(--success);">✅ Token válido!</div>
                    <div style="background: var(--bg-soft); padding: 8px; border-radius: 6px; margin-top: 8px; font-size: 12px;">
                        <strong>Usuário:</strong> ${userData.login}<br>
                        <strong>Nome:</strong> ${userData.name || 'Não informado'}<br>
                        <strong>Email:</strong> ${userData.email || 'Não informado'}
                    </div>
                `;
            } else {
                results.innerHTML = `<div style="color: var(--danger);">❌ Token inválido ou sem permissões adequadas</div>`;
            }
        } catch (error) {
            results.innerHTML = `<div style="color: var(--danger);">❌ Erro ao verificar token: ${error.message}</div>`;
        }
    },
    
    async updateToken() {
        const newToken = $$('#newToken').value.trim();
        if (!newToken) {
            toast('Digite o novo token', 'error');
            return;
        }
        
        if (!newToken.startsWith('ghp_')) {
            toast('Token inválido. Deve começar com "ghp_"', 'error');
            return;
        }
        
        const results = $$('#diagnosticResults');
        results.innerHTML = '<div style="color: var(--text-dim);">Atualizando token...</div>';
        
        try {
            // Atualizar token local
            GitHubSync.cfg.token = newToken;
            GitHubSync.cfg.lastSha = null; // Resetar SHA para forçar nova sincronização
            GitHubSync.save();
            
            // Salvar token no GitHub para sincronização entre dispositivos
            await GitHubSync.saveTokenToGitHub(newToken);
            
            // Limpar campo
            $$('#newToken').value = '';
            
            results.innerHTML = '<div style="color: var(--success);">✅ Token atualizado e sincronizado com sucesso!</div>';
            toast('Token atualizado e sincronizado!', 'success');
            
            // Testar conexão automaticamente
            setTimeout(() => {
                this.testConnection();
            }, 1000);
            
        } catch (error) {
            results.innerHTML = `<div style="color: var(--danger);">❌ Erro ao atualizar token: ${error.message}</div>`;
            toast('Erro ao atualizar token: ' + error.message, 'error');
        }
    },
    
    async loadTokenFromGitHub() {
        const results = $$('#diagnosticResults');
        results.innerHTML = '<div style="color: var(--text-dim);">Carregando token do GitHub...</div>';
        
        try {
            const success = await GitHubSync.loadTokenFromGitHub();
            if (success) {
                results.innerHTML = '<div style="color: var(--success);">✅ Token carregado do GitHub com sucesso!</div>';
                toast('Token carregado do GitHub!', 'success');
            } else {
                results.innerHTML = '<div style="color: var(--warning);">⚠️ Token não encontrado no GitHub</div>';
                toast('Token não encontrado no GitHub', 'warning');
            }
        } catch (error) {
            results.innerHTML = `<div style="color: var(--danger);">❌ Erro ao carregar token: ${error.message}</div>`;
            toast('Erro ao carregar token: ' + error.message, 'error');
        }
    },
    
    init() {
        // Configurar event listeners para os botões existentes
        const testConnectionBtn = $$('#testConnection');
        if (testConnectionBtn) {
            testConnectionBtn.addEventListener('click', () => this.testConnection());
        }
        
        const forceSyncBtn = $$('#forceSync');
        if (forceSyncBtn) {
            forceSyncBtn.addEventListener('click', () => this.forceSync());
        }
        
        const checkConfigBtn = $$('#checkConfig');
        if (checkConfigBtn) {
            checkConfigBtn.addEventListener('click', () => this.checkConfig());
        }
        
        const updateTokenBtn = $$('#updateToken');
        if (updateTokenBtn) {
            updateTokenBtn.addEventListener('click', () => this.updateToken());
        }
        
        const loadTokenBtn = $$('#loadTokenBtn');
        if (loadTokenBtn) {
            loadTokenBtn.addEventListener('click', () => this.loadTokenFromGitHub());
        }
        
        // Adicionar botões adicionais
        const buttonRow = $$('.row');
        if (buttonRow) {
            // Botão para verificar token
            const checkTokenBtn = document.createElement('button');
            checkTokenBtn.textContent = 'Verificar Token';
            checkTokenBtn.className = 'ghost';
            checkTokenBtn.addEventListener('click', () => this.checkTokenPermissions());
            buttonRow.appendChild(checkTokenBtn);
            
            // Botão para carregar token do GitHub
            const loadTokenBtn2 = document.createElement('button');
            loadTokenBtn2.textContent = 'Carregar Token do GitHub';
            loadTokenBtn2.className = 'ghost';
            loadTokenBtn2.addEventListener('click', () => this.loadTokenFromGitHub());
            buttonRow.appendChild(loadTokenBtn2);
        }
        
        console.log('GitHubDiagnostic inicializado com sucesso');
    }
};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    
    // Inicializar sistema de diagnóstico
    GitHubDiagnostic.init();
    
    // Verificar configuração automaticamente
    setTimeout(() => {
        GitHubDiagnostic.checkConfig();
    }, 500);
    
    console.log('Página Dev carregada com sucesso');
});
