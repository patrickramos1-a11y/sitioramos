
# Plano: Refazer o Painel Sítio Ramos com Funcionalidade Completa

## Situação Atual

O banco de dados está pronto com 7 tabelas vazias:
- areas, cycles, costs, investments, revenues, loans, installments

Porém o frontend:
- Usa dados fictícios (mock) nos gráficos
- Páginas de módulos são apenas placeholders vazios
- Não há formulários para cadastrar dados
- Não há integração real com o banco

---

## O Que Será Feito

### 1. Sistema de Login (sem cadastro)

**Arquivos a criar:**
- `src/pages/Auth.tsx` - Página de login simples (só email/senha)
- `src/contexts/AuthContext.tsx` - Gerenciamento de sessão
- `src/components/auth/ProtectedRoute.tsx` - Proteção de rotas

**Comportamento:**
- Se não logado, redireciona para /auth
- Login via email/senha (sem tela de cadastro)
- Você cria o usuário manualmente no backend depois

---

### 2. Dados de Exemplo

Inserir dados fictícios para o painel funcionar:
- 3 áreas com diferentes status
- 2 ciclos produtivos
- 8 custos variados
- 3 investimentos
- 2 receitas
- 1 empréstimo com parcelas

Isso vai preencher os gráficos automaticamente.

---

### 3. Módulo de Áreas (Completo)

**Página /areas com:**
- Lista de áreas em cards (buscando do banco)
- Botão "Nova Área" abre modal de formulário
- Campos: Nome, Tamanho (ha), Status, Cultura, Data início, Observações
- Cada card mostra indicadores (custos, receitas da área)
- Botão editar/excluir em cada card
- Filtro por status

**Arquivos:**
- `src/hooks/useAreas.ts` - Hook com TanStack Query para CRUD
- `src/components/areas/AreaCard.tsx` - Card de área
- `src/components/areas/AreaForm.tsx` - Formulário modal
- `src/components/areas/AreaList.tsx` - Lista com filtros
- `src/pages/Areas.tsx` - Reescrita completa

---

### 4. Módulo de Ciclos (Completo)

**Página /ciclos com:**
- Lista de ciclos agrupados por área
- Formulário: Área (select), Cultura, Datas, Status
- Vinculação obrigatória a uma área

**Arquivos:**
- `src/hooks/useCycles.ts`
- `src/components/cycles/CycleCard.tsx`
- `src/components/cycles/CycleForm.tsx`
- `src/pages/Ciclos.tsx`

---

### 5. Módulo de Custos (Completo)

**Página /custos com:**
- Tabela de custos com filtros (área, ciclo, tipo, período)
- Formulário: Data, Tipo, Valor, Forma pagamento, Área, Ciclo, Descrição
- Totalizador por categoria

**Arquivos:**
- `src/hooks/useCosts.ts`
- `src/components/costs/CostForm.tsx`
- `src/components/costs/CostTable.tsx`
- `src/pages/Custos.tsx`

---

### 6. Módulo de Investimentos

**Página /investimentos com:**
- Lista de investimentos (legalização, estrutura, etc.)
- Formulário: Data, Tipo, Valor, Descrição, Área (opcional), Rateado
- Separação: custos produtivos vs não-produtivos

**Arquivos:**
- `src/hooks/useInvestments.ts`
- `src/components/investments/InvestmentForm.tsx`
- `src/pages/Investimentos.tsx`

---

### 7. Módulo de Receitas

**Página /receitas com:**
- Lista de vendas/receitas
- Formulário: Data, Produto, Quantidade, Unidade, Preço, Área, Ciclo, Cliente
- Valor total calculado automaticamente

**Arquivos:**
- `src/hooks/useRevenues.ts`
- `src/components/revenues/RevenueForm.tsx`
- `src/pages/Receitas.tsx`

---

### 8. Módulo de Empréstimos

**Página /emprestimos com:**
- Lista de empréstimos com status
- Formulário: Credor, Valor, Data, Juros, Parcelas, Área, Ciclo
- Lista de parcelas com status (Paga/Pendente/Atrasada)
- Marcar parcela como paga

**Arquivos:**
- `src/hooks/useLoans.ts`
- `src/components/loans/LoanForm.tsx`
- `src/components/loans/InstallmentList.tsx`
- `src/pages/Emprestimos.tsx`

---

### 9. Dashboard com Dados Reais

**Atualizar Dashboard para:**
- Buscar totais reais do banco (áreas, custos, receitas, empréstimos)
- Gráficos dinâmicos baseados nos dados cadastrados
- Cards de resumo calculados em tempo real

**Arquivos a modificar:**
- `src/pages/Dashboard.tsx`
- `src/components/dashboard/StatCard.tsx`
- `src/components/dashboard/AreaStatusChart.tsx`
- `src/components/dashboard/CostDistributionChart.tsx`
- `src/components/dashboard/FinancialEvolutionChart.tsx`

**Novo hook:**
- `src/hooks/useDashboardStats.ts` - Agregação de dados para o dashboard

---

## Estrutura Técnica

### Hooks com TanStack Query

Cada módulo terá um hook reutilizável:

```text
useAreas() -> { areas, isLoading, createArea, updateArea, deleteArea }
useCycles(areaId?) -> { cycles, ... }
useCosts(filters?) -> { costs, ... }
useInvestments() -> { investments, ... }
useRevenues() -> { revenues, ... }
useLoans() -> { loans, ... }
```

### Formulários

Usando React Hook Form + Zod para validação:
- Campos obrigatórios validados
- Selects para enums (status, tipo, etc.)
- Selects dinâmicos para áreas/ciclos

### Ordem de Implementação

```text
Etapa 1: Auth + Dados de exemplo
        |
        v
Etapa 2: Áreas (módulo base)
        |
        v
Etapa 3: Ciclos (depende de Áreas)
        |
        v
Etapa 4: Custos + Investimentos
        |
        v
Etapa 5: Receitas + Empréstimos
        |
        v
Etapa 6: Dashboard dinâmico
```

---

## Resultado Final

- Login funcional
- Todas as 6 páginas com CRUD completo
- Dados de exemplo para visualizar
- Dashboard com indicadores reais
- Sistema 100% integrado com o banco
