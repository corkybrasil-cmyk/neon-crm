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
async function addLead(leadData) {
  const lead = {
    id: uid(),
    ...leadData,
    createdAt: todayISO(),
    updatedAt: todayISO()
  };
  Store.data.leads.push(lead);
  if (window.saveLeadToFirebase) await window.saveLeadToFirebase(lead);
  Store.save();
  document.getElementById('leadForm').reset();
  toast('Lead adicionado com sucesso!');
  setTimeout(() => {
    window.location.href = 'funil-vendas.html';
  }, 1000);
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
  // Verificar autenticação
  checkAuth();
  
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
