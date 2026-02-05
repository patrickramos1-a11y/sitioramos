
# Reestruturação Completa da Plataforma Sítio Ramos

## Resumo Executivo

Vou reorganizar a navegação e arquitetura da plataforma para torná-la mais intuitiva e alinhada com a lógica de negócio agrícola, onde **Áreas** são o centro da operação e **Ciclos** são sub-entidades dentro delas.

---

## Nova Estrutura de Navegação

```text
MENU PRINCIPAL (Sidebar)
+----------------------------------+
|  [Logo] Sítio Ramos              |
|                                  |
|  - Visão Geral (Dashboard)       |  <-- KPIs + Relatórios integrados
|  - Áreas                         |  <-- Principal, com ciclos dentro
|  - Fluxo de Caixa                |  <-- Submenu: Custos/Invest/Receitas
|  - Empréstimos                   |  <-- Gestão de dívidas
+----------------------------------+
```

### Mudancas Principais:

1. **Visão Geral** absorve os Relatórios
2. **Áreas** contém Ciclos (hierarquia correta)
3. **Fluxo de Caixa** agrupa Custos, Investimentos e Receitas como filtros/abas
4. **Relatórios** deixa de existir como aba separada
5. **Ciclos** deixa de existir como aba separada (vai para dentro de Áreas)

---

## 1. Nova Visão Geral (Dashboard + Relatórios)

### O que muda:
- Absorve os relatórios que estavam em aba separada
- Mostra KPIs principais com navegação direta
- Adiciona seção de análise consolidada (antes em /relatorios)

### Nova estrutura:
```text
VISÃO GERAL
+------------------------------------------+
|  CARDS DE KPIs (clicáveis)               |
|  [Saldo Caixa] [Áreas] [Investido]       |
|  [Dívida] [Resultado Líquido]            |
|                                          |
|  GRÁFICOS                                |
|  [Status das Áreas]  [Custos por Tipo]   |
|  [Evolução Mensal]                       |
|                                          |
|  ANÁLISE DETALHADA (ex-Relatórios)       |
|  Tabs: [Por Área] [Por Ciclo] [Dívidas]  |
+------------------------------------------+
```

### Correção do "Balanço Geral":
- Renomear para **"Resultado Líquido"**
- Descrição: "Receitas - Custos - Juros"
- Incluir juros de empréstimo no cálculo

---

## 2. Nova Página de Áreas com Ciclos Integrados

### O que muda:
- Cada card de área mostra resumo financeiro
- Ao clicar, abre página de detalhe da área
- Ciclos aparecem dentro da área (não em aba separada)

### Estrutura do Card de Área:
```text
+----------------------------------------+
|  [Icon] ÁREA NOME           [Menu ▼]   |
|  10.5 ha | Status: Plantada            |
|                                        |
|  Financeiro:                           |
|  Custos: R$ 15.000  | Receitas: R$ 20k |
|  Investido: R$ 5.000                   |
|                                        |
|  2 ciclos ativos                       |
|                                        |
|  [Ver Detalhes] [Fluxo de Caixa]      |
+----------------------------------------+
```

### Página de Detalhe da Área (nova):
```text
ÁREA: TALHÃO 1
+------------------------------------------+
|  Resumo: 10.5 ha | Status: Plantada      |
|                                          |
|  RESUMO FINANCEIRO                       |
|  [Custos] [Investimentos] [Receitas]     |
|                                          |
|  CICLOS PRODUTIVOS                       |
|  +------------------------------------+  |
|  | Ciclo Milho 2025                  |  |
|  | Status: Ativo | Custos: R$ 8.000  |  |
|  +------------------------------------+  |
|  | Ciclo Soja 2024                   |  |
|  | Status: Finalizado | Lucro: R$ 5k |  |
|  +------------------------------------+  |
|                                          |
|  [+ Novo Ciclo]                          |
+------------------------------------------+
```

---

## 3. Fluxo de Caixa com Submenu/Abas

### O que muda:
- Página única com abas para filtrar por tipo
- Custos, Investimentos e Receitas viram subviews
- Formulários de lançamento integrados

### Estrutura:
```text
FLUXO DE CAIXA
+------------------------------------------+
|  SALDO: R$ 152.810,00                    |
|  Entradas: R$ 260k | Saídas: R$ 107k     |
|                                          |
|  TABS:                                   |
|  [Todos] [Custos] [Investimentos]        |
|  [Receitas] [Empréstimos]                |
|                                          |
|  FILTROS: Área | Ciclo | Período         |
|                                          |
|  TABELA DE TRANSAÇÕES                    |
|  ...                                     |
|                                          |
|  [+ Nova Movimentação]                   |
+------------------------------------------+
```

### Rotas simplificadas:
- `/caixa` - Fluxo completo
- `/caixa?tab=custos` - Filtrado por custos
- `/caixa?tab=investimentos` - Filtrado por investimentos
- `/caixa?tab=receitas` - Filtrado por receitas

---

## 4. Logo Oficial

Vou copiar e integrar o logo fornecido na sidebar.

---

## Arquivos que Serão Alterados

### Novos:
| Arquivo | Descrição |
|---------|-----------|
| `src/pages/AreaDetalhe.tsx` | Página de detalhe da área com ciclos |
| `src/assets/logo.png` | Logo oficial copiado |

### Modificados:
| Arquivo | Mudança |
|---------|---------|
| `src/App.tsx` | Remover rotas /ciclos, /custos, /investimentos, /receitas, /relatorios. Adicionar /areas/:id |
| `src/components/layout/AppSidebar.tsx` | Nova estrutura de menu, logo oficial, submenu Caixa |
| `src/pages/Dashboard.tsx` | Absorver conteúdo de Relatórios (tabs analíticos) |
| `src/pages/Areas.tsx` | Cards com resumo financeiro, link para detalhe |
| `src/components/areas/AreaCard.tsx` | Adicionar dados financeiros, ciclos vinculados |
| `src/pages/Caixa.tsx` | Adicionar tabs para tipos de transação |
| `src/hooks/useDashboardStats.ts` | Corrigir "Balanço Geral" para incluir juros |

### Removidos (conteúdo migrado):
| Arquivo | Destino do Conteúdo |
|---------|---------------------|
| `src/pages/Ciclos.tsx` | Migrado para AreaDetalhe.tsx |
| `src/pages/Custos.tsx` | Migrado para Caixa.tsx (tab) |
| `src/pages/Investimentos.tsx` | Migrado para Caixa.tsx (tab) |
| `src/pages/Receitas.tsx` | Migrado para Caixa.tsx (tab) |
| `src/pages/Relatorios.tsx` | Migrado para Dashboard.tsx |

---

## Detalhamento Tecnico

### 1. Nova Sidebar com Submenu
```typescript
const navigationItems = [
  {
    title: "Visão Geral",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Áreas",
    url: "/areas",
    icon: MapPin,
  },
  {
    title: "Fluxo de Caixa",
    icon: Wallet,
    submenu: [
      { title: "Todos", url: "/caixa" },
      { title: "Custos", url: "/caixa?tab=custos" },
      { title: "Investimentos", url: "/caixa?tab=investimentos" },
      { title: "Receitas", url: "/caixa?tab=receitas" },
    ],
  },
  {
    title: "Empréstimos",
    url: "/emprestimos",
    icon: Landmark,
  },
];
```

### 2. Dashboard com Relatórios Integrados
- Adicionar `<Tabs>` após os gráficos
- Migrar conteúdo de `Relatorios.tsx` (por área, por ciclo, empréstimos)
- Corrigir cálculo do balanço geral:
```typescript
// Antes
const balancoGeral = totalReceitas - totalCustos;

// Depois  
const jurosEmprestimos = installments
  .filter(i => i.status === "paga")
  .reduce((sum, i) => sum + Number(i.valor_juros || 0), 0);
const resultadoLiquido = totalReceitas - totalCustos - jurosEmprestimos;
```

### 3. Área com Ciclos Integrados
- Nova rota: `/areas/:id`
- Página `AreaDetalhe.tsx` com:
  - Dados da área
  - Resumo financeiro (custos, investimentos, receitas)
  - Lista de ciclos com CRUD
  - Link para caixa filtrado

### 4. Caixa com Tabs
- Usar `useSearchParams` para ler `tab`
- Tabs: Todos, Custos, Investimentos, Receitas
- Formulários de cada tipo acessíveis via modal

---

## Resultado Final

| Antes | Depois |
|-------|--------|
| 9 itens no menu | 4 itens no menu |
| Relatórios separados | Integrados na Visão Geral |
| Ciclos soltos | Dentro de cada Área |
| Custos/Invest/Receitas separados | Abas do Fluxo de Caixa |
| Balanço = Receitas - Custos | Resultado = Receitas - Custos - Juros |
| Logo genérico | Logo oficial do Sítio Ramos |
