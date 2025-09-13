// desempenho.js — carrega histórico do backend e desenha gráficos com Chart.js
const BACKEND = 'http://localhost:3000/api';
let chartDist = null, chartTrend = null, chartByDisc = null;

// Função para buscar histórico do backend
async function fetchHistory(username) {
  try {
    const res = await fetch(`${BACKEND}/history/${encodeURIComponent(username)}`);
    if (!res.ok) return [];
    const j = await res.json();
    return Array.isArray(j) ? j : [];
  } catch (e) {
    console.error('Erro ao buscar histórico:', e);
    return [];
  }
}

// Export CSV
function toCSV(arr) {
  const header = ['date,discipline,score,correct,wrong,blank,total'];
  const lines = arr.map(i => `${i.date||''},${i.discipline||''},${i.score||''},${i.correct||''},${i.wrong||''},${i.blank||''},${i.total||''}`);
  return header.concat(lines).join('\n');
}

// Cria bins para gráfico de distribuição
function makeBins(scores, bins = 10) {
  const counts = Array(bins).fill(0);
  const labels = [];
  const step = Math.ceil(1000 / bins);
  for (let i = 0; i < bins; i++) labels.push(`${i*step}-${Math.min(1000,(i+1)*step-1)}`);
  scores.forEach(s => { if (typeof s === 'number') counts[Math.min(bins-1, Math.floor(s/step))]++; });
  return { labels, counts };
}

// Destruir gráficos antigos
function destroyCharts() {
  if (chartDist) chartDist.destroy();
  if (chartTrend) chartTrend.destroy();
  if (chartByDisc) chartByDisc.destroy();
}

// Função principal
(async function init() {
  const user = JSON.parse(localStorage.getItem('simulado_user') || 'null');
  if (!user) { 
    alert('Faça login'); 
    window.location.href = 'index.html'; 
    return; 
  }

  const history = await fetchHistory(user.username);
  if (!Array.isArray(history) || !history.length) {
    document.getElementById('historyList').textContent = 'Nenhum resultado encontrado.';
    return;
  }

  const results = history.filter(r => typeof r.score === 'number');
  destroyCharts();

  // --- Gráfico de distribuição geral ---
  const scores = results.map(r => r.score);
  const bins = makeBins(scores, 10);
  const ctxDist = document.getElementById('chartDist').getContext('2d');
  chartDist = new Chart(ctxDist, {
    type: 'bar',
    data: {
      labels: bins.labels,
      datasets: [{ label: 'Frequência', data: bins.counts, backgroundColor: '#60a5fa', borderRadius: 6 }]
    },
    options: { responsive: true, plugins: { legend: { display: false } } }
  });

  // --- Gráfico de evolução ---
  const sortedByDate = results.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
  const ctxTrend = document.getElementById('chartTrend').getContext('2d');
  chartTrend = new Chart(ctxTrend, {
    type: 'line',
    data: {
      labels: sortedByDate.map(r => new Date(r.date).toLocaleDateString()),
      datasets: [{
        label: 'Nota',
        data: sortedByDate.map(r => r.score),
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34,197,94,0.2)',
        fill: true,
        tension: 0.3
      }]
    },
    options: { responsive: true, plugins: { legend: { display: true } } }
  });

  // --- Gráfico por disciplina ---
  const scoreByDisc = { linguagens: [], matematica: [] };
  results.forEach(r => {
    if (r.discipline === 'linguagens') scoreByDisc.linguagens.push(r.score);
    else if (r.discipline === 'matematica') scoreByDisc.matematica.push(r.score);
  });
  const binsLing = makeBins(scoreByDisc.linguagens, 10);
  const binsMat = makeBins(scoreByDisc.matematica, 10);
  const ctxByDisc = document.getElementById('chartByDisc').getContext('2d');
  chartByDisc = new Chart(ctxByDisc, {
    type: 'bar',
    data: {
      labels: binsLing.labels,
      datasets: [
        { label: 'Linguagens', data: binsLing.counts, backgroundColor: '#60a5fa' },
        { label: 'Matemática', data: binsMat.counts, backgroundColor: '#f97316' }
      ]
    },
    options: { responsive: true, plugins: { legend: { position: 'top' } } }
  });

  // --- Export CSV ---
  const btnCSV = document.getElementById('btnExportCSV');
  if (btnCSV) {
    btnCSV.addEventListener('click', () => {
      const csv = toCSV(results);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `history_${user.username}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    });
  }

  // --- Histórico em tabela ---
  const listNode = document.getElementById('historyList');
  listNode.innerHTML = '';
  const table = document.createElement('table');
  table.style.width = '100%'; 
  table.style.borderCollapse = 'collapse';
  const head = document.createElement('thead');
  head.innerHTML = '<tr><th>Data</th><th>Disciplina</th><th>Nota</th><th>Acertos</th><th>Erros</th><th>Brancos</th><th>Total</th></tr>';
  table.appendChild(head);
  const tbody = document.createElement('tbody');
  sortedByDate.reverse().forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${new Date(r.date).toLocaleString()}</td>
      <td>${r.discipline||''}</td>
      <td>${r.score||''}</td>
      <td>${r.correct||0}</td>
      <td>${r.wrong||0}</td>
      <td>${r.blank||0}</td>
      <td>${r.total||''}</td>
    `;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  listNode.appendChild(table);

})();
