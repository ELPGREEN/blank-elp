import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  Sparkles,
  Loader2,
  Upload,
  Image as ImageIcon,
  FileText,
  Wand2,
  Languages,
  RefreshCw,
  CheckCircle2,
  Eye,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ContentEditorWithAIProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'article' | 'press';
  initialData?: any;
  onSave: (data: any) => void;
  isSaving?: boolean;
}

const categories = [
  { value: 'Tecnologia', label: '💻 Tecnologia' },
  { value: 'Thought Leadership', label: '🎯 Thought Leadership' },
  { value: 'Case Study', label: '📊 Case Study' },
  { value: 'Sustentabilidade', label: '🌱 Sustentabilidade' },
  { value: 'Parceria', label: '🤝 Parceria' },
  { value: 'Inovação', label: '🚀 Inovação' },
];

const languages = [
  { code: 'pt', label: '🇧🇷 Português', flag: '🇧🇷' },
  { code: 'en', label: '🇬🇧 English', flag: '🇬🇧' },
  { code: 'es', label: '🇪🇸 Español', flag: '🇪🇸' },
  { code: 'zh', label: '🇨🇳 中文', flag: '🇨🇳' },
  { code: 'it', label: '🇮🇹 Italiano', flag: '🇮🇹' },
];

export function ContentEditorWithAI({
  open,
  onOpenChange,
  type,
  initialData,
  onSave,
  isSaving,
}: ContentEditorWithAIProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('editor');
  const [activeLang, setActiveLang] = useState('pt');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [aiScore, setAiScore] = useState<number | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  // Form data state
  const [formData, setFormData] = useState<any>(() => ({
    slug: initialData?.slug || '',
    category: initialData?.category || 'Tecnologia',
    image_url: initialData?.image_url || '',
    is_published: initialData?.is_published || false,
    title_pt: initialData?.title_pt || '',
    title_en: initialData?.title_en || '',
    title_es: initialData?.title_es || '',
    title_zh: initialData?.title_zh || '',
    title_it: initialData?.title_it || '',
    excerpt_pt: initialData?.excerpt_pt || '',
    excerpt_en: initialData?.excerpt_en || '',
    excerpt_es: initialData?.excerpt_es || '',
    excerpt_zh: initialData?.excerpt_zh || '',
    excerpt_it: initialData?.excerpt_it || '',
    content_pt: initialData?.content_pt || '',
    content_en: initialData?.content_en || '',
    content_es: initialData?.content_es || '',
    content_zh: initialData?.content_zh || '',
    content_it: initialData?.content_it || '',
    ...initialData,
  }));

  // Update form when initialData changes
  React.useEffect(() => {
    if (initialData) {
      setFormData({
        slug: initialData.slug || '',
        category: initialData.category || 'Tecnologia',
        image_url: initialData.image_url || '',
        is_published: initialData.is_published || false,
        title_pt: initialData.title_pt || '',
        title_en: initialData.title_en || '',
        title_es: initialData.title_es || '',
        title_zh: initialData.title_zh || '',
        title_it: initialData.title_it || '',
        excerpt_pt: initialData.excerpt_pt || '',
        excerpt_en: initialData.excerpt_en || '',
        excerpt_es: initialData.excerpt_es || '',
        excerpt_zh: initialData.excerpt_zh || '',
        excerpt_it: initialData.excerpt_it || '',
        content_pt: initialData.content_pt || '',
        content_en: initialData.content_en || '',
        content_es: initialData.content_es || '',
        content_zh: initialData.content_zh || '',
        content_it: initialData.content_it || '',
        ...initialData,
      });
    }
  }, [initialData]);

  const updateField = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    setUploadingImage(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}-${Date.now()}.${fileExt}`;
      const filePath = `content-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      updateField('image_url', urlData.publicUrl);
      toast.success('Imagem carregada com sucesso!');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Erro ao carregar imagem: ' + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  // Generate image with AI using ai-hub
  const generateImageWithAI = async () => {
    const title = formData.title_pt || formData.title_en || 'Reciclagem de pneus OTR';
    const category = formData.category || 'Tecnologia';
    
    setIsGeneratingImage(true);
    
    try {
      const prompt = `Professional corporate image for ${type === 'article' ? 'blog article' : 'press release'} about: "${title}". 
        Category: ${category}. 
        Style: Modern, clean, corporate, industrial recycling theme with green sustainability focus. 
        Include elements like: recycled rubber products, industrial machinery, eco-friendly symbols, professional lighting.
        Aspect ratio: 16:9 landscape banner format. Ultra high resolution.`;

      const response = await supabase.functions.invoke('ai-hub', {
        body: {
          action: 'image',
          prompt,
        },
      });

      if (response.error) throw response.error;
      
      const { image_base64, provider } = response.data;
      
      if (!image_base64) {
        throw new Error('Nenhuma imagem gerada');
      }

      // Convert base64 to blob and upload
      const byteCharacters = atob(image_base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });

      const fileName = `${type}-ai-${Date.now()}.jpg`;
      const filePath = `content-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, blob, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      updateField('image_url', urlData.publicUrl);
      toast.success(`Imagem gerada com ${provider}!`, {
        description: 'Imagem decorativa criada e enviada automaticamente',
      });
    } catch (error: any) {
      console.error('AI Image error:', error);
      toast.error('Erro ao gerar imagem: ' + error.message);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // AI Content Generation using GEMINI directly
  const generateWithGemini = async (targetLang?: string) => {
    setIsGenerating(true);
    setGenerationStep(0);
    setActiveTab('ai-progress');

    try {
      const stepInterval = setInterval(() => {
        setGenerationStep(prev => Math.min(prev + 1, 3));
      }, 1500);

      const title = formData.title_pt || formData.title_en || 'Novo conteúdo sobre reciclagem OTR';
      const context = formData.content_pt || formData.excerpt_pt || '';
      const lang = targetLang || 'pt';

      const langName = lang === 'pt' ? 'Portuguese' : lang === 'en' ? 'English' : 
                       lang === 'es' ? 'Spanish' : lang === 'zh' ? 'Chinese' : 'Italian';

      const systemPrompt = type === 'article' 
        ? `You are a professional content writer for ELP Green Technology, specializing in OTR tire recycling and sustainable technology. 
           Write a compelling blog article in ${langName} with proper Markdown formatting.
           Include: engaging introduction, key benefits, technical details, environmental impact, and call-to-action.
           Use headers (##), bullet points, and bold text for emphasis.
           Length: 800-1200 words. Tone: Professional but accessible.`
        : `You are a PR professional for ELP Green Technology. 
           Write a formal press release in ${langName} with proper journalistic structure.
           Include: strong headline, lead paragraph with 5Ws, body with quotes and details, boilerplate.
           Use the inverted pyramid style. Length: 400-600 words.`;

      const userPrompt = `
        Create ${type === 'article' ? 'a blog article' : 'a press release'} about: "${title}"
        Category: ${formData.category || 'Tecnologia'}
        ${context ? `Additional context: ${context}` : ''}
        
        Company info: ELP Green Technology - Global leader in OTR (Off-The-Road) giant tire recycling, 
        partnered with TOPS Recycling (China). Focus on sustainability, circular economy, and industrial innovation.
        
        IMPORTANT:
        - Start with a compelling headline as # (H1)
        - Write the full content in ${langName}
        - Use data and statistics when possible
        - Mention environmental benefits (CO2 reduction, waste diversion)
        - Include a clear call-to-action at the end
        - Format with proper Markdown (##, ###, **, -, etc.)
      `;

      // Call ai-hub with Gemini preference
      const response = await supabase.functions.invoke('ai-hub', {
        body: {
          action: 'text',
          prompt: userPrompt,
          systemPrompt,
          modelPreference: 'gemini', // Force Gemini
          maxTokens: 3000,
        },
      });

      clearInterval(stepInterval);
      setGenerationStep(4);

      if (response.error) throw response.error;
      
      const { content, provider } = response.data;
      
      if (!content) {
        throw new Error('Nenhum conteúdo gerado');
      }

      // Calculate a simple quality score based on content length and structure
      const hasHeadings = (content.match(/^#+\s/gm) || []).length;
      const hasBullets = (content.match(/^[-*]\s/gm) || []).length;
      const wordCount = content.split(/\s+/).length;
      const score = Math.min(100, Math.round(
        (hasHeadings * 10) + (hasBullets * 5) + (wordCount > 500 ? 30 : wordCount / 20) + 40
      ));
      setAiScore(score);

      // Extract title from content (first # heading)
      const titleMatch = content.match(/^#\s+(.+)$/m);
      const extractedTitle = titleMatch ? titleMatch[1].trim() : title;

      // Extract excerpt (first paragraph after title, excluding headers)
      const contentWithoutTitle = content.replace(/^#\s+.+$/m, '').trim();
      const excerptMatch = contentWithoutTitle.match(/^(?!#)([A-Z].{50,250})/m);
      const extractedExcerpt = excerptMatch ? excerptMatch[1].trim() : '';

      // Update form with generated content
      updateField(`title_${lang}`, extractedTitle);
      updateField(`content_${lang}`, content);
      if (type === 'article') {
        updateField(`excerpt_${lang}`, extractedExcerpt);
      }

      // Generate slug if empty
      if (!formData.slug) {
        const slug = extractedTitle
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .substring(0, 60);
        updateField('slug', slug);
      }

      toast.success(`Conteúdo gerado com Gemini! Score: ${score}/100`, {
        description: `Provider: ${provider} • ${wordCount} palavras`,
      });

      setActiveTab('editor');
      setActiveLang(lang);

    } catch (error: any) {
      console.error('Gemini Generation error:', error);
      toast.error('Erro na geração: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Translate content to all languages using Gemini
  const translateToAllLanguages = async () => {
    if (!formData.content_pt) {
      toast.error('Primeiro gere ou escreva o conteúdo em português');
      return;
    }

    setIsGenerating(true);
    setActiveTab('ai-progress');
    setGenerationStep(0);

    try {
      const targetLangs = ['en', 'es', 'zh', 'it'];
      const langNames: Record<string, string> = {
        en: 'English',
        es: 'Spanish', 
        zh: 'Chinese (Simplified)',
        it: 'Italian',
      };
      
      for (let i = 0; i < targetLangs.length; i++) {
        const lang = targetLangs[i];
        setGenerationStep(i + 1);

        const response = await supabase.functions.invoke('ai-hub', {
          body: {
            action: 'text',
            prompt: `
              Translate the following content to ${langNames[lang]}. 
              Maintain the exact same Markdown formatting (headings, bullets, bold).
              Keep technical terms in English when appropriate.
              Preserve the professional tone and SEO optimization.
              
              TITLE: ${formData.title_pt}
              
              CONTENT:
              ${formData.content_pt}
              
              ${type === 'article' ? `EXCERPT: ${formData.excerpt_pt}` : ''}
            `,
            systemPrompt: `You are a professional translator for corporate content. 
              Translate accurately while adapting idioms and expressions naturally.
              Return the translated content in the same Markdown format.`,
            modelPreference: 'gemini',
            maxTokens: 3500,
          },
        });

        if (response.data?.content) {
          const translatedContent = response.data.content;
          
          // Extract title from translation
          const titleMatch = translatedContent.match(/^#\s+(.+)$/m);
          if (titleMatch) {
            updateField(`title_${lang}`, titleMatch[1].trim());
          }
          updateField(`content_${lang}`, translatedContent);
          
          if (type === 'article') {
            const contentWithoutTitle = translatedContent.replace(/^#\s+.+$/m, '').trim();
            const excerptMatch = contentWithoutTitle.match(/^(?!#)([A-Z].{50,200})/m);
            if (excerptMatch) {
              updateField(`excerpt_${lang}`, excerptMatch[1].trim());
            }
          }
        }
      }

      toast.success('Traduzido para todos os idiomas com Gemini!');
      setActiveTab('editor');

    } catch (error: any) {
      console.error('Translation error:', error);
      toast.error('Erro na tradução: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const stepLabels = [
    { label: 'Analisando', desc: 'Processando contexto e tema...' },
    { label: 'Gerando', desc: 'Gemini criando conteúdo...' },
    { label: 'Otimizando', desc: 'Ajustando SEO e formatação...' },
    { label: 'Finalizado', desc: 'Conteúdo pronto!' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0 bg-gradient-to-r from-primary/5 to-green-500/5">
          <DialogTitle className="flex items-center gap-3">
            {type === 'article' ? (
              <FileText className="h-5 w-5 text-primary" />
            ) : (
              <FileText className="h-5 w-5 text-green-500" />
            )}
            {initialData?.id 
              ? `Editar ${type === 'article' ? 'Artigo' : 'Press Release'}` 
              : `Novo ${type === 'article' ? 'Artigo' : 'Press Release'}`}
            {aiScore && (
              <Badge variant="secondary" className="ml-2 bg-green-500/10 text-green-600">
                <Sparkles className="h-3 w-3 mr-1" />
                Gemini Score: {aiScore}/100
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Use IA Gemini para gerar conteúdo profissional com imagens decorativas
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="px-6 pt-2 flex-shrink-0">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="editor" className="gap-2">
                <FileText className="h-4 w-4" />
                Editor
              </TabsTrigger>
              <TabsTrigger value="ai-generate" className="gap-2">
                <Brain className="h-4 w-4" />
                Gemini AI
              </TabsTrigger>
              <TabsTrigger value="ai-progress" disabled={!isGenerating}>
                <Loader2 className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                Processando
              </TabsTrigger>
            </TabsList>
          </div>

          {/* EDITOR TAB */}
          <TabsContent value="editor" className="flex-1 min-h-0 px-6">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-6 pb-6">
                {/* Image Section */}
                <Card className="overflow-hidden border-2 border-dashed hover:border-primary/50 transition-colors">
                  <CardContent className="p-4">
                    <Label className="mb-2 block font-semibold">🖼️ Imagem de Capa</Label>
                    <div className="flex gap-4 items-start">
                      {formData.image_url ? (
                        <div className="relative w-56 h-32 rounded-xl overflow-hidden border-2 border-primary/20 shadow-lg">
                          <img 
                            src={formData.image_url} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-7 w-7 shadow-lg"
                            onClick={() => updateField('image_url', '')}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div 
                          className="w-56 h-32 rounded-xl border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                          <span className="text-xs text-muted-foreground mt-2">Clique ou arraste</span>
                        </div>
                      )}
                      <div className="flex-1 space-y-3">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingImage}
                          >
                            {uploadingImage ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Upload className="h-4 w-4 mr-2" />
                            )}
                            Upload
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={generateImageWithAI}
                            disabled={isGeneratingImage}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                          >
                            {isGeneratingImage ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Wand2 className="h-4 w-4 mr-2" />
                            )}
                            Gerar com IA
                          </Button>
                        </div>
                        <Input
                          placeholder="Ou cole uma URL de imagem..."
                          value={formData.image_url || ''}
                          onChange={(e) => updateField('image_url', e.target.value)}
                          className="text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                          💡 A IA gera imagens decorativas baseadas no título e categoria
                        </p>
                      </div>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </CardContent>
                </Card>

                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-semibold">🔗 Slug (URL)</Label>
                    <Input
                      value={formData.slug}
                      onChange={(e) => updateField('slug', e.target.value)}
                      placeholder="meu-artigo-sobre-reciclagem"
                      className="mt-1"
                    />
                  </div>
                  {type === 'article' && (
                    <div>
                      <Label className="font-semibold">📁 Categoria</Label>
                      <Select 
                        value={formData.category || 'Tecnologia'} 
                        onValueChange={(v) => updateField('category', v)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Switch
                    checked={formData.is_published || false}
                    onCheckedChange={(v) => updateField('is_published', v)}
                  />
                  <Label className="font-medium">🚀 Publicar imediatamente</Label>
                </div>

                <Separator />

                {/* Language Tabs for Content */}
                <Tabs value={activeLang} onValueChange={setActiveLang}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <TabsList>
                      {languages.map((lang) => (
                        <TabsTrigger key={lang.code} value={lang.code} className="gap-1">
                          <span>{lang.flag}</span>
                          <span className="hidden sm:inline">{lang.code.toUpperCase()}</span>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateWithGemini(activeLang)}
                        disabled={isGenerating}
                      >
                        <Brain className="h-4 w-4 mr-1" />
                        Gerar {activeLang.toUpperCase()}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={translateToAllLanguages}
                        disabled={isGenerating || !formData.content_pt}
                      >
                        <Languages className="h-4 w-4 mr-1" />
                        Traduzir Todos
                      </Button>
                    </div>
                  </div>

                  {languages.map((lang) => (
                    <TabsContent key={lang.code} value={lang.code} className="space-y-4 mt-4">
                      <div>
                        <Label className="font-semibold">📝 Título ({lang.label})</Label>
                        <Input
                          value={formData[`title_${lang.code}`] || ''}
                          onChange={(e) => updateField(`title_${lang.code}`, e.target.value)}
                          placeholder={`Título em ${lang.label}...`}
                          className="mt-1 text-lg font-medium"
                        />
                      </div>
                      
                      {type === 'article' && (
                        <div>
                          <Label className="font-semibold">📄 Resumo ({lang.label})</Label>
                          <Textarea
                            value={formData[`excerpt_${lang.code}`] || ''}
                            onChange={(e) => updateField(`excerpt_${lang.code}`, e.target.value)}
                            placeholder={`Resumo breve em ${lang.label}...`}
                            rows={2}
                            className="mt-1"
                          />
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="font-semibold">📖 Conteúdo ({lang.label})</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPreviewMode(!previewMode)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            {previewMode ? 'Editar' : 'Preview'}
                          </Button>
                        </div>
                        {previewMode ? (
                          <Card className="p-6 min-h-[300px] bg-background">
                            <MarkdownRenderer content={formData[`content_${lang.code}`] || ''} />
                          </Card>
                        ) : (
                          <Textarea
                            value={formData[`content_${lang.code}`] || ''}
                            onChange={(e) => updateField(`content_${lang.code}`, e.target.value)}
                            placeholder={`Conteúdo completo em ${lang.label}... (Markdown suportado)`}
                            rows={12}
                            className="font-mono text-sm"
                          />
                        )}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* AI GENERATE TAB */}
          <TabsContent value="ai-generate" className="flex-1 min-h-0 px-6">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-6 pb-6">
                <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                        <Brain className="h-8 w-8" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                          Google Gemini AI
                          <Badge variant="secondary" className="bg-green-500/20 text-green-700">
                            Recomendado
                          </Badge>
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Modelo avançado do Google para criar 
                          {type === 'article' ? ' artigos de blog' : ' press releases'} profissionais 
                          otimizados para SEO e alinhados com a marca ELP Green.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="border-green-500/50">✨ Gemini 2.0 Flash</Badge>
                          <Badge variant="outline" className="border-green-500/50">🎯 SEO Optimizado</Badge>
                          <Badge variant="outline" className="border-green-500/50">🌍 Multilíngue</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-4">
                  <div>
                    <Label className="font-semibold">✍️ Tema / Título sugerido</Label>
                    <Input
                      value={formData.title_pt || ''}
                      onChange={(e) => updateField('title_pt', e.target.value)}
                      placeholder="Ex: Inovações em Reciclagem de Pneus OTR em 2026"
                      className="mt-1 text-lg"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      💡 Deixe em branco para a IA sugerir um título
                    </p>
                  </div>

                  {type === 'article' && (
                    <div>
                      <Label className="font-semibold">📁 Categoria</Label>
                      <Select 
                        value={formData.category || 'Tecnologia'} 
                        onValueChange={(v) => updateField('category', v)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label className="font-semibold">📝 Contexto adicional (opcional)</Label>
                    <Textarea
                      value={formData.excerpt_pt || ''}
                      onChange={(e) => updateField('excerpt_pt', e.target.value)}
                      placeholder="Informações específicas, dados, eventos recentes que devem ser incluídos..."
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button
                    onClick={() => generateWithGemini('pt')}
                    disabled={isGenerating}
                    className="h-auto py-5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                    size="lg"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Sparkles className="h-6 w-6" />
                      <span className="font-semibold">Gerar em Português</span>
                    </div>
                  </Button>
                  <Button
                    onClick={() => generateWithGemini('en')}
                    disabled={isGenerating}
                    variant="outline"
                    className="h-auto py-5 border-2"
                    size="lg"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Sparkles className="h-6 w-6" />
                      <span className="font-semibold">Gerar em Inglês</span>
                    </div>
                  </Button>
                </div>

                <Card className="bg-purple-500/5 border-purple-500/20">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <Wand2 className="h-5 w-5 text-purple-500" />
                      <div className="flex-1">
                        <div className="font-medium text-sm">Gerar imagem decorativa com IA</div>
                        <div className="text-xs text-muted-foreground">
                          Cria uma imagem profissional baseada no título
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={generateImageWithAI}
                        disabled={isGeneratingImage}
                        className="bg-gradient-to-r from-purple-500 to-pink-500"
                      >
                        {isGeneratingImage ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <ImageIcon className="h-4 w-4 mr-1" />
                            Gerar
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <RefreshCw className="h-4 w-4" />
                      <span>
                        Após gerar em um idioma, use "Traduzir Todos" para criar versões em todos os idiomas
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* AI PROGRESS TAB */}
          <TabsContent value="ai-progress" className="flex-1 min-h-0 px-6">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-6 py-6">
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-600 mb-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="font-medium">Gemini gerando conteúdo...</span>
                  </div>
                  <Progress value={(generationStep / 4) * 100} className="h-2" />
                </div>

                <div className="space-y-3">
                  {stepLabels.map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ 
                        opacity: generationStep >= i ? 1 : 0.4,
                        x: 0,
                      }}
                      className={`flex items-center gap-4 p-4 rounded-lg border ${
                        generationStep === i 
                          ? 'border-green-500 bg-green-500/5' 
                          : generationStep > i 
                            ? 'border-green-500/30 bg-green-500/5' 
                            : 'border-muted'
                      }`}
                    >
                      <div className={`p-2 rounded-full ${
                        generationStep === i 
                          ? 'bg-green-500 text-white' 
                          : generationStep > i 
                            ? 'bg-green-500 text-white' 
                            : 'bg-muted'
                      }`}>
                        {generationStep > i ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : generationStep === i ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Brain className="h-4 w-4" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="font-medium">{step.label}</div>
                        <div className="text-sm text-muted-foreground">{step.desc}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter className="px-6 py-4 border-t flex-shrink-0 bg-muted/30">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={() => onSave(formData)} 
            disabled={isSaving || isGenerating}
            className="gap-2 bg-gradient-to-r from-primary to-green-600"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
