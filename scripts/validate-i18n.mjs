#!/usr/bin/env node
/**
 * i18n Validation Script for Pre-commit Hook
 * 
 * Validates translation files for:
 * 1. Missing keys between languages
 * 2. Empty translations
 * 3. Coverage percentage
 * 4. Duplicate JSON keys
 * 
 * Run with: node scripts/validate-i18n.mjs
 * Exit code 0 = success, 1 = failure
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load locale files
const localesDir = join(__dirname, '../src/i18n/locales');

/**
 * Check for duplicate keys in JSON content
 * @param {string} content - Raw JSON content
 * @param {string} fileName - File name for error messages
 * @returns {Array<{key: string, count: number, lines: number[]}>}
 */
function findDuplicateKeys(content, fileName) {
  const duplicates = [];
  const lines = content.split('\n');
  const keyOccurrences = new Map();
  
  // Track nested path
  const pathStack = [];
  let currentPath = '';
  
  lines.forEach((line, lineIndex) => {
    // Match object key patterns: "key": or 'key':
    const keyMatch = line.match(/^\s*["']([^"']+)["']\s*:/);
    if (keyMatch) {
      const key = keyMatch[1];
      
      // Track opening/closing braces to understand nesting
      const openBraces = (line.match(/{/g) || []).length;
      const closeBraces = (line.match(/}/g) || []).length;
      
      // Build current path based on indentation
      const indent = line.search(/\S/);
      while (pathStack.length > 0 && pathStack[pathStack.length - 1].indent >= indent) {
        pathStack.pop();
      }
      
      const fullPath = pathStack.length > 0 
        ? `${pathStack.map(p => p.key).join('.')}.${key}` 
        : key;
      
      // Track this key
      if (!keyOccurrences.has(fullPath)) {
        keyOccurrences.set(fullPath, { count: 0, lines: [] });
      }
      const occurrence = keyOccurrences.get(fullPath);
      occurrence.count++;
      occurrence.lines.push(lineIndex + 1);
      
      // If this key opens an object, push to path stack
      if (line.includes('{') && !line.includes('}')) {
        pathStack.push({ key, indent });
      }
    }
    
    // Handle closing braces
    const closeBracesOnly = line.match(/^\s*}/);
    if (closeBracesOnly && pathStack.length > 0) {
      const indent = line.search(/\S/);
      while (pathStack.length > 0 && pathStack[pathStack.length - 1].indent >= indent) {
        pathStack.pop();
      }
    }
  });
  
  // Find keys that appear more than once
  for (const [key, data] of keyOccurrences) {
    if (data.count > 1) {
      duplicates.push({ key, count: data.count, lines: data.lines });
    }
  }
  
  return duplicates;
}

function loadLocale(name) {
  const content = readFileSync(join(localesDir, `${name}.json`), 'utf-8');
  return { parsed: JSON.parse(content), raw: content };
}

const localeNames = ['en', 'pt', 'es', 'zh', 'it'];
const locales = {};
const rawContents = {};

for (const name of localeNames) {
  const { parsed, raw } = loadLocale(name);
  locales[name] = parsed;
  rawContents[name] = raw;
}

const referenceLocale = 'en';
const targetLocales = ['pt', 'es', 'zh', 'it'];
const MAX_MISSING_PERCENTAGE = 15;

/**
 * Recursively extract all keys from a nested object
 */
function extractKeys(obj, prefix = '') {
  const keys = [];
  
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
function findEmptyValues(obj, prefix = '') {
  const emptyKeys = [];
  
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

// Main validation
console.log('\n🌐 i18n Validation\n');
console.log('─'.repeat(50));

let hasErrors = false;

// Step 1: Check for duplicate keys in all files
console.log('\n📋 Checking for duplicate keys...\n');
for (const name of localeNames) {
  const duplicates = findDuplicateKeys(rawContents[name], `${name}.json`);
  if (duplicates.length > 0) {
    console.log(`❌ ${name.toUpperCase()}.json has duplicate keys:`);
    for (const dup of duplicates) {
      console.log(`   - "${dup.key}" appears ${dup.count} times (lines: ${dup.lines.join(', ')})`);
    }
    hasErrors = true;
  } else {
    console.log(`✓ ${name.toUpperCase()}.json - no duplicates`);
  }
}

console.log('\n' + '─'.repeat(50));
console.log('\n📊 Translation Coverage\n');

const referenceKeys = extractKeys(locales[referenceLocale]);
const referenceKeySet = new Set(referenceKeys);

const results = [];

for (const locale of targetLocales) {
  const localeKeys = extractKeys(locales[locale]);
  const localeKeySet = new Set(localeKeys);
  
  const missingKeys = referenceKeys.filter(key => !localeKeySet.has(key));
  const emptyValues = findEmptyValues(locales[locale]);
  const coverage = ((referenceKeys.length - missingKeys.length) / referenceKeys.length * 100).toFixed(1);
  const missingPercentage = (missingKeys.length / referenceKeys.length * 100);
  
  const bar = '█'.repeat(Math.floor(parseFloat(coverage) / 5));
  const empty = '░'.repeat(20 - bar.length);
  
  console.log(`${locale.toUpperCase().padEnd(4)} [${bar}${empty}] ${coverage}%`);
  
  if (missingKeys.length > 0) {
    console.log(`     ⚠️  Missing ${missingKeys.length} keys`);
  }
  
  if (emptyValues.length > 0) {
    console.log(`     ❌ ${emptyValues.length} empty values found!`);
    hasErrors = true;
  }
  
  if (missingPercentage > MAX_MISSING_PERCENTAGE) {
    console.log(`     ❌ Coverage below ${100 - MAX_MISSING_PERCENTAGE}% threshold!`);
    hasErrors = true;
  }
  
  results.push({ locale, coverage, missingKeys, emptyValues });
}

console.log('\n' + '─'.repeat(50));

if (hasErrors) {
  console.log('\n❌ i18n validation FAILED!\n');
  console.log('Fix the issues above before committing.\n');
  process.exit(1);
} else {
  console.log('\n✅ i18n validation passed!\n');
  process.exit(0);
}
