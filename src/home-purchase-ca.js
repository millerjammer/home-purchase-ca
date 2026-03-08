import 'bootstrap/dist/css/bootstrap.min.css'
import './dark.css'
import { Chart } from 'chart.js/auto'

let portfolioChart = null;

// --- Core calculation function ---
function calculate(container) {
    const sliderHome = container.querySelector("#homePrice");
    const sliderSBL = container.querySelector("#sblFraction");
    const sliderValue = container.querySelector("#homePriceValue");
    const downPaymentSlider = container.querySelector("#downPayment");
    const downPaymentValue = container.querySelector("#downPaymentValue");
    const sblValue = container.querySelector("#sblFractionValue");
    const monthlyBreakout = container.querySelector("#monthlyBreakout");

    const homePrice = Number(sliderHome.value);
    const portfolioEvent = Number(container.querySelector("#portfolioValue").value);
    const growth = Number(container.querySelector("#growthRate").value) / 100;
    const sblRate = Number(container.querySelector("#sblRate").value) / 100;
    const mortgageRate = Number(container.querySelector("#mortgageRate").value) / 100;
    const propertyTaxRate = Number(container.querySelector("#propertyTaxRate").value) / 100;
    const sblFraction = Number(sliderSBL.value) / 100;
    const income = Number(container.querySelector("#income").value);
    const effectiveTaxRate = Number(container.querySelector("#effectiveTaxRate").value) / 100;

    const downPayment = Number(downPaymentSlider.value);

    const financedAmount = Math.max(0, homePrice - downPayment);

    let SBL = portfolioEvent * sblFraction;
    if (SBL > financedAmount) SBL = financedAmount;

    const mortgage = Math.max(0, financedAmount - SBL);
    const mortgageTermMonths = 30 * 12;
    const monthlyPI = mortgage * (mortgageRate / 12) / (1 - Math.pow(1 + mortgageRate / 12, -mortgageTermMonths));
    const monthlyInterest = mortgage * mortgageRate / 12;
    const monthlyPrincipal = monthlyPI - monthlyInterest;
    const monthlyTax = homePrice * propertyTaxRate / 12;
    const monthlyTotal = monthlyPI + monthlyTax;

    const annualPrincipal = monthlyPrincipal * 12;
    const annualInterest = monthlyInterest * 12;
    const annualTax = monthlyTax * 12;
    const incomeAfterTax = income * (1 - effectiveTaxRate);

    const pctPrincipal = (annualPrincipal / incomeAfterTax) * 100;
    const pctInterest = (annualInterest / incomeAfterTax) * 100;
    const pctTax = (annualTax / incomeAfterTax) * 100;
    const pctTotal = pctPrincipal + pctInterest + pctTax;

    monthlyBreakout.innerHTML = `
        <tr><th>Mortgage Amount</th><td>$${mortgage.toLocaleString()}</td></tr>
        <tr><th>Monthly Principal & Interest</th><td>$${monthlyPI.toFixed(0)}</td></tr>
        <tr><th>Monthly Property Tax</th><td>$${monthlyTax.toFixed(0)}</td></tr>
        <tr><th>Total Monthly Payment</th><td>$${monthlyTotal.toFixed(0)}</td></tr>
        <tr><th>% of After-Tax Income to Principal</th><td>${pctPrincipal.toFixed(1)}%</td></tr>
        <tr><th>% of After-Tax Income to Interest</th><td>${pctInterest.toFixed(1)}%</td></tr>
        <tr><th>% of After-Tax Income to Property Tax</th><td>${pctTax.toFixed(1)}%</td></tr>
        <tr><th><b>Total % of After-Tax Income</b></th><td><b>${pctTotal.toFixed(1)}%</b></td></tr>
    `;

    // --- Portfolio chart ---
    const labels = [];
    const baseline = [];
    const withSBL = [];
    const netWorth = [];

    let pBase = portfolioEvent;
    let pSBL = portfolioEvent;
    const preBase = [];
    const preSBL = [];

    for (let i = 0; i < 60; i++) {
        pBase /= Math.pow(1 + growth, 1 / 12);
        pSBL /= Math.pow(1 + growth, 1 / 12);
        preBase.unshift(pBase);
        preSBL.unshift(pSBL);
    }

    for (let i = -60; i < 0; i++) {
        labels.push(i);
        baseline.push(preBase[i + 60]);
        withSBL.push(preSBL[i + 60]);
        netWorth.push(preSBL[i + 60]);
    }

    labels.push(0);
    const netWorthAtEvent = portfolioEvent - SBL - downPayment + homePrice;
    baseline.push(portfolioEvent);
    withSBL.push(portfolioEvent);
    netWorth.push(netWorthAtEvent);

    let base = portfolioEvent;
    let sblPortfolio = portfolioEvent;
    const sblInterestMonthly = (SBL * sblRate) / 12;

    for (let month = 1; month <= 60; month++) {
        const growthAmount = sblPortfolio * Math.pow(1 + growth, 1 / 12) - sblPortfolio;
        const netGrowth = growthAmount - sblInterestMonthly;
        sblPortfolio += netGrowth;

        const baseGrowth = base * Math.pow(1 + growth, 1 / 12);
        base = baseGrowth;

        labels.push(month);
        baseline.push(base);
        withSBL.push(sblPortfolio);
        netWorth.push(sblPortfolio + homePrice - mortgage);
    }

    return { labels, baseline, withSBL, netWorth };
}

function renderPortfolioChart(container) {
    const sliderHome = container.querySelector("#homePrice");
    const sliderSBL = container.querySelector("#sblFraction");
    const sliderValue = container.querySelector("#homePriceValue");
    const sblValue = container.querySelector("#sblFractionValue");

    sliderValue.innerText = Number(sliderHome.value).toLocaleString();
    sblValue.innerText = Number(sliderSBL.value);

    const result = calculate(container);
    const ctx = container.querySelector("#chart");
    if (portfolioChart) portfolioChart.destroy();

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
    });
}

// --- Public API ---
export function initCalculator(container) {
    if (!container) return;
    renderPortfolioChart(container);
    addEventListeners(container);
}

export function addEventListeners(container) {
    if (!container) return;

    container.querySelectorAll("input").forEach(el =>
        el.addEventListener("input", () => renderPortfolioChart(container))
    );

    const downPaymentSlider = container.querySelector("#downPayment");
    const downPaymentValue = container.querySelector("#downPaymentValue");

    if (downPaymentSlider && downPaymentValue) {
        downPaymentSlider.addEventListener("input", () => {
            downPaymentValue.innerText = Number(downPaymentSlider.value).toLocaleString();
            renderPortfolioChart(container);
        });
    }
}

// --- Auto-init for standalone ---
if (document.getElementById("homePrice")) {
    document.addEventListener("DOMContentLoaded", () => {
        initCalculator(document);
    });
}