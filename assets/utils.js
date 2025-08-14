// Firebase initialization
// See https://firebase.google.com/docs/web/setup for more info
const firebaseConfig = {
  apiKey: "AIzaSyBHU6yFDCKp9jm9tPGyRqQJFS3amewuuQY",
  authDomain: "crmdaneon.firebaseapp.com",
  projectId: "crmdaneon",
  storageBucket: "crmdaneon.firebasestorage.app",
  messagingSenderId: "564595832938",
  appId: "1:564595832938:web:531ed7df3b6df1d9f3f213",
  measurementId: "G-LQH20DL1WC"
};

// Import Firebase modules dynamically
(async () => {
  const { initializeApp } = await import('https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js');
  const { getAnalytics } = await import('https://www.gstatic.com/firebasejs/12.1.0/firebase-analytics.js');
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
  window.firebaseApp = app;
  window.firebaseAnalytics = analytics;
})();

// Utilitários compartilhados
const $$ = (selector) => document.querySelector(selector);
const $$$ = (selector) => document.querySelectorAll(selector);

// Sistema de armazenamento
const Store = {
    data: {},
    save() {
        localStorage.setItem('neon-crm-data', JSON.stringify(this.data));
    }
};
// Expose Store globally so other scripts (e.g., dashboard.js) can use the same instance
window.Store = Store;

// Sistema de toast
function toast(msg, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = msg;
    toast.style.position = 'fixed';
    toast.style.bottom = '16px';
    toast.style.right = '16px';
    toast.style.padding = '10px 14px';
    toast.style.background = 'var(--card)';
    toast.style.border = '1px solid var(--muted)';
    toast.style.borderRadius = '12px';
    toast.style.zIndex = '100';
    toast.style.color = 'var(--text)';
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    }, 100);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
}

// Configurações do GitHub Sync


// Funções utilitárias
const uid = () => Math.random().toString(36).slice(2, 9);
const todayISO = () => new Date().toISOString();
const fmtBRL = v => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const toDateOnly = (d) => new Date(new Date(d).toDateString());
const inRange = (d, a, b) => {
    const x = toDateOnly(d).getTime();
    return x >= toDateOnly(a).getTime() && x <= toDateOnly(b).getTime();
};

// Sistema de autenticação
function checkAuth() {
    const isLoggedIn = localStorage.getItem('neon-crm-logged-in');
    if (isLoggedIn !== 'true') {
        window.location.href = 'index.html';
    }
}

// Navegação entre páginas
function navigateTo(page) {
    window.location.href = page + '.html';
}

// Logout
function logout() {
    localStorage.removeItem('neon-crm-logged-in');
    localStorage.removeItem('neon-crm-username');
    window.location.href = 'index.html';
}

// Modal
function openModal(title, html) {
    $$('#modalTitle').textContent = title;
    $$('#modalBody').innerHTML = html;
    $$('#modal').style.display = 'flex';
}

function closeModal() {
    $$('#modal').style.display = 'none';
    $$('#modalBody').innerHTML = '';
}

// Função ready – garante que o CRM só será exibido depois que os dados do GitHub estiverem disponíveis
function ready() {
    const local = localStorage.getItem('neon-crm-data');
    if (local) {
        try {
            Store.data = JSON.parse(local);
            console.log('Dados carregados do localStorage');
        } catch (e) {
            console.error('Erro ao carregar dados do localStorage:', e);
            Store.data = {};
        }
    } else {
        Store.data = {};
        console.warn('Nenhum dado local disponível, inicializando Store.data vazio');
    }

    // Ensure required arrays exist
    if (!Array.isArray(Store.data.leads)) {
        Store.data.leads = [];
        console.log('Inicializando array de leads');
    }
    if (!Array.isArray(Store.data.users)) {
        Store.data.users = [];
        console.log('Inicializando array de usuários');
    }

    Store.save();
    window.CRM_READY = true;
    console.log('Página pronta (ready)');
    window.dispatchEvent(new Event('crmReady'));
}
window.ready = ready;

// Inicializar modal e GitHub Sync
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        // Inicia o CRM (carrega dados e marca ready)
        ready();
        // Configurar modal (mantém código existente)
        if ($$('#modalClose')) {
            $$('#modalClose').onclick = closeModal;
        }
        if ($$('#modal')) {
            window.addEventListener('keydown', e => {
                if (e.key === 'Escape') closeModal();
            });
            window.addEventListener('click', e => {
                if (e.target === $$('#modal')) closeModal();
            });
        }
    });
}

// Initialize users array if not present
if (!Store.data.users) {
    Store.data.users = [];
    console.log('Inicializando array de usuários');
}

// Firestore integration for Neon CRM
let firestore;
(async () => {
  const { getFirestore, doc, setDoc, getDoc, updateDoc, collection, addDoc, getDocs, deleteDoc } = await import('https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js');
  firestore = getFirestore(window.firebaseApp);
  window.firestore = firestore;
  window.firestoreApi = { getFirestore, doc, setDoc, getDoc, updateDoc, collection, addDoc, getDocs, deleteDoc };
})();

// Helper functions for leads CRUD
async function saveLeadToFirebase(lead) {
  const { collection, addDoc } = window.firestoreApi;
  await addDoc(collection(firestore, 'leads'), lead);
}

async function updateLeadInFirebase(leadId, data) {
  const { doc, updateDoc } = window.firestoreApi;
  await updateDoc(doc(firestore, 'leads', leadId), data);
}

async function deleteLeadFromFirebase(leadId) {
  const { doc, deleteDoc } = window.firestoreApi;
  await deleteDoc(doc(firestore, 'leads', leadId));
}

async function getAllLeadsFromFirebase() {
  const { collection, getDocs } = window.firestoreApi;
  const querySnapshot = await getDocs(collection(firestore, 'leads'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Replace Store.save to sync with Firebase
Store.save = async function() {
  // Save all leads to Firebase
  if (Array.isArray(this.data.leads)) {
    for (const lead of this.data.leads) {
      if (!lead.id) {
        await saveLeadToFirebase(lead);
      } else {
        await updateLeadInFirebase(lead.id, lead);
      }
    }
  }
  // You can add similar logic for users, tasks, etc.
  localStorage.setItem('neon-crm-data', JSON.stringify(this.data));
};
