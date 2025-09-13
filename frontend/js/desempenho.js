// desempenho.js — carrega histórico do backend e desenha gráficos com Chart.js
const BACKEND = 'http://localhost:3000/api';
let chartDist = null, chartTrend = null, chartByDisc = null;

async function fetchHistory(username){
  try {
    const res = await fetch(`${BACKEND}/history/${encodeURIComponent(username)}`);
    if(!res.ok) return [];
    const j = await res.json();
    return Array.isArray(j) ? j : [];
  } catch(e) {
    console.error('Erro ao buscar histórico:', e);
    return [];
  }
}



function toCSV(arr){
  const header = ['date,discipline,score,correct,total'];
  const lines = arr.map(i => `${i.date || ''},${i.discipline || ''},${i.score || ''},${i.correct||''},${i.total||''}`);
  return header.concat(lines).join('\n');
}

function makeBins(scores, bins=10){
  const counts = Array(bins).fill(0);
  const labels = [];
  const step = Math.ceil(1000 / bins);
  for(let i=0;i<bins;i++) labels.push(`${i*step}-${Math.min(1000,(i+1)*step-1)}`);
  scores.forEach(s => {
    if(typeof s !== 'number') return;
    const idx = Math.min(bins-1, Math.floor(s / step));
    counts[idx]++;
  });
  return {labels, counts};
}

function destroyCharts(){
  if(chartDist) chartDist.destroy();
  if(chartTrend) chartTrend.destroy();
  if(chartByDisc) chartByDisc.destroy();
}

(async function init(){
  const user = JSON.parse(localStorage.getItem('simulado_user') || 'null');
  if(!user){ alert('Faça login'); window.location.href = 'index.html'; return; }

const history = await fetchHistory(user.username);
if (!Array.isArray(history)) {
  console.warn('Histórico inválido:', history);
  document.getElementById('historyList').textContent = 'Nenhum resultado encontrado.';
  return;
}

const results = history.filter(r => typeof r.score === 'number');


  if(!results.length){
    document.getElementById('historyList').textContent = 'Nenhum resultado encontrado.';
    return;
  }

  // export CSV botão
  document.getElementById('btnExportCSV').addEventListener('click', ()=> {
    const csv = toCSV(results);
    const blob = new Blob([csv], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `history_${user.username}.csv`; document.body.appendChild(a); a.click(); a.remove();
  });

  // distribuição geral
  const scores = results.map(r => r.score);
  const bins = makeBins(scores, 10);

  destroyCharts();

  const ctx = document.getElementById('chartDist').getContext('2d');
  chartDist = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: bins.labels,
      datasets: [{label: 'Frequência', data: bins.counts, borderRadius:6}]
    },
    options: {responsive:true, plugins:{legend:{display:false}}}
  });

  // tendência (linha)
  const sorted = results.slice().sort((a,b)=> new Date(a.date) - new Date(b.date));
  const trendLabels = sorted.map(r => new Date(r.date).toLocaleString());
  const trendData = sorted.map(r => r.score);
  const ctx2 = document.getElementById('chartTrend').getContext('2d');
  chartTrend = new Chart(ctx2, {
    type: 'line',
    data: { labels: trendLabels, datasets: [{label:'Nota', data: trendData, fill:false, tension:0.2}] },
    options: {responsive:true, plugins:{legend:{display:false}}}
  });

  // frequência por disciplina
  const disc = { geral: {}, linguagens:0, matematica:0 };
  const scoreByDisc = { linguagens: [], matematica: [] };
  results.forEach(r => {
    if(r.discipline === 'linguagens') scoreByDisc.linguagens.push(r.score);
    else if(r.discipline === 'matematica') scoreByDisc.matematica.push(r.score);
  });

  const binsLing = makeBins(scoreByDisc.linguagens, 10);
  const binsMat = makeBins(scoreByDisc.matematica, 10);

  const ctx3 = document.getElementById('chartByDisc').getContext('2d');
  chartByDisc = new Chart(ctx3, {
    type: 'bar',
    data: {
      labels: binsLing.labels,
      datasets: [
        { label:'Linguagens', data: binsLing.counts },
        { label:'Matemática', data: binsMat.counts }
      ]
    },
    options: { responsive:true, plugins:{legend:{position:'top'}} }
  });

  // exibir histórico em lista
  const listNode = document.getElementById('historyList');
  listNode.innerHTML = '';
  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  const head = document.createElement('thead');
  head.innerHTML = '<tr><th style="text-align:left;padding:6px">Data</th><th style="text-align:left;padding:6px">Disciplina</th><th style="text-align:right;padding:6px">Nota</th><th style="text-align:right;padding:6px">Acertos</th></tr>';
  table.appendChild(head);
  const tbody = document.createElement('tbody');
  sorted.reverse().forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td style="padding:6px">${new Date(r.date).toLocaleString()}</td><td style="padding:6px">${r.discipline||''}</td><td style="padding:6px;text-align:right">${r.score||''}</td><td style="padding:6px;text-align:right">${(r.correct||'')}/${(r.total||'')}</td>`;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  listNode.appendChild(table);

})();
