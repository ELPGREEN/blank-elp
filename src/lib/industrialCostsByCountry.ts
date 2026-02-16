// =============================================================================
// INDUSTRIAL COSTS DATABASE BY COUNTRY
// January 2026 - Real Engineering Data for Tire Recycling Plants
// Sources: IEA, World Bank, National Labor Statistics, Industrial Reports
// =============================================================================

// =============================================================================
// LAND PLOT SIZES - Standard Industrial Configurations
// =============================================================================
export interface LandPlotOption {
  id: string;
  size_m2: number;
  label: string;
  description: string;
  recommendedCapacity: string; // tons/day
  buildingArea_m2: number;
  yardArea_m2: number;
}

export const LAND_PLOT_OPTIONS: LandPlotOption[] = [
  {
    id: 'small',
    size_m2: 2000,
    label: '2,000 m² (Pequeno)',
    description: 'Planta compacta para 50-80 t/dia',
    recommendedCapacity: '50-80 t/day',
    buildingArea_m2: 1200,
    yardArea_m2: 800
  },
  {
    id: 'medium',
    size_m2: 3000,
    label: '3,000 m² (Médio)',
    description: 'Planta padrão para 80-150 t/dia',
    recommendedCapacity: '80-150 t/day',
    buildingArea_m2: 1800,
    yardArea_m2: 1200
  },
  {
    id: 'large',
    size_m2: 5000,
    label: '5,000 m² (Grande)',
    description: 'Planta industrial para 150-250 t/dia',
    recommendedCapacity: '150-250 t/day',
    buildingArea_m2: 3000,
    yardArea_m2: 2000
  },
  {
    id: 'xlarge',
    size_m2: 10000,
    label: '10,000 m² (Extra Grande)',
    description: 'Complexo industrial para 250-400 t/dia',
    recommendedCapacity: '250-400 t/day',
    buildingArea_m2: 6000,
    yardArea_m2: 4000
  }
];

// =============================================================================
// EQUIPMENT POWER SPECIFICATIONS
// Based on TOPS Recycling Engineering Data (Jan 2026)
// =============================================================================
export interface PowerConfiguration {
  installedPower_kW: number;
  utilizationRate: number; // Actual consumption as % of installed
  operatingHours_perDay: number;
  operatingDays_perMonth: number;
  description: string;
}

export const STANDARD_POWER_CONFIGS: Record<string, PowerConfiguration> = {
  // 50-80 t/day plant
  small: {
    installedPower_kW: 1200,
    utilizationRate: 0.65,
    operatingHours_perDay: 16,
    operatingDays_perMonth: 26,
    description: 'Compact line: Shredder + Granulator + Separator'
  },
  // 80-150 t/day plant (Standard TOPS configuration)
  medium: {
    installedPower_kW: 2650,
    utilizationRate: 0.65,
    operatingHours_perDay: 18,
    operatingDays_perMonth: 26,
    description: 'Standard line: Full OTR processing + Granulation + Steel separation'
  },
  // 150-250 t/day plant
  large: {
    installedPower_kW: 4500,
    utilizationRate: 0.65,
    operatingHours_perDay: 20,
    operatingDays_perMonth: 26,
    description: 'Industrial line: Dual shredders + Full processing + Pyrolysis option'
  },
  // 250-400 t/day plant
  xlarge: {
    installedPower_kW: 7500,
    utilizationRate: 0.65,
    operatingHours_perDay: 22,
    operatingDays_perMonth: 28,
    description: 'Large scale: Multiple lines + Full integration'
  }
};

// =============================================================================
// STAFFING REQUIREMENTS
// =============================================================================
export interface StaffingRequirements {
  factoryWorkers_perShift: number;
  shifts_perDay: number;
  officeStaff: number;
  management: number;
  maintenance: number;
  security: number;
  totalStaff: number;
}

export const STAFFING_BY_CAPACITY: Record<string, StaffingRequirements> = {
  small: {
    factoryWorkers_perShift: 10,
    shifts_perDay: 2,
    officeStaff: 8,
    management: 3,
    maintenance: 4,
    security: 4,
    totalStaff: 39
  },
  medium: {
    factoryWorkers_perShift: 15,
    shifts_perDay: 2,
    officeStaff: 12,
    management: 4,
    maintenance: 6,
    security: 6,
    totalStaff: 58
  },
  large: {
    factoryWorkers_perShift: 22,
    shifts_perDay: 3,
    officeStaff: 18,
    management: 6,
    maintenance: 10,
    security: 8,
    totalStaff: 108
  },
  xlarge: {
    factoryWorkers_perShift: 30,
    shifts_perDay: 3,
    officeStaff: 25,
    management: 8,
    maintenance: 15,
    security: 12,
    totalStaff: 150
  }
};

// =============================================================================
// COUNTRY INDUSTRIAL COSTS DATABASE
// Real costs as of January 2026
// =============================================================================
export interface CountryIndustrialCosts {
  countryCode: string;
  countryName: string;
  flag: string;
  currency: string;
  exchangeRate: number; // Local currency per 1 USD
  
  // Energy Costs (Industrial rates)
  electricity: {
    pricePerKWh_USD: number;
    pricePerKWh_local: number;
    demandCharge_perKW_USD: number; // Monthly demand charge
    connectionFee_USD: number; // One-time connection for industrial
    notes: string;
  };
  
  // Water Costs
  water: {
    pricePerM3_USD: number;
    pricePerM3_local: number;
    connectionFee_USD: number;
    monthlyFixedFee_USD: number;
    industrialMultiplier: number; // Some countries charge more for industrial
    notes: string;
  };
  
  // Land & Construction Costs
  land: {
    pricePerM2_industrial_USD: number; // Industrial zone land purchase
    pricePerM2_rent_monthly_USD: number; // Monthly rent per m²
    constructionCost_perM2_USD: number; // Industrial building construction
    notes: string;
  };
  
  // Labor Costs
  labor: {
    factoryWorker_monthly_USD: number;
    officeStaff_monthly_USD: number;
    management_monthly_USD: number;
    maintenance_monthly_USD: number;
    security_monthly_USD: number;
    socialCharges_percent: number; // Employer taxes, benefits, etc.
    notes: string;
  };
  
  // Installation & Permits
  installation: {
    environmentalPermit_USD: number;
    operatingLicense_USD: number;
    constructionPermit_USD: number;
    electricalInstallation_perKW_USD: number;
    equipmentInstallation_percent: number; // % of equipment cost
    notes: string;
  };
  
  // General notes
  generalNotes: string;
}

export const COUNTRY_INDUSTRIAL_COSTS: Record<string, CountryIndustrialCosts> = {
  // ======================== AMERICAS ========================
  BR: {
    countryCode: 'BR',
    countryName: 'Brasil',
    flag: '🇧🇷',
    currency: 'BRL',
    exchangeRate: 5.20,
    electricity: {
      pricePerKWh_USD: 0.12,
      pricePerKWh_local: 0.624,
      demandCharge_perKW_USD: 8.5,
      connectionFee_USD: 25000,
      notes: 'Tarifa industrial (Grupo A). Bandeiras tarifárias podem aumentar 3-6%.'
    },
    water: {
      pricePerM3_USD: 4.20,
      pricePerM3_local: 21.84,
      connectionFee_USD: 3500,
      monthlyFixedFee_USD: 120,
      industrialMultiplier: 1.3,
      notes: 'SABESP/Concessionárias locais. Tarifa industrial.'
    },
    land: {
      pricePerM2_industrial_USD: 85,
      pricePerM2_rent_monthly_USD: 4.5,
      constructionCost_perM2_USD: 450,
      notes: 'Zonas industriais SP/MG. Interior pode ser 40% menor.'
    },
    labor: {
      factoryWorker_monthly_USD: 650,
      officeStaff_monthly_USD: 900,
      management_monthly_USD: 2500,
      maintenance_monthly_USD: 850,
      security_monthly_USD: 600,
      socialCharges_percent: 68,
      notes: 'Inclui 13º, férias, FGTS, INSS patronal, vale transporte/alimentação.'
    },
    installation: {
      environmentalPermit_USD: 45000,
      operatingLicense_USD: 8000,
      constructionPermit_USD: 15000,
      electricalInstallation_perKW_USD: 95,
      equipmentInstallation_percent: 12,
      notes: 'Licenças IBAMA/CETESB. Processo pode levar 6-12 meses.'
    },
    generalNotes: 'Maior mercado LATAM. Incentivos fiscais disponíveis em ZPEs e estados do Nordeste.'
  },
  
  US: {
    countryCode: 'US',
    countryName: 'United States',
    flag: '🇺🇸',
    currency: 'USD',
    exchangeRate: 1.0,
    electricity: {
      pricePerKWh_USD: 0.08,
      pricePerKWh_local: 0.08,
      demandCharge_perKW_USD: 12,
      connectionFee_USD: 35000,
      notes: 'Industrial rate. Varies significantly by state (TX: $0.06, CA: $0.14).'
    },
    water: {
      pricePerM3_USD: 2.80,
      pricePerM3_local: 2.80,
      connectionFee_USD: 5000,
      monthlyFixedFee_USD: 85,
      industrialMultiplier: 1.0,
      notes: 'Municipal water. Industrial rates vary by city.'
    },
    land: {
      pricePerM2_industrial_USD: 120,
      pricePerM2_rent_monthly_USD: 6.5,
      constructionCost_perM2_USD: 850,
      notes: 'Industrial zones. Midwest/South significantly cheaper than coasts.'
    },
    labor: {
      factoryWorker_monthly_USD: 3200,
      officeStaff_monthly_USD: 4500,
      management_monthly_USD: 8500,
      maintenance_monthly_USD: 4000,
      security_monthly_USD: 2800,
      socialCharges_percent: 22,
      notes: 'Includes benefits, 401k match, health insurance contribution.'
    },
    installation: {
      environmentalPermit_USD: 85000,
      operatingLicense_USD: 15000,
      constructionPermit_USD: 25000,
      electricalInstallation_perKW_USD: 150,
      equipmentInstallation_percent: 15,
      notes: 'EPA permits required. State-level requirements vary.'
    },
    generalNotes: 'Largest recycled rubber market. Strong demand for crumb rubber in asphalt.'
  },
  
  MX: {
    countryCode: 'MX',
    countryName: 'Mexico',
    flag: '🇲🇽',
    currency: 'MXN',
    exchangeRate: 17.5,
    electricity: {
      pricePerKWh_USD: 0.095,
      pricePerKWh_local: 1.66,
      demandCharge_perKW_USD: 7,
      connectionFee_USD: 18000,
      notes: 'CFE tarifa industrial (GDMTH). Horario variable.'
    },
    water: {
      pricePerM3_USD: 2.50,
      pricePerM3_local: 43.75,
      connectionFee_USD: 2500,
      monthlyFixedFee_USD: 65,
      industrialMultiplier: 1.2,
      notes: 'Varies by municipality. Some areas face water scarcity.'
    },
    land: {
      pricePerM2_industrial_USD: 55,
      pricePerM2_rent_monthly_USD: 3.2,
      constructionCost_perM2_USD: 380,
      notes: 'Industrial parks (parques industriales). Near border cities higher.'
    },
    labor: {
      factoryWorker_monthly_USD: 550,
      officeStaff_monthly_USD: 750,
      management_monthly_USD: 2200,
      maintenance_monthly_USD: 700,
      security_monthly_USD: 480,
      socialCharges_percent: 35,
      notes: 'Includes IMSS, Infonavit, aguinaldo. Nearshoring driving wages up.'
    },
    installation: {
      environmentalPermit_USD: 35000,
      operatingLicense_USD: 6000,
      constructionPermit_USD: 10000,
      electricalInstallation_perKW_USD: 75,
      equipmentInstallation_percent: 10,
      notes: 'SEMARNAT permits. Industrial parks simplify process.'
    },
    generalNotes: 'USMCA benefits. Large mining sector for OTR tires. Nearshoring hub.'
  },
  
  CL: {
    countryCode: 'CL',
    countryName: 'Chile',
    flag: '🇨🇱',
    currency: 'CLP',
    exchangeRate: 880,
    electricity: {
      pricePerKWh_USD: 0.11,
      pricePerKWh_local: 96.8,
      demandCharge_perKW_USD: 10,
      connectionFee_USD: 22000,
      notes: 'Alta tensión industrial. Solar potential reducing costs.'
    },
    water: {
      pricePerM3_USD: 3.50,
      pricePerM3_local: 3080,
      connectionFee_USD: 4000,
      monthlyFixedFee_USD: 95,
      industrialMultiplier: 1.25,
      notes: 'Water scarcity in north. Mining regions have higher costs.'
    },
    land: {
      pricePerM2_industrial_USD: 75,
      pricePerM2_rent_monthly_USD: 4.0,
      constructionCost_perM2_USD: 520,
      notes: 'Industrial zones near Santiago/Antofagasta. Mining areas premium.'
    },
    labor: {
      factoryWorker_monthly_USD: 900,
      officeStaff_monthly_USD: 1300,
      management_monthly_USD: 3500,
      maintenance_monthly_USD: 1100,
      security_monthly_USD: 750,
      socialCharges_percent: 28,
      notes: 'Includes AFP, health, vacation. Mining wages higher.'
    },
    installation: {
      environmentalPermit_USD: 55000,
      operatingLicense_USD: 10000,
      constructionPermit_USD: 12000,
      electricalInstallation_perKW_USD: 110,
      equipmentInstallation_percent: 13,
      notes: 'SEA (environmental evaluation). REP law compliance required.'
    },
    generalNotes: 'Largest copper producer. REP law mandates tire recycling. Mining OTR market.'
  },
  
  AR: {
    countryCode: 'AR',
    countryName: 'Argentina',
    flag: '🇦🇷',
    currency: 'ARS',
    exchangeRate: 850,
    electricity: {
      pricePerKWh_USD: 0.045,
      pricePerKWh_local: 38.25,
      demandCharge_perKW_USD: 3.5,
      connectionFee_USD: 12000,
      notes: 'Subsidized rates. Subsidy removal may increase 50-100%.'
    },
    water: {
      pricePerM3_USD: 0.80,
      pricePerM3_local: 680,
      connectionFee_USD: 1500,
      monthlyFixedFee_USD: 35,
      industrialMultiplier: 1.1,
      notes: 'Subsidized. AySA Buenos Aires region.'
    },
    land: {
      pricePerM2_industrial_USD: 35,
      pricePerM2_rent_monthly_USD: 2.0,
      constructionCost_perM2_USD: 280,
      notes: 'Industrial zones GBA. Interior significantly cheaper. USD preferred.'
    },
    labor: {
      factoryWorker_monthly_USD: 450,
      officeStaff_monthly_USD: 600,
      management_monthly_USD: 1800,
      maintenance_monthly_USD: 550,
      security_monthly_USD: 400,
      socialCharges_percent: 45,
      notes: 'Convenios colectivos. High union presence. Aguinaldo, SAC.'
    },
    installation: {
      environmentalPermit_USD: 25000,
      operatingLicense_USD: 5000,
      constructionPermit_USD: 8000,
      electricalInstallation_perKW_USD: 55,
      equipmentInstallation_percent: 10,
      notes: 'Provincial environmental agencies. Currency restrictions complicate imports.'
    },
    generalNotes: 'Economic instability. Low costs but currency/import restrictions. MERCOSUR access.'
  },
  
  CO: {
    countryCode: 'CO',
    countryName: 'Colombia',
    flag: '🇨🇴',
    currency: 'COP',
    exchangeRate: 4200,
    electricity: {
      pricePerKWh_USD: 0.14,
      pricePerKWh_local: 588,
      demandCharge_perKW_USD: 9,
      connectionFee_USD: 20000,
      notes: 'Industrial tariff. Hydroelectric base but prices rising.'
    },
    water: {
      pricePerM3_USD: 2.20,
      pricePerM3_local: 9240,
      connectionFee_USD: 2800,
      monthlyFixedFee_USD: 70,
      industrialMultiplier: 1.15,
      notes: 'Empresas públicas. Estrato industrial.'
    },
    land: {
      pricePerM2_industrial_USD: 50,
      pricePerM2_rent_monthly_USD: 3.0,
      constructionCost_perM2_USD: 350,
      notes: 'Zonas francas offer tax benefits. Bogotá/Medellín industrial parks.'
    },
    labor: {
      factoryWorker_monthly_USD: 480,
      officeStaff_monthly_USD: 700,
      management_monthly_USD: 2000,
      maintenance_monthly_USD: 600,
      security_monthly_USD: 420,
      socialCharges_percent: 52,
      notes: 'Includes salud, pensión, ARL, cesantías, prima. High social charges.'
    },
    installation: {
      environmentalPermit_USD: 40000,
      operatingLicense_USD: 7000,
      constructionPermit_USD: 9000,
      electricalInstallation_perKW_USD: 70,
      equipmentInstallation_percent: 11,
      notes: 'ANLA environmental licensing. Zonas francas expedite process.'
    },
    generalNotes: 'Growing economy. Mining in César creates OTR demand. Pacific Alliance member.'
  },
  
  PE: {
    countryCode: 'PE',
    countryName: 'Peru',
    flag: '🇵🇪',
    currency: 'PEN',
    exchangeRate: 3.75,
    electricity: {
      pricePerKWh_USD: 0.09,
      pricePerKWh_local: 0.3375,
      demandCharge_perKW_USD: 7.5,
      connectionFee_USD: 16000,
      notes: 'Tarifa industrial MT. Hydroelectric base.'
    },
    water: {
      pricePerM3_USD: 2.00,
      pricePerM3_local: 7.50,
      connectionFee_USD: 2200,
      monthlyFixedFee_USD: 55,
      industrialMultiplier: 1.2,
      notes: 'SEDAPAL Lima. Mining regions use own sources.'
    },
    land: {
      pricePerM2_industrial_USD: 45,
      pricePerM2_rent_monthly_USD: 2.8,
      constructionCost_perM2_USD: 320,
      notes: 'Parques industriales. Callao/Arequipa industrial zones.'
    },
    labor: {
      factoryWorker_monthly_USD: 400,
      officeStaff_monthly_USD: 580,
      management_monthly_USD: 1700,
      maintenance_monthly_USD: 500,
      security_monthly_USD: 380,
      socialCharges_percent: 40,
      notes: 'EsSalud, ONP/AFP, CTS, gratificaciones. Mining pays premium.'
    },
    installation: {
      environmentalPermit_USD: 30000,
      operatingLicense_USD: 5500,
      constructionPermit_USD: 7000,
      electricalInstallation_perKW_USD: 65,
      equipmentInstallation_percent: 10,
      notes: 'SENACE environmental certification. Mining EIAs more complex.'
    },
    generalNotes: 'Major copper/gold mining. OTR tire demand in mining regions. Stable economy.'
  },
  
  CA: {
    countryCode: 'CA',
    countryName: 'Canada',
    flag: '🇨🇦',
    currency: 'CAD',
    exchangeRate: 1.35,
    electricity: {
      pricePerKWh_USD: 0.085,
      pricePerKWh_local: 0.115,
      demandCharge_perKW_USD: 11,
      connectionFee_USD: 40000,
      notes: 'Industrial rate. Quebec/Manitoba cheapest (hydro). Alberta higher.'
    },
    water: {
      pricePerM3_USD: 2.50,
      pricePerM3_local: 3.38,
      connectionFee_USD: 6000,
      monthlyFixedFee_USD: 90,
      industrialMultiplier: 1.0,
      notes: 'Municipal water. Rates vary significantly by province.'
    },
    land: {
      pricePerM2_industrial_USD: 95,
      pricePerM2_rent_monthly_USD: 5.5,
      constructionCost_perM2_USD: 750,
      notes: 'Industrial parks. Prairie provinces cheaper than GTA/Vancouver.'
    },
    labor: {
      factoryWorker_monthly_USD: 3800,
      officeStaff_monthly_USD: 5000,
      management_monthly_USD: 9000,
      maintenance_monthly_USD: 4500,
      security_monthly_USD: 3200,
      socialCharges_percent: 18,
      notes: 'CPP, EI contributions. Provincial health covered. Strong unions.'
    },
    installation: {
      environmentalPermit_USD: 75000,
      operatingLicense_USD: 12000,
      constructionPermit_USD: 20000,
      electricalInstallation_perKW_USD: 140,
      equipmentInstallation_percent: 14,
      notes: 'Provincial environmental assessments. Federal for large projects.'
    },
    generalNotes: 'USMCA access. Provincial tire stewardship programs well-established.'
  },
  
  // ======================== EUROPE ========================
  DE: {
    countryCode: 'DE',
    countryName: 'Germany',
    flag: '🇩🇪',
    currency: 'EUR',
    exchangeRate: 0.92,
    electricity: {
      pricePerKWh_USD: 0.22,
      pricePerKWh_local: 0.20,
      demandCharge_perKW_USD: 15,
      connectionFee_USD: 55000,
      notes: 'Industrial strompreis. EEG surcharge included. Some exemptions available.'
    },
    water: {
      pricePerM3_USD: 5.50,
      pricePerM3_local: 5.06,
      connectionFee_USD: 8000,
      monthlyFixedFee_USD: 150,
      industrialMultiplier: 1.1,
      notes: 'Includes wastewater (Abwasser). Municipal rates.'
    },
    land: {
      pricePerM2_industrial_USD: 180,
      pricePerM2_rent_monthly_USD: 8.5,
      constructionCost_perM2_USD: 1200,
      notes: 'Gewerbegebiet. East Germany 40% cheaper. Brownfield sites available.'
    },
    labor: {
      factoryWorker_monthly_USD: 4200,
      officeStaff_monthly_USD: 5500,
      management_monthly_USD: 9500,
      maintenance_monthly_USD: 4800,
      security_monthly_USD: 3500,
      socialCharges_percent: 21,
      notes: 'Includes health, pension, unemployment. IG Metall wages if unionized.'
    },
    installation: {
      environmentalPermit_USD: 120000,
      operatingLicense_USD: 25000,
      constructionPermit_USD: 35000,
      electricalInstallation_perKW_USD: 180,
      equipmentInstallation_percent: 16,
      notes: 'BImSchG environmental permit. Thorough but predictable process.'
    },
    generalNotes: 'Premium quality market. Genan operates largest plant. Strict standards but high prices.'
  },
  
  IT: {
    countryCode: 'IT',
    countryName: 'Italy',
    flag: '🇮🇹',
    currency: 'EUR',
    exchangeRate: 0.92,
    electricity: {
      pricePerKWh_USD: 0.26,
      pricePerKWh_local: 0.24,
      demandCharge_perKW_USD: 18,
      connectionFee_USD: 45000,
      notes: 'Highest industrial rates in EU. Energy-intensive exemptions available.'
    },
    water: {
      pricePerM3_USD: 3.80,
      pricePerM3_local: 3.50,
      connectionFee_USD: 5500,
      monthlyFixedFee_USD: 120,
      industrialMultiplier: 1.2,
      notes: 'Municipal utilities. North Italy has better infrastructure.'
    },
    land: {
      pricePerM2_industrial_USD: 140,
      pricePerM2_rent_monthly_USD: 7.0,
      constructionCost_perM2_USD: 900,
      notes: 'Zone industriali. South Italy (Mezzogiorno) has incentives.'
    },
    labor: {
      factoryWorker_monthly_USD: 2800,
      officeStaff_monthly_USD: 3500,
      management_monthly_USD: 7000,
      maintenance_monthly_USD: 3200,
      security_monthly_USD: 2500,
      socialCharges_percent: 32,
      notes: 'INPS contributions. TFR. 13th/14th month. Strong CCNL contracts.'
    },
    installation: {
      environmentalPermit_USD: 95000,
      operatingLicense_USD: 18000,
      constructionPermit_USD: 28000,
      electricalInstallation_perKW_USD: 160,
      equipmentInstallation_percent: 14,
      notes: 'AIA (integrated environmental authorization). Bureaucracy can slow process.'
    },
    generalNotes: 'Ecopneus system for tire collection. Good market for sports surfaces.'
  },
  
  ES: {
    countryCode: 'ES',
    countryName: 'Spain',
    flag: '🇪🇸',
    currency: 'EUR',
    exchangeRate: 0.92,
    electricity: {
      pricePerKWh_USD: 0.18,
      pricePerKWh_local: 0.166,
      demandCharge_perKW_USD: 12,
      connectionFee_USD: 38000,
      notes: 'Industrial tariff 6.1TD. Solar potential for cost reduction.'
    },
    water: {
      pricePerM3_USD: 3.20,
      pricePerM3_local: 2.94,
      connectionFee_USD: 4500,
      monthlyFixedFee_USD: 100,
      industrialMultiplier: 1.15,
      notes: 'Varies by region. Water scarcity in south.'
    },
    land: {
      pricePerM2_industrial_USD: 90,
      pricePerM2_rent_monthly_USD: 5.0,
      constructionCost_perM2_USD: 650,
      notes: 'Polígonos industriales. Good availability in most regions.'
    },
    labor: {
      factoryWorker_monthly_USD: 2200,
      officeStaff_monthly_USD: 2800,
      management_monthly_USD: 5500,
      maintenance_monthly_USD: 2500,
      security_monthly_USD: 2000,
      socialCharges_percent: 30,
      notes: 'Seguridad Social. Convenios colectivos. Pagas extras.'
    },
    installation: {
      environmentalPermit_USD: 70000,
      operatingLicense_USD: 14000,
      constructionPermit_USD: 20000,
      electricalInstallation_perKW_USD: 130,
      equipmentInstallation_percent: 13,
      notes: 'AAI (integrated environmental authorization). Regional variations.'
    },
    generalNotes: 'SIGNUS tire management. Mediterranean ports. Good logistics.'
  },
  
  FR: {
    countryCode: 'FR',
    countryName: 'France',
    flag: '🇫🇷',
    currency: 'EUR',
    exchangeRate: 0.92,
    electricity: {
      pricePerKWh_USD: 0.15,
      pricePerKWh_local: 0.138,
      demandCharge_perKW_USD: 13,
      connectionFee_USD: 42000,
      notes: 'Nuclear base load. TURPE network charges. Competitive industrial rates.'
    },
    water: {
      pricePerM3_USD: 4.80,
      pricePerM3_local: 4.42,
      connectionFee_USD: 6500,
      monthlyFixedFee_USD: 130,
      industrialMultiplier: 1.1,
      notes: 'Includes wastewater. Agences de leau redevances.'
    },
    land: {
      pricePerM2_industrial_USD: 110,
      pricePerM2_rent_monthly_USD: 6.0,
      constructionCost_perM2_USD: 850,
      notes: 'Zones industrielles. Rust belt (Nord) cheaper. Hauts-de-France incentives.'
    },
    labor: {
      factoryWorker_monthly_USD: 3000,
      officeStaff_monthly_USD: 3800,
      management_monthly_USD: 7500,
      maintenance_monthly_USD: 3400,
      security_monthly_USD: 2700,
      socialCharges_percent: 42,
      notes: 'Very high social charges. 35hr week. Strong labor protections.'
    },
    installation: {
      environmentalPermit_USD: 100000,
      operatingLicense_USD: 20000,
      constructionPermit_USD: 30000,
      electricalInstallation_perKW_USD: 155,
      equipmentInstallation_percent: 15,
      notes: 'ICPE (classified installations). Prefecture authorization.'
    },
    generalNotes: 'Aliapur tire collection. Strong REP legislation. High labor costs.'
  },
  
  GB: {
    countryCode: 'GB',
    countryName: 'United Kingdom',
    flag: '🇬🇧',
    currency: 'GBP',
    exchangeRate: 0.79,
    electricity: {
      pricePerKWh_USD: 0.20,
      pricePerKWh_local: 0.158,
      demandCharge_perKW_USD: 14,
      connectionFee_USD: 48000,
      notes: 'Industrial rates. Climate Change Levy for large users.'
    },
    water: {
      pricePerM3_USD: 4.20,
      pricePerM3_local: 3.32,
      connectionFee_USD: 7000,
      monthlyFixedFee_USD: 140,
      industrialMultiplier: 1.0,
      notes: 'Regional water companies. Trade effluent charges apply.'
    },
    land: {
      pricePerM2_industrial_USD: 130,
      pricePerM2_rent_monthly_USD: 7.5,
      constructionCost_perM2_USD: 950,
      notes: 'Industrial estates. Midlands/North cheaper than South East.'
    },
    labor: {
      factoryWorker_monthly_USD: 3300,
      officeStaff_monthly_USD: 4200,
      management_monthly_USD: 8000,
      maintenance_monthly_USD: 3800,
      security_monthly_USD: 2900,
      socialCharges_percent: 15,
      notes: 'NI contributions. Pension auto-enrollment. Apprenticeship levy.'
    },
    installation: {
      environmentalPermit_USD: 90000,
      operatingLicense_USD: 16000,
      constructionPermit_USD: 25000,
      electricalInstallation_perKW_USD: 165,
      equipmentInstallation_percent: 15,
      notes: 'Environment Agency permit. Planning permission local authorities.'
    },
    generalNotes: 'Post-Brexit: new trade agreements. Strong recycling infrastructure.'
  },
  
  PL: {
    countryCode: 'PL',
    countryName: 'Poland',
    flag: '🇵🇱',
    currency: 'PLN',
    exchangeRate: 4.05,
    electricity: {
      pricePerKWh_USD: 0.16,
      pricePerKWh_local: 0.65,
      demandCharge_perKW_USD: 9,
      connectionFee_USD: 28000,
      notes: 'Industrial tariff. Coal transition increasing costs. EU funds available.'
    },
    water: {
      pricePerM3_USD: 2.80,
      pricePerM3_local: 11.34,
      connectionFee_USD: 3500,
      monthlyFixedFee_USD: 75,
      industrialMultiplier: 1.1,
      notes: 'Municipal waterworks. Wastewater included.'
    },
    land: {
      pricePerM2_industrial_USD: 50,
      pricePerM2_rent_monthly_USD: 3.5,
      constructionCost_perM2_USD: 450,
      notes: 'Special Economic Zones offer incentives. Good availability.'
    },
    labor: {
      factoryWorker_monthly_USD: 1400,
      officeStaff_monthly_USD: 1800,
      management_monthly_USD: 4000,
      maintenance_monthly_USD: 1600,
      security_monthly_USD: 1200,
      socialCharges_percent: 20,
      notes: 'ZUS contributions. Lower than Western Europe. Skilled workforce.'
    },
    installation: {
      environmentalPermit_USD: 50000,
      operatingLicense_USD: 10000,
      constructionPermit_USD: 15000,
      electricalInstallation_perKW_USD: 100,
      equipmentInstallation_percent: 12,
      notes: 'RDOŚ environmental decisions. EU compliance required.'
    },
    generalNotes: 'EU funds available. Growing recycling industry. Competitive costs in EU.'
  },
  
  // ======================== ASIA-PACIFIC ========================
  CN: {
    countryCode: 'CN',
    countryName: 'China',
    flag: '🇨🇳',
    currency: 'CNY',
    exchangeRate: 7.25,
    electricity: {
      pricePerKWh_USD: 0.10,
      pricePerKWh_local: 0.725,
      demandCharge_perKW_USD: 6,
      connectionFee_USD: 15000,
      notes: 'Industrial power (大工业). Two-part tariff. Peak/off-peak pricing.'
    },
    water: {
      pricePerM3_USD: 0.85,
      pricePerM3_local: 6.16,
      connectionFee_USD: 2000,
      monthlyFixedFee_USD: 40,
      industrialMultiplier: 1.3,
      notes: 'Municipal + wastewater treatment fee. Varies by city tier.'
    },
    land: {
      pricePerM2_industrial_USD: 45,
      pricePerM2_rent_monthly_USD: 2.5,
      constructionCost_perM2_USD: 280,
      notes: 'Industrial parks. Land use rights (50 years). Interior cheaper.'
    },
    labor: {
      factoryWorker_monthly_USD: 750,
      officeStaff_monthly_USD: 1000,
      management_monthly_USD: 2500,
      maintenance_monthly_USD: 900,
      security_monthly_USD: 600,
      socialCharges_percent: 38,
      notes: 'Five insurances + housing fund. Varies by city. Overtime common.'
    },
    installation: {
      environmentalPermit_USD: 35000,
      operatingLicense_USD: 8000,
      constructionPermit_USD: 12000,
      electricalInstallation_perKW_USD: 55,
      equipmentInstallation_percent: 8,
      notes: 'MEE environmental impact assessment. Local variations. Guanxi helps.'
    },
    generalNotes: 'TOPS operates here. Largest tire recycling capacity. Strict waste import rules.'
  },
  
  AU: {
    countryCode: 'AU',
    countryName: 'Australia',
    flag: '🇦🇺',
    currency: 'AUD',
    exchangeRate: 1.55,
    electricity: {
      pricePerKWh_USD: 0.14,
      pricePerKWh_local: 0.217,
      demandCharge_perKW_USD: 12,
      connectionFee_USD: 42000,
      notes: 'Large industrial tariff. Demand charges significant. Solar potential.'
    },
    water: {
      pricePerM3_USD: 3.50,
      pricePerM3_local: 5.43,
      connectionFee_USD: 5500,
      monthlyFixedFee_USD: 100,
      industrialMultiplier: 1.15,
      notes: 'Water utilities vary by state. Trade waste agreements required.'
    },
    land: {
      pricePerM2_industrial_USD: 110,
      pricePerM2_rent_monthly_USD: 6.5,
      constructionCost_perM2_USD: 800,
      notes: 'Industrial estates. Regional areas cheaper. BCA compliance.'
    },
    labor: {
      factoryWorker_monthly_USD: 4500,
      officeStaff_monthly_USD: 5800,
      management_monthly_USD: 10000,
      maintenance_monthly_USD: 5200,
      security_monthly_USD: 4000,
      socialCharges_percent: 15,
      notes: 'Superannuation 11%. Modern Awards apply. High wages.'
    },
    installation: {
      environmentalPermit_USD: 95000,
      operatingLicense_USD: 18000,
      constructionPermit_USD: 28000,
      electricalInstallation_perKW_USD: 145,
      equipmentInstallation_percent: 14,
      notes: 'EPA licensing (state). EPBC Act for federal. Thorough process.'
    },
    generalNotes: 'Tyrecycle major processor. TSA certification. Mining sector OTR demand.'
  },
  
  JP: {
    countryCode: 'JP',
    countryName: 'Japan',
    flag: '🇯🇵',
    currency: 'JPY',
    exchangeRate: 150,
    electricity: {
      pricePerKWh_USD: 0.19,
      pricePerKWh_local: 28.5,
      demandCharge_perKW_USD: 16,
      connectionFee_USD: 60000,
      notes: 'Industrial high voltage. Peak/off-peak. Post-Fukushima higher costs.'
    },
    water: {
      pricePerM3_USD: 3.80,
      pricePerM3_local: 570,
      connectionFee_USD: 8000,
      monthlyFixedFee_USD: 160,
      industrialMultiplier: 1.0,
      notes: 'Municipal water. Wastewater treatment regulated separately.'
    },
    land: {
      pricePerM2_industrial_USD: 200,
      pricePerM2_rent_monthly_USD: 10.0,
      constructionCost_perM2_USD: 1100,
      notes: 'Limited industrial land. Prefectural industrial parks. Expensive.'
    },
    labor: {
      factoryWorker_monthly_USD: 3500,
      officeStaff_monthly_USD: 4500,
      management_monthly_USD: 8500,
      maintenance_monthly_USD: 4000,
      security_monthly_USD: 3200,
      socialCharges_percent: 16,
      notes: 'Health/pension insurance. Bonus system (2x annual). Lifetime employment culture.'
    },
    installation: {
      environmentalPermit_USD: 130000,
      operatingLicense_USD: 28000,
      constructionPermit_USD: 40000,
      electricalInstallation_perKW_USD: 200,
      equipmentInstallation_percent: 18,
      notes: 'Strict environmental assessments. High quality requirements. Long approval times.'
    },
    generalNotes: 'Mature recycling market. JATMA system. Highest quality standards.'
  },
  
  IN: {
    countryCode: 'IN',
    countryName: 'India',
    flag: '🇮🇳',
    currency: 'INR',
    exchangeRate: 83,
    electricity: {
      pricePerKWh_USD: 0.085,
      pricePerKWh_local: 7.06,
      demandCharge_perKW_USD: 4,
      connectionFee_USD: 12000,
      notes: 'Industrial HT tariff. State variations. Power cuts possible.'
    },
    water: {
      pricePerM3_USD: 0.60,
      pricePerM3_local: 49.8,
      connectionFee_USD: 1500,
      monthlyFixedFee_USD: 30,
      industrialMultiplier: 1.5,
      notes: 'Municipal/industrial board supply. Groundwater common backup.'
    },
    land: {
      pricePerM2_industrial_USD: 30,
      pricePerM2_rent_monthly_USD: 1.8,
      constructionCost_perM2_USD: 220,
      notes: 'SEZs offer benefits. Industrial estates. Gujarat/Maharashtra common.'
    },
    labor: {
      factoryWorker_monthly_USD: 280,
      officeStaff_monthly_USD: 450,
      management_monthly_USD: 1500,
      maintenance_monthly_USD: 380,
      security_monthly_USD: 220,
      socialCharges_percent: 25,
      notes: 'PF, ESI, gratuity. Contract labor common. Regional wage variations.'
    },
    installation: {
      environmentalPermit_USD: 25000,
      operatingLicense_USD: 5000,
      constructionPermit_USD: 8000,
      electricalInstallation_perKW_USD: 45,
      equipmentInstallation_percent: 8,
      notes: 'Environment clearance (CPCB/SPCB). SEZ expedited processing.'
    },
    generalNotes: 'Lowest labor costs. EPR rules expanding. Huge tire market. Infrastructure varies.'
  },
  
  ID: {
    countryCode: 'ID',
    countryName: 'Indonesia',
    flag: '🇮🇩',
    currency: 'IDR',
    exchangeRate: 15800,
    electricity: {
      pricePerKWh_USD: 0.095,
      pricePerKWh_local: 1501,
      demandCharge_perKW_USD: 5.5,
      connectionFee_USD: 14000,
      notes: 'PLN industrial tariff. Peak charges. Java most reliable.'
    },
    water: {
      pricePerM3_USD: 0.90,
      pricePerM3_local: 14220,
      connectionFee_USD: 1800,
      monthlyFixedFee_USD: 45,
      industrialMultiplier: 1.2,
      notes: 'PDAM municipal water. Groundwater permits possible.'
    },
    land: {
      pricePerM2_industrial_USD: 40,
      pricePerM2_rent_monthly_USD: 2.2,
      constructionCost_perM2_USD: 250,
      notes: 'Industrial estates (Kawasan Industri). Java/Sumatra main locations.'
    },
    labor: {
      factoryWorker_monthly_USD: 320,
      officeStaff_monthly_USD: 500,
      management_monthly_USD: 1600,
      maintenance_monthly_USD: 420,
      security_monthly_USD: 280,
      socialCharges_percent: 18,
      notes: 'BPJS (health/employment). UMR minimum wages vary by region.'
    },
    installation: {
      environmentalPermit_USD: 28000,
      operatingLicense_USD: 6000,
      constructionPermit_USD: 9000,
      electricalInstallation_perKW_USD: 50,
      equipmentInstallation_percent: 9,
      notes: 'AMDAL environmental assessment. OSS online licensing helps.'
    },
    generalNotes: 'Growing market. Mining in Kalimantan. Archipelago logistics challenges.'
  },
  
  KR: {
    countryCode: 'KR',
    countryName: 'South Korea',
    flag: '🇰🇷',
    currency: 'KRW',
    exchangeRate: 1350,
    electricity: {
      pricePerKWh_USD: 0.11,
      pricePerKWh_local: 148.5,
      demandCharge_perKW_USD: 10,
      connectionFee_USD: 35000,
      notes: 'KEPCO industrial rate. Competitive pricing. Reliable grid.'
    },
    water: {
      pricePerM3_USD: 1.50,
      pricePerM3_local: 2025,
      connectionFee_USD: 4000,
      monthlyFixedFee_USD: 70,
      industrialMultiplier: 1.1,
      notes: 'K-water or local utilities. Good infrastructure.'
    },
    land: {
      pricePerM2_industrial_USD: 120,
      pricePerM2_rent_monthly_USD: 6.5,
      constructionCost_perM2_USD: 700,
      notes: 'Industrial complexes (단지). Competitive bidding for land.'
    },
    labor: {
      factoryWorker_monthly_USD: 2800,
      officeStaff_monthly_USD: 3600,
      management_monthly_USD: 7000,
      maintenance_monthly_USD: 3200,
      security_monthly_USD: 2400,
      socialCharges_percent: 14,
      notes: 'NPS, NHI, employment insurance. Strong labor unions in manufacturing.'
    },
    installation: {
      environmentalPermit_USD: 70000,
      operatingLicense_USD: 15000,
      constructionPermit_USD: 22000,
      electricalInstallation_perKW_USD: 120,
      equipmentInstallation_percent: 13,
      notes: 'ME environmental impact assessment. Efficient approval process.'
    },
    generalNotes: 'Advanced recycling industry. EPR scheme effective. Tech-savvy workforce.'
  },
  
  TH: {
    countryCode: 'TH',
    countryName: 'Thailand',
    flag: '🇹🇭',
    currency: 'THB',
    exchangeRate: 35,
    electricity: {
      pricePerKWh_USD: 0.12,
      pricePerKWh_local: 4.20,
      demandCharge_perKW_USD: 7,
      connectionFee_USD: 18000,
      notes: 'EGAT/PEA industrial tariff. TOU rates available.'
    },
    water: {
      pricePerM3_USD: 1.10,
      pricePerM3_local: 38.5,
      connectionFee_USD: 2200,
      monthlyFixedFee_USD: 50,
      industrialMultiplier: 1.2,
      notes: 'MWA/PWA utilities. Industrial estates have own supplies.'
    },
    land: {
      pricePerM2_industrial_USD: 55,
      pricePerM2_rent_monthly_USD: 3.0,
      constructionCost_perM2_USD: 320,
      notes: 'Industrial estates (นิคมอุตสาหกรรม). EEC special zone incentives.'
    },
    labor: {
      factoryWorker_monthly_USD: 450,
      officeStaff_monthly_USD: 650,
      management_monthly_USD: 1800,
      maintenance_monthly_USD: 550,
      security_monthly_USD: 380,
      socialCharges_percent: 15,
      notes: 'Social security 5% each side. Provident fund optional.'
    },
    installation: {
      environmentalPermit_USD: 32000,
      operatingLicense_USD: 7000,
      constructionPermit_USD: 10000,
      electricalInstallation_perKW_USD: 60,
      equipmentInstallation_percent: 10,
      notes: 'EIA for large projects. BOI incentives available.'
    },
    generalNotes: 'Major rubber producer. Tire manufacturing hub. BOI incentives for green tech.'
  },
  
  VN: {
    countryCode: 'VN',
    countryName: 'Vietnam',
    flag: '🇻🇳',
    currency: 'VND',
    exchangeRate: 24500,
    electricity: {
      pricePerKWh_USD: 0.08,
      pricePerKWh_local: 1960,
      demandCharge_perKW_USD: 4.5,
      connectionFee_USD: 12000,
      notes: 'EVN industrial rate. Peak/off-peak. Rapidly growing demand.'
    },
    water: {
      pricePerM3_USD: 0.70,
      pricePerM3_local: 17150,
      connectionFee_USD: 1500,
      monthlyFixedFee_USD: 35,
      industrialMultiplier: 1.3,
      notes: 'Provincial water companies. Industrial zones have own treatment.'
    },
    land: {
      pricePerM2_industrial_USD: 85,
      pricePerM2_rent_monthly_USD: 4.0,
      constructionCost_perM2_USD: 280,
      notes: 'Industrial parks (KCN). Land use rights 50 years. Rising prices.'
    },
    labor: {
      factoryWorker_monthly_USD: 350,
      officeStaff_monthly_USD: 520,
      management_monthly_USD: 1500,
      maintenance_monthly_USD: 450,
      security_monthly_USD: 300,
      socialCharges_percent: 24,
      notes: 'Social/health/unemployment insurance. 13th month. Rising wages.'
    },
    installation: {
      environmentalPermit_USD: 22000,
      operatingLicense_USD: 5000,
      constructionPermit_USD: 7000,
      electricalInstallation_perKW_USD: 48,
      equipmentInstallation_percent: 8,
      notes: 'EIA for most industrial. One-stop-shop in industrial zones.'
    },
    generalNotes: 'Growing manufacturing base. EU-Vietnam FTA benefits. Young workforce.'
  },
  
  MY: {
    countryCode: 'MY',
    countryName: 'Malaysia',
    flag: '🇲🇾',
    currency: 'MYR',
    exchangeRate: 4.75,
    electricity: {
      pricePerKWh_USD: 0.095,
      pricePerKWh_local: 0.45,
      demandCharge_perKW_USD: 7.5,
      connectionFee_USD: 20000,
      notes: 'TNB industrial tariff. Peak/off-peak. Subsidized for manufacturing.'
    },
    water: {
      pricePerM3_USD: 0.95,
      pricePerM3_local: 4.51,
      connectionFee_USD: 2500,
      monthlyFixedFee_USD: 55,
      industrialMultiplier: 1.1,
      notes: 'State water authorities. Good infrastructure in Peninsular.'
    },
    land: {
      pricePerM2_industrial_USD: 60,
      pricePerM2_rent_monthly_USD: 3.2,
      constructionCost_perM2_USD: 300,
      notes: 'Free Industrial Zones. Johor/Penang industrial areas.'
    },
    labor: {
      factoryWorker_monthly_USD: 550,
      officeStaff_monthly_USD: 800,
      management_monthly_USD: 2200,
      maintenance_monthly_USD: 700,
      security_monthly_USD: 480,
      socialCharges_percent: 20,
      notes: 'EPF 12%+13%, SOCSO, EIS. Foreign worker levies apply.'
    },
    installation: {
      environmentalPermit_USD: 35000,
      operatingLicense_USD: 8000,
      constructionPermit_USD: 12000,
      electricalInstallation_perKW_USD: 65,
      equipmentInstallation_percent: 10,
      notes: 'DOE environmental assessment. MIDA incentives available.'
    },
    generalNotes: 'Major rubber producer. Palm oil industry. Good logistics infrastructure.'
  },
  
  // ======================== AFRICA & MIDDLE EAST ========================
  ZA: {
    countryCode: 'ZA',
    countryName: 'South Africa',
    flag: '🇿🇦',
    currency: 'ZAR',
    exchangeRate: 18.5,
    electricity: {
      pricePerKWh_USD: 0.095,
      pricePerKWh_local: 1.76,
      demandCharge_perKW_USD: 8,
      connectionFee_USD: 22000,
      notes: 'Eskom industrial tariff. Load shedding risk. Backup needed.'
    },
    water: {
      pricePerM3_USD: 2.20,
      pricePerM3_local: 40.7,
      connectionFee_USD: 3000,
      monthlyFixedFee_USD: 65,
      industrialMultiplier: 1.2,
      notes: 'Municipal supply. Water scarcity in some regions.'
    },
    land: {
      pricePerM2_industrial_USD: 45,
      pricePerM2_rent_monthly_USD: 2.8,
      constructionCost_perM2_USD: 350,
      notes: 'Industrial Development Zones. Gauteng/KZN main areas.'
    },
    labor: {
      factoryWorker_monthly_USD: 650,
      officeStaff_monthly_USD: 950,
      management_monthly_USD: 2800,
      maintenance_monthly_USD: 800,
      security_monthly_USD: 550,
      socialCharges_percent: 12,
      notes: 'UIF, SDL. BBBEE compliance costs. Unions influential.'
    },
    installation: {
      environmentalPermit_USD: 45000,
      operatingLicense_USD: 9000,
      constructionPermit_USD: 14000,
      electricalInstallation_perKW_USD: 75,
      equipmentInstallation_percent: 11,
      notes: 'DFFE environmental authorization. Water use license needed.'
    },
    generalNotes: 'Major mining sector. AfCFTA hub potential. Load shedding risk.'
  },
  
  AE: {
    countryCode: 'AE',
    countryName: 'United Arab Emirates',
    flag: '🇦🇪',
    currency: 'AED',
    exchangeRate: 3.67,
    electricity: {
      pricePerKWh_USD: 0.08,
      pricePerKWh_local: 0.29,
      demandCharge_perKW_USD: 10,
      connectionFee_USD: 30000,
      notes: 'Industrial rate (DEWA/ADDC). Reliable grid. Peak charges.'
    },
    water: {
      pricePerM3_USD: 2.80,
      pricePerM3_local: 10.28,
      connectionFee_USD: 4500,
      monthlyFixedFee_USD: 90,
      industrialMultiplier: 1.0,
      notes: 'Desalinated water. DEWA/ADDC rates.'
    },
    land: {
      pricePerM2_industrial_USD: 70,
      pricePerM2_rent_monthly_USD: 4.5,
      constructionCost_perM2_USD: 550,
      notes: 'Free zones offer benefits. Industrial cities available.'
    },
    labor: {
      factoryWorker_monthly_USD: 800,
      officeStaff_monthly_USD: 1500,
      management_monthly_USD: 4500,
      maintenance_monthly_USD: 1200,
      security_monthly_USD: 750,
      socialCharges_percent: 0,
      notes: 'No income tax. WPS for wages. Visa costs for expats.'
    },
    installation: {
      environmentalPermit_USD: 40000,
      operatingLicense_USD: 12000,
      constructionPermit_USD: 18000,
      electricalInstallation_perKW_USD: 85,
      equipmentInstallation_percent: 12,
      notes: 'MoCC environmental registration. Free zone expedited process.'
    },
    generalNotes: 'Hub for re-export. Free zones offer tax benefits. Modern infrastructure.'
  },
  
  SA: {
    countryCode: 'SA',
    countryName: 'Saudi Arabia',
    flag: '🇸🇦',
    currency: 'SAR',
    exchangeRate: 3.75,
    electricity: {
      pricePerKWh_USD: 0.05,
      pricePerKWh_local: 0.18,
      demandCharge_perKW_USD: 4,
      connectionFee_USD: 20000,
      notes: 'SEC industrial rate. Heavily subsidized. Vision 2030 may change.'
    },
    water: {
      pricePerM3_USD: 0.80,
      pricePerM3_local: 3.0,
      connectionFee_USD: 3000,
      monthlyFixedFee_USD: 50,
      industrialMultiplier: 1.5,
      notes: 'Subsidized. NWC supply. Industrial premium applies.'
    },
    land: {
      pricePerM2_industrial_USD: 25,
      pricePerM2_rent_monthly_USD: 1.5,
      constructionCost_perM2_USD: 400,
      notes: 'Industrial cities (MODON). Very affordable land. Incentives available.'
    },
    labor: {
      factoryWorker_monthly_USD: 700,
      officeStaff_monthly_USD: 1200,
      management_monthly_USD: 4000,
      maintenance_monthly_USD: 1000,
      security_monthly_USD: 650,
      socialCharges_percent: 12,
      notes: 'GOSI contributions. Saudization quotas apply. Expat visa costs.'
    },
    installation: {
      environmentalPermit_USD: 35000,
      operatingLicense_USD: 10000,
      constructionPermit_USD: 15000,
      electricalInstallation_perKW_USD: 70,
      equipmentInstallation_percent: 10,
      notes: 'NCEC environmental registration. MODON streamlined process.'
    },
    generalNotes: 'SIRC pushing circular economy. Vision 2030 green initiatives. Low energy costs.'
  },
  
  NG: {
    countryCode: 'NG',
    countryName: 'Nigeria',
    flag: '🇳🇬',
    currency: 'NGN',
    exchangeRate: 1400,
    electricity: {
      pricePerKWh_USD: 0.15,
      pricePerKWh_local: 210,
      demandCharge_perKW_USD: 5,
      connectionFee_USD: 15000,
      notes: 'Grid unreliable. Diesel generators essential. True cost much higher.'
    },
    water: {
      pricePerM3_USD: 0.50,
      pricePerM3_local: 700,
      connectionFee_USD: 1200,
      monthlyFixedFee_USD: 25,
      industrialMultiplier: 1.0,
      notes: 'Borehole common. Municipal supply unreliable.'
    },
    land: {
      pricePerM2_industrial_USD: 25,
      pricePerM2_rent_monthly_USD: 1.5,
      constructionCost_perM2_USD: 200,
      notes: 'Free trade zones. Lagos/Ogun industrial areas. Land tenure issues.'
    },
    labor: {
      factoryWorker_monthly_USD: 180,
      officeStaff_monthly_USD: 300,
      management_monthly_USD: 1200,
      maintenance_monthly_USD: 250,
      security_monthly_USD: 150,
      socialCharges_percent: 18,
      notes: 'Pension, NHF, NSITF contributions. Security costs high.'
    },
    installation: {
      environmentalPermit_USD: 20000,
      operatingLicense_USD: 5000,
      constructionPermit_USD: 8000,
      electricalInstallation_perKW_USD: 45,
      equipmentInstallation_percent: 8,
      notes: 'NESREA environmental assessment. Generator infrastructure needed.'
    },
    generalNotes: 'Large market but infrastructure challenges. Generator costs significant.'
  },
  
  EG: {
    countryCode: 'EG',
    countryName: 'Egypt',
    flag: '🇪🇬',
    currency: 'EGP',
    exchangeRate: 48,
    electricity: {
      pricePerKWh_USD: 0.065,
      pricePerKWh_local: 3.12,
      demandCharge_perKW_USD: 5,
      connectionFee_USD: 14000,
      notes: 'Industrial tariff. Subsidies reducing. Improving grid.'
    },
    water: {
      pricePerM3_USD: 0.45,
      pricePerM3_local: 21.6,
      connectionFee_USD: 1800,
      monthlyFixedFee_USD: 40,
      industrialMultiplier: 1.3,
      notes: 'Holding company supply. Industrial zones have good supply.'
    },
    land: {
      pricePerM2_industrial_USD: 30,
      pricePerM2_rent_monthly_USD: 1.8,
      constructionCost_perM2_USD: 220,
      notes: 'Industrial zones (10th of Ramadan, 6th October). Government allocation.'
    },
    labor: {
      factoryWorker_monthly_USD: 200,
      officeStaff_monthly_USD: 350,
      management_monthly_USD: 1300,
      maintenance_monthly_USD: 280,
      security_monthly_USD: 170,
      socialCharges_percent: 26,
      notes: 'Social insurance. Minimum wage increases. Young workforce.'
    },
    installation: {
      environmentalPermit_USD: 25000,
      operatingLicense_USD: 6000,
      constructionPermit_USD: 9000,
      electricalInstallation_perKW_USD: 50,
      equipmentInstallation_percent: 9,
      notes: 'EEAA environmental approval. Industrial zones expedited.'
    },
    generalNotes: 'Gateway to Africa/Middle East. Free zone benefits. Growing industrial sector.'
  },
  
  MA: {
    countryCode: 'MA',
    countryName: 'Morocco',
    flag: '🇲🇦',
    currency: 'MAD',
    exchangeRate: 10.2,
    electricity: {
      pricePerKWh_USD: 0.11,
      pricePerKWh_local: 1.12,
      demandCharge_perKW_USD: 8,
      connectionFee_USD: 18000,
      notes: 'ONEE industrial rate. Renewable energy push. Good grid.'
    },
    water: {
      pricePerM3_USD: 1.80,
      pricePerM3_local: 18.36,
      connectionFee_USD: 2800,
      monthlyFixedFee_USD: 55,
      industrialMultiplier: 1.2,
      notes: 'ONEE water. Industrial zones have good supply.'
    },
    land: {
      pricePerM2_industrial_USD: 45,
      pricePerM2_rent_monthly_USD: 2.5,
      constructionCost_perM2_USD: 300,
      notes: 'Industrial zones (Tanger Med, Casablanca). P2I incentives.'
    },
    labor: {
      factoryWorker_monthly_USD: 350,
      officeStaff_monthly_USD: 550,
      management_monthly_USD: 1800,
      maintenance_monthly_USD: 450,
      security_monthly_USD: 300,
      socialCharges_percent: 22,
      notes: 'CNSS/AMO contributions. French/Arabic skills. Young workforce.'
    },
    installation: {
      environmentalPermit_USD: 30000,
      operatingLicense_USD: 7000,
      constructionPermit_USD: 10000,
      electricalInstallation_perKW_USD: 60,
      equipmentInstallation_percent: 10,
      notes: 'Environmental impact study. Streamlined in industrial zones.'
    },
    generalNotes: 'Automotive manufacturing hub. EU proximity. Good infrastructure.'
  }
};

// =============================================================================
// CALCULATION FUNCTIONS
// =============================================================================

export interface InfrastructureCostCalculation {
  // Monthly operating costs
  electricity: {
    monthlyConsumption_kWh: number;
    monthlyCost_USD: number;
    demandCost_USD: number;
    totalMonthlyCost_USD: number;
    costPerTon_USD: number;
  };
  water: {
    monthlyConsumption_m3: number;
    monthlyCost_USD: number;
    fixedFee_USD: number;
    totalMonthlyCost_USD: number;
  };
  labor: {
    factoryPayroll_USD: number;
    officePayroll_USD: number;
    managementPayroll_USD: number;
    maintenancePayroll_USD: number;
    securityPayroll_USD: number;
    socialCharges_USD: number;
    totalMonthlyLabor_USD: number;
  };
  // Capital costs
  land: {
    purchaseCost_USD: number;
    constructionCost_USD: number;
    totalLandInfra_USD: number;
  };
  installation: {
    permits_USD: number;
    electricalInstallation_USD: number;
    equipmentInstallation_USD: number;
    totalInstallation_USD: number;
  };
  // Totals
  totalMonthlyOpex_USD: number;
  totalCapex_USD: number;
  annualOpex_USD: number;
}

/**
 * Calculate infrastructure costs for a given country and plant configuration
 */
export function calculateInfrastructureCosts(
  countryCode: string,
  plantSize: 'small' | 'medium' | 'large' | 'xlarge',
  landPlotId: string,
  equipmentCost_USD: number,
  dailyCapacity_tons: number,
  operatingDays_perMonth: number = 26
): InfrastructureCostCalculation {
  const country = COUNTRY_INDUSTRIAL_COSTS[countryCode];
  const powerConfig = STANDARD_POWER_CONFIGS[plantSize];
  const staffing = STAFFING_BY_CAPACITY[plantSize];
  const landPlot = LAND_PLOT_OPTIONS.find(l => l.id === landPlotId) || LAND_PLOT_OPTIONS[1];

  if (!country) {
    throw new Error(`Country ${countryCode} not found in database`);
  }

  // ==================== ELECTRICITY CALCULATION ====================
  // Formula: Installed Power × Utilization × Hours × Days
  const monthlyConsumption_kWh = 
    powerConfig.installedPower_kW * 
    powerConfig.utilizationRate * 
    powerConfig.operatingHours_perDay * 
    powerConfig.operatingDays_perMonth;

  const electricityEnergyCost = monthlyConsumption_kWh * country.electricity.pricePerKWh_USD;
  const electricityDemandCost = powerConfig.installedPower_kW * country.electricity.demandCharge_perKW_USD;

  const monthlyProductionTons = dailyCapacity_tons * operatingDays_perMonth;
  const electricityCostPerTon = (electricityEnergyCost + electricityDemandCost) / monthlyProductionTons;

  // ==================== WATER CALCULATION ====================
  // Tire recycling uses approximately 0.5-1.0 m³ per ton processed
  const waterConsumption_m3 = monthlyProductionTons * 0.75; // 0.75 m³ per ton
  const waterCost = waterConsumption_m3 * country.water.pricePerM3_USD * country.water.industrialMultiplier;

  // ==================== LABOR CALCULATION ====================
  const factoryPayroll = staffing.factoryWorkers_perShift * staffing.shifts_perDay * country.labor.factoryWorker_monthly_USD;
  const officePayroll = staffing.officeStaff * country.labor.officeStaff_monthly_USD;
  const managementPayroll = staffing.management * country.labor.management_monthly_USD;
  const maintenancePayroll = staffing.maintenance * country.labor.maintenance_monthly_USD;
  const securityPayroll = staffing.security * country.labor.security_monthly_USD;

  const basePayroll = factoryPayroll + officePayroll + managementPayroll + maintenancePayroll + securityPayroll;
  const socialCharges = basePayroll * (country.labor.socialCharges_percent / 100);
  const totalMonthlyLabor = basePayroll + socialCharges;

  // ==================== LAND & CONSTRUCTION ====================
  const landPurchaseCost = landPlot.size_m2 * country.land.pricePerM2_industrial_USD;
  const constructionCost = landPlot.buildingArea_m2 * country.land.constructionCost_perM2_USD;

  // ==================== INSTALLATION & PERMITS ====================
  const permitsTotal = 
    country.installation.environmentalPermit_USD +
    country.installation.operatingLicense_USD +
    country.installation.constructionPermit_USD;

  const electricalInstallation = powerConfig.installedPower_kW * country.installation.electricalInstallation_perKW_USD;
  const equipmentInstallation = equipmentCost_USD * (country.installation.equipmentInstallation_percent / 100);

  // ==================== TOTALS ====================
  const totalMonthlyOpex = 
    electricityEnergyCost + electricityDemandCost +
    waterCost + country.water.monthlyFixedFee_USD +
    totalMonthlyLabor;

  const totalCapex = 
    landPurchaseCost + constructionCost +
    permitsTotal + electricalInstallation + equipmentInstallation +
    country.electricity.connectionFee_USD + country.water.connectionFee_USD;

  return {
    electricity: {
      monthlyConsumption_kWh,
      monthlyCost_USD: electricityEnergyCost,
      demandCost_USD: electricityDemandCost,
      totalMonthlyCost_USD: electricityEnergyCost + electricityDemandCost,
      costPerTon_USD: electricityCostPerTon
    },
    water: {
      monthlyConsumption_m3: waterConsumption_m3,
      monthlyCost_USD: waterCost,
      fixedFee_USD: country.water.monthlyFixedFee_USD,
      totalMonthlyCost_USD: waterCost + country.water.monthlyFixedFee_USD
    },
    labor: {
      factoryPayroll_USD: factoryPayroll,
      officePayroll_USD: officePayroll,
      managementPayroll_USD: managementPayroll,
      maintenancePayroll_USD: maintenancePayroll,
      securityPayroll_USD: securityPayroll,
      socialCharges_USD: socialCharges,
      totalMonthlyLabor_USD: totalMonthlyLabor
    },
    land: {
      purchaseCost_USD: landPurchaseCost,
      constructionCost_USD: constructionCost,
      totalLandInfra_USD: landPurchaseCost + constructionCost
    },
    installation: {
      permits_USD: permitsTotal,
      electricalInstallation_USD: electricalInstallation,
      equipmentInstallation_USD: equipmentInstallation,
      totalInstallation_USD: permitsTotal + electricalInstallation + equipmentInstallation + 
        country.electricity.connectionFee_USD + country.water.connectionFee_USD
    },
    totalMonthlyOpex_USD: totalMonthlyOpex,
    totalCapex_USD: totalCapex,
    annualOpex_USD: totalMonthlyOpex * 12
  };
}

/**
 * Get available countries with their industrial cost summary
 */
export function getCountriesForIndustrialCosts(): Array<{
  code: string;
  name: string;
  flag: string;
  region: string;
  electricityPrice: number;
  laborCost: number;
}> {
  const regions: Record<string, string[]> = {
    'Americas': ['BR', 'US', 'MX', 'CL', 'AR', 'CO', 'PE', 'CA'],
    'Europe': ['DE', 'IT', 'ES', 'FR', 'GB', 'PL'],
    'Asia-Pacific': ['CN', 'AU', 'JP', 'IN', 'ID', 'KR', 'TH', 'VN', 'MY'],
    'Africa & Middle East': ['ZA', 'AE', 'SA', 'NG', 'EG', 'MA']
  };

  const result: Array<{
    code: string;
    name: string;
    flag: string;
    region: string;
    electricityPrice: number;
    laborCost: number;
  }> = [];

  Object.entries(regions).forEach(([region, codes]) => {
    codes.forEach(code => {
      const country = COUNTRY_INDUSTRIAL_COSTS[code];
      if (country) {
        result.push({
          code: country.countryCode,
          name: country.countryName,
          flag: country.flag,
          region,
          electricityPrice: country.electricity.pricePerKWh_USD,
          laborCost: country.labor.factoryWorker_monthly_USD
        });
      }
    });
  });

  return result;
}

/**
 * Get plant size based on daily capacity
 */
export function getPlantSizeFromCapacity(dailyCapacity: number): 'small' | 'medium' | 'large' | 'xlarge' {
  if (dailyCapacity <= 80) return 'small';
  if (dailyCapacity <= 150) return 'medium';
  if (dailyCapacity <= 250) return 'large';
  return 'xlarge';
}
