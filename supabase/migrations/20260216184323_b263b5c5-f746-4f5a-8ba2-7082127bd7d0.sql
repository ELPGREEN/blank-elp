
-- ============================================================
-- FASE 2: Corrigir RLS - Restringir políticas admin/editor para TO authenticated
-- ============================================================

-- 1. admin_emails - todas as políticas devem ser TO authenticated
DROP POLICY IF EXISTS "Admins can delete emails" ON public.admin_emails;
DROP POLICY IF EXISTS "Admins can insert emails" ON public.admin_emails;
DROP POLICY IF EXISTS "Admins can update emails" ON public.admin_emails;
DROP POLICY IF EXISTS "Admins can view emails" ON public.admin_emails;

CREATE POLICY "Admins can delete emails" ON public.admin_emails FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = ANY(ARRAY['admin'::app_role, 'editor'::app_role])));
CREATE POLICY "Admins can insert emails" ON public.admin_emails FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = ANY(ARRAY['admin'::app_role, 'editor'::app_role])));
CREATE POLICY "Admins can update emails" ON public.admin_emails FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = ANY(ARRAY['admin'::app_role, 'editor'::app_role])));
CREATE POLICY "Admins can view emails" ON public.admin_emails FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = ANY(ARRAY['admin'::app_role, 'editor'::app_role])));

-- 2. aml_screened_lists
DROP POLICY IF EXISTS "Editors can manage screened lists" ON public.aml_screened_lists;
DROP POLICY IF EXISTS "Editors can view screened lists" ON public.aml_screened_lists;

CREATE POLICY "Editors can manage screened lists" ON public.aml_screened_lists FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = ANY(ARRAY['admin'::app_role, 'editor'::app_role])));
CREATE POLICY "Editors can view screened lists" ON public.aml_screened_lists FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = ANY(ARRAY['admin'::app_role, 'editor'::app_role])));

-- 3. aml_screening_history - fix "always true" INSERT + restrict SELECT
DROP POLICY IF EXISTS "Admins can view all history" ON public.aml_screening_history;
DROP POLICY IF EXISTS "System can insert history" ON public.aml_screening_history;

CREATE POLICY "Admins can view all history" ON public.aml_screening_history FOR SELECT TO authenticated
  USING (is_admin(auth.uid()));
CREATE POLICY "System can insert history" ON public.aml_screening_history FOR INSERT TO service_role
  WITH CHECK (true);

-- 4. aml_screening_matches
DROP POLICY IF EXISTS "Admins can manage all matches" ON public.aml_screening_matches;
DROP POLICY IF EXISTS "Editors can insert matches" ON public.aml_screening_matches;
DROP POLICY IF EXISTS "Editors can view matches" ON public.aml_screening_matches;

CREATE POLICY "Admins can manage all matches" ON public.aml_screening_matches FOR ALL TO authenticated
  USING (is_admin(auth.uid()));
CREATE POLICY "Editors can insert matches" ON public.aml_screening_matches FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = ANY(ARRAY['admin'::app_role, 'editor'::app_role])));
CREATE POLICY "Editors can view matches" ON public.aml_screening_matches FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = ANY(ARRAY['admin'::app_role, 'editor'::app_role])));

-- 5. aml_screening_reports - keep public token policy, restrict admin
DROP POLICY IF EXISTS "Admins can manage all screening reports" ON public.aml_screening_reports;
DROP POLICY IF EXISTS "Editors can insert reports" ON public.aml_screening_reports;
DROP POLICY IF EXISTS "Editors can view and create reports" ON public.aml_screening_reports;

CREATE POLICY "Admins can manage all screening reports" ON public.aml_screening_reports FOR ALL TO authenticated
  USING (is_admin(auth.uid()));
CREATE POLICY "Editors can insert reports" ON public.aml_screening_reports FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = ANY(ARRAY['admin'::app_role, 'editor'::app_role])));
CREATE POLICY "Editors can view and create reports" ON public.aml_screening_reports FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = ANY(ARRAY['admin'::app_role, 'editor'::app_role])));

-- 6. analises
DROP POLICY IF EXISTS "Admins can manage all analyses" ON public.analises;
DROP POLICY IF EXISTS "Users can create their own analyses" ON public.analises;
DROP POLICY IF EXISTS "Users can delete their own analyses" ON public.analises;
DROP POLICY IF EXISTS "Users can update their own analyses" ON public.analises;
DROP POLICY IF EXISTS "Users can view their own analyses" ON public.analises;

CREATE POLICY "Admins can manage all analyses" ON public.analises FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Users can create their own analyses" ON public.analises FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own analyses" ON public.analises FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own analyses" ON public.analises FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own analyses" ON public.analises FOR SELECT TO authenticated USING ((auth.uid() = user_id) OR is_admin(auth.uid()));

-- 7. articles - keep public SELECT, restrict admin
DROP POLICY IF EXISTS "Admins can manage articles" ON public.articles;
CREATE POLICY "Admins can manage articles" ON public.articles FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- 8. audit_log
DROP POLICY IF EXISTS "Admins can view audit log" ON public.audit_log;
DROP POLICY IF EXISTS "System can insert audit log" ON public.audit_log;

CREATE POLICY "Admins can view audit log" ON public.audit_log FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "System can insert audit log" ON public.audit_log FOR INSERT TO service_role WITH CHECK (true);

-- 9. cgu_sanctions_cache
DROP POLICY IF EXISTS "Editors can view CGU sanctions" ON public.cgu_sanctions_cache;
DROP POLICY IF EXISTS "Service role can manage CGU sanctions" ON public.cgu_sanctions_cache;

CREATE POLICY "Editors can view CGU sanctions" ON public.cgu_sanctions_cache FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = ANY(ARRAY['admin'::app_role, 'editor'::app_role])));
CREATE POLICY "Service role can manage CGU sanctions" ON public.cgu_sanctions_cache FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 10. cnpj_cache
DROP POLICY IF EXISTS "Editors can view CNPJ cache" ON public.cnpj_cache;
DROP POLICY IF EXISTS "Service role can manage CNPJ cache" ON public.cnpj_cache;

CREATE POLICY "Editors can view CNPJ cache" ON public.cnpj_cache FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = ANY(ARRAY['admin'::app_role, 'editor'::app_role])));
CREATE POLICY "Service role can manage CNPJ cache" ON public.cnpj_cache FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 11. company_intelligence
DROP POLICY IF EXISTS "Admins can manage company intelligence" ON public.company_intelligence;
DROP POLICY IF EXISTS "Users can view company intelligence" ON public.company_intelligence;

CREATE POLICY "Admins can manage company intelligence" ON public.company_intelligence FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = ANY(ARRAY['admin'::app_role, 'editor'::app_role])));
CREATE POLICY "Users can view company intelligence" ON public.company_intelligence FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = ANY(ARRAY['admin'::app_role, 'editor'::app_role, 'viewer'::app_role])));

-- 12. contacts - keep public INSERT, restrict admin
DROP POLICY IF EXISTS "Admins can delete contacts" ON public.contacts;
DROP POLICY IF EXISTS "Admins can update contacts" ON public.contacts;
DROP POLICY IF EXISTS "Admins can view contacts" ON public.contacts;

CREATE POLICY "Admins can delete contacts" ON public.contacts FOR DELETE TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins can update contacts" ON public.contacts FOR UPDATE TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins can view contacts" ON public.contacts FOR SELECT TO authenticated USING (is_admin(auth.uid()));

-- 13. cpf_cache
DROP POLICY IF EXISTS "Editors can view CPF cache" ON public.cpf_cache;
DROP POLICY IF EXISTS "Service role can manage CPF cache" ON public.cpf_cache;

CREATE POLICY "Editors can view CPF cache" ON public.cpf_cache FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = ANY(ARRAY['admin'::app_role, 'editor'::app_role])));
CREATE POLICY "Service role can manage CPF cache" ON public.cpf_cache FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 14. document_templates
DROP POLICY IF EXISTS "Admins and editors can insert templates" ON public.document_templates;
DROP POLICY IF EXISTS "Admins and editors can update templates" ON public.document_templates;
DROP POLICY IF EXISTS "Admins and editors can view templates" ON public.document_templates;
DROP POLICY IF EXISTS "Admins can delete doc templates" ON public.document_templates;

CREATE POLICY "Admins and editors can insert templates" ON public.document_templates FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = ANY(ARRAY['admin'::app_role, 'editor'::app_role])));
CREATE POLICY "Admins and editors can update templates" ON public.document_templates FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = ANY(ARRAY['admin'::app_role, 'editor'::app_role])));
CREATE POLICY "Admins and editors can view templates" ON public.document_templates FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = ANY(ARRAY['admin'::app_role, 'editor'::app_role])));
CREATE POLICY "Admins can delete doc templates" ON public.document_templates FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role));

-- 15. email_signature_settings
DROP POLICY IF EXISTS "Admins can manage email signature settings" ON public.email_signature_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON public.email_signature_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON public.email_signature_settings;
DROP POLICY IF EXISTS "Users can view own settings" ON public.email_signature_settings;

CREATE POLICY "Admins can manage email signature settings" ON public.email_signature_settings FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = ANY(ARRAY['admin'::app_role, 'editor'::app_role])));
CREATE POLICY "Users can insert own settings" ON public.email_signature_settings FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own settings" ON public.email_signature_settings FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can view own settings" ON public.email_signature_settings FOR SELECT TO authenticated USING (user_id = auth.uid());

-- 16. email_templates
DROP POLICY IF EXISTS "Admins can delete templates" ON public.email_templates;
DROP POLICY IF EXISTS "Admins can insert templates" ON public.email_templates;
DROP POLICY IF EXISTS "Admins can update templates" ON public.email_templates;
DROP POLICY IF EXISTS "Admins can view templates" ON public.email_templates;

CREATE POLICY "Admins can delete templates" ON public.email_templates FOR DELETE TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins can insert templates" ON public.email_templates FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins can update templates" ON public.email_templates FOR UPDATE TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins can view templates" ON public.email_templates FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = ANY(ARRAY['admin'::app_role, 'editor'::app_role])));

-- 17. feasibility_studies
DROP POLICY IF EXISTS "Admins can create feasibility studies" ON public.feasibility_studies;
DROP POLICY IF EXISTS "Admins can delete feasibility studies" ON public.feasibility_studies;
DROP POLICY IF EXISTS "Admins can update feasibility studies" ON public.feasibility_studies;
DROP POLICY IF EXISTS "Admins can view all feasibility studies" ON public.feasibility_studies;

CREATE POLICY "Admins can create feasibility studies" ON public.feasibility_studies FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = ANY(ARRAY['admin'::app_role, 'editor'::app_role])));
CREATE POLICY "Admins can delete feasibility studies" ON public.feasibility_studies FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role));
CREATE POLICY "Admins can update feasibility studies" ON public.feasibility_studies FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = ANY(ARRAY['admin'::app_role, 'editor'::app_role])));
CREATE POLICY "Admins can view all feasibility studies" ON public.feasibility_studies FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = ANY(ARRAY['admin'::app_role, 'editor'::app_role])));

-- 18. generated_documents - keep public policies for signature, restrict admin
DROP POLICY IF EXISTS "Admins can delete generated documents" ON public.generated_documents;
DROP POLICY IF EXISTS "Admins can insert generated docs" ON public.generated_documents;
DROP POLICY IF EXISTS "Admins can view generated docs" ON public.generated_documents;

CREATE POLICY "Admins can delete generated documents" ON public.generated_documents FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = ANY(ARRAY['admin'::app_role, 'editor'::app_role])));
CREATE POLICY "Admins can insert generated docs" ON public.generated_documents FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = ANY(ARRAY['admin'::app_role, 'editor'::app_role])));
CREATE POLICY "Admins can view generated docs" ON public.generated_documents FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = ANY(ARRAY['admin'::app_role, 'editor'::app_role])));

-- 19. impact_stats - keep public SELECT, restrict admin
DROP POLICY IF EXISTS "Admins can delete impact stats" ON public.impact_stats;
DROP POLICY IF EXISTS "Admins can insert impact stats" ON public.impact_stats;
DROP POLICY IF EXISTS "Admins can update impact stats" ON public.impact_stats;

CREATE POLICY "Admins can delete impact stats" ON public.impact_stats FOR DELETE TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins can insert impact stats" ON public.impact_stats FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins can update impact stats" ON public.impact_stats FOR UPDATE TO authenticated USING (is_admin(auth.uid()));

-- 20. lead_documents - keep public insert for signed docs, restrict admin
DROP POLICY IF EXISTS "Admins can delete lead documents" ON public.lead_documents;
DROP POLICY IF EXISTS "Admins can insert lead documents" ON public.lead_documents;
DROP POLICY IF EXISTS "Admins can update lead documents table" ON public.lead_documents;
DROP POLICY IF EXISTS "Admins can view lead documents" ON public.lead_documents;

CREATE POLICY "Admins can delete lead documents" ON public.lead_documents FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = ANY(ARRAY['admin'::app_role, 'editor'::app_role])));
CREATE POLICY "Admins can insert lead documents" ON public.lead_documents FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = ANY(ARRAY['admin'::app_role, 'editor'::app_role])));
CREATE POLICY "Admins can update lead documents table" ON public.lead_documents FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = ANY(ARRAY['admin'::app_role, 'editor'::app_role])));
CREATE POLICY "Admins can view lead documents" ON public.lead_documents FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = ANY(ARRAY['admin'::app_role, 'editor'::app_role])));

-- 21. lead_notes
DROP POLICY IF EXISTS "Admins can create lead notes" ON public.lead_notes;
DROP POLICY IF EXISTS "Admins can delete lead notes" ON public.lead_notes;
DROP POLICY IF EXISTS "Admins can view all lead notes" ON public.lead_notes;

CREATE POLICY "Admins can create lead notes" ON public.lead_notes FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = ANY(ARRAY['admin'::app_role, 'editor'::app_role])));
CREATE POLICY "Admins can delete lead notes" ON public.lead_notes FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = ANY(ARRAY['admin'::app_role, 'editor'::app_role])));
CREATE POLICY "Admins can view all lead notes" ON public.lead_notes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = ANY(ARRAY['admin'::app_role, 'editor'::app_role])));

-- 22. loi_documents - keep public token SELECT, restrict admin
DROP POLICY IF EXISTS "Admins can update loi documents" ON public.loi_documents;
DROP POLICY IF EXISTS "Admins can view all loi documents" ON public.loi_documents;

CREATE POLICY "Admins can update loi documents" ON public.loi_documents FOR UPDATE TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins can view all loi documents" ON public.loi_documents FOR SELECT TO authenticated USING (is_admin(auth.uid()));

-- 23. marketplace_registrations
DROP POLICY IF EXISTS "Admins can delete registrations" ON public.marketplace_registrations;
DROP POLICY IF EXISTS "Admins can update registrations" ON public.marketplace_registrations;
DROP POLICY IF EXISTS "Admins can view registrations" ON public.marketplace_registrations;

CREATE POLICY "Admins can delete registrations" ON public.marketplace_registrations FOR DELETE TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins can update registrations" ON public.marketplace_registrations FOR UPDATE TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins can view registrations" ON public.marketplace_registrations FOR SELECT TO authenticated USING (is_admin(auth.uid()));

-- 24. meetings
DROP POLICY IF EXISTS "Admins can delete meetings" ON public.meetings;
DROP POLICY IF EXISTS "Admins can update meetings" ON public.meetings;
DROP POLICY IF EXISTS "Admins can view all meetings" ON public.meetings;

CREATE POLICY "Admins can delete meetings" ON public.meetings FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = ANY(ARRAY['admin'::app_role, 'editor'::app_role])));
CREATE POLICY "Admins can update meetings" ON public.meetings FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = ANY(ARRAY['admin'::app_role, 'editor'::app_role])));
CREATE POLICY "Admins can view all meetings" ON public.meetings FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = ANY(ARRAY['admin'::app_role, 'editor'::app_role])));

-- 25. newsletter_subscribers
DROP POLICY IF EXISTS "Admins can delete subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Admins can update subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Admins can view subscribers" ON public.newsletter_subscribers;

CREATE POLICY "Admins can delete subscribers" ON public.newsletter_subscribers FOR DELETE TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins can update subscribers" ON public.newsletter_subscribers FOR UPDATE TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins can view subscribers" ON public.newsletter_subscribers FOR SELECT TO authenticated USING (is_admin(auth.uid()));

-- 26. notification_webhooks
DROP POLICY IF EXISTS "Admins can manage notification webhooks" ON public.notification_webhooks;
CREATE POLICY "Admins can manage notification webhooks" ON public.notification_webhooks FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- 27. otr_conversion_goals
DROP POLICY IF EXISTS "Admins can manage conversion goals" ON public.otr_conversion_goals;
CREATE POLICY "Admins can manage conversion goals" ON public.otr_conversion_goals FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- 28. partner_profiles
DROP POLICY IF EXISTS "Admins can manage partner profiles" ON public.partner_profiles;
DROP POLICY IF EXISTS "Admins can view partner profiles" ON public.partner_profiles;

CREATE POLICY "Admins can manage partner profiles" ON public.partner_profiles FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = ANY(ARRAY['admin'::app_role, 'editor'::app_role])));
CREATE POLICY "Admins can view partner profiles" ON public.partner_profiles FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = ANY(ARRAY['admin'::app_role, 'editor'::app_role])));

-- 29. press_releases - keep public SELECT, restrict admin
DROP POLICY IF EXISTS "Admins can manage press releases" ON public.press_releases;
CREATE POLICY "Admins can manage press releases" ON public.press_releases FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- 30. profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 31. push_notifications
DROP POLICY IF EXISTS "Admins can view notifications" ON public.push_notifications;
CREATE POLICY "Admins can view notifications" ON public.push_notifications FOR SELECT TO authenticated USING (is_admin(auth.uid()));

-- 32. push_subscriptions
DROP POLICY IF EXISTS "Admins can view all push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Service role can manage all subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can delete own subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.push_subscriptions;

CREATE POLICY "Admins can view all push subscriptions" ON public.push_subscriptions FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Service role can manage all subscriptions" ON public.push_subscriptions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Users can delete own subscriptions" ON public.push_subscriptions FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own subscriptions" ON public.push_subscriptions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view own subscriptions" ON public.push_subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 33. report_verifications - keep public SELECT, restrict admin
DROP POLICY IF EXISTS "Admins can delete report verifications" ON public.report_verifications;
DROP POLICY IF EXISTS "Admins can view all report verifications" ON public.report_verifications;

CREATE POLICY "Admins can delete report verifications" ON public.report_verifications FOR DELETE TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins can view all report verifications" ON public.report_verifications FOR SELECT TO authenticated USING (is_admin(auth.uid()));

-- 34. serpapi_cache
DROP POLICY IF EXISTS "Editors can view serpapi cache" ON public.serpapi_cache;
DROP POLICY IF EXISTS "Service role can manage cache" ON public.serpapi_cache;
DROP POLICY IF EXISTS "Service role can manage serpapi cache" ON public.serpapi_cache;

CREATE POLICY "Editors can view serpapi cache" ON public.serpapi_cache FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = ANY(ARRAY['admin'::app_role, 'editor'::app_role])));
CREATE POLICY "Service role can manage serpapi cache" ON public.serpapi_cache FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 35. signature_log
DROP POLICY IF EXISTS "Admins can view signature logs" ON public.signature_log;
CREATE POLICY "Admins can view signature logs" ON public.signature_log FOR SELECT TO authenticated USING (is_admin(auth.uid()));

-- 36. todos
DROP POLICY IF EXISTS "Admins can manage todos" ON public.todos;
CREATE POLICY "Admins can manage todos" ON public.todos FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- 37. user_roles
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;

CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 38. youtube_cache - keep public SELECT, restrict service role
DROP POLICY IF EXISTS "Service role can update YouTube cache" ON public.youtube_cache;
CREATE POLICY "Service role can update YouTube cache" ON public.youtube_cache FOR ALL TO service_role USING (true) WITH CHECK (true);
