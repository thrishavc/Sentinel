# Catalyst Data Store — Table Definitions
Build these in the order listed. Catalyst auto-adds a `ROWID` (bigint) primary key to every table — the columns below are in addition to that.

Type mapping used: SQL `INT` → Catalyst `bigint`, `VARCHAR`/`NVARCHAR` → `varchar`, `DATE` → `date`, `DATETIME` → `datetime`, `BIT` → `bigint` (0/1), `DECIMAL` → `decimal`.

---

## 1. State
| Column | Type | Notes |
|---|---|---|
| StateID | bigint | logical PK |
| StateName | varchar | |
| NationalityID | bigint | |
| Active | bigint | 0/1 |

## 2. District
| Column | Type | Notes |
|---|---|---|
| DistrictID | bigint | logical PK |
| DistrictName | varchar | |
| StateID | bigint | FK → State |
| Active | bigint | 0/1 |

## 3. UnitType
| Column | Type | Notes |
|---|---|---|
| UnitTypeID | bigint | logical PK |
| UnitTypeName | varchar | |
| CityDistState | varchar | |
| Hierarchy | bigint | |
| Active | bigint | 0/1 |

## 4. Unit
| Column | Type | Notes |
|---|---|---|
| UnitID | bigint | logical PK |
| UnitName | varchar | |
| TypeID | bigint | FK → UnitType |
| ParentUnit | bigint | self-reference |
| NationalityID | bigint | |
| StateID | bigint | FK → State |
| DistrictID | bigint | FK → District |
| Active | bigint | 0/1 |

## 5. Rank
| Column | Type | Notes |
|---|---|---|
| RankID | bigint | logical PK |
| RankName | varchar | |
| Hierarchy | bigint | |
| Active | bigint | 0/1 |

## 6. Designation
| Column | Type | Notes |
|---|---|---|
| DesignationID | bigint | logical PK |
| DesignationName | varchar | |
| Active | bigint | 0/1 |
| SortOrder | bigint | |

## 7. Employee
| Column | Type | Notes |
|---|---|---|
| EmployeeID | bigint | logical PK |
| DistrictID | bigint | FK → District |
| UnitID | bigint | FK → Unit |
| RankID | bigint | FK → Rank |
| DesignationID | bigint | FK → Designation |
| KGID | varchar | |
| FirstName | varchar | |
| EmployeeDOB | date | |
| GenderID | bigint | lookup value |
| BloodGroupID | bigint | lookup value |
| PhysicallyChallenged | bigint | 0/1 |
| AppointmentDate | date | |

## 8. CaseCategory
| Column | Type | Notes |
|---|---|---|
| CaseCategoryID | bigint | logical PK |
| LookupValue | varchar | e.g. FIR, UDR, PAR |

## 9. GravityOffence
| Column | Type | Notes |
|---|---|---|
| GravityOffenceID | bigint | logical PK |
| LookupValue | varchar | e.g. Heinous, Non-Heinous |

## 10. CaseStatusMaster
| Column | Type | Notes |
|---|---|---|
| CaseStatusID | bigint | logical PK |
| CaseStatusName | varchar | e.g. Under Investigation, Charge Sheeted, Closed |

## 11. Court
| Column | Type | Notes |
|---|---|---|
| CourtID | bigint | logical PK |
| CourtName | varchar | |
| DistrictID | bigint | FK → District |
| StateID | bigint | FK → State |
| Active | bigint | 0/1 |

## 12. CrimeHead
| Column | Type | Notes |
|---|---|---|
| CrimeHeadID | bigint | logical PK |
| CrimeGroupName | varchar | e.g. Crimes Against Body |
| Active | bigint | 0/1 |

## 13. CrimeSubHead
| Column | Type | Notes |
|---|---|---|
| CrimeSubHeadID | bigint | logical PK |
| CrimeHeadID | bigint | FK → CrimeHead |
| CrimeHeadName | varchar | e.g. Murder, Robbery |
| SeqID | bigint | |

## 14. Act
| Column | Type | Notes |
|---|---|---|
| ActCode | varchar | logical PK |
| ActDescription | varchar | |
| ShortName | varchar | |
| Active | bigint | 0/1 |

## 15. Section
| Column | Type | Notes |
|---|---|---|
| ActCode | varchar | FK → Act |
| SectionCode | varchar | logical PK (with ActCode) |
| SectionDescription | varchar | |
| Active | bigint | 0/1 |

## 16. CrimeHeadActSection
| Column | Type | Notes |
|---|---|---|
| CrimeHeadID | bigint | FK → CrimeHead |
| ActCode | varchar | FK → Act |
| SectionCode | varchar | FK → Section |

## 17. CaseMaster
| Column | Type | Notes |
|---|---|---|
| CaseMasterID | bigint | logical PK |
| CrimeNo | varchar | structured format — see below |
| CaseNo | varchar | YYYY + 5-digit serial |
| CrimeRegisteredDate | date | |
| PolicePersonID | bigint | FK → Employee |
| PoliceStationID | bigint | FK → Unit |
| CaseCategoryID | bigint | FK → CaseCategory |
| GravityOffenceID | bigint | FK → GravityOffence |
| CrimeMajorHeadID | bigint | FK → CrimeHead |
| CrimeMinorHeadID | bigint | FK → CrimeSubHead |
| CaseStatusID | bigint | FK → CaseStatusMaster |
| CourtID | bigint | FK → Court |
| IncidentFromDate | datetime | |
| IncidentToDate | datetime | |
| InfoReceivedPSDate | datetime | |
| latitude | decimal | |
| longitude | decimal | |
| BriefFacts | varchar | long text |

**CrimeNo format reminder:** 1-digit Case Category Code + 4-digit DistrictID + 4-digit PoliceStationID + 4-digit Year + 5-digit running serial (e.g. `104430006202600001` for FIR). Your seed script must generate this correctly — it's a common judge-visible detail to get right.

## 18. ActSectionAssociation
| Column | Type | Notes |
|---|---|---|
| CaseMasterID | bigint | FK → CaseMaster |
| ActID | bigint | FK → Act.ActCode |
| SectionID | bigint | FK → Section.SectionCode |
| ActOrderID | bigint | |
| SectionOrderID | bigint | |

## 19. OccupationMaster
| Column | Type | Notes |
|---|---|---|
| OccupationID | bigint | logical PK |
| OccupationName | varchar | |

## 20. ReligionMaster
| Column | Type | Notes |
|---|---|---|
| ReligionID | bigint | logical PK |
| ReligionName | varchar | |

## 21. CasteMaster
| Column | Type | Notes |
|---|---|---|
| caste_master_id | bigint | logical PK |
| caste_master_name | varchar | |

## 22. ComplainantDetails
| Column | Type | Notes |
|---|---|---|
| ComplainantID | bigint | logical PK |
| CaseMasterID | bigint | FK → CaseMaster |
| ComplainantName | varchar | |
| AgeYear | bigint | |
| OccupationID | bigint | FK → OccupationMaster |
| ReligionID | bigint | FK → ReligionMaster |
| CasteID | bigint | FK → CasteMaster |
| GenderID | bigint | lookup value |

## 23. Victim
| Column | Type | Notes |
|---|---|---|
| VictimMasterID | bigint | logical PK |
| CaseMasterID | bigint | FK → CaseMaster |
| VictimName | varchar | |
| AgeYear | bigint | |
| GenderID | bigint | m/f/t lookup |
| VictimPolice | bigint | 0/1 |

## 24. Accused
| Column | Type | Notes |
|---|---|---|
| AccusedMasterID | bigint | logical PK |
| CaseMasterID | bigint | FK → CaseMaster |
| AccusedName | varchar | |
| AgeYear | bigint | |
| GenderID | bigint | M/F/T |
| PersonID | varchar | e.g. A1, A2, A3 |

## 25. ArrestSurrender
| Column | Type | Notes |
|---|---|---|
| ArrestSurrenderID | bigint | logical PK |
| CaseMasterID | bigint | FK → CaseMaster |
| ArrestSurrenderTypeID | bigint | lookup: arrest/surrender |
| ArrestSurrenderDate | date | |
| ArrestSurrenderStateId | bigint | FK → State |
| ArrestSurrenderDistrictId | bigint | FK → District |
| PoliceStationID | bigint | FK → Unit |
| IOID | bigint | FK → Employee |
| CourtID | bigint | FK → Court |
| AccusedMasterID | bigint | FK → Accused |
| IsAccused | bigint | 0/1 |
| IsComplainantAccused | bigint | 0/1 |

## 26. ChargesheetDetails
| Column | Type | Notes |
|---|---|---|
| CSID | bigint | logical PK |
| CaseMasterID | bigint | FK → CaseMaster |
| csdate | datetime | |
| cstype | varchar | A=Chargesheet, B=False Case, C=Undetected |
| PolicePersonID | bigint | FK → Employee |

---

## Practical shortcut — reduce table creation time

Creating 26 tables one-by-one through the console UI will eat significant time. Two options to speed this up:

1. **Check if Catalyst CLI/console supports bulk table creation via a schema JSON/CSV import** — worth checking the console's Data Store section for an "import schema" or "bulk create" option before doing all 26 manually.
2. **Prioritize by what your first 4-5 intents actually need**, build those tables first, and add the rest incrementally as you build out more intents — rather than blocking on all 26 before writing any code. Based on the intent list from your contract spec, your minimum viable set to start testing is: **District, Unit, CrimeHead, CrimeSubHead, CaseStatusMaster, Court, CaseMaster, Accused, Employee, ArrestSurrender**.
