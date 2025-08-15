import config from "../config/default.json" with { type: "json" };

export function getRaffleId(date) {
  const anchor = new Date(config.web3.raffleStartDate); // from JSON, stored as timestamp
  anchor.setUTCHours(0, 0, 0, 0); // Force UTC midnight

  const targetDate = new Date(date.getTime());

  // Determine the year we’re calculating for
  let year = targetDate.getUTCFullYear();

  // Build the anchor for that year
  let yearAnchor = new Date(Date.UTC(year, anchor.getUTCMonth(), anchor.getUTCDate()));

  // If targetDate is before the anchor in that year, use previous year's anchor
  if (targetDate < yearAnchor) {
    year -= 1;
    yearAnchor = new Date(Date.UTC(year, anchor.getUTCMonth(), anchor.getUTCDate()));
  }

  // Ensure both dates are UTC midnight
  const d = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate()));
  const a = new Date(Date.UTC(yearAnchor.getUTCFullYear(), yearAnchor.getUTCMonth(), yearAnchor.getUTCDate()));

  // Calculate difference in days
  const diffDays = Math.floor((d.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    throw new Error("Date is before the anchor date");
  }

  // How many nights since the year’s anchor
  const daysIndex = Math.floor(diffDays / config.web3.raffleDuration); // 0-based
  const nightNumber = daysIndex + 1;       // 1-based

  return `${String(nightNumber).padStart(2, "0")}-${year}`;
}

export function getUtcNow() {
  const now = new Date();
  // return new Date(Date.UTC(2025, 7, 27, 0, 0, 0, 0));
  return new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    now.getUTCHours(),
    now.getUTCMinutes(),
    now.getUTCSeconds(),
    now.getUTCMilliseconds()
  ));
}

export function raffleEndingIn(date) {
  const anchor = new Date(config.web3.raffleStartDate); // first raffle start
  anchor.setUTCHours(0, 0, 0, 0); // Force UTC midnight

  // Calculate target date + raffle days as in getRaffleId
  const targetDate = new Date(anchor);
  targetDate.setUTCDate(anchor.getUTCDate() + (config.web3.raffleDuration - 1));
  targetDate.setUTCHours(23, 59, 59, 999); // Set to end of day

  let year = targetDate.getUTCFullYear();
  let yearAnchor = new Date(Date.UTC(year, anchor.getUTCMonth(), anchor.getUTCDate()));

  if (targetDate < yearAnchor) {
    year -= 1;
    yearAnchor = new Date(Date.UTC(year, anchor.getUTCMonth(), anchor.getUTCDate()));
  }

  const d = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate()));
  const a = new Date(Date.UTC(yearAnchor.getUTCFullYear(), yearAnchor.getUTCMonth(), yearAnchor.getUTCDate()));

  const diffDays = Math.floor((d - a) / (1000 * 60 * 60 * 24));
  const daysIndex = Math.floor(diffDays / config.web3.raffleDuration);

  // Start of this raffle period in UTC
  const raffleStartUTC = new Date(a.getTime() + daysIndex * config.web3.raffleDuration * 24 * 60 * 60 * 1000);

  // End of this raffle period in UTC: add duration days, set to 23:59:59.999
  const raffleEndUTC = new Date(raffleStartUTC.getTime() + config.web3.raffleDuration * 24 * 60 * 60 * 1000 - 1);

  return raffleEndUTC.getTime() - date.getTime();
}

export function raffleEndsInDHM() {
  const now = getUtcNow();
  const remainingMs = raffleEndingIn(now);    // Date object when raffle ends

  let diffMs = Math.max(remainingMs, 0); // avoid negative

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  diffMs -= days * 24 * 60 * 60 * 1000;

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  diffMs -= hours * 60 * 60 * 1000;

  const minutes = Math.floor(diffMs / (1000 * 60));

  return { days, hours, minutes };
}
