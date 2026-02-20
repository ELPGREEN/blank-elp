
# Upgrade Premium: Site Empresarial Internacional — ELP Green Technology

## Diagnóstico Atual

O site já possui uma base sólida com metal brushed, gradientes HSL, animações Framer Motion e Three.js para partículas. Porém, há lacunas críticas para um site empresarial de classe internacional:

- **ParticleField** usa cor verde `#22c55e` (cor de startups tech), incompatível com a identidade navy/gold
- **Partículas** são simples pontos giratórios — sem conexões, sem profundidade
- **Canvas/WebGL** sem efeitos de pós-processamento (bloom, depth of field)
- **Seções de conteúdo** sem separadores visuais elaborados entre elas
- **Cards** sem efeito de tilt 3D ao hover
- **Tipografia** sem hierarquia de pesos — todos os títulos usam o mesmo shimmer
- **Scroll transitions** inexistentes — seções aparecem de forma abrupta
- **Mobile** sem ajustes de densidade visual (mesmos elementos pesados em telas pequenas)
- **Fundo das seções claras** plain branco sem textura
- **Ausência de cursor personalizado** no desktop para reforçar o premium

---

## Arquitetura do Upgrade

### 1. ParticleField — Upgrade Completo WebGL/Three.js

**Arquivo:** `src/components/3d/ParticleField.tsx`

Substituir o simples `PointMaterial` verde por um sistema de partículas com:

- **Cor corrigida**: partículas em navy/gold (`#1e3a5f` e `#b8902a`) alinhadas com a paleta ELP
- **Conexões dinâmicas (Lines)**: desenhar linhas entre partículas próximas (< threshold), criando uma "rede neural" metálica — efeito usado por sites Fortune 500
- **Mouse interaction**: as partículas reagem à posição do mouse, criando uma onda de repulsão suave
- **Two-layer**: camada de partículas pequenas (fundo) + camada de pontos maiores (foreground) com velocidades diferentes — sensação de profundidade
- **Performance adaptive**: manter a lógica de `useDevicePerformance` já existente

```
Canvas (WebGL)
├── Layer 1: Small navy particles (300-800) — rotação lenta
├── Layer 2: Gold accent dots (50-150) — rotação contrária
└── Connections: LineSegments entre vizinhos próximos (transparente)
```

**Técnica**: usar `BufferGeometry` + `LineSegments` com `LineBasicMaterial` — nativo no Three.js, sem dependências novas.

---

### 2. Hero Section — Efeito de Abertura Cinematográfico

**Arquivo:** `src/pages/Index.tsx` (seção Hero)

- **Reveal animation**: ao carregar, o texto surge com `clipPath` revelando-se de baixo para cima (técnica "curtain reveal" — usada por agências premium)
- **Parallax multicamada**: a imagem de fundo já tem parallax, mas adicionar uma segunda camada com gradiente overlay que se move mais devagar que a imagem
- **Glitch text effect** sutil no título principal — 1-2 frames de deslocamento leve no loop, reforçando o tech industrial
- **Contador animado** nos stats abaixo do hero com IntersectionObserver

---

### 3. Sistema de Divisores de Seção Premium

**Arquivo:** `src/index.css`

Criar classes CSS para transições visuais entre seções:

- **`.section-divider-wave`**: SVG wave customizado em navy que separa seções claras de escuras
- **`.section-divider-diagonal`**: corte diagonal de 3-4 graus entre seções (usado por sites industriais top-tier)
- **`.section-fade-edge`**: gradiente de 120px nas bordas inferior/superior de cada seção para transição suave

---

### 4. Cards com Tilt 3D Interativo

**Arquivo:** `src/components/ui/glass-card.tsx`

Adicionar efeito de **perspectiva 3D ao hover** usando `onMouseMove`:

```
MouseEvent → calcular offset X/Y relativo ao centro do card
→ aplicar rotateX/rotateY proporcional (max ±8deg)
→ mover um "specular highlight" (div pseudo com gradiente radial) na direção oposta
→ ao sair do hover, spring animation de retorno ao zero
```

Isso cria o efeito de "metal card" que reflete a luz — técnico mas alcançável sem bibliotecas externas, usando apenas `useRef` + `style` inline.

---

### 5. Cursor Personalizado (Desktop)

**Arquivo:** `src/index.css` + novo hook `src/hooks/useCursor.ts`

- Cursor padrão substituído por um círculo hollow navy (20px) com um dot central gold (4px)
- Ao hover de botões/links: cursor expande para 40px e muda de cor para gold
- Ao click: pulso de expansão rápido
- **Mobile**: detectado e desativado automaticamente

```css
.cursor-dot     /* 4px gold dot — segue o mouse diretamente */
.cursor-ring    /* 20px navy ring — segue com lag (lerp) */
```

Implementação: um componente `<CustomCursor />` montado no `App.tsx` usando `requestAnimationFrame` para lerp suave.

---

### 6. Tipografia — Sistema de Pesos e Escalas

**Arquivo:** `src/index.css` + `tailwind.config.ts`

Adicionar fontes do Google Fonts para hierarquia mais rica:

- **Display**: `Outfit` (já no config) — reforçar para H1/H2 hero sections
- **Body**: `Inter` (já no config) — padronizar para texto corrido
- **Mono accent**: adicionar `JetBrains Mono` para números de métricas/stats

Criar classes utilitárias:
- `.text-display` — Outfit Bold, letter-spacing -0.02em, 120% line-height
- `.text-metric` — JetBrains Mono, gold color, para números grandes como "1M tons"
- `.heading-section` — Outfit SemiBold com metal shimmer sutil (mais suave que os H1 atuais)

---

### 7. Backgrounds de Seção — Textura Premium

**Arquivo:** `src/index.css`

Adicionar variantes de fundo para seções claras (que atualmente são `bg-background` liso):

- **`.bg-noise-subtle`**: overlay de noise SVG inline (grain texture, 120px tile) com opacity 0.03 — presente em todos os sites Awwwards
- **`.bg-grid-premium`**: grid de linhas muito finas (1px, 60px espaçamento) em navy/4% opacity
- **`.section-light-premium`**: combina noise + grid + gradient sutil de cima para baixo

Estes são **CSS puro** (SVG data URI inline), zero impacto de performance.

---

### 8. Responsive Design Audit — Mobile-First

**Arquivos:** `src/components/layout/Header.tsx`, pages principais

Melhorias específicas para mobile:

- **Header mobile**: aumentar área de toque dos botões para 48px mínimo (WCAG)
- **Hero mobile**: reduzir quantidade de partículas ainda mais em telas < 768px (já parcialmente feito — reforçar)
- **Cards grid**: garantir que grades `lg:grid-cols-3` colapsuam para `grid-cols-1` com espaçamentos adequados no mobile
- **Tipografia mobile**: escala fluida com `clamp()` para títulos — evitar saltos bruscos entre breakpoints
- **Images**: adicionar `loading="lazy"` e `decoding="async"` a todas as imagens não críticas

---

### 9. Micro-animações de Estado

**Arquivo:** `src/index.css`

- **Button press**: ao `active:`, escalar para 0.97 com sombra reduzida — feedback tátil
- **Input focus**: borda navy com glow sutil (já parcialmente implementado)
- **Link hover**: underline animado com gradiente gold (classe `.animated-underline` já existe — aplicar globalmente)
- **Icon animations**: ícones em CTAs com `translateX(4px)` suave ao hover do botão pai

---

## Plano de Implementação (Sequência)

### Fase 1 — WebGL e Visual Core
1. `ParticleField.tsx` — upgrade completo com conexões e dual-layer navy/gold
2. `src/index.css` — noise texture, grid premium, section dividers

### Fase 2 — Componentes Interativos
3. `glass-card.tsx` — tilt 3D com specular highlight
4. `useCursor.ts` + `CustomCursor.tsx` — cursor premium
5. `App.tsx` — montar `<CustomCursor />`

### Fase 3 — Tipografia e Responsividade
6. `tailwind.config.ts` — adicionar fonte Mono, clamp typography
7. `index.css` — classes `.text-display`, `.text-metric`, `.heading-section`
8. `index.html` — preconnect + preload Google Fonts (`JetBrains Mono`)

### Fase 4 — Hero e Micro-animações
9. `Index.tsx` — clipPath reveal, parallax multicamada melhorado
10. `index.css` — button active states, icon hover animations

---

## Impacto por Tela

| Tela | Melhoria Principal |
|------|-------------------|
| Desktop 1920px | Cursor premium + partículas com conexões + tilt cards |
| Laptop 1280px | Tipografia display + section dividers |
| Tablet 768px | Grid responsivo + noise backgrounds |
| Mobile 390px | Partículas desativadas, CSS fallback gradient, touch areas 48px |

---

## Técnicas Avançadas — Resumo

| Técnica | Implementação | Onde |
|---------|--------------|------|
| WebGL Particle Network | Three.js LineSegments + BufferGeometry | ParticleField.tsx |
| CSS Noise Texture | SVG data URI inline | index.css |
| 3D Card Tilt | JS MouseEvent + CSS perspective | glass-card.tsx |
| Cursor Lerp | requestAnimationFrame + lerp function | useCursor.ts |
| ClipPath Reveal | Framer Motion + clipPath | Index.tsx hero |
| Section Diagonal Cut | CSS clip-path polygon | index.css |
| Fluid Typography | CSS clamp() | tailwind.config.ts |
| JetBrains Mono metrics | Google Fonts + custom class | index.html + index.css |

Todos os upgrades são **aditivos** — nenhuma remoção de funcionalidade existente. Zero quebras de layout. Performance mantida com fallbacks para dispositivos low-end.
