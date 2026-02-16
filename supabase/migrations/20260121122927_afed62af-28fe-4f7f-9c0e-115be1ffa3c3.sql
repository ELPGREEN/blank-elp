-- Inserir perfil para o usuário info@elpgreen.com que já existe no auth mas não tem profile
INSERT INTO public.profiles (user_id, email, full_name)
VALUES ('6699c758-cad4-4102-a606-eb68a333bbc6', 'info@elpgreen.com', 'ELP Admin')
ON CONFLICT (user_id) DO NOTHING;