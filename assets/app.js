// Estado & Persistência
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
Store.load();

// Utilidades
const $$ = sel => document.querySelector(sel);
const $$$ = sel => Array.from(document.querySelectorAll(sel));
const fmtBRL = v => (v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const uid = () => Math.random().toString(36).slice(2,9);
const todayISO = () => new Date().toISOString();
const toDateOnly = (d) => new Date(new Date(d).toDateString());
const inRange = (d, a, b) => { const x=toDateOnly(d).getTime(); return x>=toDateOnly(a).getTime() && x<=toDateOnly(b).getTime(); };

function toast(msg){
  const t = document.createElement('div');
  t.textContent = msg;
  t.style.position='fixed';t.style.bottom='16px';t.style.right='16px';t.style.padding='10px 14px';t.style.background='var(--card)';t.style.border='1px solid var(--muted)';t.style.borderRadius='12px';t.style.zIndex='100';
  document.body.appendChild(t); setTimeout(()=>t.remove(),2200);
}

// GitHub Sync
const GitHubSync = {
  key: 'neon-crm-github',
  cfg: { owner:'', repo:'', branch:'main', path:'neon-crm-data.json', token:'', auto:false, lastSha:'' },
  loadCfg(){ try{ const raw=localStorage.getItem(this.key); if(raw){ this.cfg = {...this.cfg, ...JSON.parse(raw)}; } }catch(e){} },
  saveCfg(){ localStorage.setItem(this.key, JSON.stringify(this.cfg)); },
  uiLoad(){ if($$('#ghOwner')){ $$('#ghOwner').value=this.cfg.owner||''; $$('#ghRepo').value=this.cfg.repo||''; $$('#ghBranch').value=this.cfg.branch||'main'; $$('#ghPath').value=this.cfg.path||'neon-crm-data.json'; $$('#ghToken').value=this.cfg.token||''; $$('#ghAutoSave').checked=!!this.cfg.auto; } },
  bindUI(){
    if($$('#ghConnect')) $$('#ghConnect').onclick = async ()=>{ this.readInputs(); this.saveCfg(); await this.connect(); };
    if($$('#ghSaveNow')) $$('#ghSaveNow').onclick = async ()=>{ this.readInputs(); this.saveCfg(); await this.saveNow(); };
    if($$('#ghDisconnect')) $$('#ghDisconnect').onclick = ()=>{ this.cfg={ owner:'',repo:'',branch:'main',path:'neon-crm-data.json',token:'',auto:false,lastSha:'' }; this.saveCfg(); this.uiLoad(); toast('GitHub desconectado'); };
    if($$('#ghAutoSave')) $$('#ghAutoSave').onchange = ()=>{ this.cfg.auto = !!$$('#ghAutoSave').checked; this.saveCfg(); toast(this.cfg.auto? 'Auto salvar no GitHub: ON':'Auto salvar no GitHub: OFF'); };
  },
  readInputs(){ this.cfg.owner=$$('#ghOwner')?.value.trim()||''; this.cfg.repo=$$('#ghRepo')?.value.trim()||''; this.cfg.branch=$$('#ghBranch')?.value.trim()||'main'; this.cfg.path=$$('#ghPath')?.value.trim()||'neon-crm-data.json'; this.cfg.token=$$('#ghToken')?.value.trim()||''; this.cfg.auto=!!$$('#ghAutoSave')?.checked; },
  headers(){ const h={ 'Accept':'application/vnd.github+json' }; if(this.cfg.token) h['Authorization'] = 'Bearer '+this.cfg.token; return h; },
  async fetchFile(){
    const url = `https://api.github.com/repos/${this.cfg.owner}/${this.cfg.repo}/contents/${encodeURIComponent(this.cfg.path)}?ref=${encodeURIComponent(this.cfg.branch)}`;
    const res = await fetch(url, { headers: this.headers() });
    if(res.status===404) return { content:null, sha:null };
    if(!res.ok){ throw new Error('Falha ao buscar arquivo: '+res.status); }
    const data = await res.json();
    const content = atob((data.content||'').replace(/\n/g,''));
    return { content, sha: data.sha };
  },
  async saveFile(str){
    const url = `https://api.github.com/repos/${this.cfg.owner}/${this.cfg.repo}/contents/${encodeURIComponent(this.cfg.path)}`;
    const b64 = btoa(unescape(encodeURIComponent(str)));
    const body = { message: `Neon CRM sync: ${new Date().toISOString()}`, content: b64, branch: this.cfg.branch };
    if(this.cfg.lastSha) body.sha = this.cfg.lastSha;
    const res = await fetch(url, { method:'PUT', headers: { ...this.headers(), 'Content-Type':'application/json' }, body: JSON.stringify(body) });
    if(!res.ok){ throw new Error('Falha ao salvar no GitHub: '+res.status); }
    const data = await res.json();
    this.cfg.lastSha = data.content?.sha || this.cfg.lastSha; this.saveCfg();
  },
  async connect(){
    if(!this.cfg.owner||!this.cfg.repo||!this.cfg.token){ toast('Preencha Owner, Repo e Token'); return; }
    try{
      const {content, sha} = await this.fetchFile();
      this.cfg.lastSha = sha||''; this.saveCfg();
      if(content){
        const data = JSON.parse(content);
        if(Array.isArray(data.leads) && data.tasks && Array.isArray(data.entities)){
          Store.data.stages = Array.isArray(data.stages) ? data.stages : Store.data.stages;
          Store.data.leads = data.leads; Store.data.tasks = data.tasks; Store.data.entities = data.entities; Store.data.theme = data.theme || Store.data.theme;
          Store.save(); refreshEtapasOptions(); renderLeads(); renderTasks(); renderEntities(); calcKPIs(); toast('Dados carregados do GitHub');
        }else{ toast('Arquivo do GitHub não está no formato esperado'); }
      }else{
        toast('Arquivo não existe no repositório. Será criado no primeiro salvamento.');
      }
    }catch(err){ console.error(err); toast('Erro ao conectar no GitHub'); }
  },
  async saveNow(){
    if(!this.cfg.owner||!this.cfg.repo||!this.cfg.token){ toast('Preencha Owner, Repo e Token'); return; }
    try{
      const str = JSON.stringify(Store.data, null, 2);
      if(!this.cfg.lastSha){
        try{ const {sha} = await this.fetchFile(); this.cfg.lastSha = sha||''; this.saveCfg(); }catch(_){ }
      }
      await this.saveFile(str);
      toast('Dados salvos no GitHub');
    }catch(err){ console.error(err); toast('Erro ao salvar no GitHub'); }
  },
  debouncedSaveNow: (()=>{ let t; return ()=>{ clearTimeout(t); t=setTimeout(()=>GitHubSync.saveNow(), 1200); }; })()
};
GitHubSync.loadCfg();

// Navegação entre abas
$$$('nav .tab').forEach(btn=>{
  btn.addEventListener('click',()=>{
    $$$('nav .tab').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const id = btn.dataset.tab;
    $$$('.tabview').forEach(s=>s.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    if(id==='leads') renderLeads();
    if(id==='tarefas') renderTasks();
    if(id==='pessoas') renderEntities();
    if(id==='dashboard') calcKPIs();
  })
})

// Submenu Tarefas colapsável
const tabTarefas = document.getElementById('tabTarefas');
const submenuTarefas = document.getElementById('submenuTarefas');
if(tabTarefas){
  let hoverTimeout;
  const openMenu = ()=>{ submenuTarefas.classList.remove('hidden'); };
  const closeMenu = ()=> submenuTarefas.classList.add('hidden');
  tabTarefas.addEventListener('mouseenter',()=>{ clearTimeout(hoverTimeout); openMenu(); });
  tabTarefas.addEventListener('mouseleave',()=>{ hoverTimeout=setTimeout(closeMenu, 200); });
  submenuTarefas.addEventListener('mouseenter',()=>{ clearTimeout(hoverTimeout); });
  submenuTarefas.addEventListener('mouseleave',()=>{ hoverTimeout=setTimeout(closeMenu, 200); });
  submenuTarefas.addEventListener('click',(e)=>{
    const btn = e.target.closest('button[data-tasktype]');
    if(!btn) return;
    const v = btn.dataset.tasktype; $$('#taskType').value = v; renderTasks();
    $$$('nav .tab').forEach(b=>b.classList.remove('active'));
    tabTarefas.classList.add('active');
    $$$('.tabview').forEach(s=>s.classList.add('hidden'));
    document.getElementById('tarefas').classList.remove('hidden');
    closeMenu();
  });
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

quickRange.addEventListener('change',()=>{
  customDates.style.display = quickRange.value==='custom' ? 'flex' : 'none';
  calcKPIs();
});
applyDates.addEventListener('click', calcKPIs);

function calcKPIs(){
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

// Novo Lead
function refreshEtapasOptions(){
  const sel = $$('#leadEtapa'); sel.innerHTML = '';
  Store.data.stages.forEach(s=>{ const o=document.createElement('option'); o.textContent=s; sel.appendChild(o); });
}
refreshEtapasOptions();

$$('#btnAddLead').addEventListener('click',()=>{
  const lead = {
    id: uid(),
    responsavel: $$('#leadResp').value.trim(),
    crianca: $$('#leadCrianca').value.trim(),
    idade: Number($$('#leadIdade').value||0),
    periodo: $$('#leadPeriodo').value,
    frequencia: $$('#leadFrequencia').value,
    fonte: $$('#leadFonte').value,
    telefone: $$('#leadTel').value.trim(),
    bairro: $$('#leadBairro').value.trim(),
    etapa: $$('#leadEtapa').value,
    valorVenda: Number($$('#leadValor').value||0),
    observacoes: ($$('#leadObs')?.value||'').trim(),
    createdAt: todayISO(),
    updatedAt: todayISO(),
    stageChangedAt: todayISO(),
  };
  if(!lead.responsavel || !lead.crianca){ toast('Preencha responsável e criança'); return; }
  Store.data.leads.push(lead); Store.save();
  $$$('#novoLead input').forEach(i=>i.value='');
  $$$('#novoLead textarea').forEach(i=>i.value='');
  refreshEtapasOptions();
  toast('Lead adicionado!');
  renderLeads(); calcKPIs();
});

// Leads: Kanban & Lista
const leadViewSel = $$('#leadView');
leadViewSel.addEventListener('change',()=>{
  const isKanban = leadViewSel.value==='kanban';
  $$('#kanbanWrap').classList.toggle('hidden',!isKanban);
  $$('#listWrap').classList.toggle('hidden',isKanban);
  renderLeads();
});

$$('#editStages').addEventListener('click',()=>{
  document.body.dataset.editStages = document.body.dataset.editStages? '' : '1';
  const on = !!document.body.dataset.editStages;
  $$('#addStage').classList.toggle('hidden',!on);
  $$('#saveStages').classList.toggle('hidden',!on);
  $$('#editStages').textContent = on? 'Cancel. edição' : 'Editar etapas';
  renderLeads();
});
$$('#addStage').addEventListener('click',()=>{
  const name = prompt('Nome da nova etapa:');
  if(!name) return; Store.data.stages.push(name); renderLeads();
});
$$('#saveStages').addEventListener('click',()=>{
  document.body.dataset.editStages='';
  $$('#addStage').classList.add('hidden');
  $$('#saveStages').classList.add('hidden');
  $$('#editStages').textContent='Editar etapas';
  Store.save(); renderLeads(); refreshEtapasOptions();
  toast('Etapas salvas');
});

function renderLeads(){
  const wrap = $$('#kanbanWrap'); wrap.innerHTML='';
  const isKanban = leadViewSel.value==='kanban';
  if(!isKanban){
    renderLeadTable();
    return;
  }
  // Kanban columns
  Store.data.stages.forEach((stage, idx)=>{
    const col = document.createElement('div'); col.className='column'; col.dataset.stage=stage;
    const head = document.createElement('header');
    const h4 = document.createElement('h4'); h4.textContent=stage; h4.contentEditable = !!document.body.dataset.editStages;
    h4.addEventListener('input',()=>{ Store.data.stages[idx]=h4.textContent.trim()||stage; });
    const tools = document.createElement('div');
    if(document.body.dataset.editStages){
      const del = document.createElement('button'); del.textContent='🗑️'; del.className='ghost';
      del.addEventListener('click',()=>{
        if(!confirm('Remover etapa? Leads migrarão para a etapa anterior.')) return;
        const prev = Store.data.stages[idx-1] || Store.data.stages[0];
        Store.data.leads.forEach(l=>{ if(l.etapa===stage) l.etapa=prev; });
        Store.data.stages.splice(idx,1); renderLeads(); refreshEtapasOptions();
      });
      tools.appendChild(del);
    }
    head.append(h4, tools); col.appendChild(head);

    col.addEventListener('dragover',e=>{ e.preventDefault(); });
    col.addEventListener('drop',e=>{
      const id = e.dataTransfer.getData('text/plain');
      const lead = Store.data.leads.find(x=>x.id===id);
      if(lead){ lead.etapa = stage; lead.stageChangedAt=todayISO(); lead.updatedAt=todayISO(); Store.save(); renderLeads(); calcKPIs(); }
    });

    wrap.appendChild(col);
  });

  // Cards
  Store.data.leads.forEach(l=>{
    const col = wrap.querySelector(`.column[data-stage="${CSS.escape(l.etapa)}"]`) || wrap.querySelector('.column');
    const card = document.createElement('div'); card.className='draggable'; card.draggable=true; card.id=l.id; card.tabIndex=0;
    card.addEventListener('dragstart',e=>{ e.dataTransfer.setData('text/plain',l.id); });
    card.innerHTML = `
      <strong>${l.crianca}</strong> <span class="tiny">(${l.idade} anos)</span>
      <div class="tiny">Resp.: ${l.responsavel} — ${l.telefone}</div>
      <div class="tiny">${l.periodo} · ${l.frequencia}x/sem · ${l.fonte}</div>
      <div class="tiny">Bairro: ${l.bairro} ${l.valorVenda? '· Valor: '+fmtBRL(l.valorVenda):''}</div>
    `;
    card.onclick = ()=> openLeadViewModal(l);
    card.onkeydown = (e)=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); openLeadViewModal(l); } };
    col.appendChild(card);
  });
}

function openLeadViewModal(l){
  const tasksForLead = Store.data.tasks.leads.items.filter(t=>t.leadId===l.id);
  openModal('Lead', `
    <div class='row'>
      <div><label>Responsável</label><input id='vResp' value='${l.responsavel}' disabled/></div>
      <div><label>Telefone</label><input id='vTel' value='${l.telefone}' disabled/></div>
      <div><label>Bairro</label><input id='vBairro' value='${l.bairro}' disabled/></div>
    </div>
    <div class='row'>
      <div><label>Criança</label><input id='vCrianca' value='${l.crianca}' disabled/></div>
      <div><label>Idade</label><input id='vIdade' type='number' value='${l.idade}' disabled/></div>
      <div><label>Período</label><input id='vPeriodo' value='${l.periodo}' disabled/></div>
    </div>
    <div class='row'>
      <div><label>Frequência</label><input id='vFreq' value='${l.frequencia}' disabled/></div>
      <div><label>Fonte</label><input id='vFonte' value='${l.fonte}' disabled/></div>
      <div><label>Etapa</label><input id='vEtapa' value='${l.etapa}' disabled/></div>
    </div>
    <div class='row'>
      <div><label>Valor da venda</label><input id='vValor' type='number' step='0.01' value='${l.valorVenda||''}' disabled/></div>
      <div><label>Observações</label><textarea id='vObs' disabled>${l.observacoes||''}</textarea></div>
    </div>
    <div class='card' style='margin:8px 0'>
      <h3>Interações</h3>
      <div class='tiny'>Criado em ${new Date(l.createdAt).toLocaleString()} — Atualizado em ${new Date(l.updatedAt).toLocaleString()}</div>
      ${l.stageChangedAt? `<div class='tiny'>Última mudança de etapa: ${new Date(l.stageChangedAt).toLocaleString()}</div>`:''}
    </div>
    <div class='card'>
      <h3>Tarefas deste lead</h3>
      <div id='leadTasksBox'>${tasksForLead.map(t=>`<div class='tiny'>${new Date(t.prazo).toLocaleDateString()} — ${t.descricao} <span class='pill prio-${t.prioridade}'>${t.prioridade}</span> · ${t.etapa}</div>`).join('') || '<div class="tiny">Nenhuma tarefa agendada.</div>'}</div>
      <div class='row' style='margin-top:6px'><button id='showDoneTasks' class='ghost'>Mostrar concluídas</button></div>
    </div>
    <div class='row'><div class='right'><button id='vEdit' class='primary'>Editar</button></div></div>
  `);
  $$('#showDoneTasks').onclick = ()=>{ toast('No momento, concluídas dependem de uma etapa criada pelo usuário (ex: "concluída").'); };
  $$('#vEdit').onclick = ()=>{
    closeModal(); openLeadModal(l);
    const box = document.getElementById('modalBody');
    const row = document.createElement('div'); row.className='row'; row.innerHTML = `<button id='mDel' class='danger'>Excluir</button>`; box.appendChild(row);
    document.getElementById('mDel').onclick = ()=>{ if(confirm('Excluir lead?')){ Store.data.leads = Store.data.leads.filter(x=>x.id!==l.id); Store.save(); closeModal(); renderLeads(); calcKPIs(); } };
  };
}

// Tabela de leads (lista)
const defaultCols = [
  {key:'responsavel', label:'Responsável', required:true},
  {key:'crianca', label:'Criança', required:true},
  {key:'idade', label:'Idade'},
  {key:'periodo', label:'Período'},
  {key:'frequencia', label:'Freq.'},
  {key:'fonte', label:'Fonte'},
  {key:'telefone', label:'Telefone', required:true},
  {key:'bairro', label:'Bairro'},
  {key:'etapa', label:'Etapa'},
  {key:'valorVenda', label:'Valor'}
];
let leadColsState = null;
let leadSort = {key:'responsavel', dir:1};

function renderLeadTable(){
  if(!leadColsState){ leadColsState = defaultCols.map(c=>({ ...c, visible: c.required || true })); }
  const head = $$('#leadHead'); const tbody = $$('#leadListBody'); const colsBox = $$('#leadCols');
  colsBox.innerHTML = '';
  leadColsState.forEach((c,i)=>{
    const wrap = document.createElement('label'); wrap.className='tag'; wrap.draggable=true; wrap.dataset.idx=i;
    const cb = document.createElement('input'); cb.type='checkbox'; cb.checked = !!c.visible; cb.disabled = !!c.required; cb.onchange = ()=>{ c.visible = cb.checked; renderLeadTable(); };
    wrap.appendChild(cb); wrap.appendChild(document.createTextNode(' '+c.label)); colsBox.appendChild(wrap);
    wrap.addEventListener('dragstart',e=>{ e.dataTransfer.setData('text/plain', i); });
    wrap.addEventListener('dragover',e=>{ e.preventDefault(); });
    wrap.addEventListener('drop',e=>{ e.preventDefault(); const from=+e.dataTransfer.getData('text/plain'); const to=i; const item=leadColsState.splice(from,1)[0]; leadColsState.splice(to,0,item); renderLeadTable(); });
  });
  head.innerHTML = '';
  leadColsState.forEach(c=>{
    if(!c.visible) return; const th=document.createElement('th'); th.textContent=c.label; th.style.cursor='pointer';
    th.onclick = ()=>{ leadSort.key=c.key; leadSort.dir*=-1; renderLeadTable(); };
    head.appendChild(th);
  });
  const q = ($$('#leadSearch')?.value||'').toLowerCase();
  const data = Store.data.leads
    .filter(l=> JSON.stringify(l).toLowerCase().includes(q))
    .sort((a,b)=>{ const va=a[leadSort.key]; const vb=b[leadSort.key]; return (va>vb?1:va<vb?-1:0)*leadSort.dir; });
  tbody.innerHTML='';
  data.forEach(l=>{
    const tr=document.createElement('tr'); tr.tabIndex=0; tr.onclick=()=> openLeadViewModal(l); tr.onkeydown=(e)=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); openLeadViewModal(l);} };
    leadColsState.forEach(c=>{
      if(!c.visible) return; let v=l[c.key]; if(c.key==='valorVenda') v = v? fmtBRL(v):'-';
      const td=document.createElement('td'); td.textContent = (v??'').toString(); tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}

function openLeadModal(l){
  openModal('Editar Lead', `
    <div class='row'>
      <div><label>Responsável</label><input id='mResp' value='${l.responsavel}'/></div>
      <div><label>Telefone</label><input id='mTel' value='${l.telefone}'/></div>
      <div><label>Bairro</label><input id='mBairro' value='${l.bairro}'/></div>
    </div>
    <div class='row'>
      <div><label>Criança</label><input id='mCrianca' value='${l.crianca}'/></div>
      <div><label>Idade</label><input id='mIdade' type='number' value='${l.idade}'/></div>
      <div><label>Período</label><select id='mPeriodo'><option ${l.periodo==='manhã'?'selected':''}>manhã</option><option ${l.periodo==='tarde'?'selected':''}>tarde</option></select></div>
    </div>
    <div class='row'>
      <div><label>Frequência</label><select id='mFreq'><option ${l.frequencia==='3'?'selected':''}>3</option><option ${l.frequencia==='4'?'selected':''}>4</option><option ${l.frequencia==='5'?'selected':''}>5</option></select></div>
      <div><label>Fonte</label><select id='mFonte'><option ${l.fonte==='marketing digital'?'selected':''}>marketing digital</option><option ${l.fonte==='indicação'?'selected':''}>indicação</option><option ${l.fonte==='outros'?'selected':''}>outros</option></select></div>
      <div><label>Etapa</label><select id='mEtapa'>${Store.data.stages.map(s=>`<option ${l.etapa===s?'selected':''}>${s}</option>`).join('')}</select></div>
    </div>
    <div class='row'>
      <div><label>Valor da venda</label><input id='mValor' type='number' step='0.01' value='${l.valorVenda||''}'/></div>
    </div>
    <div class='row'><div class='right'><button id='mSalvar' class='primary'>Salvar</button></div></div>
  `);
  $$('#mSalvar').onclick = ()=>{
    l.responsavel = $$('#mResp').value.trim();
    l.telefone = $$('#mTel').value.trim();
    l.bairro = $$('#mBairro').value.trim();
    l.crianca = $$('#mCrianca').value.trim();
    l.idade = Number($$('#mIdade').value||0);
    l.periodo = $$('#mPeriodo').value;
    l.frequencia = $$('#mFreq').value;
    l.fonte = $$('#mFonte').value;
    const newStage = $$('#mEtapa').value;
    if(newStage!==l.etapa){ l.etapa=newStage; l.stageChangedAt=todayISO(); }
    l.valorVenda = Number($$('#mValor').value||0);
    l.updatedAt = todayISO();
    Store.save(); closeModal(); renderLeads(); calcKPIs();
  }
}

function quickMoveLead(l){
  const idx = Store.data.stages.indexOf(l.etapa);
  const next = Store.data.stages[idx+1] || Store.data.stages[0];
  if(confirm(`Mover "${l.crianca}" de ${l.etapa} para ${next}?`)){
    l.etapa=next; l.stageChangedAt=todayISO(); l.updatedAt=todayISO(); Store.save(); renderLeads(); calcKPIs();
  }
}

// Tarefas
const taskTypeSel = $$('#taskType');
taskTypeSel.addEventListener('change', renderTasks);
$$('#btnTaskStages').addEventListener('click',()=> customizeTaskStages(taskTypeSel.value));
$$('#btnTaskNew').addEventListener('click',()=> newTask(taskTypeSel.value));

function renderTasks(){
  const type = taskTypeSel.value; const area = $$('#taskKanban'); area.innerHTML='';
  const cfg = Store.data.tasks[type];
  cfg.stages.forEach(stage=>{
    const col = document.createElement('div'); col.className='column'; col.dataset.stage=stage;
    const head = document.createElement('header');
    const h4 = document.createElement('h4'); h4.textContent = stage; h4.contentEditable = !!document.body.dataset.editTaskStages;
    h4.addEventListener('input',()=>{ const i=cfg.stages.indexOf(stage); if(i>-1) cfg.stages[i]=h4.textContent.trim()||stage; });
    const tools = document.createElement('div');
    if(document.body.dataset.editTaskStages){
      if(stage!=='para fazer' && stage!=='fazendo'){
        const del = document.createElement('button'); del.textContent='-'; del.className='ghost';
        del.onclick = ()=>{ if(!confirm('Remover etapa? Itens irão para etapa anterior.')) return; const idx=cfg.stages.indexOf(stage); const prev=cfg.stages[idx-1]||cfg.stages[0]; cfg.items.forEach(t=>{ if(t.etapa===stage) t.etapa=prev; }); cfg.stages.splice(idx,1); renderTasks(); };
        tools.appendChild(del);
      }
      const add = document.createElement('button'); add.textContent='+'; add.className='ghost'; add.onclick = ()=>{ const name=prompt('Nome da etapa'); if(!name) return; cfg.stages.push(name); renderTasks(); };
      tools.appendChild(add);
    }
    head.append(h4,tools); col.appendChild(head);
    col.addEventListener('dragover',e=>e.preventDefault());
    col.addEventListener('drop',e=>{ const id=e.dataTransfer.getData('text/plain'); const item=cfg.items.find(t=>t.id===id); if(item){ item.etapa=stage; Store.save(); renderTasks(); }});
    area.appendChild(col);
  });
  cfg.items.forEach(t=>{
    const col = area.querySelector(`.column[data-stage="${CSS.escape(t.etapa)}"]`) || area.querySelector('.column');
    const d = document.createElement('div'); d.className='draggable'; d.draggable=true; d.id=t.id;
    d.addEventListener('dragstart',e=> e.dataTransfer.setData('text/plain', t.id));
    const pr = t.prioridade||'baixa';
    const tag = `<span class='pill prio-${pr}'>${pr}</span>`;
    const link = (taskTypeSel.value==='leads' ? (Store.data.leads.find(l=>l.id===t.leadId)?.crianca||'-') : (Store.data.entities.find(e=>e.id===t.entityId)?.nome||'-'));
    d.innerHTML = `
      <div class='flex-between'><strong>${t.descricao}</strong> ${tag}</div>
      <div class='tiny'>Vínculo: ${link}</div>
      <div class='tiny'>Prazo: ${new Date(t.prazo).toLocaleDateString()}</div>
      <div class='row' style='margin-top:6px'>
        <button class='ghost' data-act='edit'>Editar</button>
        <button class='danger' data-act='del'>Excluir</button>
      </div>`;
    d.querySelector('[data-act="edit"]').onclick = ()=> openTaskModal(type, t);
    d.querySelector('[data-act="del"]').onclick = ()=>{ if(confirm('Excluir tarefa?')){ cfg.items = cfg.items.filter(x=>x.id!==t.id); Store.save(); renderTasks(); } };
    col.appendChild(d);
  })
}

function customizeTaskStages(type){
  document.body.dataset.editTaskStages = document.body.dataset.editTaskStages? '' : '1';
  renderTasks();
  if(!document.body.dataset.editTaskStages){ Store.save(); toast('Etapas atualizadas'); }
}

function newTask(type){ openTaskModal(type, null); }

function openTaskModal(type, t){
  const cfg = Store.data.tasks[type];
  const isLead = type==='leads';
  const stagesOpt = cfg.stages.map(s=>`<option ${t&&t.etapa===s?'selected':''}>${s}</option>`).join('');
  const linkOpt = isLead
    ? Store.data.leads.map(l=>`<option value='${l.id}' ${t&&t.leadId===l.id?'selected':''}>${l.crianca} — ${l.responsavel}</option>`).join('')
    : Store.data.entities.map(e=>`<option value='${e.id}' ${t&&t.entityId===e.id?'selected':''}>${e.tipo.toUpperCase()}: ${e.nome}</option>`).join('');
  const addBtn = isLead? '' : `<button id='quickAddEnt' class='ghost'>+ Adicionar pessoa/empresa</button>`;

  openModal((t?'Editar':'Nova')+` tarefa`, `
    <div class='row'>
      <div>
        <label>${isLead? 'Lead vinculado':'Pessoa/Empresa vinculada'}</label>
        <div class='row'>
          <div style='flex:1'><select id='tLink'><option value=''>Selecionar…</option>${linkOpt}</select></div>
          <div style='flex:0'>${addBtn}</div>
        </div>
      </div>
      <div><label>Descrição</label><input id='tDesc' value='${t?.descricao||''}'/></div>
    </div>
    <div class='row'>
      <div><label>Prazo</label><input id='tPrazo' type='date' value='${ t? new Date(t.prazo).toISOString().slice(0,10) : ''}'/></div>
      <div>
        <label>Prioridade</label>
        <select id='tPrio'>${['baixa','média','alta','urgente'].map(p=>`<option ${t&&t.prioridade===p?'selected':''}>${p}</option>`).join('')}</select>
      </div>
      <div>
        <label>Etapa</label>
        <select id='tEtapa'>${stagesOpt}</select>
      </div>
    </div>
    <div class='row'><div class='right'><button id='tSave' class='primary'>Salvar</button></div></div>
  `);

  if(!isLead){ const btn = $$('#quickAddEnt'); if(btn){ btn.onclick = ()=> openEntityModal(); } }

  $$('#tSave').onclick = ()=>{
    const item = t || { id: uid(), tipo:type };
    if(isLead) item.leadId = $$('#tLink').value; else item.entityId = $$('#tLink').value;
    item.descricao = $$('#tDesc').value.trim();
    item.prazo = new Date($$('#tPrazo').value || Date.now()).toISOString();
    item.prioridade = $$('#tPrio').value;
    item.etapa = $$('#tEtapa').value || cfg.stages[0];
    if(!item.descricao){ toast('Descrição obrigatória'); return; }
    if(t){ Object.assign(t,item); } else { cfg.items.push(item); }
    Store.save(); closeModal(); renderTasks();
  }
}

// Pessoas & Empresas
$$('#btnNewEnt').addEventListener('click', ()=> openEntityModal());
$$('#entFilterType').addEventListener('change', renderEntities);
$$('#entFilterFinalidade').addEventListener('input', renderEntities);

let entSort = { key: 'nome', dir: 1 };
function renderEntities(){
  const type = $$('#entFilterType').value; const f = $$('#entFilterFinalidade').value.toLowerCase();
  const tbody = $$('#entList'); tbody.innerHTML='';
  const data = Store.data.entities
    .filter(e=> type==='todos' || e.tipo===type)
    .filter(e=> !f || (e.finalidade||'').toLowerCase().includes(f))
    .sort((a,b)=>{ const va=(a[entSort.key]||'').toString().toLowerCase(); const vb=(b[entSort.key]||'').toString().toLowerCase(); return (va>vb?1:va<vb?-1:0)*entSort.dir; });
  data.forEach(e=>{
    const tr=document.createElement('tr');
    tr.innerHTML = `<td>${e.tipo}</td><td>${e.nome}</td><td>${e.telefone||'-'}</td><td>${e.finalidade||'-'}</td><td>${e.contatoEmpresa||'-'}</td>`;
    tr.addEventListener('click',()=> openEntityModal(e));
    tbody.appendChild(tr);
  });
  const head = $$('#entHead'); if(head && !head.dataset.sortBound){
    head.dataset.sortBound = '1';
    const headers = ['tipo','nome','telefone','finalidade','contatoEmpresa'];
    Array.from(head.children).forEach((th,idx)=>{
      th.style.cursor='pointer';
      th.onclick = ()=>{ entSort.key = headers[idx]; entSort.dir *= -1; renderEntities(); };
    });
  }
}

function openEntityModal(ent){
  openModal(ent ? 'Editar cadastro' : 'Novo cadastro', `
    <div class="row">
      <div>
        <label>Tipo</label>
        <select id="entTipo">
          <option value="pessoa" ${ent?.tipo==="pessoa"?"selected":""}>Pessoa física</option>
          <option value="empresa" ${ent?.tipo==="empresa"?"selected":""}>Pessoa jurídica</option>
        </select>
      </div>
    </div>
    <div class="row" id="entFields"></div>
    <div class="row"><div class="right"><button id="entSalvar" class="primary">Salvar</button></div></div>
  `);
  function renderFields(){
    const tipo = $$('#entTipo').value;
    const box = $$('#entFields');
    if(tipo==="pessoa"){
      box.innerHTML = `
        <div><label>Nome</label><input id="entNome" value="${ent?.nome||""}"/></div>
        <div><label>Telefone</label><input id="entTel" value="${ent?.telefone||""}"/></div>
        <div><label>Finalidade do contato</label><input id="entFinalidade" value="${ent?.finalidade||""}" placeholder="Ex: fornecedor, parceria, influenciador"/></div>
      `;
    }else{
      box.innerHTML = `
        <div><label>Nome da empresa</label><input id="entNome" value="${ent?.nome||""}"/></div>
        <div><label>Telefone</label><input id="entTel" value="${ent?.telefone||""}"/></div>
        <div><label>Nome do contato dentro da empresa</label><input id="entContatoEmpresa" value="${ent?.contatoEmpresa||""}"/></div>
        <div><label>Finalidade</label><input id="entFinalidade" value="${ent?.finalidade||""}" placeholder="Ex: convênio, fornecedor"/></div>
      `;
    }
  }
  $$('#entTipo').addEventListener('change', renderFields);
  renderFields();

  $$('#entSalvar').onclick = ()=>{
    const tipo = $$('#entTipo').value;
    const nome = $$('#entNome').value.trim();
    const telefone = $$('#entTel').value.trim();
    const finalidade = $$('#entFinalidade').value.trim();
    let contatoEmpresa = "";
    if(tipo==="empresa") contatoEmpresa = $$('#entContatoEmpresa').value.trim();
    if(!nome){ toast('Preencha o nome'); return; }
    if(ent){
      ent.tipo = tipo;
      ent.nome = nome;
      ent.telefone = telefone;
      ent.finalidade = finalidade;
      ent.contatoEmpresa = contatoEmpresa;
    }else{
      Store.data.entities.push({
        id: uid(),
        tipo,
        nome,
        telefone,
        finalidade,
        contatoEmpresa
      });
    }
    Store.save(); closeModal(); renderEntities();
  }
}

// Modal
function openModal(title, html){
  $$('#modalTitle').textContent = title;
  $$('#modalBody').innerHTML = html;
  $$('#modal').style.display = 'flex';
}
function closeModal(){
  $$('#modal').style.display = 'none';
  $$('#modalBody').innerHTML = '';
}
$$('#modalClose').onclick = closeModal;
window.addEventListener('keydown',e=>{ if(e.key==='Escape') closeModal(); });

// Dev: tema e layout
function updateColorDots(){
  const pairs = [
    ['setNeon','dotNeon'],['setNeon2','dotNeon2'],['setBg','dotBg'],['setBg2','dotBg2'],
    ['setFontColor','dotFont'],['setFontDimColor','dotFontDim'],['setNavText','dotNavText'],
    ['advText','dotAdvText'],['advTextDim','dotAdvTextDim'],['advMuted','dotAdvMuted'],['advCard','dotAdvCard'],['advDanger','dotAdvDanger'],['advWarning','dotAdvWarning'],['advSuccess','dotAdvSuccess']
  ];
  pairs.forEach(([i,d])=>{ if($$('#'+i) && $$('#'+d)) $$('#'+d).style.background = $$('#'+i).value; });
}

$$$('input[type="color"]').forEach(i=> i.addEventListener('input', updateColorDots));

$$('#applyTheme').onclick = ()=>{
  document.body.classList.toggle('accent-grad', $$('#setNeonGrad')?.checked);
  document.documentElement.style.setProperty('--accent-neon', $$('#setNeon').value);
  if($$('#setNeon2')) document.documentElement.style.setProperty('--accent2', $$('#setNeon2').value||'#9cff04');
  document.body.classList.toggle('bg-solid', !$$('#setBgGrad')?.checked);
  document.documentElement.style.setProperty('--bg', $$('#setBg').value);
  if($$('#setBg2')) document.documentElement.style.setProperty('--bg2', $$('#setBg2').value||'#0e1430');
  if($$('#setFont').value) document.documentElement.style.setProperty('--font', $$('#setFont').value);
  if($$('#setFontColor')) document.documentElement.style.setProperty('--text', $$('#setFontColor').value);
  if($$('#setFontDimColor')) document.documentElement.style.setProperty('--text-dim', $$('#setFontDimColor').value);
  if($$('#setNavBg').value) document.documentElement.style.setProperty('--nav-bg', $$('#setNavBg').value);
  if($$('#setNavText').value) document.documentElement.style.setProperty('--nav-text', $$('#setNavText').value);
  if($$('#setNavFont').value) document.documentElement.style.setProperty('--nav-font', $$('#setNavFont').value);
  document.body.dataset.navpos = ($$('#setNavPos')?.value||'left');
  applyNavPosition();
  Store.data.theme = {
    accent: $$('#setNeon').value,
    accent2: $$('#setNeon2')?.value||'#9cff04',
    accentGrad: !!$$('#setNeonGrad')?.checked,
    bg: $$('#setBg').value,
    bg2: $$('#setBg2')?.value||'#0e1430',
    bgGrad: !!$$('#setBgGrad')?.checked,
    font: $$('#setFont').value,
    fontColor: $$('#setFontColor')?.value,
    fontDimColor: $$('#setFontDimColor')?.value,
    navBg: $$('#setNavBg')?.value,
    navText: $$('#setNavText')?.value,
    navFont: $$('#setNavFont')?.value,
    navPos: $$('#setNavPos')?.value||'left'
  };
  Store.save();
  toast('Tema aplicado');
};
$$('#resetTheme').onclick = ()=>{
  document.documentElement.style.setProperty('--neon', '#c7f603');
  document.documentElement.style.setProperty('--bg', '#0b1020');
  document.documentElement.style.setProperty('--font', 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, "Apple Color Emoji", "Segoe UI Emoji"');
  $$('#setNeon').value = '#c7f603';
  $$('#setBg').value = '#0b1020';
  $$('#setFont').value = '';
  Store.data.theme = {};
  Store.save();
  toast('Tema restaurado');
};
if(Store.data.theme){
  if(Store.data.theme.accent) document.documentElement.style.setProperty('--accent-neon', Store.data.theme.accent);
  if(Store.data.theme.accent2) document.documentElement.style.setProperty('--accent2', Store.data.theme.accent2);
  if(Store.data.theme.accentGrad) document.body.classList.toggle('accent-grad', !!Store.data.theme.accentGrad);
  if(Store.data.theme.bg) document.documentElement.style.setProperty('--bg', Store.data.theme.bg);
  if(Store.data.theme.bg2) document.documentElement.style.setProperty('--bg2', Store.data.theme.bg2);
  if(Store.data.theme.bgGrad===false) document.body.classList.add('bg-solid');
  if(Store.data.theme.font) document.documentElement.style.setProperty('--font', Store.data.theme.font);
  if(Store.data.theme.fontColor) document.documentElement.style.setProperty('--text', Store.data.theme.fontColor);
  if(Store.data.theme.fontDimColor) document.documentElement.style.setProperty('--text-dim', Store.data.theme.fontDimColor);
  if(Store.data.theme.navBg) document.documentElement.style.setProperty('--nav-bg', Store.data.theme.navBg);
  if(Store.data.theme.navText) document.documentElement.style.setProperty('--nav-text', Store.data.theme.navText);
  if(Store.data.theme.navFont) document.documentElement.style.setProperty('--nav-font', Store.data.theme.navFont);
  if(Store.data.theme.navPos) { document.body.dataset.navpos=Store.data.theme.navPos; applyNavPosition(); }
  if($$('#setNeon')) $$('#setNeon').value = Store.data.theme.accent||'#c7f603';
  if($$('#setNeon2')) $$('#setNeon2').value = Store.data.theme.accent2||'#9cff04';
  if($$('#setNeonGrad')) $$('#setNeonGrad').checked = !!Store.data.theme.accentGrad;
  if($$('#setBg')) $$('#setBg').value = Store.data.theme.bg||'#0b1020';
  if($$('#setBg2')) $$('#setBg2').value = Store.data.theme.bg2||'#0e1430';
  if($$('#setBgGrad')) $$('#setBgGrad').checked = !!Store.data.theme.bgGrad;
  if($$('#setFont')) $$('#setFont').value = Store.data.theme.font||'';
  if($$('#setFontColor')) $$('#setFontColor').value = Store.data.theme.fontColor||getComputedStyle(document.documentElement).getPropertyValue('--text').trim()||'#eef3ff';
  if($$('#setFontDimColor')) $$('#setFontDimColor').value = Store.data.theme.fontDimColor||getComputedStyle(document.documentElement).getPropertyValue('--text-dim').trim()||'#c8d0ff';
  if($$('#setNavBg')) $$('#setNavBg').value = Store.data.theme.navBg||'';
  if($$('#setNavText')) $$('#setNavText').value = Store.data.theme.navText||'';
  if($$('#setNavFont')) $$('#setNavFont').value = Store.data.theme.navFont||'';
  if($$('#setNavPos')) $$('#setNavPos').value = Store.data.theme.navPos||'left';
  if(typeof updateColorDots==='function') updateColorDots();
}

function applyNavPosition(){
  const layout = document.querySelector('.layout'); const nav = document.querySelector('nav'); const main = document.querySelector('main');
  if(document.body.dataset.navpos==='top'){
    layout.style.flexDirection='column'; nav.style.width='100%'; nav.style.borderRight='none'; nav.style.borderBottom='1px solid var(--muted)';
  }else{
    layout.style.flexDirection='row'; nav.style.width=''; nav.style.borderBottom='none'; nav.style.borderRight='1px solid var(--muted)';
  }
}

// Aplicar/Restaurar Menu
$$('#applyMenu').onclick = ()=>{
  if($$('#setNavBg').value) document.documentElement.style.setProperty('--nav-bg', $$('#setNavBg').value);
  if($$('#setNavText').value) document.documentElement.style.setProperty('--nav-text', $$('#setNavText').value);
  if($$('#setNavFont').value) document.documentElement.style.setProperty('--nav-font', $$('#setNavFont').value);
  document.body.dataset.navpos = ($$('#setNavPos')?.value||'left');
  applyNavPosition();
  Store.data.theme.navBg = $$('#setNavBg')?.value;
  Store.data.theme.navText = $$('#setNavText')?.value;
  Store.data.theme.navFont = $$('#setNavFont')?.value;
  Store.data.theme.navPos = $$('#setNavPos')?.value||'left';
  Store.save();
  toast('Menu aplicado');
};
$$('#resetMenu').onclick = ()=>{
  document.documentElement.style.setProperty('--nav-bg', getComputedStyle(document.documentElement).getPropertyValue('--nav-bg').trim());
  document.documentElement.style.setProperty('--nav-text', '#eef3ff');
  document.documentElement.style.setProperty('--nav-font', getComputedStyle(document.documentElement).getPropertyValue('--nav-font').trim());
  $$('#setNavBg').value = '';
  $$('#setNavText').value = '#eef3ff';
  $$('#setNavFont').value = '';
  Store.data.theme.navBg = '';
  Store.data.theme.navText = '#eef3ff';
  Store.data.theme.navFont = '';
  Store.save();
  toast('Menu restaurado');
};

// Dev: add tab/feat e backup
$$('#genTabPrompt').onclick = ()=>{
  $$('#tabPrompt').value =
`Contexto: Neon Educacional CRM, single HTML.
Quero adicionar uma nova aba ao CRM.
Explique o objetivo da aba, onde será inserida no código, obrigatoriedades e peculiaridades.
Exemplo de prompt:
"Quero uma aba chamada 'Financeiro' para controlar pagamentos dos alunos. Ela deve aparecer no menu lateral, ter cards de recebimentos, filtros por período, e opção de exportar dados. Precisa ser responsiva e usar o mesmo padrão visual das outras abas."`;
};
$$('#copyTabPrompt').onclick = ()=>{ $$('#tabPrompt').select(); document.execCommand('copy'); toast('Prompt copiado!'); };
$$('#genFeatPrompt').onclick = ()=>{
  $$('#featPrompt').value =
`Contexto: Neon Educacional CRM, single HTML.
Quero adicionar uma nova funcionalidade ao CRM.
Explique o objetivo, onde será inserida, obrigatoriedades e peculiaridades.
Exemplo de prompt:
"Quero uma funcionalidade de envio de WhatsApp para leads. Botão em cada card de lead, que abre link do WhatsApp com mensagem personalizada. Precisa funcionar em desktop e mobile."`;
};
$$('#copyFeatPrompt').onclick = ()=>{ $$('#featPrompt').select(); document.execCommand('copy'); toast('Prompt copiado!'); };

$$('#addBlankTab').onclick = ()=>{
  const name = prompt('Nome da nova aba:');
  if(!name) return;
  const nav = document.querySelector('nav');
  const btn = document.createElement('button');
  btn.className = 'tab';
  btn.dataset.tab = name.toLowerCase().replace(/\s+/g,'');
  btn.textContent = `🆕 ${name}`;
  nav.appendChild(btn);
  const main = document.querySelector('main');
  const sec = document.createElement('section');
  sec.id = btn.dataset.tab;
  sec.className = 'tabview hidden';
  sec.innerHTML = `<div class="card"><h3>${name}</h3><div>Conteúdo inicial da aba "${name}".</div></div>`;
  main.appendChild(sec);
  btn.onclick = ()=> {
    $$$('nav .tab').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    $$$('.tabview').forEach(s=>s.classList.add('hidden'));
    sec.classList.remove('hidden');
  };
  toast('Nova aba adicionada!');
};

// Backup export/import
$$('#btnExport').onclick = ()=>{
  const data = JSON.stringify(Store.data, null, 2);
  const blob = new Blob([data], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'neon-crm-backup.json';
  document.body.appendChild(a);
  a.click();
  setTimeout(()=>{ document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
  toast('Backup exportado!');
};
$$('#fileImport').onchange = (e)=>{
  const file = e.target.files[0];
  if(!file){ const info=$$('#importResult'); if(info) info.textContent=''; return; }
  const info = $$('#importResult'); if(info) info.textContent = '';
  if(file.type !== 'application/json' && !file.name.endsWith('.json')){
    if(info) info.textContent = 'Erro: o arquivo deve ser .json.'; toast('Arquivo inválido (não é JSON)'); return;
  }
  const reader = new FileReader();
  reader.onload = function(ev){
    try{
      const data = JSON.parse(ev.target.result);
      if(Array.isArray(data.leads) && typeof data.tasks === 'object' && Array.isArray(data.entities)){
        Store.data.stages = Array.isArray(data.stages) ? data.stages : Store.data.stages;
        Store.data.leads = data.leads;
        Store.data.tasks = data.tasks;
        Store.data.entities = data.entities;
        Store.data.theme = data.theme || {};
        Store.save();
        toast('Backup importado!');
        if(info){
          const leadCount = Store.data.leads.length;
          const taskCount = (Store.data.tasks.leads.items.length + Store.data.tasks.escola.items.length);
          const entCount = Store.data.entities.length;
          info.textContent = `Sucesso: ${leadCount} leads, ${taskCount} tarefas e ${entCount} cadastros importados.`;
        }
        refreshEtapasOptions();
        renderLeads();
        renderTasks();
        renderEntities();
        calcKPIs();
      }else{
        toast('Arquivo inválido');
        if(info) info.textContent = 'Erro: arquivo não segue o formato esperado.';
      }
    }catch(err){
      toast('Erro ao importar');
      if(info) info.textContent = 'Erro: não foi possível ler o JSON.';
    }
  };
  reader.readAsText(file);
};
$$('#btnImport').onclick = () => {
  const fileInput = $$('#fileImport');
  const info = $$('#importResult'); if(info) info.textContent = '';
  if (!fileInput.files.length) { if(info) info.textContent='Erro: selecione um arquivo .json para importar.'; toast('Selecione um arquivo .json para importar'); return; }
  const file = fileInput.files[0];
  if(file.type !== 'application/json' && !file.name.endsWith('.json')){ if(info) info.textContent='Erro: o arquivo deve ser .json.'; toast('Arquivo inválido (não é JSON)'); return; }
  const event = new Event('change');
  fileInput.dispatchEvent(event);
};

// Inicialização
renderLeads();
renderTasks();
renderEntities();
calcKPIs();
if(typeof updateColorDots==='function') updateColorDots();
if(typeof GitHubSync!=='undefined'){
  GitHubSync.uiLoad();
  GitHubSync.bindUI();
  const _save = Store.save.bind(Store);
  Store.save = function(){ _save(); if(GitHubSync.cfg.auto){ GitHubSync.debouncedSaveNow(); } };
}

