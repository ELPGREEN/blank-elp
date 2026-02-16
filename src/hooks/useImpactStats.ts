import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ImpactStat {
  id: string;
  key: string;
  value: number;
  suffix: string;
  label_pt: string;
  label_en: string;
  label_es: string;
  label_zh: string;
  label_it: string;
  display_order: number;
  is_active: boolean;
}

export function useImpactStats() {
  return useQuery({
    queryKey: ['impact-stats'],
    queryFn: async (): Promise<ImpactStat[]> => {
      const { data, error } = await supabase
        .from('impact_stats')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      return data || [];
    },
  });
}

export function getLocalizedLabel(stat: ImpactStat, language: string): string {
  switch (language) {
    case 'en':
      return stat.label_en;
    case 'es':
      return stat.label_es;
    case 'zh':
      return stat.label_zh;
    case 'it':
      return stat.label_it;
    default:
      return stat.label_pt;
  }
}
