import intlTelInput from 'intl-tel-input';

type IntlTelCountry = ReturnType<typeof intlTelInput.getCountryData>[number];

/**
 * intl-tel-input v26 lazy-loads country *names* only after DOM initialization,
 * so getCountryData()[n].name is "" at import time.  The iso2 codes, however,
 * are always present.  We use the browser-native Intl.DisplayNames API to
 * resolve human-readable country names from those codes – no hardcoding needed.
 */
const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });

function resolveCountryName(country: IntlTelCountry): string {
  // 1. If the library already populated the name, use it.
  if (country.name) {
    return country.name;
  }
  // 2. Otherwise derive it from the iso2 code via the browser API.
  try {
    return displayNames.of(country.iso2.toUpperCase()) ?? country.iso2.toUpperCase();
  } catch {
    return country.iso2.toUpperCase();
  }
}

interface CountryEntry {
  iso2: string;
  name: string;
  flag: string;
}

/**
 * Convert an ISO 3166-1 alpha-2 code to a flag emoji.
 * Works by mapping each letter to its regional indicator symbol.
 */
export function isoToFlag(iso2: string): string {
  const code = iso2.toUpperCase();
  if (code.length !== 2) return '';
  return String.fromCodePoint(
    ...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
  );
}

const COUNTRY_DATA: CountryEntry[] = intlTelInput
  .getCountryData()
  .map((c) => ({
    iso2: c.iso2.toLowerCase(),
    name: resolveCountryName(c),
    flag: isoToFlag(c.iso2),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

const COUNTRY_INDEX = new Map(
  COUNTRY_DATA.flatMap((c) => [
    [c.iso2, c.name],
    [c.name.toLowerCase(), c.name],
  ]),
);

const COUNTRY_ISO2_INDEX = new Map(
  COUNTRY_DATA.flatMap((c) => [
    [c.iso2, c.iso2],
    [c.name.toLowerCase(), c.iso2],
  ]),
);

/** Full country list with iso2, name, and flag emoji */
export const COUNTRY_LIST: ReadonlyArray<CountryEntry> = COUNTRY_DATA;

export const COUNTRY_NAMES = COUNTRY_DATA.map((c) => c.name);

export function normalizeCountryName(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  const trimmed = value.trim();
  return COUNTRY_INDEX.get(trimmed.toLowerCase()) ?? trimmed;
}

export function normalizeCountryIso2(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  return COUNTRY_ISO2_INDEX.get(value.trim().toLowerCase()) ?? '';
}
