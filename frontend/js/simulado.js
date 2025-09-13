const API_ENEM = 'https://api.enem.dev/v1';
const TOTAL_QUESTIONS = 90; // número de questões por bloco
const TIME_SECONDS = 5 * 3600;

let state = { questions: [], answers: {}, idx: 0, timeLeft: TIME_SECONDS, timerId: null };

// DOM
const anoSelect = document.getElementById('anoSelect');
const disciplinaSelect = document.getElementById('disciplinaSelect');
const idiomaSelect = document.getElementById('idiomaSelect');
const idiomaLabel = document.getElementById('idiomaLabel');
const startBtn = document.getElementById('startBtn');
const simuladoDiv = document.getElementById('simulado');
const questaoContainer = document.getElementById('questaoContainer');
const timerDiv = document.getElementById('timer');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const finishBtn = document.getElementById('finishBtn');

// Mostrar/ocultar idioma
disciplinaSelect.addEventListener('change', () => {
  idiomaLabel.style.display = disciplinaSelect.value === 'linguagens' ? 'block' : 'none';
});

// Carregar anos
async function loadYears() {
  try {
    const res = await fetch(`${API_ENEM}/exams`);
    const data = await res.json();
    const years = [...new Set(data.map(e => e.year))].sort((a, b) => b - a);
    years.forEach(y => { 
      const opt = document.createElement('option'); 
      opt.value = y; 
      opt.textContent = y; 
      anoSelect.appendChild(opt); 
    });
  } catch {
    for (let y = 2024; y >= 2009; y--) { 
      const opt = document.createElement('option'); 
      opt.value = y; 
      opt.textContent = y; 
      anoSelect.appendChild(opt); 
    }
  }
}
loadYears();

// Função para buscar questões com offset e limit
async function fetchQuestions(year, discipline, language, offset = 0, limit = 50) {
  try {
    const url = new URL(`${API_ENEM}/exams/${year}/questions`);
    url.searchParams.set('limit', limit);
    url.searchParams.set('offset', offset);
    url.searchParams.set('discipline', discipline);
    if (language) url.searchParams.set('language', language);

    const res = await fetch(url);
    const data = await res.json();
    return data.questions || [];
  } catch (e) {
    console.warn("Erro ao buscar questões:", e);
    return [];
  }
}

// Iniciar prova
startBtn.addEventListener('click', async () => {
  const year = parseInt(anoSelect.value);
  const discipline = disciplinaSelect.value;
  let language = idiomaSelect.value;

  // Ajuste de idioma
  if (discipline !== 'linguagens') language = null;
  else if (year < 2024) language = null; // apenas português antes de 2024
  else if (language === 'english') language = 'ingles';
  else if (language === 'spanish') language = 'espanhol';
  else language = null;

  let questions = [];

  if (discipline === 'linguagens') {
    // Linguagens/Humanas: questões 1 a 90 (offset 0)
    questions = questions.concat(await fetchQuestions(year, discipline, language, 0, 50));
    questions = questions.concat(await fetchQuestions(year, discipline, language, 50, 40));
  } else {
    // Matemática/Ciências da Natureza: questões 91 a 180 (offset 90)
    questions = questions.concat(await fetchQuestions(year, discipline, null, 91, 50));
    questions = questions.concat(await fetchQuestions(year, discipline, null, 140, 40));
  }

  state.questions = questions.slice(0, TOTAL_QUESTIONS);

  if (!state.questions.length) {
    alert('Nenhuma questão encontrada para essa configuração.');
    return;
  }

  document.getElementById('config').classList.add('hidden');
  simuladoDiv.classList.remove('hidden');
  state.idx = 0;

  renderQuestion();
  startTimer();
});

// Renderizar questões
function parseQuestionContext(text) {
  if (!text) return '';

  // Substituir Markdown ![](URL) por <img>
  let html = text.replace(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/gi, (_, url) => {
    return `<img src="${url}" class="questao-img" alt="Imagem">`;
  });

  // Substituir URLs soltas por <img>, mas ignorar já convertidas
  html = html.replace(/(^|\s)(https?:\/\/[^\s)]+?\.(?:png|jpe?g|gif))(\s|$)/gi, (m, p1, url, p3) => {
    // se já existe <img src="URL"> no texto, ignora
    if (html.includes(`<img src="${url}"`)) return m;
    return `${p1}<img src="${url}" class="questao-img" alt="Imagem">${p3}`;
  });

  return html;
}


function renderQuestion() {
  questaoContainer.innerHTML = '';
  const q = state.questions[state.idx];
  if (!q) return;

  const div = document.createElement('div');
  div.className = 'questao';
  div.innerHTML = `<h3>${q.title || `Questão ${state.idx + 1}`}</h3>
                   <p>${parseQuestionContext(q.context)}</p>
                   <p><em>${q.alternativesIntroduction || ''}</em></p>`;

  const altDiv = document.createElement('div');
  if (Array.isArray(q.alternatives)) {
    q.alternatives.forEach(a => {
      const btn = document.createElement('button');
      btn.className = 'alt';
      btn.textContent = `${a.letter} - ${a.text || ''}`;
      if (state.answers[state.idx] === a.letter) btn.classList.add('selected');
      btn.addEventListener('click', () => { state.answers[state.idx] = a.letter; renderQuestion(); });
      altDiv.appendChild(btn);
    });
  }
  div.appendChild(altDiv);
  questaoContainer.appendChild(div);

  prevBtn.disabled = state.idx === 0;
  nextBtn.disabled = state.idx === state.questions.length - 1;
}

// Navegação
prevBtn.addEventListener('click', () => { if (state.idx > 0) { state.idx--; renderQuestion(); } });
nextBtn.addEventListener('click', () => { if (state.idx < state.questions.length - 1) { state.idx++; renderQuestion(); } });
finishBtn.addEventListener('click', finishExam);

// Timer
function startTimer() {
  renderTimer();
  state.timerId = setInterval(() => {
    state.timeLeft--;
    renderTimer();
    if (state.timeLeft <= 0) { clearInterval(state.timerId); finishExam(); }
  }, 1000);
}
function renderTimer() {
  const t = Math.max(0, state.timeLeft);
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
  timerDiv.textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

// Finalizar prova
function finishExam() {
  clearInterval(state.timerId);
  let correct = 0, wrong = 0, report = [];

  state.questions.forEach((q, i) => {
    const chosen = state.answers[i];
    const right = q.correctAlternative || q.answer;
    if (chosen) {
      if (chosen.toUpperCase() === right.toUpperCase()) { correct++; report.push(`Questão ${i + 1}: ✅ Correta (${chosen})`); }
      else { wrong++; report.push(`Questão ${i + 1}: ❌ Errada (Você: ${chosen}, Correta: ${right})`); }
    } else { wrong++; report.push(`Questão ${i + 1}: ⚠️ Em branco (Correta: ${right})`); }
  });

  const nota = Math.round((correct / state.questions.length) * 1000);

  questaoContainer.innerHTML = `
    <div class="resultado-final">
      <h2>Resultado Final</h2>
      <p><strong>Acertos:</strong> ${correct}</p>
      <p><strong>Erros/Branco:</strong> ${wrong}</p>
      <p><strong>Nota estimada:</strong> ${nota}</p>
      <div class="report-container">
        ${report.map(r => `<div class="report-line">${r}</div>`).join('')}
      </div>
    </div>`;

  prevBtn.disabled = true;
  nextBtn.disabled = true;
  finishBtn.disabled = true;

  const navDiv = document.querySelector('.navegacao');
  const restartBtn = document.createElement('button');
  restartBtn.id = 'restartBtn';
  restartBtn.textContent = 'Voltar ao Início';
  restartBtn.classList.add('alt');
  restartBtn.addEventListener('click', () => window.location.href = '/ProjetoEnem/frontend/dashboard.html');
  navDiv.appendChild(restartBtn);
}
