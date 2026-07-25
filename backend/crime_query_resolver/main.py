"""
crime_query_resolver - Person A's backend Function
Resolves { intent, parameters } -> structured JSON response, per PS1_API_Contract_Spec.md

All 15 frozen intents implemented:
  get_case_by_crimeno, get_cases_by_district, get_cases_by_status,
  get_case_victims, get_accused_by_case, search_accused_by_name,
  get_accused_network, get_arrests_by_officer, get_cases_by_crimehead,
  get_cases_by_act_section, get_repeat_offenders, get_cases_by_gravity,
  get_chargesheet_status, get_cases_by_court, get_mo_matches
"""

import json
import zcatalyst_sdk


# ---------------------------------------------------------------------------
# Low-level helpers
# ---------------------------------------------------------------------------

def zq(zcql_service, query):
    """Run a ZCQL query and return a flat list of row-dicts (unwrapped from
    the {table_name: {...}} nesting ZCQL responses come in)."""
    raw = zcql_service.execute_query(query)
    rows = []
    for r in raw:
        # each row is like {"CaseMaster": {...columns..., "ROWID": "..."}}
        # take the single inner dict regardless of table name
        inner = list(r.values())[0]
        rows.append(inner)
    return rows


def esc(value):
    """Escape a string value for safe use inside a ZCQL query string."""
    return str(value).replace("'", "''")


# ---------------------------------------------------------------------------
# Response builders (per the frozen contract)
# ---------------------------------------------------------------------------

def success(intent, results, source_tables, query_summary):
    return {
        "status": "success",
        "intent": intent,
        "result_count": len(results),
        "results": results,
        "evidence": {
            "source_tables": source_tables,
            "query_summary": query_summary,
        },
        "error": None,
    }


def error(intent, code, message):
    return {
        "status": "error",
        "intent": intent,
        "result_count": 0,
        "results": [],
        "evidence": None,
        "error": {"code": code, "message": message},
    }


# ---------------------------------------------------------------------------
# Shared lookup helpers (used across multiple intents)
# ---------------------------------------------------------------------------

def case_to_api_row(zcql, case_row):
    """Convert a raw CaseMaster row into the API field-name shape from the
    contract spec (Section 7), resolving lookup names via their ROWIDs."""

    def lookup_name(table, rowid, name_col):
        if not rowid:
            return None
        rows = zq(zcql, f"SELECT {name_col} FROM {table} WHERE ROWID = {rowid}")
        return rows[0][name_col] if rows else None

    unit_rowid = case_row.get("PoliceStationID")
    unit_name = None
    district_name = None
    if unit_rowid:
        u = zq(zcql, f"SELECT UnitName, DistrictID FROM Unit WHERE ROWID = {unit_rowid}")
        if u:
            unit_name = u[0]["UnitName"]
            district_name = lookup_name("District", u[0]["DistrictID"], "DistrictName")

    crimehead = lookup_name("CrimeHead", case_row.get("CrimeMajorHeadID"), "CrimeGroupName")
    crimesubhead = lookup_name("CrimeSubHead", case_row.get("CrimeMinorHeadID"), "CrimeHeadName")
    case_status = lookup_name("CaseStatusMaster", case_row.get("CaseStatusID"), "CaseStatusName")
    gravity = lookup_name("GravityOffence", case_row.get("GravityOffenceID"), "LookupValue")
    court_name = lookup_name("Court", case_row.get("CourtID"), "CourtName")

    return {
        "case_master_id": case_row.get("CaseMasterID"),
        "crime_no": case_row.get("CrimeNo"),
        "case_no": case_row.get("CaseNo"),
        "crime_registered_date": case_row.get("CrimeRegisteredDate"),
        "crime_head": crimehead,
        "crime_subhead": crimesubhead,
        "unit_name": unit_name,
        "district_name": district_name,
        "case_status": case_status,
        "gravity_offence": gravity,
        "court_name": court_name,
        "latitude": case_row.get("latitude"),
        "longitude": case_row.get("longitude"),
        "brief_facts": case_row.get("BriefFacts"),
    }


# ---------------------------------------------------------------------------
# Intent handlers
# ---------------------------------------------------------------------------

def h_get_case_by_crimeno(zcql, params):
    crime_no = params.get("crime_no")
    if not crime_no:
        return error("get_case_by_crimeno", "MISSING_PARAMETER", "crime_no is required")

    rows = zq(zcql, f"SELECT * FROM CaseMaster WHERE CrimeNo = '{esc(crime_no)}'")
    results = [case_to_api_row(zcql, r) for r in rows]
    return success("get_case_by_crimeno", results,
                    ["CaseMaster", "Unit", "District", "CrimeHead", "CrimeSubHead",
                     "CaseStatusMaster", "GravityOffence", "Court"],
                    f"Looked up CaseMaster where CrimeNo = '{crime_no}'")


def h_get_cases_by_district(zcql, params):
    district_name = params.get("district_name")
    if not district_name:
        return error("get_cases_by_district", "MISSING_PARAMETER", "district_name is required")

    d = zq(zcql, f"SELECT ROWID FROM District WHERE DistrictName = '{esc(district_name)}'")
    if not d:
        return success("get_cases_by_district", [], ["District"],
                        f"No district found matching '{district_name}'")
    district_rowid = d[0]["ROWID"]

    units = zq(zcql, f"SELECT ROWID FROM Unit WHERE DistrictID = {district_rowid}")
    unit_rowids = [u["ROWID"] for u in units]

    date_from = params.get("date_from")
    date_to = params.get("date_to")

    all_cases = []
    for uid in unit_rowids:
        q = f"SELECT * FROM CaseMaster WHERE PoliceStationID = {uid}"
        if date_from:
            q += f" AND CrimeRegisteredDate >= '{esc(date_from)}'"
        if date_to:
            q += f" AND CrimeRegisteredDate <= '{esc(date_to)}'"
        all_cases.extend(zq(zcql, q))

    results = [case_to_api_row(zcql, r) for r in all_cases]
    summary = f"Filtered CaseMaster joined to Unit/District where DistrictName = '{district_name}'"
    if date_from or date_to:
        summary += f", date range {date_from or '...'} to {date_to or '...'}"
    return success("get_cases_by_district", results,
                    ["CaseMaster", "Unit", "District"], summary)


def h_get_cases_by_status(zcql, params):
    status_name = params.get("case_status_name")
    if not status_name:
        return error("get_cases_by_status", "MISSING_PARAMETER", "case_status_name is required")

    s = zq(zcql, f"SELECT ROWID FROM CaseStatusMaster WHERE CaseStatusName = '{esc(status_name)}'")
    if not s:
        return success("get_cases_by_status", [], ["CaseStatusMaster"],
                        f"No case status found matching '{status_name}'")
    status_rowid = s[0]["ROWID"]

    rows = zq(zcql, f"SELECT * FROM CaseMaster WHERE CaseStatusID = {status_rowid}")
    results = [case_to_api_row(zcql, r) for r in rows]
    return success("get_cases_by_status", results,
                    ["CaseMaster", "CaseStatusMaster"],
                    f"Filtered CaseMaster joined to CaseStatusMaster where CaseStatusName = '{status_name}'")


def h_get_case_victims(zcql, params):
    crime_no = params.get("crime_no")
    case_master_id = params.get("case_master_id")
    if not crime_no and not case_master_id:
        return error("get_case_victims", "MISSING_PARAMETER",
                      "crime_no or case_master_id is required")

    if crime_no:
        c = zq(zcql, f"SELECT ROWID FROM CaseMaster WHERE CrimeNo = '{esc(crime_no)}'")
    else:
        c = zq(zcql, f"SELECT ROWID FROM CaseMaster WHERE CaseMasterID = {int(case_master_id)}")
    if not c:
        return success("get_case_victims", [], ["CaseMaster"], "No matching case found")
    case_rowid = c[0]["ROWID"]

    rows = zq(zcql, f"SELECT * FROM Victim WHERE CaseMasterID = {case_rowid}")
    results = [{
        "victim_master_id": r.get("VictimMasterID"),
        "victim_name": r.get("VictimName"),
        "age_year": r.get("AgeYear"),
        "gender_id": r.get("GenderID"),
    } for r in rows]
    return success("get_case_victims", results, ["CaseMaster", "Victim"],
                    f"Filtered Victim where CaseMasterID matches the resolved case")


def h_get_accused_by_case(zcql, params):
    crime_no = params.get("crime_no")
    case_master_id = params.get("case_master_id")
    if not crime_no and not case_master_id:
        return error("get_accused_by_case", "MISSING_PARAMETER",
                      "crime_no or case_master_id is required")

    if crime_no:
        c = zq(zcql, f"SELECT ROWID FROM CaseMaster WHERE CrimeNo = '{esc(crime_no)}'")
    else:
        c = zq(zcql, f"SELECT ROWID FROM CaseMaster WHERE CaseMasterID = {int(case_master_id)}")
    if not c:
        return success("get_accused_by_case", [], ["CaseMaster"], "No matching case found")
    case_rowid = c[0]["ROWID"]

    rows = zq(zcql, f"SELECT * FROM Accused WHERE CaseMasterID = {case_rowid}")
    results = [{
        "accused_master_id": r.get("AccusedMasterID"),
        "accused_name": r.get("AccusedName"),
        "age_year": r.get("AgeYear"),
        "gender_id": r.get("GenderID"),
        "accused_person_id": r.get("PersonID"),
    } for r in rows]
    return success("get_accused_by_case", results, ["CaseMaster", "Accused"],
                    f"Filtered Accused where CaseMasterID matches the resolved case")


def h_search_accused_by_name(zcql, params):
    name = params.get("name")
    if not name:
        return error("search_accused_by_name", "MISSING_PARAMETER", "name is required")

    district_name = params.get("district_name")
    age_range = params.get("age_range")  # e.g. "20-30", optional

    rows = zq(zcql, f"SELECT * FROM Accused WHERE AccusedName LIKE '*{esc(name)}*'")

    if age_range and "-" in str(age_range):
        lo, hi = str(age_range).split("-")
        rows = [r for r in rows if r.get("AgeYear") is not None
                and int(lo) <= int(r["AgeYear"]) <= int(hi)]

    results = []
    for r in rows:
        case = zq(zcql, f"SELECT * FROM CaseMaster WHERE ROWID = {r['CaseMasterID']}")
        if not case:
            continue
        case_api = case_to_api_row(zcql, case[0])
        if district_name and case_api["district_name"] != district_name:
            continue
        results.append({
            "accused_master_id": r.get("AccusedMasterID"),
            "accused_name": r.get("AccusedName"),
            "age_year": r.get("AgeYear"),
            "gender_id": r.get("GenderID"),
            "accused_person_id": r.get("PersonID"),
            "case_master_id": case_api["case_master_id"],
            "crime_no": case_api["crime_no"],
            "district_name": case_api["district_name"],
        })

    return success("search_accused_by_name", results, ["Accused", "CaseMaster", "Unit", "District"],
                    f"Searched Accused where AccusedName contains '{name}'"
                    + (f", district '{district_name}'" if district_name else "")
                    + (f", age range {age_range}" if age_range else ""))


def h_get_accused_network(zcql, params):
    accused_master_id = params.get("accused_master_id")
    case_master_id = params.get("case_master_id")
    if not accused_master_id and not case_master_id:
        return error("get_accused_network", "MISSING_PARAMETER",
                      "accused_master_id or case_master_id is required")

    if accused_master_id:
        base = zq(zcql, f"SELECT * FROM Accused WHERE AccusedMasterID = {int(accused_master_id)}")
    else:
        base = zq(zcql, f"SELECT * FROM Accused WHERE CaseMasterID IN "
                         f"(SELECT ROWID FROM CaseMaster WHERE CaseMasterID = {int(case_master_id)})")
        # fallback if subquery unsupported:
        if not base:
            c = zq(zcql, f"SELECT ROWID FROM CaseMaster WHERE CaseMasterID = {int(case_master_id)}")
            if c:
                base = zq(zcql, f"SELECT * FROM Accused WHERE CaseMasterID = {c[0]['ROWID']}")

    if not base:
        return success("get_accused_network", [], ["Accused"], "No matching accused/case found")

    anchor = base[0]
    network = {}  # keyed by AccusedMasterID to dedupe

    # 1. Co-accused: others in the same case
    co_accused = zq(zcql, f"SELECT * FROM Accused WHERE CaseMasterID = {anchor['CaseMasterID']}")
    for r in co_accused:
        if r.get("AccusedMasterID") != anchor.get("AccusedMasterID"):
            network[r["AccusedMasterID"]] = {**r, "_link": "co_accused_same_case"}

    # 2. Same identity across other cases (name + age + gender match)
    if anchor.get("AccusedName"):
        same_name = zq(zcql, f"SELECT * FROM Accused WHERE AccusedName = '{esc(anchor['AccusedName'])}'")
        for r in same_name:
            if (r.get("AccusedMasterID") != anchor.get("AccusedMasterID")
                    and r.get("GenderID") == anchor.get("GenderID")
                    and r.get("AgeYear") is not None and anchor.get("AgeYear") is not None
                    and abs(int(r["AgeYear"]) - int(anchor["AgeYear"])) <= 1):
                network[r["AccusedMasterID"]] = {**r, "_link": "same_person_other_case"}

    results = []
    for r in network.values():
        case = zq(zcql, f"SELECT CrimeNo FROM CaseMaster WHERE ROWID = {r['CaseMasterID']}")
        results.append({
            "accused_master_id": r.get("AccusedMasterID"),
            "accused_name": r.get("AccusedName"),
            "age_year": r.get("AgeYear"),
            "gender_id": r.get("GenderID"),
            "link_type": r.get("_link"),
            "crime_no": case[0]["CrimeNo"] if case else None,
        })

    return success("get_accused_network", results, ["Accused", "CaseMaster"],
                    "Found co-accused in the same case and matching name+age+gender across other cases "
                    "(direct co-occurrence only, no multi-hop)")


def h_get_arrests_by_officer(zcql, params):
    employee_name = params.get("employee_name")
    kgid = params.get("kgid")
    if not employee_name and not kgid:
        return error("get_arrests_by_officer", "MISSING_PARAMETER",
                      "employee_name or kgid is required")

    if kgid:
        e = zq(zcql, f"SELECT ROWID FROM Employee WHERE KGID = '{esc(kgid)}'")
    else:
        e = zq(zcql, f"SELECT ROWID FROM Employee WHERE FirstName LIKE '*{esc(employee_name)}*'")
    if not e:
        return success("get_arrests_by_officer", [], ["Employee"], "No matching officer found")
    emp_rowid = e[0]["ROWID"]

    rows = zq(zcql, f"SELECT * FROM ArrestSurrender WHERE IOID = {emp_rowid}")
    results = []
    for r in rows:
        case = zq(zcql, f"SELECT CrimeNo FROM CaseMaster WHERE ROWID = {r['CaseMasterID']}")
        acc_rowid = r.get("AccusedMasterID")
        real_accused_id = None
        if acc_rowid:
            acc = zq(zcql, f"SELECT AccusedMasterID FROM Accused WHERE ROWID = {acc_rowid}")
            if acc:
                real_accused_id = acc[0]["AccusedMasterID"]
        results.append({
            "arrest_surrender_id": r.get("ArrestSurrenderID"),
            "crime_no": case[0]["CrimeNo"] if case else None,
            "arrest_surrender_date": r.get("ArrestSurrenderDate"),
            "accused_master_id": real_accused_id,
        })

    return success("get_arrests_by_officer", results, ["ArrestSurrender", "Employee", "CaseMaster"],
                    f"Filtered ArrestSurrender where IOID matches officer "
                    f"'{kgid or employee_name}'")


def h_get_cases_by_crimehead(zcql, params):
    crime_head = params.get("crime_head")
    crime_subhead = params.get("crime_subhead")
    if not crime_head and not crime_subhead:
        return error("get_cases_by_crimehead", "MISSING_PARAMETER",
                      "crime_head or crime_subhead is required")

    all_cases = []
    if crime_subhead:
        sh = zq(zcql, f"SELECT ROWID FROM CrimeSubHead WHERE CrimeHeadName = '{esc(crime_subhead)}'")
        if sh:
            all_cases = zq(zcql, f"SELECT * FROM CaseMaster WHERE CrimeMinorHeadID = {sh[0]['ROWID']}")
    else:
        ch = zq(zcql, f"SELECT ROWID FROM CrimeHead WHERE CrimeGroupName = '{esc(crime_head)}'")
        if ch:
            all_cases = zq(zcql, f"SELECT * FROM CaseMaster WHERE CrimeMajorHeadID = {ch[0]['ROWID']}")

    results = [case_to_api_row(zcql, r) for r in all_cases]
    return success("get_cases_by_crimehead", results, ["CaseMaster", "CrimeHead", "CrimeSubHead"],
                    f"Filtered CaseMaster where crime_subhead='{crime_subhead}'" if crime_subhead
                    else f"Filtered CaseMaster where crime_head='{crime_head}'")


def h_get_cases_by_act_section(zcql, params):
    act_short_name = params.get("act_short_name")
    section_code = params.get("section_code")
    if not act_short_name and not section_code:
        return error("get_cases_by_act_section", "MISSING_PARAMETER",
                      "act_short_name or section_code is required")

    act_rowid = None
    if act_short_name:
        a = zq(zcql, f"SELECT ROWID FROM Act WHERE ShortName = '{esc(act_short_name)}'")
        if a:
            act_rowid = a[0]["ROWID"]

    assoc_rows = []
    if act_rowid and section_code:
        s = zq(zcql, f"SELECT ROWID FROM Section WHERE SectionCode = '{esc(section_code)}' "
                     f"AND ActCode = {act_rowid}")
        if s:
            assoc_rows = zq(zcql, f"SELECT * FROM ActSectionAssociation WHERE ActID = {act_rowid} "
                                   f"AND SectionID = {s[0]['ROWID']}")
    elif act_rowid:
        assoc_rows = zq(zcql, f"SELECT * FROM ActSectionAssociation WHERE ActID = {act_rowid}")

    results = []
    for a in assoc_rows:
        case = zq(zcql, f"SELECT * FROM CaseMaster WHERE ROWID = {a['CaseMasterID']}")
        if case:
            results.append(case_to_api_row(zcql, case[0]))

    return success("get_cases_by_act_section", results,
                    ["ActSectionAssociation", "Act", "Section", "CaseMaster"],
                    f"Filtered ActSectionAssociation for act='{act_short_name}', section='{section_code}'")


def h_get_repeat_offenders(zcql, params):
    district_name = params.get("district_name")
    date_from = params.get("date_from")
    date_to = params.get("date_to")

    all_accused = zq(zcql, "SELECT * FROM Accused")

    # optionally filter by district/date via each accused's case
    filtered = []
    for r in all_accused:
        if not district_name and not date_from and not date_to:
            filtered.append(r)
            continue
        case = zq(zcql, f"SELECT * FROM CaseMaster WHERE ROWID = {r['CaseMasterID']}")
        if not case:
            continue
        c = case[0]
        if district_name:
            api = case_to_api_row(zcql, c)
            if api["district_name"] != district_name:
                continue
        if date_from and c.get("CrimeRegisteredDate", "") < date_from:
            continue
        if date_to and c.get("CrimeRegisteredDate", "") > date_to:
            continue
        filtered.append(r)

    # group by (name, age, gender) as an approximation of "same person"
    groups = {}
    for r in filtered:
        key = (r.get("AccusedName"), r.get("AgeYear"), r.get("GenderID"))
        groups.setdefault(key, []).append(r)

    results = []
    for (name, age, gender), members in groups.items():
        if len(members) > 1:
            case_ids = []
            for m in members:
                case = zq(zcql, f"SELECT CrimeNo FROM CaseMaster WHERE ROWID = {m['CaseMasterID']}")
                if case:
                    case_ids.append(case[0]["CrimeNo"])
            results.append({
                "accused_name": name, "age_year": age, "gender_id": gender,
                "case_count": len(members), "crime_nos": case_ids,
            })

    return success("get_repeat_offenders", results, ["Accused", "CaseMaster", "Unit", "District"],
                    "Grouped Accused by name+age+gender, filtered to groups appearing in 2+ cases"
                    + (f", district '{district_name}'" if district_name else ""))


def h_get_cases_by_gravity(zcql, params):
    gravity_level = params.get("gravity_level")
    if not gravity_level:
        return error("get_cases_by_gravity", "MISSING_PARAMETER", "gravity_level is required")

    g = zq(zcql, f"SELECT ROWID FROM GravityOffence WHERE LookupValue = '{esc(gravity_level)}'")
    if not g:
        return success("get_cases_by_gravity", [], ["GravityOffence"],
                        f"No gravity level found matching '{gravity_level}'")

    rows = zq(zcql, f"SELECT * FROM CaseMaster WHERE GravityOffenceID = {g[0]['ROWID']}")
    results = [case_to_api_row(zcql, r) for r in rows]
    return success("get_cases_by_gravity", results, ["CaseMaster", "GravityOffence"],
                    f"Filtered CaseMaster where gravity_level = '{gravity_level}'")


def h_get_chargesheet_status(zcql, params):
    crime_no = params.get("crime_no")
    if not crime_no:
        return error("get_chargesheet_status", "MISSING_PARAMETER", "crime_no is required")

    c = zq(zcql, f"SELECT ROWID FROM CaseMaster WHERE CrimeNo = '{esc(crime_no)}'")
    if not c:
        return success("get_chargesheet_status", [], ["CaseMaster"], "No matching case found")
    case_rowid = c[0]["ROWID"]

    rows = zq(zcql, f"SELECT * FROM ChargesheetDetails WHERE CaseMasterID = {case_rowid}")
    cstype_map = {"A": "Chargesheet", "B": "False Case", "C": "Undetected"}
    results = [{
        "csid": r.get("CSID"),
        "csdate": r.get("csdate"),
        "cstype": cstype_map.get(r.get("cstype"), r.get("cstype")),
    } for r in rows]

    return success("get_chargesheet_status", results, ["CaseMaster", "ChargesheetDetails"],
                    f"Filtered ChargesheetDetails where CaseMasterID matches CrimeNo '{crime_no}'")


def h_get_cases_by_court(zcql, params):
    court_name = params.get("court_name")
    if not court_name:
        return error("get_cases_by_court", "MISSING_PARAMETER", "court_name is required")

    c = zq(zcql, f"SELECT ROWID FROM Court WHERE CourtName LIKE '*{esc(court_name)}*'")
    if not c:
        return success("get_cases_by_court", [], ["Court"], f"No court found matching '{court_name}'")

    all_cases = []
    for court_row in c:
        all_cases.extend(zq(zcql, f"SELECT * FROM CaseMaster WHERE CourtID = {court_row['ROWID']}"))

    results = [case_to_api_row(zcql, r) for r in all_cases]
    return success("get_cases_by_court", results, ["CaseMaster", "Court"],
                    f"Filtered CaseMaster joined to Court where CourtName contains '{court_name}'")


def h_get_mo_matches(zcql, params):
    accused_master_id = params.get("accused_master_id")
    crime_no = params.get("crime_no")
    if not accused_master_id and not crime_no:
        return error("get_mo_matches", "MISSING_PARAMETER",
                      "accused_master_id or crime_no is required")

    if crime_no:
        c = zq(zcql, f"SELECT * FROM CaseMaster WHERE CrimeNo = '{esc(crime_no)}'")
        if not c:
            return success("get_mo_matches", [], ["CaseMaster"], "No matching case found")
        anchor_case = c[0]
    else:
        acc = zq(zcql, f"SELECT * FROM Accused WHERE AccusedMasterID = {int(accused_master_id)}")
        if not acc:
            return success("get_mo_matches", [], ["Accused"], "No matching accused found")
        c = zq(zcql, f"SELECT * FROM CaseMaster WHERE ROWID = {acc[0]['CaseMasterID']}")
        if not c:
            return success("get_mo_matches", [], ["CaseMaster"], "No matching case found")
        anchor_case = c[0]

    anchor_api = case_to_api_row(zcql, anchor_case)
    open_statuses = ["Under Investigation", "Under Trial"]

    # find other cases sharing subhead + district + open status
    subhead_id = anchor_case.get("CrimeMinorHeadID")
    matches = []
    if subhead_id:
        candidates = zq(zcql, f"SELECT * FROM CaseMaster WHERE CrimeMinorHeadID = {subhead_id}")
        for cand in candidates:
            if cand.get("CaseMasterID") == anchor_case.get("CaseMasterID"):
                continue
            cand_api = case_to_api_row(zcql, cand)
            if (cand_api["district_name"] == anchor_api["district_name"]
                    and cand_api["case_status"] in open_statuses):
                matches.append({
                    "case_master_id": cand_api["case_master_id"],
                    "crime_no": cand_api["crime_no"],
                    "crime_subhead": cand_api["crime_subhead"],
                    "district_name": cand_api["district_name"],
                    "case_status": cand_api["case_status"],
                    "match_reason": "same_crime_subhead_district_open_status",
                })

    return success("get_mo_matches", matches, ["CaseMaster"],
                    f"Found cases sharing crime_subhead='{anchor_api['crime_subhead']}', "
                    f"district='{anchor_api['district_name']}', with open status "
                    f"(factual pattern match, not a prediction)")


# ---------------------------------------------------------------------------
# Dispatch table
# ---------------------------------------------------------------------------

INTENT_HANDLERS = {
    "get_case_by_crimeno": h_get_case_by_crimeno,
    "get_cases_by_district": h_get_cases_by_district,
    "get_cases_by_status": h_get_cases_by_status,
    "get_case_victims": h_get_case_victims,
    "get_accused_by_case": h_get_accused_by_case,
    "search_accused_by_name": h_search_accused_by_name,
    "get_accused_network": h_get_accused_network,
    "get_arrests_by_officer": h_get_arrests_by_officer,
    "get_cases_by_crimehead": h_get_cases_by_crimehead,
    "get_cases_by_act_section": h_get_cases_by_act_section,
    "get_repeat_offenders": h_get_repeat_offenders,
    "get_cases_by_gravity": h_get_cases_by_gravity,
    "get_chargesheet_status": h_get_chargesheet_status,
    "get_cases_by_court": h_get_cases_by_court,
    "get_mo_matches": h_get_mo_matches,
}


def handler(context, basicio):
    app = zcatalyst_sdk.initialize()
    zcql = app.zcql()

    try:
        intent = basicio.get_argument("intent")
        parameters = basicio.get_argument("parameters") or {}
    except Exception:
        intent = None
        parameters = {}

    if not intent:
        resp = error("unknown", "MISSING_PARAMETER", "intent is required")
    elif intent not in INTENT_HANDLERS:
        resp = error(intent, "UNKNOWN_INTENT", f"Intent '{intent}' is not recognized")
    else:
        try:
            resp = INTENT_HANDLERS[intent](zcql, parameters)
        except Exception as e:
            context.log(f"Error resolving intent {intent}: {e}")
            resp = error(intent, "INTERNAL_ERROR", str(e))

    basicio.write(json.dumps(resp))
    context.close()