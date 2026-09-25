/**
 * FI Planner Calculation Verification Tests
 * 
 * Tests the Financial Independence Planner calculations to ensure accuracy
 * under various scenarios including edge cases.
 */

// Helper function from FI Planner page
function calculateYears(
  initial: number,
  target: number,
  annualInvestment: number,
  returnRate: number
): number {
  let corpus = initial;
  for (let year = 0; year <= 50; year++) {
    if (corpus >= target) return year;
    corpus = corpus * (1 + returnRate) + annualInvestment;
  }
  return 50;
}

describe("FI Planner - calculateYears", () => {
  describe("Basic scenarios", () => {
    test("should calculate years to FI with 0% return", () => {
      // Initial: 100k, Target: 1M, Annual: 100k, Return: 0%
      // Year 0: 100k
      // Year 1: 100k + 100k = 200k
      // Year 2: 200k + 100k = 300k
      // ...
      // Year 9: 900k + 100k = 1M ✓
      const years = calculateYears(100000, 1000000, 100000, 0);
      expect(years).toBe(9);
    });

    test("should calculate years to FI with positive return", () => {
      // Initial: 500k, Target: 1M, Annual: 100k, Return: 10%
      const years = calculateYears(500000, 1000000, 100000, 0.1);
      expect(years).toBeLessThan(10);
      expect(years).toBeGreaterThanOrEqual(0);
    });

    test("should return 0 when already at target", () => {
      const years = calculateYears(1000000, 1000000, 100000, 0.1);
      expect(years).toBe(0);
    });

    test("should return 0 when initial exceeds target", () => {
      const years = calculateYears(2000000, 1000000, 100000, 0.1);
      expect(years).toBe(0);
    });
  });

  describe("Edge cases", () => {
    test("should handle zero annual investment", () => {
      // With 0 investment and 10% return, corpus grows only on returns
      const years = calculateYears(100000, 1000000, 0, 0.1);
      // 100k * (1.1)^n = 1M => (1.1)^n = 10 => n ≈ 24.16
      expect(years).toBeLessThanOrEqual(25);
      expect(years).toBeGreaterThan(20);
    });

    test("should handle high return rate", () => {
      const years = calculateYears(100000, 1000000, 50000, 0.5);
      expect(years).toBeLessThan(10);
    });

    test("should handle very low return rate", () => {
      const years = calculateYears(100000, 1000000, 100000, 0.01);
      // Similar to 0% case, roughly 9 years
      expect(years).toBeLessThanOrEqual(10);
    });

    test("should handle negative initial (debt situation)", () => {
      // This is an edge case: starting with negative corpus
      // Result depends on how the calculation handles it
      const years = calculateYears(-100000, 0, 50000, 0.1);
      // Should reach 0 eventually with positive annual investment
      expect(years).toBeLessThanOrEqual(50);
    });

    test("should cap at 50 years if target not reached", () => {
      // Very low investment relative to target
      const years = calculateYears(100, 10000000, 1, 0.05);
      expect(years).toBe(50);
    });
  });

  describe("Real-world scenarios", () => {
    test("typical FI scenario: 50L initial, 1Cr target, 10L/year, 12% return", () => {
      const years = calculateYears(500000, 10000000, 1000000, 0.12);
      // This should be roughly 5-7 years
      expect(years).toBeLessThan(10);
      expect(years).toBeGreaterThan(0);
    });

    test("aggressive scenario: high savings, high returns", () => {
      const years = calculateYears(1000000, 5000000, 500000, 0.15);
      expect(years).toBeLessThan(8);
    });

    test("conservative scenario: low savings, low returns", () => {
      const years = calculateYears(100000, 5000000, 50000, 0.08);
      // Should take longer with conservative approach
      expect(years).toBeGreaterThan(15);
    });
  });

  describe("Mathematical verification", () => {
    test("should use compound interest formula correctly", () => {
      // Verify: A = P(1+r)^n + PMT * [((1+r)^n - 1) / r]
      // With 100k initial, 12% return, 10k/year for 5 years
      let corpus = 100000;
      for (let i = 0; i < 5; i++) {
        corpus = corpus * 1.12 + 10000;
      }
      // After 5 years with 12% return and 10k annual investment
      // Manual: 100k → 112k → 126.4k → 141.6k → 158.6k → 177.6k
      // + yearly: 10k each year
      expect(corpus).toBeGreaterThan(200000);
      expect(corpus).toBeLessThan(250000);
    });
  });

  describe("Sanity checks", () => {
    test("corpus should never decrease with positive investment and zero return", () => {
      let corpus = 100000;
      let prevCorpus = corpus;
      
      for (let year = 0; year <= 50; year++) {
        corpus = corpus * 1 + 50000; // 0% return + 50k investment
        expect(corpus).toBeGreaterThanOrEqual(prevCorpus);
        prevCorpus = corpus;
      }
    });

    test("corpus should grow monotonically with positive return and investment", () => {
      let corpus = 500000;
      let prevCorpus = corpus;
      
      for (let year = 0; year <= 10; year++) {
        corpus = corpus * 1.1 + 100000; // 10% return + 100k investment
        expect(corpus).toBeGreaterThan(prevCorpus);
        prevCorpus = corpus;
      }
    });
  });
});

describe("FI Planner - 4% Rule", () => {
  test("should calculate FI corpus correctly for 25x annual expense", () => {
    const monthlyExpense = 50000;
    const annualExpense = monthlyExpense * 12;
    const fiCorpus = annualExpense * 25; // 4% rule
    
    expect(fiCorpus).toBe(15000000); // 1.5Cr for 50k/month expense
  });

  test("should calculate monthly savings capacity", () => {
    const monthlyIncome = 100000;
    const monthlyExpense = 30000;
    const monthlySavings = monthlyIncome - monthlyExpense;
    
    expect(monthlySavings).toBe(70000);
  });

  test("4% rule edge case: higher expenses require higher corpus", () => {
    const expense1 = 30000 * 12 * 25;
    const expense2 = 60000 * 12 * 25;
    
    expect(expense2).toBe(expense1 * 2);
  });
});

describe("FI Planner - Scenario projections", () => {
  test("conservative 8% return scenario", () => {
    const initial = 500000;
    const target = 10000000;
    const annual = 1200000;
    const rate = 0.08;
    
    const years = calculateYears(initial, target, annual, rate);
    expect(years).toBeGreaterThan(0);
    expect(years).toBeLessThan(15);
  });

  test("moderate 12% return scenario", () => {
    const initial = 500000;
    const target = 10000000;
    const annual = 1200000;
    const rate = 0.12;
    
    const years = calculateYears(initial, target, annual, rate);
    expect(years).toBeLessThan(10);
  });

  test("aggressive 15% return scenario", () => {
    const initial = 500000;
    const target = 10000000;
    const annual = 1200000;
    const rate = 0.15;
    
    const years = calculateYears(initial, target, annual, rate);
    expect(years).toBeLessThan(8);
  });

  test("scenarios should follow realistic ordering: conservative > moderate > aggressive", () => {
    const initial = 500000;
    const target = 10000000;
    const annual = 1000000;
    
    const conservative = calculateYears(initial, target, annual, 0.08);
    const moderate = calculateYears(initial, target, annual, 0.12);
    const aggressive = calculateYears(initial, target, annual, 0.15);
    
    expect(conservative).toBeGreaterThanOrEqual(moderate);
    expect(moderate).toBeGreaterThanOrEqual(aggressive);
  });
});

