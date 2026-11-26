export interface ClinicalInputLike {
  Age: number;
  Gender: string;
  Condition: string;
  Drug_Name: string;
  Dosage_mg: number;
  Treatment_Duration_days: number;
}

export const CLINICAL_LIMITS = {
  Age: { min: 1, max: 120, cohortMin: 18, cohortMax: 79 },
  Dosage_mg: { min: 5, max: 2000, cohortMin: 50, cohortMax: 850 },
  Treatment_Duration_days: { min: 1, max: 365, cohortMin: 5, cohortMax: 59 },
} as const;

export const CANONICAL_CONDITION_DRUG_MAP: Record<string, string[]> = {
  Depression: ["Bupropion", "Escitalopram", "Sertraline"],
  Diabetes: ["Glipizide", "Metformin", "Insulin Glargine"],
  Hypertension: ["Metoprolol", "Amlodipine", "Losartan"],
  Infection: ["Ciprofloxacin", "Azithromycin", "Amoxicillin"],
  "Pain Relief": ["Paracetamol", "Ibuprofen", "Tramadol"],
};

export interface ClinicalCasePreset {
  id: string;
  label: string;
  summary: string;
  input: ClinicalInputLike;
}

export const CLINICAL_PRESETS: ClinicalCasePreset[] = [
  {
    id: "hypertension",
    label: "Hypertension · Amlodipine",
    summary: "54y Male, 250 mg, 30 days",
    input: {
      Age: 54,
      Gender: "Male",
      Condition: "Hypertension",
      Drug_Name: "Amlodipine",
      Dosage_mg: 250,
      Treatment_Duration_days: 30,
    },
  },
  {
    id: "diabetes",
    label: "Diabetes · Metformin",
    summary: "62y Female, 500 mg, 45 days",
    input: {
      Age: 62,
      Gender: "Female",
      Condition: "Diabetes",
      Drug_Name: "Metformin",
      Dosage_mg: 500,
      Treatment_Duration_days: 45,
    },
  },
  {
    id: "infection",
    label: "Infection · Ciprofloxacin",
    summary: "39y Female, 500 mg, 14 days",
    input: {
      Age: 39,
      Gender: "Female",
      Condition: "Infection",
      Drug_Name: "Ciprofloxacin",
      Dosage_mg: 500,
      Treatment_Duration_days: 14,
    },
  },
  {
    id: "depression",
    label: "Depression · Sertraline",
    summary: "46y Female, 100 mg, 50 days",
    input: {
      Age: 46,
      Gender: "Female",
      Condition: "Depression",
      Drug_Name: "Sertraline",
      Dosage_mg: 100,
      Treatment_Duration_days: 50,
    },
  },
];

/** Validate clinical input values against backend schema bounds and approved condition-drug pairs. */
export function validateClinicalInput(
  input: ClinicalInputLike,
  conditionDrugMap: Record<string, string[]> = CANONICAL_CONDITION_DRUG_MAP,
): string | null {
  if (!Number.isFinite(input.Age) || input.Age < CLINICAL_LIMITS.Age.min || input.Age > CLINICAL_LIMITS.Age.max) {
    return `Enter a patient age between ${CLINICAL_LIMITS.Age.min} and ${CLINICAL_LIMITS.Age.max} years.`;
  }
  if (!Number.isFinite(input.Dosage_mg) || input.Dosage_mg < CLINICAL_LIMITS.Dosage_mg.min || input.Dosage_mg > CLINICAL_LIMITS.Dosage_mg.max) {
    return `Enter a unit dosage between ${CLINICAL_LIMITS.Dosage_mg.min} and ${CLINICAL_LIMITS.Dosage_mg.max} mg.`;
  }
  if (
    !Number.isFinite(input.Treatment_Duration_days) ||
    input.Treatment_Duration_days < CLINICAL_LIMITS.Treatment_Duration_days.min ||
    input.Treatment_Duration_days > CLINICAL_LIMITS.Treatment_Duration_days.max
  ) {
    return `Enter a treatment duration between ${CLINICAL_LIMITS.Treatment_Duration_days.min} and ${CLINICAL_LIMITS.Treatment_Duration_days.max} days.`;
  }
  if (input.Gender !== "Female" && input.Gender !== "Male") {
    return "Select Female or Male for biological sex.";
  }
  const allowedDrugs = conditionDrugMap[input.Condition];
  if (!allowedDrugs) {
    return `Select a supported clinical indication instead of "${input.Condition}".`;
  }
  if (!allowedDrugs.includes(input.Drug_Name)) {
    return `${input.Drug_Name} is not an approved compound for ${input.Condition}. Choose ${allowedDrugs.join(", ")}.`;
  }
  return null;
}

/** Map numerical score (1.0-10.0) to efficacy tier. */
export function getEfficacyTier(score: number): "Low" | "Medium" | "High" {
  if (score <= 4.5) return "Low";
  if (score <= 7.5) return "Medium";
  return "High";
}

/** Format confidence interval consistently with tabular precision. */
export function formatConfidenceInterval(ci: [number, number] | number[]): string {
  if (!Array.isArray(ci) || ci.length < 2) return "[N/A]";
  return `[${Number(ci[0]).toFixed(2)} – ${Number(ci[1]).toFixed(2)}]`;
}
