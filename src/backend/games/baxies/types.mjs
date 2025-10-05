/**
 * @typedef {Object} BaxieAttributesType
 * @property {string} status - Baxie status
 * @property {string} class - Baxie class
 * @property {string} gender - Baxie gender
 * @property {string} tail - Baxie tail
 * @property {string} ears - Baxie ears
 * @property {string} mouth - Baxie mouth
 * @property {string} eyes - Baxie eyes
 * @property {string} forehead - Baxie forehead
 * @property {number} attack - Baxie attack
 * @property {number} defense - Baxie defense
 * @property {number} statima - Baxie stamina
 * @property {number} skill - Baxie skill
 * @property {number} mystic - Baxie mystic
 * @property {number} purity - Baxie purity
 */


/**
 * @typedef {Object} BaxieEffect
 * @property {string} type - Effect type (e.g., 'staminaReduction')
 * @property {number} [value] - Effect value (e.g., amount of stamina reduced)
 * @property {number} turnsLeft - Number of turns the effect lasts
 */

/**
 * @typedef {Object} BaxieSkillReturnItem
 * @property {string} target - Target baxie tokenId
 * @property {number} [damage] - Damage dealt
 * @property {number} [healed] - Healing done (if applicable)
 * @property {number} [staminaRestored] - Stamina restored (if applicable)
 * @property {BaxieEffect[]} [effects] - Stamina reduced (if applicable)
 */
/**
 * @typedef {Object} BaxieSkillReturn
 * @property {BaxieSkillReturnItem[]} [enemies] - Baxie status
 * @property {BaxieSkillReturnItem[]} [allies] - Baxie class
 * @property {number} [hpSacrifice] - Hp sacrifice for skill
 * @property {number} [lifeSteal] - Hp stolen from enemy
 * @property {number} [hp] - Current hp after skill
 * @property {number} [stamina] - Current stamina after skill
 * @property {boolean} [hasKilledAnEnemy] - If an enemy was killed
 */