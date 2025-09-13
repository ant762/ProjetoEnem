const BACKEND = 'http://localhost:3000/api';

(async function init(){
  const user = JSON.parse(localStorage.getItem('simulado_user') || 'null');
  if(!user){ alert('Faça login'); window.location.href='index.html'; return; }
  document.getElementById('username').textContent = user.username;

  const res = await fetch(`${BACKEND}/history/${encodeURIComponent(user.username)}`);
  const history = res.ok ? (await res.json()) : [];

  const listNode = document.getElementById('resumoList');
  listNode.innerHTML = '';

  if(!history.length){
    const li = document.createElement('li');
    li.textContent = 'Nenhum resultado registrado ainda.';
    listNode.appendChild(li);
    return;
  }

  const sorted = history.slice().sort((a,b)=>new Date(b.date)-new Date(a.date));
  sorted.slice(0,5).forEach(r=>{
    const li = document.createElement('li');
    li.textContent = `${new Date(r.date).toLocaleString()} — ${r.discipline} — Nota: ${r.score} — Acertos: ${r.correct}/${r.total}`;
    listNode.appendChild(li);
  });

  // Código que estava fora da função
  const latest = sorted[0];

  // Gráfico da última prova
  const ctx1 = document.getElementById('graficoUltima');
  new Chart(ctx1, {
    type: 'pie',
    data: {
      labels: ['Acertos', 'Erros', 'Brancos'],
      datasets: [{
        data: [latest.correct, latest.wrong, latest.blank],
        backgroundColor: ['#22c55e', '#ef4444', '#facc15']
      }]
    },
    options: {
      plugins: { legend: { labels: { color: '#e6eef8' } } }
    }
  });

  // Gráfico evolução das notas
  const ctx2 = document.getElementById('graficoEvolucao');
  const sortedByDate = sorted.slice().reverse(); // ordem cronológica
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
        x: { ticks: { color: '#e6eef8' } },
        y: { ticks: { color: '#e6eef8' } }
      },
      plugins: { legend: { labels: { color: '#e6eef8' } } }
    }
  });

})();
