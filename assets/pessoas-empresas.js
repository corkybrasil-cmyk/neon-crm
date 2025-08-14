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
      window.location.href = 'novo-lead.html';
      break;
    case 'funil-vendas':
      window.location.href = 'funil-vendas.html';
      break;
    case 'tarefas':
      window.location.href = 'tarefas.html';
      break;
    case 'pessoas-empresas':
      // Já estamos na página de pessoas e empresas
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
const $$$ = sel => Array.from(document.querySelectorAll(sel));
const uid = () => Math.random().toString(36).slice(2,9);
const todayISO = () => new Date().toISOString();

function toast(msg){
  const t = document.createElement('div');
  t.textContent = msg;
  t.style.position='fixed';t.style.bottom='16px';t.style.right='16px';t.style.padding='10px 14px';t.style.background='var(--card)';t.style.border='1px solid var(--muted)';t.style.borderRadius='12px';t.style.zIndex='100';
  document.body.appendChild(t); setTimeout(()=>t.remove(),2200);
}

// Função para renderizar entidades (simplificada)
function renderEntities() {
  console.log('Renderizando entidades:', Store.data.entities.length);
  
  const tbody = $$('#entList');
  if(!tbody) return;
  
  // Limpar tabela
  tbody.innerHTML = '';
  
  // Filtrar entidades
  const filterType = $$('#entFilterType').value;
  const filterFinalidade = $$('#entFilterFinalidade').value.toLowerCase();
  
  const filteredEntities = Store.data.entities.filter(ent => {
    if(filterType !== 'todos' && ent.tipo !== filterType) return false;
    if(filterFinalidade && !ent.finalidade.toLowerCase().includes(filterFinalidade)) return false;
    return true;
  });
  
  // Renderizar entidades
  filteredEntities.forEach(ent => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${ent.tipo === 'pessoa' ? '👤' : '🏢'} ${ent.tipo}</td>
      <td>${ent.nome}</td>
      <td>${ent.telefone || '—'}</td>
      <td>${ent.finalidade || '—'}</td>
      <td>${ent.contato || '—'}</td>
      <td>
        <button onclick="editEntity('${ent.id}')" class="ghost">✏️</button>
        <button onclick="deleteEntity('${ent.id}')" class="ghost">🗑️</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// Função para adicionar nova entidade
function addEntity() {
  toast('Funcionalidade de adicionar entidade será implementada');
}

// Função para editar entidade
function editEntity(id) {
  toast(`Editando entidade ${id}`);
}

// Função para deletar entidade
function deleteEntity(id) {
  if(confirm('Tem certeza que deseja deletar esta entidade?')) {
    Store.data.entities = Store.data.entities.filter(ent => ent.id !== id);
    Store.save();
    renderEntities();
    toast('Entidade deletada');
  }
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
  // Verificar autenticação
  checkAuth();
  
  // Carregar dados
  Store.load();
  
  // Renderizar entidades
  renderEntities();
  
  // Event listeners
  const entFilterType = $$('#entFilterType');
  if(entFilterType) {
    entFilterType.addEventListener('change', renderEntities);
  }
  
  const entFilterFinalidade = $$('#entFilterFinalidade');
  if(entFilterFinalidade) {
    entFilterFinalidade.addEventListener('input', renderEntities);
  }
  
  const btnNewEnt = $$('#btnNewEnt');
  if(btnNewEnt) {
    btnNewEnt.addEventListener('click', addEntity);
  }
});
