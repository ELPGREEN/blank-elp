import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Image,
  Mic,
  Newspaper,
  Languages,
  Loader2,
  Download,
  Copy,
  Check,
  Wand2,
  Brain,
  Zap
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';

export function AIAutomationHub() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('text');
  const [result, setResult] = useState<string>('');
  const [imageResult, setImageResult] = useState<string>('');
  const [provider, setProvider] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Form states
  const [textPrompt, setTextPrompt] = useState('');
  const [imagePrompt, setImagePrompt] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [newsTopic, setNewsTopic] = useState('reciclagem de pneus OTR');
  const [translateText, setTranslateText] = useState('');
  const [targetLang, setTargetLang] = useState('en');
  const [modelPref, setModelPref] = useState('auto');

  const aiMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { data, error } = await supabase.functions.invoke('ai-hub', { body: payload });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      setProvider(data.provider || 'unknown');
      
      if (data.content) setResult(data.content);
      if (data.summary) setResult(data.summary);
      if (data.text) setResult(data.text);
      if (data.translated) setResult(data.translated);
      if (data.image_base64) {
        setImageResult(`data:image/png;base64,${data.image_base64}`);
      }
      
      toast.success(`Gerado com sucesso via ${data.provider}`);
    },
    onError: (error: Error) => {
      toast.error('Erro: ' + error.message);
    }
  });

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copiado!');
  };

  const downloadImage = () => {
    if (!imageResult) return;
    const link = document.createElement('a');
    link.href = imageResult;
    link.download = `ai-generated-${Date.now()}.png`;
    link.click();
  };

  const tabs = [
    { id: 'text', label: 'Texto', icon: Wand2, description: 'Gerar conteúdo com IA' },
    { id: 'image', label: 'Imagem', icon: Image, description: 'Criar imagens com Stable Diffusion' },
    { id: 'transcribe', label: 'Transcrição', icon: Mic, description: 'Audio para texto (Whisper)' },
    { id: 'news', label: 'Notícias', icon: Newspaper, description: 'Resumir tendências do setor' },
    { id: 'translate', label: 'Tradução', icon: Languages, description: 'Traduzir conteúdo' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5">
          <Brain className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Central de Automação IA</h2>
          <p className="text-muted-foreground">Ferramentas de IA gratuitas para automação do site</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-5 mb-6">
              {tabs.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                  <tab.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* TEXT GENERATION */}
            <TabsContent value="text" className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Modelo Preferido</Label>
                  <Select value={modelPref} onValueChange={setModelPref}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">🔄 Auto (fallback)</SelectItem>
                      <SelectItem value="groq">⚡ Groq (mais rápido)</SelectItem>
                      <SelectItem value="gemini">🌟 Gemini</SelectItem>
                      <SelectItem value="anthropic">🧠 Claude</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Prompt</Label>
                  <Textarea
                    value={textPrompt}
                    onChange={(e) => setTextPrompt(e.target.value)}
                    placeholder="Escreva um artigo sobre reciclagem de pneus OTR para o blog da ELP Green..."
                    rows={4}
                  />
                </div>

                <Button 
                  onClick={() => aiMutation.mutate({ action: 'text', prompt: textPrompt, model_preference: modelPref })}
                  disabled={!textPrompt || aiMutation.isPending}
                  className="gap-2"
                >
                  {aiMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Gerar Texto
                </Button>
              </div>
            </TabsContent>

            {/* IMAGE GENERATION */}
            <TabsContent value="image" className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Descrição da Imagem (inglês recomendado)</Label>
                  <Textarea
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    placeholder="A modern industrial tire recycling facility with green technology, professional photography, high quality"
                    rows={3}
                  />
                </div>

                <Button 
                  onClick={() => aiMutation.mutate({ action: 'image', image_prompt: imagePrompt })}
                  disabled={!imagePrompt || aiMutation.isPending}
                  className="gap-2"
                >
                  {aiMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Image className="h-4 w-4" />}
                  Gerar Imagem
                </Button>

                {imageResult && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <img src={imageResult} alt="Generated" className="rounded-lg max-w-md mx-auto" />
                    <Button variant="outline" onClick={downloadImage} className="gap-2">
                      <Download className="h-4 w-4" />
                      Baixar Imagem
                    </Button>
                  </motion.div>
                )}
              </div>
            </TabsContent>

            {/* TRANSCRIPTION */}
            <TabsContent value="transcribe" className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>URL do Áudio (MP3, WAV, etc.)</Label>
                  <Input
                    value={audioUrl}
                    onChange={(e) => setAudioUrl(e.target.value)}
                    placeholder="https://exemplo.com/audio-reuniao.mp3"
                  />
                  <p className="text-xs text-muted-foreground">
                    Cole a URL de um arquivo de áudio para transcrever. Usa Groq Whisper (ultra rápido).
                  </p>
                </div>

                <Button 
                  onClick={() => aiMutation.mutate({ action: 'transcribe', audio_url: audioUrl })}
                  disabled={!audioUrl || aiMutation.isPending}
                  className="gap-2"
                >
                  {aiMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
                  Transcrever
                </Button>
              </div>
            </TabsContent>

            {/* NEWS SUMMARY */}
            <TabsContent value="news" className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Tópico para Pesquisar</Label>
                  <Input
                    value={newsTopic}
                    onChange={(e) => setNewsTopic(e.target.value)}
                    placeholder="reciclagem de pneus OTR, economia circular, ESG..."
                  />
                </div>

                <Button 
                  onClick={() => aiMutation.mutate({ action: 'summarize_news', news_topic: newsTopic })}
                  disabled={!newsTopic || aiMutation.isPending}
                  className="gap-2"
                >
                  {aiMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Newspaper className="h-4 w-4" />}
                  Gerar Resumo de Notícias
                </Button>
              </div>
            </TabsContent>

            {/* TRANSLATION */}
            <TabsContent value="translate" className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Texto para Traduzir</Label>
                  <Textarea
                    value={translateText}
                    onChange={(e) => setTranslateText(e.target.value)}
                    placeholder="Cole aqui o texto que deseja traduzir..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Idioma de Destino</Label>
                  <Select value={targetLang} onValueChange={setTargetLang}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">🇺🇸 Inglês</SelectItem>
                      <SelectItem value="pt">🇧🇷 Português</SelectItem>
                      <SelectItem value="es">🇪🇸 Espanhol</SelectItem>
                      <SelectItem value="it">🇮🇹 Italiano</SelectItem>
                      <SelectItem value="zh">🇨🇳 Chinês</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={() => aiMutation.mutate({ action: 'translate', text_to_translate: translateText, target_language: targetLang })}
                  disabled={!translateText || aiMutation.isPending}
                  className="gap-2"
                >
                  {aiMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Languages className="h-4 w-4" />}
                  Traduzir
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* RESULTS SECTION */}
          <AnimatePresence>
            {result && activeTab !== 'image' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-6 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-1">
                      <Zap className="h-3 w-3" />
                      {provider}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="sm" onClick={copyToClipboard} className="gap-2">
                    {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Copiado!' : 'Copiar'}
                  </Button>
                </div>

                <Card className="bg-muted/50">
                  <CardContent className="pt-4 prose prose-sm dark:prose-invert max-w-none">
                    <MarkdownRenderer content={result} />
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
