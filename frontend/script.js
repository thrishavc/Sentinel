/**
 * ==========================================================================
 * SENTINEL — BILINGUAL KSP CRIME INVESTIGATOR INTERFACE (frontend/script.js)
 * Target: Karnataka State Police Datathon 2026
 * Description: Core logic handling State 1 & State 2, live Catalyst serverless
 *              backend integration, EN/Kannada translation, Investigator/Supervisor
 *              role access control, and modal detail views.
 * ==========================================================================
 */

// ==========================================================================
// 1. LIVE BACKEND CONFIGURATION
// ==========================================================================
const CONVO_ENGINE_URL = "https://ksp-60079603520.development.catalystserverless.in/server/Conversational_engine/";

// ==========================================================================
// 2. BILINGUAL TRANSLATION DICTIONARY
// ==========================================================================
const TRANSLATIONS = {
    en: {
        appTitle: "SENTINEL",
        appSub: "KSP Crime Records Intelligence",
        roleLabel: "Role:",
        roleInvestigator: "Sub-Inspector",
        roleSupervisor: "Inspector",
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
        hist1Title: "Suspect #89241 Whitefield burglary",
        hist2Title: "Suspect #70412 Cyber skimming Koramangala",
        hist3Title: "Suspect #55190 Highway dacoity Davanagere",
        hist4Title: "Night burglary MO matching flags"
    },
    kn: {
        appTitle: "ಸೆಂಟಿನೆಲ್",
        appSub: "ಕೆಎಸ್‍ಪಿ ಅಪರಾಧ ದಾಖಲೆಗಳ ಬುದ್ಧಿವಂತಿಕೆ",
        roleLabel: "ಪಾತ್ರ:",
        roleInvestigator: "ಉಪನಿರೀಕ್ಷಕರು",
        roleSupervisor: "ನಿರೀಕ್ಷಕರು",
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
        graphNote: "ಕಂಟೇನರ್ <code>#network-graph</code> ಸಿದ್ಧವಾಗಿದೆ.",
        reasoningTitle: "ಕಾರಣ ಮತ್ತು ಮೂಲಗಳನ್ನು ತೋರಿಸಿ",
        reasoningMeta: "4 CCTNS ಕೋಷ್ಟಕಗಳು • SQL ಜಾರಿಯಾಗಿದೆ",
        closeBtn: "ವಿಂಡೋ ಮುಚ್ಚಿ",
        hist1Title: "ಶಂಕಿತ #89241 ವೈಟ್‌ಫೀಲ್ಡ್ ಕಳವು",
        hist2Title: "ಶಂಕಿತ #70412 ಸೈಬರ್ ಸ್ಕಿಮ್ಮಿಂಗ್ ಕೋರಮಂಗಲ",
        hist3Title: "ಶಂಕಿತ #55190 ಹೆದ್ದಾರಿ ದರೋಡೆ ದಾವಣಗೆರೆ",
        hist4Title: "ರಾತ್ರಿ ಕಳವು ಎಂಒ ಪಂದ್ಯದ ಫ್ಲ್ಯಾಗ್‌ಗಳು"
    }
};

const DYNAMIC_I18N_KEYS = [
    'activeQueryText', 'directAnswerText',
    'card1Title', 'card1StatLabel', 'card1SubInfo',
    'card2Title', 'card2StatLabel', 'card2Status1', 'card2Status2',
    'card3Title', 'card3StatLabel', 'card3SubInfo',
    'card4Title', 'card4StatLabel', 'card4SubInfo',
    'card5Title', 'card5StatLabel', 'card5SubInfo'
];

const SUGGESTED_CHIPS = {
    investigator: {
        en: [
            "Show all FIRs for suspect Manjunath",
            "Show cases in Whitefield",
            "Show heinous crimes"
        ],
        kn: [
            "ಶಂಕಿತ ಮಂಜುನಾಥ್ ಅವರ ಎಲ್ಲಾ ಎಫ್‌ಐಆರ್‌ಗಳನ್ನು ತೋರಿಸಿ",
            "ವೈಟ್‌ಫೀಲ್ಡ್‌ನ ಪ್ರಕರಣಗಳನ್ನು ತೋರಿಸಿ",
            "ಘೋರ ಅಪರಾಧಗಳನ್ನು ತೋರಿಸಿ"
        ]
    },
    supervisor: {
        en: [
            "Show all FIRs for suspect Manjunath",
            "Show cases in Whitefield",
            "Show heinous crimes",
            "Show repeat offenders"
        ],
        kn: [
            "ಶಂಕಿತ ಮಂಜುನಾಥ್ ಅವರ ಎಲ್ಲಾ ಎಫ್‌ಐಆರ್‌ಗಳನ್ನು ತೋರಿಸಿ",
            "ವೈಟ್‌ಫೀಲ್ಡ್‌ನ ಪ್ರಕರಣಗಳನ್ನು ತೋರಿಸಿ",
            "ಘೋರ ಅಪರಾಧಗಳನ್ನು ತೋರಿಸಿ",
            "ಮರುಅಪರಾಧಿಗಳನ್ನು ತೋರಿಸಿ"
        ]
    }
};

/** Fixed intent+parameter pairs for suggested chips (no text parsing). */
const SUGGESTED_CHIP_INTENTS = {
    // English
    "Show all FIRs for suspect Manjunath": { intent: "search_accused_by_name", parameters: { name: "Manjunath Kumar" } },
    "Show cases in Whitefield": { intent: "get_cases_by_district", parameters: { district_name: "Bangalore Urban" } },
    "Show repeat offenders": { intent: "get_repeat_offenders", parameters: {} },
    "Show heinous crimes": { intent: "get_cases_by_gravity", parameters: { gravity_level: "Heinous" } },
    // Kannada
    "ಶಂಕಿತ ಮಂಜುನಾಥ್ ಅವರ ಎಲ್ಲಾ ಎಫ್‌ಐಆರ್‌ಗಳನ್ನು ತೋರಿಸಿ": { intent: "search_accused_by_name", parameters: { name: "Manjunath Kumar" } },
    "ವೈಟ್‌ಫೀಲ್ಡ್‌ನ ಪ್ರಕರಣಗಳನ್ನು ತೋರಿಸಿ": { intent: "get_cases_by_district", parameters: { district_name: "Bangalore Urban" } },
    "ಮರುಅಪರಾಧಿಗಳನ್ನು ತೋರಿಸಿ": { intent: "get_repeat_offenders", parameters: {} },
    "ಘೋರ ಅಪರಾಧಗಳನ್ನು ತೋರಿಸಿ": { intent: "get_cases_by_gravity", parameters: { gravity_level: "Heinous" } }
};

const KARNATAKA_DISTRICTS = [
    "Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban",
    "Bidar", "Chamarajanagar", "Chikkaballapur", "Chikkamagaluru", "Chitradurga",
    "Dakshina Kannada", "Davanagere", "Dharwad", "Gadag", "Hassan", "Haveri",
    "Kalaburagi", "Kodagu", "Kolar", "Koppal", "Mandya", "Mysuru", "Raichur",
    "Ramanagara", "Shivamogga", "Tumakuru", "Udupi", "Uttara Kannada",
    "Vijayapura", "Yadgir", "Whitefield", "Koramangala"
];

/** Which preview cards are relevant per intent (others are hidden). */
const INTENT_VISIBLE_CARDS = {
    get_case_by_crimeno: ["linked-cases", "chargesheet", "arrests", "network", "mo-matches"],
    get_cases_by_district: ["linked-cases"],
    get_cases_by_status: ["linked-cases", "chargesheet"],
    get_case_victims: ["linked-cases"],
    get_accused_by_case: ["linked-cases", "chargesheet", "arrests", "network"],
    search_accused_by_name: ["linked-cases", "network", "arrests"],
    get_accused_network: ["network"],
    get_arrests_by_officer: ["arrests"],
    get_cases_by_crimehead: ["linked-cases", "mo-matches"],
    get_cases_by_act_section: ["linked-cases"],
    get_repeat_offenders: ["linked-cases", "arrests", "network"],
    get_cases_by_gravity: ["linked-cases"],
    get_chargesheet_status: ["chargesheet"],
    get_cases_by_court: ["linked-cases", "chargesheet"],
    get_mo_matches: ["mo-matches", "linked-cases"]
};

// Application State Management Variables
let currentLang = 'en';
let currentRole = 'investigator';
let currentState = 1;
let conversationId = "session_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
let turnId = 1;

window.ACTIVE_ENTITY_DATA = null;

// ==========================================================================
// 3. INTENT RESOLUTION & BACKEND CALLS
// ==========================================================================

/**
 * RESOLVE INTENT — PLACEHOLDER MATCHERS FOR DEMO
 *
 * NOTE: This keyword/regex matcher is a temporary client-side placeholder
 * for Person B's real LLM-based intent classifier. It should be replaced
 * with a live NLU/LLM classification API endpoint in production.
 *
 * @param {string} queryText
 * @returns {{ intent: string, parameters: Object } | null}
 */
function resolveIntent(queryText) {
    if (!queryText || !queryText.trim()) return null;

    const text = queryText.trim();

    // 1. Fixed suggested-chip mappings (exact match)
    if (SUGGESTED_CHIP_INTENTS[text]) {
        return SUGGESTED_CHIP_INTENTS[text];
    }

    const lower = text.toLowerCase();

    // 2. Long numeric crime number → get_case_by_crimeno
    const crimeNoMatch = text.match(/\b\d{10,18}\b/);
    if (crimeNoMatch) {
        return { intent: "get_case_by_crimeno", parameters: { crime_no: crimeNoMatch[0] } };
    }

    // 3. Repeat offenders → get_repeat_offenders
    if (/\brepeat\s+offender/i.test(lower) || lower.includes("ಮರುಅಪರಾಧಿ")) {
        return { intent: "get_repeat_offenders", parameters: {} };
    }

    // 4. Network / associates / linked → get_accused_network
    if (/\b(network|associates?|co-conspirator|gang)\b/i.test(lower) || lower.includes("ಸಹಚರ")) {
        const accusedId = text.match(/accused_master_id[=:\s]+(\d+)/i);
        const caseId = text.match(/case_master_id[=:\s]+(\d+)/i);
        return {
            intent: "get_accused_network",
            parameters: accusedId ? { accused_master_id: parseInt(accusedId[1], 10) } : (caseId ? { case_master_id: parseInt(caseId[1], 10) } : { accused_master_id: 1 })
        };
    }

    // 5. MO / pattern / similar / modus operandi → get_mo_matches
    if (/\b(mo|modus operandi|pattern|similar)\b/i.test(lower) || lower.includes("ಎಂಒ")) {
        const moCrimeNo = text.match(/\b\d{10,18}\b/);
        return {
            intent: "get_mo_matches",
            parameters: moCrimeNo ? { crime_no: moCrimeNo[0] } : { crime_no: "10100010001202600001" }
        };
    }

    // 6. Chargesheet → get_chargesheet_status
    if (lower.includes("chargesheet") || lower.includes("charge sheet") || lower.includes("ಚಾರ್ಜ್")) {
        const csCrimeNo = text.match(/\b\d{10,18}\b/);
        return {
            intent: "get_chargesheet_status",
            parameters: csCrimeNo ? { crime_no: csCrimeNo[0] } : { crime_no: "10100010001202600001" }
        };
    }

    // 7. Gravity (Heinous vs Non-Heinous)
    if (lower.includes("heinous") || lower.includes("ಘೋರ")) {
        const level = lower.includes("non-heinous") || lower.includes("non heinous") ? "Non-Heinous" : "Heinous";
        return { intent: "get_cases_by_gravity", parameters: { gravity_level: level } };
    }

    // 8. Status match
    if (lower.includes("under investigation")) {
        return { intent: "get_cases_by_status", parameters: { case_status_name: "Under Investigation" } };
    } else if (lower.includes("under trial")) {
        return { intent: "get_cases_by_status", parameters: { case_status_name: "Under Trial" } };
    } else if (lower.includes("closed")) {
        return { intent: "get_cases_by_status", parameters: { case_status_name: "Closed" } };
    } else if (lower.includes("fr filed")) {
        return { intent: "get_cases_by_status", parameters: { case_status_name: "FR Filed" } };
    }

    // 9. Arrests by Officer
    if (lower.includes("arrest") || lower.includes("officer") || lower.includes("kgid")) {
        return { intent: "get_arrests_by_officer", parameters: { employee_name: "Ravi Kumar" } };
    }

    // 10. Case Victims
    if (lower.includes("victim") || lower.includes("victims")) {
        return { intent: "get_case_victims", parameters: { crime_no: "10100010001202600001" } };
    }

    // 11. Suspect / accused + name → search_accused_by_name
    const accusedMatch = lower.match(/(?:suspect|accused)\s+(?:named\s+)?([a-z][a-z\s]{1,30}?)(?:\s+acc-|\s+\d|$|,|\.)/i)
        || lower.match(/(?:suspect|accused)\s+([a-z]{3,})/i)
        || lower.match(/\b(manjunath|syed|venkatesh|ravi|suresh|prakash)\b/i);
    if (accusedMatch) {
        const rawName = accusedMatch[1] || accusedMatch[0];
        const name = rawName.trim();
        const stopWords = ["all", "firs", "cases", "details", "in", "the", "for", "linked", "to"];
        if (name && !stopWords.includes(name.toLowerCase())) {
            const formattedName = name.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
            return { intent: "search_accused_by_name", parameters: { name: formattedName } };
        }
    }

    // 12. District name → get_cases_by_district
    const foundDistrict = KARNATAKA_DISTRICTS.find(d => lower.includes(d.toLowerCase()));
    if (foundDistrict) {
        return { intent: "get_cases_by_district", parameters: { district_name: foundDistrict } };
    }

    // 13. Court name → get_cases_by_court
    if (lower.includes("court") || lower.includes("sessions") || lower.includes("district court")) {
        return { intent: "get_cases_by_court", parameters: { court_name: "Bangalore Urban Sessions Court" } };
    }

    // 14. Crime Head / Subhead
    if (lower.includes("burglary")) {
        return { intent: "get_cases_by_crimehead", parameters: { crime_subhead: "Burglary" } };
    } else if (lower.includes("robbery")) {
        return { intent: "get_cases_by_crimehead", parameters: { crime_subhead: "Robbery" } };
    } else if (lower.includes("murder")) {
        return { intent: "get_cases_by_crimehead", parameters: { crime_subhead: "Murder" } };
    } else if (lower.includes("theft")) {
        return { intent: "get_cases_by_crimehead", parameters: { crime_subhead: "Theft" } };
    } else if (lower.includes("skimming") || lower.includes("cyber")) {
        return { intent: "get_cases_by_crimehead", parameters: { crime_subhead: "ATM Skimming" } };
    }

    // 15. Act & Section
    const sectionMatch = lower.match(/section\s+(\d+)/i) || lower.match(/\b(302|392|380|420)\b/);
    if (sectionMatch || lower.includes("ipc")) {
        return { intent: "get_cases_by_act_section", parameters: { act_short_name: "IPC", section_code: sectionMatch ? sectionMatch[1] : "302" } };
    }

    return null;
}

// ==========================================================================
// 4. QUERY SUBMISSION & RENDER LOGIC
// ==========================================================================

function setLoadingOverlay(active) {
    const overlay = document.getElementById('query-loading-overlay');
    if (overlay) {
        overlay.classList.toggle('active', active);
        overlay.setAttribute('aria-hidden', active ? 'false' : 'true');
    }

    document.querySelectorAll('.send-btn').forEach(btn => {
        btn.classList.toggle('loading', active);
    });

    if (active) {
        const activeInputBar = document.querySelector('.state-view.active .input-bar');
        if (activeInputBar) {
            activeInputBar.classList.remove('pulsing');
            void activeInputBar.offsetWidth;
            activeInputBar.classList.add('pulsing');
        }
    }

    if (active && window.SentinelAnimations?.startLoadingPulse) {
        window.SentinelAnimations.startLoadingPulse();
    } else if (!active && window.SentinelAnimations?.stopLoadingPulse) {
        window.SentinelAnimations.stopLoadingPulse();
    }
}

async function callBackend(userQuery) {
  try {
    console.log(`[CONVO ENGINE REQUEST] conversation_id: ${conversationId}, turn_id: ${turnId}, query: "${userQuery}"`);
    const response = await fetch(CONVO_ENGINE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: userQuery,
        conversation_id: conversationId,
        turn_id: turnId
      })
    });
    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    turnId += 1;
    console.log(`[CONVO ENGINE RESPONSE] turn_id now ${turnId}:`, data);
    return data;
  } catch (err) {
    console.error("Conversational engine error:", err);
    throw err;
  }
}

function clearChatInputs() {
    const input1 = document.getElementById('chat-input-1');
    const input2 = document.getElementById('chat-input-2');
    if (input1) input1.value = '';
    if (input2) input2.value = '';
}

async function handleQuerySubmit(userQuery) {
    const rawQuery = (userQuery && userQuery.trim()) ? userQuery.trim() : "";
    if (!rawQuery) return;

    setLoadingOverlay(true);

    // Role gating check: restrict pattern analysis intents to Inspector level only
    const currentRoleClean = (window.currentUserRole || "").trim().toLowerCase();
    const isInspector = (currentRoleClean === "inspector" || currentRoleClean === "supervisor");
    const intentObj = resolveIntent(rawQuery);

    if (intentObj && (intentObj.intent === "get_repeat_offenders" || intentObj.intent === "get_accused_network" || intentObj.intent === "get_mo_matches") && !isInspector) {
        renderErrorState("This feature requires Inspector-level access.", rawQuery);
        switchState(2);
        setLoadingOverlay(false);
        clearChatInputs();
        return;
    }

    try {
        const convoData = await callBackend(rawQuery);
        if (convoData && convoData.status && convoData.status !== "success") {
            const errorMsg = (convoData.error && convoData.error.message) || convoData.message || "Backend Query Error";
            renderErrorState(errorMsg, rawQuery);
        } else {
            renderConversationalResponse(convoData, rawQuery, intentObj);
        }
        switchState(2);
    } catch (err) {
        console.error("Conversational Engine Error:", err);
        renderErrorState(err.message || "An unexpected error occurred while querying intelligence backend", rawQuery);
        switchState(2);
    } finally {
        setLoadingOverlay(false);
        clearChatInputs();
        const input2 = document.getElementById('chat-input-2');
        if (input2) input2.focus();
    }
}

function toggleEvidenceDrawer() {
    const details = document.getElementById('reasoning-details');
    if (details) {
        const isOpen = details.hasAttribute('open');
        if (isOpen) {
            details.removeAttribute('open');
        } else {
            details.setAttribute('open', '');
            details.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
}

function renderConversationalResponse(data, queryText, intentObj) {
    const payload = (data && data.extracted_payload) ? data.extracted_payload : (data.output || data);
    const nlgOutput = payload.nlg_output || payload.response || payload.message || (typeof data.nlg_output === "string" ? data.nlg_output : "");
    const evidence = payload.evidence || data.evidence || { source_tables: [], query_summary: "" };
    const results = payload.results || data.results || [];
    const intent = payload.intent || (intentObj ? intentObj.intent : "conversational");
    const isKn = currentLang === 'kn';

    const state2View = document.getElementById('state-2-view');
    const answerCard = document.querySelector('.direct-answer-card');
    const activeQueryEl = document.getElementById('active-query-text');
    const answerHeaderEl = document.querySelector('.direct-answer-card .answer-header');
    const answerBodyEl = document.getElementById('answer-body-text');

    if (activeQueryEl) activeQueryEl.textContent = queryText;

    if (state2View) state2View.classList.remove('no-results-mode');
    if (answerCard) answerCard.classList.remove('no-results', 'role-rejected');

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

    if (answerBodyEl) {
        if (nlgOutput) {
            const formattedNlg = escapeHtml(nlgOutput).replace(/\n/g, '<br>');
            const sourceTables = evidence.source_tables || [];
            let sourceChipsHtml = '';
            if (sourceTables.length > 0) {
                sourceChipsHtml = `
                    <div class="convo-source-chips" style="margin-top: 1rem; display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem;">
                        <span style="font-size: 0.75rem; font-weight: 700; color: var(--khaki); font-family: var(--font-heading); text-transform: uppercase;">Source Tables:</span>
                        ${sourceTables.map(tbl => `<span class="table-chip" style="background: rgba(27, 42, 74, 0.08); color: var(--navy); border: 1px solid var(--navy); padding: 3px 10px; border-radius: 2px; font-size: 0.75rem; font-family: var(--font-mono);">${escapeHtml(tbl)}</span>`).join('')}
                        ${evidence.query_summary ? `<button type="button" class="btn-view-evidence" id="btn-toggle-evidence" style="background: transparent; border: none; color: var(--navy); font-size: 0.78rem; font-weight: 700; font-family: var(--font-heading); text-decoration: underline; cursor: pointer; margin-left: 0.5rem;" onclick="toggleEvidenceDrawer()">View Evidence</button>` : ''}
                    </div>
                `;
            } else if (evidence.query_summary) {
                sourceChipsHtml = `
                    <div class="convo-source-chips" style="margin-top: 1rem;">
                        <button type="button" class="btn-view-evidence" id="btn-toggle-evidence" style="background: transparent; border: none; color: var(--navy); font-size: 0.78rem; font-weight: 700; font-family: var(--font-heading); text-decoration: underline; cursor: pointer;" onclick="toggleEvidenceDrawer()">View Evidence</button>
                    </div>
                `;
            }
            answerBodyEl.innerHTML = `<div>${formattedNlg}</div>${sourceChipsHtml}`;
        } else {
            answerBodyEl.innerHTML = buildDirectAnswerSentence({ results, result_count: results.length }, intent, isKn);
        }
    }

    renderReasoningEvidence(evidence);

    const activeIntent = intent || (intentObj ? intentObj.intent : "get_cases_by_district");
    const cardsData = buildCardsDataFromResults({ results, result_count: results.length }, activeIntent, isKn);
    window.ACTIVE_ENTITY_DATA = { cardsDetail: cardsData };
    updatePreviewCardsUI(cardsData, activeIntent, isKn);
}

/**
 * Renders State 2 with data returned from the live backend.
 */
function renderState2WithBackendResponse(response, queryText, intentObj) {
    const state2View = document.getElementById('state-2-view');
    const answerCard = document.querySelector('.direct-answer-card');
    const activeQueryEl = document.getElementById('active-query-text');
    const answerHeaderEl = document.querySelector('.direct-answer-card .answer-header');
    const answerBodyEl = document.getElementById('answer-body-text');
    const isKn = currentLang === 'kn';

    if (activeQueryEl) activeQueryEl.textContent = queryText;

    const results = response.results || [];
    const resultCount = typeof response.result_count === "number" ? response.result_count : results.length;
    const evidence = response.evidence || { source_tables: [], query_summary: "" };

    if (resultCount === 0 || results.length === 0) {
        window.ACTIVE_ENTITY_DATA = null;
        window.LAST_QUERY_NO_RESULTS = queryText;

        if (state2View) state2View.classList.add('no-results-mode');
        if (answerCard) answerCard.classList.add('no-results');

        if (answerHeaderEl) {
            answerHeaderEl.innerHTML = `
                <div class="ai-badge">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <span>${isKn ? "ಯಾವುದೇ ಪಂದ್ಯ ಸಿಗಲಿಲ್ಲ" : "No Results Found"}</span>
                </div>
                <span class="confidence-badge">${isKn ? "0 ಫಲಿತಾಂಶಗಳು" : "0 Matches"}</span>
            `;
        }

        if (answerBodyEl) {
            const escapedQuery = escapeHtml(queryText);
            answerBodyEl.innerHTML = isKn
                ? `<strong>"${escapedQuery}"</strong> ಗಾಗಿ ಯಾವುದೇ ಹೊಂದಾಣಿಕೆಯ ದಾಖಲೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ.`
                : `No matching records found for <strong>"${escapedQuery}"</strong>. Please verify the suspect name, FIR number, or district and try again.`;
        }

        renderReasoningEvidence(evidence);
        hideAllPreviewCards();
        return;
    }

    window.LAST_QUERY_NO_RESULTS = null;
    if (state2View) state2View.classList.remove('no-results-mode');
    if (answerCard) answerCard.classList.remove('no-results');

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

    if (answerBodyEl) {
        answerBodyEl.innerHTML = buildDirectAnswerSentence(response, intentObj.intent, isKn);
    }

    renderReasoningEvidence(evidence);

    const cardsData = buildCardsDataFromResults(response, intentObj.intent, isKn);
    window.ACTIVE_ENTITY_DATA = { cardsDetail: cardsData };
    updatePreviewCardsUI(cardsData, intentObj.intent, isKn);
}

function buildDirectAnswerSentence(response, intent, isKn) {
    const results = response.results || [];
    const count = typeof response.result_count === "number" ? response.result_count : results.length;
    const first = results[0] || {};

    if (intent === "get_case_by_crimeno") {
        const cno = first.crime_no || first.case_no || "—";
        const dist = first.district_name || "—";
        const unit = first.unit_name || first.ps_name || "—";
        const status = first.case_status || first.case_status_name || "—";
        const head = first.crime_head || first.crime_subhead || "—";
        return isKn
            ? `ಎಫ್‌ಐಆರ್ <strong>${escapeHtml(cno)}</strong>: <strong>${escapeHtml(dist)}</strong> (${escapeHtml(unit)}) — <strong>${escapeHtml(head)}</strong>. ಸ್ಥಿತಿ: <strong>${escapeHtml(status)}</strong>.`
            : `Case <strong>${escapeHtml(cno)}</strong> registered at <strong>${escapeHtml(unit)}</strong>, <strong>${escapeHtml(dist)}</strong> under <strong>${escapeHtml(head)}</strong>. Current status: <strong>${escapeHtml(status)}</strong>.`;
    }

    if (intent === "search_accused_by_name" || intent === "get_accused_by_case") {
        const name = first.accused_name || first.name || "—";
        const dist = first.district_name || "—";
        const cno = first.crime_no || "—";
        return isKn
            ? `ಶಂಕಿತ <strong>${escapeHtml(name)}</strong> — <strong>${count}</strong> ದಾಖಲೆ(ಗಳು), ${escapeHtml(dist)} ಜಿಲ್ಲೆ, ಎಫ್‌ಐಆರ್ <strong>${escapeHtml(cno)}</strong>.`
            : `Found <strong>${count}</strong> record(s) for suspect <strong>${escapeHtml(name)}</strong> in <strong>${escapeHtml(dist)}</strong>, linked to FIR <strong>${escapeHtml(cno)}</strong>.`;
    }

    if (intent === "get_cases_by_district") {
        const distName = first.district_name || "the specified district";
        return isKn
            ? `<strong>${escapeHtml(distName)}</strong> ಜಿಲ್ಲೆಯಲ್ಲಿ <strong>${count}</strong> ಪ್ರಕರಣ ದಾಖಲೆ(ಗಳು) ದೊರೆತಿವೆ.`
            : `Retrieved <strong>${count}</strong> case record(s) registered in <strong>${escapeHtml(distName)}</strong> district.`;
    }

    if (intent === "get_chargesheet_status") {
        const cno = first.crime_no || "—";
        const cstype = first.cstype || first.chargesheet_status || "—";
        const csdate = first.csdate || first.chargesheet_date || "";
        return isKn
            ? `ಎಫ್‌ಐಆರ್ <strong>${escapeHtml(cno)}</strong> ಚಾರ್ಜ್‌ಶೀಟ್: <strong>${escapeHtml(cstype)}</strong>${csdate ? ` (${escapeHtml(csdate)})` : ""}.`
            : `Chargesheet for FIR <strong>${escapeHtml(cno)}</strong>: status <strong>${escapeHtml(cstype)}</strong>${csdate ? `, filed ${escapeHtml(csdate)}` : ""}. Total records: <strong>${count}</strong>.`;
    }

    if (intent === "get_accused_network") {
        const name = first.accused_name || first.associate_name || "—";
        const link = first.link_type || first.relationship || "associate";
        return isKn
            ? `<strong>${count}</strong> ನೆಟ್‌ವರ್ಕ್ ಸಂಪರ್ಕ(ಗಳು). ಪ್ರಮುಖ: <strong>${escapeHtml(name)}</strong> (${escapeHtml(link)}).`
            : `Found <strong>${count}</strong> network associate(s). Primary match: <strong>${escapeHtml(name)}</strong> (${escapeHtml(link)}).`;
    }

    if (intent === "get_mo_matches") {
        const subhead = first.crime_subhead || first.mo_pattern || "—";
        const dist = first.district_name || "—";
        return isKn
            ? `<strong>${count}</strong> ಎಂಒ ಪಂದ್ಯದ ಪ್ರಕರಣ(ಗಳು) — <strong>${escapeHtml(subhead)}</strong>, ${escapeHtml(dist)}.`
            : `Identified <strong>${count}</strong> Modus Operandi match(es) for <strong>${escapeHtml(subhead)}</strong> in <strong>${escapeHtml(dist)}</strong>.`;
    }

    if (intent === "get_arrests_by_officer") {
        const officer = first.employee_name || first.officer_name || "—";
        return isKn
            ? `<strong>${count}</strong> ಬಂಧನ ದಾಖಲೆ(ಗಳು) ಅಧಿಕಾರಿ <strong>${escapeHtml(officer)}</strong> ಗೆ ಸಂಬಂಧಿಸಿದಂತೆ.`
            : `Retrieved <strong>${count}</strong> arrest record(s) linked to officer <strong>${escapeHtml(officer)}</strong>.`;
    }

    if (intent === "get_cases_by_status") {
        const status = first.case_status || first.case_status_name || "—";
        return isKn
            ? `<strong>${count}</strong> ಪ್ರಕರಣ(ಗಳು) "<strong>${escapeHtml(status)}</strong>" ಸ್ಥಿತಿಯಲ್ಲಿ.`
            : `Found <strong>${count}</strong> case(s) with status <strong>${escapeHtml(status)}</strong>.`;
    }

    if (intent === "get_cases_by_gravity") {
        const gravity = first.gravity_level || "—";
        return isKn
            ? `<strong>${count}</strong> <strong>${escapeHtml(gravity)}</strong> ಪ್ರಕರಣ(ಗಳು) ದೊರೆತಿವೆ.`
            : `Retrieved <strong>${count}</strong> <strong>${escapeHtml(gravity)}</strong> case(s).`;
    }

    const anchor = first.crime_no || first.accused_name || first.district_name || first.court_name || "—";
    return isKn
        ? `<strong>${count}</strong> ದಾಖಲೆ(ಗಳು) ದೊರೆತಿವೆ (ಪ್ರಮುಖ: <strong>${escapeHtml(anchor)}</strong>).`
        : `Retrieved <strong>${count}</strong> record(s) from crime intelligence backend (primary: <strong>${escapeHtml(anchor)}</strong>).`;
}

function hideAllPreviewCards() {
    document.querySelectorAll('.preview-card').forEach(card => {
        card.style.display = 'none';
    });
}

function updatePreviewCardsUI(cardsData, intent, isKn) {
    const visibleKeys = INTENT_VISIBLE_CARDS[intent] || ["linked-cases"];
    const cardMeta = getCardMetaForIntent(intent, isKn);

    ["linked-cases", "chargesheet", "arrests", "network", "mo-matches"].forEach(key => {
        const cardEl = document.querySelector(`.preview-card[data-card="${key}"]`);
        const cardData = cardsData ? cardsData[key] : null;
        if (!cardEl) return;

        const isVisible = visibleKeys.includes(key) && cardData && (cardData.rows || []).length > 0;
        cardEl.style.display = isVisible ? '' : 'none';
        if (!isVisible) return;

        const meta = cardMeta[key] || {};
        const titleEl = cardEl.querySelector('.card-title');
        if (titleEl) titleEl.textContent = isKn ? (cardData.titleKn || meta.titleKn) : (cardData.titleEn || meta.titleEn);

        const statLabelEl = cardEl.querySelector('.stat-label');
        if (statLabelEl && meta.statLabel) {
            statLabelEl.textContent = isKn ? meta.statLabelKn : meta.statLabel;
        }

        const rows = cardData.rows || [];
        const statNumEl = cardEl.querySelector('.stat-number');
        if (statNumEl) {
            if (key === "chargesheet") {
                const filedCount = rows.filter(r => {
                    const status = String(r[3] || "").toLowerCase();
                    return status.includes("filed") || status.includes("sheet") || String(r[0] || "").startsWith("CS");
                }).length;
                statNumEl.innerHTML = `${filedCount} <small>/ ${rows.length}</small>`;
            } else {
                statNumEl.textContent = rows.length;
            }
        }

        const subInfoEl = cardEl.querySelector('.card-sub-info');
        if (subInfoEl) {
            const subText = buildCardSubInfo(key, rows, intent, isKn);
            subInfoEl.innerHTML = subText;
        }
    });

    animateStatNumbers();
}

function getCardMetaForIntent(intent, isKn) {
    const defaults = {
        "linked-cases": { titleEn: "Linked Cases", titleKn: "ಸಂಪರ್ಕಿತ ಪ್ರಕರಣಗಳು", statLabel: "Total Cases", statLabelKn: "ಒಟ್ಟು ಪ್ರಕರಣಗಳು" },
        "chargesheet": { titleEn: "Chargesheet Status", titleKn: "ಚಾರ್ಜ್‌ಶೀಟ್ ಸ್ಥಿತಿ", statLabel: "Filed", statLabelKn: "ಸಲ್ಲಿಸಲಾಗಿದೆ" },
        "arrests": { titleEn: "Arrest History", titleKn: "ಬಂಧನ ಇತಿಹಾಸ", statLabel: "Arrest Records", statLabelKn: "ಬಂಧನ ದಾಖಲೆಗಳು" },
        "network": { titleEn: "Network View", titleKn: "ನೆಟ್‌ವರ್ಕ್ ನೋಟ", statLabel: "Associates", statLabelKn: "ಸಹಚರರು" },
        "mo-matches": { titleEn: "MO Match Flags", titleKn: "ಎಂ.ಒ. ಪಂದ್ಯದ ಫ್ಲ್ಯಾಗ್‌ಗಳು", statLabel: "Matched Cases", statLabelKn: "ಪಂದ್ಯದ ಪ್ರಕರಣಗಳು" }
    };

    if (intent === "get_cases_by_district") {
        defaults["linked-cases"].statLabel = "District FIRs";
        defaults["linked-cases"].statLabelKn = "ಜಿಲ್ಲಾ ಎಫ್‌ಐಆರ್‌ಗಳು";
    }
    if (intent === "get_arrests_by_officer") {
        defaults["arrests"].statLabel = "Arrests by Officer";
        defaults["arrests"].statLabelKn = "ಅಧಿಕಾರಿಯ ಬಂಧನಗಳು";
    }

    return defaults;
}

function buildCardSubInfo(cardKey, rows, intent, isKn) {
    if (cardKey === "linked-cases") {
        const districts = [...new Set(rows.map(r => (r[1] || "").split("(")[0].trim()).filter(Boolean))];
        const label = districts.length
            ? (isKn ? `${districts.length} ಜಿಲ್ಲೆ(ಗಳು)` : `${districts.length} District(s): ${districts.slice(0, 2).join(", ")}`)
            : (isKn ? `${rows.length} ದಾಖಲೆಗಳು` : `${rows.length} Active Records`);
        return `<span class="sub-badge">${escapeHtml(label)}</span>`;
    }
    if (cardKey === "chargesheet") {
        const pending = rows.filter(r => String(r[3] || "").toLowerCase().includes("pending")).length;
        const filed = rows.length - pending;
        return `<span class="sub-pill success">${filed} ${isKn ? "ಸಲ್ಲಿಸಲಾಗಿದೆ" : "Filed"}</span>` +
            (pending ? `<span class="sub-pill warning">${pending} ${isKn ? "ಬಾಕಿ" : "Pending"}</span>` : "");
    }
    if (cardKey === "arrests") {
        const latest = rows[0] ? rows[0][1] : "";
        return latest
            ? `<span class="sub-badge text-amber">${isKn ? "ಇತ್ತೀಚಿನ:" : "Latest:"} ${escapeHtml(latest)}</span>`
            : `<span class="sub-badge">${rows.length} ${isKn ? "ದಾಖಲೆಗಳು" : "Records"}</span>`;
    }
    if (cardKey === "network") {
        return `<span class="sub-badge">${isKn ? "ಸಹಚರ ನೆಟ್‌ವರ್ಕ್" : "Associate Network"} • ${rows.length}</span>`;
    }
    if (cardKey === "mo-matches") {
        return `<span class="sub-badge text-danger">${rows.length} ${isKn ? "ಎಂಒ ಪಂದ್ಯಗಳು" : "MO Matches"}</span>`;
    }
    return `<span class="sub-badge">${rows.length} ${isKn ? "ದಾಖಲೆಗಳು" : "Records"}</span>`;
}

function buildCardsDataFromResults(response, intent, isKn) {
    const results = response.results || [];

    const caseRows = results
        .filter(r => r.crime_no || r.case_no || r.case_master_id || r.district_name)
        .map(r => [
            r.crime_no || r.case_no || `ID-${r.case_master_id}`,
            `${r.district_name || "—"} (${r.unit_name || r.ps_name || "PS"})`,
            r.crime_head || r.crime_subhead || r.act_short_name || "—",
            r.case_status || r.case_status_name || "—"
        ]);

    const accusedRows = results
        .filter(r => r.accused_name || r.name || r.accused_master_id)
        .map(r => [
            r.accused_name || r.name || `ACC-${r.accused_master_id}`,
            r.accused_person_id || r.link_type || r.alias || "Accused",
            r.crime_no || r.case_no || "—",
            r.district_name || r.case_status || "—"
        ]);

    const arrestRows = results
        .filter(r => r.arrest_id || r.arrest_date || r.employee_name)
        .map(r => [
            r.arrest_id || `ARR-${r.arrest_master_id || "—"}`,
            r.arrest_date || r.date_of_arrest || "—",
            r.unit_name || r.district_name || r.employee_name || "—",
            r.bail_status || r.status || "—"
        ]);

    const csRows = results
        .filter(r => r.csid || r.cstype || r.csdate || r.chargesheet_status)
        .map(r => [
            r.csid ? `CS-${r.csid}` : (r.chargesheet_no || "CS-Record"),
            r.crime_no || "—",
            r.csdate || r.chargesheet_date || "—",
            r.cstype || r.chargesheet_status || "—"
        ]);

    const networkRows = results
        .filter(r => r.accused_name || r.associate_name || r.link_type)
        .map(r => [
            r.accused_name || r.associate_name || `ACC-${r.accused_master_id || "—"}`,
            r.link_type || r.relationship || r.alias || "Associate",
            r.crime_no || r.shared_case || "—",
            r.district_name || r.status || "—"
        ]);

    const moRows = results
        .filter(r => r.crime_no || r.crime_subhead || r.mo_pattern)
        .map(r => [
            r.crime_no || r.case_no || "—",
            `${r.district_name || "—"} (${r.unit_name || "PS"})`,
            r.crime_subhead || r.mo_pattern || "—",
            r.match_score ? `${r.match_score}%` : (r.case_status || "—")
        ]);

    const cards = {};

    if (caseRows.length) {
        cards["linked-cases"] = {
            icon: "📄",
            titleEn: "Linked Cases", titleKn: "ಸಂಪರ್ಕಿತ ಪ್ರಕರಣಗಳು",
            headersEn: ["FIR / Case No.", "Station / District", "Offence", "Status"],
            headersKn: ["ಎಫ್‌ಐಆರ್ ಸಂಖ್ಯೆ", "ಠಾಣೆ / ಜಿಲ್ಲೆ", "ಅಪರಾಧ", "ಸ್ಥಿತಿ"],
            rows: caseRows
        };
    }

    if (csRows.length) {
        cards["chargesheet"] = {
            icon: "⚖️",
            titleEn: "Chargesheet Status", titleKn: "ಚಾರ್ಜ್‌ಶೀಟ್ ಸ್ಥಿತಿ",
            headersEn: ["CS Record No.", "Related FIR", "File Date", "Status"],
            headersKn: ["ಚಾರ್ಜ್‌ಶೀಟ್ ಸಂಖ್ಯೆ", "ಸಂಬಂಧಿತ ಎಫ್‌ಐಆರ್", "ದಿನಾಂಕ", "ಸ್ಥಿತಿ"],
            rows: csRows
        };
    }

    if (arrestRows.length) {
        cards["arrests"] = {
            icon: "⛓️",
            titleEn: "Arrest History", titleKn: "ಬಂಧನ ಇತಿಹಾಸ",
            headersEn: ["Arrest ID", "Date", "Station / Officer", "Status"],
            headersKn: ["ಬಂಧನ ಐಡಿ", "ದಿನಾಂಕ", "ಠಾಣೆ", "ಸ್ಥಿತಿ"],
            rows: arrestRows
        };
    } else if (accusedRows.length && ["search_accused_by_name", "get_accused_by_case"].includes(intent)) {
        cards["arrests"] = {
            icon: "⛓️",
            titleEn: "Accused Records", titleKn: "ಶಂಕಿತ ದಾಖಲೆಗಳು",
            headersEn: ["Accused Name", "Role", "Linked FIR", "District / Status"],
            headersKn: ["ಶಂಕಿತ ಹೆಸರು", "ಪಾತ್ರ", "ಎಫ್‌ಐಆರ್", "ಸ್ಥಿತಿ"],
            rows: accusedRows
        };
    }

    if (networkRows.length) {
        cards["network"] = {
            icon: "🕸️",
            titleEn: "Network View", titleKn: "ನೆಟ್‌ವರ್ಕ್ ನೋಟ",
            headersEn: ["Associate Name", "Relationship", "Shared Case", "District / Status"],
            headersKn: ["ಸಹಚರ ಹೆಸರು", "ಸಂಬಂಧ", "ಪ್ರಕರಣ", "ಸ್ಥಿತಿ"],
            rows: networkRows
        };
    }

    if (moRows.length) {
        cards["mo-matches"] = {
            icon: "🚨",
            titleEn: "MO Match Flags", titleKn: "ಎಂ.ಒ. ಪಂದ್ಯದ ಫ್ಲ್ಯಾಗ್‌ಗಳು",
            headersEn: ["Case FIR", "District / Station", "MO Pattern", "Match"],
            headersKn: ["ಎಫ್‌ಐಆರ್", "ಜಿಲ್ಲೆ", "ಎಂಒ ಮಾದರಿ", "ಪಂದ್ಯ"],
            rows: moRows
        };
    }

    return cards;
}

function renderReasoningEvidence(evidence) {
    const accordion = document.getElementById('reasoning-details');
    if (!accordion) return;

    const sourceTables = (evidence && evidence.source_tables) ? evidence.source_tables : [];
    const querySummary = (evidence && evidence.query_summary) ? evidence.query_summary : "";

    const chipsContainer = accordion.querySelector('.tables-chips-list');
    if (chipsContainer) {
        chipsContainer.innerHTML = sourceTables.length
            ? sourceTables.map(tbl => `<span class="table-chip">${escapeHtml(tbl)}</span>`).join(' ')
            : `<span class="table-chip">${escapeHtml("No source tables returned")}</span>`;
    }

    const codeBlock = accordion.querySelector('.query-code-block pre code');
    if (codeBlock) {
        codeBlock.textContent = querySummary || "No query summary returned by backend.";
    }

    const summaryBadge = accordion.querySelector('.summary-badge');
    if (summaryBadge) {
        const isKn = currentLang === 'kn';
        const count = sourceTables.length;
        summaryBadge.textContent = isKn
            ? `${count} CCTNS ಕೋಷ್ಟಕಗಳು • ZCQL ಜಾರಿಯಾಗಿದೆ`
            : `${count} CCTNS Tables • ZCQL Executed`;
    }
}

function renderErrorState(errorMessage, queryText) {
    const state2View = document.getElementById('state-2-view');
    const answerCard = document.querySelector('.direct-answer-card');
    const activeQueryEl = document.getElementById('active-query-text');
    const answerHeaderEl = document.querySelector('.direct-answer-card .answer-header');
    const answerBodyEl = document.getElementById('answer-body-text');
    const isKn = currentLang === 'kn';

    window.ACTIVE_ENTITY_DATA = null;
    window.LAST_QUERY_NO_RESULTS = queryText;

    if (state2View) state2View.classList.add('no-results-mode');

    const isRoleError = errorMessage.includes("Inspector-level access") || errorMessage.includes("Supervisor access");
    if (answerCard) {
        answerCard.classList.add('no-results');
        answerCard.classList.remove('role-rejected');
        if (isRoleError) {
            void answerCard.offsetWidth; // trigger reflow
            answerCard.classList.add('role-rejected');

            // Flash header role badge to visually connect the rejection to user's assigned role
            const badgeText = document.getElementById('role-badge-text');
            if (badgeText) {
                badgeText.classList.remove('badge-flash');
                void badgeText.offsetWidth;
                badgeText.classList.add('badge-flash');
            }
        }
    }
    hideAllPreviewCards();

    if (activeQueryEl) activeQueryEl.textContent = queryText;

    const isIntentError = errorMessage.includes("Could not determine query type");
    if (answerHeaderEl) {
        answerHeaderEl.innerHTML = `
            <div class="ai-badge" style="color:var(--accent-red,#8a2e2e);">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>${isRoleError ? (isKn ? "ಅನುಮತಿ ನಿರಾಕರಿಸಲಾಗಿದೆ" : "Access Restricted") : (isIntentError ? (isKn ? "ಪ್ರಶ್ನೆ ಗುರುತಿಸಲಾಗಲಿಲ್ಲ" : "Query Not Recognized") : (isKn ? "ದೋಷ ಉಂಟಾಗಿದೆ" : "Backend Query Error"))}</span>
            </div>
            <span class="confidence-badge" style="border-color:rgba(138,46,46,0.4); color:var(--alert,#8a2e2e);">${isRoleError ? (isKn ? "ಪಾತ್ರದ ದೋಷ" : "Role Gated") : (isKn ? "ದೋಷ" : "Error")}</span>
        `;
    }

    if (answerBodyEl) {
        const escapedMsg = escapeHtml(errorMessage);
        answerBodyEl.innerHTML = isKn
            ? `<strong>${escapedMsg}</strong>`
            : `<strong>${escapedMsg}</strong>`;
    }
}

// ==========================================================================
// 5. ROLE & LANGUAGE ACCESS CONTROLS
// ==========================================================================

function applyRoleToUI(role) {
    console.log("applyRoleToUI called with:", role);
    const rawTarget = role || window.currentUserRole;
    if (!rawTarget) return;

    const cleanRole = String(rawTarget).trim().toLowerCase();
    const isInspector = (cleanRole === "inspector" || cleanRole === "supervisor");
    const mappedRole = isInspector ? "Inspector" : "Sub-Inspector";
    window.currentUserRole = mappedRole;

    // Update body class dynamically
    if (document.body) {
        document.body.classList.remove('role-investigator', 'role-supervisor', 'role-admin', 'role-sub-inspector', 'role-inspector');
        document.body.classList.add(isInspector ? 'role-inspector' : 'role-sub-inspector');
    }

    // Update role badge UI with distinct icon and text (cross-fade transition)
    const badgeText = document.getElementById('role-badge-text');
    if (badgeText) {
        badgeText.classList.add('fading-out');
        setTimeout(() => {
            const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
            if (isInspector) {
                badgeText.className = 'role-badge inspector-badge fading-in';
                badgeText.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <span data-i18n="roleSupervisor">${t.roleSupervisor || "Inspector"}</span>
                `;
            } else {
                badgeText.className = 'role-badge sub-inspector-badge fading-in';
                badgeText.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                    </svg>
                    <span data-i18n="roleInvestigator">${t.roleInvestigator || "Sub-Inspector"}</span>
                `;
            }
            setTimeout(() => badgeText.classList.remove('fading-in', 'fading-out'), 150);
        }, 75);
    }

    const roleToggleBtn = document.getElementById('role-toggle-btn');
    if (roleToggleBtn) {
        roleToggleBtn.style.cursor = 'default';
        roleToggleBtn.style.pointerEvents = 'none';
        roleToggleBtn.setAttribute('title', `Assigned Role: ${mappedRole}`);
    }

    // Gate Export as PDF button to Inspector only
    const exportBtn = document.getElementById('btn-export-pdf');
    if (exportBtn) {
        exportBtn.style.display = isInspector ? '' : 'none';
    }

    renderSuggestedChips();
}

function toggleLanguage() {
    currentLang = (currentLang === 'en') ? 'kn' : 'en';
    document.body.classList.remove('lang-en', 'lang-kn');
    document.body.classList.add(`lang-${currentLang}`);

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
}

function updateTranslations() {
    const t = TRANSLATIONS[currentLang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (DYNAMIC_I18N_KEYS.includes(key)) return;
        if (t[key]) el.innerHTML = t[key];
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (t[key]) el.setAttribute('placeholder', t[key]);
    });
}

function renderSuggestedChips() {
    const container = document.getElementById('suggested-chips');
    if (!container) return;

    const currentRoleClean = (window.currentUserRole || "").trim().toLowerCase();
    const isInspector = (currentRoleClean === "inspector" || currentRoleClean === "supervisor");
    const roleKey = isInspector ? 'supervisor' : 'investigator';
    const chipList = SUGGESTED_CHIPS[roleKey][currentLang] || [];

    // Filter out chips tied to restricted pattern analysis intents if not Inspector
    const filteredChips = chipList.filter(text => {
        const intentConfig = SUGGESTED_CHIP_INTENTS[text];
        if (!intentConfig) return true;
        if (!isInspector && (intentConfig.intent === "get_repeat_offenders" || intentConfig.intent === "get_accused_network" || intentConfig.intent === "get_mo_matches")) {
            return false;
        }
        return true;
    });

    container.innerHTML = '';

    filteredChips.forEach(text => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'suggested-chip';
        chip.innerHTML = `<span>⚡</span> ${text}`;
        chip.addEventListener('click', () => {
            chip.classList.add('pressed');
            setTimeout(() => {
                chip.classList.remove('pressed');
                handleQuerySubmit(text);
            }, 80);
        });
        container.appendChild(chip);
    });
}

// ==========================================================================
// 6. PREVIEW CARD MODAL DETAIL WINDOW & UI NAVIGATION
// ==========================================================================

function openDetailModal(cardKey) {
    const currentData = window.ACTIVE_ENTITY_DATA;
    const data = (currentData && currentData.cardsDetail) ? currentData.cardsDetail[cardKey] : null;
    if (!data || !data.rows || !data.rows.length) return;

    const modal = document.getElementById('detail-modal');
    const titleEl = document.getElementById('modal-title');
    const iconEl = document.getElementById('modal-icon');
    const bodyEl = document.getElementById('modal-body');

    const isKn = currentLang === 'kn';
    iconEl.textContent = data.icon || "📄";
    titleEl.textContent = isKn ? (data.titleKn || data.titleEn) : data.titleEn;

    const headers = isKn ? (data.headersKn || data.headersEn) : data.headersEn;

    bodyEl.innerHTML = `
        <table class="modal-table">
            <thead>
                <tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr>
            </thead>
            <tbody>
                ${data.rows.map(row => `
                    <tr>${row.map((cell, idx) => `
                        <td ${idx === 0 ? 'style="font-weight:600; color:var(--text-main);"' : ''}>${escapeHtml(cell)}</td>
                    `).join('')}</tr>
                `).join('')}
            </tbody>
        </table>
    `;

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
        if (window.SentinelAnimations?.animatePageEntrance) {
            window.SentinelAnimations.animatePageEntrance();
        }
    } else {
        view1?.classList.remove('active');
        view2?.classList.add('active');
        view2?.classList.remove('animate-in');
        void view2?.offsetWidth;
        view2?.classList.add('animate-in');
        btn1?.classList.remove('active');
        btn2?.classList.add('active');
        if (window.SentinelAnimations?.animateState2Entrance) {
            window.SentinelAnimations.animateState2Entrance();
        }
    }

    if (mainContent) mainContent.scrollTop = 0;
    window.scrollTo(0, 0);
}

function showState(stateNum) {
    switchState(stateNum);
}

function animateStatNumbers() {
    if (window.SentinelAnimations && typeof window.SentinelAnimations.animateStatNumbers === 'function') {
        window.SentinelAnimations.animateStatNumbers();
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ==========================================================================
// 7. INITIALIZATION ON DOM CONTENT LOADED
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    if (window.currentUserRole) {
        applyRoleToUI(window.currentUserRole);
    } else {
        renderSuggestedChips();
    }
    updateTranslations();
});

function initEventListeners() {
    document.getElementById('lang-toggle-btn')?.addEventListener('click', toggleLanguage);

    document.getElementById('btn-state-1')?.addEventListener('click', () => switchState(1));
    document.getElementById('btn-state-2')?.addEventListener('click', () => switchState(2));
    document.getElementById('btn-new-chat')?.addEventListener('click', () => {
        conversationId = "session_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
        turnId = 1;
        console.log(`[NEW INVESTIGATION] Reset session -> conversation_id: ${conversationId}, turn_id: ${turnId}`);
        switchState(1);
        const firstHistory = document.querySelector('.history-item');
        if (firstHistory) {
            firstHistory.classList.remove('slide-down');
            void firstHistory.offsetWidth;
            firstHistory.classList.add('slide-down');
        }
    });

    const historyItems = document.querySelectorAll('.history-item, .recent-list__item');
    historyItems.forEach((item) => {
        item.addEventListener('click', () => {
            historyItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            const titleEl = item.querySelector('.history-title') || item;
            const queryText = titleEl.textContent.replace(/\s+/g, ' ').trim();
            handleQuerySubmit(queryText);
        });
    });

    document.getElementById('chat-form-state1')?.addEventListener('submit', (e) => {
        e.preventDefault();
        handleQuerySubmit(document.getElementById('chat-input-1').value.trim());
    });

    document.getElementById('chat-form-state2')?.addEventListener('submit', (e) => {
        e.preventDefault();
        handleQuerySubmit(document.getElementById('chat-input-2').value.trim());
    });

    document.querySelectorAll('.preview-card').forEach(card => {
        card.addEventListener('click', () => openDetailModal(card.dataset.card));
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openDetailModal(card.dataset.card);
            }
        });
    });

    document.getElementById('modal-close-btn')?.addEventListener('click', closeModal);
    document.getElementById('modal-ok-btn')?.addEventListener('click', closeModal);
    document.getElementById('detail-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'detail-modal') closeModal();
    });

    document.getElementById('btn-export-pdf')?.addEventListener('click', () => window.print());
}
