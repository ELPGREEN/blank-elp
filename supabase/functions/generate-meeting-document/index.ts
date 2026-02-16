import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ========== GEMINI 7-KEY POOL WITH AUTOMATIC ROTATION ==========
const GEMINI_API_KEYS = [
  Deno.env.get('GEMINI_API_KEY'),
  Deno.env.get('GEMINI_API_KEY_2'),
  Deno.env.get('GEMINI_API_KEY_3'),
  Deno.env.get('GEMINI_API_KEY_4'),
  Deno.env.get('GEMINI_API_KEY_5'),
  Deno.env.get('GEMINI_API_KEY_6'),
  Deno.env.get('GEMINI_API_KEY_7'),
].filter(Boolean) as string[];

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

let currentGeminiKeyIndex = 0;
const failedKeys = new Set<number>();
const failedKeyTimestamps = new Map<number, number>();
const KEY_COOLDOWN_MS = 60000;

function getNextGeminiKey(): string | null {
  if (GEMINI_API_KEYS.length === 0) return null;
  const now = Date.now();
  for (const [idx, ts] of failedKeyTimestamps) {
    if (now - ts > KEY_COOLDOWN_MS) {
      failedKeys.delete(idx);
      failedKeyTimestamps.delete(idx);
    }
  }
  for (let i = 0; i < GEMINI_API_KEYS.length; i++) {
    const idx = (currentGeminiKeyIndex + i) % GEMINI_API_KEYS.length;
    if (!failedKeys.has(idx)) {
      currentGeminiKeyIndex = idx;
      return GEMINI_API_KEYS[idx];
    }
  }
  return GEMINI_API_KEYS[currentGeminiKeyIndex];
}

function rotateGeminiKey(markAsFailed = false): void {
  if (markAsFailed) {
    failedKeys.add(currentGeminiKeyIndex);
    failedKeyTimestamps.set(currentGeminiKeyIndex, Date.now());
    console.log(`⛔ Key ${currentGeminiKeyIndex + 1}/${GEMINI_API_KEYS.length} marked failed (60s cooldown)`);
  }
  if (GEMINI_API_KEYS.length > 1) {
    const old = currentGeminiKeyIndex;
    currentGeminiKeyIndex = (currentGeminiKeyIndex + 1) % GEMINI_API_KEYS.length;
    console.log(`🔄 Rotating key ${old + 1} → ${currentGeminiKeyIndex + 1} (${GEMINI_API_KEYS.length} total)`);
  }
}

console.log(`Meeting Document Generator v2 - Gemini: ${GEMINI_API_KEYS.length}/7 keys, Anthropic: ${ANTHROPIC_API_KEY ? '✅' : '❌'}, Firecrawl: ${FIRECRAWL_API_KEY ? '✅' : '❌'}`);

// ========== FIRECRAWL WEB SEARCH ==========
async function searchWebContext(query: string): Promise<string> {
  if (!FIRECRAWL_API_KEY) return '';
  try {
    console.log('Firecrawl searching:', query);
    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, limit: 2, scrapeOptions: { formats: ['markdown'] } }),
    });
    if (!response.ok) return '';
    const data = await response.json();
    const results = data.data || [];
    return results.map((r: any) => r.markdown?.substring(0, 300) || '').filter(Boolean).join('\n');
  } catch { return ''; }
}

interface MeetingPayload {
  meeting_id?: string;
  document_type: 'agenda' | 'convocation' | 'summary' | 'organize_notes';
  meeting_data: {
    title: string;
    meeting_type: string;
    plant_type?: string;
    scheduled_at?: string;
    duration_minutes?: number;
    location?: string;
    participants?: Array<{ name: string; email: string; role?: string; company?: string }>;
    lead_id?: string;
    lead_type?: string;
    notes?: string;
    previous_meetings_summary?: string;
    attached_documents_summary?: string;
  };
  raw_text?: string;
  language: string;
}

async function getLeadContext(supabase: any, leadId: string, leadType: string): Promise<string> {
  try {
    const table = leadType === 'marketplace' ? 'marketplace_registrations' : 'contacts';
    const { data } = await supabase.from(table).select('*').eq('id', leadId).single();
    
    if (!data) return '';
    
    if (leadType === 'marketplace') {
      return `
INFORMAÇÕES DO LEAD:
- Empresa: ${data.company_name}
- Contato: ${data.contact_name}
- Email: ${data.email}
- País: ${data.country}
- Tipo: ${data.company_type}
- Produtos de Interesse: ${data.products_interest?.join(', ') || 'N/A'}
- Volume Estimado: ${data.estimated_volume || 'N/A'}
- Mensagem: ${data.message || 'N/A'}
- Status: ${data.status}
- Nível do Lead: ${data.lead_level || 'initial'}
`;
    } else {
      return `
INFORMAÇÕES DO CONTATO:
- Nome: ${data.name}
- Empresa: ${data.company || 'N/A'}
- Email: ${data.email}
- País: ${data.country || 'N/A'}
- Assunto: ${data.subject || 'N/A'}
- Mensagem: ${data.message}
- Status: ${data.status}
- Nível do Lead: ${data.lead_level || 'initial'}
`;
    }
  } catch (error) {
    console.error('Error fetching lead context:', error);
    return '';
  }
}

async function getPreviousMeetings(supabase: any, leadId: string, plantType?: string): Promise<string> {
  try {
    let query = supabase
      .from('meetings')
      .select('title, meeting_type, scheduled_at, summary_content, agenda_content, notes')
      .eq('status', 'completed')
      .order('scheduled_at', { ascending: false })
      .limit(3);
    
    if (leadId) {
      query = query.eq('lead_id', leadId);
    } else if (plantType) {
      query = query.eq('plant_type', plantType);
    }
    
    const { data } = await query;
    
    if (!data || data.length === 0) return '';
    
    return `
HISTÓRICO DE REUNIÕES ANTERIORES:
${data.map((m: any, i: number) => `
${i + 1}. ${m.title} (${new Date(m.scheduled_at).toLocaleDateString('pt-BR')})
   Tipo: ${m.meeting_type}
   ${m.summary_content ? `Resumo: ${m.summary_content.substring(0, 500)}...` : ''}
   ${m.notes ? `Notas: ${m.notes}` : ''}
`).join('\n')}
`;
  } catch (error) {
    console.error('Error fetching previous meetings:', error);
    return '';
  }
}

function getPlantTypeInfo(plantType: string): string {
  const plantInfo: Record<string, string> = {
    otr_recycling: `
CONTEXTO - PLANTA OTR (Off-The-Road):
- Processamento de pneus fora de estrada de grandes dimensões (mineração, construção)
- Capacidade típica: 20.000 a 100.000 toneladas/ano
- Produtos: granulado de borracha, aço, fibra têxtil
- Investimento médio: USD 5-15 milhões
- Tecnologia: trituração mecânica com separação magnética
`,
    pyrolysis: `
CONTEXTO - PLANTA DE PIRÓLISE:
- Conversão termoquímica de pneus em óleo, gás e negro de fumo
- Capacidade típica: 10.000 a 50.000 toneladas/ano
- Produtos: óleo de pirólise (TDO), negro de fumo recuperado (rCB), aço, gás
- Investimento médio: USD 3-10 milhões
- Tecnologia: reator de pirólise contínua ou em batelada
`,
    tire_recycling: `
CONTEXTO - PLANTA DE RECICLAGEM DE PNEUS:
- Processamento de pneus de veículos leves e pesados
- Capacidade típica: 30.000 a 80.000 toneladas/ano
- Produtos: granulado de borracha, pó de borracha, aço
- Investimento médio: USD 2-8 milhões
- Tecnologia: trituração mecânica em múltiplos estágios
`,
    msw: `
CONTEXTO - PLANTA MSW (Resíduos Sólidos Urbanos):
- Tratamento e valorização de resíduos sólidos municipais
- Capacidade típica: 100.000 a 500.000 toneladas/ano
- Produtos: combustível derivado de resíduos (CDR), materiais recicláveis
- Investimento médio: USD 20-100 milhões
- Tecnologia: triagem, compostagem, tratamento mecânico-biológico
`
  };
  
  return plantInfo[plantType] || '';
}

function buildPrompt(payload: MeetingPayload, leadContext: string, previousMeetings: string): string {
  const { document_type, meeting_data, language } = payload;
  const plantInfo = meeting_data.plant_type ? getPlantTypeInfo(meeting_data.plant_type) : '';
  
  const langInstructions = language === 'pt' 
    ? 'Escreva em português brasileiro profissional e formal.'
    : language === 'en'
    ? 'Write in professional and formal English.'
    : language === 'es'
    ? 'Escriba en español profesional y formal.'
    : language === 'it'
    ? 'Scrivere in italiano professionale e formale.'
    : 'Write in professional and formal Chinese.';

  const participantsList = meeting_data.participants?.map(p => 
    `${p.name} (${p.role || 'Participante'}${p.company ? ` - ${p.company}` : ''})`
  ).join(', ') || 'A definir';

  // Check if user provided specific notes/agenda
  const hasUserNotes = meeting_data.notes && meeting_data.notes.trim().length > 20;
  
  const baseContext = `
${langInstructions}

DADOS DA REUNIÃO:
- Título: ${meeting_data.title}
- Tipo: ${meeting_data.meeting_type}
- Data/Hora: ${meeting_data.scheduled_at ? new Date(meeting_data.scheduled_at).toLocaleString('pt-BR') : 'A definir'}
- Duração: ${meeting_data.duration_minutes || 60} minutos
- Local: ${meeting_data.location || 'A definir'}
- Participantes: ${participantsList}

${plantInfo}
${leadContext}
${previousMeetings}
${meeting_data.attached_documents_summary ? `\nRESUMO DE DOCUMENTOS ANEXOS:\n${meeting_data.attached_documents_summary}` : ''}
`;

  // PRIORITY SECTION: User-defined notes, questions, and agenda
  const userDefinedContent = hasUserNotes ? `
===========================================
🎯 INSTRUÇÕES PRIORITÁRIAS DO USUÁRIO 🎯
===========================================

O USUÁRIO DEFINIU AS SEGUINTES NOTAS/PERGUNTAS/PAUTA QUE DEVEM SER USADAS COMO BASE PRINCIPAL:

"""
${meeting_data.notes}
"""

⚠️ REGRA CRÍTICA: USE EXATAMENTE O CONTEÚDO ACIMA COMO BASE.
- As perguntas acima são NOSSAS perguntas (ELP Green) para fazer aos participantes
- A pauta acima é O QUE NÓS QUEREMOS discutir, não respostas para outros
- NÃO invente tópicos genéricos - use os tópicos/perguntas fornecidos
- MANTENHA a estrutura e as perguntas específicas do usuário
- APENAS formate profissionalmente e adicione estrutura organizacional
===========================================
` : '';

  if (document_type === 'agenda') {
    return `${baseContext}
${userDefinedContent}

TAREFA: Gerar uma PAUTA/AGENDA profissional para esta reunião.

${hasUserNotes ? `
INSTRUÇÕES ESPECIAIS (usuário forneceu pauta/perguntas específicas):
1. USE AS PERGUNTAS/TÓPICOS FORNECIDOS NAS NOTAS DO USUÁRIO como itens principais da pauta
2. Cada pergunta do usuário deve virar um item de pauta
3. Formate profissionalmente MAS PRESERVE o conteúdo original
4. Adicione tempo estimado para cada tópico
5. Adicione cabeçalho formal com informações da reunião
6. NÃO substitua as perguntas do usuário por conteúdo genérico
` : `
A pauta deve incluir:
1. Cabeçalho com informações da reunião
2. Lista numerada de tópicos a serem discutidos (baseado no contexto do lead e histórico)
3. Tempo estimado para cada tópico
4. Objetivos da reunião
5. Materiais necessários
6. Próximos passos esperados

Se houver histórico de reuniões anteriores, sugira tópicos de follow-up relevantes.
`}
Formate o documento de forma profissional e estruturada.
Use markdown para formatação.`;
  }
  
  if (document_type === 'convocation') {
    return `${baseContext}
${userDefinedContent}

TAREFA: Gerar uma CONVOCATÓRIA/CONVITE formal para esta reunião.

O documento deve incluir:
1. Cabeçalho formal da empresa ELP Green Technology
2. Saudação aos participantes
3. Informações da reunião (data, hora, local/link)
4. Breve descrição do objetivo da reunião
5. ${hasUserNotes ? 'Pauta resumida BASEADA NAS NOTAS DO USUÁRIO (3-5 pontos principais extraídos das perguntas/tópicos fornecidos)' : 'Pauta resumida (3-5 pontos principais)'}
6. Solicitação de confirmação de presença
7. Informações de contato para dúvidas
8. Assinatura formal

${hasUserNotes ? '⚠️ A pauta resumida DEVE refletir os tópicos/perguntas específicos que o usuário definiu.' : ''}
Seja profissional e cordial.
Use markdown para formatação.`;
  }
  
  if (document_type === 'summary') {
    return `${baseContext}
${userDefinedContent}

TAREFA: Gerar um RESUMO EXECUTIVO profissional para esta reunião.

O resumo deve incluir:
1. Cabeçalho com informações da reunião
2. Lista de participantes presentes
3. Principais tópicos discutidos ${hasUserNotes ? '(baseados nos tópicos/perguntas definidos pelo usuário)' : ''}
4. Decisões tomadas (em formato de lista)
5. Ações definidas com responsáveis e prazos
6. Próximos passos
7. Data da próxima reunião (se aplicável)
8. Observações importantes

${hasUserNotes ? '⚠️ Os tópicos discutidos devem refletir a pauta original definida pelo usuário.' : 'Baseie-se no contexto do lead e histórico para criar um resumo coerente.'}
Seja objetivo e profissional.
Use markdown para formatação.`;
  }
  
  return baseContext;
}

function buildOrganizeNotesPrompt(rawText: string, language: string): string {
  const langInstructions = language === 'pt' 
    ? 'Escreva em português brasileiro profissional e formal.'
    : language === 'en'
    ? 'Write in professional and formal English.'
    : language === 'es'
    ? 'Escriba en español profesional y formal.'
    : language === 'it'
    ? 'Scrivere in italiano professionale e formale.'
    : 'Write in professional and formal Chinese.';

  return `${langInstructions}

TAREFA: Você é um assistente executivo profissional. Organize o texto bruto abaixo em uma ATA DE REUNIÃO estruturada e profissional.

TEXTO BRUTO PARA ORGANIZAR:
"""
${rawText}
"""

INSTRUÇÕES:
1. Analise o texto e identifique:
   - Participantes mencionados
   - Tópicos/assuntos discutidos
   - Decisões tomadas
   - Ações acordadas (com responsáveis se mencionados)
   - Prazos definidos
   - Próximos passos

2. Estruture a ata no seguinte formato:

# ATA DE REUNIÃO

**Data:** [extraia do texto ou coloque "A definir"]
**Participantes:** [liste os participantes identificados]

## Pauta Discutida
[Liste os principais tópicos discutidos, organizados por assunto]

## Decisões Tomadas
[Liste as decisões em formato de bullet points]

## Ações e Responsáveis
| Ação | Responsável | Prazo |
|------|-------------|-------|
[Preencha com as ações identificadas]

## Próximos Passos
[Liste os próximos passos acordados]

## Observações
[Qualquer informação adicional relevante]

---

IMPORTANTE:
- Mantenha todas as informações importantes do texto original
- Organize de forma clara e profissional
- Se alguma informação não estiver clara, indique "[A confirmar]"
- Use bullet points e formatação markdown
- Seja objetivo e conciso`;
}

function generateLocalFallback(rawText: string, language: string): string {
  const isPortuguese = language === 'pt';
  
  // Try to extract some structure from the raw text
  const lines = rawText.split('\n').filter(l => l.trim());
  const bulletPoints = lines.filter(l => l.match(/^[-•*]\s|^\d+\.\s/)).slice(0, 15);
  const possibleNames = rawText.match(/[A-Z][a-záàâãéèêíïóôõöúçñ]+\s[A-Z][a-záàâãéèêíïóôõöúçñ]+/g) || [];
  const uniqueNames = [...new Set(possibleNames)].slice(0, 5);
  
  if (isPortuguese) {
    return `# ATA DE REUNIÃO

**⚠️ Nota:** Gerado localmente (API de IA temporariamente indisponível). Por favor, revise e complete.

---

**Data:** [A definir - extrair do texto]

**Participantes Identificados:**
${uniqueNames.length > 0 ? uniqueNames.map(n => `- ${n}`).join('\n') : '- [Identificar participantes no texto]'}

---

## Texto Original para Referência

${rawText.substring(0, 4000)}${rawText.length > 4000 ? '\n\n... [texto truncado para exibição]' : ''}

---

## Estrutura Sugerida para Completar

### Pauta Discutida
${bulletPoints.length > 0 ? bulletPoints.join('\n') : '- [Extrair tópicos principais do texto acima]'}

### Decisões Tomadas
- [Identificar decisões mencionadas]

### Ações e Responsáveis
| Ação | Responsável | Prazo |
|------|-------------|-------|
| [Ação 1] | [Nome] | [Data] |

### Próximos Passos
- [Definir próximos passos]

---

*💡 Dica: Tente novamente em 2-3 minutos para usar a IA para organização automática.*`;
  }
  
  return `# MEETING MINUTES

**⚠️ Note:** Generated locally (AI API temporarily unavailable). Please review and complete.

---

**Date:** [To be defined - extract from text]

**Identified Participants:**
${uniqueNames.length > 0 ? uniqueNames.map(n => `- ${n}`).join('\n') : '- [Identify participants in text]'}

---

## Original Text for Reference

${rawText.substring(0, 4000)}${rawText.length > 4000 ? '\n\n... [text truncated for display]' : ''}

---

## Suggested Structure to Complete

### Agenda Discussed
${bulletPoints.length > 0 ? bulletPoints.join('\n') : '- [Extract main topics from text above]'}

### Decisions Made
- [Identify decisions mentioned]

### Actions and Owners
| Action | Owner | Deadline |
|--------|-------|----------|
| [Action 1] | [Name] | [Date] |

### Next Steps
- [Define next steps]

---

*💡 Tip: Try again in 2-3 minutes to use AI for automatic organization.*`;
}

async function generateWithClaude(prompt: string): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('Anthropic API key not configured');
  }
  
  console.log('Attempting Claude API...');
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Claude error ${response.status}: ${errorText}`);
    throw new Error(`Claude API error: ${response.status}`);
  }
  
  const data = await response.json();
  const content = data.content?.[0]?.text;
  
  if (!content) {
    throw new Error('No content in Claude response');
  }
  
  console.log('Claude generation successful');
  return content;
}

async function generateWithAI(prompt: string): Promise<{ content: string; usedFallback: boolean; provider: string }> {
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  // Try Gemini with 7-key rotation
  if (GEMINI_API_KEYS.length > 0) {
    for (let keyAttempt = 0; keyAttempt < GEMINI_API_KEYS.length; keyAttempt++) {
      const currentKey = getNextGeminiKey();
      if (!currentKey) break;
      const keyIndex = currentGeminiKeyIndex;
      
      try {
        console.log(`🔑 Trying Gemini key ${keyIndex + 1}/${GEMINI_API_KEYS.length}`);
        
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${currentKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.7, maxOutputTokens: 4096 }
            })
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (content) {
            console.log(`✅ Gemini key ${keyIndex + 1} success`);
            return { content, usedFallback: false, provider: `gemini-key-${keyIndex + 1}` };
          }
        }
        
        if (response.status === 429 || response.status === 503 || response.status === 529) {
          console.log(`⚠️ Gemini key ${keyIndex + 1} rate limited (${response.status}), rotating...`);
          rotateGeminiKey(true);
          continue;
        }
        
        const errorText = await response.text();
        console.error(`❌ Gemini key ${keyIndex + 1} error ${response.status}: ${errorText.substring(0, 200)}`);
        
      } catch (error) {
        console.error(`Gemini key ${keyIndex + 1} failed:`, error);
        rotateGeminiKey(true);
      }
      
      await sleep(500);
    }
    console.log(`⛔ All ${GEMINI_API_KEYS.length} Gemini keys exhausted, trying Claude fallback`);
  }
  
  // Try Claude as fallback
  if (ANTHROPIC_API_KEY) {
    try {
      const content = await generateWithClaude(prompt);
      return { content, usedFallback: false, provider: 'claude' };
    } catch (error) {
      console.error('Claude fallback failed:', error);
    }
  }
  
  // All AI attempts failed
  console.log('All AI providers failed');
  throw new Error('AI APIs temporarily unavailable');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: MeetingPayload = await req.json();
    
    // Handle organize_notes with fallback
    if (payload.document_type === 'organize_notes') {
      if (!payload.raw_text || payload.raw_text.trim().length < 10) {
        return new Response(
          JSON.stringify({ error: 'raw_text is required and must be at least 10 characters' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const prompt = buildOrganizeNotesPrompt(payload.raw_text, payload.language || 'pt');
      console.log('Organizing notes with prompt length:', prompt.length);
      
      let generatedContent: string;
      let usedFallback = false;
      let provider = 'local';
      
      try {
        const result = await generateWithAI(prompt);
        generatedContent = result.content;
        usedFallback = result.usedFallback;
        provider = result.provider;
      } catch (error) {
        console.log('Using local fallback for organize_notes');
        generatedContent = generateLocalFallback(payload.raw_text, payload.language || 'pt');
        usedFallback = true;
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          content: generatedContent,
          document_type: 'organize_notes',
          used_fallback: usedFallback
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // For other document types, meeting_data.title is required
    if (!payload.document_type || !payload.meeting_data?.title) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch lead context if available
    let leadContext = '';
    if (payload.meeting_data.lead_id && payload.meeting_data.lead_type) {
      leadContext = await getLeadContext(
        supabase, 
        payload.meeting_data.lead_id, 
        payload.meeting_data.lead_type
      );
    }

    // Fetch previous meetings for context
    const previousMeetings = await getPreviousMeetings(
      supabase,
      payload.meeting_data.lead_id || '',
      payload.meeting_data.plant_type
    );

    // Build and execute prompt
    const prompt = buildPrompt(payload, leadContext, previousMeetings);
    console.log('Generating document with prompt length:', prompt.length);
    
    let generatedContent: string;
    let usedFallback = false;
    let provider = 'unknown';
    
    try {
      const result = await generateWithAI(prompt);
      generatedContent = result.content;
      usedFallback = result.usedFallback;
      provider = result.provider;
    } catch (error) {
      // For non-organize_notes, return error (no good local fallback for complex docs)
      throw error;
    }

    // If meeting_id provided, update the meeting record
    if (payload.meeting_id) {
      const updateData: Record<string, any> = {};
      
      if (payload.document_type === 'agenda') {
        updateData.agenda_content = generatedContent;
        updateData.agenda_generated_at = new Date().toISOString();
      } else if (payload.document_type === 'summary') {
        updateData.summary_content = generatedContent;
        updateData.summary_generated_at = new Date().toISOString();
      } else if (payload.document_type === 'convocation') {
        updateData.convocation_sent_at = new Date().toISOString();
      }

      await supabase
        .from('meetings')
        .update(updateData)
        .eq('id', payload.meeting_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        content: generatedContent,
        document_type: payload.document_type,
        used_fallback: usedFallback
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error generating meeting document:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
