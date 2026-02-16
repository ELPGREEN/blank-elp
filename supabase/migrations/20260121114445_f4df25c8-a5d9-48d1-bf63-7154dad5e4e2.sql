-- 1. Inserir contacts
INSERT INTO contacts (id, name, email, company, subject, message, channel, status, created_at, updated_at, lead_level, priority)
VALUES (
  'cd7899f3-98dd-452c-a39c-05e80ee06fe9',
  'Ericson Piccoli',
  'elpenergia@gmail.com',
  'Elpgreen',
  '📄 OTR Source - Via PDF QR Code',
  'SUAS INFORMAÇÕES: Ericson Piccoli - Elpgreen - Vale do rio tigre - brazil-mt - 24.00-35 - QR Code do PDF de Viabilidade',
  'otr-source-indication-pdf-qr',
  'pending',
  '2026-01-19 06:11:52.569584+00',
  '2026-01-19 16:42:24.335034+00',
  'qualified',
  'medium'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Inserir feasibility_studies
INSERT INTO feasibility_studies (
  id, study_name, location, country, plant_type, daily_capacity_tons, operating_days_per_year,
  utilization_rate, equipment_cost, installation_cost, infrastructure_cost, working_capital,
  other_capex, raw_material_cost, labor_cost, energy_cost, maintenance_cost, logistics_cost,
  administrative_cost, other_opex, rubber_granules_price, rubber_granules_yield, steel_wire_price,
  steel_wire_yield, textile_fiber_price, textile_fiber_yield, tax_rate, depreciation_years,
  discount_rate, inflation_rate, total_investment, annual_revenue, annual_opex, annual_ebitda,
  payback_months, roi_percentage, npv_10_years, irr_percentage, status, notes,
  government_royalties_percent, environmental_bonus_per_ton, collection_model, rcb_price, rcb_yield,
  created_at, updated_at
)
VALUES (
  'ef4a3674-4c31-4c4e-8d9e-e1259720dfa3',
  'AIR3-Mexico - Government OTR Partnership',
  '22WQ+R5 El Novillo, Aguascalientes, Messico',
  'Mexico',
  'otr_recycling',
  105.00, 300, 90.00, 15000000.00, 420000.00, 950000.00, 520000.00, 320000.00,
  0.00, 25000.00, 20000.00, 16000.00, 32000.00, 11000.00, 8000.00,
  240.00, 74.70, 210.00, 15.70, 110.00, 9.70, 30.00, 10, 12.00, 3.00,
  17210000.00, 9721782.00, 1344000.00, 8377782.00, 33, 37.08, 18842645.90, 35.27,
  'approved',
  'Initial prospectus - non-binding proposal.',
  0, 0, 'direct', 1000, 12,
  '2026-01-19 04:30:15.063989+00',
  '2026-01-19 11:23:49.007147+00'
)
ON CONFLICT (id) DO NOTHING;

-- 3. Inserir document_templates
INSERT INTO document_templates (id, name, type, content_pt, content_en, content_es, content_zh, content_it, fields, is_active, created_at, updated_at)
VALUES 
  ('6ecfacbb-2830-4e55-8f2d-c2f34df20fc6', 'NDA Padrão', 'nda', 
   'ACORDO DE CONFIDENCIALIDADE entre ELP Alliance S/A e {{company_name}}. Data: {{date}}. As partes concordam em manter sigilo.',
   'NON-DISCLOSURE AGREEMENT between ELP Alliance S/A and {{company_name}}. Date: {{date}}. Parties agree to maintain confidentiality.',
   'ACUERDO DE CONFIDENCIALIDAD entre ELP Alliance S/A y {{company_name}}. Fecha: {{date}}. Las partes acuerdan mantener la confidencialidad.',
   '保密协议 ELP Alliance S/A与{{company_name}}之间 日期：{{date}} 双方同意对所有信息保密。',
   'ACCORDO DI RISERVATEZZA tra ELP Alliance S/A e {{company_name}}. Data: {{date}}. Le parti concordano di mantenere la riservatezza.',
   '[{"label":"Nome da Empresa","name":"company_name","required":true,"type":"text"},{"label":"Data","name":"date","required":true,"type":"date"},{"label":"Nome do Contato","name":"contact_name","required":true,"type":"text"}]',
   true, '2026-01-17 23:26:31.158827+00', '2026-01-17 23:26:31.158827+00'),
   
  ('eed54733-297d-4f95-9319-9925aba11bcb', 'Relatório de Sustentabilidade', 'report',
   'RELATÓRIO DE IMPACTO AMBIENTAL. Empresa: {{company_name}}. Período: {{period}}. CO2 evitado: {{co2_avoided}} ton. Pneus reciclados: {{tires_recycled}}.',
   'ENVIRONMENTAL IMPACT REPORT. Company: {{company_name}}. Period: {{period}}. CO2 avoided: {{co2_avoided}} tons. Tires recycled: {{tires_recycled}}.',
   'INFORME DE IMPACTO AMBIENTAL. Empresa: {{company_name}}. Período: {{period}}. CO2 evitado: {{co2_avoided}} ton. Neumáticos reciclados: {{tires_recycled}}.',
   '环境影响报告 公司：{{company_name}} 期间：{{period}} CO2避免：{{co2_avoided}}吨 回收轮胎：{{tires_recycled}}',
   'RAPPORTO DI IMPATTO AMBIENTALE. Azienda: {{company_name}}. Periodo: {{period}}. CO2 evitata: {{co2_avoided}} ton. Pneumatici riciclati: {{tires_recycled}}.',
   '[{"label":"Nome da Empresa","name":"company_name","required":true,"type":"text"},{"label":"Período","name":"period","required":true,"type":"text"}]',
   true, '2026-01-17 23:26:31.158827+00', '2026-01-17 23:26:31.158827+00')
ON CONFLICT (id) DO NOTHING;

-- 4. Inserir generated_documents (necessário antes de signature_log)
INSERT INTO generated_documents (id, template_id, document_name, document_type, language, created_at, is_signed, signer_name, signer_email, signature_type, signature_hash, signed_at)
VALUES 
  ('3e09bd4e-2550-4d14-851e-1eb3ebbc833b', '6ecfacbb-2830-4e55-8f2d-c2f34df20fc6', 'CONTRACT_doc_2026-01-19.pdf', 'contract', 'pt', '2026-01-19 01:45:30.232361+00', true, 'Ericson Piccoli', 'elpenergia@gmail.com', 'typed', '6b74e74adee5a5937e2addd6e781a3be42a22b807621a36adef77f118fc4b56b', '2026-01-19 06:56:56.185+00'),
  ('3d51e48d-ee9f-4e58-bfb6-12c49238d43f', '6ecfacbb-2830-4e55-8f2d-c2f34df20fc6', 'NDA_doc_2026-01-19.pdf', 'nda', 'pt', '2026-01-19 06:58:00+00', true, 'Ericson Piccoli', 'elpenergia@gmail.com', 'typed', '9ec05a0f3d724f8304372c140daa2f31f9a6ac1c96e0bbd36c6160cfc70c9add', '2026-01-19 06:58:46.459+00'),
  ('663e4727-90d4-4872-932c-46069132d1ef', '6ecfacbb-2830-4e55-8f2d-c2f34df20fc6', 'NDA_doc_2026-01-19_2.pdf', 'nda', 'pt', '2026-01-19 07:00:00+00', true, 'Ericson Piccoli', 'elpenergia@gmail.com', 'typed', 'bd9535f06df60f58148fdfee3d3644d666b703ad120e03527137ae166df3bf17', '2026-01-19 07:00:41.491549+00'),
  ('e4727a66-5144-45e7-8638-54e7cf39f015', '6ecfacbb-2830-4e55-8f2d-c2f34df20fc6', 'NDA_doc_2026-01-19_3.pdf', 'nda', 'pt', '2026-01-19 07:01:00+00', true, 'Ericson Piccoli', 'elpenergia@gmail.com', 'typed', '744443c589d31276fc032e3ae2c668e7cfa4300d698b42e7ca140ef6647693c0', '2026-01-19 07:01:31.028382+00'),
  ('5325bf14-0736-4578-b213-41920c5813fa', '6ecfacbb-2830-4e55-8f2d-c2f34df20fc6', 'NDA_doc_2026-01-19_4.pdf', 'nda', 'pt', '2026-01-19 11:53:00+00', true, 'Ericson Piccoli', 'elpenergia@gmail.com', 'typed', '07f9791c8181426003e1a3552b60a55db9a7c89780af48f0f14fa6c8e0d5bcee', '2026-01-19 11:53:03.888+00')
ON CONFLICT (id) DO NOTHING;

-- 5. Inserir signature_log (agora que generated_documents existem)
INSERT INTO signature_log (id, document_id, signer_name, signer_email, signature_type, signature_hash, ip_address, user_agent, timestamp, metadata, created_at)
VALUES 
  ('03aa8f11-a6ef-443e-ac34-8bf452248734', '3e09bd4e-2550-4d14-851e-1eb3ebbc833b', 'Ericson Piccoli', 'elpenergia@gmail.com', 'typed', 'eea64e52376efcdf0830467e36aadad3ce21058a3bbc9a8d2fe9315fde0d1476', NULL, 'Mozilla/5.0 (Linux; Android 10; K)', '2026-01-19 06:54:44.999309+00', '{"language":"pt"}', '2026-01-19 06:54:44.999309+00'),
  ('65b55ac5-1822-4f0b-8b17-0592733fd33d', '3d51e48d-ee9f-4e58-bfb6-12c49238d43f', 'Ericson Piccoli', 'elpenergia@gmail.com', 'typed', '9ec05a0f3d724f8304372c140daa2f31f9a6ac1c96e0bbd36c6160cfc70c9add', NULL, NULL, '2026-01-19 06:58:46.459+00', NULL, '2026-01-19 06:58:50.125813+00'),
  ('de9306e6-ff2d-4e87-ab72-7b087dc3d2be', '663e4727-90d4-4872-932c-46069132d1ef', 'Ericson Piccoli', 'elpenergia@gmail.com', 'typed', 'bd9535f06df60f58148fdfee3d3644d666b703ad120e03527137ae166df3bf17', NULL, 'Mozilla/5.0 (Linux; Android 10; K)', '2026-01-19 07:00:41.491549+00', '{"language":"pt"}', '2026-01-19 07:00:41.491549+00'),
  ('9b8ed3e3-2f2f-4538-82ac-27734b21de1d', 'e4727a66-5144-45e7-8638-54e7cf39f015', 'Ericson Piccoli', 'elpenergia@gmail.com', 'typed', '744443c589d31276fc032e3ae2c668e7cfa4300d698b42e7ca140ef6647693c0', NULL, 'Mozilla/5.0 (Linux; Android 10; K)', '2026-01-19 07:01:31.028382+00', '{"language":"pt"}', '2026-01-19 07:01:31.028382+00'),
  ('dccf524b-3cab-4fae-b77d-fcc358ec290d', '5325bf14-0736-4578-b213-41920c5813fa', 'Ericson Piccoli', 'elpenergia@gmail.com', 'typed', '07f9791c8181426003e1a3552b60a55db9a7c89780af48f0f14fa6c8e0d5bcee', NULL, NULL, '2026-01-19 11:53:03.888+00', NULL, '2026-01-19 11:53:27.277072+00')
ON CONFLICT (id) DO NOTHING