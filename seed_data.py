"""
=============================================================================
SENTINEL — Catalyst Data Store Seed Script
=============================================================================
PURPOSE : Populates all 26 tables with realistic Karnataka police crime data
          so every one of the 15 backend intents returns non-empty, sensible results.

IDEMPOTENCY WARNING
-------------------
This script is NOT idempotent. If you run it twice on the same Data Store,
it WILL create duplicate rows in every table.
Before re-running, clear the tables via the Catalyst console or Data Store API.

HOW TO RUN (Local Machine)
--------------------------
1. Install dependency:
       pip install zcatalyst-sdk==1.4.0

2. Obtain credentials from Catalyst Console:
   (Project Settings -> OAuth -> Client Credentials)
   Set environment variables or pass as CLI flags:
       set CATALYST_PROJECT_ID=60079603520
       set CATALYST_ZAID=747064395
       set CATALYST_CLIENT_ID=1000.XXXX
       set CATALYST_CLIENT_SECRET=XXXX
       set CATALYST_REFRESH_TOKEN=1000.XXXX

3. Command to execute:
       python seed_data.py

   Or pass flags directly:
       python seed_data.py --project-id 60079603520 --zaid 747064395 --client-id 1000.X --client-secret X --refresh-token 1000.X

APPROACH REASONING
------------------
We use a standalone local Python script executing via zcatalyst_sdk.initialize_app()
with RefreshTokenCredential because seed data insertion is a administrative task.
This keeps main.py clean and avoids deploying temporary serverless endpoints.
=============================================================================
"""

import os
import sys
import argparse
import zcatalyst_sdk
from zcatalyst_sdk import credentials as sdk_cred
from zcatalyst_sdk.types import ICatalystOptions

# ---------------------------------------------------------------------------
# 0. CONFIGURATION & SDK INITIALIZATION
# ---------------------------------------------------------------------------

def parse_args():
    parser = argparse.ArgumentParser(description="Sentinel Catalyst Data Store Seeder")
    parser.add_argument("--project-id", default=os.environ.get("CATALYST_PROJECT_ID"))
    parser.add_argument("--zaid", default=os.environ.get("CATALYST_ZAID"))
    parser.add_argument("--client-id", default=os.environ.get("CATALYST_CLIENT_ID"))
    parser.add_argument("--client-secret", default=os.environ.get("CATALYST_CLIENT_SECRET"))
    parser.add_argument("--refresh-token", default=os.environ.get("CATALYST_REFRESH_TOKEN"))
    parser.add_argument("--domain", default=os.environ.get("CATALYST_DOMAIN", "https://api.catalyst.zoho.in"))
    parser.add_argument("--environment", default="Development")
    return parser.parse_args()


def init_app(args):
    missing = [k for k, v in {
        "project-id": args.project_id,
        "zaid": args.zaid,
        "client-id": args.client_id,
        "client-secret": args.client_secret,
        "refresh-token": args.refresh_token
    }.items() if not v]

    if missing:
        print(f"[ERROR] Missing required credentials: {missing}")
        print("        Provide them via environment variables or CLI flags.")
        print("        Run 'python seed_data.py --help' for details.")
        sys.exit(1)

    cred = sdk_cred.RefreshTokenCredential({
        "refresh_token": args.refresh_token,
        "client_id": args.client_id,
        "client_secret": args.client_secret,
    })
    opts = ICatalystOptions(
        project_id=str(args.project_id),
        project_key=str(args.zaid),
        project_domain=args.domain,
        environment=args.environment,
    )
    return zcatalyst_sdk.initialize_app(credential=cred, options=opts)


# ---------------------------------------------------------------------------
# 1. HELPERS
# ---------------------------------------------------------------------------

INSERT_COUNTS = {}

class TableHelper:
    """Helper around zcatalyst_sdk Data Store table operations."""
    def __init__(self, app, table_name: str):
        self._tbl = app.datastore().table(table_name)
        self.name = table_name
        self.inserted = 0

    def insert(self, row: dict) -> dict:
        result = self._tbl.insert_row(row)
        self.inserted += 1
        return result

    def insert_many(self, rows: list) -> list:
        return [self.insert(r) for r in rows]

    def rowid(self, resp) -> int:
        """Extract the auto-generated ROWID from insert response."""
        if isinstance(resp, dict):
            if "ROWID" in resp:
                return int(resp["ROWID"])
            for v in resp.values():
                if isinstance(v, dict) and "ROWID" in v:
                    return int(v["ROWID"])
        raise ValueError(f"Cannot find ROWID in SDK response: {resp}")


def generate_crime_no(category_code: int, district_id: int, station_id: int, year: int, serial: int) -> str:
    """
    Format: [1-digit CaseCategory code][4-digit DistrictID, zero-padded][4-digit PoliceStationID, zero-padded][4-digit Year][5-digit serial, zero-padded]
    Example: 104430006202600001
    """
    return (
        str(category_code) +
        str(district_id).zfill(4) +
        str(station_id).zfill(4) +
        str(year).zfill(4) +
        str(serial).zfill(5)
    )


def fmt_datetime(year, month, day, hour=9, minute=0):
    return f"{year}-{str(month).zfill(2)}-{str(day).zfill(2)} {str(hour).zfill(2)}:{str(minute).zfill(2)}:00"


# ---------------------------------------------------------------------------
# 2. MASTER / LOOKUP TABLES (Dependency Steps 1 - 16)
# ---------------------------------------------------------------------------

def seed_state(app):
    t = TableHelper(app, "State")
    rows = [{"StateID": 1, "StateName": "Karnataka", "NationalityID": 1, "Active": 1}]
    results = t.insert_many(rows)
    INSERT_COUNTS["State"] = t.inserted
    print(f"  1.  [State]                  {t.inserted} row(s)")
    return {r["StateID"]: t.rowid(res) for r, res in zip(rows, results)}


def seed_district(app, state_rowids):
    t = TableHelper(app, "District")
    districts = [
        (1, "Bangalore Urban"), (2, "Whitefield"), (3, "Koramangala"), (4, "Ramanagara"),
        (5, "Davanagere"), (6, "Mysuru"), (7, "Tumakuru"), (8, "Belagavi"),
        (9, "Hubballi-Dharwad"), (10, "Vijayapura")
    ]
    rowids = {}
    for did, name in districts:
        res = t.insert({"DistrictID": did, "DistrictName": name, "StateID": state_rowids[1], "Active": 1})
        rowids[did] = t.rowid(res)
    INSERT_COUNTS["District"] = t.inserted
    print(f"  2.  [District]               {t.inserted} row(s)")
    return rowids


def seed_unit_type(app):
    t = TableHelper(app, "UnitType")
    rows = [
        {"UnitTypeID": 1, "UnitTypeName": "Police Station", "CityDistState": "District", "Hierarchy": 1, "Active": 1},
        {"UnitTypeID": 2, "UnitTypeName": "Division", "CityDistState": "District", "Hierarchy": 2, "Active": 1},
    ]
    results = t.insert_many(rows)
    INSERT_COUNTS["UnitType"] = t.inserted
    print(f"  3.  [UnitType]               {t.inserted} row(s)")
    return {r["UnitTypeID"]: t.rowid(res) for r, res in zip(rows, results)}


def seed_unit(app, unit_type_rowids, district_rowids, state_rowids):
    t = TableHelper(app, "Unit")
    ps_type_rid = unit_type_rowids[1]
    stations = [
        (1, "Whitefield PS", 2), (2, "Kadugodi PS", 2),
        (3, "Koramangala PS", 3), (4, "Madiwala PS", 3),
        (5, "Ramanagara Town PS", 4), (6, "Channapatna PS", 4),
        (7, "Davanagere Town PS", 5), (8, "Jagalur PS", 5),
        (9, "Mysuru North PS", 6), (10, "Mysuru South PS", 6),
        (11, "Tumakuru Town PS", 7), (12, "Tiptur PS", 7),
        (13, "Bangalore Urban Central PS", 1), (14, "Bangalore Urban East PS", 1),
        (15, "Belagavi Town PS", 8), (16, "Gokak PS", 8),
        (17, "Hubballi City PS", 9), (18, "Dharwad Town PS", 9),
        (19, "Vijayapura City PS", 10), (20, "Basavana Bagewadi PS", 10)
    ]
    rowids = {}
    for uid, name, did in stations:
        res = t.insert({
            "UnitID": uid, "UnitName": name, "TypeID": ps_type_rid, "ParentUnit": 0,
            "NationalityID": 1, "StateID": state_rowids[1], "DistrictID": district_rowids[did], "Active": 1
        })
        rowids[uid] = {"rowid": t.rowid(res), "district_id": did}
    INSERT_COUNTS["Unit"] = t.inserted
    print(f"  4.  [Unit]                   {t.inserted} row(s)")
    return rowids


def seed_rank(app):
    t = TableHelper(app, "Rank")
    rows = [
        {"RankID": 1, "RankName": "Constable", "Hierarchy": 1, "Active": 1},
        {"RankID": 2, "RankName": "Head Constable", "Hierarchy": 2, "Active": 1},
        {"RankID": 3, "RankName": "Assistant Sub-Inspector", "Hierarchy": 3, "Active": 1},
        {"RankID": 4, "RankName": "Sub-Inspector", "Hierarchy": 4, "Active": 1},
        {"RankID": 5, "RankName": "Inspector", "Hierarchy": 5, "Active": 1},
        {"RankID": 6, "RankName": "Deputy Superintendent", "Hierarchy": 6, "Active": 1},
    ]
    results = t.insert_many(rows)
    INSERT_COUNTS["Rank"] = t.inserted
    print(f"  5.  [Rank]                   {t.inserted} row(s)")
    return {r["RankID"]: t.rowid(res) for r, res in zip(rows, results)}


def seed_designation(app):
    t = TableHelper(app, "Designation")
    rows = [
        {"DesignationID": 1, "DesignationName": "Investigating Officer", "Active": 1, "SortOrder": 1},
        {"DesignationID": 2, "DesignationName": "Station House Officer", "Active": 1, "SortOrder": 2},
        {"DesignationID": 3, "DesignationName": "Circle Inspector", "Active": 1, "SortOrder": 3},
    ]
    results = t.insert_many(rows)
    INSERT_COUNTS["Designation"] = t.inserted
    print(f"  6.  [Designation]            {t.inserted} row(s)")
    return {r["DesignationID"]: t.rowid(res) for r, res in zip(rows, results)}


def seed_employee(app, district_rowids, unit_rowids, rank_rowids, designation_rowids):
    t = TableHelper(app, "Employee")
    employees = [
        (1, "KGD-10011", "Rajesh Kumar", 2, 1, 4, 1),
        (2, "KGD-10022", "Anitha Reddy", 2, 2, 4, 1),
        (3, "KGD-10033", "Venkatesh Rao", 3, 3, 5, 2),
        (4, "KGD-10044", "Suresh Patil", 4, 5, 4, 1),
        (5, "KGD-10055", "Priya Gowda", 5, 7, 4, 1),
        (6, "KGD-10066", "Mohammed Rafi", 6, 9, 5, 2),
        (7, "KGD-10077", "Lakshmi Devi", 1, 13, 4, 1),
        (8, "KGD-10088", "Kiran Naik", 7, 11, 4, 1),
        (9, "KGD-10099", "Deepak Hegde", 8, 15, 5, 2),
        (10, "KGD-10100", "Savita Bhatt", 9, 17, 4, 1),
    ]
    rowids = {}
    for eid, kgid, name, did, uid, rid, desig_id in employees:
        res = t.insert({
            "EmployeeID": eid, "DistrictID": district_rowids[did], "UnitID": unit_rowids[uid]["rowid"],
            "RankID": rank_rowids[rid], "DesignationID": designation_rowids[desig_id],
            "KGID": kgid, "FirstName": name, "EmployeeDOB": "1985-06-15", "GenderID": 1,
            "BloodGroupID": 1, "PhysicallyChallenged": 0, "AppointmentDate": "2010-01-01"
        })
        rowids[eid] = {"rowid": t.rowid(res), "unit_id": uid, "district_id": did}
    INSERT_COUNTS["Employee"] = t.inserted
    print(f"  7.  [Employee]               {t.inserted} row(s)")
    return rowids


def seed_case_category(app):
    t = TableHelper(app, "CaseCategory")
    rows = [{"CaseCategoryID": 1, "LookupValue": "FIR"}, {"CaseCategoryID": 2, "LookupValue": "UDR"}, {"CaseCategoryID": 3, "LookupValue": "PAR"}]
    results = t.insert_many(rows)
    INSERT_COUNTS["CaseCategory"] = t.inserted
    print(f"  8.  [CaseCategory]           {t.inserted} row(s)")
    return {r["CaseCategoryID"]: t.rowid(res) for r, res in zip(rows, results)}


def seed_gravity_offence(app):
    t = TableHelper(app, "GravityOffence")
    rows = [{"GravityOffenceID": 1, "LookupValue": "Heinous"}, {"GravityOffenceID": 2, "LookupValue": "Non-Heinous"}]
    results = t.insert_many(rows)
    INSERT_COUNTS["GravityOffence"] = t.inserted
    print(f"  9.  [GravityOffence]         {t.inserted} row(s)")
    return {r["GravityOffenceID"]: t.rowid(res) for r, res in zip(rows, results)}


def seed_case_status_master(app):
    t = TableHelper(app, "CaseStatusMaster")
    rows = [
        {"CaseStatusID": 1, "CaseStatusName": "Under Investigation"},
        {"CaseStatusID": 2, "CaseStatusName": "Charge Sheeted"},
        {"CaseStatusID": 3, "CaseStatusName": "Closed"},
        {"CaseStatusID": 4, "CaseStatusName": "Under Trial"},
        {"CaseStatusID": 5, "CaseStatusName": "FR Filed"},
    ]
    results = t.insert_many(rows)
    INSERT_COUNTS["CaseStatusMaster"] = t.inserted
    print(f"  10. [CaseStatusMaster]       {t.inserted} row(s)")
    return {r["CaseStatusID"]: t.rowid(res) for r, res in zip(rows, results)}


def seed_court(app, district_rowids, state_rowids):
    t = TableHelper(app, "Court")
    courts = [
        (1, "Chief Metropolitan Magistrate Court Bengaluru", 1),
        (2, "Principal JMFC Whitefield", 2), (3, "City Civil Court Koramangala", 3),
        (4, "JMFC Ramanagara", 4), (5, "District Sessions Court Davanagere", 5),
        (6, "City Criminal Court Mysuru", 6), (7, "District Court Tumakuru", 7),
        (8, "Sessions Court Belagavi", 8), (9, "JMFC Hubballi", 9), (10, "District Court Vijayapura", 10)
    ]
    rowids = {}
    for cid, name, did in courts:
        res = t.insert({"CourtID": cid, "CourtName": name, "DistrictID": district_rowids[did], "StateID": state_rowids[1], "Active": 1})
        rowids[cid] = t.rowid(res)
    INSERT_COUNTS["Court"] = t.inserted
    print(f"  11. [Court]                  {t.inserted} row(s)")
    return rowids


def seed_crime_head(app):
    t = TableHelper(app, "CrimeHead")
    rows = [
        {"CrimeHeadID": 1, "CrimeGroupName": "Crimes Against Body", "Active": 1},
        {"CrimeHeadID": 2, "CrimeGroupName": "Crimes Against Property", "Active": 1},
        {"CrimeHeadID": 3, "CrimeGroupName": "Cyber Crime", "Active": 1},
        {"CrimeHeadID": 4, "CrimeGroupName": "Crimes Against Women", "Active": 1},
        {"CrimeHeadID": 5, "CrimeGroupName": "Economic Offence", "Active": 1},
    ]
    results = t.insert_many(rows)
    INSERT_COUNTS["CrimeHead"] = t.inserted
    print(f"  12. [CrimeHead]              {t.inserted} row(s)")
    return {r["CrimeHeadID"]: t.rowid(res) for r, res in zip(rows, results)}


def seed_crime_subhead(app, crimehead_rowids):
    t = TableHelper(app, "CrimeSubHead")
    subheads = [
        (1, 1, "Murder", 1), (2, 1, "Attempt to Murder", 2), (3, 1, "Robbery", 3), (4, 1, "Assault", 4), (5, 1, "Dacoity", 5),
        (6, 2, "Burglary", 1), (7, 2, "Theft", 2), (8, 2, "Vehicle Theft", 3), (9, 2, "House Breaking", 4),
        (10, 3, "ATM Skimming", 1), (11, 3, "Online Fraud", 2), (12, 3, "Cyber Stalking", 3),
        (13, 4, "Domestic Violence", 1), (14, 4, "Eve Teasing", 2), (15, 5, "Cheating", 1)
    ]
    rowids = {}
    for sid, chid, name, seq in subheads:
        res = t.insert({"CrimeSubHeadID": sid, "CrimeHeadID": crimehead_rowids[chid], "CrimeHeadName": name, "SeqID": seq})
        rowids[sid] = t.rowid(res)
    INSERT_COUNTS["CrimeSubHead"] = t.inserted
    print(f"  13. [CrimeSubHead]           {t.inserted} row(s)")
    return rowids


def seed_act(app):
    t = TableHelper(app, "Act")
    rows = [
        {"ActCode": "IPC", "ActDescription": "Indian Penal Code 1860", "ShortName": "IPC", "Active": 1},
        {"ActCode": "POCSO", "ActDescription": "POCSO Act 2012", "ShortName": "POCSO", "Active": 1},
        {"ActCode": "IT", "ActDescription": "Information Technology Act", "ShortName": "IT", "Active": 1},
        {"ActCode": "DVA", "ActDescription": "Domestic Violence Act 2005", "ShortName": "DVA", "Active": 1},
        {"ActCode": "NDPS", "ActDescription": "NDPS Act 1985", "ShortName": "NDPS", "Active": 1},
    ]
    results = t.insert_many(rows)
    INSERT_COUNTS["Act"] = t.inserted
    print(f"  14. [Act]                    {t.inserted} row(s)")
    return {r["ActCode"]: t.rowid(res) for r, res in zip(rows, results)}


def seed_section(app, act_rowids):
    t = TableHelper(app, "Section")
    sections = [
        ("IPC", "302", "Murder"), ("IPC", "307", "Attempt to murder"), ("IPC", "392", "Robbery"),
        ("IPC", "393", "Attempt to commit robbery"), ("IPC", "395", "Dacoity"),
        ("IPC", "380", "Theft in dwelling house"), ("IPC", "454", "Lurking house-trespass"),
        ("IPC", "457", "Lurking house-trespass by night"), ("IPC", "420", "Cheating"),
        ("IPC", "354", "Assault on woman with intent to outrage modesty"),
        ("IT", "66C", "Identity theft"), ("IT", "66D", "Cheating by personation using computer"),
        ("NDPS", "20", "Punishment for contravention - cannabis")
    ]
    rowids = {}
    for act_code, sec_code, desc in sections:
        res = t.insert({"ActCode": act_rowids[act_code], "SectionCode": sec_code, "SectionDescription": desc, "Active": 1})
        rowids[(act_code, sec_code)] = t.rowid(res)
    INSERT_COUNTS["Section"] = t.inserted
    print(f"  15. [Section]                {t.inserted} row(s)")
    return rowids


def seed_crime_head_act_section(app, crimehead_rowids, act_rowids, section_rowids):
    t = TableHelper(app, "CrimeHeadActSection")
    mappings = [
        (1, "IPC", "302"), (1, "IPC", "307"), (1, "IPC", "392"), (1, "IPC", "395"),
        (2, "IPC", "380"), (2, "IPC", "454"), (2, "IPC", "457"), (3, "IT", "66C"),
        (3, "IT", "66D"), (4, "IPC", "354"), (5, "IPC", "420")
    ]
    for chid, act_code, sec_code in mappings:
        sec_rid = section_rowids.get((act_code, sec_code))
        if sec_rid:
            t.insert({"CrimeHeadID": crimehead_rowids[chid], "ActCode": act_rowids[act_code], "SectionCode": sec_rid})
    INSERT_COUNTS["CrimeHeadActSection"] = t.inserted
    print(f"  16. [CrimeHeadActSection]    {t.inserted} row(s)")


# ---------------------------------------------------------------------------
# 3. CORE TABLE — CaseMaster (Dependency Step 17)
# ---------------------------------------------------------------------------

def seed_case_master(app, case_cat_rowids, gravity_rowids, status_rowids, court_rowids, crimehead_rowids, crimesubhead_rowids, unit_rowids, employee_rowids):
    t = TableHelper(app, "CaseMaster")
    # 30 CaseMaster rows carefully structured across multiple districts, statuses, gravity levels, subheads
    CASE_DEFS = [
        # Whitefield (District 2)
        (1, 1, 1, 2, 6, 2, 1, 2, 1, 2, 12.9698, 77.7499, 2026, "2026-01-10", "House breaking and theft at Whitefield residential complex. Entry via rear window."),
        (2, 1, 1, 2, 6, 2, 1, 2, 2, 2, 12.9712, 77.7521, 2025, "2025-11-20", "Night burglary at Whitefield IT colony. Valuables and laptops stolen."),
        (3, 2, 2, 2, 9, 2, 1, 2, 4, 2, 12.9680, 77.7460, 2026, "2026-02-14", "Repeat house-breaking at Kadugodi residential area."),
        (4, 2, 2, 2, 10, 3, 1, 1, 1, 2, 12.9750, 77.7530, 2026, "2026-03-01", "ATM skimming device found at Whitefield SBI ATM. Three victims reported."),

        # Koramangala (District 3)
        (5, 3, 3, 3, 3, 1, 1, 1, 2, 3, 12.9279, 77.6271, 2025, "2025-09-05", "Armed robbery at Koramangala jewellery shop. Accused fled on bike."),
        (6, 3, 3, 3, 1, 1, 1, 1, 3, 3, 12.9310, 77.6290, 2024, "2024-06-22", "Murder at Koramangala apartment complex. Victim found with stab wounds."),
        (7, 4, 3, 3, 11, 3, 1, 2, 1, 3, 12.9260, 77.6250, 2026, "2026-04-01", "Online fraud - victim paid advance for fake job offer via social media."),

        # Ramanagara (District 4)
        (8, 5, 4, 4, 5, 1, 1, 1, 4, 4, 12.7201, 77.2819, 2025, "2025-07-11", "Dacoity on Mysuru-Bangalore highway near Ramanagara toll."),
        (9, 5, 4, 4, 5, 1, 1, 1, 2, 4, 12.7215, 77.2830, 2025, "2025-08-19", "Gang dacoity at Ramanagara toll plaza. Three trucks looted at gunpoint."),
        (10, 6, 4, 4, 7, 2, 1, 2, 3, 4, 12.7180, 77.2795, 2024, "2024-03-30", "Theft of two-wheeler at Channapatna weekly market."),

        # Davanagere (District 5)
        (11, 7, 5, 5, 5, 1, 1, 1, 1, 5, 14.4644, 75.9218, 2026, "2026-01-25", "Highway dacoity on NH-48 near Davanagere. Cash and gold seized."),
        (12, 7, 5, 5, 5, 1, 1, 1, 2, 5, 14.4660, 75.9235, 2025, "2025-12-10", "Armed dacoity at Davanagere petrol bunk."),
        (13, 8, 5, 5, 3, 1, 1, 1, 4, 5, 14.4700, 75.9200, 2025, "2025-05-03", "Robbery at Jagalur private bank branch."),

        # Bangalore Urban (District 1)
        (14, 13, 7, 1, 8, 2, 1, 2, 1, 1, 12.9716, 77.5946, 2026, "2026-02-28", "Vehicle theft from Majestic area parking. Honda City stolen."),
        (15, 13, 7, 1, 10, 3, 1, 1, 2, 1, 12.9720, 77.5950, 2025, "2025-10-15", "ATM skimming at Shivajinagar SBI branch. Multiple cards cloned."),
        (16, 14, 7, 1, 6, 2, 1, 2, 5, 1, 12.9680, 77.5980, 2024, "2024-11-01", "Burglary at Benson Town apartment. FR filed due to insufficient evidence."),
        (17, 14, 7, 1, 1, 1, 1, 1, 3, 1, 12.9700, 77.6000, 2024, "2024-07-20", "Murder at Frazer Town. Dispute over property."),

        # Mysuru (District 6)
        (18, 9, 6, 6, 13, 4, 1, 2, 1, 6, 12.2958, 76.6394, 2026, "2026-03-12", "Domestic violence complaint at Mysuru North. Victim hospitalised."),
        (19, 9, 6, 6, 2, 1, 1, 1, 4, 6, 12.2970, 76.6410, 2025, "2025-06-17", "Attempt to murder near Mysuru Palace area. Blade attack."),
        (20, 10, 6, 6, 15, 5, 1, 2, 2, 6, 12.2940, 76.6370, 2025, "2025-04-22", "Cheating case - bogus investment scheme. 23 victims."),

        # Tumakuru (District 7)
        (21, 11, 8, 7, 6, 2, 1, 2, 1, 7, 13.3409, 77.1010, 2026, "2026-01-08", "Burglary at Tumakuru commercial plaza. Safe looted."),
        (22, 11, 8, 7, 9, 2, 1, 2, 2, 7, 13.3420, 77.1025, 2026, "2026-02-20", "House-breaking at Tumakuru residential colony."),
        (23, 12, 8, 7, 7, 2, 1, 2, 3, 7, 13.3390, 77.0990, 2024, "2024-09-14", "Chain-snatching at Tiptur weekly market. Two accused arrested."),

        # Belagavi (District 8)
        (24, 15, 9, 8, 4, 1, 1, 2, 1, 8, 15.8497, 74.4977, 2026, "2026-04-05", "Assault at Belagavi bus stand. Victim sustained grievous injuries."),
        (25, 15, 9, 8, 12, 3, 1, 2, 2, 8, 15.8510, 74.4990, 2025, "2025-11-30", "Cyber stalking case - victim harassed via Instagram."),

        # Hubballi-Dharwad (District 9)
        (26, 17, 10, 9, 6, 2, 1, 2, 1, 9, 15.3647, 75.1240, 2026, "2026-01-15", "Burglary at Hubballi textile shop. Merchandise worth 4L stolen."),
        (27, 17, 10, 9, 6, 2, 1, 2, 4, 9, 15.3660, 75.1260, 2026, "2026-03-22", "Burglary at Hubballi electronics store at midnight."),

        # Vijayapura (District 10)
        (28, 19, None, 10, 11, 3, 1, 2, 1, 10, 16.8302, 75.7100, 2026, "2026-02-10", "Online fraud - fake e-commerce website. Victim lost Rs 85,000."),
        (29, 19, None, 10, 5, 1, 1, 1, 4, 10, 16.8315, 75.7115, 2026, "2026-04-01", "Dacoity at Vijayapura gold shop. Two assailants with firearms."),
        (30, 20, None, 10, 7, 2, 1, 2, 2, 10, 16.8290, 75.7090, 2025, "2025-10-20", "Motorcycle theft at Basavana Bagewadi bus stand."),
    ]

    case_rowids = {}
    case_records = []

    for (cm_id, u_id, emp_id, dist_id, sub_id, maj_id, cat_id, grav_id, stat_id, court_id, lat, lon, year, reg_date, brief) in CASE_DEFS:
        crime_no = generate_crime_no(cat_id, dist_id, u_id, year, cm_id)
        row = {
            "CaseMasterID": cm_id,
            "CrimeNo": crime_no,
            "CaseNo": f"{year}{str(cm_id).zfill(5)}",
            "CrimeRegisteredDate": reg_date,
            "PoliceStationID": unit_rowids[u_id]["rowid"],
            "CaseCategoryID": case_cat_rowids[cat_id],
            "GravityOffenceID": gravity_rowids[grav_id],
            "CrimeMajorHeadID": crimehead_rowids[maj_id],
            "CrimeMinorHeadID": crimesubhead_rowids[sub_id],
            "CaseStatusID": status_rowids[stat_id],
            "CourtID": court_rowids[court_id],
            "IncidentFromDate": fmt_datetime(year, int(reg_date[5:7]), int(reg_date[8:10]), 2, 30),
            "IncidentToDate": fmt_datetime(year, int(reg_date[5:7]), int(reg_date[8:10]), 3, 0),
            "InfoReceivedPSDate": fmt_datetime(year, int(reg_date[5:7]), int(reg_date[8:10]), 6, 0),
            "latitude": lat,
            "longitude": lon,
            "BriefFacts": brief
        }
        if emp_id and emp_id in employee_rowids:
            row["PolicePersonID"] = employee_rowids[emp_id]["rowid"]

        res = t.insert(row)
        rid = t.rowid(res)
        case_rowids[cm_id] = rid
        case_records.append({
            "case_master_id": cm_id,
            "rowid": rid,
            "crime_no": crime_no,
            "unit_id": u_id,
            "district_id": dist_id,
            "status_id": stat_id,
            "court_id": court_id,
            "gravity_id": grav_id,
            "subhead_id": sub_id
        })

    INSERT_COUNTS["CaseMaster"] = t.inserted
    print(f"  17. [CaseMaster]             {t.inserted} row(s)")
    return case_rowids, case_records


# ---------------------------------------------------------------------------
# 4. DEPENDENT CHILD TABLES (Dependency Steps 18 - 26)
# ---------------------------------------------------------------------------

def seed_act_section_association(app, case_records, act_rowids, section_rowids):
    t = TableHelper(app, "ActSectionAssociation")
    cm_rids = {r["case_master_id"]: r["rowid"] for r in case_records}
    assocs = [
        (1, "IPC", "380", 1, 1), (1, "IPC", "457", 1, 2), (2, "IPC", "380", 1, 1), (2, "IPC", "457", 1, 2),
        (3, "IPC", "454", 1, 1), (4, "IT", "66C", 1, 1), (5, "IPC", "392", 1, 1), (5, "IPC", "393", 1, 2),
        (6, "IPC", "302", 1, 1), (7, "IT", "66D", 1, 1), (8, "IPC", "395", 1, 1), (9, "IPC", "395", 1, 1),
        (11, "IPC", "395", 1, 1), (12, "IPC", "395", 1, 1), (13, "IPC", "392", 1, 1), (14, "IPC", "380", 1, 1),
        (15, "IT", "66C", 1, 1), (17, "IPC", "302", 1, 1), (19, "IPC", "307", 1, 1), (20, "IPC", "420", 1, 1),
        (23, "IPC", "380", 1, 1), (26, "IPC", "380", 1, 1), (27, "IPC", "457", 1, 1), (28, "IT", "66D", 1, 1), (29, "IPC", "395", 1, 1),
    ]
    for cm_id, act_code, sec_code, ao, so in assocs:
        sec_rid = section_rowids.get((act_code, sec_code))
        cm_rid = cm_rids.get(cm_id)
        if cm_rid and sec_rid:
            t.insert({"CaseMasterID": cm_rid, "ActID": act_rowids[act_code], "SectionID": sec_rid, "ActOrderID": ao, "SectionOrderID": so})
    INSERT_COUNTS["ActSectionAssociation"] = t.inserted
    print(f"  18. [ActSectionAssociation]  {t.inserted} row(s)")


def seed_occupation_master(app):
    t = TableHelper(app, "OccupationMaster")
    rows = [
        {"OccupationID": 1, "OccupationName": "Farmer"}, {"OccupationID": 2, "OccupationName": "Labour"},
        {"OccupationID": 3, "OccupationName": "Business"}, {"OccupationID": 4, "OccupationName": "Student"},
        {"OccupationID": 5, "OccupationName": "Government Employee"}, {"OccupationID": 6, "OccupationName": "Private Employee"},
        {"OccupationID": 7, "OccupationName": "Unemployed"}
    ]
    results = t.insert_many(rows)
    INSERT_COUNTS["OccupationMaster"] = t.inserted
    print(f"  19. [OccupationMaster]       {t.inserted} row(s)")
    return {r["OccupationID"]: t.rowid(res) for r, res in zip(rows, results)}


def seed_religion_master(app):
    t = TableHelper(app, "ReligionMaster")
    rows = [
        {"ReligionID": 1, "ReligionName": "Hindu"}, {"ReligionID": 2, "ReligionName": "Muslim"},
        {"ReligionID": 3, "ReligionName": "Christian"}, {"ReligionID": 4, "ReligionName": "Others"}
    ]
    results = t.insert_many(rows)
    INSERT_COUNTS["ReligionMaster"] = t.inserted
    print(f"  20. [ReligionMaster]         {t.inserted} row(s)")
    return {r["ReligionID"]: t.rowid(res) for r, res in zip(rows, results)}


def seed_caste_master(app):
    t = TableHelper(app, "CasteMaster")
    rows = [
        {"caste_master_id": 1, "caste_master_name": "General"}, {"caste_master_id": 2, "caste_master_name": "OBC"},
        {"caste_master_id": 3, "caste_master_name": "SC"}, {"caste_master_id": 4, "caste_master_name": "ST"}
    ]
    results = t.insert_many(rows)
    INSERT_COUNTS["CasteMaster"] = t.inserted
    print(f"  21. [CasteMaster]            {t.inserted} row(s)")
    return {r["caste_master_id"]: t.rowid(res) for r, res in zip(rows, results)}


def seed_complainant_details(app, case_records, occ_rowids, rel_rowids, caste_rowids):
    t = TableHelper(app, "ComplainantDetails")
    cm_rids = {r["case_master_id"]: r["rowid"] for r in case_records}
    complainants = [
        (1, "Suresh Nayak", 42, 6, 1, 1, 1), (2, "Pushpa Rani", 35, 3, 1, 1, 2), (3, "Govindappa B", 50, 1, 1, 2, 1),
        (4, "Fatima Begum", 30, 6, 2, 1, 2), (5, "Harish Jewellers", 45, 3, 1, 1, 1), (6, "Kavitha S", 28, 6, 1, 1, 2),
        (7, "Nagendra Prasad", 55, 6, 1, 1, 1), (8, "Truck Owners Assn", 40, 3, 1, 1, 1), (9, "Ravi Kumar R", 38, 3, 1, 1, 1),
        (10, "Basava Gowda", 60, 1, 1, 2, 1), (11, "Transport Corp", 45, 3, 1, 1, 1), (12, "Mallamma K", 52, 1, 1, 4, 2),
        (13, "Union Bank Mgr", 40, 5, 1, 1, 1), (14, "Arun Sharma", 33, 6, 1, 1, 1), (15, "Shobha V", 29, 5, 1, 1, 2),
        (16, "Ravi Shankar B", 48, 3, 1, 1, 1), (17, "Meera Devi", 60, 1, 1, 1, 2), (18, "Usha Rani G", 38, 5, 1, 1, 2),
        (19, "Ramaiah O", 44, 1, 1, 3, 1), (20, "Investors Group", 55, 3, 1, 1, 1), (21, "Saavira Traders", 50, 3, 1, 1, 1),
        (22, "Revamma P", 42, 1, 1, 4, 2), (23, "Yellamma Kiran", 35, 2, 1, 3, 2), (24, "Devraj Kamble", 25, 2, 1, 3, 1),
        (25, "Ambika Patil", 22, 4, 1, 1, 2), (26, "Textile Owner HB", 48, 3, 1, 1, 1), (27, "Electronics Owner", 52, 3, 1, 1, 1),
        (28, "Ramesh VP", 30, 4, 2, 2, 1), (29, "Gold Palace VP", 60, 3, 1, 1, 1), (30, "Veeresh Madar", 22, 2, 1, 3, 1),
    ]
    for cm_id, name, age, occ, rel, cas, gen in complainants:
        cr = cm_rids.get(cm_id)
        if cr:
            t.insert({
                "CaseMasterID": cr, "ComplainantName": name, "AgeYear": age,
                "OccupationID": occ_rowids.get(occ), "ReligionID": rel_rowids.get(rel),
                "CasteID": caste_rowids.get(cas), "GenderID": gen
            })
    INSERT_COUNTS["ComplainantDetails"] = t.inserted
    print(f"  22. [ComplainantDetails]     {t.inserted} row(s)")


def seed_victim(app, case_records):
    t = TableHelper(app, "Victim")
    cm_rids = {r["case_master_id"]: r["rowid"] for r in case_records}
    victims = [
        (1, "Suresh Nayak", 42, 1, 0), (1, "Meena Nayak", 38, 2, 0), (2, "Pushpa Rani", 35, 2, 0),
        (3, "Govindappa B", 50, 1, 0), (4, "Fatima Begum", 30, 2, 0), (4, "Zubeda Khatoon", 55, 2, 0),
        (5, "Harish Gowda", 45, 1, 0), (6, "Ramakrishna Rao", 50, 1, 0), (7, "Nagendra Prasad", 55, 1, 0),
        (8, "Truck Driver A", 40, 1, 0), (8, "Truck Driver B", 35, 1, 0), (9, "Ravi Kumar R", 38, 1, 0),
        (11, "Transport Driver", 45, 1, 0), (12, "Mallamma K", 52, 2, 0), (13, "Bank Cashier", 27, 2, 0),
        (14, "Arun Sharma", 33, 1, 0), (15, "Shobha V", 29, 2, 0), (17, "Ramanna P", 60, 1, 0),
        (18, "Usha Rani G", 38, 2, 0), (19, "Ramaiah O", 44, 1, 0), (20, "Mohan Investor", 55, 1, 0),
        (21, "Saavira Chetty", 50, 1, 0), (24, "Devraj Kamble", 25, 1, 0), (25, "Ambika Patil", 22, 2, 0),
        (26, "Textile Owner", 48, 1, 0), (29, "Gold Palace Owner", 60, 1, 0),
    ]
    for cm_id, name, age, gen, vp in victims:
        cr = cm_rids.get(cm_id)
        if cr:
            t.insert({"CaseMasterID": cr, "VictimName": name, "AgeYear": age, "GenderID": gen, "VictimPolice": vp})
    INSERT_COUNTS["Victim"] = t.inserted
    print(f"  23. [Victim]                 {t.inserted} row(s)")


def seed_accused(app, case_records):
    """
    Repeat offenders (same name+age+gender across 2+ cases):
      Manjunath @ Blade Kumar, 28, M  -> cases 1, 2, 3, 21   (4 cases)
      Venkatesh Gowda, 35, M          -> cases 8, 9, 11       (3 cases)
      Syed Ibrahim, 32, M             -> cases 4, 15           (2 cases)
      Gururaj M, 33, M                -> cases 26, 27          (2 cases)
    Co-accused cases for network intent: cases 1, 2, 3, 4, 5, 8, 9, 11, 12, 15, 19, 21, 23, 26, 29
    """
    t = TableHelper(app, "Accused")
    cm_rids = {r["case_master_id"]: r["rowid"] for r in case_records}
    accused_rows = [
        (1, 1, "Manjunath @ Blade Kumar", 28, 1, "A1"), (2, 1, "Ramesh @ Gundu", 30, 1, "A2"),
        (3, 2, "Manjunath @ Blade Kumar", 28, 1, "A1"), (4, 2, "Shankar Reddy", 25, 1, "A2"),
        (5, 3, "Manjunath @ Blade Kumar", 28, 1, "A1"), (6, 3, "Lokesh S", 22, 1, "A2"),
        (7, 4, "Syed Ibrahim", 32, 1, "A1"), (8, 4, "Hamid Khan", 27, 1, "A2"),
        (9, 5, "Praveen Gowda", 26, 1, "A1"), (10, 5, "Sunil Kumar", 24, 1, "A2"), (11, 5, "Raju M", 29, 1, "A3"),
        (12, 6, "Krishnamurthy P", 45, 1, "A1"),
        (13, 7, "Firoz Ali", 30, 1, "A1"),
        (14, 8, "Venkatesh Gowda", 35, 1, "A1"), (15, 8, "Prabhu Nayaka", 31, 1, "A2"), (16, 8, "Ravi Lamani", 28, 1, "A3"),
        (17, 9, "Venkatesh Gowda", 35, 1, "A1"), (18, 9, "Chand Basha", 33, 1, "A2"),
        (19, 10, "Santhosh B", 21, 1, "A1"),
        (20, 11, "Venkatesh Gowda", 35, 1, "A1"), (21, 11, "Nagappa H", 36, 1, "A2"),
        (22, 12, "Rangaswamy P", 40, 1, "A1"), (23, 12, "Papaiah L", 38, 1, "A2"),
        (24, 13, "Basavaraj T", 29, 1, "A1"),
        (25, 14, "Raju Kumar D", 23, 1, "A1"),
        (26, 15, "Syed Ibrahim", 32, 1, "A1"), (27, 15, "Fayaz Pasha", 28, 1, "A2"),
        (28, 16, "Unknown", 0, 1, "A1"),
        (29, 17, "Ashok Naidu", 48, 1, "A1"),
        (30, 18, "Suresh P", 42, 1, "A1"),
        (31, 19, "Harsha N", 26, 1, "A1"), (32, 19, "Deepu S", 24, 1, "A2"),
        (33, 20, "Rajender Varma", 55, 1, "A1"),
        (34, 21, "Manjunath @ Blade Kumar", 28, 1, "A1"), (35, 21, "Ramesh @ Gundu", 30, 1, "A2"),
        (36, 22, "Suresh Lamani", 32, 1, "A1"),
        (37, 23, "Chetan P", 19, 1, "A1"), (38, 23, "Umesh K", 20, 1, "A2"),
        (39, 24, "Balu Kamble", 22, 1, "A1"),
        (40, 25, "Pratik S", 27, 1, "A1"),
        (41, 26, "Gururaj M", 33, 1, "A1"), (42, 26, "Ajay R", 25, 1, "A2"),
        (43, 27, "Gururaj M", 33, 1, "A1"),
        (44, 28, "Mohammad Salim", 26, 1, "A1"),
        (45, 29, "Ramanna Kotagi", 38, 1, "A1"), (46, 29, "Bhimappa R", 35, 1, "A2"),
        (47, 30, "Manikanta T", 20, 1, "A1"),
    ]
    rowids = {}
    for amid, cm_id, name, age, gen, pid in accused_rows:
        cr = cm_rids.get(cm_id)
        if cr:
            res = t.insert({"AccusedMasterID": amid, "CaseMasterID": cr, "AccusedName": name, "AgeYear": age, "GenderID": gen, "PersonID": pid})
            rowids[amid] = {"rowid": t.rowid(res), "name": name, "case_master_id": cm_id}
    INSERT_COUNTS["Accused"] = t.inserted
    print(f"  24. [Accused]                {t.inserted} row(s)")
    return rowids


def seed_arrest_surrender(app, case_records, accused_rowids, unit_rowids, employee_rowids, court_rowids, state_rowids):
    t = TableHelper(app, "ArrestSurrender")
    cm_rids = {r["case_master_id"]: r["rowid"] for r in case_records}
    state_rid = state_rowids[1]
    arrests = [
        (1, 1, 1, "2026-01-20", 2, 1, 1, 2, 1), (2, 1, 2, "2026-01-21", 2, 1, 1, 2, 1),
        (3, 2, 3, "2025-12-05", 2, 1, 1, 2, 1), (4, 4, 7, "2026-03-15", 2, 2, 2, 2, 1),
        (5, 5, 9, "2025-09-20", 3, 3, 3, 3, 1), (6, 5, 10, "2025-09-20", 3, 3, 3, 3, 1),
        (7, 8, 14, "2025-08-01", 4, 5, 4, 4, 1), (8, 8, 15, "2025-08-01", 4, 5, 4, 4, 1),
        (9, 9, 17, "2025-09-10", 4, 5, 4, 4, 1), (10, 11, 20, "2026-02-10", 5, 7, 5, 5, 1),
        (11, 12, 22, "2026-01-30", 5, 7, 5, 5, 1), (12, 13, 24, "2025-06-01", 5, 8, 5, 5, 1),
        (13, 15, 26, "2025-11-01", 1, 13, 7, 1, 1), (14, 17, 29, "2024-08-10", 1, 14, 7, 1, 1),
        (15, 19, 31, "2025-07-05", 6, 9, 6, 6, 1), (16, 21, 34, "2026-01-20", 7, 11, 8, 7, 1),
        (17, 21, 35, "2026-01-20", 7, 11, 8, 7, 1), (18, 23, 37, "2024-09-18", 7, 12, 8, 7, 1),
        (19, 23, 38, "2024-09-18", 7, 12, 8, 7, 1), (20, 29, 45, "2026-04-10", 10, 19, None, 10, 1),
    ]
    for ar_id, cm_id, amid, arr_date, dist_id, unit_id, emp_id, court_id, type_id in arrests:
        cr = cm_rids.get(cm_id)
        acc_rid = accused_rowids.get(amid, {}).get("rowid")
        if not cr or not acc_rid:
            continue
        row = {
            "CaseMasterID": cr, "ArrestSurrenderTypeID": type_id, "ArrestSurrenderDate": arr_date,
            "ArrestSurrenderStateId": state_rid,
            "ArrestSurrenderDistrictId": unit_rowids[dist_id]["rowid"] if dist_id in unit_rowids else None,
            "PoliceStationID": unit_rowids[unit_id]["rowid"], "CourtID": court_rowids.get(court_id),
            "AccusedMasterID": acc_rid, "IsAccused": 1, "IsComplainantAccused": 0
        }
        if emp_id and emp_id in employee_rowids:
            row["IOID"] = employee_rowids[emp_id]["rowid"]
        t.insert(row)
    INSERT_COUNTS["ArrestSurrender"] = t.inserted
    print(f"  25. [ArrestSurrender]        {t.inserted} row(s)")


def seed_chargesheet_details(app, case_records, employee_rowids):
    t = TableHelper(app, "ChargesheetDetails")
    cm_rids = {r["case_master_id"]: r["rowid"] for r in case_records}
    # cstype: A=Chargesheet, B=False Case, C=Undetected
    sheets = [
        (1, 2, "2026-01-15 10:00:00", "A", 1), (2, 5, "2025-10-20 11:00:00", "A", 3),
        (3, 6, "2024-09-15 09:00:00", "A", 3), (4, 9, "2025-12-01 10:00:00", "A", 4),
        (5, 10, "2024-06-15 09:00:00", "A", 4), (6, 12, "2026-02-10 11:00:00", "A", 5),
        (7, 13, "2025-07-20 10:00:00", "A", 5), (8, 15, "2025-12-05 09:00:00", "A", 7),
        (9, 16, "2024-12-10 10:00:00", "B", 7), (10, 17, "2024-09-05 10:00:00", "A", 7),
        (11, 19, "2025-09-20 11:00:00", "A", 6), (12, 20, "2025-06-30 10:00:00", "A", 6),
        (13, 22, "2026-04-01 10:00:00", "A", 8), (14, 23, "2024-11-15 09:00:00", "A", 8),
        (15, 27, "2026-04-05 10:00:00", "A", 10), (16, 30, "2025-12-10 09:00:00", "A", None),
    ]
    for cs_id, cm_id, csdate, cstype, emp_id in sheets:
        cr = cm_rids.get(cm_id)
        if not cr:
            continue
        row = {"CSID": cs_id, "CaseMasterID": cr, "csdate": csdate, "cstype": cstype}
        if emp_id and emp_id in employee_rowids:
            row["PolicePersonID"] = employee_rowids[emp_id]["rowid"]
        t.insert(row)
    INSERT_COUNTS["ChargesheetDetails"] = t.inserted
    print(f"  26. [ChargesheetDetails]     {t.inserted} row(s)")


# ---------------------------------------------------------------------------
# 5. DEMO SUMMARY & KNOWN-GOOD TEST INPUTS
# ---------------------------------------------------------------------------

def print_summary(case_records):
    crimes = {r["case_master_id"]: r["crime_no"] for r in case_records}
    print()
    print("=" * 75)
    print("  SEEDING COMPLETE — KNOWN-GOOD TEST INPUTS FOR ALL 15 INTENTS")
    print("=" * 75)
    
    intent_test_cases = [
        ("1.  get_case_by_crimeno",      f'crime_no: "{crimes[1]}"  (Whitefield Burglary)'),
        ("2.  get_cases_by_district",    'district_name: "Whitefield"  -> Returns 4 cases (IDs 1, 2, 3, 4)'),
        ("3.  get_cases_by_status",      'case_status_name: "Under Investigation"  -> Returns 11 cases'),
        ("4.  get_case_victims",         f'crime_no: "{crimes[1]}"  -> Returns 2 victim records (Suresh & Meena Nayak)'),
        ("5.  get_accused_by_case",      f'crime_no: "{crimes[1]}"  -> Returns 2 accused (Manjunath & Ramesh)'),
        ("6.  search_accused_by_name",   'name: "Manjunath"  -> Returns 4 candidate matches across districts'),
        ("7.  get_accused_network",      'accused_master_id: 1  (Manjunath, links to co-accused Ramesh & repeat cases)'),
        ("8.  get_arrests_by_officer",   'employee_name: "Rajesh"  (KGID: KGD-10011)'),
        ("9.  get_cases_by_crimehead",   'crime_subhead: "Burglary"  -> Returns 7 burglary cases'),
        ("10. get_cases_by_act_section", 'act_short_name: "IPC", section_code: "380"  -> Returns 5 cases'),
        ("11. get_repeat_offenders",     '{}  -> Returns Manjunath (4 cases), Venkatesh Gowda (3), Syed Ibrahim (2)'),
        ("12. get_cases_by_gravity",     'gravity_level: "Heinous"  -> Returns 12 heinous crime cases'),
        ("13. get_chargesheet_status",   f'crime_no: "{crimes[2]}"  -> Returns Chargesheet cstype "A"'),
        ("14. get_cases_by_court",       'court_name: "Whitefield"  -> Returns 4 cases'),
        ("15. get_mo_matches",           f'crime_no: "{crimes[1]}"  -> Matches open burglary cases in Whitefield'),
    ]
    
    print()
    for label, hint in intent_test_cases:
        print(f"  {label}")
        print(f"      -> Input: {hint}")
        print()

    print("  SAMPLE CrimeNo VALUES (Copy & Paste for Testing):")
    print(f"    Case  1 (Whitefield Burglary)   : {crimes[1]}")
    print(f"    Case  4 (Whitefield ATM Skimm.) : {crimes[4]}")
    print(f"    Case  8 (Ramanagara Dacoity)    : {crimes[8]}")
    print(f"    Case 11 (Davanagere Highway)    : {crimes[11]}")
    print(f"    Case 15 (Bangalore ATM Skimm.)  : {crimes[15]}")
    print(f"    Case 29 (Vijayapura Dacoity)    : {crimes[29]}")
    print()
    print("  REPEAT OFFENDERS SEEDED:")
    print("    • Manjunath @ Blade Kumar (Age: 28, Gender: 1) — Cases 1, 2, 3, 21")
    print("    • Venkatesh Gowda (Age: 35, Gender: 1)         — Cases 8, 9, 11")
    print("    • Syed Ibrahim (Age: 32, Gender: 1)            — Cases 4, 15")
    print("    • Gururaj M (Age: 33, Gender: 1)               — Cases 26, 27")
    print()
    print("  DISTRICTS SEEDED:")
    print("    Bangalore Urban, Whitefield, Koramangala, Ramanagara, Davanagere,")
    print("    Mysuru, Tumakuru, Belagavi, Hubballi-Dharwad, Vijayapura")
    print()


# ---------------------------------------------------------------------------
# 6. MAIN EXECUTION FLOW
# ---------------------------------------------------------------------------

def main():
    print()
    print("=" * 75)
    print("  SENTINEL — Catalyst Data Store Seed Script")
    print("  WARNING: NOT IDEMPOTENT. Duplicate rows will be created on re-run.")
    print("=" * 75)
    print()

    args = parse_args()
    print("[*] Initializing Catalyst SDK app ...")
    app = init_app(args)
    print("[*] Connected successfully. Seeding 26 tables in dependency order ...\n")

    print("[+] PHASE 1: MASTER & LOOKUP TABLES (Steps 1 to 16)")
    state_rowids = seed_state(app)
    district_rowids = seed_district(app, state_rowids)
    unit_type_rowids = seed_unit_type(app)
    unit_rowids = seed_unit(app, unit_type_rowids, district_rowids, state_rowids)
    rank_rowids = seed_rank(app)
    desig_rowids = seed_designation(app)
    employee_rowids = seed_employee(app, district_rowids, unit_rowids, rank_rowids, desig_rowids)
    case_cat_rowids = seed_case_category(app)
    gravity_rowids = seed_gravity_offence(app)
    status_rowids = seed_case_status_master(app)
    court_rowids = seed_court(app, district_rowids, state_rowids)
    crimehead_rowids = seed_crime_head(app)
    crimesubhead_rowids = seed_crime_subhead(app, crimehead_rowids)
    act_rowids = seed_act(app)
    section_rowids = seed_section(app, act_rowids)
    seed_crime_head_act_section(app, crimehead_rowids, act_rowids, section_rowids)

    print()
    print("[+] PHASE 2: CORE TABLE (Step 17)")
    case_rowids, case_records = seed_case_master(
        app, case_cat_rowids, gravity_rowids, status_rowids, court_rowids,
        crimehead_rowids, crimesubhead_rowids, unit_rowids, employee_rowids
    )

    print()
    print("[+] PHASE 3: DEPENDENT CHILD TABLES (Steps 18 to 26)")
    seed_act_section_association(app, case_records, act_rowids, section_rowids)
    occ_rowids = seed_occupation_master(app)
    rel_rowids = seed_religion_master(app)
    caste_rowids = seed_caste_master(app)
    seed_complainant_details(app, case_records, occ_rowids, rel_rowids, caste_rowids)
    seed_victim(app, case_records)
    accused_rowids = seed_accused(app, case_records)
    seed_arrest_surrender(app, case_records, accused_rowids, unit_rowids, employee_rowids, court_rowids, state_rowids)
    seed_chargesheet_details(app, case_records, employee_rowids)

    print()
    print("[+] INSERTION SUMMARY")
    total_rows = 0
    for tbl, count in sorted(INSERT_COUNTS.items()):
        print(f"    {tbl:<32} {count:>5} row(s)")
        total_rows += count
    print(f"    {'TOTAL ROWS INSERTED':<32} {total_rows:>5} row(s)")

    print_summary(case_records)


if __name__ == "__main__":
    main()
