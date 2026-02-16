

# Efeito de Reflexo Animado em Botoes e Titulos

## Objetivo
Adicionar uma animacao de "luz passando" (light sweep) continua nos botoes metalicos e nos titulos (H1-H6), simulando um reflexo real de metal polido que se move constantemente, dando vida e sofisticacao.

---

## O que sera feito

### 1. Animacao de reflexo nos botoes metalicos

Todos os botoes com textura metalica (`.btn-metal-blue`, `.btn-metal-dark`, `.btn-metal-white`) receberao um pseudo-elemento `::before` com uma faixa de luz branca/dourada sutil que se move continuamente da esquerda para a direita em loop infinito, como um reflexo de luz real passando sobre uma superficie de metal.

- A faixa de luz sera um gradiente diagonal transparente > branco sutil > transparente
- Animacao em loop continuo (a cada ~4 segundos)
- No hover, o reflexo acelera (mais rapido, mais intenso)

### 2. Animacao de reflexo nos titulos (H1-H6)

Os titulos que ja usam gradiente metalico azul receberao uma animacao no `background-position` que faz o gradiente se mover sutilmente, criando a ilusao de reflexo metalico vivo nas letras.

- O gradiente do texto sera expandido (background-size: 200%) e animado horizontalmente
- Movimento lento e elegante (~6 segundos por ciclo)
- Efeito sutil para nao distrair, mas dar a sensacao de "metal vivo"

---

## Detalhes Tecnicos

### Arquivo: `src/index.css`

**Nova keyframe para reflexo de botao:**
```css
@keyframes light-sweep {
  0% { left: -50%; opacity: 0; }
  10% { opacity: 0.6; }
  90% { opacity: 0.6; }
  100% { left: 150%; opacity: 0; }
}
```

**Pseudo-elemento `::before` nos botoes metalicos:**
- Adicionado a `.btn-metal-blue`, `.btn-metal-dark`, `.btn-metal-white`
- Gradiente diagonal branco sutil (transparente > branco 8-12% > transparente)
- `animation: light-sweep 4s ease-in-out infinite`
- No hover: `animation-duration: 1.5s` (mais rapido e intenso)

**Titulos com gradiente animado:**
- Ampliar o gradiente dos H1-H6 para `background-size: 200% 100%`
- Adicionar animacao com keyframe `metal-text-shimmer` que move o `background-position` de 0% a 100%
- Ciclo lento de ~8 segundos para elegancia

**Ajuste do gold-sweep existente no hover:**
- O `::after` (gold-sweep) permanece apenas no hover
- O `::before` (light-sweep) roda continuamente como reflexo constante
- Os dois efeitos se complementam: reflexo branco constante + flash dourado no hover

### Arquivos a modificar
1. `src/index.css` - Novas keyframes, pseudo-elementos `::before` nos botoes, animacao nos titulos

