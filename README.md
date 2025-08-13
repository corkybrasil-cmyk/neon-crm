# Neon CRM (Single Page App)

Aplicativo CRM em uma página (HTML + CSS + JS) pensado para funcionar no navegador, com persistência local e opção de sincronizar dados com um repositório no GitHub.

## Publicação no GitHub Pages

1. Faça um fork ou crie um repositório novo e suba estes arquivos.
2. Garanta que o arquivo principal se chama `index.html` na raiz do repositório.
3. Vá em Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` (ou a de sua preferência) e `/root`.
4. Aguarde a publicação. A página ficará disponível na URL do GitHub Pages do seu repositório.

## Estrutura

- `index.html`: Shell da aplicação (marcações HTML e layout).
- `assets/styles.css`: Estilos e variáveis CSS.
- `assets/app.js`: Lógica do CRM (estado, UI e integrações).

## Persistência de dados

O app salva os dados no `localStorage` por padrão:
- Leads, tarefas, pessoas/empresas, etapas e tema.
- Você pode exportar/importar um arquivo `.json` em Dev → Salvar & Backup.

## Sincronização com GitHub (GitHub Sync)

Na aba Dev existe um bloco “GitHub Sync” que permite salvar/carregar o estado em um arquivo JSON dentro de um repositório seu:

- Campos:
  - Owner (dono), Repo (nome do repositório), Branch (ex.: `main`), Caminho do arquivo (ex.: `neon-crm-data.json`), Token (PAT), Auto salvar.
- Botões:
  - Conectar/Carregar do GitHub: baixa o JSON do repositório e carrega no app.
  - Salvar agora no GitHub: envia o estado atual como commit (API de conteúdos).
  - Desconectar: limpa as credenciais salvas localmente.
- Auto salvar:
  - Quando ligado, toda chamada de `Store.save()` também envia os dados para o GitHub (com debounce).

### Permissões do Token (PAT)

- Gere um Personal Access Token com permissão de conteúdo para repositórios (Classic: `repo`).
- O token é guardado no seu navegador (localStorage). Não compartilhe sua URL com o token preenchido no formulário.

### Formato do arquivo JSON

```
{
  "stages": ["novo lead", "qualificado", "proposta", "venda", "perdido"],
  "leads": [ ... ],
  "tasks": { "leads": {"stages": [...], "items": [...]}, "escola": {"stages": [...], "items": [...] } },
  "entities": [ ... ],
  "theme": { ... }
}
```

## Desenvolvimento

- Tudo funciona client-side. Não há backend.
- Para personalizações visuais:
  - Use as variáveis CSS em `:root` (cores, raios, etc.).
- Para novas abas/funcionalidades:
  - Use os geradores de prompt na aba Dev como referência para manter o padrão visual.

## Limitações

- Sem autenticação nativa. O controle de acesso depende do repositório GitHub.
- Se o repositório for público, o JSON também será público (exceto se você usar repositório privado).

## Licença

Defina a licença de sua preferência no repositório (ex.: MIT).
