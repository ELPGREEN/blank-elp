-- Drop the existing check constraint and add new document types
ALTER TABLE public.document_templates DROP CONSTRAINT IF EXISTS document_templates_type_check;

-- Add new check constraint with all document types
ALTER TABLE public.document_templates ADD CONSTRAINT document_templates_type_check 
CHECK (type IN ('nda', 'contract', 'report', 'proposal', 'loi', 'mou', 'consent', 'kyc', 'receipt', 'log'));

-- Now add the document templates
-- NDA Template
INSERT INTO public.document_templates (name, type, content_pt, content_en, content_es, content_zh, content_it, fields, is_active)
VALUES 
(
  'Termo de Confidencialidade (NDA)',
  'nda',
  'TERMO DE CONFIDENCIALIDADE (NDA)

Data: {{date}}
Tipo: {{nda_type}}

PARTE REVELADORA: {{disclosing_party}}
PARTE RECEPTORA: {{receiving_party}}

1. OBJETO
As partes concordam em manter sigilo sobre todas as informações confidenciais trocadas durante negociações relacionadas a {{project_description}}.

2. INFORMAÇÕES CONFIDENCIAIS
Incluem, mas não se limitam a: dados técnicos, processos industriais, informações comerciais, estratégias de negócios, dados financeiros.

3. DURAÇÃO DO SIGILO
O dever de confidencialidade permanecerá em vigor por {{confidentiality_duration}} a partir da data de assinatura.

4. PENALIDADES
O descumprimento sujeitará a parte infratora ao pagamento de multa de {{penalty_amount}}.

5. FORO
{{jurisdiction}}

_____________________
{{disclosing_party_signature}}
Parte Reveladora

_____________________
{{receiving_party_signature}}
Parte Receptora',
  'NON-DISCLOSURE AGREEMENT (NDA)

Date: {{date}}
Type: {{nda_type}}

DISCLOSING PARTY: {{disclosing_party}}
RECEIVING PARTY: {{receiving_party}}

1. PURPOSE
The parties agree to maintain confidentiality regarding all confidential information exchanged during negotiations related to {{project_description}}.

2. CONFIDENTIAL INFORMATION
Includes technical data, industrial processes, commercial information, business strategies, financial data.

3. CONFIDENTIALITY DURATION
The duty of confidentiality shall remain in force for {{confidentiality_duration}} from the date of signature.

4. PENALTIES
Breach shall subject the infringing party to a penalty of {{penalty_amount}}.

5. JURISDICTION
{{jurisdiction}}

_____________________
{{disclosing_party_signature}}
Disclosing Party

_____________________
{{receiving_party_signature}}
Receiving Party',
  'ACUERDO DE CONFIDENCIALIDAD (NDA)

Fecha: {{date}}
Tipo: {{nda_type}}

PARTE REVELADORA: {{disclosing_party}}
PARTE RECEPTORA: {{receiving_party}}

1. OBJETO
Las partes acuerdan mantener la confidencialidad sobre la información intercambiada en las negociaciones relacionadas con {{project_description}}.

2. INFORMACIÓN CONFIDENCIAL
Incluye datos técnicos, procesos industriales, información comercial, estrategias comerciales, datos financieros.

3. DURACIÓN
El deber de confidencialidad permanecerá vigente durante {{confidentiality_duration}}.

4. PENALIDADES
El incumplimiento sujetará a la parte infractora al pago de {{penalty_amount}}.

5. JURISDICCIÓN
{{jurisdiction}}

_____________________
{{disclosing_party_signature}}

_____________________
{{receiving_party_signature}}',
  '保密协议 (NDA)

日期: {{date}}
类型: {{nda_type}}

披露方: {{disclosing_party}}
接收方: {{receiving_party}}

1. 目的
双方同意对与{{project_description}}相关的谈判中交换的所有机密信息保密。

2. 机密信息
包括技术数据、工业流程、商业信息、商业策略、财务数据。

3. 保密期限
保密义务自签署之日起{{confidentiality_duration}}内有效。

4. 处罚
违反本协议须支付{{penalty_amount}}的罚款。

5. 管辖权
{{jurisdiction}}

_____________________
{{disclosing_party_signature}}

_____________________
{{receiving_party_signature}}',
  'ACCORDO DI RISERVATEZZA (NDA)

Data: {{date}}
Tipo: {{nda_type}}

PARTE DIVULGANTE: {{disclosing_party}}
PARTE RICEVENTE: {{receiving_party}}

1. OGGETTO
Le parti concordano di mantenere la riservatezza su tutte le informazioni confidenziali scambiate durante le trattative relative a {{project_description}}.

2. INFORMAZIONI RISERVATE
Includono dati tecnici, processi industriali, informazioni commerciali, strategie aziendali, dati finanziari.

3. DURATA DELLA RISERVATEZZA
L obbligo di riservatezza rimarrà in vigore per {{confidentiality_duration}}.

4. PENALI
La violazione comporterà il pagamento di {{penalty_amount}}.

5. FORO COMPETENTE
{{jurisdiction}}

_____________________
{{disclosing_party_signature}}

_____________________
{{receiving_party_signature}}',
  '[{"name":"date","label":"Data","type":"date","required":true},{"name":"nda_type","label":"Tipo (Unilateral/Bilateral/Multilateral)","type":"text","required":true},{"name":"disclosing_party","label":"Parte Reveladora","type":"text","required":true},{"name":"receiving_party","label":"Parte Receptora","type":"text","required":true},{"name":"project_description","label":"Descrição do Projeto","type":"textarea","required":true},{"name":"confidentiality_duration","label":"Duração do Sigilo","type":"text","required":true},{"name":"penalty_amount","label":"Valor da Multa","type":"text","required":true},{"name":"jurisdiction","label":"Jurisdição","type":"text","required":true}]',
  true
),
(
  'Contrato de Joint Venture',
  'contract',
  'CONTRATO DE JOINT VENTURE

Data: {{date}}
Local: {{location}}

PARTES:
1. {{party_a_name}}, {{party_a_address}}
2. {{party_b_name}}, {{party_b_address}}

1. OBJETIVO
As partes constituem uma joint venture para {{project_objective}}.

2. CONTRIBUIÇÕES
- {{party_a_name}}: {{party_a_contribution}}
- {{party_b_name}}: {{party_b_contribution}}

3. DIVISÃO DE RESULTADOS
{{profit_share_a}}% para {{party_a_name}} e {{profit_share_b}}% para {{party_b_name}}.

4. CRONOGRAMA
Início: {{start_date}} | Término: {{end_date}}

5. CLÁUSULA DE SAÍDA
Aviso prévio de {{exit_notice_period}}.

6. FORO
{{jurisdiction}}

_____________________
{{party_a_signature}}

_____________________
{{party_b_signature}}',
  'JOINT VENTURE AGREEMENT

Date: {{date}}
Location: {{location}}

PARTIES:
1. {{party_a_name}}, {{party_a_address}}
2. {{party_b_name}}, {{party_b_address}}

1. PURPOSE
The parties establish a joint venture for {{project_objective}}.

2. CONTRIBUTIONS
- {{party_a_name}}: {{party_a_contribution}}
- {{party_b_name}}: {{party_b_contribution}}

3. PROFIT SHARING
{{profit_share_a}}% for {{party_a_name}} and {{profit_share_b}}% for {{party_b_name}}.

4. TIMELINE
Start: {{start_date}} | End: {{end_date}}

5. EXIT CLAUSE
Prior notice of {{exit_notice_period}}.

6. JURISDICTION
{{jurisdiction}}

_____________________
{{party_a_signature}}

_____________________
{{party_b_signature}}',
  'CONTRATO DE JOINT VENTURE

Fecha: {{date}}
Ubicación: {{location}}

PARTES:
1. {{party_a_name}}, {{party_a_address}}
2. {{party_b_name}}, {{party_b_address}}

1. OBJETIVO
Las partes establecen una joint venture para {{project_objective}}.

2. CONTRIBUCIONES
- {{party_a_name}}: {{party_a_contribution}}
- {{party_b_name}}: {{party_b_contribution}}

3. DISTRIBUCIÓN
{{profit_share_a}}% para {{party_a_name}} y {{profit_share_b}}% para {{party_b_name}}.

4. CRONOGRAMA
Inicio: {{start_date}} | Fin: {{end_date}}

5. SALIDA
Aviso previo de {{exit_notice_period}}.

6. JURISDICCIÓN
{{jurisdiction}}

_____________________
{{party_a_signature}}

_____________________
{{party_b_signature}}',
  '合资企业协议

日期: {{date}}
地点: {{location}}

各方:
1. {{party_a_name}}，{{party_a_address}}
2. {{party_b_name}}，{{party_b_address}}

1. 目的
各方为{{project_objective}}建立合资企业。

2. 出资
- {{party_a_name}}: {{party_a_contribution}}
- {{party_b_name}}: {{party_b_contribution}}

3. 利润分配
{{party_a_name}}占{{profit_share_a}}%，{{party_b_name}}占{{profit_share_b}}%。

4. 时间表
开始：{{start_date}} | 结束：{{end_date}}

5. 退出条款
提前{{exit_notice_period}}通知。

6. 管辖权
{{jurisdiction}}

_____________________
{{party_a_signature}}

_____________________
{{party_b_signature}}',
  'CONTRATTO DI JOINT VENTURE

Data: {{date}}
Luogo: {{location}}

PARTI:
1. {{party_a_name}}, {{party_a_address}}
2. {{party_b_name}}, {{party_b_address}}

1. SCOPO
Le parti costituiscono una joint venture per {{project_objective}}.

2. CONTRIBUTI
- {{party_a_name}}: {{party_a_contribution}}
- {{party_b_name}}: {{party_b_contribution}}

3. DIVISIONE
{{profit_share_a}}% per {{party_a_name}} e {{profit_share_b}}% per {{party_b_name}}.

4. CRONOPROGRAMMA
Inizio: {{start_date}} | Fine: {{end_date}}

5. CLAUSOLA DI USCITA
Preavviso di {{exit_notice_period}}.

6. FORO COMPETENTE
{{jurisdiction}}

_____________________
{{party_a_signature}}

_____________________
{{party_b_signature}}',
  '[{"name":"date","label":"Data","type":"date","required":true},{"name":"location","label":"Local","type":"text","required":true},{"name":"party_a_name","label":"Nome Parte A","type":"text","required":true},{"name":"party_a_address","label":"Endereço Parte A","type":"text","required":true},{"name":"party_b_name","label":"Nome Parte B","type":"text","required":true},{"name":"party_b_address","label":"Endereço Parte B","type":"text","required":true},{"name":"project_objective","label":"Objetivo","type":"textarea","required":true},{"name":"party_a_contribution","label":"Contribuição A","type":"textarea","required":true},{"name":"party_b_contribution","label":"Contribuição B","type":"textarea","required":true},{"name":"profit_share_a","label":"% Lucro A","type":"number","required":true},{"name":"profit_share_b","label":"% Lucro B","type":"number","required":true},{"name":"start_date","label":"Data Início","type":"date","required":true},{"name":"end_date","label":"Data Término","type":"date","required":true},{"name":"exit_notice_period","label":"Período Aviso Prévio","type":"text","required":true},{"name":"jurisdiction","label":"Jurisdição","type":"text","required":true}]',
  true
),
(
  'Relatório de Impacto Ambiental',
  'report',
  'RELATÓRIO DE IMPACTO AMBIENTAL

Preparado para: {{company_name}}
Data: {{date}}
Projeto: {{project_name}}

MÉTRICAS AMBIENTAIS
- Toneladas processadas: {{tons_processed}} t
- CO2 evitado: {{co2_avoided}} toneladas
- Pneus equivalentes: {{tires_equivalent}} unidades
- Óleo pirolítico: {{pyrolytic_oil}} litros
- rCB produzido: {{rcb_produced}} kg
- Aço reciclado: {{steel_recycled}} kg

CONTRIBUIÇÃO ODS
- ODS 12: Consumo Responsável
- ODS 13: Ação Climática
- ODS 9: Inovação

CERTIFICAÇÕES
{{certifications}}

_____________________
ELP Green Technology
www.elpgreen.com',
  'ENVIRONMENTAL IMPACT REPORT

Prepared for: {{company_name}}
Date: {{date}}
Project: {{project_name}}

ENVIRONMENTAL METRICS
- Tons processed: {{tons_processed}} t
- CO2 avoided: {{co2_avoided}} tons
- Equivalent tires: {{tires_equivalent}} units
- Pyrolytic oil: {{pyrolytic_oil}} liters
- rCB produced: {{rcb_produced}} kg
- Recycled steel: {{steel_recycled}} kg

SDG CONTRIBUTION
- SDG 12: Responsible Consumption
- SDG 13: Climate Action
- SDG 9: Innovation

CERTIFICATIONS
{{certifications}}

_____________________
ELP Green Technology
www.elpgreen.com',
  'INFORME DE IMPACTO AMBIENTAL

Preparado para: {{company_name}}
Fecha: {{date}}
Proyecto: {{project_name}}

MÉTRICAS AMBIENTALES
- Toneladas procesadas: {{tons_processed}} t
- CO2 evitado: {{co2_avoided}} toneladas
- Neumáticos equivalentes: {{tires_equivalent}} unidades
- Aceite pirolítico: {{pyrolytic_oil}} litros
- rCB producido: {{rcb_produced}} kg
- Acero reciclado: {{steel_recycled}} kg

CONTRIBUCIÓN ODS
- ODS 12: Consumo Responsable
- ODS 13: Acción Climática
- ODS 9: Innovación

CERTIFICACIONES
{{certifications}}

_____________________
ELP Green Technology
www.elpgreen.com',
  '环境影响报告

为: {{company_name}} 准备
日期: {{date}}
项目: {{project_name}}

环境指标
- 处理吨数: {{tons_processed}} 吨
- 减少CO2: {{co2_avoided}} 吨
- 等效轮胎: {{tires_equivalent}} 个
- 热解油: {{pyrolytic_oil}} 升
- rCB产量: {{rcb_produced}} 公斤
- 再生钢: {{steel_recycled}} 公斤

SDG贡献
- SDG 12: 负责任消费
- SDG 13: 气候行动
- SDG 9: 创新

认证
{{certifications}}

_____________________
ELP Green Technology
www.elpgreen.com',
  'RAPPORTO IMPATTO AMBIENTALE

Preparato per: {{company_name}}
Data: {{date}}
Progetto: {{project_name}}

METRICHE AMBIENTALI
- Tonnellate lavorate: {{tons_processed}} t
- CO2 evitata: {{co2_avoided}} tonnellate
- Pneumatici equivalenti: {{tires_equivalent}} unità
- Olio pirolitico: {{pyrolytic_oil}} litri
- rCB prodotto: {{rcb_produced}} kg
- Acciaio riciclato: {{steel_recycled}} kg

CONTRIBUTO SDG
- SDG 12: Consumo Responsabile
- SDG 13: Azione Climatica
- SDG 9: Innovazione

CERTIFICAZIONI
{{certifications}}

_____________________
ELP Green Technology
www.elpgreen.com',
  '[{"name":"company_name","label":"Empresa","type":"text","required":true},{"name":"date","label":"Data","type":"date","required":true},{"name":"project_name","label":"Projeto","type":"text","required":true},{"name":"tons_processed","label":"Toneladas Processadas","type":"number","required":true},{"name":"co2_avoided","label":"CO2 Evitado (ton)","type":"number","required":true},{"name":"tires_equivalent","label":"Pneus Equivalentes","type":"number","required":true},{"name":"pyrolytic_oil","label":"Óleo Pirolítico (L)","type":"number","required":false},{"name":"rcb_produced","label":"rCB (kg)","type":"number","required":false},{"name":"steel_recycled","label":"Aço (kg)","type":"number","required":false},{"name":"certifications","label":"Certificações","type":"textarea","required":false}]',
  true
),
(
  'Termo de Consentimento LGPD/GDPR',
  'consent',
  'TERMO DE CONSENTIMENTO PARA TRATAMENTO DE DADOS

Data: {{date}}
Titular: {{data_subject_name}}
E-mail: {{data_subject_email}}

CONSENTIMENTO
Eu autorizo a ELP Green Technology a coletar e tratar meus dados pessoais para: {{data_purpose}}.

DADOS COLETADOS
{{data_collected}}

PERÍODO DE RETENÇÃO
{{retention_period}}

DIREITOS
O titular pode exercer seus direitos via: dpo@elpgreen.com

_____________________
{{data_subject_signature}}
Data: {{signature_date}}',
  'CONSENT FORM FOR DATA PROCESSING

Date: {{date}}
Data Subject: {{data_subject_name}}
Email: {{data_subject_email}}

CONSENT
I authorize ELP Green Technology to collect and process my personal data for: {{data_purpose}}.

DATA COLLECTED
{{data_collected}}

RETENTION PERIOD
{{retention_period}}

RIGHTS
Data subject may exercise rights via: dpo@elpgreen.com

_____________________
{{data_subject_signature}}
Date: {{signature_date}}',
  'FORMULARIO DE CONSENTIMIENTO

Fecha: {{date}}
Titular: {{data_subject_name}}
Email: {{data_subject_email}}

CONSENTIMIENTO
Autorizo a ELP Green Technology a recopilar y tratar mis datos personales para: {{data_purpose}}.

DATOS RECOPILADOS
{{data_collected}}

PERÍODO DE RETENCIÓN
{{retention_period}}

DERECHOS
El titular puede ejercer sus derechos via: dpo@elpgreen.com

_____________________
{{data_subject_signature}}
Fecha: {{signature_date}}',
  '数据处理同意书

日期: {{date}}
数据主体: {{data_subject_name}}
邮箱: {{data_subject_email}}

同意
我授权ELP Green Technology收集和处理我的个人数据用于: {{data_purpose}}。

收集的数据
{{data_collected}}

保留期限
{{retention_period}}

权利
数据主体可通过以下方式行使权利: dpo@elpgreen.com

_____________________
{{data_subject_signature}}
日期: {{signature_date}}',
  'MODULO DI CONSENSO

Data: {{date}}
Interessato: {{data_subject_name}}
Email: {{data_subject_email}}

CONSENSO
Autorizzo ELP Green Technology a raccogliere e trattare i miei dati personali per: {{data_purpose}}.

DATI RACCOLTI
{{data_collected}}

PERIODO DI CONSERVAZIONE
{{retention_period}}

DIRITTI
L interessato può esercitare i propri diritti via: dpo@elpgreen.com

_____________________
{{data_subject_signature}}
Data: {{signature_date}}',
  '[{"name":"date","label":"Data","type":"date","required":true},{"name":"data_subject_name","label":"Nome do Titular","type":"text","required":true},{"name":"data_subject_email","label":"E-mail","type":"text","required":true},{"name":"data_purpose","label":"Finalidade","type":"textarea","required":true},{"name":"data_collected","label":"Dados Coletados","type":"textarea","required":true},{"name":"retention_period","label":"Período de Retenção","type":"text","required":true},{"name":"signature_date","label":"Data da Assinatura","type":"date","required":false}]',
  true
),
(
  'Proposta Técnica',
  'proposal',
  'PROPOSTA TÉCNICA

Data: {{date}}
Proposta Nº: {{proposal_number}}
Cliente: {{client_name}}

SUMÁRIO
{{executive_summary}}

PROJETO
Nome: {{project_name}}
Local: {{project_location}}
Tecnologia: {{technology_type}}

ESCOPO TÉCNICO
{{technical_scope}}

CAPACIDADE
{{processing_capacity}} ton/ano

INVESTIMENTO
{{investment_estimate}}

CRONOGRAMA
{{timeline}}

_____________________
ELP Green Technology
info@elpgreen.com',
  'TECHNICAL PROPOSAL

Date: {{date}}
Proposal No: {{proposal_number}}
Client: {{client_name}}

SUMMARY
{{executive_summary}}

PROJECT
Name: {{project_name}}
Location: {{project_location}}
Technology: {{technology_type}}

TECHNICAL SCOPE
{{technical_scope}}

CAPACITY
{{processing_capacity}} ton/year

INVESTMENT
{{investment_estimate}}

TIMELINE
{{timeline}}

_____________________
ELP Green Technology
info@elpgreen.com',
  'PROPUESTA TÉCNICA

Fecha: {{date}}
Propuesta Nº: {{proposal_number}}
Cliente: {{client_name}}

RESUMEN
{{executive_summary}}

PROYECTO
Nombre: {{project_name}}
Ubicación: {{project_location}}
Tecnología: {{technology_type}}

ALCANCE TÉCNICO
{{technical_scope}}

CAPACIDAD
{{processing_capacity}} ton/año

INVERSIÓN
{{investment_estimate}}

CRONOGRAMA
{{timeline}}

_____________________
ELP Green Technology
info@elpgreen.com',
  '技术建议书

日期: {{date}}
编号: {{proposal_number}}
客户: {{client_name}}

摘要
{{executive_summary}}

项目
名称: {{project_name}}
位置: {{project_location}}
技术: {{technology_type}}

技术范围
{{technical_scope}}

容量
{{processing_capacity}} 吨/年

投资
{{investment_estimate}}

时间表
{{timeline}}

_____________________
ELP Green Technology
info@elpgreen.com',
  'PROPOSTA TECNICA

Data: {{date}}
Proposta N.: {{proposal_number}}
Cliente: {{client_name}}

SOMMARIO
{{executive_summary}}

PROGETTO
Nome: {{project_name}}
Ubicazione: {{project_location}}
Tecnologia: {{technology_type}}

AMBITO TECNICO
{{technical_scope}}

CAPACITÀ
{{processing_capacity}} ton/anno

INVESTIMENTO
{{investment_estimate}}

CRONOPROGRAMMA
{{timeline}}

_____________________
ELP Green Technology
info@elpgreen.com',
  '[{"name":"date","label":"Data","type":"date","required":true},{"name":"proposal_number","label":"Número","type":"text","required":true},{"name":"client_name","label":"Cliente","type":"text","required":true},{"name":"executive_summary","label":"Sumário","type":"textarea","required":true},{"name":"project_name","label":"Nome do Projeto","type":"text","required":true},{"name":"project_location","label":"Localização","type":"text","required":true},{"name":"technology_type","label":"Tipo de Tecnologia","type":"text","required":true},{"name":"technical_scope","label":"Escopo Técnico","type":"textarea","required":true},{"name":"processing_capacity","label":"Capacidade (ton/ano)","type":"number","required":true},{"name":"investment_estimate","label":"Investimento","type":"textarea","required":true},{"name":"timeline","label":"Cronograma","type":"textarea","required":true}]',
  true
)
ON CONFLICT DO NOTHING;