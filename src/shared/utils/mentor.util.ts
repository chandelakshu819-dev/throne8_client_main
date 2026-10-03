/**
 * Builds the mentor profile page URL for a mentor.
 * Route format: /mentorship/mentor-card/[mentorname]/[mentorid]
 *
 * @param name - The mentor's full name (will be slugified: lowercase, spaces -> hyphens, special characters removed)
 * @param mentorId - The mentor's UUID
 */
export function buildMentorProfileUrl(
  name?: string | null,
  mentorId?: string | null
): string {
  const cleanName = (name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  const slug = cleanName || "mentor";
  return `/mentorship/mentor-card/${slug}/${mentorId || ""}`;
}
