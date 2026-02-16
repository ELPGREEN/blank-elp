import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR, enUS, es, it, zhCN } from 'date-fns/locale';
import logoElp from '@/assets/logo-elp-lion.png';

export interface TemplateDocumentData {
  templateName: string;
  templateType: string;
  content: string;
  language: 'pt' | 'en' | 'es' | 'zh' | 'it';
  fieldValues: Record<string, string>;
  checkboxValues?: Record<string, boolean>;
  uploadedFiles?: string[];
  signatureData?: {
    dataUrl: string;
    timestamp: string;
    signerName: string;
    signerEmail: string;
    type: 'drawn' | 'typed';
  } | null;
  signatureHash?: string;
}

interface Translations {
  confidential: string;
  page: string;
  of: string;
  digitalSignature: string;
  signedDocument: string;
  signedBy: string;
  email: string;
  date: string;
  signatureType: string;
  drawnSignature: string;
  typedSignature: string;
  verificationHash: string;
  attachedFiles: string;
  documentGenerated: string;
  legalNotice: string;
  documentChecklist: string;
  verified: string;
  pending: string;
}

const translations: Record<string, Translations> = {
  pt: {
    confidential: 'CONFIDENCIAL',
    page: 'Página',
    of: 'de',
    digitalSignature: 'ASSINATURA DIGITAL',
    signedDocument: 'DOCUMENTO ASSINADO',
    signedBy: 'Assinado por',
    email: 'Email',
    date: 'Data',
    signatureType: 'Tipo',
    drawnSignature: 'Manuscrita Digital',
    typedSignature: 'Digitada',
    verificationHash: 'Hash de Verificação SHA-256',
    attachedFiles: 'Arquivos Anexados',
    documentGenerated: 'Documento gerado em',
    legalNotice: 'Válido conforme Lei 14.063/2020 | eIDAS (UE)',
    documentChecklist: 'Checklist de Documentos',
    verified: 'Verificado',
    pending: 'Pendente',
  },
  en: {
    confidential: 'CONFIDENTIAL',
    page: 'Page',
    of: 'of',
    digitalSignature: 'DIGITAL SIGNATURE',
    signedDocument: 'SIGNED DOCUMENT',
    signedBy: 'Signed by',
    email: 'Email',
    date: 'Date',
    signatureType: 'Type',
    drawnSignature: 'Digital Handwritten',
    typedSignature: 'Typed',
    verificationHash: 'SHA-256 Verification Hash',
    attachedFiles: 'Attached Files',
    documentGenerated: 'Document generated on',
    legalNotice: 'Valid according to Law 14.063/2020 | eIDAS (EU)',
    documentChecklist: 'Document Checklist',
    verified: 'Verified',
    pending: 'Pending',
  },
  es: {
    confidential: 'CONFIDENCIAL',
    page: 'Página',
    of: 'de',
    digitalSignature: 'FIRMA DIGITAL',
    signedDocument: 'DOCUMENTO FIRMADO',
    signedBy: 'Firmado por',
    email: 'Correo',
    date: 'Fecha',
    signatureType: 'Tipo',
    drawnSignature: 'Manuscrita Digital',
    typedSignature: 'Digitada',
    verificationHash: 'Hash de Verificación SHA-256',
    attachedFiles: 'Archivos Adjuntos',
    documentGenerated: 'Documento generado el',
    legalNotice: 'Válido conforme Ley 14.063/2020 | eIDAS (UE)',
    documentChecklist: 'Lista de Documentos',
    verified: 'Verificado',
    pending: 'Pendiente',
  },
  zh: {
    confidential: '机密',
    page: '页',
    of: '/',
    digitalSignature: '数字签名',
    signedDocument: '已签署文件',
    signedBy: '签署人',
    email: '电子邮件',
    date: '日期',
    signatureType: '类型',
    drawnSignature: '手写数字签名',
    typedSignature: '键入签名',
    verificationHash: 'SHA-256验证哈希',
    attachedFiles: '附件',
    documentGenerated: '文件生成于',
    legalNotice: '根据14.063/2020法律有效 | eIDAS (欧盟)',
    documentChecklist: '文件清单',
    verified: '已验证',
    pending: '待处理',
  },
  it: {
    confidential: 'RISERVATO',
    page: 'Pagina',
    of: 'di',
    digitalSignature: 'FIRMA DIGITALE',
    signedDocument: 'DOCUMENTO FIRMATO',
    signedBy: 'Firmato da',
    email: 'Email',
    date: 'Data',
    signatureType: 'Tipo',
    drawnSignature: 'Manoscritta Digitale',
    typedSignature: 'Digitata',
    verificationHash: 'Hash di Verifica SHA-256',
    attachedFiles: 'File Allegati',
    documentGenerated: 'Documento generato il',
    legalNotice: 'Valido ai sensi Legge 14.063/2020 | eIDAS (UE)',
    documentChecklist: 'Checklist Documenti',
    verified: 'Verificato',
    pending: 'In attesa',
  },
};

const getDateLocale = (lang: string) => {
  const locales: Record<string, typeof ptBR> = { pt: ptBR, en: enUS, es: es, it: it, zh: zhCN };
  return locales[lang] || enUS;
};

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
    console.error('Error loading logo:', error);
    return null;
  }
}

export async function generateTemplateDocumentPDF(data: TemplateDocumentData): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  const headerHeight = 25;
  const footerHeight = 18;
  const contentStartY = headerHeight + 10;
  const maxContentY = pageHeight - footerHeight - 10;
  const t = translations[data.language] || translations.en;
  
  const logoBase64 = await loadLogoAsBase64();
  
  // Professional Color Palette
  const colors = {
    primary: [26, 39, 68] as [number, number, number],       // Navy Blue #1a2744
    secondary: [42, 58, 92] as [number, number, number],     // Lighter Navy
    accent: [46, 125, 50] as [number, number, number],       // Green
    text: [51, 51, 51] as [number, number, number],          // Dark text
    muted: [102, 102, 102] as [number, number, number],      // Gray text
    light: [153, 153, 153] as [number, number, number],      // Light text
    border: [224, 224, 224] as [number, number, number],     // Light border
    background: [250, 250, 250] as [number, number, number], // Light background
    white: [255, 255, 255] as [number, number, number],
  };
  
  // Helper function to add professional header
  const addHeader = () => {
    // Clean white background for header
    doc.setFillColor(...colors.white);
    doc.rect(0, 0, pageWidth, headerHeight, 'F');
    
    // Subtle bottom border
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.3);
    doc.line(margin, headerHeight, pageWidth - margin, headerHeight);
    
    // Logo
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', margin, 6, 18, 14);
      } catch (e) {
        console.log('Could not add logo');
      }
    }
    
    // Company name
    doc.setTextColor(...colors.primary);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('ELP Green Technology', margin + 22, 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...colors.muted);
    doc.text('Sustainable Solutions', margin + 22, 17);
    
    // Document type badge on right
    const typeText = data.templateType.replace(/_/g, ' ').toUpperCase();
    doc.setFillColor(...colors.primary);
    const typeWidth = Math.min(doc.getTextWidth(typeText) + 12, 50);
    doc.roundedRect(pageWidth - margin - typeWidth, 8, typeWidth, 10, 2, 2, 'F');
    doc.setTextColor(...colors.white);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(typeText, pageWidth - margin - typeWidth / 2, 14, { align: 'center' });
  };
  
  // Helper function to add professional footer
  const addFooter = (pageNum: number, totalPages: number) => {
    const footerY = pageHeight - footerHeight;
    
    // Clean footer with subtle top border
    doc.setFillColor(...colors.white);
    doc.rect(0, footerY, pageWidth, footerHeight, 'F');
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY, pageWidth - margin, footerY);
    
    doc.setTextColor(...colors.muted);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    
    // Left: Company info
    doc.text('www.elpgreen.com | info@elpgreen.com', margin, footerY + 8);
    
    // Center: Page number
    doc.text(`${t.page} ${pageNum} ${t.of} ${totalPages}`, pageWidth / 2, footerY + 8, { align: 'center' });
    
    // Right: Date
    doc.text(format(new Date(), 'dd/MM/yyyy HH:mm'), pageWidth - margin, footerY + 8, { align: 'right' });
    
    // Legal text
    doc.setFontSize(6);
    doc.setTextColor(...colors.light);
    doc.text(t.legalNotice, pageWidth / 2, footerY + 14, { align: 'center' });
  };
  
  // Helper function to add subtle watermark
  const addWatermark = () => {
    doc.saveGraphicsState();
    doc.setGState(doc.GState({ opacity: 0.04 }));
    doc.setTextColor(...colors.primary);
    doc.setFontSize(60);
    doc.setFont('helvetica', 'bold');
    doc.text('ELP', pageWidth / 2, pageHeight / 2, { angle: 45, align: 'center' });
    doc.restoreGraphicsState();
  };
  
  let currentPage = 1;
  let yPos = contentStartY;
  
  // === PAGE 1: COVER ===
  addWatermark();
  addHeader();
  
  // Document title
  yPos = 45;
  doc.setTextColor(...colors.primary);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  const titleLines = doc.splitTextToSize(data.templateName, contentWidth - 20);
  titleLines.forEach((line: string) => {
    doc.text(line, pageWidth / 2, yPos, { align: 'center' });
    yPos += 9;
  });
  
  // Decorative line under title
  yPos += 5;
  doc.setDrawColor(...colors.accent);
  doc.setLineWidth(1);
  doc.line(pageWidth / 2 - 25, yPos, pageWidth / 2 + 25, yPos);
  yPos += 15;
  
  // Filled fields section
  const fieldEntries = Object.entries(data.fieldValues).filter(([key, value]) => value && !key.startsWith('file_'));
  
  if (fieldEntries.length > 0) {
    doc.setFillColor(...colors.background);
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.3);
    const boxHeight = Math.min(fieldEntries.length * 10 + 20, 90);
    doc.roundedRect(margin, yPos, contentWidth, boxHeight, 3, 3, 'FD');
    
    yPos += 12;
    doc.setTextColor(...colors.primary);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(data.language === 'pt' ? 'INFORMAÇÕES PREENCHIDAS' : 'FILLED INFORMATION', margin + 8, yPos);
    yPos += 10;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    fieldEntries.slice(0, 7).forEach(([key, value]) => {
      const label = key.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
      doc.setTextColor(...colors.muted);
      doc.text(`${label}:`, margin + 8, yPos);
      doc.setTextColor(...colors.text);
      const labelWidth = doc.getTextWidth(`${label}: `);
      doc.text(String(value).substring(0, 55), margin + 8 + labelWidth + 2, yPos);
      yPos += 8;
    });
    
    yPos += 15;
  }
  
  // Checkbox section
  if (data.checkboxValues && Object.keys(data.checkboxValues).length > 0) {
    const checkboxEntries = Object.entries(data.checkboxValues);
    const checkedCount = checkboxEntries.filter(([_, v]) => v).length;
    
    doc.setFillColor(...colors.background);
    doc.setDrawColor(...colors.border);
    const checkboxBoxHeight = Math.min(checkboxEntries.length * 9 + 20, 80);
    doc.roundedRect(margin, yPos, contentWidth, checkboxBoxHeight, 3, 3, 'FD');
    
    yPos += 12;
    doc.setTextColor(...colors.primary);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`${t.documentChecklist} (${checkedCount}/${checkboxEntries.length})`, margin + 8, yPos);
    yPos += 10;
    
    doc.setFontSize(8);
    checkboxEntries.forEach(([key, checked]) => {
      const label = key.replace(/^doc_/, '').replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
      
      // Checkbox
      if (checked) {
        doc.setFillColor(...colors.accent);
        doc.rect(margin + 8, yPos - 3.5, 4, 4, 'F');
        doc.setTextColor(...colors.white);
        doc.setFontSize(6);
        doc.text('✓', margin + 9.2, yPos - 0.3);
        doc.setTextColor(...colors.text);
      } else {
        doc.setDrawColor(...colors.border);
        doc.rect(margin + 8, yPos - 3.5, 4, 4, 'S');
        doc.setTextColor(...colors.muted);
      }
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(label, margin + 15, yPos);
      
      // Status badge
      const statusText = checked ? t.verified : t.pending;
      const statusX = pageWidth - margin - 25;
      if (checked) {
        doc.setFillColor(...colors.accent);
      } else {
        doc.setFillColor(...colors.border);
      }
      doc.roundedRect(statusX, yPos - 3.5, 18, 4.5, 1, 1, 'F');
      doc.setTextColor(...colors.white);
      doc.setFontSize(5);
      doc.text(statusText, statusX + 9, yPos - 0.5, { align: 'center' });
      
      yPos += 7;
    });
    
    yPos += 15;
  }
  
  // Attached files section
  if (data.uploadedFiles && data.uploadedFiles.length > 0) {
    doc.setFillColor(255, 250, 240);
    doc.setDrawColor(200, 160, 80);
    doc.setLineWidth(0.3);
    const filesBoxHeight = data.uploadedFiles.length * 7 + 15;
    doc.roundedRect(margin, yPos, contentWidth, filesBoxHeight, 3, 3, 'FD');
    
    yPos += 10;
    doc.setTextColor(150, 110, 40);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`📎 ${t.attachedFiles}`, margin + 8, yPos);
    yPos += 8;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    data.uploadedFiles.forEach((fileName) => {
      doc.text(`• ${fileName}`, margin + 12, yPos);
      yPos += 6;
    });
  }
  
  // === CONTENT PAGES ===
  doc.addPage();
  currentPage++;
  
  addWatermark();
  addHeader();
  
  yPos = contentStartY;
  
  // Content
  doc.setTextColor(...colors.text);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const contentLines = doc.splitTextToSize(data.content, contentWidth);
  
  contentLines.forEach((line: string) => {
    if (yPos > maxContentY) {
      doc.addPage();
      currentPage++;
      addWatermark();
      addHeader();
      yPos = contentStartY;
      doc.setTextColor(...colors.text);
      doc.setFontSize(10);
    }
    doc.text(line, margin, yPos);
    yPos += 5.5;
  });
  
  // === SIGNATURE PAGE ===
  if (data.signatureData) {
    doc.addPage();
    currentPage++;
    
    addWatermark();
    addHeader();
    
    yPos = contentStartY + 10;
    
    // Signature section header
    doc.setFillColor(...colors.primary);
    doc.roundedRect(margin, yPos, contentWidth, 14, 3, 3, 'F');
    doc.setTextColor(...colors.white);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`✍️ ${t.digitalSignature}`, margin + 8, yPos + 9);
    yPos += 22;
    
    // Signature box - clean professional design with improved alignment
    const sigBoxHeight = 90;
    doc.setFillColor(...colors.white);
    doc.setDrawColor(...colors.accent);
    doc.setLineWidth(0.8);
    doc.roundedRect(margin, yPos, contentWidth, sigBoxHeight, 4, 4, 'FD');
    
    // Signed badge - top left
    doc.setFillColor(...colors.accent);
    doc.roundedRect(margin + 10, yPos + 8, 50, 10, 2, 2, 'F');
    doc.setTextColor(...colors.white);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`✓ ${t.signedDocument}`, margin + 35, yPos + 15, { align: 'center' });
    
    // Signature image - properly sized and centered in left half
    const sigAreaWidth = contentWidth / 2 - 20;
    const sigImgWidth = Math.min(60, sigAreaWidth);
    const sigImgHeight = 28;
    const sigImgX = margin + 15;
    const sigImgY = yPos + 25;
    
    try {
      doc.addImage(data.signatureData.dataUrl, 'PNG', sigImgX, sigImgY, sigImgWidth, sigImgHeight);
    } catch (e) {
      console.error('Could not add signature image:', e);
    }
    
    // Signature line below image
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.3);
    doc.line(sigImgX, sigImgY + sigImgHeight + 3, sigImgX + sigImgWidth, sigImgY + sigImgHeight + 3);
    
    // Signature details on the right - with consistent spacing
    const detailsX = margin + contentWidth / 2 + 5;
    const detailsWidth = contentWidth / 2 - 15;
    const labelWidth = 35;
    let detailY = yPos + 22;
    const lineHeight = 10;
    
    // Helper function for consistent label-value pairs
    const addDetailRow = (label: string, value: string, y: number) => {
      doc.setTextColor(...colors.primary);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(label, detailsX, y);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.text);
      const valueText = doc.splitTextToSize(value, detailsWidth - labelWidth - 5)[0] || value;
      doc.text(valueText, detailsX + labelWidth, y);
    };
    
    addDetailRow(`${t.signedBy}:`, data.signatureData.signerName, detailY);
    detailY += lineHeight;
    
    addDetailRow(`${t.email}:`, data.signatureData.signerEmail, detailY);
    detailY += lineHeight;
    
    addDetailRow(`${t.date}:`, format(new Date(data.signatureData.timestamp), "dd/MM/yyyy 'às' HH:mm:ss", { locale: getDateLocale(data.language) }), detailY);
    detailY += lineHeight;
    
    addDetailRow(`${t.signatureType}:`, data.signatureData.type === 'drawn' ? t.drawnSignature : t.typedSignature, detailY);
    
    // Verification hash - below signature box
    if (data.signatureHash) {
      yPos += sigBoxHeight + 8;
      doc.setFillColor(...colors.background);
      doc.setDrawColor(...colors.border);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, yPos, contentWidth, 20, 2, 2, 'FD');
      
      doc.setTextColor(...colors.muted);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text(t.verificationHash, margin + 8, yPos + 7);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(...colors.text);
      doc.text(data.signatureHash, margin + 8, yPos + 14);
    }
    
    // Legal notice at bottom
    yPos += 28;
    doc.setTextColor(...colors.muted);
    doc.setFontSize(7);
    doc.text(t.legalNotice, pageWidth / 2, yPos, { align: 'center' });
  }
  
  // Add footers to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i, totalPages);
  }
  
  // Generate filename
  const companyName = data.fieldValues.razao_social || data.fieldValues.company_name || 'documento';
  const signedSuffix = data.signatureData ? '_ASSINADO' : '';
  const fileName = `${data.templateType.toUpperCase()}_${companyName.replace(/\s/g, '_').substring(0, 30)}_${format(new Date(), 'yyyy-MM-dd')}${signedSuffix}.pdf`;
  
  doc.save(fileName);
  
  return doc.output('blob');
}
