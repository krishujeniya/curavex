import test from "node:test";
import assert from "node:assert/strict";
import {
  formatConfidenceInterval,
  getEfficacyTier,
  validateClinicalInput,
} from "../src/lib/clinical-validation.ts";
import { resolveTheme } from "../src/lib/theme.ts";

test("resolveTheme honors explicit stored preference over system preference", () => {
  assert.equal(resolveTheme("light", true), "light");
  assert.equal(resolveTheme("dark", false), "dark");
});

test("resolveTheme falls back to system preference when storage is empty or invalid", () => {
  assert.equal(resolveTheme(null, true), "dark");
  assert.equal(resolveTheme(undefined, false), "light");
  assert.equal(resolveTheme("sepia", true), "dark");
});

test("validateClinicalInput accepts valid canonical regimen", () => {
  const err = validateClinicalInput({
    Age: 54,
    Gender: "Male",
    Condition: "Hypertension",
    Drug_Name: "Amlodipine",
    Dosage_mg: 250,
    Treatment_Duration_days: 30,
  });
  assert.equal(err, null);
});

test("validateClinicalInput rejects out-of-bounds parameters and mismatched compounds", () => {
  assert.match(
    validateClinicalInput({
      Age: 130,
      Gender: "Female",
      Condition: "Hypertension",
      Drug_Name: "Amlodipine",
      Dosage_mg: 250,
      Treatment_Duration_days: 30,
    }) ?? "",
    /age between 1 and 120/i,
  );

  assert.match(
    validateClinicalInput({
      Age: 45,
      Gender: "Female",
      Condition: "Hypertension",
      Drug_Name: "Metformin",
      Dosage_mg: 250,
      Treatment_Duration_days: 30,
    }) ?? "",
    /not an approved compound/i,
  );

  assert.match(
    validateClinicalInput({
      Age: 45,
      Gender: "Unknown",
      Condition: "Hypertension",
      Drug_Name: "Amlodipine",
      Dosage_mg: 250,
      Treatment_Duration_days: 30,
    }) ?? "",
    /Female or Male/i,
  );
});

test("getEfficacyTier maps Low, Medium, High thresholds", () => {
  assert.equal(getEfficacyTier(3.2), "Low");
  assert.equal(getEfficacyTier(4.5), "Low");
  assert.equal(getEfficacyTier(6.1), "Medium");
  assert.equal(getEfficacyTier(7.5), "Medium");
  assert.equal(getEfficacyTier(8.4), "High");
});

test("formatConfidenceInterval formats bounds and handles malformed inputs", () => {
  assert.equal(formatConfidenceInterval([4.1, 9.8]), "[4.10 – 9.80]");
  assert.equal(formatConfidenceInterval([]), "[N/A]");
});
