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
      address: {
        Row: {
          city: string | null
          created_at: string
          id: number
          state: string | null
          street: string | null
          zip: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          id?: number
          state?: string | null
          street?: string | null
          zip?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          id?: number
          state?: string | null
          street?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          address_id: number | null
          created_at: string
          date: string
          description: string | null
          id: number
          title: string | null
          venue: string | null
        }
        Insert: {
          address_id?: number | null
          created_at?: string
          date: string
          description?: string | null
          id?: number
          title?: string | null
          venue?: string | null
        }
        Update: {
          address_id?: number | null
          created_at?: string
          date?: string
          description?: string | null
          id?: number
          title?: string | null
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "address"
            referencedColumns: ["id"]
          },
        ]
      }
      image_tags: {
        Row: {
          image_id: string
          tag_id: number
        }
        Insert: {
          image_id: string
          tag_id: number
        }
        Update: {
          image_id?: string
          tag_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "image_tags_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "image_metadata"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "image_tags_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "image_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      images: {
        Row: {
          alt: string | null
          created_at: string
          id: string
          path: string
          sort_key: number
        }
        Insert: {
          alt?: string | null
          created_at?: string
          id: string
          path: string
          sort_key: number
        }
        Update: {
          alt?: string | null
          created_at?: string
          id?: string
          path?: string
          sort_key?: number
        }
        Relationships: []
      }
      songs: {
        Row: {
          created_at: string
          id: number
          name: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          id: number
          slug: string
        }
        Insert: {
          id?: number
          slug: string
        }
        Update: {
          id?: number
          slug?: string
        }
        Relationships: []
      }
    }
    Views: {
      image_metadata: {
        Row: {
          alt: string | null
          id: string | null
          path: string | null
          tags: string[] | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_image_with_tags:
        | {
            Args: {
              p_alt: string
              p_image_id: string
              p_path: string
              p_tag_slugs: string[]
            }
            Returns: {
              alt: string | null
              created_at: string
              id: string
              path: string
              sort_key: number
            }
            SetofOptions: {
              from: "*"
              to: "images"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { p_alt: string; p_path: string; p_tag_slugs: string[] }
            Returns: {
              alt: string | null
              created_at: string
              id: string
              path: string
              sort_key: number
            }
            SetofOptions: {
              from: "*"
              to: "images"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      create_images_with_tags_bulk: {
        Args: {
          p_items: Database["public"]["CompositeTypes"]["new_image_with_tags"][]
        }
        Returns: {
          alt: string | null
          created_at: string
          id: string
          path: string
          sort_key: number
        }[]
        SetofOptions: {
          from: "*"
          to: "images"
          isOneToOne: false
          isSetofReturn: true
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      new_image_with_tags: {
        id: string | null
        path: string | null
        alt: string | null
        tag_slugs: string[] | null
      }
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
    Enums: {},
  },
} as const
