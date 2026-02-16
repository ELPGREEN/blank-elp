// =============================================================================
// GLOBAL TAX DATABASE & INCOTERMS SYSTEM
// January 2026 - Industrial Recycling Products Export/Import
// Sources: WTO Tariff Database, Brazil Receita Federal, EU TARIC, China GACC
// =============================================================================

// Product NCM/HS Codes for tire recycling outputs
export const PRODUCT_HS_CODES = {
  rubber_granules: '4004.00', // Waste, parings and scrap of rubber
  crumb_rubber: '4004.00.10', // Crumb rubber from tire recycling
  steel_wire: '7204.41', // Ferrous waste and scrap - Steel wire
  textile_fiber: '6310.90', // Textile waste (nylon/polyester from tires)
  rcb: '2803.00', // Carbon black (recovered)
  pyrolysis_oil: '2710.19', // Petroleum oils from waste
};

// =============================================================================
// INCOTERMS 2020 - Cost Structure
// =============================================================================
export interface IncotermCosts {
  id: string;
  name: string;
  fullName: string;
  description: string;
  sellerResponsibilities: string[];
  buyerResponsibilities: string[];
  // Cost percentages added to base EXW price
  freightCostPercent: number; // Freight as % of product value
  insuranceCostPercent: number; // Insurance as % of product value
  customsClearanceExport: boolean;
  customsClearanceImport: boolean;
  riskTransferPoint: string;
}

export const INCOTERMS_2020: Record<string, IncotermCosts> = {
  EXW: {
    id: 'EXW',
    name: 'EXW',
    fullName: 'Ex Works',
    description: 'Seller makes goods available at their premises. Minimum obligation for seller.',
    sellerResponsibilities: ['Make goods available at premises', 'Provide commercial invoice'],
    buyerResponsibilities: ['All transport costs', 'Export/Import customs', 'Insurance', 'All risks from pickup'],
    freightCostPercent: 0,
    insuranceCostPercent: 0,
    customsClearanceExport: false,
    customsClearanceImport: false,
    riskTransferPoint: 'Seller premises'
  },
  FCA: {
    id: 'FCA',
    name: 'FCA',
    fullName: 'Free Carrier',
    description: 'Seller delivers goods to carrier or named place. Export customs cleared.',
    sellerResponsibilities: ['Deliver to carrier', 'Export customs clearance', 'Loading on first carrier'],
    buyerResponsibilities: ['Main carriage', 'Import customs', 'Insurance', 'Unloading'],
    freightCostPercent: 2, // Local transport to carrier
    insuranceCostPercent: 0,
    customsClearanceExport: true,
    customsClearanceImport: false,
    riskTransferPoint: 'First carrier premises'
  },
  FOB: {
    id: 'FOB',
    name: 'FOB',
    fullName: 'Free On Board',
    description: 'Seller delivers goods on board the vessel. Risk transfers when goods are on board.',
    sellerResponsibilities: ['Deliver on board vessel', 'Export customs clearance', 'Loading costs'],
    buyerResponsibilities: ['Sea freight', 'Import customs', 'Insurance', 'Unloading'],
    freightCostPercent: 5, // Transport to port + loading
    insuranceCostPercent: 0,
    customsClearanceExport: true,
    customsClearanceImport: false,
    riskTransferPoint: 'On board vessel at port of shipment'
  },
  CFR: {
    id: 'CFR',
    name: 'CFR',
    fullName: 'Cost and Freight',
    description: 'Seller pays freight to destination port. Risk transfers at shipment.',
    sellerResponsibilities: ['Deliver on board', 'Export customs', 'Sea freight to destination'],
    buyerResponsibilities: ['Import customs', 'Insurance', 'Unloading at destination'],
    freightCostPercent: 12, // Sea freight included
    insuranceCostPercent: 0,
    customsClearanceExport: true,
    customsClearanceImport: false,
    riskTransferPoint: 'On board vessel at port of shipment'
  },
  CIF: {
    id: 'CIF',
    name: 'CIF',
    fullName: 'Cost, Insurance and Freight',
    description: 'Seller pays freight and insurance to destination. Most common for maritime trade.',
    sellerResponsibilities: ['Deliver on board', 'Export customs', 'Sea freight', 'Insurance (minimum coverage)'],
    buyerResponsibilities: ['Import customs', 'Unloading at destination'],
    freightCostPercent: 12,
    insuranceCostPercent: 1.5, // Marine cargo insurance
    customsClearanceExport: true,
    customsClearanceImport: false,
    riskTransferPoint: 'On board vessel at port of shipment'
  },
  DAP: {
    id: 'DAP',
    name: 'DAP',
    fullName: 'Delivered at Place',
    description: 'Seller delivers goods ready for unloading at destination. Import not cleared.',
    sellerResponsibilities: ['All transport to destination', 'Export customs', 'Insurance recommended'],
    buyerResponsibilities: ['Import customs clearance', 'Unloading', 'Import duties/taxes'],
    freightCostPercent: 15, // Full transport chain
    insuranceCostPercent: 2,
    customsClearanceExport: true,
    customsClearanceImport: false,
    riskTransferPoint: 'Named place of destination'
  },
  DDP: {
    id: 'DDP',
    name: 'DDP',
    fullName: 'Delivered Duty Paid',
    description: 'Seller bears all costs and risks to final destination. Maximum obligation for seller.',
    sellerResponsibilities: ['All transport', 'Export customs', 'Import customs', 'All duties/taxes', 'Insurance'],
    buyerResponsibilities: ['Unloading at final destination'],
    freightCostPercent: 15,
    insuranceCostPercent: 2,
    customsClearanceExport: true,
    customsClearanceImport: true,
    riskTransferPoint: 'Named place of destination (duties paid)'
  }
};

// =============================================================================
// GLOBAL TAX DATABASE - Import Duties & Taxes by Country
// Sources: WTO, National customs databases (Jan 2026)
// =============================================================================
export interface CountryTaxProfile {
  countryCode: string;
  countryName: string;
  flag: string;
  currency: string;
  exchangeRateToUSD: number; // Local currency per 1 USD
  // Import duties by product (HS code based)
  importDuties: {
    rubber_granules: number; // % of CIF value
    crumb_rubber: number;
    steel_wire: number;
    textile_fiber: number;
    rcb: number;
    pyrolysis_oil: number;
  };
  // Domestic taxes applied on import
  vatRate: number; // VAT/GST/IVA %
  additionalTaxes: {
    name: string;
    rate: number;
    appliesTo: string[];
  }[];
  // Export taxes from origin
  exportTax: number; // Usually 0, but some countries apply
  // Special notes
  freeTradeAgreements: string[];
  recyclingIncentives: string[];
  notes: string;
}

export const COUNTRY_TAX_DATABASE: Record<string, CountryTaxProfile> = {
  // ======================== AMERICAS ========================
  BR: {
    countryCode: 'BR',
    countryName: 'Brasil',
    flag: '🇧🇷',
    currency: 'BRL',
    exchangeRateToUSD: 5.20,
    importDuties: {
      rubber_granules: 10.0,
      crumb_rubber: 10.0,
      steel_wire: 12.0,
      textile_fiber: 18.0,
      rcb: 14.0,
      pyrolysis_oil: 8.0
    },
    vatRate: 0, // ICMS varies by state, calculated separately
    additionalTaxes: [
      { name: 'IPI (Industrial Products Tax)', rate: 5, appliesTo: ['rubber_granules', 'crumb_rubber', 'rcb'] },
      { name: 'PIS/COFINS', rate: 9.25, appliesTo: ['all'] },
      { name: 'ICMS (avg)', rate: 18, appliesTo: ['all'] }
    ],
    exportTax: 0,
    freeTradeAgreements: ['MERCOSUL', 'ALADI', 'ACE 35 (Chile)', 'ACE 58 (Peru)'],
    recyclingIncentives: ['PNRS Credits', 'Reciclanip Partnership', 'Green ICMS (some states)'],
    notes: 'Complex tax system. Simples Nacional may reduce burden for smaller operations.'
  },
  US: {
    countryCode: 'US',
    countryName: 'United States',
    flag: '🇺🇸',
    currency: 'USD',
    exchangeRateToUSD: 1.0,
    importDuties: {
      rubber_granules: 0, // HS 4004 - Free
      crumb_rubber: 0,
      steel_wire: 0, // HS 7204 - Free
      textile_fiber: 4.5,
      rcb: 3.7,
      pyrolysis_oil: 0.5
    },
    vatRate: 0, // No federal VAT, state sales tax at point of sale
    additionalTaxes: [
      { name: 'Harbor Maintenance Fee', rate: 0.125, appliesTo: ['all'] },
      { name: 'Merchandise Processing Fee', rate: 0.3464, appliesTo: ['all'] }
    ],
    exportTax: 0,
    freeTradeAgreements: ['USMCA (Mexico/Canada)', 'CAFTA-DR', 'Chile FTA', 'Peru TPA'],
    recyclingIncentives: ['State recycling credits (varies)', 'EPA Green Economy programs'],
    notes: 'Low import duties for recycled materials. Strong demand for crumb rubber in asphalt.'
  },
  MX: {
    countryCode: 'MX',
    countryName: 'Mexico',
    flag: '🇲🇽',
    currency: 'MXN',
    exchangeRateToUSD: 17.5,
    importDuties: {
      rubber_granules: 15.0, // Standard tariff
      crumb_rubber: 15.0,
      steel_wire: 10.0,
      textile_fiber: 20.0,
      rcb: 10.0,
      pyrolysis_oil: 5.0
    },
    vatRate: 16,
    additionalTaxes: [
      { name: 'DTA (Customs Processing)', rate: 0.8, appliesTo: ['all'] }
    ],
    exportTax: 0,
    freeTradeAgreements: ['USMCA', 'EU FTA', 'Pacific Alliance', 'CPTPP'],
    recyclingIncentives: ['SEMARNAT environmental programs', 'Mining sector tire disposal mandates'],
    notes: 'USMCA origin goods enter duty-free. Large mining sector creates OTR demand.'
  },
  CL: {
    countryCode: 'CL',
    countryName: 'Chile',
    flag: '🇨🇱',
    currency: 'CLP',
    exchangeRateToUSD: 880,
    importDuties: {
      rubber_granules: 6.0, // Uniform 6% tariff
      crumb_rubber: 6.0,
      steel_wire: 6.0,
      textile_fiber: 6.0,
      rcb: 6.0,
      pyrolysis_oil: 6.0
    },
    vatRate: 19,
    additionalTaxes: [],
    exportTax: 0,
    freeTradeAgreements: ['EU FTA', 'US FTA', 'China FTA', 'Pacific Alliance', 'CPTPP', 'Mercosur ACE 35'],
    recyclingIncentives: ['REP Law (Extended Producer Responsibility)', 'Mining sector mandates'],
    notes: 'Largest copper mining country. Strong REP legislation for tires effective 2024.'
  },
  AR: {
    countryCode: 'AR',
    countryName: 'Argentina',
    flag: '🇦🇷',
    currency: 'ARS',
    exchangeRateToUSD: 850,
    importDuties: {
      rubber_granules: 14.0,
      crumb_rubber: 14.0,
      steel_wire: 12.0,
      textile_fiber: 18.0,
      rcb: 14.0,
      pyrolysis_oil: 12.0
    },
    vatRate: 21,
    additionalTaxes: [
      { name: 'Statistical Tax', rate: 3, appliesTo: ['all'] },
      { name: 'Advance VAT', rate: 10.5, appliesTo: ['all'] }
    ],
    exportTax: 0,
    freeTradeAgreements: ['MERCOSUL', 'ALADI'],
    recyclingIncentives: ['Provincial environmental programs'],
    notes: 'High import barriers. MERCOSUL origin goods have preferential treatment.'
  },
  CO: {
    countryCode: 'CO',
    countryName: 'Colombia',
    flag: '🇨🇴',
    currency: 'COP',
    exchangeRateToUSD: 4200,
    importDuties: {
      rubber_granules: 10.0,
      crumb_rubber: 10.0,
      steel_wire: 10.0,
      textile_fiber: 15.0,
      rcb: 10.0,
      pyrolysis_oil: 5.0
    },
    vatRate: 19,
    additionalTaxes: [],
    exportTax: 0,
    freeTradeAgreements: ['Pacific Alliance', 'US FTA', 'EU FTA', 'CAN'],
    recyclingIncentives: ['MinAmbiente recycling programs', 'Green tax incentives'],
    notes: 'Growing recycling sector. Mining industry in Cesar/La Guajira creates OTR demand.'
  },
  PE: {
    countryCode: 'PE',
    countryName: 'Peru',
    flag: '🇵🇪',
    currency: 'PEN',
    exchangeRateToUSD: 3.75,
    importDuties: {
      rubber_granules: 6.0,
      crumb_rubber: 6.0,
      steel_wire: 6.0,
      textile_fiber: 11.0,
      rcb: 6.0,
      pyrolysis_oil: 6.0
    },
    vatRate: 18,
    additionalTaxes: [
      { name: 'Municipal Tax', rate: 2, appliesTo: ['all'] }
    ],
    exportTax: 0,
    freeTradeAgreements: ['Pacific Alliance', 'US TPA', 'EU FTA', 'China FTA', 'MERCOSUR ACE 58'],
    recyclingIncentives: ['MINAM recycling programs', 'Mining sector environmental obligations'],
    notes: 'Major copper/gold mining country. Large OTR tire market in mining regions.'
  },
  CA: {
    countryCode: 'CA',
    countryName: 'Canada',
    flag: '🇨🇦',
    currency: 'CAD',
    exchangeRateToUSD: 1.35,
    importDuties: {
      rubber_granules: 0, // Free under USMCA
      crumb_rubber: 0,
      steel_wire: 0,
      textile_fiber: 6.0,
      rcb: 0,
      pyrolysis_oil: 0
    },
    vatRate: 5, // GST
    additionalTaxes: [
      { name: 'Provincial HST/PST (avg)', rate: 8, appliesTo: ['all'] }
    ],
    exportTax: 0,
    freeTradeAgreements: ['USMCA', 'EU CETA', 'CPTPP', 'Chile FTA'],
    recyclingIncentives: ['Provincial tire stewardship programs', 'Carbon pricing credits'],
    notes: 'Strict environmental standards. Provincial tire recycling programs well-established.'
  },

  // ======================== EUROPE ========================
  DE: {
    countryCode: 'DE',
    countryName: 'Germany',
    flag: '🇩🇪',
    currency: 'EUR',
    exchangeRateToUSD: 0.92,
    importDuties: {
      rubber_granules: 0, // EU tariff - rubber waste free
      crumb_rubber: 0,
      steel_wire: 0, // Ferrous waste exempt
      textile_fiber: 4.0,
      rcb: 2.0,
      pyrolysis_oil: 0
    },
    vatRate: 19,
    additionalTaxes: [],
    exportTax: 0,
    freeTradeAgreements: ['EU Single Market', 'EU-UK TCA', 'EU-Japan EPA', 'EU-Canada CETA'],
    recyclingIncentives: ['Circular Economy Act incentives', 'EPR schemes', 'CO2 pricing benefits'],
    notes: 'Premium market. Genan operates largest tire recycling plant. High quality standards.'
  },
  IT: {
    countryCode: 'IT',
    countryName: 'Italy',
    flag: '🇮🇹',
    currency: 'EUR',
    exchangeRateToUSD: 0.92,
    importDuties: {
      rubber_granules: 0,
      crumb_rubber: 0,
      steel_wire: 0,
      textile_fiber: 4.0,
      rcb: 2.0,
      pyrolysis_oil: 0
    },
    vatRate: 22,
    additionalTaxes: [],
    exportTax: 0,
    freeTradeAgreements: ['EU Single Market', 'EU FTAs'],
    recyclingIncentives: ['Ecopneus system', 'Superbonus for eco-investments'],
    notes: 'Ecopneus manages tire collection. Strong market for rubber in sports surfaces.'
  },
  ES: {
    countryCode: 'ES',
    countryName: 'Spain',
    flag: '🇪🇸',
    currency: 'EUR',
    exchangeRateToUSD: 0.92,
    importDuties: {
      rubber_granules: 0,
      crumb_rubber: 0,
      steel_wire: 0,
      textile_fiber: 4.0,
      rcb: 2.0,
      pyrolysis_oil: 0
    },
    vatRate: 21,
    additionalTaxes: [],
    exportTax: 0,
    freeTradeAgreements: ['EU Single Market', 'EU FTAs'],
    recyclingIncentives: ['SIGNUS system', 'Circular economy incentives'],
    notes: 'SIGNUS is main tire management organization. Mediterranean port access.'
  },
  FR: {
    countryCode: 'FR',
    countryName: 'France',
    flag: '🇫🇷',
    currency: 'EUR',
    exchangeRateToUSD: 0.92,
    importDuties: {
      rubber_granules: 0,
      crumb_rubber: 0,
      steel_wire: 0,
      textile_fiber: 4.0,
      rcb: 2.0,
      pyrolysis_oil: 0
    },
    vatRate: 20,
    additionalTaxes: [],
    exportTax: 0,
    freeTradeAgreements: ['EU Single Market', 'EU FTAs'],
    recyclingIncentives: ['TGAP (Environmental Tax)', 'REP Pneumatiques'],
    notes: 'Aliapur manages tire collection. Strong REP legislation.'
  },
  GB: {
    countryCode: 'GB',
    countryName: 'United Kingdom',
    flag: '🇬🇧',
    currency: 'GBP',
    exchangeRateToUSD: 0.79,
    importDuties: {
      rubber_granules: 0,
      crumb_rubber: 0,
      steel_wire: 0,
      textile_fiber: 6.5,
      rcb: 0,
      pyrolysis_oil: 0
    },
    vatRate: 20,
    additionalTaxes: [],
    exportTax: 0,
    freeTradeAgreements: ['EU-UK TCA', 'Australia FTA', 'Japan CEPA'],
    recyclingIncentives: ['WRAP programs', 'Landfill tax savings'],
    notes: 'Post-Brexit: EU-UK TCA maintains zero tariffs on most recycled materials.'
  },
  PL: {
    countryCode: 'PL',
    countryName: 'Poland',
    flag: '🇵🇱',
    currency: 'PLN',
    exchangeRateToUSD: 4.05,
    importDuties: {
      rubber_granules: 0,
      crumb_rubber: 0,
      steel_wire: 0,
      textile_fiber: 4.0,
      rcb: 2.0,
      pyrolysis_oil: 0
    },
    vatRate: 23,
    additionalTaxes: [],
    exportTax: 0,
    freeTradeAgreements: ['EU Single Market', 'EU FTAs'],
    recyclingIncentives: ['NFOŚiGW environmental fund'],
    notes: 'Growing recycling industry. Competitive labor costs within EU.'
  },

  // ======================== ASIA-PACIFIC ========================
  CN: {
    countryCode: 'CN',
    countryName: 'China',
    flag: '🇨🇳',
    currency: 'CNY',
    exchangeRateToUSD: 7.25,
    importDuties: {
      rubber_granules: 8.0,
      crumb_rubber: 8.0,
      steel_wire: 0, // Encouraged import for steel recycling
      textile_fiber: 10.0,
      rcb: 6.5,
      pyrolysis_oil: 6.0
    },
    vatRate: 13,
    additionalTaxes: [],
    exportTax: 0,
    freeTradeAgreements: ['RCEP', 'ASEAN FTA', 'Pakistan FTA'],
    recyclingIncentives: ['14th Five-Year Plan circular economy', 'Green bond incentives'],
    notes: 'TOPS Recycling operates here. Strict import quality standards for waste materials.'
  },
  AU: {
    countryCode: 'AU',
    countryName: 'Australia',
    flag: '🇦🇺',
    currency: 'AUD',
    exchangeRateToUSD: 1.55,
    importDuties: {
      rubber_granules: 0, // Free for recycled materials
      crumb_rubber: 0,
      steel_wire: 0,
      textile_fiber: 5.0,
      rcb: 0,
      pyrolysis_oil: 0
    },
    vatRate: 10, // GST
    additionalTaxes: [],
    exportTax: 0,
    freeTradeAgreements: ['RCEP', 'CPTPP', 'China-Australia FTA', 'UK FTA'],
    recyclingIncentives: ['Tyre Stewardship Australia (TSA)', 'State-based levies on disposal'],
    notes: 'Large mining sector with OTR demand. Tyrecycle is major processor. TSA certification valued.'
  },
  JP: {
    countryCode: 'JP',
    countryName: 'Japan',
    flag: '🇯🇵',
    currency: 'JPY',
    exchangeRateToUSD: 150,
    importDuties: {
      rubber_granules: 0,
      crumb_rubber: 0,
      steel_wire: 0,
      textile_fiber: 5.8,
      rcb: 3.2,
      pyrolysis_oil: 0
    },
    vatRate: 10, // Consumption tax
    additionalTaxes: [],
    exportTax: 0,
    freeTradeAgreements: ['RCEP', 'CPTPP', 'EU-Japan EPA'],
    recyclingIncentives: ['JATMA recycling system', 'Top Runner program incentives'],
    notes: 'Mature recycling market. High quality standards required.'
  },
  IN: {
    countryCode: 'IN',
    countryName: 'India',
    flag: '🇮🇳',
    currency: 'INR',
    exchangeRateToUSD: 83,
    importDuties: {
      rubber_granules: 25.0, // Protective tariffs
      crumb_rubber: 25.0,
      steel_wire: 15.0,
      textile_fiber: 20.0,
      rcb: 10.0,
      pyrolysis_oil: 10.0
    },
    vatRate: 18, // GST
    additionalTaxes: [
      { name: 'Social Welfare Surcharge', rate: 10, appliesTo: ['all'] } // 10% of BCD
    ],
    exportTax: 0,
    freeTradeAgreements: ['SAFTA', 'ASEAN FTA', 'Singapore CECA'],
    recyclingIncentives: ['EPR rules for tires (2022)', 'Make in India incentives'],
    notes: 'High protective tariffs. Local recycling industry protected. EPR rules expanding.'
  },
  ID: {
    countryCode: 'ID',
    countryName: 'Indonesia',
    flag: '🇮🇩',
    currency: 'IDR',
    exchangeRateToUSD: 15800,
    importDuties: {
      rubber_granules: 5.0,
      crumb_rubber: 5.0,
      steel_wire: 5.0,
      textile_fiber: 10.0,
      rcb: 5.0,
      pyrolysis_oil: 5.0
    },
    vatRate: 11,
    additionalTaxes: [
      { name: 'Income Tax Art. 22', rate: 2.5, appliesTo: ['all'] }
    ],
    exportTax: 0,
    freeTradeAgreements: ['RCEP', 'ASEAN FTA', 'Japan EPA'],
    recyclingIncentives: ['Green industry certification'],
    notes: 'Growing industrial sector. Mining in Kalimantan creates OTR demand.'
  },
  KR: {
    countryCode: 'KR',
    countryName: 'South Korea',
    flag: '🇰🇷',
    currency: 'KRW',
    exchangeRateToUSD: 1350,
    importDuties: {
      rubber_granules: 8.0,
      crumb_rubber: 8.0,
      steel_wire: 0,
      textile_fiber: 8.0,
      rcb: 5.0,
      pyrolysis_oil: 3.0
    },
    vatRate: 10,
    additionalTaxes: [],
    exportTax: 0,
    freeTradeAgreements: ['RCEP', 'Korea-US FTA (KORUS)', 'Korea-EU FTA'],
    recyclingIncentives: ['EPR scheme for tires', 'Green certification benefits'],
    notes: 'Advanced recycling industry. KORUS provides duty-free access from US.'
  },
  TH: {
    countryCode: 'TH',
    countryName: 'Thailand',
    flag: '🇹🇭',
    currency: 'THB',
    exchangeRateToUSD: 35,
    importDuties: {
      rubber_granules: 10.0,
      crumb_rubber: 10.0,
      steel_wire: 5.0,
      textile_fiber: 12.0,
      rcb: 5.0,
      pyrolysis_oil: 5.0
    },
    vatRate: 7,
    additionalTaxes: [],
    exportTax: 0,
    freeTradeAgreements: ['RCEP', 'ASEAN FTA', 'Australia FTA'],
    recyclingIncentives: ['BOI investment incentives', 'EIA certification benefits'],
    notes: 'Major natural rubber producer. Growing tire manufacturing sector.'
  },
  VN: {
    countryCode: 'VN',
    countryName: 'Vietnam',
    flag: '🇻🇳',
    currency: 'VND',
    exchangeRateToUSD: 24500,
    importDuties: {
      rubber_granules: 3.0,
      crumb_rubber: 3.0,
      steel_wire: 0,
      textile_fiber: 12.0,
      rcb: 3.0,
      pyrolysis_oil: 5.0
    },
    vatRate: 10,
    additionalTaxes: [],
    exportTax: 0,
    freeTradeAgreements: ['RCEP', 'CPTPP', 'EU-Vietnam FTA'],
    recyclingIncentives: ['Environmental protection fund', 'FDI incentives for green tech'],
    notes: 'Growing manufacturing base. EU-Vietnam FTA provides preferential access.'
  },
  MY: {
    countryCode: 'MY',
    countryName: 'Malaysia',
    flag: '🇲🇾',
    currency: 'MYR',
    exchangeRateToUSD: 4.75,
    importDuties: {
      rubber_granules: 0,
      crumb_rubber: 0,
      steel_wire: 0,
      textile_fiber: 10.0,
      rcb: 0,
      pyrolysis_oil: 5.0
    },
    vatRate: 0, // SST only on selected items
    additionalTaxes: [
      { name: 'SST (if applicable)', rate: 10, appliesTo: ['textile_fiber'] }
    ],
    exportTax: 0,
    freeTradeAgreements: ['RCEP', 'CPTPP', 'ASEAN FTA'],
    recyclingIncentives: ['Malaysian Green Technology incentives'],
    notes: 'Major natural rubber producer. Palm oil industry creates tire demand.'
  },

  // ======================== AFRICA & MIDDLE EAST ========================
  ZA: {
    countryCode: 'ZA',
    countryName: 'South Africa',
    flag: '🇿🇦',
    currency: 'ZAR',
    exchangeRateToUSD: 18.5,
    importDuties: {
      rubber_granules: 0, // Free for recycled materials
      crumb_rubber: 0,
      steel_wire: 0,
      textile_fiber: 15.0,
      rcb: 0,
      pyrolysis_oil: 5.0
    },
    vatRate: 15,
    additionalTaxes: [],
    exportTax: 0,
    freeTradeAgreements: ['SADC', 'SACU', 'EU EPA', 'AfCFTA'],
    recyclingIncentives: ['REDISA (Recycling and Economic Development)', 'Carbon tax credits'],
    notes: 'Major mining sector. AfCFTA expanding intra-African trade opportunities.'
  },
  AE: {
    countryCode: 'AE',
    countryName: 'United Arab Emirates',
    flag: '🇦🇪',
    currency: 'AED',
    exchangeRateToUSD: 3.67,
    importDuties: {
      rubber_granules: 5.0, // GCC unified tariff
      crumb_rubber: 5.0,
      steel_wire: 5.0,
      textile_fiber: 5.0,
      rcb: 5.0,
      pyrolysis_oil: 5.0
    },
    vatRate: 5,
    additionalTaxes: [],
    exportTax: 0,
    freeTradeAgreements: ['GCC', 'Singapore FTA'],
    recyclingIncentives: ['UAE Green Agenda incentives', 'Free zone benefits'],
    notes: 'Hub for re-export to Africa/Middle East. Free zones offer tax advantages.'
  },
  SA: {
    countryCode: 'SA',
    countryName: 'Saudi Arabia',
    flag: '🇸🇦',
    currency: 'SAR',
    exchangeRateToUSD: 3.75,
    importDuties: {
      rubber_granules: 5.0, // GCC unified tariff
      crumb_rubber: 5.0,
      steel_wire: 5.0,
      textile_fiber: 5.0,
      rcb: 5.0,
      pyrolysis_oil: 5.0
    },
    vatRate: 15,
    additionalTaxes: [],
    exportTax: 0,
    freeTradeAgreements: ['GCC'],
    recyclingIncentives: ['Vision 2030 green initiatives', 'SIRC recycling programs'],
    notes: 'Saudi Investment Recycling Company (SIRC) leading circular economy push.'
  },
  NG: {
    countryCode: 'NG',
    countryName: 'Nigeria',
    flag: '🇳🇬',
    currency: 'NGN',
    exchangeRateToUSD: 1400,
    importDuties: {
      rubber_granules: 20.0,
      crumb_rubber: 20.0,
      steel_wire: 10.0,
      textile_fiber: 20.0,
      rcb: 10.0,
      pyrolysis_oil: 10.0
    },
    vatRate: 7.5,
    additionalTaxes: [
      { name: 'CISS Surcharge', rate: 1, appliesTo: ['all'] }
    ],
    exportTax: 0,
    freeTradeAgreements: ['ECOWAS', 'AfCFTA'],
    recyclingIncentives: ['NESREA environmental programs'],
    notes: 'Large potential market. Infrastructure challenges. AfCFTA opening opportunities.'
  },
  EG: {
    countryCode: 'EG',
    countryName: 'Egypt',
    flag: '🇪🇬',
    currency: 'EGP',
    exchangeRateToUSD: 48,
    importDuties: {
      rubber_granules: 5.0,
      crumb_rubber: 5.0,
      steel_wire: 5.0,
      textile_fiber: 10.0,
      rcb: 5.0,
      pyrolysis_oil: 5.0
    },
    vatRate: 14,
    additionalTaxes: [],
    exportTax: 0,
    freeTradeAgreements: ['COMESA', 'AfCFTA', 'EU Association Agreement', 'Arab League FTA'],
    recyclingIncentives: ['Egypt Vision 2030 green economy incentives'],
    notes: 'Gateway to Africa and Middle East. Growing industrial sector.'
  },
  MA: {
    countryCode: 'MA',
    countryName: 'Morocco',
    flag: '🇲🇦',
    currency: 'MAD',
    exchangeRateToUSD: 10.2,
    importDuties: {
      rubber_granules: 2.5,
      crumb_rubber: 2.5,
      steel_wire: 2.5,
      textile_fiber: 10.0,
      rcb: 2.5,
      pyrolysis_oil: 2.5
    },
    vatRate: 20,
    additionalTaxes: [],
    exportTax: 0,
    freeTradeAgreements: ['EU Association Agreement', 'US FTA', 'AfCFTA'],
    recyclingIncentives: ['Green Morocco Plan incentives'],
    notes: 'Automotive manufacturing hub. Growing tire recycling capacity.'
  }
};

// =============================================================================
// PRICE CALCULATION FUNCTIONS
// =============================================================================

export interface PriceCalculation {
  basePrice: number; // EXW price per ton
  incoterm: string;
  incotermCosts: {
    freight: number;
    insurance: number;
    exportClearance: number;
  };
  cifPrice: number; // Price at destination port (for duty calculation)
  importDuties: {
    customsDuty: number;
    vatAmount: number;
    additionalTaxes: { name: string; amount: number }[];
    totalDuties: number;
  };
  finalPrice: number; // Landed cost in destination country
  marginAnalysis: {
    grossMargin: number;
    effectiveTaxRate: number;
    netRevenuePercent: number;
  };
}

/**
 * Calculate selling price with Incoterms and destination country taxes
 */
export function calculateExportPrice(
  baseEXWPrice: number, // Price per ton EXW
  quantity: number, // Tons
  productType: keyof typeof PRODUCT_HS_CODES,
  incotermId: string,
  destinationCountryCode: string,
  originCountryCode: string = 'BR'
): PriceCalculation {
  const incoterm = INCOTERMS_2020[incotermId];
  const destCountry = COUNTRY_TAX_DATABASE[destinationCountryCode];
  
  if (!incoterm || !destCountry) {
    throw new Error(`Invalid incoterm or country code`);
  }

  const totalEXWValue = baseEXWPrice * quantity;

  // Calculate Incoterm costs
  const freightCost = totalEXWValue * (incoterm.freightCostPercent / 100);
  const insuranceCost = totalEXWValue * (incoterm.insuranceCostPercent / 100);
  const exportClearanceCost = incoterm.customsClearanceExport ? totalEXWValue * 0.005 : 0; // ~0.5% for docs

  // CIF value for customs purposes
  const cifValue = totalEXWValue + freightCost + insuranceCost;

  // Calculate import duties
  const dutyRate = destCountry.importDuties[productType] || 0;
  const customsDuty = cifValue * (dutyRate / 100);

  // Calculate VAT on (CIF + customs duty)
  const vatableAmount = cifValue + customsDuty;
  const vatAmount = vatableAmount * (destCountry.vatRate / 100);

  // Calculate additional taxes
  const additionalTaxes = destCountry.additionalTaxes
    .filter(tax => tax.appliesTo.includes('all') || tax.appliesTo.includes(productType))
    .map(tax => ({
      name: tax.name,
      amount: vatableAmount * (tax.rate / 100)
    }));

  const totalAdditionalTaxes = additionalTaxes.reduce((sum, tax) => sum + tax.amount, 0);
  const totalDuties = customsDuty + vatAmount + totalAdditionalTaxes;

  // Final landed cost depends on Incoterm
  let finalPrice: number;
  if (incotermId === 'DDP') {
    // Seller pays all duties
    finalPrice = totalEXWValue + freightCost + insuranceCost + exportClearanceCost + totalDuties;
  } else {
    // Buyer pays duties (but we calculate total landed cost)
    finalPrice = cifValue + totalDuties;
  }

  // Margin analysis (what seller receives vs final price buyer pays)
  const sellerReceives = incotermId === 'DDP' 
    ? totalEXWValue + freightCost + insuranceCost + exportClearanceCost + totalDuties
    : totalEXWValue + freightCost + insuranceCost + exportClearanceCost;
  
  const effectiveTaxRate = (totalDuties / cifValue) * 100;
  const netRevenuePercent = (totalEXWValue / finalPrice) * 100;

  return {
    basePrice: baseEXWPrice,
    incoterm: incotermId,
    incotermCosts: {
      freight: freightCost,
      insurance: insuranceCost,
      exportClearance: exportClearanceCost
    },
    cifPrice: cifValue,
    importDuties: {
      customsDuty,
      vatAmount,
      additionalTaxes,
      totalDuties
    },
    finalPrice,
    marginAnalysis: {
      grossMargin: sellerReceives - totalEXWValue,
      effectiveTaxRate,
      netRevenuePercent
    }
  };
}

/**
 * Get all countries for destination selection
 */
export function getDestinationCountries(): Array<{
  code: string;
  name: string;
  flag: string;
  region: string;
}> {
  const regions: Record<string, string[]> = {
    'Americas': ['BR', 'US', 'MX', 'CL', 'AR', 'CO', 'PE', 'CA'],
    'Europe': ['DE', 'IT', 'ES', 'FR', 'GB', 'PL'],
    'Asia-Pacific': ['CN', 'AU', 'JP', 'IN', 'ID', 'KR', 'TH', 'VN', 'MY'],
    'Africa & Middle East': ['ZA', 'AE', 'SA', 'NG', 'EG', 'MA']
  };

  const countries: Array<{ code: string; name: string; flag: string; region: string }> = [];
  
  Object.entries(regions).forEach(([region, codes]) => {
    codes.forEach(code => {
      const country = COUNTRY_TAX_DATABASE[code];
      if (country) {
        countries.push({
          code: country.countryCode,
          name: country.countryName,
          flag: country.flag,
          region
        });
      }
    });
  });

  return countries;
}

/**
 * Get tax summary for a country
 */
export function getCountryTaxSummary(countryCode: string) {
  const country = COUNTRY_TAX_DATABASE[countryCode];
  if (!country) return null;

  return {
    ...country,
    averageImportDuty: Object.values(country.importDuties).reduce((a, b) => a + b, 0) / 6,
    totalTaxBurden: country.vatRate + 
      country.additionalTaxes.reduce((sum, tax) => sum + tax.rate, 0)
  };
}

/**
 * Compare prices across multiple destinations
 */
export function compareDestinations(
  baseEXWPrice: number,
  quantity: number,
  productType: keyof typeof PRODUCT_HS_CODES,
  incotermId: string,
  countryCodeslist: string[]
): Array<PriceCalculation & { countryCode: string; countryName: string; flag: string }> {
  return countryCodeslist.map(code => {
    const country = COUNTRY_TAX_DATABASE[code];
    const calculation = calculateExportPrice(baseEXWPrice, quantity, productType, incotermId, code);
    return {
      ...calculation,
      countryCode: code,
      countryName: country?.countryName || code,
      flag: country?.flag || '🏳️'
    };
  });
}
