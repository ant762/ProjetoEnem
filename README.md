# ProjetoEnem

Este projeto é uma aplicação web desenvolvida para auxiliar estudantes na preparação para o ENEM. Ele oferece funcionalidades como cadastro de usuários, gerenciamento de questões, simulação de provas e acompanhamento de desempenho.

## Estrutura do Projeto

A estrutura principal do projeto pode ser visualizada [aqui no GitHub](https://github.com/ant762/ProjetoEnem/tree/main/ProjetoEnem):

```
ProjetoEnem/
├── backend/
├── frontend/
├── README.md
└── ...
```

### Backend

O backend está localizado na pasta [`backend`](https://github.com/ant762/ProjetoEnem/tree/main/ProjetoEnem/backend) e utiliza **Node.js** com **Express** para criar uma API RESTful.

**Exemplo de rota de cadastro de usuário:**
```js
// backend/routes/user.js
router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    // Lógica de cadastro
});
```

Principais tecnologias:
- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/) (para persistência de dados)

### Frontend

O frontend está na pasta [`frontend`](https://github.com/ant762/ProjetoEnem/tree/main/ProjetoEnem/frontend) e foi desenvolvido com **React**.

**Componente de login:**
```jsx
// frontend/src/components/Login.js
function Login() {
    const [username, setUsername] = useState('');
    // ...
    return (
        <form>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} />
            {/* ... */}
        </form>
    );
}
```

Principais tecnologias:
- [React](https://react.dev/)
- [Axios](https://axios-http.com/) (para chamadas à API)
- [React Router](https://reactrouter.com/) (para navegação entre páginas)

### Funcionalidades

- **Cadastro e login de usuários:** Permite que estudantes criem contas e acessem o sistema.
- **Gerenciamento de questões:** Adição, edição e remoção de questões do ENEM.
- **Simulação de provas:** Usuários podem realizar simulados e receber feedback imediato.
- **Acompanhamento de desempenho:** Visualização de estatísticas e progresso.

### Exemplos de Código

**Cadastro de questão (backend):**
```js
// backend/routes/question.js
router.post('/add', async (req, res) => {
    const { enunciado, alternativas, resposta } = req.body;
    // Lógica para salvar questão
});
```

**Simulado (frontend):**
```jsx
// frontend/src/pages/Simulado.js
function Simulado() {
    // Lógica para exibir questões e calcular resultado
}
```

## Como executar

Basta utilizar os comandos de node.js para rodar o servidor e executar no live server.

---

Explore o código fonte e contribua!  
[Repositório ProjetoEnem](https://github.com/ant762/ProjetoEnem)