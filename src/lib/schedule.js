// Computes the next scheduled snapshot time: 10:00am or 8:00pm America/New_York,
// whichever comes next. Written without a date library, using Intl to stay
// correct across the EST/EDT boundary.

const TIMEZONE = 'America/New_York';
const RUN_HOURS = [10, 20]; // 10am, 8pm

function easternHourOf(date) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    hour12: false,
  });
  return Number(fmt.format(date));
}

// Returns the UTC Date corresponding to `hour`:00 America/New_York on the
// same Eastern calendar day as `referenceDate`.
function easternTimeOnSameDay(referenceDate, hour) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = {};
  fmt.formatToParts(referenceDate).forEach((p) => {
    if (p.type !== 'literal') parts[p.type] = p.value;
  });
  const y = Number(parts.year);
  const m = Number(parts.month);
  const d = Number(parts.day);

  // Guess the UTC instant assuming hour:00 UTC, then correct by comparing
  // what Eastern hour that guess actually lands on (self-correcting for DST).
  let guess = new Date(Date.UTC(y, m - 1, d, hour, 0, 0));
  const diff = hour - easternHourOf(guess);
  if (diff !== 0) {
    guess = new Date(guess.getTime() + diff * 3600000);
  }
  return guess;
}

export function getNextRunTime(now = new Date()) {
  const todaysRuns = RUN_HOURS.map((h) => easternTimeOnSameDay(now, h));
  const upcoming = todaysRuns.filter((t) => t.getTime() > now.getTime());
  if (upcoming.length) {
    return upcoming.sort((a, b) => a - b)[0];
  }
  const tomorrow = new Date(now.getTime() + 24 * 3600000);
  return easternTimeOnSameDay(tomorrow, RUN_HOURS[0]);
}
