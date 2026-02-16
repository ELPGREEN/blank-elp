import { useParams, Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Share2, Loader2, Tag, Clock, ChevronRight, Bookmark } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { SEO } from '@/components/SEO';

interface Article {
  id: string;
  slug: string;
  title_pt: string;
  title_en: string;
  title_es: string;
  title_zh: string;
  excerpt_pt: string;
  excerpt_en: string;
  excerpt_es: string;
  excerpt_zh: string;
  content_pt: string;
  content_en: string;
  content_es: string;
  content_zh: string;
  category: string | null;
  image_url: string | null;
  is_published: boolean | null;
  published_at: string | null;
}

export default function BlogArticle() {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'pt' | 'en' | 'es' | 'zh';

  const { data: article, isLoading, error } = useQuery({
    queryKey: ['article', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();
      if (error) throw error;
      return data as Article;
    },
    enabled: !!slug,
  });

  // Fetch related articles
  const { data: relatedArticles = [] } = useQuery({
    queryKey: ['related-articles', article?.category],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('id, slug, title_pt, title_en, title_es, title_zh, excerpt_pt, excerpt_en, excerpt_es, excerpt_zh, image_url, category, published_at')
        .eq('is_published', true)
        .eq('category', article?.category)
        .neq('id', article?.id)
        .order('published_at', { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
    enabled: !!article?.category && !!article?.id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Carregando artigo...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return <Navigate to="/media" replace />;
  }

  const getLocalizedField = (field: 'title' | 'excerpt' | 'content') => {
    const key = `${field}_${lang}` as keyof Article;
    const value = article[key] as string;
    if (value) return value;
    return article[`${field}_pt` as keyof Article] as string;
  };

  const title = getLocalizedField('title');
  const excerpt = getLocalizedField('excerpt');
  const content = getLocalizedField('content');

  const shareUrl = window.location.href;

  // Calculate reading time
  const wordCount = content?.split(/\s+/).length || 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  const parseContent = (text: string) => {
    if (!text) return [];
    return text.split('\n').filter(line => line.trim());
  };

  const labels = {
    back: lang === 'pt' ? 'Voltar para Mídia' : lang === 'en' ? 'Back to Media' : lang === 'es' ? 'Volver a Medios' : '返回媒体中心',
    share: lang === 'pt' ? 'Compartilhar' : lang === 'en' ? 'Share' : lang === 'es' ? 'Compartir' : '分享',
    ctaTitle: lang === 'pt' ? 'Quer saber mais?' : lang === 'en' ? 'Want to know more?' : lang === 'es' ? '¿Quieres saber más?' : '想了解更多？',
    ctaText: lang === 'pt' ? 'Entre em contato com nossa equipe para discutir como podemos ajudar sua empresa.' : lang === 'en' ? 'Contact our team to discuss how we can help your company.' : lang === 'es' ? 'Contacte a nuestro equipo para discutir cómo podemos ayudar a su empresa.' : '联系我们的团队，讨论我们如何帮助您的公司。',
    ctaButton: lang === 'pt' ? 'Fale Conosco' : lang === 'en' ? 'Contact Us' : lang === 'es' ? 'Contáctenos' : '联系我们',
    readTime: lang === 'pt' ? 'min de leitura' : lang === 'en' ? 'min read' : lang === 'es' ? 'min de lectura' : '分钟阅读',
    relatedTitle: lang === 'pt' ? 'Artigos Relacionados' : lang === 'en' ? 'Related Articles' : lang === 'es' ? 'Artículos Relacionados' : '相关文章',
    readMore: lang === 'pt' ? 'Ler mais' : lang === 'en' ? 'Read more' : lang === 'es' ? 'Leer más' : '阅读更多',
  };

  const getRelatedTitle = (item: any) => {
    const key = `title_${lang}` as keyof typeof item;
    return (item[key] as string) || item.title_pt;
  };

  return (
    <>
      <SEO 
        title={`${title} | ELP Green Technology`}
        description={excerpt}
        image={article.image_url || undefined}
      />
      <div className="min-h-screen bg-background">
        <Header />

        {/* Hero Section */}
        <section className="relative pt-24 pb-16 overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
          
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute top-1/2 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl translate-x-1/2" />

          <div className="container-wide relative z-10">
            {/* Breadcrumb */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-sm text-muted-foreground mb-6"
            >
              <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
              <ChevronRight className="h-4 w-4" />
              <Link to="/media" className="hover:text-foreground transition-colors">Media</Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">{article.category}</span>
            </motion.div>

            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Category & Meta */}
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="default" className="bg-primary/10 text-primary hover:bg-primary/20">
                      <Tag className="h-3 w-3 mr-1" />
                      {article.category}
                    </Badge>
                    {article.published_at && (
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(article.published_at).toLocaleDateString(lang === 'zh' ? 'zh-CN' : lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    )}
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {readingTime} {labels.readTime}
                    </span>
                  </div>

                  {/* Title */}
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                    {title}
                  </h1>

                  {/* Excerpt */}
                  {excerpt && (
                    <p className="text-xl text-muted-foreground leading-relaxed">
                      {excerpt}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({ title, url: shareUrl });
                        } else {
                          navigator.clipboard.writeText(shareUrl);
                        }
                      }}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      {labels.share}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Bookmark className="h-4 w-4 mr-2" />
                      Salvar
                    </Button>
                  </div>
                </motion.div>
              </div>

              {/* Sidebar placeholder for featured image preview */}
              <div className="hidden lg:block" />
            </div>
          </div>
        </section>

        {/* Featured Image */}
        {article.image_url && (
          <section className="pb-12">
            <div className="container-wide">
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="relative rounded-2xl overflow-hidden shadow-2xl"
              >
                <div className="aspect-[21/9] w-full">
                  <img
                    src={article.image_url}
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
              </motion.div>
            </div>
          </section>
        )}

        {/* Content */}
        <section className="pb-24">
          <div className="container-wide">
            <div className="grid lg:grid-cols-3 gap-12">
              {/* Main Content */}
              <motion.article
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="lg:col-span-2"
              >
                <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-p:leading-relaxed prose-a:text-primary prose-strong:text-foreground">
                  {parseContent(content).map((paragraph, idx) => {
                    // H1 heading
                    if (paragraph.startsWith('# ') && !paragraph.startsWith('## ')) {
                      return (
                        <h1 key={idx} className="text-3xl font-bold mt-8 mb-6 text-foreground">
                          {paragraph.replace('# ', '')}
                        </h1>
                      );
                    }
                    // H2 heading
                    if (paragraph.startsWith('## ')) {
                      return (
                        <h2 key={idx} className="text-2xl font-bold mt-10 mb-4 text-foreground border-l-4 border-primary pl-4">
                          {paragraph.replace('## ', '')}
                        </h2>
                      );
                    }
                    // H3 heading
                    if (paragraph.startsWith('### ')) {
                      return (
                        <h3 key={idx} className="text-xl font-semibold mt-8 mb-3 text-foreground">
                          {paragraph.replace('### ', '')}
                        </h3>
                      );
                    }
                    // Bullet points
                    if (paragraph.startsWith('- ') || paragraph.startsWith('• ')) {
                      return (
                        <div
                          key={idx}
                          className="pl-4 border-l-2 border-primary/30 my-2 text-foreground/90"
                          dangerouslySetInnerHTML={{
                            __html: paragraph
                              .replace(/^[-•]\s/, '')
                              .replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>')
                              .replace(/\*(.*?)\*/g, '<em>$1</em>'),
                          }}
                        />
                      );
                    }
                    // Regular paragraph
                    return (
                      <p
                        key={idx}
                        className="mb-4 leading-relaxed text-foreground/90"
                        dangerouslySetInnerHTML={{
                          __html: paragraph
                            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>')
                            .replace(/\*(.*?)\*/g, '<em>$1</em>'),
                        }}
                      />
                    );
                  })}
                </div>

                <Separator className="my-12" />

                {/* CTA Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Card className="bg-gradient-to-r from-primary/10 via-green-500/10 to-primary/10 border-primary/20 overflow-hidden">
                    <CardContent className="p-8 text-center relative">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
                      <h3 className="text-2xl font-bold mb-4">{labels.ctaTitle}</h3>
                      <p className="text-muted-foreground mb-6 max-w-lg mx-auto">{labels.ctaText}</p>
                      <div className="flex flex-wrap justify-center gap-4">
                        <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                          <Link to="/contact">{labels.ctaButton}</Link>
                        </Button>
                        <Button variant="outline" size="lg" asChild>
                          <a href="mailto:info@elpgreen.com">info@elpgreen.com</a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.article>

              {/* Sidebar */}
              <aside className="space-y-6">
                {/* Related Articles */}
                {relatedArticles.length > 0 && (
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <Bookmark className="h-5 w-5 text-primary" />
                        {labels.relatedTitle}
                      </h3>
                      <div className="space-y-4">
                        {relatedArticles.map((related: any) => (
                          <Link
                            key={related.id}
                            to={`/blog/${related.slug}`}
                            className="block group"
                          >
                            <div className="flex gap-3">
                              {related.image_url && (
                                <div className="w-20 h-14 rounded-lg overflow-hidden flex-shrink-0">
                                  <img
                                    src={related.image_url}
                                    alt=""
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                                  {getRelatedTitle(related)}
                                </h4>
                                <span className="text-xs text-muted-foreground">
                                  {labels.readMore} →
                                </span>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Back to Media */}
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <Link
                      to="/media"
                      className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      {labels.back}
                    </Link>
                  </CardContent>
                </Card>
              </aside>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
