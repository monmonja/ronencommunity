import config from "../config/default.json" with { type: "json" };

export function getRaffle(date) {
  const ts = (date instanceof Date ? date.getTime() : date);

  for (const raffle of config.raffles) {
    const start = raffle.raffleStartDate;
    const end = start + raffle.raffleDuration * 24 * 60 * 60 * 1000; // days → ms

    if (ts >= start && ts < end) {
      return raffle;
    }
  }

  return null;
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

// raffles: array of raffles from JSON
export function raffleEndingIn(date) {
  const ts = date instanceof Date ? date.getTime() : date;

  // find the current raffle (the one whose period contains `date`)
  const current = config.raffles.find((raffle) => {
    const start = raffle.raffleStartDate;
    const end = start + raffle.raffleDuration * 24 * 60 * 60 * 1000; // duration in ms

    return ts >= start && ts < end;
  });

  // no active raffle
  if (!current) {
    return null;
  }

  const end = current.raffleStartDate + current.raffleDuration * 24 * 60 * 60 * 1000 - 1;

  return end - ts; // ms remaining
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
