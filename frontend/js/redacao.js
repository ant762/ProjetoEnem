// redacao.js — gera temas e controla timer de redação (local)
const TEMPO_PADRAO = 60 * 60; // 60 minutos
let timerRedacao = null;
let tempoRestanteRedacao = TEMPO_PADRAO;

// redacao.js — temas ENEM 2015-2023, preciso fazer com que só pegue direto da api mesmo.
const temas = [
  'Desafios para a promoção da saúde mental entre adolescentes no Brasil',
  'Desafios para o enfrentamento da invisibilidade do trabalho de cuidado realizado pela mulher no Brasil',
  'Os desafios para a valorização das comunidades e povos tradicionais do Brasil',
  'Medidas para o enfrentamento da recorrência da insegurança alimentar no Brasil',
  'A falta de empatia nas relações sociais no Brasil',
  'O estigma associado às doenças mentais na sociedade brasileira',
  'O desafio de reduzir as desigualdades entre as regiões do Brasil',
  'Democratização do acesso ao cinema no Brasil',
  'Manipulação do comportamento do usuário pelo controle de dados na internet',
  'Desafios para a formação educacional de surdos no Brasil',
  'Caminhos para combater a intolerância religiosa no Brasil',
  'Caminhos para combater o racismo no Brasil',
  'A persistência da violência contra a mulher na sociedade brasileira'
];

// geração de tema. funciona pegando um tema aleatorio do array de temas e mostra na tela. salva o tema no localStorage pra caso a pagina seja recarregada
function pegarTopico() {
  const topico = temas[Math.floor(Math.random() * temas.length)];
  document.getElementById('tema').textContent = topico;
  localStorage.setItem('redacao_topico', topico);

  // Preenche rascunho salvo, se houver
  const rascunhoSalvo = localStorage.getItem('redacao_rascunho');
  if (rascunhoSalvo) document.getElementById('rascunho').value = rascunhoSalvo;
}

// timer bacana. ele mostra o tempo restante no formato hh:mm:ss e decrementa a cada segundo. quando chega a zero, para o timer e avisa que o tempo acabou
function renderizarTimerRedacao() {
  const tempo = Math.max(0, tempoRestanteRedacao);
  const h = Math.floor(tempo / 3600), m = Math.floor((tempo % 3600) / 60), s = tempo % 60;
  document.getElementById('redacaoTimer').textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// esses são os eventos. servem para ligar os botoes da pagina com as funcoes acima
document.getElementById('gerarTemaBtn').addEventListener('click', pegarTopico);

document.getElementById('iniciarRedacaoBtn').addEventListener('click', () => {
  if (timerRedacao) return alert('Redação em andamento');

  const containerRedacao = document.getElementById('redacaoContainer');
  containerRedacao.classList.remove('hidden');

  tempoRestanteRedacao = TEMPO_PADRAO;
  renderizarTimerRedacao();
  timerRedacao = setInterval(() => {
    tempoRestanteRedacao--;
    renderizarTimerRedacao();
    if (tempoRestanteRedacao <= 0) {
      clearInterval(timerRedacao);
      timerRedacao = null;
      alert('Tempo de redação encerrado.');
    }
  }, 1000);

  document.getElementById('iniciarRedacaoBtn').disabled = true;
});

document.getElementById('finalizarRedacaoBtn').addEventListener('click', () => {
  const texto = document.getElementById('rascunho').value;
  localStorage.setItem('redacao_rascunho', texto);
  alert('Redação finalizada e salva localmente.');
  clearInterval(timerRedacao);
  timerRedacao = null;
  document.getElementById('iniciarRedacaoBtn').disabled = false;
});

// aaaaaaaaaaaaaaaa quando a pagina carrega, pega o topico salvo e o rascunho salvo (se houver) e mostra na tela (amostradinho)
window.addEventListener('load', () => {
  const topicoSalvo = localStorage.getItem('redacao_topico');
  if (topicoSalvo) document.getElementById('tema').textContent = topicoSalvo;

  const rascunho = localStorage.getItem('redacao_rascunho');
  if (rascunho) document.getElementById('rascunho').value = rascunho;
});
