export const getScoreColor = (score: string): string => {
  const numVal = parseFloat(score);
  if (numVal <= 2) return "bg-green-100 text-green-700 border-green-200";
  if (numVal <= 3) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-red-100 text-red-700 border-red-200";
};

export const getScoreLabel = (score: string): string => {
  const numVal = parseFloat(score);
  if (numVal <= 1.5) return "Very Low";
  if (numVal <= 2.5) return "Low";
  if (numVal <= 3.5) return "Medium";
  if (numVal <= 4.5) return "High";
  return "Very High";
};
