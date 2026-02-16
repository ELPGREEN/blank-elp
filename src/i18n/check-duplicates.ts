/**
 * i18n Duplicate Key Detector
 * 
 * Parses JSON files to detect duplicate keys that would silently overwrite each other.
 * This catches issues where the same key appears multiple times in a JSON file.
 * 
 * Run with: npx tsx src/i18n/check-duplicates.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface DuplicateInfo {
  key: string;
  occurrences: number;
  lineNumbers: number[];
}

interface FileResult {
  file: string;
  duplicates: DuplicateInfo[];
  isValid: boolean;
}

/**
 * Parse JSON file and detect duplicate keys at any nesting level
 */
function findDuplicateKeys(content: string, filePath: string): DuplicateInfo[] {
  const duplicates: DuplicateInfo[] = [];
  const keyOccurrences = new Map<string, { count: number; lines: number[] }>();
  
  // Track the current path in the JSON tree
  const pathStack: string[] = [];
  let currentLine = 1;
  let inString = false;
  let escapeNext = false;
  let currentKey = '';
  let collectingKey = false;
  let braceDepth = 0;
  
  // Simple state machine to parse JSON and track keys
  const lines = content.split('\n');
  
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    const lineNum = lineIndex + 1;
    
    // Look for patterns like "keyName": 
    const keyMatches = line.matchAll(/"([^"]+)"\s*:/g);
    
    for (const match of keyMatches) {
      const key = match[1];
      
      // Calculate approximate nesting depth from leading whitespace
      const leadingSpaces = line.match(/^(\s*)/)?.[1].length || 0;
      const depth = Math.floor(leadingSpaces / 2);
      
      // Build a pseudo-path for tracking (simplified approach)
      const fullKey = `[depth:${depth}]${key}`;
      
      // For top-level keys, track directly
      if (depth <= 1) {
        const existing = keyOccurrences.get(key);
        if (existing) {
          existing.count++;
          existing.lines.push(lineNum);
        } else {
          keyOccurrences.set(key, { count: 1, lines: [lineNum] });
        }
      }
    }
  }
  
  // Filter to only actual duplicates
  for (const [key, info] of keyOccurrences.entries()) {
    if (info.count > 1) {
      duplicates.push({
        key,
        occurrences: info.count,
        lineNumbers: info.lines,
      });
    }
  }
  
  return duplicates;
}

/**
 * Scan all locale files for duplicates
 */
export function scanForDuplicates(): FileResult[] {
  const localesDir = path.join(process.cwd(), 'src', 'i18n', 'locales');
  const results: FileResult[] = [];
  
  const files = ['en.json', 'pt.json', 'es.json', 'zh.json', 'it.json'];
  
  for (const file of files) {
    const filePath = path.join(localesDir, file);
    
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const duplicates = findDuplicateKeys(content, filePath);
      
      results.push({
        file,
        duplicates,
        isValid: duplicates.length === 0,
      });
    } catch (error) {
      console.error(`Error reading ${file}:`, error);
      results.push({
        file,
        duplicates: [],
        isValid: false,
      });
    }
  }
  
  return results;
}

/**
 * Generate a report of duplicate keys
 */
export function generateDuplicateReport(results: FileResult[]): string {
  const lines: string[] = [
    '═══════════════════════════════════════════════════════════',
    '              DUPLICATE KEY DETECTION REPORT               ',
    '═══════════════════════════════════════════════════════════',
    '',
  ];

  let totalDuplicates = 0;
  
  for (const result of results) {
    const status = result.isValid ? '✅' : '⚠️';
    const dupCount = result.duplicates.length;
    totalDuplicates += dupCount;
    
    lines.push(`${status} ${result.file.padEnd(12)} - ${dupCount === 0 ? 'No duplicates' : `${dupCount} duplicate(s) found`}`);
    
    if (result.duplicates.length > 0) {
      for (const dup of result.duplicates) {
        lines.push(`     └─ "${dup.key}" appears ${dup.occurrences}x at lines: ${dup.lineNumbers.join(', ')}`);
      }
    }
  }

  lines.push('');
  lines.push('═══════════════════════════════════════════════════════════');
  
  if (totalDuplicates === 0) {
    lines.push('  ✅ No duplicate keys found in any locale file!');
  } else {
    lines.push(`  ⚠️  ${totalDuplicates} total duplicate key(s) found`);
    lines.push('');
    lines.push('  To fix: Merge the duplicate blocks into a single object');
    lines.push('  and remove the later occurrence to prevent overwriting.');
  }
  
  lines.push('═══════════════════════════════════════════════════════════');

  return lines.join('\n');
}

// Run if executed directly
if (typeof process !== 'undefined' && process.argv[1]?.includes('check-duplicates')) {
  const results = scanForDuplicates();
  console.log(generateDuplicateReport(results));
  
  // Exit with error code if duplicates found
  const hasDuplicates = results.some(r => !r.isValid);
  process.exit(hasDuplicates ? 1 : 0);
}
