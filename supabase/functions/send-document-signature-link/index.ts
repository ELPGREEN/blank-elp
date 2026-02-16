import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import QRCode from "https://esm.sh/qrcode@1.5.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface SignatureLinkRequest {
  documentId: string;
  documentName: string;
  templateType: string;
  recipientEmail: string;
  recipientName: string;
  companyName?: string;
  language?: string;
  fieldValues?: Record<string, string>;
}

const translations = {
  pt: {
    subject: (docName: string) => `📝 Documento para Assinatura: ${docName}`,
    greeting: (name: string) => `Prezado(a) ${name},`,
    intro: "Um documento foi preparado e aguarda sua assinatura digital.",
    documentLabel: "Documento",
    companyLabel: "Empresa",
    actionLabel: "Ação Necessária",
    actionText: "Por favor, clique no botão abaixo ou escaneie o QR Code para revisar e assinar o documento eletronicamente.",
    buttonText: "Assinar Documento",
    qrCodeLabel: "Ou escaneie o QR Code com seu celular:",
    securityNote: "Esta assinatura eletrônica tem validade jurídica conforme a Lei 14.063/2020 (Brasil) e regulação eIDAS (UE).",
    expiryNote: "Este link é válido por 90 dias. Após esse período, solicite um novo link se necessário.",
    supportText: "Em caso de dúvidas, entre em contato conosco.",
    footer: "ELP Green Technology - Transformando resíduos em recursos",
  },
  en: {
    subject: (docName: string) => `📝 Document for Signature: ${docName}`,
    greeting: (name: string) => `Dear ${name},`,
    intro: "A document has been prepared and is awaiting your digital signature.",
    documentLabel: "Document",
    companyLabel: "Company",
    actionLabel: "Action Required",
    actionText: "Please click the button below or scan the QR Code to review and electronically sign the document.",
    buttonText: "Sign Document",
    qrCodeLabel: "Or scan the QR Code with your phone:",
    securityNote: "This electronic signature is legally valid under Law 14.063/2020 (Brazil) and EU eIDAS regulation.",
    expiryNote: "This link is valid for 90 days. After this period, request a new link if needed.",
    supportText: "If you have any questions, please contact us.",
    footer: "ELP Green Technology - Transforming waste into resources",
  },
  es: {
    subject: (docName: string) => `📝 Documento para Firma: ${docName}`,
    greeting: (name: string) => `Estimado(a) ${name},`,
    intro: "Un documento ha sido preparado y espera su firma digital.",
    documentLabel: "Documento",
    companyLabel: "Empresa",
    actionLabel: "Acción Requerida",
    actionText: "Por favor, haga clic en el botón a continuación o escanee el código QR para revisar y firmar electrónicamente el documento.",
    buttonText: "Firmar Documento",
    qrCodeLabel: "O escanee el código QR con su teléfono:",
    securityNote: "Esta firma electrónica tiene validez legal según la Ley 14.063/2020 (Brasil) y la regulación eIDAS (UE).",
    expiryNote: "Este enlace es válido por 90 días. Después de este período, solicite un nuevo enlace si es necesario.",
    supportText: "Si tiene alguna pregunta, contáctenos.",
    footer: "ELP Green Technology - Transformando residuos en recursos",
  },
  it: {
    subject: (docName: string) => `📝 Documento da Firmare: ${docName}`,
    greeting: (name: string) => `Gentile ${name},`,
    intro: "Un documento è stato preparato ed è in attesa della sua firma digitale.",
    documentLabel: "Documento",
    companyLabel: "Azienda",
    actionLabel: "Azione Richiesta",
    actionText: "Per favore, clicchi sul pulsante qui sotto o scansioni il codice QR per rivedere e firmare elettronicamente il documento.",
    buttonText: "Firma Documento",
    qrCodeLabel: "Oppure scansiona il codice QR con il tuo telefono:",
    securityNote: "Questa firma elettronica è legalmente valida secondo la Legge 14.063/2020 (Brasile) e il regolamento eIDAS (UE).",
    expiryNote: "Questo link è valido per 90 giorni. Dopo questo periodo, richieda un nuovo link se necessario.",
    supportText: "In caso di domande, ci contatti.",
    footer: "ELP Green Technology - Trasformare i rifiuti in risorse",
  },
  zh: {
    subject: (docName: string) => `📝 待签署文件: ${docName}`,
    greeting: (name: string) => `尊敬的 ${name}，`,
    intro: "一份文件已准备就绪，正在等待您的数字签名。",
    documentLabel: "文件",
    companyLabel: "公司",
    actionLabel: "所需操作",
    actionText: "请点击下方按钮或扫描二维码查看并以电子方式签署文件。",
    buttonText: "签署文件",
    qrCodeLabel: "或用手机扫描二维码：",
    securityNote: "此电子签名根据第14.063/2020号法律（巴西）和欧盟eIDAS法规具有法律效力。",
    expiryNote: "此链接有效期为90天。过期后如需要请申请新链接。",
    supportText: "如有任何疑问，请与我们联系。",
    footer: "ELP绿色技术 - 将废物转化为资源",
  },
};

// Generate QR Code as base64 data URL
async function generateQRCodeDataURL(url: string): Promise<string> {
  try {
    const qrDataURL = await QRCode.toDataURL(url, {
      width: 180,
      margin: 2,
      color: {
        dark: '#1a5c3a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
    return qrDataURL;
  } catch (error) {
    console.error("Error generating QR code:", error);
    return '';
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: SignatureLinkRequest = await req.json();
    const lang = (data.language || 'pt') as keyof typeof translations;
    const t = translations[lang] || translations.pt;
    
    // Use production domain for all links
    const signatureLink = `https://www.elpgreen.com/sign?doc=${data.documentId}`;
    
    // Generate QR Code
    const qrCodeDataURL = await generateQRCodeDataURL(signatureLink);
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a5c3a 0%, #228b22 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">ELP Green Technology</h1>
              <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px; letter-spacing: 1px;">DIGITAL SIGNATURE PORTAL</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #18181b; font-size: 18px; margin: 0 0 16px; font-weight: 600;">
                ${t.greeting(data.recipientName)}
              </p>
              
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                ${t.intro}
              </p>
              
              <!-- Document Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">${t.documentLabel}</span>
                          <p style="color: #18181b; font-size: 16px; font-weight: 600; margin: 4px 0 0;">${data.documentName}</p>
                        </td>
                      </tr>
                      ${data.companyName ? `
                      <tr>
                        <td style="padding: 8px 0; border-top: 1px solid #e4e4e7;">
                          <span style="color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">${t.companyLabel}</span>
                          <p style="color: #18181b; font-size: 16px; font-weight: 600; margin: 4px 0 0;">${data.companyName}</p>
                        </td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Action Required -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                <p style="color: #92400e; font-size: 14px; font-weight: 600; margin: 0 0 8px;">
                  ⚡ ${t.actionLabel}
                </p>
                <p style="color: #a16207; font-size: 14px; margin: 0; line-height: 1.5;">
                  ${t.actionText}
                </p>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${signatureLink}" 
                   style="display: inline-block; background: linear-gradient(135deg, #1a5c3a 0%, #228b22 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 700; font-size: 16px; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(26, 92, 58, 0.3);">
                  ✍️ ${t.buttonText}
                </a>
              </div>
              
              <!-- QR Code Section -->
              ${qrCodeDataURL ? `
              <div style="text-align: center; margin: 32px 0; padding: 24px; background-color: #f8fafc; border-radius: 12px; border: 2px dashed #e4e4e7;">
                <p style="color: #52525b; font-size: 14px; margin: 0 0 16px; font-weight: 600;">
                  📱 ${t.qrCodeLabel}
                </p>
                <img src="${qrCodeDataURL}" alt="QR Code" style="width: 180px; height: 180px; border-radius: 8px; border: 4px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
                <p style="color: #71717a; font-size: 12px; margin: 12px 0 0;">
                  ID: ${data.documentId.substring(0, 8)}...
                </p>
              </div>
              ` : ''}
              
              <!-- Security Note -->
              <div style="background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
                <p style="color: #166534; font-size: 13px; margin: 0; line-height: 1.5;">
                  🔒 ${t.securityNote}
                </p>
              </div>
              
              <!-- Link Expiry Note -->
              <p style="color: #71717a; font-size: 13px; line-height: 1.6; margin: 0 0 16px; font-style: italic;">
                ${t.expiryNote}
              </p>
              
              <!-- Fallback Link -->
              <p style="color: #a1a1aa; font-size: 12px; line-height: 1.6; margin: 0;">
                ${t.supportText}<br>
                <a href="${signatureLink}" style="color: #1a5c3a; word-break: break-all;">${signatureLink}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer with Corporate Signature -->
          <tr>
            <td style="background-color: #ffffff; padding: 30px; border-top: 1px solid #e4e4e7;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align: center;">
                    <p style="color: #1a2744; font-size: 15px; font-weight: 700; margin: 0 0 8px;">ELP Green Technology</p>
                    <p style="color: #666666; font-size: 13px; margin: 0 0 12px;">Transforming Waste into Resources</p>
                    
                    <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                      <tr>
                        <td style="padding: 0 10px;">
                          <a href="https://www.elpgreen.com" style="color: #1a2744; font-size: 12px; text-decoration: none;">🌐 www.elpgreen.com</a>
                        </td>
                        <td style="padding: 0 10px; border-left: 1px solid #e4e4e7;">
                          <a href="mailto:info@elpgreen.com" style="color: #1a2744; font-size: 12px; text-decoration: none;">✉️ info@elpgreen.com</a>
                        </td>
                        <td style="padding: 0 10px; border-left: 1px solid #e4e4e7;">
                          <span style="color: #666666; font-size: 12px;">📞 +39 350 102 1359</span>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="color: #999999; font-size: 11px; margin: 15px 0 0;">
                      ELP Alliance S/A | São Paulo, Brazil | Milan, Italy
                    </p>
                    <p style="color: #cccccc; font-size: 10px; margin: 8px 0 0;">
                      © ${new Date().getFullYear()} All rights reserved
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

    console.log(`Sending signature link email to ${data.recipientEmail} for document ${data.documentId}`);

    // Send email to recipient
    const emailResponse = await resend.emails.send({
      from: "ELP Green Technology <onboarding@resend.dev>",
      to: [data.recipientEmail],
      subject: t.subject(data.documentName),
      html: htmlContent,
    });

    console.log("Signature link email sent:", emailResponse);

    // Also send a copy to admin
    await resend.emails.send({
      from: "ELP Green Technology <onboarding@resend.dev>",
      to: ["info@elpgreen.com"],
      subject: `[Admin] Link enviado: ${data.documentName}`,
      html: `
        <h2>Link de assinatura enviado</h2>
        <p><strong>Documento:</strong> ${data.documentName}</p>
        <p><strong>Destinatário:</strong> ${data.recipientName} (${data.recipientEmail})</p>
        <p><strong>Empresa:</strong> ${data.companyName || 'N/A'}</p>
        <p><strong>ID:</strong> ${data.documentId}</p>
        <p><strong>Link:</strong> <a href="${signatureLink}">${signatureLink}</a></p>
        <p><strong>Idioma:</strong> ${lang}</p>
        <p><strong>Data:</strong> ${new Date().toISOString()}</p>
        ${qrCodeDataURL ? `<p><strong>QR Code:</strong> <img src="${qrCodeDataURL}" width="100" /></p>` : ''}
      `,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailResponse,
        signatureLink,
        qrCodeGenerated: !!qrCodeDataURL,
      }), 
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error sending signature link email:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
