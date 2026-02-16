import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || Deno.env.get("URL_SUPABASE") || Deno.env.get("URL_SUPABAS");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TemplateSubmissionRequest {
  documentId: string;
  templateName: string;
  templateType: string;
  fieldValues: Record<string, string>;
  language: string;
  isSigned: boolean;
  signatureHash?: string;
  signedAt?: string;
  signerName?: string;
  signerEmail?: string;
}

const colors = {
  primary: '#1a365d',
  secondary: '#2563eb',
  accent: '#3b82f6',
  background: '#f8fafc',
  text: '#1e293b',
  muted: '#64748b',
  white: '#ffffff',
  border: '#e2e8f0',
  success: '#10b981',
  green: '#1a5c3a',
};

// Multilingual translations
const translations: Record<string, Record<string, string>> = {
  pt: {
    subject: 'Confirmação de Envio - ELP Alliance',
    subjectSigned: 'Documento Assinado com Sucesso - ELP Alliance',
    greeting: 'Prezado(a)',
    intro: 'Recebemos seu documento com sucesso!',
    introSigned: 'Seu documento foi assinado e registrado com sucesso!',
    documentLabel: 'Documento',
    dateLabel: 'Data/Hora',
    typeLabel: 'Tipo de Assinatura',
    statusLabel: 'Status',
    hashLabel: 'Hash de Verificação',
    signedStatus: 'Assinado Digitalmente',
    pendingStatus: 'Aguardando Assinatura',
    drawnType: 'Manuscrita Digital',
    typedType: 'Digitada',
    initialsType: 'Iniciais',
    uploadType: 'Upload',
    legalNotice: 'Este documento possui validade jurídica conforme a Lei 14.063/2020 (Brasil) e regulação eIDAS (União Europeia).',
    nextSteps: 'Próximos Passos',
    nextStepsDesc: 'Nossa equipe analisará seu documento e entrará em contato em até 48 horas úteis.',
    downloadButton: 'Acessar Documento',
    footer: 'ELP Alliance S/A - ELP Green Technology',
    copyright: 'Todos os direitos reservados',
    contactUs: 'Em caso de dúvidas, entre em contato:',
  },
  en: {
    subject: 'Submission Confirmation - ELP Alliance',
    subjectSigned: 'Document Signed Successfully - ELP Alliance',
    greeting: 'Dear',
    intro: 'We have received your document successfully!',
    introSigned: 'Your document has been signed and registered successfully!',
    documentLabel: 'Document',
    dateLabel: 'Date/Time',
    typeLabel: 'Signature Type',
    statusLabel: 'Status',
    hashLabel: 'Verification Hash',
    signedStatus: 'Digitally Signed',
    pendingStatus: 'Pending Signature',
    drawnType: 'Handwritten Digital',
    typedType: 'Typed',
    initialsType: 'Initials',
    uploadType: 'Upload',
    legalNotice: 'This document has legal validity according to Law 14.063/2020 (Brazil) and EU eIDAS regulation.',
    nextSteps: 'Next Steps',
    nextStepsDesc: 'Our team will review your document and contact you within 48 business hours.',
    downloadButton: 'Access Document',
    footer: 'ELP Alliance S/A - ELP Green Technology',
    copyright: 'All rights reserved',
    contactUs: 'For questions, please contact:',
  },
  es: {
    subject: 'Confirmación de Envío - ELP Alliance',
    subjectSigned: 'Documento Firmado con Éxito - ELP Alliance',
    greeting: 'Estimado(a)',
    intro: '¡Hemos recibido su documento con éxito!',
    introSigned: '¡Su documento ha sido firmado y registrado con éxito!',
    documentLabel: 'Documento',
    dateLabel: 'Fecha/Hora',
    typeLabel: 'Tipo de Firma',
    statusLabel: 'Estado',
    hashLabel: 'Hash de Verificación',
    signedStatus: 'Firmado Digitalmente',
    pendingStatus: 'Pendiente de Firma',
    drawnType: 'Manuscrita Digital',
    typedType: 'Digitada',
    initialsType: 'Iniciales',
    uploadType: 'Subida',
    legalNotice: 'Este documento tiene validez legal según la Ley 14.063/2020 (Brasil) y la regulación eIDAS (Unión Europea).',
    nextSteps: 'Próximos Pasos',
    nextStepsDesc: 'Nuestro equipo analizará su documento y se pondrá en contacto en un plazo de 48 horas hábiles.',
    downloadButton: 'Acceder al Documento',
    footer: 'ELP Alliance S/A - ELP Green Technology',
    copyright: 'Todos los derechos reservados',
    contactUs: 'Para consultas, contáctenos:',
  },
  it: {
    subject: 'Conferma Invio - ELP Alliance',
    subjectSigned: 'Documento Firmato con Successo - ELP Alliance',
    greeting: 'Gentile',
    intro: 'Abbiamo ricevuto il tuo documento con successo!',
    introSigned: 'Il tuo documento è stato firmato e registrato con successo!',
    documentLabel: 'Documento',
    dateLabel: 'Data/Ora',
    typeLabel: 'Tipo di Firma',
    statusLabel: 'Stato',
    hashLabel: 'Hash di Verifica',
    signedStatus: 'Firmato Digitalmente',
    pendingStatus: 'In Attesa di Firma',
    drawnType: 'Manoscritta Digitale',
    typedType: 'Digitata',
    initialsType: 'Iniziali',
    uploadType: 'Caricamento',
    legalNotice: 'Questo documento ha validità legale secondo la Legge 14.063/2020 (Brasile) e il regolamento eIDAS (UE).',
    nextSteps: 'Prossimi Passi',
    nextStepsDesc: 'Il nostro team esaminerà il tuo documento e ti contatterà entro 48 ore lavorative.',
    downloadButton: 'Accedi al Documento',
    footer: 'ELP Alliance S/A - ELP Green Technology',
    copyright: 'Tutti i diritti riservati',
    contactUs: 'Per domande, contattaci:',
  },
  zh: {
    subject: '提交确认 - ELP Alliance',
    subjectSigned: '文件签署成功 - ELP Alliance',
    greeting: '尊敬的',
    intro: '我们已成功收到您的文件！',
    introSigned: '您的文件已成功签署并注册！',
    documentLabel: '文件',
    dateLabel: '日期/时间',
    typeLabel: '签名类型',
    statusLabel: '状态',
    hashLabel: '验证哈希',
    signedStatus: '已数字签名',
    pendingStatus: '待签名',
    drawnType: '手写数字',
    typedType: '输入',
    initialsType: '首字母',
    uploadType: '上传',
    legalNotice: '根据第14.063/2020号法律（巴西）和欧盟eIDAS法规，本文件具有法律效力。',
    nextSteps: '下一步',
    nextStepsDesc: '我们的团队将审核您的文件，并在48个工作小时内与您联系。',
    downloadButton: '访问文件',
    footer: 'ELP Alliance S/A - ELP绿色技术',
    copyright: '版权所有',
    contactUs: '如有疑问，请联系：',
  },
};

const getSignatureTypeText = (type: string | undefined, t: Record<string, string>): string => {
  switch (type) {
    case 'drawn': return t.drawnType;
    case 'typed': return t.typedType;
    case 'initials': return t.initialsType;
    case 'upload': return t.uploadType;
    default: return type || 'N/A';
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: TemplateSubmissionRequest = await req.json();
    const { documentId, templateName, templateType, fieldValues, language, isSigned, signatureHash, signedAt, signerName, signerEmail } = body;

    console.log("Template submission notification:", { documentId, templateName, templateType, language });

    const lang = language || 'pt';
    const t = translations[lang] || translations.pt;

    // Extract key info from field values
    const companyName = fieldValues.razao_social || fieldValues.company_name || 'Não informado';
    const contactName = fieldValues.representante || fieldValues.contact_name || signerName || 'Não informado';
    const email = fieldValues.email || fieldValues.contact_email || signerEmail || '';
    const phone = fieldValues.telefone || fieldValues.phone || fieldValues.contact_phone || 'Não informado';
    const address = fieldValues.endereco || fieldValues.company_address || fieldValues.address || 'Não informado';
    const cnpjVat = fieldValues.cnpj_vat || fieldValues.cnpj_tax_id || fieldValues.cnpj || 'Não informado';

    const formattedDate = signedAt ? new Date(signedAt).toLocaleString(
      lang === 'pt' ? 'pt-BR' : lang === 'es' ? 'es-ES' : lang === 'it' ? 'it-IT' : lang === 'zh' ? 'zh-CN' : 'en-US',
      { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }
    ) : new Date().toLocaleString('pt-BR');

    // ============ ADMIN EMAIL (Portuguese) ============
    const adminSignatureBadge = isSigned 
      ? `<div style="background: linear-gradient(135deg, ${colors.success}, #059669); padding: 12px 20px; text-align: center;">
          <span style="color: white; font-weight: 700; font-size: 14px; letter-spacing: 1px;">✓ DOCUMENTO ASSINADO DIGITALMENTE</span>
        </div>`
      : '';

    const adminSignatureDetails = isSigned 
      ? `<div style="background: ${colors.white}; border-radius: 10px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); margin: 20px 0; border-left: 4px solid ${colors.success};">
          <h3 style="color: ${colors.success}; margin: 0 0 15px 0; font-size: 16px;">🔐 Validação de Assinatura Digital</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; width: 35%;"><strong style="color: ${colors.muted};">Assinante:</strong></td>
              <td style="padding: 8px 0; color: ${colors.text}; font-weight: 500;">${signerName || contactName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong style="color: ${colors.muted};">Email:</strong></td>
              <td style="padding: 8px 0;"><a href="mailto:${signerEmail || email}" style="color: ${colors.secondary};">${signerEmail || email}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong style="color: ${colors.muted};">Data/Hora:</strong></td>
              <td style="padding: 8px 0; color: ${colors.text};">${formattedDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong style="color: ${colors.muted};">Hash SHA-256:</strong></td>
              <td style="padding: 8px 0; font-family: monospace; font-size: 11px; color: ${colors.muted}; word-break: break-all;">${signatureHash || 'N/A'}</td>
            </tr>
          </table>
          <p style="margin: 15px 0 0 0; font-size: 12px; color: ${colors.success};">
            ✓ Assinatura válida conforme Lei 14.063/2020 e Regulamento eIDAS (UE)
          </p>
        </div>`
      : '';

    const adminHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: ${colors.white};">
        ${adminSignatureBadge}
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary}); padding: 30px; text-align: center; ${!isSigned ? 'border-radius: 12px 12px 0 0;' : ''}">
          <h1 style="color: ${colors.white}; margin: 0; font-size: 22px; font-weight: 600;">📄 Novo Template Preenchido</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0 0; font-size: 14px;">Um cliente/parceiro preencheu um documento</p>
        </div>
        
        <!-- Content -->
        <div style="background: ${colors.background}; padding: 30px; border: 1px solid ${colors.border}; border-top: none;">
          
          <!-- Template Info -->
          <div style="background: ${colors.white}; border-radius: 10px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); margin-bottom: 20px;">
            <h2 style="color: ${colors.primary}; margin: 0 0 20px 0; font-size: 18px; border-bottom: 2px solid ${colors.accent}; padding-bottom: 10px;">📋 Informações do Documento</h2>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid ${colors.border}; width: 35%;"><strong style="color: ${colors.muted};">Template:</strong></td>
                <td style="padding: 12px 0; border-bottom: 1px solid ${colors.border}; color: ${colors.text}; font-weight: 500;">${templateName}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid ${colors.border};"><strong style="color: ${colors.muted};">Tipo:</strong></td>
                <td style="padding: 12px 0; border-bottom: 1px solid ${colors.border};"><span style="background: ${colors.accent}; color: ${colors.white}; padding: 4px 12px; border-radius: 20px; font-size: 12px;">${templateType.toUpperCase()}</span></td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid ${colors.border};"><strong style="color: ${colors.muted};">Idioma:</strong></td>
                <td style="padding: 12px 0; border-bottom: 1px solid ${colors.border}; color: ${colors.text};">${language.toUpperCase()}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0;"><strong style="color: ${colors.muted};">Status:</strong></td>
                <td style="padding: 12px 0;"><span style="background: ${isSigned ? colors.success : colors.accent}; color: ${colors.white}; padding: 4px 12px; border-radius: 20px; font-size: 12px;">${isSigned ? '✓ Assinado' : '⏳ Pendente Assinatura'}</span></td>
              </tr>
            </table>
          </div>
          
          <!-- Partner Info -->
          <div style="background: ${colors.white}; border-radius: 10px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); margin-bottom: 20px;">
            <h2 style="color: ${colors.primary}; margin: 0 0 20px 0; font-size: 18px; border-bottom: 2px solid ${colors.accent}; padding-bottom: 10px;">🏢 Dados do Parceiro/Cliente</h2>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid ${colors.border}; width: 35%;"><strong style="color: ${colors.muted};">Empresa:</strong></td>
                <td style="padding: 12px 0; border-bottom: 1px solid ${colors.border}; color: ${colors.text}; font-weight: 500;">${companyName}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid ${colors.border};"><strong style="color: ${colors.muted};">Representante:</strong></td>
                <td style="padding: 12px 0; border-bottom: 1px solid ${colors.border}; color: ${colors.text};">${contactName}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid ${colors.border};"><strong style="color: ${colors.muted};">E-mail:</strong></td>
                <td style="padding: 12px 0; border-bottom: 1px solid ${colors.border};"><a href="mailto:${email}" style="color: ${colors.secondary};">${email}</a></td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid ${colors.border};"><strong style="color: ${colors.muted};">Telefone:</strong></td>
                <td style="padding: 12px 0; border-bottom: 1px solid ${colors.border}; color: ${colors.text};">${phone}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid ${colors.border};"><strong style="color: ${colors.muted};">CNPJ/VAT:</strong></td>
                <td style="padding: 12px 0; border-bottom: 1px solid ${colors.border}; color: ${colors.text};">${cnpjVat}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0;"><strong style="color: ${colors.muted};">Endereço:</strong></td>
                <td style="padding: 12px 0; color: ${colors.text};">${address}</td>
              </tr>
            </table>
          </div>
          
          ${adminSignatureDetails}
          
          <!-- Action Buttons -->
          <div style="text-align: center; margin-top: 25px;">
            <a href="https://www.elpgreen.com/admin" style="background: ${colors.secondary}; color: ${colors.white}; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 4px 12px rgba(37,99,235,0.3); margin-right: 10px;">
              📂 Ver no Painel Admin
            </a>
            <a href="mailto:${email}?subject=Re: ${templateName} - ELP Green Technology" style="background: ${colors.white}; color: ${colors.secondary}; padding: 14px 25px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; border: 2px solid ${colors.secondary};">
              ✉️ Responder
            </a>
          </div>
          
          <!-- SLA Reminder -->
          <div style="margin-top: 20px; padding: 15px; background: #f0f9ff; border-radius: 8px; border-left: 4px solid ${colors.accent};">
            <p style="margin: 0; color: ${colors.primary}; font-size: 13px;">
              <strong>⏰ SLA: Entrar em contato em até 48 horas</strong>
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: ${colors.primary}; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
          <p style="color: rgba(255,255,255,0.7); font-size: 12px; margin: 0;">
            ELP Alliance S/A - ELP Green Technology<br>
            Notificação automática do Portal de Documentos
          </p>
        </div>
      </div>
    `;

    // ============ USER EMAIL (Multilingual) ============
    const userSignatureBadge = isSigned 
      ? `<div style="background: linear-gradient(135deg, ${colors.green}, #22c55e); padding: 15px 20px; text-align: center;">
          <span style="color: white; font-weight: 700; font-size: 14px; letter-spacing: 1px;">✓ ${t.signedStatus.toUpperCase()}</span>
        </div>`
      : '';

    const userHtml = `
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
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: ${colors.white}; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);">
          <!-- Signature Badge -->
          ${userSignatureBadge}
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${colors.green}, #228b22); padding: 35px; text-align: center;">
              <img src="https://www.elpgreen.com/logo-elp-email.png" alt="ELP" style="height: 50px; margin-bottom: 15px;" />
              <h1 style="color: ${colors.white}; margin: 0; font-size: 24px; font-weight: 600;">ELP Alliance</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">ELP Green Technology</p>
            </td>
          </tr>
          
          <!-- Success Icon & Greeting -->
          <tr>
            <td style="padding: 35px 35px 20px; text-align: center;">
              <div style="display: inline-block; background-color: ${isSigned ? '#dcfce7' : '#e0f2fe'}; border-radius: 50%; padding: 20px; margin-bottom: 20px;">
                <span style="font-size: 40px;">${isSigned ? '✓' : '📄'}</span>
              </div>
              <h2 style="color: ${isSigned ? colors.success : colors.green}; margin: 0; font-size: 22px; font-weight: 600;">
                ${isSigned ? t.introSigned : t.intro}
              </h2>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 0 35px 35px;">
              <p style="color: ${colors.text}; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                ${t.greeting} <strong>${contactName}</strong>,
              </p>
              
              <!-- Document Details Box -->
              <div style="background-color: #f8fafc; border-radius: 12px; padding: 25px; margin-bottom: 25px; border: 1px solid ${colors.border};">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid ${colors.border};">
                      <span style="color: ${colors.muted}; font-size: 14px;">${t.documentLabel}:</span>
                    </td>
                    <td style="padding: 10px 0; border-bottom: 1px solid ${colors.border}; text-align: right;">
                      <strong style="color: ${colors.text}; font-size: 14px;">${templateName}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid ${colors.border};">
                      <span style="color: ${colors.muted}; font-size: 14px;">${t.dateLabel}:</span>
                    </td>
                    <td style="padding: 10px 0; border-bottom: 1px solid ${colors.border}; text-align: right;">
                      <strong style="color: ${colors.text}; font-size: 14px;">${formattedDate}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; ${isSigned ? 'border-bottom: 1px solid ' + colors.border + ';' : ''}">
                      <span style="color: ${colors.muted}; font-size: 14px;">${t.statusLabel}:</span>
                    </td>
                    <td style="padding: 10px 0; text-align: right; ${isSigned ? 'border-bottom: 1px solid ' + colors.border + ';' : ''}">
                      <span style="background: ${isSigned ? colors.success : colors.accent}; color: ${colors.white}; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">
                        ${isSigned ? t.signedStatus : t.pendingStatus}
                      </span>
                    </td>
                  </tr>
                  ${isSigned ? `
                  <tr>
                    <td style="padding: 10px 0;">
                      <span style="color: ${colors.muted}; font-size: 14px;">${t.typeLabel}:</span>
                    </td>
                    <td style="padding: 10px 0; text-align: right;">
                      <strong style="color: ${colors.text}; font-size: 14px;">${getSignatureTypeText(body.signatureHash ? 'drawn' : undefined, t)}</strong>
                    </td>
                  </tr>
                  ` : ''}
                </table>
                
                ${signatureHash ? `
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid ${colors.border};">
                  <span style="color: ${colors.muted}; font-size: 12px;">${t.hashLabel}:</span>
                  <div style="background-color: #e4e4e7; padding: 10px; border-radius: 6px; margin-top: 6px; word-break: break-all;">
                    <code style="font-size: 10px; color: ${colors.muted}; font-family: monospace;">${signatureHash}</code>
                  </div>
                </div>
                ` : ''}
              </div>
              
              <!-- Legal Notice -->
              ${isSigned ? `
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px 18px; margin-bottom: 25px; border-radius: 0 8px 8px 0;">
                <p style="color: #92400e; font-size: 13px; margin: 0; line-height: 1.5;">
                  🔐 ${t.legalNotice}
                </p>
              </div>
              ` : ''}
              
              <!-- Next Steps -->
              <div style="background-color: #ecfdf5; border-radius: 10px; padding: 20px; margin-bottom: 25px;">
                <h3 style="color: ${colors.green}; margin: 0 0 10px 0; font-size: 16px;">📋 ${t.nextSteps}</h3>
                <p style="color: ${colors.text}; font-size: 14px; margin: 0; line-height: 1.5;">
                  ${t.nextStepsDesc}
                </p>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://www.elpgreen.com/sign?doc=${documentId}" 
                   style="display: inline-block; background: linear-gradient(135deg, ${colors.green}, #228b22); color: ${colors.white}; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 15px rgba(26, 92, 58, 0.3);">
                  ${t.downloadButton}
                </a>
              </div>
              
              <!-- Contact Info -->
              <div style="text-align: center; padding-top: 20px; border-top: 1px solid ${colors.border};">
                <p style="color: ${colors.muted}; font-size: 13px; margin: 0 0 10px 0;">
                  ${t.contactUs}
                </p>
                <p style="margin: 0;">
                  <a href="mailto:info@elpgreen.com" style="color: ${colors.secondary}; text-decoration: none; font-size: 14px;">info@elpgreen.com</a>
                  <span style="color: ${colors.muted}; margin: 0 10px;">|</span>
                  <a href="https://www.elpgreen.com" style="color: ${colors.secondary}; text-decoration: none; font-size: 14px;">www.elpgreen.com</a>
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #1a2b3c; padding: 25px; text-align: center;">
              <p style="color: rgba(255,255,255,0.8); font-size: 12px; margin: 0 0 5px 0;">
                ${t.footer}
              </p>
              <p style="color: rgba(255,255,255,0.5); font-size: 11px; margin: 0;">
                © ${new Date().getFullYear()} ${t.copyright}
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

    // Send admin notification
    console.log("Sending admin notification...");
    const adminResponse = await resend.emails.send({
      from: "ELP Green Technology <onboarding@resend.dev>",
      to: ["elpenergia@gmail.com"],
      cc: ["info@elpgreen.com"],
      subject: `📄 ${isSigned ? '✓ Assinado' : 'Novo'}: ${templateName} - ${companyName}`,
      html: adminHtml,
    });
    console.log("Admin email sent:", adminResponse);

    // Send user confirmation email if email is provided
    if (email && email.includes('@')) {
      console.log("Sending user confirmation to:", email);
      const userResponse = await resend.emails.send({
        from: "ELP Alliance <onboarding@resend.dev>",
        to: [email],
        subject: isSigned ? t.subjectSigned : t.subject,
        html: userHtml,
      });
      console.log("User email sent:", userResponse);
    }

    return new Response(JSON.stringify({ success: true, adminEmailId: adminResponse.data?.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error sending template notification:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
