// =============================================================================
// INFRASTRUCTURE COST CALCULATOR COMPONENT
// Real engineering costs: Electricity, Water, Labor, Land, Installation
// =============================================================================

import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Factory,
  Zap,
  Droplets,
  Users,
  MapPin,
  Wrench,
  ChevronDown,
  ChevronUp,
  Calculator,
  Info,
  Building2,
  Lightbulb,
  Clock,
  Gauge,
  Ruler,
  Bolt
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  LAND_PLOT_OPTIONS,
  STANDARD_POWER_CONFIGS,
  STAFFING_BY_CAPACITY,
  COUNTRY_INDUSTRIAL_COSTS,
  calculateInfrastructureCosts,
  getCountriesForIndustrialCosts,
  getPlantSizeFromCapacity,
  type InfrastructureCostCalculation
} from '@/lib/industrialCostsByCountry';

interface InfrastructureCostCalculatorProps {
  // Plant configuration
  dailyCapacity: number;
  equipmentCost: number;
  operatingDaysPerMonth?: number;
  // Current values from study
  currentEnergyCost?: number;
  currentLaborCost?: number;
  currentInfrastructureCost?: number;
  currentInstallationCost?: number;
  // Callbacks to update study values
  onCostsCalculated?: (costs: {
    energy_cost: number;
    labor_cost: number;
    infrastructure_cost: number;
    installation_cost: number;
    maintenance_cost: number;
    administrative_cost: number;
    logistics_cost: number;
    working_capital: number;
  }) => void;
  // Selected country from study
  selectedCountry?: string;
}

export function InfrastructureCostCalculator({
  dailyCapacity,
  equipmentCost,
  operatingDaysPerMonth = 26,
  currentEnergyCost,
  currentLaborCost,
  currentInfrastructureCost,
  currentInstallationCost,
  onCostsCalculated,
  selectedCountry: initialCountry
}: InfrastructureCostCalculatorProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string>(initialCountry || 'BR');
  const [selectedLandPlot, setSelectedLandPlot] = useState<string>('medium');
  
  // Custom input values - Energy & Land
  const [customLandArea, setCustomLandArea] = useState<number | null>(null);
  const [customPowerKW, setCustomPowerKW] = useState<number | null>(null);
  const [customUtilization, setCustomUtilization] = useState<number>(65);
  const [customHoursPerDay, setCustomHoursPerDay] = useState<number>(18);
  const [customDaysPerMonth, setCustomDaysPerMonth] = useState<number>(26);

  // Custom input values - Staff count by category
  const [staffDirectors, setStaffDirectors] = useState<number>(2);
  const [staffManagers, setStaffManagers] = useState<number>(4);
  const [staffSupervisors, setStaffSupervisors] = useState<number>(6);
  const [staffOffice, setStaffOffice] = useState<number>(12);
  const [staffFactoryPerShift, setStaffFactoryPerShift] = useState<number>(15);
  const [staffShifts, setStaffShifts] = useState<number>(2);
  const [staffMaintenance, setStaffMaintenance] = useState<number>(6);
  const [staffSecurity, setStaffSecurity] = useState<number>(6);

  // Update country when prop changes
  useEffect(() => {
    if (initialCountry && initialCountry !== selectedCountry) {
      // Map country name to code if needed
      const countries = getCountriesForIndustrialCosts();
      const found = countries.find(c => 
        c.name.toLowerCase() === initialCountry.toLowerCase() || 
        c.code === initialCountry
      );
      if (found) {
        setSelectedCountry(found.code);
      }
    }
  }, [initialCountry]);

  const countries = useMemo(() => getCountriesForIndustrialCosts(), []);
  const plantSize = useMemo(() => getPlantSizeFromCapacity(dailyCapacity), [dailyCapacity]);
  const defaultPowerConfig = STANDARD_POWER_CONFIGS[plantSize];
  const staffing = STAFFING_BY_CAPACITY[plantSize];
  const countryData = COUNTRY_INDUSTRIAL_COSTS[selectedCountry];
  
  // Get land plot with custom area support
  const baseLandPlot = LAND_PLOT_OPTIONS.find(l => l.id === selectedLandPlot) || LAND_PLOT_OPTIONS[1];
  const landPlot = useMemo(() => {
    if (customLandArea && customLandArea > 0) {
      const buildingRatio = baseLandPlot.buildingArea_m2 / baseLandPlot.size_m2;
      return {
        ...baseLandPlot,
        size_m2: customLandArea,
        buildingArea_m2: Math.round(customLandArea * buildingRatio),
        yardArea_m2: Math.round(customLandArea * (1 - buildingRatio))
      };
    }
    return baseLandPlot;
  }, [customLandArea, baseLandPlot]);

  // Get power config with custom values
  const powerConfig = useMemo(() => {
    return {
      installedPower_kW: customPowerKW || defaultPowerConfig.installedPower_kW,
      utilizationRate: customUtilization / 100,
      operatingHours_perDay: customHoursPerDay,
      operatingDays_perMonth: customDaysPerMonth,
      description: customPowerKW ? 'Configuração personalizada' : defaultPowerConfig.description
    };
  }, [customPowerKW, customUtilization, customHoursPerDay, customDaysPerMonth, defaultPowerConfig]);

  // Calculate custom labor costs based on staff inputs
  const customLaborCalculation = useMemo(() => {
    if (!countryData) return null;
    
    // Define salary tiers (multiples of factory worker base)
    const directorSalary = countryData.labor.management_monthly_USD * 2.5; // Director = 2.5x manager
    const managerSalary = countryData.labor.management_monthly_USD;
    const supervisorSalary = countryData.labor.management_monthly_USD * 0.7; // Supervisor = 70% of manager
    const officeSalary = countryData.labor.officeStaff_monthly_USD;
    const factorySalary = countryData.labor.factoryWorker_monthly_USD;
    const maintenanceSalary = countryData.labor.maintenance_monthly_USD;
    const securitySalary = countryData.labor.security_monthly_USD;
    
    // Calculate totals
    const totalFactoryWorkers = staffFactoryPerShift * staffShifts;
    const totalStaff = staffDirectors + staffManagers + staffSupervisors + staffOffice + totalFactoryWorkers + staffMaintenance + staffSecurity;
    
    const directorsPayroll = staffDirectors * directorSalary;
    const managersPayroll = staffManagers * managerSalary;
    const supervisorsPayroll = staffSupervisors * supervisorSalary;
    const officePayroll = staffOffice * officeSalary;
    const factoryPayroll = totalFactoryWorkers * factorySalary;
    const maintenancePayroll = staffMaintenance * maintenanceSalary;
    const securityPayroll = staffSecurity * securitySalary;
    
    const basePayroll = directorsPayroll + managersPayroll + supervisorsPayroll + officePayroll + factoryPayroll + maintenancePayroll + securityPayroll;
    const socialCharges = basePayroll * (countryData.labor.socialCharges_percent / 100);
    const totalMonthlyLabor = basePayroll + socialCharges;
    
    return {
      totalStaff,
      totalFactoryWorkers,
      directorsPayroll,
      managersPayroll,
      supervisorsPayroll,
      officePayroll,
      factoryPayroll,
      maintenancePayroll,
      securityPayroll,
      basePayroll,
      socialCharges,
      totalMonthlyLabor,
      // Salary references for display
      salaries: {
        director: directorSalary,
        manager: managerSalary,
        supervisor: supervisorSalary,
        office: officeSalary,
        factory: factorySalary,
        maintenance: maintenanceSalary,
        security: securitySalary
      }
    };
  }, [countryData, staffDirectors, staffManagers, staffSupervisors, staffOffice, staffFactoryPerShift, staffShifts, staffMaintenance, staffSecurity]);

  // Calculate all costs with custom power config
  const costCalculation = useMemo<InfrastructureCostCalculation | null>(() => {
    try {
      const result = calculateInfrastructureCosts(
        selectedCountry,
        plantSize,
        selectedLandPlot,
        equipmentCost,
        dailyCapacity,
        operatingDaysPerMonth
      );
      
      // Override electricity calculation with custom values
      const monthlyConsumption_kWh = 
        powerConfig.installedPower_kW * 
        powerConfig.utilizationRate * 
        powerConfig.operatingHours_perDay * 
        powerConfig.operatingDays_perMonth;
      
      const monthlyCost_USD = monthlyConsumption_kWh * countryData.electricity.pricePerKWh_USD;
      const demandCost_USD = powerConfig.installedPower_kW * countryData.electricity.demandCharge_perKW_USD;
      const totalMonthlyCost_USD = monthlyCost_USD + demandCost_USD;
      
      // Override land calculation with custom area
      const purchaseCost_USD = landPlot.size_m2 * countryData.land.pricePerM2_industrial_USD;
      const constructionCost_USD = landPlot.buildingArea_m2 * countryData.land.constructionCost_perM2_USD;
      const electricalInstallation_USD = powerConfig.installedPower_kW * countryData.installation.electricalInstallation_perKW_USD;
      
      // Override labor with custom staff calculation
      const customLabor = customLaborCalculation || result.labor;
      const totalLaborCost = customLaborCalculation?.totalMonthlyLabor || result.labor.totalMonthlyLabor_USD;
      
      return {
        ...result,
        electricity: {
          ...result.electricity,
          monthlyConsumption_kWh,
          monthlyCost_USD,
          demandCost_USD,
          totalMonthlyCost_USD,
          costPerTon_USD: totalMonthlyCost_USD / (dailyCapacity * operatingDaysPerMonth)
        },
        land: {
          ...result.land,
          purchaseCost_USD,
          constructionCost_USD,
          totalLandInfra_USD: purchaseCost_USD + constructionCost_USD + countryData.installation.environmentalPermit_USD
        },
        installation: {
          ...result.installation,
          electricalInstallation_USD,
          totalInstallation_USD: electricalInstallation_USD + result.installation.equipmentInstallation_USD
        },
        labor: {
          ...result.labor,
          factoryPayroll_USD: customLaborCalculation?.factoryPayroll || result.labor.factoryPayroll_USD,
          officePayroll_USD: customLaborCalculation?.officePayroll || result.labor.officePayroll_USD,
          managementPayroll_USD: (customLaborCalculation?.directorsPayroll || 0) + (customLaborCalculation?.managersPayroll || 0) + (customLaborCalculation?.supervisorsPayroll || 0) || result.labor.managementPayroll_USD,
          maintenancePayroll_USD: customLaborCalculation?.maintenancePayroll || result.labor.maintenancePayroll_USD,
          securityPayroll_USD: customLaborCalculation?.securityPayroll || result.labor.securityPayroll_USD,
          socialCharges_USD: customLaborCalculation?.socialCharges || result.labor.socialCharges_USD,
          totalMonthlyLabor_USD: totalLaborCost
        },
        totalMonthlyOpex_USD: totalMonthlyCost_USD + result.water.totalMonthlyCost_USD + totalLaborCost,
        annualOpex_USD: (totalMonthlyCost_USD + result.water.totalMonthlyCost_USD + totalLaborCost) * 12,
        totalCapex_USD: purchaseCost_USD + constructionCost_USD + countryData.installation.environmentalPermit_USD + electricalInstallation_USD + result.installation.equipmentInstallation_USD
      };
    } catch {
      return null;
    }
  }, [selectedCountry, plantSize, selectedLandPlot, equipmentCost, dailyCapacity, operatingDaysPerMonth, powerConfig, landPlot, countryData]);

  // Notify parent of calculated costs
  useEffect(() => {
    if (costCalculation && onCostsCalculated && customLaborCalculation) {
      // Calculate administrative cost: office staff payroll from custom labor
      const administrativeCost = customLaborCalculation.officePayroll + 
        (customLaborCalculation.officePayroll * (countryData.labor.socialCharges_percent / 100));
      
      // Calculate logistics cost: based on daily capacity and country
      // Formula: ~$8-15/ton processed for transport + handling
      const logisticsPerTon = selectedCountry === 'BR' ? 10 : 
                              selectedCountry === 'US' ? 15 :
                              selectedCountry === 'CN' ? 6 :
                              selectedCountry === 'DE' ? 18 :
                              selectedCountry === 'AU' ? 14 : 12;
      const logisticsCost = dailyCapacity * operatingDaysPerMonth * logisticsPerTon;
      
      // Maintenance: 5% of equipment cost annually / 12 = monthly
      const maintenanceCost = (equipmentCost * 0.05) / 12;
      
      // Working Capital: 3 months of total OPEX reserve
      const monthlyOpex = costCalculation.electricity.totalMonthlyCost_USD + 
                          costCalculation.labor.totalMonthlyLabor_USD + 
                          maintenanceCost + 
                          logisticsCost + 
                          administrativeCost;
      const workingCapital = monthlyOpex * 3; // 3 months reserve
      
      onCostsCalculated({
        energy_cost: costCalculation.electricity.totalMonthlyCost_USD,
        labor_cost: costCalculation.labor.totalMonthlyLabor_USD,
        infrastructure_cost: costCalculation.land.totalLandInfra_USD,
        installation_cost: costCalculation.installation.totalInstallation_USD,
        maintenance_cost: maintenanceCost,
        administrative_cost: administrativeCost,
        logistics_cost: logisticsCost,
        working_capital: workingCapital
      });
    }
  }, [costCalculation, onCostsCalculated, customLaborCalculation, countryData, selectedCountry, dailyCapacity, operatingDaysPerMonth, equipmentCost]);

  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    if (Math.abs(value) >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
  };

  if (!countryData || !costCalculation) {
    return null;
  }

  return (
    <TooltipProvider>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CollapsibleTrigger asChild>
            <CardHeader className="py-3 cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Factory className="h-4 w-4 text-emerald-600" />
                  {t('admin.feasibility.infrastructure.title', 'Custos de Infraestrutura')}
                  <Badge variant="outline" className="ml-2 text-[10px]">
                    {countryData.flag} {countryData.countryName} • {landPlot.label}
                  </Badge>
                </span>
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </CardTitle>
              <CardDescription className="text-xs">
                {t('admin.feasibility.infrastructure.description', 'Energia, água, mão de obra e instalação com custos reais por país')}
              </CardDescription>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              {/* Country & Land Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Country Selection */}
                <div>
                  <Label className="text-xs flex items-center gap-1 mb-2">
                    <MapPin className="h-3 w-3" />
                    País de Instalação
                  </Label>
                  <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {countries.map(country => (
                        <SelectItem key={country.code} value={country.code}>
                          <div className="flex items-center gap-2">
                            <span>{country.flag}</span>
                            <span>{country.name}</span>
                            <span className="text-[10px] text-muted-foreground">
                              ${country.electricityPrice}/kWh
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Country Quick Facts */}
                  <div className="mt-2 p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded text-[10px]">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-muted-foreground">Energia:</span>
                        <div className="font-bold">${countryData.electricity.pricePerKWh_USD}/kWh</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Água:</span>
                        <div className="font-bold">${countryData.water.pricePerM3_USD}/m³</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Operário:</span>
                        <div className="font-bold">${countryData.labor.factoryWorker_monthly_USD}/mês</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Encargos:</span>
                        <div className="font-bold text-orange-600">{countryData.labor.socialCharges_percent}%</div>
                      </div>
                    </div>
                    <p className="mt-2 text-muted-foreground italic">{countryData.generalNotes}</p>
                  </div>
                </div>

                {/* Land Plot Selection + Custom Input */}
                <div>
                  <Label className="text-xs flex items-center gap-1 mb-2">
                    <Building2 className="h-3 w-3" />
                    Tamanho do Terreno
                  </Label>
                  <Select value={selectedLandPlot} onValueChange={(val) => {
                    setSelectedLandPlot(val);
                    const plot = LAND_PLOT_OPTIONS.find(p => p.id === val);
                    if (plot) setCustomLandArea(plot.size_m2);
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LAND_PLOT_OPTIONS.map(plot => (
                        <SelectItem key={plot.id} value={plot.id}>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{plot.size_m2.toLocaleString()} m²</span>
                            <span className="text-xs text-muted-foreground">({plot.recommendedCapacity})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Custom Land Area Input */}
                  <div className="mt-3 p-3 border border-dashed border-emerald-400 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20">
                    <Label className="text-xs flex items-center gap-1 mb-2">
                      <Ruler className="h-3 w-3 text-emerald-600" />
                      <span className="font-medium text-emerald-700">Área Personalizada (m²)</span>
                    </Label>
                    <Input
                      type="number"
                      min={500}
                      max={50000}
                      value={customLandArea || landPlot.size_m2}
                      onChange={(e) => setCustomLandArea(Number(e.target.value))}
                      className="h-9 text-lg font-bold text-center bg-white dark:bg-gray-900"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Área construída: {formatNumber(landPlot.buildingArea_m2)} m² • Custo: {formatCurrency(landPlot.size_m2 * countryData.land.pricePerM2_industrial_USD)}
                    </p>
                  </div>

                  {/* Land Quick Facts */}
                  <div className="mt-2 p-2 bg-muted/50 rounded text-[10px]">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-muted-foreground">Preço Terreno:</span>
                        <div className="font-bold">${countryData.land.pricePerM2_industrial_USD}/m²</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Construção:</span>
                        <div className="font-bold">${countryData.land.constructionCost_perM2_USD}/m²</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Custom Power Configuration Inputs */}
              <div className="p-4 border-2 border-dashed border-amber-400 rounded-lg bg-amber-50/50 dark:bg-amber-950/20">
                <h5 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Bolt className="h-4 w-4 text-amber-600" />
                  <span className="text-amber-700">Configuração de Energia Personalizada</span>
                </h5>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {/* Installed Power kW */}
                  <div>
                    <Label className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1">
                      <Gauge className="h-3 w-3" />
                      Potência Instalada (kW)
                    </Label>
                    <Input
                      type="number"
                      min={100}
                      max={20000}
                      value={customPowerKW || defaultPowerConfig.installedPower_kW}
                      onChange={(e) => setCustomPowerKW(Number(e.target.value))}
                      className="h-10 text-lg font-bold text-center"
                    />
                    <p className="text-[9px] text-muted-foreground mt-0.5 text-center">
                      Padrão: {formatNumber(defaultPowerConfig.installedPower_kW)} kW
                    </p>
                  </div>

                  {/* Utilization Rate */}
                  <div>
                    <Label className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1">
                      <Zap className="h-3 w-3" />
                      Utilização Real (%)
                    </Label>
                    <Input
                      type="number"
                      min={30}
                      max={100}
                      value={customUtilization}
                      onChange={(e) => setCustomUtilization(Number(e.target.value))}
                      className="h-10 text-lg font-bold text-center"
                    />
                    <p className="text-[9px] text-muted-foreground mt-0.5 text-center">
                      Padrão: 65%
                    </p>
                  </div>

                  {/* Operating Hours */}
                  <div>
                    <Label className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1">
                      <Clock className="h-3 w-3" />
                      Horas/Dia
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      max={24}
                      value={customHoursPerDay}
                      onChange={(e) => setCustomHoursPerDay(Number(e.target.value))}
                      className="h-10 text-lg font-bold text-center"
                    />
                    <p className="text-[9px] text-muted-foreground mt-0.5 text-center">
                      Padrão: 18h
                    </p>
                  </div>

                  {/* Operating Days */}
                  <div>
                    <Label className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1">
                      <Calculator className="h-3 w-3" />
                      Dias/Mês
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      max={31}
                      value={customDaysPerMonth}
                      onChange={(e) => setCustomDaysPerMonth(Number(e.target.value))}
                      className="h-10 text-lg font-bold text-center"
                    />
                    <p className="text-[9px] text-muted-foreground mt-0.5 text-center">
                      Padrão: 26 dias
                    </p>
                  </div>

                  {/* Calculated Monthly Consumption */}
                  <div className="bg-amber-100 dark:bg-amber-900/50 p-2 rounded-lg flex flex-col justify-center">
                    <div className="text-[10px] text-muted-foreground text-center">Consumo Mensal</div>
                    <div className="text-xl font-bold text-amber-700 dark:text-amber-400 text-center">
                      {formatNumber(costCalculation?.electricity.monthlyConsumption_kWh || 0)}
                    </div>
                    <div className="text-[10px] text-muted-foreground text-center">kWh/mês</div>
                  </div>
                </div>

                {/* Formula Display */}
                <div className="mt-3 p-2 bg-white dark:bg-gray-900 rounded text-xs text-center">
                  <span className="text-muted-foreground">Fórmula: </span>
                  <span className="font-mono">
                    {formatNumber(powerConfig.installedPower_kW)} kW × {customUtilization}% × {customHoursPerDay}h × {customDaysPerMonth} dias = 
                  </span>
                  <span className="font-bold text-amber-600 ml-1">
                    {formatNumber(costCalculation?.electricity.monthlyConsumption_kWh || 0)} kWh
                  </span>
                  <span className="text-muted-foreground ml-2">× ${countryData.electricity.pricePerKWh_USD}/kWh = </span>
                  <span className="font-bold text-emerald-600">
                    {formatCurrency(costCalculation?.electricity.totalMonthlyCost_USD || 0)}/mês
                  </span>
                </div>
              </div>

              <Separator />

              {/* Cost Breakdown Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Electricity Costs */}
                <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                  <h5 className="text-xs font-medium mb-2 flex items-center gap-1">
                    <Zap className="h-3 w-3 text-yellow-600" />
                    Energia Elétrica
                  </h5>
                  <div className="space-y-2 text-[10px]">
                    <div className="flex justify-between">
                      <span>Consumo:</span>
                      <span className="font-bold">{formatNumber(costCalculation.electricity.monthlyConsumption_kWh)} kWh/mês</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Custo Energia (${countryData.electricity.pricePerKWh_USD}/kWh):</span>
                      <span className="font-bold">{formatCurrency(costCalculation.electricity.monthlyCost_USD)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Demanda (${countryData.electricity.demandCharge_perKW_USD}/kW):</span>
                      <span className="font-bold">{formatCurrency(costCalculation.electricity.demandCost_USD)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-yellow-700 dark:text-yellow-400">
                      <span className="font-medium">Total Mensal:</span>
                      <span className="font-bold">{formatCurrency(costCalculation.electricity.totalMonthlyCost_USD)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Custo/Tonelada:</span>
                      <span>${costCalculation.electricity.costPerTon_USD.toFixed(2)}/t</span>
                    </div>
                  </div>
                </div>

                {/* Water Costs */}
                <div className="p-3 bg-cyan-50 dark:bg-cyan-950/30 rounded-lg">
                  <h5 className="text-xs font-medium mb-2 flex items-center gap-1">
                    <Droplets className="h-3 w-3 text-cyan-600" />
                    Água Industrial
                  </h5>
                  <div className="space-y-2 text-[10px]">
                    <div className="flex justify-between">
                      <span>Consumo (0.75 m³/t):</span>
                      <span className="font-bold">{formatNumber(costCalculation.water.monthlyConsumption_m3)} m³/mês</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Custo Água (${countryData.water.pricePerM3_USD}/m³):</span>
                      <span className="font-bold">{formatCurrency(costCalculation.water.monthlyCost_USD)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxa Fixa:</span>
                      <span className="font-bold">{formatCurrency(costCalculation.water.fixedFee_USD)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-cyan-700 dark:text-cyan-400">
                      <span className="font-medium">Total Mensal:</span>
                      <span className="font-bold">{formatCurrency(costCalculation.water.totalMonthlyCost_USD)}</span>
                    </div>
                  </div>
                  <p className="mt-2 text-[9px] text-muted-foreground italic">{countryData.water.notes}</p>
                </div>

                {/* Labor Costs - Editable Staff Inputs */}
                <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg col-span-1 md:col-span-2">
                  <h5 className="text-xs font-medium mb-3 flex items-center gap-1">
                    <Users className="h-3 w-3 text-purple-600" />
                    Mão de Obra Personalizada ({customLaborCalculation?.totalStaff || 0} funcionários)
                  </h5>
                  
                  {/* Salary Reference for Selected Country */}
                  <div className="mb-4 p-2 bg-white dark:bg-gray-900 rounded text-[10px]">
                    <div className="font-medium mb-1">💰 Salários Base - {countryData.flag} {countryData.countryName}</div>
                    <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                      <div className="text-center">
                        <div className="text-muted-foreground">Diretor</div>
                        <div className="font-bold text-purple-600">${formatNumber(customLaborCalculation?.salaries.director || 0)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-muted-foreground">Gerente</div>
                        <div className="font-bold text-purple-600">${formatNumber(customLaborCalculation?.salaries.manager || 0)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-muted-foreground">Supervisor</div>
                        <div className="font-bold text-purple-600">${formatNumber(customLaborCalculation?.salaries.supervisor || 0)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-muted-foreground">Escritório</div>
                        <div className="font-bold text-purple-600">${formatNumber(customLaborCalculation?.salaries.office || 0)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-muted-foreground">Operário</div>
                        <div className="font-bold text-purple-600">${formatNumber(customLaborCalculation?.salaries.factory || 0)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-muted-foreground">Manutenção</div>
                        <div className="font-bold text-purple-600">${formatNumber(customLaborCalculation?.salaries.maintenance || 0)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-muted-foreground">Segurança</div>
                        <div className="font-bold text-purple-600">${formatNumber(customLaborCalculation?.salaries.security || 0)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Staff Count Inputs */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {/* Directors */}
                    <div className="p-2 border rounded-lg bg-white dark:bg-gray-900">
                      <Label className="text-[10px] text-muted-foreground">Diretores</Label>
                      <Input
                        type="number"
                        min={0}
                        max={10}
                        value={staffDirectors}
                        onChange={(e) => setStaffDirectors(Number(e.target.value))}
                        className="h-8 text-center font-bold"
                      />
                      <div className="text-[9px] text-right text-muted-foreground mt-1">
                        = {formatCurrency(customLaborCalculation?.directorsPayroll || 0)}
                      </div>
                    </div>

                    {/* Managers */}
                    <div className="p-2 border rounded-lg bg-white dark:bg-gray-900">
                      <Label className="text-[10px] text-muted-foreground">Gerentes</Label>
                      <Input
                        type="number"
                        min={0}
                        max={20}
                        value={staffManagers}
                        onChange={(e) => setStaffManagers(Number(e.target.value))}
                        className="h-8 text-center font-bold"
                      />
                      <div className="text-[9px] text-right text-muted-foreground mt-1">
                        = {formatCurrency(customLaborCalculation?.managersPayroll || 0)}
                      </div>
                    </div>

                    {/* Supervisors */}
                    <div className="p-2 border rounded-lg bg-white dark:bg-gray-900">
                      <Label className="text-[10px] text-muted-foreground">Supervisores</Label>
                      <Input
                        type="number"
                        min={0}
                        max={30}
                        value={staffSupervisors}
                        onChange={(e) => setStaffSupervisors(Number(e.target.value))}
                        className="h-8 text-center font-bold"
                      />
                      <div className="text-[9px] text-right text-muted-foreground mt-1">
                        = {formatCurrency(customLaborCalculation?.supervisorsPayroll || 0)}
                      </div>
                    </div>

                    {/* Office Staff */}
                    <div className="p-2 border rounded-lg bg-white dark:bg-gray-900">
                      <Label className="text-[10px] text-muted-foreground">Escritório</Label>
                      <Input
                        type="number"
                        min={0}
                        max={50}
                        value={staffOffice}
                        onChange={(e) => setStaffOffice(Number(e.target.value))}
                        className="h-8 text-center font-bold"
                      />
                      <div className="text-[9px] text-right text-muted-foreground mt-1">
                        = {formatCurrency(customLaborCalculation?.officePayroll || 0)}
                      </div>
                    </div>

                    {/* Factory Workers per Shift */}
                    <div className="p-2 border rounded-lg bg-white dark:bg-gray-900">
                      <Label className="text-[10px] text-muted-foreground">Operários/Turno</Label>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={staffFactoryPerShift}
                        onChange={(e) => setStaffFactoryPerShift(Number(e.target.value))}
                        className="h-8 text-center font-bold"
                      />
                      <div className="text-[9px] text-right text-muted-foreground mt-1">
                        × {staffShifts} turnos = {customLaborCalculation?.totalFactoryWorkers}
                      </div>
                    </div>

                    {/* Shifts */}
                    <div className="p-2 border rounded-lg bg-white dark:bg-gray-900">
                      <Label className="text-[10px] text-muted-foreground">Nº Turnos</Label>
                      <Input
                        type="number"
                        min={1}
                        max={3}
                        value={staffShifts}
                        onChange={(e) => setStaffShifts(Number(e.target.value))}
                        className="h-8 text-center font-bold"
                      />
                      <div className="text-[9px] text-right text-muted-foreground mt-1">
                        = {formatCurrency(customLaborCalculation?.factoryPayroll || 0)}
                      </div>
                    </div>

                    {/* Maintenance */}
                    <div className="p-2 border rounded-lg bg-white dark:bg-gray-900">
                      <Label className="text-[10px] text-muted-foreground">Manutenção</Label>
                      <Input
                        type="number"
                        min={0}
                        max={30}
                        value={staffMaintenance}
                        onChange={(e) => setStaffMaintenance(Number(e.target.value))}
                        className="h-8 text-center font-bold"
                      />
                      <div className="text-[9px] text-right text-muted-foreground mt-1">
                        = {formatCurrency(customLaborCalculation?.maintenancePayroll || 0)}
                      </div>
                    </div>

                    {/* Security */}
                    <div className="p-2 border rounded-lg bg-white dark:bg-gray-900">
                      <Label className="text-[10px] text-muted-foreground">Segurança</Label>
                      <Input
                        type="number"
                        min={0}
                        max={30}
                        value={staffSecurity}
                        onChange={(e) => setStaffSecurity(Number(e.target.value))}
                        className="h-8 text-center font-bold"
                      />
                      <div className="text-[9px] text-right text-muted-foreground mt-1">
                        = {formatCurrency(customLaborCalculation?.securityPayroll || 0)}
                      </div>
                    </div>
                  </div>

                  {/* Labor Cost Summary */}
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px]">
                      <div>
                        <span className="text-muted-foreground">Folha Base:</span>
                        <div className="font-bold text-lg">{formatCurrency(customLaborCalculation?.basePayroll || 0)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Encargos ({countryData.labor.socialCharges_percent}%):</span>
                        <div className="font-bold text-lg text-orange-600">{formatCurrency(customLaborCalculation?.socialCharges || 0)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total Funcionários:</span>
                        <div className="font-bold text-lg">{customLaborCalculation?.totalStaff || 0}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total Mensal:</span>
                        <div className="font-bold text-xl text-purple-700 dark:text-purple-400">{formatCurrency(customLaborCalculation?.totalMonthlyLabor || 0)}</div>
                      </div>
                    </div>
                  </div>
                  
                  <p className="mt-2 text-[9px] text-muted-foreground italic">{countryData.labor.notes}</p>
                </div>

                {/* Installation & CAPEX */}
                <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-lg">
                  <h5 className="text-xs font-medium mb-2 flex items-center gap-1">
                    <Wrench className="h-3 w-3 text-rose-600" />
                    Instalação & CAPEX
                  </h5>
                  <div className="space-y-2 text-[10px]">
                    <div className="flex justify-between">
                      <span>Terreno ({formatNumber(landPlot.size_m2)} m²):</span>
                      <span className="font-bold">{formatCurrency(costCalculation.land.purchaseCost_USD)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Construção ({formatNumber(landPlot.buildingArea_m2)} m²):</span>
                      <span className="font-bold">{formatCurrency(costCalculation.land.constructionCost_USD)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Licenças Ambientais:</span>
                      <span className="font-bold">{formatCurrency(countryData.installation.environmentalPermit_USD)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Instalação Elétrica ({formatNumber(powerConfig.installedPower_kW)} kW):</span>
                      <span className="font-bold">{formatCurrency(costCalculation.installation.electricalInstallation_USD)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Instalação Equipamentos ({countryData.installation.equipmentInstallation_percent}%):</span>
                      <span className="font-bold">{formatCurrency(costCalculation.installation.equipmentInstallation_USD)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-rose-700 dark:text-rose-400">
                      <span className="font-medium">Total CAPEX:</span>
                      <span className="font-bold">{formatCurrency(costCalculation.totalCapex_USD)}</span>
                    </div>
                  </div>
                  <p className="mt-2 text-[9px] text-muted-foreground italic">{countryData.installation.notes}</p>
                </div>
              </div>

              <Separator />

              {/* Summary Totals */}
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-950/30 dark:to-blue-950/30 rounded-lg">
                <h5 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Resumo de Custos - {countryData.flag} {countryData.countryName}
                </h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
                    <div className="text-[10px] text-muted-foreground">OPEX Mensal</div>
                    <div className="font-bold text-xl text-emerald-600">{formatCurrency(costCalculation.totalMonthlyOpex_USD)}</div>
                    <div className="text-[9px] text-muted-foreground">
                      ${(costCalculation.totalMonthlyOpex_USD / (dailyCapacity * operatingDaysPerMonth)).toFixed(2)}/t
                    </div>
                  </div>
                  <div className="text-center p-3 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
                    <div className="text-[10px] text-muted-foreground">OPEX Anual</div>
                    <div className="font-bold text-xl text-blue-600">{formatCurrency(costCalculation.annualOpex_USD)}</div>
                  </div>
                  <div className="text-center p-3 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
                    <div className="text-[10px] text-muted-foreground">CAPEX Total</div>
                    <div className="font-bold text-xl text-rose-600">{formatCurrency(costCalculation.totalCapex_USD)}</div>
                  </div>
                  <div className="text-center p-3 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
                    <div className="text-[10px] text-muted-foreground">Funcionários</div>
                    <div className="font-bold text-xl text-purple-600">{staffing.totalStaff}</div>
                    <div className="text-[9px] text-muted-foreground">
                      {staffing.shifts_perDay} turnos
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="flex items-start gap-2 text-[10px] text-muted-foreground">
                <Info className="h-3 w-3 mt-0.5 shrink-0" />
                <p>
                  Valores baseados em dados industriais reais de Janeiro 2026. Fontes: IEA, World Bank, 
                  estatísticas nacionais de trabalho, TOPS Engineering. Custos podem variar por região 
                  dentro do país e condições específicas do projeto.
                </p>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </TooltipProvider>
  );
}
