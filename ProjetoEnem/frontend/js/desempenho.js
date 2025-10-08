// desempenho.js — carrega historico do backend e desenha graficos com Chart.js
const BACKEND = 'http://localhost:3000/api';
let chartDist = null, chartTrend = null, chartByDisc = null;

// busca histórico no backend
async function fetchHistory(username) {
  try {
    const res = await fetch(`${BACKEND}/history/${encodeURIComponent(username)}`);
    if (!res.ok) return [];
    const j = await res.json();
    return Array.isArray(j) ? j : [];
  } catch (e) {
    console.error('erro ao buscar historico:', e);
    return [];
  }
}

// exporta para CSV
function paraCSV(arr) {
  const header = ['date,discipline,score,correct,wrong,blank,total'];
  const lines = arr.map(i =>
    `${i.date||''},${i.discipline||''},${i.score||''},${i.correct||''},${i.wrong||''},${i.blank||''},${i.total||''}`
  );
  return header.concat(lines).join('\n');
}

// cria bins para gráfico de distribuição
function fazerBins(scores, bins = 10) {
  const counts = Array(bins).fill(0);
  const labels = [];
  const step = Math.ceil(1000 / bins);
  for (let i = 0; i < bins; i++)
    labels.push(`${i * step}-${Math.min(1000, (i + 1) * step - 1)}`);
  scores.forEach(s => {
    if (typeof s === 'number') counts[Math.min(bins - 1, Math.floor(s / step))]++;
  });
  return { labels, counts };
}

// destruir gráficos antigos
function tchauCharts() {
  if (chartDist) chartDist.destroy();
  if (chartTrend) chartTrend.destroy();
  if (chartByDisc) chartByDisc.destroy();
}

// função principal
(async function init() {
  const user = JSON.parse(localStorage.getItem('simulado_user') || 'null');
  if (!user) {
    alert('faça login');
    window.location.href = 'index.html';
    return;
  }

  const history = await fetchHistory(user.username);
  if (!Array.isArray(history) || !history.length) {
    document.getElementById('historyList').textContent = 'nenhum resultado encontrado';
    return;
  }

  const results = history.filter(r => typeof r.score === 'number');
  tchauCharts();

  // --- gráfico de distribuição geral ---
  const scores = results.map(r => r.score);
  const bins = fazerBins(scores, 10);
  const ctxDist = document.getElementById('chartDist').getContext('2d');
  chartDist = new Chart(ctxDist, {
    type: 'bar',
    data: {
      labels: bins.labels,
      datasets: [{ label: 'frequência', data: bins.counts, backgroundColor: '#60a5fa', borderRadius: 6 }]
    },
    options: { responsive: true, plugins: { legend: { display: false } } }
  });

  // --- gráfico de evolução ---
  const sortedByDate = results.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
  const ctxTrend = document.getElementById('chartTrend').getContext('2d');
  chartTrend = new Chart(ctxTrend, {
    type: 'line',
    data: {
      labels: sortedByDate.map(r => new Date(r.date).toLocaleDateString()),
      datasets: [{
        label: 'nota',
        data: sortedByDate.map(r => r.score),
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34,197,94,0.2)',
        fill: true,
        tension: 0.3
      }]
    },
    options: { responsive: true, plugins: { legend: { display: true } } }
  });

  // --- gráfico por disciplina ---
  const scoreByDisc = { linguagens: [], matematica: [] };
  results.forEach(r => {
    if (r.discipline === 'linguagens') scoreByDisc.linguagens.push(r.score);
    else if (r.discipline === 'matematica') scoreByDisc.matematica.push(r.score);
  });
  const binsLing = fazerBins(scoreByDisc.linguagens, 10);
  const binsMat = fazerBins(scoreByDisc.matematica, 10);
  const ctxByDisc = document.getElementById('chartByDisc').getContext('2d');
  chartByDisc = new Chart(ctxByDisc, {
    type: 'bar',
    data: {
      labels: binsLing.labels,
      datasets: [
        { label: 'linguagens', data: binsLing.counts, backgroundColor: '#60a5fa' },
        { label: 'matemática', data: binsMat.counts, backgroundColor: '#f97316' }
      ]
    },
    options: { responsive: true, plugins: { legend: { position: 'top' } } }
  });

  // --- exportar csv ---
  const btnCSV = document.getElementById('btnExportCSV');
  if (btnCSV) {
    btnCSV.addEventListener('click', () => {
      const csv = paraCSV(results);
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

  // --- tabela de histórico ---
  const listNode = document.getElementById('historyList');
  listNode.innerHTML = '';

  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';

  const head = document.createElement('thead');
  head.innerHTML = `
    <tr>
      <th>Data</th>
      <th>Ano</th>
      <th>Disciplina</th>
      <th>Nota</th>
      <th>Acertos</th>
      <th>Erros</th>
      <th>Brancos</th>
      <th>Total</th>
    </tr>`;
  table.appendChild(head);

  const tbody = document.createElement('tbody');
  sortedByDate.slice().reverse().forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${new Date(r.date).toLocaleString()}</td>
      <td>${r.year || '-'}</td>
      <td>${r.discipline || ''}</td>
      <td>${r.score || ''}</td>
      <td>${r.correct || 0}</td>
      <td>${r.wrong || 0}</td>
      <td>${r.blank || 0}</td>
      <td>${r.total || ''}</td>
    `;
    tr.addEventListener('click', () => mostrarDetalheProva(r));
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  listNode.appendChild(table);

  // área de detalhes
  const detalhesDiv = document.createElement('div');
  detalhesDiv.id = 'detalhesProva';
  detalhesDiv.style.marginTop = '20px';
  detalhesDiv.style.padding = '10px';
  detalhesDiv.style.background = 'rgba(255,255,255,0.05)';
  detalhesDiv.style.borderRadius = '8px';
  listNode.appendChild(detalhesDiv);
})();

// --- função para mostrar detalhes da prova ---
function mostrarDetalheProva(result) {
  const container = document.createElement('div');
  container.classList.add('exam-details');

  const detalhesHTML = result.details && Array.isArray(result.details)
    ? result.details.map(q => `
        <div class="questao-detalhe">
          <p>${transformaEmImagem(q.context)}</p>
          ${q.title ? `<p><strong>${q.title}</strong></p>` : ''}
          ${q.question ? `<p><strong>Pergunta:</strong> ${transformaEmImagem(q.question)}</p>` : ''}
          <ul>
            ${q.alternatives?.map(a => `
              <li ${a.letter === q.correctLetter ? 'style="color:#22c55e;font-weight:bold;"' : ''}>
                ${a.letter}) ${a.text}
              </li>`).join('') || ''}
          </ul>
          <p>
            Sua resposta: <strong>${q.chosen || '-'}</strong>
            ${q.isCorrect ? '✅' : q.chosen ? '❌' : '—'}
          </p>
          <hr>
        </div>
      `).join('')
    : '<p>Nenhum detalhe de questão disponível.</p>';

  container.innerHTML = `
    <h3>${result.year || '—'} — ${result.discipline}</h3>
    <p><strong>Nota:</strong> ${result.score}</p>
    <p>Acertos: ${result.correct}/${result.total} — Erros: ${result.wrong} — Brancos: ${result.blank}</p>
    <hr>
    ${detalhesHTML}
  `;

  const detalhesDiv = document.getElementById('detalhesProva');
  detalhesDiv.innerHTML = '';
  detalhesDiv.appendChild(container);
  function transformaEmImagem(text) {
    if (!text) return '';
    text = text.replace(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/gi,
      (_, url) => `<img src="${url}" style="max-width:100%;height:auto;">`);
      text = text.replace(/(^|\s)(https?:\/\/[^\s)]+?\.(?:png|jpe?g|gif))(\s|$)/gi,
      (_, p1, url, p3) => `${p1}<img src="${url}" style="max-width:100%;height:auto;">${p3}`);
  
    return text;
  }
  
}
