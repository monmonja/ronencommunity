/**
 * BAXIE BREEDING (v1.3) - Node.js Module (ES6)
 * - Body never gets Mystic
 * - Mystic is a special part (text "Mystic"), not element-based
 */

export const ELEMENTS = ["fire", "aqua", "demon", "fairy", "electric", "plant"];

// Part names in order: Body is always first, then the rest
export const PART_NAMES = ["Body", "Forehead", "Eyes", "Ears", "Mouth", "Tail"];

// Maximum part numbers for each type
export const PARTS_MAX = {
  Body: 1, // Body doesn't have variants
  Eyes: 25,
  Mouth: 24,
  Forehead: 24,
  Tail: 24,
  Ears: 18
};

/**
 * Normalize element name from a part string
 * @param {string} s - Part string like "fire eyes" or "Mystic aqua tail"
 * @returns {string} - Normalized element name
 */
export function normalizeElement(s) {
  if (!s || typeof s !== "string") return "";
  const t = s.toLowerCase().trim().replace(/^mystic\s+/, "");
  for (const e of ELEMENTS) {
    if (t.startsWith(e)) return e;
  }
  return "";
}

/**
 * Get unique values from array
 * @param {Array} a - Input array
 * @returns {Array} - Array with unique values
 */
export function unique(a) {
  return [...new Set(a)];
}

/**
 * Pick random item from array
 * @param {Array} arr - Input array
 * @returns {*} - Random item
 */
export function randChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate a random part number for a given part type
 * @param {string} partName - Part name like "Eyes", "Mouth", etc.
 * @returns {number} - Random number between 1 and max for that part
 */
export function randomPartNumber(partName) {
  const max = PARTS_MAX[partName] || 1;
  return Math.floor(Math.random() * max) + 1;
}

/**
 * Pick value based on weighted probability
 * @param {*} aVal - Value A
 * @param {*} bVal - Value B
 * @param {number} wA - Weight A (0-1)
 * @param {number} wB - Weight B (0-1)
 * @returns {*} - Selected value
 */
export function pickWeighted(aVal, bVal, wA, wB) {
  return Math.random() * (wA + wB) < wA ? aVal : bVal;
}

/**
 * Convert parts object to ordered array
 * @param {Object} partsObj - Parts as object with keys like Body, Tail, etc.
 * @returns {string[]} - Array of 6 parts in order
 */
export function partsToArray(partsObj) {
  return PART_NAMES.map(name => partsObj[name] || "");
}

/**
 * Convert parts array to object
 * @param {string[]} partsArray - Array of 6 parts
 * @returns {Object} - Parts as object with named keys
 */
export function arrayToParts(partsArray) {
  const obj = {};
  PART_NAMES.forEach((name, i) => {
    obj[name] = partsArray[i] || "";
  });
  return obj;
}

/**
 * Breed one offspring from two parents
 * @param {Object} A - Parent A with structure: { parts: { Body, Forehead, Eyes, Ears, Mouth, Tail }, gender: string }
 * @param {Object} B - Parent B with same structure as A
 * @param {Object} cfg - Configuration object
 * @param {number} cfg.wA - Weight for parent A (default: 0.5)
 * @param {number} cfg.wB - Weight for parent B (default: 0.5)
 * @param {number} cfg.pParents - Probability to inherit from parents (default: 0.7)
 * @param {number} cfg.pVariation - Probability for variation (default: 0.25)
 * @param {number} cfg.pMutation - Probability for mutation (default: 0.05)
 * @param {number} cfg.pMystic - Probability for mystic part (default: 0.005)
 * @returns {Object} - Offspring with structure: { gender: string, parts: { Body, Forehead, Eyes, Ears, Mouth, Tail } }
 */
export function breedOne(A, B, cfg = {}) {
  // Default configuration
  const {
    wA = 0.5,
    wB = 0.5,
    pParents = 0.7,
    pVariation = 0.25,
    pMutation = 0.05,
    pMystic = 0.005
  } = cfg;

  // Convert parts objects to arrays for processing
  const partsA = partsToArray(A.parts);
  const partsB = partsToArray(B.parts);

  const out = [];
  let bodyElement = null;

  // Breed 6 parts: Body, Forehead, Eyes, Ears, Mouth, Tail
  for (let i = 0; i < 6; i++) {
    const partName = PART_NAMES[i];
    const pa = (partsA[i] || "").trim();
    const pb = (partsB[i] || "").trim();
    const elA = normalizeElement(pa);
    const elB = normalizeElement(pb);
    const pairEls = unique([elA, elB].filter(Boolean));

    // Determine which branch: parents / variation / mutation
    const r = Math.random();
    let base = "";

    if (r < pParents) {
      // Inherit from parents
      base = pickWeighted(pa, pb, wA, wB);
    } else if (r < pParents + pVariation) {
      // Variation: use elements from parents, or body element, or random
      const pickEl = pairEls.length
        ? randChoice(pairEls)
        : (bodyElement || randChoice(ELEMENTS));
      const partNum = randomPartNumber(partName);
      base = `${pickEl.charAt(0).toUpperCase() + pickEl.slice(1)}${partName === 'Body' ? '' : ' #' + partNum}`;
    } else {
      // Mutation: use element NOT in parents
      const others = ELEMENTS.filter(e => !pairEls.includes(e));
      const pickEl = others.length ? randChoice(others) : randChoice(ELEMENTS);
      const partNum = randomPartNumber(partName);
      base = `${pickEl.charAt(0).toUpperCase() + pickEl.slice(1)}${partName === 'Body' ? '' : ' #' + partNum}`;
    }

    // Mystic: ONLY for Forehead..Tail (NOT body, so i !== 0)
    if (i !== 0) {
      const alreadyMystic = /^mystic$/i.test(base.trim());
      if (!alreadyMystic && Math.random() < pMystic) {
        base = "Mystic";
      }
    }

    out.push(base);

    // Save body element if not Mystic (for variation reference)
    if (i === 0 && !/mystic/i.test(base)) {
      bodyElement = normalizeElement(base);
    }
  }

  // Random gender
  const gender = Math.random() < 0.5 ? "male" : "female";

  return {
    gender,
    parts: arrayToParts(out)
  };
}