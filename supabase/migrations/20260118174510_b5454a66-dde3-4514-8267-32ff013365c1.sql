-- Create feasibility studies table for OTR recycling plant implementations
CREATE TABLE public.feasibility_studies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID REFERENCES auth.users(id),
  study_name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  country VARCHAR(100),
  
  -- Plant configuration
  plant_type VARCHAR(50) DEFAULT 'otr_recycling',
  daily_capacity_tons DECIMAL(10,2) DEFAULT 50,
  operating_days_per_year INTEGER DEFAULT 300,
  utilization_rate DECIMAL(5,2) DEFAULT 85,
  
  -- Investment costs (USD)
  equipment_cost DECIMAL(15,2) DEFAULT 0,
  installation_cost DECIMAL(15,2) DEFAULT 0,
  infrastructure_cost DECIMAL(15,2) DEFAULT 0,
  working_capital DECIMAL(15,2) DEFAULT 0,
  other_capex DECIMAL(15,2) DEFAULT 0,
  
  -- Operating costs per month (USD)
  raw_material_cost DECIMAL(15,2) DEFAULT 0,
  labor_cost DECIMAL(15,2) DEFAULT 0,
  energy_cost DECIMAL(15,2) DEFAULT 0,
  maintenance_cost DECIMAL(15,2) DEFAULT 0,
  logistics_cost DECIMAL(15,2) DEFAULT 0,
  administrative_cost DECIMAL(15,2) DEFAULT 0,
  other_opex DECIMAL(15,2) DEFAULT 0,
  
  -- Revenue streams per ton (USD)
  rubber_granules_price DECIMAL(10,2) DEFAULT 150,
  rubber_granules_yield DECIMAL(5,2) DEFAULT 65,
  steel_wire_price DECIMAL(10,2) DEFAULT 200,
  steel_wire_yield DECIMAL(5,2) DEFAULT 15,
  textile_fiber_price DECIMAL(10,2) DEFAULT 50,
  textile_fiber_yield DECIMAL(5,2) DEFAULT 5,
  
  -- Financial parameters
  tax_rate DECIMAL(5,2) DEFAULT 25,
  depreciation_years INTEGER DEFAULT 10,
  discount_rate DECIMAL(5,2) DEFAULT 12,
  inflation_rate DECIMAL(5,2) DEFAULT 3,
  
  -- Calculated results (stored for quick access)
  total_investment DECIMAL(15,2) DEFAULT 0,
  annual_revenue DECIMAL(15,2) DEFAULT 0,
  annual_opex DECIMAL(15,2) DEFAULT 0,
  annual_ebitda DECIMAL(15,2) DEFAULT 0,
  payback_months INTEGER DEFAULT 0,
  roi_percentage DECIMAL(8,2) DEFAULT 0,
  npv_10_years DECIMAL(15,2) DEFAULT 0,
  irr_percentage DECIMAL(8,2) DEFAULT 0,
  
  -- Metadata
  status VARCHAR(50) DEFAULT 'draft',
  notes TEXT,
  lead_id UUID,
  lead_type VARCHAR(50),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.feasibility_studies ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (admin only access)
CREATE POLICY "Admins can view all feasibility studies" 
ON public.feasibility_studies 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'editor')
  )
);

CREATE POLICY "Admins can create feasibility studies" 
ON public.feasibility_studies 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'editor')
  )
);

CREATE POLICY "Admins can update feasibility studies" 
ON public.feasibility_studies 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'editor')
  )
);

CREATE POLICY "Admins can delete feasibility studies" 
ON public.feasibility_studies 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_feasibility_studies_updated_at
BEFORE UPDATE ON public.feasibility_studies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();