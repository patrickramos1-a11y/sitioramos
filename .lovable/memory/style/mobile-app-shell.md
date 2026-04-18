---
name: Mobile App Shell
description: No mobile, layout usa header sticky compacto + bottom navigation tabs (5 pilares). Conteúdo precisa de pb-safe-nav para não ficar escondido pela barra inferior.
type: design
---
# Mobile App Shell

No mobile (<768px), a plataforma adota uma experiência de app nativo:

## Layout
- **Header sticky** (h-14): logo + título da rota + safe-area top
- **Bottom Navigation fixa** (h-16 + safe-area bottom): 5 itens (Início, Áreas, Caixa, Operação, Mais)
- O botão "Mais" abre um Sheet (bottom sheet) com Propriedade, Empréstimos, Contatos
- Conteúdo principal usa `pb-safe-nav` (= safe-area-inset-bottom + 4.5rem) para evitar sobreposição
- Sidebar do shadcn é usada APENAS no desktop (>=768px)

## Tipografia mobile
- Cards KPI: title `text-[11px]`, valor `text-base` ou `text-xl`
- Headers de página H1 ficam ocultos no mobile (`hidden md:block`) — o título já está no header sticky
- Padding de cards reduzido: `p-3 md:p-6`

## Inputs
- Forçar `font-size: 16px` no mobile (CSS global) para evitar zoom automático no iOS
- Botões e tabs com altura mínima 44px (h-11) para touch confortável

## Tabelas vs Listas
- Tabelas (`<Table>`) ficam ocultas no mobile (`hidden md:block`)
- Versão mobile usa lista vertical de cards/items com `divide-y` e `active:bg-muted/40` para feedback de toque
- Use a classe utilitária `tap-card` para feedback de press (scale 0.98)

## Utilitárias CSS criadas
- `pt-safe`, `pb-safe`, `pb-safe-nav` — safe areas
- `no-scrollbar` — scroll horizontal sem barra
- `tap-card` — feedback de toque
