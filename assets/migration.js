// Script de migração para preservar dados antigos
function migrateOldData() {
    // Verificar se há dados antigos no formato neon-crm-v1
    const oldData = localStorage.getItem('neon-crm-v1');
    if (oldData) {
        try {
            const parsed = JSON.parse(oldData);
            
            // Migrar dados para o novo formato
            if (parsed.stages) Store.data.stages = parsed.stages;
            if (parsed.leads) Store.data.leads = parsed.leads;
            if (parsed.tasks) Store.data.tasks = parsed.tasks;
            if (parsed.entities) Store.data.entities = parsed.entities;
            if (parsed.theme) Store.data.theme = parsed.theme;
            
            // Salvar no novo formato
            Store.save();
            
            // Remover dados antigos
            localStorage.removeItem('neon-crm-v1');
            
            console.log('Dados migrados com sucesso do formato antigo');
        } catch (error) {
            console.error('Erro ao migrar dados antigos:', error);
        }
    }
    
    // Verificar se há dados antigos do GitHub Sync
    const oldGitHubData = localStorage.getItem('neon-crm-github');
    if (oldGitHubData) {
        try {
            const parsed = JSON.parse(oldGitHubData);
            
            // Migrar configurações do GitHub
            if (parsed.owner && parsed.repo) {
                GitHubSync.cfg.repo = `${parsed.owner}/${parsed.repo}`;
            }
            if (parsed.token) GitHubSync.cfg.token = parsed.token;
            if (parsed.branch) GitHubSync.cfg.branch = parsed.branch;
            if (parsed.auto !== undefined) GitHubSync.cfg.autoSync = parsed.auto;
            
            GitHubSync.save();
            
            // Remover dados antigos
            localStorage.removeItem('neon-crm-github');
            
            console.log('Configurações do GitHub migradas com sucesso');
        } catch (error) {
            console.error('Erro ao migrar configurações do GitHub:', error);
        }
    }
}

// Executar migração quando o script for carregado
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', migrateOldData);
}
