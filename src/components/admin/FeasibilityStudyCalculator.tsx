// Feasibility Study Calculator Component
import { useState, useMemo, useEffect, useRef } from "react";
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { SITE_DOMAIN, SITE_URLS } from '@/lib/siteConfig';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calculator,
  DollarSign,
  TrendingUp,
  Clock,
  BarChart3,
  Percent,
  Info,
  Save,
  Plus,
  Trash2,
  FileDown,
  Edit,
  Factory,
  MapPin,
  Wrench,
  Zap,
  Users,
  Truck,
  Building,
  Loader2,
  Eye,
  Copy,
  ChevronDown,
  ChevronUp,
  Scale,
  FileText,
  LayoutTemplate,
  Image,
  Circle,
  Brain,
  Sparkles,
  Send,
  ExternalLink,
  Check
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FeasibilityCharts } from './FeasibilityCharts';
import { FeasibilityComparison } from './FeasibilityComparison';
import { FeasibilityTemplates } from './FeasibilityTemplates';
import { FeasibilityAIAnalysis } from './FeasibilityAIAnalysis';
import { FeasibilityAdvancedAI } from './FeasibilityAdvancedAI';
import { FeasibilityValidationAlerts } from './FeasibilityValidationAlerts';
import { FeasibilityPDFCharts, FeasibilityPDFChartsHandle } from './FeasibilityPDFCharts';
import { FeasibilityProfessionalReport } from './FeasibilityProfessionalReport';
import { OTRCompositionTable } from './OTRCompositionTable';
import { CollaborativeDocumentDialog } from './CollaborativeDocumentDialog';
import { MultipleSignersManager, type Signer } from './MultipleSignersManager';
import { FiscalIncentivesTable, FISCAL_INCENTIVES_DATA, getEffectiveTaxRate, getRegionsForCountry, getBaseTaxRate, getRegionIncentiveDetails, OTR_TIRE_MODELS, OTR_MARKET_PRICES, GOVERNMENT_PARTNERSHIP_DATA, getGovernmentPartnershipData, getRecommendedPartnershipTerms, calculateGovernmentPartnershipImpact, TIRE_CATEGORIES, getTireCategory, getTireCategoryOpexAdjustments, getTireCategoryYields, getRegionalTireBonusAdjustments } from './FiscalIncentivesTable';
import { generateFeasibilityPDFWithCharts } from '@/lib/generateFeasibilityPDF';
import { generateProfessionalFeasibilityPDF, ChecklistNotes, WatermarkType, TireCategoryData } from '@/lib/generateProfessionalFeasibilityPDF';
import { PartnershipScenarioChart } from './PartnershipScenarioChart';
import { TireModelSelector } from './TireModelSelector';
import { ExportPriceCalculator } from './ExportPriceCalculator';
import { InfrastructureCostCalculator } from './InfrastructureCostCalculator';
import { CalculationReferencePanel } from './CalculationReferencePanel';
import jsPDF from 'jspdf';
import i18n from '@/i18n';


interface FeasibilityStudy {
  id: string;
  study_name: string;
  location: string | null;
  country: string | null;
  plant_type: string;
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
  rcb_yield: number; // rCB yield percentage - typically 10-15% of rubber content
  tax_rate: number;
  depreciation_years: number;
  discount_rate: number;
  inflation_rate: number;
  total_investment: number;
  annual_revenue: number;
  annual_opex: number;
  annual_ebitda: number;
  payback_months: number;
  roi_percentage: number;
  npv_10_years: number;
  irr_percentage: number;
  status: string;
  notes: string | null;
  lead_id: string | null;
  lead_type: string | null;
  created_at: string;
  updated_at: string;
  // New fields for government partnership model
  government_royalties_percent: number;
  environmental_bonus_per_ton: number;
  collection_model: string;
}

// =============================================================================
// DEFAULT STUDY VALUES - Based on Real Plant Data (Jan 2026)
// Sources: TOPS Recycling China, Genan Germany, Tyrecycle Australia, ELP Brazil
// =============================================================================
const defaultStudy: Omit<FeasibilityStudy, 'id' | 'created_at' | 'updated_at'> = {
  study_name: '',
  location: '',
  country: '',
  plant_type: 'otr_recycling',
  // Capacity: ELP model - 85 tons/day is mid-range for integrated pyrolysis
  daily_capacity_tons: 85,
  operating_days_per_year: 300,
  utilization_rate: 85,
  // CAPEX - Based on Brazil integrated plant model (infrastructure-heavy)
  // China: $0.5-1.5M | Germany: $5-12M | Australia: $3-8M | Brazil: $8-15M
  equipment_cost: 3500000,  // USD 3.5M - OTR line + pyrolysis reactor
  installation_cost: 600000, // USD 600K - Installation + commissioning
  infrastructure_cost: 4500000, // USD 4.5M - Building, utilities, roads
  working_capital: 800000,  // USD 800K - 3 months operating reserve
  other_capex: 1100000,     // USD 1.1M - Solar, permits, contingency
  // OPEX Monthly - Based on Brazil costs (~$55/ton processed)
  // Benchmark: China $15-40/t | Germany $60-120/t | Australia $50-100/t | Brazil $40-80/t
  raw_material_cost: 0,      // Tires often free/negative cost (gate fee)
  labor_cost: 45000,         // USD 45K/month - 25-30 employees
  energy_cost: 28000,        // USD 28K/month - ~1,500 kWh/day + solar offset
  maintenance_cost: 25000,   // USD 25K/month - 6% of equipment/year
  logistics_cost: 22000,     // USD 22K/month - Transport + handling
  administrative_cost: 18000, // USD 18K/month - Admin + compliance
  other_opex: 12000,         // USD 12K/month - Insurance, consumables
  // Product prices - Jan 2026 validated market prices
  rubber_granules_price: 250, // USD/ton - Market range: $180-350
  rubber_granules_yield: 43,  // % - After pyrolysis allocation
  steel_wire_price: 250,      // USD/ton - Recovered wire (NOT virgin steel $620+)
  steel_wire_yield: 25,       // % - OTR range: 20-30%
  textile_fiber_price: 120,   // USD/ton - Low demand, contamination
  textile_fiber_yield: 8,     // % - OTR range: 5-10%
  rcb_price: 1050,            // USD/ton - Premium rCB $900-1200
  rcb_yield: 12,              // % - Pyrolysis yield: 10-17.5%
  // Financial parameters
  tax_rate: 25,
  depreciation_years: 10,
  discount_rate: 12,
  inflation_rate: 3,
  // Calculated fields (will be computed)
  total_investment: 0,
  annual_revenue: 0,
  annual_opex: 0,
  annual_ebitda: 0,
  payback_months: 0,
  roi_percentage: 0,
  npv_10_years: 0,
  irr_percentage: 0,
  status: 'draft',
  notes: '',
  lead_id: null,
  lead_type: null,
  // Government partnership model fields
  government_royalties_percent: 0,
  environmental_bonus_per_ton: 0,
  collection_model: 'direct'
};

const countries = [
  'Brasil', 'Australia', 'Italy', 'Germany', 'China', 'USA', 'Chile', 
  'Peru', 'South Africa', 'Indonesia', 'India', 'Mexico', 'Canada'
];

export function FeasibilityStudyCalculator() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogReady, setDialogReady] = useState(false); // For lazy loading heavy components
  const [editingStudy, setEditingStudy] = useState<Partial<FeasibilityStudy> | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedStudy, setSelectedStudy] = useState<FeasibilityStudy | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    capex: true,
    opex: true,
    revenue: true,
    financial: false
  });
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiAnalysisLanguage, setAiAnalysisLanguage] = useState<string | null>(null); // Track original analysis language
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedTireCategories, setSelectedTireCategories] = useState<string[]>(['otr_mining']);
  const [selectedTireModels, setSelectedTireModels] = useState<string[]>([]);
  
  // Helper function to calculate combined values from multiple tire categories
  const calculateMultiCategoryValues = (categoryIds: string[]) => {
    const categories = categoryIds.map(id => getTireCategory(id)).filter(Boolean);
    if (categories.length === 0) return null;
    
    const count = categories.length;
    
    return {
      avgWeight: Math.round(categories.reduce((sum, c) => sum + (c?.avgWeight || 0), 0) / count),
      composition: {
        rubber: Math.round(categories.reduce((sum, c) => sum + (c?.composition?.rubber || 0), 0) / count),
        steel: Math.round(categories.reduce((sum, c) => sum + (c?.composition?.steel || 0), 0) / count),
        textile: Math.round(categories.reduce((sum, c) => sum + (c?.composition?.textile || 0), 0) / count),
      },
      recommendedCapacity: Math.round(categories.reduce((sum, c) => sum + (c?.recommendedCapacity || 0), 0) / count),
      yields: {
        rubber: Math.round(categories.reduce((sum, c) => sum + (c?.composition?.rubber || 0), 0) / count * 0.95),
        steel: Math.round(categories.reduce((sum, c) => sum + (c?.composition?.steel || 0), 0) / count * 0.92),
        textile: Math.round(categories.reduce((sum, c) => sum + (c?.composition?.textile || 0), 0) / count * 0.90),
        rcb: Math.round(categories.reduce((sum, c) => sum + ((100 - (c?.composition?.rubber || 0) - (c?.composition?.steel || 0) - (c?.composition?.textile || 0)) * 0.35), 0) / count)
      }
    };
  };
  
  // Get combined tire category data for display
  const combinedCategoryData = useMemo(() => calculateMultiCategoryValues(selectedTireCategories), [selectedTireCategories]);
  const [availableRegions, setAvailableRegions] = useState<Array<{ id: string; nameKey: string; effectiveTax: number }>>([]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfLanguage, setPdfLanguage] = useState<string>(i18n.language);
  const pdfChartsRef = useRef<FeasibilityPDFChartsHandle>(null);
  
  // Delay rendering of heavy components until dialog animation is complete
  useEffect(() => {
    if (dialogOpen) {
      const timer = setTimeout(() => setDialogReady(true), 300);
      return () => clearTimeout(timer);
    } else {
      setDialogReady(false);
    }
  }, [dialogOpen]);
  
  // Checklist notes for due diligence
  const [checklistNotes, setChecklistNotes] = useState<ChecklistNotes>({
    companyInfo: '',
    financial: '',
    legal: '',
    operational: '',
    otrSources: '',
    partnership: ''
  });
  
  // PDF Watermark option
  const [pdfWatermark, setPdfWatermark] = useState<WatermarkType>('none');
  
  // Collaborative AI Dialog
  const [collaborativeDialogOpen, setCollaborativeDialogOpen] = useState(false);
  const [collaborativeDocumentContent, setCollaborativeDocumentContent] = useState<string | null>(null);
  
  // Multiple Signers State for Feasibility
  const [enableSignature, setEnableSignature] = useState(false);
  const [enableMultipleSignatures, setEnableMultipleSignatures] = useState(false);
  const [feasibilitySigners, setFeasibilitySigners] = useState<Signer[]>([]);
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [savedDocumentId, setSavedDocumentId] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // QR Code link configuration
  const [qrCodeLinkType, setQrCodeLinkType] = useState<string>('otr-sources');
  const [customQrCodeUrl, setCustomQrCodeUrl] = useState<string>('');
  
  // Base URL for the site - production domain
  const siteBaseUrl = SITE_DOMAIN;
  
  // Available form links for QR Code - with PDF source tracking
  const qrCodeFormOptions = [
    { value: 'otr-sources', label: t('admin.feasibility.qrForms.otrSources', 'OTR Source Indication'), url: `${siteBaseUrl}/otr-sources?source=pdf_feasibility` },
    { value: 'marketplace', label: t('admin.feasibility.qrForms.marketplace', 'Marketplace Registration'), url: `${siteBaseUrl}/marketplace?source=pdf_feasibility` },
    { value: 'quote', label: t('admin.feasibility.qrForms.quote', 'Request Quote'), url: `${siteBaseUrl}/request-quote?source=pdf_feasibility` },
    { value: 'contact', label: t('admin.feasibility.qrForms.contact', 'Contact Form'), url: `${siteBaseUrl}/contact?source=pdf_feasibility` },
    { value: 'template-kyc', label: t('admin.feasibility.qrForms.dueDiligenceChecklist', 'Due Diligence Checklist (KYC)'), url: SITE_URLS.documentTemplate('a1b2c3d4-e5f6-7890-abcd-111111111111') + '?source=pdf_feasibility' },
    { value: 'template-loi', label: t('admin.feasibility.qrForms.loi', 'Letter of Intent (LOI)'), url: SITE_URLS.documentTemplate('b2c3d4e5-f6a7-8901-bcde-222222222222') + '?source=pdf_feasibility' },
    { value: 'template-mou', label: t('admin.feasibility.qrForms.mou', 'Memorandum of Understanding (MOU)'), url: SITE_URLS.documentTemplate('c3d4e5f6-a7b8-9012-cdef-333333333333') + '?source=pdf_feasibility' },
    { value: 'template-nda', label: t('admin.feasibility.qrForms.nda', 'NDA - Confidentiality Agreement'), url: SITE_URLS.documentTemplate('f9fa8388-e8ed-4c68-97ac-f3317a25b8e9') + '?source=pdf_feasibility' },
    { value: 'template-jv', label: t('admin.feasibility.qrForms.jointVenture', 'Joint Venture Agreement'), url: SITE_URLS.documentTemplate('8154040b-954c-4591-b432-d206ca04d9a2') + '?source=pdf_feasibility' },
    { value: 'template-lgpd', label: t('admin.feasibility.qrForms.lgpdConsent', 'LGPD/GDPR Consent'), url: SITE_URLS.documentTemplate('99bda306-c4b4-414a-b031-dee532152ecd') + '?source=pdf_feasibility' },
    { value: 'digital-signature', label: t('admin.feasibility.qrForms.digitalSignature', 'Digital Signature Portal'), url: SITE_URLS.sign },
    { value: 'custom', label: t('admin.feasibility.qrForms.customLink', 'Custom Link'), url: '' }
  ];
  
  // Get the actual QR Code URL to use (with tracking parameter)
  const getQrCodeUrl = (): string => {
    if (qrCodeLinkType === 'custom') {
      // Add tracking to custom URL if not already present
      const customUrl = customQrCodeUrl || `${siteBaseUrl}/otr-sources`;
      if (!customUrl.includes('source=')) {
        const separator = customUrl.includes('?') ? '&' : '?';
        return `${customUrl}${separator}source=pdf_feasibility`;
      }
      return customUrl;
    }
    const option = qrCodeFormOptions.find(o => o.value === qrCodeLinkType);
    return option?.url || `${siteBaseUrl}/otr-sources?source=pdf_feasibility`;
  };

  // Fetch studies
  const { data: studies, isLoading } = useQuery({
    queryKey: ['feasibility-studies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feasibility_studies')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as FeasibilityStudy[];
    }
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (study: Partial<FeasibilityStudy>) => {
      const calculations = calculateFinancials(study);
      const payload = {
        study_name: study.study_name || 'Untitled Study',
        location: study.location,
        country: study.country,
        plant_type: study.plant_type || 'otr_recycling',
        daily_capacity_tons: study.daily_capacity_tons,
        operating_days_per_year: study.operating_days_per_year,
        utilization_rate: study.utilization_rate,
        equipment_cost: study.equipment_cost,
        installation_cost: study.installation_cost,
        infrastructure_cost: study.infrastructure_cost,
        working_capital: study.working_capital,
        other_capex: study.other_capex,
        raw_material_cost: study.raw_material_cost,
        labor_cost: study.labor_cost,
        energy_cost: study.energy_cost,
        maintenance_cost: study.maintenance_cost,
        logistics_cost: study.logistics_cost,
        administrative_cost: study.administrative_cost,
        other_opex: study.other_opex,
        rubber_granules_price: study.rubber_granules_price,
        rubber_granules_yield: study.rubber_granules_yield,
        steel_wire_price: study.steel_wire_price,
        steel_wire_yield: study.steel_wire_yield,
        textile_fiber_price: study.textile_fiber_price,
        textile_fiber_yield: study.textile_fiber_yield,
        rcb_price: study.rcb_price, // Recovered Carbon Black price - CRITICAL: must be saved
        rcb_yield: study.rcb_yield, // rCB yield percentage - CRITICAL: must be saved
        tax_rate: study.tax_rate,
        depreciation_years: study.depreciation_years,
        discount_rate: study.discount_rate,
        inflation_rate: study.inflation_rate,
        government_royalties_percent: study.government_royalties_percent,
        environmental_bonus_per_ton: study.environmental_bonus_per_ton,
        collection_model: study.collection_model,
        status: study.status,
        notes: study.notes,
        ...calculations
      };

      if (study.id) {
        const { error } = await supabase
          .from('feasibility_studies')
          .update(payload)
          .eq('id', study.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('feasibility_studies')
          .insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feasibility-studies'] });
      toast({ title: t('admin.feasibility.savedSuccess') });
      setDialogOpen(false);
      setEditingStudy(null);
    },
    onError: () => {
      toast({ title: t('admin.feasibility.saveError'), variant: 'destructive' });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('feasibility_studies')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feasibility-studies'] });
      toast({ title: t('admin.feasibility.deletedSuccess') });
    }
  });

  // Calculate financials
  const calculateFinancials = (study: Partial<FeasibilityStudy>) => {
    const dailyCapacity = study.daily_capacity_tons || 50;
    const operatingDays = study.operating_days_per_year || 300;
    const utilization = (study.utilization_rate || 85) / 100;

    // Annual tonnage
    const annualTonnage = dailyCapacity * operatingDays * utilization;

    // Total Investment (CAPEX)
    const totalInvestment = 
      (study.equipment_cost || 0) +
      (study.installation_cost || 0) +
      (study.infrastructure_cost || 0) +
      (study.working_capital || 0) +
      (study.other_capex || 0);

    // Annual Revenue - JANUARY 2026 MARKET PRICES (VALIDATED from multiple sources)
    // Sources: Recycler's World Jan 2026, American Recycler, commodity exchanges
    // CRITICAL: Steel price for RECOVERED tire wire is $150-350/ton, NOT virgin steel $620+
    // Prices: Granules $250/t, Steel $250/t (recovered), Textile $120/t, rCB $1,050/t
    const revenueGranules = annualTonnage * ((study.rubber_granules_yield || 43) / 100) * (study.rubber_granules_price || 250);
    const revenueSteel = annualTonnage * ((study.steel_wire_yield || 25) / 100) * (study.steel_wire_price || 250);
    const revenueFiber = annualTonnage * ((study.textile_fiber_yield || 8) / 100) * (study.textile_fiber_price || 120);
    const revenueRCB = annualTonnage * ((study.rcb_yield || 12) / 100) * (study.rcb_price || 1050);
    const annualRevenue = revenueGranules + revenueSteel + revenueFiber + revenueRCB;

    // Annual OPEX
    const monthlyOpex = 
      (study.raw_material_cost || 0) +
      (study.labor_cost || 0) +
      (study.energy_cost || 0) +
      (study.maintenance_cost || 0) +
      (study.logistics_cost || 0) +
      (study.administrative_cost || 0) +
      (study.other_opex || 0);
    const annualOpex = monthlyOpex * 12;

    // EBITDA
    const annualEbitda = annualRevenue - annualOpex;

    // Depreciation
    const annualDepreciation = totalInvestment / (study.depreciation_years || 10);

    // Taxable Income
    const taxableIncome = annualEbitda - annualDepreciation;
    const taxes = Math.max(0, taxableIncome * ((study.tax_rate || 25) / 100));

    // Net Profit
    const netProfit = annualEbitda - taxes;

    // Payback (months)
    const paybackMonths = netProfit > 0 ? Math.ceil((totalInvestment / netProfit) * 12) : 999;

    // ROI
    const roiPercentage = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;

    // NPV (10 years)
    const discountRate = (study.discount_rate || 12) / 100;
    let npv = -totalInvestment;
    for (let year = 1; year <= 10; year++) {
      npv += netProfit / Math.pow(1 + discountRate, year);
    }

    // IRR (approximation using Newton-Raphson)
    let irr = 0.15; // Initial guess
    for (let i = 0; i < 100; i++) {
      let npvAtIrr = -totalInvestment;
      let derivative = 0;
      for (let year = 1; year <= 10; year++) {
        npvAtIrr += netProfit / Math.pow(1 + irr, year);
        derivative -= (year * netProfit) / Math.pow(1 + irr, year + 1);
      }
      if (Math.abs(derivative) < 0.0001) break;
      irr = irr - npvAtIrr / derivative;
      if (Math.abs(npvAtIrr) < 100) break;
    }

    return {
      total_investment: totalInvestment,
      annual_revenue: annualRevenue,
      annual_opex: annualOpex,
      annual_ebitda: annualEbitda,
      payback_months: paybackMonths,
      roi_percentage: roiPercentage,
      npv_10_years: npv,
      irr_percentage: irr * 100
    };
  };

  // Live calculations for editor
  const liveCalculations = useMemo(() => {
    if (!editingStudy) return null;
    return calculateFinancials(editingStudy);
  }, [editingStudy]);

  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1000000) {
      return `USD ${(value / 1000000).toFixed(2)}M`;
    }
    if (Math.abs(value) >= 1000) {
      return `USD ${(value / 1000).toFixed(0)}K`;
    }
    return `USD ${value.toFixed(0)}`;
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(Math.round(value));
  };

  const handleFieldChange = (field: keyof FeasibilityStudy, value: string | number) => {
    setEditingStudy(prev => prev ? { ...prev, [field]: value } : prev);
    
    // Auto-update regions when country changes
    if (field === 'country' && typeof value === 'string') {
      const regions = getRegionsForCountry(value);
      setAvailableRegions(regions);
      setSelectedRegion(''); // Reset region selection
      
      // Set base tax rate if no region is selected
      const baseTax = getBaseTaxRate(value);
      if (baseTax !== null) {
        setEditingStudy(prev => prev ? { ...prev, tax_rate: baseTax } : prev);
      }
    }
  };

  // Handle region selection with automatic tax rate calculation
  const handleRegionChange = (regionId: string) => {
    setSelectedRegion(regionId);
    
    if (editingStudy?.country && regionId) {
      const effectiveTax = getEffectiveTaxRate(editingStudy.country, regionId);
      if (effectiveTax !== null) {
        setEditingStudy(prev => prev ? { ...prev, tax_rate: effectiveTax } : prev);
      }
    }
  };

  const generatePDF = (study: FeasibilityStudy) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(26, 26, 26);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(212, 175, 55);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('ELP Green Technology', 20, 20);
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text('Feasibility Study Report', 20, 32);

    doc.setTextColor(0, 0, 0);
    let y = 55;

    // Study Info
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(study.study_name, 20, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    if (study.location) {
      doc.text(`Location: ${study.location}, ${study.country}`, 20, y);
      y += 6;
    }
    doc.text(`Status: ${study.status}`, 20, y);
    y += 6;
    doc.text(`Created: ${new Date(study.created_at).toLocaleDateString()}`, 20, y);
    y += 15;

    // Plant Configuration
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Plant Configuration', 20, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Daily Capacity: ${study.daily_capacity_tons} tons/day`, 25, y); y += 5;
    doc.text(`Operating Days: ${study.operating_days_per_year} days/year`, 25, y); y += 5;
    doc.text(`Utilization Rate: ${study.utilization_rate}%`, 25, y); y += 5;
    const annualTonnage = study.daily_capacity_tons * study.operating_days_per_year * (study.utilization_rate / 100);
    doc.text(`Annual Production: ${formatNumber(annualTonnage)} tons`, 25, y);
    y += 12;

    // Investment Summary
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Investment (CAPEX)', 20, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Equipment: ${formatCurrency(study.equipment_cost)}`, 25, y); y += 5;
    doc.text(`Installation: ${formatCurrency(study.installation_cost)}`, 25, y); y += 5;
    doc.text(`Infrastructure: ${formatCurrency(study.infrastructure_cost)}`, 25, y); y += 5;
    doc.text(`Working Capital: ${formatCurrency(study.working_capital)}`, 25, y); y += 5;
    doc.text(`Other CAPEX: ${formatCurrency(study.other_capex)}`, 25, y); y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL INVESTMENT: ${formatCurrency(study.total_investment)}`, 25, y);
    y += 12;

    // Financial Results
    doc.setFontSize(14);
    doc.text('Financial Results', 20, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Annual Revenue: ${formatCurrency(study.annual_revenue)}`, 25, y); y += 5;
    doc.text(`Annual OPEX: ${formatCurrency(study.annual_opex)}`, 25, y); y += 5;
    doc.text(`Annual EBITDA: ${formatCurrency(study.annual_ebitda)}`, 25, y); y += 5;
    doc.text(`Payback Period: ${study.payback_months} months`, 25, y); y += 5;
    doc.text(`ROI: ${study.roi_percentage.toFixed(1)}%`, 25, y); y += 5;
    doc.text(`NPV (10 years): ${formatCurrency(study.npv_10_years)}`, 25, y); y += 5;
    doc.text(`IRR: ${study.irr_percentage.toFixed(1)}%`, 25, y);
    y += 15;

    // Notes
    if (study.notes) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Notes', 20, y);
      y += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const splitNotes = doc.splitTextToSize(study.notes, pageWidth - 40);
      doc.text(splitNotes, 20, y);
    }

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 15;
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('This is an estimated feasibility study. Actual results may vary.', 20, footerY);
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - 60, footerY);

    doc.save(`feasibility-study-${study.study_name.replace(/\s+/g, '-').toLowerCase()}.pdf`);
    toast({ title: t('admin.feasibility.pdfGenerated') });
  };

  const duplicateStudy = (study: FeasibilityStudy) => {
    const newStudy = {
      ...study,
      id: undefined,
      study_name: `${study.study_name} (Copy)`,
      status: 'draft',
      created_at: undefined,
      updated_at: undefined
    };
    setEditingStudy(newStudy);
    setDialogOpen(true);
  };

  // Save document for digital signature
  const saveDocumentForSignature = async () => {
    if (!editingStudy || !liveCalculations) return;

    try {
      const signersData = enableMultipleSignatures && feasibilitySigners.length > 0
        ? feasibilitySigners.map(s => ({ 
            name: s.name, 
            email: s.email, 
            role: s.role, 
            order: s.order, 
            status: 'pending' 
          }))
        : [];

      const { data: savedDoc, error } = await supabase
        .from('generated_documents')
        .insert({
          document_name: `Feasibility Study - ${editingStudy.study_name || 'New Study'}`,
          document_type: 'feasibility_study',
          language: pdfLanguage,
          field_values: {
            study_name: editingStudy.study_name,
            location: editingStudy.location,
            country: editingStudy.country,
            daily_capacity_tons: editingStudy.daily_capacity_tons,
            total_investment: liveCalculations.total_investment,
            annual_revenue: liveCalculations.annual_revenue,
            annual_ebitda: liveCalculations.annual_ebitda,
            roi_percentage: liveCalculations.roi_percentage,
            payback_months: liveCalculations.payback_months,
            signers: signersData,
          },
          signature_status: 'pending',
          required_signatures: enableMultipleSignatures ? feasibilitySigners.length : 1,
          current_signatures: 0,
          pending_signer_name: enableMultipleSignatures && feasibilitySigners.length > 0 
            ? feasibilitySigners[0].name 
            : undefined,
          pending_signer_email: enableMultipleSignatures && feasibilitySigners.length > 0 
            ? feasibilitySigners[0].email 
            : undefined,
          all_signatures_data: [],
        })
        .select()
        .single();

      if (error) throw error;

      setSavedDocumentId(savedDoc?.id || null);
      
      toast({ 
        title: t('admin.feasibility.documentSavedForSignature', 'Documento salvo para assinatura!'),
        description: t('admin.feasibility.documentSavedDesc', 'O documento foi salvo e está pronto para assinatura digital.')
      });

      // If first signer has email, trigger notification
      if (savedDoc?.id && enableMultipleSignatures && feasibilitySigners.length > 0 && feasibilitySigners[0].email) {
        try {
          await supabase.functions.invoke('notify-next-signer', {
            body: { documentId: savedDoc.id }
          });
          toast({ 
            title: t('admin.feasibility.notificationSent', 'Notificação enviada!'),
            description: `E-mail enviado para ${feasibilitySigners[0].name}`
          });
        } catch (notifyError) {
          console.error('Failed to notify first signer:', notifyError);
        }
      }

      // Navigate to signature portal if requested
      if (savedDoc?.id) {
        setShowSignatureDialog(true);
      }
    } catch (error) {
      console.error('Error saving document for signature:', error);
      toast({ 
        title: t('admin.feasibility.saveError', 'Erro ao salvar'),
        variant: 'destructive'
      });
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'in_review': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'rejected': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Tabs defaultValue="studies" className="w-full">
          <TabsList className="grid grid-cols-6 w-full max-w-3xl mb-6">
            <TabsTrigger value="studies" className="gap-1">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">{t('admin.feasibility.tabs.studies')}</span>
            </TabsTrigger>
            <TabsTrigger value="incentives" className="gap-1">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">{t('admin.feasibility.tabs.incentives', 'Incentivos')}</span>
            </TabsTrigger>
            <TabsTrigger value="otr-data" className="gap-1">
              <Circle className="h-4 w-4" />
              <span className="hidden sm:inline">{t('admin.feasibility.tabs.otrData', 'OTR')}</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-1">
              <LayoutTemplate className="h-4 w-4" />
              <span className="hidden sm:inline">{t('admin.feasibility.tabs.templates')}</span>
            </TabsTrigger>
            <TabsTrigger value="compare" className="gap-1">
              <Scale className="h-4 w-4" />
              <span className="hidden sm:inline">{t('admin.feasibility.tabs.compare')}</span>
            </TabsTrigger>
            <TabsTrigger value="charts" className="gap-1" disabled={!studies?.length}>
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">{t('admin.feasibility.tabs.charts')}</span>
            </TabsTrigger>
          </TabsList>

          {/* Fiscal Incentives Tab */}
          <TabsContent value="incentives">
            <FiscalIncentivesTable />
          </TabsContent>

          <TabsContent value="studies">
            <div className="flex flex-wrap justify-end gap-2 mb-4">
              <Button 
                variant="outline" 
                onClick={() => setCollaborativeDialogOpen(true)}
                className="gap-2"
              >
                <Brain className="h-4 w-4" />
                <Sparkles className="h-3 w-3" />
                {t('admin.feasibility.collaborativeAi', 'IA Colaborativa')}
              </Button>
              <Button onClick={() => { setEditingStudy({ ...defaultStudy }); setDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                {t('admin.feasibility.newStudy')}
              </Button>
            </div>

        {/* Studies List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : studies?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">{t('admin.feasibility.noStudies')}</h3>
              <p className="text-muted-foreground mb-4">{t('admin.feasibility.noStudiesDesc')}</p>
              <Button onClick={() => { setEditingStudy({ ...defaultStudy }); setDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                {t('admin.feasibility.createFirst')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {studies?.map((study) => (
              <Card key={study.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Study Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg truncate">{study.study_name}</h3>
                        <Badge variant="outline" className={getStatusColor(study.status)}>
                          {t(`admin.feasibility.status.${study.status}`)}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        {study.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {study.location}, {study.country}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Factory className="h-3 w-3" />
                          {study.daily_capacity_tons} {t('admin.feasibility.tonsDay')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(study.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* KPIs */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
                      <div className="bg-muted/50 rounded-lg p-2 text-center">
                        <span className="text-xs text-muted-foreground block">{t('admin.feasibility.investment')}</span>
                        <span className="font-bold text-sm">{formatCurrency(study.total_investment)}</span>
                      </div>
                      <div className="bg-green-500/10 rounded-lg p-2 text-center">
                        <span className="text-xs text-muted-foreground block">{t('admin.feasibility.roi')}</span>
                        <span className="font-bold text-sm text-green-600">{study.roi_percentage.toFixed(1)}%</span>
                      </div>
                      <div className="bg-blue-500/10 rounded-lg p-2 text-center">
                        <span className="text-xs text-muted-foreground block">{t('admin.feasibility.payback')}</span>
                        <span className="font-bold text-sm text-blue-600">{study.payback_months} {t('admin.feasibility.months')}</span>
                      </div>
                      <div className="bg-primary/10 rounded-lg p-2 text-center">
                        <span className="text-xs text-muted-foreground block">{t('admin.feasibility.irr')}</span>
                        <span className="font-bold text-sm text-primary">{study.irr_percentage.toFixed(1)}%</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => { 
                            // Ensure we preserve all saved values by merging with defaults for null fields
                            const studyWithDefaults = {
                              ...defaultStudy,
                              ...Object.fromEntries(
                                Object.entries(study).filter(([_, v]) => v !== null && v !== undefined)
                              )
                            };
                            setEditingStudy(studyWithDefaults); 
                            setDialogOpen(true); 
                          }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('admin.feasibility.edit')}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => duplicateStudy(study)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('admin.feasibility.duplicate')}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => generatePDF(study)}>
                            <FileDown className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('admin.feasibility.exportPdf')}</TooltipContent>
                      </Tooltip>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('admin.feasibility.deleteTitle')}</AlertDialogTitle>
                            <AlertDialogDescription>{t('admin.feasibility.deleteDescription')}</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('admin.actions.cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMutation.mutate(study.id)}>{t('admin.actions.delete')}</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
          </TabsContent>

        {/* Editor Dialog - moved outside TabsContent to be accessible from any tab */}
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          // Clear editingStudy only when closing the dialog (not when opening)
          if (!open) {
            // Small delay to allow closing animation before clearing state
            setTimeout(() => setEditingStudy(null), 150);
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                {editingStudy?.id ? t('admin.feasibility.editStudy') : t('admin.feasibility.newStudy')}
              </DialogTitle>
              <DialogDescription>{t('admin.feasibility.editorDescription')}</DialogDescription>
            </DialogHeader>

            {editingStudy && (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label>{t('admin.feasibility.studyName')}</Label>
                    <Input
                      value={editingStudy.study_name || ''}
                      onChange={(e) => handleFieldChange('study_name', e.target.value)}
                      placeholder={t('admin.feasibility.studyNamePlaceholder')}
                    />
                  </div>
                  <div>
                    <Label>{t('admin.feasibility.location')}</Label>
                    <Input
                      value={editingStudy.location || ''}
                      onChange={(e) => handleFieldChange('location', e.target.value)}
                      placeholder={t('admin.feasibility.locationPlaceholder')}
                    />
                  </div>
                  <div>
                    <Label>{t('admin.feasibility.country')}</Label>
                    <Select
                      value={editingStudy.country || ''}
                      onValueChange={(value) => handleFieldChange('country', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('admin.feasibility.selectCountry')} />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border shadow-lg z-50">
                        {countries.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="flex items-center gap-2">
                      {t('admin.feasibility.fiscalRegion', 'Região Fiscal')}
                      {selectedRegion && (
                        <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-700 dark:text-green-400">
                          {t('admin.feasibility.autoTax', 'Taxa Auto')}
                        </Badge>
                      )}
                    </Label>
                    <Select
                      value={selectedRegion}
                      onValueChange={handleRegionChange}
                      disabled={availableRegions.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          availableRegions.length === 0 
                            ? t('admin.feasibility.selectCountryFirst', 'Selecione o país primeiro')
                            : t('admin.feasibility.selectRegion', 'Selecionar região')
                        } />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border shadow-lg z-50">
                        {availableRegions.map(region => (
                          <SelectItem key={region.id} value={region.id}>
                            <div className="flex items-center justify-between gap-3 w-full">
                              <span>{t(`admin.feasibility.fiscalTable.regions.${region.nameKey}`, region.nameKey)}</span>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ml-2 ${
                                  region.effectiveTax < 15 
                                    ? 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30' 
                                    : region.effectiveTax < 25 
                                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30' 
                                      : 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30'
                                }`}
                              >
                                {region.effectiveTax}%
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedRegion && editingStudy?.country && (
                      <div className="mt-2 p-3 bg-muted/50 rounded-lg border">
                        {(() => {
                          const details = getRegionIncentiveDetails(editingStudy.country, selectedRegion);
                          if (!details) return null;
                          return (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium flex items-center gap-1">
                                  <TrendingUp className="h-3 w-3 text-green-500" />
                                  {t('admin.feasibility.taxApplied', 'Taxa efetiva aplicada automaticamente')}
                                </span>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-[10px]">
                                    {details.corporateTax}% → {details.effectiveTax}%
                                  </Badge>
                                  <Badge className="text-[10px] bg-green-500/20 text-green-700 border-green-500/30">
                                    -{details.savings}%
                                  </Badge>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-1">
                                {details.incentives.slice(0, 4).map((inc, idx) => (
                                  <Tooltip key={idx}>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center gap-1 text-[10px] p-1 bg-background rounded cursor-help hover:bg-muted transition-colors">
                                        <span className="font-medium text-primary">{inc.value}</span>
                                        <span className="text-muted-foreground truncate">{t(`admin.feasibility.fiscalTable.incentives.${inc.descKey}`, inc.descKey)}</span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-xs">
                                      <div className="space-y-1">
                                        <p className="font-medium">{t(`admin.feasibility.fiscalTable.incentives.${inc.descKey}`, inc.descKey)}</p>
                                        <p className="text-xs text-muted-foreground">{t('admin.feasibility.agency', 'Órgão')}: {inc.agency}</p>
                                        <p className="text-xs text-muted-foreground">{t('admin.feasibility.benefit', 'Benefício')}: {inc.value}</p>
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                ))}
                              </div>
                              {details.regulations.length > 0 && (
                                <p className="text-[9px] text-muted-foreground">
                                  📋 {details.regulations.join(' • ')}
                                </p>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Tire Category Selection - Multi-select */}
                <Card className="border-blue-500/50 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10">
                  <CardHeader className="py-3">
                    <CardTitle className="text-base flex items-center gap-2 text-blue-700 dark:text-blue-400">
                      <Circle className="h-4 w-4" />
                      {t('admin.feasibility.tireCategory.title', 'Categoria de Pneus')}
                      <Badge variant="outline" className="text-[10px] bg-blue-100 dark:bg-blue-900">
                        {selectedTireCategories.length} {t('admin.feasibility.tireCategory.selected', 'selecionadas')}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {t('admin.feasibility.tireCategory.multiDescription', 'Selecione uma ou mais categorias para análise combinada de yields, OPEX e bônus ambiental')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
                      {TIRE_CATEGORIES.map((category) => {
                        const isSelected = selectedTireCategories.includes(category.id);
                        const opexAdj = getTireCategoryOpexAdjustments(category.id);
                        const yields = getTireCategoryYields(category.id);
                        
                        const handleCategoryToggle = () => {
                          let newCategories: string[];
                          if (isSelected) {
                            // Don't allow empty selection
                            if (selectedTireCategories.length > 1) {
                              newCategories = selectedTireCategories.filter(id => id !== category.id);
                            } else {
                              return; // Keep at least one selected
                            }
                          } else {
                            newCategories = [...selectedTireCategories, category.id];
                          }
                          
                          setSelectedTireCategories(newCategories);
                          
                          // Calculate combined values for all selected categories
                          const combined = calculateMultiCategoryValues(newCategories);
                          if (combined) {
                            setEditingStudy(prev => prev ? {
                              ...prev,
                              rubber_granules_yield: combined.yields.rubber,
                              steel_wire_yield: combined.yields.steel,
                              textile_fiber_yield: combined.yields.textile,
                              rcb_yield: combined.yields.rcb,
                              daily_capacity_tons: combined.recommendedCapacity
                            } : prev);
                          }
                        };
                        
                        return (
                          <Tooltip key={category.id}>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className={`p-3 rounded-lg border-2 transition-all text-left relative ${
                                  isSelected
                                    ? 'border-blue-500 bg-blue-100/70 dark:bg-blue-900/40 ring-2 ring-blue-500/30'
                                    : 'border-muted hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-950/30'
                                }`}
                                onClick={handleCategoryToggle}
                              >
                                {/* Checkbox indicator */}
                                <div className={`absolute top-2 right-2 w-5 h-5 rounded-md border-2 flex items-center justify-center ${
                                  isSelected ? 'bg-blue-500 border-blue-500' : 'border-muted-foreground/50'
                                }`}>
                                  {isSelected && <Check className="h-3 w-3 text-white" />}
                                </div>
                                
                                <div className="text-2xl mb-1">{category.icon}</div>
                                <div className="font-medium text-sm pr-6">
                                  {t(`admin.feasibility.tireCategory.types.${category.nameKey}`, category.nameKey)}
                                </div>
                                <div className="text-[10px] text-muted-foreground mt-1">
                                  ~{category.avgWeight.toLocaleString()} kg/pneu
                                </div>
                                <div className="flex gap-1 mt-2">
                                  <Badge 
                                    variant="secondary" 
                                    className={`text-[9px] ${
                                      category.processingDifficulty === 'very_high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                      category.processingDifficulty === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                      category.processingDifficulty === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    }`}
                                  >
                                    {category.processingDifficulty === 'very_high' ? '🔴' :
                                     category.processingDifficulty === 'high' ? '🟠' :
                                     category.processingDifficulty === 'medium' ? '🟡' : '🟢'}
                                    {t(`admin.feasibility.tireCategory.difficulty.${category.processingDifficulty}`, category.processingDifficulty)}
                                  </Badge>
                                </div>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-sm">
                              <div className="space-y-2">
                                <p className="font-medium">{t(`admin.feasibility.tireCategory.types.${category.nameKey}`, category.nameKey)}</p>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-muted-foreground">{t('admin.feasibility.composition', 'Composição')}:</span>
                                    <div>🔵 {t('admin.feasibility.rubber', 'Borracha')}: {category.composition.rubber}%</div>
                                    <div>⚫ {t('admin.feasibility.steel', 'Aço')}: {category.composition.steel}%</div>
                                    <div>🟤 {t('admin.feasibility.textile', 'Têxtil')}: {category.composition.textile}%</div>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">OPEX Mult:</span>
                                    <div className={opexAdj.totalMultiplier > 1.1 ? 'text-orange-600' : 'text-green-600'}>
                                      {opexAdj.totalMultiplier.toFixed(2)}x
                                    </div>
                                    <span className="text-muted-foreground">{t('admin.feasibility.capacity', 'Capacidade')}:</span>
                                    <div>{category.recommendedCapacity} t/dia</div>
                                  </div>
                                </div>
                                <div className="text-[10px] text-muted-foreground">
                                  <span className="font-medium">{t('admin.feasibility.typicalSources', 'Fontes típicas')}:</span> {category.typicalSources.slice(0, 3).join(', ')}...
                                </div>
                                <div className="text-[10px]">{opexAdj.description}</div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                    
                    {/* Combined Categories Summary */}
                    {selectedTireCategories.length > 0 && combinedCategoryData && (
                      <div className="mt-4 p-3 bg-gradient-to-r from-blue-100/70 to-indigo-100/50 dark:from-blue-900/40 dark:to-indigo-900/30 rounded-lg border border-blue-300 dark:border-blue-700">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium text-sm flex items-center gap-2">
                            📊 {t('admin.feasibility.tireCategory.combinedSummary', 'Resumo Combinado')}
                            <Badge variant="secondary" className="text-[10px]">
                              {selectedTireCategories.length} {t('admin.feasibility.tireCategory.categoriesCount', 'categorias')}
                            </Badge>
                          </span>
                          <div className="flex gap-1">
                            {selectedTireCategories.map(catId => {
                              const cat = getTireCategory(catId);
                              return cat ? (
                                <span key={catId} className="text-lg">{cat.icon}</span>
                              ) : null;
                            })}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                          <div className="bg-white/60 dark:bg-gray-900/40 rounded p-2">
                            <span className="text-muted-foreground">{t('admin.feasibility.avgWeight', 'Peso Médio')}</span>
                            <div className="font-bold text-blue-600">{combinedCategoryData.avgWeight.toLocaleString()} kg</div>
                          </div>
                          <div className="bg-white/60 dark:bg-gray-900/40 rounded p-2">
                            <span className="text-muted-foreground">{t('admin.feasibility.capacity', 'Capacidade')}</span>
                            <div className="font-bold text-primary">{combinedCategoryData.recommendedCapacity} t/dia</div>
                          </div>
                          <div className="bg-white/60 dark:bg-gray-900/40 rounded p-2">
                            <span className="text-muted-foreground">{t('admin.feasibility.rubber', 'Borracha')}</span>
                            <div className="font-bold text-blue-600">{combinedCategoryData.composition.rubber}%</div>
                          </div>
                          <div className="bg-white/60 dark:bg-gray-900/40 rounded p-2">
                            <span className="text-muted-foreground">{t('admin.feasibility.steel', 'Aço')}</span>
                            <div className="font-bold text-gray-600">{combinedCategoryData.composition.steel}%</div>
                          </div>
                        </div>
                        
                        <div className="mt-2 flex flex-wrap gap-1">
                          {selectedTireCategories.map(catId => {
                            const cat = getTireCategory(catId);
                            return cat ? (
                              <Badge key={catId} variant="outline" className="text-[9px] bg-white/50 dark:bg-gray-900/30">
                                {cat.icon} {t(`admin.feasibility.tireCategory.types.${cat.nameKey}`, cat.nameKey)}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                {/* Export Price Calculator - After infrastructure for complete cost picture */}
                {dialogReady && (
                  <ExportPriceCalculator
                    rubberGranulesPrice={editingStudy.rubber_granules_price || 250}
                    steelWirePrice={editingStudy.steel_wire_price || 250}
                    textileFiberPrice={editingStudy.textile_fiber_price || 120}
                    rcbPrice={editingStudy.rcb_price || 1050}
                    annualTonnage={
                      (editingStudy.daily_capacity_tons || 85) * 
                      (editingStudy.operating_days_per_year || 300) * 
                      ((editingStudy.utilization_rate || 85) / 100)
                    }
                    rubberGranulesYield={editingStudy.rubber_granules_yield || 43}
                    steelWireYield={editingStudy.steel_wire_yield || 25}
                    textileFiberYield={editingStudy.textile_fiber_yield || 8}
                    rcbYield={editingStudy.rcb_yield || 12}
                  />
                )}

                {/* Plant Configuration */}
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Factory className="h-4 w-4" />
                      {t('admin.feasibility.plantConfig')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <Label className="text-sm">{t('admin.feasibility.dailyCapacity')}</Label>
                          <span className="font-bold text-primary">{editingStudy.daily_capacity_tons} t/day</span>
                        </div>
                        <Slider
                          value={[editingStudy.daily_capacity_tons || 50]}
                          onValueChange={(value) => handleFieldChange('daily_capacity_tons', value[0])}
                          min={10}
                          max={200}
                          step={5}
                        />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <Label className="text-sm">{t('admin.feasibility.operatingDays')}</Label>
                          <span className="font-bold text-primary">{editingStudy.operating_days_per_year} days</span>
                        </div>
                        <Slider
                          value={[editingStudy.operating_days_per_year || 300]}
                          onValueChange={(value) => handleFieldChange('operating_days_per_year', value[0])}
                          min={200}
                          max={360}
                          step={5}
                        />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <Label className="text-sm">{t('admin.feasibility.utilizationRate')}</Label>
                          <span className="font-bold text-primary">{editingStudy.utilization_rate}%</span>
                        </div>
                        <Slider
                          value={[editingStudy.utilization_rate || 85]}
                          onValueChange={(value) => handleFieldChange('utilization_rate', value[0])}
                          min={50}
                          max={95}
                          step={5}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* CAPEX Section - With Integrated Infrastructure Calculator */}
                <Collapsible open={expandedSections.capex} onOpenChange={() => toggleSection('capex')}>
                  <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-50/30 to-green-50/20 dark:from-emerald-950/20 dark:to-green-950/10">
                    <CollapsibleTrigger asChild>
                      <CardHeader className="py-3 cursor-pointer hover:bg-muted/50 transition-colors">
                        <CardTitle className="text-base flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-emerald-600" />
                            {t('admin.feasibility.capex')} - {formatCurrency(liveCalculations?.total_investment || 0)}
                            <Badge variant="outline" className="text-[9px] bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border-emerald-300">
                              <Calculator className="h-3 w-3 mr-1" />
                              Auto
                            </Badge>
                          </span>
                          {expandedSections.capex ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </CardTitle>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0 space-y-4">
                        {/* Infrastructure Cost Calculator - INSIDE CAPEX Section */}
                        {dialogReady && (
                          <div className="p-3 bg-gradient-to-r from-amber-50 to-emerald-50 dark:from-amber-950/30 dark:to-emerald-950/30 rounded-lg border border-amber-200 dark:border-amber-800 mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Calculator className="h-4 w-4 text-amber-600" />
                              <span className="font-medium text-sm text-amber-800 dark:text-amber-300">
                                Calculadora Automática de Custos
                              </span>
                              <Badge variant="secondary" className="text-[9px]">
                                Terreno + Energia + Mão de Obra
                              </Badge>
                            </div>
                            <p className="text-[10px] text-muted-foreground mb-3">
                              ⬇️ Configure os inputs abaixo para calcular automaticamente os custos de infraestrutura, energia e equipe baseado no país selecionado.
                            </p>
                            <InfrastructureCostCalculator
                              dailyCapacity={editingStudy.daily_capacity_tons || 85}
                              equipmentCost={editingStudy.equipment_cost || 2000000}
                              operatingDaysPerMonth={Math.round((editingStudy.operating_days_per_year || 300) / 12)}
                              currentEnergyCost={editingStudy.energy_cost}
                              currentLaborCost={editingStudy.labor_cost}
                              currentInfrastructureCost={editingStudy.infrastructure_cost}
                              currentInstallationCost={editingStudy.installation_cost}
                              selectedCountry={editingStudy.country}
                              onCostsCalculated={(costs) => {
                                handleFieldChange('energy_cost', costs.energy_cost);
                                handleFieldChange('labor_cost', costs.labor_cost);
                                handleFieldChange('infrastructure_cost', costs.infrastructure_cost);
                                handleFieldChange('installation_cost', costs.installation_cost);
                                handleFieldChange('maintenance_cost', costs.maintenance_cost);
                                handleFieldChange('administrative_cost', costs.administrative_cost);
                                handleFieldChange('logistics_cost', costs.logistics_cost);
                                handleFieldChange('working_capital', costs.working_capital);
                              }}
                            />
                          </div>
                        )}
                        
                        {/* CAPEX Input Fields */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                          {[
                            { key: 'equipment_cost', icon: Wrench, label: t('admin.feasibility.equipmentCost'), autoCalc: false },
                            { key: 'installation_cost', icon: Factory, label: t('admin.feasibility.installationCost'), autoCalc: true },
                            { key: 'infrastructure_cost', icon: Building, label: t('admin.feasibility.infrastructureCost'), autoCalc: true },
                            { key: 'working_capital', icon: DollarSign, label: t('admin.feasibility.workingCapital'), autoCalc: true },
                            { key: 'other_capex', icon: Plus, label: t('admin.feasibility.otherCapex'), autoCalc: false },
                          ].map(({ key, icon: Icon, label, autoCalc }) => (
                            <div key={key} className={autoCalc ? 'relative' : ''}>
                              <Label className="text-xs flex items-center gap-1">
                                <Icon className="h-3 w-3" />
                                {label}
                                {autoCalc && (
                                  <Badge variant="secondary" className="text-[8px] px-1 py-0 ml-1 bg-amber-100 text-amber-700">
                                    Auto
                                  </Badge>
                                )}
                              </Label>
                              <Input
                                type="number"
                                value={(editingStudy as any)[key] || 0}
                                onChange={(e) => handleFieldChange(key as keyof FeasibilityStudy, Number(e.target.value))}
                                className={autoCalc ? 'border-amber-300 dark:border-amber-700' : ''}
                              />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* OPEX Section - With Auto-Calculated Fields */}
                <Collapsible open={expandedSections.opex} onOpenChange={() => toggleSection('opex')}>
                  <Card className="border-purple-500/30 bg-gradient-to-br from-purple-50/30 to-violet-50/20 dark:from-purple-950/20 dark:to-violet-950/10">
                    <CollapsibleTrigger asChild>
                      <CardHeader className="py-3 cursor-pointer hover:bg-muted/50 transition-colors">
                        <CardTitle className="text-base flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-purple-600" />
                            {t('admin.feasibility.opex')} - {formatCurrency((liveCalculations?.annual_opex || 0) / 12)}/month
                            <Badge variant="outline" className="text-[9px] bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 border-purple-300">
                              <Calculator className="h-3 w-3 mr-1" />
                              Auto
                            </Badge>
                          </span>
                          {expandedSections.opex ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </CardTitle>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0 space-y-4">
                        {/* Info Banner about Auto-Calculation */}
                        <div className="p-3 bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-950/50 dark:to-violet-950/50 rounded-lg border border-purple-200 dark:border-purple-800">
                          <div className="flex items-center gap-2 text-sm text-purple-800 dark:text-purple-300">
                            <Calculator className="h-4 w-4" />
                            <span className="font-medium">Campos com badge "Auto" são calculados automaticamente</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            ⬆️ Abra a seção CAPEX acima para configurar Energia (kW), Terreno (m²) e Mão de Obra - os valores serão atualizados automaticamente aqui.
                          </p>
                        </div>
                        
                        {/* OPEX Input Fields */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {[
                            { key: 'raw_material_cost', icon: Factory, label: t('admin.feasibility.rawMaterialCost'), autoCalc: false },
                            { key: 'labor_cost', icon: Users, label: t('admin.feasibility.laborCost'), autoCalc: true },
                            { key: 'energy_cost', icon: Zap, label: t('admin.feasibility.energyCost'), autoCalc: true },
                            { key: 'maintenance_cost', icon: Wrench, label: t('admin.feasibility.maintenanceCost'), autoCalc: true },
                            { key: 'logistics_cost', icon: Truck, label: t('admin.feasibility.logisticsCost'), autoCalc: true },
                            { key: 'administrative_cost', icon: Building, label: t('admin.feasibility.administrativeCost'), autoCalc: true },
                            { key: 'other_opex', icon: Plus, label: t('admin.feasibility.otherOpex'), autoCalc: false },
                          ].map(({ key, icon: Icon, label, autoCalc }) => (
                            <div key={key} className={autoCalc ? 'relative' : ''}>
                              <Label className="text-xs flex items-center gap-1">
                                <Icon className="h-3 w-3" />
                                {label} (USD/month)
                                {autoCalc && (
                                  <Badge variant="secondary" className="text-[8px] px-1 py-0 ml-1 bg-purple-100 text-purple-700">
                                    Auto
                                  </Badge>
                                )}
                              </Label>
                              <Input
                                type="number"
                                value={(editingStudy as any)[key] || 0}
                                onChange={(e) => handleFieldChange(key as keyof FeasibilityStudy, Number(e.target.value))}
                                className={autoCalc ? 'border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/30' : ''}
                              />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* Revenue Section - With Auto-Calculated Yields */}
                <Collapsible open={expandedSections.revenue} onOpenChange={() => toggleSection('revenue')}>
                  <Card className="border-green-500/30 bg-gradient-to-br from-green-50/30 to-emerald-50/20 dark:from-green-950/20 dark:to-emerald-950/10">
                    <CollapsibleTrigger asChild>
                      <CardHeader className="py-3 cursor-pointer hover:bg-muted/50 transition-colors">
                        <CardTitle className="text-base flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-green-600" />
                            {t('admin.feasibility.revenue')} - {formatCurrency(liveCalculations?.annual_revenue || 0)}/year
                            <Badge variant="outline" className="text-[9px] bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-300">
                              <Calculator className="h-3 w-3 mr-1" />
                              Yields Auto
                            </Badge>
                          </span>
                          {expandedSections.revenue ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </CardTitle>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0 space-y-4">
                        {/* Info Banner about Auto-Calculation */}
                        <div className="p-3 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-950/50 dark:to-emerald-950/50 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-2 text-sm text-green-800 dark:text-green-300">
                            <Calculator className="h-4 w-4" />
                            <span className="font-medium">Yields calculados automaticamente pelos modelos de pneus selecionados</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            ⬆️ Selecione modelos específicos na seção "Modelos de Pneus" abaixo para usar a composição exata. 
                            Se nenhum modelo estiver selecionado, usa a média da categoria.
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* Rubber Granules */}
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm flex items-center gap-1">
                              {t('admin.feasibility.rubberGranules')}
                              <Badge variant="secondary" className="text-[8px] px-1 py-0 ml-1 bg-green-100 text-green-700">
                                Yield Auto
                              </Badge>
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs">{t('admin.feasibility.pricePerTon')}</Label>
                                <Input
                                  type="number"
                                  value={editingStudy.rubber_granules_price || 0}
                                  onChange={(e) => handleFieldChange('rubber_granules_price', Number(e.target.value))}
                                />
                              </div>
                              <div>
                                <Label className="text-xs">{t('admin.feasibility.yieldPercent')}</Label>
                                <Input
                                  type="number"
                                  value={editingStudy.rubber_granules_yield || 0}
                                  onChange={(e) => handleFieldChange('rubber_granules_yield', Number(e.target.value))}
                                  className="border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-950/30"
                                />
                              </div>
                            </div>
                          </div>
                          {/* Steel Wire */}
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm flex items-center gap-1">
                              {t('admin.feasibility.steelWire')}
                              <Badge variant="secondary" className="text-[8px] px-1 py-0 ml-1 bg-green-100 text-green-700">
                                Yield Auto
                              </Badge>
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs">{t('admin.feasibility.pricePerTon')}</Label>
                                <Input
                                  type="number"
                                  value={editingStudy.steel_wire_price || 0}
                                  onChange={(e) => handleFieldChange('steel_wire_price', Number(e.target.value))}
                                />
                              </div>
                              <div>
                                <Label className="text-xs">{t('admin.feasibility.yieldPercent')}</Label>
                                <Input
                                  type="number"
                                  value={editingStudy.steel_wire_yield || 0}
                                  onChange={(e) => handleFieldChange('steel_wire_yield', Number(e.target.value))}
                                  className="border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-950/30"
                                />
                              </div>
                            </div>
                          </div>
                          {/* Textile Fiber */}
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm flex items-center gap-1">
                              {t('admin.feasibility.textileFiber')}
                              <Badge variant="secondary" className="text-[8px] px-1 py-0 ml-1 bg-green-100 text-green-700">
                                Yield Auto
                              </Badge>
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs">{t('admin.feasibility.pricePerTon')}</Label>
                                <Input
                                  type="number"
                                  value={editingStudy.textile_fiber_price || 0}
                                  onChange={(e) => handleFieldChange('textile_fiber_price', Number(e.target.value))}
                                />
                              </div>
                              <div>
                                <Label className="text-xs">{t('admin.feasibility.yieldPercent')}</Label>
                                <Input
                                  type="number"
                                  value={editingStudy.textile_fiber_yield || 0}
                                  onChange={(e) => handleFieldChange('textile_fiber_yield', Number(e.target.value))}
                                  className="border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-950/30"
                                />
                              </div>
                            </div>
                          </div>
                          {/* Recovered Carbon Black (rCB) */}
                          <div className="space-y-2 bg-purple-50 dark:bg-purple-950/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                            <h4 className="font-medium text-sm flex items-center gap-2 text-purple-700 dark:text-purple-300">
                              ⚫ {t('admin.feasibility.rcb', 'rCB (Recovered Carbon Black)')}
                              <Badge variant="secondary" className="text-[10px]">Premium</Badge>
                              <Badge variant="secondary" className="text-[8px] px-1 py-0 bg-green-100 text-green-700">
                                Yield Auto
                              </Badge>
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs">{t('admin.feasibility.pricePerTon')}</Label>
                                <Input
                                  type="number"
                                  value={editingStudy.rcb_price || 1000}
                                  onChange={(e) => handleFieldChange('rcb_price', Number(e.target.value))}
                                  className="border-purple-300"
                                />
                                <span className="text-[10px] text-muted-foreground">Market: $800-1,200/ton</span>
                              </div>
                              <div>
                                <Label className="text-xs">{t('admin.feasibility.yieldPercent')}</Label>
                                <Input
                                  type="number"
                                  value={editingStudy.rcb_yield || 12}
                                  onChange={(e) => handleFieldChange('rcb_yield', Number(e.target.value))}
                                  className="border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-950/30"
                                />
                                <span className="text-[10px] text-muted-foreground">Pyrolysis: 10-15%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* Financial Parameters */}
                <Collapsible open={expandedSections.financial} onOpenChange={() => toggleSection('financial')}>
                  <Card>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="py-3 cursor-pointer hover:bg-muted/50 transition-colors">
                        <CardTitle className="text-base flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Percent className="h-4 w-4" />
                            {t('admin.feasibility.financialParams')}
                          </span>
                          {expandedSections.financial ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </CardTitle>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <Label className="text-xs">{t('admin.feasibility.taxRate')} (%)</Label>
                            <Input
                              type="number"
                              value={editingStudy.tax_rate || 0}
                              onChange={(e) => handleFieldChange('tax_rate', Number(e.target.value))}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">{t('admin.feasibility.depreciationYears')}</Label>
                            <Input
                              type="number"
                              value={editingStudy.depreciation_years || 0}
                              onChange={(e) => handleFieldChange('depreciation_years', Number(e.target.value))}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">{t('admin.feasibility.discountRate')} (%)</Label>
                            <Input
                              type="number"
                              value={editingStudy.discount_rate || 0}
                              onChange={(e) => handleFieldChange('discount_rate', Number(e.target.value))}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">{t('admin.feasibility.inflationRate')} (%)</Label>
                            <Input
                              type="number"
                              value={editingStudy.inflation_rate || 0}
                              onChange={(e) => handleFieldChange('inflation_rate', Number(e.target.value))}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* Government Partnership Model Section - Real Data January 2026 */}
                <Card className="border-amber-500/50 bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10">
                  <CardHeader className="py-3">
                    <CardTitle className="text-base flex items-center gap-2 text-amber-700 dark:text-amber-400">
                      <Scale className="h-4 w-4" />
                      {t('admin.feasibility.govPartnership.title')}
                      <Badge variant="outline" className="text-[10px] bg-amber-100 dark:bg-amber-900">
                        📊 Jan 2026
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {t('admin.feasibility.govPartnership.description')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Country-specific partnership data display */}
                    {editingStudy.country && (() => {
                      const partnershipData = getGovernmentPartnershipData(editingStudy.country);
                      if (!partnershipData) return null;
                      
                      return (
                        <div className="p-3 bg-gradient-to-r from-amber-100/60 to-orange-100/40 dark:from-amber-900/30 dark:to-orange-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium flex items-center gap-2">
                              {partnershipData.flag} {t('admin.feasibility.govPartnership.countryPrograms', 'Programas do País')}
                            </span>
                            <Badge variant="outline" className="text-[9px]">
                              {partnershipData.marketReference}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {partnershipData.governmentModels.map((model) => (
                              <Tooltip key={model.id}>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    className={`text-left p-2 rounded border transition-all text-xs ${
                                      editingStudy.collection_model && model.collectionModels.includes(editingStudy.collection_model)
                                        ? 'border-amber-500 bg-amber-200/50 dark:bg-amber-800/30'
                                        : 'border-amber-200 dark:border-amber-700 hover:border-amber-400'
                                    }`}
                                    onClick={() => {
                                      // Auto-fill recommended values
                                      handleFieldChange('government_royalties_percent', model.royaltyRange.recommended);
                                      handleFieldChange('environmental_bonus_per_ton', model.envBonusRange.recommended);
                                      if (model.collectionModels.length > 0) {
                                        handleFieldChange('collection_model', model.collectionModels[0]);
                                      }
                                    }}
                                  >
                                    <div className="font-medium text-amber-800 dark:text-amber-300 truncate">
                                      {t(`admin.feasibility.govPartnership.models.${model.nameKey}`, model.nameKey)}
                                    </div>
                                    <div className="flex gap-2 mt-1">
                                      <span className="text-muted-foreground">
                                        📈 {model.royaltyRange.min}-{model.royaltyRange.max}%
                                      </span>
                                      <span className="text-green-600 dark:text-green-400">
                                        🌱 ${model.envBonusRange.min}-{model.envBonusRange.max}/t
                                      </span>
                                    </div>
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-sm">
                                  <div className="space-y-2">
                                    <p className="font-medium">{model.description}</p>
                                    <div>
                                      <span className="text-xs text-muted-foreground">{t('admin.feasibility.govPartnership.regulations', 'Regulamentações')}:</span>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {model.regulations.map((reg, i) => (
                                          <Badge key={i} variant="secondary" className="text-[9px]">{reg}</Badge>
                                        ))}
                                      </div>
                                    </div>
                                    <div>
                                      <span className="text-xs text-muted-foreground">{t('admin.feasibility.govPartnership.benefits', 'Benefícios')}:</span>
                                      <ul className="text-xs mt-1 list-disc list-inside">
                                        {model.benefits.map((benefit, i) => (
                                          <li key={i}>{benefit}</li>
                                        ))}
                                      </ul>
                                    </div>
                                    <p className="text-[10px] text-amber-600">
                                      💡 {t('admin.feasibility.govPartnership.clickToApply', 'Clique para aplicar valores recomendados')}
                                    </p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs">{t('admin.feasibility.govPartnership.collectionModel')}</Label>
                        <Select
                          value={editingStudy.collection_model || 'direct'}
                          onValueChange={(value) => {
                            handleFieldChange('collection_model', value);
                            // Auto-suggest recommended terms based on country and model
                            if (editingStudy.country) {
                              const terms = getRecommendedPartnershipTerms(editingStudy.country, value);
                              if (terms) {
                                handleFieldChange('government_royalties_percent', terms.royalty);
                                handleFieldChange('environmental_bonus_per_ton', terms.envBonus);
                              }
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="direct">
                              🏭 {t('admin.feasibility.govPartnership.modelDirect')}
                            </SelectItem>
                            <SelectItem value="government">
                              🏛️ {t('admin.feasibility.govPartnership.modelGovernment')}
                            </SelectItem>
                            <SelectItem value="mining">
                              ⛏️ {t('admin.feasibility.govPartnership.modelMining')}
                            </SelectItem>
                            <SelectItem value="hybrid">
                              🔄 {t('admin.feasibility.govPartnership.modelHybrid')}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">{t('admin.feasibility.govPartnership.royalties')} (%)</Label>
                          {editingStudy.country && (() => {
                            const data = getGovernmentPartnershipData(editingStudy.country);
                            return data ? (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge variant="outline" className="text-[9px] cursor-help">
                                    📊 0-15% {t('admin.feasibility.govPartnership.typical', 'típico')}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{t('admin.feasibility.govPartnership.royaltyExplanation', 'Percentual da receita destinada ao governo parceiro. Varia de 0% (parceria direta mineradora) a 15% (parceria governamental completa).')}</p>
                                </TooltipContent>
                              </Tooltip>
                            ) : null;
                          })()}
                        </div>
                        <Input
                          type="number"
                          value={editingStudy.government_royalties_percent || 0}
                          onChange={(e) => handleFieldChange('government_royalties_percent', Number(e.target.value))}
                          placeholder="5"
                          min={0}
                          max={25}
                          step={0.5}
                        />
                        <span className="text-[10px] text-muted-foreground">
                          {t('admin.feasibility.govPartnership.royaltiesHint')}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">{t('admin.feasibility.govPartnership.envBonus')} (USD/ton)</Label>
                          {editingStudy.country && (() => {
                            const data = getGovernmentPartnershipData(editingStudy.country);
                            return data ? (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge variant="outline" className="text-[9px] cursor-help bg-green-50 dark:bg-green-950">
                                    🌱 ${data.defaultEnvBonus}/t {t('admin.feasibility.govPartnership.market', 'mercado')}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{t('admin.feasibility.govPartnership.envBonusExplanation', 'Bônus ambiental por tonelada de pneu OTR destinado corretamente. Baseado em programas como Reciclanip (Brasil), TSA (Austrália), Ecopneus (Itália).')}</p>
                                </TooltipContent>
                              </Tooltip>
                            ) : null;
                          })()}
                        </div>
                        <Input
                          type="number"
                          value={editingStudy.environmental_bonus_per_ton || 0}
                          onChange={(e) => handleFieldChange('environmental_bonus_per_ton', Number(e.target.value))}
                          placeholder="20"
                          min={0}
                          max={50}
                          step={1}
                        />
                        <span className="text-[10px] text-muted-foreground">
                          {t('admin.feasibility.govPartnership.envBonusHint')}
                        </span>
                      </div>
                    </div>
                    
                    {/* Real Impact Calculation Display */}
                    {(() => {
                      const annualTonnage = (editingStudy.daily_capacity_tons || 0) * (editingStudy.operating_days_per_year || 0) * ((editingStudy.utilization_rate || 0) / 100);
                      const impact = calculateGovernmentPartnershipImpact(
                        liveCalculations?.annual_revenue || 0,
                        annualTonnage,
                        editingStudy.government_royalties_percent || 0,
                        editingStudy.environmental_bonus_per_ton || 0
                      );
                      
                      if (impact.annualRoyalties === 0 && impact.annualEnvBonus === 0) return null;
                      
                      // Calculate adjusted ROI
                      const adjustedEbitda = (liveCalculations?.annual_ebitda || 0) - impact.annualRoyalties + impact.annualEnvBonus;
                      const adjustedRoi = (liveCalculations?.total_investment || 0) > 0 
                        ? (adjustedEbitda / (liveCalculations?.total_investment || 1)) * 100 
                        : 0;
                      const adjustedPayback = adjustedEbitda > 0 
                        ? Math.ceil(((liveCalculations?.total_investment || 0) / adjustedEbitda) * 12) 
                        : 999;
                      
                      return (
                        <div className="p-4 bg-gradient-to-r from-amber-100/70 to-green-100/50 dark:from-amber-900/30 dark:to-green-900/20 rounded-lg border border-amber-300 dark:border-amber-700">
                          <h5 className="font-medium text-sm text-amber-800 dark:text-amber-300 mb-3 flex items-center gap-2">
                            📊 {t('admin.feasibility.govPartnership.impactTitle')}
                            <Badge variant="outline" className="text-[9px]">
                              {t('admin.feasibility.govPartnership.realTimeCalc', 'Cálculo em Tempo Real')}
                            </Badge>
                          </h5>
                          
                          <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 xl:grid-cols-6 text-xs">
                            {/* Royalties (Cost) */}
                            <div className="bg-white/50 dark:bg-gray-900/30 rounded-lg p-2 text-center border border-red-200 dark:border-red-800">
                              <span className="text-muted-foreground block text-[10px]">
                                {t('admin.feasibility.govPartnership.annualRoyalties')}
                              </span>
                              <span className="font-bold text-red-600 dark:text-red-400 text-sm">
                                -{formatCurrency(impact.annualRoyalties)}
                              </span>
                              <span className="text-[9px] text-muted-foreground block">
                                ({editingStudy.government_royalties_percent || 0}% {t('admin.feasibility.govPartnership.ofRevenue', 'da receita')})
                              </span>
                            </div>
                            
                            {/* Environmental Bonus (Income) */}
                            <div className="bg-white/50 dark:bg-gray-900/30 rounded-lg p-2 text-center border border-green-200 dark:border-green-800">
                              <span className="text-muted-foreground block text-[10px]">
                                {t('admin.feasibility.govPartnership.annualEnvBonus')}
                              </span>
                              <span className="font-bold text-green-600 dark:text-green-400 text-sm">
                                +{formatCurrency(impact.annualEnvBonus)}
                              </span>
                              <span className="text-[9px] text-muted-foreground block">
                                (${editingStudy.environmental_bonus_per_ton || 0}/t × {formatNumber(annualTonnage)}t)
                              </span>
                            </div>
                            
                            {/* Net Impact */}
                            <div className={`bg-white/50 dark:bg-gray-900/30 rounded-lg p-2 text-center border ${impact.netImpact >= 0 ? 'border-green-300 dark:border-green-700' : 'border-red-300 dark:border-red-700'}`}>
                              <span className="text-muted-foreground block text-[10px]">
                                {t('admin.feasibility.govPartnership.netImpact', 'Impacto Líquido')}
                              </span>
                              <span className={`font-bold text-sm ${impact.netImpact >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {impact.netImpact >= 0 ? '+' : ''}{formatCurrency(impact.netImpact)}
                              </span>
                              <span className="text-[9px] text-muted-foreground block">
                                {t('admin.feasibility.govPartnership.perYear', '/ano')}
                              </span>
                            </div>
                            
                            {/* Net Revenue */}
                            <div className="bg-white/50 dark:bg-gray-900/30 rounded-lg p-2 text-center border border-blue-200 dark:border-blue-800">
                              <span className="text-muted-foreground block text-[10px]">
                                {t('admin.feasibility.govPartnership.netRevenue')}
                              </span>
                              <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">
                                {formatCurrency(impact.netRevenue)}
                              </span>
                              <span className="text-[9px] text-muted-foreground block">
                                ({impact.adjustedRevenuePercent.toFixed(1)}% {t('admin.feasibility.govPartnership.ofOriginal', 'do original')})
                              </span>
                            </div>
                            
                            {/* Adjusted ROI */}
                            <div className={`bg-white/50 dark:bg-gray-900/30 rounded-lg p-2 text-center border ${adjustedRoi >= (liveCalculations?.roi_percentage || 0) ? 'border-green-300 dark:border-green-700' : 'border-orange-300 dark:border-orange-700'}`}>
                              <span className="text-muted-foreground block text-[10px]">
                                {t('admin.feasibility.govPartnership.adjustedRoi')}
                              </span>
                              <span className={`font-bold text-sm ${adjustedRoi >= (liveCalculations?.roi_percentage || 0) ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                                {adjustedRoi.toFixed(1)}%
                              </span>
                              <span className="text-[9px] text-muted-foreground block">
                                ({adjustedRoi >= (liveCalculations?.roi_percentage || 0) ? '↑' : '↓'} {t('admin.feasibility.govPartnership.vsBase', 'vs base')}: {(liveCalculations?.roi_percentage || 0).toFixed(1)}%)
                              </span>
                            </div>
                            
                            {/* Adjusted Payback */}
                            <div className="bg-white/50 dark:bg-gray-900/30 rounded-lg p-2 text-center border border-purple-200 dark:border-purple-800">
                              <span className="text-muted-foreground block text-[10px]">
                                {t('admin.feasibility.govPartnership.adjustedPayback', 'Payback Ajustado')}
                              </span>
                              <span className="font-bold text-purple-600 dark:text-purple-400 text-sm">
                                {adjustedPayback > 120 ? '>10' : adjustedPayback} {t('admin.feasibility.months')}
                              </span>
                              <span className="text-[9px] text-muted-foreground block">
                                ({t('admin.feasibility.govPartnership.vsBase', 'vs base')}: {liveCalculations?.payback_months || 0})
                              </span>
                            </div>
                          </div>
                          
                          {/* Recommendation badge */}
                          {impact.netImpact > 0 && (
                            <div className="mt-3 flex items-center gap-2 text-[11px] text-green-700 dark:text-green-400">
                              <span className="text-lg">✅</span>
                              {t('admin.feasibility.govPartnership.positiveRecommendation', 'Parceria governamental com impacto positivo! O bônus ambiental supera os royalties.')}
                            </div>
                          )}
                          {impact.netImpact < 0 && impact.netImpact > -impact.annualRoyalties * 0.5 && (
                            <div className="mt-3 flex items-center gap-2 text-[11px] text-orange-700 dark:text-orange-400">
                              <span className="text-lg">⚠️</span>
                              {t('admin.feasibility.govPartnership.neutralRecommendation', 'Impacto neutro/ligeiramente negativo. Considere negociar maiores bônus ambientais ou menores royalties.')}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* Tire Model Selector - Lazy loaded (shows first selected category) */}
                {dialogReady && selectedTireCategories.length > 0 && (
                  <TireModelSelector
                    selectedCategories={selectedTireCategories}
                    selectedModels={selectedTireModels}
                    onModelsChange={setSelectedTireModels}
                    onCalculatedValues={(values) => {
                      // Update yields based on selected tire models
                      // When models are selected, use their specific composition percentages
                      handleFieldChange('rubber_granules_yield', values.recommendedYields.rubber);
                      handleFieldChange('steel_wire_yield', values.recommendedYields.steel);
                      handleFieldChange('textile_fiber_yield', values.recommendedYields.textile);
                      handleFieldChange('rcb_yield', values.recommendedYields.rcb);
                    }}
                  />
                )}

                {/* Partnership Scenario Comparison Chart - Lazy loaded */}
                {dialogReady && liveCalculations && (editingStudy.government_royalties_percent || editingStudy.environmental_bonus_per_ton) && (
                  <PartnershipScenarioChart
                    baseRevenue={liveCalculations.annual_revenue}
                    baseRoi={liveCalculations.roi_percentage}
                    basePayback={liveCalculations.payback_months}
                    annualTonnage={(editingStudy.daily_capacity_tons || 0) * (editingStudy.operating_days_per_year || 0) * ((editingStudy.utilization_rate || 0) / 100)}
                    totalInvestment={liveCalculations.total_investment}
                    currentRoyalty={editingStudy.government_royalties_percent || 0}
                    currentEnvBonus={editingStudy.environmental_bonus_per_ton || 0}
                    countryName={editingStudy.country || undefined}
                    // New props for accurate country-specific calculations
                    baseEbitda={liveCalculations.annual_ebitda}
                    taxRate={editingStudy.tax_rate || 25}
                    depreciationYears={editingStudy.depreciation_years || 10}
                  />
                )}

                {/* Calculation Reference Panel - Shows formulas + benchmarks */}
                {dialogReady && liveCalculations && (
                  <CalculationReferencePanel
                    country={editingStudy.country || 'Brasil'}
                    taxRate={editingStudy.tax_rate || 25}
                    discountRate={editingStudy.discount_rate || 12}
                    depreciationYears={editingStudy.depreciation_years || 10}
                    dailyCapacity={editingStudy.daily_capacity_tons || 85}
                    operatingDays={editingStudy.operating_days_per_year || 300}
                    utilizationRate={editingStudy.utilization_rate || 85}
                    totalInvestment={liveCalculations.total_investment}
                    annualRevenue={liveCalculations.annual_revenue}
                    annualOpex={liveCalculations.annual_opex}
                    annualEbitda={liveCalculations.annual_ebitda}
                    roiPercentage={liveCalculations.roi_percentage}
                    paybackMonths={liveCalculations.payback_months}
                    irrPercentage={liveCalculations.irr_percentage}
                    npv10Years={liveCalculations.npv_10_years}
                    governmentRoyalties={editingStudy.government_royalties_percent}
                    environmentalBonus={editingStudy.environmental_bonus_per_ton}
                  />
                )}

                {/* Live Results */}
                {liveCalculations && (
                  <Card className="bg-gradient-to-br from-primary/5 to-emerald-500/5 border-primary/20">
                    <CardHeader className="py-3">
                      <CardTitle className="text-base">{t('admin.feasibility.results')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                        <div className="bg-background/50 rounded-xl p-3 text-center">
                          <DollarSign className="h-5 w-5 text-primary mx-auto mb-1" />
                          <span className="text-xs text-muted-foreground block">{t('admin.feasibility.totalInvestment')}</span>
                          <span className="font-bold text-lg">{formatCurrency(liveCalculations.total_investment)}</span>
                        </div>
                        <div className="bg-background/50 rounded-xl p-3 text-center">
                          <BarChart3 className="h-5 w-5 text-green-500 mx-auto mb-1" />
                          <span className="text-xs text-muted-foreground block">{t('admin.feasibility.annualEbitda')}</span>
                          <span className="font-bold text-lg text-green-600">{formatCurrency(liveCalculations.annual_ebitda)}</span>
                        </div>
                        <div className="bg-background/50 rounded-xl p-3 text-center">
                          <Clock className="h-5 w-5 text-orange-500 mx-auto mb-1" />
                          <span className="text-xs text-muted-foreground block">{t('admin.feasibility.paybackPeriod')}</span>
                          <span className="font-bold text-lg text-orange-600">
                            {liveCalculations.payback_months > 120 ? '> 10 years' : `${liveCalculations.payback_months} ${t('admin.feasibility.months')}`}
                          </span>
                        </div>
                        <div className="bg-background/50 rounded-xl p-3 text-center">
                          <Percent className="h-5 w-5 text-primary mx-auto mb-1" />
                          <span className="text-xs text-muted-foreground block">{t('admin.feasibility.roi')}</span>
                          <span className="font-bold text-lg text-primary">{liveCalculations.roi_percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-primary/10 to-emerald-500/10 rounded-xl p-3 text-center border border-primary/20">
                          <span className="text-xs text-muted-foreground block">{t('admin.feasibility.npv10Years')}</span>
                          <span className={`font-bold text-xl ${liveCalculations.npv_10_years >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(liveCalculations.npv_10_years)}
                          </span>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-xl p-3 text-center border border-emerald-500/20">
                          <span className="text-xs text-muted-foreground block">{t('admin.feasibility.irr')}</span>
                          <span className={`font-bold text-xl ${liveCalculations.irr_percentage >= (editingStudy.discount_rate || 12) ? 'text-green-600' : 'text-orange-600'}`}>
                            {liveCalculations.irr_percentage > 0 ? `${liveCalculations.irr_percentage.toFixed(1)}%` : 'N/A'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Validation Alerts - Industry Benchmark Comparison */}
                      <FeasibilityValidationAlerts
                        dailyCapacity={editingStudy.daily_capacity_tons || 85}
                        operatingDays={editingStudy.operating_days_per_year || 300}
                        utilizationRate={editingStudy.utilization_rate || 85}
                        totalInvestment={liveCalculations.total_investment}
                        annualRevenue={liveCalculations.annual_revenue}
                        annualOpex={liveCalculations.annual_opex}
                        annualEbitda={liveCalculations.annual_ebitda}
                        roiPercentage={liveCalculations.roi_percentage}
                        paybackMonths={liveCalculations.payback_months}
                        irrPercentage={liveCalculations.irr_percentage}
                        rubberGranulesYield={editingStudy.rubber_granules_yield || 43}
                        steelWireYield={editingStudy.steel_wire_yield || 25}
                        textileFiberYield={editingStudy.textile_fiber_yield || 8}
                        rcbYield={editingStudy.rcb_yield || 12}
                        rubberGranulesPrice={editingStudy.rubber_granules_price || 250}
                        steelWirePrice={editingStudy.steel_wire_price || 250}
                        textileFiberPrice={editingStudy.textile_fiber_price || 120}
                        rcbPrice={editingStudy.rcb_price || 1050}
                        taxRate={editingStudy.tax_rate || 25}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* AI Analysis Section - Tabs with Standard and Advanced 7-AI */}
                {dialogReady && liveCalculations && (
                  <Tabs defaultValue="standard" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="standard" className="text-xs">
                        <Sparkles className="h-3 w-3 mr-1" />
                        {t('admin.feasibility.ai.standard', 'IA Padrão')}
                      </TabsTrigger>
                      <TabsTrigger value="advanced" className="text-xs">
                        <Brain className="h-3 w-3 mr-1" />
                        {t('admin.feasibility.ai.advanced7AI', '7 IAs Avançadas')}
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="standard" className="mt-3">
                      <FeasibilityAIAnalysis 
                        study={{
                          ...editingStudy,
                          ...liveCalculations,
                          study_name: editingStudy.study_name || 'Untitled',
                          daily_capacity_tons: editingStudy.daily_capacity_tons || 85,
                          operating_days_per_year: editingStudy.operating_days_per_year || 300,
                          utilization_rate: editingStudy.utilization_rate || 85,
                          rubber_granules_price: editingStudy.rubber_granules_price || 280,
                          rubber_granules_yield: editingStudy.rubber_granules_yield || 74.7,
                          steel_wire_price: editingStudy.steel_wire_price || 244,
                          steel_wire_yield: editingStudy.steel_wire_yield || 15.7,
                          textile_fiber_price: editingStudy.textile_fiber_price || 266,
                          textile_fiber_yield: editingStudy.textile_fiber_yield || 9.7,
                          tax_rate: editingStudy.tax_rate || 25,
                          discount_rate: editingStudy.discount_rate || 12,
                          equipment_cost: editingStudy.equipment_cost || 0,
                          installation_cost: editingStudy.installation_cost || 0,
                          infrastructure_cost: editingStudy.infrastructure_cost || 0,
                          working_capital: editingStudy.working_capital || 0,
                          labor_cost: editingStudy.labor_cost || 0,
                          energy_cost: editingStudy.energy_cost || 0,
                          maintenance_cost: editingStudy.maintenance_cost || 0,
                          logistics_cost: editingStudy.logistics_cost || 0
                        }} 
                        onAnalysisComplete={(analysis) => { setAiAnalysis(analysis); setAiAnalysisLanguage(i18n.language); }}
                      />
                    </TabsContent>
                    <TabsContent value="advanced" className="mt-3">
                      <FeasibilityAdvancedAI 
                        study={{
                          ...editingStudy,
                          ...liveCalculations,
                          study_name: editingStudy.study_name || 'Untitled',
                          daily_capacity_tons: editingStudy.daily_capacity_tons || 85,
                          operating_days_per_year: editingStudy.operating_days_per_year || 300,
                          utilization_rate: editingStudy.utilization_rate || 85,
                          rubber_granules_price: editingStudy.rubber_granules_price || 280,
                          rubber_granules_yield: editingStudy.rubber_granules_yield || 74.7,
                          steel_wire_price: editingStudy.steel_wire_price || 244,
                          steel_wire_yield: editingStudy.steel_wire_yield || 15.7,
                          textile_fiber_price: editingStudy.textile_fiber_price || 266,
                          textile_fiber_yield: editingStudy.textile_fiber_yield || 9.7,
                          tax_rate: editingStudy.tax_rate || 25,
                          discount_rate: editingStudy.discount_rate || 12,
                          equipment_cost: editingStudy.equipment_cost || 0,
                          installation_cost: editingStudy.installation_cost || 0,
                          infrastructure_cost: editingStudy.infrastructure_cost || 0,
                          working_capital: editingStudy.working_capital || 0,
                          labor_cost: editingStudy.labor_cost || 0,
                          energy_cost: editingStudy.energy_cost || 0,
                          maintenance_cost: editingStudy.maintenance_cost || 0,
                          logistics_cost: editingStudy.logistics_cost || 0,
                          government_royalties_percent: editingStudy.government_royalties_percent || 0,
                          environmental_bonus_per_ton: editingStudy.environmental_bonus_per_ton || 0,
                          collection_model: editingStudy.collection_model || 'direct'
                        }} 
                        onAnalysisComplete={(analysis, specialists) => { 
                          setAiAnalysis(analysis); 
                          setAiAnalysisLanguage(i18n.language); 
                        }}
                      />
                    </TabsContent>
                  </Tabs>
                )}

                {/* Due Diligence Checklist Notes */}
                <Collapsible open={expandedSections.financial} onOpenChange={() => toggleSection('financial')}>
                  <Card className="border-amber-200 bg-amber-50/30 dark:border-amber-800 dark:bg-amber-950/20">
                    <CollapsibleTrigger asChild>
                      <CardHeader className="py-3 cursor-pointer hover:bg-muted/50 transition-colors">
                        <CardTitle className="text-base flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-amber-600" />
                            {t('admin.feasibility.checklistNotes', 'Due Diligence Notes for PDF')}
                          </span>
                          {expandedSections.financial ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </CardTitle>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0 space-y-4">
                        <p className="text-xs text-muted-foreground">
                          {t('admin.feasibility.checklistNotesDesc', 'These notes will appear in the PDF checklist. Fill in observations for each category.')}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs text-blue-600">{t('admin.feasibility.ddCompanyInfo', 'Company Info')}</Label>
                            <Input
                              value={checklistNotes.companyInfo || ''}
                              onChange={(e) => setChecklistNotes(prev => ({ ...prev, companyInfo: e.target.value }))}
                              placeholder={t('admin.feasibility.ddNotesPlaceholder', 'Add observations...')}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-green-600">{t('admin.feasibility.ddFinancial', 'Financial Verification')}</Label>
                            <Input
                              value={checklistNotes.financial || ''}
                              onChange={(e) => setChecklistNotes(prev => ({ ...prev, financial: e.target.value }))}
                              placeholder={t('admin.feasibility.ddNotesPlaceholder', 'Add observations...')}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-purple-600">{t('admin.feasibility.ddLegal', 'Legal & Compliance')}</Label>
                            <Input
                              value={checklistNotes.legal || ''}
                              onChange={(e) => setChecklistNotes(prev => ({ ...prev, legal: e.target.value }))}
                              placeholder={t('admin.feasibility.ddNotesPlaceholder', 'Add observations...')}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-orange-600">{t('admin.feasibility.ddOperational', 'Operational Capacity')}</Label>
                            <Input
                              value={checklistNotes.operational || ''}
                              onChange={(e) => setChecklistNotes(prev => ({ ...prev, operational: e.target.value }))}
                              placeholder={t('admin.feasibility.ddNotesPlaceholder', 'Add observations...')}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-red-600">{t('admin.feasibility.ddOtrSources', 'OTR Tire Sources')}</Label>
                            <Input
                              value={checklistNotes.otrSources || ''}
                              onChange={(e) => setChecklistNotes(prev => ({ ...prev, otrSources: e.target.value }))}
                              placeholder={t('admin.feasibility.ddNotesPlaceholder', 'Add observations...')}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-indigo-600">{t('admin.feasibility.ddPartnership', 'Partnership Readiness')}</Label>
                            <Input
                              value={checklistNotes.partnership || ''}
                              onChange={(e) => setChecklistNotes(prev => ({ ...prev, partnership: e.target.value }))}
                              placeholder={t('admin.feasibility.ddNotesPlaceholder', 'Add observations...')}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* QR Code Link Configuration */}
                <Card className="border-indigo-200 bg-indigo-50/30 dark:border-indigo-800 dark:bg-indigo-950/20">
                  <CardHeader className="py-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Image className="h-4 w-4 text-indigo-600" />
                      {t('admin.feasibility.qrCodeConfig', 'QR Code Link Configuration')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-4">
                    <p className="text-xs text-muted-foreground">
                      {t('admin.feasibility.qrCodeConfigDesc', 'Select which form the QR Code in the PDF will link to. The partner can scan and fill the form directly.')}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs">{t('admin.feasibility.qrFormSelect', 'Form/Link for QR Code')}</Label>
                        <Select value={qrCodeLinkType} onValueChange={setQrCodeLinkType}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {qrCodeFormOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {qrCodeLinkType === 'custom' && (
                        <div>
                          <Label className="text-xs">{t('admin.feasibility.customUrl', 'Custom URL')}</Label>
                          <Input
                            value={customQrCodeUrl}
                            onChange={(e) => setCustomQrCodeUrl(e.target.value)}
                            placeholder="https://..."
                            className="mt-1"
                          />
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground bg-background/50 rounded p-2">
                      <strong>{t('admin.feasibility.qrPreview', 'Selected form')}:</strong>{' '}
                      <span className="text-indigo-600 font-medium">
                        {qrCodeLinkType === 'custom' 
                          ? t('admin.feasibility.qrForms.customLink', 'Custom Link')
                          : qrCodeFormOptions.find(o => o.value === qrCodeLinkType)?.label || 'OTR Source Indication'
                        }
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Digital Signature Configuration */}
                <Card className="border-green-200 bg-green-50/30 dark:border-green-800 dark:bg-green-950/20">
                  <CardHeader className="py-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Send className="h-4 w-4 text-green-600" />
                      {t('admin.feasibility.signatureConfig', 'Assinatura Digital / Digital Signature')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="space-y-0.5">
                        <Label htmlFor="enable-signature" className="font-medium">
                          {t('admin.feasibility.enableSignature', 'Habilitar Assinatura Digital')}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {t('admin.feasibility.enableSignatureDesc', 'Salvar documento para assinatura eletrônica')}
                        </p>
                      </div>
                      <Switch
                        id="enable-signature"
                        checked={enableSignature}
                        onCheckedChange={setEnableSignature}
                      />
                    </div>

                    {enableSignature && (
                      <>
                        <MultipleSignersManager
                          signers={feasibilitySigners}
                          onSignersChange={setFeasibilitySigners}
                          enableMultipleSignatures={enableMultipleSignatures}
                          onEnableMultipleSignaturesChange={setEnableMultipleSignatures}
                        />
                        <Button
                          onClick={saveDocumentForSignature}
                          className="w-full gap-2 bg-green-600 hover:bg-green-700"
                          disabled={!editingStudy?.study_name}
                        >
                          <Send className="h-4 w-4" />
                          {t('admin.feasibility.saveForSignature', 'Salvar para Assinatura')}
                        </Button>
                        {savedDocumentId && (
                          <Button
                            variant="outline"
                            onClick={() => navigate(`/sign/${savedDocumentId}`)}
                            className="w-full gap-2"
                          >
                            <ExternalLink className="h-4 w-4" />
                            {t('admin.feasibility.redirectToSign', 'Ir para Portal de Assinatura')}
                          </Button>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Notes and Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Label>{t('admin.feasibility.notes')}</Label>
                    <Textarea
                      value={editingStudy.notes || ''}
                      onChange={(e) => handleFieldChange('notes', e.target.value)}
                      placeholder={t('admin.feasibility.notesPlaceholder')}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>{t('admin.feasibility.studyStatus')}</Label>
                    <Select
                      value={editingStudy.status || 'draft'}
                      onValueChange={(value) => handleFieldChange('status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">{t('admin.feasibility.status.draft')}</SelectItem>
                        <SelectItem value="in_review">{t('admin.feasibility.status.in_review')}</SelectItem>
                        <SelectItem value="approved">{t('admin.feasibility.status.approved')}</SelectItem>
                        <SelectItem value="rejected">{t('admin.feasibility.status.rejected')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="mt-6 flex-col sm:flex-row gap-2">
              <div className="flex items-center gap-2 mr-auto flex-wrap">
                <div className="flex items-center gap-2">
                  <Label className="text-sm whitespace-nowrap">{t('admin.feasibility.pdfLanguage')}:</Label>
                  <Select value={pdfLanguage} onValueChange={setPdfLanguage}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="pt">Português</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="zh">中文</SelectItem>
                      <SelectItem value="it">Italiano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm whitespace-nowrap">{t('admin.feasibility.watermark', 'Watermark')}:</Label>
                  <Select value={pdfWatermark} onValueChange={(v) => setPdfWatermark(v as WatermarkType)}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t('admin.feasibility.noWatermark', 'None')}</SelectItem>
                      <SelectItem value="confidential">{t('admin.feasibility.confidentialWatermark', 'Confidential')}</SelectItem>
                      <SelectItem value="draft">{t('admin.feasibility.draftWatermark', 'Draft')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                {t('admin.actions.cancel')}
              </Button>
              <div className="flex gap-2 flex-wrap">
                <Button 
                  variant="secondary"
                  onClick={() => {
                    if (editingStudy && liveCalculations) {
                      const studyWithCalcs = {
                        ...editingStudy,
                        ...liveCalculations,
                        id: editingStudy.id || 'temp',
                        created_at: editingStudy.created_at || new Date().toISOString(),
                        updated_at: new Date().toISOString()
                      } as FeasibilityStudy;
                      generatePDF(studyWithCalcs);
                    }
                  }}
                  disabled={!editingStudy?.study_name || !liveCalculations}
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  {t('admin.feasibility.exportPdf')}
                </Button>
                <Button 
                  variant="secondary"
                  onClick={async () => {
                    if (editingStudy && liveCalculations && pdfChartsRef.current) {
                      setIsGeneratingPDF(true);
                      try {
                        const studyWithCalcs = {
                          ...editingStudy,
                          ...liveCalculations,
                          id: editingStudy.id || 'temp',
                          created_at: editingStudy.created_at || new Date().toISOString(),
                          updated_at: new Date().toISOString()
                        } as FeasibilityStudy;
                        await generateFeasibilityPDFWithCharts(studyWithCalcs, pdfChartsRef.current, aiAnalysis);
                        toast({ title: t('admin.feasibility.pdfWithChartsGenerated') });
                      } catch (error) {
                        console.error('PDF generation error:', error);
                        toast({ title: t('admin.feasibility.pdfError'), variant: 'destructive' });
                      } finally {
                        setIsGeneratingPDF(false);
                      }
                    }
                  }}
                  disabled={!editingStudy?.study_name || !liveCalculations || isGeneratingPDF}
                >
                  {isGeneratingPDF ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Image className="h-4 w-4 mr-2" />}
                  {t('admin.feasibility.savePdfWithCharts')}
                </Button>
                <Button 
                  variant="default"
                  className="bg-gradient-to-r from-primary to-emerald-600"
                  onClick={async () => {
                    if (editingStudy && liveCalculations) {
                      setIsGeneratingPDF(true);
                      try {
                        const studyWithCalcs = {
                          study_name: editingStudy.study_name || 'Feasibility Study',
                          location: editingStudy.location,
                          country: editingStudy.country,
                          daily_capacity_tons: editingStudy.daily_capacity_tons || 10,
                          operating_days_per_year: editingStudy.operating_days_per_year || 300,
                          utilization_rate: editingStudy.utilization_rate || 85,
                          total_investment: liveCalculations.total_investment,
                          annual_revenue: liveCalculations.annual_revenue,
                          annual_opex: liveCalculations.annual_opex,
                          annual_ebitda: liveCalculations.annual_ebitda,
                          payback_months: liveCalculations.payback_months,
                          roi_percentage: liveCalculations.roi_percentage,
                          npv_10_years: liveCalculations.npv_10_years,
                          irr_percentage: liveCalculations.irr_percentage,
                          rubber_granules_price: editingStudy.rubber_granules_price || 455,
                          rubber_granules_yield: editingStudy.rubber_granules_yield || 74.7,
                          steel_wire_price: editingStudy.steel_wire_price || 260,
                          steel_wire_yield: editingStudy.steel_wire_yield || 15.7,
                          textile_fiber_price: editingStudy.textile_fiber_price || 266,
                          textile_fiber_yield: editingStudy.textile_fiber_yield || 9.7,
                          tax_rate: editingStudy.tax_rate || 25,
                          discount_rate: editingStudy.discount_rate,
                          equipment_cost: editingStudy.equipment_cost,
                          installation_cost: editingStudy.installation_cost,
                          infrastructure_cost: editingStudy.infrastructure_cost,
                          working_capital: editingStudy.working_capital,
                          labor_cost: editingStudy.labor_cost,
                          energy_cost: editingStudy.energy_cost,
                          maintenance_cost: editingStudy.maintenance_cost,
                          logistics_cost: editingStudy.logistics_cost,
                          administrative_cost: editingStudy.administrative_cost,
                          other_opex: editingStudy.other_opex,
                          depreciation_years: editingStudy.depreciation_years
                        };
                        
                        // Build tire category data for PDF export (use first selected category for primary data)
                        const primaryCategory = getTireCategory(selectedTireCategories[0] || 'otr_mining');
                        const allSelectedCategories = selectedTireCategories.map(id => getTireCategory(id)).filter(Boolean);
                        
                        const tireCategoryDataForPDF = primaryCategory ? {
                          categoryId: primaryCategory.id,
                          categoryName: allSelectedCategories.length > 1
                            ? allSelectedCategories.map(c => t(`admin.feasibility.tireCategory.types.${c?.nameKey}`, c?.nameKey)).join(' + ')
                            : t(`admin.feasibility.tireCategory.types.${primaryCategory.nameKey}`, primaryCategory.nameKey),
                          categoryIcon: allSelectedCategories.map(c => c?.icon).join(' '),
                          selectedModels: selectedTireModels,
                          avgWeight: combinedCategoryData?.avgWeight || primaryCategory.avgWeight,
                          valuePerTire: selectedTireModels.length > 0
                            ? primaryCategory.models
                                .filter(m => selectedTireModels.includes(m.model))
                                .reduce((sum, m) => {
                                  const val = (m.recoverable.granules / 1000) * OTR_MARKET_PRICES.granules.avg +
                                              (m.recoverable.steel / 1000) * OTR_MARKET_PRICES.steel.avg +
                                              (m.recoverable.textile / 1000) * OTR_MARKET_PRICES.textile.avg +
                                              (m.recoverable.rcb / 1000) * OTR_MARKET_PRICES.rcb.avg;
                                  return sum + val;
                                }, 0) / selectedTireModels.length
                            : primaryCategory.models.reduce((sum, m) => {
                                const val = (m.recoverable.granules / 1000) * OTR_MARKET_PRICES.granules.avg +
                                            (m.recoverable.steel / 1000) * OTR_MARKET_PRICES.steel.avg +
                                            (m.recoverable.textile / 1000) * OTR_MARKET_PRICES.textile.avg +
                                            (m.recoverable.rcb / 1000) * OTR_MARKET_PRICES.rcb.avg;
                                return sum + val;
                              }, 0) / primaryCategory.models.length,
                          yields: combinedCategoryData?.yields || getTireCategoryYields(selectedTireCategories[0] || 'otr_mining'),
                          processingDifficulty: primaryCategory.processingDifficulty,
                          opexMultiplier: getTireCategoryOpexAdjustments(selectedTireCategories[0] || 'otr_mining').laborMultiplier,
                          allCategories: selectedTireCategories
                        } : null;
                        
                        // Check if AI analysis needs to be regenerated for different language
                        let analysisForPDF = aiAnalysis;
                        if (aiAnalysis && aiAnalysisLanguage && aiAnalysisLanguage !== pdfLanguage) {
                          // Regenerate analysis in the correct language using local model (fast)
                          toast({ title: t('admin.feasibility.regeneratingAnalysis', 'Regenerating analysis in target language...') });
                          try {
                            const response = await supabase.functions.invoke('analyze-feasibility', {
                              body: {
                                study: {
                                  ...editingStudy,
                                  ...liveCalculations,
                                  location: editingStudy.location || '',
                                  country: editingStudy.country || ''
                                },
                                language: pdfLanguage,
                                model: 'local' // Use fast local model for translation
                              }
                            });
                            if (response.data?.analysis) {
                              analysisForPDF = response.data.analysis;
                            }
                          } catch (e) {
                            console.warn('Could not regenerate analysis in target language, using original:', e);
                          }
                        }
                        
                        await generateProfessionalFeasibilityPDF(studyWithCalcs, analysisForPDF, pdfLanguage, pdfChartsRef.current, checklistNotes, getQrCodeUrl(), pdfWatermark, tireCategoryDataForPDF);
                        toast({ title: t('admin.feasibility.pdfWithChartsGenerated') });
                      } catch (error) {
                        console.error('PDF generation error:', error);
                        toast({ title: t('admin.feasibility.pdfError'), variant: 'destructive' });
                      } finally {
                        setIsGeneratingPDF(false);
                      }
                    }
                  }}
                  disabled={!editingStudy?.study_name || !liveCalculations || isGeneratingPDF}
                >
                  {isGeneratingPDF ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
                  {t('admin.feasibility.generateProfessionalPdf')}
                </Button>
                <Button 
                  onClick={() => saveMutation.mutate(editingStudy!)} 
                  disabled={saveMutation.isPending || !editingStudy?.study_name}
                >
                  {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Save className="h-4 w-4 mr-2" />
                  {t('admin.feasibility.saveStudy')}
                </Button>
              </div>
             </DialogFooter>
          </DialogContent>
        </Dialog>

          <TabsContent value="otr-data">
            <OTRCompositionTable />
          </TabsContent>

          <TabsContent value="templates">
            <FeasibilityTemplates
              onSelectTemplate={(template) => {
                // Use requestAnimationFrame to avoid blocking UI
                requestAnimationFrame(() => {
                  setEditingStudy({
                    ...defaultStudy,
                    study_name: template.name,
                    country: template.country,
                    daily_capacity_tons: template.daily_capacity_tons,
                    equipment_cost: template.equipment_cost,
                    installation_cost: template.installation_cost,
                    infrastructure_cost: template.infrastructure_cost,
                    working_capital: template.working_capital,
                    other_capex: template.other_capex,
                    raw_material_cost: template.raw_material_cost,
                    labor_cost: template.labor_cost,
                    energy_cost: template.energy_cost,
                    maintenance_cost: template.maintenance_cost,
                    logistics_cost: template.logistics_cost,
                    administrative_cost: template.administrative_cost,
                    other_opex: template.other_opex,
                    rubber_granules_price: template.rubber_granules_price,
                    rubber_granules_yield: template.rubber_granules_yield,
                    steel_wire_price: template.steel_wire_price,
                    steel_wire_yield: template.steel_wire_yield,
                    textile_fiber_price: template.textile_fiber_price,
                    textile_fiber_yield: template.textile_fiber_yield,
                    rcb_price: 1000,
                    rcb_yield: 12,
                    tax_rate: template.tax_rate
                  });
                  // Delay dialog opening to allow state to stabilize
                  setTimeout(() => setDialogOpen(true), 50);
                });
              }}
            />
          </TabsContent>

          <TabsContent value="compare">
            <FeasibilityComparison studies={studies || []} />
          </TabsContent>

          <TabsContent value="charts">
            {studies && studies.length > 0 ? (
              <FeasibilityCharts study={studies[0]} studies={studies} />
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  {t('admin.feasibility.noStudies')}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
        
        {/* Hidden PDF Charts for rendering */}
        {editingStudy && liveCalculations && (
          <FeasibilityPDFCharts 
            ref={pdfChartsRef}
            study={{ ...editingStudy, ...liveCalculations }}
          />
        )}

        {/* Collaborative AI Document Dialog */}
        <CollaborativeDocumentDialog
          open={collaborativeDialogOpen}
          onOpenChange={setCollaborativeDialogOpen}
          onDocumentGenerated={(content, docType) => {
            setCollaborativeDocumentContent(content);
            toast({
              title: t('admin.feasibility.documentGenerated', 'Documento gerado com sucesso!'),
              description: `${docType.toUpperCase()} criado com IA colaborativa`,
            });
          }}
          defaultValues={{
            country: selectedStudy?.country || editingStudy?.country || 'Brazil',
            companyName: selectedStudy?.study_name || editingStudy?.study_name || '',
          }}
        />
      </div>
    </TooltipProvider>
  );
}
