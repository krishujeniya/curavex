# Clinical Trial Cohort Data Dictionary

Canonical dataset documentation and variable definitions for clinical treatment response modeling.

| Variable Name | Type | Storage | Permissible Range / Values | Description |
| :--- | :--- | :--- | :--- | :--- |
| `Patient_ID` | String | `str` | `P0001` - `P9999` | Anonymized clinical trial subject token |
| `Age` | Integer | `int64` | `18` - `79` years | Chronological patient age at baseline |
| `Gender` | Categorical | `str` | `Male`, `Female` | Biological sex stratification |
| `Condition` | Categorical | `str` | `Hypertension`, `Depression`, `Diabetes`, `Infection`, `Pain Relief` | Primary clinical indication under study |
| `Drug_Name` | Categorical | `str` | See mapped compounds below | Active pharmacological agent prescribed |
| `Dosage_mg` | Numeric | `float64` | `50.0` - `850.0` mg | Administered unit dosage |
| `Treatment_Duration_days`| Integer | `int64` | `5` - `59` days | Prescribed duration of therapeutic course |
| `Side_Effects` | Categorical | `str` | 30 adverse event tokens | Clinically reported side effect phenotype |
| `Improvement_Score` | Numeric | `float64` | `2.5` - `10.0` | Primary clinical endpoint: therapeutic efficacy score |

---

## Approved Condition-to-Drug Formulations

- **Hypertension**: Amlodipine, Metoprolol, Losartan
- **Depression**: Sertraline, Bupropion, Escitalopram
- **Diabetes**: Metformin, Glipizide, Insulin Glargine
- **Infection**: Ciprofloxacin, Amoxicillin, Azithromycin
- **Pain Relief**: Ibuprofen, Paracetamol, Tramadol
