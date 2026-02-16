/**
 * Professional PDF Table System
 * 
 * Architecture-grade table rendering for jsPDF with:
 * - Consistent typography and spacing
 * - Automatic column width calculation
 * - Zebra striping and header styling
 * - Page break awareness
 * - Multi-language support (including CJK)
 */

import jsPDF from 'jspdf';

// ================== DESIGN TOKENS ==================

export const PDF_DESIGN_TOKENS = {
  // Colors (RGB format)
  colors: {
    primary: { r: 26, g: 39, b: 68 },      // Navy blue #1a2744
    secondary: { r: 0, g: 102, b: 204 },   // Corporate blue #0066cc
    success: { r: 34, g: 139, b: 34 },     // Green #228b22
    warning: { r: 220, g: 165, b: 0 },     // Amber #dca500
    danger: { r: 220, g: 53, b: 69 },      // Red #dc3545
    text: {
      dark: { r: 40, g: 40, b: 40 },
      medium: { r: 100, g: 100, b: 100 },
      light: { r: 150, g: 150, b: 150 },
      white: { r: 255, g: 255, b: 255 },
    },
    background: {
      white: { r: 255, g: 255, b: 255 },
      light: { r: 248, g: 250, b: 252 },    // #f8fafc
      zebra: { r: 249, g: 250, b: 251 },    // #f9fafb
      header: { r: 0, g: 51, b: 102 },      // #003366
    },
    border: {
      light: { r: 229, g: 231, b: 235 },    // #e5e7eb
      medium: { r: 209, g: 213, b: 219 },   // #d1d5db
      dark: { r: 156, g: 163, b: 175 },     // #9ca3af
    },
  },

  // Typography
  typography: {
    fontFamily: 'helvetica',
    sizes: {
      h1: 16,
      h2: 14,
      h3: 12,
      h4: 11,
      body: 9,
      small: 8,
      tiny: 7,
      micro: 6,
    },
    lineHeight: {
      tight: 3.5,
      normal: 4.2,
      relaxed: 5,
      loose: 6,
    },
  },

  // Spacing (in mm)
  spacing: {
    xs: 2,
    sm: 4,
    md: 6,
    lg: 8,
    xl: 12,
    xxl: 16,
  },

  // Table specific
  table: {
    headerHeight: 8,
    rowHeight: 6,
    cellPadding: {
      x: 3,
      y: 1.5,
    },
    borderWidth: 0.2,
    headerBorderWidth: 0.5,
  },

  // Page layout
  layout: {
    margin: 15,
    headerHeight: 28,
    footerHeight: 15,
    contentMaxY: 275,
  },
} as const;

// ================== TYPE DEFINITIONS ==================

export interface TableColumn {
  header: string;
  key: string;
  width?: number;       // Percentage or fixed width
  align?: 'left' | 'center' | 'right';
  format?: 'text' | 'currency' | 'percentage' | 'number';
  bold?: boolean;
  color?: { r: number; g: number; b: number };
}

export interface TableOptions {
  startY: number;
  maxY?: number;
  headerStyle?: 'dark' | 'light' | 'minimal' | 'accent';
  zebraStripes?: boolean;
  showBorders?: boolean;
  showHeaderBorder?: boolean;
  rounded?: boolean;
  shadow?: boolean;
  title?: string;
  titleStyle?: 'section' | 'subsection' | 'inline';
  fontSize?: number;
  compact?: boolean;
  highlightTotal?: boolean;
  lang?: string;
}

export interface TableResult {
  endY: number;
  pageBreaks: number;
}

export type TableRow = Record<string, string | number | null | undefined>;

// ================== TABLE RENDERER ==================

export class PDFTableRenderer {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private tokens = PDF_DESIGN_TOKENS;

  constructor(doc: jsPDF) {
    this.doc = doc;
    this.pageWidth = doc.internal.pageSize.getWidth();
    this.pageHeight = doc.internal.pageSize.getHeight();
  }

  /**
   * Draw a professional table with automatic layout
   */
  drawTable(
    columns: TableColumn[],
    rows: TableRow[],
    options: TableOptions
  ): TableResult {
    const {
      startY,
      maxY = this.tokens.layout.contentMaxY,
      headerStyle = 'dark',
      zebraStripes = true,
      showBorders = true,
      showHeaderBorder = true,
      rounded = true,
      shadow = false,
      title,
      titleStyle = 'section',
      fontSize = this.tokens.typography.sizes.body,
      compact = false,
      highlightTotal = true,
    } = options;

    const margin = this.tokens.layout.margin;
    const contentWidth = this.pageWidth - margin * 2;
    let yPos = startY;
    let pageBreaks = 0;

    // Draw title if provided
    if (title) {
      yPos = this.drawTableTitle(title, yPos, margin, titleStyle);
    }

    // Calculate column widths
    const columnWidths = this.calculateColumnWidths(columns, contentWidth);

    // Draw shadow if enabled
    if (shadow) {
      this.doc.setFillColor(220, 220, 220);
      const tableHeight = this.tokens.table.headerHeight + rows.length * this.tokens.table.rowHeight;
      this.doc.roundedRect(margin + 1, yPos + 1, contentWidth, tableHeight, 2, 2, 'F');
    }

    // Draw header
    const headerHeight = compact 
      ? this.tokens.table.headerHeight - 2 
      : this.tokens.table.headerHeight;
    
    yPos = this.drawTableHeader(columns, columnWidths, yPos, margin, headerStyle, headerHeight, rounded, fontSize);

    // Draw rows
    const rowHeight = compact 
      ? this.tokens.table.rowHeight - 1 
      : this.tokens.table.rowHeight;

    rows.forEach((row, rowIndex) => {
      // Check for page break
      if (yPos + rowHeight > maxY) {
        this.doc.addPage();
        pageBreaks++;
        yPos = this.tokens.layout.margin + 10;
        
        // Redraw header on new page
        yPos = this.drawTableHeader(columns, columnWidths, yPos, margin, headerStyle, headerHeight, false, fontSize);
      }

      // Determine if this is the last row (total row)
      const isLastRow = rowIndex === rows.length - 1;
      const isTotalRow = highlightTotal && isLastRow && this.detectTotalRow(row, columns);

      // Draw row background
      if (isTotalRow) {
        this.doc.setFillColor(
          this.tokens.colors.background.light.r,
          this.tokens.colors.background.light.g,
          this.tokens.colors.background.light.b
        );
        this.doc.rect(margin, yPos, contentWidth, rowHeight, 'F');
      } else if (zebraStripes && rowIndex % 2 === 1) {
        this.doc.setFillColor(
          this.tokens.colors.background.zebra.r,
          this.tokens.colors.background.zebra.g,
          this.tokens.colors.background.zebra.b
        );
        this.doc.rect(margin, yPos, contentWidth, rowHeight, 'F');
      }

      // Draw row border if enabled
      if (showBorders) {
        this.doc.setDrawColor(
          this.tokens.colors.border.light.r,
          this.tokens.colors.border.light.g,
          this.tokens.colors.border.light.b
        );
        this.doc.setLineWidth(this.tokens.table.borderWidth);
        this.doc.line(margin, yPos + rowHeight, margin + contentWidth, yPos + rowHeight);
      }

      // Draw cell values
      let xPos = margin;
      columns.forEach((col, colIndex) => {
        const value = row[col.key];
        const formattedValue = this.formatCellValue(value, col.format);
        const cellWidth = columnWidths[colIndex];
        const align = col.align || 'left';
        
        // Set text style
        this.doc.setFontSize(fontSize);
        if (isTotalRow || col.bold) {
          this.doc.setFont(this.tokens.typography.fontFamily, 'bold');
        } else {
          this.doc.setFont(this.tokens.typography.fontFamily, 'normal');
        }

        // Set text color
        if (col.color) {
          this.doc.setTextColor(col.color.r, col.color.g, col.color.b);
        } else if (isTotalRow) {
          this.doc.setTextColor(
            this.tokens.colors.primary.r,
            this.tokens.colors.primary.g,
            this.tokens.colors.primary.b
          );
        } else {
          this.doc.setTextColor(
            this.tokens.colors.text.dark.r,
            this.tokens.colors.text.dark.g,
            this.tokens.colors.text.dark.b
          );
        }

        // Calculate text position based on alignment
        let textX = xPos + this.tokens.table.cellPadding.x;
        if (align === 'center') {
          textX = xPos + cellWidth / 2;
        } else if (align === 'right') {
          textX = xPos + cellWidth - this.tokens.table.cellPadding.x;
        }

        this.doc.text(formattedValue, textX, yPos + rowHeight / 2 + 1.5, { align });
        xPos += cellWidth;
      });

      yPos += rowHeight;
    });

    // Draw final border if rounded
    if (rounded && showBorders) {
      this.doc.setDrawColor(
        this.tokens.colors.border.medium.r,
        this.tokens.colors.border.medium.g,
        this.tokens.colors.border.medium.b
      );
      this.doc.setLineWidth(this.tokens.table.borderWidth);
      
      // Left and right borders for the table body
      const tableTop = startY + (title ? 10 : 0) + headerHeight;
      this.doc.line(margin, tableTop, margin, yPos);
      this.doc.line(margin + contentWidth, tableTop, margin + contentWidth, yPos);
      
      // Bottom border with rounded corner simulation
      this.doc.line(margin, yPos, margin + contentWidth, yPos);
    }

    return { endY: yPos, pageBreaks };
  }

  /**
   * Draw a simple data table (headers + string arrays)
   */
  drawSimpleTable(
    headers: string[],
    data: string[][],
    colWidths: number[],
    startY: number,
    options: Partial<TableOptions> = {}
  ): TableResult {
    // Convert to column format
    const columns: TableColumn[] = headers.map((header, index) => ({
      header,
      key: `col${index}`,
      width: colWidths[index],
      align: index === 0 ? 'left' : 'right',
    }));

    // Convert data to row format
    const rows: TableRow[] = data.map((row) => {
      const rowObj: TableRow = {};
      row.forEach((cell, index) => {
        rowObj[`col${index}`] = cell;
      });
      return rowObj;
    });

    return this.drawTable(columns, rows, { startY, ...options });
  }

  /**
   * Draw table title/section header
   */
  private drawTableTitle(
    title: string,
    yPos: number,
    margin: number,
    style: 'section' | 'subsection' | 'inline'
  ): number {
    const { colors, typography, spacing } = this.tokens;

    switch (style) {
      case 'section':
        // Left accent bar with title
        this.doc.setFillColor(colors.primary.r, colors.primary.g, colors.primary.b);
        this.doc.rect(margin, yPos - 3, 2, 7, 'F');
        
        this.doc.setTextColor(colors.primary.r, colors.primary.g, colors.primary.b);
        this.doc.setFontSize(typography.sizes.h3);
        this.doc.setFont(typography.fontFamily, 'bold');
        this.doc.text(title, margin + 5, yPos);
        return yPos + spacing.lg;

      case 'subsection':
        this.doc.setTextColor(colors.secondary.r, colors.secondary.g, colors.secondary.b);
        this.doc.setFontSize(typography.sizes.h4);
        this.doc.setFont(typography.fontFamily, 'bold');
        this.doc.text(title, margin, yPos);
        return yPos + spacing.md;

      case 'inline':
        this.doc.setTextColor(colors.text.dark.r, colors.text.dark.g, colors.text.dark.b);
        this.doc.setFontSize(typography.sizes.body);
        this.doc.setFont(typography.fontFamily, 'bold');
        this.doc.text(title, margin, yPos);
        return yPos + spacing.sm;

      default:
        return yPos;
    }
  }

  /**
   * Draw table header row
   */
  private drawTableHeader(
    columns: TableColumn[],
    columnWidths: number[],
    yPos: number,
    margin: number,
    style: 'dark' | 'light' | 'minimal' | 'accent',
    height: number,
    rounded: boolean,
    fontSize: number
  ): number {
    const { colors, table, typography } = this.tokens;
    const contentWidth = this.pageWidth - margin * 2;

    // Draw header background based on style
    switch (style) {
      case 'dark':
        this.doc.setFillColor(colors.background.header.r, colors.background.header.g, colors.background.header.b);
        this.doc.setTextColor(colors.text.white.r, colors.text.white.g, colors.text.white.b);
        break;
      case 'light':
        this.doc.setFillColor(colors.background.light.r, colors.background.light.g, colors.background.light.b);
        this.doc.setTextColor(colors.primary.r, colors.primary.g, colors.primary.b);
        break;
      case 'accent':
        this.doc.setFillColor(colors.primary.r, colors.primary.g, colors.primary.b);
        this.doc.setTextColor(colors.text.white.r, colors.text.white.g, colors.text.white.b);
        break;
      case 'minimal':
        this.doc.setFillColor(colors.background.white.r, colors.background.white.g, colors.background.white.b);
        this.doc.setTextColor(colors.text.dark.r, colors.text.dark.g, colors.text.dark.b);
        break;
    }

    // Draw background
    if (rounded) {
      this.doc.roundedRect(margin, yPos, contentWidth, height, 2, 0, 'F');
      // Fill the bottom corners
      this.doc.rect(margin, yPos + height - 2, contentWidth, 2, 'F');
    } else {
      this.doc.rect(margin, yPos, contentWidth, height, 'F');
    }

    // Draw header text
    this.doc.setFontSize(fontSize);
    this.doc.setFont(typography.fontFamily, 'bold');

    let xPos = margin;
    columns.forEach((col, index) => {
      const cellWidth = columnWidths[index];
      const align = col.align || 'left';
      
      let textX = xPos + table.cellPadding.x;
      if (align === 'center') {
        textX = xPos + cellWidth / 2;
      } else if (align === 'right') {
        textX = xPos + cellWidth - table.cellPadding.x;
      }

      this.doc.text(col.header, textX, yPos + height / 2 + 1.5, { align });
      xPos += cellWidth;
    });

    // Draw bottom border for header
    if (style !== 'minimal') {
      this.doc.setDrawColor(
        colors.border.dark.r,
        colors.border.dark.g,
        colors.border.dark.b
      );
      this.doc.setLineWidth(table.headerBorderWidth);
      this.doc.line(margin, yPos + height, margin + contentWidth, yPos + height);
    }

    return yPos + height;
  }

  /**
   * Calculate optimal column widths
   */
  private calculateColumnWidths(columns: TableColumn[], contentWidth: number): number[] {
    const totalSpecified = columns.reduce((sum, col) => sum + (col.width || 0), 0);
    const unspecifiedCount = columns.filter((col) => !col.width).length;
    
    const remainingWidth = contentWidth - totalSpecified;
    const autoWidth = unspecifiedCount > 0 ? remainingWidth / unspecifiedCount : 0;

    return columns.map((col) => {
      if (col.width) {
        // If width is percentage (< 1), convert to actual width
        return col.width < 1 ? col.width * contentWidth : col.width;
      }
      return autoWidth;
    });
  }

  /**
   * Format cell value based on type
   */
  private formatCellValue(
    value: string | number | null | undefined,
    format?: 'text' | 'currency' | 'percentage' | 'number'
  ): string {
    if (value === null || value === undefined) return '-';
    
    switch (format) {
      case 'currency':
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(numValue)) return String(value);
        if (Math.abs(numValue) >= 1000000) {
          return `$${(numValue / 1000000).toFixed(2)}M`;
        }
        if (Math.abs(numValue) >= 1000) {
          return `$${(numValue / 1000).toFixed(1)}K`;
        }
        return `$${numValue.toFixed(0)}`;

      case 'percentage':
        const pctValue = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(pctValue)) return String(value);
        return `${pctValue.toFixed(1)}%`;

      case 'number':
        const num = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(num)) return String(value);
        return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(num);

      default:
        return String(value);
    }
  }

  /**
   * Detect if a row is a total/summary row
   */
  private detectTotalRow(row: TableRow, columns: TableColumn[]): boolean {
    const firstCol = columns[0];
    const firstValue = String(row[firstCol.key] || '').toLowerCase();
    const totalKeywords = ['total', 'sum', 'subtotal', 'grand total', 'soma', 'totale', '合计', '總計'];
    return totalKeywords.some((keyword) => firstValue.includes(keyword));
  }
}

// ================== UTILITY FUNCTIONS ==================

/**
 * Create a metric card row (for KPI summaries)
 */
export function drawMetricCards(
  doc: jsPDF,
  metrics: Array<{ label: string; value: string; color?: { r: number; g: number; b: number } }>,
  yPos: number,
  options: { columns?: number; margin?: number } = {}
): number {
  const { columns = 3, margin = PDF_DESIGN_TOKENS.layout.margin } = options;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - margin * 2;
  const cardWidth = contentWidth / columns;
  const cardHeight = 20;
  const { colors, typography, spacing } = PDF_DESIGN_TOKENS;

  // Background
  doc.setFillColor(colors.background.light.r, colors.background.light.g, colors.background.light.b);
  doc.roundedRect(margin, yPos, contentWidth, cardHeight * Math.ceil(metrics.length / columns), 3, 3, 'F');

  metrics.forEach((metric, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const x = margin + spacing.md + col * cardWidth;
    const y = yPos + spacing.md + row * cardHeight;

    // Label
    doc.setTextColor(colors.text.medium.r, colors.text.medium.g, colors.text.medium.b);
    doc.setFontSize(typography.sizes.small);
    doc.setFont(typography.fontFamily, 'normal');
    doc.text(metric.label, x, y);

    // Value
    const valueColor = metric.color || colors.secondary;
    doc.setTextColor(valueColor.r, valueColor.g, valueColor.b);
    doc.setFontSize(typography.sizes.h3);
    doc.setFont(typography.fontFamily, 'bold');
    doc.text(metric.value, x, y + 6);
  });

  return yPos + cardHeight * Math.ceil(metrics.length / columns) + spacing.md;
}

/**
 * Draw a section divider line
 */
export function drawSectionDivider(
  doc: jsPDF,
  yPos: number,
  style: 'solid' | 'dashed' | 'accent' = 'solid'
): number {
  const { colors, layout } = PDF_DESIGN_TOKENS;
  const margin = layout.margin;
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setLineWidth(0.3);

  switch (style) {
    case 'accent':
      doc.setDrawColor(colors.primary.r, colors.primary.g, colors.primary.b);
      break;
    case 'dashed':
      doc.setDrawColor(colors.border.medium.r, colors.border.medium.g, colors.border.medium.b);
      // jsPDF doesn't support dashed lines natively, use dots
      break;
    default:
      doc.setDrawColor(colors.border.light.r, colors.border.light.g, colors.border.light.b);
  }

  doc.line(margin, yPos, pageWidth - margin, yPos);
  return yPos + 4;
}

/**
 * Draw a highlighted info box
 */
export function drawInfoBox(
  doc: jsPDF,
  content: string,
  yPos: number,
  type: 'info' | 'success' | 'warning' | 'danger' = 'info'
): number {
  const { colors, layout, typography, spacing } = PDF_DESIGN_TOKENS;
  const margin = layout.margin;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - margin * 2;

  // Set colors based on type
  const typeColors = {
    info: colors.secondary,
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
  };

  const accentColor = typeColors[type];

  // Calculate box height based on content
  doc.setFontSize(typography.sizes.body);
  const lines = doc.splitTextToSize(content, contentWidth - spacing.xl * 2);
  const boxHeight = lines.length * typography.lineHeight.normal + spacing.md * 2;

  // Draw box
  doc.setFillColor(colors.background.light.r, colors.background.light.g, colors.background.light.b);
  doc.roundedRect(margin, yPos, contentWidth, boxHeight, 2, 2, 'F');

  // Left accent bar
  doc.setFillColor(accentColor.r, accentColor.g, accentColor.b);
  doc.rect(margin, yPos, 3, boxHeight, 'F');

  // Content
  doc.setTextColor(colors.text.dark.r, colors.text.dark.g, colors.text.dark.b);
  doc.setFontSize(typography.sizes.body);
  doc.setFont(typography.fontFamily, 'normal');
  doc.text(lines, margin + spacing.lg, yPos + spacing.md + 3);

  return yPos + boxHeight + spacing.sm;
}
