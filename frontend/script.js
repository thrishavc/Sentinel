/**
 * ==========================================================================
 * SENTINEL — BILINGUAL KSP CRIME INVESTIGATOR INTERFACE (frontend/script.js)
 * Target: Karnataka State Police Datathon 2026
 * Description: Core logic handling State 1 & State 2, EN/Kannada translation,
 *              Investigator/Supervisor role access control, modal detail views,
 *              multiple suspect entity resolution, and backend API hooks.
 * ==========================================================================
 */

// ==========================================================================
// 1. MOCK SUSPECTS DATASET (MULTIPLE ENTITIES FOR DEMO)
// ==========================================================================

const MOCK_SUSPECTS = [
    // --- SUSPECT 1: Manjunath @ "Blade" Kumar (ACC-89241) ---
    {
        id: "ACC-89241",
        name: "Manjunath",
        matchKeywords: ["manjunath", "blade", "whitefield", "acc-89241", "burglary", "ಮಂಜುನಾಥ್", "ಬ್ಲೇಡ್", "ವೈಟ್‌ಫೀಲ್ಡ್", "ಕಳವು"],
        data: {
            suspectId: "ACC-89241",
            suspectName: "Manjunath @ 'Blade' Kumar",
            queryTextEn: "Show all details and linked records for Suspect ACC-89241 in Whitefield burglary case",
            queryTextKn: "ವೈಟ್‌ಫೀಲ್ಡ್ ಕಳವು ಪ್ರಕರಣದಲ್ಲಿ ಶಂಕಿತ ACC-89241 ರ ಎಲ್ಲಾ ವಿವರಗಳು ಮತ್ತು ಸಂಪರ್ಕಿತ ದಾಖಲೆಗಳನ್ನು ತೋರಿಸಿ",
            directAnswerEn: `Suspect <strong>ACC-89241 (Manjunath @ "Blade" Kumar)</strong> is linked to 4 registered FIRs across Whitefield (Bengaluru) and Ramanagara districts. 3 cases have been chargesheeted while 1 remains under active investigation. Subject was last arrested on 14 Nov 2023 and has 6 known gang associates. 5 open night-burglary cases match his known Modus Operandi (MO: rear-window grill cutting with hydraulic shears).`,
            directAnswerKn: `ಶಂಕಿತ <strong>ACC-89241 (ಮಂಜುನಾಥ್ @ "ಬ್ಲೇಡ್" ಕುಮಾರ್)</strong> ವೈಟ್‌ಫೀಲ್ಡ್ (ಬೆಂಗಳೂರು) ಮತ್ತು ರಾಮನಗರ ಜಿಲ್ಲೆಗಳಲ್ಲಿ 4 ನೋಂದಾಯಿತ ಎಫ್‌ಐಆರ್‌ಗಳಿಗೆ ಲಿಂಕ್ ಆಗಿದ್ದಾರೆ. 3 ಪ್ರಕರಣಗಳಲ್ಲಿ ಚಾರ್ಜ್‌ಶೀಟ್ ಸಲ್ಲಿಸಲಾಗಿದ್ದು, 1 ಪ್ರಕರಣ ಸಕ್ರಿಯ ತನಿಖೆಯಲ್ಲಿದೆ. ಇವರನ್ನು ಕೊನೆಯದಾಗಿ 14 ನವೆಂಬರ್ 2023 ರಂದು ಬಂಧಿಸಲಾಗಿತ್ತು ಮತ್ತು 6 ಗ್ಯಾಂಗ್ ಸಹಚರರಿದ್ದಾರೆ. 5 ಮುಕ್ತ ರಾತ್ರಿ ಕಳವು ಪ್ರಕರಣಗಳು ಇವರ ಪರಿಚಿತ ಎಂಒ (ಹೈಡ್ರಾಲಿಕ್ ಕತ್ತರಿಯಿಂದ ಹಿಂಭಾಗದ ಕಿಟಕಿ ಗ್ರಿಲ್ ಕತ್ತರಿಸುವುದು) ಗೆ ಹೋಲುತ್ತವೆ.`,
            cardsDetail: {
                "linked-cases": {
                    icon: "📄",
                    titleEn: "Linked Cases",
                    titleKn: "ಸಂಪರ್ಕಿತ ಪ್ರಕರಣಗಳು",
                    headersEn: ["FIR No.", "Station / District", "Sections", "Status"],
                    headersKn: ["ಎಫ್‌ಐಆರ್ ಸಂಖ್ಯೆ", "ಠಾಣೆ / ಜಿಲ್ಲೆ", "ವಿಭಾಗಗಳು", "ಸ್ಥಿತಿ"],
                    rows: [
                        ["FIR-2024-WF-089", "Whitefield (Bengaluru)", "IPC 380, 457", "Active Under Trial"],
                        ["FIR-2023-WF-412", "Whitefield (Bengaluru)", "IPC 454, 380", "Chargesheeted"],
                        ["FIR-2023-RM-104", "Ramanagara Town", "IPC 392, 457", "Chargesheeted"],
                        ["FIR-2022-WF-188", "HAL (Bengaluru)", "IPC 380", "Chargesheeted"]
                    ]
                },
                "chargesheet": {
                    icon: "⚖️",
                    titleEn: "Chargesheet Status",
                    titleKn: "ಚಾರ್ಜ್‌ಶೀಟ್ ಸ್ಥಿತಿ",
                    headersEn: ["CS Record No.", "Related FIR", "Court File Date", "Status"],
                    headersKn: ["ಚಾರ್ಜ್‌ಶೀಟ್ ಸಂಖ್ಯೆ", "ಸಂಬಂಧಿತ ಎಫ್‌ಐಆರ್", "ನ್ಯಾಯಾಲಯ ಸಲ್ಲಿಕೆ ದಿನಾಂಕ", "ಸ್ಥಿತಿ"],
                    rows: [
                        ["CS-2023-WF-0089", "FIR-2023-WF-412", "18 Dec 2023", "Filed in CMM Court"],
                        ["CS-2023-RM-0042", "FIR-2023-RM-104", "04 Jan 2024", "Filed in Principal JMFC"],
                        ["CS-2022-WF-0112", "FIR-2022-WF-188", "12 Nov 2022", "Disposed (Convicted)"],
                        ["CS-PENDING-089", "FIR-2024-WF-089", "Pending", "Drafting in Progress"]
                    ]
                },
                "arrests": {
                    icon: "⛓️",
                    titleEn: "Arrest History",
                    titleKn: "ಬಂಧನ ಇತಿಹಾಸ",
                    headersEn: ["Arrest ID", "Arrest Date", "Arresting Station", "Bail Status"],
                    headersKn: ["ಬಂಧನ ಐಡಿ", "ಬಂಧಿಸಿದ ದಿನಾಂಕ", "ಬಂಧಿಸಿದ ಪೊಲೀಸ್ ಠಾಣೆ", "ಜಾಮೀನು ಸ್ಥಿತಿ"],
                    rows: [
                        ["ARR-2023-991", "14 Nov 2023", "Whitefield PS", "Out on Bail (12 Feb 2024)"],
                        ["ARR-2022-104", "02 May 2022", "Ramanagara Town PS", "Sentenced / Released"]
                    ]
                },
                "network": {
                    icon: "🕸️",
                    titleEn: "Network View",
                    titleKn: "ನೆಟ್‌ವರ್ಕ್ ನೋಟ",
                    headersEn: ["Associate Name / ID", "Role / Alias", "Shared FIRs", "Current Status"],
                    headersKn: ["ಸಹಚರರ ಹೆಸರು / ಐಡಿ", "ಪಾತ್ರ / ಅಡ್ಡಹೆಸರು", "ಹಂಚಿಕೊಂಡ ಎಫ್‌ಐಆರ್‌ಗಳು", "ಪ್ರಸ್ತುತ ಸ್ಥಿತಿ"],
                    rows: [
                        ["Ramesh @ 'Gundu' (ACC-771)", "Co-Accused / Lock Picker", "2 Cases", "In Custody"],
                        ["Suresh Kumar (ACC-902)", "Fence / Stolen Gold Receiver", "3 Cases", "Absconding"],
                        ["Venkatesh K. (ACC-314)", "Driver / Getaway", "1 Case", "Out on Bail"],
                        ["Anand M. (ACC-509)", "Informant", "1 Case", "Under Surveillance"],
                        ["Kiran S. (ACC-612)", "Gangs Associate", "2 Cases", "Active Investigation"],
                        ["Prakash B. (ACC-118)", "Receiver", "1 Case", "Wanted"]
                    ]
                },
                "mo-matches": {
                    icon: "🚨",
                    titleEn: "MO Match Flags",
                    titleKn: "ಎಂ.ಒ. ಪಂದ್ಯದ ಫ್ಲ್ಯಾಗ್‌ಗಳು",
                    headersEn: ["Open Case FIR", "Incident Location", "MO Technique", "Match Score"],
                    headersKn: ["ಮುಕ್ತ ಎಫ್‌ಐಆರ್", "ಘಟನೆ ಸ್ಥಳ", "ಎಂಒ ತಂತ್ರಜ್ಞಾನ", "ಪಂದ್ಯದ ಅಂಕ"],
                    rows: [
                        ["FIR-UN-2024-019", "Marathahalli Sub-division", "Rear Window Hydraulic Shear Cut", "94% Match"],
                        ["FIR-UN-2024-044", "Kadugodi Colony", "Night Break-in / Hydraulic Shear", "91% Match"],
                        ["FIR-UN-2024-082", "Mahadevapura Area", "Grill Cutting / CCTV Spray Cut", "88% Match"],
                        ["FIR-UN-2023-511", "Bellandur Outer Ring Rd", "Rear Door Grill Pry", "86% Match"],
                        ["FIR-UN-2023-602", "Varthur Main Rd", "Hydraulic Shear Cut", "85% Match"]
                    ]
                }
            }
        }
    },

    // --- SUSPECT 2: Syed @ "Skimmer" Ibrahim (ACC-70412) ---
    {
        id: "ACC-70412",
        name: "Syed Ibrahim",
        matchKeywords: ["syed", "ibrahim", "skimmer", "atm", "koramangala", "acc-70412", "cloning", "cyber", "ಸೈಯದ್", "ಇಬ್ರಾಹಿಂ", "ಸ್ಕಿಮ್ಮರ್", "ಎಟಿಎಂ", "ಕೋರಮಂಗಲ", "ಸೈಬರ್"],
        data: {
            suspectId: "ACC-70412",
            suspectName: "Syed @ 'Skimmer' Ibrahim",
            queryTextEn: "Show cyber crime and ATM skimming records for Suspect ACC-70412 in Koramangala",
            queryTextKn: "ಕೋರಮಂಗಲದ ಸೈಬರ್ ಅಪರಾಧ ಮತ್ತು ಎಟಿಎಂ ಸ್ಕಿಮ್ಮಿಂಗ್ ಪ್ರಕರಣದಲ್ಲಿ ಶಂಕಿತ ACC-70412 ರ ವಿವರಗಳನ್ನು ತೋರಿಸಿ",
            directAnswerEn: `Suspect <strong>ACC-70412 (Syed @ "Skimmer" Ibrahim)</strong> is linked to 6 registered cyber fraud FIRs across Koramangala, Indiranagar, and Jayanagar PS. 4 cases have been chargesheeted while 2 remain under investigation. Last arrested on 28 Aug 2023, subject manages 4 key associates specializing in POS terminal tampering and magnetic card cloning. 4 unsolved financial fraud cases match his specific skimming technique.`,
            directAnswerKn: `ಶಂಕಿತ <strong>ACC-70412 (ಸೈಯದ್ @ "ಸ್ಕಿಮ್ಮರ್" ಇಬ್ರಾಹಿಂ)</strong> ಕೋರಮಂಗಲ, ಇಂದಿರಾನಗರ ಮತ್ತು ಜಯನಗರ ಠಾಣೆಗಳಲ್ಲಿ 6 ಸೈಬರ್ ವಂಚನೆ ಎಫ್‌ಐಆರ್‌ಗಳಿಗೆ ಲಿಂಕ್ ಆಗಿದ್ದಾರೆ. 4 ಪ್ರಕರಣಗಳಲ್ಲಿ ಚಾರ್ಜ್‌ಶೀಟ್ ಸಲ್ಲಿಕೆಯಾಗಿದ್ದು 2 ಪ್ರಕರಣ ವಿಚಾರಣೆಯಲ್ಲಿದೆ. 28 ಆಗಸ್ಟ್ 2023 ರಂದು ಬಂಧಿಸಲಾಗಿತ್ತು. ಪಿಒಎಸ್ ಟರ್ಮಿನಲ್ ಟ್ಯಾಂಪರಿಂಗ್ ಮತ್ತು ಮ್ಯಾಗ್ನೆಟಿಕ್ ಕಾರ್ಡ್ ಕ್ಲೋನಿಂಗ್‌ನಲ್ಲಿ ಪರಿಣತಿ ಹೊಂದಿರುವ 4 ಪ್ರಮುಖ ಸಹಚರರಿದ್ದಾರೆ. 4 ಮುಕ್ತ ಸೈಬರ್ ವಂಚನೆ ಪ್ರಕರಣಗಳು ಇವರ ಎಂಒಗೆ ಹೋಲುತ್ತವೆ.`,
            cardsDetail: {
                "linked-cases": {
                    icon: "📄",
                    titleEn: "Linked Cases",
                    titleKn: "ಸಂಪರ್ಕಿತ ಪ್ರಕರಣಗಳು",
                    headersEn: ["FIR No.", "Station / District", "Sections", "Status"],
                    headersKn: ["ಎಫ್‌ಐಆರ್ ಸಂಖ್ಯೆ", "ಠಾಣೆ / ಜಿಲ್ಲೆ", "ವಿಭಾಗಗಳು", "ಸ್ಥಿತಿ"],
                    rows: [
                        ["FIR-2023-KM-301", "Koramangala Cyber PS", "IT Act 66D, IPC 420", "Chargesheeted"],
                        ["FIR-2023-IND-114", "Indiranagar PS", "IT Act 66C, IPC 419", "Chargesheeted"],
                        ["FIR-2023-JAY-092", "Jayanagar PS", "IPC 420, 120B", "Chargesheeted"],
                        ["FIR-2024-KM-015", "Koramangala PS", "IT Act 66D", "Active Investigation"],
                        ["FIR-2022-CEN-502", "Cyber Crime CEN PS", "IPC 420", "Chargesheeted"],
                        ["FIR-2024-IND-041", "Indiranagar PS", "IT Act 66C", "Under Inquiry"]
                    ]
                },
                "chargesheet": {
                    icon: "⚖️",
                    titleEn: "Chargesheet Status",
                    titleKn: "ಚಾರ್ಜ್‌ಶೀಟ್ ಸ್ಥಿತಿ",
                    headersEn: ["CS Record No.", "Related FIR", "Court File Date", "Status"],
                    headersKn: ["ಚಾರ್ಜ್‌ಶೀಟ್ ಸಂಖ್ಯೆ", "ಸಂಬಂಧಿತ ಎಫ್‌ಐಆರ್", "ನ್ಯಾಯಾಲಯ ಸಲ್ಲಿಕೆ ದಿನಾಂಕ", "ಸ್ಥಿತಿ"],
                    rows: [
                        ["CS-2023-KM-0044", "FIR-2023-KM-301", "15 Nov 2023", "Filed in ACMM Court"],
                        ["CS-2023-IND-0012", "FIR-2023-IND-114", "02 Oct 2023", "Filed in ACMM Court"],
                        ["CS-2023-JAY-0089", "FIR-2023-JAY-092", "20 Jan 2024", "Filed in Court No. 4"],
                        ["CS-2022-CEN-0105", "FIR-2022-CEN-502", "11 Aug 2022", "Trial in Progress"],
                        ["CS-PENDING-015", "FIR-2024-KM-015", "Pending", "FSL Report Awaited"],
                        ["CS-PENDING-041", "FIR-2024-IND-041", "Pending", "Investigation Active"]
                    ]
                },
                "arrests": {
                    icon: "⛓️",
                    titleEn: "Arrest History",
                    titleKn: "ಬಂಧನ ಇತಿಹಾಸ",
                    headersEn: ["Arrest ID", "Arrest Date", "Arresting Station", "Bail Status"],
                    headersKn: ["ಬಂಧನ ಐಡಿ", "ಬಂಧಿಸಿದ ದಿನಾಂಕ", "ಬಂಧಿಸಿದ ಪೊಲೀಸ್ ಠಾಣೆ", "ಜಾಮೀನು ಸ್ಥಿತಿ"],
                    rows: [
                        ["ARR-2023-412", "28 Aug 2023", "Koramangala Cyber PS", "Judicial Custody / Bail Applied"],
                        ["ARR-2022-098", "14 Feb 2022", "CEN Cyber PS", "Out on Conditional Bail"],
                        ["ARR-2020-511", "09 Nov 2020", "Indiranagar PS", "Acquitted on Benefit of Doubt"]
                    ]
                },
                "network": {
                    icon: "🕸️",
                    titleEn: "Network View",
                    titleKn: "ನೆಟ್‌ವರ್ಕ್ ನೋಟ",
                    headersEn: ["Associate Name / ID", "Role / Alias", "Shared FIRs", "Current Status"],
                    headersKn: ["ಸಹಚರರ ಹೆಸರು / ಐಡಿ", "ಪಾತ್ರ / ಅಡ್ಡಹೆಸರು", "ಹಂಚಿಕೊಂಡ ಎಫ್‌ಐಆರ್‌ಗಳು", "ಪ್ರಸ್ತುತ ಸ್ಥಿತಿ"],
                    rows: [
                        ["Imran Khan (ACC-812)", "ATM Micro-Cam Installer", "3 Cases", "In Custody"],
                        ["Vikram Sharma (ACC-640)", "MSR Card Reader Supplier", "2 Cases", "Absconding"],
                        ["Farooq @ 'Techie' (ACC-991)", "Decoder & Dump Writer", "4 Cases", "Wanted"],
                        ["Nitin M. (ACC-204)", "Mule Account Handler", "1 Case", "Out on Bail"]
                    ]
                },
                "mo-matches": {
                    icon: "🚨",
                    titleEn: "MO Match Flags",
                    titleKn: "ಎಂ.ಒ. ಪಂದ್ಯದ ಫ್ಲ್ಯಾಗ್‌ಗಳು",
                    headersEn: ["Open Case FIR", "Incident Location", "MO Technique", "Match Score"],
                    headersKn: ["ಮುಕ್ತ ಎಫ್‌ಐಆರ್", "ಘಟನೆ ಸ್ಥಳ", "ಎಂಒ ತಂತ್ರಜ್ಞಾನ", "ಪಂದ್ಯದ ಅಂಕ"],
                    rows: [
                        ["FIR-UN-2024-311", "HSR Layout Sector 1 ATM", "Overlaid Skimmer & Pinhole Cam", "96% Match"],
                        ["FIR-UN-2024-388", "BTM 2nd Stage ATM Kiosk", "Deep Insert Skimmer Device", "92% Match"],
                        ["FIR-UN-2024-405", "Old Airport Road ATM", "Bluetooth POS Skimmer Overlay", "89% Match"],
                        ["FIR-UN-2023-890", "Koramangala 8th Block", "ATM Keypad Overlay Sniffer", "87% Match"]
                    ]
                }
            }
        }
    },

    // --- SUSPECT 3: Venkatesh @ "Chaddi Gang" Gowda (ACC-55190) ---
    {
        id: "ACC-55190",
        name: "Venkatesh Gowda",
        matchKeywords: ["venkatesh", "gowda", "chaddi", "highway", "davanagere", "acc-55190", "dacoity", "chitradurga", "ವೆಂಕಟೇಶ್", "ಗೌಡ", "ಚಡ್ಡಿ", "ಹೆದ್ದಾರಿ", "ದಾವಣಗೆರೆ", "ದರೋಡೆ", "ಚಿತ್ರದುರ್ಗ"],
        data: {
            suspectId: "ACC-55190",
            suspectName: "Venkatesh @ 'Chaddi Gang' Gowda",
            queryTextEn: "Show highway robbery and armed dacoity cases for Suspect ACC-55190 in Davanagere",
            queryTextKn: "ದಾವಣಗೆರೆಯಲ್ಲಿ ಹೆದ್ದಾರಿ ದರೋಡೆ ಮತ್ತು ಸಶಸ್ತ್ರ ದರೋಡೆ ಪ್ರಕರಣದಲ್ಲಿ ಶಂಕಿತ ACC-55190 ರ ವಿವರಗಳನ್ನು ತೋರಿಸಿ",
            directAnswerEn: `Suspect <strong>ACC-55190 (Venkatesh @ "Chaddi Gang" Gowda)</strong> is linked to 8 registered violent dacoity FIRs across Davanagere, Chitradurga, and Tumakuru highways. 5 cases are chargesheeted while 3 remain under trial. Last arrested on 19 Feb 2024. Subject leads an armed 9-member inter-district highway gang. 6 unsolved night highway interception cases match his gang's violent Modus Operandi.`,
            directAnswerKn: `ಶಂಕಿತ <strong>ACC-55190 (ವೆಂಕಟೇಶ್ @ "ಚಡ್ಡಿ ಗ್ಯಾಂಗ್" ಗೌಡ)</strong> ದಾವಣಗೆರೆ, ಚಿತ್ರದುರ್ಗ ಮತ್ತು ತುಮಕೂರು ಹೆದ್ದಾರಿಗಳಲ್ಲಿ 8 ಎಫ್‌ಐಆರ್‌ಗಳಿಗೆ ಲಿಂಕ್ ಆಗಿದ್ದಾರೆ. 5 ಪ್ರಕರಣಗಳಲ್ಲಿ ಚಾರ್ಜ್‌ಶೀಟ್ ಸಲ್ಲಿಕೆಯಾಗಿದ್ದು 3 ಬಾಕಿ ಉಳಿದಿವೆ. 19 ಫೆಬ್ರವರಿ 2024 ರಂದು ಬಂಧಿಸಲಾಗಿದೆ. ಇವರು 9 ಸಶಸ್ತ್ರ ಹೆದ್ದಾರಿ ಗ್ಯಾಂಗ್ ಸಹಚರರನ್ನು ಮುನ್ನಡೆಸುತ್ತಾರೆ. 6 ಮುಕ್ತ ಹೆದ್ದಾರಿ ದರೋಡೆ ಪ್ರಕರಣಗಳು ಇವರ ಎಂಒಗೆ ಹೋಲುತ್ತವೆ.`,
            cardsDetail: {
                "linked-cases": {
                    icon: "📄",
                    titleEn: "Linked Cases",
                    titleKn: "ಸಂಪರ್ಕಿತ ಪ್ರಕರಣಗಳು",
                    headersEn: ["FIR No.", "Station / District", "Sections", "Status"],
                    headersKn: ["ಎಫ್‌ಐಆರ್ ಸಂಖ್ಯೆ", "ಠಾಣೆ / ಜಿಲ್ಲೆ", "ವಿಭಾಗಗಳು", "ಸ್ಥಿತಿ"],
                    rows: [
                        ["FIR-2024-DVG-012", "Davanagere Rural PS", "IPC 395, 397 (Dacoity)", "Active Under Trial"],
                        ["FIR-2023-CTA-504", "Chitradurga Highway PS", "IPC 394, 341", "Chargesheeted"],
                        ["FIR-2023-TUM-211", "Kyatsandra PS (Tumakuru)", "IPC 395", "Chargesheeted"],
                        ["FIR-2022-DVG-880", "Harihar PS", "IPC 392, 506", "Chargesheeted"],
                        ["FIR-2022-CTA-112", "Hiriyur Rural PS", "IPC 395", "Chargesheeted"],
                        ["FIR-2021-TUM-901", "Sira PS", "IPC 394", "Chargesheeted"],
                        ["FIR-2024-DVG-099", "Davanagere Town PS", "IPC 397", "Investigation Active"],
                        ["FIR-2024-CTA-042", "Chitradurga Town PS", "IPC 395", "Under Inquiry"]
                    ]
                },
                "chargesheet": {
                    icon: "⚖️",
                    titleEn: "Chargesheet Status",
                    titleKn: "ಚಾರ್ಜ್‌ಶೀಟ್ ಸ್ಥಿತಿ",
                    headersEn: ["CS Record No.", "Related FIR", "Court File Date", "Status"],
                    headersKn: ["ಚಾರ್ಜ್‌ಶೀಟ್ ಸಂಖ್ಯೆ", "ಸಂಬಂಧಿತ ಎಫ್‌ಐಆರ್", "ನ್ಯಾಯಾಲಯ ಸಲ್ಲಿಕೆ ದಿನಾಂಕ", "ಸ್ಥಿತಿ"],
                    rows: [
                        ["CS-2023-CTA-0112", "FIR-2023-CTA-504", "10 Dec 2023", "Filed in Sessions Court"],
                        ["CS-2023-TUM-0098", "FIR-2023-TUM-211", "04 Nov 2023", "Filed in District Court"],
                        ["CS-2022-DVG-0412", "FIR-2022-DVG-880", "19 Aug 2022", "Trial Ongoing"],
                        ["CS-2022-CTA-0055", "FIR-2022-CTA-112", "30 May 2022", "Filed in Sessions Court"],
                        ["CS-2021-TUM-0311", "FIR-2021-TUM-901", "14 Feb 2022", "Disposed (Convicted)"],
                        ["CS-PENDING-012", "FIR-2024-DVG-012", "Pending", "Ballistic & DNA Report"],
                        ["CS-PENDING-099", "FIR-2024-DVG-099", "Pending", "Absconding Co-accused"],
                        ["CS-PENDING-042", "FIR-2024-CTA-042", "Pending", "Drafting Phase"]
                    ]
                },
                "arrests": {
                    icon: "⛓️",
                    titleEn: "Arrest History",
                    titleKn: "ಬಂಧನ ಇತಿಹಾಸ",
                    headersEn: ["Arrest ID", "Arrest Date", "Arresting Station", "Bail Status"],
                    headersKn: ["ಬಂಧನ ಐಡಿ", "ಬಂಧಿಸಿದ ದಿನಾಂಕ", "ಬಂಧಿಸಿದ ಪೊಲೀಸ್ ಠಾಣೆ", "ಜಾಮೀನು ಸ್ಥಿತಿ"],
                    rows: [
                        ["ARR-2024-088", "19 Feb 2024", "Davanagere Rural PS", "Central Jail Bellary (No Bail)"],
                        ["ARR-2022-901", "04 Jun 2022", "Chitradurga PS", "Bail Rejected"],
                        ["ARR-2020-114", "11 Jan 2020", "Sira PS", "Released after 2 Years"],
                        ["ARR-2018-005", "22 Jul 2018", "Harihar PS", "Sentence Completed"]
                    ]
                },
                "network": {
                    icon: "🕸️",
                    titleEn: "Network View",
                    titleKn: "ನೆಟ್‌ವರ್ಕ್ ನೋಟ",
                    headersEn: ["Associate Name / ID", "Role / Alias", "Shared FIRs", "Current Status"],
                    headersKn: ["ಸಹಚರರ ಹೆಸರು / ಐಡಿ", "ಪಾತ್ರ / ಅಡ್ಡಹೆಸರು", "ಹಂಚಿಕೊಂಡ ಎಫ್‌ಐಆರ್‌ಗಳು", "ಪ್ರಸ್ತುತ ಸ್ಥಿತಿ"],
                    rows: [
                        ["Basavaraj @ 'Kulla' (ACC-102)", "Second-in-Command / Weapons", "5 Cases", "Central Jail Bellary"],
                        ["Thimmayya (ACC-449)", "Scout & Vehicle Tracker", "4 Cases", "In Custody"],
                        ["Manja @ 'Iron Pipe' (ACC-311)", "Enforcer / Assault", "6 Cases", "Absconding"],
                        ["Nagaraj (ACC-882)", "Stolen Truck Converter", "2 Cases", "Wanted"],
                        ["Shivanna (ACC-501)", "Informant / Dhaba Tipster", "3 Cases", "Under Surveillance"],
                        ["Rudrappa (ACC-774)", "Jewelry Fence", "4 Cases", "In Custody"],
                        ["Eshwar (ACC-220)", "Driver", "2 Cases", "Out on Bail"],
                        ["Kenchappa (ACC-990)", "Hideout Provider", "1 Case", "In Custody"],
                        ["Kumar (ACC-119)", "Gangs Associate", "3 Cases", "Wanted"]
                    ]
                },
                "mo-matches": {
                    icon: "🚨",
                    titleEn: "MO Match Flags",
                    titleKn: "ಎಂ.ಒ. ಪಂದ್ಯದ ಫ್ಲ್ಯಾಗ್‌ಗಳು",
                    headersEn: ["Open Case FIR", "Incident Location", "MO Technique", "Match Score"],
                    headersKn: ["ಮುಕ್ತ ಎಫ್‌ಐಆರ್", "ಘಟನೆ ಸ್ಥಳ", "ಎಂಒ ತಂತ್ರಜ್ಞಾನ", "ಪಂದ್ಯದ ಅಂಕ"],
                    rows: [
                        ["FIR-UN-2024-901", "NH-48 Chitradurga Bypass", "Spike Strip Vehicle Interception", "97% Match"],
                        ["FIR-UN-2024-944", "Davanagere Ring Road", "Iron Rod Assault & Cash Loot", "95% Match"],
                        ["FIR-UN-2024-980", "Hiriyur Toll Junction", "False Barrier Night Robbery", "92% Match"],
                        ["FIR-UN-2023-712", "Sira-Madhugiri Road", "Truck Driver Binding & Hijack", "89% Match"],
                        ["FIR-UN-2023-801", "Challakere Highway", "Oil Spray on Windshield Loot", "86% Match"],
                        ["FIR-UN-2023-889", "Holalkere Bypass", "Armed Gang Interception", "84% Match"]
                    ]
                }
            }
        }
    }
];

// Backwards compatibility alias for code referencing global MOCK_DATA
const MOCK_DATA = MOCK_SUSPECTS[0].data;

// Global reference for currently displayed suspect entity
window.ACTIVE_ENTITY_DATA = MOCK_SUSPECTS[0].data;


// ==========================================================================
// 2. BILINGUAL TRANSLATION DICTIONARY
// ==========================================================================
const TRANSLATIONS = {
    en: {
        appTitle: "SENTINEL",
        appSub: "KSP Crime Records Intelligence",
        roleLabel: "Role:",
        roleInvestigator: "Investigator",
        roleSupervisor: "Supervisor",
        newChat: "New Investigation",
        recentQueries: "Recent Queries",
        viewStateTitle: "UI State Preview",
        state1Label: "State 1: Empty Chat",
        state2Label: "State 2: Resolved Entity",
        exportPdf: "Export as PDF",
        welcomeTitle: "Karnataka State Police Crime Intelligence",
        welcomeSub: "Bilingual Natural Language Crime Records Query & Entity Resolution System",
        inputPlaceholder: "Ask a question or enter suspect/FIR ID...",
        followupPlaceholder: "Ask follow-up question...",
        micTooltip: "Mic ready (visual placeholder)",
        suggestedLabel: "Suggested Queries:",
        entityResolvedTag: "RESOLVED ENTITY SUMMARY",
        directAnswerHeader: "Direct Intelligence Response",
        confidenceBadge: "High Confidence Match (98.4%)",
        keyMetricsHeader: "Investigative Indicators",
        cardsHint: "Click any card to inspect detailed record logs",

        graphHeading: "Associate & Case Relationship Graph",
        graphPlaceholderTag: "Ready for D3 / vis-network",
        graphNote: "Container <code>#network-graph</code> initialized. Ready for D3.js or vis-network instance.",

        reasoningTitle: "Show reasoning and sources",
        reasoningMeta: "4 CCTNS Tables • SQL Executed",
        closeBtn: "Close Window",

        // Sidebar History Items
        hist1Title: "Suspect #89241 Whitefield burglary",
        hist2Title: "Suspect #70412 Cyber skimming Koramangala",
        hist3Title: "Suspect #55190 Highway dacoity Davanagere",
        hist4Title: "Night burglary MO matching flags"
    },
    kn: {
        appTitle: "ಸೆಂಟಿನೆಲ್",
        appSub: "ಕೆಎಸ್‍ಪಿ ಅಪರಾಧ ದಾಖಲೆಗಳ ಬುದ್ಧಿವಂತಿಕೆ",
        roleLabel: "ಪಾತ್ರ:",
        roleInvestigator: "ತನಿಖಾಧಿಕಾರಿ",
        roleSupervisor: "ಮೇಲ್ವಿಚಾರಕ",
        newChat: "ಹೊಸ ತನಿಖೆ",
        recentQueries: "ಇತ್ತೀಚಿನ ಪ್ರಶ್ನೆಗಳು",
        viewStateTitle: "ಯುಐ ಸ್ಥಿತಿ ಮುನ್ನೋಟ",
        state1Label: "ಸ್ಥಿತಿ 1: ಖಾಲಿ ಚಾಟ್",
        state2Label: "ಸ್ಥಿತಿ 2: ಪರಿಹರಿಸಿದ ಕಾಯ್ದೆ",
        exportPdf: "PDF ರಫ್ತು ಮಾಡಿ",
        welcomeTitle: "ಕರ್ನಾಟಕ ರಾಜ್ಯ ಪೊಲೀಸ್ ಅಪರಾಧ ಬುದ್ಧಿವಂತಿಕೆ",
        welcomeSub: "ದ್ವಿಭಾಷಾ ನೈಸರ್ಗಿಕ ಭಾಷೆಯ ಅಪರಾಧ ದಾಖಲೆಗಳ ಪ್ರಶ್ನೆ ಮತ್ತು ಕಾಯ್ದೆ ವ್ಯವಸ್ಥೆ",
        inputPlaceholder: "ಪ್ರಶ್ನೆ ಕೇಳಿ ಅಥವಾ ಶಂಕಿತ/ಎಫ್‌ಐಆರ್ ಐಡಿ ನಮೂದಿಸಿ...",
        followupPlaceholder: "ಮುಂದಿನ ಪ್ರಶ್ನೆ ಕೇಳಿ...",
        micTooltip: "ಮೈಕ್ ಸಿದ್ಧವಾಗಿದೆ",
        suggestedLabel: "ಸೂಚಿಸಿದ ಪ್ರಶ್ನೆಗಳು:",
        entityResolvedTag: "ಪರಿಹರಿಸಿದ ಕಾಯ್ದೆ ಸಾರಾಂಶ",
        directAnswerHeader: "ನೇರ ಅಪರಾಧ ವಿಶ್ಲೇಷಣೆ ಉತ್ತರ",
        confidenceBadge: "ಹೆಚ್ಚಿನ ವಿಶ್ವಾಸಾರ್ಹತೆ ಪಂದ್ಯ (98.4%)",
        keyMetricsHeader: "ತನಿಖಾ ಸೂಚಕಗಳು",
        cardsHint: "ವಿವರವಾದ ದಾಖಲೆಗಳನ್ನು ಪರಿಶೀಲಿಸಲು ಯಾವುದೇ ಕಾರ್ಡ್ ಕ್ಲಿಕ್ ಮಾಡಿ",

        graphHeading: "ಸಹಚರ ಮತ್ತು ಪ್ರಕರಣ ಸಂಬಂಧಿತ ಗ್ರಾಫ್",
        graphPlaceholderTag: "D3 / vis-network ಗೆ ಸಿದ್ಧವಾಗಿದೆ",
        graphNote: "ಕಂಟೇನರ್ <code>#network-graph</code> ಸಿದ್ಧವಾಗಿದೆ. D3.js ಅಥವಾ vis-network ನಮೂದಿಸಲು ಅನುಕೂಲಕರವಾಗಿದೆ.",

        reasoningTitle: "ಕಾರಣ ಮತ್ತು ಮೂಲಗಳನ್ನು ತೋರಿಸಿ",
        reasoningMeta: "4 CCTNS ಕೋಷ್ಟಕಗಳು • SQL ಜಾರಿಯಾಗಿದೆ",
        closeBtn: "ವಿಂಡೋ ಮುಚ್ಚಿ",

        // Sidebar History Items
        hist1Title: "ಶಂಕಿತ #89241 ವೈಟ್‌ಫೀಲ್ಡ್ ಕಳವು",
        hist2Title: "ಶಂಕಿತ #70412 ಸೈಬರ್ ಸ್ಕಿಮ್ಮಿಂಗ್ ಕೋರಮಂಗಲ",
        hist3Title: "ಶಂಕಿತ #55190 ಹೆದ್ದಾರಿ ದರೋಡೆ ದಾವಣಗೆರೆ",
        hist4Title: "ರಾತ್ರಿ ಕಳವು ಎಂಒ ಪಂದ್ಯದ ಫ್ಲ್ಯಾಗ್‌ಗಳು"
    }
};

// Keys managed dynamically by renderState2WithData (avoid static translation overwrite)
const DYNAMIC_I18N_KEYS = [
    'activeQueryText', 'directAnswerText',
    'card1Title', 'card1StatLabel', 'card1SubInfo',
    'card2Title', 'card2StatLabel', 'card2Status1', 'card2Status2',
    'card3Title', 'card3StatLabel', 'card3SubInfo',
    'card4Title', 'card4StatLabel', 'card4SubInfo',
    'card5Title', 'card5StatLabel', 'card5SubInfo'
];

// Suggested Query Chips by Role and Language
const SUGGESTED_CHIPS = {
    investigator: {
        en: [
            "Show all FIRs for suspect Manjunath ACC-89241",
            "Show ATM skimming records for Syed Ibrahim ACC-70412",
            "Show highway dacoity cases for Venkatesh Gowda ACC-55190",
            "Find suspects linked to MO burglary cases"
        ],
        kn: [
            "ಶಂಕಿತ ಮಂಜುನಾಥ್ ACC-89241 ರ ಎಲ್ಲಾ ಎಫ್‌ಐಆರ್‌ಗಳನ್ನು ತೋರಿಸಿ",
            "ಸೈಯದ್ ಇಬ್ರಾಹಿಂ ACC-70412 ರ ಎಟಿಎಂ ಸ್ಕಿಮ್ಮಿಂಗ್ ದಾಖಲೆಗಳನ್ನು ತೋರಿಸಿ",
            "ವೆಂಕಟೇಶ್ ಗೌಡ ACC-55190 ರ ಹೆದ್ದಾರಿ ದರೋಡೆ ಪ್ರಕರಣಗಳನ್ನು ತೋರಿಸಿ",
            "ರಾತ್ರಿ ಕಳವು ಎಂಒ ಪ್ರಕರಣಗಳಿಗೆ ಲಿಂಕ್ ಆಗಿರುವ ಶಂಕಿತರನ್ನು ಹುಡುಕಿ"
        ]
    },
    supervisor: {
        en: [
            "Show all FIRs in Whitefield district",
            "District-wide burglary case count summary 2024",
            "Overall chargesheet filing rate across stations"
        ],
        kn: [
            "ವೈಟ್‌ಫೀಲ್ಡ್ ವಿಭಾಗದ ಎಲ್ಲಾ ಎಫ್‌ಐಆರ್‌ಗಳನ್ನು ತೋರಿಸಿ",
            "ಜಿಲ್ಲಾವಾರು ಕಳವು ಪ್ರಕರಣಗಳ ಒಟ್ಟು ಸಂಖ್ಯೆ ಸಾರಾಂಶ 2024",
            "ಠಾಣೆಗಳಲ್ಲಿ ಒಟ್ಟಾರೆ ಚಾರ್ಜ್‌ಶೀಟ್ ಸಲ್ಲಿಕೆ ದರ"
        ]
    }
};

// ==========================================================================
// 3. APPLICATION STATE MANAGEMENT
// ==========================================================================
let currentLang = 'en'; // 'en' | 'kn'
let currentRole = 'investigator'; // 'investigator' | 'supervisor'
let currentState = 1; // 1 (Empty/Chat) | 2 (Resolved Entity)

// Initialize DOM on Load
document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    renderSuggestedChips();
    updateTranslations();
    renderState2WithData(MOCK_SUSPECTS[0].data);
});

// Setup All Interactive Handlers
function initEventListeners() {
    // 1. Language Toggle Button
    const langBtn = document.getElementById('lang-toggle-btn');
    if (langBtn) {
        langBtn.addEventListener('click', toggleLanguage);
    }

    // 2. Role Toggle Button
    const roleBtn = document.getElementById('role-toggle-btn');
    if (roleBtn) {
        roleBtn.addEventListener('click', toggleRole);
    }

    // 3. State Switcher Buttons (Sidebar testing toggles & New Chat)
    document.getElementById('btn-state-1')?.addEventListener('click', () => switchState(1));
    document.getElementById('btn-state-2')?.addEventListener('click', () => switchState(2));
    document.getElementById('btn-new-chat')?.addEventListener('click', () => switchState(1));

    // 4. Sidebar History Items click handler (.history-item and .recent-list__item)
    const historyItems = document.querySelectorAll('.history-item, .recent-list__item');
    historyItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            historyItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            const suspectId = item.getAttribute('data-suspect-id');
            const titleEl = item.querySelector('.history-title') || item;
            const queryText = titleEl.textContent.replace(/\s+/g, ' ').trim();

            let suspect = null;

            // 1. Match suspect by explicit data-suspect-id attribute
            if (suspectId) {
                suspect = MOCK_SUSPECTS.find(s => s.id === suspectId);
            }

            // 2. Fallback to fuzzy / text query matching
            if (!suspect) {
                suspect = findSuspectByQuery(queryText);
            }

            // 3. Fallback to array index
            if (!suspect && MOCK_SUSPECTS[index]) {
                suspect = MOCK_SUSPECTS[index];
            }

            // 4. Default fallback
            if (!suspect) {
                suspect = MOCK_SUSPECTS[0];
            }

            renderState2WithData(suspect.data, queryText);
            showState(2);
        });
    });

    // 5. Chat Form Submission (State 1 and State 2)
    document.getElementById('chat-form-state1')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const queryVal = document.getElementById('chat-input-1').value.trim();
        handleQuerySubmit(queryVal);
    });

    document.getElementById('chat-form-state2')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const queryVal = document.getElementById('chat-input-2').value.trim();
        handleQuerySubmit(queryVal);
    });

    // 6. Preview Cards Click Event -> Open Modal
    const previewCards = document.querySelectorAll('.preview-card');
    previewCards.forEach(card => {
        card.addEventListener('click', () => {
            const cardKey = card.dataset.card;
            openDetailModal(cardKey);
        });
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openDetailModal(card.dataset.card);
            }
        });
    });

    // 7. Modal Close Controls
    document.getElementById('modal-close-btn')?.addEventListener('click', closeModal);
    document.getElementById('modal-ok-btn')?.addEventListener('click', closeModal);
    document.getElementById('detail-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'detail-modal') closeModal();
    });

    // 8. PDF Export Button
    document.getElementById('btn-export-pdf')?.addEventListener('click', () => {
        window.print();
    });
}

// ==========================================================================
// 4. FUZZY MATCHING & LEVENSHTEIN DISTANCE
// ==========================================================================

/**
 * Calculates Levenshtein distance between two strings
 */
function levenshteinDistance(a, b) {
    const aLen = a.length;
    const bLen = b.length;
    if (aLen === 0) return bLen;
    if (bLen === 0) return aLen;

    const row = Array(bLen + 1);
    for (let i = 0; i <= bLen; i++) row[i] = i;

    for (let i = 1; i <= aLen; i++) {
        let prev = i - 1;
        row[0] = i;
        for (let j = 1; j <= bLen; j++) {
            const temp = row[j];
            if (a[i - 1] === b[j - 1]) {
                row[j] = prev;
            } else {
                row[j] = Math.min(prev + 1, Math.min(row[j] + 1, row[j - 1] + 1));
            }
            prev = temp;
        }
    }
    return row[bLen];
}

/**
 * Helper to escape HTML characters in user input to prevent XSS
 */
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Finds a suspect in MOCK_SUSPECTS matching query by exact substring or Levenshtein distance fuzzy matching
 * @param {string} query 
 * @returns {Object|null} Suspect object or null if no match found
 */
function findSuspectByQuery(query) {
    if (!query || !query.trim()) return null;
    const lowerQuery = query.toLowerCase().trim();

    // 1. Exact substring matching against matchKeywords
    let matched = MOCK_SUSPECTS.find(suspect => {
        return suspect.matchKeywords.some(keyword => lowerQuery.includes(keyword.toLowerCase()));
    });
    if (matched) return matched;

    // 2. Fuzzy matching: check for close matches (at most 1-2 char difference) for keywords longer than 4 chars
    const queryWords = lowerQuery.split(/[^a-z0-9\u0C80-\u0CFF]+/i).filter(w => w.length >= 3);

    matched = MOCK_SUSPECTS.find(suspect => {
        return suspect.matchKeywords.some(keyword => {
            const kw = keyword.toLowerCase();
            if (kw.length <= 4) return false;

            const maxAllowedDist = kw.length > 6 ? 2 : 1;

            return queryWords.some(word => {
                if (Math.abs(word.length - kw.length) > maxAllowedDist) return false;
                return levenshteinDistance(word, kw) <= maxAllowedDist;
            });
        });
    });

    return matched || null;
}

// ==========================================================================
// 5. RENDER STATE 2 WITH DATA & QUERY HANDLING
// ==========================================================================

/**
 * Updates all DOM elements in State 2 to display a specific suspect's dataset or No Results state
 * @param {Object|null} data - A suspect's `data` object or null if no match found
 * @param {string} [queryText] - The user query text
 */
function renderState2WithData(data, queryText) {
    const state2View = document.getElementById('state-2-view');
    const answerCard = document.querySelector('.direct-answer-card');
    const activeQueryEl = document.getElementById('active-query-text');
    const answerHeaderEl = document.querySelector('.direct-answer-card .answer-header');
    const answerBodyEl = document.getElementById('answer-body-text');
    const isKn = currentLang === 'kn';

    if (!data) {
        // --- NO RESULTS FOUND STATE ---
        window.ACTIVE_ENTITY_DATA = null;
        window.LAST_QUERY_NO_RESULTS = queryText || "Query";

        if (state2View) state2View.classList.add('no-results-mode');
        if (answerCard) answerCard.classList.add('no-results');

        if (activeQueryEl && queryText) {
            activeQueryEl.textContent = queryText;
        }

        if (answerHeaderEl) {
            answerHeaderEl.innerHTML = `
                <div class="ai-badge">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <span>${isKn ? "ಯಾವುದೇ ಪಂದ್ಯ ಸಿಗಲಿಲ್ಲ" : "No Match Found"}</span>
                </div>
                <span class="confidence-badge">${isKn ? "0 ಫಲಿತಾಂಶಗಳು" : "0 Matches"}</span>
            `;
        }

        if (answerBodyEl) {
            const escapedQuery = escapeHtml(queryText || "");
            answerBodyEl.innerHTML = isKn
                ? `<strong>"${escapedQuery}"</strong> ಗಾಗಿ ಯಾವುದೇ ದಾಖಲೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ. ಶಂಕಿತರ ಹೆಸರು, ACC ID, ಅಥವಾ ಅಪರಾಧದ ಪ್ರಕಾರವನ್ನು ಪ್ರಯತ್ನಿಸಿ.`
                : `No matching records found for <strong>"${escapedQuery}"</strong>. Try a suspect name, ACC ID, or crime type.`;
        }
        return;
    }

    // --- NORMAL MATCHED SUSPECT STATE ---
    window.ACTIVE_ENTITY_DATA = data;
    window.LAST_QUERY_NO_RESULTS = null;

    if (state2View) state2View.classList.remove('no-results-mode');
    if (answerCard) answerCard.classList.remove('no-results');

    // Restore standard Answer Header
    if (answerHeaderEl) {
        answerHeaderEl.innerHTML = `
            <div class="ai-badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4" />
                    <path d="M12 8h.01" />
                </svg>
                <span data-i18n="directAnswerHeader">${TRANSLATIONS[currentLang].directAnswerHeader}</span>
            </div>
            <span class="confidence-badge" data-i18n="confidenceBadge">${TRANSLATIONS[currentLang].confidenceBadge}</span>
        `;
    }

    // 1. Update #active-query-text
    if (activeQueryEl) {
        activeQueryEl.textContent = queryText ? queryText : (isKn ? data.queryTextKn : data.queryTextEn);
    }

    // 2. Update #answer-body-text innerHTML
    if (answerBodyEl) {
        answerBodyEl.innerHTML = isKn ? data.directAnswerKn : data.directAnswerEn;
    }

    // 3. Update the 5 Preview Cards dynamically
    const cardKeys = ["linked-cases", "chargesheet", "arrests", "network", "mo-matches"];
    cardKeys.forEach(key => {
        const cardEl = document.querySelector(`.preview-card[data-card="${key}"]`);
        const cardData = data.cardsDetail ? data.cardsDetail[key] : null;
        if (!cardEl || !cardData) return;

        // Update Card Title
        const titleEl = cardEl.querySelector('.card-title');
        if (titleEl) {
            titleEl.textContent = isKn ? cardData.titleKn : cardData.titleEn;
        }

        const rows = cardData.rows || [];

        // Update Stat Number
        const statNumEl = cardEl.querySelector('.stat-number');
        if (statNumEl) {
            if (key === "linked-cases") {
                statNumEl.textContent = rows.length;
            } else if (key === "chargesheet") {
                const filedCount = rows.filter(r => {
                    const recNo = (r[0] || "").toLowerCase();
                    const statusStr = (r[3] || "").toLowerCase();
                    return recNo.startsWith("cs-20") || statusStr.includes("filed") || statusStr.includes("disposed") || statusStr.includes("trial") || statusStr.includes("convicted") || statusStr.includes("ಸಲ್ಲಿಕೆ");
                }).length;
                statNumEl.innerHTML = `${filedCount} <small>/ ${rows.length}</small>`;
            } else if (key === "arrests") {
                statNumEl.textContent = rows.length;
            } else if (key === "network") {
                statNumEl.textContent = rows.length;
            } else if (key === "mo-matches") {
                statNumEl.textContent = rows.length;
            }
        }

        // Update Sub-info badges/pills
        const subInfoEl = cardEl.querySelector('.card-sub-info');
        if (subInfoEl) {
            if (key === "linked-cases") {
                const badge = subInfoEl.querySelector('.sub-badge');
                if (badge) {
                    badge.textContent = isKn ? `${rows.length} ಪ್ರಕರಣಗಳು ನೋಂದಾಯಿಸಲಾಗಿದೆ` : `${rows.length} Total FIR Records`;
                }
            } else if (key === "chargesheet") {
                const pills = subInfoEl.querySelectorAll('.sub-pill');
                if (pills.length >= 2) {
                    const filedCount = rows.filter(r => {
                        const recNo = (r[0] || "").toLowerCase();
                        const statusStr = (r[3] || "").toLowerCase();
                        return recNo.startsWith("cs-20") || statusStr.includes("filed") || statusStr.includes("disposed") || statusStr.includes("trial") || statusStr.includes("convicted") || statusStr.includes("ಸಲ್ಲಿಕೆ");
                    }).length;
                    const pendingCount = rows.length - filedCount;
                    pills[0].textContent = isKn ? `${filedCount} ಚಾರ್ಜ್‌ಶೀಟ್` : `${filedCount} Chargesheeted`;
                    pills[1].textContent = isKn ? `${pendingCount} ಬಾಕಿ` : `${pendingCount} Pending`;
                }
            } else if (key === "arrests") {
                const badge = subInfoEl.querySelector('.sub-badge');
                if (badge) {
                    const latestDate = rows.length > 0 ? rows[0][1] : "N/A";
                    badge.textContent = isKn ? `ಇತ್ತೀಚಿನದು: ${latestDate}` : `Latest: ${latestDate}`;
                }
            } else if (key === "network") {
                const badge = subInfoEl.querySelector('.sub-badge');
                if (badge) {
                    badge.textContent = isKn ? `${rows.length} ಸಹಚರರು ಮತ್ತು ಸ್ವೀಕರಿಸುವವರು` : `${rows.length} Known Associates`;
                }
            } else if (key === "mo-matches") {
                const badge = subInfoEl.querySelector('.sub-badge');
                if (badge) {
                    badge.textContent = isKn ? `${rows.length} ಹೊಂದಾಣಿಕೆಯ ಪ್ರಕರಣಗಳು (>80%)` : `${rows.length} Matched Cases (>80%)`;
                }
            }
        }
    });

    // Animate Stat Numbers (0 -> Target)
    animateStatNumbers();
}

/**
 * Animates preview card main stat numbers from 0 up to their target values over 600ms
 */
function animateStatNumbers() {
    const statEls = document.querySelectorAll('.preview-card .stat-number');
    statEls.forEach(el => {
        const text = el.textContent || el.innerText;
        const slashMatch = text.match(/^(\d+)\s*\/\s*(\d+)$/);
        if (slashMatch) {
            const targetNum = parseInt(slashMatch[1], 10);
            const totalNum = parseInt(slashMatch[2], 10);
            const duration = 600;
            const startTime = performance.now();

            function updateSlashCounter(now) {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easeProgress = 1 - Math.pow(1 - progress, 2);
                const currentNum = Math.floor(easeProgress * targetNum);
                el.innerHTML = `${currentNum} <small>/ ${totalNum}</small>`;
                if (progress < 1) {
                    requestAnimationFrame(updateSlashCounter);
                } else {
                    el.innerHTML = `${targetNum} <small>/ ${totalNum}</small>`;
                }
            }
            requestAnimationFrame(updateSlashCounter);
        } else {
            const numMatch = text.match(/^(\d+)/);
            if (numMatch) {
                const targetNum = parseInt(numMatch[1], 10);
                const duration = 600;
                const startTime = performance.now();

                function updateCounter(now) {
                    const elapsed = now - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    const easeProgress = 1 - Math.pow(1 - progress, 2);
                    const currentNum = Math.floor(easeProgress * targetNum);
                    el.textContent = currentNum;
                    if (progress < 1) {
                        requestAnimationFrame(updateCounter);
                    } else {
                        el.textContent = targetNum;
                    }
                }
                requestAnimationFrame(updateCounter);
            }
        }
    });
}

function switchState(stateNum) {
    currentState = stateNum;
    const view1 = document.getElementById('state-1-view');
    const view2 = document.getElementById('state-2-view');
    const btn1 = document.getElementById('btn-state-1');
    const btn2 = document.getElementById('btn-state-2');
    const mainContent = document.getElementById('main-content');

    if (stateNum === 1) {
        view1?.classList.add('active');
        view2?.classList.remove('active', 'animate-in');
        btn1?.classList.add('active');
        btn2?.classList.remove('active');
    } else {
        view1?.classList.remove('active');
        view2?.classList.add('active');
        view2?.classList.remove('animate-in');
        void view2?.offsetWidth; // Trigger reflow to restart CSS animations
        view2?.classList.add('animate-in');
        btn1?.classList.remove('active');
        btn2?.classList.add('active');
    }

    // Redirect to top of summary view instantly without scrolling lag
    if (mainContent) {
        mainContent.scrollTop = 0;
    }
    window.scrollTo(0, 0);
}

function showState(stateNum) {
    switchState(stateNum);
}

function handleQuerySubmit(userQuery) {
    const rawQuery = (userQuery && userQuery.trim()) ? userQuery.trim() : "Show all FIRs for suspect Manjunath ACC-89241";
    const overlay = document.getElementById('query-loading-overlay');

    if (overlay) {
        overlay.classList.add('active');
    }

    setTimeout(() => {
        const matchedSuspect = findSuspectByQuery(rawQuery);

        if (matchedSuspect) {
            renderState2WithData(matchedSuspect.data, rawQuery);
        } else {
            renderState2WithData(null, rawQuery);
        }

        switchState(2);

        if (overlay) {
            overlay.classList.remove('active');
        }

        // Reset input fields
        const input1 = document.getElementById('chat-input-1');
        if (input1) input1.value = '';
        const input2 = document.getElementById('chat-input-2');
        if (input2) input2.value = '';
    }, 450);
}

// ==========================================================================
// 5. ROLE ACCESS CONTROL LOGIC (Investigator vs Supervisor)
// ==========================================================================
function toggleRole() {
    currentRole = (currentRole === 'investigator') ? 'supervisor' : 'investigator';

    // Update body CSS class
    document.body.classList.remove('role-investigator', 'role-supervisor');
    document.body.classList.add(`role-${currentRole}`);

    // Update Role Badge UI
    const badgeText = document.getElementById('role-badge-text');
    if (badgeText) {
        if (currentRole === 'investigator') {
            badgeText.className = 'role-badge investigator-badge';
            badgeText.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <span data-i18n="roleInvestigator">${TRANSLATIONS[currentLang].roleInvestigator}</span>
            `;
        } else {
            badgeText.className = 'role-badge supervisor-badge';
            badgeText.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/></svg>
                <span data-i18n="roleSupervisor">${TRANSLATIONS[currentLang].roleSupervisor}</span>
            `;
        }
    }

    // Re-render suggested query chips (hides individual lookup chips for Supervisor)
    renderSuggestedChips();
}

// ==========================================================================
// 6. LANGUAGE TRANSLATION LOGIC (EN <-> Kannada)
// ==========================================================================
function toggleLanguage() {
    currentLang = (currentLang === 'en') ? 'kn' : 'en';

    // Update Body class
    document.body.classList.remove('lang-en', 'lang-kn');
    document.body.classList.add(`lang-${currentLang}`);

    // Update Language Toggle Button UI
    const optEn = document.querySelector('.opt-en');
    const optKn = document.querySelector('.opt-kn');
    if (currentLang === 'en') {
        optEn?.classList.add('active');
        optKn?.classList.remove('active');
    } else {
        optKn?.classList.add('active');
        optEn?.classList.remove('active');
    }

    updateTranslations();
    renderSuggestedChips();

    // Re-render current suspect entity or no-results state in newly selected language
    if (window.LAST_QUERY_NO_RESULTS) {
        renderState2WithData(null, window.LAST_QUERY_NO_RESULTS);
    } else if (window.ACTIVE_ENTITY_DATA) {
        renderState2WithData(window.ACTIVE_ENTITY_DATA);
    }
}

function updateTranslations() {
    const t = TRANSLATIONS[currentLang];

    // Translate elements with data-i18n (skipping dynamic entity elements managed by renderState2WithData)
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (DYNAMIC_I18N_KEYS.includes(key)) {
            return; // Managed dynamically by renderState2WithData
        }
        if (t[key]) {
            el.innerHTML = t[key];
        }
    });

    // Translate input placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (t[key]) {
            el.setAttribute('placeholder', t[key]);
        }
    });
}

function renderSuggestedChips() {
    const container = document.getElementById('suggested-chips');
    if (!container) return;

    const chipList = SUGGESTED_CHIPS[currentRole][currentLang];
    container.innerHTML = '';

    chipList.forEach(text => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'suggested-chip';
        chip.innerHTML = `<span>⚡</span> ${text}`;
        chip.addEventListener('click', () => {
            handleQuerySubmit(text);
        });
        container.appendChild(chip);
    });
}

// ==========================================================================
// 7. PREVIEW CARD MODAL DETAIL WINDOW
// ==========================================================================
function openDetailModal(cardKey) {
    const currentData = window.ACTIVE_ENTITY_DATA || MOCK_SUSPECTS[0].data;
    const data = (currentData && currentData.cardsDetail) ? currentData.cardsDetail[cardKey] : null;
    if (!data) return;

    const modal = document.getElementById('detail-modal');
    const titleEl = document.getElementById('modal-title');
    const iconEl = document.getElementById('modal-icon');
    const bodyEl = document.getElementById('modal-body');

    const isKn = currentLang === 'kn';
    iconEl.textContent = data.icon;
    titleEl.textContent = isKn ? data.titleKn : data.titleEn;

    const headers = isKn ? data.headersKn : data.headersEn;

    let tableHtml = `
        <table class="modal-table">
            <thead>
                <tr>
                    ${headers.map(h => `<th>${h}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
                ${data.rows.map(row => `
                    <tr>
                        ${row.map((cell, idx) => `
                            <td ${idx === 0 ? 'style="font-weight:600; color:var(--text-main);"' : ''}>${cell}</td>
                        `).join('')}
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    bodyEl.innerHTML = tableHtml;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
    const modal = document.getElementById('detail-modal');
    if (modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
    }
}
