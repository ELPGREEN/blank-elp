// =============================================================================
// ANALYZE FEASIBILITY - Edge Function (Hybrid: Local + Gemini 7-Key Collaborative)
// Supports: 'local' (fast), 'flash' (single-key), 'pro' (detailed), 'collaborative' (7-key)
// =============================================================================

import "https://deno.land/std@0.168.0/dotenv/load.ts";

// ========== GEMINI 7-KEY POOL WITH COLLABORATIVE ANALYSIS ==========
const GEMINI_API_KEYS = [
  Deno.env.get('GEMINI_API_KEY'),
  Deno.env.get('GEMINI_API_KEY_2'),
  Deno.env.get('GEMINI_API_KEY_3'),
  Deno.env.get('GEMINI_API_KEY_4'),
  Deno.env.get('GEMINI_API_KEY_5'),
  Deno.env.get('GEMINI_API_KEY_6'),
  Deno.env.get('GEMINI_API_KEY_7'),
].filter(Boolean) as string[];

const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

let currentGeminiKeyIndex = 0;
const failedKeys = new Set<number>();
const failedKeyTimestamps = new Map<number, number>();
const KEY_COOLDOWN_MS = 60000;

// Track successful analyses per key for load balancing
const keySuccessCount = new Map<number, number>();

function getNextGeminiKey(): string | null {
  if (GEMINI_API_KEYS.length === 0) return null;
  const now = Date.now();
  for (const [idx, ts] of failedKeyTimestamps) {
    if (now - ts > KEY_COOLDOWN_MS) {
      failedKeys.delete(idx);
      failedKeyTimestamps.delete(idx);
    }
  }
  for (let i = 0; i < GEMINI_API_KEYS.length; i++) {
    const idx = (currentGeminiKeyIndex + i) % GEMINI_API_KEYS.length;
    if (!failedKeys.has(idx)) {
      currentGeminiKeyIndex = idx;
      return GEMINI_API_KEYS[idx];
    }
  }
  return GEMINI_API_KEYS[currentGeminiKeyIndex];
}

// Get a specific key by index for collaborative analysis
function getGeminiKeyByIndex(index: number): string | null {
  if (index < 0 || index >= GEMINI_API_KEYS.length) return null;
  if (failedKeys.has(index)) return null;
  return GEMINI_API_KEYS[index];
}

// Get multiple available keys for collaborative analysis
function getAvailableKeysForCollaboration(count: number): { key: string; index: number }[] {
  const available: { key: string; index: number }[] = [];
  const now = Date.now();
  
  // Clear expired cooldowns
  for (const [idx, ts] of failedKeyTimestamps) {
    if (now - ts > KEY_COOLDOWN_MS) {
      failedKeys.delete(idx);
      failedKeyTimestamps.delete(idx);
    }
  }
  
  // Collect available keys, prioritizing less-used ones
  const keyUsage = GEMINI_API_KEYS.map((key, idx) => ({
    key,
    index: idx,
    usage: keySuccessCount.get(idx) || 0,
    failed: failedKeys.has(idx)
  }))
  .filter(k => !k.failed)
  .sort((a, b) => a.usage - b.usage);
  
  return keyUsage.slice(0, count);
}

function rotateGeminiKey(markAsFailed = false): void {
  if (markAsFailed) {
    failedKeys.add(currentGeminiKeyIndex);
    failedKeyTimestamps.set(currentGeminiKeyIndex, Date.now());
    console.log(`⛔ Key ${currentGeminiKeyIndex + 1}/${GEMINI_API_KEYS.length} marked failed (60s cooldown)`);
  }
  if (GEMINI_API_KEYS.length > 1) {
    const old = currentGeminiKeyIndex;
    currentGeminiKeyIndex = (currentGeminiKeyIndex + 1) % GEMINI_API_KEYS.length;
    console.log(`🔄 Rotating key ${old + 1} → ${currentGeminiKeyIndex + 1} (${GEMINI_API_KEYS.length} total)`);
  }
}

function markKeySuccess(index: number): void {
  keySuccessCount.set(index, (keySuccessCount.get(index) || 0) + 1);
}

function getGeminiPoolStatus(): string {
  const available = GEMINI_API_KEYS.length - failedKeys.size;
  return `${available}/${GEMINI_API_KEYS.length} available`;
}

console.log(`Analyze Feasibility v4 - Gemini: ${GEMINI_API_KEYS.length}/7 keys, Firecrawl: ${FIRECRAWL_API_KEY ? '✅' : '❌'}, Groq: ${GROQ_API_KEY ? '✅' : '❌'}`);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// =============================================================================
// FIRECRAWL WEB SEARCH FOR REGULATIONS
// =============================================================================
async function searchRegulations(country: string, topic: string): Promise<string> {
  if (!FIRECRAWL_API_KEY) return '';
  try {
    const query = `${topic} legislação regulamentação ${country} 2024 2025`;
    console.log('Firecrawl searching regulations:', query);
    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, limit: 3, scrapeOptions: { formats: ['markdown'] } }),
    });
    if (!response.ok) return '';
    const data = await response.json();
    const results = data.data || [];
    const excerpts = results.map((r: any) => r.markdown?.substring(0, 400) || '').filter(Boolean);
    console.log('Firecrawl found', excerpts.length, 'regulation results');
    return excerpts.join('\n\n');
  } catch (e) { 
    console.error('Firecrawl error:', e);
    return ''; 
  }
}

// =============================================================================
// EXTERNAL API CALLER WITH TIMEOUT
// =============================================================================
async function callExternalAPI(
  url: string, 
  options: RequestInit, 
  timeoutMs = 45000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    throw error;
  }
}

// =============================================================================
// IN-MEMORY RATE LIMITER
// =============================================================================
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 30;
const rateMap = new Map<string, { count: number; windowStart: number }>();

function isRateLimited(clientKey: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(clientKey);
  
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateMap.set(clientKey, { count: 1, windowStart: now });
    return false;
  }
  
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    console.warn(`Rate limit exceeded for client: ${clientKey.substring(0, 20)}...`);
    return true;
  }
  
  entry.count += 1;
  return false;
}

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateMap.entries()) {
    if (now - value.windowStart > RATE_LIMIT_WINDOW_MS * 2) {
      rateMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

// =============================================================================
// PAYLOAD VALIDATION
// =============================================================================
function validateStudyPayload(study: unknown): { valid: boolean; error?: string } {
  if (!study || typeof study !== 'object') {
    return { valid: false, error: 'Study payload is required and must be an object' };
  }
  
  const s = study as Record<string, unknown>;
  
  if (!s.study_name || typeof s.study_name !== 'string') {
    return { valid: false, error: 'study_name is required and must be a string' };
  }
  
  const numericFields = [
    'daily_capacity_tons', 'operating_days_per_year', 'utilization_rate', 
    'total_investment', 'annual_revenue', 'annual_opex', 'annual_ebitda',
    'payback_months', 'roi_percentage', 'npv_10_years', 'irr_percentage',
    'rubber_granules_price', 'rubber_granules_yield', 'steel_wire_price',
    'steel_wire_yield', 'textile_fiber_price', 'textile_fiber_yield', 'tax_rate'
  ];
  
  for (const field of numericFields) {
    if (s[field] !== undefined && typeof s[field] !== 'number') {
      return { valid: false, error: `${field} must be a number if provided` };
    }
  }
  
  return { valid: true };
}

function safeNum(value: unknown, defaultValue = 0): number {
  return typeof value === 'number' && !isNaN(value) ? value : defaultValue;
}

interface FeasibilityStudy {
  study_name: string;
  location?: string;
  country?: string;
  daily_capacity_tons?: number;
  operating_days_per_year?: number;
  utilization_rate?: number;
  total_investment?: number;
  annual_revenue?: number;
  annual_opex?: number;
  annual_ebitda?: number;
  payback_months?: number;
  roi_percentage?: number;
  npv_10_years?: number;
  irr_percentage?: number;
  rubber_granules_price?: number;
  rubber_granules_yield?: number;
  steel_wire_price?: number;
  steel_wire_yield?: number;
  textile_fiber_price?: number;
  textile_fiber_yield?: number;
  rcb_price?: number;
  rcb_yield?: number;
  tax_rate?: number;
  discount_rate?: number;
  equipment_cost?: number;
  installation_cost?: number;
  infrastructure_cost?: number;
  working_capital?: number;
  labor_cost?: number;
  energy_cost?: number;
  maintenance_cost?: number;
  logistics_cost?: number;
  government_royalties_percent?: number;
  environmental_bonus_per_ton?: number;
  collection_model?: string;
}

interface CountryRegulation {
  agency: string;
  mainLaws: string[];
  environmentalRequirements: string[];
  taxIncentives: string[];
  licenses: string[];
  laborRegulations: string[];
}

// =============================================================================
// COUNTRY REGULATORY DATABASE (Abbreviated for edge function size)
// =============================================================================
const countryRegulations: Record<string, CountryRegulation> = {
  "Brazil": {
    agency: "IBAMA, CONAMA, Ministério do Meio Ambiente, Secretarias Estaduais",
    mainLaws: [
      "Política Nacional de Resíduos Sólidos (Lei 12.305/2010)",
      "Resolução CONAMA 416/2009 (Pneus)",
      "Lei de Crimes Ambientais (Lei 9.605/1998)",
      "Código Florestal (Lei 12.651/2012)"
    ],
    environmentalRequirements: [
      "Licença Prévia (LP), Licença de Instalação (LI), Licença de Operação (LO)",
      "Estudo de Impacto Ambiental (EIA/RIMA)",
      "Cadastro Técnico Federal (CTF/IBAMA)",
      "Plano de Gerenciamento de Resíduos Sólidos"
    ],
    taxIncentives: [
      "REIDI - Regime Especial de Incentivos para o Desenvolvimento da Infraestrutura",
      "Lei do Bem (Lei 11.196/2005) - Inovação Tecnológica",
      "Incentivos estaduais ICMS",
      "BNDES Finem - Financiamento ambiental"
    ],
    licenses: [
      "Licença Ambiental (LP/LI/LO)",
      "Alvará de Funcionamento",
      "CNPJ e Inscrição Estadual",
      "Cadastro CTF/IBAMA"
    ],
    laborRegulations: [
      "CLT - Consolidação das Leis do Trabalho",
      "NR-6 (EPIs), NR-12 (Máquinas), NR-25 (Resíduos)",
      "PCMSO e PPRA obrigatórios",
      "FGTS, INSS, férias, 13º salário"
    ]
  },
  "Australia": {
    agency: "EPA (State-based), Department of Climate Change, Energy, Environment and Water",
    mainLaws: [
      "Environment Protection and Biodiversity Conservation Act 1999",
      "National Environment Protection Measures (NEPMs)",
      "Product Stewardship Act 2011",
      "State-based EPA Acts"
    ],
    environmentalRequirements: [
      "Environmental Impact Statement (EIS)",
      "Development Approval from Local Council",
      "EPA License for waste processing",
      "Works Approval for construction"
    ],
    taxIncentives: [
      "Instant Asset Write-Off for eligible businesses",
      "R&D Tax Incentive (43.5% refundable offset)",
      "Clean Energy Finance Corporation loans",
      "State-based environmental grants"
    ],
    licenses: [
      "EPA License",
      "Development Approval",
      "ABN/ACN Registration",
      "WorkCover/SafeWork Registration"
    ],
    laborRegulations: [
      "Fair Work Act 2009",
      "Work Health and Safety Act 2011",
      "Superannuation Guarantee (11.5%)",
      "National Employment Standards"
    ]
  },
  "United States": {
    agency: "EPA, State DEQs, OSHA",
    mainLaws: [
      "Resource Conservation and Recovery Act (RCRA)",
      "Clean Air Act (CAA)",
      "Clean Water Act (CWA)",
      "State-specific scrap tire regulations"
    ],
    environmentalRequirements: [
      "RCRA Permit for solid waste processing",
      "Air Quality Permit (Title V or minor source)",
      "NPDES Permit for water discharge",
      "State-specific tire facility registration"
    ],
    taxIncentives: [
      "Section 179 deduction for equipment",
      "Bonus depreciation for qualified property",
      "State recycling tax credits",
      "EPA Brownfields grants"
    ],
    licenses: [
      "State Solid Waste Facility Permit",
      "Air Quality Operating Permit",
      "Business License",
      "EPA Generator ID Number"
    ],
    laborRegulations: [
      "OSHA General Industry Standards (29 CFR 1910)",
      "Fair Labor Standards Act (FLSA)",
      "Workers' Compensation Insurance",
      "State-specific safety requirements"
    ]
  },
  "Chile": {
    agency: "Ministerio del Medio Ambiente, Superintendencia del Medio Ambiente (SMA)",
    mainLaws: [
      "Ley 19.300 sobre Bases Generales del Medio Ambiente",
      "Ley REP 20.920 (Responsabilidad Extendida del Productor)",
      "Decreto Supremo 40/2012 (SEIA)",
      "Normas de calidad ambiental"
    ],
    environmentalRequirements: [
      "Evaluación de Impacto Ambiental (EIA) o Declaración (DIA)",
      "Resolución de Calificación Ambiental (RCA)",
      "Permiso sectorial sanitario",
      "Plan de manejo de residuos"
    ],
    taxIncentives: [
      "Ley de Donaciones con fines ambientales",
      "Depreciación acelerada de activos",
      "CORFO - Financiamiento verde",
      "Franquicias tributarias zonas extremas"
    ],
    licenses: [
      "RCA (Resolución de Calificación Ambiental)",
      "Patente municipal",
      "Autorización sanitaria",
      "Inscripción en SII"
    ],
    laborRegulations: [
      "Código del Trabajo",
      "Ley 16.744 (Accidentes del trabajo)",
      "AFP, Isapre/Fonasa obligatorios",
      "Normas de seguridad industrial"
    ]
  }
};

const defaultRegulations: CountryRegulation = {
  agency: "National Environmental Agency, Ministry of Environment",
  mainLaws: [
    "National Waste Management Act",
    "Environmental Protection Act",
    "Industrial Licensing Regulations",
    "End-of-life Tire Management Regulations"
  ],
  environmentalRequirements: [
    "Environmental Impact Assessment (EIA)",
    "Operating Permit/License",
    "Waste Management Plan",
    "Air Quality Monitoring"
  ],
  taxIncentives: [
    "Accelerated depreciation for green investments",
    "Tax credits for recycling equipment",
    "Regional development incentives",
    "Green financing options"
  ],
  licenses: [
    "Environmental Operating License",
    "Industrial Operating Permit",
    "Business Registration",
    "Waste Handler License"
  ],
  laborRegulations: [
    "National Labor Code",
    "Occupational Health & Safety regulations",
    "Personal Protective Equipment requirements",
    "Workers compensation insurance"
  ]
};

// =============================================================================
// LOCAL ANALYSIS GENERATOR (Template-Based)
// =============================================================================
interface AnalysisTexts {
  viabilityRating: string;
  viabilityJustification: string;
  strengths: string[];
  risks: string[];
  recommendations: string[];
  marketAnalysis: string;
  esgAnalysis: string;
}

function getViabilityRating(roi: number, irr: number, paybackMonths: number, npv: number): string {
  if (roi >= 30 && irr >= 25 && paybackMonths <= 36 && npv > 0) return "Excellent";
  if (roi >= 20 && irr >= 18 && paybackMonths <= 48 && npv > 0) return "Good";
  if (roi >= 12 && irr >= 12 && paybackMonths <= 60) return "Moderate";
  if (roi >= 5 && paybackMonths <= 84) return "Risky";
  return "Not Recommended";
}

function generateLocalAnalysis(
  study: FeasibilityStudy,
  metrics: {
    annualTonnage: number;
    ebitdaMargin: number;
    revenuePerTon: number;
    opexPerTon: number;
    rubberRevenue: number;
    steelRevenue: number;
    fiberRevenue: number;
  },
  regulations: CountryRegulation,
  language: string
): AnalysisTexts {
  const roi = safeNum(study.roi_percentage, 0);
  const irr = safeNum(study.irr_percentage, 0);
  const paybackMonths = safeNum(study.payback_months, 60);
  const npv = safeNum(study.npv_10_years, 0);
  const dailyCapacity = safeNum(study.daily_capacity_tons, 50);
  const totalInvestment = safeNum(study.total_investment, 5000000);
  const country = study.country || 'Unknown';
  
  const viabilityRating = getViabilityRating(roi, irr, paybackMonths, npv);
  
  // Language-specific templates
  const texts = language === 'pt' ? {
    viabilityRating,
    viabilityJustification: `O projeto "${study.study_name}" apresenta viabilidade **${viabilityRating}** com base nos indicadores financeiros analisados. Com ROI de ${roi.toFixed(1)}%, TIR de ${irr.toFixed(1)}% e payback de ${(paybackMonths/12).toFixed(1)} anos, o investimento de USD ${(totalInvestment/1000000).toFixed(2)}M demonstra ${viabilityRating === 'Excellent' || viabilityRating === 'Good' ? 'forte potencial de retorno' : 'necessidade de otimização'}. A margem EBITDA de ${metrics.ebitdaMargin.toFixed(1)}% ${metrics.ebitdaMargin >= 30 ? 'supera os padrões da indústria' : 'está dentro da média do setor'}.`,
    
    strengths: [
      `**Capacidade Produtiva**: ${dailyCapacity} toneladas/dia permite processar ${metrics.annualTonnage.toFixed(0)} toneladas/ano de pneus OTR`,
      `**Diversificação de Receita**: Granulado de borracha (${((metrics.rubberRevenue / (metrics.rubberRevenue + metrics.steelRevenue + metrics.fiberRevenue)) * 100).toFixed(0)}%), aço (${((metrics.steelRevenue / (metrics.rubberRevenue + metrics.steelRevenue + metrics.fiberRevenue)) * 100).toFixed(0)}%), fibra têxtil`,
      `**Receita por Tonelada**: USD ${metrics.revenuePerTon.toFixed(2)}/ton processada, com custo operacional de USD ${metrics.opexPerTon.toFixed(2)}/ton`,
      `**Tecnologia Smart Line**: Automação robótica reduz custos operacionais e aumenta segurança`,
      `**Modelo de Parceria ELP/TOPS**: Acesso a tecnologia de ponta sem investimento em P&D`,
      `**Impacto Ambiental Positivo**: Reciclagem de ${metrics.annualTonnage.toFixed(0)} toneladas/ano de resíduos`,
      roi >= 20 ? `**ROI Atrativo**: ${roi.toFixed(1)}% supera custo de capital típico` : `**Potencial de Otimização**: ROI de ${roi.toFixed(1)}% pode ser melhorado`,
      npv > 0 ? `**VPL Positivo**: USD ${(npv/1000000).toFixed(2)}M indica criação de valor` : `**Atenção ao VPL**: Revisar premissas financeiras`,
      `**Mercado em Crescimento**: Demanda global por borracha reciclada em expansão`,
      `**Incentivos Fiscais**: ${regulations.taxIncentives[0]}`
    ],
    
    risks: [
      `**Risco Regulatório**: Processo de licenciamento em ${country} pode levar 6-18 meses (${regulations.licenses.join(', ')})`,
      `**Volatilidade de Preços**: Preços de commodities recicladas sujeitos a flutuações de mercado`,
      `**Dependência de Fornecimento**: Necessidade de garantir fonte estável de pneus OTR`,
      `**Risco Operacional**: Manutenção de equipamentos especializados requer técnicos qualificados`,
      `**Risco Cambial**: Investimento em USD sujeito a variações cambiais`,
      metrics.ebitdaMargin < 25 ? `**Margem Operacional**: EBITDA de ${metrics.ebitdaMargin.toFixed(1)}% requer controle rigoroso de custos` : `**Gestão de Custos**: Manter margem EBITDA de ${metrics.ebitdaMargin.toFixed(1)}%`
    ],
    
    recommendations: [
      `**Fase 1 - Licenciamento** (0-6 meses): Iniciar processo de ${regulations.licenses[0]} junto a ${regulations.agency}`,
      `**Fase 2 - Engenharia** (3-9 meses): Projeto executivo e contratação de fornecedores`,
      `**Fase 3 - Construção** (6-15 meses): Instalação de infraestrutura e equipamentos Smart Line`,
      `**Fase 4 - Comissionamento** (12-18 meses): Testes operacionais e início de produção`,
      `**Contratos de Fornecimento**: Firmar acordos com mineradoras e portos para garantir ${metrics.annualTonnage.toFixed(0)} ton/ano`,
      `**Off-take Agreements**: Negociar contratos de venda de granulado com compradores locais e internacionais`,
      `**Incentivos**: Solicitar ${regulations.taxIncentives[0]} para reduzir carga tributária`,
      `**Treinamento**: Capacitar equipe nas normas ${regulations.laborRegulations[0]}`
    ],
    
    marketAnalysis: `O mercado de reciclagem de pneus OTR em ${country} apresenta oportunidades significativas devido à demanda crescente por materiais reciclados e às regulamentações ambientais cada vez mais rigorosas. A localização em ${study.location || country} oferece acesso a fontes de pneus OTR de operações de mineração e portos. O preço médio de granulado de borracha de USD ${safeNum(study.rubber_granules_price, 350)}/ton e aço recuperado de USD ${safeNum(study.steel_wire_price, 200)}/ton são competitivos no mercado regional.`,
    
    esgAnalysis: `O projeto demonstra forte alinhamento com os Objetivos de Desenvolvimento Sustentável (ODS): **ODS 12** (Produção Responsável) através da reciclagem de ${metrics.annualTonnage.toFixed(0)} toneladas/ano; **ODS 13** (Ação Climática) pela redução de emissões vs. disposição em aterros; **ODS 9** (Indústria e Inovação) via tecnologia Smart Line. O rating ESG estimado é **A-** com potencial para créditos de carbono.`
    
  } : language === 'es' ? {
    viabilityRating,
    viabilityJustification: `El proyecto "${study.study_name}" presenta viabilidad **${viabilityRating}** basada en los indicadores financieros analizados. Con ROI de ${roi.toFixed(1)}%, TIR de ${irr.toFixed(1)}% y payback de ${(paybackMonths/12).toFixed(1)} años, la inversión de USD ${(totalInvestment/1000000).toFixed(2)}M demuestra ${viabilityRating === 'Excellent' || viabilityRating === 'Good' ? 'fuerte potencial de retorno' : 'necesidad de optimización'}. El margen EBITDA de ${metrics.ebitdaMargin.toFixed(1)}% ${metrics.ebitdaMargin >= 30 ? 'supera los estándares de la industria' : 'está dentro del promedio del sector'}.`,
    
    strengths: [
      `**Capacidad Productiva**: ${dailyCapacity} toneladas/día permite procesar ${metrics.annualTonnage.toFixed(0)} toneladas/año de neumáticos OTR`,
      `**Diversificación de Ingresos**: Granulado de caucho (${((metrics.rubberRevenue / (metrics.rubberRevenue + metrics.steelRevenue + metrics.fiberRevenue)) * 100).toFixed(0)}%), acero (${((metrics.steelRevenue / (metrics.rubberRevenue + metrics.steelRevenue + metrics.fiberRevenue)) * 100).toFixed(0)}%), fibra textil`,
      `**Ingreso por Tonelada**: USD ${metrics.revenuePerTon.toFixed(2)}/ton procesada, con costo operativo de USD ${metrics.opexPerTon.toFixed(2)}/ton`,
      `**Tecnología Smart Line**: Automatización robótica reduce costos operativos y aumenta seguridad`,
      `**Modelo de Asociación ELP/TOPS**: Acceso a tecnología de punta sin inversión en I+D`,
      `**Impacto Ambiental Positivo**: Reciclaje de ${metrics.annualTonnage.toFixed(0)} toneladas/año de residuos`,
      roi >= 20 ? `**ROI Atractivo**: ${roi.toFixed(1)}% supera costo de capital típico` : `**Potencial de Optimización**: ROI de ${roi.toFixed(1)}% puede mejorarse`,
      npv > 0 ? `**VPN Positivo**: USD ${(npv/1000000).toFixed(2)}M indica creación de valor` : `**Atención al VPN**: Revisar premisas financieras`,
      `**Mercado en Crecimiento**: Demanda global de caucho reciclado en expansión`,
      `**Incentivos Fiscales**: ${regulations.taxIncentives[0]}`
    ],
    
    risks: [
      `**Riesgo Regulatorio**: Proceso de licenciamiento en ${country} puede tomar 6-18 meses`,
      `**Volatilidad de Precios**: Precios de commodities recicladas sujetos a fluctuaciones`,
      `**Dependencia de Suministro**: Necesidad de garantizar fuente estable de neumáticos OTR`,
      `**Riesgo Operacional**: Mantenimiento de equipos especializados requiere técnicos calificados`,
      `**Riesgo Cambiario**: Inversión en USD sujeta a variaciones cambiarias`,
      metrics.ebitdaMargin < 25 ? `**Margen Operacional**: EBITDA de ${metrics.ebitdaMargin.toFixed(1)}% requiere control riguroso de costos` : `**Gestión de Costos**: Mantener margen EBITDA de ${metrics.ebitdaMargin.toFixed(1)}%`
    ],
    
    recommendations: [
      `**Fase 1 - Licenciamiento** (0-6 meses): Iniciar proceso con ${regulations.agency}`,
      `**Fase 2 - Ingeniería** (3-9 meses): Proyecto ejecutivo y contratación de proveedores`,
      `**Fase 3 - Construcción** (6-15 meses): Instalación de infraestructura y equipos Smart Line`,
      `**Fase 4 - Comisionamiento** (12-18 meses): Pruebas operacionales e inicio de producción`,
      `**Contratos de Suministro**: Firmar acuerdos con mineras y puertos`,
      `**Off-take Agreements**: Negociar contratos de venta de granulado`,
      `**Incentivos**: Solicitar ${regulations.taxIncentives[0]}`,
      `**Capacitación**: Entrenar equipo en normativas locales`
    ],
    
    marketAnalysis: `El mercado de reciclaje de neumáticos OTR en ${country} presenta oportunidades significativas debido a la demanda creciente de materiales reciclados y regulaciones ambientales cada vez más estrictas. La ubicación en ${study.location || country} ofrece acceso a fuentes de neumáticos OTR de operaciones mineras y puertos.`,
    
    esgAnalysis: `El proyecto demuestra fuerte alineación con los Objetivos de Desarrollo Sostenible (ODS): **ODS 12** (Producción Responsable), **ODS 13** (Acción Climática), **ODS 9** (Industria e Innovación). Rating ESG estimado: **A-**.`
    
  } : language === 'zh' ? {
    // Chinese (Simplified)
    viabilityRating,
    viabilityJustification: `项目"${study.study_name}"根据财务指标分析展示了**${viabilityRating}**级别的可行性。投资回报率为${roi.toFixed(1)}%，内部收益率为${irr.toFixed(1)}%，回收期为${(paybackMonths/12).toFixed(1)}年，${(totalInvestment/1000000).toFixed(2)}百万美元的投资显示${viabilityRating === 'Excellent' || viabilityRating === 'Good' ? '强劲的回报潜力' : '需要优化'}。息税折旧摊销前利润率为${metrics.ebitdaMargin.toFixed(1)}%，${metrics.ebitdaMargin >= 30 ? '超过行业标准' : '处于行业平均水平'}。`,
    
    strengths: [
      `**生产能力**：日处理${dailyCapacity}吨，年处理${metrics.annualTonnage.toFixed(0)}吨OTR轮胎`,
      `**收入多元化**：橡胶颗粒(${((metrics.rubberRevenue / (metrics.rubberRevenue + metrics.steelRevenue + metrics.fiberRevenue)) * 100).toFixed(0)}%)、钢丝(${((metrics.steelRevenue / (metrics.rubberRevenue + metrics.steelRevenue + metrics.fiberRevenue)) * 100).toFixed(0)}%)、纺织纤维`,
      `**每吨收入**：每吨加工收入${metrics.revenuePerTon.toFixed(2)}美元，运营成本${metrics.opexPerTon.toFixed(2)}美元/吨`,
      `**Smart Line技术**：机器人自动化降低运营成本并提高安全性`,
      `**ELP/TOPS合作模式**：无需研发投资即可获得尖端技术`,
      `**积极环境影响**：每年回收${metrics.annualTonnage.toFixed(0)}吨废弃物`,
      roi >= 20 ? `**投资回报率吸引**：${roi.toFixed(1)}%超过典型资本成本` : `**优化潜力**：${roi.toFixed(1)}%的投资回报率可以改进`,
      npv > 0 ? `**正净现值**：${(npv/1000000).toFixed(2)}百万美元表明价值创造` : `**净现值关注**：审查财务假设`,
      `**市场增长**：全球再生橡胶需求扩大`,
      `**税收优惠**：${regulations.taxIncentives[0]}`
    ],
    
    risks: [
      `**监管风险**：${country}的许可证审批可能需要6-18个月`,
      `**价格波动**：再生商品价格受市场波动影响`,
      `**供应依赖**：需要确保稳定的OTR轮胎来源`,
      `**运营风险**：专业设备维护需要合格技术人员`,
      `**汇率风险**：美元投资受汇率变动影响`,
      metrics.ebitdaMargin < 25 ? `**运营利润率**：${metrics.ebitdaMargin.toFixed(1)}%的息税折旧摊销前利润率需要严格成本控制` : `**成本管理**：保持${metrics.ebitdaMargin.toFixed(1)}%的息税折旧摊销前利润率`
    ],
    
    recommendations: [
      `**第一阶段-许可证** (0-6个月)：向${regulations.agency}启动许可证申请流程`,
      `**第二阶段-工程设计** (3-9个月)：详细设计和供应商签约`,
      `**第三阶段-建设** (6-15个月)：基础设施和Smart Line设备安装`,
      `**第四阶段-调试** (12-18个月)：运营测试和生产启动`,
      `**供应合同**：与矿业公司和港口签订协议，确保${metrics.annualTonnage.toFixed(0)}吨/年`,
      `**销售协议**：与本地和国际买家谈判颗粒销售合同`,
      `**税收优惠**：申请${regulations.taxIncentives[0]}以减轻税负`,
      `**培训**：按${regulations.laborRegulations[0]}标准培训团队`
    ],
    
    marketAnalysis: `${country}的OTR轮胎回收市场由于对再生材料需求增长和环境法规日益严格而呈现重大机遇。${study.location || country}的位置提供了从采矿作业和港口获取OTR轮胎来源的途径。橡胶颗粒平均价格为${safeNum(study.rubber_granules_price, 350)}美元/吨，回收钢材为${safeNum(study.steel_wire_price, 200)}美元/吨，在区域市场具有竞争力。`,
    
    esgAnalysis: `项目与联合国可持续发展目标(SDGs)高度一致：**SDG 12**（负责任消费和生产）通过每年回收${metrics.annualTonnage.toFixed(0)}吨；**SDG 13**（气候行动）通过减少排放vs填埋处理；**SDG 9**（工业和创新）通过Smart Line技术。预计ESG评级为**A-**，具有碳信用潜力。`
    
  } : language === 'it' ? {
    // Italian
    viabilityRating,
    viabilityJustification: `Il progetto "${study.study_name}" dimostra una fattibilità **${viabilityRating}** basata sugli indicatori finanziari analizzati. Con un ROI del ${roi.toFixed(1)}%, un TIR del ${irr.toFixed(1)}% e un payback di ${(paybackMonths/12).toFixed(1)} anni, l'investimento di USD ${(totalInvestment/1000000).toFixed(2)}M mostra ${viabilityRating === 'Excellent' || viabilityRating === 'Good' ? 'forte potenziale di rendimento' : 'necessità di ottimizzazione'}. Il margine EBITDA del ${metrics.ebitdaMargin.toFixed(1)}% ${metrics.ebitdaMargin >= 30 ? 'supera gli standard del settore' : 'è nella media del settore'}.`,
    
    strengths: [
      `**Capacità Produttiva**: ${dailyCapacity} tonnellate/giorno consente di processare ${metrics.annualTonnage.toFixed(0)} tonnellate/anno di pneumatici OTR`,
      `**Diversificazione dei Ricavi**: Granulato di gomma (${((metrics.rubberRevenue / (metrics.rubberRevenue + metrics.steelRevenue + metrics.fiberRevenue)) * 100).toFixed(0)}%), acciaio (${((metrics.steelRevenue / (metrics.rubberRevenue + metrics.steelRevenue + metrics.fiberRevenue)) * 100).toFixed(0)}%), fibra tessile`,
      `**Ricavo per Tonnellata**: USD ${metrics.revenuePerTon.toFixed(2)}/ton lavorata, con costo operativo di USD ${metrics.opexPerTon.toFixed(2)}/ton`,
      `**Tecnologia Smart Line**: L'automazione robotica riduce i costi operativi e aumenta la sicurezza`,
      `**Modello di Partnership ELP/TOPS**: Accesso a tecnologia all'avanguardia senza investimenti in R&S`,
      `**Impatto Ambientale Positivo**: Riciclaggio di ${metrics.annualTonnage.toFixed(0)} tonnellate/anno di rifiuti`,
      roi >= 20 ? `**ROI Attraente**: ${roi.toFixed(1)}% supera il tipico costo del capitale` : `**Potenziale di Ottimizzazione**: ROI del ${roi.toFixed(1)}% può essere migliorato`,
      npv > 0 ? `**VAN Positivo**: USD ${(npv/1000000).toFixed(2)}M indica creazione di valore` : `**Attenzione al VAN**: Rivedere le ipotesi finanziarie`,
      `**Mercato in Crescita**: Domanda globale di gomma riciclata in espansione`,
      `**Incentivi Fiscali**: ${regulations.taxIncentives[0]}`
    ],
    
    risks: [
      `**Rischio Regolatorio**: Il processo di licenza in ${country} può richiedere 6-18 mesi`,
      `**Volatilità dei Prezzi**: I prezzi delle materie prime riciclate sono soggetti a fluttuazioni`,
      `**Dipendenza dall'Approvvigionamento**: Necessità di garantire una fonte stabile di pneumatici OTR`,
      `**Rischio Operativo**: La manutenzione di attrezzature specializzate richiede tecnici qualificati`,
      `**Rischio Valutario**: Investimento in USD soggetto a variazioni dei tassi di cambio`,
      metrics.ebitdaMargin < 25 ? `**Margine Operativo**: EBITDA del ${metrics.ebitdaMargin.toFixed(1)}% richiede un rigoroso controllo dei costi` : `**Gestione Costi**: Mantenere margine EBITDA del ${metrics.ebitdaMargin.toFixed(1)}%`
    ],
    
    recommendations: [
      `**Fase 1 - Licenze** (0-6 mesi): Avviare il processo con ${regulations.agency}`,
      `**Fase 2 - Ingegneria** (3-9 mesi): Progettazione dettagliata e contratti con fornitori`,
      `**Fase 3 - Costruzione** (6-15 mesi): Installazione infrastrutture e attrezzature Smart Line`,
      `**Fase 4 - Commissioning** (12-18 mesi): Test operativi e avvio produzione`,
      `**Contratti di Fornitura**: Firmare accordi con società minerarie e porti`,
      `**Off-take Agreements**: Negoziare contratti di vendita del granulato`,
      `**Incentivi**: Richiedere ${regulations.taxIncentives[0]}`,
      `**Formazione**: Formare il team sugli standard ${regulations.laborRegulations[0]}`
    ],
    
    marketAnalysis: `Il mercato del riciclaggio di pneumatici OTR in ${country} presenta opportunità significative grazie alla crescente domanda di materiali riciclati e alle normative ambientali sempre più stringenti. La posizione in ${study.location || country} offre accesso a fonti di pneumatici OTR da operazioni minerarie e porti.`,
    
    esgAnalysis: `Il progetto dimostra un forte allineamento con gli Obiettivi di Sviluppo Sostenibile (SDGs): **SDG 12** (Produzione Responsabile), **SDG 13** (Azione per il Clima), **SDG 9** (Industria e Innovazione). Rating ESG stimato: **A-**.`
    
  } : {
    // English default
    viabilityRating,
    viabilityJustification: `The project "${study.study_name}" demonstrates **${viabilityRating}** viability based on the analyzed financial indicators. With an ROI of ${roi.toFixed(1)}%, IRR of ${irr.toFixed(1)}%, and payback of ${(paybackMonths/12).toFixed(1)} years, the USD ${(totalInvestment/1000000).toFixed(2)}M investment shows ${viabilityRating === 'Excellent' || viabilityRating === 'Good' ? 'strong return potential' : 'need for optimization'}. The EBITDA margin of ${metrics.ebitdaMargin.toFixed(1)}% ${metrics.ebitdaMargin >= 30 ? 'exceeds industry standards' : 'is within sector average'}.`,
    
    strengths: [
      `**Production Capacity**: ${dailyCapacity} tons/day enables processing of ${metrics.annualTonnage.toFixed(0)} tons/year of OTR tires`,
      `**Revenue Diversification**: Rubber granulate (${((metrics.rubberRevenue / (metrics.rubberRevenue + metrics.steelRevenue + metrics.fiberRevenue)) * 100).toFixed(0)}%), steel (${((metrics.steelRevenue / (metrics.rubberRevenue + metrics.steelRevenue + metrics.fiberRevenue)) * 100).toFixed(0)}%), textile fiber`,
      `**Revenue per Ton**: USD ${metrics.revenuePerTon.toFixed(2)}/ton processed, with operating cost of USD ${metrics.opexPerTon.toFixed(2)}/ton`,
      `**Smart Line Technology**: Robotic automation reduces operating costs and increases safety`,
      `**ELP/TOPS Partnership Model**: Access to cutting-edge technology without R&D investment`,
      `**Positive Environmental Impact**: Recycling of ${metrics.annualTonnage.toFixed(0)} tons/year of waste`,
      roi >= 20 ? `**Attractive ROI**: ${roi.toFixed(1)}% exceeds typical cost of capital` : `**Optimization Potential**: ${roi.toFixed(1)}% ROI can be improved`,
      npv > 0 ? `**Positive NPV**: USD ${(npv/1000000).toFixed(2)}M indicates value creation` : `**NPV Attention**: Review financial assumptions`,
      `**Growing Market**: Global demand for recycled rubber expanding`,
      `**Tax Incentives**: ${regulations.taxIncentives[0]}`
    ],
    
    risks: [
      `**Regulatory Risk**: Licensing process in ${country} may take 6-18 months (${regulations.licenses.join(', ')})`,
      `**Price Volatility**: Recycled commodity prices subject to market fluctuations`,
      `**Supply Dependency**: Need to secure stable OTR tire source`,
      `**Operational Risk**: Specialized equipment maintenance requires qualified technicians`,
      `**Currency Risk**: USD investment subject to exchange rate variations`,
      metrics.ebitdaMargin < 25 ? `**Operating Margin**: ${metrics.ebitdaMargin.toFixed(1)}% EBITDA requires strict cost control` : `**Cost Management**: Maintain ${metrics.ebitdaMargin.toFixed(1)}% EBITDA margin`
    ],
    
    recommendations: [
      `**Phase 1 - Licensing** (0-6 months): Initiate ${regulations.licenses[0]} process with ${regulations.agency}`,
      `**Phase 2 - Engineering** (3-9 months): Detailed design and supplier contracting`,
      `**Phase 3 - Construction** (6-15 months): Infrastructure and Smart Line equipment installation`,
      `**Phase 4 - Commissioning** (12-18 months): Operational testing and production start`,
      `**Supply Contracts**: Sign agreements with mining companies and ports to secure ${metrics.annualTonnage.toFixed(0)} tons/year`,
      `**Off-take Agreements**: Negotiate granulate sales contracts with local and international buyers`,
      `**Incentives**: Apply for ${regulations.taxIncentives[0]} to reduce tax burden`,
      `**Training**: Train team on ${regulations.laborRegulations[0]} standards`
    ],
    
    marketAnalysis: `The OTR tire recycling market in ${country} presents significant opportunities due to growing demand for recycled materials and increasingly stringent environmental regulations. The location in ${study.location || country} provides access to OTR tire sources from mining operations and ports. The average price of rubber granulate at USD ${safeNum(study.rubber_granules_price, 350)}/ton and recovered steel at USD ${safeNum(study.steel_wire_price, 200)}/ton are competitive in the regional market.`,
    
    esgAnalysis: `The project demonstrates strong alignment with Sustainable Development Goals (SDGs): **SDG 12** (Responsible Production) through recycling of ${metrics.annualTonnage.toFixed(0)} tons/year; **SDG 13** (Climate Action) by reducing emissions vs. landfill disposal; **SDG 9** (Industry and Innovation) via Smart Line technology. Estimated ESG rating is **A-** with potential for carbon credits.`
  };
  
  return texts;
}

// =============================================================================
// DATA SOURCES - Real references for analysis credibility
// =============================================================================
interface DataSources {
  title: string;
  marketPrices: string;
  otrComposition: string;
  capexBenchmarks: string;
  opexBreakdown: string;
  revenueCalc: string;
  fiscalIncentives: string;
  financialParams: string;
  disclaimer: string;
  sourcesList: string[];
  methodologyTitle: string;
  methodologyText: string;
}

// DETAILED OPEX BENCHMARKS BY COUNTRY (Jan 2026)
const COUNTRY_OPEX_DATA: Record<string, {
  name: string;
  source: string;
  laborMonthly: { min: number; max: number; typical: number };
  energyMonthly: { min: number; max: number; typical: number };
  maintenanceMonthly: { min: number; max: number; typical: number };
  logisticsMonthly: { min: number; max: number; typical: number };
  adminMonthly: { min: number; max: number; typical: number };
  totalMonthlyOpex: { min: number; max: number; typical: number };
  opexPerTon: { min: number; max: number; typical: number };
  laborHourlyRate: { min: number; max: number; typical: number };
}> = {
  'China': {
    name: 'China (TOPS Recycling - Tangshan)',
    source: 'TOPS Recycling Co. Ltd operational data 2025',
    laborHourlyRate: { min: 2.5, max: 5, typical: 3.5 },
    laborMonthly: { min: 8000, max: 20000, typical: 12000 },
    energyMonthly: { min: 4500, max: 12000, typical: 7500 },
    maintenanceMonthly: { min: 2000, max: 8000, typical: 4500 },
    logisticsMonthly: { min: 3000, max: 10000, typical: 5500 },
    adminMonthly: { min: 2000, max: 6000, typical: 3500 },
    totalMonthlyOpex: { min: 20000, max: 61000, typical: 35000 },
    opexPerTon: { min: 15, max: 40, typical: 25 },
  },
  'Germany': {
    name: 'Germany (Genan GmbH - Viborg Model)',
    source: 'Genan GmbH operational reports, EU Circular Economy 2025',
    laborHourlyRate: { min: 22, max: 35, typical: 28 },
    laborMonthly: { min: 80000, max: 160000, typical: 110000 },
    energyMonthly: { min: 25000, max: 50000, typical: 35000 },
    maintenanceMonthly: { min: 15000, max: 40000, typical: 25000 },
    logisticsMonthly: { min: 10000, max: 25000, typical: 16000 },
    adminMonthly: { min: 8000, max: 18000, typical: 12000 },
    totalMonthlyOpex: { min: 138000, max: 303000, typical: 203000 },
    opexPerTon: { min: 60, max: 120, typical: 85 },
  },
  'Australia': {
    name: 'Australia (Tyrecycle Pty Ltd)',
    source: 'Tyrecycle, Tyre Stewardship Australia 2025',
    laborHourlyRate: { min: 25, max: 40, typical: 32 },
    laborMonthly: { min: 60000, max: 120000, typical: 85000 },
    energyMonthly: { min: 15000, max: 35000, typical: 24000 },
    maintenanceMonthly: { min: 10000, max: 25000, typical: 16000 },
    logisticsMonthly: { min: 20000, max: 45000, typical: 30000 },
    adminMonthly: { min: 6000, max: 14000, typical: 9000 },
    totalMonthlyOpex: { min: 111000, max: 247000, typical: 167000 },
    opexPerTon: { min: 50, max: 100, typical: 70 },
  },
  'Brazil': {
    name: 'Brazil (ELP Integrated Model)',
    source: 'ELP Green Technology, IBAMA, BNDES 2025',
    laborHourlyRate: { min: 4, max: 10, typical: 6.5 },
    laborMonthly: { min: 35000, max: 65000, typical: 48000 },
    energyMonthly: { min: 18000, max: 38000, typical: 26000 },
    maintenanceMonthly: { min: 12000, max: 28000, typical: 18000 },
    logisticsMonthly: { min: 15000, max: 35000, typical: 22000 },
    adminMonthly: { min: 5000, max: 12000, typical: 8000 },
    totalMonthlyOpex: { min: 85000, max: 188000, typical: 126000 },
    opexPerTon: { min: 40, max: 80, typical: 55 },
  },
  'United States': {
    name: 'USA (Liberty Tire Model)',
    source: 'USTMA, EPA RCRA, IRA Section 45Q 2025',
    laborHourlyRate: { min: 18, max: 30, typical: 24 },
    laborMonthly: { min: 65000, max: 130000, typical: 92000 },
    energyMonthly: { min: 12000, max: 28000, typical: 19000 },
    maintenanceMonthly: { min: 10000, max: 22000, typical: 15000 },
    logisticsMonthly: { min: 12000, max: 28000, typical: 18000 },
    adminMonthly: { min: 8000, max: 18000, typical: 12000 },
    totalMonthlyOpex: { min: 107000, max: 234000, typical: 159000 },
    opexPerTon: { min: 45, max: 95, typical: 65 },
  },
  'Chile': {
    name: 'Chile (Mining Hub Model)',
    source: 'SMA Chile, Ley REP 20.920, CORFO 2025',
    laborHourlyRate: { min: 5, max: 12, typical: 8 },
    laborMonthly: { min: 28000, max: 55000, typical: 40000 },
    energyMonthly: { min: 14000, max: 30000, typical: 20000 },
    maintenanceMonthly: { min: 8000, max: 20000, typical: 13000 },
    logisticsMonthly: { min: 18000, max: 40000, typical: 26000 },
    adminMonthly: { min: 4000, max: 10000, typical: 6500 },
    totalMonthlyOpex: { min: 72000, max: 161000, typical: 108000 },
    opexPerTon: { min: 35, max: 75, typical: 50 },
  },
};

// Default OPEX for unknown countries
const DEFAULT_OPEX_DATA = {
  name: 'Global Average',
  source: 'IMARC Group, World Bank, ILO 2025',
  laborHourlyRate: { min: 8, max: 20, typical: 12 },
  laborMonthly: { min: 40000, max: 100000, typical: 65000 },
  energyMonthly: { min: 15000, max: 35000, typical: 22000 },
  maintenanceMonthly: { min: 10000, max: 25000, typical: 15000 },
  logisticsMonthly: { min: 12000, max: 30000, typical: 18000 },
  adminMonthly: { min: 5000, max: 15000, typical: 9000 },
  totalMonthlyOpex: { min: 82000, max: 205000, typical: 129000 },
  opexPerTon: { min: 40, max: 90, typical: 55 },
};

function getDataSources(language: string, country?: string): DataSources {
  const countryOpex = COUNTRY_OPEX_DATA[country || ''] || DEFAULT_OPEX_DATA;
  
  const sources: Record<string, DataSources> = {
    pt: {
      title: 'FONTES E REFERÊNCIAS',
      marketPrices: 'Preços de Mercado',
      otrComposition: 'Composição de Pneus OTR',
      capexBenchmarks: 'Benchmarks CAPEX',
      opexBreakdown: 'Detalhamento OPEX por País',
      revenueCalc: 'Cálculo de Receita',
      fiscalIncentives: 'Incentivos Fiscais',
      financialParams: 'Parâmetros Financeiros',
      methodologyTitle: 'METODOLOGIA DE CÁLCULO',
      methodologyText: `**Como os valores foram calculados:**

**1. Custos Operacionais (OPEX):**
Os valores de OPEX são baseados em dados operacionais reais de plantas em funcionamento:
- **Mão de Obra**: Baseado em taxas horárias de ${countryOpex.name}: $${countryOpex.laborHourlyRate.min}-$${countryOpex.laborHourlyRate.max}/hora (típico: $${countryOpex.laborHourlyRate.typical}/hora)
  - Fórmula: Custo Mensal = (Funcionários × Horas/Mês × Taxa Horária) × Encargos Sociais
  - Fonte: ILO, Ministério do Trabalho, dados de mercado local
- **Energia**: Baseado em tarifas de energia elétrica industrial local e consumo médio de 100-200 MWh/mês
  - Fórmula: Custo Mensal = Potência Instalada (kW) × 65% utilização × 18h/dia × 26 dias × Tarifa Regional
  - Fonte: ANEEL (Brasil), EIA (EUA), agências reguladoras locais
- **Manutenção**: 5-8% do custo de equipamentos por ano, distribuído mensalmente
  - Fórmula: Manutenção Anual = Custo Equipamentos × 5%
  - Fonte: Padrão industrial para máquinas pesadas de reciclagem
- **Logística**: Custos de transporte de matéria-prima e produtos finais
  - Fórmula: Custo Logística = Capacidade Diária × Taxa por Tonelada × 26 dias
  - Fonte: Fretes rodoviários regionais, custos de armazenagem
- **Administrativo**: Custos fixos de gestão, TI, seguros e compliance
  - Fórmula: Salários administrativos × Encargos Sociais
  - Fonte: Pesquisas salariais regionais

**2. Receita Anual:**
A receita é calculada com base em:
- **Produção Anual** = Capacidade Diária × Dias Operacionais × Taxa de Utilização
  - Exemplo: 50 ton/dia × 300 dias × 85% = 12.750 toneladas/ano
- **Receita por Produto** = Tonelagem × Rendimento (%) × Preço de Mercado
  - Granulado: Tonelagem × 43% × $250/ton (Fonte: TOPS Recycling, Genan GmbH)
  - Aço: Tonelagem × 25% × $250/ton (Fonte: Índice de sucata metálica)
  - Fibra: Tonelagem × 8% × $120/ton (Fonte: Mercado industrial)
  - rCB: Tonelagem × 12% × $1.050/ton (Fonte: Operadores de pirólise)
- Perda de processo: 12% (umidade, impurezas, perdas operacionais)
- Preços de referência Janeiro 2026 validados por: TOPS Recycling, Genan GmbH, Tyrecycle

**3. Indicadores Financeiros:**
- **ROI** = (EBITDA Anual / Investimento Total) × 100
  - Benchmark: >15% é aceitável, >25% é excelente (Fonte: IMARC Group)
- **Payback** = Investimento Total / Lucro Líquido Anual (em meses)
  - Benchmark: <60 meses é aceitável, <36 meses é excelente
- **VPL** = Σ [FCt / (1+r)^t] - Investimento Inicial
  - VPL > 0 indica criação de valor (Fonte: Metodologia DCF padrão)
- **TIR** = Taxa que zera o VPL do projeto
  - TIR > WACC indica projeto viável (Fonte: Corporate Finance, Brealey & Myers)

**4. Infraestrutura:**
- **Consumo de Água**: 0,75 m³/ton de material processado (limpeza, refrigeração)
- **Área Industrial**: 80-120 m²/ton/dia de capacidade
- **Potência Instalada**: 150-250 kW/ton/dia de capacidade

Fonte: ${countryOpex.source}`,
      disclaimer: 'Nota: Esta análise foi gerada com base em dados de mercado validados e metodologia ELP Green Technology. Os valores reais podem variar conforme condições locais e flutuações de mercado.',
      sourcesList: [
        `${countryOpex.name} - Dados operacionais de custos - 2025`,
        'TOPS Recycling Co. Ltd. (China) - Preços de granulado e aço recuperado - Janeiro 2026',
        'Genan GmbH (Alemanha) - Benchmarks de custos operacionais europeus - 2025',
        'Tyrecycle Australia Pty Ltd - Dados de plantas OTR oceânicas - 2025',
        'American Recycler Magazine - Índices de preços de commodities recicladas - Jan 2026',
        'IBAMA/MMA Brasil - Legislação ambiental PNRS Lei 12.305/2010',
        'Bridgestone/Michelin/Goodyear - Especificações técnicas de pneus OTR Tier-1'
      ]
    },
    es: {
      title: 'FUENTES Y REFERENCIAS',
      marketPrices: 'Precios de Mercado',
      otrComposition: 'Composición de Neumáticos OTR',
      capexBenchmarks: 'Benchmarks CAPEX',
      opexBreakdown: 'Desglose OPEX por País',
      revenueCalc: 'Cálculo de Ingresos',
      fiscalIncentives: 'Incentivos Fiscales',
      financialParams: 'Parámetros Financieros',
      methodologyTitle: 'METODOLOGÍA DE CÁLCULO',
      methodologyText: `**Cómo se calcularon los valores:**

**1. Costos Operativos (OPEX):**
Los valores de OPEX se basan en datos operacionales reales de plantas en funcionamiento:
- **Mano de Obra**: Basado en tarifas horarias de ${countryOpex.name}: $${countryOpex.laborHourlyRate.min}-$${countryOpex.laborHourlyRate.max}/hora
- **Energía**: Basado en tarifas de energía eléctrica industrial local
- **Mantenimiento**: 5-8% del costo de equipos por año
- **Logística**: Costos de transporte de materia prima y productos finales

**2. Ingresos Anuales:**
- **Producción Anual** = Capacidad Diaria × Días Operativos × Tasa de Utilización
- **Ingreso por Producto** = Tonelaje × Rendimiento (%) × Precio de Mercado
- Precios referencia Enero 2026: Granulado $250/t, Acero $250/t, Fibra $120/t, rCB $1.050/t

Fuente: ${countryOpex.source}`,
      disclaimer: 'Nota: Este análisis fue generado basado en datos de mercado validados y metodología ELP Green Technology.',
      sourcesList: [
        `${countryOpex.name} - Datos operativos - 2025`,
        'TOPS Recycling Co. Ltd. (China) - Precios de granulado - Enero 2026',
        'Genan GmbH (Alemania) - Benchmarks europeos - 2025',
        'Tyrecycle Australia Pty Ltd - Datos OTR oceánicos - 2025'
      ]
    },
    it: {
      title: 'FONTI E RIFERIMENTI',
      marketPrices: 'Prezzi di Mercato',
      otrComposition: 'Composizione Pneumatici OTR',
      capexBenchmarks: 'Benchmark CAPEX',
      opexBreakdown: 'Dettaglio OPEX per Paese',
      revenueCalc: 'Calcolo Ricavi',
      fiscalIncentives: 'Incentivi Fiscali',
      financialParams: 'Parametri Finanziari',
      methodologyTitle: 'METODOLOGIA DI CALCOLO',
      methodologyText: `**Come sono stati calcolati i valori:**

**1. Costi Operativi (OPEX):**
I valori OPEX si basano su dati operativi reali di impianti funzionanti:
- **Manodopera**: Basato su tariffe orarie di ${countryOpex.name}: $${countryOpex.laborHourlyRate.min}-$${countryOpex.laborHourlyRate.max}/ora
- **Energia**: Basato su tariffe elettriche industriali locali
- **Manutenzione**: 5-8% del costo attrezzature/anno

Fonte: ${countryOpex.source}`,
      disclaimer: 'Nota: Questa analisi è stata generata sulla base di dati di mercato validati e metodologia ELP Green Technology.',
      sourcesList: [
        `${countryOpex.name} - Dati operativi - 2025`,
        'TOPS Recycling Co. Ltd. (Cina) - Prezzi granulato - Gennaio 2026',
        'Genan GmbH (Germania) - Benchmark europei - 2025'
      ]
    },
    zh: {
      title: '数据来源和参考',
      marketPrices: '市场价格',
      otrComposition: 'OTR轮胎成分',
      capexBenchmarks: 'CAPEX基准',
      opexBreakdown: '各国OPEX明细',
      revenueCalc: '收入计算',
      fiscalIncentives: '税收优惠',
      financialParams: '财务参数',
      methodologyTitle: '计算方法',
      methodologyText: `**数值如何计算:**

**1. 运营成本 (OPEX):**
OPEX值基于实际运营工厂的数据:
- **劳动力**: 基于${countryOpex.name}的时薪: $${countryOpex.laborHourlyRate.min}-$${countryOpex.laborHourlyRate.max}/小时
- **能源**: 基于当地工业电价

来源: ${countryOpex.source}`,
      disclaimer: '注：本分析基于经验证的市场数据和ELP Green Technology方法论生成。',
      sourcesList: [
        `${countryOpex.name} - 运营数据 - 2025`,
        'TOPS Recycling Co. Ltd. (中国) - 2026年1月',
        'Genan GmbH (德国) - 2025'
      ]
    },
    en: {
      title: 'DATA SOURCES & REFERENCES',
      marketPrices: 'Market Prices',
      otrComposition: 'OTR Tire Composition',
      capexBenchmarks: 'CAPEX Benchmarks',
      opexBreakdown: 'OPEX Breakdown by Country',
      revenueCalc: 'Revenue Calculation',
      fiscalIncentives: 'Fiscal Incentives',
      financialParams: 'Financial Parameters',
      methodologyTitle: 'CALCULATION METHODOLOGY',
      methodologyText: `**How values were calculated:**

**1. Operating Costs (OPEX):**
OPEX values are based on real operational data from functioning plants:
- **Labor**: Based on hourly rates for ${countryOpex.name}: $${countryOpex.laborHourlyRate.min}-$${countryOpex.laborHourlyRate.max}/hour (typical: $${countryOpex.laborHourlyRate.typical}/hour)
  - Formula: Monthly Cost = (Employees × Hours/Month × Hourly Rate) × Social Charges
  - Source: ILO, Labor Ministry, local market data
- **Energy**: Based on local industrial electricity rates and average consumption of 100-200 MWh/month
  - Formula: Monthly Cost = Installed Power (kW) × 65% utilization × 18h/day × 26 days × Regional Rate
  - Source: ANEEL (Brazil), EIA (USA), local regulatory agencies
- **Maintenance**: 5-8% of equipment cost per year, distributed monthly
  - Formula: Annual Maintenance = Equipment Cost × 5%
  - Source: Industry standard for heavy recycling machinery
- **Logistics**: Transportation costs for raw materials and finished products
  - Formula: Logistics Cost = Daily Capacity × Rate per Ton × 26 days
  - Source: Regional freight rates, storage costs
- **Administrative**: Fixed management, IT, insurance, and compliance costs
  - Formula: Administrative Salaries × Social Charges
  - Source: Regional salary surveys

**Regional OPEX Benchmarks (Monthly):**
| Country | Labor | Energy | Maintenance | Logistics | Admin | Total | Per Ton |
|---------|-------|--------|-------------|-----------|-------|-------|---------|
| China | $8-20K | $4.5-12K | $2-8K | $3-10K | $2-6K | $20-61K | $15-40 |
| Germany | $80-160K | $25-50K | $15-40K | $10-25K | $8-18K | $138-303K | $60-120 |
| Australia | $60-120K | $15-35K | $10-25K | $20-45K | $6-14K | $111-247K | $50-100 |
| Brazil | $35-65K | $18-38K | $12-28K | $15-35K | $5-12K | $85-188K | $40-80 |
| USA | $65-130K | $12-28K | $10-22K | $12-28K | $8-18K | $107-234K | $45-95 |
| Chile | $28-55K | $14-30K | $8-20K | $18-40K | $4-10K | $72-161K | $35-75 |

**2. Annual Revenue:**
Revenue is calculated based on:
- **Annual Production** = Daily Capacity × Operating Days × Utilization Rate
  - Example: 50 ton/day × 300 days × 85% = 12,750 tons/year
- **Revenue per Product** = Tonnage × Yield (%) × Market Price
  - Granules: Tonnage × 43% × $250/ton (Source: TOPS Recycling, Genan GmbH)
  - Steel: Tonnage × 25% × $250/ton (Source: Metal scrap index)
  - Fiber: Tonnage × 8% × $120/ton (Source: Industrial market)
  - rCB: Tonnage × 12% × $1,050/ton (Source: Pyrolysis operators)
- Process loss: 12% (moisture, impurities, operational losses)
- Reference prices January 2026 validated by: TOPS Recycling, Genan GmbH, Tyrecycle

**3. Financial Indicators:**
- **ROI** = (Annual EBITDA / Total Investment) × 100
  - Benchmark: >15% is acceptable, >25% is excellent (Source: IMARC Group)
- **Payback** = Total Investment / Annual Net Profit (in months)
  - Benchmark: <60 months is acceptable, <36 months is excellent
- **NPV** = Σ [CFt / (1+r)^t] - Initial Investment
  - NPV > 0 indicates value creation (Source: Standard DCF methodology)
- **IRR** = Rate that zeroes the project's NPV
  - IRR > WACC indicates viable project (Source: Corporate Finance, Brealey & Myers)

**4. Infrastructure:**
- **Water Consumption**: 0.75 m³/ton of processed material (cleaning, cooling)
- **Industrial Area**: 80-120 m²/ton/day of capacity
- **Installed Power**: 150-250 kW/ton/day of capacity

Source: ${countryOpex.source}`,
      disclaimer: 'Note: This analysis was generated based on validated market data and ELP Green Technology methodology. Actual values may vary according to local conditions and market fluctuations.',
      sourcesList: [
        `${countryOpex.name} - Operational cost data - 2025`,
        'TOPS Recycling Co. Ltd. (China) - Granule and recovered steel prices - January 2026',
        'Genan GmbH (Germany) - European operating cost benchmarks - 2025',
        'Tyrecycle Australia Pty Ltd - Oceanic OTR plant data - 2025',
        'American Recycler Magazine - Recycled commodity price indices - Jan 2026',
        'EPA USA - RCRA and Clean Air Act regulations',
        'IRA (USA) - Inflation Reduction Act Section 45Q credits',
        'Bridgestone/Michelin/Goodyear - Tier-1 OTR technical specifications'
      ]
    }
  };
  
  return sources[language] || sources.en;
}

function formatAnalysisAsMarkdown(
  study: FeasibilityStudy,
  texts: AnalysisTexts,
  metrics: {
    annualTonnage: number;
    ebitdaMargin: number;
    revenuePerTon: number;
    opexPerTon: number;
    rubberRevenue: number;
    steelRevenue: number;
    fiberRevenue: number;
  },
  regulations: CountryRegulation,
  language: string
): string {
  const country = study.country || 'Unknown';
  const totalInvestment = safeNum(study.total_investment, 5000000);
  const annualRevenue = safeNum(study.annual_revenue, 0);
  const annualOpex = safeNum(study.annual_opex, 0);
  const annualEbitda = safeNum(study.annual_ebitda, 0);
  const roi = safeNum(study.roi_percentage, 0);
  const irr = safeNum(study.irr_percentage, 0);
  const npv = safeNum(study.npv_10_years, 0);
  const paybackMonths = safeNum(study.payback_months, 60);
  
  const sources = getDataSources(language, country);
  
  const headers = language === 'pt' ? {
    title: 'ANÁLISE DE VIABILIDADE',
    overview: 'RESUMO EXECUTIVO',
    viability: 'AVALIAÇÃO DE VIABILIDADE',
    financials: 'INDICADORES FINANCEIROS',
    regulatory: 'MARCO REGULATÓRIO',
    strengths: 'PONTOS FORTES',
    risks: 'FATORES DE RISCO',
    recommendations: 'RECOMENDAÇÕES',
    market: 'ANÁLISE DE MERCADO',
    esg: 'ANÁLISE ESG',
    calculationBasis: 'BASE DE CÁLCULOS'
  } : language === 'es' ? {
    title: 'ANÁLISIS DE VIABILIDAD',
    overview: 'RESUMEN EJECUTIVO',
    viability: 'EVALUACIÓN DE VIABILIDAD',
    financials: 'INDICADORES FINANCIEROS',
    regulatory: 'MARCO REGULATORIO',
    strengths: 'FORTALEZAS',
    risks: 'FACTORES DE RIESGO',
    recommendations: 'RECOMENDACIONES',
    market: 'ANÁLISIS DE MERCADO',
    esg: 'ANÁLISIS ESG',
    calculationBasis: 'BASE DE CÁLCULOS'
  } : language === 'it' ? {
    title: 'ANALISI DI FATTIBILITÀ',
    overview: 'SOMMARIO ESECUTIVO',
    viability: 'VALUTAZIONE DI FATTIBILITÀ',
    financials: 'INDICATORI FINANZIARI',
    regulatory: 'QUADRO NORMATIVO',
    strengths: 'PUNTI DI FORZA',
    risks: 'FATTORI DI RISCHIO',
    recommendations: 'RACCOMANDAZIONI',
    market: 'ANALISI DI MERCATO',
    esg: 'ANALISI ESG',
    calculationBasis: 'BASE DI CALCOLO'
  } : language === 'zh' ? {
    title: '可行性分析',
    overview: '执行摘要',
    viability: '可行性评估',
    financials: '财务指标',
    regulatory: '监管框架',
    strengths: '关键优势',
    risks: '风险因素',
    recommendations: '建议',
    market: '市场分析',
    esg: 'ESG分析',
    calculationBasis: '计算基础'
  } : {
    title: 'FEASIBILITY ANALYSIS',
    overview: 'EXECUTIVE SUMMARY',
    viability: 'VIABILITY ASSESSMENT',
    financials: 'FINANCIAL INDICATORS',
    regulatory: 'REGULATORY FRAMEWORK',
    strengths: 'KEY STRENGTHS',
    risks: 'RISK FACTORS',
    recommendations: 'RECOMMENDATIONS',
    market: 'MARKET ANALYSIS',
    esg: 'ESG ANALYSIS',
    calculationBasis: 'CALCULATION BASIS'
  };
  
  return `# ${headers.title}: ${study.study_name}

## ${headers.overview}

${texts.viabilityJustification}

---

## ${headers.viability}

| Metric | Value | Benchmark |
|--------|-------|-----------|
| **Rating** | **${texts.viabilityRating}** | - |
| ROI | ${roi.toFixed(1)}% | >15% |
| IRR | ${irr.toFixed(1)}% | >12% |
| NPV (10yr) | USD ${(npv/1000000).toFixed(2)}M | >0 |
| Payback | ${(paybackMonths/12).toFixed(1)} years | <5 years |
| EBITDA Margin | ${metrics.ebitdaMargin.toFixed(1)}% | >25% |

---

## ${headers.calculationBasis}

### ${sources.marketPrices} (January 2026)
- Rubber Granules: **$250/ton** (Range: $200-$290) - Source: TOPS Recycling, Genan GmbH
- Recovered Steel: **$250/ton** (Range: $150-$350) - Source: Metal recyclers index
- Textile Fiber: **$120/ton** (Range: $80-$200) - Source: Industrial markets
- rCB (Carbon Black): **$1,050/ton** (Range: $900-$1,200) - Source: Pyrolysis operators

### ${sources.otrComposition}
- 27.00R49 (100t Trucks): 1,800kg - 55% rubber, 25% steel, 8% textile
- 40.00R57 (200t+ Trucks): 3,700kg - 53% rubber, 28% steel, 6% textile
- 59/80R63 (Ultra-class 400t+): 5,350kg - 51% rubber, 30% steel, 5% textile

### ${sources.capexBenchmarks}
- China (TOPS): $0.5-1.5M CAPEX | $15-40/ton OPEX
- Germany (Genan): $5-12M CAPEX | $60-120/ton OPEX
- Australia (Tyrecycle): $3-8M CAPEX | $50-100/ton OPEX
- Brazil (ELP Model): $8-15M CAPEX | $40-80/ton OPEX

### ${sources.opexBreakdown}
| Country | Labor/mo | Energy/mo | Maintenance/mo | Logistics/mo | Total OPEX/mo | Per Ton |
|---------|----------|-----------|----------------|--------------|---------------|---------|
| China | $8-20K | $4.5-12K | $2-8K | $3-10K | $20-61K | $15-40 |
| Germany | $80-160K | $25-50K | $15-40K | $10-25K | $138-303K | $60-120 |
| Australia | $60-120K | $15-35K | $10-25K | $20-45K | $111-247K | $50-100 |
| Brazil | $35-65K | $18-38K | $12-28K | $15-35K | $85-188K | $40-80 |
| USA | $65-130K | $12-28K | $10-22K | $12-28K | $107-234K | $45-95 |
| Chile | $28-55K | $14-30K | $8-20K | $18-40K | $72-161K | $35-75 |

---

## ${headers.financials}

### Investment (CAPEX)
- **Total Investment**: USD ${(totalInvestment/1000000).toFixed(2)}M
- Equipment: USD ${(safeNum(study.equipment_cost, 0)/1000000).toFixed(2)}M
- Infrastructure: USD ${(safeNum(study.infrastructure_cost, 0)/1000000).toFixed(2)}M
- Installation: USD ${(safeNum(study.installation_cost, 0)/1000000).toFixed(2)}M
- Working Capital: USD ${(safeNum(study.working_capital, 0)/1000000).toFixed(2)}M

### Revenue (Annual)
- **Total Revenue**: USD ${(annualRevenue/1000000).toFixed(2)}M
- Revenue per ton: USD ${metrics.revenuePerTon.toFixed(2)}
- Rubber Granules: USD ${(metrics.rubberRevenue/1000000).toFixed(2)}M
- Steel Wire: USD ${(metrics.steelRevenue/1000000).toFixed(2)}M
- Textile Fiber: USD ${(metrics.fiberRevenue/1000000).toFixed(2)}M

### Operating Costs (Annual)
- **Total OPEX**: USD ${(annualOpex/1000000).toFixed(2)}M
- Cost per ton: USD ${metrics.opexPerTon.toFixed(2)}
- **EBITDA**: USD ${(annualEbitda/1000000).toFixed(2)}M

---

## ${headers.regulatory} - ${country}

**Regulatory Agency**: ${regulations.agency}

### Main Laws
${regulations.mainLaws.map(law => `- ${law}`).join('\n')}

### Required Licenses
${regulations.licenses.map(lic => `- ${lic}`).join('\n')}

### Environmental Requirements
${regulations.environmentalRequirements.map(req => `- ${req}`).join('\n')}

### Tax Incentives
${regulations.taxIncentives.map(inc => `- ${inc}`).join('\n')}

### Labor Regulations
${regulations.laborRegulations.map(reg => `- ${reg}`).join('\n')}

---

## ${headers.strengths}

${texts.strengths.map((s, i) => `${i + 1}. ${s}`).join('\n')}

---

## ${headers.risks}

${texts.risks.map((r, i) => `${i + 1}. ${r}`).join('\n')}

---

## ${headers.recommendations}

${texts.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

---

## ${headers.market}

${texts.marketAnalysis}

---

## ${headers.esg}

${texts.esgAnalysis}

---

## ${sources.methodologyTitle}

${sources.methodologyText}

---

## ${sources.title}

${sources.sourcesList.map(s => `- ${s}`).join('\n')}

*${sources.disclaimer}*

---

*Analysis generated by ELP Green Technology - OTR Tire Recycling Feasibility System*
*${new Date().toISOString().split('T')[0]}*
`;
}

// =============================================================================
// COLLABORATIVE MULTI-KEY ANALYSIS FUNCTIONS
// =============================================================================

interface CollaborativeAnalysisResult {
  financial: string | null;
  regulatory: string | null;
  market: string | null;
  esg: string | null;
  synthesis: string | null;
  keysUsed: number;
  successfulKeys: number[];
}

// Call a single Gemini key with specific prompt
async function callGeminiWithKey(
  apiKey: string, 
  keyIndex: number,
  prompt: string, 
  maxTokens = 2048
): Promise<{ success: boolean; content: string | null; error?: string }> {
  try {
    console.log(`🔑 Collaborative call - Key ${keyIndex + 1}/${GEMINI_API_KEYS.length}...`);
    const response = await callExternalAPI(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 }
        }),
      },
      30000
    );

    if (response.ok) {
      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || null;
      if (content) {
        markKeySuccess(keyIndex);
        console.log(`✅ Key ${keyIndex + 1} success (${content.length} chars)`);
        return { success: true, content };
      }
      return { success: false, content: null, error: 'Empty response' };
    }

    if (response.status === 429 || response.status === 529 || response.status === 503) {
      failedKeys.add(keyIndex);
      failedKeyTimestamps.set(keyIndex, Date.now());
      console.log(`⚠️ Key ${keyIndex + 1} rate-limited (${response.status})`);
      return { success: false, content: null, error: `Rate limited (${response.status})` };
    }

    return { success: false, content: null, error: `HTTP ${response.status}` };
  } catch (error) {
    console.error(`❌ Key ${keyIndex + 1} error:`, error);
    return { success: false, content: null, error: String(error) };
  }
}

// Run collaborative analysis using multiple keys in parallel
async function runCollaborativeAnalysis(
  study: FeasibilityStudy,
  metrics: Record<string, number>,
  regulations: CountryRegulation,
  language: string,
  fiscalIncentives: any,
  otrReference: any
): Promise<CollaborativeAnalysisResult> {
  const availableKeys = getAvailableKeysForCollaboration(7);
  console.log(`🤝 Starting collaborative analysis with ${availableKeys.length} keys...`);

  // CRITICAL: Language instructions MUST be at the VERY BEGINNING of every prompt
  // and MUST be emphatic to override LLM's tendency to respond in prompt language
  const languageInstructions: Record<string, string> = {
    en: `[LANGUAGE REQUIREMENT - CRITICAL - DO NOT IGNORE]
MANDATORY OUTPUT LANGUAGE: ENGLISH
You MUST write your ENTIRE response in English (United States).
This is NON-NEGOTIABLE. Every single word, header, section title, bullet point, analysis paragraph, conclusion, table header, and data label MUST be in English.
DO NOT use any Portuguese, Spanish, Chinese, Italian or other languages.
DO NOT translate the prompt language to your response - respond ONLY in English.
VIOLATION OF THIS RULE WILL MAKE YOUR RESPONSE INVALID.`,

    pt: `[REQUISITO DE IDIOMA - CRITICO - NAO IGNORAR]
IDIOMA OBRIGATORIO DA RESPOSTA: PORTUGUES DO BRASIL
Voce DEVE escrever sua resposta INTEIRA em Portugues Brasileiro.
Isto e INEGOCIAVEL. Cada palavra, cabecalho, titulo de secao, item de lista, paragrafo de analise, conclusao, cabecalho de tabela e rotulo de dados DEVE estar em Portugues.
NAO use Ingles, Espanhol, Chines, Italiano ou outros idiomas.
NAO traduza o idioma do prompt para sua resposta - responda APENAS em Portugues do Brasil.
VIOLACAO DESTA REGRA TORNARA SUA RESPOSTA INVALIDA.`,

    es: `[REQUISITO DE IDIOMA - CRITICO - NO IGNORAR]
IDIOMA OBLIGATORIO DE RESPUESTA: ESPANOL
Debes escribir tu respuesta COMPLETA en Espanol.
Esto es INNEGOCIABLE. Cada palabra, encabezado, titulo de seccion, punto de lista, parrafo de analisis, conclusion, encabezado de tabla y etiqueta de datos DEBE estar en Espanol.
NO uses Ingles, Portugues, Chino, Italiano u otros idiomas.
NO traduzcas el idioma del prompt a tu respuesta - responde SOLO en Espanol.
LA VIOLACION DE ESTA REGLA INVALIDARA TU RESPUESTA.`,

    zh: `[语言要求 - 关键 - 请勿忽略]
强制输出语言：繁体中文
您必须用繁体中文撰写整个回复。
这是不可商量的。每个词、标题、章节标题、列表项、分析段落、结论、表头和数据标签都必须使用中文。
不要使用英语、葡萄牙语、西班牙语、意大利语或其他语言。
不要将提示语言翻译到您的回复中 - 仅用中文回复。
违反此规则将使您的回复无效。`,

    it: `[REQUISITO LINGUA - CRITICO - NON IGNORARE]
LINGUA OBBLIGATORIA DELLA RISPOSTA: ITALIANO
Devi scrivere la tua risposta INTERAMENTE in Italiano.
Questo e NON NEGOZIABILE. Ogni parola, intestazione, titolo di sezione, punto elenco, paragrafo di analisi, conclusione, intestazione di tabella e etichetta dati DEVE essere in Italiano.
NON usare Inglese, Portoghese, Spagnolo, Cinese o altre lingue.
NON tradurre la lingua del prompt nella tua risposta - rispondi SOLO in Italiano.
LA VIOLAZIONE DI QUESTA REGOLA RENDERA LA TUA RISPOSTA NON VALIDA.`
  };
  const langInstruction = languageInstructions[language] || languageInstructions.en;
  const country = study.country || 'Unknown';
  
  // PROFESSIONAL FORMAT INSTRUCTIONS - NO MARKDOWN, NO EMOJIS, WITH METHODOLOGY
  const formatInstructions = `
CRITICAL FORMATTING RULES:
1. DO NOT use markdown formatting (no **, ##, ###, *, -, etc.)
2. DO NOT use emojis or special characters
3. Use plain text with numbered sections (1., 1.1., 1.1.1., etc.)
4. Use clear paragraph breaks between sections
5. Present data in professional tabular format with aligned columns using spaces
6. Write in formal corporate/technical language
7. Every statement must be supported by specific data, calculations, or regulatory references
8. Include specific laws, regulations, and their article numbers
9. Cite real market data sources (IBGE, World Bank, ILO, industry reports)
10. Use professional engineering notation for calculations

MANDATORY METHODOLOGY JUSTIFICATION:
For EVERY calculation or metric you present, you MUST include:
A) The FORMULA used (e.g., "ROI = (Net Profit / Total Investment) x 100")
B) The SOURCE of the data (e.g., "Source: IBGE 2024, TOPS Recycling operational data")
C) The BENCHMARK comparison (e.g., "Industry benchmark: 15-25%")
D) WHY the value validates the project (e.g., "This 24.5% ROI exceeds the 15% hurdle rate by 63%")

Your role combines:
- Senior Industrial Engineer (25+ years in OTR tire recycling plants)
- PhD in International Environmental Law and Import/Export Regulations
- Certified Financial Analyst with expertise in project finance

Your analysis must PROVE the project is viable by:
1. Showing how each calculation was derived step-by-step
2. Citing specific, verifiable sources for all data
3. Comparing every metric against industry benchmarks
4. Explaining why each parameter meets or exceeds professional standards
`;
  
  const baseContext = `
Project: ${study.study_name}
Location: ${study.location || country}
Country: ${country}
Daily Capacity: ${study.daily_capacity_tons} tons/day
Total Investment: USD ${((study.total_investment || 0) / 1000000).toFixed(2)}M
Annual Revenue: USD ${((study.annual_revenue || 0) / 1000000).toFixed(2)}M
Annual OPEX: USD ${((study.annual_opex || 0) / 1000000).toFixed(2)}M
ROI: ${study.roi_percentage?.toFixed(1)}%
IRR: ${study.irr_percentage?.toFixed(1)}%
Payback: ${study.payback_months} months
NPV (10y): USD ${((study.npv_10_years || 0) / 1000000).toFixed(2)}M
`;

  // Define specialized prompts for each aspect - PROFESSIONAL FORMAT WITH FULL METHODOLOGY
  const prompts = {
    financial: `${langInstruction}
${formatInstructions}

You are a senior financial analyst with 20+ years in industrial investments and capital markets.

Analyze the financial viability of this OTR tire recycling project:

${baseContext}

IMPORTANT: For EVERY metric, you MUST show:
- The FORMULA with actual numbers substituted
- The DATA SOURCE (e.g., "TOPS Recycling operational data 2025", "IBGE sectoral survey")
- The BENCHMARK comparison with industry standard
- The VALIDATION explanation of why this proves project viability

Provide a detailed professional analysis covering:

1. INVESTMENT VIABILITY CLASSIFICATION
   1.1. Rating: Excellent/Good/Moderate/Risky with quantitative justification showing:
        - Formula: Viability Score = (ROI Weight x ROI) + (IRR Weight x IRR) + (Payback Weight x 1/Payback)
        - Source: Modified Altman Z-Score methodology for industrial projects
        - Benchmark: Score > 3.0 = Excellent, 2.5-3.0 = Good, 2.0-2.5 = Moderate, <2.0 = Risky
   1.2. Comparison with industry benchmarks (cite: Genan GmbH annual reports, Tyrecycle Australia, TOPS Recycling)
   1.3. Risk-adjusted return analysis using CAPM methodology

2. FINANCIAL INDICATORS ANALYSIS WITH FORMULAS
   2.1. ROI Analysis:
        - Formula: ROI = (Annual EBITDA / Total Investment) x 100
        - Calculation: (${((study.annual_ebitda || 0) / 1000000).toFixed(2)}M / ${((study.total_investment || 0) / 1000000).toFixed(2)}M) x 100 = ${study.roi_percentage?.toFixed(1)}%
        - Source: Project financial model, validated against TOPS Recycling benchmark data
        - Benchmark: Industry standard 15-25% (Source: IMARC Group Tire Recycling Market Report 2025)
        - Validation: ${(study.roi_percentage || 0) >= 20 ? 'EXCEEDS benchmark, indicating strong return potential' : (study.roi_percentage || 0) >= 15 ? 'MEETS minimum benchmark requirements' : 'BELOW benchmark, optimization recommended'}
   2.2. IRR Analysis:
        - Formula: NPV = Sum of [CFt / (1+IRR)^t] = 0
        - Current: ${study.irr_percentage?.toFixed(1)}% vs WACC estimate (8-12%) and hurdle rates (15%)
        - Source: Discounted Cash Flow model with 10-year horizon
        - Validation: ${(study.irr_percentage || 0) >= 15 ? 'EXCEEDS hurdle rate, investment recommended' : 'BELOW hurdle rate, review cost structure'}
   2.3. NPV sensitivity to discount rate variations (8%, 10%, 12%, 15%)
   2.4. Payback period: ${study.payback_months} months vs industry standard 36-60 months

3. CASH FLOW SENSITIVITY WITH CALCULATIONS
   3.1. Revenue sensitivity: Show impact of +/-10% price variation with exact numbers
   3.2. OPEX sensitivity: Show impact of +/-15% cost variation with exact numbers
   3.3. Capacity utilization impact: Calculate EBITDA at 70%, 85%, 95% scenarios

4. BREAK-EVEN ANALYSIS WITH FORMULAS
   4.1. Monthly break-even tonnage = Fixed Costs / (Revenue per ton - Variable Cost per ton)
   4.2. Break-even revenue per ton = Total OPEX / Annual Tonnage
   4.3. Margin of safety = (Projected Revenue - Break-even Revenue) / Projected Revenue

5. CAPITAL STRUCTURE RECOMMENDATIONS WITH SOURCES
   5.1. Optimal debt/equity ratio: 60:40 to 70:30 (Source: Industrial project finance standards)
   5.2. Financing alternatives with specific programs: BNDES Finem, EIB InvestEU, IFC loans, commercial banks
   5.3. Collateral requirements based on equipment value and real estate

Every statement must cite its source and show the calculation.`,

    regulatory: `${langInstruction}
${formatInstructions}

You are a senior regulatory compliance attorney with PhD in International Environmental Law, specialized in ${country} industrial regulations.

Analyze the regulatory requirements for this OTR tire recycling plant:

${baseContext}

Regulatory Framework:
- Agency: ${regulations.agency}
- Main Laws: ${regulations.mainLaws.join('; ')}
- Required Licenses: ${regulations.licenses.join('; ')}

${fiscalIncentives ? `Tax Incentives Available:
- Standard Tax: ${fiscalIncentives.corporateTax}%
- Regions: ${fiscalIncentives.regions?.map((r: any) => r.name).join(', ')}` : ''}

Provide a detailed professional analysis covering:

1. LICENSING REQUIREMENTS AND TIMELINE
   1.1. Environmental license (LP/LI/LO) - process, timeline, costs
   1.2. Industrial operating permits - specific requirements
   1.3. Waste handler certifications - mandatory registrations
   1.4. Import/export licenses for equipment and products

2. ENVIRONMENTAL COMPLIANCE
   2.1. EIA/RIMA requirements - scope and budget
   2.2. Air quality permits - emission limits (cite specific regulations)
   2.3. Water discharge permits - treatment requirements
   2.4. Solid waste management plan - specific requirements

3. LABOR AND SAFETY REGULATIONS
   3.1. Occupational health requirements (cite specific NRs or equivalent)
   3.2. Safety certifications for heavy equipment
   3.3. Training and certification requirements for operators
   3.4. Insurance requirements (workers compensation, liability)

4. REGULATORY RISKS AND MITIGATION
   4.1. Common licensing delays and how to prevent them
   4.2. Compliance monitoring requirements
   4.3. Penalty framework for non-compliance
   4.4. Recommended legal structure for risk mitigation

5. STEP-BY-STEP LICENSING ROADMAP
   5.1. Pre-operational phase (months 1-6)
   5.2. Construction phase (months 6-12)
   5.3. Commissioning phase (months 12-18)
   5.4. Full operation phase - ongoing compliance

Include specific article numbers and regulation codes.`,

    market: `${langInstruction}
${formatInstructions}

You are a senior market analyst specialized in the tire recycling and circular economy industry.

Analyze the market conditions for this project:

${baseContext}

${otrReference ? `Market Prices (${otrReference.lastUpdated}):
- Rubber Granules: $${otrReference.marketPrices.granules?.avg}/ton
- Steel: $${otrReference.marketPrices.steel?.avg}/ton
- rCB: $${otrReference.marketPrices.rcb?.avg}/ton` : ''}

CRITICAL: For every market statement, you MUST include:
- DATA SOURCE with publication date (e.g., "IMARC Group 2025", "Grand View Research Q4 2024")
- SPECIFIC NUMBERS with calculations showing how they validate the project
- COMPARISON with project assumptions to prove alignment

Provide a detailed professional analysis covering:

1. DEMAND ANALYSIS FOR RECYCLED PRODUCTS (WITH SOURCES)
   1.1. Rubber granules demand - cite specific market reports with CAGR
        - Formula: Market Growth = Current Market x (1 + CAGR)^Years
        - Source: Grand View Research, IMARC Group, Smithers Reports
   1.2. Recovered steel demand - cite steel industry data
   1.3. rCB demand - cite tire manufacturer sourcing data
   1.4. Textile fiber demand - cement industry RDF statistics
   1.5. Projected demand growth rates with 5-year forecasts

2. COMPETITIVE LANDSCAPE IN ${country} (WITH MARKET SHARE DATA)
   2.1. Existing tire recyclers - name companies, cite capacity in tons/year
   2.2. Market share analysis with specific percentages
   2.3. Barriers to entry quantified (CAPEX requirements, licensing time, expertise)
   2.4. Competitive advantages of Smart Line technology vs alternatives

3. PRICE VOLATILITY ANALYSIS (WITH HISTORICAL DATA)
   3.1. Historical price trends: Show 5-year price table for rubber granules, steel, rCB
        - Source: Metal Bulletin, ICIS, industry associations
   3.2. Price correlation with commodities (oil, virgin rubber, steel scrap)
   3.3. Hedging strategies with specific instruments
   3.4. Contract structures: spot vs. forward pricing

4. SUPPLY CHAIN VALIDATION
   4.1. OTR tire sources in ${study.location || country}:
        - Mining companies: List major operators and estimated tire volumes
        - Ports: Import/export tire flows
        - Dealers: Replacement tire market size
   4.2. Collection logistics: Cost per ton with distance calculation
   4.3. Supply agreement templates and typical contract terms
   4.4. Annual supply availability vs. project requirement of ${metrics.annualTonnage.toFixed(0)} tons

5. MARKET SIZE AND GROWTH OPPORTUNITIES
   5.1. Total Addressable Market (TAM): ${country} tire recycling market size
        - Formula: TAM = Annual Tires Generated x Recycling Rate x Price/Ton
        - Source: National waste statistics, EPA/IBAMA data
   5.2. Serviceable Addressable Market (SAM): OTR segment specifically
   5.3. Serviceable Obtainable Market (SOM): Realistic market share projection
   5.4. 10-year market growth projection with assumptions

Every data point must cite a verifiable source.`,

    esg: `${langInstruction}
${formatInstructions}

You are a senior ESG analyst and sustainability consultant with expertise in industrial circular economy projects.

Analyze this OTR tire recycling project from a sustainability perspective:

${baseContext}

CRITICAL: Every ESG metric MUST include:
- The CALCULATION FORMULA with actual project numbers
- The DATA SOURCE (IPCC, GRI, SASB, ISO standards)
- COMPARISON with industry benchmarks
- VALIDATION of how this proves project sustainability

Provide a detailed professional analysis covering:

1. ENVIRONMENTAL IMPACT ASSESSMENT (WITH CALCULATIONS)
   1.1. CO2 reduction calculation:
        - Formula: CO2 Avoided = Annual Tonnage x CO2 Emission Factor (landfill) - CO2 Emission Factor (recycling)
        - Calculation: ${metrics.annualTonnage.toFixed(0)} tons x 0.9 tons CO2/ton = ${(metrics.annualTonnage * 0.9).toFixed(0)} tons CO2/year avoided
        - Source: IPCC Guidelines for National Greenhouse Gas Inventories, EPA WARM Model
        - Benchmark: Verified Carbon Standard (VCS) methodology for waste diversion
   1.2. Landfill diversion:
        - Volume: ${metrics.annualTonnage.toFixed(0)} tons/year diverted
        - Space saved: ${(metrics.annualTonnage * 1.2).toFixed(0)} m³/year (bulk density 0.83 tons/m³)
        - Source: EPA landfill volume calculations
   1.3. Virgin material replacement:
        - Rubber: ${(metrics.annualTonnage * (study.rubber_granules_yield || 43) / 100).toFixed(0)} tons replacing virgin rubber
        - Steel: ${(metrics.annualTonnage * (study.steel_wire_yield || 25) / 100).toFixed(0)} tons replacing virgin steel
        - Source: Life Cycle Assessment (LCA) ISO 14040 methodology
   1.4. Energy balance with BTU/MJ calculations
   1.5. Water footprint: 0.75 m³/ton x ${metrics.annualTonnage.toFixed(0)} tons = ${(metrics.annualTonnage * 0.75).toFixed(0)} m³/year

2. SOCIAL BENEFITS QUANTIFICATION
   2.1. Direct job creation: Estimate based on capacity (typically 0.3-0.5 jobs per ton/day capacity)
        - Calculation: ${study.daily_capacity_tons} tons/day x 0.4 = ${((study.daily_capacity_tons || 50) * 0.4).toFixed(0)} direct jobs
        - Source: ILO Recycling Industry Employment Survey 2024
   2.2. Indirect employment multiplier: 2.5x direct jobs (supply chain, services)
   2.3. Community economic impact: Wages x Local Spending Multiplier
   2.4. Health benefits: Reduced PM2.5 from illegal burning (cite WHO health cost data)
   2.5. Training investment: Estimated hours and certifications per employee

3. UN SDG ALIGNMENT (WITH METRICS)
   3.1. SDG 9 (Industry, Innovation, Infrastructure):
        - Metric: Investment in sustainable infrastructure: $${((study.total_investment || 0) / 1000000).toFixed(2)}M
        - Source: UN SDG Indicator Framework
   3.2. SDG 12 (Responsible Consumption and Production):
        - Metric: Material recycled: ${metrics.annualTonnage.toFixed(0)} tons/year
        - Metric: Waste reduction rate: 100% (all material processed)
   3.3. SDG 13 (Climate Action):
        - Metric: GHG reduction: ${(metrics.annualTonnage * 0.9).toFixed(0)} tons CO2eq/year
   3.4. SDG 8 (Decent Work):
        - Metric: Jobs created with fair wages above minimum wage
   3.5. Other relevant SDGs with specific contributions

4. ESG SCORING METHODOLOGY
   4.1. Environmental score calculation (E = 40% of total):
        - Criteria: Carbon intensity, resource efficiency, pollution prevention
        - Benchmark: MSCI ESG Rating AAA-CCC scale
   4.2. Social score calculation (S = 30% of total):
        - Criteria: Labor practices, community relations, health & safety
   4.3. Governance score (G = 30% of total):
        - Criteria: Board diversity, ethics, transparency
   4.4. Projected ESG rating with improvement roadmap

5. GREEN FINANCING ELIGIBILITY (WITH CRITERIA CHECKLIST)
   5.1. Green Bond Principles (ICMA) alignment:
        - Use of Proceeds: Waste management and recycling (Category 5)
        - Process for Project Evaluation
        - Management of Proceeds
        - Reporting requirements
   5.2. Climate fund eligibility: GCF, CIF criteria met?
   5.3. Development bank criteria: IFC Performance Standards, BNDES social-environmental requirements
   5.4. Carbon credit potential:
        - Methodology: VCS VM0044 or Gold Standard for waste diversion
        - Estimated credits: ${(metrics.annualTonnage * 0.9).toFixed(0)} tCO2/year x $15-50/credit
   5.5. Impact investor criteria alignment

Every metric must show its source and calculation methodology.`
  };

  const result: CollaborativeAnalysisResult = {
    financial: null,
    regulatory: null,
    market: null,
    esg: null,
    synthesis: null,
    keysUsed: 0,
    successfulKeys: []
  };

  // Assign keys to different analysis aspects
  const tasks: Promise<void>[] = [];
  const aspects: (keyof typeof prompts)[] = ['financial', 'regulatory', 'market', 'esg'];

  for (let i = 0; i < Math.min(aspects.length, availableKeys.length); i++) {
    const aspect = aspects[i];
    const keyInfo = availableKeys[i];
    
    tasks.push(
      callGeminiWithKey(keyInfo.key, keyInfo.index, prompts[aspect], 2048)
        .then(res => {
          if (res.success && res.content) {
            result[aspect] = res.content;
            result.successfulKeys.push(keyInfo.index);
          }
        })
    );
    result.keysUsed++;
  }

  // Run all analyses in parallel
  await Promise.all(tasks);

  // If we have at least 2 successful analyses, synthesize them
  const successCount = result.successfulKeys.length;
  console.log(`📊 Collaborative analysis: ${successCount}/4 aspects completed`);

  if (successCount >= 2 && availableKeys.length > 4) {
    // Use another key to synthesize results
    const synthesisKey = availableKeys[4];
    if (synthesisKey) {
      const synthesisPrompt = `${langInstruction}

CRITICAL FORMATTING RULES:
- DO NOT use markdown formatting (no **, ##, ###, *, -, etc.)
- DO NOT use emojis or special characters
- Use plain text with numbered sections (1., 1.1., 1.1.1., etc.)
- Write in formal corporate/technical language as a senior industrial consultant

You are a senior consultant with PhD in Industrial Engineering and International Business Law.

Synthesize these specialized analyses into a cohesive executive report for "${study.study_name}":

FINANCIAL ANALYSIS
${result.financial ? result.financial.substring(0, 1500) : 'Not available'}

REGULATORY ANALYSIS
${result.regulatory ? result.regulatory.substring(0, 1500) : 'Not available'}

MARKET ANALYSIS
${result.market ? result.market.substring(0, 1500) : 'Not available'}

ESG ANALYSIS
${result.esg ? result.esg.substring(0, 1500) : 'Not available'}

Create an EXECUTIVE SYNTHESIS that:
1. Provides a definitive viability rating with quantitative justification
2. Summarizes the TOP 5 strengths with specific metrics and sources
3. Lists the TOP 5 risks with probability and impact assessment
4. Provides 5 actionable recommendations with timeline and responsible parties
5. Concludes with a clear GO/NO-GO recommendation and conditions

Use professional report format with numbered sections. No markdown or emojis.`;

      const synthesisResult = await callGeminiWithKey(synthesisKey.key, synthesisKey.index, synthesisPrompt, 3000);
      if (synthesisResult.success) {
        result.synthesis = synthesisResult.content;
        result.keysUsed++;
        result.successfulKeys.push(synthesisKey.index);
      }
    }
  }

  return result;
}

// Format collaborative analysis as final document - PROFESSIONAL FORMAT
function formatCollaborativeAnalysis(
  study: FeasibilityStudy,
  collab: CollaborativeAnalysisResult,
  metrics: Record<string, number>,
  language: string
): string {
  const headers = language === 'pt' ? {
    title: 'RELATORIO DE VIABILIDADE COLABORATIVA',
    subtitle: 'Analise Multi-Perspectiva com Inteligencia Artificial',
    stats: 'Estatisticas da Analise',
    financial: 'SECAO 1: ANALISE FINANCEIRA',
    regulatory: 'SECAO 2: ANALISE REGULATORIA',
    market: 'SECAO 3: ANALISE DE MERCADO',
    esg: 'SECAO 4: ANALISE ESG',
    synthesis: 'RESUMO EXECUTIVO'
  } : {
    title: 'COLLABORATIVE FEASIBILITY REPORT',
    subtitle: 'Multi-Perspective AI Analysis',
    stats: 'Analysis Statistics',
    financial: 'SECTION 1: FINANCIAL ANALYSIS',
    regulatory: 'SECTION 2: REGULATORY ANALYSIS',
    market: 'SECTION 3: MARKET ANALYSIS',
    esg: 'SECTION 4: ESG ANALYSIS',
    synthesis: 'EXECUTIVE SUMMARY'
  };

  // Clean any markdown artifacts from AI responses
  const cleanMarkdown = (text: string): string => {
    if (!text) return '';
    return text
      .replace(/#{1,6}\s*/g, '') // Remove headers ##
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold **
      .replace(/\*([^*]+)\*/g, '$1') // Remove italic *
      .replace(/`([^`]+)`/g, '$1') // Remove inline code
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/^\s*[-*]\s+/gm, '  - ') // Clean bullet points
      .replace(/^\s*>\s*/gm, '') // Remove blockquotes
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
      .trim();
  };

  let doc = `${headers.title}

${study.study_name} | ${study.location || study.country}

${headers.subtitle}: ${collab.keysUsed} ${language === 'pt' ? 'chaves Gemini utilizadas' : 'Gemini keys utilized'}, ${collab.successfulKeys.length} ${language === 'pt' ? 'analises bem-sucedidas' : 'successful analyses'}

${'='.repeat(80)}

`;

  if (collab.synthesis) {
    doc += `${headers.synthesis}\n\n${cleanMarkdown(collab.synthesis)}\n\n${'='.repeat(80)}\n\n`;
  }

  if (collab.financial) {
    doc += `${headers.financial}\n\n${cleanMarkdown(collab.financial)}\n\n${'-'.repeat(80)}\n\n`;
  }

  if (collab.regulatory) {
    doc += `${headers.regulatory}\n\n${cleanMarkdown(collab.regulatory)}\n\n${'-'.repeat(80)}\n\n`;
  }

  if (collab.market) {
    doc += `${headers.market}\n\n${cleanMarkdown(collab.market)}\n\n${'-'.repeat(80)}\n\n`;
  }

  if (collab.esg) {
    doc += `${headers.esg}\n\n${cleanMarkdown(collab.esg)}\n\n${'-'.repeat(80)}\n\n`;
  }

  doc += `\n${language === 'pt' ? 'Relatorio gerado por ELP Green Technology - Sistema de Analise Colaborativa' : 'Report generated by ELP Green Technology - Collaborative Analysis System'}\n${new Date().toISOString().split('T')[0]}`;

  return doc;
}

// =============================================================================
// MAIN REQUEST HANDLER
// =============================================================================
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const userJwt = authHeader.replace("Bearer ", "").trim();
    const clientKey = userJwt || req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "anonymous";
    
    if (isRateLimited(clientKey)) {
      console.warn(`Rate limit hit for client: ${clientKey.substring(0, 20)}...`);
      return new Response(
        JSON.stringify({ error: "rate_limited", message: "Too many requests. Please wait 60 seconds." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" } }
      );
    }

    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "method_not_allowed", message: "Only POST requests are accepted" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let payload: { 
      study: FeasibilityStudy; 
      language?: string; 
      model?: 'local' | 'flash' | 'pro' | 'collaborative' | 'advanced-7ai';
      enabledSpecialists?: Array<'mathematical' | 'industrial' | 'economic' | 'search' | 'probability' | 'legal' | 'sustainability'>;
      advancedOptions?: {
        includeMonteCarlo?: boolean;
        includeNPVSensitivity?: boolean;
        includeESGMetrics?: boolean;
        includeLegalFramework?: boolean;
        includeWebSearch?: boolean;
        iterations?: number;
      };
      otrReference?: {
        tireModels: Array<{ model: string; weight: number; composition: Record<string, number>; recoverable: Record<string, number> }>;
        marketPrices: Record<string, { min: number; max: number; avg: number }>;
        lastUpdated: string;
      };
      fiscalIncentives?: {
        country: string;
        corporateTax: number;
        regions: Array<{
          id: string;
          name: string;
          effectiveTax: number;
          incentives: Array<{ type: string; value: string; agency: string; descKey: string }>;
          regulations: string[];
        }>;
      };
    };
    try {
      payload = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "invalid_json", message: "Request body must be valid JSON" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { study, language = 'en', model = 'local', otrReference, fiscalIncentives, enabledSpecialists, advancedOptions } = payload;
    
    const validation = validateStudyPayload(study);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: "invalid_payload", message: validation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Processing request - Client: ${clientKey.substring(0, 20)}..., Model: ${model}, Language: ${language}`);

    // Extract values with safe defaults
    const dailyCapacity = safeNum(study.daily_capacity_tons, 50);
    const operatingDays = safeNum(study.operating_days_per_year, 300);
    const utilizationRate = safeNum(study.utilization_rate, 85);
    const totalInvestment = safeNum(study.total_investment, 5000000);
    const annualRevenue = safeNum(study.annual_revenue, 0);
    const annualOpex = safeNum(study.annual_opex, 0);
    const annualEbitda = safeNum(study.annual_ebitda, 0);
    const paybackMonths = safeNum(study.payback_months, 60);
    const roiPercentage = safeNum(study.roi_percentage, 0);
    const npv10Years = safeNum(study.npv_10_years, 0);
    const irrPercentage = safeNum(study.irr_percentage, 0);
    const rubberGranulesYield = safeNum(study.rubber_granules_yield, 45);
    const rubberGranulesPrice = safeNum(study.rubber_granules_price, 350);
    const steelWireYield = safeNum(study.steel_wire_yield, 25);
    const steelWirePrice = safeNum(study.steel_wire_price, 200);
    const textileFiberYield = safeNum(study.textile_fiber_yield, 20);
    const textileFiberPrice = safeNum(study.textile_fiber_price, 50);
    const royaltiesPercent = safeNum(study.government_royalties_percent, 0);
    const envBonusPerTon = safeNum(study.environmental_bonus_per_ton, 0);

    // Calculate metrics
    const annualTonnage = dailyCapacity * operatingDays * (utilizationRate / 100);
    const ebitdaMargin = annualRevenue > 0 ? (annualEbitda / annualRevenue) * 100 : 0;
    const revenuePerTon = annualTonnage > 0 ? annualRevenue / annualTonnage : 0;
    const opexPerTon = annualTonnage > 0 ? annualOpex / annualTonnage : 0;
    const rubberRevenue = annualTonnage * (rubberGranulesYield / 100) * rubberGranulesPrice;
    const steelRevenue = annualTonnage * (steelWireYield / 100) * steelWirePrice;
    const fiberRevenue = annualTonnage * (textileFiberYield / 100) * textileFiberPrice;
    const annualRoyalties = annualRevenue * (royaltiesPercent / 100);
    const annualEnvBonus = annualTonnage * envBonusPerTon;
    const netRevenueAfterRoyalties = annualRevenue - annualRoyalties - annualEnvBonus;

    const country = study.country || 'Unknown';
    const regulations = countryRegulations[country] || defaultRegulations;

    const metrics = {
      annualTonnage,
      ebitdaMargin,
      revenuePerTon,
      opexPerTon,
      rubberRevenue,
      steelRevenue,
      fiberRevenue,
      annualRoyalties,
      annualEnvBonus,
      netRevenueAfterRoyalties
    };

    let analysis = "";
    let usedModel = model;
    let didFallback = false;

    // =======================================================================
    // MODEL SELECTION: local, flash, pro, collaborative, advanced-7ai
    // =======================================================================
    
    // ADVANCED 7-AI MODE: 7 specialized AI experts in parallel
    if (model === 'advanced-7ai') {
      console.log(`🧠 Starting Advanced 7-AI Specialist analysis...`);
      const startTime = Date.now();
      
      const activeSpecialists = enabledSpecialists || ['mathematical', 'industrial', 'economic', 'search', 'probability', 'legal', 'sustainability'];
      const specialistResults: Record<string, { content: string | null; success: boolean; error?: string; duration?: number }> = {};
      
      // Get available keys
      const availableKeys = getAvailableKeysForCollaboration(7);
      console.log(`📊 ${availableKeys.length} Gemini keys available for ${activeSpecialists.length} specialists`);
      
      // Define specialized prompts for each AI expert
      const specialistPrompts: Record<string, string> = {
        mathematical: `You are a Senior Mathematical Engineer with PhD in Applied Mathematics, specializing in financial modeling and industrial calculations.

LANGUAGE: Respond in ${language === 'pt' ? 'Portuguese' : language === 'es' ? 'Spanish' : language === 'zh' ? 'Chinese' : language === 'it' ? 'Italian' : 'English'}.

Analyze this OTR tire recycling project with advanced mathematical rigor:

PROJECT DATA:
- Investment: USD ${(totalInvestment / 1000000).toFixed(2)}M
- Annual Revenue: USD ${(annualRevenue / 1000000).toFixed(2)}M
- Annual OPEX: USD ${(annualOpex / 1000000).toFixed(2)}M
- ROI: ${roiPercentage.toFixed(1)}%
- IRR: ${irrPercentage.toFixed(1)}%
- NPV (10y): USD ${(npv10Years / 1000000).toFixed(2)}M
- Payback: ${paybackMonths} months
- Daily Capacity: ${dailyCapacity} tons

Provide detailed MATHEMATICAL ANALYSIS including:

1. FINANCIAL FORMULAS WITH CALCULATIONS
   1.1. ROI Derivation: ROI = (EBITDA / Investment) × 100
        Calculation: (${(annualEbitda/1000000).toFixed(2)}M / ${(totalInvestment/1000000).toFixed(2)}M) × 100 = ${roiPercentage.toFixed(1)}%
   
   1.2. NPV Formula: NPV = Σ[CF_t / (1 + r)^t] - C_0
        Where: CF_t = Annual Cash Flow, r = discount rate (${safeNum(study.discount_rate, 12)}%), C_0 = Initial Investment
        
   1.3. IRR Calculation: Solve for r where NPV = 0
        Result: ${irrPercentage.toFixed(1)}% vs WACC benchmark (10-12%)

2. SENSITIVITY ANALYSIS
   2.1. Revenue sensitivity: Impact of ±10%, ±20% price changes
   2.2. Cost sensitivity: Impact of ±15%, ±25% OPEX changes
   2.3. Utilization sensitivity: Impact at 70%, 80%, 90%, 100% capacity

3. MONTE CARLO SIMULATION RESULTS (1000 iterations)
   3.1. NPV distribution: Mean, Std Dev, 5th/95th percentiles
   3.2. Probability of positive NPV: P(NPV > 0)
   3.3. Value at Risk (VaR 95%): Maximum expected loss

4. BREAK-EVEN ANALYSIS
   4.1. Break-even tonnage = Fixed Costs / Contribution Margin
   4.2. Break-even revenue per ton
   4.3. Margin of safety percentage

5. OPTIMIZATION RECOMMENDATIONS
   5.1. Optimal capacity utilization for maximum ROI
   5.2. Price optimization strategy
   5.3. Cost reduction targets

Use professional engineering notation. No markdown formatting.`,

        industrial: `You are a Senior Industrial Engineer with 30+ years in OTR tire recycling plant design and operations.

LANGUAGE: Respond in ${language === 'pt' ? 'Portuguese' : language === 'es' ? 'Spanish' : language === 'zh' ? 'Chinese' : language === 'it' ? 'Italian' : 'English'}.

Analyze the industrial implementation for this project:

PROJECT DATA:
- Location: ${study.location || country}
- Daily Capacity: ${dailyCapacity} tons/day
- Annual Production: ${annualTonnage.toFixed(0)} tons
- Equipment Cost: USD ${(safeNum(study.equipment_cost, 0)/1000000).toFixed(2)}M
- Infrastructure: USD ${(safeNum(study.infrastructure_cost, 0)/1000000).toFixed(2)}M

Provide detailed INDUSTRIAL IMPLEMENTATION ANALYSIS:

1. PLANT LAYOUT OPTIMIZATION
   1.1. Optimal facility size (m²) for ${dailyCapacity} tons/day capacity
   1.2. Equipment positioning for maximum efficiency
   1.3. Material flow optimization (receiving → processing → storage)
   1.4. Safety zones and emergency access requirements

2. EQUIPMENT SPECIFICATIONS
   2.1. Primary shredder capacity and power requirements
   2.2. Secondary granulator specifications
   2.3. Magnetic separation efficiency targets
   2.4. Dust collection and air quality systems

3. PRODUCTION OPTIMIZATION
   3.1. Bottleneck analysis for current configuration
   3.2. Throughput optimization strategies
   3.3. Shift scheduling for maximum utilization
   3.4. Maintenance scheduling (preventive vs reactive)

4. SCALABILITY ANALYSIS
   4.1. Phase 1 capacity: ${dailyCapacity} tons/day
   4.2. Phase 2 expansion potential (2x capacity)
   4.3. Modular equipment additions
   4.4. Infrastructure requirements for expansion

5. BENCHMARKING
   5.1. Comparison with TOPS Recycling (China)
   5.2. Comparison with Genan (Germany)
   5.3. Comparison with Tyrecycle (Australia)
   5.4. Competitive advantages/gaps

Use professional engineering notation. No markdown formatting.`,

        economic: `You are a Senior Financial Analyst specializing in industrial investments with CFA and expertise in project finance.

LANGUAGE: Respond in ${language === 'pt' ? 'Portuguese' : language === 'es' ? 'Spanish' : language === 'zh' ? 'Chinese' : language === 'it' ? 'Italian' : 'English'}.

Provide comprehensive ECONOMIC VIABILITY ANALYSIS:

PROJECT FINANCIALS:
- Total Investment: USD ${(totalInvestment / 1000000).toFixed(2)}M
- Annual Revenue: USD ${(annualRevenue / 1000000).toFixed(2)}M
- Annual OPEX: USD ${(annualOpex / 1000000).toFixed(2)}M
- EBITDA: USD ${(annualEbitda / 1000000).toFixed(2)}M
- EBITDA Margin: ${ebitdaMargin.toFixed(1)}%
- ROI: ${roiPercentage.toFixed(1)}%
- IRR: ${irrPercentage.toFixed(1)}%
- NPV (10y): USD ${(npv10Years / 1000000).toFixed(2)}M
- Payback: ${paybackMonths} months

1. INVESTMENT VIABILITY CLASSIFICATION
   1.1. Rating: ${roiPercentage >= 25 ? 'EXCELLENT' : roiPercentage >= 15 ? 'GOOD' : roiPercentage >= 10 ? 'MODERATE' : 'RISKY'}
   1.2. Justification with industry benchmarks
   1.3. Comparison with alternative investments

2. DETAILED ROI/NPV/IRR ANALYSIS
   2.1. ROI vs industry benchmark (15-25%)
   2.2. IRR vs cost of capital (10-12%)
   2.3. NPV sensitivity to discount rate changes
   2.4. Payback period vs industry standard (36-60 months)

3. SCENARIO ANALYSIS
   3.1. Base case (current projections)
   3.2. Optimistic (+20% revenue, -10% costs)
   3.3. Pessimistic (-20% revenue, +15% costs)
   3.4. Break-even scenario

4. CAPITAL STRUCTURE RECOMMENDATIONS
   4.1. Optimal debt/equity ratio (60:40 to 70:30)
   4.2. Financing options: BNDES, IFC, commercial banks
   4.3. Collateral requirements
   4.4. Interest rate sensitivity

5. VALUE CREATION METRICS
   5.1. Economic Value Added (EVA)
   5.2. Return on Invested Capital (ROIC)
   5.3. Free Cash Flow projections (10 years)
   5.4. Terminal value estimation

Use professional financial notation. No markdown formatting.`,

        search: `You are a Market Research Analyst with expertise in circular economy and recycling industry data.

LANGUAGE: Respond in ${language === 'pt' ? 'Portuguese' : language === 'es' ? 'Spanish' : language === 'zh' ? 'Chinese' : language === 'it' ? 'Italian' : 'English'}.

Provide MARKET DATA AND REGULATORY SEARCH results for ${country}:

PROJECT CONTEXT:
- Location: ${study.location || country}
- Sector: OTR Tire Recycling
- Capacity: ${dailyCapacity} tons/day
- Products: Rubber granules, steel wire, textile fiber, rCB

1. CURRENT MARKET PRICES (2025-2026)
   1.1. Rubber granules: Current price range and trend
   1.2. Recovered steel: Current price range and trend
   1.3. Textile fiber: Current price range and trend
   1.4. rCB (Carbon Black): Current price range and trend
   Source: Industry reports, commodity exchanges

2. REGULATORY FRAMEWORK FOR ${country}
   2.1. Environmental agency and main laws
   2.2. Required licenses and permits
   2.3. Timeline for licensing (typical)
   2.4. Recent regulatory changes (2024-2025)

3. TAX INCENTIVES AND SUBSIDIES
   3.1. Federal/national incentives
   3.2. State/regional incentives for ${study.location || country}
   3.3. Green financing programs
   3.4. Carbon credit eligibility

4. COMPETITIVE LANDSCAPE
   4.1. Existing recyclers in ${country}
   4.2. Market share distribution
   4.3. Entry barriers
   4.4. Competitive advantages for new entrants

5. DEMAND PROJECTIONS
   5.1. Rubber granules demand growth (2025-2030)
   5.2. Key buyer segments
   5.3. Export opportunities
   5.4. Market size estimation

Cite specific sources for each data point. No markdown formatting.`,

        probability: `You are a Risk Analyst with PhD in Statistics, specializing in industrial project risk assessment.

LANGUAGE: Respond in ${language === 'pt' ? 'Portuguese' : language === 'es' ? 'Spanish' : language === 'zh' ? 'Chinese' : language === 'it' ? 'Italian' : 'English'}.

Provide PROBABILISTIC RISK ANALYSIS:

PROJECT PARAMETERS:
- Investment: USD ${(totalInvestment / 1000000).toFixed(2)}M
- Annual Revenue: USD ${(annualRevenue / 1000000).toFixed(2)}M
- ROI: ${roiPercentage.toFixed(1)}%
- IRR: ${irrPercentage.toFixed(1)}%
- NPV: USD ${(npv10Years / 1000000).toFixed(2)}M

1. PROBABILITY DISTRIBUTIONS
   1.1. Revenue: Normal distribution, μ = ${annualRevenue.toFixed(0)}, σ = ${(annualRevenue * 0.15).toFixed(0)}
   1.2. Costs: Lognormal distribution parameters
   1.3. Prices: Triangular distribution (min, mode, max)
   1.4. Utilization: Beta distribution parameters

2. MONTE CARLO SIMULATION (1000 iterations)
   2.1. NPV distribution: Mean, Median, Std Dev
   2.2. IRR distribution: Mean, Median, Std Dev
   2.3. Payback distribution: Mean, Median, Std Dev
   2.4. Probability of project success P(NPV > 0)

3. VALUE AT RISK (VaR)
   3.1. VaR 95%: Maximum loss at 95% confidence
   3.2. VaR 99%: Maximum loss at 99% confidence
   3.3. Conditional VaR (CVaR/Expected Shortfall)
   3.4. Risk-adjusted return metrics

4. SENSITIVITY TORNADO CHART
   4.1. Top 5 variables by impact on NPV
   4.2. Correlation coefficients with NPV
   4.3. Critical success factors
   4.4. Risk mitigation priorities

5. RISK MATRIX
   5.1. High probability, high impact risks
   5.2. Low probability, high impact risks
   5.3. Risk mitigation strategies
   5.4. Contingency reserves recommendation

Use professional statistical notation. No markdown formatting.`,

        legal: `You are a Senior Environmental Lawyer with 20+ years specializing in industrial licensing and waste management regulations in ${country}.

LANGUAGE: Respond in ${language === 'pt' ? 'Portuguese' : language === 'es' ? 'Spanish' : language === 'zh' ? 'Chinese' : language === 'it' ? 'Italian' : 'English'}.

Provide COMPREHENSIVE LEGAL AND REGULATORY ANALYSIS:

REGULATORY FRAMEWORK:
Agency: ${regulations.agency}
Main Laws: ${regulations.mainLaws.join('; ')}
Licenses: ${regulations.licenses.join('; ')}

1. ENVIRONMENTAL LICENSING REQUIREMENTS
   1.1. License types: LP (Preliminary), LI (Installation), LO (Operation)
   1.2. EIA/RIMA requirements and scope
   1.3. Timeline: ${country === 'Brazil' ? '6-18 months' : '4-12 months'}
   1.4. Costs and fees estimation

2. SPECIFIC LAWS AND REGULATIONS (cite article numbers)
   2.1. ${regulations.mainLaws[0]} - Key articles
   2.2. ${regulations.mainLaws[1] || 'Additional regulations'} - Requirements
   2.3. ${regulations.mainLaws[2] || 'Environmental codes'} - Compliance
   2.4. State/regional specific requirements

3. LABOR AND SAFETY COMPLIANCE
   3.1. ${regulations.laborRegulations[0]} requirements
   3.2. Safety certifications (NR-12, OSHA equivalents)
   3.3. Training and certification requirements
   3.4. Insurance requirements (workers comp, liability)

4. TAX AND FISCAL OBLIGATIONS
   4.1. Corporate tax rate: ${safeNum(study.tax_rate, 25)}%
   4.2. ${regulations.taxIncentives[0]} - How to apply
   4.3. ${regulations.taxIncentives[1] || 'Regional incentives'}
   4.4. Tax compliance checklist

5. IMPORT/EXPORT REGULATIONS
   5.1. Equipment import procedures
   5.2. Product export documentation
   5.3. Customs requirements
   5.4. Trade agreements applicable

Include specific law numbers and article citations. No markdown formatting.`,

        sustainability: `You are a Senior ESG Analyst and Sustainability Consultant with expertise in circular economy and Net Zero strategies.

LANGUAGE: Respond in ${language === 'pt' ? 'Portuguese' : language === 'es' ? 'Spanish' : language === 'zh' ? 'Chinese' : language === 'it' ? 'Italian' : 'English'}.

Provide COMPREHENSIVE ESG AND SUSTAINABILITY ANALYSIS:

PROJECT DATA:
- Annual Tonnage: ${annualTonnage.toFixed(0)} tons recycled
- Location: ${study.location || country}
- Products: Rubber granules, steel, textile, rCB

1. ESG SCORE CALCULATION
   1.1. Environmental (40%): Score based on waste diverted, emissions avoided
   1.2. Social (30%): Jobs created, community impact, safety
   1.3. Governance (30%): Compliance, transparency, ethics
   1.4. Overall ESG Score: Weighted average (0-100)

2. CARBON FOOTPRINT ANALYSIS
   2.1. CO2 avoided = ${annualTonnage.toFixed(0)} tons × 0.7 tCO2/ton = ${(annualTonnage * 0.7).toFixed(0)} tCO2/year
   2.2. Comparison with landfill alternative
   2.3. Carbon credit potential (voluntary market)
   2.4. Scope 1, 2, 3 emissions breakdown

3. CIRCULAR ECONOMY METRICS
   3.1. Material circularity indicator
   3.2. Resource efficiency ratio
   3.3. Waste hierarchy compliance
   3.4. Extended Producer Responsibility alignment

4. SDG ALIGNMENT
   4.1. SDG 12 (Responsible Consumption): Tire recycling contribution
   4.2. SDG 13 (Climate Action): Emissions reduction
   4.3. SDG 8 (Decent Work): Job creation (30-50 direct jobs)
   4.4. SDG 9 (Industry & Innovation): Technology transfer

5. NET ZERO PATHWAY
   5.1. Current carbon footprint baseline
   5.2. Reduction targets (2025, 2030, 2050)
   5.3. Offset strategies
   5.4. Science-Based Targets alignment

Calculate specific metrics with formulas. No markdown formatting.`
      };

      // Execute specialist analyses in parallel
      const specialistPromises = activeSpecialists.map(async (specialistId, idx) => {
        const keyInfo = availableKeys[idx % availableKeys.length];
        if (!keyInfo) {
          return { id: specialistId, success: false, error: 'No API key available' };
        }
        
        const prompt = specialistPrompts[specialistId];
        if (!prompt) {
          return { id: specialistId, success: false, error: 'Invalid specialist ID' };
        }
        
        const startTs = Date.now();
        try {
          const result = await callGeminiWithKey(keyInfo.key, keyInfo.index, prompt, 2500);
          return {
            id: specialistId,
            success: result.success,
            content: result.content,
            error: result.error,
            duration: (Date.now() - startTs) / 1000
          };
        } catch (err) {
          return {
            id: specialistId,
            success: false,
            error: String(err),
            duration: (Date.now() - startTs) / 1000
          };
        }
      });

      const results = await Promise.all(specialistPromises);
      
      // Collect results
      let successCount = 0;
      const keysUsedSet = new Set<number>();
      
      results.forEach((res, idx) => {
        specialistResults[res.id] = {
          content: res.content || null,
          success: res.success,
          error: res.error,
          duration: res.duration
        };
        if (res.success) {
          successCount++;
          keysUsedSet.add(idx % availableKeys.length);
        }
      });

      // Generate consolidated analysis
      const consolidatedParts: string[] = [];
      const sectionHeaders: Record<string, string> = {
        mathematical: language === 'pt' ? 'ANÁLISE MATEMÁTICA AVANÇADA' : 'ADVANCED MATHEMATICAL ANALYSIS',
        industrial: language === 'pt' ? 'IMPLEMENTAÇÃO INDUSTRIAL' : 'INDUSTRIAL IMPLEMENTATION',
        economic: language === 'pt' ? 'VIABILIDADE ECONÔMICA' : 'ECONOMIC VIABILITY',
        search: language === 'pt' ? 'DADOS DE MERCADO E REGULATÓRIOS' : 'MARKET AND REGULATORY DATA',
        probability: language === 'pt' ? 'ANÁLISE PROBABILÍSTICA DE RISCO' : 'PROBABILISTIC RISK ANALYSIS',
        legal: language === 'pt' ? 'CONFORMIDADE JURÍDICA' : 'LEGAL COMPLIANCE',
        sustainability: language === 'pt' ? 'SUSTENTABILIDADE E ESG' : 'SUSTAINABILITY AND ESG'
      };

      activeSpecialists.forEach(id => {
        const result = specialistResults[id];
        if (result?.content) {
          consolidatedParts.push(`\n${'='.repeat(80)}\n${sectionHeaders[id]}\n${'='.repeat(80)}\n\n${result.content}\n`);
        }
      });

      const consolidatedAnalysis = `RELATÓRIO DE VIABILIDADE AVANÇADO - 7 IAs ESPECIALIZADAS
${study.study_name} | ${study.location || country}

Análise realizada em: ${new Date().toISOString().split('T')[0]}
Especialistas utilizados: ${successCount}/${activeSpecialists.length}
Tempo total: ${((Date.now() - startTime) / 1000).toFixed(1)}s

${consolidatedParts.join('\n')}

${'='.repeat(80)}
CONCLUSÃO
${'='.repeat(80)}

Estudo de viabilidade processado com ${successCount} IAs especializadas.
Classificação geral: ${roiPercentage >= 25 ? 'EXCELENTE' : roiPercentage >= 15 ? 'BOM' : roiPercentage >= 10 ? 'MODERADO' : 'ARRISCADO'}
ROI: ${roiPercentage.toFixed(1)}% | TIR: ${irrPercentage.toFixed(1)}% | Payback: ${paybackMonths} meses

Relatório gerado por ELP Green Technology - Sistema Avançado de Análise com 7 IAs
`;

      console.log(`✅ Advanced 7-AI analysis complete: ${successCount}/${activeSpecialists.length} specialists, ${(Date.now() - startTime) / 1000}s`);

      return new Response(JSON.stringify({ 
        analysis: consolidatedAnalysis,
        model_used: 'advanced-7ai',
        did_fallback: false,
        specialist_results: specialistResults,
        stats: {
          keys_used: keysUsedSet.size,
          successful_analyses: successCount,
          total_specialists: activeSpecialists.length,
          total_time: (Date.now() - startTime) / 1000
        },
        metrics,
        regulations: { country, ...regulations },
        otr_reference_used: !!otrReference,
        fiscal_incentives_used: !!fiscalIncentives
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // COLLABORATIVE MODE: Uses multiple keys in parallel for multi-perspective analysis
    if (model === 'collaborative') {
      console.log(`🤝 Starting collaborative multi-key analysis...`);
      
      try {
        const collabResult = await runCollaborativeAnalysis(
          study,
          metrics,
          regulations,
          language,
          fiscalIncentives,
          otrReference
        );
        
        if (collabResult.successfulKeys.length > 0) {
          analysis = formatCollaborativeAnalysis(study, collabResult, metrics, language);
          usedModel = "collaborative";
          console.log(`✅ Collaborative analysis complete: ${collabResult.successfulKeys.length} aspects analyzed using ${collabResult.keysUsed} keys`);
          
          return new Response(JSON.stringify({ 
            analysis,
            model_used: usedModel,
            did_fallback: false,
            collaborative_stats: {
              keys_used: collabResult.keysUsed,
              successful_analyses: collabResult.successfulKeys.length,
              aspects_completed: {
                financial: !!collabResult.financial,
                regulatory: !!collabResult.regulatory,
                market: !!collabResult.market,
                esg: !!collabResult.esg,
                synthesis: !!collabResult.synthesis
              }
            },
            metrics,
            regulations: { country, ...regulations },
            otr_reference_used: !!otrReference,
            fiscal_incentives_used: !!fiscalIncentives
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else {
          console.log(`⚠️ Collaborative analysis failed, falling back to flash...`);
          // Fall through to standard analysis
        }
      } catch (collabError) {
        console.error('Collaborative analysis error:', collabError);
        // Fall through to standard analysis
      }
    }
    
    if (model === 'local' || GEMINI_API_KEYS.length === 0) {
      // Generate local template-based analysis
      if (GEMINI_API_KEYS.length === 0 && model !== 'local') {
        console.log(`No Gemini API keys configured, falling back to local analysis`);
        didFallback = true;
      }
      
      const analysisTexts = generateLocalAnalysis(study, metrics, regulations, language);
      analysis = formatAnalysisAsMarkdown(study, analysisTexts, metrics, regulations, language);
      usedModel = "local";
      
    } else if (model === 'flash' || model === 'pro' || (model === 'collaborative' && GEMINI_API_KEYS.length > 0)) {
      // Use Gemini API for flash or pro analysis (or collaborative fallback)
      console.log(`Starting Gemini analysis (${model})...`);
      
      const languageInstructions: Record<string, string> = {
        en: "MANDATORY: You MUST respond ENTIRELY in English. All text, headers, sections, analysis, and conclusions must be written in English language only.",
        pt: "OBRIGATORIO: Voce DEVE responder INTEIRAMENTE em Portugues do Brasil. Todo o texto, cabecalhos, secoes, analises e conclusoes devem ser escritos em portugues brasileiro.",
        es: "OBLIGATORIO: Debes responder ENTERAMENTE en Espanol. Todo el texto, encabezados, secciones, analisis y conclusiones deben estar escritos en idioma espanol.",
        zh: "必须要求：您必须完全用中文回复。所有文本、标题、章节、分析和结论都必须用中文撰写。",
        it: "OBBLIGATORIO: Devi rispondere INTERAMENTE in Italiano. Tutto il testo, intestazioni, sezioni, analisi e conclusioni devono essere scritti in lingua italiana."
      };

      const geminiPrompt = `${languageInstructions[language] || languageInstructions.en}

You are a senior industrial engineer specialized in OTR tire recycling plants with 25+ years of experience, combined with PhD-level expertise in international environmental law and import/export regulations.

CRITICAL FORMATTING RULES:
1. DO NOT use markdown formatting (no **, ##, ###, *, -, etc.)
2. DO NOT use emojis or special characters
3. Use plain text with numbered sections (1., 1.1., 1.1.1., etc.)
4. Use clear paragraph breaks between sections
5. Present data in professional tabular format with aligned columns
6. Write in formal corporate/technical language
7. Every statement must be supported by specific data, calculations, or regulatory references
8. Include specific laws, regulations, and their article numbers
9. Cite real market data sources (IBGE, World Bank, ILO, industry reports)
10. Use professional engineering notation for calculations

Analyze this OTR tire recycling plant feasibility study:

PROJECT: ${study.study_name}
Location: ${study.location || country}
Country: ${country}
Daily Capacity: ${dailyCapacity} tons/day
Operating Days: ${operatingDays} days/year
Utilization Rate: ${utilizationRate}%
Annual Production: ${annualTonnage.toFixed(0)} tons

INVESTMENT (CAPEX):
Total Investment: USD ${(totalInvestment / 1000000).toFixed(2)}M

REVENUE (ANNUAL):
Total Revenue: USD ${(annualRevenue / 1000000).toFixed(2)}M
Revenue per ton: USD ${revenuePerTon.toFixed(2)}

OPERATING COSTS (ANNUAL):
Total OPEX: USD ${(annualOpex / 1000000).toFixed(2)}M
Cost per ton: USD ${opexPerTon.toFixed(2)}

FINANCIAL METRICS:
Annual EBITDA: USD ${(annualEbitda / 1000000).toFixed(2)}M
EBITDA Margin: ${ebitdaMargin.toFixed(1)}%
ROI: ${roiPercentage.toFixed(1)}%
IRR: ${irrPercentage.toFixed(1)}%
NPV (10 years): USD ${(npv10Years / 1000000).toFixed(2)}M
Payback Period: ${paybackMonths} months

COUNTRY REGULATIONS (${country}):
Regulatory Agency: ${regulations.agency}
Main Laws: ${regulations.mainLaws.join('; ')}
Required Licenses: ${regulations.licenses.join('; ')}
Tax Incentives: ${regulations.taxIncentives.join('; ')}

${fiscalIncentives ? `
FISCAL INCENTIVES ANALYSIS (${fiscalIncentives.country}):
Standard Corporate Tax: ${fiscalIncentives.corporateTax}%
${fiscalIncentives.regions.map(r => `
Region: ${r.name} (Effective Tax: ${r.effectiveTax}%)
${r.incentives.map(i => '  - ' + i.type + ': ' + i.value + ' (' + i.agency + ')').join('\n')}
Regulations: ${r.regulations.join(', ')}
`).join('\n')}
` : ''}

${otrReference ? `
OTR TIRE COMPOSITION REFERENCE (${otrReference.lastUpdated}):
${otrReference.tireModels.slice(0, 3).map(t => 
  '  ' + t.model + ': ' + t.weight + 'kg (Rubber: ' + t.composition.rubber + '%, Steel: ' + t.composition.steel + '%, Textile: ' + t.composition.textile + '%)'
).join('\n')}

MARKET PRICES (${otrReference.lastUpdated}):
  Rubber Granules: $${otrReference.marketPrices.granules.avg}/ton (Range: $${otrReference.marketPrices.granules.min}-$${otrReference.marketPrices.granules.max})
  Recovered Steel: $${otrReference.marketPrices.steel.avg}/ton (Range: $${otrReference.marketPrices.steel.min}-$${otrReference.marketPrices.steel.max})
  Textile Fiber: $${otrReference.marketPrices.textile.avg}/ton (Range: $${otrReference.marketPrices.textile.min}-$${otrReference.marketPrices.textile.max})
  rCB (Carbon Black): $${otrReference.marketPrices.rcb.avg}/ton (Range: $${otrReference.marketPrices.rcb.min}-$${otrReference.marketPrices.rcb.max})
` : ''}

${model === 'pro' ? `
Provide an EXHAUSTIVE professional analysis covering ALL sections:

1. EXECUTIVE SUMMARY
   1.1. Viability Rating (Excellent/Good/Moderate/Risky/Not Recommended) with quantitative justification
   1.2. Key success factors and critical path
   1.3. Investment recommendation

2. REGULATORY FRAMEWORK FOR ${country}
   2.1. Environmental licensing requirements with specific law citations
   2.2. Industrial permits and timeline
   2.3. Import/export regulations for equipment and products

3. ENVIRONMENTAL COMPLIANCE
   3.1. EIA/RIMA requirements and costs
   3.2. Emission standards and monitoring
   3.3. Waste management plan requirements

4. FINANCIAL AND TAX INCENTIVES ANALYSIS
   4.1. Federal incentives with specific program names and agencies
   4.2. State/regional incentives with effective tax rates
   4.3. Green financing opportunities

5. LABOR AND SAFETY REQUIREMENTS
   5.1. Applicable safety standards with regulation numbers
   5.2. Training and certification requirements
   5.3. Insurance and liability requirements

6. MARKET ANALYSIS FOR ${study.location || country}
   6.1. Demand projections with sources
   6.2. Competitive landscape
   6.3. Price trends and outlook

7. KEY STRENGTHS (minimum 10 points)
   Use OTR tire composition data for specific revenue calculations

8. RISK FACTORS AND MITIGATION STRATEGIES
   8.1. Risk matrix with probability and impact
   8.2. Mitigation measures for each risk

9. IMPLEMENTATION RECOMMENDATIONS
   9.1. Phase-by-phase timeline
   9.2. Critical milestones
   9.3. Resource requirements

10. ESG ANALYSIS AND SDG ALIGNMENT
    10.1. Environmental impact metrics
    10.2. Social benefits quantification
    10.3. Carbon credit potential

Include specific calculations and cite data sources.
` : `
Provide a focused professional analysis covering:

1. VIABILITY ASSESSMENT
   1.1. Rating with quantitative justification
   1.2. Key financial indicators vs benchmarks

2. FINANCIAL METRICS SUMMARY
   2.1. ROI, IRR, NPV analysis
   2.2. Break-even analysis

3. TOP 5 STRENGTHS
   Use OTR composition data for calculations

4. TOP 5 RISKS
   With probability and impact assessment

5. PRIORITY RECOMMENDATIONS
   Include regional tax incentives

6. REGULATORY OVERVIEW FOR ${country}
   With specific law citations
`}

Write in professional report format. No markdown formatting.`;

      try {
        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
        let geminiSuccess = false;
        
        // Try each Gemini key until one works
        for (let keyAttempt = 0; keyAttempt < GEMINI_API_KEYS.length; keyAttempt++) {
          const currentKey = getNextGeminiKey();
          if (!currentKey) break;
          
          for (let attempt = 0; attempt < 2; attempt++) {
            try {
              console.log(`Trying Gemini key ${currentGeminiKeyIndex + 1}/${GEMINI_API_KEYS.length}, attempt ${attempt + 1}/2`);
              const response = await callExternalAPI(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${currentKey}`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    contents: [{ parts: [{ text: geminiPrompt }] }],
                    generationConfig: {
                      maxOutputTokens: model === 'pro' ? 8192 : 4096,
                      temperature: 0.7
                    }
                  }),
                },
                45000
              );

              if (response.ok) {
                const data = await response.json();
                analysis = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
                usedModel = model;
                geminiSuccess = true;
                console.log(`✅ Gemini key ${currentGeminiKeyIndex + 1} success`);
                break;
              }

              if (response.status === 429 || response.status === 529 || response.status === 503) {
                const errorText = await response.text();
                console.log(`⚠️ Gemini key ${currentGeminiKeyIndex + 1} rate-limited (${response.status}): ${errorText.substring(0, 100)}`);
                if (attempt < 1) {
                  const waitMs = Math.min(4000, 1000 * Math.pow(2, attempt));
                  await sleep(waitMs);
                  continue;
                }
                // Rotate to next key
                rotateGeminiKey();
                break;
              }

              const errorText = await response.text();
              console.error(`❌ Gemini key ${currentGeminiKeyIndex + 1} error (${response.status}):`, errorText.substring(0, 200));
              break;
              
            } catch (error) {
              if (error instanceof Error && error.message.includes('timeout')) {
                console.error(`Gemini timeout on attempt ${attempt + 1}/2`);
                if (attempt < 1) {
                  await sleep(1000);
                  continue;
                }
              }
              throw error;
            }
          }
          
          if (geminiSuccess) break;
        }

        // Fallback to local if all Gemini keys failed
        if (!geminiSuccess || !analysis) {
          console.log("⛔ All Gemini keys failed, falling back to local analysis...");
          didFallback = true;
          const analysisTexts = generateLocalAnalysis(study, metrics, regulations, language);
          analysis = formatAnalysisAsMarkdown(study, analysisTexts, metrics, regulations, language);
          usedModel = "local";
        }

      } catch (error) {
        console.error("Gemini API error:", error);
        didFallback = true;
        const analysisTexts = generateLocalAnalysis(study, metrics, regulations, language);
        analysis = formatAnalysisAsMarkdown(study, analysisTexts, metrics, regulations, language);
        usedModel = "local";
      }
    }

    console.log(`Analysis completed - Study: ${study.study_name}, Country: ${country}, Model: ${usedModel}, Fallback: ${didFallback}`);

    return new Response(JSON.stringify({ 
      analysis,
      model_used: usedModel,
      did_fallback: didFallback,
      metrics,
      regulations: {
        country,
        ...regulations
      },
      otr_reference_used: !!otrReference,
      fiscal_incentives_used: !!fiscalIncentives,
      fiscal_summary: fiscalIncentives ? {
        country: fiscalIncentives.country,
        corporateTax: fiscalIncentives.corporateTax,
        regionsCount: fiscalIncentives.regions?.length || 0
      } : null
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Analyze feasibility error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return new Response(
      JSON.stringify({ error: "internal_error", message: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

addEventListener('beforeunload', (ev: Event) => {
  const detail = (ev as CustomEvent).detail;
  console.log('Function shutdown -', detail?.reason || 'unknown reason');
});
