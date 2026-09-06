/**
 * Formatting utilities used across components.
 * Pure functions — no side effects, fully testable.
 */

/** Format a number with locale-aware thousands separator */
export function formatNumber(n: number, locale = 'en-IN'): string {
  return new Intl.NumberFormat(locale).format(n);
}

/** Format an ISO date string to a readable display date */
export function formatDate(iso: string, options?: Intl.DateTimeFormatOptions): string {
  const defaults: Intl.DateTimeFormatOptions = {
    year: 'numeric', month: 'short', day: 'numeric',
  };
  return new Intl.DateTimeFormat('en-IN', options ?? defaults).format(new Date(iso));
}

/** Relative time: "2 days ago", "in 3 hours" */
export function relativeTime(iso: string): string {
  const rtf  = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const diff = Date.now() - new Date(iso).getTime();
  const secs = Math.floor(diff / 1000);

  if (secs < 60)     return rtf.format(-secs,            'second');
  if (secs < 3600)   return rtf.format(-Math.floor(secs / 60),    'minute');
  if (secs < 86400)  return rtf.format(-Math.floor(secs / 3600),  'hour');
  if (secs < 604800) return rtf.format(-Math.floor(secs / 86400), 'day');
  if (secs < 2592000)return rtf.format(-Math.floor(secs / 604800),'week');
  return rtf.format(-Math.floor(secs / 2592000), 'month');
}

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Build initials from a full name */
export function getInitials(name: string): string {
  const cleanName = capitalizeName(name);
  return cleanName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * Capitalizes and formats any raw name/username/email into a clean Title Case display name.
 * Examples:
 * - "nisita chandel" -> "Nisita Chandel"
 * - "nisita.chandel" -> "Nisita Chandel"
 * - "nisitachandel" -> "Nisita Chandel"
 * - "NisitaChandel" -> "Nisita Chandel"
 */
const COMMON_SURNAMES = [
  'rajput', 'chandel', 'makwana', 'sharma', 'verma', 'singh', 'kumar', 'gupta',
  'patel', 'shah', 'mehta', 'jain', 'joshi', 'reddy', 'rao', 'nair', 'khanna',
  'kapoor', 'malhotra', 'deshmukh', 'chavan', 'pawar', 'kulkarni', 'pandey',
  'mishra', 'tripathi', 'tiwari', 'shukla', 'yadav', 'thakur', 'chauhan', 'rawat',
  'bisht', 'bhatt', 'roy', 'das', 'sen', 'dutta', 'banerjee', 'chatterjee',
  'mukherjee', 'bose', 'goyal', 'agarwal', 'bansal', 'mittal', 'garg', 'jindal',
  'singhal', 'saini', 'pal', 'kaur', 'sidhu', 'grewal', 'gill', 'dhillon',
  'sandhu', 'rathore', 'solanki', 'parmar', 'bhati', 'shekhawat', 'sisodia',
  'tanwar', 'tomar', 'vaghela', 'zala', 'jadeja', 'raghav', 'rana', 'choudhary',
  'smith', 'johnson', 'williams', 'brown', 'jones', 'miller', 'davis', 'wilson',
  'anderson', 'taylor', 'thomas', 'moore', 'jackson', 'martin', 'lee', 'perez',
  'thompson', 'white', 'harris', 'sanchez', 'clark', 'ramirez', 'lewis', 'robinson',
  'walker', 'young', 'allen', 'king', 'wright', 'scott', 'torres', 'nguyen',
  'hill', 'flores', 'green', 'adams', 'nelson', 'baker', 'hall', 'rivera',
  'campbell', 'mitchell', 'carter', 'roberts', 'gomez', 'phillips', 'evans'
];

/**
 * Capitalizes and formats any raw name/username/email into a clean Title Case display name.
 * Handles:
 * - "nisita chandel" -> "Nisita Chandel"
 * - "nisitarajput" / "Nisitarajput" -> "Nisita Rajput"
 * - "dharmmakwana" -> "Dharm Makwana"
 * - "honeysharma" -> "Honey Sharma"
 * - "NisitaChandel" -> "Nisita Chandel"
 */
export function capitalizeName(str: string): string {
  if (!str || typeof str !== 'string') return '';
  let text = str.trim();

  if (['undefined', 'null', 'loading...'].includes(text.toLowerCase())) {
    return '';
  }

  // Remove email domain if present: "nisita@gmail.com" -> "nisita"
  if (text.includes('@')) {
    text = text.split('@')[0];
  }

  // Insert space before camelCase / PascalCase capital letters: "NisitaRajput" -> "Nisita Rajput"
  text = text.replace(/([a-z])([A-Z])/g, '$1 $2');
  text = text.replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');

  // Replace dots, underscores, hyphens with spaces: "nisita.chandel" -> "nisita chandel"
  text = text.replace(/[._-]/g, ' ').trim();

  // If it's a single concatenated word (no spaces) with length >= 6, try splitting by known surnames
  if (!text.includes(' ') && text.length >= 6) {
    const lower = text.toLowerCase();
    for (const surname of COMMON_SURNAMES) {
      if (lower.endsWith(surname) && lower.length >= surname.length + 3) {
        const prefix = text.slice(0, text.length - surname.length);
        text = `${prefix} ${surname}`;
        break;
      }
    }
  }

  // Capitalize each word
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Safely resolves and formats user display name from profile data and fallback auth data.
 */
export function formatUserDisplayName(userProfileData?: any, fallbackUser?: any): string {
  if (!userProfileData && !fallbackUser) return 'User';

  const first = userProfileData?.firstName || fallbackUser?.firstName || '';
  const last = userProfileData?.lastName || fallbackUser?.lastName || '';

  const cleanFirst = (first && first !== 'undefined' && first !== 'null') ? first : '';
  const cleanLast = (last && last !== 'undefined' && last !== 'null') ? last : '';

  const constructed = `${cleanFirst} ${cleanLast}`.trim();

  if (constructed) {
    const formatted = capitalizeName(constructed);
    if (formatted) return formatted;
  }

  const altName =
    userProfileData?.name ||
    fallbackUser?.name ||
    userProfileData?.username ||
    fallbackUser?.username ||
    userProfileData?.email ||
    fallbackUser?.email ||
    '';

  const formattedAlt = capitalizeName(altName);
  return formattedAlt || 'User';
}

