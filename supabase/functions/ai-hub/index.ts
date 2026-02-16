import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// API Keys
const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const HUGGINGFACE_API_KEY = Deno.env.get('HUGGINGFACE_API_KEY');
const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');

// Gemini API Keys Pool - 7 keys with automatic rotation when hitting rate limits
const GEMINI_API_KEYS = [
  Deno.env.get('GEMINI_API_KEY'),
  Deno.env.get('GEMINI_API_KEY_2'),
  Deno.env.get('GEMINI_API_KEY_3'),
  Deno.env.get('GEMINI_API_KEY_4'),
  Deno.env.get('GEMINI_API_KEY_5'),
  Deno.env.get('GEMINI_API_KEY_6'),
  Deno.env.get('GEMINI_API_KEY_7'),
].filter(Boolean) as string[];

// Track which Gemini key to use (cycles through on rate limits)
let currentGeminiKeyIndex = 0;
// Track failed keys to avoid retrying them immediately
const failedKeys = new Set<number>();
const KEY_COOLDOWN_MS = 60000; // 1 minute cooldown for failed keys
const failedKeyTimestamps = new Map<number, number>();

function getNextGeminiKey(): string | null {
  if (GEMINI_API_KEYS.length === 0) return null;
  
  // Clean up expired cooldowns
  const now = Date.now();
  for (const [keyIndex, timestamp] of failedKeyTimestamps) {
    if (now - timestamp > KEY_COOLDOWN_MS) {
      failedKeys.delete(keyIndex);
      failedKeyTimestamps.delete(keyIndex);
    }
  }
  
  // Find next available key that isn't in cooldown
  let attempts = 0;
  while (attempts < GEMINI_API_KEYS.length) {
    if (!failedKeys.has(currentGeminiKeyIndex)) {
      return GEMINI_API_KEYS[currentGeminiKeyIndex];
    }
    currentGeminiKeyIndex = (currentGeminiKeyIndex + 1) % GEMINI_API_KEYS.length;
    attempts++;
  }
  
  // All keys in cooldown, use the oldest failed one
  console.log('⚠️ All Gemini keys in cooldown, using oldest failed key');
  return GEMINI_API_KEYS[currentGeminiKeyIndex];
}

function rotateGeminiKey(markAsFailed: boolean = false): void {
  if (markAsFailed) {
    failedKeys.add(currentGeminiKeyIndex);
    failedKeyTimestamps.set(currentGeminiKeyIndex, Date.now());
    console.log(`⛔ Gemini key ${currentGeminiKeyIndex + 1} marked as failed (cooldown: ${KEY_COOLDOWN_MS/1000}s)`);
  }
  
  if (GEMINI_API_KEYS.length > 1) {
    const oldIndex = currentGeminiKeyIndex;
    currentGeminiKeyIndex = (currentGeminiKeyIndex + 1) % GEMINI_API_KEYS.length;
    console.log(`🔄 Rotating Gemini key ${oldIndex + 1} → ${currentGeminiKeyIndex + 1} (${GEMINI_API_KEYS.length} total)`);
  }
}

function getGeminiPoolStatus(): string {
  const available = GEMINI_API_KEYS.length - failedKeys.size;
  return `${available}/${GEMINI_API_KEYS.length} available`;
}

console.log(`AI Hub v4 - Groq: ${GROQ_API_KEY ? '✅' : '❌'}, Gemini: ${GEMINI_API_KEYS.length}/7 keys, Anthropic: ${ANTHROPIC_API_KEY ? '✅' : '❌'}, HuggingFace: ${HUGGINGFACE_API_KEY ? '✅' : '❌'}, Firecrawl: ${FIRECRAWL_API_KEY ? '✅' : '❌'}`);

// ========== FIRECRAWL WEB SEARCH ==========
async function searchWeb(query: string): Promise<string> {
  if (!FIRECRAWL_API_KEY) return '';
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, limit: 3, scrapeOptions: { formats: ['markdown'] } }),
    });
    if (!response.ok) return '';
    const data = await response.json();
    const results = data.data || [];
    return results.map((r: any) => r.markdown?.substring(0, 300) || '').filter(Boolean).join('\n\n');
  } catch { return ''; }
}

interface AIRequest {
   action: 'text' | 'image' | 'transcribe' | 'summarize_news' | 'translate' | 'translate_document' | 'classify' | 'embeddings' | 'sentiment' | 'correct_grammar' | 'generate_summary' | 'generate_document' | 'correct_document';
  prompt?: string;
  audio_url?: string;
  image_prompt?: string;
  news_topic?: string;
  text_to_translate?: string;
  target_language?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  preserveFormatting?: boolean;
  model_preference?: 'groq' | 'gemini' | 'anthropic' | 'huggingface' | 'auto';
  max_tokens?: number;
  // New HuggingFace specific
  text_to_classify?: string;
  labels?: string[];
  text_for_embeddings?: string;
  text_for_sentiment?: string;
  // Report generator specific
  text?: string;
  language?: string;
  style?: string;
  maxLines?: number;
  // Document generator specific
  documentDescription?: string;
  documentType?: 'proposal' | 'report' | 'contract' | 'loi' | 'mou' | 'analysis' | 'custom';
  companyContext?: string;
  includeWebResearch?: boolean;
   // Document correction specific
   country?: string;
   countryLaws?: string;
   documentTypeName?: string;
   minimumCharacters?: number;
}

// Helper function for retry with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      if (attempt === maxRetries) throw error;
      // Check if it's a retryable error (429 rate limit or 529 overloaded)
      if (error?.status === 429 || error?.status === 529) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retries exceeded');
}

// ========== TEXT GENERATION (Multi-provider with fallback - prioritizes Gemini) ==========
async function generateText(prompt: string, modelPref: string = 'auto', maxTokens: number = 2048): Promise<{ content: string; provider: string }> {
  // Cap max_tokens for different providers
  const anthropicMaxTokens = Math.min(maxTokens, 4000); // Claude 3 Haiku limit is 4096
  const groqMaxTokens = Math.min(maxTokens, 32000); // Groq llama-3.3-70b limit is 32768
  // Prioritize Gemini first (user preference), then Groq, then Anthropic (paid last)
  const providers = modelPref === 'auto' 
    ? ['gemini', 'groq', 'anthropic'] 
    : [modelPref, 'gemini', 'groq', 'anthropic'].filter((v, i, a) => a.indexOf(v) === i);

  for (const provider of providers) {
    try {
      // ===== GROQ with retry =====
      if (provider === 'groq' && GROQ_API_KEY) {
        const tryGroq = async (): Promise<{ content: string; provider: string } | null> => {
          console.log('Trying Groq (FREE)...');
          const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
              model: 'llama-3.3-70b-versatile',
              messages: [{ role: 'user', content: prompt }],
              max_tokens: groqMaxTokens,
              temperature: 0.7
            })
          });

          if (response.ok) {
            const data = await response.json();
            const content = data.choices?.[0]?.message?.content;
            if (content) {
              console.log('Groq success (FREE)');
              return { content, provider: 'groq (gratuito)' };
            }
            return null;
          } else if (response.status === 429 || response.status === 529 || response.status === 503) {
            console.log(`Groq ${response.status} (rate-limited/overloaded), will retry...`);
            const err = new Error('Groq overloaded') as any;
            err.status = response.status;
            throw err;
          } else {
            const error = await response.text();
            console.error(`Groq error ${response.status}: ${error.substring(0, 200)}`);
            return null;
          }
        };

        try {
          const result = await retryWithBackoff(tryGroq, 2, 1500);
          if (result) return result;
        } catch (e: any) {
          console.log(`Groq failed after retries: ${e.message}`);
        }
      }

      // ===== GEMINI with 7 keys rotation =====
      if (provider === 'gemini' && GEMINI_API_KEYS.length > 0) {
        // Try each Gemini key until one works
        for (let keyAttempt = 0; keyAttempt < GEMINI_API_KEYS.length; keyAttempt++) {
          const currentKey = getNextGeminiKey();
          if (!currentKey) break;
          const keyIndex = currentGeminiKeyIndex;

          const tryGemini = async (): Promise<{ content: string; provider: string } | null> => {
            console.log(`🔑 Trying Gemini key ${keyIndex + 1}/${GEMINI_API_KEYS.length} (${getGeminiPoolStatus()})`);
            const response = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${currentKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: prompt }] }],
                  generationConfig: { temperature: 0.7, maxOutputTokens: maxTokens }
                })
              }
            );

            if (response.ok) {
              const data = await response.json();
              const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
              if (content) {
                console.log(`✅ Gemini key ${keyIndex + 1} success (FREE)`);
                return { content, provider: `gemini-${keyIndex + 1}/${GEMINI_API_KEYS.length} (gratuito)` };
              }
              return null;
            } else if (response.status === 429 || response.status === 529 || response.status === 503) {
              const errorText = await response.text();
              console.log(`⚠️ Gemini key ${keyIndex + 1} rate-limited (${response.status}): ${errorText.substring(0, 100)}`);
              // Rotate to next key and mark as failed
              rotateGeminiKey(true);
              const err = new Error('Gemini rate-limited, trying next key') as any;
              err.status = response.status;
              err.shouldRotate = true;
              throw err;
            } else {
              const error = await response.text();
              console.error(`❌ Gemini key ${keyIndex + 1} error ${response.status}: ${error.substring(0, 200)}`);
              return null;
            }
          };

          try {
            const result = await retryWithBackoff(tryGemini, 1, 1000);
            if (result) return result;
          } catch (e: any) {
            if (e.shouldRotate) {
              console.log(`🔄 Key ${keyIndex + 1} exhausted, trying next...`);
              continue; // Try next key
            }
            console.log(`Gemini key ${keyIndex + 1} failed: ${e.message}`);
          }
        }
        console.log(`⛔ All ${GEMINI_API_KEYS.length} Gemini keys exhausted, falling back to other providers`);
      }

      // ===== ANTHROPIC with retry =====
      if (provider === 'anthropic' && ANTHROPIC_API_KEY) {
        const tryAnthropic = async (): Promise<{ content: string; provider: string } | null> => {
          console.log('Trying Anthropic (PAID - last resort)...');
          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': ANTHROPIC_API_KEY!,
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
              model: 'claude-3-haiku-20240307',
              max_tokens: anthropicMaxTokens,
              messages: [{ role: 'user', content: prompt }]
            })
          });

          if (response.ok) {
            const data = await response.json();
            const content = data.content?.[0]?.text;
            if (content) {
              console.log('Anthropic success (PAID)');
              return { content, provider: 'anthropic (pago)' };
            }
            return null;
          } else if (response.status === 429 || response.status === 529 || response.status === 503) {
            const errorText = await response.text();
            console.log(`Anthropic ${response.status} (overloaded/rate-limited): ${errorText.substring(0, 100)}`);
            const err = new Error('Anthropic overloaded') as any;
            err.status = response.status;
            throw err;
          } else {
            const error = await response.text();
            console.error(`Anthropic error ${response.status}: ${error.substring(0, 200)}`);
            return null;
          }
        };

        try {
          const result = await retryWithBackoff(tryAnthropic, 2, 2000);
          if (result) return result;
        } catch (e: any) {
          console.log(`Anthropic failed after retries: ${e.message}`);
        }
      }
    } catch (error) {
      console.error(`Provider ${provider} failed:`, error);
    }
  }

  throw new Error('All AI providers failed');
}

// ========== IMAGE GENERATION (Hugging Face - FREE) ==========
async function generateImage(prompt: string): Promise<{ image_base64: string; provider: string }> {
  if (!HUGGINGFACE_API_KEY) {
    throw new Error('Hugging Face API key not configured');
  }

  console.log('Generating image with Hugging Face FLUX.1 (FREE)...');
  
  const response = await fetch(
    'https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: prompt
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Image generation error:', error);
    throw new Error(`Image generation failed: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  
  // Convert to base64 in chunks to avoid stack overflow
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  const base64 = btoa(binary);
  
  console.log('Image generated successfully (FREE), size:', uint8Array.length);
  return { image_base64: base64, provider: 'huggingface-flux (gratuito)' };
}

// ========== ZERO-SHOT CLASSIFICATION (HuggingFace - FREE, with Gemini fallback) ==========
async function classifyText(text: string, labels: string[]): Promise<{ classifications: { label: string; score: number }[]; provider: string }> {
  // Try HuggingFace first
  if (HUGGINGFACE_API_KEY) {
    try {
      console.log('Classifying text with HuggingFace BART-MNLI (FREE)...');
      const response = await fetch(
        'https://router.huggingface.co/hf-inference/models/facebook/bart-large-mnli',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: text.substring(0, 2000),
            parameters: {
              candidate_labels: labels,
              multi_label: true
            }
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('Classification response:', JSON.stringify(data).substring(0, 200));
        const classifications = (data.labels || []).map((label: string, i: number) => ({
          label,
          score: data.scores?.[i] || 0
        }));
        if (classifications.length > 0) {
          return { classifications, provider: 'huggingface-bart (gratuito)' };
        }
      }
      console.log('HuggingFace classification returned empty, falling back to Gemini...');
    } catch (e) {
      console.log('HuggingFace classification failed, falling back to Gemini...');
    }
  }

  // Fallback: use Gemini for classification
  const classPrompt = `Classify this text into these categories: ${labels.join(', ')}. Text: "${text}". Return ONLY valid JSON array: [{"label":"category","score":0.95}]`;
  try {
    const result = await generateText(classPrompt, 'gemini', 512);
    const jsonMatch = result.content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const classifications = JSON.parse(jsonMatch[0]);
      return { classifications, provider: result.provider };
    }
  } catch {}
  return { classifications: labels.map(l => ({ label: l, score: 0 })), provider: 'fallback' };
}

// ========== TEXT EMBEDDINGS (HuggingFace - FREE) ==========
async function generateEmbeddings(text: string): Promise<{ embeddings: number[]; provider: string }> {
  if (!HUGGINGFACE_API_KEY) {
    throw new Error('Hugging Face API key not configured');
  }

  console.log('Generating embeddings with HuggingFace (FREE)...');
  
  const response = await fetch(
    'https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {
          source_sentence: text.substring(0, 512),
          sentences: [text.substring(0, 512)]
        }
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Embeddings error:', error);
    throw new Error(`Embeddings failed: ${response.status}`);
  }

  const data = await response.json();
  const embeddings = Array.isArray(data[0]) ? data[0] : data;
  console.log('Embeddings generated (FREE), dimensions:', embeddings.length);
  
  return { embeddings, provider: 'huggingface-minilm (gratuito)' };
}

// ========== SENTIMENT ANALYSIS (HuggingFace - FREE) ==========
async function analyzeSentiment(text: string): Promise<{ sentiment: { label: string; score: number }[]; provider: string }> {
  if (!HUGGINGFACE_API_KEY) {
    throw new Error('Hugging Face API key not configured');
  }

  console.log('Analyzing sentiment with HuggingFace (FREE)...');
  
  const response = await fetch(
    'https://router.huggingface.co/hf-inference/models/nlptown/bert-base-multilingual-uncased-sentiment',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: text.substring(0, 512)
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Sentiment error:', error);
    throw new Error(`Sentiment analysis failed: ${response.status}`);
  }

  const data = await response.json();
  console.log('Sentiment analyzed (FREE)');
  
  // Format: [[{label: "5 stars", score: 0.9}, ...]]
  const sentiment = data[0] || [];
  
  return { sentiment, provider: 'huggingface-sentiment (gratuito)' };
}

// ========== AUDIO TRANSCRIPTION (Groq Whisper - FREE) ==========
async function transcribeAudio(audioUrl: string): Promise<{ text: string; provider: string }> {
  if (!GROQ_API_KEY) {
    throw new Error('Groq API key not configured for transcription');
  }

  console.log('Fetching audio from URL...');
  const audioResponse = await fetch(audioUrl);
  if (!audioResponse.ok) {
    throw new Error('Failed to fetch audio file');
  }
  
  const audioBlob = await audioResponse.blob();
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.mp3');
  formData.append('model', 'whisper-large-v3-turbo');
  formData.append('language', 'pt');
  formData.append('response_format', 'text');

  console.log('Transcribing with Groq Whisper (FREE)...');
  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: formData
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Transcription error:', error);
    throw new Error(`Transcription failed: ${response.status}`);
  }

  const text = await response.text();
  console.log('Transcription completed (FREE)');
  return { text, provider: 'groq-whisper (gratuito)' };
}

// ========== NEWS SUMMARIZATION ==========
async function summarizeNews(topic: string): Promise<{ summary: string; provider: string }> {
  const prompt = `Você é um especialista em notícias sobre reciclagem, ESG e economia circular.

Pesquise e resuma as últimas notícias relevantes sobre o seguinte tópico:

TÓPICO: ${topic}

CONTEXTO: ELP Green Technology é uma empresa focada em reciclagem de pneus OTR (fora de estrada), pirólise e economia circular no Brasil e internacionalmente.

Forneça:
1. **Resumo Executivo** (2-3 parágrafos sobre as principais notícias)
2. **Pontos-Chave** (5-7 bullet points com os destaques)
3. **Tendências Identificadas** (análise de tendências do setor)
4. **Oportunidades para ELP Green** (como a empresa pode se beneficiar)

Use um tom profissional e corporativo. Formate em Markdown.`;

  const result = await generateText(prompt, 'auto', 3000);
  return { summary: result.content, provider: result.provider };
}

// ========== TRANSLATION ==========
async function translateText(text: string, targetLanguage: string): Promise<{ translated: string; provider: string }> {
  const langNames: Record<string, string> = {
    'pt': 'português brasileiro',
    'en': 'inglês',
    'es': 'espanhol',
    'it': 'italiano',
    'zh': 'chinês simplificado'
  };

  const prompt = `Traduza o seguinte texto para ${langNames[targetLanguage] || targetLanguage}. 
Mantenha o tom profissional e o significado original.

TEXTO:
${text}

TRADUÇÃO:`;

  const result = await generateText(prompt, 'groq', 2000);
  return { translated: result.content, provider: result.provider };
}

// ========== GRAMMAR CORRECTION ==========
async function correctGrammar(text: string, language: string = 'pt-BR', style: string = 'formal_business'): Promise<{ correctedText: string; provider: string }> {
  const styleGuide = style === 'formal_business' 
    ? 'formal empresarial brasileiro, com linguagem jurídica quando apropriado' 
    : 'profissional e objetivo';

  const prompt = `Você é um revisor de textos especializado em documentos empresariais.

TAREFA: Corrija gramática, ortografia e formatação do texto abaixo.

REGRAS:
1. Mantenha o significado e tom original
2. Use estilo ${styleGuide}
3. Corrija erros de português (acentuação, concordância, pontuação)
4. Melhore a clareza e legibilidade
5. NÃO adicione conteúdo novo
6. NÃO remova informações
7. Mantenha a estrutura de seções e listas
8. Formate corretamente: seções em MAIÚSCULAS, listas com "-", checkboxes com "☐"

TEXTO ORIGINAL:
${text}

TEXTO CORRIGIDO (apenas o texto, sem explicações):`;

  const result = await generateText(prompt, 'groq', 4000);
  return { correctedText: result.content.trim(), provider: result.provider };
}

// ========== EXECUTIVE SUMMARY GENERATION ==========
async function generateSummary(text: string, maxLines: number = 8, language: string = 'pt-BR'): Promise<{ summary: string; provider: string }> {
  const prompt = `Você é um executivo sênior especializado em análises empresariais.

TAREFA: Gere um resumo executivo conciso do texto abaixo.

REGRAS:
1. Máximo de ${maxLines} linhas
2. Capture os pontos mais importantes
3. Use tom profissional e objetivo
4. Destaque: objetivo principal, decisões tomadas e próximos passos
5. Escreva em ${language === 'pt-BR' ? 'português brasileiro' : 'inglês'}
6. Não use markdown ou formatação especial

TEXTO:
${text}

RESUMO EXECUTIVO (${maxLines} linhas máximo):`;

  const result = await generateText(prompt, 'groq', 1000);
  return { summary: result.content.trim(), provider: result.provider };
}

// ========== DOCUMENT TRANSLATION ==========
const LANGUAGE_NAMES: Record<string, string> = {
  pt: 'Português Brasileiro',
  en: 'English',
  es: 'Español',
  it: 'Italiano',
  zh: '繁體中文 (Traditional Chinese)'
};

const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  pt: 'Use Brazilian Portuguese with formal business tone.',
  en: 'Use formal American English.',
  es: 'Use formal Latin American Spanish.',
  it: 'Use formal Italian.',
  zh: 'Use Traditional Chinese (繁體中文). Write ALL text using Chinese characters. Do NOT use pinyin or romanization. Maintain formal business tone.'
};

async function translateDocument(
  text: string, 
  targetLanguage: string, 
  sourceLanguage: string = 'auto',
  preserveFormatting: boolean = true
): Promise<{ translatedText: string; provider: string }> {
  const targetLangName = LANGUAGE_NAMES[targetLanguage] || targetLanguage;
  
  // For very short texts, return as-is if they don't need translation
  const trimmedText = text.trim();
  if (trimmedText.length < 5) {
    return { translatedText: trimmedText, provider: 'passthrough' };
  }
  
  const langInstructions = LANGUAGE_INSTRUCTIONS[targetLanguage] || `Translate to ${targetLangName}.`;
  
  const formattingRules = preserveFormatting ? `
FORMATTING RULES (MANDATORY):
- Keep EXACTLY the same structure (same number of sections, paragraphs, lines)
- Translate sections in UPPERCASE to UPPERCASE in target language (except Chinese which has no uppercase)
- Keep lists with "-" or "•" in the same format
- Preserve checkboxes "☐" and their position
- Keep item numbering (1., 2., etc.)
- Preserve line breaks and spacing
- NEVER add content that wasn't in the original
- NEVER remove content from the original
- NEVER add markdown or formatting not in the original` : '';

  const prompt = `You are a STRICT translator. Your ONLY job is to translate text word-by-word.

ABSOLUTE RULES - VIOLATION WILL FAIL THE TASK:
1. Output ONLY the translated text - NOTHING ELSE
2. NEVER add explanations, introductions, context, or commentary
3. NEVER invent or hallucinate new content
4. NEVER expand short texts into longer documents
5. If input is 10 words, output must be approximately 10 words
6. If input is 1 sentence, output must be 1 sentence
7. Preserve proper names (Ericson Piccoli, ELP Green Technology, TOPS, ABM)
8. Preserve acronyms (ESG, OTR, CTRA, etc.)
9. Keep formal business tone

LANGUAGE-SPECIFIC INSTRUCTIONS:
${langInstructions}
${formattingRules}

TRANSLATE TO: ${targetLangName}

INPUT TEXT (translate ONLY this, nothing more):
"""
${trimmedText}
"""

OUTPUT (translated text only, same length as input):`;

  const result = await generateText(prompt, 'gemini', 8000);
  
  // Clean up any common prefixes/suffixes the AI might add
  let cleanedText = result.content.trim();
  
  // Remove common AI prefixes
  const prefixesToRemove = [
    /^(Translation|Translated text|Here is the translation|Tradução|Texto traduzido)[:\s]*/i,
    /^(Traducción|Texto traducido|Traduzione|Testo tradotto|翻译|OUTPUT)[:\s]*/i,
    /^["'`]+/,
    /^"""\s*/,
  ];
  
  for (const prefix of prefixesToRemove) {
    cleanedText = cleanedText.replace(prefix, '');
  }
  
  // Remove trailing markers
  cleanedText = cleanedText.replace(/"""\s*$/, '').replace(/["'`]+$/, '').trim();
  
  // CRITICAL: Preserve line breaks while fixing spacing issues
  cleanedText = cleanedText
    .replace(/\r\n/g, '\n')  // Normalize line endings
    .replace(/\t/g, ' ')     // Replace tabs with spaces
    .replace(/([a-záéíóúàèìòùâêîôûãõçñ])([A-ZÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇÑ])/g, '$1 $2')  // Add space between lowercase-uppercase merges
    .replace(/([.:;!?])([A-Za-záéíóúàèìòùâêîôûãõçñ])/g, '$1 $2')  // Add space after punctuation if missing
    .replace(/([a-z])(\d)/gi, '$1 $2')  // Space between letter and number
    .replace(/(\d)([a-z])/gi, '$1 $2')  // Space between number and letter
    .replace(/ +/g, ' ')  // Normalize ONLY horizontal spaces (not \n)
    .split('\n').map(line => line.trim()).join('\n')  // Trim each line but preserve line breaks
    .replace(/\n{3,}/g, '\n\n')  // Max 2 consecutive newlines
    .trim();
  
  // If AI added way too much content (more than 3x original), truncate to reasonable size
  const originalLength = trimmedText.length;
  if (cleanedText.length > originalLength * 3 && originalLength < 200) {
    // For short texts that got expanded, try to extract just the first meaningful part
    const firstLine = cleanedText.split('\n')[0];
    if (firstLine && firstLine.length >= originalLength * 0.5) {
      cleanedText = firstLine;
    }
  }
  
  return { translatedText: cleanedText.trim(), provider: result.provider };
}

// ========== PROFESSIONAL DOCUMENT GENERATION WITH WEB RESEARCH ==========
async function generateDocument(
  description: string,
  documentType: string = 'report',
  targetLanguage: string = 'pt',
  companyContext: string = '',
  includeWebResearch: boolean = true
): Promise<{ generatedDocument: string; webResearchSummary?: string; provider: string }> {
  
  // Document type templates
  const documentTemplates: Record<string, string> = {
    proposal: 'proposta comercial profissional com termos, condições, valores e escopo',
    report: 'relatório executivo com análise, dados, conclusões e recomendações',
    contract: 'contrato comercial com cláusulas jurídicas, obrigações e direitos das partes',
    loi: 'Letter of Intent (Carta de Intenções) formal para parcerias comerciais',
    mou: 'Memorandum of Understanding com termos de cooperação e responsabilidades',
    analysis: 'análise técnica detalhada com metodologia, dados e insights',
    custom: 'documento personalizado conforme especificação'
  };

  const docTemplate = documentTemplates[documentType] || documentTemplates.custom;
  
  // Perform web research if enabled
  let webResearchContext = '';
  if (includeWebResearch) {
    console.log('🔍 Performing web research for document generation...');
    const searchQueries = [
      description,
      `${description} legislação regulamentação`,
      `${description} melhores práticas mercado`
    ];
    
    const searchResults = await Promise.all(
      searchQueries.map(q => searchWeb(q))
    );
    
    webResearchContext = searchResults.filter(Boolean).join('\n\n');
    if (webResearchContext) {
      console.log('✅ Web research completed, found relevant context');
    }
  }

  const langNames: Record<string, string> = {
    pt: 'português brasileiro formal e jurídico',
    en: 'formal business English',
    es: 'español formal empresarial',
    it: 'italiano formale commerciale',
    zh: '正式商务中文'
  };

  const targetLang = langNames[targetLanguage] || 'português brasileiro formal';
  
  const companyInfo = companyContext || `ELP Green Technology - empresa especializada em:
- Reciclagem de pneus OTR (fora de estrada) e convencionais
- Tecnologia de pirólise para recuperação de materiais
- Soluções de economia circular e sustentabilidade
- Parcerias com mineradoras e indústrias
- Sede: Brasil, com atuação internacional
- Contato: info@elpgreen.com | www.elpgreen.com`;

  const prompt = `Você é um especialista em direito internacional, negócios e elaboração de documentos empresariais profissionais.

TAREFA: Criar um(a) ${docTemplate} baseado(a) na seguinte descrição:

DESCRIÇÃO DO DOCUMENTO SOLICITADO:
"""
${description}
"""

CONTEXTO DA EMPRESA:
${companyInfo}

${webResearchContext ? `PESQUISA WEB RELEVANTE (use como referência):
"""
${webResearchContext}
"""` : ''}

REQUISITOS OBRIGATÓRIOS:
1. Escreva em ${targetLang}
2. Use formatação profissional com seções em MAIÚSCULAS
3. Inclua cabeçalho com identificação do documento
4. Mantenha tom formal, jurídico e profissional
5. Seja específico e detalhado
6. Inclua cláusulas e termos adequados ao tipo de documento
7. Adicione data, local e espaço para assinaturas
8. Se relevante, cite leis e regulamentações aplicáveis
9. Estruture com: INTRODUÇÃO/OBJETO, TERMOS E CONDIÇÕES, OBRIGAÇÕES DAS PARTES, DISPOSIÇÕES FINAIS, ASSINATURAS
10. Formate listas com "-" e checkboxes com "☐"

IMPORTANTE: Gere o documento completo e pronto para uso. Não adicione explicações ou comentários sobre o documento.

DOCUMENTO:`;

  const result = await generateText(prompt, 'gemini', 8000);
  
  return { 
    generatedDocument: result.content.trim(), 
    webResearchSummary: webResearchContext ? 'Pesquisa web realizada com sucesso' : undefined,
    provider: result.provider 
  };
}

// ========== COMPREHENSIVE DOCUMENT CORRECTION WITH MULTIPLE AIs ==========
async function correctDocument(
  text: string,
  documentType: string = 'contract',
  country: string = 'brazil',
  language: string = 'pt',
  countryLaws: string = '',
  documentTypeName: string = 'Documento',
  minimumCharacters: number = 50000
): Promise<{ correctedDocument: string; providers: string[] }> {
  
  const providers: string[] = [];
  
  // Country-specific legal frameworks
  const countryLegalData: Record<string, { governingLaw: string; arbitration: string; dataProtection: string; signatureRequirements: string; specificLaws: string[]; esgFramework: string; taxId: string; currency: string }> = {
    brazil: {
      governingLaw: 'Lei Brasileira, Código Civil (Lei 10.406/2002), Código Comercial',
      arbitration: 'Lei de Arbitragem (Lei 9.307/1996), Câmara de Arbitragem do Brasil',
      dataProtection: 'LGPD (Lei 13.709/2018), Marco Civil da Internet (Lei 12.965/2014)',
      signatureRequirements: 'Lei 14.063/2020 (assinatura eletrônica), ICP-Brasil para assinatura qualificada',
      specificLaws: [
        'Lei 10.406/2002 - Código Civil Brasileiro',
        'Lei 13.709/2018 - Lei Geral de Proteção de Dados (LGPD)',
        'Lei 12.846/2013 - Lei Anticorrupção',
        'Lei 12.305/2010 - Política Nacional de Resíduos Sólidos (PNRS)',
        'Lei 6.938/1981 - Política Nacional do Meio Ambiente',
        'Lei 9.279/1996 - Lei de Propriedade Industrial',
        'Lei 9.610/1998 - Lei de Direitos Autorais',
        'Lei 8.078/1990 - Código de Defesa do Consumidor',
        'Lei 13.874/2019 - Lei da Liberdade Econômica',
        'Decreto 7.404/2010 - Regulamenta a PNRS',
        'Lei 9.605/1998 - Lei de Crimes Ambientais',
        'Lei 11.445/2007 - Política Nacional de Saneamento',
        'Lei 14.119/2021 - Pagamento por Serviços Ambientais',
        'Lei 12.187/2009 - Política Nacional sobre Mudança do Clima',
        'Lei 11.107/2005 - Consórcios Públicos'
      ],
      esgFramework: 'Resolução CVM 59/2021, Taxonomia Verde Brasileira, Protocolo GEE Brasil',
      taxId: 'CNPJ',
      currency: 'BRL'
    },
    italy: {
      governingLaw: 'Codice Civile Italiano, Diritto Commerciale Italiano',
      arbitration: 'Camera Arbitrale di Milano, Codice di Procedura Civile',
      dataProtection: 'GDPR (Regolamento UE 2016/679), Codice Privacy (D.Lgs 196/2003)',
      signatureRequirements: 'eIDAS Regulation, Firma Digitale Qualificata',
      specificLaws: [
        'Codice Civile Italiano (R.D. 262/1942)',
        'GDPR - Regolamento UE 2016/679',
        'D.Lgs. 196/2003 - Codice della Privacy',
        'D.Lgs. 231/2001 - Responsabilità Amministrativa degli Enti',
        'D.Lgs. 152/2006 - Codice dell\'Ambiente',
        'Legge 633/1941 - Diritto d\'Autore',
        'D.Lgs. 30/2005 - Codice della Proprietà Industriale',
        'D.Lgs. 206/2005 - Codice del Consumo',
        'D.Lgs. 81/2008 - Sicurezza sul Lavoro',
        'Legge 190/2012 - Anticorruzione',
        'D.Lgs. 254/2016 - Reporting Non Finanziario',
        'D.Lgs. 24/2023 - Whistleblowing',
        'Legge 221/2015 - Green Economy',
        'D.Lgs. 102/2014 - Efficienza Energetica',
        'D.Lgs. 49/2014 - RAEE (Rifiuti Elettronici)'
      ],
      esgFramework: 'EU Taxonomy, SFDR, CSRD, EU Green Deal',
      taxId: 'Partita IVA',
      currency: 'EUR'
    },
    germany: {
      governingLaw: 'Bürgerliches Gesetzbuch (BGB), Handelsgesetzbuch (HGB)',
      arbitration: 'Deutsche Institution für Schiedsgerichtsbarkeit (DIS)',
      dataProtection: 'GDPR, Bundesdatenschutzgesetz (BDSG)',
      signatureRequirements: 'eIDAS Regulation, Qualifizierte Elektronische Signatur',
      specificLaws: [
        'Bürgerliches Gesetzbuch (BGB)',
        'Handelsgesetzbuch (HGB)',
        'EU-DSGVO (Datenschutz-Grundverordnung)',
        'BDSG - Bundesdatenschutzgesetz',
        'UWG - Gesetz gegen den unlauteren Wettbewerb',
        'PatG - Patentgesetz',
        'UrhG - Urheberrechtsgesetz',
        'GWB - Gesetz gegen Wettbewerbsbeschränkungen',
        'Kreislaufwirtschaftsgesetz (KrWG)',
        'Bundes-Immissionsschutzgesetz (BImSchG)',
        'LkSG - Lieferkettensorgfaltspflichtengesetz',
        'Aktiengesetz (AktG)',
        'GmbH-Gesetz (GmbHG)',
        'CSR-Richtlinie-Umsetzungsgesetz',
        'Energiewirtschaftsgesetz (EnWG)'
      ],
      esgFramework: 'EU Taxonomy, SFDR, CSRD, Deutscher Nachhaltigkeitskodex (DNK)',
      taxId: 'Steuernummer',
      currency: 'EUR'
    },
    usa: {
      governingLaw: 'Uniform Commercial Code (UCC), State Laws, Federal Law',
      arbitration: 'American Arbitration Association (AAA), JAMS',
      dataProtection: 'CCPA (California), HIPAA, State Privacy Laws',
      signatureRequirements: 'ESIGN Act, UETA, State Electronic Signature Laws',
      specificLaws: [
        'Uniform Commercial Code (UCC)',
        'Defend Trade Secrets Act (DTSA)',
        'California Consumer Privacy Act (CCPA)',
        'Lanham Act (Trademark Law)',
        'Sherman Antitrust Act',
        'Foreign Corrupt Practices Act (FCPA)',
        'Sarbanes-Oxley Act (SOX)',
        'Resource Conservation and Recovery Act (RCRA)',
        'Clean Air Act',
        'Delaware General Corporation Law',
        'Securities Act of 1933',
        'Securities Exchange Act of 1934',
        'Dodd-Frank Wall Street Reform Act',
        'Clean Water Act',
        'National Environmental Policy Act (NEPA)'
      ],
      esgFramework: 'SEC Climate Disclosure, SASB Standards, GRI, TCFD, CDP',
      taxId: 'EIN',
      currency: 'USD'
    },
    australia: {
      governingLaw: 'Australian Contract Law, Competition and Consumer Act 2010',
      arbitration: 'Australian Centre for International Commercial Arbitration (ACICA)',
      dataProtection: 'Privacy Act 1988, Australian Privacy Principles',
      signatureRequirements: 'Electronic Transactions Act 1999',
      specificLaws: [
        'Corporations Act 2001 (Cth)',
        'Competition and Consumer Act 2010',
        'Privacy Act 1988',
        'Australian Consumer Law',
        'Trade Marks Act 1995',
        'Patents Act 1990',
        'Copyright Act 1968',
        'Environment Protection and Biodiversity Conservation Act 1999',
        'National Greenhouse and Energy Reporting Act 2007',
        'Personal Property Securities Act 2009',
        'Work Health and Safety Act 2011',
        'Fair Work Act 2009',
        'Modern Slavery Act 2018',
        'Renewable Energy Target Act',
        'Clean Energy Finance Corporation Act 2012'
      ],
      esgFramework: 'ASX Corporate Governance Council Principles, ASIC Regulatory Guide 247',
      taxId: 'ABN',
      currency: 'AUD'
    },
    mexico: {
      governingLaw: 'Código Civil Federal, Código de Comercio',
      arbitration: 'Centro de Arbitraje de México (CAM)',
      dataProtection: 'Ley Federal de Protección de Datos Personales (LFPDPPP)',
      signatureRequirements: 'Código de Comercio (firma electrónica)',
      specificLaws: [
        'Código de Comercio',
        'Código Civil Federal',
        'Ley Federal de Protección de Datos Personales (LFPDPPP)',
        'Ley de la Propiedad Industrial',
        'Ley Federal del Derecho de Autor',
        'Ley Federal de Competencia Económica',
        'Ley General del Equilibrio Ecológico y Protección al Ambiente',
        'Ley General para la Prevención y Gestión Integral de los Residuos',
        'Ley Federal Anticorrupción en Contrataciones Públicas',
        'Ley General de Sociedades Mercantiles',
        'Ley del Impuesto sobre la Renta',
        'Ley de Inversión Extranjera',
        'Ley Federal del Trabajo',
        'Ley de Transición Energética',
        'Ley General de Cambio Climático'
      ],
      esgFramework: 'BMV Sustainability Index, CNBV ESG Guidelines',
      taxId: 'RFC',
      currency: 'MXN'
    },
    china: {
      governingLaw: 'Civil Code of the People\'s Republic of China',
      arbitration: 'China International Economic and Trade Arbitration Commission (CIETAC)',
      dataProtection: 'Personal Information Protection Law (PIPL), Cybersecurity Law',
      signatureRequirements: 'Electronic Signature Law of the PRC',
      specificLaws: [
        'Civil Code of the PRC (2020)',
        'Personal Information Protection Law (PIPL)',
        'Cybersecurity Law of the PRC',
        'Data Security Law',
        'Patent Law of the PRC',
        'Trademark Law of the PRC',
        'Copyright Law of the PRC',
        'Anti-Unfair Competition Law',
        'Anti-Monopoly Law',
        'Environmental Protection Law',
        'Company Law of the PRC',
        'Foreign Investment Law',
        'Labor Contract Law',
        'Energy Conservation Law',
        'Circular Economy Promotion Law'
      ],
      esgFramework: 'CSRC ESG Disclosure, China Green Bond Standards, CBIRC Green Finance Guidelines',
      taxId: '统一社会信用代码',
      currency: 'CNY'
    },
    uk: {
      governingLaw: 'English Common Law, Companies Act 2006',
      arbitration: 'London Court of International Arbitration (LCIA)',
      dataProtection: 'UK GDPR, Data Protection Act 2018',
      signatureRequirements: 'Electronic Communications Act 2000, eIDAS',
      specificLaws: [
        'Companies Act 2006',
        'UK GDPR',
        'Data Protection Act 2018',
        'Bribery Act 2010',
        'Modern Slavery Act 2015',
        'Competition Act 1998',
        'Consumer Rights Act 2015',
        'Patents Act 1977',
        'Copyright, Designs and Patents Act 1988',
        'Trade Marks Act 1994',
        'Environment Act 2021',
        'Climate Change Act 2008',
        'Financial Services and Markets Act 2000',
        'Equality Act 2010',
        'Health and Safety at Work Act 1974'
      ],
      esgFramework: 'UK Corporate Governance Code, Streamlined Energy and Carbon Reporting (SECR)',
      taxId: 'Company Registration Number',
      currency: 'GBP'
    },
    france: {
      governingLaw: 'Code Civil, Code de Commerce',
      arbitration: 'ICC International Court of Arbitration (Paris)',
      dataProtection: 'GDPR, Loi Informatique et Libertés',
      signatureRequirements: 'eIDAS Regulation, Signature Électronique Qualifiée',
      specificLaws: [
        'Code Civil',
        'Code de Commerce',
        'GDPR - RGPD',
        'Loi Informatique et Libertés',
        'Loi Sapin II (Anticorruption)',
        'Loi sur le Devoir de Vigilance',
        'Code de la Propriété Intellectuelle',
        'Code de l\'Environnement',
        'Code du Travail',
        'Code de la Consommation',
        'Loi PACTE 2019',
        'Loi Climat et Résilience 2021',
        'Loi relative à la Transition Énergétique',
        'Code Monétaire et Financier',
        'Loi NRE (Nouvelles Régulations Économiques)'
      ],
      esgFramework: 'Article 29 LEC, Label ISR, DPEF (Déclaration de Performance Extra-Financière)',
      taxId: 'SIRET',
      currency: 'EUR'
    },
    japan: {
      governingLaw: 'Japanese Civil Code, Companies Act',
      arbitration: 'Japan Commercial Arbitration Association (JCAA)',
      dataProtection: 'Act on Protection of Personal Information (APPI)',
      signatureRequirements: 'Electronic Signatures and Certification Business Act',
      specificLaws: [
        'Japanese Civil Code',
        'Companies Act',
        'Act on Protection of Personal Information (APPI)',
        'Antimonopoly Act',
        'Unfair Competition Prevention Act',
        'Patent Act',
        'Trademark Act',
        'Copyright Act',
        'Basic Environment Act',
        'Waste Management and Public Cleansing Act',
        'Act on Promotion of Resource Circulation',
        'Labor Standards Act',
        'Act Against Delay in Payment of Subcontract Proceeds',
        'Financial Instruments and Exchange Act',
        'Act on Promotion of Global Warming Countermeasures'
      ],
      esgFramework: 'Japan Corporate Governance Code, TCFD Consortium Japan, JPX ESG Indices',
      taxId: '法人番号',
      currency: 'JPY'
    },
    india: {
      governingLaw: 'Indian Contract Act 1872, Companies Act 2013',
      arbitration: 'Mumbai Centre for International Arbitration (MCIA)',
      dataProtection: 'Digital Personal Data Protection Act 2023, IT Act 2000',
      signatureRequirements: 'Information Technology Act 2000, Digital Signature',
      specificLaws: [
        'Indian Contract Act 1872',
        'Companies Act 2013',
        'Digital Personal Data Protection Act 2023',
        'Information Technology Act 2000',
        'Competition Act 2002',
        'Consumer Protection Act 2019',
        'Patents Act 1970',
        'Trade Marks Act 1999',
        'Copyright Act 1957',
        'Environment Protection Act 1986',
        'Prevention of Corruption Act 1988',
        'Foreign Exchange Management Act 1999',
        'Goods and Services Tax Acts',
        'Labour Codes 2020',
        'Energy Conservation Act 2001'
      ],
      esgFramework: 'SEBI BRSR, National Guidelines on Responsible Business Conduct',
      taxId: 'GSTIN/PAN',
      currency: 'INR'
    }
  };

  const legalData = countryLegalData[country] || countryLegalData.brazil;
  const lawsText = countryLaws || `${legalData.governingLaw}; ${legalData.dataProtection}; ${legalData.specificLaws.slice(0, 10).join('; ')}`;

  // Document type specific templates for ROI/ESG calculations
  const documentTypeTemplates: Record<string, string> = {
    feasibility_study: `
CÁLCULOS DE VIABILIDADE FINANCEIRA OBRIGATÓRIOS:
- ROI (Return on Investment) = (Ganho Líquido - Investimento Inicial) / Investimento Inicial × 100
- NPV (Net Present Value) = Σ [CFt / (1 + r)^t] - C0, onde CFt = Fluxo de Caixa no período t, r = taxa de desconto
- IRR (Internal Rate of Return) = Taxa onde NPV = 0
- Payback Period = Investimento Inicial / Fluxo de Caixa Anual
- EBITDA Margin = EBITDA / Receita Líquida × 100
- Break-even Point = Custos Fixos / (Preço Unitário - Custo Variável Unitário)

FORMATAÇÃO DE NÚMEROS: Use o padrão do país (ex.: R$ 1.234.567,89 para Brasil, $1,234,567.89 para EUA)
`,
    sustainability_report: `
MÉTRICAS ESG OBRIGATÓRIAS:
- Emissões de GEE (Escopos 1, 2 e 3) em tCO2e
- Redução de CO2 = Volume Reciclado × Fator de Emissão (≈ 0,7 tCO2e/ton para pneus)
- Consumo de Água (m³/ton produzida)
- Taxa de Reciclagem (%)
- Economia Circular: % de materiais recuperados
- Índice de Diversidade e Inclusão
- Taxa de Acidentes de Trabalho (LTIFR)
- Score de Governança Corporativa

FRAMEWORKS: ${legalData.esgFramework || 'GRI Standards, SASB, TCFD, CDP'}
`,
    carbon_credit: `
CÁLCULOS DE CRÉDITOS DE CARBONO:
- Créditos Gerados = Volume (ton) × Fator de Emissão × Fator de Additionality
- Valor dos Créditos = Créditos × Preço por tCO2e
- Verificação: VCS (Verra), Gold Standard, ou metodologia aprovada
- Período de Credenciamento: mínimo 7 anos, renovável
- Registro: Verra Registry, Gold Standard Registry
`,
    environmental_improvement: `
MÉTRICAS AMBIENTAIS:
- Redução de Resíduos (%)
- Taxa de Desvio de Aterro (%)
- Eficiência Energética (kWh/ton)
- Uso de Energia Renovável (%)
- Pegada Hídrica (m³)
- Biodiversidade: área restaurada/protegida (ha)
- Economia Circular: taxa de circularidade (%)
`,
    default: ''
  };

  const docTypeTemplate = documentTypeTemplates[documentType] || documentTypeTemplates.default;

  const comprehensivePrompt = `Você é um ESPECIALISTA JURÍDICO INTERNACIONAL e um MESTRE em elaboração de documentos empresariais de altíssimo nível.

TAREFA CRÍTICA: Corrija, expanda e aprimore COMPLETAMENTE o documento abaixo para criar um ${documentTypeName} PROFISSIONAL, JURIDICAMENTE VINCULATIVO e EXAUSTIVO.

DOCUMENTO ORIGINAL PARA CORREÇÃO:
"""
${text}
"""

REQUISITOS OBRIGATÓRIOS (TODOS DEVEM SER CUMPRIDOS):

1. **VOLUME MÍNIMO**: O documento DEVE ter NO MÍNIMO ${minimumCharacters.toLocaleString()} caracteres (aproximadamente ${Math.ceil(minimumCharacters / 5000)} páginas A4)

2. **ESTRUTURA COMPLETA OBRIGATÓRIA**:
   - CABEÇALHO: Identificação completa do documento, número, data
   - CONSIDERANDOS/RECITAIS: Mínimo 15-20 "CONSIDERANDO QUE" detalhados
   - DEFINIÇÕES: Mínimo 30 definições técnicas e jurídicas
   - OBJETO: Descrição exaustiva do propósito
   - CLÁUSULAS: Mínimo 40 artigos/cláusulas detalhados com sub-cláusulas
   - ANEXOS: Mínimo 3 anexos técnicos detalhados

${docTypeTemplate}

3. **CLÁUSULAS JURÍDICAS OBRIGATÓRIAS** (incluir TODAS):
   - Objeto e escopo detalhado
   - Definições exaustivas
   - Obrigações de cada parte (mínimo 10 por parte)
   - Direitos de cada parte
   - Preço, pagamento e condições comerciais
   - Prazo e vigência
   - Confidencialidade (NDA completo integrado)
   - Propriedade intelectual e industrial
   - Proteção de dados pessoais (${legalData.dataProtection})
   - Compliance e anticorrupção (FCPA, UK Bribery Act, Lei 12.846/2013)
   - Responsabilidades e limitações
   - Garantias e declarações
   - Indenizações
   - Seguros obrigatórios
   - Força maior e caso fortuito
   - Rescisão e término
   - Penalidades e multas
   - Foro e lei aplicável (${legalData.governingLaw})
   - Arbitragem (${legalData.arbitration})
   - Notificações e comunicações
   - Cessão e transferência
   - Integralidade do acordo
   - Renúncia e tolerância
   - Disposições gerais e finais

4. **CLÁUSULAS ESG E SUSTENTABILIDADE** (OBRIGATÓRIAS):
   - Compromissos ambientais
   - Responsabilidade social
   - Governança corporativa
   - Direitos humanos e trabalho
   - Cadeia de suprimentos sustentável
   - Relatórios ESG
   - Metas de carbono neutro
   - Economia circular
   - Due Diligence Ambiental
   - Auditorias de Sustentabilidade

5. **CONFORMIDADE LEGAL DO PAÍS**: ${country.toUpperCase()}
   - Lei aplicável: ${legalData.governingLaw}
   - Arbitragem: ${legalData.arbitration}
   - Proteção de dados: ${legalData.dataProtection}
   - Requisitos de assinatura: ${legalData.signatureRequirements}
   - Framework ESG: ${legalData.esgFramework || 'Standards internacionais'}
   - Identificação fiscal: ${legalData.taxId}
   - Moeda: ${legalData.currency}

6. **REFERÊNCIAS LEGAIS ESPECÍFICAS** (citar pelo menos 15):
${legalData.specificLaws.map((law, i) => `   ${i + 1}. ${law}`).join('\n')}

7. **IDIOMA**: ${language === 'pt' ? 'Português brasileiro formal e jurídico' : language === 'en' ? 'Formal business English' : language === 'es' ? 'Español formal jurídico' : language === 'it' ? 'Italiano formale giuridico' : language === 'zh' ? '正式商务法律中文' : language === 'de' ? 'Deutsches formelles Recht' : language === 'fr' ? 'Français juridique formel' : language === 'ja' ? '正式な日本語法律文書' : 'Formal business language'}

8. **FORMATAÇÃO**:
   - Seções em MAIÚSCULAS e negrito
   - Artigos numerados (Art. 1°, Art. 2°, etc.)
   - Parágrafos com §
   - Alíneas com a), b), c)
   - Incisos com I, II, III
   - Listas com "-"
   - Checkboxes com "☐" para ações pendentes
   - Tabelas para dados financeiros e métricas
   - Números formatados conforme padrão local (${legalData.currency})

9. **ASSINATURAS**:
   - Campo para data e local
   - Espaço para assinatura de cada parte
   - Espaço para testemunhas (mínimo 2)
   - Espaço para reconhecimento de firma se aplicável
   - Conforme ${legalData.signatureRequirements}

IMPORTANTE: 
- Mantenha TODO o conteúdo original, apenas EXPANDA e APRIMORE
- NÃO remova nenhuma informação do documento original
- ADICIONE todas as cláusulas faltantes
- Use linguagem jurídica precisa e profissional
- Cite artigos de lei quando apropriado
- O documento deve estar PRONTO PARA ASSINATURA
- Para cálculos financeiros (ROI, NPV, IRR), use as fórmulas corretas
- Formate números conforme padrão do país

GERE O DOCUMENTO COMPLETO AGORA (mínimo ${minimumCharacters.toLocaleString()} caracteres):`;

  console.log('📝 Starting comprehensive document correction...');
  console.log(`📊 Target: ${minimumCharacters.toLocaleString()} characters, Country: ${country}, Type: ${documentType}`);

  // Use Gemini with high token limit for comprehensive document
  const result = await generateText(comprehensivePrompt, 'gemini', 65536);
  providers.push(result.provider);

  let correctedDocument = result.content.trim();
  console.log(`✅ Document generated: ${correctedDocument.length.toLocaleString()} characters`);

  // If document is too short, request expansion
  if (correctedDocument.length < minimumCharacters * 0.8) {
    console.log('📈 Document too short, requesting expansion...');
    
    const expansionPrompt = `O documento abaixo está incompleto. EXPANDA-O para atingir NO MÍNIMO ${minimumCharacters.toLocaleString()} caracteres.

DOCUMENTO ATUAL (${correctedDocument.length.toLocaleString()} caracteres):
"""
${correctedDocument}
"""

ADICIONE:
1. Mais considerandos detalhados
2. Mais definições técnicas
3. Mais cláusulas de compliance e ESG
4. Mais detalhes em cada artigo existente
5. Mais obrigações específicas para cada parte
6. Mais disposições sobre propriedade intelectual
7. Mais cláusulas de proteção de dados
8. Anexos detalhados

GERE O DOCUMENTO EXPANDIDO COMPLETO:`;

    const expansionResult = await generateText(expansionPrompt, 'gemini', 65536);
    providers.push(expansionResult.provider);
    
    if (expansionResult.content.length > correctedDocument.length) {
      correctedDocument = expansionResult.content.trim();
      console.log(`✅ Expanded to: ${correctedDocument.length.toLocaleString()} characters`);
    }
  }

  return { correctedDocument, providers };
}

// ========== MAIN HANDLER ==========
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: AIRequest = await req.json();
    console.log('AI Hub v2 request:', payload.action);

    let result: any;

    switch (payload.action) {
      case 'text':
        if (!payload.prompt) throw new Error('Missing prompt');
        result = await generateText(payload.prompt, payload.model_preference, payload.max_tokens);
        break;

      case 'image':
        if (!payload.image_prompt) throw new Error('Missing image_prompt');
        result = await generateImage(payload.image_prompt);
        break;

      case 'transcribe':
        if (!payload.audio_url) throw new Error('Missing audio_url');
        result = await transcribeAudio(payload.audio_url);
        break;

      case 'summarize_news':
        if (!payload.news_topic) throw new Error('Missing news_topic');
        result = await summarizeNews(payload.news_topic);
        break;

      case 'translate':
        if (!payload.text_to_translate || !payload.target_language) {
          throw new Error('Missing text_to_translate or target_language');
        }
        result = await translateText(payload.text_to_translate, payload.target_language);
        break;

      case 'classify':
        if (!payload.text_to_classify || !payload.labels) {
          throw new Error('Missing text_to_classify or labels');
        }
        result = await classifyText(payload.text_to_classify, payload.labels);
        break;

      case 'embeddings':
        if (!payload.text_for_embeddings) throw new Error('Missing text_for_embeddings');
        result = await generateEmbeddings(payload.text_for_embeddings);
        break;

      case 'sentiment':
        if (!payload.text_for_sentiment) throw new Error('Missing text_for_sentiment');
        result = await analyzeSentiment(payload.text_for_sentiment);
        break;

      case 'correct_grammar':
        if (!payload.text) throw new Error('Missing text');
        result = await correctGrammar(payload.text, payload.language, payload.style);
        break;

      case 'generate_summary':
        if (!payload.text) throw new Error('Missing text');
        result = await generateSummary(payload.text, payload.maxLines, payload.language);
        break;

      case 'translate_document':
        if (!payload.text || !payload.targetLanguage) {
          throw new Error('Missing text or targetLanguage');
        }
        result = await translateDocument(
          payload.text, 
          payload.targetLanguage, 
          payload.sourceLanguage || 'auto',
          payload.preserveFormatting !== false
        );
        break;

      case 'generate_document':
        if (!payload.documentDescription) throw new Error('Missing documentDescription');
        result = await generateDocument(
          payload.documentDescription,
          payload.documentType || 'report',
          payload.targetLanguage || payload.language || 'pt',
          payload.companyContext || '',
          payload.includeWebResearch !== false
        );
        break;

       case 'correct_document':
         if (!payload.text) throw new Error('Missing text');
         result = await correctDocument(
           payload.text,
           payload.documentType || 'contract',
           payload.country || 'brazil',
           payload.language || 'pt',
           payload.countryLaws || '',
           payload.documentTypeName || 'Documento',
           payload.minimumCharacters || 50000
         );
         break;

      default:
        throw new Error(`Unknown action: ${payload.action}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      ...result,
      cost_info: 'HuggingFace e Groq são gratuitos. Anthropic é cobrado apenas como último recurso.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('AI Hub v2 error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});