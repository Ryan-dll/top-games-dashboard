const TIMEZONE = 'America/New_York';
const TARGET_HOUR = 20; // 8pm
const TOLERANCE_HOURS = 3; // accept anything from 5pm-11pm ET as "the evening run"

// Cron fires at midnight, 10am, 1pm, and 8pm ET - see vercel.json / schedule.js.
export const SNAPSHOTS_PER_DAY = 4;

function easternDayAndHour(ts) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = {};
  fmt.formatToParts(new Date(ts)).forEach((p) => {
    if (p.type !== 'literal') parts[p.type] = p.value;
  });
  return {
    dayKey: `${parts.year}-${parts.month}-${parts.day}`,
    hour: (Number(parts.hour) % 24) + Number(parts.minute) / 60,
  };
}

// Keeps only the snapshot closest to 8pm America/New_York for each calendar
// day, skipping days whose closest snapshot falls outside the tolerance
// window. The tolerance absorbs cron jitter while still not mistaking the
// 1pm/10am run for the evening one on a day the 8pm run never fired.
export function filterEveningSnapshots(snapshots) {
  const bestForDay = new Map();
  snapshots.forEach((s) => {
    const { dayKey, hour } = easternDayAndHour(s.ts);
    const distance = Math.abs(hour - TARGET_HOUR);
    if (distance > TOLERANCE_HOURS) return;
    const existing = bestForDay.get(dayKey);
    if (!existing || distance < existing.distance) {
      bestForDay.set(dayKey, { snapshot: s, distance });
    }
  });
  return Array.from(bestForDay.values())
    .map((v) => v.snapshot)
    .sort((a, b) => new Date(b.ts) - new Date(a.ts));
}

// `snapshots` must be sorted most-recent-first. `days` of null/undefined
// means "all of them". `detail` of 'succinct' collapses each day down to
// its evening snapshot; anything else keeps every snapshot in range.
export function selectSnapshotsForCombine(snapshots, { days, detail }) {
  const ranged = days == null ? snapshots : snapshots.slice(0, days * SNAPSHOTS_PER_DAY);
  return detail === 'succinct' ? filterEveningSnapshots(ranged) : ranged;
}
