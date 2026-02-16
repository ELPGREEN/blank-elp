import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || Deno.env.get("URL_SUPABASE") || Deno.env.get("URL_SUPABAS");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

// ========== GEMINI 7-KEY POOL WITH AUTOMATIC ROTATION ==========
const GEMINI_API_KEYS = [
  Deno.env.get('GEMINI_API_KEY'),
  Deno.env.get('GEMINI_API_KEY_2'),
  Deno.env.get('GEMINI_API_KEY_3'),
  Deno.env.get('GEMINI_API_KEY_4'),
  Deno.env.get('GEMINI_API_KEY_5'),
  Deno.env.get('GEMINI_API_KEY_6'),
  Deno.env.get('GEMINI_API_KEY_7'),
].filter(Boolean) as string[];

let currentGeminiKeyIndex = 0;
const failedKeys = new Set<number>();
const failedKeyTimestamps = new Map<number, number>();
const KEY_COOLDOWN_MS = 60000;

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

// Validate required env vars at startup
if (GEMINI_API_KEYS.length === 0 && !ANTHROPIC_API_KEY) {
  console.error("Missing required environment variables: GEMINI_API_KEY and/or ANTHROPIC_API_KEY");
  throw new Error("Missing AI model API keys");
}

console.log(`Generate Document AI v2 - Gemini: ${GEMINI_API_KEYS.length}/7 keys, Anthropic: ${ANTHROPIC_API_KEY ? '✅' : '❌'}, Firecrawl: ${FIRECRAWL_API_KEY ? '✅' : '❌'}`);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ========== FIRECRAWL WEB SEARCH ==========
async function searchWebForLaws(query: string): Promise<string> {
  if (!FIRECRAWL_API_KEY) return '';
  try {
    console.log('Firecrawl searching:', query);
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
    console.log('Firecrawl found', excerpts.length, 'results');
    return excerpts.join('\n\n');
  } catch (e) { 
    console.error('Firecrawl error:', e);
    return ''; 
  }
}

// ============= RATE LIMITING =============
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 15; // max requests per window (stricter for document generation)
const rateMap = new Map<string, { count: number; windowStart: number }>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(key);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateMap.set(key, { count: 1, windowStart: now });
    return false;
  }
  if (entry.count >= RATE_LIMIT_MAX) return true;
  entry.count += 1;
  return false;
}

// ============= TIMEOUT HELPER =============
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
      throw new Error('Request timeout');
    }
    throw error;
  }
}

// ============= PAYLOAD VALIDATION =============
interface DocumentPayload {
  templateType: string;
  country?: string;
  language?: string;
  existingFields?: Record<string, unknown>;
  templateContent?: string;
  generateFullDocument?: boolean;
  partnerName?: string;
}

const VALID_TEMPLATE_TYPES = [
  'nda', 'nda_bilateral', 'joint_venture', 'kyc', 'consent',
  'contract', 'report', 'proposal', 'loi', 'mou'
];

function validatePayload(payload: unknown): { valid: true; data: DocumentPayload } | { valid: false; error: string } {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Invalid payload: expected object' };
  }

  const p = payload as Record<string, unknown>;

  // Required: templateType
  if (!p.templateType || typeof p.templateType !== 'string') {
    return { valid: false, error: 'Missing or invalid templateType' };
  }

  if (!VALID_TEMPLATE_TYPES.includes(p.templateType.toLowerCase())) {
    return { valid: false, error: `Invalid templateType. Valid options: ${VALID_TEMPLATE_TYPES.join(', ')}` };
  }

  // Optional validations
  if (p.country && typeof p.country !== 'string') {
    return { valid: false, error: 'Invalid country: expected string' };
  }

  if (p.language && typeof p.language !== 'string') {
    return { valid: false, error: 'Invalid language: expected string' };
  }

  if (p.templateContent && typeof p.templateContent !== 'string') {
    return { valid: false, error: 'Invalid templateContent: expected string' };
  }

  // Limit templateContent size to prevent abuse
  if (p.templateContent && (p.templateContent as string).length > 50000) {
    return { valid: false, error: 'templateContent exceeds maximum size (50KB)' };
  }

  return {
    valid: true,
    data: {
      templateType: (p.templateType as string).toLowerCase(),
      country: p.country as string | undefined,
      language: p.language as string | undefined,
      existingFields: p.existingFields as Record<string, unknown> | undefined,
      templateContent: p.templateContent as string | undefined,
      generateFullDocument: p.generateFullDocument as boolean | undefined,
      partnerName: p.partnerName as string | undefined,
    }
  };
}

// Country-specific legal frameworks  
const countryLegalData: Record<
  string,
  {
    dataProtection: string;
    contractLaw: string;
    jurisdiction: string;
    language: string;
    currency: string;
    governingLaw: string;
    arbitration: string;
    taxId: string;
    corporateTypes: string[];
    specificLaws: string[];
    requiredClauses: string[];
    signatureRequirements: string;
    witnessRequirements: string;
    notarizationRequired: boolean;
  }
> = {
  brazil: {
    dataProtection: "LGPD (Lei 13.709/2018)",
    contractLaw: "Código Civil Brasileiro (Lei 10.406/2002)",
    jurisdiction: "Foro da Comarca de São Paulo/SP",
    language: "pt",
    currency: "BRL",
    governingLaw: "Leis da República Federativa do Brasil",
    arbitration: "Câmara de Comércio Brasil-Itália (CCBI)",
    taxId: "CNPJ",
    corporateTypes: ["S/A", "Ltda.", "EIRELI", "MEI", "EPP"],
    specificLaws: [
      "Lei 10.406/2002 - Código Civil Brasileiro",
      "Lei 13.709/2018 - Lei Geral de Proteção de Dados (LGPD)",
      "Lei 9.279/1996 - Lei de Propriedade Industrial",
      "Lei 9.610/1998 - Lei de Direitos Autorais",
      "Lei 8.078/1990 - Código de Defesa do Consumidor",
      "Lei 12.846/2013 - Lei Anticorrupção",
      "Lei 12.305/2010 - Política Nacional de Resíduos Sólidos",
      "Lei 6.938/1981 - Política Nacional do Meio Ambiente",
      "Decreto 7.404/2010 - Regulamenta a Lei 12.305/2010",
      "Lei 13.874/2019 - Lei da Liberdade Econômica",
    ],
    requiredClauses: [
      "Cláusula de Objeto e Escopo",
      "Cláusula de Obrigações das Partes",
      "Cláusula de Prazo e Vigência",
      "Cláusula de Preço e Condições de Pagamento",
      "Cláusula de Confidencialidade",
      "Cláusula de Propriedade Intelectual",
      "Cláusula de Responsabilidade Civil",
      "Cláusula de Caso Fortuito e Força Maior",
      "Cláusula de Rescisão Contratual",
      "Cláusula Penal e Multas",
      "Cláusula de Não-Concorrência",
      "Cláusula de Não-Solicitação",
      "Cláusula de LGPD e Proteção de Dados",
      "Cláusula Anticorrupção",
      "Cláusula Ambiental e ESG",
      "Cláusula de Eleição de Foro",
      "Cláusula Compromissória de Arbitragem",
      "Cláusula de Integralidade do Acordo",
      "Cláusula de Notificações",
      "Cláusula de Cessão e Transferência",
    ],
    signatureRequirements: "Assinatura das partes com reconhecimento de firma opcional",
    witnessRequirements: "Duas testemunhas com CPF",
    notarizationRequired: false,
  },
  italy: {
    dataProtection: "GDPR (Reg. UE 2016/679) e D.Lgs. 196/2003",
    contractLaw: "Codice Civile Italiano",
    jurisdiction: "Foro di Milano",
    language: "it",
    currency: "EUR",
    governingLaw: "Leggi della Repubblica Italiana",
    arbitration: "Camera Arbitrale di Milano",
    taxId: "Partita IVA",
    corporateTypes: ["S.p.A.", "S.r.l.", "S.a.s.", "S.n.c."],
    specificLaws: [
      "Codice Civile Italiano (R.D. 16 marzo 1942, n. 262)",
      "GDPR - Regolamento UE 2016/679",
      "D.Lgs. 196/2003 - Codice della Privacy",
      "D.Lgs. 231/2001 - Responsabilità Amministrativa",
      "D.Lgs. 152/2006 - Codice dell'Ambiente",
      "Legge 633/1941 - Diritto d'Autore",
      "D.Lgs. 30/2005 - Codice della Proprietà Industriale",
      "D.Lgs. 206/2005 - Codice del Consumo",
      "D.Lgs. 81/2008 - Sicurezza sul Lavoro",
      "Legge 190/2012 - Anticorruzione",
    ],
    requiredClauses: [
      "Premesse e Definizioni",
      "Oggetto del Contratto",
      "Obblighi delle Parti",
      "Durata e Rinnovo",
      "Corrispettivo e Modalità di Pagamento",
      "Riservatezza e Non Divulgazione",
      "Proprietà Intellettuale",
      "Responsabilità e Limitazioni",
      "Forza Maggiore",
      "Risoluzione e Recesso",
      "Penali Contrattuali",
      "Patto di Non Concorrenza",
      "Trattamento dei Dati Personali (GDPR)",
      "Anticorruzione e D.Lgs. 231/2001",
      "Clausola Ambientale e Sostenibilità",
      "Foro Competente",
      "Clausola Compromissoria",
      "Disposizioni Finali",
      "Comunicazioni tra le Parti",
      "Cessione del Contratto",
    ],
    signatureRequirements: "Firma digitale o autografa delle parti",
    witnessRequirements: "Non richiesto per contratti commerciali standard",
    notarizationRequired: false,
  },
  germany: {
    dataProtection: "DSGVO (EU-DSGVO) und BDSG",
    contractLaw: "Bürgerliches Gesetzbuch (BGB)",
    jurisdiction: "Landgericht Frankfurt am Main",
    language: "de",
    currency: "EUR",
    governingLaw: "Deutsches Recht",
    arbitration: "Deutsche Institution für Schiedsgerichtsbarkeit (DIS)",
    taxId: "Steuernummer",
    corporateTypes: ["GmbH", "AG", "KG", "OHG", "UG"],
    specificLaws: [
      "Bürgerliches Gesetzbuch (BGB)",
      "Handelsgesetzbuch (HGB)",
      "EU-DSGVO (Datenschutz-Grundverordnung)",
      "BDSG - Bundesdatenschutzgesetz",
      "UWG - Gesetz gegen den unlauteren Wettbewerb",
      "PatG - Patentgesetz",
      "UrhG - Urheberrechtsgesetz",
      "GWB - Gesetz gegen Wettbewerbsbeschränkungen",
      "Kreislaufwirtschaftsgesetz (KrWG)",
      "Bundes-Immissionsschutzgesetz (BImSchG)",
    ],
    requiredClauses: [
      "Präambel und Definitionen",
      "Vertragsgegenstand",
      "Pflichten der Parteien",
      "Vertragslaufzeit",
      "Vergütung und Zahlungsbedingungen",
      "Vertraulichkeit",
      "Geistiges Eigentum",
      "Haftung und Haftungsbeschränkung",
      "Höhere Gewalt",
      "Kündigung und Beendigung",
      "Vertragsstrafen",
      "Wettbewerbsverbot",
      "Datenschutz (DSGVO)",
      "Compliance und Antikorruption",
      "Umweltschutz und Nachhaltigkeit",
      "Gerichtsstand",
      "Schiedsklausel",
      "Schlussbestimmungen",
      "Mitteilungen",
      "Abtretung",
    ],
    signatureRequirements: "Unterschrift der vertretungsberechtigten Personen",
    witnessRequirements: "Nicht erforderlich",
    notarizationRequired: false,
  },
  usa: {
    dataProtection: "CCPA, HIPAA (where applicable), State Privacy Laws",
    contractLaw: "Uniform Commercial Code (UCC)",
    jurisdiction: "State of Delaware",
    language: "en",
    currency: "USD",
    governingLaw: "Laws of the State of Delaware, United States",
    arbitration: "American Arbitration Association (AAA)",
    taxId: "EIN (Employer Identification Number)",
    corporateTypes: ["LLC", "Inc.", "Corp.", "LLP", "S-Corp"],
    specificLaws: [
      "Uniform Commercial Code (UCC)",
      "Defend Trade Secrets Act (DTSA)",
      "California Consumer Privacy Act (CCPA)",
      "Lanham Act (Trademark Law)",
      "Sherman Antitrust Act",
      "Foreign Corrupt Practices Act (FCPA)",
      "Sarbanes-Oxley Act (SOX)",
      "Resource Conservation and Recovery Act (RCRA)",
      "Clean Air Act",
      "Delaware General Corporation Law",
    ],
    requiredClauses: [
      "Recitals and Definitions",
      "Scope of Agreement",
      "Obligations of the Parties",
      "Term and Renewal",
      "Compensation and Payment Terms",
      "Confidentiality and Non-Disclosure",
      "Intellectual Property Rights",
      "Representations and Warranties",
      "Limitation of Liability",
      "Indemnification",
      "Force Majeure",
      "Termination",
      "Liquidated Damages",
      "Non-Compete and Non-Solicitation",
      "Privacy and Data Protection",
      "FCPA Compliance and Anti-Corruption",
      "Environmental Compliance",
      "Governing Law",
      "Dispute Resolution and Arbitration",
      "Entire Agreement",
      "Amendment and Waiver",
      "Assignment",
      "Notices",
      "Severability",
      "Counterparts",
    ],
    signatureRequirements: "Authorized signatures of both parties",
    witnessRequirements: "Notarization recommended for major contracts",
    notarizationRequired: false,
  },
  australia: {
    dataProtection: "Privacy Act 1988 and Australian Privacy Principles",
    contractLaw: "Australian Contract Law (Common Law)",
    jurisdiction: "Courts of New South Wales",
    language: "en",
    currency: "AUD",
    governingLaw: "Laws of New South Wales, Australia",
    arbitration: "Australian Centre for International Commercial Arbitration",
    taxId: "ABN (Australian Business Number)",
    corporateTypes: ["Pty Ltd", "Ltd", "Pty", "Trust"],
    specificLaws: [
      "Corporations Act 2001 (Cth)",
      "Competition and Consumer Act 2010",
      "Privacy Act 1988",
      "Australian Consumer Law",
      "Trade Marks Act 1995",
      "Patents Act 1990",
      "Copyright Act 1968",
      "Environment Protection and Biodiversity Conservation Act 1999",
      "National Greenhouse and Energy Reporting Act 2007",
      "Personal Property Securities Act 2009",
    ],
    requiredClauses: [
      "Background and Definitions",
      "Scope of Agreement",
      "Obligations of Parties",
      "Term and Termination",
      "Fees and Payment",
      "Confidentiality",
      "Intellectual Property",
      "Warranties and Representations",
      "Limitation of Liability",
      "Indemnity",
      "Force Majeure",
      "Dispute Resolution",
      "GST and Taxes",
      "Privacy and Data Protection",
      "Competition Law Compliance",
      "Environmental Obligations",
      "Governing Law and Jurisdiction",
      "Assignment and Novation",
      "Notices",
      "General Provisions",
    ],
    signatureRequirements: "Signatures of authorised representatives",
    witnessRequirements: "Witness signature recommended for deeds",
    notarizationRequired: false,
  },
  mexico: {
    dataProtection: "Ley Federal de Protección de Datos Personales (LFPDPPP)",
    contractLaw: "Código de Comercio y Código Civil Federal",
    jurisdiction: "Tribunales de la Ciudad de México",
    language: "es",
    currency: "MXN",
    governingLaw: "Leyes de los Estados Unidos Mexicanos",
    arbitration: "Centro de Arbitraje de México (CAM)",
    taxId: "RFC (Registro Federal de Contribuyentes)",
    corporateTypes: ["S.A. de C.V.", "S. de R.L.", "S.A.", "S.C."],
    specificLaws: [
      "Código de Comercio",
      "Código Civil Federal",
      "Ley Federal de Protección de Datos Personales (LFPDPPP)",
      "Ley de la Propiedad Industrial",
      "Ley Federal del Derecho de Autor",
      "Ley Federal de Competencia Económica",
      "Ley General del Equilibrio Ecológico y Protección al Ambiente",
      "Ley General para la Prevención y Gestión Integral de los Residuos",
      "Ley Federal Anticorrupción en Contrataciones Públicas",
      "Ley General de Sociedades Mercantiles",
    ],
    requiredClauses: [
      "Declaraciones de las Partes",
      "Definiciones",
      "Objeto del Contrato",
      "Obligaciones de las Partes",
      "Vigencia y Prórroga",
      "Contraprestación y Forma de Pago",
      "Confidencialidad",
      "Propiedad Intelectual",
      "Responsabilidad y Limitaciones",
      "Caso Fortuito y Fuerza Mayor",
      "Terminación y Rescisión",
      "Penas Convencionales",
      "No Competencia",
      "Protección de Datos Personales (LFPDPPP)",
      "Anticorrupción",
      "Obligaciones Ambientales",
      "Jurisdicción y Competencia",
      "Arbitraje",
      "Notificaciones",
      "Disposiciones Generales",
    ],
    signatureRequirements: "Firma autógrafa de representantes legales",
    witnessRequirements: "Dos testigos con identificación oficial",
    notarizationRequired: false,
  },
  china: {
    dataProtection: "中华人民共和国个人信息保护法 (PIPL)",
    contractLaw: "中华人民共和国民法典",
    jurisdiction: "深圳市人民法院",
    language: "zh",
    currency: "CNY",
    governingLaw: "中华人民共和国法律",
    arbitration: "中国国际经济贸易仲裁委员会 (CIETAC)",
    taxId: "统一社会信用代码",
    corporateTypes: ["有限责任公司", "股份有限公司", "合伙企业"],
    specificLaws: [
      "中华人民共和国民法典",
      "中华人民共和国合同法",
      "中华人民共和国公司法",
      "中华人民共和国个人信息保护法 (PIPL)",
      "中华人民共和国数据安全法",
      "中华人民共和国网络安全法",
      "中华人民共和国专利法",
      "中华人民共和国商标法",
      "中华人民共和国著作权法",
      "中华人民共和国反不正当竞争法",
      "中华人民共和国环境保护法",
      "中华人民共和国固体废物污染环境防治法",
    ],
    requiredClauses: [
      "序言和定义",
      "合同标的",
      "双方义务",
      "合同期限",
      "价款和支付方式",
      "保密条款",
      "知识产权",
      "陈述与保证",
      "责任限制",
      "不可抗力",
      "合同解除和终止",
      "违约责任",
      "竞业禁止",
      "个人信息保护 (PIPL合规)",
      "反腐败条款",
      "环境保护义务",
      "争议解决",
      "仲裁条款",
      "通知送达",
      "一般条款",
    ],
    signatureRequirements: "法定代表人签字并加盖公章",
    witnessRequirements: "不需要见证人",
    notarizationRequired: false,
  },
  default: {
    dataProtection: "Applicable data protection laws",
    contractLaw: "International Commercial Law",
    jurisdiction: "Courts of the agreed jurisdiction",
    language: "en",
    currency: "USD",
    governingLaw: "Laws agreed by the parties",
    arbitration: "ICC International Court of Arbitration",
    taxId: "Tax ID",
    corporateTypes: ["Limited", "Corporation", "Partnership"],
    specificLaws: [
      "UNIDROIT Principles of International Commercial Contracts",
      "UN Convention on Contracts for International Sale of Goods (CISG)",
      "ICC Incoterms 2020",
      "New York Convention on Recognition of Foreign Arbitral Awards",
      "Hague Convention on Choice of Court Agreements",
    ],
    requiredClauses: [
      "Definitions and Interpretation",
      "Scope and Purpose",
      "Obligations of the Parties",
      "Term and Duration",
      "Price and Payment",
      "Confidentiality",
      "Intellectual Property",
      "Warranties and Representations",
      "Limitation of Liability",
      "Indemnification",
      "Force Majeure",
      "Termination",
      "Dispute Resolution",
      "Governing Law",
      "Notices",
      "General Provisions",
    ],
    signatureRequirements: "Signatures of authorized representatives",
    witnessRequirements: "As required by applicable law",
    notarizationRequired: false,
  },
};

// Template-specific content generators
const templateStructures: Record<string, { sections: string[]; keyFields: string[] }> = {
  nda: {
    sections: [
      "Parties",
      "Purpose",
      "Confidential Information Definition",
      "Obligations",
      "Exclusions",
      "Term",
      "Return of Information",
      "Remedies",
      "Governing Law",
      "Signatures",
    ],
    keyFields: [
      "disclosing_party",
      "receiving_party",
      "purpose",
      "duration",
      "effective_date",
      "contact_name",
      "company_name",
      "email",
      "address",
    ],
  },
  nda_bilateral: {
    sections: [
      "Parties",
      "Recitals",
      "Mutual Confidentiality",
      "Definition of Confidential Information",
      "Obligations of Both Parties",
      "Exclusions",
      "Term and Termination",
      "Return of Materials",
      "Remedies",
      "Non-Solicitation",
      "Governing Law",
      "Entire Agreement",
      "Signatures",
    ],
    keyFields: [
      "party_a",
      "party_b",
      "party_a_address",
      "party_b_address",
      "purpose",
      "duration",
      "effective_date",
      "party_a_representative",
      "party_b_representative",
    ],
  },
  joint_venture: {
    sections: [
      "Parties and Recitals",
      "Definitions",
      "Formation and Purpose",
      "Capital Contributions",
      "Management Structure",
      "Profit and Loss Sharing",
      "Intellectual Property",
      "Confidentiality",
      "Non-Competition",
      "Term and Termination",
      "Dispute Resolution",
      "Exit Strategy",
      "Representations and Warranties",
      "Governing Law",
      "Signatures",
    ],
    keyFields: [
      "partner_a",
      "partner_b",
      "jv_name",
      "jv_purpose",
      "partner_a_contribution",
      "partner_b_contribution",
      "profit_share_a",
      "profit_share_b",
      "duration",
      "effective_date",
      "location",
      "governing_law",
    ],
  },
  kyc: {
    sections: [
      "Company Information",
      "Beneficial Ownership",
      "Directors and Officers",
      "Financial Information",
      "Business Activities",
      "AML/CFT Compliance",
      "Source of Funds",
      "Risk Assessment",
      "Declaration",
      "Supporting Documents",
    ],
    keyFields: [
      "company_name",
      "registration_number",
      "incorporation_date",
      "registered_address",
      "business_address",
      "beneficial_owners",
      "directors",
      "annual_revenue",
      "employees",
      "industry",
      "source_of_funds",
    ],
  },
  consent: {
    sections: [
      "Data Controller Information",
      "Purpose of Processing",
      "Categories of Data",
      "Legal Basis",
      "Data Recipients",
      "International Transfers",
      "Retention Period",
      "Your Rights",
      "Consent Declaration",
      "Withdrawal of Consent",
    ],
    keyFields: [
      "data_subject_name",
      "data_subject_email",
      "controller_name",
      "controller_address",
      "purposes",
      "data_categories",
      "retention_period",
      "effective_date",
    ],
  },
  contract: {
    sections: [
      "Parties",
      "Recitals",
      "Definitions",
      "Scope of Work",
      "Deliverables",
      "Timeline",
      "Payment Terms",
      "Intellectual Property",
      "Warranties",
      "Limitation of Liability",
      "Indemnification",
      "Confidentiality",
      "Term and Termination",
      "Force Majeure",
      "Dispute Resolution",
      "General Provisions",
      "Signatures",
    ],
    keyFields: [
      "client_name",
      "provider_name",
      "scope",
      "deliverables",
      "total_value",
      "payment_schedule",
      "start_date",
      "end_date",
      "governing_law",
    ],
  },
  report: {
    sections: [
      "Executive Summary",
      "Introduction",
      "Environmental Impact",
      "Social Responsibility",
      "Governance Practices",
      "Sustainability Metrics",
      "Carbon Footprint",
      "Waste Management",
      "Community Engagement",
      "Future Goals",
      "Conclusion",
    ],
    keyFields: [
      "report_period",
      "company_name",
      "co2_reduction",
      "waste_processed",
      "jobs_created",
      "investments",
      "certifications",
    ],
  },
  proposal: {
    sections: [
      "Cover Page",
      "Executive Summary",
      "Company Overview",
      "Understanding of Needs",
      "Proposed Solution",
      "Technical Specifications",
      "Implementation Plan",
      "Timeline",
      "Investment Summary",
      "Terms and Conditions",
      "Why Choose Us",
      "Appendices",
    ],
    keyFields: [
      "client_name",
      "project_name",
      "total_investment",
      "duration",
      "deliverables",
      "payment_terms",
      "valid_until",
    ],
  },
  loi: {
    sections: [
      "Parties",
      "Purpose",
      "Transaction Overview",
      "Key Terms",
      "Exclusivity Period",
      "Due Diligence",
      "Confidentiality",
      "Non-Binding Nature",
      "Binding Provisions",
      "Governing Law",
      "Signatures",
    ],
    keyFields: [
      "buyer",
      "seller",
      "transaction_type",
      "transaction_value",
      "exclusivity_period",
      "due_diligence_period",
      "target_closing_date",
    ],
  },
  mou: {
    sections: [
      "Parties",
      "Background and Purpose",
      "Areas of Cooperation",
      "Responsibilities",
      "Financial Arrangements",
      "Intellectual Property",
      "Confidentiality",
      "Term and Termination",
      "Dispute Resolution",
      "General Provisions",
      "Signatures",
    ],
    keyFields: [
      "party_a",
      "party_b",
      "purpose",
      "cooperation_areas",
      "duration",
      "effective_date",
      "responsibilities_a",
      "responsibilities_b",
    ],
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // ============= RATE LIMITING CHECK =============
    const authHeader = req.headers.get("Authorization") || "";
    const clientKey = authHeader.replace("Bearer ", "").trim() || 
                      req.headers.get("x-forwarded-for") || 
                      "anonymous";

    if (isRateLimited(clientKey)) {
      console.warn(`Rate limited client: ${clientKey.substring(0, 20)}...`);
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Max 15 requests per minute." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============= PARSE AND VALIDATE PAYLOAD =============
    let rawPayload: unknown;
    try {
      rawPayload = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validation = validatePayload(rawPayload);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { templateType, country, language, existingFields, templateContent, generateFullDocument } = validation.data;

    console.log(`[generate-document-ai] Processing ${templateType} for ${country || 'default'} in ${language || 'en'}`);

    const countryKey = (country || "default").toLowerCase().replace(/\s+/g, "");
    const legalData = countryLegalData[countryKey] || countryLegalData["default"];

    const languageMap: Record<string, string> = {
      pt: "Portuguese (Brazilian)",
      en: "English",
      es: "Spanish",
      zh: "Chinese (Simplified)",
      it: "Italian",
      de: "German",
    };
    const outputLanguage = languageMap[language || 'en'] || "English";

    // Get template structure
    const templateInfo = templateStructures[templateType] || templateStructures["contract"];

    // Build comprehensive clause list from country data
    const requiredClausesText = legalData.requiredClauses?.join("\n- ") || "Standard contract clauses";
    const specificLawsText = legalData.specificLaws?.join("\n- ") || "Applicable local laws";

    // Enhanced prompts for generating COMPLETE professional documents (minimum 50,000 characters)
    const systemPrompt = `You are an elite legal document generator for ELP Green Technology, a multinational corporation specializing in OTR (Off-The-Road) tire recycling technology and strategic partnerships worldwide.

<mission>
Generate EXHAUSTIVE, LEGALLY BINDING professional documents that are ready for immediate execution. Each document MUST contain a MINIMUM of 50,000 characters of substantive legal content.
</mission>

<output_language>${outputLanguage}</output_language>
All text must be in ${outputLanguage}.

<document_type>${templateType.toUpperCase()}</document_type>

<mandatory_sections>
${templateInfo.sections.join(", ")}
</mandatory_sections>

<country_legal_framework>
- Data Protection Law: ${legalData.dataProtection}
- Contract Law: ${legalData.contractLaw}
- Jurisdiction: ${legalData.jurisdiction}
- Governing Law: ${legalData.governingLaw}
- Arbitration: ${legalData.arbitration}
- Tax ID Type: ${legalData.taxId}
- Currency: ${legalData.currency}
- Corporate Types: ${legalData.corporateTypes.join(", ")}
- Signature Requirements: ${legalData.signatureRequirements || "Authorized signatures"}
- Witness Requirements: ${legalData.witnessRequirements || "As required"}
- Notarization: ${legalData.notarizationRequired ? "Required" : "Optional"}
</country_legal_framework>

<specific_laws_to_reference>
- ${specificLawsText}
</specific_laws_to_reference>

<mandatory_clauses_for_${country}>
- ${requiredClausesText}
</mandatory_clauses_for_${country}>

<elp_company_info>
- Company: ELP Alliance S/A
- Legal Name: ELP Alliance Sociedade Anônima / ELP Alliance S.p.A.
- CNPJ (Brazil): 12.345.678/0001-90
- P.IVA (Italy): IT12345678901
- Registered Office: Via della Moscova 13, 20121 Milano MI, Italy
- Brazilian Office: Av. Paulista, 1000 - Bela Vista, São Paulo - SP, 01310-100, Brazil
- Email: info@elpgreen.com
- Phone: +39 350 102 1359 / +55 11 99999-9999
- Website: www.elpgreen.com
- Legal Representative: Ericson Piccoli (Chief Executive Officer)
- Secondary Representative: Marco Rossi (Chief Operating Officer)
- Business Activities: 
  * OTR Tire Recycling Technology Development and Licensing
  * Strategic Partnerships for Sustainable Waste Management
  * Industrial Equipment Sales and Technical Consulting
  * Environmental Solutions and Carbon Credit Generation
  * International Trade and Technology Transfer
</elp_company_info>

<document_generation_requirements>
1. MINIMUM 50,000 CHARACTERS of substantive legal content
2. Include DETAILED DEFINITIONS section with 20+ defined terms
3. Each clause must contain 3-5 substantive paragraphs with legal reasoning
4. Reference SPECIFIC ARTICLES of applicable laws for ${country}
5. Include WHEREAS/RECITALS section with detailed background
6. Add SCHEDULES/EXHIBITS section with technical specifications
7. Include ENVIRONMENTAL and ESG compliance clauses
8. Add ANTI-CORRUPTION (FCPA/Lei Anticorrupção) clauses
9. Include DATA PROTECTION clauses citing ${legalData.dataProtection}
10. Add INTELLECTUAL PROPERTY protection clauses
11. Include FORCE MAJEURE with pandemic/climate provisions
12. Add DISPUTE RESOLUTION with tiered escalation
13. Include INSURANCE and INDEMNIFICATION requirements
14. Add TERMINATION provisions with cure periods
15. Include ASSIGNMENT and CHANGE OF CONTROL clauses
16. Add NOTICES clause with email/registered mail procedures
17. Include SEVERABILITY and SURVIVAL clauses
18. Add ENTIRE AGREEMENT and AMENDMENT procedures
19. Include WAIVER clause with non-waiver provisions
20. Add COUNTERPARTS and ELECTRONIC SIGNATURE clauses
21. Include proper SIGNATURE BLOCKS with witness lines
22. Add ATTESTATION and NOTARIZATION sections if required
</document_generation_requirements>

<writing_style>
- Use formal legal language appropriate for ${country}
- Include numbered articles and sub-paragraphs (1.1, 1.1.1)
- Use defined terms in UPPERCASE or "Defined Term" format
- Include cross-references between clauses
- Add explanatory footnotes where helpful
- Use proper legal terminology for ${country} jurisdiction
</writing_style>`;

    const userPrompt = `Generate an EXHAUSTIVE, PROFESSIONALLY COMPLETE ${templateType.toUpperCase()} document for execution between ELP Alliance and a partner company in ${country}.

<critical_instruction>
The document MUST be MINIMUM 50,000 characters. This is a HARD REQUIREMENT.
Do NOT generate a summary or outline. Generate the FULL, COMPLETE document text.
</critical_instruction>

<template_details>
Template Type: ${templateType}
Target Country: ${country}
Output Language: ${outputLanguage}
Minimum Length: 50,000 characters
</template_details>

<template_fields>
${JSON.stringify(existingFields, null, 2)}
</template_fields>

${templateContent ? `<existing_template_structure>
${templateContent.substring(0, 1500)}
</existing_template_structure>` : ""}

<document_structure_required>
Generate the COMPLETE document with these sections:

1. HEADER AND TITLE PAGE
   - Document title and reference number
   - Date and place of execution
   - Parties identification

2. RECITALS/WHEREAS CLAUSES (minimum 10 recitals)
   - Background of each party
   - Purpose of the agreement
   - Prior negotiations summary

3. DEFINITIONS (minimum 25 defined terms)
   - All technical and legal terms
   - Cross-referenced consistently

4. MAIN BODY (minimum 30 numbered articles)
   - Each article with detailed sub-clauses
   - Legal reasoning and rationale
   - Cross-references to applicable laws

5. SCHEDULES/EXHIBITS
   - Technical specifications
   - Pricing and payment terms
   - Territory and scope
   - Compliance certificates

6. SIGNATURE PAGES
   - Proper signature blocks for ${country}
   - Witness lines if required
   - Notarization space if applicable
</document_structure_required>

<receiving_party_details>
Generate REALISTIC business information for the receiving party appropriate for ${country}:
- Company name in proper local legal format
- Complete address with postal code
- Tax/registration number in local format
- Representative with culturally appropriate name and title
- Contact details
</receiving_party_details>

<output_format>
Respond with a valid JSON object:
{
  "fields": { /* all field values */ },
  "documentContent": "/* COMPLETE document text - MINIMUM 50,000 characters */",
  "legalNotes": ["/* specific legal considerations */"],
  "jurisdictionInfo": {
    "governingLaw": "...",
    "jurisdiction": "...",
    "arbitration": "...",
    "dataProtection": "...",
    "applicableLaws": ["..."],
    "requiredClauses": ["..."]
  },
  "recommendedClauses": ["/* additional recommended provisions */"],
  "characterCount": /* actual character count of documentContent */
}
</output_format>`;

    // ============= AI API CALL WITH TIMEOUT AND FALLBACK =============
    let response: Response;
    let modelUsed = "gemini";
    let didFallback = false;

    // Try Gemini with 7-key rotation
    if (GEMINI_API_KEYS.length > 0) {
      let geminiSuccess = false;
      
      for (let keyAttempt = 0; keyAttempt < GEMINI_API_KEYS.length && !geminiSuccess; keyAttempt++) {
        const currentKey = getNextGeminiKey();
        if (!currentKey) break;
        const keyIndex = currentGeminiKeyIndex;
        
        try {
          console.log(`[generate-document-ai] Trying Gemini key ${keyIndex + 1}/${GEMINI_API_KEYS.length}...`);
          response = await callExternalAPI(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${currentKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [
                  {
                    role: "user",
                    parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
                  },
                ],
                generationConfig: {
                  temperature: 0.4,
                  maxOutputTokens: 65536,
                },
              }),
            },
            120000
          );

          if (response.ok) {
            console.log(`[generate-document-ai] ✅ Gemini key ${keyIndex + 1} success`);
            geminiSuccess = true;
            modelUsed = `gemini-key-${keyIndex + 1}`;
          } else {
            const errorText = await response.text();
            console.error(`[generate-document-ai] Gemini key ${keyIndex + 1} error ${response.status}:`, errorText.substring(0, 200));
            
            if (response.status === 429 || response.status === 503 || response.status === 529) {
              rotateGeminiKey(true);
              continue;
            }
            throw new Error(`Gemini API error: ${response.status}`);
          }
        } catch (geminiError) {
          console.warn(`[generate-document-ai] Gemini key ${keyIndex + 1} failed:`, geminiError);
          rotateGeminiKey(true);
        }
      }
      
      // Fallback to Anthropic if all Gemini keys failed
      if (!geminiSuccess && ANTHROPIC_API_KEY) {
        console.log("[generate-document-ai] All Gemini keys exhausted, trying Anthropic fallback");
        didFallback = true;
        modelUsed = "anthropic";
        
        response = await callExternalAPI(
          "https://api.anthropic.com/v1/messages",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": ANTHROPIC_API_KEY,
              "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
              model: "claude-sonnet-4-20250514",
              max_tokens: 64000,
              system: systemPrompt,
              messages: [{ role: "user", content: userPrompt }],
            }),
          },
          120000
        );
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[generate-document-ai] Anthropic error ${response.status}:`, errorText);
          
          if (response.status === 429) {
            return new Response(
              JSON.stringify({ error: "All AI providers rate limited. Please try again later." }),
              { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          throw new Error(`Anthropic API error: ${response.status}`);
        }
      } else if (!geminiSuccess) {
        throw new Error("All Gemini keys failed and no Anthropic fallback available");
      }
    } else if (ANTHROPIC_API_KEY) {
      // Use Anthropic directly if no Gemini key
      modelUsed = "anthropic";
      response = await callExternalAPI(
        "https://api.anthropic.com/v1/messages",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 64000,
            system: systemPrompt,
            messages: [{ role: "user", content: userPrompt }],
          }),
        },
        120000
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[generate-document-ai] Anthropic error ${response.status}:`, errorText);
        throw new Error(`Anthropic API error: ${response.status}`);
      }
    } else {
      throw new Error("No AI API keys configured");
    }

    const data = await response!.json();
    
    // Parse response based on model used
    let textContent: string | undefined;
    
    if (modelUsed.startsWith("gemini")) {
      textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    } else {
      // Anthropic response format
      textContent = data.content?.[0]?.text;
    }

    if (textContent) {
      try {
        // Clean markdown code blocks if present
        let cleanedText = textContent.trim();
        
        if (cleanedText.startsWith('```json')) {
          cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanedText.startsWith('```')) {
          cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        const result = JSON.parse(cleanedText);

        // Add metadata to response
        result.countryLegalData = legalData;
        result.templateInfo = templateInfo;
        result.model_used = modelUsed;
        result.did_fallback = didFallback;

        // ============= BACKGROUND TELEMETRY =============
        const bgTask = (async () => {
          try {
            console.log(`[generate-document-ai] Success: ${templateType} for ${country || 'default'}, model: ${modelUsed}, fallback: ${didFallback}`);
            // Future: write to analytics table
          } catch (e) {
            console.error("[generate-document-ai] Background task failed:", e);
          }
        })();
        
        // @ts-ignore - EdgeRuntime available in Supabase Edge Functions
        try {
          // deno-lint-ignore no-explicit-any
          if (typeof (globalThis as any).EdgeRuntime !== 'undefined') {
            // deno-lint-ignore no-explicit-any
            (globalThis as any).EdgeRuntime.waitUntil(bgTask);
          }
        } catch {
          // Silently ignore if EdgeRuntime not available
        }

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (parseError) {
        console.error("[generate-document-ai] Failed to parse AI response:", parseError);
        console.error("[generate-document-ai] Raw response:", textContent.substring(0, 500));
      }
    }

    // Fallback if no valid response
    return new Response(
      JSON.stringify({
        fields: {},
        legalNotes: ["AI could not generate fields. Please fill manually."],
        jurisdictionInfo: legalData,
        countryLegalData: legalData,
        templateInfo: templateInfo,
        model_used: modelUsed,
        did_fallback: didFallback,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[generate-document-ai] Error:", errorMessage);
    
    // Handle timeout specifically
    if (errorMessage === 'Request timeout') {
      return new Response(
        JSON.stringify({ error: "Request timeout. The AI service took too long to respond." }),
        { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
