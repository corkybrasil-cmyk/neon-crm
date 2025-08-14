# Neon CRM - Sistema Multi-Página

Um sistema de CRM completo para gestão de leads, tarefas e relacionamentos, agora organizado em múltiplas páginas para melhor usabilidade.

## 🚀 Funcionalidades

### Sistema de Autenticação
- **Login simples** com credenciais padrão (admin/admin123)
- **Sessão persistente** usando localStorage
- **Logout** com redirecionamento automático

### Páginas Principais

#### 1. **Home/Login** (`index.html`)
- Interface de login elegante
- Verificação automática de sessão ativa
- Redirecionamento para dashboard após login

#### 2. **Dashboard** (`dashboard.html`)
- **KPIs em tempo real**: Leads que entraram, qualificados, vendas e ticket médio
- **Filtros de data**: Último dia, 7 dias, 30 dias ou período personalizado
- **Tabela por bairro**: Distribuição geográfica dos leads
- **Navegação** para todas as outras páginas

#### 3. **Novo Lead** (`novo-lead.html`)
- **Formulário completo** para cadastro de leads
- **Validação de campos** obrigatórios
- **Integração** com sistema de etapas personalizáveis
- **Feedback visual** com toasts

#### 4. **Funil de Vendas** (`funil-vendas.html`)
- **Visualização Kanban** com drag & drop
- **Visualização em lista** com filtros e ordenação
- **Edição de etapas** em tempo real
- **Modal de detalhes** do lead
- **Busca e filtros** avançados

#### 5. **Tarefas** (`tarefas.html`)
- **Seleção de tipo**: Tarefas do CRM ou Tarefas da Escola
- **Sistema Kanban** para cada tipo de tarefa
- **Vinculação** com leads ou pessoas/empresas
- **Prioridades**: baixa, média, alta, urgente
- **Prazos** e notificações

#### 6. **Pessoas & Empresas** (`pessoas-empresas.html`)
- **Cadastro** de pessoas físicas e jurídicas
- **Filtros** por tipo e finalidade
- **Ordenação** por qualquer coluna
- **Integração** com sistema de tarefas

#### 7. **Dev** (`dev.html`)
- **Personalização de temas** com cores e fontes
- **Configuração de menu** e layout
- **GitHub Sync** para backup automático
- **Sistema de backup** com export/import
- **Configurações avançadas** do sistema

## 🛠️ Tecnologias

- **HTML5** - Estrutura semântica
- **CSS3** - Estilos modernos com variáveis CSS
- **JavaScript ES6+** - Lógica modular e funcional
- **LocalStorage** - Persistência de dados
- **GitHub API** - Sincronização e backup

## 📁 Estrutura de Arquivos

```
neon-crm/
├── index.html              # Página de login
├── dashboard.html          # Dashboard principal
├── novo-lead.html         # Formulário de novo lead
├── funil-vendas.html      # Gestão de leads
├── tarefas.html           # Gestão de tarefas
├── pessoas-empresas.html  # Cadastro de pessoas/empresas
├── dev.html               # Configurações e desenvolvimento
├── assets/
│   ├── styles.css         # Estilos globais
│   ├── login.js           # Lógica de autenticação
│   ├── dashboard.js       # Lógica do dashboard
│   ├── novo-lead.js       # Lógica de novos leads
│   ├── funil-vendas.js    # Lógica do funil de vendas
│   ├── tarefas.js         # Lógica de tarefas
│   ├── pessoas-empresas.js # Lógica de pessoas/empresas
│   └── dev.js             # Lógica de desenvolvimento
├── neon-crm-data.json     # Dados do sistema
└── README.md              # Documentação
```

## 🔧 Configuração

### Credenciais Padrão
- **Usuário**: `admin`
- **Senha**: `admin123`

### Primeiro Acesso
1. Abra `index.html` no navegador
2. Use as credenciais padrão
3. Configure suas preferências na página Dev
4. Comece a cadastrar leads e tarefas

## 📊 Funcionalidades Avançadas

### Sistema de Temas
- **Temas pré-definidos**: Default, Dark, Blue
- **Personalização completa**: Cores, fontes, layout
- **Persistência** das configurações

### GitHub Sync
- **Backup automático** para repositório GitHub
- **Sincronização** de dados entre dispositivos
- **Configuração** via token de acesso

### Sistema de Backup
- **Export/Import** de dados completos
- **Backup manual** com timestamp
- **Restauração** de configurações

## 🎨 Interface

### Design Responsivo
- **Mobile-first** approach
- **Adaptação automática** para diferentes telas
- **Navegação intuitiva** entre páginas

### Componentes Visuais
- **Cards informativos** para KPIs
- **Modais** para ações específicas
- **Toasts** para feedback do usuário
- **Ícones** e elementos visuais consistentes

## 🔒 Segurança

### Autenticação
- **Verificação de sessão** em todas as páginas
- **Redirecionamento automático** para login
- **Logout seguro** com limpeza de dados

### Dados
- **Armazenamento local** seguro
- **Backup criptografado** (quando usando GitHub)
- **Validação** de entrada de dados

## 🚀 Deploy

### GitHub Pages
1. Faça push do código para um repositório GitHub
2. Ative GitHub Pages nas configurações
3. Configure o GitHub Sync no sistema
4. Acesse via URL do GitHub Pages

### Servidor Local
1. Clone o repositório
2. Abra `index.html` em um servidor local
3. Configure conforme necessário

## 📝 Changelog

### v2.0.0 - Multi-Página
- ✅ Migração de single-page para multi-page
- ✅ Sistema de autenticação implementado
- ✅ Navegação entre páginas funcionando
- ✅ Separação de responsabilidades por arquivo
- ✅ Backup movido para página Dev
- ✅ Seleção de tipo de tarefa implementada

### v1.0.0 - Single-Page
- ✅ Sistema básico de CRM
- ✅ Gestão de leads e tarefas
- ✅ Personalização de temas
- ✅ GitHub Sync

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 🆘 Suporte

Para dúvidas ou problemas:
1. Verifique a documentação
2. Consulte as configurações na página Dev
3. Faça backup dos dados antes de alterações
4. Abra uma issue no repositório

---

**Neon CRM** - Transformando a gestão de relacionamentos com clientes! 🚀
