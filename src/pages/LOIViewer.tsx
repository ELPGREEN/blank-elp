import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { FileText, Download, Clock, Building2, User, Mail, MapPin, Package, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { generateLOIPDF } from '@/lib/generateLOI';

interface LOIDocument {
  id: string;
  token: string;
  company_name: string;
  contact_name: string;
  email: string;
  country: string;
  company_type: string;
  products_interest: string[];
  estimated_volume: string | null;
  message: string | null;
  language: string;
  created_at: string;
  expires_at: string;
  download_count: number;
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

const companyTypeLabels: Record<string, Record<string, string>> = {
  pt: { buyer: 'Comprador', seller: 'Vendedor/Fornecedor', both: 'Comprador e Vendedor' },
  en: { buyer: 'Buyer', seller: 'Seller/Supplier', both: 'Buyer and Seller' },
  es: { buyer: 'Comprador', seller: 'Vendedor/Proveedor', both: 'Comprador y Vendedor' },
  zh: { buyer: '采购商', seller: '供应商', both: '采购商和供应商' },
  it: { buyer: 'Acquirente', seller: 'Venditore/Fornitore', both: 'Acquirente e Venditore' }
};

const translations = {
  pt: {
    title: 'Carta de Intenções',
    subtitle: 'Documento de manifestação de interesse comercial',
    expired: 'Este documento expirou',
    expiredDesc: 'A LOI não está mais válida. Por favor, faça um novo pré-registro.',
    notFound: 'Documento não encontrado',
    notFoundDesc: 'O link pode estar incorreto ou o documento foi removido.',
    loading: 'Carregando documento...',
    downloadPdf: 'Baixar PDF',
    validUntil: 'Válido até',
    issuedOn: 'Emitido em',
    downloads: 'Downloads',
    companyInfo: 'Informações da Empresa',
    companyName: 'Razão Social',
    contact: 'Contato',
    email: 'E-mail',
    country: 'País',
    type: 'Tipo',
    products: 'Produtos de Interesse',
    volume: 'Volume Estimado',
    notes: 'Observações',
    backToMarketplace: 'Voltar ao Marketplace',
    newRegistration: 'Novo Pré-Registro'
  },
  en: {
    title: 'Letter of Intent',
    subtitle: 'Commercial interest expression document',
    expired: 'This document has expired',
    expiredDesc: 'The LOI is no longer valid. Please submit a new pre-registration.',
    notFound: 'Document not found',
    notFoundDesc: 'The link may be incorrect or the document has been removed.',
    loading: 'Loading document...',
    downloadPdf: 'Download PDF',
    validUntil: 'Valid until',
    issuedOn: 'Issued on',
    downloads: 'Downloads',
    companyInfo: 'Company Information',
    companyName: 'Company Name',
    contact: 'Contact',
    email: 'Email',
    country: 'Country',
    type: 'Type',
    products: 'Products of Interest',
    volume: 'Estimated Volume',
    notes: 'Notes',
    backToMarketplace: 'Back to Marketplace',
    newRegistration: 'New Pre-Registration'
  },
  es: {
    title: 'Carta de Intenciones',
    subtitle: 'Documento de manifestación de interés comercial',
    expired: 'Este documento ha expirado',
    expiredDesc: 'La LOI ya no es válida. Por favor, realice un nuevo pre-registro.',
    notFound: 'Documento no encontrado',
    notFoundDesc: 'El enlace puede ser incorrecto o el documento fue eliminado.',
    loading: 'Cargando documento...',
    downloadPdf: 'Descargar PDF',
    validUntil: 'Válido hasta',
    issuedOn: 'Emitido el',
    downloads: 'Descargas',
    companyInfo: 'Información de la Empresa',
    companyName: 'Razón Social',
    contact: 'Contacto',
    email: 'Correo',
    country: 'País',
    type: 'Tipo',
    products: 'Productos de Interés',
    volume: 'Volumen Estimado',
    notes: 'Notas',
    backToMarketplace: 'Volver al Marketplace',
    newRegistration: 'Nuevo Pre-Registro'
  },
  zh: {
    title: '意向书',
    subtitle: '商业意向表达文件',
    expired: '此文件已过期',
    expiredDesc: '意向书已失效。请提交新的预注册。',
    notFound: '未找到文件',
    notFoundDesc: '链接可能不正确或文件已被删除。',
    loading: '加载文件中...',
    downloadPdf: '下载PDF',
    validUntil: '有效期至',
    issuedOn: '签发日期',
    downloads: '下载次数',
    companyInfo: '公司信息',
    companyName: '公司名称',
    contact: '联系人',
    email: '电子邮件',
    country: '国家',
    type: '类型',
    products: '感兴趣的产品',
    volume: '预计数量',
    notes: '备注',
    backToMarketplace: '返回市场',
    newRegistration: '新预注册'
  },
  it: {
    title: 'Lettera di Intenti',
    subtitle: 'Documento di manifestazione di interesse commerciale',
    expired: 'Questo documento è scaduto',
    expiredDesc: 'La LOI non è più valida. Per favore, effettua una nuova pre-registrazione.',
    notFound: 'Documento non trovato',
    notFoundDesc: 'Il link potrebbe essere errato o il documento è stato rimosso.',
    loading: 'Caricamento documento...',
    downloadPdf: 'Scarica PDF',
    validUntil: 'Valido fino al',
    issuedOn: 'Emesso il',
    downloads: 'Download',
    companyInfo: 'Informazioni Azienda',
    companyName: 'Ragione Sociale',
    contact: 'Contatto',
    email: 'Email',
    country: 'Paese',
    type: 'Tipo',
    products: 'Prodotti di Interesse',
    volume: 'Volume Stimato',
    notes: 'Note',
    backToMarketplace: 'Torna al Marketplace',
    newRegistration: 'Nuova Pre-Registrazione'
  }
};

export default function LOIViewer() {
  const { token } = useParams<{ token: string }>();
  const { i18n } = useTranslation();
  const [loi, setLoi] = useState<LOIDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<'not_found' | 'expired' | null>(null);

  const lang = (loi?.language || i18n.language || 'pt') as keyof typeof translations;
  const t = translations[lang] || translations.pt;
  const products = productNames[lang] || productNames.pt;
  const companyTypes = companyTypeLabels[lang] || companyTypeLabels.pt;

  useEffect(() => {
    async function fetchLOI() {
      if (!token) {
        setError('not_found');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('loi_documents')
          .select('*')
          .eq('token', token)
          .maybeSingle();

        if (fetchError) {
          console.error('Error fetching LOI:', fetchError);
          setError('not_found');
          setLoading(false);
          return;
        }

        if (!data) {
          setError('not_found');
          setLoading(false);
          return;
        }

        // Check if expired
        if (new Date(data.expires_at) < new Date()) {
          setError('expired');
          setLoading(false);
          return;
        }

        setLoi(data);
      } catch (err) {
        console.error('Error:', err);
        setError('not_found');
      } finally {
        setLoading(false);
      }
    }

    fetchLOI();
  }, [token]);

  const handleDownload = async () => {
    if (!loi) return;

    // Increment download count
    await supabase.rpc('increment_loi_download', { loi_token: loi.token });

    // Generate and download PDF
    generateLOIPDF({
      companyName: loi.company_name,
      contactName: loi.contact_name,
      email: loi.email,
      country: loi.country,
      companyType: loi.company_type,
      productsInterest: loi.products_interest,
      estimatedVolume: loi.estimated_volume || undefined,
      message: loi.message || undefined,
      language: loi.language as 'pt' | 'en' | 'es' | 'zh' | 'it'
    });

    // Update local state
    setLoi(prev => prev ? { ...prev, download_count: prev.download_count + 1 } : null);
  };

  const formatDate = (dateStr: string) => {
    const localeMap: Record<string, string> = {
      pt: 'pt-BR',
      es: 'es-ES',
      zh: 'zh-CN',
      it: 'it-IT',
      en: 'en-US'
    };
    return new Date(dateStr).toLocaleDateString(
      localeMap[lang] || 'en-US',
      { day: '2-digit', month: 'long', year: 'numeric' }
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-secondary mx-auto mb-4" />
          <p className="text-muted-foreground">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (error === 'expired') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="min-h-[70vh] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-6">
              <Clock className="h-10 w-10 text-yellow-500" />
            </div>
            <h1 className="text-2xl font-bold mb-4">{t.expired}</h1>
            <p className="text-muted-foreground mb-8">{t.expiredDesc}</p>
            <Button asChild>
              <Link to="/marketplace">{t.newRegistration}</Link>
            </Button>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error === 'not_found' || !loi) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="min-h-[70vh] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold mb-4">{t.notFound}</h1>
            <p className="text-muted-foreground mb-8">{t.notFoundDesc}</p>
            <Button asChild>
              <Link to="/marketplace">{t.backToMarketplace}</Link>
            </Button>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="py-20 pt-32">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-secondary/10 border border-secondary/30 rounded-full px-4 py-2 mb-6">
                <FileText className="h-4 w-4 text-secondary" />
                <span className="text-sm text-secondary font-medium">LOI Document</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{t.title}</h1>
              <p className="text-muted-foreground">{t.subtitle}</p>
            </div>

            {/* Document Card */}
            <GlassCard className="p-8 mb-8">
              {/* Document Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-border mb-6">
                <div>
                  <h2 className="text-xl font-bold text-primary mb-2">ELP Alliance S/A</h2>
                  <p className="text-sm text-muted-foreground">ELP Green Technology</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {t.validUntil}: {formatDate(loi.expires_at)}
                  </Badge>
                  <Badge variant="outline">
                    {t.downloads}: {loi.download_count}
                  </Badge>
                </div>
              </div>

              {/* Company Info */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-secondary" />
                  {t.companyInfo}
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Building2 className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t.companyName}</p>
                        <p className="font-medium">{loi.company_name}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <User className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t.contact}</p>
                        <p className="font-medium">{loi.contact_name}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t.email}</p>
                        <p className="font-medium">{loi.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t.country}</p>
                        <p className="font-medium">{loi.country}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Package className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t.type}</p>
                        <p className="font-medium">{companyTypes[loi.company_type] || loi.company_type}</p>
                      </div>
                    </div>
                    {loi.estimated_volume && (
                      <div className="flex items-start gap-3">
                        <Package className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">{t.volume}</p>
                          <p className="font-medium">{loi.estimated_volume} ton/mês</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Products */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Package className="h-5 w-5 text-secondary" />
                  {t.products}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {loi.products_interest.map((productId) => (
                    <Badge key={productId} variant="secondary" className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {products[productId] || productId}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {loi.message && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4">{t.notes}</h3>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-muted-foreground whitespace-pre-wrap">{loi.message}</p>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="pt-6 border-t border-border">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <p className="text-sm text-muted-foreground">
                    {t.issuedOn}: {formatDate(loi.created_at)}
                  </p>
                  <Button onClick={handleDownload} className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    {t.downloadPdf}
                  </Button>
                </div>
              </div>
            </GlassCard>

            {/* Back Link */}
            <div className="text-center">
              <Button asChild variant="outline">
                <Link to="/marketplace">{t.backToMarketplace}</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
