/**
 * Room Rate Management & Dynamic Pricing Calculation Engine
 */

export type RateAdjustmentType = 'PERCENTAGE' | 'FLAT_AMOUNT';

export interface RateRule {
  id: string;
  name: string;
  roomType: string | null; // null means applies to all room types
  startDate: string | null; // YYYY-MM-DD
  endDate: string | null;   // YYYY-MM-DD
  daysOfWeek: number[];     // e.g. [5, 6] for Friday & Saturday
  adjustmentType: RateAdjustmentType;
  adjustmentValue: number; // e.g. 15 for +15%, or 10000 for +₦10,000
  active: boolean;
  createdAt: string;
}

export interface NightlyRateDetail {
  date: string;
  dayName: string;
  baseRate: number;
  finalRate: number;
  appliedRules: string[];
}

export interface StayPricingResult {
  baseRate: number;
  stayNights: number;
  totalStayPrice: number;
  nightlyBreakdown: NightlyRateDetail[];
}

// In-memory active rate rules store (initialized with realistic defaults)
let activeRateRules: RateRule[] = [
  {
    id: 'rule-weekend-surge',
    name: 'Weekend Surge (+15%)',
    roomType: null,
    startDate: null,
    endDate: null,
    daysOfWeek: [5, 6], // Friday (5) and Saturday (6)
    adjustmentType: 'PERCENTAGE',
    adjustmentValue: 15,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rule-festive-peak',
    name: 'Dec/Jan Festive Season Surge (+25%)',
    roomType: null,
    startDate: '2026-12-20',
    endDate: '2027-01-05',
    daysOfWeek: [],
    adjustmentType: 'PERCENTAGE',
    adjustmentValue: 25,
    active: true,
    createdAt: new Date().toISOString(),
  },
];

export function getRateRules(): RateRule[] {
  return activeRateRules;
}

export function addRateRule(rule: Omit<RateRule, 'id' | 'createdAt'>): RateRule {
  const newRule: RateRule = {
    ...rule,
    id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    createdAt: new Date().toISOString(),
  };
  activeRateRules.push(newRule);
  return newRule;
}

export function deleteRateRule(id: string): boolean {
  const index = activeRateRules.findIndex((r) => r.id === id);
  if (index !== -1) {
    activeRateRules.splice(index, 1);
    return true;
  }
  return false;
}

export function toggleRateRuleStatus(id: string): RateRule | null {
  const rule = activeRateRules.find((r) => r.id === id);
  if (rule) {
    rule.active = !rule.active;
    return rule;
  }
  return null;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Calculates night-by-night dynamic stay rates given check-in/out dates and base rate
 */
export function calculateStayPrice(params: {
  baseRate: number;
  roomType?: string | null;
  checkIn: Date | string;
  checkOut: Date | string;
  customRules?: RateRule[];
}): StayPricingResult {
  const { baseRate, roomType = null, checkIn, checkOut, customRules } = params;

  const startDate = new Date(checkIn);
  const endDate = new Date(checkOut);

  // Fallback to 1 night if checkOut <= checkIn
  let totalNights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
  if (isNaN(totalNights) || totalNights <= 0) {
    totalNights = 1;
  }

  const rulesToApply = (customRules || activeRateRules).filter((r) => r.active);
  const nightlyBreakdown: NightlyRateDetail[] = [];
  let totalStayPrice = 0;

  for (let i = 0; i < totalNights; i++) {
    const currentNight = new Date(startDate);
    currentNight.setDate(startDate.getDate() + i);

    const year = currentNight.getFullYear();
    const month = String(currentNight.getMonth() + 1).padStart(2, '0');
    const day = String(currentNight.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const dayOfWeek = currentNight.getDay();
    const dayName = DAY_NAMES[dayOfWeek];

    let nightRate = baseRate;
    const appliedRules: string[] = [];

    for (const rule of rulesToApply) {
      // Room type filter check
      if (rule.roomType && roomType && rule.roomType.toLowerCase() !== roomType.toLowerCase()) {
        continue;
      }

      // Day of week check
      if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
        if (!rule.daysOfWeek.includes(dayOfWeek)) {
          continue;
        }
      }

      // Date range check
      if (rule.startDate && dateStr < rule.startDate) {
        continue;
      }
      if (rule.endDate && dateStr > rule.endDate) {
        continue;
      }

      // Apply adjustment
      if (rule.adjustmentType === 'PERCENTAGE') {
        nightRate += (baseRate * rule.adjustmentValue) / 100;
        appliedRules.push(`${rule.name} (+${rule.adjustmentValue}%)`);
      } else if (rule.adjustmentType === 'FLAT_AMOUNT') {
        nightRate += rule.adjustmentValue;
        appliedRules.push(`${rule.name} (+₦${rule.adjustmentValue.toLocaleString()})`);
      }
    }

    nightRate = Math.max(0, Math.round(nightRate * 100) / 100);
    totalStayPrice += nightRate;

    nightlyBreakdown.push({
      date: dateStr,
      dayName,
      baseRate,
      finalRate: nightRate,
      appliedRules,
    });
  }

  return {
    baseRate,
    stayNights: totalNights,
    totalStayPrice: Math.round(totalStayPrice * 100) / 100,
    nightlyBreakdown,
  };
}
