export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      areas: {
        Row: {
          area_app_hectares: number
          created_at: string
          cultura_principal: string | null
          data_inicio: string | null
          id: string
          metros_rio: number
          nome: string
          observacoes: string | null
          propriedade_id: string | null
          responsavel_id: string | null
          status: Database["public"]["Enums"]["area_status"]
          talhao_id: string | null
          tamanho_hectares: number
          tipo: string
          tipo_protecao: string
          updated_at: string
        }
        Insert: {
          area_app_hectares?: number
          created_at?: string
          cultura_principal?: string | null
          data_inicio?: string | null
          id?: string
          metros_rio?: number
          nome: string
          observacoes?: string | null
          propriedade_id?: string | null
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["area_status"]
          talhao_id?: string | null
          tamanho_hectares: number
          tipo?: string
          tipo_protecao?: string
          updated_at?: string
        }
        Update: {
          area_app_hectares?: number
          created_at?: string
          cultura_principal?: string | null
          data_inicio?: string | null
          id?: string
          metros_rio?: number
          nome?: string
          observacoes?: string | null
          propriedade_id?: string | null
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["area_status"]
          talhao_id?: string | null
          tamanho_hectares?: number
          tipo?: string
          tipo_protecao?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "areas_propriedade_id_fkey"
            columns: ["propriedade_id"]
            isOneToOne: false
            referencedRelation: "propriedade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "areas_talhao_id_fkey"
            columns: ["talhao_id"]
            isOneToOne: false
            referencedRelation: "talhoes"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_transactions: {
        Row: {
          area_id: string | null
          categoria: string
          contato_id: string | null
          cost_id: string | null
          created_at: string
          cycle_id: string | null
          data: string
          descricao: string | null
          id: string
          installment_id: string | null
          investment_id: string | null
          loan_id: string | null
          observacoes: string | null
          operation_id: string | null
          responsavel_id: string | null
          revenue_id: string | null
          talhao_id: string | null
          tipo: string
          updated_at: string
          valor: number
        }
        Insert: {
          area_id?: string | null
          categoria: string
          contato_id?: string | null
          cost_id?: string | null
          created_at?: string
          cycle_id?: string | null
          data: string
          descricao?: string | null
          id?: string
          installment_id?: string | null
          investment_id?: string | null
          loan_id?: string | null
          observacoes?: string | null
          operation_id?: string | null
          responsavel_id?: string | null
          revenue_id?: string | null
          talhao_id?: string | null
          tipo: string
          updated_at?: string
          valor: number
        }
        Update: {
          area_id?: string | null
          categoria?: string
          contato_id?: string | null
          cost_id?: string | null
          created_at?: string
          cycle_id?: string | null
          data?: string
          descricao?: string | null
          id?: string
          installment_id?: string | null
          investment_id?: string | null
          loan_id?: string | null
          observacoes?: string | null
          operation_id?: string | null
          responsavel_id?: string | null
          revenue_id?: string | null
          talhao_id?: string | null
          tipo?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "cash_transactions_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_transactions_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "contatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_transactions_cost_id_fkey"
            columns: ["cost_id"]
            isOneToOne: false
            referencedRelation: "costs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_transactions_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_transactions_installment_id_fkey"
            columns: ["installment_id"]
            isOneToOne: false
            referencedRelation: "installments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_transactions_investment_id_fkey"
            columns: ["investment_id"]
            isOneToOne: false
            referencedRelation: "investments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_transactions_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_transactions_revenue_id_fkey"
            columns: ["revenue_id"]
            isOneToOne: false
            referencedRelation: "revenues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_transactions_talhao_id_fkey"
            columns: ["talhao_id"]
            isOneToOne: false
            referencedRelation: "talhoes"
            referencedColumns: ["id"]
          },
        ]
      }
      contatos: {
        Row: {
          categoria: Database["public"]["Enums"]["contato_categoria"]
          created_at: string
          documento: string | null
          email: string | null
          endereco: string | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          categoria?: Database["public"]["Enums"]["contato_categoria"]
          created_at?: string
          documento?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          categoria?: Database["public"]["Enums"]["contato_categoria"]
          created_at?: string
          documento?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      costs: {
        Row: {
          area_id: string
          contato_id: string | null
          created_at: string
          cycle_id: string | null
          data: string
          descricao: string | null
          forma_pagamento: Database["public"]["Enums"]["payment_method"]
          id: string
          observacoes: string | null
          responsavel_id: string | null
          talhao_id: string | null
          tipo: Database["public"]["Enums"]["cost_type"]
          updated_at: string
          valor: number
        }
        Insert: {
          area_id: string
          contato_id?: string | null
          created_at?: string
          cycle_id?: string | null
          data: string
          descricao?: string | null
          forma_pagamento?: Database["public"]["Enums"]["payment_method"]
          id?: string
          observacoes?: string | null
          responsavel_id?: string | null
          talhao_id?: string | null
          tipo: Database["public"]["Enums"]["cost_type"]
          updated_at?: string
          valor: number
        }
        Update: {
          area_id?: string
          contato_id?: string | null
          created_at?: string
          cycle_id?: string | null
          data?: string
          descricao?: string | null
          forma_pagamento?: Database["public"]["Enums"]["payment_method"]
          id?: string
          observacoes?: string | null
          responsavel_id?: string | null
          talhao_id?: string | null
          tipo?: Database["public"]["Enums"]["cost_type"]
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "costs_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "costs_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "contatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "costs_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "costs_talhao_id_fkey"
            columns: ["talhao_id"]
            isOneToOne: false
            referencedRelation: "talhoes"
            referencedColumns: ["id"]
          },
        ]
      }
      culture_cost_templates: {
        Row: {
          created_at: string
          cultura: string
          custo_estimado_por_ha: number
          etapas: Json
          id: string
          observacoes: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          cultura: string
          custo_estimado_por_ha?: number
          etapas?: Json
          id?: string
          observacoes?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          cultura?: string
          custo_estimado_por_ha?: number
          etapas?: Json
          id?: string
          observacoes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cycles: {
        Row: {
          area_id: string
          created_at: string
          cultura: string
          data_inicio_plantio: string
          data_prevista_colheita: string | null
          data_real_colheita: string | null
          id: string
          observacoes: string | null
          responsavel_id: string | null
          status: Database["public"]["Enums"]["cycle_status"]
          talhao_id: string | null
          updated_at: string
        }
        Insert: {
          area_id: string
          created_at?: string
          cultura: string
          data_inicio_plantio: string
          data_prevista_colheita?: string | null
          data_real_colheita?: string | null
          id?: string
          observacoes?: string | null
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["cycle_status"]
          talhao_id?: string | null
          updated_at?: string
        }
        Update: {
          area_id?: string
          created_at?: string
          cultura?: string
          data_inicio_plantio?: string
          data_prevista_colheita?: string | null
          data_real_colheita?: string | null
          id?: string
          observacoes?: string | null
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["cycle_status"]
          talhao_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cycles_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cycles_talhao_id_fkey"
            columns: ["talhao_id"]
            isOneToOne: false
            referencedRelation: "talhoes"
            referencedColumns: ["id"]
          },
        ]
      }
      installments: {
        Row: {
          created_at: string
          data_pagamento: string | null
          data_vencimento: string
          id: string
          loan_id: string
          numero_parcela: number
          observacoes: string | null
          responsavel_id: string | null
          status: Database["public"]["Enums"]["installment_status"]
          updated_at: string
          valor: number
          valor_juros: number | null
          valor_principal: number | null
        }
        Insert: {
          created_at?: string
          data_pagamento?: string | null
          data_vencimento: string
          id?: string
          loan_id: string
          numero_parcela: number
          observacoes?: string | null
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["installment_status"]
          updated_at?: string
          valor: number
          valor_juros?: number | null
          valor_principal?: number | null
        }
        Update: {
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string
          id?: string
          loan_id?: string
          numero_parcela?: number
          observacoes?: string | null
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["installment_status"]
          updated_at?: string
          valor?: number
          valor_juros?: number | null
          valor_principal?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "installments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      investments: {
        Row: {
          area_id: string | null
          contato_id: string | null
          created_at: string
          data: string
          descricao: string
          id: string
          observacoes: string | null
          rateado: boolean
          responsavel_id: string | null
          talhao_id: string | null
          tipo: Database["public"]["Enums"]["investment_type"]
          updated_at: string
          valor: number
        }
        Insert: {
          area_id?: string | null
          contato_id?: string | null
          created_at?: string
          data: string
          descricao: string
          id?: string
          observacoes?: string | null
          rateado?: boolean
          responsavel_id?: string | null
          talhao_id?: string | null
          tipo: Database["public"]["Enums"]["investment_type"]
          updated_at?: string
          valor: number
        }
        Update: {
          area_id?: string | null
          contato_id?: string | null
          created_at?: string
          data?: string
          descricao?: string
          id?: string
          observacoes?: string | null
          rateado?: boolean
          responsavel_id?: string | null
          talhao_id?: string | null
          tipo?: Database["public"]["Enums"]["investment_type"]
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "investments_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investments_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "contatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investments_talhao_id_fkey"
            columns: ["talhao_id"]
            isOneToOne: false
            referencedRelation: "talhoes"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_attachments: {
        Row: {
          created_at: string
          duration_seconds: number | null
          entry_id: string
          height: number | null
          id: string
          kind: string
          mime_type: string | null
          size_bytes: number | null
          storage_path: string
          width: number | null
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          entry_id: string
          height?: number | null
          id?: string
          kind: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_path: string
          width?: number | null
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          entry_id?: string
          height?: number | null
          id?: string
          kind?: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_path?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_attachments_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          area_id: string | null
          created_at: string
          cycle_id: string | null
          description: string | null
          entry_date: string
          entry_type: string
          id: string
          is_important: boolean
          latitude: number | null
          location_accuracy: number | null
          longitude: number | null
          notes: string | null
          responsavel_id: string | null
          reviewed: boolean
          status: string
          tags: string[]
          title: string | null
          updated_at: string
          weather: string | null
        }
        Insert: {
          area_id?: string | null
          created_at?: string
          cycle_id?: string | null
          description?: string | null
          entry_date?: string
          entry_type?: string
          id?: string
          is_important?: boolean
          latitude?: number | null
          location_accuracy?: number | null
          longitude?: number | null
          notes?: string | null
          responsavel_id?: string | null
          reviewed?: boolean
          status?: string
          tags?: string[]
          title?: string | null
          updated_at?: string
          weather?: string | null
        }
        Update: {
          area_id?: string | null
          created_at?: string
          cycle_id?: string | null
          description?: string | null
          entry_date?: string
          entry_type?: string
          id?: string
          is_important?: boolean
          latitude?: number | null
          location_accuracy?: number | null
          longitude?: number | null
          notes?: string | null
          responsavel_id?: string | null
          reviewed?: boolean
          status?: string
          tags?: string[]
          title?: string | null
          updated_at?: string
          weather?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "responsaveis"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_points: {
        Row: {
          accuracy: number | null
          attachment_id: string | null
          captured_at: string
          coordinates: Json | null
          created_at: string
          entry_id: string
          geometry_type: string
          id: string
          latitude: number
          longitude: number
          manual: boolean
          nome: string
          observacao: string | null
          ordem: number
          updated_at: string
        }
        Insert: {
          accuracy?: number | null
          attachment_id?: string | null
          captured_at?: string
          coordinates?: Json | null
          created_at?: string
          entry_id: string
          geometry_type?: string
          id?: string
          latitude: number
          longitude: number
          manual?: boolean
          nome: string
          observacao?: string | null
          ordem?: number
          updated_at?: string
        }
        Update: {
          accuracy?: number | null
          attachment_id?: string | null
          captured_at?: string
          coordinates?: Json | null
          created_at?: string
          entry_id?: string
          geometry_type?: string
          id?: string
          latitude?: number
          longitude?: number
          manual?: boolean
          nome?: string
          observacao?: string | null
          ordem?: number
          updated_at?: string
        }
        Relationships: []
      }
      loans: {
        Row: {
          area_id: string | null
          created_at: string
          creditado_caixa: boolean | null
          cycle_id: string | null
          data: string
          data_primeira_parcela: string | null
          descontos_iniciais: number | null
          frequencia_parcela: string
          id: string
          juros_percentual: number | null
          numero_parcelas: number
          observacoes: string | null
          origem_credor: string
          responsavel_id: string | null
          status: Database["public"]["Enums"]["loan_status"]
          updated_at: string
          valor_juros_total: number | null
          valor_parcela: number
          valor_principal: number | null
          valor_recebido: number | null
          valor_total: number
        }
        Insert: {
          area_id?: string | null
          created_at?: string
          creditado_caixa?: boolean | null
          cycle_id?: string | null
          data: string
          data_primeira_parcela?: string | null
          descontos_iniciais?: number | null
          frequencia_parcela?: string
          id?: string
          juros_percentual?: number | null
          numero_parcelas?: number
          observacoes?: string | null
          origem_credor: string
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["loan_status"]
          updated_at?: string
          valor_juros_total?: number | null
          valor_parcela: number
          valor_principal?: number | null
          valor_recebido?: number | null
          valor_total: number
        }
        Update: {
          area_id?: string | null
          created_at?: string
          creditado_caixa?: boolean | null
          cycle_id?: string | null
          data?: string
          data_primeira_parcela?: string | null
          descontos_iniciais?: number | null
          frequencia_parcela?: string
          id?: string
          juros_percentual?: number | null
          numero_parcelas?: number
          observacoes?: string | null
          origem_credor?: string
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["loan_status"]
          updated_at?: string
          valor_juros_total?: number | null
          valor_parcela?: number
          valor_principal?: number | null
          valor_recebido?: number | null
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "loans_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      operation_change_logs: {
        Row: {
          alterado_em: string
          alterado_por: string | null
          campo: string
          id: string
          stage_id: string
          valor_antigo: string | null
          valor_novo: string | null
        }
        Insert: {
          alterado_em?: string
          alterado_por?: string | null
          campo: string
          id?: string
          stage_id: string
          valor_antigo?: string | null
          valor_novo?: string | null
        }
        Update: {
          alterado_em?: string
          alterado_por?: string | null
          campo?: string
          id?: string
          stage_id?: string
          valor_antigo?: string | null
          valor_novo?: string | null
        }
        Relationships: []
      }
      operational_stages: {
        Row: {
          area_id: string | null
          categoria: string | null
          cor_responsavel: string | null
          created_at: string
          custo_total: number | null
          cycle_id: string | null
          data_fim_prevista: string | null
          data_fim_real: string | null
          data_inicio_prevista: string | null
          data_inicio_real: string | null
          depends_on_id: string | null
          descricao: string | null
          duracao_prevista_dias: number | null
          id: string
          linked_project_id: string | null
          nivel_tipo: string
          nome: string
          observacoes: string | null
          ordem: number
          parent_id: string | null
          permite_simultaneidade: boolean
          prioridade: Database["public"]["Enums"]["priority_level"] | null
          progresso_percentual: number | null
          propriedade_id: string | null
          responsavel: string | null
          responsavel_id: string | null
          status: Database["public"]["Enums"]["stage_status"]
          talhao_id: string | null
          tipo: Database["public"]["Enums"]["stage_type"]
          updated_at: string
        }
        Insert: {
          area_id?: string | null
          categoria?: string | null
          cor_responsavel?: string | null
          created_at?: string
          custo_total?: number | null
          cycle_id?: string | null
          data_fim_prevista?: string | null
          data_fim_real?: string | null
          data_inicio_prevista?: string | null
          data_inicio_real?: string | null
          depends_on_id?: string | null
          descricao?: string | null
          duracao_prevista_dias?: number | null
          id?: string
          linked_project_id?: string | null
          nivel_tipo?: string
          nome: string
          observacoes?: string | null
          ordem?: number
          parent_id?: string | null
          permite_simultaneidade?: boolean
          prioridade?: Database["public"]["Enums"]["priority_level"] | null
          progresso_percentual?: number | null
          propriedade_id?: string | null
          responsavel?: string | null
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["stage_status"]
          talhao_id?: string | null
          tipo?: Database["public"]["Enums"]["stage_type"]
          updated_at?: string
        }
        Update: {
          area_id?: string | null
          categoria?: string | null
          cor_responsavel?: string | null
          created_at?: string
          custo_total?: number | null
          cycle_id?: string | null
          data_fim_prevista?: string | null
          data_fim_real?: string | null
          data_inicio_prevista?: string | null
          data_inicio_real?: string | null
          depends_on_id?: string | null
          descricao?: string | null
          duracao_prevista_dias?: number | null
          id?: string
          linked_project_id?: string | null
          nivel_tipo?: string
          nome?: string
          observacoes?: string | null
          ordem?: number
          parent_id?: string | null
          permite_simultaneidade?: boolean
          prioridade?: Database["public"]["Enums"]["priority_level"] | null
          progresso_percentual?: number | null
          propriedade_id?: string | null
          responsavel?: string | null
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["stage_status"]
          talhao_id?: string | null
          tipo?: Database["public"]["Enums"]["stage_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "operational_stages_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operational_stages_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operational_stages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "operational_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operational_stages_propriedade_id_fkey"
            columns: ["propriedade_id"]
            isOneToOne: false
            referencedRelation: "propriedade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operational_stages_talhao_id_fkey"
            columns: ["talhao_id"]
            isOneToOne: false
            referencedRelation: "talhoes"
            referencedColumns: ["id"]
          },
        ]
      }
      operational_tasks: {
        Row: {
          area_id: string | null
          cash_transaction_id: string | null
          created_at: string
          custo_estimado: number | null
          custo_real: number | null
          cycle_id: string | null
          data_conclusao: string | null
          data_inicio_prevista: string | null
          data_inicio_real: string | null
          data_prazo: string | null
          descricao: string | null
          id: string
          observacoes: string | null
          parent_task_id: string | null
          prioridade: Database["public"]["Enums"]["priority_level"] | null
          propriedade_id: string | null
          responsavel: string | null
          responsavel_id: string | null
          stage_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          talhao_id: string | null
          tipo: Database["public"]["Enums"]["task_type"]
          titulo: string
          updated_at: string
        }
        Insert: {
          area_id?: string | null
          cash_transaction_id?: string | null
          created_at?: string
          custo_estimado?: number | null
          custo_real?: number | null
          cycle_id?: string | null
          data_conclusao?: string | null
          data_inicio_prevista?: string | null
          data_inicio_real?: string | null
          data_prazo?: string | null
          descricao?: string | null
          id?: string
          observacoes?: string | null
          parent_task_id?: string | null
          prioridade?: Database["public"]["Enums"]["priority_level"] | null
          propriedade_id?: string | null
          responsavel?: string | null
          responsavel_id?: string | null
          stage_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          talhao_id?: string | null
          tipo?: Database["public"]["Enums"]["task_type"]
          titulo: string
          updated_at?: string
        }
        Update: {
          area_id?: string | null
          cash_transaction_id?: string | null
          created_at?: string
          custo_estimado?: number | null
          custo_real?: number | null
          cycle_id?: string | null
          data_conclusao?: string | null
          data_inicio_prevista?: string | null
          data_inicio_real?: string | null
          data_prazo?: string | null
          descricao?: string | null
          id?: string
          observacoes?: string | null
          parent_task_id?: string | null
          prioridade?: Database["public"]["Enums"]["priority_level"] | null
          propriedade_id?: string | null
          responsavel?: string | null
          responsavel_id?: string | null
          stage_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          talhao_id?: string | null
          tipo?: Database["public"]["Enums"]["task_type"]
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "operational_tasks_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operational_tasks_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operational_tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "operational_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operational_tasks_propriedade_id_fkey"
            columns: ["propriedade_id"]
            isOneToOne: false
            referencedRelation: "propriedade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operational_tasks_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "operational_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operational_tasks_talhao_id_fkey"
            columns: ["talhao_id"]
            isOneToOne: false
            referencedRelation: "talhoes"
            referencedColumns: ["id"]
          },
        ]
      }
      propriedade: {
        Row: {
          area_app_hectares: number
          area_max_manejo_ha: number
          area_total_hectares: number
          created_at: string
          id: string
          manejo_escalonado_anos: number
          metros_rio_total: number
          nome: string
          observacoes: string | null
          updated_at: string
        }
        Insert: {
          area_app_hectares?: number
          area_max_manejo_ha?: number
          area_total_hectares: number
          created_at?: string
          id?: string
          manejo_escalonado_anos?: number
          metros_rio_total?: number
          nome: string
          observacoes?: string | null
          updated_at?: string
        }
        Update: {
          area_app_hectares?: number
          area_max_manejo_ha?: number
          area_total_hectares?: number
          created_at?: string
          id?: string
          manejo_escalonado_anos?: number
          metros_rio_total?: number
          nome?: string
          observacoes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      responsaveis: {
        Row: {
          apelido: string | null
          cor: string
          created_at: string
          icone: string | null
          id: string
          nome: string
          observacoes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          apelido?: string | null
          cor?: string
          created_at?: string
          icone?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          apelido?: string | null
          cor?: string
          created_at?: string
          icone?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      revenues: {
        Row: {
          area_id: string
          cliente: string | null
          contato_id: string | null
          created_at: string
          cycle_id: string | null
          data: string
          id: string
          observacoes: string | null
          preco_unitario: number
          produto: string
          quantidade: number
          responsavel_id: string | null
          talhao_id: string | null
          unidade: Database["public"]["Enums"]["unit_type"]
          updated_at: string
          valor_total: number | null
        }
        Insert: {
          area_id: string
          cliente?: string | null
          contato_id?: string | null
          created_at?: string
          cycle_id?: string | null
          data: string
          id?: string
          observacoes?: string | null
          preco_unitario: number
          produto: string
          quantidade: number
          responsavel_id?: string | null
          talhao_id?: string | null
          unidade?: Database["public"]["Enums"]["unit_type"]
          updated_at?: string
          valor_total?: number | null
        }
        Update: {
          area_id?: string
          cliente?: string | null
          contato_id?: string | null
          created_at?: string
          cycle_id?: string | null
          data?: string
          id?: string
          observacoes?: string | null
          preco_unitario?: number
          produto?: string
          quantidade?: number
          responsavel_id?: string | null
          talhao_id?: string | null
          unidade?: Database["public"]["Enums"]["unit_type"]
          updated_at?: string
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "revenues_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenues_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "contatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenues_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenues_talhao_id_fkey"
            columns: ["talhao_id"]
            isOneToOne: false
            referencedRelation: "talhoes"
            referencedColumns: ["id"]
          },
        ]
      }
      stage_templates: {
        Row: {
          created_at: string
          cultura: string
          duracao_padrao_dias: number | null
          id: string
          nome: string
          obrigatoria: boolean
          ordem: number
          tipo: Database["public"]["Enums"]["stage_type"]
        }
        Insert: {
          created_at?: string
          cultura: string
          duracao_padrao_dias?: number | null
          id?: string
          nome: string
          obrigatoria?: boolean
          ordem?: number
          tipo?: Database["public"]["Enums"]["stage_type"]
        }
        Update: {
          created_at?: string
          cultura?: string
          duracao_padrao_dias?: number | null
          id?: string
          nome?: string
          obrigatoria?: boolean
          ordem?: number
          tipo?: Database["public"]["Enums"]["stage_type"]
        }
        Relationships: []
      }
      talhoes: {
        Row: {
          area_app_hectares: number
          area_id: string | null
          area_produtiva_hectares: number
          area_total_hectares: number
          created_at: string
          id: string
          metros_rio: number
          nome: string
          observacoes: string | null
          propriedade_id: string | null
          responsavel_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          area_app_hectares?: number
          area_id?: string | null
          area_produtiva_hectares?: number
          area_total_hectares: number
          created_at?: string
          id?: string
          metros_rio?: number
          nome: string
          observacoes?: string | null
          propriedade_id?: string | null
          responsavel_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          area_app_hectares?: number
          area_id?: string | null
          area_produtiva_hectares?: number
          area_total_hectares?: number
          created_at?: string
          id?: string
          metros_rio?: number
          nome?: string
          observacoes?: string | null
          propriedade_id?: string | null
          responsavel_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "talhoes_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talhoes_propriedade_id_fkey"
            columns: ["propriedade_id"]
            isOneToOne: false
            referencedRelation: "propriedade"
            referencedColumns: ["id"]
          },
        ]
      }
      task_checklist_items: {
        Row: {
          concluido: boolean
          created_at: string
          id: string
          ordem: number
          task_id: string
          texto: string
          updated_at: string
        }
        Insert: {
          concluido?: boolean
          created_at?: string
          id?: string
          ordem?: number
          task_id: string
          texto: string
          updated_at?: string
        }
        Update: {
          concluido?: boolean
          created_at?: string
          id?: string
          ordem?: number
          task_id?: string
          texto?: string
          updated_at?: string
        }
        Relationships: []
      }
      task_logs: {
        Row: {
          acao: string
          id: string
          registrado_em: string
          registrado_por: string | null
          task_id: string
          valor_anterior: Json | null
          valor_novo: Json | null
        }
        Insert: {
          acao: string
          id?: string
          registrado_em?: string
          registrado_por?: string | null
          task_id: string
          valor_anterior?: Json | null
          valor_novo?: Json | null
        }
        Update: {
          acao?: string
          id?: string
          registrado_em?: string
          registrado_por?: string | null
          task_id?: string
          valor_anterior?: Json | null
          valor_novo?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "task_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "operational_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      territorial_events: {
        Row: {
          created_at: string
          dados_antes: Json | null
          dados_depois: Json | null
          descricao: string
          entidades_envolvidas: Json | null
          id: string
          tipo: string
        }
        Insert: {
          created_at?: string
          dados_antes?: Json | null
          dados_depois?: Json | null
          descricao: string
          entidades_envolvidas?: Json | null
          id?: string
          tipo: string
        }
        Update: {
          created_at?: string
          dados_antes?: Json | null
          dados_depois?: Json | null
          descricao?: string
          entidades_envolvidas?: Json | null
          id?: string
          tipo?: string
        }
        Relationships: []
      }
    }
    Views: {
      cash_balance: {
        Row: {
          saldo_atual: number | null
          total_entradas: number | null
          total_saidas: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      area_status:
        | "planejamento"
        | "preparo"
        | "plantada"
        | "producao"
        | "colhida"
      contato_categoria:
        | "fornecedor"
        | "cliente"
        | "prestador"
        | "funcionario"
        | "outro"
      cost_type:
        | "preparo_solo"
        | "mudas"
        | "adubacao"
        | "herbicida"
        | "mao_obra"
        | "combustivel"
        | "trator"
        | "outros"
        | "juros_bancarios"
        | "tarifas_bancarias"
        | "consultoria"
        | "frete_logistica"
        | "manutencao_infraestrutura"
        | "insumos_compras"
      cycle_status: "planejamento" | "ativo" | "finalizado"
      installment_status: "pendente" | "paga" | "atrasada"
      investment_type:
        | "legalizacao"
        | "escritura"
        | "contratos"
        | "projetos"
        | "infraestrutura"
        | "outros"
      loan_status: "ativo" | "quitado"
      payment_method: "dinheiro" | "emprestimo"
      priority_level: "baixa" | "media" | "alta" | "critica"
      stage_status:
        | "nao_iniciada"
        | "em_andamento"
        | "concluida"
        | "atrasada"
        | "pausada"
        | "planejada"
        | "travada"
        | "cancelada"
        | "reprogramada"
      stage_type:
        | "preparo"
        | "plantio"
        | "leiras"
        | "herbicida"
        | "capina"
        | "adubacao"
        | "colheita"
        | "beneficiamento"
        | "documentacao"
        | "manutencao"
        | "outro"
      task_status:
        | "pendente"
        | "em_andamento"
        | "concluida"
        | "atrasada"
        | "cancelada"
        | "pausada"
      task_type:
        | "operacional"
        | "compra"
        | "contratacao"
        | "documentacao"
        | "financeiro"
        | "manutencao"
        | "logistica"
        | "outro"
      unit_type: "kg" | "saca" | "unidade" | "tonelada"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      area_status: [
        "planejamento",
        "preparo",
        "plantada",
        "producao",
        "colhida",
      ],
      contato_categoria: [
        "fornecedor",
        "cliente",
        "prestador",
        "funcionario",
        "outro",
      ],
      cost_type: [
        "preparo_solo",
        "mudas",
        "adubacao",
        "herbicida",
        "mao_obra",
        "combustivel",
        "trator",
        "outros",
        "juros_bancarios",
        "tarifas_bancarias",
        "consultoria",
        "frete_logistica",
        "manutencao_infraestrutura",
        "insumos_compras",
      ],
      cycle_status: ["planejamento", "ativo", "finalizado"],
      installment_status: ["pendente", "paga", "atrasada"],
      investment_type: [
        "legalizacao",
        "escritura",
        "contratos",
        "projetos",
        "infraestrutura",
        "outros",
      ],
      loan_status: ["ativo", "quitado"],
      payment_method: ["dinheiro", "emprestimo"],
      priority_level: ["baixa", "media", "alta", "critica"],
      stage_status: [
        "nao_iniciada",
        "em_andamento",
        "concluida",
        "atrasada",
        "pausada",
        "planejada",
        "travada",
        "cancelada",
        "reprogramada",
      ],
      stage_type: [
        "preparo",
        "plantio",
        "leiras",
        "herbicida",
        "capina",
        "adubacao",
        "colheita",
        "beneficiamento",
        "documentacao",
        "manutencao",
        "outro",
      ],
      task_status: [
        "pendente",
        "em_andamento",
        "concluida",
        "atrasada",
        "cancelada",
        "pausada",
      ],
      task_type: [
        "operacional",
        "compra",
        "contratacao",
        "documentacao",
        "financeiro",
        "manutencao",
        "logistica",
        "outro",
      ],
      unit_type: ["kg", "saca", "unidade", "tonelada"],
    },
  },
} as const
