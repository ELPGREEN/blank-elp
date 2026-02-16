import { useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AreaChart,
  Area,
  LineChart as RechartsLineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ComposedChart
} from 'recharts';

interface FeasibilityStudy {
  id?: string;
  study_name: string;
  daily_capacity_tons: number;
  operating_days_per_year: number;
  utilization_rate: number;
  equipment_cost: number;
  installation_cost: number;
  infrastructure_cost: number;
  working_capital: number;
  other_capex: number;
  raw_material_cost: number;
  labor_cost: number;
  energy_cost: number;
  maintenance_cost: number;
  logistics_cost: number;
  administrative_cost: number;
  other_opex: number;
  rubber_granules_price: number;
  rubber_granules_yield: number;
  steel_wire_price: number;
  steel_wire_yield: number;
  textile_fiber_price: number;
  textile_fiber_yield: number;
  rcb_price: number; // Recovered Carbon Black - Jan 2026 market: $800-1200/ton
  rcb_yield: number; // rCB yield percentage - typically 10-15%
  tax_rate: number;
  depreciation_years: number;
  discount_rate: number;
  total_investment: number;
  annual_revenue: number;
  annual_opex: number;
  annual_ebitda: number;
  payback_months: number;
  roi_percentage: number;
  npv_10_years: number;
  irr_percentage: number;
  country?: string;
}

interface FeasibilityPDFChartsProps {
  study: Partial<FeasibilityStudy>;
}

export interface FeasibilityPDFChartsHandle {
  cashFlowRef: React.RefObject<HTMLDivElement>;
  revenueRef: React.RefObject<HTMLDivElement>;
  opexRef: React.RefObject<HTMLDivElement>;
  sensitivityRef: React.RefObject<HTMLDivElement>;
  esgRadarRef: React.RefObject<HTMLDivElement>;
  heatmapRef: React.RefObject<HTMLDivElement>;
  capexRef: React.RefObject<HTMLDivElement>;
}

// High contrast colors for better PDF legibility
const COLORS = ['#0d47a1', '#00897b', '#e65100', '#6a1b9a', '#c62828', '#00838f'];
const ESG_COLORS = ['#00897b', '#1565c0', '#7b1fa2'];

export const FeasibilityPDFCharts = forwardRef<FeasibilityPDFChartsHandle, FeasibilityPDFChartsProps>(
  ({ study }, ref) => {
    const { t } = useTranslation();
    
    const cashFlowRef = useRef<HTMLDivElement>(null);
    const revenueRef = useRef<HTMLDivElement>(null);
    const opexRef = useRef<HTMLDivElement>(null);
    const sensitivityRef = useRef<HTMLDivElement>(null);
    const esgRadarRef = useRef<HTMLDivElement>(null);
    const heatmapRef = useRef<HTMLDivElement>(null);
    const capexRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      cashFlowRef,
      revenueRef,
      opexRef,
      sensitivityRef,
      esgRadarRef,
      heatmapRef,
      capexRef
    }));

    // Calculate base financials
    const baseCalculations = useMemo(() => {
      const dailyCapacity = study.daily_capacity_tons || 85;
      const operatingDays = study.operating_days_per_year || 300;
      const utilization = (study.utilization_rate || 85) / 100;
      const annualTonnage = dailyCapacity * operatingDays * utilization;

      const totalInvestment = 
        (study.equipment_cost || 0) +
        (study.installation_cost || 0) +
        (study.infrastructure_cost || 0) +
        (study.working_capital || 0) +
        (study.other_capex || 0);

      // Revenue calculation - JANUARY 2026 MARKET PRICES (VALIDATED from multiple sources)
      // CRITICAL: Steel price for RECOVERED tire wire is $150-350/ton, NOT virgin steel
      const revenueGranules = annualTonnage * ((study.rubber_granules_yield || 43) / 100) * (study.rubber_granules_price || 250);
      const revenueSteel = annualTonnage * ((study.steel_wire_yield || 25) / 100) * (study.steel_wire_price || 250);
      const revenueFiber = annualTonnage * ((study.textile_fiber_yield || 8) / 100) * (study.textile_fiber_price || 120);
      const revenueRCB = annualTonnage * ((study.rcb_yield || 12) / 100) * (study.rcb_price || 1050);
      const annualRevenue = revenueGranules + revenueSteel + revenueFiber + revenueRCB;

      const monthlyOpex = 
        (study.raw_material_cost || 0) +
        (study.labor_cost || 0) +
        (study.energy_cost || 0) +
        (study.maintenance_cost || 0) +
        (study.logistics_cost || 0) +
        (study.administrative_cost || 0) +
        (study.other_opex || 0);
      const annualOpex = monthlyOpex * 12;

      const annualEbitda = annualRevenue - annualOpex;
      const annualDepreciation = totalInvestment / (study.depreciation_years || 10);
      const taxableIncome = annualEbitda - annualDepreciation;
      const taxes = Math.max(0, taxableIncome * ((study.tax_rate || 25) / 100));
      const netProfit = annualEbitda - taxes;
      
      // CO2 calculations
      const co2Factor = 1.5;
      const co2Avoided = annualTonnage * co2Factor;

      return {
        annualTonnage,
        totalInvestment,
        annualRevenue,
        annualOpex,
        annualEbitda,
        netProfit,
        revenueGranules,
        revenueSteel,
        revenueFiber,
        revenueRCB,
        co2Avoided
      };
    }, [study]);

    // 10-year cash flow projection with inflation and growth adjustments
    const cashFlowData = useMemo(() => {
      const { totalInvestment, annualRevenue, annualOpex, annualEbitda } = baseCalculations;
      const inflationRate = 0.03; // 3% annual inflation
      const revenueGrowth = 0.02; // 2% annual revenue growth
      const taxRate = (study.tax_rate || 25) / 100;
      const depreciationYears = study.depreciation_years || 10;
      const annualDepreciation = totalInvestment / depreciationYears;
      
      const data: { year: string; cashFlow: number; cumulativeCashFlow: number; netProfit: number; breakeven: number }[] = [];
      let cumulativeCashFlow = -totalInvestment;

      for (let year = 0; year <= 10; year++) {
        if (year === 0) {
          data.push({
            year: `Y${year}`,
            cashFlow: -totalInvestment,
            cumulativeCashFlow: cumulativeCashFlow,
            netProfit: 0,
            breakeven: 0
          });
        } else {
          // Revenue grows with market, OPEX grows with inflation
          const yearRevenue = annualRevenue * Math.pow(1 + revenueGrowth, year);
          const yearOpex = annualOpex * Math.pow(1 + inflationRate, year);
          const yearEbitda = yearRevenue - yearOpex;
          
          // Depreciation only during depreciation period
          const yearDepreciation = year <= depreciationYears ? annualDepreciation : 0;
          const taxableIncome = yearEbitda - yearDepreciation;
          const yearTaxes = Math.max(0, taxableIncome * taxRate);
          const yearNetProfit = yearEbitda - yearTaxes;
          
          cumulativeCashFlow += yearNetProfit;
          data.push({
            year: `Y${year}`,
            cashFlow: yearNetProfit,
            cumulativeCashFlow: cumulativeCashFlow,
            netProfit: yearNetProfit,
            breakeven: 0
          });
        }
      }
      return data;
    }, [baseCalculations, study.tax_rate, study.depreciation_years]);

    // Revenue breakdown - including rCB
    const revenueBreakdownData = useMemo(() => {
      const { revenueGranules, revenueSteel, revenueFiber, revenueRCB } = baseCalculations;
      const total = revenueGranules + revenueSteel + revenueFiber + revenueRCB;
      return [
        { name: 'Rubber', value: revenueGranules, percent: ((revenueGranules / total) * 100).toFixed(1) },
        { name: 'Steel', value: revenueSteel, percent: ((revenueSteel / total) * 100).toFixed(1) },
        { name: 'Fiber', value: revenueFiber, percent: ((revenueFiber / total) * 100).toFixed(1) },
        { name: 'rCB', value: revenueRCB, percent: ((revenueRCB / total) * 100).toFixed(1) }
      ];
    }, [baseCalculations]);

    // OPEX breakdown
    const opexBreakdownData = useMemo(() => {
      return [
        { name: 'Raw Material', value: (study.raw_material_cost || 0) * 12, fill: '#1e40af' },
        { name: 'Labor', value: (study.labor_cost || 0) * 12, fill: '#3b82f6' },
        { name: 'Energy', value: (study.energy_cost || 0) * 12, fill: '#60a5fa' },
        { name: 'Maintenance', value: (study.maintenance_cost || 0) * 12, fill: '#93c5fd' },
        { name: 'Logistics', value: (study.logistics_cost || 0) * 12, fill: '#bfdbfe' },
        { name: 'Admin', value: (study.administrative_cost || 0) * 12, fill: '#dbeafe' },
        { name: 'Other', value: (study.other_opex || 0) * 12, fill: '#eff6ff' }
      ].filter(item => item.value > 0);
    }, [study]);

    // CAPEX breakdown
    const capexBreakdownData = useMemo(() => {
      return [
        { name: 'Equipment', value: study.equipment_cost || 0 },
        { name: 'Installation', value: study.installation_cost || 0 },
        { name: 'Infrastructure', value: study.infrastructure_cost || 0 },
        { name: 'Working Capital', value: study.working_capital || 0 },
        { name: 'Other', value: study.other_capex || 0 }
      ].filter(item => item.value > 0);
    }, [study]);

    // ESG Radar data
    const esgRadarData = useMemo(() => {
      const { co2Avoided, annualTonnage } = baseCalculations;
      const roi = study.roi_percentage || 0;
      
      // Normalize values to 0-100 scale
      const environmental = Math.min(100, (co2Avoided / 50000) * 100);
      const social = Math.min(100, 75); // Job creation index
      const governance = Math.min(100, roi > 20 ? 85 : roi > 10 ? 70 : 55);
      const circular = Math.min(100, (annualTonnage / 30000) * 100);
      const compliance = 80; // Regulatory compliance
      const innovation = Math.min(100, 75); // Technology innovation

      return [
        { subject: 'Environmental', A: environmental, fullMark: 100 },
        { subject: 'Social', A: social, fullMark: 100 },
        { subject: 'Governance', A: governance, fullMark: 100 },
        { subject: 'Circular Economy', A: circular, fullMark: 100 },
        { subject: 'Compliance', A: compliance, fullMark: 100 },
        { subject: 'Innovation', A: innovation, fullMark: 100 }
      ];
    }, [baseCalculations, study.roi_percentage]);

    // Sensitivity Heatmap data - ENGINEERING FIX: Real calculations
    const heatmapData = useMemo(() => {
      const { totalInvestment, annualTonnage, annualOpex, annualRevenue } = baseCalculations;
      const priceVariations = [-20, -10, 0, 10, 20];
      const capacityVariations = [-20, -10, 0, 10, 20];
      const taxRate = (study.tax_rate || 25) / 100;
      const depreciationYears = study.depreciation_years || 10;
      const annualDepreciation = totalInvestment / depreciationYears;
      
      const calculateROI = (priceMult: number, capMult: number) => {
        const revenue = annualRevenue * priceMult * capMult;
        const fixedOpex = annualOpex * 0.4;
        const variableOpex = annualOpex * 0.6 * capMult;
        const opex = fixedOpex + variableOpex;
        const ebitda = revenue - opex;
        const taxes = Math.max(0, (ebitda - annualDepreciation) * taxRate);
        const netProfit = ebitda - taxes;
        return totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;
      };
      
      return capacityVariations.map(capVar => {
        const row: Record<string, number | string> = { capacity: `${capVar > 0 ? '+' : ''}${capVar}%` };
        priceVariations.forEach(priceVar => {
          const roiImpact = calculateROI(1 + priceVar / 100, 1 + capVar / 100);
          row[`price_${priceVar}`] = Math.round(roiImpact * 10) / 10;
        });
        return row;
      });
    }, [baseCalculations, study.tax_rate, study.depreciation_years]);

    // Sensitivity line data - ENGINEERING FIX: Real recalculation
    const sensitivityData = useMemo(() => {
      const variations = [-20, -10, 0, 10, 20];
      const { totalInvestment, annualTonnage, annualOpex, annualRevenue } = baseCalculations;
      const taxRate = (study.tax_rate || 25) / 100;
      const depreciationYears = study.depreciation_years || 10;
      const annualDepreciation = totalInvestment / depreciationYears;
      
      const calculateScenarioROI = (priceMult: number, capMult: number, opexMult: number) => {
        const revenue = annualRevenue * priceMult * capMult;
        const fixedOpex = annualOpex * 0.4 * opexMult;
        const variableOpex = annualOpex * 0.6 * capMult * opexMult;
        const opex = fixedOpex + variableOpex;
        const ebitda = revenue - opex;
        const taxes = Math.max(0, (ebitda - annualDepreciation) * taxRate);
        const netProfit = ebitda - taxes;
        return totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;
      };
      
      return variations.map(variation => {
        const mult = 1 + variation / 100;
        return {
          variation: `${variation > 0 ? '+' : ''}${variation}%`,
          price: calculateScenarioROI(mult, 1, 1),
          capacity: calculateScenarioROI(1, mult, 1),
          opex: calculateScenarioROI(1, 1, 2 - mult) // Invert: +20% means lower OPEX multiplier
        };
      });
    }, [baseCalculations, study.tax_rate, study.depreciation_years]);

    const formatCurrency = (value: number) => {
      if (Math.abs(value) >= 1000000) {
        return `$${(value / 1000000).toFixed(1)}M`;
      }
      if (Math.abs(value) >= 1000) {
        return `$${(value / 1000).toFixed(0)}K`;
      }
      return `$${value.toFixed(0)}`;
    };

    // Get color based on ROI value for heatmap - HIGH CONTRAST colors
    const getHeatmapColor = (value: number) => {
      if (value >= 30) return '#00695c'; // dark teal
      if (value >= 20) return '#0277bd'; // dark blue
      if (value >= 10) return '#ef6c00'; // dark orange
      return '#c62828'; // dark red
    };

    return (
      <div className="fixed left-[-9999px] top-0 bg-white" style={{ width: '800px' }}>
        {/* Cash Flow Chart - Enhanced with LARGER fonts for PDF */}
        <div ref={cashFlowRef} className="bg-white p-6" style={{ width: '900px', height: '360px' }}>
          <h3 className="text-xl font-bold text-gray-900 mb-3">10-Year Cash Flow Projection</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={cashFlowData} margin={{ top: 15, right: 40, left: 10, bottom: 10 }}>
              <defs>
                <linearGradient id="colorCumulativePdf" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d47a1" stopOpacity={0.5}/>
                  <stop offset="95%" stopColor="#0d47a1" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorProfitPdf" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00897b" stopOpacity={0.5}/>
                  <stop offset="95%" stopColor="#00897b" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
              <XAxis dataKey="year" tick={{ fill: '#1f2937', fontSize: 14, fontWeight: 600 }} />
              <YAxis tickFormatter={(value) => formatCurrency(value)} tick={{ fill: '#1f2937', fontSize: 13, fontWeight: 500 }} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ fontSize: 14 }} />
              <Legend wrapperStyle={{ fontSize: '14px', fontWeight: 600 }} />
              <Area 
                type="monotone" 
                dataKey="cumulativeCashFlow" 
                name="Cumulative"
                stroke="#0d47a1" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorCumulativePdf)" 
              />
              <Bar 
                dataKey="netProfit" 
                name="Annual Profit"
                fill="#00897b"
                radius={[4, 4, 0, 0]}
                barSize={28}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Breakdown - Pie Chart with LARGER fonts */}
        <div ref={revenueRef} className="bg-white p-6" style={{ width: '480px', height: '360px' }}>
          <h3 className="text-xl font-bold text-gray-900 mb-3">Revenue Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <defs>
                <filter id="shadow">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
                </filter>
              </defs>
              <Pie
                data={revenueBreakdownData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
                label={({ name, percent }) => `${name}: ${percent}%`}
                labelLine={{ stroke: '#374151', strokeWidth: 2 }}
              >
                {revenueBreakdownData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} style={{ filter: 'url(#shadow)' }} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ fontSize: 14 }} />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>

        {/* OPEX Breakdown Chart - Horizontal Bar with LARGER fonts */}
        <div ref={opexRef} className="bg-white p-6" style={{ width: '480px', height: '360px' }}>
          <h3 className="text-xl font-bold text-gray-900 mb-3">OPEX Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={opexBreakdownData} layout="vertical" margin={{ left: 80, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" horizontal={true} vertical={false} />
              <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} tick={{ fill: '#1f2937', fontSize: 13, fontWeight: 500 }} />
              <YAxis type="category" dataKey="name" width={75} tick={{ fill: '#1f2937', fontSize: 13, fontWeight: 600 }} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ fontSize: 14 }} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={24}>
                {opexBreakdownData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* CAPEX Breakdown - Donut Chart with LARGER fonts */}
        <div ref={capexRef} className="bg-white p-6" style={{ width: '480px', height: '360px' }}>
          <h3 className="text-xl font-bold text-gray-900 mb-3">CAPEX Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={capexBreakdownData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={95}
                paddingAngle={3}
                dataKey="value"
                label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                labelLine={{ stroke: '#374151', strokeWidth: 2 }}
              >
                {capexBreakdownData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#0d47a1', '#1565c0', '#1976d2', '#1e88e5', '#42a5f5'][index % 5]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ fontSize: 14 }} />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>

        {/* ESG Radar Chart with LARGER fonts */}
        <div ref={esgRadarRef} className="bg-white p-6" style={{ width: '520px', height: '420px' }}>
          <h3 className="text-xl font-bold text-gray-900 mb-3">ESG Performance Radar</h3>
          <ResponsiveContainer width="100%" height={360}>
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={esgRadarData}>
              <defs>
                <linearGradient id="esgGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00897b" stopOpacity={0.8}/>
                  <stop offset="100%" stopColor="#00897b" stopOpacity={0.2}/>
                </linearGradient>
              </defs>
              <PolarGrid stroke="#d1d5db" />
              <PolarAngleAxis 
                dataKey="subject" 
                tick={{ fill: '#1f2937', fontSize: 13, fontWeight: 700 }}
              />
              <PolarRadiusAxis 
                angle={30} 
                domain={[0, 100]} 
                tick={{ fill: '#4b5563', fontSize: 12, fontWeight: 500 }}
              />
              <Radar
                name="ESG Score"
                dataKey="A"
                stroke="#00897b"
                strokeWidth={3}
                fill="url(#esgGradient)"
              />
              <Tooltip formatter={(value: number) => `${value.toFixed(0)}%`} contentStyle={{ fontSize: 14 }} />
              <Legend wrapperStyle={{ fontSize: '14px', fontWeight: 600 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Sensitivity Heatmap with LARGER fonts */}
        <div ref={heatmapRef} className="bg-white p-6" style={{ width: '520px', height: '420px' }}>
          <h3 className="text-xl font-bold text-gray-900 mb-3">ROI Sensitivity Matrix</h3>
          <div className="text-base text-gray-700 mb-3 text-center font-semibold">Price Variation →</div>
          <div className="flex">
            <div className="flex flex-col justify-center pr-3 text-base text-gray-700 font-semibold" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
              Capacity Variation →
            </div>
            <table className="border-collapse w-full" style={{ fontSize: '14px' }}>
              <thead>
                <tr>
                  <th className="p-3 border-2 border-gray-300 bg-gray-100"></th>
                  {[-20, -10, 0, 10, 20].map(p => (
                    <th key={p} className="p-3 border-2 border-gray-300 bg-gray-100 font-bold text-gray-800">
                      {p > 0 ? '+' : ''}{p}%
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapData.map((row, rowIdx) => (
                  <tr key={rowIdx}>
                    <td className="p-3 border-2 border-gray-300 bg-gray-100 font-bold text-gray-800">{row.capacity}</td>
                    {[-20, -10, 0, 10, 20].map(p => {
                      const val = row[`price_${p}`] as number;
                      return (
                        <td 
                          key={p} 
                          className="p-3 border-2 border-gray-300 text-center font-bold text-white"
                          style={{ backgroundColor: getHeatmapColor(val) }}
                        >
                          {val}%
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-center gap-6 mt-4 text-sm font-semibold">
            <span className="flex items-center gap-2"><span className="w-4 h-4 rounded" style={{ backgroundColor: '#c62828' }}></span> {'<10%'}</span>
            <span className="flex items-center gap-2"><span className="w-4 h-4 rounded" style={{ backgroundColor: '#e65100' }}></span> 10-20%</span>
            <span className="flex items-center gap-2"><span className="w-4 h-4 rounded" style={{ backgroundColor: '#1565c0' }}></span> 20-30%</span>
            <span className="flex items-center gap-2"><span className="w-4 h-4 rounded" style={{ backgroundColor: '#00897b' }}></span> {'>30%'}</span>
          </div>
        </div>

        {/* Sensitivity Analysis Line Chart with LARGER fonts */}
        <div ref={sensitivityRef} className="bg-white p-6" style={{ width: '900px', height: '360px' }}>
          <h3 className="text-xl font-bold text-gray-900 mb-3">Sensitivity Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsLineChart data={sensitivityData} margin={{ top: 15, right: 40, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
              <XAxis dataKey="variation" tick={{ fill: '#1f2937', fontSize: 14, fontWeight: 600 }} />
              <YAxis tickFormatter={(value) => `${value.toFixed(0)}%`} tick={{ fill: '#1f2937', fontSize: 13, fontWeight: 500 }} domain={['auto', 'auto']} />
              <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} contentStyle={{ fontSize: 14 }} />
              <Legend wrapperStyle={{ fontSize: '14px', fontWeight: 600 }} />
              <Line 
                type="monotone" 
                dataKey="price" 
                name="Price Impact"
                stroke="#00897b" 
                strokeWidth={4}
                dot={{ fill: '#00897b', strokeWidth: 2, r: 7 }}
                activeDot={{ r: 9 }}
              />
              <Line 
                type="monotone" 
                dataKey="capacity" 
                name="Capacity Impact"
                stroke="#0d47a1" 
                strokeWidth={4}
                dot={{ fill: '#0d47a1', strokeWidth: 2, r: 7 }}
                activeDot={{ r: 9 }}
              />
              <Line 
                type="monotone" 
                dataKey="opex" 
                name="OPEX Impact"
                stroke="#e65100" 
                strokeWidth={4}
                dot={{ fill: '#e65100', strokeWidth: 2, r: 7 }}
                activeDot={{ r: 9 }}
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }
);

FeasibilityPDFCharts.displayName = 'FeasibilityPDFCharts';
