import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface NewsletterData {
  email: string;
  name?: string;
  language?: string;
  interests?: string[];
}

export function useNewsletter() {
  return useMutation({
    mutationFn: async (data: NewsletterData) => {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert([{
          email: data.email,
          name: data.name || null,
          language: data.language || 'pt',
          interests: data.interests || [],
        }]);

      if (error) {
        // Handle duplicate email
        if (error.code === '23505') {
          throw new Error('Este email já está inscrito na newsletter.');
        }
        throw error;
      }
      return { success: true };
    },
  });
}
