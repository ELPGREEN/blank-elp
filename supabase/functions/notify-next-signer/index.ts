import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || Deno.env.get("URL_SUPABASE");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

console.log("Edge function notify-next-signer initialized");
console.log("SUPABASE_URL available:", !!SUPABASE_URL);
console.log("SERVICE_ROLE_KEY available:", !!SUPABASE_SERVICE_ROLE_KEY);
console.log("RESEND_API_KEY available:", !!Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifyNextSignerRequest {
  documentId: string;
  // Optional - can be fetched from DB if not provided
  documentName?: string;
  nextSignerEmail?: string;
  nextSignerName?: string;
  signatureLink?: string;
  previousSignerName?: string;
  currentSignatureNumber?: number;
  totalSignatures?: number;
  language?: string;
}

const translations = {
  pt: {
    subject: (docName: string) => `Sua vez de assinar: "${docName}"`,
    title: 'Documento Aguardando Sua Assinatura',
    greeting: (name: string) => `Prezado(a) ${name},`,
    message1: (docName: string) => `O documento <strong>"${docName}"</strong> está aguardando sua assinatura digital.`,
    previousSigned: (name: string) => `${name} já assinou este documento.`,
    signatureProgress: (current: number, total: number) => `Assinatura ${current} de ${total}`,
    ctaButton: 'Assinar Documento Agora',
    footer: 'Este é um e-mail automático. Não responda.',
    legalNotice: 'Assinatura eletrônica com validade jurídica conforme Lei 14.063/2020.',
  },
  en: {
    subject: (docName: string) => `Your turn to sign: "${docName}"`,
    title: 'Document Awaiting Your Signature',
    greeting: (name: string) => `Dear ${name},`,
    message1: (docName: string) => `The document <strong>"${docName}"</strong> is waiting for your digital signature.`,
    previousSigned: (name: string) => `${name} has already signed this document.`,
    signatureProgress: (current: number, total: number) => `Signature ${current} of ${total}`,
    ctaButton: 'Sign Document Now',
    footer: 'This is an automated email. Please do not reply.',
    legalNotice: 'Electronic signature with legal validity.',
  },
  es: {
    subject: (docName: string) => `Tu turno de firmar: "${docName}"`,
    title: 'Documento Esperando Tu Firma',
    greeting: (name: string) => `Estimado/a ${name},`,
    message1: (docName: string) => `El documento <strong>"${docName}"</strong> está esperando tu firma digital.`,
    previousSigned: (name: string) => `${name} ya ha firmado este documento.`,
    signatureProgress: (current: number, total: number) => `Firma ${current} de ${total}`,
    ctaButton: 'Firmar Documento Ahora',
    footer: 'Este es un correo automático. No responda.',
    legalNotice: 'Firma electrónica con validez legal.',
  },
  zh: {
    subject: (docName: string) => `轮到您签署了："${docName}"`,
    title: '文件等待您的签名',
    greeting: (name: string) => `尊敬的 ${name}，`,
    message1: (docName: string) => `文件 <strong>"${docName}"</strong> 正在等待您的数字签名。`,
    previousSigned: (name: string) => `${name} 已签署此文件。`,
    signatureProgress: (current: number, total: number) => `签名 ${current}/${total}`,
    ctaButton: '立即签署文件',
    footer: '这是一封自动邮件，请勿回复。',
    legalNotice: '具有法律效力的电子签名。',
  },
  it: {
    subject: (docName: string) => `Il tuo turno di firmare: "${docName}"`,
    title: 'Documento in Attesa della Tua Firma',
    greeting: (name: string) => `Gentile ${name},`,
    message1: (docName: string) => `Il documento <strong>"${docName}"</strong> è in attesa della tua firma digitale.`,
    previousSigned: (name: string) => `${name} ha già firmato questo documento.`,
    signatureProgress: (current: number, total: number) => `Firma ${current} di ${total}`,
    ctaButton: 'Firma Documento Ora',
    footer: 'Questa è un\'email automatica. Non rispondere.',
    legalNotice: 'Firma elettronica con validità legale secondo il Regolamento eIDAS.',
  },
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: NotifyNextSignerRequest = await req.json();
    
    // Initialize Supabase client
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase configuration");
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // If minimal data provided, fetch document details from database
    let data = { ...requestData };
    
    if (!data.nextSignerEmail || !data.documentName) {
      console.log("Fetching document details from database for:", data.documentId);
      
      const { data: docData, error: docError } = await supabase
        .from('generated_documents')
        .select('*')
        .eq('id', data.documentId)
        .single();
      
      if (docError || !docData) {
        throw new Error(`Document not found: ${data.documentId}`);
      }
      
      // Parse signers from field_values
      const fieldValues = docData.field_values as Record<string, unknown> || {};
      const signers = (fieldValues.signers || []) as Array<{ name: string; email: string; order: number; status: string }>;
      const currentSigs = docData.current_signatures || 0;
      
      // Find next pending signer
      const sortedSigners = [...signers].sort((a, b) => a.order - b.order);
      const nextSigner = sortedSigners.find((s, idx) => idx >= currentSigs && s.status === 'pending');
      
      if (!nextSigner) {
        return new Response(JSON.stringify({ success: true, message: "No pending signers" }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      
      // Build complete data object
      data = {
        documentId: data.documentId,
        documentName: docData.document_name,
        nextSignerEmail: nextSigner.email,
        nextSignerName: nextSigner.name,
        signatureLink: `https://www.elpgreen.com/sign/${data.documentId}`,
        previousSignerName: currentSigs > 0 ? sortedSigners[currentSigs - 1]?.name : undefined,
        currentSignatureNumber: currentSigs + 1,
        totalSignatures: docData.required_signatures || signers.length || 1,
        language: docData.language || 'pt',
      };
    }
    
    const lang = (data.language || 'pt') as keyof typeof translations;
    const t = translations[lang] || translations.pt;
    
    // Ensure required fields have values
    const documentName = data.documentName || 'Document';
    const nextSignerName = data.nextSignerName || 'Signatory';
    const nextSignerEmail = data.nextSignerEmail || '';
    const signatureLink = data.signatureLink || `https://www.elpgreen.com/sign/${data.documentId}`;
    const currentSignatureNumber = data.currentSignatureNumber || 1;
    const totalSignatures = data.totalSignatures || 1;
    
    if (!nextSignerEmail) {
      return new Response(JSON.stringify({ success: false, error: "No signer email available" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Update document with pending signer info
    await supabase
      .from('generated_documents')
      .update({
        pending_signer_email: nextSignerEmail,
        pending_signer_name: nextSignerName,
        signature_status: 'awaiting_signature',
      })
      .eq('id', data.documentId);

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a2744 0%, #2a3a5c 100%); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">ELP Alliance</h1>
              <p style="color: #a1a1aa; margin: 8px 0 0; font-size: 14px;">ELP Green Technology</p>
            </td>
          </tr>
          
          <!-- Progress Bar -->
          <tr>
            <td style="padding: 0;">
              <div style="background-color: #e0e0e0; height: 6px;">
                <div style="background: linear-gradient(90deg, #2e7d32, #4caf50); height: 6px; width: ${(currentSignatureNumber / totalSignatures) * 100}%;"></div>
              </div>
              <p style="text-align: center; color: #666; font-size: 12px; margin: 8px 0; padding: 0 20px;">
                ${t.signatureProgress(currentSignatureNumber, totalSignatures)}
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; padding: 16px; background-color: #e8f5e9; border-radius: 50%;">
                  <span style="font-size: 32px;">✍️</span>
                </div>
              </div>
              
              <h2 style="color: #1a2744; margin: 0 0 16px; font-size: 22px; text-align: center;">
                ${t.title}
              </h2>
              
              <p style="color: #52525b; font-size: 16px; line-height: 1.6;">
                ${t.greeting(nextSignerName)}
              </p>
              
              <p style="color: #52525b; font-size: 16px; line-height: 1.6;">
                ${t.message1(documentName)}
              </p>
              
              ${data.previousSignerName ? `
              <div style="background-color: #f0fdf4; border-left: 4px solid #2e7d32; padding: 12px 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
                <p style="color: #166534; margin: 0; font-size: 14px;">
                  ✓ ${t.previousSigned(data.previousSignerName)}
                </p>
              </div>
              ` : ''}
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${signatureLink}" 
                   style="display: inline-block; background: linear-gradient(135deg, #1a5c3a 0%, #2e7d32 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(46, 125, 50, 0.3);">
                  ${t.ctaButton}
                </a>
              </div>
              
              <p style="color: #71717a; font-size: 12px; line-height: 1.6; text-align: center; margin-top: 24px;">
                ${t.legalNotice}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f4f4f5; padding: 24px 32px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="color: #71717a; font-size: 12px; margin: 0;">
                ${t.footer}
              </p>
              <p style="color: #a1a1aa; font-size: 11px; margin: 8px 0 0;">
                ELP Alliance S/A - ELP Green Technology<br>
                © ${new Date().getFullYear()} Todos os direitos reservados
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const emailResponse = await resend.emails.send({
      from: "ELP Alliance <onboarding@resend.dev>",
      to: [nextSignerEmail],
      subject: t.subject(documentName),
      html: htmlContent,
    });

    console.log("Next signer notification sent:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error sending next signer notification:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
