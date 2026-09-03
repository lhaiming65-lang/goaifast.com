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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      affiliate_applications: {
        Row: {
          audience_size: string | null
          channel_type: string
          channel_url: string | null
          contact: string | null
          country: string | null
          created_at: string
          email: string
          id: string
          name: string
          note: string | null
          payout_method: string | null
          promotion_plan: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          audience_size?: string | null
          channel_type: string
          channel_url?: string | null
          contact?: string | null
          country?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          note?: string | null
          payout_method?: string | null
          promotion_plan?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          audience_size?: string | null
          channel_type?: string
          channel_url?: string | null
          contact?: string | null
          country?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          note?: string | null
          payout_method?: string | null
          promotion_plan?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          delivery_email: string | null
          discount_usd: number
          fee_usd: number
          id: string
          order_no: string
          payment_method: string | null
          placed_at: string
          product_color: string | null
          product_initial: string | null
          product_title: string
          quantity: number
          status: string
          total_usd: number
          unit_price_usd: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delivery_email?: string | null
          discount_usd?: number
          fee_usd?: number
          id?: string
          order_no: string
          payment_method?: string | null
          placed_at?: string
          product_color?: string | null
          product_initial?: string | null
          product_title: string
          quantity?: number
          status?: string
          total_usd?: number
          unit_price_usd?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          delivery_email?: string | null
          discount_usd?: number
          fee_usd?: number
          id?: string
          order_no?: string
          payment_method?: string | null
          placed_at?: string
          product_color?: string | null
          product_initial?: string | null
          product_title?: string
          quantity?: number
          status?: string
          total_usd?: number
          unit_price_usd?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_details: {
        Row: {
          big_headline: string
          big_sub: string
          cons: Json
          created_at: string
          description: string
          feature_grid: Json
          features: Json
          highlights: Json
          how_it_works: Json
          how_it_works_title: string
          id: string
          intro_badge: string
          intro_body: string
          month_options: Json
          monthly_price: number
          original_price: number
          overall_score: number
          pros: Json
          reviews: Json
          scores: Json
          slug: string
          subscription_types: Json
          title: string
          updated_at: string
          usage_guide: Json
          usage_title: string
        }
        Insert: {
          big_headline?: string
          big_sub?: string
          cons?: Json
          created_at?: string
          description?: string
          feature_grid?: Json
          features?: Json
          highlights?: Json
          how_it_works?: Json
          how_it_works_title?: string
          id?: string
          intro_badge?: string
          intro_body?: string
          month_options?: Json
          monthly_price?: number
          original_price?: number
          overall_score?: number
          pros?: Json
          reviews?: Json
          scores?: Json
          slug: string
          subscription_types?: Json
          title: string
          updated_at?: string
          usage_guide?: Json
          usage_title?: string
        }
        Update: {
          big_headline?: string
          big_sub?: string
          cons?: Json
          created_at?: string
          description?: string
          feature_grid?: Json
          features?: Json
          highlights?: Json
          how_it_works?: Json
          how_it_works_title?: string
          id?: string
          intro_badge?: string
          intro_body?: string
          month_options?: Json
          monthly_price?: number
          original_price?: number
          overall_score?: number
          pros?: Json
          reviews?: Json
          scores?: Json
          slug?: string
          subscription_types?: Json
          title?: string
          updated_at?: string
          usage_guide?: Json
          usage_title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      store_products: {
        Row: {
          badge: string
          category: string
          color: string
          cost: number
          created_at: string
          delivery_method: string
          delivery_rules: string
          detail_description: string
          id: string
          image_url: string
          original_price: number
          price: number
          slug: string
          status: string
          stock: number
          subtitle: string
          title: string
          updated_at: string
        }
        Insert: {
          badge?: string
          category?: string
          color?: string
          cost?: number
          created_at?: string
          delivery_method?: string
          delivery_rules?: string
          detail_description?: string
          id?: string
          image_url?: string
          original_price?: number
          price?: number
          slug: string
          status?: string
          stock?: number
          subtitle?: string
          title: string
          updated_at?: string
        }
        Update: {
          badge?: string
          category?: string
          color?: string
          cost?: number
          created_at?: string
          delivery_method?: string
          delivery_rules?: string
          detail_description?: string
          id?: string
          image_url?: string
          original_price?: number
          price?: number
          slug?: string
          status?: string
          stock?: number
          subtitle?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscription_type_templates: {
        Row: {
          created_at: string
          id: string
          name: string
          types: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          types?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          types?: Json
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
