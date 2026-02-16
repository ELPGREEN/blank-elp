/**
 * Corporate Email Template - ELP Green Technology
 * Design: Clean, professional, white background, navy blue branding (#1a2744)
 * Logo prominently displayed, no colored bands, minimal styling
 */

// ELP Brand Colors
export const colors = {
  primary: '#1a2744',      // Navy Blue (from logo)
  secondary: '#2a3a5c',    // Lighter Navy
  accent: '#3b5998',       // Accent Blue
  text: '#333333',         // Dark text
  muted: '#666666',        // Secondary text
  light: '#999999',        // Light text
  white: '#ffffff',
  background: '#ffffff',
  border: '#e0e0e0',
  success: '#2e7d32',      // Green for success
  warning: '#f57c00',      // Orange for warnings
};

// Logo URL (hosted on production domain)
const LOGO_URL = 'https://www.elpgreen.com/logo-elp-email.png';

// Base email wrapper - clean white design
export const emailWrapper = (content: string, lang: string = 'pt') => `
<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ELP Green Technology</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: ${colors.white}; max-width: 600px; width: 100%;">
          ${content}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// Header with logo - clean, professional
export const emailHeader = () => `
<tr>
  <td style="padding: 30px 40px; text-align: center; background-color: ${colors.white}; border-bottom: 1px solid ${colors.border};">
    <img src="${LOGO_URL}" alt="ELP Green Technology" style="height: 60px; max-width: 200px;" />
  </td>
</tr>
`;

// Compact header for internal notifications
export const emailHeaderCompact = () => `
<tr>
  <td style="padding: 20px 30px; text-align: left; background-color: ${colors.white}; border-bottom: 1px solid ${colors.border};">
    <img src="${LOGO_URL}" alt="ELP" style="height: 40px;" />
  </td>
</tr>
`;

// Title section
export const emailTitle = (title: string, subtitle?: string) => `
<tr>
  <td style="padding: 30px 40px 20px; text-align: center; background-color: ${colors.white};">
    <h1 style="margin: 0; color: ${colors.primary}; font-size: 24px; font-weight: 600; line-height: 1.3;">
      ${title}
    </h1>
    ${subtitle ? `<p style="margin: 10px 0 0; color: ${colors.muted}; font-size: 14px; line-height: 1.5;">${subtitle}</p>` : ''}
  </td>
</tr>
`;

// Content section
export const emailContent = (html: string) => `
<tr>
  <td style="padding: 10px 40px 30px; background-color: ${colors.white};">
    ${html}
  </td>
</tr>
`;

// Info box - for displaying data
export const emailInfoBox = (items: Array<{ label: string; value: string }>) => `
<table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid ${colors.border}; border-radius: 6px; margin: 20px 0;">
  ${items.map((item, index) => `
    <tr>
      <td style="padding: 12px 16px; color: ${colors.muted}; font-size: 13px; border-bottom: ${index < items.length - 1 ? `1px solid ${colors.border}` : 'none'}; width: 40%; background-color: #fafafa;">
        ${item.label}
      </td>
      <td style="padding: 12px 16px; color: ${colors.text}; font-size: 14px; font-weight: 500; border-bottom: ${index < items.length - 1 ? `1px solid ${colors.border}` : 'none'};">
        ${item.value}
      </td>
    </tr>
  `).join('')}
</table>
`;

// Message box
export const emailMessageBox = (message: string) => `
<div style="background-color: #fafafa; border-left: 3px solid ${colors.primary}; padding: 16px 20px; margin: 20px 0; border-radius: 0 6px 6px 0;">
  <p style="margin: 0; color: ${colors.text}; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
</div>
`;

// Notice box (for legal notices, warnings, etc.)
export const emailNotice = (text: string, type: 'info' | 'success' | 'warning' = 'info') => {
  const bgColors = {
    info: '#f0f4f8',
    success: '#e8f5e9',
    warning: '#fff3e0',
  };
  const borderColors = {
    info: colors.primary,
    success: colors.success,
    warning: colors.warning,
  };
  const textColors = {
    info: colors.primary,
    success: colors.success,
    warning: '#e65100',
  };
  
  return `
  <div style="background-color: ${bgColors[type]}; border-left: 3px solid ${borderColors[type]}; padding: 12px 16px; margin: 20px 0; border-radius: 0 4px 4px 0;">
    <p style="margin: 0; color: ${textColors[type]}; font-size: 13px; line-height: 1.5;">${text}</p>
  </div>
  `;
};

// Primary button
export const emailButton = (text: string, url: string, variant: 'primary' | 'secondary' = 'primary') => `
<div style="text-align: center; margin: 25px 0;">
  <a href="${url}" 
     style="display: inline-block; 
            background-color: ${variant === 'primary' ? colors.primary : colors.white}; 
            color: ${variant === 'primary' ? colors.white : colors.primary}; 
            text-decoration: none; 
            padding: 14px 32px; 
            border-radius: 6px; 
            font-weight: 600; 
            font-size: 14px;
            border: ${variant === 'secondary' ? `2px solid ${colors.primary}` : 'none'};">
    ${text}
  </a>
</div>
`;

// Footer - clean and professional with corporate signature style
export const emailFooter = (lang: string = 'pt') => {
  const texts = {
    pt: {
      company: 'ELP Alliance S/A',
      brand: 'ELP Green Technology',
      rights: 'Todos os direitos reservados',
      slogan: 'Transformando resíduos em recursos',
      locations: 'São Paulo, Brasil | Milan, Itália',
    },
    en: {
      company: 'ELP Alliance S/A',
      brand: 'ELP Green Technology',
      rights: 'All rights reserved',
      slogan: 'Transforming waste into resources',
      locations: 'São Paulo, Brazil | Milan, Italy',
    },
    es: {
      company: 'ELP Alliance S/A',
      brand: 'ELP Green Technology',
      rights: 'Todos los derechos reservados',
      slogan: 'Transformando residuos en recursos',
      locations: 'São Paulo, Brasil | Milán, Italia',
    },
    it: {
      company: 'ELP Alliance S/A',
      brand: 'ELP Green Technology',
      rights: 'Tutti i diritti riservati',
      slogan: 'Trasformare i rifiuti in risorse',
      locations: 'São Paulo, Brasile | Milano, Italia',
    },
    zh: {
      company: 'ELP Alliance S/A',
      brand: 'ELP绿色技术',
      rights: '版权所有',
      slogan: '将废物转化为资源',
      locations: '圣保罗, 巴西 | 米兰, 意大利',
    },
  };

  const t = texts[lang as keyof typeof texts] || texts.en;

  return `
<tr>
  <td style="padding: 30px 40px; background-color: ${colors.white}; border-top: 1px solid ${colors.border};">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="text-align: center;">
          <p style="margin: 0 0 8px; color: ${colors.primary}; font-size: 15px; font-weight: 700;">
            ${t.brand}
          </p>
          <p style="margin: 0 0 12px; color: ${colors.muted}; font-size: 13px; font-style: italic;">
            ${t.slogan}
          </p>
          
          <table cellpadding="0" cellspacing="0" style="margin: 0 auto 15px;">
            <tr>
              <td style="padding: 0 12px;">
                <a href="https://www.elpgreen.com" style="color: ${colors.primary}; font-size: 12px; text-decoration: none;">🌐 www.elpgreen.com</a>
              </td>
              <td style="padding: 0 12px; border-left: 1px solid ${colors.border};">
                <a href="mailto:info@elpgreen.com" style="color: ${colors.primary}; font-size: 12px; text-decoration: none;">✉️ info@elpgreen.com</a>
              </td>
              <td style="padding: 0 12px; border-left: 1px solid ${colors.border};">
                <span style="color: ${colors.muted}; font-size: 12px;">📞 +39 350 102 1359</span>
              </td>
            </tr>
          </table>
          
          <p style="margin: 0 0 5px; color: ${colors.light}; font-size: 11px;">
            ${t.company} | ${t.locations}
          </p>
          <p style="margin: 0; color: #cccccc; font-size: 10px;">
            © ${new Date().getFullYear()} ${t.rights}
          </p>
        </td>
      </tr>
    </table>
  </td>
</tr>
`;
};

// Divider
export const emailDivider = () => `
<tr>
  <td style="padding: 0 40px;">
    <hr style="border: none; border-top: 1px solid ${colors.border}; margin: 0;" />
  </td>
</tr>
`;

// Status badge
export const emailBadge = (text: string, type: 'success' | 'warning' | 'info' | 'default' = 'default') => {
  const bgColors = {
    success: colors.success,
    warning: colors.warning,
    info: colors.primary,
    default: colors.muted,
  };
  
  return `<span style="display: inline-block; background-color: ${bgColors[type]}; color: ${colors.white}; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase;">${text}</span>`;
};

// Greeting
export const emailGreeting = (name: string, lang: string = 'pt') => {
  const greetings = {
    pt: 'Prezado(a)',
    en: 'Dear',
    es: 'Estimado(a)',
    it: 'Gentile',
    zh: '尊敬的',
  };
  
  const greeting = greetings[lang as keyof typeof greetings] || greetings.en;
  
  return `<p style="margin: 0 0 15px; color: ${colors.text}; font-size: 15px;">${greeting} <strong>${name}</strong>,</p>`;
};

// Paragraph
export const emailParagraph = (text: string) => `
<p style="margin: 0 0 15px; color: ${colors.text}; font-size: 14px; line-height: 1.6;">${text}</p>
`;

// Build complete email
export const buildCorporateEmail = (options: {
  lang?: string;
  title: string;
  subtitle?: string;
  greeting?: { name: string };
  paragraphs?: string[];
  infoItems?: Array<{ label: string; value: string }>;
  message?: string;
  notice?: { text: string; type?: 'info' | 'success' | 'warning' };
  button?: { text: string; url: string; variant?: 'primary' | 'secondary' };
  secondaryButton?: { text: string; url: string };
}) => {
  const lang = options.lang || 'pt';
  
  let content = emailHeader();
  content += emailTitle(options.title, options.subtitle);
  
  let bodyContent = '';
  
  if (options.greeting) {
    bodyContent += emailGreeting(options.greeting.name, lang);
  }
  
  if (options.paragraphs) {
    options.paragraphs.forEach(p => {
      bodyContent += emailParagraph(p);
    });
  }
  
  if (options.infoItems && options.infoItems.length > 0) {
    bodyContent += emailInfoBox(options.infoItems);
  }
  
  if (options.message) {
    bodyContent += emailMessageBox(options.message);
  }
  
  if (options.notice) {
    bodyContent += emailNotice(options.notice.text, options.notice.type);
  }
  
  if (options.button) {
    bodyContent += emailButton(options.button.text, options.button.url, options.button.variant);
  }
  
  if (options.secondaryButton) {
    bodyContent += emailButton(options.secondaryButton.text, options.secondaryButton.url, 'secondary');
  }
  
  content += emailContent(bodyContent);
  content += emailFooter(lang);
  
  return emailWrapper(content, lang);
};
