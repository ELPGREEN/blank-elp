
# Reflexo no Logo ELP + Header Auto-Hide no Scroll

## O que sera feito

### 1. Efeito de reflexo animado no logo da ELP (leao)

O logo da ELP no header recebera um efeito de "luz passando" continuo, reutilizando a mesma keyframe `light-sweep` ja existente nos botoes metalicos. Sera aplicado via um wrapper com `position: relative` e `overflow: hidden`, com um pseudo-elemento `::after` que simula uma faixa de luz diagonal passando sobre o logo em loop.

- A classe CSS `.logo-metal-sweep` sera criada em `src/index.css`
- Pseudo-elemento `::after` com gradiente branco sutil diagonal
- Animacao `light-sweep` com ciclo de ~5 segundos (um pouco mais lento que botoes)
- No hover, acelera para ~2 segundos

### 2. Header auto-hide no scroll

O header (navbar) sera escondido quando o usuario rolar a pagina para baixo e reaparecera quando rolar para cima. Isso sera feito com logica de comparacao de `scrollY` anterior vs atual no `useEffect` existente.

- Novo estado `hidden` no componente Header
- Comparacao com `lastScrollY` via `useRef`
- Quando `scrollY > lastScrollY` e `scrollY > 80`: header sobe (translate-Y negativo)
- Quando `scrollY < lastScrollY`: header desce (aparece)
- Transicao suave com `transition-transform duration-300`
- O menu mobile aberto impede o auto-hide

---

## Detalhes Tecnicos

### Arquivo: `src/index.css`

Nova classe `.logo-metal-sweep`:
```css
.logo-metal-sweep {
  position: relative;
  overflow: hidden;
  display: inline-block;
}

.logo-metal-sweep::after {
  content: '';
  position: absolute;
  top: 0;
  left: -50%;
  width: 40%;
  height: 100%;
  background: linear-gradient(
    105deg,
    transparent 0%,
    hsl(0 0% 100% / 0.15) 48%,
    hsl(0 0% 100% / 0.2) 50%,
    hsl(0 0% 100% / 0.15) 52%,
    transparent 100%
  );
  transform: skewX(-15deg);
  animation: light-sweep 5s ease-in-out infinite;
  pointer-events: none;
}

.logo-metal-sweep:hover::after {
  animation-duration: 2s;
}
```

### Arquivo: `src/components/layout/Header.tsx`

- Adicionar `useRef` para `lastScrollY`
- Adicionar estado `hidden` (boolean)
- Modificar o `handleScroll` para comparar direcao do scroll
- Adicionar classe condicional `-translate-y-full` quando `hidden` e true
- Impedir hide quando `mobileMenuOpen` esta ativo
- Envolver o `<img>` do logo com a classe `logo-metal-sweep`

### Arquivos a modificar
1. `src/index.css` - Classe `.logo-metal-sweep` com pseudo-elemento e animacao
2. `src/components/layout/Header.tsx` - Logica de auto-hide + classe no logo
