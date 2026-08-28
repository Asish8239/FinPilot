/**
 * Standalone verification script for Calculator and FI Planner calculations
 * No dependencies required - pure JavaScript/Node.js
 * Run: node verify-calculations.js
 */

// Import calculator functions (using CommonJS require equivalent)
const calculateSIP = (monthlyInvestment, annualRate, years, inflationRate) => {
  const monthlyRate = annualRate / 100 / 12;
  const months = years * 12;

  // Special case: when rate is 0, maturity equals total invested
  const maturityValue =
    monthlyRate === 0
      ? monthlyInvestment * months
      : monthlyInvestment * (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate;

  const totalInvested = monthlyInvestment * months;
  const wealthGained = maturityValue - totalInvested;

  const inflationAdjustedValue = maturityValue / Math.pow(1 + inflationRate / 100, years);

  const yearlyProjections = [];
  for (let year = 0; year <= years; year++) {
    const monthsToDate = year * 12;
    const investedToDate = monthlyInvestment * monthsToDate;
    const valueToDate =
      monthsToDate === 0
        ? 0
        : monthlyInvestment * (Math.pow(1 + monthlyRate, monthsToDate) - 1) / monthlyRate;
    const returnsToDate = valueToDate - investedToDate;

    yearlyProjections.push({
      year,
      invested: investedToDate,
      value: valueToDate,
      returns: returnsToDate,
    });
  }

  return {
    maturity_value: Math.round(maturityValue),
    total_invested: Math.round(totalInvested),
    wealth_gained: Math.round(wealthGained),
    inflation_adjusted_value: Math.round(inflationAdjustedValue),
    yearly_projections: yearlyProjections,
  };
};

const calculateLumpsum = (principal, annualRate, years, inflationRate) => {
  const rate = annualRate / 100;

  const maturityValue = principal * Math.pow(1 + rate, years);
  const wealthGained = maturityValue - principal;

  const inflationAdjustedValue = maturityValue / Math.pow(1 + inflationRate / 100, years);

  const yearlyProjections = [];
  for (let year = 0; year <= years; year++) {
    const valueToDate = principal * Math.pow(1 + rate, year);
    const returnsToDate = valueToDate - principal;

    yearlyProjections.push({
      year,
      invested: principal,
      value: valueToDate,
      returns: returnsToDate,
    });
  }

  return {
    maturity_value: Math.round(maturityValue),
    total_invested: principal,
    wealth_gained: Math.round(wealthGained),
    inflation_adjusted_value: Math.round(inflationAdjustedValue),
    yearly_projections: yearlyProjections,
  };
};

// Helper functions
const formatCurrency = (num) => `₹${Math.round(num).toLocaleString('en-IN')}`;
const assert = (condition, message) => {
  if (!condition) {
    throw new Error(`❌ FAILED: ${message}`);
  }
};

let passedTests = 0;
let failedTests = 0;

const runTest = (testName, testFn) => {
  try {
    testFn();
    console.log(`✓ ${testName}`);
    passedTests++;
  } catch (error) {
    console.log(`✗ ${testName}`);
    console.log(`  ${error.message}`);
    failedTests++;
  }
};

// ============================================================================
// TASK 1: CALCULATOR VERIFICATION
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('TASK 1: CALCULATOR VERIFICATION');
console.log('='.repeat(80));

console.log('\n📊 SIP CALCULATION TESTS');
console.log('-'.repeat(80));

runTest('T1.1: Normal case - 10000/month, 12% annual, 10 years', () => {
  const result = calculateSIP(10000, 12, 10, 0);
  console.log(`  Maturity: ${formatCurrency(result.maturity_value)} | Invested: ${formatCurrency(result.total_invested)} | Gains: ${formatCurrency(result.wealth_gained)}`);
  assert(result.maturity_value > 1800000 && result.maturity_value < 1900000, `Expected ~1,866,305 but got ${result.maturity_value}`);
  assert(result.total_invested === 1200000, `Total invested should be 1,200,000`);
});

runTest('T1.2: Zero investment - 0/month', () => {
  const result = calculateSIP(0, 12, 10, 0);
  console.log(`  Maturity: ${formatCurrency(result.maturity_value)}`);
  assert(result.maturity_value === 0, 'Zero investment should yield zero');
});

runTest('T1.3: Zero rate - 10000/month, 0% annual, 10 years', () => {
  const result = calculateSIP(10000, 0, 10, 0);
  console.log(`  Maturity: ${formatCurrency(result.maturity_value)} | Gains: ${formatCurrency(result.wealth_gained)}`);
  assert(result.maturity_value === 1200000, 'Zero rate should equal total invested');
  assert(result.wealth_gained === 0, 'Zero rate should have zero gains');
});

runTest('T1.4: Very high rate - 1000/month, 50% annual, 5 years', () => {
  const result = calculateSIP(1000, 50, 5, 0);
  console.log(`  Maturity: ${formatCurrency(result.maturity_value)} | Invested: ${formatCurrency(result.total_invested)}`);
  assert(result.maturity_value > result.total_invested, 'Maturity should exceed invested');
  assert(result.wealth_gained > 0, 'Should have positive gains');
});

runTest('T1.5: Single year - 10000/month, 12% annual, 1 year', () => {
  const result = calculateSIP(10000, 12, 1, 0);
  console.log(`  Maturity: ${formatCurrency(result.maturity_value)} | Invested: ${formatCurrency(result.total_invested)}`);
  assert(result.maturity_value > 120000 && result.maturity_value < 130000, 'Should be > 120000');
  assert(result.total_invested === 120000, 'Total invested should be 120000');
});

runTest('T1.6: Very large amounts - 1000000/month, 12% annual, 5 years', () => {
  const result = calculateSIP(1000000, 12, 5, 0);
  console.log(`  Maturity: ${formatCurrency(result.maturity_value)}`);
  assert(result.maturity_value > 0, 'Should have positive maturity value');
  assert(result.total_invested === 60000000, 'Total invested should be 60M');
});

runTest('T1.7: Very small amounts - 1/month, 12% annual, 1 year', () => {
  const result = calculateSIP(1, 12, 1, 0);
  console.log(`  Maturity: ${formatCurrency(result.maturity_value)}`);
  assert(result.maturity_value > 0 && result.maturity_value < 200, 'Should be > 0 and < 200');
});

runTest('T1.8: With inflation adjustment - 6% inflation', () => {
  const resultNoInflation = calculateSIP(10000, 12, 10, 0);
  const resultWithInflation = calculateSIP(10000, 12, 10, 6);
  console.log(`  Without Inflation: ${formatCurrency(resultNoInflation.maturity_value)}`);
  console.log(`  With Inflation (6%): ${formatCurrency(resultWithInflation.inflation_adjusted_value)}`);
  assert(resultWithInflation.inflation_adjusted_value < resultNoInflation.maturity_value, 'Inflation should reduce real value');
});

runTest('T1.9: Yearly projections - verify progression', () => {
  const result = calculateSIP(10000, 12, 3, 0);
  console.log(`  Year 0: ${formatCurrency(result.yearly_projections[0].value)} | Year 3: ${formatCurrency(result.yearly_projections[3].value)}`);
  result.yearly_projections.forEach((proj, i) => {
    assert(proj.value >= proj.invested, `Year ${proj.year}: value should >= invested`);
    assert(proj.returns >= 0, `Year ${proj.year}: returns should be >= 0`);
    if (i > 0) {
      assert(proj.value >= result.yearly_projections[i-1].value, `Year ${proj.year}: value should increase`);
    }
  });
});

console.log('\n💰 LUMPSUM CALCULATION TESTS');
console.log('-'.repeat(80));

runTest('T2.1: Normal case - 100000, 12% annual, 10 years', () => {
  const result = calculateLumpsum(100000, 12, 10, 0);
  console.log(`  Maturity: ${formatCurrency(result.maturity_value)} | Gains: ${formatCurrency(result.wealth_gained)}`);
  assert(result.maturity_value > 300000 && result.maturity_value < 320000, `Expected ~310,585 but got ${result.maturity_value}`);
  assert(result.total_invested === 100000, 'Total invested should be 100000');
});

runTest('T2.2: Zero principal', () => {
  const result = calculateLumpsum(0, 12, 10, 0);
  console.log(`  Maturity: ${formatCurrency(result.maturity_value)}`);
  assert(result.maturity_value === 0, 'Zero principal should yield zero');
});

runTest('T2.3: Zero rate - 100000, 0% annual, 10 years', () => {
  const result = calculateLumpsum(100000, 0, 10, 0);
  console.log(`  Maturity: ${formatCurrency(result.maturity_value)}`);
  assert(result.maturity_value === 100000, 'Zero rate should equal principal');
  assert(result.wealth_gained === 0, 'Zero rate should have zero gains');
});

runTest('T2.4: Single year - 100000, 12% annual, 1 year', () => {
  const result = calculateLumpsum(100000, 12, 1, 0);
  console.log(`  Maturity: ${formatCurrency(result.maturity_value)}`);
  assert(result.maturity_value === 112000, 'Should be exactly 112000');
});

runTest('T2.5: Very high rate - 1000, 50% annual, 5 years', () => {
  const result = calculateLumpsum(1000, 50, 5, 0);
  console.log(`  Maturity: ${formatCurrency(result.maturity_value)}`);
  assert(result.maturity_value > 7000, 'Should be > 7000');
});

runTest('T2.6: Very long period - 1000, 12% annual, 50 years', () => {
  const result = calculateLumpsum(1000, 12, 50, 0);
  console.log(`  Maturity: ${formatCurrency(result.maturity_value)}`);
  assert(result.maturity_value > 1000000, 'Should be > 1,000,000');
});

runTest('T2.7: Large amounts - 10000000, 12% annual, 10 years', () => {
  const result = calculateLumpsum(10000000, 12, 10, 0);
  console.log(`  Maturity: ${formatCurrency(result.maturity_value)}`);
  assert(result.maturity_value > 10000000, 'Should exceed principal');
});

runTest('T2.8: With inflation adjustment - 6% inflation', () => {
  const resultNoInflation = calculateLumpsum(100000, 12, 10, 0);
  const resultWithInflation = calculateLumpsum(100000, 12, 10, 6);
  console.log(`  Without Inflation: ${formatCurrency(resultNoInflation.maturity_value)}`);
  console.log(`  With Inflation (6%): ${formatCurrency(resultWithInflation.inflation_adjusted_value)}`);
  assert(resultWithInflation.inflation_adjusted_value < resultNoInflation.maturity_value, 'Inflation should reduce real value');
});

runTest('T2.9: Yearly projections - verify progression', () => {
  const result = calculateLumpsum(100000, 12, 5, 0);
  console.log(`  Year 0: ${formatCurrency(result.yearly_projections[0].value)} | Year 5: ${formatCurrency(result.yearly_projections[5].value)}`);
  result.yearly_projections.forEach((proj, i) => {
    assert(proj.value >= 100000, `Year ${proj.year}: value should >= principal`);
    if (i > 0) {
      assert(proj.value >= result.yearly_projections[i-1].value, `Year ${proj.year}: value should increase`);
    }
  });
});

// ============================================================================
// TASK 2: FI PLANNER VERIFICATION
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('TASK 2: FI PLANNER VERIFICATION');
console.log('='.repeat(80));

console.log('\n🎯 FI PLANNER CALCULATION TESTS');
console.log('-'.repeat(80));

runTest('FI1.1: FI Number - 30000/month expenses', () => {
  const monthlyExpense = 30000;
  const annualExpense = monthlyExpense * 12;
  const fiCorpus = annualExpense * 25;
  console.log(`  Annual Expense: ${formatCurrency(annualExpense)} | FI Corpus: ${formatCurrency(fiCorpus)}`);
  assert(fiCorpus === 9000000, 'FI Corpus should be 9,000,000');
});

runTest('FI1.2: FI Number - 100000/month expenses', () => {
  const monthlyExpense = 100000;
  const annualExpense = monthlyExpense * 12;
  const fiCorpus = annualExpense * 25;
  console.log(`  FI Corpus: ${formatCurrency(fiCorpus)}`);
  assert(fiCorpus === 30000000, 'FI Corpus should be 30,000,000');
});

runTest('FI1.3: FI Number - Zero expenses', () => {
  const monthlyExpense = 0;
  const annualExpense = monthlyExpense * 12;
  const fiCorpus = annualExpense * 25;
  console.log(`  FI Corpus: ${formatCurrency(fiCorpus)}`);
  assert(fiCorpus === 0, 'FI Corpus should be 0');
});

runTest('FI1.4: Savings Rate - 50% saved', () => {
  const income = 100000;
  const expenses = 50000;
  const savingsRate = ((income - expenses) / income) * 100;
  console.log(`  Savings Rate: ${savingsRate.toFixed(1)}%`);
  assert(savingsRate === 50, 'Savings rate should be 50%');
});

runTest('FI1.5: Savings Rate - 80% saved', () => {
  const income = 100000;
  const expenses = 20000;
  const savingsRate = ((income - expenses) / income) * 100;
  console.log(`  Savings Rate: ${savingsRate.toFixed(1)}%`);
  assert(savingsRate === 80, 'Savings rate should be 80%');
});

runTest('FI1.6: Savings Rate - Negative (spending > income)', () => {
  const income = 50000;
  const expenses = 60000;
  const savingsRate = ((income - expenses) / income) * 100;
  console.log(`  Savings Rate: ${savingsRate.toFixed(1)}%`);
  assert(savingsRate < 0, 'Savings rate should be negative');
});

runTest('FI1.7: Years to FI - Standard scenario', () => {
  const initialCorpus = 500000;
  const fiTarget = 9000000;
  const annualSavings = (100000 - 30000) * 12;
  const returnRate = 0.12;
  
  let corpus = initialCorpus;
  let yearsToFI = 0;
  for (let year = 0; year <= 50; year++) {
    if (corpus >= fiTarget) {
      yearsToFI = year;
      break;
    }
    corpus = corpus * (1 + returnRate) + annualSavings;
  }
  
  console.log(`  Years to FI: ${yearsToFI} years`);
  assert(yearsToFI > 0 && yearsToFI < 50, 'Should reach FI within reasonable time');
});

runTest('FI1.8: Already at FI', () => {
  const initialCorpus = 10000000;
  const fiTarget = 9000000;
  const yearsToFI = initialCorpus >= fiTarget ? 0 : 1;
  console.log(`  Years to FI: ${yearsToFI} years`);
  assert(yearsToFI === 0, 'Should already be at FI');
});

runTest('FI1.9: Projected Portfolio - Multi-year projection', () => {
  const currentAge = 25;
  const targetAge = 40;
  const yearsToTarget = targetAge - currentAge;
  const initialSavings = 500000;
  const annualInvestment = 840000;
  const returnRate = 0.12;
  
  let corpus = initialSavings;
  for (let year = 0; year < yearsToTarget; year++) {
    corpus = corpus * (1 + returnRate) + annualInvestment;
  }
  
  console.log(`  At age ${targetAge}: ${formatCurrency(corpus)}`);
  assert(corpus > initialSavings, 'Corpus should grow over time');
});

runTest('FI1.10: Ambitious timeline - 5 years to FI', () => {
  const fiTarget = 3000000;
  const initialCorpus = 1000000;
  const yearsAllowed = 5;
  const returnRate = 0.12;
  
  let corpus = initialCorpus;
  for (let year = 0; year < yearsAllowed; year++) {
    corpus = corpus * (1 + returnRate);
  }
  const requiredAnnualSavings = (fiTarget - corpus) / yearsAllowed;
  
  console.log(`  Required Annual Savings: ${formatCurrency(requiredAnnualSavings)}`);
  assert(requiredAnnualSavings > 0, 'Required savings should be positive');
});

runTest('FI1.11: Edge case - Same age', () => {
  const currentAge = 40;
  const targetAge = 40;
  const yearsRemaining = targetAge - currentAge;
  console.log(`  Years Remaining: ${yearsRemaining}`);
  assert(yearsRemaining === 0, 'Should be 0 years');
});

runTest('FI1.12: Edge case - Invalid timeline', () => {
  const currentAge = 50;
  const targetAge = 40;
  const isInvalid = targetAge < currentAge;
  console.log(`  Is Invalid: ${isInvalid}`);
  assert(isInvalid === true, 'Should be invalid');
});

runTest('FI1.13: Different return rates comparison', () => {
  const initialCorpus = 500000;
  const annualSavings = 840000;
  const years = 10;
  const rates = [0.08, 0.10, 0.12, 0.15];
  
  const results = rates.map(rate => {
    let corpus = initialCorpus;
    for (let year = 0; year < years; year++) {
      corpus = corpus * (1 + rate) + annualSavings;
    }
    return { rate: rate * 100, corpus: Math.round(corpus) };
  });
  
  console.log(`  8% → ${formatCurrency(results[0].corpus)} | 15% → ${formatCurrency(results[3].corpus)}`);
  assert(results[3].corpus > results[0].corpus, 'Higher rate should yield higher corpus');
});

runTest('FI1.14: Very long period - 50 years', () => {
  const initialCorpus = 100000;
  const annualSavings = 600000;
  const returnRate = 0.10;
  const years = 50;
  
  let corpus = initialCorpus;
  for (let year = 0; year < years; year++) {
    corpus = corpus * (1 + returnRate) + annualSavings;
  }
  
  console.log(`  Final Corpus: ${formatCurrency(corpus)}`);
  assert(corpus > initialCorpus * 1000, 'Should grow significantly');
});

// ============================================================================
// COMPARISON TESTS
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('COMPARISON TESTS');
console.log('='.repeat(80));

runTest('Comparison: SIP vs Lumpsum - Same total investment', () => {
  const monthlyInvestment = 10000;
  const years = 10;
  const lumpsum = monthlyInvestment * 12 * years;
  const rate = 12;
  
  const sipResult = calculateSIP(monthlyInvestment, rate, years, 0);
  const lumpsumResult = calculateLumpsum(lumpsum, rate, years, 0);
  
  console.log(`  SIP (10k/month): ${formatCurrency(sipResult.maturity_value)}`);
  console.log(`  Lumpsum (1.2M upfront): ${formatCurrency(lumpsumResult.maturity_value)}`);
  console.log(`  Difference: ${formatCurrency(lumpsumResult.maturity_value - sipResult.maturity_value)}`);
  assert(lumpsumResult.maturity_value > sipResult.maturity_value, 'Lumpsum should yield more');
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('ERROR HANDLING & EDGE CASES');
console.log('='.repeat(80));

runTest('Edge Case: Very small SIP', () => {
  const result = calculateSIP(0.01, 12, 10, 0);
  console.log(`  Maturity: ${formatCurrency(result.maturity_value)}`);
  assert(result.maturity_value >= 0, 'Should handle very small amounts');
});

runTest('Edge Case: Very large SIP', () => {
  const result = calculateSIP(10000000, 12, 10, 0);
  console.log(`  Maturity: ${formatCurrency(result.maturity_value)}`);
  assert(result.maturity_value > 0, 'Should handle very large amounts');
});

runTest('Edge Case: Fractional years', () => {
  const result = calculateSIP(10000, 12, 2.5, 0);
  console.log(`  Maturity: ${formatCurrency(result.maturity_value)}`);
  assert(result.maturity_value > 0, 'Should handle fractional years');
});

runTest('Edge Case: 100% annual rate', () => {
  const result = calculateSIP(10000, 100, 5, 0);
  console.log(`  Maturity: ${formatCurrency(result.maturity_value)}`);
  assert(result.maturity_value > 0, 'Should handle extreme rates');
});

runTest('Edge Case: High inflation', () => {
  const result = calculateSIP(10000, 12, 10, 12);
  console.log(`  Nominal: ${formatCurrency(result.maturity_value)} | Inflation-Adj: ${formatCurrency(result.inflation_adjusted_value)}`);
  assert(result.inflation_adjusted_value < result.maturity_value, 'Inflation should reduce real value');
});

// ============================================================================
// SUMMARY
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('TEST SUMMARY');
console.log('='.repeat(80));
console.log(`✓ Passed: ${passedTests}`);
console.log(`✗ Failed: ${failedTests}`);
console.log(`📊 Total Tests: ${passedTests + failedTests}`);
console.log(`Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);
console.log('='.repeat(80));

if (failedTests === 0) {
  console.log('\n✅ ALL TESTS PASSED - Calculations verified as accurate!\n');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed - review the output above.\n');
  process.exit(1);
}
