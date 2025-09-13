// auth.js — controla login/registro da página index.html
const API = 'http://localhost:3000/api'; // ajuste se backend rodar em outra porta

const loginForm = document.getElementById('loginForm');
const registerBtn = document.getElementById('registerBtn');
const message = document.getElementById('message');

function showMessage(txt, err=false){
  message.textContent = txt;
  message.style.color = err ? '#fca5a5' : '';
}

// Login
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  if(!username || !password) return showMessage('Preencha usuário e senha', true);

  try {
    const res = await fetch(API + '/login', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ username, password })
    });
    const j = await res.json();
    if(!res.ok) return showMessage(j.error || 'Erro ao logar', true);

    // salvar sessão local (simples)
    localStorage.setItem('simulado_user', JSON.stringify(j.user));
    showMessage('Login bem sucedido! redirecionando...');
    setTimeout(() => window.location.href = 'dashboard.html', 700);
  } catch(err) {
    console.error(err);
    showMessage('Erro de conexão com backend', true);
  }
});

// Registro rápido
registerBtn.addEventListener('click', async () => {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  if(!username || !password) return showMessage('Preencha usuário e senha para registrar', true);

  try {
    const res = await fetch(API + '/register', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ username, password })
    });
    const j = await res.json();
    if(!res.ok) return showMessage(j.error || 'Erro no registro', true);
    showMessage('Conta criada. Faça login.');
  } catch(err) {
    console.error(err);
    showMessage('Erro de conexão com backend', true);
  }
});
