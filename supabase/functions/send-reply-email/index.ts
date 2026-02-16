import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("URL_SUPABASE") || Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailAttachment {
  name: string;
  url: string;
}

interface ReplyEmailRequest {
  to: string;
  toName: string;
  subject: string;
  message?: string;
  cc?: string[];
  bcc?: string[];
  replyType: 'contact' | 'marketplace' | 'document_received' | 'document_signed' | 'custom' | 'form_confirmation';
  documentName?: string;
  documentType?: string;
  formType?: string;
  submissionCount?: number;
  userId?: string; // To fetch signature settings
  attachments?: EmailAttachment[];
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
  include_social_links: boolean;
  linkedin_url: string;
}

// ELP Brand Colors - Clean Corporate Style
const colors = {
  primary: '#1a2744',      // Navy Blue
  secondary: '#2a3a5c',
  text: '#333333',
  muted: '#666666',
  light: '#999999',
  white: '#ffffff',
  background: '#f5f5f5',
  border: '#e0e0e0',
  success: '#2e7d32',
  warning: '#f57c00',
};

// Default signature settings
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
  include_social_links: false,
  linkedin_url: '',
};

// Generate professional signature HTML
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
            ${settings.sender_phone ? `
              <tr>
                <td style="padding-bottom: 3px;">
                  <a href="tel:${settings.sender_phone.replace(/\s/g, '')}" 
                    style="color: ${colors.primary}; text-decoration: none;">📱 ${settings.sender_phone}</a>
                </td>
              </tr>
            ` : `
              <tr>
                <td style="padding-bottom: 3px;">
                  <a href="tel:${settings.company_phone.replace(/\s/g, '')}" 
                    style="color: ${colors.primary}; text-decoration: none;">📞 ${settings.company_phone}</a>
                </td>
              </tr>
            `}
            <tr>
              <td style="color: ${colors.light}; font-size: 11px;">📍 ${settings.company_locations}</td>
            </tr>
            ${settings.include_social_links && settings.linkedin_url ? `
              <tr>
                <td style="padding-top: 6px;">
                  <a href="${settings.linkedin_url}" 
                    style="color: #0077B5; text-decoration: none;">🔗 LinkedIn</a>
                </td>
              </tr>
            ` : ''}
          </table>
        </td>
      </tr>
    </table>
  `;
}

// Build professional corporate email template (clean white design)
function buildProfessionalEmail(options: {
  toName: string;
  content: string;
  signature: SignatureSettings;
  showInfoNotice?: boolean;
}): string {
  const { toName, content, signature, showInfoNotice = true } = options;

  return `
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ELP Green Technology</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${colors.background}; font-family: 'Segoe UI', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${colors.background}; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: ${colors.white}; max-width: 600px; width: 100%; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
          
          <!-- Header with Logo -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; background-color: ${colors.white}; border-bottom: 1px solid ${colors.border};">
              <img src="https://www.elpgreen.com/logo-elp-email.png" alt="ELP Green Technology" style="height: 55px; max-width: 180px;" />
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 35px 40px; background-color: ${colors.white};">
              
              <!-- Greeting -->
              <p style="margin: 0 0 20px; color: ${colors.text}; font-size: 15px;">
                Prezado(a) <strong>${toName}</strong>,
              </p>
              
              <!-- Message Content -->
              <div style="color: ${colors.text}; font-size: 14px; line-height: 1.7;">
                ${content}
              </div>
              
              ${showInfoNotice ? `
              <!-- Notice Box -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 14px 18px; margin: 25px 0; border-radius: 0 6px 6px 0;">
                <p style="margin: 0; color: #92400e; font-size: 13px;">
                  <strong>Precisa de mais informações?</strong><br>
                  Estamos à disposição para esclarecer qualquer dúvida.
                </p>
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
                      Transformando resíduos em recursos sustentáveis
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
    const data: ReplyEmailRequest = await req.json();
    const { to, toName, subject, message, cc, bcc, replyType, documentName, documentType, formType, submissionCount, userId, attachments } = data;

    console.log("Sending reply email to:", to, "CC:", cc, "BCC:", bcc, "Type:", replyType, "Attachments:", attachments?.length || 0);

    // Fetch user's signature settings from database
    let signatureSettings: SignatureSettings = { ...defaultSignature };
    
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        
        // Try to get the most recent signature settings
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
            include_social_links: sigData.include_social_links || false,
            linkedin_url: sigData.linkedin_url || '',
          };
          console.log("Loaded signature settings for:", signatureSettings.sender_name);
        }
      } catch (e) {
        console.log("Could not fetch signature settings, using defaults:", e);
      }
    }

    let emailSubject = subject;
    let emailHtml = '';

    // Build email based on type
    switch (replyType) {
      case 'document_received':
        emailSubject = `📄 Documento recebido - ${documentType || 'Novo documento'} - ELP Green`;
        emailHtml = buildProfessionalEmail({
          toName,
          signature: signatureSettings,
          showInfoNotice: false,
          content: `
            <p style="margin: 0 0 20px;">Recebemos um novo documento em sua pasta de parceiro na ELP Green Technology.</p>
            
            <div style="background-color: #fafafa; border: 1px solid ${colors.border}; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align: top; padding-right: 15px;">
                    <div style="width: 45px; height: 45px; background-color: #e3f2fd; border-radius: 8px; text-align: center; line-height: 45px; font-size: 22px;">📄</div>
                  </td>
                  <td style="vertical-align: middle;">
                    <p style="margin: 0; font-weight: 600; color: ${colors.primary}; font-size: 15px;">${documentName || 'Documento'}</p>
                    <p style="margin: 4px 0 0; font-size: 13px; color: ${colors.muted};">Tipo: ${documentType || 'Geral'}</p>
                  </td>
                </tr>
              </table>
            </div>
            
            <div style="background-color: #e8f5e9; border-left: 4px solid ${colors.success}; padding: 14px 18px; border-radius: 0 6px 6px 0;">
              <p style="margin: 0; color: #1b5e20; font-size: 13px;">
                <strong>✓ Documento adicionado à sua pasta</strong><br>
                Nossa equipe analisará o documento e entrará em contato se necessário.
              </p>
            </div>
          `,
        });
        break;

      case 'document_signed':
        emailSubject = `✅ Documento assinado com sucesso - ELP Green`;
        emailHtml = buildProfessionalEmail({
          toName,
          signature: signatureSettings,
          showInfoNotice: false,
          content: `
            <p style="margin: 0 0 20px;">Seu documento foi assinado digitalmente com sucesso e está armazenado de forma segura em nosso sistema.</p>
            
            <div style="text-align: center; padding: 30px; background-color: #e8f5e9; border-radius: 10px; margin: 20px 0;">
              <div style="font-size: 48px; margin-bottom: 10px;">✅</div>
              <p style="margin: 0; font-weight: 600; color: ${colors.success}; font-size: 16px;">Assinatura Digital Validada</p>
              <p style="margin: 8px 0 0; font-size: 14px; color: ${colors.muted};">${documentName || 'Documento'}</p>
            </div>
            
            <p style="margin: 20px 0 0; font-size: 13px; color: ${colors.muted}; text-align: center;">
              Uma cópia do documento assinado foi registrada em nosso sistema com validade legal.
            </p>
          `,
        });
        break;

      case 'form_confirmation':
        emailSubject = `🔄 Novo envio recebido - ELP Green Technology`;
        emailHtml = buildProfessionalEmail({
          toName,
          signature: signatureSettings,
          showInfoNotice: false,
          content: `
            <div style="background-color: #e8f5e9; border: 1px solid #a5d6a7; padding: 18px; border-radius: 8px; margin-bottom: 20px;">
              <p style="margin: 0; color: #1b5e20; font-weight: 600;">✓ Identificamos você em nosso sistema!</p>
              <p style="margin: 8px 0 0; color: ${colors.muted}; font-size: 13px;">
                Esta é sua ${submissionCount || 'nova'}ª submissão. Todos os seus envios ficam organizados na mesma pasta.
              </p>
            </div>
            
            <p style="margin: 0 0 20px;">
              Recebemos seu novo ${formType === 'marketplace' ? 'registro no Marketplace' : 'formulário de contato'} 
              e ele foi automaticamente adicionado ao seu histórico de interações conosco.
            </p>
            
            <div style="background-color: #e3f2fd; border-left: 4px solid ${colors.primary}; padding: 14px 18px; border-radius: 0 6px 6px 0;">
              <p style="margin: 0; color: ${colors.primary}; font-size: 13px;">
                <strong>⏱️ Próximos passos</strong><br>
                Nossa equipe analisará sua solicitação e entrará em contato em breve com prioridade, já que você é um parceiro existente.
              </p>
            </div>
          `,
        });
        break;

      case 'custom':
      case 'contact':
      case 'marketplace':
      default:
        // Format message content with line breaks
        const formattedMessage = (message || '').replace(/\n/g, '<br>');
        
        emailHtml = buildProfessionalEmail({
          toName,
          signature: signatureSettings,
          showInfoNotice: true,
          content: `
            <div style="background-color: #fafafa; border-left: 3px solid ${colors.primary}; padding: 18px 22px; border-radius: 0 8px 8px 0; margin: 15px 0;">
              <div style="white-space: pre-wrap; line-height: 1.8; color: ${colors.text}; font-size: 14px;">
                ${formattedMessage}
              </div>
            </div>
          `,
        });
        break;
    }

    // Process attachments if provided
    let resendAttachments: { filename: string; content: string }[] = [];
    
    if (attachments && attachments.length > 0) {
      console.log("Processing", attachments.length, "attachments...");
      
      for (const attachment of attachments) {
        try {
          // Fetch the file from the URL
          const fileResponse = await fetch(attachment.url);
          if (!fileResponse.ok) {
            console.error(`Failed to fetch attachment: ${attachment.name}`, fileResponse.status);
            continue;
          }
          
          const arrayBuffer = await fileResponse.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          
          // Convert to base64
          let binary = '';
          for (let i = 0; i < uint8Array.length; i++) {
            binary += String.fromCharCode(uint8Array[i]);
          }
          const base64Content = btoa(binary);
          
          resendAttachments.push({
            filename: attachment.name,
            content: base64Content,
          });
          
          console.log(`Attachment processed: ${attachment.name} (${uint8Array.length} bytes)`);
        } catch (attachError) {
          console.error(`Error processing attachment ${attachment.name}:`, attachError);
        }
      }
    }

    const emailPayload: Record<string, unknown> = {
      from: "ELP Green Technology <info@elpgreen.com>",
      to: [to],
      cc: cc && cc.length > 0 ? cc : undefined,
      bcc: bcc && bcc.length > 0 ? bcc : undefined,
      subject: emailSubject,
      html: emailHtml,
    };

    // Add attachments if any were processed
    if (resendAttachments.length > 0) {
      emailPayload.attachments = resendAttachments;
      console.log(`Adding ${resendAttachments.length} attachments to email`);
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(emailPayload),
    });

    const responseData = await response.json();
    console.log("Email sent successfully:", responseData);

    return new Response(
      JSON.stringify({ success: true, data: responseData }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending reply email:", error);
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
