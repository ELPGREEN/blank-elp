/**
 * ELP Report PDF Generator
 * Generates professional meeting reports and corporate documents
 * with QR code verification, official stamps, and justified text
 * Supports 5 languages: PT, EN, ES, IT, ZH
 */

import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { format } from 'date-fns';
import { ptBR, enUS, es, it, zhCN } from 'date-fns/locale';
import { loadLogoImage, ELP_COLORS } from './pdfBranding';
import { SITE_URLS } from './siteConfig';

// Supported languages
export type SupportedLanguage = 'pt' | 'en' | 'es' | 'it' | 'zh';

// Date locale mapping
const DATE_LOCALES = {
  pt: ptBR,
  en: enUS,
  es: es,
  it: it,
  zh: zhCN
};

// Signer interface for multiple signers
export interface PDFSigner {
  name: string;
  email: string;
  role: string;
  order: number;
  status?: 'pending' | 'signed';
}

// PDF Translations for all supported languages
const PDF_TRANSLATIONS: Record<SupportedLanguage, {
  officialDocument: string;
  approved: string;
  confidential: string;
  page: string;
  of: string;
  executiveSummary: string;
  signedDigitallyBy: string;
  signersSection: string;
  signerPending: string;
  date: string;
  scanToVerify: string;
  hash: string;
  dateFormat: string;
  dateFormatSimple: string;
}> = {
  pt: {
    officialDocument: 'DOCUMENTO OFICIAL',
    approved: 'APROVADO',
    confidential: 'Confidencial',
    page: 'Página',
    of: '/',
    executiveSummary: 'RESUMO EXECUTIVO',
    signedDigitallyBy: 'Assinado digitalmente por:',
    signersSection: 'SIGNATÁRIOS',
    signerPending: 'Pendente',
    date: 'Data',
    scanToVerify: 'Escaneie para verificar',
    hash: 'Hash',
    dateFormat: "dd 'de' MMMM 'de' yyyy",
    dateFormatSimple: 'dd/MM/yyyy'
  },
  en: {
    officialDocument: 'OFFICIAL DOCUMENT',
    approved: 'APPROVED',
    confidential: 'Confidential',
    page: 'Page',
    of: '/',
    executiveSummary: 'EXECUTIVE SUMMARY',
    signedDigitallyBy: 'Digitally signed by:',
    signersSection: 'SIGNATORIES',
    signerPending: 'Pending',
    date: 'Date',
    scanToVerify: 'Scan to verify',
    hash: 'Hash',
    dateFormat: "MMMM dd, yyyy",
    dateFormatSimple: 'MM/dd/yyyy'
  },
  es: {
    officialDocument: 'DOCUMENTO OFICIAL',
    approved: 'APROBADO',
    confidential: 'Confidencial',
    page: 'Página',
    of: '/',
    executiveSummary: 'RESUMEN EJECUTIVO',
    signedDigitallyBy: 'Firmado digitalmente por:',
    signersSection: 'FIRMANTES',
    signerPending: 'Pendiente',
    date: 'Fecha',
    scanToVerify: 'Escanear para verificar',
    hash: 'Hash',
    dateFormat: "dd 'de' MMMM 'de' yyyy",
    dateFormatSimple: 'dd/MM/yyyy'
  },
  it: {
    officialDocument: 'DOCUMENTO UFFICIALE',
    approved: 'APPROVATO',
    confidential: 'Riservato',
    page: 'Pagina',
    of: '/',
    executiveSummary: 'SINTESI ESECUTIVA',
    signedDigitallyBy: 'Firmato digitalmente da:',
    signersSection: 'FIRMATARI',
    signerPending: 'In attesa',
    date: 'Data',
    scanToVerify: 'Scansiona per verificare',
    hash: 'Hash',
    dateFormat: "dd MMMM yyyy",
    dateFormatSimple: 'dd/MM/yyyy'
  },
  zh: {
    officialDocument: '官方文件',
    approved: '已批准',
    confidential: '机密',
    page: '页码',
    of: '/',
    executiveSummary: '执行摘要',
    signedDigitallyBy: '数字签名：',
    signersSection: '签署人',
    signerPending: '待签',
    date: '日期',
    scanToVerify: '扫描验证',
    hash: '哈希',
    dateFormat: "yyyy年MM月dd日",
    dateFormatSimple: 'yyyy/MM/dd'
  }
};

interface ReportData {
  title: string;
  date: Date;
  documentNumber: string;
  signatoryName: string;
  signatoryPosition: string;
  content: string;
  includeExecutiveSummary: boolean;
  executiveSummary: string;
  language?: SupportedLanguage;
  documentId?: string; // Database document ID for QR signing link
  signers?: PDFSigner[]; // Multiple signers for sequential signature workflow
}

// Generate SHA-256 hash for document integrity
async function generateContentHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

// Generate QR Code with document signing/verification link
async function generateVerificationQR(
  documentId: string | undefined,
  docNumber: string,
  contentHash: string,
  signatoryName: string,
  timestamp: string
): Promise<string | null> {
  try {
    // If we have a documentId, use the signing URL for digital signature workflow
    // Otherwise, use a verification URL with the hash
    const verificationUrl = documentId 
      ? SITE_URLS.signDocument(documentId)
      : `https://www.elpgreen.com/sign?hash=${contentHash}`;
    
    // Encode just the URL for simple scanning - makes it easy to click
    return await QRCode.toDataURL(verificationUrl, {
      width: 150,
      margin: 1,
      color: {
        dark: '#1a2744',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H'
    });
  } catch (error) {
    console.error('QR generation error:', error);
    return null;
  }
}
// Check if text contains CJK characters
function containsCJK(text: string): boolean {
  return /[\u4e00-\u9fff\u3400-\u4dbf\u3000-\u303f\uff00-\uffef]/.test(text);
}

// Remove CJK characters from non-Chinese documents (they can't render in Helvetica)
function cleanTextForLanguage(text: string, isChinese: boolean): string {
  if (isChinese) return text;
  
  // For non-Chinese documents, remove CJK characters that would render as garbage
  // Replace with transliteration hints where possible
  return text
    .replace(/[\u4e00-\u9fff\u3400-\u4dbf]+/g, '') // Remove CJK ideographs
    .replace(/[\u3000-\u303f]/g, ' ')  // Replace CJK punctuation with spaces
    .replace(/[\uff00-\uffef]/g, '')   // Remove fullwidth forms
    .replace(/\s+/g, ' ')              // Normalize spaces
    .replace(/\(\s*\)/g, '')           // Remove empty parentheses
    .trim();
}

// Load CJK font for Chinese support
let cjkFontLoaded = false;
let cjkFontData: string | null = null;

async function loadCJKFont(): Promise<string | null> {
  if (cjkFontData) return cjkFontData;
  
  try {
    // Use a lightweight CJK font from Google Fonts CDN
    const fontUrl = 'https://fonts.gstatic.com/s/notosanssc/v36/k3kCo84MPvpLmixcA63oeAL7Iqp5IZJF9bmaG9_FnYxNbPzS5HE.ttf';
    
    const response = await fetch(fontUrl);
    if (!response.ok) {
      console.error('Failed to load CJK font:', response.status);
      return null;
    }
    
    const fontBuffer = await response.arrayBuffer();
    const fontBytes = new Uint8Array(fontBuffer);
    
    // Convert to base64
    let binary = '';
    for (let i = 0; i < fontBytes.length; i++) {
      binary += String.fromCharCode(fontBytes[i]);
    }
    cjkFontData = btoa(binary);
    
    console.log('CJK font loaded successfully');
    return cjkFontData;
  } catch (error) {
    console.error('Error loading CJK font:', error);
    return null;
  }
}

// Register CJK font with jsPDF
async function setupCJKFont(pdf: jsPDF): Promise<boolean> {
  if (cjkFontLoaded) {
    pdf.setFont('NotoSansSC', 'normal');
    return true;
  }
  
  const fontData = await loadCJKFont();
  if (!fontData) return false;
  
  try {
    pdf.addFileToVFS('NotoSansSC-Regular.ttf', fontData);
    pdf.addFont('NotoSansSC-Regular.ttf', 'NotoSansSC', 'normal');
    pdf.setFont('NotoSansSC', 'normal');
    cjkFontLoaded = true;
    return true;
  } catch (error) {
    console.error('Error registering CJK font:', error);
    return false;
  }
}

// Parse content into structured sections - improved detection
function parseContent(content: string, isChinese: boolean): { type: string; text: string }[] {
  const lines = content.split('\n');
  const sections: { type: string; text: string }[] = [];
  let lastWasEmpty = false;
  
  lines.forEach(line => {
    let trimmed = line.trim();
    if (!trimmed) {
      // Only add empty if last wasn't empty (avoid multiple consecutive empties)
      if (!lastWasEmpty) {
        sections.push({ type: 'empty', text: '' });
        lastWasEmpty = true;
      }
      return;
    }
    lastWasEmpty = false;
    
    // Clean text for non-Chinese documents (remove CJK characters that can't render)
    if (!isChinese) {
      trimmed = cleanTextForLanguage(trimmed, false);
      if (!trimmed) {
        sections.push({ type: 'empty', text: '' });
        return;
      }
    }
    
    // Sub-section headers FIRST: "3.1 Topic", "3.1.2 Subtopic", etc. (has decimal point in number)
    if (/^\d+\.\d+(\.\d+)*\.?\s/.test(trimmed)) {
      sections.push({ type: 'subtitle', text: trimmed });
    }
    // Main section headers: "1. TITLE", "2. PARTICIPANTS", etc. (single number before dot)
    else if (/^\d+\.\s+\S/.test(trimmed) && trimmed.length < 120) {
      sections.push({ type: 'title', text: trimmed });
    }
    // Checkbox items
    else if (/^☐|^\[\s?\]/.test(trimmed)) {
      sections.push({ type: 'checkbox', text: trimmed.replace(/^☐|^\[\s?\]/, '').trim() });
    }
    // Bullet points (starts with - or • or *)
    else if (/^[-•*]\s/.test(trimmed)) {
      sections.push({ type: 'list', text: trimmed.replace(/^[-•*]\s*/, '') });
    }
    // For Chinese: short lines without punctuation are titles
    else if (isChinese && trimmed.length < 40 && !trimmed.includes('。') && !trimmed.includes('，') && !trimmed.includes('、')) {
      sections.push({ type: 'title', text: trimmed });
    }
    // For Western: ALL CAPS lines (no lowercase letters) - treat as section headers
    else if (!isChinese && /^[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇÑ\s\-–0-9\.,:()&]+$/.test(trimmed) && 
             trimmed.length < 80 && 
             !/[a-záéíóúâêîôûãõçñ]/.test(trimmed) &&
             trimmed.length > 3) {
      sections.push({ type: 'title', text: trimmed.replace(/:$/, '') });
    }
    else {
      sections.push({ type: 'paragraph', text: trimmed });
    }
  });
  
  return sections;
}

// Draw justified text (both margins aligned) - for Western languages
function drawJustifiedText(
  pdf: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  isCJK: boolean = false
): number {
  // For CJK text, use simple left-aligned wrapping (no word-based justification)
  if (isCJK || containsCJK(text)) {
    const lines = pdf.splitTextToSize(text, maxWidth);
    let currentY = y;
    
    lines.forEach((line: string) => {
      pdf.text(line, x, currentY);
      currentY += lineHeight;
    });
    
    return currentY;
  }
  
  // Western text: word-based justification
  const words = text.split(' ');
  let line = '';
  let currentY = y;
  const lines: string[] = [];
  
  // First, collect all lines
  words.forEach((word, i) => {
    const testLine = line + (line ? ' ' : '') + word;
    const testWidth = pdf.getTextWidth(testLine);
    
    if (testWidth > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
    
    if (i === words.length - 1 && line) {
      lines.push(line);
    }
  });
  
  // Draw each line with justification
  lines.forEach((lineText, idx) => {
    const isLastLine = idx === lines.length - 1;
    const lineWords = lineText.split(' ');
    
    if (isLastLine || lineWords.length === 1) {
      // Last line or single word: left-align
      pdf.text(lineText, x, currentY);
    } else {
      // Justify: distribute space between words
      const textWidth = pdf.getTextWidth(lineText.replace(/ /g, ''));
      const totalSpaces = lineWords.length - 1;
      const extraSpace = (maxWidth - textWidth) / totalSpaces;
      
      let currentX = x;
      lineWords.forEach((word, wordIdx) => {
        pdf.text(word, currentX, currentY);
        if (wordIdx < lineWords.length - 1) {
          currentX += pdf.getTextWidth(word) + extraSpace;
        }
      });
    }
    currentY += lineHeight;
  });
  
  return currentY;
}

// Add official stamp/watermark (simplified without opacity for compatibility)
function addOfficialStamp(
  pdf: jsPDF,
  docNumber: string,
  timestamp: string,
  x: number,
  y: number,
  translations: typeof PDF_TRANSLATIONS['pt']
): void {
  // Draw stamp border with lighter color to simulate transparency
  pdf.setDrawColor(200, 210, 220);
  pdf.setLineWidth(0.8);
  pdf.roundedRect(x, y, 45, 22, 2, 2, 'S');
  
  // Stamp text with lighter shade
  pdf.setTextColor(180, 190, 200);
  pdf.setFontSize(6);
  pdf.setFont('helvetica', 'bold');
  pdf.text(translations.officialDocument, x + 22.5, y + 6, { align: 'center' });
  
  pdf.setFontSize(5);
  pdf.setFont('helvetica', 'normal');
  pdf.text(translations.approved, x + 22.5, y + 10, { align: 'center' });
  pdf.text(timestamp, x + 22.5, y + 14, { align: 'center' });
  pdf.text(docNumber, x + 22.5, y + 18, { align: 'center' });
}

export async function generateELPReportPDF(reportData: ReportData): Promise<void> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Professional corporate margins
  const margin = 20; // 20mm left margin
  const rightMargin = 20; // 20mm right margin
  const contentWidth = pageWidth - margin - rightMargin;
  const headerHeight = 28; // Professional header height
  const footerHeight = 15; // Professional footer height
  const maxY = pageHeight - footerHeight - 2; // Content can extend close to footer
  let yPos = headerHeight + 5;
  let pageNum = 1;
  
  // Get language and translations
  const lang: SupportedLanguage = reportData.language || 'pt';
  const translations = PDF_TRANSLATIONS[lang];
  const dateLocale = DATE_LOCALES[lang];
  const isChinese = lang === 'zh';
  
  // Setup CJK font for Chinese documents
  let useCJKFont = false;
  if (isChinese) {
    useCJKFont = await setupCJKFont(pdf);
    if (!useCJKFont) {
      console.warn('CJK font not loaded, Chinese characters may not render correctly');
    }
  }
  
  // Helper to set font based on language
  const setMainFont = (style: 'normal' | 'bold' = 'normal') => {
    if (useCJKFont) {
      pdf.setFont('NotoSansSC', 'normal'); // NotoSansSC only has normal weight
    } else {
      pdf.setFont('helvetica', style);
    }
  };
  
  // Title - keep as is, no sanitization needed
  const documentTitle = reportData.title;
  
  const { navyBlue, white, gray, darkText } = ELP_COLORS;
  const logoData = await loadLogoImage();
  
  // Generate document hash and QR code
  const timestamp = format(new Date(), translations.dateFormatSimple + ' HH:mm:ss', { locale: dateLocale });
  const contentHash = await generateContentHash(
    reportData.content + reportData.documentNumber + timestamp
  );
  const qrCodeData = await generateVerificationQR(
    reportData.documentId,
    reportData.documentNumber,
    contentHash,
    reportData.signatoryName,
    timestamp
  );
  
  // Parse content with language awareness
  const sections = parseContent(reportData.content, isChinese);
  
  // ===== DRAW HEADER (Professional Corporate Style) =====
  const drawHeader = (isFirstPage: boolean) => {
    // Clean white background
    pdf.setFillColor(white.r, white.g, white.b);
    pdf.rect(0, 0, pageWidth, headerHeight, 'F');
    
    // Navy blue top accent bar
    pdf.setFillColor(navyBlue.r, navyBlue.g, navyBlue.b);
    pdf.rect(0, 0, pageWidth, 4, 'F');
    
    // Logo - professional size
    if (logoData) {
      try {
        const logoWidth = 35;
        const logoHeight = 16;
        pdf.addImage(logoData, 'PNG', margin, 7, logoWidth, logoHeight);
      } catch (e) {
        console.error('Logo error:', e);
        pdf.setTextColor(navyBlue.r, navyBlue.g, navyBlue.b);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('ELP Green Technology', margin, 18);
      }
    } else {
      pdf.setTextColor(navyBlue.r, navyBlue.g, navyBlue.b);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('ELP Green Technology', margin, 18);
    }
    
    // Right side: Document reference block
    const rightBlockX = pageWidth - rightMargin;
    
    // Document number - prominent
    pdf.setTextColor(navyBlue.r, navyBlue.g, navyBlue.b);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text(reportData.documentNumber, rightBlockX, 12, { align: 'right' });
    
    // Date
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(gray.r, gray.g, gray.b);
    pdf.setFontSize(8);
    pdf.text(format(reportData.date, translations.dateFormatSimple, { locale: dateLocale }), rightBlockX, 18, { align: 'right' });
    
    // Website
    pdf.setFontSize(7);
    pdf.text('www.elpgreen.com', rightBlockX, 23, { align: 'right' });
    
    // Professional separator line
    pdf.setDrawColor(navyBlue.r, navyBlue.g, navyBlue.b);
    pdf.setLineWidth(0.5);
    pdf.line(margin, headerHeight, pageWidth - rightMargin, headerHeight);
  };
  
  // ===== DRAW FOOTER (Professional Corporate Style) =====
  const drawFooter = (currentPage: number, totalPages: number) => {
    pdf.setPage(currentPage);
    
    const footerY = pageHeight - footerHeight;
    
    // Professional separator line
    pdf.setDrawColor(navyBlue.r, navyBlue.g, navyBlue.b);
    pdf.setLineWidth(0.5);
    pdf.line(margin, footerY, pageWidth - rightMargin, footerY);
    
    // Left: Company info
    pdf.setTextColor(gray.r, gray.g, gray.b);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text('ELP Green Technology', margin, footerY + 6);
    pdf.setFontSize(7);
    pdf.text(translations.confidential, margin, footerY + 10);
    
    // Right: Page number - professional format
    pdf.setTextColor(navyBlue.r, navyBlue.g, navyBlue.b);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${translations.page} ${currentPage} ${translations.of} ${totalPages}`, pageWidth - rightMargin, footerY + 8, { align: 'right' });
  };
  
  // Helper function to add new page with header
  const addNewPage = () => {
    pdf.addPage();
    pageNum++;
    drawHeader(false);
    yPos = headerHeight + 6;
  };
  
  // Helper function to check page break
  const checkPageBreak = (neededHeight: number) => {
    if (yPos + neededHeight > maxY) {
      addNewPage();
    }
  };
  
  // ===== FIRST PAGE HEADER =====
  drawHeader(true);
  yPos = headerHeight + 6;
  
  // ===== TITLE + STAMP (first page only) =====
  pdf.setTextColor(navyBlue.r, navyBlue.g, navyBlue.b);
  pdf.setFontSize(12);
  setMainFont('bold');
  
  // Calculate stamp dimensions
  const stampWidth = 45;
  const stampHeight = 20;
  const stampX = pageWidth - rightMargin - stampWidth;
  const stampY = yPos;
  
  // Title with reduced width to leave space for stamp on the right
  const titleMaxWidth = stampX - margin - 4;
  // For Chinese, don't uppercase (no concept of uppercase in CJK)
  const titleText = isChinese ? documentTitle : documentTitle.toUpperCase();
  const titleLines = pdf.splitTextToSize(titleText, titleMaxWidth);
  const titleStartY = yPos;
  
  titleLines.forEach((line: string) => {
    pdf.text(line, margin, yPos);
    yPos += 5;
  });
  
  const titleEndY = yPos;
  
  // Draw stamp at the same level as title
  addOfficialStamp(pdf, reportData.documentNumber, timestamp, stampX, stampY, translations);
  
  // Calculate the maximum height between title and stamp
  const titleHeight = titleEndY - titleStartY;
  yPos = titleStartY + Math.max(titleHeight, stampHeight) + 3;
  
  // ===== CONTENT =====
  sections.forEach((section, index) => {
    if (section.type === 'empty') {
      yPos += 2; // Minimal spacing for paragraph breaks
      return;
    }
    
    checkPageBreak(10);
    
    if (section.type === 'title') {
      // === MAIN SECTION TITLE ===
      yPos += 4; // Space before main section (reduced)
      
      pdf.setTextColor(navyBlue.r, navyBlue.g, navyBlue.b);
      pdf.setFontSize(11);
      setMainFont('bold');
      
      // Display title with underline
      const displayText = isChinese ? section.text : section.text.toUpperCase();
      const textWidth = pdf.getTextWidth(displayText);
      pdf.text(displayText, margin, yPos);
      
      // Underline for visual hierarchy
      pdf.setDrawColor(navyBlue.r, navyBlue.g, navyBlue.b);
      pdf.setLineWidth(0.4);
      pdf.line(margin, yPos + 1.5, margin + Math.min(textWidth, contentWidth), yPos + 1.5);
      
      yPos += 5; // Space after title (reduced)
    }
    else if (section.type === 'subtitle') {
      // === SUB-SECTION HEADER ===
      yPos += 3; // Reduced space before subtitle
      
      pdf.setTextColor(navyBlue.r, navyBlue.g, navyBlue.b);
      pdf.setFontSize(10);
      setMainFont('bold');
      
      const lines = pdf.splitTextToSize(section.text, contentWidth - 4);
      lines.forEach((line: string) => {
        checkPageBreak(5);
        pdf.text(line, margin, yPos);
        yPos += 4;
      });
      yPos += 1; // Minimal space after subtitle
    }
    else if (section.type === 'list') {
      // === BULLET POINT ===
      pdf.setTextColor(navyBlue.r, navyBlue.g, navyBlue.b);
      pdf.setFontSize(9);
      pdf.text('•', margin + 3, yPos);
      
      pdf.setTextColor(darkText.r, darkText.g, darkText.b);
      setMainFont('normal');
      
      yPos = drawJustifiedText(pdf, section.text, margin + 8, yPos, contentWidth - 10, 3.8, isChinese);
      yPos += 1;
    }
    else if (section.type === 'checkbox') {
      // === CHECKBOX ITEM ===
      pdf.setTextColor(navyBlue.r, navyBlue.g, navyBlue.b);
      pdf.setFontSize(9);
      pdf.text('☐', margin + 3, yPos);
      
      pdf.setTextColor(darkText.r, darkText.g, darkText.b);
      setMainFont('normal');
      
      yPos = drawJustifiedText(pdf, section.text, margin + 10, yPos, contentWidth - 12, 3.8, isChinese);
      yPos += 1;
    }
    else {
      // === REGULAR PARAGRAPH ===
      pdf.setTextColor(darkText.r, darkText.g, darkText.b);
      pdf.setFontSize(9);
      setMainFont('normal');
      
      yPos = drawJustifiedText(pdf, section.text, margin, yPos, contentWidth, 3.8, isChinese);
      yPos += 2; // Compact spacing after paragraphs
    }
  });
  
  // ===== EXECUTIVE SUMMARY (At the end, before signatures) =====
  if (reportData.includeExecutiveSummary && reportData.executiveSummary) {
    yPos += 6;
    
    // Clean the summary text - remove any "Executive Summary:" prefix in all languages
    let cleanSummaryText = reportData.executiveSummary.trim();
    const summaryPrefixes = [
      'Executive Summary:',
      'EXECUTIVE SUMMARY:',
      'Resumo Executivo:',
      'RESUMO EXECUTIVO:',
      '执行摘要:',
      '执行摘要：',
      '執行摘要:',
      '執行摘要：',
      'Resumen Ejecutivo:',
      'RESUMEN EJECUTIVO:',
      'Sintesi Esecutiva:',
      'SINTESI ESECUTIVA:',
    ];
    
    for (const prefix of summaryPrefixes) {
      if (cleanSummaryText.startsWith(prefix)) {
        cleanSummaryText = cleanSummaryText.substring(prefix.length).trim();
        break;
      }
      // Also check lowercase
      if (cleanSummaryText.toLowerCase().startsWith(prefix.toLowerCase())) {
        cleanSummaryText = cleanSummaryText.substring(prefix.length).trim();
        break;
      }
    }
    
    // Calculate box height based on content - full width for text
    const summaryLines = pdf.splitTextToSize(cleanSummaryText, contentWidth - 14);
    const summaryHeight = Math.max(22, summaryLines.length * 3.8 + 16);
    
    checkPageBreak(summaryHeight + 6);
    
    // Title bar - navy blue background
    pdf.setFillColor(navyBlue.r, navyBlue.g, navyBlue.b);
    pdf.rect(margin, yPos, contentWidth, 8, 'F');
    
    // Title text - white on navy
    pdf.setTextColor(white.r, white.g, white.b);
    pdf.setFontSize(9);
    setMainFont('bold');
    pdf.text(translations.executiveSummary, margin + 5, yPos + 5.5);
    
    yPos += 8;
    
    // Content box - light gray background
    pdf.setFillColor(248, 250, 252);
    pdf.setDrawColor(navyBlue.r, navyBlue.g, navyBlue.b);
    pdf.setLineWidth(0.3);
    pdf.rect(margin, yPos, contentWidth, summaryHeight - 8, 'FD');
    
    // Left accent bar on content
    pdf.setFillColor(navyBlue.r, navyBlue.g, navyBlue.b);
    pdf.rect(margin, yPos, 3, summaryHeight - 8, 'F');
    
    // Summary text - justified, full width
    pdf.setTextColor(darkText.r, darkText.g, darkText.b);
    pdf.setFontSize(9);
    setMainFont('normal');
    
    yPos = drawJustifiedText(pdf, cleanSummaryText, margin + 7, yPos + 5, contentWidth - 14, 3.8, isChinese);
    yPos += 6;
  }
  
  // ===== SIGNATURE SECTION =====
  // Determine signers list - use signers array if provided, otherwise use single signatory
  const signersList: PDFSigner[] = reportData.signers && reportData.signers.length > 0
    ? reportData.signers
    : [{
        name: reportData.signatoryName,
        email: '',
        role: reportData.signatoryPosition,
        order: 1,
        status: 'pending'
      }];
  
  // Calculate required height for signature section
  const signatureBlockHeight = signersList.length > 1 
    ? 45 + (signersList.length * 18) // Multi-signer layout
    : 50; // Single signer layout
  
  checkPageBreak(signatureBlockHeight);
  yPos += 10;
  
  // Separator line
  pdf.setDrawColor(navyBlue.r, navyBlue.g, navyBlue.b);
  pdf.setLineWidth(0.3);
  pdf.line(margin, yPos, pageWidth - rightMargin, yPos);
  yPos += 8;
  
  // Multiple signers section
  if (signersList.length > 1) {
    // Title: "SIGNATORIES" with background
    pdf.setFillColor(248, 250, 252);
    pdf.rect(margin, yPos - 2, contentWidth, 10, 'F');
    pdf.setTextColor(navyBlue.r, navyBlue.g, navyBlue.b);
    pdf.setFontSize(9);
    setMainFont('bold');
    pdf.text(translations.signersSection, margin + 3, yPos + 4);
    yPos += 12;
    
    // Draw each signer in a professional table format
    const colWidth = (contentWidth - 60) / 2; // Leave space for QR code
    
    signersList.forEach((signer, idx) => {
      const signerY = yPos + (idx * 16);
      
      // Order number circle
      pdf.setFillColor(navyBlue.r, navyBlue.g, navyBlue.b);
      pdf.circle(margin + 4, signerY + 4, 3, 'F');
      pdf.setTextColor(white.r, white.g, white.b);
      pdf.setFontSize(7);
      setMainFont('bold');
      pdf.text(String(signer.order), margin + 4, signerY + 5.5, { align: 'center' });
      
      // Signer name
      pdf.setTextColor(navyBlue.r, navyBlue.g, navyBlue.b);
      pdf.setFontSize(9);
      setMainFont('bold');
      pdf.text(signer.name, margin + 12, signerY + 3);
      
      // Role/position
      pdf.setTextColor(gray.r, gray.g, gray.b);
      pdf.setFontSize(7);
      setMainFont('normal');
      pdf.text(signer.role || '', margin + 12, signerY + 8);
      
      // Email (if provided)
      if (signer.email) {
        pdf.setFontSize(6);
        pdf.text(signer.email, margin + 12, signerY + 12);
      }
      
      // Status badge
      const statusX = margin + colWidth + 10;
      const statusText = signer.status === 'signed' ? '✓' : translations.signerPending;
      const statusColor = signer.status === 'signed' ? { r: 34, g: 139, b: 34 } : { r: 200, g: 150, b: 50 };
      
      pdf.setFillColor(statusColor.r, statusColor.g, statusColor.b);
      pdf.roundedRect(statusX, signerY, 18, 6, 1, 1, 'F');
      pdf.setTextColor(white.r, white.g, white.b);
      pdf.setFontSize(6);
      setMainFont('bold');
      pdf.text(statusText, statusX + 9, signerY + 4, { align: 'center' });
      
      // Signature line for each signer
      pdf.setDrawColor(gray.r, gray.g, gray.b);
      pdf.setLineWidth(0.1);
      pdf.line(margin + 12, signerY + 14, margin + 70, signerY + 14);
    });
    
    yPos += (signersList.length * 16) + 5;
    
    // Date
    pdf.setTextColor(darkText.r, darkText.g, darkText.b);
    pdf.setFontSize(8);
    setMainFont('normal');
    pdf.text(`${translations.date}: ${format(reportData.date, translations.dateFormatSimple, { locale: dateLocale })}`, margin, yPos);
    
    // QR Code on the right (for multi-signer)
    if (qrCodeData) {
      try {
        const qrY = yPos - (signersList.length * 16) - 5;
        pdf.addImage(qrCodeData, 'PNG', pageWidth - rightMargin - 32, qrY, 30, 30);
        
        pdf.setTextColor(gray.r, gray.g, gray.b);
        pdf.setFontSize(5);
        pdf.text(translations.scanToVerify, pageWidth - rightMargin - 17, qrY + 32, { align: 'center' });
        pdf.text(`${translations.hash}: ${contentHash}`, pageWidth - rightMargin - 17, qrY + 35, { align: 'center' });
      } catch {
        // Skip QR if failed
      }
    }
  } else {
    // Single signer layout (original)
    pdf.setTextColor(darkText.r, darkText.g, darkText.b);
    pdf.setFontSize(8);
    setMainFont('normal');
    pdf.text(translations.signedDigitallyBy, margin, yPos);
    yPos += 6;
    
    // Signature line
    pdf.setDrawColor(gray.r, gray.g, gray.b);
    pdf.setLineWidth(0.2);
    pdf.line(margin, yPos + 12, margin + 65, yPos + 12);
    
    // Signatory info
    pdf.setTextColor(navyBlue.r, navyBlue.g, navyBlue.b);
    pdf.setFontSize(10);
    setMainFont('bold');
    pdf.text(reportData.signatoryName, margin, yPos + 18);
    
    pdf.setTextColor(gray.r, gray.g, gray.b);
    pdf.setFontSize(8);
    setMainFont('normal');
    pdf.text(reportData.signatoryPosition, margin, yPos + 23);
    pdf.text(`${translations.date}: ${format(reportData.date, translations.dateFormatSimple, { locale: dateLocale })}`, margin, yPos + 28);
    
    // QR Code
    if (qrCodeData) {
      try {
        pdf.addImage(qrCodeData, 'PNG', pageWidth - rightMargin - 30, yPos - 2, 30, 30);
        
        pdf.setTextColor(gray.r, gray.g, gray.b);
        pdf.setFontSize(5);
        pdf.text(translations.scanToVerify, pageWidth - rightMargin - 15, yPos + 30, { align: 'center' });
        pdf.text(`${translations.hash}: ${contentHash}`, pageWidth - rightMargin - 15, yPos + 33, { align: 'center' });
      } catch {
        // Skip QR if failed
      }
    }
  }
  
  // ===== ADD FOOTERS TO ALL PAGES =====
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    drawFooter(i, totalPages);
  }
  
  // ===== ADD HEADERS TO CONTINUATION PAGES =====
  // Headers are already drawn when addNewPage() is called
  
  // Save PDF
  const fileName = `Relatorio_ELP_${format(reportData.date, 'yyyyMMdd')}_${reportData.documentNumber.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
  pdf.save(fileName);
}
