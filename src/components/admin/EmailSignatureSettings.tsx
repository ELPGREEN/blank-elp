import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  User,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Linkedin,
  Save,
  Upload,
  Eye,
  Loader2,
} from 'lucide-react';

interface EmailSignatureSettings {
  id?: string;
  user_id: string;
  sender_name: string;
  sender_position: string;
  sender_phone: string;
  sender_photo_url: string;
  company_name: string;
  company_slogan: string;
  company_website: string;
  company_email: string;
  company_phone: string;
  company_locations: string;
  include_social_links: boolean;
  linkedin_url: string;
}

const defaultSettings: Omit<EmailSignatureSettings, 'user_id'> = {
  sender_name: '',
  sender_position: '',
  sender_phone: '',
  sender_photo_url: '',
  company_name: 'ELP Green Technology',
  company_slogan: 'Transforming Waste into Resources',
  company_website: 'www.elpgreen.com',
  company_email: 'info@elpgreen.com',
  company_phone: '+39 350 102 1359',
  company_locations: 'São Paulo, Brazil | Milan, Italy',
  include_social_links: true,
  linkedin_url: '',
};

export function EmailSignatureSettings() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<Omit<EmailSignatureSettings, 'user_id'>>(defaultSettings);
  const [showPreview, setShowPreview] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Fetch existing settings
  const { data: existingSettings, isLoading } = useQuery({
    queryKey: ['email-signature-settings', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('email_signature_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data as EmailSignatureSettings | null;
    },
    enabled: !!user?.id,
  });

  // Update settings when data is loaded
  useEffect(() => {
    if (existingSettings) {
      setSettings({
        sender_name: existingSettings.sender_name || '',
        sender_position: existingSettings.sender_position || '',
        sender_phone: existingSettings.sender_phone || '',
        sender_photo_url: existingSettings.sender_photo_url || '',
        company_name: existingSettings.company_name || defaultSettings.company_name,
        company_slogan: existingSettings.company_slogan || defaultSettings.company_slogan,
        company_website: existingSettings.company_website || defaultSettings.company_website,
        company_email: existingSettings.company_email || defaultSettings.company_email,
        company_phone: existingSettings.company_phone || defaultSettings.company_phone,
        company_locations: existingSettings.company_locations || defaultSettings.company_locations,
        include_social_links: existingSettings.include_social_links ?? true,
        linkedin_url: existingSettings.linkedin_url || '',
      });
    }
  }, [existingSettings]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const payload = {
        user_id: user.id,
        ...settings,
      };

      if (existingSettings?.id) {
        const { error } = await supabase
          .from('email_signature_settings')
          .update(payload)
          .eq('id', existingSettings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('email_signature_settings')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-signature-settings'] });
      toast({
        title: 'Configurações salvas!',
        description: 'Sua assinatura de email foi atualizada.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as configurações.',
        variant: 'destructive',
      });
    },
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Arquivo muito grande (máx 2MB)', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const fileName = `${user?.id}-${Date.now()}.${file.name.split('.').pop()}`;
      const { data, error } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(data.path);

      setSettings(prev => ({ ...prev, sender_photo_url: urlData.publicUrl }));
      toast({ title: 'Foto enviada com sucesso!' });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ title: 'Erro ao enviar foto', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Configurações de Assinatura de Email
          </CardTitle>
          <CardDescription>
            Personalize sua assinatura que aparecerá nos emails enviados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sender Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <User className="w-4 h-4" />
              Informações do Remetente
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sender_name">Nome Completo</Label>
                <Input
                  id="sender_name"
                  value={settings.sender_name}
                  onChange={(e) => setSettings(prev => ({ ...prev, sender_name: e.target.value }))}
                  placeholder="Seu nome completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sender_position">Cargo / Função</Label>
                <Input
                  id="sender_position"
                  value={settings.sender_position}
                  onChange={(e) => setSettings(prev => ({ ...prev, sender_position: e.target.value }))}
                  placeholder="Ex: Diretor Comercial"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sender_phone">Telefone Direto</Label>
                <Input
                  id="sender_phone"
                  value={settings.sender_phone}
                  onChange={(e) => setSettings(prev => ({ ...prev, sender_phone: e.target.value }))}
                  placeholder="+55 11 99999-9999"
                />
              </div>
              <div className="space-y-2">
                <Label>Foto do Perfil</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={settings.sender_photo_url} />
                    <AvatarFallback>
                      {settings.sender_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <label className="cursor-pointer">
                    <Button variant="outline" size="sm" disabled={uploading} asChild>
                      <span>
                        {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                        Enviar Foto
                      </span>
                    </Button>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Informações da Empresa
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Nome da Empresa</Label>
                <Input
                  id="company_name"
                  value={settings.company_name}
                  onChange={(e) => setSettings(prev => ({ ...prev, company_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_slogan">Slogan</Label>
                <Input
                  id="company_slogan"
                  value={settings.company_slogan}
                  onChange={(e) => setSettings(prev => ({ ...prev, company_slogan: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_website">Website</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="company_website"
                    value={settings.company_website}
                    onChange={(e) => setSettings(prev => ({ ...prev, company_website: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="company_email"
                    value={settings.company_email}
                    onChange={(e) => setSettings(prev => ({ ...prev, company_email: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_phone">Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="company_phone"
                    value={settings.company_phone}
                    onChange={(e) => setSettings(prev => ({ ...prev, company_phone: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_locations">Localizações</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="company_locations"
                    value={settings.company_locations}
                    onChange={(e) => setSettings(prev => ({ ...prev, company_locations: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Social Links */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Linkedin className="w-4 h-4" />
                Redes Sociais
              </h3>
              <div className="flex items-center gap-2">
                <Label htmlFor="include_social">Incluir links</Label>
                <Switch
                  id="include_social"
                  checked={settings.include_social_links}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, include_social_links: checked }))}
                />
              </div>
            </div>
            {settings.include_social_links && (
              <div className="space-y-2">
                <Label htmlFor="linkedin_url">LinkedIn</Label>
                <Input
                  id="linkedin_url"
                  value={settings.linkedin_url}
                  onChange={(e) => setSettings(prev => ({ ...prev, linkedin_url: e.target.value }))}
                  placeholder="https://linkedin.com/in/seu-perfil"
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="w-4 h-4 mr-2" />
              {showPreview ? 'Ocultar' : 'Ver'} Prévia
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Salvar Configurações
            </Button>
          </div>

          {/* Preview */}
          {showPreview && (
            <Card className="bg-muted/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Prévia da Assinatura</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="bg-white dark:bg-background p-4 rounded-lg border"
                  dangerouslySetInnerHTML={{ __html: generateSignatureHTML(settings) }}
                />
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Generate HTML signature for preview and emails
export function generateSignatureHTML(settings: Omit<EmailSignatureSettings, 'user_id'>): string {
  return `
    <table cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, sans-serif; font-size: 14px; color: #333333; max-width: 500px;">
      <tr>
        <td style="padding-right: 16px; vertical-align: top;">
          ${settings.sender_photo_url ? `
            <img src="${settings.sender_photo_url}" alt="${settings.sender_name}" 
              style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 2px solid #1a2744;" />
          ` : `
            <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #1a2744, #2a4464); 
              display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold;">
              ${settings.sender_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'ELP'}
            </div>
          `}
        </td>
        <td style="vertical-align: top; border-left: 3px solid #1a2744; padding-left: 16px;">
          ${settings.sender_name ? `
            <p style="margin: 0 0 4px; font-size: 16px; font-weight: 700; color: #1a2744;">${settings.sender_name}</p>
          ` : ''}
          ${settings.sender_position ? `
            <p style="margin: 0 0 8px; font-size: 13px; color: #666666;">${settings.sender_position}</p>
          ` : ''}
          <p style="margin: 0 0 4px; font-size: 15px; font-weight: 700; color: #1a2744;">${settings.company_name}</p>
          <p style="margin: 0 0 12px; font-size: 12px; color: #888888; font-style: italic;">${settings.company_slogan}</p>
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding-right: 8px;">
                <a href="https://${settings.company_website.replace(/^https?:\/\//, '')}" 
                  style="color: #1a2744; font-size: 12px; text-decoration: none;">🌐 ${settings.company_website}</a>
              </td>
            </tr>
            <tr>
              <td style="padding-top: 4px;">
                <a href="mailto:${settings.company_email}" 
                  style="color: #1a2744; font-size: 12px; text-decoration: none;">✉️ ${settings.company_email}</a>
              </td>
            </tr>
            ${settings.sender_phone ? `
              <tr>
                <td style="padding-top: 4px;">
                  <a href="tel:${settings.sender_phone.replace(/\s/g, '')}" 
                    style="color: #1a2744; font-size: 12px; text-decoration: none;">📱 ${settings.sender_phone}</a>
                </td>
              </tr>
            ` : `
              <tr>
                <td style="padding-top: 4px;">
                  <a href="tel:${settings.company_phone.replace(/\s/g, '')}" 
                    style="color: #1a2744; font-size: 12px; text-decoration: none;">📞 ${settings.company_phone}</a>
                </td>
              </tr>
            `}
            <tr>
              <td style="padding-top: 4px;">
                <span style="color: #888888; font-size: 11px;">📍 ${settings.company_locations}</span>
              </td>
            </tr>
            ${settings.include_social_links && settings.linkedin_url ? `
              <tr>
                <td style="padding-top: 8px;">
                  <a href="${settings.linkedin_url}" 
                    style="color: #0077B5; font-size: 12px; text-decoration: none;">🔗 LinkedIn</a>
                </td>
              </tr>
            ` : ''}
          </table>
        </td>
      </tr>
      <tr>
        <td colspan="2" style="padding-top: 16px;">
          <p style="margin: 0; font-size: 10px; color: #999999; border-top: 1px solid #e0e0e0; padding-top: 12px;">
            © ${new Date().getFullYear()} ${settings.company_name}. All rights reserved.
          </p>
        </td>
      </tr>
    </table>
  `;
}

// Export for use in email sending
export { generateSignatureHTML as getEmailSignatureHTML };
