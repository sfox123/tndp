/**
 * The framework and the contingency matrix, transcribed from the two
 * discussion mock-ups (TNSDMA and IWMI). Edit the wording here; the pages
 * render whatever this file says.
 *
 * `pending` marks a value the mock-ups leave open for the partners to set.
 */
import type { Stage } from "./triggers";

export const STAGES: {
  id: Stage;
  name: string;
  phase: string;
  scene: string;
}[] = [
  {
    id: 0,
    name: "Normal",
    phase: "Preparedness",
    scene:
      "Tanks are full and the supply channels run. This is the time to plan, stock seed and maintain water bodies.",
  },
  {
    id: 1,
    name: "Watch",
    phase: "Delayed onset",
    scene: "The rains are late or forecast short. Tanks start to draw down, and sowing decisions change.",
  },
  {
    id: 2,
    name: "Alert",
    phase: "Early to mid-season",
    scene: "A dry spell sets in while crops stand in the field. Water is rationed to save what has been sown.",
  },
  {
    id: 3,
    name: "Severe",
    phase: "Terminal drought",
    scene: "The deficit lasts through flowering and grain filling. Tank beds crack; people and livestock come first.",
  },
];

export type MatrixRow = {
  id: string;
  label: string;
  who: string;
  /** One entry per stage. A string is a sentence; a list is a set of actions. */
  cells: [Cell, Cell, Cell, Cell];
};

export type Cell = { text?: string; actions?: string[]; pending?: string };

export const MATRIX: MatrixRow[] = [
  {
    id: "trigger",
    label: "Trigger",
    who: "TN-DEWS indicators",
    cells: [
      { text: "No trigger active; seasonal outlook near normal." },
      {
        text: "Monsoon onset delayed or a rainfall deficit forecast.",
        pending: "SPI and forecast threshold to be set",
      },
      {
        text: "Dry spell with soil-moisture deficit during the crop season.",
        pending: "Soil-moisture threshold to be set",
      },
      { text: "Sustained deficit through flowering and grain filling.", pending: "Threshold and duration to be set" },
    ],
  },
  {
    id: "block",
    label: "Block level",
    who: "Block and district officials, dynamic contingency plan",
    cells: [
      {
        actions: [
          "Update the contingency plan",
          "Stock seed of contingency varieties",
          "Map water sources; train field staff",
        ],
      },
      {
        actions: [
          "Issue the block drought bulletin",
          "Position short-duration seed",
          "Ready a shelf of MGNREGA water works",
        ],
      },
      { actions: ["Activate crop contingency measures", "Regulate tank and canal releases", "Open fodder depots"] },
      {
        actions: [
          "Drinking water supply and cattle camps",
          "Wage employment for affected households",
          "Start crop-loss assessment and insurance claims",
        ],
      },
    ],
  },
  {
    id: "village",
    label: "Village level",
    who: "VDRC with the Gram Panchayat, village drought management plan",
    cells: [
      {
        actions: [
          "Village water budget with the drought-proofing tool",
          "Maintain tanks and ponds from the corpus fund",
          "Update the vulnerable household list",
        ],
      },
      {
        actions: [
          "Village meeting on alternate crops",
          "Delay sowing or switch to short-duration varieties",
          "Check farm ponds and storage",
        ],
      },
      {
        actions: [
          "Life-saving irrigation, mulching, thinning",
          "Share water by agreed village rules",
          "Draw down the fodder bank",
        ],
      },
      {
        actions: [
          "Put drinking water first",
          "Protect livestock",
          "Link vulnerable households to wage work and relief",
        ],
      },
    ],
  },
  {
    id: "ai",
    label: "SukhaRakshak AI",
    who: "Advisories to farmers, VDRCs and extension staff",
    cells: [
      { text: "Seasonal outlook and preparedness tips; scheme and entitlement information." },
      { text: "Sowing-window and variety advisories for the block's main rainfed crops." },
      { text: "Crop-saving practices and water-use guidance, matched to the active trigger." },
      { text: "Relief, insurance and fodder information; farmer questions logged for MELIA." },
    ],
  },
  {
    id: "funding",
    label: "Funding window",
    who: "Corpus, saturation and convergence",
    cells: [
      { text: "Corpus fund for upkeep; convergence works under MGNREGA, Jal Jeevan Mission and NABARD WDF." },
      { text: "MGNREGA shelf of works; departmental seed and input schemes.", pending: "Schemes to confirm" },
      {
        text: "State agriculture and water schemes; corpus fund for emergency repairs.",
        pending: "Schemes to confirm",
      },
      {
        text: "State disaster relief once drought is declared; crop insurance payouts.",
        pending: "Schemes to confirm",
      },
    ],
  },
];

export const MATRIX_NOTE =
  "Mock-up for discussion with TNSDMA and IWMI. Stage names, thresholds, actions and funding windows are illustrative and to be set with TNSDMA, TNDRRA, TNAU and ICAR-CRIDA.";

/** Sample advisory wording per stage, as SukhaRakshak AI might send it. */
export const ADVISORIES: { en: string; ta: string }[] = [
  {
    en: "The seasonal outlook is near normal. Desilt your farm pond and check your seed stock before sowing.",
    ta: "பருவ மழை முன்னறிவிப்பு இயல்பு நிலையில் உள்ளது. விதைப்புக்கு முன் பண்ணைக் குட்டையைத் தூர்வாரி, விதை இருப்பைச் சரிபார்க்கவும்.",
  },
  {
    en: "Rain is likely to be below normal over the next few weeks. Delay sowing or choose a short-duration variety.",
    ta: "அடுத்த சில வாரங்களில் மழை இயல்பை விடக் குறைவாக இருக்க வாய்ப்புள்ளது. விதைப்பைத் தள்ளிவைக்கவும் அல்லது குறுகிய கால ரகத்தைத் தேர்வு செய்யவும்.",
  },
  {
    en: "Dry spell alert. Give one life-saving irrigation from the farm pond and mulch the field to hold moisture.",
    ta: "வறட்சி எச்சரிக்கை. பண்ணைக் குட்டையிலிருந்து ஒரு உயிர்த் தண்ணீர் பாய்ச்சவும்; ஈரப்பதம் காக்க நிலப்போர்வை இடவும்.",
  },
  {
    en: "Severe drought. Drinking water comes first. Ask your VDRC about fodder, wage work and crop insurance claims.",
    ta: "கடும் வறட்சி. குடிநீருக்கு முதலிடம் கொடுங்கள். தீவனம், வேலைவாய்ப்பு, பயிர்க் காப்பீடு குறித்து உங்கள் கிராமக் குழுவை அணுகவும்.",
  },
];

export type Block = { title: string; body: string; output?: string };

export const TIERS = {
  assess: {
    step: 1,
    verb: "Assess and anticipate",
    scale: "State and district",
    blocks: [
      {
        title: "Drought Vulnerability Index (DVI)",
        body: "Village-level index of exposure, sensitivity and adaptive capacity. Indicators normalised and weighted by PCA plus expert review with TNSDMA, TNDRRA and TNAU.",
        output: "GIS hotspot maps and a ranked village list that says where to act first.",
      },
      {
        title: "Drought prediction and monitoring (TN-DEWS)",
        body: "SADMS forecasts tuned to Tamil Nadu's rainfed crops: VIC soil moisture, SPI, Earth observation and weather forecasts.",
        output: "Block-level drought status and live triggers, run by the TNDRRA drought monitoring cells.",
      },
    ] as Block[],
    handoff: "Targets and triggers",
  },
  plan: {
    step: 2,
    verb: "Plan",
    scale: "Block to village",
    blocks: [
      {
        title: "Block-level drought contingency plan",
        body: "Digital, dynamic plan in the SADMS-DSS, co-developed with ICAR-CRIDA. Live triggers select the action: crop, water, fodder and livelihood measures for each drought stage.",
        output: "Stage-wise action list for each block.",
      },
      {
        title: "Village drought management plan",
        body: "Co-designed with Village Drought Resilience Committees (VDRCs) and Panchayati Raj Institutions. The water-balance drought-proofing tool tests and sizes interventions before money is spent.",
        output: "A costed, prioritised village plan.",
      },
    ] as Block[],
    handoff: "Plans become works",
  },
  act: {
    step: 3,
    verb: "Act",
    scale: "Village-level adaptation interventions",
    horizons: [
      {
        when: "This season",
        title: "Protect crops and people",
        items: [
          "Contingency crops and short-duration seed",
          "Life-saving irrigation from farm ponds",
          "Mulching and in-situ moisture conservation",
          "Fodder banks and drinking water supply",
          "MGNREGA wage days on water works",
        ],
      },
      {
        when: "1 to 3 years",
        title: "Build the water buffer",
        items: [
          "Desilt tanks, ooranis and supply channels",
          "Farm ponds, check dams, recharge shafts",
          "Micro-irrigation; shift to millets and pulses",
          "Soil health and fodder plots",
          "SHG and FPO livelihood diversification",
        ],
      },
      {
        when: "3 years and beyond",
        title: "Change the system",
        items: [
          "Tank cascade and watershed restoration",
          "Groundwater budgeting and aquifer recharge",
          "Climate-resilient cropping systems",
          "Crop insurance and risk finance uptake",
          "VDRC plan embedded in the Gram Panchayat plan",
        ],
      },
    ],
    funding: [
      {
        title: "Saturation",
        body: "Water, agriculture, livelihoods and infrastructure covered in every selected village.",
      },
      {
        title: "Convergence",
        body: "MGNREGA, Jal Jeevan Mission and NABARD Watershed Development Fund, aligned to the TN SAPCC.",
      },
      { title: "Corpus fund", body: "Village fund that pays for upkeep of water bodies and drought-proofing works." },
    ],
    handoff: "Results tracked",
  },
  advise: {
    step: 4,
    verb: "Advise",
    scale: "SukhaRakshak AI",
    summary: "Multilingual AI drought advisory assistant that carries every tier to the last mile.",
    blocks: [
      {
        receives: "Triggers",
        title: "Early warning alerts",
        body: "Forecast and drought-stage alerts from TN-DEWS, in Tamil, for each block and village.",
      },
      {
        receives: "Actions",
        title: "Contingency advisories",
        body: "Trigger-matched crop, water and fodder actions from the block contingency plan, in plain language farmers can act on.",
      },
      {
        receives: "Guidance",
        title: "Intervention guidance",
        body: "What to build, which scheme funds it and how to apply. Answers farmer questions from a curated knowledge base.",
      },
    ],
    reaches: "Farmers, VDRCs, extension staff and block officials.",
    returns: "Queries and feedback as MELIA data.",
    handoff: "Usage and feedback",
  },
  learn: {
    step: 5,
    verb: "Learn",
    scale: "MELIA indicators, aligned to the NDMA indicator list",
    loop: "The annual pause and reflect updates the DVI and the plans.",
    indicators: [
      {
        level: "Output",
        title: "Risk knowledge",
        body: "Villages with a validated DVI score and field-survey baseline.",
      },
      {
        level: "Output",
        title: "Prediction and monitoring",
        body: "Forecast skill and lead time; blocks receiving regular trigger bulletins.",
      },
      {
        level: "Output",
        title: "Planning",
        body: "Blocks with a dynamic contingency plan; villages with a VDRC-approved plan.",
      },
      {
        level: "Outcome",
        title: "Interventions and finance",
        body: "Saturation coverage per village; convergence funds leveraged; corpus fund upkeep spend.",
      },
      {
        level: "Outcome and impact",
        title: "Advisory reach and resilience",
        body: "Farmers reached and acting on advisories, by gender; yield and water availability in drought years.",
      },
    ],
  },
} as const;

export const FRAMEWORK_NOTE =
  "Mock-up for discussion with TNSDMA and IWMI. Timeframes, drought stages, intervention lists and MELIA targets are to be confirmed with TNSDMA, TNDRRA and TNAU.";
