import { jsPDF } from 'jspdf';

interface LOIData {
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  country: string;
  companyType: string;
  productsInterest: string[];
  estimatedVolume?: string;
  message?: string;
  language?: 'pt' | 'en' | 'es' | 'zh' | 'it';
}

interface LOITranslations {
  title: string;
  date: string;
  subject: string;
  greeting: string;
  intro: string;
  objectTitle: string;
  objectText: string;
  productsTitle: string;
  volumeTitle: string;
  companyInfoTitle: string;
  companyTypeBuyer: string;
  companyTypeSeller: string;
  companyTypeBoth: string;
  notesTitle: string;
  nextSteps: string[];
  confidentiality: string;
  validity: string;
  closing: string;
  signature: string;
  contactTitle: string;
}

const translations: Record<string, LOITranslations> = {
  pt: {
    title: 'CARTA DE INTENÇÕES NÃO VINCULANTE',
    date: 'Data',
    subject: 'Assunto: Manifestação de Interesse em Parceria Comercial – Marketplace B2B ELP Green Technology',
    greeting: 'Prezado(a) Senhor(a),',
    intro: 'A ELP Alliance S/A – ELP Green Technology ("Empresa" ou "Vendedora"), líder em tecnologias sustentáveis para reciclagem de pneus OTR e comuns, devulcanização de borracha, pirólise de resíduos, produção de materiais circulares e equipamentos de mineração eco-friendly, expressa por meio desta Carta de Intenções ("LOI") seu interesse em estabelecer uma relação comercial com a empresa abaixo identificada.',
    objectTitle: '1. Objeto da Manifestação',
    objectText: 'Esta LOI visa alinhar expectativas e iniciar negociações formais para fornecimento/aquisição de commodities sustentáveis através do Marketplace B2B da ELP Green Technology, com foco em tecnologia proprietária, cadeia global de suprimentos e impacto ESG.',
    productsTitle: '2. Produtos de Interesse',
    volumeTitle: '3. Volume Estimado',
    companyInfoTitle: '4. Informações da Empresa Interessada',
    companyTypeBuyer: 'Comprador',
    companyTypeSeller: 'Vendedor/Fornecedor',
    companyTypeBoth: 'Comprador e Vendedor',
    notesTitle: '5. Observações Adicionais',
    nextSteps: [
      'Análise de due diligence comercial (60-90 dias)',
      'Validação de capacidade/demanda de fornecimento',
      'Negociação de termos comerciais específicos',
      'Formalização de contrato definitivo (SPA ou similar)'
    ],
    confidentiality: '7. Confidencialidade (cláusula vinculante)\n\nAs partes manterão sigilo sobre todas as informações trocadas, incluindo especificações técnicas, volumes, preços e dados comerciais. Referência a NDA a ser assinado, se necessário.',
    validity: '8. Prazo de Validade\n\nEsta LOI é válida por 60 (sessenta) dias a contar da data de emissão, prorrogável por mútuo acordo.',
    closing: 'Esta LOI é não vinculante, exceto pelas cláusulas de confidencialidade e boa-fé. Obrigações definitivas surgirão apenas do contrato final.\n\nAguardamos manifestação de interesse para prosseguir com cronograma de negociações.',
    signature: 'Atenciosamente,',
    contactTitle: 'Contato Principal'
  },
  en: {
    title: 'NON-BINDING LETTER OF INTENT',
    date: 'Date',
    subject: 'Subject: Expression of Interest in Commercial Partnership – ELP Green Technology B2B Marketplace',
    greeting: 'Dear Sir/Madam,',
    intro: 'ELP Alliance S/A – ELP Green Technology ("Company" or "Seller"), a leader in sustainable technologies for OTR and regular tire recycling, rubber devulcanization, waste pyrolysis, circular materials production, and eco-friendly mining equipment, expresses through this Letter of Intent ("LOI") its interest in establishing a commercial relationship with the company identified below.',
    objectTitle: '1. Purpose of Expression',
    objectText: 'This LOI aims to align expectations and initiate formal negotiations for the supply/acquisition of sustainable commodities through the ELP Green Technology B2B Marketplace, focusing on proprietary technology, global supply chain, and ESG impact.',
    productsTitle: '2. Products of Interest',
    volumeTitle: '3. Estimated Volume',
    companyInfoTitle: '4. Interested Company Information',
    companyTypeBuyer: 'Buyer',
    companyTypeSeller: 'Seller/Supplier',
    companyTypeBoth: 'Buyer and Seller',
    notesTitle: '5. Additional Notes',
    nextSteps: [
      'Commercial due diligence analysis (60-90 days)',
      'Supply capacity/demand validation',
      'Negotiation of specific commercial terms',
      'Formalization of definitive contract (SPA or similar)'
    ],
    confidentiality: '7. Confidentiality (binding clause)\n\nThe parties shall maintain confidentiality regarding all information exchanged, including technical specifications, volumes, prices, and commercial data. Reference to NDA to be signed, if necessary.',
    validity: '8. Validity Period\n\nThis LOI is valid for 60 (sixty) days from the date of issuance, extendable by mutual agreement.',
    closing: 'This LOI is non-binding, except for the confidentiality and good faith clauses. Definitive obligations will arise only from the final contract.\n\nWe await your expression of interest to proceed with the negotiation schedule.',
    signature: 'Sincerely,',
    contactTitle: 'Main Contact'
  },
  es: {
    title: 'CARTA DE INTENCIONES NO VINCULANTE',
    date: 'Fecha',
    subject: 'Asunto: Manifestación de Interés en Asociación Comercial – Marketplace B2B ELP Green Technology',
    greeting: 'Estimado(a) Señor(a),',
    intro: 'ELP Alliance S/A – ELP Green Technology ("Empresa" o "Vendedora"), líder en tecnologías sostenibles para reciclaje de neumáticos OTR y comunes, desvulcanización de caucho, pirólisis de residuos, producción de materiales circulares y equipos de minería ecológicos, expresa mediante esta Carta de Intenciones ("LOI") su interés en establecer una relación comercial con la empresa identificada a continuación.',
    objectTitle: '1. Objeto de la Manifestación',
    objectText: 'Esta LOI tiene como objetivo alinear expectativas e iniciar negociaciones formales para el suministro/adquisición de commodities sostenibles a través del Marketplace B2B de ELP Green Technology, con enfoque en tecnología propietaria, cadena de suministro global e impacto ESG.',
    productsTitle: '2. Productos de Interés',
    volumeTitle: '3. Volumen Estimado',
    companyInfoTitle: '4. Información de la Empresa Interesada',
    companyTypeBuyer: 'Comprador',
    companyTypeSeller: 'Vendedor/Proveedor',
    companyTypeBoth: 'Comprador y Vendedor',
    notesTitle: '5. Notas Adicionales',
    nextSteps: [
      'Análisis de due diligence comercial (60-90 días)',
      'Validación de capacidad/demanda de suministro',
      'Negociación de términos comerciales específicos',
      'Formalización de contrato definitivo (SPA o similar)'
    ],
    confidentiality: '7. Confidencialidad (cláusula vinculante)\n\nLas partes mantendrán la confidencialidad sobre toda la información intercambiada, incluyendo especificaciones técnicas, volúmenes, precios y datos comerciales. Referencia a NDA a firmar, si es necesario.',
    validity: '8. Plazo de Validez\n\nEsta LOI es válida por 60 (sesenta) días a partir de la fecha de emisión, prorrogable por mutuo acuerdo.',
    closing: 'Esta LOI es no vinculante, excepto por las cláusulas de confidencialidad y buena fe. Las obligaciones definitivas surgirán únicamente del contrato final.\n\nAguardamos su manifestación de interés para proceder con el cronograma de negociaciones.',
    signature: 'Atentamente,',
    contactTitle: 'Contacto Principal'
  },
  zh: {
    title: '非约束性意向书',
    date: '日期',
    subject: '主题：商业合作意向 – ELP绿色科技B2B市场',
    greeting: '尊敬的先生/女士：',
    intro: 'ELP Alliance S/A – ELP绿色科技（"公司"或"卖方"），作为OTR和普通轮胎回收、橡胶脱硫、废物热解、循环材料生产和环保采矿设备可持续技术的领导者，通过此意向书（"LOI"）表达其与以下确定的公司建立商业关系的意向。',
    objectTitle: '1. 意向目的',
    objectText: '本意向书旨在协调预期并启动正式谈判，通过ELP绿色科技B2B市场供应/采购可持续商品，重点关注专有技术、全球供应链和ESG影响。',
    productsTitle: '2. 感兴趣的产品',
    volumeTitle: '3. 预计数量',
    companyInfoTitle: '4. 意向公司信息',
    companyTypeBuyer: '采购商',
    companyTypeSeller: '供应商',
    companyTypeBoth: '采购商和供应商',
    notesTitle: '5. 附加说明',
    nextSteps: [
      '商业尽职调查分析（60-90天）',
      '供应能力/需求验证',
      '具体商业条款谈判',
      '最终合同正式签订（SPA或类似协议）'
    ],
    confidentiality: '7. 保密条款（约束性条款）\n\n双方应对所有交换的信息保密，包括技术规格、数量、价格和商业数据。如有必要，参照待签署的保密协议。',
    validity: '8. 有效期\n\n本意向书自签发之日起60（六十）天内有效，可经双方协商延期。',
    closing: '本意向书为非约束性，但保密和诚信条款除外。最终义务仅从最终合同中产生。\n\n我们期待您的意向表达，以继续进行谈判日程。',
    signature: '此致敬礼，',
    contactTitle: '主要联系人'
  },
  it: {
    title: 'LETTERA DI INTENTI NON VINCOLANTE',
    date: 'Data',
    subject: 'Oggetto: Manifestazione di Interesse in Partnership Commerciale – Marketplace B2B ELP Green Technology',
    greeting: 'Gentile Signore/Signora,',
    intro: 'ELP Alliance S/A – ELP Green Technology ("Società" o "Venditrice"), leader nelle tecnologie sostenibili per il riciclaggio di pneumatici OTR e comuni, devulcanizzazione della gomma, pirolisi dei rifiuti, produzione di materiali circolari e attrezzature minerarie eco-compatibili, esprime mediante questa Lettera di Intenti ("LOI") il suo interesse a stabilire una relazione commerciale con la società identificata di seguito.',
    objectTitle: '1. Oggetto della Manifestazione',
    objectText: 'Questa LOI mira ad allineare le aspettative e avviare negoziazioni formali per la fornitura/acquisizione di commodities sostenibili attraverso il Marketplace B2B di ELP Green Technology, con focus su tecnologia proprietaria, catena di fornitura globale e impatto ESG.',
    productsTitle: '2. Prodotti di Interesse',
    volumeTitle: '3. Volume Stimato',
    companyInfoTitle: '4. Informazioni Azienda Interessata',
    companyTypeBuyer: 'Acquirente',
    companyTypeSeller: 'Venditore/Fornitore',
    companyTypeBoth: 'Acquirente e Venditore',
    notesTitle: '5. Note Aggiuntive',
    nextSteps: [
      'Analisi due diligence commerciale (60-90 giorni)',
      'Validazione capacità/domanda di fornitura',
      'Negoziazione termini commerciali specifici',
      'Formalizzazione contratto definitivo (SPA o simile)'
    ],
    confidentiality: '7. Riservatezza (clausola vincolante)\n\nLe parti manterranno la riservatezza su tutte le informazioni scambiate, incluse specifiche tecniche, volumi, prezzi e dati commerciali. Riferimento a NDA da firmare, se necessario.',
    validity: '8. Periodo di Validità\n\nQuesta LOI è valida per 60 (sessanta) giorni dalla data di emissione, prorogabile di comune accordo.',
    closing: 'Questa LOI non è vincolante, ad eccezione delle clausole di riservatezza e buona fede. Gli obblighi definitivi sorgeranno solo dal contratto finale.\n\nAttendendo la Sua manifestazione di interesse per procedere con il calendario delle negoziazioni.',
    signature: 'Cordiali saluti,',
    contactTitle: 'Contatto Principale'
  }
};

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
  },
  it: {
    'rcb': 'Carbon Black Recuperato (rCB)',
    'pyrolytic-oil': 'Olio Pirolitico',
    'steel-wire': 'Acciaio Verde Riciclato',
    'rubber-blocks': 'Blocchi di Gomma Recuperata',
    'rubber-granules': 'Granuli di Gomma',
    'reclaimed-rubber': 'Gomma Rigenerata'
  }
};

export function generateLOIPDF(data: LOIData): void {
  const lang = data.language || 'pt';
  const t = translations[lang] || translations.pt;
  const products = productNames[lang] || productNames.pt;
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let y = 20;
  
  // Helper to add text with word wrap
  const addText = (text: string, fontSize: number = 10, isBold: boolean = false) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    const lines = doc.splitTextToSize(text, contentWidth);
    
    // Check if we need a new page
    if (y + (lines.length * fontSize * 0.4) > 280) {
      doc.addPage();
      y = 20;
    }
    
    doc.text(lines, margin, y);
    y += lines.length * fontSize * 0.4 + 4;
  };
  
  // Header
  doc.setFillColor(26, 43, 60); // Primary dark color
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('ELP ALLIANCE S/A', margin, 18);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('ELP Green Technology', margin, 26);
  doc.setFontSize(8);
  doc.text('www.elpgreen.com | info@elpgreen.com', margin, 34);
  
  y = 55;
  doc.setTextColor(0, 0, 0);
  
  // Title
  addText(t.title, 16, true);
  y += 5;
  
  // Date
  const today = new Date();
  const localeMap: Record<string, string> = { pt: 'pt-BR', es: 'es-ES', zh: 'zh-CN', it: 'it-IT', en: 'en-US' };
  const dateStr = today.toLocaleDateString(localeMap[lang] || 'en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  addText(`${t.date}: ${dateStr}`, 10);
  y += 3;
  
  // Subject
  addText(t.subject, 10, true);
  y += 5;
  
  // Greeting
  addText(t.greeting, 10);
  y += 2;
  
  // Introduction
  addText(t.intro, 10);
  y += 8;
  
  // 1. Object
  addText(t.objectTitle, 11, true);
  addText(t.objectText, 10);
  y += 5;
  
  // 2. Products
  addText(t.productsTitle, 11, true);
  data.productsInterest.forEach(productId => {
    const productName = products[productId] || productId;
    addText(`• ${productName}`, 10);
  });
  y += 5;
  
  // 3. Volume
  if (data.estimatedVolume) {
    addText(t.volumeTitle, 11, true);
    addText(data.estimatedVolume, 10);
    y += 5;
  }
  
  // 4. Company Info
  addText(t.companyInfoTitle, 11, true);
  addText(`${lang === 'pt' ? 'Razão Social' : lang === 'en' ? 'Company Name' : lang === 'es' ? 'Razón Social' : '公司名称'}: ${data.companyName}`, 10);
  addText(`${t.contactTitle}: ${data.contactName}`, 10);
  addText(`${lang === 'pt' ? 'E-mail' : 'Email'}: ${data.email}`, 10);
  if (data.phone) {
    addText(`${lang === 'pt' ? 'Telefone' : lang === 'en' ? 'Phone' : lang === 'es' ? 'Teléfono' : '电话'}: ${data.phone}`, 10);
  }
  addText(`${lang === 'pt' ? 'País' : lang === 'en' ? 'Country' : lang === 'es' ? 'País' : '国家'}: ${data.country}`, 10);
  
  const companyTypeLabel = data.companyType === 'buyer' ? t.companyTypeBuyer :
                          data.companyType === 'seller' ? t.companyTypeSeller : t.companyTypeBoth;
  addText(`${lang === 'pt' ? 'Tipo' : lang === 'en' ? 'Type' : lang === 'es' ? 'Tipo' : '类型'}: ${companyTypeLabel}`, 10);
  y += 5;
  
  // 5. Notes
  if (data.message) {
    addText(t.notesTitle, 11, true);
    addText(data.message, 10);
    y += 5;
  }
  
  // 6. Next Steps
  addText(`6. ${lang === 'pt' ? 'Próximos Passos' : lang === 'en' ? 'Next Steps' : lang === 'es' ? 'Próximos Pasos' : '后续步骤'}`, 11, true);
  t.nextSteps.forEach((step, index) => {
    addText(`${index + 1}. ${step}`, 10);
  });
  y += 5;
  
  // 7. Confidentiality
  addText(t.confidentiality, 10);
  y += 5;
  
  // 8. Validity
  addText(t.validity, 10);
  y += 5;
  
  // Closing
  addText(t.closing, 10);
  y += 10;
  
  // Signature
  addText(t.signature, 10);
  y += 5;
  addText('Ericson Piccoli', 11, true);
  addText('Chairman & Founder', 10);
  addText('ELP Alliance S/A – ELP Green Technology', 10);
  addText('E-mail: info@elpgreen.com', 10);
  addText('Tel: +39 350 102 1359', 10);
  addText('Site: www.elpgreen.com', 10);
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `LOI-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${data.companyName.substring(0, 10).replace(/\s/g, '')} | ${lang === 'pt' ? 'Página' : lang === 'en' ? 'Page' : lang === 'es' ? 'Página' : '页'} ${i}/${pageCount}`,
      pageWidth / 2,
      290,
      { align: 'center' }
    );
  }
  
  // Save
  const fileName = `LOI_ELP_${data.companyName.replace(/\s/g, '_')}_${today.toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

export function generateLOIForEmail(data: LOIData): string {
  const lang = data.language || 'pt';
  const t = translations[lang] || translations.pt;
  const products = productNames[lang] || productNames.pt;
  
  const today = new Date();
  const dateStr = today.toLocaleDateString(lang === 'pt' ? 'pt-BR' : lang === 'es' ? 'es-ES' : lang === 'zh' ? 'zh-CN' : 'en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  
  const productsList = data.productsInterest.map(id => products[id] || id).join(', ');
  const companyTypeLabel = data.companyType === 'buyer' ? t.companyTypeBuyer :
                          data.companyType === 'seller' ? t.companyTypeSeller : t.companyTypeBoth;
  
  return `
${t.title}

${t.date}: ${dateStr}

${t.subject}

${t.greeting}

${t.intro}

${t.objectTitle}
${t.objectText}

${t.productsTitle}
${productsList}

${data.estimatedVolume ? `${t.volumeTitle}\n${data.estimatedVolume}\n` : ''}

${t.companyInfoTitle}
- ${lang === 'pt' ? 'Razão Social' : 'Company Name'}: ${data.companyName}
- ${t.contactTitle}: ${data.contactName}
- Email: ${data.email}
${data.phone ? `- ${lang === 'pt' ? 'Telefone' : 'Phone'}: ${data.phone}` : ''}
- ${lang === 'pt' ? 'País' : 'Country'}: ${data.country}
- ${lang === 'pt' ? 'Tipo' : 'Type'}: ${companyTypeLabel}

${data.message ? `${t.notesTitle}\n${data.message}\n` : ''}

${t.confidentiality}

${t.validity}

${t.closing}

${t.signature}

Ericson Piccoli
Chairman & Founder
ELP Alliance S/A – ELP Green Technology
E-mail: info@elpgreen.com
Tel: +39 350 102 1359
Site: www.elpgreen.com
`.trim();
}
