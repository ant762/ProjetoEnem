const API_ENEM = 'https://api.enem.dev/v1';
const BACKEND = 'http://localhost:3000/api';
const TOTAL_QUESTIONS = 90;
const TIME_SECONDS = 5 * 3600;

let state = { questions: [], answers: {}, idx: 0, timeLeft: TIME_SECONDS, timerId: null };

// coisaaa
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

// mmostrar/ocultar idioma
disciplinaSelect.addEventListener('change', () => {
  idiomaLabel.style.display = disciplinaSelect.value === 'linguagens' ? 'block' : 'none';
});

// anos
async function loadYears() {
  try {
    const res = await fetch(`${API_ENEM}/exams`);
    const data = await res.json();
    const years = [...new Set(data.map(e => e.year))].sort((a, b) => b - a);
    years.forEach(y => anoSelect.appendChild(new Option(y, y)));
  } catch {
    for (let y = 2024; y >= 2009; y--) anoSelect.appendChild(new Option(y, y));
  }
}
loadYears();

// Buscar questões
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
  } catch (e) { console.warn(e); return []; }
}

// Iniciar prova
startBtn.addEventListener('click', async () => {
  const year = parseInt(anoSelect.value);
  const discipline = disciplinaSelect.value;
  let language = disciplinaSelect.value === 'linguagens'
    ? (idiomaSelect.value.toLowerCase() === 'english' ? 'ingles'
      : idiomaSelect.value.toLowerCase() === 'spanish' ? 'espanhol'
        : null)
    : null;

  let questions = [];

  try {
    if (discipline === 'matematica') {
      const first50 = await fetchQuestions(year, discipline, null, 91, 50); // quest 91–140
      const next40 = await fetchQuestions(year, discipline, null, 140, 40); // quest 141–180
      questions = [...first50, ...next40].slice(0, TOTAL_QUESTIONS);
    } else if (discipline === 'linguagens') {
      const q1 = await fetchQuestions(year, discipline, language, 0, 50);
      const q2 = await fetchQuestions(year, discipline, language, 50, 40);
      questions = [...q1, ...q2].slice(0, TOTAL_QUESTIONS);
    } else {
      const q1 = await fetchQuestions(year, discipline, null, 0, 50);
      const q2 = await fetchQuestions(year, discipline, null, 50, 40);
      questions = [...q1, ...q2].slice(0, TOTAL_QUESTIONS);
    }
  } catch (e) {
    console.error('Erro ao buscar questões:', e);
    alert('Erro ao carregar questões.');
    return;
  }

  if (!questions.length) {
    alert('Nenhuma questão encontrada.');
    return;
  }

  state.questions = questions.slice(0, TOTAL_QUESTIONS);
  state.idx = 0;
  state.answers = {};
  state.timeLeft = TIME_SECONDS;

  document.getElementById('config').classList.add('hidden');
  simuladoDiv.classList.remove('hidden');

  renderQuestion();
  startTimer();
});


function parseQuestionContext(text) {
  if (!text) return '';
  let html = text;

  // markdown ![alt](url)
  html = html.replace(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/gi, (_, url) => {
    return `<img src="${url}" class="questao-img" alt="Imagem">`;
  });

  // URLs soltas que terminam em .png/.jpg/.gif
  html = html.replace(/(^|\s)(https?:\/\/[^\s)]+?\.(?:png|jpe?g|gif))(\s|$)/gi, (m, p1, url, p3) => {
    return `${p1}<img src="${url}" class="questao-img" alt="Imagem">${p3}`;
  });

  return html;
}


function renderQuestion() {
  const q = state.questions[state.idx];
  if (!q) return;

  questaoContainer.innerHTML = `
    <div class="questao">
      <h3>${q.title || `Questão ${state.idx + 1}`}</h3>
      <p>${parseQuestionContext(q.context)}</p>
      <p><em>${q.alternativesIntroduction || ''}</em></p>
      <div>${q.alternatives.map(a => `
        <button type="button" class="alt ${state.answers[state.idx] === a.letter ? 'selected' : ''}" data-letter="${a.letter}">
          ${a.letter} - ${a.text || ''}
        </button>`).join('')}
      </div>
    </div>
  `;

  questaoContainer.querySelectorAll('.alt').forEach(btn => {
    btn.addEventListener('click', () => {
      state.answers[state.idx] = btn.dataset.letter;
      renderQuestion();
    });
  });

  prevBtn.disabled = state.idx === 0;
  nextBtn.disabled = state.idx === state.questions.length - 1;
}

// nav
prevBtn.addEventListener('click', () => { if (state.idx > 0) { state.idx--; renderQuestion(); } });
nextBtn.addEventListener('click', () => { if (state.idx < state.questions.length - 1) { state.idx++; renderQuestion(); } });

// contagem
function startTimer() {
  renderTimer();
  clearInterval(state.timerId);
  state.timerId = setInterval(() => {
    state.timeLeft--;
    renderTimer();
    if (state.timeLeft <= 0) {
      clearInterval(state.timerId);
      timerDiv.textContent = '00:00:00 (Tempo esgotado)';
      finishExam();
    }
  }, 1000);
}

function renderTimer() {
  const t = Math.max(0, state.timeLeft);
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
  timerDiv.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// cabÔssaporra
finishBtn.addEventListener('click', e => {
  e.preventDefault();
  e.stopPropagation();
  finishExam();
});

async function finishExam() {
  clearInterval(state.timerId);

  let correct = 0, wrong = 0, blank = 0;
  state.questions.forEach((q, i) => {
    const chosen = state.answers[i];
    const right = q.correctAlternative || q.answer;
    if (chosen) {
      if (chosen.toUpperCase() === right.toUpperCase()) correct++;
      else wrong++;
    } else blank++;
  });

  const nota = Math.round((correct / state.questions.length) * 1000);

  const user = JSON.parse(localStorage.getItem('simulado_user') || 'null');
  if (user) {
    try {
      await fetch(`${BACKEND}/saveResult`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          result: {
            date: new Date().toISOString(),
            year: parseInt(anoSelect.value),
            discipline: disciplinaSelect.value,
            score: nota,
            correct,
            wrong,
            blank,
            total: state.questions.length,

            details: state.questions.map((q, i) => {
              const correctLetter = q.correctAlternative || q.answer || '';
              const chosen = state.answers[i] || null;
              const correctAltObj = q.alternatives?.find(a => a.letter === correctLetter);
              const chosenAltObj = q.alternatives?.find(a => a.letter === chosen);

              return {
                number: q.number || i + 1,
                title: q.title || '',
                context: q.context || '',
                chosen: chosen,
                chosenText: chosenAltObj ? chosenAltObj.text : null,
                correctLetter,
                correctText: correctAltObj ? correctAltObj.text : null,
                isCorrect: chosen && chosen.toUpperCase() === correctLetter.toUpperCase(),
                alternatives: q.alternatives?.map(a => ({
                  letter: a.letter,
                  text: a.text
                })) || []
              };
            })
          }
        })
      });
    } catch (e) {
      console.error('Erro ao salvar:', e);
      alert('Não foi possível salvar o resultado.');
      return;
    }
  }

  window.location.href = '/ProjetoEnem/frontend/desempenho.html';
}

// reset
document.addEventListener('click', e => {
  if (e.target && e.target.id === 'restartBtn') {
    e.preventDefault();
    e.stopPropagation();
    resetExam();
  }
});


function resetExam() {
  state.questions = []; state.answers = {}; state.idx = 0; state.timeLeft = TIME_SECONDS;
  clearInterval(state.timerId); state.timerId = null;
  simuladoDiv.classList.add('hidden');
  document.getElementById('config').classList.remove('hidden');
  questaoContainer.innerHTML = ''; timerDiv.textContent = '00:00:00';
  prevBtn.disabled = nextBtn.disabled = finishBtn.disabled = false;
  anoSelect.selectedIndex = disciplinaSelect.selectedIndex = idiomaSelect.selectedIndex = 0;
  idiomaLabel.style.display = 'block';
}
