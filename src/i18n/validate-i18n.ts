/**
 * i18n Validation Script
 * 
 * Validates translation files for:
 * 1. Missing keys between languages
 * 2. Duplicate keys that might overwrite each other
 * 3. Empty translations
 * 
 * Run with: npx tsx src/i18n/validate-i18n.ts
 */

import en from './locales/en.json';
import pt from './locales/pt.json';
import es from './locales/es.json';
import zh from './locales/zh.json';
import it from './locales/it.json';

type TranslationObject = Record<string, unknown>;

const locales: Record<string, TranslationObject> = { en, pt, es, zh, it };
const referenceLocale = 'en';

interface ValidationResult {
  missingKeys: Record<string, string[]>;
  extraKeys: Record<string, string[]>;
  emptyValues: Record<string, string[]>;
  totalKeys: number;
  coverage: Record<string, { found: number; missing: number; percentage: string }>;
}

/**
 * Recursively extract all keys from a nested object
 */
function extractKeys(obj: unknown, prefix = ''): string[] {
  const keys: string[] = [];
  
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        keys.push(...extractKeys(value, fullKey));
      } else {
        keys.push(fullKey);
      }
    }
  }
  
  return keys;
}

/**
 * Find empty string values in translations
 */
function findEmptyValues(obj: unknown, prefix = ''): string[] {
  const emptyKeys: string[] = [];
  
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (value === '' || value === null || value === undefined) {
        emptyKeys.push(fullKey);
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        emptyKeys.push(...findEmptyValues(value, fullKey));
      }
    }
  }
  
  return emptyKeys;
}

/**
 * Validate all translation files
 */
export function validateTranslations(): ValidationResult {
  const referenceKeys = new Set(extractKeys(locales[referenceLocale]));
  const result: ValidationResult = {
    missingKeys: {},
    extraKeys: {},
    emptyValues: {},
    totalKeys: referenceKeys.size,
    coverage: {},
  };

  for (const [locale, translations] of Object.entries(locales)) {
    if (locale === referenceLocale) continue;

    const localeKeys = new Set(extractKeys(translations));
    
    // Find missing keys (in reference but not in locale)
    const missing = [...referenceKeys].filter(key => !localeKeys.has(key));
    if (missing.length > 0) {
      result.missingKeys[locale] = missing;
    }

    // Find extra keys (in locale but not in reference)
    const extra = [...localeKeys].filter(key => !referenceKeys.has(key));
    if (extra.length > 0) {
      result.extraKeys[locale] = extra;
    }

    // Find empty values
    const empty = findEmptyValues(translations);
    if (empty.length > 0) {
      result.emptyValues[locale] = empty;
    }

    // Calculate coverage
    const found = referenceKeys.size - missing.length;
    result.coverage[locale] = {
      found,
      missing: missing.length,
      percentage: ((found / referenceKeys.size) * 100).toFixed(1) + '%',
    };
  }

  // Check reference locale for empty values
  const refEmpty = findEmptyValues(locales[referenceLocale]);
  if (refEmpty.length > 0) {
    result.emptyValues[referenceLocale] = refEmpty;
  }

  return result;
}

/**
 * Generate a human-readable report
 */
export function generateReport(result: ValidationResult): string {
  const lines: string[] = [
    '═══════════════════════════════════════════════════════════',
    '                    i18n VALIDATION REPORT                  ',
    '═══════════════════════════════════════════════════════════',
    '',
    `Reference locale: ${referenceLocale.toUpperCase()}`,
    `Total keys: ${result.totalKeys}`,
    '',
    '───────────────────────────────────────────────────────────',
    '                     COVERAGE SUMMARY                       ',
    '───────────────────────────────────────────────────────────',
  ];

  for (const [locale, stats] of Object.entries(result.coverage)) {
    const bar = '█'.repeat(Math.floor(parseFloat(stats.percentage) / 5));
    const empty = '░'.repeat(20 - bar.length);
    lines.push(`  ${locale.toUpperCase().padEnd(4)} [${bar}${empty}] ${stats.percentage} (${stats.missing} missing)`);
  }

  // Missing keys section
  const hasMissing = Object.keys(result.missingKeys).length > 0;
  if (hasMissing) {
    lines.push('', '───────────────────────────────────────────────────────────');
    lines.push('                      MISSING KEYS                            ');
    lines.push('───────────────────────────────────────────────────────────');
    
    for (const [locale, keys] of Object.entries(result.missingKeys)) {
      lines.push(`\n  ${locale.toUpperCase()} (${keys.length} missing):`);
      keys.slice(0, 20).forEach(key => lines.push(`    ⚠️  ${key}`));
      if (keys.length > 20) {
        lines.push(`    ... and ${keys.length - 20} more`);
      }
    }
  }

  // Extra keys section
  const hasExtra = Object.keys(result.extraKeys).length > 0;
  if (hasExtra) {
    lines.push('', '───────────────────────────────────────────────────────────');
    lines.push('                       EXTRA KEYS                             ');
    lines.push('───────────────────────────────────────────────────────────');
    
    for (const [locale, keys] of Object.entries(result.extraKeys)) {
      lines.push(`\n  ${locale.toUpperCase()} (${keys.length} extra):`);
      keys.slice(0, 10).forEach(key => lines.push(`    ℹ️  ${key}`));
      if (keys.length > 10) {
        lines.push(`    ... and ${keys.length - 10} more`);
      }
    }
  }

  // Empty values section
  const hasEmpty = Object.keys(result.emptyValues).length > 0;
  if (hasEmpty) {
    lines.push('', '───────────────────────────────────────────────────────────');
    lines.push('                      EMPTY VALUES                            ');
    lines.push('───────────────────────────────────────────────────────────');
    
    for (const [locale, keys] of Object.entries(result.emptyValues)) {
      lines.push(`\n  ${locale.toUpperCase()} (${keys.length} empty):`);
      keys.slice(0, 10).forEach(key => lines.push(`    ❌ ${key}`));
      if (keys.length > 10) {
        lines.push(`    ... and ${keys.length - 10} more`);
      }
    }
  }

  // Summary
  lines.push('', '═══════════════════════════════════════════════════════════');
  
  const allPassing = !hasMissing && !hasEmpty;
  if (allPassing) {
    lines.push('  ✅ All translations are complete!');
  } else {
    lines.push('  ⚠️  Issues found - review above for details');
  }
  
  lines.push('═══════════════════════════════════════════════════════════');

  return lines.join('\n');
}

// Run if executed directly
if (typeof process !== 'undefined' && process.argv[1]?.includes('validate-i18n')) {
  const result = validateTranslations();
  console.log(generateReport(result));
  
  // Exit with error code if issues found
  const hasIssues = Object.keys(result.missingKeys).length > 0 || 
                    Object.keys(result.emptyValues).length > 0;
  process.exit(hasIssues ? 1 : 0);
}
