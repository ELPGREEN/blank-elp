import jsPDF from "jspdf";
import QRCode from "qrcode";
import logoElp from "@/assets/logo-elp-lion.png";
import { format } from "date-fns";
import { ptBR, enUS, es, it, zhCN } from "date-fns/locale";

export interface DocumentData {
  title: string;
  subtitle?: string;
  content: string;
  language: 'pt' | 'en' | 'es' | 'zh' | 'it';
  documentType: string;
  companyName?: string;
  contactName?: string;
  email?: string;
  country?: string;
  fieldValues?: Record<string, string>;
  includeSignature?: boolean;
  signatureData?: SignatureData;
  includeQRCode?: boolean;
  qrCodeUrl?: string;
  // New options for watermark and document numbering
  watermarkText?: string;
  watermarkType?: 'draft' | 'confidential' | 'final' | 'none';
  documentNumber?: string;
  includeDocumentNumber?: boolean;
}

export interface SignatureData {
  dataUrl: string;
  timestamp: string;
  signerName: string;
  signerEmail: string;
  ipAddress?: string;
  type: 'drawn' | 'typed';
}

interface Translations {
  confidential: string;
  page: string;
  of: string;
  signaturePage: string;
  signaturePartnerInfo: string;
  signatureCompanyName: string;
  signatureRepName: string;
  signaturePosition: string;
  signatureEmail: string;
  signaturePhone: string;
  signatureDate: string;
  signatureDeclaration: string;
  signaturePartner: string;
  signatureElp: string;
  signatureWitness: string;
  qrCodeTitle: string;
  qrCodeDesc: string;
  qrCodeScan: string;
  digitalSignature: string;
  signedDocument: string;
  verifiedSignature: string;
  documentGenerated: string;
  globalPartnership: string;
  partnershipModel: string;
  // New translations for document numbering
  documentNumber: string;
  verificationCode: string;
  digitalCertification: string;
  watermarkDraft: string;
  watermarkConfidential: string;
  watermarkFinal: string;
}

const translations: Record<string, Translations> = {
  en: {
    confidential: "Confidential",
    page: "Page",
    of: "of",
    signaturePage: "Document Acceptance & Signature",
    signaturePartnerInfo: "Signatory Information",
    signatureCompanyName: "Company Name",
    signatureRepName: "Representative Name",
    signaturePosition: "Position/Title",
    signatureEmail: "Email",
    signaturePhone: "Phone",
    signatureDate: "Date",
    signatureDeclaration: "I hereby confirm that I have reviewed and understood the document presented above. I express my agreement with the terms and conditions stated herein.",
    signaturePartner: "Partner Signature",
    signatureElp: "ELP Green Technology",
    signatureWitness: "Witness (Optional)",
    qrCodeTitle: "Complete Online",
    qrCodeDesc: "Scan this QR Code to access the online form and submit your information directly.",
    qrCodeScan: "Scan to Access",
    digitalSignature: "DIGITAL SIGNATURE",
    signedDocument: "SIGNED DOCUMENT",
    verifiedSignature: "Verified Signature",
    documentGenerated: "Document generated on",
    globalPartnership: "Global Partnership Opportunity",
    partnershipModel: "Joint Venture Model - We bring technology, you bring resources",
    documentNumber: "Document No.",
    verificationCode: "Verification Code",
    digitalCertification: "Digital Certification",
    watermarkDraft: "DRAFT",
    watermarkConfidential: "CONFIDENTIAL",
    watermarkFinal: "FINAL",
  },
  pt: {
    confidential: "Confidencial",
    page: "Página",
    of: "de",
    signaturePage: "Aceite e Assinatura do Documento",
    signaturePartnerInfo: "Informações do Signatário",
    signatureCompanyName: "Nome da Empresa",
    signatureRepName: "Nome do Representante",
    signaturePosition: "Cargo/Função",
    signatureEmail: "E-mail",
    signaturePhone: "Telefone",
    signatureDate: "Data",
    signatureDeclaration: "Declaro que revisei e compreendi o documento apresentado acima. Manifesto minha concordância com os termos e condições aqui estabelecidos.",
    signaturePartner: "Assinatura do Parceiro",
    signatureElp: "ELP Green Technology",
    signatureWitness: "Testemunha (Opcional)",
    qrCodeTitle: "Complete Online",
    qrCodeDesc: "Escaneie este QR Code para acessar o formulário online e enviar suas informações diretamente.",
    qrCodeScan: "Escaneie para Acessar",
    digitalSignature: "ASSINATURA DIGITAL",
    signedDocument: "DOCUMENTO ASSINADO",
    verifiedSignature: "Assinatura Verificada",
    documentGenerated: "Documento gerado em",
    globalPartnership: "Oportunidade de Parceria Global",
    partnershipModel: "Modelo Joint Venture - Nós trazemos tecnologia, você traz recursos",
    documentNumber: "Documento Nº",
    verificationCode: "Código de Verificação",
    digitalCertification: "Certificação Digital",
    watermarkDraft: "RASCUNHO",
    watermarkConfidential: "CONFIDENCIAL",
    watermarkFinal: "FINAL",
  },
  es: {
    confidential: "Confidencial",
    page: "Página",
    of: "de",
    signaturePage: "Aceptación y Firma del Documento",
    signaturePartnerInfo: "Información del Firmante",
    signatureCompanyName: "Nombre de la Empresa",
    signatureRepName: "Nombre del Representante",
    signaturePosition: "Cargo/Título",
    signatureEmail: "Correo Electrónico",
    signaturePhone: "Teléfono",
    signatureDate: "Fecha",
    signatureDeclaration: "Por la presente confirmo que he revisado y comprendido el documento presentado. Expreso mi acuerdo con los términos y condiciones establecidos.",
    signaturePartner: "Firma del Socio",
    signatureElp: "ELP Green Technology",
    signatureWitness: "Testigo (Opcional)",
    qrCodeTitle: "Complete en Línea",
    qrCodeDesc: "Escanee este código QR para acceder al formulario en línea y enviar su información directamente.",
    qrCodeScan: "Escanear para Acceder",
    digitalSignature: "FIRMA DIGITAL",
    signedDocument: "DOCUMENTO FIRMADO",
    verifiedSignature: "Firma Verificada",
    documentGenerated: "Documento generado el",
    globalPartnership: "Oportunidad de Asociación Global",
    partnershipModel: "Modelo Joint Venture - Nosotros aportamos tecnología, usted aporta recursos",
    documentNumber: "Documento Nº",
    verificationCode: "Código de Verificación",
    digitalCertification: "Certificación Digital",
    watermarkDraft: "BORRADOR",
    watermarkConfidential: "CONFIDENCIAL",
    watermarkFinal: "FINAL",
  },
  zh: {
    confidential: "机密",
    page: "页",
    of: "/",
    signaturePage: "文件接受与签名",
    signaturePartnerInfo: "签署人信息",
    signatureCompanyName: "公司名称",
    signatureRepName: "代表姓名",
    signaturePosition: "职位/头衔",
    signatureEmail: "电子邮件",
    signaturePhone: "电话",
    signatureDate: "日期",
    signatureDeclaration: "本人确认已审阅并理解上述文件。我同意此处规定的条款和条件。",
    signaturePartner: "合作伙伴签名",
    signatureElp: "ELP Green Technology",
    signatureWitness: "证人（可选）",
    qrCodeTitle: "在线完成",
    qrCodeDesc: "扫描此二维码访问在线表格并直接提交您的信息。",
    qrCodeScan: "扫描访问",
    digitalSignature: "数字签名",
    signedDocument: "已签署文件",
    verifiedSignature: "已验证签名",
    documentGenerated: "文件生成于",
    globalPartnership: "全球合作机会",
    partnershipModel: "合资模式 - 我们提供技术，您提供资源",
    documentNumber: "文件编号",
    verificationCode: "验证码",
    digitalCertification: "数字认证",
    watermarkDraft: "草稿",
    watermarkConfidential: "机密",
    watermarkFinal: "最终版",
  },
  it: {
    confidential: "Riservato",
    page: "Pagina",
    of: "di",
    signaturePage: "Accettazione e Firma del Documento",
    signaturePartnerInfo: "Informazioni del Firmatario",
    signatureCompanyName: "Nome Azienda",
    signatureRepName: "Nome Rappresentante",
    signaturePosition: "Posizione/Titolo",
    signatureEmail: "Email",
    signaturePhone: "Telefono",
    signatureDate: "Data",
    signatureDeclaration: "Con la presente confermo di aver esaminato e compreso il documento sopra presentato. Esprimo il mio accordo con i termini e le condizioni qui stabiliti.",
    signaturePartner: "Firma del Partner",
    signatureElp: "ELP Green Technology",
    signatureWitness: "Testimone (Opzionale)",
    qrCodeTitle: "Completa Online",
    qrCodeDesc: "Scansiona questo codice QR per accedere al modulo online e inviare le tue informazioni direttamente.",
    qrCodeScan: "Scansiona per Accedere",
    digitalSignature: "FIRMA DIGITALE",
    signedDocument: "DOCUMENTO FIRMATO",
    verifiedSignature: "Firma Verificata",
    documentGenerated: "Documento generato il",
    globalPartnership: "Opportunità di Partnership Globale",
    partnershipModel: "Modello Joint Venture - Noi portiamo la tecnologia, voi le risorse",
    documentNumber: "Documento N.",
    verificationCode: "Codice di Verifica",
    digitalCertification: "Certificazione Digitale",
    watermarkDraft: "BOZZA",
    watermarkConfidential: "RISERVATO",
    watermarkFinal: "FINALE",
  },
};

// Generate unique document number for digital signature verification
function generateDocumentNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ELP-${timestamp}-${random}`;
}

// Generate verification hash for signature
function generateVerificationHash(docNumber: string, companyName: string, date: string): string {
  const input = `${docNumber}:${companyName}:${date}`;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
}

// Sanitize content - remove markdown and special characters
function sanitizeContent(content: string): string {
  return content
    // Remove markdown headers
    .replace(/^#{1,6}\s*/gm, '')
    // Remove bold/italic markers
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Remove horizontal rules
    .replace(/^[-=_]{3,}$/gm, '')
    // Remove special unicode decorative chars
    .replace(/[Ø=Ý═─│┌┐└┘├┤┬┴┼▪▸►◆◇○●◎★☆✓✗✔✘→←↑↓⇒⇐⇑⇓📜🏛️📋💰💵🎁👷🏭🚛📊💲📄✍️📱🌐]/g, '')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    // Remove blockquotes
    .replace(/^>\s*/gm, '')
    // Remove table formatting
    .replace(/\|/g, ' ')
    .replace(/^[-:]+$/gm, '')
    // Clean up multiple blank lines
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
}

async function loadLogoAsBase64(): Promise<string | null> {
  try {
    const response = await fetch(logoElp);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error loading logo:", error);
    return null;
  }
}

async function generateQRCode(url: string): Promise<string | null> {
  try {
    const qrDataUrl = await QRCode.toDataURL(url, {
      width: 200,
      margin: 1,
      color: {
        dark: '#003366',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H'
    });
    return qrDataUrl;
  } catch (error) {
    console.error("Error generating QR code:", error);
    return null;
  }
}

const getDateLocale = (lang: string) => {
  const locales: Record<string, any> = { pt: ptBR, en: enUS, es: es, it: it, zh: zhCN };
  return locales[lang] || enUS;
};

export async function generateProfessionalDocument(data: DocumentData): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Professional margins - wider for legal documents
  const marginLeft = 25;
  const marginRight = 20;
  const marginTop = 20;
  const contentWidth = pageWidth - marginLeft - marginRight;
  const maxY = 265;
  let yPos = marginTop;

  // Generate document number for signature verification
  const documentNumber = data.documentNumber || generateDocumentNumber();
  const currentDate = format(new Date(), "yyyy-MM-dd");
  const verificationHash = generateVerificationHash(documentNumber, data.companyName || 'Document', currentDate);

  // Sanitize content to remove markdown artifacts
  const cleanContent = sanitizeContent(data.content);

  const logoBase64 = await loadLogoAsBase64();
  const qrCodeBase64 = data.includeQRCode && data.qrCodeUrl ? await generateQRCode(data.qrCodeUrl) : null;
  const t = translations[data.language] || translations.en;

  // Helper function to add watermark to a page
  const addWatermark = (watermarkType: string) => {
    if (watermarkType === 'none') return;
    
    const watermarkTexts: Record<string, string> = {
      draft: t.watermarkDraft,
      confidential: t.watermarkConfidential,
      final: t.watermarkFinal,
    };
    
    const watermarkText = data.watermarkText || watermarkTexts[watermarkType] || '';
    if (!watermarkText) return;
    
    doc.saveGraphicsState();
    doc.setGState(doc.GState({ opacity: 0.06 }));
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(55);
    doc.setFont("times", "bold");
    
    const centerX = pageWidth / 2;
    const centerY = pageHeight / 2;
    
    doc.text(watermarkText, centerX, centerY, { 
      align: "center",
      angle: 45
    });
    
    doc.restoreGraphicsState();
  };

  // === COVER PAGE - WHITE BACKGROUND WITH NAVY STRIPES ===
  // Clean white background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, "F");
  
  // TOP STRIPE - Navy Blue
  doc.setFillColor(0, 41, 82);
  doc.rect(0, 0, pageWidth, 8, "F");
  
  // Accent line - Green
  doc.setFillColor(34, 139, 34);
  doc.rect(0, 8, pageWidth, 2, "F");
  
  // BOTTOM STRIPE - Navy Blue footer
  doc.setFillColor(0, 41, 82);
  doc.rect(0, pageHeight - 20, pageWidth, 20, "F");
  
  // Add watermark to cover
  if (data.watermarkType && data.watermarkType !== 'none') {
    addWatermark(data.watermarkType);
  }

  // Logo - professional size and position
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "PNG", pageWidth / 2 - 20, 20, 40, 20);
    } catch (e) {
      console.log("Could not add logo to cover");
    }
  }

  // Company name - Times New Roman style for legal feel
  doc.setTextColor(0, 41, 82);
  doc.setFontSize(16);
  doc.setFont("times", "bold");
  doc.text("ELP Green Technology", pageWidth / 2, 50, { align: "center" });
  
  // Subtle tagline
  doc.setFontSize(9);
  doc.setFont("times", "italic");
  doc.setTextColor(100, 100, 100);
  doc.text("Transforming Waste into Resources", pageWidth / 2, 57, { align: "center" });
  
  // Elegant separator line
  doc.setDrawColor(0, 41, 82);
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 2 - 40, 63, pageWidth / 2 + 40, 63);

  // Main title - larger and more prominent
  yPos = 85;
  doc.setFontSize(24);
  doc.setFont("times", "bold");
  doc.setTextColor(0, 41, 82);
  
  const titleLines = doc.splitTextToSize(data.title.toUpperCase(), contentWidth - 20);
  titleLines.forEach((line: string) => {
    doc.text(line, pageWidth / 2, yPos, { align: "center" });
    yPos += 12;
  });

  // Subtitle with AI generation info
  if (data.subtitle) {
    doc.setFontSize(10);
    doc.setFont("times", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(data.subtitle, pageWidth / 2, yPos + 5, { align: "center" });
    yPos += 12;
  }

  // Document type badge
  yPos += 10;
  const badgeWidth = 70;
  doc.setFillColor(46, 125, 50);
  doc.roundedRect(pageWidth / 2 - badgeWidth / 2, yPos, badgeWidth, 10, 2, 2, "F");
  doc.setTextColor(255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(data.documentType.toUpperCase(), pageWidth / 2, yPos + 6.5, { align: "center" });

  // Info cards section
  yPos += 30;
  const cardWidth = (contentWidth - 10) / 2;
  const cardHeight = 30;

  // Company card
  if (data.companyName) {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(0, 51, 102);
    doc.setLineWidth(0.5);
    doc.roundedRect(marginLeft, yPos, cardWidth, cardHeight, 2, 2, "FD");
    
    doc.setFillColor(0, 51, 102);
    doc.rect(marginLeft, yPos, 4, cardHeight, "F");
    
    doc.setTextColor(100);
    doc.setFontSize(7);
    doc.setFont("times", "bold");
    doc.text(t.signatureCompanyName.toUpperCase(), marginLeft + 10, yPos + 8);
    
    doc.setTextColor(0, 41, 82);
    doc.setFontSize(10);
    doc.text(data.companyName, marginLeft + 10, yPos + 18);
  }

  // Contact card
  if (data.contactName) {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(46, 125, 50);
    doc.roundedRect(marginLeft + cardWidth + 10, yPos, cardWidth, cardHeight, 2, 2, "FD");
    
    doc.setFillColor(46, 125, 50);
    doc.rect(marginLeft + cardWidth + 10, yPos, 4, cardHeight, "F");
    
    doc.setTextColor(100);
    doc.setFontSize(7);
    doc.setFont("times", "bold");
    doc.text(t.signatureRepName.toUpperCase(), marginLeft + cardWidth + 20, yPos + 8);
    
    doc.setTextColor(0, 41, 82);
    doc.setFontSize(10);
    doc.text(data.contactName, marginLeft + cardWidth + 20, yPos + 18);
  }

  // Date card
  yPos += cardHeight + 10;
  if (data.country) {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(200, 200, 200);
    doc.roundedRect(marginLeft, yPos, cardWidth, cardHeight, 2, 2, "FD");
    
    doc.setTextColor(100);
    doc.setFontSize(7);
    doc.setFont("times", "bold");
    doc.text("PAÍS / COUNTRY", marginLeft + 10, yPos + 8);
    
    doc.setTextColor(0, 41, 82);
    doc.setFontSize(10);
    doc.text(data.country, marginLeft + 10, yPos + 18);
  }

  // Date
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(200, 200, 200);
  doc.roundedRect(marginLeft + cardWidth + 10, yPos, cardWidth, cardHeight, 2, 2, "FD");
  
  doc.setTextColor(100);
  doc.setFontSize(7);
  doc.setFont("times", "bold");
  doc.text(t.signatureDate.toUpperCase(), marginLeft + cardWidth + 20, yPos + 8);
  
  doc.setTextColor(0, 41, 82);
  doc.setFontSize(10);
  doc.text(format(new Date(), "dd/MM/yyyy", { locale: getDateLocale(data.language) }), marginLeft + cardWidth + 20, yPos + 18);

  // Footer on cover
  doc.setTextColor(255);
  doc.setFontSize(7);
  doc.setFont("times", "normal");
  doc.text("www.elpgreen.com | info@elpgreen.com | +39 350 102 1359", pageWidth / 2, pageHeight - 6, { align: "center" });

  // === CONTENT PAGES ===
  doc.addPage();
  yPos = marginTop + 5;

  // Add watermark to content page
  if (data.watermarkType && data.watermarkType !== 'none') {
    addWatermark(data.watermarkType);
  }

  // Add header to content page
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "PNG", marginLeft, 8, 14, 7);
    } catch (e) {
      console.log("Could not add logo to header");
    }
  }
  
  doc.setDrawColor(0, 41, 82);
  doc.setLineWidth(0.4);
  doc.line(marginLeft + 16, 11, pageWidth - marginRight, 11);
  
  doc.setFontSize(7);
  doc.setTextColor(100);
  doc.setFont("times", "italic");
  doc.text(data.title.substring(0, 60), pageWidth - marginRight, 10, { align: "right" });

  yPos = marginTop + 5;

  // Content section header
  doc.setFillColor(0, 41, 82);
  doc.roundedRect(marginLeft, yPos, contentWidth, 10, 2, 2, "F");
  doc.setTextColor(255);
  doc.setFontSize(11);
  doc.setFont("times", "bold");
  doc.text(data.title.toUpperCase(), marginLeft + 4, yPos + 7);
  yPos += 18;

  // Content text - use sanitized content with professional typography
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(10);
  doc.setFont("times", "normal");
  
  // Better line spacing for legal documents
  const lineHeight = 5.5;
  const paragraphSpacing = 3;
  
  const contentLines = doc.splitTextToSize(cleanContent, contentWidth - 8);
  
  const addPage = () => {
    doc.addPage();
    yPos = marginTop + 5;
    
    // Add watermark to new page
    if (data.watermarkType && data.watermarkType !== 'none') {
      addWatermark(data.watermarkType);
    }
    
    // Professional header
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, "PNG", marginLeft, 8, 14, 7);
      } catch (e) {}
    }
    
    doc.setDrawColor(0, 41, 82);
    doc.setLineWidth(0.4);
    doc.line(marginLeft + 16, 11, pageWidth - marginRight, 11);
    
    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.setFont("times", "italic");
    doc.text(data.title.substring(0, 60), pageWidth - marginRight, 10, { align: "right" });
  };

  contentLines.forEach((line: string, index: number) => {
    if (yPos > maxY) {
      addPage();
    }
    
    // Detect section headers and style them
    const isHeader = line.match(/^(CLÁUSULA|CLAUSE|ARTIGO|ARTICLE|CONSIDERANDO|WHEREAS|\d+\.|[A-Z]{2,})/);
    
    if (isHeader) {
      doc.setFont("times", "bold");
      doc.setTextColor(0, 41, 82);
      yPos += paragraphSpacing;
    } else {
      doc.setFont("times", "normal");
      doc.setTextColor(30, 30, 30);
    }
    
    doc.setFontSize(10);
    doc.text(line, marginLeft + 4, yPos);
    yPos += lineHeight;
  });

  // === SIGNATURE PAGE ===
  if (data.includeSignature || data.signatureData) {
    addPage();
    
    // Page header
    doc.setFillColor(0, 41, 82);
    doc.roundedRect(marginLeft, yPos - 2, contentWidth, 12, 2, 2, "F");
    doc.setTextColor(255);
    doc.setFontSize(12);
    doc.setFont("times", "bold");
    doc.text(t.signaturePage.toUpperCase(), marginLeft + 4, yPos + 6);
    yPos += 18;

    // Document Number and Verification section
    if (data.includeDocumentNumber !== false) {
      doc.setFillColor(248, 250, 255);
      doc.setDrawColor(0, 41, 82);
      doc.setLineWidth(0.8);
      doc.roundedRect(marginLeft, yPos, contentWidth, 20, 2, 2, "FD");
      
      doc.setTextColor(0, 41, 82);
      doc.setFontSize(8);
      doc.setFont("times", "bold");
      doc.text(`${t.documentNumber}: ${documentNumber}`, marginLeft + 4, yPos + 7);
      
      doc.setTextColor(80);
      doc.setFontSize(7);
      doc.setFont("times", "normal");
      doc.text(`${t.verificationCode}: ${verificationHash}`, marginLeft + 4, yPos + 14);
      
      const certBadgeX = pageWidth - marginRight - 55;
      doc.setFillColor(34, 139, 34);
      doc.roundedRect(certBadgeX, yPos + 4, 50, 12, 2, 2, "F");
      doc.setTextColor(255);
      doc.setFontSize(6);
      doc.setFont("times", "bold");
      doc.text(t.digitalCertification, certBadgeX + 25, yPos + 11, { align: "center" });
      
      yPos += 26;
    }

    // Partnership reminder
    doc.setFillColor(46, 125, 50);
    doc.roundedRect(marginLeft, yPos, contentWidth, 14, 2, 2, "F");
    doc.setTextColor(255);
    doc.setFontSize(9);
    doc.setFont("times", "bold");
    doc.text(t.globalPartnership, pageWidth / 2, yPos + 5, { align: "center" });
    doc.setFontSize(7);
    doc.setFont("times", "normal");
    doc.text(t.partnershipModel, pageWidth / 2, yPos + 10, { align: "center" });
    yPos += 20;

    // Signatory information section
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(0, 41, 82);
    doc.setLineWidth(0.5);
    doc.roundedRect(marginLeft, yPos, contentWidth, 55, 2, 2, "FD");
    
    doc.setFillColor(0, 41, 82);
    doc.roundedRect(marginLeft, yPos, contentWidth, 8, 2, 0, "F");
    doc.rect(marginLeft, yPos + 4, contentWidth, 4, "F");
    doc.setTextColor(255);
    doc.setFontSize(9);
    doc.setFont("times", "bold");
    doc.text(t.signaturePartnerInfo.toUpperCase(), marginLeft + 4, yPos + 5.5);
    
    const fieldY = yPos + 14;
    const fieldColW = (contentWidth - 12) / 2;
    
    const fields = [
      { label: t.signatureCompanyName, x: marginLeft + 4, y: fieldY },
      { label: t.signatureRepName, x: marginLeft + 4 + fieldColW + 4, y: fieldY },
      { label: t.signaturePosition, x: marginLeft + 4, y: fieldY + 14 },
      { label: t.signatureEmail, x: marginLeft + 4 + fieldColW + 4, y: fieldY + 14 },
      { label: t.signaturePhone, x: marginLeft + 4, y: fieldY + 28 },
      { label: t.signatureDate, x: marginLeft + 4 + fieldColW + 4, y: fieldY + 28 }
    ];
    
    fields.forEach(field => {
      doc.setTextColor(80);
      doc.setFontSize(7);
      doc.setFont("times", "bold");
      doc.text(field.label + ":", field.x, field.y);
      
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.2);
      doc.line(field.x, field.y + 7, field.x + fieldColW - 4, field.y + 7);
    });
    
    yPos += 62;

    // Declaration section
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(46, 125, 50);
    doc.setLineWidth(0.8);
    doc.roundedRect(marginLeft, yPos, contentWidth, 25, 2, 2, "FD");
    
    doc.setTextColor(50);
    doc.setFontSize(8);
    doc.setFont("times", "normal");
    const declLines = doc.splitTextToSize(t.signatureDeclaration, contentWidth - 8);
    let declY = yPos + 7;
    declLines.forEach((line: string) => {
      doc.text(line, marginLeft + 4, declY);
      declY += 5;
    });
    yPos += 32;


    // Signature boxes
    const sigBoxW = (contentWidth - 10) / 2;
    const sigBoxH = 50;
    const sigBoxGap = 10;
    
    // Partner signature box
    doc.setFillColor(252, 252, 252);
    doc.setDrawColor(0, 41, 82);
    doc.setLineWidth(0.5);
    doc.roundedRect(marginLeft, yPos, sigBoxW, sigBoxH, 3, 3, "FD");
    
    doc.setFillColor(0, 41, 82);
    doc.roundedRect(marginLeft, yPos, sigBoxW, 8, 3, 0, "F");
    doc.rect(marginLeft, yPos + 4, sigBoxW, 4, "F");
    doc.setTextColor(255);
    doc.setFontSize(9);
    doc.setFont("times", "bold");
    doc.text(t.signaturePartner.toUpperCase(), marginLeft + sigBoxW / 2, yPos + 5.5, { align: "center" });
    
    if (data.signatureData) {
      try {
        const sigImgWidth = 55;
        const sigImgHeight = 22;
        const sigImgX = marginLeft + (sigBoxW - sigImgWidth) / 2;
        const sigImgY = yPos + 13;
        doc.addImage(data.signatureData.dataUrl, "PNG", sigImgX, sigImgY, sigImgWidth, sigImgHeight);
        
        const badgeWidth = 45;
        doc.setFillColor(34, 139, 34);
        doc.roundedRect(marginLeft + (sigBoxW - badgeWidth) / 2, yPos + sigBoxH - 11, badgeWidth, 8, 2, 2, "F");
        doc.setTextColor(255);
        doc.setFontSize(6);
        doc.text(`✓ ${t.verifiedSignature}`, marginLeft + sigBoxW / 2, yPos + sigBoxH - 6, { align: "center" });
      } catch (e) {
        console.log("Could not add signature image");
      }
    } else {
      const lineStartX = marginLeft + 12;
      const lineEndX = marginLeft + sigBoxW - 12;
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.3);
      doc.line(lineStartX, yPos + 35, lineEndX, yPos + 35);
      
      doc.setTextColor(120);
      doc.setFontSize(7);
      doc.setFont("times", "italic");
      doc.text(t.signatureDate + ":", marginLeft + 12, yPos + 44);
      doc.line(marginLeft + 35, yPos + 44, marginLeft + sigBoxW - 12, yPos + 44);
    }
    
    // ELP signature box
    const elpBoxX = marginLeft + sigBoxW + sigBoxGap;
    doc.setFillColor(240, 255, 240);
    doc.setDrawColor(46, 125, 50);
    doc.setLineWidth(0.5);
    doc.roundedRect(elpBoxX, yPos, sigBoxW, sigBoxH, 3, 3, "FD");
    
    doc.setFillColor(46, 125, 50);
    doc.roundedRect(elpBoxX, yPos, sigBoxW, 8, 3, 0, "F");
    doc.rect(elpBoxX, yPos + 4, sigBoxW, 4, "F");
    doc.setTextColor(255);
    doc.setFontSize(9);
    doc.setFont("times", "bold");
    doc.text(t.signatureElp.toUpperCase(), elpBoxX + sigBoxW / 2, yPos + 5.5, { align: "center" });
    
    const elpLineStartX = elpBoxX + 12;
    const elpLineEndX = elpBoxX + sigBoxW - 12;
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.line(elpLineStartX, yPos + 35, elpLineEndX, yPos + 35);
    
    doc.setTextColor(120);
    doc.setFontSize(7);
    doc.setFont("times", "italic");
    doc.text(t.signatureDate + ":", elpBoxX + 12, yPos + 44);
    doc.line(elpBoxX + 35, yPos + 44, elpBoxX + sigBoxW - 12, yPos + 44);
    
    yPos += sigBoxH + 10;

    // QR Code section
    if (qrCodeBase64) {
      const qrSectionHeight = 50;
      
      doc.setFillColor(248, 250, 255);
      doc.setDrawColor(0, 41, 82);
      doc.setLineWidth(0.8);
      doc.roundedRect(marginLeft, yPos, contentWidth, qrSectionHeight, 3, 3, "FD");
      
      const qrSize = 35;
      const qrX = marginLeft + 8;
      const qrY = yPos + (qrSectionHeight - qrSize) / 2;
      
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 4, 2, 2, "F");
      doc.setDrawColor(0, 41, 82);
      doc.setLineWidth(0.3);
      doc.roundedRect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 4, 2, 2, "S");
      
      try {
        doc.addImage(qrCodeBase64, "PNG", qrX, qrY, qrSize, qrSize);
      } catch (e) {
        console.log("Could not add QR code to PDF");
      }
      
      const textStartX = marginLeft + qrSize + 20;
      const textMaxWidth = contentWidth - qrSize - 30;
      
      doc.setTextColor(0, 41, 82);
      doc.setFontSize(10);
      doc.setFont("times", "bold");
      doc.text(t.qrCodeTitle, textStartX, yPos + 12);
      
      doc.setTextColor(60);
      doc.setFontSize(8);
      doc.setFont("times", "normal");
      const qrDescLines = doc.splitTextToSize(t.qrCodeDesc, textMaxWidth);
      let qrTextY = yPos + 20;
      qrDescLines.forEach((line: string) => {
        doc.text(line, textStartX, qrTextY);
        qrTextY += 5;
      });
      
      doc.setTextColor(46, 125, 50);
      doc.setFontSize(7);
      doc.setFont("times", "bold");
      doc.text(data.qrCodeUrl || '', textStartX, qrTextY + 3);
      
      doc.setFillColor(46, 125, 50);
      doc.roundedRect(textStartX, qrTextY + 7, 45, 7, 2, 2, "F");
      doc.setTextColor(255);
      doc.setFontSize(6);
      doc.text(t.qrCodeScan, textStartX + 22.5, qrTextY + 11.5, { align: "center" });
      
      yPos += qrSectionHeight + 6;
    }

    // Witness section
    doc.setFillColor(248, 248, 248);
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.roundedRect(marginLeft, yPos, contentWidth, 25, 2, 2, "FD");
    
    doc.setTextColor(100);
    doc.setFontSize(8);
    doc.setFont("times", "bold");
    doc.text(t.signatureWitness.toUpperCase(), marginLeft + 4, yPos + 6);
    
    doc.setFontSize(7);
    doc.setFont("times", "normal");
    doc.text("Nome / Name:", marginLeft + 4, yPos + 12);
    doc.line(marginLeft + 30, yPos + 12, marginLeft + 80, yPos + 12);
    
    doc.text("Assinatura / Signature:", marginLeft + 4, yPos + 18);
    doc.line(marginLeft + 40, yPos + 18, marginLeft + 80, yPos + 18);
    
    doc.text(t.signatureDate + ":", marginLeft + 90, yPos + 12);
    doc.line(marginLeft + 105, yPos + 12, marginLeft + contentWidth - 4, yPos + 12);
  }

  // Add footer to all pages with document number
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    doc.setDrawColor(0, 41, 82);
    doc.setLineWidth(0.3);
    doc.line(marginLeft, 282, pageWidth - marginRight, 282);
    
    doc.setFontSize(6);
    doc.setTextColor(0, 41, 82);
    doc.setFont("times", "bold");
    doc.text("ELP Green Technology", marginLeft, 286);
    
    doc.setFont("times", "normal");
    doc.setTextColor(80);
    doc.text("www.elpgreen.com | info@elpgreen.com | +39 350 102 1359", marginLeft, 290);
    
    if (data.includeDocumentNumber !== false) {
      doc.setTextColor(100);
      doc.setFontSize(5);
      doc.text(`${t.documentNumber}: ${documentNumber} | ${t.verificationCode}: ${verificationHash}`, pageWidth / 2, 294, { align: "center" });
    }
    
    doc.setTextColor(120);
    doc.setFontSize(6);
    doc.text(t.confidential.toUpperCase(), pageWidth / 2, 290, { align: "center" });
    
    doc.setFontSize(7);
    doc.setTextColor(0, 41, 82);
    doc.text(`${t.page} ${i} ${t.of} ${totalPages}`, pageWidth - marginRight, 286, { align: "right" });
  }

  // Save the PDF
  const fileName = `ELP_${data.documentType.toUpperCase()}_${(data.companyName || "Document").replace(/\s+/g, "_")}_${format(new Date(), "yyyy-MM-dd")}.pdf`;
  doc.save(fileName);
}

// Export for use in DocumentGenerator component
export { generateQRCode, loadLogoAsBase64, generateDocumentNumber, generateVerificationHash, sanitizeContent };
