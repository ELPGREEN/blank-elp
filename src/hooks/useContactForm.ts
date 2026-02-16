import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ContactFormData {
  name: string;
  email: string;
  company?: string;
  subject?: string;
  message: string;
  channel?: string;
}

export function useContactForm() {
  return useMutation({
    mutationFn: async (data: ContactFormData) => {
      // Save to database
      const { error: dbError } = await supabase
        .from('contacts')
        .insert([{
          name: data.name,
          email: data.email,
          company: data.company || null,
          subject: data.subject || null,
          message: data.message,
          channel: data.channel || 'general',
        }]);

      if (dbError) throw dbError;

      // Send email notification and auto-response
      const { error: emailError } = await supabase.functions.invoke('send-contact-email', {
        body: {
          name: data.name,
          email: data.email,
          company: data.company,
          subject: data.subject,
          message: data.message,
          channel: data.channel,
        },
      });

      if (emailError) {
        console.error('Email error:', emailError);
        // Don't throw - the contact was saved, email is secondary
      }

      return { success: true };
    },
  });
}
