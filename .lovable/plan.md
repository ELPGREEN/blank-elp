

# Redesign Completo: Metal Escovado Profissional

## Resumo

Aplicar duas texturas metalicas de referencia (azul metalico escovado + metal escuro/grafite) em todo o site, garantindo legibilidade total, removendo emojis/desenhos, e corrigindo espacamentos e contrastes.

---

## Regras de Design

| Elemento | Tratamento |
|---|---|
| Fundos brancos existentes | NAO alterar |
| Areas azul claro (bg-primary/10, etc.) | Substituir por gradiente metalico azul sutil |
| Botoes escuros | Textura metal azul escovado, texto BRANCO |
| Botoes brancos | Textura "metal branco" (gradiente prata sutil), texto ESCURO navy |
| Botoes outline | Borda metalica escura, texto escuro, hover com fundo metalico sutil |
| Linhas divisorias | Metal escuro (grafite da 2a esfera), nao dourado |
| Detalhes especiais (hover, brilho) | Ouro sutil apenas em efeitos de hover e acentos |
| Emojis | Remover TODOS (cadeado, warning, bandeiras decorativas em texto) |
| Icones Lucide | Manter - sao vetoriais profissionais |

---

## Detalhes Tecnicos

### 1. CSS - Tokens e Classes (`src/index.css`)

**Novos gradientes baseados nas esferas de referencia:**

- `--gradient-metal-blue`: Gradiente que replica a esfera azul metalica (tons HSL 205-215, saturacao 50-65%, luminosidade 10-40% com highlight central em 55%)
- `--gradient-metal-dark`: Gradiente que replica a esfera grafite/escura (tons HSL 0-220, saturacao 5-15%, luminosidade 8-35% com reflexos brancos)
- `--gradient-metal-white`: Metal branco/prata escovado (luminosidade 85-98%, saturacao muito baixa, com micro-reflexos)

**Classes de botao:**
- `.btn-metal-blue` - fundo metal azul, texto branco, textura ranhuras, gold-sweep no hover
- `.btn-metal-dark` - fundo metal grafite, texto branco
- `.btn-metal-white` - fundo prata escovado, texto navy escuro
- Todas com `tracking-wide` e `font-semibold`

**Correcao de linhas divisorias:**
- Trocar linhas douradas por linhas metalicas escuras (grafite) - usar `--gradient-metal-dark` nas bordas e separadores

### 2. Botoes (`src/components/ui/button.tsx`)

Atualizar TODAS as variantes:

- `default` / `elp-solid` / `elp-metal`: Metal azul escovado (da 1a esfera), texto branco, borda gold/15 sutil
- `elp-white`: Gradiente prata/branco escovado, texto navy escuro, borda metalica escura
- `elp-white-outline`: Borda branca, texto branco (para uso sobre fundos escuros)
- `elp-gold`: Gradiente dourado, texto navy escuro
- `elp-gold-outline`: Borda dourada, texto dourado
- `outline`: Borda metal escuro, texto navy, hover metal sutil
- `secondary`: Metal escuro (2a esfera), texto branco
- `destructive`: Manter vermelho
- `ghost` / `link`: Manter sem textura

Adicionar `tracking-wide` globalmente a todos os botoes.

### 3. Pagina Principal (`src/pages/Index.tsx`)

- **Linha 296**: Remover emoji `⚠️` - usar apenas texto em negrito
- **Linha 819**: Remover emoji `🔒` - usar apenas texto
- **Linha 231**: Banner `bg-gradient-to-r from-primary to-secondary` -> classe `brushed-metal` (metal azul)
- **Linha 826**: CTA Section `bg-gradient-to-r from-primary to-secondary` -> classe `brushed-metal` (metal azul)
- **Linhas 543-564**: Step numbers (`bg-primary`) -> gradiente metal azul
- **Badges** (`bg-primary/10`): Manter, sao sutis
- Verificar todos os textos: garantir contraste (branco sobre escuro, escuro sobre claro)

### 4. Header (`src/components/layout/Header.tsx`)

- Botao CTA: aplicar variante metal azul
- Remover emojis de bandeiras se aparecerem no header (linhas 18-22 tem emojis de bandeiras nos idiomas)

### 5. Footer (`src/components/layout/Footer.tsx`)

- Linha divisoria superior: trocar de dourado para metal escuro/grafite
- Botao newsletter: aplicar textura metal azul
- Bordas: metal escuro em vez de dourado

### 6. Outras Paginas (busca global)

Arquivos com `from-primary to-secondary` que precisam de `brushed-metal`:
- `src/pages/Solutions.tsx` (linha 741): Circular Economy section
- `src/pages/OTRPartnership.tsx`: Verificar CTAs
- `src/pages/Contact.tsx`: Verificar fundos azuis
- `src/pages/About.tsx`: Verificar secoes

### 7. Correcoes de Legibilidade (auditoria CSS global)

- Buscar todas as combinacoes de `text-primary` sobre `bg-primary` (invisivel)
- Buscar `text-white` sobre fundos claros
- Buscar `text-muted-foreground` sobre fundos escuros
- Corrigir cada ocorrencia garantindo contraste minimo

### 8. Espacamento de Caixas

- Verificar cards dentro de cards (GlassCard aninhados)
- Garantir padding consistente: cards externos `p-6` ou `p-8`, internos `p-3` ou `p-4`
- Verificar margens entre secoes (todas `py-20` consistente)

### 9. Glass Card e Card (`src/components/ui/glass-card.tsx`, `card.tsx`)

- Bordas: trocar `gold/10` por metal escuro `hsl(220 15% 25% / 0.2)` como padrao
- Hover: borda pode ter toque dourado sutil `gold/20`
- Sombras: manter profundidade metalica

---

## Arquivos a Modificar

1. `src/index.css` - Novos gradientes metal azul/escuro/branco, classes btn-metal-*, linhas escuras
2. `src/components/ui/button.tsx` - Todas as variantes com texturas metalicas + tracking
3. `src/pages/Index.tsx` - Remover emojis, aplicar metal nos CTAs e banners
4. `src/components/layout/Header.tsx` - Botao CTA metalico, remover emojis bandeiras
5. `src/components/layout/Footer.tsx` - Linhas e botoes metalicos escuros
6. `src/components/ui/glass-card.tsx` - Bordas metalicas escuras
7. `src/components/ui/card.tsx` - Consistencia de bordas
8. `src/pages/Solutions.tsx` - Secoes com fundo azul -> metal escovado
9. Demais paginas com `from-primary to-secondary` - Substituir por metal escovado

