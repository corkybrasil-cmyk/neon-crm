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

// Estado & Persistência (reutilizado do app original)
// Remove the local Store definition – we will use the global Store from utils.js
// const Store = { /* removed */ };
// Use the global Store defined in utils.js
const Store = window.Store || {};

// Utilidades (reutilizadas do app original)
const $$ = sel => document.querySelector(sel);
const $$$ = sel => Array.from(document.querySelectorAll(sel));
const fmtBRL = v => (v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const toDateOnly = (d) => new Date(new Date(d).toDateString());
const inRange = (d, a, b) => { const x=toDateOnly(d).getTime(); return x>=toDateOnly(a).getTime() && x<=toDateOnly(b).getTime(); };

function toast(msg){
  const t = document.createElement('div');
  t.textContent = msg;
  t.style.position='fixed';t.style.bottom='16px';t.style.right='16px';t.style.padding='10px 14px';t.style.background='var(--card)';t.style.border='1px solid var(--muted)';t.style.borderRadius='12px';t.style.zIndex='100';
  document.body.appendChild(t); setTimeout(()=>t.remove(),2200);
}

// Dashboard & Filtros de Data
const quickRange = $$('#quickRange');
const customDates = $$('#customDates');
const fromDate = $$('#fromDate');
const toDate = $$('#toDate');
const applyDates = $$('#applyDates');

function getRange(){
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let start = new Date(end);
  const v = quickRange.value;
  if(v==='last1') start.setDate(end.getDate()-1);
  if(v==='last7') start.setDate(end.getDate()-6);
  if(v==='last30') start.setDate(end.getDate()-29);
  if(v==='custom'){
    const a = fromDate.value ? new Date(fromDate.value) : end;
    const b = toDate.value ? new Date(toDate.value) : end;
    return {start:a, end:b};
  }
  return {start, end};
}

async function fetchLeadsFromFirebase() {
  if (window.getAllLeadsFromFirebase) {
    Store.data.leads = await window.getAllLeadsFromFirebase();
  }
}

async function calcKPIs(){
  await fetchLeadsFromFirebase();
  const {start,end} = getRange();
  const leads = Store.data.leads;
  const entrou = leads.filter(l=> inRange(l.createdAt,start,end)).length;
  const qualificados = leads.filter(l=> l.etapa==='qualificado' && inRange(l.stageChangedAt||l.updatedAt||l.createdAt,start,end)).length;
  const vendas = leads.filter(l=> l.etapa==='venda' && inRange(l.stageChangedAt||l.updatedAt||l.createdAt,start,end));
  const ticket = vendas.length ? vendas.reduce((s,l)=>s+(Number(l.valorVenda)||0),0)/vendas.length : 0;
  $$('#kpiEntraram').textContent = entrou;
  $$('#kpiQualificados').textContent = qualificados;
  $$('#kpiVendas').textContent = vendas.length;
  $$('#kpiTicket').textContent = fmtBRL(ticket);
  $$('#kpiEntraramHint').textContent = `de ${start.toLocaleDateString()} a ${end.toLocaleDateString()}`;

  // Tabela por bairro
  const counts = {};
  leads.forEach(l=>{ const b=(l.bairro||'—').trim(); counts[b]=(counts[b]||0)+1; });
  const tbody = $$('#bairroTable'); if(tbody){
    const rows = Object.entries(counts).sort((a,b)=> b[1]-a[1]).map(([b,q])=>`<tr><td>${b}</td><td>${q}</td></tr>`).join('');
    tbody.innerHTML = rows;
  }
}

// Inicialização – aguarda o CRM estar pronto antes de renderizar
function initDashboard() {
    // Verificar autenticação
    checkAuth();
    // Calcular KPIs iniciais
    calcKPIs();
    // Event listeners
    quickRange.addEventListener('change', () => {
        customDates.style.display = quickRange.value === 'custom' ? 'flex' : 'none';
        calcKPIs();
    });
    if (applyDates) {
        applyDates.addEventListener('click', calcKPIs);
    }
}

if (window.CRM_READY) {
    console.log('CRM já pronto – inicializando dashboard');
    initDashboard();
} else {
    console.log('Aguardando CRM_READY para iniciar dashboard');
    window.addEventListener('crmReady', () => {
        console.log('Evento crmReady recebido – iniciando dashboard');
        initDashboard();
    });
}

// Remover função duplicada de navegação
// (A função navigateTo foi removida deste arquivo. Use a de utils.js)
