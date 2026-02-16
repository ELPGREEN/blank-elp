/**
 * ELP PDF Branding Utilities
 * Shared styling for all PDF generation across the platform
 * Uses Navy Blue (#1a2744) as primary brand color
 * 
 * Architecture Standards:
 * - Headers: 28mm height (navy accent bar + 0.5mm line)
 * - Footers: 15mm height
 * - Content area: 275mm max Y position
 * - Margins: 15-20mm standard
 * - Typography: 11pt Bold Navy titles, 10pt subtitles, 9pt body
 */

import jsPDF from 'jspdf';
import logoElp from '@/assets/logo-elp-new.png';

// Re-export design tokens for unified access
export { PDF_DESIGN_TOKENS } from './pdfTableSystem';

// ELP Brand Colors - Navy Blue from logo (#1a2744)
export const ELP_COLORS = {
  navyBlue: { r: 26, g: 39, b: 68 },      // #1a2744 - Primary
  navyLight: { r: 45, g: 65, b: 110 },    // #2d416e - Secondary
  navyDark: { r: 18, g: 28, b: 48 },      // #121c30 - Darker shade
  white: { r: 255, g: 255, b: 255 },
  gray: { r: 100, g: 100, b: 100 },
  lightGray: { r: 245, g: 245, b: 245 },
  lightGray2: { r: 248, g: 250, b: 252 }, // #f8fafc - Background cards
  darkText: { r: 40, g: 40, b: 40 },
  mediumText: { r: 80, g: 80, b: 80 },
  success: { r: 34, g: 139, b: 34 },      // Green for success states
  warning: { r: 220, g: 165, b: 0 },      // Amber for warnings
  danger: { r: 220, g: 53, b: 69 },       // Red for errors/negative
  accent: { r: 0, g: 102, b: 204 },       // Blue accent #0066cc
};

// Typography Standards
export const ELP_TYPOGRAPHY = {
  fontFamily: 'helvetica',
  sizes: {
    title: 16,           // Main page titles
    sectionTitle: 12,    // Section headers
    subsection: 11,      // Subsection headers
    body: 9,             // Body text
    small: 8,            // Small labels
    tiny: 7,             // Footnotes, legal
    micro: 6,            // Watermarks, fine print
  },
  lineHeight: {
    tight: 3.5,          // Compact tables
    normal: 4.2,         // Standard body text
    relaxed: 5,          // Headers, titles
    loose: 6,            // Spacious layouts
  },
};

// Layout Constants
export const ELP_LAYOUT = {
  margin: 15,            // Standard page margin
  headerHeight: 28,      // Header area height
  footerHeight: 15,      // Footer area height
  contentMaxY: 275,      // Maximum Y before footer
  sectionGap: 8,         // Gap between sections
  paragraphGap: 4,       // Gap between paragraphs
};

export interface PDFBrandingOptions {
  subtitle?: string;
  showWebsite?: boolean;
  showSlogan?: boolean;
}

// Load logo image as base64
let cachedLogoData: string | null = null;

export async function loadLogoImage(): Promise<string | null> {
  if (cachedLogoData) return cachedLogoData;
  
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          cachedLogoData = canvas.toDataURL('image/png');
          resolve(cachedLogoData);
        } else {
          resolve(null);
        }
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = logoElp;
  });
}

/**
 * Add branded header to PDF page - WHITE BACKGROUND with logo
 */
export function addBrandedHeader(
  pdf: jsPDF, 
  logoData: string | null,
  options: PDFBrandingOptions = {}
): void {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  const { navyBlue, white } = ELP_COLORS;
  const { subtitle = 'ELP Green Technology', showWebsite = true } = options;

  // WHITE header background
  pdf.setFillColor(white.r, white.g, white.b);
  pdf.rect(0, 0, pageWidth, 25, 'F');
  
  // Navy blue accent line at bottom of header
  pdf.setFillColor(navyBlue.r, navyBlue.g, navyBlue.b);
  pdf.rect(0, 23, pageWidth, 2, 'F');

  // Add logo if available
  if (logoData) {
    try {
      pdf.addImage(logoData, 'PNG', margin - 5, 3, 40, 18);
    } catch {
      // Fallback to text
      pdf.setTextColor(navyBlue.r, navyBlue.g, navyBlue.b);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('ELP Green Technology', margin, 14);
    }
  } else {
    pdf.setTextColor(navyBlue.r, navyBlue.g, navyBlue.b);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ELP Green Technology', margin, 14);
  }

  // Right side header text - Navy Blue on white
  pdf.setTextColor(navyBlue.r, navyBlue.g, navyBlue.b);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text(subtitle, pageWidth - margin, 10, { align: 'right' });
  
  if (showWebsite) {
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text('www.elpgreen.com', pageWidth - margin, 16, { align: 'right' });
  }
}

/**
 * Add branded footer to PDF page
 */
export function addBrandedFooter(
  pdf: jsPDF, 
  pageNum: number, 
  totalPages: number,
  options: PDFBrandingOptions = {}
): void {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const { navyBlue, gray } = ELP_COLORS;
  const { showSlogan = true } = options;

  // Footer line
  pdf.setDrawColor(navyBlue.r, navyBlue.g, navyBlue.b);
  pdf.setLineWidth(0.5);
  pdf.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);

  // Footer text - left
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(gray.r, gray.g, gray.b);
  pdf.text('ELP Green Technology | Departamento de Inteligência Empresarial', margin, pageHeight - 12);
  
  if (showSlogan) {
    pdf.text('Transformando resíduos em recursos sustentáveis', margin, pageHeight - 8);
  }

  // Footer text - right (pagination)
  pdf.setTextColor(navyBlue.r, navyBlue.g, navyBlue.b);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Página ${pageNum}/${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
}

/**
 * Add header and footer to all pages of PDF
 */
export async function applyBrandingToAllPages(
  pdf: jsPDF,
  options: PDFBrandingOptions = {}
): Promise<void> {
  const logoData = await loadLogoImage();
  const pageCount = pdf.getNumberOfPages();
  
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    addBrandedHeader(pdf, logoData, options);
    addBrandedFooter(pdf, i, pageCount, options);
  }
}

/**
 * Create a new PDF with ELP branding preset
 */
export function createBrandedPDF(): jsPDF {
  return new jsPDF('p', 'mm', 'a4');
}

/**
 * Set text color using ELP brand colors
 */
export function setNavyText(pdf: jsPDF, variant: 'primary' | 'light' | 'dark' = 'primary'): void {
  const colorMap = {
    primary: ELP_COLORS.navyBlue,
    light: ELP_COLORS.navyLight,
    dark: ELP_COLORS.navyDark,
  };
  const color = colorMap[variant];
  pdf.setTextColor(color.r, color.g, color.b);
}

/**
 * Draw a section header with navy blue styling
 */
export function drawSectionHeader(pdf: jsPDF, title: string, yPos: number, margin: number = 20): number {
  const { navyBlue } = ELP_COLORS;
  
  // Left accent bar
  pdf.setFillColor(navyBlue.r, navyBlue.g, navyBlue.b);
  pdf.rect(margin, yPos - 4, 2, 8, 'F');
  
  pdf.setTextColor(navyBlue.r, navyBlue.g, navyBlue.b);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, margin + 6, yPos);
  
  return yPos + 10;
}

/**
 * Draw info grid with navy blue labels
 */
export function drawInfoRow(
  pdf: jsPDF, 
  label: string, 
  value: string, 
  x: number, 
  yPos: number
): number {
  const { navyLight, darkText } = ELP_COLORS;
  
  pdf.setTextColor(navyLight.r, navyLight.g, navyLight.b);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text(label, x, yPos);
  
  pdf.setTextColor(darkText.r, darkText.g, darkText.b);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(value || '-', x, yPos + 5);
  
  return yPos + 12;
}

/**
 * Standard Cover Page Configuration
 */
export interface CoverPageData {
  documentType: string;         // e.g., "Relatório de Inteligência", "Feasibility Study"
  title: string;                // Main title
  subtitle?: string;            // Optional subtitle
  companyName?: string;         // Company being analyzed or client
  contactName?: string;         // Contact person
  country?: string;             // Location
  industry?: string;            // Industry sector
  date: string;                 // Generated date
  confidential?: boolean;       // Show confidential badge
  reference?: string;           // Document reference number
}

/**
 * Standard Professional Cover Page - WHITE BACKGROUND with NAVY BLUE stripes
 * Consistent design for all ELP documents
 */
export async function addProfessionalCoverPage(
  pdf: jsPDF,
  data: CoverPageData
): Promise<void> {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const { navyBlue, white, gray, success } = ELP_COLORS;
  
  // Load logo
  const logoData = await loadLogoImage();
  
  // ===== WHITE BACKGROUND =====
  pdf.setFillColor(white.r, white.g, white.b);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // ===== TOP STRIPE - Navy Blue Header Band =====
  pdf.setFillColor(navyBlue.r, navyBlue.g, navyBlue.b);
  pdf.rect(0, 0, pageWidth, 8, 'F');
  
  // Subtle accent line below
  pdf.setFillColor(success.r, success.g, success.b);
  pdf.rect(0, 8, pageWidth, 2, 'F');
  
  // ===== BOTTOM STRIPE - Navy Blue Footer Band =====
  pdf.setFillColor(navyBlue.r, navyBlue.g, navyBlue.b);
  pdf.rect(0, pageHeight - 20, pageWidth, 20, 'F');
  
  // ===== LOGO CENTERED =====
  if (logoData) {
    try {
      pdf.addImage(logoData, 'PNG', pageWidth / 2 - 30, 25, 60, 27);
    } catch {
      // Fallback text
      pdf.setTextColor(navyBlue.r, navyBlue.g, navyBlue.b);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('ELP Green Technology', pageWidth / 2, 45, { align: 'center' });
    }
  }
  
  // ===== COMPANY NAME =====
  pdf.setTextColor(navyBlue.r, navyBlue.g, navyBlue.b);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ELP Green Technology', pageWidth / 2, 62, { align: 'center' });
  
  // Tagline
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(gray.r, gray.g, gray.b);
  pdf.text('Transforming Waste into Resources', pageWidth / 2, 69, { align: 'center' });
  
  // ===== DECORATIVE LINE =====
  pdf.setDrawColor(navyBlue.r, navyBlue.g, navyBlue.b);
  pdf.setLineWidth(0.8);
  pdf.line(pageWidth / 2 - 50, 76, pageWidth / 2 + 50, 76);
  
  // ===== DOCUMENT TYPE BADGE =====
  const badgeWidth = 90;
  pdf.setFillColor(success.r, success.g, success.b);
  pdf.roundedRect(pageWidth / 2 - badgeWidth / 2, 85, badgeWidth, 10, 3, 3, 'F');
  pdf.setTextColor(white.r, white.g, white.b);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text(data.documentType.toUpperCase(), pageWidth / 2, 91.5, { align: 'center' });
  
  // ===== MAIN TITLE =====
  pdf.setTextColor(navyBlue.r, navyBlue.g, navyBlue.b);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  
  const titleLines = pdf.splitTextToSize(data.title, pageWidth - 60);
  let yPos = 115;
  for (const line of titleLines) {
    pdf.text(line, pageWidth / 2, yPos, { align: 'center' });
    yPos += 12;
  }
  
  // ===== SUBTITLE =====
  if (data.subtitle) {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(gray.r, gray.g, gray.b);
    pdf.text(data.subtitle, pageWidth / 2, yPos + 5, { align: 'center' });
    yPos += 15;
  }
  
  // ===== INFO CARDS =====
  yPos = 155;
  const cardWidth = 75;
  const cardHeight = 28;
  const cardSpacing = 10;
  const cardsStartX = pageWidth / 2 - cardWidth - cardSpacing / 2;
  
  // Company Card (left)
  if (data.companyName) {
    pdf.setFillColor(248, 250, 252);
    pdf.setDrawColor(navyBlue.r, navyBlue.g, navyBlue.b);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(cardsStartX, yPos, cardWidth, cardHeight, 2, 2, 'FD');
    
    // Left accent bar
    pdf.setFillColor(navyBlue.r, navyBlue.g, navyBlue.b);
    pdf.rect(cardsStartX, yPos, 3, cardHeight, 'F');
    
    pdf.setTextColor(gray.r, gray.g, gray.b);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.text('EMPRESA', cardsStartX + 8, yPos + 8);
    
    pdf.setTextColor(navyBlue.r, navyBlue.g, navyBlue.b);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    const companyTrunc = data.companyName.length > 25 ? data.companyName.substring(0, 22) + '...' : data.companyName;
    pdf.text(companyTrunc, cardsStartX + 8, yPos + 18);
  }
  
  // Location/Contact Card (right)
  if (data.country || data.contactName) {
    const rightCardX = cardsStartX + cardWidth + cardSpacing;
    
    pdf.setFillColor(248, 250, 252);
    pdf.setDrawColor(success.r, success.g, success.b);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(rightCardX, yPos, cardWidth, cardHeight, 2, 2, 'FD');
    
    // Left accent bar - green
    pdf.setFillColor(success.r, success.g, success.b);
    pdf.rect(rightCardX, yPos, 3, cardHeight, 'F');
    
    pdf.setTextColor(gray.r, gray.g, gray.b);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.text(data.contactName ? 'CONTATO' : 'LOCALIZAÇÃO', rightCardX + 8, yPos + 8);
    
    pdf.setTextColor(navyBlue.r, navyBlue.g, navyBlue.b);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    const infoText = data.contactName || data.country || '';
    const infoTrunc = infoText.length > 25 ? infoText.substring(0, 22) + '...' : infoText;
    pdf.text(infoTrunc, rightCardX + 8, yPos + 18);
  }
  
  // ===== INDUSTRY TAG (if available) =====
  if (data.industry) {
    yPos += 40;
    pdf.setTextColor(gray.r, gray.g, gray.b);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Setor: ${data.industry}`, pageWidth / 2, yPos, { align: 'center' });
  }
  
  // ===== DATE BOX =====
  yPos = 215;
  pdf.setFillColor(navyBlue.r, navyBlue.g, navyBlue.b);
  pdf.roundedRect(pageWidth / 2 - 35, yPos, 70, 12, 3, 3, 'F');
  pdf.setTextColor(white.r, white.g, white.b);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text(data.date, pageWidth / 2, yPos + 8, { align: 'center' });
  
  // ===== REFERENCE NUMBER (if available) =====
  if (data.reference) {
    pdf.setTextColor(gray.r, gray.g, gray.b);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Ref: ${data.reference}`, pageWidth / 2, yPos + 22, { align: 'center' });
  }
  
  // ===== CONFIDENTIAL BADGE =====
  if (data.confidential !== false) {
    yPos = 250;
    pdf.setFillColor(248, 250, 252);
    pdf.setDrawColor(gray.r, gray.g, gray.b);
    pdf.setLineWidth(0.2);
    pdf.roundedRect(pageWidth / 2 - 40, yPos, 80, 10, 2, 2, 'FD');
    
    pdf.setTextColor(gray.r, gray.g, gray.b);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DOCUMENTO CONFIDENCIAL', pageWidth / 2, yPos + 6.5, { align: 'center' });
  }
  
  // ===== FOOTER TEXT ON BOTTOM STRIPE =====
  pdf.setTextColor(white.r, white.g, white.b);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('ELP Green Technology | www.elpgreen.com', pageWidth / 2, pageHeight - 10, { align: 'center' });
}
