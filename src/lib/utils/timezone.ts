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
