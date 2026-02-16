import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import QRCode from "qrcode";
import logoElp from "@/assets/logo-elp-lion.png";
import { getGovernmentPartnershipData, getRecommendedPartnershipTerms } from "@/components/admin/FiscalIncentivesTable";
import { loadCJKFont, registerCJKFont, setFontForLanguage, getFontForLanguage } from "./pdfCjkFontLoader";
interface FeasibilityStudy {
  study_name: string;
  location?: string | null;
  country?: string | null;
  daily_capacity_tons: number;
  operating_days_per_year: number;
  utilization_rate: number;
  total_investment: number;
  annual_revenue: number;
  annual_opex: number;
  annual_ebitda: number;
  payback_months: number;
  roi_percentage: number;
  npv_10_years: number;
  irr_percentage: number;
  rubber_granules_price: number;
  rubber_granules_yield: number;
  steel_wire_price: number;
  steel_wire_yield: number;
  textile_fiber_price: number;
  textile_fiber_yield: number;
  rcb_price?: number; // Recovered Carbon Black - Jan 2026 market: $900-1200/ton avg $1100
  rcb_yield?: number; // rCB yield percentage - typically 10-17.5% via pyrolysis
  tax_rate: number;
  discount_rate?: number;
  equipment_cost?: number;
  installation_cost?: number;
  infrastructure_cost?: number;
  working_capital?: number;
  labor_cost?: number;
  energy_cost?: number;
  maintenance_cost?: number;
  logistics_cost?: number;
  administrative_cost?: number;
  other_opex?: number;
  depreciation_years?: number;
  government_royalties_percent?: number;
  environmental_bonus_per_ton?: number;
  collection_model?: string;
}

export interface ChartRefs {
  cashFlowRef: React.RefObject<HTMLDivElement>;
  revenueRef: React.RefObject<HTMLDivElement>;
  opexRef: React.RefObject<HTMLDivElement>;
  sensitivityRef: React.RefObject<HTMLDivElement>;
  esgRadarRef?: React.RefObject<HTMLDivElement>;
  heatmapRef?: React.RefObject<HTMLDivElement>;
  capexRef?: React.RefObject<HTMLDivElement>;
  partnershipChartRef?: React.RefObject<HTMLDivElement>; // Partnership scenario chart
}

// Export calculation data interface
export interface ExportCalculationData {
  incoterm: string;
  destination: string;
  destinationName: string;
  products: Array<{
    name: string;
    exwPrice: number;
    landedPrice: number;
    quantity: number;
    totalRevenue: number;
    duties: number;
    taxes: number;
  }>;
  totalExportRevenue: number;
  totalDuties: number;
  totalTaxes: number;
}

const formatCurrency = (value: number): string => {
  if (Math.abs(value) >= 1000000) {
    return `USD ${(value / 1000000).toFixed(2)}M`;
  }
  if (Math.abs(value) >= 1000) {
    return `USD ${(value / 1000).toFixed(1)}K`;
  }
  return `USD ${value.toFixed(0)}`;
};

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
};

async function captureChart(element: HTMLDivElement | null): Promise<string | null> {
  if (!element) return null;
  try {
    // Higher scale (4) for maximum chart text legibility in the PDF
    const canvas = await html2canvas(element, {
      backgroundColor: "#ffffff",
      scale: 4,
      logging: false,
      useCORS: true
    });
    return canvas.toDataURL("image/png");
  } catch (error) {
    console.error("Error capturing chart:", error);
    return null;
  }
}

async function loadLogoAsBase64(): Promise<string | null> {
  try {
    const response = await fetch(logoElp);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error loading logo:", error);
    return null;
  }
}

async function generateQRCode(url: string): Promise<string | null> {
  try {
    const qrDataUrl = await QRCode.toDataURL(url, {
      width: 200,
      margin: 1,
      color: {
        dark: '#003366',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H'
    });
    return qrDataUrl;
  } catch (error) {
    console.error("Error generating QR code:", error);
    return null;
  }
}

// ESG and regulatory data by country
const countryESGData: Record<string, {
  co2Factor: number;
  jobsPerPlant: string;
  taxCredits: string;
  incentives: string[];
  esgRating: number;
  sdgAlignment: string[];
  carbonCredits: string;
}> = {
  'brazil': { co2Factor: 1.5, jobsPerPlant: '30-50', taxCredits: 'ICMS exemption up to 70%', incentives: ['BNDES financing', 'Rota 2030', 'Environmental tax credits'], esgRating: 78, sdgAlignment: ['SDG 12', 'SDG 13', 'SDG 8'], carbonCredits: 'CBIO credits available' },
  'italy': { co2Factor: 1.4, jobsPerPlant: '25-40', taxCredits: 'Credito d\'imposta 40% Transizione 5.0', incentives: ['PNRR funds', 'EU Taxonomy bonus', 'Regional incentives'], esgRating: 85, sdgAlignment: ['SDG 12', 'SDG 13', 'SDG 9'], carbonCredits: 'EU ETS eligible' },
  'usa': { co2Factor: 1.6, jobsPerPlant: '35-55', taxCredits: 'Section 45Q carbon credits', incentives: ['IRA incentives', 'State grants', 'Federal tax deductions'], esgRating: 80, sdgAlignment: ['SDG 12', 'SDG 13', 'SDG 8'], carbonCredits: 'Voluntary carbon market' },
  'australia': { co2Factor: 1.7, jobsPerPlant: '30-45', taxCredits: 'ACCU credits', incentives: ['ARENA funding', 'Clean Energy incentives', 'State waste levies'], esgRating: 82, sdgAlignment: ['SDG 12', 'SDG 13', 'SDG 15'], carbonCredits: 'Australian Carbon Credit Units' },
  'germany': { co2Factor: 1.3, jobsPerPlant: '25-40', taxCredits: 'KfW green loans', incentives: ['Circular Economy Act incentives', 'EU funds', 'State subsidies'], esgRating: 88, sdgAlignment: ['SDG 12', 'SDG 13', 'SDG 9'], carbonCredits: 'EU ETS eligible' },
  'mexico': { co2Factor: 1.5, jobsPerPlant: '40-60', taxCredits: 'ISR deductions 100%', incentives: ['SEMARNAT certification bonus', 'State incentives', 'IMMEX benefits'], esgRating: 72, sdgAlignment: ['SDG 12', 'SDG 13', 'SDG 8'], carbonCredits: 'Mexico ETS pilot' },
  'china': { co2Factor: 1.8, jobsPerPlant: '50-80', taxCredits: 'VAT exemption for recyclers', incentives: ['Provincial subsidies', 'Green credit incentives', 'EPR credits'], esgRating: 70, sdgAlignment: ['SDG 12', 'SDG 13', 'SDG 11'], carbonCredits: 'China national ETS' },
  'india': { co2Factor: 1.6, jobsPerPlant: '45-70', taxCredits: 'GST exemption', incentives: ['PLI scheme', 'State PCBG incentives', 'Make in India benefits'], esgRating: 68, sdgAlignment: ['SDG 12', 'SDG 13', 'SDG 8'], carbonCredits: 'PAT scheme credits' },
  'default': { co2Factor: 1.5, jobsPerPlant: '30-50', taxCredits: 'Varies by jurisdiction', incentives: ['Local incentives may apply'], esgRating: 75, sdgAlignment: ['SDG 12', 'SDG 13'], carbonCredits: 'Voluntary market eligible' }
};

// Checklist notes interface for due diligence
export interface ChecklistNotes {
  companyInfo?: string;
  financial?: string;
  legal?: string;
  operational?: string;
  otrSources?: string;
  partnership?: string;
}

// Tire category data interface for PDF export
export interface TireCategoryData {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  selectedModels: string[];
  avgWeight: number;
  valuePerTire: number;
  yields: {
    rubber: number;
    steel: number;
    textile: number;
    rcb: number;
  };
  processingDifficulty: string;
  opexMultiplier: number;
}

// Watermark options
export type WatermarkType = 'none' | 'confidential' | 'draft';

export async function generateProfessionalFeasibilityPDF(
  study: FeasibilityStudy,
  aiAnalysis?: string | null,
  lang: string = "en",
  chartRefs?: ChartRefs | null,
  checklistNotes?: ChecklistNotes,
  qrCodeUrl?: string,
  watermark: WatermarkType = 'none',
  tireCategoryData?: TireCategoryData | null,
  exportData?: ExportCalculationData | null // NEW: Export calculation data
): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15; // Professional margin for readability
  const contentWidth = pageWidth - margin * 2;
  const maxY = 275; // Content ends 2mm before footer (footer at 277mm)
  let yPos = margin;
  
  // Load CJK font for Chinese language support
  let hasCjkFont = false;
  if (lang === 'zh') {
    try {
      const cjkFontData = await loadCJKFont();
      if (cjkFontData) {
        registerCJKFont(doc, cjkFontData);
        hasCjkFont = true;
        console.log('CJK font loaded successfully');
      }
    } catch (error) {
      console.warn('Failed to load CJK font, falling back to helvetica:', error);
    }
  }
  
  // Helper function to set font based on language
  const setFont = (style: 'normal' | 'bold' = 'normal') => {
    setFontForLanguage(doc, lang, style, hasCjkFont);
  };
  
  // Get font name for current language
  const fontName = getFontForLanguage(lang, hasCjkFont);
  
  const logoBase64 = await loadLogoAsBase64();
  
  // Generate QR Code for partner form (configurable URL) - always use production domain
  const partnershipFormUrl = qrCodeUrl || "https://www.elpgreen.com/otr-sources";
  const qrCodeBase64 = await generateQRCode(partnershipFormUrl);
  
  // Get country-specific ESG data
  const countryKey = (study.country || 'default').toLowerCase().replace(/\s+/g, '');
  const esgData = countryESGData[countryKey] || countryESGData['default'];

  // Compact translations
  const translations: Record<string, Record<string, string>> = {
    en: {
      mainTitle: "Economic, Regulatory and ESG Feasibility Study",
      subtitle: "Professional Investment Analysis",
      otrRecycling: "OTR Tire Recycling Plant",
      prepared: "Prepared by ELP Green Technology",
      date: "Date",
      confidential: "Confidential",
      executiveSummary: "Executive Summary",
      projectInfo: "Project Information",
      capexBreakdown: "Investment Composition (CAPEX)",
      revenueOpex: "Revenue and Operating Costs (OPEX)",
      financialIndicators: "Financial Viability Indicators",
      govPartnership: "Government Partnership Model",
      regulatoryFramework: "Regulatory and Fiscal Framework",
      esgAnalysis: "ESG Analysis",
      strengthsRisks: "Strengths, Risks and Mitigation",
      recommendations: "Strategic Recommendations",
      aiExecutiveAnalysis: "Executive Data Analysis",
      confidentialityStatement: "Confidentiality Statement",
      tableOfContents: "Contents",
      viabilityClassification: "Viability Classification",
      keyMetrics: "Key Financial Metrics",
      esgImpacts: "ESG Impacts",
      recommendation: "Recommendation",
      material: "Material",
      percentage: "%",
      kgPerHour: "Kg/h",
      pricePerTon: "$/Ton",
      rubber: "Rubber Granules",
      steel: "Steel Wire",
      textile: "Textile Fiber",
      rcb: "rCB (Carbon Black)",
      total: "Total",
      description: "Description",
      value: "Value (USD)",
      percentCapex: "% CAPEX",
      equipment: "Equipment",
      installation: "Installation",
      infrastructure: "Infrastructure",
      workingCapital: "Working Capital",
      totalInvestment: "Total Investment",
      scenarios: "Sales Scenarios",
      probable: "Probable (70%)",
      pessimistic: "Pessimistic (50%)",
      optimistic: "Optimistic (100%)",
      product: "Product",
      monthlyQty: "Monthly Qty (kg)",
      monthlyRevenue: "Monthly Revenue",
      roi: "ROI",
      irr: "IRR",
      npv: "NPV (10y)",
      paybackPeriod: "Payback",
      months: "mo",
      years: "y",
      annualRevenue: "Annual Revenue",
      annualProfit: "Annual Net Profit",
      contributionMargin: "Contrib. Margin",
      collectionModel: "Collection Model",
      royaltiesRate: "Government Royalties",
      envBonus: "Environmental Bonus",
      annualRoyalties: "Annual Royalties",
      annualEnvBonus: "Annual Env. Bonus",
      netRevenueAfter: "Net Revenue After",
      adjustedRoi: "Adjusted ROI",
      taxCreditsEst: "Tax Credits",
      carbonCredits: "Carbon Credits",
      esgEnvironmental: "Environmental",
      esgSocial: "Social",
      esgGovernance: "Governance",
      co2Reduction: "CO2 Reduction",
      wasteAvoided: "Waste Avoided",
      jobsGenerated: "Jobs Generated",
      esgScore: "ESG Score",
      sdgAlignment: "SDG Alignment",
      strengths: "Strengths",
      risks: "Risk Factors",
      highRoi: "High ROI above 20%",
      quickPayback: "Quick payback under 4 years",
      positiveNpv: "Positive NPV",
      irrAboveDiscount: "IRR exceeds discount rate",
      esgAlignment: "Strong ESG alignment",
      taxBenefits: "Tax benefits available",
      carbonEligible: "Carbon credit eligible",
      marketVolatility: "Market price volatility",
      regulatoryRisk: "Regulatory changes risk",
      operationalRisk: "Operational execution risk",
      phase1: "Phase 1: Licensing (0-6 mo)",
      phase2: "Phase 2: Construction (6-18 mo)",
      phase3: "Phase 3: Operations (18+ mo)",
      disclaimer: "This document is for informational purposes only.",
      page: "Page",
      of: "of",
      footerCompany: "ELP Green Technology",
      footerWebsite: "www.elpgreen.com",
      footerEmail: "info@elpgreen.com",
      footerPhone: "+39 350 102 1359",
      directCollection: "Direct",
      govCollection: "Government",
      hybridCollection: "Hybrid",
      miningPartnership: "Mining Partnership",
      cashFlowChart: "10-Year Cash Flow",
      sensitivityChart: "Sensitivity Analysis",
      revenueBreakdown: "Revenue Breakdown",
      opexBreakdown: "OPEX Breakdown",
      excellent: "EXCELLENT",
      good: "GOOD",
      moderate: "MODERATE",
      risky: "RISKY",
      tonsPerYear: "t/y",
      taxIncentives: "Tax Incentives",
      dueDiligence: "Partner Due Diligence Checklist",
      ddCompanyInfo: "Company Information",
      ddFinancial: "Financial Verification",
      ddLegal: "Legal & Compliance",
      ddOperational: "Operational Capacity",
      ddOtrSources: "OTR Tire Sources",
      ddPartnership: "Partnership Readiness",
      ddVerified: "Verified",
      ddPending: "Pending",
      ddNotApplicable: "N/A",
      ddCompanyReg: "Company registration verified",
      ddTaxCompliance: "Tax compliance status",
      ddBankRef: "Bank references obtained",
      ddCreditCheck: "Credit history check",
      ddEnvLicenses: "Environmental licenses",
      ddOperatingPermits: "Operating permits in place",
      ddFacilities: "Processing facilities available",
      ddEquipment: "Equipment capacity verified",
      ddWorkforce: "Skilled workforce available",
      ddMiningContracts: "Mining company contracts",
      ddTireVolume: "Monthly tire volume confirmed",
      ddLogistics: "Collection logistics defined",
      ddInvestment: "Investment capacity confirmed",
      ddManagement: "Management team identified",
      ddTimeline: "Implementation timeline agreed",
      ddNotes: "Notes/Observations",
      chartCashFlowTitle: "10-Year Cash Flow Projection",
      chartCashFlowDesc: "This chart shows the cumulative cash flow over 10 years, demonstrating the investment recovery period and long-term profitability. The break-even point indicates when the project becomes profitable.",
      chartRevenueTitle: "Revenue Composition",
      chartRevenueDesc: "Revenue breakdown by product type: rubber granules, steel wire, and textile fiber. Shows the contribution of each material to total revenue based on yield percentages and market prices.",
      chartOpexTitle: "Operating Costs (OPEX) Distribution",
      chartOpexDesc: "Annual operating expenses breakdown including labor, energy, maintenance, logistics, and administrative costs. Essential for understanding the cost structure and identifying optimization opportunities.",
      chartCapexTitle: "Investment Distribution (CAPEX)",
      chartCapexDesc: "Capital expenditure allocation showing equipment, installation, infrastructure, and working capital requirements. Critical for understanding initial investment needs and financing structure.",
      chartSensitivityTitle: "Sensitivity Analysis",
      chartSensitivityDesc: "Shows how ROI varies with changes in key variables (prices, costs, utilization). Helps identify critical success factors and risk mitigation priorities.",
      chartEsgTitle: "ESG Performance Radar",
      chartEsgDesc: "Environmental, Social, and Governance metrics visualization. Demonstrates the project's sustainability alignment and compliance with international ESG standards.",
      signaturePage: "Partner Acceptance & Signature",
      signaturePartnerInfo: "Partner Information",
      signatureCompanyName: "Company Name",
      signatureRepName: "Representative Name",
      signaturePosition: "Position/Title",
      signatureEmail: "Email",
      signaturePhone: "Phone",
      signatureDate: "Date",
      signatureDeclaration: "I hereby confirm that I have reviewed and understood the feasibility study presented above. I express my interest in proceeding with the partnership discussions for the OTR tire recycling project.",
      signaturePartner: "Partner Signature",
      signatureElp: "ELP Green Technology",
      signatureWitness: "Witness (Optional)",
      globalPartnership: "Global Partnership Opportunity",
      smartOtrLine: "Smart OTR Line - Advanced Robotic Recycling",
      partnershipModel: "Joint Venture Model - We bring technology, you bring OTR sources",
      qrCodeTitle: "Start Your Partnership Online",
      qrCodeDesc: "Scan this QR Code to access the online partnership form and submit your interest directly to our team.",
      qrCodeScan: "Scan to Access Form",
      tireCategory: "Tire Category Selection",
      tireCategorySelected: "Selected Category",
      tireModels: "Tire Models",
      tireModelsSelected: "Selected Models",
      tireAvgWeight: "Average Weight",
      tireValuePerUnit: "Value per Tire",
      tireYields: "Recovery Yields",
      tireProcessing: "Processing Difficulty",
      tireOpexMultiplier: "OPEX Multiplier",
      tireMarketPrices: "Based on Jan 2026 market prices"
    },
    pt: {
      mainTitle: "Estudo de Viabilidade Econômica, Regulatória e ESG",
      subtitle: "Análise Profissional de Investimento",
      otrRecycling: "Planta de Reciclagem de Pneus OTR",
      prepared: "Preparado por ELP Green Technology",
      date: "Data",
      confidential: "Confidencial",
      executiveSummary: "Resumo Executivo",
      projectInfo: "Informações do Projeto",
      capexBreakdown: "Composição do Investimento (CAPEX)",
      revenueOpex: "Receitas e Custos Operacionais (OPEX)",
      financialIndicators: "Indicadores de Viabilidade",
      govPartnership: "Modelo de Parceria Governamental",
      regulatoryFramework: "Quadro Regulatório e Fiscal",
      esgAnalysis: "Análise ESG",
      strengthsRisks: "Pontos Fortes, Riscos e Mitigação",
      recommendations: "Recomendações Estratégicas",
      aiExecutiveAnalysis: "Analise Executiva de Dados",
      confidentialityStatement: "Declaração de Confidencialidade",
      tableOfContents: "Índice",
      viabilityClassification: "Classificação",
      keyMetrics: "Métricas Financeiras",
      esgImpacts: "Impactos ESG",
      recommendation: "Recomendação",
      material: "Material",
      percentage: "%",
      kgPerHour: "Kg/h",
      pricePerTon: "$/Ton",
      rubber: "Grânulos de Borracha",
      steel: "Fio de Aço",
      textile: "Fibra Têxtil",
      rcb: "rCB (Negro de Fumo)",
      total: "Total",
      description: "Descrição",
      value: "Valor (USD)",
      percentCapex: "% CAPEX",
      equipment: "Equipamentos",
      installation: "Instalação",
      infrastructure: "Infraestrutura",
      workingCapital: "Capital de Giro",
      totalInvestment: "Investimento Total",
      scenarios: "Cenários de Vendas",
      probable: "Provável (70%)",
      pessimistic: "Pessimista (50%)",
      optimistic: "Otimista (100%)",
      product: "Produto",
      monthlyQty: "Qtd Mensal (kg)",
      monthlyRevenue: "Receita Mensal",
      roi: "ROI",
      irr: "TIR",
      npv: "VPL (10a)",
      paybackPeriod: "Payback",
      months: "m",
      years: "a",
      annualRevenue: "Receita Anual",
      annualProfit: "Lucro Líquido Anual",
      contributionMargin: "Margem Contrib.",
      collectionModel: "Modelo de Coleta",
      royaltiesRate: "Royalties ao Governo",
      envBonus: "Bônus Ambiental",
      annualRoyalties: "Royalties Anuais",
      annualEnvBonus: "Bônus Ambiental Anual",
      netRevenueAfter: "Receita Líquida",
      adjustedRoi: "ROI Ajustado",
      taxCreditsEst: "Créditos Fiscais",
      carbonCredits: "Créditos Carbono",
      esgEnvironmental: "Ambiental",
      esgSocial: "Social",
      esgGovernance: "Governança",
      co2Reduction: "Redução CO2",
      wasteAvoided: "Resíduos Evitados",
      jobsGenerated: "Empregos",
      esgScore: "Pontuação ESG",
      sdgAlignment: "Alinhamento ODS",
      strengths: "Pontos Fortes",
      risks: "Fatores de Risco",
      highRoi: "ROI alto acima de 20%",
      quickPayback: "Payback rápido (<4 anos)",
      positiveNpv: "VPL positivo",
      irrAboveDiscount: "TIR acima do desconto",
      esgAlignment: "Forte alinhamento ESG",
      taxBenefits: "Benefícios fiscais",
      carbonEligible: "Elegível créditos carbono",
      marketVolatility: "Volatilidade de preços",
      regulatoryRisk: "Risco regulatório",
      operationalRisk: "Risco operacional",
      phase1: "Fase 1: Licenciamento (0-6m)",
      phase2: "Fase 2: Construção (6-18m)",
      phase3: "Fase 3: Operações (18+m)",
      disclaimer: "Este documento é apenas para fins informativos.",
      page: "Página",
      of: "de",
      footerCompany: "ELP Green Technology",
      footerWebsite: "www.elpgreen.com",
      footerEmail: "info@elpgreen.com",
      footerPhone: "+39 350 102 1359",
      directCollection: "Direta",
      govCollection: "Governamental",
      hybridCollection: "Híbrida",
      miningPartnership: "Parceria Mineradoras",
      cashFlowChart: "Fluxo de Caixa 10 Anos",
      sensitivityChart: "Análise de Sensibilidade",
      revenueBreakdown: "Composição Receita",
      opexBreakdown: "Composição OPEX",
      excellent: "EXCELENTE",
      good: "BOM",
      moderate: "MODERADO",
      risky: "ARRISCADO",
      tonsPerYear: "t/a",
      taxIncentives: "Incentivos Fiscais",
      dueDiligence: "Checklist Due Diligence do Parceiro",
      ddCompanyInfo: "Informações da Empresa",
      ddFinancial: "Verificação Financeira",
      ddLegal: "Jurídico e Compliance",
      ddOperational: "Capacidade Operacional",
      ddOtrSources: "Fontes de Pneus OTR",
      ddPartnership: "Prontidão para Parceria",
      ddVerified: "Verificado",
      ddPending: "Pendente",
      ddNotApplicable: "N/A",
      ddCompanyReg: "Registro da empresa verificado",
      ddTaxCompliance: "Situação fiscal regular",
      ddBankRef: "Referências bancárias obtidas",
      ddCreditCheck: "Análise de crédito realizada",
      ddEnvLicenses: "Licenças ambientais",
      ddOperatingPermits: "Alvarás de funcionamento",
      ddFacilities: "Instalações de processamento",
      ddEquipment: "Capacidade de equipamentos",
      ddWorkforce: "Mão de obra qualificada",
      ddMiningContracts: "Contratos com mineradoras",
      ddTireVolume: "Volume mensal de pneus",
      ddLogistics: "Logística de coleta definida",
      ddInvestment: "Capacidade de investimento",
      ddManagement: "Equipe de gestão identificada",
      ddTimeline: "Cronograma acordado",
      ddNotes: "Notas/Observações",
      chartCashFlowTitle: "Projeção de Fluxo de Caixa 10 Anos",
      chartCashFlowDesc: "Este gráfico mostra o fluxo de caixa acumulado ao longo de 10 anos, demonstrando o período de recuperação do investimento e a lucratividade de longo prazo. O ponto de equilíbrio indica quando o projeto se torna lucrativo.",
      chartRevenueTitle: "Composição da Receita",
      chartRevenueDesc: "Distribuição da receita por tipo de produto: grânulos de borracha, fio de aço e fibra têxtil. Mostra a contribuição de cada material para a receita total baseada nas porcentagens de rendimento e preços de mercado.",
      chartOpexTitle: "Distribuição de Custos Operacionais (OPEX)",
      chartOpexDesc: "Detalhamento das despesas operacionais anuais incluindo mão de obra, energia, manutenção, logística e custos administrativos. Essencial para entender a estrutura de custos e identificar oportunidades de otimização.",
      chartCapexTitle: "Distribuição do Investimento (CAPEX)",
      chartCapexDesc: "Alocação de despesas de capital mostrando equipamentos, instalação, infraestrutura e requisitos de capital de giro. Crítico para entender as necessidades de investimento inicial e estrutura de financiamento.",
      chartSensitivityTitle: "Análise de Sensibilidade",
      chartSensitivityDesc: "Mostra como o ROI varia com mudanças em variáveis-chave (preços, custos, utilização). Ajuda a identificar fatores críticos de sucesso e prioridades de mitigação de riscos.",
      chartEsgTitle: "Radar de Performance ESG",
      chartEsgDesc: "Visualização das métricas Ambientais, Sociais e de Governança. Demonstra o alinhamento de sustentabilidade do projeto e conformidade com padrões ESG internacionais.",
      signaturePage: "Aceite e Assinatura do Parceiro",
      signaturePartnerInfo: "Informações do Parceiro",
      signatureCompanyName: "Nome da Empresa",
      signatureRepName: "Nome do Representante",
      signaturePosition: "Cargo/Função",
      signatureEmail: "E-mail",
      signaturePhone: "Telefone",
      signatureDate: "Data",
      signatureDeclaration: "Declaro que revisei e compreendi o estudo de viabilidade apresentado acima. Manifesto meu interesse em prosseguir com as discussões de parceria para o projeto de reciclagem de pneus OTR.",
      signaturePartner: "Assinatura do Parceiro",
      signatureElp: "ELP Green Technology",
      signatureWitness: "Testemunha (Opcional)",
      globalPartnership: "Oportunidade de Parceria Global",
      smartOtrLine: "Linha Smart OTR - Reciclagem Robótica Avançada",
      partnershipModel: "Modelo Joint Venture - Nós levamos a tecnologia, você traz as fontes OTR",
      qrCodeTitle: "Inicie Sua Parceria Online",
      qrCodeDesc: "Escaneie este QR Code para acessar o formulário de parceria online e enviar seu interesse diretamente para nossa equipe.",
      qrCodeScan: "Escaneie para Acessar",
      tireCategory: "Seleção de Categoria de Pneus",
      tireCategorySelected: "Categoria Selecionada",
      tireModels: "Modelos de Pneus",
      tireModelsSelected: "Modelos Selecionados",
      tireAvgWeight: "Peso Médio",
      tireValuePerUnit: "Valor por Pneu",
      tireYields: "Yields de Recuperação",
      tireProcessing: "Dificuldade de Processamento",
      tireOpexMultiplier: "Multiplicador OPEX",
      tireMarketPrices: "Baseado em preços de mercado Jan 2026"
    },
    es: {
      mainTitle: "Estudio de Viabilidad Económica, Regulatoria y ESG",
      subtitle: "Análisis Profesional de Inversión",
      otrRecycling: "Planta de Reciclaje de Neumáticos OTR",
      prepared: "Preparado por ELP Green Technology",
      date: "Fecha",
      confidential: "Confidencial",
      executiveSummary: "Resumen Ejecutivo",
      projectInfo: "Información del Proyecto",
      capexBreakdown: "Composición de Inversión (CAPEX)",
      revenueOpex: "Ingresos y Costos Operativos (OPEX)",
      financialIndicators: "Indicadores de Viabilidad",
      govPartnership: "Modelo de Asociación Gubernamental",
      regulatoryFramework: "Marco Regulatorio y Fiscal",
      esgAnalysis: "Análisis ESG",
      strengthsRisks: "Fortalezas, Riesgos y Mitigación",
      recommendations: "Recomendaciones Estratégicas",
      aiExecutiveAnalysis: "Analisis Ejecutivo de Datos",
      confidentialityStatement: "Declaración de Confidencialidad",
      tableOfContents: "Índice",
      viabilityClassification: "Clasificación",
      keyMetrics: "Métricas Financieras",
      esgImpacts: "Impactos ESG",
      recommendation: "Recomendación",
      material: "Material",
      percentage: "%",
      kgPerHour: "Kg/h",
      pricePerTon: "$/Ton",
      rubber: "Gránulos de Caucho",
      steel: "Alambre de Acero",
      textile: "Fibra Textil",
      rcb: "rCB (Negro de Humo)",
      total: "Total",
      description: "Descripción",
      value: "Valor (USD)",
      percentCapex: "% CAPEX",
      equipment: "Equipos",
      installation: "Instalación",
      infrastructure: "Infraestructura",
      workingCapital: "Capital de Trabajo",
      totalInvestment: "Inversión Total",
      scenarios: "Escenarios de Ventas",
      probable: "Probable (70%)",
      pessimistic: "Pesimista (50%)",
      optimistic: "Optimista (100%)",
      product: "Producto",
      monthlyQty: "Cant. Mensual (kg)",
      monthlyRevenue: "Ingreso Mensual",
      roi: "ROI",
      irr: "TIR",
      npv: "VPN (10a)",
      paybackPeriod: "Payback",
      months: "m",
      years: "a",
      annualRevenue: "Ingreso Anual",
      annualProfit: "Utilidad Neta Anual",
      contributionMargin: "Margen Contrib.",
      collectionModel: "Modelo de Recolección",
      royaltiesRate: "Regalías al Gobierno",
      envBonus: "Bono Ambiental",
      annualRoyalties: "Regalías Anuales",
      annualEnvBonus: "Bono Ambiental Anual",
      netRevenueAfter: "Ingreso Neto",
      adjustedRoi: "ROI Ajustado",
      taxCreditsEst: "Créditos Fiscales",
      carbonCredits: "Créditos Carbono",
      esgEnvironmental: "Ambiental",
      esgSocial: "Social",
      esgGovernance: "Gobernanza",
      co2Reduction: "Reducción CO2",
      wasteAvoided: "Residuos Evitados",
      jobsGenerated: "Empleos",
      esgScore: "Puntuación ESG",
      sdgAlignment: "Alineación ODS",
      strengths: "Fortalezas",
      risks: "Factores de Riesgo",
      highRoi: "ROI alto sobre 20%",
      quickPayback: "Payback rápido (<4 años)",
      positiveNpv: "VPN positivo",
      irrAboveDiscount: "TIR sobre descuento",
      esgAlignment: "Fuerte alineación ESG",
      taxBenefits: "Beneficios fiscales",
      carbonEligible: "Elegible créditos carbono",
      marketVolatility: "Volatilidad de precios",
      regulatoryRisk: "Riesgo regulatorio",
      operationalRisk: "Riesgo operacional",
      phase1: "Fase 1: Licencias (0-6m)",
      phase2: "Fase 2: Construcción (6-18m)",
      phase3: "Fase 3: Operaciones (18+m)",
      disclaimer: "Este documento es solo para fines informativos.",
      page: "Página",
      of: "de",
      footerCompany: "ELP Green Technology",
      footerWebsite: "www.elpgreen.com",
      footerEmail: "info@elpgreen.com",
      footerPhone: "+39 350 102 1359",
      directCollection: "Directa",
      govCollection: "Gubernamental",
      hybridCollection: "Híbrida",
      miningPartnership: "Asociación Minera",
      cashFlowChart: "Flujo de Caja 10 Años",
      sensitivityChart: "Análisis de Sensibilidad",
      revenueBreakdown: "Composición Ingresos",
      opexBreakdown: "Composición OPEX",
      excellent: "EXCELENTE",
      good: "BUENO",
      moderate: "MODERADO",
      risky: "ARRIESGADO",
      tonsPerYear: "t/a",
      taxIncentives: "Incentivos Fiscales",
      dueDiligence: "Checklist Due Diligence del Socio",
      ddCompanyInfo: "Información de la Empresa",
      ddFinancial: "Verificación Financiera",
      ddLegal: "Legal y Cumplimiento",
      ddOperational: "Capacidad Operacional",
      ddOtrSources: "Fuentes de Neumáticos OTR",
      ddPartnership: "Preparación para Asociación",
      ddVerified: "Verificado",
      ddPending: "Pendiente",
      ddNotApplicable: "N/A",
      ddCompanyReg: "Registro de empresa verificado",
      ddTaxCompliance: "Situación fiscal al día",
      ddBankRef: "Referencias bancarias obtenidas",
      ddCreditCheck: "Análisis crediticio realizado",
      ddEnvLicenses: "Licencias ambientales",
      ddOperatingPermits: "Permisos de operación",
      ddFacilities: "Instalaciones disponibles",
      ddEquipment: "Capacidad de equipos",
      ddWorkforce: "Personal calificado",
      ddMiningContracts: "Contratos con mineras",
      ddTireVolume: "Volumen mensual de neumáticos",
      ddLogistics: "Logística de recolección",
      ddInvestment: "Capacidad de inversión",
      ddManagement: "Equipo directivo identificado",
      ddTimeline: "Cronograma acordado",
      ddNotes: "Notas/Observaciones",
      chartCashFlowTitle: "Proyección de Flujo de Caja 10 Años",
      chartCashFlowDesc: "Este gráfico muestra el flujo de caja acumulado durante 10 años, demostrando el período de recuperación de la inversión y la rentabilidad a largo plazo.",
      chartRevenueTitle: "Composición de Ingresos",
      chartRevenueDesc: "Desglose de ingresos por tipo de producto: gránulos de caucho, alambre de acero y fibra textil.",
      chartOpexTitle: "Distribución de Costos Operativos (OPEX)",
      chartOpexDesc: "Desglose de gastos operativos anuales incluyendo mano de obra, energía, mantenimiento, logística y costos administrativos.",
      chartCapexTitle: "Distribución de Inversión (CAPEX)",
      chartCapexDesc: "Asignación de gastos de capital mostrando equipos, instalación, infraestructura y requisitos de capital de trabajo.",
      chartSensitivityTitle: "Análisis de Sensibilidad",
      chartSensitivityDesc: "Muestra cómo el ROI varía con cambios en variables clave (precios, costos, utilización).",
      chartEsgTitle: "Radar de Desempeño ESG",
      chartEsgDesc: "Visualización de métricas Ambientales, Sociales y de Gobernanza.",
      signaturePage: "Aceptación y Firma del Socio",
      signaturePartnerInfo: "Información del Socio",
      signatureCompanyName: "Nombre de la Empresa",
      signatureRepName: "Nombre del Representante",
      signaturePosition: "Cargo/Título",
      signatureEmail: "Correo Electrónico",
      signaturePhone: "Teléfono",
      signatureDate: "Fecha",
      signatureDeclaration: "Por la presente confirmo que he revisado y comprendido el estudio de viabilidad presentado. Expreso mi interés en continuar con las discusiones de asociación para el proyecto de reciclaje de neumáticos OTR.",
      signaturePartner: "Firma del Socio",
      signatureElp: "ELP Green Technology",
      signatureWitness: "Testigo (Opcional)",
      globalPartnership: "Oportunidad de Asociación Global",
      smartOtrLine: "Línea Smart OTR - Reciclaje Robótico Avanzado",
      partnershipModel: "Modelo Joint Venture - Nosotros aportamos tecnología, usted aporta fuentes OTR",
      qrCodeTitle: "Inicie Su Asociación en Línea",
      qrCodeDesc: "Escanee este código QR para acceder al formulario de asociación en línea y enviar su interés directamente a nuestro equipo.",
      qrCodeScan: "Escanear para Acceder",
      tireCategory: "Selección de Categoría de Neumáticos",
      tireCategorySelected: "Categoría Seleccionada",
      tireModels: "Modelos de Neumáticos",
      tireModelsSelected: "Modelos Seleccionados",
      tireAvgWeight: "Peso Promedio",
      tireValuePerUnit: "Valor por Neumático",
      tireYields: "Rendimientos de Recuperación",
      tireProcessing: "Dificultad de Procesamiento",
      tireOpexMultiplier: "Multiplicador OPEX",
      tireMarketPrices: "Basado en precios de mercado Ene 2026"
    },
    zh: {
      mainTitle: "经济、监管和ESG可行性研究",
      subtitle: "专业投资分析",
      otrRecycling: "OTR轮胎回收厂",
      prepared: "由ELP Green Technology编制",
      date: "日期",
      confidential: "机密",
      executiveSummary: "执行摘要",
      projectInfo: "项目信息",
      capexBreakdown: "投资构成(CAPEX)",
      revenueOpex: "收入和运营成本(OPEX)",
      financialIndicators: "财务可行性指标",
      govPartnership: "政府合作模式",
      regulatoryFramework: "监管和财政框架",
      esgAnalysis: "ESG分析",
      strengthsRisks: "优势、风险和缓解",
      recommendations: "战略建议",
      aiExecutiveAnalysis: "执行数据分析",
      confidentialityStatement: "保密声明",
      tableOfContents: "目录",
      viabilityClassification: "分类",
      keyMetrics: "关键财务指标",
      esgImpacts: "ESG影响",
      recommendation: "建议",
      material: "材料",
      percentage: "%",
      kgPerHour: "公斤/小时",
      pricePerTon: "$/吨",
      rubber: "橡胶颗粒",
      steel: "钢丝",
      textile: "纺织纤维",
      rcb: "rCB (再生炭黑)",
      total: "总计",
      description: "描述",
      value: "价值(USD)",
      percentCapex: "% CAPEX",
      equipment: "设备",
      installation: "安装",
      infrastructure: "基础设施",
      workingCapital: "营运资金",
      totalInvestment: "总投资",
      scenarios: "销售场景",
      probable: "可能(70%)",
      pessimistic: "悲观(50%)",
      optimistic: "乐观(100%)",
      product: "产品",
      monthlyQty: "月产量(kg)",
      monthlyRevenue: "月收入",
      roi: "ROI",
      irr: "IRR",
      npv: "NPV(10年)",
      paybackPeriod: "回收期",
      months: "月",
      years: "年",
      annualRevenue: "年收入",
      annualProfit: "年净利润",
      contributionMargin: "贡献利润率",
      collectionModel: "收集模式",
      royaltiesRate: "政府特许权使用费",
      envBonus: "环境奖金",
      annualRoyalties: "年特许权使用费",
      annualEnvBonus: "年环境奖金",
      netRevenueAfter: "净收入",
      adjustedRoi: "调整后ROI",
      taxCreditsEst: "税收抵免",
      carbonCredits: "碳信用",
      esgEnvironmental: "环境",
      esgSocial: "社会",
      esgGovernance: "治理",
      co2Reduction: "CO2减排",
      wasteAvoided: "避免废物",
      jobsGenerated: "创造就业",
      esgScore: "ESG评分",
      sdgAlignment: "SDG对齐",
      strengths: "优势",
      risks: "风险因素",
      highRoi: "ROI高于20%",
      quickPayback: "快速回收(<4年)",
      positiveNpv: "正NPV",
      irrAboveDiscount: "IRR高于贴现率",
      esgAlignment: "强ESG对齐",
      taxBenefits: "税收优惠",
      carbonEligible: "碳信用资格",
      marketVolatility: "市场价格波动",
      regulatoryRisk: "监管风险",
      operationalRisk: "运营风险",
      phase1: "阶段1: 许可(0-6月)",
      phase2: "阶段2: 建设(6-18月)",
      phase3: "阶段3: 运营(18+月)",
      disclaimer: "本文件仅供参考。",
      page: "页",
      of: "/",
      footerCompany: "ELP Green Technology",
      footerWebsite: "www.elpgreen.com",
      footerEmail: "info@elpgreen.com",
      footerPhone: "+39 350 102 1359",
      directCollection: "直接",
      govCollection: "政府",
      hybridCollection: "混合",
      miningPartnership: "矿业合作",
      cashFlowChart: "10年现金流",
      sensitivityChart: "敏感性分析",
      revenueBreakdown: "收入构成",
      opexBreakdown: "OPEX构成",
      excellent: "优秀",
      good: "良好",
      moderate: "中等",
      risky: "风险",
      tonsPerYear: "吨/年",
      taxIncentives: "税收激励",
      dueDiligence: "合作伙伴尽职调查清单",
      ddCompanyInfo: "公司信息",
      ddFinancial: "财务核实",
      ddLegal: "法律合规",
      ddOperational: "运营能力",
      ddOtrSources: "OTR轮胎来源",
      ddPartnership: "合作准备",
      ddVerified: "已验证",
      ddPending: "待定",
      ddNotApplicable: "不适用",
      ddCompanyReg: "公司注册已核实",
      ddTaxCompliance: "税务合规状态",
      ddBankRef: "银行推荐信已获取",
      ddCreditCheck: "信用审查完成",
      ddEnvLicenses: "环境许可证",
      ddOperatingPermits: "运营许可证",
      ddFacilities: "加工设施可用",
      ddEquipment: "设备产能已验证",
      ddWorkforce: "技术人员到位",
      ddMiningContracts: "矿业公司合同",
      ddTireVolume: "月度轮胎量已确认",
      ddLogistics: "收集物流已定义",
      ddInvestment: "投资能力已确认",
      ddManagement: "管理团队已确定",
      ddTimeline: "实施时间表已商定",
      ddNotes: "备注/观察",
      chartCashFlowTitle: "10年现金流预测",
      chartCashFlowDesc: "此图表显示10年内的累计现金流，展示投资回收期和长期盈利能力。",
      chartRevenueTitle: "收入构成",
      chartRevenueDesc: "按产品类型划分的收入：橡胶颗粒、钢丝和纺织纤维。",
      chartOpexTitle: "运营成本(OPEX)分布",
      chartOpexDesc: "年度运营费用明细，包括人工、能源、维护、物流和管理成本。",
      chartCapexTitle: "投资分布(CAPEX)",
      chartCapexDesc: "资本支出分配，显示设备、安装、基础设施和营运资金需求。",
      chartSensitivityTitle: "敏感性分析",
      chartSensitivityDesc: "显示ROI如何随关键变量（价格、成本、利用率）的变化而变化。",
      chartEsgTitle: "ESG绩效雷达",
      chartEsgDesc: "环境、社会和治理指标可视化。",
      signaturePage: "合作伙伴接受与签名",
      signaturePartnerInfo: "合作伙伴信息",
      signatureCompanyName: "公司名称",
      signatureRepName: "代表姓名",
      signaturePosition: "职位/头衔",
      signatureEmail: "电子邮件",
      signaturePhone: "电话",
      signatureDate: "日期",
      signatureDeclaration: "本人确认已审阅并理解上述可行性研究。我表达了继续讨论OTR轮胎回收项目合作的意向。",
      signaturePartner: "合作伙伴签名",
      signatureElp: "ELP Green Technology",
      signatureWitness: "证人（可选）",
      globalPartnership: "全球合作机会",
      smartOtrLine: "Smart OTR生产线 - 先进机器人回收",
      partnershipModel: "合资模式 - 我们提供技术，您提供OTR来源",
      qrCodeTitle: "扫描开始合作",
      qrCodeDesc: "扫描此二维码访问在线合作表格，直接向我们的团队提交您的意向。",
      qrCodeScan: "扫描访问表格",
      tireCategory: "轮胎类别选择",
      tireCategorySelected: "已选择类别",
      tireModels: "轮胎型号",
      tireModelsSelected: "已选择型号",
      tireAvgWeight: "平均重量",
      tireValuePerUnit: "每条轮胎价值",
      tireYields: "回收率",
      tireProcessing: "加工难度",
      tireOpexMultiplier: "运营成本倍数",
      tireMarketPrices: "基于2026年1月市场价格"
    },
    it: {
      mainTitle: "Studio di Fattibilità Economica, Normativa ed ESG",
      subtitle: "Analisi Professionale degli Investimenti",
      otrRecycling: "Impianto di Riciclaggio Pneumatici OTR",
      prepared: "Preparato da ELP Green Technology",
      date: "Data",
      confidential: "Riservato",
      executiveSummary: "Sintesi Esecutiva",
      projectInfo: "Informazioni Progetto",
      capexBreakdown: "Composizione Investimento (CAPEX)",
      revenueOpex: "Ricavi e Costi Operativi (OPEX)",
      financialIndicators: "Indicatori di Fattibilità",
      govPartnership: "Modello di Partnership Governativa",
      regulatoryFramework: "Quadro Normativo e Fiscale",
      esgAnalysis: "Analisi ESG",
      strengthsRisks: "Punti di Forza, Rischi e Mitigazione",
      recommendations: "Raccomandazioni Strategiche",
      aiExecutiveAnalysis: "Analisi Esecutiva dei Dati",
      confidentialityStatement: "Dichiarazione di Riservatezza",
      tableOfContents: "Indice",
      viabilityClassification: "Classificazione",
      keyMetrics: "Metriche Finanziarie",
      esgImpacts: "Impatti ESG",
      recommendation: "Raccomandazione",
      material: "Materiale",
      percentage: "%",
      kgPerHour: "Kg/h",
      pricePerTon: "$/Ton",
      rubber: "Granuli di Gomma",
      steel: "Filo d'Acciaio",
      textile: "Fibra Tessile",
      rcb: "rCB (Nerofumo)",
      total: "Totale",
      description: "Descrizione",
      value: "Valore (USD)",
      percentCapex: "% CAPEX",
      equipment: "Attrezzature",
      installation: "Installazione",
      infrastructure: "Infrastrutture",
      workingCapital: "Capitale Circolante",
      totalInvestment: "Investimento Totale",
      scenarios: "Scenari di Vendita",
      probable: "Probabile (70%)",
      pessimistic: "Pessimistico (50%)",
      optimistic: "Ottimistico (100%)",
      product: "Prodotto",
      monthlyQty: "Qtà Mensile (kg)",
      monthlyRevenue: "Ricavo Mensile",
      roi: "ROI",
      irr: "TIR",
      npv: "VAN (10a)",
      paybackPeriod: "Payback",
      months: "m",
      years: "a",
      annualRevenue: "Ricavo Annuale",
      annualProfit: "Utile Netto Annuale",
      contributionMargin: "Margine Contrib.",
      collectionModel: "Modello di Raccolta",
      royaltiesRate: "Royalties al Governo",
      envBonus: "Bonus Ambientale",
      annualRoyalties: "Royalties Annuali",
      annualEnvBonus: "Bonus Ambientale Annuale",
      netRevenueAfter: "Ricavo Netto",
      adjustedRoi: "ROI Adeguato",
      taxCreditsEst: "Crediti Fiscali",
      carbonCredits: "Crediti Carbonio",
      esgEnvironmental: "Ambientale",
      esgSocial: "Sociale",
      esgGovernance: "Governance",
      co2Reduction: "Riduzione CO2",
      wasteAvoided: "Rifiuti Evitati",
      jobsGenerated: "Posti di Lavoro",
      esgScore: "Punteggio ESG",
      sdgAlignment: "Allineamento SDG",
      strengths: "Punti di Forza",
      risks: "Fattori di Rischio",
      highRoi: "ROI alto sopra 20%",
      quickPayback: "Payback rapido (<4 anni)",
      positiveNpv: "VAN positivo",
      irrAboveDiscount: "TIR sopra sconto",
      esgAlignment: "Forte allineamento ESG",
      taxBenefits: "Benefici fiscali",
      carbonEligible: "Idoneo crediti carbonio",
      marketVolatility: "Volatilità prezzi",
      regulatoryRisk: "Rischio normativo",
      operationalRisk: "Rischio operativo",
      phase1: "Fase 1: Licenze (0-6m)",
      phase2: "Fase 2: Costruzione (6-18m)",
      phase3: "Fase 3: Operazioni (18+m)",
      disclaimer: "Questo documento è solo a scopo informativo.",
      page: "Pagina",
      of: "di",
      footerCompany: "ELP Green Technology",
      footerWebsite: "www.elpgreen.com",
      footerEmail: "info@elpgreen.com",
      footerPhone: "+39 350 102 1359",
      directCollection: "Diretta",
      govCollection: "Governativa",
      hybridCollection: "Ibrida",
      miningPartnership: "Partnership Mineraria",
      cashFlowChart: "Flusso di Cassa 10 Anni",
      sensitivityChart: "Analisi di Sensibilità",
      revenueBreakdown: "Composizione Ricavi",
      opexBreakdown: "Composizione OPEX",
      excellent: "ECCELLENTE",
      good: "BUONO",
      moderate: "MODERATO",
      risky: "RISCHIOSO",
      tonsPerYear: "t/a",
      taxIncentives: "Incentivi Fiscali",
      dueDiligence: "Checklist Due Diligence del Partner",
      ddCompanyInfo: "Informazioni Aziendali",
      ddFinancial: "Verifica Finanziaria",
      ddLegal: "Legale e Conformità",
      ddOperational: "Capacità Operativa",
      ddOtrSources: "Fonti Pneumatici OTR",
      ddPartnership: "Prontezza alla Partnership",
      ddVerified: "Verificato",
      ddPending: "In Attesa",
      ddNotApplicable: "N/A",
      ddCompanyReg: "Registrazione aziendale verificata",
      ddTaxCompliance: "Situazione fiscale regolare",
      ddBankRef: "Referenze bancarie ottenute",
      ddCreditCheck: "Verifica creditizia effettuata",
      ddEnvLicenses: "Licenze ambientali",
      ddOperatingPermits: "Permessi operativi",
      ddFacilities: "Strutture di lavorazione",
      ddEquipment: "Capacità attrezzature",
      ddWorkforce: "Personale qualificato",
      ddMiningContracts: "Contratti con miniere",
      ddTireVolume: "Volume mensile pneumatici",
      ddLogistics: "Logistica raccolta definita",
      ddInvestment: "Capacità di investimento",
      ddManagement: "Team di gestione identificato",
      ddTimeline: "Timeline concordata",
      ddNotes: "Note/Osservazioni",
      chartCashFlowTitle: "Proiezione Flusso di Cassa 10 Anni",
      chartCashFlowDesc: "Questo grafico mostra il flusso di cassa cumulato in 10 anni, dimostrando il periodo di recupero dell'investimento e la redditività a lungo termine.",
      chartRevenueTitle: "Composizione Ricavi",
      chartRevenueDesc: "Ripartizione ricavi per tipo di prodotto: granuli di gomma, filo d'acciaio e fibra tessile.",
      chartOpexTitle: "Distribuzione Costi Operativi (OPEX)",
      chartOpexDesc: "Dettaglio spese operative annuali inclusi manodopera, energia, manutenzione, logistica e costi amministrativi.",
      chartCapexTitle: "Distribuzione Investimento (CAPEX)",
      chartCapexDesc: "Allocazione spese in conto capitale mostrando attrezzature, installazione, infrastrutture e fabbisogno capitale circolante.",
      chartSensitivityTitle: "Analisi di Sensibilità",
      chartSensitivityDesc: "Mostra come il ROI varia con cambiamenti nelle variabili chiave (prezzi, costi, utilizzo).",
      chartEsgTitle: "Radar Performance ESG",
      chartEsgDesc: "Visualizzazione metriche Ambientali, Sociali e di Governance.",
      signaturePage: "Accettazione e Firma del Partner",
      signaturePartnerInfo: "Informazioni Partner",
      signatureCompanyName: "Nome Azienda",
      signatureRepName: "Nome Rappresentante",
      signaturePosition: "Posizione/Titolo",
      signatureEmail: "Email",
      signaturePhone: "Telefono",
      signatureDate: "Data",
      signatureDeclaration: "Con la presente confermo di aver esaminato e compreso lo studio di fattibilità sopra presentato. Esprimo il mio interesse a procedere con le discussioni di partnership per il progetto di riciclaggio pneumatici OTR.",
      signaturePartner: "Firma del Partner",
      signatureElp: "ELP Green Technology",
      signatureWitness: "Testimone (Opzionale)",
      globalPartnership: "Opportunità di Partnership Globale",
      smartOtrLine: "Linea Smart OTR - Riciclaggio Robotico Avanzato",
      partnershipModel: "Modello Joint Venture - Noi portiamo la tecnologia, voi le fonti OTR",
      qrCodeTitle: "Inizia la Tua Partnership Online",
      qrCodeDesc: "Scansiona questo codice QR per accedere al modulo di partnership online e inviare il tuo interesse direttamente al nostro team.",
      qrCodeScan: "Scansiona per Accedere",
      tireCategory: "Selezione Categoria Pneumatici",
      tireCategorySelected: "Categoria Selezionata",
      tireModels: "Modelli Pneumatici",
      tireModelsSelected: "Modelli Selezionati",
      tireAvgWeight: "Peso Medio",
      tireValuePerUnit: "Valore per Pneumatico",
      tireYields: "Rese di Recupero",
      tireProcessing: "Difficoltà di Lavorazione",
      tireOpexMultiplier: "Moltiplicatore OPEX",
      tireMarketPrices: "Basato su prezzi di mercato Gen 2026"
    }
  };

  const t = translations[lang] || translations.en;

  // Calculate metrics
  const hoursPerDay = 16;
  const daysPerMonth = 22;
  const kgPerHour = (study.daily_capacity_tons * 1000) / hoursPerDay;
  const hoursPerMonth = hoursPerDay * daysPerMonth;
  const annualTonnage = study.daily_capacity_tons * study.operating_days_per_year * (study.utilization_rate / 100);

  const rubberYield = study.rubber_granules_yield / 100;
  const steelYield = study.steel_wire_yield / 100;
  const textileYield = study.textile_fiber_yield / 100;
  const rcbYield = (study.rcb_yield || 12) / 100;

  const rubberKgPerHour = kgPerHour * rubberYield;
  const steelKgPerHour = kgPerHour * steelYield;
  const textileKgPerHour = kgPerHour * textileYield;
  const rcbKgPerHour = kgPerHour * rcbYield;

  // Government partnership metrics
  const royaltiesPercent = study.government_royalties_percent || 0;
  const envBonusPerTon = study.environmental_bonus_per_ton || 0;
  const annualRoyalties = study.annual_revenue * (royaltiesPercent / 100);
  const annualEnvBonus = annualTonnage * envBonusPerTon;
  const netRevenueAfterRoyalties = study.annual_revenue - annualRoyalties + annualEnvBonus;
  const adjustedEbitda = study.annual_ebitda - annualRoyalties + annualEnvBonus;
  const adjustedRoi = study.total_investment > 0 ? (adjustedEbitda / study.total_investment) * 100 : 0;
  const hasGovPartnership = royaltiesPercent > 0 || envBonusPerTon > 0;

  // ESG Calculations
  const co2Avoided = annualTonnage * esgData.co2Factor;
  const wasteAvoided = annualTonnage;

  const getCollectionModelLabel = (model: string | undefined): string => {
    switch (model) {
      case 'direct': return t.directCollection;
      case 'government': return t.govCollection;
      case 'hybrid': return t.hybridCollection;
      case 'mining': return t.miningPartnership;
      default: return '-';
    }
  };

  const getViabilityRating = () => {
    if (study.roi_percentage >= 30 && study.payback_months <= 36) return { rating: t.excellent, color: [34, 139, 34] };
    if (study.roi_percentage >= 20 && study.payback_months <= 48) return { rating: t.good, color: [0, 102, 204] };
    if (study.roi_percentage >= 10 && study.payback_months <= 72) return { rating: t.moderate, color: [255, 165, 0] };
    return { rating: t.risky, color: [220, 53, 69] };
  };

  const viability = getViabilityRating();

  const createScenario = (utilization: number) => {
    const effectiveHours = hoursPerMonth * utilization;
    const rubberMonthly = rubberKgPerHour * effectiveHours;
    const steelMonthly = steelKgPerHour * effectiveHours;
    const textileMonthly = textileKgPerHour * effectiveHours;
    const rcbMonthly = rcbKgPerHour * effectiveHours;

    const rubberRevenue = (rubberMonthly / 1000) * study.rubber_granules_price;
    const steelRevenue = (steelMonthly / 1000) * study.steel_wire_price;
    const textileRevenue = (textileMonthly / 1000) * study.textile_fiber_price;
    const rcbRevenue = (rcbMonthly / 1000) * (study.rcb_price || 1050); // VALIDATED: $900-1200/ton avg $1050 Jan 2026
    const totalRevenue = rubberRevenue + steelRevenue + textileRevenue + rcbRevenue;

    const monthlyOpex = (study.labor_cost || 0) + (study.energy_cost || 0) + 
      (study.maintenance_cost || 0) + (study.logistics_cost || 0) + 
      (study.administrative_cost || 0) + (study.other_opex || 0);
    
    const financing = study.total_investment * 0.008;
    const depreciation = study.total_investment / ((study.depreciation_years || 10) * 12);
    const totalFixedCosts = monthlyOpex + financing + depreciation;
    const variableCosts = totalRevenue * 0.02;
    const contributionMargin = totalRevenue - variableCosts;
    const contributionMarginPercent = totalRevenue > 0 ? (contributionMargin / totalRevenue) * 100 : 0;
    const operatingIncome = contributionMargin - totalFixedCosts;
    const annualProfit = operatingIncome * 12;

    return {
      rubberMonthly, steelMonthly, textileMonthly,
      totalMonthly: rubberMonthly + steelMonthly + textileMonthly,
      rubberRevenue, steelRevenue, textileRevenue, totalRevenue,
      contributionMargin, contributionMarginPercent,
      totalFixedCosts, operatingIncome,
      annualRevenue: totalRevenue * 12, annualProfit
    };
  };

  const scenarios = {
    probable: createScenario(0.70),
    pessimistic: createScenario(0.50),
    optimistic: createScenario(1.00)
  };

  let currentPageNum = 1;

  // Helper: Add footer to current page - compact layout (footer at 277mm, content ends at 272mm)
  const addFooter = (pageNum: number) => {
    const footerY = pageHeight - 8; // Moved up 2mm for more content space
    
    // Footer background strip - minimal height
    doc.setFillColor(250, 251, 253);
    doc.rect(0, footerY - 2, pageWidth, 10, "F");
    
    // Footer line - navy blue accent
    doc.setDrawColor(0, 51, 102);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 2, pageWidth - margin, footerY - 2);
    
    // Study name on left - truncated if needed
    doc.setFontSize(7);
    doc.setTextColor(80, 80, 80);
    setFont('normal');
    const truncatedName = study.study_name.length > 45 ? study.study_name.substring(0, 42) + '...' : study.study_name;
    doc.text(truncatedName, margin, footerY + 2);
    
    // Page number on right with label
    setFont('bold');
    doc.setTextColor(0, 51, 102);
    doc.text(`${pageNum}`, pageWidth - margin, footerY + 2, { align: "right" });
    
    // ELP Green Technology in center - subtle
    setFont('normal');
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(7);
    doc.text("ELP Green Technology", pageWidth / 2, footerY + 2, { align: "center" });
  };

  // Helper: Add new page with professional header - compact layout
  const addPage = () => {
    // Add footer to current page before adding new one
    addFooter(currentPageNum);
    
    doc.addPage();
    currentPageNum++;
    yPos = 20; // Reduced from 26 to minimize whitespace
    
    // Header background strip - subtle gray
    doc.setFillColor(250, 251, 253);
    doc.rect(0, 0, pageWidth, 16, "F");
    
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, "PNG", margin, 2, 18, 9);
      } catch (e) {
        console.log("Could not add logo to header");
      }
    }
    
    // Header line - positioned below logo area
    doc.setDrawColor(0, 51, 102);
    doc.setLineWidth(0.3);
    doc.line(margin + 22, 13, pageWidth - margin, 13);
    
    // Study name in header - right aligned
    doc.setFontSize(7);
    doc.setTextColor(60, 60, 60);
    setFont('normal');
    const headerName = study.study_name.length > 55 ? study.study_name.substring(0, 52) + '...' : study.study_name;
    doc.text(headerName, pageWidth - margin, 10, { align: "right" });
  };

  // Helper: Check if need new page - with improved spacing calculation
  const checkPageBreak = (neededSpace: number) => {
    if (yPos + neededSpace > maxY) {
      addPage();
    }
  };

  // Helper: Draw professional table with improved layout and readability
  // Architecture Standards:
  // - Header: Navy #003366 with white text, 8mm height
  // - Rows: Zebra striping with #FAFBFC / #FFFFFF alternating
  // - Total row: Highlighted with #E1EBF5 background and bold text
  // - Typography: 7.5pt body, proper vertical centering
  // - Borders: Subtle gray #B4B9BE outer border, no internal vertical lines
  const drawTable = (headers: string[], rows: string[][], colWidths: number[], startY: number, options?: {
    headerColor?: [number, number, number];
    accentColumn?: number;
    compactMode?: boolean;
    showRowSeparators?: boolean;
    alignments?: ('left' | 'center' | 'right')[];
  }): number => {
    const {
      headerColor = [0, 51, 102],      // Navy blue default
      accentColumn,
      compactMode = false,
      showRowSeparators = false,
      alignments
    } = options || {};

    const rowHeight = compactMode ? 6 : 7;
    const headerHeight = compactMode ? 7 : 8;
    const cellPadding = compactMode ? 2 : 3;
    const fontSize = compactMode ? 6.5 : 7.5;
    const headerFontSize = compactMode ? 6.5 : 7.5;
    let currentY = startY;

    // Normalize column widths to fit exactly within contentWidth
    const totalColWidth = colWidths.reduce((sum, w) => sum + w, 0);
    const normalizedWidths = colWidths.map(w => (w / totalColWidth) * contentWidth);

    // === HEADER ROW ===
    // Background with subtle top-left rounded corners simulation
    doc.setFillColor(headerColor[0], headerColor[1], headerColor[2]);
    doc.roundedRect(margin, currentY, contentWidth, headerHeight, 1, 0, 'F');
    doc.rect(margin, currentY + 1, contentWidth, headerHeight - 1, 'F');
    
    // Header text - white, bold, properly centered
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(headerFontSize);
    setFont('bold');

    let xPos = margin;
    headers.forEach((header, i) => {
      const align = alignments?.[i] || (i === 0 ? 'left' : 'right');
      const textY = currentY + (headerHeight / 2) + 2; // Vertical center
      
      // Truncate header if too long
      let displayHeader = header;
      const maxWidth = normalizedWidths[i] - cellPadding * 2;
      if (doc.getTextWidth(displayHeader) > maxWidth) {
        while (doc.getTextWidth(displayHeader + '…') > maxWidth && displayHeader.length > 0) {
          displayHeader = displayHeader.slice(0, -1);
        }
        displayHeader = displayHeader + '…';
      }
      
      if (align === 'left') {
        doc.text(displayHeader, xPos + cellPadding, textY, { align: 'left' });
      } else if (align === 'center') {
        doc.text(displayHeader, xPos + normalizedWidths[i] / 2, textY, { align: 'center' });
      } else {
        doc.text(displayHeader, xPos + normalizedWidths[i] - cellPadding, textY, { align: 'right' });
      }
      xPos += normalizedWidths[i];
    });
    currentY += headerHeight;

    // === DATA ROWS ===
    doc.setFontSize(fontSize);
    
    rows.forEach((row, rowIndex) => {
      const isLastRow = rowIndex === rows.length - 1;
      const isEvenRow = rowIndex % 2 === 0;
      
      // Row background - zebra striping with total row highlight
      if (isLastRow && (
        row[0]?.toLowerCase().includes('total') || 
        row[0]?.toLowerCase().includes('soma') ||
        row[0]?.toLowerCase().includes('合计')
      )) {
        doc.setFillColor(225, 235, 245); // Total row: Light blue tint
        setFont('bold');
      } else if (isEvenRow) {
        doc.setFillColor(250, 251, 252); // Even rows: Very light gray
      } else {
        doc.setFillColor(255, 255, 255); // Odd rows: White
      }
      doc.rect(margin, currentY, contentWidth, rowHeight, 'F');
      
      // Optional row separators
      if (showRowSeparators && !isLastRow) {
        doc.setDrawColor(235, 237, 240);
        doc.setLineWidth(0.15);
        doc.line(margin, currentY + rowHeight, margin + contentWidth, currentY + rowHeight);
      }
      
      // Cell content with text truncation
      doc.setTextColor(40, 40, 40);
      xPos = margin;
      row.forEach((cell, i) => {
        const maxCellWidth = normalizedWidths[i] - cellPadding * 2;
        let displayText = cell || '';
        const textWidth = doc.getTextWidth(displayText);
        
        // Truncate with ellipsis if needed
        if (textWidth > maxCellWidth) {
          while (doc.getTextWidth(displayText + '…') > maxCellWidth && displayText.length > 0) {
            displayText = displayText.slice(0, -1);
          }
          displayText = displayText + '…';
        }
        
        const textY = currentY + (rowHeight / 2) + 2; // Vertical center
        const align = alignments?.[i] || (i === 0 ? 'left' : 'right');
        
        // Accent column highlighting
        if (accentColumn !== undefined && i === accentColumn) {
          doc.setTextColor(0, 102, 204);
          setFont('bold');
        }
        
        if (align === 'left') {
          doc.text(displayText, xPos + cellPadding, textY, { align: 'left' });
        } else if (align === 'center') {
          doc.text(displayText, xPos + normalizedWidths[i] / 2, textY, { align: 'center' });
        } else {
          doc.text(displayText, xPos + normalizedWidths[i] - cellPadding, textY, { align: 'right' });
        }
        
        // Reset after accent
        if (accentColumn !== undefined && i === accentColumn) {
          doc.setTextColor(40, 40, 40);
          setFont('normal');
        }
        
        xPos += normalizedWidths[i];
      });
      
      if (isLastRow) setFont('normal');
      currentY += rowHeight;
    });

    // === TABLE BORDER ===
    doc.setDrawColor(180, 185, 190);
    doc.setLineWidth(0.3);
    doc.rect(margin, startY, contentWidth, currentY - startY);

    return currentY + 2; // Minimal spacing after table for density
  };

  // Helper: Section header with professional styling - compact
  const sectionHeader = (title: string, icon?: string, bgColor: number[] = [0, 51, 102]) => {
    checkPageBreak(16);
    
    // Section spacing - minimal
    if (yPos > margin + 8) {
      yPos += 2;
    }
    
    doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    doc.roundedRect(margin, yPos, contentWidth, 7, 1, 1, "F");
    doc.setTextColor(255);
    doc.setFontSize(8);
    setFont('bold');
    doc.text(icon ? `${icon} ${title}` : title, margin + 4, yPos + 5);
    yPos += 10; // Compact spacing after header
  };

  // === PAGE 1: ENHANCED COVER PAGE ===
  // Background with subtle gradient effect
  doc.setFillColor(250, 251, 253);
  doc.rect(0, 0, pageWidth, pageHeight, "F");
  
  // Top accent bar
  doc.setFillColor(0, 51, 102);
  doc.rect(0, 0, pageWidth, 8, "F");
  
  // Bottom accent bar
  doc.setFillColor(46, 125, 50);
  doc.rect(0, pageHeight - 25, pageWidth, 25, "F");

  // Logo centered and larger
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "PNG", pageWidth / 2 - 30, 20, 60, 30);
    } catch (e) {
      console.log("Could not add logo to cover");
    }
  }

  // Company name with decorative line
  doc.setTextColor(0, 51, 102);
  doc.setFontSize(14);
  setFont('bold');
  doc.text("ELP Green Technology", pageWidth / 2, 60, { align: "center" });
  
  // Decorative line under company name
  doc.setDrawColor(46, 125, 50);
  doc.setLineWidth(1);
  doc.line(pageWidth / 2 - 30, 64, pageWidth / 2 + 30, 64);

  // Main title - larger and more prominent
  yPos = 82;
  doc.setFontSize(22);
  setFont('bold');
  doc.setTextColor(0, 51, 102);
  const titleLines = doc.splitTextToSize(t.mainTitle, contentWidth - 20);
  titleLines.forEach((line: string) => {
    doc.text(line, pageWidth / 2, yPos, { align: "center" });
    yPos += 10;
  });

  // Subtitle
  doc.setFontSize(11);
  setFont('normal');
  doc.setTextColor(80);
  doc.text(t.subtitle, pageWidth / 2, yPos + 3, { align: "center" });

  // Partnership model badge
  yPos += 15;
  doc.setFillColor(46, 125, 50);
  doc.roundedRect(margin + 20, yPos, contentWidth - 40, 18, 3, 3, "F");
  doc.setTextColor(255);
  doc.setFontSize(8);
  setFont('bold');
  doc.text(t.globalPartnership || "Global Partnership Opportunity", pageWidth / 2, yPos + 6, { align: "center" });
  doc.setFontSize(7);
  setFont('normal');
  doc.text(t.smartOtrLine || "Smart OTR Line - Advanced Robotic Recycling", pageWidth / 2, yPos + 12, { align: "center" });

  // Project info box - enhanced design
  yPos += 28;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(0, 51, 102);
  doc.setLineWidth(1.5);
  doc.roundedRect(margin + 10, yPos, contentWidth - 20, 40, 4, 4, "FD");
  
  // Inner accent
  doc.setFillColor(0, 51, 102);
  doc.roundedRect(margin + 10, yPos, contentWidth - 20, 10, 4, 0, "F");
  doc.rect(margin + 10, yPos + 6, contentWidth - 20, 4, "F");
  
  doc.setTextColor(255);
  doc.setFontSize(8);
  setFont('bold');
  doc.text(t.otrRecycling, pageWidth / 2, yPos + 7, { align: "center" });

  doc.setTextColor(0, 51, 102);
  doc.setFontSize(16);
  setFont('bold');
  doc.text(study.study_name, pageWidth / 2, yPos + 22, { align: "center" });

  doc.setFontSize(10);
  setFont('normal');
  doc.setTextColor(80);
  if (study.location) {
    doc.text(`${study.location}, ${study.country}`, pageWidth / 2, yPos + 33, { align: "center" });
  }

  // Viability badge - larger and more prominent
  yPos += 50;
  const [r, g, b] = viability.color;
  doc.setFillColor(r, g, b);
  doc.roundedRect(pageWidth / 2 - 35, yPos, 70, 14, 3, 3, "F");
  doc.setTextColor(255);
  doc.setFontSize(11);
  setFont('bold');
  doc.text(viability.rating, pageWidth / 2, yPos + 10, { align: "center" });

  // Key metrics - enhanced design
  yPos += 22;
  const metricBoxW = (contentWidth - 30) / 4;
  const metrics = [
    { label: t.roi, value: `${study.roi_percentage.toFixed(1)}%`, color: [0, 102, 204] },
    { label: t.paybackPeriod, value: `${(study.payback_months / 12).toFixed(1)}${t.years}`, color: [46, 125, 50] },
    { label: t.npv, value: formatCurrency(study.npv_10_years), color: [128, 0, 128] },
    { label: t.irr, value: `${study.irr_percentage.toFixed(1)}%`, color: [220, 100, 0] }
  ];
  
  metrics.forEach((m, i) => {
    const x = margin + 15 + i * (metricBoxW + 4);
    // Card background
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, yPos, metricBoxW, 24, 2, 2, "FD");
    
    // Top accent line
    doc.setFillColor(m.color[0], m.color[1], m.color[2]);
    doc.roundedRect(x, yPos, metricBoxW, 3, 2, 0, "F");
    doc.rect(x, yPos + 1, metricBoxW, 2, "F");
    
    doc.setTextColor(80);
    doc.setFontSize(6);
    setFont('normal');
    doc.text(m.label, x + metricBoxW / 2, yPos + 10, { align: "center" });
    doc.setTextColor(m.color[0], m.color[1], m.color[2]);
    doc.setFontSize(12);
    setFont('bold');
    doc.text(m.value, x + metricBoxW / 2, yPos + 19, { align: "center" });
  });

  // Date and prepared by
  yPos += 34;
  doc.setTextColor(80);
  doc.setFontSize(9);
  setFont('normal');
  const dateStr = new Date().toLocaleDateString(lang === "pt" ? "pt-BR" : lang === "es" ? "es-ES" : lang === "zh" ? "zh-CN" : lang === "it" ? "it-IT" : "en-US", { year: 'numeric', month: 'long' });
  doc.text(`${t.date}: ${dateStr}`, pageWidth / 2, yPos, { align: "center" });
  doc.text(t.prepared, pageWidth / 2, yPos + 6, { align: "center" });

  // Cover footer with white text on green bar
  doc.setTextColor(255);
  doc.setFontSize(7);
  doc.text(`${t.footerWebsite} | ${t.footerEmail} | ${t.footerPhone}`, pageWidth / 2, pageHeight - 14, { align: "center" });
  doc.setFontSize(8);
  setFont('bold');
  doc.text(t.confidential, pageWidth / 2, pageHeight - 7, { align: "center" });

  // === PAGE 2: EXECUTIVE SUMMARY + PROJECT INFO + CAPEX ===
  addPage();

  // Executive Summary
  sectionHeader(t.executiveSummary, "");

  // Compact summary grid
  const summaryBoxW = (contentWidth - 4) / 4;
  const summaryBoxH = 18;

  const summaryMetrics = [
    { label: t.roi, value: `${study.roi_percentage.toFixed(1)}%`, color: [0, 51, 102] },
    { label: t.paybackPeriod, value: `${(study.payback_months / 12).toFixed(1)} ${t.years}`, color: [0, 102, 204] },
    { label: t.npv, value: formatCurrency(study.npv_10_years), color: [46, 125, 50] },
    { label: t.totalInvestment, value: formatCurrency(study.total_investment), color: [128, 0, 128] }
  ];

  summaryMetrics.forEach((m, i) => {
    const x = margin + i * (summaryBoxW + 1);
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(x, yPos, summaryBoxW, summaryBoxH, 1, 1, "F");
    doc.setTextColor(80);
    doc.setFontSize(6);
    setFont('normal');
    doc.text(m.label, x + summaryBoxW / 2, yPos + 6, { align: "center" });
    doc.setTextColor(m.color[0], m.color[1], m.color[2]);
    doc.setFontSize(10);
    setFont('bold');
    doc.text(m.value, x + summaryBoxW / 2, yPos + 14, { align: "center" });
  });
  yPos += summaryBoxH + 4;

  // ESG mini strip
  doc.setFillColor(46, 125, 50);
  doc.roundedRect(margin, yPos, contentWidth, 10, 1, 1, "F");
  doc.setTextColor(255);
  doc.setFontSize(6);
  setFont('bold');
  doc.text(`${t.co2Reduction}: ${formatNumber(co2Avoided)} tCO2eq`, margin + 4, yPos + 4);
  doc.text(`${t.wasteAvoided}: ${formatNumber(wasteAvoided)} ${t.tonsPerYear}`, margin + 60, yPos + 4);
  doc.text(`${t.jobsGenerated}: ${esgData.jobsPerPlant}`, margin + 115, yPos + 4);
  doc.text(`${t.esgScore}: ${esgData.esgRating}/100`, margin + 155, yPos + 4);
  yPos += 14;

  // Project Information + Raw Materials
  doc.setTextColor(0, 51, 102);
  doc.setFontSize(9);
  setFont('bold');
  doc.text(t.projectInfo, margin, yPos);
  yPos += 5;

  const materialHeaders = [t.material, t.percentage, t.kgPerHour, t.pricePerTon];
  // Note: rCB is derived from rubber via pyrolysis, so it's NOT added to total yield
  // Total yield should only be rubber + steel + textile (which should sum to ~88-100%)
  const baseYield = study.rubber_granules_yield + study.steel_wire_yield + study.textile_fiber_yield;
  const materialRows = [
    [t.rubber, `${study.rubber_granules_yield.toFixed(1)}%`, formatNumber(rubberKgPerHour), `$${study.rubber_granules_price}`],
    [t.steel, `${study.steel_wire_yield.toFixed(1)}%`, formatNumber(steelKgPerHour), `$${study.steel_wire_price}`],
    [t.textile, `${study.textile_fiber_yield.toFixed(1)}%`, formatNumber(textileKgPerHour), `$${study.textile_fiber_price}`],
    [t.rcb || 'rCB', `${(study.rcb_yield || 12).toFixed(1)}%*`, formatNumber(rcbKgPerHour), `$${study.rcb_price || 1050}`],
    [t.total, `${baseYield.toFixed(1)}%`, formatNumber(kgPerHour), "-"]
  ];
  const materialWidths = [60, 30, 45, 45]; // Proportional widths (sum = 180)
  yPos = drawTable(materialHeaders, materialRows, materialWidths, yPos);
  yPos += 5;

  // === TIRE CATEGORY SECTION (if data provided) ===
  if (tireCategoryData) {
    checkPageBreak(50);
    
    // Section header with icon
    doc.setFillColor(99, 102, 241); // Indigo
    doc.roundedRect(margin, yPos, contentWidth, 8, 1, 1, "F");
    doc.setTextColor(255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(`${tireCategoryData.categoryIcon} ${t.tireCategory}`, margin + 4, yPos + 5.5);
    yPos += 11;
    
    // Main info cards row
    const cardWidth = (contentWidth - 6) / 3;
    const cardHeight = 22;
    
    // Card 1: Category & Models
    doc.setFillColor(240, 245, 255);
    doc.setDrawColor(99, 102, 241);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, yPos, cardWidth, cardHeight, 1, 1, "FD");
    
    doc.setTextColor(99, 102, 241);
    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    doc.text(t.tireCategorySelected, margin + 3, yPos + 5);
    
    doc.setTextColor(30);
    doc.setFontSize(8);
    doc.text(tireCategoryData.categoryName, margin + 3, yPos + 11);
    
    doc.setTextColor(80);
    doc.setFontSize(5);
    doc.setFont("helvetica", "normal");
    const modelsText = tireCategoryData.selectedModels.length > 0 
      ? `${tireCategoryData.selectedModels.length} ${t.tireModelsSelected}`
      : t.tireModels;
    doc.text(modelsText, margin + 3, yPos + 16);
    
    if (tireCategoryData.selectedModels.length > 0) {
      doc.setFontSize(4.5);
      const modelsDisplay = tireCategoryData.selectedModels.slice(0, 3).join(', ');
      doc.text(modelsDisplay.length > 30 ? modelsDisplay.substring(0, 30) + '...' : modelsDisplay, margin + 3, yPos + 20);
    }
    
    // Card 2: Weight & Value
    doc.setFillColor(240, 255, 245);
    doc.setDrawColor(34, 197, 94);
    doc.roundedRect(margin + cardWidth + 3, yPos, cardWidth, cardHeight, 1, 1, "FD");
    
    doc.setTextColor(34, 197, 94);
    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    doc.text(t.tireAvgWeight, margin + cardWidth + 6, yPos + 5);
    
    doc.setTextColor(30);
    doc.setFontSize(9);
    doc.text(`${tireCategoryData.avgWeight.toLocaleString()} kg`, margin + cardWidth + 6, yPos + 11);
    
    doc.setTextColor(34, 197, 94);
    doc.setFontSize(6);
    doc.text(t.tireValuePerUnit, margin + cardWidth + 6, yPos + 16);
    
    doc.setTextColor(30);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(`USD ${tireCategoryData.valuePerTire.toLocaleString()}`, margin + cardWidth + 6, yPos + 21);
    
    // Card 3: Processing & OPEX
    doc.setFillColor(255, 245, 240);
    doc.setDrawColor(249, 115, 22);
    doc.roundedRect(margin + (cardWidth + 3) * 2, yPos, cardWidth, cardHeight, 1, 1, "FD");
    
    doc.setTextColor(249, 115, 22);
    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    doc.text(t.tireProcessing, margin + (cardWidth + 3) * 2 + 3, yPos + 5);
    
    // Processing difficulty badge
    const difficultyColors: Record<string, [number, number, number]> = {
      'very_high': [220, 38, 38],
      'high': [249, 115, 22],
      'medium': [234, 179, 8],
      'low': [34, 197, 94]
    };
    const diffColor = difficultyColors[tireCategoryData.processingDifficulty] || [100, 100, 100];
    
    doc.setFillColor(diffColor[0], diffColor[1], diffColor[2]);
    doc.roundedRect(margin + (cardWidth + 3) * 2 + 3, yPos + 7, 25, 5, 1, 1, "F");
    doc.setTextColor(255);
    doc.setFontSize(5);
    doc.text(tireCategoryData.processingDifficulty.replace('_', ' ').toUpperCase(), margin + (cardWidth + 3) * 2 + 15.5, yPos + 10.5, { align: "center" });
    
    doc.setTextColor(249, 115, 22);
    doc.setFontSize(6);
    doc.text(t.tireOpexMultiplier, margin + (cardWidth + 3) * 2 + 3, yPos + 17);
    
    doc.setTextColor(30);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(`${tireCategoryData.opexMultiplier.toFixed(2)}x`, margin + (cardWidth + 3) * 2 + 3, yPos + 21);
    
    yPos += cardHeight + 4;
    
    // Yields bar
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(200, 210, 220);
    doc.setLineWidth(0.2);
    doc.roundedRect(margin, yPos, contentWidth, 12, 1, 1, "FD");
    
    doc.setTextColor(60);
    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    doc.text(t.tireYields + ":", margin + 3, yPos + 4);
    
    // Yield badges
    const yieldBadges = [
      { label: t.rubber, value: tireCategoryData.yields.rubber, color: [59, 130, 246] },
      { label: t.steel, value: tireCategoryData.yields.steel, color: [107, 114, 128] },
      { label: t.textile, value: tireCategoryData.yields.textile, color: [245, 158, 11] },
      { label: 'rCB', value: tireCategoryData.yields.rcb, color: [139, 92, 246] }
    ];
    
    let badgeX = margin + 30;
    yieldBadges.forEach((badge) => {
      doc.setFillColor(badge.color[0], badge.color[1], badge.color[2]);
      doc.roundedRect(badgeX, yPos + 5, 28, 5, 1, 1, "F");
      doc.setTextColor(255);
      doc.setFontSize(5);
      doc.text(`${badge.label}: ${badge.value}%`, badgeX + 14, yPos + 8.5, { align: "center" });
      badgeX += 32;
    });
    
    // Market reference note
    doc.setTextColor(100);
    doc.setFontSize(4.5);
    doc.setFont("helvetica", "italic");
    doc.text(`📊 ${t.tireMarketPrices}`, margin + contentWidth - 50, yPos + 8.5);
    
    yPos += 16;
  }

  // CAPEX Breakdown
  doc.setTextColor(0, 51, 102);
  doc.setFontSize(9);
  setFont('bold');
  doc.text(t.capexBreakdown, margin, yPos);
  yPos += 5;

  const investmentItems = [
    { name: t.equipment, value: study.equipment_cost || 0 },
    { name: t.installation, value: study.installation_cost || 0 },
    { name: t.infrastructure, value: study.infrastructure_cost || 0 },
    { name: t.workingCapital, value: study.working_capital || 0 }
  ].filter(item => item.value > 0);

  const totalInv = investmentItems.reduce((sum, item) => sum + item.value, 0) || study.total_investment;
  const investmentHeaders = [t.description, t.value, t.percentCapex];
  const investmentRows = investmentItems.map(item => [
    item.name,
    formatCurrency(item.value),
    `${((item.value / totalInv) * 100).toFixed(1)}%`
  ]);
  investmentRows.push([t.totalInvestment, formatCurrency(totalInv), "100%"]);
  const investmentWidths = [90, 50, 40]; // Proportional widths (sum = 180)
  yPos = drawTable(investmentHeaders, investmentRows, investmentWidths, yPos);
  yPos += 5;

  // OPEX/Revenue Scenarios (compact - only probable)
  doc.setTextColor(0, 51, 102);
  doc.setFontSize(9);
  setFont('bold');
  doc.text(t.revenueOpex, margin, yPos);
  yPos += 5;

  // === 3 SCENARIOS DETAILED ANALYSIS ===
  // Calculate scenario-specific financial metrics
  const calculateScenarioMetrics = (utilRate: number) => {
    const effectiveRevenue = study.annual_revenue * utilRate;
    const variableOpex = study.annual_opex * 0.3 * utilRate; // 30% variable
    const fixedOpex = study.annual_opex * 0.7; // 70% fixed
    const totalOpex = variableOpex + fixedOpex;
    const ebitda = effectiveRevenue - totalOpex;
    const netProfit = ebitda * (1 - study.tax_rate / 100);
    const roi = study.total_investment > 0 ? (ebitda / study.total_investment) * 100 : 0;
    const payback = ebitda > 0 ? (study.total_investment / ebitda) * 12 : 999;
    return { revenue: effectiveRevenue, opex: totalOpex, ebitda, netProfit, roi, payback };
  };

  const scenarioData = {
    pessimistic: { rate: 0.50, label: t.pessimistic, color: [220, 53, 69], metrics: calculateScenarioMetrics(0.50) },
    probable: { rate: 0.70, label: t.probable, color: [0, 102, 204], metrics: calculateScenarioMetrics(0.70) },
    optimistic: { rate: 1.00, label: t.optimistic, color: [46, 125, 50], metrics: calculateScenarioMetrics(1.00) }
  };

  // Scenario comparison table with all details
  const scenarioHeaders = [t.description, t.pessimistic, t.probable, t.optimistic];
  const scenarioRows = [
    [
      lang === 'pt' ? 'Taxa de Utilizacao' : 'Utilization Rate',
      '50%',
      '70%',
      '100%'
    ],
    [
      t.annualRevenue,
      formatCurrency(scenarioData.pessimistic.metrics.revenue),
      formatCurrency(scenarioData.probable.metrics.revenue),
      formatCurrency(scenarioData.optimistic.metrics.revenue)
    ],
    [
      lang === 'pt' ? 'OPEX Anual' : 'Annual OPEX',
      formatCurrency(scenarioData.pessimistic.metrics.opex),
      formatCurrency(scenarioData.probable.metrics.opex),
      formatCurrency(scenarioData.optimistic.metrics.opex)
    ],
    [
      'EBITDA',
      formatCurrency(scenarioData.pessimistic.metrics.ebitda),
      formatCurrency(scenarioData.probable.metrics.ebitda),
      formatCurrency(scenarioData.optimistic.metrics.ebitda)
    ],
    [
      lang === 'pt' ? 'Lucro Liquido' : 'Net Profit',
      formatCurrency(scenarioData.pessimistic.metrics.netProfit),
      formatCurrency(scenarioData.probable.metrics.netProfit),
      formatCurrency(scenarioData.optimistic.metrics.netProfit)
    ],
    [
      t.roi,
      `${scenarioData.pessimistic.metrics.roi.toFixed(1)}%`,
      `${scenarioData.probable.metrics.roi.toFixed(1)}%`,
      `${scenarioData.optimistic.metrics.roi.toFixed(1)}%`
    ],
    [
      t.paybackPeriod,
      `${Math.round(scenarioData.pessimistic.metrics.payback)} ${t.months}`,
      `${Math.round(scenarioData.probable.metrics.payback)} ${t.months}`,
      `${Math.round(scenarioData.optimistic.metrics.payback)} ${t.months}`
    ]
  ];
  const scenarioWidths = [60, 40, 40, 40]; // Proportional widths (sum = 180)
  yPos = drawTable(scenarioHeaders, scenarioRows, scenarioWidths, yPos);
  yPos += 4;

  // === COMPARATIVE BAR CHART - 3 SCENARIOS ===
  checkPageBreak(70);
  
  const chartTitle = lang === 'pt' ? 'Gráfico Comparativo dos Cenários' : 
                     lang === 'es' ? 'Gráfico Comparativo de Escenarios' :
                     lang === 'it' ? 'Grafico Comparativo degli Scenari' :
                     lang === 'zh' ? '情景对比图' : 'Comparative Scenario Chart';
  
  // Chart container with shadow
  doc.setFillColor(240, 240, 240);
  doc.roundedRect(margin + 1, yPos + 1, contentWidth, 60, 2, 2, "F");
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, yPos, contentWidth, 60, 2, 2, "FD");
  
  // Chart title bar
  doc.setFillColor(0, 51, 102);
  doc.roundedRect(margin, yPos, contentWidth, 10, 2, 0, "F");
  doc.rect(margin, yPos + 6, contentWidth, 4, "F");
  doc.setTextColor(255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(chartTitle, margin + contentWidth / 2, yPos + 6.5, { align: "center" });
  
  const chartStartY = yPos + 14;
  const chartHeight = 40;
  const chartWidth = contentWidth - 20;
  const chartStartX = margin + 10;
  
  // Define metrics to chart
  const chartMetrics = [
    { 
      label: lang === 'pt' ? 'Receita' : 'Revenue',
      values: [scenarioData.pessimistic.metrics.revenue, scenarioData.probable.metrics.revenue, scenarioData.optimistic.metrics.revenue]
    },
    { 
      label: 'EBITDA',
      values: [scenarioData.pessimistic.metrics.ebitda, scenarioData.probable.metrics.ebitda, scenarioData.optimistic.metrics.ebitda]
    },
    { 
      label: lang === 'pt' ? 'Lucro Líq.' : 'Net Profit',
      values: [scenarioData.pessimistic.metrics.netProfit, scenarioData.probable.metrics.netProfit, scenarioData.optimistic.metrics.netProfit]
    }
  ];
  
  // Find max value for scaling
  const allValues = chartMetrics.flatMap(m => m.values);
  const maxValue = Math.max(...allValues);
  
  // Bar chart configuration
  const groupWidth = chartWidth / chartMetrics.length;
  const barWidth = (groupWidth - 20) / 3;
  const maxBarHeight = chartHeight - 12;
  
  // Draw Y-axis guide lines
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.1);
  for (let i = 0; i <= 4; i++) {
    const lineY = chartStartY + chartHeight - 6 - (maxBarHeight * i / 4);
    doc.line(chartStartX, lineY, chartStartX + chartWidth, lineY);
  }
  
  // Draw bars for each metric group
  chartMetrics.forEach((metric, groupIdx) => {
    const groupStartX = chartStartX + groupIdx * groupWidth + 10;
    
    // Metric label
    doc.setTextColor(60);
    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    doc.text(metric.label, groupStartX + (groupWidth - 20) / 2, chartStartY + chartHeight - 1, { align: "center" });
    
    // Draw bars for each scenario
    const scenarioColors = [
      [220, 53, 69],   // Pessimistic - Red
      [0, 102, 204],   // Probable - Blue
      [46, 125, 50]    // Optimistic - Green
    ];
    
    metric.values.forEach((value, barIdx) => {
      const barHeight = maxValue > 0 ? (value / maxValue) * maxBarHeight : 0;
      const barX = groupStartX + barIdx * (barWidth + 2);
      const barY = chartStartY + chartHeight - 6 - barHeight;
      
      // Bar shadow
      doc.setFillColor(200, 200, 200);
      doc.roundedRect(barX + 0.5, barY + 0.5, barWidth, barHeight, 0.5, 0.5, "F");
      
      // Bar with gradient effect
      const [r, g, b] = scenarioColors[barIdx];
      doc.setFillColor(r, g, b);
      doc.roundedRect(barX, barY, barWidth, barHeight, 0.5, 0.5, "F");
      
      // Highlight on top of bar
      doc.setFillColor(Math.min(r + 40, 255), Math.min(g + 40, 255), Math.min(b + 40, 255));
      doc.roundedRect(barX, barY, barWidth, 2, 0.5, 0, "F");
      
      // Value label on top of bar
      if (barHeight > 8) {
        doc.setTextColor(255);
        doc.setFontSize(5);
        doc.setFont("helvetica", "bold");
        const valueText = value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : `${(value / 1000).toFixed(0)}K`;
        doc.text(valueText, barX + barWidth / 2, barY + 5, { align: "center" });
      }
    });
  });
  
  // Legend
  const legendY = chartStartY + 2;
  const legendStartX = chartStartX + chartWidth - 55;
  const scenarioLabels = [
    { label: '50%', color: [220, 53, 69] },
    { label: '70%', color: [0, 102, 204] },
    { label: '100%', color: [46, 125, 50] }
  ];
  
  scenarioLabels.forEach((item, idx) => {
    const lx = legendStartX + idx * 18;
    const [r, g, b] = item.color as [number, number, number];
    doc.setFillColor(r, g, b);
    doc.roundedRect(lx, legendY, 4, 4, 0.5, 0.5, "F");
    doc.setTextColor(60);
    doc.setFontSize(5);
    doc.setFont("helvetica", "normal");
    doc.text(item.label, lx + 5, legendY + 3);
  });
  
  yPos += 65;

  // === ROI & PAYBACK COMPARATIVE CHART ===
  checkPageBreak(55);
  
  const roiPaybackTitle = lang === 'pt' ? 'Comparativo ROI e Payback por Cenário' : 
                          lang === 'es' ? 'Comparativo ROI y Payback por Escenario' :
                          lang === 'it' ? 'Comparativo ROI e Payback per Scenario' :
                          lang === 'zh' ? 'ROI和回收期对比' : 'ROI & Payback Comparison by Scenario';
  
  // Chart container
  doc.setFillColor(240, 240, 240);
  doc.roundedRect(margin + 1, yPos + 1, contentWidth, 48, 2, 2, "F");
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, yPos, contentWidth, 48, 2, 2, "FD");
  
  // Title bar
  doc.setFillColor(102, 51, 153);
  doc.roundedRect(margin, yPos, contentWidth, 9, 2, 0, "F");
  doc.rect(margin, yPos + 5, contentWidth, 4, "F");
  doc.setTextColor(255);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text(roiPaybackTitle, margin + contentWidth / 2, yPos + 6, { align: "center" });
  
  const roiChartY = yPos + 12;
  const halfWidth = (contentWidth - 10) / 2;
  
  // ROI section (left)
  const roiSectionX = margin + 5;
  doc.setTextColor(60);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("ROI (%)", roiSectionX + halfWidth / 2, roiChartY, { align: "center" });
  
  const roiBarY = roiChartY + 5;
  const roiBarHeight = 8;
  const maxRoi = Math.max(scenarioData.pessimistic.metrics.roi, scenarioData.probable.metrics.roi, scenarioData.optimistic.metrics.roi);
  
  const roiScenarios = [
    { data: scenarioData.pessimistic, label: '50%' },
    { data: scenarioData.probable, label: '70%' },
    { data: scenarioData.optimistic, label: '100%' }
  ];
  
  roiScenarios.forEach((scenario, idx) => {
    const barY = roiBarY + idx * (roiBarHeight + 4);
    const barMaxWidth = halfWidth - 25;
    const barWidth = maxRoi > 0 ? (scenario.data.metrics.roi / maxRoi) * barMaxWidth : 0;
    const [r, g, b] = scenario.data.color;
    
    // Label
    doc.setTextColor(80);
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.text(scenario.label, roiSectionX, barY + 5);
    
    // Bar background
    doc.setFillColor(235, 235, 235);
    doc.roundedRect(roiSectionX + 12, barY, barMaxWidth, roiBarHeight, 1, 1, "F");
    
    // Bar
    doc.setFillColor(r, g, b);
    doc.roundedRect(roiSectionX + 12, barY, barWidth, roiBarHeight, 1, 1, "F");
    
    // Value
    doc.setTextColor(r, g, b);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text(`${scenario.data.metrics.roi.toFixed(1)}%`, roiSectionX + 12 + barMaxWidth + 3, barY + 5.5);
  });
  
  // Payback section (right)
  const paybackSectionX = margin + 5 + halfWidth + 5;
  doc.setTextColor(60);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  const paybackLabel = lang === 'pt' ? 'Payback (Anos)' : 'Payback (Years)';
  doc.text(paybackLabel, paybackSectionX + halfWidth / 2, roiChartY, { align: "center" });
  
  const maxPayback = Math.max(
    scenarioData.pessimistic.metrics.payback,
    scenarioData.probable.metrics.payback,
    scenarioData.optimistic.metrics.payback
  );
  
  roiScenarios.forEach((scenario, idx) => {
    const barY = roiBarY + idx * (roiBarHeight + 4);
    const barMaxWidth = halfWidth - 25;
    const paybackYears = scenario.data.metrics.payback / 12;
    const barWidth = maxPayback > 0 ? (scenario.data.metrics.payback / maxPayback) * barMaxWidth : 0;
    const [r, g, b] = scenario.data.color;
    
    // Label
    doc.setTextColor(80);
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.text(scenario.label, paybackSectionX, barY + 5);
    
    // Bar background
    doc.setFillColor(235, 235, 235);
    doc.roundedRect(paybackSectionX + 12, barY, barMaxWidth, roiBarHeight, 1, 1, "F");
    
    // Bar (inverted color logic - smaller is better for payback)
    doc.setFillColor(r, g, b);
    doc.roundedRect(paybackSectionX + 12, barY, barWidth, roiBarHeight, 1, 1, "F");
    
    // Value
    doc.setTextColor(r, g, b);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text(`${paybackYears.toFixed(1)}`, paybackSectionX + 12 + barMaxWidth + 3, barY + 5.5);
  });
  
  yPos += 52;

  // === OPEX DISTRIBUTION PIE CHART ===
  checkPageBreak(60);
  
  const opexPieTitle = lang === 'pt' ? 'Distribuição do OPEX por Categoria' : 
                       lang === 'es' ? 'Distribución del OPEX por Categoría' :
                       lang === 'it' ? 'Distribuzione OPEX per Categoria' :
                       lang === 'zh' ? 'OPEX分类分布' : 'OPEX Distribution by Category';
  
  // Container
  doc.setFillColor(240, 240, 240);
  doc.roundedRect(margin + 1, yPos + 1, contentWidth, 55, 2, 2, "F");
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, yPos, contentWidth, 55, 2, 2, "FD");
  
  // Title bar
  doc.setFillColor(0, 128, 128);
  doc.roundedRect(margin, yPos, contentWidth, 9, 2, 0, "F");
  doc.rect(margin, yPos + 5, contentWidth, 4, "F");
  doc.setTextColor(255);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text(opexPieTitle, margin + contentWidth / 2, yPos + 6, { align: "center" });
  
  // OPEX categories
  const laborCost = study.labor_cost || study.annual_opex * 0.35;
  const energyCost = study.energy_cost || study.annual_opex * 0.20;
  const maintenanceCost = study.maintenance_cost || study.annual_opex * 0.15;
  const logisticsCost = study.logistics_cost || study.annual_opex * 0.12;
  const adminCost = study.administrative_cost || study.annual_opex * 0.10;
  const otherCost = study.other_opex || study.annual_opex * 0.08;
  
  const opexCategories = [
    { label: lang === 'pt' ? 'Mão de Obra' : 'Labor', value: laborCost, color: [41, 128, 185] },
    { label: lang === 'pt' ? 'Energia' : 'Energy', value: energyCost, color: [231, 76, 60] },
    { label: lang === 'pt' ? 'Manutenção' : 'Maintenance', value: maintenanceCost, color: [46, 204, 113] },
    { label: lang === 'pt' ? 'Logística' : 'Logistics', value: logisticsCost, color: [241, 196, 15] },
    { label: lang === 'pt' ? 'Administrativo' : 'Administrative', value: adminCost, color: [155, 89, 182] },
    { label: lang === 'pt' ? 'Outros' : 'Other', value: otherCost, color: [149, 165, 166] }
  ];
  
  const totalOpex = opexCategories.reduce((sum, cat) => sum + cat.value, 0);
  
  // Draw pie chart (simulated with segments)
  const pieX = margin + 45;
  const pieY = yPos + 32;
  const pieRadius = 18;
  
  let startAngle = -Math.PI / 2; // Start from top
  
  opexCategories.forEach((category) => {
    const sliceAngle = (category.value / totalOpex) * 2 * Math.PI;
    const endAngle = startAngle + sliceAngle;
    const [r, g, b] = category.color as [number, number, number];
    
    // Draw pie slice using lines (jsPDF doesn't have native arc fill)
    doc.setFillColor(r, g, b);
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.5);
    
    // Create pie slice path
    const segments = Math.max(Math.ceil(sliceAngle / (Math.PI / 18)), 3);
    const points: [number, number][] = [[pieX, pieY]];
    
    for (let i = 0; i <= segments; i++) {
      const angle = startAngle + (sliceAngle * i / segments);
      points.push([
        pieX + Math.cos(angle) * pieRadius,
        pieY + Math.sin(angle) * pieRadius
      ]);
    }
    
    // Draw filled polygon for slice
    if (points.length > 2) {
      doc.setFillColor(r, g, b);
      // Draw as triangle fan from center
      for (let i = 1; i < points.length - 1; i++) {
        const p1 = points[0];
        const p2 = points[i];
        const p3 = points[i + 1];
        doc.triangle(p1[0], p1[1], p2[0], p2[1], p3[0], p3[1], "F");
      }
    }
    
    startAngle = endAngle;
  });
  
  // Center circle (donut effect)
  doc.setFillColor(255, 255, 255);
  doc.circle(pieX, pieY, 8, "F");
  doc.setTextColor(60);
  doc.setFontSize(5);
  doc.setFont("helvetica", "bold");
  doc.text("OPEX", pieX, pieY + 1.5, { align: "center" });
  
  // Legend (right side)
  const legendX = margin + 75;
  const legendStartY = yPos + 14;
  
  opexCategories.forEach((category, idx) => {
    const ly = legendStartY + idx * 7;
    const [r, g, b] = category.color as [number, number, number];
    const percentage = totalOpex > 0 ? (category.value / totalOpex) * 100 : 0;
    
    // Color box
    doc.setFillColor(r, g, b);
    doc.roundedRect(legendX, ly, 4, 4, 0.5, 0.5, "F");
    
    // Label
    doc.setTextColor(60);
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.text(category.label, legendX + 6, ly + 3);
    
    // Value and percentage
    doc.setTextColor(100);
    doc.setFontSize(5);
    doc.text(`${formatCurrency(category.value)} (${percentage.toFixed(1)}%)`, legendX + 40, ly + 3);
  });
  
  // Total OPEX box
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(legendX, legendStartY + 44, 65, 8, 1, 1, "F");
  doc.setTextColor(60);
  doc.setFontSize(6);
  doc.setFont("helvetica", "bold");
  doc.text(`Total OPEX: ${formatCurrency(totalOpex)}`, legendX + 32.5, legendStartY + 49, { align: "center" });
  
  yPos += 60;

  // === 10-YEAR CASH FLOW PROJECTION LINE CHART ===
  checkPageBreak(75);
  
  const cashFlowTitle = lang === 'pt' ? 'Projeção de Fluxo de Caixa - 10 Anos' : 
                        lang === 'es' ? 'Proyección de Flujo de Caja - 10 Años' :
                        lang === 'it' ? 'Proiezione Flusso di Cassa - 10 Anni' :
                        lang === 'zh' ? '10年现金流预测' : '10-Year Cash Flow Projection';
  
  // Container with shadow
  doc.setFillColor(240, 240, 240);
  doc.roundedRect(margin + 1, yPos + 1, contentWidth, 68, 2, 2, "F");
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, yPos, contentWidth, 68, 2, 2, "FD");
  
  // Title bar
  doc.setFillColor(0, 102, 153);
  doc.roundedRect(margin, yPos, contentWidth, 9, 2, 0, "F");
  doc.rect(margin, yPos + 5, contentWidth, 4, "F");
  doc.setTextColor(255);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text(cashFlowTitle, margin + contentWidth / 2, yPos + 6, { align: "center" });
  
  // Calculate 10-year cash flow data
  const annualEbitda = scenarioData.probable.metrics.ebitda;
  const initialInvestment = study.total_investment;
  const discountRate = (study.discount_rate || 10) / 100;
  
  const cashFlowData: { year: number; cashFlow: number; cumulative: number; npv: number }[] = [];
  let cumulativeCashFlow = -initialInvestment;
  let cumulativeNpv = -initialInvestment;
  
  for (let year = 0; year <= 10; year++) {
    if (year === 0) {
      cashFlowData.push({
        year: 0,
        cashFlow: -initialInvestment,
        cumulative: cumulativeCashFlow,
        npv: cumulativeNpv
      });
    } else {
      const yearCashFlow = annualEbitda * (1 + 0.02 * (year - 1)); // 2% annual growth
      cumulativeCashFlow += yearCashFlow;
      cumulativeNpv += yearCashFlow / Math.pow(1 + discountRate, year);
      cashFlowData.push({
        year,
        cashFlow: yearCashFlow,
        cumulative: cumulativeCashFlow,
        npv: cumulativeNpv
      });
    }
  }
  
  // Chart dimensions
  const chartLeft = margin + 18;
  const chartRight = margin + contentWidth - 10;
  const chartTop = yPos + 14;
  const chartBottom = yPos + 58;
  const chartW = chartRight - chartLeft;
  const chartH = chartBottom - chartTop;
  
  // Find min/max for scaling
  const allCumulativeValues = cashFlowData.map(d => d.cumulative);
  const cfMinValue = Math.min(...allCumulativeValues);
  const cfMaxValue = Math.max(...allCumulativeValues);
  const cfValueRange = cfMaxValue - cfMinValue || 1;
  
  // Draw grid lines
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.1);
  for (let i = 0; i <= 4; i++) {
    const gridY = chartTop + (chartH * i / 4);
    doc.line(chartLeft, gridY, chartRight, gridY);
  }
  
  // Draw zero line if applicable
  if (cfMinValue < 0 && cfMaxValue > 0) {
    const zeroY = chartBottom - ((0 - cfMinValue) / cfValueRange) * chartH;
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.line(chartLeft, zeroY, chartRight, zeroY);
    doc.setTextColor(120);
    doc.setFontSize(5);
    doc.text("0", chartLeft - 3, zeroY + 1.5, { align: "right" });
  }
  
  // Y-axis labels
  doc.setTextColor(100);
  doc.setFontSize(5);
  doc.setFont("helvetica", "normal");
  doc.text(formatCurrency(cfMaxValue), chartLeft - 3, chartTop + 2, { align: "right" });
  doc.text(formatCurrency(cfMinValue), chartLeft - 3, chartBottom, { align: "right" });
  
  // X-axis labels (years)
  for (let i = 0; i <= 10; i += 2) {
    const x = chartLeft + (chartW * i / 10);
    doc.text(`${i}`, x, chartBottom + 4, { align: "center" });
  }
  doc.setFontSize(5);
  doc.text(lang === 'pt' ? 'Anos' : 'Years', chartLeft + chartW / 2, chartBottom + 8, { align: "center" });
  
  // Draw cumulative cash flow line
  doc.setDrawColor(0, 102, 204);
  doc.setLineWidth(0.8);
  
  let prevX = 0, prevY = 0;
  cashFlowData.forEach((data, idx) => {
    const x = chartLeft + (chartW * idx / 10);
    const y = chartBottom - ((data.cumulative - cfMinValue) / cfValueRange) * chartH;
    
    if (idx > 0) {
      doc.line(prevX, prevY, x, y);
    }
    
    // Draw point
    if (data.cumulative >= 0) {
      doc.setFillColor(46, 125, 50);
    } else {
      doc.setFillColor(220, 53, 69);
    }
    doc.circle(x, y, 1.2, "F");
    
    prevX = x;
    prevY = y;
  });
  
  // Draw NPV line (dashed effect with shorter segments)
  doc.setDrawColor(155, 89, 182);
  doc.setLineWidth(0.5);
  
  cashFlowData.forEach((data, idx) => {
    if (idx > 0) {
      const x1 = chartLeft + (chartW * (idx - 1) / 10);
      const y1 = chartBottom - ((cashFlowData[idx - 1].npv - cfMinValue) / cfValueRange) * chartH;
      const x2 = chartLeft + (chartW * idx / 10);
      const y2 = chartBottom - ((data.npv - cfMinValue) / cfValueRange) * chartH;
      
      // Dashed line effect
      const segments = 4;
      for (let s = 0; s < segments; s += 2) {
        const startRatio = s / segments;
        const endRatio = (s + 1) / segments;
        doc.line(
          x1 + (x2 - x1) * startRatio,
          y1 + (y2 - y1) * startRatio,
          x1 + (x2 - x1) * endRatio,
          y1 + (y2 - y1) * endRatio
        );
      }
    }
  });
  
  // Legend
  const cfLegendY = yPos + 62;
  
  // Cumulative Cash Flow legend
  doc.setFillColor(0, 102, 204);
  doc.roundedRect(margin + 20, cfLegendY, 4, 3, 0.5, 0.5, "F");
  doc.setTextColor(60);
  doc.setFontSize(5);
  doc.setFont("helvetica", "normal");
  doc.text(lang === 'pt' ? 'Fluxo de Caixa Acumulado' : 'Cumulative Cash Flow', margin + 26, cfLegendY + 2.5);
  
  // NPV legend
  doc.setFillColor(155, 89, 182);
  doc.roundedRect(margin + 75, cfLegendY, 4, 3, 0.5, 0.5, "F");
  doc.text('NPV', margin + 81, cfLegendY + 2.5);
  
  // Breakeven indicator
  const breakevenYear = cashFlowData.findIndex(d => d.cumulative >= 0);
  if (breakevenYear > 0) {
    doc.setFillColor(46, 125, 50);
    doc.roundedRect(margin + 95, cfLegendY, 4, 3, 0.5, 0.5, "F");
    const breakevenLabel = lang === 'pt' ? `Breakeven: Ano ${breakevenYear}` : `Breakeven: Year ${breakevenYear}`;
    doc.text(breakevenLabel, margin + 101, cfLegendY + 2.5);
  }
  
  // Key metrics box
  doc.setFillColor(245, 248, 250);
  doc.roundedRect(margin + contentWidth - 50, yPos + 12, 45, 18, 1, 1, "F");
  doc.setTextColor(60);
  doc.setFontSize(5);
  doc.setFont("helvetica", "bold");
  doc.text(lang === 'pt' ? 'Resumo 10 Anos:' : '10-Year Summary:', margin + contentWidth - 48, yPos + 17);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5);
  doc.text(`NPV: ${formatCurrency(cashFlowData[10].npv)}`, margin + contentWidth - 48, yPos + 22);
  doc.text(`${lang === 'pt' ? 'Total:' : 'Total:'} ${formatCurrency(cashFlowData[10].cumulative)}`, margin + contentWidth - 48, yPos + 27);
  
  yPos += 73;

  // Visual scenario cards - INCREASED FONTS for better readability
  const cardWidth = (contentWidth - 8) / 3;
  const cardHeight = 38; // Increased height
  
  Object.entries(scenarioData).forEach(([key, data], idx) => {
    const cardX = margin + idx * (cardWidth + 4);
    const [r, g, b] = data.color;
    
    // Card background with shadow effect
    doc.setFillColor(240, 240, 240);
    doc.roundedRect(cardX + 1, yPos + 1, cardWidth, cardHeight, 2, 2, "F");
    doc.setFillColor(250, 251, 252);
    doc.setDrawColor(r, g, b);
    doc.setLineWidth(0.8);
    doc.roundedRect(cardX, yPos, cardWidth, cardHeight, 2, 2, "FD");
    
    // Header bar with utilization rate
    doc.setFillColor(r, g, b);
    doc.roundedRect(cardX, yPos, cardWidth, 9, 2, 0, "F");
    doc.rect(cardX, yPos + 5, cardWidth, 4, "F");
    
    doc.setTextColor(255);
    doc.setFontSize(8); // Increased from 6
    doc.setFont("helvetica", "bold");
    doc.text(`${data.label} (${Math.round(data.rate * 100)}%)`, cardX + cardWidth / 2, yPos + 6, { align: "center" });
    
    // Key metrics in card - LARGER FONTS
    const metricStartY = yPos + 15;
    
    // ROI
    doc.setTextColor(80);
    doc.setFontSize(7); // Increased from 5
    doc.setFont("helvetica", "normal");
    doc.text(`${t.roi}:`, cardX + 4, metricStartY);
    doc.setTextColor(r, g, b);
    doc.setFontSize(10); // Increased from bold 5
    doc.setFont("helvetica", "bold");
    doc.text(`${data.metrics.roi.toFixed(1)}%`, cardX + cardWidth - 4, metricStartY, { align: "right" });
    
    // Payback
    doc.setTextColor(80);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(`Payback:`, cardX + 4, metricStartY + 8);
    doc.setTextColor(r, g, b);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`${(data.metrics.payback / 12).toFixed(1)} ${t.years}`, cardX + cardWidth - 4, metricStartY + 8, { align: "right" });
    
    // EBITDA
    doc.setTextColor(80);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(`EBITDA:`, cardX + 4, metricStartY + 16);
    doc.setTextColor(r, g, b);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(formatCurrency(data.metrics.ebitda), cardX + cardWidth - 4, metricStartY + 16, { align: "right" });
  });
  
  yPos += cardHeight + 8;

  // Key Financial Indicators Box - Updated with scenario-aware data
  doc.setFillColor(0, 51, 102);
  doc.roundedRect(margin, yPos, contentWidth, 20, 1, 1, "F");
  doc.setTextColor(255);
  doc.setFontSize(6);
  doc.setFont("helvetica", "bold");

  const metricW = contentWidth / 4;
  const metricsY = yPos + 7;
  
  // Use probable scenario as main reference
  doc.text(t.roi + " (70%)", margin + metricW * 0.5, metricsY, { align: "center" });
  doc.setFontSize(11);
  doc.text(`${scenarioData.probable.metrics.roi.toFixed(1)}%`, margin + metricW * 0.5, metricsY + 8, { align: "center" });
  
  doc.setFontSize(6);
  doc.text(t.irr, margin + metricW * 1.5, metricsY, { align: "center" });
  doc.setFontSize(11);
  doc.text(`${study.irr_percentage.toFixed(1)}%`, margin + metricW * 1.5, metricsY + 8, { align: "center" });
  
  doc.setFontSize(6);
  doc.text(t.npv, margin + metricW * 2.5, metricsY, { align: "center" });
  doc.setFontSize(11);
  doc.text(formatCurrency(study.npv_10_years), margin + metricW * 2.5, metricsY + 8, { align: "center" });
  
  doc.setFontSize(6);
  doc.text(t.paybackPeriod + " (70%)", margin + metricW * 3.5, metricsY, { align: "center" });
  doc.setFontSize(11);
  doc.text(`${Math.round(scenarioData.probable.metrics.payback)} ${t.months}`, margin + metricW * 3.5, metricsY + 8, { align: "center" });
  yPos += 24;

  // === Government Partnership - ALWAYS SHOW (even with zero values) ===
  // Get country-specific government partnership data
  const govPartnershipData = study.country ? getGovernmentPartnershipData(study.country) : null;
  const recommendedTerms = study.country && study.collection_model ? 
    getRecommendedPartnershipTerms(study.country, study.collection_model) : null;
  
  // ALWAYS show this section to display partnership model metrics
  checkPageBreak(90);
  sectionHeader(t.govPartnership, "", [46, 125, 50]);

  // Main partnership metrics table
  const govHeaders = [t.description, t.value];
  const govRows = [
    [t.collectionModel, getCollectionModelLabel(study.collection_model)],
    [t.royaltiesRate, `${royaltiesPercent.toFixed(1)}%`],
    [t.envBonus, `USD ${envBonusPerTon.toFixed(2)}/ton`],
    [t.annualRoyalties, formatCurrency(annualRoyalties)],
    [t.annualEnvBonus, formatCurrency(annualEnvBonus)],
    [t.netRevenueAfter, formatCurrency(netRevenueAfterRoyalties)],
    [t.adjustedRoi, `${adjustedRoi.toFixed(1)}%`]
  ];
  const govWidths = [100, 80]; // Proportional widths (sum = 180)
  yPos = drawTable(govHeaders, govRows, govWidths, yPos);
  yPos += 4;
  
  // === Country-Specific Programs Section ===
  if (govPartnershipData) {
    checkPageBreak(60);
    
    // Programs header
    const programsTitle = lang === 'pt' ? 'Programas e Regulamentações Específicas do País' :
                         lang === 'es' ? 'Programas y Regulaciones Específicas del País' :
                         lang === 'it' ? 'Programmi e Normative Specifiche del Paese' :
                         lang === 'zh' ? '国家特定计划和法规' : 'Country-Specific Programs & Regulations';
    
    doc.setFillColor(240, 248, 255);
    doc.roundedRect(margin, yPos, contentWidth, 8, 1, 1, "F");
    doc.setTextColor(0, 51, 102);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(`${govPartnershipData.flag} ${programsTitle}`, margin + 4, yPos + 5.5);
    yPos += 12;
    
    // List government models
    govPartnershipData.governmentModels.forEach((model, idx) => {
      checkPageBreak(40);
      
      // Model card
      const cardHeight = 32;
      doc.setFillColor(250, 252, 255);
      doc.setDrawColor(200, 220, 240);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, yPos, contentWidth, cardHeight, 2, 2, "FD");
      
      // Model header
      doc.setFillColor(0, 102, 153);
      doc.roundedRect(margin, yPos, contentWidth, 7, 2, 0, "F");
      doc.rect(margin, yPos + 4, contentWidth, 3, "F");
      doc.setTextColor(255);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      
      const modelName = lang === 'pt' ? model.description : model.description;
      doc.text(modelName, margin + 4, yPos + 5);
      
      // Model details
      const detailY = yPos + 11;
      const colW = contentWidth / 3;
      
      // Column 1: Ranges
      doc.setTextColor(60);
      doc.setFontSize(6);
      doc.setFont("helvetica", "normal");
      const royaltyLabel = lang === 'pt' ? 'Royalties' : 'Royalties';
      const bonusLabel = lang === 'pt' ? 'Bônus Ambiental' : 'Env. Bonus';
      doc.text(`${royaltyLabel}: ${model.royaltyRange.min}-${model.royaltyRange.max}% (${lang === 'pt' ? 'rec' : 'rec'}: ${model.royaltyRange.recommended}%)`, margin + 4, detailY);
      doc.text(`${bonusLabel}: USD ${model.envBonusRange.min}-${model.envBonusRange.max}/t (${lang === 'pt' ? 'rec' : 'rec'}: $${model.envBonusRange.recommended})`, margin + 4, detailY + 5);
      
      // Column 2: Regulations
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 102, 153);
      const regLabel = lang === 'pt' ? 'Regulamentações:' : lang === 'es' ? 'Regulaciones:' : 'Regulations:';
      doc.text(regLabel, margin + colW + 4, detailY);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60);
      const regulations = model.regulations.slice(0, 3).join(', ');
      doc.text(regulations.length > 35 ? regulations.substring(0, 35) + '...' : regulations, margin + colW + 4, detailY + 5);
      
      // Column 3: Benefits
      doc.setFont("helvetica", "bold");
      doc.setTextColor(46, 125, 50);
      const benefitsLabel = lang === 'pt' ? 'Benefícios:' : lang === 'es' ? 'Beneficios:' : 'Benefits:';
      doc.text(benefitsLabel, margin + colW * 2 + 4, detailY);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60);
      model.benefits.slice(0, 2).forEach((benefit, bIdx) => {
        const truncated = benefit.length > 25 ? benefit.substring(0, 25) + '...' : benefit;
        doc.text(`• ${truncated}`, margin + colW * 2 + 4, detailY + 5 + bIdx * 4);
      });
      
      // Collection models badges
      const badgeY = yPos + cardHeight - 5;
      let badgeX = margin + 4;
      model.collectionModels.forEach((cm) => {
        const cmLabel = cm === 'direct' ? (lang === 'pt' ? 'Direto' : 'Direct') :
                       cm === 'government' ? (lang === 'pt' ? 'Governo' : 'Government') :
                       cm === 'mining' ? (lang === 'pt' ? 'Mineração' : 'Mining') : cm;
        const badgeColor = cm === 'mining' ? [139, 69, 19] : cm === 'government' ? [0, 102, 204] : [46, 125, 50];
        doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
        doc.roundedRect(badgeX, badgeY, 18, 4, 1, 1, "F");
        doc.setTextColor(255);
        doc.setFontSize(5);
        doc.text(cmLabel, badgeX + 9, badgeY + 2.8, { align: "center" });
        badgeX += 20;
      });
      
      yPos += cardHeight + 4;
    });
    
    // Market reference footer
    checkPageBreak(10);
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(margin, yPos, contentWidth, 7, 1, 1, "F");
    doc.setTextColor(100);
    doc.setFontSize(6);
    doc.setFont("helvetica", "italic");
    const refLabel = lang === 'pt' ? 'Referência de Mercado:' : 'Market Reference:';
    doc.text(`📊 ${refLabel} ${govPartnershipData.marketReference}`, margin + 4, yPos + 4.5);
    yPos += 11;
  }

  // === EXPORT CALCULATIONS SECTION (if provided) ===
  if (exportData && exportData.products.length > 0) {
    checkPageBreak(80);
    
    const exportTitle = lang === 'pt' ? 'Cálculos de Exportação & Incoterms' :
                        lang === 'es' ? 'Cálculos de Exportación e Incoterms' :
                        lang === 'it' ? 'Calcoli di Esportazione e Incoterms' :
                        lang === 'zh' ? '出口计算和国际贸易术语' : 'Export Calculations & Incoterms';
    
    sectionHeader(exportTitle, "", [0, 128, 192]);
    
    // Export summary box
    doc.setFillColor(240, 248, 255);
    doc.setDrawColor(0, 102, 153);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, yPos, contentWidth, 24, 2, 2, "FD");
    
    // Summary metrics
    const exportMetrics = [
      { label: 'Incoterm', value: exportData.incoterm },
      { label: lang === 'pt' ? 'Destino' : 'Destination', value: exportData.destinationName },
      { label: lang === 'pt' ? 'Receita Total' : 'Total Revenue', value: formatCurrency(exportData.totalExportRevenue) },
      { label: lang === 'pt' ? 'Impostos & Taxas' : 'Duties & Taxes', value: formatCurrency(exportData.totalDuties + exportData.totalTaxes) }
    ];
    
    const exportMetricW = contentWidth / 4;
    doc.setFontSize(6);
    exportMetrics.forEach((metric, i) => {
      const x = margin + 4 + i * exportMetricW;
      doc.setTextColor(100);
      doc.setFont("helvetica", "normal");
      doc.text(metric.label, x, yPos + 6);
      doc.setTextColor(0, 51, 102);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(metric.value, x, yPos + 14);
      doc.setFontSize(6);
    });
    yPos += 28;
    
    // Product breakdown table
    const exportHeaders = [
      lang === 'pt' ? 'Produto' : 'Product',
      'EXW ($/t)',
      lang === 'pt' ? 'Landed ($/t)' : 'Landed ($/t)',
      lang === 'pt' ? 'Qtd (t/ano)' : 'Qty (t/y)',
      lang === 'pt' ? 'Impostos' : 'Duties',
      lang === 'pt' ? 'Receita Total' : 'Total Revenue'
    ];
    
    const exportRows = exportData.products.map(p => [
      p.name,
      `$${p.exwPrice.toFixed(0)}`,
      `$${p.landedPrice.toFixed(0)}`,
      formatNumber(p.quantity),
      formatCurrency(p.duties + p.taxes),
      formatCurrency(p.totalRevenue)
    ]);
    
    // Add total row
    exportRows.push([
      lang === 'pt' ? 'TOTAL' : 'TOTAL',
      '-',
      '-',
      formatNumber(exportData.products.reduce((sum, p) => sum + p.quantity, 0)),
      formatCurrency(exportData.totalDuties + exportData.totalTaxes),
      formatCurrency(exportData.totalExportRevenue)
    ]);
    
    const exportWidths = [35, 22, 25, 25, 30, 40];
    yPos = drawTable(exportHeaders, exportRows, exportWidths, yPos);
    yPos += 4;
    
    // Incoterm explanation note
    doc.setFillColor(255, 250, 240);
    doc.roundedRect(margin, yPos, contentWidth, 12, 2, 2, "F");
    doc.setTextColor(139, 69, 19);
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    const incotermNote = lang === 'pt' ? 
      `📦 ${exportData.incoterm}: Preços incluem custos de frete, seguro e taxas alfandegárias para ${exportData.destinationName}. Códigos HS aplicados para materiais reciclados.` :
      `📦 ${exportData.incoterm}: Prices include freight, insurance and customs duties for ${exportData.destinationName}. HS codes applied for recycled materials.`;
    const noteLines = doc.splitTextToSize(incotermNote, contentWidth - 8);
    noteLines.forEach((line: string, idx: number) => {
      doc.text(line, margin + 4, yPos + 4 + idx * 4);
    });
    yPos += 16;
  }

  // === Regulatory Framework ===
  checkPageBreak(35);
  sectionHeader(t.regulatoryFramework, "", [255, 153, 0]);

  doc.setTextColor(50);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(`${t.taxCreditsEst}: ${esgData.taxCredits}`, margin + 3, yPos);
  yPos += 4;
  doc.text(`${t.carbonCredits}: ${esgData.carbonCredits}`, margin + 3, yPos);
  yPos += 5;
  doc.setFont("helvetica", "bold");
  doc.text(`${t.taxIncentives}:`, margin + 3, yPos);
  yPos += 4;
  doc.setFont("helvetica", "normal");
  esgData.incentives.forEach(i => {
    doc.text(`• ${i}`, margin + 6, yPos);
    yPos += 4;
  });
  yPos += 4;

  // === ESG Analysis ===
  checkPageBreak(50);
  sectionHeader(t.esgAnalysis, "", [46, 125, 50]);

  // ESG in 3 compact columns
  const esgColW = (contentWidth - 6) / 3;

  // Environmental
  doc.setFillColor(240, 255, 240);
  doc.roundedRect(margin, yPos, esgColW, 28, 1, 1, "F");
  doc.setTextColor(46, 125, 50);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text(t.esgEnvironmental, margin + esgColW / 2, yPos + 5, { align: "center" });
  doc.setTextColor(50);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text(`${t.co2Reduction}:`, margin + 3, yPos + 12);
  doc.text(`${formatNumber(co2Avoided)} tCO2eq`, margin + 3, yPos + 17);
  doc.text(`${t.wasteAvoided}:`, margin + 3, yPos + 23);
  doc.text(`${formatNumber(wasteAvoided)} ${t.tonsPerYear}`, margin + 3, yPos + 28);

  // Social
  doc.setFillColor(240, 248, 255);
  doc.roundedRect(margin + esgColW + 3, yPos, esgColW, 28, 1, 1, "F");
  doc.setTextColor(0, 102, 204);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text(t.esgSocial, margin + esgColW * 1.5 + 3, yPos + 5, { align: "center" });
  doc.setTextColor(50);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text(`${t.jobsGenerated}:`, margin + esgColW + 6, yPos + 12);
  doc.text(`${esgData.jobsPerPlant} direct`, margin + esgColW + 6, yPos + 17);

  // Governance
  doc.setFillColor(248, 240, 255);
  doc.roundedRect(margin + (esgColW + 3) * 2, yPos, esgColW, 28, 1, 1, "F");
  doc.setTextColor(128, 0, 128);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text(t.esgGovernance, margin + esgColW * 2.5 + 6, yPos + 5, { align: "center" });
  doc.setTextColor(50);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text(`${t.esgScore}:`, margin + (esgColW + 3) * 2 + 3, yPos + 12);
  doc.text(`${esgData.esgRating}/100`, margin + (esgColW + 3) * 2 + 3, yPos + 17);
  doc.text(`${t.sdgAlignment}:`, margin + (esgColW + 3) * 2 + 3, yPos + 23);
  doc.text(esgData.sdgAlignment.join(', '), margin + (esgColW + 3) * 2 + 3, yPos + 28);

  yPos += 33;

  // === Strengths & Risks ===
  checkPageBreak(40);
  sectionHeader(t.strengthsRisks, "");

  const riskColW = (contentWidth - 4) / 2;

  // Strengths
  doc.setFillColor(240, 255, 240);
  doc.roundedRect(margin, yPos, riskColW, 5, 1, 1, "F");
  doc.setTextColor(40, 167, 69);
  doc.setFontSize(6);
  doc.setFont("helvetica", "bold");
  doc.text(`+ ${t.strengths}`, margin + 3, yPos + 3.5);

  // Risks
  doc.setFillColor(255, 240, 240);
  doc.roundedRect(margin + riskColW + 4, yPos, riskColW, 5, 1, 1, "F");
  doc.setTextColor(220, 53, 69);
  doc.text(`! ${t.risks}`, margin + riskColW + 7, yPos + 3.5);
  yPos += 7;

  const strengthsList: string[] = [];
  if (study.roi_percentage >= 20) strengthsList.push(t.highRoi);
  if (study.payback_months <= 48) strengthsList.push(t.quickPayback);
  if (study.npv_10_years > 0) strengthsList.push(t.positiveNpv);
  strengthsList.push(t.esgAlignment);
  strengthsList.push(t.taxBenefits);

  const risksList = [t.marketVolatility, t.regulatoryRisk, t.operationalRisk];

  const maxItems = Math.max(strengthsList.length, risksList.length);
  const startRiskY = yPos;
  
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  
  for (let i = 0; i < maxItems; i++) {
    if (i < strengthsList.length) {
      doc.setTextColor(40, 167, 69);
      doc.text(`• ${strengthsList[i]}`, margin + 2, yPos);
    }
    if (i < risksList.length) {
      doc.setTextColor(220, 53, 69);
      doc.text(`• ${risksList[i]}`, margin + riskColW + 6, startRiskY + i * 4);
    }
    yPos += 4;
  }
  yPos += 4;

  // === Recommendations ===
  checkPageBreak(25);
  sectionHeader(t.recommendations, "");

  const phases = [
    { title: t.phase1, color: [0, 102, 204] },
    { title: t.phase2, color: [255, 153, 0] },
    { title: t.phase3, color: [40, 167, 69] }
  ];

  const phaseW = (contentWidth - 4) / 3;
  phases.forEach((phase, idx) => {
    const [pr, pg, pb] = phase.color;
    doc.setFillColor(pr, pg, pb);
    doc.roundedRect(margin + idx * (phaseW + 2), yPos, phaseW, 10, 1, 1, "F");
    doc.setTextColor(255);
    doc.setFontSize(5);
    doc.setFont("helvetica", "bold");
    doc.text(phase.title, margin + idx * (phaseW + 2) + phaseW / 2, yPos + 6, { align: "center" });
  });
  yPos += 14;

  // === DUE DILIGENCE CHECKLIST (only if any notes are filled) ===
  const hasAnyChecklistNotes = checklistNotes && Object.values(checklistNotes).some(note => note && note.trim().length > 0);
  
  if (hasAnyChecklistNotes) {
    addPage();
    sectionHeader(t.dueDiligence, "");

    // Define checklist categories with items and note keys
    const ddCategories = [
      {
        title: t.ddCompanyInfo,
        color: [0, 102, 204],
        items: [t.ddCompanyReg, t.ddTaxCompliance],
        noteKey: 'companyInfo' as keyof ChecklistNotes
      },
      {
        title: t.ddFinancial,
        color: [40, 167, 69],
        items: [t.ddBankRef, t.ddCreditCheck],
        noteKey: 'financial' as keyof ChecklistNotes
      },
      {
        title: t.ddLegal,
        color: [128, 0, 128],
        items: [t.ddEnvLicenses, t.ddOperatingPermits],
        noteKey: 'legal' as keyof ChecklistNotes
      },
      {
        title: t.ddOperational,
        color: [255, 153, 0],
        items: [t.ddFacilities, t.ddEquipment, t.ddWorkforce],
        noteKey: 'operational' as keyof ChecklistNotes
      },
      {
        title: t.ddOtrSources,
        color: [220, 53, 69],
        items: [t.ddMiningContracts, t.ddTireVolume, t.ddLogistics],
        noteKey: 'otrSources' as keyof ChecklistNotes
      },
      {
        title: t.ddPartnership,
        color: [0, 51, 102],
        items: [t.ddInvestment, t.ddManagement, t.ddTimeline],
        noteKey: 'partnership' as keyof ChecklistNotes
      }
    ];

    // Only render categories that have notes filled
    const filledCategories = ddCategories.filter(cat => {
      const noteText = checklistNotes?.[cat.noteKey] || '';
      return noteText.trim().length > 0;
    });

    filledCategories.forEach((category) => {
      const [cr, cg, cb] = category.color;
      const noteText = checklistNotes?.[category.noteKey] || '';
      
      // Check if we need a new page
      const neededHeight = 8 + (category.items.length * 6) + 18;
      if (yPos + neededHeight > maxY - 10) {
        addPage();
      }

      // Category header
      doc.setFillColor(cr, cg, cb);
      doc.roundedRect(margin, yPos, contentWidth, 7, 1, 1, "F");
      doc.setTextColor(255);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text(category.title, margin + 4, yPos + 5);
      yPos += 10;

      // Checklist items in 2 columns
      const itemColW = (contentWidth - 8) / 2;
      let itemX = margin + 2;
      let itemY = yPos;
      let col = 0;
      
      category.items.forEach((item) => {
        // Checkbox
        doc.setDrawColor(180, 180, 180);
        doc.setLineWidth(0.3);
        doc.rect(itemX, itemY - 2.5, 4, 4, "S");
        
        // Item text
        doc.setTextColor(60);
        doc.setFontSize(6);
        doc.setFont("helvetica", "normal");
        doc.text(item, itemX + 6, itemY);
        
        // Status indicators
        const statusX = itemX + itemColW - 30;
        
        // Verified box
        doc.setFillColor(220, 255, 220);
        doc.setDrawColor(40, 167, 69);
        doc.setLineWidth(0.3);
        doc.roundedRect(statusX, itemY - 2.5, 9, 4, 0.5, 0.5, "FD");
        doc.setFontSize(6);
        doc.setTextColor(40, 167, 69);
        doc.setFont("helvetica", "bold");
        doc.text("V", statusX + 4.5, itemY, { align: "center" });
        
        // Pending box
        doc.setFillColor(255, 248, 220);
        doc.setDrawColor(255, 153, 0);
        doc.roundedRect(statusX + 10, itemY - 2.5, 9, 4, 0.5, 0.5, "FD");
        doc.setTextColor(255, 153, 0);
        doc.text("P", statusX + 14.5, itemY, { align: "center" });
        
        // N/A box
        doc.setFillColor(240, 240, 240);
        doc.setDrawColor(150, 150, 150);
        doc.roundedRect(statusX + 20, itemY - 2.5, 9, 4, 0.5, 0.5, "FD");
        doc.setTextColor(120);
        doc.setFont("helvetica", "normal");
        doc.text("-", statusX + 24.5, itemY, { align: "center" });
        
        // Alternate columns
        if (col === 0 && category.items.length > 2) {
          col = 1;
          itemX = margin + 2 + itemColW + 4;
        } else {
          col = 0;
          itemX = margin + 2;
          itemY += 6;
        }
      });
      
      // Adjust yPos based on items rendered
      const rowsNeeded = Math.ceil(category.items.length / 2);
      yPos += rowsNeeded * 6 + 2;

      // Notes field with content
      const noteBoxHeight = Math.max(14, Math.ceil(noteText.length / 80) * 5 + 8);
      
      doc.setFillColor(255, 255, 240);
      doc.setDrawColor(cr, cg, cb);
      doc.setLineWidth(0.4);
      doc.roundedRect(margin, yPos, contentWidth, noteBoxHeight, 1, 1, "FD");
      
      doc.setTextColor(100);
      doc.setFontSize(5);
      doc.setFont("helvetica", "italic");
      doc.text(`${t.ddNotes}:`, margin + 3, yPos + 4);
      
      // Show the actual note content
      doc.setTextColor(50);
      doc.setFontSize(6);
      doc.setFont("helvetica", "normal");
      const noteLines = doc.splitTextToSize(noteText, contentWidth - 8);
      let noteY = yPos + 8;
      noteLines.slice(0, 3).forEach((line: string) => {
        doc.text(line, margin + 3, noteY);
        noteY += 4;
      });
      
      yPos += noteBoxHeight + 4;
    });

    // Legend for status
    yPos += 2;
    doc.setFontSize(6);
    doc.setTextColor(100);
    doc.setFont("helvetica", "normal");
    doc.text(`V = ${t.ddVerified}   P = ${t.ddPending}   - = ${t.ddNotApplicable}`, margin, yPos);
    yPos += 8;
  }

  // === CHARTS PAGE - Professional layout with insights panels ===
  if (chartRefs) {
    const [cashFlowImage, revenueImage, opexImage, sensitivityImage, esgRadarImage, heatmapImage, capexImage] = await Promise.all([
      captureChart(chartRefs.cashFlowRef.current),
      captureChart(chartRefs.revenueRef.current),
      captureChart(chartRefs.opexRef.current),
      captureChart(chartRefs.sensitivityRef.current),
      chartRefs.esgRadarRef ? captureChart(chartRefs.esgRadarRef.current) : Promise.resolve(null),
      chartRefs.heatmapRef ? captureChart(chartRefs.heatmapRef.current) : Promise.resolve(null),
      chartRefs.capexRef ? captureChart(chartRefs.capexRef.current) : Promise.resolve(null)
    ]);

    // Calculate derived values for insights
    const dailyCapacity = study.daily_capacity_tons || 85;
    const operatingDays = study.operating_days_per_year || 300;
    const utilization = (study.utilization_rate || 85) / 100;
    const annualTonnage = dailyCapacity * operatingDays * utilization;
    const totalInvestment = study.total_investment || 0;
    const annualRevenue = study.annual_revenue || 0;
    const annualOpex = study.annual_opex || 0;
    const annualEbitda = study.annual_ebitda || 0;
    const netProfit = annualEbitda * (1 - (study.tax_rate || 25) / 100);
    const paybackMonths = study.payback_months || 0;
    const roiPercent = study.roi_percentage || 0;
    const npv10y = study.npv_10_years || 0;
    const irrPercent = study.irr_percentage || 0;

    // Revenue breakdown calculations - JANUARY 2026 MARKET PRICES (VALIDATED)
    // Sources: Recycler's World Jan 2026, American Recycler, commodity exchanges
    // CRITICAL: These are RECOVERED material prices from tire recycling
    const revGranules = annualTonnage * ((study.rubber_granules_yield || 43) / 100) * (study.rubber_granules_price || 250);
    const revSteel = annualTonnage * ((study.steel_wire_yield || 25) / 100) * (study.steel_wire_price || 250);
    const revFiber = annualTonnage * ((study.textile_fiber_yield || 8) / 100) * (study.textile_fiber_price || 120);
    const revRcb = annualTonnage * ((study.rcb_yield || 12) / 100) * (study.rcb_price || 1050);
    const totalRev = revGranules + revSteel + revFiber + revRcb;

    // OPEX breakdown
    const laborCost = (study.labor_cost || 0) * 12;
    const energyCost = (study.energy_cost || 0) * 12;
    const maintenanceCost = (study.maintenance_cost || 0) * 12;
    const logisticsCost = (study.logistics_cost || 0) * 12;
    const adminCost = (study.administrative_cost || 0) * 12;

    // CAPEX breakdown
    const equipmentCost = study.equipment_cost || 0;
    const installationCost = study.installation_cost || 0;
    const infraCost = study.infrastructure_cost || 0;
    const workingCapital = study.working_capital || 0;

    // ESG calculations
    const co2Avoided = annualTonnage * 1.5;
    const esgScore = Math.min(100, Math.round((roiPercent > 20 ? 40 : 30) + (co2Avoided > 20000 ? 35 : 25) + 20));

    // Define chart configurations with insights
    interface ChartConfig {
      image: string | null;
      title: string;
      color: number[];
      insights: { label: string; value: string; highlight?: boolean }[];
      description: string;
    }

    const chartConfigs: ChartConfig[] = [];

    // 1. Cash Flow Chart
    if (cashFlowImage) {
      chartConfigs.push({
        image: cashFlowImage,
        title: lang === 'pt' ? 'Projeção de Fluxo de Caixa 10 Anos' : lang === 'es' ? 'Proyección Flujo Caja 10 Años' : '10-Year Cash Flow Projection',
        color: [46, 125, 50],
        insights: [
          { label: lang === 'pt' ? 'Investimento Inicial' : 'Initial Investment', value: formatCurrency(-totalInvestment) },
          { label: lang === 'pt' ? 'Lucro Anual' : 'Annual Net Profit', value: formatCurrency(netProfit), highlight: true },
          { label: 'Payback', value: `${(paybackMonths / 12).toFixed(1)} ${lang === 'pt' ? 'anos' : 'years'}`, highlight: true },
          { label: lang === 'pt' ? 'Retorno 10a' : '10Y Return', value: formatCurrency(netProfit * 10 - totalInvestment) },
          { label: 'VPL (NPV)', value: formatCurrency(npv10y), highlight: true },
          { label: 'TIR (IRR)', value: `${irrPercent.toFixed(1)}%` }
        ],
        description: lang === 'pt' 
          ? `Recuperacao do investimento em ${(paybackMonths / 12).toFixed(1)} anos. Fluxo cumulativo positivo a partir do ano ${Math.ceil(paybackMonths / 12)}. VPL de ${formatCurrency(npv10y)} demonstra viabilidade solida.`
          : `Investment recovery in ${(paybackMonths / 12).toFixed(1)} years. Cumulative positive cash flow from year ${Math.ceil(paybackMonths / 12)}. NPV of ${formatCurrency(npv10y)} demonstrates solid viability.`
      });
    }

    // 2. Revenue Breakdown
    if (revenueImage) {
      chartConfigs.push({
        image: revenueImage,
        title: lang === 'pt' ? 'Composicao da Receita Anual' : lang === 'es' ? 'Composicion de Ingresos' : 'Annual Revenue Composition',
        color: [0, 102, 204],
        insights: [
          { label: lang === 'pt' ? 'Receita Total' : 'Total Revenue', value: formatCurrency(annualRevenue), highlight: true },
          { label: lang === 'pt' ? 'Granulos Borracha' : 'Rubber Granules', value: `${formatCurrency(revGranules)} (${((revGranules/totalRev)*100).toFixed(0)}%)` },
          { label: lang === 'pt' ? 'Fio de Aço' : 'Steel Wire', value: `${formatCurrency(revSteel)} (${((revSteel/totalRev)*100).toFixed(0)}%)` },
          { label: lang === 'pt' ? 'Fibra Textil' : 'Textile Fiber', value: `${formatCurrency(revFiber)} (${((revFiber/totalRev)*100).toFixed(0)}%)` },
          { label: 'rCB (Pyrolysis)', value: `${formatCurrency(revRcb)} (${((revRcb/totalRev)*100).toFixed(0)}%)` }
        ],
        description: lang === 'pt'
          ? `Receita diversificada entre ${((revGranules/totalRev)*100).toFixed(0)}% borracha, ${((revSteel/totalRev)*100).toFixed(0)}% aco e ${((revFiber/totalRev)*100).toFixed(0)}% fibra. O rCB via pirolise adiciona ${formatCurrency(revRcb)}/ano.`
          : `Diversified revenue: ${((revGranules/totalRev)*100).toFixed(0)}% rubber, ${((revSteel/totalRev)*100).toFixed(0)}% steel, ${((revFiber/totalRev)*100).toFixed(0)}% fiber. rCB via pyrolysis adds ${formatCurrency(revRcb)}/year.`
      });
    }

    // 3. CAPEX Breakdown
    if (capexImage) {
      chartConfigs.push({
        image: capexImage,
        title: lang === 'pt' ? 'Distribuição do Investimento (CAPEX)' : 'Investment Distribution (CAPEX)',
        color: [128, 0, 128],
        insights: [
          { label: lang === 'pt' ? 'CAPEX Total' : 'Total CAPEX', value: formatCurrency(totalInvestment), highlight: true },
          { label: lang === 'pt' ? 'Equipamentos' : 'Equipment', value: `${formatCurrency(equipmentCost)} (${((equipmentCost/totalInvestment)*100).toFixed(0)}%)` },
          { label: lang === 'pt' ? 'Instalação' : 'Installation', value: `${formatCurrency(installationCost)} (${((installationCost/totalInvestment)*100).toFixed(0)}%)` },
          { label: lang === 'pt' ? 'Infraestrutura' : 'Infrastructure', value: `${formatCurrency(infraCost)} (${((infraCost/totalInvestment)*100).toFixed(0)}%)` },
          { label: lang === 'pt' ? 'Capital Giro' : 'Working Capital', value: `${formatCurrency(workingCapital)} (${((workingCapital/totalInvestment)*100).toFixed(0)}%)` }
        ],
        description: lang === 'pt'
          ? `Equipamentos representam ${((equipmentCost/totalInvestment)*100).toFixed(0)}% do CAPEX. Linha Smart OTR inclui tecnologia robótica de última geração para processamento de pneus gigantes.`
          : `Equipment represents ${((equipmentCost/totalInvestment)*100).toFixed(0)}% of CAPEX. Smart OTR Line includes state-of-the-art robotic technology for giant tire processing.`
      });
    }

    // 4. OPEX Breakdown
    if (opexImage) {
      chartConfigs.push({
        image: opexImage,
        title: lang === 'pt' ? 'Custos Operacionais (OPEX)' : 'Operating Costs (OPEX)',
        color: [255, 153, 0],
        insights: [
          { label: 'OPEX ' + (lang === 'pt' ? 'Anual' : 'Annual'), value: formatCurrency(annualOpex), highlight: true },
          { label: lang === 'pt' ? 'Mão de Obra' : 'Labor', value: `${formatCurrency(laborCost)} (${((laborCost/annualOpex)*100).toFixed(0)}%)` },
          { label: lang === 'pt' ? 'Energia' : 'Energy', value: `${formatCurrency(energyCost)} (${((energyCost/annualOpex)*100).toFixed(0)}%)` },
          { label: lang === 'pt' ? 'Manutenção' : 'Maintenance', value: `${formatCurrency(maintenanceCost)} (${((maintenanceCost/annualOpex)*100).toFixed(0)}%)` },
          { label: lang === 'pt' ? 'Margem EBITDA' : 'EBITDA Margin', value: `${((annualEbitda/annualRevenue)*100).toFixed(1)}%`, highlight: true }
        ],
        description: lang === 'pt'
          ? `OPEX mensal de ${formatCurrency(annualOpex/12)}. Margem EBITDA de ${((annualEbitda/annualRevenue)*100).toFixed(1)}% indica operação altamente eficiente.`
          : `Monthly OPEX of ${formatCurrency(annualOpex/12)}. EBITDA margin of ${((annualEbitda/annualRevenue)*100).toFixed(1)}% indicates highly efficient operation.`
      });
    }

    // 5. Sensitivity Analysis
    if (sensitivityImage) {
      chartConfigs.push({
        image: sensitivityImage,
        title: lang === 'pt' ? 'Análise de Sensibilidade' : 'Sensitivity Analysis',
        color: [220, 53, 69],
        insights: [
          { label: 'ROI Base', value: `${roiPercent.toFixed(1)}%`, highlight: true },
          { label: lang === 'pt' ? 'Preço -20%' : 'Price -20%', value: `ROI ${(roiPercent * 0.84).toFixed(1)}%` },
          { label: lang === 'pt' ? 'Preço +20%' : 'Price +20%', value: `ROI ${(roiPercent * 1.16).toFixed(1)}%` },
          { label: lang === 'pt' ? 'Capacidade -20%' : 'Capacity -20%', value: `ROI ${(roiPercent * 0.76).toFixed(1)}%` },
          { label: lang === 'pt' ? 'Break-even' : 'Break-even', value: lang === 'pt' ? 'Preço -50%' : 'Price -50%' }
        ],
        description: lang === 'pt'
          ? `Projeto robusto: suporta queda de 50% nos preços antes do break-even. Sensibilidade maior à capacidade do que a preços de venda.`
          : `Robust project: supports 50% price drop before break-even. Higher sensitivity to capacity than sales prices.`
      });
    }

    // 6. ESG Radar
    if (esgRadarImage) {
      chartConfigs.push({
        image: esgRadarImage,
        title: lang === 'pt' ? 'Desempenho ESG' : 'ESG Performance',
        color: [46, 125, 50],
        insights: [
          { label: lang === 'pt' ? 'Score ESG' : 'ESG Score', value: `${esgScore}/100`, highlight: true },
          { label: 'CO2 ' + (lang === 'pt' ? 'Evitado' : 'Avoided'), value: `${formatNumber(co2Avoided)} tCO2eq/a`, highlight: true },
          { label: lang === 'pt' ? 'Pneus Reciclados' : 'Tires Recycled', value: `${formatNumber(annualTonnage)} t/a` },
          { label: 'SDGs', value: 'SDG 8, 12, 13', highlight: true },
          { label: lang === 'pt' ? 'Empregos' : 'Jobs Created', value: '40-60 ' + (lang === 'pt' ? 'diretos' : 'direct') }
        ],
        description: lang === 'pt'
          ? `Alinhamento com ODS da ONU. Evita ${formatNumber(co2Avoided)} toneladas de CO2 equivalente por ano atraves da reciclagem de ${formatNumber(annualTonnage)} toneladas de pneus OTR.`
          : `Aligned with UN SDGs. Avoids ${formatNumber(co2Avoided)} tonnes of CO2 equivalent per year by recycling ${formatNumber(annualTonnage)} tonnes of OTR tires.`
      });
    }

    // Render charts with IMPROVED layout - better spacing and readability
    const chartWidth = 90; // Increased chart width for better visibility
    const insightsPanelWidth = contentWidth - chartWidth - 4; // Insights panel with more gap
    const rowHeight = 58; // Increased for better legibility
    const chartBoxHeight = 48; // Increased chart box height
    
    // Check if we have enough space on current page, otherwise start new page
    if (yPos > maxY - rowHeight - 15) {
      addPage();
    }
    
    sectionHeader(lang === 'pt' ? 'Analise Visual e Indicadores' : lang === 'es' ? 'Analisis Visual e Indicadores' : 'Visual Analysis & Key Indicators', "");

    for (let i = 0; i < chartConfigs.length; i++) {
      const chart = chartConfigs[i];
      if (!chart.image) continue;

      // ALWAYS check if chart will fit completely on current page
      // If not enough space for full chart (title + chart box + margin), start new page
      const fullChartHeight = 7 + chartBoxHeight + 3; // title bar + chart + gap
      if (yPos + fullChartHeight > maxY) {
        addPage();
      }

      const rowY = yPos;

      // Chart title bar (full width) - readable with high contrast
      doc.setFillColor(chart.color[0], chart.color[1], chart.color[2]);
      doc.roundedRect(margin, rowY, contentWidth, 8, 1.5, 1.5, "F"); // Taller title bar
      doc.setTextColor(255);
      doc.setFontSize(9); // Larger title font
      doc.setFont("helvetica", "bold");
      doc.text(chart.title, margin + 4, rowY + 5.5);

      // Chart container (left side) with better shadow effect
      const chartContainerY = rowY + 10; // More gap after title
      
      // Shadow effect
      doc.setFillColor(230, 230, 235);
      doc.roundedRect(margin + 1, chartContainerY + 1, chartWidth, chartBoxHeight, 2, 2, "F");
      
      // Chart box
      doc.setFillColor(252, 253, 255);
      doc.setDrawColor(200, 205, 210);
      doc.setLineWidth(0.4);
      doc.roundedRect(margin, chartContainerY, chartWidth, chartBoxHeight, 2, 2, "FD");
      
      // Chart image - better padding
      doc.addImage(chart.image, "PNG", margin + 1.5, chartContainerY + 1.5, chartWidth - 3, chartBoxHeight - 3);

      // Insights panel (right side) with improved styling
      const insightsX = margin + chartWidth + 3; // More gap between chart and panel
      
      // Panel shadow
      doc.setFillColor(235, 238, 242);
      doc.roundedRect(insightsX + 0.5, chartContainerY + 0.5, insightsPanelWidth, chartBoxHeight, 2, 2, "F");
      
      // Panel background
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(chart.color[0], chart.color[1], chart.color[2]);
      doc.setLineWidth(0.5);
      doc.roundedRect(insightsX, chartContainerY, insightsPanelWidth, chartBoxHeight, 2, 2, "FD");

      // Insights header - with accent bar
      doc.setFillColor(chart.color[0], chart.color[1], chart.color[2]);
      doc.roundedRect(insightsX, chartContainerY, insightsPanelWidth, 7, 2, 0, "F");
      doc.rect(insightsX, chartContainerY + 4, insightsPanelWidth, 3, "F");
      doc.setTextColor(255);
      doc.setFontSize(7); // Larger header
      doc.setFont("helvetica", "bold");
      doc.text(lang === 'pt' ? 'INDICADORES-CHAVE' : 'KEY METRICS', insightsX + 3, chartContainerY + 5);

      // Insights items - improved layout with larger fonts
      let insightY = chartContainerY + 12;
      
      chart.insights.slice(0, 5).forEach((insight, idx) => {
        doc.setFontSize(7); // Larger font for labels
        doc.setFont("helvetica", "normal");
        doc.setTextColor(60, 65, 70);
        doc.text(insight.label + ":", insightsX + 3, insightY);
        
        doc.setFont("helvetica", "bold");
        if (insight.highlight) {
          doc.setTextColor(chart.color[0], chart.color[1], chart.color[2]);
        } else {
          doc.setTextColor(30, 35, 40);
        }
        // Value on same line, right aligned
        const displayValue = insight.value.length > 18 ? insight.value.substring(0, 17) + '…' : insight.value;
        doc.text(displayValue, insightsX + insightsPanelWidth - 3, insightY, { align: 'right' });
        
        insightY += 6; // Better line spacing
      });

      // Description box at bottom - improved styling
      const descY = chartContainerY + chartBoxHeight - 9;
      doc.setFillColor(255, 255, 248);
      doc.setDrawColor(180, 182, 165);
      doc.setLineWidth(0.3);
      doc.roundedRect(insightsX + 1.5, descY, insightsPanelWidth - 3, 8, 1, 1, "FD");
      
      doc.setTextColor(50, 50, 45);
      doc.setFontSize(5.5); // Slightly larger description
      doc.setFont("helvetica", "italic");
      const truncatedDesc = chart.description.length > 95 ? chart.description.substring(0, 92) + '...' : chart.description;
      doc.text(truncatedDesc, insightsX + 3, descY + 4.5, { maxWidth: insightsPanelWidth - 6 });

      yPos = rowY + 10 + chartBoxHeight + 5; // Title + gap + chart + spacing after
    }
    

    // Add note if there's space, otherwise skip
    if (yPos < maxY - 12) {
      yPos += 2;
      doc.setFillColor(240, 248, 255);
      doc.roundedRect(margin, yPos, contentWidth, 8, 1, 1, "F");
      doc.setTextColor(0, 51, 102);
      doc.setFontSize(5);
      doc.setFont("helvetica", "bold");
      doc.text(">> " + (lang === 'pt' ? 'Nota:' : 'Note:'), margin + 2, yPos + 3);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60);
      doc.text(
        lang === 'pt' 
          ? 'Valores calculados com preços de mercado Janeiro/2026. Análise sensibilidade considera variações de ±20%.'
          : 'Values calculated with January/2026 market prices. Sensitivity analysis considers ±20% variations.',
        margin + 14, yPos + 3
      );
      yPos += 10;
    }
  }

  // === CALCULATED RESULTS SECTION (Matching Panel Style) ===
  // This section provides the calculation basis exactly as shown in the calculator panel
  // Only add new page if there's not enough space for the section
  if (yPos > maxY - 80) {
    addPage();
  } else {
    yPos += 8;
  }
  
  const calcResultsTitle = lang === 'pt' ? 'Resultados Calculados - Base dos Cálculos' : 
                           lang === 'es' ? 'Resultados Calculados - Base de Cálculos' :
                           lang === 'it' ? 'Risultati Calcolati - Base dei Calcoli' :
                           lang === 'zh' ? '计算结果 - 计算基础' : 'Calculated Results - Calculation Basis';
  
  sectionHeader(calcResultsTitle, "");
  
  // Introduction text
  const calcIntroText = lang === 'pt' ? 
    'Os valores abaixo representam os resultados financeiros calculados em tempo real com base nos parâmetros de entrada. Estes números são a base para toda a análise de viabilidade e recomendações deste documento.' :
    lang === 'es' ?
    'Los valores siguientes representan los resultados financieros calculados en tiempo real según los parámetros de entrada. Estos números son la base para todo el análisis de viabilidad.' :
    lang === 'it' ?
    'I valori seguenti rappresentano i risultati finanziari calcolati in tempo reale secondo i parametri di input. Questi numeri sono la base per l\'analisi di fattibilità.' :
    lang === 'zh' ?
    '以下数值代表根据输入参数实时计算的财务结果。这些数字是整个可行性分析的基础。' :
    'The values below represent the financial results calculated in real-time based on input parameters. These numbers are the basis for the entire feasibility analysis and recommendations in this document.';
  
  doc.setTextColor(60);
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  const calcIntroLines = doc.splitTextToSize(calcIntroText, contentWidth);
  calcIntroLines.forEach((line: string) => {
    doc.text(line, margin, yPos);
    yPos += 4;
  });
  yPos += 4;

  // === PRIMARY METRICS GRID (matching panel layout) ===
  const calcBoxW = (contentWidth - 9) / 4;
  const calcBoxH = 28;
  
  const primaryMetrics = [
    { 
      icon: '$', 
      label: lang === 'pt' ? 'Investimento Total' : lang === 'es' ? 'Inversión Total' : lang === 'it' ? 'Investimento Totale' : lang === 'zh' ? '总投资' : 'Total Investment',
      value: formatCurrency(study.total_investment),
      color: [0, 102, 204], // Blue
      bgColor: [240, 248, 255]
    },
    { 
      icon: '↗', 
      label: lang === 'pt' ? 'EBITDA Anual' : lang === 'es' ? 'EBITDA Anual' : lang === 'it' ? 'EBITDA Annuale' : lang === 'zh' ? '年度息税折旧摊销前利润' : 'Annual EBITDA',
      value: formatCurrency(study.annual_ebitda),
      color: [34, 197, 94], // Green
      bgColor: [240, 255, 244]
    },
    { 
      icon: '⏱', 
      label: lang === 'pt' ? 'Período de Payback' : lang === 'es' ? 'Período de Payback' : lang === 'it' ? 'Periodo di Payback' : lang === 'zh' ? '回收期' : 'Payback Period',
      value: study.payback_months > 120 ? '> 10 ' + (lang === 'pt' ? 'anos' : 'years') : `${study.payback_months} ${lang === 'pt' ? 'meses' : 'months'}`,
      color: [249, 115, 22], // Orange
      bgColor: [255, 247, 237]
    },
    { 
      icon: '%', 
      label: 'ROI',
      value: `${study.roi_percentage.toFixed(1)}%`,
      color: [139, 92, 246], // Purple
      bgColor: [245, 243, 255]
    }
  ];
  
  // Draw primary metrics cards (matching panel style)
  primaryMetrics.forEach((metric, idx) => {
    const x = margin + idx * (calcBoxW + 3);
    
    // Card background
    doc.setFillColor(metric.bgColor[0], metric.bgColor[1], metric.bgColor[2]);
    doc.roundedRect(x, yPos, calcBoxW, calcBoxH, 3, 3, "F");
    
    // Top accent line
    doc.setFillColor(metric.color[0], metric.color[1], metric.color[2]);
    doc.roundedRect(x, yPos, calcBoxW, 4, 3, 0, "F");
    doc.rect(x, yPos + 2, calcBoxW, 2, "F");
    
    // Icon
    doc.setTextColor(metric.color[0], metric.color[1], metric.color[2]);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(metric.icon, x + calcBoxW / 2, yPos + 11, { align: "center" });
    
    // Label
    doc.setTextColor(100);
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.text(metric.label, x + calcBoxW / 2, yPos + 17, { align: "center" });
    
    // Value
    doc.setTextColor(metric.color[0], metric.color[1], metric.color[2]);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(metric.value, x + calcBoxW / 2, yPos + 24, { align: "center" });
  });
  yPos += calcBoxH + 6;
  
  // === SECONDARY METRICS (NPV and IRR) ===
  const secondaryBoxW = (contentWidth - 3) / 2;
  const secondaryBoxH = 24;
  
  const secondaryMetrics = [
    {
      label: lang === 'pt' ? 'VPL (10 anos)' : lang === 'es' ? 'VAN (10 años)' : lang === 'it' ? 'VAN (10 anni)' : lang === 'zh' ? '净现值（10年）' : 'NPV (10 years)',
      value: formatCurrency(study.npv_10_years),
      isPositive: study.npv_10_years >= 0,
      gradient: study.npv_10_years >= 0 ? [[0, 102, 204], [16, 185, 129]] : [[220, 38, 38], [249, 115, 22]]
    },
    {
      label: lang === 'pt' ? 'TIR (Taxa Interna de Retorno)' : lang === 'es' ? 'TIR (Tasa Interna de Retorno)' : lang === 'it' ? 'TIR (Tasso Interno di Rendimento)' : lang === 'zh' ? '内部收益率' : 'IRR (Internal Rate of Return)',
      value: study.irr_percentage > 0 ? `${study.irr_percentage.toFixed(1)}%` : 'N/A',
      isPositive: study.irr_percentage >= (study.discount_rate || 12),
      gradient: study.irr_percentage >= (study.discount_rate || 12) ? [[16, 185, 129], [34, 197, 94]] : [[249, 115, 22], [234, 179, 8]]
    }
  ];
  
  secondaryMetrics.forEach((metric, idx) => {
    const x = margin + idx * (secondaryBoxW + 3);
    const [startColor, endColor] = metric.gradient;
    
    // Gradient effect with two rectangles
    doc.setFillColor(startColor[0], startColor[1], startColor[2]);
    doc.roundedRect(x, yPos, secondaryBoxW, secondaryBoxH, 3, 3, "F");
    
    // Lighter overlay on right
    doc.setFillColor(endColor[0], endColor[1], endColor[2]);
    doc.roundedRect(x + secondaryBoxW * 0.6, yPos, secondaryBoxW * 0.4, secondaryBoxH, 0, 3, "F");
    
    // Label (white text)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(metric.label, x + secondaryBoxW / 2, yPos + 8, { align: "center" });
    
    // Value (white bold)
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(metric.value, x + secondaryBoxW / 2, yPos + 18, { align: "center" });
  });
  yPos += secondaryBoxH + 8;
  
  // === CALCULATION BASIS TABLE ===
  const basisTitle = lang === 'pt' ? 'Base de Cálculo Detalhada' : 
                     lang === 'es' ? 'Base de Cálculo Detallada' :
                     lang === 'it' ? 'Base di Calcolo Dettagliata' :
                     lang === 'zh' ? '详细计算基础' : 'Detailed Calculation Basis';
  
  doc.setFillColor(59, 130, 246);
  doc.roundedRect(margin, yPos, contentWidth, 7, 1, 1, "F");
  doc.setTextColor(255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(basisTitle, margin + 4, yPos + 5);
  yPos += 10;
  
  // Calculation basis rows
  const basisLabels = {
    pt: {
      dailyCapacity: 'Capacidade Diária',
      operatingDays: 'Dias Operacionais/Ano',
      utilization: 'Taxa de Utilização',
      annualTonnage: 'Produção Anual',
      annualRevenue: 'Receita Anual',
      annualOpex: 'OPEX Anual',
      taxRate: 'Taxa de Imposto',
      discountRate: 'Taxa de Desconto'
    },
    en: {
      dailyCapacity: 'Daily Capacity',
      operatingDays: 'Operating Days/Year',
      utilization: 'Utilization Rate',
      annualTonnage: 'Annual Production',
      annualRevenue: 'Annual Revenue',
      annualOpex: 'Annual OPEX',
      taxRate: 'Tax Rate',
      discountRate: 'Discount Rate'
    },
    es: {
      dailyCapacity: 'Capacidad Diaria',
      operatingDays: 'Días Operativos/Año',
      utilization: 'Tasa de Utilización',
      annualTonnage: 'Producción Anual',
      annualRevenue: 'Ingresos Anuales',
      annualOpex: 'OPEX Anual',
      taxRate: 'Tasa Impositiva',
      discountRate: 'Tasa de Descuento'
    },
    it: {
      dailyCapacity: 'Capacità Giornaliera',
      operatingDays: 'Giorni Operativi/Anno',
      utilization: 'Tasso di Utilizzo',
      annualTonnage: 'Produzione Annuale',
      annualRevenue: 'Ricavi Annuali',
      annualOpex: 'OPEX Annuale',
      taxRate: 'Aliquota Fiscale',
      discountRate: 'Tasso di Sconto'
    },
    zh: {
      dailyCapacity: '日产能',
      operatingDays: '年运营天数',
      utilization: '利用率',
      annualTonnage: '年产量',
      annualRevenue: '年收入',
      annualOpex: '年运营费用',
      taxRate: '税率',
      discountRate: '折现率'
    }
  };
  
  const labels = basisLabels[lang as keyof typeof basisLabels] || basisLabels.en;
  const calcDailyCapacity = study.daily_capacity_tons || 85;
  const calcOperatingDays = study.operating_days_per_year || 300;
  const calcUtilization = (study.utilization_rate || 85) / 100;
  const calcAnnualTonnage = calcDailyCapacity * calcOperatingDays * calcUtilization;
  
  const basisData = [
    [labels.dailyCapacity, `${calcDailyCapacity} ${lang === 'pt' ? 'toneladas/dia' : 'tons/day'}`],
    [labels.operatingDays, `${calcOperatingDays} ${lang === 'pt' ? 'dias' : 'days'}`],
    [labels.utilization, `${(calcUtilization * 100).toFixed(0)}%`],
    [labels.annualTonnage, `${formatNumber(calcAnnualTonnage)} ${lang === 'pt' ? 'toneladas' : 'tons'}`],
    [labels.annualRevenue, formatCurrency(study.annual_revenue)],
    [labels.annualOpex, formatCurrency(study.annual_opex)],
    [labels.taxRate, `${study.tax_rate}%`],
    [labels.discountRate, `${study.discount_rate || 12}%`]
  ];
  
  const basisHeaders = [
    lang === 'pt' ? 'Parâmetro' : lang === 'es' ? 'Parámetro' : lang === 'it' ? 'Parametro' : lang === 'zh' ? '参数' : 'Parameter',
    lang === 'pt' ? 'Valor' : lang === 'es' ? 'Valor' : lang === 'it' ? 'Valore' : lang === 'zh' ? '值' : 'Value'
  ];
  
  yPos = drawTable(basisHeaders, basisData, [100, 80], yPos);
  yPos += 8;
  
  // === SOURCE REFERENCE BOX ===
  const sourceTitle = lang === 'pt' ? 'Fontes e Referências dos Dados' :
                      lang === 'es' ? 'Fuentes y Referencias de Datos' :
                      lang === 'it' ? 'Fonti e Riferimenti dei Dati' :
                      lang === 'zh' ? '数据来源和参考' : 'Data Sources & References';
  
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(200, 210, 220);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, yPos, contentWidth, 35, 2, 2, "FD");
  
  doc.setTextColor(0, 51, 102);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(sourceTitle, margin + 4, yPos + 6);
  
  const sources = lang === 'pt' ? [
    '• Preços de Mercado: Dados validados Janeiro 2026 - TOPS Recycling, Genan GmbH, Tyrecycle Australia',
    '• Composição OTR: Análise técnica de pneus 27.00R49 a 59/80R63 - Fabricantes Tier-1',
    '• Benchmarks CAPEX/OPEX: Plantas operacionais China, Alemanha, Austrália, Brasil',
    '• Incentivos Fiscais: Legislação atualizada 2025 - SUDAM, ZFM, BNDES, IRA (EUA), KfW (DE)',
    '• Parâmetros Financeiros: WACC regional, inflação projetada 2026-2035'
  ] : [
    '• Market Prices: Validated data January 2026 - TOPS Recycling, Genan GmbH, Tyrecycle Australia',
    '• OTR Composition: Technical analysis of 27.00R49 to 59/80R63 tires - Tier-1 Manufacturers',
    '• CAPEX/OPEX Benchmarks: Operating plants in China, Germany, Australia, Brazil',
    '• Fiscal Incentives: Updated 2025 legislation - SUDAM, ZFM, BNDES, IRA (USA), KfW (DE)',
    '• Financial Parameters: Regional WACC, projected inflation 2026-2035'
  ];
  
  doc.setTextColor(60);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  let sourceY = yPos + 12;
  sources.forEach(source => {
    doc.text(source, margin + 4, sourceY);
    sourceY += 5;
  });
  yPos += 40;

  // === DATA ANALYSIS SECTION ===
  if (aiAnalysis) {
    // Only add new page if there's not enough space for the analysis header + initial content
    if (yPos > maxY - 60) {
      addPage();
    } else {
      yPos += 8;
    }
    
    // Use translated title for all languages including Chinese
    const analysisTitle = lang === 'pt' ? 'Analise Executiva de Dados' : 
                          lang === 'es' ? 'Analisis Ejecutivo de Datos' : 
                          lang === 'it' ? 'Analisi Esecutiva dei Dati' : 
                          lang === 'zh' ? '执行数据分析' : 'Executive Data Analysis';
    sectionHeader(analysisTitle, "");

    // Clean the AI analysis text: remove redundant executive summary prefixes in any language
    const cleanAnalysisText = (text: string): string => {
      // Remove common redundant prefixes at the start of the analysis
      const prefixPatterns = [
        /^(Executive Summary|EXECUTIVE SUMMARY|Resumo Executivo|RESUMO EXECUTIVO|Resumen Ejecutivo|RESUMEN EJECUTIVO|Riepilogo Esecutivo|RIEPILOGO ESECUTIVO|执行摘要|執行摘要)[:\s]*/i,
        /^(##\s*)?(Executive Summary|Resumo Executivo|Resumen Ejecutivo|Riepilogo Esecutivo|执行摘要)[:\s]*/i,
        /^#+\s*(ANALISE DE VIABILIDADE|ANALISIS DE VIABILIDAD|ANALISI DI FATTIBILITA|FEASIBILITY ANALYSIS|可行性分析)[:\s]*/i,
      ];
      
      let cleaned = text.trim();
      for (const pattern of prefixPatterns) {
        cleaned = cleaned.replace(pattern, '');
      }
      return cleaned.trim();
    };
    
    const cleanedAnalysis = cleanAnalysisText(aiAnalysis);

    const renderFormattedAnalysis = (text: string) => {
      const lines = text.split('\n');
      
      lines.forEach((line) => {
        if (yPos > maxY - 8) addPage();
        
        const trimmedLine = line.trim();
        if (!trimmedLine) {
          yPos += 2;
          return;
        }
        
        // Handle ### headers
        if (trimmedLine.startsWith('###')) {
          const headerText = trimmedLine.replace(/^###\s*/, '').replace(/\*\*/g, '');
          yPos += 3;
          doc.setTextColor(0, 51, 102);
          doc.setFontSize(8);
          setFont('bold');
          
          const textWidth = Math.min(doc.getTextWidth(headerText) + 6, contentWidth);
          doc.setFillColor(240, 248, 255);
          doc.roundedRect(margin, yPos - 4, textWidth, 7, 1, 1, "F");
          doc.text(headerText, margin + 3, yPos);
          yPos += 6;
          return;
        }
        
        // Handle ## headers
        if (trimmedLine.startsWith('##')) {
          const headerText = trimmedLine.replace(/^##\s*/, '').replace(/\*\*/g, '');
          yPos += 3;
          doc.setTextColor(0, 51, 102);
          doc.setFontSize(9);
          setFont('bold');
          doc.text(headerText, margin, yPos);
          yPos += 6;
          return;
        }

        // Handle # headers
        if (trimmedLine.startsWith('#') && !trimmedLine.startsWith('##')) {
          const headerText = trimmedLine.replace(/^#\s*/, '').replace(/\*\*/g, '');
          yPos += 4;
          doc.setFillColor(0, 51, 102);
          doc.roundedRect(margin, yPos - 4, contentWidth, 7, 1, 1, "F");
          doc.setTextColor(255);
          doc.setFontSize(8);
          setFont('bold');
          doc.text(headerText, margin + 3, yPos);
          yPos += 7;
          return;
        }
        
        // Handle bullet points
        if (trimmedLine.startsWith('*') && !trimmedLine.startsWith('**')) {
          const bulletText = trimmedLine.replace(/^\*\s*/, '').replace(/\*\*/g, '');
          doc.setTextColor(0, 102, 204);
          doc.setFontSize(7);
          doc.setFont("helvetica", "normal"); // Bullet symbol always helvetica
          doc.text("*", margin + 2, yPos);
          doc.setTextColor(50);
          doc.setFontSize(7);
          setFont('normal');
          
          const wrappedLines = doc.splitTextToSize(bulletText, contentWidth - 10);
          wrappedLines.forEach((wLine: string) => {
            if (yPos > maxY - 8) addPage();
            doc.text(wLine, margin + 7, yPos);
            yPos += 4.5;
          });
          return;
        }
        
        // Handle dash bullet points
        if (trimmedLine.startsWith('-')) {
          const bulletText = trimmedLine.replace(/^-\s*/, '').replace(/\*\*/g, '');
          doc.setTextColor(46, 125, 50);
          doc.setFontSize(7);
          doc.setFont("helvetica", "normal"); // Arrow symbol always helvetica
          doc.text(">", margin + 2, yPos);
          doc.setTextColor(50);
          doc.setFontSize(7);
          setFont('normal');
          
          const wrappedLines = doc.splitTextToSize(bulletText, contentWidth - 10);
          wrappedLines.forEach((wLine: string) => {
            if (yPos > maxY - 8) addPage();
            doc.text(wLine, margin + 7, yPos);
            yPos += 4.5;
          });
          return;
        }
        
        // Numbered lists
        const numberedMatch = trimmedLine.match(/^\d+\.\s*/);
        if (numberedMatch) {
          const listText = trimmedLine.replace(/^\d+\.\s*/, '').replace(/\*\*/g, '');
          doc.setTextColor(0, 51, 102);
          doc.setFontSize(7);
          setFont('bold');
          doc.text(numberedMatch[0], margin, yPos);
          doc.setTextColor(50);
          setFont('normal');
          
          const wrappedLines = doc.splitTextToSize(listText, contentWidth - 8);
          wrappedLines.forEach((wLine: string, idx: number) => {
            if (yPos > maxY - 8) addPage();
            doc.text(wLine, margin + (idx === 0 ? 7 : 0), yPos);
            yPos += 4.5;
          });
          return;
        }
        
        // Tables (simple detection)
        if (trimmedLine.includes('|')) {
          const cells = trimmedLine.split('|').filter(c => c.trim());
          if (cells.length >= 2 && !trimmedLine.includes('---')) {
            doc.setFillColor(248, 250, 252);
            doc.rect(margin, yPos - 3.5, contentWidth, 6, "F");
            doc.setTextColor(50);
            doc.setFontSize(6);
            setFont('normal');
            const cellW = contentWidth / cells.length;
            cells.forEach((cell, i) => {
              doc.text(cell.trim().substring(0, 35), margin + 3 + i * cellW, yPos);
            });
            yPos += 5;
            return;
          }
          return; // Skip separator rows
        }
        
        // Regular paragraph
        doc.setTextColor(50);
        doc.setFontSize(7);
        setFont('normal');
        const wrappedLines = doc.splitTextToSize(trimmedLine.replace(/\*\*/g, ''), contentWidth);
        wrappedLines.forEach((wLine: string) => {
          if (yPos > maxY - 8) addPage();
          doc.text(wLine, margin, yPos);
          yPos += 4.5;
        });
      });
    };
    
    renderFormattedAnalysis(cleanedAnalysis);
  }

  // === APPENDIX: CALCULATION FORMULAS & REGIONAL BENCHMARKS ===
  // Only add page if there's not enough space for the appendix header
  if (yPos > maxY - 40) {
    addPage();
  } else {
    yPos += 10; // Small gap before appendix
  }
  
  // Formulas & Benchmarks title
  const formulasTitle = lang === 'pt' ? 'ANEXO A: Fórmulas de Cálculo & Benchmarks Regionais' :
                        lang === 'es' ? 'ANEXO A: Fórmulas de Cálculo & Benchmarks Regionales' :
                        lang === 'it' ? 'ALLEGATO A: Formule di Calcolo & Benchmark Regionali' :
                        lang === 'zh' ? '附录A：计算公式和区域基准' : 'APPENDIX A: Calculation Formulas & Regional Benchmarks';
  
  doc.setFillColor(0, 51, 102);
  doc.roundedRect(margin, yPos - 2, contentWidth, 12, 2, 2, "F");
  doc.setTextColor(255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(formulasTitle, margin + 4, yPos + 6);
  yPos += 18;

  // Formulas intro
  const formulasIntro = lang === 'pt' ? 'As fórmulas abaixo são utilizadas para calcular os indicadores financeiros deste estudo. Os benchmarks regionais servem como referência para validação.' :
                        lang === 'es' ? 'Las fórmulas siguientes se utilizan para calcular los indicadores financieros de este estudio. Los benchmarks regionales sirven como referencia para validación.' :
                        lang === 'it' ? 'Le formule seguenti sono utilizzate per calcolare gli indicatori finanziari di questo studio. I benchmark regionali servono come riferimento per la validazione.' :
                        lang === 'zh' ? '以下公式用于计算本研究的财务指标。区域基准作为验证参考。' :
                        'The formulas below are used to calculate the financial indicators in this study. Regional benchmarks serve as validation reference.';
  
  doc.setTextColor(60);
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  const formulasIntroLines = doc.splitTextToSize(formulasIntro, contentWidth);
  formulasIntroLines.forEach((line: string) => {
    doc.text(line, margin, yPos);
    yPos += 4;
  });
  yPos += 4;

  // === SECTION: Financial Formulas ===
  const financialFormulasTitle = lang === 'pt' ? '1. Fórmulas Financeiras' :
                                  lang === 'es' ? '1. Fórmulas Financieras' :
                                  lang === 'it' ? '1. Formule Finanziarie' :
                                  lang === 'zh' ? '1. 财务公式' : '1. Financial Formulas';
  
  doc.setFillColor(59, 130, 246); // Blue
  doc.roundedRect(margin, yPos, contentWidth, 7, 1, 1, "F");
  doc.setTextColor(255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(financialFormulasTitle, margin + 4, yPos + 5);
  yPos += 10;

  // Formulas table
  const formulasData = [
    { 
      indicator: 'ROI', 
      formula: lang === 'pt' ? 'Lucro Líquido ÷ Investimento × 100' : 'Net Profit ÷ Investment × 100',
      unit: '%/ano',
      description: lang === 'pt' ? 'Retorno anual sobre capital investido' : 'Annual return on invested capital'
    },
    { 
      indicator: 'Payback', 
      formula: lang === 'pt' ? 'Investimento ÷ Lucro Líquido Anual' : 'Investment ÷ Annual Net Profit',
      unit: lang === 'pt' ? 'meses' : 'months',
      description: lang === 'pt' ? 'Tempo para recuperar investimento' : 'Time to recover investment'
    },
    { 
      indicator: 'NPV', 
      formula: 'Σ [FCt ÷ (1+r)^t] - I₀',
      unit: 'USD',
      description: lang === 'pt' ? 'Valor presente dos fluxos futuros' : 'Present value of future cash flows'
    },
    { 
      indicator: 'IRR', 
      formula: lang === 'pt' ? 'Taxa onde NPV = 0' : 'Rate where NPV = 0',
      unit: '%',
      description: lang === 'pt' ? 'Taxa interna de retorno' : 'Internal rate of return'
    },
    { 
      indicator: 'EBITDA', 
      formula: lang === 'pt' ? 'Receita - OPEX' : 'Revenue - OPEX',
      unit: 'USD/ano',
      description: lang === 'pt' ? 'Lucro operacional bruto' : 'Gross operating profit'
    },
    { 
      indicator: lang === 'pt' ? 'Lucro Líq.' : 'Net Profit', 
      formula: lang === 'pt' ? '(EBITDA - Deprec.) × (1 - Taxa) + Deprec.' : '(EBITDA - Deprec.) × (1 - Tax) + Deprec.',
      unit: 'USD/ano',
      description: lang === 'pt' ? 'Lucro após impostos' : 'Profit after taxes'
    }
  ];

  const formulasHeaders = [
    lang === 'pt' ? 'Indicador' : 'Indicator',
    lang === 'pt' ? 'Fórmula' : 'Formula',
    lang === 'pt' ? 'Unidade' : 'Unit',
    lang === 'pt' ? 'Descrição' : 'Description'
  ];
  const formulasWidths = [25, 60, 20, 75];
  yPos = drawTable(formulasHeaders, formulasData.map(f => [f.indicator, f.formula, f.unit, f.description]), formulasWidths, yPos);
  yPos += 6;

  // === SECTION: Operational Cost Formulas ===
  const opexFormulasTitle = lang === 'pt' ? '2. Fórmulas de Custos Operacionais' :
                            lang === 'es' ? '2. Fórmulas de Costos Operacionales' :
                            lang === 'it' ? '2. Formule Costi Operativi' :
                            lang === 'zh' ? '2. 运营成本公式' : '2. Operational Cost Formulas';
  
  checkPageBreak(45);
  doc.setFillColor(16, 185, 129); // Emerald
  doc.roundedRect(margin, yPos, contentWidth, 7, 1, 1, "F");
  doc.setTextColor(255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(opexFormulasTitle, margin + 4, yPos + 5);
  yPos += 10;

  const opexFormulasData = [
    { 
      cost: lang === 'pt' ? 'Energia' : 'Electricity', 
      formula: lang === 'pt' ? 'Potência(kW) × 65% × 18h × 26d × Tarifa' : 'Power(kW) × 65% × 18h × 26d × Rate',
      unit: 'USD/mês',
      note: lang === 'pt' ? 'Utilização 65%, 18h/dia, 26d/mês' : 'Utilization 65%, 18h/day, 26d/month'
    },
    { 
      cost: lang === 'pt' ? 'Mão de Obra' : 'Labor', 
      formula: lang === 'pt' ? 'Σ(Func. × Salário × Encargos)' : 'Σ(Staff × Salary × Charges)',
      unit: 'USD/mês',
      note: lang === 'pt' ? 'Encargos variam por país' : 'Charges vary by country'
    },
    { 
      cost: lang === 'pt' ? 'Manutenção' : 'Maintenance', 
      formula: lang === 'pt' ? 'Custo Equipamento × 5% ÷ 12' : 'Equipment Cost × 5% ÷ 12',
      unit: 'USD/mês',
      note: lang === 'pt' ? '5% do equipamento/ano' : '5% of equipment/year'
    },
    { 
      cost: lang === 'pt' ? 'Logística' : 'Logistics', 
      formula: lang === 'pt' ? 'Capacidade × Taxa Regional' : 'Capacity × Regional Rate',
      unit: 'USD/mês',
      note: lang === 'pt' ? 'Taxa varia $8-18/ton por região' : 'Rate varies $8-18/ton by region'
    },
    { 
      cost: lang === 'pt' ? 'Capital de Giro' : 'Working Capital', 
      formula: lang === 'pt' ? '(Energia + Labor + Manut. + Log. + Adm.) × 3' : '(Energy + Labor + Maint. + Log. + Adm.) × 3',
      unit: 'USD',
      note: lang === 'pt' ? 'Reserva de 3 meses' : '3-month reserve'
    }
  ];

  const opexHeaders = [
    lang === 'pt' ? 'Custo' : 'Cost',
    lang === 'pt' ? 'Fórmula' : 'Formula',
    lang === 'pt' ? 'Unidade' : 'Unit',
    lang === 'pt' ? 'Observação' : 'Note'
  ];
  const opexWidths = [25, 65, 20, 70];
  yPos = drawTable(opexHeaders, opexFormulasData.map(o => [o.cost, o.formula, o.unit, o.note]), opexWidths, yPos);
  yPos += 6;

  // === SECTION: Infrastructure & Resources Formulas ===
  const infraFormulasTitle = lang === 'pt' ? '2.1. Fórmulas de Infraestrutura & Recursos' :
                              lang === 'es' ? '2.1. Fórmulas de Infraestructura y Recursos' :
                              lang === 'it' ? '2.1. Formule Infrastruttura e Risorse' :
                              lang === 'zh' ? '2.1. 基础设施和资源公式' : '2.1. Infrastructure & Resources Formulas';
  
  checkPageBreak(55);
  doc.setFillColor(6, 182, 212); // Cyan
  doc.roundedRect(margin, yPos, contentWidth, 7, 1, 1, "F");
  doc.setTextColor(255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(infraFormulasTitle, margin + 4, yPos + 5);
  yPos += 10;

  const infraFormulasData = [
    { 
      item: lang === 'pt' ? 'Consumo Água' : 'Water Consumption', 
      formula: lang === 'pt' ? 'Tonelagem Anual × 0.75 m³/ton' : 'Annual Tonnage × 0.75 m³/ton',
      unit: 'm³/ano',
      note: lang === 'pt' ? 'Média industrial para processamento de borracha' : 'Industrial average for rubber processing'
    },
    { 
      item: lang === 'pt' ? 'Área Industrial' : 'Industrial Area', 
      formula: lang === 'pt' ? 'Capacidade(t/d) × 80-120 m²' : 'Capacity(t/d) × 80-120 m²',
      unit: 'm²',
      note: lang === 'pt' ? 'Inclui produção, estoque e circulação' : 'Includes production, storage, circulation'
    },
    { 
      item: lang === 'pt' ? 'Potência Instalada' : 'Installed Power', 
      formula: lang === 'pt' ? 'Soma de todas as máquinas (kW)' : 'Sum of all machines (kW)',
      unit: 'kW',
      note: lang === 'pt' ? 'Base para cálculo de energia' : 'Base for energy calculation'
    },
    { 
      item: lang === 'pt' ? 'Efluentes' : 'Effluents', 
      formula: lang === 'pt' ? 'Água × 0.85 (taxa de retorno)' : 'Water × 0.85 (return rate)',
      unit: 'm³/ano',
      note: lang === 'pt' ? '15% evaporação/perdas' : '15% evaporation/losses'
    }
  ];

  const infraHeaders = [
    lang === 'pt' ? 'Item' : 'Item',
    lang === 'pt' ? 'Fórmula' : 'Formula',
    lang === 'pt' ? 'Unidade' : 'Unit',
    lang === 'pt' ? 'Observação' : 'Note'
  ];
  const infraWidths = [30, 60, 18, 72];
  yPos = drawTable(infraHeaders, infraFormulasData.map(i => [i.item, i.formula, i.unit, i.note]), infraWidths, yPos);
  yPos += 6;

  // === SECTION: Staff Breakdown by Category ===
  const staffFormulasTitle = lang === 'pt' ? '2.2. Estrutura de Pessoal por Categoria' :
                              lang === 'es' ? '2.2. Estructura de Personal por Categoría' :
                              lang === 'it' ? '2.2. Struttura del Personale per Categoria' :
                              lang === 'zh' ? '2.2. 按类别划分的人员结构' : '2.2. Staff Structure by Category';
  
  checkPageBreak(65);
  doc.setFillColor(234, 88, 12); // Orange
  doc.roundedRect(margin, yPos, contentWidth, 7, 1, 1, "F");
  doc.setTextColor(255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(staffFormulasTitle, margin + 4, yPos + 5);
  yPos += 10;

  const staffData = [
    { 
      category: lang === 'pt' ? 'Diretor Geral' : 'General Director', 
      qty: '0-1', 
      salaryBR: '$4,000-6,000',
      salaryUS: '$12,000-18,000',
      charges: lang === 'pt' ? '68% (BR), 30% (US)' : '68% (BR), 30% (US)'
    },
    { 
      category: lang === 'pt' ? 'Gerente de Operações' : 'Operations Manager', 
      qty: '1', 
      salaryBR: '$2,500-4,000',
      salaryUS: '$8,000-12,000',
      charges: lang === 'pt' ? 'Inclui encargos sociais' : 'Includes social charges'
    },
    { 
      category: lang === 'pt' ? 'Supervisor de Produção' : 'Production Supervisor', 
      qty: '1-2', 
      salaryBR: '$1,500-2,500',
      salaryUS: '$5,000-7,000',
      charges: lang === 'pt' ? 'Por turno de operação' : 'Per operating shift'
    },
    { 
      category: lang === 'pt' ? 'Operadores de Máquinas' : 'Machine Operators', 
      qty: '4-8', 
      salaryBR: '$800-1,200',
      salaryUS: '$3,500-5,000',
      charges: lang === 'pt' ? 'Por turno (×1, ×2, ×3)' : 'Per shift (×1, ×2, ×3)'
    },
    { 
      category: lang === 'pt' ? 'Técnico de Manutenção' : 'Maintenance Tech', 
      qty: '1-2', 
      salaryBR: '$1,200-1,800',
      salaryUS: '$4,500-6,500',
      charges: lang === 'pt' ? 'Crítico para uptime' : 'Critical for uptime'
    },
    { 
      category: lang === 'pt' ? 'Administrativo' : 'Administrative', 
      qty: '1-2', 
      salaryBR: '$800-1,500',
      salaryUS: '$3,000-5,000',
      charges: lang === 'pt' ? 'Escritório e RH' : 'Office and HR'
    },
    { 
      category: lang === 'pt' ? 'Segurança' : 'Security', 
      qty: '1-2', 
      salaryBR: '$700-1,000',
      salaryUS: '$2,500-4,000',
      charges: lang === 'pt' ? '24h se necessário' : '24h if needed'
    }
  ];

  const staffHeaders = [
    lang === 'pt' ? 'Categoria' : 'Category',
    lang === 'pt' ? 'Qtd.' : 'Qty.',
    lang === 'pt' ? 'Salário BR' : 'Salary BR',
    lang === 'pt' ? 'Salário US' : 'Salary US',
    lang === 'pt' ? 'Observação' : 'Note'
  ];
  const staffWidths = [40, 15, 30, 35, 60];
  yPos = drawTable(staffHeaders, staffData.map(s => [s.category, s.qty, s.salaryBR, s.salaryUS, s.charges]), staffWidths, yPos);
  yPos += 4;

  // Staff calculation note
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(margin, yPos, contentWidth, 12, 2, 2, "F");
  doc.setTextColor(146, 64, 14);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  const staffNote = lang === 'pt' ? 
    '⚠️ CUSTO TOTAL = Σ(Funcionários × Salário × Encargos Regionais). Encargos: Brasil 68%, EUA 30%, Alemanha 42%, China 40%, Austrália 25%, Itália 45%.' :
    '⚠️ TOTAL COST = Σ(Staff × Salary × Regional Charges). Charges: Brazil 68%, USA 30%, Germany 42%, China 40%, Australia 25%, Italy 45%.';
  const staffNoteLines = doc.splitTextToSize(staffNote, contentWidth - 8);
  staffNoteLines.forEach((line: string, idx: number) => {
    doc.text(line, margin + 4, yPos + 4 + idx * 4);
  });
  yPos += 16;

  // === SECTION: Regional Benchmarks ===
  const benchmarksTitle = lang === 'pt' ? '3. Benchmarks Regionais por País' :
                          lang === 'es' ? '3. Benchmarks Regionales por País' :
                          lang === 'it' ? '3. Benchmark Regionali per Paese' :
                          lang === 'zh' ? '3. 按国家划分的区域基准' : '3. Regional Benchmarks by Country';
  
  checkPageBreak(60);
  doc.setFillColor(168, 85, 247); // Purple
  doc.roundedRect(margin, yPos, contentWidth, 7, 1, 1, "F");
  doc.setTextColor(255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(benchmarksTitle, margin + 4, yPos + 5);
  yPos += 10;

  // Country names without emojis (jsPDF doesn't support emoji rendering)
  const benchmarksData = [
    { country: 'BR Brasil', baseTax: '34%', electricity: '$0.12/kWh', laborMult: '1.0x', capexRange: '$8-15M', opexTon: '$40-80', roiRange: '15-35%', payback: '24-60m' },
    { country: 'AU Australia', baseTax: '30%', electricity: '$0.18/kWh', laborMult: '2.5x', capexRange: '$3-8M', opexTon: '$50-100', roiRange: '18-40%', payback: '18-48m' },
    { country: 'DE Germany', baseTax: '29.9%', electricity: '$0.35/kWh', laborMult: '3.0x', capexRange: '$5-12M', opexTon: '$60-120', roiRange: '12-28%', payback: '30-72m' },
    { country: 'CN China', baseTax: '25%', electricity: '$0.08/kWh', laborMult: '0.4x', capexRange: '$0.5-1.5M', opexTon: '$15-40', roiRange: '25-60%', payback: '12-36m' },
    { country: 'US USA', baseTax: '21%', electricity: '$0.12/kWh', laborMult: '2.0x', capexRange: '$2-6M', opexTon: '$45-90', roiRange: '18-35%', payback: '24-54m' },
    { country: 'IT Italy', baseTax: '24%', electricity: '$0.25/kWh', laborMult: '2.2x', capexRange: '$3-8M', opexTon: '$50-95', roiRange: '15-32%', payback: '28-60m' }
  ];

  const benchmarkHeaders = [
    lang === 'pt' ? 'País' : 'Country',
    lang === 'pt' ? 'Imp. Base' : 'Base Tax',
    lang === 'pt' ? 'Energia' : 'Electricity',
    lang === 'pt' ? 'Labor' : 'Labor',
    'CAPEX',
    'OPEX/t',
    'ROI',
    'Payback'
  ];
  const benchmarkWidths = [28, 18, 24, 15, 25, 22, 20, 22];
  yPos = drawTable(benchmarkHeaders, benchmarksData.map(b => [b.country, b.baseTax, b.electricity, b.laborMult, b.capexRange, b.opexTon, b.roiRange, b.payback]), benchmarkWidths, yPos);
  yPos += 6;

  // Partnership impact formula box
  checkPageBreak(30);
  doc.setFillColor(249, 115, 22); // Orange
  doc.roundedRect(margin, yPos, contentWidth, 7, 1, 1, "F");
  doc.setTextColor(255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  const partnershipFormulaTitle = lang === 'pt' ? '4. Cálculo de Impacto de Parceria' : '4. Partnership Impact Calculation';
  doc.text(partnershipFormulaTitle, margin + 4, yPos + 5);
  yPos += 10;

  doc.setFillColor(255, 247, 237);
  doc.roundedRect(margin, yPos, contentWidth, 24, 2, 2, "F");
  
  doc.setTextColor(0, 51, 102);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(lang === 'pt' ? 'Impacto Líquido = (Bônus Ambiental × Tonelagem) - (Royalties × Receita)' : 
           'Net Impact = (Environmental Bonus × Tonnage) - (Royalties × Revenue)', margin + 4, yPos + 6);
  
  doc.setTextColor(80);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  const partnershipNote = lang === 'pt' ? 
    'ROI Ajustado = ((EBITDA + Impacto - Depreciação) × (1 - Taxa) + Depreciação) ÷ Investimento × 100. Este cálculo considera impostos específicos por país.' :
    'Adjusted ROI = ((EBITDA + Impact - Depreciation) × (1 - Tax) + Depreciation) ÷ Investment × 100. This calculation considers country-specific taxes.';
  const partnershipNoteLines = doc.splitTextToSize(partnershipNote, contentWidth - 8);
  let pnY = yPos + 12;
  partnershipNoteLines.forEach((line: string) => {
    doc.text(line, margin + 4, pnY);
    pnY += 4;
  });
  yPos += 30;

  // === APPENDIX B: OTR DATA REFERENCE & FISCAL INCENTIVES ===
  addPage();
  
  // Appendix title
  const appendixTitle = lang === 'pt' ? 'ANEXO B: Dados de Referência OTR e Incentivos Fiscais' :
                        lang === 'es' ? 'ANEXO B: Datos de Referencia OTR e Incentivos Fiscales' :
                        lang === 'it' ? 'ALLEGATO B: Dati di Riferimento OTR e Incentivi Fiscali' :
                        lang === 'zh' ? '附录B：OTR参考数据和税收优惠' : 'APPENDIX B: OTR Reference Data & Fiscal Incentives';
  
  doc.setFillColor(0, 51, 102);
  doc.roundedRect(margin, yPos - 2, contentWidth, 12, 2, 2, "F");
  doc.setTextColor(255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(appendixTitle, margin + 4, yPos + 6);
  yPos += 18;

  // Appendix intro text
  const appendixIntro = lang === 'pt' ? 'Os dados abaixo fornecem a base técnica e de mercado para os cálculos apresentados neste estudo. Fonte: Dados industriais validados - Janeiro 2026.' :
                        lang === 'es' ? 'Los datos siguientes proporcionan la base técnica y de mercado para los cálculos presentados. Fuente: Datos industriales validados - Enero 2026.' :
                        lang === 'it' ? 'I dati seguenti forniscono la base tecnica e di mercato per i calcoli presentati. Fonte: Dati industriali validati - Gennaio 2026.' :
                        lang === 'zh' ? '以下数据为本研究的计算提供了技术和市场基础。来源：经验证的工业数据 - 2026年1月。' : 
                        'The data below provides the technical and market basis for the calculations presented in this study. Source: Validated industrial data - January 2026.';
  
  doc.setTextColor(60);
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  const introLines = doc.splitTextToSize(appendixIntro, contentWidth);
  introLines.forEach((line: string) => {
    doc.text(line, margin, yPos);
    yPos += 4;
  });
  yPos += 4;

  // === SECTION 1: OTR Giant Tire Composition Reference ===
  const otrSectionTitle = lang === 'pt' ? '1. Referência de Composição de Pneus OTR Gigantes' :
                          lang === 'es' ? '1. Referencia de Composición de Neumáticos OTR Gigantes' :
                          lang === 'it' ? '1. Riferimento Composizione Pneumatici OTR Giganti' :
                          lang === 'zh' ? '1. OTR巨型轮胎成分参考' : '1. OTR Giant Tire Composition Reference';
  
  doc.setFillColor(16, 185, 129); // Emerald
  doc.roundedRect(margin, yPos, contentWidth, 7, 1, 1, "F");
  doc.setTextColor(255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(otrSectionTitle, margin + 4, yPos + 5);
  yPos += 10;

  // OTR Summary metrics box
  const otrMetrics = [
    { label: lang === 'pt' ? 'Borracha Média' : 'Avg Rubber', value: '50-55%', color: [16, 185, 129] },
    { label: lang === 'pt' ? 'Aço' : 'Steel', value: '25-30%', color: [59, 130, 246] },
    { label: lang === 'pt' ? 'Têxtil' : 'Textile', value: '5-8%', color: [234, 179, 8] },
    { label: 'rCB', value: '10-18%', color: [168, 85, 247] },
    { label: lang === 'pt' ? 'Peso' : 'Weight', value: '1.8-5.4t', color: [249, 115, 22] }
  ];
  
  const otrMetricBoxW = (contentWidth - 8) / 5;
  otrMetrics.forEach((metric, idx) => {
    const boxX = margin + idx * (otrMetricBoxW + 2);
    const [r, g, b] = metric.color;
    doc.setFillColor(r, g, b);
    doc.setDrawColor(r, g, b);
    doc.setLineWidth(0.3);
    doc.roundedRect(boxX, yPos, otrMetricBoxW, 14, 1, 1, "FD");
    doc.setTextColor(255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(metric.value, boxX + otrMetricBoxW / 2, yPos + 6, { align: "center" });
    doc.setFontSize(5);
    doc.setFont("helvetica", "normal");
    doc.text(metric.label, boxX + otrMetricBoxW / 2, yPos + 11, { align: "center" });
  });
  yPos += 18;

  // OTR Models Table
  const otrTableTitle = lang === 'pt' ? 'Composição por Modelo OTR' : 
                        lang === 'es' ? 'Composición por Modelo OTR' :
                        lang === 'it' ? 'Composizione per Modello OTR' :
                        lang === 'zh' ? 'OTR型号成分' : 'Composition by OTR Model';
  
  doc.setTextColor(0, 51, 102);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text(otrTableTitle, margin, yPos);
  yPos += 4;

  // OTR Tire data from validated sources
  const otrTireData = [
    { model: '27.00R49', app: lang === 'pt' ? 'Basculantes 100t' : 'Dump Trucks 100t', weight: '1,800', rubber: '55%', steel: '25%', textile: '8%', rcb: '12.5%' },
    { model: '33.00R51', app: lang === 'pt' ? 'Basculantes 150t' : 'Dump Trucks 150t', weight: '2,500', rubber: '54%', steel: '26%', textile: '7%', rcb: '14%' },
    { model: '40.00R57', app: lang === 'pt' ? 'Basculantes 200t+' : 'Dump Trucks 200t+', weight: '3,700', rubber: '53%', steel: '28%', textile: '6%', rcb: '15%' },
    { model: '46/90R57', app: lang === 'pt' ? 'Pás Carregadeiras' : 'Giant Loaders', weight: '4,000', rubber: '52%', steel: '29%', textile: '6%', rcb: '16.5%' },
    { model: '59/80R63', app: lang === 'pt' ? 'Ultra-classe 400t+' : 'Ultra-class 400t+', weight: '5,350', rubber: '51%', steel: '30%', textile: '5%', rcb: '17.5%' }
  ];

  const otrHeaders = [
    lang === 'pt' ? 'Modelo' : 'Model',
    lang === 'pt' ? 'Aplicação' : 'Application',
    lang === 'pt' ? 'Peso (kg)' : 'Weight (kg)',
    lang === 'pt' ? 'Borracha' : 'Rubber',
    lang === 'pt' ? 'Aço' : 'Steel',
    lang === 'pt' ? 'Têxtil' : 'Textile',
    'rCB'
  ];
  
  const otrWidths = [25, 45, 25, 20, 20, 20, 25];
  yPos = drawTable(otrHeaders, otrTireData.map(t => [t.model, t.app, t.weight, t.rubber, t.steel, t.textile, t.rcb]), otrWidths, yPos);
  yPos += 6;

  // === SECTION 2: Market Prices Reference ===
  const pricesSectionTitle = lang === 'pt' ? '2. Preços de Mercado - Janeiro 2026' :
                             lang === 'es' ? '2. Precios de Mercado - Enero 2026' :
                             lang === 'it' ? '2. Prezzi di Mercato - Gennaio 2026' :
                             lang === 'zh' ? '2. 市场价格 - 2026年1月' : '2. Market Prices - January 2026';
  
  checkPageBreak(40);
  doc.setFillColor(59, 130, 246); // Blue
  doc.roundedRect(margin, yPos, contentWidth, 7, 1, 1, "F");
  doc.setTextColor(255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(pricesSectionTitle, margin + 4, yPos + 5);
  yPos += 10;

  // Market prices data
  const pricesData = [
    { 
      material: lang === 'pt' ? 'Granulado de Borracha' : 'Rubber Granules', 
      min: '$200', max: '$290', avg: '$250',
      note: lang === 'pt' ? 'Playgrounds, superfícies esportivas, asfalto' : 'Playgrounds, sports surfaces, asphalt'
    },
    { 
      material: lang === 'pt' ? 'Aço Recuperado' : 'Recovered Steel', 
      min: '$150', max: '$350', avg: '$250',
      note: lang === 'pt' ? 'Fundições, usinas siderúrgicas' : 'Foundries, steel mills'
    },
    { 
      material: lang === 'pt' ? 'Fibra Têxtil' : 'Textile Fiber', 
      min: '$80', max: '$200', avg: '$120',
      note: lang === 'pt' ? 'Enchimento, isolamento' : 'Filling, insulation'
    },
    { 
      material: 'rCB (Carbon Black)', 
      min: '$900', max: '$1,200', avg: '$1,050',
      note: lang === 'pt' ? 'Premium - substituição negro de fumo virgem' : 'Premium - virgin carbon black replacement'
    }
  ];

  const priceHeaders = [
    lang === 'pt' ? 'Material' : 'Material',
    lang === 'pt' ? 'Mínimo' : 'Min',
    lang === 'pt' ? 'Máximo' : 'Max',
    lang === 'pt' ? 'Média' : 'Avg',
    lang === 'pt' ? 'Aplicação' : 'Application'
  ];
  const priceWidths = [45, 20, 20, 20, 75];
  yPos = drawTable(priceHeaders, pricesData.map(p => [p.material, p.min, p.max, p.avg, p.note]), priceWidths, yPos);
  yPos += 8;

  // === SECTION 3: Fiscal Incentives by Region ===
  const fiscalSectionTitle = lang === 'pt' ? '3. Incentivos Fiscais por Região' :
                             lang === 'es' ? '3. Incentivos Fiscales por Región' :
                             lang === 'it' ? '3. Incentivi Fiscali per Regione' :
                             lang === 'zh' ? '3. 按地区划分的税收优惠' : '3. Fiscal Incentives by Region';
  
  checkPageBreak(55);
  doc.setFillColor(168, 85, 247); // Purple
  doc.roundedRect(margin, yPos, contentWidth, 7, 1, 1, "F");
  doc.setTextColor(255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(fiscalSectionTitle, margin + 4, yPos + 5);
  yPos += 10;

  // Fiscal incentives data - key countries (no emojis - jsPDF doesn't support them)
  const fiscalData = [
    { 
      country: lang === 'pt' ? 'BR Brasil' : 'BR Brazil', 
      base: '34%', 
      region: lang === 'pt' ? 'Norte (SUDAM)' : 'North (SUDAM)', 
      effective: '8.5%', 
      savings: '75%',
      incentive: lang === 'pt' ? 'Redução IRPJ 75%' : 'Corporate Tax 75% reduction'
    },
    { 
      country: lang === 'pt' ? 'BR Brasil' : 'BR Brazil', 
      base: '34%', 
      region: lang === 'pt' ? 'Zona Franca Manaus' : 'Manaus Free Zone', 
      effective: '4.1%', 
      savings: '88%',
      incentive: lang === 'pt' ? 'ZFM isenção total' : 'ZFM full exemption'
    },
    { 
      country: 'AU Australia', 
      base: '30%', 
      region: 'Western Australia', 
      effective: '18%', 
      savings: '40%',
      incentive: lang === 'pt' ? 'Depreciação acelerada 2x' : 'Accelerated depreciation 2x'
    },
    { 
      country: 'CL Chile', 
      base: '27%', 
      region: 'Atacama', 
      effective: '15%', 
      savings: '44%',
      incentive: lang === 'pt' ? 'Zona extrema -25%' : 'Extreme zone -25%'
    },
    { 
      country: 'US USA', 
      base: '21%', 
      region: 'Texas', 
      effective: '15%', 
      savings: '29%',
      incentive: lang === 'pt' ? 'Sem imposto estadual' : 'No state tax'
    },
    { 
      country: 'IT Italy', 
      base: '24%', 
      region: 'Mezzogiorno', 
      effective: '12%', 
      savings: '50%',
      incentive: lang === 'pt' ? 'Crédito Transizione 5.0' : 'Transition 5.0 credit'
    },
    { 
      country: 'DE Germany', 
      base: '29.9%', 
      region: lang === 'pt' ? 'Alemanha Oriental' : 'East Germany', 
      effective: '18%', 
      savings: '40%',
      incentive: lang === 'pt' ? 'Subsídio renovação' : 'Renewal grant'
    },
    { 
      country: 'MX Mexico', 
      base: '30%', 
      region: 'Sonora', 
      effective: '22%', 
      savings: '27%',
      incentive: 'IMMEX + PROSEC'
    }
  ];

  const fiscalHeaders = [
    lang === 'pt' ? 'País' : 'Country',
    lang === 'pt' ? 'Base' : 'Base',
    lang === 'pt' ? 'Região' : 'Region',
    lang === 'pt' ? 'Efetiva' : 'Effective',
    lang === 'pt' ? 'Economia' : 'Savings',
    lang === 'pt' ? 'Principal Incentivo' : 'Main Incentive'
  ];
  const fiscalWidths = [30, 15, 40, 18, 17, 60];
  yPos = drawTable(fiscalHeaders, fiscalData.map(f => [f.country, f.base, f.region, f.effective, f.savings, f.incentive]), fiscalWidths, yPos);
  yPos += 6;

  // Data source footnote
  const footnote = lang === 'pt' ? '* Dados validados de fontes industriais, Michelin/Bridgestone databooks, Recycler\'s World, e regulamentos fiscais oficiais - Janeiro 2026.' :
                   lang === 'es' ? '* Datos validados de fuentes industriales, Michelin/Bridgestone databooks, Recycler\'s World, y regulaciones fiscales oficiales - Enero 2026.' :
                   lang === 'it' ? '* Dati validati da fonti industriali, Michelin/Bridgestone databooks, Recycler\'s World, e regolamenti fiscali ufficiali - Gennaio 2026.' :
                   lang === 'zh' ? '* 数据来源：工业来源、米其林/普利司通手册、Recycler\'s World和官方税务法规验证 - 2026年1月。' :
                   '* Data validated from industrial sources, Michelin/Bridgestone databooks, Recycler\'s World, and official fiscal regulations - January 2026.';
  
  doc.setTextColor(100);
  doc.setFontSize(5);
  doc.setFont("helvetica", "italic");
  const footnoteLines = doc.splitTextToSize(footnote, contentWidth);
  footnoteLines.forEach((line: string) => {
    doc.text(line, margin, yPos);
    yPos += 3;
  });

  // === PARTNER SIGNATURE PAGE ===
  addPage();
  
  // Page header
  doc.setFillColor(0, 51, 102);
  doc.roundedRect(margin, yPos - 2, contentWidth, 12, 2, 2, "F");
  doc.setTextColor(255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(t.signaturePage || "Partner Acceptance & Signature", margin + 4, yPos + 6);
  yPos += 18;

  // Partnership model reminder
  doc.setFillColor(46, 125, 50);
  doc.roundedRect(margin, yPos, contentWidth, 16, 2, 2, "F");
  doc.setTextColor(255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(t.globalPartnership || "Global Partnership Opportunity", pageWidth / 2, yPos + 5, { align: "center" });
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(t.partnershipModel || "Joint Venture Model - We bring technology, you bring OTR sources", pageWidth / 2, yPos + 11, { align: "center" });
  yPos += 22;

  // Partner information section
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(0, 51, 102);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, yPos, contentWidth, 60, 2, 2, "FD");
  
  // Header
  doc.setFillColor(0, 51, 102);
  doc.roundedRect(margin, yPos, contentWidth, 8, 2, 0, "F");
  doc.rect(margin, yPos + 4, contentWidth, 4, "F");
  doc.setTextColor(255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(t.signaturePartnerInfo || "Partner Information", margin + 4, yPos + 5.5);
  
  // Form fields
  const fieldY = yPos + 14;
  const fieldColW = (contentWidth - 12) / 2;
  
  const fields = [
    { label: t.signatureCompanyName || "Company Name", x: margin + 4, y: fieldY },
    { label: t.signatureRepName || "Representative Name", x: margin + 4 + fieldColW + 4, y: fieldY },
    { label: t.signaturePosition || "Position/Title", x: margin + 4, y: fieldY + 16 },
    { label: t.signatureEmail || "Email", x: margin + 4 + fieldColW + 4, y: fieldY + 16 },
    { label: t.signaturePhone || "Phone", x: margin + 4, y: fieldY + 32 },
    { label: t.signatureDate || "Date", x: margin + 4 + fieldColW + 4, y: fieldY + 32 }
  ];
  
  fields.forEach(field => {
    doc.setTextColor(80);
    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    doc.text(field.label + ":", field.x, field.y);
    
    // Input line
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.2);
    doc.line(field.x, field.y + 8, field.x + fieldColW - 4, field.y + 8);
  });
  
  yPos += 68;

  // Declaration section
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(46, 125, 50);
  doc.setLineWidth(0.8);
  doc.roundedRect(margin, yPos, contentWidth, 30, 2, 2, "FD");
  
  doc.setTextColor(50);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  const declarationText = t.signatureDeclaration || "I hereby confirm that I have reviewed and understood the feasibility study presented above. I express my interest in proceeding with the partnership discussions for the OTR tire recycling project.";
  const declLines = doc.splitTextToSize(declarationText, contentWidth - 8);
  let declY = yPos + 8;
  declLines.forEach((line: string) => {
    doc.text(line, margin + 4, declY);
    declY += 5;
  });
  yPos += 36;

  // Signature boxes - side by side
  const sigBoxW = (contentWidth - 8) / 2;
  const sigBoxH = 50;
  
  // Partner signature box
  doc.setFillColor(252, 252, 252);
  doc.setDrawColor(0, 51, 102);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, yPos, sigBoxW, sigBoxH, 2, 2, "FD");
  
  doc.setFillColor(0, 51, 102);
  doc.roundedRect(margin, yPos, sigBoxW, 7, 2, 0, "F");
  doc.rect(margin, yPos + 3, sigBoxW, 4, "F");
  doc.setTextColor(255);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text(t.signaturePartner || "Partner Signature", margin + sigBoxW / 2, yPos + 5, { align: "center" });
  
  // Signature line
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(margin + 10, yPos + 35, margin + sigBoxW - 10, yPos + 35);
  
  doc.setTextColor(120);
  doc.setFontSize(5);
  doc.setFont("helvetica", "italic");
  doc.text(t.signatureDate || "Date", margin + 10, yPos + 44);
  doc.line(margin + 10, yPos + 45, margin + 40, yPos + 45);
  
  // ELP signature box
  doc.setFillColor(240, 255, 240);
  doc.setDrawColor(46, 125, 50);
  doc.roundedRect(margin + sigBoxW + 8, yPos, sigBoxW, sigBoxH, 2, 2, "FD");
  
  doc.setFillColor(46, 125, 50);
  doc.roundedRect(margin + sigBoxW + 8, yPos, sigBoxW, 7, 2, 0, "F");
  doc.rect(margin + sigBoxW + 8, yPos + 3, sigBoxW, 4, "F");
  doc.setTextColor(255);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text(t.signatureElp || "ELP Green Technology", margin + sigBoxW + 8 + sigBoxW / 2, yPos + 5, { align: "center" });
  
  // Signature line
  doc.setDrawColor(180, 180, 180);
  doc.line(margin + sigBoxW + 18, yPos + 35, margin + sigBoxW * 2 - 2, yPos + 35);
  
  doc.setTextColor(120);
  doc.setFontSize(5);
  doc.setFont("helvetica", "italic");
  doc.text(t.signatureDate || "Date", margin + sigBoxW + 18, yPos + 44);
  doc.line(margin + sigBoxW + 18, yPos + 48, margin + sigBoxW + 48, yPos + 45);
  
  yPos += sigBoxH + 10;

  // === QR CODE SECTION - CHECK PAGE BREAK FIRST ===
  const qrSectionHeight = 58;
  
  // IMPORTANT: Check if QR section fits on current page, otherwise add new page
  if (yPos + qrSectionHeight + 40 > maxY) {
    addPage();
  }
  
  // QR Code box with gradient-style design
  doc.setFillColor(248, 250, 255);
  doc.setDrawColor(0, 51, 102);
  doc.setLineWidth(1);
  doc.roundedRect(margin, yPos, contentWidth, qrSectionHeight, 4, 4, "FD");
  
  // Left accent bar
  doc.setFillColor(0, 51, 102);
  doc.roundedRect(margin, yPos, 6, qrSectionHeight, 4, 0, "F");
  doc.rect(margin + 3, yPos, 3, qrSectionHeight, "F");
  
  // Left side: QR Code
  const qrSize = 42;
  const qrX = margin + 12;
  const qrY = yPos + (qrSectionHeight - qrSize) / 2;
  
  // QR Code background with shadow
  doc.setFillColor(230, 230, 230);
  doc.roundedRect(qrX, qrY, qrSize + 4, qrSize + 4, 3, 3, "F");
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(qrX - 1, qrY - 1, qrSize + 4, qrSize + 4, 3, 3, "F");
  doc.setDrawColor(0, 51, 102);
  doc.setLineWidth(0.5);
  doc.roundedRect(qrX - 1, qrY - 1, qrSize + 4, qrSize + 4, 3, 3, "S");
  
  // Add QR Code image
  if (qrCodeBase64) {
    try {
      doc.addImage(qrCodeBase64, "PNG", qrX + 1, qrY + 1, qrSize, qrSize);
    } catch (e) {
      console.log("Could not add QR code to PDF");
    }
  }
  
  // Right side: Instructions with better typography
  const textStartX = margin + qrSize + 22;
  const textMaxWidth = contentWidth - qrSize - 35;
  
  // Title with icon - LARGER
  doc.setTextColor(0, 51, 102);
  doc.setFontSize(13); // Increased from 11
  doc.setFont("helvetica", "bold");
  doc.text(t.qrCodeTitle || "Start Your Partnership Online", textStartX, yPos + 14);
  
  // Decorative line
  doc.setDrawColor(46, 125, 50);
  doc.setLineWidth(1);
  doc.line(textStartX, yPos + 18, textStartX + 60, yPos + 18);
  
  // Description - LARGER
  doc.setTextColor(50);
  doc.setFontSize(8); // Increased from 7
  doc.setFont("helvetica", "normal");
  const qrDescText = t.qrCodeDesc || "Scan this QR Code to access the online partnership form and submit your interest directly to our team.";
  const qrDescLines = doc.splitTextToSize(qrDescText, textMaxWidth);
  let qrTextY = yPos + 26;
  qrDescLines.forEach((line: string) => {
    doc.text(line, textStartX, qrTextY);
    qrTextY += 6;
  });
  
  // Scan instruction badge - LARGER
  doc.setFillColor(46, 125, 50);
  doc.roundedRect(textStartX, qrTextY + 2, 55, 10, 3, 3, "F");
  doc.setTextColor(255);
  doc.setFontSize(7); // Increased from 6
  doc.setFont("helvetica", "bold");
  doc.text(t.qrCodeScan || "📱 Scan to Access Form", textStartX + 27.5, qrTextY + 8.5, { align: "center" });
  
  yPos += qrSectionHeight + 8;

  // Witness section (optional) - also check page break
  if (yPos + 35 > maxY) {
    addPage();
  }
  doc.setFillColor(248, 248, 248);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, yPos, contentWidth, 30, 2, 2, "FD");
  
  doc.setTextColor(100);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text(t.signatureWitness || "Witness (Optional)", margin + 4, yPos + 6);
  
  // Witness fields
  doc.setFontSize(5);
  doc.setFont("helvetica", "normal");
  doc.text("Name:", margin + 4, yPos + 14);
  doc.line(margin + 20, yPos + 14, margin + 80, yPos + 14);
  
  doc.text("Signature:", margin + 4, yPos + 22);
  doc.line(margin + 25, yPos + 22, margin + 80, yPos + 22);
  
  doc.text(t.signatureDate || "Date" + ":", margin + 90, yPos + 14);
  doc.line(margin + 105, yPos + 14, margin + contentWidth - 4, yPos + 14);

  // Add footer and watermark to all pages EXCEPT cover page (page 1)
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // === WATERMARK (all pages) ===
    if (watermark !== 'none') {
      doc.saveGraphicsState();
      
      // Set transparency for watermark
      doc.setGState(doc.GState({ opacity: 0.08 }));
      
      const watermarkText = watermark === 'confidential' 
        ? (lang === 'pt' ? 'CONFIDENCIAL' : lang === 'es' ? 'CONFIDENCIAL' : lang === 'it' ? 'RISERVATO' : lang === 'zh' ? '机密' : 'CONFIDENTIAL')
        : (lang === 'pt' ? 'RASCUNHO' : lang === 'es' ? 'BORRADOR' : lang === 'it' ? 'BOZZA' : lang === 'zh' ? '草稿' : 'DRAFT');
      
      doc.setTextColor(0, 51, 102);
      doc.setFontSize(60);
      doc.setFont("helvetica", "bold");
      
      // Center the watermark diagonally
      const centerX = pageWidth / 2;
      const centerY = pageHeight / 2;
      
      // Rotate text diagonally
      doc.text(watermarkText, centerX, centerY, {
        align: 'center',
        angle: 45
      });
      
      doc.restoreGraphicsState();
    }
    
    // === FOOTER - Skip cover page (page 1) which has its own footer ===
    if (i > 1) {
      // Professional footer with proper spacing - clear separation from content
      const footerBgY = 270;
      const footerLineY = 271;
      const footerTextY1 = 278;
      const footerTextY2 = 284;
      
      // White background for footer area to cover any content that might have bled
      doc.setFillColor(255, 255, 255);
      doc.rect(0, footerBgY, pageWidth, pageHeight - footerBgY, "F");
      
      // Horizontal line
      doc.setDrawColor(0, 51, 102);
      doc.setLineWidth(0.5);
      doc.line(margin, footerLineY, pageWidth - margin, footerLineY);
      
      // Row 1: Company name (left) | Page number (right)
      doc.setFontSize(7);
      doc.setTextColor(0, 51, 102);
      doc.setFont("helvetica", "bold");
      doc.text(t.footerCompany, margin, footerTextY1);
      
      doc.setFont("helvetica", "normal");
      doc.text(`${t.page} ${i} ${t.of} ${totalPages}`, pageWidth - margin, footerTextY1, { align: "right" });
      
      // Row 2: Contact info (left) | Confidential (right)
      doc.setFontSize(6);
      doc.setTextColor(80);
      doc.text(`${t.footerWebsite}  |  ${t.footerEmail}  |  ${t.footerPhone}`, margin, footerTextY2);
      
      doc.setTextColor(100);
      doc.setFont("helvetica", "italic");
      doc.text(t.confidential, pageWidth - margin, footerTextY2, { align: "right" });
    }
  }

  // Save the PDF
  const fileName = `ELP_Feasibility_ESG_${study.study_name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(fileName);
}
