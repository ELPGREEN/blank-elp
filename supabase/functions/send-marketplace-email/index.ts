import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || Deno.env.get("URL_SUPABASE") || Deno.env.get("URL_SUPABAS");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ELP Brand Colors - Professional Corporate Design
const COLORS = {
  primary: '#1a2744',      // Navy Blue from logo
  text: '#333333',         // Dark text
  muted: '#666666',        // Secondary text
  light: '#999999',        // Light text
  white: '#ffffff',
  border: '#e0e0e0',
  success: '#2e7d32',      // Green
};

// Logo URL
const LOGO_URL = 'https://www.elpgreen.com/logo-elp-email.png';

interface MarketplaceEmailRequest {
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  country: string;
  companyType: string;
  productsInterest: string[];
  estimatedVolume?: string;
  message?: string;
  registrationId?: string;
  language?: string;
}

interface ResendEmailResponse {
  id?: string;
  error?: { message: string };
}

const productNames: Record<string, Record<string, string>> = {
  pt: {
    'rcb': 'Negro de Fumo Recuperado (rCB)',
    'pyrolytic-oil': 'Óleo Pirolítico',
    'steel-wire': 'Aço Verde Reciclado',
    'rubber-blocks': 'Blocos de Borracha Recuperada',
    'rubber-granules': 'Grânulos de Borracha',
    'reclaimed-rubber': 'Borracha Regenerada'
  },
  en: {
    'rcb': 'Recovered Carbon Black (rCB)',
    'pyrolytic-oil': 'Pyrolytic Oil',
    'steel-wire': 'Recycled Green Steel',
    'rubber-blocks': 'Recovered Rubber Blocks',
    'rubber-granules': 'Rubber Granules',
    'reclaimed-rubber': 'Reclaimed Rubber'
  },
  es: {
    'rcb': 'Negro de Carbón Recuperado (rCB)',
    'pyrolytic-oil': 'Aceite Pirolítico',
    'steel-wire': 'Acero Verde Reciclado',
    'rubber-blocks': 'Bloques de Caucho Recuperado',
    'rubber-granules': 'Gránulos de Caucho',
    'reclaimed-rubber': 'Caucho Regenerado'
  },
  zh: {
    'rcb': '回收炭黑 (rCB)',
    'pyrolytic-oil': '热解油',
    'steel-wire': '绿色再生钢',
    'rubber-blocks': '再生橡胶块',
    'rubber-granules': '橡胶颗粒',
    'reclaimed-rubber': '再生橡胶'
  }
};

const companyTypeNames: Record<string, Record<string, string>> = {
  pt: { buyer: 'Comprador', seller: 'Vendedor', both: 'Comprador e Vendedor' },
  en: { buyer: 'Buyer', seller: 'Seller', both: 'Buyer and Seller' },
  es: { buyer: 'Comprador', seller: 'Vendedor', both: 'Comprador y Vendedor' },
  zh: { buyer: '采购商', seller: '供应商', both: '采购商和供应商' }
};

const emailTranslations = {
  pt: {
    subject: 'Pré-Registro Confirmado - ELP Marketplace B2B',
    greeting: 'Prezado(a)',
    successMsg: 'Seu pré-registro no ELP Marketplace B2B foi realizado com sucesso!',
    thankYou: 'Agradecemos o interesse da',
    inPlatform: 'em participar da nossa plataforma de comercialização de commodities sustentáveis.',
    nextSteps: 'Próximos Passos',
    nextStepsText: 'Nossa equipe comercial entrará em contato com você no prazo máximo de 7 dias úteis para dar continuidade ao seu cadastro e apresentar as condições exclusivas de lançamento.',
    viewLoi: 'Carta de Intenções (LOI)',
    viewLoiDesc: 'Você pode acessar e baixar sua LOI a qualquer momento:',
    accessLoi: 'Acessar LOI Online',
    summary: 'Resumo do Registro',
    company: 'Empresa',
    countryLabel: 'País',
    type: 'Tipo',
    products: 'Produtos de Interesse',
    whyChoose: 'Por que escolher o ELP Marketplace?',
    blockchain: 'Rastreabilidade Blockchain',
    blockchainDesc: 'Garantia de origem e qualidade',
    esg: 'Certificação ESG',
    esgDesc: 'Produtos com certificação de sustentabilidade',
    global: 'Alcance Global',
    globalDesc: 'Conexão com compradores e vendedores em todo o mundo',
    prices: 'Preços Competitivos',
    pricesDesc: 'Acesso direto a produtores',
    visitSite: 'Visite nosso site',
    questions: 'Dúvidas?',
    locations: 'Sedes: Itália | Brasil | Alemanha | China',
    autoEmail: 'Este é um email automático.',
    rights: 'Todos os direitos reservados',
  },
  en: {
    subject: 'Pre-Registration Confirmed - ELP B2B Marketplace',
    greeting: 'Dear',
    successMsg: 'Your pre-registration at ELP B2B Marketplace was successful!',
    thankYou: 'We appreciate the interest from',
    inPlatform: 'in participating in our sustainable commodities trading platform.',
    nextSteps: 'Next Steps',
    nextStepsText: 'Our commercial team will contact you within 7 business days to continue your registration and present exclusive launch conditions.',
    viewLoi: 'Letter of Intent (LOI)',
    viewLoiDesc: 'You can access and download your LOI at any time:',
    accessLoi: 'Access LOI Online',
    summary: 'Registration Summary',
    company: 'Company',
    countryLabel: 'Country',
    type: 'Type',
    products: 'Products of Interest',
    whyChoose: 'Why choose ELP Marketplace?',
    blockchain: 'Blockchain Traceability',
    blockchainDesc: 'Guaranteed origin and quality',
    esg: 'ESG Certification',
    esgDesc: 'Products with sustainability certification',
    global: 'Global Reach',
    globalDesc: 'Connection with buyers and sellers worldwide',
    prices: 'Competitive Prices',
    pricesDesc: 'Direct access to producers',
    visitSite: 'Visit our website',
    questions: 'Questions?',
    locations: 'Headquarters: Italy | Brazil | Germany | China',
    autoEmail: 'This is an automated email.',
    rights: 'All rights reserved',
  },
  es: {
    subject: 'Pre-Registro Confirmado - ELP Marketplace B2B',
    greeting: 'Estimado(a)',
    successMsg: '¡Su pre-registro en ELP Marketplace B2B fue exitoso!',
    thankYou: 'Agradecemos el interés de',
    inPlatform: 'en participar en nuestra plataforma de comercialización de commodities sostenibles.',
    nextSteps: 'Próximos Pasos',
    nextStepsText: 'Nuestro equipo comercial se pondrá en contacto con usted en un plazo máximo de 7 días hábiles para continuar su registro y presentar las condiciones exclusivas de lanzamiento.',
    viewLoi: 'Carta de Intenciones (LOI)',
    viewLoiDesc: 'Puede acceder y descargar su LOI en cualquier momento:',
    accessLoi: 'Acceder a LOI Online',
    summary: 'Resumen del Registro',
    company: 'Empresa',
    countryLabel: 'País',
    type: 'Tipo',
    products: 'Productos de Interés',
    whyChoose: '¿Por qué elegir ELP Marketplace?',
    blockchain: 'Trazabilidad Blockchain',
    blockchainDesc: 'Garantía de origen y calidad',
    esg: 'Certificación ESG',
    esgDesc: 'Productos con certificación de sostenibilidad',
    global: 'Alcance Global',
    globalDesc: 'Conexión con compradores y vendedores',
    prices: 'Precios Competitivos',
    pricesDesc: 'Acceso directo a productores',
    visitSite: 'Visite nuestro sitio',
    questions: '¿Preguntas?',
    locations: 'Sedes: Italia | Brasil | Alemania | China',
    autoEmail: 'Este es un email automático.',
    rights: 'Todos los derechos reservados',
  },
  zh: {
    subject: '预注册确认 - ELP B2B市场',
    greeting: '尊敬的',
    successMsg: '您在ELP B2B市场的预注册已成功！',
    thankYou: '我们感谢',
    inPlatform: '对参与我们可持续商品交易平台的兴趣。',
    nextSteps: '后续步骤',
    nextStepsText: '我们的商务团队将在7个工作日内与您联系，继续您的注册并介绍独家发布条件。',
    viewLoi: '意向书 (LOI)',
    viewLoiDesc: '您可以随时访问和下载您的意向书：',
    accessLoi: '在线访问LOI',
    summary: '注册摘要',
    company: '公司',
    countryLabel: '国家',
    type: '类型',
    products: '感兴趣的产品',
    whyChoose: '为什么选择ELP市场？',
    blockchain: '区块链追溯',
    blockchainDesc: '来源和质量保证',
    esg: 'ESG认证',
    esgDesc: '获得可持续性认证的产品',
    global: '全球覆盖',
    globalDesc: '与全球买家和卖家建立联系',
    prices: '有竞争力的价格',
    pricesDesc: '直接接触生产商',
    visitSite: '访问我们的网站',
    questions: '有疑问？',
    locations: '总部：意大利 | 巴西 | 德国 | 中国',
    autoEmail: '这是一封自动邮件。',
    rights: '版权所有',
  }
};

function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Professional corporate email template - Clean white design with logo
function buildCorporateEmail(options: {
  title: string;
  content: string;
  lang: string;
}): string {
  const { title, content, lang } = options;
  const t = emailTranslations[lang as keyof typeof emailTranslations] || emailTranslations.en;
  
  return `
<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ELP Green Technology</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: ${COLORS.white}; max-width: 600px; width: 100%;">
          <!-- Header with Logo -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; background-color: ${COLORS.white}; border-bottom: 1px solid ${COLORS.border};">
              <img src="${LOGO_URL}" alt="ELP Green Technology" style="height: 60px; max-width: 200px;" />
            </td>
          </tr>
          
          <!-- Title -->
          <tr>
            <td style="padding: 30px 40px 20px; text-align: center; background-color: ${COLORS.white};">
              <h1 style="margin: 0; color: ${COLORS.primary}; font-size: 22px; font-weight: 600; line-height: 1.3;">
                ${title}
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 10px 40px 30px; background-color: ${COLORS.white};">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 25px 40px; background-color: ${COLORS.white}; border-top: 1px solid ${COLORS.border}; text-align: center;">
              <p style="margin: 0 0 10px; color: ${COLORS.primary}; font-size: 14px; font-weight: 600;">
                ELP Green Technology
              </p>
              <p style="margin: 0 0 8px; color: ${COLORS.muted}; font-size: 12px;">
                ELP Alliance S/A
              </p>
              <p style="margin: 0 0 15px; color: ${COLORS.light}; font-size: 12px;">
                <a href="mailto:info@elpgreen.com" style="color: ${COLORS.muted}; text-decoration: none;">info@elpgreen.com</a>
                &nbsp;|&nbsp;
                <a href="https://www.elpgreen.com" style="color: ${COLORS.muted}; text-decoration: none;">www.elpgreen.com</a>
              </p>
              <p style="margin: 0; color: ${COLORS.light}; font-size: 11px;">
                © ${new Date().getFullYear()} ${t.rights}
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
}

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
    const data: MarketplaceEmailRequest = await req.json();
    const lang = (data.language || 'pt') as keyof typeof emailTranslations;
    const t = emailTranslations[lang] || emailTranslations.pt;
    const products = productNames[lang] || productNames.pt;
    const companyTypes = companyTypeNames[lang] || companyTypeNames.pt;

    console.log("Received marketplace registration:", { 
      companyName: data.companyName, 
      email: data.email, 
      products: data.productsInterest,
      language: lang
    });

    // Create LOI document with unique token
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const loiToken = generateToken();
    
    const { data: loiDoc, error: loiError } = await supabase
      .from('loi_documents')
      .insert({
        token: loiToken,
        registration_id: data.registrationId || null,
        company_name: data.companyName,
        contact_name: data.contactName,
        email: data.email,
        country: data.country,
        company_type: data.companyType,
        products_interest: data.productsInterest,
        estimated_volume: data.estimatedVolume || null,
        message: data.message || null,
        language: lang
      })
      .select()
      .single();

    if (loiError) {
      console.error("Error creating LOI document:", loiError);
    }

    // Generate LOI URL
    const baseUrl = "https://www.elpgreen.com";
    const loiUrl = `${baseUrl}/loi/${loiToken}`;

    const productsList = data.productsInterest
      .map(p => products[p] || p)
      .join(', ');

    // ===== NOTIFICATION EMAIL TO ELP TEAM =====
    const notificationContent = `
      <p style="margin: 0 0 15px; color: ${COLORS.text}; font-size: 15px;">
        <strong>Novo pré-registro recebido no Marketplace B2B</strong>
      </p>
      
      <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid ${COLORS.border}; border-radius: 6px; margin: 20px 0;">
        <tr>
          <td style="padding: 12px 16px; color: ${COLORS.muted}; font-size: 13px; border-bottom: 1px solid ${COLORS.border}; width: 35%; background-color: #fafafa;">
            Empresa
          </td>
          <td style="padding: 12px 16px; color: ${COLORS.text}; font-size: 14px; font-weight: 500; border-bottom: 1px solid ${COLORS.border};">
            ${data.companyName}
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; color: ${COLORS.muted}; font-size: 13px; border-bottom: 1px solid ${COLORS.border}; background-color: #fafafa;">
            Contato
          </td>
          <td style="padding: 12px 16px; color: ${COLORS.text}; font-size: 14px; border-bottom: 1px solid ${COLORS.border};">
            ${data.contactName}
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; color: ${COLORS.muted}; font-size: 13px; border-bottom: 1px solid ${COLORS.border}; background-color: #fafafa;">
            E-mail
          </td>
          <td style="padding: 12px 16px; color: ${COLORS.text}; font-size: 14px; border-bottom: 1px solid ${COLORS.border};">
            <a href="mailto:${data.email}" style="color: ${COLORS.primary};">${data.email}</a>
          </td>
        </tr>
        ${data.phone ? `
        <tr>
          <td style="padding: 12px 16px; color: ${COLORS.muted}; font-size: 13px; border-bottom: 1px solid ${COLORS.border}; background-color: #fafafa;">
            Telefone
          </td>
          <td style="padding: 12px 16px; color: ${COLORS.text}; font-size: 14px; border-bottom: 1px solid ${COLORS.border};">
            ${data.phone}
          </td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 12px 16px; color: ${COLORS.muted}; font-size: 13px; border-bottom: 1px solid ${COLORS.border}; background-color: #fafafa;">
            País
          </td>
          <td style="padding: 12px 16px; color: ${COLORS.text}; font-size: 14px; border-bottom: 1px solid ${COLORS.border};">
            ${data.country}
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; color: ${COLORS.muted}; font-size: 13px; border-bottom: 1px solid ${COLORS.border}; background-color: #fafafa;">
            Tipo
          </td>
          <td style="padding: 12px 16px; color: ${COLORS.text}; font-size: 14px; border-bottom: 1px solid ${COLORS.border};">
            ${companyTypes[data.companyType] || data.companyType}
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; color: ${COLORS.muted}; font-size: 13px; border-bottom: 1px solid ${COLORS.border}; background-color: #fafafa;">
            Produtos
          </td>
          <td style="padding: 12px 16px; color: ${COLORS.text}; font-size: 14px; border-bottom: 1px solid ${COLORS.border};">
            ${productsList}
          </td>
        </tr>
        ${data.estimatedVolume ? `
        <tr>
          <td style="padding: 12px 16px; color: ${COLORS.muted}; font-size: 13px; border-bottom: 1px solid ${COLORS.border}; background-color: #fafafa;">
            Volume Estimado
          </td>
          <td style="padding: 12px 16px; color: ${COLORS.text}; font-size: 14px; border-bottom: 1px solid ${COLORS.border};">
            ${data.estimatedVolume} ton/mês
          </td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 12px 16px; color: ${COLORS.muted}; font-size: 13px; background-color: #fafafa;">
            LOI Link
          </td>
          <td style="padding: 12px 16px; color: ${COLORS.text}; font-size: 14px;">
            <a href="${loiUrl}" style="color: ${COLORS.primary};">${loiUrl}</a>
          </td>
        </tr>
      </table>
      
      ${data.message ? `
      <div style="background-color: #fafafa; border-left: 3px solid ${COLORS.primary}; padding: 16px 20px; margin: 20px 0; border-radius: 0 6px 6px 0;">
        <p style="margin: 0 0 8px; color: ${COLORS.muted}; font-size: 12px; font-weight: 600;">MENSAGEM:</p>
        <p style="margin: 0; color: ${COLORS.text}; font-size: 14px; line-height: 1.6;">${data.message.replace(/\n/g, '<br>')}</p>
      </div>
      ` : ''}
      
      <div style="background-color: #e8f5e9; border-left: 3px solid ${COLORS.success}; padding: 12px 16px; margin: 20px 0; border-radius: 0 4px 4px 0;">
        <p style="margin: 0; color: ${COLORS.success}; font-size: 13px; line-height: 1.5;">
          <strong>Ação Recomendada:</strong> Entre em contato em até 48 horas para qualificação.
        </p>
      </div>
    `;

    const notificationEmail = await sendEmail(
      ["elpenergia@gmail.com"],
      ["info@elpgreen.com"],
      `Novo Pré-Registro Marketplace: ${data.companyName}`,
      buildCorporateEmail({
        title: 'Novo Pré-Registro Marketplace B2B',
        content: notificationContent,
        lang: 'pt'
      })
    );

    console.log("Notification email sent:", notificationEmail);

    // ===== AUTO-RESPONSE EMAIL TO CUSTOMER =====
    const customerContent = `
      <p style="margin: 0 0 15px; color: ${COLORS.text}; font-size: 15px;">
        ${t.greeting} <strong>${data.contactName}</strong>,
      </p>
      
      <p style="margin: 0 0 15px; color: ${COLORS.text}; font-size: 14px; line-height: 1.6;">
        ${t.successMsg}
      </p>
      
      <p style="margin: 0 0 20px; color: ${COLORS.text}; font-size: 14px; line-height: 1.6;">
        ${t.thankYou} <strong>${data.companyName}</strong> ${t.inPlatform}
      </p>
      
      <!-- Next Steps -->
      <div style="background-color: #e8f5e9; border-left: 3px solid ${COLORS.success}; padding: 12px 16px; margin: 20px 0; border-radius: 0 4px 4px 0;">
        <p style="margin: 0; color: ${COLORS.success}; font-size: 13px; line-height: 1.5;">
          <strong>${t.nextSteps}:</strong> ${t.nextStepsText}
        </p>
      </div>
      
      <!-- LOI Section -->
      <div style="text-align: center; margin: 25px 0; padding: 20px; background-color: #fafafa; border-radius: 6px;">
        <p style="margin: 0 0 10px; color: ${COLORS.primary}; font-size: 14px; font-weight: 600;">
          ${t.viewLoi}
        </p>
        <p style="margin: 0 0 15px; color: ${COLORS.muted}; font-size: 13px;">
          ${t.viewLoiDesc}
        </p>
        <a href="${loiUrl}" 
           style="display: inline-block; 
                  background-color: ${COLORS.primary}; 
                  color: ${COLORS.white}; 
                  text-decoration: none; 
                  padding: 14px 32px; 
                  border-radius: 6px; 
                  font-weight: 600; 
                  font-size: 14px;">
          ${t.accessLoi}
        </a>
      </div>
      
      <!-- Registration Summary -->
      <p style="margin: 20px 0 10px; color: ${COLORS.primary}; font-size: 14px; font-weight: 600;">
        ${t.summary}
      </p>
      
      <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid ${COLORS.border}; border-radius: 6px; margin: 10px 0 20px;">
        <tr>
          <td style="padding: 12px 16px; color: ${COLORS.muted}; font-size: 13px; border-bottom: 1px solid ${COLORS.border}; width: 35%; background-color: #fafafa;">
            ${t.company}
          </td>
          <td style="padding: 12px 16px; color: ${COLORS.text}; font-size: 14px; font-weight: 500; border-bottom: 1px solid ${COLORS.border};">
            ${data.companyName}
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; color: ${COLORS.muted}; font-size: 13px; border-bottom: 1px solid ${COLORS.border}; background-color: #fafafa;">
            ${t.countryLabel}
          </td>
          <td style="padding: 12px 16px; color: ${COLORS.text}; font-size: 14px; border-bottom: 1px solid ${COLORS.border};">
            ${data.country}
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; color: ${COLORS.muted}; font-size: 13px; border-bottom: 1px solid ${COLORS.border}; background-color: #fafafa;">
            ${t.type}
          </td>
          <td style="padding: 12px 16px; color: ${COLORS.text}; font-size: 14px; border-bottom: 1px solid ${COLORS.border};">
            ${companyTypes[data.companyType] || data.companyType}
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; color: ${COLORS.muted}; font-size: 13px; background-color: #fafafa;">
            ${t.products}
          </td>
          <td style="padding: 12px 16px; color: ${COLORS.text}; font-size: 14px;">
            ${productsList}
          </td>
        </tr>
      </table>
      
      <!-- Why Choose Section -->
      <p style="margin: 20px 0 15px; color: ${COLORS.primary}; font-size: 14px; font-weight: 600;">
        ${t.whyChoose}
      </p>
      
      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 20px;">
        <tr>
          <td style="padding: 8px 0; color: ${COLORS.text}; font-size: 13px; line-height: 1.5;">
            ✓ <strong>${t.blockchain}</strong> — ${t.blockchainDesc}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: ${COLORS.text}; font-size: 13px; line-height: 1.5;">
            ✓ <strong>${t.esg}</strong> — ${t.esgDesc}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: ${COLORS.text}; font-size: 13px; line-height: 1.5;">
            ✓ <strong>${t.global}</strong> — ${t.globalDesc}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: ${COLORS.text}; font-size: 13px; line-height: 1.5;">
            ✓ <strong>${t.prices}</strong> — ${t.pricesDesc}
          </td>
        </tr>
      </table>
      
      <!-- Visit Website Button -->
      <div style="text-align: center; margin: 25px 0;">
        <a href="https://www.elpgreen.com" 
           style="display: inline-block; 
                  background-color: ${COLORS.white}; 
                  color: ${COLORS.primary}; 
                  text-decoration: none; 
                  padding: 12px 28px; 
                  border-radius: 6px; 
                  font-weight: 600; 
                  font-size: 14px;
                  border: 2px solid ${COLORS.primary};">
          ${t.visitSite}
        </a>
      </div>
      
      <!-- Contact Info -->
      <div style="text-align: center; padding-top: 15px; border-top: 1px solid ${COLORS.border};">
        <p style="margin: 0 0 5px; color: ${COLORS.text}; font-size: 14px; font-weight: 500;">
          ${t.questions}
        </p>
        <p style="margin: 0; color: ${COLORS.muted}; font-size: 13px;">
          info@elpgreen.com | www.elpgreen.com
        </p>
        <p style="margin: 10px 0 0; color: ${COLORS.light}; font-size: 11px;">
          ${t.locations}
        </p>
        <p style="margin: 5px 0 0; color: ${COLORS.light}; font-size: 11px;">
          ${t.autoEmail}
        </p>
      </div>
    `;

    const autoResponseEmail = await sendEmail(
      [data.email],
      null,
      t.subject,
      buildCorporateEmail({
        title: t.subject,
        content: customerContent,
        lang
      })
    );

    console.log("Auto-response email sent:", autoResponseEmail);

    return new Response(
      JSON.stringify({ 
        success: true, 
        notification: notificationEmail, 
        autoResponse: autoResponseEmail,
        loiToken: loiToken,
        loiUrl: loiUrl
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
    console.error("Error in send-marketplace-email function:", error);
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
