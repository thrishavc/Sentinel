"""
Conversational_engine - Conversational AI Engine Function for Sentinel (Advanced I/O & Basic I/O compatible)
Resolves natural language { query, conversation_id, turn_id } -> structured JSON response with extracted_payload, per frontend contract.
"""

import json
import re
import zcatalyst_sdk


# ---------------------------------------------------------------------------
# Low-level ZCQL helpers
# ---------------------------------------------------------------------------

def zq(zcql_service, query):
    """Run a ZCQL query and return a flat list of row-dicts."""
    raw = zcql_service.execute_query(query)
    rows = []
    for r in raw:
        inner = list(r.values())[0]
        rows.append(inner)
    return rows


def esc(value):
    """Escape a string value for safe use inside a ZCQL query string."""
    return str(value).replace("'", "''")


def case_to_api_row(zcql, case_row):
    """Convert a raw CaseMaster row into standard API shape."""
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
# Intent resolution & Handlers
# ---------------------------------------------------------------------------

def h_search_accused_by_name(zcql, params):
    name = params.get("name")
    district_name = params.get("district_name")
    if not name:
        return {"results": [], "source_tables": ["Accused"], "summary": "Missing name parameter"}

    rows = zq(zcql, f"SELECT * FROM Accused WHERE AccusedName LIKE '*{esc(name)}*'")
    results = []
    for r in rows:
        case = zq(zcql, f"SELECT * FROM CaseMaster WHERE ROWID = {r['CaseMasterID']}")
        if not case:
            continue
        case_api = case_to_api_row(zcql, case[0])
        if district_name and case_api["district_name"] and district_name.lower() not in case_api["district_name"].lower():
            continue
        results.append({
            "accused_master_id": r.get("AccusedMasterID"),
            "accused_name": r.get("AccusedName"),
            "age_year": r.get("AgeYear"),
            "gender_id": r.get("GenderID"),
            "case_master_id": case_api["case_master_id"],
            "crime_no": case_api["crime_no"],
            "district_name": case_api["district_name"],
            "unit_name": case_api["unit_name"],
            "case_status": case_api["case_status"],
        })

    summary = f"Queried Accused table for name containing '{name}'"
    if district_name:
        summary += f" in district '{district_name}'"

    return {
        "results": results,
        "source_tables": ["Accused", "CaseMaster", "Unit", "District"],
        "summary": summary
    }


def h_get_case_by_crimeno(zcql, params):
    crime_no = params.get("crime_no")
    if not crime_no:
        return {"results": [], "source_tables": ["CaseMaster"], "summary": "Missing crime_no parameter"}

    rows = zq(zcql, f"SELECT * FROM CaseMaster WHERE CrimeNo = '{esc(crime_no)}'")
    results = [case_to_api_row(zcql, r) for r in rows]
    return {
        "results": results,
        "source_tables": ["CaseMaster", "Unit", "District", "CrimeHead", "CaseStatusMaster"],
        "summary": f"Queried CaseMaster where CrimeNo = '{crime_no}'"
    }


def h_get_cases_by_district(zcql, params):
    district_name = params.get("district_name", "Bengaluru City")
    d = zq(zcql, f"SELECT ROWID FROM District WHERE DistrictName LIKE '*{esc(district_name)}*'")
    if not d:
        return {"results": [], "source_tables": ["District"], "summary": f"No district found matching '{district_name}'"}

    district_rowid = d[0]["ROWID"]
    units = zq(zcql, f"SELECT ROWID FROM Unit WHERE DistrictID = {district_rowid}")
    unit_rowids = [u["ROWID"] for u in units]

    all_cases = []
    for uid in unit_rowids:
        all_cases.extend(zq(zcql, f"SELECT * FROM CaseMaster WHERE PoliceStationID = {uid}"))

    results = [case_to_api_row(zcql, r) for r in all_cases]
    return {
        "results": results,
        "source_tables": ["CaseMaster", "Unit", "District"],
        "summary": f"Retrieved cases for District '{district_name}' across {len(unit_rowids)} units"
    }


def h_get_cases_by_status(zcql, params):
    status_name = params.get("case_status_name", "Under Investigation")
    s = zq(zcql, f"SELECT ROWID FROM CaseStatusMaster WHERE CaseStatusName LIKE '*{esc(status_name)}*'")
    if not s:
        return {"results": [], "source_tables": ["CaseStatusMaster"], "summary": f"No status found matching '{status_name}'"}

    rows = zq(zcql, f"SELECT * FROM CaseMaster WHERE CaseStatusID = {s[0]['ROWID']}")
    results = [case_to_api_row(zcql, r) for r in rows]
    return {
        "results": results,
        "source_tables": ["CaseMaster", "CaseStatusMaster"],
        "summary": f"Filtered CaseMaster joined to CaseStatusMaster for status '{status_name}'"
    }


def resolve_query_intent(query):
    """Simple NLU query intent parser for conversational queries."""
    if not query:
        return "get_cases_by_district", {"district_name": "Bengaluru City"}

    q_lower = query.lower()

    # 1. Crime No / FIR search
    cno_match = re.search(r'\b(fir|case|crime)\s*(no|number|#)?\s*[:=]?\s*([0-9]{1,4}/[0-9]{4})\b', q_lower)
    if cno_match:
        return "get_case_by_crimeno", {"crime_no": cno_match.group(3)}

    # 2. Accused search by name
    name_match = re.search(r'\b(accused|suspect|person|named|name)\s+([a-zA-Z]+)', q_lower)
    if name_match:
        name = name_match.group(2)
        dist = None
        if "bengaluru" in q_lower or "bangalore" in q_lower:
            dist = "Bengaluru City"
        elif "mysuru" in q_lower or "mysore" in q_lower:
            dist = "Mysuru City"
        elif "mangaluru" in q_lower or "mangalore" in q_lower:
            dist = "Mangaluru City"
        return "search_accused_by_name", {"name": name, "district_name": dist}

    # If query mentions a specific name directly
    words = [w.capitalize() for w in query.split() if len(w) > 3 and w.lower() not in ["find", "show", "get", "case", "cases", "named", "with", "from", "district", "accused", "suspect"]]
    if words:
        dist = "Bengaluru City" if ("bengaluru" in q_lower or "bangalore" in q_lower) else None
        return "search_accused_by_name", {"name": words[0], "district_name": dist}

    # 3. District search
    if "district" in q_lower or "bengaluru" in q_lower or "mysuru" in q_lower or "hubballi" in q_lower:
        dist_name = "Bengaluru City"
        if "mysuru" in q_lower:
            dist_name = "Mysuru City"
        elif "hubballi" in q_lower or "dharwad" in q_lower:
            dist_name = "Hubballi Dharwad City"
        return "get_cases_by_district", {"district_name": dist_name}

    # Default to district query
    return "get_cases_by_district", {"district_name": "Bengaluru City"}


def generate_nlg_output(intent, query, res_data):
    results = res_data.get("results", [])
    count = len(results)

    if count == 0:
        return f"No matching crime records or accused details were found for your query: \"{query}\". Please verify the suspect name, FIR number, or district and try again."

    if intent == "search_accused_by_name":
        first = results[0]
        name = first.get("accused_name", "Suspect")
        dist = first.get("district_name") or "Karnataka"
        cno = first.get("crime_no") or "N/A"
        return f"Found {count} record(s) matching suspect \"{name}\" in {dist}, linked to Crime No. {cno}. Detailed case profiles and network connections have been retrieved below."

    if intent == "get_case_by_crimeno":
        first = results[0]
        cno = first.get("crime_no", "N/A")
        unit = first.get("unit_name", "Police Station")
        dist = first.get("district_name", "District")
        status = first.get("case_status", "Under Investigation")
        head = first.get("crime_head", "IPC Offence")
        return f"Case {cno} registered at {unit}, {dist} under {head}. Current investigation status: {status}."

    if intent == "get_cases_by_district":
        first = results[0]
        dist = first.get("district_name", "the requested district")
        return f"Retrieved {count} active case record(s) registered under {dist} jurisdiction across police stations."

    return f"Retrieved {count} relevant record(s) matching your investigation query."


# ---------------------------------------------------------------------------
# CORS helper
# ---------------------------------------------------------------------------

def apply_cors_headers(target):
    if not target:
        return
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept'
    }
    if hasattr(target, 'set_header') and callable(getattr(target, 'set_header')):
        for k, v in headers.items():
            try:
                target.set_header(k, v)
            except Exception:
                pass
    if hasattr(target, 'set_response_header') and callable(getattr(target, 'set_response_header')):
        for k, v in headers.items():
            try:
                target.set_response_header(k, v)
            except Exception:
                pass
    if hasattr(target, 'headers') and isinstance(target.headers, dict):
        for k, v in headers.items():
            target.headers[k] = v


# ---------------------------------------------------------------------------
# Main Handler Entrypoint (Advanced I/O and Basic I/O signature support)
# ---------------------------------------------------------------------------

def handler(arg1, arg2):
    print("=== CONVERSATIONAL_ENGINE FUNCTION INVOKED ===")

    req = arg1
    res = arg2

    apply_cors_headers(res)
    apply_cors_headers(req)

    method = None
    try:
        if hasattr(req, 'get_request_method') and callable(getattr(req, 'get_request_method')):
            method = req.get_request_method()
        elif hasattr(req, 'method'):
            method = req.method
    except Exception:
        pass

    is_options = (method and str(method).upper() == 'OPTIONS')
    if not is_options:
        try:
            if hasattr(req, 'get_request_header') and callable(getattr(req, 'get_request_header')):
                if req.get_request_header('Access-Control-Request-Method') or req.get_request_header('access-control-request-method'):
                    is_options = True
        except Exception:
            pass

    if is_options:
        apply_cors_headers(res)
        apply_cors_headers(req)
        if hasattr(res, 'set_status') and callable(getattr(res, 'set_status')):
            try:
                res.set_status(200)
            except Exception:
                pass
        elif hasattr(res, 'set_status_code') and callable(getattr(res, 'set_status_code')):
            try:
                res.set_status_code(200)
            except Exception:
                pass

        if hasattr(res, 'send_json') and callable(getattr(res, 'send_json')):
            res.send_json({"status": "ok"})
        elif hasattr(res, 'send') and callable(getattr(res, 'send')):
            res.send(json.dumps({"status": "ok"}))
        elif hasattr(res, 'write') and callable(getattr(res, 'write')):
            res.write(json.dumps({"status": "ok"}))
            if hasattr(req, 'close') and callable(getattr(req, 'close')):
                req.close()
        return

    query = ""
    conversation_id = ""
    turn_id = 1

    # Extract JSON body
    if hasattr(req, 'get_json') and callable(getattr(req, 'get_json')):
        try:
            body = req.get_json()
            if body:
                query = body.get("query") or ""
                conversation_id = body.get("conversation_id") or ""
                turn_id = body.get("turn_id") or 1
        except Exception:
            pass

    if not query and hasattr(req, 'get_argument') and callable(getattr(req, 'get_argument')):
        try:
            query = req.get_argument("query") or ""
            conversation_id = req.get_argument("conversation_id") or ""
            turn_id = req.get_argument("turn_id") or 1
        except Exception:
            pass

    if not query and hasattr(req, 'get_request_body') and callable(getattr(req, 'get_request_body')):
        try:
            raw = req.get_request_body()
            if raw:
                body = json.loads(raw)
                query = body.get("query") or ""
                conversation_id = body.get("conversation_id") or ""
                turn_id = body.get("turn_id") or 1
        except Exception:
            pass

    try:
        app = zcatalyst_sdk.initialize()
        zcql = app.zcql()

        intent, params = resolve_query_intent(query)

        if intent == "search_accused_by_name":
            res_data = h_search_accused_by_name(zcql, params)
        elif intent == "get_case_by_crimeno":
            res_data = h_get_case_by_crimeno(zcql, params)
        elif intent == "get_cases_by_status":
            res_data = h_get_cases_by_status(zcql, params)
        else:
            res_data = h_get_cases_by_district(zcql, params)

        nlg_text = generate_nlg_output(intent, query, res_data)

        response_payload = {
            "status": "success",
            "conversation_id": conversation_id,
            "turn_id": turn_id,
            "extracted_payload": {
                "nlg_output": nlg_text,
                "results": res_data.get("results", []),
                "evidence": {
                    "source_tables": res_data.get("source_tables", []),
                    "query_summary": res_data.get("summary", "")
                },
                "intent": intent
            }
        }
    except Exception as err:
        print(f"Error in Conversational_engine: {err}")
        response_payload = {
            "status": "error",
            "extracted_payload": {
                "nlg_output": f"Backend processing error: {str(err)}",
                "results": [],
                "evidence": {
                    "source_tables": [],
                    "query_summary": f"Exception raised: {str(err)}"
                },
                "intent": "error"
            },
            "error": {"code": "INTERNAL_ERROR", "message": str(err)}
        }

    apply_cors_headers(res)

    if hasattr(res, 'set_status') and callable(getattr(res, 'set_status')):
        try:
            res.set_status(200)
        except Exception:
            pass
    elif hasattr(res, 'set_status_code') and callable(getattr(res, 'set_status_code')):
        try:
            res.set_status_code(200)
        except Exception:
            pass

    if hasattr(res, 'send_json') and callable(getattr(res, 'send_json')):
        res.send_json(response_payload)
    elif hasattr(res, 'send') and callable(getattr(res, 'send')):
        res.send(json.dumps(response_payload))
    elif hasattr(res, 'write') and callable(getattr(res, 'write')):
        res.write(json.dumps(response_payload))
        if hasattr(req, 'close') and callable(getattr(req, 'close')):
            req.close()
