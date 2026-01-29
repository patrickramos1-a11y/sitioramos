

# 🌳 Painel Sítio Ramos - Sistema de Gestão Agrícola

Sistema completo para gestão patrimonial, produtiva e financeira por área, com visual agro/rural e funcionamento em desktop e mobile.

---

## 🎨 Design & Experiência

**Identidade Visual Rural:**
- Paleta de cores terrosas: verde floresta, marrom terra, tons de bege
- Ícones relacionados à agricultura (plantas, trator, sol, chuva)
- Cards com bordas suaves e sombras naturais
- Tipografia clean mas acolhedora

**Layout Responsivo:**
- Desktop: Dashboard com sidebar de navegação
- Mobile: Menu hambúrguer com navegação fluida para registrar custos no campo

---

## 📊 Dashboard Principal (Visão Geral)

Cards de resumo mostrando:
- **Áreas Ativas** - total de hectares em produção
- **Capital Investido** - soma de todos os investimentos
- **Dívida Total** - empréstimos pendentes
- **Balanço Geral** - receitas vs custos

Gráficos:
- Distribuição de custos por tipo (pizza)
- Evolução financeira mensal (linha)
- Status das áreas (barras)

---

## 🗺️ Módulo de Áreas

**Cadastro de Área:**
- Nome da área
- Tamanho em hectares
- Status (Planejamento / Em preparo / Plantada / Em produção / Colhida)
- Cultura principal
- Data de início

**Visualização:**
- Cards ou lista de todas as áreas
- Indicadores rápidos por área (investido, produzido, ROI)
- Filtro por status

---

## 🔄 Módulo de Ciclos Produtivos

**Cadastro de Ciclo:**
- Vinculado à área
- Cultura do ciclo
- Data início do plantio
- Data prevista de colheita
- Data real de colheita
- Status do ciclo

**Timeline:**
- Visualização dos ciclos por área ao longo do tempo
- Comparativo entre ciclos da mesma área

---

## 💰 Módulo de Custos

**Registro de Custo:**
- Data
- Tipo (Preparo de solo / Mudas / Adubação / Herbicida / Mão de obra / Combustível / Trator / Outros)
- Valor
- Forma de pagamento (Dinheiro / Empréstimo)
- Área vinculada
- Ciclo vinculado
- Observações

**Visualização:**
- Lista de custos com filtros (por área, ciclo, tipo, período)
- Totalizadores por categoria
- Custo por hectare calculado automaticamente

---

## 📑 Módulo de Investimentos & Legalização

**Registro de Investimento:**
- Data
- Tipo (Legalização / Escritura / Contratos / Projetos / Infraestrutura / Outros)
- Valor
- Descrição
- Vinculação opcional a área específica ou rateado

**Visualização:**
- Total investido em legalização/estrutura
- Separação: custos produtivos vs não-produtivos

---

## 📈 Módulo de Receitas

**Registro de Receita:**
- Data
- Produto vendido
- Quantidade
- Unidade (kg, saca, unidade)
- Preço unitário
- Valor total (calculado)
- Área vinculada
- Ciclo vinculado
- Cliente/destino

**Visualização:**
- Receitas por área e ciclo
- Receita por hectare
- Histórico de preços por produto

---

## 🏦 Módulo de Empréstimos

**Cadastro de Empréstimo:**
- Origem/credor
- Valor total
- Data
- Juros (se houver)
- Número de parcelas
- Valor das parcelas
- Status (Ativo / Quitado)
- Vinculação a área/ciclo

**Controle de Parcelas:**
- Lista de parcelas com status (Paga / Pendente / Atrasada)
- Marcar como paga
- Saldo devedor atualizado

---

## 📊 Indicadores & Relatórios

**Por Área:**
- Total investido
- Total de custos produtivos
- Total de receitas
- Lucro/Prejuízo
- ROI (%)
- Custo por hectare
- Receita por hectare

**Por Ciclo:**
- Duração do ciclo
- Custo total
- Produção total
- Produção por hectare
- Custo por kg/unidade
- Margem do ciclo

**Geral:**
- Resumo de todas as áreas
- Fluxo de caixa mensal
- Comparativo de ciclos
- Padrões históricos (custo médio por cultura, etc.)

---

## 🗄️ Tecnologia

**Backend (Lovable Cloud + Supabase):**
- Banco de dados para persistir todas as informações
- 7 tabelas principais: áreas, ciclos, custos, investimentos, receitas, empréstimos, parcelas
- Relacionamentos entre entidades

**Frontend:**
- React com componentes modernos
- Gráficos com Recharts
- Formulários validados
- Interface responsiva

