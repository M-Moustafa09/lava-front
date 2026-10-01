/** Flag emoji for an ISO 3166-1 alpha-2 country code ("EG" → 🇪🇬); a globe when the code is unknown. */
export function getCountryFlag(code?: string | null): string {
  const iso = (code || '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(iso)) return '🌐';
  return String.fromCodePoint(...[...iso].map(c => 0x1f1e6 + c.charCodeAt(0) - 65));
}
