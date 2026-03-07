import 'bootstrap/dist/css/bootstrap.min.css'
import './dark.css'
import { Chart } from 'chart.js/auto'

const sliderHome = document.getElementById("homePrice")
const sliderSBL = document.getElementById("sblFraction")
const sliderValue = document.getElementById("homePriceValue")
const sblValue = document.getElementById("sblFractionValue")
const monthlyBreakout = document.getElementById("monthlyBreakout")

let portfolioChart

function calculate() {
    const homePrice = Number(sliderHome.value)
    const portfolioEvent = Number(document.getElementById("portfolioValue").value)
    const growth = Number(document.getElementById("growthRate").value) / 100
    const sblRate = Number(document.getElementById("sblRate").value) / 100
    const mortgageRate = Number(document.getElementById("mortgageRate").value) / 100
    const propertyTaxRate = Number(document.getElementById("propertyTaxRate").value) / 100
    const sblFraction = Number(sliderSBL.value) / 100
    const income = Number(document.getElementById("income").value)
    const effectiveTaxRate = Number(document.getElementById("effectiveTaxRate").value) / 100

    // --- Loan Breakdown ---
    const SBL = homePrice * sblFraction
    const mortgage = homePrice - SBL
    const mortgageTermMonths = 30 * 12

    // Monthly mortgage calculation
    const monthlyPI = mortgage * (mortgageRate / 12) / (1 - Math.pow(1 + mortgageRate / 12, -mortgageTermMonths))
    const monthlyInterest = mortgage * mortgageRate / 12
    const monthlyPrincipal = monthlyPI - monthlyInterest
    const monthlyTax = homePrice * propertyTaxRate / 12
    const monthlyTotal = monthlyPI + monthlyTax

    // Annualized
    const annualPrincipal = monthlyPrincipal * 12
    const annualInterest = monthlyInterest * 12
    const annualTax = monthlyTax * 12
    const incomeAfterTax = income * (1 - effectiveTaxRate)

    // Percent of income
    const pctPrincipal = (annualPrincipal / incomeAfterTax) * 100
    const pctInterest = (annualInterest / incomeAfterTax) * 100
    const pctTax = (annualTax / incomeAfterTax) * 100
    const pctTotal = pctPrincipal + pctInterest + pctTax

    // Display table
    monthlyBreakout.innerHTML = `
        <tr><th>Mortgage Amount</th><td>$${mortgage.toLocaleString()}</td></tr>
        <tr><th>Monthly Principal & Interest</th><td>$${monthlyPI.toFixed(0)}</td></tr>
        <tr><th>Monthly Property Tax</th><td>$${monthlyTax.toFixed(0)}</td></tr>
        <tr><th>Total Monthly Payment</th><td>$${monthlyTotal.toFixed(0)}</td></tr>
        <tr><th>% of After-Tax Income to Principal</th><td>${pctPrincipal.toFixed(1)}%</td></tr>
        <tr><th>% of After-Tax Income to Interest</th><td>${pctInterest.toFixed(1)}%</td></tr>
        <tr><th>% of After-Tax Income to Property Tax</th><td>${pctTax.toFixed(1)}%</td></tr>
        <tr><th><b>Total % of After-Tax Income</b></th><td><b>${pctTotal.toFixed(1)}%</b></td></tr
    `

    // --- Portfolio Chart Calculation ---
    const labels = []
    const baseline = []
    const withSBL = []
    const netWorth = []

    let pBase = portfolioEvent
    let pSBL = portfolioEvent
    const preBase = []
    const preSBL = []

    for (let i = 0; i < 5; i++) {
        pBase /= (1 + growth)
        pSBL /= (1 + growth)
        preBase.unshift(pBase)
        preSBL.unshift(pSBL)
    }

    for (let i = -5; i < 0; i++) {
        labels.push(i)
        baseline.push(preBase[i + 5])
        withSBL.push(preSBL[i + 5])
        netWorth.push(preSBL[i + 5])
    }

    labels.push(0)
    baseline.push(portfolioEvent)
    withSBL.push(portfolioEvent)
    netWorth.push(portfolioEvent + homePrice)

    let base = portfolioEvent
    let sblPortfolio = portfolioEvent
    const sblInterestAnnual = SBL * sblRate

    for (let year = 1; year <= 5; year++) {
        base *= (1 + growth)
        const growthAmount = sblPortfolio * growth
        const netGrowth = growthAmount - sblInterestAnnual
        sblPortfolio += netGrowth

        labels.push(year)
        baseline.push(base)
        withSBL.push(sblPortfolio)
        netWorth.push(sblPortfolio + homePrice - mortgage)
    }
   

    return { labels, baseline, withSBL, netWorth }
}

function renderPortfolioChart() {
    sliderValue.innerText = Number(sliderHome.value).toLocaleString()
    sblValue.innerText = Number(sliderSBL.value)

    const result = calculate()
    const ctx = document.getElementById("chart")
    if (portfolioChart) portfolioChart.destroy()

    portfolioChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: result.labels,
            datasets: [
                { label: 'Portfolio Baseline', data: result.baseline, borderWidth: 3 },
                { label: 'Portfolio w/ SBL', data: result.withSBL, borderWidth: 3 },
                { label: 'Net Worth (Portfolio + Home - Mortgage)', data: result.netWorth, borderWidth: 3 }
            ]
        },
        options: {
            responsive: true,
            plugins: { legend: { labels: { color: 'white' } } },
            scales: { x: { ticks: { color: 'white' } }, y: { ticks: { color: 'white' } } }
        }
    })
}

// Event listeners
document.querySelectorAll("input").forEach(el => el.addEventListener('input', renderPortfolioChart))

// Initial render
renderPortfolioChart()