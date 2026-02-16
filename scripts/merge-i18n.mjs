#!/usr/bin/env node

/**
 * Script to merge missing i18n keys from reference locale (EN) to all other locales.
 * Run with: node scripts/merge-i18n.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const localesDir = join(__dirname, '..', 'src', 'i18n', 'locales');

const REFERENCE_LOCALE = 'en';
const TARGET_LOCALES = ['pt', 'es', 'zh', 'it'];

function getAllKeys(obj, prefix = '') {
  let keys = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys = keys.concat(getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  current[keys[keys.length - 1]] = value;
}

function sortObjectKeys(obj) {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return obj;
  }
  const sorted = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    sorted[key] = sortObjectKeys(obj[key]);
  }
  return sorted;
}

function mergeLocale(reference, target) {
  const refKeys = getAllKeys(reference);
  let addedCount = 0;
  
  for (const key of refKeys) {
    const targetValue = getNestedValue(target, key);
    if (targetValue === undefined) {
      const refValue = getNestedValue(reference, key);
      setNestedValue(target, key, refValue);
      addedCount++;
    }
  }
  
  return addedCount;
}

console.log('🔄 Merging missing i18n keys from EN to all locales...\n');

// Load reference locale
const referencePath = join(localesDir, `${REFERENCE_LOCALE}.json`);
const reference = JSON.parse(readFileSync(referencePath, 'utf-8'));
const refKeyCount = getAllKeys(reference).length;

console.log(`📖 Reference locale (EN): ${refKeyCount} keys\n`);

for (const locale of TARGET_LOCALES) {
  const localePath = join(localesDir, `${locale}.json`);
  
  try {
    const target = JSON.parse(readFileSync(localePath, 'utf-8'));
    const beforeCount = getAllKeys(target).length;
    
    const addedCount = mergeLocale(reference, target);
    const afterCount = getAllKeys(target).length;
    
    // Sort keys for consistency
    const sorted = sortObjectKeys(target);
    
    // Write back
    writeFileSync(localePath, JSON.stringify(sorted, null, 2) + '\n', 'utf-8');
    
    const coverage = ((afterCount / refKeyCount) * 100).toFixed(1);
    console.log(`✅ ${locale.toUpperCase()}: Added ${addedCount} keys (${beforeCount} → ${afterCount} keys, ${coverage}% coverage)`);
  } catch (error) {
    console.error(`❌ Error processing ${locale}: ${error.message}`);
  }
}

console.log('\n✨ Done! All locales now have 100% key coverage (using EN fallbacks for missing translations).');
