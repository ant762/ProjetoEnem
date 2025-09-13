const API_ENEM = 'https://api.enem.dev/v1';
const BACKEND = 'http://localhost:3000/api';
const TOTAL_QUESTIONS = 90;
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

// Mostra/oculta idioma
disciplinaSelect.addEventListener('change', () => {
  idiomaLabel.style.display = disciplinaSelect.value === 'linguagens' ? 'block' : 'none';
});

// Carregar anos
async function loadYears() {
  try {
    const res = await fetch(`${API_ENEM}/exams`);
    const data = await res.json();
    const years = [...new Set(data.map(e => e.year))].sort((a,b) => b-a);
    years.forEach(y => anoSelect.appendChild(new Option(y, y)));
  } catch {
    for(let y=2024; y>=2009; y--) anoSelect.appendChild(new Option(y, y));
  }
}
loadYears();

// Fetch de questões
async function fetchQuestions(year, discipline, language, offset=0, limit=50){
  try{
    const url = new URL(`${API_ENEM}/exams/${year}/questions`);
    url.searchParams.set('limit', limit);
    url.searchParams.set('offset', offset);
    url.searchParams.set('discipline', discipline);
    if(language) url.searchParams.set('language', language);
    const res = await fetch(url);
    const data = await res.json();
    return data.questions || [];
  } catch(e){ console.warn(e); return []; }
}

// Iniciar prova
startBtn.addEventListener('click', async () => {
  const year = parseInt(anoSelect.value);
  const discipline = disciplinaSelect.value;
  let language = disciplinaSelect.value === 'linguagens' 
                 ? idiomaSelect.value.toLowerCase() === 'english' ? 'ingles'
                 : idiomaSelect.value.toLowerCase() === 'spanish' ? 'espanhol'
                 : null 
                 : null;

  let questions = [];
  if(discipline==='linguagens'){
    questions = [...await fetchQuestions(year, discipline, language, 0, 50),
                 ...await fetchQuestions(year, discipline, language, 50, 40)];
  } else {
    questions = [...await fetchQuestions(year, discipline, null, 91, 50),
                 ...await fetchQuestions(year, discipline, null, 140, 40)];
  }

  if(!questions.length){ alert('Nenhuma questão encontrada.'); return; }

  state.questions = questions.slice(0, TOTAL_QUESTIONS);
  state.idx = 0;
  state.answers = {};
  state.timeLeft = TIME_SECONDS;

  document.getElementById('config').classList.add('hidden');
  simuladoDiv.classList.remove('hidden');

  renderQuestion();
  startTimer();
});

// Renderizar questão
function parseQuestionContext(text){
  if(!text) return '';
  let html = text.replace(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/gi, (_, url)=>`<img src="${url}" class="questao-img" alt="Imagem">`);
  html = html.replace(/(^|\s)(https?:\/\/[^\s)]+?\.(?:png|jpe?g|gif))(\s|$)/gi, (m,p1,url,p3)=> html.includes(`<img src="${url}"`) ? m : `${p1}<img src="${url}" class="questao-img" alt="Imagem">${p3}`);
  return html;
}

function renderQuestion(){
  const q = state.questions[state.idx];
  if(!q) return;

  questaoContainer.innerHTML = `
    <div class="questao">
      <h3>${q.title || `Questão ${state.idx+1}`}</h3>
      <p>${parseQuestionContext(q.context)}</p>
      <p><em>${q.alternativesIntroduction||''}</em></p>
      <div>${q.alternatives.map(a=>`
        <button type="button" class="alt ${state.answers[state.idx]===a.letter?'selected':''}" data-letter="${a.letter}">
          ${a.letter} - ${a.text||''}
        </button>`).join('')}
      </div>
    </div>
  `;

  questaoContainer.querySelectorAll('.alt').forEach(btn=>{
    btn.addEventListener('click', ()=> {
      state.answers[state.idx] = btn.dataset.letter;
      renderQuestion();
    });
  });

  prevBtn.disabled = state.idx===0;
  nextBtn.disabled = state.idx===state.questions.length-1;
}

// Navegação
prevBtn.addEventListener('click', ()=> { if(state.idx>0){ state.idx--; renderQuestion(); } });
nextBtn.addEventListener('click', ()=> { if(state.idx<state.questions.length-1){ state.idx++; renderQuestion(); } });

// Timer
function startTimer(){
  renderTimer();
  clearInterval(state.timerId);
  state.timerId = setInterval(()=>{
    state.timeLeft--;
    renderTimer();
    if(state.timeLeft<=0){
      clearInterval(state.timerId);
      timerDiv.textContent = '00:00:00 (Tempo esgotado)';
      finishExam();
    }
  },1000);
}

function renderTimer(){
  const t = Math.max(0,state.timeLeft);
  const h = Math.floor(t/3600), m=Math.floor((t%3600)/60), s=t%60;
  timerDiv.textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

// Finalizar prova
finishBtn.addEventListener('click', e => {
  e.preventDefault();
  e.stopPropagation();
  finishExam();
});

async function finishExam(){
  clearInterval(state.timerId);

  const correct = state.questions.reduce((acc, q, i) => {
    const chosen = state.answers[i];
    const right = q.correctAlternative || q.answer;
    return acc + (chosen && chosen.toUpperCase() === right.toUpperCase() ? 1 : 0);
  }, 0);

  const nota = Math.round((correct / state.questions.length) * 1000);

  // Salvar resultado no backend
  const user = JSON.parse(localStorage.getItem('simulado_user') || 'null');
  if(user){
    try {
      await fetch(`${BACKEND}/saveResult`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({
          username: user.username,
          result: {
            date: new Date().toISOString(),
            discipline: disciplinaSelect.value,
            score: nota,
            correct,
            total: state.questions.length
          }
        })
      });
    } catch(e) { console.error(e); }
  }

  // Redireciona direto para desempenho
  window.location.href = '/ProjetoEnem/frontend/desempenho.html';
}
