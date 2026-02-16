import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || Deno.env.get("URL_SUPABASE") || Deno.env.get("URL_SUPABAS");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  name: string;
  email: string;
  company?: string;
  subject?: string;
  message: string;
  channel?: string;
  fromPdfQrCode?: boolean;
}

interface ResendEmailResponse {
  id?: string;
  error?: { message: string };
}

// ELP Brand Colors - Clean corporate design
const colors = {
  primary: '#1a2744',      // Navy Blue (from logo)
  secondary: '#2a3a5c',    // Lighter Navy
  accent: '#3b5998',       // Accent Blue
  background: '#fafafa',   // Light background
  text: '#333333',
  muted: '#666666',
  light: '#999999',
  white: '#ffffff',
  border: '#e0e0e0',
  success: '#2e7d32',
  warning: '#f57c00',
};

const LOGO_URL = 'https://www.elpgreen.com/logo-elp-email.png';

async function sendEmail(to: string[], cc: string[] | null, subject: string, html: string): Promise<ResendEmailResponse> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "ELP Green Technology <info@elpgreen.com>",
      to,
      cc: cc || undefined,
      subject,
      html,
    }),
  });

  const data = await response.json();
  return data;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, company, subject, message, channel, fromPdfQrCode }: ContactEmailRequest = await req.json();

    console.log("Received contact form submission:", { name, email, subject, channel, fromPdfQrCode });

    // Initialize Supabase client to check for existing partner
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    // Check if this email already exists in contacts or marketplace
    const [contactsRes, marketplaceRes, docsRes] = await Promise.all([
      supabase.from('contacts').select('id, name, created_at').eq('email', email).order('created_at', { ascending: true }),
      supabase.from('marketplace_registrations').select('id, contact_name, created_at').eq('email', email).order('created_at', { ascending: true }),
      supabase.from('lead_documents').select('id').or(`lead_id.in.(${
        // This will be populated after we know the lead IDs
        'placeholder'
      })`).limit(1),
    ]);

    const existingContacts = contactsRes.data || [];
    const existingMarketplace = marketplaceRes.data || [];
    const isReturningPartner = existingContacts.length > 1 || existingMarketplace.length > 0;
    const totalSubmissions = existingContacts.length + existingMarketplace.length;
    
    // Get document count for this partner
    let documentCount = 0;
    if (isReturningPartner) {
      const leadIds = [
        ...existingContacts.map(c => c.id),
        ...existingMarketplace.map(m => m.id),
      ];
      if (leadIds.length > 0) {
        const { count } = await supabase
          .from('lead_documents')
          .select('*', { count: 'exact', head: true })
          .in('lead_id', leadIds);
        documentCount = count || 0;
      }
    }

    const isOTR = channel === 'otr-source-indication' || channel === 'otr-source-indication-pdf-qr';
    const isFromPdf = fromPdfQrCode || channel === 'otr-source-indication-pdf-qr';
    
    // Priority badge with PDF QR Code tracking
    let priorityBadge = '📬 Novo Contato';
    if (isFromPdf) {
      priorityBadge = '📄 VIA QR CODE PDF - LEAD QUALIFICADO';
    } else if (isOTR) {
      priorityBadge = '🎯 LEAD OTR PRIORITÁRIO';
    } else if (isReturningPartner) {
      priorityBadge = '🔄 PARCEIRO RETORNANDO';
    }
    
    const urgencyColor = isFromPdf ? '#7c3aed' : (isOTR ? '#dc2626' : (isReturningPartner ? colors.success : colors.secondary));

    // Send notification to ELP team
    const notificationEmail = await sendEmail(
      ["elpenergia@gmail.com"],
      ["info@elpgreen.com"],
      `${priorityBadge}: ${subject || 'Formulário de Contato'} - ${name}`,
      `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: ${colors.white};">
          <!-- Priority Banner -->
          ${isFromPdf ? `
          <div style="background: linear-gradient(135deg, #7c3aed, #5b21b6); padding: 12px 20px; text-align: center;">
            <span style="color: white; font-weight: 700; font-size: 14px; letter-spacing: 1px;">📄 VIA QR CODE DO PDF DE VIABILIDADE - LEAD QUALIFICADO</span>
          </div>
          ` : isReturningPartner ? `
          <div style="background: linear-gradient(135deg, ${colors.success}, #059669); padding: 12px 20px; text-align: center;">
            <span style="color: white; font-weight: 700; font-size: 14px; letter-spacing: 1px;">🔄 PARCEIRO EXISTENTE - ${totalSubmissions} ENVIOS | ${documentCount} DOCUMENTOS</span>
          </div>
          ` : isOTR ? `
          <div style="background: linear-gradient(135deg, ${urgencyColor}, #991b1b); padding: 12px 20px; text-align: center;">
            <span style="color: white; font-weight: 700; font-size: 14px; letter-spacing: 1px;">⚡ AÇÃO IMEDIATA REQUERIDA - LEAD OTR ⚡</span>
          </div>
          ` : ''}
          
          <!-- Header with Logo -->
          <div style="background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary}); padding: 30px; ${!isReturningPartner && !isOTR && !isFromPdf ? 'border-radius: 12px 12px 0 0;' : ''} text-align: center;">
            <img src="https://www.elpgreen.com/logo-elp-email.png" alt="ELP Green Technology" style="height: 50px; margin-bottom: 15px;" />
            <h1 style="color: ${colors.white}; margin: 0; font-size: 24px; font-weight: 600;">${priorityBadge}</h1>
            <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0 0; font-size: 14px;">${isFromPdf ? 'Parceiro escaneou QR Code do PDF de Viabilidade' : 'Via formulário do site elpgreen.com'}</p>
          </div>
          
          <!-- Workflow Status -->
          <div style="background: ${colors.background}; padding: 15px 30px; border-bottom: 1px solid ${colors.border};">
            <div style="display: flex; align-items: center; justify-content: center; gap: 20px;">
              <div style="text-align: center;">
                <div style="width: 36px; height: 36px; background: ${colors.secondary}; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: white; font-weight: bold;">1</div>
                <p style="margin: 5px 0 0; font-size: 11px; color: ${colors.text};">Recebido</p>
              </div>
              <div style="height: 2px; width: 40px; background: ${colors.border};"></div>
              <div style="text-align: center;">
                <div style="width: 36px; height: 36px; background: ${colors.border}; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: ${colors.muted}; font-weight: bold;">2</div>
                <p style="margin: 5px 0 0; font-size: 11px; color: ${colors.muted};">Em Análise</p>
              </div>
              <div style="height: 2px; width: 40px; background: ${colors.border};"></div>
              <div style="text-align: center;">
                <div style="width: 36px; height: 36px; background: ${colors.border}; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: ${colors.muted}; font-weight: bold;">3</div>
                <p style="margin: 5px 0 0; font-size: 11px; color: ${colors.muted};">Respondido</p>
              </div>
            </div>
          </div>
          
          <!-- Content -->
          <div style="background: ${colors.background}; padding: 30px; border: 1px solid ${colors.border}; border-top: none;">
            <!-- Contact Info Card -->
            <div style="background: ${colors.white}; border-radius: 10px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); margin-bottom: 20px;">
              <h2 style="color: ${colors.primary}; margin: 0 0 20px 0; font-size: 18px; border-bottom: 2px solid ${colors.accent}; padding-bottom: 10px;">📋 Dados do Contato</h2>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid ${colors.border}; width: 35%;"><strong style="color: ${colors.muted};">Nome:</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid ${colors.border}; color: ${colors.text}; font-weight: 500;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid ${colors.border};"><strong style="color: ${colors.muted};">E-mail:</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid ${colors.border};"><a href="mailto:${email}" style="color: ${colors.secondary}; text-decoration: none;">${email}</a></td>
                </tr>
                ${company ? `
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid ${colors.border};"><strong style="color: ${colors.muted};">Empresa:</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid ${colors.border}; color: ${colors.text};">${company}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid ${colors.border};"><strong style="color: ${colors.muted};">Assunto:</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid ${colors.border}; color: ${colors.text};">${subject || 'Não especificado'}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid ${colors.border};"><strong style="color: ${colors.muted};">Canal:</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid ${colors.border};"><span style="background: ${isOTR ? urgencyColor : colors.accent}; color: ${colors.white}; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500;">${isOTR ? '🎯 OTR Source' : (channel || 'Geral')}</span></td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;"><strong style="color: ${colors.muted};">Status:</strong></td>
                  <td style="padding: 12px 0;"><span style="background: ${isReturningPartner ? colors.success : colors.accent}; color: ${colors.white}; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500;">${isReturningPartner ? `🔄 Parceiro Existente (${totalSubmissions} envios)` : '🆕 Novo Lead'}</span></td>
                </tr>
              </table>
            </div>
            
            <!-- Message Card -->
            <div style="background: ${colors.white}; border-radius: 10px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
              <h3 style="color: ${colors.primary}; margin: 0 0 15px 0; font-size: 16px;">💬 Mensagem:</h3>
              <div style="background: ${colors.background}; padding: 20px; border-radius: 8px; border-left: 4px solid ${isOTR ? urgencyColor : colors.accent};">
                <p style="margin: 0; line-height: 1.7; color: ${colors.text}; white-space: pre-wrap;">${message}</p>
              </div>
            </div>
            
            <!-- Action Buttons -->
            <div style="text-align: center; margin-top: 25px;">
              <a href="mailto:${email}?subject=Re: ${subject || 'Seu contato'} - ELP Green Technology" style="background: ${colors.secondary}; color: ${colors.white}; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 4px 12px rgba(37,99,235,0.3); margin-right: 10px;">
                ✉️ Responder Email
              </a>
              <a href="https://www.elpgreen.com/admin" style="background: ${colors.white}; color: ${colors.secondary}; padding: 14px 25px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; border: 2px solid ${colors.secondary};">
                📂 Ver Pasta do Parceiro
              </a>
            </div>
            
            <!-- SLA Reminder -->
            <div style="margin-top: 20px; padding: 15px; background: ${isOTR ? '#fef2f2' : '#f0f9ff'}; border-radius: 8px; border-left: 4px solid ${isOTR ? urgencyColor : colors.accent};">
              <p style="margin: 0; color: ${isOTR ? '#991b1b' : colors.primary}; font-size: 13px;">
                <strong>${isOTR ? '⚡ Prazo OTR: Responder em até 24 horas!' : '⏰ SLA: Responder em até 7 dias úteis'}</strong>
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: ${colors.primary}; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
            <p style="color: rgba(255,255,255,0.7); font-size: 12px; margin: 0;">
              ELP Alliance S/A - ELP Green Technology<br>
              Sedes: Itália 🇮🇹 | Brasil 🇧🇷 | Alemanha 🇩🇪 | China 🇨🇳 | Austrália 🇦🇺
            </p>
          </div>
        </div>
      `
    );

    console.log("Notification email sent:", notificationEmail);

    // Different auto-response based on returning partner status
    const welcomeBack = isReturningPartner ? `
      <div style="background: linear-gradient(135deg, ${colors.success}15, ${colors.success}05); border: 1px solid ${colors.success}30; padding: 20px; border-radius: 10px; margin: 25px 0;">
        <div style="display: flex; align-items: center;">
          <span style="font-size: 32px; margin-right: 15px;">🔄</span>
          <div>
            <p style="margin: 0; color: ${colors.primary}; font-weight: 600; font-size: 16px;">Bem-vindo de volta!</p>
            <p style="margin: 5px 0 0 0; color: ${colors.muted};">Identificamos que você já nos contatou anteriormente. Sua nova mensagem foi adicionada à sua pasta de documentos existente.</p>
          </div>
        </div>
      </div>
      <div style="background: ${colors.white}; border-radius: 10px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); margin: 20px 0;">
        <h3 style="color: ${colors.primary}; margin: 0 0 15px 0; font-size: 15px;">📊 Seu Histórico Conosco</h3>
        <div style="display: flex; gap: 20px;">
          <div style="text-align: center; padding: 15px; background: ${colors.background}; border-radius: 8px; flex: 1;">
            <p style="font-size: 28px; font-weight: bold; color: ${colors.secondary}; margin: 0;">${totalSubmissions}</p>
            <p style="font-size: 12px; color: ${colors.muted}; margin: 5px 0 0 0;">Contatos</p>
          </div>
          <div style="text-align: center; padding: 15px; background: ${colors.background}; border-radius: 8px; flex: 1;">
            <p style="font-size: 28px; font-weight: bold; color: ${colors.success}; margin: 0;">${documentCount}</p>
            <p style="font-size: 12px; color: ${colors.muted}; margin: 5px 0 0 0;">Documentos</p>
          </div>
        </div>
      </div>
    ` : '';

    // Send auto-response to the customer
    const autoResponseEmail = await sendEmail(
      [email],
      null,
      isReturningPartner 
        ? "🔄 Nova mensagem recebida - Bem-vindo de volta! - ELP Green"
        : "✅ Recebemos sua mensagem - ELP Green Technology",
      `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: ${colors.white};">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary}); padding: 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <img src="https://www.elpgreen.com/logo-elp-email.png" alt="ELP Green Technology" style="height: 50px; margin-bottom: 20px;" />
            <h1 style="color: ${colors.white}; margin: 0; font-size: 26px; font-weight: 600;">${isReturningPartner ? 'Bem-vindo de Volta!' : 'Obrigado pelo Contato!'}</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 12px 0 0 0; font-size: 15px;">${isReturningPartner ? 'Sua mensagem foi adicionada ao seu histórico' : 'Recebemos sua mensagem com sucesso'}</p>
          </div>
          
          <!-- Content -->
          <div style="background: ${colors.background}; padding: 35px 30px; border: 1px solid ${colors.border}; border-top: none;">
            <h2 style="color: ${colors.primary}; margin: 0 0 20px 0; font-size: 20px;">Olá, ${name}! 👋</h2>
            
            ${welcomeBack}
            
            <p style="color: ${colors.text}; line-height: 1.8; margin-bottom: 25px;">
              ${isReturningPartner 
                ? 'Agradecemos por entrar em contato novamente. Nossa equipe já foi notificada e analisará sua solicitação com prioridade.'
                : 'Agradecemos por entrar em contato com a <strong>ELP Green Technology</strong>. Sua mensagem foi recebida e nossa equipe está analisando sua solicitação.'
              }
            </p>
            
            <!-- Status Card -->
            <div style="background: linear-gradient(135deg, ${colors.secondary}10, ${colors.accent}10); border: 1px solid ${colors.accent}30; padding: 20px; border-radius: 10px; margin: 25px 0;">
              <div style="display: flex; align-items: center;">
                <span style="font-size: 28px; margin-right: 15px;">⏱️</span>
                <div>
                  <p style="margin: 0; color: ${colors.primary}; font-weight: 600;">Prazo de Resposta</p>
                  <p style="margin: 5px 0 0 0; color: ${colors.muted};">Você receberá um retorno em até <strong>${isReturningPartner ? '48 horas' : '7 dias úteis'}</strong></p>
                </div>
              </div>
            </div>
            
            <!-- Message Summary -->
            <div style="background: ${colors.white}; border-radius: 10px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); margin: 25px 0;">
              <h3 style="color: ${colors.primary}; margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Resumo da sua mensagem</h3>
              <p style="margin: 0 0 8px 0; color: ${colors.muted}; font-size: 13px;"><strong>Assunto:</strong> ${subject || 'Contato Geral'}</p>
              <p style="margin: 0; color: ${colors.text}; font-style: italic; background: ${colors.background}; padding: 12px; border-radius: 6px;">"${message.substring(0, 200)}${message.length > 200 ? '...' : ''}"</p>
            </div>
            
            <!-- CTA -->
            <div style="text-align: center; margin: 30px 0;">
              <p style="color: ${colors.muted}; margin-bottom: 15px;">Enquanto isso, conheça mais sobre nossas soluções:</p>
              <a href="https://www.elpgreen.com" style="background: ${colors.secondary}; color: ${colors.white}; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 4px 12px rgba(37,99,235,0.3);">
                🌐 Visite Nosso Site
              </a>
            </div>
            
            <!-- Contact Info -->
            <div style="background: ${colors.white}; border-radius: 10px; padding: 20px; margin-top: 25px; text-align: center;">
              <p style="color: ${colors.primary}; font-weight: 600; margin: 0 0 10px 0;">Precisa falar conosco?</p>
              <p style="color: ${colors.muted}; margin: 5px 0;">📧 info@elpgreen.com</p>
              <p style="color: ${colors.muted}; margin: 5px 0;">🌐 www.elpgreen.com</p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: ${colors.primary}; padding: 25px; border-radius: 0 0 12px 12px; text-align: center;">
            <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 0 0 10px 0; font-weight: 500;">
              ELP Alliance S/A - ELP Green Technology
            </p>
            <p style="color: rgba(255,255,255,0.6); font-size: 12px; margin: 0 0 10px 0;">
              Sedes Globais: Itália 🇮🇹 | Brasil 🇧🇷 | Alemanha 🇩🇪 | China 🇨🇳 | Austrália 🇦🇺
            </p>
            <p style="color: rgba(255,255,255,0.4); font-size: 11px; margin: 0;">
              Este é um email automático. Por favor, não responda diretamente.
            </p>
          </div>
        </div>
      `
    );

    console.log("Auto-response email sent:", autoResponseEmail);

    return new Response(
      JSON.stringify({ 
        success: true, 
        notification: notificationEmail, 
        autoResponse: autoResponseEmail,
        isReturningPartner,
        totalSubmissions,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
