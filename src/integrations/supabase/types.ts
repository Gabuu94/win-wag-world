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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_game_markets: {
        Row: {
          created_at: string
          game_id: string
          id: string
          is_active: boolean
          market_name: string
          market_type: string
          result: string | null
          selections: Json
        }
        Insert: {
          created_at?: string
          game_id: string
          id?: string
          is_active?: boolean
          market_name: string
          market_type: string
          result?: string | null
          selections?: Json
        }
        Update: {
          created_at?: string
          game_id?: string
          id?: string
          is_active?: boolean
          market_name?: string
          market_type?: string
          result?: string | null
          selections?: Json
        }
        Relationships: [
          {
            foreignKeyName: "admin_game_markets_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "admin_games"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_games: {
        Row: {
          away_team: string
          created_at: string
          current_minute: number | null
          current_period: string | null
          end_time: string | null
          extra_time_result_away: number | null
          extra_time_result_home: number | null
          half_time_away: number | null
          half_time_home: number | null
          has_extra_time: boolean | null
          has_penalties: boolean | null
          home_team: string
          id: string
          is_published: boolean
          league: string | null
          penalty_away: number | null
          penalty_home: number | null
          quarters_scores: Json | null
          result_away: number | null
          result_home: number | null
          sport: string
          start_time: string
          status: string
          total_cards_away: number | null
          total_cards_home: number | null
          total_corners_away: number | null
          total_corners_home: number | null
          updated_at: string
        }
        Insert: {
          away_team: string
          created_at?: string
          current_minute?: number | null
          current_period?: string | null
          end_time?: string | null
          extra_time_result_away?: number | null
          extra_time_result_home?: number | null
          half_time_away?: number | null
          half_time_home?: number | null
          has_extra_time?: boolean | null
          has_penalties?: boolean | null
          home_team: string
          id?: string
          is_published?: boolean
          league?: string | null
          penalty_away?: number | null
          penalty_home?: number | null
          quarters_scores?: Json | null
          result_away?: number | null
          result_home?: number | null
          sport?: string
          start_time: string
          status?: string
          total_cards_away?: number | null
          total_cards_home?: number | null
          total_corners_away?: number | null
          total_corners_home?: number | null
          updated_at?: string
        }
        Update: {
          away_team?: string
          created_at?: string
          current_minute?: number | null
          current_period?: string | null
          end_time?: string | null
          extra_time_result_away?: number | null
          extra_time_result_home?: number | null
          half_time_away?: number | null
          half_time_home?: number | null
          has_extra_time?: boolean | null
          has_penalties?: boolean | null
          home_team?: string
          id?: string
          is_published?: boolean
          league?: string | null
          penalty_away?: number | null
          penalty_home?: number | null
          quarters_scores?: Json | null
          result_away?: number | null
          result_home?: number | null
          sport?: string
          start_time?: string
          status?: string
          total_cards_away?: number | null
          total_cards_home?: number | null
          total_corners_away?: number | null
          total_corners_home?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      bets: {
        Row: {
          id: string
          placed_at: string
          potential_win: number
          selections: Json
          stake: number
          status: string
          total_odds: number
          user_id: string
        }
        Insert: {
          id?: string
          placed_at?: string
          potential_win: number
          selections: Json
          stake: number
          status?: string
          total_odds: number
          user_id: string
        }
        Update: {
          id?: string
          placed_at?: string
          potential_win?: number
          selections?: Json
          stake?: number
          status?: string
          total_odds?: number
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          balance: number
          country: string | null
          created_at: string
          currency: string | null
          id: string
          phone: string | null
          referral_code: string | null
          total_wagered: number
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          balance?: number
          country?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          phone?: string | null
          referral_code?: string | null
          total_wagered?: number
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          balance?: number
          country?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          phone?: string | null
          referral_code?: string | null
          total_wagered?: number
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      promotions: {
        Row: {
          active: boolean
          bonus_type: string
          bonus_value: number
          created_at: string
          description: string
          end_date: string | null
          id: string
          image_url: string | null
          min_deposit: number | null
          start_date: string
          title: string
        }
        Insert: {
          active?: boolean
          bonus_type?: string
          bonus_value?: number
          created_at?: string
          description: string
          end_date?: string | null
          id?: string
          image_url?: string | null
          min_deposit?: number | null
          start_date?: string
          title: string
        }
        Update: {
          active?: boolean
          bonus_type?: string
          bonus_value?: number
          created_at?: string
          description?: string
          end_date?: string | null
          id?: string
          image_url?: string | null
          min_deposit?: number | null
          start_date?: string
          title?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          bonus_amount: number
          created_at: string
          id: string
          referral_code: string
          referred_id: string
          referrer_id: string
          status: string
        }
        Insert: {
          bonus_amount?: number
          created_at?: string
          id?: string
          referral_code: string
          referred_id: string
          referrer_id: string
          status?: string
        }
        Update: {
          bonus_amount?: number
          created_at?: string
          id?: string
          referral_code?: string
          referred_id?: string
          referrer_id?: string
          status?: string
        }
        Relationships: []
      }
      support_conversations: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          created_at: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          attachment_url: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          sender_role: string
          user_id: string
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          sender_role?: string
          user_id: string
        }
        Update: {
          attachment_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          sender_role?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          metadata: Json | null
          method: string
          reference: string | null
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          metadata?: Json | null
          method: string
          reference?: string | null
          status?: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          metadata?: Json | null
          method?: string
          reference?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
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
      verification_documents: {
        Row: {
          doc_type: string
          file_url: string | null
          id: string
          reviewed_at: string | null
          status: string
          submitted_at: string
          user_id: string
        }
        Insert: {
          doc_type: string
          file_url?: string | null
          id?: string
          reviewed_at?: string | null
          status?: string
          submitted_at?: string
          user_id: string
        }
        Update: {
          doc_type?: string
          file_url?: string | null
          id?: string
          reviewed_at?: string | null
          status?: string
          submitted_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vip_tiers: {
        Row: {
          bonus_multiplier: number
          cashback_rate: number
          color: string
          icon: string
          id: number
          min_wagered: number
          name: string
        }
        Insert: {
          bonus_multiplier?: number
          cashback_rate?: number
          color?: string
          icon?: string
          id?: number
          min_wagered?: number
          name: string
        }
        Update: {
          bonus_multiplier?: number
          cashback_rate?: number
          color?: string
          icon?: string
          id?: number
          min_wagered?: number
          name?: string
        }
        Relationships: []
      }
      voucher_redemptions: {
        Row: {
          amount: number
          id: string
          redeemed_at: string
          user_id: string
          voucher_id: string
        }
        Insert: {
          amount: number
          id?: string
          redeemed_at?: string
          user_id: string
          voucher_id: string
        }
        Update: {
          amount?: number
          id?: string
          redeemed_at?: string
          user_id?: string
          voucher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voucher_redemptions_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      vouchers: {
        Row: {
          active: boolean
          amount: number
          code: string
          created_at: string
          current_uses: number
          expires_at: string | null
          id: string
          max_uses: number
        }
        Insert: {
          active?: boolean
          amount: number
          code: string
          created_at?: string
          current_uses?: number
          expires_at?: string | null
          id?: string
          max_uses?: number
        }
        Update: {
          active?: boolean
          amount?: number
          code?: string
          created_at?: string
          current_uses?: number
          expires_at?: string | null
          id?: string
          max_uses?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_vip_tier: {
        Args: { p_user_id: string }
        Returns: {
          bonus_multiplier: number
          cashback_rate: number
          next_tier_min: number
          next_tier_name: string
          tier_color: string
          tier_icon: string
          tier_name: string
          total_wagered: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      redeem_voucher: {
        Args: { p_code: string; p_user_id: string }
        Returns: {
          amount: number
          message: string
          success: boolean
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
