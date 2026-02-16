export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_emails: {
        Row: {
          attachments: Json | null
          body_html: string | null
          body_text: string | null
          created_at: string
          direction: string
          from_email: string
          from_name: string | null
          id: string
          metadata: Json | null
          parent_email_id: string | null
          read_at: string | null
          replied_at: string | null
          status: string
          subject: string | null
          tags: string[] | null
          thread_id: string | null
          to_email: string
          to_name: string | null
        }
        Insert: {
          attachments?: Json | null
          body_html?: string | null
          body_text?: string | null
          created_at?: string
          direction?: string
          from_email: string
          from_name?: string | null
          id?: string
          metadata?: Json | null
          parent_email_id?: string | null
          read_at?: string | null
          replied_at?: string | null
          status?: string
          subject?: string | null
          tags?: string[] | null
          thread_id?: string | null
          to_email: string
          to_name?: string | null
        }
        Update: {
          attachments?: Json | null
          body_html?: string | null
          body_text?: string | null
          created_at?: string
          direction?: string
          from_email?: string
          from_name?: string | null
          id?: string
          metadata?: Json | null
          parent_email_id?: string | null
          read_at?: string | null
          replied_at?: string | null
          status?: string
          subject?: string | null
          tags?: string[] | null
          thread_id?: string | null
          to_email?: string
          to_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_emails_parent_email_id_fkey"
            columns: ["parent_email_id"]
            isOneToOne: false
            referencedRelation: "admin_emails"
            referencedColumns: ["id"]
          },
        ]
      }
      aml_screened_lists: {
        Row: {
          id: string
          issuer: string | null
          issuer_description: string | null
          jurisdiction: string | null
          jurisdiction_code: string | null
          list_name: string
          list_type: string | null
          matches_found: number | null
          report_id: string
          source_url: string | null
        }
        Insert: {
          id?: string
          issuer?: string | null
          issuer_description?: string | null
          jurisdiction?: string | null
          jurisdiction_code?: string | null
          list_name: string
          list_type?: string | null
          matches_found?: number | null
          report_id: string
          source_url?: string | null
        }
        Update: {
          id?: string
          issuer?: string | null
          issuer_description?: string | null
          jurisdiction?: string | null
          jurisdiction_code?: string | null
          list_name?: string
          list_type?: string | null
          matches_found?: number | null
          report_id?: string
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aml_screened_lists_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "aml_screening_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      aml_screening_history: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          report_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          report_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          report_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aml_screening_history_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "aml_screening_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      aml_screening_matches: {
        Row: {
          address: string | null
          alias: string[] | null
          associated_companies: Json | null
          created_at: string
          date_of_birth: string | null
          delisting_date: string | null
          disclosure_date: string | null
          end_date: string | null
          entity_type: string | null
          gender: string | null
          id: string
          id_number: string | null
          match_rank: number | null
          match_rate: number
          matched_name: string
          matched_name_local: string | null
          nationality: string | null
          place_of_birth: string | null
          reason: string | null
          remark: string | null
          report_id: string
          review_notes: string | null
          review_status: Database["public"]["Enums"]["match_status"] | null
          reviewed_at: string | null
          reviewed_by: string | null
          role_description: string | null
          source_issuer: string | null
          source_jurisdiction: string | null
          source_name: string
          source_url: string | null
          start_date: string | null
          tag: string | null
        }
        Insert: {
          address?: string | null
          alias?: string[] | null
          associated_companies?: Json | null
          created_at?: string
          date_of_birth?: string | null
          delisting_date?: string | null
          disclosure_date?: string | null
          end_date?: string | null
          entity_type?: string | null
          gender?: string | null
          id?: string
          id_number?: string | null
          match_rank?: number | null
          match_rate: number
          matched_name: string
          matched_name_local?: string | null
          nationality?: string | null
          place_of_birth?: string | null
          reason?: string | null
          remark?: string | null
          report_id: string
          review_notes?: string | null
          review_status?: Database["public"]["Enums"]["match_status"] | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          role_description?: string | null
          source_issuer?: string | null
          source_jurisdiction?: string | null
          source_name: string
          source_url?: string | null
          start_date?: string | null
          tag?: string | null
        }
        Update: {
          address?: string | null
          alias?: string[] | null
          associated_companies?: Json | null
          created_at?: string
          date_of_birth?: string | null
          delisting_date?: string | null
          disclosure_date?: string | null
          end_date?: string | null
          entity_type?: string | null
          gender?: string | null
          id?: string
          id_number?: string | null
          match_rank?: number | null
          match_rate?: number
          matched_name?: string
          matched_name_local?: string | null
          nationality?: string | null
          place_of_birth?: string | null
          reason?: string | null
          remark?: string | null
          report_id?: string
          review_notes?: string | null
          review_status?: Database["public"]["Enums"]["match_status"] | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          role_description?: string | null
          source_issuer?: string | null
          source_jurisdiction?: string | null
          source_name?: string
          source_url?: string | null
          start_date?: string | null
          tag?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aml_screening_matches_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "aml_screening_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      aml_screening_reports: {
        Row: {
          browser_fingerprint: string | null
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          ip_address: string | null
          jurisdictions: string[]
          match_rate_threshold: number
          pdf_url: string | null
          report_markdown: string | null
          report_token: string | null
          risk_level: string | null
          screening_types: string[]
          status: string | null
          subject_company_name: string | null
          subject_company_registration: string | null
          subject_country: string | null
          subject_date_of_birth: string | null
          subject_gender: string | null
          subject_id_number: string | null
          subject_name: string
          subject_name_local: string | null
          total_matches: number | null
          total_screened_lists: number | null
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          browser_fingerprint?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          jurisdictions?: string[]
          match_rate_threshold?: number
          pdf_url?: string | null
          report_markdown?: string | null
          report_token?: string | null
          risk_level?: string | null
          screening_types?: string[]
          status?: string | null
          subject_company_name?: string | null
          subject_company_registration?: string | null
          subject_country?: string | null
          subject_date_of_birth?: string | null
          subject_gender?: string | null
          subject_id_number?: string | null
          subject_name: string
          subject_name_local?: string | null
          total_matches?: number | null
          total_screened_lists?: number | null
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          browser_fingerprint?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          jurisdictions?: string[]
          match_rate_threshold?: number
          pdf_url?: string | null
          report_markdown?: string | null
          report_token?: string | null
          risk_level?: string | null
          screening_types?: string[]
          status?: string | null
          subject_company_name?: string | null
          subject_company_registration?: string | null
          subject_country?: string | null
          subject_date_of_birth?: string | null
          subject_gender?: string | null
          subject_id_number?: string | null
          subject_name?: string
          subject_name_local?: string | null
          total_matches?: number | null
          total_screened_lists?: number | null
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      analises: {
        Row: {
          complemento_gemini: string | null
          created_at: string
          error_message: string | null
          id: string
          insights_claude: string | null
          modo_rapido: boolean | null
          relatorio_markdown: string | null
          status: string | null
          urls: Json
          user_id: string | null
        }
        Insert: {
          complemento_gemini?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          insights_claude?: string | null
          modo_rapido?: boolean | null
          relatorio_markdown?: string | null
          status?: string | null
          urls?: Json
          user_id?: string | null
        }
        Update: {
          complemento_gemini?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          insights_claude?: string | null
          modo_rapido?: boolean | null
          relatorio_markdown?: string | null
          status?: string | null
          urls?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      articles: {
        Row: {
          category: string | null
          content_en: string
          content_es: string
          content_it: string
          content_pt: string
          content_zh: string
          created_at: string
          excerpt_en: string
          excerpt_es: string
          excerpt_it: string
          excerpt_pt: string
          excerpt_zh: string
          id: string
          image_url: string | null
          is_published: boolean | null
          published_at: string | null
          slug: string
          title_en: string
          title_es: string
          title_it: string
          title_pt: string
          title_zh: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          content_en: string
          content_es: string
          content_it?: string
          content_pt: string
          content_zh: string
          created_at?: string
          excerpt_en: string
          excerpt_es: string
          excerpt_it?: string
          excerpt_pt: string
          excerpt_zh: string
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          published_at?: string | null
          slug: string
          title_en: string
          title_es: string
          title_it?: string
          title_pt: string
          title_zh: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          content_en?: string
          content_es?: string
          content_it?: string
          content_pt?: string
          content_zh?: string
          created_at?: string
          excerpt_en?: string
          excerpt_es?: string
          excerpt_it?: string
          excerpt_pt?: string
          excerpt_zh?: string
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          published_at?: string | null
          slug?: string
          title_en?: string
          title_es?: string
          title_it?: string
          title_pt?: string
          title_zh?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      cgu_sanctions_cache: {
        Row: {
          cpf_cnpj: string
          created_at: string
          data_fim_sancao: string | null
          data_inicio_sancao: string | null
          data_publicacao_sancao: string | null
          descricao_fundamentacao: string | null
          expires_at: string
          fonte_sancao: string | null
          fundamentacao_legal: string | null
          hit_count: number | null
          id: string
          is_active: boolean | null
          nome_fantasia: string | null
          nome_razao_social: string
          numero_processo: string | null
          orgao_sancionador: string | null
          tipo_pessoa: string
          tipo_sancao: string
          uf_orgao_sancionador: string | null
          updated_at: string
        }
        Insert: {
          cpf_cnpj: string
          created_at?: string
          data_fim_sancao?: string | null
          data_inicio_sancao?: string | null
          data_publicacao_sancao?: string | null
          descricao_fundamentacao?: string | null
          expires_at?: string
          fonte_sancao?: string | null
          fundamentacao_legal?: string | null
          hit_count?: number | null
          id?: string
          is_active?: boolean | null
          nome_fantasia?: string | null
          nome_razao_social: string
          numero_processo?: string | null
          orgao_sancionador?: string | null
          tipo_pessoa: string
          tipo_sancao: string
          uf_orgao_sancionador?: string | null
          updated_at?: string
        }
        Update: {
          cpf_cnpj?: string
          created_at?: string
          data_fim_sancao?: string | null
          data_inicio_sancao?: string | null
          data_publicacao_sancao?: string | null
          descricao_fundamentacao?: string | null
          expires_at?: string
          fonte_sancao?: string | null
          fundamentacao_legal?: string | null
          hit_count?: number | null
          id?: string
          is_active?: boolean | null
          nome_fantasia?: string | null
          nome_razao_social?: string
          numero_processo?: string | null
          orgao_sancionador?: string | null
          tipo_pessoa?: string
          tipo_sancao?: string
          uf_orgao_sancionador?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cnpj_cache: {
        Row: {
          bairro: string | null
          capital_social: number | null
          cep: string | null
          cnae_fiscal: number | null
          cnae_fiscal_descricao: string | null
          cnaes_secundarios: Json | null
          cnpj: string
          complemento: string | null
          created_at: string
          data_inicio_atividade: string | null
          data_situacao_cadastral: string | null
          ddd_telefone_1: string | null
          ddd_telefone_2: string | null
          descricao_situacao_cadastral: string | null
          email: string | null
          expires_at: string
          hit_count: number | null
          id: string
          last_accessed_at: string | null
          logradouro: string | null
          municipio: string | null
          natureza_juridica: string | null
          nome_fantasia: string | null
          numero: string | null
          porte: string | null
          qsa: Json | null
          razao_social: string
          situacao_cadastral: string | null
          uf: string | null
          updated_at: string
        }
        Insert: {
          bairro?: string | null
          capital_social?: number | null
          cep?: string | null
          cnae_fiscal?: number | null
          cnae_fiscal_descricao?: string | null
          cnaes_secundarios?: Json | null
          cnpj: string
          complemento?: string | null
          created_at?: string
          data_inicio_atividade?: string | null
          data_situacao_cadastral?: string | null
          ddd_telefone_1?: string | null
          ddd_telefone_2?: string | null
          descricao_situacao_cadastral?: string | null
          email?: string | null
          expires_at?: string
          hit_count?: number | null
          id?: string
          last_accessed_at?: string | null
          logradouro?: string | null
          municipio?: string | null
          natureza_juridica?: string | null
          nome_fantasia?: string | null
          numero?: string | null
          porte?: string | null
          qsa?: Json | null
          razao_social: string
          situacao_cadastral?: string | null
          uf?: string | null
          updated_at?: string
        }
        Update: {
          bairro?: string | null
          capital_social?: number | null
          cep?: string | null
          cnae_fiscal?: number | null
          cnae_fiscal_descricao?: string | null
          cnaes_secundarios?: Json | null
          cnpj?: string
          complemento?: string | null
          created_at?: string
          data_inicio_atividade?: string | null
          data_situacao_cadastral?: string | null
          ddd_telefone_1?: string | null
          ddd_telefone_2?: string | null
          descricao_situacao_cadastral?: string | null
          email?: string | null
          expires_at?: string
          hit_count?: number | null
          id?: string
          last_accessed_at?: string | null
          logradouro?: string | null
          municipio?: string | null
          natureza_juridica?: string | null
          nome_fantasia?: string | null
          numero?: string | null
          porte?: string | null
          qsa?: Json | null
          razao_social?: string
          situacao_cadastral?: string | null
          uf?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      company_intelligence: {
        Row: {
          ai_insights: string | null
          analysis_count: number | null
          collected_data: string | null
          collected_urls: Json | null
          company_name: string
          company_name_normalized: string
          contact_info: Json | null
          country: string | null
          created_at: string
          created_by: string | null
          financial_data: Json | null
          id: string
          industry: string | null
          last_analyzed_at: string | null
          leadership_data: Json | null
          products_services: Json | null
          social_links: Json | null
          updated_at: string
        }
        Insert: {
          ai_insights?: string | null
          analysis_count?: number | null
          collected_data?: string | null
          collected_urls?: Json | null
          company_name: string
          company_name_normalized: string
          contact_info?: Json | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          financial_data?: Json | null
          id?: string
          industry?: string | null
          last_analyzed_at?: string | null
          leadership_data?: Json | null
          products_services?: Json | null
          social_links?: Json | null
          updated_at?: string
        }
        Update: {
          ai_insights?: string | null
          analysis_count?: number | null
          collected_data?: string | null
          collected_urls?: Json | null
          company_name?: string
          company_name_normalized?: string
          contact_info?: Json | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          financial_data?: Json | null
          id?: string
          industry?: string | null
          last_analyzed_at?: string | null
          leadership_data?: Json | null
          products_services?: Json | null
          social_links?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          assigned_to: string | null
          channel: string | null
          company: string | null
          country: string | null
          created_at: string
          email: string
          id: string
          latitude: number | null
          lead_level: string | null
          longitude: number | null
          message: string
          name: string
          next_action: string | null
          next_action_date: string | null
          priority: string | null
          status: string | null
          subject: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          channel?: string | null
          company?: string | null
          country?: string | null
          created_at?: string
          email: string
          id?: string
          latitude?: number | null
          lead_level?: string | null
          longitude?: number | null
          message: string
          name: string
          next_action?: string | null
          next_action_date?: string | null
          priority?: string | null
          status?: string | null
          subject?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          channel?: string | null
          company?: string | null
          country?: string | null
          created_at?: string
          email?: string
          id?: string
          latitude?: number | null
          lead_level?: string | null
          longitude?: number | null
          message?: string
          name?: string
          next_action?: string | null
          next_action_date?: string | null
          priority?: string | null
          status?: string | null
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cpf_cache: {
        Row: {
          cpf: string
          created_at: string
          data_inscricao: string | null
          data_nascimento: string | null
          digito_verificador: string | null
          expires_at: string
          hit_count: number | null
          id: string
          is_valid: boolean | null
          last_accessed_at: string | null
          nome: string | null
          situacao_cadastral: string | null
          updated_at: string
        }
        Insert: {
          cpf: string
          created_at?: string
          data_inscricao?: string | null
          data_nascimento?: string | null
          digito_verificador?: string | null
          expires_at?: string
          hit_count?: number | null
          id?: string
          is_valid?: boolean | null
          last_accessed_at?: string | null
          nome?: string | null
          situacao_cadastral?: string | null
          updated_at?: string
        }
        Update: {
          cpf?: string
          created_at?: string
          data_inscricao?: string | null
          data_nascimento?: string | null
          digito_verificador?: string | null
          expires_at?: string
          hit_count?: number | null
          id?: string
          is_valid?: boolean | null
          last_accessed_at?: string | null
          nome?: string | null
          situacao_cadastral?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      document_templates: {
        Row: {
          content_en: string
          content_es: string
          content_it: string
          content_pt: string
          content_zh: string
          created_at: string
          created_by: string | null
          fields: Json | null
          id: string
          is_active: boolean | null
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          content_en: string
          content_es: string
          content_it: string
          content_pt: string
          content_zh: string
          created_at?: string
          created_by?: string | null
          fields?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          content_en?: string
          content_es?: string
          content_it?: string
          content_pt?: string
          content_zh?: string
          created_at?: string
          created_by?: string | null
          fields?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_signature_settings: {
        Row: {
          company_email: string | null
          company_locations: string | null
          company_name: string | null
          company_phone: string | null
          company_slogan: string | null
          company_website: string | null
          created_at: string
          id: string
          include_social_links: boolean | null
          linkedin_url: string | null
          sender_name: string | null
          sender_phone: string | null
          sender_photo_url: string | null
          sender_position: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_email?: string | null
          company_locations?: string | null
          company_name?: string | null
          company_phone?: string | null
          company_slogan?: string | null
          company_website?: string | null
          created_at?: string
          id?: string
          include_social_links?: boolean | null
          linkedin_url?: string | null
          sender_name?: string | null
          sender_phone?: string | null
          sender_photo_url?: string | null
          sender_position?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_email?: string | null
          company_locations?: string | null
          company_name?: string | null
          company_phone?: string | null
          company_slogan?: string | null
          company_website?: string | null
          created_at?: string
          id?: string
          include_social_links?: boolean | null
          linkedin_url?: string | null
          sender_name?: string | null
          sender_phone?: string | null
          sender_photo_url?: string | null
          sender_position?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body_en: string
          body_es: string
          body_it: string
          body_pt: string
          body_zh: string
          category: string | null
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean | null
          name: string
          subject_en: string
          subject_es: string
          subject_it: string
          subject_pt: string
          subject_zh: string
          updated_at: string
        }
        Insert: {
          body_en: string
          body_es: string
          body_it: string
          body_pt: string
          body_zh: string
          category?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          subject_en: string
          subject_es: string
          subject_it: string
          subject_pt: string
          subject_zh: string
          updated_at?: string
        }
        Update: {
          body_en?: string
          body_es?: string
          body_it?: string
          body_pt?: string
          body_zh?: string
          category?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          subject_en?: string
          subject_es?: string
          subject_it?: string
          subject_pt?: string
          subject_zh?: string
          updated_at?: string
        }
        Relationships: []
      }
      feasibility_studies: {
        Row: {
          administrative_cost: number | null
          annual_ebitda: number | null
          annual_opex: number | null
          annual_revenue: number | null
          collection_model: string | null
          country: string | null
          created_at: string
          created_by: string | null
          daily_capacity_tons: number | null
          depreciation_years: number | null
          discount_rate: number | null
          energy_cost: number | null
          environmental_bonus_per_ton: number | null
          equipment_cost: number | null
          government_royalties_percent: number | null
          id: string
          inflation_rate: number | null
          infrastructure_cost: number | null
          installation_cost: number | null
          irr_percentage: number | null
          labor_cost: number | null
          lead_id: string | null
          lead_type: string | null
          location: string | null
          logistics_cost: number | null
          maintenance_cost: number | null
          notes: string | null
          npv_10_years: number | null
          operating_days_per_year: number | null
          other_capex: number | null
          other_opex: number | null
          payback_months: number | null
          plant_type: string | null
          raw_material_cost: number | null
          rcb_price: number | null
          rcb_yield: number | null
          roi_percentage: number | null
          rubber_granules_price: number | null
          rubber_granules_yield: number | null
          status: string | null
          steel_wire_price: number | null
          steel_wire_yield: number | null
          study_name: string
          tax_rate: number | null
          textile_fiber_price: number | null
          textile_fiber_yield: number | null
          total_investment: number | null
          updated_at: string
          utilization_rate: number | null
          working_capital: number | null
        }
        Insert: {
          administrative_cost?: number | null
          annual_ebitda?: number | null
          annual_opex?: number | null
          annual_revenue?: number | null
          collection_model?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          daily_capacity_tons?: number | null
          depreciation_years?: number | null
          discount_rate?: number | null
          energy_cost?: number | null
          environmental_bonus_per_ton?: number | null
          equipment_cost?: number | null
          government_royalties_percent?: number | null
          id?: string
          inflation_rate?: number | null
          infrastructure_cost?: number | null
          installation_cost?: number | null
          irr_percentage?: number | null
          labor_cost?: number | null
          lead_id?: string | null
          lead_type?: string | null
          location?: string | null
          logistics_cost?: number | null
          maintenance_cost?: number | null
          notes?: string | null
          npv_10_years?: number | null
          operating_days_per_year?: number | null
          other_capex?: number | null
          other_opex?: number | null
          payback_months?: number | null
          plant_type?: string | null
          raw_material_cost?: number | null
          rcb_price?: number | null
          rcb_yield?: number | null
          roi_percentage?: number | null
          rubber_granules_price?: number | null
          rubber_granules_yield?: number | null
          status?: string | null
          steel_wire_price?: number | null
          steel_wire_yield?: number | null
          study_name: string
          tax_rate?: number | null
          textile_fiber_price?: number | null
          textile_fiber_yield?: number | null
          total_investment?: number | null
          updated_at?: string
          utilization_rate?: number | null
          working_capital?: number | null
        }
        Update: {
          administrative_cost?: number | null
          annual_ebitda?: number | null
          annual_opex?: number | null
          annual_revenue?: number | null
          collection_model?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          daily_capacity_tons?: number | null
          depreciation_years?: number | null
          discount_rate?: number | null
          energy_cost?: number | null
          environmental_bonus_per_ton?: number | null
          equipment_cost?: number | null
          government_royalties_percent?: number | null
          id?: string
          inflation_rate?: number | null
          infrastructure_cost?: number | null
          installation_cost?: number | null
          irr_percentage?: number | null
          labor_cost?: number | null
          lead_id?: string | null
          lead_type?: string | null
          location?: string | null
          logistics_cost?: number | null
          maintenance_cost?: number | null
          notes?: string | null
          npv_10_years?: number | null
          operating_days_per_year?: number | null
          other_capex?: number | null
          other_opex?: number | null
          payback_months?: number | null
          plant_type?: string | null
          raw_material_cost?: number | null
          rcb_price?: number | null
          rcb_yield?: number | null
          roi_percentage?: number | null
          rubber_granules_price?: number | null
          rubber_granules_yield?: number | null
          status?: string | null
          steel_wire_price?: number | null
          steel_wire_yield?: number | null
          study_name?: string
          tax_rate?: number | null
          textile_fiber_price?: number | null
          textile_fiber_yield?: number | null
          total_investment?: number | null
          updated_at?: string
          utilization_rate?: number | null
          working_capital?: number | null
        }
        Relationships: []
      }
      generated_documents: {
        Row: {
          all_signatures_data: Json | null
          created_at: string
          current_signatures: number | null
          document_name: string
          document_type: string
          field_values: Json | null
          file_url: string | null
          generated_by: string | null
          id: string
          is_signed: boolean | null
          language: string | null
          lead_id: string | null
          lead_type: string | null
          pending_signer_email: string | null
          pending_signer_name: string | null
          required_signatures: number | null
          sent_at: string | null
          sent_to_email: string | null
          signature_data: Json | null
          signature_hash: string | null
          signature_status: string | null
          signature_type: string | null
          signed_at: string | null
          signer_email: string | null
          signer_name: string | null
          template_id: string | null
        }
        Insert: {
          all_signatures_data?: Json | null
          created_at?: string
          current_signatures?: number | null
          document_name: string
          document_type: string
          field_values?: Json | null
          file_url?: string | null
          generated_by?: string | null
          id?: string
          is_signed?: boolean | null
          language?: string | null
          lead_id?: string | null
          lead_type?: string | null
          pending_signer_email?: string | null
          pending_signer_name?: string | null
          required_signatures?: number | null
          sent_at?: string | null
          sent_to_email?: string | null
          signature_data?: Json | null
          signature_hash?: string | null
          signature_status?: string | null
          signature_type?: string | null
          signed_at?: string | null
          signer_email?: string | null
          signer_name?: string | null
          template_id?: string | null
        }
        Update: {
          all_signatures_data?: Json | null
          created_at?: string
          current_signatures?: number | null
          document_name?: string
          document_type?: string
          field_values?: Json | null
          file_url?: string | null
          generated_by?: string | null
          id?: string
          is_signed?: boolean | null
          language?: string | null
          lead_id?: string | null
          lead_type?: string | null
          pending_signer_email?: string | null
          pending_signer_name?: string | null
          required_signatures?: number | null
          sent_at?: string | null
          sent_to_email?: string | null
          signature_data?: Json | null
          signature_hash?: string | null
          signature_status?: string | null
          signature_type?: string | null
          signed_at?: string | null
          signer_email?: string | null
          signer_name?: string | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_documents_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "document_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      impact_stats: {
        Row: {
          display_order: number | null
          id: string
          is_active: boolean | null
          key: string
          label_en: string
          label_es: string
          label_it: string
          label_pt: string
          label_zh: string
          suffix: string | null
          updated_at: string
          updated_by: string | null
          value: number
        }
        Insert: {
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          key: string
          label_en: string
          label_es: string
          label_it?: string
          label_pt: string
          label_zh: string
          suffix?: string | null
          updated_at?: string
          updated_by?: string | null
          value?: number
        }
        Update: {
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          key?: string
          label_en?: string
          label_es?: string
          label_it?: string
          label_pt?: string
          label_zh?: string
          suffix?: string | null
          updated_at?: string
          updated_by?: string | null
          value?: number
        }
        Relationships: []
      }
      lead_documents: {
        Row: {
          created_at: string
          document_type: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          lead_id: string
          lead_type: string
          notes: string | null
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          document_type: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          lead_id: string
          lead_type: string
          notes?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          document_type?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          lead_id?: string
          lead_type?: string
          notes?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      lead_notes: {
        Row: {
          contact_id: string
          created_at: string
          id: string
          note: string
          note_type: string | null
          user_id: string | null
        }
        Insert: {
          contact_id: string
          created_at?: string
          id?: string
          note: string
          note_type?: string | null
          user_id?: string | null
        }
        Update: {
          contact_id?: string
          created_at?: string
          id?: string
          note?: string
          note_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_notes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      loi_documents: {
        Row: {
          company_name: string
          company_type: string
          contact_name: string
          country: string
          created_at: string
          download_count: number | null
          email: string
          estimated_volume: string | null
          expires_at: string
          id: string
          language: string
          last_accessed_at: string | null
          message: string | null
          products_interest: string[]
          registration_id: string | null
          token: string
        }
        Insert: {
          company_name: string
          company_type: string
          contact_name: string
          country: string
          created_at?: string
          download_count?: number | null
          email: string
          estimated_volume?: string | null
          expires_at?: string
          id?: string
          language?: string
          last_accessed_at?: string | null
          message?: string | null
          products_interest: string[]
          registration_id?: string | null
          token: string
        }
        Update: {
          company_name?: string
          company_type?: string
          contact_name?: string
          country?: string
          created_at?: string
          download_count?: number | null
          email?: string
          estimated_volume?: string | null
          expires_at?: string
          id?: string
          language?: string
          last_accessed_at?: string | null
          message?: string | null
          products_interest?: string[]
          registration_id?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "loi_documents_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "marketplace_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_registrations: {
        Row: {
          assigned_to: string | null
          company_name: string
          company_type: string
          contact_name: string
          country: string
          created_at: string
          email: string
          estimated_volume: string | null
          id: string
          latitude: number | null
          lead_level: string | null
          longitude: number | null
          message: string | null
          next_action: string | null
          next_action_date: string | null
          phone: string | null
          priority: string | null
          products_interest: string[]
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          company_name: string
          company_type: string
          contact_name: string
          country: string
          created_at?: string
          email: string
          estimated_volume?: string | null
          id?: string
          latitude?: number | null
          lead_level?: string | null
          longitude?: number | null
          message?: string | null
          next_action?: string | null
          next_action_date?: string | null
          phone?: string | null
          priority?: string | null
          products_interest: string[]
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          company_name?: string
          company_type?: string
          contact_name?: string
          country?: string
          created_at?: string
          email?: string
          estimated_volume?: string | null
          id?: string
          latitude?: number | null
          lead_level?: string | null
          longitude?: number | null
          message?: string | null
          next_action?: string | null
          next_action_date?: string | null
          phone?: string | null
          priority?: string | null
          products_interest?: string[]
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      meetings: {
        Row: {
          agenda_content: string | null
          agenda_generated_at: string | null
          ai_context_summary: string | null
          ai_suggested_topics: Json | null
          attached_documents: Json | null
          convocation_sent_at: string | null
          created_at: string
          created_by: string | null
          duration_minutes: number | null
          id: string
          lead_id: string | null
          lead_type: string | null
          location: string | null
          meeting_link: string | null
          meeting_type: string
          notes: string | null
          participants: Json | null
          plant_type: string | null
          scheduled_at: string | null
          status: string | null
          summary_content: string | null
          summary_generated_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          agenda_content?: string | null
          agenda_generated_at?: string | null
          ai_context_summary?: string | null
          ai_suggested_topics?: Json | null
          attached_documents?: Json | null
          convocation_sent_at?: string | null
          created_at?: string
          created_by?: string | null
          duration_minutes?: number | null
          id?: string
          lead_id?: string | null
          lead_type?: string | null
          location?: string | null
          meeting_link?: string | null
          meeting_type?: string
          notes?: string | null
          participants?: Json | null
          plant_type?: string | null
          scheduled_at?: string | null
          status?: string | null
          summary_content?: string | null
          summary_generated_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          agenda_content?: string | null
          agenda_generated_at?: string | null
          ai_context_summary?: string | null
          ai_suggested_topics?: Json | null
          attached_documents?: Json | null
          convocation_sent_at?: string | null
          created_at?: string
          created_by?: string | null
          duration_minutes?: number | null
          id?: string
          lead_id?: string | null
          lead_type?: string | null
          location?: string | null
          meeting_link?: string | null
          meeting_type?: string
          notes?: string | null
          participants?: Json | null
          plant_type?: string | null
          scheduled_at?: string | null
          status?: string | null
          summary_content?: string | null
          summary_generated_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          email: string
          id: string
          interests: string[] | null
          is_active: boolean | null
          language: string | null
          name: string | null
          subscribed_at: string
          unsubscribed_at: string | null
        }
        Insert: {
          email: string
          id?: string
          interests?: string[] | null
          is_active?: boolean | null
          language?: string | null
          name?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Update: {
          email?: string
          id?: string
          interests?: string[] | null
          is_active?: boolean | null
          language?: string | null
          name?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      notification_webhooks: {
        Row: {
          created_at: string
          created_by: string | null
          events: string[]
          id: string
          is_active: boolean
          name: string
          updated_at: string
          webhook_type: string
          webhook_url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          events?: string[]
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          webhook_type: string
          webhook_url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          events?: string[]
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          webhook_type?: string
          webhook_url?: string
        }
        Relationships: []
      }
      otr_conversion_goals: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          month: number
          notes: string | null
          target_conversions: number
          target_leads: number
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          month: number
          notes?: string | null
          target_conversions?: number
          target_leads?: number
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          month?: number
          notes?: string | null
          target_conversions?: number
          target_leads?: number
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      partner_profiles: {
        Row: {
          annual_revenue: string | null
          company_linkedin: string | null
          company_registration_number: string | null
          company_website: string | null
          created_at: string
          due_diligence_notes: string | null
          due_diligence_status: string | null
          employees_count: string | null
          id: string
          industry_sector: string | null
          investment_capacity: string | null
          kyc_documents: Json | null
          kyc_status: string | null
          lead_id: string
          lead_type: string
          nda_document_url: string | null
          nda_signed: boolean | null
          nda_signed_at: string | null
          project_description: string | null
          rejection_reason: string | null
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          annual_revenue?: string | null
          company_linkedin?: string | null
          company_registration_number?: string | null
          company_website?: string | null
          created_at?: string
          due_diligence_notes?: string | null
          due_diligence_status?: string | null
          employees_count?: string | null
          id?: string
          industry_sector?: string | null
          investment_capacity?: string | null
          kyc_documents?: Json | null
          kyc_status?: string | null
          lead_id: string
          lead_type: string
          nda_document_url?: string | null
          nda_signed?: boolean | null
          nda_signed_at?: string | null
          project_description?: string | null
          rejection_reason?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          annual_revenue?: string | null
          company_linkedin?: string | null
          company_registration_number?: string | null
          company_website?: string | null
          created_at?: string
          due_diligence_notes?: string | null
          due_diligence_status?: string | null
          employees_count?: string | null
          id?: string
          industry_sector?: string | null
          investment_capacity?: string | null
          kyc_documents?: Json | null
          kyc_status?: string | null
          lead_id?: string
          lead_type?: string
          nda_document_url?: string | null
          nda_signed?: boolean | null
          nda_signed_at?: string | null
          project_description?: string | null
          rejection_reason?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      press_releases: {
        Row: {
          content_en: string
          content_es: string
          content_it: string
          content_pt: string
          content_zh: string
          created_at: string
          id: string
          is_published: boolean | null
          published_at: string | null
          slug: string
          title_en: string
          title_es: string
          title_it: string
          title_pt: string
          title_zh: string
          updated_at: string
        }
        Insert: {
          content_en: string
          content_es: string
          content_it?: string
          content_pt: string
          content_zh: string
          created_at?: string
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          slug: string
          title_en: string
          title_es: string
          title_it?: string
          title_pt: string
          title_zh: string
          updated_at?: string
        }
        Update: {
          content_en?: string
          content_es?: string
          content_it?: string
          content_pt?: string
          content_zh?: string
          created_at?: string
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          slug?: string
          title_en?: string
          title_es?: string
          title_it?: string
          title_pt?: string
          title_zh?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_notifications: {
        Row: {
          body: string
          created_at: string
          failed_count: number | null
          id: string
          sent_by: string | null
          sent_count: number | null
          title: string
          topic: string | null
          url: string | null
        }
        Insert: {
          body: string
          created_at?: string
          failed_count?: number | null
          id?: string
          sent_by?: string | null
          sent_count?: number | null
          title: string
          topic?: string | null
          url?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          failed_count?: number | null
          id?: string
          sent_by?: string | null
          sent_count?: number | null
          title?: string
          topic?: string | null
          url?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          language: string | null
          p256dh: string
          topics: string[] | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          language?: string | null
          p256dh: string
          topics?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          language?: string | null
          p256dh?: string
          topics?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      report_verifications: {
        Row: {
          content_preview: string | null
          created_at: string
          document_date: string
          document_number: string
          generated_at: string
          generated_by: string | null
          generated_document_id: string | null
          id: string
          is_signed: boolean | null
          language: string | null
          last_viewed_at: string | null
          signatory_name: string
          signatory_position: string
          title: string
          verification_hash: string
          views_count: number | null
        }
        Insert: {
          content_preview?: string | null
          created_at?: string
          document_date: string
          document_number: string
          generated_at?: string
          generated_by?: string | null
          generated_document_id?: string | null
          id?: string
          is_signed?: boolean | null
          language?: string | null
          last_viewed_at?: string | null
          signatory_name: string
          signatory_position: string
          title: string
          verification_hash: string
          views_count?: number | null
        }
        Update: {
          content_preview?: string | null
          created_at?: string
          document_date?: string
          document_number?: string
          generated_at?: string
          generated_by?: string | null
          generated_document_id?: string | null
          id?: string
          is_signed?: boolean | null
          language?: string | null
          last_viewed_at?: string | null
          signatory_name?: string
          signatory_position?: string
          title?: string
          verification_hash?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "report_verifications_generated_document_id_fkey"
            columns: ["generated_document_id"]
            isOneToOne: false
            referencedRelation: "generated_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      serpapi_cache: {
        Row: {
          country: string | null
          created_at: string
          expires_at: string
          id: string
          query_hash: string
          query_text: string
          results: Json
        }
        Insert: {
          country?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          query_hash: string
          query_text: string
          results: Json
        }
        Update: {
          country?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          query_hash?: string
          query_text?: string
          results?: Json
        }
        Relationships: []
      }
      signature_log: {
        Row: {
          created_at: string
          document_id: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          signature_hash: string
          signature_type: string
          signer_email: string
          signer_name: string
          timestamp: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          document_id?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          signature_hash: string
          signature_type: string
          signer_email: string
          signer_name: string
          timestamp?: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          document_id?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          signature_hash?: string
          signature_type?: string
          signer_email?: string
          signer_name?: string
          timestamp?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signature_log_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "generated_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      todos: {
        Row: {
          created_at: string | null
          id: string
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      youtube_cache: {
        Row: {
          id: string
          updated_at: string
          videos: Json
        }
        Insert: {
          id: string
          updated_at?: string
          videos?: Json
        }
        Update: {
          id?: string
          updated_at?: string
          videos?: Json
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      clean_expired_cache: { Args: never; Returns: undefined }
      has_any_admin: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_cnpj_cache_hit: {
        Args: { target_cnpj: string }
        Returns: undefined
      }
      increment_loi_download: {
        Args: { loi_token: string }
        Returns: undefined
      }
      increment_report_views: {
        Args: { target_hash: string }
        Returns: undefined
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "editor" | "viewer"
      match_status:
        | "pending"
        | "confirmed"
        | "false_positive"
        | "escalated"
        | "cleared"
      screening_type:
        | "sanctions"
        | "pep"
        | "criminal"
        | "watchlist"
        | "adverse_media"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "editor", "viewer"],
      match_status: [
        "pending",
        "confirmed",
        "false_positive",
        "escalated",
        "cleared",
      ],
      screening_type: [
        "sanctions",
        "pep",
        "criminal",
        "watchlist",
        "adverse_media",
      ],
    },
  },
} as const
