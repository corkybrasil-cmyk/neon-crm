# Copilot Instructions for Neon CRM

## Overview
Neon CRM is a **multi‑page client‑side CRM** built with plain HTML, CSS, and vanilla JavaScript. All data is stored in `localStorage` and optionally synchronized with a GitHub repository via the **GitHub Sync** feature.

### Core Architecture
- **Pages**: `index.html` (login), `dashboard.html`, `novo-lead.html`, `funil-vendas.html`, `tarefas.html`, `pessoas-empresas.html`, `dev.html`, **new `usuarios.html`**.
- **Shared utilities** (`assets/utils.js`):
  - `Store` – central in‑memory data store that mirrors `localStorage` (`Store.data`).
  - `GitHubSync` – handles token storage, fetching and saving `neon-crm-data.json` and `neon-crm-token.json` via the GitHub REST API.
  - **Auto‑sync**: `GitHubSync.setupAutoSync()` runs on every page load; data is fetched from GitHub on first load and stored in `Store.data`.
- **Data model** (`neon-crm-data.json`):
  ```json
  {
    "stages": [...],
    "leads": [...],
    "tasks": {"leads": {...}, "escola": {...}},
    "entities": [],
    "theme": {},
    "users": []   // added for user management
  }
  ```
- **Authentication** (`assets/login.js`): simple username/password stored in `localStorage` (`admin/admin123`).

## Critical Workflows
### Development
1. **Open the app** – open `index.html` in a browser (no server required). All pages are linked via `navigateTo('page')`.
2. **GitHub Sync** –
   - Token is set on **Dev** page (`newToken` input). The token is saved to the repo (`neon-crm-token.json`).
   - `GitHubSync.saveNow()` is called automatically on data changes (debounced).  
   - **Force sync** button (`#forceSync`) triggers `GitHubSync.saveNow()` manually.
3. **Data loading** – `utils.js` loads data from GitHub on page load. After the first successful fetch the page reloads once to ensure all scripts see the data.
4. **User Management** – new `usuarios.html` and `assets/usuarios.js` provide admin‑only CRUD for users stored in `Store.data.users`.
   - Access restricted to the default admin user (`admin`).
   - Functions: `renderUsers`, `addUser`, `editUser`, `deleteUser`.

## Project‑Specific Conventions
- **Store initialization** – each script checks for missing arrays (`if (!Store.data.leads) { Store.data.leads = []; }`).
- **Data persistence** – always call `Store.save()` after mutating `Store.data` to persist to `localStorage` and trigger GitHub auto‑sync.
- **Token handling** – `GitHubSync.saveTokenToGitHub` now fetches the existing file SHA to avoid `409 Conflict`.
- **Page navigation** – uses `navigateTo('page')` which changes `window.location.href` to `<page>.html`.
- **Theme & layout** – CSS variables in `assets/styles.css` control colors, fonts, and dark mode.

## Common Commands (PowerShell)
```powershell
# Open the app (any browser)
Start-Process "index.html"

# Force a sync from Dev page (or run manually)
node -e "require('./assets/utils.js').GitHubSync.saveNow()"
```

## Extending the Project
- **Add new pages**: create `<page>.html` and a corresponding `<page>.js` in `assets/`. Register the navigation button in the `<nav>` of each page.
- **Add new data types**: extend `Store.data` with a new property, initialize it in `utils.js`, and persist via `Store.save()`.
- **Permissions**: extend `isAdmin()` in `assets/usuarios.js` to check `Store.data.users` for roles.

---
*Generated for AI coding agents to quickly understand and extend the Neon CRM codebase.*
