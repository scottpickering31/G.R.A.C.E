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
      appointments: {
        Row: {
          appointment_date: string
          appointment_type: string
          clinician: string | null
          completed: boolean
          completed_at: string | null
          created_at: string
          created_by: string
          ends_at: string | null
          id: string
          location: string | null
          notes: string | null
          patient_id: string
          source: string
          starts_at: string
          title: string
          updated_at: string
        }
        Insert: {
          appointment_date: string
          appointment_type?: string
          clinician?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          created_by: string
          ends_at?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          patient_id: string
          source?: string
          starts_at: string
          title: string
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          appointment_type?: string
          clinician?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          created_by?: string
          ends_at?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          patient_id?: string
          source?: string
          starts_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_adherence_events: {
        Row: {
          created_at: string
          created_by: string
          event_type: Database["public"]["Enums"]["medication_adherence_event_type"]
          id: string
          medication_id: string
          note: string | null
          occurred_at: string
          patient_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          event_type: Database["public"]["Enums"]["medication_adherence_event_type"]
          id?: string
          medication_id: string
          note?: string | null
          occurred_at: string
          patient_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          event_type?: Database["public"]["Enums"]["medication_adherence_event_type"]
          id?: string
          medication_id?: string
          note?: string | null
          occurred_at?: string
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_adherence_events_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_adherence_events_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_doses: {
        Row: {
          created_at: string
          created_by: string
          due_at: string
          id: string
          medication_id: string
          note: string | null
          patient_id: string
          status: Database["public"]["Enums"]["medication_dose_status"]
          taken_at: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          due_at: string
          id?: string
          medication_id: string
          note?: string | null
          patient_id: string
          status?: Database["public"]["Enums"]["medication_dose_status"]
          taken_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          due_at?: string
          id?: string
          medication_id?: string
          note?: string | null
          patient_id?: string
          status?: Database["public"]["Enums"]["medication_dose_status"]
          taken_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medication_doses_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_doses_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_schedule_times: {
        Row: {
          created_at: string
          id: string
          medication_id: string
          time_of_day: string
        }
        Insert: {
          created_at?: string
          id?: string
          medication_id: string
          time_of_day: string
        }
        Update: {
          created_at?: string
          id?: string
          medication_id?: string
          time_of_day?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_schedule_times_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          active: boolean
          created_at: string
          created_by: string
          dose: string | null
          expires_at: string | null
          id: string
          instructions: string | null
          low_stock_threshold: number | null
          name: string
          one_off_due_at: string | null
          patient_id: string
          route: Database["public"]["Enums"]["medication_route"]
          schedule_time: string | null
          schedule_type: Database["public"]["Enums"]["medication_schedule_type"]
          stock_capacity: number | null
          stock_quantity: number | null
          stock_unit: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by: string
          dose?: string | null
          expires_at?: string | null
          id?: string
          instructions?: string | null
          low_stock_threshold?: number | null
          name: string
          one_off_due_at?: string | null
          patient_id: string
          route?: Database["public"]["Enums"]["medication_route"]
          schedule_time?: string | null
          schedule_type?: Database["public"]["Enums"]["medication_schedule_type"]
          stock_capacity?: number | null
          stock_quantity?: number | null
          stock_unit?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string
          dose?: string | null
          expires_at?: string | null
          id?: string
          instructions?: string | null
          low_stock_threshold?: number | null
          name?: string
          one_off_due_at?: string | null
          patient_id?: string
          route?: Database["public"]["Enums"]["medication_route"]
          schedule_time?: string | null
          schedule_type?: Database["public"]["Enums"]["medication_schedule_type"]
          stock_capacity?: number | null
          stock_quantity?: number | null
          stock_unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medications_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_access_codes: {
        Row: {
          active: boolean
          code: string
          created_at: string
          created_by: string
          id: string
          patient_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          created_by: string
          id?: string
          patient_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          created_by?: string
          id?: string
          patient_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_access_codes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_access_requests: {
        Row: {
          created_at: string
          id: string
          note: string | null
          patient_id: string
          requested_code: string
          requested_role: Database["public"]["Enums"]["patient_role"]
          requester_user_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["patient_access_request_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          patient_id: string
          requested_code: string
          requested_role?: Database["public"]["Enums"]["patient_role"]
          requester_user_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["patient_access_request_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          patient_id?: string
          requested_code?: string
          requested_role?: Database["public"]["Enums"]["patient_role"]
          requester_user_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["patient_access_request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_access_requests_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_members: {
        Row: {
          created_at: string
          patient_id: string
          role: Database["public"]["Enums"]["patient_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          patient_id: string
          role?: Database["public"]["Enums"]["patient_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          patient_id?: string
          role?: Database["public"]["Enums"]["patient_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_members_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          created_at: string
          created_by: string
          display_name: string
          dob: string | null
          id: string
          sex: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          display_name: string
          dob?: string | null
          id?: string
          sex?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          display_name?: string
          dob?: string | null
          id?: string
          sex?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active_patient_id: string | null
          avatar_url: string | null
          email: string | null
          full_name: string | null
          id: string
          onboarding_completed_at: string | null
          updated_at: string | null
          username: string | null
          website: string | null
        }
        Insert: {
          active_patient_id?: string | null
          avatar_url?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          onboarding_completed_at?: string | null
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Update: {
          active_patient_id?: string | null
          avatar_url?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          onboarding_completed_at?: string | null
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_active_patient_id_fkey"
            columns: ["active_patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      medication_adherence_event_type: "skipped" | "rejected"
      medication_dose_status: "pending" | "taken" | "skipped" | "missed"
      medication_route:
        | "oral"
        | "sublingual"
        | "buccal"
        | "enteral_tube"
        | "rectal"
        | "vaginal"
        | "topical"
        | "transdermal"
        | "inhalation"
        | "nebulized"
        | "intranasal"
        | "ophthalmic"
        | "otic"
        | "subcutaneous"
        | "intramuscular"
        | "intravenous"
        | "intradermal"
        | "other"
      medication_schedule_type: "as_needed" | "daily_same_time" | "one_off"
      patient_access_request_status:
        | "pending"
        | "approved"
        | "rejected"
        | "cancelled"
      patient_role: "owner" | "caregiver" | "clinician" | "read_only"
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
      medication_adherence_event_type: ["skipped", "rejected"],
      medication_dose_status: ["pending", "taken", "skipped", "missed"],
      medication_route: [
        "oral",
        "sublingual",
        "buccal",
        "enteral_tube",
        "rectal",
        "vaginal",
        "topical",
        "transdermal",
        "inhalation",
        "nebulized",
        "intranasal",
        "ophthalmic",
        "otic",
        "subcutaneous",
        "intramuscular",
        "intravenous",
        "intradermal",
        "other",
      ],
      medication_schedule_type: ["as_needed", "daily_same_time", "one_off"],
      patient_access_request_status: [
        "pending",
        "approved",
        "rejected",
        "cancelled",
      ],
      patient_role: ["owner", "caregiver", "clinician", "read_only"],
    },
  },
} as const
