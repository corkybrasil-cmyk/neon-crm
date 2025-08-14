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

// Função para renderizar leads no Kanban
function renderLeads() {
  const wrap = $$('#kanbanWrap');
  if (!wrap) return;
  
  wrap.innerHTML = '';
  const isKanban = $$('#leadView')?.value === 'kanban';
  
  if (!isKanban) {
    renderLeadTable();
    return;
  }
  
  // Criar colunas do Kanban
  Store.data.stages.forEach((stage, idx) => {
    const col = document.createElement('div');
    col.className = 'column';
    col.dataset.stage = stage;
    
    const head = document.createElement('header');
    const h4 = document.createElement('h4');
    h4.textContent = stage;
    h4.contentEditable = !!document.body.dataset.editStages;
    
    h4.addEventListener('input', () => {
      Store.data.stages[idx] = h4.textContent.trim() || stage;
    });
    
    const tools = document.createElement('div');
    if (document.body.dataset.editStages) {
      const del = document.createElement('button');
      del.textContent = '🗑️';
      del.className = 'ghost';
      del.addEventListener('click', () => {
        if (!confirm('Remover etapa? Leads migrarão para a etapa anterior.')) return;
        const prev = Store.data.stages[idx - 1] || Store.data.stages[0];
        Store.data.leads.forEach(l => {
          if (l.etapa === stage) l.etapa = prev;
        });
        Store.data.stages.splice(idx, 1);
        Store.save();
        renderLeads();
      });
      tools.appendChild(del);
    }
    
    head.append(h4, tools);
    col.appendChild(head);
    
    col.addEventListener('dragover', e => { e.preventDefault(); });
    col.addEventListener('drop', e => {
      const id = e.dataTransfer.getData('text/plain');
      const lead = Store.data.leads.find(x => x.id === id);
      if (lead) {
        lead.etapa = stage;
        lead.stageChangedAt = todayISO();
        lead.updatedAt = todayISO();
        Store.save();
        renderLeads();
      }
    });
    
    wrap.appendChild(col);
  });
  
  // Criar cards dos leads
  Store.data.leads.forEach(l => {
    const col = wrap.querySelector(`.column[data-stage="${CSS.escape(l.etapa)}"]`) || wrap.querySelector('.column');
    if (!col) return;
    
    const card = document.createElement('div');
    card.className = 'draggable';
    card.draggable = true;
    card.id = l.id;
    card.tabIndex = 0;
    
    card.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', l.id);
    });
    
    card.innerHTML = `
      <strong>${l.crianca}</strong> <span class="tiny">(${l.idade} anos)</span>
      <div class="tiny">Resp.: ${l.responsavel} — ${l.telefone}</div>
      <div class="tiny">${l.periodo} · ${l.frequencia}x/sem · ${l.fonte}</div>
      <div class="tiny">Bairro: ${l.bairro} ${l.valorVenda ? '· Valor: ' + fmtBRL(l.valorVenda) : ''}</div>
    `;
    
    card.onclick = () => openLeadViewModal(l);
    card.onkeydown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLeadViewModal(l);
      }
    };
    
    col.appendChild(card);
  });
}

// Função para renderizar tabela de leads
function renderLeadTable() {
  const tbody = $$('#leadListBody');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  Store.data.leads.forEach(l => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${l.responsavel}</td>
      <td>${l.crianca}</td>
      <td>${l.idade}</td>
      <td>${l.periodo}</td>
      <td>${l.frequencia}</td>
      <td>${l.fonte}</td>
      <td>${l.telefone}</td>
      <td>${l.bairro}</td>
      <td>${l.etapa}</td>
      <td>${l.valorVenda ? fmtBRL(l.valorVenda) : '-'}</td>
    `;
    tr.addEventListener('click', () => openLeadViewModal(l));
    tbody.appendChild(tr);
  });
}

// Função para abrir modal de visualização do lead
function openLeadViewModal(l) {
  openModal('Detalhes do Lead', `
    <div class='row'>
      <div><label>Responsável</label><input value='${l.responsavel}' disabled/></div>
      <div><label>Telefone</label><input value='${l.telefone}' disabled/></div>
      <div><label>Bairro</label><input value='${l.bairro}' disabled/></div>
    </div>
    <div class='row'>
      <div><label>Criança</label><input value='${l.crianca}' disabled/></div>
      <div><label>Idade</label><input type='number' value='${l.idade}' disabled/></div>
      <div><label>Período</label><input value='${l.periodo}' disabled/></div>
    </div>
    <div class='row'>
      <div><label>Frequência</label><input value='${l.frequencia}' disabled/></div>
      <div><label>Fonte</label><input value='${l.fonte}' disabled/></div>
      <div><label>Etapa</label><select id='vEtapa'>${Store.data.stages.map(s => `<option ${l.etapa === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
    </div>
    <div class='row'>
      <div><label>Valor da venda</label><input type='number' step='0.01' value='${l.valorVenda || ''}' disabled/></div>
      <div><label>Observações</label><textarea disabled>${l.observacoes || ''}</textarea></div>
    </div>
    <div class='row'><div class='right'><button id='vEdit' class='primary'>Editar</button></div></div>
  `);
  
  $$('#vEdit').onclick = () => {
    closeModal();
    openLeadEditModal(l);
  };
}

// Função para abrir modal de edição do lead
function openLeadEditModal(l) {
  openModal('Editar Lead', `
    <div class='row'>
      <div><label>Responsável</label><input id='mResp' value='${l.responsavel}'/></div>
      <div><label>Telefone</label><input id='mTel' value='${l.telefone}'/></div>
      <div><label>Bairro</label><input id='mBairro' value='${l.bairro}'/></div>
    </div>
    <div class='row'>
      <div><label>Criança</label><input id='mCrianca' value='${l.crianca}'/></div>
      <div><label>Idade</label><input id='mIdade' type='number' value='${l.idade}'/></div>
      <div><label>Período</label><select id='mPeriodo'><option ${l.periodo === 'manhã' ? 'selected' : ''}>manhã</option><option ${l.periodo === 'tarde' ? 'selected' : ''}>tarde</option></select></div>
    </div>
    <div class='row'>
      <div><label>Frequência</label><select id='mFreq'><option ${l.frequencia === '3' ? 'selected' : ''}>3</option><option ${l.frequencia === '4' ? 'selected' : ''}>4</option><option ${l.frequencia === '5' ? 'selected' : ''}>5</option></select></div>
      <div><label>Fonte</label><select id='mFonte'><option ${l.fonte === 'marketing digital' ? 'selected' : ''}>marketing digital</option><option ${l.fonte === 'indicação' ? 'selected' : ''}>indicação</option><option ${l.fonte === 'outros' ? 'selected' : ''}>outros</option></select></div>
      <div><label>Etapa</label><select id='mEtapa'>${Store.data.stages.map(s => `<option ${l.etapa === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
    </div>
    <div class='row'>
      <div><label>Valor da venda</label><input id='mValor' type='number' step='0.01' value='${l.valorVenda || ''}'/></div>
    </div>
    <div class='row'><div class='right'><button id='mSalvar' class='primary'>Salvar</button></div></div>
  `);
  
  $$('#mSalvar').onclick = () => {
    l.responsavel = $$('#mResp').value.trim();
    l.telefone = $$('#mTel').value.trim();
    l.bairro = $$('#mBairro').value.trim();
    l.crianca = $$('#mCrianca').value.trim();
    l.idade = Number($$('#mIdade').value || 0);
    l.periodo = $$('#mPeriodo').value;
    l.frequencia = $$('#mFreq').value;
    l.fonte = $$('#mFonte').value;
    const newStage = $$('#mEtapa').value;
    if (newStage !== l.etapa) {
      l.etapa = newStage;
      l.stageChangedAt = todayISO();
    }
    l.valorVenda = Number($$('#mValor').value || 0);
    l.updatedAt = todayISO();
    Store.save();
    closeModal();
    renderLeads();
  };
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
  // Verificar autenticação
  checkAuth();
  
  // Renderizar leads
  renderLeads();
  
  // Event listeners
  const leadView = $$('#leadView');
  if (leadView) {
    leadView.addEventListener('change', function() {
      const isKanban = this.value === 'kanban';
      $$('#kanbanWrap').classList.toggle('hidden', !isKanban);
      $$('#listWrap').classList.toggle('hidden', isKanban);
      renderLeads();
    });
  }
  
  // Botões de edição de etapas
  $$('#editStages').addEventListener('click', () => {
    document.body.dataset.editStages = document.body.dataset.editStages ? '' : '1';
    const on = !!document.body.dataset.editStages;
    $$('#addStage').classList.toggle('hidden', !on);
    $$('#saveStages').classList.toggle('hidden', !on);
    $$('#editStages').textContent = on ? 'Cancel. edição' : 'Editar etapas';
    renderLeads();
  });
  
  $$('#addStage').addEventListener('click', () => {
    const name = prompt('Nome da nova etapa:');
    if (!name) return;
    Store.data.stages.push(name);
    Store.save();
    renderLeads();
  });
  
  $$('#saveStages').addEventListener('click', () => {
    document.body.dataset.editStages = '';
    $$('#addStage').classList.add('hidden');
    $$('#saveStages').classList.add('hidden');
    $$('#editStages').textContent = 'Editar etapas';
    Store.save();
    renderLeads();
    toast('Etapas salvas');
  });
});
