import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || Deno.env.get("URL_SUPABASE") || Deno.env.get("URL_SUPABAS");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Participant {
  name: string;
  email: string;
  role?: string;
  company?: string;
}

interface ConvocationRequest {
  meetingId: string;
  meetingTitle: string;
  scheduledAt: string;
  durationMinutes: number;
  location?: string;
  meetingLink?: string;
  participants: Participant[];
  convocationContent: string;
  language?: string;
}

interface SignatureSettings {
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
}

const defaultSignature: SignatureSettings = {
  sender_name: '',
  sender_position: '',
  sender_phone: '',
  sender_photo_url: '',
  company_name: 'ELP Alliance S/A',
  company_slogan: 'Transformando resíduos em recursos',
  company_website: 'www.elpgreen.com',
  company_email: 'info@elpgreen.com',
  company_phone: '+39 350 102 1359',
  company_locations: 'São Paulo, Brasil | Milão, Itália',
};

const colors = {
  primary: '#1a2744',
  secondary: '#2a3a5c',
  text: '#333333',
  muted: '#666666',
  light: '#999999',
  white: '#ffffff',
  background: '#f5f5f5',
  border: '#e0e0e0',
  success: '#2e7d32',
  accent: '#1a5c3a',
};

const translations = {
  pt: {
    subject: (title: string) => `📅 Convocatória: ${title}`,
    greeting: (name: string) => `Prezado(a) ${name},`,
    intro: "Você está sendo convocado(a) para a reunião abaixo:",
    meetingLabel: "Reunião",
    dateLabel: "Data e Hora",
    durationLabel: "Duração",
    locationLabel: "Local / Link",
    agendaLabel: "Pauta",
    confirmText: "Por favor, confirme sua presença respondendo a este e-mail.",
    addToCalendar: "Adicionar ao Calendário",
    footer: "ELP Green Technology - Transformando resíduos em recursos",
  },
  en: {
    subject: (title: string) => `📅 Meeting Invitation: ${title}`,
    greeting: (name: string) => `Dear ${name},`,
    intro: "You are invited to the following meeting:",
    meetingLabel: "Meeting",
    dateLabel: "Date & Time",
    durationLabel: "Duration",
    locationLabel: "Location / Link",
    agendaLabel: "Agenda",
    confirmText: "Please confirm your attendance by replying to this email.",
    addToCalendar: "Add to Calendar",
    footer: "ELP Green Technology - Transforming waste into resources",
  },
  es: {
    subject: (title: string) => `📅 Convocatoria: ${title}`,
    greeting: (name: string) => `Estimado(a) ${name},`,
    intro: "Está siendo convocado(a) a la siguiente reunión:",
    meetingLabel: "Reunión",
    dateLabel: "Fecha y Hora",
    durationLabel: "Duración",
    locationLabel: "Ubicación / Enlace",
    agendaLabel: "Agenda",
    confirmText: "Por favor, confirme su asistencia respondiendo a este correo.",
    addToCalendar: "Agregar al Calendario",
    footer: "ELP Green Technology - Transformando residuos en recursos",
  },
  it: {
    subject: (title: string) => `📅 Convocazione: ${title}`,
    greeting: (name: string) => `Gentile ${name},`,
    intro: "È convocato/a alla seguente riunione:",
    meetingLabel: "Riunione",
    dateLabel: "Data e Ora",
    durationLabel: "Durata",
    locationLabel: "Luogo / Link",
    agendaLabel: "Ordine del Giorno",
    confirmText: "La preghiamo di confermare la sua presenza rispondendo a questa email.",
    addToCalendar: "Aggiungi al Calendario",
    footer: "ELP Green Technology - Trasformare i rifiuti in risorse",
  },
  zh: {
    subject: (title: string) => `📅 会议通知: ${title}`,
    greeting: (name: string) => `尊敬的 ${name}，`,
    intro: "诚邀您参加以下会议：",
    meetingLabel: "会议",
    dateLabel: "日期和时间",
    durationLabel: "时长",
    locationLabel: "地点 / 链接",
    agendaLabel: "议程",
    confirmText: "请回复此邮件确认您的出席。",
    addToCalendar: "添加到日历",
    footer: "ELP绿色技术 - 将废物转化为资源",
  },
};

function formatDate(dateStr: string, lang: string): string {
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  };
  
  const localeMap: Record<string, string> = {
    pt: 'pt-BR',
    en: 'en-US',
    es: 'es-ES',
    it: 'it-IT',
    zh: 'zh-CN',
  };
  
  return date.toLocaleDateString(localeMap[lang] || 'pt-BR', options);
}

function generateSignatureHTML(settings: SignatureSettings): string {
  const initials = settings.sender_name 
    ? settings.sender_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'ELP';

  return `
    <table cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, sans-serif; font-size: 14px; color: #333333; max-width: 500px; margin-top: 30px;">
      <tr>
        <td style="padding-right: 16px; vertical-align: top;">
          ${settings.sender_photo_url ? `
            <img src="${settings.sender_photo_url}" alt="${settings.sender_name}" 
              style="width: 70px; height: 70px; border-radius: 50%; object-fit: cover; border: 2px solid ${colors.primary};" />
          ` : settings.sender_name ? `
            <div style="width: 70px; height: 70px; border-radius: 50%; background: linear-gradient(135deg, ${colors.primary}, #2a4464); 
              color: white; font-size: 22px; font-weight: bold; text-align: center; line-height: 70px;">
              ${initials}
            </div>
          ` : ''}
        </td>
        <td style="vertical-align: top; border-left: 3px solid ${colors.primary}; padding-left: 16px;">
          ${settings.sender_name ? `
            <p style="margin: 0 0 2px; font-size: 16px; font-weight: 700; color: ${colors.primary};">${settings.sender_name}</p>
          ` : ''}
          ${settings.sender_position ? `
            <p style="margin: 0 0 8px; font-size: 12px; color: ${colors.muted};">${settings.sender_position}</p>
          ` : ''}
          <p style="margin: 0 0 2px; font-size: 14px; font-weight: 600; color: ${colors.primary};">${settings.company_name}</p>
          <p style="margin: 0 0 10px; font-size: 11px; color: ${colors.light}; font-style: italic;">${settings.company_slogan}</p>
          <table cellpadding="0" cellspacing="0" border="0" style="font-size: 12px;">
            <tr>
              <td style="padding-bottom: 3px;">
                <a href="https://${settings.company_website.replace(/^https?:\/\//, '')}" 
                  style="color: ${colors.primary}; text-decoration: none;">🌐 ${settings.company_website}</a>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom: 3px;">
                <a href="mailto:${settings.company_email}" 
                  style="color: ${colors.primary}; text-decoration: none;">✉️ ${settings.company_email}</a>
              </td>
            </tr>
            <tr>
              <td style="color: ${colors.light}; font-size: 11px;">📍 ${settings.company_locations}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

function markdownToHtml(markdown: string): string {
  return markdown
    .replace(/^### (.*$)/gim, '<h3 style="color: #1a2744; margin: 16px 0 8px;">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 style="color: #1a2744; margin: 20px 0 10px;">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 style="color: #1a2744; margin: 24px 0 12px;">$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/^- (.*$)/gim, '<li style="margin: 4px 0;">$1</li>')
    .replace(/^(\d+)\. (.*$)/gim, '<li style="margin: 4px 0;">$2</li>')
    .replace(/\n/g, '<br>');
}

function buildConvocationEmail(
  data: ConvocationRequest,
  t: typeof translations.pt,
  signature: SignatureSettings,
  lang: string
): string {
  const formattedDate = formatDate(data.scheduledAt, lang);
  const locationOrLink = data.meetingLink 
    ? `<a href="${data.meetingLink}" style="color: ${colors.accent};">${data.meetingLink}</a>`
    : (data.location || 'A definir');
  
  const convocationHtml = markdownToHtml(data.convocationContent);

  return `
<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.subject(data.meetingTitle)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${colors.background}; font-family: 'Segoe UI', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${colors.background}; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table width="650" cellpadding="0" cellspacing="0" style="background-color: ${colors.white}; max-width: 650px; width: 100%; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${colors.accent} 0%, #228b22 100%); padding: 35px 40px; text-align: center;">
              <img src="https://www.elpgreen.com/logo-elp-email.png" alt="ELP Green Technology" style="height: 50px; margin-bottom: 15px;" />
              <h1 style="color: ${colors.white}; margin: 0; font-size: 22px; font-weight: 700;">📅 CONVOCATÓRIA DE REUNIÃO</h1>
            </td>
          </tr>
          
          <!-- Meeting Info Card -->
          <tr>
            <td style="padding: 35px 40px 20px;">
              
              <!-- Meeting Details Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 10px; overflow: hidden; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 25px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-bottom: 15px; border-bottom: 1px solid ${colors.border};">
                          <span style="color: ${colors.light}; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">${t.meetingLabel}</span>
                          <p style="color: ${colors.primary}; font-size: 20px; font-weight: 700; margin: 6px 0 0;">${data.meetingTitle}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 15px 0;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td width="50%" style="vertical-align: top;">
                                <span style="color: ${colors.light}; font-size: 11px; text-transform: uppercase;">📅 ${t.dateLabel}</span>
                                <p style="color: ${colors.text}; font-size: 14px; font-weight: 600; margin: 4px 0 0;">${formattedDate}</p>
                              </td>
                              <td width="50%" style="vertical-align: top;">
                                <span style="color: ${colors.light}; font-size: 11px; text-transform: uppercase;">⏱️ ${t.durationLabel}</span>
                                <p style="color: ${colors.text}; font-size: 14px; font-weight: 600; margin: 4px 0 0;">${data.durationMinutes} min</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 15px; border-top: 1px solid ${colors.border};">
                          <span style="color: ${colors.light}; font-size: 11px; text-transform: uppercase;">📍 ${t.locationLabel}</span>
                          <p style="color: ${colors.text}; font-size: 14px; font-weight: 600; margin: 4px 0 0;">${locationOrLink}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Convocation Content -->
              <div style="background-color: ${colors.white}; border: 1px solid ${colors.border}; border-radius: 10px; padding: 25px; margin-bottom: 25px;">
                <div style="color: ${colors.text}; font-size: 14px; line-height: 1.7;">
                  ${convocationHtml}
                </div>
              </div>
              
              <!-- Confirm Attendance -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-bottom: 25px;">
                <p style="color: #92400e; font-size: 14px; font-weight: 600; margin: 0;">
                  ✋ ${t.confirmText}
                </p>
              </div>
              
              <!-- Join Button (if link exists) -->
              ${data.meetingLink ? `
              <div style="text-align: center; margin: 25px 0;">
                <a href="${data.meetingLink}" 
                   style="display: inline-block; background: linear-gradient(135deg, ${colors.accent} 0%, #228b22 100%); color: ${colors.white}; text-decoration: none; padding: 14px 35px; border-radius: 8px; font-weight: 700; font-size: 15px; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(26, 92, 58, 0.3);">
                  🎥 Acessar Reunião Online
                </a>
              </div>
              ` : ''}
              
              <!-- Signature -->
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid ${colors.border};">
                <p style="margin: 0 0 5px; color: ${colors.text}; font-size: 14px;"><strong>Atenciosamente,</strong></p>
                ${generateSignatureHTML(signature)}
              </div>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 25px 40px; background-color: #fafafa; border-top: 1px solid ${colors.border};">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 8px; color: ${colors.primary}; font-size: 13px; font-weight: 600;">
                      ELP Green Technology
                    </p>
                    <p style="margin: 0 0 12px; color: ${colors.muted}; font-size: 11px;">
                      ${t.footer}
                    </p>
                    <p style="margin: 0; color: ${colors.light}; font-size: 10px;">
                      © ${new Date().getFullYear()} ELP Alliance S/A | São Paulo, Brasil | Milão, Itália
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: ConvocationRequest = await req.json();
    const lang = (data.language || 'pt') as keyof typeof translations;
    const t = translations[lang] || translations.pt;

    // Validate required fields
    if (!data.participants || !Array.isArray(data.participants) || data.participants.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No participants provided' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Sending convocation for meeting:", data.meetingTitle);
    console.log("Recipients:", data.participants.map((p: Participant) => p.email).join(', '));

    // Fetch signature settings
    let signatureSettings: SignatureSettings = { ...defaultSignature };
    
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { data: sigData } = await supabase
          .from('email_signature_settings')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();
        
        if (sigData) {
          signatureSettings = {
            sender_name: sigData.sender_name || defaultSignature.sender_name,
            sender_position: sigData.sender_position || defaultSignature.sender_position,
            sender_phone: sigData.sender_phone || defaultSignature.sender_phone,
            sender_photo_url: sigData.sender_photo_url || defaultSignature.sender_photo_url,
            company_name: sigData.company_name || defaultSignature.company_name,
            company_slogan: sigData.company_slogan || defaultSignature.company_slogan,
            company_website: sigData.company_website || defaultSignature.company_website,
            company_email: sigData.company_email || defaultSignature.company_email,
            company_phone: sigData.company_phone || defaultSignature.company_phone,
            company_locations: sigData.company_locations || defaultSignature.company_locations,
          };
          console.log("Loaded signature settings:", signatureSettings.sender_name);
        }
      } catch (e) {
        console.log("Could not fetch signature settings, using defaults:", e);
      }
    }

    const successfulSends: string[] = [];
    const failedSends: { email: string; error: string }[] = [];

    // Send email to each participant
    for (const participant of data.participants) {
      if (!participant.email) continue;

      try {
        const emailHtml = buildConvocationEmail(data, t, signatureSettings, lang);

        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "ELP Green Technology <info@elpgreen.com>",
            to: [participant.email],
            subject: t.subject(data.meetingTitle),
            html: emailHtml,
          }),
        });

        const responseData = await response.json();

        if (response.ok) {
          console.log(`Email sent to ${participant.email}:`, responseData);
          successfulSends.push(participant.email);
        } else {
          console.error(`Failed to send to ${participant.email}:`, responseData);
          failedSends.push({ email: participant.email, error: responseData.message || 'Unknown error' });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error sending to ${participant.email}:`, errorMessage);
        failedSends.push({ email: participant.email, error: errorMessage });
      }
    }

    // Update meeting record with convocation_sent_at
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && data.meetingId) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        await supabase
          .from('meetings')
          .update({ convocation_sent_at: new Date().toISOString() })
          .eq('id', data.meetingId);
        console.log("Updated meeting convocation_sent_at");
      } catch (e) {
        console.error("Error updating meeting:", e);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: successfulSends.length,
        failed: failedSends.length,
        successfulSends,
        failedSends,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error in send-meeting-convocation:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
