import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { PDF_DESIGN_TOKENS, PDFTableRenderer, drawMetricCards, drawInfoBox } from './pdfTableSystem';

/**
 * Feasibility Study PDF Generator (Legacy)
 * 
 * Architecture Standards:
 * - Cover page: White background with navy stripes
 * - Headers: 8mm navy blue bars
 * - Tables: Professional zebra striping, bold totals
 * - Charts: 4x scale for PDF legibility
 * - Typography: 9pt body, 12pt section headers
 */

interface FeasibilityStudy {
  study_name: string;
  location: string | null;
  country: string | null;
  plant_type?: string;
  daily_capacity_tons: number;
  operating_days_per_year: number;
  utilization_rate: number;
  equipment_cost: number;
  installation_cost: number;
  infrastructure_cost: number;
  working_capital: number;
  other_capex: number;
  raw_material_cost: number;
  labor_cost: number;
  energy_cost: number;
  maintenance_cost: number;
  logistics_cost: number;
  administrative_cost: number;
  other_opex: number;
  rubber_granules_price: number;
  rubber_granules_yield: number;
  steel_wire_price: number;
  steel_wire_yield: number;
  textile_fiber_price: number;
  textile_fiber_yield: number;
  rcb_price: number;    // Recovered Carbon Black - Jan 2026 market: $900-1200/ton avg $1100
  rcb_yield: number;    // rCB yield percentage - typically 10-17.5% via pyrolysis
  tax_rate: number;
  depreciation_years: number;
  discount_rate: number;
  total_investment: number;
  annual_revenue: number;
  annual_opex: number;
  annual_ebitda: number;
  payback_months: number;
  roi_percentage: number;
  npv_10_years: number;
  irr_percentage: number;
  status?: string;
  notes: string | null;
  created_at: string;
}

interface ChartRefs {
  cashFlowRef: React.RefObject<HTMLDivElement>;
  revenueRef: React.RefObject<HTMLDivElement>;
  opexRef: React.RefObject<HTMLDivElement>;
  sensitivityRef: React.RefObject<HTMLDivElement>;
}

// Design tokens for consistent styling
const COLORS = PDF_DESIGN_TOKENS.colors;
const TYPOGRAPHY = PDF_DESIGN_TOKENS.typography;
const LAYOUT = PDF_DESIGN_TOKENS.layout;

const formatCurrency = (value: number): string => {
  if (Math.abs(value) >= 1000000) {
    return `USD ${(value / 1000000).toFixed(2)}M`;
  }
  if (Math.abs(value) >= 1000) {
    return `USD ${(value / 1000).toFixed(0)}K`;
  }
  return `USD ${value.toFixed(0)}`;
};

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(Math.round(value));
};

async function captureChart(element: HTMLDivElement | null): Promise<string | null> {
  if (!element) return null;
  
  try {
    // 4x scale for maximum chart legibility in PDF
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 4,
      logging: false,
      useCORS: true,
      allowTaint: true
    });
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error capturing chart:', error);
    return null;
  }
}

export async function generateFeasibilityPDFWithCharts(
  study: FeasibilityStudy,
  chartRefs: ChartRefs,
  aiAnalysis?: string | null
): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Capture all charts in parallel
  const [cashFlowImg, revenueImg, opexImg, sensitivityImg] = await Promise.all([
    captureChart(chartRefs.cashFlowRef.current),
    captureChart(chartRefs.revenueRef.current),
    captureChart(chartRefs.opexRef.current),
    captureChart(chartRefs.sensitivityRef.current)
  ]);

  // ===== PAGE 1: COVER PAGE - WHITE BACKGROUND WITH NAVY STRIPES =====
  // WHITE background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // TOP STRIPE - Navy Blue
  doc.setFillColor(26, 39, 68);
  doc.rect(0, 0, pageWidth, 8, 'F');
  
  // Accent line
  doc.setFillColor(34, 139, 34);
  doc.rect(0, 8, pageWidth, 2, 'F');
  
  // BOTTOM STRIPE - Navy Blue
  doc.setFillColor(26, 39, 68);
  doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');
  
  // Logo centered
  const logoImg = new Image();
  logoImg.crossOrigin = 'anonymous';
  let logoLoaded = false;
  
  try {
    const logoModule = await import('@/assets/logo-elp-new.png');
    await new Promise<void>((resolve) => {
      logoImg.onload = () => { logoLoaded = true; resolve(); };
      logoImg.onerror = () => resolve();
      logoImg.src = logoModule.default;
    });
    if (logoLoaded) {
      doc.addImage(logoImg, 'PNG', pageWidth / 2 - 30, 25, 60, 27);
    }
  } catch { /* ignore */ }
  
  // Company name
  doc.setTextColor(26, 39, 68);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('ELP Green Technology', pageWidth / 2, 62, { align: 'center' });
  
  // Tagline
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text('Feasibility Study Department', pageWidth / 2, 69, { align: 'center' });
  
  // Decorative line
  doc.setDrawColor(26, 39, 68);
  doc.setLineWidth(0.8);
  doc.line(pageWidth / 2 - 50, 76, pageWidth / 2 + 50, 76);
  
  // Document type badge
  doc.setFillColor(34, 139, 34);
  doc.roundedRect(pageWidth / 2 - 50, 85, 100, 10, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('FEASIBILITY STUDY REPORT', pageWidth / 2, 91.5, { align: 'center' });

  let y = 110;

  // Study name
  doc.setTextColor(26, 39, 68);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(study.study_name, pageWidth / 2, y, { align: 'center' });
  y += 12;

  // Location
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  if (study.location) {
    doc.text(`${study.location}, ${study.country}`, pageWidth / 2, y, { align: 'center' });
    y += 8;
  }
  doc.text(`Status: ${study.status || 'Draft'} | ${new Date().toLocaleDateString()}`, pageWidth / 2, y, { align: 'center' });
  y += 25;

  // Confidential badge
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.2);
  doc.roundedRect(pageWidth / 2 - 40, 220, 80, 10, 2, 2, 'FD');
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('CONFIDENTIAL DOCUMENT', pageWidth / 2, 226.5, { align: 'center' });
  
  // Footer on bottom stripe
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('ELP Green Technology | www.elpgreen.com', pageWidth / 2, pageHeight - 10, { align: 'center' });

  // ===== PAGE 2: METRICS =====
  doc.addPage();
  
  const margin = LAYOUT.margin;
  const contentWidth = pageWidth - margin * 2;
  y = 20;

  // Use the PDFTableRenderer for consistent metric cards
  const tableRenderer = new PDFTableRenderer(doc);

  // Key Metrics Summary Box with improved styling
  doc.setFillColor(COLORS.background.light.r, COLORS.background.light.g, COLORS.background.light.b);
  doc.roundedRect(margin, y, contentWidth, 45, 3, 3, 'F');
  
  // Add subtle border
  doc.setDrawColor(COLORS.border.light.r, COLORS.border.light.g, COLORS.border.light.b);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, 45, 3, 3, 'S');
  
  doc.setTextColor(0, 0, 0);
  
  const metrics = [
    { label: 'Total Investment', value: formatCurrency(study.total_investment) },
    { label: 'Annual Revenue', value: formatCurrency(study.annual_revenue) },
    { label: 'Annual EBITDA', value: formatCurrency(study.annual_ebitda) },
    { label: 'ROI', value: `${study.roi_percentage.toFixed(1)}%` },
    { label: 'Payback', value: `${study.payback_months} months` },
    { label: 'IRR', value: `${study.irr_percentage.toFixed(1)}%` }
  ];

  const metricWidth = contentWidth / 3;
  doc.setFontSize(TYPOGRAPHY.sizes.small);
  metrics.forEach((metric, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = margin + 5 + col * metricWidth;
    const my = y + 10 + row * 20;
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.text.medium.r, COLORS.text.medium.g, COLORS.text.medium.b);
    doc.text(metric.label, x, my);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
    doc.setFontSize(TYPOGRAPHY.sizes.h4);
    doc.text(metric.value, x, my + 7);
    doc.setFontSize(TYPOGRAPHY.sizes.small);
  });
  y += 50;

  // Plant Configuration
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Plant Configuration', margin, y);
  y += 6;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const annualTonnage = study.daily_capacity_tons * study.operating_days_per_year * (study.utilization_rate / 100);
  
  const configItems = [
    [`Daily Capacity: ${study.daily_capacity_tons} tons/day`, `Operating Days: ${study.operating_days_per_year} days/year`],
    [`Utilization Rate: ${study.utilization_rate}%`, `Annual Production: ${formatNumber(annualTonnage)} tons`]
  ];
  
  configItems.forEach(row => {
    doc.text(row[0], margin + 5, y);
    doc.text(row[1], margin + 95, y);
    y += 5;
  });
  y += 8;

  // Investment Details
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Investment (CAPEX)', margin, y);
  y += 6;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  const capexItems = [
    ['Equipment', study.equipment_cost, 'Installation', study.installation_cost],
    ['Infrastructure', study.infrastructure_cost, 'Working Capital', study.working_capital],
    ['Other CAPEX', study.other_capex, 'TOTAL', study.total_investment]
  ];
  
  capexItems.forEach(row => {
    doc.text(`${row[0]}: ${formatCurrency(row[1] as number)}`, margin + 5, y);
    if (row[2] === 'TOTAL') {
      doc.setFont('helvetica', 'bold');
    }
    doc.text(`${row[2]}: ${formatCurrency(row[3] as number)}`, margin + 95, y);
    doc.setFont('helvetica', 'normal');
    y += 5;
  });

  // ===== PAGE 3: Cash Flow Chart =====
  doc.addPage();
  y = 25; // Increased top margin for better spacing
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 64, 175);
  doc.text('10-Year Cash Flow Projection', 20, y);
  y += 12; // Increased spacing after title

  if (cashFlowImg) {
    const imgWidth = pageWidth - 40; // More padding on sides
    const imgHeight = (imgWidth * 320) / 760;
    doc.addImage(cashFlowImg, 'PNG', 20, y, imgWidth, imgHeight);
    y += imgHeight + 18; // More spacing after chart
  }

  // Breakeven analysis text
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Cash Flow Analysis', 20, y);
  y += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const netProfit = study.annual_ebitda - Math.max(0, (study.annual_ebitda - study.total_investment / study.depreciation_years) * (study.tax_rate / 100));
  const breakevenYear = Math.ceil(study.total_investment / netProfit);
  
  doc.text(`• Breakeven Point: Year ${breakevenYear > 10 ? '> 10' : breakevenYear}`, 25, y);
  y += 5;
  doc.text(`• Net Annual Profit (after taxes): ${formatCurrency(netProfit)}`, 25, y);
  y += 5;
  doc.text(`• 10-Year NPV (${study.discount_rate}% discount rate): ${formatCurrency(study.npv_10_years)}`, 25, y);

  // ===== PAGE 3: Revenue & OPEX Breakdown =====
  doc.addPage();
  y = 25; // Increased top margin

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 64, 175);
  doc.text('Revenue & Cost Breakdown', 20, y);
  y += 12; // Increased spacing after title

  if (revenueImg && opexImg) {
    const imgWidth = (pageWidth - 50) / 2; // More padding between charts
    const imgHeight = (imgWidth * 300) / 380;
    
    doc.addImage(revenueImg, 'PNG', 20, y, imgWidth, imgHeight);
    doc.addImage(opexImg, 'PNG', 30 + imgWidth, y, imgWidth, imgHeight);
    y += imgHeight + 15; // More spacing after charts
  }

  // Revenue details
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Revenue Components', 20, y);
  y += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`• Rubber Granules (${study.rubber_granules_yield}% yield at $${study.rubber_granules_price}/ton)`, 25, y);
  y += 5;
  doc.text(`• Steel Wire (${study.steel_wire_yield}% yield at $${study.steel_wire_price}/ton)`, 25, y);
  y += 5;
  doc.text(`• Textile Fiber (${study.textile_fiber_yield}% yield at $${study.textile_fiber_price}/ton)`, 25, y);
  y += 5;
  doc.text(`• rCB - Recovered Carbon Black (${study.rcb_yield || 12}% yield at $${study.rcb_price || 1050}/ton)`, 25, y);
  y += 10;

  doc.setFont('helvetica', 'bold');
  doc.text('Operating Costs (Monthly)', 20, y);
  y += 8;
  
  doc.setFont('helvetica', 'normal');
  const opexItems = [
    ['Labor', study.labor_cost, 'Energy', study.energy_cost],
    ['Maintenance', study.maintenance_cost, 'Logistics', study.logistics_cost],
    ['Administrative', study.administrative_cost, 'Other', study.other_opex]
  ];
  
  opexItems.forEach(row => {
    doc.text(`${row[0]}: ${formatCurrency(row[1] as number)}`, 25, y);
    doc.text(`${row[2]}: ${formatCurrency(row[3] as number)}`, 110, y);
    y += 5;
  });

  // ===== PAGE 4: Sensitivity Analysis =====
  doc.addPage();
  y = 20;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 64, 175);
  doc.text('Sensitivity Analysis', 20, y);
  y += 10;

  if (sensitivityImg) {
    const imgWidth = pageWidth - 30;
    const imgHeight = (imgWidth * 320) / 760;
    doc.addImage(sensitivityImg, 'PNG', 15, y, imgWidth, imgHeight);
    y += imgHeight + 15;
  }

  // Sensitivity explanation
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Sensitivity Factors', 20, y);
  y += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('• Price Variation: Impact of ±20% change in product selling prices on ROI', 25, y);
  y += 5;
  doc.text('• Capacity Variation: Impact of ±20% change in plant utilization/capacity on ROI', 25, y);
  y += 5;
  doc.text('• OPEX Variation: Impact of ±20% change in operating costs on ROI', 25, y);
  y += 10;

  doc.setFont('helvetica', 'bold');
  doc.text('Risk Assessment', 20, y);
  y += 8;
  
  doc.setFont('helvetica', 'normal');
  const roiRating = study.roi_percentage >= 30 ? 'Excellent' : study.roi_percentage >= 20 ? 'Good' : study.roi_percentage >= 10 ? 'Moderate' : 'Low';
  doc.text(`• Base ROI Rating: ${roiRating} (${study.roi_percentage.toFixed(1)}%)`, 25, y);
  y += 5;
  doc.text(`• IRR vs Discount Rate: ${study.irr_percentage > study.discount_rate ? 'Favorable' : 'Unfavorable'} (${study.irr_percentage.toFixed(1)}% vs ${study.discount_rate}%)`, 25, y);
  y += 5;
  doc.text(`• Payback Period: ${study.payback_months <= 36 ? 'Short-term' : study.payback_months <= 60 ? 'Medium-term' : 'Long-term'} (${study.payback_months} months)`, 25, y);

  // ===== PAGE 5: AI Analysis (if available) =====
  if (aiAnalysis) {
    doc.addPage();
    y = 20;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175);
    doc.text('AI-Powered Analysis', 20, y);
    y += 10;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Split AI analysis into lines that fit the page
    const maxWidth = pageWidth - 40;
    const lines = doc.splitTextToSize(aiAnalysis, maxWidth);
    
    for (const line of lines) {
      if (y > pageHeight - 30) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, 20, y);
      y += 5;
    }
  }

  // Notes (if available)
  if (study.notes) {
    if (y > pageHeight - 60) {
      doc.addPage();
      y = 20;
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175);
    doc.text('Notes', 20, y);
    y += 8;
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const noteLines = doc.splitTextToSize(study.notes, pageWidth - 40);
    doc.text(noteLines, 20, y);
  }

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('This is an estimated feasibility study. Actual results may vary based on market conditions.', 20, pageHeight - 10);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 35, pageHeight - 10);
  }

  doc.save(`feasibility-study-${study.study_name.replace(/\s+/g, '-').toLowerCase()}-with-charts.pdf`);
}
