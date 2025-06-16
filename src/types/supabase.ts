export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      groups: {
        Row: {
          id: string
          created_at: string
          name: string
          description: string | null
          created_by: string
          invite_code: string
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          description?: string | null
          created_by: string
          invite_code: string
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          description?: string | null
          created_by?: string
          invite_code?: string
        }
      }
      users: {
        Row: {
          id: string
          created_at: string
          email: string
          display_name: string
        }
        Insert: {
          id?: string
          created_at?: string
          email: string
          display_name: string
        }
        Update: {
          id?: string
          created_at?: string
          email?: string
          display_name?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 