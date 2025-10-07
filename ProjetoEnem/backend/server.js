const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();

app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' })); // já corrige o erro 413 também!

const ARQUIVOS_USUARIO = path.join(__dirname, 'users.json');  

// cria arquivo vazio se nao existir
if(!fs.existsSync(ARQUIVOS_USUARIO)) fs.writeFileSync(ARQUIVOS_USUARIO, JSON.stringify([]));

// olha, isso aqui serve pra carregar e salvar os usuarios no arquivo users.json
function loadUsers(){
  try { return JSON.parse(fs.readFileSync(ARQUIVOS_USUARIO, 'utf8')); }
  catch(e){ return []; }
}

function saveUsers(users){
  fs.writeFileSync(ARQUIVOS_USUARIO, JSON.stringify(users, null, 2));
}

// usuario padrao, ant762.
const users = loadUsers();
if (!users.find(u => u.username === 'ant762')) {
  users.push({ username: 'ant762', password: 'admin123', history: [] });
  saveUsers(users);
  console.log('Usuário padrão criado: ant762 / admin123');
}

// registro, n fiz ainda - 15/09
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

// login do usuario
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const users = loadUsers();
  const user = users.find(u => u.username === username && u.password === password);
  if(!user) return res.status(401).json({ error: 'Credenciais inválidas' });
  return res.json({ message: 'Logado', user: { username: user.username } });
});

// funcao de post pra postar o troco do usuario la no backend (aaaaaaaaaaaaa)
app.post('/api/saveResult', (req, res) => {
  const { username, result } = req.body;
  if(!username || !result) return res.status(400).json({ error: 'username e result necessários' });

  const users = loadUsers();
  const user = users.find(u => u.username === username);
  if(!user) return res.status(404).json({ error: 'Usuário não encontrado' });

  // isso serve pra adicionar o resultado no historico do usuario quando ele faz alguma prova
  user.history = user.history || [];
  user.history.push({
    date: result.date || new Date().toISOString(),
    year: result.year || new Date().getFullYear(),
    discipline: result.discipline || '',
    score: result.score || 0,
    correct: result.correct || 0,
    wrong: result.wrong || 0,
    blank: result.blank || 0,
    total: result.total || 0,
    details: Array.isArray(result.details) ? result.details : []
  });

  saveUsers(users);
  return res.json({ message: 'Resultado salvo' });
});

// pega o historico do usuario la 
app.get('/api/history/:username', (req, res) => {
  const users = loadUsers();
  const user = users.find(u => u.username === req.params.username);
  if(!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  return res.json(user.history || []);
});

// se ta rodando, console log.
app.get('/api/ping', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend rodando em http://localhost:${PORT}`));
