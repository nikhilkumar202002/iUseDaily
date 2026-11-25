export function calculatePercentage(total: number, percentage: number): number {
  return (total * percentage) / 100;
}

export function calculateBmi(weightKg: number, heightCm: number): { bmi: number; category: string } {
  const heightM = heightCm / 100;
  const bmi = parseFloat((weightKg / (heightM * heightM)).toFixed(1));
  let category = "Normal";
  if (bmi < 18.5) category = "Underweight";
  else if (bmi >= 25 && bmi < 29.9) category = "Overweight";
  else if (bmi >= 30) category = "Obese";
  return { bmi, category };
}

export function calculateLoanEmi(principal: number, annualRate: number, tenureMonths: number): number {
  const monthlyRate = annualRate / (12 * 100);
  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
    (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  return Math.round(emi);
}
