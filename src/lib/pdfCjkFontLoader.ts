/**
 * CJK Font Loader for jsPDF
 * Loads Noto Sans SC font for Chinese character support
 */

// Font loading state
let cachedCjkFont: string | null = null;
let isLoading = false;
let loadPromise: Promise<string | null> | null = null;

/**
 * Check if text contains CJK (Chinese, Japanese, Korean) characters
 */
export function containsCJK(text: string): boolean {
  // CJK Unified Ideographs and common ranges
  const cjkRegex = /[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\uFF00-\uFFEF]/;
  return cjkRegex.test(text);
}

/**
 * Load CJK font from Google Fonts CDN
 * Uses Noto Sans SC (Simplified Chinese) which covers most CJK characters
 * Returns base64 encoded font data
 */
export async function loadCJKFont(): Promise<string | null> {
  if (cachedCjkFont) return cachedCjkFont;
  if (loadPromise) return loadPromise;
  
  isLoading = true;
  
  loadPromise = (async () => {
    try {
      // Noto Sans SC Regular from Google Fonts - supports Chinese characters
      // Using a subset font for smaller file size
      const fontUrl = 'https://fonts.gstatic.com/s/notosanssc/v37/k3kCo84MPvpLmixcA63oeAL7Iqp5IZJF9bmaGw.otf';
      
      const response = await fetch(fontUrl, {
        mode: 'cors',
        cache: 'force-cache'
      });
      
      if (!response.ok) {
        console.warn('Failed to load CJK font from CDN, status:', response.status);
        return null;
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const base64 = arrayBufferToBase64(arrayBuffer);
      cachedCjkFont = base64;
      console.log('CJK font loaded successfully, size:', base64.length);
      return base64;
    } catch (error) {
      console.error('Error loading CJK font:', error);
      return null;
    } finally {
      isLoading = false;
    }
  })();
  
  return loadPromise;
}

/**
 * Convert ArrayBuffer to Base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Register CJK font with jsPDF instance
 */
export function registerCJKFont(doc: import('jspdf').jsPDF, fontData: string): boolean {
  try {
    doc.addFileToVFS('NotoSansSC-Regular.otf', fontData);
    doc.addFont('NotoSansSC-Regular.otf', 'NotoSansSC', 'normal');
    // Also register as bold (CJK fonts typically don't have bold variant, use normal)
    doc.addFont('NotoSansSC-Regular.otf', 'NotoSansSC', 'bold');
    return true;
  } catch (error) {
    console.error('Error registering CJK font:', error);
    return false;
  }
}

/**
 * Set the appropriate font for the given language
 * Falls back to helvetica for non-CJK languages or when CJK font is not available
 */
export function setFontForLanguage(
  doc: import('jspdf').jsPDF, 
  lang: string, 
  style: 'normal' | 'bold' = 'normal',
  hasCjkFont: boolean = false
): void {
  if (lang === 'zh' && hasCjkFont) {
    // CJK font doesn't have true bold, use normal for both
    doc.setFont('NotoSansSC', 'normal');
  } else {
    doc.setFont('helvetica', style);
  }
}

/**
 * Get font name for the given language
 */
export function getFontForLanguage(lang: string, hasCjkFont: boolean = false): string {
  if (lang === 'zh' && hasCjkFont) {
    return 'NotoSansSC';
  }
  return 'helvetica';
}

/**
 * Create a helper function bound to specific language and font state
 * This is used inside the PDF generator for consistent font handling
 */
export function createFontHelper(
  doc: import('jspdf').jsPDF,
  lang: string,
  hasCjkFont: boolean
): (style?: 'normal' | 'bold') => void {
  return (style: 'normal' | 'bold' = 'normal') => {
    setFontForLanguage(doc, lang, style, hasCjkFont);
  };
}
