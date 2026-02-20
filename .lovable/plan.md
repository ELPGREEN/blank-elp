
# Plano DEUS: Upgrade Total — Site Empresarial Internacional Premium

## Estado Atual vs. Objetivo

Com base na análise do código, os sistemas anteriores já implementaram:
- ParticleField com dual-layer navy/gold + conexões + mouse repulsion
- GlassCard com tilt 3D + specular highlight
- CustomCursor com lerp
- CSS classes: `.bg-noise-subtle`, `.bg-grid-premium`, `.section-light-premium`, `.section-divider-diagonal`, `.text-metric`, `.text-display`
- JetBrains Mono e Outfit no `index.html`

O que AINDA FALTA para atingir o nível "DEUS":

1. **Index.tsx**: Seções sem noise/grid premium. Stats sem `.text-metric`. Sem dividers diagonais entre seções. Sem curtain reveal no hero.
2. **Contact.tsx (rota atual)**: Hero sem upgrade visual. Seções sem backgrounds premium. Cards de empresa sem upgrade de textura.
3. **Header**: Mobile sem áreas de toque 48px mínimas. Sem glassmorph upgrade no scroll.
4. **CSS global**: Tipografia fluida com `clamp()` ausente. Sem parallax multicamada no hero. Sem animações de scroll entrance em cards.
5. **index.css**: Duplicações a limpar. Falta `.container-wide` responsivo com `clamp()`. Faltam variantes de `section-divider-wave` com SVG. Falta `scroll-reveal` global via Intersection Observer CSS.
6. **Todas as páginas**: Badges sem `.bg-grid-premium`. Fundo de seções alternadas sem `.section-divider-diagonal`.

---

## Implementação por Arquivo

### 1. `src/index.css` — Sistema Global Completo

**Adicionar:**

- **Tipografia fluida com `clamp()`** para evitar saltos bruscos entre breakpoints:
```css
.text-display {
  font-size: clamp(2rem, 4vw + 1rem, 5rem);
}
h1 { font-size: clamp(1.75rem, 3.5vw + 0.5rem, 3.5rem); }
h2 { font-size: clamp(1.5rem, 2.5vw + 0.5rem, 2.75rem); }
h3 { font-size: clamp(1.25rem, 1.5vw + 0.5rem, 1.875rem); }
```

- **Section divider wave** com SVG inline para separação orgânica entre seções:
```css
.section-divider-wave::after {
  content: '';
  background: url("data:image/svg+xml,<svg...wave path...>");
  /* Onda navy de 80px de altura */
}
```

- **Scroll reveal animation** — classe `.scroll-reveal` com `@keyframes` que detecta `prefers-reduced-motion`:
```css
.scroll-reveal {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.scroll-reveal.is-visible {
  opacity: 1;
  transform: translateY(0);
}
```

- **Mobile touch targets 48px** — garantia global:
```css
@media (max-width: 768px) {
  button, a, [role="button"], input, select { min-height: 48px; }
}
```

- **Glass header upgrade** — adicionar variante `.glass-nav-premium` com deeper blur e gold border-bottom animado.

- **Hero parallax overlay** — classe `.hero-parallax-overlay` para a segunda camada de gradiente.

- **Limpeza de duplicações** — `.bg-noise-subtle`, `.bg-grid-premium`, `.section-divider-diagonal` aparecem duas vezes no arquivo (linhas ~1024-1082 e ~1194-1258). Remover duplicatas.

---

### 2. `src/pages/Index.tsx` — Hero e Seções Upgradeadas

**Hero Section:**
- Adicionar `curtain-reveal` no H1 via Framer Motion `clipPath`:
```tsx
<motion.h1
  initial={{ clipPath: 'inset(100% 0 0 0)', opacity: 0 }}
  animate={{ clipPath: 'inset(0% 0 0 0)', opacity: 1 }}
  transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
>
```
- Segunda camada parallax no overlay (gradiente que se move 50% mais lento que a imagem)
- Badge do hero com `.bg-grid-premium` e borda gold sutil

**Stats Cards (Partnership Model Section):**
```tsx
// Antes:
<p className="text-2xl font-bold">+60</p>
// Depois:
<p className="text-metric text-3xl">+60</p>
```

**Seções com dividers diagonais** — alternar entre seções claras/escuras:
```tsx
// Smart OTR section:
<section className="py-20 bg-gradient-to-br from-primary/10 via-background to-background section-divider-diagonal">

// Global Presence section:
<section className="py-20 bg-muted/30 section-divider-diagonal-reverse">
```

**CTA Section final** — adicionar `.bg-noise-subtle` + `.bg-grid-premium` ao fundo metálico.

**News cards** — adicionar `scroll-reveal` + hover com `border-gold/20`.

---

### 3. `src/pages/Contact.tsx` — Upgrade Completo (rota atual)

**Hero:**
- H1 com curtain reveal via `clipPath`
- Badge com `.bg-grid-premium` overlay
- Decorative tech elements com animação stagger

**Globe Section:**
```tsx
// Adicionar classe section-light-premium:
<section className="py-16 section-light-premium relative">
```

**Company Cards (ELP + TOPS):**
- Envolver em `GlassCard` com `tilt={true}` (já implementado no componente)
- Adicionar `.section-divider-diagonal` na seção de canais
- Header dos cards com `.btn-metal-blue` para os ícones
- Avatar containers com `ring-2 ring-gold/20 shadow-gold`

**Form Section:**
- Background com `.bg-grid-premium`
- Input fields com `transition-all` e focus glow via CSS existente
- Submit button com `.btn-metal-blue` + `btn-icon-slide`

**Office Cards:**
- Icones com cor gold ao hover: `group-hover:text-gold`
- Hover scale sutil: `group-hover:scale-105`

---

### 4. `src/components/layout/Header.tsx` — Mobile 48px + Glass Premium

**Mobile touch targets:**
```tsx
// Nav links no mobile menu — aumentar padding:
className="flex items-center gap-3 px-4 py-3.5 min-h-[48px] text-base..."
// Hamburger button:
className="h-12 w-12 hover:bg-muted" // era h-10 w-10
// Language selector:
className="h-12 px-3..." // era h-10
```

**Glass nav upgrade:**
```tsx
scrolled 
  ? "glass-nav-premium backdrop-blur-2xl border-b border-gold/10 shadow-xl"
  : "bg-gradient-to-b from-black/40 to-transparent"
```

**Mobile menu panel** — adicionar `.bg-noise-subtle` ao menu overlay:
```tsx
className="fixed top-16 right-0 bottom-0 z-50 w-full max-w-sm bg-background bg-noise-subtle border-l border-gold/10 shadow-2xl..."
```

---

### 5. `index.html` — Performance e Meta

- Adicionar `preconnect` para Google Fonts se ausente
- Verificar se `JetBrains Mono` e `Outfit` estão com `display=swap`
- Meta viewport com `viewport-fit=cover` para safe areas em dispositivos modernos:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
```

---

## Sequência de Implementação

### Fase 1 — CSS Global (base para tudo)
1. `src/index.css` — tipografia fluida com `clamp()`, remover duplicações, adicionar wave divider, mobile 48px, scroll-reveal

### Fase 2 — Páginas Principais  
2. `src/pages/Index.tsx` — curtain reveal hero, stats com `.text-metric`, dividers entre seções, CTA com noise
3. `src/pages/Contact.tsx` — hero upgrade, company cards premium, form com grid, offices hover gold

### Fase 3 — Componentes Globais
4. `src/components/layout/Header.tsx` — mobile 48px, glass-nav-premium, menu com noise texture
5. `index.html` — viewport-fit, verificar Google Fonts

---

## Impacto Visual por Tela

| Tela | Resultado |
|------|-----------|
| Desktop 1920px | Curtain reveal épico, cards com tilt+specular, cursor gold premium, noise em todas seções |
| Laptop 1280px | Tipografia fluida sem saltos, dividers diagonais visíveis, glass nav premium |
| Tablet 768px | Wave dividers adaptativos, grid premium no fundo, touch 48px |
| Mobile 390px | Touch 48px garantido, sem partículas (fallback gradient), tipografia clamp() |

---

## Técnicas Específicas Implementadas

| Técnica | Arquivo | Detalhe |
|---------|---------|---------|
| `clamp()` Typography | `index.css` | h1: `clamp(1.75rem, 3.5vw + 0.5rem, 3.5rem)` |
| Curtain Reveal | `Index.tsx`, `Contact.tsx` | `clipPath: 'inset(100% 0 0 0)'` → `inset(0%)` |
| Wave SVG Divider | `index.css` | `.section-divider-wave` com SVG data URI navy |
| Touch 48px | `index.css` + `Header.tsx` | WCAG AA compliance mobile |
| `.text-metric` nos stats | `Index.tsx` | JetBrains Mono gold shimmer nos números |
| Glass nav premium | `Header.tsx` | `backdrop-blur-2xl + saturate(180%)` |
| Gold ring nos avatars | `Contact.tsx` | `ring-2 ring-[hsl(42_50%_50%/0.2)]` |
| Noise texture no menu mobile | `Header.tsx` | `.bg-noise-subtle` no panel lateral |

Zero breaking changes. Todas as mudanças são puramente aditivas — classes adicionadas, não substituídas.
