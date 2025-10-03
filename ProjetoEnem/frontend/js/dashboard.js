// dashboard.js - mostra historico resumido e graficos
const BACKEND = 'http://localhost:3000/api';  

(async function init() { // funciona da seguinte forma: pega o usuario do localStorage, se nao tiver manda pro login. se tiver pega o historico do backend, mostra as 5 ultimas provas e cria dois graficos (grafico de pizza da ultima prova e grafico de linha da evolucao das notas)
  const usuario = JSON.parse(localStorage.getItem('simulado_user') || 'null')
  if (!usuario) {
    alert('Faça login')
    window.location.href = 'index.html'
    return
  }
  document.getElementById('username').textContent = usuario.username

  let historico = []
  try {
    const res = await fetch(`${BACKEND}/history/${encodeURIComponent(usuario.username)}`)
    if (res.ok) historico = await res.json()
  } catch (e) {
    console.error('Erro ao buscar histórico: ', e)
  }

  const listaNode = document.getElementById('resumoList')
  listaNode.innerHTML = ''

  if (!historico.length) {
    const li = document.createElement('li')
    li.textContent = 'Nenhum resultado registrado ainda'
    listaNode.appendChild(li)
    return
  }

  const ordenado = historico.slice().sort((a, b) => new Date(b.date) - new Date(a.date))

  // lista resumida das 5 ultimas provas. funciona da seguinte forma: pega o historico, ordena pela data (mais recente primeiro) e pega os 5 primeiros
  ordenado.slice(0, 5).forEach(r => {
    const li = document.createElement('li')
    li.textContent = `${new Date(r.date).toLocaleString()} — ${r.discipline} — Nota: ${r.score} — Acertos: ${r.correct}/${r.total}`
    listaNode.appendChild(li)
  })

  const ultima = ordenado[0]

  // grafico da ultima prova (acertos, erros, brancos). usa Chart.js (https://www.chartjs.org/)
  const ctx1 = document.getElementById('graficoUltima').getContext('2d')
  new Chart(ctx1, {
    type: 'pie',
    data: {
      labels: ['Acertos', 'Erros', 'Brancos'],
      datasets: [{
        data: [ultima.correct, ultima.wrong || 0, ultima.blank || 0],
        backgroundColor: ['#22c55e', '#ef4444', '#facc15']
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: '#fcfcfcff' } } }, // obrigado autopilot, acima disso e abaixo de "Const ctx1" eu realmente nao sabia o que escrever
      width: 22,
      height: 400,
    }
  })

  // grafico de evolucao das notas. funciona melhor se tiver mais de 5 resultados e for sempre a mesma disciplina
  const ordenadoPorData = ordenado.slice().reverse()
  const ctx2 = document.getElementById('graficoEvolucao').getContext('2d')
  new Chart(ctx2, {
    type: 'line',
    data: {
      labels: ordenadoPorData.map(r => new Date(r.date).toLocaleDateString()),
      datasets: [{
        label: 'Nota',
        data: ordenadoPorData.map(r => r.score),
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
  })
})()
