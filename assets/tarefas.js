// Variável global para o tipo de tarefa selecionado
let currentTaskType = 'leads';

// Função para selecionar o tipo de tarefa
function selectTaskType(type) {
  currentTaskType = type;
  
  // Esconder a tela de seleção
  $$('#taskSelection').classList.add('hidden');
  
  // Mostrar a interface de tarefas
  $$('#taskInterface').classList.remove('hidden');
  
  // Renderizar as tarefas
  renderTasks();
}

// Função para voltar à seleção
function backToSelection() {
  $$('#taskSelection').classList.remove('hidden');
  $$('#taskInterface').classList.add('hidden');
}

// Função para renderizar tarefas
function renderTasks() {
  const area = $$('#taskKanban');
  if (!area) return;
  
  area.innerHTML = '';
  const cfg = Store.data.tasks[currentTaskType];
  
  // Criar colunas do Kanban
  cfg.stages.forEach(stage => {
    const col = document.createElement('div');
    col.className = 'column';
    col.dataset.stage = stage;
    
    const head = document.createElement('header');
    const h4 = document.createElement('h4');
    h4.textContent = stage;
    h4.contentEditable = !!document.body.dataset.editTaskStages;
    
    h4.addEventListener('input', () => {
      const i = cfg.stages.indexOf(stage);
      if (i > -1) cfg.stages[i] = h4.textContent.trim() || stage;
    });
    
    const tools = document.createElement('div');
    if (document.body.dataset.editTaskStages) {
      if (stage !== 'para fazer' && stage !== 'fazendo') {
        const del = document.createElement('button');
        del.textContent = '-';
        del.className = 'ghost';
        del.onclick = () => {
          if (!confirm('Remover etapa? Itens irão para etapa anterior.')) return;
          const idx = cfg.stages.indexOf(stage);
          const prev = cfg.stages[idx - 1] || cfg.stages[0];
          cfg.items.forEach(t => {
            if (t.etapa === stage) t.etapa = prev;
          });
          cfg.stages.splice(idx, 1);
          Store.save();
          renderTasks();
        };
        tools.appendChild(del);
      }
      const add = document.createElement('button');
      add.textContent = '+';
      add.className = 'ghost';
      add.onclick = () => {
        const name = prompt('Nome da etapa');
        if (!name) return;
        cfg.stages.push(name);
        Store.save();
        renderTasks();
      };
      tools.appendChild(add);
    }
    
    head.append(h4, tools);
    col.appendChild(head);
    
    col.addEventListener('dragover', e => e.preventDefault());
    col.addEventListener('drop', e => {
      const id = e.dataTransfer.getData('text/plain');
      const item = cfg.items.find(t => t.id === id);
      if (item) {
        item.etapa = stage;
        Store.save();
        renderTasks();
      }
    });
    
    area.appendChild(col);
  });
  
  // Criar cards das tarefas
  cfg.items.forEach(t => {
    const col = area.querySelector(`.column[data-stage="${CSS.escape(t.etapa)}"]`) || area.querySelector('.column');
    if (!col) return;
    
    const d = document.createElement('div');
    d.className = 'draggable';
    d.draggable = true;
    d.id = t.id;
    
    d.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', t.id));
    
    const pr = t.prioridade || 'baixa';
    const tag = `<span class='pill prio-${pr}'>${pr}</span>`;
    const link = (currentTaskType === 'leads' ? 
      (Store.data.leads.find(l => l.id === t.leadId)?.crianca || '-') : 
      (Store.data.entities.find(e => e.id === t.entityId)?.nome || '-'));
    
    d.innerHTML = `
      <div class='flex-between'><strong>${t.descricao}</strong> ${tag}</div>
      <div class='tiny'>Vínculo: ${link}</div>
      <div class='tiny'>Prazo: ${new Date(t.prazo).toLocaleDateString()}</div>
      <div class='row' style='margin-top:6px'>
        <button class='ghost' data-act='edit'>Editar</button>
        <button class='danger' data-act='del'>Excluir</button>
      </div>`;
    
    d.querySelector('[data-act="edit"]').onclick = () => openTaskModal(currentTaskType, t);
    d.querySelector('[data-act="del"]').onclick = () => {
      if (confirm('Excluir tarefa?')) {
        cfg.items = cfg.items.filter(x => x.id !== t.id);
        Store.save();
        renderTasks();
      }
    };
    
    col.appendChild(d);
  });
  
  // Aplicar drag and drop para reordenar etapas se estiver editando
  if (document.body.dataset.editTaskStages) {
    makeStagesDraggable();
  }
}

// Função para personalizar etapas
function customizeTaskStages(type) {
  document.body.dataset.editTaskStages = document.body.dataset.editTaskStages ? '' : '1';
  renderTasks();
  if (!document.body.dataset.editTaskStages) {
    Store.save();
    toast('Etapas atualizadas');
  }
}

// Função para reordenar etapas via drag and drop
function makeStagesDraggable() {
  const columns = document.querySelectorAll('.column');
  columns.forEach((col, index) => {
    col.draggable = true;
    col.dataset.index = index;
    
    col.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', index);
    });
    
    col.addEventListener('dragover', (e) => {
      e.preventDefault();
    });
    
    col.addEventListener('drop', (e) => {
      e.preventDefault();
      const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
      const toIndex = parseInt(col.dataset.index);
      
      if (fromIndex !== toIndex) {
        const cfg = Store.data.tasks[currentTaskType];
        const [movedStage] = cfg.stages.splice(fromIndex, 1);
        cfg.stages.splice(toIndex, 0, movedStage);
        Store.save();
        renderTasks();
        makeStagesDraggable(); // Reaplicar drag and drop
      }
    });
  });
}

// Função para criar nova tarefa
function newTask(type) {
  openTaskModal(type, null);
}

// Função para abrir modal de tarefa
function openTaskModal(type, t) {
  const cfg = Store.data.tasks[type];
  const isLead = type === 'leads';
  const stagesOpt = cfg.stages.map(s => `<option ${t && t.etapa === s ? 'selected' : ''}>${s}</option>`).join('');
  const linkOpt = isLead
    ? Store.data.leads.map(l => `<option value='${l.id}' ${t && t.leadId === l.id ? 'selected' : ''}>${l.crianca} — ${l.responsavel}</option>`).join('')
    : Store.data.entities.map(e => `<option value='${e.id}' ${t && t.entityId === e.id ? 'selected' : ''}>${e.tipo.toUpperCase()}: ${e.nome}</option>`).join('');
  
  openModal((t ? 'Editar' : 'Nova') + ` tarefa`, `
    <div class='row'>
      <div>
        <label>${isLead ? 'Lead vinculado' : 'Pessoa/Empresa vinculada'}</label>
        <select id='tLink'><option value=''>Selecionar…</option>${linkOpt}</select>
      </div>
      <div><label>Descrição</label><input id='tDesc' value='${t?.descricao || ''}'/></div>
    </div>
    <div class='row'>
      <div><label>Prazo *</label><input id='tPrazo' type='date' value='${t ? new Date(t.prazo).toISOString().slice(0, 10) : ''}' required/></div>
      <div>
        <label>Prioridade</label>
        <select id='tPrio'>${['baixa', 'média', 'alta', 'urgente'].map(p => `<option ${t && t.prioridade === p ? 'selected' : ''}>${p}</option>`).join('')}</select>
      </div>
      <div>
        <label>Etapa</label>
        <select id='tEtapa'>${stagesOpt}</select>
      </div>
    </div>
    <div class='row'><div class='right'><button id='tSave' class='primary'>Salvar</button></div></div>
  `);
  
  $$('#tSave').onclick = () => {
    const item = t || { id: uid(), tipo: type };
    if (isLead) item.leadId = $$('#tLink').value;
    else item.entityId = $$('#tLink').value;
    item.descricao = $$('#tDesc').value.trim();
    item.prazo = new Date($$('#tPrazo').value || Date.now()).toISOString();
    item.prioridade = $$('#tPrio').value;
    item.etapa = $$('#tEtapa').value || cfg.stages[0];
    
    if (!item.descricao) {
      toast('Descrição obrigatória');
      return;
    }
    
    if (!$$('#tPrazo').value) {
      toast('Prazo é obrigatório');
      return;
    }
    
    if (t) {
      Object.assign(t, item);
    } else {
      cfg.items.push(item);
    }
    
    Store.save();
    closeModal();
    renderTasks();
  };
}

// Função de inicialização da página Tarefas – aguarda o CRM estar pronto
function initTarefas() {
    // Garantir que os dados padrão existam (após ready)
    if (!Store.data.stages) {
        Store.data.stages = ["novo lead","qualificado","proposta","venda","perdido"];
    }
    if (!Store.data.leads) {
        Store.data.leads = [];
    }
    if (!Store.data.tasks) {
        Store.data.tasks = {
            leads: { stages: ["para fazer","fazendo"], items: [] },
            escola: { stages: ["para fazer","fazendo"], items: [] }
        };
    }
    if (!Store.data.entities) {
        Store.data.entities = [];
    }
    if (!Store.data.theme) {
        Store.data.theme = {};
    }

    // Event listeners (mesmo código do DOMContentLoaded original)
    const btnBackToSelection = $$('#btnBackToSelection');
    if (btnBackToSelection) {
        btnBackToSelection.addEventListener('click', backToSelection);
    }
    const btnTaskNew = $$('#btnTaskNew');
    if (btnTaskNew) {
        btnTaskNew.addEventListener('click', () => newTask(currentTaskType));
    }
    const btnTaskStages = $$('#btnTaskStages');
    if (btnTaskStages) {
        btnTaskStages.addEventListener('click', () => customizeTaskStages(currentTaskType));
    }
}

if (window.CRM_READY) {
    console.log('CRM já pronto – inicializando Tarefas');
    initTarefas();
} else {
    console.log('Aguardando CRM_READY para Tarefas');
    window.addEventListener('crmReady', () => {
        console.log('Evento crmReady recebido – iniciando Tarefas');
        initTarefas();
    });
}
