// Sistema de login simples
const LoginSystem = {
  // Credenciais padrão (em produção, isso deveria estar em um servidor)
  defaultCredentials: {
    username: 'admin',
    password: 'admin123'
  },
  
  // Verificar se já está logado
  checkAuth() {
    const isLoggedIn = localStorage.getItem('neon-crm-logged-in');
    if (isLoggedIn === 'true') {
      window.location.href = 'dashboard.html';
    }
  },
  
  // Fazer login
  login(username, password) {
    if (username === this.defaultCredentials.username && 
        password === this.defaultCredentials.password) {
      localStorage.setItem('neon-crm-logged-in', 'true');
      localStorage.setItem('neon-crm-username', username);
      window.location.href = 'dashboard.html';
      return true;
    }
    return false;
  },
  
  // Fazer logout
  logout() {
    localStorage.removeItem('neon-crm-logged-in');
    localStorage.removeItem('neon-crm-username');
    window.location.href = 'index.html';
  }
};

// Verificar autenticação ao carregar a página
LoginSystem.checkAuth();

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');
  
  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (LoginSystem.login(username, password)) {
      // Login bem-sucedido - redirecionamento acontece automaticamente
    } else {
      alert('Usuário ou senha incorretos!\n\nCredenciais padrão:\nUsuário: admin\nSenha: admin123');
    }
  });
});

// Função para mostrar toast (reutilizada do app original)
function toast(msg) {
  const t = document.createElement('div');
  t.textContent = msg;
  t.style.position = 'fixed';
  t.style.bottom = '16px';
  t.style.right = '16px';
  t.style.padding = '10px 14px';
  t.style.background = 'var(--card)';
  t.style.border = '1px solid var(--muted)';
  t.style.borderRadius = '12px';
  t.style.zIndex = '100';
  t.style.color = 'var(--text)';
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}
