// dashboard.js — mostra histórico resumido e gráficos
const BACKEND = 'http://localhost:3000/api';

(async function init() {
  const user = JSON.parse(localStorage.getItem('simulado_user') || 'null');
  if (!user) {
    alert('Faça login');
    window.location.href = 'index.html';
    return;
  }
  document.getElementById('username').textContent = user.username;

  let history = [];
  try {
    const res = await fetch(`${BACKEND}/history/${encodeURIComponent(user.username)}`);
    if (res.ok) history = await res.json();
  } catch (e) {
    console.error('Erro ao buscar histórico:', e);
  }

  const listNode = document.getElementById('resumoList');
  listNode.innerHTML = '';

  if (!history.length) {
    const li = document.createElement('li');
    li.textContent = 'Nenhum resultado registrado ainda.';
    listNode.appendChild(li);
    return;
  }

  const sorted = history.slice().sort((a, b) => new Date(b.date) - new Date(a.date));

  // Lista resumida das 5 últimas provas
  sorted.slice(0, 5).forEach(r => {
    const li = document.createElement('li');
    li.textContent = `${new Date(r.date).toLocaleString()} — ${r.discipline} — Nota: ${r.score} — Acertos: ${r.correct}/${r.total}`;
    listNode.appendChild(li);
  });

  const latest = sorted[0];

  // Gráfico da última prova (acertos, erros, brancos)
  const ctx1 = document.getElementById('graficoUltima').getContext('2d');
  new Chart(ctx1, {
    type: 'pie',
    data: {
      labels: ['Acertos', 'Erros', 'Brancos'],
      datasets: [{
        data: [latest.correct, latest.wrong || 0, latest.blank || 0],
        backgroundColor: ['#22c55e', '#ef4444', '#facc15']
      }]
    },
    options: {
      plugins: { legend: { labels: { color: '#fcfcfcff' } } }
    }
  });

  // Gráfico de evolução das notas
  const sortedByDate = sorted.slice().reverse();
  const ctx2 = document.getElementById('graficoEvolucao').getContext('2d');
  new Chart(ctx2, {
    type: 'line',
    data: {
      labels: sortedByDate.map(r => new Date(r.date).toLocaleDateString()),
      datasets: [{
        label: 'Nota',
        data: sortedByDate.map(r => r.score),
        borderColor: '#60a5fa',
        backgroundColor: 'rgba(96,165,250,0.2)',
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      scales: {
        x: { ticks: { color: '#fcfcfcff' } },
        y: { ticks: { color: '#fcfcfcff' } }
      },
      plugins: { legend: { labels: { color: '#fcfcfcff' } } }
    }
  });
})();
