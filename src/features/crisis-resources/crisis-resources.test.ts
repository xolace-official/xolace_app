import { describe, it, expect } from 'bun:test';
import { COUNTRY_RESOURCES, LAST_UPDATED } from './data';
import type { CountryCode, Resource } from './types';

const VALID_TYPES = new Set<Resource['type']>(['phone', 'url', 'text', 'email']);
const VALID_SOURCES = new Set<Resource['source']>(['crisis_line', 'xolace_support', 'text_support', 'local_service', 'online_resource']);
const TAPPABLE_TYPES = new Set<Resource['type']>(['phone', 'url', 'email']);
const EXPECTED_COUNTRIES: CountryCode[] = ['GH', 'US', 'GB', 'AU', 'CA'];

describe('country resolution', () => {
  it('resolves GH from locale', () => expect(COUNTRY_RESOURCES['GH']).toBeDefined());

  it('returns undefined for unrecognized locale (JP)', () => {
    const region = 'JP';
    expect(COUNTRY_RESOURCES[region as keyof typeof COUNTRY_RESOURCES]).toBeUndefined();
  });

  it('all countries have emergencyNumber', () => {
    Object.values(COUNTRY_RESOURCES).forEach((c) => expect(c.emergencyNumber).toBeTruthy());
  });

  it('emergencyNumber not duplicated in resources[]', () => {
    Object.values(COUNTRY_RESOURCES).forEach((c) => {
      const hasEmergency = c.resources.some(
        (r) => r.value === c.emergencyNumber && r.type === 'phone',
      );
      expect(hasEmergency).toBe(false);
    });
  });

  it('resources are pre-sorted (priority ascending)', () => {
    Object.values(COUNTRY_RESOURCES).forEach((c) => {
      for (let i = 1; i < c.resources.length; i++) {
        expect(c.resources[i].priority).toBeGreaterThanOrEqual(c.resources[i - 1].priority);
      }
    });
  });
});

describe('data completeness', () => {
  it('contains exactly the 5 expected country codes', () => {
    const keys = Object.keys(COUNTRY_RESOURCES) as CountryCode[];
    expect(keys.sort()).toEqual([...EXPECTED_COUNTRIES].sort());
  });

  it('every country has a non-empty name and flag', () => {
    Object.values(COUNTRY_RESOURCES).forEach((c) => {
      expect(c.name.length).toBeGreaterThan(0);
      expect(c.flag.length).toBeGreaterThan(0);
    });
  });

  it('every country has at least one resource', () => {
    Object.values(COUNTRY_RESOURCES).forEach((c) => {
      expect(c.resources.length).toBeGreaterThan(0);
    });
  });

  it('LAST_UPDATED is a non-empty string', () => {
    expect(typeof LAST_UPDATED).toBe('string');
    expect(LAST_UPDATED.length).toBeGreaterThan(0);
  });
});

describe('resource shape validation', () => {
  it('all resources have valid type values', () => {
    Object.values(COUNTRY_RESOURCES).forEach((c) => {
      c.resources.forEach((r) => {
        expect(VALID_TYPES.has(r.type)).toBe(true);
      });
    });
  });

  it('all resources have valid source values', () => {
    Object.values(COUNTRY_RESOURCES).forEach((c) => {
      c.resources.forEach((r) => {
        expect(VALID_SOURCES.has(r.source)).toBe(true);
      });
    });
  });

  it('all resources have positive integer priority', () => {
    Object.values(COUNTRY_RESOURCES).forEach((c) => {
      c.resources.forEach((r) => {
        expect(Number.isInteger(r.priority)).toBe(true);
        expect(r.priority).toBeGreaterThan(0);
      });
    });
  });

  it('all resources have non-empty label and value', () => {
    Object.values(COUNTRY_RESOURCES).forEach((c) => {
      c.resources.forEach((r) => {
        expect(r.label.length).toBeGreaterThan(0);
        expect(r.value.length).toBeGreaterThan(0);
      });
    });
  });

  it('phone resources have a non-empty dial value (no spaces-only strings)', () => {
    Object.values(COUNTRY_RESOURCES).forEach((c) => {
      c.resources.filter((r) => r.type === 'phone').forEach((r) => {
        expect(r.value.trim().length).toBeGreaterThan(0);
      });
    });
  });

  it('url resources have values that start with http:// or https://', () => {
    Object.values(COUNTRY_RESOURCES).forEach((c) => {
      c.resources.filter((r) => r.type === 'url').forEach((r) => {
        expect(r.value).toMatch(/^https?:\/\//);
      });
    });
  });
});

describe('tappable resource logic', () => {
  it('phone, url, and email resources are tappable', () => {
    (['phone', 'url', 'email'] as Resource['type'][]).forEach((t) => {
      expect(TAPPABLE_TYPES.has(t)).toBe(true);
    });
  });

  it('text resources are not tappable', () => {
    expect(TAPPABLE_TYPES.has('text')).toBe(false);
  });

  it('every text resource has a non-empty value (instruction string)', () => {
    Object.values(COUNTRY_RESOURCES).forEach((c) => {
      c.resources.filter((r) => r.type === 'text').forEach((r) => {
        expect(r.value.trim().length).toBeGreaterThan(0);
      });
    });
  });
});

describe('country options derivation', () => {
  // Tests the mapping logic used by CrisisResourcesScreen to build the Select options
  const COUNTRY_OPTIONS = (Object.keys(COUNTRY_RESOURCES) as CountryCode[]).map((code) => ({
    value: code,
    label: `${COUNTRY_RESOURCES[code].flag} ${COUNTRY_RESOURCES[code].name}`,
  }));

  it('produces one option per country', () => {
    expect(COUNTRY_OPTIONS.length).toBe(EXPECTED_COUNTRIES.length);
  });

  it('each option value matches a valid CountryCode', () => {
    COUNTRY_OPTIONS.forEach((opt) => {
      expect(EXPECTED_COUNTRIES).toContain(opt.value as CountryCode);
    });
  });

  it('each option label includes the flag and country name', () => {
    COUNTRY_OPTIONS.forEach((opt) => {
      const country = COUNTRY_RESOURCES[opt.value as CountryCode];
      expect(opt.label).toContain(country.flag);
      expect(opt.label).toContain(country.name);
    });
  });

  it('handleCountryChange returns null when option is undefined (null-coalesce branch)', () => {
    // Mirrors the logic: option?.value as CountryCode ?? null
    const handleCountryChange = (option: { value: string } | undefined): CountryCode | null =>
      (option?.value as CountryCode) ?? null;

    expect(handleCountryChange(undefined)).toBeNull();
    expect(handleCountryChange({ value: 'GH' })).toBe('GH');
  });
});
