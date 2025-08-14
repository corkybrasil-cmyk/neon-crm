// Verificar autenticação
function checkAuth() {
  const isLoggedIn = localStorage.getItem('neon-crm-logged-in');
  if (isLoggedIn !== 'true') {
    window.location.href = 'index.html';
  }
}

// Fazer logout
function logout() {
  localStorage.removeItem('neon-crm-logged-in');
  localStorage.removeItem('neon-crm-username');
  window.location.href = 'index.html';
}

// Navegação entre páginas
function navigateTo(page) {
  switch(page) {
    case 'dashboard':
      window.location.href = 'dashboard.html';
      break;
    case 'novo-lead':
      // Já estamos na página de novo lead
      break;
    case 'funil-vendas':
      window.location.href = 'funil-vendas.html';
      break;
    case 'tarefas':
      window.location.href = 'tarefas.html';
      break;
    case 'pessoas-empresas':
      window.location.href = 'pessoas-empresas.html';
      break;
    case 'dev':
      window.location.href = 'dev.html';
      break;
  }
}

// Estado & Persistência (reutilizado do app original)
const Store = {
  key: 'neon-crm-v1',
  data: {
    stages: ["novo lead","qualificado","proposta","venda","perdido"],
    leads: [],
    tasks: {
      leads: { stages:["para fazer","fazendo"], items:[] },
      escola:{ stages:["para fazer","fazendo"], items:[] }
    },
    entities: [],
    theme: {}
  },
  load(){
    try{ const raw = localStorage.getItem(this.key); if(raw){ this.data = JSON.parse(raw); } }catch(e){ console.warn('Falha ao carregar', e) }
  },
  save(){ localStorage.setItem(this.key, JSON.stringify(this.data)); }
};

// Utilidades (reutilizadas do app original)
const $$ = sel => document.querySelector(sel);
const uid = () => Math.random().toString(36).slice(2,9);
const todayISO = () => new Date().toISOString();

function toast(msg){
  const t = document.createElement('div');
  t.textContent = msg;
  t.style.position='fixed';t.style.bottom='16px';t.style.right='16px';t.style.padding='10px 14px';t.style.background='var(--card)';t.style.border='1px solid var(--muted)';t.style.borderRadius='12px';t.style.zIndex='100';
  document.body.appendChild(t); setTimeout(()=>t.remove(),2200);
}

// Função para atualizar as opções de etapas
function refreshEtapasOptions(){
  const sel = $$('#leadEtapa'); 
  sel.innerHTML = '<option value="">Selecione...</option>';
  Store.data.stages.forEach(s=>{ 
    const o=document.createElement('option'); 
    o.textContent=s; 
    o.value = s;
    sel.appendChild(o); 
  });
}

// Função para adicionar novo lead
function addLead(leadData) {
  const lead = {
    id: uid(),
    ...leadData,
    createdAt: todayISO(),
    updatedAt: todayISO()
  };
  
  Store.data.leads.push(lead);
  Store.save();
  
  // Limpar formulário
  document.getElementById('leadForm').reset();
  
  toast('Lead adicionado com sucesso!');
  
  // Redirecionar para o funil de vendas após 1 segundo
  setTimeout(() => {
    window.location.href = 'funil-vendas.html';
  }, 1000);
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
  // Verificar autenticação
  checkAuth();
  
  // Carregar dados
  Store.load();
  
  // Atualizar opções de etapas
  refreshEtapasOptions();
  
  // Event listener para o formulário
  document.getElementById('leadForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const leadData = {
      responsavel: $$('#leadResp').value.trim(),
      telefone: $$('#leadTel').value.trim(),
      bairro: $$('#leadBairro').value.trim(),
      crianca: $$('#leadCrianca').value.trim(),
      idade: parseInt($$('#leadIdade').value),
      periodo: $$('#leadPeriodo').value,
      frequencia: $$('#leadFrequencia').value,
      fonte: $$('#leadFonte').value,
      etapa: $$('#leadEtapa').value,
      valorVenda: $$('#leadValor').value ? parseFloat($$('#leadValor').value) : null,
      observacoes: $$('#leadObs').value.trim()
    };
    
    // Validações básicas
    if (!leadData.responsavel || !leadData.telefone || !leadData.bairro || 
        !leadData.crianca || !leadData.idade || !leadData.periodo || 
        !leadData.frequencia || !leadData.fonte || !leadData.etapa) {
      toast('Por favor, preencha todos os campos obrigatórios');
      return;
    }
    
    if (leadData.idade < 0 || leadData.idade > 12) {
      toast('A idade da criança deve estar entre 0 e 12 anos');
      return;
    }
    
    addLead(leadData);
  });
});
