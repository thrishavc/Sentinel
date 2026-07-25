# Finalized Intent Table & Parameter Schemas
## For Person B — matches actual `crime_query_resolver` implementation

All 15 intents are built and being tested against real seed data. Send this to replace the earlier draft — a few parameter details were refined during implementation.

**Request shape (unchanged):**
```json
{ "intent": "...", "parameters": { ... }, "conversation_id": "...", "turn_id": 1 }
```

**Response shape (unchanged):**
```json
{ "status": "success|error", "intent": "...", "result_count": N, "results": [...],
  "evidence": { "source_tables": [...], "query_summary": "..." }, "error": null }
```
`result_count: 0` + `status: success` = genuinely no match. `error` is only for malformed requests (`MISSING_PARAMETER`, `UNKNOWN_INTENT`, `INTERNAL_ERROR`).

---

## 1. get_case_by_crimeno
**Params:** `crime_no` (string, required)
**Returns:** array of case objects (case_master_id, crime_no, case_no, crime_registered_date, crime_head, crime_subhead, unit_name, district_name, case_status, gravity_offence, court_name, latitude, longitude, brief_facts)

## 2. get_cases_by_district
**Params:** `district_name` (string, required), `date_from` (string, optional, `YYYY-MM-DD`), `date_to` (string, optional)
**Returns:** array of case objects (same shape as #1)

## 3. get_cases_by_status
**Params:** `case_status_name` (string, required) — one of: `Under Investigation`, `Charge Sheeted`, `Closed`, `Under Trial`, `FR Filed`
**Returns:** array of case objects

## 4. get_case_victims
**Params:** `crime_no` (string) **OR** `case_master_id` (int) — one required
**Returns:** array of `{ victim_master_id, victim_name, age_year, gender_id }`

## 5. get_accused_by_case
**Params:** `crime_no` (string) **OR** `case_master_id` (int) — one required
**Returns:** array of `{ accused_master_id, accused_name, age_year, gender_id, accused_person_id }`

## 6. search_accused_by_name
**Params:** `name` (string, required, partial match supported), `district_name` (string, optional), `age_range` (string, optional, format `"20-30"`)
**Returns:** array of `{ accused_master_id, accused_name, age_year, gender_id, accused_person_id, case_master_id, crime_no, district_name }`
**Note:** returns *all* candidate matches — if 2+ come back, Person B should ask the user "which one?" rather than picking automatically.

## 7. get_accused_network
**Params:** `accused_master_id` (int) **OR** `case_master_id` (int) — one required
**Returns:** array of `{ accused_master_id, accused_name, age_year, gender_id, link_type, crime_no }`
**`link_type` values:** `"co_accused_same_case"` (other accused in the same FIR) or `"same_person_other_case"` (matched via name+age±1+gender across different cases). Direct co-occurrence only — no multi-hop.

## 8. get_arrests_by_officer
**Params:** `employee_name` (string, partial match) **OR** `kgid` (string, exact match) — one required
**Returns:** array of `{ arrest_surrender_id, crime_no, arrest_surrender_date, accused_master_id }`

## 9. get_cases_by_crimehead
**Params:** `crime_head` (string, optional) **OR** `crime_subhead` (string, optional) — one required. If both given, `crime_subhead` takes priority.
**Returns:** array of case objects

## 10. get_cases_by_act_section
**Params:** `act_short_name` (string, optional), `section_code` (string, optional) — at least one required
**Returns:** array of case objects

## 11. get_repeat_offenders
**Params:** `district_name` (string, optional), `date_from` (string, optional), `date_to` (string, optional) — all optional, can be called with `{}`
**Returns:** array of `{ accused_name, age_year, gender_id, case_count, crime_nos: [...] }` — only includes people appearing in 2+ cases (grouped by exact name+age+gender match)

## 12. get_cases_by_gravity
**Params:** `gravity_level` (string, required) — `"Heinous"` or `"Non-Heinous"`
**Returns:** array of case objects

## 13. get_chargesheet_status
**Params:** `crime_no` (string, required)
**Returns:** array of `{ csid, csdate, cstype }` — `cstype` is human-readable: `"Chargesheet"`, `"False Case"`, or `"Undetected"`. Empty array if case hasn't reached chargesheet stage yet (this is normal, not an error).

## 14. get_cases_by_court
**Params:** `court_name` (string, required, partial match supported)
**Returns:** array of case objects

## 15. get_mo_matches
**Params:** `accused_master_id` (int) **OR** `crime_no` (string) — one required
**Returns:** array of `{ case_master_id, crime_no, crime_subhead, district_name, case_status, match_reason }`
**Logic:** finds other *open* cases (`Under Investigation` or `Under Trial`) sharing the same `crime_subhead` + `district_name` as the anchor case. This is a factual pattern match, not a prediction — `match_reason` is always `"same_crime_subhead_district_open_status"` in this version.

---

## Testing status
Verified working against real seed data as of now: `get_cases_by_gravity`, `get_cases_by_status`, `get_chargesheet_status`, `get_cases_by_court`, `get_cases_by_crimehead`. Remaining intents are implemented and being tested now — will confirm once fully verified.

## One thing worth flagging to Person B directly
`search_accused_by_name` and `get_arrests_by_officer`'s name-matching only just got fixed (ZCQL uses `*` wildcards internally, not `%`) — functionally this doesn't change anything on Person B's side, just noting in case fuzzy-match behavior seemed off in any earlier informal testing.
