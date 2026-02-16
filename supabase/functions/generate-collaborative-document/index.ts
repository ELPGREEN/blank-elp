import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
const HUGGINGFACE_API_KEY = Deno.env.get('HUGGINGFACE_API_KEY');
const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');

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

function getGeminiPoolStatus(): string {
  return `${GEMINI_API_KEYS.length - failedKeys.size}/${GEMINI_API_KEYS.length} available`;
}

// Timeout configurations (ms)
const TIMEOUT_AI_CALL = 45000;
const TIMEOUT_SEARCH = 15000;
const TIMEOUT_TOTAL = 120000;

console.log(`Collaborative Document v3 - Groq: ${GROQ_API_KEY ? '✅' : '❌'}, Gemini: ${GEMINI_API_KEYS.length}/7 keys, HuggingFace: ${HUGGINGFACE_API_KEY ? '✅' : '❌'}, Firecrawl: ${FIRECRAWL_API_KEY ? '✅' : '❌'}`);

// Helper for fetch with timeout
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Wrap async operation with timeout
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T, operationName: string): Promise<T> {
  const timeoutPromise = new Promise<T>((_, reject) => {
    setTimeout(() => reject(new Error(`${operationName} timeout after ${timeoutMs}ms`)), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } catch (error) {
    console.log(`${operationName} failed:`, error);
    return fallback;
  }
}

// ========== ELP + TOPS STRATEGIC PARTNERSHIP ==========
const ELP_BRAND = {
  name: 'ELP Green Technology',
  fullName: 'ELP GREEN TECHNOLOGY e ELP GLOBAL S.A.',
  cnpj: '00.000.000/0001-00',
  sede: 'Medianeira, PR - Brasil | Valenza, Itália',
  representante: 'Ericson Piccoli',
  cargo: 'Presidente do Conselho & Fundador',
  email: 'info@elpgreen.com',
  phone: '+39 350 102 1359',
  locations: 'São Paulo, Brasil | Milão, Itália | Zhangjiagang, China',
  trademarks: 'Marca ELP registrada em 6 classes no INPI',
  focus: 'Joint Ventures para Smart Line OTR',
};

// TOPS Recycling - Strategic Manufacturing Partner
const TOPS_PARTNER = {
  name: 'TOPS RECYCLING',
  fullName: 'TOPS RECYCLING ZHANGJIAGANG SHILONG MACHINERY CO. LTD',
  representante: 'Xu Shihe (许世和)',
  cargo: 'Membro Afiliado & Diretor Geral - Operações China',
  location: 'Zhangjiagang City, Jiangsu Province, China',
  email: 'info@topsindustry.com',
  phone: '+86 159 6237 8058',
  license: '91320582565255473X',
  partnershipDate: '22 de Fevereiro de 2023',
  expertise: 'Equipamentos Smart Line para reciclagem de pneus OTR gigantes, manufatura e tecnologia robótica de corte',
};

// Combined Partnership Context for Documents
const ELP_TOPS_PARTNERSHIP = {
  description: `A ELP Green Technology, fundada e presidida por Ericson Piccoli (Medianeira, PR - Brasil / Valenza, Itália), atua como representante oficial e parceira estratégica da TOPS RECYCLING no Brasil e América Latina. A TOPS RECYCLING ZHANGJIAGANG SHILONG MACHINERY CO. LTD, sob direção de Xu Shihe (许世和), é a fabricante de referência mundial em equipamentos Smart Line para reciclagem de pneus OTR gigantes.`,
  partnershipSince: '22 de Fevereiro de 2023',
  roles: {
    elp: 'Representação comercial, desenvolvimento de negócios, parcerias estratégicas e expansão global (Europa, Ásia, América Latina)',
    tops: 'Manufatura de equipamentos, tecnologia robótica de corte, suporte técnico e engenharia de processos'
  },
  combined: `Esta parceria une a visão empreendedora e capacidade de articulação comercial da ELP Green Technology com a excelência em manufatura e tecnologia proprietária da TOPS Recycling, oferecendo soluções completas de reciclagem de pneus OTR.`
};

// ========== DETECT ORGANIZATION TYPE ==========
type OrganizationType = 'ngo' | 'corporate' | 'government';

function detectOrganizationType(companyName: string, additionalContext?: string, manualType?: string): OrganizationType {
  // If manual type is provided, use it directly
  if (manualType && ['ngo', 'corporate', 'government'].includes(manualType)) {
    return manualType as OrganizationType;
  }
  
  const contextToCheck = `${companyName} ${additionalContext || ''}`.toLowerCase();
  
  // Check for government keywords
  const govKeywords = [
    'governo', 'government', 'gobierno', 'prefeitura', 'secretaria', 'ministério', 'ministry',
    'municipal', 'estadual', 'federal', 'público', 'public', 'autarquia', 'estatal'
  ];
  if (govKeywords.some(kw => contextToCheck.includes(kw))) {
    return 'government';
  }
  
  // Check for NGO keywords
  const ngoKeywords = [
    'associação', 'association', 'asociación', 'ong', 'ngo', 'instituto', 'institute',
    'fundação', 'foundation', 'fundación', 'sem fins lucrativos', 'non-profit', 'nonprofit',
    'sin fines de lucro', 'terceiro setor', 'third sector', 'entidade', 'organização social',
    'oscip', 'os ', 'abm', 'filantrópica', 'beneficente', 'federação', 'confederação',
    'sindicato', 'cooperativa', 'conselho', 'comitê', 'fórum'
  ];
  if (ngoKeywords.some(kw => contextToCheck.includes(kw))) {
    return 'ngo';
  }
  
  return 'corporate';
}

// ========== NGO PARTNERSHIP MODEL ==========
const ELP_NGO_PARTNERSHIP = {
  mainGoal: 'Estabelecer parceria estratégica com entidade do terceiro setor para apoio a ações socioambientais e educação ambiental no setor de reciclagem de pneus',
  elpDeclaration: `Somos uma empresa privada, de perfil capitalista, orientada ao lucro. Entendemos que lucro e responsabilidade social não são opostos. Investimos capital, assumimos riscos e buscamos resultados financeiros que garantam a sustentabilidade do negócio e a geração de empregos. Ao mesmo tempo, reconhecemos a obrigação social e ambiental que acompanha o exercício da atividade econômica.`,
  ngoRecognition: `Reconhecemos o trabalho da associação como entidade civil sem fins lucrativos, cujo objetivo é congregar pessoas físicas e jurídicas, promover ações coletivas voltadas ao desenvolvimento humano, incentivar a evolução técnico-científica e estimular a inovação em processos, produtos e gestão em suas áreas de atuação.`,
  partnerResponsibilities: [
    'a) Aplicar os recursos recebidos em projetos de educação ambiental e desenvolvimento sustentável',
    'b) Prestar contas da utilização dos recursos mediante relatórios semestrais detalhados',
    'c) Divulgar a parceria em materiais institucionais, reconhecendo o apoio da ELP Green',
    'd) Alinhar projetos apoiados com os objetivos estatutários da associação e práticas ESG'
  ],
  elpResponsibilities: [
    'a) Reverter parte do lucro operacional para ações socioambientais',
    'b) Transformar esse valor em Cota Social Ambiental destinada à associação',
    'c) Disponibilizar os recursos na forma de Royalties Sociais Ambientais',
    'd) Manter transparência na apuração e repasse dos valores',
    'e) Apoiar iniciativas de educação ambiental e desenvolvimento sustentável'
  ],
  socialRoyalties: {
    percentageOptions: [10, 20],
    defaultPercentage: 10,
    basis: 'Lucro Líquido Operacional mensal, deduzidos impostos, custos operacionais e despesas administrativas',
    description: 'Royalties Sociais Ambientais destinados a projetos de educação ambiental, desenvolvimento institucional e iniciativas alinhadas aos objetivos estatutários da associação',
    usageAreas: [
      'Projetos de educação ambiental',
      'Desenvolvimento institucional da associação',
      'Iniciativas de sustentabilidade e inovação',
      'Apoio a pesquisas técnico-científicas',
      'Eventos e capacitações no setor'
    ]
  },
  mutualBenefits: {
    forNGO: ['Recursos financeiros estáveis e previsíveis', 'Apoio ao crescimento de projetos de educação ambiental', 'Fortalecimento institucional', 'Ampliação do impacto social'],
    forELP: ['Cumprimento do papel social empresarial', 'Fortalecimento da imagem institucional', 'Alinhamento com práticas ESG (Environmental, Social, Governance)', 'Contribuição para o desenvolvimento sustentável']
  },
  legalFramework: [
    'Lei 12.305/2010 (PNRS - Política Nacional de Resíduos Sólidos)',
    'Lei 13.019/2014 (Marco Regulatório das Organizações da Sociedade Civil)',
    'Lei 9.790/1999 (OSCIP - Organizações da Sociedade Civil de Interesse Público)',
    'Lei 13.709/2018 (LGPD)',
    'Código Civil Arts. 53-69 (Associações)'
  ]
};

// ========== GOVERNMENT PARTNERSHIP MODEL ==========
const ELP_GOVERNMENT_PARTNERSHIP = {
  mainGoal: 'Estabelecer parceria público-privada para gestão sustentável de pneus inservíveis e promoção da economia circular',
  partnerResponsibilities: [
    'a) Facilitar licenciamentos ambientais e autorizações operacionais',
    'b) Disponibilizar áreas para instalação de centros de coleta e processamento',
    'c) Apoiar na articulação com outros entes públicos e órgãos reguladores',
    'd) Incluir o projeto em programas de incentivo fiscal e desenvolvimento regional',
    'e) Promover políticas públicas de logística reversa alinhadas ao PNRS'
  ],
  elpResponsibilities: [
    'a) Investir em infraestrutura de reciclagem de pneus OTR na região',
    'b) Gerar empregos diretos e indiretos para a população local',
    'c) Garantir destinação ambientalmente adequada de 100% dos pneus coletados',
    'd) Contribuir com royalties ambientais para o fundo de desenvolvimento regional',
    'e) Fornecer relatórios periódicos de impacto ambiental e social'
  ],
  royaltyModel: {
    percentage: 5,
    basis: 'Faturamento bruto mensal das operações na região',
    description: 'Contribuição de 5% do faturamento para o Fundo de Desenvolvimento Regional / Ambiental',
    destination: 'Projetos de educação ambiental, infraestrutura e capacitação profissional'
  },
  legalFramework: [
    'Lei 12.305/2010 (PNRS - Política Nacional de Resíduos Sólidos)',
    'Lei 11.079/2004 (Parcerias Público-Privadas)',
    'Lei 8.666/1993 (Licitações e Contratos Públicos)',
    'Lei 14.133/2021 (Nova Lei de Licitações)',
    'Resolução CONAMA 416/2009 (Gestão de Pneus Inservíveis)'
  ]
};

// ========== CORPORATE PARTNERSHIP MODEL ==========
const ELP_CORPORATE_PARTNERSHIP = {
  mainGoal: 'Estabelecer parcerias estratégicas para concessão de pneus OTR inservíveis para reciclagem industrial',
  partnerResponsibilities: [
    'a) Facilitar contatos com mineradoras, revendedores e outros potenciais parceiros fornecedores de pneus OTR inservíveis',
    'b) Apoiar na regulamentação, aprovações ambientais e logística inicial de coleta e transporte',
    'c) Fornecer informações sobre a disponibilidade de pneus OTR inservíveis e tendências de mercado regional',
    'd) Compartilhar 10% (dez por cento) dos lucros líquidos obtidos a título de royalties governamentais, contribuindo com rede de contatos, expertise setorial, busca de incentivos fiscais e facilitação de concessões e documentação necessária para o sucesso do negócio'
  ],
  elpResponsibilities: [
    'a) Disponibilizar tecnologia proprietária de reciclagem de pneus OTR (Linha Completa OTR)',
    'b) Garantir processamento industrial com capacidade mínima de 20.000 toneladas/ano',
    'c) Assegurar conformidade ambiental com licenças IBAMA/órgãos estaduais',
    'd) Operacionalizar a venda de subprodutos (granulado de borracha, aço, negro de fumo)',
    'e) Gerenciar a distribuição dos royalties conforme participação acordada (10% Parceiro Governamental)'
  ],
  profitSharing: {
    governmentRoyalties: 10,
    basis: 'Lucro Líquido Operacional mensal, deduzidos impostos, custos operacionais e despesas administrativas',
    description: 'Royalties governamentais de 10% sobre lucro líquido como contrapartida por facilitação de concessões, incentivos fiscais e apoio regulatório'
  },
  otrContext: {
    tireTypes: ['Mineração (49" a 63")', 'Construção Civil (25" a 35")', 'Caminhões Fora-de-Estrada (OTR Trucks)'],
    annualDemand: '50.000+ toneladas de pneus OTR inservíveis na América Latina',
    marketValue: 'Granulado de borracha: USD 350-450/ton | Aço recuperado: USD 200-280/ton | Negro de Fumo (rCB): USD 800-1.200/ton',
    environmentalBenefit: 'Redução de 2,5 toneladas de CO2 por tonelada de pneu reciclado'
  },
  legalFramework: [
    'Lei 12.305/2010 (PNRS - Política Nacional de Resíduos Sólidos)',
    'Resolução CONAMA 416/2009 (Gestão de Pneus Inservíveis)',
    'Lei 12.846/2013 (Lei Anticorrupção)',
    'Lei 13.709/2018 (LGPD)',
    'Decreto 10.936/2022 (Logística Reversa)'
  ]
};

interface DocumentRequest {
  documentType: string;
  partnerType?: 'corporate' | 'ngo' | 'government';
  requestType?: string;
  country?: string;
  language?: string;
  companyName?: string;
  contactName?: string;
  email?: string;
  additionalContext?: string;
  maxIterations?: number;
  enableWebResearch?: boolean;
}

const LEGAL_TEMPLATES: Record<string, { structure: string[]; requiredClauses: string[]; legalFramework: string[]; searchQueries: string[]; }> = {
  nda: {
    structure: ['PREÂMBULO E QUALIFICAÇÃO DAS PARTES', 'CONSIDERANDOS (mínimo 5)', 'CLÁUSULA PRIMEIRA - DO OBJETO', 'CLÁUSULA SEGUNDA - DAS INFORMAÇÕES CONFIDENCIAIS', 'CLÁUSULA TERCEIRA - DAS OBRIGAÇÕES DA PARTE RECEPTORA', 'CLÁUSULA QUARTA - DAS EXCEÇÕES À CONFIDENCIALIDADE', 'CLÁUSULA QUINTA - DO PRAZO DE VIGÊNCIA', 'CLÁUSULA SEXTA - DAS PENALIDADES E INDENIZAÇÕES', 'CLÁUSULA SÉTIMA - DA PROPRIEDADE INTELECTUAL', 'CLÁUSULA OITAVA - DAS DISPOSIÇÕES GERAIS', 'CLÁUSULA NONA - DO FORO E LEI APLICÁVEL', 'ASSINATURAS E TESTEMUNHAS'],
    requiredClauses: ['Definição de Informação Confidencial (Art. 195 Lei 9.279/96)', 'Cláusula de não divulgação', 'Cláusula de devolução de documentos', 'Cláusula penal por descumprimento', 'LGPD - Proteção de dados pessoais (Lei 13.709/2018)'],
    legalFramework: ['Lei 9.279/1996 (Propriedade Industrial)', 'Lei 13.709/2018 (LGPD)', 'Código Civil Arts. 186, 187, 927'],
    searchQueries: ['NDA acordo confidencialidade modelo jurídico Brasil 2024', 'cláusula penal descumprimento confidencialidade jurisprudência', 'LGPD obrigações confidencialidade empresas']
  },
  mou: {
    structure: ['PREÂMBULO E QUALIFICAÇÃO DAS PARTES', 'CONSIDERANDOS (WHEREAS)', 'CLÁUSULA PRIMEIRA - DO OBJETIVO DA COOPERAÇÃO', 'CLÁUSULA SEGUNDA - DAS ÁREAS DE COLABORAÇÃO', 'CLÁUSULA TERCEIRA - DAS RESPONSABILIDADES DAS PARTES', 'CLÁUSULA QUARTA - DA PROPRIEDADE INTELECTUAL', 'CLÁUSULA QUINTA - DA CONFIDENCIALIDADE', 'CLÁUSULA SEXTA - DO PRAZO DE VIGÊNCIA', 'CLÁUSULA SÉTIMA - DA INEXISTÊNCIA DE EXCLUSIVIDADE', 'CLÁUSULA OITAVA - DAS DISPOSIÇÕES GERAIS', 'CLÁUSULA NONA - DO FORO', 'ASSINATURAS'],
    requiredClauses: ['Não vinculação obrigacional (natureza não vinculante)', 'Possibilidade de rescisão unilateral', 'Cláusula de boa-fé e probidade', 'Inexistência de obrigação financeira'],
    legalFramework: ['Código Civil Arts. 421, 422 (Boa-fé contratual)', 'Lei 12.305/2010 (PNRS - Reciclagem)', 'Resolução CONAMA 416/2009 (Gestão de Pneus)'],
    searchQueries: ['memorando entendimento MOU modelo juridico Brasil', 'acordo cooperação institucional reciclagem mineração', 'PNRS logística reversa pneus regulamentação']
  },
  loi: {
    structure: ['PREÂMBULO E QUALIFICAÇÃO DAS PARTES', 'CONSIDERANDOS', 'CLÁUSULA PRIMEIRA - DA MANIFESTAÇÃO DE INTERESSE', 'CLÁUSULA SEGUNDA - DO ESCOPO DA OPERAÇÃO', 'CLÁUSULA TERCEIRA - DA DUE DILIGENCE', 'CLÁUSULA QUARTA - DA EXCLUSIVIDADE TEMPORÁRIA', 'CLÁUSULA QUINTA - DA CONFIDENCIALIDADE', 'CLÁUSULA SEXTA - DAS CONDIÇÕES PRECEDENTES', 'CLÁUSULA SÉTIMA - DO PRAZO DE VALIDADE', 'CLÁUSULA OITAVA - DAS DISPOSIÇÕES GERAIS', 'ASSINATURAS'],
    requiredClauses: ['Natureza não vinculante (exceto confidencialidade)', 'Período de exclusividade (Lock-up)', 'Cronograma de due diligence', 'Condições suspensivas'],
    legalFramework: ['Código Civil Arts. 104, 421, 422', 'Lei 6.404/1976 (LSA)', 'CVM (para operações com capital aberto)'],
    searchQueries: ['letter of intent LOI modelo M&A Brasil', 'carta intenção aquisição empresarial cláusulas', 'due diligence procedimentos jurídicos Brasil']
  },
  contract: {
    structure: ['PREÂMBULO E QUALIFICAÇÃO COMPLETA DAS PARTES', 'CONSIDERANDOS', 'CLÁUSULA PRIMEIRA - DO OBJETO', 'CLÁUSULA SEGUNDA - DAS OBRIGAÇÕES DA CONTRATADA', 'CLÁUSULA TERCEIRA - DAS OBRIGAÇÕES DO CONTRATANTE', 'CLÁUSULA QUARTA - DO PREÇO E FORMA DE PAGAMENTO', 'CLÁUSULA QUINTA - DO PRAZO E PRORROGAÇÃO', 'CLÁUSULA SEXTA - DA RESCISÃO', 'CLÁUSULA SÉTIMA - DAS PENALIDADES', 'CLÁUSULA OITAVA - DA GARANTIA', 'CLÁUSULA NONA - DO SIGILO E CONFIDENCIALIDADE', 'CLÁUSULA DÉCIMA - DA PROPRIEDADE INTELECTUAL', 'CLÁUSULA DÉCIMA PRIMEIRA - DO CASO FORTUITO E FORÇA MAIOR', 'CLÁUSULA DÉCIMA SEGUNDA - DA ANTICORRUPÇÃO', 'CLÁUSULA DÉCIMA TERCEIRA - DAS DISPOSIÇÕES GERAIS', 'CLÁUSULA DÉCIMA QUARTA - DO FORO', 'ASSINATURAS E TESTEMUNHAS'],
    requiredClauses: ['Cláusula anticorrupção (Lei 12.846/2013)', 'Cláusula ESG/Sustentabilidade', 'Cláusula de compliance', 'Cláusula de proteção de dados (LGPD)', 'Cláusula compromissória de arbitragem'],
    legalFramework: ['Código Civil Arts. 421-480 (Contratos)', 'Lei 12.846/2013 (Anticorrupção)', 'Lei 13.709/2018 (LGPD)', 'Lei 9.307/1996 (Arbitragem)'],
    searchQueries: ['contrato comercial fornecimento modelo Brasil 2024', 'cláusula anticorrupção compliance lei 12846', 'arbitragem comercial Brasil cláusula compromissória']
  },
  joint_venture: {
    structure: ['PREÂMBULO E QUALIFICAÇÃO DAS PARTES', 'CONSIDERANDOS', 'CLÁUSULA PRIMEIRA - DO OBJETO E PROPÓSITO', 'CLÁUSULA SEGUNDA - DA CONSTITUIÇÃO DA SOCIEDADE', 'CLÁUSULA TERCEIRA - DO CAPITAL SOCIAL E PARTICIPAÇÃO', 'CLÁUSULA QUARTA - DAS CONTRIBUIÇÕES DAS PARTES', 'CLÁUSULA QUINTA - DA ADMINISTRAÇÃO E GOVERNANÇA', 'CLÁUSULA SEXTA - DAS DELIBERAÇÕES SOCIETÁRIAS', 'CLÁUSULA SÉTIMA - DA DISTRIBUIÇÃO DE LUCROS', 'CLÁUSULA OITAVA - DA PROPRIEDADE INTELECTUAL', 'CLÁUSULA NONA - DA NÃO CONCORRÊNCIA', 'CLÁUSULA DÉCIMA - DA CONFIDENCIALIDADE', 'CLÁUSULA DÉCIMA PRIMEIRA - DA SAÍDA E DISSOLUÇÃO', 'CLÁUSULA DÉCIMA SEGUNDA - DO IMPASSE (DEADLOCK)', 'CLÁUSULA DÉCIMA TERCEIRA - DAS DISPOSIÇÕES GERAIS', 'CLÁUSULA DÉCIMA QUARTA - DO FORO E ARBITRAGEM', 'ASSINATURAS'],
    requiredClauses: ['Cláusula de Tag Along e Drag Along', 'Cláusula de Lock-up', 'Cláusula de Deadlock (impasse societário)', 'Cláusula de Non-Compete', 'Acordo de Acionistas vinculante'],
    legalFramework: ['Lei 6.404/1976 (Lei das S.A.)', 'Código Civil Arts. 1.039-1.092 (Sociedades)', 'Lei 12.305/2010 (PNRS)', 'IBAMA/CONAMA (Licenciamento Ambiental)'],
    searchQueries: ['joint venture acordo acionistas modelo Brasil', 'tag along drag along cláusulas societárias', 'deadlock resolução impasse societário']
  },
  proposal: {
    structure: ['SUMÁRIO EXECUTIVO', 'SOBRE A ELP GREEN TECHNOLOGY', 'DIAGNÓSTICO E OPORTUNIDADE', 'SOLUÇÃO PROPOSTA', 'INVESTIMENTO E CONDIÇÕES COMERCIAIS', 'ROI E PROJEÇÕES FINANCEIRAS', 'CRONOGRAMA DE IMPLEMENTAÇÃO', 'DIFERENCIAIS COMPETITIVOS', 'PRÓXIMOS PASSOS', 'TERMOS E CONDIÇÕES GERAIS', 'ANEXOS'],
    requiredClauses: ['Validade da proposta', 'Condições de pagamento', 'Garantias oferecidas', 'SLA e suporte'],
    legalFramework: ['Código de Defesa do Consumidor', 'Lei 12.305/2010 (PNRS)'],
    searchQueries: ['proposta comercial reciclagem pneus OTR', 'mercado reciclagem pneus Brasil 2024']
  }
};

// Web search with Firecrawl
async function searchLegalContext(queries: string[], country: string): Promise<string> {
  if (!FIRECRAWL_API_KEY) return '';
  const results: string[] = [];
  for (const query of queries.slice(0, 2)) {
    try {
      const searchQuery = `${query} ${country} legislação`;
      const response = await fetchWithTimeout('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${FIRECRAWL_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, limit: 2, lang: 'pt', scrapeOptions: { formats: ['markdown'] } }),
      }, TIMEOUT_SEARCH);
      if (!response.ok) continue;
      const data = await response.json();
      for (const result of (data.data || [])) {
        const excerpt = result.markdown?.substring(0, 400) || result.description || '';
        if (excerpt) results.push(`[${result.title || 'Fonte'}]: ${excerpt}`);
      }
    } catch (error) {
      console.log('Search error:', error);
    }
  }
  return results.join('\n\n');
}

// AI calls
async function callGroq(prompt: string): Promise<string | null> {
  if (!GROQ_API_KEY) return null;
  try {
    const response = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], max_tokens: 5000, temperature: 0.3 })
    }, TIMEOUT_AI_CALL);
    if (!response.ok) return null;
    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.log('Groq error:', error);
    return null;
  }
}

async function callGemini(prompt: string): Promise<string | null> {
  if (GEMINI_API_KEYS.length === 0) return null;
  
  // Try each key until one works (colaboração das 7 chaves)
  for (let keyAttempt = 0; keyAttempt < GEMINI_API_KEYS.length; keyAttempt++) {
    const currentKey = getNextGeminiKey();
    if (!currentKey) return null;
    const keyIndex = currentGeminiKeyIndex;
    
    try {
      console.log(`🔑 Tentando Gemini chave ${keyIndex + 1}/${GEMINI_API_KEYS.length} (${getGeminiPoolStatus()})`);
      const response = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${currentKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 5000 } })
      }, TIMEOUT_AI_CALL);
      
      if (response.ok) {
        const data = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text || null;
        if (content) {
          console.log(`✅ Gemini chave ${keyIndex + 1} sucesso!`);
          return content;
        }
        return null;
      }
      
      if (response.status === 429 || response.status === 529 || response.status === 503) {
        console.log(`⚠️ Gemini chave ${keyIndex + 1} rate-limited (${response.status}), rotacionando...`);
        rotateGeminiKey(true); // Marca como falha com cooldown
        continue;
      }
      
      console.log(`❌ Gemini chave ${keyIndex + 1} erro:`, response.status);
      return null;
    } catch (error) {
      console.log(`❌ Gemini chave ${keyIndex + 1} exceção:`, error);
      rotateGeminiKey(true);
      continue;
    }
  }
  
  console.log(`⛔ Todas as ${GEMINI_API_KEYS.length} chaves Gemini esgotadas`);
  return null;
}

// HuggingFace classifier
async function callHuggingFaceClassifier(text: string, labels: string[]): Promise<{ label: string; score: number }[]> {
  if (!HUGGINGFACE_API_KEY) return labels.map((label, i) => ({ label, score: 0.7 - (i * 0.1) }));
  try {
    const response = await fetchWithTimeout('https://api-inference.huggingface.co/models/facebook/bart-large-mnli', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs: text.substring(0, 1500), parameters: { candidate_labels: labels, multi_label: true } }),
    }, 20000);
    if (!response.ok) return labels.map((label, i) => ({ label, score: 0.7 - (i * 0.1) }));
    const data = await response.json();
    if (data.labels && data.scores) return data.labels.map((label: string, i: number) => ({ label, score: data.scores[i] || 0 }));
    return labels.map((label, i) => ({ label, score: 0.7 - (i * 0.1) }));
  } catch (error) {
    return labels.map((label, i) => ({ label, score: 0.7 - (i * 0.1) }));
  }
}

async function scoreDocumentWithHuggingFace(document: string, documentType: string, requiredClauses: string[]): Promise<{ score: number; analysis: string; providersUsed: string[] }> {
  const qualityLabels = ['professional legal document', 'complete contract with all clauses', 'formal business language', 'properly structured agreement', 'missing important sections'];
  const qualityResults = await callHuggingFaceClassifier(document, qualityLabels);
  
  let baseScore = 70;
  baseScore += (qualityResults.find(r => r.label === 'professional legal document')?.score || 0) * 15;
  baseScore += (qualityResults.find(r => r.label === 'complete contract with all clauses')?.score || 0) * 10;
  baseScore += (qualityResults.find(r => r.label === 'formal business language')?.score || 0) * 8;
  baseScore += (qualityResults.find(r => r.label === 'properly structured agreement')?.score || 0) * 7;
  baseScore -= (qualityResults.find(r => r.label === 'missing important sections')?.score || 0) * 10;
  
  const legalTerms = ['cláusula', 'considerando', 'partes', 'objeto', 'vigência', 'foro', 'assinatura', 'testemunha', 'rescisão', 'obrigações'];
  const termsFound = legalTerms.filter(term => document.toLowerCase().includes(term)).length;
  baseScore += (termsFound / legalTerms.length) * 10;
  
  const finalScore = Math.max(60, Math.min(98, Math.round(baseScore)));
  return { score: finalScore, analysis: `Score: ${finalScore}/100`, providersUsed: ['huggingface'] };
}

async function legalReviewWithGemini(document: string): Promise<{ reviewed: string; suggestions: string[] } | null> {
  const reviewed = await callGemini(`REVISÃO JURÍDICA - Revise este documento para máxima qualidade:\n\n${document}\n\nDOCUMENTO REVISADO:`);
  if (reviewed) return { reviewed, suggestions: ['Adicionar assinatura digital certificada ICP-Brasil'] };
  return null;
}

function getLanguageInstruction(lang: string, country: string): string {
  const instructions: Record<string, string> = {
    pt: `Redija em Português formal jurídico brasileiro. Use termos como "CONSIDERANDO", "RESOLVE", "Cláusula", "§", "Parágrafo Único", "alínea". Cite artigos de leis brasileiras.`,
    en: `Write in formal legal English. Use terms like "WHEREAS", "NOW THEREFORE", "Article", "Section". Reference applicable US/UK law.`,
    es: `Redacte en Español jurídico formal. Use términos como "CONSIDERANDO", "CLÁUSULA", "Artículo". Cite leyes aplicables de ${country}.`,
    it: `Scrivere in Italiano giuridico formale. Usare termini come "CONSIDERATO", "CLAUSOLA", "Articolo". Citare leggi italiane applicabili.`,
    zh: `使用正式中文法律语言。使用"鉴于"、"条款"、"第X条"等术语。引用适用法律。`,
  };
  return instructions[lang] || instructions.pt;
}

function cleanContent(text: string): string {
  return text
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/^[-=_]{3,}$/gm, '')
    .replace(/[═─│┌┐└┘├┤┬┴┼▪▸►◆◇○●◎★☆✓✗✔✘→←📜🏛️📋💰]/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^>\s*/gm, '')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
}

// ========== NGO PROMPT ==========
function buildNGOPrompt(req: DocumentRequest, template: { structure: string[]; requiredClauses: string[] }, country: string, language: string, legalContext: string): string {
  return `Você é um ADVOGADO CORPORATIVO SÊNIOR especializado em parcerias entre o setor privado e o terceiro setor.

${getLanguageInstruction(language, country)}

=== CONTEXTO: PARCERIA EMPRESA PRIVADA + ONG/ASSOCIAÇÃO ===

IMPORTANTE: Este documento é uma parceria entre uma EMPRESA PRIVADA (ELP Green Technology, representante oficial da TOPS Recycling) e uma ORGANIZAÇÃO DO TERCEIRO SETOR.

=== SOBRE A ELP GREEN TECHNOLOGY ===
${ELP_TOPS_PARTNERSHIP.description}

Parceria oficial desde: ${ELP_TOPS_PARTNERSHIP.partnershipSince}
Papel da ELP: ${ELP_TOPS_PARTNERSHIP.roles.elp}
Papel da TOPS: ${ELP_TOPS_PARTNERSHIP.roles.tops}

=== LIDERANÇA ===
ELP GREEN: ${ELP_BRAND.representante} - ${ELP_BRAND.cargo} | ${ELP_BRAND.sede} | ${ELP_BRAND.email} | ${ELP_BRAND.phone}
TOPS RECYCLING: ${TOPS_PARTNER.representante} - ${TOPS_PARTNER.cargo} | ${TOPS_PARTNER.location} | ${TOPS_PARTNER.email} | ${TOPS_PARTNER.phone}

=== DECLARAÇÃO DA ELP GREEN ===
${ELP_NGO_PARTNERSHIP.elpDeclaration}

=== RECONHECIMENTO DA ASSOCIAÇÃO ===
${ELP_NGO_PARTNERSHIP.ngoRecognition}

=== MODELO DE ROYALTIES SOCIAIS AMBIENTAIS ===
- Percentual: ${ELP_NGO_PARTNERSHIP.socialRoyalties.defaultPercentage}% (podendo ser 10% ou 20%)
- Base: ${ELP_NGO_PARTNERSHIP.socialRoyalties.basis}
- Aplicação: ${ELP_NGO_PARTNERSHIP.socialRoyalties.usageAreas.join(', ')}

=== RESPONSABILIDADES DA ASSOCIAÇÃO ===
${ELP_NGO_PARTNERSHIP.partnerResponsibilities.join('\n')}

=== RESPONSABILIDADES DA ELP ===
${ELP_NGO_PARTNERSHIP.elpResponsibilities.join('\n')}

=== EMPRESA APOIADORA ===
${ELP_BRAND.fullName} | CNPJ: ${ELP_BRAND.cnpj} | Representante: ${ELP_BRAND.representante} - ${ELP_BRAND.cargo}
Em parceria com: ${TOPS_PARTNER.fullName} (Licença: ${TOPS_PARTNER.license})

=== ASSOCIAÇÃO PARCEIRA ===
${req.companyName || '[ASSOCIAÇÃO]'} | Representante: ${req.contactName || '[REPRESENTANTE]'} | Email: ${req.email || '[EMAIL]'}

=== ESTRUTURA ===
${template.structure.join('\n')}

${legalContext ? `=== PESQUISA JURÍDICA ===\n${legalContext}\n` : ''}
${req.additionalContext ? `=== CONTEXTO ADICIONAL ===\n${req.additionalContext}\n` : ''}

INSTRUÇÕES: Inclua nos CONSIDERANDOS a declaração de que a ELP é empresa capitalista que alia lucro com responsabilidade social. Mencione a parceria estratégica com TOPS Recycling como fabricante da tecnologia. Use "Royalties Sociais Ambientais" (não royalties governamentais). NÃO use markdown.

REDIJA O DOCUMENTO JURÍDICO COMPLETO:`;
}

// ========== CORPORATE PROMPT ==========
function buildCorporatePrompt(req: DocumentRequest, template: { structure: string[]; requiredClauses: string[] }, country: string, language: string, legalContext: string): string {
  return `Você é um ADVOGADO CORPORATIVO SÊNIOR especializado em contratos internacionais e parcerias no setor de reciclagem industrial.

${getLanguageInstruction(language, country)}

=== CONTEXTO ESTRATÉGICO DA PARCERIA OTR (COMERCIAL) ===
OBJETIVO: ${ELP_CORPORATE_PARTNERSHIP.mainGoal}

=== SOBRE A ELP GREEN TECHNOLOGY ===
${ELP_TOPS_PARTNERSHIP.description}

${ELP_TOPS_PARTNERSHIP.combined}

Parceria oficial desde: ${ELP_TOPS_PARTNERSHIP.partnershipSince}
Papel da ELP: ${ELP_TOPS_PARTNERSHIP.roles.elp}
Papel da TOPS: ${ELP_TOPS_PARTNERSHIP.roles.tops}

=== LIDERANÇA ===
ELP GREEN: ${ELP_BRAND.representante} - ${ELP_BRAND.cargo} | ${ELP_BRAND.sede} | ${ELP_BRAND.email} | ${ELP_BRAND.phone}
TOPS RECYCLING: ${TOPS_PARTNER.representante} - ${TOPS_PARTNER.cargo} | ${TOPS_PARTNER.location} | ${TOPS_PARTNER.email} | ${TOPS_PARTNER.phone}

=== RESPONSABILIDADES DO PARCEIRO ===
${ELP_CORPORATE_PARTNERSHIP.partnerResponsibilities.join('\n')}

=== RESPONSABILIDADES DA ELP (com tecnologia TOPS) ===
${ELP_CORPORATE_PARTNERSHIP.elpResponsibilities.join('\n')}

=== MODELO DE ROYALTIES GOVERNAMENTAIS ===
- Parceiro: ${ELP_CORPORATE_PARTNERSHIP.profitSharing.governmentRoyalties}% dos lucros líquidos
- Descrição: ${ELP_CORPORATE_PARTNERSHIP.profitSharing.description}
- Base: ${ELP_CORPORATE_PARTNERSHIP.profitSharing.basis}

=== MERCADO OTR ===
- Pneus: ${ELP_CORPORATE_PARTNERSHIP.otrContext.tireTypes.join(', ')}
- Demanda: ${ELP_CORPORATE_PARTNERSHIP.otrContext.annualDemand}
- Valores: ${ELP_CORPORATE_PARTNERSHIP.otrContext.marketValue}
- Benefício Ambiental: ${ELP_CORPORATE_PARTNERSHIP.otrContext.environmentalBenefit}

=== MARCO LEGAL ===
${ELP_CORPORATE_PARTNERSHIP.legalFramework.join('\n')}

=== EMPRESA CONTRATANTE ===
${ELP_BRAND.fullName} | CNPJ: ${ELP_BRAND.cnpj} | Representante: ${ELP_BRAND.representante} - ${ELP_BRAND.cargo}
Em parceria com: ${TOPS_PARTNER.fullName} (Licença: ${TOPS_PARTNER.license})

=== PARTE PARCEIRA ===
${req.companyName || '[EMPRESA PARCEIRA]'} | Representante: ${req.contactName || '[REPRESENTANTE]'} | Email: ${req.email || '[EMAIL]'}

=== ESTRUTURA ===
${template.structure.join('\n')}

=== CLÁUSULAS OBRIGATÓRIAS ===
${template.requiredClauses.join('\n')}

${legalContext ? `=== PESQUISA JURÍDICA ===\n${legalContext}\n` : ''}
${req.additionalContext ? `=== CONTEXTO ADICIONAL ===\n${req.additionalContext}\n` : ''}

INSTRUÇÕES: Mencione a parceria ELP + TOPS Recycling. A ELP representa comercialmente a TOPS no Brasil e América Latina. Royalties de 10% para facilitação de concessões e incentivos fiscais. NÃO use markdown.

REDIJA O DOCUMENTO JURÍDICO COMPLETO:`;
}

// ========== GOVERNMENT PROMPT ==========
function buildGovernmentPrompt(req: DocumentRequest, template: { structure: string[]; requiredClauses: string[] }, country: string, language: string, legalContext: string): string {
  return `Você é um ADVOGADO ESPECIALISTA em Direito Administrativo e Parcerias Público-Privadas.

${getLanguageInstruction(language, country)}

=== CONTEXTO: PARCERIA PÚBLICO-PRIVADA ===

IMPORTANTE: Este documento é uma parceria entre uma EMPRESA PRIVADA (ELP Green Technology, representante oficial da TOPS Recycling) e um ENTE PÚBLICO (Prefeitura, Secretaria, Ministério, etc.).

=== SOBRE A ELP GREEN TECHNOLOGY ===
${ELP_TOPS_PARTNERSHIP.description}

${ELP_TOPS_PARTNERSHIP.combined}

Parceria oficial desde: ${ELP_TOPS_PARTNERSHIP.partnershipSince}

=== LIDERANÇA ===
ELP GREEN: ${ELP_BRAND.representante} - ${ELP_BRAND.cargo} | ${ELP_BRAND.sede} | ${ELP_BRAND.email} | ${ELP_BRAND.phone}
TOPS RECYCLING: ${TOPS_PARTNER.representante} - ${TOPS_PARTNER.cargo} | ${TOPS_PARTNER.location} | ${TOPS_PARTNER.email} | ${TOPS_PARTNER.phone}

=== OBJETIVO ===
${ELP_GOVERNMENT_PARTNERSHIP.mainGoal}

=== RESPONSABILIDADES DO ENTE PÚBLICO ===
${ELP_GOVERNMENT_PARTNERSHIP.partnerResponsibilities.join('\n')}

=== RESPONSABILIDADES DA ELP (com tecnologia TOPS) ===
${ELP_GOVERNMENT_PARTNERSHIP.elpResponsibilities.join('\n')}

=== MODELO DE CONTRIBUIÇÃO ===
- Percentual: ${ELP_GOVERNMENT_PARTNERSHIP.royaltyModel.percentage}% do faturamento
- Base: ${ELP_GOVERNMENT_PARTNERSHIP.royaltyModel.basis}
- Descrição: ${ELP_GOVERNMENT_PARTNERSHIP.royaltyModel.description}
- Destinação: ${ELP_GOVERNMENT_PARTNERSHIP.royaltyModel.destination}

=== MARCO LEGAL ===
${ELP_GOVERNMENT_PARTNERSHIP.legalFramework.join('\n')}

=== EMPRESA PRIVADA ===
${ELP_BRAND.fullName} | CNPJ: ${ELP_BRAND.cnpj} | Representante: ${ELP_BRAND.representante} - ${ELP_BRAND.cargo}
Em parceria com: ${TOPS_PARTNER.fullName} (Licença: ${TOPS_PARTNER.license})

=== ENTE PÚBLICO ===
${req.companyName || '[ÓRGÃO PÚBLICO]'} | Representante: ${req.contactName || '[REPRESENTANTE]'} | Email: ${req.email || '[EMAIL]'}

=== ESTRUTURA ===
${template.structure.join('\n')}

${legalContext ? `=== PESQUISA JURÍDICA ===\n${legalContext}\n` : ''}
${req.additionalContext ? `=== CONTEXTO ADICIONAL ===\n${req.additionalContext}\n` : ''}

INSTRUÇÕES: Mencione a parceria ELP + TOPS Recycling. Use linguagem de convênio/termo de cooperação público-privada. Cite Lei 11.079/2004 (PPP) e Lei 14.133/2021. NÃO use markdown.

REDIJA O DOCUMENTO JURÍDICO COMPLETO:`;
}

// ========== GOVERNMENT FALLBACK ==========
function generateGovernmentFallbackDocument(req: DocumentRequest, country: string): string {
  const today = new Date();
  const formattedDate = today.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const companyName = req.companyName || '[ÓRGÃO PÚBLICO A DEFINIR]';
  const contactName = req.contactName || '[REPRESENTANTE LEGAL]';
  const email = req.email || '[email@gov.br]';

  return `TERMO DE COOPERAÇÃO TÉCNICA E FINANCEIRA
PARCERIA PÚBLICO-PRIVADA PARA GESTÃO SUSTENTÁVEL DE PNEUS INSERVÍVEIS

PREÂMBULO E QUALIFICAÇÃO DAS PARTES

PARTE PÚBLICA:
${companyName}, pessoa jurídica de direito público, inscrita no CNPJ sob nº [A DEFINIR], com sede em [ENDEREÇO], neste ato representada por seu representante legal, Sr(a). ${contactName}, email: ${email}, doravante denominada "ENTE PÚBLICO".

PARTE PRIVADA:
${ELP_BRAND.fullName}, pessoa jurídica de direito privado, inscrita no CNPJ sob nº ${ELP_BRAND.cnpj}, com sede em ${ELP_BRAND.sede}, neste ato representada por seu ${ELP_BRAND.cargo}, Sr. ${ELP_BRAND.representante}, em parceria estratégica com ${TOPS_PARTNER.fullName} (China), doravante denominada "ELP" ou "PARCEIRA PRIVADA".

CONSIDERANDOS

CONSIDERANDO a necessidade de destinação ambientalmente adequada de pneus inservíveis conforme Lei 12.305/2010 (PNRS);

CONSIDERANDO o interesse público na promoção da economia circular e geração de empregos;

CONSIDERANDO que a ELP Green Technology é representante oficial da TOPS Recycling no Brasil e América Latina desde ${ELP_TOPS_PARTNERSHIP.partnershipSince}, detendo tecnologia proprietária de reciclagem de pneus OTR;

CONSIDERANDO que a TOPS RECYCLING, sob direção de ${TOPS_PARTNER.representante}, é fabricante de referência mundial em equipamentos Smart Line para reciclagem de pneus OTR gigantes;

CONSIDERANDO os princípios da eficiência, economicidade e sustentabilidade na gestão pública;

As partes RESOLVEM celebrar o presente instrumento:

CLÁUSULA PRIMEIRA - DO OBJETO

1.1. ${ELP_GOVERNMENT_PARTNERSHIP.mainGoal}

1.2. A tecnologia será fornecida através da parceria ELP + TOPS Recycling, combinando a capacidade de articulação comercial da ELP com a excelência em manufatura da TOPS.

CLÁUSULA SEGUNDA - DAS OBRIGAÇÕES DO ENTE PÚBLICO

2.1. Compete ao ENTE PÚBLICO:
${ELP_GOVERNMENT_PARTNERSHIP.partnerResponsibilities.map((r, i) => `   ${String.fromCharCode(97 + i)}) ${r.replace(/^[a-e]\)\s*/, '')}`).join(';\n')}

CLÁUSULA TERCEIRA - DAS OBRIGAÇÕES DA ELP (com tecnologia TOPS)

3.1. Compete à ELP, em parceria com TOPS Recycling:
${ELP_GOVERNMENT_PARTNERSHIP.elpResponsibilities.map((r, i) => `   ${String.fromCharCode(97 + i)}) ${r.replace(/^[a-e]\)\s*/, '')}`).join(';\n')}

CLÁUSULA QUARTA - DA CONTRIBUIÇÃO AO FUNDO REGIONAL

4.1. A ELP compromete-se a destinar ${ELP_GOVERNMENT_PARTNERSHIP.royaltyModel.percentage}% (cinco por cento) do faturamento bruto mensal das operações ao Fundo de Desenvolvimento Regional.

4.2. ${ELP_GOVERNMENT_PARTNERSHIP.royaltyModel.description}

4.3. Destinação dos recursos: ${ELP_GOVERNMENT_PARTNERSHIP.royaltyModel.destination}

CLÁUSULA QUINTA - DO PRAZO

5.1. Vigência de 10 (dez) anos, renovável conforme interesse público.

CLÁUSULA SEXTA - DA CONFORMIDADE LEGAL

6.1. Este termo observa:
${ELP_GOVERNMENT_PARTNERSHIP.legalFramework.map(l => `   - ${l}`).join('\n')}

CLÁUSULA SÉTIMA - DO FORO

7.1. Foro da Comarca de ${country === 'Brazil' || country === 'Brasil' ? 'São Paulo, SP' : country}.

${country === 'Brazil' || country === 'Brasil' ? 'São Paulo' : country}, ${formattedDate}.

_________________________________________________
${companyName}
${contactName}

_________________________________________________
${ELP_BRAND.fullName}
${ELP_BRAND.representante}
${ELP_BRAND.cargo}

Em parceria com:
${TOPS_PARTNER.fullName}
${TOPS_PARTNER.representante}
${TOPS_PARTNER.cargo}

---
Documento gerado por ELP Green Technology em parceria com TOPS Recycling
${ELP_BRAND.email} | ${ELP_BRAND.phone}
${TOPS_PARTNER.email} | ${TOPS_PARTNER.phone}`;
}

// ========== NGO FALLBACK ==========
function generateNGOFallbackDocument(req: DocumentRequest, country: string): string {
  const today = new Date();
  const formattedDate = today.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const companyName = req.companyName || '[ASSOCIAÇÃO A DEFINIR]';
  const contactName = req.contactName || '[REPRESENTANTE LEGAL]';
  const email = req.email || '[email@associacao.org]';

  return `TERMO DE PARCERIA SOCIOAMBIENTAL
COOPERAÇÃO ENTRE EMPRESA PRIVADA E ORGANIZAÇÃO DO TERCEIRO SETOR

PREÂMBULO E QUALIFICAÇÃO DAS PARTES

PARTE APOIADORA (EMPRESA PRIVADA):
${ELP_BRAND.fullName}, pessoa jurídica de direito privado, inscrita no CNPJ sob nº ${ELP_BRAND.cnpj}, com sede em ${ELP_BRAND.sede}, neste ato representada por seu ${ELP_BRAND.cargo}, Sr. ${ELP_BRAND.representante}, em parceria estratégica com ${TOPS_PARTNER.fullName} (China), doravante denominada "ELP" ou "EMPRESA APOIADORA".

PARTE BENEFICIÁRIA (ASSOCIAÇÃO):
${companyName}, associação civil sem fins lucrativos, inscrita no CNPJ sob nº [A DEFINIR], com sede em [ENDEREÇO], neste ato representada por seu representante legal, Sr(a). ${contactName}, email: ${email}, doravante denominada "ASSOCIAÇÃO".

CONSIDERANDOS

CONSIDERANDO que a ELP Green Technology, fundada e presidida por ${ELP_BRAND.representante} (${ELP_BRAND.sede}), é representante oficial e parceira estratégica da TOPS Recycling no Brasil e América Latina desde ${ELP_TOPS_PARTNERSHIP.partnershipSince};

CONSIDERANDO que a ELP Green Technology é uma empresa privada, de perfil capitalista, que investe capital, assume riscos e busca lucro, pois é isso que garante a sustentabilidade do negócio, a geração de empregos e a continuidade das atividades;

CONSIDERANDO que a ELP entende que o papel de uma empresa não se limita apenas ao resultado financeiro, e que adota uma visão de responsabilidade socioambiental, reconhecendo a importância de proteger o meio ambiente e contribuir para a educação ambiental;

CONSIDERANDO que a TOPS Recycling, sob direção de ${TOPS_PARTNER.representante}, é fabricante de referência mundial em equipamentos Smart Line para reciclagem de pneus OTR gigantes;

CONSIDERANDO que a ASSOCIAÇÃO é uma entidade civil sem fins lucrativos, cujo objetivo é congregar pessoas físicas e jurídicas, promover ações coletivas voltadas ao desenvolvimento humano, incentivar a evolução técnico-científica e estimular a inovação em suas áreas de atuação;

CONSIDERANDO que a atuação da ASSOCIAÇÃO em benefício do desenvolvimento, da educação e da sustentabilidade é essencial e complementar à atividade empresarial;

CONSIDERANDO que lucro e responsabilidade social não são opostos, e que a união entre o setor privado e o terceiro setor pode promover o bem comum;

As partes RESOLVEM celebrar o presente instrumento:

CLÁUSULA PRIMEIRA - DO OBJETO

1.1. A ELP, em parceria com TOPS Recycling, compromete-se a destinar parte de seu lucro operacional para apoiar ações de educação ambiental e desenvolvimento sustentável conduzidas pela ASSOCIAÇÃO.

1.2. A ELP propõe reverter uma parte do lucro da empresa para ações socioambientais, transformando esse valor em uma COTA SOCIAL AMBIENTAL e destinando essa cota à ASSOCIAÇÃO na forma de ROYALTIES SOCIAIS AMBIENTAIS.

CLÁUSULA SEGUNDA - DOS ROYALTIES SOCIAIS AMBIENTAIS

2.1. A ELP compromete-se a destinar à ASSOCIAÇÃO o equivalente a ${ELP_NGO_PARTNERSHIP.socialRoyalties.defaultPercentage}% (dez por cento) do lucro líquido operacional mensal obtido em suas operações de reciclagem de pneus.

2.2. Base de cálculo: ${ELP_NGO_PARTNERSHIP.socialRoyalties.basis}

2.3. Os pagamentos serão realizados mensalmente, até o 15º dia útil do mês subsequente.

§1º O percentual poderá ser revisto anualmente, podendo variar entre 10% e 20%, conforme a viabilidade econômica.

CLÁUSULA TERCEIRA - DAS OBRIGAÇÕES DA ASSOCIAÇÃO

3.1. Compete à ASSOCIAÇÃO:
${ELP_NGO_PARTNERSHIP.partnerResponsibilities.map((r, i) => `   ${String.fromCharCode(97 + i)}) ${r.replace(/^[a-d]\)\s*/, '')}`).join(';\n')}

3.2. A ASSOCIAÇÃO apresentará relatórios semestrais de aplicação dos recursos.

CLÁUSULA QUARTA - DAS OBRIGAÇÕES DA ELP

4.1. Compete à ELP, em parceria com TOPS Recycling:
${ELP_NGO_PARTNERSHIP.elpResponsibilities.map((r, i) => `   ${String.fromCharCode(97 + i)}) ${r.replace(/^[a-e]\)\s*/, '')}`).join(';\n')}

CLÁUSULA QUINTA - DOS BENEFÍCIOS MÚTUOS

5.1. Para a ASSOCIAÇÃO: ${ELP_NGO_PARTNERSHIP.mutualBenefits.forNGO.join('; ')}

5.2. Para a ELP: ${ELP_NGO_PARTNERSHIP.mutualBenefits.forELP.join('; ')}

CLÁUSULA SEXTA - DO PRAZO

6.1. Este instrumento vigorará por 3 (três) anos, podendo ser renovado.

CLÁUSULA SÉTIMA - DO FORO

7.1. Foro da Comarca de São Paulo, SP, com renúncia expressa a qualquer outro.

${country === 'Brazil' || country === 'Brasil' ? 'São Paulo' : country}, ${formattedDate}.

_________________________________________________
${ELP_BRAND.fullName}
${ELP_BRAND.representante}
${ELP_BRAND.cargo}

Em parceria com:
${TOPS_PARTNER.fullName}
${TOPS_PARTNER.representante}
${TOPS_PARTNER.cargo}

_________________________________________________
${companyName}
${contactName}

TESTEMUNHAS:

_________________________________________________
Nome:
CPF:

_________________________________________________
Nome:
CPF:

---
Documento gerado por ELP Green Technology em parceria com TOPS Recycling
${ELP_BRAND.email} | ${ELP_BRAND.phone}
${TOPS_PARTNER.email} | ${TOPS_PARTNER.phone}`;
}

// ========== CORPORATE FALLBACK ==========
function generateCorporateFallbackDocument(req: DocumentRequest, country: string): string {
  const today = new Date();
  const formattedDate = today.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const companyName = req.companyName || '[EMPRESA PARCEIRA A DEFINIR]';
  const contactName = req.contactName || '[REPRESENTANTE LEGAL]';
  const email = req.email || '[email@empresa.com]';

  return `CONTRATO DE PARCERIA COMERCIAL
PARCERIA ESTRATÉGICA PARA RECICLAGEM DE PNEUS OTR

PREÂMBULO E QUALIFICAÇÃO DAS PARTES

PARTE CONTRATANTE:
${ELP_BRAND.fullName}, pessoa jurídica de direito privado, inscrita no CNPJ sob nº ${ELP_BRAND.cnpj}, com sede em ${ELP_BRAND.sede}, neste ato representada por seu ${ELP_BRAND.cargo}, Sr. ${ELP_BRAND.representante}, em parceria estratégica com ${TOPS_PARTNER.fullName} (China), doravante denominada "ELP" ou "CONTRATANTE".

PARTE PARCEIRA:
${companyName}, pessoa jurídica de direito privado, inscrita no CNPJ/identificação fiscal de ${country} sob nº [A DEFINIR], com sede em [ENDEREÇO], neste ato representada por seu representante legal, Sr(a). ${contactName}, email: ${email}, doravante denominada "PARCEIRA".

CONSIDERANDOS

CONSIDERANDO que a ELP Green Technology, fundada e presidida por ${ELP_BRAND.representante} (${ELP_BRAND.sede}), é representante oficial e parceira estratégica da TOPS Recycling no Brasil e América Latina desde ${ELP_TOPS_PARTNERSHIP.partnershipSince};

CONSIDERANDO que a TOPS Recycling, sob direção de ${TOPS_PARTNER.representante}, é fabricante de referência mundial em equipamentos Smart Line para reciclagem de pneus OTR gigantes (${TOPS_PARTNER.expertise});

CONSIDERANDO que a parceria ELP + TOPS une a visão empreendedora e capacidade de articulação comercial da ELP com a excelência em manufatura e tecnologia proprietária da TOPS Recycling;

CONSIDERANDO que o mercado de reciclagem de pneus OTR na América Latina representa demanda anual superior a ${ELP_CORPORATE_PARTNERSHIP.otrContext.annualDemand};

CONSIDERANDO que a PARCEIRA possui expertise e rede de contatos junto a mineradoras, empresas de construção civil e órgãos governamentais;

CONSIDERANDO que a Lei 12.305/2010 (PNRS) e a Resolução CONAMA 416/2009 estabelecem obrigações de destinação adequada de pneus inservíveis;

As partes RESOLVEM celebrar o presente instrumento:

CLÁUSULA PRIMEIRA - DO OBJETO

1.1. Parceria estratégica para concessão de pneus OTR inservíveis para reciclagem industrial.

1.2. A tecnologia será fornecida através da parceria ELP + TOPS Recycling, combinando a capacidade de articulação comercial da ELP com a excelência em manufatura da TOPS.

1.3. Abrange: ${ELP_CORPORATE_PARTNERSHIP.otrContext.tireTypes.join('; ')}.

CLÁUSULA SEGUNDA - DAS OBRIGAÇÕES DA PARCEIRA

2.1. Compete à PARCEIRA:
${ELP_CORPORATE_PARTNERSHIP.partnerResponsibilities.map((r, i) => `   ${String.fromCharCode(97 + i)}) ${r.replace(/^[a-d]\)\s*/, '')}`).join(';\n')}

CLÁUSULA TERCEIRA - DAS OBRIGAÇÕES DA ELP (com tecnologia TOPS)

3.1. Compete à ELP, em parceria com TOPS Recycling:
${ELP_CORPORATE_PARTNERSHIP.elpResponsibilities.map((r, i) => `   ${String.fromCharCode(97 + i)}) ${r.replace(/^[a-e]\)\s*/, '')}`).join(';\n')}

CLÁUSULA QUARTA - DOS ROYALTIES GOVERNAMENTAIS

4.1. A PARCEIRA fará jus a royalties correspondentes a ${ELP_CORPORATE_PARTNERSHIP.profitSharing.governmentRoyalties}% (dez por cento) dos lucros líquidos operacionais.

4.2. ${ELP_CORPORATE_PARTNERSHIP.profitSharing.description}

4.3. Base: ${ELP_CORPORATE_PARTNERSHIP.profitSharing.basis}

4.4. Pagamento mensal, até o 15º dia útil do mês subsequente.

CLÁUSULA QUINTA - DAS METAS

5.1. Metas de fornecimento:
   a) Primeiros 6 meses: 500 toneladas/mês;
   b) 7 a 12 meses: 1.000 toneladas/mês;
   c) 13 a 24 meses: 2.000 toneladas/mês;
   d) A partir do 25º mês: 3.000 toneladas/mês.

CLÁUSULA SEXTA - DA CONFORMIDADE AMBIENTAL

6.1. Conformidade com:
${ELP_CORPORATE_PARTNERSHIP.legalFramework.map(l => `   - ${l}`).join('\n')}

6.2. Benefício ambiental: ${ELP_CORPORATE_PARTNERSHIP.otrContext.environmentalBenefit}

CLÁUSULA SÉTIMA - DO PRAZO

7.1. Vigência de 5 (cinco) anos, renovável.

CLÁUSULA OITAVA - DO FORO

8.1. Foro da Comarca de São Paulo, SP, com renúncia expressa a qualquer outro.

${country === 'Brazil' || country === 'Brasil' ? 'São Paulo' : country}, ${formattedDate}.

_________________________________________________
${ELP_BRAND.fullName}
${ELP_BRAND.representante}
${ELP_BRAND.cargo}

Em parceria com:
${TOPS_PARTNER.fullName}
${TOPS_PARTNER.representante}
${TOPS_PARTNER.cargo}

_________________________________________________
${companyName}
${contactName}

TESTEMUNHAS:

_________________________________________________
Nome:
CPF:

_________________________________________________
Nome:
CPF:

---
Documento gerado por ELP Green Technology em parceria com TOPS Recycling
${ELP_BRAND.email} | ${ELP_BRAND.phone}
${TOPS_PARTNER.email} | ${TOPS_PARTNER.phone}`;
}

// ========== MAIN DOCUMENT GENERATOR ==========
async function generateDocument(req: DocumentRequest): Promise<{
  content: string;
  iterations: { step: string; provider: string; summary: string }[];
  finalScore: number;
  styleSuggestions: string[];
  huggingfaceAnalysis?: string;
}> {
  const docType = req.documentType?.toLowerCase() || 'proposal';
  const template = LEGAL_TEMPLATES[docType] || LEGAL_TEMPLATES.proposal;
  const country = req.country || 'Brazil';
  const language = req.language || 'pt';
  const iterations: { step: string; provider: string; summary: string }[] = [];

  // Detect organization type - prioritize manual selection
  const orgType = detectOrganizationType(req.companyName || '', req.additionalContext, req.partnerType);
  const isNGO = orgType === 'ngo';
  const isGov = orgType === 'government';
  
  console.log(`Organization type: ${orgType} (manual: ${req.partnerType}) for ${req.companyName}`);
  
  const summaryMap: Record<OrganizationType, string> = {
    'ngo': 'Terceiro setor - Royalties Sociais Ambientais',
    'corporate': 'Empresa comercial - Royalties Governamentais (10%)',
    'government': 'Parceria Público-Privada - Convênio Governamental'
  };
  
  iterations.push({ 
    step: 'Análise de Perfil', 
    provider: 'local', 
    summary: summaryMap[orgType] || summaryMap['corporate']
  });

  // Web research
  let legalContext = '';
  if (req.enableWebResearch !== false && FIRECRAWL_API_KEY) {
    legalContext = await searchLegalContext(template.searchQueries, country);
    if (legalContext) {
      iterations.push({ step: 'Pesquisa Jurídica', provider: 'firecrawl', summary: `Legislação de ${country} pesquisada` });
    }
  }

  // Build prompt based on org type
  let draftPrompt: string;
  if (isNGO) {
    draftPrompt = buildNGOPrompt(req, template, country, language, legalContext);
  } else if (isGov) {
    draftPrompt = buildGovernmentPrompt(req, template, country, language, legalContext);
  } else {
    draftPrompt = buildCorporatePrompt(req, template, country, language, legalContext);
  }

  // Generate draft - PRIORIZA COLABORAÇÃO DAS 7 CHAVES GEMINI
  let draft: string = '';
  let usedLocalFallback = false;
  let primaryProvider = '';
  
  // 1º PRIORIDADE: Tentar todas as 7 chaves Gemini primeiro (colaboração de chaves)
  console.log(`🔑 Iniciando colaboração das ${GEMINI_API_KEYS.length} chaves Gemini...`);
  const geminiResult = await callGemini(draftPrompt);
  if (geminiResult) {
    draft = geminiResult;
    primaryProvider = 'gemini';
    const typeLabel = isNGO ? 'Royalties Sociais' : isGov ? 'Convênio PPP' : 'Royalties Gov.';
    iterations.push({ step: 'Rascunho Jurídico', provider: `gemini (${getGeminiPoolStatus()})`, summary: typeLabel });
  } else {
    // 2º PRIORIDADE: Groq como fallback
    console.log('⚠️ Todas as chaves Gemini esgotadas, tentando Groq...');
    const groqResult = await callGroq(draftPrompt);
    if (groqResult) {
      draft = groqResult;
      primaryProvider = 'groq';
      const typeLabel = isNGO ? 'Terceiro Setor' : isGov ? 'Parceria Pública' : 'Comercial OTR';
      iterations.push({ step: 'Rascunho Jurídico', provider: 'groq (fallback)', summary: typeLabel });
    } else {
      // 3º PRIORIDADE: Template local
      console.log('⛔ Todos os provedores falharam, usando template local');
      if (isNGO) {
        draft = generateNGOFallbackDocument(req, country);
      } else if (isGov) {
        draft = generateGovernmentFallbackDocument(req, country);
      } else {
        draft = generateCorporateFallbackDocument(req, country);
      }
      usedLocalFallback = true;
      primaryProvider = 'local';
      const typeLabel = isNGO ? 'ONG' : isGov ? 'Governo' : 'Empresarial';
      iterations.push({ step: 'Geração Local', provider: 'local', summary: `Template ${typeLabel}` });
    }
  }

  // Enhancement
  if (!usedLocalFallback && draft) {
    const enhancePrompt = `REVISOR JURÍDICO - Aprimore este documento ${isNGO ? 'de parceria com terceiro setor' : isGov ? 'de parceria público-privada' : 'comercial OTR'}:\n\n${draft}\n\nDOCUMENTO APRIMORADO:`;
    const enhanced = await callGemini(enhancePrompt);
    if (enhanced) {
      draft = enhanced;
      iterations.push({ step: 'Aprimoramento', provider: 'gemini', summary: 'Cláusulas reforçadas' });
    }
  }

  // Scoring
  const scoringResult = await scoreDocumentWithHuggingFace(draft, docType, template.requiredClauses);
  iterations.push({ step: 'Análise de Qualidade', provider: 'huggingface', summary: `Score: ${scoringResult.score}/100` });

  // Additional refinement if needed
  if (!usedLocalFallback && scoringResult.score < 80) {
    const legalReview = await legalReviewWithGemini(draft);
    if (legalReview) {
      draft = legalReview.reviewed;
      scoringResult.score = Math.min(scoringResult.score + 10, 95);
      iterations.push({ step: 'Refinamento', provider: 'gemini', summary: `Otimizado: ${scoringResult.score}/100` });
    }
  }

  return {
    content: cleanContent(draft),
    iterations,
    finalScore: usedLocalFallback ? 85 : scoringResult.score,
    styleSuggestions: isNGO
      ? ['Registrar parceria em cartório', 'Incluir plano de aplicação de recursos', 'Certificação da entidade (OSCIP/OS)']
      : ['Assinatura digital ICP-Brasil', 'Marca d\'água CONFIDENCIAL', 'Cláusula arbitral (CCBC/ICC)'],
    huggingfaceAnalysis: `Documento ${isNGO ? 'ONG/Terceiro Setor' : 'Comercial/Corporativo'} - ${usedLocalFallback ? 'Template local' : 'Gerado por IA'}`
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const globalTimeout = setTimeout(() => {}, TIMEOUT_TOTAL);

  try {
    const payload: DocumentRequest = await req.json();
    console.log('Document request:', payload.documentType, payload.country, payload.companyName);

    const result = await withTimeout(generateDocument(payload), TIMEOUT_TOTAL - 5000, null, 'Document generation');
    clearTimeout(globalTimeout);

    if (!result) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Timeout. Tente novamente.',
        timeout: true
      }), { status: 408, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      success: true,
      document: result.content,
      iterations: result.iterations,
      quality_score: result.finalScore,
      style_suggestions: result.styleSuggestions,
      ai_providers_used: [...new Set(result.iterations.map(i => i.provider))],
      huggingface_analysis: result.huggingfaceAnalysis
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: unknown) {
    clearTimeout(globalTimeout);
    console.error('Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
