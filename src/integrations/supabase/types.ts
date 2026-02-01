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
          created_at: string
          cultura_principal: string | null
          data_inicio: string | null
          id: string
          nome: string
          observacoes: string | null
          status: Database["public"]["Enums"]["area_status"]
          tamanho_hectares: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          cultura_principal?: string | null
          data_inicio?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["area_status"]
          tamanho_hectares: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          cultura_principal?: string | null
          data_inicio?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["area_status"]
          tamanho_hectares?: number
          updated_at?: string
        }
        Relationships: []
      }
      cash_transactions: {
        Row: {
          area_id: string | null
          categoria: string
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
          revenue_id: string | null
          tipo: string
          updated_at: string
          valor: number
        }
        Insert: {
          area_id?: string | null
          categoria: string
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
          revenue_id?: string | null
          tipo: string
          updated_at?: string
          valor: number
        }
        Update: {
          area_id?: string | null
          categoria?: string
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
          revenue_id?: string | null
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
        ]
      }
      costs: {
        Row: {
          area_id: string
          created_at: string
          cycle_id: string | null
          data: string
          descricao: string | null
          forma_pagamento: Database["public"]["Enums"]["payment_method"]
          id: string
          observacoes: string | null
          tipo: Database["public"]["Enums"]["cost_type"]
          updated_at: string
          valor: number
        }
        Insert: {
          area_id: string
          created_at?: string
          cycle_id?: string | null
          data: string
          descricao?: string | null
          forma_pagamento?: Database["public"]["Enums"]["payment_method"]
          id?: string
          observacoes?: string | null
          tipo: Database["public"]["Enums"]["cost_type"]
          updated_at?: string
          valor: number
        }
        Update: {
          area_id?: string
          created_at?: string
          cycle_id?: string | null
          data?: string
          descricao?: string | null
          forma_pagamento?: Database["public"]["Enums"]["payment_method"]
          id?: string
          observacoes?: string | null
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
            foreignKeyName: "costs_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "cycles"
            referencedColumns: ["id"]
          },
        ]
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
          status: Database["public"]["Enums"]["cycle_status"]
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
          status?: Database["public"]["Enums"]["cycle_status"]
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
          status?: Database["public"]["Enums"]["cycle_status"]
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
          created_at: string
          data: string
          descricao: string
          id: string
          observacoes: string | null
          rateado: boolean
          tipo: Database["public"]["Enums"]["investment_type"]
          updated_at: string
          valor: number
        }
        Insert: {
          area_id?: string | null
          created_at?: string
          data: string
          descricao: string
          id?: string
          observacoes?: string | null
          rateado?: boolean
          tipo: Database["public"]["Enums"]["investment_type"]
          updated_at?: string
          valor: number
        }
        Update: {
          area_id?: string | null
          created_at?: string
          data?: string
          descricao?: string
          id?: string
          observacoes?: string | null
          rateado?: boolean
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
        ]
      }
      loans: {
        Row: {
          area_id: string | null
          created_at: string
          creditado_caixa: boolean | null
          cycle_id: string | null
          data: string
          id: string
          juros_percentual: number | null
          numero_parcelas: number
          observacoes: string | null
          origem_credor: string
          status: Database["public"]["Enums"]["loan_status"]
          updated_at: string
          valor_juros_total: number | null
          valor_parcela: number
          valor_principal: number | null
          valor_total: number
        }
        Insert: {
          area_id?: string | null
          created_at?: string
          creditado_caixa?: boolean | null
          cycle_id?: string | null
          data: string
          id?: string
          juros_percentual?: number | null
          numero_parcelas?: number
          observacoes?: string | null
          origem_credor: string
          status?: Database["public"]["Enums"]["loan_status"]
          updated_at?: string
          valor_juros_total?: number | null
          valor_parcela: number
          valor_principal?: number | null
          valor_total: number
        }
        Update: {
          area_id?: string | null
          created_at?: string
          creditado_caixa?: boolean | null
          cycle_id?: string | null
          data?: string
          id?: string
          juros_percentual?: number | null
          numero_parcelas?: number
          observacoes?: string | null
          origem_credor?: string
          status?: Database["public"]["Enums"]["loan_status"]
          updated_at?: string
          valor_juros_total?: number | null
          valor_parcela?: number
          valor_principal?: number | null
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
      revenues: {
        Row: {
          area_id: string
          cliente: string | null
          created_at: string
          cycle_id: string | null
          data: string
          id: string
          observacoes: string | null
          preco_unitario: number
          produto: string
          quantidade: number
          unidade: Database["public"]["Enums"]["unit_type"]
          updated_at: string
          valor_total: number | null
        }
        Insert: {
          area_id: string
          cliente?: string | null
          created_at?: string
          cycle_id?: string | null
          data: string
          id?: string
          observacoes?: string | null
          preco_unitario: number
          produto: string
          quantidade: number
          unidade?: Database["public"]["Enums"]["unit_type"]
          updated_at?: string
          valor_total?: number | null
        }
        Update: {
          area_id?: string
          cliente?: string | null
          created_at?: string
          cycle_id?: string | null
          data?: string
          id?: string
          observacoes?: string | null
          preco_unitario?: number
          produto?: string
          quantidade?: number
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
            foreignKeyName: "revenues_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "cycles"
            referencedColumns: ["id"]
          },
        ]
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
      unit_type: ["kg", "saca", "unidade", "tonelada"],
    },
  },
} as const
