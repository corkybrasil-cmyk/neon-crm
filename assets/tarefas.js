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
      // Já estamos na página de tarefas
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
const $$$ = sel => Array.from(document.querySelectorAll(sel));
const uid = () => Math.random().toString(36).slice(2,9);
const todayISO = () => new Date().toISOString();

function toast(msg){
  const t = document.createElement('div');
  t.textContent = msg;
  t.style.position='fixed';t.style.bottom='16px';t.style.right='16px';t.style.padding='10px 14px';t.style.background='var(--card)';t.style.border='1px solid var(--muted)';t.style.borderRadius='12px';t.style.zIndex='100';
  document.body.appendChild(t); setTimeout(()=>t.remove(),2200);
}

// Variável global para o tipo de tarefa selecionado
let currentTaskType = 'leads';

// Função para selecionar o tipo de tarefa
function selectTaskType(type) {
  currentTaskType = type;
  
  // Esconder a tela de seleção
  $$('#taskSelection').classList.add('hidden');
  
  // Mostrar a interface de tarefas
  $$('#taskInterface').classList.remove('hidden');
  
  // Definir o valor do select
  $$('#taskType').value = type;
  
  // Renderizar as tarefas
  renderTasks();
}

// Função para voltar à seleção
function backToSelection() {
  $$('#taskSelection').classList.remove('hidden');
  $$('#taskInterface').classList.add('hidden');
}

// Função para renderizar tarefas (simplificada)
function renderTasks() {
  const taskData = Store.data.tasks[currentTaskType];
  console.log(`Renderizando tarefas ${currentTaskType}:`, taskData);
  
  // Aqui você pode implementar a renderização do Kanban
  // Por enquanto, apenas um log
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
  // Verificar autenticação
  checkAuth();
  
  // Carregar dados
  Store.load();
  
  // Event listeners
  const taskType = $$('#taskType');
  if(taskType) {
    taskType.addEventListener('change', function() {
      currentTaskType = this.value;
      renderTasks();
    });
  }
  
  const btnBackToSelection = $$('#btnBackToSelection');
  if(btnBackToSelection) {
    btnBackToSelection.addEventListener('click', backToSelection);
  }
  
  const btnTaskNew = $$('#btnTaskNew');
  if(btnTaskNew) {
    btnTaskNew.addEventListener('click', function() {
      toast('Funcionalidade de nova tarefa será implementada');
    });
  }
  
  const btnTaskStages = $$('#btnTaskStages');
  if(btnTaskStages) {
    btnTaskStages.addEventListener('click', function() {
      toast('Funcionalidade de personalizar etapas será implementada');
    });
  }
});
