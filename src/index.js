import 'bootstrap/dist/css/bootstrap.min.css'

import Chart from 'chart.js/auto'

const SALT_LIMIT = 10000
const PROPERTY_TAX_CA = 0.0125
const SBL_LTV = 0.5
const YEARS = 30

let chart

function inputs() {

    return {

        homePrice: Number(document.getElementById("homePrice").value),

        securities: Number(document.getElementById("securitiesValue").value),

        growth: Number(document.getElementById("securitiesGrowth").value) / 100,

        mortgageRate: Number(document.getElementById("mortgageRate").value) / 100,

        income: Number(document.getElementById("income").value),

        incomePercent: Number(document.getElementById("incomePercent").value) / 100

    }

}

function mortgagePayment(principal, rate, years) {

    let r = rate / 12
    let n = years * 12

    return principal * (r * (1 + r) ** n) / ((1 + r) ** n - 1)

}

function simulateGrowth(start, growth) {

    let v = start
    let data = []

    for (let i = 0; i < 30; i++) {

        v = v * (1 + growth)
        data.push(v)

    }

    return data

}

function updateChart(p) {

    let before = simulateGrowth(p.securities, p.growth)

    let after = simulateGrowth(p.securities, p.growth)

    if (chart) chart.destroy()

    chart = new Chart(

        document.getElementById("securitiesChart"),

        {

            type: "line",

            data: {

                labels: Array.from({ length: 30 }, (_, i) => i + 1),

                datasets: [
                    {
                        label: "Securities (No Purchase)",
                        data: before
                    },
                    {
                        label: "Securities (With SBL)",
                        data: after
                    }
                ]

            },

            options: {
                responsive: true
            }

        }

    )

}

function calculate() {

    let p = inputs()

    document.getElementById("incomePercentLabel").innerText =
        document.getElementById("incomePercent").value + "%"

    let propertyTax = p.homePrice * PROPERTY_TAX_CA

    let sbl = Math.min(p.securities * SBL_LTV, p.homePrice * 0.2)

    let mortgage = p.homePrice - sbl

    let payment = mortgagePayment(mortgage, p.mortgageRate, YEARS)

    let deductible = Math.min(propertyTax, SALT_LIMIT)

    document.getElementById("sblAmount").innerText =
        "SBL Loan: $" + Math.round(sbl).toLocaleString()

    document.getElementById("mortgageAmount").innerText =
        "Mortgage: $" + Math.round(mortgage).toLocaleString()

    document.getElementById("monthlyPayment").innerText =
        "Monthly Payment: $" + Math.round(payment).toLocaleString()

    document.getElementById("taxDeduction").innerText =
        "Deductible Tax (SALT): $" + Math.round(deductible).toLocaleString()

    updateChart(p)

}

function bind() {

    document.querySelectorAll("input").forEach(el => {
        el.addEventListener("input", calculate)
    })

    const slider = document.getElementById("homePriceSlider")
    const box = document.getElementById("homePrice")

    slider.addEventListener("input", () => {
        box.value = slider.value
        calculate()
    })

    box.addEventListener("input", () => {
        slider.value = box.value
    })

}

bind()
calculate()