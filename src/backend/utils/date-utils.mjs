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

export function getTodayDateString (date) {
  return date.toISOString().split("T")[0];
}
