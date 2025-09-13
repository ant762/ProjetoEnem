// redacao.js — gera temas e controla timer de redação (local)
const DEFAULT_TIME = 60*60; // 60 minutos
let essayTimer = null;
let essayTimeLeft = DEFAULT_TIME;

// redacao.js — temas ENEM 2015-2023
const prompts = [
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


// Gerar tema
function genTopic(){
  const t = prompts[Math.floor(Math.random()*prompts.length)];
  document.getElementById('tema').textContent = t;
  localStorage.setItem('redacao_topic', t);

  // Preenche rascunho salvo, se houver
  const saved = localStorage.getItem('redacao_draft');
  if(saved) document.getElementById('rascunho').value = saved;
}

// Renderizar timer
function renderEssayTimer(){
  const t = Math.max(0, essayTimeLeft);
  const h = Math.floor(t/3600), m = Math.floor((t%3600)/60), s = t%60;
  document.getElementById('redacaoTimer').textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

// Eventos
document.getElementById('gerarTemaBtn').addEventListener('click', genTopic);

document.getElementById('iniciarRedacaoBtn').addEventListener('click', ()=> {
  if(essayTimer) return alert('Redação em andamento');

  const container = document.getElementById('redacaoContainer');
  container.classList.remove('hidden');

  essayTimeLeft = DEFAULT_TIME;
  renderEssayTimer();
  essayTimer = setInterval(()=> {
    essayTimeLeft--;
    renderEssayTimer();
    if(essayTimeLeft <= 0){
      clearInterval(essayTimer);
      essayTimer = null;
      alert('Tempo de redação encerrado.');
    }
  }, 1000);

  document.getElementById('iniciarRedacaoBtn').disabled = true;
});

document.getElementById('finalizarRedacaoBtn').addEventListener('click', ()=> {
  const txt = document.getElementById('rascunho').value;
  localStorage.setItem('redacao_draft', txt);
  alert('Redação finalizada e salva localmente.');
  clearInterval(essayTimer);
  essayTimer = null;
  document.getElementById('iniciarRedacaoBtn').disabled = false;
});

// Ao carregar a página
window.addEventListener('load', ()=> {
  const savedTopic = localStorage.getItem('redacao_topic');
  if(savedTopic) document.getElementById('tema').textContent = savedTopic;

  const draft = localStorage.getItem('redacao_draft');
  if(draft) document.getElementById('rascunho').value = draft;
});
