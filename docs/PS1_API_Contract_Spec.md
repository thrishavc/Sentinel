# PS1 — Intelligent Conversational AI for KSP Crime Database
## Backend ↔ Conversational Layer Contract Spec

**Purpose:** This document is the agreed interface between the Backend/Data layer (Person A) and the AI/Conversational layer (Person B). Once frozen, both sides can build independently and integrate without surprises.

**Status:** DRAFT — review together, edit inline, freeze before Day 3.

---

## 1. Overview of the flow

```
User types/speaks query
      ↓
Person B: NL → intent + parameters (via LLM/prompt)
      ↓
Person B calls Person A's Catalyst Function with a Request object (Section 2)
      ↓
Person A: resolves intent → ZCQL query → Catalyst Data Store
      ↓
Person A returns a Response object (Section 3)
      ↓
Person B: turns structured response into a natural language answer + evidence citation
```

---

## 2. Request format (Person B → Person A)

Every call to the backend function follows this exact shape:

```json
{
  "intent": "get_cases_by_district",
  "parameters": {
    "district_name": "Bangalore Urban",
    "date_from": "2026-06-01",
    "date_to": "2026-06-30"
  },
  "conversation_id": "conv_8f3a2b",
  "turn_id": 4
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `intent` | string | Yes | Must exactly match one value from the Intent Table (Section 4) |
| `parameters` | object | Yes | Keys must match the parameter names defined per intent in Section 4. Missing optional params should be omitted, not sent as `null`. |
| `conversation_id` | string | Yes | Same value for the whole chat session, used for follow-up context |
| `turn_id` | int | Yes | Increments per turn in the conversation |

**Naming convention:** all keys `snake_case`, always.

---

## 3. Response format (Person A → Person B)

### Success response

```json
{
  "status": "success",
  "intent": "get_cases_by_district",
  "result_count": 3,
  "results": [
    {
      "case_master_id": 10234,
      "crime_no": "104430006202600017",
      "case_no": "202600017",
      "crime_registered_date": "2026-06-14",
      "crime_head": "Crimes Against Body",
      "crime_subhead": "Robbery",
      "case_category": "FIR",
      "gravity_offence": "Heinous",
      "unit_name": "Whitefield PS",
      "district_name": "Bangalore Urban",
      "case_status": "Under Investigation",
      "court_name": null,
      "latitude": 12.9698,
      "longitude": 77.7500,
      "brief_facts": "..."
    }
  ],
  "evidence": {
    "source_tables": ["CaseMaster", "Unit", "District", "CrimeSubHead"],
    "query_summary": "Filtered CaseMaster joined to Unit/District where DistrictName = 'Bangalore Urban' and CrimeRegisteredDate between 2026-06-01 and 2026-06-30"
  },
  "error": null
}
```

### Empty result response

```json
{
  "status": "success",
  "intent": "get_cases_by_district",
  "result_count": 0,
  "results": [],
  "evidence": {
    "source_tables": ["CaseMaster", "Unit", "District"],
    "query_summary": "Filtered CaseMaster joined to Unit/District where DistrictName = 'Kodagu' and CrimeRegisteredDate between 2026-06-01 and 2026-06-30"
  },
  "error": null
}
```
Person B should render this as "No cases found matching that filter" — never let the LLM invent results when `result_count` is 0.

### Error response

```json
{
  "status": "error",
  "intent": "get_cases_by_district",
  "result_count": 0,
  "results": [],
  "evidence": null,
  "error": {
    "code": "UNKNOWN_INTENT",
    "message": "Intent 'get_cases_by_weather' is not recognized"
  }
}
```

**Error codes to support at minimum:**
| Code | Meaning |
|---|---|
| `UNKNOWN_INTENT` | intent string not in the agreed list |
| `MISSING_PARAMETER` | a required parameter for that intent was not sent |
| `INVALID_PARAMETER` | parameter sent but doesn't match expected type/format (e.g. bad date) |
| `NO_MATCH` | query resolved fine but matched nothing — *(alternative to using result_count: 0 as success; team must pick ONE approach — recommend using success + result_count: 0, reserve error only for genuinely malformed requests)* |
| `INTERNAL_ERROR` | unexpected backend failure |

---

## 4. Intent table (fill in / confirm together)

> Instructions: go through this row by row. Delete intents you won't build. Add any missing. Freeze parameter names — once frozen, do not rename without telling the other person.

| # | Intent name | Parameters (name: type) | Backing tables |
|---|---|---|---|
| 1 | `get_case_by_crimeno` | `crime_no: string` | CaseMaster |
| 2 | `get_cases_by_district` | `district_name: string`, `date_from: date (optional)`, `date_to: date (optional)` | CaseMaster → Unit → District |
| 3 | `get_cases_by_crimehead` | `crime_head: string (optional)`, `crime_subhead: string (optional)` | CaseMaster → CrimeHead / CrimeSubHead |
| 4 | `get_accused_by_case` | `crime_no: string` OR `case_master_id: int` | Accused |
| 5 | `get_accused_network` | `accused_master_id: int` OR `case_master_id: int` | Accused ↔ CaseMaster ↔ ArrestSurrender |
| 6 | `get_arrests_by_officer` | `employee_name: string` OR `kgid: string` | ArrestSurrender → Employee |
| 7 | `get_cases_by_status` | `case_status_name: string` | CaseMaster → CaseStatusMaster |
| 8 | `get_cases_by_act_section` | `act_short_name: string (optional)`, `section_code: string (optional)` | ActSectionAssociation → Act / Section |
| 9 | `get_repeat_offenders` | `district_name: string (optional)`, `date_from: date (optional)`, `date_to: date (optional)` | Accused grouped by name/case count |
| 10 | `get_case_victims` | `crime_no: string` OR `case_master_id: int` | Victim |
| 11 | `get_cases_by_gravity` | `gravity_level: string` | CaseMaster → GravityOffence |
| 12 | `get_chargesheet_status` | `crime_no: string` | ChargesheetDetails |
| 13 | `get_cases_by_court` | `court_name: string` | CaseMaster → Court |
| 14 | *(add more here)* | | |

**Open questions to resolve together:**
- [ ] Do we support combining multiple filters in one intent (e.g., district + crimehead + date range together), or keep each intent single-purpose and let Person B chain calls?
- [ ] For `get_accused_network`, what depth of relationship do we return — direct case co-occurrence only, or multi-hop?
- [ ] Do date parameters ever need to be relative (e.g., "last month") — resolved by Person B before calling, or does Person A accept relative strings too? **Recommend: Person B always resolves to explicit `YYYY-MM-DD` before calling — keeps Person A's function simple.**

---

## 5. Context / follow-up handling

- State carried between turns: **last resolved `intent` + `parameters`**, stored by Person B (client-side or session object), NOT by Person A's function (each backend call is stateless).
- A follow-up like "what about last month?" means: Person B re-sends the same `intent` with `date_from`/`date_to` overridden, same `conversation_id`, incremented `turn_id`.
- Person A's function does not need to know about conversation history at all — it only ever sees one fully-resolved request at a time. This keeps the backend simple and testable in isolation.

---

## 6. Evidence / explainability requirement

Every successful response must include `evidence.source_tables` and `evidence.query_summary` (see Section 3). This satisfies the "Explainable AI with audit trails" requirement from the problem statement and should never be skipped, even for simple lookups.

---

## 7. Field naming reference (from ER diagram → API field names)

To avoid inconsistent naming between the two of you, use these API field names consistently whenever schema fields are exposed in a response:

| Schema column | API field name |
|---|---|
| CaseMasterID | `case_master_id` |
| CrimeNo | `crime_no` |
| CaseNo | `case_no` |
| CrimeRegisteredDate | `crime_registered_date` |
| District.DistrictName | `district_name` |
| Unit.UnitName | `unit_name` |
| CrimeHead.CrimeGroupName | `crime_head` |
| CrimeSubHead.CrimeHeadName | `crime_subhead` |
| CaseStatusMaster.CaseStatusName | `case_status` |
| GravityOffence.LookupValue | `gravity_offence` |
| Court.CourtName | `court_name` |
| Accused.AccusedName | `accused_name` |
| Accused.PersonID | `accused_person_id` (e.g. "A1") |
| Victim.VictimName | `victim_name` |
| Employee.FirstName | `employee_name` |
| Employee.KGID | `kgid` |
| Act.ShortName | `act_short_name` |
| Section.SectionCode | `section_code` |

---

## 8. Sign-off

Once both people agree on Sections 2–4, mark this frozen and do not change intent names or parameter keys without notifying the other person directly (not just a group chat message that might get missed).

- [ ] Person A confirms backend can support all listed intents against the real schema
- [ ] Person B confirms this parameter/response shape is workable for the LLM/prompt layer
- [ ] Frozen on: __________ (date)
