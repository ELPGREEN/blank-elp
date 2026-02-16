

# Plano de Auditoria e Atualização Completa do Projeto ELP Green Technology

## Resumo do Estado Atual

O projeto possui **30 paginas**, **30 edge functions**, **38 tabelas no banco**, **13 hooks**, **16 libs**, **60+ componentes admin**, e **5 idiomas (i18n)**. A auditoria identificou **42 alertas de segurança** no linter do Supabase e o arquivo `config.toml` foi removido das configuracoes das edge functions.

---

## Fase 1: Restauracao da Infraestrutura (Prioridade Critica)

### 1.1 Restaurar `supabase/config.toml`
O arquivo foi reduzido a apenas 1 linha, perdendo todas as configuracoes de `verify_jwt` das 30 edge functions. Restaurar todas as entradas:
- ai-hub, aml-screening, analisar-com-claude, analisar-com-gemini, analisar-com-groq, analyze-feasibility, coletar-dados-concorrentes, complementar-com-gemini, discover-company-urls, fetch-youtube-videos, firecrawl-map, firecrawl-scrape, generate-collaborative-document, generate-document-ai, generate-meeting-document, get-vapid-key, notify-next-signer, notify-otr-approval, notify-template-submission, send-contact-email, send-document-signature-link, send-marketplace-email, send-meeting-convocation, send-push-notification, send-reply-email, send-signature-confirmation, send-signature-reminder, send-webhook-notification, send-weekly-report, serpapi-about

### 1.2 Verificar e re-deploy de todas as edge functions
- Validar que cada funcao esta funcional apos restauracao do config
- Testar endpoints criticos: `send-contact-email`, `ai-hub`, `aml-screening`

---

## Fase 2: Seguranca do Banco de Dados (42 alertas)

### 2.1 Corrigir RLS Policies permissivas
- **2 politicas "always true"** (INSERT/UPDATE/DELETE com `USING(true)` ou `WITH CHECK(true)`) - identificar e restringir
- **39 tabelas com acesso anonimo** - revisar cada politica para garantir que apenas dados publicos estejam acessiveis sem autenticacao
- Tabelas criticas a revisar: `user_roles`, `profiles`, `admin_emails`, `contacts`, `feasibility_studies`, `generated_documents`

### 2.2 Habilitar protecao contra senhas vazadas
- Ativar "Leaked Password Protection" nas configuracoes de Auth do Supabase

### 2.3 Revisar politicas por tabela
Agrupar em 3 categorias:
- **Publicas** (ok com acesso anon): `articles`, `press_releases`, `impact_stats`, `youtube_cache`
- **Autenticadas** (remover acesso anon): `admin_emails`, `contacts`, `feasibility_studies`, `meetings`, `lead_documents`, `lead_notes`
- **Sensíveis** (restringir apenas admin): `user_roles`, `audit_log`, `aml_screening_*`, `notification_webhooks`

---

## Fase 3: Auditoria das 30 Paginas

### 3.1 Paginas Publicas (verificar i18n, SEO, responsividade)
| Pagina | Arquivo | Linhas | Verificar |
|--------|---------|--------|-----------|
| Home | Index.tsx | 863 | Restaurar conteudo (foi apagada anteriormente) |
| About | About.tsx | 1415 | i18n, imagens, 3D globe |
| Solutions | Solutions.tsx | - | i18n, links |
| ESG | ESG.tsx | - | Conteudo, dados |
| Investors | Investors.tsx | - | Dados financeiros |
| Media | Media.tsx | - | Videos, artigos |
| Contact | Contact.tsx | - | Formulario, edge function |
| FAQ | FAQ.tsx | - | Traducoes |
| Certificates | Certificates.tsx | - | PDFs acessiveis |
| Privacy/Terms/Cookies | 3 paginas | - | Conformidade legal |

### 3.2 Paginas de Plantas Industriais
- TireRecyclingPlant, PyrolysisPlant, OTRPlant - verificar dados tecnicos, imagens, traducoes

### 3.3 Paginas de Negocios
- OTRPartnership, OTRSources, BrazilLatam, GlobalExpansion, Marketplace, BusinessIndex, RequestQuote

### 3.4 Paginas de Admin (protegidas)
- Admin.tsx (1169 linhas) - verificar todas as abas e funcionalidades
- Login/Signup - verificar fluxo de autenticacao

### 3.5 Paginas de Documentos
- LOIViewer, TemplateViewer, PublicSignature - verificar acesso publico via token

---

## Fase 4: Verificacao dos 30 Edge Functions

Cada funcao sera verificada quanto a:
- Codigo funcional e sem erros
- CORS headers corretos
- Tratamento de erros
- Secrets necessarios configurados

| Grupo | Functions | Secrets Necessarios |
|-------|-----------|-------------------|
| AI/Analise | ai-hub, analisar-com-claude, analisar-com-gemini, analisar-com-groq, analyze-feasibility, complementar-com-gemini | ANTHROPIC_API_KEY, GEMINI_API_KEY, GROQ_API_KEY |
| Email | send-contact-email, send-reply-email, send-marketplace-email, send-meeting-convocation, send-signature-*, send-weekly-report | RESEND_API_KEY |
| Scraping | firecrawl-map, firecrawl-scrape, coletar-dados-concorrentes, serpapi-about, discover-company-urls | FIRECRAWL_API_KEY, SERPAPI_API_KEY |
| Documentos | generate-document-ai, generate-collaborative-document, generate-meeting-document | ANTHROPIC_API_KEY |
| Notificacoes | notify-next-signer, notify-otr-approval, notify-template-submission, send-push-notification, send-webhook-notification, get-vapid-key | VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, RESEND_API_KEY |
| Midia | fetch-youtube-videos | YOUTUBE_API_KEY |
| AML | aml-screening | GEMINI_API_KEY |

---

## Fase 5: Verificacao das 38 Tabelas

### 5.1 Tabelas Core
- `profiles`, `user_roles`, `contacts`, `newsletter_subscribers`

### 5.2 Tabelas de Negocios
- `analises`, `company_intelligence`, `feasibility_studies`, `loi_documents`, `marketplace_registrations`, `otr_conversion_goals`, `partner_profiles`

### 5.3 Tabelas de Documentos
- `generated_documents`, `document_templates`, `signature_log`, `report_verifications`

### 5.4 Tabelas de Email
- `admin_emails`, `email_templates`, `email_signature_settings`

### 5.5 Tabelas de AML/Compliance
- `aml_screening_reports`, `aml_screening_matches`, `aml_screened_lists`, `aml_screening_history`

### 5.6 Tabelas de Cache
- `cnpj_cache`, `cpf_cache`, `cgu_sanctions_cache`, `serpapi_cache`, `youtube_cache`

### 5.7 Tabelas de Sistema
- `audit_log`, `push_notifications`, `push_subscriptions`, `notification_webhooks`, `meetings`, `lead_documents`, `lead_notes`, `impact_stats`, `todos`, `press_releases`, `articles`

---

## Fase 6: Hooks e Libs

### 6.1 Hooks (13 arquivos)
- `useAuth` - verificar fluxo de autenticacao
- `useSupabaseCRUD` - verificar operacoes CRUD
- `useContactForm` - verificar envio de email
- `useLeadAI` - verificar integracao AI
- `usePushNotifications` - verificar push notifications
- `useAntiCopy` - verificar protecao de conteudo
- Demais: useParallax, useImpactStats, useNewsletter, useI18nDebug, useTranslationFallback, use-mobile, use-toast

### 6.2 Libs (16 arquivos)
- 7 geradores de PDF (feasibility, LOI, intelligence, reports, templates, professional)
- emailTemplates, incotermsAndTaxes, industrialCostsByCountry
- pdfBranding, pdfCjkFontLoader, pdfTableSystem
- siteConfig, utils, openExternal

---

## Fase 7: i18n (5 idiomas)

- Rodar validacao de traducoes (en, pt, es, zh, it)
- Corrigir chaves ausentes ou vazias
- Garantir cobertura 100% para todos os idiomas

---

## Fase 8: Componentes Admin (60+ componentes)

Verificar cada componente em `src/components/admin/`:
- AIAutomationHub, AMLScreeningHub, BatchLeadAnalysis, BulkDocumentGenerator
- CRMPipeline, CompanyIntelligenceManager, ContentEditorWithAI
- DocumentGenerator, DocumentAICorrector, DuoIntelligenceHub
- ELPReportGenerator, ELPSignaturePortal, EmailInbox, EmailSignatureSettings
- ExportPriceCalculator, FeasibilityStudyCalculator (+ 6 sub-componentes)
- GlobalLeadMap, InfrastructureCostCalculator, LeadAIAnalysis
- MeetingDocumentGenerator, MultipleSignersManager, NotificationCenter
- OTRCompositionTable, OTRLeadManagement, PartnerDocumentFolders, PartnerLevels
- SemanticDocumentSearch, SignaturePad, SignedDocumentsManager
- TireModelSelector, UserManagement, WorkflowStatus

---

## Ordem de Execucao Recomendada

1. **Fase 1** - Restaurar config.toml (5 min) - URGENTE
2. **Fase 2** - Seguranca RLS (30-60 min por batch)
3. **Fase 4** - Edge functions verificacao (por grupo)
4. **Fase 7** - i18n validacao (automatizado com testes)
5. **Fase 3** - Paginas (por grupo de prioridade)
6. **Fase 5** - Tabelas (junto com Fase 2)
7. **Fase 6** - Hooks e Libs
8. **Fase 8** - Componentes Admin

---

## Detalhes Tecnicos

- **Framework**: React 18 + Vite + TypeScript + Tailwind CSS
- **Backend**: Supabase (38 tabelas, 30 edge functions, 10 DB functions)
- **Auth**: Supabase Auth com Google OAuth + email/password
- **i18n**: i18next com 5 idiomas
- **3D**: React Three Fiber (globe, particles)
- **PDFs**: jsPDF com suporte CJK
- **Estado**: TanStack Query + React state local
- **Testes**: Vitest + Playwright

Cada fase sera executada sequencialmente, com verificacao de funcionamento apos cada alteracao.

