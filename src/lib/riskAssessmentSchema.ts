// Shared Risk Assessment Schema
// This file defines the canonical field structure, labels, and data model
// for Inherent Rating, Control Effectiveness, and Residual Rating sections.
// Both the main RiskAssessmentForm and BulkAssessmentModal consume this schema
// to ensure consistency across the application.

// ==========================================
// RATING OPTIONS
// ==========================================

export interface RatingOption {
  value: string;
  numericValue: number;
  label: string;
  shortLabel: string;
  description?: string;
}

// Standard rating options for Inherent and Residual factors
export const FACTOR_RATING_OPTIONS: RatingOption[] = [
  { value: "0", numericValue: 0, label: "Not Applicable (N/A)", shortLabel: "N/A", description: "This factor does not apply to this risk" },
  { value: "1", numericValue: 1, label: "Very Low (1)", shortLabel: "Very Low", description: "Minimal impact/probability expected" },
  { value: "2", numericValue: 2, label: "Low (2)", shortLabel: "Low", description: "Minor impact, easily managed" },
  { value: "3", numericValue: 3, label: "Medium (3)", shortLabel: "Medium", description: "Moderate impact requiring attention" },
  { value: "4", numericValue: 4, label: "High (4)", shortLabel: "High", description: "Significant impact on operations" },
  { value: "5", numericValue: 5, label: "Very High (5)", shortLabel: "Very High", description: "Critical impact, immediate action needed" },
];

// Control effectiveness rating options
export const CONTROL_RATING_OPTIONS: RatingOption[] = [
  { value: "0", numericValue: 0, label: "Not Applicable (N/A)", shortLabel: "N/A", description: "Control not applicable" },
  { value: "1", numericValue: 1, label: "Ineffective (1)", shortLabel: "Ineffective", description: "Control is not operating as intended" },
  { value: "2", numericValue: 2, label: "Partially Effective (2)", shortLabel: "Partial", description: "Control has significant gaps" },
  { value: "3", numericValue: 3, label: "Moderately Effective (3)", shortLabel: "Moderate", description: "Control operating with some improvements needed" },
  { value: "4", numericValue: 4, label: "Effective (4)", shortLabel: "Effective", description: "Control operating as designed with minor issues" },
  { value: "5", numericValue: 5, label: "Highly Effective (5)", shortLabel: "Highly Effective", description: "Control fully operating as designed" },
];

// ==========================================
// INHERENT RISK FACTORS SCHEMA
// ==========================================

export interface InherentFactorDefinition {
  id: string;
  name: string;
  description: string;
  defaultWeightage: number;
  guidance: {
    rating1: string;
    rating2: string;
    rating3: string;
    rating4: string;
    rating5: string;
  };
}

export const INHERENT_FACTORS: InherentFactorDefinition[] = [
  {
    id: "1",
    name: "Impact",
    description: "Potential severity of consequences if the risk materializes (1=Very Low, 2=Low, 3=Medium, 4=High, 5=Extreme)",
    defaultWeightage: 50,
    guidance: {
      rating1: "Minimal impact expected",
      rating2: "Minor impact, easily managed",
      rating3: "Moderate impact requiring attention",
      rating4: "Significant impact on operations",
      rating5: "Critical impact, immediate action needed",
    },
  },
  {
    id: "2",
    name: "Likelihood",
    description: "Probability of the risk occurring (1=Rare, 2=Unlikely, 3=Moderate, 4=Likely, 5=Almost Certain)",
    defaultWeightage: 50,
    guidance: {
      rating1: "Rare occurrence expected",
      rating2: "Unlikely to occur",
      rating3: "Moderate probability of occurrence",
      rating4: "Likely to occur",
      rating5: "Almost certain to occur",
    },
  },
];

// ==========================================
// RESIDUAL RISK FACTORS SCHEMA
// ==========================================

export interface ResidualFactorDefinition {
  id: string;
  name: string;
  description: string;
  defaultWeightage: number;
  guidance: {
    rating1: string;
    rating2: string;
    rating3: string;
    rating4: string;
    rating5: string;
  };
}

export const RESIDUAL_FACTORS: ResidualFactorDefinition[] = [
  {
    id: "1",
    name: "Impact",
    description: "Remaining severity of consequences after control mitigation (1=Very Low, 2=Low, 3=Medium, 4=High, 5=Extreme)",
    defaultWeightage: 50,
    guidance: {
      rating1: "Minimal residual impact",
      rating2: "Minor residual impact after controls",
      rating3: "Moderate residual impact",
      rating4: "Significant residual impact",
      rating5: "Critical residual impact",
    },
  },
  {
    id: "2",
    name: "Likelihood",
    description: "Remaining probability of the risk occurring after control mitigation (1=Rare, 2=Unlikely, 3=Moderate, 4=Likely, 5=Almost Certain)",
    defaultWeightage: 50,
    guidance: {
      rating1: "Rare occurrence after controls",
      rating2: "Unlikely after controls",
      rating3: "Moderate probability after controls",
      rating4: "Still likely after controls",
      rating5: "Almost certain even after controls",
    },
  },
];

// ==========================================
// CONTROL EFFECTIVENESS SCHEMA
// ==========================================

export interface ControlDimensionDefinition {
  id: string;
  name: string;
  shortName: string;
  description: string;
}

export const CONTROL_DIMENSIONS: ControlDimensionDefinition[] = [
  {
    id: "design",
    name: "Design Effectiveness",
    shortName: "Design",
    description: "How well the control is designed to mitigate the risk",
  },
  {
    id: "operating",
    name: "Operating Effectiveness",
    shortName: "Operating",
    description: "How consistently the control operates as designed",
  },
  {
    id: "testing",
    name: "Overall Effectiveness",
    shortName: "Overall",
    description: "Overall effectiveness based on testing and validation results",
  },
];

// ==========================================
// HELPER FUNCTIONS
// ==========================================

export const getRatingLabel = (score: number): { label: string; color: string } => {
  if (score >= 4) return { label: "High", color: "bg-red-500" };
  if (score >= 3) return { label: "Medium", color: "bg-amber-500" };
  if (score >= 2) return { label: "Low", color: "bg-emerald-500" };
  return { label: "Very Low", color: "bg-slate-400" };
};

export const getControlRatingLabel = (score: number): { label: string; color: string } => {
  if (score >= 4) return { label: "Highly Effective", color: "bg-emerald-500" };
  if (score >= 3) return { label: "Effective", color: "bg-green-500" };
  if (score >= 2) return { label: "Partially Effective", color: "bg-amber-500" };
  return { label: "Ineffective", color: "bg-red-500" };
};

export const findRatingOption = (value: string, options: RatingOption[]): RatingOption | undefined => {
  return options.find(opt => opt.value === value);
};

export const getRatingOptionLabel = (value: string, options: RatingOption[]): string => {
  const option = findRatingOption(value, options);
  return option?.label || value;
};
