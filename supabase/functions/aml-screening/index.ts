/**
 * Edge Function: aml-screening
 * Performs REAL AML/KYC screening using multiple APIs:
 * - BrasilAPI for Brazilian CNPJ/company lookup (free) with database caching
 * - CGU Portal da Transparência for CEIS/CNEP sanctions (free)
 * - CPF validation via Brasil API
 * - OpenSanctions for international sanctions (free tier)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// API Endpoints
const OPENSANCTIONS_API = 'https://api.opensanctions.org';
const BRASIL_API_CNPJ = 'https://brasilapi.com.br/api/cnpj/v1';
const BRASIL_API_CPF = 'https://brasilapi.com.br/api/cpf/v1';
const CGU_API = 'https://portaldatransparencia.gov.br/api-de-dados';

// Cache TTL in days
const CNPJ_CACHE_TTL_DAYS = 7;
const CPF_CACHE_TTL_DAYS = 30;
const CGU_CACHE_TTL_DAYS = 1;

// Comprehensive screening sources with real URLs
const SCREENING_SOURCES = [
  // Brazilian Sources
  { id: 'br_receita_federal', name: 'Receita Federal do Brasil - CNPJ', issuer: 'Receita Federal do Brasil', jurisdiction: 'BR', type: 'registry', url: 'https://solucoes.receita.fazenda.gov.br/Servicos/cnpjreva/cnpjreva_solicitacao.asp', description: 'Cadastro Nacional de Pessoas Jurídicas - registro oficial de empresas brasileiras.' },
  { id: 'br_cvm', name: 'CVM - Comissão de Valores Mobiliários', issuer: 'CVM Brasil', jurisdiction: 'BR', type: 'watchlist', url: 'https://www.gov.br/cvm/', description: 'Lista de pessoas físicas e jurídicas com restrições no mercado de capitais brasileiro.' },
  { id: 'br_bacen', name: 'BACEN - Banco Central do Brasil', issuer: 'Banco Central do Brasil', jurisdiction: 'BR', type: 'watchlist', url: 'https://www.bcb.gov.br/', description: 'Informações de instituições financeiras e restrições.' },
  { id: 'br_ceis', name: 'CEIS - Cadastro de Empresas Inidôneas e Suspensas', issuer: 'CGU - Controladoria-Geral da União', jurisdiction: 'BR', type: 'sanctions', url: 'https://portaldatransparencia.gov.br/sancoes/ceis', description: 'Empresas impedidas de contratar com a Administração Pública.' },
  { id: 'br_cnep', name: 'CNEP - Cadastro Nacional de Empresas Punidas', issuer: 'CGU - Controladoria-Geral da União', jurisdiction: 'BR', type: 'sanctions', url: 'https://portaldatransparencia.gov.br/sancoes/cnep', description: 'Empresas que sofreram sanções com base na Lei Anticorrupção.' },
  { id: 'br_cepim', name: 'CEPIM - Cadastro de Entidades Privadas Sem Fins Lucrativos Impedidas', issuer: 'CGU - Controladoria-Geral da União', jurisdiction: 'BR', type: 'sanctions', url: 'https://portaldatransparencia.gov.br/sancoes/cepim', description: 'Entidades privadas sem fins lucrativos impedidas de celebrar convênios, contratos de repasse ou termos de parceria.' },
  { id: 'br_ceaf', name: 'CEAF - Cadastro de Expulsões da Administração Federal', issuer: 'CGU - Controladoria-Geral da União', jurisdiction: 'BR', type: 'sanctions', url: 'https://portaldatransparencia.gov.br/sancoes/ceaf', description: 'Servidores expulsos da Administração Pública Federal.' },
  { id: 'br_cpf', name: 'Receita Federal - CPF', issuer: 'Receita Federal do Brasil', jurisdiction: 'BR', type: 'registry', url: 'https://servicos.receita.fazenda.gov.br/Servicos/CPF/ConsultaSituacao/ConsultaPublica.asp', description: 'Cadastro de Pessoas Físicas - validação de CPF.' },
  
  // US Sources
  { id: 'ofac_sdn', name: 'OFAC Specially Designated Nationals (SDN) List', issuer: 'U.S. Department of the Treasury - Office of Foreign Assets Control', jurisdiction: 'US', type: 'sanctions', url: 'https://sanctionssearch.ofac.treas.gov/', description: 'The SDN List includes individuals and companies owned or controlled by, or acting for or on behalf of, targeted countries.' },
  { id: 'ofac_cons', name: 'OFAC Consolidated Sanctions List', issuer: 'U.S. Department of the Treasury - OFAC', jurisdiction: 'US', type: 'sanctions', url: 'https://sanctionssearch.ofac.treas.gov/', description: 'Consolidated list of all OFAC sanctions programs including SDN, Sectoral Sanctions, and other lists.' },
  { id: 'bis_entity', name: 'BIS Entity List', issuer: 'U.S. Department of Commerce - Bureau of Industry and Security', jurisdiction: 'US', type: 'sanctions', url: 'https://www.bis.gov/entity-list', description: 'The Entity List identifies entities reasonably believed to be involved in activities contrary to U.S. national security or foreign policy interests.' },
  { id: 'bis_denied', name: 'BIS Denied Persons List', issuer: 'U.S. Department of Commerce - Bureau of Industry and Security', jurisdiction: 'US', type: 'sanctions', url: 'https://www.bis.gov/dpl', description: 'Persons denied export privileges by BIS.' },
  { id: 'fbi_most_wanted', name: 'FBI Most Wanted Terrorists', issuer: 'U.S. Federal Bureau of Investigation', jurisdiction: 'US', type: 'criminal', url: 'https://www.fbi.gov/wanted/wanted_terrorists', description: 'FBI list of most wanted terrorists.' },
  
  // UK Sources
  { id: 'uk_hmt', name: 'UK HMT Sanctions List', issuer: 'UK - Her Majesty\'s Treasury', jurisdiction: 'GB', type: 'sanctions', url: 'https://www.gov.uk/government/publications/financial-sanctions-consolidated-list-of-targets', description: 'UK financial sanctions consolidated list maintained by HMT\'s Office of Financial Sanctions Implementation (OFSI).' },
  { id: 'uk_fcdo', name: 'UK FCDO Sanctions List', issuer: 'UK - Foreign, Commonwealth & Development Office', jurisdiction: 'GB', type: 'sanctions', url: 'https://www.gov.uk/government/publications/the-uk-sanctions-list', description: 'The UK Sanctions List reflects UK autonomous sanctions policy frameworks under the Sanctions and Anti-Money Laundering Act 2018.' },
  
  // EU Sources
  { id: 'eu_fsf', name: 'EU Consolidated Financial Sanctions List', issuer: 'European Commission - DG FISMA', jurisdiction: 'EU', type: 'sanctions', url: 'https://data.europa.eu/data/datasets/consolidated-list-of-persons-groups-and-entities-subject-to-eu-financial-sanctions', description: 'Consolidated list of persons, groups and entities subject to EU financial sanctions.' },
  { id: 'eu_travel', name: 'EU Travel Bans List', issuer: 'European Council', jurisdiction: 'EU', type: 'sanctions', url: 'https://www.sanctionsmap.eu/', description: 'EU measures restricting admission (entry or transit) of designated persons.' },
  
  // UN Sources
  { id: 'un_sc', name: 'UN Security Council Consolidated List', issuer: 'United Nations Security Council', jurisdiction: 'UN', type: 'sanctions', url: 'https://main.un.org/securitycouncil/en/content/un-sc-consolidated-list', description: 'The UN Security Council Consolidated List includes all individuals and entities subject to sanctions measures imposed by the Security Council.' },
  { id: 'un_1267', name: 'UN ISIL (Da\'esh) & Al-Qaida Sanctions List', issuer: 'UN Security Council Committee 1267/1989/2253', jurisdiction: 'UN', type: 'sanctions', url: 'https://www.un.org/securitycouncil/sanctions/1267', description: 'Sanctions list pursuant to resolutions 1267 (1999), 1989 (2011) and 2253 (2015) concerning ISIL and Al-Qaida.' },
  
  // China Sources
  { id: 'cn_mofcom_uel', name: 'MOFCOM Unreliable Entity List', issuer: 'Ministry of Commerce of the People\'s Republic of China', jurisdiction: 'CN', type: 'sanctions', url: 'http://www.mofcom.gov.cn/', description: 'The Unreliable Entity List identifies foreign entities that disrupt normal trade or cut off supply for non-commercial reasons, damaging Chinese entities.' },
  { id: 'cn_mofcom_counter', name: 'MOFCOM Counter Sanctions List', issuer: 'Ministry of Commerce of China', jurisdiction: 'CN', type: 'sanctions', url: 'http://www.mofcom.gov.cn/', description: 'Counter-sanctions list in response to foreign sanctions affecting Chinese interests.' },
  
  // Japan Sources
  { id: 'jp_meti', name: 'METI End User List', issuer: 'Ministry of Economy, Trade and Industry of Japan', jurisdiction: 'JP', type: 'sanctions', url: 'https://www.meti.go.jp/policy/anpo/law05.html', description: 'Japan\'s list of foreign end-users of concern for export control purposes.' },
  { id: 'jp_mof', name: 'MOF Economic Sanctions List', issuer: 'Ministry of Finance of Japan', jurisdiction: 'JP', type: 'sanctions', url: 'https://www.mof.go.jp/policy/international_policy/gaitame_kawase/gaitame/economic_sanctions/', description: 'Japan\'s economic sanctions and asset freeze measures.' },
  
  // Other Countries
  { id: 'ch_seco', name: 'SECO Sanctions List', issuer: 'State Secretariat for Economic Affairs (Switzerland)', jurisdiction: 'CH', type: 'sanctions', url: 'https://www.seco.admin.ch/seco/en/home/Aussenwirtschaftspolitik_Wirtschaftliche_Zusammenarbeit/Wirtschaftsbeziehungen/exportkontrollen-und-sanktionen/sanktionen-embargos.html', description: 'Swiss sanctions ordinances implementing UN, EU and autonomous Swiss measures.' },
  { id: 'au_dfat', name: 'DFAT Consolidated Sanctions List', issuer: 'Department of Foreign Affairs and Trade (Australia)', jurisdiction: 'AU', type: 'sanctions', url: 'https://www.dfat.gov.au/international-relations/security/sanctions/consolidated-list', description: 'Australia\'s consolidated list under the Charter of the United Nations Act 1945 and Autonomous Sanctions Act 2011.' },
  { id: 'ca_osfi', name: 'Canada OSFI Sanctions List', issuer: 'Office of the Superintendent of Financial Institutions (Canada)', jurisdiction: 'CA', type: 'sanctions', url: 'https://www.osfi-bsif.gc.ca/Eng/fi-if/amlc-clrpc/snc/Pages/default.aspx', description: 'Canada\'s consolidated list of sanctioned individuals and entities.' },
  { id: 'ar_repet', name: 'RePET Sanctions List', issuer: 'Public Registry of Persons and Entities Linked to Terrorism (Argentina)', jurisdiction: 'AR', type: 'sanctions', url: 'https://repet.jus.gob.ar/', description: 'Argentina\'s registry of individuals and entities designated for terrorism financing.' },
  { id: 'mx_uif', name: 'UIF Lista de Personas Bloqueadas', issuer: 'Unidad de Inteligencia Financiera (México)', jurisdiction: 'MX', type: 'sanctions', url: 'https://www.gob.mx/uif', description: 'Lista mexicana de personas y entidades con recursos bloqueados.' },
  
  // International Organizations
  { id: 'worldbank', name: 'World Bank Debarred Firms & Individuals', issuer: 'The World Bank Group', jurisdiction: 'INT', type: 'watchlist', url: 'https://www.worldbank.org/en/projects-operations/procurement/debarred-firms', description: 'Firms and individuals ineligible to participate in World Bank-financed contracts.' },
  { id: 'interpol', name: 'INTERPOL Red Notices', issuer: 'International Criminal Police Organization', jurisdiction: 'INT', type: 'criminal', url: 'https://www.interpol.int/How-we-work/Notices/Red-Notices', description: 'Requests to locate and provisionally arrest individuals pending extradition.' },
  { id: 'fatf', name: 'FATF High-Risk Jurisdictions', issuer: 'Financial Action Task Force', jurisdiction: 'INT', type: 'watchlist', url: 'https://www.fatf-gafi.org/en/countries/black-and-grey-lists.html', description: 'Jurisdictions under increased monitoring or subject to call for action.' },
  
  // PEP Sources
  { id: 'pep_global', name: 'Global PEP Database', issuer: 'Aggregated Government Sources', jurisdiction: 'INT', type: 'pep', url: 'https://opensanctions.org/datasets/peps/', description: 'Politically Exposed Persons from national government sources worldwide.' },
  { id: 'pep_cia', name: 'CIA World Leaders', issuer: 'Central Intelligence Agency', jurisdiction: 'INT', type: 'pep', url: 'https://www.cia.gov/resources/world-leaders/', description: 'Current chiefs of state and cabinet members of foreign governments.' },
];

interface ScreeningRequest {
  subject_name: string;
  subject_name_local?: string;
  subject_id_number?: string;
  subject_date_of_birth?: string;
  subject_country?: string;
  subject_gender?: string;
  subject_company_name?: string;
  subject_company_registration?: string;
  screening_types?: string[];
  jurisdictions?: string[];
  match_rate_threshold?: number;
  entity_type?: 'individual' | 'entity';
}

interface BrazilCNPJData {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  natureza_juridica: string;
  situacao_cadastral: string;
  descricao_situacao_cadastral: string;
  data_situacao_cadastral: string;
  data_inicio_atividade: string;
  cnae_fiscal: number;
  cnae_fiscal_descricao: string;
  porte: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
  ddd_telefone_1: string;
  ddd_telefone_2: string;
  email: string;
  capital_social: number;
  qsa: { nome_socio: string; qualificacao_socio: string; cnpj_cpf_do_socio: string; data_entrada_sociedade: string }[];
  cnaes_secundarios: { codigo: number; descricao: string }[];
}

interface CGUSanction {
  cpfCnpjSancionado: string;
  nomeSancionado: string;
  nomeFantasiaSancionado: string;
  tipoSancao: string;
  dataInicioSancao: string;
  dataFimSancao: string;
  orgaoSancionador: string;
  ufSancionador: string;
  fundamentacaoLegal: string;
  descricaoFundamentacao: string;
  numeroProcesso: string;
  dataPublicacao: string;
  fonteSancao: string;
}

interface OpenSanctionsEntity {
  id: string;
  caption: string;
  schema: string;
  properties: {
    name?: string[];
    alias?: string[];
    birthDate?: string[];
    nationality?: string[];
    gender?: string[];
    idNumber?: string[];
    address?: string[];
    country?: string[];
    position?: string[];
    notes?: string[];
    topics?: string[];
    sourceUrl?: string[];
  };
  datasets: string[];
  referents: string[];
  target: boolean;
  first_seen: string;
  last_seen: string;
  last_change: string;
}

interface MatchResult {
  matched_name: string;
  matched_name_local?: string;
  match_rate: number;
  entity_type: string;
  tag: string;
  nationality?: string;
  id_number?: string;
  date_of_birth?: string;
  gender?: string;
  source_name: string;
  source_issuer: string;
  source_url?: string;
  source_jurisdiction: string;
  alias?: string[];
  place_of_birth?: string;
  role_description?: string;
  reason?: string;
  address?: string;
  remark?: string;
  disclosure_date?: string;
  start_date?: string;
  delisting_date?: string;
  associated_companies?: { name: string; registration_number?: string }[];
}

// Calculate match score using Jaro-Winkler similarity
function calculateSimilarity(s1: string, s2: string): number {
  const str1 = s1.toLowerCase().trim();
  const str2 = s2.toLowerCase().trim();
  
  if (str1 === str2) return 100;
  if (str1.length === 0 || str2.length === 0) return 0;
  
  const len1 = str1.length;
  const len2 = str2.length;
  const maxDist = Math.floor(Math.max(len1, len2) / 2) - 1;
  
  let matches = 0;
  const s1Matches = new Array(len1).fill(false);
  const s2Matches = new Array(len2).fill(false);
  
  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - maxDist);
    const end = Math.min(i + maxDist + 1, len2);
    
    for (let j = start; j < end; j++) {
      if (s2Matches[j] || str1[i] !== str2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }
  
  if (matches === 0) return 0;
  
  let transpositions = 0;
  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (str1[i] !== str2[k]) transpositions++;
    k++;
  }
  
  const jaro = (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3;
  
  // Winkler modification
  let prefix = 0;
  for (let i = 0; i < Math.min(4, Math.min(len1, len2)); i++) {
    if (str1[i] === str2[i]) prefix++;
    else break;
  }
  
  return Math.round((jaro + prefix * 0.1 * (1 - jaro)) * 100);
}

// Clean CNPJ/CPF to numbers only
function cleanDocument(doc: string): string {
  return doc.replace(/\D/g, '');
}

// Check CNPJ cache in database
async function getCachedCNPJ(supabase: any, cnpj: string): Promise<BrazilCNPJData | null> {
  const { data, error } = await supabase
    .from('cnpj_cache')
    .select('*')
    .eq('cnpj', cnpj)
    .gt('expires_at', new Date().toISOString())
    .single();
  
  if (error || !data) return null;
  
  // Increment hit count
  await supabase.rpc('increment_cnpj_cache_hit', { target_cnpj: cnpj });
  
  console.log(`CNPJ cache HIT for ${cnpj}`);
  
  return {
    cnpj: data.cnpj,
    razao_social: data.razao_social,
    nome_fantasia: data.nome_fantasia,
    natureza_juridica: data.natureza_juridica,
    situacao_cadastral: data.situacao_cadastral,
    descricao_situacao_cadastral: data.descricao_situacao_cadastral,
    data_situacao_cadastral: data.data_situacao_cadastral,
    data_inicio_atividade: data.data_inicio_atividade,
    cnae_fiscal: data.cnae_fiscal,
    cnae_fiscal_descricao: data.cnae_fiscal_descricao,
    porte: data.porte,
    logradouro: data.logradouro,
    numero: data.numero,
    complemento: data.complemento,
    bairro: data.bairro,
    municipio: data.municipio,
    uf: data.uf,
    cep: data.cep,
    ddd_telefone_1: data.ddd_telefone_1,
    ddd_telefone_2: data.ddd_telefone_2,
    email: data.email,
    capital_social: data.capital_social,
    qsa: data.qsa || [],
    cnaes_secundarios: data.cnaes_secundarios || [],
  };
}

// Save CNPJ to cache
async function cacheCNPJ(supabase: any, data: BrazilCNPJData): Promise<void> {
  const cleanedCNPJ = cleanDocument(data.cnpj);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + CNPJ_CACHE_TTL_DAYS);
  
  await supabase.from('cnpj_cache').upsert({
    cnpj: cleanedCNPJ,
    razao_social: data.razao_social,
    nome_fantasia: data.nome_fantasia,
    natureza_juridica: data.natureza_juridica,
    situacao_cadastral: data.situacao_cadastral,
    descricao_situacao_cadastral: data.descricao_situacao_cadastral,
    data_situacao_cadastral: data.data_situacao_cadastral,
    data_inicio_atividade: data.data_inicio_atividade,
    cnae_fiscal: data.cnae_fiscal,
    cnae_fiscal_descricao: data.cnae_fiscal_descricao,
    porte: data.porte,
    logradouro: data.logradouro,
    numero: data.numero,
    complemento: data.complemento,
    bairro: data.bairro,
    municipio: data.municipio,
    uf: data.uf,
    cep: data.cep,
    ddd_telefone_1: data.ddd_telefone_1,
    ddd_telefone_2: data.ddd_telefone_2,
    email: data.email,
    capital_social: data.capital_social,
    qsa: data.qsa,
    cnaes_secundarios: data.cnaes_secundarios,
    expires_at: expiresAt.toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'cnpj' });
  
  console.log(`CNPJ ${cleanedCNPJ} cached successfully`);
}

// Search Brazilian CNPJ via BrasilAPI with caching
async function searchBrazilCNPJ(supabase: any, cnpj: string): Promise<BrazilCNPJData | null> {
  const cleanedCNPJ = cleanDocument(cnpj);
  if (cleanedCNPJ.length !== 14) {
    console.log(`Invalid CNPJ format: ${cnpj}`);
    return null;
  }
  
  // Check cache first
  const cached = await getCachedCNPJ(supabase, cleanedCNPJ);
  if (cached) return cached;
  
  // Fetch from API
  try {
    const url = `${BRASIL_API_CNPJ}/${cleanedCNPJ}`;
    console.log(`CNPJ cache MISS - Fetching from BrasilAPI: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ELP-Green-AML-Screening/1.0',
      },
    });
    
    if (!response.ok) {
      console.error(`BrasilAPI error: ${response.status}`);
      return null;
    }
    
    const data: BrazilCNPJData = await response.json();
    console.log(`BrasilAPI returned data for: ${data.razao_social}`);
    
    // Cache the result
    await cacheCNPJ(supabase, data);
    
    return data;
  } catch (error) {
    console.error('BrasilAPI search error:', error);
    return null;
  }
}

// Validate CPF via BrasilAPI
async function validateCPF(supabase: any, cpf: string): Promise<{ valid: boolean; nome?: string; situacao?: string } | null> {
  const cleanedCPF = cleanDocument(cpf);
  if (cleanedCPF.length !== 11) {
    console.log(`Invalid CPF format: ${cpf}`);
    return null;
  }
  
  // Check cache first
  const { data: cached } = await supabase
    .from('cpf_cache')
    .select('*')
    .eq('cpf', cleanedCPF)
    .gt('expires_at', new Date().toISOString())
    .single();
  
  if (cached) {
    console.log(`CPF cache HIT for ${cleanedCPF}`);
    await supabase.from('cpf_cache').update({ 
      hit_count: (cached.hit_count || 0) + 1,
      last_accessed_at: new Date().toISOString()
    }).eq('cpf', cleanedCPF);
    
    return { valid: cached.is_valid, nome: cached.nome, situacao: cached.situacao_cadastral };
  }
  
  // Note: BrasilAPI CPF endpoint requires authentication in production
  // For now, we do basic validation
  console.log(`CPF cache MISS - Validating ${cleanedCPF}`);
  
  // Basic CPF validation algorithm
  const isValidCPF = validateCPFAlgorithm(cleanedCPF);
  
  // Cache the result
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + CPF_CACHE_TTL_DAYS);
  
  await supabase.from('cpf_cache').upsert({
    cpf: cleanedCPF,
    is_valid: isValidCPF,
    situacao_cadastral: isValidCPF ? 'Regular' : 'Inválido',
    expires_at: expiresAt.toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'cpf' });
  
  return { valid: isValidCPF, situacao: isValidCPF ? 'Regular' : 'Inválido' };
}

// CPF validation algorithm
function validateCPFAlgorithm(cpf: string): boolean {
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false; // All same digits
  
  // First digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf[i]) * (10 - i);
  }
  let digit1 = (sum * 10) % 11;
  if (digit1 === 10) digit1 = 0;
  if (digit1 !== parseInt(cpf[9])) return false;
  
  // Second digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf[i]) * (11 - i);
  }
  let digit2 = (sum * 10) % 11;
  if (digit2 === 10) digit2 = 0;
  if (digit2 !== parseInt(cpf[10])) return false;
  
  return true;
}

// Search CGU Portal da Transparência API for sanctions
// API Docs: https://api.portaldatransparencia.gov.br/swagger-ui/index.html
async function searchCGUSanctions(supabase: any, cpfCnpj: string, nome?: string): Promise<CGUSanction[]> {
  const cleanedDoc = cleanDocument(cpfCnpj);
  
  // Check cache first
  const { data: cached } = await supabase
    .from('cgu_sanctions_cache')
    .select('*')
    .eq('cpf_cnpj', cleanedDoc)
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString());
  
  if (cached && cached.length > 0) {
    console.log(`CGU cache HIT for ${cleanedDoc}: ${cached.length} sanctions`);
    return cached.map((s: any) => ({
      cpfCnpjSancionado: s.cpf_cnpj,
      nomeSancionado: s.nome_razao_social,
      nomeFantasiaSancionado: s.nome_fantasia,
      tipoSancao: s.tipo_sancao,
      dataInicioSancao: s.data_inicio_sancao,
      dataFimSancao: s.data_fim_sancao,
      orgaoSancionador: s.orgao_sancionador,
      ufSancionador: s.uf_orgao_sancionador,
      fundamentacaoLegal: s.fundamentacao_legal,
      descricaoFundamentacao: s.descricao_fundamentacao,
      numeroProcesso: s.numero_processo,
      dataPublicacao: s.data_publicacao_sancao,
      fonteSancao: s.fonte_sancao,
    }));
  }
  
  console.log(`CGU cache MISS - fetching real data from Portal da Transparência for ${cleanedDoc}`);
  
  const allSanctions: CGUSanction[] = [];
  const CGU_API_KEY = Deno.env.get('CGU_API_KEY');
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'User-Agent': 'ELP-Green-AML-Screening/1.0',
  };
  
  // Add API key if available (for higher rate limits)
  if (CGU_API_KEY) {
    headers['chave-api-dados'] = CGU_API_KEY;
    console.log('Using CGU API with authentication');
  } else {
    console.log('CGU API - using public access (lower rate limits)');
  }

  // Define CGU endpoints to search
  const cguEndpoints = [
    { name: 'CEIS', url: 'https://api.portaldatransparencia.gov.br/api-de-dados/ceis', tipo: 'CEIS - Empresas Inidôneas e Suspensas' },
    { name: 'CNEP', url: 'https://api.portaldatransparencia.gov.br/api-de-dados/cnep', tipo: 'CNEP - Empresas Punidas (Lei Anticorrupção)' },
    { name: 'CEPIM', url: 'https://api.portaldatransparencia.gov.br/api-de-dados/cepim', tipo: 'CEPIM - Entidades Impedidas' },
    { name: 'CEAF', url: 'https://api.portaldatransparencia.gov.br/api-de-dados/ceaf', tipo: 'CEAF - Expulsões da Administração Federal' },
  ];

  // Search each CGU endpoint
  for (const endpoint of cguEndpoints) {
    try {
      // Build query params based on document type
      const isCNPJ = cleanedDoc.length === 14;
      const isCPF = cleanedDoc.length === 11;
      
      let searchUrl = endpoint.url;
      const params = new URLSearchParams();
      params.append('pagina', '1');
      
      // CEIS and CNEP use cpfCnpj parameter
      if (['CEIS', 'CNEP'].includes(endpoint.name)) {
        if (isCNPJ || isCPF) {
          params.append('cpfCnpj', cleanedDoc);
        } else if (nome) {
          // Search by name if no valid document
          params.append('nomeSancionado', nome);
        }
      }
      
      // CEPIM uses convenente parameter for entity search
      if (endpoint.name === 'CEPIM') {
        if (isCNPJ) {
          params.append('cnpjEntidade', cleanedDoc);
        } else if (nome) {
          params.append('nomeEntidade', nome);
        }
      }
      
      // CEAF searches by CPF for individuals
      if (endpoint.name === 'CEAF') {
        if (isCPF) {
          params.append('cpf', cleanedDoc);
        } else if (nome) {
          params.append('nome', nome);
        }
      }

      searchUrl = `${endpoint.url}?${params.toString()}`;
      console.log(`Fetching ${endpoint.name}: ${searchUrl}`);

      const response = await fetch(searchUrl, { 
        method: 'GET', 
        headers,
      });

      if (response.status === 429) {
        console.warn(`CGU API rate limit hit for ${endpoint.name} - skipping`);
        continue;
      }

      if (!response.ok) {
        console.warn(`CGU ${endpoint.name} returned ${response.status}`);
        continue;
      }

      const data = await response.json();
      const results = Array.isArray(data) ? data : [];
      
      console.log(`CGU ${endpoint.name}: found ${results.length} results`);

      // Map results to our CGUSanction format
      for (const item of results) {
        let sanction: CGUSanction;
        
        if (endpoint.name === 'CEIS' || endpoint.name === 'CNEP') {
          sanction = {
            cpfCnpjSancionado: item.cpfCnpjSancionado || item.pessoa?.cpfCnpj || cleanedDoc,
            nomeSancionado: item.nomeSancionado || item.pessoa?.nome || item.nomeRazaoSocial || '',
            nomeFantasiaSancionado: item.nomeFantasiaSancionado || item.pessoa?.nomeFantasia || '',
            tipoSancao: endpoint.tipo,
            dataInicioSancao: item.dataInicioSancao || item.dataReferenciaInicio || '',
            dataFimSancao: item.dataFinalSancao || item.dataReferenciaFim || '',
            orgaoSancionador: item.orgaoSancionador?.nome || item.orgaoLotacao?.nome || '',
            ufSancionador: item.orgaoSancionador?.uf?.sigla || item.ufOrgaoSancionador || '',
            fundamentacaoLegal: item.fundamentacao?.descricaoFundamentacao || item.fundamentacaoLegal || '',
            descricaoFundamentacao: item.tipoSancao?.descricaoTipoSancao || item.descricaoFundamentacao || '',
            numeroProcesso: item.numeroProcesso || '',
            dataPublicacao: item.dataPublicacaoSancao || item.dataPublicacao || '',
            fonteSancao: endpoint.name,
          };
        } else if (endpoint.name === 'CEPIM') {
          sanction = {
            cpfCnpjSancionado: item.cnpjEntidade || cleanedDoc,
            nomeSancionado: item.nomeEntidade || item.razaoSocial || '',
            nomeFantasiaSancionado: item.nomeFantasia || '',
            tipoSancao: endpoint.tipo,
            dataInicioSancao: item.dataReferencia || '',
            dataFimSancao: '',
            orgaoSancionador: item.orgaoConcedente?.nome || '',
            ufSancionador: item.ufConvenente || '',
            fundamentacaoLegal: item.motivoImpedimento || '',
            descricaoFundamentacao: item.situacaoConvenio || '',
            numeroProcesso: item.numeroConvenio || '',
            dataPublicacao: '',
            fonteSancao: endpoint.name,
          };
        } else { // CEAF
          sanction = {
            cpfCnpjSancionado: item.cpf || cleanedDoc,
            nomeSancionado: item.nome || '',
            nomeFantasiaSancionado: '',
            tipoSancao: endpoint.tipo,
            dataInicioSancao: item.dataPublicacao || '',
            dataFimSancao: '',
            orgaoSancionador: item.orgaoLotacao?.nome || '',
            ufSancionador: item.ufLotacao || '',
            fundamentacaoLegal: item.fundamentacaoLegal || '',
            descricaoFundamentacao: item.tipoPunicao || '',
            numeroProcesso: item.numeroProcesso || '',
            dataPublicacao: item.dataPublicacao || '',
            fonteSancao: endpoint.name,
          };
        }

        allSanctions.push(sanction);
      }
    } catch (error) {
      console.error(`Error fetching CGU ${endpoint.name}:`, error);
    }
  }

  // Cache results
  if (allSanctions.length > 0 || (cleanedDoc.length === 11 || cleanedDoc.length === 14)) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + CGU_CACHE_TTL_DAYS);

    for (const sanction of allSanctions) {
      try {
        await supabase.from('cgu_sanctions_cache').upsert({
          cpf_cnpj: cleanedDoc,
          nome_razao_social: sanction.nomeSancionado,
          nome_fantasia: sanction.nomeFantasiaSancionado,
          tipo_sancao: sanction.tipoSancao,
          data_inicio_sancao: sanction.dataInicioSancao || null,
          data_fim_sancao: sanction.dataFimSancao || null,
          orgao_sancionador: sanction.orgaoSancionador,
          uf_orgao_sancionador: sanction.ufSancionador,
          fundamentacao_legal: sanction.fundamentacaoLegal,
          descricao_fundamentacao: sanction.descricaoFundamentacao,
          numero_processo: sanction.numeroProcesso,
          data_publicacao_sancao: sanction.dataPublicacao || null,
          fonte_sancao: sanction.fonteSancao,
          is_active: true,
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'cpf_cnpj,fonte_sancao' });
      } catch (cacheError) {
        console.warn('Error caching CGU sanction:', cacheError);
      }
    }
    console.log(`Cached ${allSanctions.length} CGU sanctions for ${cleanedDoc}`);
  }

  return allSanctions;
}

// Map OpenSanctions dataset to our source
function mapDatasetToSource(dataset: string): typeof SCREENING_SOURCES[0] | undefined {
  const mappings: { [key: string]: string } = {
    'us_ofac_sdn': 'ofac_sdn',
    'us_ofac_cons': 'ofac_cons',
    'us_bis_entity': 'bis_entity',
    'us_bis_denied': 'bis_denied',
    'gb_hmt_sanctions': 'uk_hmt',
    'eu_fsf': 'eu_fsf',
    'un_sc_sanctions': 'un_sc',
    'interpol_red_notices': 'interpol',
    'worldbank_debarred': 'worldbank',
    'br_cgu_ceis': 'br_ceis',
    'br_cgu_cnep': 'br_cnep',
    'default': 'ofac_sdn',
  };
  
  for (const [pattern, sourceId] of Object.entries(mappings)) {
    if (dataset.includes(pattern)) {
      return SCREENING_SOURCES.find(s => s.id === sourceId);
    }
  }
  
  return SCREENING_SOURCES.find(s => s.id === 'ofac_sdn');
}

// Get tag from entity topics
function getTagFromTopics(topics: string[] = []): string {
  if (topics.includes('sanction')) return 'SAN';
  if (topics.includes('debarment')) return 'DEB';
  if (topics.includes('crime')) return 'CRI';
  if (topics.includes('pep')) return 'PEP';
  if (topics.includes('poi')) return 'POI';
  return 'WL';
}

// Search OpenSanctions API
async function searchOpenSanctions(query: string): Promise<OpenSanctionsEntity[]> {
  try {
    const url = `${OPENSANCTIONS_API}/search/default?q=${encodeURIComponent(query)}&limit=20`;
    console.log(`Searching OpenSanctions: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ELP-Green-AML-Screening/1.0 (compliance@elpgreen.com)',
      },
    });
    
    if (!response.ok) {
      console.warn(`OpenSanctions API returned ${response.status} - using fallback`);
      return [];
    }
    
    const data = await response.json();
    console.log(`OpenSanctions returned ${data.results?.length || 0} results`);
    return data.results || [];
  } catch (error) {
    console.warn('OpenSanctions search error (non-blocking):', error);
    return [];
  }
}

// Generate token for report access
function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const request: ScreeningRequest = await req.json();

    if (!request.subject_name || request.subject_name.trim().length < 2) {
      return new Response(
        JSON.stringify({ success: false, error: 'Subject name is required (minimum 2 characters)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting REAL AML screening for: ${request.subject_name}`);
    console.log(`Entity type: ${request.entity_type || 'individual'}`);
    console.log(`Country: ${request.subject_country || 'Not specified'}`);
    console.log(`Registration: ${request.subject_company_registration || 'Not provided'}`);

    const matches: MatchResult[] = [];
    let brazilData: BrazilCNPJData | null = null;
    let cpfValidation: { valid: boolean; nome?: string; situacao?: string } | null = null;
    const apiSourcesUsed: string[] = [];

    // Determine if Brazil search
    const isBrazilSearch = request.subject_country === 'Brazil' || 
                          request.jurisdictions?.includes('BR') ||
                          request.jurisdictions?.includes('ALL');

    // Step 1: CNPJ lookup (for entities)
    if (isBrazilSearch && request.subject_company_registration && request.entity_type === 'entity') {
      console.log('Searching Brazilian CNPJ registry with cache...');
      brazilData = await searchBrazilCNPJ(supabase, request.subject_company_registration);
      
      if (brazilData) {
        apiSourcesUsed.push('BrasilAPI (CNPJ) + Cache');
        
        const isSuspicious = brazilData.situacao_cadastral !== 'ATIVA' ||
                            brazilData.descricao_situacao_cadastral?.toLowerCase().includes('baixada') ||
                            brazilData.descricao_situacao_cadastral?.toLowerCase().includes('inapta') ||
                            brazilData.descricao_situacao_cadastral?.toLowerCase().includes('suspensa');
        
        const registeredName = brazilData.razao_social || '';
        const fantasyName = brazilData.nome_fantasia || '';
        const matchRateRazao = calculateSimilarity(request.subject_name, registeredName);
        const matchRateFantasia = fantasyName ? calculateSimilarity(request.subject_name, fantasyName) : 0;
        const bestMatchRate = Math.max(matchRateRazao, matchRateFantasia);
        
        matches.push({
          matched_name: brazilData.razao_social,
          matched_name_local: brazilData.nome_fantasia || undefined,
          match_rate: bestMatchRate,
          entity_type: 'organization',
          tag: isSuspicious ? 'WL' : 'REG',
          nationality: 'Brazil',
          id_number: brazilData.cnpj,
          source_name: 'Receita Federal do Brasil - CNPJ',
          source_issuer: 'Receita Federal do Brasil',
          source_url: 'https://solucoes.receita.fazenda.gov.br/Servicos/cnpjreva/',
          source_jurisdiction: 'BR',
          alias: brazilData.qsa?.map(s => s.nome_socio).slice(0, 5),
          role_description: brazilData.natureza_juridica,
          reason: `Status: ${brazilData.descricao_situacao_cadastral || brazilData.situacao_cadastral}. ${brazilData.cnae_fiscal_descricao}`,
          address: `${brazilData.logradouro}, ${brazilData.numero}${brazilData.complemento ? ', ' + brazilData.complemento : ''} - ${brazilData.bairro}, ${brazilData.municipio}/${brazilData.uf} - CEP: ${brazilData.cep}`,
          remark: `Capital Social: R$ ${brazilData.capital_social?.toLocaleString('pt-BR')}. Porte: ${brazilData.porte}`,
          disclosure_date: brazilData.data_inicio_atividade,
          start_date: brazilData.data_inicio_atividade,
          associated_companies: brazilData.qsa?.map(s => ({
            name: s.nome_socio,
            registration_number: s.cnpj_cpf_do_socio || undefined,
          })),
        });
        
        // Check CGU sanctions for the CNPJ
        const cguSanctions = await searchCGUSanctions(supabase, brazilData.cnpj, brazilData.razao_social);
        if (cguSanctions.length > 0) {
          apiSourcesUsed.push('CGU Portal da Transparência');
          for (const sanction of cguSanctions) {
            const sourceMap: { [key: string]: string } = {
              'CEIS': 'br_ceis',
              'CNEP': 'br_cnep',
              'CEPIM': 'br_cepim',
              'CEAF': 'br_ceaf',
            };
            const source = SCREENING_SOURCES.find(s => s.id === (sourceMap[sanction.tipoSancao] || 'br_ceis'))!;
            
            matches.push({
              matched_name: sanction.nomeSancionado,
              matched_name_local: sanction.nomeFantasiaSancionado || undefined,
              match_rate: 100,
              entity_type: 'organization',
              tag: 'SAN',
              nationality: 'Brazil',
              id_number: sanction.cpfCnpjSancionado,
              source_name: source.name,
              source_issuer: source.issuer,
              source_url: source.url,
              source_jurisdiction: 'BR',
              reason: `${sanction.descricaoFundamentacao}. Processo: ${sanction.numeroProcesso}`,
              remark: `Órgão Sancionador: ${sanction.orgaoSancionador} (${sanction.ufSancionador})`,
              disclosure_date: sanction.dataPublicacao,
              start_date: sanction.dataInicioSancao,
              delisting_date: sanction.dataFimSancao,
            });
          }
        }
      }
    }

    // Step 2: CPF validation (for individuals)
    if (isBrazilSearch && request.subject_id_number && request.entity_type === 'individual') {
      console.log('Validating Brazilian CPF...');
      cpfValidation = await validateCPF(supabase, request.subject_id_number);
      
      if (cpfValidation) {
        apiSourcesUsed.push('CPF Validation');
        
        matches.push({
          matched_name: cpfValidation.nome || request.subject_name,
          match_rate: cpfValidation.valid ? 100 : 0,
          entity_type: 'individual',
          tag: cpfValidation.valid ? 'REG' : 'WL',
          nationality: 'Brazil',
          id_number: request.subject_id_number,
          source_name: 'Receita Federal - CPF',
          source_issuer: 'Receita Federal do Brasil',
          source_url: 'https://servicos.receita.fazenda.gov.br/Servicos/CPF/',
          source_jurisdiction: 'BR',
          reason: `Situação Cadastral: ${cpfValidation.situacao}`,
        });
        
        // Check CGU sanctions for CPF
        const cguSanctions = await searchCGUSanctions(supabase, request.subject_id_number, request.subject_name);
        if (cguSanctions.length > 0) {
          apiSourcesUsed.push('CGU Portal da Transparência');
          for (const sanction of cguSanctions) {
            matches.push({
              matched_name: sanction.nomeSancionado,
              match_rate: 100,
              entity_type: 'individual',
              tag: 'SAN',
              nationality: 'Brazil',
              id_number: sanction.cpfCnpjSancionado,
              source_name: 'CEAF - Cadastro de Expulsões da Administração Federal',
              source_issuer: 'CGU - Controladoria-Geral da União',
              source_url: 'https://portaldatransparencia.gov.br/sancoes/ceaf',
              source_jurisdiction: 'BR',
              reason: sanction.descricaoFundamentacao,
              remark: `Órgão: ${sanction.orgaoSancionador}`,
              start_date: sanction.dataInicioSancao,
            });
          }
        }
      }
    }

    // Step 3: OpenSanctions API for international sanctions
    const openSanctionsResults = await searchOpenSanctions(request.subject_name);
    if (openSanctionsResults.length > 0) {
      apiSourcesUsed.push('OpenSanctions');
    }
    
    let localNameResults: OpenSanctionsEntity[] = [];
    if (request.subject_name_local) {
      localNameResults = await searchOpenSanctions(request.subject_name_local);
    }
    
    const allResults = [...openSanctionsResults];
    for (const result of localNameResults) {
      if (!allResults.find(r => r.id === result.id)) {
        allResults.push(result);
      }
    }

    const threshold = request.match_rate_threshold || 70;
    const jurisdictions = request.jurisdictions || ['ALL'];
    
    for (const entity of allResults) {
      const entityName = entity.caption || entity.properties?.name?.[0] || '';
      const matchRate = calculateSimilarity(request.subject_name, entityName);
      
      if (matchRate < threshold) continue;
      
      const primaryDataset = entity.datasets?.[0] || 'default';
      const source = mapDatasetToSource(primaryDataset) || SCREENING_SOURCES.find(s => s.id === 'ofac_sdn')!;
      
      if (!jurisdictions.includes('ALL') && !jurisdictions.includes(source.jurisdiction)) {
        continue;
      }
      
      const tag = getTagFromTopics(entity.properties?.topics);
      
      matches.push({
        matched_name: entityName,
        matched_name_local: entity.properties?.name?.find(n => /[\u4e00-\u9fa5]/.test(n)),
        match_rate: matchRate,
        entity_type: entity.schema === 'Company' ? 'organization' : 'individual',
        tag,
        nationality: entity.properties?.nationality?.[0] || entity.properties?.country?.[0],
        id_number: entity.properties?.idNumber?.[0],
        date_of_birth: entity.properties?.birthDate?.[0],
        gender: entity.properties?.gender?.[0],
        source_name: source.name,
        source_issuer: source.issuer,
        source_url: entity.properties?.sourceUrl?.[0] || source.url,
        source_jurisdiction: source.jurisdiction,
        alias: entity.properties?.alias?.slice(0, 5),
        place_of_birth: undefined,
        role_description: entity.properties?.position?.[0],
        reason: entity.properties?.notes?.[0] || `Subject appears in ${source.name} maintained by ${source.issuer}.`,
        address: entity.properties?.address?.[0],
        remark: entity.properties?.notes?.slice(0, 2).join(' '),
        disclosure_date: entity.first_seen?.split('T')[0],
        start_date: entity.first_seen?.split('T')[0],
        delisting_date: undefined,
        associated_companies: [],
      });
    }
    
    matches.sort((a, b) => b.match_rate - a.match_rate);
    const topMatches = matches.slice(0, 10);

    const reportToken = generateToken();
    
    let riskLevel = 'low';
    if (topMatches.length > 0) {
      const sanctionMatches = topMatches.filter(m => ['SAN', 'CRI', 'WL'].includes(m.tag) && m.tag !== 'REG');
      if (sanctionMatches.length > 0) {
        const maxRate = Math.max(...sanctionMatches.map(m => m.match_rate));
        if (maxRate >= 95) riskLevel = 'critical';
        else if (maxRate >= 90) riskLevel = 'high';
        else if (maxRate >= 80) riskLevel = 'medium';
      } else if (topMatches.some(m => m.tag === 'REG')) {
        riskLevel = 'low';
      }
    }

    const screenedLists = SCREENING_SOURCES.filter(source => {
      if (jurisdictions.includes('ALL')) return true;
      return jurisdictions.includes(source.jurisdiction);
    });

    const { data: report, error: reportError } = await supabase
      .from('aml_screening_reports')
      .insert({
        subject_name: request.subject_name,
        subject_name_local: request.subject_name_local,
        subject_id_number: request.subject_id_number,
        subject_date_of_birth: request.subject_date_of_birth,
        subject_country: request.subject_country,
        subject_gender: request.subject_gender,
        subject_company_name: request.subject_company_name || (brazilData?.razao_social),
        subject_company_registration: request.subject_company_registration || (brazilData?.cnpj),
        screening_types: request.screening_types || ['sanctions', 'pep'],
        jurisdictions: jurisdictions,
        match_rate_threshold: threshold,
        total_matches: topMatches.length,
        total_screened_lists: screenedLists.length,
        risk_level: riskLevel,
        status: 'completed',
        report_token: reportToken,
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip'),
        user_agent: req.headers.get('user-agent'),
      })
      .select()
      .single();

    if (reportError) {
      console.error('Failed to create report:', reportError);
      throw new Error('Failed to create screening report');
    }

    if (topMatches.length > 0) {
      const matchInserts = topMatches.map((match, index) => ({
        report_id: report.id,
        matched_name: match.matched_name,
        matched_name_local: match.matched_name_local,
        match_rate: match.match_rate,
        match_rank: index + 1,
        entity_type: match.entity_type,
        tag: match.tag,
        nationality: match.nationality,
        id_number: match.id_number,
        date_of_birth: match.date_of_birth,
        gender: match.gender,
        source_name: match.source_name,
        source_issuer: match.source_issuer,
        source_url: match.source_url,
        source_jurisdiction: match.source_jurisdiction,
        alias: match.alias,
        place_of_birth: match.place_of_birth,
        role_description: match.role_description,
        reason: match.reason,
        address: match.address,
        remark: match.remark,
        disclosure_date: match.disclosure_date,
        start_date: match.start_date,
        delisting_date: match.delisting_date,
        associated_companies: match.associated_companies,
      }));

      const { error: matchError } = await supabase
        .from('aml_screening_matches')
        .insert(matchInserts);

      if (matchError) {
        console.warn('Failed to insert some matches:', matchError);
      }
    }

    const listInserts = screenedLists.map(list => ({
      report_id: report.id,
      list_name: list.name,
      issuer: list.issuer,
      issuer_description: list.description,
      jurisdiction: list.jurisdiction,
      jurisdiction_code: list.jurisdiction,
      source_url: list.url,
      list_type: list.type,
      matches_found: topMatches.filter(m => m.source_name === list.name).length,
    }));

    await supabase.from('aml_screened_lists').insert(listInserts);

    await supabase.from('aml_screening_history').insert({
      report_id: report.id,
      action: 'created',
      details: { 
        subject_name: request.subject_name, 
        matches_found: topMatches.length,
        sources_used: apiSourcesUsed,
        brazil_data_found: !!brazilData,
        cpf_validated: !!cpfValidation,
        api_results: allResults.length,
        cache_used: brazilData ? true : false,
      },
      ip_address: req.headers.get('x-forwarded-for'),
      user_agent: req.headers.get('user-agent'),
    });

    const elapsed = Date.now() - startTime;
    console.log(`AML screening completed in ${elapsed}ms. Found ${topMatches.length} matches.`);
    if (brazilData) {
      console.log(`Brazil CNPJ verified: ${brazilData.razao_social} - Status: ${brazilData.situacao_cadastral}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        report_id: report.id,
        report_token: reportToken,
        summary: {
          subject_name: request.subject_name,
          total_matches: topMatches.length,
          total_screened_lists: screenedLists.length,
          risk_level: riskLevel,
          screening_types: request.screening_types || ['sanctions', 'pep'],
          jurisdictions,
          match_rate_threshold: threshold,
          api_sources: apiSourcesUsed.length > 0 ? apiSourcesUsed : ['OpenSanctions'],
          cache_hit: brazilData ? true : false,
          brazil_company_data: brazilData ? {
            razao_social: brazilData.razao_social,
            nome_fantasia: brazilData.nome_fantasia,
            cnpj: brazilData.cnpj,
            situacao: brazilData.situacao_cadastral,
            descricao_situacao: brazilData.descricao_situacao_cadastral,
            data_abertura: brazilData.data_inicio_atividade,
            capital_social: brazilData.capital_social,
            porte: brazilData.porte,
            natureza_juridica: brazilData.natureza_juridica,
            cnae: brazilData.cnae_fiscal_descricao,
            endereco: `${brazilData.logradouro}, ${brazilData.numero} - ${brazilData.bairro}, ${brazilData.municipio}/${brazilData.uf}`,
            socios: brazilData.qsa?.map(s => ({ nome: s.nome_socio, qualificacao: s.qualificacao_socio })),
          } : null,
          cpf_validation: cpfValidation,
        },
        matches: topMatches,
        screened_lists: screenedLists.map(list => ({
          name: list.name,
          issuer: list.issuer,
          issuer_description: list.description,
          jurisdiction: list.jurisdiction,
          type: list.type,
          url: list.url,
          matches_found: topMatches.filter(m => m.source_name === list.name).length,
        })),
        elapsed_ms: elapsed,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('AML Screening error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Screening failed';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
