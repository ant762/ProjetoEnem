const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(express.json());

// CORS — permite múltiplas origens (útil no dev)
app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500'],
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

const USERS_FILE = path.join(__dirname, 'users.json');

function loadUsers(){
  if(!fs.existsSync(USERS_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); }
  catch(e){ return []; }
}

function saveUsers(users){
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Criar usuário padrão se não existir
const users = loadUsers();
if (!users.find(u => u.username === 'ant762')) {
  users.push({ username: 'ant762', password: 'admin123', history: [] });
  saveUsers(users);
  console.log('Usuário padrão criado: ant762 / admin123');
}

/* Register */
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if(!username || !password) return res.status(400).json({ error: 'username and password required' });
  const users = loadUsers();
  if(users.find(u => u.username === username)) return res.status(400).json({ error: 'Usuário já existe' });

  const newUser = { username, password, history: [] };
  users.push(newUser);
  saveUsers(users);
  return res.json({ message: 'Usuário criado', user: { username } });
});

/* Login */
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const users = loadUsers();
  const user = users.find(u => u.username === username && u.password === password);
  if(!user) return res.status(401).json({ error: 'Credenciais inválidas' });
  return res.json({ message: 'Logado', user: { username: user.username } });
});

/* Save result */
app.post('/api/saveResult', (req, res) => {
  const { username, result } = req.body;
  if(!username || !result) return res.status(400).json({ error: 'username e result necessários' });
  const users = loadUsers();
  const user = users.find(u => u.username === username);
  if(!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  user.history = user.history || [];
  user.history.push(result);
  saveUsers(users);
  return res.json({ message: 'Resultado salvo' });
});

/* Get history */
app.get('/api/history/:username', (req, res) => {
  const users = loadUsers();
  const user = users.find(u => u.username === req.params.username);
  if(!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  return res.json({ history: user.history || [] });
});

/* Health check */
app.get('/api/ping', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend rodando em http://localhost:${PORT}`));
