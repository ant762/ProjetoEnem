// auth.js - controla login e registro na pagina index.html
const URL_API = 'http://localhost:3000/api'; // se o backend estiver rodando em outra porta é so mudar

const formularioDeLogin = document.getElementById('loginForm')
const botaoDeRegistro = document.getElementById('registerBtn')
const areaDeMensagem = document.getElementById('message')

// funcao pra mostrar a mensagem na tela
function mostrarMensagem(texto, erro=false){
  areaDeMensagem.textContent = texto // atualiza o texto da area de mensagem
  areaDeMensagem.style.color = erro ? '#fca5a5' : '' // se for erro fica vermelhinho senao e o padrao
}

// login
formularioDeLogin.addEventListener('submit', async (evento) => {
  evento.preventDefault(); // não deixa o formulário enviar de forma normal e recarregar a página
  const nomeDeUsuario = document.getElementById('username').value.trim().toLowerCase(); // converte para minúsculo
  const senha = document.getElementById('password').value; // pega o valor do campo password

  if (!nomeDeUsuario || !senha) return mostrarMensagem('preencha usuario e senha', true); // se não preencher, avisa que precisa de usuário e senha

  try {
    // faz a requisição post pro backend para tentar fazer login
    const resposta = await fetch(URL_API + '/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }, // estamos mandando json
      body: JSON.stringify({ username: nomeDeUsuario, password: senha }) // envia o json com usuário e senha corretamente
    });

    const respostaJSON = await resposta.json(); // pega a resposta do backend em formato json
    if (!resposta.ok) return mostrarMensagem(respostaJSON.error || 'erro ao logar', true); // se der erro no login, mostra a mensagem de erro

    // se tudo deu certo, salva os dados do usuário localmente
    localStorage.setItem('simulado_usuario', JSON.stringify(respostaJSON.usuario)); // salva no localStorage
    mostrarMensagem('login bem sucedido, redirecionando...'); // mostra que deu certo
    setTimeout(() => window.location.href = 'dashboard.html', 700); // depois de um tempo, redireciona o usuário para o dashboard
  } catch (erro) {
    console.error(erro); // se deu algum erro no código, mostra no console
    mostrarMensagem('erro de conexão com o backend', true); // mostra que houve erro de conexão com o backend
  }
});

// registro rapido. nao precisa de confirmacao de senha ou email por enquanto
botaoDeRegistro.addEventListener('click', async () => {
  const nomeDeUsuario = document.getElementById('username').value.trim().toLowerCase(); // pega o valor do campo username. trim tira os espacos + toLowerCase deixa minusculo pra evitar usuarios iguais com maiusculas e minusculas
  const senha = document.getElementById('password').value // pega o valor do campo password. n precisa de trim aqui pq senha pode ter espaco
  
  if(!nomeDeUsuario || !senha) return mostrarMensagem('preencha usuario e senha para registrar', true) // se nao preencher avisa que precisa preencher os campos. n precisa de mais validacao por enquanto

  try {
    // faz a requisicao post pro backend pra criar a conta. 
    const resposta = await fetch(URL_API + '/register', {
      method: 'POST',
      headers: {'Content-Type':'application/json'}, // dizemos que estamos mandando um json
      body: JSON.stringify({ username: nomeDeUsuario, password: senha }) // envia os dados como json. o backend vai cuidar de validar se ja existe ou se ta tudo ok
    })
    
    const respostaJSON = await resposta.json() // pega a resposta do backend em formato json
    if(!resposta.ok) return mostrarMensagem(respostaJSON.error || 'erro no registro', true) // se der erro no registro, mostra a mensagem de erro
    mostrarMensagem('conta criada faça login') // conta criada, agora é so fazer o login
  } catch(erro) {
    console.error(erro) // se deu algum erro no código, mostra no console
    mostrarMensagem('erro de conexao com backend', true) // se não conseguir conectar com o backend, avisa
  }
})
