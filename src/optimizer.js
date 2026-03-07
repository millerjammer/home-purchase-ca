// src/optimizer.js
import { monthlyHousingCost } from './finance.js';

// Binary search to find optimal mortgage vs SBL split
export function optimizeMortgage(inputs){
    let low = 0;
    let high = inputs.price*0.8; // max 80% mortgage
    let bestMortgage = 0;
    let bestSBL = 0;

    for(let i=0;i<50;i++){
        const mid = (low + high)/2;
        const mortgage = mid;
        const sbl = inputs.price - mortgage;

        const monthly = monthlyHousingCost(
            mortgage,
            inputs.mortgageRate,
            30,
            inputs.price,
            inputs.oldHomePrice,
            inputs.oldHomePrice*0.011,
            sbl,
            inputs.sblRate
        );

        if(monthly > (inputs.income/12)*(inputs.targetPct/100)){
            high = mid;
        } else {
            bestMortgage = mortgage;
            bestSBL = sbl;
            low = mid;
        }

        if(high-low < 1) break;
    }

    return { mortgage: bestMortgage, sbl: bestSBL };
}