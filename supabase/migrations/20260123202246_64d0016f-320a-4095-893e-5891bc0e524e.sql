-- Create CNPJ cache table for Brazilian company lookups
CREATE TABLE public.cnpj_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cnpj VARCHAR(14) NOT NULL UNIQUE,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  natureza_juridica TEXT,
  situacao_cadastral TEXT,
  descricao_situacao_cadastral TEXT,
  data_situacao_cadastral DATE,
  data_inicio_atividade DATE,
  cnae_fiscal INTEGER,
  cnae_fiscal_descricao TEXT,
  porte TEXT,
  logradouro TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  municipio TEXT,
  uf VARCHAR(2),
  cep VARCHAR(8),
  ddd_telefone_1 TEXT,
  ddd_telefone_2 TEXT,
  email TEXT,
  capital_social NUMERIC,
  qsa JSONB DEFAULT '[]'::jsonb,
  cnaes_secundarios JSONB DEFAULT '[]'::jsonb,
  -- Cache metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  hit_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for fast CNPJ lookups
CREATE INDEX idx_cnpj_cache_cnpj ON public.cnpj_cache(cnpj);
CREATE INDEX idx_cnpj_cache_expires ON public.cnpj_cache(expires_at);
CREATE INDEX idx_cnpj_cache_razao_social ON public.cnpj_cache(razao_social);

-- Create CPF validation cache table
CREATE TABLE public.cpf_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cpf VARCHAR(11) NOT NULL UNIQUE,
  nome TEXT,
  data_nascimento DATE,
  situacao_cadastral TEXT,
  data_inscricao DATE,
  digito_verificador VARCHAR(2),
  is_valid BOOLEAN DEFAULT true,
  -- Cache metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  hit_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for fast CPF lookups
CREATE INDEX idx_cpf_cache_cpf ON public.cpf_cache(cpf);
CREATE INDEX idx_cpf_cache_expires ON public.cpf_cache(expires_at);

-- Create CGU sanctions cache table (CEIS/CNEP)
CREATE TABLE public.cgu_sanctions_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cpf_cnpj VARCHAR(14) NOT NULL,
  tipo_pessoa VARCHAR(2) NOT NULL, -- PF or PJ
  nome_razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  tipo_sancao TEXT NOT NULL, -- CEIS, CNEP, CEPIM, CEAF
  data_inicio_sancao DATE,
  data_fim_sancao DATE,
  orgao_sancionador TEXT,
  uf_orgao_sancionador VARCHAR(2),
  fundamentacao_legal TEXT,
  descricao_fundamentacao TEXT,
  numero_processo TEXT,
  data_publicacao_sancao DATE,
  fonte_sancao TEXT,
  is_active BOOLEAN DEFAULT true,
  -- Cache metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '1 day'),
  hit_count INTEGER DEFAULT 0
);

-- Create indexes for CGU sanctions
CREATE INDEX idx_cgu_sanctions_cpf_cnpj ON public.cgu_sanctions_cache(cpf_cnpj);
CREATE INDEX idx_cgu_sanctions_tipo ON public.cgu_sanctions_cache(tipo_sancao);
CREATE INDEX idx_cgu_sanctions_active ON public.cgu_sanctions_cache(is_active);

-- Enable RLS
ALTER TABLE public.cnpj_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cpf_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cgu_sanctions_cache ENABLE ROW LEVEL SECURITY;

-- CNPJ cache policies
CREATE POLICY "Anyone can view CNPJ cache" ON public.cnpj_cache FOR SELECT USING (true);
CREATE POLICY "System can manage CNPJ cache" ON public.cnpj_cache FOR ALL USING (true);

-- CPF cache policies  
CREATE POLICY "Editors can view CPF cache" ON public.cpf_cache FOR SELECT 
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'editor')));
CREATE POLICY "System can manage CPF cache" ON public.cpf_cache FOR ALL USING (true);

-- CGU sanctions cache policies
CREATE POLICY "Anyone can view CGU sanctions" ON public.cgu_sanctions_cache FOR SELECT USING (true);
CREATE POLICY "System can manage CGU sanctions" ON public.cgu_sanctions_cache FOR ALL USING (true);

-- Create function to increment cache hit count
CREATE OR REPLACE FUNCTION public.increment_cnpj_cache_hit(target_cnpj VARCHAR)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.cnpj_cache
  SET hit_count = hit_count + 1,
      last_accessed_at = now()
  WHERE cnpj = target_cnpj;
END;
$$;

-- Create function to clean expired cache entries
CREATE OR REPLACE FUNCTION public.clean_expired_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.cnpj_cache WHERE expires_at < now();
  DELETE FROM public.cpf_cache WHERE expires_at < now();
  DELETE FROM public.cgu_sanctions_cache WHERE expires_at < now();
END;
$$;