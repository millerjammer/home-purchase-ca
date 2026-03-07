// src/finance.js

// Monthly mortgage payment (P+I)
export function mortgagePayment(principal, rate, years){
    const r = rate/100/12;
    const n = years*12;
    return principal*(r*Math.pow(1+r,n))/(Math.pow(1+r,n)-1);
}

// CA Prop 19 monthly property tax
export function prop19Tax(oldHomePrice, oldTaxBase, newHomePrice){
    const transferable = oldHomePrice + 1000000;
    const taxable = Math.max(0, newHomePrice - transferable);
    const base = oldTaxBase + taxable*0.011; // 1.1% CA
    return base/12;
}

// Securities-backed loan monthly cost (interest only)
export function securitiesLoanCost(amount, rate){
    return amount * rate/100/12;
}

// Total monthly housing cost = mortgage + property tax + SBL interest
export function monthlyHousingCost(mortgage, mortgageRate, years, newHomePrice, oldHomePrice, oldTaxBase, sblAmount, sblRate){
    const mp = mortgagePayment(mortgage, mortgageRate, years);
    const tax = prop19Tax(oldHomePrice, oldTaxBase, newHomePrice);
    const sblCost = securitiesLoanCost(sblAmount, sblRate);
    return mp + tax + sblCost;
}

// Portfolio growth (SBL is collateral, portfolio unchanged)
export function portfolioGrowth(securities, growthRate, years){
    return securities * Math.pow(1 + growthRate/100, years);
}

// Arbitrage: pre/post purchase portfolio (SBL collateral, so unchanged)
export function arbitragePortfolio(securities, growthRate, years){
    const pre = portfolioGrowth(securities, growthRate, years);
    const post = pre; // portfolio unchanged
    return { pre, post };
}