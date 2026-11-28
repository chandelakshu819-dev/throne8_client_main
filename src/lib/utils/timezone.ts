/**
 * Browser ka real IANA timezone (e.g. "Asia/Kolkata", "America/New_York").
 * Hardcoded "Asia/Kolkata" ki jagah hamesha yahi use karo.
 */
export const getBrowserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
};

/**
 * Kisi specific timezone ka wall-clock time ("2026-12-01", "10:00", "America/New_York")
 * ko sahi UTC ISO string me badalta hai (DST handle karta hai).
 * Mentor ke slot mentor ke timezone me hote hain, isliye scheduledAt isi se banana hai.
 * tz na mile ya galat ho to purane behaviour (Asia/Kolkata) par fallback.
 */
export const zonedWallTimeToISO = (
  date: string, // "YYYY-MM-DD"
  time: string, // "HH:mm"
  timeZone?: string
): string => {
  const tz = timeZone || "Asia/Kolkata";
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const wallAsUtc = Date.UTC(y, m - 1, d, hh, mm);

  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const offsetAt = (ts: number): number => {
      const parts = fmt.formatToParts(new Date(ts));
      const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
      return Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second")) - ts;
    };
    let ts = wallAsUtc - offsetAt(wallAsUtc);
    ts = wallAsUtc - offsetAt(ts); // 2nd pass: DST boundary
    return new Date(ts).toISOString();
  } catch {
    return new Date(`${date}T${time}:00+05:30`).toISOString();
  }
};
