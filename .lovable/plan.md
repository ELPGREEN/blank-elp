

# Brilho Pulsante nos Cards + Correcao de Botoes e Cores na Pagina About

## Problemas Identificados

1. **Cards sem efeito de brilho nas bordas** - Os GlassCards nao tem nenhum efeito visual ao passar o mouse que simule brilho metalico nas bordas.
2. **Botoes "apagados" no hero da pagina About** - Os botoes `elp-white` e `elp-white-outline` no hero aparecem sem destaque, quase invisiveis sobre o fundo escuro.
3. **Cores fora da paleta metalica** - Headquarters usa cores de bandeiras (verde, vermelho, amarelo) nos icones e gradientes dos cards, quebrando a identidade visual.
4. **Valores com cores inconsistentes** - O array `values` usa `from-elp-teal to-cyan-400` (transparency) que foge do padrao azul metalico.
5. **Marcadores do globo 3D no About** - Ainda usam cores de bandeiras (verde, amarelo, vermelho, laranja) em vez de tons de azul metalico.

---

## O que sera feito

### 1. Efeito de brilho pulsante nas bordas dos cards (CSS global)

Adicionar ao componente `GlassCard` um efeito de `box-shadow` animado que pulsa sutilmente ao hover, simulando uma borda metalica brilhante.

- Keyframe `border-glow-pulse` que alterna entre sombra sutil e sombra mais intensa
- Ativado apenas no hover para nao poluir visualmente
- Cor do brilho em azul metalico com toque dourado

### 2. Correcao dos botoes do hero About

- Botao `elp-white`: Aumentar contraste, adicionar `shadow-2xl` e borda mais visivel
- Botao `elp-white-outline`: Aumentar opacidade da borda e do texto para melhor visibilidade sobre fundo escuro

### 3. Padronizacao das cores dos headquarters

- Substituir os gradientes `from-green-500 to-red-500`, `from-green-500 to-yellow-500`, etc. por gradientes de azul metalico com variacoes sutis para diferenciar cada escritorio
- Manter as mini-bandeiras (flagColors) apenas nos labels flutuantes do globo (sao indicadores geograficos, aceitavel)
- Remover as cores de bandeira dos icones dos cards de headquarters

### 4. Padronizacao das cores dos valores

- Substituir `from-elp-teal to-cyan-400` por `from-primary to-accent` (dentro da paleta azul)

### 5. Marcadores do globo 3D (About)

- Substituir cores verde/amarelo/vermelho/laranja por variacoes de azul metalico

---

## Detalhes Tecnicos

### Arquivo: `src/index.css`

**Nova keyframe e regra para GlassCard hover glow:**
```css
@keyframes border-glow-pulse {
  0%, 100% { box-shadow: 0 0 8px hsl(210 50% 40% / 0.15), 0 0 20px hsl(42 60% 50% / 0.05); }
  50% { box-shadow: 0 0 15px hsl(210 50% 40% / 0.25), 0 0 35px hsl(42 60% 50% / 0.1); }
}
```

**Melhorar visibilidade do `btn-metal-white`:**
- Aumentar opacidade da borda
- Adicionar sombra mais forte

**Melhorar `elp-white-outline`:**
- Aumentar opacidade do border e texto de `border-white/80` para `border-white` e adicionar shadow

### Arquivo: `src/components/ui/glass-card.tsx`

- Adicionar classe de hover glow pulsante no componente

### Arquivo: `src/pages/About.tsx`

- **Headquarters colors**: Trocar `from-green-500 to-red-500` (Italy) para `from-primary to-secondary`, `from-green-500 to-yellow-500` (Brazil) para `from-secondary to-accent`, etc.
- **Values colors**: Trocar `from-elp-teal to-cyan-400` para `from-primary to-accent`
- **Globe markers**: Trocar cores `#22c55e`, `#eab308`, `#ef4444`, `#f97316` para tons de azul metalico
- **Hero buttons**: Adicionar classes de sombra e destaque extras

### Arquivo: `src/components/ui/button.tsx`

- Ajustar variante `elp-white-outline` para maior contraste

### Arquivos a modificar
1. `src/index.css` - Keyframe de glow pulsante, ajuste btn-metal-white
2. `src/components/ui/glass-card.tsx` - Classe de hover glow
3. `src/pages/About.tsx` - Cores padronizadas nos headquarters, valores e globo
4. `src/components/ui/button.tsx` - Variante elp-white-outline mais visivel

