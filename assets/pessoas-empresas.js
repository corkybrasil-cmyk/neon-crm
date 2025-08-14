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

// Função para renderizar entidades
function renderEntities() {
  const tbody = $$('#entList');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  const type = $$('#entFilterType').value;
  const f = $$('#entFilterFinalidade').value.toLowerCase();
  
  const data = Store.data.entities
    .filter(e => type === 'todos' || e.tipo === type)
    .filter(e => !f || (e.finalidade || '').toLowerCase().includes(f))
    .sort((a, b) => {
      const va = (a.nome || '').toString().toLowerCase();
      const vb = (b.nome || '').toString().toLowerCase();
      return va.localeCompare(vb);
    });
  
  data.forEach(e => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${e.tipo}</td>
      <td>${e.nome}</td>
      <td>${e.telefone || '-'}</td>
      <td>${e.finalidade || '-'}</td>
      <td>${e.contatoEmpresa || '-'}</td>
    `;
    tr.addEventListener('click', () => openEntityModal(e));
    tbody.appendChild(tr);
  });
}

// Função para abrir modal de entidade
function openEntityModal(ent) {
  openModal(ent ? 'Editar cadastro' : 'Novo cadastro', `
    <div class="row">
      <div>
        <label>Tipo</label>
        <select id="entTipo">
          <option value="pessoa" ${ent?.tipo === "pessoa" ? "selected" : ""}>Pessoa física</option>
          <option value="empresa" ${ent?.tipo === "empresa" ? "selected" : ""}>Pessoa jurídica</option>
        </select>
      </div>
    </div>
    <div class="row" id="entFields"></div>
    <div class="row"><div class="right"><button id="entSalvar" class="primary">Salvar</button></div></div>
  `);
  
  function renderFields() {
    const tipo = $$('#entTipo').value;
    const box = $$('#entFields');
    if (tipo === "pessoa") {
      box.innerHTML = `
        <div><label>Nome</label><input id="entNome" value="${ent?.nome || ""}"/></div>
        <div><label>Telefone</label><input id="entTel" value="${ent?.telefone || ""}"/></div>
        <div><label>Finalidade do contato</label><input id="entFinalidade" value="${ent?.finalidade || ""}" placeholder="Ex: fornecedor, parceria, influenciador"/></div>
      `;
    } else {
      box.innerHTML = `
        <div><label>Nome da empresa</label><input id="entNome" value="${ent?.nome || ""}"/></div>
        <div><label>Telefone</label><input id="entTel" value="${ent?.telefone || ""}"/></div>
        <div><label>Nome do contato dentro da empresa</label><input id="entContatoEmpresa" value="${ent?.contatoEmpresa || ""}"/></div>
        <div><label>Finalidade</label><input id="entFinalidade" value="${ent?.finalidade || ""}" placeholder="Ex: convênio, fornecedor"/></div>
      `;
    }
  }
  
  $$('#entTipo').addEventListener('change', renderFields);
  renderFields();
  
  $$('#entSalvar').onclick = () => {
    const tipo = $$('#entTipo').value;
    const nome = $$('#entNome').value.trim();
    const telefone = $$('#entTel').value.trim();
    const finalidade = $$('#entFinalidade').value.trim();
    let contatoEmpresa = "";
    if (tipo === "empresa") contatoEmpresa = $$('#entContatoEmpresa').value.trim();
    
    if (!nome) {
      toast('Preencha o nome');
      return;
    }
    
    if (ent) {
      ent.tipo = tipo;
      ent.nome = nome;
      ent.telefone = telefone;
      ent.finalidade = finalidade;
      ent.contatoEmpresa = contatoEmpresa;
    } else {
      Store.data.entities.push({
        id: uid(),
        tipo,
        nome,
        telefone,
        finalidade,
        contatoEmpresa
      });
    }
    
    Store.save();
    closeModal();
    renderEntities();
  };
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
  // Verificar autenticação
  checkAuth();
  
  // Renderizar entidades
  renderEntities();
  
  // Event listeners
  const entFilterType = $$('#entFilterType');
  if (entFilterType) {
    entFilterType.addEventListener('change', renderEntities);
  }
  
  const entFilterFinalidade = $$('#entFilterFinalidade');
  if (entFilterFinalidade) {
    entFilterFinalidade.addEventListener('input', renderEntities);
  }
  
  const btnNewEnt = $$('#btnNewEnt');
  if (btnNewEnt) {
    btnNewEnt.addEventListener('click', () => openEntityModal());
  }
});
