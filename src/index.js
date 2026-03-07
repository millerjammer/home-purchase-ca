import 'bootstrap/dist/css/bootstrap.min.css'
import './dark.css'
import { Chart } from 'chart.js/auto'

const slider = document.getElementById("homePrice")
const sliderValue = document.getElementById("homePriceValue")

let chart

function calculate() {

  const homePrice = Number(slider.value)

  const portfolioEvent =
    Number(document.getElementById("portfolioValue").value)

  const growth =
    Number(document.getElementById("growthRate").value) / 100

  const sblRate =
    Number(document.getElementById("sblRate").value) / 100


  const labels = []

  const baseline = []
  const withLoan = []
  const netWorth = []


  // ---------- PRE EVENT (reverse compound)

  let pBase = portfolioEvent
  let pLoan = portfolioEvent

  const preBase = []
  const preLoan = []

  for (let i = 0; i < 5; i++) {

    pBase = pBase / (1 + growth)
    pLoan = pLoan / (1 + growth)

    preBase.unshift(pBase)
    preLoan.unshift(pLoan)
  }

  for (let i = -5; i < 0; i++) {

    labels.push(i)

    baseline.push(preBase[i + 5])
    withLoan.push(preLoan[i + 5])
    netWorth.push(preLoan[i + 5]) // no house yet
  }


  // ---------- EVENT YEAR

  labels.push(0)

  baseline.push(portfolioEvent)
  withLoan.push(portfolioEvent)
  netWorth.push(portfolioEvent + homePrice)


  // ---------- POST EVENT

  let base = portfolioEvent
  let loan = portfolioEvent

  const interest = homePrice * sblRate

  for (let year = 1; year <= 5; year++) {

    base = base * (1 + growth)

    const g = loan * growth
    const net = g - interest

    loan += net

    labels.push(year)

    baseline.push(base)
    withLoan.push(loan)
    netWorth.push(loan + homePrice)
  }

  return { labels, baseline, withLoan, netWorth }
}



function renderChart() {

  sliderValue.innerText =
    Number(slider.value).toLocaleString()

  const result = calculate()

  const ctx = document.getElementById("chart")

  if (chart) chart.destroy()

  chart = new Chart(ctx, {

    type: "line",

    data: {

      labels: result.labels,

      datasets: [

        {
          label: "Portfolio Baseline",
          data: result.baseline,
          borderWidth: 3
        },

        {
          label: "Portfolio w/ SBL",
          data: result.withLoan,
          borderWidth: 3
        },

        {
          label: "Net Worth (Portfolio + Home)",
          data: result.netWorth,
          borderWidth: 3
        }

      ]
    },

    options: {

      responsive: true,

      plugins: {
        legend: {
          labels: { color: "white" }
        }
      },

      scales: {
        x: { ticks: { color: "white" } },
        y: { ticks: { color: "white" } }
      }
    }
  })
}



document.querySelectorAll("input")
  .forEach(el => el.addEventListener("input", renderChart))

renderChart()