/**
 * Geração de PDF Profissional para Relatórios de Inteligência Empresarial
 * - Layout corporativo ELP com Navy Blue (#1a2744)
 * - Mínimo 4 páginas com gráficos e análises completas
 * - Remove todos os símbolos markdown
 * - Formatação profissional
 */

import jsPDF from 'jspdf';

// ELP Brand Colors
const ELP_COLORS = {
  navyBlue: { r: 26, g: 39, b: 68 },      // #1a2744
  navyLight: { r: 45, g: 65, b: 110 },    // #2d416e
  accent: { r: 37, g: 99, b: 235 },       // Blue accent
  success: { r: 34, g: 197, b: 94 },      // Green
  warning: { r: 234, g: 179, b: 8 },      // Yellow
  danger: { r: 239, g: 68, b: 68 },       // Red
  text: { r: 40, g: 40, b: 40 },
  textLight: { r: 100, g: 100, b: 100 },
  white: { r: 255, g: 255, b: 255 },
};

interface DiscoveredUrl {
  url: string;
  title: string;
  source: string;
}

interface IntelligenceReportData {
  companyName: string;
  country: string;
  industry?: string;
  generatedAt: string;
  urls: DiscoveredUrl[];
  rawMarkdown: string;
  insightsGroq?: string;
  complementoGemini?: string;
}

/**
 * Sanitize text - remove all markdown symbols and special characters
 */
function sanitizeText(text: string): string {
  if (!text) return '';
  
  return text
    // Remove headers
    .replace(/^#{1,6}\s*/gm, '')
    // Remove bold/italic markers
    .replace(/\*\*\*([^*]+)\*\*\*/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/___([^_]+)___/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    // Remove links but keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove horizontal rules
    .replace(/^---+$/gm, '')
    .replace(/^___+$/gm, '')
    .replace(/^\*\*\*+$/gm, '')
    // Remove list markers and emojis
    .replace(/^[\s]*[-*+]\s*/gm, '• ')
    .replace(/^[\s]*\d+\.\s*/gm, '')
    .replace(/[✅⚠️💪⚡🔍📊📈🎯🏆💡🔄📋✨🌟⭐]/g, '')
    // Clean extra whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Parse structured data from insights
 */
function parseInsights(insights: string): Record<string, unknown> {
  try {
    if (typeof insights === 'object') return insights as Record<string, unknown>;
    return JSON.parse(insights);
  } catch {
    return { raw: insights };
  }
}

/**
 * Draw a simple bar chart
 */
function drawBarChart(
  pdf: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  data: { label: string; value: number; color: { r: number; g: number; b: number } }[],
  title: string
) {
  const chartMargin = 8;
  const chartWidth = width - chartMargin * 2;
  const chartHeight = height - 30;
  const barWidth = Math.min(35, Math.max(25, (chartWidth - 30) / data.length));
  const barGap = 12;
  const maxValue = Math.max(...data.map(d => d.value), 1);
  
  // Title
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(ELP_COLORS.navyBlue.r, ELP_COLORS.navyBlue.g, ELP_COLORS.navyBlue.b);
  pdf.text(title, x + width / 2, y + 6, { align: 'center' });
  
  // Calculate total width needed for centered bars
  const totalBarsWidth = data.length * barWidth + (data.length - 1) * barGap;
  const startX = x + (width - totalBarsWidth) / 2;
  const baseY = y + height - 18;
  const maxBarHeight = chartHeight - 15;
  
  // Draw bars with proper sizing
  data.forEach((item, i) => {
    const barHeight = Math.max(5, (item.value / maxValue) * maxBarHeight);
    const barX = startX + i * (barWidth + barGap);
    
    // Bar with gradient effect (draw shadow first)
    pdf.setFillColor(
      Math.min(255, item.color.r + 30),
      Math.min(255, item.color.g + 30),
      Math.min(255, item.color.b + 30)
    );
    pdf.roundedRect(barX + 1, baseY - barHeight + 1, barWidth, barHeight, 2, 2, 'F');
    
    // Main bar
    pdf.setFillColor(item.color.r, item.color.g, item.color.b);
    pdf.roundedRect(barX, baseY - barHeight, barWidth, barHeight, 2, 2, 'F');
    
    // Value on top of bar
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(ELP_COLORS.text.r, ELP_COLORS.text.g, ELP_COLORS.text.b);
    pdf.text(String(item.value), barX + barWidth / 2, baseY - barHeight - 2, { align: 'center' });
    
    // Label below bar
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(ELP_COLORS.textLight.r, ELP_COLORS.textLight.g, ELP_COLORS.textLight.b);
    const labelTrunc = item.label.length > 10 ? item.label.substring(0, 9) + '.' : item.label;
    pdf.text(labelTrunc, barX + barWidth / 2, baseY + 5, { align: 'center' });
  });
  
  // Baseline
  pdf.setDrawColor(ELP_COLORS.navyBlue.r, ELP_COLORS.navyBlue.g, ELP_COLORS.navyBlue.b);
  pdf.setLineWidth(0.4);
  pdf.line(startX - 5, baseY, startX + totalBarsWidth + 5, baseY);
}

/**
 * Draw a pie chart
 */
function drawPieChart(
  pdf: jsPDF,
  centerX: number,
  centerY: number,
  radius: number,
  data: { label: string; value: number; color: { r: number; g: number; b: number } }[],
  title: string
) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  let startAngle = -Math.PI / 2;
  
  // Title
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(ELP_COLORS.navyBlue.r, ELP_COLORS.navyBlue.g, ELP_COLORS.navyBlue.b);
  pdf.text(title, centerX, centerY - radius - 8, { align: 'center' });
  
  // Draw slices
  data.forEach((item) => {
    const sliceAngle = (item.value / total) * 2 * Math.PI;
    const endAngle = startAngle + sliceAngle;
    
    // Draw pie slice using lines (approximation)
    pdf.setFillColor(item.color.r, item.color.g, item.color.b);
    
    const steps = 20;
    const points: [number, number][] = [[centerX, centerY]];
    
    for (let i = 0; i <= steps; i++) {
      const angle = startAngle + (sliceAngle * i) / steps;
      points.push([
        centerX + radius * Math.cos(angle),
        centerY + radius * Math.sin(angle)
      ]);
    }
    
    // Draw as filled polygon approximation
    if (points.length > 2) {
      const pathData = points.map((p, idx) => 
        idx === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`
      ).join(' ') + ' Z';
      
      // Use simple sector drawing
      pdf.setFillColor(item.color.r, item.color.g, item.color.b);
      
      // Draw sector manually
      for (let i = 0; i <= steps; i++) {
        const angle = startAngle + (sliceAngle * i) / steps;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        if (i === 0) {
          pdf.line(centerX, centerY, x, y);
        }
      }
    }
    
    startAngle = endAngle;
  });
  
  // Draw circle outline
  pdf.setDrawColor(ELP_COLORS.navyBlue.r, ELP_COLORS.navyBlue.g, ELP_COLORS.navyBlue.b);
  pdf.setLineWidth(0.5);
  pdf.circle(centerX, centerY, radius, 'S');
  
  // Legend
  let legendY = centerY + radius + 10;
  data.forEach((item, i) => {
    const legendX = centerX - 30;
    const percentage = Math.round((item.value / total) * 100);
    
    pdf.setFillColor(item.color.r, item.color.g, item.color.b);
    pdf.rect(legendX, legendY - 2, 6, 4, 'F');
    
    pdf.setFontSize(7);
    pdf.setTextColor(ELP_COLORS.text.r, ELP_COLORS.text.g, ELP_COLORS.text.b);
    pdf.text(`${item.label} (${percentage}%)`, legendX + 8, legendY + 1);
    
    legendY += 6;
  });
}

// Complete translations for all PDF content
const PDF_TRANSLATIONS: Record<string, {
  department: string;
  report: string;
  slogan: string;
  confidential: string;
  page: string;
  of: string;
  analyzedSources: string;
  reportDate: string;
  // Section headers
  executiveSummary: string;
  companyData: string;
  directorsLeadership: string;
  companyProfile: string;
  sourcesConsulted: string;
  urlsAnalyzed: string;
  marketAnalysis: string;
  marketOverview: string;
  marketingStrategies: string;
  productsServices: string;
  competitiveDifferentials: string;
  strengths: string;
  weaknesses: string;
  customerFeedback: string;
  validationRecommendations: string;
  feasibilityAnalysis: string;
  evaluationIndicators: string;
  nextSteps: string;
  detailedAnalysis: string;
  detailedProfile: string;
  sectorAnalysis: string;
  geographicAnalysis: string;
  marketPositioning: string;
  reputationAnalysis: string;
  strategicOpportunities: string;
  techInfrastructure: string;
  successFactors: string;
  dueDiligence: string;
  dueDiligenceChecklist: string;
  riskAssessment: string;
  complianceFramework: string;
  sourcesStatistics: string;
  sourceDetails: string;
  analysisStats: string;
  finalConsiderations: string;
  legalDisclaimer: string;
  methodology: string;
  dataQuality: string;
  contact: string;
  // Labels
  company: string;
  registration: string;
  address: string;
  country: string;
  phones: string;
  website: string;
  segment: string;
  region: string;
  channels: string;
  sources: string;
  analysis: string;
  totalUrls: string;
  processedSections: string;
  analysisDate: string;
  analyzedCompany: string;
  sector: string;
  notIdentified: string;
  directorInfo: string;
  // Step texts
  step1: string;
  step2: string;
  step3: string;
  step4: string;
  step5: string;
  // Risk levels
  low: string;
  medium: string;
  toVerify: string;
  // Risk categories
  reputationalRisk: string;
  financialRisk: string;
  operationalRisk: string;
  regulatoryRisk: string;
  complianceRisk: string;
  currencyRisk: string;
  positiveImage: string;
  requiresAnalysis: string;
  consolidatedStructure: string;
  regulatedSector: string;
  pendingVerification: string;
  localOperation: string;
  // Due diligence items
  ddItem1: string;
  ddItem2: string;
  ddItem3: string;
  ddItem4: string;
  ddItem5: string;
  ddItem6: string;
  ddItem7: string;
  ddItem8: string;
  ddItem9: string;
  ddItem10: string;
  // Compliance items
  kyc: string;
  aml: string;
  esgDueDiligence: string;
  antiCorruption: string;
  // Default paragraphs
  executiveSummaryDefault: string;
  marketOverviewDefault: string;
  sectorAnalysisDefault: string;
  geographicAnalysisDefault: string;
  reputationDefault: string;
  dataQualityDefault: string;
  disclaimerText: string;
  // Opportunities
  opp1: string;
  opp2: string;
  opp3: string;
  opp4: string;
  opp5: string;
  // Success factors
  sf1: string;
  sf2: string;
  sf3: string;
  sf4: string;
  // Marketing strategies
  ms1: string;
  ms2: string;
  ms3: string;
  ms4: string;
  // Next steps
  ns1: string;
  ns2: string;
  ns3: string;
}> = {
  pt: {
    department: 'Departamento de Inteligência Empresarial',
    report: 'RELATÓRIO DE INTELIGÊNCIA EMPRESARIAL',
    slogan: 'Transformando resíduos em recursos sustentáveis',
    confidential: 'Documento confidencial - Uso interno e para parceiros autorizados',
    page: 'Página',
    of: 'de',
    analyzedSources: 'FONTES ANALISADAS',
    reportDate: 'DATA DO RELATÓRIO',
    executiveSummary: 'Sumário Executivo',
    companyData: 'Dados Cadastrais da Empresa',
    directorsLeadership: 'Diretoria e Liderança',
    companyProfile: 'Perfil da Empresa',
    sourcesConsulted: 'Fontes de Dados Consultadas',
    urlsAnalyzed: 'URLs Analisadas',
    marketAnalysis: 'Análise de Mercado e Competitividade',
    marketOverview: 'Visão Geral do Mercado',
    marketingStrategies: 'Estratégias de Marketing Identificadas',
    productsServices: 'Produtos e Serviços Oferecidos',
    competitiveDifferentials: 'Oportunidades de Diferencial Competitivo',
    strengths: 'PONTOS FORTES',
    weaknesses: 'PONTOS FRACOS',
    customerFeedback: 'Feedback de Clientes (Oportunidades de Melhoria)',
    validationRecommendations: 'Validação e Recomendações Estratégicas',
    feasibilityAnalysis: 'Análise de Viabilidade',
    evaluationIndicators: 'Indicadores de Avaliação (Estimativa)',
    nextSteps: 'PRÓXIMOS PASSOS RECOMENDADOS',
    detailedAnalysis: 'Análise Detalhada de Informações',
    detailedProfile: 'Perfil Empresarial Detalhado',
    sectorAnalysis: 'Análise do Setor de Atuação',
    geographicAnalysis: 'Análise Geográfica e Regional',
    marketPositioning: 'POSICIONAMENTO DE MERCADO',
    reputationAnalysis: 'Análise de Reputação e Presença Online',
    strategicOpportunities: 'Oportunidades Estratégicas Identificadas',
    techInfrastructure: 'Infraestrutura Tecnológica',
    successFactors: 'Fatores Críticos de Sucesso',
    dueDiligence: 'Due Diligence e Compliance',
    dueDiligenceChecklist: 'Checklist de Due Diligence',
    riskAssessment: 'Avaliação de Riscos Identificados',
    complianceFramework: 'Framework de Compliance Recomendado',
    sourcesStatistics: 'Fontes Consultadas e Estatísticas',
    sourceDetails: 'Detalhamento Completo das Fontes',
    analysisStats: 'RESUMO ESTATÍSTICO DA ANÁLISE',
    finalConsiderations: 'Considerações Finais e Metodologia',
    legalDisclaimer: 'Aviso Legal',
    methodology: 'Metodologia de Análise',
    dataQuality: 'Nota sobre Qualidade dos Dados',
    contact: 'CONTATO',
    company: 'Empresa:',
    registration: 'CNPJ/Registro:',
    address: 'Endereço:',
    country: 'País:',
    phones: 'Telefones:',
    website: 'Website:',
    segment: 'Segmento:',
    region: 'Região:',
    channels: 'Canais:',
    sources: 'Fontes:',
    analysis: 'Análise:',
    totalUrls: 'Total de URLs analisadas:',
    processedSections: 'Seções de conteúdo processadas:',
    analysisDate: 'Data da análise:',
    analyzedCompany: 'Empresa analisada:',
    sector: 'Setor:',
    notIdentified: 'Não identificado',
    directorInfo: 'Informações sobre diretoria não identificadas nas fontes públicas consultadas.',
    step1: '1. Descoberta Automática: Identificação de URLs relevantes via busca inteligente com SerpAPI',
    step2: '2. Coleta de Dados: Extração de conteúdo estruturado das páginas via Jina Reader',
    step3: '3. Análise Primária: Processamento semântico com modelo Llama 3.3 70B (Groq)',
    step4: '4. Validação Cruzada: Complementação e verificação com Gemini 1.5 Flash',
    step5: '5. Consolidação: Geração de insights estratégicos e recomendações',
    low: 'Baixo',
    medium: 'Médio',
    toVerify: 'A Verificar',
    reputationalRisk: 'Risco Reputacional',
    financialRisk: 'Risco Financeiro',
    operationalRisk: 'Risco Operacional',
    regulatoryRisk: 'Risco Regulatório',
    complianceRisk: 'Risco de Compliance',
    currencyRisk: 'Risco Cambial',
    positiveImage: 'Imagem pública positiva',
    requiresAnalysis: 'Requer análise detalhada',
    consolidatedStructure: 'Estrutura consolidada',
    regulatedSector: 'Setor com regulação',
    pendingVerification: 'Pendente verificação',
    localOperation: 'Operação local',
    ddItem1: 'Verificação de registro empresarial e situação cadastral',
    ddItem2: 'Análise de histórico de litígios e processos judiciais',
    ddItem3: 'Avaliação de reputação em órgãos de proteção ao consumidor',
    ddItem4: 'Verificação de certidões negativas fiscais e trabalhistas',
    ddItem5: 'Análise de estrutura societária e beneficiários finais',
    ddItem6: 'Revisão de compliance com regulamentações setoriais',
    ddItem7: 'Avaliação de políticas de ESG e sustentabilidade',
    ddItem8: 'Verificação de sanções internacionais (OFAC, EU, ONU)',
    ddItem9: 'Análise de balanços e demonstrações financeiras',
    ddItem10: 'Verificação de referências comerciais e bancárias',
    kyc: 'KYC (Know Your Customer): Identificação completa de stakeholders',
    aml: 'AML (Anti-Money Laundering): Verificação de origem de recursos',
    esgDueDiligence: 'ESG Due Diligence: Avaliação de práticas ambientais e sociais',
    antiCorruption: 'FCPA/Lei Anticorrupção: Conformidade com legislação anticorrupção',
    executiveSummaryDefault: 'Este relatório apresenta uma análise detalhada de inteligência empresarial sobre {company}, baseada em {urls} fontes públicas da internet. O objetivo é fornecer insights estratégicos para tomada de decisões informadas sobre parcerias e oportunidades de mercado.',
    marketOverviewDefault: 'A empresa {company} atua em um mercado competitivo no setor {industry}. A análise das {urls} fontes identificadas revela um posicionamento de mercado que requer atenção estratégica para maximizar oportunidades de parceria.',
    sectorAnalysisDefault: 'O setor {industry} apresenta características específicas que impactam diretamente as oportunidades de parceria. Fatores como regulamentação, barreiras de entrada, e dinâmica competitiva foram considerados na análise.',
    geographicAnalysisDefault: 'O mercado de {country} possui características únicas que influenciam o ambiente de negócios. Aspectos como infraestrutura logística, ambiente regulatório, e maturidade do mercado são fatores relevantes para considerar em qualquer iniciativa de expansão ou parceria.',
    reputationDefault: 'A presença digital da empresa foi analisada através de múltiplas fontes, incluindo website oficial, perfis profissionais, e menções em veículos de imprensa. Esta análise multicanal permite uma visão mais completa da reputação corporativa.',
    dataQualityDefault: 'A precisão das informações depende da disponibilidade e atualização das fontes públicas consultadas. Recomendamos verificação independente para dados críticos como informações financeiras, registros legais e referências comerciais.',
    disclaimerText: 'Este relatório foi elaborado pelo Departamento de Inteligência Empresarial da ELP Green Technology utilizando exclusivamente fontes públicas da internet. As informações aqui contidas representam uma análise pontual baseada em dados disponíveis na data de geração e devem ser validadas com fontes adicionais antes de qualquer tomada de decisão comercial, financeira ou estratégica. A ELP Green Technology não se responsabiliza por decisões tomadas com base exclusivamente neste documento.',
    opp1: 'Potencial de parceria em projetos de sustentabilidade e economia circular',
    opp2: 'Complementaridade de competências técnicas e comerciais',
    opp3: 'Acesso a novos mercados e canais de distribuição',
    opp4: 'Compartilhamento de tecnologias e know-how setorial',
    opp5: 'Fortalecimento de posicionamento ESG conjunto',
    sf1: 'Alinhamento estratégico entre as partes envolvidas',
    sf2: 'Definição clara de responsabilidades e governança',
    sf3: 'Capacidade de execução e entrega de resultados',
    sf4: 'Flexibilidade para adaptação às condições de mercado',
    ms1: 'Presença digital através de website institucional',
    ms2: 'Comunicação corporativa em canais profissionais',
    ms3: 'Relacionamento com stakeholders do setor',
    ms4: 'Posicionamento baseado em credibilidade técnica',
    ns1: '1. Agendar reunião de apresentação com stakeholders internos',
    ns2: '2. Realizar due diligence complementar (financeira e reputacional)',
    ns3: '3. Preparar proposta preliminar de parceria ou negociação',
  },
  en: {
    department: 'Business Intelligence Department',
    report: 'BUSINESS INTELLIGENCE REPORT',
    slogan: 'Transforming waste into sustainable resources',
    confidential: 'Confidential document - For internal use and authorized partners',
    page: 'Page',
    of: 'of',
    analyzedSources: 'ANALYZED SOURCES',
    reportDate: 'REPORT DATE',
    executiveSummary: 'Executive Summary',
    companyData: 'Company Registration Data',
    directorsLeadership: 'Directors and Leadership',
    companyProfile: 'Company Profile',
    sourcesConsulted: 'Data Sources Consulted',
    urlsAnalyzed: 'URLs Analyzed',
    marketAnalysis: 'Market and Competitiveness Analysis',
    marketOverview: 'Market Overview',
    marketingStrategies: 'Marketing Strategies Identified',
    productsServices: 'Products and Services Offered',
    competitiveDifferentials: 'Competitive Differentiation Opportunities',
    strengths: 'STRENGTHS',
    weaknesses: 'WEAKNESSES',
    customerFeedback: 'Customer Feedback (Improvement Opportunities)',
    validationRecommendations: 'Validation and Strategic Recommendations',
    feasibilityAnalysis: 'Feasibility Analysis',
    evaluationIndicators: 'Evaluation Indicators (Estimate)',
    nextSteps: 'RECOMMENDED NEXT STEPS',
    detailedAnalysis: 'Detailed Information Analysis',
    detailedProfile: 'Detailed Company Profile',
    sectorAnalysis: 'Sector Analysis',
    geographicAnalysis: 'Geographic and Regional Analysis',
    marketPositioning: 'MARKET POSITIONING',
    reputationAnalysis: 'Reputation and Online Presence Analysis',
    strategicOpportunities: 'Strategic Opportunities Identified',
    techInfrastructure: 'Technology Infrastructure',
    successFactors: 'Critical Success Factors',
    dueDiligence: 'Due Diligence and Compliance',
    dueDiligenceChecklist: 'Due Diligence Checklist',
    riskAssessment: 'Risk Assessment',
    complianceFramework: 'Recommended Compliance Framework',
    sourcesStatistics: 'Sources and Statistics',
    sourceDetails: 'Complete Source Details',
    analysisStats: 'ANALYSIS STATISTICAL SUMMARY',
    finalConsiderations: 'Final Considerations and Methodology',
    legalDisclaimer: 'Legal Disclaimer',
    methodology: 'Analysis Methodology',
    dataQuality: 'Data Quality Note',
    contact: 'CONTACT',
    company: 'Company:',
    registration: 'Registration:',
    address: 'Address:',
    country: 'Country:',
    phones: 'Phones:',
    website: 'Website:',
    segment: 'Segment:',
    region: 'Region:',
    channels: 'Channels:',
    sources: 'Sources:',
    analysis: 'Analysis:',
    totalUrls: 'Total URLs analyzed:',
    processedSections: 'Content sections processed:',
    analysisDate: 'Analysis date:',
    analyzedCompany: 'Analyzed company:',
    sector: 'Sector:',
    notIdentified: 'Not identified',
    directorInfo: 'Director information not identified in the public sources consulted.',
    step1: '1. Automatic Discovery: Identification of relevant URLs via intelligent search with SerpAPI',
    step2: '2. Data Collection: Structured content extraction from pages via Jina Reader',
    step3: '3. Primary Analysis: Semantic processing with Llama 3.3 70B model (Groq)',
    step4: '4. Cross Validation: Complementation and verification with Gemini 1.5 Flash',
    step5: '5. Consolidation: Generation of strategic insights and recommendations',
    low: 'Low',
    medium: 'Medium',
    toVerify: 'To Verify',
    reputationalRisk: 'Reputational Risk',
    financialRisk: 'Financial Risk',
    operationalRisk: 'Operational Risk',
    regulatoryRisk: 'Regulatory Risk',
    complianceRisk: 'Compliance Risk',
    currencyRisk: 'Currency Risk',
    positiveImage: 'Positive public image',
    requiresAnalysis: 'Requires detailed analysis',
    consolidatedStructure: 'Consolidated structure',
    regulatedSector: 'Regulated sector',
    pendingVerification: 'Pending verification',
    localOperation: 'Local operation',
    ddItem1: 'Verification of business registration and cadastral status',
    ddItem2: 'Analysis of litigation history and legal proceedings',
    ddItem3: 'Reputation assessment with consumer protection agencies',
    ddItem4: 'Verification of tax and labor clearance certificates',
    ddItem5: 'Analysis of corporate structure and ultimate beneficiaries',
    ddItem6: 'Review of compliance with sector regulations',
    ddItem7: 'ESG and sustainability policy assessment',
    ddItem8: 'International sanctions verification (OFAC, EU, UN)',
    ddItem9: 'Financial statement analysis',
    ddItem10: 'Commercial and banking reference verification',
    kyc: 'KYC (Know Your Customer): Complete stakeholder identification',
    aml: 'AML (Anti-Money Laundering): Source of funds verification',
    esgDueDiligence: 'ESG Due Diligence: Environmental and social practices assessment',
    antiCorruption: 'FCPA/Anti-Corruption: Compliance with anti-corruption legislation',
    executiveSummaryDefault: 'This report presents a detailed business intelligence analysis of {company}, based on {urls} public internet sources. The objective is to provide strategic insights for informed decision-making regarding partnerships and market opportunities.',
    marketOverviewDefault: 'The company {company} operates in a competitive market in the {industry} sector. Analysis of the {urls} identified sources reveals a market positioning that requires strategic attention to maximize partnership opportunities.',
    sectorAnalysisDefault: 'The {industry} sector presents specific characteristics that directly impact partnership opportunities. Factors such as regulation, entry barriers, and competitive dynamics were considered in the analysis.',
    geographicAnalysisDefault: 'The {country} market has unique characteristics that influence the business environment. Aspects such as logistics infrastructure, regulatory environment, and market maturity are relevant factors to consider in any expansion or partnership initiative.',
    reputationDefault: 'The company\'s digital presence was analyzed through multiple sources, including official website, professional profiles, and mentions in press outlets. This multichannel analysis provides a more complete view of corporate reputation.',
    dataQualityDefault: 'The accuracy of information depends on the availability and currency of public sources consulted. We recommend independent verification for critical data such as financial information, legal records, and commercial references.',
    disclaimerText: 'This report was prepared by the Business Intelligence Department of ELP Green Technology using exclusively public internet sources. The information contained herein represents a point-in-time analysis based on data available at the date of generation and should be validated with additional sources before any commercial, financial, or strategic decision-making. ELP Green Technology is not responsible for decisions made solely based on this document.',
    opp1: 'Partnership potential in sustainability and circular economy projects',
    opp2: 'Complementarity of technical and commercial competencies',
    opp3: 'Access to new markets and distribution channels',
    opp4: 'Sharing of technologies and sector know-how',
    opp5: 'Joint ESG positioning strengthening',
    sf1: 'Strategic alignment between parties involved',
    sf2: 'Clear definition of responsibilities and governance',
    sf3: 'Execution capability and results delivery',
    sf4: 'Flexibility to adapt to market conditions',
    ms1: 'Digital presence through institutional website',
    ms2: 'Corporate communication on professional channels',
    ms3: 'Relationship with sector stakeholders',
    ms4: 'Positioning based on technical credibility',
    ns1: '1. Schedule presentation meeting with internal stakeholders',
    ns2: '2. Conduct complementary due diligence (financial and reputational)',
    ns3: '3. Prepare preliminary partnership or negotiation proposal',
  },
  es: {
    department: 'Departamento de Inteligencia Empresarial',
    report: 'INFORME DE INTELIGENCIA EMPRESARIAL',
    slogan: 'Transformando residuos en recursos sostenibles',
    confidential: 'Documento confidencial - Uso interno y para socios autorizados',
    page: 'Página',
    of: 'de',
    analyzedSources: 'FUENTES ANALIZADAS',
    reportDate: 'FECHA DEL INFORME',
    executiveSummary: 'Resumen Ejecutivo',
    companyData: 'Datos de Registro de la Empresa',
    directorsLeadership: 'Directores y Liderazgo',
    companyProfile: 'Perfil de la Empresa',
    sourcesConsulted: 'Fuentes de Datos Consultadas',
    urlsAnalyzed: 'URLs Analizadas',
    marketAnalysis: 'Análisis de Mercado y Competitividad',
    marketOverview: 'Visión General del Mercado',
    marketingStrategies: 'Estrategias de Marketing Identificadas',
    productsServices: 'Productos y Servicios Ofrecidos',
    competitiveDifferentials: 'Oportunidades de Diferenciación Competitiva',
    strengths: 'FORTALEZAS',
    weaknesses: 'DEBILIDADES',
    customerFeedback: 'Retroalimentación de Clientes (Oportunidades de Mejora)',
    validationRecommendations: 'Validación y Recomendaciones Estratégicas',
    feasibilityAnalysis: 'Análisis de Viabilidad',
    evaluationIndicators: 'Indicadores de Evaluación (Estimación)',
    nextSteps: 'PRÓXIMOS PASOS RECOMENDADOS',
    detailedAnalysis: 'Análisis Detallado de Información',
    detailedProfile: 'Perfil Empresarial Detallado',
    sectorAnalysis: 'Análisis del Sector',
    geographicAnalysis: 'Análisis Geográfico y Regional',
    marketPositioning: 'POSICIONAMIENTO DE MERCADO',
    reputationAnalysis: 'Análisis de Reputación y Presencia Online',
    strategicOpportunities: 'Oportunidades Estratégicas Identificadas',
    techInfrastructure: 'Infraestructura Tecnológica',
    successFactors: 'Factores Críticos de Éxito',
    dueDiligence: 'Due Diligence y Compliance',
    dueDiligenceChecklist: 'Lista de Verificación de Due Diligence',
    riskAssessment: 'Evaluación de Riesgos',
    complianceFramework: 'Marco de Compliance Recomendado',
    sourcesStatistics: 'Fuentes y Estadísticas',
    sourceDetails: 'Detalle Completo de Fuentes',
    analysisStats: 'RESUMEN ESTADÍSTICO DEL ANÁLISIS',
    finalConsiderations: 'Consideraciones Finales y Metodología',
    legalDisclaimer: 'Aviso Legal',
    methodology: 'Metodología de Análisis',
    dataQuality: 'Nota sobre Calidad de Datos',
    contact: 'CONTACTO',
    company: 'Empresa:',
    registration: 'Registro:',
    address: 'Dirección:',
    country: 'País:',
    phones: 'Teléfonos:',
    website: 'Sitio web:',
    segment: 'Segmento:',
    region: 'Región:',
    channels: 'Canales:',
    sources: 'Fuentes:',
    analysis: 'Análisis:',
    totalUrls: 'Total de URLs analizadas:',
    processedSections: 'Secciones de contenido procesadas:',
    analysisDate: 'Fecha del análisis:',
    analyzedCompany: 'Empresa analizada:',
    sector: 'Sector:',
    notIdentified: 'No identificado',
    directorInfo: 'Información de directores no identificada en las fuentes públicas consultadas.',
    step1: '1. Descubrimiento Automático: Identificación de URLs relevantes vía búsqueda inteligente con SerpAPI',
    step2: '2. Recolección de Datos: Extracción de contenido estructurado de páginas vía Jina Reader',
    step3: '3. Análisis Primario: Procesamiento semántico con modelo Llama 3.3 70B (Groq)',
    step4: '4. Validación Cruzada: Complementación y verificación con Gemini 1.5 Flash',
    step5: '5. Consolidación: Generación de insights estratégicos y recomendaciones',
    low: 'Bajo',
    medium: 'Medio',
    toVerify: 'A Verificar',
    reputationalRisk: 'Riesgo Reputacional',
    financialRisk: 'Riesgo Financiero',
    operationalRisk: 'Riesgo Operacional',
    regulatoryRisk: 'Riesgo Regulatorio',
    complianceRisk: 'Riesgo de Compliance',
    currencyRisk: 'Riesgo Cambiario',
    positiveImage: 'Imagen pública positiva',
    requiresAnalysis: 'Requiere análisis detallado',
    consolidatedStructure: 'Estructura consolidada',
    regulatedSector: 'Sector regulado',
    pendingVerification: 'Pendiente verificación',
    localOperation: 'Operación local',
    ddItem1: 'Verificación de registro empresarial y situación catastral',
    ddItem2: 'Análisis de historial de litigios y procesos judiciales',
    ddItem3: 'Evaluación de reputación en órganos de protección al consumidor',
    ddItem4: 'Verificación de certificados de solvencia fiscal y laboral',
    ddItem5: 'Análisis de estructura societaria y beneficiarios finales',
    ddItem6: 'Revisión de compliance con regulaciones sectoriales',
    ddItem7: 'Evaluación de políticas ESG y sostenibilidad',
    ddItem8: 'Verificación de sanciones internacionales (OFAC, UE, ONU)',
    ddItem9: 'Análisis de balances y estados financieros',
    ddItem10: 'Verificación de referencias comerciales y bancarias',
    kyc: 'KYC (Know Your Customer): Identificación completa de stakeholders',
    aml: 'AML (Anti-Lavado de Dinero): Verificación de origen de fondos',
    esgDueDiligence: 'ESG Due Diligence: Evaluación de prácticas ambientales y sociales',
    antiCorruption: 'FCPA/Ley Anticorrupción: Conformidad con legislación anticorrupción',
    executiveSummaryDefault: 'Este informe presenta un análisis detallado de inteligencia empresarial sobre {company}, basado en {urls} fuentes públicas de internet. El objetivo es proporcionar insights estratégicos para la toma de decisiones informadas sobre alianzas y oportunidades de mercado.',
    marketOverviewDefault: 'La empresa {company} opera en un mercado competitivo en el sector {industry}. El análisis de las {urls} fuentes identificadas revela un posicionamiento de mercado que requiere atención estratégica para maximizar oportunidades de alianza.',
    sectorAnalysisDefault: 'El sector {industry} presenta características específicas que impactan directamente las oportunidades de alianza. Factores como regulación, barreras de entrada y dinámica competitiva fueron considerados en el análisis.',
    geographicAnalysisDefault: 'El mercado de {country} posee características únicas que influyen en el ambiente de negocios. Aspectos como infraestructura logística, ambiente regulatorio y madurez del mercado son factores relevantes a considerar en cualquier iniciativa de expansión o alianza.',
    reputationDefault: 'La presencia digital de la empresa fue analizada a través de múltiples fuentes, incluyendo sitio web oficial, perfiles profesionales y menciones en medios de comunicación. Este análisis multicanal permite una visión más completa de la reputación corporativa.',
    dataQualityDefault: 'La precisión de la información depende de la disponibilidad y actualización de las fuentes públicas consultadas. Recomendamos verificación independiente para datos críticos como información financiera, registros legales y referencias comerciales.',
    disclaimerText: 'Este informe fue elaborado por el Departamento de Inteligencia Empresarial de ELP Green Technology utilizando exclusivamente fuentes públicas de internet. La información aquí contenida representa un análisis puntual basado en datos disponibles en la fecha de generación y debe ser validada con fuentes adicionales antes de cualquier toma de decisión comercial, financiera o estratégica. ELP Green Technology no se responsabiliza por decisiones tomadas con base exclusivamente en este documento.',
    opp1: 'Potencial de alianza en proyectos de sostenibilidad y economía circular',
    opp2: 'Complementariedad de competencias técnicas y comerciales',
    opp3: 'Acceso a nuevos mercados y canales de distribución',
    opp4: 'Compartir tecnologías y know-how sectorial',
    opp5: 'Fortalecimiento de posicionamiento ESG conjunto',
    sf1: 'Alineación estratégica entre las partes involucradas',
    sf2: 'Definición clara de responsabilidades y gobernanza',
    sf3: 'Capacidad de ejecución y entrega de resultados',
    sf4: 'Flexibilidad para adaptación a condiciones de mercado',
    ms1: 'Presencia digital a través de sitio web institucional',
    ms2: 'Comunicación corporativa en canales profesionales',
    ms3: 'Relación con stakeholders del sector',
    ms4: 'Posicionamiento basado en credibilidad técnica',
    ns1: '1. Agendar reunión de presentación con stakeholders internos',
    ns2: '2. Realizar due diligence complementario (financiero y reputacional)',
    ns3: '3. Preparar propuesta preliminar de alianza o negociación',
  },
  zh: {
    department: '商业智能部门',
    report: '商业智能报告',
    slogan: '将废物转化为可持续资源',
    confidential: '机密文件 - 仅供内部使用和授权合作伙伴',
    page: '页码',
    of: '/',
    analyzedSources: '分析来源',
    reportDate: '报告日期',
    executiveSummary: '执行摘要',
    companyData: '公司注册数据',
    directorsLeadership: '董事和领导层',
    companyProfile: '公司简介',
    sourcesConsulted: '咨询的数据来源',
    urlsAnalyzed: '分析的网址',
    marketAnalysis: '市场和竞争力分析',
    marketOverview: '市场概况',
    marketingStrategies: '识别的营销策略',
    productsServices: '提供的产品和服务',
    competitiveDifferentials: '竞争差异化机会',
    strengths: '优势',
    weaknesses: '劣势',
    customerFeedback: '客户反馈（改进机会）',
    validationRecommendations: '验证和战略建议',
    feasibilityAnalysis: '可行性分析',
    evaluationIndicators: '评估指标（估计）',
    nextSteps: '建议的下一步',
    detailedAnalysis: '详细信息分析',
    detailedProfile: '详细公司简介',
    sectorAnalysis: '行业分析',
    geographicAnalysis: '地理和区域分析',
    marketPositioning: '市场定位',
    reputationAnalysis: '声誉和在线存在分析',
    strategicOpportunities: '识别的战略机会',
    techInfrastructure: '技术基础设施',
    successFactors: '关键成功因素',
    dueDiligence: '尽职调查和合规',
    dueDiligenceChecklist: '尽职调查清单',
    riskAssessment: '风险评估',
    complianceFramework: '推荐的合规框架',
    sourcesStatistics: '来源和统计',
    sourceDetails: '完整来源详情',
    analysisStats: '分析统计摘要',
    finalConsiderations: '最终考虑和方法论',
    legalDisclaimer: '法律声明',
    methodology: '分析方法',
    dataQuality: '数据质量说明',
    contact: '联系方式',
    company: '公司：',
    registration: '注册号：',
    address: '地址：',
    country: '国家：',
    phones: '电话：',
    website: '网站：',
    segment: '细分：',
    region: '地区：',
    channels: '渠道：',
    sources: '来源：',
    analysis: '分析：',
    totalUrls: '分析的URL总数：',
    processedSections: '处理的内容部分：',
    analysisDate: '分析日期：',
    analyzedCompany: '分析的公司：',
    sector: '行业：',
    notIdentified: '未识别',
    directorInfo: '在咨询的公开来源中未识别到董事信息。',
    step1: '1. 自动发现：通过SerpAPI智能搜索识别相关URL',
    step2: '2. 数据收集：通过Jina Reader从页面提取结构化内容',
    step3: '3. 初步分析：使用Llama 3.3 70B模型（Groq）进行语义处理',
    step4: '4. 交叉验证：使用Gemini 1.5 Flash进行补充和验证',
    step5: '5. 整合：生成战略洞察和建议',
    low: '低',
    medium: '中',
    toVerify: '待验证',
    reputationalRisk: '声誉风险',
    financialRisk: '财务风险',
    operationalRisk: '运营风险',
    regulatoryRisk: '监管风险',
    complianceRisk: '合规风险',
    currencyRisk: '汇率风险',
    positiveImage: '正面公众形象',
    requiresAnalysis: '需要详细分析',
    consolidatedStructure: '成熟结构',
    regulatedSector: '受监管行业',
    pendingVerification: '待验证',
    localOperation: '本地运营',
    ddItem1: '验证企业注册和登记状态',
    ddItem2: '诉讼历史和法律程序分析',
    ddItem3: '消费者保护机构声誉评估',
    ddItem4: '税务和劳动合规证书验证',
    ddItem5: '公司结构和最终受益人分析',
    ddItem6: '行业法规合规审查',
    ddItem7: 'ESG和可持续发展政策评估',
    ddItem8: '国际制裁验证（OFAC、欧盟、联合国）',
    ddItem9: '财务报表分析',
    ddItem10: '商业和银行参考验证',
    kyc: 'KYC（了解您的客户）：完整的利益相关者识别',
    aml: 'AML（反洗钱）：资金来源验证',
    esgDueDiligence: 'ESG尽职调查：环境和社会实践评估',
    antiCorruption: 'FCPA/反腐败法：反腐败立法合规',
    executiveSummaryDefault: '本报告基于{urls}个公开互联网来源，对{company}进行了详细的商业智能分析。目的是为合作伙伴关系和市场机会的明智决策提供战略洞察。',
    marketOverviewDefault: '{company}公司在{industry}行业的竞争市场中运营。对{urls}个识别来源的分析揭示了一个需要战略关注以最大化合作机会的市场定位。',
    sectorAnalysisDefault: '{industry}行业呈现出直接影响合作机会的特定特征。监管、进入壁垒和竞争动态等因素已在分析中考虑。',
    geographicAnalysisDefault: '{country}市场具有影响商业环境的独特特征。物流基础设施、监管环境和市场成熟度等方面是任何扩张或合作倡议中需要考虑的相关因素。',
    reputationDefault: '通过多种来源分析了公司的数字存在，包括官方网站、专业档案和媒体提及。这种多渠道分析提供了对企业声誉更完整的视图。',
    dataQualityDefault: '信息的准确性取决于咨询的公开来源的可用性和时效性。我们建议对财务信息、法律记录和商业参考等关键数据进行独立验证。',
    disclaimerText: '本报告由ELP Green Technology商业智能部门仅使用公开互联网来源编制。此处包含的信息代表基于生成日期可用数据的时点分析，在任何商业、财务或战略决策之前应使用其他来源进行验证。ELP Green Technology对仅基于本文件做出的决定不承担责任。',
    opp1: '可持续发展和循环经济项目的合作潜力',
    opp2: '技术和商业能力的互补性',
    opp3: '进入新市场和分销渠道',
    opp4: '技术和行业知识共享',
    opp5: '加强联合ESG定位',
    sf1: '相关方之间的战略一致性',
    sf2: '明确定义责任和治理',
    sf3: '执行能力和结果交付',
    sf4: '适应市场条件的灵活性',
    ms1: '通过机构网站的数字存在',
    ms2: '在专业渠道上的企业沟通',
    ms3: '与行业利益相关者的关系',
    ms4: '基于技术可信度的定位',
    ns1: '1. 安排与内部利益相关者的演示会议',
    ns2: '2. 进行补充尽职调查（财务和声誉）',
    ns3: '3. 准备初步合作或谈判提案',
  },
  it: {
    department: 'Dipartimento di Intelligence Aziendale',
    report: 'RAPPORTO DI INTELLIGENCE AZIENDALE',
    slogan: 'Trasformare i rifiuti in risorse sostenibili',
    confidential: 'Documento riservato - Per uso interno e partner autorizzati',
    page: 'Pagina',
    of: 'di',
    analyzedSources: 'FONTI ANALIZZATE',
    reportDate: 'DATA DEL RAPPORTO',
    executiveSummary: 'Sommario Esecutivo',
    companyData: 'Dati di Registrazione Azienda',
    directorsLeadership: 'Direttori e Leadership',
    companyProfile: 'Profilo Aziendale',
    sourcesConsulted: 'Fonti Dati Consultate',
    urlsAnalyzed: 'URL Analizzate',
    marketAnalysis: 'Analisi di Mercato e Competitività',
    marketOverview: 'Panoramica del Mercato',
    marketingStrategies: 'Strategie di Marketing Identificate',
    productsServices: 'Prodotti e Servizi Offerti',
    competitiveDifferentials: 'Opportunità di Differenziazione Competitiva',
    strengths: 'PUNTI DI FORZA',
    weaknesses: 'PUNTI DI DEBOLEZZA',
    customerFeedback: 'Feedback Clienti (Opportunità di Miglioramento)',
    validationRecommendations: 'Validazione e Raccomandazioni Strategiche',
    feasibilityAnalysis: 'Analisi di Fattibilità',
    evaluationIndicators: 'Indicatori di Valutazione (Stima)',
    nextSteps: 'PROSSIMI PASSI RACCOMANDATI',
    detailedAnalysis: 'Analisi Dettagliata delle Informazioni',
    detailedProfile: 'Profilo Aziendale Dettagliato',
    sectorAnalysis: 'Analisi del Settore',
    geographicAnalysis: 'Analisi Geografica e Regionale',
    marketPositioning: 'POSIZIONAMENTO DI MERCATO',
    reputationAnalysis: 'Analisi della Reputazione e Presenza Online',
    strategicOpportunities: 'Opportunità Strategiche Identificate',
    techInfrastructure: 'Infrastruttura Tecnologica',
    successFactors: 'Fattori Critici di Successo',
    dueDiligence: 'Due Diligence e Compliance',
    dueDiligenceChecklist: 'Checklist di Due Diligence',
    riskAssessment: 'Valutazione dei Rischi',
    complianceFramework: 'Framework di Compliance Raccomandato',
    sourcesStatistics: 'Fonti e Statistiche',
    sourceDetails: 'Dettaglio Completo delle Fonti',
    analysisStats: 'RIEPILOGO STATISTICO DELL\'ANALISI',
    finalConsiderations: 'Considerazioni Finali e Metodologia',
    legalDisclaimer: 'Avviso Legale',
    methodology: 'Metodologia di Analisi',
    dataQuality: 'Nota sulla Qualità dei Dati',
    contact: 'CONTATTO',
    company: 'Azienda:',
    registration: 'Registrazione:',
    address: 'Indirizzo:',
    country: 'Paese:',
    phones: 'Telefoni:',
    website: 'Sito web:',
    segment: 'Segmento:',
    region: 'Regione:',
    channels: 'Canali:',
    sources: 'Fonti:',
    analysis: 'Analisi:',
    totalUrls: 'Totale URL analizzate:',
    processedSections: 'Sezioni di contenuto elaborate:',
    analysisDate: 'Data dell\'analisi:',
    analyzedCompany: 'Azienda analizzata:',
    sector: 'Settore:',
    notIdentified: 'Non identificato',
    directorInfo: 'Informazioni sui direttori non identificate nelle fonti pubbliche consultate.',
    step1: '1. Scoperta Automatica: Identificazione di URL rilevanti tramite ricerca intelligente con SerpAPI',
    step2: '2. Raccolta Dati: Estrazione di contenuti strutturati dalle pagine tramite Jina Reader',
    step3: '3. Analisi Primaria: Elaborazione semantica con modello Llama 3.3 70B (Groq)',
    step4: '4. Validazione Incrociata: Complementazione e verifica con Gemini 1.5 Flash',
    step5: '5. Consolidamento: Generazione di insight strategici e raccomandazioni',
    low: 'Basso',
    medium: 'Medio',
    toVerify: 'Da Verificare',
    reputationalRisk: 'Rischio Reputazionale',
    financialRisk: 'Rischio Finanziario',
    operationalRisk: 'Rischio Operativo',
    regulatoryRisk: 'Rischio Regolatorio',
    complianceRisk: 'Rischio di Compliance',
    currencyRisk: 'Rischio Valutario',
    positiveImage: 'Immagine pubblica positiva',
    requiresAnalysis: 'Richiede analisi dettagliata',
    consolidatedStructure: 'Struttura consolidata',
    regulatedSector: 'Settore regolamentato',
    pendingVerification: 'In attesa di verifica',
    localOperation: 'Operazione locale',
    ddItem1: 'Verifica della registrazione aziendale e stato catastale',
    ddItem2: 'Analisi della cronologia dei contenziosi e procedimenti legali',
    ddItem3: 'Valutazione della reputazione presso enti di protezione dei consumatori',
    ddItem4: 'Verifica di certificati di conformità fiscale e del lavoro',
    ddItem5: 'Analisi della struttura societaria e beneficiari finali',
    ddItem6: 'Revisione della conformità alle normative settoriali',
    ddItem7: 'Valutazione delle politiche ESG e sostenibilità',
    ddItem8: 'Verifica delle sanzioni internazionali (OFAC, UE, ONU)',
    ddItem9: 'Analisi dei bilanci e rendiconti finanziari',
    ddItem10: 'Verifica di referenze commerciali e bancarie',
    kyc: 'KYC (Know Your Customer): Identificazione completa degli stakeholder',
    aml: 'AML (Anti-Riciclaggio): Verifica dell\'origine dei fondi',
    esgDueDiligence: 'ESG Due Diligence: Valutazione delle pratiche ambientali e sociali',
    antiCorruption: 'FCPA/Legge Anticorruzione: Conformità alla legislazione anticorruzione',
    executiveSummaryDefault: 'Questo rapporto presenta un\'analisi dettagliata di intelligence aziendale su {company}, basata su {urls} fonti pubbliche di internet. L\'obiettivo è fornire insight strategici per decisioni informate riguardo partnership e opportunità di mercato.',
    marketOverviewDefault: 'L\'azienda {company} opera in un mercato competitivo nel settore {industry}. L\'analisi delle {urls} fonti identificate rivela un posizionamento di mercato che richiede attenzione strategica per massimizzare le opportunità di partnership.',
    sectorAnalysisDefault: 'Il settore {industry} presenta caratteristiche specifiche che impattano direttamente le opportunità di partnership. Fattori come regolamentazione, barriere all\'ingresso e dinamica competitiva sono stati considerati nell\'analisi.',
    geographicAnalysisDefault: 'Il mercato di {country} possiede caratteristiche uniche che influenzano l\'ambiente di business. Aspetti come infrastruttura logistica, ambiente normativo e maturità del mercato sono fattori rilevanti da considerare in qualsiasi iniziativa di espansione o partnership.',
    reputationDefault: 'La presenza digitale dell\'azienda è stata analizzata attraverso molteplici fonti, inclusi sito web ufficiale, profili professionali e menzioni nella stampa. Questa analisi multicanale permette una visione più completa della reputazione aziendale.',
    dataQualityDefault: 'L\'accuratezza delle informazioni dipende dalla disponibilità e dall\'aggiornamento delle fonti pubbliche consultate. Raccomandiamo una verifica indipendente per dati critici come informazioni finanziarie, registri legali e referenze commerciali.',
    disclaimerText: 'Questo rapporto è stato elaborato dal Dipartimento di Intelligence Aziendale di ELP Green Technology utilizzando esclusivamente fonti pubbliche di internet. Le informazioni qui contenute rappresentano un\'analisi puntuale basata sui dati disponibili alla data di generazione e devono essere validate con fonti aggiuntive prima di qualsiasi decisione commerciale, finanziaria o strategica. ELP Green Technology non è responsabile per decisioni prese basandosi esclusivamente su questo documento.',
    opp1: 'Potenziale di partnership in progetti di sostenibilità ed economia circolare',
    opp2: 'Complementarità di competenze tecniche e commerciali',
    opp3: 'Accesso a nuovi mercati e canali di distribuzione',
    opp4: 'Condivisione di tecnologie e know-how settoriale',
    opp5: 'Rafforzamento del posizionamento ESG congiunto',
    sf1: 'Allineamento strategico tra le parti coinvolte',
    sf2: 'Definizione chiara di responsabilità e governance',
    sf3: 'Capacità di esecuzione e consegna dei risultati',
    sf4: 'Flessibilità per adattamento alle condizioni di mercato',
    ms1: 'Presenza digitale attraverso sito web istituzionale',
    ms2: 'Comunicazione aziendale su canali professionali',
    ms3: 'Relazione con stakeholder del settore',
    ms4: 'Posizionamento basato su credibilità tecnica',
    ns1: '1. Programmare un incontro di presentazione con gli stakeholder interni',
    ns2: '2. Condurre due diligence complementare (finanziaria e reputazionale)',
    ns3: '3. Preparare proposta preliminare di partnership o negoziazione',
  },
};

/**
 * Generate Professional Intelligence PDF
 */
export async function generateIntelligencePDF(
  data: IntelligenceReportData,
  logoSrc?: string,
  language: string = 'pt'
): Promise<void> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;
  const t = PDF_TRANSLATIONS[language] || PDF_TRANSLATIONS.pt;
  
  let currentPage = 1;
  let yPos = 0;
  
  // Load logo
  let logoLoaded = false;
  const logoImg = new Image();
  logoImg.crossOrigin = 'anonymous';
  
  if (logoSrc) {
    try {
      await new Promise<void>((resolve) => {
        logoImg.onload = () => {
          logoLoaded = true;
          resolve();
        };
        logoImg.onerror = () => resolve();
        logoImg.src = logoSrc;
      });
    } catch {
      console.warn('Failed to load logo');
    }
  }
  
  // Helper: Add header - COMPACT (max 1px spacing)
  const addHeader = () => {
    // Thin navy line at top (1px = ~0.26mm)
    pdf.setFillColor(ELP_COLORS.navyBlue.r, ELP_COLORS.navyBlue.g, ELP_COLORS.navyBlue.b);
    pdf.rect(0, 0, pageWidth, 0.3, 'F');
    
    // Logo and text on same compact line
    if (logoLoaded) {
      try {
        pdf.addImage(logoImg, 'PNG', margin, 2, 28, 12);
      } catch {
        pdf.setTextColor(ELP_COLORS.navyBlue.r, ELP_COLORS.navyBlue.g, ELP_COLORS.navyBlue.b);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('ELP Green Technology', margin, 9);
      }
    } else {
      pdf.setTextColor(ELP_COLORS.navyBlue.r, ELP_COLORS.navyBlue.g, ELP_COLORS.navyBlue.b);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('ELP Green Technology', margin, 9);
    }
    
    // Navy text on right - compact
    pdf.setTextColor(ELP_COLORS.navyBlue.r, ELP_COLORS.navyBlue.g, ELP_COLORS.navyBlue.b);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.text(t.department, pageWidth - margin, 7, { align: 'right' });
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'normal');
    pdf.text('www.elpgreen.com', pageWidth - margin, 11, { align: 'right' });
    
    // Thin separator line
    pdf.setDrawColor(ELP_COLORS.navyBlue.r, ELP_COLORS.navyBlue.g, ELP_COLORS.navyBlue.b);
    pdf.setLineWidth(0.3);
    pdf.line(margin, 15, pageWidth - margin, 15);
  };
  
  // Helper: Add footer - COMPACT (max 1px spacing)
  const addFooter = (pageNum: number, totalPages: number) => {
    const footerY = pageHeight - 6;
    
    // Thin line at bottom
    pdf.setDrawColor(ELP_COLORS.navyBlue.r, ELP_COLORS.navyBlue.g, ELP_COLORS.navyBlue.b);
    pdf.setLineWidth(0.3);
    pdf.line(margin, footerY - 3, pageWidth - margin, footerY - 3);
    
    // Single line footer - compact
    pdf.setFontSize(5.5);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(ELP_COLORS.textLight.r, ELP_COLORS.textLight.g, ELP_COLORS.textLight.b);
    pdf.text(`ELP Green Technology | ${t.slogan} | ${t.confidential}`, margin, footerY);
    
    pdf.setTextColor(ELP_COLORS.navyBlue.r, ELP_COLORS.navyBlue.g, ELP_COLORS.navyBlue.b);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${t.page} ${pageNum} ${t.of} ${totalPages}`, pageWidth - margin, footerY, { align: 'right' });
  };
  
  // Helper: Check page break - adjusted for compact header/footer
  const checkPageBreak = (neededHeight: number) => {
    // Footer starts at pageHeight - 10, content should stop before
    if (yPos + neededHeight > pageHeight - 12) {
      pdf.addPage();
      currentPage++;
      yPos = 18; // Compact header ends at ~16mm
      return true;
    }
    return false;
  };
  
  // Helper: Draw section header
  const drawSectionHeader = (title: string) => {
    checkPageBreak(12);
    
    pdf.setFillColor(ELP_COLORS.navyLight.r, ELP_COLORS.navyLight.g, ELP_COLORS.navyLight.b);
    pdf.roundedRect(margin - 2, yPos - 4, maxWidth + 4, 9, 2, 2, 'F');
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(ELP_COLORS.white.r, ELP_COLORS.white.g, ELP_COLORS.white.b);
    pdf.text(title.toUpperCase(), margin + 2, yPos + 2);
    
    yPos += 10;
  };
  
  // Helper: Draw subsection
  const drawSubsection = (title: string) => {
    checkPageBreak(8);
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(ELP_COLORS.navyBlue.r, ELP_COLORS.navyBlue.g, ELP_COLORS.navyBlue.b);
    pdf.text(title, margin, yPos);
    
    yPos += 5;
  };
  
  // Helper: Draw paragraph with proper line height
  const drawParagraph = (text: string, indent: number = 0) => {
    const cleanText = sanitizeText(text);
    if (!cleanText.trim()) return;
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(ELP_COLORS.text.r, ELP_COLORS.text.g, ELP_COLORS.text.b);
    
    // Ensure text fits within margins
    const availableWidth = maxWidth - indent - 2;
    const lines = pdf.splitTextToSize(cleanText, availableWidth);
    
    for (const line of lines) {
      checkPageBreak(4);
      pdf.text(line, margin + indent, yPos);
      yPos += 3.8;
    }
    
    yPos += 1.5;
  };
  
  // Helper: Draw bullet list with proper margins
  const drawBulletList = (items: string[]) => {
    const bulletIndent = 5;
    const textIndent = 8;
    const availableWidth = maxWidth - textIndent - 2;
    
    for (const item of items) {
      const cleanItem = sanitizeText(item);
      if (!cleanItem.trim()) continue;
      
      checkPageBreak(5);
      
      // Draw bullet
      pdf.setFillColor(ELP_COLORS.navyBlue.r, ELP_COLORS.navyBlue.g, ELP_COLORS.navyBlue.b);
      pdf.circle(margin + 2, yPos - 0.8, 0.8, 'F');
      
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(ELP_COLORS.text.r, ELP_COLORS.text.g, ELP_COLORS.text.b);
      
      // Split text to fit within available width
      const lines = pdf.splitTextToSize(cleanItem, availableWidth);
      for (let i = 0; i < lines.length; i++) {
        if (i > 0) checkPageBreak(4);
        pdf.text(lines[i], margin + textIndent, yPos);
        yPos += 3.8;
      }
      yPos += 0.5;
    }
    yPos += 1;
  };
  
  /**
   * Draw markdown table as formatted PDF table
   */
  const drawMarkdownTable = (tableContent: string): boolean => {
    const lines = tableContent.trim().split('\n').filter(l => l.trim());
    if (lines.length < 2) return false;
    
    // Parse table rows
    const rows: string[][] = [];
    for (const line of lines) {
      // Skip separator lines (|---|---|)
      if (/^\|?\s*[-:]+\s*\|/.test(line)) continue;
      
      const cells = line
        .split('|')
        .map(c => c.trim())
        .filter(c => c.length > 0);
      
      if (cells.length >= 2) {
        rows.push(cells);
      }
    }
    
    if (rows.length < 2) return false;
    
    const headers = rows[0];
    const dataRows = rows.slice(1);
    
    // Table dimensions
    const colCount = headers.length;
    const colWidth = (maxWidth - 4) / colCount;
    const rowHeight = 6;
    const headerHeight = 7;
    
    // Check if table fits on page
    const tableHeight = headerHeight + (dataRows.length * rowHeight) + 2;
    checkPageBreak(tableHeight);
    
    // Draw header row
    pdf.setFillColor(ELP_COLORS.navyBlue.r, ELP_COLORS.navyBlue.g, ELP_COLORS.navyBlue.b);
    pdf.roundedRect(margin, yPos, maxWidth, headerHeight, 1, 1, 'F');
    
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(ELP_COLORS.white.r, ELP_COLORS.white.g, ELP_COLORS.white.b);
    
    for (let i = 0; i < headers.length; i++) {
      const headerText = headers[i].substring(0, 30);
      pdf.text(headerText, margin + 2 + (i * colWidth), yPos + 4.5);
    }
    
    yPos += headerHeight;
    
    // Draw data rows
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(ELP_COLORS.text.r, ELP_COLORS.text.g, ELP_COLORS.text.b);
    
    for (let rowIdx = 0; rowIdx < dataRows.length; rowIdx++) {
      const row = dataRows[rowIdx];
      
      // Alternating row colors
      if (rowIdx % 2 === 0) {
        pdf.setFillColor(248, 250, 252);
        pdf.rect(margin, yPos, maxWidth, rowHeight, 'F');
      }
      
      // Check page break mid-table
      if (yPos + rowHeight > pageHeight - 12) {
        pdf.addPage();
        currentPage++;
        yPos = 18;
      }
      
      for (let i = 0; i < Math.min(row.length, colCount); i++) {
        // Clean URLs from markdown format <https://...>
        let cellText = row[i]
          .replace(/<(https?:\/\/[^>]+)>/g, '$1')
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
        
        // Truncate long text
        const maxCellWidth = colWidth - 4;
        pdf.setFontSize(6.5);
        
        while (pdf.getTextWidth(cellText) > maxCellWidth && cellText.length > 10) {
          cellText = cellText.substring(0, cellText.length - 4) + '...';
        }
        
        pdf.text(cellText, margin + 2 + (i * colWidth), yPos + 4);
      }
      
      yPos += rowHeight;
    }
    
    // Table border
    pdf.setDrawColor(ELP_COLORS.navyBlue.r, ELP_COLORS.navyBlue.g, ELP_COLORS.navyBlue.b);
    pdf.setLineWidth(0.3);
    pdf.rect(margin, yPos - (dataRows.length * rowHeight) - headerHeight, maxWidth, (dataRows.length * rowHeight) + headerHeight);
    
    yPos += 3;
    return true;
  };
  
  /**
   * Check if text contains a markdown table
   */
  const containsMarkdownTable = (text: string): boolean => {
    return /\|[^|]+\|[^|]+\|/.test(text) && /\|[\s-:]+\|/.test(text);
  };
  
  /**
   * Extract and draw tables from markdown content
   */
  const processMarkdownContent = (content: string) => {
    // Split content into table and non-table sections
    const lines = content.split('\n');
    let currentBlock: string[] = [];
    let inTable = false;
    
    for (const line of lines) {
      const isTableLine = /^\|/.test(line.trim()) || /^\s*\|/.test(line);
      
      if (isTableLine) {
        if (!inTable && currentBlock.length > 0) {
          // Process non-table content
          const text = currentBlock.join('\n').trim();
          if (text.length > 0) {
            processTextBlock(text);
          }
          currentBlock = [];
        }
        inTable = true;
        currentBlock.push(line);
      } else {
        if (inTable && currentBlock.length > 0) {
          // Process table
          const tableContent = currentBlock.join('\n');
          if (!drawMarkdownTable(tableContent)) {
            // Fallback to text if table parsing fails
            processTextBlock(tableContent);
          }
          currentBlock = [];
        }
        inTable = false;
        currentBlock.push(line);
      }
    }
    
    // Process remaining content
    if (currentBlock.length > 0) {
      const text = currentBlock.join('\n').trim();
      if (inTable) {
        if (!drawMarkdownTable(text)) {
          processTextBlock(text);
        }
      } else {
        processTextBlock(text);
      }
    }
  };
  
  /**
   * Process text block (non-table content)
   */
  const processTextBlock = (text: string) => {
    const cleanText = sanitizeText(text);
    const paragraphs = cleanText.split('\n\n').filter(p => p.trim());
    
    for (const paragraph of paragraphs) {
      if (paragraph.trim().length < 10) continue;
      
      // Check if it looks like a header
      const isHeader = paragraph.length < 60 && 
        !paragraph.includes('.') && 
        !paragraph.startsWith('•') &&
        /^[A-ZÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇ]/.test(paragraph);
      
      if (isHeader) {
        drawSubsection(paragraph.trim());
      } else {
        drawParagraph(paragraph);
      }
    }
  };
  
  // ========== PAGE 1: COVER PAGE - WHITE BACKGROUND WITH NAVY STRIPES ==========
  yPos = 0;
  
  // WHITE background
  pdf.setFillColor(ELP_COLORS.white.r, ELP_COLORS.white.g, ELP_COLORS.white.b);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // TOP STRIPE - Navy Blue
  pdf.setFillColor(ELP_COLORS.navyBlue.r, ELP_COLORS.navyBlue.g, ELP_COLORS.navyBlue.b);
  pdf.rect(0, 0, pageWidth, 8, 'F');
  
  // Accent line below - lighter blue
  pdf.setFillColor(ELP_COLORS.accent.r, ELP_COLORS.accent.g, ELP_COLORS.accent.b);
  pdf.rect(0, 8, pageWidth, 2, 'F');
  
  // BOTTOM STRIPE - Navy Blue
  pdf.setFillColor(ELP_COLORS.navyBlue.r, ELP_COLORS.navyBlue.g, ELP_COLORS.navyBlue.b);
  pdf.rect(0, pageHeight - 20, pageWidth, 20, 'F');
  
  // Logo centered
  if (logoLoaded) {
    try {
      pdf.addImage(logoImg, 'PNG', pageWidth / 2 - 30, 25, 60, 27);
    } catch {
      // fallback
    }
  }
  
  // Company name
  pdf.setTextColor(ELP_COLORS.navyBlue.r, ELP_COLORS.navyBlue.g, ELP_COLORS.navyBlue.b);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ELP Green Technology', pageWidth / 2, 62, { align: 'center' });
  
  // Tagline - use translation
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(ELP_COLORS.textLight.r, ELP_COLORS.textLight.g, ELP_COLORS.textLight.b);
  pdf.text(t.department, pageWidth / 2, 69, { align: 'center' });
  
  // Decorative line
  pdf.setDrawColor(ELP_COLORS.navyBlue.r, ELP_COLORS.navyBlue.g, ELP_COLORS.navyBlue.b);
  pdf.setLineWidth(0.8);
  pdf.line(pageWidth / 2 - 50, 76, pageWidth / 2 + 50, 76);
  
  // Document type badge - use translation
  const badgeWidth = 130;
  pdf.setFillColor(ELP_COLORS.success.r, ELP_COLORS.success.g, ELP_COLORS.success.b);
  pdf.roundedRect(pageWidth / 2 - badgeWidth / 2, 85, badgeWidth, 10, 3, 3, 'F');
  pdf.setTextColor(ELP_COLORS.white.r, ELP_COLORS.white.g, ELP_COLORS.white.b);
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  pdf.text(t.report, pageWidth / 2, 91.5, { align: 'center' });
  
  // Main title - Company being analyzed (with proper text wrapping)
  pdf.setTextColor(ELP_COLORS.navyBlue.r, ELP_COLORS.navyBlue.g, ELP_COLORS.navyBlue.b);
  pdf.setFont('helvetica', 'bold');
  
  // Calculate appropriate font size and handle long names
  const companyName = data.companyName;
  const maxTitleWidth = pageWidth - 50; // 25mm margin on each side (more conservative)
  let titleFontSize = 18; // Start smaller
  
  // Try to fit the title, reducing font size if needed
  pdf.setFontSize(titleFontSize);
  let titleWidth = pdf.getTextWidth(companyName);
  
  while (titleWidth > maxTitleWidth && titleFontSize > 10) {
    titleFontSize -= 1;
    pdf.setFontSize(titleFontSize);
    titleWidth = pdf.getTextWidth(companyName);
  }
  
  // Always wrap long text to multiple lines
  const titleLines = pdf.splitTextToSize(companyName, maxTitleWidth);
  let titleY = 108;
  const lineHeight = titleFontSize * 0.45 + 2;
  
  for (let i = 0; i < Math.min(titleLines.length, 3); i++) {
    pdf.text(titleLines[i], pageWidth / 2, titleY, { align: 'center' });
    titleY += lineHeight;
  }
  
  // Location info - closer to title
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(ELP_COLORS.textLight.r, ELP_COLORS.textLight.g, ELP_COLORS.textLight.b);
  const locationText = `${data.country}${data.industry ? ` | ${data.industry}` : ''}`;
  pdf.text(locationText.substring(0, 50), pageWidth / 2, 135, { align: 'center' });
  
  // Info cards - moved up
  const cardWidth = 75;
  const cardHeight = 26;
  const cardsStartX = pageWidth / 2 - cardWidth - 5;
  let cardY = 148;
  
  // URLs analyzed card
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(ELP_COLORS.navyBlue.r, ELP_COLORS.navyBlue.g, ELP_COLORS.navyBlue.b);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(cardsStartX, cardY, cardWidth, cardHeight, 2, 2, 'FD');
  pdf.setFillColor(ELP_COLORS.navyBlue.r, ELP_COLORS.navyBlue.g, ELP_COLORS.navyBlue.b);
  pdf.rect(cardsStartX, cardY, 3, cardHeight, 'F');
  
  pdf.setTextColor(ELP_COLORS.textLight.r, ELP_COLORS.textLight.g, ELP_COLORS.textLight.b);
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  pdf.text('FONTES ANALISADAS', cardsStartX + 8, cardY + 7);
  pdf.setTextColor(ELP_COLORS.navyBlue.r, ELP_COLORS.navyBlue.g, ELP_COLORS.navyBlue.b);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${data.urls.length} URLs`, cardsStartX + 8, cardY + 18);
  
  // Date card
  const rightCardX = cardsStartX + cardWidth + 10;
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(ELP_COLORS.success.r, ELP_COLORS.success.g, ELP_COLORS.success.b);
  pdf.roundedRect(rightCardX, cardY, cardWidth, cardHeight, 2, 2, 'FD');
  pdf.setFillColor(ELP_COLORS.success.r, ELP_COLORS.success.g, ELP_COLORS.success.b);
  pdf.rect(rightCardX, cardY, 3, cardHeight, 'F');
  
  pdf.setTextColor(ELP_COLORS.textLight.r, ELP_COLORS.textLight.g, ELP_COLORS.textLight.b);
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DATA DO RELATÓRIO', rightCardX + 8, cardY + 7);
  pdf.setTextColor(ELP_COLORS.navyBlue.r, ELP_COLORS.navyBlue.g, ELP_COLORS.navyBlue.b);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(data.generatedAt, rightCardX + 8, cardY + 18);
  
  // Confidential badge - moved up to reduce white space
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(ELP_COLORS.textLight.r, ELP_COLORS.textLight.g, ELP_COLORS.textLight.b);
  pdf.setLineWidth(0.2);
  pdf.roundedRect(pageWidth / 2 - 40, 188, 80, 10, 2, 2, 'FD');
  pdf.setTextColor(ELP_COLORS.textLight.r, ELP_COLORS.textLight.g, ELP_COLORS.textLight.b);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text(t.confidential.split(' - ')[0].toUpperCase(), pageWidth / 2, 194.5, { align: 'center' });
  
  // Footer text on bottom stripe
  pdf.setTextColor(ELP_COLORS.white.r, ELP_COLORS.white.g, ELP_COLORS.white.b);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('ELP Green Technology | www.elpgreen.com', pageWidth / 2, pageHeight - 10, { align: 'center' });
  
  // ========== PAGE 2: EXECUTIVE SUMMARY ==========
  pdf.addPage();
  currentPage++;
  yPos = 18; // Compact header ends at ~16mm
  
  drawSectionHeader(t.executiveSummary);
  yPos += 3;
  
  // Parse insights
  const parsedInsights = data.insightsGroq ? parseInsights(data.insightsGroq) : {};
  
  // Executive Summary
  if (parsedInsights.resumo_executivo) {
    drawParagraph(String(parsedInsights.resumo_executivo));
  } else {
    const defaultSummary = t.executiveSummaryDefault
      .replace('{company}', data.companyName)
      .replace('{urls}', String(data.urls.length));
    drawParagraph(defaultSummary);
  }
  
  yPos += 3;
  
  // Company Registration Data
  drawSectionHeader(t.companyData);
  yPos += 3;
  
  const dadosEmpresa = (parsedInsights.dados_empresa as Record<string, unknown>) || {};
  
  // Info box with company details - compact
  const boxHeight = 38;
  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(margin, yPos - 2, maxWidth, boxHeight, 2, 2, 'F');
  
  const col1X = margin + 4;
  const col2X = margin + maxWidth / 2;
  let infoY = yPos + 4;
  
  pdf.setFontSize(8);
  
  // Column 1
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(ELP_COLORS.navyBlue.r, ELP_COLORS.navyBlue.g, ELP_COLORS.navyBlue.b);
  pdf.text(t.company, col1X, infoY);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(ELP_COLORS.text.r, ELP_COLORS.text.g, ELP_COLORS.text.b);
  const razaoSocial = String(dadosEmpresa.razao_social || data.companyName);
  pdf.text(razaoSocial.substring(0, 40), col1X + 22, infoY);
  
  infoY += 6;
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(ELP_COLORS.navyBlue.r, ELP_COLORS.navyBlue.g, ELP_COLORS.navyBlue.b);
  pdf.text(t.registration, col1X, infoY);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(ELP_COLORS.text.r, ELP_COLORS.text.g, ELP_COLORS.text.b);
  pdf.text(String(dadosEmpresa.cnpj_registro || t.notIdentified), col1X + 30, infoY);
  
  infoY += 6;
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(ELP_COLORS.navyBlue.r, ELP_COLORS.navyBlue.g, ELP_COLORS.navyBlue.b);
  pdf.text(t.address, col1X, infoY);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(ELP_COLORS.text.r, ELP_COLORS.text.g, ELP_COLORS.text.b);
  const endereco = String(dadosEmpresa.endereco || t.notIdentified);
  const enderecoTrunc = endereco.length > 35 ? endereco.substring(0, 32) + '...' : endereco;
  pdf.text(enderecoTrunc, col1X + 22, infoY);
  
  // Column 2
  infoY = yPos + 4;
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(ELP_COLORS.navyBlue.r, ELP_COLORS.navyBlue.g, ELP_COLORS.navyBlue.b);
  pdf.text(t.country, col2X, infoY);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(ELP_COLORS.text.r, ELP_COLORS.text.g, ELP_COLORS.text.b);
  pdf.text(data.country, col2X + 15, infoY);
  
  infoY += 6;
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(ELP_COLORS.navyBlue.r, ELP_COLORS.navyBlue.g, ELP_COLORS.navyBlue.b);
  pdf.text(t.phones, col2X, infoY);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(ELP_COLORS.text.r, ELP_COLORS.text.g, ELP_COLORS.text.b);
  const telefones = Array.isArray(dadosEmpresa.telefones) ? dadosEmpresa.telefones.slice(0, 2).join(', ') : t.notIdentified;
  pdf.text(telefones.substring(0, 25), col2X + 22, infoY);
  
  infoY += 6;
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(ELP_COLORS.navyBlue.r, ELP_COLORS.navyBlue.g, ELP_COLORS.navyBlue.b);
  pdf.text(t.website, col2X, infoY);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(ELP_COLORS.text.r, ELP_COLORS.text.g, ELP_COLORS.text.b);
  const website = String(dadosEmpresa.website || t.notIdentified);
  pdf.text(website.substring(0, 30), col2X + 18, infoY);
  
  yPos += boxHeight + 4;
  
  // Directors / Leadership Section
  drawSectionHeader(t.directorsLeadership);
  yPos += 2;
  
  const diretoria = parsedInsights.diretoria as Array<{ nome: string; cargo: string; linkedin?: string }> | undefined;
  if (diretoria && Array.isArray(diretoria) && diretoria.length > 0) {
    for (const dir of diretoria.slice(0, 6)) {
      checkPageBreak(9);
      
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(margin, yPos - 2, maxWidth, 8, 1, 1, 'F');
      
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(ELP_COLORS.navyBlue.r, ELP_COLORS.navyBlue.g, ELP_COLORS.navyBlue.b);
      const nome = sanitizeText(dir.nome || '').substring(0, 30);
      pdf.text(nome, margin + 3, yPos + 3);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(ELP_COLORS.text.r, ELP_COLORS.text.g, ELP_COLORS.text.b);
      const cargo = sanitizeText(dir.cargo || '').substring(0, 35);
      pdf.text(cargo, margin + 60, yPos + 3);
      
      if (dir.linkedin) {
        pdf.setTextColor(ELP_COLORS.accent.r, ELP_COLORS.accent.g, ELP_COLORS.accent.b);
        pdf.setFontSize(7);
        pdf.text('[LinkedIn]', pageWidth - margin - 20, yPos + 3);
      }
      
      yPos += 9;
    }
  } else {
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(ELP_COLORS.textLight.r, ELP_COLORS.textLight.g, ELP_COLORS.textLight.b);
    pdf.text(t.directorInfo, margin, yPos);
    yPos += 6;
  }
  yPos += 2;
  
  // Company Profile
  if (parsedInsights.perfil_empresa) {
    drawSubsection(t.companyProfile);
    drawParagraph(String(parsedInsights.perfil_empresa));
  }
  
  // Sources chart - compact
  yPos += 3;
  drawSubsection(t.sourcesConsulted);
  yPos += 1;
  
  // Draw sources as a visual chart
  const sourceData = [
    { label: 'Official', value: Math.min(data.urls.filter(u => u.source === 'official').length || 1, 5), color: ELP_COLORS.navyBlue },
    { label: 'LinkedIn', value: Math.min(data.urls.filter(u => u.source === 'linkedin').length || 1, 3), color: ELP_COLORS.accent },
    { label: 'News', value: Math.min(data.urls.filter(u => u.source === 'news').length || 2, 4), color: ELP_COLORS.success },
    { label: 'Other', value: Math.min(data.urls.filter(u => !['official', 'linkedin', 'news'].includes(u.source)).length || 2, 4), color: ELP_COLORS.warning },
  ];
  
  drawBarChart(pdf, margin, yPos, maxWidth, 42, sourceData, t.sourcesConsulted);
  yPos += 46;
  
  // List sources - compact
  drawSubsection(t.urlsAnalyzed);
  const urlList = data.urls.slice(0, 10).map(u => {
    const title = (u.title || u.url).substring(0, 60);
    return `${title} (${u.source || 'web'})`;
  });
  drawBulletList(urlList);
  
  // ========== PAGE 3: MARKET ANALYSIS ==========
  pdf.addPage();
  currentPage++;
  yPos = 18;
  
  drawSectionHeader(t.marketAnalysis);
  yPos += 3;
  
  // Market Overview
  drawSubsection(t.marketOverview);
  const marketOverviewText = t.marketOverviewDefault
    .replace('{company}', data.companyName)
    .replace('{industry}', data.industry || 'industrial')
    .replace('{urls}', String(data.urls.length));
  drawParagraph(marketOverviewText);
  
  // Marketing Strategies
  if (parsedInsights.estrategias_marketing && Array.isArray(parsedInsights.estrategias_marketing)) {
    drawSubsection(t.marketingStrategies);
    drawBulletList(parsedInsights.estrategias_marketing.map(String));
  } else {
    drawSubsection(t.marketingStrategies);
    drawBulletList([t.ms1, t.ms2, t.ms3, t.ms4]);
  }
  
  // Products and Prices - compact
  if (parsedInsights.precos_produtos && Array.isArray(parsedInsights.precos_produtos)) {
    drawSubsection(t.productsServices);
    
    const products = parsedInsights.precos_produtos as Array<{ produto: string; preco: string }>;
    
    for (const prod of products.slice(0, 8)) {
      checkPageBreak(6);
      
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(margin, yPos - 2, maxWidth, 6, 1, 1, 'F');
      
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(ELP_COLORS.navyBlue.r, ELP_COLORS.navyBlue.g, ELP_COLORS.navyBlue.b);
      const produto = sanitizeText(prod.produto || '').substring(0, 50);
      pdf.text(produto, margin + 2, yPos + 2);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(ELP_COLORS.text.r, ELP_COLORS.text.g, ELP_COLORS.text.b);
      const preco = sanitizeText(prod.preco || 'N/D').substring(0, 20);
      pdf.text(preco, pageWidth - margin - 2, yPos + 2, { align: 'right' });
      
      yPos += 7;
    }
    yPos += 3;
  }
  
  // Competitive Differentials
  if (parsedInsights.oportunidades_diferencial && Array.isArray(parsedInsights.oportunidades_diferencial)) {
    drawSubsection(t.competitiveDifferentials);
    drawBulletList(parsedInsights.oportunidades_diferencial.map(String));
  }
  
  // SWOT-like analysis - compact
  yPos += 4;
  checkPageBreak(45);
  
  // Strengths
  if (parsedInsights.pontos_fortes && Array.isArray(parsedInsights.pontos_fortes)) {
    pdf.setFillColor(34, 197, 94);
    pdf.roundedRect(margin, yPos, maxWidth / 2 - 5, 7, 2, 2, 'F');
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text(t.strengths, margin + 3, yPos + 4.5);
    
    yPos += 8;
    const strengths = (parsedInsights.pontos_fortes as string[]).slice(0, 4);
    drawBulletList(strengths);
  }
  
  // Weaknesses
  if (parsedInsights.pontos_fracos && Array.isArray(parsedInsights.pontos_fracos)) {
    pdf.setFillColor(239, 68, 68);
    pdf.roundedRect(margin, yPos, maxWidth / 2 - 5, 7, 2, 2, 'F');
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text(t.weaknesses, margin + 3, yPos + 4.5);
    
    yPos += 8;
    const weaknesses = (parsedInsights.pontos_fracos as string[]).slice(0, 4);
    drawBulletList(weaknesses);
  }
  
  // Customer Complaints
  if (parsedInsights.reclamacoes_clientes && Array.isArray(parsedInsights.reclamacoes_clientes)) {
    drawSubsection(t.customerFeedback);
    drawBulletList(parsedInsights.reclamacoes_clientes.map(String));
  }
  
  // ========== PAGE 4: STRATEGIC RECOMMENDATIONS ==========
  pdf.addPage();
  currentPage++;
  yPos = 18;
  
  drawSectionHeader('Validação e Recomendações Estratégicas');
  yPos += 3;
  
  // Gemini complementary analysis - with table support
  if (data.complementoGemini) {
    // Check if content contains markdown tables
    if (containsMarkdownTable(data.complementoGemini)) {
      processMarkdownContent(data.complementoGemini);
    } else {
      // Fallback to simple text processing
      const geminiClean = sanitizeText(data.complementoGemini);
      const geminiParagraphs = geminiClean.split('\n\n').filter(p => p.trim());
      
      for (const paragraph of geminiParagraphs) {
        if (paragraph.trim().length < 10) continue;
        
        // Check if it looks like a header
        if (paragraph.length < 60 && !paragraph.includes('.')) {
          drawSubsection(paragraph.trim());
        } else {
          drawParagraph(paragraph);
        }
      }
    }
  } else {
    drawSubsection('Análise de Viabilidade');
    drawParagraph('Com base nos dados coletados, recomendamos uma avaliação criteriosa antes de avançar com parcerias estratégicas. A validação cruzada com outras fontes é fundamental para decisões de alto impacto.');
  }
  
  // Recommendations chart - compact
  yPos += 5;
  checkPageBreak(45);
  
  const recommendationData = [
    { label: 'Viabilida.', value: 75, color: ELP_COLORS.success },
    { label: 'Risco', value: 35, color: ELP_COLORS.danger },
    { label: 'Potencial', value: 85, color: ELP_COLORS.accent },
    { label: 'Alinhamen.', value: 70, color: ELP_COLORS.navyBlue },
  ];
  
  drawBarChart(pdf, margin, yPos, maxWidth, 42, recommendationData, 'Indicadores de Avaliação (Estimativa)');
  yPos += 48;
  
  // Next Steps box - compact
  checkPageBreak(28);
  
  pdf.setFillColor(ELP_COLORS.navyLight.r, ELP_COLORS.navyLight.g, ELP_COLORS.navyLight.b);
  pdf.roundedRect(margin, yPos, maxWidth, 25, 2, 2, 'F');
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(ELP_COLORS.white.r, ELP_COLORS.white.g, ELP_COLORS.white.b);
  pdf.text('PRÓXIMOS PASSOS RECOMENDADOS', margin + 4, yPos + 5);
  
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  pdf.text('1. Agendar reunião de apresentação com stakeholders internos', margin + 4, yPos + 11);
  pdf.text('2. Realizar due diligence complementar (financeira e reputacional)', margin + 4, yPos + 16);
  pdf.text('3. Preparar proposta preliminar de parceria ou negociação', margin + 4, yPos + 21);
  
  yPos += 30;
  
  // ========== PAGE 5: DETAILED ANALYSIS ==========
  pdf.addPage();
  currentPage++;
  yPos = 18;
  
  drawSectionHeader('Análise Detalhada de Informações');
  yPos += 3;
  
  // Business Profile Deep Dive
  drawSubsection('Perfil Empresarial Detalhado');
  if (parsedInsights.perfil_empresa) {
    drawParagraph(String(parsedInsights.perfil_empresa));
  } else {
    drawParagraph(`A empresa ${data.companyName} está localizada em ${data.country} e opera no setor ${data.industry || 'industrial/tecnológico'}. A análise de fontes públicas indica uma estrutura organizacional estabelecida com presença online documentada.`);
  }
  
  // Industry Analysis
  drawSubsection('Análise do Setor de Atuação');
  drawParagraph(`O setor ${data.industry || 'de atuação da empresa'} apresenta características específicas que impactam diretamente as oportunidades de parceria. Fatores como regulamentação, barreiras de entrada, e dinâmica competitiva foram considerados na análise.`);
  
  // Geographic Analysis
  drawSubsection('Análise Geográfica e Regional');
  drawParagraph(`O mercado de ${data.country} possui características únicas que influenciam o ambiente de negócios. Aspectos como infraestrutura logística, ambiente regulatório, e maturidade do mercado são fatores relevantes para considerar em qualquer iniciativa de expansão ou parceria.`);
  
  // Market Positioning Box - compact
  yPos += 2;
  checkPageBreak(26);
  
  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(margin, yPos, maxWidth, 24, 2, 2, 'F');
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(ELP_COLORS.navyBlue.r, ELP_COLORS.navyBlue.g, ELP_COLORS.navyBlue.b);
  pdf.text('POSICIONAMENTO DE MERCADO', margin + 4, yPos + 5);
  
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(ELP_COLORS.text.r, ELP_COLORS.text.g, ELP_COLORS.text.b);
  
  const positioningItems = [
    `Segmento: ${(data.industry || 'Indústria/Tecnologia').substring(0, 25)} | Região: ${data.country}`,
    `Canais: Website, LinkedIn, Mídia Especializada | Fontes: ${data.urls.length} URLs`,
    `Análise: ${data.generatedAt}`
  ];
  
  let posY = yPos + 10;
  for (const item of positioningItems) {
    pdf.text(`• ${item}`, margin + 6, posY);
    posY += 4.5;
  }
  
  yPos += 26;
  
  // Reputation Analysis
  drawSubsection('Análise de Reputação e Presença Online');
  drawParagraph(`A presença digital da empresa foi analisada através de múltiplas fontes, incluindo website oficial, perfis profissionais, e menções em veículos de imprensa. Esta análise multicanal permite uma visão mais completa da reputação corporativa.`);
  
  // Strategic Opportunities
  drawSubsection('Oportunidades Estratégicas Identificadas');
  const opportunitiesList = [
    'Potencial de parceria em projetos de sustentabilidade e economia circular',
    'Complementaridade de competências técnicas e comerciais',
    'Acesso a novos mercados e canais de distribuição',
    'Compartilhamento de tecnologias e know-how setorial',
    'Fortalecimento de posicionamento ESG conjunto'
  ];
  drawBulletList(opportunitiesList);
  
  // Technology Assessment
  if (parsedInsights.tecnologias_usadas || parsedInsights.infraestrutura) {
    drawSubsection('Infraestrutura Tecnológica');
    if (parsedInsights.tecnologias_usadas && Array.isArray(parsedInsights.tecnologias_usadas)) {
      drawBulletList(parsedInsights.tecnologias_usadas.map(String));
    } else if (parsedInsights.infraestrutura) {
      drawParagraph(String(parsedInsights.infraestrutura));
    }
  }
  
  // Key Success Factors
  drawSubsection('Fatores Críticos de Sucesso');
  const successFactors = [
    'Alinhamento estratégico entre as partes envolvidas',
    'Definição clara de responsabilidades e governança',
    'Capacidade de execução e entrega de resultados',
    'Flexibilidade para adaptação às condições de mercado'
  ];
  drawBulletList(successFactors);
  
  // ========== PAGE 6: DUE DILIGENCE & COMPLIANCE (FULL PAGE) ==========
  pdf.addPage();
  currentPage++;
  yPos = 18;
  
  drawSectionHeader('Due Diligence e Compliance');
  yPos += 5;
  
  // Introduction paragraph
  drawParagraph(`A due diligence é um processo essencial para avaliar riscos e oportunidades antes de estabelecer parcerias comerciais. Esta seção apresenta os principais pontos de verificação recomendados para ${data.companyName}.`);
  yPos += 3;
  
  // Due Diligence Checklist - Expanded
  drawSubsection('Checklist de Due Diligence');
  yPos += 2;
  
  const dueDiligenceItems = [
    'Verificação de registro empresarial e situação cadastral',
    'Análise de histórico de litígios e processos judiciais',
    'Avaliação de reputação em órgãos de proteção ao consumidor',
    'Verificação de certidões negativas fiscais e trabalhistas',
    'Análise de estrutura societária e beneficiários finais',
    'Revisão de compliance com regulamentações setoriais',
    'Avaliação de políticas de ESG e sustentabilidade',
    'Verificação de sanções internacionais (OFAC, EU, ONU)',
    'Análise de balanços e demonstrações financeiras',
    'Verificação de referências comerciais e bancárias'
  ];
  
  for (const item of dueDiligenceItems) {
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(margin, yPos - 1, maxWidth, 7, 1, 1, 'F');
    
    // Checkbox symbol
    pdf.setDrawColor(ELP_COLORS.navyBlue.r, ELP_COLORS.navyBlue.g, ELP_COLORS.navyBlue.b);
    pdf.setLineWidth(0.3);
    pdf.rect(margin + 2, yPos, 4, 4, 'S');
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(ELP_COLORS.text.r, ELP_COLORS.text.g, ELP_COLORS.text.b);
    pdf.text(item, margin + 10, yPos + 3);
    
    yPos += 8;
  }
  
  yPos += 8;
  
  // Risk Assessment - Expanded with more details
  drawSubsection('Avaliação de Riscos Identificados');
  yPos += 3;
  
  const riskCategories = [
    { category: 'Risco Reputacional', level: 'Baixo', color: ELP_COLORS.success, desc: 'Imagem pública positiva' },
    { category: 'Risco Financeiro', level: 'Médio', color: ELP_COLORS.warning, desc: 'Requer análise detalhada' },
    { category: 'Risco Operacional', level: 'Baixo', color: ELP_COLORS.success, desc: 'Estrutura consolidada' },
    { category: 'Risco Regulatório', level: 'Médio', color: ELP_COLORS.warning, desc: 'Setor com regulação' },
    { category: 'Risco de Compliance', level: 'A Verificar', color: ELP_COLORS.textLight, desc: 'Pendente verificação' },
    { category: 'Risco Cambial', level: 'Baixo', color: ELP_COLORS.success, desc: 'Operação local' }
  ];
  
  for (const risk of riskCategories) {
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(margin, yPos - 1, maxWidth, 8, 1, 1, 'F');
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(ELP_COLORS.navyBlue.r, ELP_COLORS.navyBlue.g, ELP_COLORS.navyBlue.b);
    pdf.text(risk.category, margin + 3, yPos + 3);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(ELP_COLORS.textLight.r, ELP_COLORS.textLight.g, ELP_COLORS.textLight.b);
    pdf.setFontSize(7);
    pdf.text(risk.desc, margin + 55, yPos + 3);
    
    pdf.setFillColor(risk.color.r, risk.color.g, risk.color.b);
    pdf.roundedRect(pageWidth - margin - 30, yPos, 27, 6, 1, 1, 'F');
    
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text(risk.level, pageWidth - margin - 16.5, yPos + 4, { align: 'center' });
    
    yPos += 9;
  }
  
  yPos += 8;
  
  // Compliance Framework - Expanded
  drawSubsection('Framework de Compliance Recomendado');
  drawParagraph(`Para parcerias estratégicas com ${data.companyName}, recomendamos a aplicação de um framework de compliance abrangente:`);
  
  const complianceItems = [
    'KYC (Know Your Customer): Identificação completa de stakeholders',
    'AML (Anti-Money Laundering): Verificação de origem de recursos',
    'ESG Due Diligence: Avaliação de práticas ambientais e sociais',
    'FCPA/Lei Anticorrupção: Conformidade com legislação anticorrupção'
  ];
  drawBulletList(complianceItems);
  
  // ========== PAGE 7: SOURCES & STATISTICS (FULL PAGE) ==========
  pdf.addPage();
  currentPage++;
  yPos = 18;
  
  drawSectionHeader('Fontes Consultadas e Estatísticas');
  yPos += 5;
  
  // Introduction
  drawParagraph(`Esta seção detalha as ${data.urls.length} fontes públicas consultadas durante a análise de ${data.companyName}, incluindo websites oficiais, perfis profissionais e menções em veículos de comunicação.`);
  yPos += 3;
  
  // URL Details Section - Full listing
  drawSubsection('Detalhamento Completo das Fontes');
  yPos += 2;
  
  for (let i = 0; i < Math.min(data.urls.length, 15); i++) {
    const url = data.urls[i];
    
    pdf.setFillColor(i % 2 === 0 ? 248 : 255, i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 252 : 255);
    pdf.roundedRect(margin, yPos - 1, maxWidth, 9, 1, 1, 'F');
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(ELP_COLORS.navyBlue.r, ELP_COLORS.navyBlue.g, ELP_COLORS.navyBlue.b);
    pdf.text(`${i + 1}. ${(url.title || 'Fonte').substring(0, 50)}`, margin + 3, yPos + 3);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(ELP_COLORS.textLight.r, ELP_COLORS.textLight.g, ELP_COLORS.textLight.b);
    pdf.setFontSize(6);
    const truncatedUrl = url.url.length > 70 ? url.url.substring(0, 67) + '...' : url.url;
    pdf.text(truncatedUrl, margin + 3, yPos + 6.5);
    
    yPos += 10;
  }
  
  yPos += 8;
  
  // Summary Statistics Box - Expanded
  pdf.setFillColor(ELP_COLORS.navyLight.r, ELP_COLORS.navyLight.g, ELP_COLORS.navyLight.b);
  pdf.roundedRect(margin, yPos, maxWidth, 35, 2, 2, 'F');
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(ELP_COLORS.white.r, ELP_COLORS.white.g, ELP_COLORS.white.b);
  pdf.text('RESUMO ESTATÍSTICO DA ANÁLISE', margin + 4, yPos + 7);
  
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  
  const rawContent = sanitizeText(data.rawMarkdown);
  const additionalSections = rawContent.split('\n\n').filter(section => {
    const trimmed = section.trim();
    return trimmed.length > 50 && 
           !trimmed.includes('Relatório de Inteligência') &&
           !trimmed.includes('ELP Green Technology') &&
           !trimmed.includes('Departamento de Inteligência');
  });
  
  pdf.text(`• Total de URLs analisadas: ${data.urls.length}`, margin + 6, yPos + 14);
  pdf.text(`• Seções de conteúdo processadas: ${additionalSections.length + 10}`, margin + 6, yPos + 20);
  pdf.text(`• Data da análise: ${data.generatedAt}`, margin + 6, yPos + 26);
  
  const companyNameShort = data.companyName.substring(0, 40);
  pdf.text(`• Empresa analisada: ${companyNameShort}`, pageWidth / 2, yPos + 14);
  pdf.text(`• País: ${data.country}`, pageWidth / 2, yPos + 20);
  pdf.text(`• Setor: ${(data.industry || 'Indústria/Tecnologia').substring(0, 25)}`, pageWidth / 2, yPos + 26);
  
  // ========== FINAL PAGE: DISCLAIMER & METHODOLOGY (FULL PAGE) ==========
  pdf.addPage();
  currentPage++;
  yPos = 18;
  
  drawSectionHeader('Considerações Finais e Metodologia');
  yPos += 5;
  
  // Disclaimer Box - Expanded
  drawSubsection('Aviso Legal');
  yPos += 2;
  
  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(margin, yPos, maxWidth, 38, 2, 2, 'F');
  
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(ELP_COLORS.text.r, ELP_COLORS.text.g, ELP_COLORS.text.b);
  
  const summaryText = `Este relatório foi elaborado pelo Departamento de Inteligência Empresarial da ELP Green Technology utilizando exclusivamente fontes públicas da internet. As informações aqui contidas representam uma análise pontual baseada em dados disponíveis na data de geração e devem ser validadas com fontes adicionais antes de qualquer tomada de decisão comercial, financeira ou estratégica. A ELP Green Technology não se responsabiliza por decisões tomadas com base exclusivamente neste documento.`;
  
  const summaryLines = pdf.splitTextToSize(summaryText, maxWidth - 8);
  pdf.text(summaryLines, margin + 4, yPos + 6);
  
  yPos += 45;
  
  // Methodology - Expanded
  drawSubsection('Metodologia de Análise');
  yPos += 2;
  
  const methodologySteps = [
    '1. Descoberta Automática: Identificação de URLs relevantes via busca inteligente com SerpAPI',
    '2. Coleta de Dados: Extração de conteúdo estruturado das páginas via Jina Reader',
    '3. Análise Primária: Processamento semântico com modelo Llama 3.3 70B (Groq)',
    '4. Validação Cruzada: Complementação e verificação com Gemini 1.5 Flash',
    '5. Consolidação: Geração de insights estratégicos e recomendações'
  ];
  
  for (const step of methodologySteps) {
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(margin, yPos - 1, maxWidth, 8, 1, 1, 'F');
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(ELP_COLORS.text.r, ELP_COLORS.text.g, ELP_COLORS.text.b);
    pdf.text(step, margin + 4, yPos + 4);
    
    yPos += 10;
  }
  
  yPos += 10;
  
  // Data Quality Notice
  drawSubsection('Nota sobre Qualidade dos Dados');
  drawParagraph('A precisão das informações depende da disponibilidade e atualização das fontes públicas consultadas. Recomendamos verificação independente para dados críticos como informações financeiras, registros legais e referências comerciais.');
  
  yPos += 8;
  
  // Contact info - Full width
  pdf.setFillColor(ELP_COLORS.navyBlue.r, ELP_COLORS.navyBlue.g, ELP_COLORS.navyBlue.b);
  pdf.roundedRect(margin, yPos, maxWidth, 30, 2, 2, 'F');
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(ELP_COLORS.white.r, ELP_COLORS.white.g, ELP_COLORS.white.b);
  pdf.text('CONTATO', margin + 4, yPos + 7);
  
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('ELP Green Technology - Departamento de Inteligência Empresarial', margin + 4, yPos + 14);
  pdf.text('Website: www.elpgreen.com', margin + 4, yPos + 20);
  pdf.text('Email: contato@elpgreen.com', margin + 4, yPos + 26);
  pdf.text('Transformando resíduos em recursos sustentáveis', pageWidth / 2 + 20, yPos + 20);
  
  // ========== ADD HEADERS AND FOOTERS TO ALL PAGES ==========
  const totalPages = pdf.getNumberOfPages();
  
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    
    // Skip header on cover page
    if (i > 1) {
      addHeader();
    }
    
    addFooter(i, totalPages);
  }
  
  // Save PDF
  const filename = `relatorio-inteligencia-${data.companyName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`;
  pdf.save(filename);
}
