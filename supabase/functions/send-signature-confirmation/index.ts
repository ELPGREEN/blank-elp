import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || Deno.env.get("URL_SUPABASE") || Deno.env.get("URL_SUPABAS");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SignatureConfirmationRequest {
  documentName: string;
  signerName: string;
  signerEmail: string;
  signedAt: string;
  signatureType: string;
  signatureHash: string;
  documentId: string;
  language?: string;
}

// ELP Brand Colors - Clean corporate design
const colors = {
  primary: '#1a2744',      // Navy Blue (from logo)
  text: '#333333',
  muted: '#666666',
  light: '#999999',
  white: '#ffffff',
  border: '#e0e0e0',
  success: '#2e7d32',
};

const LOGO_URL = 'https://www.elpgreen.com/logo-elp-email.png';

const translations: Record<string, Record<string, string>> = {
  pt: {
    subject: 'Confirmação de Assinatura Digital - ELP Alliance',
    greeting: 'Prezado(a)',
    intro: 'Sua assinatura digital foi registrada com sucesso.',
    documentLabel: 'Documento',
    dateLabel: 'Data/Hora',
    typeLabel: 'Tipo de Assinatura',
    hashLabel: 'Hash de Verificação',
    drawnType: 'Manuscrita Digital',
    typedType: 'Digitada',
    initialsType: 'Iniciais',
    uploadType: 'Upload de Imagem',
    legalNotice: 'Este documento possui validade jurídica conforme a Lei 14.063/2020 (Brasil) e regulação eIDAS (União Europeia).',
    accessDocument: 'Acessar Documento',
    downloadInfo: 'Você pode baixar uma cópia do documento assinado através do link acima.',
    company: 'ELP Alliance S/A',
    brand: 'ELP Green Technology',
    rights: 'Todos os direitos reservados',
    nextSteps: 'Próximos Passos',
    nextStepsDesc: 'Nossa equipe analisará seu documento e entrará em contato em breve.',
  },
  en: {
    subject: 'Digital Signature Confirmation - ELP Alliance',
    greeting: 'Dear',
    intro: 'Your digital signature has been successfully recorded.',
    documentLabel: 'Document',
    dateLabel: 'Date/Time',
    typeLabel: 'Signature Type',
    hashLabel: 'Verification Hash',
    drawnType: 'Handwritten Digital',
    typedType: 'Typed',
    initialsType: 'Initials',
    uploadType: 'Image Upload',
    legalNotice: 'This document has legal validity according to Law 14.063/2020 (Brazil) and EU eIDAS regulation.',
    accessDocument: 'Access Document',
    downloadInfo: 'You can download a copy of the signed document using the link above.',
    company: 'ELP Alliance S/A',
    brand: 'ELP Green Technology',
    rights: 'All rights reserved',
    nextSteps: 'Next Steps',
    nextStepsDesc: 'Our team will review your document and contact you shortly.',
  },
  es: {
    subject: 'Confirmación de Firma Digital - ELP Alliance',
    greeting: 'Estimado(a)',
    intro: 'Su firma digital ha sido registrada con éxito.',
    documentLabel: 'Documento',
    dateLabel: 'Fecha/Hora',
    typeLabel: 'Tipo de Firma',
    hashLabel: 'Hash de Verificación',
    drawnType: 'Manuscrita Digital',
    typedType: 'Digitada',
    initialsType: 'Iniciales',
    uploadType: 'Carga de Imagen',
    legalNotice: 'Este documento tiene validez legal según la Ley 14.063/2020 (Brasil) y la regulación eIDAS (UE).',
    accessDocument: 'Acceder al Documento',
    downloadInfo: 'Puede descargar una copia del documento firmado utilizando el enlace anterior.',
    company: 'ELP Alliance S/A',
    brand: 'ELP Green Technology',
    rights: 'Todos los derechos reservados',
    nextSteps: 'Próximos Pasos',
    nextStepsDesc: 'Nuestro equipo analizará su documento y se pondrá en contacto pronto.',
  },
  it: {
    subject: 'Conferma Firma Digitale - ELP Alliance',
    greeting: 'Gentile',
    intro: 'La tua firma digitale è stata registrata con successo.',
    documentLabel: 'Documento',
    dateLabel: 'Data/Ora',
    typeLabel: 'Tipo di Firma',
    hashLabel: 'Hash di Verifica',
    drawnType: 'Manoscritta Digitale',
    typedType: 'Digitata',
    initialsType: 'Iniziali',
    uploadType: 'Caricamento Immagine',
    legalNotice: 'Questo documento ha validità legale secondo la Legge 14.063/2020 (Brasile) e il regolamento eIDAS (UE).',
    accessDocument: 'Accedi al Documento',
    downloadInfo: 'Puoi scaricare una copia del documento firmato utilizzando il link sopra.',
    company: 'ELP Alliance S/A',
    brand: 'ELP Green Technology',
    rights: 'Tutti i diritti riservati',
    nextSteps: 'Prossimi Passi',
    nextStepsDesc: 'Il nostro team esaminerà il tuo documento e ti contatterà a breve.',
  },
  zh: {
    subject: '数字签名确认 - ELP Alliance',
    greeting: '尊敬的',
    intro: '您的数字签名已成功记录。',
    documentLabel: '文件',
    dateLabel: '日期/时间',
    typeLabel: '签名类型',
    hashLabel: '验证哈希',
    drawnType: '手写数字',
    typedType: '输入',
    initialsType: '首字母',
    uploadType: '图片上传',
    legalNotice: '根据第14.063/2020号法律（巴西）和欧盟eIDAS法规，本文件具有法律效力。',
    accessDocument: '访问文件',
    downloadInfo: '您可以通过上面的链接下载已签署文件的副本。',
    company: 'ELP Alliance S/A',
    brand: 'ELP绿色技术',
    rights: '版权所有',
    nextSteps: '下一步',
    nextStepsDesc: '我们的团队将审核您的文件并尽快与您联系。',
  },
};

const getSignatureTypeText = (type: string, t: Record<string, string>): string => {
  switch (type) {
    case 'drawn': return t.drawnType;
    case 'typed': return t.typedType;
    case 'initials': return t.initialsType;
    case 'upload': return t.uploadType;
    default: return type || 'N/A';
  }
};

// Clean corporate email template - white background, logo prominent, no colored bands
const buildEmailHtml = (data: SignatureConfirmationRequest, t: Record<string, string>, formattedDate: string, signatureTypeText: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: ${colors.white}; max-width: 600px;">
          
          <!-- Header with Logo -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; background-color: ${colors.white}; border-bottom: 1px solid ${colors.border};">
              <img src="${LOGO_URL}" alt="ELP Green Technology" style="height: 60px; max-width: 200px;" />
            </td>
          </tr>
          
          <!-- Title -->
          <tr>
            <td style="padding: 30px 40px 20px; text-align: center; background-color: ${colors.white};">
              <h1 style="margin: 0; color: ${colors.primary}; font-size: 22px; font-weight: 600;">
                ✓ ${t.intro}
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 10px 40px 30px; background-color: ${colors.white};">
              <p style="margin: 0 0 20px; color: ${colors.text}; font-size: 15px;">
                ${t.greeting} <strong>${data.signerName}</strong>,
              </p>
              
              <!-- Document Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid ${colors.border}; border-radius: 6px; margin: 20px 0;">
                <tr>
                  <td style="padding: 12px 16px; color: ${colors.muted}; font-size: 13px; border-bottom: 1px solid ${colors.border}; width: 40%; background-color: #fafafa;">
                    ${t.documentLabel}
                  </td>
                  <td style="padding: 12px 16px; color: ${colors.text}; font-size: 14px; font-weight: 500; border-bottom: 1px solid ${colors.border};">
                    ${data.documentName}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; color: ${colors.muted}; font-size: 13px; border-bottom: 1px solid ${colors.border}; background-color: #fafafa;">
                    ${t.dateLabel}
                  </td>
                  <td style="padding: 12px 16px; color: ${colors.text}; font-size: 14px; font-weight: 500; border-bottom: 1px solid ${colors.border};">
                    ${formattedDate}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; color: ${colors.muted}; font-size: 13px; background-color: #fafafa;">
                    ${t.typeLabel}
                  </td>
                  <td style="padding: 12px 16px; color: ${colors.text}; font-size: 14px; font-weight: 500;">
                    ${signatureTypeText}
                  </td>
                </tr>
              </table>
              
              <!-- Hash -->
              <div style="background-color: #fafafa; padding: 12px 16px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0 0 6px; color: ${colors.muted}; font-size: 12px;">${t.hashLabel}:</p>
                <code style="font-size: 10px; color: ${colors.light}; font-family: monospace; word-break: break-all;">${data.signatureHash}</code>
              </div>
              
              <!-- Legal Notice -->
              <div style="background-color: #f0f4f8; border-left: 3px solid ${colors.primary}; padding: 12px 16px; margin: 20px 0; border-radius: 0 4px 4px 0;">
                <p style="margin: 0; color: ${colors.primary}; font-size: 13px; line-height: 1.5;">
                  🔐 ${t.legalNotice}
                </p>
              </div>
              
              <!-- Next Steps -->
              <div style="background-color: #e8f5e9; border-left: 3px solid ${colors.success}; padding: 12px 16px; margin: 20px 0; border-radius: 0 4px 4px 0;">
                <p style="margin: 0 0 5px; color: ${colors.success}; font-size: 14px; font-weight: 600;">
                  ${t.nextSteps}
                </p>
                <p style="margin: 0; color: ${colors.text}; font-size: 13px;">
                  ${t.nextStepsDesc}
                </p>
              </div>
              
              <!-- Download Info -->
              <p style="margin: 20px 0 25px; color: ${colors.muted}; font-size: 13px; text-align: center;">
                ${t.downloadInfo}
              </p>
              
              <!-- Button -->
              <div style="text-align: center; margin: 25px 0;">
                <a href="https://www.elpgreen.com/sign?doc=${data.documentId}" 
                   style="display: inline-block; background-color: ${colors.primary}; color: ${colors.white}; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 14px;">
                  ${t.accessDocument}
                </a>
              </div>
            </td>
          </tr>
          
          <!-- Footer with Corporate Signature -->
          <tr>
            <td style="padding: 30px 40px; background-color: ${colors.white}; border-top: 1px solid ${colors.border};">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 8px; color: ${colors.primary}; font-size: 15px; font-weight: 700;">
                      ${t.brand}
                    </p>
                    <p style="margin: 0 0 12px; color: ${colors.muted}; font-size: 13px;">
                      Transforming Waste into Resources
                    </p>
                    
                    <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                      <tr>
                        <td style="padding: 0 10px;">
                          <a href="https://www.elpgreen.com" style="color: ${colors.primary}; font-size: 12px; text-decoration: none;">🌐 www.elpgreen.com</a>
                        </td>
                        <td style="padding: 0 10px; border-left: 1px solid ${colors.border};">
                          <a href="mailto:info@elpgreen.com" style="color: ${colors.primary}; font-size: 12px; text-decoration: none;">✉️ info@elpgreen.com</a>
                        </td>
                        <td style="padding: 0 10px; border-left: 1px solid ${colors.border};">
                          <span style="color: ${colors.muted}; font-size: 12px;">📞 +39 350 102 1359</span>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 15px 0 0; color: ${colors.light}; font-size: 11px;">
                      ${t.company} | São Paulo, Brazil | Milan, Italy
                    </p>
                    <p style="margin: 8px 0 0; color: #cccccc; font-size: 10px;">
                      © ${new Date().getFullYear()} ${t.rights}
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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: SignatureConfirmationRequest = await req.json();
    const lang = data.language || 'pt';
    const t = translations[lang] || translations.pt;

    const signedDate = new Date(data.signedAt);
    const formattedDate = signedDate.toLocaleString(
      lang === 'pt' ? 'pt-BR' : lang === 'es' ? 'es-ES' : lang === 'it' ? 'it-IT' : lang === 'zh' ? 'zh-CN' : 'en-US', 
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }
    );

    const signatureTypeText = getSignatureTypeText(data.signatureType, t);
    const htmlContent = buildEmailHtml(data, t, formattedDate, signatureTypeText);

    // Send to user
    const emailResponse = await resend.emails.send({
      from: "ELP Alliance <onboarding@resend.dev>",
      to: [data.signerEmail],
      subject: t.subject,
      html: htmlContent,
    });

    console.log("Signature confirmation email sent to user:", emailResponse);

    // Also send notification to admin
    const adminHtml = `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: ${colors.white};">
        <div style="background: linear-gradient(135deg, ${colors.success}, #059669); padding: 12px 20px; text-align: center;">
          <span style="color: white; font-weight: 700; font-size: 14px; letter-spacing: 1px;">✓ NOVO DOCUMENTO ASSINADO</span>
        </div>
        <div style="background: linear-gradient(135deg, ${colors.primary}, #2563eb); padding: 30px; text-align: center;">
          <h1 style="color: ${colors.white}; margin: 0; font-size: 22px;">Assinatura Recebida</h1>
        </div>
        <div style="padding: 30px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid ${colors.border};"><strong>Documento:</strong></td>
              <td style="padding: 12px 0; border-bottom: 1px solid ${colors.border};">${data.documentName}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid ${colors.border};"><strong>Assinante:</strong></td>
              <td style="padding: 12px 0; border-bottom: 1px solid ${colors.border};">${data.signerName}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid ${colors.border};"><strong>Email:</strong></td>
              <td style="padding: 12px 0; border-bottom: 1px solid ${colors.border};"><a href="mailto:${data.signerEmail}">${data.signerEmail}</a></td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid ${colors.border};"><strong>Data/Hora:</strong></td>
              <td style="padding: 12px 0; border-bottom: 1px solid ${colors.border};">${formattedDate}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid ${colors.border};"><strong>Tipo:</strong></td>
              <td style="padding: 12px 0; border-bottom: 1px solid ${colors.border};">${signatureTypeText}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0;"><strong>Hash:</strong></td>
              <td style="padding: 12px 0; font-family: monospace; font-size: 10px; word-break: break-all;">${data.signatureHash}</td>
            </tr>
          </table>
          <div style="text-align: center; margin-top: 25px;">
            <a href="https://www.elpgreen.com/admin" style="background: #2563eb; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
              Ver no Painel Admin
            </a>
          </div>
        </div>
        <div style="background: ${colors.primary}; padding: 20px; text-align: center;">
          <p style="color: rgba(255,255,255,0.7); font-size: 12px; margin: 0;">ELP Alliance S/A - Notificação Automática</p>
        </div>
      </div>
    `;

    await resend.emails.send({
      from: "ELP Green Technology <onboarding@resend.dev>",
      to: ["elpenergia@gmail.com"],
      cc: ["info@elpgreen.com"],
      subject: `✓ Assinado: ${data.documentName} - ${data.signerName}`,
      html: adminHtml,
    });

    console.log("Admin notification sent");

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error sending signature confirmation email:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
