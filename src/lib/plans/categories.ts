// Copied from sukharakshak-portal/lib/categories.ts so topics match the portal. Keep the two in step.
// Sorts a district's sections into the topics of the national contingency-plan template
// (the same grouping the ICAR-CRIDA site uses): district profile topics and contingency strategies.
//
// A section is placed by, in order: its template number (1.3 → Land use), then the words in its
// heading, then the words at the start of its text. About 70% of headings carry no number
// ("Condition", "Health and disease management"…), so the word rules do most of the work and
// some sections will land in "Other". Nothing is stored: this is worked out when a page is shown.
import { bodyText } from './body';
import { displayHeader, headerParts } from './format';

export type CategoryGroup = 'profile' | 'strategy' | 'other';

export interface Category {
  id: string;
  group: CategoryGroup;
  label: string;
  hint: string; // one line shown under the title
}

export const GROUP_LABEL: Record<CategoryGroup, string> = {
  profile: 'District profile',
  strategy: 'Contingency strategies',
  other: 'More',
};

export const CATEGORIES: Category[] = [
  { id: 'overview', group: 'profile', label: 'Overview & zone', hint: 'Agro-climatic zone, location, offices' },
  { id: 'hazards', group: 'profile', label: 'Hazard proneness', hint: 'What the district is prone to' },
  { id: 'rainfall', group: 'profile', label: 'Rainfall', hint: 'Normals, onset and cessation' },
  { id: 'land', group: 'profile', label: 'Land use', hint: 'Geographical and agricultural land use' },
  { id: 'soils', group: 'profile', label: 'Soils', hint: 'Major soil types and area' },
  { id: 'water', group: 'profile', label: 'Irrigation & water', hint: 'Sources, groundwater, inputs' },
  { id: 'crops', group: 'profile', label: 'Crops & horticulture', hint: 'Area, production, sowing windows' },
  { id: 'animals', group: 'profile', label: 'Livestock, poultry & fish', hint: 'Population and production figures' },
  { id: 'maps', group: 'profile', label: 'Maps', hint: 'Location, rainfall and soil maps' },

  { id: 'drought', group: 'strategy', label: 'Drought & delayed monsoon', hint: 'Rainfed and irrigated situations' },
  { id: 'rains', group: 'strategy', label: 'Unusual rains', hint: 'Untimely and unseasonal rain' },
  { id: 'floods', group: 'strategy', label: 'Floods', hint: 'Inundation and waterlogging' },
  { id: 'extreme', group: 'strategy', label: 'Heat, cold & storms', hint: 'Heat wave, cold wave, frost, hail, cyclone' },
  { id: 'livestock', group: 'strategy', label: 'Livestock measures', hint: 'Feed, water, health, shelter' },
  { id: 'poultry', group: 'strategy', label: 'Poultry measures', hint: 'Before, during and after the event' },
  { id: 'fisheries', group: 'strategy', label: 'Fisheries measures', hint: 'Capture and aquaculture' },

  { id: 'other', group: 'other', label: 'Other sections', hint: 'Not matched to a topic' },
];

export const CATEGORY_BY_ID: Record<string, Category> = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

// Template numbers → topic. Only used for two-part numbers (1.x, 2.x); a bare "1" or "3" is too ambiguous.
const BY_NUMBER: Record<string, string> = {
  '1.0': 'overview', '1.1': 'overview', '1.2': 'rainfall', '1.3': 'land', '1.4': 'soils', '1.5': 'land', '1.6': 'water',
  '1.7': 'crops', '1.8': 'animals', '1.9': 'animals', '1.10': 'animals', '1.11': 'crops', '1.12': 'crops',
  '1.13': 'hazards', '1.14': 'maps', '1.15': 'maps',
  '2.0': 'drought', '2.1': 'drought', '2.2': 'rains', '2.3': 'floods', '2.4': 'extreme',
};

const RX = {
  poultry: /poultry|\bbirds?\b|broiler|layers?\b|hatcher|chicks?\b/i,
  fish: /fisher|aquacultur|\bfish|fingerling|\bponds?\b|\bboats?\b|\bnets?\b|capture|\bculture\b|marine|brackish|\binland\b|hatcheries/i,
  livestock: /livestock|cattle|\banimals?\b|fodder|\bfeed\b|veterinar|vaccin|deworm|carcass|milch|bovine|buffalo|goat|sheep|drinking water|health and disease|shelter/i,
  drought: /drought|dry spell|delay(ed)? (by|in|onset)|onset of monsoon|early season|mid.?season|terminal|release of water|limited release|non.?release|rainfed situation|irrigated situation|groundwater recharge|lack of inflows/i,
  rains: /unusual rain|untimely|un-?seasonal|continuous high rainfall|heavy rainfall with high speed winds|outbreak of pests and diseases due to unseasonal/i,
  floods: /flood|inundation|water ?logging|sea water (intrusion|inundation)|transient water/i,
  extreme: /heat wave|cold wave|frost|hail ?storm|cyclone|extreme event|\bfog\b/i,
  figures: /data source|\(?\bnumber\b|population|\('?000|production \(|productivity|no\. of|area \(ha\)|qty/i,
};

const GENERIC = /^(condition|suggested contingency measures?|untitled section|measures?|remarks?|contd\.?|continued|\d+(\.\d+)*)$/i;

function hazardOf(text: string): string | null {
  // "rains" before "drought": drought tables rarely mention unseasonal rain, the reverse is common
  if (RX.rains.test(text)) return 'rains';
  if (RX.floods.test(text)) return 'floods';
  if (RX.extreme.test(text)) return 'extreme';
  if (RX.drought.test(text)) return 'drought';
  return null;
}

function animalOf(text: string): string | null {
  if (RX.poultry.test(text)) return 'poultry';
  if (RX.fish.test(text)) return 'fisheries';
  if (RX.livestock.test(text)) return 'livestock';
  return null;
}

function profileOf(title: string): string | null {
  if (/agro.?(climatic|ecolog)|contingency plan for|district agriculture profile|geographic coordinates|headquarters|krishi vigyan|\bkvk\b|nodal officer/i.test(title)) return 'overview';
  if (/prone to|major contingenc/i.test(title)) return 'hazards';
  if (/\bmaps?\b|annexure/i.test(title)) return 'maps';
  // "Medium rainfall river valley", "Kharif - Irrigated" are farming situations inside strategy tables, not profile topics
  if (/(high|medium|low|heavy|scanty|assured|more|less)\s+rainfall|(kharif|rabi|summer|zaid)\b.*(irrigated|rainfed)|(irrigated|rainfed)\s+(situation|condition)/i.test(title)) return null;
  if (/rainfall|rainy days|monsoon/i.test(title)) return 'rainfall';
  if (/\bsoils?\b/i.test(title)) return 'soils';
  if (/land use|net sown|cropping intensity|geographical area/i.test(title)) return 'land';
  if (/irrigat|groundwater|ground water|waste ?water|water (availab|resourc|quality)|fertili[sz]er|pesticide|\bwells?\b|tanks?\b|canals?\b/i.test(title)) return 'water';
  return null;
}

const CROPS = /crop|horticultur|sowing window|\bkharif\b|\brabi\b|\bsummer\b|vegetable|fruit|fodder crop|plantation|spices|flowers|cereal|pulses|oilseed|paddy|\brice\b|wheat|maize|millet|sorghum|cotton|sugarcane|groundnut|soybean|mustard|gram\b|jute|potato|onion|chilli|banana|mango|coconut/i;

export function categorize(section: { header: string | null; body: string }): string {
  const { number } = headerParts(section.header);
  const title = displayHeader(section.header);
  const parts = number?.split('.') ?? [];

  // 1. Template number
  if (parts.length >= 2) {
    const key = `${parts[0]}.${parts[1]}`;
    if (key === '2.5') {
      if (parts[2] === '2' || RX.poultry.test(title)) return 'poultry';
      if (parts[2] === '3' || RX.fish.test(title)) return 'fisheries';
      return 'livestock';
    }
    // A few plans number a strategy table under 1.x; trust clear hazard words over the number.
    if (parts[0] === '1' && hazardOf(title) && !/prone/i.test(title)) return hazardOf(title)!;
    if (BY_NUMBER[key]) return BY_NUMBER[key];
  }

  const generic = !section.header || GENERIC.test(title.replace(/[:.\s]+$/, ''));
  const start = bodyText(section.body).slice(0, 1400);

  if (!generic) {
    // 2. Heading words. Tables of figures belong to the profile even when they mention fish or cattle.
    const profile = profileOf(title);
    if (profile) return profile;
    const animal = animalOf(title);
    if (animal) return RX.figures.test(title) || (RX.figures.test(start) && !hazardOf(start) && !/measures|before the event|during the event|after the event/i.test(start)) ? 'animals' : animal;

    const hazard = hazardOf(title);
    if (hazard) {
      // "Floods" / "Cyclone" are also sub-headings inside the livestock, poultry and fisheries strategies.
      if (/before the event|during the event|after the event/i.test(start)) return animalOf(start) ?? hazard;
      return hazard;
    }
    if (CROPS.test(title) || /irrigated|rainfed/i.test(title)) return hazardOf(start) ?? (/farming situation|agronomic measures|change in crop/i.test(start) ? 'drought' : 'crops');
  }

  // 3. Start of the text
  const hazard = hazardOf(start);
  const animal = /before the event|during the event|after the event|feed and fodder|health and disease/i.test(start) ? animalOf(start) : null;
  if (animal) return animal;
  if (hazard) return hazard;
  const profile = profileOf(start.slice(0, 300));
  if (profile) return profile;
  if (/crop(ping)? system|farming situation|agronomic measures|change in crop|contingent crop/i.test(start)) return 'drought';
  const a = animalOf(start.slice(0, 300));
  if (a) return RX.figures.test(start) ? 'animals' : a;
  if (CROPS.test(start.slice(0, 300))) return 'crops';
  return 'other';
}
