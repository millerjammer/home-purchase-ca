import 'bootstrap/dist/css/bootstrap.min.css'
import './dark.css'
import { Chart } from 'chart.js/auto'

const sliderHome = document.getElementById("homePrice")
const sliderSBL = document.getElementById("sblFraction")
const sliderValue = document.getElementById("homePriceValue")
const downPaymentSlider = document.getElementById("downPayment")
const downPaymentValue = document.getElementById("downPaymentValue")
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
    const downPayment = Number(downPaymentSlider.value)

    // 1. Amount to finance after downpayment
    const financedAmount = Math.max(0, homePrice - downPayment)

    // 2. SBL is percentage of portfolio applied, capped at financed amount
    let SBL = portfolioEvent * sblFraction
    if (SBL > financedAmount) SBL = financedAmount

    // 3. Mortgage is remainder
    const mortgage = Math.max(0, financedAmount - SBL)
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
    // --- Portfolio Chart Calculation (monthly) ---
    const labels = []
    const baseline = []
    const withSBL = []
    const netWorth = []

    // --- Pre-event 60 months reverse compound ---
    let pBase = portfolioEvent
    let pSBL = portfolioEvent
    const preBase = []
    const preSBL = []

    for (let i = 0; i < 60; i++) {
        pBase /= Math.pow(1 + growth, 1 / 12)  // monthly reverse compound
        pSBL /= Math.pow(1 + growth, 1 / 12)
        preBase.unshift(pBase)
        preSBL.unshift(pSBL)
    }

    for (let i = -60; i < 0; i++) {
        labels.push(i)
        baseline.push(preBase[i + 60])
        withSBL.push(preSBL[i + 60])
        netWorth.push(preSBL[i + 60])
    }

    // --- Event month ---
    labels.push(0)
    // Net worth at the event includes: portfolio minus SBL minus downpayment plus home value
    const netWorthAtEvent = portfolioEvent - SBL - downPayment + homePrice
    baseline.push(portfolioEvent)
    withSBL.push(portfolioEvent)
    netWorth.push(netWorthAtEvent)

    // --- Post-event 60 months ---
    let base = portfolioEvent   // initialize baseline portfolio at event
    let sblPortfolio = portfolioEvent
    const sblInterestMonthly = (SBL * sblRate) / 12

    for (let month = 1; month <= 60; month++) {
        const growthAmount = sblPortfolio * Math.pow(1 + growth, 1 / 12) - sblPortfolio
        const netGrowth = growthAmount - sblInterestMonthly
        sblPortfolio += netGrowth

        const baseGrowth = base * Math.pow(1 + growth, 1 / 12)
        base = baseGrowth

        labels.push(month)
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
                { label: 'Net Worth (Portfolio + Home Equity - Mortgage)', data: result.netWorth, borderWidth: 3 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: 'white' } } },
            scales: { x: { ticks: { color: 'white' } }, y: { ticks: { color: 'white' } } }
        }
    })
}

///
/// Below ensures listeners are added after the page loads in both standalone and embedded contexts. In the embedded context, the initCalculator function is called from the parent project and listeners are added at that time. In the standalone context, we add listeners on DOMContentLoaded.

export function initCalculator(container) {
    // This is needed so we can use it in another project and need to render into an existing container div
    container.innerHTML = `<div id="calculatorApp"></div>`;
    renderPortfolioChart();
    addEventListeners(container);
}

export function addEventListeners(container) {

    // scope inputs to calculator only
    container.querySelectorAll("input").forEach(el => el.addEventListener("input", renderPortfolioChart));

    const downPaymentSlider = container.querySelector("#downPaymentSlider");
    const downPaymentValue = container.querySelector("#downPaymentValue");

    if (downPaymentSlider && downPaymentValue) {
        downPaymentSlider.addEventListener("input", () => {
            downPaymentValue.innerText =
                Number(downPaymentSlider.value).toLocaleString();

            renderPortfolioChart();
        });
    }
}

// Add event listeners and render chart on page load
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        addEventListeners(document);
        renderPortfolioChart();
    });
} else {
    addEventListeners(document);
    renderPortfolioChart();
}
