# Catalyst Data Store — Column Settings Reference
For every column in every table, in build order. Data types assume `bigint` for IDs/flags, `varchar(N)` for text, `date`/`datetime` for dates, `decimal` for lat/long.

Legend: U = Is Unique, M = Is Mandatory, S = Search Index, P = PII/ePHI

---

## 1. State
| Column | Type | U | M | S | P |
|---|---|---|---|---|---|
| StateID | bigint | ON | ON | ON | OFF |
| StateName | varchar(50) | OFF | ON | ON | OFF |
| NationalityID | bigint | OFF | OFF | OFF | OFF |
| Active | bigint (default 1) | OFF | ON | OFF | OFF |

## 2. District
| Column | Type | U | M | S | P |
|---|---|---|---|---|---|
| DistrictID | bigint | ON | ON | ON | OFF |
| DistrictName | varchar(100) | OFF | ON | ON | OFF |
| StateID | Foreign Key → State, On Delete: Null | OFF | ON | ON | OFF |
| Active | bigint (default 1) | OFF | ON | OFF | OFF |

## 3. UnitType
| Column | Type | U | M | S | P |
|---|---|---|---|---|---|
| UnitTypeID | bigint | ON | ON | ON | OFF |
| UnitTypeName | varchar(50) | OFF | ON | ON | OFF |
| CityDistState | varchar(20) | OFF | OFF | OFF | OFF |
| Hierarchy | bigint | OFF | OFF | OFF | OFF |
| Active | bigint (default 1) | OFF | ON | OFF | OFF |

## 4. Unit
| Column | Type | U | M | S | P |
|---|---|---|---|---|---|
| UnitID | bigint | ON | ON | ON | OFF |
| UnitName | varchar(100) | OFF | ON | ON | OFF |
| TypeID | FK → UnitType, On Delete: Null | OFF | ON | ON | OFF |
| ParentUnit | bigint (self-ref, plain bigint not FK unless you want to enforce it) | OFF | OFF | OFF | OFF |
| NationalityID | bigint | OFF | OFF | OFF | OFF |
| StateID | FK → State, On Delete: Null | OFF | ON | ON | OFF |
| DistrictID | FK → District, On Delete: Null | OFF | ON | ON | OFF |
| Active | bigint (default 1) | OFF | ON | OFF | OFF |

## 5. Rank
| Column | Type | U | M | S | P |
|---|---|---|---|---|---|
| RankID | bigint | ON | ON | ON | OFF |
| RankName | varchar(50) | OFF | ON | ON | OFF |
| Hierarchy | bigint | OFF | OFF | OFF | OFF |
| Active | bigint (default 1) | OFF | ON | OFF | OFF |

## 6. Designation
| Column | Type | U | M | S | P |
|---|---|---|---|---|---|
| DesignationID | bigint | ON | ON | ON | OFF |
| DesignationName | varchar(50) | OFF | ON | ON | OFF |
| Active | bigint (default 1) | OFF | ON | OFF | OFF |
| SortOrder | bigint | OFF | OFF | OFF | OFF |

## 7. Employee
| Column | Type | U | M | S | P |
|---|---|---|---|---|---|
| EmployeeID | bigint | ON | ON | ON | OFF |
| DistrictID | FK → District, On Delete: Null | OFF | ON | ON | OFF |
| UnitID | FK → Unit, On Delete: Null | OFF | ON | ON | OFF |
| RankID | FK → Rank, On Delete: Null | OFF | ON | OFF | OFF |
| DesignationID | FK → Designation, On Delete: Null | OFF | ON | OFF | OFF |
| KGID | varchar(20) | ON | ON | ON | **ON** |
| FirstName | varchar(100) | OFF | ON | ON | **ON** |
| EmployeeDOB | date | OFF | OFF | OFF | **ON** |
| GenderID | bigint | OFF | OFF | OFF | OFF |
| BloodGroupID | bigint | OFF | OFF | OFF | OFF |
| PhysicallyChallenged | bigint | OFF | OFF | OFF | OFF |
| AppointmentDate | date | OFF | OFF | OFF | OFF |

## 8. CaseCategory
| Column | Type | U | M | S | P |
|---|---|---|---|---|---|
| CaseCategoryID | bigint | ON | ON | ON | OFF |
| LookupValue | varchar(50) | OFF | ON | ON | OFF |

## 9. GravityOffence
| Column | Type | U | M | S | P |
|---|---|---|---|---|---|
| GravityOffenceID | bigint | ON | ON | ON | OFF |
| LookupValue | varchar(50) | OFF | ON | ON | OFF |

## 10. CaseStatusMaster
| Column | Type | U | M | S | P |
|---|---|---|---|---|---|
| CaseStatusID | bigint | ON | ON | ON | OFF |
| CaseStatusName | varchar(50) | OFF | ON | ON | OFF |

## 11. Court
| Column | Type | U | M | S | P |
|---|---|---|---|---|---|
| CourtID | bigint | ON | ON | ON | OFF |
| CourtName | varchar(100) | OFF | ON | ON | OFF |
| DistrictID | FK → District, On Delete: Null | OFF | ON | ON | OFF |
| StateID | FK → State, On Delete: Null | OFF | ON | OFF | OFF |
| Active | bigint (default 1) | OFF | ON | OFF | OFF |

## 12. CrimeHead
| Column | Type | U | M | S | P |
|---|---|---|---|---|---|
| CrimeHeadID | bigint | ON | ON | ON | OFF |
| CrimeGroupName | varchar(100) | OFF | ON | ON | OFF |
| Active | bigint (default 1) | OFF | ON | OFF | OFF |

## 13. CrimeSubHead
| Column | Type | U | M | S | P |
|---|---|---|---|---|---|
| CrimeSubHeadID | bigint | ON | ON | ON | OFF |
| CrimeHeadID | FK → CrimeHead, On Delete: Null | OFF | ON | ON | OFF |
| CrimeHeadName | varchar(100) | OFF | ON | ON | OFF |
| SeqID | bigint | OFF | OFF | OFF | OFF |

## 14. Act
| Column | Type | U | M | S | P |
|---|---|---|---|---|---|
| ActCode | varchar(20) | ON | ON | ON | OFF |
| ActDescription | varchar(200) | OFF | ON | OFF | OFF |
| ShortName | varchar(50) | OFF | ON | ON | OFF |
| Active | bigint (default 1) | OFF | ON | OFF | OFF |

## 15. Section
| Column | Type | U | M | S | P |
|---|---|---|---|---|---|
| ActCode | FK → Act, On Delete: Null | OFF | ON | ON | OFF |
| SectionCode | varchar(20) | OFF | ON | ON | OFF |
| SectionDescription | varchar(200) | OFF | ON | OFF | OFF |
| Active | bigint (default 1) | OFF | ON | OFF | OFF |

> Note: `SectionCode` is only unique *combined with* `ActCode` (composite), so leave `Is Unique` OFF on both individually — Data Store's single-column unique constraint can't express a composite key. Enforce this uniqueness yourself in your seed script instead.

## 16. CrimeHeadActSection
| Column | Type | U | M | S | P |
|---|---|---|---|---|---|
| CrimeHeadID | FK → CrimeHead, On Delete: Null | OFF | ON | ON | OFF |
| ActCode | FK → Act, On Delete: Null | OFF | ON | ON | OFF |
| SectionCode | varchar(20) | OFF | ON | OFF | OFF |

## 17. CaseMaster
| Column | Type | U | M | S | P |
|---|---|---|---|---|---|
| CaseMasterID | bigint | ON | ON | ON | OFF |
| CrimeNo | varchar(25) | ON | ON | ON | OFF |
| CaseNo | varchar(15) | OFF | ON | ON | OFF |
| CrimeRegisteredDate | date | OFF | ON | ON | OFF |
| PolicePersonID | FK → Employee, On Delete: Null | OFF | ON | OFF | OFF |
| PoliceStationID | FK → Unit, On Delete: Null | OFF | ON | ON | OFF |
| CaseCategoryID | FK → CaseCategory, On Delete: Null | OFF | ON | ON | OFF |
| GravityOffenceID | FK → GravityOffence, On Delete: Null | OFF | ON | ON | OFF |
| CrimeMajorHeadID | FK → CrimeHead, On Delete: Null | OFF | ON | ON | OFF |
| CrimeMinorHeadID | FK → CrimeSubHead, On Delete: Null | OFF | ON | ON | OFF |
| CaseStatusID | FK → CaseStatusMaster, On Delete: Null | OFF | ON | ON | OFF |
| CourtID | FK → Court, On Delete: Null | OFF | OFF | ON | OFF |
| IncidentFromDate | datetime | OFF | OFF | ON | OFF |
| IncidentToDate | datetime | OFF | OFF | OFF | OFF |
| InfoReceivedPSDate | datetime | OFF | OFF | OFF | OFF |
| latitude | decimal | OFF | OFF | OFF | OFF |
| longitude | decimal | OFF | OFF | OFF | OFF |
| BriefFacts | varchar(500) or long text type if available | OFF | OFF | OFF | OFF |

## 18. ActSectionAssociation
| Column | Type | U | M | S | P |
|---|---|---|---|---|---|
| CaseMasterID | FK → CaseMaster, On Delete: Cascade (junction row is meaningless without the case) | OFF | ON | ON | OFF |
| ActID | FK → Act, On Delete: Null | OFF | ON | ON | OFF |
| SectionID | varchar(20) | OFF | ON | OFF | OFF |
| ActOrderID | bigint | OFF | OFF | OFF | OFF |
| SectionOrderID | bigint | OFF | OFF | OFF | OFF |

## 19. OccupationMaster
| Column | Type | U | M | S | P |
|---|---|---|---|---|---|
| OccupationID | bigint | ON | ON | ON | OFF |
| OccupationName | varchar(50) | OFF | ON | ON | OFF |

## 20. ReligionMaster
| Column | Type | U | M | S | P |
|---|---|---|---|---|---|
| ReligionID | bigint | ON | ON | ON | OFF |
| ReligionName | varchar(50) | OFF | ON | ON | OFF |

## 21. CasteMaster
| Column | Type | U | M | S | P |
|---|---|---|---|---|---|
| caste_master_id | bigint | ON | ON | ON | OFF |
| caste_master_name | varchar(50) | OFF | ON | ON | OFF |

## 22. ComplainantDetails
| Column | Type | U | M | S | P |
|---|---|---|---|---|---|
| ComplainantID | bigint | ON | ON | ON | OFF |
| CaseMasterID | FK → CaseMaster, On Delete: Cascade | OFF | ON | ON | OFF |
| ComplainantName | varchar(100) | OFF | ON | ON | **ON** |
| AgeYear | bigint | OFF | OFF | OFF | **ON** |
| OccupationID | FK → OccupationMaster, On Delete: Null | OFF | OFF | OFF | OFF |
| ReligionID | FK → ReligionMaster, On Delete: Null | OFF | OFF | OFF | **ON** |
| CasteID | FK → CasteMaster, On Delete: Null | OFF | OFF | OFF | **ON** |
| GenderID | bigint | OFF | OFF | OFF | **ON** |

## 23. Victim
| Column | Type | U | M | S | P |
|---|---|---|---|---|---|
| VictimMasterID | bigint | ON | ON | ON | OFF |
| CaseMasterID | FK → CaseMaster, On Delete: Cascade | OFF | ON | ON | OFF |
| VictimName | varchar(100) | OFF | ON | ON | **ON** |
| AgeYear | bigint | OFF | OFF | OFF | **ON** |
| GenderID | bigint | OFF | OFF | OFF | **ON** |
| VictimPolice | bigint | OFF | OFF | OFF | OFF |

## 24. Accused
| Column | Type | U | M | S | P |
|---|---|---|---|---|---|
| AccusedMasterID | bigint | ON | ON | ON | OFF |
| CaseMasterID | FK → CaseMaster, On Delete: Cascade | OFF | ON | ON | OFF |
| AccusedName | varchar(100) | OFF | ON | ON | **ON** |
| AgeYear | bigint | OFF | ON | ON | **ON** |
| GenderID | bigint | OFF | ON | ON | **ON** |
| PersonID | varchar(10) | OFF | ON | OFF | OFF |

> `AgeYear` and `GenderID` are marked Search Index ON here specifically because `get_repeat_offenders` and `search_accused_by_name` match on name+age±1+gender — you'll be filtering on these constantly.

## 25. ArrestSurrender
| Column | Type | U | M | S | P |
|---|---|---|---|---|---|
| ArrestSurrenderID | bigint | ON | ON | ON | OFF |
| CaseMasterID | FK → CaseMaster, On Delete: Cascade | OFF | ON | ON | OFF |
| ArrestSurrenderTypeID | bigint | OFF | ON | OFF | OFF |
| ArrestSurrenderDate | date | OFF | ON | ON | OFF |
| ArrestSurrenderStateId | FK → State, On Delete: Null | OFF | OFF | OFF | OFF |
| ArrestSurrenderDistrictId | FK → District, On Delete: Null | OFF | OFF | ON | OFF |
| PoliceStationID | FK → Unit, On Delete: Null | OFF | OFF | OFF | OFF |
| IOID | FK → Employee, On Delete: Null | OFF | ON | ON | OFF |
| CourtID | FK → Court, On Delete: Null | OFF | OFF | OFF | OFF |
| AccusedMasterID | FK → Accused, On Delete: Cascade | OFF | ON | ON | OFF |
| IsAccused | bigint | OFF | OFF | OFF | OFF |
| IsComplainantAccused | bigint | OFF | OFF | OFF | OFF |

## 26. ChargesheetDetails
| Column | Type | U | M | S | P |
|---|---|---|---|---|---|
| CSID | bigint | ON | ON | ON | OFF |
| CaseMasterID | FK → CaseMaster, On Delete: Cascade | OFF | ON | ON | OFF |
| csdate | datetime | OFF | ON | OFF | OFF |
| cstype | varchar(5) | OFF | ON | OFF | OFF |
| PolicePersonID | FK → Employee, On Delete: Null | OFF | OFF | OFF | OFF |

---

## Quick rules recap (for any column not listed above / edge cases)
1. **Logical ID columns** (the table's own primary identifier): Unique ON, Mandatory ON, Search Index ON, PII OFF
2. **Foreign keys**: Unique OFF, Mandatory ON (unless genuinely optional), Search Index ON if you'll ever filter/join on it in an intent, PII OFF
3. **Person names/DOB/age/gender tied to a specific person** (Accused, Victim, Complainant, Employee): PII ON
4. **Lookup/classification values on non-person entities** (District, Court, CrimeHead, etc.): PII OFF always
5. **On Delete — Cascade** only for junction/child rows that are meaningless without their parent case (Accused, Victim, ArrestSurrender, ComplainantDetails, ActSectionAssociation, ChargesheetDetails all cascade from CaseMaster). **On Delete — Null** for everything else (lookup tables like State/District/Unit/Court/Employee), so deleting a lookup row doesn't wipe out your case data.
