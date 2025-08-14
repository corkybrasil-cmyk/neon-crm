// Utility functions for user management (admin only)

// Check if current logged‑in user is admin
function isAdmin() {
  const username = localStorage.getItem('neon-crm-username');
  // For simplicity, admin is the default admin user; you can extend this later.
  return username === 'admin';
}

function renderUsers() {
  const tbody = document.getElementById('usersTable');
  tbody.innerHTML = '';
  const users = Store.data.users || [];
  users.forEach((u, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${u.username}</td>
      <td>${u.password}</td>
      <td>${u.role || 'user'}</td>
      <td>
        <button class="ghost" onclick="editUser(${idx})">Editar</button>
        <button class="ghost" onclick="deleteUser(${idx})">Excluir</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

function addUser() {
  const username = prompt('Nome de usuário');
  if (!username) return;
  const password = prompt('Senha');
  if (!password) return;
  const role = prompt('Permissão (admin/user)', 'user');
  Store.data.users.push({ username, password, role });
  Store.save();
  renderUsers();
}

function editUser(index) {
  const user = Store.data.users[index];
  const newUsername = prompt('Novo nome de usuário', user.username);
  if (newUsername) user.username = newUsername;
  const newPassword = prompt('Nova senha', user.password);
  if (newPassword) user.password = newPassword;
  const newRole = prompt('Permissão (admin/user)', user.role);
  if (newRole) user.role = newRole;
  Store.save();
  renderUsers();
}

function deleteUser(index) {
  if (confirm('Excluir usuário?')) {
    Store.data.users.splice(index, 1);
    Store.save();
    renderUsers();
  }
}

// Initialize page
if (!isAdmin()) {
  alert('Acesso restrito a administradores');
  window.location.href = 'index.html';
} else {
  document.addEventListener('DOMContentLoaded', () => {
    renderUsers();
    document.getElementById('addUserBtn').addEventListener('click', addUser);
  });
}
