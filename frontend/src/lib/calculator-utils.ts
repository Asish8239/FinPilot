/**
 * Local fallback calculator for SIP and Lumpsum calculations
 * Used when backend is unavailable or API fails
 */

import type { SIPResult, YearlyProjection } from "@/types";

export function calculateSIP(
  monthlyInvestment: number,
  annualRate: number,
  years: number,
  inflationRate: number
): SIPResult {
  const monthlyRate = annualRate / 100 / 12;
  const months = years * 12;

  // Future Value of Annuity formula: FV = PMT * [((1 + r)^n - 1) / r]
  // Special case: when rate is 0, maturity equals total invested
  const maturityValue =
    monthlyRate === 0
      ? monthlyInvestment * months
      : monthlyInvestment * (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate;

  const totalInvested = monthlyInvestment * months;
  const wealthGained = maturityValue - totalInvested;

  // Inflation adjustment: divide by (1 + inflation_rate)^years
  const inflationAdjustedValue = maturityValue / Math.pow(1 + inflationRate / 100, years);

  // Yearly projections
  const yearlyProjections: YearlyProjection[] = [];
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
}

export function calculateLumpsum(
  principal: number,
  annualRate: number,
  years: number,
  inflationRate: number
): SIPResult {
  const rate = annualRate / 100;

  // Compound Interest formula: A = P(1 + r)^t
  const maturityValue = principal * Math.pow(1 + rate, years);
  const wealthGained = maturityValue - principal;

  // Inflation adjustment
  const inflationAdjustedValue = maturityValue / Math.pow(1 + inflationRate / 100, years);

  // Yearly projections
  const yearlyProjections: YearlyProjection[] = [];
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
}
