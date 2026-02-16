import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  DollarSign,
  Percent,
  MapPin,
  Building2,
  Leaf,
  FileText,
  ChevronDown,
  ChevronUp,
  Globe,
  Info,
  TrendingUp,
  Shield,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

// Fiscal incentives database by country and region - EXPORTED for use in FeasibilityStudyCalculator
export const FISCAL_INCENTIVES_DATA: Record<string, {
  flag: string;
  corporateTax: number;
  regions: Array<{
    id: string;
    nameKey: string;
    incentives: Array<{ type: string; value: string; descKey: string; agency: string }>;
    effectiveTax: number;
    regulations: string[];
  }>;
}> = {
  brazil: {
    flag: '🇧🇷',
    corporateTax: 34,
    regions: [
      {
        id: 'north',
        nameKey: 'brazilNorth',
        incentives: [
          { type: 'irpj', value: '-75%', descKey: 'sudamReduction', agency: 'SUDAM' },
          { type: 'ipi', value: '0%', descKey: 'ipiExemption', agency: 'Receita Federal' },
          { type: 'icms', value: '-50%', descKey: 'icmsReduction', agency: 'SEFAZ PA' },
          { type: 'environmental', value: '+R$80/pneu', descKey: 'reciclanipBonus', agency: 'Reciclanip' },
        ],
        effectiveTax: 8.5,
        regulations: ['PNRS 12.305/2010', 'CONAMA 416/2009'],
      },
      {
        id: 'northeast',
        nameKey: 'brazilNortheast',
        incentives: [
          { type: 'irpj', value: '-75%', descKey: 'sudeneReduction', agency: 'SUDENE' },
          { type: 'ipi', value: '0%', descKey: 'ipiExemption', agency: 'Receita Federal' },
          { type: 'icms', value: '-40%', descKey: 'icmsReduction', agency: 'SEFAZ BA/CE' },
          { type: 'credit', value: 'BNB', descKey: 'bnbCredit', agency: 'Banco do Nordeste' },
        ],
        effectiveTax: 10.2,
        regulations: ['PNRS 12.305/2010', 'Lei do Bem 11.196'],
      },
      {
        id: 'southeast',
        nameKey: 'brazilSoutheast',
        incentives: [
          { type: 'irpj', value: '0%', descKey: 'noFederalIncentive', agency: '-' },
          { type: 'icms', value: '-20%', descKey: 'icmsRecycling', agency: 'SEFAZ SP' },
          { type: 'iss', value: '-50%', descKey: 'issGreen', agency: 'Prefeituras' },
          { type: 'depreciation', value: '2x', descKey: 'acceleratedDepreciation', agency: 'Receita Federal' },
        ],
        effectiveTax: 27.2,
        regulations: ['PNRS 12.305/2010', 'CETESB 001/2021'],
      },
      {
        id: 'manaus',
        nameKey: 'brazilManaus',
        incentives: [
          { type: 'irpj', value: '-88%', descKey: 'zfmReduction', agency: 'SUFRAMA' },
          { type: 'ipi', value: '0%', descKey: 'ipiExemption', agency: 'SUFRAMA' },
          { type: 'icms', value: '0%', descKey: 'icmsZfm', agency: 'SEFAZ AM' },
          { type: 'pis_cofins', value: '0%', descKey: 'pisCofinsZfm', agency: 'Receita Federal' },
        ],
        effectiveTax: 4.1,
        regulations: ['Decreto-Lei 288/1967', 'SUFRAMA'],
      },
    ],
  },
  australia: {
    flag: '🇦🇺',
    corporateTax: 30,
    regions: [
      {
        id: 'western',
        nameKey: 'australiaWestern',
        incentives: [
          { type: 'rd', value: '43.5%', descKey: 'rdTaxOffset', agency: 'ATO' },
          { type: 'asset', value: 'AUD 150K', descKey: 'instantAssetWriteOff', agency: 'ATO' },
          { type: 'tsa', value: 'Grants', descKey: 'tsaFunding', agency: 'TSA' },
          { type: 'landfill', value: '-AUD 200/t', descKey: 'landfillLevyAvoided', agency: 'EPA WA' },
        ],
        effectiveTax: 17.5,
        regulations: ['Product Stewardship Act 2011', 'TSA Scheme'],
      },
      {
        id: 'queensland',
        nameKey: 'australiaQueensland',
        incentives: [
          { type: 'rd', value: '43.5%', descKey: 'rdTaxOffset', agency: 'ATO' },
          { type: 'payroll', value: '-50%', descKey: 'payrollRebate', agency: 'QLD Treasury' },
          { type: 'cefc', value: 'Loans', descKey: 'cefcLoans', agency: 'CEFC' },
          { type: 'landfill', value: '-AUD 170/t', descKey: 'landfillLevyAvoided', agency: 'EPA QLD' },
        ],
        effectiveTax: 18.0,
        regulations: ['Waste Reduction Act 2011', 'EPA QLD'],
      },
    ],
  },
  chile: {
    flag: '🇨🇱',
    corporateTax: 27,
    regions: [
      {
        id: 'atacama',
        nameKey: 'chileAtacama',
        incentives: [
          { type: 'renta', value: '-30%', descKey: 'miningZoneReduction', agency: 'SII' },
          { type: 'iva', value: 'Defer', descKey: 'ivaDefer', agency: 'SII' },
          { type: 'corfo', value: 'Grants', descKey: 'corfoGrants', agency: 'CORFO' },
          { type: 'carbon', value: 'USD 20/t', descKey: 'carbonCredits', agency: 'Santiago Exchange' },
        ],
        effectiveTax: 18.9,
        regulations: ['Ley REP 20.920', 'DS 40/2012'],
      },
      {
        id: 'antofagasta',
        nameKey: 'chileAntofagasta',
        incentives: [
          { type: 'renta', value: '-25%', descKey: 'extremeZone', agency: 'SII' },
          { type: 'mining', value: 'Royalties', descKey: 'miningRoyalties', agency: 'Mining Ministry' },
          { type: 'proinversion', value: 'Incentives', descKey: 'proinversionChile', agency: 'InvestChile' },
        ],
        effectiveTax: 20.3,
        regulations: ['Ley REP 20.920', 'Mining Code'],
      },
    ],
  },
  usa: {
    flag: '🇺🇸',
    corporateTax: 21,
    regions: [
      {
        id: 'texas',
        nameKey: 'usaTexas',
        incentives: [
          { type: 'state', value: '0%', descKey: 'noStateTax', agency: 'Texas Comptroller' },
          { type: 'macrs', value: '5 years', descKey: 'acceleratedDepreciation', agency: 'IRS' },
          { type: 'qoz', value: '-15%', descKey: 'opportunityZone', agency: 'IRS' },
          { type: 'tceq', value: 'Grants', descKey: 'recyclingGrants', agency: 'TCEQ' },
        ],
        effectiveTax: 17.8,
        regulations: ['RCRA', 'Texas Tire Program'],
      },
      {
        id: 'arizona',
        nameKey: 'usaArizona',
        incentives: [
          { type: 'state', value: '4.9%', descKey: 'lowStateTax', agency: 'ADOR' },
          { type: 'property', value: '-80%', descKey: 'propertyTaxAbatement', agency: 'County' },
          { type: 's179', value: 'Full', descKey: 'section179', agency: 'IRS' },
          { type: 'adeq', value: 'Incentives', descKey: 'adeqProgram', agency: 'ADEQ' },
        ],
        effectiveTax: 23.1,
        regulations: ['RCRA', 'ARS Title 49'],
      },
    ],
  },
  italy: {
    flag: '🇮🇹',
    corporateTax: 24,
    regions: [
      {
        id: 'lombardy',
        nameKey: 'italyLombardy',
        incentives: [
          { type: 'irap', value: '-3.9%', descKey: 'irapReduction', agency: 'Regione Lombardia' },
          { type: 'rd', value: '50%', descKey: 'rdCredit', agency: 'MISE' },
          { type: 'transition', value: '40%', descKey: 'transitionCredit', agency: 'MISE' },
          { type: 'eco', value: 'Grants', descKey: 'ecoIndustryGrants', agency: 'Invitalia' },
        ],
        effectiveTax: 20.1,
        regulations: ['TUA D.Lgs 152/2006', 'CONAI System'],
      },
      {
        id: 'south',
        nameKey: 'italySouth',
        incentives: [
          { type: 'mezzogiorno', value: '-45%', descKey: 'mezzogiornoCredit', agency: 'Invitalia' },
          { type: 'irap', value: '-50%', descKey: 'irapSouth', agency: 'Regioni Sud' },
          { type: 'zes', value: 'Bonus', descKey: 'zesBonus', agency: 'ZES Authority' },
          { type: 'training', value: '70%', descKey: 'trainingCredit', agency: 'ANPAL' },
        ],
        effectiveTax: 13.2,
        regulations: ['TUA D.Lgs 152/2006', 'ZES Law'],
      },
    ],
  },
  germany: {
    flag: '🇩🇪',
    corporateTax: 30,
    regions: [
      {
        id: 'east',
        nameKey: 'germanyEast',
        incentives: [
          { type: 'investment', value: '25%', descKey: 'eastGermanyGrant', agency: 'BAFA' },
          { type: 'rd', value: '25%', descKey: 'rdCredit', agency: 'BMF' },
          { type: 'kfw', value: 'Loans', descKey: 'kfwLoans', agency: 'KfW' },
          { type: 'gwr', value: '-15%', descKey: 'tradeWaste', agency: 'Länder' },
        ],
        effectiveTax: 22.5,
        regulations: ['KrWG', 'VerpackG', 'BImSchG'],
      },
      {
        id: 'nrw',
        nameKey: 'germanyNRW',
        incentives: [
          { type: 'rd', value: '25%', descKey: 'rdCredit', agency: 'BMF' },
          { type: 'innovation', value: 'Grants', descKey: 'innovationGrants', agency: 'NRW.INVEST' },
          { type: 'progres', value: '50%', descKey: 'progresProgram', agency: 'NRW Energy' },
        ],
        effectiveTax: 30.0,
        regulations: ['KrWG', 'LAbfG NRW'],
      },
    ],
  },
  mexico: {
    flag: '🇲🇽',
    corporateTax: 30,
    regions: [
      {
        id: 'sonora',
        nameKey: 'mexicoSonora',
        incentives: [
          { type: 'immex', value: 'VAT Defer', descKey: 'immexProgram', agency: 'SAT' },
          { type: 'state', value: '-50%', descKey: 'stateIncentives', agency: 'Gobierno Sonora' },
          { type: 'prosec', value: '-5% tariff', descKey: 'prosecProgram', agency: 'SE' },
          { type: 'mining', value: '20%', descKey: 'miningRoyalty', agency: 'Federal/State' },
        ],
        effectiveTax: 22.0,
        regulations: ['LGPGIR', 'NOM-161-SEMARNAT'],
      },
      {
        id: 'zacatecas',
        nameKey: 'mexicoZacatecas',
        incentives: [
          { type: 'immex', value: 'VAT Defer', descKey: 'immexProgram', agency: 'SAT' },
          { type: 'state', value: '-60%', descKey: 'miningZoneState', agency: 'Gobierno Zacatecas' },
          { type: 'payroll', value: '-30%', descKey: 'payrollSubsidy', agency: 'Estado' },
        ],
        effectiveTax: 21.0,
        regulations: ['LGPGIR', 'Mining Law'],
      },
    ],
  },
  southAfrica: {
    flag: '🇿🇦',
    corporateTax: 28,
    regions: [
      {
        id: 'gauteng',
        nameKey: 'saGauteng',
        incentives: [
          { type: 'sez', value: '-15%', descKey: 'sezReduction', agency: 'dtic' },
          { type: 'depreciation', value: '100%', descKey: 'fullDepreciation', agency: 'SARS' },
          { type: 'bbbee', value: 'Bonus', descKey: 'bbbeeBonus', agency: 'dtic' },
          { type: 'idc', value: 'Funding', descKey: 'idcFunding', agency: 'IDC' },
        ],
        effectiveTax: 13.0,
        regulations: ['NEMA', 'Waste Act 59/2008'],
      },
      {
        id: 'limpopo',
        nameKey: 'saLimpopo',
        incentives: [
          { type: 'sez', value: '-15%', descKey: 'sezReduction', agency: 'dtic' },
          { type: 'employment', value: 'R50K/job', descKey: 'employmentIncentive', agency: 'dtic' },
          { type: 'training', value: '75%', descKey: 'trainingGrant', agency: 'SETA' },
        ],
        effectiveTax: 13.0,
        regulations: ['NEMA', 'Waste Management Act'],
      },
    ],
  },
};

// Translations for incentive types
const INCENTIVE_TRANSLATIONS = {
  irpj: { pt: 'IRPJ', en: 'Corporate Tax', es: 'Imp. Renta', zh: '企业所得税', it: 'IRES' },
  ipi: { pt: 'IPI', en: 'Excise Tax', es: 'IVA Prod.', zh: '消费税', it: 'IVA Prod.' },
  icms: { pt: 'ICMS', en: 'State VAT', es: 'IVA Est.', zh: '州增值税', it: 'IVA Regionale' },
  iss: { pt: 'ISS', en: 'Service Tax', es: 'Imp. Serv.', zh: '服务税', it: 'Imposta Servizi' },
  rd: { pt: 'P&D', en: 'R&D', es: 'I+D', zh: '研发', it: 'R&S' },
  asset: { pt: 'Ativos', en: 'Assets', es: 'Activos', zh: '资产', it: 'Asset' },
  landfill: { pt: 'Aterro', en: 'Landfill', es: 'Vertedero', zh: '填埋', it: 'Discarica' },
  state: { pt: 'Estadual', en: 'State', es: 'Estatal', zh: '州税', it: 'Regionale' },
  property: { pt: 'Imóveis', en: 'Property', es: 'Propied.', zh: '财产', it: 'Immobili' },
  environmental: { pt: 'Ambiental', en: 'Environmental', es: 'Ambiental', zh: '环境', it: 'Ambientale' },
  credit: { pt: 'Crédito', en: 'Credit', es: 'Crédito', zh: '信贷', it: 'Credito' },
  depreciation: { pt: 'Deprec.', en: 'Deprec.', es: 'Deprec.', zh: '折旧', it: 'Ammort.' },
  pis_cofins: { pt: 'PIS/COFINS', en: 'PIS/COFINS', es: 'PIS/COFINS', zh: 'PIS/COFINS', it: 'PIS/COFINS' },
  tsa: { pt: 'TSA', en: 'TSA', es: 'TSA', zh: 'TSA', it: 'TSA' },
  cefc: { pt: 'CEFC', en: 'CEFC', es: 'CEFC', zh: 'CEFC', it: 'CEFC' },
  payroll: { pt: 'Folha', en: 'Payroll', es: 'Nómina', zh: '工资税', it: 'Stipendi' },
  renta: { pt: 'Renda', en: 'Income', es: 'Renta', zh: '所得税', it: 'Reddito' },
  iva: { pt: 'IVA', en: 'VAT', es: 'IVA', zh: '增值税', it: 'IVA' },
  corfo: { pt: 'CORFO', en: 'CORFO', es: 'CORFO', zh: 'CORFO', it: 'CORFO' },
  carbon: { pt: 'Carbono', en: 'Carbon', es: 'Carbono', zh: '碳信用', it: 'Carbonio' },
  mining: { pt: 'Mineração', en: 'Mining', es: 'Minería', zh: '采矿', it: 'Minerario' },
  proinversion: { pt: 'Investim.', en: 'Investment', es: 'Inversión', zh: '投资', it: 'Investimento' },
  macrs: { pt: 'MACRS', en: 'MACRS', es: 'MACRS', zh: 'MACRS', it: 'MACRS' },
  qoz: { pt: 'QOZ', en: 'QOZ', es: 'QOZ', zh: 'QOZ', it: 'QOZ' },
  tceq: { pt: 'TCEQ', en: 'TCEQ', es: 'TCEQ', zh: 'TCEQ', it: 'TCEQ' },
  s179: { pt: 'Seção 179', en: 'Section 179', es: 'Sección 179', zh: '第179条', it: 'Sezione 179' },
  adeq: { pt: 'ADEQ', en: 'ADEQ', es: 'ADEQ', zh: 'ADEQ', it: 'ADEQ' },
  irap: { pt: 'IRAP', en: 'IRAP', es: 'IRAP', zh: 'IRAP', it: 'IRAP' },
  transition: { pt: 'Transição', en: 'Transition', es: 'Transición', zh: '过渡', it: 'Transizione' },
  eco: { pt: 'Eco-Ind.', en: 'Eco-Ind.', es: 'Eco-Ind.', zh: '生态工业', it: 'Eco-Ind.' },
  mezzogiorno: { pt: 'Sul Itália', en: 'South Italy', es: 'Sur Italia', zh: '意大利南部', it: 'Mezzogiorno' },
  zes: { pt: 'ZES', en: 'SEZ', es: 'ZEE', zh: '经济特区', it: 'ZES' },
  training: { pt: 'Trein.', en: 'Training', es: 'Capac.', zh: '培训', it: 'Formaz.' },
  investment: { pt: 'Investim.', en: 'Investment', es: 'Inversión', zh: '投资', it: 'Investimento' },
  kfw: { pt: 'KfW', en: 'KfW', es: 'KfW', zh: 'KfW', it: 'KfW' },
  gwr: { pt: 'GWR', en: 'GWR', es: 'GWR', zh: 'GWR', it: 'GWR' },
  innovation: { pt: 'Inovação', en: 'Innovation', es: 'Innovación', zh: '创新', it: 'Innovazione' },
  progres: { pt: 'ProGres', en: 'ProGres', es: 'ProGres', zh: 'ProGres', it: 'ProGres' },
  immex: { pt: 'IMMEX', en: 'IMMEX', es: 'IMMEX', zh: 'IMMEX', it: 'IMMEX' },
  prosec: { pt: 'PROSEC', en: 'PROSEC', es: 'PROSEC', zh: 'PROSEC', it: 'PROSEC' },
  sez: { pt: 'ZEE', en: 'SEZ', es: 'ZEE', zh: '经济特区', it: 'ZES' },
  bbbee: { pt: 'B-BBEE', en: 'B-BBEE', es: 'B-BBEE', zh: 'B-BBEE', it: 'B-BBEE' },
  idc: { pt: 'IDC', en: 'IDC', es: 'IDC', zh: 'IDC', it: 'IDC' },
  employment: { pt: 'Emprego', en: 'Employment', es: 'Empleo', zh: '就业', it: 'Occupazione' },
};

// Helper function to map country names to keys
const COUNTRY_KEY_MAP: Record<string, string> = {
  'Brasil': 'brazil',
  'Brazil': 'brazil',
  'Australia': 'australia',
  'Austrália': 'australia',
  'Chile': 'chile',
  'USA': 'usa',
  'United States': 'usa',
  'Estados Unidos': 'usa',
  'Italy': 'italy',
  'Itália': 'italy',
  'Italia': 'italy',
  'Germany': 'germany',
  'Alemanha': 'germany',
  'Deutschland': 'germany',
  'Mexico': 'mexico',
  'México': 'mexico',
  'South Africa': 'southAfrica',
  'África do Sul': 'southAfrica',
};

// Get regions for a given country
export function getRegionsForCountry(country: string): Array<{ id: string; nameKey: string; effectiveTax: number }> {
  const countryKey = COUNTRY_KEY_MAP[country];
  if (!countryKey || !FISCAL_INCENTIVES_DATA[countryKey]) {
    return [];
  }
  return FISCAL_INCENTIVES_DATA[countryKey].regions.map(r => ({
    id: r.id,
    nameKey: r.nameKey,
    effectiveTax: r.effectiveTax,
  }));
}

// Get effective tax rate for a country and region
export function getEffectiveTaxRate(country: string, regionId: string): number | null {
  const countryKey = COUNTRY_KEY_MAP[country];
  if (!countryKey || !FISCAL_INCENTIVES_DATA[countryKey]) {
    return null;
  }
  const region = FISCAL_INCENTIVES_DATA[countryKey].regions.find(r => r.id === regionId);
  return region ? region.effectiveTax : null;
}

// Get base corporate tax rate for a country
export function getBaseTaxRate(country: string): number | null {
  const countryKey = COUNTRY_KEY_MAP[country];
  if (!countryKey || !FISCAL_INCENTIVES_DATA[countryKey]) {
    return null;
  }
  return FISCAL_INCENTIVES_DATA[countryKey].corporateTax;
}

// Get full region details including all incentives for tooltip display
export function getRegionIncentiveDetails(country: string, regionId: string): {
  incentives: Array<{ type: string; value: string; agency: string; descKey: string }>;
  regulations: string[];
  corporateTax: number;
  effectiveTax: number;
  savings: number;
} | null {
  const countryKey = COUNTRY_KEY_MAP[country];
  if (!countryKey || !FISCAL_INCENTIVES_DATA[countryKey]) {
    return null;
  }
  const countryData = FISCAL_INCENTIVES_DATA[countryKey];
  const region = countryData.regions.find(r => r.id === regionId);
  if (!region) return null;
  
  return {
    incentives: region.incentives,
    regulations: region.regulations,
    corporateTax: countryData.corporateTax,
    effectiveTax: region.effectiveTax,
    savings: countryData.corporateTax - region.effectiveTax
  };
}

// ============================================
// GOVERNMENT PARTNERSHIP MODEL - Real Market Data January 2026
// ============================================

// Government royalty rates and environmental bonus by country - Based on real regulations and market practices
export const GOVERNMENT_PARTNERSHIP_DATA: Record<string, {
  countryKey: string;
  flag: string;
  currency: string;
  governmentModels: Array<{
    id: string;
    nameKey: string;
    royaltyRange: { min: number; max: number; recommended: number };
    envBonusRange: { min: number; max: number; recommended: number }; // USD per ton
    description: string;
    regulations: string[];
    benefits: string[];
    collectionModels: string[];
  }>;
  defaultRoyalty: number;
  defaultEnvBonus: number;
  marketReference: string;
}> = {
  brazil: {
    countryKey: 'brazil',
    flag: '🇧🇷',
    currency: 'BRL',
    governmentModels: [
      {
        id: 'direct_mining',
        nameKey: 'directMining',
        royaltyRange: { min: 0, max: 5, recommended: 2 },
        envBonusRange: { min: 0, max: 8, recommended: 3 },
        description: 'Parceria direta com mineradoras - recebimento gratuito + bônus ambiental',
        regulations: ['PNRS 12.305/2010', 'CONAMA 416/2009'],
        benefits: ['Destinação certificada IBAMA', 'Créditos de carbono', 'Compliance ambiental'],
        collectionModels: ['direct', 'mining']
      },
      {
        id: 'state_partnership',
        nameKey: 'statePartnership',
        royaltyRange: { min: 5, max: 15, recommended: 10 },
        envBonusRange: { min: 5, max: 12, recommended: 8 },
        description: 'Parceria com governo estadual - SEMA/IBAMA',
        regulations: ['PNRS 12.305/2010', 'Lei Estadual Resíduos'],
        benefits: ['Incentivos ICMS', 'Créditos BNDES', 'Logística reversa oficial'],
        collectionModels: ['government', 'hybrid']
      },
      {
        id: 'reciclanip_model',
        nameKey: 'reciclanipModel',
        royaltyRange: { min: 0, max: 3, recommended: 0 },
        envBonusRange: { min: 15, max: 25, recommended: 20 },
        description: 'Modelo Reciclanip - Bônus ambiental por pneu destinado (~R$80/pneu OTR)',
        regulations: ['CONAMA 416/2009', 'Resolução Reciclanip'],
        benefits: ['Certificado Reciclanip', 'Destinação homologada', 'Rastreabilidade'],
        collectionModels: ['direct', 'hybrid']
      }
    ],
    defaultRoyalty: 5,
    defaultEnvBonus: 8,
    marketReference: 'Reciclanip + IBAMA Jan 2026'
  },
  australia: {
    countryKey: 'australia',
    flag: '🇦🇺',
    currency: 'AUD',
    governmentModels: [
      {
        id: 'tsa_scheme',
        nameKey: 'tsaScheme',
        royaltyRange: { min: 0, max: 5, recommended: 2 },
        envBonusRange: { min: 15, max: 35, recommended: 25 },
        description: 'Tyre Stewardship Australia - Levy rebate scheme',
        regulations: ['Product Stewardship Act 2011', 'TSA Accreditation'],
        benefits: ['TSA Accreditation', 'Landfill levy avoided AUD 200/t', 'Carbon credits'],
        collectionModels: ['direct', 'hybrid']
      },
      {
        id: 'state_epa',
        nameKey: 'stateEpa',
        royaltyRange: { min: 3, max: 10, recommended: 5 },
        envBonusRange: { min: 10, max: 20, recommended: 15 },
        description: 'State EPA Partnership - WA/QLD/NSW',
        regulations: ['EPA State Regulations', 'Waste Management Act'],
        benefits: ['Landfill diversion credits', 'State grants', 'Priority permitting'],
        collectionModels: ['government', 'mining']
      },
      {
        id: 'mining_direct',
        nameKey: 'miningDirect',
        royaltyRange: { min: 0, max: 3, recommended: 0 },
        envBonusRange: { min: 20, max: 40, recommended: 30 },
        description: 'Direct mining partnerships - Rio Tinto, BHP, Fortescue',
        regulations: ['Mining Environmental Obligations'],
        benefits: ['Free tire supply', 'Transport included', 'Long-term contracts'],
        collectionModels: ['mining', 'direct']
      }
    ],
    defaultRoyalty: 2,
    defaultEnvBonus: 25,
    marketReference: 'TSA + EPA WA Jan 2026'
  },
  chile: {
    countryKey: 'chile',
    flag: '🇨🇱',
    currency: 'CLP',
    governmentModels: [
      {
        id: 'ley_rep',
        nameKey: 'leyRep',
        royaltyRange: { min: 0, max: 8, recommended: 5 },
        envBonusRange: { min: 10, max: 25, recommended: 18 },
        description: 'Ley REP 20.920 - Extended Producer Responsibility',
        regulations: ['Ley REP 20.920', 'DS 40/2012'],
        benefits: ['REP compliance credits', 'CORFO grants', 'Carbon market access'],
        collectionModels: ['direct', 'government']
      },
      {
        id: 'codelco_direct',
        nameKey: 'codelcoDirect',
        royaltyRange: { min: 0, max: 5, recommended: 2 },
        envBonusRange: { min: 12, max: 30, recommended: 22 },
        description: 'Parceria direta Codelco/Escondida - Free tires + bonus',
        regulations: ['Mining Environmental Standards'],
        benefits: ['Free OTR supply', 'Long-term agreement', 'Transport support'],
        collectionModels: ['mining']
      }
    ],
    defaultRoyalty: 3,
    defaultEnvBonus: 18,
    marketReference: 'CORFO + Codelco Jan 2026'
  },
  usa: {
    countryKey: 'usa',
    flag: '🇺🇸',
    currency: 'USD',
    governmentModels: [
      {
        id: 'tceq_texas',
        nameKey: 'tceqTexas',
        royaltyRange: { min: 0, max: 5, recommended: 0 },
        envBonusRange: { min: 8, max: 20, recommended: 12 },
        description: 'Texas Commission on Environmental Quality grants',
        regulations: ['RCRA', 'Texas Tire Program'],
        benefits: ['State recycling grants', 'Tax exemptions', 'Tipping fee revenue'],
        collectionModels: ['direct', 'government']
      },
      {
        id: 'mining_west',
        nameKey: 'miningWest',
        royaltyRange: { min: 0, max: 3, recommended: 0 },
        envBonusRange: { min: 10, max: 25, recommended: 15 },
        description: 'Western mining operations - Nevada, Arizona, Utah',
        regulations: ['EPA RCRA', 'State Mining Laws'],
        benefits: ['Free tire collection', 'EPA compliance support', 'Carbon credits'],
        collectionModels: ['mining', 'direct']
      }
    ],
    defaultRoyalty: 0,
    defaultEnvBonus: 12,
    marketReference: 'EPA + State Programs Jan 2026'
  },
  italy: {
    countryKey: 'italy',
    flag: '🇮🇹',
    currency: 'EUR',
    governmentModels: [
      {
        id: 'ecopneus',
        nameKey: 'ecopneus',
        royaltyRange: { min: 0, max: 5, recommended: 3 },
        envBonusRange: { min: 20, max: 40, recommended: 30 },
        description: 'Ecopneus Consortium - €30-40/ton environmental contribution',
        regulations: ['TUA D.Lgs 152/2006', 'CONAI System'],
        benefits: ['Ecopneus certification', 'EU taxonomy alignment', 'EPR credits'],
        collectionModels: ['direct', 'government']
      },
      {
        id: 'south_zes',
        nameKey: 'southZes',
        royaltyRange: { min: 5, max: 12, recommended: 8 },
        envBonusRange: { min: 15, max: 30, recommended: 22 },
        description: 'Southern Italy ZES + Invitalia support',
        regulations: ['ZES Law', 'Mezzogiorno Incentives'],
        benefits: ['45% investment credit', 'IRAP reduction', 'Training grants'],
        collectionModels: ['government', 'hybrid']
      }
    ],
    defaultRoyalty: 3,
    defaultEnvBonus: 30,
    marketReference: 'Ecopneus + CONAI Jan 2026'
  },
  germany: {
    countryKey: 'germany',
    flag: '🇩🇪',
    currency: 'EUR',
    governmentModels: [
      {
        id: 'grv_system',
        nameKey: 'grvSystem',
        royaltyRange: { min: 0, max: 5, recommended: 2 },
        envBonusRange: { min: 25, max: 45, recommended: 35 },
        description: 'GRV Tire Recycling System - €35-45/ton contribution',
        regulations: ['KrWG', 'VerpackG', 'BImSchG'],
        benefits: ['GRV certification', 'Waste hierarchy compliance', 'CO2 credits'],
        collectionModels: ['direct', 'hybrid']
      },
      {
        id: 'east_investment',
        nameKey: 'eastInvestment',
        royaltyRange: { min: 5, max: 15, recommended: 10 },
        envBonusRange: { min: 20, max: 35, recommended: 28 },
        description: 'East Germany investment grants + KfW loans',
        regulations: ['BAFA Investment Grant', 'KfW Programs'],
        benefits: ['25% investment grant', 'KfW green loans', 'R&D credits'],
        collectionModels: ['government']
      }
    ],
    defaultRoyalty: 2,
    defaultEnvBonus: 35,
    marketReference: 'GRV + BAFA Jan 2026'
  },
  mexico: {
    countryKey: 'mexico',
    flag: '🇲🇽',
    currency: 'MXN',
    governmentModels: [
      {
        id: 'semarnat',
        nameKey: 'semarnat',
        royaltyRange: { min: 5, max: 15, recommended: 10 },
        envBonusRange: { min: 5, max: 15, recommended: 10 },
        description: 'SEMARNAT environmental program + state incentives',
        regulations: ['LGPGIR', 'NOM-161-SEMARNAT'],
        benefits: ['Environmental permits fast-track', 'State tax reductions', 'IMMEX benefits'],
        collectionModels: ['government', 'direct']
      },
      {
        id: 'mining_sonora',
        nameKey: 'miningSonora',
        royaltyRange: { min: 0, max: 8, recommended: 5 },
        envBonusRange: { min: 8, max: 18, recommended: 12 },
        description: 'Mining partnerships Sonora/Zacatecas',
        regulations: ['Mining Law', 'State Environmental Laws'],
        benefits: ['Free tire supply', 'Mining royalty sharing', 'Transport support'],
        collectionModels: ['mining']
      }
    ],
    defaultRoyalty: 8,
    defaultEnvBonus: 10,
    marketReference: 'SEMARNAT + Estado Jan 2026'
  },
  southAfrica: {
    countryKey: 'southAfrica',
    flag: '🇿🇦',
    currency: 'ZAR',
    governmentModels: [
      {
        id: 'redisa',
        nameKey: 'redisa',
        royaltyRange: { min: 0, max: 8, recommended: 5 },
        envBonusRange: { min: 15, max: 30, recommended: 22 },
        description: 'REDISA-style EPR scheme + dtic incentives',
        regulations: ['NEMA', 'Waste Act 59/2008'],
        benefits: ['EPR compliance', 'SEZ tax reduction', 'B-BBEE bonus'],
        collectionModels: ['direct', 'government']
      },
      {
        id: 'mining_gauteng',
        nameKey: 'miningGauteng',
        royaltyRange: { min: 0, max: 5, recommended: 2 },
        envBonusRange: { min: 12, max: 25, recommended: 18 },
        description: 'Mining partnerships Gauteng/Limpopo - Anglo American, De Beers',
        regulations: ['Mining Charter', 'Environmental Obligations'],
        benefits: ['Free OTR tires', 'IDC funding access', 'Employment incentives R50K/job'],
        collectionModels: ['mining']
      }
    ],
    defaultRoyalty: 3,
    defaultEnvBonus: 20,
    marketReference: 'dtic + Mining Jan 2026'
  }
};

// Get government partnership data for a country
export function getGovernmentPartnershipData(country: string): typeof GOVERNMENT_PARTNERSHIP_DATA[string] | null {
  const countryKey = COUNTRY_KEY_MAP[country];
  if (!countryKey || !GOVERNMENT_PARTNERSHIP_DATA[countryKey]) {
    return null;
  }
  return GOVERNMENT_PARTNERSHIP_DATA[countryKey];
}

// Get recommended royalty and environmental bonus for a country and collection model
export function getRecommendedPartnershipTerms(country: string, collectionModel: string): {
  royalty: number;
  envBonus: number;
  modelName: string;
  regulations: string[];
  benefits: string[];
} | null {
  const data = getGovernmentPartnershipData(country);
  if (!data) return null;
  
  // Find matching model
  const model = data.governmentModels.find(m => m.collectionModels.includes(collectionModel));
  if (!model) {
    // Return defaults if no specific model found
    return {
      royalty: data.defaultRoyalty,
      envBonus: data.defaultEnvBonus,
      modelName: 'default',
      regulations: [],
      benefits: []
    };
  }
  
  return {
    royalty: model.royaltyRange.recommended,
    envBonus: model.envBonusRange.recommended,
    modelName: model.nameKey,
    regulations: model.regulations,
    benefits: model.benefits
  };
}

// Calculate government partnership impact on financials
export function calculateGovernmentPartnershipImpact(
  annualRevenue: number,
  annualTonnage: number,
  royaltyPercent: number,
  envBonusPerTon: number
): {
  annualRoyalties: number;
  annualEnvBonus: number;
  netRevenue: number;
  netImpact: number;
  adjustedRevenuePercent: number;
} {
  const annualRoyalties = annualRevenue * (royaltyPercent / 100);
  const annualEnvBonus = annualTonnage * envBonusPerTon;
  const netRevenue = annualRevenue - annualRoyalties + annualEnvBonus;
  const netImpact = annualEnvBonus - annualRoyalties;
  const adjustedRevenuePercent = annualRevenue > 0 ? (netRevenue / annualRevenue) * 100 : 100;
  
  return {
    annualRoyalties,
    annualEnvBonus,
    netRevenue,
    netImpact,
    adjustedRevenuePercent
  };
}

// ============================================
// TIRE CATEGORY DATABASE - Real Data January 2026
// Different tire types have different compositions, processing costs, and yields
// ============================================

export interface TireCategory {
  id: string;
  nameKey: string;
  icon: string;
  avgWeight: number; // kg per tire
  composition: { rubber: number; steel: number; textile: number; other: number };
  processingDifficulty: 'low' | 'medium' | 'high' | 'very_high';
  processingCostMultiplier: number; // 1.0 = baseline, higher = more expensive to process
  yieldMultiplier: number; // efficiency of recovery
  recommendedCapacity: number; // tons/day
  typicalSources: string[];
  models: Array<{
    model: string;
    applicationKey: string;
    weight: number;
    diameter: number;
    recoverable: { granules: number; steel: number; textile: number; rcb: number };
  }>;
}

// ============================================
// TIRE CATEGORY DATABASE - Real Data January 2026
// Source: Michelin/Bridgestone/Goodyear databooks, pyrolysis studies, Nature/ScienceDirect reports
// IMPORTANT: Each tire model has SPECIFIC composition percentages (not generic averages)
// ============================================

export const TIRE_CATEGORIES: TireCategory[] = [
  {
    id: 'otr_mining',
    nameKey: 'otrMining',
    icon: '⛏️',
    avgWeight: 3470, // Weighted average of mining OTR tires (1800+2500+3700+4000+5350)/5
    // Composition is MODEL-SPECIFIC - see individual models below
    // Larger tires have MORE steel (30%) and LESS rubber (50%) to support >100t loads
    composition: { rubber: 52, steel: 28, textile: 6, other: 14 }, // Average for category
    processingDifficulty: 'very_high',
    processingCostMultiplier: 1.4,
    yieldMultiplier: 0.92,
    recommendedCapacity: 85,
    typicalSources: ['Vale', 'BHP', 'Rio Tinto', 'Anglo American', 'Codelco', 'Fortescue'],
    models: [
      // 27.00R49 - Dump trucks ~100t (Michelin XDR2 ~1,800 kg)
      // Composition: Rubber 54-56%, Steel 24-26%, Textile 7-9%, rCB yield 10-15%
      // Diameter: 2.700mm, Tread depth: 70-80mm, Max load: 27,250kg @50km/h, TKPH: 500-600
      { 
        model: '27.00R49', 
        applicationKey: 'dumpTrucks100t', 
        weight: 1800, // Confirmed: Michelin XDR2 ~1,800kg
        diameter: 2.7, 
        recoverable: { 
          granules: 990,  // 55% of 1800kg = 990kg rubber
          steel: 450,     // 25% of 1800kg = 450kg steel
          textile: 144,   // 8% of 1800kg = 144kg textile
          rcb: 225        // 12.5% yield from pyrolysis = 225kg rCB
        } 
      },
      // 33.00R51 - Dump trucks ~150t (Bridgestone V-Steel ~2,500 kg)
      // Composition: Rubber 53-55%, Steel 25-27%, Textile 6-8%, rCB yield 12-16%
      // Diameter: 3.060mm, Tread depth: 80-90mm, Max load: 41,250kg @50km/h, TKPH: 700-800
      { 
        model: '33.00R51', 
        applicationKey: 'dumpTrucks150t', 
        weight: 2500, // Confirmed: Bridgestone ~2,500kg
        diameter: 3.06, 
        recoverable: { 
          granules: 1350, // 54% of 2500kg = 1,350kg rubber
          steel: 650,     // 26% of 2500kg = 650kg steel
          textile: 175,   // 7% of 2500kg = 175kg textile
          rcb: 350        // 14% yield from pyrolysis = 350kg rCB
        } 
      },
      // 40.00R57 - Dump trucks 200t+ (Michelin XDR3 ~3,720 kg, Bridgestone ~3,655 kg)
      // Composition: Rubber 52-54%, Steel 27-29%, Textile 5-7%, rCB yield 13-18%
      // Diameter: 3.570mm, Tread depth: 90-100mm, Max load: 60,000kg @50km/h, TKPH: 900-1,000
      { 
        model: '40.00R57', 
        applicationKey: 'dumpTrucks200t', 
        weight: 3700, // Corrected: 3,700kg (average Michelin/Bridgestone)
        diameter: 3.57, 
        recoverable: { 
          granules: 1961, // 53% of 3700kg = 1,961kg rubber
          steel: 1036,    // 28% of 3700kg = 1,036kg steel
          textile: 222,   // 6% of 3700kg = 222kg textile
          rcb: 555        // 15% yield from pyrolysis = 555kg rCB
        } 
      },
      // 46/90R57 - Giant wheel loaders (Bridgestone VREV ~3,946 kg, Haian ~4,000 kg)
      // Composition: Rubber 51-53%, Steel 28-30%, Textile 5-7%, rCB yield 14-19%
      // Diameter: 3.560mm, Tread depth: 85-95mm, Max load: 63,000kg @40km/h, TKPH: 990-1,100
      { 
        model: '46/90R57', 
        applicationKey: 'giantLoaders', 
        weight: 4000, // Confirmed: ~4,000kg average
        diameter: 3.56, 
        recoverable: { 
          granules: 2080, // 52% of 4000kg = 2,080kg rubber
          steel: 1160,    // 29% of 4000kg = 1,160kg steel
          textile: 240,   // 6% of 4000kg = 240kg textile
          rcb: 660        // 16.5% yield from pyrolysis = 660kg rCB
        } 
      },
      // 59/80R63 - Ultra-class 400t+ (Michelin XDR4 ~5,350 kg, Bridgestone VRF ~5,370 kg)
      // LARGEST TIRE IN THE WORLD - Cat 797, Liebherr T284
      // Composition: Rubber 50-52%, Steel 29-31%, Textile 4-6%, rCB yield 15-20%
      // Diameter: 4.027mm, Tread depth: 100-116mm, Max load: 100,000kg @50km/h, TKPH: 1,400-1,500
      // Features: +7-10% lifespan with anti-corrosion compounds, IoT monitoring in 2026 models
      { 
        model: '59/80R63', 
        applicationKey: 'ultraClass400t', 
        weight: 5350, // Corrected: 5,350kg (Michelin XDR4 confirmed)
        diameter: 4.03, 
        recoverable: { 
          granules: 2728, // 51% of 5350kg = 2,728kg rubber
          steel: 1605,    // 30% of 5350kg = 1,605kg steel
          textile: 267,   // 5% of 5350kg = 267kg textile
          rcb: 936        // 17.5% yield from pyrolysis = 936kg rCB
        } 
      }
    ]
  },
  {
    // ============================================
    // OTR CONSTRUCTION - Wheel loaders, graders, dumpers for construction/ports
    // Source: Michelin/Bridgestone catalogs, DCCEEW Australia report
    // Composition: Higher rubber (58%) than mining OTR, less steel (22%)
    // ============================================
    id: 'otr_construction',
    nameKey: 'otrConstruction',
    icon: '🏗️',
    avgWeight: 680, // Weighted average of construction OTR models
    composition: { rubber: 58, steel: 22, textile: 10, other: 10 },
    processingDifficulty: 'high',
    processingCostMultiplier: 1.2,
    yieldMultiplier: 0.95,
    recommendedCapacity: 60,
    typicalSources: ['Caterpillar dealers', 'John Deere dealers', 'Construction companies', 'Port authorities'],
    models: [
      // 17.5R25 - Small wheel loaders (Cat 914, JD 304)
      // Source: Michelin XHA2 spec sheet - ~320-380kg
      { model: '17.5R25', applicationKey: 'wheelLoaders', weight: 350, diameter: 1.35, 
        recoverable: { granules: 203, steel: 77, textile: 35, rcb: 28 } }, // 58% rubber, 22% steel, 10% textile, 8% rCB
      // 20.5R25 - Motor graders, medium loaders
      // Source: Bridgestone VJT spec - ~500-540kg
      { model: '20.5R25', applicationKey: 'graders', weight: 520, diameter: 1.55, 
        recoverable: { granules: 302, steel: 114, textile: 52, rcb: 42 } },
      // 23.5R25 - Articulated dumpers, large loaders (Cat 950)
      // Source: Michelin XAD65 spec - ~700-800kg
      { model: '23.5R25', applicationKey: 'articDumpers', weight: 750, diameter: 1.75, 
        recoverable: { granules: 435, steel: 165, textile: 75, rcb: 60 } },
      // 26.5R25 - Large wheel loaders (Cat 966)
      // Source: Bridgestone VSDT spec - ~1,000-1,200kg
      { model: '26.5R25', applicationKey: 'largeLoaders', weight: 1100, diameter: 1.95, 
        recoverable: { granules: 638, steel: 242, textile: 110, rcb: 88 } }
    ]
  },
  {
    // ============================================
    // AGRICULTURAL TIRES - Tractors, harvesters, combines
    // Source: FHWA report, Gradeall analysis
    // Composition: Highest rubber content (62%), lowest steel (15%)
    // Bias-ply still common = more textile fiber
    // ============================================
    id: 'agricultural',
    nameKey: 'agricultural',
    icon: '🚜',
    avgWeight: 258, // Average of agricultural tire models
    composition: { rubber: 62, steel: 15, textile: 12, other: 11 },
    processingDifficulty: 'medium',
    processingCostMultiplier: 1.0,
    yieldMultiplier: 0.97,
    recommendedCapacity: 40,
    typicalSources: ['Agricultural cooperatives', 'Farm equipment dealers', 'Tire retreaders', 'Rural waste collectors'],
    models: [
      // 380/85R24 - Tractor front tires
      // Source: Firestone/Michelin ag catalogs - ~70-90kg
      { model: '380/85R24', applicationKey: 'tractorFront', weight: 80, diameter: 1.1, 
        recoverable: { granules: 50, steel: 12, textile: 10, rcb: 5 } }, // 62.5% rubber, 15% steel, 12.5% textile
      // 520/85R38 - Tractor rear tires
      // Source: Firestone Radial 9000 spec - ~180-220kg
      { model: '520/85R38', applicationKey: 'tractorRear', weight: 200, diameter: 1.65, 
        recoverable: { granules: 124, steel: 30, textile: 24, rcb: 12 } },
      // 710/70R42 - Large harvester/sprayer tires
      // Source: Michelin Megaxbib spec - ~380-420kg
      { model: '710/70R42', applicationKey: 'largeHarvester', weight: 400, diameter: 2.05, 
        recoverable: { granules: 248, steel: 60, textile: 48, rcb: 24 } },
      // 800/65R32 - Combine front tires
      // Source: Goodyear LSW spec - ~330-370kg
      { model: '800/65R32', applicationKey: 'combineFront', weight: 350, diameter: 1.85, 
        recoverable: { granules: 217, steel: 53, textile: 42, rcb: 21 } }
    ]
  },
  {
    // ============================================
    // TRUCK/BUS TIRES - Commercial vehicle tires (TBR - Truck Bus Radial)
    // Source: FHWA report: "65% natural rubber, 35% synthetic"
    // Source: MDPI review, Canada scrap tire report
    // Easiest to process - standardized sizes, high volume
    // ============================================
    id: 'truck_bus',
    nameKey: 'truckBus',
    icon: '🚛',
    avgWeight: 60, // Average truck/bus tire weight
    // Composition: Higher rubber (65%), moderate steel (20%) - radial belted
    composition: { rubber: 65, steel: 20, textile: 8, other: 7 },
    processingDifficulty: 'low',
    processingCostMultiplier: 0.8,
    yieldMultiplier: 0.98, // Highest recovery efficiency - standardized processing
    recommendedCapacity: 100, // tons/day - high volume
    typicalSources: ['Fleet operators', 'Tire retreaders', 'Bus companies', 'Logistics companies', 'Municipal collectors'],
    models: [
      // 295/80R22.5 - Truck steer axle (most common)
      // Source: Michelin X Multi spec - ~50-58kg
      { model: '295/80R22.5', applicationKey: 'truckSteer', weight: 55, diameter: 1.0, 
        recoverable: { granules: 36, steel: 11, textile: 4, rcb: 3 } }, // 65% rubber, 20% steel, 8% textile
      // 315/80R22.5 - Truck drive axle
      // Source: Bridgestone M749 spec - ~60-70kg
      { model: '315/80R22.5', applicationKey: 'truckDrive', weight: 65, diameter: 1.08, 
        recoverable: { granules: 42, steel: 13, textile: 5, rcb: 4 } },
      // 385/65R22.5 - Trailer wide base
      // Source: Continental HSR2 spec - ~65-75kg
      { model: '385/65R22.5', applicationKey: 'trailerWide', weight: 70, diameter: 1.05, 
        recoverable: { granules: 46, steel: 14, textile: 6, rcb: 4 } },
      // 275/70R22.5 - Urban bus tires
      // Source: Michelin X Urban spec - ~45-55kg
      { model: '275/70R22.5', applicationKey: 'busUrban', weight: 50, diameter: 0.92, 
        recoverable: { granules: 33, steel: 10, textile: 4, rcb: 3 } }
    ]
  }
];

// Get tire category by ID
export function getTireCategory(categoryId: string): TireCategory | null {
  return TIRE_CATEGORIES.find(c => c.id === categoryId) || null;
}

// Get recommended OPEX adjustments based on tire category
export function getTireCategoryOpexAdjustments(categoryId: string): {
  laborMultiplier: number;
  energyMultiplier: number;
  maintenanceMultiplier: number;
  logisticsMultiplier: number;
  totalMultiplier: number;
  description: string;
} {
  const category = getTireCategory(categoryId);
  if (!category) {
    return { laborMultiplier: 1, energyMultiplier: 1, maintenanceMultiplier: 1, logisticsMultiplier: 1, totalMultiplier: 1, description: 'Standard processing' };
  }
  
  const base = category.processingCostMultiplier;
  
  switch (category.processingDifficulty) {
    case 'very_high':
      return {
        laborMultiplier: base * 1.3,
        energyMultiplier: base * 1.5,
        maintenanceMultiplier: base * 1.4,
        logisticsMultiplier: base * 1.2,
        totalMultiplier: base * 1.35,
        description: 'Giant OTR tires require specialized equipment and trained personnel'
      };
    case 'high':
      return {
        laborMultiplier: base * 1.15,
        energyMultiplier: base * 1.25,
        maintenanceMultiplier: base * 1.2,
        logisticsMultiplier: base * 1.1,
        totalMultiplier: base * 1.18,
        description: 'Large OTR tires need heavy-duty processing equipment'
      };
    case 'medium':
      return {
        laborMultiplier: base,
        energyMultiplier: base * 1.05,
        maintenanceMultiplier: base * 1.05,
        logisticsMultiplier: base,
        totalMultiplier: base * 1.03,
        description: 'Agricultural tires with moderate processing requirements'
      };
    case 'low':
    default:
      return {
        laborMultiplier: base * 0.9,
        energyMultiplier: base * 0.85,
        maintenanceMultiplier: base * 0.9,
        logisticsMultiplier: base * 0.95,
        totalMultiplier: base * 0.9,
        description: 'Standard truck/bus tires - easiest to process'
      };
  }
}

// Get recommended yields based on tire category
export function getTireCategoryYields(categoryId: string): {
  rubber: number;
  steel: number;
  textile: number;
  rcb: number;
} {
  const category = getTireCategory(categoryId);
  if (!category) {
    return { rubber: 55, steel: 25, textile: 8, rcb: 12 };
  }
  
  const efficiency = category.yieldMultiplier;
  
  return {
    rubber: Math.round(category.composition.rubber * efficiency),
    steel: Math.round(category.composition.steel * efficiency),
    textile: Math.round(category.composition.textile * efficiency),
    rcb: Math.round(category.composition.rubber * 0.2 * efficiency) // rCB is ~20% of rubber via pyrolysis
  };
}

// Get regional environmental bonus adjustments by tire category
export function getRegionalTireBonusAdjustments(country: string, categoryId: string): {
  bonusMultiplier: number;
  reason: string;
} {
  const category = getTireCategory(categoryId);
  if (!category) return { bonusMultiplier: 1, reason: 'Standard bonus' };
  
  const countryKey = COUNTRY_KEY_MAP[country];
  
  // Mining OTR tires get higher bonuses in mining countries
  if (categoryId === 'otr_mining') {
    if (['australia', 'chile', 'brazil', 'southAfrica'].includes(countryKey || '')) {
      return { bonusMultiplier: 1.5, reason: 'Mining countries prioritize OTR disposal' };
    }
  }
  
  // Agricultural tires get bonus in agricultural countries
  if (categoryId === 'agricultural') {
    if (['brazil', 'usa', 'germany'].includes(countryKey || '')) {
      return { bonusMultiplier: 1.3, reason: 'Agricultural sector environmental programs' };
    }
  }
  
  // Truck/bus tires get bonus everywhere due to volume
  if (categoryId === 'truck_bus') {
    return { bonusMultiplier: 1.1, reason: 'High volume EPR programs' };
  }
  
  return { bonusMultiplier: 1, reason: 'Standard environmental bonus' };
}

// ============================================
// OTR GIANT TIRE COMPOSITION REFERENCE DATA - JANUARY 2026
// Source: Michelin/Bridgestone/Goodyear/Titan databooks 2024-2026, pyrolysis studies, Nature/ScienceDirect
// CRITICAL: These are REAL market-validated specifications, not estimates
// ============================================

// IMPORTANT COMPOSITION NOTES (Jan 2026):
// - Typical OTR Giant Composition: Rubber 40-60% (avg 50-55%), Steel 20-30%, Textile 5-10%, Carbon Black 20-30%
// - Larger tires (59/80R63) have MORE steel (30%) and LESS rubber (50%) to support >100t loads
// - rCB (Recovered Carbon Black) yield from pyrolysis: 30-45% of rubber content, or 10-20% of total tire
// - 2026 Trend: Manufacturers (Michelin, Bridgestone) incorporating 10-20% rCB in new compounds for sustainability

export const OTR_TIRE_MODELS = [
  // 27.00R49 - Dump trucks ~100t (ex.: Michelin XDR2)
  // Specs: Diameter 2.700mm, Tread 70-80mm, Max load 27,250kg @50km/h, TKPH 500-600
  // Life: 5,000-8,000 hours
  { 
    model: '27.00R49', 
    applicationKey: 'dumpTrucks100t', 
    weight: 1800, // Confirmed: Michelin XDR2 ~1,800kg
    diameter: 2.7, 
    composition: { rubber: 55, steel: 25, textile: 8, other: 12 }, // 54-56% rubber, 24-26% steel, 7-9% textile
    recoverable: { 
      granules: 990,  // 55% × 1800kg
      steel: 450,     // 25% × 1800kg  
      textile: 144,   // 8% × 1800kg
      rcb: 225        // 12.5% pyrolysis yield
    } 
  },
  // 33.00R51 - Dump trucks ~150t (ex.: Bridgestone V-Steel)
  // Specs: Diameter 3.060mm, Tread 80-90mm, Max load 41,250kg @50km/h, TKPH 700-800
  // Features: Low rolling resistance compound, 3-5% better fuel economy vs predecessors
  { 
    model: '33.00R51', 
    applicationKey: 'dumpTrucks150t', 
    weight: 2500, // Confirmed: Bridgestone ~2,500kg
    diameter: 3.06, 
    composition: { rubber: 54, steel: 26, textile: 7, other: 13 }, // 53-55% rubber, 25-27% steel, 6-8% textile
    recoverable: { 
      granules: 1350, // 54% × 2500kg
      steel: 650,     // 26% × 2500kg
      textile: 175,   // 7% × 2500kg
      rcb: 350        // 14% pyrolysis yield
    } 
  },
  // 40.00R57 - Dump trucks 200t+ (ex.: Michelin XDR3 ~3,720kg, Bridgestone ~3,655kg)
  // Specs: Diameter 3.570mm, Tread 90-100mm, Max load 60,000kg @50km/h, TKPH 900-1,000
  // Features: New sidewall design for +10% lifespan, rock cut resistant
  { 
    model: '40.00R57', 
    applicationKey: 'dumpTrucks200t', 
    weight: 3700, // CORRECTED: 3,700kg (not 4,000kg) - average of Michelin/Bridgestone
    diameter: 3.57, 
    composition: { rubber: 53, steel: 28, textile: 6, other: 13 }, // 52-54% rubber, 27-29% steel, 5-7% textile
    recoverable: { 
      granules: 1961, // 53% × 3700kg
      steel: 1036,    // 28% × 3700kg
      textile: 222,   // 6% × 3700kg
      rcb: 555        // 15% pyrolysis yield
    } 
  },
  // 46/90R57 - Giant wheel loaders (ex.: Bridgestone VREV ~3,946kg, Haian ~4,000kg)
  // Specs: Diameter 3.560mm, Tread 85-95mm, Max load 63,000kg @40km/h, TKPH 990-1,100
  // Features: Deep tread pattern for mud/rock traction, optimized weight for efficiency
  { 
    model: '46/90R57', 
    applicationKey: 'giantLoaders', 
    weight: 4000, // Confirmed: ~4,000kg average
    diameter: 3.56, 
    composition: { rubber: 52, steel: 29, textile: 6, other: 13 }, // 51-53% rubber, 28-30% steel, 5-7% textile
    recoverable: { 
      granules: 2080, // 52% × 4000kg
      steel: 1160,    // 29% × 4000kg
      textile: 240,   // 6% × 4000kg
      rcb: 660        // 16.5% pyrolysis yield
    } 
  },
  // 59/80R63 - Ultra-class 400t+ (ex.: Michelin XDR4 ~5,350kg, Bridgestone VRF ~5,370kg)
  // WORLD'S LARGEST TIRE - For Cat 797, Liebherr T284, BelAZ 75710
  // Specs: Diameter 4.027mm, Tread 100-116mm, Max load 100,000kg @50km/h, TKPH 1,400-1,500
  // 2026 Features: +7-10% lifespan with anti-corrosion compounds, integrated IoT monitoring
  { 
    model: '59/80R63', 
    applicationKey: 'ultraClass400t', 
    weight: 5350, // CORRECTED: 5,350kg (not 6,500kg) - Michelin XDR4 confirmed
    diameter: 4.03, 
    composition: { rubber: 51, steel: 30, textile: 5, other: 14 }, // 50-52% rubber, 29-31% steel, 4-6% textile
    recoverable: { 
      granules: 2728, // 51% × 5350kg
      steel: 1605,    // 30% × 5350kg
      textile: 267,   // 5% × 5350kg
      rcb: 936        // 17.5% pyrolysis yield
    } 
  }
];

// ============================================
// MARKET PRICES - JANUARY 2026 (VALIDATED FROM MULTIPLE SOURCES)
// Sources: Recycler's World listings, commodity exchanges, industry reports
// CRITICAL: These prices reflect RECOVERED materials from tire recycling, NOT virgin materials
// ============================================
export const OTR_MARKET_PRICES = { 
  // Rubber granules/crumb - for playgrounds, sports surfaces, asphalt modifier, rubber products
  // Source: American Recycler, Recycler's World - varied $200-290/ton (30% volatility in 2025)
  granules: { min: 200, max: 290, avg: 250 },
  
  // Steel wire (RECOVERED from tires) - lower quality than virgin, goes to foundries/steel mills
  // Source: Recycler's World Jan 2026: "Recovered Tire Wire $150/ton" (Germany listing)
  // Source: Sahd Metal 2026: Industrial Steel Busheling $380-520/ton (but tire wire is lower grade)
  // CORRECTED: Tire-recovered steel is $150-350/ton, NOT $620-680/ton
  steel: { min: 150, max: 350, avg: 250 },
  
  // Textile fiber (nylon/polyester) - for industrial felt, insulation, fuel supplement
  // Source: Industry reports - low demand, high contamination, $80-200/ton range
  textile: { min: 80, max: 200, avg: 120 },
  
  // rCB (Recovered Carbon Black) - PREMIUM product from pyrolysis
  // Source: PMC/ResearchGate pyrolysis studies - high-grade rCB commands $900-1200/ton
  // Used for sustainable rubber compounds, ink, plastics
  rcb: { min: 900, max: 1200, avg: 1050 }
};

// Calculate value per tire based on market prices
export function calculateTireValue(tireModel: string, customPrices?: { granules: number; steel: number; textile: number; rcb: number }): {
  model: string;
  weight: number;
  granuleValue: number;
  steelValue: number;
  textileValue: number;
  rcbValue: number;
  totalValue: number;
} | null {
  const tire = OTR_TIRE_MODELS.find(t => t.model === tireModel);
  if (!tire) return null;
  
  const prices = customPrices || {
    granules: OTR_MARKET_PRICES.granules.avg,
    steel: OTR_MARKET_PRICES.steel.avg,
    textile: OTR_MARKET_PRICES.textile.avg,
    rcb: OTR_MARKET_PRICES.rcb.avg
  };
  
  const granuleValue = (tire.recoverable.granules / 1000) * prices.granules;
  const steelValue = (tire.recoverable.steel / 1000) * prices.steel;
  const textileValue = (tire.recoverable.textile / 1000) * prices.textile;
  const rcbValue = (tire.recoverable.rcb / 1000) * prices.rcb;
  
  return {
    model: tire.model,
    weight: tire.weight,
    granuleValue,
    steelValue,
    textileValue,
    rcbValue,
    totalValue: granuleValue + steelValue + textileValue + rcbValue
  };
}

export function FiscalIncentivesTable() {
  const { t, i18n } = useTranslation();
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [expandedRegions, setExpandedRegions] = useState<string[]>([]);

  const currentLang = i18n.language as 'pt' | 'en' | 'es' | 'zh' | 'it';

  const toggleRegion = (regionId: string) => {
    setExpandedRegions(prev =>
      prev.includes(regionId)
        ? prev.filter(r => r !== regionId)
        : [...prev, regionId]
    );
  };

  const getIncentiveTypeName = (type: string) => {
    return INCENTIVE_TRANSLATIONS[type as keyof typeof INCENTIVE_TRANSLATIONS]?.[currentLang] || type.toUpperCase();
  };

  const countries = Object.entries(FISCAL_INCENTIVES_DATA);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="flex items-center gap-2">
              {t('admin.feasibility.fiscalTable.title', 'Incentivos Fiscais por Região')}
              <Badge variant="secondary" className="ml-2">
                <Globe className="h-3 w-3 mr-1" />
                {countries.length} {t('admin.feasibility.fiscalTable.countriesCount', 'países')}
              </Badge>
            </CardTitle>
            <CardDescription>
              {t('admin.feasibility.fiscalTable.description', 'Comparativo de incentivos fiscais e taxas efetivas por país e região')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="table" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="table" className="gap-2">
              <FileText className="h-4 w-4" />
              {t('admin.feasibility.fiscalTable.tableView', 'Tabela Comparativa')}
            </TabsTrigger>
            <TabsTrigger value="cards" className="gap-2">
              <MapPin className="h-4 w-4" />
              {t('admin.feasibility.fiscalTable.detailView', 'Detalhes por País')}
            </TabsTrigger>
          </TabsList>

          {/* TABLE VIEW */}
          <TabsContent value="table">
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">{t('admin.feasibility.fiscalTable.country', 'País')}</TableHead>
                    <TableHead className="font-semibold">{t('admin.feasibility.fiscalTable.region', 'Região')}</TableHead>
                    <TableHead className="text-center font-semibold">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="flex items-center gap-1 mx-auto">
                            <Percent className="h-4 w-4" />
                            {t('admin.feasibility.fiscalTable.baseTax', 'Base')}
                          </TooltipTrigger>
                          <TooltipContent>
                            {t('admin.feasibility.fiscalTable.baseTaxTooltip', 'Taxa corporativa padrão do país')}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead className="text-center font-semibold">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="flex items-center gap-1 mx-auto">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            {t('admin.feasibility.fiscalTable.effective', 'Efetiva')}
                          </TooltipTrigger>
                          <TooltipContent>
                            {t('admin.feasibility.fiscalTable.effectiveTooltip', 'Taxa efetiva após incentivos')}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead className="font-semibold">{t('admin.feasibility.fiscalTable.mainIncentives', 'Principais Incentivos')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {countries.map(([countryKey, countryData]) => (
                    countryData.regions.map((region, regionIndex) => (
                      <TableRow key={`${countryKey}-${region.id}`} className="hover:bg-muted/30">
                        {regionIndex === 0 && (
                          <TableCell 
                            rowSpan={countryData.regions.length} 
                            className="font-medium border-r align-top pt-4"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{countryData.flag}</span>
                              <span>{t(`admin.feasibility.fiscalTable.countryNames.${countryKey}`, countryKey)}</span>
                            </div>
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {t(`admin.feasibility.fiscalTable.regions.${region.nameKey}`, region.nameKey)}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{countryData.corporateTax}%</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant="secondary"
                            className={`${
                              region.effectiveTax < 15 
                                ? 'bg-green-500/20 text-green-700 dark:text-green-400' 
                                : region.effectiveTax < 25 
                                  ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400' 
                                  : 'bg-red-500/20 text-red-700 dark:text-red-400'
                            }`}
                          >
                            {region.effectiveTax}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {region.incentives.slice(0, 3).map((incentive, i) => (
                              <TooltipProvider key={i}>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge variant="outline" className="text-xs">
                                      {getIncentiveTypeName(incentive.type)}: {incentive.value}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="font-medium">{t(`admin.feasibility.fiscalTable.incentiveDesc.${incentive.descKey}`, incentive.descKey)}</p>
                                    <p className="text-xs text-muted-foreground">{incentive.agency}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ))}
                            {region.incentives.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{region.incentives.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>

          {/* CARDS VIEW */}
          <TabsContent value="cards">
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {countries.map(([countryKey, countryData], index) => (
                  <motion.div
                    key={countryKey}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="overflow-hidden">
                      <Collapsible
                        open={selectedCountry === countryKey}
                        onOpenChange={() => setSelectedCountry(selectedCountry === countryKey ? null : countryKey)}
                      >
                        <CollapsibleTrigger className="w-full">
                          <CardHeader className="pb-2 hover:bg-muted/30 transition-colors cursor-pointer">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-3xl">{countryData.flag}</span>
                                <div className="text-left">
                                  <CardTitle className="text-base">
                                    {t(`admin.feasibility.fiscalTable.countryNames.${countryKey}`, countryKey)}
                                  </CardTitle>
                                  <CardDescription className="text-xs">
                                    {countryData.regions.length} {t('admin.feasibility.fiscalTable.regionsAvailable', 'regiões disponíveis')}
                                  </CardDescription>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <div className="text-xs text-muted-foreground">
                                    {t('admin.feasibility.fiscalTable.baseTax', 'Taxa Base')}
                                  </div>
                                  <div className="font-bold">{countryData.corporateTax}%</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs text-muted-foreground">
                                    {t('admin.feasibility.fiscalTable.bestEffective', 'Melhor Efetiva')}
                                  </div>
                                  <div className="font-bold text-green-600">
                                    {Math.min(...countryData.regions.map(r => r.effectiveTax))}%
                                  </div>
                                </div>
                                {selectedCountry === countryKey ? (
                                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                )}
                              </div>
                            </div>
                          </CardHeader>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <CardContent className="pt-0 space-y-3">
                            {countryData.regions.map((region) => (
                              <Card key={region.id} className="bg-muted/30">
                                <Collapsible
                                  open={expandedRegions.includes(region.id)}
                                  onOpenChange={() => toggleRegion(region.id)}
                                >
                                  <CollapsibleTrigger className="w-full">
                                    <CardHeader className="py-3 px-4 hover:bg-muted/50 transition-colors cursor-pointer">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <MapPin className="h-4 w-4 text-primary" />
                                          <span className="font-medium">
                                            {t(`admin.feasibility.fiscalTable.regions.${region.nameKey}`, region.nameKey)}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <Badge 
                                            className={`${
                                              region.effectiveTax < 15 
                                                ? 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30' 
                                                : region.effectiveTax < 25 
                                                  ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30' 
                                                  : 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30'
                                            }`}
                                            variant="outline"
                                          >
                                            {t('admin.feasibility.fiscalTable.effective', 'Efetiva')}: {region.effectiveTax}%
                                          </Badge>
                                          {expandedRegions.includes(region.id) ? (
                                            <ChevronUp className="h-4 w-4" />
                                          ) : (
                                            <ChevronDown className="h-4 w-4" />
                                          )}
                                        </div>
                                      </div>
                                    </CardHeader>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent>
                                    <CardContent className="pt-0 pb-4 px-4 space-y-3">
                                      <div className="grid gap-2">
                                        {region.incentives.map((incentive, i) => (
                                          <div 
                                            key={i}
                                            className="flex items-center justify-between p-2 rounded-lg bg-background/50"
                                          >
                                            <div className="flex items-center gap-2">
                                              <Badge variant="outline" className="min-w-[80px] justify-center">
                                                {getIncentiveTypeName(incentive.type)}
                                              </Badge>
                                              <span className="text-sm text-muted-foreground">
                                                {t(`admin.feasibility.fiscalTable.incentiveDesc.${incentive.descKey}`, incentive.descKey)}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <span className="font-bold text-green-600">{incentive.value}</span>
                                              <Badge variant="secondary" className="text-xs">
                                                {incentive.agency}
                                              </Badge>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                      <div className="flex items-center gap-2 pt-2 border-t">
                                        <Shield className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">
                                          {t('admin.feasibility.fiscalTable.regulations', 'Regulamentações')}:
                                        </span>
                                        <div className="flex flex-wrap gap-1">
                                          {region.regulations.map((reg, i) => (
                                            <Badge key={i} variant="outline" className="text-xs">
                                              {reg}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    </CardContent>
                                  </CollapsibleContent>
                                </Collapsible>
                              </Card>
                            ))}
                          </CardContent>
                        </CollapsibleContent>
                      </Collapsible>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
