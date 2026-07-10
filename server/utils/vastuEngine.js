/**
 * VASTU RULE ENGINE — Real Vastu Shastra scoring
 * Based on traditional 8-directional (Ashtadisha) compass zones
 *
 * Zone map (when looking at floor plan, North = top):
 *   NW  N  NE
 *    W  C   E
 *   SW  S  SE
 */

// ── Vastu Zone Rules ──────────────────────────────────────────
// Each zone: ideal rooms (+pts), acceptable rooms (0pts), bad rooms (-pts)
const ZONE_RULES = {
  N:  {
    ideal:      ['living', 'drawing', 'study', 'treasury', 'entrance'],
    acceptable: ['bedroom', 'dining'],
    bad:        ['kitchen', 'toilet', 'bathroom'],
    element:    'Water', deity: 'Kubera (Wealth)',
    tip:        'North zone governed by Kubera (wealth god). Ideal for living spaces and water features.',
  },
  NE: {
    ideal:      ['pooja', 'prayer', 'study', 'meditation', 'entrance', 'open'],
    acceptable: ['living'],
    bad:        ['kitchen', 'toilet', 'bathroom', 'bedroom', 'store'],
    element:    'Space', deity: 'Ishaan (Shiva)',
    tip:        'North-East is the most sacred zone. Keep it light and open. Best for pooja room.',
  },
  E:  {
    ideal:      ['living', 'study', 'children_bedroom', 'bathroom', 'entrance'],
    acceptable: ['bedroom', 'dining'],
    bad:        ['kitchen', 'toilet', 'store'],
    element:    'Air', deity: 'Indra (King of Gods)',
    tip:        'East zone brings positive energy and morning light. Good for living and children rooms.',
  },
  SE: {
    ideal:      ['kitchen', 'fire', 'generator', 'electrical'],
    acceptable: ['dining', 'bathroom'],
    bad:        ['bedroom', 'pooja', 'toilet', 'study', 'master_bedroom'],
    element:    'Fire', deity: 'Agni (Fire God)',
    tip:        'South-East is the fire zone — the ONLY correct place for kitchen in Vastu.',
  },
  S:  {
    ideal:      ['master_bedroom', 'bedroom', 'store'],
    acceptable: ['bathroom', 'dining'],
    bad:        ['kitchen', 'entrance', 'living', 'pooja'],
    element:    'Earth', deity: 'Yama (Death God)',
    tip:        'South zone provides stability. Ideal for master bedroom and heavy storage.',
  },
  SW: {
    ideal:      ['master_bedroom', 'safe', 'store', 'heavy'],
    acceptable: ['bedroom', 'study'],
    bad:        ['kitchen', 'entrance', 'pooja', 'bathroom', 'toilet'],
    element:    'Earth', deity: 'Niruti',
    tip:        'South-West is the zone of stability and relationships. Best for master bedroom.',
  },
  W:  {
    ideal:      ['children_bedroom', 'study', 'dining', 'bathroom'],
    acceptable: ['bedroom', 'store', 'living'],
    bad:        ['kitchen', 'entrance', 'pooja'],
    element:    'Water', deity: 'Varuna (Rain God)',
    tip:        'West zone suits study rooms and childrens bedrooms. Good for creativity.',
  },
  NW: {
    ideal:      ['guest_bedroom', 'bathroom', 'garage', 'store', 'toilet'],
    acceptable: ['bedroom', 'living'],
    bad:        ['kitchen', 'pooja', 'master_bedroom'],
    element:    'Air', deity: 'Vayu (Wind God)',
    tip:        'North-West zone — best for guest rooms, garage, and bathrooms.',
  },
  C:  {
    ideal:      ['open', 'courtyard', 'empty'],
    acceptable: [],
    bad:        ['kitchen', 'toilet', 'bathroom', 'bedroom', 'store', 'pooja'],
    element:    'Space', deity: 'Brahma',
    tip:        'Brahmasthana (center) must be kept open and empty for energy flow.',
  },
};

// ── Room type aliases ─────────────────────────────────────────
// Normalize user-provided room names to canonical types
const ROOM_ALIASES = {
  'master bedroom':    'master_bedroom',
  'master bed':        'master_bedroom',
  'master_bedroom':    'master_bedroom',
  'bedroom':          'bedroom',
  'bed room':         'bedroom',
  'bedroom 1':        'bedroom',
  'bedroom 2':        'bedroom',
  'bedroom 3':        'bedroom',
  'children bedroom': 'children_bedroom',
  "kids room":        'children_bedroom',
  'guest bedroom':    'guest_bedroom',
  'guest room':       'guest_bedroom',
  'kitchen':          'kitchen',
  'living room':      'living',
  'living':           'living',
  'hall':             'living',
  'drawing room':     'drawing',
  'dining':           'dining',
  'dining room':      'dining',
  'bathroom':         'bathroom',
  'bath':             'bathroom',
  'toilet':           'toilet',
  'wc':               'toilet',
  'pooja room':       'pooja',
  'puja room':        'pooja',
  'prayer room':      'pooja',
  'mandir':           'pooja',
  'study':            'study',
  'office':           'study',
  'store':            'store',
  'storage':          'store',
  'garage':           'garage',
  'balcony':          'open',
  'terrace':          'open',
  'open':             'open',
  'courtyard':        'courtyard',
  'staircase':        'staircase',
};

function normalizeRoomType(name) {
  if (!name) return 'unknown';
  const lower = name.toLowerCase().trim();
  return ROOM_ALIASES[lower] || lower.split(' ')[0];
}

// ── Zone assignment from pixel position ───────────────────────
// walls come as [{start:[x,y], end:[x,y]}] in 0-512 pixel space
function assignZone(cx, cy, totalW = 512, totalH = 512) {
  const thirdW = totalW / 3;
  const thirdH = totalH / 3;

  // Map pixel coords to grid (col: 0=W, 1=C, 2=E) (row: 0=N, 1=C, 2=S)
  const col = cx < thirdW ? 0 : cx < thirdW * 2 ? 1 : 2;
  const row = cy < thirdH ? 0 : cy < thirdH * 2 ? 1 : 2;

  const GRID = [
    ['NW', 'N', 'NE'],
    ['W',  'C',  'E'],
    ['SW', 'S', 'SE'],
  ];
  return GRID[row][col];
}

// ── Main Vastu Scoring Engine ─────────────────────────────────
/**
 * @param {Array} rooms - [{name: 'Kitchen', zone: 'SE'} | {name, cx, cy}]
 * @param {Array} walls - optional wall segments for auto zone detection
 * @returns {Object} { score, label, correct, conflicts, recommendations, zoneDetails }
 */
function computeVastuScore(rooms = []) {
  if (!rooms || rooms.length === 0) {
    return {
      score: 0,
      label: 'No Data',
      correct: [],
      conflicts: [],
      recommendations: [],
      zoneDetails: [],
    };
  }

  const correct       = [];
  const conflicts     = [];
  const recommendations = [];
  const zoneDetails   = [];

  let rawScore = 50; // base score
  const maxBonus = 50;
  const bonusPerRoom = rooms.length > 0 ? Math.floor(maxBonus / rooms.length) : 10;

  for (const room of rooms) {
    const type = normalizeRoomType(room.name);
    const zone = room.zone || assignZone(room.cx || 256, room.cy || 256);
    const rule = ZONE_RULES[zone];

    if (!rule) continue;

    const detail = {
      room: room.name,
      type,
      zone,
      element: rule.element,
      deity: rule.deity,
    };

    if (rule.ideal.includes(type)) {
      // Perfect placement
      rawScore += bonusPerRoom;
      correct.push({
        icon: 'check_circle',
        label: `${room.name} in ${zone}`,
        detail: `Optimal — ${rule.tip}`,
        zone,
        type: 'ideal',
      });
      detail.status = 'ideal';
      detail.message = `Optimal placement — ${rule.element} zone`;

    } else if (rule.bad.includes(type)) {
      // Conflict
      const penalty = type === 'kitchen' || type === 'toilet' ? 15 : 10;
      rawScore -= penalty;
      conflicts.push({
        icon: 'cancel',
        label: `${room.name} in ${zone} — Vastu Conflict`,
        detail: `${room.name} should NOT be in the ${zone} zone. ${rule.tip}`,
        severity: penalty >= 15 ? 'high' : 'medium',
        zone,
        type: 'conflict',
      });
      detail.status = 'conflict';
      detail.message = `Vastu conflict — ${rule.element} zone incompatible`;

      // Generate fix recommendation
      const betterZone = findBetterZone(type);
      if (betterZone) {
        recommendations.push({
          icon: 'auto_fix_high',
          title: `Relocate ${room.name}`,
          desc: `Move ${room.name} to the ${betterZone} zone for optimal Vastu compliance. Current ${zone} zone is governed by ${rule.deity}.`,
          priority: 'high',
          room: room.name,
          currentZone: zone,
          suggestedZone: betterZone,
        });
      }

    } else {
      // Acceptable
      correct.push({
        icon: 'radio_button_checked',
        label: `${room.name} in ${zone}`,
        detail: `Acceptable placement. ${rule.tip}`,
        zone,
        type: 'acceptable',
      });
      detail.status = 'acceptable';
      detail.message = 'Acceptable — not optimal but not a conflict';
    }

    zoneDetails.push(detail);
  }

  // Add general recommendations if score is low
  if (rawScore < 70) {
    recommendations.push({
      icon: 'lightbulb',
      title: 'Open the Brahmasthana',
      desc: 'Keep the central area (Brahmasthana) of your home free from heavy furniture or walls. This allows cosmic energy to flow through the home.',
      priority: 'medium',
    });
  }
  if (!rooms.find(r => normalizeRoomType(r.name) === 'pooja')) {
    recommendations.push({
      icon: 'temple_hindu',
      title: 'Add Pooja Room in NE',
      desc: 'A dedicated prayer room in the North-East (Ishaan) corner amplifies positive spiritual energy in the entire home.',
      priority: 'low',
    });
  }

  const score = Math.max(0, Math.min(100, Math.round(rawScore)));
  const label = score >= 85 ? 'Excellent Vastu'
              : score >= 70 ? 'Good Alignment'
              : score >= 55 ? 'Needs Improvement'
              : 'Poor Alignment';

  return { score, label, correct, conflicts, recommendations, zoneDetails };
}

// Find the ideal zone for a room type
function findBetterZone(type) {
  for (const [zone, rule] of Object.entries(ZONE_RULES)) {
    if (rule.ideal.includes(type)) return zone;
  }
  return null;
}

// ── Zone info for frontend display ───────────────────────────
function getZoneInfo() {
  return Object.entries(ZONE_RULES).map(([zone, rule]) => ({
    zone,
    element: rule.element,
    deity: rule.deity,
    ideal: rule.ideal,
    tip: rule.tip,
  }));
}

export { computeVastuScore, assignZone, normalizeRoomType, getZoneInfo, ZONE_RULES };
