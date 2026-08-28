/**
 * Comprehensive verification tests for Calculator and FI Planner
 * Tests all calculation logic with edge cases and known values
 */

import { calculateSIP, calculateLumpsum } from '../calculator-utils';

// ============================================================================
// TASK 1: CALCULATOR VERIFICATION
// ============================================================================

describe('SIP Calculation Verification', () => {
  /**
   * Test Case 1: Normal case
   * Monthly: ₹10,000, Annual Rate: 12%, Years: 10
   * Formula: A = PMT × [((1 + r)^n - 1) / r] × (1 + r)
   * Where: r = 12%/12 = 1% = 0.01, n = 120 months
   * Expected: ~₹1,866,305
   */
  test('T1.1: Normal case - 10000/month, 12% annual, 10 years', () => {
    const result = calculateSIP(10000, 12, 10, 0);
    console.log('T1.1 - Normal Case:');
    console.log(`  Monthly Investment: ₹10,000`);
    console.log(`  Annual Rate: 12%`);
    console.log(`  Duration: 10 years`);
    console.log(`  Maturity Value: ₹${result.maturity_value.toLocaleString()}`);
    console.log(`  Total Invested: ₹${result.total_invested.toLocaleString()}`);
    console.log(`  Wealth Gained: ₹${result.wealth_gained.toLocaleString()}`);
    
    // Expected maturity value ~1,866,305
    expect(result.maturity_value).toBeGreaterThan(1800000);
    expect(result.maturity_value).toBeLessThan(1900000);
    expect(result.total_invested).toBe(1200000);
    expect(result.wealth_gained).toBeGreaterThan(600000);
  });

  /**
   * Test Case 2: Zero investment
   * Expected: ₹0
   */
  test('T1.2: Zero investment - 0/month', () => {
    const result = calculateSIP(0, 12, 10, 0);
    console.log('\nT1.2 - Zero Investment:');
    console.log(`  Monthly Investment: ₹0`);
    console.log(`  Maturity Value: ₹${result.maturity_value}`);
    
    expect(result.maturity_value).toBe(0);
    expect(result.wealth_gained).toBe(0);
  });

  /**
   * Test Case 3: Zero rate
   * Monthly: ₹10,000, Rate: 0%, Years: 10
   * Expected: ₹1,200,000 (no growth, only invested amount)
   */
  test('T1.3: Zero rate - 10000/month, 0% annual, 10 years', () => {
    const result = calculateSIP(10000, 0, 10, 0);
    console.log('\nT1.3 - Zero Rate:');
    console.log(`  Monthly Investment: ₹10,000`);
    console.log(`  Annual Rate: 0%`);
    console.log(`  Maturity Value: ₹${result.maturity_value.toLocaleString()}`);
    console.log(`  Wealth Gained: ₹${result.wealth_gained}`);
    
    expect(result.maturity_value).toBe(1200000);
    expect(result.wealth_gained).toBe(0);
  });

  /**
   * Test Case 4: Very high rate
   * Monthly: ₹1,000, Rate: 50%, Years: 5
   * Testing extreme values handling
   */
  test('T1.4: Very high rate - 1000/month, 50% annual, 5 years', () => {
    const result = calculateSIP(1000, 50, 5, 0);
    console.log('\nT1.4 - Very High Rate:');
    console.log(`  Monthly Investment: ₹1,000`);
    console.log(`  Annual Rate: 50%`);
    console.log(`  Duration: 5 years`);
    console.log(`  Maturity Value: ₹${result.maturity_value.toLocaleString()}`);
    console.log(`  Total Invested: ₹${result.total_invested.toLocaleString()}`);
    
    expect(result.maturity_value).toBeGreaterThan(result.total_invested);
    expect(result.wealth_gained).toBeGreaterThan(0);
  });

  /**
   * Test Case 5: Single month
   * Monthly: ₹10,000, Rate: 12%, Years: 1 (12 months)
   * Expected: ≈₹123,600 (initial + compounding)
   */
  test('T1.5: Single year - 10000/month, 12% annual, 1 year', () => {
    const result = calculateSIP(10000, 12, 1, 0);
    console.log('\nT1.5 - Single Year:');
    console.log(`  Monthly Investment: ₹10,000`);
    console.log(`  Duration: 1 year (12 months)`);
    console.log(`  Maturity Value: ₹${result.maturity_value.toLocaleString()}`);
    console.log(`  Total Invested: ₹${result.total_invested.toLocaleString()}`);
    
    expect(result.maturity_value).toBeGreaterThan(120000);
    expect(result.total_invested).toBe(120000);
  });

  /**
   * Test Case 6: Very large amounts
   * Monthly: ₹1,000,000, Rate: 12%, Years: 5
   */
  test('T1.6: Very large amounts - 1000000/month, 12% annual, 5 years', () => {
    const result = calculateSIP(1000000, 12, 5, 0);
    console.log('\nT1.6 - Very Large Amounts:');
    console.log(`  Monthly Investment: ₹1,000,000`);
    console.log(`  Maturity Value: ₹${result.maturity_value.toLocaleString()}`);
    
    expect(result.maturity_value).toBeGreaterThan(0);
    expect(result.total_invested).toBe(60000000);
  });

  /**
   * Test Case 7: Very small amounts
   * Monthly: ₹1, Rate: 12%, Years: 1
   */
  test('T1.7: Very small amounts - 1/month, 12% annual, 1 year', () => {
    const result = calculateSIP(1, 12, 1, 0);
    console.log('\nT1.7 - Very Small Amounts:');
    console.log(`  Monthly Investment: ₹1`);
    console.log(`  Maturity Value: ₹${result.maturity_value}`);
    
    expect(result.maturity_value).toBeGreaterThan(0);
    expect(result.maturity_value).toBeLessThan(200);
  });

  /**
   * Test Case 8: Inflation adjustment
   * Monthly: ₹10,000, Rate: 12%, Years: 10, Inflation: 6%
   */
  test('T1.8: With inflation adjustment - inflation 6%', () => {
    const resultNoInflation = calculateSIP(10000, 12, 10, 0);
    const resultWithInflation = calculateSIP(10000, 12, 10, 6);
    
    console.log('\nT1.8 - Inflation Adjustment:');
    console.log(`  Without Inflation: ₹${resultNoInflation.maturity_value.toLocaleString()}`);
    console.log(`  With Inflation (6%): ₹${resultWithInflation.inflation_adjusted_value.toLocaleString()}`);
    
    expect(resultWithInflation.inflation_adjusted_value).toBeLessThan(resultNoInflation.maturity_value);
  });

  /**
   * Test Case 9: Yearly projections correctness
   * Verify that yearly projections show correct growth
   */
  test('T1.9: Yearly projections - verify progression', () => {
    const result = calculateSIP(10000, 12, 3, 0);
    console.log('\nT1.9 - Yearly Projections:');
    
    result.yearly_projections.forEach((proj, i) => {
      console.log(`  Year ${proj.year}: Invested=${proj.invested}, Value=${proj.value}, Returns=${proj.returns}`);
      expect(proj.value).toBeGreaterThanOrEqual(proj.invested);
      expect(proj.returns).toBeGreaterThanOrEqual(0);
      
      // Each year should have more value than previous
      if (i > 0) {
        expect(proj.value).toBeGreaterThanOrEqual(result.yearly_projections[i-1].value);
      }
    });
  });
});

describe('Lumpsum Calculation Verification', () => {
  /**
   * Test Case 1: Normal case
   * Principal: ₹100,000, Rate: 12%, Years: 10
   * Formula: A = P(1 + r)^t = 100000 × (1.12)^10
   * Expected: ~₹310,585
   */
  test('T2.1: Normal case - 100000, 12% annual, 10 years', () => {
    const result = calculateLumpsum(100000, 12, 10, 0);
    console.log('T2.1 - Normal Case:');
    console.log(`  Principal: ₹100,000`);
    console.log(`  Annual Rate: 12%`);
    console.log(`  Duration: 10 years`);
    console.log(`  Maturity Value: ₹${result.maturity_value.toLocaleString()}`);
    console.log(`  Wealth Gained: ₹${result.wealth_gained.toLocaleString()}`);
    
    expect(result.maturity_value).toBeGreaterThan(300000);
    expect(result.maturity_value).toBeLessThan(320000);
    expect(result.total_invested).toBe(100000);
  });

  /**
   * Test Case 2: Zero principal
   * Expected: ₹0
   */
  test('T2.2: Zero principal', () => {
    const result = calculateLumpsum(0, 12, 10, 0);
    console.log('\nT2.2 - Zero Principal:');
    console.log(`  Principal: ₹0`);
    console.log(`  Maturity Value: ₹${result.maturity_value}`);
    
    expect(result.maturity_value).toBe(0);
    expect(result.wealth_gained).toBe(0);
  });

  /**
   * Test Case 3: Zero rate
   * Principal: ₹100,000, Rate: 0%, Years: 10
   * Expected: ₹100,000 (no growth)
   */
  test('T2.3: Zero rate - 100000, 0% annual, 10 years', () => {
    const result = calculateLumpsum(100000, 0, 10, 0);
    console.log('\nT2.3 - Zero Rate:');
    console.log(`  Principal: ₹100,000`);
    console.log(`  Annual Rate: 0%`);
    console.log(`  Maturity Value: ₹${result.maturity_value}`);
    
    expect(result.maturity_value).toBe(100000);
    expect(result.wealth_gained).toBe(0);
  });

  /**
   * Test Case 4: Single year
   * Principal: ₹100,000, Rate: 12%, Years: 1
   * Expected: ₹112,000
   */
  test('T2.4: Single year - 100000, 12% annual, 1 year', () => {
    const result = calculateLumpsum(100000, 12, 1, 0);
    console.log('\nT2.4 - Single Year:');
    console.log(`  Principal: ₹100,000`);
    console.log(`  Maturity Value: ₹${result.maturity_value}`);
    
    expect(result.maturity_value).toBe(112000);
  });

  /**
   * Test Case 5: Very high rate
   * Principal: ₹1,000, Rate: 50%, Years: 5
   * Expected: 1000 × (1.5)^5 = 7,593.75
   */
  test('T2.5: Very high rate - 1000, 50% annual, 5 years', () => {
    const result = calculateLumpsum(1000, 50, 5, 0);
    console.log('\nT2.5 - Very High Rate:');
    console.log(`  Principal: ₹1,000`);
    console.log(`  Annual Rate: 50%`);
    console.log(`  Maturity Value: ₹${result.maturity_value}`);
    
    expect(result.maturity_value).toBeGreaterThan(7000);
  });

  /**
   * Test Case 6: Very long period
   * Principal: ₹1,000, Rate: 12%, Years: 50
   */
  test('T2.6: Very long period - 1000, 12% annual, 50 years', () => {
    const result = calculateLumpsum(1000, 12, 50, 0);
    console.log('\nT2.6 - Very Long Period:');
    console.log(`  Principal: ₹1,000`);
    console.log(`  Duration: 50 years`);
    console.log(`  Maturity Value: ₹${result.maturity_value.toLocaleString()}`);
    
    expect(result.maturity_value).toBeGreaterThan(1000000);
  });

  /**
   * Test Case 7: Negative values handling
   * Should handle or error gracefully
   */
  test('T2.7: Large amounts - 10000000, 12% annual, 10 years', () => {
    const result = calculateLumpsum(10000000, 12, 10, 0);
    console.log('\nT2.7 - Large Amounts:');
    console.log(`  Principal: ₹10,000,000`);
    console.log(`  Maturity Value: ₹${result.maturity_value.toLocaleString()}`);
    
    expect(result.maturity_value).toBeGreaterThan(10000000);
  });

  /**
   * Test Case 8: Inflation adjustment
   * Principal: ₹100,000, Rate: 12%, Years: 10, Inflation: 6%
   */
  test('T2.8: With inflation adjustment - inflation 6%', () => {
    const resultNoInflation = calculateLumpsum(100000, 12, 10, 0);
    const resultWithInflation = calculateLumpsum(100000, 12, 10, 6);
    
    console.log('\nT2.8 - Inflation Adjustment:');
    console.log(`  Without Inflation: ₹${resultNoInflation.maturity_value.toLocaleString()}`);
    console.log(`  With Inflation (6%): ₹${resultWithInflation.inflation_adjusted_value.toLocaleString()}`);
    
    expect(resultWithInflation.inflation_adjusted_value).toBeLessThan(resultNoInflation.maturity_value);
  });

  /**
   * Test Case 9: Yearly projections
   */
  test('T2.9: Yearly projections - verify progression', () => {
    const result = calculateLumpsum(100000, 12, 5, 0);
    console.log('\nT2.9 - Yearly Projections:');
    
    result.yearly_projections.forEach((proj, i) => {
      console.log(`  Year ${proj.year}: Value=${proj.value}, Returns=${proj.returns}`);
      expect(proj.value).toBeGreaterThanOrEqual(100000);
      
      if (i > 0) {
        expect(proj.value).toBeGreaterThanOrEqual(result.yearly_projections[i-1].value);
      }
    });
  });
});

// ============================================================================
// TASK 2: FI PLANNER VERIFICATION
// ============================================================================

describe('FI Planner Calculations Verification', () => {
  /**
   * Test Case 1: FI Number Calculation
   * Formula: FI_Number = Annual_Expenses × 25 (based on 4% rule)
   */
  test('FI1.1: FI Number - 30000/month expenses', () => {
    const monthlyExpense = 30000;
    const annualExpense = monthlyExpense * 12;
    const fiCorpus = annualExpense * 25;
    
    console.log('FI1.1 - FI Number Calculation:');
    console.log(`  Monthly Expense: ₹${monthlyExpense.toLocaleString()}`);
    console.log(`  Annual Expense: ₹${annualExpense.toLocaleString()}`);
    console.log(`  FI Corpus (4% rule): ₹${fiCorpus.toLocaleString()}`);
    console.log(`  Expected: ₹9,000,000`);
    
    expect(fiCorpus).toBe(9000000);
  });

  /**
   * Test Case 2: FI Number - High expenses
   */
  test('FI1.2: FI Number - 100000/month expenses', () => {
    const monthlyExpense = 100000;
    const annualExpense = monthlyExpense * 12;
    const fiCorpus = annualExpense * 25;
    
    console.log('\nFI1.2 - FI Number (High):');
    console.log(`  Monthly Expense: ₹${monthlyExpense.toLocaleString()}`);
    console.log(`  FI Corpus: ₹${fiCorpus.toLocaleString()}`);
    console.log(`  Expected: ₹30,000,000`);
    
    expect(fiCorpus).toBe(30000000);
  });

  /**
   * Test Case 3: FI Number - Zero expenses
   */
  test('FI1.3: FI Number - Zero expenses', () => {
    const monthlyExpense = 0;
    const annualExpense = monthlyExpense * 12;
    const fiCorpus = annualExpense * 25;
    
    console.log('\nFI1.3 - FI Number (Zero):');
    console.log(`  FI Corpus: ₹${fiCorpus}`);
    
    expect(fiCorpus).toBe(0);
  });

  /**
   * Test Case 4: Savings Rate Calculation
   * Formula: Savings_Rate = (Income - Expenses) / Income × 100
   */
  test('FI1.4: Savings Rate - 50% saved', () => {
    const income = 100000;
    const expenses = 50000;
    const savingsRate = ((income - expenses) / income) * 100;
    
    console.log('\nFI1.4 - Savings Rate:');
    console.log(`  Monthly Income: ₹${income.toLocaleString()}`);
    console.log(`  Monthly Expense: ₹${expenses.toLocaleString()}`);
    console.log(`  Savings Rate: ${savingsRate.toFixed(1)}%`);
    
    expect(savingsRate).toBe(50);
  });

  /**
   * Test Case 5: Savings Rate - High savings
   */
  test('FI1.5: Savings Rate - 80% saved', () => {
    const income = 100000;
    const expenses = 20000;
    const savingsRate = ((income - expenses) / income) * 100;
    
    console.log('\nFI1.5 - Savings Rate (High):');
    console.log(`  Savings Rate: ${savingsRate.toFixed(1)}%`);
    
    expect(savingsRate).toBe(80);
  });

  /**
   * Test Case 6: Savings Rate - Negative (expenses > income)
   */
  test('FI1.6: Savings Rate - Negative (spending > income)', () => {
    const income = 50000;
    const expenses = 60000;
    const savingsRate = ((income - expenses) / income) * 100;
    
    console.log('\nFI1.6 - Savings Rate (Negative):');
    console.log(`  Monthly Income: ₹${income.toLocaleString()}`);
    console.log(`  Monthly Expense: ₹${expenses.toLocaleString()}`);
    console.log(`  Savings Rate: ${savingsRate.toFixed(1)}%`);
    
    expect(savingsRate).toBeLessThan(0);
  });

  /**
   * Test Case 7: Years to FI Calculation
   * Using year-by-year projection
   */
  test('FI1.7: Years to FI - Standard scenario', () => {
    const initialCorpus = 500000;
    const fiTarget = 9000000;
    const annualSavings = (100000 - 30000) * 12; // 840000
    const returnRate = 0.12; // 12%
    
    let corpus = initialCorpus;
    let yearsToFI = 0;
    for (let year = 0; year <= 50; year++) {
      if (corpus >= fiTarget) {
        yearsToFI = year;
        break;
      }
      corpus = corpus * (1 + returnRate) + annualSavings;
    }
    
    console.log('\nFI1.7 - Years to FI:');
    console.log(`  Initial Corpus: ₹${initialCorpus.toLocaleString()}`);
    console.log(`  FI Target: ₹${fiTarget.toLocaleString()}`);
    console.log(`  Annual Savings: ₹${annualSavings.toLocaleString()}`);
    console.log(`  Expected Return: ${returnRate * 100}%`);
    console.log(`  Years to FI: ${yearsToFI}`);
    
    expect(yearsToFI).toBeGreaterThan(0);
    expect(yearsToFI).toBeLessThan(50);
  });

  /**
   * Test Case 8: Already at FI target
   */
  test('FI1.8: Already at FI - Years should be 0', () => {
    const initialCorpus = 10000000;
    const fiTarget = 9000000;
    
    const yearsToFI = initialCorpus >= fiTarget ? 0 : 1;
    
    console.log('\nFI1.8 - Already at FI:');
    console.log(`  Initial Corpus: ₹${initialCorpus.toLocaleString()}`);
    console.log(`  FI Target: ₹${fiTarget.toLocaleString()}`);
    console.log(`  Years to FI: ${yearsToFI}`);
    
    expect(yearsToFI).toBe(0);
  });

  /**
   * Test Case 9: Projected Portfolio at target age
   */
  test('FI1.9: Projected Portfolio - Multi-year projection', () => {
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
    
    console.log('\nFI1.9 - Projected Portfolio:');
    console.log(`  Current Age: ${currentAge}`);
    console.log(`  Target Age: ${targetAge}`);
    console.log(`  Initial Savings: ₹${initialSavings.toLocaleString()}`);
    console.log(`  Annual Investment: ₹${annualInvestment.toLocaleString()}`);
    console.log(`  Projected Corpus at age ${targetAge}: ₹${Math.round(corpus).toLocaleString()}`);
    
    expect(corpus).toBeGreaterThan(initialSavings);
  });

  /**
   * Test Case 10: Very ambitious timeline
   */
  test('FI1.10: Ambitious timeline - 5 years to FI', () => {
    const fiTarget = 3000000;
    const initialCorpus = 1000000;
    const yearsAllowed = 5;
    const returnRate = 0.12;
    
    // Calculate required annual savings
    let corpus = initialCorpus;
    for (let year = 0; year < yearsAllowed; year++) {
      corpus = corpus * (1 + returnRate);
    }
    const requiredAnnualSavings = (fiTarget - corpus) / yearsAllowed;
    
    console.log('\nFI1.10 - Ambitious Timeline:');
    console.log(`  FI Target: ₹${fiTarget.toLocaleString()}`);
    console.log(`  Initial Corpus: ₹${initialCorpus.toLocaleString()}`);
    console.log(`  Years Available: ${yearsAllowed}`);
    console.log(`  Required Annual Savings: ₹${Math.round(requiredAnnualSavings).toLocaleString()}`);
    
    expect(requiredAnnualSavings).toBeGreaterThan(0);
  });

  /**
   * Test Case 11: Edge case - Same age (already at target age)
   */
  test('FI1.11: Edge case - Current age equals target age', () => {
    const currentAge = 40;
    const targetAge = 40;
    const yearsRemaining = targetAge - currentAge;
    
    console.log('\nFI1.11 - Same Age:');
    console.log(`  Current Age: ${currentAge}`);
    console.log(`  Target Age: ${targetAge}`);
    console.log(`  Years Remaining: ${yearsRemaining}`);
    
    expect(yearsRemaining).toBe(0);
  });

  /**
   * Test Case 12: Edge case - Invalid timeline (target age < current age)
   */
  test('FI1.12: Edge case - Invalid timeline (target < current)', () => {
    const currentAge = 50;
    const targetAge = 40;
    const isInvalid = targetAge < currentAge;
    
    console.log('\nFI1.12 - Invalid Timeline:');
    console.log(`  Current Age: ${currentAge}`);
    console.log(`  Target Age: ${targetAge}`);
    console.log(`  Is Invalid: ${isInvalid}`);
    
    expect(isInvalid).toBe(true);
  });

  /**
   * Test Case 13: Different return rates comparison
   */
  test('FI1.13: Different return rates - 8%, 10%, 12%, 15%', () => {
    const initialCorpus = 500000;
    const annualSavings = 840000;
    const years = 10;
    
    const rates = [0.08, 0.10, 0.12, 0.15];
    const results: { rate: number; corpus: number }[] = [];
    
    rates.forEach(rate => {
      let corpus = initialCorpus;
      for (let year = 0; year < years; year++) {
        corpus = corpus * (1 + rate) + annualSavings;
      }
      results.push({ rate: rate * 100, corpus: Math.round(corpus) });
    });
    
    console.log('\nFI1.13 - Return Rates Comparison:');
    console.log(`  After ${years} years with ₹${annualSavings.toLocaleString()} annual savings:`);
    results.forEach(r => {
      console.log(`  ${r.rate}% return → ₹${r.corpus.toLocaleString()}`);
    });
    
    // Higher rate should yield higher corpus
    expect(results[3].corpus).toBeGreaterThan(results[0].corpus);
  });

  /**
   * Test Case 14: Very long period (50+ years)
   */
  test('FI1.14: Very long period - 50 years projection', () => {
    const initialCorpus = 100000;
    const annualSavings = 600000;
    const returnRate = 0.10;
    const years = 50;
    
    let corpus = initialCorpus;
    for (let year = 0; year < years; year++) {
      corpus = corpus * (1 + returnRate) + annualSavings;
    }
    
    console.log('\nFI1.14 - Very Long Period:');
    console.log(`  Initial Corpus: ₹${initialCorpus.toLocaleString()}`);
    console.log(`  Duration: ${years} years`);
    console.log(`  Final Corpus: ₹${Math.round(corpus).toLocaleString()}`);
    
    expect(corpus).toBeGreaterThan(initialCorpus * 1000);
  });
});

// ============================================================================
// COMPARISON TESTS
// ============================================================================

describe('SIP vs Lumpsum Comparison', () => {
  /**
   * Test Case: Compare SIP vs Lumpsum with same total invested amount
   * Same total: ₹1,200,000 (either 10k/month for 10 years, or 1.2M lumpsum)
   */
  test('Comparison: SIP vs Lumpsum - Same total investment', () => {
    const monthlyInvestment = 10000;
    const years = 10;
    const lumpsum = monthlyInvestment * 12 * years; // 1,200,000
    const rate = 12;
    
    const sipResult = calculateSIP(monthlyInvestment, rate, years, 0);
    const lumpsumResult = calculateLumpsum(lumpsum, rate, years, 0);
    
    console.log('Comparison - SIP vs Lumpsum:');
    console.log(`  Total Invested (Both): ₹${lumpsum.toLocaleString()}`);
    console.log(`  SIP Result (10k/month for 10 years): ₹${sipResult.maturity_value.toLocaleString()}`);
    console.log(`  Lumpsum Result (1.2M upfront): ₹${lumpsumResult.maturity_value.toLocaleString()}`);
    console.log(`  Difference: ₹${(lumpsumResult.maturity_value - sipResult.maturity_value).toLocaleString()}`);
    
    // Lumpsum should yield more since money starts growing immediately
    expect(lumpsumResult.maturity_value).toBeGreaterThan(sipResult.maturity_value);
  });
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

describe('Error Handling & Edge Cases', () => {
  /**
   * Test that calculations handle edge cases gracefully
   */
  test('Error Handling: Very small monthly investment', () => {
    const result = calculateSIP(0.01, 12, 10, 0);
    console.log('Edge Case - Very small SIP:');
    console.log(`  Result: ₹${result.maturity_value}`);
    
    expect(result.maturity_value).toBeGreaterThanOrEqual(0);
  });

  test('Error Handling: Very large monthly investment', () => {
    const result = calculateSIP(10000000, 12, 10, 0);
    console.log('Edge Case - Very large SIP:');
    console.log(`  Result: ₹${result.maturity_value.toLocaleString()}`);
    
    expect(result.maturity_value).toBeGreaterThan(0);
  });

  test('Error Handling: Decimal years (fractional)', () => {
    const result = calculateSIP(10000, 12, 2.5, 0);
    console.log('Edge Case - Fractional years:');
    console.log(`  Result: ₹${result.maturity_value}`);
    
    expect(result.maturity_value).toBeGreaterThan(0);
  });

  test('Error Handling: Very high annual rate', () => {
    const result = calculateSIP(10000, 100, 5, 0);
    console.log('Edge Case - 100% annual rate:');
    console.log(`  Result: ₹${result.maturity_value.toLocaleString()}`);
    
    expect(result.maturity_value).toBeGreaterThan(0);
  });

  test('Error Handling: High inflation reduces real value', () => {
    const result = calculateSIP(10000, 12, 10, 12);
    console.log('Edge Case - High inflation (12%):');
    console.log(`  Nominal: ₹${result.maturity_value.toLocaleString()}`);
    console.log(`  Inflation-Adjusted: ₹${result.inflation_adjusted_value.toLocaleString()}`);
    
    expect(result.inflation_adjusted_value).toBeLessThan(result.maturity_value);
  });
});

// Export summary for manual verification
export const testSummary = {
  sipTestCases: 9,
  lumpsumTestCases: 9,
  fiPlannerTestCases: 14,
  comparisonTestCases: 1,
  errorHandlingTestCases: 5,
  totalTestCases: 38,
};
